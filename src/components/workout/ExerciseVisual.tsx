import React, { useState } from 'react';
import { MuscleGroup } from '../../types/workout';
import { muscleMetadata } from '../../data/muscleMetadata';
import { FRONT_PATHS, BACK_PATHS } from '../../data/bodyMapPaths';

export interface ExerciseVisualProps {
  exerciseId?: string;
  muscle: MuscleGroup;
  size?: number;
  width?: number | string;
  height?: number | string;
  className?: string;
  showBadgeContainer?: boolean;
  style?: React.CSSProperties;
  objectFit?: 'cover' | 'contain';
  onImageClick?: () => void;
}

export interface ExerciseEquipmentBadge {
  icon: string;
  label: string;
  subType?: string;
}

// Map of custom 3D anatomical figure renders
export const EXERCISE_IMAGE_MAP: Record<string, string> = {
  bench: '/exercises/bench.jpg',
  incline_bench: '/exercises/incline_bench.jpg',
  latpull: '/exercises/latpull.jpg',
  row: '/exercises/row.jpg',
  tbar_row: '/exercises/tbar_row.jpg',
  shoulder_press: '/exercises/shoulder_press.jpg',
  shoulder_fly: '/exercises/shoulder_fly.jpg',
  face_pull: '/exercises/face_pull.jpg',
  biceps: '/exercises/biceps.jpg',
  hammer_curl: '/exercises/hammer_curl.jpg',
  triceps: '/exercises/triceps.jpg',
  skull_crusher: '/exercises/skull_crusher.jpg',
  squat: '/exercises/squat.jpg',
  leg_press: '/exercises/leg_press.jpg',
  quad_ext: '/exercises/quad_ext.jpg',
  deadlift: '/exercises/deadlift.jpg',
  ham_ext: '/exercises/ham_ext.jpg',
  hip_thrust: '/exercises/hip_thrust.jpg',
  adductor: '/exercises/adductor.jpg',
  abductor: '/exercises/abductor.jpg',
  calf_raise: '/exercises/calf_raise.jpg',
  cable_crunch: '/exercises/cable_crunch.jpg',
  hanging_leg_raise: '/exercises/hanging_leg_raise.jpg',
  plank: '/exercises/plank.jpg'
};

export const getExerciseEquipment = (exerciseId?: string, muscle?: MuscleGroup): ExerciseEquipmentBadge => {
  switch (exerciseId) {
    case 'bench':
      return { icon: '🏋️', label: 'Barbell', subType: 'Düz Bench' };
    case 'incline_bench':
      return { icon: '🦾', label: 'Dumbbell', subType: '45° Eğimli' };
    case 'latpull':
      return { icon: '⚡', label: 'Kablo', subType: 'Geniş Çekiş' };
    case 'row':
      return { icon: '⚡', label: 'Kablo', subType: 'Oturarak Kürek' };
    case 'tbar_row':
      return { icon: '🏋️', label: 'T-Bar', subType: '45° Sırt' };
    case 'shoulder_press':
      return { icon: '🏋️', label: 'Barbell', subType: 'Baş Üstü' };
    case 'shoulder_fly':
      return { icon: '🦾', label: 'Dumbbell', subType: 'Yan Omuz' };
    case 'face_pull':
      return { icon: '⚡', label: 'Kablo', subType: 'Arka Omuz' };
    case 'biceps':
      return { icon: '🏋️', label: 'EZ-Bar', subType: 'Peak Curl' };
    case 'hammer_curl':
      return { icon: '🦾', label: 'Dumbbell', subType: 'Nötr Tutuş' };
    case 'triceps':
      return { icon: '⚡', label: 'Kablo', subType: 'Pushdown' };
    case 'skull_crusher':
      return { icon: '🏋️', label: 'EZ-Bar', subType: 'Alın Üstü' };
    case 'squat':
      return { icon: '🏋️', label: 'Barbell', subType: 'Squat Rack' };
    case 'leg_press':
      return { icon: '⚡', label: 'Makine', subType: '45° Kızak' };
    case 'quad_ext':
      return { icon: '⚡', label: 'Makine', subType: 'Ön Bacak' };
    case 'deadlift':
      return { icon: '🏋️', label: 'Barbell', subType: 'Deadlift' };
    case 'ham_ext':
      return { icon: '⚡', label: 'Makine', subType: 'Arka Bacak' };
    case 'hip_thrust':
      return { icon: '🏋️', label: 'Barbell', subType: 'Kalça Köprü' };
    case 'adductor':
      return { icon: '⚡', label: 'Makine', subType: 'İç Bacak' };
    case 'abductor':
      return { icon: '⚡', label: 'Makine', subType: 'Dış Kalça' };
    case 'calf_raise':
      return { icon: '⚡', label: 'Blok', subType: 'Parmak Ucu' };
    case 'cable_crunch':
      return { icon: '⚡', label: 'Kablo', subType: 'Karın Büküş' };
    case 'hanging_leg_raise':
      return { icon: '🦾', label: 'Barfiks', subType: '90° L-Hang' };
    case 'plank':
      return { icon: '⚡', label: 'Zemin', subType: 'İzometrik' };
    default:
      if (muscle === 'chest') return { icon: '🏋️', label: 'Göğüs' };
      if (muscle === 'back') return { icon: '⚡', label: 'Sırt' };
      if (muscle === 'shoulder') return { icon: '🏋️', label: 'Omuz' };
      if (muscle === 'biceps') return { icon: '🦾', label: 'Biceps' };
      if (muscle === 'triceps') return { icon: '⚡', label: 'Triceps' };
      if (muscle === 'quads') return { icon: '🏋️', label: 'Ön Bacak' };
      if (muscle === 'hamstring') return { icon: '🏋️', label: 'Arka Bacak' };
      if (muscle === 'glutes') return { icon: '🏋️', label: 'Kalça' };
      if (muscle === 'calves') return { icon: '⚡', label: 'Kalf' };
      if (muscle === 'abs') return { icon: '⚡', label: 'Karın' };
      return { icon: '🔥', label: 'Egzersiz' };
  }
};

