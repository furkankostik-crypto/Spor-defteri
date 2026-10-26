import React, { useState, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { Gender } from '../../types/workout';
import { sounds } from '../../utils/audio';
import { 
  X, 
  Scale, 
  Save, 
  Check
} from 'lucide-react';

export const AthleteProfileModal: React.FC = () => {
  const { 
    profile, 
    updateProfile, 
    isProfileModalOpen, 
    setIsProfileModalOpen 
  } = useWorkout();

  const [weight, setWeight] = useState<number>(profile.bodyWeightKg || 75);
  const [gender, setGender] = useState<Gender>(profile.gender || 'male');
  const [age, setAge] = useState<number>(profile.age || 25);
  const [goal, setGoal] = useState<'hypertrophy' | 'strength' | 'endurance'>(profile.trainingGoal || 'hypertrophy');

  useEffect(() => {
    if (isProfileModalOpen) {
      setWeight(profile.bodyWeightKg || 75);
      setGender(profile.gender || 'male');
      setAge(profile.age || 25);
      setGoal(profile.trainingGoal || 'hypertrophy');
    }
  }, [isProfileModalOpen, profile]);

  if (!isProfileModalOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();
    updateProfile({
      bodyWeightKg: Math.max(30, Math.min(250, weight)),
      gender,
      age: Math.max(12, Math.min(100, age)),
      trainingGoal: goal
    });
    setIsProfileModalOpen(false);
  };

  const handleClose = () => {
    sounds.playPop();
    setIsProfileModalOpen(false);
  };

  return (
    <div className="modal-backdrop" onClick={handleClose} style={{ zIndex: 1100, padding: 14 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: 420,
          background: 'linear-gradient(180deg, #162032 0%, #0d131f 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.15)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px 18px'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div 
              style={{ 
                width: 38, 
                height: 38, 
                borderRadius: 'var(--radius-md)', 
                background: 'rgba(56, 189, 248, 0.15)', 
                border: '1px solid rgba(56, 189, 248, 0.35)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'var(--cyan)' 
              }}
            >
              <Scale size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                Sporcu Profili
              </h3>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Güç standartları ve 1RM hesaplama kriterleri
              </div>
            </div>
          </div>

          <button 
            type="button" 
            onClick={handleClose} 
            className="btn-icon" 
            style={{ width: 32, height: 32, borderRadius: '50%' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Vücut Ağırlığı */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
              <span>Vücut Ağırlığı</span>
              <span style={{ color: 'var(--cyan)', fontWeight: 800 }}>{weight} kg</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input 
                type="number"
                step="0.5"
                min="35"
                max="200"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 75)}
                className="form-input"
                style={{ fontSize: 15, fontWeight: 800, textAlign: 'center', height: 42 }}
                required
              />
              <div style={{ display: 'flex', gap: 4 }}>
                {[-2, -0.5, +0.5, +2].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => setWeight((w) => Math.max(30, Math.round((w + delta) * 10) / 10))}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-muted)',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '8px 8px',
                      cursor: 'pointer'
                    }}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 4 }}>
              * Kaldırdığınız ağırlıkların vücut kütlenize oranı için kullanılır.
            </div>
          </div>

          {/* Cinsiyet */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginBottom: 6, display: 'block' }}>
              Cinsiyet
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setGender('male');
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: gender === 'male' ? '1.5px solid var(--cyan)' : '1px solid var(--border)',
                  background: gender === 'male' ? 'rgba(56, 189, 248, 0.15)' : 'var(--input-bg)',
                  color: gender === 'male' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s'
                }}
              >
                <span>Erkek</span>
                {gender === 'male' && <Check size={14} color="var(--cyan)" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setGender('female');
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: gender === 'female' ? '1.5px solid #ec4899' : '1px solid var(--border)',
                  background: gender === 'female' ? 'rgba(236, 72, 153, 0.15)' : 'var(--input-bg)',
                  color: gender === 'female' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s'
                }}
              >
                <span>Kadın</span>
                {gender === 'female' && <Check size={14} color="#ec4899" />}
              </button>
            </div>
          </div>

          {/* Yaş & Hedef */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginBottom: 6, display: 'block' }}>
                Yaş
              </label>
              <input 
                type="number"
                min="12"
                max="99"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value, 10) || 25)}
                className="form-input"
                style={{ textAlign: 'center', height: 40 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginBottom: 6, display: 'block' }}>
                Antrenman Odağı
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as any)}
                className="form-input"
                style={{ height: 40, fontSize: 12 }}
              >
                <option value="hypertrophy">Hipertrofi (Kas Gelişimi)</option>
                <option value="strength">Maksimal Güç</option>
                <option value="endurance">Dayanıklılık</option>
              </select>
            </div>
          </div>

          {/* Kaydet Butonu */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{
              marginTop: 6,
              height: 44,
              fontSize: 14,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              boxShadow: '0 4px 16px rgba(56, 189, 248, 0.4)'
            }}
          >
            <Save size={16} />
            <span>Kaydet</span>
          </button>
        </form>
      </div>
    </div>
  );
};
