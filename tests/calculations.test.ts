import { describe, it, expect } from 'vitest';
import { 
  calculateSetEXP, 
  calculateExerciseLevelInfo, 
  calculateOverallPlayerStats,
  isDurationExercise,
  EXP_PER_LEVEL 
} from '../src/utils/calculations';
import { defaultExercises } from '../src/data/defaultExercises';
import { Workout, ExerciseDefinition } from '../src/types/workout';

describe('calculations.ts — Level, EXP and PR Engine', () => {
  const mockExercise: ExerciseDefinition = {
    id: 'bench-press',
    name: 'Bench Press',
    muscle: 'chest',
    category: 'barbell',
    isCustom: false
  };

  describe('calculateSetEXP', () => {
    it('returns 0 for zero or negative weight', () => {
      expect(calculateSetEXP(0, 5)).toBe(0);
      expect(calculateSetEXP(-10, 5)).toBe(0);
    });

    it('calculates EXP correctly based on weight and reps', () => {
      // 100 kg x 5 reps = 500 EXP
      expect(calculateSetEXP(100, 5)).toBe(500);
      // 60 kg x 10 reps = 600 EXP
      expect(calculateSetEXP(60, 10)).toBe(600);
    });

    it('handles default reps of 5 when reps not specified', () => {
      expect(calculateSetEXP(80)).toBe(400);
    });
  });

  describe('calculateExerciseLevelInfo', () => {
    it('returns Level 1 with 0% progress for an unperformed exercise', () => {
      const result = calculateExerciseLevelInfo(mockExercise, []);
      expect(result.currentLevel).toBe(1);
      expect(result.totalEXP).toBe(0);
      expect(result.progressPercent).toBe(0);
      expect(result.prWeight).toBe(0);
      expect(result.totalSets).toBe(0);
    });

    it('calculates level up and EXP progression correctly', () => {
      // 100 kg x 5 reps = 500 EXP (exact 1 level worth, so Level 2)
      const mockWorkouts: Workout[] = [
        {
          id: 'w-1',
          date: '2026-09-01',
          type: 'Push',
          splitType: 'push',
          createdAt: 1000,
          exercises: [
            {
              id: 'bench-press',
              name: 'Bench Press',
              detailedSets: [
                { id: '1', weight: 100, reps: 5, completed: true }
              ]
            }
          ]
        }
      ];

      const result = calculateExerciseLevelInfo(mockExercise, mockWorkouts);
      expect(result.totalEXP).toBe(500);
      expect(result.currentLevel).toBe(2);
      expect(result.progressPercent).toBe(0);
      expect(result.prWeight).toBe(100);
      expect(result.prReps).toBe(5);
      expect(result.totalVolume).toBe(500);
    });

    it('tracks the highest weight as personal record (PR)', () => {
      const mockWorkouts: Workout[] = [
        {
          id: 'w-1',
          date: '2026-09-03',
          type: 'Push',
          splitType: 'push',
          createdAt: 2000,
          exercises: [
            {
              id: 'bench-press',
              name: 'Bench Press',
              detailedSets: [
                { id: '1', weight: 80, reps: 5, completed: true },
                { id: '2', weight: 120, reps: 3, completed: true },
                { id: '3', weight: 100, reps: 5, completed: true }
              ]
            }
          ]
        }
      ];

      const result = calculateExerciseLevelInfo(mockExercise, mockWorkouts);
      expect(result.prWeight).toBe(120);
      expect(result.prReps).toBe(3);
    });

    it('caps max level at 1000 and progress at 100%', () => {
      const mockWorkouts: Workout[] = [
        {
          id: 'w-god',
          date: '2026-09-01',
          type: 'God Mode',
          splitType: 'fullbody',
          createdAt: 1000,
          exercises: [
            {
              id: 'bench-press',
              name: 'Bench Press',
              detailedSets: [
                { id: '1', weight: 10000, reps: 100, completed: true }
              ]
            }
          ]
        }
      ];

      const result = calculateExerciseLevelInfo(mockExercise, mockWorkouts);
      expect(result.currentLevel).toBe(1000);
      expect(result.progressPercent).toBe(100);
    });
  });

  describe('calculateOverallPlayerStats', () => {
    it('returns valid initial stats for empty workouts', () => {
      const stats = calculateOverallPlayerStats([], [mockExercise]);
      expect(stats.overallLevel).toBe(1);
      expect(stats.totalWorkouts).toBe(0);
      expect(stats.totalVolumeKg).toBe(0);
      expect(stats.totalSetsCount).toBe(0);
      expect(stats.rankTitle).toBeDefined();
    });

    it('properly tracks duration exercises (Plank) in EXP and sets without inflating kg volume', () => {
      const plankDef = defaultExercises.find(e => e.id === 'plank')!;
      expect(plankDef).toBeDefined();
      expect(isDurationExercise(plankDef)).toBe(true);

      const mockWorkouts: Workout[] = [
        {
          id: 'w-plank',
          date: '2026-09-05',
          type: 'Core',
          splitType: 'custom',
          createdAt: 1000,
          exercises: [
            {
              id: 'plank',
              name: 'Plank Hold',
              muscle: 'abs',
              sets: [60, 75],
              detailedSets: [
                { id: '1', weight: 0, reps: 60, completed: true },
                { id: '2', weight: 0, reps: 75, completed: true }
              ]
            }
          ]
        }
      ];

      const plankInfo = calculateExerciseLevelInfo(plankDef, mockWorkouts);
      expect(plankInfo.prWeight).toBe(75); // 75 seconds PR
      expect(plankInfo.totalSets).toBe(2);
      expect(plankInfo.totalVolume).toBe(135); // 135 total seconds
      expect(plankInfo.totalEXP).toBe(405); // (60 + 75) * 3 = 405 EXP

      const overall = calculateOverallPlayerStats(mockWorkouts, defaultExercises);
      expect(overall.totalSetsCount).toBe(2);
      expect(overall.totalVolumeKg).toBe(0); // Duration seconds do not inflate kg volume
      expect(overall.totalEXP).toBe(405);
    });

    it('includes Dumbbell Fly and newly added exercises in defaultExercises', () => {
      const dumbbellFly = defaultExercises.find(e => e.id === 'dumbbell_fly');
      expect(dumbbellFly).toBeDefined();
      expect(dumbbellFly?.muscle).toBe('chest');
      expect(defaultExercises.length).toBeGreaterThanOrEqual(40);
    });
  });
});
