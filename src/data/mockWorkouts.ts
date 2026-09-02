import { Workout, ExerciseSet, SavedExercise } from '../types/workout';

interface ExerciseProgressionConfig {
  id: string;
  name: string;
  muscle: any;
  startWeight: number;
  endWeight: number;
  step: number;
  baseReps: number;
}

const exerciseConfigs: Record<string, ExerciseProgressionConfig> = {
  bench: { id: 'bench', name: 'Bench Press', muscle: 'chest', startWeight: 45, endWeight: 92.5, step: 2.5, baseReps: 8 },
  incline_bench: { id: 'incline_bench', name: 'Incline Dumbbell Press', muscle: 'chest', startWeight: 14, endWeight: 28, step: 2, baseReps: 10 },
  latpull: { id: 'latpull', name: 'Lat Pulldown', muscle: 'back', startWeight: 35, endWeight: 75, step: 5, baseReps: 10 },
  row: { id: 'row', name: 'Seated Cable Row', muscle: 'back', startWeight: 35, endWeight: 75, step: 5, baseReps: 10 },
  tbar_row: { id: 'tbar_row', name: 'T-Bar Row', muscle: 'back', startWeight: 30, endWeight: 75, step: 2.5, baseReps: 8 },
  shoulder_press: { id: 'shoulder_press', name: 'Shoulder Press', muscle: 'shoulder', startWeight: 12, endWeight: 26, step: 2, baseReps: 8 },
  shoulder_fly: { id: 'shoulder_fly', name: 'Lateral Raise (Omuz Fly)', muscle: 'shoulder', startWeight: 6, endWeight: 14, step: 1, baseReps: 12 },
  face_pull: { id: 'face_pull', name: 'Face Pull', muscle: 'shoulder', startWeight: 20, endWeight: 40, step: 2.5, baseReps: 12 },
  biceps: { id: 'biceps', name: 'Biceps Barbell Curl', muscle: 'biceps', startWeight: 15, endWeight: 35, step: 2.5, baseReps: 10 },
  hammer_curl: { id: 'hammer_curl', name: 'Hammer Curl', muscle: 'biceps', startWeight: 8, endWeight: 18, step: 2, baseReps: 10 },
  triceps: { id: 'triceps', name: 'Triceps Pushdown', muscle: 'triceps', startWeight: 20, endWeight: 45, step: 2.5, baseReps: 12 },
  skull_crusher: { id: 'skull_crusher', name: 'Skull Crusher', muscle: 'triceps', startWeight: 15, endWeight: 32.5, step: 2.5, baseReps: 10 },
  
  squat: { id: 'squat', name: 'Barbell Squat', muscle: 'quads', startWeight: 50, endWeight: 135, step: 5, baseReps: 6 },
  leg_press: { id: 'leg_press', name: 'Leg Press', muscle: 'quads', startWeight: 100, endWeight: 260, step: 10, baseReps: 10 },
  quad_ext: { id: 'quad_ext', name: 'Quadriceps Extension', muscle: 'quads', startWeight: 30, endWeight: 75, step: 5, baseReps: 12 },
  deadlift: { id: 'deadlift', name: 'Romanian Deadlift (RDL)', muscle: 'hamstring', startWeight: 50, endWeight: 130, step: 5, baseReps: 8 },
  ham_ext: { id: 'ham_ext', name: 'Hamstring Leg Curl', muscle: 'hamstring', startWeight: 25, endWeight: 60, step: 5, baseReps: 12 },
  hip_thrust: { id: 'hip_thrust', name: 'Hip Thrust', muscle: 'glutes', startWeight: 60, endWeight: 150, step: 5, baseReps: 10 },
  adductor: { id: 'adductor', name: 'İç Bacak (Adductor)', muscle: 'quads', startWeight: 30, endWeight: 65, step: 5, baseReps: 12 },
  abductor: { id: 'abductor', name: 'Dış Bacak (Abductor)', muscle: 'glutes', startWeight: 30, endWeight: 65, step: 5, baseReps: 12 },
  calf_raise: { id: 'calf_raise', name: 'Calf Raise (Kalf)', muscle: 'calves', startWeight: 30, endWeight: 75, step: 5, baseReps: 15 },
  
  cable_crunch: { id: 'cable_crunch', name: 'Cable Crunch', muscle: 'abs', startWeight: 30, endWeight: 70, step: 5, baseReps: 15 },
  hanging_leg_raise: { id: 'hanging_leg_raise', name: 'Hanging Leg Raise', muscle: 'abs', startWeight: 0, endWeight: 15, step: 2.5, baseReps: 12 },
  plank: { id: 'plank', name: 'Plank Hold', muscle: 'abs', startWeight: 0, endWeight: 25, step: 5, baseReps: 60 }
};

// Routine Templates
const routineTemplates = [
  // 0: Upper A
  {
    type: 'Üst Vücut',
    splitType: 'upper' as const,
    exerciseIds: ['bench', 'incline_bench', 'latpull', 'row', 'shoulder_fly', 'biceps', 'triceps']
  },
  // 1: Lower A
  {
    type: 'Alt Vücut',
    splitType: 'lower' as const,
    exerciseIds: ['squat', 'leg_press', 'deadlift', 'ham_ext', 'calf_raise', 'cable_crunch']
  },
  // 2: Upper B
  {
    type: 'Üst Vücut',
    splitType: 'upper' as const,
    exerciseIds: ['incline_bench', 'tbar_row', 'shoulder_press', 'face_pull', 'shoulder_fly', 'hammer_curl', 'skull_crusher']
  },
  // 3: Lower B
  {
    type: 'Alt Vücut',
    splitType: 'lower' as const,
    exerciseIds: ['deadlift', 'squat', 'hip_thrust', 'quad_ext', 'adductor', 'abductor', 'calf_raise']
  },
  // 4: Full Body (Occasional variety)
  {
    type: 'Tüm Vücut',
    splitType: 'full' as const,
    exerciseIds: ['bench', 'latpull', 'squat', 'shoulder_press', 'biceps', 'hanging_leg_raise']
  }
];

