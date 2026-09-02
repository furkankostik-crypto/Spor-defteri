import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  Workout, 
  ExerciseDefinition, 
  SplitType, 
  TabType, 
  ExerciseSet,
  OverallPlayerStats
} from '../types/workout';
import { defaultExercises } from '../data/defaultExercises';
import { getTodayLocalDate } from '../utils/dateUtils';
import { calculateOverallPlayerStats, calculateExerciseLevelInfo } from '../utils/calculations';
import { sounds } from '../utils/audio';
import { generateTwoYearWorkouts } from '../data/mockWorkouts';
import { useAuth } from './AuthContext';
import { saveCloudWorkouts, performFullSync } from '../services/workoutSync';
import { mergeWorkoutsByDate, mergeSavedExerciseLists, determineSplitType } from '../utils/workoutMerge';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'pr' | 'level' | 'info' | 'error';
}

export interface WorkoutDraft {
  date: string;
  splitType: SplitType;
  // Map exerciseId -> array of sets
  exerciseSets: Record<string, ExerciseSet[]>;
}

export interface SyncCloudOptions {
  isManual?: boolean;
  forceWrite?: boolean;
  silent?: boolean;
}

interface WorkoutContextType {
  workouts: Workout[];
  customExercises: ExerciseDefinition[];
  allExercises: ExerciseDefinition[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  draft: WorkoutDraft;
  updateDraftDate: (date: string) => void;
  updateDraftSplit: (split: SplitType) => void;
  updateDraftSet: (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: number) => void;
  addDraftSet: (exerciseId: string) => void;
  removeDraftSet: (exerciseId: string, setIndex: number) => void;
  clearDraftExercise: (exerciseId: string) => void;
  saveWorkout: () => { success: boolean; isPR: boolean; newPRs: string[] };
  updateWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;
  addCustomExercise: (name: string, muscle: any, category: any) => ExerciseDefinition;
  deleteCustomExercise: (id: string) => void;
  overallStats: OverallPlayerStats;
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  triggerConfetti: () => void;
  confettiTrigger: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  isLoggingWorkout: boolean;
  setIsLoggingWorkout: (isLogging: boolean) => void;
  importAllData: (workouts: Workout[], custom: ExerciseDefinition[]) => void;
  resetAllData: () => void;
  populateSampleData: () => void;
  syncWithCloud: (options?: SyncCloudOptions) => Promise<void>;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

const STORAGE_WORKOUTS_KEY = 'myWorkouts_v2';
const STORAGE_LEGACY_KEY = 'myWorkouts';
const STORAGE_CUSTOM_EXERCISES_KEY = 'myCustomExercises';
const STORAGE_SOUND_KEY = 'spor_sound_enabled';

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isConfigured, updateSyncState, syncSettings } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('workout');
  const [isLoggingWorkout, setIsLoggingWorkout] = useState<boolean>(false);
  
