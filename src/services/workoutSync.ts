import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Workout, SyncDiffResult } from '../types/workout';
import { mergeWorkoutsByDate } from '../utils/workoutMerge';

export const STORAGE_SAVED_WRITES_KEY = 'spor_saved_writes_count';

export interface SyncOptions {
  forceWrite?: boolean;
  isManual?: boolean;
}

export interface SyncResult {
  success: boolean;
  workouts: Workout[];
  mergedCount: number;
  writtenToCloud: boolean;
  wasSkippedBecauseIdentical: boolean;
  preventedWritesCount: number;
  statusMessage: string;
  diff?: SyncDiffResult;
  error?: string;
}

/**
 * Retrieves the total count of Firestore writes prevented by smart caching.
 */
export const getSavedWritesCount = (): number => {
  try {
    const saved = localStorage.getItem(STORAGE_SAVED_WRITES_KEY);
    return saved ? parseInt(saved, 10) : 0;
  } catch {
    return 0;
  }
};

/**
 * Increments the prevented writes count in localStorage.
 */
export const incrementSavedWritesCount = (amount: number = 1): number => {
  try {
    const current = getSavedWritesCount();
    const updated = current + amount;
    localStorage.setItem(STORAGE_SAVED_WRITES_KEY, String(updated));
    return updated;
  } catch {
    return 0;
  }
};

/**
 * Resets the prevented writes counter.
 */
export const resetSavedWritesCount = (): void => {
  try {
    localStorage.setItem(STORAGE_SAVED_WRITES_KEY, '0');
  } catch {
    // noop
  }
};

/**
 * Generates a lightweight signature for comparing workouts deeply without expensive JSON stringify on every call.
 */
const getWorkoutSignature = (w: Workout): string => {
  if (!w) return '';
  const exCount = w.exercises?.length || 0;
  const setsCount = w.exercises?.reduce((acc, ex) => acc + (ex.sets?.length || ex.detailedSets?.length || 0), 0) || 0;
  return `${w.id}:${w.date}:${w.createdAt || 0}:${exCount}:${setsCount}`;
};

/**
 * Compares local workouts with cloud workouts to see if either side has new or changed data.
 */
export const compareWorkouts = (local: Workout[], cloud: Workout[]): SyncDiffResult => {
  const localMap = new Map<string, { workout: Workout; sig: string }>();
  const cloudMap = new Map<string, { workout: Workout; sig: string }>();

  local.forEach(w => {
    if (w && w.id) localMap.set(w.id, { workout: w, sig: getWorkoutSignature(w) });
  });

  cloud.forEach(w => {
    if (w && w.id) cloudMap.set(w.id, { workout: w, sig: getWorkoutSignature(w) });
  });

  let localHasNew = false;
  let cloudHasNew = false;
  let changedCount = 0;

  // Check items in local
  for (const [id, localItem] of localMap.entries()) {
    const cloudItem = cloudMap.get(id);
    if (!cloudItem) {
      localHasNew = true;
      changedCount++;
    } else if (localItem.sig !== cloudItem.sig) {
      // One has newer createdAt or different contents
      const localCreated = localItem.workout.createdAt || 0;
      const cloudCreated = cloudItem.workout.createdAt || 0;
      if (localCreated > cloudCreated) {
        localHasNew = true;
      } else if (cloudCreated > localCreated) {
        cloudHasNew = true;
      } else {
        // Same createdAt but different exercises (modified)
        localHasNew = true;
      }
      changedCount++;
    }
  }

  // Check items in cloud that are not in local
  for (const [id] of cloudMap.entries()) {
    if (!localMap.has(id)) {
      cloudHasNew = true;
      changedCount++;
    }
  }

  const hasChanges = localHasNew || cloudHasNew || local.length !== cloud.length;

  return {
    hasChanges,
    localHasNew,
    cloudHasNew,
    changedCount
  };
};

/**
 * Merges local and cloud workouts intelligently without duplicate IDs.
 * Preserves the most up-to-date entries and sorts chronologically.
 */
export const smartMergeWorkouts = (local: Workout[], cloud: Workout[]): Workout[] => {
  const map = new Map<string, Workout>();

  // Add all cloud workouts first
  cloud.forEach(w => {
    if (w && w.id) {
      map.set(w.id, w);
    }
  });

  // Merge or overwrite with local workouts
  local.forEach(w => {
    if (w && w.id) {
      const existing = map.get(w.id);
      if (!existing) {
        map.set(w.id, w);
      } else {
        // Keep the one with newer createdAt timestamp if available
        const localCreated = w.createdAt || 0;
        const cloudCreated = existing.createdAt || 0;
        map.set(w.id, localCreated >= cloudCreated ? w : existing);
      }
    }
  });

  const merged = Array.from(map.values());
  return mergeWorkoutsByDate(merged);
};

