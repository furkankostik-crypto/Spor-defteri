import React, { useState } from 'react';
import { Workout, MuscleGroup } from '../../types/workout';
import { useWorkout } from '../../context/WorkoutContext';
import { useBackButton } from '../../context/BackNavigationContext';
import { defaultExercises } from '../../data/defaultExercises';
import { muscleMetadata } from '../../data/muscleMetadata';
import { isDurationExercise, isSetValid, getSetDurationSeconds } from '../../utils/calculations';
import { ExerciseVisual, getExerciseEquipment } from '../workout/ExerciseVisual';
import { sounds } from '../../utils/audio';
import { 
  X, 
  Edit3, 
  Trash2, 
  Dumbbell, 
  Flame, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface WorkoutDetailModalProps {
  workout: Workout | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (workout: Workout) => void;
}

const getSplitBadgeStyle = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('üst') || t.includes('upper')) {
    return { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.14)', border: 'rgba(56, 189, 248, 0.35)' };
  }
  if (t.includes('alt') || t.includes('lower') || t.includes('bacak') || t.includes('leg')) {
    return { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.14)', border: 'rgba(192, 132, 252, 0.35)' };
  }
  if (t.includes('tüm') || t.includes('full')) {
    return { color: '#34d399', bg: 'rgba(52, 211, 153, 0.14)', border: 'rgba(52, 211, 153, 0.35)' };
  }
  if (t.includes('itiş') || t.includes('push')) {
    return { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.14)', border: 'rgba(251, 191, 36, 0.35)' };
  }
  if (t.includes('çekiş') || t.includes('pull')) {
    return { color: '#fb7185', bg: 'rgba(251, 113, 133, 0.14)', border: 'rgba(251, 113, 133, 0.35)' };
  }
  return { color: 'var(--accent)', bg: 'rgba(255, 71, 87, 0.14)', border: 'rgba(255, 71, 87, 0.35)' };
};

const defaultExerciseMap = new Map(defaultExercises.map(e => [e.id, e]));

