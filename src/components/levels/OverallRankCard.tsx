import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { Sparkles, Flame, Shield, Award } from 'lucide-react';

export const OverallRankCard: React.FC = () => {
  const { overallStats } = useWorkout();

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(24, 34, 52, 0.9), rgba(12, 17, 28, 0.95))',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 'var(--radius-xl)',
        padding: '20px',
        marginBottom: '20px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Decorative ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: overallStats.rankBadgeColor,
          opacity: 0.15,
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Sparkles size={14} color="var(--gold)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sporcu Seviyesi
            </span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
            {overallStats.rankTitle}
          </h2>
        </div>

        {/* Level Emblem Badge */}
        <div
          style={{
            background: overallStats.rankGradient,
            borderRadius: 'var(--radius-lg)',
            padding: '8px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#ffffff', opacity: 0.9 }}>
            SEVİYE
          </span>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
            {overallStats.overallLevel}
          </span>
        </div>
      </div>

      {/* EXP Progress Bar */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Sonraki Rütbe İlerlemesi
          </span>
          <span style={{ fontWeight: 700, color: '#ffffff' }}>
            %{overallStats.rankProgressPct} ({overallStats.totalEXP.toLocaleString()} EXP)
          </span>
        </div>
        <div className="progress-bar-track" style={{ height: 10 }}>
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
          marginTop: 18,
          paddingTop: 14,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--accent)', marginBottom: 2 }}>
            <Flame size={14} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Seri</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
            {overallStats.activeStreak} Gün
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--muscle-emerald)', marginBottom: 2 }}>
            <Award size={14} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>İdman</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
            {overallStats.totalWorkouts} Seans
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--gold)', marginBottom: 2 }}>
            <Shield size={14} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Toplam Hacim</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
            {(overallStats.totalVolumeKg / 1000).toFixed(1)} Ton
          </div>
        </div>
      </div>
    </div>
  );
};
