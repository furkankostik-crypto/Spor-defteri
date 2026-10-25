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
  const isRestoringSentinelRef = useRef(false);
  const lastBackActionTimeRef = useRef<number>(0);

  /**
   * SINGLE SENTINEL GUARD ARCHITECTURE (Chromium History Manipulation Compliant):
   * - Never spam 25+ history entries (which triggers Chromium's history intervention).
   * - Instead, maintain exactly ONE root entry (`__spor_root: true`) and ONE active
   *   sentinel guard entry (`__spor_guard: true`) ahead of it.
   * - Ensure the guard entry is armed synchronously during any real user interaction
   *   (`pointerdown`, `touchstart`, `click`, `keydown`) whenever we are not already on it.
   * - When the user presses the hardware/gesture Back button, the browser steps from
   *   `__spor_guard` back to `__spor_root`. We run our in-app back handler and immediately
   *   call `window.history.forward()` (or re-arm) to step right back onto `__spor_guard`!
   *   This recycles the existing user-activated history entry infinitely so the app never closes.
   */
  const armSentinelGuardOnGesture = useCallback(() => {
    if (isExitingRef.current || isRestoringSentinelRef.current) return;

    try {
      const currentState = window.history.state;

      // Already sitting on the active guard entry -> nothing to push!
      if (currentState && currentState.__spor_guard) {
        return;
      }

      // Mark current entry as root and push the single sentinel guard entry
      const baseState = currentState && typeof currentState === 'object' ? currentState : {};
      window.history.replaceState({ ...baseState, __spor_root: true, __spor_guard: false }, '');
      window.history.pushState({ __spor_guard: true, depth: 1 }, '');
    } catch {
      // Ignore History API errors in restricted environments
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

  // Core back button decision pipeline
  const handleBackNavigation = useCallback((): boolean => {
    const now = Date.now();
    // Guard against duplicate back events within 60ms (e.g. Navigation API + popstate)
    if (now - lastBackActionTimeRef.current < 60) {
      return true;
    }
    lastBackActionTimeRef.current = now;

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

    // 6. No tabs or modals left to go back to -> Show Exit Confirmation Modal (Option A)!
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

  // Keep latest ref to handleBackNavigation for event listeners
  const handleBackNavigationRef = useRef(handleBackNavigation);
  handleBackNavigationRef.current = handleBackNavigation;

  // Setup initial root state & user gesture listeners to arm the sentinel guard
  useEffect(() => {
    try {
      const currentState = window.history.state;
      if (!currentState || (!currentState.__spor_root && !currentState.__spor_guard)) {
        window.history.replaceState({ __spor_root: true, __spor_guard: false }, '');
      }
    } catch {
      // Ignore
    }

    const handleUserGesture = () => {
      if (isExitingRef.current) return;
      armSentinelGuardOnGesture();
    };

    // Capture phase on pointerdown/touchstart/click/keydown ensures the guard is armed
    // on the very first touch before the user can even press the back button.
    window.addEventListener('pointerdown', handleUserGesture, { capture: true, passive: true });
    window.addEventListener('touchstart', handleUserGesture, { capture: true, passive: true });
    window.addEventListener('click', handleUserGesture, { capture: true, passive: true });
    window.addEventListener('keydown', handleUserGesture, { capture: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleUserGesture, { capture: true });
      window.removeEventListener('touchstart', handleUserGesture, { capture: true });
      window.removeEventListener('click', handleUserGesture, { capture: true });
      window.removeEventListener('keydown', handleUserGesture, { capture: true });
    };
  }, [armSentinelGuardOnGesture]);

  // Listen to browser / hardware back button (`popstate` + Android WebView `backbutton`)
  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      // 1. If we are programmatic-restoring the sentinel via `history.forward()`, ignore this popstate
      if (isRestoringSentinelRef.current) {
        isRestoringSentinelRef.current = false;
        return;
      }

      const state = event.state;

      // 2. If user explicitly clicked "Evet, Uygulamadan Çık", keep unwinding history to exit
      if (isExitingRef.current) {
        if (state && (state.__spor_guard || state.__spor_root)) {
          try {
            window.close();
          } catch {}
          window.history.back();
        }
        return;
      }

      // 3. If popstate landed on the guard itself (e.g. forward movement), do nothing
      if (state && state.__spor_guard) {
        return;
      }

      // 4. User pressed hardware/gesture Back button and stepped off `__spor_guard` onto `__spor_root`!
      // Run in-app back navigation (close modal / switch tab / open ExitConfirmModal)
      handleBackNavigationRef.current();

      // 5. Immediately step forward back onto our existing user-activated `__spor_guard` entry!
      // Because `history.forward()` traverses to an already-existing entry created during a real user
      // gesture, Chromium never marks it as skippable and the back button trap never runs out!
      try {
        isRestoringSentinelRef.current = true;
        window.history.forward();
        // Safety fallback reset in case forward() is a no-op
        setTimeout(() => {
          isRestoringSentinelRef.current = false;
        }, 120);
      } catch {
        isRestoringSentinelRef.current = false;
      }
    };

    // Support native/hybrid Android WebView `backbutton` event if present
    const onNativeBackButton = (e: Event) => {
      if (isExitingRef.current) return;
      e.preventDefault();
      handleBackNavigationRef.current();
    };

    window.addEventListener('popstate', onPopState);
    document.addEventListener('backbutton', onNativeBackButton, false);

    return () => {
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('backbutton', onNativeBackButton, false);
    };
  }, []);

  const openExitModal = useCallback(() => {
    sounds.playPop();
    setIsExitModalOpen(true);
  }, []);

  const cancelExit = useCallback(() => {
    sounds.playPop();
    isExitingRef.current = false;
    setIsExitModalOpen(false);
    armSentinelGuardOnGesture();
  }, [armSentinelGuardOnGesture]);

  const confirmExit = useCallback(() => {
    sounds.playPop();
    isExitingRef.current = true;
    isRestoringSentinelRef.current = false;
    setIsExitModalOpen(false);

    // 1. Attempt native/PWA window close
    try {
      (navigator as any).app?.exitApp?.();
    } catch {}
    try {
      window.close();
    } catch {}

    // 2. Unwind browser history stack past our root & guard entries
    try {
      const stepsBack = window.history.state?.__spor_guard ? 2 : 1;
      window.history.go(-stepsBack);
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
