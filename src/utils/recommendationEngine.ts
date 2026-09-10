import { 
  Workout, 
  ExerciseDefinition, 
  AthleteProfile, 
  OverloadSuggestion, 
  NextWorkoutSuggestion, 
  SplitType, 
  MuscleGroup,
  PTDailyGuidance
} from '../types/workout';
import { getLastWorkoutSets } from './calculations';
import { detectExercisePlateau } from './scientificCalculations';
import { muscleMetadata } from '../data/muscleMetadata';
import { getTodayLocalDate, shiftDateByDays, parseLocalDate } from './dateUtils';
import { getRecommendedRoutine } from './recommendedRoutines';

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
 * Intelligent Personal Trainer (PT) Engine:
 * Analyzes today's workout state, muscle recovery times, fatigue streaks,
 * and generates guidance like a real gym coach.
 */
export function getSuggestedNextWorkout(workouts: Workout[]): NextWorkoutSuggestion {
  const todayStr = getTodayLocalDate();
  const todayWorkouts = workouts.filter((w) => w.date === todayStr);
  const isTodayCompleted = todayWorkouts.length > 0;

  // Map last trained date for each muscle
  const muscleLastTrained: Partial<Record<MuscleGroup, string>> = {};
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
    reason = `Üst vücut kaslarınız ${Math.round(upperAvgDays)} gündür toparlanıyor. Kuvvet gelişimi için üst vücut idmanı ideal.`;
  } else {
    recommendedSplit = 'custom';
    splitTitle = 'Core / Hafif Toparlanma';
    reason = 'Büyük kas gruplarınız yakın zamanda çalışıldı. Hafif kardiyo, karın ve esneme günü yapabilirsiniz.';
  }

  // Sort priority muscles by days since trained descending
  const priorityMuscles = [...muscleRecovery]
    .sort((a, b) => b.daysSinceTrained - a.daysSinceTrained)
    .slice(0, 4);

  // Determine specific recommended muscles based on recommended split
  let recommendedMuscles: MuscleGroup[] = [];
  if (recommendedSplit === 'upper') {
    recommendedMuscles = ['chest', 'back', 'shoulder', 'biceps', 'triceps'];
  } else if (recommendedSplit === 'lower') {
    recommendedMuscles = ['quads', 'hamstring', 'glutes', 'calves'];
  } else if (recommendedSplit === 'full') {
    recommendedMuscles = ['chest', 'back', 'shoulder', 'biceps', 'triceps', 'quads', 'hamstring', 'glutes', 'calves'];
  } else {
    const topRecovered = priorityMuscles.map((p) => p.muscle);
    recommendedMuscles = Array.from(new Set<MuscleGroup>(['abs', ...topRecovered]));
  }

  const muscleRecoveryMap: Partial<Record<MuscleGroup, { daysSinceTrained: number; recoveryStatus: 'fresh' | 'recovered' | 'recovering' }>> = {};
  muscleRecovery.forEach((r) => {
    muscleRecoveryMap[r.muscle] = {
      daysSinceTrained: r.daysSinceTrained,
      recoveryStatus: r.recoveryStatus
    };
  });

  // ========================================================
  // SCENARIO 1: WORKOUT ALREADY COMPLETED TODAY (PT Recovery Mode)
  // ========================================================
  if (isTodayCompleted) {
    let todaySets = 0;
    let todayVolume = 0;
    let todayExCount = 0;
    const todaySplits = new Set<string>();

    todayWorkouts.forEach((w) => {
      todaySplits.add(w.type);
      todayExCount += w.exercises.length;
      w.exercises.forEach((ex) => {
        if (ex.detailedSets) {
          ex.detailedSets.forEach((s) => {
            if (s.weight > 0) {
              todaySets++;
              todayVolume += s.weight * (s.reps || 5);
            }
          });
        } else if (ex.sets) {
          ex.sets.forEach((wt) => {
            if (wt > 0) {
              todaySets++;
              todayVolume += wt * 5;
            }
          });
        }
      });
    });

    const splitNames = Array.from(todaySplits).join(' & ');
    const isUpperTrained = splitNames.toLowerCase().includes('üst') || splitNames.toLowerCase().includes('upper');
    const isLowerTrained = splitNames.toLowerCase().includes('alt') || splitNames.toLowerCase().includes('lower');

    // Determine what's next for tomorrow
    let nextTarget = 'Alt Vücut (Bacak & Kalça)';
    let nextSplit: SplitType = 'lower';
    let nextMuscles: MuscleGroup[] = ['quads', 'hamstring', 'glutes', 'calves'];

    if (isUpperTrained) {
      nextTarget = 'Alt Vücut (Bacak & Kalça)';
      nextSplit = 'lower';
      nextMuscles = ['quads', 'hamstring', 'glutes', 'calves'];
    } else if (isLowerTrained) {
      nextTarget = 'Üst Vücut (Göğüs & Sırt)';
      nextSplit = 'upper';
      nextMuscles = ['chest', 'back', 'shoulder', 'biceps', 'triceps'];
    } else {
      nextTarget = 'Dinlenme / Core';
      nextSplit = 'custom';
      nextMuscles = ['abs'];
    }

    const todaySummary = {
      splitName: splitNames || 'Antrenman',
      totalSets: todaySets,
      totalVolumeKg: todayVolume,
      exerciseCount: todayExCount,
      date: todayStr
    };

    const ptGuidance: PTDailyGuidance = {
      state: 'today_completed',
      headline: 'Günün Antrenmanı Tamamlandı! 🔥',
      subline: `Bugün ${todaySummary.splitName} seansını başarıyla bitirdin (${todayExCount} Hareket, ${todaySets} Set, ${todayVolume.toLocaleString('tr-TR')} kg Hacim).`,
      advice: 'Kas liflerin antrenmanda uyarıldı. Asıl kas gelişimi (hipertrofi) ve güç kazanımı dinlenirken, beslenirken ve uykuda gerçekleşir. Bugünlük ağırlık defterin kapandı; toparlanmaya odaklan.',
      nextSessionTarget: nextTarget,
      nextSessionTiming: 'Yarın veya 1 Gün Dinlendikten Sonra',
      recommendedSplit: nextSplit,
      todayWorkoutSummary: todaySummary,
      recoveryTips: [
        '🥩 Protein Sentezi: Kilonuz başına ~1.6 - 2.0g kaliteli protein alarak kas onarımını başlatın.',
        '💧 Hidrasyon: Gün boyu en az 3 - 3.5 litre su tüketerek kas içi sıvı dengesini koruyun.',
        '💤 Kaliteli Uyku: Büyüme hormonu (GH) salınımı ve merkezi sinir sistemi için 7-8 saat derin uyku hedefleyin.'
      ],
      suggestedFocusMuscles: nextMuscles,
      recommendedRoutine: getRecommendedRoutine(nextSplit),
      badge: {
        text: 'Bugün Tamamlandı ✓',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.3)',
        icon: 'check'
      }
    };

    return {
      recommendedSplit: nextSplit,
      splitTitle: 'Toparlanma & Dinlenme Modu',
      reason: `Bugün ${todaySummary.splitName} yapıldı (${todayVolume.toLocaleString('tr-TR')} kg hacim). Kasların toparlanıyor. Bir sonraki önerilen seans: ${nextTarget} (Yarın).`,
      priorityMuscles,
      recommendedMuscles: nextMuscles,
      recommendedRoutine: getRecommendedRoutine(nextSplit),
      muscleRecoveryMap,
      isTodayCompleted: true,
      todayWorkoutSummary: todaySummary,
      ptGuidance
    };
  }

  // ========================================================
  // SCENARIO 2: NO WORKOUT YET TODAY -> CHECK FATIGUE / COMEBACK / READY
  // ========================================================
  
  // Consecutive days trained up to yesterday
  let consecutiveDays = 0;
  let checkDate = shiftDateByDays(todayStr, -1);
  while (workouts.some(w => w.date === checkDate)) {
    consecutiveDays++;
    checkDate = shiftDateByDays(checkDate, -1);
  }

  // Days since most recent workout
  let daysSinceLast = 0;
  const pastDates = workouts.map(w => w.date).filter(d => d < todayStr).sort().reverse();
  if (pastDates.length > 0) {
    const lastD = parseLocalDate(pastDates[0]);
    const nowD = parseLocalDate(todayStr);
    daysSinceLast = Math.max(0, Math.floor((nowD.getTime() - lastD.getTime()) / (1000 * 60 * 60 * 24)));
  }

  const activeRoutine = getRecommendedRoutine(recommendedSplit);

  // Subcase A: Overtraining / Streak of 3+ consecutive days
  if (consecutiveDays >= 3) {
    const ptGuidance: PTDailyGuidance = {
      state: 'rest_day',
      headline: 'Planlı Dinlenme Günü (Rest Day) 🛌',
      subline: `Son ${consecutiveDays} gündür aralıksız antrenmandasın. Merkezi Sinir Sistemi (CNS) toparlanması önerilir.`,
      advice: 'Kaslar toparlansa bile eklemler, tendonlar ve merkezi sinir sistemi aralıksız yüklenmelerde yorulur. Bugün aktif toparlanma (hafif yürüyüş, esneme ve mobilite) yaparak yarınki seansa %100 güçle gir.',
      nextSessionTarget: splitTitle,
      nextSessionTiming: 'Yarın',
      recommendedSplit,
      recoveryTips: [
        '🚶 Aktif Dinlenme: 20-30 dakika hafif tempolu yürüyüş ile kan dolaşımını hızlandır.',
        '🧘 Mobilite & Esneme: Sıkışan eklemleri ve gergin kasları rahatlat.',
        '🔋 Enerji Depolama: Glikojen depolarını kaliteli karbonhidratlarla doldur.'
      ],
      suggestedFocusMuscles: recommendedMuscles,
      recommendedRoutine: activeRoutine,
      badge: {
        text: 'Dinlenme Günü Önerisi',
        color: '#a855f7',
        bg: 'rgba(168, 85, 247, 0.12)',
        border: 'rgba(168, 85, 247, 0.3)',
        icon: 'coffee'
      }
    };

    return {
      recommendedSplit,
      splitTitle,
      reason,
      priorityMuscles,
      recommendedMuscles,
      recommendedRoutine: activeRoutine,
      muscleRecoveryMap,
      isTodayCompleted: false,
      ptGuidance
    };
  }

  // Subcase B: Long break (4+ days without workout)
  if (daysSinceLast >= 4) {
    const ptGuidance: PTDailyGuidance = {
      state: 'comeback',
      headline: 'Tekrar Harekete Geçme Zamanı! 🚀',
      subline: `Son antrenmandan bu yana ${daysSinceLast} gün geçti. Kas hafızan hazır!`,
      advice: 'Birkaç günlük ara sonrası vücudu aşırı hamlatmadan, dengeli bir seansla ritmimizi yeniden yakalayalım.',
      nextSessionTarget: splitTitle,
      nextSessionTiming: 'Bugün',
      recommendedSplit,
      recoveryTips: [
        '🔥 Kapsamlı Isınma: Eklemleri ve kas liflerini en az 5-10 dakika ısıtarak hazırla.',
        '🎯 Form & Hissiyat: Maksimum ağırlık yerine temiz form ve yüksek kas uyarısına odaklan.',
        '💧 Hidrasyon: Antrenmandan önce en az 500ml su içmeyi ihmal etme.'
      ],
      suggestedFocusMuscles: recommendedMuscles,
      recommendedRoutine: activeRoutine,
      badge: {
        text: 'Geri Dönüş Seansı',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.3)',
        icon: 'zap'
      },
      actionButton: {
        text: 'İdmanı Başlat',
        split: recommendedSplit
      }
    };

    return {
      recommendedSplit,
      splitTitle,
      reason,
      priorityMuscles,
      recommendedMuscles,
      recommendedRoutine: activeRoutine,
      muscleRecoveryMap,
      isTodayCompleted: false,
      ptGuidance
    };
  }

  // Subcase C: Ready for workout today
  const ptGuidance: PTDailyGuidance = {
    state: 'workout_ready',
    headline: `Günün Hedefi: ${splitTitle} ⚡`,
    subline: reason,
    advice: 'Bugün hedeflenen kas grupların dinlendi ve glikojen depoların dolu. Antrenmana bileşke (compound) bir hareketle başlayıp progressive overload hedefleyelim!',
    nextSessionTarget: splitTitle,
    nextSessionTiming: 'Bugün',
    recommendedSplit,
    recoveryTips: [
      '⚡ Antrenman Öncesi: İdmandan 1-2 saat önce kompleks karbonhidrat ve protein tüket.',
      '🎯 Progressive Overload: Geçen seanstaki tekrar veya ağırlıkları aşmayı hedefle.',
      '⏱️ Set Araları: Ağır bileşke hareketlerde en az 2-3 dakika dinlen.'
    ],
    suggestedFocusMuscles: recommendedMuscles,
    recommendedRoutine: activeRoutine,
    badge: {
      text: 'Günün Antrenmanı',
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.12)',
      border: 'rgba(56, 189, 248, 0.3)',
      icon: 'dumbbell'
    },
    actionButton: {
      text: 'İdmanı Başlat',
      split: recommendedSplit
    }
  };

  return {
    recommendedSplit,
    splitTitle,
    reason,
    priorityMuscles,
    recommendedMuscles,
    recommendedRoutine: activeRoutine,
    muscleRecoveryMap,
    isTodayCompleted: false,
    ptGuidance
  };
}

