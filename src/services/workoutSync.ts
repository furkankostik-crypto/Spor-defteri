import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Workout, SyncDiffResult, ActiveWorkoutSession, AthleteProfile, BodyMeasurementEntry, ExerciseDefinition } from '../types/workout';
import { mergeWorkoutsByDate } from '../utils/workoutMerge';

export const STORAGE_SAVED_WRITES_KEY = 'spor_saved_writes_count';
export const STORAGE_DELETED_WORKOUT_IDS_KEY = 'spor_deleted_workout_ids';
export const STORAGE_DELETED_CUSTOM_EX_IDS_KEY = 'spor_deleted_custom_ex_ids';
export const STORAGE_SYNC_DIRTY_KEY = 'spor_sync_dirty';

export interface SyncOptions {
  forceWrite?: boolean;
  isManual?: boolean;
  localProfile?: AthleteProfile;
  localCustomExercises?: ExerciseDefinition[];
}

export interface SyncResult {
  success: boolean;
  workouts: Workout[];
  profile?: AthleteProfile;
  customExercises?: ExerciseDefinition[];
  mergedCount: number;
  writtenToCloud: boolean;
  wasSkippedBecauseIdentical: boolean;
  preventedWritesCount: number;
  statusMessage: string;
  diff?: SyncDiffResult;
  error?: string;
}

export const getLocalDeletedWorkoutIds = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_DELETED_WORKOUT_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

