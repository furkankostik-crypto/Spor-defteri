import React from 'react';
import { Trash2 } from 'lucide-react';

interface SetRowProps {
  exerciseId: string;
  setIndex: number;
  weight: number;
  reps: number;
  canDelete: boolean;
  onDelete: () => void;
  onChange: (field: 'weight' | 'reps', value: number) => void;
}

export const SetRow: React.FC<SetRowProps> = ({
  setIndex,
  weight,
  reps,
  canDelete,
  onDelete,
  onChange
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr 1fr 36px',
        gap: 8,
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.6)',
        padding: '6px 8px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        marginBottom: 6
      }}
    >
      {/* Set Label */}
      <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)' }}>
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
          onChange={(e) => onChange('weight', parseFloat(e.target.value) || 0)}
          placeholder="0"
          className="form-input"
          style={{
            padding: '8px 24px 8px 8px',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: 14,
            height: 38
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 10,
            color: 'var(--text-dim)',
            pointerEvents: 'none'
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
          min="1"
          max="99"
          value={reps || 5}
          onChange={(e) => onChange('reps', parseInt(e.target.value, 10) || 5)}
          className="form-input"
          style={{
            padding: '8px 28px 8px 8px',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: 14,
            height: 38
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 10,
            color: 'var(--text-dim)',
            pointerEvents: 'none'
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
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
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
          <div style={{ width: 30, height: 30 }} />
        )}
      </div>
    </div>
  );
};
