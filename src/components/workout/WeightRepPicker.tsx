import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ExerciseDefinition } from '../../types/workout';
import {
  getExerciseWeightConfig,
  getExerciseWheelWeights,
  REP_WHEEL_VALUES,
  DURATION_WHEEL_VALUES
} from '../../utils/weightPresets';
import {
  sanitizeDecimalInput,
  sanitizeIntegerInput,
  isImeComposing,
  selectAllOnFocus
} from '../../utils/inputUtils';
import { sounds } from '../../utils/audio';
import {
  Keyboard,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  CopyCheck,
  Minus,
  Plus,
  ArrowRight
} from 'lucide-react';

export interface WeightRepPickerProps {
  exercise: ExerciseDefinition;
  setIndex: number;
  totalSets: number;
  activeField: 'weight' | 'reps';
  weight: number;
  reps: number;
  isDuration: boolean;
  accentColor: string;
  bodyWeightKg?: number;
  lastWeight?: number;
  lastReps?: number;
  suggestedWeight?: number;
  suggestedReps?: number;
  prWeight?: number;
  onChangeField: (field: 'weight' | 'reps') => void;
  onChangeSetIndex: (newSetIndex: number) => void;
  onUpdateValue: (field: 'weight' | 'reps', value: number) => void;
  onApplyToAllSets: (field: 'weight' | 'reps', value: number) => void;
  onClose: () => void;
}

const TICK_WIDTH = 28; // Width in px of each ruler mark

