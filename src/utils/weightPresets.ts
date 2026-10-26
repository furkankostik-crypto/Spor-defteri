import { MuscleGroup } from '../types/workout';

export interface ExerciseWeightPresetConfig {
  equipmentCategory: string;
  defaultStep: number;
  largeStep: number;
  availableSteps: number[];
  presetWeights: number[];
}

export const REP_WHEEL_VALUES: number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 25, 30, 35, 40, 50
];

export const DURATION_WHEEL_VALUES: number[] = [
  5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 75, 90, 105, 120, 135, 150, 180, 210, 240, 300
];

export const REP_PRESETS: { value: number; tag?: string }[] = [
  { value: 3, tag: 'Güç' },
  { value: 5, tag: 'Kuvvet' },
  { value: 6, tag: 'Kuvvet' },
  { value: 8, tag: 'Hipertrofi' },
  { value: 10, tag: 'Hipertrofi' },
  { value: 12, tag: 'Hipertrofi' },
  { value: 15, tag: 'Dayanıklılık' },
  { value: 20, tag: 'Pump' },
  { value: 25 }
];

export const DURATION_PRESETS: { value: number; label: string }[] = [
  { value: 20, label: '20 sn' },
  { value: 30, label: '30 sn' },
  { value: 45, label: '45 sn' },
  { value: 60, label: '1 dk (60s)' },
  { value: 75, label: '75 sn' },
  { value: 90, label: '1.5 dk (90s)' },
  { value: 120, label: '2 dk (120s)' },
  { value: 180, label: '3 dk (180s)' }
];

// Dumbbell Isolation Movements
const DUMBBELL_ISOLATION_IDS = new Set([
  'dumbbell_fly',
  'shoulder_fly',
  'rear_delt_fly',
  'front_raise',
  'hammer_curl',
  'incline_curl',
  'concentration_curl',
  'overhead_triceps',
  'russian_twist'
]);

// Dumbbell Compound Movements
const DUMBBELL_COMPOUND_IDS = new Set([
  'incline_bench',
  'dumbbell_row',
  'shrug',
  'bulgarian_split_squat',
  'lunges'
]);

// EZ-Bar / Small Barbell Isolation
const EZ_BAR_IDS = new Set([
  'biceps',
  'preacher_curl',
  'skull_crusher'
]);

// Upper / Core Cable & Pin-Loaded Machines
const CABLE_MACHINE_UPPER_IDS = new Set([
  'cable_crossover',
  'pec_deck',
  'latpull',
  'row',
  'straight_arm_pulldown',
  'face_pull',
  'triceps',
  'cable_crunch'
]);

// Lower Body Pin-Loaded Machines
const MACHINE_LOWER_IDS = new Set([
  'quad_ext',
  'ham_ext',
  'adductor',
  'abductor',
  'calf_raise'
]);

// Olympic Barbell Upper Compound
const BARBELL_UPPER_IDS = new Set([
  'bench',
  'barbell_row',
  'tbar_row',
  'shoulder_press'
]);

// Heavy Olympic Barbell Lower Compound
const BARBELL_LOWER_IDS = new Set([
  'squat',
  'deadlift',
  'hip_thrust'
]);

// Plate-Loaded Heavy Leg Sleds
const HEAVY_SLED_IDS = new Set([
  'leg_press',
  'hack_squat'
]);

// Bodyweight / Weighted Calisthenics
const BODYWEIGHT_PLUS_IDS = new Set([
  'chest_dips',
  'pullup',
  'hanging_leg_raise'
]);

/**
 * Returns tailored preset weights and step increments based on the exercise's biomechanics & equipment
 */
