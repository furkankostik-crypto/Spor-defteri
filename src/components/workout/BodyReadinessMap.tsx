import React from 'react';
import { MuscleGroup, SplitType } from '../../types/workout';
import { FRONT_PATHS, BACK_PATHS } from '../../data/bodyMapPaths';
import { sounds } from '../../utils/audio';

export interface BodyReadinessMapProps {
  muscleRecoveryMap?: Partial<
    Record<
      MuscleGroup,
      {
        daysSinceTrained: number;
        recoveryStatus: 'fresh' | 'recovered' | 'recovering';
      }
    >
  >;
  muscleDevelopmentMap?: Partial<
    Record<
      MuscleGroup,
      {
        weeklySets: number;
        level: number;
      }
    >
  >;
  mode?: 'readiness' | 'development';
  hasAnyWorkouts: boolean;
  onSelectSplit?: (split: SplitType) => void;
  compact?: boolean;
}

const MUSCLE_TO_SPLIT: Record<MuscleGroup, SplitType> = {
  chest: 'upper',
  back: 'upper',
  shoulder: 'upper',
  biceps: 'upper',
  triceps: 'upper',
  quads: 'lower',
  hamstring: 'lower',
  glutes: 'lower',
  calves: 'lower',
  abs: 'custom',
  cardio: 'custom'
};

