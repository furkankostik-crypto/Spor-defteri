import { Workout, ExerciseDefinition, ExerciseLevelInfo, OverallPlayerStats, MuscleGroup, MuscleLevelInfo, ExerciseSet } from '../types/workout';
import { getRankByLevel } from '../data/rankTiers';
import { calculateStreak } from './dateUtils';

export const EXP_PER_LEVEL = 500;
export const OVERALL_EXP_PER_LEVEL = 1000;

export function isDurationExercise(exerciseOrId?: ExerciseDefinition | string | null): boolean {
  if (!exerciseOrId) return false;
  if (typeof exerciseOrId === 'string') {
    return exerciseOrId === 'plank';
  }
  return exerciseOrId.measurementType === 'duration' || exerciseOrId.id === 'plank';
}

export function isSetValid(set: ExerciseSet | undefined | null, isDuration: boolean = false): boolean {
  if (!set) return false;
  if (isDuration) {
    return (set.reps || 0) > 0 || (set.weight || 0) > 0;
  }
  return (set.weight || 0) > 0;
}

export function getSetDurationSeconds(set: ExerciseSet | number, isDuration: boolean = true): number {
  if (typeof set === 'number') {
    return set > 0 ? set : 60;
  }
  if (!isDuration) return set.reps || 5;
  // In duration mode, reps holds the seconds (if legacy data had weight > 0 and reps = 60, use reps; if reps === 0 and weight > 0, use weight)
  if ((set.reps || 0) > 0) return set.reps;
  if ((set.weight || 0) > 0) return set.weight;
  return 0;
}

/**
 * Calculates EXP for a single set based on weight and reps (or duration in seconds for isometric exercises)
 */
export function calculateSetEXP(weight: number, reps: number = 5, isDuration: boolean = false): number {
  if (isDuration) {
    const seconds = reps > 0 ? reps : weight;
    if (seconds <= 0) return 0;
    // 60 seconds isometric hold = ~180 EXP
    return Math.round(seconds * 3);
  }
  if (weight <= 0) return 0;
  return Math.round(weight * Math.max(1, reps));
}

/**
 * Calculates level and PR statistics for a specific exercise across all workouts
 */
export function calculateExerciseLevelInfo(
  exercise: ExerciseDefinition,
  workouts: Workout[]
): ExerciseLevelInfo {
  let totalEXP = 0;
  let maxWeight = 0;
  let prReps = 5;
  let totalSets = 0;
  let totalVolume = 0;
  let lastTrainedDate: string | undefined;
  const isDuration = isDurationExercise(exercise);

  // Workouts are expected to be in descending order (latest first)
  workouts.forEach((w) => {
    w.exercises.forEach((savedEx) => {
      if (savedEx.id === exercise.id) {
        if (!lastTrainedDate) {
          lastTrainedDate = w.date;
        }

        // Handle detailedSets if present
        if (savedEx.detailedSets && savedEx.detailedSets.length > 0) {
          savedEx.detailedSets.forEach((set) => {
            if (isDuration) {
              const sec = getSetDurationSeconds(set, true);
              if (sec > 0) {
                const exp = calculateSetEXP(0, sec, true);
                totalEXP += exp;
                totalVolume += sec;
                totalSets++;
                if (sec > maxWeight) {
                  maxWeight = sec;
                  prReps = sec;
                }
              }
            } else if (set.weight > 0) {
              const exp = calculateSetEXP(set.weight, set.reps || 5);
              totalEXP += exp;
              totalVolume += set.weight * (set.reps || 5);
              totalSets++;

              if (set.weight > maxWeight) {
                maxWeight = set.weight;
                prReps = set.reps || 5;
              }
            }
          });
        } else if (savedEx.sets && savedEx.sets.length > 0) {
          // Legacy format (array of weights with 5 reps assumed, or seconds for duration)
          savedEx.sets.forEach((wgt) => {
            if (wgt > 0) {
              if (isDuration) {
                const exp = calculateSetEXP(0, wgt, true);
                totalEXP += exp;
                totalVolume += wgt;
                totalSets++;
                if (wgt > maxWeight) {
                  maxWeight = wgt;
                  prReps = wgt;
                }
              } else {
                const exp = calculateSetEXP(wgt, 5);
                totalEXP += exp;
                totalVolume += wgt * 5;
                totalSets++;

                if (wgt > maxWeight) {
                  maxWeight = wgt;
                  prReps = 5;
                }
              }
            }
          });
        }
      }
    });
  });

  const calculatedLevel = Math.floor(totalEXP / EXP_PER_LEVEL) + 1;
  const currentLevel = Math.min(1000, Math.max(1, calculatedLevel));
  const levelBaseEXP = (currentLevel - 1) * EXP_PER_LEVEL;
  const nextLevelEXP = currentLevel * EXP_PER_LEVEL;

  let progressPercent = currentLevel === 1000 ? 100 : ((totalEXP - levelBaseEXP) / EXP_PER_LEVEL) * 100;
  progressPercent = Math.min(100, Math.max(0, Math.round(progressPercent)));

  return {
    exerciseId: exercise.id,
    name: exercise.name,
    muscle: exercise.muscle,
    totalEXP,
    currentLevel,
    levelBaseEXP,
    nextLevelEXP,
    progressPercent,
    prWeight: maxWeight,
    prReps,
    totalSets,
    totalVolume,
    lastTrainedDate
  };
}

