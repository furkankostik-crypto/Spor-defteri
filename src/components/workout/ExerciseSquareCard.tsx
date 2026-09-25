import React from 'react';
import { ExerciseDefinition } from '../../types/workout';
import { ExerciseVisual } from './ExerciseVisual';
import { useWorkout } from '../../context/WorkoutContext';
import { sounds } from '../../utils/audio';
import { Check, Plus } from 'lucide-react';

interface ExerciseSquareCardProps {
  exercise: ExerciseDefinition;
  onClick: () => void;
  index?: number;
  lastWeight?: number;
}

export const ExerciseSquareCard: React.FC<ExerciseSquareCardProps> = ({ 
  exercise, 
  onClick, 
  index,
  lastWeight 
}) => {
  const { draft } = useWorkout();

  // Exercise sets in current draft session
  const currentSets = draft.exerciseSets[exercise.id] || [];
  const completedSets = currentSets.filter(s => s.completed && s.weight > 0);
  const isCompleted = currentSets.length > 0 && completedSets.length === currentSets.length;
  const isPartiallyDone = completedSets.length > 0 && !isCompleted;

  const handleClick = () => {
    sounds.playPop();
    onClick();
  };

  return (
    <div
      onClick={handleClick}
      className={`exercise-square-card ${isCompleted ? 'is-completed' : ''}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 8px 10px',
        borderRadius: 'var(--radius-lg)',
        background: isCompleted 
          ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.18), rgba(15, 23, 42, 0.95))' 
          : isPartiallyDone
          ? 'linear-gradient(145deg, rgba(245, 158, 11, 0.15), rgba(15, 23, 42, 0.95))'
          : 'rgba(30, 41, 59, 0.45)',
        border: isCompleted 
          ? '1.5px solid rgba(16, 185, 129, 0.7)' 
          : isPartiallyDone
          ? '1.5px solid rgba(245, 158, 11, 0.65)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: isCompleted 
          ? '0 6px 20px rgba(16, 185, 129, 0.25)' 
          : isPartiallyDone
          ? '0 4px 16px rgba(245, 158, 11, 0.2)'
          : 'var(--shadow-sm)',
        cursor: 'pointer',
        userSelect: 'none',
        gap: 6,
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* 1. Maximum Size Hero 3D Visual with Floating Badges */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: '#0a0f1d'
        }}
      >
        <ExerciseVisual 
          exerciseId={exercise.id} 
          muscle={exercise.muscle} 
          width="100%"
          height="100%"
          objectFit="contain"
        />

        {/* Top-Left: Index Badge (#1, #2, etc.) */}
        {typeof index === 'number' && (
          <div
            style={{
              position: 'absolute',
              top: 6,
              left: 6,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(6px)',
              color: isCompleted ? '#34d399' : 'var(--text-muted)',
              border: isCompleted ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-full)',
              minWidth: 22,
              height: 22,
              padding: '0 5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10.5,
              fontWeight: 900,
              zIndex: 3
            }}
          >
            #{index}
          </div>
        )}

        {/* Top-Right: Status / Completion Badge */}
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            zIndex: 3
          }}
        >
          {isCompleted ? (
            <div
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                borderRadius: 'var(--radius-full)',
                padding: '2px 8px',
                fontSize: 10,
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.5)'
              }}
            >
              <Check size={11} strokeWidth={3} />
              <span>{completedSets.length} Set</span>
            </div>
          ) : isPartiallyDone ? (
            <div
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                borderRadius: 'var(--radius-full)',
                padding: '2px 7px',
                fontSize: 10,
                fontWeight: 800,
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
              }}
            >
              {completedSets.length}/{currentSets.length} Set
            </div>
          ) : currentSets.length > 0 ? (
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                backdropFilter: 'blur(6px)',
                color: 'var(--cyan)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: 'var(--radius-full)',
                padding: '2px 7px',
                fontSize: 9.5,
                fontWeight: 800
              }}
            >
              {currentSets.length} Set
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(6px)',
                color: 'var(--text-muted)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-full)',
                padding: '2px 7px',
                fontSize: 9.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 3
              }}
            >
              <Plus size={10} strokeWidth={2.5} />
              <span>Ekle</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Exercise Info: Name + Target/Last weight */}
      <div style={{ width: '100%', textAlign: 'center', minHeight: 38, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div
          style={{
            fontWeight: 800,
            fontSize: 12.5,
            color: '#ffffff',
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            padding: '0 2px'
          }}
        >
          {exercise.name}
        </div>

        {isCompleted ? (
          <div style={{ fontSize: 10.5, fontWeight: 800, color: '#34d399', marginTop: 2 }}>
            ✓ Tamamlandı
          </div>
        ) : currentSets.length > 0 ? (
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--cyan)', marginTop: 2 }}>
            {currentSets.length} Set Seansda
          </div>
        ) : lastWeight ? (
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-dim)', marginTop: 2 }}>
            Son: {lastWeight} kg
          </div>
        ) : (
          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', marginTop: 2 }}>
            + Seansa Ekle
          </div>
        )}
      </div>
    </div>
  );
};
