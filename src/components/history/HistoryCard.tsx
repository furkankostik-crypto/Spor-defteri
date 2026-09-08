import React, { useState } from 'react';
import { Workout, MuscleGroup } from '../../types/workout';
import { formatDisplayDate } from '../../utils/dateUtils';
import { useWorkout } from '../../context/WorkoutContext';
import { defaultExercises } from '../../data/defaultExercises';
import { muscleMetadata } from '../../data/muscleMetadata';
import { ExerciseVisual, getExerciseEquipment } from '../workout/ExerciseVisual';
import { 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Trash2, 
  Dumbbell, 
  Flame 
} from 'lucide-react';

interface HistoryCardProps {
  workout: Workout;
  onEdit: (workout: Workout) => void;
}

const getSplitBadgeStyle = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('üst') || t.includes('upper')) {
    return { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.14)', border: 'rgba(56, 189, 248, 0.35)' };
  }
  if (t.includes('alt') || t.includes('lower') || t.includes('bacak') || t.includes('leg')) {
    return { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.14)', border: 'rgba(192, 132, 252, 0.35)' };
  }
  if (t.includes('tüm') || t.includes('full')) {
    return { color: '#34d399', bg: 'rgba(52, 211, 153, 0.14)', border: 'rgba(52, 211, 153, 0.35)' };
  }
  if (t.includes('itiş') || t.includes('push')) {
    return { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.14)', border: 'rgba(251, 191, 36, 0.35)' };
  }
  if (t.includes('çekiş') || t.includes('pull')) {
    return { color: '#fb7185', bg: 'rgba(251, 113, 133, 0.14)', border: 'rgba(251, 113, 133, 0.35)' };
  }
  return { color: 'var(--accent)', bg: 'rgba(255, 71, 87, 0.14)', border: 'rgba(255, 71, 87, 0.35)' };
};

