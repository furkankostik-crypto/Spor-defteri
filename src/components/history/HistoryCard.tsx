import React from 'react';
import { Workout, MuscleGroup } from '../../types/workout';
import { formatDisplayDate } from '../../utils/dateUtils';
import { defaultExercises } from '../../data/defaultExercises';
import { isDurationExercise, isSetValid } from '../../utils/calculations';
import { ExerciseVisual } from '../workout/ExerciseVisual';
import { ChevronRight } from 'lucide-react';

interface HistoryCardProps {
  workout: Workout;
  onClick: () => void;
}

const getSplitBadgeStyle = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('üst') || t.includes('upper')) {
    return { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.14)', border: 'rgba(56, 189, 248, 0.32)' };
  }
  if (t.includes('alt') || t.includes('lower') || t.includes('bacak') || t.includes('leg')) {
    return { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.14)', border: 'rgba(192, 132, 252, 0.32)' };
  }
  if (t.includes('tüm') || t.includes('full')) {
    return { color: '#34d399', bg: 'rgba(52, 211, 153, 0.14)', border: 'rgba(52, 211, 153, 0.32)' };
  }
  if (t.includes('itiş') || t.includes('push')) {
    return { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.14)', border: 'rgba(251, 191, 36, 0.32)' };
  }
  if (t.includes('çekiş') || t.includes('pull')) {
    return { color: '#fb7185', bg: 'rgba(251, 113, 133, 0.14)', border: 'rgba(251, 113, 133, 0.32)' };
  }
  return { color: 'var(--accent)', bg: 'rgba(255, 71, 87, 0.14)', border: 'rgba(255, 71, 87, 0.32)' };
};

const defaultExerciseMap = new Map(defaultExercises.map(e => [e.id, e]));

const cleanExName = (name: string) => {
  const idx = name.indexOf('(');
  return idx > 0 ? name.slice(0, idx).trim() : name;
};

export const HistoryCard: React.FC<HistoryCardProps> = ({ workout, onClick }) => {
  // Calculate session volume and sets
  let totalVolume = 0;
  let totalSets = 0;

  workout.exercises.forEach((ex) => {
    const isDur = isDurationExercise(ex.id);
    if (ex.detailedSets && ex.detailedSets.length > 0) {
      ex.detailedSets.forEach((s) => {
        if (isSetValid(s, isDur)) {
          if (!isDur) {
            totalVolume += s.weight * (s.reps || 5);
          }
          totalSets++;
        }
      });
    } else if (ex.sets) {
      ex.sets.forEach((w) => {
        if (w > 0) {
          if (!isDur) {
            totalVolume += w * 5;
          }
          totalSets++;
        }
      });
    }
  });

  const splitStyle = getSplitBadgeStyle(workout.type);

  // Exercise names preview text
  const previewNames = workout.exercises
    .slice(0, 3)
    .map(e => cleanExName(e.name))
    .join(', ');
  const remainingCount = Math.max(0, workout.exercises.length - 3);
  const volumeDisplay =
    totalVolume >= 1000
      ? `${(totalVolume / 1000).toFixed(1)} Ton`
      : `${Math.round(totalVolume)} kg`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        background: 'linear-gradient(180deg, rgba(19, 27, 46, 0.72) 0%, rgba(12, 17, 28, 0.92) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 9,
        padding: '12px 14px',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.24)',
        display: 'flex',
        flexDirection: 'column',
        gap: 9
      }}
      className="history-summary-card"
    >
      {/* Top Row: Date + Split Badge on Left, Volume + Set Summary on Right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
            {formatDisplayDate(workout.date)}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: splitStyle.color,
              background: splitStyle.bg,
              border: `1px solid ${splitStyle.border}`,
              padding: '1.5px 7px',
              borderRadius: 'var(--radius-full)',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              whiteSpace: 'nowrap'
            }}
          >
            {workout.type}
          </span>
        </div>

        {/* Right Side: Clean Metrics + Chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: '#f8fafc', fontFamily: 'Outfit' }}>
              {volumeDisplay}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 5, fontWeight: 600 }}>
              • {totalSets} set
            </span>
          </div>
          <ChevronRight size={16} color="var(--text-dim)" />
        </div>
      </div>

      {/* Bottom Row: Exercise Avatars & Clean Names Preview */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          paddingTop: 7,
          borderTop: '1px solid rgba(255, 255, 255, 0.045)',
          minWidth: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {workout.exercises.slice(0, 4).map((ex, idx) => {
            const def = defaultExerciseMap.get(ex.id);
            const m = (ex.muscle || def?.muscle || 'chest') as MuscleGroup;
            return (
              <ExerciseVisual
                key={`${ex.id}-${idx}`}
                exerciseId={ex.id}
                muscle={m}
                size={24}
                objectFit="contain"
                style={{
                  borderRadius: 6,
                  border: '1px solid rgba(255, 255, 255, 0.09)',
                  background: 'rgba(0, 0, 0, 0.22)'
                }}
              />
            );
          })}
          {workout.exercises.length > 4 && (
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: 'var(--cyan)',
                fontSize: 9.5,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              +{workout.exercises.length - 4}
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: 11.5,
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
            flex: 1
          }}
        >
          {previewNames}
          {remainingCount > 0 && <span style={{ color: 'var(--text-dim)' }}> +{remainingCount}</span>}
        </div>
      </div>
    </div>
  );
};
