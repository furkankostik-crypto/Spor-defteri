import React, { useEffect, useState } from 'react';
import { ExerciseDefinition } from '../../types/workout';
import { ExerciseVisual, getExerciseEquipment } from './ExerciseVisual';
import { SetRow } from './SetRow';
import { WeightRepPicker } from './WeightRepPicker';
import { useWorkout } from '../../context/WorkoutContext';
import { useBackButton } from '../../context/BackNavigationContext';
import { getLastWorkoutSets, calculateExerciseLevelInfo, isDurationExercise, isSetValid, getSetDurationSeconds } from '../../utils/calculations';
import { getExerciseOverloadSuggestion } from '../../utils/recommendationEngine';
import { muscleMetadata } from '../../data/muscleMetadata';
import { sounds } from '../../utils/audio';
import { 
  X, 
  Plus, 
  History, 
  Check, 
  Sparkles, 
  RotateCcw,
  Star,
  Target,
  Maximize2
} from 'lucide-react';

interface ExerciseInputOverlayProps {
  exercise: ExerciseDefinition | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExerciseInputOverlay: React.FC<ExerciseInputOverlayProps> = ({
  exercise,
  isOpen,
  onClose
}) => {
  const { 
    workouts, 
    draft, 
    updateDraftSet, 
    addDraftSet, 
    removeDraftSet,
    clearDraftExercise,
    toggleDraftSetCompleted,
    completeAllSetsForExercise,
    profile,
    applyOverloadSuggestion
  } = useWorkout();

  // Fullscreen image preview lightbox state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Smart Weight & Rep Picker state
  const [activePicker, setActivePicker] = useState<{
    setIndex: number;
    field: 'weight' | 'reps';
  } | null>(null);

  // Reset collapsible state when exercise changes or modal reopens
  useEffect(() => {
    setIsImageModalOpen(false);
    setActivePicker(null);
  }, [exercise?.id, isOpen]);

  // Handle phone back button
  useBackButton(
    Boolean(isOpen && exercise),
    () => {
      sounds.playPop();
      if (isImageModalOpen) {
        setIsImageModalOpen(false);
      } else if (activePicker) {
        setActivePicker(null);
      } else {
        onClose();
      }
    },
    90
  );

  // Close overlay on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isImageModalOpen) {
          setIsImageModalOpen(false);
        } else if (activePicker) {
          setActivePicker(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isImageModalOpen, activePicker]);

  if (!isOpen || !exercise) return null;

  const isDuration = isDurationExercise(exercise);

  // Get current sets from draft or default 3 sets
  const currentSets = draft.exerciseSets[exercise.id] || [
    { id: '1', weight: 0, reps: 0 },
    { id: '2', weight: 0, reps: 0 },
    { id: '3', weight: 0, reps: 0 }
  ];

  const activeSets = currentSets.filter(s => isSetValid(s, isDuration));
  const completedSets = currentSets.filter(s => s.completed && isSetValid(s, isDuration));
  const isExerciseFullyCompleted = currentSets.length > 0 && completedSets.length === currentSets.length;
  const activeVolume = isDuration
    ? activeSets.reduce((sum, s) => sum + getSetDurationSeconds(s, true), 0)
    : activeSets.reduce((sum, s) => sum + (s.weight * (s.reps || 5)), 0);

  // Previous performance and level info
  const lastPerformance = getLastWorkoutSets(exercise.id, workouts);
  const exerciseLevelInfo = calculateExerciseLevelInfo(exercise, workouts);
  const overloadSuggestion = getExerciseOverloadSuggestion(exercise, workouts, profile);
  const meta = muscleMetadata[exercise.muscle] || muscleMetadata.chest;
  const equipment = getExerciseEquipment(exercise.id, exercise.muscle);

