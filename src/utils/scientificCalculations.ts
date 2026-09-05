import { 
  Workout, 
  ExerciseDefinition, 
  AthleteProfile, 
  ExerciseStrengthAnalysis, 
  StrengthTier, 
  MuscleGroup, 
  MuscleVolumeStatus,
  VolumeLandmark
} from '../types/workout';
import { 
  strengthTierConfigs, 
  getExerciseStandards 
} from '../data/strengthStandards';
import { muscleMetadata } from '../data/muscleMetadata';

/**
 * Calculates Estimated 1RM (One Rep Max) using Epley Formula
 * For reps = 1, it equals the lifted weight.
 */
export function calculate1RM(weight: number, reps: number = 5): number {
  if (weight <= 0) return 0;
  const safeReps = Math.max(1, reps);
  if (safeReps === 1) return weight;
  // Epley formula: 1RM = weight * (1 + reps / 30)
  const epley = weight * (1 + safeReps / 30);
  return Math.round(epley * 10) / 10;
}

/**
 * Finds the highest 1RM ever achieved for an exercise across all workout logs
 */
export function getBest1RMForExercise(
  exerciseId: string, 
  workouts: Workout[]
): { best1RM: number; weight: number; reps: number; date?: string } {
  let best1RM = 0;
  let bestWeight = 0;
  let bestReps = 0;
  let bestDate: string | undefined;

  workouts.forEach((w) => {
    w.exercises.forEach((ex) => {
      if (ex.id === exerciseId) {
        if (ex.detailedSets && ex.detailedSets.length > 0) {
          ex.detailedSets.forEach((s) => {
            if (s.weight > 0) {
              const est1RM = calculate1RM(s.weight, s.reps || 5);
              if (est1RM > best1RM) {
                best1RM = est1RM;
                bestWeight = s.weight;
                bestReps = s.reps || 5;
                bestDate = w.date;
              }
            }
          });
        } else if (ex.sets && ex.sets.length > 0) {
          ex.sets.forEach((wgt) => {
            if (wgt > 0) {
              const est1RM = calculate1RM(wgt, 5);
              if (est1RM > best1RM) {
                best1RM = est1RM;
                bestWeight = wgt;
                bestReps = 5;
                bestDate = w.date;
              }
            }
          });
        }
      }
    });
  });

  return { best1RM, weight: bestWeight, reps: bestReps, date: bestDate };
}

/**
 * Calculates GymLevels scientific classification for an exercise based on athlete profile
 */
export function getExerciseStrengthAnalysis(
  exercise: ExerciseDefinition,
  workouts: Workout[],
  profile: AthleteProfile
): ExerciseStrengthAnalysis {
  const { best1RM, weight: bestSetWeight, reps: bestSetReps } = getBest1RMForExercise(exercise.id, workouts);
  const bodyWeight = Math.max(30, profile.bodyWeightKg || 75);
  const gender = profile.gender || 'male';

  const standards = getExerciseStandards(exercise.id)[gender];
  const bodyweightRatio = Math.round((best1RM / bodyWeight) * 100) / 100;

  // Multipliers
  const mBeginner = standards.beginner;
  const mNovice = standards.novice;
  const mIntermediate = standards.intermediate;
  const mAdvanced = standards.advanced;
  const mElite = standards.elite;

  let tier: StrengthTier = 'beginner';
  let tierProgressPct = 0;
  let nextTierWeight = Math.round(mBeginner * bodyWeight);
  let nextTierTitle = strengthTierConfigs.novice.title;
  let strengthScore = 0;

  if (bodyweightRatio < mBeginner) {
    tier = 'beginner';
    tierProgressPct = Math.min(100, Math.max(0, Math.round((bodyweightRatio / mBeginner) * 100)));
    nextTierWeight = Math.round(mBeginner * bodyWeight);
    nextTierTitle = strengthTierConfigs.beginner.title;
    strengthScore = Math.round((bodyweightRatio / mBeginner) * 20);
  } else if (bodyweightRatio < mNovice) {
    tier = 'beginner';
    const range = mNovice - mBeginner;
    tierProgressPct = Math.min(100, Math.max(0, Math.round(((bodyweightRatio - mBeginner) / range) * 100)));
    nextTierWeight = Math.round(mNovice * bodyWeight);
    nextTierTitle = strengthTierConfigs.novice.title;
    strengthScore = Math.round(20 + ((bodyweightRatio - mBeginner) / range) * 20);
  } else if (bodyweightRatio < mIntermediate) {
    tier = 'novice';
    const range = mIntermediate - mNovice;
    tierProgressPct = Math.min(100, Math.max(0, Math.round(((bodyweightRatio - mNovice) / range) * 100)));
    nextTierWeight = Math.round(mIntermediate * bodyWeight);
    nextTierTitle = strengthTierConfigs.intermediate.title;
    strengthScore = Math.round(40 + ((bodyweightRatio - mNovice) / range) * 20);
  } else if (bodyweightRatio < mAdvanced) {
    tier = 'intermediate';
    const range = mAdvanced - mIntermediate;
    tierProgressPct = Math.min(100, Math.max(0, Math.round(((bodyweightRatio - mIntermediate) / range) * 100)));
    nextTierWeight = Math.round(mAdvanced * bodyWeight);
    nextTierTitle = strengthTierConfigs.advanced.title;
    strengthScore = Math.round(60 + ((bodyweightRatio - mIntermediate) / range) * 20);
  } else if (bodyweightRatio < mElite) {
    tier = 'advanced';
    const range = mElite - mAdvanced;
    tierProgressPct = Math.min(100, Math.max(0, Math.round(((bodyweightRatio - mAdvanced) / range) * 100)));
    nextTierWeight = Math.round(mElite * bodyWeight);
    nextTierTitle = strengthTierConfigs.elite.title;
    strengthScore = Math.round(80 + ((bodyweightRatio - mAdvanced) / range) * 20);
  } else {
    tier = 'elite';
    tierProgressPct = 100;
    nextTierWeight = Math.round(mElite * bodyWeight);
    nextTierTitle = 'Maksimum Zirve';
    strengthScore = Math.min(100, Math.round(95 + (bodyweightRatio - mElite) * 10));
  }

  const config = strengthTierConfigs[tier];

  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    estimated1RM: best1RM,
    bestSetWeight,
    bestSetReps,
    bodyweightRatio,
    strengthScore: Math.min(100, Math.max(0, strengthScore)),
    tier,
    tierTitle: config.title,
    tierBadge: config.badge,
    tierColor: config.color,
    tierGradient: config.gradient,
    tierProgressPct,
    nextTierWeight,
    nextTierTitle
  };
}

