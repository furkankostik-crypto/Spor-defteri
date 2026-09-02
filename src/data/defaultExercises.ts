import { ExerciseDefinition } from '../types/workout';

export const defaultExercises: ExerciseDefinition[] = [
  // Üst Vücut (Upper Body)
  { id: 'bench', name: 'Bench Press', muscle: 'chest', category: 'upper' },
  { id: 'incline_bench', name: 'Incline Dumbbell Press', muscle: 'chest', category: 'upper' },
  { id: 'latpull', name: 'Lat Pulldown', muscle: 'back', category: 'upper' },
  { id: 'row', name: 'Seated Cable Row', muscle: 'back', category: 'upper' },
  { id: 'tbar_row', name: 'T-Bar Row', muscle: 'back', category: 'upper' },
  { id: 'shoulder_press', name: 'Shoulder Press', muscle: 'shoulder', category: 'upper' },
  { id: 'shoulder_fly', name: 'Lateral Raise (Omuz Fly)', muscle: 'shoulder', category: 'upper' },
  { id: 'face_pull', name: 'Face Pull', muscle: 'shoulder', category: 'upper' },
  { id: 'biceps', name: 'Biceps Barbell Curl', muscle: 'biceps', category: 'upper' },
  { id: 'hammer_curl', name: 'Hammer Curl', muscle: 'biceps', category: 'upper' },
  { id: 'triceps', name: 'Triceps Pushdown', muscle: 'triceps', category: 'upper' },
  { id: 'skull_crusher', name: 'Skull Crusher', muscle: 'triceps', category: 'upper' },

  // Alt Vücut (Lower Body)
  { id: 'squat', name: 'Barbell Squat', muscle: 'quads', category: 'lower' },
  { id: 'leg_press', name: 'Leg Press', muscle: 'quads', category: 'lower' },
  { id: 'quad_ext', name: 'Quadriceps Extension', muscle: 'quads', category: 'lower' },
  { id: 'deadlift', name: 'Romanian Deadlift (RDL)', muscle: 'hamstring', category: 'lower' },
  { id: 'ham_ext', name: 'Hamstring Leg Curl', muscle: 'hamstring', category: 'lower' },
  { id: 'hip_thrust', name: 'Hip Thrust', muscle: 'glutes', category: 'lower' },
  { id: 'adductor', name: 'İç Bacak (Adductor)', muscle: 'quads', category: 'lower' },
  { id: 'abductor', name: 'Dış Bacak (Abductor)', muscle: 'glutes', category: 'lower' },
  { id: 'calf_raise', name: 'Calf Raise (Kalf)', muscle: 'calves', category: 'lower' },

  // Core & Karın
  { id: 'cable_crunch', name: 'Cable Crunch', muscle: 'abs', category: 'core' },
  { id: 'hanging_leg_raise', name: 'Hanging Leg Raise', muscle: 'abs', category: 'core' },
  { id: 'plank', name: 'Plank Hold', muscle: 'abs', category: 'core' }
];