export const WeightRepPicker: React.FC<WeightRepPickerProps> = ({
  exercise,
  setIndex,
  totalSets,
  activeField,
  weight,
  reps,
  isDuration,
  accentColor,
  bodyWeightKg = 75,
  lastWeight,
  lastReps,
  suggestedWeight,
  prWeight,
  onChangeField,
  onChangeSetIndex,
  onUpdateValue,
  onApplyToAllSets,
  onClose
}) => {
  const weightConfig = useMemo(
    () => getExerciseWeightConfig(exercise.id, exercise.muscle, exercise.category, bodyWeightKg),
    [exercise.id, exercise.muscle, exercise.category, bodyWeightKg]
  );

  const [isKeyboardMode, setIsKeyboardMode] = useState<boolean>(false);
  const [keyboardText, setKeyboardText] = useState<string>('');
  const [copiedFeedback, setCopiedFeedback] = useState<boolean>(false);

  const rulerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSoundTimeRef = useRef<number>(0);
  const lastTickIndexRef = useRef<number>(-1);

  // Ruler values sequence tailored to the active mode & exercise
  const rulerValues = useMemo<number[]>(() => {
    if (isDuration) {
      const arr = Array.from(new Set([...DURATION_WHEEL_VALUES, reps, lastReps || 0])).filter(v => v > 0);
      return arr.sort((a, b) => a - b);
    }
    if (activeField === 'weight') {
      const extras = [weight, lastWeight || 0, suggestedWeight || 0, prWeight || 0].filter(v => v > 0);
      return getExerciseWheelWeights(
        exercise.id,
        exercise.muscle,
        exercise.category,
        extras,
        bodyWeightKg
      );
    }
    // Reps sequence
    const arr = Array.from(new Set([...REP_WHEEL_VALUES, reps, lastReps || 0])).filter(v => v > 0);
    return arr.sort((a, b) => a - b);
  }, [
    isDuration,
    activeField,
    exercise.id,
    exercise.muscle,
    exercise.category,
    weight,
    reps,
    lastWeight,
    lastReps,
    suggestedWeight,
    prWeight,
    bodyWeightKg
  ]);

  const currentValue = isDuration ? reps : activeField === 'weight' ? weight : reps;

  // Fine adjustment step size
  const fineStep = useMemo(() => {
    if (isDuration) return 5;
    if (activeField === 'reps') return 1;
    return weightConfig.defaultStep;
  }, [isDuration, activeField, weightConfig.defaultStep]);

  // Sync keyboard text when switching field/set/exercise or when not actively typing in keyboard mode
  useEffect(() => {
    if (!isKeyboardMode) {
      setKeyboardText(currentValue > 0 ? String(currentValue) : '');
    }
  }, [currentValue, isKeyboardMode]);

  useEffect(() => {
    setKeyboardText(currentValue > 0 ? String(currentValue) : '');
    if (isKeyboardMode && inputRef.current) {
      const target = inputRef.current;
      target.focus();
      try {
        target.select();
      } catch {}
      setTimeout(() => {
        try {
          if (document.activeElement === target) target.select();
        } catch {}
      }, 0);
    }
  }, [activeField, setIndex, exercise.id, isKeyboardMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll ruler to target value
  const scrollRulerToValue = useCallback(
    (targetVal: number, smooth: boolean = true) => {
      const container = rulerRef.current;
      if (!container || rulerValues.length === 0) return;

      // Find closest index
      let closestIdx = 0;
      let minDiff = Math.abs(rulerValues[0] - targetVal);
      for (let i = 1; i < rulerValues.length; i++) {
        const diff = Math.abs(rulerValues[i] - targetVal);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      }

      const targetScrollLeft = closestIdx * TICK_WIDTH;
      lastTickIndexRef.current = closestIdx;
      if (Math.abs(container.scrollLeft - targetScrollLeft) > 1) {
        isProgrammaticScrollRef.current = true;
        container.scrollTo({
          left: targetScrollLeft,
          behavior: smooth ? 'smooth' : 'auto'
        });
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, smooth ? 260 : 40);
      }
    },
    [rulerValues]
  );

  // Position ruler initially or when field / set changes
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRulerToValue(currentValue, false);
    }, 25);
    return () => clearTimeout(timer);
  }, [activeField, setIndex, exercise.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle scroll on the ruler
  const handleScroll = () => {
    if (isProgrammaticScrollRef.current || !rulerRef.current) return;

    const scrollLeft = rulerRef.current.scrollLeft;
    const rawIdx = Math.round(scrollLeft / TICK_WIDTH);
    const clampedIdx = Math.max(0, Math.min(rulerValues.length - 1, rawIdx));

    // Trigger crisp tick sound & haptic ONLY when crossing a ruler tick mark boundary
    if (clampedIdx !== lastTickIndexRef.current) {
      lastTickIndexRef.current = clampedIdx;
      const now = Date.now();
      if (now - lastSoundTimeRef.current > 28) {
        sounds.playTick();
        lastSoundTimeRef.current = now;
      }
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (!rulerRef.current) return;
      const finalScrollLeft = rulerRef.current.scrollLeft;
      const finalRawIdx = Math.round(finalScrollLeft / TICK_WIDTH);
      const finalClampedIdx = Math.max(0, Math.min(rulerValues.length - 1, finalRawIdx));
      const snappedVal = rulerValues[finalClampedIdx];

      if (snappedVal !== undefined && snappedVal !== currentValue) {
        if (finalClampedIdx !== lastTickIndexRef.current) {
          lastTickIndexRef.current = finalClampedIdx;
          sounds.playTick();
        }
        const targetField = isDuration ? 'reps' : activeField;
        onUpdateValue(targetField, snappedVal);
      }
    }, 55);
  };

  // Fine adjust + / -
  const handleFineAdjust = useCallback((delta: number) => {
    sounds.playTick();
    const targetField = isDuration ? 'reps' : activeField;
    const rawNext = (currentValue || 0) + delta;
    const cleanNext =
      targetField === 'weight'
        ? Math.max(0, Math.min(999, Math.round(rawNext * 4) / 4))
        : Math.max(0, Math.min(isDuration ? 999 : 99, Math.round(rawNext)));

    onUpdateValue(targetField, cleanNext);
    setKeyboardText(cleanNext > 0 ? String(cleanNext) : '');
    scrollRulerToValue(cleanNext, true);
  }, [isDuration, activeField, currentValue, onUpdateValue, scrollRulerToValue]);

  // Intuitive hardware keyboard listener even before clicking "Klavye"
  useEffect(() => {
    if (isKeyboardMode) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      const targetField = isDuration ? 'reps' : activeField;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        sounds.playPop();
        const digit = e.key;
        setKeyboardText(digit);
        setIsKeyboardMode(true);
        const num = parseInt(digit, 10);
        if (!isNaN(num)) {
          onUpdateValue(targetField, num);
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        sounds.playPop();
        setKeyboardText('');
        setIsKeyboardMode(true);
        onUpdateValue(targetField, 0);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleFineAdjust(-fineStep);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleFineAdjust(fineStep);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        sounds.playPop();
        if (!isDuration && activeField === 'weight') {
          onChangeField('reps');
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isKeyboardMode, isDuration, activeField, fineStep, handleFineAdjust, onUpdateValue, onChangeField, onClose]);

  const handleApplyAll = () => {
    sounds.playSuccess();
    const targetField = isDuration ? 'reps' : activeField;
    onApplyToAllSets(targetField, currentValue);
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 1400);
  };

  const unitLabel = isDuration ? 'sn' : activeField === 'weight' ? 'kg' : 'tekrar';

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: 'linear-gradient(180deg, #131b2c 0%, #0a0e1a 100%)',
        borderTop: `1.5px solid ${accentColor}45`,
        boxShadow: `0 -12px 35px rgba(0, 0, 0, 0.75), 0 -2px 16px ${accentColor}18`,
        padding: '10px 14px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 25,
        animation: 'slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        flexShrink: 0,
        userSelect: 'none'
      }}
    >
      {/* 1. COMPACT TOP HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8
        }}
      >
        {/* Left: Set Switcher & Tab Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          {/* Set Navigator Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-sm)',
              height: 32,
              padding: '0 2px'
            }}
          >
            {totalSets > 1 && (
              <button
                type="button"
                disabled={setIndex <= 0}
                onClick={() => {
                  sounds.playPop();
                  onChangeSetIndex(Math.max(0, setIndex - 1));
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: setIndex <= 0 ? 'rgba(255,255,255,0.2)' : 'var(--text-muted)',
                  cursor: setIndex <= 0 ? 'default' : 'pointer',
                  padding: '4px 5px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronLeft size={14} />
              </button>
            )}
            <span style={{ fontSize: 11.5, fontWeight: 900, color: '#ffffff', padding: '0 4px' }}>
              #{setIndex + 1}
            </span>
            {totalSets > 1 && (
              <button
                type="button"
                disabled={setIndex >= totalSets - 1}
                onClick={() => {
                  sounds.playPop();
                  onChangeSetIndex(Math.min(totalSets - 1, setIndex + 1));
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: setIndex >= totalSets - 1 ? 'rgba(255,255,255,0.2)' : 'var(--text-muted)',
                  cursor: setIndex >= totalSets - 1 ? 'default' : 'pointer',
                  padding: '4px 5px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronRight size={14} />
              </button>
            )}
          </div>

          {/* Segmented Ağırlık / Tekrar Toggle */}
          {!isDuration ? (
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(10, 15, 26, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-sm)',
                padding: 2,
                gap: 2
              }}
            >
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  onChangeField('weight');
                }}
                style={{
                  height: 28,
                  padding: '0 10px',
                  borderRadius: 5,
                  border: 'none',
                  background: activeField === 'weight' ? accentColor : 'transparent',
                  color: activeField === 'weight' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                Ağırlık (kg)
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  onChangeField('reps');
                }}
                style={{
                  height: 28,
                  padding: '0 10px',
                  borderRadius: 5,
                  border: 'none',
                  background: activeField === 'reps' ? accentColor : 'transparent',
                  color: activeField === 'reps' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                Tekrar
              </button>
            </div>
          ) : (
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: accentColor,
                padding: '3px 8px',
                background: `${accentColor}18`,
                borderRadius: 'var(--radius-sm)'
              }}
            >
              ⏱️ Süre (Saniye)
            </span>
          )}
        </div>

        {/* Right: Keyboard Mode Toggle & Close Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setIsKeyboardMode(!isKeyboardMode);
            }}
            style={{
              height: 32,
              padding: '0 9px',
              borderRadius: 'var(--radius-sm)',
              border: isKeyboardMode
                ? `1px solid ${accentColor}`
                : '1px solid rgba(255, 255, 255, 0.12)',
              background: isKeyboardMode ? `${accentColor}25` : 'rgba(255, 255, 255, 0.05)',
              color: isKeyboardMode ? '#ffffff' : 'var(--text-muted)',
              fontSize: 11,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer'
            }}
            title="Klavye ile manuel sayı yaz"
          >
            <Keyboard size={13} color={isKeyboardMode ? accentColor : 'currentColor'} />
            <span>Klavye</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Kapat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 2. CENTER VALUE READOUT WITH FINE [-] / [+] BUTTONS */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 4px'
        }}
      >
        {/* Fine Adjustment Minus Button */}
        <button
          type="button"
          onClick={() => handleFineAdjust(-fineStep)}
          style={{
            height: 42,
            padding: '0 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            transition: 'all 0.15s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
          }}
          title={`${fineStep} ${unitLabel} Azalt`}
        >
          <Minus size={15} strokeWidth={2.5} />
          <span style={{ fontSize: 12, fontWeight: 800 }}>{fineStep}</span>
        </button>

        {/* Big Crisp Centered Value (or Inline Keyboard Input) */}
        {isKeyboardMode ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              background: 'rgba(10, 15, 26, 0.95)',
              border: `1.5px solid ${accentColor}`,
              borderRadius: 'var(--radius-md)',
              padding: '4px 16px',
              boxShadow: `0 0 16px ${accentColor}30`
            }}
          >
            <input
              ref={inputRef}
              type="text"
              inputMode={isDuration || activeField === 'reps' ? 'numeric' : 'decimal'}
              enterKeyHint={!isDuration && activeField === 'weight' ? 'next' : 'done'}
              aria-label={isDuration ? 'Süre (saniye)' : activeField === 'weight' ? 'Ağırlık (kg)' : 'Tekrar sayısı'}
              value={keyboardText}
              onFocus={selectAllOnFocus}
              onChange={(e) => {
                const targetField = isDuration ? 'reps' : activeField;
                const sanitized =
                  targetField === 'weight'
                    ? sanitizeDecimalInput(e.target.value)
                    : sanitizeIntegerInput(e.target.value);
                setKeyboardText(sanitized);
                if (sanitized === '') {
                  onUpdateValue(targetField, 0);
                } else {
                  const num = targetField === 'weight' ? parseFloat(sanitized) : parseInt(sanitized, 10);
                  if (!isNaN(num)) {
                    const maxAllowed = targetField === 'weight' || isDuration ? 999 : 99;
                    onUpdateValue(targetField, Math.max(0, Math.min(maxAllowed, num)));
                  }
                }
              }}
              onBlur={() => {
                if (keyboardText.endsWith('.')) {
                  setKeyboardText(keyboardText.slice(0, -1));
                }
              }}
              onKeyDown={(e) => {
                if (isImeComposing(e)) return;
                if (e.key === 'Enter') {
                  e.preventDefault();
                  sounds.playPop();
                  if (!isDuration && activeField === 'weight') {
                    onChangeField('reps');
                  } else {
                    setIsKeyboardMode(false);
                  }
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setIsKeyboardMode(false);
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  handleFineAdjust(fineStep);
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  handleFineAdjust(-fineStep);
                }
              }}
              placeholder="0"
              style={{
                width: 90,
                textAlign: 'center',
                fontSize: 32,
                fontWeight: 900,
                color: '#ffffff',
                background: 'transparent',
                border: 'none',
                padding: 0,
                outline: 'none',
                fontFamily: 'Outfit, Inter, sans-serif'
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 800, color: accentColor, marginLeft: 4 }}>
              {unitLabel}
            </span>
          </div>
        ) : (
          <div
            onClick={() => setIsKeyboardMode(true)}
            title="Klavye ile yazmak için dokun"
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              gap: 5,
              cursor: 'pointer',
              padding: '2px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <span
              style={{
                fontSize: 34,
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.03em',
                fontFamily: 'Outfit, Inter, sans-serif'
              }}
            >
              {currentValue || 0}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: accentColor
              }}
            >
              {unitLabel}
            </span>
          </div>
        )}

        {/* Fine Adjustment Plus Button */}
        <button
          type="button"
          onClick={() => handleFineAdjust(fineStep)}
          style={{
            height: 42,
            padding: '0 14px',
            borderRadius: 'var(--radius-full)',
            background: `${accentColor}25`,
            border: `1.5px solid ${accentColor}65`,
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            transition: 'all 0.15s',
            boxShadow: `0 2px 12px ${accentColor}25`
          }}
          title={`${fineStep} ${unitLabel} Arttır`}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span style={{ fontSize: 12, fontWeight: 800 }}>{fineStep}</span>
        </button>
      </div>

      {/* 3. FULL-WIDTH HORIZONTAL FITNESS RULER / DIAL */}
      {!isKeyboardMode && (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 64,
            background: 'rgba(8, 12, 22, 0.85)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden'
          }}
        >
          {/* Center Precision Laser Needle */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: 3,
              transform: 'translateX(-50%)',
              background: accentColor,
              boxShadow: `0 0 10px ${accentColor}`,
              zIndex: 10,
              pointerEvents: 'none',
              borderRadius: 2
            }}
          >
            {/* Top Triangle Indicator Pin */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: `6px solid ${accentColor}`
              }}
            />
          </div>

          {/* Left Fade Gradient Vignette */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 56,
              background: 'linear-gradient(90deg, #0f1524 0%, rgba(15, 21, 36, 0) 100%)',
              pointerEvents: 'none',
              zIndex: 8
            }}
          />

          {/* Right Fade Gradient Vignette */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 56,
              background: 'linear-gradient(270deg, #0f1524 0%, rgba(15, 21, 36, 0) 100%)',
              pointerEvents: 'none',
              zIndex: 8
            }}
          />

          {/* Native Smooth Horizontal Momentum Snap Scroller */}
          <div
            ref={rulerRef}
            onScroll={handleScroll}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              overflowX: 'scroll',
              overflowY: 'hidden',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x',
              paddingLeft: 'calc(50% - 14px)',
              paddingRight: 'calc(50% - 14px)'
            }}
          >
            {rulerValues.map((val, idx) => {
              const isSelected = val === currentValue;
              const isMajor =
                val % 10 === 0 ||
                (rulerValues.length <= 25 && val % 5 === 0) ||
                (val <= 20 && val % 2 === 0);

              return (
                <div
                  key={`${val}-${idx}`}
                  onClick={() => {
                    sounds.playPop();
                    const targetField = isDuration ? 'reps' : activeField;
                    onUpdateValue(targetField, val);
                    scrollRulerToValue(val, true);
                  }}
                  style={{
                    width: TICK_WIDTH,
                    minWidth: TICK_WIDTH,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    scrollSnapAlign: 'center',
                    cursor: 'pointer',
                    paddingTop: 8,
                    position: 'relative'
                  }}
                >
                  {/* Tick Line */}
                  <div
                    style={{
                      width: isSelected ? 2.5 : isMajor ? 2 : 1.2,
                      height: isSelected ? 26 : isMajor ? 22 : 12,
                      borderRadius: 1,
                      background: isSelected
                        ? accentColor
                        : isMajor
                        ? 'rgba(255, 255, 255, 0.75)'
                        : 'rgba(255, 255, 255, 0.25)',
                      transition: 'height 0.15s, background 0.15s'
                    }}
                  />

                  {/* Major Milestone Number below tick */}
                  {isMajor ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: isSelected ? accentColor : 'var(--text-muted)',
                        marginTop: 4,
                        fontFamily: 'Outfit, Inter, sans-serif'
                      }}
                    >
                      {val}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. BOTTOM ACTION BAR: Apply All & Advance / Done */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          paddingTop: 4,
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        {totalSets > 1 ? (
          <button
            type="button"
            onClick={handleApplyAll}
            style={{
              background: copiedFeedback ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              border: copiedFeedback
                ? '1px solid rgba(16, 185, 129, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 700,
              color: copiedFeedback ? '#34d399' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s'
            }}
          >
            <CopyCheck size={12} />
            <span>{copiedFeedback ? 'Tüm Setlere Uygulandı!' : 'Tüm Setlere Uygula'}</span>
          </button>
        ) : (
          <div />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Quick jump to Reps if currently in Weight */}
          {!isDuration && activeField === 'weight' && (
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                onChangeField('reps');
              }}
              style={{
                height: 34,
                padding: '0 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-main)',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span>Tekrar</span>
              <ArrowRight size={12} />
            </button>
          )}

          {/* Primary Done Button */}
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            style={{
              height: 34,
              padding: '0 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Check size={14} strokeWidth={2.5} />
            <span>Tamam</span>
          </button>
        </div>
      </div>
    </div>
  );
};