export const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = ({
  workout,
  isOpen,
  onClose,
  onEdit
}) => {
  const { deleteWorkout } = useWorkout();
  const [isDeleting, setIsDeleting] = useState(false);

  // Hook back button to close this overlay (priority 70)
  useBackButton(Boolean(isOpen && workout), () => {
    sounds.playPop();
    if (isDeleting) {
      setIsDeleting(false);
    } else {
      onClose();
    }
  }, 70);

  if (!isOpen || !workout) return null;

  // Calculate totals
  let totalVolume = 0;
  let totalSets = 0;
  const involvedMuscles = new Set<MuscleGroup>();

  workout.exercises.forEach((ex) => {
    const def = defaultExerciseMap.get(ex.id);
    const m = (ex.muscle || def?.muscle || 'chest') as MuscleGroup;
    involvedMuscles.add(m);

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

  // Date formatted to Turkish with full weekday
  let formattedFullDate = workout.date;
  try {
    const [y, m, d] = workout.date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    formattedFullDate = dateObj.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  } catch {
    formattedFullDate = workout.date;
  }

  const handleDelete = () => {
    if (!isDeleting) {
      setIsDeleting(true);
      return;
    }
    deleteWorkout(workout.id);
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={() => {
        sounds.playPop();
        onClose();
      }}
      style={{ zIndex: 1050, padding: 'calc(8px + var(--safe-top)) calc(8px + var(--safe-right)) calc(8px + var(--safe-bottom)) calc(8px + var(--safe-left))' }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 550,
          width: '100%',
          maxHeight: 'calc(100dvh - 16px - var(--safe-top) - var(--safe-bottom))',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #131b2e 0%, #0c111c 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.12)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden'
        }}
      >
        {/* Sticky Header */}
        <div
          style={{
            padding: '16px 18px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexShrink: 0
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: splitStyle.color,
                  background: splitStyle.bg,
                  border: `1px solid ${splitStyle.border}`,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                {workout.type}
              </span>
            </div>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 900,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                textTransform: 'capitalize'
              }}
            >
              {formattedFullDate}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="btn-icon"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          {/* Summary Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8
            }}
          >
            {/* Total Volume */}
            <div
              style={{
                background: 'rgba(251, 191, 36, 0.08)',
                border: '1px solid rgba(251, 191, 36, 0.22)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 8px',
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--gold)', marginBottom: 2 }}>
                <Flame size={14} />
                <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Hacim</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff' }}>
                {totalVolume.toLocaleString('tr-TR')} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gold)' }}>kg</span>
              </div>
            </div>

            {/* Total Sets */}
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.22)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 8px',
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--muscle-emerald)', marginBottom: 2 }}>
                <Dumbbell size={14} />
                <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Set Sayısı</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff' }}>
                {totalSets} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muscle-emerald)' }}>Set</span>
              </div>
            </div>

            {/* Exercise Count */}
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.22)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 8px',
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--cyan)', marginBottom: 2 }}>
                <CheckCircle2 size={14} />
                <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Hareket</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff' }}>
                {workout.exercises.length} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--cyan)' }}>Egzersiz</span>
              </div>
            </div>
          </div>

          {/* Involved Muscle Groups Chips */}
          {involvedMuscles.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Hedef Bölgeler:</span>
              {Array.from(involvedMuscles).map((m) => {
                const meta = muscleMetadata[m] || muscleMetadata.chest;
                return (
                  <span
                    key={m}
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: meta.color,
                      background: `${meta.color}15`,
                      border: `1px solid ${meta.color}35`,
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-full)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.name}</span>
                  </span>
                );
              })}
            </div>
          )}

          {/* Optional Workout Notes */}
          {workout.notes && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px dashed rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                fontSize: 12.5,
                color: 'var(--text-muted)',
                lineHeight: 1.4
              }}
            >
              <strong style={{ color: '#ffffff' }}>Notlar:</strong> {workout.notes}
            </div>
          )}

          {/* Exercises Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
              Egzersiz Detayları ({workout.exercises.length})
            </span>
          </div>

          {/* Exercises List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {workout.exercises.map((ex, idx) => {
              const def = defaultExerciseMap.get(ex.id);
              const isDuration = isDurationExercise(def || ex.id);
              const muscle = (ex.muscle || def?.muscle || 'chest') as MuscleGroup;
              const meta = muscleMetadata[muscle] || muscleMetadata.chest;
              const equipment = getExerciseEquipment(ex.id, muscle);

              const setsData: { weight: number; reps: number }[] = (
                ex.detailedSets && ex.detailedSets.length > 0
                  ? ex.detailedSets
                      .filter(s => isSetValid(s, isDuration))
                      .map(s => ({
                        weight: isDuration ? 0 : s.weight,
                        reps: isDuration ? getSetDurationSeconds(s, true) : (s.reps || 5)
                      }))
                  : (ex.sets || []).filter(w => w > 0).map(w => ({
                      weight: isDuration ? 0 : w,
                      reps: isDuration ? w : 5
                    }))
              );

              const exVolume = isDuration
                ? setsData.reduce((sum, s) => sum + s.reps, 0)
                : setsData.reduce((sum, s) => sum + (s.weight * s.reps), 0);
              const maxWeight = setsData.length > 0
                ? Math.max(...setsData.map(s => isDuration ? s.reps : s.weight))
                : 0;
              const allIdentical = setsData.length > 1 && setsData.every(
                s => s.weight === setsData[0].weight && s.reps === setsData[0].reps
              );

              return (
                <div
                  key={`${ex.id}-${idx}`}
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Top Row: Visual + Title + Muscle badge + Volume badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <ExerciseVisual
                        exerciseId={ex.id}
                        muscle={muscle}
                        size={40}
                        objectFit="contain"
                        style={{ borderRadius: 'var(--radius-sm)', flexShrink: 0, border: '1px solid rgba(255, 255, 255, 0.08)' }}
                      />

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 14,
                            color: '#ffffff',
                            lineHeight: 1.25,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {ex.name}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 700,
                              color: meta.color,
                              background: `${meta.color}15`,
                              border: `1px solid ${meta.color}35`,
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-full)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3
                            }}
                          >
                            <span>{meta.icon}</span>
                            <span>{meta.name}</span>
                          </span>

                          {equipment && (
                            <span style={{ fontSize: 10, color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ opacity: 0.4 }}>•</span>
                              <span>{equipment.label}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Exercise Volume Badge */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cyan)' }}>
                        {exVolume.toLocaleString('tr-TR')} {isDuration ? 'sn' : 'kg'}
                      </div>
                      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-dim)', marginTop: 1 }}>
                        {setsData.length} Set
                      </div>
                    </div>
                  </div>

                  {/* Sets Breakdown Row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingTop: 8, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {allIdentical ? (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          background: 'rgba(56, 189, 248, 0.08)',
                          border: '1px solid rgba(56, 189, 248, 0.22)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '4px 10px',
                          fontSize: 12
                        }}
                      >
                        <span style={{ color: 'var(--cyan)', fontWeight: 800 }}>
                          {isDuration
                            ? `${setsData.length} Set × ${setsData[0].reps} sn`
                            : `${setsData.length} Set × ${setsData[0].weight} kg`}
                        </span>
                        {!isDuration && (
                          <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>
                            ({setsData[0].reps} tekrar)
                          </span>
                        )}
                        <div style={{ display: 'flex', gap: 3, alignItems: 'center', marginLeft: 2 }}>
                          {setsData.map((_, dotIdx) => (
                            <span
                              key={dotIdx}
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: 'var(--cyan)',
                                opacity: 0.8
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : setsData.length > 0 ? (
                      setsData.map((set, sIdx) => {
                        const isMax = (isDuration ? set.reps : set.weight) === maxWeight && setsData.length > 1;
                        return (
                          <div
                            key={sIdx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: isMax ? 'rgba(251, 191, 36, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                              border: `1px solid ${isMax ? 'rgba(251, 191, 36, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                              borderRadius: 'var(--radius-sm)',
                              padding: '3px 8px',
                              fontSize: 11.5
                            }}
                          >
                            <span style={{ color: isMax ? 'var(--gold)' : 'var(--text-dim)', fontSize: 9.5, fontWeight: 700 }}>
                              S{sIdx + 1}
                            </span>
                            {isDuration ? (
                              <span style={{ color: isMax ? 'var(--gold)' : '#ffffff', fontWeight: 800 }}>
                                {set.reps} sn
                              </span>
                            ) : (
                              <>
                                <span style={{ color: isMax ? 'var(--gold)' : '#ffffff', fontWeight: 800 }}>
                                  {set.weight} kg
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600 }}>
                                  × {set.reps}
                                </span>
                              </>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>
                        Set kaydı girilmedi
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div
          style={{
            padding: '14px 18px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            gap: 10,
            flexShrink: 0
          }}
        >
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onEdit(workout);
            }}
            className="btn btn-secondary"
            style={{
              flex: 1,
              padding: '11px 16px',
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: '1px solid rgba(56, 189, 248, 0.35)',
              background: 'rgba(56, 189, 248, 0.1)',
              color: 'var(--cyan)'
            }}
          >
            <Edit3 size={15} />
            <span>Antrenmanı Düzenle</span>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            style={{
              flex: isDeleting ? 1.4 : 1,
              padding: '11px 16px',
              fontSize: 13,
              borderRadius: 'var(--radius-md)',
              border: isDeleting ? '1px solid #ff4757' : '1px solid rgba(255, 71, 87, 0.3)',
              background: isDeleting ? 'rgba(255, 71, 87, 0.25)' : 'rgba(255, 71, 87, 0.08)',
              color: '#ff6b81',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {isDeleting ? <AlertCircle size={15} /> : <Trash2 size={15} />}
            <span>{isDeleting ? 'Emin misiniz? Kalıcı Sil' : 'Kaydı Sil'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
