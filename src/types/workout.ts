export type MuscleGroup = 
  | 'chest' 
  | 'back' 
  | 'shoulder' 
  | 'biceps' 
  | 'triceps' 
  | 'quads' 
  | 'hamstring' 
  | 'calves' 
  | 'glutes' 
  | 'abs' 
  | 'cardio';

export type SplitType = 'upper' | 'lower' | 'full' | 'custom';

export interface ExerciseSet {
  id: string;
  weight: number; // in kg
  reps: number;   // default 5
  completed?: boolean;
}

export interface MuscleActivation {
  muscle: MuscleGroup;
  ratio: number; // 0.0 - 1.0 (toplam 1.0)
  role: 'primary' | 'secondary' | 'stabilizer';
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  muscle: MuscleGroup;
  category: 'upper' | 'lower' | 'core' | 'cardio' | 'other';
  muscles?: MuscleActivation[];
  isCustom?: boolean;
}

export interface MuscleLevelInfo {
  muscle: MuscleGroup;
  name: string;
  level: number;
  currentEXP: number;
  levelBaseEXP: number;
  nextLevelEXP: number;
  progressPercent: number;
  totalVolumeKg: number;
  totalEffectiveSets: number;
  rankTitle: string;
  rankBadge: string;
  color: string;
}

export interface SavedExercise {
  id: string;
  name: string;
  muscle?: MuscleGroup;
  sets: number[]; // legacy kg array support [s1, s2, s3]
  detailedSets?: ExerciseSet[]; // modern detailed sets support
}

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  type: string; // e.g. "Üst Vücut", "Alt Vücut", "Tüm Vücut"
  splitType?: SplitType;
  durationMinutes?: number;
  notes?: string;
  exercises: SavedExercise[];
  createdAt: number;
}

export interface ExerciseLevelInfo {
  exerciseId: string;
  name: string;
  muscle: MuscleGroup;
  totalEXP: number;
  currentLevel: number; // 1 - 1000
  levelBaseEXP: number;
  nextLevelEXP: number;
  progressPercent: number;
  prWeight: number; // Max weight ever lifted
  prReps?: number;
  totalSets: number;
  totalVolume: number;
  lastTrainedDate?: string;
}

export interface OverallPlayerStats {
  totalEXP: number;
  overallLevel: number;
  rankTitle: string;
  rankBadgeColor: string;
  rankGradient: string;
  nextRankEXP: number;
  rankProgressPct: number;
  totalWorkouts: number;
  totalVolumeKg: number;
  totalSetsCount: number;
  activeStreak: number;
}

export interface RankTier {
  minLevel: number;
  title: string;
  badge: string;
  color: string;
  gradient: string;
  description: string;
}

export type TabType = 'workout' | 'levels' | 'history' | 'stats';

export type SyncMode = 'smart' | 'on_save_only' | 'manual';

export interface CloudSyncSettings {
  syncMode: SyncMode; // 'smart' = akıllı diff ile oto eşitle, 'on_save_only' = yalnızca yeni antrenman kaydında, 'manual' = sadece butona basılınca
  silentAutoSync: boolean; // true = otomatik arka plan eşitlemelerinde toast bildirimlerini gizle
  autoSyncOnStartup: boolean; // true = açılışta akıllı eşitleme kontrolü yap
}

export interface SyncDiffResult {
  hasChanges: boolean;
  localHasNew: boolean;
  cloudHasNew: boolean;
  changedCount: number;
}

export type Gender = 'male' | 'female';

export interface AthleteProfile {
  bodyWeightKg: number;
  gender: Gender;
  age?: number;
  geminiApiKey?: string;
  trainingGoal?: 'strength' | 'hypertrophy' | 'endurance';
}

export type StrengthTier = 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'elite';

export interface StrengthTierConfig {
  id: StrengthTier;
  title: string;
  badge: string;
  color: string;
  gradient: string;
  description: string;
}

export interface ExerciseStrengthAnalysis {
  exerciseId: string;
  exerciseName: string;
  estimated1RM: number;
  bestSetWeight: number;
  bestSetReps: number;
  bodyweightRatio: number;
  strengthScore: number; // 0 - 100
  tier: StrengthTier;
  tierTitle: string;
  tierBadge: string;
  tierColor: string;
  tierGradient: string;
  tierProgressPct: number;
  nextTierWeight: number;
  nextTierTitle: string;
}

export interface OverloadSuggestion {
  exerciseId: string;
  exerciseName: string;
  type: 'increase_weight' | 'increase_reps' | 'maintain' | 'deload_plateau';
  title: string;
  description: string;
  suggestedSets: { weight: number; reps: number }[];
  isPlateau: boolean;
  plateauWorkoutsCount?: number;
}

export type VolumeLandmark = 'under_mev' | 'mev' | 'mav' | 'mrv_risk';

export interface MuscleVolumeStatus {
  muscle: MuscleGroup;
  muscleName: string;
  weeklySets: number;
  landmark: VolumeLandmark;
  landmarkLabel: string;
  landmarkColor: string;
  recommendedRange: string;
  feedback: string;
}

export type PTGuidanceState = 'today_completed' | 'workout_ready' | 'rest_day' | 'comeback';

export interface PTDailyGuidance {
  state: PTGuidanceState;
  headline: string;
  subline: string;
  advice: string;
  nextSessionTarget: string;
  nextSessionTiming: string;
  recommendedSplit: SplitType;
  todayWorkoutSummary?: {
    splitName: string;
    totalSets: number;
    totalVolumeKg: number;
    exerciseCount: number;
    date: string;
  };
  recoveryTips: string[];
  suggestedFocusMuscles: MuscleGroup[];
  badge: {
    text: string;
    color: string;
    bg: string;
    border: string;
    icon: string;
  };
  actionButton?: {
    text: string;
    split: SplitType;
  };
}

export interface NextWorkoutSuggestion {
  recommendedSplit: SplitType;
  splitTitle: string;
  reason: string;
  priorityMuscles: {
    muscle: MuscleGroup;
    muscleName: string;
    daysSinceTrained: number;
    recoveryStatus: 'fresh' | 'recovered' | 'recovering';
  }[];
  recommendedMuscles?: MuscleGroup[];
  muscleRecoveryMap?: Partial<Record<MuscleGroup, {
    daysSinceTrained: number;
    recoveryStatus: 'fresh' | 'recovered' | 'recovering';
  }>>;
  isTodayCompleted?: boolean;
  todayWorkoutSummary?: {
    splitName: string;
    totalSets: number;
    totalVolumeKg: number;
    exerciseCount: number;
    date: string;
  };
  ptGuidance?: PTDailyGuidance;
}



