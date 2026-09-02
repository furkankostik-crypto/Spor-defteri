import React from 'react';
import { ExerciseDefinition } from '../../types/workout';
import { ExerciseVisual } from './ExerciseVisual';
import { useWorkout } from '../../context/WorkoutContext';
import { sounds } from '../../utils/audio';
import { Check } from 'lucide-react';

interface ExerciseSquareCardProps {
  exercise: ExerciseDefinition;
  onClick: () => void;
}

export const ExerciseSquareCard: React.FC<ExerciseSquareCardProps> = ({ exercise, onClick }) => {
  const { draft } = useWorkout();

  // Exercise sets in current draft session
  const currentSets = draft.exerciseSets[exercise.id] || [];
  const activeSets = currentSets.filter(s => s.weight > 0);
  const hasEnteredSets = activeSets.length > 0;

  const handleClick = () => {
    sounds.playPop();
    onClick();
  };

  return (
    <div
      onClick={handleClick}
      className={`exercise-square-card ${hasEnteredSets ? 'is-active' : ''}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '6px 6px 8px',
        borderRadius: 'var(--radius-lg)',
        background: hasEnteredSets 
          ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.16), rgba(18, 24, 38, 0.95))' 
          : 'var(--card-nested)',
        border: hasEnteredSets 
          ? '1.5px solid rgba(16, 185, 129, 0.65)' 
          : '1px solid var(--border)',
        boxShadow: hasEnteredSets 
          ? '0 4px 20px rgba(16, 185, 129, 0.25)' 
          : 'var(--shadow-sm)',
        cursor: 'pointer',
        userSelect: 'none',
        gap: 6,
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* 1. Maximum Size Hero 3D Visual */}
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
        />

        {/* Active Set Indicator Badge (only shown when sets entered) */}
        {hasEnteredSets && (
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              background: 'rgba(16, 185, 129, 0.9)',
              color: '#ffffff',
              borderRadius: 'var(--radius-full)',
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
              zIndex: 3
            }}
          >
            <Check size={12} strokeWidth={3} />
          </div>
        )}
      </div>

      {/* 2. Exercise Name Only */}
      <div
        style={{
          fontWeight: 800,
          fontSize: 13,
          color: '#ffffff',
          lineHeight: 1.2,
          textAlign: 'center',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
          minHeight: 31,
          padding: '0 2px'
        }}
      >
        {exercise.name}
      </div>
    </div>
  );
};
