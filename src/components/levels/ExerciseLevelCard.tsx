import React from 'react';
import { ExerciseDefinition } from '../../types/workout';
import { ExerciseVisual } from '../workout/ExerciseVisual';
import { useWorkout } from '../../context/WorkoutContext';
import { calculateExerciseLevelInfo } from '../../utils/calculations';
import { getExerciseStrengthAnalysis } from '../../utils/scientificCalculations';
import { formatDisplayDate } from '../../utils/dateUtils';
import { muscleMetadata } from '../../data/muscleMetadata';
import { Calendar } from 'lucide-react';

interface ExerciseLevelCardProps {
  exercise: ExerciseDefinition;
}

export const ExerciseLevelCard: React.FC<ExerciseLevelCardProps> = ({ exercise }) => {
  const { workouts, profile } = useWorkout();
  const info = calculateExerciseLevelInfo(exercise, workouts);
  const strength = getExerciseStrengthAnalysis(exercise, workouts, profile);

  const hasLogged = strength.estimated1RM > 0;

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: `1px solid ${hasLogged ? `${strength.tierColor}30` : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        marginBottom: '14px',
        boxShadow: hasLogged ? `0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px ${strength.tierColor}10` : 'var(--shadow-sm)',
        transition: 'transform 0.2s, border-color 0.2s',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
          <ExerciseVisual exerciseId={exercise.id} muscle={exercise.muscle} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 15, color: '#ffffff', letterSpacing: '-0.01em' }}>
              {exercise.name}
            </div>
            {info.lastTrainedDate ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                <Calendar size={11} />
                <span>Son: {formatDisplayDate(info.lastTrainedDate)}</span>
              </div>
            ) : (
              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 2 }}>
                Henüz kayıt girilmedi
              </div>
            )}

            {/* Scientific Muscle Distribution Badges */}
            {exercise.muscles && exercise.muscles.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                {exercise.muscles.map((act) => {
                  const meta = muscleMetadata[act.muscle];
                  const isPrimary = act.role === 'primary';
                  return (
                    <span
                      key={act.muscle}
                      style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 'var(--radius-sm)',
                        background: isPrimary ? `${meta?.color || '#38bdf8'}22` : 'rgba(255, 255, 255, 0.05)',
                        color: isPrimary ? (meta?.color || '#38bdf8') : 'var(--text-muted)',
                        border: `1px solid ${isPrimary ? `${meta?.color || '#38bdf8'}40` : 'rgba(255, 255, 255, 0.1)'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3
                      }}
                      title={`${meta?.name || act.muscle} (${act.role === 'primary' ? 'Birincil' : 'Yardımcı'})`}
                    >
                      <span style={{ fontSize: 9 }}>{meta?.icon || '💪'}</span>
                      <span>{meta?.name || act.muscle} %{Math.round(act.ratio * 100)}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* GymLevels Tier Badge */}
        {hasLogged ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 3
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: strength.tierGradient,
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                boxShadow: `0 2px 10px ${strength.tierColor}35`,
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <span style={{ fontSize: 12 }}>{strength.tierBadge}</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#ffffff', textTransform: 'uppercase' }}>
                {strength.tierTitle}
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>
              Güç Skoru: <span style={{ color: strength.tierColor }}>{strength.strengthScore} / 100</span>
            </div>
          </div>
        ) : (
          <div className="badge" style={{ fontSize: 10, padding: '4px 8px', color: 'var(--text-dim)' }}>
            Seviye Bekleniyor
          </div>
        )}
      </div>

      {/* 1RM and Bodyweight Ratio Banner */}
      {hasLogged && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            marginBottom: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
              Tahmini 1RM (Tek Tekrar)
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span>{strength.estimated1RM} kg</span>
              {strength.bestSetWeight > 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                  ({strength.bestSetWeight}kg × {strength.bestSetReps})
                </span>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
              Kuvvet Oranı
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--cyan)' }}>
              {strength.bodyweightRatio}x <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>BW</span>
            </div>
          </div>
        </div>
      )}

      {/* Next Tier Progression Bar */}
      {hasLogged && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, marginBottom: 5 }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Hedef: <strong>{strength.nextTierTitle}</strong> ({strength.nextTierWeight} kg)
            </span>
            <span style={{ fontWeight: 800, color: strength.tierColor }}>
              %{strength.tierProgressPct}
            </span>
          </div>

          <div className="progress-bar-track" style={{ height: 7 }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${strength.tierProgressPct}%`,
                background: strength.tierGradient
              }}
            />
          </div>
        </div>
      )}

      {/* Secondary Stats Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: 'var(--text-dim)',
          paddingTop: 8,
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <span>Oyun Lv: <strong style={{ color: 'var(--text-muted)' }}>{info.currentLevel}</strong> ({info.totalEXP.toLocaleString()} EXP)</span>
        <span>Hacim: <strong style={{ color: 'var(--text-muted)' }}>{info.totalVolume.toLocaleString()} kg</strong></span>
        <span>Set: <strong style={{ color: 'var(--text-muted)' }}>{info.totalSets}</strong></span>
      </div>
    </div>
  );
};
