import React, { useState } from 'react';
import { MuscleGroup, ExerciseDefinition } from '../../types/workout';
import { AnatomyIcon } from '../../data/anatomyIcons';
import { muscleMetadata } from '../../data/muscleMetadata';
import { useWorkout } from '../../context/WorkoutContext';
import { ExerciseSquareCard } from './ExerciseSquareCard';
import { ExerciseInputOverlay } from './ExerciseInputOverlay';
import { AddCustomExerciseModal } from './AddCustomExerciseModal';
import { sounds } from '../../utils/audio';
import { 
  ArrowLeft, 
  PlusCircle, 
  Flame, 
  Dumbbell, 
  ChevronRight 
} from 'lucide-react';

interface MuscleDetailViewProps {
  muscle: MuscleGroup;
  onBack: () => void;
  onSelectOtherMuscle: (muscle: MuscleGroup) => void;
}

export const MuscleDetailView: React.FC<MuscleDetailViewProps> = ({
  muscle,
  onBack,
  onSelectOtherMuscle
}) => {
  const { allExercises, draft } = useWorkout();
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [selectedOverlayExercise, setSelectedOverlayExercise] = useState<ExerciseDefinition | null>(null);

  const meta = muscleMetadata[muscle] || muscleMetadata.chest;

  // Filter exercises for this specific muscle
  const exercises = allExercises.filter((ex) => ex.muscle === muscle);

  // Calculate live session stats for this muscle
  let muscleSetsCount = 0;
  let muscleVolume = 0;
  exercises.forEach((ex) => {
    const sets = draft.exerciseSets[ex.id] || [];
    sets.forEach((s) => {
      if (s.weight > 0) {
        muscleSetsCount++;
        muscleVolume += s.weight * (s.reps || 5);
      }
    });
  });

  const muscleList: MuscleGroup[] = [
    'chest',
    'back',
    'shoulder',
    'biceps',
    'triceps',
    'quads',
    'hamstring',
    'glutes',
    'abs',
    'calves'
  ];

  return (
    <div style={{ animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      {/* Top Navigation / Breadcrumb Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12
        }}
      >
        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            onBack();
          }}
          className="btn btn-secondary"
          style={{
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 'var(--radius-full)',
            gap: 6,
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid var(--border)'
          }}
        >
          <ArrowLeft size={14} color="var(--accent)" />
          <span>Vücut Haritası</span>
        </button>

        {/* Quick Muscle Counter */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-dim)',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <Dumbbell size={13} color={meta.color} />
          <span>{exercises.length} Hareket Mevcut</span>
        </div>
      </div>

      {/* Muscle Banner Hero Card */}
      <div
        className="card"
        style={{
          padding: '16px',
          marginBottom: 14,
          background: `linear-gradient(135deg, ${meta.color}15, rgba(18, 24, 38, 0.85))`,
          borderColor: `${meta.color}40`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 140,
              height: 115,
              minWidth: 140,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden'
            }}
          >
            <AnatomyIcon muscle={muscle} width={140} height={115} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                {meta.name}
              </h2>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
              {meta.latinName} • {meta.description}
            </div>
          </div>
        </div>

        {/* Live Set & Volume Indicator if active in current session */}
        {muscleSetsCount > 0 && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--muscle-emerald)',
                fontWeight: 700
              }}
            >
              <Flame size={14} />
              Bu Bölgede: {muscleSetsCount} Set Girildi
            </span>
            <span style={{ color: '#ffffff', fontWeight: 800 }}>
              {muscleVolume.toLocaleString()} kg Hacim
            </span>
          </div>
        )}
      </div>

      {/* Horizontal Fast Muscle Switcher */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-muted)',
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <span>Diğer Kas Grupları:</span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 4,
            scrollbarWidth: 'none'
          }}
        >
          {muscleList.map((m) => {
            const mMeta = muscleMetadata[m];
            const isCurrent = m === muscle;

            return (
              <button
                type="button"
                key={m}
                onClick={() => {
                  sounds.playPop();
                  onSelectOtherMuscle(m);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: isCurrent ? `1px solid ${mMeta.color}` : '1px solid var(--border)',
                  background: isCurrent ? `${mMeta.color}25` : 'var(--input-bg)',
                  color: isCurrent ? '#ffffff' : 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: isCurrent ? 700 : 500,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <AnatomyIcon muscle={m} size={14} />
                <span>{mMeta.name}</span>
                {isCurrent && <ChevronRight size={12} color={mMeta.color} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercise Square Cards Grid for this Muscle Group */}
      <div>
        {exercises.length > 0 ? (
          <div className="exercise-cards-grid">
            {exercises.map((exercise) => (
              <ExerciseSquareCard 
                key={exercise.id} 
                exercise={exercise} 
                onClick={() => setSelectedOverlayExercise(exercise)}
              />
            ))}
          </div>
        ) : (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: 'var(--text-muted)'
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏋️‍♂️</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#ffffff', marginBottom: 4 }}>
              Bu Bölgede Henüz Egzersiz Yok
            </div>
            <div style={{ fontSize: 12, marginBottom: 16 }}>
              Aşağıdaki butona tıklayarak {meta.name} için yeni bir özel hareket ekleyebilirsiniz.
            </div>
            <button
              type="button"
              onClick={() => setIsAddCustomOpen(true)}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: 13 }}
            >
              <PlusCircle size={15} />
              <span>{meta.name} Hareketi Ekle</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Custom Exercise for this Muscle */}
      <button
        type="button"
        onClick={() => setIsAddCustomOpen(true)}
        className="btn btn-secondary"
        style={{
          width: '100%',
          marginTop: 4,
          marginBottom: 16,
          padding: '12px',
          borderStyle: 'dashed',
          borderColor: 'rgba(255, 255, 255, 0.15)'
        }}
      >
        <PlusCircle size={16} color={meta.color} />
        <span>{meta.name} İçin Özel Hareket Ekle</span>
      </button>

      {/* Add Custom Exercise Modal */}
      <AddCustomExerciseModal
        isOpen={isAddCustomOpen}
        onClose={() => setIsAddCustomOpen(false)}
        defaultMuscle={muscle}
      />

      {/* Interactive Exercise Input Overlay */}
      <ExerciseInputOverlay
        exercise={selectedOverlayExercise}
        isOpen={Boolean(selectedOverlayExercise)}
        onClose={() => setSelectedOverlayExercise(null)}
      />
    </div>
  );
};

