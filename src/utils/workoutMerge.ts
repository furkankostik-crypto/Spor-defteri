import { Workout, SavedExercise, ExerciseSet, SplitType } from '../types/workout';

/**
 * Merges two arrays of SavedExercise objects into one.
 * If an exercise exists in both (by id or trimmed lowercase name), their sets are joined.
 */
export function mergeSavedExerciseLists(
  existingList: SavedExercise[] = [],
  incomingList: SavedExercise[] = []
): SavedExercise[] {
  const result: SavedExercise[] = [];
  const exerciseMap = new Map<string, SavedExercise>();

  // Helper to normalize an exercise's key
  const getKey = (ex: SavedExercise) => ex.id || ex.name.trim().toLowerCase();

  // Helper to convert sets & detailedSets into clean sequential ExerciseSet array
  const normalizeSets = (ex: SavedExercise): ExerciseSet[] => {
    if (ex.detailedSets && ex.detailedSets.length > 0) {
      return ex.detailedSets.filter(s => s && s.weight > 0);
    }
    if (ex.sets && ex.sets.length > 0) {
      return ex.sets
        .filter(w => w > 0)
        .map((w, idx) => ({
          id: String(idx + 1),
          weight: w,
          reps: 5,
          completed: true
        }));
    }
    return [];
  };

  // Add all existing exercises first
  existingList.forEach(ex => {
    if (!ex) return;
    const key = getKey(ex);
    const sets = normalizeSets(ex);
    if (sets.length > 0) {
      const clonedEx: SavedExercise = {
        id: ex.id,
        name: ex.name,
        detailedSets: sets.map((s, idx) => ({ ...s, id: String(idx + 1) })),
        sets: sets.map(s => s.weight)
      };
      if (ex.muscle) {
        clonedEx.muscle = ex.muscle;
      }
      exerciseMap.set(key, clonedEx);
      result.push(clonedEx);
    }
  });

  // Merge incoming exercises
  incomingList.forEach(ex => {
    if (!ex) return;
    const key = getKey(ex);
    const incomingSets = normalizeSets(ex);
    if (incomingSets.length === 0) return;

    if (exerciseMap.has(key)) {
      const existingEx = exerciseMap.get(key)!;
      const combinedSets: ExerciseSet[] = [
        ...(existingEx.detailedSets || []),
        ...incomingSets
      ].map((s, idx) => ({
        ...s,
        id: String(idx + 1)
      }));

      existingEx.detailedSets = combinedSets;
      existingEx.sets = combinedSets.map(s => s.weight);
      if (!existingEx.muscle && ex.muscle) {
        existingEx.muscle = ex.muscle;
      }
    } else {
      const newEx: SavedExercise = {
        id: ex.id,
        name: ex.name,
        detailedSets: incomingSets.map((s, idx) => ({ ...s, id: String(idx + 1) })),
        sets: incomingSets.map(s => s.weight)
      };
      if (ex.muscle) {
        newEx.muscle = ex.muscle;
      }
      exerciseMap.set(key, newEx);
      result.push(newEx);
    }
  });

  return result;
}

/**
 * Determines the consolidated split type and title for combined workouts.
 */
