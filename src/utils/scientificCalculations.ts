import { 
  Workout, 
  ExerciseDefinition, 
  AthleteProfile, 
  ExerciseStrengthAnalysis, 
  StrengthTier, 
  MuscleGroup, 
  MuscleVolumeStatus,
  VolumeLandmark,
  BodyCompositionAnalysis,
  BodyMeasurementEntry,
  Gender
} from '../types/workout';
import { 
  strengthTierConfigs, 
  getExerciseStandards,
  getDurationStandards
} from '../data/strengthStandards';
import { muscleMetadata } from '../data/muscleMetadata';
import { getTodayLocalDate, shiftDateByDays } from './dateUtils';
import { isDurationExercise, isSetValid, getSetDurationSeconds } from './calculations';

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
  const isDuration = isDurationExercise(exerciseId);
  let best1RM = 0;
  let bestWeight = 0;
  let bestReps = 0;
  let bestDate: string | undefined;

  workouts.forEach((w) => {
    w.exercises.forEach((ex) => {
      if (ex.id === exerciseId) {
        if (ex.detailedSets && ex.detailedSets.length > 0) {
          ex.detailedSets.forEach((s) => {
            if (isDuration) {
              const secs = getSetDurationSeconds(s, true);
              if (secs > best1RM) {
                best1RM = secs;
                bestWeight = 0;
                bestReps = secs;
                bestDate = w.date;
              }
            } else if (s.weight > 0) {
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
              if (isDuration) {
                if (wgt > best1RM) {
                  best1RM = wgt;
                  bestWeight = 0;
                  bestReps = wgt;
                  bestDate = w.date;
                }
              } else {
                const est1RM = calculate1RM(wgt, 5);
                if (est1RM > best1RM) {
                  best1RM = est1RM;
                  bestWeight = wgt;
                  bestReps = 5;
                  bestDate = w.date;
                }
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
  const isDuration = isDurationExercise(exercise);
  const { best1RM, weight: bestSetWeight, reps: bestSetReps } = getBest1RMForExercise(exercise.id, workouts);
  const bodyWeight = Math.max(30, profile.bodyWeightKg || 75);
  const gender = profile.gender || 'male';

  if (isDuration) {
    const dStandards = getDurationStandards(exercise.id);
    const bestSecs = best1RM;
    const sBeginner = dStandards.beginner;
    const sNovice = dStandards.novice;
    const sIntermediate = dStandards.intermediate;
    const sAdvanced = dStandards.advanced;
    const sElite = dStandards.elite;

    let tier: StrengthTier = 'beginner';
    let tierProgressPct = 0;
    let nextTierWeight = sBeginner;
    let nextTierTitle = strengthTierConfigs.novice.title;
    let strengthScore = 0;

    if (bestSecs < sBeginner) {
      tier = 'beginner';
      tierProgressPct = Math.min(100, Math.max(0, Math.round((bestSecs / sBeginner) * 100)));
      nextTierWeight = sBeginner;
      nextTierTitle = strengthTierConfigs.beginner.title;
      strengthScore = Math.round((bestSecs / sBeginner) * 20);
    } else if (bestSecs < sNovice) {
      tier = 'beginner';
      const range = sNovice - sBeginner;
      tierProgressPct = Math.min(100, Math.max(0, Math.round(((bestSecs - sBeginner) / range) * 100)));
      nextTierWeight = sNovice;
      nextTierTitle = strengthTierConfigs.novice.title;
      strengthScore = Math.round(20 + ((bestSecs - sBeginner) / range) * 20);
    } else if (bestSecs < sIntermediate) {
      tier = 'novice';
      const range = sIntermediate - sNovice;
      tierProgressPct = Math.min(100, Math.max(0, Math.round(((bestSecs - sNovice) / range) * 100)));
      nextTierWeight = sIntermediate;
      nextTierTitle = strengthTierConfigs.intermediate.title;
      strengthScore = Math.round(40 + ((bestSecs - sNovice) / range) * 20);
    } else if (bestSecs < sAdvanced) {
      tier = 'intermediate';
      const range = sAdvanced - sIntermediate;
      tierProgressPct = Math.min(100, Math.max(0, Math.round(((bestSecs - sIntermediate) / range) * 100)));
      nextTierWeight = sAdvanced;
      nextTierTitle = strengthTierConfigs.advanced.title;
      strengthScore = Math.round(60 + ((bestSecs - sIntermediate) / range) * 20);
    } else if (bestSecs < sElite) {
      tier = 'advanced';
      const range = sElite - sAdvanced;
      tierProgressPct = Math.min(100, Math.max(0, Math.round(((bestSecs - sAdvanced) / range) * 100)));
      nextTierWeight = sElite;
      nextTierTitle = strengthTierConfigs.elite.title;
      strengthScore = Math.round(80 + ((bestSecs - sAdvanced) / range) * 20);
    } else {
      tier = 'elite';
      tierProgressPct = 100;
      nextTierWeight = sElite;
      nextTierTitle = 'Maksimum Zirve';
      strengthScore = Math.min(100, Math.round(95 + ((bestSecs - sElite) / 60) * 5));
    }

    const config = strengthTierConfigs[tier];

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      estimated1RM: bestSecs,
      bestSetWeight: 0,
      bestSetReps: bestSecs,
      bodyweightRatio: Math.round((bestSecs / 60) * 100) / 100,
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
  const weightAnalyses = analyses.filter((a) => !isDurationExercise(a.exerciseId));

  return {
    overallStrengthScore: avgScore,
    overallTier,
    overallTierTitle: config.title,
    overallTierBadge: config.badge,
    overallTierColor: config.color,
    overallTierGradient: config.gradient,
    strongestLift: weightAnalyses[0] || analyses[0] || null,
    needsWorkLift: weightAnalyses[weightAnalyses.length - 1] || analyses[analyses.length - 1] || null,
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
  const sevenDaysAgoStr = shiftDateByDays(getTodayLocalDate(), -7);

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

      const isDuration = isDurationExercise(exDef || savedEx.id);
      let validSetsCount = 0;
      if (savedEx.detailedSets && savedEx.detailedSets.length > 0) {
        validSetsCount = savedEx.detailedSets.filter((s) => isSetValid(s, isDuration)).length;
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
  const isDuration = isDurationExercise(exerciseId);
  // Collect history of this exercise chronologically
  const session1RMs: number[] = [];

  // workouts are sorted newest first
  for (const w of workouts) {
    const ex = w.exercises.find((e) => e.id === exerciseId);
    if (ex) {
      let maxSession1RM = 0;
      if (ex.detailedSets && ex.detailedSets.length > 0) {
        ex.detailedSets.forEach((s) => {
          if (isDuration) {
            const secs = getSetDurationSeconds(s, true);
            if (secs > 0) {
              maxSession1RM = Math.max(maxSession1RM, secs);
            }
          } else if (s.weight > 0) {
            maxSession1RM = Math.max(maxSession1RM, calculate1RM(s.weight, s.reps || 5));
          }
        });
      } else if (ex.sets && ex.sets.length > 0) {
        ex.sets.forEach((wgt) => {
          if (wgt > 0) {
            maxSession1RM = Math.max(maxSession1RM, isDuration ? wgt : calculate1RM(wgt, 5));
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

/**
 * Estimates body fat percentage using the US Navy Circumference Method
 */
export function estimateNavyBodyFatPct(
  gender: Gender,
  heightCm: number,
  waistCm: number,
  neckCm: number,
  hipCm?: number
): number | null {
  if (!heightCm || !waistCm || !neckCm || heightCm < 120 || waistCm <= neckCm) {
    return null;
  }

  if (gender === 'male') {
    const diff = waistCm - neckCm;
    if (diff <= 0) return null;
    const bf = 495 / (1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(heightCm)) - 450;
    return Math.round(Math.min(45, Math.max(4, bf)) * 10) / 10;
  } else {
    const effectiveHip = hipCm && hipCm > 50 ? hipCm : waistCm * 1.22;
    const sum = waistCm + effectiveHip - neckCm;
    if (sum <= 0) return null;
    const bf = 495 / (1.29579 - 0.35004 * Math.log10(sum) + 0.22100 * Math.log10(heightCm)) - 450;
    return Math.round(Math.min(50, Math.max(10, bf)) * 10) / 10;
  }
}

/**
 * Estimates Lean Body Mass (LBM) using the scientific Boer Formula when body fat % is unknown
 */
export function estimateBoerLeanBodyMass(gender: Gender, weightKg: number, heightCm: number): number {
  if (gender === 'male') {
    return Math.max(30, 0.407 * weightKg + 0.267 * heightCm - 19.2);
  }
  return Math.max(25, 0.252 * weightKg + 0.473 * heightCm - 48.3);
}

/**
 * Computes full body composition metrics (BMI, LBM, FFMI, Skeletal Muscle Mass, Recomposition Deltas)
 */
export function calculateBodyCompositionMetrics(
  profile: AthleteProfile,
  override?: {
    weightKg?: number;
    heightCm?: number;
    bodyFatPct?: number;
    muscleMassKg?: number;
    gender?: Gender;
  }
): BodyCompositionAnalysis {
  const gender: Gender = override?.gender || profile.gender || 'male';
  const weightKg = Math.max(30, override?.weightKg ?? profile.bodyWeightKg ?? 75);
  const defaultHeight = gender === 'male' ? 178 : 165;
  const heightCm = Math.max(130, Math.min(230, override?.heightCm ?? profile.heightCm ?? defaultHeight));
  const heightM = heightCm / 100;

  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  let bmiCategory = 'Normal';
  if (bmi < 18.5) bmiCategory = 'Zayıf';
  else if (bmi < 25) bmiCategory = 'İdeal';
  else if (bmi < 30) bmiCategory = 'Kaslı / Fazla Kilolu';
  else bmiCategory = 'Yüksek Kütle';

  // Determine Body Fat %
  const rawBf = override?.bodyFatPct !== undefined ? override.bodyFatPct : profile.bodyFatPct;
  const isBodyFatEstimated = !(rawBf && rawBf > 2 && rawBf < 60);
  let bodyFatPct: number;

  if (!isBodyFatEstimated && rawBf) {
    bodyFatPct = Math.round(rawBf * 10) / 10;
  } else {
    // Estimate from Boer LBM
    const boerLbm = estimateBoerLeanBodyMass(gender, weightKg, heightCm);
    const estBf = ((weightKg - boerLbm) / weightKg) * 100;
    bodyFatPct = Math.round(Math.min(42, Math.max(gender === 'male' ? 8 : 14, estBf)) * 10) / 10;
  }

  const fatMassKg = Math.round(weightKg * (bodyFatPct / 100) * 10) / 10;
  const leanBodyMassKg = Math.round((weightKg - fatMassKg) * 10) / 10;

  // Skeletal Muscle Mass (SMM) - either user provided or ~54% of LBM (InBody standard ratio)
  const rawMuscle = override?.muscleMassKg !== undefined ? override.muscleMassKg : profile.muscleMassKg;
  const isMuscleEstimated = !(rawMuscle && rawMuscle > 10 && rawMuscle < weightKg);
  const muscleMassKg = !isMuscleEstimated && rawMuscle
    ? Math.round(rawMuscle * 10) / 10
    : Math.round(leanBodyMassKg * (gender === 'male' ? 0.55 : 0.50) * 10) / 10;

  // FFMI (Fat-Free Mass Index) & Normalized FFMI (adjusted to 1.80m height)
  const ffmi = Math.round((leanBodyMassKg / (heightM * heightM)) * 10) / 10;
  const normalizedFfmi = Math.round((ffmi + 6.1 * (1.8 - heightM)) * 10) / 10;

  let ffmiTier = 'Başlangıç';
  let ffmiColor = '#38bdf8';

  if (gender === 'male') {
    if (normalizedFfmi < 18) {
      ffmiTier = 'Başlangıç';
      ffmiColor = '#94a3b8';
    } else if (normalizedFfmi < 20) {
      ffmiTier = 'Ortalama';
      ffmiColor = '#38bdf8';
    } else if (normalizedFfmi < 22) {
      ffmiTier = 'Atletik & Fit';
      ffmiColor = '#10b981';
    } else if (normalizedFfmi < 24) {
      ffmiTier = 'İleri Kas Kütlesi';
      ffmiColor = '#fbbf24';
    } else {
      ffmiTier = 'Elit / Genetik Zirve';
      ffmiColor = '#f43f5e';
    }
  } else {
    if (normalizedFfmi < 14) {
      ffmiTier = 'Başlangıç';
      ffmiColor = '#94a3b8';
    } else if (normalizedFfmi < 15.5) {
      ffmiTier = 'Ortalama';
      ffmiColor = '#38bdf8';
    } else if (normalizedFfmi < 17.5) {
      ffmiTier = 'Atletik & Fit';
      ffmiColor = '#10b981';
    } else if (normalizedFfmi < 19.5) {
      ffmiTier = 'İleri Kas Kütlesi';
      ffmiColor = '#fbbf24';
    } else {
      ffmiTier = 'Elit / Genetik Zirve';
      ffmiColor = '#f43f5e';
    }
  }

  // Historical Deltas (from oldest to newest measurement in history)
  const sortedMeasurements: BodyMeasurementEntry[] = [...(profile.measurements || [])].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  let deltaWeightKg = 0;
  let deltaBodyFatPct = 0;
  let deltaMuscleKg = 0;

  if (sortedMeasurements.length >= 2) {
    const first = sortedMeasurements[0];
    const latest = sortedMeasurements[sortedMeasurements.length - 1];
    deltaWeightKg = Math.round((latest.weightKg - first.weightKg) * 10) / 10;

    const firstBf = first.bodyFatPct ?? bodyFatPct;
    const latestBf = latest.bodyFatPct ?? bodyFatPct;
    deltaBodyFatPct = Math.round((latestBf - firstBf) * 10) / 10;

    const firstLbm = first.weightKg * (1 - firstBf / 100);
    const latestLbm = latest.weightKg * (1 - latestBf / 100);
    const firstMuscle = first.muscleMassKg ?? Math.round(firstLbm * (gender === 'male' ? 0.55 : 0.50) * 10) / 10;
    const latestMuscle = latest.muscleMassKg ?? Math.round(latestLbm * (gender === 'male' ? 0.55 : 0.50) * 10) / 10;
    deltaMuscleKg = Math.round((latestMuscle - firstMuscle) * 10) / 10;
  }

  // Classify Recomposition Phase
  let recompStatus: BodyCompositionAnalysis['recompStatus'] = 'maintenance';
  let recompLabel = 'Dengeli Koruma';
  let recompBadge = '🎯 Form Koruma';
  let recompDescription = 'Vücut ağırlığın ve kas/yağ dengen stabil ilerliyor.';
  let recompColor = '#38bdf8';

  if (deltaBodyFatPct <= -0.3 && deltaMuscleKg >= 0.1) {
    recompStatus = 'recomp';
    recompLabel = 'Body Recomposition';
    recompBadge = '🔥 Rekompozisyon (Altın Faz)';
    recompDescription = `Yağ oranın ${Math.abs(deltaBodyFatPct)}% düşerken kas kütlen +${deltaMuscleKg} kg arttı!`;
    recompColor = '#10b981';
  } else if (deltaMuscleKg >= 0.3 && deltaWeightKg > 0) {
    recompStatus = 'lean_bulk';
    recompLabel = 'Kas İnşası (Lean Bulk)';
    recompBadge = '💪 Temiz Hacim & Kas Artışı';
    recompDescription = `Başlangıçtan bu yana +${deltaMuscleKg} kg kas kütlesi kazandın.`;
    recompColor = '#fbbf24';
  } else if (deltaWeightKg <= -0.5 || deltaBodyFatPct <= -0.4) {
    recompStatus = 'cutting';
    recompLabel = 'Definasyon (Yağ Yakımı)';
    recompBadge = '⚡ Definasyon & Yağ Yakımı';
    recompDescription = `Toplam ${Math.abs(deltaWeightKg)} kg değişim ile yağ oranını düşürüyorsun.`;
    recompColor = '#38bdf8';
  }

  return {
    weightKg,
    heightCm,
    bmi,
    bmiCategory,
    bodyFatPct,
    isBodyFatEstimated,
    fatMassKg,
    leanBodyMassKg,
    muscleMassKg,
    isMuscleEstimated,
    ffmi,
    normalizedFfmi,
    ffmiTier,
    ffmiColor,
    deltaWeightKg,
    deltaBodyFatPct,
    deltaMuscleKg,
    recompStatus,
    recompLabel,
    recompBadge,
    recompDescription,
    recompColor
  };
}
