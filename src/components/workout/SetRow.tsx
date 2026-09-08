import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface SetRowProps {
  exerciseId: string;
  setIndex: number;
  weight: number;
  reps: number;
  canDelete: boolean;
  onDelete: () => void;
  onChange: (field: 'weight' | 'reps', value: number) => void;
  accentColor?: string;
}

export const SetRow: React.FC<SetRowProps> = ({
  setIndex,
  weight,
  reps,
  canDelete,
  onDelete,
  onChange,
  accentColor = '#38bdf8'
}) => {
  const [weightFocused, setWeightFocused] = useState(false);
  const [repsFocused, setRepsFocused] = useState(false);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '38px 1fr 1fr 38px',
        gap: 8,
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.55)',
        padding: '6px 8px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        marginBottom: 7,
        transition: 'border-color 0.2s, background 0.2s'
      }}
    >
      {/* Set Label */}
      <div
        style={{
          textAlign: 'center',
          fontSize: 12.5,
          fontWeight: 800,
          color: 'var(--text-muted)',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 'var(--radius-sm)',
          height: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        #{setIndex + 1}
      </div>

      {/* Weight Input */}
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          step="0.5"
          min="0"
          max="999"
          value={weight === 0 ? '' : weight}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') {
              onChange('weight', 0);
            } else {
              const num = parseFloat(val);
              onChange('weight', isNaN(num) ? 0 : Math.max(0, num));
            }
          }}
          onFocus={(e) => {
            setWeightFocused(true);
            try {
              e.target.select();
            } catch {}
          }}
          onBlur={() => setWeightFocused(false)}
          onClick={(e) => {
            try {
              (e.target as HTMLInputElement).select();
            } catch {}
          }}
          placeholder="0"
          className="form-input"
          style={{
            padding: '8px 28px 8px 10px',
            textAlign: 'center',
            fontWeight: 800,
            fontSize: 15,
            height: 42,
            background: 'rgba(10, 16, 28, 0.85)',
            borderColor: weightFocused ? accentColor : 'rgba(255, 255, 255, 0.12)',
            boxShadow: weightFocused ? `0 0 0 3px ${accentColor}25` : 'none',
            color: '#ffffff',
            borderRadius: 'var(--radius-sm)',
            transition: 'border-color 0.2s, box-shadow 0.2s'
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 11,
            fontWeight: 700,
            color: weightFocused ? accentColor : 'var(--text-dim)',
            pointerEvents: 'none',
            transition: 'color 0.2s'
          }}
        >
          kg
        </span>
      </div>

      {/* Reps Input */}
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          step="1"
          min="0"
          max="99"
          value={reps === 0 ? '' : reps}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') {
              onChange('reps', 0);
            } else {
              const num = parseInt(val, 10);
              onChange('reps', isNaN(num) ? 0 : Math.max(0, num));
            }
          }}
          onFocus={(e) => {
            setRepsFocused(true);
            try {
              e.target.select();
            } catch {}
          }}
          onBlur={() => setRepsFocused(false)}
          onClick={(e) => {
            try {
              (e.target as HTMLInputElement).select();
            } catch {}
          }}
          placeholder="0"
          className="form-input"
          style={{
            padding: '8px 38px 8px 10px',
            textAlign: 'center',
            fontWeight: 800,
            fontSize: 15,
            height: 42,
            background: 'rgba(10, 16, 28, 0.85)',
            borderColor: repsFocused ? accentColor : 'rgba(255, 255, 255, 0.12)',
            boxShadow: repsFocused ? `0 0 0 3px ${accentColor}25` : 'none',
            color: '#ffffff',
            borderRadius: 'var(--radius-sm)',
            transition: 'border-color 0.2s, box-shadow 0.2s'
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
            pointerEvents: 'none',
            transition: 'color 0.2s'
          }}
        >
          tekrar
        </span>
      </div>

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
              width: 34,
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
            <Trash2 size={14} />
          </button>
        ) : (
          <div style={{ width: 34, height: 34 }} />
        )}
      </div>
    </div>
  );
};