interface ExerciseFramingConfig {
  view: 'front' | 'back';
  viewBox: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  contextKeys: string[];
}

const DEFAULT_CONFIGS: Record<MuscleGroup, ExerciseFramingConfig> = {
  chest: {
    view: 'front',
    viewBox: '74 75 172 118',
    primaryMuscles: ['chest'],
    contextKeys: ['neck', 'shoulder', 'biceps', 'abs']
  },
  back: {
    view: 'back',
    viewBox: '70 50 180 180',
    primaryMuscles: ['back'],
    contextKeys: ['head', 'shoulder', 'triceps', 'glutes']
  },
  shoulder: {
    view: 'front',
    viewBox: '70 60 180 115',
    primaryMuscles: ['shoulder'],
    contextKeys: ['head', 'neck', 'chest', 'biceps']
  },
  biceps: {
    view: 'front',
    viewBox: '60 100 200 115',
    primaryMuscles: ['biceps'],
    contextKeys: ['shoulder', 'chest', 'abs', 'forearms']
  },
  triceps: {
    view: 'back',
    viewBox: '58 105 204 115',
    primaryMuscles: ['triceps'],
    contextKeys: ['shoulder', 'back', 'forearms']
  },
  abs: {
    view: 'front',
    viewBox: '78 125 164 145',
    primaryMuscles: ['abs'],
    contextKeys: ['chest', 'biceps', 'pelvis', 'quads']
  },
  quads: {
    view: 'front',
    viewBox: '78 210 164 165',
    primaryMuscles: ['quads'],
    contextKeys: ['abs', 'pelvis', 'knees', 'calves']
  },
  hamstring: {
    view: 'back',
    viewBox: '72 210 176 165',
    primaryMuscles: ['hamstring'],
    contextKeys: ['glutes', 'calves']
  },
  glutes: {
    view: 'back',
    viewBox: '70 150 180 170',
    primaryMuscles: ['glutes'],
    contextKeys: ['back', 'hamstring']
  },
  calves: {
    view: 'back',
    viewBox: '85 345 150 150',
    primaryMuscles: ['calves'],
    contextKeys: ['hamstring', 'feet']
  },
  cardio: {
    view: 'front',
    viewBox: '74 75 172 118',
    primaryMuscles: ['chest'],
    contextKeys: ['neck', 'shoulder', 'abs']
  }
};