  // Format previous workout sets into a clean summary
  const getPreviousWorkoutSummary = () => {
    if (!lastPerformance || !lastPerformance.weights.length) return null;
    if (isDuration) {
      const secsList = lastPerformance.reps.filter(r => r > 0);
      if (secsList.length === 0) return null;
      const firstS = secsList[0];
      const allSame = secsList.every(s => s === firstS);
      if (allSame) {
        return {
          text: `${secsList.length} Set × ${firstS} sn`,
          subtext: '(süre)'
        };
      }
      return {
        text: secsList.map(s => `${s} sn`).join(' • '),
        subtext: `(${secsList.length} set)`
      };
    }

    const weights = lastPerformance.weights;
    const reps = lastPerformance.reps;
    const firstW = weights[0];
    const firstR = reps[0] || 5;
    const allSame = weights.every((w, i) => w === firstW && (reps[i] || 5) === firstR);

    if (allSame) {
      return {
        text: `${weights.length} Set × ${firstW} kg`,
        subtext: `(${firstR} tekrar)`
      };
    }

    // Group consecutive matching sets
    const groups: { weight: number; reps: number; count: number }[] = [];
    weights.forEach((w, i) => {
      const r = reps[i] || 5;
      const last = groups[groups.length - 1];
      if (last && last.weight === w && last.reps === r) {
        last.count++;
      } else {
        groups.push({ weight: w, reps: r, count: 1 });
      }
    });

    return {
      text: groups.map(g => (g.count > 1 ? `${g.count}×` : '') + `${g.weight} kg`).join(' • '),
      subtext: `(${weights.length} set)`
    };
  };

  const prevSummary = getPreviousWorkoutSummary();

  // Format suggested overload sets into a clean summary
  const getSuggestionSummary = () => {
    if (!overloadSuggestion || !overloadSuggestion.suggestedSets || !overloadSuggestion.suggestedSets.length) return null;
    const sets = overloadSuggestion.suggestedSets;
    if (isDuration) {
      const firstR = sets[0].reps;
      const allSameReps = sets.every(s => s.reps === firstR);
      if (allSameReps) {
        return {
          text: `${sets.length} Set × ${firstR} sn`,
          subtext: '(izometrik)'
        };
      }
      return {
        text: `${sets.map(s => `${s.reps}sn`).join(' / ')}`,
        subtext: `(${sets.length} set)`
      };
    }

    const firstW = sets[0].weight;
    const firstR = sets[0].reps;
    const allSameWeight = sets.every(s => s.weight === firstW);
    const allSameReps = sets.every(s => s.reps === firstR);

    if (allSameWeight && allSameReps) {
      return {
        text: `${sets.length} Set × ${firstW} kg`,
        subtext: `(${firstR} tekrar)`
      };
    }

    if (allSameWeight) {
      return {
        text: `${sets.length} Set × ${firstW} kg`,
        subtext: `(${sets.map(s => s.reps).join('/')} tkr)`
      };
    }

    return {
      text: `${firstW} kg (${firstR} tkr)`,
      subtext: `(${sets.length} set)`
    };
  };

  const suggestionSummary = getSuggestionSummary();

  // Quick fill previous workout weights / durations
  const handleCopyPreviousWeights = () => {
    if (!lastPerformance) return;
    sounds.playSuccess();
    
    // Clear and fill with last performance sets
    lastPerformance.weights.forEach((w, idx) => {
      const rep = lastPerformance.reps[idx] || (isDuration ? 45 : 5);
      if (isDuration) {
        updateDraftSet(exercise.id, idx, 'weight', 0);
        updateDraftSet(exercise.id, idx, 'reps', rep);
      } else {
        updateDraftSet(exercise.id, idx, 'weight', w);
        updateDraftSet(exercise.id, idx, 'reps', rep);
      }
    });
  };

  const handleCloseModal = () => {
    sounds.playPop();
    onClose();
  };

