import { describe, it, expect } from 'vitest';
import { getExerciseOverloadSuggestion } from '../src/utils/recommendationEngine';
import { Workout, ExerciseDefinition, AthleteProfile } from '../src/types/workout';

describe('recommendationEngine.ts — Progressive Overload AI Logic', () => {
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

  it('provides a starter baseline recommendation if exercise has never been performed', () => {
    const suggestion = getExerciseOverloadSuggestion(mockExercise, [], defaultProfile);
    expect(suggestion.type).toBe('maintain');
    expect(suggestion.title).toContain('Başlangıç');
    expect(suggestion.suggestedSets.length).toBe(3);
    expect(suggestion.suggestedSets[0].weight).toBeGreaterThan(0);
  });

  it('suggests increasing weight when rep threshold is exceeded (e.g. 10 reps)', () => {
    const workouts: Workout[] = [
      {
        id: 'w-prev',
        date: '2026-09-01',
        type: 'Push',
        splitType: 'push',
        createdAt: 1000,
        exercises: [
          {
            id: 'bench-press',
            name: 'Bench Press',
            detailedSets: [
              { id: '1', weight: 80, reps: 10, completed: true },
              { id: '2', weight: 80, reps: 10, completed: true },
              { id: '3', weight: 80, reps: 10, completed: true }
            ]
          }
        ]
      }
    ];

    const suggestion = getExerciseOverloadSuggestion(mockExercise, workouts, defaultProfile);
    expect(suggestion.type).toBe('increase_weight');
    expect(suggestion.suggestedSets[0].weight).toBeGreaterThan(80);
  });

  it('suggests increasing reps when weight is challenging but reps are 6-8', () => {
    const workouts: Workout[] = [
      {
        id: 'w-prev',
        date: '2026-09-01',
        type: 'Push',
        splitType: 'push',
        createdAt: 1000,
        exercises: [
          {
            id: 'bench-press',
            name: 'Bench Press',
            detailedSets: [
              { id: '1', weight: 80, reps: 6, completed: true },
              { id: '2', weight: 80, reps: 6, completed: true },
              { id: '3', weight: 80, reps: 6, completed: true }
            ]
          }
        ]
      }
    ];

    const suggestion = getExerciseOverloadSuggestion(mockExercise, workouts, defaultProfile);
    expect(suggestion.type).toBe('increase_reps');
    expect(suggestion.suggestedSets[0].weight).toBe(80);
    expect(suggestion.suggestedSets[0].reps).toBe(7);
  });
});
