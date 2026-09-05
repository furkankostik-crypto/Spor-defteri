import { StrengthTier, StrengthTierConfig } from '../types/workout';

export const strengthTierConfigs: Record<StrengthTier, StrengthTierConfig> = {
  beginner: {
    id: 'beginner',
    title: 'Başlangıç',
    badge: '🌱',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #059669, #34d399)',
    description: 'Spora yeni başlayan veya ilk kez bu hareketi deneyen sporcu.'
  },
  novice: {
    id: 'novice',
    title: 'Çaylak',
    badge: '⚔️',
    color: '#38bdf8',
    gradient: 'linear-gradient(135deg, #0284c7, #38bdf8)',
    description: 'Birkaç aydır düzenli çalışan, hareket formunu oturtmuş sporcu.'
  },
  intermediate: {
    id: 'intermediate',
    title: 'Orta Seviye',
    badge: '🥉',
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, #d97706, #facc15)',
    description: '1-2 yıl disiplinli antrenman yapan, salon ortalamasının üstünde güç.'
  },
  advanced: {
    id: 'advanced',
    title: 'İleri Düzey',
    badge: '🥈',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #c2410c, #fb923c)',
    description: 'Birkaç yıl sıkı çalışan, elit yarışmacı seviyesine yakın sporcu.'
  },
  elite: {
    id: 'elite',
    title: 'Elit Düzey',
    badge: '👑',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #b91c1c, #f87171)',
    description: 'Dünya ve ulusal standartlarda en üst %1 güç dilimi.'
  }
};

export const STRENGTH_TIER_ORDER: StrengthTier[] = [
  'beginner',
  'novice',
  'intermediate',
  'advanced',
  'elite'
];

export interface ExerciseStandardMultipliers {
  male: Record<StrengthTier, number>;
  female: Record<StrengthTier, number>;
}

/**
 * Bodyweight multiplier standards for 1RM calibrated with GymLevels / StrengthLevel standards.
 * Example: 75kg male with 1.15 bench multiplier -> 86.25 kg 1RM is Intermediate.
 */
