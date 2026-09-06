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

  // Varsayılan tam ekran modu (Default Fullscreen)
  useEffect(() => {
    let hasUserExited = false;
    let hasEnteredOnce = false;

    const requestFullscreen = () => {
      if (hasUserExited) return;

      try {
        const docEl = document.documentElement as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>;
          mozRequestFullScreen?: () => Promise<void>;
          msRequestFullscreen?: () => Promise<void>;
        };

        const isFullscreen = Boolean(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        );

        if (!isFullscreen) {
          if (docEl.requestFullscreen) {
            docEl.requestFullscreen().catch(() => {});
          } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen().catch?.(() => {});
          } else if (docEl.mozRequestFullScreen) {
            docEl.mozRequestFullScreen().catch?.(() => {});
          } else if (docEl.msRequestFullscreen) {
            docEl.msRequestFullscreen().catch?.(() => {});
          }
        }
      } catch {
        // Tarayıcı kısıtlamaları veya desteklenmeyen cihazlar için sessizce geç
      }
    };

    // 1. Doğrudan tam ekranı başlatmayı dene
    requestFullscreen();

    // 2. Tarayıcı güvenlik kısıtlamaları gereği ilk etkileşimde (dokunma/tıklama) otomatik tam ekrana geçir
    const handleFullscreenChange = () => {
      const isFullscreen = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (isFullscreen) {
        hasEnteredOnce = true;
      } else if (hasEnteredOnce) {
        // Kullanıcı daha önce tam ekrana girdi ve sonrasında manuel çıktıysa (ör. ESC)
        hasUserExited = true;
      }
    };

    const handleInteraction = () => {
      if (!hasUserExited) {
        requestFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('click', handleInteraction, { passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
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
