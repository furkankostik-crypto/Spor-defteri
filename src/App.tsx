import React, { useEffect } from 'react';
import { useWorkout } from './context/WorkoutContext';
import { Navbar } from './components/layout/Navbar';
import { WorkoutView } from './components/workout/WorkoutView';
import { ProgressView } from './components/stats/ProgressView';
import { ToastContainer } from './components/common/Toast';
import { Confetti } from './components/common/Confetti';
import { AuthModal } from './components/auth/AuthModal';
import { InstallPrompt } from './components/common/InstallPrompt';
import { AthleteProfileModal } from './components/common/AthleteProfileModal';
import { AICoachModal } from './components/stats/AICoachModal';

export const App: React.FC = () => {
  const { activeTab, isLoggingWorkout } = useWorkout();

  useEffect(() => {
    if (isLoggingWorkout) {
      document.body.classList.add('logging-active');
    } else {
      document.body.classList.remove('logging-active');
    }
    return () => {
      document.body.classList.remove('logging-active');
    };
  }, [isLoggingWorkout]);

  // Varsayılan tam ekran modu (Yalnızca PWA / Yüklü Uygulama İçin - Native App Deneyimi)
  useEffect(() => {
    // 1. Standalone / Fullscreen display mode (Android PWA, Desktop PWA, Chrome/Edge kurulu app)
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches;

    // 2. iOS Ana Ekran kısayolu
    const isIosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    // 3. Android TWA / WebAPK
    const isAndroidApp = document.referrer.includes('android-app://');

    // 4. Manifest start_url query parametresi (?source=pwa)
    const isPwaSource = window.location.search.includes('source=pwa') || sessionStorage.getItem('spor_pwa_launched') === 'true';
    if (isPwaSource) {
      try {
        sessionStorage.setItem('spor_pwa_launched', 'true');
      } catch {
        // sessizce geç
      }
    }

    const isInstalledApp = Boolean(isStandaloneMode || isIosStandalone || isAndroidApp || isPwaSource);

    // Site üzerinden tarayıcı sekmesinde deneyen kullanıcılar için tam ekran tetiklenmez
    if (!isInstalledApp) {
      return;
    }

    const checkIsFullscreen = () => Boolean(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    const requestFullscreen = async () => {
      try {
        const docEl = document.documentElement as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>;
          mozRequestFullScreen?: () => Promise<void>;
          msRequestFullscreen?: () => Promise<void>;
        };

        if (!checkIsFullscreen()) {
          if (docEl.requestFullscreen) {
            await docEl.requestFullscreen();
          } else if (docEl.webkitRequestFullscreen) {
            await docEl.webkitRequestFullscreen();
          } else if (docEl.mozRequestFullScreen) {
            await docEl.mozRequestFullScreen();
          } else if (docEl.msRequestFullscreen) {
            await docEl.msRequestFullscreen();
          }
        }

        // PWA Native Deneyimi: Klavyeden Escape ile tam ekrandan çıkılmasını engelle (Chrome/Edge PWA)
        if ('keyboard' in navigator && (navigator as any).keyboard?.lock) {
          (navigator as any).keyboard.lock(['Escape']).catch(() => {});
        }

        // Dikey ekran kilidi (Destekleyen mobil tarayıcılar için)
        if (screen.orientation && (screen.orientation as any).lock) {
          (screen.orientation as any).lock('portrait').catch(() => {});
        }
      } catch {
        // Tarayıcı güvenlik/kullanıcı etkileşimi kısıtlamaları için sessizce geç
      }
    };

    const handleInteraction = () => {
      if (!checkIsFullscreen()) {
        requestFullscreen();
      }
    };

    const handleFullscreenChange = () => {
      // Tam ekrandan çıkılmaya çalışılırsa ilk fırsatta derhal tam ekrana geri dön
      if (!checkIsFullscreen()) {
        requestFullscreen();
      }
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && !checkIsFullscreen()) {
        requestFullscreen();
      }
    };

    // 1. Uygulama açılır açılmaz tam ekranı başlatmayı dene
    requestFullscreen();

    // 2. Yüklü uygulama açık kaldığı sürece tam ekranı koru
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('click', handleInteraction, { passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  return (
    <>
      <main style={{ flex: 1 }}>
        {(activeTab === 'workout' || activeTab === 'history') && <WorkoutView />}
        {(activeTab === 'stats' || activeTab === 'levels') && <ProgressView />}
      </main>

      {!isLoggingWorkout && <Navbar />}
      <InstallPrompt />
      <ToastContainer />
      <Confetti />
      <AuthModal />
      <AthleteProfileModal />
      <AICoachModal />
    </>
  );
};