/**
 * Calculates overall player statistics across all workouts
 */
export function calculateOverallPlayerStats(
  workouts: Workout[],
  allExercises: ExerciseDefinition[]
): OverallPlayerStats {
  let combinedEXP = 0;
  let totalVolumeKg = 0;
  let totalSetsCount = 0;

  allExercises.forEach((ex) => {
    const info = calculateExerciseLevelInfo(ex, workouts);
    combinedEXP += info.totalEXP;
    if (!isDurationExercise(ex)) {
      totalVolumeKg += info.totalVolume;
    }
    totalSetsCount += info.totalSets;
  });

  const calculatedOverallLevel = Math.floor(combinedEXP / OVERALL_EXP_PER_LEVEL) + 1;
  const overallLevel = Math.min(1000, Math.max(1, calculatedOverallLevel));
  const rank = getRankByLevel(overallLevel);

  const currentLevelBase = (overallLevel - 1) * OVERALL_EXP_PER_LEVEL;
  const nextRankEXP = overallLevel * OVERALL_EXP_PER_LEVEL;
  const rankProgressPct = overallLevel === 1000 ? 100 : Math.min(100, Math.max(0, Math.round(((combinedEXP - currentLevelBase) / OVERALL_EXP_PER_LEVEL) * 100)));

  return {
    totalEXP: combinedEXP,
    overallLevel,
    rankTitle: rank.title,
    rankBadgeColor: rank.color,
    rankGradient: rank.gradient,
    nextRankEXP,
    rankProgressPct,
    totalWorkouts: workouts.length,
    totalVolumeKg,
    totalSetsCount,
    activeStreak: calculateStreak(workouts)
  };
}

/**
 * Retrieves the sets from the most recent previous workout for a given exercise
 */
export function getLastWorkoutSets(
  exerciseId: string,
  workouts: Workout[],
  excludeWorkoutId?: string
): { weights: number[]; reps: number[]; date: string } | null {
  const isDuration = isDurationExercise(exerciseId);
  for (const w of workouts) {
    if (excludeWorkoutId && w.id === excludeWorkoutId) continue;
    for (const ex of w.exercises) {
      if (ex.id === exerciseId) {
        if (ex.detailedSets && ex.detailedSets.length > 0) {
          if (isDuration) {
            const durations = ex.detailedSets.map(s => getSetDurationSeconds(s, true));
            if (durations.some(d => d > 0)) {
              return { weights: durations.map(() => 0), reps: durations, date: w.date };
            }
          } else {
            const weights = ex.detailedSets.map(s => s.weight);
            const reps = ex.detailedSets.map(s => s.reps || 5);
            if (weights.some(w => w > 0)) {
              return { weights, reps, date: w.date };
            }
          }
        } else if (ex.sets && ex.sets.length > 0 && ex.sets.some(w => w > 0)) {
          if (isDuration) {
            return { weights: ex.sets.map(() => 0), reps: ex.sets, date: w.date };
          }
          return { weights: ex.sets, reps: ex.sets.map(() => 5), date: w.date };
        }
      }
    }
  }
  return null;
}

/**
 * Calculates proportional volume (kg) distribution across all muscles based on scientific activation ratios
 */
export function calculateProportionalMuscleVolume(
  workouts: Workout[],
  allExercises: ExerciseDefinition[]
): Record<MuscleGroup, number> {
  const volumes: Record<MuscleGroup, number> = {
    chest: 0,
    back: 0,
    shoulder: 0,
    biceps: 0,
    triceps: 0,
    quads: 0,
    hamstring: 0,
    glutes: 0,
    calves: 0,
    abs: 0,
    cardio: 0
  };

  workouts.forEach((w) => {
    w.exercises.forEach((savedEx) => {
      const exDef = allExercises.find((e) => e.id === savedEx.id);
      const isDuration = isDurationExercise(exDef || savedEx.id);
      if (isDuration) return; // Duration exercises don't add kg tonnage

      const activations = exDef?.muscles && exDef.muscles.length > 0
        ? exDef.muscles
        : [{ muscle: savedEx.muscle || exDef?.muscle || 'chest', ratio: 1.0, role: 'primary' as const }];

      let exerciseVolume = 0;
      if (savedEx.detailedSets && savedEx.detailedSets.length > 0) {
        savedEx.detailedSets.forEach((s) => {
          if (s.weight > 0) {
            exerciseVolume += s.weight * (s.reps || 5);
          }
        });
      } else if (savedEx.sets && savedEx.sets.length > 0) {
        savedEx.sets.forEach((wgt) => {
          if (wgt > 0) {
            exerciseVolume += wgt * 5;
          }
        });
      }

      activations.forEach((act) => {
        if (volumes[act.muscle] !== undefined) {
          volumes[act.muscle] += Math.round(exerciseVolume * act.ratio);
        }
      });
    });
  });

  return volumes;
}

