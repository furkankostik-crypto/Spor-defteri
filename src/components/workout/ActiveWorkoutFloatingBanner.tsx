import React, { useState, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { Dumbbell, ChevronUp } from 'lucide-react';

export const ActiveWorkoutFloatingBanner: React.FC = () => {
  const { 
    isLoggingWorkout, 
    isWorkoutMinimized, 
    activeTab, 
    activeSessionStartTime, 
    draft, 
    resumeActiveWorkout 
  } = useWorkout();

  // Show banner if workout is logging AND (user minimized it OR user switched away from 'workout' tab)
  const shouldShow = isLoggingWorkout && (isWorkoutMinimized || activeTab !== 'workout');

  // Real-time elapsed time calculation from wall-clock start time
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    if (!activeSessionStartTime) return 0;
    return Math.max(0, Math.floor((Date.now() - activeSessionStartTime) / 1000));
  });

  useEffect(() => {
    if (!shouldShow || !activeSessionStartTime) return;

    const updateTimer = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - activeSessionStartTime) / 1000)));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [shouldShow, activeSessionStartTime]);

  if (!shouldShow) return null;

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hours > 0) {
      return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const exerciseCount = Object.keys(draft.exerciseSets).length;
  const completedSetsCount = Object.values(draft.exerciseSets).reduce((sum, sets) => {
    return sum + sets.filter(s => s.completed && s.weight > 0).length;
  }, 0);

  return (
    <div
      onClick={resumeActiveWorkout}
      style={{
        position: 'fixed',
        bottom: 'calc(68px + var(--safe-bottom))',
        left: 0,
        right: 0,
        maxWidth: 500,
        margin: '0 auto',
        padding: '0 12px',
        zIndex: 900,
        cursor: 'pointer',
        animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.2)',
          borderRadius: 'var(--radius-lg)',
          gap: 10
        }}
      >
        {/* Left: Pulsing status + Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              position: 'relative',
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0,
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)'
            }}
          >
            <Dumbbell size={18} strokeWidth={2.5} />
            {/* Pulsing Green Indicator Dot */}
            <span
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#34d399',
                border: '2px solid #0f172a',
                animation: 'pulse 1.8s infinite'
              }}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#ffffff' }}>
                Devam Eden Antrenman
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--cyan)',
                  background: 'rgba(56, 189, 248, 0.12)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-sm)',
                  letterSpacing: '0.04em'
                }}
              >
                {formatTimer(elapsedSeconds)}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
              <span>{exerciseCount} Hareket</span>
              <span>•</span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>{completedSetsCount} Set Yapıldı</span>
            </div>
          </div>
        </div>

        {/* Right: Resume Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            resumeActiveWorkout();
          }}
          className="btn btn-primary"
          style={{
            padding: '7px 12px',
            fontSize: 12,
            fontWeight: 800,
            borderRadius: 'var(--radius-md)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'linear-gradient(135deg, #ff4757 0%, #e84118 100%)',
            border: 'none',
            color: '#ffffff',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(255, 71, 87, 0.35)'
          }}
        >
          <span>Devam Et</span>
          <ChevronUp size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
