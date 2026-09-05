import { describe, it, expect } from 'vitest';
import { 
  mergeSavedExerciseLists, 
  mergeWorkoutsByDate, 
  determineSplitType 
} from '../src/utils/workoutMerge';
import { Workout, SavedExercise } from '../src/types/workout';

describe('workoutMerge.ts — Multi-Device Cloud Sync & Merge Logic', () => {
  describe('mergeSavedExerciseLists', () => {
    it('returns empty array when given empty inputs', () => {
      expect(mergeSavedExerciseLists([], [])).toEqual([]);
    });

    it('joins sets for the same exercise from two devices without duplicate loss', () => {
      const existing: SavedExercise[] = [
        {
          id: 'bench-press',
          name: 'Bench Press',
          detailedSets: [
            { id: '1', weight: 80, reps: 5, completed: true }
          ]
        }
      ];

      const incoming: SavedExercise[] = [
        {
          id: 'bench-press',
          name: 'Bench Press',
          detailedSets: [
            { id: '1', weight: 90, reps: 5, completed: true }
          ]
        }
      ];

      const merged = mergeSavedExerciseLists(existing, incoming);
      expect(merged.length).toBe(1);
      expect(merged[0].detailedSets?.length).toBe(2);
      expect(merged[0].detailedSets?.[0].weight).toBe(80);
      expect(merged[0].detailedSets?.[1].weight).toBe(90);
      // Ensure sequential IDs were assigned
      expect(merged[0].detailedSets?.[0].id).toBe('1');
      expect(merged[0].detailedSets?.[1].id).toBe('2');
    });

    it('combines distinct exercises seamlessly', () => {
      const existing: SavedExercise[] = [
        {
          id: 'bench-press',
          name: 'Bench Press',
          detailedSets: [{ id: '1', weight: 80, reps: 5, completed: true }]
        }
      ];

      const incoming: SavedExercise[] = [
        {
          id: 'squat',
          name: 'Squat',
          detailedSets: [{ id: '1', weight: 120, reps: 5, completed: true }]
        }
      ];

      const merged = mergeSavedExerciseLists(existing, incoming);
      expect(merged.length).toBe(2);
      expect(merged.some(e => e.id === 'bench-press')).toBe(true);
      expect(merged.some(e => e.id === 'squat')).toBe(true);
    });
  });

  describe('mergeWorkoutsByDate', () => {
    it('groups multiple workout entries on the same date into a single unified session', () => {
      const rawWorkouts: Workout[] = [
        {
          id: 'w-morning',
          date: '2026-09-05',
          type: 'Push Morning',
          splitType: 'push',
          createdAt: 1000,
          exercises: [
            {
              id: 'bench-press',
              name: 'Bench Press',
              detailedSets: [{ id: '1', weight: 80, reps: 5, completed: true }]
            }
          ]
        },
        {
          id: 'w-evening',
          date: '2026-09-05',
          type: 'Push Evening',
          splitType: 'push',
          createdAt: 2000,
          exercises: [
            {
              id: 'incline-dumbbell-press',
              name: 'Incline DB Press',
              detailedSets: [{ id: '1', weight: 30, reps: 8, completed: true }]
            }
          ]
        },
        {
          id: 'w-yesterday',
          date: '2026-09-04',
          type: 'Pull',
          splitType: 'pull',
          createdAt: 500,
          exercises: [
            {
              id: 'pull-up',
              name: 'Pull Up',
              detailedSets: [{ id: '1', weight: 10, reps: 6, completed: true }]
            }
          ]
        }
      ];

      const merged = mergeWorkoutsByDate(rawWorkouts);
      expect(merged.length).toBe(2); // 2026-09-05 and 2026-09-04
      
      const today = merged.find(w => w.date === '2026-09-05');
      expect(today).toBeDefined();
      expect(today?.exercises.length).toBe(2);
      expect(today?.exercises.some(e => e.id === 'bench-press')).toBe(true);
      expect(today?.exercises.some(e => e.id === 'incline-dumbbell-press')).toBe(true);
    });
  });
});