/**
 * Fetches all workouts for a specific user from Firestore.
 */
export const fetchCloudWorkouts = async (userId: string): Promise<Workout[]> => {
  if (!isFirebaseConfigured || !db || !userId) {
    return [];
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const snapshot = await getDoc(userDocRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      if (Array.isArray(data.workouts)) {
        return data.workouts as Workout[];
      }
    }
    return [];
  } catch (error) {
    console.error('Firestore bulut verileri alınırken hata:', error);
    throw error;
  }
};

/**
 * Deeply sanitizes an object tree by stripping any properties with `undefined` values,
 * which Firestore strictly rejects.
 */
export const sanitizeForFirestore = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(data));
};

/**
 * Saves all user workouts to Firestore cloud storage.
 */
export const saveCloudWorkouts = async (userId: string, workouts: Workout[]): Promise<boolean> => {
  if (!isFirebaseConfigured || !db || !userId) {
    return false;
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const sanitizedWorkouts = sanitizeForFirestore(workouts);
    await setDoc(
      userDocRef,
      {
        workouts: sanitizedWorkouts,
        lastSyncedAt: Date.now(),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('Firestore buluta kaydederken hata:', error);
    throw error;
  }
};

/**
 * Performs full bidirectional smart sync between local state and cloud with QUOTA OPTIMIZATION.
 * Prevents redundant Firestore writes when local and cloud data are identical.
 */
export const performFullSync = async (
  userId: string, 
  localWorkouts: Workout[],
  options?: SyncOptions
): Promise<SyncResult> => {
  if (!isFirebaseConfigured || !db || !userId) {
    return { 
      success: false, 
      workouts: localWorkouts, 
      mergedCount: 0, 
      writtenToCloud: false,
      wasSkippedBecauseIdentical: false,
      preventedWritesCount: getSavedWritesCount(),
      statusMessage: 'Firebase yapılandırılmamış',
      error: 'Firebase yapılandırılmamış' 
    };
  }

  try {
    const cloudWorkouts = await fetchCloudWorkouts(userId);
    const diff = compareWorkouts(localWorkouts, cloudWorkouts);
    const isForce = Boolean(options?.forceWrite);

    // Case 1: Identical datasets - ZERO WRITES!
    if (!diff.hasChanges && !isForce) {
      const newSaved = incrementSavedWritesCount(1);
      return {
        success: true,
        workouts: localWorkouts,
        mergedCount: localWorkouts.length,
        writtenToCloud: false,
        wasSkippedBecauseIdentical: true,
        preventedWritesCount: newSaved,
        statusMessage: 'Veriler güncel (Gereksiz bulut yazması engellendi)',
        diff
      };
    }

    const merged = smartMergeWorkouts(localWorkouts, cloudWorkouts);

    // Case 2: Only cloud had new items (e.g. from another device), local has no changes to upload
    if (diff.cloudHasNew && !diff.localHasNew && !isForce) {
      const newSaved = incrementSavedWritesCount(1);
      return {
        success: true,
        workouts: merged,
        mergedCount: merged.length,
        writtenToCloud: false,
        wasSkippedBecauseIdentical: false,
        preventedWritesCount: newSaved,
        statusMessage: `${diff.changedCount} yeni bulut kaydı yerel hafızaya aktarıldı`,
        diff
      };
    }

    // Case 3: Local has changes or force write is requested - perform single write
    await saveCloudWorkouts(userId, merged);

    return {
      success: true,
      workouts: merged,
      mergedCount: merged.length,
      writtenToCloud: true,
      wasSkippedBecauseIdentical: false,
      preventedWritesCount: getSavedWritesCount(),
      statusMessage: `${merged.length} antrenman buluta eşitlendi`,
      diff
    };
  } catch (error: any) {
    console.error('Akıllı senkronizasyon hatası:', error);
    return {
      success: false,
      workouts: localWorkouts,
      mergedCount: 0,
      writtenToCloud: false,
      wasSkippedBecauseIdentical: false,
      preventedWritesCount: getSavedWritesCount(),
      statusMessage: 'Eşitleme hatası',
      error: error.message || 'Bulut eşitleme hatası'
    };
  }
};
