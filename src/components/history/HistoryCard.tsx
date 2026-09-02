import React, { useState } from 'react';
import { Workout } from '../../types/workout';
import { formatDisplayDate } from '../../utils/dateUtils';
import { useWorkout } from '../../context/WorkoutContext';
import { ChevronDown, ChevronUp, Edit3, Trash2, Dumbbell, Flame } from 'lucide-react';

interface HistoryCardProps {
  workout: Workout;
  onEdit: (workout: Workout) => void;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({ workout, onEdit }) => {
  const { deleteWorkout } = useWorkout();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate session volume and sets
  let totalVolume = 0;
  let totalSets = 0;

  workout.exercises.forEach((ex) => {
    if (ex.detailedSets && ex.detailedSets.length > 0) {
      ex.detailedSets.forEach((s) => {
        if (s.weight > 0) {
          totalVolume += s.weight * (s.reps || 5);
          totalSets++;
        }
      });
    } else if (ex.sets) {
      ex.sets.forEach((w) => {
        if (w > 0) {
          totalVolume += w * 5;
          totalSets++;
        }
      });
    }
  });

  const handleDelete = () => {
    if (!isDeleting) {
      setIsDeleting(true);
      return;
    }
    deleteWorkout(workout.id);
  };

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 12,
        overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isOpen ? 'var(--shadow-md)' : 'var(--shadow-sm)'
      }}
    >
      {/* Clickable Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
              {formatDisplayDate(workout.date)}
            </span>
            <span className="badge badge-lvl" style={{ fontSize: 10, padding: '2px 6px' }}>
              {workout.type}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Dumbbell size={13} color="var(--muscle-emerald)" />
              {workout.exercises.length} Hareket ({totalSets} Set)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Flame size={13} color="var(--gold)" />
              {totalVolume.toLocaleString()} kg
            </span>
          </div>
        </div>

        <div style={{ color: 'var(--text-dim)', padding: 4 }}>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Accordion Details */}
      {isOpen && (
        <div
          style={{
            padding: '14px 16px',
            background: 'var(--card-nested)',
            borderTop: '1px solid var(--border)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Exercises breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {workout.exercises.map((ex, idx) => {
              const weightsText = ex.detailedSets && ex.detailedSets.length > 0
                ? ex.detailedSets.map(s => `${s.weight}kg x ${s.reps || 5}`).join(' • ')
                : ex.sets.map(w => `${w}kg`).join(' / ');

              return (
                <div
                  key={`${ex.id}-${idx}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: 6,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    fontSize: 13
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#ffffff' }}>{ex.name}</span>
                  <span style={{ color: 'var(--accent-hover)', fontWeight: 700, fontSize: 12 }}>
                    {weightsText}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action Buttons (Edit & Delete) */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              type="button"
              onClick={() => onEdit(workout)}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '8px 12px', fontSize: 12 }}
            >
              <Edit3 size={14} />
              <span>Düzenle</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: 12,
                borderRadius: 'var(--radius-md)',
                border: isDeleting ? '1px solid #ff4757' : '1px solid rgba(255, 71, 87, 0.3)',
                background: isDeleting ? 'rgba(255, 71, 87, 0.3)' : 'rgba(255, 71, 87, 0.08)',
                color: '#ff6b81',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s'
              }}
            >
              <Trash2 size={14} />
              <span>{isDeleting ? 'Emin misiniz? Sil' : 'Kaydı Sil'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
