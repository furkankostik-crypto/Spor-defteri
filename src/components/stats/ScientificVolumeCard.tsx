import React, { useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { calculateWeeklyVolumeLandmarks } from '../../utils/scientificCalculations';
import { AnatomyIcon } from '../../data/anatomyIcons';
import { 
  Activity, 
  Info 
} from 'lucide-react';

export const ScientificVolumeCard: React.FC = () => {
  const { workouts, allExercises } = useWorkout();
  const [showInfo, setShowInfo] = useState(false);
  const volumeStatuses = calculateWeeklyVolumeLandmarks(workouts, allExercises);

  // Summary counts
  const mavCount = volumeStatuses.filter(v => v.landmark === 'mav').length;
  const mevCount = volumeStatuses.filter(v => v.landmark === 'mev').length;
  const underCount = volumeStatuses.filter(v => v.landmark === 'under_mev').length;

  return (
    <div className="card" style={{ padding: '16px', marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div 
            style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muscle-emerald)'
            }}
          >
            <Activity size={17} />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Haftalık Hipertrofi Hacmi (RP)
            </h3>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Bilimsel kas gelişim aralıkları (MEV / MAV / MRV)
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 600
          }}
        >
          <Info size={14} />
          <span>{showInfo ? 'Kapat' : 'Nedir?'}</span>
        </button>
      </div>

      {/* Info explanation accordion */}
      {showInfo && (
        <div 
          style={{ 
            background: 'rgba(15, 23, 42, 0.8)', 
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
            marginBottom: 12,
            fontSize: 11.5,
            color: 'var(--text-muted)',
            lineHeight: 1.5
          }}
        >
          <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
            🔬 Dr. Mike Israetel Hacim Standartları:
          </div>
          <div>• <strong>MEV (6-10 set/hafta):</strong> Minimum Etkili Hacim. Kas kütlesini korur ve temel adaptasyon sağlar.</div>
          <div>• <strong>MAV (12-20 set/hafta):</strong> Maksimum Adaptif Hacim (Altın Aralık). En hızlı kas hipertrofisini sağlar.</div>
          <div>• <strong>MRV (22+ set/hafta):</strong> Maksimum Toparlanabilir Hacim. Fazlası aşırı yorgunluk ve performans düşüşü yaratır.</div>
        </div>
      )}

      {/* Metric summary badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        <div 
          style={{
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.25)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)' }}>MAV (Optimal)</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff' }}>{mavCount} Kas</div>
        </div>

        <div 
          style={{
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muscle-emerald)' }}>MEV (Etkili)</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff' }}>{mevCount} Kas</div>
        </div>

        <div 
          style={{
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(100, 116, 139, 0.1)',
            border: '1px solid rgba(100, 116, 139, 0.25)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>Geliştirilmeli</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff' }}>{underCount} Kas</div>
        </div>
      </div>

      {/* List of muscles with volume bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {volumeStatuses.map((item) => {
          // Progress bar percentage (max 24 sets = 100%)
          const pct = Math.min(100, Math.round((item.weeklySets / 22) * 100));

          return (
            <div 
              key={item.muscle}
              style={{
                background: 'rgba(15, 23, 42, 0.45)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AnatomyIcon muscle={item.muscle} size={15} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{item.muscleName}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span 
                    style={{ 
                      fontSize: 10, 
                      fontWeight: 800, 
                      padding: '2px 6px', 
                      borderRadius: 'var(--radius-sm)',
                      background: `${item.landmarkColor}20`,
                      color: item.landmarkColor,
                      border: `1px solid ${item.landmarkColor}40`
                    }}
                  >
                    {item.landmarkLabel}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#ffffff' }}>
                    {item.weeklySets} set
                  </span>
                </div>
              </div>

              {/* Progress track */}
              <div className="progress-bar-track" style={{ height: 6, margin: '4px 0 2px' }}>
                <div 
                  className="progress-bar-fill" 
                  style={{ 
                    width: `${Math.max(5, pct)}%`,
                    background: item.landmarkColor
                  }} 
                />
              </div>

              <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 2 }}>
                {item.feedback}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
