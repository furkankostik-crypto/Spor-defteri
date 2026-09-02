import React from 'react';
import { MuscleGroup } from '../types/workout';
import { muscleMetadata } from './muscleMetadata';
import { FRONT_PATHS, BACK_PATHS } from './bodyMapPaths';

export interface AnatomyIconProps {
  muscle: MuscleGroup;
  size?: number;
  width?: number | string;
  height?: number | string;
  highlighted?: boolean;
  className?: string;
  style?: React.CSSProperties;
  zoom?: number;
}

interface MuscleCropConfig {
  view: 'front' | 'back';
  viewBox: string;
  targetKey: string;
  contextKeys: string[];
}

const MUSCLE_CROP_CONFIGS: Record<MuscleGroup, MuscleCropConfig> = {
  chest: {
    view: 'front',
    viewBox: '78 80 164 98',
    targetKey: 'chest',
    contextKeys: ['neck', 'shoulder', 'biceps', 'abs']
  },
  back: {
    view: 'back',
    viewBox: '78 55 164 175',
    targetKey: 'back',
    contextKeys: ['head', 'shoulder', 'triceps', 'glutes']
  },
  shoulder: {
    view: 'front',
    viewBox: '74 65 172 95',
    targetKey: 'shoulder',
    contextKeys: ['head', 'neck', 'chest', 'biceps']
  },
  biceps: {
    view: 'front',
    viewBox: '65 110 190 95',
    targetKey: 'biceps',
    contextKeys: ['shoulder', 'chest', 'abs', 'forearms']
  },
  triceps: {
    view: 'back',
    viewBox: '60 110 200 95',
    targetKey: 'triceps',
    contextKeys: ['shoulder', 'back', 'forearms']
  },
  abs: {
    view: 'front',
    viewBox: '88 135 144 125',
    targetKey: 'abs',
    contextKeys: ['chest', 'biceps', 'pelvis', 'quads']
  },
  quads: {
    view: 'front',
    viewBox: '88 230 144 125',
    targetKey: 'quads',
    contextKeys: ['abs', 'knees', 'calves']
  },
  hamstring: {
    view: 'back',
    viewBox: '78 225 164 145',
    targetKey: 'hamstring',
    contextKeys: ['glutes', 'calves']
  },
  glutes: {
    view: 'back',
    viewBox: '78 160 164 150',
    targetKey: 'glutes',
    contextKeys: ['back', 'hamstring']
  },
  calves: {
    view: 'back',
    viewBox: '92 355 136 130',
    targetKey: 'calves',
    contextKeys: ['hamstring', 'feet']
  },
  cardio: {
    view: 'front',
    viewBox: '85 75 150 100',
    targetKey: 'chest',
    contextKeys: ['neck', 'shoulder', 'abs']
  }
};

export const AnatomyIcon: React.FC<AnatomyIconProps> = ({
  muscle,
  size = 28,
  width,
  height,
  highlighted = true,
  className = '',
  style = {},
  zoom
}) => {
  const meta = muscleMetadata[muscle] || muscleMetadata.chest;
  const color = highlighted ? meta.color : '#64748b';
  const glow = highlighted ? meta.glowColor : 'transparent';
  
  const config = MUSCLE_CROP_CONFIGS[muscle] || MUSCLE_CROP_CONFIGS.chest;
  const pathSource = config.view === 'front' ? FRONT_PATHS : BACK_PATHS;
  
  const targetPaths = pathSource[config.targetKey] || [];
  const w = width ?? size;
  const h = height ?? size;

  return (
    <svg
      viewBox={config.viewBox}
      width={w}
      height={h}
      preserveAspectRatio="xMidYMid meet"
      className={`anatomy-icon-svg muscle-${muscle} ${className}`}
      style={{
        overflow: 'hidden',
        transform: zoom ? `scale(${zoom})` : undefined,
        transformOrigin: 'center center',
        display: 'block',
        flexShrink: 0,
        ...style
      }}
    >
      <defs>
        {/* Subtle Backdrop Gradient for Context Muscles */}
        <linearGradient id={`ctx-grad-${muscle}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Dynamic Highlight Gradient for Active Muscle */}
        <linearGradient id={`active-grad-${muscle}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="30%" stopColor={color} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>

        {/* Glow Filter for Active Muscle Highlight */}
        <filter id={`glow-${muscle}`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor={glow} floodOpacity="0.75" />
        </filter>
      </defs>

      {/* 1. Context Anatomical Body Parts (Subtle Dark Framing) */}
      <g className="anatomy-context-parts" opacity="0.65">
        {config.contextKeys.map((key) => {
          const paths = pathSource[key] || [];
          return paths.map((d, idx) => (
            <path
              key={`ctx-${key}-${idx}`}
              d={d}
              fill={`url(#ctx-grad-${muscle})`}
              stroke="#334766"
              strokeWidth="1.3"
            />
          ));
        })}
      </g>

      {/* 2. Target Muscle Group (Vibrantly Colored, High-Definition Highlight) */}
      <g
        className="anatomy-target-muscle"
        style={{
          filter: highlighted ? `url(#glow-${muscle})` : 'none'
        }}
      >
        {targetPaths.map((d, idx) => (
          <path
            key={`target-${idx}`}
            d={d}
            fill={highlighted ? `url(#active-grad-${muscle})` : '#334155'}
            stroke={highlighted ? '#ffffff' : '#64748b'}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        ))}
      </g>
    </svg>
  );
};