/**
 * Calculates Muscle Group Levels (Bölgesel Kas Seviyeleri) and EXP progression
 * Proportional EXP and volume is attributed based on scientific muscle activation ratios
 */
export function calculateMuscleLevels(
  workouts: Workout[],
  allExercises: ExerciseDefinition[]
): MuscleLevelInfo[] {
  const muscleGroups: MuscleGroup[] = [
    'chest',
    'back',
    'shoulder',
    'biceps',
    'triceps',
    'quads',
    'hamstring',
    'glutes',
    'calves',
    'abs'
  ];

  const muscleEXP: Record<MuscleGroup, number> = {
    chest: 0, back: 0, shoulder: 0, biceps: 0, triceps: 0,
    quads: 0, hamstring: 0, glutes: 0, calves: 0, abs: 0, cardio: 0
  };

  const muscleVolumes: Record<MuscleGroup, number> = {
    chest: 0, back: 0, shoulder: 0, biceps: 0, triceps: 0,
    quads: 0, hamstring: 0, glutes: 0, calves: 0, abs: 0, cardio: 0
  };

  const muscleEffectiveSets: Record<MuscleGroup, number> = {
    chest: 0, back: 0, shoulder: 0, biceps: 0, triceps: 0,
    quads: 0, hamstring: 0, glutes: 0, calves: 0, abs: 0, cardio: 0
  };

  // Traverse all workouts
  workouts.forEach((w) => {
    w.exercises.forEach((savedEx) => {
      const exDef = allExercises.find((e) => e.id === savedEx.id);
      const isDuration = isDurationExercise(exDef || savedEx.id);
      const activations = exDef?.muscles && exDef.muscles.length > 0
        ? exDef.muscles
        : [{ muscle: savedEx.muscle || exDef?.muscle || 'chest', ratio: 1.0, role: 'primary' as const }];

      const sets = savedEx.detailedSets && savedEx.detailedSets.length > 0
        ? savedEx.detailedSets.filter((s) => isSetValid(s, isDuration))
        : (savedEx.sets || []).filter((wgt) => wgt > 0).map((wgt) => ({ weight: isDuration ? 0 : wgt, reps: isDuration ? wgt : 5 }));

      sets.forEach((set) => {
        const secOrReps = isDuration ? getSetDurationSeconds(set as any, true) : (set.reps || 5);
        const setEXP = calculateSetEXP(set.weight, secOrReps, isDuration);
        const setVolume = isDuration ? 0 : set.weight * (set.reps || 5);

        activations.forEach((act) => {
          if (muscleEXP[act.muscle] !== undefined) {
            muscleEXP[act.muscle] += Math.round(setEXP * act.ratio);
            muscleVolumes[act.muscle] += Math.round(setVolume * act.ratio);
            // Effective sets: primary = 1.0, secondary = 0.5, stabilizer = 0.25
            const setFactor = act.role === 'primary' ? 1.0 : (act.ratio >= 0.20 ? 0.5 : 0.25);
            muscleEffectiveSets[act.muscle] += setFactor;
          }
        });
      });
    });
  });

  return muscleGroups.map((muscle) => {
    const totalEXP = muscleEXP[muscle] || 0;
    const calculatedLevel = Math.floor(totalEXP / EXP_PER_LEVEL) + 1;
    const level = Math.min(1000, Math.max(1, calculatedLevel));
    const levelBaseEXP = (level - 1) * EXP_PER_LEVEL;
    const nextLevelEXP = level * EXP_PER_LEVEL;

    let progressPercent = level === 1000 ? 100 : Math.round(((totalEXP - levelBaseEXP) / EXP_PER_LEVEL) * 100);
    progressPercent = Math.min(100, Math.max(0, progressPercent));

    const rank = getRankByLevel(level);

    // Muscle name mapping
    const names: Record<MuscleGroup, string> = {
      chest: 'Göğüs',
      back: 'Sırt & Kanat',
      shoulder: 'Omuz',
      biceps: 'Biceps (Ön Kol)',
      triceps: 'Triceps (Arka Kol)',
      quads: 'Ön Bacak (Quads)',
      hamstring: 'Arka Bacak (Hamstrings)',
      glutes: 'Kalça (Glutes)',
      calves: 'Kalf (Baldır)',
      abs: 'Karın & Core',
      cardio: 'Kardiyo'
    };

    return {
      muscle,
      name: names[muscle] || muscle,
      level,
      currentEXP: totalEXP,
      levelBaseEXP,
      nextLevelEXP,
      progressPercent,
      totalVolumeKg: muscleVolumes[muscle] || 0,
      totalEffectiveSets: Math.round(muscleEffectiveSets[muscle] * 10) / 10,
      rankTitle: rank.title,
      rankBadge: rank.badge,
      color: rank.color
    };
  });
}