export const addLocalDeletedWorkoutId = (id: string): string[] => {
  try {
    const current = getLocalDeletedWorkoutIds();
    const updated = Array.from(new Set([...current, id])).slice(-250);
    localStorage.setItem(STORAGE_DELETED_WORKOUT_IDS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [id];
  }
};

export const setLocalDeletedWorkoutIds = (ids: string[]): void => {
  try {
    const unique = Array.from(new Set(ids)).slice(-250);
    localStorage.setItem(STORAGE_DELETED_WORKOUT_IDS_KEY, JSON.stringify(unique));
  } catch {}
};

export const getLocalDeletedCustomExerciseIds = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_DELETED_CUSTOM_EX_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

export const addLocalDeletedCustomExerciseId = (id: string): string[] => {
  try {
    const current = getLocalDeletedCustomExerciseIds();
    const updated = Array.from(new Set([...current, id])).slice(-200);
    localStorage.setItem(STORAGE_DELETED_CUSTOM_EX_IDS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [id];
  }
};

export const setLocalDeletedCustomExerciseIds = (ids: string[]): void => {
  try {
    const unique = Array.from(new Set(ids)).slice(-200);
    localStorage.setItem(STORAGE_DELETED_CUSTOM_EX_IDS_KEY, JSON.stringify(unique));
  } catch {}
};

export const isSyncDirty = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_SYNC_DIRTY_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setSyncDirty = (dirty: boolean): void => {
  try {
    if (dirty) {
      localStorage.setItem(STORAGE_SYNC_DIRTY_KEY, 'true');
    } else {
      localStorage.removeItem(STORAGE_SYNC_DIRTY_KEY);
    }
  } catch {}
};

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
  const exSig = (w.exercises || [])
    .map(ex => {
      const setsSig = ex.detailedSets?.length
        ? ex.detailedSets.map(s => `${s.weight}x${s.reps}`).join(',')
        : (ex.sets || []).join(',');
      return `${ex.id}[${setsSig}]`;
    })
    .join(';');
  return `${w.id}:${w.date}:${w.type || ''}:${w.createdAt || 0}:${exSig}`;
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
 * Preserves the most up-to-date entries, filters out tombstoned (deleted) IDs, and sorts chronologically.
 */
export const smartMergeWorkouts = (
  local: Workout[],
  cloud: Workout[],
  deletedIds?: Set<string>
): Workout[] => {
  const map = new Map<string, Workout>();

  // Add all cloud workouts first (excluding tombstoned IDs)
  cloud.forEach(w => {
    if (w && w.id && (!deletedIds || !deletedIds.has(w.id))) {
      map.set(w.id, w);
    }
  });

  // Merge or overwrite with local workouts (excluding tombstoned IDs)
  local.forEach(w => {
    if (w && w.id && (!deletedIds || !deletedIds.has(w.id))) {
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
 * Merges local and cloud custom exercises without duplicates and respects deleted custom exercise IDs.
 */
export const smartMergeCustomExercises = (
  local: ExerciseDefinition[] = [],
  cloud: ExerciseDefinition[] = [],
  deletedIds?: Set<string>
): ExerciseDefinition[] => {
  const map = new Map<string, ExerciseDefinition>();
  cloud.forEach(ex => {
    if (ex && ex.id && (!deletedIds || !deletedIds.has(ex.id))) {
      map.set(ex.id, ex);
    }
  });
  local.forEach(ex => {
    if (ex && ex.id && (!deletedIds || !deletedIds.has(ex.id))) {
      map.set(ex.id, ex);
    }
  });
  return Array.from(map.values());
};

/**
 * Merges local and cloud athlete profiles & body measurement logs by date.
 */
export const smartMergeProfile = (
  local?: AthleteProfile,
  cloud?: AthleteProfile
): AthleteProfile | undefined => {
  if (!local && !cloud) return undefined;
  if (!local) return cloud;
  if (!cloud) return local;

  const localUpdated = local.updatedAt || 0;
  const cloudUpdated = cloud.updatedAt || 0;
  const newer = localUpdated >= cloudUpdated ? local : cloud;
  const older = localUpdated >= cloudUpdated ? cloud : local;

  // Merge measurement entries by date (keeping newest createdAt per date)
  const entryMap = new Map<string, BodyMeasurementEntry>();
  (older.measurements || []).forEach((m) => {
    if (m && m.date) entryMap.set(m.date, m);
  });
  (newer.measurements || []).forEach((m) => {
    if (m && m.date) {
      const existing = entryMap.get(m.date);
      if (!existing || (m.createdAt || 0) >= (existing.createdAt || 0)) {
        entryMap.set(m.date, m);
      }
    }
  });

  const mergedMeasurements = Array.from(entryMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const latestMeasurement = mergedMeasurements.length > 0
    ? mergedMeasurements[mergedMeasurements.length - 1]
    : undefined;

  return {
    ...older,
    ...newer,
    bodyWeightKg: latestMeasurement?.weightKg ?? newer.bodyWeightKg ?? older.bodyWeightKg ?? 75,
    bodyFatPct: latestMeasurement?.bodyFatPct ?? newer.bodyFatPct ?? older.bodyFatPct,
    muscleMassKg: latestMeasurement?.muscleMassKg ?? newer.muscleMassKg ?? older.muscleMassKg,
    measurements: mergedMeasurements,
    updatedAt: Math.max(localUpdated, cloudUpdated, Date.now())
  };
};

/**
 * Saves athlete profile (including body composition history) to Firestore cloud storage.
 */
export const saveCloudProfile = async (
  userId: string,
  profile: AthleteProfile
): Promise<boolean> => {
  if (!isFirebaseConfigured || !db || !userId) {
    return false;
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        athleteProfile: sanitizeForFirestore(profile),
        profileUpdatedAt: Date.now()
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    setSyncDirty(true);
    console.error('Sporcu profili buluta kaydedilirken hata:', error);
    return false;
  }
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
 * Saves all user workouts (and tombstoned IDs) to Firestore cloud storage.
 */
export const saveCloudWorkouts = async (
  userId: string,
  workouts: Workout[],
  deletedWorkoutIds?: string[]
): Promise<boolean> => {
  if (!isFirebaseConfigured || !db || !userId) {
    return false;
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const sanitizedWorkouts = sanitizeForFirestore(workouts);
    const tombstones = deletedWorkoutIds ?? getLocalDeletedWorkoutIds();
    await setDoc(
      userDocRef,
      {
        workouts: sanitizedWorkouts,
        deletedWorkoutIds: tombstones.slice(-250),
        lastSyncedAt: Date.now(),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    setSyncDirty(false);
    return true;
  } catch (error) {
    setSyncDirty(true);
    console.error('Firestore buluta kaydederken hata:', error);
    throw error;
  }
};

/**
 * Saves custom exercises (and tombstoned custom exercise IDs) to Firestore cloud storage.
 */
export const saveCloudCustomExercises = async (
  userId: string,
  customExercises: ExerciseDefinition[],
  deletedCustomExerciseIds?: string[]
): Promise<boolean> => {
  if (!isFirebaseConfigured || !db || !userId) {
    return false;
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const tombstones = deletedCustomExerciseIds ?? getLocalDeletedCustomExerciseIds();
    await setDoc(
      userDocRef,
      {
        customExercises: sanitizeForFirestore(customExercises),
        deletedCustomExerciseIds: tombstones.slice(-200),
        customExercisesUpdatedAt: Date.now()
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    setSyncDirty(true);
    console.error('Özel egzersizler buluta kaydedilirken hata:', error);
    return false;
  }
};

/**
 * Saves current active workout session to Firestore cloud (or clears it if null).
 */
export const saveCloudActiveSession = async (
  userId: string,
  session: ActiveWorkoutSession | null
): Promise<boolean> => {
  if (!isFirebaseConfigured || !db || !userId) {
    return false;
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        activeSession: session ? sanitizeForFirestore(session) : null,
        activeSessionUpdatedAt: Date.now()
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('Aktif antrenman buluta yedeklenirken hata:', error);
    return false;
  }
};

/**
 * Fetches user's active workout session from Firestore cloud if exists.
 */
export const fetchCloudActiveSession = async (userId: string): Promise<ActiveWorkoutSession | null> => {
  if (!isFirebaseConfigured || !db || !userId) {
    return null;
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const snapshot = await getDoc(userDocRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data.activeSession && typeof data.activeSession === 'object') {
        return data.activeSession as ActiveWorkoutSession;
      }
    }
    return null;
  } catch (error) {
    console.error('Aktif antrenman buluttan çekilirken hata:', error);
    return null;
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
    const userDocRef = doc(db, 'users', userId);
    const snapshot = await getDoc(userDocRef);
    let cloudWorkouts: Workout[] = [];
    let cloudProfile: AthleteProfile | undefined;
    let cloudCustomExercises: ExerciseDefinition[] = [];
    let cloudDeletedWorkoutIds: string[] = [];
    let cloudDeletedCustomExIds: string[] = [];

    if (snapshot.exists()) {
      const data = snapshot.data();
      if (Array.isArray(data.workouts)) {
        cloudWorkouts = data.workouts as Workout[];
      }
      if (data.athleteProfile && typeof data.athleteProfile === 'object') {
        cloudProfile = data.athleteProfile as AthleteProfile;
      }
      if (Array.isArray(data.customExercises)) {
        cloudCustomExercises = data.customExercises as ExerciseDefinition[];
      }
      if (Array.isArray(data.deletedWorkoutIds)) {
        cloudDeletedWorkoutIds = data.deletedWorkoutIds.filter((id): id is string => typeof id === 'string');
      }
      if (Array.isArray(data.deletedCustomExerciseIds)) {
        cloudDeletedCustomExIds = data.deletedCustomExerciseIds.filter((id): id is string => typeof id === 'string');
      }
    }

    const localDeletedWorkoutIds = getLocalDeletedWorkoutIds();
    const combinedDeletedWorkoutIds = Array.from(new Set([...localDeletedWorkoutIds, ...cloudDeletedWorkoutIds])).slice(-250);
    const deletedWorkoutIdSet = new Set(combinedDeletedWorkoutIds);
    setLocalDeletedWorkoutIds(combinedDeletedWorkoutIds);

    const localDeletedCustomExIds = getLocalDeletedCustomExerciseIds();
    const combinedDeletedCustomExIds = Array.from(new Set([...localDeletedCustomExIds, ...cloudDeletedCustomExIds])).slice(-200);
    const deletedCustomExIdSet = new Set(combinedDeletedCustomExIds);
    setLocalDeletedCustomExerciseIds(combinedDeletedCustomExIds);

    const filteredLocalWorkouts = localWorkouts.filter(w => w && w.id && !deletedWorkoutIdSet.has(w.id));
    const filteredCloudWorkouts = cloudWorkouts.filter(w => w && w.id && !deletedWorkoutIdSet.has(w.id));

    const mergedProfile = smartMergeProfile(options?.localProfile, cloudProfile);
    const mergedCustomExercises = smartMergeCustomExercises(
      options?.localCustomExercises || [],
      cloudCustomExercises,
      deletedCustomExIdSet
    );

    const diff = compareWorkouts(filteredLocalWorkouts, filteredCloudWorkouts);
    const hasDeletedFromCloud = cloudWorkouts.length !== filteredCloudWorkouts.length;
    const hasCustomExChanges = mergedCustomExercises.length !== cloudCustomExercises.length;
    const hasProfileChanges = Boolean(
      options?.localProfile &&
      (!cloudProfile || (options.localProfile.updatedAt || 0) > (cloudProfile.updatedAt || 0))
    );
    const isForce = Boolean(options?.forceWrite) || isSyncDirty() || hasDeletedFromCloud || hasCustomExChanges || hasProfileChanges;

    // Case 1: Identical datasets - ZERO WRITES!
    if (!diff.hasChanges && !isForce) {
      const newSaved = incrementSavedWritesCount(1);
      setSyncDirty(false);
      return {
        success: true,
        workouts: filteredLocalWorkouts,
        profile: mergedProfile,
        customExercises: mergedCustomExercises,
        mergedCount: filteredLocalWorkouts.length,
        writtenToCloud: false,
        wasSkippedBecauseIdentical: true,
        preventedWritesCount: newSaved,
        statusMessage: 'Veriler güncel (Gereksiz bulut yazması engellendi)',
        diff
      };
    }

    const merged = smartMergeWorkouts(filteredLocalWorkouts, filteredCloudWorkouts, deletedWorkoutIdSet);

    // Case 2: Only cloud had new items (e.g. from another device), local has no changes to upload
    if (diff.cloudHasNew && !diff.localHasNew && !isForce) {
      const newSaved = incrementSavedWritesCount(1);
      setSyncDirty(false);
      return {
        success: true,
        workouts: merged,
        profile: mergedProfile,
        customExercises: mergedCustomExercises,
        mergedCount: merged.length,
        writtenToCloud: false,
        wasSkippedBecauseIdentical: false,
        preventedWritesCount: newSaved,
        statusMessage: `${diff.changedCount} yeni bulut kaydı yerel hafızaya aktarıldı`,
        diff
      };
    }

    // Case 3: Local has changes or force write is requested - perform a SINGLE atomic write to save quota
    const payload: Record<string, any> = {
      workouts: sanitizeForFirestore(merged),
      deletedWorkoutIds: combinedDeletedWorkoutIds,
      customExercises: sanitizeForFirestore(mergedCustomExercises),
      deletedCustomExerciseIds: combinedDeletedCustomExIds,
      lastSyncedAt: Date.now(),
      updatedAt: new Date().toISOString()
    };
    if (mergedProfile) {
      payload.athleteProfile = sanitizeForFirestore(mergedProfile);
      payload.profileUpdatedAt = Date.now();
    }
    await setDoc(userDocRef, payload, { merge: true });
    setSyncDirty(false);

    return {
      success: true,
      workouts: merged,
      profile: mergedProfile,
      customExercises: mergedCustomExercises,
      mergedCount: merged.length,
      writtenToCloud: true,
      wasSkippedBecauseIdentical: false,
      preventedWritesCount: getSavedWritesCount(),
      statusMessage: `${merged.length} antrenman buluta eşitlendi`,
      diff
    };
  } catch (error: any) {
    setSyncDirty(true);
    console.error('Akıllı senkronizasyon hatası:', error);
    return {
      success: false,
      workouts: localWorkouts,
      profile: options?.localProfile,
      customExercises: options?.localCustomExercises,
      mergedCount: 0,
      writtenToCloud: false,
      wasSkippedBecauseIdentical: false,
      preventedWritesCount: getSavedWritesCount(),
      statusMessage: 'Eşitleme hatası',
      error: error.message || 'Bulut eşitleme hatası'
    };
  }
};
