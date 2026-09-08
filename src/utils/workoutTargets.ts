import { MuscleGroup, SplitType, ExerciseDefinition, ExerciseSet } from '../types/workout';
import { muscleMetadata } from '../data/muscleMetadata';

export interface MuscleTargetProgress {
  muscle: MuscleGroup;
  muscleName: string;
  targetExercises: number;
  completedExercises: number;
  targetSets: number;
  completedSets: number;
  progressPct: number;
  isCompleted: boolean;
}

export interface WorkoutSessionTarget {
  splitType: SplitType;
  splitTitle: string;
  targetExercisesCount: number;
  completedExercisesCount: number;
  targetSetsCount: number;
  completedSetsCount: number;
  remainingSetsCount: number;
  overallProgressPercent: number; // 0 - 100
  statusText: string;
  statusColor: string;
  isTargetMet: boolean;
  muscleTargets: MuscleTargetProgress[];
}

/**
 * Standard ideal scientific target sets and exercises per muscle group in a single session
 */
interface MuscleSessionStandard {
  targetExercises: number;
  targetSets: number;
}

const DEFAULT_STANDARDS: Record<MuscleGroup, MuscleSessionStandard> = {
  // Major compound muscle groups
  chest: { targetExercises: 2, targetSets: 4 },
  back: { targetExercises: 2, targetSets: 4 },
  quads: { targetExercises: 2, targetSets: 4 },
  
  // Moderate size muscle groups
  shoulder: { targetExercises: 1, targetSets: 3 },
  hamstring: { targetExercises: 1, targetSets: 3 },
  glutes: { targetExercises: 1, targetSets: 3 },
  
  // Isolation & Core
  biceps: { targetExercises: 1, targetSets: 3 },
  triceps: { targetExercises: 1, targetSets: 3 },
  calves: { targetExercises: 1, targetSets: 3 },
  abs: { targetExercises: 1, targetSets: 3 },
  cardio: { targetExercises: 1, targetSets: 2 }
};

/**
 * Default muscles assigned for each split type if no specific recommendation is provided
 */
const SPLIT_DEFAULT_MUSCLES: Record<SplitType, MuscleGroup[]> = {
  upper: ['chest', 'back', 'shoulder', 'biceps', 'triceps'],
  lower: ['quads', 'hamstring', 'glutes', 'calves'],
  full: ['chest', 'back', 'quads', 'shoulder', 'abs'],
  custom: ['abs', 'chest', 'back']
};

/**
 * Calculates session goals (target exercises & sets) versus what the user has completed so far.
 */
