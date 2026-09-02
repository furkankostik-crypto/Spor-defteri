import React from 'react';
import { ExerciseDefinition } from '../../types/workout';
import { ExerciseVisual } from '../workout/ExerciseVisual';
import { useWorkout } from '../../context/WorkoutContext';
import { calculateExerciseLevelInfo } from '../../utils/calculations';
import { formatDisplayDate } from '../../utils/dateUtils';
import { Trophy, Calendar } from 'lucide-react';

interface ExerciseLevelCardProps {
  exercise: ExerciseDefinition;
}

export const ExerciseLevelCard: React.FC<ExerciseLevelCardProps> = ({ exercise }) => {
  const { workouts } = useWorkout();
  const info = calculateExerciseLevelInfo(exercise, workouts);

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        marginBottom: '12px',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.2s, border-color 0.2s'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ExerciseVisual exerciseId={exercise.id} muscle={exercise.muscle} size={42} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#ffffff' }}>
              {exercise.name}
            </div>
            {info.lastTrainedDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-dim)' }}>
                <Calendar size={10} />
                <span>Son: {formatDisplayDate(info.lastTrainedDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* PR Badge */}
        <div className="badge badge-pr" style={{ fontSize: 12, padding: '5px 10px' }}>
          <Trophy size={12} />
          <span>PR: {info.prWeight} kg</span>
        </div>
      </div>

      {/* Level and EXP status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 6 }}>
        <span className="badge badge-lvl" style={{ fontSize: 11, padding: '3px 8px' }}>
          Lv {info.currentLevel} / 1000
        </span>
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
          {info.totalEXP.toLocaleString()} EXP (%{info.progressPercent})
        </span>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-track" style={{ height: 8 }}>
        <div
          className="progress-bar-fill"
          style={{ width: `${info.progressPercent}%` }}
        />
      </div>

      {/* Footer Mini Stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--text-dim)',
          marginTop: 10,
          paddingTop: 6,
          borderTop: '1px solid rgba(255, 255, 255, 0.04)'
        }}
      >
        <span>Kaldırılan Hacim: <strong style={{ color: 'var(--text-muted)' }}>{info.totalVolume.toLocaleString()} kg</strong></span>
        <span>Toplam Set: <strong style={{ color: 'var(--text-muted)' }}>{info.totalSets}</strong></span>
      </div>
    </div>
  );
};
