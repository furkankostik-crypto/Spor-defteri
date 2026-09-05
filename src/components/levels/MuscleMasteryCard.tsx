import React, { useState, useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { calculateMuscleLevels } from '../../utils/calculations';
import { AnatomyIcon } from '../../data/anatomyIcons';
import { muscleMetadata } from '../../data/muscleMetadata';
import { sounds } from '../../utils/audio';
import { 
  Dumbbell, 
  Info, 
  Sparkles, 
  SlidersHorizontal 
} from 'lucide-react';

export const MuscleMasteryCard: React.FC = () => {
  const { workouts, allExercises } = useWorkout();
  const [showInfo, setShowInfo] = useState(false);
  const [sortBy, setSortBy] = useState<'level' | 'volume' | 'default'>('level');

  const muscleLevels = useMemo(() => {
    return calculateMuscleLevels(workouts, allExercises);
  }, [workouts, allExercises]);

  const sortedMuscles = useMemo(() => {
    const list = [...muscleLevels];
    if (sortBy === 'level') {
      return list.sort((a, b) => b.level - a.level || b.currentEXP - a.currentEXP);
    }
    if (sortBy === 'volume') {
      return list.sort((a, b) => b.totalVolumeKg - a.totalVolumeKg);
    }
    return list;
  }, [muscleLevels, sortBy]);

  return (
    <div className="card" style={{ padding: '16px', marginBottom: 16 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.2))',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold)'
            }}
          >
            <Dumbbell size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Bölgesel Kas Seviyeleri (Mastery)
              </h3>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: 'var(--cyan)',
                  padding: '1px 5px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}
              >
                BİLİMSEL ORANSAL EXP
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Çoklu kas uyarım oranlarına göre bağımsız bölge seviyeleri
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setShowInfo(!showInfo);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 600,
            padding: '4px'
          }}
        >
          <Info size={14} />
          <span>{showInfo ? 'Kapat' : 'Nasıl?'}</span>
        </button>
      </div>

      {/* Info Accordion */}
      {showInfo && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: 14,
            fontSize: 11.5,
            color: 'var(--text-muted)',
            lineHeight: 1.55
          }}
        >
          <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Sparkles size={14} color="var(--gold)" />
            <span>Bilimsel Oransal Seviye Sistemi:</span>
          </div>
          <div>
            • <strong>Çoklu Kas Dağılımı:</strong> Bench Press yaptığınızda tonaj sadece göğüse yazılmaz; <strong>%65 Göğüs</strong>, <strong>%25 Triceps</strong> ve <strong>%10 Ön Omuz</strong> oranında parçalanır.
          </div>
          <div style={{ marginTop: 3 }}>
            • <strong>Bağımsız Level İlerlemesi:</strong> Her kas grubu kendine aktarılan deneyim puanı (EXP) ile kendi seviyesini (Lv. 1 - 1000) ve unvanını kazanır.
          </div>
          <div style={{ marginTop: 3 }}>
            • <strong>Hipertrofi Adaleti:</strong> İzole arka kol çalışmasanız bile ağır preslerden kazandığınız triceps gücünüz ve seviyeniz şeffaf şekilde takip edilir.
          </div>
        </div>
      )}

      {/* Sort Selector Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          10 Ana Kas Grubu İlerlemesi
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <SlidersHorizontal size={13} color="var(--text-dim)" />
          <select
            value={sortBy}
            onChange={(e) => {
              sounds.playPop();
              setSortBy(e.target.value as any);
            }}
            className="form-input"
            style={{
              padding: '3px 8px',
              fontSize: 11,
              background: 'var(--input-bg)',
              width: 'auto'
            }}
          >
            <option value="level">Seviyeye Göre (En Yüksek)</option>
            <option value="volume">Hacme Göre (Tonaj)</option>
            <option value="default">Anatomik Sıra</option>
          </select>
        </div>
      </div>

      {/* Muscle List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {sortedMuscles.map((item) => {
          const meta = muscleMetadata[item.muscle] || muscleMetadata.chest;
          const hasEXP = item.currentEXP > 0;

          return (
            <div
              key={item.muscle}
              style={{
                background: hasEXP ? 'rgba(15, 23, 42, 0.6)' : 'rgba(15, 23, 42, 0.25)',
                border: `1px solid ${hasEXP ? `${meta.color}35` : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                transition: 'all 0.2s',
                boxShadow: hasEXP ? `0 2px 10px ${meta.color}08` : 'none'
              }}
            >
              {/* Row 1: Icon, Name, Level Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: `1px solid ${meta.color}50`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <AnatomyIcon muscle={item.muscle} size={22} />
                  </div>

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span>{item.name}</span>
                      <span style={{ fontSize: 11 }}>{meta.icon}</span>
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>
                      {item.totalVolumeKg.toLocaleString()} kg • {item.totalEffectiveSets} Efektif Set
                    </div>
                  </div>
                </div>

                {/* Level & Rank Emblem */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12 }}>{item.rankBadge}</span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: hasEXP ? meta.color : 'var(--text-dim)',
                        fontFamily: 'Outfit'
                      }}
                    >
                      Lv. {item.level}
                    </span>
                  </div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)' }}>
                    {item.rankTitle}
                  </div>
                </div>
              </div>

              {/* Row 2: EXP Progress Bar */}
              <div className="progress-bar-track" style={{ height: 6, margin: '6px 0 4px' }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.max(hasEXP ? 4 : 0, item.progressPercent)}%`,
                    background: hasEXP 
                      ? `linear-gradient(90deg, ${meta.color}, ${meta.glowColor || meta.color})` 
                      : 'transparent'
                  }}
                />
              </div>

              {/* Row 3: Progress text */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)' }}>
                <span>
                  %{item.progressPercent} (Sonraki: {item.nextLevelEXP.toLocaleString()} EXP)
                </span>
                <span style={{ fontWeight: 700, color: hasEXP ? 'var(--text-muted)' : 'var(--text-dim)' }}>
                  {item.currentEXP.toLocaleString()} Toplam EXP
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