  const [customExercises, setCustomExercises] = useState<ExerciseDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_EXERCISES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Workouts state with legacy migration support
  const [workouts, setWorkouts] = useState<Workout[]>(() => {
    try {
      const v2Data = localStorage.getItem(STORAGE_WORKOUTS_KEY);
      if (v2Data !== null) {
        const parsed = JSON.parse(v2Data);
        if (Array.isArray(parsed)) {
          return mergeWorkoutsByDate(parsed);
        }
      }

      // Check legacy format
      const legacyData = localStorage.getItem(STORAGE_LEGACY_KEY);
      if (legacyData !== null) {
        const parsed = JSON.parse(legacyData);
        if (Array.isArray(parsed)) {
          const migrated: Workout[] = parsed.map((item, idx) => ({
            id: `legacy-${Date.now()}-${idx}`,
            date: item.date || getTodayLocalDate(),
            type: item.type || 'Antrenman',
            splitType: item.type === 'Üst Vücut' ? 'upper' : (item.type === 'Alt Vücut' ? 'lower' : 'custom'),
            exercises: item.exercises || [],
            createdAt: Date.now() - idx * 1000
          }));
          const merged = mergeWorkoutsByDate(migrated);
          localStorage.setItem(STORAGE_WORKOUTS_KEY, JSON.stringify(merged));
          return merged;
        }
      }
      
      // Clean start for production: Users can load sample data via the 1-click button anytime.
      localStorage.setItem(STORAGE_WORKOUTS_KEY, JSON.stringify([]));
      return [];
    } catch {
      return [];
    }
  });

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_SOUND_KEY);
    return saved !== null ? saved === 'true' : true;
  });

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    sounds.enabled = enabled;
    localStorage.setItem(STORAGE_SOUND_KEY, String(enabled));
  };

  useEffect(() => {
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  // Combine default + custom exercises
  const allExercises: ExerciseDefinition[] = [...defaultExercises, ...customExercises];

  // Save workouts to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_WORKOUTS_KEY, JSON.stringify(workouts));
  }, [workouts]);

  // Save custom exercises to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_CUSTOM_EXERCISES_KEY, JSON.stringify(customExercises));
  }, [customExercises]);

  // Active workout draft
  const [draft, setDraft] = useState<WorkoutDraft>(() => {
    return {
      date: getTodayLocalDate(),
      splitType: 'upper',
      exerciseSets: {}
    };
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Confetti trigger
  const [confettiTrigger, setConfettiTrigger] = useState<number>(0);
  const triggerConfetti = useCallback(() => {
    setConfettiTrigger(Date.now());
  }, []);

  // Clear all sets for a specific exercise in draft
  const clearDraftExercise = (exerciseId: string) => {
    sounds.playPop();
    setDraft(prev => {
      const nextSets = { ...prev.exerciseSets };
      delete nextSets[exerciseId];
      return {
        ...prev,
        exerciseSets: nextSets
      };
    });
  };

  // Draft handlers
  const updateDraftDate = (date: string) => {
    setDraft(prev => ({ ...prev, date }));
  };

  const updateDraftSplit = (splitType: SplitType) => {
    setDraft(prev => ({ ...prev, splitType }));
  };

  const updateDraftSet = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: number) => {
    setDraft(prev => {
      const currentSets = prev.exerciseSets[exerciseId] ? [...prev.exerciseSets[exerciseId]] : [
        { id: '1', weight: 0, reps: 5 },
        { id: '2', weight: 0, reps: 5 },
        { id: '3', weight: 0, reps: 5 }
      ];

      while (currentSets.length <= setIndex) {
        currentSets.push({ id: String(currentSets.length + 1), weight: 0, reps: 5 });
      }

      currentSets[setIndex] = {
        ...currentSets[setIndex],
        [field]: isNaN(value) ? 0 : Math.max(0, value)
      };

      return {
        ...prev,
        exerciseSets: {
          ...prev.exerciseSets,
          [exerciseId]: currentSets
        }
      };
    });
  };

  const addDraftSet = (exerciseId: string) => {
    sounds.playPop();
    setDraft(prev => {
      const currentSets = prev.exerciseSets[exerciseId] ? [...prev.exerciseSets[exerciseId]] : [
        { id: '1', weight: 0, reps: 5 },
        { id: '2', weight: 0, reps: 5 },
        { id: '3', weight: 0, reps: 5 }
      ];
      const lastWeight = currentSets.length > 0 ? currentSets[currentSets.length - 1].weight : 0;
      const lastReps = currentSets.length > 0 ? currentSets[currentSets.length - 1].reps : 5;

      const newSet: ExerciseSet = {
        id: String(currentSets.length + 1),
        weight: lastWeight,
        reps: lastReps
      };

      return {
        ...prev,
        exerciseSets: {
          ...prev.exerciseSets,
          [exerciseId]: [...currentSets, newSet]
        }
      };
    });
  };

  const removeDraftSet = (exerciseId: string, setIndex: number) => {
    sounds.playPop();
    setDraft(prev => {
      const currentSets = prev.exerciseSets[exerciseId] ? [...prev.exerciseSets[exerciseId]] : [];
      if (currentSets.length <= 1) return prev;
      const updated = currentSets.filter((_, idx) => idx !== setIndex);
      return {
        ...prev,
        exerciseSets: {
          ...prev.exerciseSets,
          [exerciseId]: updated
        }
      };
    });
  };

  // Cloud Sync on user login / change / manual trigger
  const isInitialSyncDone = useRef<string | null>(null);

  const syncWithCloud = useCallback(async (options?: SyncCloudOptions) => {
    if (!user?.uid || !isConfigured) return;

    const isManual = Boolean(options?.isManual);
    const forceWrite = Boolean(options?.forceWrite);
    const isSilent = options?.silent ?? (syncSettings.silentAutoSync && !isManual);

    // If auto-triggered and syncMode is manual, skip
    if (!isManual && syncSettings.syncMode === 'manual') {
      return;
    }

    // If auto-triggered on startup and syncMode is on_save_only, skip
    if (!isManual && syncSettings.syncMode === 'on_save_only') {
      return;
    }

    try {
      updateSyncState('syncing');
      const result = await performFullSync(user.uid, workouts, { forceWrite, isManual });
      
      if (result.success) {
        setWorkouts(result.workouts);
        updateSyncState('synced', Date.now(), result.statusMessage);

        if (isManual) {
          if (result.wasSkippedBecauseIdentical) {
            showToast({
              title: '☁️ Bulut Senkronize',
              description: 'Verileriniz zaten güncel. Kota tasarrufu sağlandı (0 yazma).',
              type: 'info'
            });
          } else {
            showToast({
              title: '☁️ Bulut Eşitlemesi Başarılı',
              description: result.statusMessage,
              type: 'success'
            });
          }
        } else if (!isSilent) {
          // Non-silent auto sync: only show toast if actual remote changes arrived or were written
          if (result.writtenToCloud || (result.diff && (result.diff.localHasNew || result.diff.cloudHasNew))) {
            showToast({
              title: '☁️ Bulut Güncellendi',
              description: result.statusMessage,
              type: 'success'
            });
          }
        }
      } else {
        updateSyncState('error', undefined, result.error || 'Bulut eşitleme hatası');
        if (isManual) {
          showToast({
            title: '⚠️ Eşitleme Hatası',
            description: result.error || 'Bulutla bağlantı kurulamadı.',
            type: 'error'
          });
        }
      }
    } catch (err: any) {
      console.error('Bulut senkronizasyon hatası:', err);
      updateSyncState('error', undefined, 'Bağlantı hatası');
      if (isManual) {
        showToast({
          title: '⚠️ Eşitleme Hatası',
          description: 'Bulut sunucusuna bağlanılamadı.',
          type: 'error'
        });
      }
    }
  }, [user?.uid, isConfigured, workouts, syncSettings, showToast, updateSyncState]);

  // Initial startup sync (only once per user login, obeying smart mode)
  useEffect(() => {
    if (user?.uid && isConfigured && isInitialSyncDone.current !== user.uid) {
      isInitialSyncDone.current = user.uid;
      if (syncSettings.syncMode === 'smart' && syncSettings.autoSyncOnStartup) {
        syncWithCloud({ isManual: false, silent: true });
      }
    }
  }, [user?.uid, isConfigured, syncSettings.syncMode, syncSettings.autoSyncOnStartup, syncWithCloud]);

  // Save active draft workout
  const saveWorkout = (): { success: boolean; isPR: boolean; newPRs: string[] } => {
    const recordedExercises: any[] = [];
    const newPRs: string[] = [];
    let isOverallPR = false;

    // Check all exercises that have valid recorded sets
    allExercises.forEach(ex => {
      const sets = draft.exerciseSets[ex.id];
      if (sets && sets.length > 0) {
        const validSets = sets.filter(s => s.weight > 0);
        if (validSets.length > 0) {
          // Check if this workout broke a PR
          const currentInfo = calculateExerciseLevelInfo(ex, workouts);
          const maxInThisWorkout = Math.max(...validSets.map(s => s.weight));
          
          if (maxInThisWorkout > currentInfo.prWeight) {
            newPRs.push(`${ex.name}: ${maxInThisWorkout} kg`);
            isOverallPR = true;
          }

          recordedExercises.push({
            id: ex.id,
            name: ex.name,
            muscle: ex.muscle,
            sets: validSets.map(s => s.weight),
            detailedSets: validSets
          });
        }
      }
    });

    if (recordedExercises.length === 0) {
      showToast({
        title: '⚠️ Boş Antrenman',
        description: 'Lütfen en az bir hareket için ağırlık girin.',
        type: 'error'
      });
      return { success: false, isPR: false, newPRs: [] };
    }

    const typeLabel = draft.splitType === 'upper' 
      ? 'Üst Vücut' 
      : (draft.splitType === 'lower' ? 'Alt Vücut' : (draft.splitType === 'full' ? 'Tüm Vücut' : 'Özel'));

    // Check if a workout for this date already exists in the workouts history
    const existingIndex = workouts.findIndex(w => w.date === draft.date);
    let updatedList: Workout[];
    let isMergedWithExisting = false;

    if (existingIndex >= 0) {
      isMergedWithExisting = true;
      const existingWorkout = workouts[existingIndex];
      const mergedExercises = mergeSavedExerciseLists(existingWorkout.exercises, recordedExercises);
      const { splitType, type } = determineSplitType([
        existingWorkout,
        { splitType: draft.splitType, type: typeLabel, exercises: recordedExercises }
      ]);

      const mergedWorkout: Workout = {
        ...existingWorkout,
        type,
        splitType,
        exercises: mergedExercises,
        createdAt: Date.now()
      };

      const copy = [...workouts];
      copy[existingIndex] = mergedWorkout;
      updatedList = mergeWorkoutsByDate(copy);
    } else {
      const newWorkout: Workout = {
        id: `w-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: draft.date,
        type: typeLabel,
        splitType: draft.splitType,
        exercises: recordedExercises,
        createdAt: Date.now()
      };
      updatedList = [newWorkout, ...workouts];
    }

    setWorkouts(updatedList);

    // Save to Cloud if logged in and not in purely manual mode
    if (user?.uid && isConfigured && syncSettings.syncMode !== 'manual') {
      updateSyncState('syncing');
      saveCloudWorkouts(user.uid, updatedList)
        .then(() => updateSyncState('synced', Date.now(), 'Buluta kaydedildi'))
        .catch(() => updateSyncState('error', undefined, 'Kaydetme hatası'));
    }

    // Reset draft sets
    setDraft(prev => ({
      ...prev,
      exerciseSets: {}
    }));

    if (isOverallPR) {
      sounds.playFanfare();
      triggerConfetti();
      showToast({
        title: '🏆 YENİ KİŞİSEL REKOR (PR)!',
        description: newPRs.join(', '),
        type: 'pr'
      });
    } else {
      sounds.playSuccess();
      showToast({
        title: isMergedWithExisting ? '✅ Antrenman Birleştirildi!' : '✅ Antrenman Kaydedildi!',
        description: isMergedWithExisting 
          ? `Girdiğiniz hareketler bugünün antrenman kaydına eklendi.` 
          : `${typeLabel} seansı başarıyla günlüğe eklendi.`,
        type: 'success'
      });
    }

    return { success: true, isPR: isOverallPR, newPRs };
  };

  // Update an existing workout in history
  const updateWorkout = (workout: Workout) => {
    const remaining = workouts.filter(w => w.id !== workout.id);
    const updated = mergeWorkoutsByDate([workout, ...remaining]);
    setWorkouts(updated);
    sounds.playSuccess();
    showToast({
      title: 'Antrenman Güncellendi',
      description: `${workout.type} kaydı başarıyla düzenlendi.`,
      type: 'info'
    });

    if (user?.uid && isConfigured && syncSettings.syncMode !== 'manual') {
      updateSyncState('syncing');
      saveCloudWorkouts(user.uid, updated)
        .then(() => updateSyncState('synced', Date.now(), 'Buluta güncellendi'))
        .catch(() => updateSyncState('error', undefined, 'Güncelleme hatası'));
    }
  };

  // Delete a workout from history
  const deleteWorkout = (id: string) => {
    const updated = workouts.filter(w => w.id !== id);
    setWorkouts(updated);
    sounds.playPop();
    showToast({
      title: 'Antrenman Silindi',
      description: 'Antrenman günlüğünüzden kaldırıldı.',
      type: 'info'
    });

    if (user?.uid && isConfigured && syncSettings.syncMode !== 'manual') {
      updateSyncState('syncing');
      saveCloudWorkouts(user.uid, updated)
        .then(() => updateSyncState('synced', Date.now(), 'Buluttan silindi'))
        .catch(() => updateSyncState('error', undefined, 'Silme hatası'));
    }
  };

  // Add custom exercise
  const addCustomExercise = (name: string, muscle: any, category: any): ExerciseDefinition => {
    const newEx: ExerciseDefinition = {
      id: `c-${Date.now()}`,
      name,
      muscle,
      category,
      isCustom: true
    };
    const updated = [...customExercises, newEx];
    setCustomExercises(updated);
    localStorage.setItem(STORAGE_CUSTOM_EXERCISES_KEY, JSON.stringify(updated));
    sounds.playSuccess();
    showToast({
      title: 'Özel Egzersiz Eklendi',
      description: `${name} egzersiz listenize kaydedildi.`,
      type: 'success'
    });
    return newEx;
  };

  // Delete custom exercise
  const deleteCustomExercise = (id: string) => {
    const updated = customExercises.filter(e => e.id !== id);
    setCustomExercises(updated);
    localStorage.setItem(STORAGE_CUSTOM_EXERCISES_KEY, JSON.stringify(updated));
    sounds.playPop();
    showToast({
      title: 'Egzersiz Silindi',
      description: 'Özel egzersiz listenizden kaldırıldı.',
      type: 'info'
    });
  };

  // Import / Export
  const importAllData = (importedWorkouts: Workout[], importedCustom: ExerciseDefinition[]) => {
    if (importedWorkouts.length > 0) {
      const merged = mergeWorkoutsByDate(importedWorkouts);
      setWorkouts(merged);
      if (user?.uid && isConfigured) {
        saveCloudWorkouts(user.uid, merged)
          .then(() => updateSyncState('synced', Date.now(), 'Yedek buluta yüklendi'))
          .catch(() => updateSyncState('error'));
      }
    }
    if (importedCustom.length > 0) {
      setCustomExercises(importedCustom);
    }
    sounds.playFanfare();
    showToast({
      title: '📦 Yedek Yüklendi',
      description: `${importedWorkouts.length} antrenman başarıyla içe aktarıldı.`,
      type: 'success'
    });
  };

  const resetAllData = () => {
    setWorkouts([]);
    setCustomExercises([]);
    localStorage.setItem(STORAGE_WORKOUTS_KEY, JSON.stringify([]));
    localStorage.removeItem(STORAGE_LEGACY_KEY);
    localStorage.setItem(STORAGE_CUSTOM_EXERCISES_KEY, JSON.stringify([]));

    if (user?.uid && isConfigured) {
      saveCloudWorkouts(user.uid, [])
        .then(() => updateSyncState('synced', Date.now(), 'Tüm bulut verisi sıfırlandı'))
        .catch(() => updateSyncState('error'));
    }

    showToast({
      title: 'Sıfırlandı',
      description: 'Tüm veriler başarıyla silindi.',
      type: 'info'
    });
  };

  const populateSampleData = () => {
    const samples = mergeWorkoutsByDate(generateTwoYearWorkouts());
    setWorkouts(samples);
    if (user?.uid && isConfigured) {
      saveCloudWorkouts(user.uid, samples)
        .then(() => updateSyncState('synced', Date.now(), 'Örnek veriler buluta yüklendi'))
        .catch(() => updateSyncState('error'));
    }
    sounds.playFanfare();
    showToast({
      title: '🎉 2 Yıllık Antrenman Geçmişi Yüklendi',
      description: `${samples.length} antrenman kaydı (kademeli ağırlık & tekrar artışı) başarıyla eklendi.`,
      type: 'success'
    });
  };

  const overallStats = calculateOverallPlayerStats(workouts, allExercises);

  return (
    <WorkoutContext.Provider
      value={{
        workouts,
        customExercises,
        allExercises,
        activeTab,
        setActiveTab,
        draft,
        updateDraftDate,
        updateDraftSplit,
        updateDraftSet,
        addDraftSet,
        removeDraftSet,
        clearDraftExercise,
        saveWorkout,
        updateWorkout,
        deleteWorkout,
        addCustomExercise,
        deleteCustomExercise,
        overallStats,
        toasts,
        showToast,
        removeToast,
        triggerConfetti,
        confettiTrigger,
        soundEnabled,
        setSoundEnabled,
        isLoggingWorkout,
        setIsLoggingWorkout,
        importAllData,
        resetAllData,
        populateSampleData,
        syncWithCloud
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};
