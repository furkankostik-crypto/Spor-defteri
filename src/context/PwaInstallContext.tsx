import React, { createContext, useContext, useState, useEffect } from 'react';
import { sounds } from '../utils/audio';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaInstallContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  showBanner: boolean;
  showModal: boolean;
  setShowBanner: (show: boolean) => void;
  setShowModal: (show: boolean) => void;
  promptInstall: () => Promise<void>;
  dismissBanner: () => void;
}

const PwaInstallContext = createContext<PwaInstallContextType | undefined>(undefined);

const DISMISS_KEY = 'spor_pwa_install_dismissed_until';
const COOLDOWN_DAYS = 3;

export const PwaInstallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Standalone / PWA kontrolü
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // iOS kontrolü
    const ua = window.navigator.userAgent;
    const isAppleDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isAppleDevice);

    // Kapatma süresi kontrolü
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    const isCurrentlyDismissed = dismissedUntil ? Date.now() < parseInt(dismissedUntil, 10) : false;

    // beforeinstallprompt dinleyici (Android & Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      if (!isCurrentlyDismissed) {
        // Kullanıcı arayüzü oturduktan 2.5 saniye sonra nazikçe göster
        setTimeout(() => {
          setShowBanner(true);
        }, 2500);
      }
    };

    // appinstalled dinleyici
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setShowModal(false);
      setDeferredPrompt(null);
      sounds.playSuccess();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // iOS Safari için gecikmeli bildirim (eğer daha önce kapatılmadıysa)
    if (isAppleDevice && !isCurrentlyDismissed) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    sounds.playPop();
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          sounds.playSuccess();
          setIsInstalled(true);
          setShowBanner(false);
          setShowModal(false);
        }
        setDeferredPrompt(null);
      } catch {
        setShowModal(true);
      }
    } else {
      // Doğrudan browser prompt'u yoksa (örneğin iOS veya Safari) görsel rehber modalını aç
      setShowModal(true);
    }
  };

  const dismissBanner = () => {
    sounds.playPop();
    setShowBanner(false);
    const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, (Date.now() + cooldownMs).toString());
  };

  return (
    <PwaInstallContext.Provider
      value={{
        isInstallable: !!deferredPrompt || isIOS,
        isInstalled,
        isIOS,
        showBanner,
        showModal,
        setShowBanner,
        setShowModal,
        promptInstall,
        dismissBanner
      }}
    >
      {children}
    </PwaInstallContext.Provider>
  );
};

export const usePwaInstall = () => {
  const context = useContext(PwaInstallContext);
  if (!context) {
    throw new Error('usePwaInstall must be used within a PwaInstallProvider');
  }
  return context;
};
