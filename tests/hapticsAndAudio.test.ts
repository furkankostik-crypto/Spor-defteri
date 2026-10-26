import { describe, it, expect, vi, beforeEach } from 'vitest';

const storageMock: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMock[key] ?? null,
  setItem: (key: string, val: string) => { storageMock[key] = String(val); },
  removeItem: (key: string) => { delete storageMock[key]; },
  clear: () => { Object.keys(storageMock).forEach((k) => delete storageMock[k]); }
};
(globalThis as any).window = {
  localStorage: (globalThis as any).localStorage
};

import { nativeBridge } from '../src/utils/nativeBridge';
import { sounds } from '../src/utils/audio';

describe('Vibration / Haptics Toggle Feature', () => {
  beforeEach(() => {
    localStorage.clear();
    nativeBridge.setVibrationEnabled(true);
  });

  it('defaults to vibrationEnabled = true', () => {
    expect(nativeBridge.vibrationEnabled).toBe(true);
    expect(sounds.vibrationEnabled).toBe(true);
  });

  it('can be disabled and persisted to localStorage', () => {
    nativeBridge.setVibrationEnabled(false);
    expect(nativeBridge.vibrationEnabled).toBe(false);
    expect(sounds.vibrationEnabled).toBe(false);
    expect(localStorage.getItem('spor_vibration_enabled')).toBe('false');
  });

  it('does not trigger navigator.vibrate when disabled', async () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      configurable: true,
      writable: true
    });

    nativeBridge.setVibrationEnabled(false);

    await nativeBridge.vibrateLight();
    await nativeBridge.vibrateMedium();
    await nativeBridge.vibrateSelectionTick();
    await nativeBridge.vibrateSuccess();
    await nativeBridge.vibrateTimerFinish();

    expect(vibrateMock).not.toHaveBeenCalled();
  });

  it('triggers navigator.vibrate when enabled', async () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      configurable: true,
      writable: true
    });

    nativeBridge.setVibrationEnabled(true);

    await nativeBridge.vibrateLight();
    expect(vibrateMock).toHaveBeenCalledWith(10);
  });
});
