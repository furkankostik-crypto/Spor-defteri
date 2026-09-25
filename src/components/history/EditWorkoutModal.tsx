import React, { useState, useEffect } from 'react';
import { Workout, SavedExercise } from '../../types/workout';
import { useWorkout } from '../../context/WorkoutContext';
import { useBackButton } from '../../context/BackNavigationContext';
import { X, Trash2, Check } from 'lucide-react';

interface EditWorkoutModalProps {
  workout: Workout | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditWorkoutModal: React.FC<EditWorkoutModalProps> = ({ workout, isOpen, onClose }) => {
  const { updateWorkout } = useWorkout();

  const [date, setDate] = useState(workout?.date || '');
  const [type, setType] = useState(workout?.type || 'Üst Vücut');
  const [exercises, setExercises] = useState<SavedExercise[]>(workout?.exercises || []);

  useBackButton(Boolean(isOpen && workout), onClose, 80);

  useEffect(() => {
    if (workout) {
      setDate(workout.date || '');
      setType(workout.type || 'Üst Vücut');
      setExercises(workout.exercises || []);
    }
  }, [workout]);

  if (!isOpen || !workout) return null;

  const getSetReps = (ex: SavedExercise, setIndex: number): number => {
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
      const detailed = targetEx.detailedSets
        ? [...targetEx.detailedSets]
        : targetEx.sets.map((w, i) => ({ id: String(i + 1), weight: w, reps: 8 }));

      if (detailed[setIndex]) {
        detailed[setIndex] = { ...detailed[setIndex], reps: cleanReps };
      } else {
        detailed[setIndex] = {
          id: String(setIndex + 1),
          weight: targetEx.sets[setIndex] || 0,
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
      const lastW = targetEx.sets.length > 0 ? targetEx.sets[targetEx.sets.length - 1] : 0;
      const lastReps =
        targetEx.detailedSets && targetEx.detailedSets.length > 0
          ? targetEx.detailedSets[targetEx.detailedSets.length - 1].reps
          : 8;
      targetEx.sets = [...targetEx.sets, lastW];

      const detailed = targetEx.detailedSets
        ? [...targetEx.detailedSets]
        : targetEx.sets.slice(0, -1).map((w, i) => ({ id: String(i + 1), weight: w, reps: 8 }));

      targetEx.detailedSets = [
        ...detailed,
        { id: String(detailed.length + 1), weight: lastW, reps: lastReps }
      ];
      next[exIndex] = targetEx;
      return next;
    });
  };

  const handleRemoveSet = (exIndex: number, setIndex: number) => {
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
    setExercises(prev => prev.filter((_, idx) => idx !== exIndex));
  };

  const validExercises = exercises.filter(ex => ex.sets.some(w => w > 0));

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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
            {exercises.map((ex, exIdx) => (
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
                  {ex.sets.map((wgt, sIdx) => (
                    <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', width: 22 }}>#{sIdx + 1}</span>
                      <input
                        type="number"
                        step="0.5"
                        value={wgt}
                        onChange={(e) => handleSetWeightChange(exIdx, sIdx, parseFloat(e.target.value) || 0)}
                        className="form-input"
                        style={{ width: 68, padding: '6px 4px', textAlign: 'center', fontSize: 13, height: 32 }}
                        title="Ağırlık (kg)"
                      />
                      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>kg ×</span>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={getSetReps(ex, sIdx)}
                        onChange={(e) => handleSetRepsChange(exIdx, sIdx, parseInt(e.target.value, 10) || 1)}
                        className="form-input"
                        style={{ width: 52, padding: '6px 4px', textAlign: 'center', fontSize: 13, height: 32 }}
                        title="Tekrar Sayısı"
                      />
                      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>tkr</span>
                      {ex.sets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSet(exIdx, sIdx)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '0 4px', marginLeft: 'auto' }}
                          title="Seti Sil"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}

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
            ))}
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
    </div>
  );
};
