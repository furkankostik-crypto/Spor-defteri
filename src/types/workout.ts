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

export interface ExerciseDefinition {
  id: string;
  name: string;
  muscle: MuscleGroup;
  category: 'upper' | 'lower' | 'core' | 'cardio' | 'other';
  isCustom?: boolean;
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

