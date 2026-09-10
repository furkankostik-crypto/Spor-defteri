import React, { useState, useMemo } from 'react';
import { SplitType, RecommendedRoutineItem, ExerciseDefinition } from '../../types/workout';
import { RecommendedExerciseCard } from './RecommendedExerciseCard';
import { getRecommendedRoutine, getAvailableAlternatives } from '../../utils/recommendedRoutines';
import { useWorkout } from '../../context/WorkoutContext';
import { sounds } from '../../utils/audio';
import { muscleMetadata } from '../../data/muscleMetadata';
import { AnatomyIcon } from '../../data/anatomyIcons';
import { 
  Zap, 
  PlusCircle, 
  X
} from 'lucide-react';

interface RecommendedRoutineViewProps {
  split: SplitType;
  onOpenExerciseInput: (exercise: ExerciseDefinition) => void;
  onOpenAddCustom: () => void;
  onSwitchToAllMode?: () => void;
}

export const RecommendedRoutineView: React.FC<RecommendedRoutineViewProps> = ({
  split,
  onOpenExerciseInput,
  onOpenAddCustom,
  onSwitchToAllMode
}) => {
  const { allExercises, draft } = useWorkout();

  // Active routine state (allows user to swap or customize exercises during session)
  const [routineItems, setRoutineItems] = useState<RecommendedRoutineItem[]>(() => {
    return getRecommendedRoutine(split);
  });

  // Swap modal state
  const [swappingItem, setSwappingItem] = useState<RecommendedRoutineItem | null>(null);

  // Split title formatting
  const splitTitle = useMemo(() => {
    switch (split) {
      case 'lower':
        return 'Alt Vücut (Bacak & Kalça)';
      case 'upper':
        return 'Üst Vücut (İtiş & Çekiş)';
      case 'full':
        return 'Tüm Vücut (Full Body)';
      case 'custom':
      default:
        return 'Core & Toparlanma';
    }
  }, [split]);

  // Overall routine progress calculations
  let completedExercises = 0;
  let totalTargetSets = 0;
  let completedSets = 0;

  routineItems.forEach((item) => {
    totalTargetSets += item.targetSets;
    const sets = draft.exerciseSets[item.id] || [];
    const valid = sets.filter(s => s.weight > 0);
    completedSets += valid.length;
    if (valid.length >= item.targetSets) {
      completedExercises++;
    }
  });

  const progressPercent = totalTargetSets > 0 
    ? Math.min(100, Math.round((completedSets / totalTargetSets) * 100))
    : 0;

  // Swap exercise handler
  const handleSelectAlternative = (newEx: ExerciseDefinition) => {
    if (!swappingItem) return;
    sounds.playSuccess();

    setRoutineItems(prev => prev.map(item => {
      if (item.id === swappingItem.id) {
        return {
          ...item,
          id: newEx.id,
          name: newEx.name,
          muscle: newEx.muscle,
          muscleLabel: muscleMetadata[newEx.muscle]?.name || item.muscleLabel,
          category: (newEx.category === 'lower' || newEx.category === 'upper' || newEx.category === 'core') 
            ? newEx.category 
            : item.category
        };
      }
      return item;
    }));

    setSwappingItem(null);
  };

  return (
    <div style={{ animation: 'fadeIn 0.22s ease-out' }}>
      {/* 1. HERO RECOMMENDED SESSION HEADER CARD */}
      <div
        className="card"
        style={{
          padding: '14px 16px',
          marginBottom: 14,
          background: progressPercent === 100
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: progressPercent === 100
            ? '1.5px solid rgba(16, 185, 129, 0.5)'
            : '1px solid rgba(239, 68, 68, 0.3)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          borderRadius: 'var(--radius-xl, 16px)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  fontSize: 10.5,
                  fontWeight: 900,
                  color: '#ff6b81'
                }}
              >
                <Zap size={11} fill="currentColor" />
                <span>GÜNÜN ÖNERİLEN PROGRAMI</span>
              </span>

              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>
                • {routineItems.length} Hedef Hareket
              </span>
            </div>

            <h2
              style={{
                fontSize: 17,
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                margin: '2px 0 4px 0'
              }}
            >
              {splitTitle}
            </h2>

            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
              Yalnızca bu antrenmana özel önerilen hareketler listelenmektedir.
            </div>
          </div>

          {/* Quick Progress Dial */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: progressPercent === 100 ? '#10b981' : '#ffffff'
              }}
            >
              %{progressPercent}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>
              {completedSets}/{totalTargetSets} Set
            </div>
          </div>
        </div>

        {/* Live Progress Bar */}
        <div style={{ marginTop: 10 }}>
          <div
            style={{
              height: 6,
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: progressPercent === 100
                  ? '#10b981'
                  : 'linear-gradient(90deg, #ff4757, #ff6b81)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 5,
              fontSize: 10,
              color: 'var(--text-muted)'
            }}
          >
            <span>
              {completedExercises} / {routineItems.length} Hareket Tamamlandı
            </span>
            <span>
              {progressPercent === 100 ? '🎉 Tüm Hedefler Bitti!' : `Kalan: ${Math.max(0, totalTargetSets - completedSets)} Set`}
            </span>
          </div>
        </div>
      </div>

      {/* 2. RECOMMENDED EXERCISES CARDS LIST (ONLY RECOMMENDED EXERCISES) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {routineItems.map((item) => {
          const exercise = allExercises.find(e => e.id === item.id) || {
            id: item.id,
            name: item.name,
            muscle: item.muscle,
            category: item.category
          };

          return (
            <RecommendedExerciseCard
              key={item.id}
              item={item}
              exercise={exercise}
              onOpenInput={onOpenExerciseInput}
              onSwapClick={(it) => setSwappingItem(it)}
            />
          );
        })}
      </div>

      {/* 3. BOTTOM CONTROLS: ADD EXTRA EXERCISE & SWITCH TO FREE MODE */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            onOpenAddCustom();
          }}
          className="btn btn-secondary"
          style={{
            width: '100%',
            padding: '11px',
            fontSize: 12.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            borderRadius: 'var(--radius-md)',
            border: '1px dashed rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.03)'
          }}
        >
          <PlusCircle size={15} color="var(--muscle-emerald)" />
          <span>Bu Seansa Özel Ek Egzersiz Ekle</span>
        </button>

        {onSwitchToAllMode && (
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onSwitchToAllMode();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 11.5,
              fontWeight: 600,
              padding: '6px',
              cursor: 'pointer',
              textAlign: 'center',
              textDecoration: 'underline'
            }}
          >
            Serbest Harita & Tüm Hareketler Moduna Geç
          </button>
        )}
      </div>

      {/* 4. SWAP EXERCISE MODAL (When gym machine is busy) */}
      {swappingItem && (
        <div
          className="modal-overlay"
          onClick={() => setSwappingItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 12
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 440,
              maxHeight: '80vh',
              background: 'linear-gradient(155deg, #161e2e 0%, #0f172a 100%)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl, 20px)',
              padding: '18px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cyan)' }}>
                  ALTERNATİF HAREKET SEÇ
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff', marginTop: 1 }}>
                  {swappingItem.name} yerine:
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSwappingItem(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 30,
                  height: 30,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
              Salondaki alet meşgulse aynı kas grubunu uyaran alternatif bir egzersiz seçebilirsiniz:
            </div>

            {/* Alternatives List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', maxHeight: 320 }}>
              {getAvailableAlternatives(swappingItem, allExercises).map((alt) => {
                const altMeta = muscleMetadata[alt.muscle];
                return (
                  <div
                    key={alt.id}
                    onClick={() => handleSelectAlternative(alt)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.18s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        className={`anatomy-badge muscle-${alt.muscle}`}
                        style={{ width: 28, height: 28, flexShrink: 0 }}
                      >
                        <AnatomyIcon muscle={alt.muscle} size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>
                          {alt.name}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>
                          {altMeta?.name || alt.muscle}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: 'var(--cyan)',
                        background: 'rgba(56, 189, 248, 0.12)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      Seç
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
