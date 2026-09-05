import React, { useEffect } from 'react';
import { ExerciseDefinition } from '../../types/workout';
import { ExerciseVisual } from './ExerciseVisual';
import { SetRow } from './SetRow';
import { useWorkout } from '../../context/WorkoutContext';
import { getLastWorkoutSets, calculateExerciseLevelInfo } from '../../utils/calculations';
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
  Zap
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
    profile,
    applyOverloadSuggestion
  } = useWorkout();

  // Close overlay on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !exercise) return null;

  // Get current sets from draft or default 3 sets
  const currentSets = draft.exerciseSets[exercise.id] || [
    { id: '1', weight: 0, reps: 0 },
    { id: '2', weight: 0, reps: 0 },
    { id: '3', weight: 0, reps: 0 }
  ];

  const activeSets = currentSets.filter(s => s.weight > 0);
  const activeVolume = activeSets.reduce((sum, s) => sum + (s.weight * (s.reps || 5)), 0);

  // Previous performance and level info
  const lastPerformance = getLastWorkoutSets(exercise.id, workouts);
  const exerciseLevelInfo = calculateExerciseLevelInfo(exercise, workouts);
  const overloadSuggestion = getExerciseOverloadSuggestion(exercise, workouts, profile);
  const meta = muscleMetadata[exercise.muscle] || muscleMetadata.chest;

  // Quick fill previous workout weights
  const handleCopyPreviousWeights = () => {
    if (!lastPerformance) return;
    sounds.playSuccess();
    
    // Clear and fill with last performance sets
    lastPerformance.weights.forEach((w, idx) => {
      const rep = lastPerformance.reps[idx] || 5;
      updateDraftSet(exercise.id, idx, 'weight', w);
      updateDraftSet(exercise.id, idx, 'reps', rep);
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
          maxWidth: 460,
          padding: '18px 16px 20px',
          background: 'linear-gradient(180deg, #162032 0%, #0d131f 100%)',
          border: `1px solid ${meta.color}40`,
          boxShadow: `0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px ${meta.color}20`,
          borderRadius: 'var(--radius-xl)'
        }}
      >
        {/* Header: Exercise Visual, Title, Muscle Badge, Close Button */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            marginBottom: 14,
            gap: 10 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <div 
              style={{ 
                width: 52, 
                height: 52, 
                borderRadius: 'var(--radius-md)',
                background: 'rgba(15, 23, 42, 0.85)',
                border: `1.5px solid ${meta.color}60`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 4px 14px ${meta.color}30`
              }}
            >
              <ExerciseVisual exerciseId={exercise.id} muscle={exercise.muscle} size={46} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: meta.color,
                    background: `${meta.color}20`,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    textTransform: 'uppercase'
                  }}
                >
                  {meta.name}
                </span>

                {exerciseLevelInfo.prWeight > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: 'var(--gold)',
                      background: 'rgba(251, 191, 36, 0.15)',
                      border: '1px solid rgba(251, 191, 36, 0.4)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3
                    }}
                  >
                    <Star size={10} fill="var(--gold)" color="var(--gold)" />
                    PR: {exerciseLevelInfo.prWeight} kg
                  </span>
                )}
              </div>

              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                  margin: '3px 0 2px',
                  lineHeight: 1.2
                }}
              >
                {exercise.name}
              </h2>

              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Lv {exerciseLevelInfo.currentLevel} • {exerciseLevelInfo.totalEXP.toLocaleString()} EXP
              </div>

              {exercise.muscles && exercise.muscles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {exercise.muscles.map((act) => {
                    const actMeta = muscleMetadata[act.muscle];
                    return (
                      <span
                        key={act.muscle}
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: 'var(--radius-sm)',
                          background: act.role === 'primary' ? `${actMeta?.color || '#38bdf8'}25` : 'rgba(255, 255, 255, 0.06)',
                          color: act.role === 'primary' ? (actMeta?.color || '#38bdf8') : 'var(--text-muted)',
                          border: `1px solid ${act.role === 'primary' ? `${actMeta?.color || '#38bdf8'}50` : 'rgba(255, 255, 255, 0.1)'}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3
                        }}
                      >
                        <span>{actMeta?.icon || '💪'}</span>
                        <span>{actMeta?.name || act.muscle} %{Math.round(act.ratio * 100)}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Close Button */}
          <button 
            type="button"
            className="btn-icon" 
            onClick={handleCloseModal}
            aria-label="Kapat"
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Previous Workout Info & Quick Fill Action */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            marginBottom: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap'
          }}
        >
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <History size={13} color="var(--cyan)" />
            {lastPerformance ? (
              <span>
                Son İdman: <strong style={{ color: '#ffffff' }}>{lastPerformance.weights.join(' / ')} kg</strong>
              </span>
            ) : (
              <span style={{ fontStyle: 'italic', color: 'var(--text-dim)' }}>
                Bu hareket için geçmiş kayıt yok
              </span>
            )}
          </div>

          {lastPerformance && (
            <button
              type="button"
              onClick={handleCopyPreviousWeights}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--cyan)',
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s'
              }}
              title="Geçmiş ağırlıkları bu seansa aktar"
            >
              <Sparkles size={12} />
              <span>Öncekileri Kopyala</span>
            </button>
          )}
        </div>

        {/* Bilimsel Aşırı Yükleme (Progressive Overload) Hedef Kartı */}
        <div
          style={{
            background: overloadSuggestion.isPlateau 
              ? 'rgba(239, 68, 68, 0.12)' 
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(56, 189, 248, 0.1))',
            border: `1px solid ${overloadSuggestion.isPlateau ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
            marginBottom: 14,
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {overloadSuggestion.isPlateau ? (
                <Zap size={14} color="#ef4444" />
              ) : (
                <Target size={14} color="var(--muscle-emerald)" />
              )}
              <span 
                style={{ 
                  fontSize: 12, 
                  fontWeight: 800, 
                  color: overloadSuggestion.isPlateau ? '#fca5a5' : '#ffffff' 
                }}
              >
                {overloadSuggestion.title}
              </span>
            </div>

            <button
              type="button"
              onClick={() => applyOverloadSuggestion(exercise.id)}
              style={{
                background: overloadSuggestion.isPlateau ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                border: `1px solid ${overloadSuggestion.isPlateau ? 'rgba(239, 68, 68, 0.5)' : 'rgba(16, 185, 129, 0.5)'}`,
                borderRadius: 'var(--radius-sm)',
                color: overloadSuggestion.isPlateau ? '#fca5a5' : '#34d399',
                fontSize: 11,
                fontWeight: 800,
                padding: '4px 9px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s'
              }}
            >
              <Target size={12} />
              <span>Hedefi Uygula</span>
            </button>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 6 }}>
            {overloadSuggestion.description}
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {overloadSuggestion.suggestedSets.map((s, sIdx) => (
              <span
                key={sIdx}
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff'
                }}
              >
                Set #{sIdx + 1}: {s.weight} kg × {s.reps}
              </span>
            ))}
          </div>
        </div>

        {/* Sets Table Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '32px 1fr 1fr 36px',
            gap: 8,
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-dim)',
            textAlign: 'center',
            padding: '0 4px 6px'
          }}
        >
          <span>Set</span>
          <span>Ağırlık</span>
          <span>Tekrar</span>
          <span></span>
        </div>

        {/* Dynamic Sets List */}
        <div style={{ maxHeight: '42vh', overflowY: 'auto', paddingRight: 2, marginBottom: 8 }}>
          {currentSets.map((set, idx) => (
            <SetRow
              key={`${exercise.id}-set-${idx}`}
              exerciseId={exercise.id}
              setIndex={idx}
              weight={set.weight}
              reps={set.reps}
              canDelete={currentSets.length > 1}
              onDelete={() => {
                sounds.playPop();
                removeDraftSet(exercise.id, idx);
              }}
              onChange={(field, value) => updateDraftSet(exercise.id, idx, field, value)}
            />
          ))}
        </div>

        {/* Add Set Button */}
        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            addDraftSet(exercise.id);
          }}
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px dashed rgba(255, 255, 255, 0.18)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-main)',
            fontSize: 12.5,
            fontWeight: 700,
            padding: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 16,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
          }}
        >
          <Plus size={15} color="var(--muscle-emerald)" />
          <span>+ Yeni Set Ekle</span>
        </button>

        {/* Bottom Actions: Active summary + Save/Close */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-dim)'
              }}
            >
              <RotateCcw size={15} />
            </button>
          )}

          <button
            type="button"
            onClick={handleCloseModal}
            className="btn btn-primary"
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
              fontWeight: 800,
              gap: 8,
              background: activeSets.length > 0 
                ? 'linear-gradient(135deg, #10b981, #059669)' 
                : 'linear-gradient(135deg, var(--accent), #e11d48)',
              boxShadow: activeSets.length > 0 
                ? '0 4px 18px rgba(16, 185, 129, 0.35)' 
                : '0 4px 18px rgba(255, 71, 87, 0.35)'
            }}
          >
            <Check size={17} strokeWidth={2.5} />
            <span>
              {activeSets.length > 0 
                ? `Kaydet & Kapat (${activeSets.length} Set • ${activeVolume.toLocaleString()} kg)` 
                : 'Kapat'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
