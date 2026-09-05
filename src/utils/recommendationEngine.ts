import { 
  Workout, 
  ExerciseDefinition, 
  AthleteProfile, 
  OverloadSuggestion, 
  NextWorkoutSuggestion, 
  SplitType, 
  MuscleGroup 
} from '../types/workout';
import { getLastWorkoutSets } from './calculations';
import { detectExercisePlateau } from './scientificCalculations';
import { muscleMetadata } from '../data/muscleMetadata';

/**
 * Generates an intelligent, progressive overload recommendation for a specific exercise
 */
export function getExerciseOverloadSuggestion(
  exercise: ExerciseDefinition,
  workouts: Workout[],
  profile: AthleteProfile
): OverloadSuggestion {
  const lastPerformance = getLastWorkoutSets(exercise.id, workouts);

  // If exercise was never logged, provide a scientific starter suggestion
  if (!lastPerformance || lastPerformance.weights.length === 0) {
    const bw = profile.bodyWeightKg || 75;
    const starterWeight = exercise.category === 'lower' ? Math.round(bw * 0.5) : Math.round(bw * 0.35);
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      type: 'maintain',
      title: '🎯 Başlangıç & Form Oturtma',
      description: `Bu hareket için ilk kayıt. Vücut ağırlığına uygun olarak ${starterWeight} kg ile temiz formda 3x8 tekrar önerilir.`,
      suggestedSets: [
        { weight: starterWeight, reps: 8 },
        { weight: starterWeight, reps: 8 },
        { weight: starterWeight, reps: 8 }
      ],
      isPlateau: false
    };
  }

  // Check for plateau
  const plateauCheck = detectExercisePlateau(exercise.id, workouts);
  const validWeights = lastPerformance.weights.filter(w => w > 0);
  const maxLastWeight = validWeights.length > 0 ? Math.max(...validWeights) : 20;
  const avgReps = Math.round(
    lastPerformance.reps.reduce((a, b) => a + b, 0) / Math.max(1, lastPerformance.reps.length)
  );

  if (plateauCheck.isPlateau) {
    // Deload & reset: -10% weight, higher quality reps
    const deloadWeight = Math.max(5, Math.round(maxLastWeight * 0.9 * 2) / 2);
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      type: 'deload_plateau',
      title: '⚡ Plato Kırma: Stratejik Deload (%10)',
      description: `Bu harekette son 3 antrenmandır ağırlık artışı durdu. Ağırlığı %10 indirerek (${deloadWeight} kg) kusursuz hareket formu ve patlayıcı tekrarlarla kas liflerini yeniden şoklayın.`,
      suggestedSets: [
        { weight: deloadWeight, reps: 10 },
        { weight: deloadWeight, reps: 10 },
        { weight: deloadWeight, reps: 10 }
      ],
      isPlateau: true,
      plateauWorkoutsCount: plateauCheck.consecutiveCount
    };
  }

  // Determine weight increment based on muscle size
  const isLargeCompound = ['squat', 'deadlift', 'leg_press', 'hip_thrust'].includes(exercise.id);
  const isIsolation = ['shoulder_fly', 'biceps', 'hammer_curl', 'triceps', 'skull_crusher'].includes(exercise.id);
  const weightStep = isLargeCompound ? 5 : (isIsolation ? 1.25 : 2.5);

  if (avgReps >= 9) {
    // Successfully hit upper rep threshold -> Overload weight!
    const newWeight = Math.round((maxLastWeight + weightStep) * 2) / 2;
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      type: 'increase_weight',
      title: '🚀 Progressive Overload: Kilo Artışı',
      description: `Geçen seansta ortalama ${avgReps} tekrarı rahat tamamladın! Bu seansta ağırlığı +${weightStep} kg artırarak (${newWeight} kg) 6-8 tekrar hedefle.`,
      suggestedSets: [
        { weight: newWeight, reps: 8 },
        { weight: newWeight, reps: 8 },
        { weight: newWeight, reps: 6 }
      ],
      isPlateau: false
    };
  } else if (avgReps >= 6) {
    // Working in solid range -> Increase reps
    const targetReps = Math.min(12, avgReps + 1);
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      type: 'increase_reps',
      title: '📈 Hacim Artışı: +1 Tekrar Hedefi',
      description: `Ağırlığı (${maxLastWeight} kg) sabit tut. Bu seansta her sete +1 tekrar ekleyerek ${targetReps} tekrara ulaşmayı hedefle.`,
      suggestedSets: [
        { weight: maxLastWeight, reps: targetReps },
        { weight: maxLastWeight, reps: targetReps },
        { weight: maxLastWeight, reps: targetReps }
      ],
      isPlateau: false
    };
  } else {
    // Low reps or struggled -> Consolidate form
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      type: 'maintain',
      title: '🛡️ Kuvvet Pekiştirme & Dinlenme',
      description: `Mevcut ağırlıkta (${maxLastWeight} kg) dinlenme sürelerini 2-3 dakikaya çıkarıp temiz 3 set 6-8 tekrar çıkarmaya odaklan.`,
      suggestedSets: [
        { weight: maxLastWeight, reps: 6 },
        { weight: maxLastWeight, reps: 6 },
        { weight: maxLastWeight, reps: 6 }
      ],
      isPlateau: false
    };
  }
}

