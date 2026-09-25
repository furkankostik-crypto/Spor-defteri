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
  exitModalPulse: number;
  openExitModal: () => void;
  cancelExit: () => void;
  confirmExit: () => void;
  registerBackHandler: (handler: () => boolean, priority?: number) => () => void;
}

const BackNavigationContext = createContext<BackNavigationContextType | undefined>(undefined);

let nextHandlerId = 1;
const MAX_GUARD_DEPTH = 25;

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
  const [exitModalPulse, setExitModalPulse] = useState(0);

  // Stack of visited tabs (starts at 'workout')
  const tabHistoryRef = useRef<TabType[]>(['workout']);
  const isBackNavigatingTabRef = useRef(false);
  const isExitingRef = useRef(false);
  const handlersRef = useRef<BackHandlerEntry[]>([]);
  const lastGesturePushTimeRef = useRef<number>(0);

  /**
   * IMPORTANT CHROMIUM HISTORY INTERVENTION RULE:
   * Never call `history.pushState` on mount, in `useEffect`, or inside `popstate`!
   * Calling `pushState` without an active user gesture causes Chromium to mark
   * the current NavigationEntry with `should_skip_on_back_forward_ui = true`,
   * which makes the browser skip all entries and close the app on the next back press.
   *
   * Instead, ONLY call `pushState` synchronously inside real user gesture events
   * (`click`, `touchend`, `keydown`), at most once per gesture.
   */
  const pushGuardOnUserGesture = useCallback(() => {
    if (isExitingRef.current) return;

    const now = Date.now();
    if (now - lastGesturePushTimeRef.current < 180) {
      return;
    }

    try {
      const currentState = window.history.state;
      const currentDepth = typeof currentState?.depth === 'number' ? currentState.depth : 0;

      if (!currentState || (!currentState.__spor_root && !currentState.__spor_active)) {
        window.history.replaceState({ __spor_root: true, depth: 0 }, '');
        window.history.pushState({ __spor_active: true, depth: 1 }, '');
        lastGesturePushTimeRef.current = now;
      } else if (currentDepth < MAX_GUARD_DEPTH) {
        window.history.pushState({ __spor_active: true, depth: currentDepth + 1 }, '');
        lastGesturePushTimeRef.current = now;
      }
    } catch {
      // Ignore History API errors
    }
  }, []);

  // Register custom back handler (higher priority runs first; LIFO for equal priority)
  const registerBackHandler = useCallback((handler: () => boolean, priority = 50) => {
    const id = nextHandlerId++;
    handlersRef.current.push({ id, priority, handler });
    return () => {
      handlersRef.current = handlersRef.current.filter(item => item.id !== id);
    };
  }, []);

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
    }
  }, [activeTab]);

  // On mount: ONLY tag the initial root entry with replaceState (never pushState without gesture)
  // On real user gestures (click / touchend / keydown in capture phase): push 1 non-skippable guard entry
  useEffect(() => {
    try {
      const currentState = window.history.state;
      if (!currentState || (!currentState.__spor_root && !currentState.__spor_active)) {
        window.history.replaceState({ __spor_root: true, depth: 0 }, '');
      }
    } catch {
      // Ignore
    }

    const handleUserGesture = () => {
      if (isExitingRef.current) {
        isExitingRef.current = false;
      }
      pushGuardOnUserGesture();
    };

    // Capture phase ensures we receive every tap/click even if a child calls stopPropagation()
    window.addEventListener('click', handleUserGesture, { capture: true, passive: true });
    window.addEventListener('touchend', handleUserGesture, { capture: true, passive: true });
    window.addEventListener('keydown', handleUserGesture, { capture: true, passive: true });

    return () => {
      window.removeEventListener('click', handleUserGesture, { capture: true });
      window.removeEventListener('touchend', handleUserGesture, { capture: true });
      window.removeEventListener('keydown', handleUserGesture, { capture: true });
    };
  }, [pushGuardOnUserGesture]);

  // Core back button decision pipeline
  const handleBackNavigation = useCallback((): boolean => {
    // 1. If Exit Confirmation Modal is ALREADY open, DO NOT close the app or dismiss the modal!
    // Keep the modal on screen and pulse it so the user must explicitly choose on screen.
    if (isExitModalOpen) {
      sounds.playPop();
      setExitModalPulse(prev => prev + 1);
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

    // 6. No tabs or modals left to go back to -> Show Exit Confirmation Modal!
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
        // User explicitly confirmed exit on screen: keep stepping back past all app entries
        const state = event.state;
        if (state && (state.__spor_active || state.__spor_root)) {
          try {
            window.close();
          } catch {}
          window.history.back();
        }
        return;
      }

      // Run in-app back navigation or show exit confirmation modal
      // NOTE: Do NOT call history.pushState here inside popstate!
      handleBackNavigation();
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [handleBackNavigation]);

  const openExitModal = useCallback(() => {
    sounds.playPop();
    setIsExitModalOpen(true);
  }, []);

  const cancelExit = useCallback(() => {
    sounds.playPop();
    isExitingRef.current = false;
    setIsExitModalOpen(false);
    pushGuardOnUserGesture();
  }, [pushGuardOnUserGesture]);

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
          title: 'Çıkış Onaylandı',
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
        exitModalPulse,
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
