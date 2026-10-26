import React, { useState, useEffect } from 'react';
import { Workout, SavedExercise, ExerciseDefinition } from '../../types/workout';
import { useWorkout } from '../../context/WorkoutContext';
import { useBackButton } from '../../context/BackNavigationContext';
import { isDurationExercise, getSetDurationSeconds } from '../../utils/calculations';
import { muscleMetadata } from '../../data/muscleMetadata';
import { WeightRepPicker } from '../workout/WeightRepPicker';
import { sounds } from '../../utils/audio';
import { X, Trash2, Check } from 'lucide-react';

interface EditWorkoutModalProps {
  workout: Workout | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditWorkoutModal: React.FC<EditWorkoutModalProps> = ({ workout, isOpen, onClose }) => {
  const { updateWorkout, allExercises, profile } = useWorkout();

  const [date, setDate] = useState(workout?.date || '');
  const [type, setType] = useState(workout?.type || 'Üst Vücut');
  const [exercises, setExercises] = useState<SavedExercise[]>(workout?.exercises || []);
  const [activePicker, setActivePicker] = useState<{
    exIndex: number;
    setIndex: number;
    field: 'weight' | 'reps';
  } | null>(null);

  useBackButton(
    Boolean(isOpen && workout),
    () => {
      if (activePicker) {
        sounds.playPop();
        setActivePicker(null);
      } else {
        onClose();
      }
    },
    80
  );

  useEffect(() => {
    if (workout) {
      setDate(workout.date || '');
      setType(workout.type || 'Üst Vücut');
      setExercises(workout.exercises || []);
      setActivePicker(null);
    }
  }, [workout]);

  if (!isOpen || !workout) return null;

  const getSetReps = (ex: SavedExercise, setIndex: number): number => {
    const isDur = isDurationExercise(ex.id);
    if (isDur) {
      const ds = ex.detailedSets?.[setIndex];
      if (ds) return getSetDurationSeconds(ds, true) || 45;
      return ex.sets[setIndex] || 45;
    }
    return ex.detailedSets?.[setIndex]?.reps ?? 8;
  };

  const handleSetWeightChange = (exIndex: number, setIndex: number, newWeight: number) => {
    const cleanWeight = Math.max(0, newWeight);
    setExercises(prev => {
      const next = [...prev];
      const targetEx = { ...next[exIndex] };
      const nextSets = [...targetEx.sets];
      nextSets[setIndex] = cleanWeight;
      targetEx.sets = nextSets;

      const detailed = targetEx.detailedSets
        ? [...targetEx.detailedSets]
        : nextSets.map((w, i) => ({ id: String(i + 1), weight: w, reps: 8 }));

      if (detailed[setIndex]) {
        detailed[setIndex] = { ...detailed[setIndex], weight: cleanWeight };
      } else {
        detailed[setIndex] = { id: String(setIndex + 1), weight: cleanWeight, reps: 8 };
      }
      targetEx.detailedSets = detailed;

      next[exIndex] = targetEx;
      return next;
    });
  };

  const handleSetRepsChange = (exIndex: number, setIndex: number, newReps: number) => {
    const cleanReps = Math.max(1, Math.round(newReps));
    setExercises(prev => {
      const next = [...prev];
      const targetEx = { ...next[exIndex] };
      const isDur = isDurationExercise(targetEx.id);
      if (isDur) {
        const nextSets = [...targetEx.sets];
        nextSets[setIndex] = cleanReps;
        targetEx.sets = nextSets;
      }
      const detailed = targetEx.detailedSets
        ? [...targetEx.detailedSets]
        : targetEx.sets.map((w, i) => ({ id: String(i + 1), weight: isDur ? 0 : w, reps: isDur ? w : 8 }));

      if (detailed[setIndex]) {
        detailed[setIndex] = { ...detailed[setIndex], weight: isDur ? 0 : detailed[setIndex].weight, reps: cleanReps };
      } else {
        detailed[setIndex] = {
          id: String(setIndex + 1),
          weight: isDur ? 0 : (targetEx.sets[setIndex] || 0),
          reps: cleanReps
        };
      }
      targetEx.detailedSets = detailed;

      next[exIndex] = targetEx;
      return next;
    });
  };

  const handleAddSet = (exIndex: number) => {
    setExercises(prev => {
      const next = [...prev];
      const targetEx = { ...next[exIndex] };
      const isDur = isDurationExercise(targetEx.id);
      const lastW = targetEx.sets.length > 0 ? targetEx.sets[targetEx.sets.length - 1] : (isDur ? 45 : 0);
      const lastReps =
        targetEx.detailedSets && targetEx.detailedSets.length > 0
          ? targetEx.detailedSets[targetEx.detailedSets.length - 1].reps
          : (isDur ? lastW : 8);
      targetEx.sets = [...targetEx.sets, isDur ? lastReps : lastW];

      const detailed = targetEx.detailedSets
        ? [...targetEx.detailedSets]
        : targetEx.sets.slice(0, -1).map((w, i) => ({ id: String(i + 1), weight: isDur ? 0 : w, reps: isDur ? w : 8 }));

      targetEx.detailedSets = [
        ...detailed,
        { id: String(detailed.length + 1), weight: isDur ? 0 : lastW, reps: lastReps }
      ];
      next[exIndex] = targetEx;
      return next;
    });
  };

  const handleRemoveSet = (exIndex: number, setIndex: number) => {
    if (activePicker && activePicker.exIndex === exIndex) {
      setActivePicker(null);
    }
    setExercises(prev => {
      const next = [...prev];
      const targetEx = { ...next[exIndex] };
      if (targetEx.sets.length <= 1) return prev;
      targetEx.sets = targetEx.sets.filter((_, idx) => idx !== setIndex);
      if (targetEx.detailedSets) {
        targetEx.detailedSets = targetEx.detailedSets.filter((_, idx) => idx !== setIndex);
      }
      next[exIndex] = targetEx;
      return next;
    });
  };

  const handleRemoveExercise = (exIndex: number) => {
    if (activePicker && activePicker.exIndex === exIndex) {
      setActivePicker(null);
    }
    setExercises(prev => prev.filter((_, idx) => idx !== exIndex));
  };

  const validExercises = exercises.filter(ex => {
    const isDur = isDurationExercise(ex.id);
    if (isDur) {
      return ex.sets.some(w => w > 0) || (ex.detailedSets?.some(s => (s.reps || 0) > 0 || (s.weight || 0) > 0) ?? false);
    }
    return ex.sets.some(w => w > 0);
  });

  const handleSave = () => {
    if (validExercises.length === 0) return;

    updateWorkout({
      ...workout,
      date,
      type,
      exercises: validExercises,
      createdAt: Date.now()
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100dvh - 32px - var(--safe-top) - var(--safe-bottom))'
        }}
      >
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Antrenmanı Düzenle</h2>
            <button className="btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Tarih</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Antrenman Başlığı / Bölge</label>
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label className="form-label">Kayıtlı Egzersizler ve Setler (KG × Tekrar)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {exercises.map((ex, exIdx) => {
                const exDef = allExercises.find(e => e.id === ex.id);
                const accentColor = muscleMetadata[ex.muscle || exDef?.muscle || 'chest']?.color || '#38bdf8';

                return (
                  <div
                    key={`${ex.id}-${exIdx}`}
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 12
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#ffffff' }}>{ex.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(exIdx)}
                        style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}
                        title="Hareketi Sil"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {ex.sets.map((wgt, sIdx) => {
                        const isDur = isDurationExercise(ex.id);
                        const repVal = getSetReps(ex, sIdx);
                        const isWActive =
                          activePicker?.exIndex === exIdx &&
                          activePicker?.setIndex === sIdx &&
                          activePicker?.field === 'weight';
                        const isRActive =
                          activePicker?.exIndex === exIdx &&
                          activePicker?.setIndex === sIdx &&
                          activePicker?.field === 'reps';

                        return (
                          <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', width: 24 }}>
                              #{sIdx + 1}
                            </span>
                            {isDur ? (
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playPop();
                                  setActivePicker(
                                    isRActive ? null : { exIndex: exIdx, setIndex: sIdx, field: 'reps' }
                                  );
                                }}
                                style={{
                                  flex: 1,
                                  height: 36,
                                  borderRadius: 'var(--radius-sm)',
                                  background: isRActive ? `${accentColor}20` : 'rgba(10, 16, 28, 0.85)',
                                  border: isRActive ? `1.5px solid ${accentColor}` : '1px solid rgba(255,255,255,0.12)',
                                  color: '#ffffff',
                                  fontWeight: 800,
                                  fontSize: 13.5,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 5
                                }}
                              >
                                <span>{repVal}</span>
                                <span style={{ fontSize: 10.5, color: 'var(--text-dim)', fontWeight: 700 }}>saniye</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    sounds.playPop();
                                    setActivePicker(
                                      isWActive ? null : { exIndex: exIdx, setIndex: sIdx, field: 'weight' }
                                    );
                                  }}
                                  style={{
                                    flex: 1,
                                    height: 36,
                                    borderRadius: 'var(--radius-sm)',
                                    background: isWActive ? `${accentColor}20` : 'rgba(10, 16, 28, 0.85)',
                                    border: isWActive ? `1.5px solid ${accentColor}` : '1px solid rgba(255,255,255,0.12)',
                                    color: '#ffffff',
                                    fontWeight: 800,
                                    fontSize: 13.5,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 4
                                  }}
                                >
                                  <span>{wgt}</span>
                                  <span style={{ fontSize: 10.5, color: 'var(--text-dim)', fontWeight: 700 }}>kg</span>
                                </button>
                                <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 700 }}>×</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    sounds.playPop();
                                    setActivePicker(
                                      isRActive ? null : { exIndex: exIdx, setIndex: sIdx, field: 'reps' }
                                    );
                                  }}
                                  style={{
                                    flex: 1,
                                    height: 36,
                                    borderRadius: 'var(--radius-sm)',
                                    background: isRActive ? `${accentColor}20` : 'rgba(10, 16, 28, 0.85)',
                                    border: isRActive ? `1.5px solid ${accentColor}` : '1px solid rgba(255,255,255,0.12)',
                                    color: '#ffffff',
                                    fontWeight: 800,
                                    fontSize: 13.5,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 4
                                  }}
                                >
                                  <span>{repVal}</span>
                                  <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700 }}>tekrar</span>
                                </button>
                              </>
                            )}
                            {ex.sets.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSet(exIdx, sIdx)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '0 4px' }}
                                title="Seti Sil"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => handleAddSet(exIdx)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px dashed var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-muted)',
                          padding: '6px 10px',
                          fontSize: 11,
                          cursor: 'pointer',
                          alignSelf: 'flex-start',
                          marginTop: 4
                        }}
                      >
                        + Set Ekle
                      </button>
                    </div>
                  </div>
                );
              })}
              {exercises.length === 0 && (
                <div style={{ fontSize: 12, color: '#f87171', textAlign: 'center', padding: '12px 0' }}>
                  Tüm hareketler çıkarıldı. Kaydetmek için en az 1 geçerli hareket bulunmalıdır.
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={validExercises.length === 0}
            className="btn btn-primary"
            style={{
              width: '100%',
              marginTop: 20,
              padding: 14,
              opacity: validExercises.length === 0 ? 0.5 : 1,
              cursor: validExercises.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <Check size={18} />
            <span>Değişiklikleri Kaydet</span>
          </button>
        </div>

        {activePicker && exercises[activePicker.exIndex] && (() => {
          const targetEx = exercises[activePicker.exIndex];
          const safeSetIdx = Math.min(activePicker.setIndex, Math.max(0, targetEx.sets.length - 1));
          const isDur = isDurationExercise(targetEx.id);
          const exDef: ExerciseDefinition = allExercises.find(e => e.id === targetEx.id) || {
            id: targetEx.id,
            name: targetEx.name,
            muscle: targetEx.muscle || 'chest',
            category: 'upper'
          };
          const accentColor = muscleMetadata[exDef.muscle]?.color || '#38bdf8';

          return (
            <WeightRepPicker
              exercise={exDef}
              setIndex={safeSetIdx}
              totalSets={targetEx.sets.length}
              activeField={isDur ? 'reps' : activePicker.field}
              weight={isDur ? 0 : (targetEx.sets[safeSetIdx] || 0)}
              reps={getSetReps(targetEx, safeSetIdx)}
              isDuration={isDur}
              accentColor={accentColor}
              bodyWeightKg={profile.bodyWeightKg}
              onChangeField={(f) => setActivePicker({ ...activePicker, setIndex: safeSetIdx, field: f })}
              onChangeSetIndex={(newIdx) => setActivePicker({ ...activePicker, setIndex: newIdx })}
              onUpdateValue={(field, value) => {
                if (field === 'weight') {
                  handleSetWeightChange(activePicker.exIndex, safeSetIdx, value);
                } else {
                  handleSetRepsChange(activePicker.exIndex, safeSetIdx, value);
                }
              }}
              onApplyToAllSets={(field, value) => {
                targetEx.sets.forEach((_, idx) => {
                  if (field === 'weight') {
                    handleSetWeightChange(activePicker.exIndex, idx, value);
                  } else {
                    handleSetRepsChange(activePicker.exIndex, idx, value);
                  }
                });
              }}
              onClose={() => setActivePicker(null)}
            />
          );
        })()}
      </div>
    </div>
  );
};
