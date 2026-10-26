import React, { useState } from 'react';
import { MuscleGroup, NextWorkoutSuggestion } from '../../types/workout';
import { AnatomyIcon } from '../../data/anatomyIcons';
import { muscleMetadata } from '../../data/muscleMetadata';
import { useWorkout } from '../../context/WorkoutContext';
import { isDurationExercise, isSetValid } from '../../utils/calculations';
import { sounds } from '../../utils/audio';
import { RotateCw } from 'lucide-react';
import { FRONT_PATHS, BACK_PATHS } from '../../data/bodyMapPaths';

interface AnatomicalBodyMapProps {
  onSelectMuscle: (muscle: MuscleGroup) => void;
  selectedMuscle?: MuscleGroup | null;
  suggestion?: NextWorkoutSuggestion;
  compact?: boolean;
}

export const AnatomicalBodyMap: React.FC<AnatomicalBodyMapProps> = ({
  onSelectMuscle,
  selectedMuscle,
  compact = false
}) => {
  const { draft, allExercises } = useWorkout();
  const [view, setView] = useState<'front' | 'back'>('front');
  const [hoveredMuscle, setHoveredMuscle] = useState<MuscleGroup | null>(null);

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
      const countedPrimary = new Set<MuscleGroup>();
      if (stats[ex.muscle]) {
        stats[ex.muscle].exerciseCount++;
        countedPrimary.add(ex.muscle);
      }
      ex.muscles?.forEach((act) => {
        if (act.role === 'primary' && stats[act.muscle] && !countedPrimary.has(act.muscle)) {
          stats[act.muscle].exerciseCount++;
          countedPrimary.add(act.muscle);
        }
      });
    });

    Object.entries(draft.exerciseSets).forEach(([exId, sets]) => {
      const ex = allExercises.find((e) => e.id === exId);
      if (ex) {
        const isDur = isDurationExercise(ex);
        const activations = ex.muscles && ex.muscles.length > 0
          ? ex.muscles
          : [{ muscle: ex.muscle, ratio: 1.0, role: 'primary' as const }];

        sets.forEach((s) => {
          if (isSetValid(s, isDur)) {
            const vol = isDur ? 0 : s.weight * (s.reps || 5);
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
    const meta = muscleMetadata[muscle];

    if (isSelected) return meta.color;
    if (isTrained) return '#059669'; // Emerald glow for trained
    if (isHovered) return meta.color;
    return '#202d42'; // Crisp high-contrast slate-navy tone
  };

  const getMuscleStroke = (muscle: MuscleGroup) => {
    const isSelected = selectedMuscle === muscle;
    const isHovered = hoveredMuscle === muscle;
    const isTrained = isMuscleTrained(muscle);

    if (isSelected) return '#ffffff';
    if (isTrained) return '#34d399';
    if (isHovered) return '#ffffff';
    return '#475f80'; // High-contrast distinct anatomical outline
  };

  const getMuscleOpacity = (muscle: MuscleGroup) => {
    const isSelected = selectedMuscle === muscle;
    const isHovered = hoveredMuscle === muscle;
    const isTrained = isMuscleTrained(muscle);

    if (isSelected) return 1.0;
    if (isHovered) return 0.98;
    if (isTrained) return 0.95;
    return 0.88;
  };

  // Hotspot Pinpoint component with always-visible sleek anatomical callout tags
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
    const trainedSets = muscleStats[muscle]?.setsCount || 0;
    const meta = muscleMetadata[muscle];

    const badgeText = isTrained ? `✓ ${label} (${trainedSets})` : label;
    const badgeWidth = Math.max(58, badgeText.length * 6.4 + 16);
    const badgeX = direction === 'right' ? x + 12 : x - (badgeWidth + 12);
    const badgeY = y - 10;

    return (
      <g
        className="hotspot-pin"
        onClick={() => handleMuscleClick(muscle)}
        onMouseEnter={() => setHoveredMuscle(muscle)}
        onMouseLeave={() => setHoveredMuscle(null)}
        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
      >
        {/* Subtle Connector Line */}
        <line
          x1={x}
          y1={y}
          x2={direction === 'right' ? badgeX : badgeX + badgeWidth}
          y2={y}
          stroke={
            isTrained
              ? '#10b981'
              : isHovered || isSelected
              ? meta.color
              : 'rgba(148, 163, 184, 0.45)'
          }
          strokeWidth="1.2"
        />

        {/* Radar Wave */}
        <circle
          cx={x}
          cy={y}
          r={isHovered || isSelected ? 13 : 7}
          fill="none"
          stroke={
            isTrained
              ? '#10b981'
              : isHovered
              ? meta.color
              : 'rgba(255, 255, 255, 0.55)'
          }
          strokeWidth={isHovered ? '2' : '1.4'}
          className="radar-pulse"
        />

        {/* Center Point */}
        <circle
          cx={x}
          cy={y}
          r="4"
          fill={
            isTrained
              ? '#10b981'
              : isHovered || isSelected
              ? meta.color
              : '#ffffff'
          }
          filter="url(#glow-dot)"
        />

        {/* Always-Visible Anatomical Callout Badge (essential for mobile touch) */}
        <g className="hotspot-tag" style={{ pointerEvents: 'all' }}>
          <rect
            x={badgeX}
            y={badgeY}
            width={badgeWidth}
            height="20"
            rx="6"
            fill={
              isTrained
                ? 'url(#recTrainedBg)'
                : isHovered || isSelected
                ? 'rgba(30, 41, 59, 0.98)'
                : 'rgba(15, 23, 42, 0.88)'
            }
            stroke={
              isTrained
                ? '#10b981'
                : isHovered || isSelected
                ? meta.color
                : 'rgba(255, 255, 255, 0.18)'
            }
            strokeWidth={isTrained || isHovered || isSelected ? '1.3' : '1'}
            filter="url(#shadow-subtle)"
          />
          <text
            x={badgeX + badgeWidth / 2}
            y={badgeY + 13.5}
            fill={isTrained ? '#a7f3d0' : '#f8fafc'}
            fontSize="9.5"
            fontWeight="700"
            textAnchor="middle"
            letterSpacing="0.2px"
          >
            {badgeText}
          </text>
        </g>
      </g>
    );
  };

  const renderMuscleGroup = (muscle: MuscleGroup, paths: string[]) => {
    return (
      <g
        key={muscle}
        className={`muscle-part ${muscle}`}
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
            strokeWidth="1.5"
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
          marginBottom: 8,
          position: 'relative',
          zIndex: 10,
          gap: 10
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#ffffff' }}>
            Vücut Haritası
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
            Kas bölgesine dokunarak hareket seç
          </div>
        </div>

        {/* Clean Front / Back Flip Button */}
        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setView(view === 'front' ? 'back' : 'front');
          }}
          className="btn btn-secondary"
          style={{
            padding: '7px 14px',
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
          <span style={{ whiteSpace: 'nowrap' }}>
            {view === 'front' ? 'Arka Görünüm' : 'Ön Görünüm'}
          </span>
        </button>
      </div>

      {/* Subtle Hover / Selected Muscle Info Strip */}
      {hoveredMuscle && (
        <div
          style={{
            minHeight: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 12px',
            background: 'rgba(15, 23, 42, 0.85)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            marginBottom: 8,
            fontSize: 12,
            position: 'relative',
            zIndex: 10,
            backdropFilter: 'blur(8px)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <AnatomyIcon muscle={hoveredMuscle} size={20} />
            <div style={{ minWidth: 0 }}>
              <strong style={{ color: muscleMetadata[hoveredMuscle].color }}>
                {muscleMetadata[hoveredMuscle].name}
              </strong>
              <span style={{ color: 'var(--text-dim)', fontSize: 10.5, marginLeft: 6 }}>
                {muscleMetadata[hoveredMuscle].latinName}
              </span>
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', flexShrink: 0, marginLeft: 8 }}>
            {muscleStats[hoveredMuscle].exerciseCount} Hareket →
          </div>
        </div>
      )}

      {/* Interactive SVG Human Anatomy Figure */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          padding: compact ? '2px 0' : '6px 0',
          minHeight: compact ? '340px' : '420px'
        }}
      >
        <svg
          viewBox="0 0 320 520"
          width="100%"
          height={compact ? '340' : '420'}
          style={{
            maxWidth: compact ? '300px' : '340px',
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
            <filter id="shadow-subtle" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.4" />
            </filter>
            <linearGradient id="recTrainedBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(5, 150, 105, 0.95)" />
              <stop offset="100%" stopColor="rgba(15, 23, 42, 0.98)" />
            </linearGradient>
            <radialGradient id="bodyBacklight" cx="50%" cy="40%" r="48%">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.14)" />
              <stop offset="45%" stopColor="rgba(30, 58, 138, 0.07)" />
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
              <HotspotPin x={165} y={132} muscle="chest" label="Göğüs" direction="right" />
              <HotspotPin x={102} y={122} muscle="shoulder" label="Omuz" direction="left" />
              <HotspotPin x={90} y={168} muscle="biceps" label="Biceps" direction="left" />
              <HotspotPin x={160} y={196} muscle="abs" label="Karın" direction="right" />
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
              <HotspotPin x={172} y={148} muscle="back" label="Sırt & Kanat" direction="right" />
              <HotspotPin x={104} y={124} muscle="shoulder" label="Arka Omuz" direction="left" />
              <HotspotPin x={226} y={182} muscle="triceps" label="Triceps" direction="right" />
              <HotspotPin x={136} y={265} muscle="glutes" label="Kalça" direction="left" />
              <HotspotPin x={188} y={330} muscle="hamstring" label="Arka Bacak" direction="right" />
              <HotspotPin x={132} y={420} muscle="calves" label="Kalf" direction="left" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