/**
 * Generates 2 years (104 weeks) of realistic progressive overload workout records
 */
export function generateTwoYearWorkouts(endDateStr?: string): Workout[] {
  const endDate = endDateStr ? new Date(endDateStr) : new Date();
  // Ensure valid date
  if (isNaN(endDate.getTime())) {
    return [];
  }

  const totalWeeks = 104; // 2 years
  const workouts: Workout[] = [];

  // Start date = 104 weeks ago
  const startDate = new Date(endDate.getTime() - totalWeeks * 7 * 24 * 60 * 60 * 1000);

  for (let week = 0; week < totalWeeks; week++) {
    // Progression ratio from 0.0 to 1.0 with slight logarithmic curve (faster beginner gains, steady advance)
    const rawProgress = week / (totalWeeks - 1);
    const progressFactor = 0.55 * rawProgress + 0.45 * (1 - Math.exp(-2.5 * rawProgress)) / (1 - Math.exp(-2.5));

    // Deload week every 8 weeks (weights drop by ~15%, reps slightly higher)
    const isDeload = week % 8 === 7;

    // Pick 3 workout days in this week (Monday: 1, Wednesday: 3, Friday: 5 or Saturday: 6)
    const weekStartMs = startDate.getTime() + week * 7 * 24 * 60 * 60 * 1000;
    
    // Determine 3 sessions for this week
    const sessions = [
      { dayOffset: 1, templateIdx: (week % 2 === 0) ? 0 : 2 }, // Mon: Upper A or Upper B
      { dayOffset: 3, templateIdx: (week % 2 === 0) ? 1 : 3 }, // Wed: Lower A or Lower B
      { dayOffset: (week % 3 === 0) ? 5 : 4, templateIdx: (week % 4 === 0) ? 4 : ((week % 2 === 0) ? 2 : 0) } // Fri/Sat: Upper B / Upper A / Full Body
    ];

    sessions.forEach((session, sessionIdx) => {
      const sessionDate = new Date(weekStartMs + session.dayOffset * 24 * 60 * 60 * 1000);
      
      // Do not generate workouts in the future
      if (sessionDate > endDate) return;

      const yyyy = sessionDate.getFullYear();
      const mm = String(sessionDate.getMonth() + 1).padStart(2, '0');
      const dd = String(sessionDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const template = routineTemplates[session.templateIdx];
      const recordedExercises: SavedExercise[] = [];

      template.exerciseIds.forEach((exId) => {
        const config = exerciseConfigs[exId];
        if (!config) return;

        // Calculate target weight for this week
        let weightRange = config.endWeight - config.startWeight;
        let baseWeight = config.startWeight + weightRange * progressFactor;

        if (isDeload) {
          baseWeight *= 0.85;
        }

        // Add minor organic variation (+- 2-4%) so every session isn't identical
        const variance = 1 + (Math.sin(week * 1.7 + sessionIdx * 2.3) * 0.03);
        let topWeight = baseWeight * variance;

        // Round to valid step increment
        topWeight = Math.round(topWeight / config.step) * config.step;
        if (config.startWeight > 0) {
          topWeight = Math.max(config.step, topWeight);
        }

        // Generate 3-4 progressive sets (pyramid style)
        const numSets = (exId === 'bench' || exId === 'squat' || exId === 'deadlift') ? 4 : 3;
        const detailedSets: ExerciseSet[] = [];
        const weightsList: number[] = [];

        for (let s = 1; s <= numSets; s++) {
          let setWeight = topWeight;
          let setReps = config.baseReps;

          if (isDeload) {
            setReps = config.baseReps + 2;
          }

          if (s === 1) {
            // Set 1: ~80-85% weight, more reps
            setWeight = Math.round((topWeight * 0.82) / config.step) * config.step;
            setReps = config.baseReps + 2;
          } else if (s === 2) {
            // Set 2: ~90-95% weight
            setWeight = Math.round((topWeight * 0.92) / config.step) * config.step;
            setReps = config.baseReps;
          } else if (s === 3) {
            // Set 3: Top set
            setWeight = topWeight;
            setReps = Math.max(5, config.baseReps - 1);
          } else if (s === 4) {
            // Set 4 (if compound): Top set or failure
            setWeight = topWeight;
            setReps = Math.max(5, config.baseReps - 2);
          }

          if (config.startWeight > 0 && setWeight < config.step) {
            setWeight = config.step;
          }

          detailedSets.push({
            id: String(s),
            weight: setWeight,
            reps: setReps,
            completed: true
          });
          weightsList.push(setWeight);
        }

        recordedExercises.push({
          id: config.id,
          name: config.name,
          muscle: config.muscle,
          sets: weightsList,
          detailedSets: detailedSets
        });
      });

      const workoutId = `w-${sessionDate.getTime()}-${Math.random().toString(36).substring(2, 7)}`;

      workouts.push({
        id: workoutId,
        date: dateStr,
        type: template.type,
        splitType: template.splitType,
        exercises: recordedExercises,
        createdAt: sessionDate.getTime() + 1000 * 60 * 60 * 18 // 18:00
      });
    });
  }

  // Sort descending by date (most recent first)
  workouts.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.createdAt - a.createdAt;
  });

  return workouts;
}
