import { ExerciseDefinition } from '../types/workout';

export const defaultExercises: ExerciseDefinition[] = [
  // ==========================================
  // ÜST VÜCUT (Upper Body)
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
    id: 'plank',
    name: 'Plank Hold',
    muscle: 'abs',
    category: 'core',
    muscles: [
      { muscle: 'abs', ratio: 0.80, role: 'primary' },
      { muscle: 'shoulder', ratio: 0.10, role: 'stabilizer' },
      { muscle: 'glutes', ratio: 0.10, role: 'stabilizer' }
    ]
  }
];