  return (
    <div 
      className="modal-backdrop" 
      onClick={handleCloseModal}
      style={{
        zIndex: 1050,
        padding: 'calc(12px + var(--safe-top)) calc(12px + var(--safe-right)) calc(12px + var(--safe-bottom)) calc(12px + var(--safe-left))'
      }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 480,
          width: '100%',
          padding: 0,
          background: 'linear-gradient(180deg, #131b2e 0%, #0c111c 100%)',
          border: `1px solid ${meta.color}45`,
          boxShadow: `0 24px 60px rgba(0, 0, 0, 0.75), 0 0 35px ${meta.color}20`,
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100dvh - 28px - var(--safe-top) - var(--safe-bottom))'
        }}
      >
        {/* 1. HERO SHOWCASE STAGE: Large 3D Figure Render with Floating Badges (Compacts smoothly when Picker is open) */}
        <div 
          onClick={() => setIsImageModalOpen(true)}
          title="Görseli tam boyut incelemek için tıkla"
          style={{
            position: 'relative',
            width: '100%',
            height: activePicker ? 'clamp(90px, 13vh, 115px)' : 'clamp(180px, 26vh, 235px)',
            background: 'radial-gradient(circle at 50% 35%, rgba(30, 41, 59, 0.7) 0%, rgba(10, 15, 26, 0.98) 100%)',
            overflow: 'hidden',
            flexShrink: 0,
            cursor: 'pointer',
            transition: 'height 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <ExerciseVisual 
            exerciseId={exercise.id} 
            muscle={exercise.muscle} 
            width="100%" 
            height="100%" 
            objectFit="contain"
            style={{ borderRadius: 0 }}
          />

          {/* Atmospheric soft gradient overlays for badge legibility without darkening movement action */}
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(10, 15, 26, 0.55) 0%, rgba(10, 15, 26, 0.05) 20%, transparent 50%, rgba(12, 17, 28, 0.4) 80%, rgba(12, 17, 28, 0.95) 100%)',
              pointerEvents: 'none'
            }}
          />

          {/* Ambient Edge Glow Vignette matching muscle color */}
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              boxShadow: `inset 0 0 35px ${meta.color}25`,
              pointerEvents: 'none'
            }}
          />

          {/* Floating Top Bar (Category & PR Badges + Fullscreen & Close Buttons) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
              zIndex: 3
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
            >
              {/* Primary Muscle Badge */}
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: meta.color,
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: `1px solid ${meta.color}60`,
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-full)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: `0 2px 8px ${meta.color}25`
                }}
              >
                <span>{meta.icon}</span>
                <span>{meta.name}</span>
              </span>

              {/* PR Badge */}
              {exerciseLevelInfo.prWeight > 0 && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: 'var(--gold)',
                    background: 'rgba(251, 191, 36, 0.18)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(251, 191, 36, 0.55)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    boxShadow: '0 2px 10px rgba(251, 191, 36, 0.25)'
                  }}
                >
                  <Star size={11} fill="var(--gold)" color="var(--gold)" />
                  <span>PR: {exerciseLevelInfo.prWeight} {isDuration ? 'sn' : 'kg'}</span>
                </span>
              )}
            </div>

            {/* Top Action Buttons (Maximize & Close) */}
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {/* Expand / Lightbox Button */}
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsImageModalOpen(true)}
                aria-label="Görseli Tam Boyut Gör"
                title="Görseli Tam Boyut Gör"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.3)';
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.6)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Maximize2 size={16} strokeWidth={2.3} />
              </button>

              {/* Circular Frosted Close Button */}
              <button 
                type="button"
                className="btn-icon" 
                onClick={handleCloseModal}
                aria-label="Kapat"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Floating Bottom Bar (Equipment & Level Badges) */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '0 16px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 8,
              zIndex: 3
            }}
          >
            {/* Equipment & Movement Subtype Tag */}
            {equipment && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <span>{equipment.icon}</span>
                <span>{equipment.label}</span>
                {equipment.subType && (
                  <>
                    <span style={{ opacity: 0.4 }}>•</span>
                    <span style={{ color: 'var(--text-muted)' }}>{equipment.subType}</span>
                  </>
                )}
              </span>
            )}

            {/* Level & Total EXP Chip */}
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--text-muted)',
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <span style={{ color: '#ffffff' }}>Lv {exerciseLevelInfo.currentLevel}</span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span>{exerciseLevelInfo.totalEXP.toLocaleString('tr-TR')} EXP</span>
            </span>
          </div>
        </div>

        {/* 2. SCROLLABLE CONTENT BODY */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 14px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          {/* Exercise Title and Muscle Activation Breakdown */}
          <div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                margin: '0 0 5px',
                lineHeight: 1.15
              }}
            >
              {exercise.name}
            </h2>

            {/* Muscle Contribution Chips - Single Compact Scrollable Row */}
            {exercise.muscles && exercise.muscles.length > 0 && (
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 5,
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                  paddingBottom: 2
                }}
              >
                {exercise.muscles.map((act) => {
                  const actMeta = muscleMetadata[act.muscle];
                  const isPrimary = act.role === 'primary';
                  const color = actMeta?.color || '#38bdf8';
                  return (
                    <span
                      key={act.muscle}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2.5px 7px',
                        borderRadius: 'var(--radius-sm)',
                        background: isPrimary ? `${color}20` : 'rgba(255, 255, 255, 0.05)',
                        color: isPrimary ? color : 'var(--text-muted)',
                        border: `1px solid ${isPrimary ? `${color}55` : 'rgba(255, 255, 255, 0.08)'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3.5,
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      <span style={{ fontSize: 11 }}>{actMeta?.icon || '💪'}</span>
                      <span>{actMeta?.name || act.muscle} %{Math.round(act.ratio * 100)}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Compact Previous Workout Reference Bar */}
          {prevSummary ? (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(56, 189, 248, 0.22)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                <History size={13} color="var(--cyan)" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.03em', flexShrink: 0 }}>
                      Son:
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {prevSummary.text}
                    </span>
                    {prevSummary.subtext && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {prevSummary.subtext}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={handleCopyPreviousWeights}
                  style={{
                    background: 'rgba(56, 189, 248, 0.14)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--cyan)',
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: '4px 8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3.5,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s'
                  }}
                  title="Geçmiş ağırlıkları kutulara doldur"
                >
                  <Sparkles size={11} />
                  <span>Doldur</span>
                </button>

                {suggestionSummary && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      applyOverloadSuggestion(exercise.id);
                    }}
                    style={{
                      background: 'rgba(16, 189, 129, 0.14)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#34d399',
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: '4px 7px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3.5,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s'
                    }}
                    title={`Hedef öneri: ${suggestionSummary.text} ${suggestionSummary.subtext || ''}`}
                  >
                    <Target size={11} />
                    <span>Hedef</span>
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {/* Sets Table Section */}
          <div style={{ marginTop: 0 }}>
            {/* Table Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isDuration ? '30px 1fr 34px 28px' : '30px 1fr 1fr 34px 28px',
                gap: 6,
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: 'var(--text-dim)',
                textAlign: 'center',
                padding: '0 6px 4px',
                textTransform: 'uppercase'
              }}
            >
              <span>Set</span>
              {isDuration ? (
                <span>Süre (Saniye)</span>
              ) : (
                <>
                  <span>Ağırlık</span>
                  <span>Tekrar</span>
                </>
              )}
              <span>Bitir</span>
              <span></span>
            </div>

            {/* Dynamic Sets List */}
            <div>
              {currentSets.map((set, idx) => (
                <SetRow
                  key={`${exercise.id}-set-${idx}`}
                  exerciseId={exercise.id}
                  setIndex={idx}
                  weight={set.weight}
                  reps={set.reps}
                  isDuration={isDuration}
                  completed={Boolean(set.completed)}
                  onToggleCompleted={() => toggleDraftSetCompleted(exercise.id, idx)}
                  accentColor={meta.color}
                  canDelete={currentSets.length > 1}
                  onDelete={() => {
                    sounds.playPop();
                    if (activePicker) {
                      if (activePicker.setIndex === idx) {
                        setActivePicker(null);
                      } else if (activePicker.setIndex > idx) {
                        setActivePicker({
                          setIndex: activePicker.setIndex - 1,
                          field: activePicker.field
                        });
                      }
                    }
                    removeDraftSet(exercise.id, idx);
                  }}
                  onChange={(field, value) => updateDraftSet(exercise.id, idx, field, value)}
                  activePickerField={activePicker?.setIndex === idx ? activePicker.field : null}
                  onSelectPickerField={(field) => {
                    if (activePicker?.setIndex === idx && activePicker.field === field) {
                      setActivePicker(null);
                    } else {
                      setActivePicker({ setIndex: idx, field });
                    }
                  }}
                />
              ))}
            </div>

            {/* Add Set Button */}
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                const nextSetIdx = currentSets.length;
                addDraftSet(exercise.id);
                if (activePicker) {
                  setActivePicker({
                    setIndex: nextSetIdx,
                    field: isDuration ? 'reps' : 'weight'
                  });
                }
              }}
              style={{
                width: '100%',
                height: 38,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px dashed rgba(255, 255, 255, 0.2)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: 12.5,
                fontWeight: 800,
                padding: '0 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 2,
                marginBottom: 4,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                e.currentTarget.style.color = '#34d399';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.color = 'var(--text-main)';
              }}
            >
              <Plus size={15} color="var(--muscle-emerald)" />
              <span>+ Yeni Set Ekle</span>
            </button>
          </div>

          {/* Bottom Actions: Active summary + Save/Close */}
          <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginTop: 2 }}>
            {activeSets.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  clearDraftExercise(exercise.id);
                }}
                className="btn btn-secondary"
                title="Bu egzersizin setlerini sıfırla"
                style={{
                  padding: '10px',
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <RotateCcw size={15} />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (activeSets.length > 0 && !isExerciseFullyCompleted) {
                  completeAllSetsForExercise(exercise.id);
                  sounds.playSuccess();
                } else {
                  sounds.playPop();
                }
                onClose();
              }}
              className="btn btn-primary"
              style={{
                flex: 1,
                height: 44,
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13.5,
                fontWeight: 800,
                gap: 7,
                background: isExerciseFullyCompleted || activeSets.length > 0
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : 'linear-gradient(135deg, var(--accent), #e11d48)',
                boxShadow: isExerciseFullyCompleted || activeSets.length > 0
                  ? '0 4px 16px rgba(16, 185, 129, 0.35)' 
                  : '0 4px 16px rgba(255, 71, 87, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              <Check size={16} strokeWidth={2.5} />
              <span>
                {isExerciseFullyCompleted
                  ? `✓ Tamamlandı (${completedSets.length} Set • ${activeVolume.toLocaleString('tr-TR')} ${isDuration ? 'sn' : 'kg'})`
                  : activeSets.length > 0
                  ? `✓ Hareketi Tamamla (${activeSets.length} Set • ${activeVolume.toLocaleString('tr-TR')} ${isDuration ? 'sn' : 'kg'})`
                  : 'Kapat'}
              </span>
            </button>
          </div>
        </div>

        {/* 2.5 SMART WEIGHT & REP PICKER DOCKED PANEL */}
        {activePicker && (() => {
          const safeIdx = Math.min(activePicker.setIndex, Math.max(0, currentSets.length - 1));
          const targetSet = currentSets[safeIdx] || { weight: 0, reps: 0 };
          const lastW =
            lastPerformance?.weights[safeIdx] ??
            (lastPerformance?.weights.length ? lastPerformance.weights[lastPerformance.weights.length - 1] : undefined);
          const lastR =
            lastPerformance?.reps[safeIdx] ??
            (lastPerformance?.reps.length ? lastPerformance.reps[lastPerformance.reps.length - 1] : undefined);
          const sugSet =
            overloadSuggestion?.suggestedSets?.[safeIdx] ??
            (overloadSuggestion?.suggestedSets?.length
              ? overloadSuggestion.suggestedSets[overloadSuggestion.suggestedSets.length - 1]
              : undefined);

          return (
            <WeightRepPicker
              exercise={exercise}
              setIndex={safeIdx}
              totalSets={currentSets.length}
              activeField={isDuration ? 'reps' : activePicker.field}
              weight={targetSet.weight}
              reps={targetSet.reps}
              isDuration={isDuration}
              accentColor={meta.color}
              bodyWeightKg={profile.bodyWeightKg}
              lastWeight={lastW}
              lastReps={lastR}
              suggestedWeight={sugSet?.weight}
              suggestedReps={sugSet?.reps}
              prWeight={exerciseLevelInfo.prWeight > 0 ? exerciseLevelInfo.prWeight : undefined}
              onChangeField={(f) => setActivePicker({ setIndex: safeIdx, field: f })}
              onChangeSetIndex={(newIdx) =>
                setActivePicker({ setIndex: newIdx, field: activePicker.field })
              }
              onUpdateValue={(field, value) => updateDraftSet(exercise.id, safeIdx, field, value)}
              onApplyToAllSets={(field, value) => {
                currentSets.forEach((_, idx) => {
                  updateDraftSet(exercise.id, idx, field, value);
                });
              }}
              onClose={() => setActivePicker(null)}
            />
          );
        })()}
      </div>

      {/* 3. FULL RESOLUTION EXERCISE IMAGE LIGHTBOX MODAL */}
      {isImageModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsImageModalOpen(false)}
          style={{
            zIndex: 1200,
            background: 'rgba(5, 8, 16, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 480,
              width: '100%',
              background: '#0a0f1d',
              borderRadius: 'var(--radius-xl)',
              border: `1px solid ${meta.color}50`,
              boxShadow: `0 30px 80px rgba(0, 0, 0, 0.9), 0 0 50px ${meta.color}25`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Lightbox Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(15, 23, 42, 0.7)'
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff' }}>
                  {exercise.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{meta.icon} {meta.name}</span>
                  {equipment && (
                    <>
                      <span>•</span>
                      <span>{equipment.icon} {equipment.label} {equipment.subType ? `(${equipment.subType})` : ''}</span>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsImageModalOpen(false)}
                aria-label="Kapat"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Lightbox Image Container (100% uncropped 1:1 square) */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1 / 1',
                background: '#070b14',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ExerciseVisual
                exerciseId={exercise.id}
                muscle={exercise.muscle}
                width="100%"
                height="100%"
                objectFit="contain"
                style={{ borderRadius: 0 }}
              />
            </div>

            {/* Lightbox Footer */}
            <div
              style={{
                padding: '12px 18px',
                background: 'rgba(15, 23, 42, 0.5)',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 12,
                color: 'var(--text-dim)'
              }}
            >
              <span>3D Anatomik Hareket Modeli</span>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: meta.color,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Kapat (ESC)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