export function determineSplitType(
  workouts: Array<{ splitType?: SplitType; type?: string; exercises: SavedExercise[] }>
): { splitType: SplitType; type: string } {
  if (workouts.length === 0) {
    return { splitType: 'upper', type: 'Üst Vücut' };
  }
  if (workouts.length === 1) {
    const w = workouts[0];
    const s = w.splitType || (w.type === 'Üst Vücut' ? 'upper' : w.type === 'Alt Vücut' ? 'lower' : 'custom');
    return { splitType: s, type: w.type || 'Antrenman' };
  }

  const splitTypes = new Set<string>();
  const types = new Set<string>();

  workouts.forEach(w => {
    if (w.splitType) splitTypes.add(w.splitType);
    if (w.type) types.add(w.type);
  });

  // If all workouts have the exact same splitType
  if (splitTypes.size === 1) {
    const s = Array.from(splitTypes)[0] as SplitType;
    const t = Array.from(types)[0] || (s === 'upper' ? 'Üst Vücut' : s === 'lower' ? 'Alt Vücut' : 'Tüm Vücut');
    return { splitType: s, type: t };
  }

  // If there's a mix of upper and lower, or full body is present -> Full Body ('Tüm Vücut')
  if ((splitTypes.has('upper') && splitTypes.has('lower')) || splitTypes.has('full')) {
    return { splitType: 'full', type: 'Tüm Vücut' };
  }

  // Check exercise muscles
  let hasUpper = false;
  let hasLower = false;
  const upperMuscles = new Set(['chest', 'back', 'shoulder', 'biceps', 'triceps']);
  const lowerMuscles = new Set(['quads', 'hamstring', 'calves', 'glutes']);

  workouts.forEach(w => {
    w.exercises.forEach(ex => {
      if (ex.muscle) {
        if (upperMuscles.has(ex.muscle)) hasUpper = true;
        if (lowerMuscles.has(ex.muscle)) hasLower = true;
      }
    });
  });

  if (hasUpper && hasLower) {
    return { splitType: 'full', type: 'Tüm Vücut' };
  }
  if (hasUpper) {
    return { splitType: 'upper', type: 'Üst Vücut' };
  }
  if (hasLower) {
    return { splitType: 'lower', type: 'Alt Vücut' };
  }

  return { splitType: 'custom', type: 'Özel Antrenman' };
}

/**
 * Merges a list of workouts by date (YYYY-MM-DD), ensuring that there is at most
 * ONE workout per date in the resulting list.
 */
export function mergeWorkoutsByDate(workouts: Workout[]): Workout[] {
  if (!workouts || workouts.length <= 1) {
    return workouts || [];
  }

  const dateMap = new Map<string, Workout[]>();

  // Group by date
  workouts.forEach(w => {
    if (!w || !w.date) return;
    const date = w.date.trim();
    const list = dateMap.get(date) || [];
    list.push(w);
    dateMap.set(date, list);
  });

  const mergedList: Workout[] = [];

  for (const [date, dateWorkouts] of dateMap.entries()) {
    if (dateWorkouts.length === 1) {
      mergedList.push(dateWorkouts[0]);
      continue;
    }

    // Multiple workouts on the same day -> Merge them!
    // Sort chronological by createdAt or preserve first ID
    dateWorkouts.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    let mergedExercises: SavedExercise[] = [];
    dateWorkouts.forEach(w => {
      mergedExercises = mergeSavedExerciseLists(mergedExercises, w.exercises);
    });

    const { splitType, type } = determineSplitType(dateWorkouts);
    const validCreatedAts = dateWorkouts.map(w => w.createdAt || 0).filter(c => c > 0);
    const latestCreatedAt = validCreatedAts.length > 0 ? Math.max(...validCreatedAts) : Date.now();
    const totalDuration = dateWorkouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);
    const combinedNotes = dateWorkouts
      .map(w => w.notes)
      .filter((n): n is string => Boolean(n && n.trim()))
      .join(' • ');

    // Use the earliest ID or latest ID
    const primaryId = dateWorkouts[0].id || `w-${Date.now()}`;

    const mergedWorkout: Workout = {
      id: primaryId,
      date,
      type,
      splitType,
      exercises: mergedExercises,
      createdAt: latestCreatedAt
    };

    if (totalDuration > 0) {
      mergedWorkout.durationMinutes = totalDuration;
    }
    if (combinedNotes && combinedNotes.length > 0) {
      mergedWorkout.notes = combinedNotes;
    }

    mergedList.push(mergedWorkout);
  }

  // Sort descending by date, then createdAt
  mergedList.sort((a, b) => {
    const dateComp = (b.date || '').localeCompare(a.date || '');
    if (dateComp !== 0) return dateComp;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  return mergedList;
}