export const BodyReadinessMap: React.FC<BodyReadinessMapProps> = ({
  muscleRecoveryMap = {},
  muscleDevelopmentMap = {},
  mode = 'readiness',
  hasAnyWorkouts,
  onSelectSplit,
  compact = false
}) => {
  const getMuscleStyle = (muscle: MuscleGroup) => {
    if (mode === 'development') {
      const dev = muscleDevelopmentMap[muscle];
      const sets = dev?.weeklySets ?? 0;
      const lvl = dev?.level ?? 1;

      if (sets >= 12) {
        return {
          fill: '#fbbf24',
          fillOpacity: 0.86,
          stroke: '#fde68a',
          glow: 'rgba(251, 191, 36, 0.45)'
        };
      }
      if (sets >= 6) {
        return {
          fill: '#10b981',
          fillOpacity: 0.82,
          stroke: '#34d399',
          glow: 'rgba(16, 185, 129, 0.4)'
        };
      }
      if (sets > 0) {
        return {
          fill: '#38bdf8',
          fillOpacity: 0.8,
          stroke: '#7dd3fc',
          glow: 'rgba(56, 189, 248, 0.4)'
        };
      }
      if (lvl > 1) {
        return {
          fill: '#a855f7',
          fillOpacity: 0.55,
          stroke: '#c084fc',
          glow: 'rgba(168, 85, 247, 0.3)'
        };
      }
      return {
        fill: '#1e293b',
        fillOpacity: 0.65,
        stroke: '#334155',
        glow: 'rgba(51, 65, 85, 0.2)'
      };
    }

    if (!hasAnyWorkouts) {
      return {
        fill: '#10b981',
        fillOpacity: 0.72,
        stroke: '#34d399',
        glow: 'rgba(16, 185, 129, 0.35)'
      };
    }

    const info = muscleRecoveryMap[muscle];
    const days = info?.daysSinceTrained ?? 99;

    if (days === 0) {
      return {
        fill: '#f59e0b',
        fillOpacity: 0.85,
        stroke: '#fbbf24',
        glow: 'rgba(245, 158, 11, 0.45)'
      };
    }
    if (days === 1) {
      return {
        fill: '#38bdf8',
        fillOpacity: 0.8,
        stroke: '#7dd3fc',
        glow: 'rgba(56, 189, 248, 0.4)'
      };
    }
    return {
      fill: '#10b981',
      fillOpacity: 0.75,
      stroke: '#34d399',
      glow: 'rgba(16, 185, 129, 0.35)'
    };
  };

  const handleMuscleClick = (muscle: MuscleGroup) => {
    if (!onSelectSplit) return;
    sounds.playPop();
    onSelectSplit(MUSCLE_TO_SPLIT[muscle] || 'upper');
  };

  const renderContextParts = (source: Record<string, string[]>, keys: string[], prefix: string) =>
    keys.map((key) =>
      (source[key] || []).map((d, idx) => (
        <path
          key={`${prefix}-ctx-${key}-${idx}`}
          d={d}
          fill="#151f32"
          stroke="#26354d"
          strokeWidth="1.2"
        />
      ))
    );

  const renderInteractiveMuscle = (
    source: Record<string, string[]>,
    key: MuscleGroup,
    prefix: string
  ) => {
    const paths = source[key] || [];
    const st = getMuscleStyle(key);
    return (
      <g
        key={`${prefix}-m-${key}`}
        onClick={() => handleMuscleClick(key)}
        style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
      >
        {paths.map((d, idx) => (
          <path
            key={`${prefix}-p-${key}-${idx}`}
            d={d}
            fill={st.fill}
            fillOpacity={st.fillOpacity}
            stroke={st.stroke}
            strokeWidth="1.35"
            strokeLinejoin="round"
          />
        ))}
      </g>
    );
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: compact ? 2 : 4,
        background:
          mode === 'development'
            ? 'radial-gradient(circle at 50% 45%, rgba(56, 189, 248, 0.1) 0%, rgba(15, 23, 42, 0.45) 75%)'
            : 'radial-gradient(circle at 50% 45%, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.45) 75%)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: compact ? 10 : 12,
        padding: compact ? '4px 3px 3px 3px' : '6px 5px 5px 5px',
        alignItems: 'center',
        justifyItems: 'center',
        position: 'relative',
        height: '100%',
        minHeight: 0,
        boxSizing: 'border-box'
      }}
    >
      {/* FRONT SILHOUETTE */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          minHeight: 0
        }}
      >
        <svg
          viewBox="35 16 250 488"
          style={{
            width: '100%',
            height: '100%',
            minHeight: compact ? 70 : 106,
            maxHeight: compact ? 96 : 168,
            display: 'block',
            overflow: 'visible'
          }}
        >
          {renderContextParts(
            FRONT_PATHS,
            ['head', 'neck', 'forearms', 'hands', 'pelvis', 'knees', 'feet'],
            'front'
          )}
          {renderInteractiveMuscle(FRONT_PATHS, 'shoulder', 'front')}
          {renderInteractiveMuscle(FRONT_PATHS, 'chest', 'front')}
          {renderInteractiveMuscle(FRONT_PATHS, 'biceps', 'front')}
          {renderInteractiveMuscle(FRONT_PATHS, 'abs', 'front')}
          {renderInteractiveMuscle(FRONT_PATHS, 'quads', 'front')}
          {renderInteractiveMuscle(FRONT_PATHS, 'calves', 'front')}
        </svg>
        <span
          style={{
            fontSize: compact ? 7.5 : 8.5,
            fontWeight: 700,
            color: 'var(--text-dim)',
            letterSpacing: '0.06em',
            marginTop: 2,
            flexShrink: 0
          }}
        >
          ÖN
        </span>
      </div>

      {/* BACK SILHOUETTE */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          minHeight: 0
        }}
      >
        <svg
          viewBox="35 16 250 488"
          style={{
            width: '100%',
            height: '100%',
            minHeight: compact ? 70 : 106,
            maxHeight: compact ? 96 : 168,
            display: 'block',
            overflow: 'visible'
          }}
        >
          {renderContextParts(
            BACK_PATHS,
            ['head', 'forearms', 'hands', 'feet'],
            'back'
          )}
          {renderInteractiveMuscle(BACK_PATHS, 'shoulder', 'back')}
          {renderInteractiveMuscle(BACK_PATHS, 'back', 'back')}
          {renderInteractiveMuscle(BACK_PATHS, 'triceps', 'back')}
          {renderInteractiveMuscle(BACK_PATHS, 'glutes', 'back')}
          {renderInteractiveMuscle(BACK_PATHS, 'hamstring', 'back')}
          {renderInteractiveMuscle(BACK_PATHS, 'calves', 'back')}
        </svg>
        <span
          style={{
            fontSize: compact ? 7.5 : 8.5,
            fontWeight: 700,
            color: 'var(--text-dim)',
            letterSpacing: '0.06em',
            marginTop: 2,
            flexShrink: 0
          }}
        >
          ARKA
        </span>
      </div>
    </div>
  );
};
