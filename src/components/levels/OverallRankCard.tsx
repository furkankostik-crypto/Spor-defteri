import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { calculateOverallGymLevels } from '../../utils/scientificCalculations';
import { sounds } from '../../utils/audio';
import { 
  Flame, 
  Shield, 
  Award, 
  Settings2, 
  Trophy 
} from 'lucide-react';

export const OverallRankCard: React.FC = () => {
  const { 
    overallStats, 
    workouts, 
    allExercises, 
    profile, 
    setIsProfileModalOpen
  } = useWorkout();

  const gymLevels = calculateOverallGymLevels(workouts, allExercises, profile);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(24, 34, 52, 0.95), rgba(12, 17, 28, 0.98))',
        border: `1px solid ${gymLevels.overallTierColor}40`,
        borderRadius: 'var(--radius-xl)',
        padding: '20px',
        marginBottom: '20px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 16px 36px rgba(0, 0, 0, 0.6), 0 0 30px ${gymLevels.overallTierColor}15`
      }}
    >
      {/* Decorative ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: gymLevels.overallTierColor,
          opacity: 0.18,
          filter: 'blur(35px)',
          pointerEvents: 'none'
        }}
      />

      {/* Top Bar: Title & Profile Setting Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2, marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 13 }}>{gymLevels.overallTierBadge}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: gymLevels.overallTierColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              GymLevels Güç Standardı
            </span>
          </div>
          <h2 style={{ fontSize: 23, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
            {gymLevels.overallTierTitle}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Standart Profil: <strong style={{ color: '#ffffff' }}>{profile.bodyWeightKg} kg</strong> ({profile.gender === 'female' ? 'Kadın' : 'Erkek'})
            </span>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsProfileModalOpen(true);
              }}
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--cyan)',
                fontSize: 10.5,
                fontWeight: 700,
                padding: '2px 6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3
              }}
            >
              <Settings2 size={11} />
              <span>Değiştir</span>
            </button>
          </div>
        </div>

        {/* Strength Score Emblem */}
        <div
          style={{
            background: gymLevels.overallTierGradient,
            borderRadius: 'var(--radius-lg)',
            padding: '8px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: `0 4px 16px ${gymLevels.overallTierColor}40`,
            border: '1px solid rgba(255, 255, 255, 0.25)'
          }}
        >
          <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', color: '#ffffff', opacity: 0.9 }}>
            GÜÇ SKORU
          </span>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
            {gymLevels.overallStrengthScore}
          </span>
          <span style={{ fontSize: 9, color: 'rgba(255, 255, 255, 0.8)', fontWeight: 700 }}>
            / 100
          </span>
        </div>
      </div>

      {/* Strongest Lift Spotlight */}
      {gymLevels.strongestLift && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            marginBottom: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trophy size={14} color="var(--gold)" />
            <span style={{ color: 'var(--text-muted)' }}>En Güçlü Hareket:</span>
            <strong style={{ color: '#ffffff' }}>{gymLevels.strongestLift.exerciseName}</strong>
          </div>
          <span className="badge badge-pr" style={{ fontSize: 11 }}>
            1RM: {gymLevels.strongestLift.estimated1RM} kg ({gymLevels.strongestLift.bodyweightRatio}x BW)
          </span>
        </div>
      )}

      {/* Secondary: Level & EXP Progress Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Oyun Seviyesi: <strong>{overallStats.rankTitle} (Lv {overallStats.overallLevel})</strong>
          </span>
          <span style={{ fontWeight: 700, color: '#ffffff' }}>
            %{overallStats.rankProgressPct} ({overallStats.totalEXP.toLocaleString()} EXP)
          </span>
        </div>
        <div className="progress-bar-track" style={{ height: 8 }}>
          <div
            className="progress-bar-fill"
            style={{
              width: `${overallStats.rankProgressPct}%`,
              background: overallStats.rankGradient
            }}
          />
        </div>
      </div>

      {/* Grid of Key Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--accent)', marginBottom: 2 }}>
            <Flame size={14} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Seri</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff' }}>
            {overallStats.activeStreak} Gün
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--muscle-emerald)', marginBottom: 2 }}>
            <Award size={14} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>İdman</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff' }}>
            {overallStats.totalWorkouts} Seans
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--gold)', marginBottom: 2 }}>
            <Shield size={14} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Hacim</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff' }}>
            {(overallStats.totalVolumeKg / 1000).toFixed(1)} Ton
          </div>
        </div>
      </div>
    </div>
  );
};
