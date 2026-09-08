import React from 'react';
import { WorkoutSessionTarget } from '../../utils/workoutTargets';
import { Dumbbell, Flame, CheckCircle2, Trophy, Zap } from 'lucide-react';

interface WorkoutSessionProgressCardProps {
  sessionTarget: WorkoutSessionTarget;
  onOpenCart?: () => void;
}

export const WorkoutSessionProgressCard: React.FC<WorkoutSessionProgressCardProps> = ({
  sessionTarget,
  onOpenCart
}) => {
  const {
    targetExercisesCount,
    completedExercisesCount,
    targetSetsCount,
    completedSetsCount,
    overallProgressPercent,
    statusText,
    statusColor,
    isTargetMet,
    splitTitle
  } = sessionTarget;

  // Circular progress calculations (Radius = 26, Circumference = 2 * PI * 26 ≈ 163.36)
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallProgressPercent / 100) * circumference;

  const exPercent = targetExercisesCount > 0 
    ? Math.min(100, Math.round((completedExercisesCount / targetExercisesCount) * 100))
    : 0;
  const setPercent = targetSetsCount > 0
    ? Math.min(100, Math.round((completedSetsCount / targetSetsCount) * 100))
    : 0;

  return (
    <div
      className="card"
      style={{
        padding: '12px 14px',
        marginBottom: 12,
        background: isTargetMet
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 23, 42, 0.95))'
          : 'linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.75))',
        border: isTargetMet
          ? '1px solid rgba(16, 185, 129, 0.45)'
          : overallProgressPercent > 0
          ? '1px solid rgba(56, 189, 248, 0.3)'
          : '1px solid var(--border)',
        boxShadow: isTargetMet
          ? '0 8px 24px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 6px 20px rgba(0, 0, 0, 0.35)',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
    >
      {/* Background Subtle Tech Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: isTargetMet 
            ? 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Top Row: Split Title & Coach Status Badge */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
          gap: 8
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '6px',
              background: isTargetMet ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isTargetMet ? '#10b981' : 'var(--cyan)',
              flexShrink: 0
            }}
          >
            {isTargetMet ? <Trophy size={13} /> : <Zap size={13} fill="currentColor" />}
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: 12.5,
              color: '#ffffff',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {splitTitle}
          </span>
        </div>

        {/* Dynamic Status Pill */}
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            color: statusColor,
            background: isTargetMet 
              ? 'rgba(16, 185, 129, 0.15)'
              : 'rgba(56, 189, 248, 0.12)',
            border: `1px solid ${statusColor}44`,
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
            boxShadow: isTargetMet ? '0 0 10px rgba(16, 185, 129, 0.3)' : 'none'
          }}
        >
          {isTargetMet ? <CheckCircle2 size={11} /> : null}
          <span>{statusText}</span>
        </span>
      </div>

      {/* Main Content: Circular Dial + Dual Progress Meters */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}
      >
        {/* Left: Interactive Progress Ring */}
        <div
          onClick={onOpenCart}
          style={{
            position: 'relative',
            width: 66,
            height: 66,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            cursor: onOpenCart ? 'pointer' : 'default'
          }}
          title={onOpenCart ? 'Antrenman sepetini aç' : undefined}
        >
          <svg width="66" height="66" viewBox="0 0 66 66" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background Track */}
            <circle
              cx="33"
              cy="33"
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="5"
            />
            {/* Animated Progress Gradient Ring */}
            <defs>
              <linearGradient id="sessionProgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="60%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <circle
              cx="33"
              cy="33"
              r={radius}
              fill="none"
              stroke={isTargetMet ? '#10b981' : 'url(#sessionProgGrad)'}
              strokeWidth="5.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: overallProgressPercent > 0 ? 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.5))' : 'none'
              }}
            />
          </svg>

          {/* Center Info inside Ring */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none'
            }}
          >
            <span
              style={{
                fontSize: 14.5,
                fontWeight: 900,
                color: isTargetMet ? '#34d399' : '#ffffff',
                lineHeight: 1,
                letterSpacing: '-0.02em'
              }}
            >
              %{overallProgressPercent}
            </span>
            <span
              style={{
                fontSize: 8.5,
                fontWeight: 700,
                color: 'var(--text-dim)',
                marginTop: 2,
                textTransform: 'uppercase',
                letterSpacing: '0.4px'
              }}
            >
              Tamam
            </span>
          </div>
        </div>

        {/* Right: Detailed Requirements vs Completed Metrics */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {/* 1. Hareket Hedefi */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 11,
                marginBottom: 3
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  color: 'var(--text-muted)',
                  fontWeight: 600
                }}
              >
                <Dumbbell size={12} color="var(--cyan)" />
                <span>Hareket Sayısı</span>
              </span>
              <span style={{ fontWeight: 800, color: '#ffffff' }}>
                <strong style={{ color: completedExercisesCount >= targetExercisesCount ? '#34d399' : 'var(--cyan)' }}>
                  {completedExercisesCount}
                </strong>
                <span style={{ color: 'var(--text-dim)' }}> / {targetExercisesCount} Hedef</span>
              </span>
            </div>
            {/* Exercise Progress Bar */}
            <div
              style={{
                height: 5,
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${exPercent}%`,
                  height: '100%',
                  background: completedExercisesCount >= targetExercisesCount
                    ? '#10b981'
                    : 'linear-gradient(90deg, #0284c7, #38bdf8)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>

          {/* 2. Set Hedefi */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 11,
                marginBottom: 3
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  color: 'var(--text-muted)',
                  fontWeight: 600
                }}
              >
                <Flame size={12} color="var(--muscle-emerald)" />
                <span>Toplam Set</span>
              </span>
              <span style={{ fontWeight: 800, color: '#ffffff' }}>
                <strong style={{ color: completedSetsCount >= targetSetsCount ? '#34d399' : 'var(--muscle-emerald)' }}>
                  {completedSetsCount}
                </strong>
                <span style={{ color: 'var(--text-dim)' }}> / {targetSetsCount} Hedef</span>
              </span>
            </div>
            {/* Set Progress Bar */}
            <div
              style={{
                height: 5,
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${setPercent}%`,
                  height: '100%',
                  background: completedSetsCount >= targetSetsCount
                    ? '#10b981'
                    : 'linear-gradient(90deg, #059669, #34d399)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
