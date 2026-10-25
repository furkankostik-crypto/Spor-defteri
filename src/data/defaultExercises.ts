import { ExerciseDefinition } from '../types/workout';

export const defaultExercises: ExerciseDefinition[] = [
  // ==========================================
  // ÜST VÜCUT - GÖĞÜS (Chest)
  // ==========================================
  {
    id: 'bench',
    name: 'Bench Press',
    muscle: 'chest',
    category: 'upper',
    muscles: [
      { muscle: 'chest', ratio: 0.65, role: 'primary' },
      { muscle: 'triceps', ratio: 0.25, role: 'secondary' },
      { muscle: 'shoulder', ratio: 0.10, role: 'secondary' }
    ]
  },
  {
    id: 'incline_bench',
    name: 'Incline Dumbbell Press',
    muscle: 'chest',
    category: 'upper',
    muscles: [
      { muscle: 'chest', ratio: 0.55, role: 'primary' },
      { muscle: 'shoulder', ratio: 0.30, role: 'secondary' },
      { muscle: 'triceps', ratio: 0.15, role: 'secondary' }
    ]
  },
  {
    id: 'dumbbell_fly',
    name: 'Dumbbell Fly (Göğüs Açış)',
    muscle: 'chest',
    category: 'upper',
    muscles: [
      { muscle: 'chest', ratio: 0.85, role: 'primary' },
      { muscle: 'shoulder', ratio: 0.15, role: 'secondary' }
    ]
  },
  {
    id: 'cable_crossover',
    name: 'Cable Crossover (Kablo Sıkıştırma)',
    muscle: 'chest',
    category: 'upper',
    muscles: [
      { muscle: 'chest', ratio: 0.90, role: 'primary' },
      { muscle: 'shoulder', ratio: 0.10, role: 'stabilizer' }
    ]
  },
  {
    id: 'pec_deck',
    name: 'Pec Deck / Kelebek (Butterfly)',
    muscle: 'chest',
    category: 'upper',
    muscles: [
      { muscle: 'chest', ratio: 0.90, role: 'primary' },
      { muscle: 'shoulder', ratio: 0.10, role: 'stabilizer' }
    ]
  },
  {
    id: 'chest_dips',
    name: 'Chest Dips (Paralel Bar Dips)',
    muscle: 'chest',
    category: 'upper',
    muscles: [
      { muscle: 'chest', ratio: 0.55, role: 'primary' },
      { muscle: 'triceps', ratio: 0.35, role: 'secondary' },
      { muscle: 'shoulder', ratio: 0.10, role: 'secondary' }
    ]
  },

  // ==========================================
  // ÜST VÜCUT - SIRT & KANAT (Back)
  // ==========================================
  {
    id: 'latpull',
    name: 'Lat Pulldown',
    muscle: 'back',
    category: 'upper',
    muscles: [
      { muscle: 'back', ratio: 0.65, role: 'primary' },
      { muscle: 'biceps', ratio: 0.25, role: 'secondary' },
      { muscle: 'shoulder', ratio: 0.10, role: 'secondary' }
    ]
  },
  {
    id: 'pullup',
    name: 'Pull-Up (Barfiks)',
    muscle: 'back',
    category: 'upper',
    muscles: [
      { muscle: 'back', ratio: 0.65, role: 'primary' },
      { muscle: 'biceps', ratio: 0.25, role: 'secondary' },
      { muscle: 'abs', ratio: 0.10, role: 'stabilizer' }
    ]
  },
  {
    id: 'row',
    name: 'Seated Cable Row',
    muscle: 'back',
    category: 'upper',
    muscles: [
      { muscle: 'back', ratio: 0.65, role: 'primary' },
      { muscle: 'biceps', ratio: 0.20, role: 'secondary' },
      { muscle: 'shoulder', ratio: 0.15, role: 'secondary' }
    ]
  },
  {
    id: 'barbell_row',
    name: 'Barbell Bent-Over Row',
    muscle: 'back',
    category: 'upper',
    muscles: [
      { muscle: 'back', ratio: 0.65, role: 'primary' },
      { muscle: 'biceps', ratio: 0.20, role: 'secondary' },
      { muscle: 'shoulder', ratio: 0.15, role: 'secondary' }
    ]
  },
  {
    id: 'dumbbell_row',
    name: 'One-Arm Dumbbell Row',
    muscle: 'back',
    category: 'upper',
    muscles: [
      { muscle: 'back', ratio: 0.70, role: 'primary' },
      { muscle: 'biceps', ratio: 0.20, role: 'secondary' },
      { muscle: 'shoulder', ratio: 0.10, role: 'secondary' }
    ]
  },
  {
    id: 'tbar_row',
    name: 'T-Bar Row',
    muscle: 'back',
    category: 'upper',
    muscles: [
      { muscle: 'back', ratio: 0.65, role: 'primary' },
      { muscle: 'biceps', ratio: 0.20, role: 'secondary' },
      { muscle: 'shoulder', ratio: 0.15, role: 'secondary' }
    ]
  },
  {
    id: 'straight_arm_pulldown',
    name: 'Straight-Arm Lat Pulldown',
    muscle: 'back',
    category: 'upper',
    muscles: [
      { muscle: 'back', ratio: 0.85, role: 'primary' },
      { muscle: 'triceps', ratio: 0.15, role: 'stabilizer' }
    ]
  },

  // ==========================================
  // ÜST VÜCUT - OMUZ (Shoulder)
  // ==========================================
  {
    id: 'shoulder_press',
    name: 'Shoulder Press',
    muscle: 'shoulder',
    category: 'upper',
    muscles: [
      { muscle: 'shoulder', ratio: 0.65, role: 'primary' },
      { muscle: 'triceps', ratio: 0.25, role: 'secondary' },
      { muscle: 'chest', ratio: 0.10, role: 'secondary' }
    ]
  },
  {
    id: 'shoulder_fly',
    name: 'Lateral Raise (Omuz Fly)',
    muscle: 'shoulder',
    category: 'upper',
    muscles: [
      { muscle: 'shoulder', ratio: 0.90, role: 'primary' },
      { muscle: 'back', ratio: 0.10, role: 'secondary' }
    ]
  },
  {
    id: 'rear_delt_fly',
    name: 'Rear Delt Fly (Arka Omuz Açış)',
    muscle: 'shoulder',
    category: 'upper',
    muscles: [
      { muscle: 'shoulder', ratio: 0.75, role: 'primary' },
      { muscle: 'back', ratio: 0.25, role: 'secondary' }
    ]
  },
  {
    id: 'front_raise',
    name: 'Dumbbell Front Raise (Ön Omuz)',
    muscle: 'shoulder',
    category: 'upper',
    muscles: [
      { muscle: 'shoulder', ratio: 0.85, role: 'primary' },
      { muscle: 'chest', ratio: 0.15, role: 'secondary' }
    ]
  },
  {
    id: 'face_pull',
    name: 'Face Pull',
    muscle: 'shoulder',
    category: 'upper',
    muscles: [
      { muscle: 'shoulder', ratio: 0.60, role: 'primary' },
      { muscle: 'back', ratio: 0.40, role: 'secondary' }
    ]
  },
  {
    id: 'shrug',
    name: 'Dumbbell Shrug (Trapez)',
    muscle: 'shoulder',
    category: 'upper',
    muscles: [
      { muscle: 'back', ratio: 0.55, role: 'primary' },
      { muscle: 'shoulder', ratio: 0.45, role: 'primary' }
    ]
  },

  // ==========================================
  // ÜST VÜCUT - BICEPS & TRICEPS (Arms)
  // ==========================================
  {
    id: 'biceps',
    name: 'Biceps Barbell Curl',
    muscle: 'biceps',
    category: 'upper',
    muscles: [
      { muscle: 'biceps', ratio: 0.95, role: 'primary' },
      { muscle: 'back', ratio: 0.05, role: 'stabilizer' }
    ]
  },
  {
    id: 'hammer_curl',
    name: 'Hammer Curl',
    muscle: 'biceps',
    category: 'upper',
    muscles: [
      { muscle: 'biceps', ratio: 0.90, role: 'primary' },
      { muscle: 'shoulder', ratio: 0.10, role: 'stabilizer' }
    ]
  },
  {
    id: 'preacher_curl',
    name: 'Preacher Curl (Sehpada Biceps)',
    muscle: 'biceps',
    category: 'upper',
    muscles: [
      { muscle: 'biceps', ratio: 1.00, role: 'primary' }
    ]
  },
  {
    id: 'incline_curl',
    name: 'Incline Dumbbell Curl',
    muscle: 'biceps',
    category: 'upper',
    muscles: [
      { muscle: 'biceps', ratio: 0.95, role: 'primary' },
      { muscle: 'shoulder', ratio: 0.05, role: 'stabilizer' }
    ]
  },
  {
    id: 'concentration_curl',
    name: 'Concentration Curl',
    muscle: 'biceps',
    category: 'upper',
    muscles: [
      { muscle: 'biceps', ratio: 1.00, role: 'primary' }
    ]
  },
  {
    id: 'triceps',
    name: 'Triceps Pushdown',
    muscle: 'triceps',
    category: 'upper',
    muscles: [
      { muscle: 'triceps', ratio: 0.95, role: 'primary' },
      { muscle: 'chest', ratio: 0.05, role: 'stabilizer' }
    ]
  },
  {
    id: 'skull_crusher',
    name: 'Skull Crusher',
    muscle: 'triceps',
    category: 'upper',
    muscles: [
      { muscle: 'triceps', ratio: 0.95, role: 'primary' },
      { muscle: 'shoulder', ratio: 0.05, role: 'stabilizer' }
    ]
  },
  {
    id: 'overhead_triceps',
    name: 'Overhead Triceps Extension',
    muscle: 'triceps',
    category: 'upper',
    muscles: [
      { muscle: 'triceps', ratio: 0.95, role: 'primary' },
      { muscle: 'shoulder', ratio: 0.05, role: 'stabilizer' }
    ]
  },

  // ==========================================
  // ALT VÜCUT (Lower Body)
  // ==========================================
  {
    id: 'squat',
    name: 'Barbell Squat',
    muscle: 'quads',
    category: 'lower',
    muscles: [
      { muscle: 'quads', ratio: 0.60, role: 'primary' },
      { muscle: 'glutes', ratio: 0.30, role: 'secondary' },
      { muscle: 'hamstring', ratio: 0.10, role: 'secondary' }
    ]
  },
  {
    id: 'leg_press',
    name: 'Leg Press',
    muscle: 'quads',
    category: 'lower',
    muscles: [
      { muscle: 'quads', ratio: 0.65, role: 'primary' },
      { muscle: 'glutes', ratio: 0.25, role: 'secondary' },
      { muscle: 'hamstring', ratio: 0.10, role: 'secondary' }
    ]
  },
  {
    id: 'bulgarian_split_squat',
    name: 'Bulgarian Split Squat',
    muscle: 'quads',
    category: 'lower',
    muscles: [
      { muscle: 'quads', ratio: 0.55, role: 'primary' },
      { muscle: 'glutes', ratio: 0.35, role: 'primary' },
      { muscle: 'hamstring', ratio: 0.10, role: 'secondary' }
    ]
  },
  {
    id: 'lunges',
    name: 'Dumbbell Lunges (Komando Adımı)',
    muscle: 'quads',
    category: 'lower',
    muscles: [
      { muscle: 'quads', ratio: 0.60, role: 'primary' },
      { muscle: 'glutes', ratio: 0.30, role: 'secondary' },
      { muscle: 'hamstring', ratio: 0.10, role: 'secondary' }
    ]
  },
  {
    id: 'hack_squat',
    name: 'Hack Squat',
    muscle: 'quads',
    category: 'lower',
    muscles: [
      { muscle: 'quads', ratio: 0.75, role: 'primary' },
      { muscle: 'glutes', ratio: 0.25, role: 'secondary' }
    ]
  },
  {
    id: 'quad_ext',
    name: 'Quadriceps Extension',
    muscle: 'quads',
    category: 'lower',
    muscles: [
      { muscle: 'quads', ratio: 1.00, role: 'primary' }
    ]
  },
  {
    id: 'deadlift',
    name: 'Romanian Deadlift (RDL)',
    muscle: 'hamstring',
    category: 'lower',
    muscles: [
      { muscle: 'hamstring', ratio: 0.50, role: 'primary' },
      { muscle: 'glutes', ratio: 0.35, role: 'secondary' },
      { muscle: 'back', ratio: 0.15, role: 'secondary' }
    ]
  },
  {
    id: 'ham_ext',
    name: 'Hamstring Leg Curl',
    muscle: 'hamstring',
    category: 'lower',
    muscles: [
      { muscle: 'hamstring', ratio: 1.00, role: 'primary' }
    ]
  },
  {
    id: 'hip_thrust',
    name: 'Hip Thrust',
    muscle: 'glutes',
    category: 'lower',
    muscles: [
      { muscle: 'glutes', ratio: 0.70, role: 'primary' },
      { muscle: 'hamstring', ratio: 0.20, role: 'secondary' },
      { muscle: 'quads', ratio: 0.10, role: 'secondary' }
    ]
  },
  {
    id: 'adductor',
    name: 'İç Bacak (Adductor)',
    muscle: 'quads',
    category: 'lower',
    muscles: [
      { muscle: 'quads', ratio: 0.85, role: 'primary' },
      { muscle: 'glutes', ratio: 0.15, role: 'secondary' }
    ]
  },
  {
    id: 'abductor',
    name: 'Dış Bacak (Abductor)',
    muscle: 'glutes',
    category: 'lower',
    muscles: [
      { muscle: 'glutes', ratio: 0.85, role: 'primary' },
      { muscle: 'quads', ratio: 0.15, role: 'secondary' }
    ]
  },
  {
    id: 'calf_raise',
    name: 'Calf Raise (Kalf)',
    muscle: 'calves',
    category: 'lower',
    muscles: [
      { muscle: 'calves', ratio: 1.00, role: 'primary' }
    ]
  },

  // ==========================================
  // CORE & KARIN
  // ==========================================
  {
    id: 'cable_crunch',
    name: 'Cable Crunch',
    muscle: 'abs',
    category: 'core',
    muscles: [
      { muscle: 'abs', ratio: 0.90, role: 'primary' },
      { muscle: 'back', ratio: 0.10, role: 'stabilizer' }
    ]
  },
  {
    id: 'hanging_leg_raise',
    name: 'Hanging Leg Raise',
    muscle: 'abs',
    category: 'core',
    muscles: [
      { muscle: 'abs', ratio: 0.80, role: 'primary' },
      { muscle: 'quads', ratio: 0.20, role: 'secondary' }
    ]
  },
  {
    id: 'russian_twist',
    name: 'Russian Twist (Oblik)',
    muscle: 'abs',
    category: 'core',
    muscles: [
      { muscle: 'abs', ratio: 1.00, role: 'primary' }
    ]
  },
  {
    id: 'plank',
    name: 'Plank Hold',
    muscle: 'abs',
    category: 'core',
    measurementType: 'duration',
    muscles: [
      { muscle: 'abs', ratio: 0.80, role: 'primary' },
      { muscle: 'shoulder', ratio: 0.10, role: 'stabilizer' },
      { muscle: 'glutes', ratio: 0.10, role: 'stabilizer' }
    ]
  }
];