export function getExerciseWeightConfig(
  exerciseId?: string,
  muscle?: MuscleGroup,
  category?: string,
  bodyWeightKg: number = 75
): ExerciseWeightPresetConfig {
  const id = exerciseId || '';

  if (DUMBBELL_ISOLATION_IDS.has(id)) {
    return {
      equipmentCategory: 'Dumbbell • İzole',
      defaultStep: 1,
      largeStep: 2.5,
      availableSteps: [0.5, 1, 2, 2.5, 5],
      presetWeights: [2, 3, 4, 5, 6, 7.5, 8, 10, 12, 12.5, 14, 15, 17.5, 20, 22.5, 25, 30]
    };
  }

  if (DUMBBELL_COMPOUND_IDS.has(id)) {
    return {
      equipmentCategory: 'Dumbbell • Bileşke',
      defaultStep: 2.5,
      largeStep: 5,
      availableSteps: [1, 2, 2.5, 5, 10],
      presetWeights: [7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 40, 45, 50]
    };
  }

  if (EZ_BAR_IDS.has(id)) {
    return {
      equipmentCategory: 'EZ-Bar / Kısa Bar',
      defaultStep: 2.5,
      largeStep: 5,
      availableSteps: [1, 1.25, 2.5, 5, 10],
      presetWeights: [10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 40, 45, 50]
    };
  }

  if (CABLE_MACHINE_UPPER_IDS.has(id)) {
    return {
      equipmentCategory: 'Makine / Kablo • Plaka',
      defaultStep: 2.5,
      largeStep: 5,
      availableSteps: [1.25, 2.5, 5, 7.5, 10],
      presetWeights: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 100]
    };
  }

  if (MACHINE_LOWER_IDS.has(id)) {
    return {
      equipmentCategory: 'Bacak Makinesi • Plaka',
      defaultStep: 5,
      largeStep: 10,
      availableSteps: [2.5, 5, 7.5, 10, 15],
      presetWeights: [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 80, 90, 100, 110, 120]
    };
  }

  if (BARBELL_UPPER_IDS.has(id)) {
    return {
      equipmentCategory: 'Olimpik Barbell',
      defaultStep: 2.5,
      largeStep: 5,
      availableSteps: [1.25, 2.5, 5, 10, 20],
      presetWeights: [20, 30, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120, 130, 140]
    };
  }

  if (BARBELL_LOWER_IDS.has(id)) {
    return {
      equipmentCategory: 'Ağır Bileşke Barbell',
      defaultStep: 5,
      largeStep: 10,
      availableSteps: [2.5, 5, 10, 15, 20],
      presetWeights: [20, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 180, 200, 220]
    };
  }

  if (HEAVY_SLED_IDS.has(id)) {
    return {
      equipmentCategory: 'Plaka Yüklemeli Kızak',
      defaultStep: 10,
      largeStep: 20,
      availableSteps: [5, 10, 20, 40],
      presetWeights: [40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 360]
    };
  }

  if (BODYWEIGHT_PLUS_IDS.has(id)) {
    const bw = Math.round(bodyWeightKg || 75);
    const basePresets = [2.5, 5, 7.5, 10, 12.5, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 85, 90, 100];
    if (bw > 0 && !basePresets.includes(bw)) {
      basePresets.push(bw);
      basePresets.sort((a, b) => a - b);
    }
    return {
      equipmentCategory: 'Vücut Ağırlığı / Ek Yük',
      defaultStep: 2.5,
      largeStep: 5,
      availableSteps: [1.25, 2.5, 5, 10],
      presetWeights: basePresets
    };
  }

  // Fallback for custom exercises based on muscle / category
  if (category === 'lower' || muscle === 'quads' || muscle === 'hamstring' || muscle === 'glutes') {
    return {
      equipmentCategory: 'Alt Vücut Ağırlık',
      defaultStep: 5,
      largeStep: 10,
      availableSteps: [2.5, 5, 10, 20],
      presetWeights: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 140, 160]
    };
  }

  if (muscle === 'biceps' || muscle === 'triceps' || muscle === 'shoulder') {
    return {
      equipmentCategory: 'Üst Vücut / Kol & Omuz',
      defaultStep: 2.5,
      largeStep: 5,
      availableSteps: [1, 1.25, 2.5, 5, 10],
      presetWeights: [5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 30, 35, 40, 45, 50]
    };
  }

  return {
    equipmentCategory: 'Standart Ağırlık',
    defaultStep: 2.5,
    largeStep: 5,
    availableSteps: [1, 1.25, 2.5, 5, 10],
    presetWeights: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90, 100]
  };
}

/**
 * Generates an alarm-clock style scrolling sequence of numbers for the roller wheel,
 * calibrated to the movement and including the current weight.
 */
export function getExerciseWheelWeights(
  exerciseId?: string,
  muscle?: MuscleGroup,
  category?: string,
  extraValues: number[] = [],
  bodyWeightKg: number = 75
): number[] {
  const id = exerciseId || '';
  const set = new Set<number>();

  if (DUMBBELL_ISOLATION_IDS.has(id)) {
    // 1kg steps from 1 to 20, then 2.5kg steps to 40
    for (let w = 1; w <= 20; w += 1) set.add(w);
    for (let w = 22.5; w <= 40; w += 2.5) set.add(w);
    // Add common half-weights
    set.add(2.5); set.add(7.5); set.add(12.5); set.add(17.5);
  } else if (DUMBBELL_COMPOUND_IDS.has(id) || EZ_BAR_IDS.has(id)) {
    // 2.5kg steps from 5 to 55
    for (let w = 5; w <= 60; w += 2.5) set.add(w);
  } else if (CABLE_MACHINE_UPPER_IDS.has(id) || BARBELL_UPPER_IDS.has(id)) {
    // 2.5kg steps from 5 to 140
    for (let w = 5; w <= 100; w += 2.5) set.add(w);
    for (let w = 105; w <= 150; w += 5) set.add(w);
  } else if (MACHINE_LOWER_IDS.has(id) || BARBELL_LOWER_IDS.has(id)) {
    // 5kg steps from 15 to 220
    for (let w = 15; w <= 100; w += 2.5) set.add(w);
    for (let w = 105; w <= 240; w += 5) set.add(w);
  } else if (HEAVY_SLED_IDS.has(id)) {
    // 10kg steps from 20 to 360
    for (let w = 20; w <= 100; w += 10) set.add(w);
    for (let w = 110; w <= 360; w += 10) set.add(w);
  } else if (category === 'lower' || muscle === 'quads' || muscle === 'hamstring' || muscle === 'glutes') {
    // Custom lower body exercises
    for (let w = 10; w <= 160; w += 5) set.add(w);
  } else if (muscle === 'biceps' || muscle === 'triceps' || muscle === 'shoulder') {
    // Custom arm / shoulder exercises
    for (let w = 2.5; w <= 50; w += 2.5) set.add(w);
  } else {
    // Default 2.5kg steps
    for (let w = 2.5; w <= 100; w += 2.5) set.add(w);
    for (let w = 105; w <= 160; w += 5) set.add(w);
  }

  // Include bodyweight if provided
  if (bodyWeightKg > 0) {
    set.add(Math.round(bodyWeightKg));
  }

  // Include any extra passed values (current weight, last weight, PR)
  extraValues.forEach((v) => {
    if (v > 0) set.add(v);
  });

  return Array.from(set).sort((a, b) => a - b);
}
