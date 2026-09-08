import { describe, it, expect } from 'vitest';
import { 
  normalizeTurkish, 
  generateOfflineCoachResponse 
} from '../src/services/aiCoach';
import { Workout, ExerciseDefinition, AthleteProfile } from '../src/types/workout';

describe('aiCoach.ts — Scientific AI Coach & Intent Recognition', () => {
  const mockExercises: ExerciseDefinition[] = [
    {
      id: 'bench',
      name: 'Bench Press',
      muscle: 'chest',
      category: 'upper',
      isCustom: false
    },
    {
      id: 'squat',
      name: 'Squat',
      muscle: 'quads',
      category: 'lower',
      isCustom: false
    }
  ];

  const defaultProfile: AthleteProfile = {
    bodyWeightKg: 80,
    gender: 'male',
    age: 26,
    trainingGoal: 'hypertrophy'
  };

  const sampleWorkouts: Workout[] = [
    {
      id: 'w-1',
      date: '2026-09-06',
      type: 'Push',
      splitType: 'push',
      createdAt: 1000,
      exercises: [
        {
          id: 'bench',
          name: 'Bench Press',
          detailedSets: [
            { id: '1', weight: 80, reps: 8, completed: true },
            { id: '2', weight: 80, reps: 8, completed: true }
          ],
          sets: [80, 80]
        }
      ]
    }
  ];

  describe('normalizeTurkish', () => {
    it('normalizes Turkish characters and removes punctuation', () => {
      expect(normalizeTurkish('Sırada ne var?')).toBe('sirada ne var');
      expect(normalizeTurkish('GÖĞÜS İDMANI!')).toBe('gogus idmani');
      expect(normalizeTurkish('Ne çalışayım?')).toBe('ne calisayim');
    });
  });

  describe('generateOfflineCoachResponse', () => {
    it('correctly handles "sırada ne var" without returning fake hardcoded strings', () => {
      const reply = generateOfflineCoachResponse('sırada ne var', defaultProfile, sampleWorkouts, mockExercises);
      
      expect(reply).not.toContain('Save ve analiz önerileri');
      expect(reply).toMatch(/Önerilen Sıradaki Antrenman|Günün Antrenmanı Tamamlandı/);
      expect(reply).toContain('Fizyolojik');
    });

    it('correctly handles "ne çalışayım" or "bugün ne var"', () => {
      const reply = generateOfflineCoachResponse('bugün ne çalışayım?', defaultProfile, sampleWorkouts, mockExercises);
      expect(reply).not.toContain('Save ve analiz önerileri');
      expect(reply).toMatch(/Önerilen Sıradaki Antrenman|Günün Antrenmanı Tamamlandı/);
    });

    it('answers exercise-specific questions for Bench Press', () => {
      const reply = generateOfflineCoachResponse('bench press kaç basmalıyım?', defaultProfile, sampleWorkouts, mockExercises);
      expect(reply).toContain('Bench Press');
      expect(reply).toContain('1RM');
      expect(reply).toContain('Biyomekanik Form İpucu');
    });

    it('answers muscle-specific questions for Göğüs', () => {
      const reply = generateOfflineCoachResponse('göğüs durumum nasıl?', defaultProfile, sampleWorkouts, mockExercises);
      expect(reply).toContain('Göğüs');
      expect(reply).toContain('Dinlenme Süresi');
      expect(reply).toContain('RP Landmarks');
    });

    it('provides plateau resolution protocol when asked about plato or takıldım', () => {
      const reply = generateOfflineCoachResponse('ağırlıklar takıldı artmıyor', defaultProfile, sampleWorkouts, mockExercises);
      expect(reply).toContain('Plato Kırma');
      expect(reply).toContain('Deload');
    });

    it('calculates personalized nutrition values based on athlete weight', () => {
      const reply = generateOfflineCoachResponse('günlük kaç gram protein almalıyım?', defaultProfile, sampleWorkouts, mockExercises);
      // For 80kg: min protein 80*1.6 = 128g, opt protein 80*2.2 = 176g
      expect(reply).toContain('128g');
      expect(reply).toContain('176g');
      expect(reply).toContain('Kreatin');
    });

    it('answers warm-up questions with dynamic mobility and ramp-up protocol', () => {
      const reply = generateOfflineCoachResponse('ısınma nasıl olmalı?', defaultProfile, sampleWorkouts, mockExercises);
      expect(reply).toContain('Isınma ve Mobilite');
      expect(reply).toContain('Ramp-Up');
    });

    it('greets the user with their athlete profile info', () => {
      const reply = generateOfflineCoachResponse('selam', defaultProfile, sampleWorkouts, mockExercises);
      expect(reply).toContain('80 kg');
      expect(reply).toContain('Merhaba');
    });

    it('handles unknown questions dynamically quoting the user query without static mock text', () => {
      const reply = generateOfflineCoachResponse('suplement kombinasyonu tavsiyesi', defaultProfile, sampleWorkouts, mockExercises);
      expect(reply).not.toContain('Save ve analiz önerileri');
      expect(reply).toContain('suplement kombinasyonu tavsiyesi');
    });
  });
});
