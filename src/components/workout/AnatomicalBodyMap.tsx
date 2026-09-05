import React, { useState } from 'react';
import { MuscleGroup } from '../../types/workout';
import { AnatomyIcon } from '../../data/anatomyIcons';
import { muscleMetadata } from '../../data/muscleMetadata';
import { useWorkout } from '../../context/WorkoutContext';
import { sounds } from '../../utils/audio';
import { RotateCw, Sparkles } from 'lucide-react';

interface AnatomicalBodyMapProps {
  onSelectMuscle: (muscle: MuscleGroup) => void;
  selectedMuscle?: MuscleGroup | null;
}

import { FRONT_PATHS, BACK_PATHS } from '../../data/bodyMapPaths';

export const AnatomicalBodyMap: React.FC<AnatomicalBodyMapProps> = ({
  onSelectMuscle,
  selectedMuscle
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
    return '#5b769e'; // High-contrast distinct anatomical outline
  };

  const getMuscleOpacity = (muscle: MuscleGroup) => {
    const isSelected = selectedMuscle === muscle;
    const isHovered = hoveredMuscle === muscle;
    const isTrained = isMuscleTrained(muscle);

    if (isSelected) return 1.0;
    if (isHovered) return 0.98;
    if (isTrained) return 0.95;
    return 0.92; // High opacity so the figure is immediately clear and vibrant
  };

  // Hotspot Pinpoint component
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

    return (
      <g
        className="hotspot-pin"
        onClick={() => handleMuscleClick(muscle)}
        onMouseEnter={() => setHoveredMuscle(muscle)}
        onMouseLeave={() => setHoveredMuscle(null)}
        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
      >
        {/* Radar Wave */}
        <circle
          cx={x}
          cy={y}
          r={isHovered || isSelected ? 14 : 8}
          fill="none"
          stroke={isTrained ? '#10b981' : isHovered ? meta.color : 'rgba(255, 255, 255, 0.75)'}
          strokeWidth="1.6"
          className="radar-pulse"
        />

        {/* Center Point */}
        <circle
          cx={x}
          cy={y}
          r="4.5"
          fill={isTrained ? '#10b981' : isHovered || isSelected ? meta.color : '#ffffff'}
          filter="url(#glow-dot)"
        />

        {/* Label Tag on larger interaction */}
        {(isHovered || isSelected || isTrained) && (
          <g style={{ pointerEvents: 'none' }}>
            <rect
              x={direction === 'right' ? x + 10 : x - 94}
              y={y - 13}
              width="84"
              height="26"
              rx="6"
              fill="rgba(15, 23, 42, 0.96)"
              stroke={isTrained ? '#10b981' : meta.color}
              strokeWidth="1.4"
              filter="url(#shadow-subtle)"
            />
            <text
              x={direction === 'right' ? x + 52 : x - 52}
              y={y + 4}
              fill="#ffffff"
              fontSize="10.5"
              fontWeight="bold"
              textAnchor="middle"
            >
              {isTrained ? `✓ ${trainedSets} Set` : label}
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
          marginBottom: 12,
          position: 'relative',
          zIndex: 10
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>🗺️</span>
            <span style={{ fontWeight: 800, fontSize: 15, color: '#ffffff' }}>
              Anatomik Vücut Haritası
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Çalışmak istediğin kas bölgesine dokun
          </div>
        </div>

        {/* Front / Back Flip Button */}
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
            transition: 'all 0.2s'
          }}
        >
          <RotateCw size={13} color="var(--accent)" />
          <span>{view === 'front' ? 'Arka Vücut' : 'Ön Vücut'}</span>
        </button>
      </div>

      {/* Current Hover / Selected Info Banner */}
      <div
        style={{
          minHeight: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          background: 'rgba(15, 23, 42, 0.75)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          marginBottom: 12,
          fontSize: 12,
          position: 'relative',
          zIndex: 10,
          backdropFilter: 'blur(8px)'
        }}
      >
        {hoveredMuscle ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AnatomyIcon muscle={hoveredMuscle} size={20} />
              <div>
                <strong style={{ color: muscleMetadata[hoveredMuscle].color }}>
                  {muscleMetadata[hoveredMuscle].name}
                </strong>
                <span style={{ color: 'var(--text-dim)', fontSize: 10, marginLeft: 6 }}>
                  ({muscleMetadata[hoveredMuscle].latinName})
                </span>
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)' }}>
              {muscleStats[hoveredMuscle].exerciseCount} Hareket • Tıkla & Gör →
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Sparkles size={14} color="var(--gold)" />
            <span>Harita üzerinde kas grubunu seç ve hareketleri aç</span>
          </div>
        )}
      </div>

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
            <filter id="shadow-subtle" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.4" />
            </filter>
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
              <HotspotPin x={160} y={130} muscle="chest" label="Göğüs" />
              <HotspotPin x={100} y={125} muscle="shoulder" label="Omuz" direction="left" />
              <HotspotPin x={90} y={168} muscle="biceps" label="Biceps" direction="left" />
              <HotspotPin x={160} y={195} muscle="abs" label="Karın & Core" />
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
              <HotspotPin x={160} y={155} muscle="back" label="Sırt & Kanat" />
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

