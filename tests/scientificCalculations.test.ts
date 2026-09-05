import { describe, it, expect } from 'vitest';
import { 
  calculate1RM, 
  getBest1RMForExercise, 
  getExerciseStrengthAnalysis,
  calculateOverallGymLevels,
  calculateWeeklyVolumeLandmarks
} from '../src/utils/scientificCalculations';
import { Workout, ExerciseDefinition, AthleteProfile } from '../src/types/workout';

describe('scientificCalculations.ts — Exercise Science & Strength Standards', () => {
  const mockExercise: ExerciseDefinition = {
    id: 'bench-press',
    name: 'Bench Press',
    muscle: 'chest',
    category: 'barbell',
    isCustom: false
  };

  const defaultProfile: AthleteProfile = {
    bodyWeightKg: 80,
    gender: 'male',
    age: 26,
    trainingGoal: 'hypertrophy'
  };

  describe('calculate1RM (Epley Formula)', () => {
    it('returns 0 for zero or negative weight', () => {
      expect(calculate1RM(0, 5)).toBe(0);
      expect(calculate1RM(-50, 5)).toBe(0);
    });

    it('returns exact weight for a 1-rep lift', () => {
      expect(calculate1RM(100, 1)).toBe(100);
    });

    it('calculates 1RM accurately for multiple reps using Epley formula', () => {
      // 100 kg for 10 reps -> 100 * (1 + 10 / 30) = 133.3 kg
      expect(calculate1RM(100, 10)).toBe(133.3);
      // 80 kg for 5 reps -> 80 * (1 + 5 / 30) = 80 * 1.1666... = 93.3 kg
      expect(calculate1RM(80, 5)).toBe(93.3);
    });
  });

  describe('getBest1RMForExercise', () => {
    it('extracts the highest estimated 1RM across multiple sessions', () => {
      const workouts: Workout[] = [
        {
          id: 'w-1',
          date: '2026-08-01',
          type: 'Push',
          splitType: 'push',
          createdAt: 100,
          exercises: [
            {
              id: 'bench-press',
              name: 'Bench Press',
              detailedSets: [
                { id: '1', weight: 80, reps: 5, completed: true } // 1RM ~ 93.3
              ]
            }
          ]
        },
        {
          id: 'w-2',
          date: '2026-08-08',
          type: 'Push',
          splitType: 'push',
          createdAt: 200,
          exercises: [
            {
              id: 'bench-press',
              name: 'Bench Press',
              detailedSets: [
                { id: '1', weight: 100, reps: 3, completed: true } // 1RM: 100 * (1 + 3/30) = 110.0
              ]
            }
          ]
        }
      ];

      const best = getBest1RMForExercise('bench-press', workouts);
      expect(best.best1RM).toBe(110);
      expect(best.weight).toBe(100);
      expect(best.reps).toBe(3);
    });
  });

  describe('getExerciseStrengthAnalysis', () => {
    it('evaluates beginner tier for lifters starting out', () => {
      const workouts: Workout[] = [
        {
          id: 'w-1',
          date: '2026-08-01',
          type: 'Push',
          splitType: 'push',
          createdAt: 100,
          exercises: [
            {
              id: 'bench-press',
              name: 'Bench Press',
              detailedSets: [
                { id: '1', weight: 40, reps: 5, completed: true }
              ]
            }
          ]
        }
      ];

      const analysis = getExerciseStrengthAnalysis(mockExercise, workouts, defaultProfile);
      expect(analysis.bodyweightRatio).toBeLessThan(1.0);
      expect(['beginner', 'novice']).toContain(analysis.tier);
      expect(analysis.strengthScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateOverallGymLevels', () => {
    it('returns valid initial analysis when no workouts logged', () => {
      const overall = calculateOverallGymLevels([], [mockExercise], defaultProfile);
      expect(overall.overallStrengthScore).toBe(0);
      expect(overall.overallTier).toBe('beginner');
      expect(overall.totalAnalyzedExercises).toBe(0);
    });
  });

  describe('calculateWeeklyVolumeLandmarks', () => {
    it('returns muscle status entries for all defined muscle groups', () => {
      const statuses = calculateWeeklyVolumeLandmarks([], [mockExercise]);
      expect(statuses.length).toBeGreaterThan(0);
      statuses.forEach((status) => {
        expect(status.weeklySets).toBe(0);
        expect(status.landmark).toBe('under_mev');
      });
    });
  });
});
