import React, { useState, useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import {
  calculateExerciseLevelInfo,
  calculateMuscleLevels,
  isDurationExercise
} from '../../utils/calculations';
import {
  calculateOverallGymLevels,
  getExerciseStrengthAnalysis
} from '../../utils/scientificCalculations';
import {
  strengthTierConfigs,
  STRENGTH_TIER_ORDER
} from '../../data/strengthStandards';
import { FRONT_PATHS, BACK_PATHS } from '../../data/bodyMapPaths';
import { AnatomyIcon } from '../../data/anatomyIcons';
import { muscleMetadata } from '../../data/muscleMetadata';
import { ExerciseVisual } from '../workout/ExerciseVisual';
import { ExerciseDefinition, MuscleGroup } from '../../types/workout';
import { sounds } from '../../utils/audio';
import {
  Trophy,
  Dumbbell,
  Search,
  ChevronRight
} from 'lucide-react';

interface StrengthLevelsSectionProps {
  onSelectExercise: (ex: ExerciseDefinition) => void;
}

export const StrengthLevelsSection: React.FC<StrengthLevelsSectionProps> = ({
  onSelectExercise
}) => {
  const { overallStats, workouts, allExercises, profile } = useWorkout();

  const [subView, setSubView] = useState<'exercises' | 'muscles'>('exercises');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'logged' | 'upper' | 'lower' | 'core'>('all');
  const [sortBy, setSortBy] = useState<'score' | '1rm' | 'level' | 'name'>('score');
  const [selectedAnatomyMuscle, setSelectedAnatomyMuscle] = useState<MuscleGroup | null>(null);

  const gymLevels = useMemo(
    () => calculateOverallGymLevels(workouts, allExercises, profile),
    [workouts, allExercises, profile]
  );

  const exerciseDataList = useMemo(() => {
    return allExercises.map((ex) => {
      const info = calculateExerciseLevelInfo(ex, workouts);
      const strength = getExerciseStrengthAnalysis(ex, workouts, profile);
      const isDuration = isDurationExercise(ex);
      return {
        exercise: ex,
        info,
        strength,
        isDuration,
        hasLogged: strength.estimated1RM > 0
      };
    });
  }, [allExercises, workouts, profile]);

  const loggedCount = useMemo(
    () => exerciseDataList.filter((d) => d.hasLogged).length,
    [exerciseDataList]
  );

  const filteredAndSortedExercises = useMemo(() => {
    const filtered = exerciseDataList.filter((item) => {
      const matchesSearch = item.exercise.name.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (filterCategory === 'logged') return item.hasLogged;
      if (filterCategory === 'all') return true;
      return item.exercise.category === filterCategory;
    });

    return filtered.sort((a, b) => {
      if (sortBy !== 'name' && a.hasLogged !== b.hasLogged) {
        return a.hasLogged ? -1 : 1;
      }
      if (sortBy === 'score') {
        return b.strength.strengthScore - a.strength.strengthScore || b.info.totalEXP - a.info.totalEXP;
      }
      if (sortBy === '1rm') {
        return b.strength.estimated1RM - a.strength.estimated1RM;
      }
      if (sortBy === 'level') {
        return b.info.currentLevel - a.info.currentLevel || b.info.totalEXP - a.info.totalEXP;
      }
      return a.exercise.name.localeCompare(b.exercise.name, 'tr');
    });
  }, [exerciseDataList, search, filterCategory, sortBy]);

  const muscleLevels = useMemo(
    () => calculateMuscleLevels(workouts, allExercises),
    [workouts, allExercises]
  );

  const sortedMuscles = useMemo(() => {
    return [...muscleLevels].sort(
      (a, b) => b.level - a.level || b.currentEXP - a.currentEXP
    );
  }, [muscleLevels]);

  const muscleLevelMap = useMemo(() => {
    const m: Partial<Record<MuscleGroup, (typeof muscleLevels)[0]>> = {};
    muscleLevels.forEach((ml) => {
      m[ml.muscle] = ml;
    });
    return m;
  }, [muscleLevels]);

  const maxMuscleLevel = useMemo(
    () => Math.max(...muscleLevels.map((m) => m.level), 2),
    [muscleLevels]
  );

  const renderBaseParts = (source: Record<string, string[]>, keys: string[], prefix: string) =>
    keys.map((key) =>
      (source[key] || []).map((d, idx) => (
        <path
          key={`${prefix}-${key}-${idx}`}
          d={d}
          fill="#131c2e"
          stroke="#26354d"
          strokeWidth="1.2"
        />
      ))
    );

  const renderMasteryMuscle = (source: Record<string, string[]>, muscle: MuscleGroup, prefix: string) => {
    const paths = source[muscle] || [];
    const ml = muscleLevelMap[muscle];
    const meta = muscleMetadata[muscle];
    const hasExp = (ml?.currentEXP || 0) > 0;
    const isSelected = selectedAnatomyMuscle === muscle;
    const opacity = isSelected
      ? 1
      : hasExp
      ? Math.min(0.95, 0.45 + ((ml?.level || 1) / maxMuscleLevel) * 0.5)
      : 0.7;

    return (
      <g
        key={`${prefix}-mm-${muscle}`}
        onClick={() => {
          sounds.playPop();
          setSelectedAnatomyMuscle((prev) => (prev === muscle ? null : muscle));
        }}
        style={{ cursor: 'pointer' }}
      >
        {paths.map((d, idx) => (
          <path
            key={`${prefix}-mp-${muscle}-${idx}`}
            d={d}
            fill={hasExp ? meta?.color || '#38bdf8' : '#1e293b'}
            fillOpacity={opacity}
            stroke={isSelected ? '#ffffff' : hasExp ? meta?.color || '#38bdf8' : '#334155'}
            strokeWidth={isSelected ? '2.2' : '1.3'}
            strokeLinejoin="round"
          />
        ))}
      </g>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeIn 0.2s ease-out' }}>
      {/* 1. GENEL GÜÇ KLASMANI KARTI (Sıfır Taşma, Ferah Tasarım) */}
      <div
        className="card"
        style={{
          padding: '15px',
          marginBottom: 0,
          background: 'linear-gradient(145deg, rgba(22, 32, 50, 0.95), rgba(12, 17, 28, 0.98))',
          border: `1px solid ${gymLevels.overallTierColor}40`,
          boxShadow: `0 10px 26px rgba(0, 0, 0, 0.4), 0 0 20px ${gymLevels.overallTierColor}12`
        }}
      >
        {/* Top Row: Rank Title + Radial Strength Score Gauge */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
              <span style={{ fontSize: 13 }}>{gymLevels.overallTierBadge}</span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: gymLevels.overallTierColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Genel Güç Klasmanı
              </span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
              {gymLevels.overallTierTitle}
            </h2>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
              Karakter: <strong style={{ color: '#ffffff' }}>Lv. {overallStats.overallLevel}</strong> ({overallStats.rankTitle})
            </div>
          </div>

          {/* Radial Strength Score Gauge (0-100) */}
          <div style={{ position: 'relative', width: 62, height: 62, flexShrink: 0 }}>
            <svg viewBox="0 0 62 62" style={{ width: 62, height: 62, transform: 'rotate(-90deg)' }}>
              <circle
                cx="31"
                cy="31"
                r="26"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="5"
              />
              <circle
                cx="31"
                cy="31"
                r="26"
                fill="none"
                stroke={gymLevels.overallTierColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={
                  2 * Math.PI * 26 * (1 - Math.max(0.04, gymLevels.overallStrengthScore / 100))
                }
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1
              }}
            >
              <span style={{ fontSize: 17, fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit' }}>
                {gymLevels.overallStrengthScore}
              </span>
              <span style={{ fontSize: 8, fontWeight: 800, color: 'var(--text-muted)', marginTop: 1 }}>
                SKOR
              </span>
            </div>
          </div>
        </div>

        {/* Kompakt 5-Kademe Klasman Barı */}
        <div style={{ marginBottom: gymLevels.strongestLift ? 10 : 0 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 4,
              marginBottom: 4
            }}
          >
            {STRENGTH_TIER_ORDER.map((tKey, idx) => {
              const cfg = strengthTierConfigs[tKey];
              const minScore = idx * 20;
              const isCurrent = gymLevels.overallTier === tKey;
              const isPassed = gymLevels.overallStrengthScore >= minScore;

              return (
                <div key={tKey} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      height: 5,
                      borderRadius: 999,
                      background: isCurrent || isPassed ? cfg.color : 'rgba(255, 255, 255, 0.08)',
                      opacity: isCurrent ? 1 : isPassed ? 0.65 : 1,
                      marginBottom: 4
                    }}
                  />
                  <div
                    style={{
                      fontSize: 9.5,
                      fontWeight: isCurrent ? 900 : 700,
                      color: isCurrent ? '#ffffff' : isPassed ? cfg.color : 'var(--text-dim)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cfg.badge} {cfg.title.split(' ')[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tam Genişlikli En Güçlü Hareket Satırı (İsim Kesilmez!) */}
        {gymLevels.strongestLift && (
          <div
            onClick={() => {
              const ex = allExercises.find((e) => e.id === gymLevels.strongestLift?.exerciseId);
              if (ex) {
                sounds.playPop();
                onSelectExercise(ex);
              }
            }}
            style={{
              background: 'rgba(11, 15, 23, 0.65)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 11px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
              <Trophy size={14} color="var(--gold)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)', flexShrink: 0 }}>En Güçlü:</span>
              <strong
                style={{
                  fontSize: 12.5,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {gymLevels.strongestLift.exerciseName}
              </strong>
            </div>
            <span className="badge badge-pr" style={{ fontSize: 11, flexShrink: 0 }}>
              1RM {gymLevels.strongestLift.estimated1RM} kg
            </span>
          </div>
        )}
      </div>

      {/* 2. ALT GÖRÜNÜM SEÇİCİ: Tek Satırda Net İki Büyük Buton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8
        }}
      >
        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setSubView('exercises');
          }}
          style={{
            minHeight: 46,
            padding: '8px 10px',
            borderRadius: 'var(--radius-md)',
            border: subView === 'exercises' ? '1.5px solid var(--gold)' : '1px solid var(--border)',
            background: subView === 'exercises' ? 'rgba(251, 191, 36, 0.14)' : 'var(--card-bg)',
            color: subView === 'exercises' ? '#ffffff' : 'var(--text-muted)',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            whiteSpace: 'nowrap'
          }}
        >
          <Trophy size={15} color="var(--gold)" />
          <span>Egzersizler ({loggedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setSubView('muscles');
          }}
          style={{
            minHeight: 46,
            padding: '8px 10px',
            borderRadius: 'var(--radius-md)',
            border: subView === 'muscles' ? '1.5px solid var(--cyan)' : '1px solid var(--border)',
            background: subView === 'muscles' ? 'rgba(56, 189, 248, 0.14)' : 'var(--card-bg)',
            color: subView === 'muscles' ? '#ffffff' : 'var(--text-muted)',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            whiteSpace: 'nowrap'
          }}
        >
          <Dumbbell size={15} color="var(--cyan)" />
          <span>Kas Bölgeleri (10)</span>
        </button>
      </div>

      {subView === 'exercises' ? (
        /* MOD A: MİNİMAL & İNTERAKTİF EGZERSİZ STANDARTLARI LİSTESİ */
        <div>
          {/* Satır 1: Arama Kutusu + Sıralama Seçici Yan Yana */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={15}
                color="var(--text-dim)"
                style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Hareket ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="form-input"
                style={{ paddingLeft: 32, height: 42, fontSize: 16 }}
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sıralama ölçütü"
              className="form-input"
              style={{
                padding: '0 10px',
                fontSize: 16,
                background: 'var(--input-bg)',
                width: 'auto',
                height: 42,
                fontWeight: 700
              }}
            >
              <option value="score">Güç Skoru</option>
              <option value="1rm">1RM Rekor</option>
              <option value="level">Seviye</option>
              <option value="name">İsim (A-Z)</option>
            </select>
          </div>

          {/* Satır 2: 5 Eşit Sütunlu Kategori Seçici (Yatay Scrollbar Yok, Kesilme Yok!) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 5,
              marginBottom: 12
            }}
          >
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'logged', label: 'Kayıtlı' },
              { id: 'upper', label: 'Üst' },
              { id: 'lower', label: 'Alt' },
              { id: 'core', label: 'Core' }
            ].map((cat) => {
              const active = filterCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setFilterCategory(cat.id as any);
                  }}
                  style={{
                    minHeight: 36,
                    padding: '6px 4px',
                    borderRadius: 'var(--radius-sm)',
                    border: active ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    background: active ? 'var(--accent-soft)' : 'var(--input-bg)',
                    color: active ? '#ffffff' : 'var(--text-muted)',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Kompakt Egzersiz Kartları (Dokununca Detay Analiz Modalı Açılır) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredAndSortedExercises.length > 0 ? (
              filteredAndSortedExercises.map(({ exercise, info, strength, isDuration, hasLogged }) => {
                const meta = muscleMetadata[exercise.muscle];
                const unit = isDuration ? 'sn' : 'kg';

                return (
                  <div
                    key={exercise.id}
                    onClick={() => {
                      sounds.playPop();
                      onSelectExercise(exercise);
                    }}
                    style={{
                      background: 'var(--card-bg)',
                      border: `1px solid ${hasLogged ? `${strength.tierColor}35` : 'var(--border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, border-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                        <ExerciseVisual exerciseId={exercise.id} muscle={exercise.muscle} size={40} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: 14,
                              color: '#ffffff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {exercise.name}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, fontSize: 11 }}>
                            <span style={{ color: meta?.color || 'var(--cyan)', fontWeight: 700 }}>
                              {meta?.name.split(' ')[0] || exercise.muscle}
                            </span>
                            <span style={{ color: 'var(--text-dim)' }}>•</span>
                            {hasLogged ? (
                              <span style={{ color: 'var(--text-muted)' }}>
                                {!isDuration && strength.bestSetWeight > 0
                                  ? `En İyi: ${strength.bestSetWeight}kg × ${strength.bestSetReps}`
                                  : `Lv.${info.currentLevel} (${info.totalSets} set)`}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Kayıt yok</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {hasLogged ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                fontSize: 15.5,
                                fontWeight: 900,
                                color: '#ffffff',
                                fontFamily: 'Outfit',
                                lineHeight: 1.1
                              }}
                            >
                              {strength.estimated1RM}{' '}
                              <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)' }}>
                                {unit}
                              </span>
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 800, color: strength.tierColor, marginTop: 2 }}>
                              {strength.tierBadge} {strength.tierTitle}
                            </div>
                          </div>
                          <ChevronRight size={16} color="var(--text-dim)" />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-dim)', fontSize: 11 }}>
                          <span>Detay</span>
                          <ChevronRight size={15} />
                        </div>
                      )}
                    </div>

                    {hasLogged && (
                      <div style={{ marginTop: 8 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 10,
                            color: 'var(--text-dim)',
                            marginBottom: 4
                          }}
                        >
                          <span>
                            Hedef: <strong style={{ color: 'var(--text-muted)' }}>{strength.nextTierTitle} ({strength.nextTierWeight} {unit})</strong>
                          </span>
                          <span style={{ fontWeight: 800, color: strength.tierColor }}>
                            Skor {strength.strengthScore} • %{strength.tierProgressPct}
                          </span>
                        </div>
                        <div className="progress-bar-track" style={{ height: 5 }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${strength.tierProgressPct}%`,
                              background: strength.tierGradient
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                Aramanıza uygun egzersiz bulunamadı.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MOD B: ANATOMİK KAS USTALIĞI HARİTASI & 10 KAS BÖLGESİ SEVİYELERİ */
        <div className="card" style={{ padding: '14px', marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <h3 style={{ fontSize: 14.5, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Anatomik Kas Ustalığı Haritası
              </h3>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Bölgeye dokunarak kas seviyesini filtreleyin
              </div>
            </div>
            {selectedAnatomyMuscle && (
              <button
                type="button"
                onClick={() => setSelectedAnatomyMuscle(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border)',
                  borderRadius: 999,
                  padding: '5px 10px',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Tümünü Göster
              </button>
            )}
          </div>

          <div
            style={{
              background: 'radial-gradient(circle at 50% 45%, rgba(56, 189, 248, 0.09) 0%, rgba(11, 15, 23, 0.65) 75%)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 8px 6px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 6,
              alignItems: 'center',
              justifyItems: 'center',
              marginBottom: 12
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <svg viewBox="35 16 250 488" style={{ width: '100%', height: 150, display: 'block' }}>
                {renderBaseParts(FRONT_PATHS, ['head', 'neck', 'forearms', 'hands', 'pelvis', 'knees', 'feet'], 'ms-f')}
                {renderMasteryMuscle(FRONT_PATHS, 'shoulder', 'ms-f')}
                {renderMasteryMuscle(FRONT_PATHS, 'chest', 'ms-f')}
                {renderMasteryMuscle(FRONT_PATHS, 'biceps', 'ms-f')}
                {renderMasteryMuscle(FRONT_PATHS, 'abs', 'ms-f')}
                {renderMasteryMuscle(FRONT_PATHS, 'quads', 'ms-f')}
                {renderMasteryMuscle(FRONT_PATHS, 'calves', 'ms-f')}
              </svg>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', marginTop: 2 }}>ÖN ANATOMİ</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <svg viewBox="35 16 250 488" style={{ width: '100%', height: 150, display: 'block' }}>
                {renderBaseParts(BACK_PATHS, ['head', 'forearms', 'hands', 'feet'], 'ms-b')}
                {renderMasteryMuscle(BACK_PATHS, 'shoulder', 'ms-b')}
                {renderMasteryMuscle(BACK_PATHS, 'back', 'ms-b')}
                {renderMasteryMuscle(BACK_PATHS, 'triceps', 'ms-b')}
                {renderMasteryMuscle(BACK_PATHS, 'glutes', 'ms-b')}
                {renderMasteryMuscle(BACK_PATHS, 'hamstring', 'ms-b')}
                {renderMasteryMuscle(BACK_PATHS, 'calves', 'ms-b')}
              </svg>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', marginTop: 2 }}>ARKA ANATOMİ</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedMuscles
              .filter((m) => !selectedAnatomyMuscle || m.muscle === selectedAnatomyMuscle)
              .map((item) => {
                const meta = muscleMetadata[item.muscle] || muscleMetadata.chest;
                const hasEXP = item.currentEXP > 0;

                return (
                  <div
                    key={item.muscle}
                    onClick={() => {
                      sounds.playPop();
                      setSelectedAnatomyMuscle((prev) => (prev === item.muscle ? null : item.muscle));
                    }}
                    style={{
                      background: hasEXP ? 'rgba(15, 23, 42, 0.65)' : 'rgba(15, 23, 42, 0.28)',
                      border: `1px solid ${
                        selectedAnatomyMuscle === item.muscle
                          ? meta.color
                          : hasEXP
                          ? `${meta.color}35`
                          : 'var(--border)'
                      }`,
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
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
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#ffffff' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>
                            {item.totalVolumeKg.toLocaleString()} kg • {item.totalEffectiveSets} Efektif Set
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 12 }}>{item.rankBadge}</span>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 900,
                              color: hasEXP ? meta.color : 'var(--text-dim)',
                              fontFamily: 'Outfit'
                            }}
                          >
                            Lv. {item.level}
                          </span>
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>
                          {item.rankTitle}
                        </div>
                      </div>
                    </div>

                    <div className="progress-bar-track" style={{ height: 5, marginBottom: 4 }}>
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.max(hasEXP ? 4 : 0, item.progressPercent)}%`,
                          background: hasEXP ? meta.color : 'transparent'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)' }}>
                      <span>Sonraki Seviye: %{item.progressPercent}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                        {item.currentEXP.toLocaleString()} / {item.nextLevelEXP.toLocaleString()} EXP
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
