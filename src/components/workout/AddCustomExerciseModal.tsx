import React, { useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { MuscleGroup } from '../../types/workout';
import { X, PlusCircle } from 'lucide-react';

interface AddCustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMuscle?: MuscleGroup;
}

export const AddCustomExerciseModal: React.FC<AddCustomExerciseModalProps> = ({ 
  isOpen, 
  onClose,
  defaultMuscle = 'chest'
}) => {
  const { addCustomExercise } = useWorkout();
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup>(defaultMuscle);
  const [category, setCategory] = useState<'upper' | 'lower' | 'core' | 'other'>('upper');

  React.useEffect(() => {
    if (defaultMuscle) {
      setMuscle(defaultMuscle);
    }
  }, [defaultMuscle, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCustomExercise(name.trim(), muscle, category);
    setName('');
    onClose();
  };

  const muscleOptions: { id: MuscleGroup; label: string; cat: 'upper' | 'lower' | 'core' }[] = [
    { id: 'chest', label: 'Göğüs (Chest)', cat: 'upper' },
    { id: 'back', label: 'Sırt & Kanat (Back)', cat: 'upper' },
    { id: 'shoulder', label: 'Omuz (Shoulder)', cat: 'upper' },
    { id: 'biceps', label: 'Biceps (Ön Kol)', cat: 'upper' },
    { id: 'triceps', label: 'Triceps (Arka Kol)', cat: 'upper' },
    { id: 'quads', label: 'Ön Bacak (Quads)', cat: 'lower' },
    { id: 'hamstring', label: 'Arka Bacak (Hamstring)', cat: 'lower' },
    { id: 'glutes', label: 'Kalça (Glutes)', cat: 'lower' },
    { id: 'calves', label: 'Kalf (Calves)', cat: 'lower' },
    { id: 'abs', label: 'Karın & Core', cat: 'core' }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="anatomy-badge" style={{ color: 'var(--muscle-emerald)' }}>
              <PlusCircle size={20} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Yeni Egzersiz Ekle</h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Egzersiz Adı</label>
            <input
              type="text"
              required
              placeholder="Örn: Incline Dumbbell Press"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hedef Kas Grubu</label>
            <select
              value={muscle}
              onChange={(e) => {
                const selectedMuscle = e.target.value as MuscleGroup;
                setMuscle(selectedMuscle);
                const opt = muscleOptions.find(o => o.id === selectedMuscle);
                if (opt) setCategory(opt.cat);
              }}
              className="form-input"
              style={{ background: 'var(--input-bg)' }}
            >
              {muscleOptions.map((opt) => (
                <option key={opt.id} value={opt.id} style={{ background: '#121826' }}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Kategori / Bölge</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'upper', label: 'Üst Vücut' },
                { id: 'lower', label: 'Alt Vücut' },
                { id: 'core', label: 'Core / Karın' }
              ].map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id as any)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: 'var(--radius-sm)',
                    border: category === c.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: category === c.id ? 'var(--accent-soft)' : 'var(--input-bg)',
                    color: category === c.id ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 16, padding: '14px' }}
          >
            Egzersizi Kaydet
          </button>
        </form>
      </div>
    </div>
  );
};
