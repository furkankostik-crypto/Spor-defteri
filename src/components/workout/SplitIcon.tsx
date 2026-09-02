import React from 'react';
import { SplitType } from '../../types/workout';

interface SplitIconProps {
  split: SplitType;
  size?: number;
  active?: boolean;
  className?: string;
}

export const SplitIcon: React.FC<SplitIconProps> = ({
  split,
  size = 28,
  active = false,
  className = ''
}) => {
  const baseFill = active ? '#1a273b' : '#131c2d';
  const baseStroke = active ? '#5b769e' : '#334764';

  // Upper Body Figure (Highlights: Chest, Shoulders, Arms, Upper Back)
  if (split === 'upper') {
    return (
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        className={`split-icon split-upper ${className}`}
        style={{ overflow: 'visible', filter: active ? 'drop-shadow(0 0 6px rgba(255, 71, 87, 0.45))' : 'none' }}
      >
        <defs>
          <linearGradient id="upperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4757" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        {/* Head */}
        <circle cx="16" cy="5" r="2.8" fill={baseFill} stroke={baseStroke} strokeWidth="1" />
        
        {/* Neck */}
        <path d="M15 7.8 h2 v2 h-2 z" fill={baseFill} stroke={baseStroke} strokeWidth="0.8" />
        
        {/* Upper Body (Active Highlight: Shoulders + Chest + Arms) */}
        {/* Shoulders */}
        <path
          d="M9 10 Q16 8.5 23 10 L25 13 L22 14 L16 11.5 L10 14 L7 13 Z"
          fill="#f59e0b"
          stroke="#fcd34d"
          strokeWidth="0.8"
        />
        {/* Chest */}
        <path
          d="M11.5 11.5 Q16 11 20.5 11.5 L20 16 Q16 17.5 12 16 Z"
          fill="#ff4757"
          stroke="#ff8b94"
          strokeWidth="0.8"
        />
        {/* Arms / Biceps */}
        <path d="M7 13 L5.5 18 L7.5 19 L9.5 14 Z" fill="#ec4899" stroke="#f472b6" strokeWidth="0.6" />
        <path d="M25 13 L26.5 18 L24.5 19 L22.5 14 Z" fill="#ec4899" stroke="#f472b6" strokeWidth="0.6" />

        {/* Lower Body (Dimmed Base Silhouette) */}
        {/* Waist & Hips */}
        <path d="M12.5 16.5 L19.5 16.5 L18.5 20.5 L13.5 20.5 Z" fill={baseFill} stroke={baseStroke} strokeWidth="0.8" />
        {/* Legs */}
        <path d="M13.5 20.5 L12 28 L14 28.5 L15.5 21 Z" fill={baseFill} stroke={baseStroke} strokeWidth="0.8" />
        <path d="M18.5 20.5 L20 28 L18 28.5 L16.5 21 Z" fill={baseFill} stroke={baseStroke} strokeWidth="0.8" />
      </svg>
    );
  }

  // Lower Body Figure (Highlights: Quads, Glutes, Hamstrings, Calves)
  if (split === 'lower') {
    return (
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        className={`split-icon split-lower ${className}`}
        style={{ overflow: 'visible', filter: active ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.45))' : 'none' }}
      >
        {/* Head */}
        <circle cx="16" cy="5" r="2.8" fill={baseFill} stroke={baseStroke} strokeWidth="1" />
        
        {/* Torso (Dimmed Base) */}
        <path d="M10 10 Q16 9 22 10 L20.5 16.5 Q16 17.5 11.5 16.5 Z" fill={baseFill} stroke={baseStroke} strokeWidth="0.8" />
        {/* Arms (Dimmed Base) */}
        <path d="M8.5 10.5 L6 17 L7.8 17.5 L10 12 Z" fill={baseFill} stroke={baseStroke} strokeWidth="0.6" />
        <path d="M23.5 10.5 L26 17 L24.2 17.5 L22 12 Z" fill={baseFill} stroke={baseStroke} strokeWidth="0.6" />

        {/* Glutes / Pelvis */}
        <path d="M12 16.5 L20 16.5 L19 20 L13 20 Z" fill="#f43f5e" stroke="#fb7185" strokeWidth="0.8" />

        {/* Quads / Upper Leg (Active Emerald Highlight) */}
        <path d="M12.5 19.5 L10.5 25 L14.5 25 L15.5 20 Z" fill="#10b981" stroke="#34d399" strokeWidth="0.8" />
        <path d="M19.5 19.5 L21.5 25 L17.5 25 L16.5 20 Z" fill="#10b981" stroke="#34d399" strokeWidth="0.8" />

        {/* Calves (Active Cyan Highlight) */}
        <path d="M11 25.5 L11.5 30 L13.5 30 L14 25.5 Z" fill="#06b6d4" stroke="#67e8f9" strokeWidth="0.7" />
        <path d="M21 25.5 L20.5 30 L18.5 30 L18 25.5 Z" fill="#06b6d4" stroke="#67e8f9" strokeWidth="0.7" />
      </svg>
    );
  }

  // Full Body Figure (All muscle regions illuminated in a high-tech glowing gradient)
  if (split === 'full') {
    return (
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        className={`split-icon split-full ${className}`}
        style={{ overflow: 'visible', filter: active ? 'drop-shadow(0 0 7px rgba(251, 191, 36, 0.5))' : 'none' }}
      >
        <defs>
          <linearGradient id="fullBodyGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="35%" stopColor="#ff4757" />
            <stop offset="70%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        {/* Head */}
        <circle cx="16" cy="5" r="2.8" fill="#f59e0b" stroke="#fde68a" strokeWidth="1" />
        
        {/* Shoulders & Chest */}
        <path d="M9 10 Q16 8.5 23 10 L25 13 L22 14 L16 11.5 L10 14 L7 13 Z" fill="#f59e0b" stroke="#fde68a" strokeWidth="0.7" />
        <path d="M11.5 11.5 Q16 11 20.5 11.5 L20 16 Q16 17.5 12 16 Z" fill="#ff4757" stroke="#fca5a5" strokeWidth="0.8" />
        
        {/* Arms */}
        <path d="M7 13 L5.5 18 L7.5 18.5 L9.5 14 Z" fill="#ec4899" stroke="#f472b6" strokeWidth="0.6" />
        <path d="M25 13 L26.5 18 L24.5 18.5 L22.5 14 Z" fill="#ec4899" stroke="#f472b6" strokeWidth="0.6" />

        {/* Core / Abs */}
        <path d="M13 16.5 L19 16.5 L18.5 20 L13.5 20 Z" fill="#eab308" stroke="#fef08a" strokeWidth="0.7" />

        {/* Legs / Quads */}
        <path d="M12.5 19.5 L10.5 25 L14.5 25 L15.5 20 Z" fill="#10b981" stroke="#6ee7b7" strokeWidth="0.8" />
        <path d="M19.5 19.5 L21.5 25 L17.5 25 L16.5 20 Z" fill="#10b981" stroke="#6ee7b7" strokeWidth="0.8" />

        {/* Calves */}
        <path d="M11 25.5 L11.5 30 L13.5 30 L14 25.5 Z" fill="#06b6d4" stroke="#a5f3fc" strokeWidth="0.7" />
        <path d="M21 25.5 L20.5 30 L18.5 30 L18 25.5 Z" fill="#06b6d4" stroke="#a5f3fc" strokeWidth="0.7" />
      </svg>
    );
  }

  // Core / Custom (Highlights: Six-Pack Abdominals, Obliques, Core Stabilizers)
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={`split-icon split-custom ${className}`}
      style={{ overflow: 'visible', filter: active ? 'drop-shadow(0 0 6px rgba(234, 179, 8, 0.45))' : 'none' }}
    >
      {/* Head */}
      <circle cx="16" cy="5" r="2.8" fill={baseFill} stroke={baseStroke} strokeWidth="1" />
      
      {/* Upper Chest / Shoulders (Base) */}
      <path d="M9 10 Q16 8.5 23 10 L25 13 L22 14 L16 11.5 L10 14 L7 13 Z" fill={baseFill} stroke={baseStroke} strokeWidth="0.7" />
      <path d="M11.5 11.5 Q16 11 20.5 11.5 L20 14.5 Q16 15 12 14.5 Z" fill={baseFill} stroke={baseStroke} strokeWidth="0.7" />
      
      {/* Arms (Base) */}
      <path d="M7 13 L5.5 18 L7.5 18.5 L9.5 14 Z" fill={baseFill} stroke={baseStroke} strokeWidth="0.6" />
      <path d="M25 13 L26.5 18 L24.5 18.5 L22.5 14 Z" fill={baseFill} stroke={baseStroke} strokeWidth="0.6" />

      {/* ACTIVE CORE & ABS (Glowing Gold Target & 6-Pack) */}
      <path
        d="M12 14.5 L20 14.5 L18.5 21 L13.5 21 Z"
        fill="#eab308"
        stroke="#fde047"
        strokeWidth="0.9"
      />
      {/* 6-Pack grid details */}
      <line x1="16" y1="14.5" x2="16" y2="20.5" stroke="#713f12" strokeWidth="0.6" />
      <line x1="13" y1="16.5" x2="19" y2="16.5" stroke="#713f12" strokeWidth="0.6" />
      <line x1="13.5" y1="18.5" x2="18.5" y2="18.5" stroke="#713f12" strokeWidth="0.6" />

      {/* Legs (Dimmed Base) */}
      <path d="M13 21 L11.5 28 L14 28.5 L15.5 21 Z" fill={baseFill} stroke={baseStroke} strokeWidth="0.8" />
      <path d="M19 21 L20.5 28 L18 28.5 L16.5 21 Z" fill={baseFill} stroke={baseStroke} strokeWidth="0.8" />
    </svg>
  );
};