/**
 * Calculates overall player strength score & balanced tier
 */
export function calculateOverallGymLevels(
  workouts: Workout[],
  allExercises: ExerciseDefinition[],
  profile: AthleteProfile
): {
  overallStrengthScore: number;
  overallTier: StrengthTier;
  overallTierTitle: string;
  overallTierBadge: string;
  overallTierColor: string;
  overallTierGradient: string;
  strongestLift: ExerciseStrengthAnalysis | null;
  needsWorkLift: ExerciseStrengthAnalysis | null;
  totalAnalyzedExercises: number;
} {
  const analyses: ExerciseStrengthAnalysis[] = [];

  allExercises.forEach((ex) => {
    const analysis = getExerciseStrengthAnalysis(ex, workouts, profile);
    if (analysis.estimated1RM > 0) {
      analyses.push(analysis);
    }
  });

  if (analyses.length === 0) {
    const defaultTier = strengthTierConfigs.beginner;
    return {
      overallStrengthScore: 0,
      overallTier: 'beginner',
      overallTierTitle: defaultTier.title,
      overallTierBadge: defaultTier.badge,
      overallTierColor: defaultTier.color,
      overallTierGradient: defaultTier.gradient,
      strongestLift: null,
      needsWorkLift: null,
      totalAnalyzedExercises: 0
    };
  }

  // Sort by score
  analyses.sort((a, b) => b.strengthScore - a.strengthScore);

  const totalScore = analyses.reduce((sum, a) => sum + a.strengthScore, 0);
  const avgScore = Math.round(totalScore / analyses.length);

  let overallTier: StrengthTier = 'beginner';
  if (avgScore >= 80) overallTier = 'elite';
  else if (avgScore >= 60) overallTier = 'advanced';
  else if (avgScore >= 40) overallTier = 'intermediate';
  else if (avgScore >= 20) overallTier = 'novice';
  else overallTier = 'beginner';

  const config = strengthTierConfigs[overallTier];

  return {
    overallStrengthScore: avgScore,
    overallTier,
    overallTierTitle: config.title,
    overallTierBadge: config.badge,
    overallTierColor: config.color,
    overallTierGradient: config.gradient,
    strongestLift: analyses[0] || null,
    needsWorkLift: analyses[analyses.length - 1] || null,
    totalAnalyzedExercises: analyses.length
  };
}

/**
 * Weekly Hypertrophy Volume Landmarks (Dr. Mike Israetel / RP)
 * Calculates sets per muscle group over the last 7 active days.
 */
