import { Workout, ExerciseDefinition, ExerciseLevelInfo, OverallPlayerStats } from '../types/workout';
import { getRankByLevel } from '../data/rankTiers';
import { calculateStreak } from './dateUtils';

export const EXP_PER_LEVEL = 500;
export const OVERALL_EXP_PER_LEVEL = 1000;

/**
 * Calculates EXP for a single set based on weight and reps
 */
export function calculateSetEXP(weight: number, reps: number = 5): number {
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
            if (set.weight > 0) {
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
          // Legacy format (array of weights with 5 reps assumed)
          savedEx.sets.forEach((wgt) => {
            if (wgt > 0) {
              const exp = calculateSetEXP(wgt, 5);
              totalEXP += exp;
              totalVolume += wgt * 5;
              totalSets++;

              if (wgt > maxWeight) {
                maxWeight = wgt;
                prReps = 5;
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
    totalVolumeKg += info.totalVolume;
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
  for (const w of workouts) {
    if (excludeWorkoutId && w.id === excludeWorkoutId) continue;
    for (const ex of w.exercises) {
      if (ex.id === exerciseId) {
        if (ex.detailedSets && ex.detailedSets.length > 0) {
          const weights = ex.detailedSets.map(s => s.weight);
          const reps = ex.detailedSets.map(s => s.reps || 5);
          if (weights.some(w => w > 0)) {
            return { weights, reps, date: w.date };
          }
        } else if (ex.sets && ex.sets.length > 0 && ex.sets.some(w => w > 0)) {
          return { weights: ex.sets, reps: ex.sets.map(() => 5), date: w.date };
        }
      }
    }
  }
  return null;
}
