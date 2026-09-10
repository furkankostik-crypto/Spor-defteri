import React, { useState } from 'react';
import { MuscleGroup, NextWorkoutSuggestion } from '../../types/workout';
import { AnatomyIcon } from '../../data/anatomyIcons';
import { muscleMetadata } from '../../data/muscleMetadata';
import { useWorkout } from '../../context/WorkoutContext';
import { getSuggestedNextWorkout } from '../../utils/recommendationEngine';
import { calculateWorkoutSessionTarget, MuscleTargetProgress } from '../../utils/workoutTargets';
import { sounds } from '../../utils/audio';
import { RotateCw, Zap, Check, Dumbbell } from 'lucide-react';
import { FRONT_PATHS, BACK_PATHS } from '../../data/bodyMapPaths';

interface AnatomicalBodyMapProps {
  onSelectMuscle: (muscle: MuscleGroup) => void;
  selectedMuscle?: MuscleGroup | null;
  suggestion?: NextWorkoutSuggestion;
  isManual?: boolean;
}

export const AnatomicalBodyMap: React.FC<AnatomicalBodyMapProps> = ({
  onSelectMuscle,
  selectedMuscle,
  suggestion,
  isManual
}) => {
  const { draft, allExercises, workouts } = useWorkout();
  const [view, setView] = useState<'front' | 'back'>('front');
  const [hoveredMuscle, setHoveredMuscle] = useState<MuscleGroup | null>(null);

  const isManualMode = isManual ?? Boolean(draft.isManual);

  // Active suggestions & recovery status
  const currentSuggestion = suggestion || getSuggestedNextWorkout(workouts);
  const recommendedMuscles: MuscleGroup[] = isManualMode ? [] : (currentSuggestion?.recommendedMuscles || []);
  const isMuscleRecommended = (muscle: MuscleGroup) => recommendedMuscles.includes(muscle);

  // Calculate recommendation count on Front vs Back
  const frontRecCount = ['chest', 'shoulder', 'biceps', 'abs', 'quads', 'calves'].filter((m) =>
    isMuscleRecommended(m as MuscleGroup)
  ).length;
  const backRecCount = ['back', 'shoulder', 'triceps', 'glutes', 'hamstring', 'calves'].filter((m) =>
    isMuscleRecommended(m as MuscleGroup)
  ).length;

  // Calculate entered sets per muscle in current draft
  const muscleStats = React.useMemo(() => {
    const stats: Record<MuscleGroup, { setsCount: number; volume: number; exerciseCount: number }> = {
      chest: { setsCount: 0, volume: 0, exerciseCount: 0 },
      back: { setsCount: 0, volume: 0, exerciseCount: 0 },
      shoulder: { setsCount: 0, volume: 0, exerciseCount: 0 },
      biceps: { setsCount: 0, volume: 0, exerciseCount: 0 },
      triceps: { setsCount: 0, volume: 0, exerciseCount: 0 },
      quads: { setsCount: 0, volume: 0, exerciseCount: 0 },
      hamstring: { setsCount: 0, volume: 0, exerciseCount: 0 },
      calves: { setsCount: 0, volume: 0, exerciseCount: 0 },
      glutes: { setsCount: 0, volume: 0, exerciseCount: 0 },
      abs: { setsCount: 0, volume: 0, exerciseCount: 0 },
      cardio: { setsCount: 0, volume: 0, exerciseCount: 0 }
    };

    allExercises.forEach((ex) => {
      if (stats[ex.muscle]) {
        stats[ex.muscle].exerciseCount++;
      }
    });

    Object.entries(draft.exerciseSets).forEach(([exId, sets]) => {
      const ex = allExercises.find((e) => e.id === exId);
      if (ex) {
        const activations = ex.muscles && ex.muscles.length > 0
          ? ex.muscles
          : [{ muscle: ex.muscle, ratio: 1.0, role: 'primary' as const }];

        sets.forEach((s) => {
          if (s.weight > 0) {
            const vol = s.weight * (s.reps || 5);
            activations.forEach((act) => {
              if (stats[act.muscle]) {
                stats[act.muscle].setsCount += act.role === 'primary' ? 1 : 0.5;
                stats[act.muscle].volume += Math.round(vol * act.ratio);
              }
            });
          }
        });
      }
    });

    return stats;
  }, [draft.exerciseSets, allExercises]);

  // Calculate overall session targets and per-muscle target progress
  const sessionTarget = React.useMemo(() => {
    return calculateWorkoutSessionTarget(
      draft.splitType,
      draft.exerciseSets,
      allExercises,
      recommendedMuscles
    );
  }, [draft.splitType, draft.exerciseSets, allExercises, recommendedMuscles]);

  const muscleTargetMap = React.useMemo(() => {
    const map: Partial<Record<MuscleGroup, MuscleTargetProgress>> = {};
    sessionTarget.muscleTargets.forEach((mt) => {
      map[mt.muscle] = mt;
    });
    return map;
  }, [sessionTarget]);

  const handleMuscleClick = (muscle: MuscleGroup) => {
    sounds.playPop();
    onSelectMuscle(muscle);
  };

  const isMuscleTrained = (muscle: MuscleGroup) => {
    return (muscleStats[muscle]?.setsCount || 0) > 0;
  };

  const getMuscleFill = (muscle: MuscleGroup) => {
    const isSelected = selectedMuscle === muscle;
    const isHovered = hoveredMuscle === muscle;
    const isTrained = isMuscleTrained(muscle);
    const isRec = isMuscleRecommended(muscle);
    const meta = muscleMetadata[muscle];

    if (isSelected) return meta.color;
    if (isTrained) return '#059669'; // Emerald glow for trained
    if (isHovered) return meta.color;
    if (isRec) return '#17375a'; // Glowing cyber cyan-tinted tone for recommended
    return '#202d42'; // Crisp high-contrast slate-navy tone
  };

  const getMuscleStroke = (muscle: MuscleGroup) => {
    const isSelected = selectedMuscle === muscle;
    const isHovered = hoveredMuscle === muscle;
    const isTrained = isMuscleTrained(muscle);
    const isRec = isMuscleRecommended(muscle);

    if (isSelected) return '#ffffff';
    if (isTrained) return '#34d399';
    if (isHovered) return '#ffffff';
    if (isRec) return '#38bdf8'; // Luminous cyan outline for recommended
    return '#475f80'; // High-contrast distinct anatomical outline
  };

  const getMuscleOpacity = (muscle: MuscleGroup) => {
    const isSelected = selectedMuscle === muscle;
    const isHovered = hoveredMuscle === muscle;
    const isTrained = isMuscleTrained(muscle);
    const isRec = isMuscleRecommended(muscle);

    if (isSelected) return 1.0;
    if (isHovered) return 0.98;
    if (isTrained) return 0.95;
    if (isRec) return 0.96;
    return 0.82; // Subtle depth separation so recommended muscles pop
  };

  // Hotspot Pinpoint component with Recommendation indicators
  const HotspotPin = ({
    x,
    y,
    muscle,
    label,
    direction = 'right'
  }: {
    x: number;
    y: number;
    muscle: MuscleGroup;
    label: string;
    direction?: 'left' | 'right';
  }) => {
    const isHovered = hoveredMuscle === muscle;
    const isSelected = selectedMuscle === muscle;
    const isTrained = isMuscleTrained(muscle);
    const isRec = isMuscleRecommended(muscle);
    const trainedSets = muscleStats[muscle]?.setsCount || 0;
    const meta = muscleMetadata[muscle];

    const targetInfo = muscleTargetMap[muscle];
    const targetSets = targetInfo?.targetSets || 3;
    const isGoalMet = trainedSets >= targetSets;

    const showTag = isHovered || isSelected || isTrained || isRec;
    const badgeWidth = isTrained ? (isGoalMet ? 88 : 82) : (isRec ? 76 : 68);
    const badgeX = direction === 'right' ? x + 10 : x - (badgeWidth + 10);
    const badgeY = y - 11;

    return (
      <g
        className={`hotspot-pin ${isRec ? 'is-recommended' : ''}`}
        onClick={() => handleMuscleClick(muscle)}
        onMouseEnter={() => setHoveredMuscle(muscle)}
        onMouseLeave={() => setHoveredMuscle(null)}
        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
      >
        {/* Radar Wave */}
        <circle
          cx={x}
          cy={y}
          r={isHovered || isSelected ? 15 : isRec ? 9 : 8}
          fill="none"
          stroke={
            isTrained
              ? '#10b981'
              : isRec
              ? '#38bdf8'
              : isHovered
              ? meta.color
              : 'rgba(255, 255, 255, 0.65)'
          }
          strokeWidth={isHovered ? '2' : isRec ? '1.8' : '1.5'}
          className={isRec && !isTrained ? 'radar-pulse-rec' : 'radar-pulse'}
        />

        {/* Center Point */}
        <circle
          cx={x}
          cy={y}
          r={isRec && !isTrained ? '5' : '4.5'}
          fill={
            isTrained
              ? '#10b981'
              : isRec
              ? '#38bdf8'
              : isHovered || isSelected
              ? meta.color
              : '#ffffff'
          }
          filter={isRec ? 'url(#glow-rec-pin)' : 'url(#glow-dot)'}
        />

        {/* Inner white core for recommended pin */}
        {isRec && !isTrained && (
          <circle cx={x} cy={y} r="2" fill="#ffffff" />
        )}

        {/* Dynamic Label Tag: Shows for Recommended, Trained, or on Hover */}
        {showTag && (
          <g className="hotspot-tag" style={{ pointerEvents: 'none' }}>
            <rect
              x={badgeX}
              y={badgeY}
              width={badgeWidth}
              height="22"
              rx="6"
              fill={
                isTrained
                  ? 'url(#recTrainedBg)'
                  : isRec
                  ? 'url(#recBadgeBg)'
                  : 'rgba(15, 23, 42, 0.96)'
              }
              stroke={
                isTrained
                  ? '#10b981'
                  : isRec
                  ? '#38bdf8'
                  : isHovered
                  ? meta.color
                  : 'rgba(255, 255, 255, 0.3)'
              }
              strokeWidth={isTrained || isRec ? '1.3' : '1'}
              filter="url(#shadow-subtle)"
            />
            <text
              x={badgeX + badgeWidth / 2}
              y={badgeY + 14.5}
              fill={isTrained ? '#a7f3d0' : isRec ? '#ffffff' : '#ffffff'}
              fontSize="10"
              fontWeight="800"
              textAnchor="middle"
              letterSpacing="0.2px"
            >
              {isTrained 
                ? (isGoalMet ? `✓ ${trainedSets}/${targetSets} Set` : `${trainedSets}/${targetSets} Set`) 
                : isRec 
                ? `⚡ ${label}` 
                : label}
            </text>
          </g>
        )}
      </g>
    );
  };

  const renderMuscleGroup = (muscle: MuscleGroup, paths: string[]) => {
    return (
      <g
        key={muscle}
        className={`muscle-part ${muscle} ${isMuscleRecommended(muscle) ? 'is-recommended' : ''}`}
        onClick={() => handleMuscleClick(muscle)}
        onMouseEnter={() => setHoveredMuscle(muscle)}
        onMouseLeave={() => setHoveredMuscle(null)}
        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
      >
        {paths.map((d, idx) => (
          <path
            key={idx}
            d={d}
            fill={getMuscleFill(muscle)}
            stroke={getMuscleStroke(muscle)}
            strokeWidth={isMuscleRecommended(muscle) ? '1.8' : '1.5'}
            opacity={getMuscleOpacity(muscle)}
          />
        ))}
      </g>
    );
  };

  const renderBaseGroup = (key: string, paths: string[]) => {
    return (
      <g key={key} className={`base-part ${key}`} opacity="0.85">
        {paths.map((d, idx) => (
          <path
            key={idx}
            d={d}
            fill="#182334"
            stroke="#475f80"
            strokeWidth="1.3"
          />
        ))}
      </g>
    );
  };

  return (
    <div className="card" style={{ padding: '16px', position: 'relative', overflow: 'hidden' }}>
      {/* Background Tech Grid Atmosphere */}
      <div className="body-map-grid-bg" />

      {/* Header Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          position: 'relative',
          zIndex: 10,
          gap: 10
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🗺️</span>
            <span style={{ fontWeight: 800, fontSize: 15, color: '#ffffff' }}>
              Anatomik Vücut Haritası
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Çalışmak istediğin kas bölgesine dokun
          </div>
        </div>

        {/* Front / Back Flip Button with Recommendation badge for other side */}
        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setView(view === 'front' ? 'back' : 'front');
          }}
          className="btn btn-secondary"
          style={{
            padding: '6px 13px',
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 'var(--radius-full)',
            gap: 6,
            background: 'rgba(30, 41, 59, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}
        >
          <RotateCw size={13} color="var(--accent)" style={{ flexShrink: 0 }} />
          <span style={{ whiteSpace: 'nowrap' }}>{view === 'front' ? 'Arka Vücut' : 'Ön Vücut'}</span>
          {view === 'front' && backRecCount > 0 && (
            <span
              style={{
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                color: '#ffffff',
                fontSize: 9.5,
                fontWeight: 900,
                padding: '2px 7px',
                borderRadius: 'var(--radius-full)',
                boxShadow: '0 2px 6px rgba(56, 189, 248, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              title="Arka vücutta önerilen kaslar mevcut"
            >
              ⚡ {backRecCount}
            </span>
          )}
          {view === 'back' && frontRecCount > 0 && (
            <span
              style={{
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                color: '#ffffff',
                fontSize: 9.5,
                fontWeight: 900,
                padding: '2px 7px',
                borderRadius: 'var(--radius-full)',
                boxShadow: '0 2px 6px rgba(56, 189, 248, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              title="Ön vücutta önerilen kaslar mevcut"
            >
              ⚡ {frontRecCount}
            </span>
          )}
        </button>
      </div>

      {/* Current Hover / Selected Info Banner with Recommendation context */}
      <div
        style={{
          minHeight: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 12px',
          background: 'rgba(15, 23, 42, 0.85)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          marginBottom: 10,
          fontSize: 12,
          position: 'relative',
          zIndex: 10,
          backdropFilter: 'blur(8px)'
        }}
      >
        {hoveredMuscle ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <AnatomyIcon muscle={hoveredMuscle} size={22} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <strong style={{ color: muscleMetadata[hoveredMuscle].color }}>
                    {muscleMetadata[hoveredMuscle].name}
                  </strong>
                  {isMuscleRecommended(hoveredMuscle) && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 900,
                        color: '#ffffff',
                        background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        letterSpacing: '0.3px'
                      }}
                    >
                      ⚡ ÖNERİ
                    </span>
                  )}
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: 10 }}>
                  {currentSuggestion?.muscleRecoveryMap?.[hoveredMuscle]?.daysSinceTrained !== undefined
                    ? `${currentSuggestion.muscleRecoveryMap[hoveredMuscle]?.daysSinceTrained} gün dinlendi • `
                    : ''}
                  {muscleMetadata[hoveredMuscle].latinName}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', flexShrink: 0, marginLeft: 8 }}>
              {muscleStats[hoveredMuscle].exerciseCount} Hareket • Tıkla & Gör →
            </div>
          </>
        ) : isManualMode ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--cyan)',
                  flexShrink: 0
                }}
              >
                <Dumbbell size={13} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 12, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>Serbest Antrenman</span>
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: 'var(--text-dim)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {sessionTarget.completedSetsCount > 0
                    ? `${sessionTarget.completedExercisesCount} Hareket • ${sessionTarget.completedSetsCount} Set Girildi`
                    : 'Çalışmak istediğin kas bölgesine dokun'}
                </div>
              </div>
            </div>
            {sessionTarget.completedSetsCount > 0 && (
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: '#34d399',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {sessionTarget.completedSetsCount} Set
                </span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: sessionTarget.isTargetMet ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                  border: sessionTarget.isTargetMet ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(56, 189, 248, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: sessionTarget.isTargetMet ? '#10b981' : 'var(--cyan)',
                  flexShrink: 0
                }}
              >
                {sessionTarget.isTargetMet ? <Check size={13} strokeWidth={3} /> : <Zap size={13} fill="currentColor" />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 12, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>Hedef: <strong style={{ color: sessionTarget.isTargetMet ? '#34d399' : 'var(--cyan)' }}>{sessionTarget.splitTitle}</strong></span>
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: 'var(--text-dim)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={currentSuggestion.reason}
                >
                  {sessionTarget.completedSetsCount > 0
                    ? `${sessionTarget.completedExercisesCount}/${sessionTarget.targetExercisesCount} Hareket • ${sessionTarget.completedSetsCount}/${sessionTarget.targetSetsCount} Set Tamamlandı`
                    : `Seans Hedefi: ${sessionTarget.targetExercisesCount} Hareket • ${sessionTarget.targetSetsCount} Set (${recommendedMuscles.length} Bölge)`}
                </div>
              </div>
            </div>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: sessionTarget.isTargetMet ? '#34d399' : 'var(--cyan)',
                  background: sessionTarget.isTargetMet ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.1)',
                  border: sessionTarget.isTargetMet ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(56, 189, 248, 0.25)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  whiteSpace: 'nowrap'
                }}
              >
                %{sessionTarget.overallProgressPercent}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Recommended Muscle Chips Bar */}
      {recommendedMuscles.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 4,
            marginBottom: 10,
            scrollbarWidth: 'none',
            position: 'relative',
            zIndex: 10
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--cyan)',
              flexShrink: 0
            }}
          >
            <Zap size={12} fill="currentColor" />
            <span>Önerilen:</span>
          </div>
          {recommendedMuscles.map((m) => {
            const meta = muscleMetadata[m];
            if (!meta) return null;
            const isTrained = isMuscleTrained(m);
            const targetInfo = muscleTargetMap[m];
            const targetSets = targetInfo?.targetSets || 3;
            const completedSets = muscleStats[m]?.setsCount || 0;
            const isGoalMet = completedSets >= targetSets;

            const isCurrentView =
              (view === 'front' && meta.view !== 'back') ||
              (view === 'back' && meta.view !== 'front');
            const needsFlip = !isCurrentView;

            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  sounds.playPop();
                  if (needsFlip) {
                    setView(view === 'front' ? 'back' : 'front');
                  }
                  onSelectMuscle(m);
                }}
                className={`rec-chip-btn ${isTrained ? 'is-trained' : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  whiteSpace: 'nowrap'
                }}
                title={`${meta.name} - ${meta.description}`}
              >
                <span>{isGoalMet ? '✓' : isTrained ? '⚡' : '○'}</span>
                <span>{meta.name}</span>
                {isTrained && (
                  <span style={{ fontSize: 9.5, opacity: 0.9, fontWeight: 800 }}>
                    ({completedSets}/{targetSets})
                  </span>
                )}
                {needsFlip && (
                  <span style={{ opacity: 0.65, fontSize: 9.5 }}>
                    ({view === 'front' ? 'Arka' : 'Ön'})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Interactive SVG Human Anatomy Figure */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          padding: '10px 0',
          minHeight: '430px'
        }}
      >
        <svg
          viewBox="0 0 320 520"
          width="100%"
          height="430"
          style={{
            maxWidth: '340px',
            filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.55))',
            userSelect: 'none'
          }}
        >
          <defs>
            <filter id="glow-dot" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-rec-pin" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="shadow-subtle" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.4" />
            </filter>
            <linearGradient id="recBadgeBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(2, 132, 199, 0.95)" />
              <stop offset="100%" stopColor="rgba(15, 23, 42, 0.98)" />
            </linearGradient>
            <linearGradient id="recTrainedBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(5, 150, 105, 0.95)" />
              <stop offset="100%" stopColor="rgba(15, 23, 42, 0.98)" />
            </linearGradient>
            <radialGradient id="bodyBacklight" cx="50%" cy="40%" r="48%">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.16)" />
              <stop offset="45%" stopColor="rgba(30, 58, 138, 0.08)" />
              <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
            </radialGradient>
            <pattern id="radarGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Subtle Grid Fill */}
          <rect width="320" height="520" fill="url(#radarGrid)" />

          {/* Luminous Body Aura for High Contrast Definition */}
          <ellipse cx="160" cy="240" rx="115" ry="215" fill="url(#bodyBacklight)" />

          {view === 'front' ? (
            /* FRONT ANATOMY VIEW */
            <g className="anatomy-front-group">
              {/* Base non-clickable elements */}
              {renderBaseGroup('head', FRONT_PATHS.head)}
              {renderBaseGroup('neck', FRONT_PATHS.neck)}
              {renderBaseGroup('forearms', FRONT_PATHS.forearms)}
              {renderBaseGroup('hands', FRONT_PATHS.hands)}
              {renderBaseGroup('knees', FRONT_PATHS.knees)}
              {renderBaseGroup('feet', FRONT_PATHS.feet)}

              {/* Clickable Interactive Muscles */}
              {renderMuscleGroup('shoulder', FRONT_PATHS.shoulder)}
              {renderMuscleGroup('chest', FRONT_PATHS.chest)}
              {renderMuscleGroup('biceps', FRONT_PATHS.biceps)}
              {renderMuscleGroup('abs', FRONT_PATHS.abs)}
              {renderMuscleGroup('quads', FRONT_PATHS.quads)}
              {renderMuscleGroup('calves', FRONT_PATHS.calves)}

              {/* Hotspot Radar Pins - Front */}
              <HotspotPin x={160} y={130} muscle="chest" label="Göğüs" direction="right" />
              <HotspotPin x={100} y={125} muscle="shoulder" label="Omuz" direction="left" />
              <HotspotPin x={90} y={168} muscle="biceps" label="Biceps" direction="left" />
              <HotspotPin x={160} y={195} muscle="abs" label="Karın & Core" direction="right" />
              <HotspotPin x={128} y={305} muscle="quads" label="Ön Bacak" direction="left" />
              <HotspotPin x={192} y={405} muscle="calves" label="Kalf" direction="right" />
            </g>
          ) : (
            /* BACK ANATOMY VIEW */
            <g className="anatomy-back-group">
              {/* Base non-clickable elements */}
              {renderBaseGroup('head', BACK_PATHS.head)}
              {renderBaseGroup('forearms', BACK_PATHS.forearms)}
              {renderBaseGroup('hands', BACK_PATHS.hands)}
              {renderBaseGroup('feet', BACK_PATHS.feet)}

              {/* Clickable Interactive Muscles */}
              {renderMuscleGroup('back', BACK_PATHS.back)}
              {renderMuscleGroup('shoulder', BACK_PATHS.shoulder)}
              {renderMuscleGroup('triceps', BACK_PATHS.triceps)}
              {renderMuscleGroup('glutes', BACK_PATHS.glutes)}
              {renderMuscleGroup('hamstring', BACK_PATHS.hamstring)}
              {renderMuscleGroup('calves', BACK_PATHS.calves)}

              {/* Hotspot Radar Pins - Back */}
              <HotspotPin x={160} y={155} muscle="back" label="Sırt & Kanat" direction="left" />
              <HotspotPin x={104} y={126} muscle="shoulder" label="Arka Omuz" direction="left" />
              <HotspotPin x={228} y={175} muscle="triceps" label="Triceps" direction="right" />
              <HotspotPin x={136} y={265} muscle="glutes" label="Kalça" direction="left" />
              <HotspotPin x={188} y={330} muscle="hamstring" label="Arka Bacak" direction="right" />
              <HotspotPin x={132} y={420} muscle="calves" label="Arka Kalf" direction="left" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