/**
 * Suggests what workout to perform next based on muscle recovery times
 */
export function getSuggestedNextWorkout(workouts: Workout[]): NextWorkoutSuggestion {
  const muscleLastTrained: Partial<Record<MuscleGroup, string>> = {};

  // Find last trained date for each muscle
  workouts.forEach((w) => {
    w.exercises.forEach((ex) => {
      const muscle = ex.muscle;
      if (muscle && !muscleLastTrained[muscle]) {
        muscleLastTrained[muscle] = w.date;
      }
    });
  });

  const now = new Date();
  const muscleGroups: MuscleGroup[] = [
    'chest', 'back', 'shoulder', 'biceps', 'triceps', 'quads', 'hamstring', 'glutes', 'calves', 'abs'
  ];

  const muscleRecovery = muscleGroups.map((muscle) => {
    const meta = muscleMetadata[muscle] || muscleMetadata.chest;
    const lastDate = muscleLastTrained[muscle];
    let daysSince = 7; // default long time
    if (lastDate) {
      const diffMs = now.getTime() - new Date(lastDate).getTime();
      daysSince = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    let recoveryStatus: 'fresh' | 'recovered' | 'recovering' = 'fresh';
    if (daysSince <= 1) recoveryStatus = 'recovering';
    else if (daysSince <= 2) recoveryStatus = 'recovered';
    else recoveryStatus = 'fresh';

    return {
      muscle,
      muscleName: meta.name,
      daysSinceTrained: daysSince,
      recoveryStatus
    };
  });

  // Calculate readiness for Upper vs Lower
  const upperMuscles: MuscleGroup[] = ['chest', 'back', 'shoulder', 'biceps', 'triceps'];
  const lowerMuscles: MuscleGroup[] = ['quads', 'hamstring', 'glutes', 'calves'];

  const upperAvgDays = upperMuscles.reduce((sum, m) => {
    const item = muscleRecovery.find(r => r.muscle === m);
    return sum + (item?.daysSinceTrained || 5);
  }, 0) / upperMuscles.length;

  const lowerAvgDays = lowerMuscles.reduce((sum, m) => {
    const item = muscleRecovery.find(r => r.muscle === m);
    return sum + (item?.daysSinceTrained || 5);
  }, 0) / lowerMuscles.length;

  let recommendedSplit: SplitType = 'upper';
  let splitTitle = 'Üst Vücut (İtiş & Çekiş)';
  let reason = 'Üst vücut kaslarınız tamamen toparlandı ve antrenmana hazır.';

  if (workouts.length === 0) {
    recommendedSplit = 'full';
    splitTitle = 'Tüm Vücut (Full Body)';
    reason = 'İlk antrenmanınız için tüm temel kas gruplarını uyaran dengeli bir seans önerilir.';
  } else if (lowerAvgDays >= upperAvgDays && lowerAvgDays >= 2) {
    recommendedSplit = 'lower';
    splitTitle = 'Alt Vücut (Bacak & Kalça)';
    reason = `Bacak ve kalça kaslarınız yaklaşık ${Math.round(lowerAvgDays)} gündür dinleniyor. Glikojen depoları dolu ve büyüme uyarısına hazır.`;
  } else if (upperAvgDays >= 2) {
    recommendedSplit = 'upper';
    splitTitle = 'Üst Vücut (Göğüs & Sırt)';
    reason = `Üst vücut kaslarınız ${Math.round(upperAvgDays)} gündür toparlanıyor. Kuvvet gelişimi için bugün üst vücut idmanı ideal.`;
  } else {
    recommendedSplit = 'custom';
    splitTitle = 'Core / Hafif Toparlanma';
    reason = 'Büyük kas gruplarınız yakın zamanda çalışıldı. Bugün hafif kardiyo, karın ve esneme günü yapabilirsiniz.';
  }

  // Sort priority muscles by days since trained descending
  const priorityMuscles = [...muscleRecovery]
    .sort((a, b) => b.daysSinceTrained - a.daysSinceTrained)
    .slice(0, 4);

  return {
    recommendedSplit,
    splitTitle,
    reason,
    priorityMuscles
  };
}
