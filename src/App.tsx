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
        {(activeTab === 'workout' || isLoggingWorkout) && <WorkoutView />}
        {activeTab === 'history' && !isLoggingWorkout && <HistoryView />}
        {(activeTab === 'stats' || activeTab === 'levels') && !isLoggingWorkout && <ProgressView />}
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