export function calculateWorkoutSessionTarget(
  splitType: SplitType,
  draftExerciseSets: Record<string, ExerciseSet[]>,
  allExercises: ExerciseDefinition[],
  recommendedMuscles: MuscleGroup[] = []
): WorkoutSessionTarget {
  // 1. Determine target muscles for this workout
  const targetMusclesList = recommendedMuscles.length > 0
    ? recommendedMuscles
    : (SPLIT_DEFAULT_MUSCLES[splitType] || SPLIT_DEFAULT_MUSCLES.upper);

  // 2. Tally completed sets and exercises from current draft
  // Map exerciseId -> count of valid sets (weight > 0)
  const exerciseValidSetsCount: Record<string, number> = {};
  let totalCompletedSets = 0;

  Object.entries(draftExerciseSets).forEach(([exId, sets]) => {
    const valid = sets.filter((s) => s.weight > 0);
    if (valid.length > 0) {
      exerciseValidSetsCount[exId] = valid.length;
      totalCompletedSets += valid.length;
    }
  });

  const completedDistinctExercisesCount = Object.keys(exerciseValidSetsCount).length;

  // Tally sets and exercises per muscle
  const muscleCompletedMap: Partial<Record<MuscleGroup, { exercises: Set<string>; sets: number }>> = {};

  Object.entries(exerciseValidSetsCount).forEach(([exId, count]) => {
    const ex = allExercises.find((e) => e.id === exId);
    if (!ex) return;

    const activations = ex.muscles && ex.muscles.length > 0
      ? ex.muscles
      : [{ muscle: ex.muscle, ratio: 1.0, role: 'primary' as const }];

    activations.forEach((act) => {
      if (!muscleCompletedMap[act.muscle]) {
        muscleCompletedMap[act.muscle] = { exercises: new Set(), sets: 0 };
      }
      if (act.role === 'primary') {
        muscleCompletedMap[act.muscle]!.exercises.add(exId);
        muscleCompletedMap[act.muscle]!.sets += count;
      } else if (act.ratio >= 0.25) {
        // Significant secondary contributes half a set
        muscleCompletedMap[act.muscle]!.sets += Math.round(count * 0.5 * 10) / 10;
      }
    });
  });

  // 3. Compute per-muscle targets for the recommended / focus muscles
  const muscleTargets: MuscleTargetProgress[] = targetMusclesList.map((muscle) => {
    const meta = muscleMetadata[muscle] || { name: muscle };
    const standard = DEFAULT_STANDARDS[muscle] || { targetExercises: 1, targetSets: 3 };

    const compInfo = muscleCompletedMap[muscle] || { exercises: new Set<string>(), sets: 0 };
    const compExercises = compInfo.exercises.size;
    const compSets = Math.round(compInfo.sets);

    const progressPct = standard.targetSets > 0
      ? Math.min(100, Math.round((compSets / standard.targetSets) * 100))
      : 0;

    return {
      muscle,
      muscleName: meta.name,
      targetExercises: standard.targetExercises,
      completedExercises: compExercises,
      targetSets: standard.targetSets,
      completedSets: compSets,
      progressPct,
      isCompleted: compSets >= standard.targetSets
    };
  });

  // 4. Calculate total target exercises and sets
  const targetExercisesCount = muscleTargets.reduce((sum, mt) => sum + mt.targetExercises, 0);
  const targetSetsCount = muscleTargets.reduce((sum, mt) => sum + mt.targetSets, 0);

  // Overall progress is based 70% on set volume and 30% on exercise coverage
  const setProgress = targetSetsCount > 0 ? (totalCompletedSets / targetSetsCount) : 0;
  const exProgress = targetExercisesCount > 0 ? (completedDistinctExercisesCount / targetExercisesCount) : 0;
  const weightedProgress = Math.min(1, setProgress * 0.7 + exProgress * 0.3);
  const overallProgressPercent = Math.min(100, Math.round(weightedProgress * 100));

  const remainingSetsCount = Math.max(0, targetSetsCount - totalCompletedSets);
  const isTargetMet = totalCompletedSets >= targetSetsCount && completedDistinctExercisesCount >= Math.min(3, targetExercisesCount);

  // 5. Friendly status message and theme color
  let statusText = 'Antrenmana Başla';
  let statusColor = '#38bdf8'; // Sky cyan

  if (totalCompletedSets === 0) {
    statusText = `Hedef: ${targetExercisesCount} Hareket • ${targetSetsCount} Set`;
    statusColor = '#38bdf8';
  } else if (isTargetMet) {
    statusText = totalCompletedSets > targetSetsCount 
      ? `Hedef Aşıldı! 🏆 (+${totalCompletedSets - targetSetsCount} Set)` 
      : 'Hedef Tamamlandı! 🏆';
    statusColor = '#10b981'; // Emerald
  } else if (overallProgressPercent >= 75) {
    statusText = `Bitişe Çok Az Kaldı! ⚡ (${remainingSetsCount} Set)`;
    statusColor = '#10b981';
  } else if (overallProgressPercent >= 50) {
    statusText = `Yarılandı! 🔥 (${totalCompletedSets}/${targetSetsCount} Set)`;
    statusColor = '#f59e0b'; // Amber
  } else if (overallProgressPercent >= 25) {
    statusText = `İyi Ritim! ⚡ (${totalCompletedSets}/${targetSetsCount} Set)`;
    statusColor = '#06b6d4'; // Cyan
  } else {
    statusText = `Isınma & Başlangıç (${totalCompletedSets}/${targetSetsCount} Set)`;
    statusColor = '#38bdf8';
  }

  const splitTitles: Record<SplitType, string> = {
    upper: 'Üst Vücut (İtiş & Çekiş)',
    lower: 'Alt Vücut (Bacak & Kalça)',
    full: 'Tüm Vücut (Full Body)',
    custom: 'Core & Özel Seans'
  };

  return {
    splitType,
    splitTitle: splitTitles[splitType] || 'Günün Antrenmanı',
    targetExercisesCount,
    completedExercisesCount: completedDistinctExercisesCount,
    targetSetsCount,
    completedSetsCount: totalCompletedSets,
    remainingSetsCount,
    overallProgressPercent,
    statusText,
    statusColor,
    isTargetMet,
    muscleTargets
  };
}