export function calculateWeeklyVolumeLandmarks(
  workouts: Workout[],
  allExercises: ExerciseDefinition[]
): MuscleVolumeStatus[] {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  // Map of sets per muscle group in last 7 days
  const weeklySets: Partial<Record<MuscleGroup, number>> = {};

  const recentWorkouts = workouts.filter((w) => w.date >= sevenDaysAgoStr);
  const workoutSource = recentWorkouts.length > 0 ? recentWorkouts : workouts.slice(0, 3); // fallback to last 3 if inactive

  workoutSource.forEach((w) => {
    w.exercises.forEach((savedEx) => {
      const exDef = allExercises.find((e) => e.id === savedEx.id);
      const activations = exDef?.muscles && exDef.muscles.length > 0
        ? exDef.muscles
        : [{ muscle: savedEx.muscle || exDef?.muscle || 'chest', ratio: 1.0, role: 'primary' as const }];

      let validSetsCount = 0;
      if (savedEx.detailedSets && savedEx.detailedSets.length > 0) {
        validSetsCount = savedEx.detailedSets.filter((s) => s.weight > 0).length;
      } else if (savedEx.sets && savedEx.sets.length > 0) {
        validSetsCount = savedEx.sets.filter((wgt) => wgt > 0).length;
      }

      if (validSetsCount > 0) {
        activations.forEach((act) => {
          // Primary gets 1.0 set. Significant synergist (ratio >= 0.20) gets 0.5 effective set.
          // Minor synergist / stabilizer gets 0.25 effective set.
          const effectiveMultiplier = act.role === 'primary' ? 1.0 : (act.ratio >= 0.20 ? 0.5 : 0.25);
          const effectiveSets = validSetsCount * effectiveMultiplier;
          weeklySets[act.muscle] = (weeklySets[act.muscle] || 0) + effectiveSets;
        });
      }
    });
  });

  const muscleGroups: MuscleGroup[] = [
    'chest', 'back', 'shoulder', 'biceps', 'triceps', 'quads', 'hamstring', 'glutes', 'calves', 'abs'
  ];

  return muscleGroups.map((muscle) => {
    const meta = muscleMetadata[muscle] || muscleMetadata.chest;
    const sets = Math.round((weeklySets[muscle] || 0) * 10) / 10;

    let landmark: VolumeLandmark = 'under_mev';
    let landmarkLabel = 'Hacim Düşük (< MEV)';
    let landmarkColor = '#64748b';
    let feedback = 'Gelişim için haftada en az 6-10 set çalışılmalı.';

    if (sets === 0) {
      landmark = 'under_mev';
      landmarkLabel = 'Çalışılmadı';
      landmarkColor = '#64748b';
      feedback = 'Bu kas grubu bu hafta hiç uyarılmadı.';
    } else if (sets < 8) {
      landmark = 'under_mev';
      landmarkLabel = 'Düşük Hacim (< MEV)';
      landmarkColor = '#38bdf8';
      feedback = 'Temel koruma sağlar, kas inşası için hacim artırılabilir.';
    } else if (sets <= 12) {
      landmark = 'mev';
      landmarkLabel = 'Etkili Hacim (MEV)';
      landmarkColor = '#10b981';
      feedback = 'İdeal başlangıç büyüme uyarısı.';
    } else if (sets <= 20) {
      landmark = 'mav';
      landmarkLabel = 'Maksimum Büyüme (MAV)';
      landmarkColor = '#fbbf24';
      feedback = 'Altın aralık! En yüksek hipertrofi adaptasyonu.';
    } else {
      landmark = 'mrv_risk';
      landmarkLabel = 'Sürantrenman Sınırı (MRV)';
      landmarkColor = '#ef4444';
      feedback = 'Yüksek yıpranma! Toparlanma yetersiz kalabilir, dinlenmeye dikkat.';
    }

    return {
      muscle,
      muscleName: meta.name,
      weeklySets: sets,
      landmark,
      landmarkLabel,
      landmarkColor,
      recommendedRange: '10 - 18 Set',
      feedback
    };
  });
}

/**
 * Plateau Detector
 * Checks if an exercise has not increased in estimated 1RM for 3 or more consecutive workouts
 */
export function detectExercisePlateau(
  exerciseId: string,
  workouts: Workout[]
): { isPlateau: boolean; consecutiveCount: number; max1RM: number } {
  // Collect history of this exercise chronologically
  const session1RMs: number[] = [];

  // workouts are sorted newest first
  for (const w of workouts) {
    const ex = w.exercises.find((e) => e.id === exerciseId);
    if (ex) {
      let maxSession1RM = 0;
      if (ex.detailedSets && ex.detailedSets.length > 0) {
        ex.detailedSets.forEach((s) => {
          if (s.weight > 0) {
            maxSession1RM = Math.max(maxSession1RM, calculate1RM(s.weight, s.reps || 5));
          }
        });
      } else if (ex.sets && ex.sets.length > 0) {
        ex.sets.forEach((wgt) => {
          if (wgt > 0) {
            maxSession1RM = Math.max(maxSession1RM, calculate1RM(wgt, 5));
          }
        });
      }

      if (maxSession1RM > 0) {
        session1RMs.push(maxSession1RM);
        if (session1RMs.length >= 4) break;
      }
    }
  }

  if (session1RMs.length < 3) {
    return { isPlateau: false, consecutiveCount: session1RMs.length, max1RM: session1RMs[0] || 0 };
  }

  // If the last 3 workouts had identical or decreasing 1RM
  const latest = session1RMs[0];
  const prev1 = session1RMs[1];
  const prev2 = session1RMs[2];

  const isStagnant = latest <= prev1 && prev1 <= prev2;

  return {
    isPlateau: isStagnant,
    consecutiveCount: isStagnant ? 3 : 1,
    max1RM: Math.max(...session1RMs)
  };
}