export const exerciseStandards: Record<string, ExerciseStandardMultipliers> = {
  // Göğüs (Chest)
  bench: {
    male: { beginner: 0.60, novice: 0.85, intermediate: 1.15, advanced: 1.50, elite: 1.85 },
    female: { beginner: 0.35, novice: 0.50, intermediate: 0.70, advanced: 0.95, elite: 1.20 }
  },
  incline_bench: {
    male: { beginner: 0.50, novice: 0.70, intermediate: 0.95, advanced: 1.25, elite: 1.55 },
    female: { beginner: 0.30, novice: 0.45, intermediate: 0.60, advanced: 0.80, elite: 1.05 }
  },

  // Sırt (Back)
  latpull: {
    male: { beginner: 0.55, novice: 0.75, intermediate: 1.00, advanced: 1.30, elite: 1.55 },
    female: { beginner: 0.35, novice: 0.50, intermediate: 0.70, advanced: 0.90, elite: 1.10 }
  },
  row: {
    male: { beginner: 0.50, novice: 0.70, intermediate: 0.95, advanced: 1.25, elite: 1.50 },
    female: { beginner: 0.30, novice: 0.45, intermediate: 0.65, advanced: 0.85, elite: 1.05 }
  },
  tbar_row: {
    male: { beginner: 0.55, novice: 0.75, intermediate: 1.00, advanced: 1.30, elite: 1.55 },
    female: { beginner: 0.35, novice: 0.50, intermediate: 0.70, advanced: 0.90, elite: 1.10 }
  },

  // Omuz (Shoulder)
  shoulder_press: {
    male: { beginner: 0.35, novice: 0.50, intermediate: 0.70, advanced: 0.95, elite: 1.15 },
    female: { beginner: 0.22, novice: 0.32, intermediate: 0.45, advanced: 0.60, elite: 0.78 }
  },
  shoulder_fly: {
    male: { beginner: 0.12, novice: 0.18, intermediate: 0.25, advanced: 0.34, elite: 0.44 },
    female: { beginner: 0.08, novice: 0.12, intermediate: 0.17, advanced: 0.23, elite: 0.30 }
  },
  face_pull: {
    male: { beginner: 0.25, novice: 0.38, intermediate: 0.52, advanced: 0.70, elite: 0.90 },
    female: { beginner: 0.15, novice: 0.25, intermediate: 0.35, advanced: 0.48, elite: 0.62 }
  },

  // Biceps
  biceps: {
    male: { beginner: 0.25, novice: 0.38, intermediate: 0.52, advanced: 0.70, elite: 0.88 },
    female: { beginner: 0.15, novice: 0.24, intermediate: 0.34, advanced: 0.46, elite: 0.60 }
  },
  hammer_curl: {
    male: { beginner: 0.22, novice: 0.35, intermediate: 0.48, advanced: 0.65, elite: 0.80 },
    female: { beginner: 0.14, novice: 0.22, intermediate: 0.32, advanced: 0.42, elite: 0.55 }
  },

  // Triceps
  triceps: {
    male: { beginner: 0.30, novice: 0.45, intermediate: 0.65, advanced: 0.85, elite: 1.05 },
    female: { beginner: 0.18, novice: 0.28, intermediate: 0.40, advanced: 0.55, elite: 0.70 }
  },
  skull_crusher: {
    male: { beginner: 0.25, novice: 0.38, intermediate: 0.52, advanced: 0.70, elite: 0.88 },
    female: { beginner: 0.15, novice: 0.24, intermediate: 0.34, advanced: 0.46, elite: 0.60 }
  },

  // Alt Vücut (Legs & Glutes)
  squat: {
    male: { beginner: 0.75, novice: 1.15, intermediate: 1.50, advanced: 2.00, elite: 2.45 },
    female: { beginner: 0.50, novice: 0.75, intermediate: 1.05, advanced: 1.40, elite: 1.75 }
  },
  deadlift: {
    male: { beginner: 0.95, novice: 1.40, intermediate: 1.85, advanced: 2.40, elite: 2.90 },
    female: { beginner: 0.60, novice: 0.90, intermediate: 1.25, advanced: 1.65, elite: 2.05 }
  },
  leg_press: {
    male: { beginner: 1.40, novice: 2.10, intermediate: 2.80, advanced: 3.80, elite: 4.60 },
    female: { beginner: 0.90, novice: 1.40, intermediate: 1.90, advanced: 2.60, elite: 3.20 }
  },
  quad_ext: {
    male: { beginner: 0.40, novice: 0.60, intermediate: 0.85, advanced: 1.15, elite: 1.40 },
    female: { beginner: 0.25, novice: 0.40, intermediate: 0.55, advanced: 0.75, elite: 0.95 }
  },
  ham_ext: {
    male: { beginner: 0.35, novice: 0.50, intermediate: 0.70, advanced: 0.95, elite: 1.15 },
    female: { beginner: 0.22, novice: 0.33, intermediate: 0.46, advanced: 0.62, elite: 0.78 }
  },
  hip_thrust: {
    male: { beginner: 0.80, novice: 1.25, intermediate: 1.70, advanced: 2.30, elite: 2.85 },
    female: { beginner: 0.60, novice: 0.95, intermediate: 1.40, advanced: 1.95, elite: 2.45 }
  },
  adductor: {
    male: { beginner: 0.40, novice: 0.60, intermediate: 0.80, advanced: 1.05, elite: 1.30 },
    female: { beginner: 0.30, novice: 0.45, intermediate: 0.65, advanced: 0.85, elite: 1.05 }
  },
  abductor: {
    male: { beginner: 0.40, novice: 0.60, intermediate: 0.80, advanced: 1.05, elite: 1.30 },
    female: { beginner: 0.30, novice: 0.45, intermediate: 0.65, advanced: 0.85, elite: 1.05 }
  },
  calf_raise: {
    male: { beginner: 0.60, novice: 0.90, intermediate: 1.25, advanced: 1.70, elite: 2.10 },
    female: { beginner: 0.40, novice: 0.60, intermediate: 0.85, advanced: 1.15, elite: 1.45 }
  },

  // Core
  cable_crunch: {
    male: { beginner: 0.35, novice: 0.50, intermediate: 0.70, advanced: 0.95, elite: 1.15 },
    female: { beginner: 0.22, novice: 0.33, intermediate: 0.46, advanced: 0.62, elite: 0.78 }
  }
};

// Generic fallback for custom exercises
export const defaultFallbackStandard: ExerciseStandardMultipliers = {
  male: { beginner: 0.45, novice: 0.65, intermediate: 0.90, advanced: 1.20, elite: 1.50 },
  female: { beginner: 0.28, novice: 0.42, intermediate: 0.60, advanced: 0.80, elite: 1.00 }
};

export function getExerciseStandards(exerciseId: string): ExerciseStandardMultipliers {
  return exerciseStandards[exerciseId] || defaultFallbackStandard;
}
