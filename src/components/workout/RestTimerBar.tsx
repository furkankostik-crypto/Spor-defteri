import React, { useState, useEffect, useCallback } from 'react';
import { Timer, X, Plus, Minus } from 'lucide-react';
import { sounds } from '../../utils/audio';
import { nativeBridge } from '../../utils/nativeBridge';

interface RestTimerState {
  endTime: number;
  totalSeconds: number;
  exerciseName?: string;
}

const DEFAULT_REST_SECONDS = 90;
const STORAGE_REST_DURATION_KEY = 'spor_preferred_rest_seconds';

export const triggerRestTimer = (exerciseName?: string, durationSeconds?: number) => {
  if (typeof window === 'undefined') return;
  const savedPref = parseInt(localStorage.getItem(STORAGE_REST_DURATION_KEY) || '', 10);
  const secs = durationSeconds || (savedPref > 0 ? savedPref : DEFAULT_REST_SECONDS);
  window.dispatchEvent(
    new CustomEvent('spor:start-rest-timer', {
      detail: { seconds: secs, exerciseName }
    })
  );
};

export const stopRestTimer = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('spor:stop-rest-timer'));
};

export const RestTimerBar: React.FC = () => {
  const [timer, setTimer] = useState<RestTimerState | null>(null);
  const [remaining, setRemaining] = useState<number>(0);

  const dismissTimer = useCallback(() => {
    sounds.playPop();
    setTimer(null);
    setRemaining(0);
    nativeBridge.cancelRestTimerNotification();
  }, []);

  const adjustTimer = useCallback((deltaSeconds: number) => {
    sounds.playTick();
    setTimer((prev) => {
      if (!prev) return null;
      const now = Date.now();
      const currentRem = Math.max(0, Math.ceil((prev.endTime - now) / 1000));
      const nextRem = Math.max(5, currentRem + deltaSeconds);
      const nextTotal = Math.max(prev.totalSeconds, nextRem);
      localStorage.setItem(STORAGE_REST_DURATION_KEY, String(nextTotal));
      nativeBridge.scheduleRestTimerNotification(nextRem, prev.exerciseName);
      setRemaining(nextRem);
      return {
        ...prev,
        endTime: now + nextRem * 1000,
        totalSeconds: nextTotal
      };
    });
  }, []);

  useEffect(() => {
    const onStart = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const secs = typeof detail.seconds === 'number' && detail.seconds > 0 ? detail.seconds : DEFAULT_REST_SECONDS;
      const exerciseName = detail.exerciseName;
      const now = Date.now();
      setTimer({
        endTime: now + secs * 1000,
        totalSeconds: secs,
        exerciseName
      });
      setRemaining(secs);
      nativeBridge.scheduleRestTimerNotification(secs, exerciseName);
    };

    const onStop = () => {
      setTimer(null);
      setRemaining(0);
      nativeBridge.cancelRestTimerNotification();
    };

    window.addEventListener('spor:start-rest-timer', onStart);
    window.addEventListener('spor:stop-rest-timer', onStop);
    return () => {
      window.removeEventListener('spor:start-rest-timer', onStart);
      window.removeEventListener('spor:stop-rest-timer', onStop);
    };
  }, []);

  useEffect(() => {
    if (!timer) return;

    const tick = () => {
      const rem = Math.max(0, Math.ceil((timer.endTime - Date.now()) / 1000));
      setRemaining(rem);
      if (rem <= 0) {
        sounds.playTimerFinish();
        setTimer(null);
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [timer]);

  if (!timer || remaining <= 0) return null;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const formatted = `${mins}:${String(secs).padStart(2, '0')}`;
  const pct = Math.min(100, Math.max(0, (remaining / timer.totalSeconds) * 100));

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(10px + var(--safe-top, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2200,
        width: 'min(360px, calc(100vw - 24px))',
        background: 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(56, 189, 248, 0.45)',
        borderRadius: '16px',
        padding: '8px 11px',
        boxShadow: '0 14px 36px rgba(0, 0, 0, 0.75), 0 0 20px rgba(56, 189, 248, 0.2)',
        overflow: 'hidden',
        animation: 'fadeIn 0.18s ease-out'
      }}
    >
      {/* Progress bar background */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 3,
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #38bdf8, #10b981)',
          transition: 'width 0.25s linear'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {/* Left: Timer Icon + Countdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.16)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              flexShrink: 0
            }}
          >
            <Timer size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: '#ffffff',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em'
                }}
              >
                {formatted}
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#38bdf8' }}>Dinlenme</span>
            </div>
            {timer.exerciseName && (
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 135
                }}
              >
                {timer.exerciseName}
              </div>
            )}
          </div>
        </div>

        {/* Right: -15s / +30s / Skip controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => adjustTimer(-15)}
            style={{
              height: 28,
              padding: '0 7px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--text-secondary)',
              fontSize: 10.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
            title="15 Saniye Azalt"
          >
            <Minus size={11} />
            <span>15s</span>
          </button>

          <button
            type="button"
            onClick={() => adjustTimer(30)}
            style={{
              height: 28,
              padding: '0 7px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.14)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              fontSize: 10.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
            title="30 Saniye Ekle"
          >
            <Plus size={11} />
            <span>30s</span>
          </button>

          <button
            type="button"
            onClick={dismissTimer}
            style={{
              width: 28,
              height: 28,
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.14)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Sayacı Kapat"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
