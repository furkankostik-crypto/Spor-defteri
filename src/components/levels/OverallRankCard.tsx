import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { calculateOverallGymLevels } from '../../utils/scientificCalculations';
import { Trophy } from 'lucide-react';

export const OverallRankCard: React.FC = () => {
  const {
    overallStats,
    workouts,
    allExercises,
    profile
  } = useWorkout();

  const gymLevels = calculateOverallGymLevels(workouts, allExercises, profile);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(22, 32, 48, 0.95), rgba(12, 17, 28, 0.98))',
        border: `1px solid ${gymLevels.overallTierColor}40`,
        borderRadius: 'var(--radius-xl)',
        padding: '16px',
        marginBottom: '14px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 12px 28px rgba(0, 0, 0, 0.45), 0 0 24px ${gymLevels.overallTierColor}12`
      }}
    >
      {/* Top Row: Rank Title & Strength Score Emblem */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
          marginBottom: 12,
          gap: 10
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <span style={{ fontSize: 12 }}>{gymLevels.overallTierBadge}</span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: gymLevels.overallTierColor,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              Genel Güç Seviyesi
            </span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
            {gymLevels.overallTierTitle}
          </h2>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Karakter: <strong style={{ color: '#ffffff' }}>Lv. {overallStats.overallLevel}</strong> ({overallStats.rankTitle})
          </div>
        </div>

        {/* Strength Score Emblem */}
        <div
          style={{
            background: gymLevels.overallTierGradient,
            borderRadius: 'var(--radius-md)',
            padding: '7px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: `0 4px 14px ${gymLevels.overallTierColor}35`,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            flexShrink: 0
          }}
        >
          <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: '#ffffff', opacity: 0.9 }}>
            GÜÇ SKORU
          </span>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
            {gymLevels.overallStrengthScore}
          </span>
        </div>
      </div>

      {/* Strongest Lift Spotlight */}
      {gymLevels.strongestLift && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: 'var(--radius-sm)',
            padding: '7px 10px',
            marginBottom: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 11.5
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trophy size={13} color="var(--gold)" />
            <span style={{ color: 'var(--text-muted)' }}>En Güçlü:</span>
            <strong style={{ color: '#ffffff' }}>{gymLevels.strongestLift.exerciseName}</strong>
          </div>
          <span className="badge badge-pr" style={{ fontSize: 10.5 }}>
            1RM {gymLevels.strongestLift.estimated1RM} kg ({gymLevels.strongestLift.bodyweightRatio}x BW)
          </span>
        </div>
      )}

      {/* Level & EXP Progress Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 4 }}>
          <span style={{ color: 'var(--text-muted)' }}>Sonraki Seviye İlerlemesi</span>
          <span style={{ fontWeight: 700, color: '#ffffff' }}>
            %{overallStats.rankProgressPct} • {overallStats.totalEXP.toLocaleString()} EXP
          </span>
        </div>
        <div className="progress-bar-track" style={{ height: 6 }}>
          <div
            className="progress-bar-fill"
            style={{
              width: `${overallStats.rankProgressPct}%`,
              background: overallStats.rankGradient
            }}
          />
        </div>
      </div>
    </div>
  );
};