export const ExerciseVisual: React.FC<ExerciseVisualProps> = ({
  exerciseId,
  muscle,
  size = 40,
  width,
  height,
  className = '',
  showBadgeContainer: _showBadgeContainer = false,
  style = {},
  objectFit = 'contain',
  onImageClick
}) => {
  const [imgError, setImgError] = useState(false);
  const meta = muscleMetadata[muscle] || muscleMetadata.chest;
  const primaryColor = meta.color;
  const glowColor = meta.glowColor || primaryColor;

  const w = width ?? size;
  const h = height ?? size;

  const imageSrc = exerciseId ? EXERCISE_IMAGE_MAP[exerciseId] : undefined;

  // Render 3D High-Detail Anatomical Movement Figure
  if (imageSrc && !imgError) {
    const isContain = objectFit === 'contain';

    return (
      <div
        onClick={onImageClick}
        style={{
          position: 'relative',
          width: w,
          height: h,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderRadius: style.borderRadius !== undefined ? style.borderRadius : 'var(--radius-md)',
          background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.5) 0%, rgba(10, 15, 26, 0.98) 100%)',
          boxShadow: `0 3px 12px rgba(0, 0, 0, 0.4), 0 0 10px ${primaryColor}15`,
          cursor: onImageClick ? 'pointer' : undefined,
          ...style
        }}
        className={`exercise-visual-image-wrapper ${className}`}
      >
        {/* Ambient blurred backdrop for letterboxing fill so wide containers stay immersive & seamless */}
        {isContain && (
          <img
            src={imageSrc}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: '-10%',
              width: '120%',
              height: '120%',
              objectFit: 'cover',
              filter: 'blur(22px) brightness(0.35) saturate(1.3)',
              opacity: 0.65,
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Sharp, uncropped high-definition 3D movement visual */}
        <img
          src={imageSrc}
          alt={exerciseId}
          onError={() => setImgError(true)}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            objectFit: objectFit,
            objectPosition: 'center center',
            display: 'block',
            filter: 'contrast(1.04) brightness(1.0) drop-shadow(0 4px 16px rgba(0, 0, 0, 0.65))',
            zIndex: 1,
            transition: 'transform 0.3s ease'
          }}
          loading="lazy"
        />

        {/* Ambient Edge Glow Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            boxShadow: `inset 0 0 16px rgba(10, 15, 26, 0.7), inset 0 0 1px ${primaryColor}40`,
            borderRadius: 'inherit',
            zIndex: 2
          }}
        />
      </div>
    );
  }

  // Fallback: Vector Anatomical Silhouette with Glowing Target Muscle
  const config = DEFAULT_CONFIGS[muscle] || DEFAULT_CONFIGS.chest;
  const pathSource = config.view === 'front' ? FRONT_PATHS : BACK_PATHS;
  const primaryMuscles = config.primaryMuscles;
  const secondaryMuscles = config.secondaryMuscles || [];
  const idPrefix = `hero-art-${exerciseId || muscle}`;

  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: h,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: style.borderRadius !== undefined ? style.borderRadius : 'var(--radius-md)',
        ...style
      }}
      className={`exercise-visual-wrapper ${className}`}
    >
      <svg
        viewBox={config.viewBox}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{
          display: 'block',
          overflow: 'hidden',
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))'
        }}
      >
        <defs>
          <linearGradient id={`${idPrefix}-base`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e2c44" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id={`${idPrefix}-primary`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="25%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={primaryColor} />
          </linearGradient>

          <linearGradient id={`${idPrefix}-secondary`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="35%" stopColor={primaryColor} stopOpacity="0.75" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          <filter id={`${idPrefix}-glow`} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={glowColor} floodOpacity="0.95" />
          </filter>

          <radialGradient id={`${idPrefix}-backlight`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.25" />
            <stop offset="65%" stopColor="rgba(30, 58, 138, 0.06)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="320" height="520" fill={`url(#${idPrefix}-backlight)`} />

        <g className="anatomy-context-parts" opacity="0.85">
          {config.contextKeys.map((key) => {
            const isSecondary = secondaryMuscles.includes(key);
            const paths = pathSource[key] || [];

            return paths.map((d, idx) => (
              <path
                key={`ctx-${key}-${idx}`}
                d={d}
                fill={isSecondary ? `url(#${idPrefix}-secondary)` : `url(#${idPrefix}-base)`}
                stroke={isSecondary ? 'rgba(255, 255, 255, 0.65)' : '#384d6b'}
                strokeWidth={isSecondary ? '1.5' : '1.3'}
                strokeLinejoin="round"
              />
            ));
          })}
        </g>

        <g
          className="anatomy-target-muscle"
          style={{
            filter: `url(#${idPrefix}-glow)`
          }}
        >
          {primaryMuscles.map((key) => {
            const paths = pathSource[key] || [];
            return paths.map((d, idx) => (
              <path
                key={`primary-${key}-${idx}`}
                d={d}
                fill={`url(#${idPrefix}-primary)`}
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            ));
          })}
        </g>
      </svg>
    </div>
  );
};
