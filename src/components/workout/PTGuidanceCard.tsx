import React, { useState } from 'react';
import { PTDailyGuidance, SplitType } from '../../types/workout';
import { useWorkout } from '../../context/WorkoutContext';
import { sounds } from '../../utils/audio';
import { 
  CheckCircle2, 
  Zap, 
  Coffee, 
  Dumbbell, 
  ChevronDown, 
  ChevronUp, 
  Flame, 
  Bot, 
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface PTGuidanceCardProps {
  guidance: PTDailyGuidance;
  onStartWorkout: (split: SplitType) => void;
}

export const PTGuidanceCard: React.FC<PTGuidanceCardProps> = ({ guidance, onStartWorkout }) => {
  const { setIsAICoachOpen } = useWorkout();
  const [isExpanded, setIsExpanded] = useState(false);

  const getThemeStyles = () => {
    switch (guidance.state) {
      case 'today_completed':
        return {
          cardBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
          cardBorder: '1px solid rgba(16, 185, 129, 0.28)',
          cardGlow: '0 8px 32px rgba(16, 185, 129, 0.08)',
          accentColor: '#10b981',
          accentBg: 'rgba(16, 185, 129, 0.15)',
          badgeBorder: 'rgba(16, 185, 129, 0.35)',
          badgeText: '#34d399',
          icon: <CheckCircle2 size={16} color="#10b981" />
        };
      case 'rest_day':
        return {
          cardBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
          cardBorder: '1px solid rgba(168, 85, 247, 0.28)',
          cardGlow: '0 8px 32px rgba(168, 85, 247, 0.08)',
          accentColor: '#c084fc',
          accentBg: 'rgba(168, 85, 247, 0.15)',
          badgeBorder: 'rgba(168, 85, 247, 0.35)',
          badgeText: '#e9d5ff',
          icon: <Coffee size={16} color="#c084fc" />
        };
      case 'comeback':
        return {
          cardBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
          cardBorder: '1px solid rgba(245, 158, 11, 0.28)',
          cardGlow: '0 8px 32px rgba(245, 158, 11, 0.08)',
          accentColor: '#f59e0b',
          accentBg: 'rgba(245, 158, 11, 0.15)',
          badgeBorder: 'rgba(245, 158, 11, 0.35)',
          badgeText: '#fde68a',
          icon: <Zap size={16} color="#f59e0b" />
        };
      case 'workout_ready':
      default:
        return {
          cardBg: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
          cardBorder: '1px solid rgba(56, 189, 248, 0.28)',
          cardGlow: '0 8px 32px rgba(56, 189, 248, 0.08)',
          accentColor: '#38bdf8',
          accentBg: 'rgba(56, 189, 248, 0.15)',
          badgeBorder: 'rgba(56, 189, 248, 0.35)',
          badgeText: '#7dd3fc',
          icon: <Dumbbell size={16} color="#38bdf8" />
        };
    }
  };

  const theme = getThemeStyles();

  return (
    <div
      className="card"
      style={{
        background: theme.cardBg,
        border: theme.cardBorder,
        boxShadow: theme.cardGlow,
        backdropFilter: 'blur(12px)',
        padding: '14px 16px',
        marginBottom: 16,
        borderRadius: 'var(--radius-lg)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Top Bar: PT Badge + AI Coach Trigger */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 9px',
              borderRadius: 'var(--radius-full)',
              background: theme.accentBg,
              border: `1px solid ${theme.badgeBorder}`,
              fontSize: 11,
              fontWeight: 800,
              color: theme.badgeText,
              letterSpacing: '0.02em'
            }}
          >
            {theme.icon}
            <span>{guidance.badge.text}</span>
          </div>

          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
            Antrenör Rehberi
          </span>
        </div>

        {/* AI Coach Button */}
        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setIsAICoachOpen(true);
          }}
          className="btn btn-secondary"
          style={{
            padding: '3px 9px',
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}
          title="AI Antrenör ile Görüş"
        >
          <Bot size={12} color="var(--cyan)" />
          <span>PT'ye Danış</span>
        </button>
      </div>

      {/* Main Headline */}
      <h3
        style={{
          fontSize: 16,
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-0.02em',
          margin: '0 0 4px 0',
          lineHeight: 1.3
        }}
      >
        {guidance.headline}
      </h3>

      {/* Subline */}
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          margin: '0 0 10px 0',
          lineHeight: 1.45
        }}
      >
        {guidance.subline}
      </p>

      {/* If Today's Workout Summary exists: Quick Session Metrics Pills */}
      {guidance.todayWorkoutSummary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            background: 'rgba(0, 0, 0, 0.22)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 10px',
            marginBottom: 10
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>HAREKET</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>
              {guidance.todayWorkoutSummary.exerciseCount}
            </div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>SET SAYISI</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>
              {guidance.todayWorkoutSummary.totalSets} Set
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>TOPLAM HACİM</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <Flame size={11} fill="currentColor" />
              <span>{guidance.todayWorkoutSummary.totalVolumeKg.toLocaleString('tr-TR')} kg</span>
            </div>
          </div>
        </div>
      )}

      {/* Next Planned Workout Forecast Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 10,
          gap: 8
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <Sparkles size={13} color="var(--cyan)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {guidance.state === 'today_completed' ? 'Sıradaki Seans' : 'Planlanan Seans'}:{' '}
            <strong style={{ color: '#ffffff' }}>{guidance.nextSessionTarget}</strong>
          </div>
        </div>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: 'var(--cyan)',
            background: 'rgba(56, 189, 248, 0.12)',
            padding: '2px 7px',
            borderRadius: 'var(--radius-full)',
            flexShrink: 0
          }}
        >
          {guidance.nextSessionTiming}
        </span>
      </div>

      {/* Expandable Coach Advice & Recovery Protocols */}
      {isExpanded && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Coach Quote */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 0, 0, 0.25)',
              borderLeft: `3px solid ${theme.accentColor}`,
              fontSize: 12.5,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: 10
            }}
          >
            <div style={{ fontWeight: 800, color: '#ffffff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
              <ShieldCheck size={14} color={theme.accentColor} />
              <span>PT Değerlendirmesi:</span>
            </div>
            {guidance.advice}
          </div>

          {/* Recovery Tips Checklist */}
          {guidance.recoveryTips && guidance.recoveryTips.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Toparlanma ve Gelişim Protokolü
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {guidance.recoveryTips.map((tip, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 7,
                      lineHeight: 1.4
                    }}
                  >
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Controls: Expand/Collapse + Action Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4 }}>
        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setIsExpanded(prev => !prev);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 11.5,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            padding: '4px 0'
          }}
        >
          <span>{isExpanded ? 'Detayları Gizle' : 'PT Tavsiyeleri & Tüyolar'}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Primary Action Button (If applicable, e.g. start workout) */}
        {guidance.actionButton && (
          <button
            type="button"
            onClick={() => {
              sounds.playSuccess();
              onStartWorkout(guidance.actionButton!.split);
            }}
            className="btn btn-primary"
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 4px 14px rgba(255, 71, 87, 0.3)'
            }}
          >
            <span>{guidance.actionButton.text}</span>
            <ArrowRight size={13} />
          </button>
        )}

        {/* If today completed, option to log extra session if desired */}
        {guidance.state === 'today_completed' && (
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onStartWorkout('custom');
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-secondary)',
              fontSize: 11.5,
              fontWeight: 700,
              padding: '5px 10px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}
            title="Ek kardiyo, karın veya esneme seansı kaydet"
          >
            <span>+ Ek Seans</span>
          </button>
        )}
      </div>
    </div>
  );
};
