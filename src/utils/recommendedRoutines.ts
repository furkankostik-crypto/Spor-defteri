import { SplitType, RecommendedRoutineItem, ExerciseDefinition } from '../types/workout';

/**
 * Standard recommended routines engineered for optimal muscle hypertrophy and strength progression.
 * Each exercise item includes target sets, repetition goals, training role, and alternative exercises.
 */
export const DEFAULT_ROUTINES: Record<SplitType, RecommendedRoutineItem[]> = {
  lower: [
    {
      id: 'squat',
      order: 1,
      name: 'Barbell Squat',
      muscle: 'quads',
      muscleLabel: 'Ön Bacak & Kalça',
      targetSets: 4,
      targetReps: '6-8',
      targetProtocol: '4 Set × 6-8',
      typeLabel: 'Ana Bileşke',
      category: 'lower',
      ptTip: 'Kök hareket: Kalçayı geriye alarak derin ve kontrollü çökün, dizler ayak ucunu takip etsin.',
      alternatives: ['leg_press', 'quad_ext']
    },
    {
      id: 'deadlift',
      order: 2,
      name: 'Romanian Deadlift (RDL)',
      muscle: 'hamstring',
      muscleLabel: 'Arka Bacak & Kalça',
      targetSets: 4,
      targetReps: '8-10',
      targetProtocol: '4 Set × 8-10',
      typeLabel: 'Posterior Zincir',
      category: 'lower',
      ptTip: 'Hareketi kalçayı geriye iterek başlatın (hip hinge); omurgayı nötr tutun ve hamstring esnemesini hissedin.',
      alternatives: ['ham_ext', 'hip_thrust']
    },
    {
      id: 'leg_press',
      order: 3,
      name: 'Leg Press',
      muscle: 'quads',
      muscleLabel: 'Kuadriseps',
      targetSets: 3,
      targetReps: '10-12',
      targetProtocol: '3 Set × 10-12',
      typeLabel: 'Hacim Yükü',
      category: 'lower',
      ptTip: 'Ağırlığı kontrollü indirin, tepe noktada dizleri kitlemeden sürekli kas geriliminde kalın.',
      alternatives: ['quad_ext', 'adductor']
    },
    {
      id: 'ham_ext',
      order: 4,
      name: 'Hamstring Leg Curl',
      muscle: 'hamstring',
      muscleLabel: 'Arka Bacak',
      targetSets: 3,
      targetReps: '10-12',
      targetProtocol: '3 Set × 10-12',
      typeLabel: 'İzolasyon',
      category: 'lower',
      ptTip: 'Arka bacağı tamamen sıkın, dönüş fazını (eksantrik) 2 saniyede yavaşça tamamlayın.',
      alternatives: ['deadlift', 'abductor']
    },
    {
      id: 'calf_raise',
      order: 5,
      name: 'Calf Raise (Kalf)',
      muscle: 'calves',
      muscleLabel: 'Baldır (Kalf)',
      targetSets: 4,
      targetReps: '12-15',
      targetProtocol: '4 Set × 12-15',
      typeLabel: 'Şekillendirme',
      category: 'lower',
      ptTip: 'Dip noktada 1 saniye derin esneme, tepe noktada tam parmak ucu sıkıştırma uygulayın.',
      alternatives: []
    }
  ],

  upper: [
    {
      id: 'bench',
      order: 1,
      name: 'Bench Press',
      muscle: 'chest',
      muscleLabel: 'Göğüs & İtiş',
      targetSets: 4,
      targetReps: '6-8',
      targetProtocol: '4 Set × 6-8',
      typeLabel: 'Ana İtiş',
      category: 'upper',
      ptTip: 'Kürek kemiklerini geride sabitleyin (retraksiyon). Barı göğüs ortasına kontrollü indirin.',
      alternatives: ['incline_bench']
    },
    {
      id: 'latpull',
      order: 2,
      name: 'Lat Pulldown',
      muscle: 'back',
      muscleLabel: 'Sırt & Kanat',
      targetSets: 4,
      targetReps: '8-10',
      targetProtocol: '4 Set × 8-10',
      typeLabel: 'Ana Çekiş',
      category: 'upper',
      ptTip: 'Bilek veya ön kolla değil, dirsekleri kalçaya doğru çekerek kanat kaslarını hedefleyin.',
      alternatives: ['row', 'tbar_row']
    },
    {
      id: 'incline_bench',
      order: 3,
      name: 'Incline Dumbbell Press',
      muscle: 'chest',
      muscleLabel: 'Üst Göğüs',
      targetSets: 3,
      targetReps: '8-10',
      targetProtocol: '3 Set × 8-10',
      typeLabel: 'Hacim Yükü',
      category: 'upper',
      ptTip: '30 derecelik açıda üst göğüs liflerine odaklanın, dumbell’ları tepe noktada birbirine çarptırmayın.',
      alternatives: ['bench', 'shoulder_press']
    },
    {
      id: 'shoulder_press',
      order: 4,
      name: 'Shoulder Press',
      muscle: 'shoulder',
      muscleLabel: 'Omuz Deltoid',
      targetSets: 3,
      targetReps: '8-10',
      targetProtocol: '3 Set × 8-10',
      typeLabel: 'Kuvvet',
      category: 'upper',
      ptTip: 'Baş üstüne preslerken belinizi aşırı kavis yapmaktan korumak için core kaslarını sıkın.',
      alternatives: ['shoulder_fly', 'face_pull']
    },
    {
      id: 'biceps',
      order: 5,
      name: 'Biceps Barbell Curl',
      muscle: 'biceps',
      muscleLabel: 'Ön Kol (Pazu)',
      targetSets: 3,
      targetReps: '10-12',
      targetProtocol: '3 Set × 10-12',
      typeLabel: 'Kol İzolasyon',
      category: 'upper',
      ptTip: 'Dirsekleri gövdeye yapışık tutun, vücut salınımı yapmadan saf kol gücüyle kaldırın.',
      alternatives: ['hammer_curl']
    },
    {
      id: 'triceps',
      order: 6,
      name: 'Triceps Pushdown',
      muscle: 'triceps',
      muscleLabel: 'Arka Kol',
      targetSets: 3,
      targetReps: '10-12',
      targetProtocol: '3 Set × 10-12',
      typeLabel: 'Arka Kol İzolasyon',
      category: 'upper',
      ptTip: 'Dirsek eklemini geride sabitleyin, alt noktada triceps kaslarını 1 saniye kilitli sıkın.',
      alternatives: ['skull_crusher']
    }
  ],

  full: [
    {
      id: 'squat',
      order: 1,
      name: 'Barbell Squat',
      muscle: 'quads',
      muscleLabel: 'Alt Vücut',
      targetSets: 3,
      targetReps: '8',
      targetProtocol: '3 Set × 8',
      typeLabel: 'Ana Bileşke',
      category: 'lower',
      ptTip: 'Tüm vücudu uyarmak için derin ve tempolu çöküş.',
      alternatives: ['leg_press']
    },
    {
      id: 'bench',
      order: 2,
      name: 'Bench Press',
      muscle: 'chest',
      muscleLabel: 'Göğüs İtiş',
      targetSets: 3,
      targetReps: '8',
      targetProtocol: '3 Set × 8',
      typeLabel: 'Bileşke İtiş',
      category: 'upper',
      ptTip: 'İtiş gücünü göğüs ve triceps zincirine eşit dağıtın.',
      alternatives: ['incline_bench']
    },
    {
      id: 'latpull',
      order: 3,
      name: 'Lat Pulldown',
      muscle: 'back',
      muscleLabel: 'Sırt Çekiş',
      targetSets: 3,
      targetReps: '8-10',
      targetProtocol: '3 Set × 8-10',
      typeLabel: 'Bileşke Çekiş',
      category: 'upper',
      ptTip: 'Gövdeyi dik tutarak kanatları sıkıştırın.',
      alternatives: ['row']
    },
    {
      id: 'shoulder_press',
      order: 4,
      name: 'Shoulder Press',
      muscle: 'shoulder',
      muscleLabel: 'Omuz',
      targetSets: 3,
      targetReps: '8-10',
      targetProtocol: '3 Set × 8-10',
      typeLabel: 'Dikey İtiş',
      category: 'upper',
      ptTip: 'Dikey pres gücü ile omuz başlarını aktive edin.',
      alternatives: ['shoulder_fly']
    },
    {
      id: 'deadlift',
      order: 5,
      name: 'Romanian Deadlift',
      muscle: 'hamstring',
      muscleLabel: 'Arka Bacak & Kalça',
      targetSets: 3,
      targetReps: '8-10',
      targetProtocol: '3 Set × 8-10',
      typeLabel: 'Posterior Zincir',
      category: 'lower',
      ptTip: 'Alt vücudun arka tarafını uyarın.',
      alternatives: ['ham_ext']
    },
    {
      id: 'plank',
      order: 6,
      name: 'Plank Hold',
      muscle: 'abs',
      muscleLabel: 'Core',
      targetSets: 3,
      targetReps: '60s',
      targetProtocol: '3 Set × 60s',
      typeLabel: 'Statik Core',
      category: 'core',
      ptTip: 'Karın ve kalçayı sıkarak tam düz bir çizgi koruyun.',
      alternatives: ['cable_crunch', 'hanging_leg_raise']
    }
  ],

  custom: [
    {
      id: 'hanging_leg_raise',
      order: 1,
      name: 'Hanging Leg Raise',
      muscle: 'abs',
      muscleLabel: 'Alt Karın',
      targetSets: 3,
      targetReps: '10-12',
      targetProtocol: '3 Set × 10-12',
      typeLabel: 'Core Gücü',
      category: 'core',
      ptTip: 'Salınım yapmadan bacakları kalça hizasına kadar kaldırın.',
      alternatives: ['cable_crunch']
    },
    {
      id: 'cable_crunch',
      order: 2,
      name: 'Cable Crunch',
      muscle: 'abs',
      muscleLabel: 'Üst Karın',
      targetSets: 3,
      targetReps: '12-15',
      targetProtocol: '3 Set × 12-15',
      typeLabel: 'Hipertrofi',
      category: 'core',
      ptTip: 'Kollardan değil karın kaslarını bükerek çekiş uygulayın.',
      alternatives: ['hanging_leg_raise']
    },
    {
      id: 'plank',
      order: 3,
      name: 'Plank Hold',
      muscle: 'abs',
      muscleLabel: 'Core',
      targetSets: 3,
      targetReps: '60s',
      targetProtocol: '3 Set × 60s',
      typeLabel: 'Statik Dayanıklılık',
      category: 'core',
      ptTip: 'Maksimum karın içi basınç ve stabilite.',
      alternatives: ['cable_crunch']
    }
  ]
};

/**
 * Returns a cloned copy of the recommended routine for the specified split.
 */
export function getRecommendedRoutine(split: SplitType): RecommendedRoutineItem[] {
  const routine = DEFAULT_ROUTINES[split] || DEFAULT_ROUTINES.lower;
  return JSON.parse(JSON.stringify(routine));
}

/**
 * Finds alternative exercises that can replace a given exercise in the routine.
 */
export function getAvailableAlternatives(
  routineItem: RecommendedRoutineItem,
  allExercises: ExerciseDefinition[]
): ExerciseDefinition[] {
  const altIds = routineItem.alternatives || [];
  const directMatches = allExercises.filter(e => altIds.includes(e.id));
  
  // Also offer same muscle exercises as secondary fallback
  const sameMuscleFallback = allExercises.filter(
    e => e.muscle === routineItem.muscle && e.id !== routineItem.id && !altIds.includes(e.id)
  );

  return [...directMatches, ...sameMuscleFallback];
}
