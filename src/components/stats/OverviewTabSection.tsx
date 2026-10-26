import React, { useState, useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import {
  calculateProportionalMuscleVolume,
  isDurationExercise,
  isSetValid
} from '../../utils/calculations';
import {
  calculateWeeklyVolumeLandmarks
} from '../../utils/scientificCalculations';
import {
  getTodayLocalDate,
  shiftDateByDays,
  getWeekBounds,
  parseLocalDate,
  TURKISH_MONTHS_SHORT
} from '../../utils/dateUtils';
import { FRONT_PATHS, BACK_PATHS } from '../../data/bodyMapPaths';
import { AnatomyIcon } from '../../data/anatomyIcons';
import { ExerciseDefinition, MuscleGroup } from '../../types/workout';
import { sounds } from '../../utils/audio';
import {
  Flame,
  BarChart3,
  Activity,
  ChevronRight,
  Calendar
} from 'lucide-react';

interface OverviewTabSectionProps {
  onSelectExercise?: (ex: ExerciseDefinition) => void;
  onNavigateTab: (tab: 'body' | 'levels', openEntry?: boolean) => void;
}

export const OverviewTabSection: React.FC<OverviewTabSectionProps> = ({
  onNavigateTab
}) => {
  const { overallStats, workouts, allExercises } = useWorkout();

  const [weeklyChartMode, setWeeklyChartMode] = useState<'volume' | 'sets' | 'sessions'>('volume');
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number>(7);
  const [muscleViewMode, setMuscleViewMode] = useState<'bars' | 'schematic'>('bars');
  const [selectedMapMuscle, setSelectedMapMuscle] = useState<MuscleGroup | null>(null);

  const todayStr = getTodayLocalDate();

  // 1. Last 28 Days Consistency Matrix
  const last28Days = useMemo(() => {
    const workoutByDate = new Map<string, { sets: number; volume: number }>();
    workouts.forEach((w) => {
      let sets = 0;
      let vol = 0;
      w.exercises.forEach((ex) => {
        const isDur = isDurationExercise(ex.id);
        if (ex.detailedSets && ex.detailedSets.length > 0) {
          ex.detailedSets.forEach((s) => {
            if (isSetValid(s, isDur)) {
              sets++;
              if (!isDur) vol += s.weight * (s.reps || 5);
            }
          });
        } else if (ex.sets && ex.sets.length > 0) {
          ex.sets.forEach((wgt) => {
            if (wgt > 0) {
              sets++;
              if (!isDur) vol += wgt * 5;
            }
          });
        }
      });
      const prev = workoutByDate.get(w.date) || { sets: 0, volume: 0 };
      workoutByDate.set(w.date, { sets: prev.sets + sets, volume: prev.volume + vol });
    });

    const days: { date: string; sets: number; volume: number; isToday: boolean }[] = [];
    for (let i = 27; i >= 0; i--) {
      const dStr = shiftDateByDays(todayStr, -i);
      const entry = workoutByDate.get(dStr);
      days.push({
        date: dStr,
        sets: entry?.sets || 0,
        volume: entry?.volume || 0,
        isToday: i === 0
      });
    }
    return days;
  }, [workouts, todayStr]);

  const activeDaysIn28 = useMemo(
    () => last28Days.filter((d) => d.sets > 0).length,
    [last28Days]
  );

  // 2. Last 8 Weeks Progression Data
  const weeklySeries = useMemo(() => {
    const currentMonday = getWeekBounds(todayStr).start;
    const weeks: {
      start: string;
      end: string;
      shortLabel: string;
      rangeText: string;
      volumeKg: number;
      sets: number;
      sessions: number;
    }[] = [];

    for (let i = 7; i >= 0; i--) {
      const wStart = shiftDateByDays(currentMonday, -i * 7);
      const wEnd = shiftDateByDays(wStart, 6);
      const d1 = parseLocalDate(wStart);
      const d2 = parseLocalDate(wEnd);
      const shortLabel = i === 0 ? 'Bu Hf' : `${d1.getDate()}/${d1.getMonth() + 1}`;
      const rangeText = `${d1.getDate()} ${TURKISH_MONTHS_SHORT[d1.getMonth()]} – ${d2.getDate()} ${TURKISH_MONTHS_SHORT[d2.getMonth()]}`;

      let volumeKg = 0;
      let sets = 0;
      let sessions = 0;

      workouts.forEach((w) => {
        if (w.date >= wStart && w.date <= wEnd) {
          sessions++;
          w.exercises.forEach((ex) => {
            const isDur = isDurationExercise(ex.id);
            if (ex.detailedSets && ex.detailedSets.length > 0) {
              ex.detailedSets.forEach((s) => {
                if (isSetValid(s, isDur)) {
                  sets++;
                  if (!isDur) volumeKg += s.weight * (s.reps || 5);
                }
              });
            } else if (ex.sets && ex.sets.length > 0) {
              ex.sets.forEach((wgt) => {
                if (wgt > 0) {
                  sets++;
                  if (!isDur) volumeKg += wgt * 5;
                }
              });
            }
          });
        }
      });

      weeks.push({
        start: wStart,
        end: wEnd,
        shortLabel,
        rangeText,
        volumeKg: Math.round(volumeKg),
        sets,
        sessions
      });
    }

    return weeks;
  }, [workouts, todayStr]);

  const selectedWeek = weeklySeries[selectedWeekIdx] || weeklySeries[weeklySeries.length - 1];

  // 3. Muscle Volume & Weekly Hypertrophy Statuses
  const volumeStatuses = useMemo(
    () => calculateWeeklyVolumeLandmarks(workouts, allExercises),
    [workouts, allExercises]
  );

  const muscleVolume = useMemo(
    () => calculateProportionalMuscleVolume(workouts, allExercises),
    [workouts, allExercises]
  );

  const volumeStatusMap = useMemo(() => {
    const m: Partial<Record<MuscleGroup, (typeof volumeStatuses)[0]>> = {};
    volumeStatuses.forEach((v) => {
      m[v.muscle] = v;
    });
    return m;
  }, [volumeStatuses]);

  // 5 Major Functional Regions for Intuitive Balance Overview
  const regionBalances = useMemo(() => {
    const getSets = (m: MuscleGroup) => volumeStatusMap[m]?.weeklySets || 0;
    const regions = [
      {
        id: 'chest',
        label: 'Göğüs',
        color: '#ff4757',
        sets: getSets('chest'),
        target: 12
      },
      {
        id: 'back',
        label: 'Sırt',
        color: '#38bdf8',
        sets: getSets('back'),
        target: 12
      },
      {
        id: 'shoulder',
        label: 'Omuz',
        color: '#f59e0b',
        sets: getSets('shoulder'),
        target: 10
      },
      {
        id: 'arms',
        label: 'Kollar',
        color: '#a855f7',
        sets: Math.round(((getSets('biceps') + getSets('triceps')) / 1.5) * 10) / 10,
        target: 12
      },
      {
        id: 'legs',
        label: 'Bacak',
        color: '#10b981',
        sets: Math.round((getSets('quads') + getSets('hamstring') + getSets('glutes') + getSets('calves')) * 10) / 10,
        target: 14
      }
    ];
    return regions.map((r) => ({
      ...r,
      pct: Math.min(100, Math.round((r.sets / r.target) * 100))
    }));
  }, [volumeStatusMap]);

  const selectedMuscleStatus = selectedMapMuscle ? volumeStatusMap[selectedMapMuscle] : null;
  const selectedMuscleTonnage = selectedMapMuscle ? muscleVolume[selectedMapMuscle] || 0 : 0;

  const getMapMuscleStyle = (muscle: MuscleGroup) => {
    const st = volumeStatusMap[muscle];
    const sets = st?.weeklySets || 0;
    const isSelected = selectedMapMuscle === muscle;

    if (sets === 0) {
      return {
        fill: isSelected ? '#38bdf8' : '#1e293b',
        fillOpacity: isSelected ? 0.85 : 0.75,
        stroke: isSelected ? '#ffffff' : '#334155'
      };
    }
    const color = st?.landmarkColor || '#10b981';
    return {
      fill: color,
      fillOpacity: isSelected ? 0.98 : 0.85,
      stroke: isSelected ? '#ffffff' : color
    };
  };

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

  const renderHeatMuscle = (source: Record<string, string[]>, muscle: MuscleGroup, prefix: string) => {
    const paths = source[muscle] || [];
    const st = getMapMuscleStyle(muscle);
    const isSelected = selectedMapMuscle === muscle;
    return (
      <g
        key={`${prefix}-hm-${muscle}`}
        onClick={() => {
          sounds.playPop();
          setSelectedMapMuscle((prev) => (prev === muscle ? null : muscle));
        }}
        style={{ cursor: 'pointer' }}
      >
        {paths.map((d, idx) => (
          <path
            key={`${prefix}-hp-${muscle}-${idx}`}
            d={d}
            fill={st.fill}
            fillOpacity={st.fillOpacity}
            stroke={st.stroke}
            strokeWidth={isSelected ? '2.2' : '1.3'}
            strokeLinejoin="round"
          />
        ))}
      </g>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeIn 0.2s ease-out' }}>
      {/* 1. SPORCU SEVİYE KOKPİTİ & 28 GÜNLÜK TUTARLILIK */}
      <div
        className="card"
        style={{
          padding: '15px',
          marginBottom: 0,
          background: 'linear-gradient(145deg, rgba(22, 32, 50, 0.92), rgba(12, 17, 28, 0.96))',
          border: '1px solid rgba(56, 189, 248, 0.22)'
        }}
      >
        {/* Top Row: Radial Level Gauge + Rank Title */}
        <div
          onClick={() => onNavigateTab('levels')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 12,
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{ position: 'relative', width: 54, height: 54, flexShrink: 0 }}>
              <svg viewBox="0 0 54 54" style={{ width: 54, height: 54, transform: 'rotate(-90deg)' }}>
                <circle
                  cx="27"
                  cy="27"
                  r="23"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="4.5"
                />
                <circle
                  cx="27"
                  cy="27"
                  r="23"
                  fill="none"
                  stroke="var(--muscle-emerald)"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 23}
                  strokeDashoffset={
                    2 * Math.PI * 23 * (1 - Math.max(0.05, overallStats.rankProgressPct / 100))
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
                <span style={{ fontSize: 8.5, fontWeight: 800, color: 'var(--text-muted)' }}>LV</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit' }}>
                  {overallStats.overallLevel}
                </span>
              </div>
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: 'var(--muscle-emerald)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Karakter Seviyesi
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#ffffff' }}>
                {overallStats.rankTitle}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {overallStats.totalEXP.toLocaleString()} EXP • Sonraki Seviye %{overallStats.rankProgressPct}
              </div>
            </div>
          </div>

          <ChevronRight size={18} color="var(--text-dim)" />
        </div>

        {/* 3 Ferah Özet Kutusu */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            marginBottom: 12
          }}
        >
          <div
            style={{
              background: 'rgba(11, 15, 23, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 'var(--radius-md)',
              padding: '9px 8px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Toplam Hacim</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--gold)', fontFamily: 'Outfit', marginTop: 2 }}>
              {(overallStats.totalVolumeKg / 1000).toFixed(2)}{' '}
              <span style={{ fontSize: 10.5, fontWeight: 600 }}>Ton</span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(11, 15, 23, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 'var(--radius-md)',
              padding: '9px 8px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Toplam Set</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--cyan)', fontFamily: 'Outfit', marginTop: 2 }}>
              {overallStats.totalSetsCount}{' '}
              <span style={{ fontSize: 10.5, fontWeight: 600 }}>({overallStats.totalWorkouts} İdman)</span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(11, 15, 23, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 'var(--radius-md)',
              padding: '9px 8px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Aktif Seri</div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 900,
                color: overallStats.activeStreak > 0 ? 'var(--accent)' : '#ffffff',
                fontFamily: 'Outfit',
                marginTop: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3
              }}
            >
              <Flame size={14} color="var(--accent)" />
              <span>{overallStats.activeStreak} Gün</span>
            </div>
          </div>
        </div>

        {/* 28-Day Consistency Heatmap Strip */}
        <div
          style={{
            background: 'rgba(11, 15, 23, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 'var(--radius-md)',
            padding: '9px 11px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
              fontSize: 11
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={12} color="var(--cyan)" />
              <span>Son 28 Gün Antrenman Düzeni</span>
            </span>
            <span style={{ fontWeight: 800, color: activeDaysIn28 > 0 ? 'var(--muscle-emerald)' : 'var(--text-dim)' }}>
              {activeDaysIn28} Aktif Gün
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(14, 1fr)',
              gap: 4
            }}
          >
            {last28Days.map((d) => {
              const active = d.sets > 0;
              const highIntensity = d.sets >= 12;
              return (
                <div
                  key={d.date}
                  title={`${d.date}: ${d.sets} Set`}
                  style={{
                    height: 12,
                    borderRadius: 3,
                    background: active
                      ? highIntensity
                        ? 'linear-gradient(135deg, #10b981, #34d399)'
                        : 'rgba(16, 185, 129, 0.55)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: d.isToday
                      ? '1.5px solid var(--cyan)'
                      : active
                      ? '1px solid rgba(52, 211, 153, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.04)'
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. HAFTALIK HACİM & ANTRENMAN GRAFİĞİ (Son 8 Hafta) */}
      <div className="card" style={{ padding: '14px', marginBottom: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <BarChart3 size={16} color="var(--cyan)" />
            <h3 style={{ fontSize: 14.5, fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Haftalık Antrenman Grafiği
            </h3>
          </div>

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
            {[
              { id: 'volume', label: 'Tonaj' },
              { id: 'sets', label: 'Set' },
              { id: 'sessions', label: 'İdman' }
            ].map((m) => {
              const active = weeklyChartMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setWeeklyChartMode(m.id as any);
                  }}
                  style={{
                    padding: '5px 9px',
                    borderRadius: 6,
                    border: 'none',
                    background: active ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                    color: active ? 'var(--cyan)' : 'var(--text-muted)',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Seçili Hafta Özeti */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(11, 15, 23, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 10px',
            marginBottom: 10,
            fontSize: 11.5
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
              {selectedWeek.rangeText}:
            </span>{' '}
            <strong style={{ color: '#ffffff' }}>
              {selectedWeek.sessions} İdman • {selectedWeek.sets} Set
            </strong>
          </div>
          <div style={{ fontWeight: 900, color: 'var(--cyan)', fontFamily: 'Outfit', fontSize: 13.5 }}>
            {selectedWeek.volumeKg >= 1000
              ? `${(selectedWeek.volumeKg / 1000).toFixed(2)} Ton`
              : `${selectedWeek.volumeKg} kg`}
          </div>
        </div>

        {(() => {
          const values = weeklySeries.map((w) =>
            weeklyChartMode === 'volume'
              ? w.volumeKg
              : weeklyChartMode === 'sets'
              ? w.sets
              : w.sessions
          );
          const maxV = Math.max(...values, 1);

          return (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: 6,
                alignItems: 'end',
                height: 112,
                paddingTop: 16
              }}
            >
              {weeklySeries.map((wk, idx) => {
                const val = values[idx];
                const heightPct = val > 0 ? Math.max(14, Math.round((val / maxV) * 100)) : 6;
                const isSelected = idx === selectedWeekIdx;
                const displayVal =
                  weeklyChartMode === 'volume'
                    ? val >= 1000
                      ? `${(val / 1000).toFixed(1)}t`
                      : val > 0
                      ? `${val}`
                      : '0'
                    : String(val);

                return (
                  <button
                    key={wk.start}
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setSelectedWeekIdx(idx);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      cursor: 'pointer',
                      gap: 4
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: isSelected ? '#ffffff' : val > 0 ? 'var(--text-muted)' : 'var(--text-dim)',
                        fontFamily: 'Outfit'
                      }}
                    >
                      {displayVal}
                    </span>

                    <div
                      style={{
                        width: '100%',
                        maxWidth: 30,
                        height: `${heightPct}%`,
                        borderRadius: '6px 6px 4px 4px',
                        background: isSelected
                          ? 'linear-gradient(180deg, #38bdf8, #0284c7)'
                          : val > 0
                          ? 'linear-gradient(180deg, rgba(56, 189, 248, 0.45), rgba(56, 189, 248, 0.15))'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: isSelected
                          ? '1px solid #7dd3fc'
                          : val > 0
                          ? '1px solid rgba(56, 189, 248, 0.3)'
                          : '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    />

                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: isSelected ? 800 : 600,
                        color: isSelected ? 'var(--cyan)' : 'var(--text-dim)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {wk.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* 3. HAFTALIK KAS DENGESİ & BÖLGESEL HACİM */}
      <div className="card" style={{ padding: '14px', marginBottom: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
            gap: 8
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Activity size={16} color="var(--muscle-emerald)" />
            <h3 style={{ fontSize: 14.5, fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Haftalık Kas Dengesi
            </h3>
          </div>

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
                setMuscleViewMode('bars');
              }}
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                border: 'none',
                background: muscleViewMode === 'bars' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: muscleViewMode === 'bars' ? 'var(--cyan)' : 'var(--text-muted)',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Bölge Listesi
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setMuscleViewMode('schematic');
              }}
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                border: 'none',
                background: muscleViewMode === 'schematic' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: muscleViewMode === 'schematic' ? 'var(--muscle-emerald)' : 'var(--text-muted)',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Isı Haritası
            </button>
          </div>
        </div>

        {/* 5 Ana Bölge Haftalık Denge Göstergesi (Göğüs, Sırt, Omuz, Kollar, Bacak) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 6,
            marginBottom: 12
          }}
        >
          {regionBalances.map((r) => (
            <div
              key={r.id}
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '7px 6px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>{r.label}</div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit', margin: '2px 0 4px' }}>
                {r.sets} <span style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 600 }}>set</span>
              </div>
              <div className="progress-bar-track" style={{ height: 4 }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${r.sets > 0 ? Math.max(12, r.pct) : 0}%`,
                    background: r.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {muscleViewMode === 'schematic' ? (
          <div>
            {/* Tam Genişlikte Ferah Ön ve Arka Vücut Haritası */}
            <div
              style={{
                background: 'radial-gradient(circle at 50% 45%, rgba(16, 185, 129, 0.08) 0%, rgba(11, 15, 23, 0.65) 75%)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 8px 6px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                alignItems: 'center',
                justifyItems: 'center'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <svg viewBox="35 16 250 488" style={{ width: '100%', height: 152, display: 'block' }}>
                  {renderBaseParts(FRONT_PATHS, ['head', 'neck', 'forearms', 'hands', 'pelvis', 'knees', 'feet'], 'ov-f')}
                  {renderHeatMuscle(FRONT_PATHS, 'shoulder', 'ov-f')}
                  {renderHeatMuscle(FRONT_PATHS, 'chest', 'ov-f')}
                  {renderHeatMuscle(FRONT_PATHS, 'biceps', 'ov-f')}
                  {renderHeatMuscle(FRONT_PATHS, 'abs', 'ov-f')}
                  {renderHeatMuscle(FRONT_PATHS, 'quads', 'ov-f')}
                  {renderHeatMuscle(FRONT_PATHS, 'calves', 'ov-f')}
                </svg>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', marginTop: 2 }}>ÖN GÖRÜNÜM</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <svg viewBox="35 16 250 488" style={{ width: '100%', height: 152, display: 'block' }}>
                  {renderBaseParts(BACK_PATHS, ['head', 'forearms', 'hands', 'feet'], 'ov-b')}
                  {renderHeatMuscle(BACK_PATHS, 'shoulder', 'ov-b')}
                  {renderHeatMuscle(BACK_PATHS, 'back', 'ov-b')}
                  {renderHeatMuscle(BACK_PATHS, 'triceps', 'ov-b')}
                  {renderHeatMuscle(BACK_PATHS, 'glutes', 'ov-b')}
                  {renderHeatMuscle(BACK_PATHS, 'hamstring', 'ov-b')}
                  {renderHeatMuscle(BACK_PATHS, 'calves', 'ov-b')}
                </svg>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', marginTop: 2 }}>ARKA GÖRÜNÜM</span>
              </div>
            </div>

            {selectedMuscleStatus && selectedMapMuscle && (
              <div
                style={{
                  marginTop: 10,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: `1px solid ${selectedMuscleStatus.landmarkColor}55`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <AnatomyIcon muscle={selectedMapMuscle} size={22} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>
                      {selectedMuscleStatus.muscleName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {selectedMuscleStatus.feedback}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: selectedMuscleStatus.landmarkColor, fontFamily: 'Outfit' }}>
                    {selectedMuscleStatus.weeklySets} Set
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700 }}>
                    {selectedMuscleTonnage.toLocaleString()} kg
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 10 Bölge Kompakt 2 Sütunlu Liste */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 12px' }}>
            {volumeStatuses.map((item) => {
              const pct = Math.min(100, Math.round((item.weeklySets / 16) * 100));
              return (
                <div key={item.muscle}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 11.5,
                      marginBottom: 4
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <AnatomyIcon muscle={item.muscle} size={16} />
                      <span
                        style={{
                          fontWeight: 700,
                          color: '#ffffff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item.muscleName.split(' ')[0]}
                      </span>
                    </div>
                    <span style={{ fontWeight: 800, color: item.landmarkColor, fontSize: 11.5, flexShrink: 0 }}>
                      {item.weeklySets} set
                    </span>
                  </div>

                  <div className="progress-bar-track" style={{ height: 4 }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${pct > 0 ? Math.max(8, pct) : 0}%`,
                        background: item.landmarkColor
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
