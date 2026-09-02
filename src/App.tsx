import React, { useEffect } from 'react';
import { useWorkout } from './context/WorkoutContext';
import { Navbar } from './components/layout/Navbar';
import { WorkoutView } from './components/workout/WorkoutView';
import { ProgressView } from './components/stats/ProgressView';
import { ToastContainer } from './components/common/Toast';
import { Confetti } from './components/common/Confetti';
import { AuthModal } from './components/auth/AuthModal';
import { InstallPrompt } from './components/common/InstallPrompt';

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
    </>
  );
};
