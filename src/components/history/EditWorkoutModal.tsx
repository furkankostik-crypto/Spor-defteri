import React, { useState, useEffect } from 'react';
import { Workout, SavedExercise } from '../../types/workout';
import { useWorkout } from '../../context/WorkoutContext';
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

  useEffect(() => {
    if (workout) {
      setDate(workout.date || '');
      setType(workout.type || 'Üst Vücut');
      setExercises(workout.exercises || []);
    }
  }, [workout]);

  if (!isOpen || !workout) return null;

  const handleSetChange = (exIndex: number, setIndex: number, newWeight: number) => {
    setExercises(prev => {
      const next = [...prev];
      const targetEx = { ...next[exIndex] };
      const nextSets = [...targetEx.sets];
      nextSets[setIndex] = Math.max(0, newWeight);
      targetEx.sets = nextSets;

      const detailed = targetEx.detailedSets 
        ? [...targetEx.detailedSets] 
        : nextSets.map((w, i) => ({ id: String(i + 1), weight: w, reps: 5 }));
      
      if (detailed[setIndex]) {
        detailed[setIndex] = { ...detailed[setIndex], weight: Math.max(0, newWeight) };
      } else {
        detailed[setIndex] = { id: String(setIndex + 1), weight: Math.max(0, newWeight), reps: 5 };
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
      targetEx.sets = [...targetEx.sets, lastW];
      
      const detailed = targetEx.detailedSets 
        ? [...targetEx.detailedSets] 
        : targetEx.sets.slice(0, -1).map((w, i) => ({ id: String(i + 1), weight: w, reps: 5 }));
        
      targetEx.detailedSets = [
        ...detailed,
        { id: String(detailed.length + 1), weight: lastW, reps: 5 }
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

  const handleSave = () => {
    const validExercises = exercises.filter(ex => ex.sets.some(w => w > 0));
    if (validExercises.length === 0) return;

    updateWorkout({
      ...workout,
      date,
      type,
      exercises: validExercises
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
          <label className="form-label">Kayıtlı Egzersizler ve Setler</label>
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
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  {ex.sets.map((wgt, sIdx) => (
                    <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>#{sIdx + 1}</span>
                      <input
                        type="number"
                        step="0.5"
                        value={wgt}
                        onChange={(e) => handleSetChange(exIdx, sIdx, parseFloat(e.target.value) || 0)}
                        className="form-input"
                        style={{ width: 64, padding: '6px 4px', textAlign: 'center', fontSize: 13, height: 32 }}
                      />
                      {ex.sets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSet(exIdx, sIdx)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 0 }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleAddSet(exIdx)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px dashed var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-muted)',
                      padding: '4px 8px',
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    + Set
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 20, padding: 14 }}
        >
          <Check size={18} />
          <span>Değişiklikleri Kaydet</span>
        </button>
      </div>
    </div>
  );
};
