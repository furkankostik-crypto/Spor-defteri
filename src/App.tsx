import React, { useEffect } from 'react';
import { useWorkout } from './context/WorkoutContext';
import { Navbar } from './components/layout/Navbar';
import { WorkoutView } from './components/workout/WorkoutView';
import { HistoryView } from './components/history/HistoryView';
import { ProgressView } from './components/stats/ProgressView';
import { ToastContainer } from './components/common/Toast';
import { Confetti } from './components/common/Confetti';
import { AuthModal } from './components/auth/AuthModal';
import { InstallPrompt } from './components/common/InstallPrompt';
import { AthleteProfileModal } from './components/common/AthleteProfileModal';
import { AICoachModal } from './components/stats/AICoachModal';
import { ActiveWorkoutFloatingBanner } from './components/workout/ActiveWorkoutFloatingBanner';
import { ExitConfirmModal } from './components/common/ExitConfirmModal';

export const App: React.FC = () => {
  const { activeTab, isLoggingWorkout, isWorkoutMinimized } = useWorkout();

  const isFullscreenLogging = isLoggingWorkout && !isWorkoutMinimized && activeTab === 'workout';

  useEffect(() => {
    if (isFullscreenLogging) {
      document.body.classList.add('logging-active');
    } else {
      document.body.classList.remove('logging-active');
    }
    return () => {
      document.body.classList.remove('logging-active');
    };
  }, [isFullscreenLogging]);

  // Mobil cihazlarda dikey (portrait) yönlendirme kilidi (destekleyen tarayıcılarda)
  useEffect(() => {
    try {
      if (screen.orientation && (screen.orientation as any).lock) {
        (screen.orientation as any).lock('portrait').catch(() => {});
      }
    } catch {
      // sessizce geç
    }
  }, []);

  return (
    <>
      <main style={{ flex: 1 }}>
        {activeTab === 'workout' && <WorkoutView />}
        {activeTab === 'history' && <HistoryView />}
        {(activeTab === 'stats' || activeTab === 'levels') && <ProgressView />}
      </main>

      <ActiveWorkoutFloatingBanner />
      {!isFullscreenLogging && <Navbar />}
      <InstallPrompt />
      <ToastContainer />
      <Confetti />
      <AuthModal />
      <AthleteProfileModal />
      <AICoachModal />
      <ExitConfirmModal />
    </>
  );
};
