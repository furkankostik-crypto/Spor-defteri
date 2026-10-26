import { describe, it, expect } from 'vitest';
import {
  getExerciseWeightConfig,
  getExerciseWheelWeights,
  REP_WHEEL_VALUES,
  DURATION_WHEEL_VALUES,
  REP_PRESETS,
  DURATION_PRESETS
} from '../src/utils/weightPresets';
import { defaultExercises } from '../src/data/defaultExercises';

describe('weightPresets', () => {
  it('provides appropriate fine steps and lighter presets for dumbbell isolation exercises', () => {
    const config = getExerciseWeightConfig('shoulder_fly', 'shoulder', 'upper');
    expect(config.equipmentCategory).toContain('Dumbbell');
    expect(config.defaultStep).toBe(1);
    expect(config.availableSteps).toContain(0.5);
    expect(config.presetWeights[0]).toBeLessThanOrEqual(5);
  });

  it('provides pin-stack presets and 2.5kg steps for machine/cable exercises like pec_deck', () => {
    const config = getExerciseWeightConfig('pec_deck', 'chest', 'upper');
    expect(config.equipmentCategory).toContain('Makine');
    expect(config.defaultStep).toBe(2.5);
    expect(config.presetWeights).toContain(45);
    expect(config.presetWeights).toContain(50);
  });

  it('provides heavy sled steps and presets for leg_press and hack_squat', () => {
    const config = getExerciseWeightConfig('leg_press', 'quads', 'lower');
    expect(config.defaultStep).toBe(10);
    expect(config.largeStep).toBe(20);
    expect(config.presetWeights).toContain(100);
    expect(config.presetWeights).toContain(200);
  });

  it('includes athlete bodyweight in presets for bodyweight/calisthenics exercises', () => {
    const config = getExerciseWeightConfig('pullup', 'back', 'upper', 82);
    expect(config.presetWeights).toContain(82);
    expect(config.presetWeights).toContain(10);
  });

  it('generates a clean sorted wheel sequence with custom injected values', () => {
    const wheel = getExerciseWheelWeights('bench', 'chest', 'upper', [47.5, 92.5], 75);
    expect(wheel).toContain(47.5);
    expect(wheel).toContain(92.5);
    expect(wheel).toContain(20);
    expect(wheel).toContain(50);
    // Ensure sorted ascending
    for (let i = 1; i < wheel.length; i++) {
      expect(wheel[i]).toBeGreaterThan(wheel[i - 1]);
    }
  });

  it('returns valid weight preset configurations for all 43 default exercises', () => {
    defaultExercises.forEach((ex) => {
      const cfg = getExerciseWeightConfig(ex.id, ex.muscle, ex.category, 75);
      expect(cfg.defaultStep).toBeGreaterThan(0);
      expect(cfg.availableSteps.length).toBeGreaterThan(0);
      expect(cfg.presetWeights.length).toBeGreaterThan(5);
      for (let i = 1; i < cfg.presetWeights.length; i++) {
        expect(cfg.presetWeights[i]).toBeGreaterThan(cfg.presetWeights[i - 1]);
      }
    });
  });

  it('exports valid rep and duration wheel sequences', () => {
    expect(REP_WHEEL_VALUES).toContain(8);
    expect(REP_WHEEL_VALUES).toContain(10);
    expect(REP_WHEEL_VALUES).toContain(12);
    expect(DURATION_WHEEL_VALUES).toContain(45);
    expect(DURATION_WHEEL_VALUES).toContain(60);
    expect(REP_PRESETS.map((r) => r.value)).toContain(8);
    expect(DURATION_PRESETS.map((d) => d.value)).toContain(45);
  });
});
