import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Check } from 'lucide-react';
import { sounds } from '../../utils/audio';
import {
  sanitizeDecimalInput,
  sanitizeIntegerInput,
  selectAllOnFocus
} from '../../utils/inputUtils';

interface SetRowProps {
  exerciseId: string;
  setIndex: number;
  weight: number;
  reps: number;
  completed?: boolean;
  onToggleCompleted?: () => void;
  canDelete: boolean;
  onDelete: () => void;
  onChange: (field: 'weight' | 'reps', value: number) => void;
  accentColor?: string;
  isDuration?: boolean;
  activePickerField?: 'weight' | 'reps' | null;
  onSelectPickerField?: (field: 'weight' | 'reps') => void;
}

export const SetRow: React.FC<SetRowProps> = ({
  setIndex,
  weight,
  reps,
  completed = false,
  onToggleCompleted,
  canDelete,
  onDelete,
  onChange,
  accentColor = '#38bdf8',
  isDuration = false,
  activePickerField = null,
  onSelectPickerField
}) => {
  const [weightFocused, setWeightFocused] = useState(false);
  const [repsFocused, setRepsFocused] = useState(false);
  const [weightDraft, setWeightDraft] = useState<string>(weight > 0 ? String(weight) : '');
  const [repsDraft, setRepsDraft] = useState<string>(reps > 0 ? String(reps) : '');
  const rowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!weightFocused) {
      setWeightDraft(weight > 0 ? String(weight) : '');
    }
  }, [weight, weightFocused]);

  useEffect(() => {
    if (!repsFocused) {
      setRepsDraft(reps > 0 ? String(reps) : '');
    }
  }, [reps, repsFocused]);

  const isWeightActive = activePickerField === 'weight';
  const isRepsActive = activePickerField === 'reps';
  const isRowActive = Boolean(activePickerField);

  // Smoothly scroll row into view when picker opens for this row
  useEffect(() => {
    if (isRowActive && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isRowActive, activePickerField]);

  const gridColumns = isDuration
    ? (onToggleCompleted ? '32px 1fr 36px 30px' : '36px 1fr 36px')
    : (onToggleCompleted ? '32px 1fr 1fr 36px 30px' : '36px 1fr 1fr 36px');

  return (
    <div
      ref={rowRef}
      style={{
        display: 'grid',
        gridTemplateColumns: gridColumns,
        gap: 7,
        alignItems: 'center',
        background: completed
          ? 'rgba(16, 185, 129, 0.12)'
          : isRowActive
          ? `linear-gradient(90deg, ${accentColor}16 0%, rgba(15, 23, 42, 0.78) 100%)`
          : 'rgba(15, 23, 42, 0.55)',
        padding: '5px 7px',
        borderRadius: 'var(--radius-md)',
        border: completed
          ? '1px solid rgba(16, 185, 129, 0.35)'
          : isRowActive
          ? `1px solid ${accentColor}65`
          : '1px solid rgba(255, 255, 255, 0.05)',
        marginBottom: 6,
        transition: 'all 0.2s'
      }}
    >
      {/* Set Label */}
      <div
        style={{
          textAlign: 'center',
          fontSize: 12.5,
          fontWeight: 800,
          color: isRowActive ? '#ffffff' : 'var(--text-muted)',
          background: isRowActive ? `${accentColor}30` : 'rgba(255, 255, 255, 0.04)',
          borderRadius: 'var(--radius-sm)',
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: isRowActive ? `1px solid ${accentColor}70` : '1px solid rgba(255, 255, 255, 0.06)',
          transition: 'all 0.2s'
        }}
      >
        #{setIndex + 1}
      </div>

      {isDuration ? (
        /* Duration Input (in seconds) with -15s / +15s quick buttons & smart picker trigger */
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <button
            type="button"
            onClick={() => {
              sounds.playTick();
              onChange('reps', Math.max(0, (reps || 0) - 15));
            }}
            style={{
              height: 40,
              padding: '0 7px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-muted)',
              fontSize: 10.5,
              fontWeight: 800,
              cursor: 'pointer',
              flexShrink: 0
            }}
            title="15 Saniye Azalt"
          >
            -15s
          </button>

          {onSelectPickerField ? (
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                onSelectPickerField('reps');
              }}
              style={{
                flex: 1,
                height: 40,
                padding: '0 8px',
                borderRadius: 'var(--radius-sm)',
                background: isRepsActive ? `${accentColor}1c` : 'rgba(10, 16, 28, 0.85)',
                border: isRepsActive
                  ? `1.5px solid ${accentColor}`
                  : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: isRepsActive ? `0 0 0 3px ${accentColor}25` : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 15.5,
                  color: reps > 0 ? '#ffffff' : 'var(--text-dim)'
                }}
              >
                {reps || 0}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: isRepsActive ? accentColor : 'var(--text-dim)'
                }}
              >
                saniye
              </span>
            </button>
          ) : (
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                inputMode="numeric"
                enterKeyHint="done"
                value={repsFocused ? repsDraft : (reps === 0 ? '' : String(reps))}
                onChange={(e) => {
                  const val = sanitizeIntegerInput(e.target.value);
                  setRepsDraft(val);
                  if (val === '') {
                    onChange('reps', 0);
                  } else {
                    const num = parseInt(val, 10);
                    onChange('reps', isNaN(num) ? 0 : Math.max(0, Math.min(999, num)));
                  }
                }}
                onFocus={(e) => {
                  setRepsDraft(reps > 0 ? String(reps) : '');
                  setRepsFocused(true);
                  selectAllOnFocus(e);
                }}
                onBlur={() => setRepsFocused(false)}
                placeholder="0"
                className="form-input"
                style={{
                  padding: '6px 42px 6px 8px',
                  textAlign: 'center',
                  fontWeight: 800,
                  fontSize: 16,
                  height: 40,
                  background: 'rgba(10, 16, 28, 0.85)',
                  borderColor: repsFocused ? accentColor : 'rgba(255, 255, 255, 0.12)',
                  boxShadow: repsFocused ? `0 0 0 3px ${accentColor}25` : 'none',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-sm)'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 10,
                  fontWeight: 700,
                  color: repsFocused ? accentColor : 'var(--text-dim)',
                  pointerEvents: 'none'
                }}
              >
                saniye
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              sounds.playTick();
              onChange('reps', Math.min(999, (reps || 0) + 15));
            }}
            style={{
              height: 40,
              padding: '0 7px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: 'var(--cyan)',
              fontSize: 10.5,
              fontWeight: 800,
              cursor: 'pointer',
              flexShrink: 0
            }}
            title="15 Saniye Ekle"
          >
            +15s
          </button>
        </div>
      ) : (
        <>
          {/* Weight Cell (Smart Picker Trigger or Fallback Input) */}
          {onSelectPickerField ? (
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                onSelectPickerField('weight');
              }}
              style={{
                position: 'relative',
                width: '100%',
                height: 40,
                padding: '0 26px 0 8px',
                borderRadius: 'var(--radius-sm)',
                background: isWeightActive ? `${accentColor}1c` : 'rgba(10, 16, 28, 0.85)',
                border: isWeightActive
                  ? `1.5px solid ${accentColor}`
                  : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: isWeightActive ? `0 0 0 3px ${accentColor}25` : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Ağırlık seçiciyi aç"
            >
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 15.5,
                  color: weight > 0 ? '#ffffff' : 'var(--text-dim)'
                }}
              >
                {weight > 0 ? weight : '0'}
              </span>
              <span
                style={{
                  position: 'absolute',
                  right: 7,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: isWeightActive ? accentColor : 'var(--text-dim)',
                  transition: 'color 0.2s'
                }}
              >
                kg
              </span>
            </button>
          ) : (
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                inputMode="decimal"
                enterKeyHint="next"
                value={weightFocused ? weightDraft : (weight === 0 ? '' : String(weight))}
                onChange={(e) => {
                  const val = sanitizeDecimalInput(e.target.value);
                  setWeightDraft(val);
                  if (val === '') {
                    onChange('weight', 0);
                  } else {
                    const num = parseFloat(val);
                    onChange('weight', isNaN(num) ? 0 : Math.max(0, Math.min(999, num)));
                  }
                }}
                onFocus={(e) => {
                  setWeightDraft(weight > 0 ? String(weight) : '');
                  setWeightFocused(true);
                  selectAllOnFocus(e);
                }}
                onBlur={() => setWeightFocused(false)}
                placeholder="0"
                className="form-input"
                style={{
                  padding: '6px 26px 6px 8px',
                  textAlign: 'center',
                  fontWeight: 800,
                  fontSize: 16,
                  height: 40,
                  background: 'rgba(10, 16, 28, 0.85)',
                  borderColor: weightFocused ? accentColor : 'rgba(255, 255, 255, 0.12)',
                  boxShadow: weightFocused ? `0 0 0 3px ${accentColor}25` : 'none',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-sm)'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: 7,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: weightFocused ? accentColor : 'var(--text-dim)',
                  pointerEvents: 'none'
                }}
              >
                kg
              </span>
            </div>
          )}

          {/* Reps Cell (Smart Picker Trigger or Fallback Input) */}
          {onSelectPickerField ? (
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                onSelectPickerField('reps');
              }}
              style={{
                position: 'relative',
                width: '100%',
                height: 40,
                padding: '0 32px 0 8px',
                borderRadius: 'var(--radius-sm)',
                background: isRepsActive ? `${accentColor}1c` : 'rgba(10, 16, 28, 0.85)',
                border: isRepsActive
                  ? `1.5px solid ${accentColor}`
                  : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: isRepsActive ? `0 0 0 3px ${accentColor}25` : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Tekrar seçiciyi aç"
            >
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 15.5,
                  color: reps > 0 ? '#ffffff' : 'var(--text-dim)'
                }}
              >
                {reps > 0 ? reps : '0'}
              </span>
              <span
                style={{
                  position: 'absolute',
                  right: 7,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: isRepsActive ? accentColor : 'var(--text-dim)',
                  transition: 'color 0.2s'
                }}
              >
                tekrar
              </span>
            </button>
          ) : (
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                inputMode="numeric"
                enterKeyHint="done"
                value={repsFocused ? repsDraft : (reps === 0 ? '' : String(reps))}
                onChange={(e) => {
                  const val = sanitizeIntegerInput(e.target.value);
                  setRepsDraft(val);
                  if (val === '') {
                    onChange('reps', 0);
                  } else {
                    const num = parseInt(val, 10);
                    onChange('reps', isNaN(num) ? 0 : Math.max(0, Math.min(99, num)));
                  }
                }}
                onFocus={(e) => {
                  setRepsDraft(reps > 0 ? String(reps) : '');
                  setRepsFocused(true);
                  selectAllOnFocus(e);
                }}
                onBlur={() => setRepsFocused(false)}
                placeholder="0"
                className="form-input"
                style={{
                  padding: '6px 34px 6px 8px',
                  textAlign: 'center',
                  fontWeight: 800,
                  fontSize: 16,
                  height: 40,
                  background: 'rgba(10, 16, 28, 0.85)',
                  borderColor: repsFocused ? accentColor : 'rgba(255, 255, 255, 0.12)',
                  boxShadow: repsFocused ? `0 0 0 3px ${accentColor}25` : 'none',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-sm)'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: 7,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: repsFocused ? accentColor : 'var(--text-dim)',
                  pointerEvents: 'none'
                }}
              >
                tekrar
              </span>
            </div>
          )}
        </>
      )}

      {/* Complete Set Checkmark Toggle */}
      {onToggleCompleted && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onToggleCompleted}
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              border: completed ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.18)',
              background: completed ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.05)',
              color: completed ? '#ffffff' : 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: completed ? '0 2px 8px rgba(16, 185, 129, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
            title={completed ? 'Seti Geri Al' : 'Seti Tamamla'}
          >
            <Check size={16} strokeWidth={completed ? 3 : 2} />
          </button>
        </div>
      )}

      {/* Delete Set Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {canDelete ? (
          <button
            type="button"
            onClick={onDelete}
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 34,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--accent)';
              e.currentTarget.style.borderColor = 'rgba(255, 71, 87, 0.4)';
              e.currentTarget.style.background = 'rgba(255, 71, 87, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-dim)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
            }}
            title="Seti Sil"
          >
            <Trash2 size={13} />
          </button>
        ) : (
          <div style={{ width: 30, height: 34 }} />
        )}
      </div>
    </div>
  );
};
