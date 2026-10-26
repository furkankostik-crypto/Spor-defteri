import React, { useState, useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { calculateWeeklyVolumeLandmarks } from '../../utils/scientificCalculations';
import { calculateProportionalMuscleVolume } from '../../utils/calculations';
import { AnatomyIcon } from '../../data/anatomyIcons';
import { MuscleGroup } from '../../types/workout';
import { sounds } from '../../utils/audio';
import { Activity, Info, ChevronDown, ChevronUp } from 'lucide-react';

export const ScientificVolumeCard: React.FC = () => {
  const { workouts, allExercises } = useWorkout();
  const [mode, setMode] = useState<'weekly' | 'tonnage'>('weekly');
  const [showInfo, setShowInfo] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const volumeStatuses = useMemo(
    () => calculateWeeklyVolumeLandmarks(workouts, allExercises),
    [workouts, allExercises]
  );

  const muscleVolume = useMemo(
    () => calculateProportionalMuscleVolume(workouts, allExercises),
    [workouts, allExercises]
  );

  const tonnageList = useMemo(() => {
    const items: { muscle: MuscleGroup; label: string; volume: number }[] = [
      { muscle: 'chest', label: 'Göğüs', volume: muscleVolume['chest'] || 0 },
      { muscle: 'back', label: 'Sırt & Kanat', volume: muscleVolume['back'] || 0 },
      { muscle: 'shoulder', label: 'Omuz', volume: muscleVolume['shoulder'] || 0 },
      { muscle: 'biceps', label: 'Biceps', volume: muscleVolume['biceps'] || 0 },
      { muscle: 'triceps', label: 'Triceps', volume: muscleVolume['triceps'] || 0 },
      { muscle: 'quads', label: 'Ön Bacak', volume: muscleVolume['quads'] || 0 },
      { muscle: 'hamstring', label: 'Arka Bacak', volume: muscleVolume['hamstring'] || 0 },
      { muscle: 'glutes', label: 'Kalça', volume: muscleVolume['glutes'] || 0 },
      { muscle: 'calves', label: 'Kalf', volume: muscleVolume['calves'] || 0 },
      { muscle: 'abs', label: 'Karın', volume: muscleVolume['abs'] || 0 }
    ];
    return items.sort((a, b) => b.volume - a.volume);
  }, [muscleVolume]);

  const maxMuscleVol = Math.max(...tonnageList.map((m) => m.volume), 1);

  const sortedWeekly = useMemo(() => {
    return [...volumeStatuses].sort((a, b) => b.weeklySets - a.weeklySets);
  }, [volumeStatuses]);

  const visibleWeekly = expanded ? sortedWeekly : sortedWeekly.slice(0, 5);
  const visibleTonnage = expanded ? tonnageList : tonnageList.slice(0, 5);

  return (
    <div className="card" style={{ padding: '14px', marginBottom: 14 }}>
      {/* Header with Mode Switcher */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          gap: 8
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} color="var(--muscle-emerald)" />
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Kas Hacmi & Dağılımı
          </h3>
          {mode === 'weekly' && (
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setShowInfo((p) => !p);
              }}
              aria-label="Haftalık set hedefleri hakkında bilgi"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                padding: 2
              }}
            >
              <Info size={13} />
            </button>
          )}
        </div>

        {/* Mode Toggle Pills */}
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--input-bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 2,
            gap: 2
          }}
        >
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setMode('weekly');
            }}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: 'none',
              background: mode === 'weekly' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: mode === 'weekly' ? 'var(--muscle-emerald)' : 'var(--text-muted)',
              fontSize: 10.5,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Haftalık Set
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setMode('tonnage');
            }}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: 'none',
              background: mode === 'tonnage' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: mode === 'tonnage' ? 'var(--cyan)' : 'var(--text-muted)',
              fontSize: 10.5,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Toplam Tonaj
          </button>
        </div>
      </div>

      {/* Optional Compact Info Note */}
      {showInfo && mode === 'weekly' && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 10px',
            marginBottom: 10,
            fontSize: 11,
            color: 'var(--text-muted)',
            lineHeight: 1.45
          }}
        >
          <strong>Haftalık Hedef:</strong> Kas koruma için <strong>6-10 set (Etkili)</strong>, maksimum büyüme için <strong>12-20 set (Optimal)</strong> önerilir.
        </div>
      )}

      {/* List of Muscles */}
      {mode === 'weekly' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {visibleWeekly.map((item) => {
            const pct = Math.min(100, Math.round((item.weeklySets / 20) * 100));
            return (
              <div key={item.muscle}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12,
                    marginBottom: 4
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <AnatomyIcon muscle={item.muscle} size={16} />
                    <span style={{ fontWeight: 600, color: '#ffffff' }}>{item.muscleName}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: 4,
                        background: `${item.landmarkColor}18`,
                        color: item.landmarkColor
                      }}
                    >
                      {item.landmarkLabel}
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: '#ffffff', minWidth: 38, textAlign: 'right' }}>
                      {item.weeklySets} set
                    </span>
                  </div>
                </div>

                <div className="progress-bar-track" style={{ height: 5 }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${item.weeklySets > 0 ? Math.max(6, pct) : 0}%`,
                      background: item.landmarkColor
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {visibleTonnage.map((item) => {
            const pct = Math.round((item.volume / maxMuscleVol) * 100);
            return (
              <div key={item.muscle}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12,
                    marginBottom: 4
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <AnatomyIcon muscle={item.muscle} size={16} />
                    <span style={{ fontWeight: 600, color: '#ffffff' }}>{item.label}</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 11.5 }}>
                    {item.volume.toLocaleString()} kg
                  </span>
                </div>

                <div className="progress-bar-track" style={{ height: 5 }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: item.volume > 0 ? 'linear-gradient(90deg, #0284c7, #38bdf8)' : 'transparent'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expand / Collapse Toggle */}
      <button
        type="button"
        onClick={() => {
          sounds.playPop();
          setExpanded((p) => !p);
        }}
        style={{
          width: '100%',
          marginTop: 10,
          padding: '6px 0 2px',
          background: 'none',
          border: 'none',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          color: 'var(--text-muted)',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4
        }}
      >
        <span>{expanded ? 'Daha Az Göster' : 'Tüm Kas Bölgelerini Gör (10)'}</span>
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
    </div>
  );
};