const defaultExerciseMap = new Map(defaultExercises.map(e => [e.id, e]));

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

  const splitStyle = getSplitBadgeStyle(workout.type);

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
        background: 'linear-gradient(180deg, rgba(19, 27, 46, 0.75) 0%, rgba(12, 17, 28, 0.95) 100%)',
        border: isOpen ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 12,
        overflow: 'hidden',
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isOpen 
          ? '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.1)' 
          : '0 2px 8px rgba(0, 0, 0, 0.3)'
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
          userSelect: 'none',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          {/* Date & Split Tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14.5, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
              {formatDisplayDate(workout.date)}
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: splitStyle.color,
                background: splitStyle.bg,
                border: `1px solid ${splitStyle.border}`,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              {workout.type}
            </span>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--muscle-emerald)',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Dumbbell size={12} strokeWidth={2.5} />
              <span>{workout.exercises.length} Hareket ({totalSets} Set)</span>
            </span>

            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--gold)',
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.25)',
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Flame size={12} strokeWidth={2.5} />
              <span>{totalVolume.toLocaleString('tr-TR')} kg Hacim</span>
            </span>
          </div>
        </div>

        {/* Animated Chevron Indicator */}
        <div 
          style={{ 
            color: isOpen ? '#ffffff' : 'var(--text-dim)', 
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-full)',
            background: isOpen ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s ease'
          }}
        >
          {isOpen ? <ChevronUp size={18} strokeWidth={2.5} /> : <ChevronDown size={18} strokeWidth={2.5} />}
        </div>
      </div>

      {/* Accordion Details */}
      {isOpen && (
        <div
          style={{
            padding: '12px 14px 16px',
            background: 'rgba(10, 15, 26, 0.85)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Exercises breakdown cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {workout.exercises.map((ex, idx) => {
              const def = defaultExerciseMap.get(ex.id);
              const muscle = (ex.muscle || def?.muscle || 'chest') as MuscleGroup;
              const meta = muscleMetadata[muscle] || muscleMetadata.chest;
              const equipment = getExerciseEquipment(ex.id, muscle);

              const setsData: { weight: number; reps: number }[] = (
                ex.detailedSets && ex.detailedSets.length > 0
                  ? ex.detailedSets.filter(s => s.weight > 0).map(s => ({ weight: s.weight, reps: s.reps || 5 }))
                  : (ex.sets || []).filter(w => w > 0).map(w => ({ weight: w, reps: 5 }))
              );

              const exVolume = setsData.reduce((sum, s) => sum + (s.weight * s.reps), 0);
              const maxWeight = setsData.length > 0 ? Math.max(...setsData.map(s => s.weight)) : 0;
              const allIdentical = setsData.length > 1 && setsData.every(
                s => s.weight === setsData[0].weight && s.reps === setsData[0].reps
              );

              return (
                <div
                  key={`${ex.id}-${idx}`}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Top Row: 3D Visual + Exercise Name + Muscle Tag + Volume Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <ExerciseVisual
                        exerciseId={ex.id}
                        muscle={muscle}
                        size={36}
                        objectFit="contain"
                        style={{ borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
                      />

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 13.5,
                            color: '#ffffff',
                            lineHeight: 1.25,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {ex.name}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 700,
                              color: meta.color,
                              background: `${meta.color}15`,
                              border: `1px solid ${meta.color}35`,
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-full)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3
                            }}
                          >
                            <span>{meta.icon}</span>
                            <span>{meta.name}</span>
                          </span>

                          {equipment && (
                            <span style={{ fontSize: 10, color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ opacity: 0.4 }}>•</span>
                              <span>{equipment.label}</span>
                              {equipment.subType && <span style={{ opacity: 0.7 }}>({equipment.subType})</span>}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Exercise Volume Badge */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--cyan)' }}>
                        {exVolume.toLocaleString('tr-TR')} kg
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', marginTop: 1 }}>
                        {setsData.length} Set
                      </div>
                    </div>
                  </div>

                  {/* Sets Breakdown Row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    {allIdentical ? (
                      /* Clean consolidated badge when all sets are identical */
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          background: 'rgba(56, 189, 248, 0.08)',
                          border: '1px solid rgba(56, 189, 248, 0.22)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '4px 10px',
                          fontSize: 12
                        }}
                      >
                        <span style={{ color: 'var(--cyan)', fontWeight: 800 }}>
                          {setsData.length} Set × {setsData[0].weight} kg
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>
                          ({setsData[0].reps} tekrar)
                        </span>
                        <div style={{ display: 'flex', gap: 3, alignItems: 'center', marginLeft: 2 }}>
                          {setsData.map((_, dotIdx) => (
                            <span
                              key={dotIdx}
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: 'var(--cyan)',
                                opacity: 0.8
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : setsData.length > 0 ? (
                      /* Distinct set chips when weights/reps vary */
                      setsData.map((set, sIdx) => {
                        const isMax = set.weight === maxWeight && setsData.length > 1;
                        return (
                          <div
                            key={sIdx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: isMax ? 'rgba(251, 191, 36, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                              border: `1px solid ${isMax ? 'rgba(251, 191, 36, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                              borderRadius: 'var(--radius-sm)',
                              padding: '3px 8px',
                              fontSize: 11.5
                            }}
                          >
                            <span style={{ color: isMax ? 'var(--gold)' : 'var(--text-dim)', fontSize: 9.5, fontWeight: 700 }}>
                              S{sIdx + 1}
                            </span>
                            <span style={{ color: isMax ? 'var(--gold)' : '#ffffff', fontWeight: 800 }}>
                              {set.weight} kg
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600 }}>
                              × {set.reps}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>
                        Set kaydı girilmedi
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons (Edit & Delete) */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => onEdit(workout)}
              className="btn btn-secondary"
              style={{ 
                flex: 1, 
                padding: '9px 14px', 
                fontSize: 12.5,
                fontWeight: 700,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <Edit3 size={14} />
              <span>Antrenmanı Düzenle</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              style={{
                flex: 1,
                padding: '9px 14px',
                fontSize: 12.5,
                borderRadius: 'var(--radius-md)',
                border: isDeleting ? '1px solid #ff4757' : '1px solid rgba(255, 71, 87, 0.3)',
                background: isDeleting ? 'rgba(255, 71, 87, 0.3)' : 'rgba(255, 71, 87, 0.08)',
                color: '#ff6b81',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s'
              }}
            >
              <Trash2 size={14} />
              <span>{isDeleting ? 'Emin misiniz? Kalıcı Sil' : 'Kaydı Sil'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
