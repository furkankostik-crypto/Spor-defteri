import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useWorkout } from './WorkoutContext';
import { useAuth } from './AuthContext';
import { TabType } from '../types/workout';
import { sounds } from '../utils/audio';

interface BackHandlerEntry {
  id: number;
  priority: number;
  handler: () => boolean;
}

interface BackNavigationContextType {
  isExitModalOpen: boolean;
  openExitModal: () => void;
  cancelExit: () => void;
  confirmExit: () => void;
  registerBackHandler: (handler: () => boolean, priority?: number) => () => void;
}

const BackNavigationContext = createContext<BackNavigationContextType | undefined>(undefined);

let nextHandlerId = 1;

export const BackNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    activeTab,
    setActiveTab,
    isLoggingWorkout,
    isWorkoutMinimized,
    setIsWorkoutMinimized,
    isProfileModalOpen,
    setIsProfileModalOpen,
    isAICoachOpen,
    setIsAICoachOpen,
    showToast
  } = useWorkout();

  const { isAuthModalOpen, setIsAuthModalOpen } = useAuth();

  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  // Stack of visited tabs (starts at 'workout')
  const tabHistoryRef = useRef<TabType[]>(['workout']);
  const isBackNavigatingTabRef = useRef(false);
  const isExitingRef = useRef(false);
  const handlersRef = useRef<BackHandlerEntry[]>([]);

  // Helper to push a guarded active history entry safely
  const pushActiveHistoryEntry = useCallback(() => {
    if (isExitingRef.current) return;
    try {
      const currentState = window.history.state;
      const currentDepth = typeof currentState?.depth === 'number' ? currentState.depth : 0;

      if (!currentState || (!currentState.__spor_root && !currentState.__spor_active)) {
        window.history.replaceState({ __spor_root: true, depth: 0 }, '');
        window.history.pushState({ __spor_active: true, depth: 1 }, '');
      } else if (currentState.__spor_root || currentDepth === 0) {
        window.history.pushState({ __spor_active: true, depth: 1 }, '');
      } else if (currentDepth < 5) {
        window.history.pushState({ __spor_active: true, depth: currentDepth + 1 }, '');
      } else {
        window.history.replaceState({ __spor_active: true, depth: currentDepth, ts: Date.now() }, '');
      }
    } catch {
      // Ignore history API errors in restricted environments
    }
  }, []);

  // Ensure at least depth 1 is active in browser history
  const ensureMinimumActiveGuard = useCallback(() => {
    if (isExitingRef.current) return;
    try {
      const currentState = window.history.state;
      if (!currentState || (!currentState.__spor_root && !currentState.__spor_active)) {
        window.history.replaceState({ __spor_root: true, depth: 0 }, '');
        window.history.pushState({ __spor_active: true, depth: 1 }, '');
      } else if (currentState.__spor_root || !currentState.depth || currentState.depth < 1) {
        window.history.pushState({ __spor_active: true, depth: 1 }, '');
      }
    } catch {
      // Ignore
    }
  }, []);

  // Register custom back handler (higher priority runs first; LIFO for equal priority)
  const registerBackHandler = useCallback((handler: () => boolean, priority = 50) => {
    const id = nextHandlerId++;
    handlersRef.current.push({ id, priority, handler });
    if (priority < 100) {
      pushActiveHistoryEntry();
    }
    return () => {
      handlersRef.current = handlersRef.current.filter(item => item.id !== id);
    };
  }, [pushActiveHistoryEntry]);

  // Track tab navigation history when activeTab changes
  useEffect(() => {
    if (isBackNavigatingTabRef.current) {
      isBackNavigatingTabRef.current = false;
      return;
    }

    const history = tabHistoryRef.current;
    const currentTop = history[history.length - 1];

    if (activeTab !== currentTop) {
      if (activeTab === 'workout') {
        tabHistoryRef.current = ['workout'];
      } else {
        const filtered = history.filter(t => t !== activeTab);
        tabHistoryRef.current = [...filtered, activeTab];
      }
      pushActiveHistoryEntry();
    }
  }, [activeTab, pushActiveHistoryEntry]);

  // Also push history entry when global modals or fullscreen workout logger opens
  const isFullscreenLogging = isLoggingWorkout && !isWorkoutMinimized && activeTab === 'workout';
  useEffect(() => {
    if (isAuthModalOpen || isProfileModalOpen || isAICoachOpen || isFullscreenLogging) {
      pushActiveHistoryEntry();
    }
  }, [isAuthModalOpen, isProfileModalOpen, isAICoachOpen, isFullscreenLogging, pushActiveHistoryEntry]);

  // Initialize history guard on mount & refresh user activation on first interaction
  useEffect(() => {
    ensureMinimumActiveGuard();

    const handleUserInteraction = () => {
      if (isExitingRef.current) {
        isExitingRef.current = false;
      }
      ensureMinimumActiveGuard();
    };

    window.addEventListener('pointerdown', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [ensureMinimumActiveGuard]);

  // Core back button decision pipeline
  const handleBackNavigation = useCallback((): boolean => {
    // 1. If Exit Confirmation Modal is already open, pressing back closes it and keeps user in app
    if (isExitModalOpen) {
      sounds.playPop();
      setIsExitModalOpen(false);
      return true;
    }

    // 2. Check registered component back handlers (sorted by highest priority, then most recent)
    if (handlersRef.current.length > 0) {
      const sorted = [...handlersRef.current].sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return b.id - a.id;
      });

      for (const entry of sorted) {
        if (entry.handler()) {
          return true;
        }
      }
    }

    // 3. Check global context modals
    if (isAuthModalOpen) {
      sounds.playPop();
      setIsAuthModalOpen(false);
      return true;
    }

    if (isProfileModalOpen) {
      sounds.playPop();
      setIsProfileModalOpen(false);
      return true;
    }

    if (isAICoachOpen) {
      sounds.playPop();
      setIsAICoachOpen(false);
      return true;
    }

    // 4. If user is in fullscreen workout logger, minimize to Workout Hub instead of closing app
    if (isLoggingWorkout && !isWorkoutMinimized && activeTab === 'workout') {
      sounds.playPop();
      setIsWorkoutMinimized(true);
      return true;
    }

    // 5. Navigate back through previous tabs if any exist in tabHistory
    if (tabHistoryRef.current.length > 1) {
      sounds.playPop();
      const nextHistory = [...tabHistoryRef.current];
      nextHistory.pop(); // remove current tab
      const previousTab = nextHistory[nextHistory.length - 1] || 'workout';
      tabHistoryRef.current = nextHistory;
      isBackNavigatingTabRef.current = true;
      setActiveTab(previousTab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }

    // Fallback if somehow on a non-workout tab with empty stack
    if (activeTab !== 'workout') {
      sounds.playPop();
      tabHistoryRef.current = ['workout'];
      isBackNavigatingTabRef.current = true;
      setActiveTab('workout');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }

    // 6. No tabs or modals left to go back to -> Ask user if they really want to exit the app!
    sounds.playPop();
    setIsExitModalOpen(true);
    return true;
  }, [
    isExitModalOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isProfileModalOpen,
    setIsProfileModalOpen,
    isAICoachOpen,
    setIsAICoachOpen,
    isLoggingWorkout,
    isWorkoutMinimized,
    setIsWorkoutMinimized,
    activeTab,
    setActiveTab
  ]);

  // Listen to browser / hardware back button (popstate)
  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      if (isExitingRef.current) {
        // User confirmed exit: keep stepping back if still on app guard entries
        const state = event.state;
        if (state && (state.__spor_active || state.__spor_root)) {
          try {
            window.close();
          } catch {}
          window.history.back();
        }
        return;
      }

      // Always re-arm the history guard so the app is never closed without confirmation
      ensureMinimumActiveGuard();

      // Run in-app back navigation or show exit confirmation modal
      handleBackNavigation();
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [handleBackNavigation, ensureMinimumActiveGuard]);

  const openExitModal = useCallback(() => {
    sounds.playPop();
    setIsExitModalOpen(true);
  }, []);

  const cancelExit = useCallback(() => {
    sounds.playPop();
    isExitingRef.current = false;
    setIsExitModalOpen(false);
    pushActiveHistoryEntry();
  }, [pushActiveHistoryEntry]);

  const confirmExit = useCallback(() => {
    sounds.playPop();
    isExitingRef.current = true;
    setIsExitModalOpen(false);

    // 1. Attempt native/PWA window close
    try {
      (navigator as any).app?.exitApp?.();
    } catch {}
    try {
      window.close();
    } catch {}

    // 2. Unwind browser history stack past our app entries
    try {
      const currentDepth = typeof window.history.state?.depth === 'number' ? window.history.state.depth : 1;
      const stepsBack = currentDepth + 1;
      if (window.history.length > stepsBack) {
        window.history.go(-stepsBack);
      } else if (currentDepth > 0) {
        window.history.go(-currentDepth);
      } else {
        window.history.back();
      }
    } catch {
      window.history.back();
    }

    // 3. Fallback for standalone PWAs where OS requires hardware back/home press at root index
    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        showToast({
          title: 'Çıkış Hazır',
          description: 'Uygulamayı kapatmak için telefonunuzun geri veya ana ekran tuşuna dokunabilirsiniz.',
          type: 'info'
        });
      }
    }, 300);
  }, [showToast]);

  return (
    <BackNavigationContext.Provider
      value={{
        isExitModalOpen,
        openExitModal,
        cancelExit,
        confirmExit,
        registerBackHandler
      }}
    >
      {children}
    </BackNavigationContext.Provider>
  );
};

export const useBackNavigation = () => {
  const context = useContext(BackNavigationContext);
  if (!context) {
    throw new Error('useBackNavigation must be used within a BackNavigationProvider');
  }
  return context;
};

/**
 * Hook for modals, drawers, and sub-views to intercept the phone's back button when active.
 */
export const useBackButton = (
  isActive: boolean,
  onBack: () => void,
  priority = 60
) => {
  const context = useContext(BackNavigationContext);
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!isActive || !context) return;

    const unregister = context.registerBackHandler(() => {
      onBackRef.current();
      return true;
    }, priority);

    return unregister;
  }, [isActive, priority, context]);
};
