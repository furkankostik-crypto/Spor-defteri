import React from 'react';
import { ExerciseDefinition, ExerciseSet } from '../../types/workout';
import { ExerciseVisual } from './ExerciseVisual';
import { muscleMetadata } from '../../data/muscleMetadata';
import { isDurationExercise } from '../../utils/calculations';
import { sounds } from '../../utils/audio';
import { Check, ChevronRight, CheckCircle2 } from 'lucide-react';

interface CompletedExerciseRowProps {
  exercise: ExerciseDefinition;
  orderIndex: number;
  sets: ExerciseSet[];
  completedSetsCount: number;
  onOpen: () => void;
}

export const CompletedExerciseRow: React.FC<CompletedExerciseRowProps> = ({
  exercise,
  orderIndex,
  sets,
  completedSetsCount,
  onOpen
}) => {
  const isDur = isDurationExercise(exercise);
  const muscleMeta = muscleMetadata[exercise.muscle];
  const completedSets = sets.filter(s => s.completed);

  const handleClick = () => {
    sounds.playPop();
    onOpen();
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.75) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.28)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        userSelect: 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)';
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.28)';
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.75) 100%)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {/* 1. Left Thumbnail with Order / Check Badge */}
      <div
        style={{
          position: 'relative',
          width: 48,
          height: 48,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: '#090e1a',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          flexShrink: 0
        }}
      >
        <ExerciseVisual
          exerciseId={exercise.id}
          muscle={exercise.muscle}
          width="100%"
          height="100%"
          objectFit="contain"
        />

        {/* Small floating order index badge */}
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: 2,
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            borderRadius: 'var(--radius-full)',
            minWidth: 16,
            height: 16,
            padding: '0 3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontWeight: 900,
            color: '#34d399'
          }}
        >
          #{orderIndex}
        </div>

        {/* Bottom checkmark indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: 2,
            right: 2,
            background: '#10b981',
            borderRadius: 'var(--radius-full)',
            width: 14,
            height: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)'
          }}
        >
          <Check size={9} strokeWidth={3.5} />
        </div>
      </div>

      {/* 2. Middle Content: Name, Muscle tag, Completed Sets */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 800,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {exercise.name}
          </span>
          {muscleMeta && (
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: muscleMeta.color || 'var(--text-muted)',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                flexShrink: 0
              }}
            >
              {muscleMeta.name}
            </span>
          )}
        </div>

        {/* Completed Sets Summary Chips */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexWrap: 'wrap',
            marginTop: 4
          }}
        >
          {completedSets.length > 0 ? (
            completedSets.map((s, idx) => (
              <span
                key={s.id || idx}
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: '#a7f3d0',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '1px 6px',
                  borderRadius: 6
                }}
              >
                {isDur ? `${s.reps || s.weight || 0}sn` : `${s.weight}kg × ${s.reps}`}
              </span>
            ))
          ) : (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {completedSetsCount} set tamamlandı
            </span>
          )}
        </div>
      </div>

      {/* 3. Right: Done status and action arrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16, 185, 129, 0.18)',
            color: '#34d399',
            fontSize: 10.5,
            fontWeight: 800
          }}
        >
          <CheckCircle2 size={12} strokeWidth={2.5} />
          <span>Bitti</span>
        </div>
        <ChevronRight size={16} color="var(--text-muted)" />
      </div>
    </div>
  );
};
