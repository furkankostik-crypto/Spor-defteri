import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { WorkoutProvider } from './context/WorkoutContext';
import { PwaInstallProvider } from './context/PwaInstallContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <WorkoutProvider>
          <PwaInstallProvider>
            <App />
          </PwaInstallProvider>
        </WorkoutProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
