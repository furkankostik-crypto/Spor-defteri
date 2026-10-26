import React, { useMemo } from 'react';
import { ExerciseDefinition } from '../../types/workout';
import { useWorkout } from '../../context/WorkoutContext';
import { useBackButton } from '../../context/BackNavigationContext';
import {
  calculateExerciseLevelInfo,
  isDurationExercise,
  getSetDurationSeconds
} from '../../utils/calculations';
import {
  getExerciseStrengthAnalysis,
  calculate1RM,
  detectExercisePlateau
} from '../../utils/scientificCalculations';
import {
  getExerciseStandards,
  getDurationStandards,
  strengthTierConfigs,
  STRENGTH_TIER_ORDER
} from '../../data/strengthStandards';
import { muscleMetadata } from '../../data/muscleMetadata';
import { formatDisplayDate, parseLocalDate, TURKISH_MONTHS_SHORT } from '../../utils/dateUtils';
import { ExerciseVisual } from '../workout/ExerciseVisual';
import { sounds } from '../../utils/audio';
import {
  X,
  TrendingUp,
  Target,
  Layers,
  Calendar,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface ExerciseDetailModalProps {
  exercise: ExerciseDefinition | null;
  onClose: () => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  onClose
}) => {
  const { workouts, profile } = useWorkout();

  useBackButton(
    Boolean(exercise),
    () => {
      sounds.playPop();
      onClose();
    },
    80
  );

  const isDuration = useMemo(
    () => (exercise ? isDurationExercise(exercise) : false),
    [exercise]
  );

  const info = useMemo(
    () => (exercise ? calculateExerciseLevelInfo(exercise, workouts) : null),
    [exercise, workouts]
  );

  const strength = useMemo(
    () => (exercise ? getExerciseStrengthAnalysis(exercise, workouts, profile) : null),
    [exercise, workouts, profile]
  );

  const plateau = useMemo(
    () => (exercise ? detectExercisePlateau(exercise.id, workouts) : null),
    [exercise, workouts]
  );

  // Extract chronological session history for this exercise
  const sessionHistory = useMemo(() => {
    if (!exercise) return [];
    const points: {
      date: string;
      shortDate: string;
      est1RM: number;
      bestWeight: number;
      bestReps: number;
      volume: number;
      setsCount: number;
    }[] = [];

    // workouts are sorted newest first, so iterate in reverse for chronological order
    const chronological = [...workouts].sort((a, b) => a.date.localeCompare(b.date));

    chronological.forEach((w) => {
      const ex = w.exercises.find((e) => e.id === exercise.id);
      if (!ex) return;

      let bestSession1RM = 0;
      let bestW = 0;
      let bestR = 0;
      let vol = 0;
      let setsCount = 0;

      if (ex.detailedSets && ex.detailedSets.length > 0) {
        ex.detailedSets.forEach((s) => {
          if (isDuration) {
            const secs = getSetDurationSeconds(s, true);
            if (secs > 0) {
              setsCount++;
              vol += secs;
              if (secs > bestSession1RM) {
                bestSession1RM = secs;
                bestR = secs;
              }
            }
          } else if (s.weight > 0) {
            const r = s.reps || 5;
            const e1rm = calculate1RM(s.weight, r);
            setsCount++;
            vol += s.weight * r;
            if (e1rm > bestSession1RM) {
              bestSession1RM = e1rm;
              bestW = s.weight;
              bestR = r;
            }
          }
        });
      } else if (ex.sets && ex.sets.length > 0) {
        ex.sets.forEach((wgt) => {
          if (wgt > 0) {
            setsCount++;
            if (isDuration) {
              vol += wgt;
              if (wgt > bestSession1RM) {
                bestSession1RM = wgt;
                bestR = wgt;
              }
            } else {
              const e1rm = calculate1RM(wgt, 5);
              vol += wgt * 5;
              if (e1rm > bestSession1RM) {
                bestSession1RM = e1rm;
                bestW = wgt;
                bestR = 5;
              }
            }
          }
        });
      }

      if (bestSession1RM > 0) {
        const d = parseLocalDate(w.date);
        const shortDate = `${d.getDate()} ${TURKISH_MONTHS_SHORT[d.getMonth()]}`;
        points.push({
          date: w.date,
          shortDate,
          est1RM: Math.round(bestSession1RM * 10) / 10,
          bestWeight: bestW,
          bestReps: bestR,
          volume: Math.round(vol),
          setsCount
        });
      }
    });

    return points.slice(-14);
  }, [exercise, workouts, isDuration]);

  // 5-tier standards for user's current bodyweight
  const tierTargets = useMemo(() => {
    if (!exercise) return [];
    const bw = Math.max(30, profile.bodyWeightKg || 75);
    const gender = profile.gender || 'male';

    if (isDuration) {
      const dStd = getDurationStandards(exercise.id);
      return STRENGTH_TIER_ORDER.map((tierKey) => ({
        tier: tierKey,
        config: strengthTierConfigs[tierKey],
        targetVal: dStd[tierKey],
        multiplier: null
      }));
    }

    const std = getExerciseStandards(exercise.id)[gender];
    return STRENGTH_TIER_ORDER.map((tierKey) => ({
      tier: tierKey,
      config: strengthTierConfigs[tierKey],
      targetVal: Math.round(std[tierKey] * bw * 2) / 2,
      multiplier: std[tierKey]
    }));
  }, [exercise, profile.bodyWeightKg, profile.gender, isDuration]);

  // Rep Max Table (1RM, 3RM, 5RM, 8RM, 10RM, 12RM)
  const repMaxList = useMemo(() => {
    if (!strength || strength.estimated1RM <= 0 || isDuration) return [];
    const oneRM = strength.estimated1RM;
    const repsTable = [
      { reps: '1RM', pct: 1.0, desc: 'Maksimum Tek' },
      { reps: '3RM', pct: 0.91, desc: 'Saf Kuvvet' },
      { reps: '5RM', pct: 0.86, desc: 'Kuvvet & Kütle' },
      { reps: '8RM', pct: 0.79, desc: 'Hipertrofi' },
      { reps: '10RM', pct: 0.75, desc: 'Hipertrofi' },
      { reps: '12RM', pct: 0.71, desc: 'Dayanıklılık' }
    ];
    return repsTable.map((item) => ({
      ...item,
      weight: Math.round((oneRM * item.pct) * 2) / 2
    }));
  }, [strength, isDuration]);

  if (!exercise || !info || !strength) return null;

  const hasLogged = strength.estimated1RM > 0;
  const unit = isDuration ? 'sn' : 'kg';

  return (
    <div
      className="modal-backdrop"
      onClick={() => {
        sounds.playPop();
        onClose();
      }}
      style={{ zIndex: 1100, padding: '14px' }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: '18px',
          maxWidth: 460,
          background: 'linear-gradient(180deg, #151e30 0%, #0b0f17 100%)',
          border: `1px solid ${hasLogged ? `${strength.tierColor}45` : 'var(--border)'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <ExerciseVisual exerciseId={exercise.id} muscle={exercise.muscle} size={48} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 900,
                    color: '#ffffff',
                    margin: 0,
                    letterSpacing: '-0.02em'
                  }}
                >
                  {exercise.name}
                </h3>
                {hasLogged && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: strength.tierGradient,
                      color: '#ffffff',
                      fontSize: 10,
                      fontWeight: 900,
                      textTransform: 'uppercase'
                    }}
                  >
                    <span>{strength.tierBadge}</span>
                    <span>{strength.tierTitle}</span>
                  </span>
                )}
              </div>

              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={12} color="var(--text-dim)" />
                <span>
                  {info.lastTrainedDate
                    ? `Son kayıt: ${formatDisplayDate(info.lastTrainedDate)}`
                    : 'Henüz antrenman kaydı yok'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="btn-icon"
            aria-label="Kapat"
            style={{ width: 32, height: 32, flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Top 3 Highlight KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 8px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
              {isDuration ? 'En İyi Süre' : 'Tahmini 1RM'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit', marginTop: 2 }}>
              {hasLogged ? `${strength.estimated1RM} ${unit}` : '—'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700 }}>
              {!isDuration && strength.bestSetWeight > 0
                ? `PR: ${strength.bestSetWeight}kg × ${strength.bestSetReps}`
                : `Seviye ${info.currentLevel}`}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 8px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
              {isDuration ? 'Dakika Oranı' : 'Vücut Oranı'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--cyan)', fontFamily: 'Outfit', marginTop: 2 }}>
              {hasLogged ? (isDuration ? `${strength.bodyweightRatio} dk` : `${strength.bodyweightRatio}x`) : '—'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
              {profile.bodyWeightKg || 75} kg vücut
            </div>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 8px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
              Güç Skoru
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: hasLogged ? strength.tierColor : 'var(--text-dim)',
                fontFamily: 'Outfit',
                marginTop: 2
              }}
            >
              {strength.strengthScore}
              <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>/100</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
              {info.totalSets} Toplam Set
            </div>
          </div>
        </div>

        {/* Plateau Warning if detected */}
        {plateau?.isPlateau && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              fontSize: 11.5,
              color: '#fde68a'
            }}
          >
            <AlertTriangle size={15} color="var(--gold)" style={{ flexShrink: 0 }} />
            <span>
              Son {plateau.consecutiveCount} antrenmandır 1RM sabit kaldı. Küçük ağırlık artışı (+1.25/2.5kg) veya tekrar hedefi değiştirmeyi deneyin.
            </span>
          </div>
        )}

        {/* 1. 5 KADEMELİ GÜÇ STANDARDI CETVELİ (Visual Tier Ruler) */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Target size={14} color={strength.tierColor} />
              <span style={{ fontSize: 12.5, fontWeight: 800, color: '#ffffff' }}>
                Güç Standartları Cetveli ({profile.bodyWeightKg || 75} kg)
              </span>
            </div>
            {hasLogged && (
              <span style={{ fontSize: 11, fontWeight: 700, color: strength.tierColor }}>
                Sonraki: {strength.nextTierWeight} {unit} (%{strength.tierProgressPct})
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5 }}>
            {tierTargets.map((item) => {
              const isReached = hasLogged && strength.estimated1RM >= item.targetVal;
              const isCurrent = hasLogged && strength.tier === item.tier;
              return (
                <div
                  key={item.tier}
                  style={{
                    padding: '7px 4px',
                    borderRadius: 'var(--radius-sm)',
                    background: isCurrent
                      ? `${item.config.color}22`
                      : isReached
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: isCurrent
                      ? `1.5px solid ${item.config.color}`
                      : isReached
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontSize: 12 }}>{item.config.badge}</div>
                  <div
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      color: isCurrent ? '#ffffff' : 'var(--text-muted)',
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {item.config.title.split(' ')[0]}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      color: isCurrent ? item.config.color : isReached ? '#10b981' : '#ffffff',
                      fontFamily: 'Outfit',
                      marginTop: 2
                    }}
                  >
                    {item.targetVal}
                    <span style={{ fontSize: 9, fontWeight: 600, marginLeft: 1 }}>{unit}</span>
                  </div>
                  {item.multiplier && (
                    <div style={{ fontSize: 8.5, color: 'var(--text-dim)', marginTop: 1 }}>
                      {item.multiplier}x BW
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. SEANS BAZLI 1RM GELİŞİM GRAFİĞİ (SVG Trend Chart) */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={14} color="var(--cyan)" />
              <span style={{ fontSize: 12.5, fontWeight: 800, color: '#ffffff' }}>
                {isDuration ? 'Süre Gelişim Grafiği' : '1RM Kuvvet Gelişim Grafiği'}
              </span>
            </div>
            {sessionHistory.length >= 2 && (
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--muscle-emerald)' }}>
                {sessionHistory[0].est1RM} {unit} ➔ {sessionHistory[sessionHistory.length - 1].est1RM} {unit}
              </span>
            )}
          </div>

          {sessionHistory.length >= 2 ? (
            (() => {
              const vals = sessionHistory.map((p) => p.est1RM);
              const minV = Math.min(...vals);
              const maxV = Math.max(...vals);
              const range = Math.max(1, maxV - minV);
              const w = 360;
              const h = 110;
              const padX = 20;
              const padY = 18;

              const coords = sessionHistory.map((pt, idx) => ({
                ...pt,
                x: padX + (idx / Math.max(1, sessionHistory.length - 1)) * (w - padX * 2),
                y: h - padY - ((pt.est1RM - minV) / range) * (h - padY * 2)
              }));

              const poly = coords.map((c) => `${c.x},${c.y}`).join(' ');
              const area = `${coords[0].x},${h - padY} ${poly} ${coords[coords.length - 1].x},${h - padY}`;

              return (
                <div>
                  <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 110, display: 'block' }}>
                    <defs>
                      <linearGradient id="exModalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={strength.tierColor} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={strength.tierColor} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <polygon points={area} fill="url(#exModalGrad)" />
                    <polyline
                      fill="none"
                      stroke={strength.tierColor}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={poly}
                    />
                    {coords.map((c, idx) => (
                      <g key={c.date + idx}>
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r={idx === coords.length - 1 ? 4.5 : 3}
                          fill={idx === coords.length - 1 ? strength.tierColor : '#0b0f17'}
                          stroke={strength.tierColor}
                          strokeWidth="2"
                        />
                        {(idx === 0 || idx === coords.length - 1 || c.est1RM === maxV) && (
                          <text
                            x={c.x}
                            y={Math.max(11, c.y - 7)}
                            fill="#ffffff"
                            fontSize="9.5"
                            fontWeight="800"
                            textAnchor="middle"
                          >
                            {c.est1RM}
                          </text>
                        )}
                      </g>
                    ))}
                  </svg>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 10,
                      color: 'var(--text-dim)',
                      marginTop: 2
                    }}
                  >
                    <span>{sessionHistory[0].shortDate}</span>
                    <span>{sessionHistory.length} antrenman kaydı</span>
                    <span>{sessionHistory[sessionHistory.length - 1].shortDate}</span>
                  </div>
                </div>
              );
            })()
          ) : sessionHistory.length === 1 ? (
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', padding: '8px 0', textAlign: 'center' }}>
              İlk kayıt: <strong style={{ color: '#ffffff' }}>{sessionHistory[0].est1RM} {unit}</strong> ({sessionHistory[0].shortDate}). Trend grafiği için 1 antrenman daha kaydedin.
            </div>
          ) : (
            <div style={{ fontSize: 11.5, color: 'var(--text-dim)', padding: '8px 0', textAlign: 'center' }}>
              Bu hareket için henüz antrenman verisi bulunmuyor.
            </div>
          )}
        </div>

        {/* 3. TAHMİNİ TEKRAR MAKSİMUMLARI TABLOSU (Rep Max Matrix) */}
        {repMaxList.length > 0 && (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Zap size={14} color="var(--gold)" />
              <span style={{ fontSize: 12.5, fontWeight: 800, color: '#ffffff' }}>
                Tekrar Maksimumları (Antrenman Ağırlık Rehberi)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {repMaxList.map((rm) => (
                <div
                  key={rm.reps}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--gold)' }}>{rm.reps}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{rm.desc}</div>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit' }}>
                    {rm.weight} <span style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--text-muted)' }}>kg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. BİLİMSEL KAS AKTİVASYON DAĞILIMI */}
        {exercise.muscles && exercise.muscles.length > 0 && (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Layers size={14} color="var(--muscle-emerald)" />
              <span style={{ fontSize: 12.5, fontWeight: 800, color: '#ffffff' }}>
                Kas Aktivasyon Dağılımı
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {exercise.muscles.map((act) => {
                const meta = muscleMetadata[act.muscle];
                const pct = Math.round(act.ratio * 100);
                return (
                  <div key={act.muscle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, color: '#ffffff' }}>
                        {meta?.icon} {meta?.name || act.muscle}{' '}
                        <span style={{ color: 'var(--text-dim)', fontWeight: 500, fontSize: 10 }}>
                          ({act.role === 'primary' ? 'Birincil' : act.role === 'secondary' ? 'İkincil' : 'Stabilizör'})
                        </span>
                      </span>
                      <span style={{ fontWeight: 800, color: meta?.color || 'var(--cyan)' }}>%{pct}</span>
                    </div>
                    <div className="progress-bar-track" style={{ height: 5 }}>
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: meta?.color || 'var(--cyan)'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
