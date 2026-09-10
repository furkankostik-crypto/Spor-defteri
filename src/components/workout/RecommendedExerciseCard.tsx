import React from 'react';
import { RecommendedRoutineItem, ExerciseDefinition } from '../../types/workout';
import { ExerciseVisual } from './ExerciseVisual';
import { AnatomyIcon } from '../../data/anatomyIcons';
import { muscleMetadata } from '../../data/muscleMetadata';
import { useWorkout } from '../../context/WorkoutContext';
import { sounds } from '../../utils/audio';
import { getLastWorkoutSets } from '../../utils/calculations';
import { getExerciseOverloadSuggestion } from '../../utils/recommendationEngine';
import { 
  Check, 
  Trophy, 
  ArrowRightLeft, 
  Plus, 
  Zap, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface RecommendedExerciseCardProps {
  item: RecommendedRoutineItem;
  exercise: ExerciseDefinition;
  onOpenInput: (exercise: ExerciseDefinition) => void;
  onSwapClick: (item: RecommendedRoutineItem) => void;
}

export const RecommendedExerciseCard: React.FC<RecommendedExerciseCardProps> = ({
  item,
  exercise,
  onOpenInput,
  onSwapClick
}) => {
  const { draft, workouts, profile } = useWorkout();

  // Sets recorded in draft
  const currentSets = draft.exerciseSets[exercise.id] || [];
  const activeSets = currentSets.filter(s => s.weight > 0);
  const isStarted = activeSets.length > 0;
  const isTargetMet = activeSets.length >= item.targetSets;

  // Last performance & overload suggestions
  const lastSets = getLastWorkoutSets(exercise.id, workouts);
  const maxLastWeight = lastSets && lastSets.weights.length > 0 
    ? Math.max(...lastSets.weights.filter(w => w > 0)) 
    : null;

  const overload = getExerciseOverloadSuggestion(exercise, workouts, profile);

  const meta = muscleMetadata[exercise.muscle] || muscleMetadata.chest;

  const handleCardClick = () => {
    sounds.playPop();
    onOpenInput(exercise);
  };

  const handleSwapClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playPop();
    onSwapClick(item);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`card ${isTargetMet ? 'is-completed' : isStarted ? 'is-active' : ''}`}
      style={{
        padding: '12px 14px',
        marginBottom: 10,
        borderRadius: 'var(--radius-xl, 16px)',
        background: isTargetMet
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(15, 23, 42, 0.95) 100%)'
          : isStarted
          ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(30, 41, 59, 0.65) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: isTargetMet
          ? '1.5px solid rgba(16, 185, 129, 0.6)'
          : isStarted
          ? '1.5px solid rgba(56, 189, 248, 0.5)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: isTargetMet
          ? '0 6px 24px rgba(16, 185, 129, 0.22)'
          : isStarted
          ? '0 6px 20px rgba(56, 189, 248, 0.16)'
          : 'var(--shadow-sm)',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Banner: Order Index, Target Role & Swap Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {/* Order Badge */}
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: '6px',
              background: isTargetMet 
                ? '#10b981' 
                : isStarted 
                ? 'linear-gradient(135deg, #0284c7, #38bdf8)' 
                : 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isTargetMet || isStarted ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
            }}
          >
            {isTargetMet ? <Check size={14} strokeWidth={3} /> : item.order}
          </span>

          {/* Muscle Pill Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 7px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: 10.5,
              fontWeight: 700,
              color: 'var(--text-secondary)'
            }}
          >
            <AnatomyIcon muscle={exercise.muscle} size={12} />
            <span>{meta.name.split('(')[0].trim()}</span>
          </div>

          {/* Type Role Tag */}
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: 'var(--accent)',
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '2px 7px',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            {item.typeLabel}
          </span>
        </div>

        {/* Swap / Change Exercise Action Button */}
        <button
          type="button"
          onClick={handleSwapClick}
          className="btn btn-secondary"
          title="Salonda alet meşgulse alternatif hareket seç"
          style={{
            padding: '3px 8px',
            fontSize: 10.5,
            fontWeight: 700,
            color: 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            cursor: 'pointer'
          }}
        >
          <ArrowRightLeft size={11} color="var(--cyan)" />
          <span>Değiştir</span>
        </button>
      </div>

      {/* Main Body: Hero Visual + Exercise Info + Target Protocol */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {/* Visual Thumbnail */}
        <div
          style={{
            width: 72,
            height: 72,
            minWidth: 72,
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background: '#090d16',
            border: isTargetMet 
              ? '1px solid rgba(16, 185, 129, 0.4)' 
              : '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative'
          }}
        >
          <ExerciseVisual
            exerciseId={exercise.id}
            muscle={exercise.muscle}
            width="100%"
            height="100%"
            objectFit="contain"
          />
          {isTargetMet && (
            <div
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                background: '#10b981',
                color: '#ffffff',
                borderRadius: '50%',
                width: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Check size={11} strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Center Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {exercise.name}
          </div>

          {/* Target Protocol Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#ffffff',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '2px 7px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Zap size={11} color="var(--gold)" fill="currentColor" />
              <span>{item.targetProtocol}</span>
            </span>

            {/* Set Status Badge */}
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: isTargetMet ? '#10b981' : isStarted ? 'var(--cyan)' : 'var(--text-muted)',
                background: isTargetMet 
                  ? 'rgba(16, 185, 129, 0.15)' 
                  : isStarted 
                  ? 'rgba(56, 189, 248, 0.12)' 
                  : 'rgba(255, 255, 255, 0.04)',
                border: isTargetMet
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : isStarted
                  ? '1px solid rgba(56, 189, 248, 0.25)'
                  : '1px solid rgba(255, 255, 255, 0.06)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)'
              }}
            >
              {isTargetMet 
                ? `✓ ${activeSets.length}/${item.targetSets} Set Tamam` 
                : isStarted 
                ? `${activeSets.length}/${item.targetSets} Set Girildi` 
                : `0/${item.targetSets} Set`}
            </span>
          </div>

          {/* Historical PR / Overload Hint */}
          <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            {maxLastWeight && maxLastWeight > 0 ? (
              <span style={{ color: 'var(--gold)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Trophy size={11} color="var(--gold)" />
                <span>Son: {maxLastWeight} kg</span>
              </span>
            ) : (
              <span style={{ color: 'var(--text-dim)', fontSize: 10.5 }}>
                İlk kez yapılacak seans
              </span>
            )}

            {overload && overload.type === 'increase_weight' && (
              <span style={{ color: 'var(--cyan)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Sparkles size={11} color="var(--cyan)" />
                <span>{overload.title.split(':')[0]}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Arrow / Action Chevron */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-md)',
            background: isTargetMet ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            color: isTargetMet ? '#10b981' : 'var(--text-secondary)',
            flexShrink: 0
          }}
        >
          <ChevronRight size={16} />
        </div>
      </div>

      {/* Live Recorded Sets Chips Preview */}
      {isStarted && (
        <div
          style={{
            marginTop: 9,
            paddingTop: 8,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap'
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginRight: 2 }}>
            Kayıtlı:
          </span>
          {activeSets.map((s, idx) => (
            <span
              key={idx}
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: isTargetMet ? '#a7f3d0' : '#bae6fd',
                background: isTargetMet ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.18)',
                padding: '2px 7px',
                borderRadius: '4px'
              }}
            >
              {s.weight} kg × {s.reps || 5}
            </span>
          ))}

          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--cyan)',
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3
            }}
          >
            <Plus size={11} />
            <span>Set Ekle</span>
          </span>
        </div>
      )}

      {/* PT Coaching Tip Note */}
      {item.ptTip && (
        <div
          style={{
            marginTop: 8,
            fontSize: 10.5,
            color: 'var(--text-muted)',
            lineHeight: 1.35,
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '5px 8px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '2px solid rgba(56, 189, 248, 0.4)'
          }}
        >
          <strong style={{ color: 'var(--text-secondary)' }}>💡 PT Formu:</strong> {item.ptTip}
        </div>
      )}
    </div>
  );
};
