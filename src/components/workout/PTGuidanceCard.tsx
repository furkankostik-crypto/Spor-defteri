import React, { useState } from 'react';
import { PTDailyGuidance, SplitType, NextWorkoutSuggestion, MuscleGroup } from '../../types/workout';
import { useWorkout } from '../../context/WorkoutContext';
import { sounds } from '../../utils/audio';
import { AnatomyIcon } from '../../data/anatomyIcons';
import { muscleMetadata } from '../../data/muscleMetadata';
import { getLastWorkoutSets } from '../../utils/calculations';
import { 
  CheckCircle2, 
  Zap, 
  Coffee, 
  Dumbbell, 
  Flame, 
  Bot, 
  ArrowRight, 
  Trophy,
  Layers,
  Target,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { getRecommendedRoutine } from '../../utils/recommendedRoutines';

interface PTGuidanceCardProps {
  guidance: PTDailyGuidance;
  suggestion: NextWorkoutSuggestion;
  onStartWorkout: (split: SplitType, isRecommendedLaunch?: boolean) => void;
  onStartManualWorkout?: (split?: SplitType) => void;
}

export const PTGuidanceCard: React.FC<PTGuidanceCardProps> = ({ 
  guidance, 
  suggestion, 
  onStartWorkout, 
  onStartManualWorkout 
}) => {
  const { setIsAICoachOpen, workouts } = useWorkout();
  const [isTipsExpanded, setIsTipsExpanded] = useState(false);

  const getThemeStyles = () => {
    switch (guidance.state) {
      case 'today_completed':
        return {
          cardBg: 'linear-gradient(155deg, rgba(6, 78, 59, 0.3) 0%, rgba(15, 23, 42, 0.95) 100%)',
          cardBorder: '1px solid rgba(16, 185, 129, 0.3)',
          cardGlow: '0 12px 36px rgba(0, 0, 0, 0.5)',
          accentColor: '#10b981',
          accentBg: 'rgba(16, 185, 129, 0.15)',
          badgeText: '#34d399',
          icon: <CheckCircle2 size={13} color="#10b981" />
        };
      case 'rest_day':
        return {
          cardBg: 'linear-gradient(155deg, rgba(88, 28, 135, 0.3) 0%, rgba(15, 23, 42, 0.95) 100%)',
          cardBorder: '1px solid rgba(168, 85, 247, 0.3)',
          cardGlow: '0 12px 36px rgba(0, 0, 0, 0.5)',
          accentColor: '#c084fc',
          accentBg: 'rgba(168, 85, 247, 0.15)',
          badgeText: '#e9d5ff',
          icon: <Coffee size={13} color="#c084fc" />
        };
      case 'comeback':
        return {
          cardBg: 'linear-gradient(155deg, rgba(120, 53, 15, 0.3) 0%, rgba(15, 23, 42, 0.95) 100%)',
          cardBorder: '1px solid rgba(245, 158, 11, 0.3)',
          cardGlow: '0 12px 36px rgba(0, 0, 0, 0.5)',
          accentColor: '#f59e0b',
          accentBg: 'rgba(245, 158, 11, 0.15)',
          badgeText: '#fde68a',
          icon: <Zap size={13} color="#f59e0b" />
        };
      case 'workout_ready':
      default:
        return {
          cardBg: 'linear-gradient(155deg, rgba(30, 41, 59, 0.72) 0%, rgba(15, 23, 42, 0.96) 100%)',
          cardBorder: '1px solid rgba(56, 189, 248, 0.24)',
          cardGlow: '0 12px 36px rgba(0, 0, 0, 0.5), 0 0 24px rgba(56, 189, 248, 0.08)',
          accentColor: '#38bdf8',
          accentBg: 'rgba(56, 189, 248, 0.14)',
          badgeText: '#7dd3fc',
          icon: <Dumbbell size={13} color="#38bdf8" />
        };
    }
  };

  const theme = getThemeStyles();
  const targetSplit = guidance.recommendedSplit || suggestion.recommendedSplit || 'lower';
  const routines = guidance.recommendedRoutine || suggestion.recommendedRoutine || getRecommendedRoutine(targetSplit);
  const targetMuscles = (suggestion.recommendedMuscles || guidance.suggestedFocusMuscles || []) as MuscleGroup[];
  const estimatedSets = routines.length * 3 + (targetSplit === 'lower' || targetSplit === 'upper' ? 2 : 0);
  const estimatedMinutes = routines.length * 10;

  return (
    <div
      className="card"
      style={{
        background: theme.cardBg,
        border: theme.cardBorder,
        boxShadow: theme.cardGlow,
        backdropFilter: 'blur(20px)',
        padding: '16px 16px',
        marginBottom: 12,
        borderRadius: 'var(--radius-xl, 18px)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 11
      }}
    >
      {/* ======================================================== */}
      {/* 1. TOP LINE: Badges + AI Coach Button */}
      {/* ======================================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 9px',
              borderRadius: 'var(--radius-full)',
              background: theme.accentBg,
              fontSize: 10.5,
              fontWeight: 800,
              color: theme.badgeText,
              letterSpacing: '0.01em'
            }}
          >
            {theme.icon}
            <span>{guidance.badge.text}</span>
          </div>

          <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>
            • {guidance.nextSessionTiming}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setIsAICoachOpen(true);
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 'var(--radius-full)',
            padding: '3px 9px',
            fontSize: 10.5,
            fontWeight: 700,
            color: 'var(--text-secondary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer'
          }}
          title="AI Antrenör Danışmanı"
        >
          <Bot size={11} color="var(--cyan)" />
          <span>PT'ye Danış</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 2. HEADLINE & NATURAL SUMMARY */}
      {/* ======================================================== */}
      <div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            margin: '0 0 3px 0',
            lineHeight: 1.25
          }}
        >
          {guidance.headline}
        </h2>

        <p
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: 1.45
          }}
        >
          {guidance.subline}
        </p>
      </div>

      {/* ======================================================== */}
      {/* 3. CASE: TODAY COMPLETED DETAILED SUMMARY */}
      {/* ======================================================== */}
      {guidance.todayWorkoutSummary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            padding: '10px 12px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 700 }}>HAREKET</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#ffffff', marginTop: 2 }}>
              {guidance.todayWorkoutSummary.exerciseCount}
            </div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 700 }}>SET SAYISI</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#ffffff', marginTop: 2 }}>
              {guidance.todayWorkoutSummary.totalSets} Set
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 700 }}>TOPLAM HACİM</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#fbbf24', marginTop: 2 }}>
              {guidance.todayWorkoutSummary.totalVolumeKg.toLocaleString('tr-TR')} kg
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TARGET MUSCLES (ANATOMY BADGES WITH READINESS) */}
      {/* ======================================================== */}
      {guidance.state !== 'today_completed' && targetMuscles.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {targetMuscles.slice(0, 4).map((m) => {
            const meta = muscleMetadata[m];
            if (!meta) return null;
            const rec = suggestion?.muscleRecoveryMap?.[m];
            const days = rec?.daysSinceTrained ?? 5;
            const isReady = days >= 2;

            return (
              <div
                key={m}
                style={{
                  padding: '6px 6px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.035)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  textAlign: 'center'
                }}
              >
                <div
                  className={`anatomy-badge muscle-${m}`}
                  style={{
                    width: 22,
                    height: 22,
                    borderColor: isReady ? '#10b981' : 'rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <AnatomyIcon muscle={m} size={14} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                  {meta.name.split('(')[0].trim()}
                </div>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: isReady ? '#10b981' : 'var(--cyan)', background: isReady ? 'rgba(16,185,129,0.1)' : 'rgba(56,189,248,0.1)', padding: '1px 4px', borderRadius: '3px' }}>
                  {isReady ? 'Hazır ✓' : `${days}g`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. METRICS STRIP: 4-COLUMN COMPACT STATS */}
      {/* ======================================================== */}
      {guidance.state !== 'today_completed' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
            padding: '8px 10px',
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>HAREKET</div>
            <div style={{ fontSize: 12.5, fontWeight: 900, color: '#ffffff', marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              <Target size={11} color="var(--cyan)" />
              <span>{routines.length}</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>HACİM</div>
            <div style={{ fontSize: 12.5, fontWeight: 900, color: '#fbbf24', marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              <Flame size={11} fill="currentColor" />
              <span>~{estimatedSets} Set</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>SÜRE</div>
            <div style={{ fontSize: 12.5, fontWeight: 900, color: '#38bdf8', marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              <Clock size={11} />
              <span>~{estimatedMinutes} Dk</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>HEDEF</div>
            <div style={{ fontSize: 12.5, fontWeight: 900, color: 'var(--accent)', marginTop: 1 }}>
              Hipertrofi
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. ENRICHED EXERCISE BLUEPRINT (5 Rows with Muscle & Last Weight) */}
      {/* ======================================================== */}
      {guidance.state !== 'today_completed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0 2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Layers size={11} color="var(--cyan)" />
              <span>Önerilen Egzersiz Programı</span>
            </div>
            <span>Hedef & Son Seans</span>
          </div>

          {routines.map((item, idx) => {
            const lastSets = getLastWorkoutSets(item.id, workouts);
            const maxLastWeight = lastSets && lastSets.weights.length > 0 ? Math.max(...lastSets.weights.filter(w => w > 0)) : null;

            return (
              <div
                key={item.id}
                style={{
                  padding: '6px 9px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0, 0, 0, 0.22)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8
                }}
              >
                {/* Index & Name + Muscle Subtitle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                  <span
                    style={{
                      width: 19,
                      height: 19,
                      borderRadius: '4px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      color: 'var(--cyan)',
                      fontSize: 10.5,
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {idx + 1}
                  </span>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 600 }}>
                      {item.muscleLabel} • {item.typeLabel}
                    </div>
                  </div>
                </div>

                {/* Protocol & Weight Badge */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: '#ffffff',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}
                  >
                    {item.targetProtocol}
                  </div>

                  {maxLastWeight && maxLastWeight > 0 ? (
                    <div
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        color: 'var(--gold)',
                        marginTop: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 3
                      }}
                    >
                      <Trophy size={9} color="var(--gold)" />
                      <span>Son: {maxLastWeight} kg</span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. PT COACH ADVICE (Strategy Box) */}
      {/* ======================================================== */}
      <div
        style={{
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(0, 0, 0, 0.22)',
          borderLeft: `2.5px solid ${theme.accentColor}`,
          padding: '6px 9px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6
        }}
      >
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.35, minWidth: 0 }}>
          <strong style={{ color: '#ffffff' }}>💡 PT Tüyosu:</strong> {guidance.advice}
        </div>

        {guidance.recoveryTips && (
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setIsTipsExpanded(prev => !prev);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              padding: 0
            }}
          >
            <span>{isTipsExpanded ? 'Gizle' : 'Tüyolar'}</span>
            {isTipsExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        )}
      </div>

      {isTipsExpanded && guidance.recoveryTips && (
        <div style={{ padding: '6px 8px', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: 4, animation: 'fadeIn 0.2s ease-out' }}>
          {guidance.recoveryTips.map((tip, idx) => (
            <div key={idx} style={{ fontSize: 10.5, color: 'var(--text-secondary)', lineHeight: 1.35 }}>
              {tip}
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. ACTION BUTTONS: HERO CTA + MANUAL START */}
      {/* ======================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 2 }}>
        {guidance.state !== 'today_completed' && guidance.state !== 'rest_day' && (
          <button
            type="button"
            onClick={() => {
              sounds.playSuccess();
              onStartWorkout(targetSplit, true);
            }}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 13.5,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)',
              boxShadow: '0 4px 14px rgba(255, 71, 87, 0.35)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Zap size={16} fill="currentColor" />
            <span>Önerilen Antrenmanı Başlat ({guidance.nextSessionTarget.split(' ')[0]})</span>
            <ArrowRight size={15} />
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            if (onStartManualWorkout) {
              onStartManualWorkout('custom');
            } else {
              onStartWorkout('custom');
            }
          }}
          className="btn btn-secondary"
          style={{
            width: '100%',
            padding: '9.5px 14px',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <Dumbbell size={13} color="var(--cyan)" />
          <span>
            {guidance.state === 'today_completed'
              ? '+ Ek Seans / Manuel Antrenman Başlat'
              : guidance.state === 'rest_day'
              ? '💪 Yine de Manuel Antrenman Başlat'
              : 'Manuel / Serbest Antrenman Başlat'}
          </span>
        </button>
      </div>
    </div>
  );
};
