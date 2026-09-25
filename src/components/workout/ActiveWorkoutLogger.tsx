import React, { useState, useEffect, useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useBackButton } from '../../context/BackNavigationContext';
import { ExerciseDefinition, SplitType, MuscleGroup } from '../../types/workout';
import { ExerciseSquareCard } from './ExerciseSquareCard';
import { ExerciseInputOverlay } from './ExerciseInputOverlay';
import { AnatomicalBodyMap } from './AnatomicalBodyMap';
import { MuscleDetailView } from './MuscleDetailView';
import { AnatomyIcon } from '../../data/anatomyIcons';
import { muscleMetadata } from '../../data/muscleMetadata';
import { getLastWorkoutSets } from '../../utils/calculations';
import { sounds } from '../../utils/audio';
import { 
  Check, 
  Plus, 
  Flame, 
  Dumbbell, 
  PlusCircle, 
  Search, 
  X, 
  Timer as TimerIcon,
  Trash2,
  Minimize2,
  Minus,
  Map,
  ListFilter
} from 'lucide-react';

interface ActiveWorkoutLoggerProps {
  onBackToHub: () => void;
}

export const ActiveWorkoutLogger: React.FC<ActiveWorkoutLoggerProps> = ({ onBackToHub }) => {
  const { 
    draft, 
    addExerciseToDraft,
    saveWorkout, 
    allExercises, 
    workouts, 
    showToast,
    triggerConfetti,
    activeSessionStartTime,
    setIsWorkoutMinimized,
    discardActiveWorkout,
    updateDraftSplit
  } = useWorkout();

  // Active exercises in this workout session
  const activeExerciseIds = useMemo(() => {
    return Object.keys(draft.exerciseSets);
  }, [draft.exerciseSets]);

  const activeExercises = useMemo(() => {
    const list: {
      exercise: ExerciseDefinition;
      sets: typeof draft.exerciseSets[string];
      completedSets: number;
      isDone: boolean;
      isStarted: boolean;
      lastWeight?: number;
    }[] = [];

    activeExerciseIds.forEach(id => {
      const exercise = allExercises.find(e => e.id === id);
      if (!exercise) return;
      const sets = draft.exerciseSets[id] || [];
      const completedSets = sets.filter(s => s.completed && s.weight > 0).length;
      const isDone = sets.length > 0 && completedSets === sets.length;
      const isStarted = completedSets > 0 && !isDone;
      const lastPerf = getLastWorkoutSets(id, workouts);
      const lastWeight = lastPerf && lastPerf.weights.length > 0 ? Math.max(...lastPerf.weights.filter(w => w > 0)) : undefined;
      list.push({
        exercise,
        sets,
        completedSets,
        isDone,
        isStarted,
        lastWeight
      });
    });

    return list;
  }, [activeExerciseIds, draft.exerciseSets, allExercises, workouts]);

  // Which exercise is opened in the rich 3D input overlay
  const [selectedOverlayExercise, setSelectedOverlayExercise] = useState<ExerciseDefinition | null>(null);

  // Live stopwatch timer connected to absolute wall-clock start time
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    if (!activeSessionStartTime) return 0;
    return Math.max(0, Math.floor((Date.now() - activeSessionStartTime) / 1000));
  });

  useEffect(() => {
    const updateTimer = () => {
      if (activeSessionStartTime) {
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - activeSessionStartTime) / 1000)));
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSessionStartTime]);

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hours > 0) {
      return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Workout Builder & Empty State Navigation
  const [builderTab, setBuilderTab] = useState<'map' | 'split' | 'search'>('map');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [selectedSplit, setSelectedSplit] = useState<SplitType>(draft.splitType || 'upper');

  // Add Exercise Modal state (when user is in active session and wants to add more)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalTab, setAddModalTab] = useState<'map' | 'split' | 'search'>('map');
  const [modalSelectedMuscle, setModalSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'upper' | 'lower' | 'core'>('all');

  // Overall session metrics
  const totalExercises = activeExercises.length;
  const completedExercisesCount = activeExercises.filter(e => e.isDone).length;
  const totalCompletedSets = activeExercises.reduce((sum, e) => sum + e.completedSets, 0);
  const totalCompletedVolume = activeExercises.reduce((sum, e) => {
    return sum + e.sets.filter(s => s.completed && s.weight > 0).reduce((sSum, s) => sSum + (s.weight * (s.reps || 8)), 0);
  }, 0);
  const progressPct = totalExercises > 0 ? Math.min(100, Math.round((completedExercisesCount / totalExercises) * 100)) : 0;

  // Window overlays & modal states
  const [isMinimizeOverlayOpen, setIsMinimizeOverlayOpen] = useState(false);
  const [isCloseOverlayOpen, setIsCloseOverlayOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isZeroSetsHelpModalOpen, setIsZeroSetsHelpModalOpen] = useState(false);

  // Back button handlers for internal overlays & modals
  const isAnyConfirmationOverlayOpen = isMinimizeOverlayOpen || isCloseOverlayOpen || isFinishModalOpen || isZeroSetsHelpModalOpen;
  useBackButton(
    isAnyConfirmationOverlayOpen,
    () => {
      sounds.playPop();
      setIsMinimizeOverlayOpen(false);
      setIsCloseOverlayOpen(false);
      setIsFinishModalOpen(false);
      setIsZeroSetsHelpModalOpen(false);
    },
    75
  );

  useBackButton(
    isAddModalOpen,
    () => {
      sounds.playPop();
      setIsAddModalOpen(false);
    },
    60
  );

  const splitLabel = useMemo(() => {
    switch (draft.splitType) {
      case 'upper': return 'Üst Vücut';
      case 'lower': return 'Alt Vücut';
      case 'full': return 'Tüm Vücut';
      default: return 'Özel Seans';
    }
  }, [draft.splitType]);

  const handleMinimizeAndGoToHub = () => {
    sounds.playPop();
    setIsWorkoutMinimized(true);
    setIsMinimizeOverlayOpen(false);
    setIsCloseOverlayOpen(false);
    setIsFinishModalOpen(false);
    setIsZeroSetsHelpModalOpen(false);
    onBackToHub();
  };

  const handleConfirmDiscard = () => {
    sounds.playPop();
    discardActiveWorkout();
    setIsCloseOverlayOpen(false);
    setIsZeroSetsHelpModalOpen(false);
    onBackToHub();
  };

  // Handler when user taps "Bitir"
  const handleFinishWorkout = () => {
    sounds.playPop();
    if (totalCompletedSets === 0) {
      setIsZeroSetsHelpModalOpen(true);
      return;
    }
    setIsFinishModalOpen(true);
  };

  // Confirmed handler that actually saves and ends the workout
  const executeFinishWorkout = () => {
    const res = saveWorkout();
    if (res.success) {
      if (!res.isPR) {
        triggerConfetti();
      }
      setIsFinishModalOpen(false);
      onBackToHub();
    }
  };

  // Universal helper: adds exercise to draft (if not present) and opens rich input overlay
  const handleAddOrOpenExercise = (exercise: ExerciseDefinition) => {
    sounds.playPop();
    if (!draft.exerciseSets[exercise.id]) {
      const lastPerf = getLastWorkoutSets(exercise.id, workouts);
      const lastWeight = lastPerf && lastPerf.weights.length > 0 ? Math.max(...lastPerf.weights.filter(w => w > 0)) : 0;
      addExerciseToDraft(exercise.id, lastWeight, 8);
      showToast({
        title: '✓ Seansa Eklendi',
        description: `${exercise.name} antrenmanınıza eklendi.`,
        type: 'success'
      });
    }
    setSelectedOverlayExercise(exercise);
  };

  // Filtered exercises by split for Region-Based selection
  const splitExercises = useMemo(() => {
    return allExercises.filter(ex => {
      if (selectedSplit === 'upper') return ex.category === 'upper';
      if (selectedSplit === 'lower') return ex.category === 'lower';
      if (selectedSplit === 'custom') return ex.category === 'core' || ex.isCustom;
      return true;
    });
  }, [allExercises, selectedSplit]);

  // Filtered exercises for text search
  const filteredSearchExercises = useMemo(() => {
    return allExercises.filter(ex => {
      const matchesSearch = searchQuery.trim() === '' || ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategoryFilter === 'all' || ex.category === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [allExercises, searchQuery, selectedCategoryFilter]);

  const muscleList: MuscleGroup[] = [
    'chest',
    'back',
    'shoulder',
    'biceps',
    'triceps',
    'quads',
    'hamstring',
    'glutes',
    'abs',
    'calves'
  ];

  return (
    <div style={{ padding: '16px 16px calc(100px + var(--safe-bottom)) 16px', animation: 'fadeIn 0.2s ease-out' }}>
      {/* 1. TOP STICKY BAR: Live Timer, Split Title & Action Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
          padding: '8px 12px',
          background: 'rgba(15, 23, 42, 0.85)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)'
        }}
      >
        {/* Left: Live Timer Pill with Split Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: 'var(--cyan)',
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}
          >
            <TimerIcon size={14} />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
            {totalExercises === 0 ? 'Boş Antrenman' : splitLabel}
          </span>
        </div>

        {/* Right: Controls Group (Minimize, Finish, Close) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(0, 0, 0, 0.35)',
            padding: '3px 4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {/* 1. Minimize Button (—) */}
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setIsMinimizeOverlayOpen(true);
            }}
            style={{
              width: 30,
              height: 28,
              borderRadius: 5,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)';
              e.currentTarget.style.color = 'var(--cyan)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            title="Antrenmanı Küçült (Arka planda çalışmaya devam eder)"
          >
            <Minus size={15} strokeWidth={2.5} />
          </button>

          {/* 2. Finish Action Button */}
          {totalExercises > 0 && (
            <button
              type="button"
              onClick={handleFinishWorkout}
              style={{
                height: 28,
                padding: '0 10px',
                fontSize: 12,
                fontWeight: 800,
                borderRadius: 5,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: totalCompletedSets > 0 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : 'rgba(255, 255, 255, 0.08)',
                border: totalCompletedSets > 0 
                  ? 'none' 
                  : '1px solid rgba(255, 255, 255, 0.1)',
                color: totalCompletedSets > 0 ? '#ffffff' : 'var(--text-muted)',
                boxShadow: totalCompletedSets > 0 ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={totalCompletedSets > 0 ? 'Antrenmanı Kaydet ve Bitir' : 'Antrenmanı Bitir'}
            >
              <Check size={13} strokeWidth={3} />
              <span>Bitir</span>
            </button>
          )}

          {/* 3. Close Button (✕) */}
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setIsCloseOverlayOpen(true);
            }}
            style={{
              width: 30,
              height: 28,
              borderRadius: 5,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ef4444';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            title="Antrenmanı Kapat (İptal Et)"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CASE A: EMPTY WORKOUT (0 EXERCISES) -> RICH WORKOUT BUILDER */}
      {/* ========================================================= */}
      {totalExercises === 0 ? (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          {/* Header Banner: Visual Workout Creator */}
          <div
            className="card"
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 12,
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(15, 23, 42, 0.85) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.28)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--cyan)',
                  flexShrink: 0
                }}
              >
                <Dumbbell size={18} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff' }}>
                  Antrenmanını Tasarla
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  Vücut haritasından kas grubuna dokunarak veya bölge seçerek hareketlerini ekle.
                </div>
              </div>
            </div>
          </div>

          {/* 3-WAY VIEW MODE SWITCHER: 🗺️ Harita | 📋 Bölgeye Göre | 🔍 Arama */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              background: 'rgba(15, 23, 42, 0.85)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: 14,
              gap: 4
            }}
          >
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setBuilderTab('map');
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: builderTab === 'map' ? 'var(--accent)' : 'transparent',
                color: builderTab === 'map' ? '#ffffff' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: builderTab === 'map' ? '0 2px 10px rgba(255, 71, 87, 0.35)' : 'none'
              }}
            >
              <Map size={14} />
              <span>Vücut Haritası</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setBuilderTab('split');
                setSelectedMuscle(null);
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: builderTab === 'split' ? 'var(--accent)' : 'transparent',
                color: builderTab === 'split' ? '#ffffff' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: builderTab === 'split' ? '0 2px 10px rgba(255, 71, 87, 0.35)' : 'none'
              }}
            >
              <ListFilter size={14} />
              <span>Bölgeye Göre</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setBuilderTab('search');
                setSelectedMuscle(null);
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: builderTab === 'search' ? 'var(--accent)' : 'transparent',
                color: builderTab === 'search' ? '#ffffff' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: builderTab === 'search' ? '0 2px 10px rgba(255, 71, 87, 0.35)' : 'none'
              }}
            >
              <Search size={14} />
              <span>Arama</span>
            </button>
          </div>

          {/* TAB 1: 🗺️ ANATOMICAL BODY MAP */}
          {builderTab === 'map' && (
            <div>
              {selectedMuscle === null ? (
                <div>
                  <AnatomicalBodyMap
                    onSelectMuscle={(m) => {
                      sounds.playPop();
                      setSelectedMuscle(m);
                    }}
                    selectedMuscle={selectedMuscle}
                  />

                  {/* Quick Muscle Selector Badges below map */}
                  <div style={{ marginTop: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                      Hızlı Kas Grubu Seçimi:
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {muscleList.map(m => {
                        const mMeta = muscleMetadata[m];
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              sounds.playPop();
                              setSelectedMuscle(m);
                            }}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 'var(--radius-full)',
                              background: 'rgba(30, 41, 59, 0.6)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              color: '#ffffff',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <AnatomyIcon muscle={m} size={14} />
                            <span>{mMeta?.name || m}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <MuscleDetailView
                  muscle={selectedMuscle}
                  onBack={() => setSelectedMuscle(null)}
                  onSelectOtherMuscle={(m) => setSelectedMuscle(m)}
                />
              )}
            </div>
          )}

          {/* TAB 2: 📋 REGION / SPLIT BASED SELECTION */}
          {builderTab === 'split' && (
            <div>
              {/* Split Selector Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 5,
                  background: 'rgba(15, 23, 42, 0.8)',
                  padding: '4px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: 14
                }}
              >
                {[
                  { id: 'upper', label: 'Üst Vücut' },
                  { id: 'lower', label: 'Alt Vücut' },
                  { id: 'full', label: 'Tüm Vücut' },
                  { id: 'custom', label: 'Core / Özel' }
                ].map((s) => {
                  const isActive = selectedSplit === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        setSelectedSplit(s.id as SplitType);
                        updateDraftSplit(s.id as SplitType);
                      }}
                      style={{
                        padding: '8px 4px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: isActive ? 'var(--accent)' : 'transparent',
                        color: isActive ? '#ffffff' : 'var(--text-muted)',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center'
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {/* Grid of Exercises for this split */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 10,
                  marginBottom: 16
                }}
              >
                {splitExercises.map((exercise) => {
                  const lastPerf = getLastWorkoutSets(exercise.id, workouts);
                  const lastWeight = lastPerf && lastPerf.weights.length > 0 ? Math.max(...lastPerf.weights.filter(w => w > 0)) : undefined;
                  return (
                    <ExerciseSquareCard
                      key={exercise.id}
                      exercise={exercise}
                      lastWeight={lastWeight}
                      onClick={() => handleAddOrOpenExercise(exercise)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: 🔍 SEARCH */}
          {builderTab === 'search' && (
            <div>
              {/* Search Input */}
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 12 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Hareket ara (örn: Bench, Squat, Curl)..."
                  className="form-input"
                  style={{
                    paddingLeft: 36,
                    fontSize: 13,
                    height: 40,
                    borderRadius: 'var(--radius-md)'
                  }}
                />
              </div>

              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 2 }}>
                {[
                  { id: 'all', label: 'Tümü' },
                  { id: 'upper', label: 'Üst Vücut' },
                  { id: 'lower', label: 'Alt Vücut' },
                  { id: 'core', label: 'Core / Karın' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat.id as any)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: selectedCategoryFilter === cat.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: selectedCategoryFilter === cat.id ? 'var(--accent-soft)' : 'var(--input-bg)',
                      color: selectedCategoryFilter === cat.id ? 'var(--accent)' : 'var(--text-muted)',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Filtered Exercise List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {filteredSearchExercises.map(ex => {
                  const meta = muscleMetadata[ex.muscle];
                  const isAdded = Boolean(draft.exerciseSets[ex.id]);
                  const lastPerf = getLastWorkoutSets(ex.id, workouts);
                  const lastWeight = lastPerf && lastPerf.weights.length > 0 ? Math.max(...lastPerf.weights.filter(w => w > 0)) : null;

                  return (
                    <div
                      key={ex.id}
                      onClick={() => handleAddOrOpenExercise(ex)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: isAdded ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 41, 59, 0.5)',
                        border: isAdded ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className={`anatomy-badge muscle-${ex.muscle}`} style={{ width: 32, height: 32 }}>
                          <AnatomyIcon muscle={ex.muscle} size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>
                            {ex.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {meta?.name || ex.muscle} {lastWeight ? `• Son: ${lastWeight} kg` : ''}
                          </div>
                        </div>
                      </div>

                      {isAdded ? (
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#34d399' }}>✓ Seansda</span>
                      ) : (
                        <PlusCircle size={18} color="var(--cyan)" />
                      )}
                    </div>
                  );
                })}

                {filteredSearchExercises.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)', fontSize: 13 }}>
                    Uygun hareket bulunamadı.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Clean Single Discard Button at Bottom */}
          <div style={{ textAlign: 'center', marginTop: 14, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsCloseOverlayOpen(true);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#f87171',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <Trash2 size={14} />
              <span>Antrenmanı İptal Et ve Çık</span>
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* CASE B: ACTIVE WORKOUT WITH EXERCISES IN PROGRESS         */
        /* ========================================================= */
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          {/* Progress Dashboard Card */}
          <div
            className="card"
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 16,
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Dumbbell size={16} color="var(--accent)" />
                <span style={{ fontSize: 13.5, fontWeight: 900, color: '#ffffff' }}>
                  Aktif Antrenman İlerlemesi
                </span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: completedExercisesCount === totalExercises && totalExercises > 0 ? '#34d399' : 'var(--cyan)' }}>
                {completedExercisesCount} / {totalExercises} Hareket Tamamlandı
              </span>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                width: '100%',
                height: 6,
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
                marginBottom: 10
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  background: progressPct === 100 
                    ? 'linear-gradient(90deg, #10b981, #34d399)' 
                    : 'linear-gradient(90deg, var(--cyan), var(--accent))',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>

            {/* Quick Numbers Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#10b981' }}>✓</span>
                <strong style={{ color: '#ffffff' }}>{totalCompletedSets}</strong> Set Yapıldı
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Flame size={13} color="#fbbf24" />
                <strong style={{ color: '#fbbf24' }}>{totalCompletedVolume.toLocaleString('tr-TR')} kg</strong> Hacim
              </span>
            </div>
          </div>

          {/* Exercise List Header: Title + Add Movement */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                BUGÜNÜN PROGRAMI ({activeExercises.length} HAREKET)
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--cyan)',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Plus size={14} />
                <span>Hareket Ekle</span>
              </button>
            </div>

            {/* 2-Column Grid of Exercise Square Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 10
              }}
            >
              {activeExercises.map(({ exercise, lastWeight }, index) => (
                <ExerciseSquareCard
                  key={exercise.id}
                  exercise={exercise}
                  index={index + 1}
                  lastWeight={lastWeight}
                  onClick={() => setSelectedOverlayExercise(exercise)}
                />
              ))}
            </div>
          </div>

          {/* Finish Workout Button */}
          <button
            type="button"
            onClick={handleFinishWorkout}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '16px 20px',
              fontSize: 15.5,
              fontWeight: 900,
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              background: totalCompletedSets > 0 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                : 'rgba(30, 41, 59, 0.75)',
              border: totalCompletedSets > 0
                ? 'none'
                : '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: totalCompletedSets > 0
                ? '0 6px 24px rgba(16, 185, 129, 0.4)'
                : 'none',
              letterSpacing: '-0.01em',
              cursor: 'pointer',
              marginBottom: 10
            }}
          >
            <Check size={20} strokeWidth={3} />
            <span>
              {totalCompletedSets > 0 
                ? `Antrenmanı Bitir (${totalCompletedSets} Set Tamamlandı)` 
                : 'Antrenmanı Bitir (0 Set Tamamlandı)'}
            </span>
          </button>

          {/* Cancel & Discard option at bottom */}
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsCloseOverlayOpen(true);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <Trash2 size={13} />
              <span>Antrenmanı İptal Et (Kaydetmeden Çık)</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. RICH 3D EXERCISE INPUT OVERLAY */}
      <ExerciseInputOverlay
        exercise={selectedOverlayExercise}
        isOpen={Boolean(selectedOverlayExercise)}
        onClose={() => setSelectedOverlayExercise(null)}
      />

      {/* 7. ADD EXERCISE MODAL / SHEET (With Vücut Haritası, Bölgeye Göre, Arama) */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            maxWidth: 520,
            margin: '0 auto'
          }}
        >
          <div
            className="card"
            style={{
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '20px 20px 0 0',
              padding: '16px',
              background: '#0b1120',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              marginBottom: 0,
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff' }}>
                Antrenmana Hareket Ekle
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setModalSelectedMuscle(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal View Tabs: 🗺️ Harita | 📋 Bölgeye Göre | 🔍 Arama */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(15, 23, 42, 0.85)',
                padding: '3px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: 12,
                gap: 4
              }}
            >
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setAddModalTab('map');
                }}
                style={{
                  flex: 1,
                  padding: '7px 4px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: addModalTab === 'map' ? 'var(--accent)' : 'transparent',
                  color: addModalTab === 'map' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5
                }}
              >
                <Map size={13} />
                <span>Harita</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setAddModalTab('split');
                  setModalSelectedMuscle(null);
                }}
                style={{
                  flex: 1,
                  padding: '7px 4px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: addModalTab === 'split' ? 'var(--accent)' : 'transparent',
                  color: addModalTab === 'split' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5
                }}
              >
                <ListFilter size={13} />
                <span>Bölgeye Göre</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setAddModalTab('search');
                  setModalSelectedMuscle(null);
                }}
                style={{
                  flex: 1,
                  padding: '7px 4px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: addModalTab === 'search' ? 'var(--accent)' : 'transparent',
                  color: addModalTab === 'search' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5
                }}
              >
                <Search size={13} />
                <span>Arama</span>
              </button>
            </div>

            {/* Modal Body Container with Scroll */}
            <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 10 }}>
              {/* MODAL TAB 1: BODY MAP */}
              {addModalTab === 'map' && (
                <div>
                  {modalSelectedMuscle === null ? (
                    <div>
                      <AnatomicalBodyMap
                        onSelectMuscle={(m) => {
                          sounds.playPop();
                          setModalSelectedMuscle(m);
                        }}
                        selectedMuscle={modalSelectedMuscle}
                      />
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                          Hızlı Kas Grubu Seç:
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {muscleList.map(m => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                sounds.playPop();
                                setModalSelectedMuscle(m);
                              }}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 'var(--radius-full)',
                                background: 'rgba(30, 41, 59, 0.7)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: '#ffffff',
                                fontSize: 10.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <AnatomyIcon muscle={m} size={13} />
                              <span>{muscleMetadata[m]?.name || m}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <MuscleDetailView
                      muscle={modalSelectedMuscle}
                      onBack={() => setModalSelectedMuscle(null)}
                      onSelectOtherMuscle={(m) => setModalSelectedMuscle(m)}
                    />
                  )}
                </div>
              )}

              {/* MODAL TAB 2: SPLIT SELECTION */}
              {addModalTab === 'split' && (
                <div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 4,
                      background: 'rgba(15, 23, 42, 0.8)',
                      padding: '4px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      marginBottom: 12
                    }}
                  >
                    {[
                      { id: 'upper', label: 'Üst' },
                      { id: 'lower', label: 'Alt' },
                      { id: 'full', label: 'Tüm' },
                      { id: 'custom', label: 'Core' }
                    ].map((s) => {
                      const isActive = selectedSplit === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            sounds.playPop();
                            setSelectedSplit(s.id as SplitType);
                          }}
                          style={{
                            padding: '6px 2px',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            background: isActive ? 'var(--accent)' : 'transparent',
                            color: isActive ? '#ffffff' : 'var(--text-muted)',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 8
                    }}
                  >
                    {splitExercises.map((exercise) => {
                      const lastPerf = getLastWorkoutSets(exercise.id, workouts);
                      const lastWeight = lastPerf && lastPerf.weights.length > 0 ? Math.max(...lastPerf.weights.filter(w => w > 0)) : undefined;
                      return (
                        <ExerciseSquareCard
                          key={exercise.id}
                          exercise={exercise}
                          lastWeight={lastWeight}
                          onClick={() => handleAddOrOpenExercise(exercise)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MODAL TAB 3: SEARCH */}
              {addModalTab === 'search' && (
                <div>
                  <div style={{ position: 'relative', marginBottom: 10 }}>
                    <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: 10, top: 12 }} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Hareket ara (örn: Bench, Squat, Curl)..."
                      className="form-input"
                      style={{
                        paddingLeft: 34,
                        fontSize: 13,
                        height: 38,
                        borderRadius: 'var(--radius-md)'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 2 }}>
                    {[
                      { id: 'all', label: 'Tümü' },
                      { id: 'upper', label: 'Üst Vücut' },
                      { id: 'lower', label: 'Alt Vücut' },
                      { id: 'core', label: 'Core / Karın' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryFilter(cat.id as any)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 'var(--radius-full)',
                          border: selectedCategoryFilter === cat.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                          background: selectedCategoryFilter === cat.id ? 'var(--accent-soft)' : 'var(--input-bg)',
                          color: selectedCategoryFilter === cat.id ? 'var(--accent)' : 'var(--text-muted)',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {filteredSearchExercises.map(ex => {
                      const meta = muscleMetadata[ex.muscle];
                      const isAdded = Boolean(draft.exerciseSets[ex.id]);
                      const lastPerf = getLastWorkoutSets(ex.id, workouts);
                      const lastWeight = lastPerf && lastPerf.weights.length > 0 ? Math.max(...lastPerf.weights.filter(w => w > 0)) : null;

                      return (
                        <div
                          key={ex.id}
                          onClick={() => handleAddOrOpenExercise(ex)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-md)',
                            background: isAdded ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 41, 59, 0.5)',
                            border: isAdded ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className={`anatomy-badge muscle-${ex.muscle}`} style={{ width: 32, height: 32 }}>
                              <AnatomyIcon muscle={ex.muscle} size={18} />
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>
                                {ex.name}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {meta?.name || ex.muscle} {lastWeight ? `• Son: ${lastWeight} kg` : ''}
                              </div>
                            </div>
                          </div>

                            {isAdded ? (
                              <span style={{ fontSize: 11, fontWeight: 800, color: '#34d399' }}>✓ Seansda</span>
                            ) : (
                              <PlusCircle size={18} color="var(--cyan)" />
                            )}
                        </div>
                      );
                    })}

                    {filteredSearchExercises.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)', fontSize: 13 }}>
                        Uygun hareket bulunamadı.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. MINIMIZE CONFIRMATION OVERLAY */}
      {isMinimizeOverlayOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsMinimizeOverlayOpen(false)}
          style={{ zIndex: 1100 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 360,
              width: '90%',
              padding: '22px 20px',
              borderRadius: 'var(--radius-xl)',
              background: '#0f172a',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--cyan)',
                  flexShrink: 0
                }}
              >
                <Minimize2 size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', margin: 0 }}>
                  Antrenmanı Küçült?
                </h3>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  Arka planda çalışmaya devam edecek
                </div>
              </div>
            </div>

            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 16px' }}>
              Kronometre ve antrenmanınız işlemeye devam eder. Panodaki çubuktan veya antrenman sekmesinden dilediğiniz an geri dönebilirsiniz.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={handleMinimizeAndGoToHub}
                className="btn btn-primary"
                style={{
                  padding: '12px 14px',
                  fontSize: 13,
                  fontWeight: 800,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.3) 0%, rgba(14, 165, 233, 0.4) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.5)',
                  color: 'var(--cyan)',
                  cursor: 'pointer'
                }}
              >
                <Minimize2 size={15} />
                <span>Küçült ve Panoya Dön</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMinimizeOverlayOpen(false)}
                className="btn btn-secondary"
                style={{
                  padding: '10px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Antrenmanda Kal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. CLOSE / DISCARD OVERLAY */}
      {isCloseOverlayOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsCloseOverlayOpen(false)}
          style={{ zIndex: 1100 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 360,
              width: '90%',
              padding: '22px 20px',
              borderRadius: 'var(--radius-xl)',
              background: '#0f172a',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(239, 68, 68, 0.15)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f87171',
                  flexShrink: 0
                }}
              >
                <Trash2 size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', margin: 0 }}>
                  Antrenmanı Kapat?
                </h3>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  {totalCompletedSets === 0 ? 'Kaydedilecek set bulunmuyor' : `${totalCompletedSets} set silinecek`}
                </div>
              </div>
            </div>

            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 16px' }}>
              {totalCompletedSets === 0
                ? 'Bu antrenman oturumu günlüğünüze kaydedilmeden kapatılacak ve silinecektir.'
                : `Şu ana kadar girdiğiniz ${totalCompletedSets} set kaydedilmeden silinecektir. Kapatmak istediğinize emin misiniz?`}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Primary: Discard & Close */}
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="btn btn-primary"
                style={{
                  padding: '12px 14px',
                  fontSize: 13,
                  fontWeight: 800,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={15} />
                <span>Antrenmanı Kapat ve Sil</span>
              </button>

              {/* Secondary: Minimize instead */}
              <button
                type="button"
                onClick={handleMinimizeAndGoToHub}
                className="btn btn-secondary"
                style={{
                  padding: '11px 14px',
                  fontSize: 12.5,
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  color: 'var(--cyan)',
                  cursor: 'pointer'
                }}
              >
                <Minimize2 size={15} />
                <span>Kapatma, Arka Planda Bırak</span>
              </button>

              {/* Dismiss */}
              <button
                type="button"
                onClick={() => setIsCloseOverlayOpen(false)}
                className="btn btn-secondary"
                style={{
                  padding: '10px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  marginTop: 2,
                  cursor: 'pointer'
                }}
              >
                Vazgeç (Antrenmana Dön)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. ZERO SETS HELP OVERLAY (When user taps finish but 0 sets) */}
      {isZeroSetsHelpModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsZeroSetsHelpModalOpen(false)}
          style={{ zIndex: 1100 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 360,
              width: '90%',
              padding: '22px 20px',
              borderRadius: 'var(--radius-xl)',
              background: '#0f172a',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fbbf24',
                  flexShrink: 0
                }}
              >
                <Check size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', margin: 0 }}>
                  Henüz Set Tamamlanmadı
                </h3>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  Kaydedilecek antrenman verisi yok
                </div>
              </div>
            </div>

            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 16px' }}>
              Antrenmanı günlüğünüze kaydedebilmek için en az bir seti tamamlamanız gerekir. Çıkmak istiyorsanız oturumu kapatabilirsiniz.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Option 1: Continue logging */}
              {totalExercises > 0 && (
                <button
                  type="button"
                  onClick={() => setIsZeroSetsHelpModalOpen(false)}
                  className="btn btn-primary"
                  style={{
                    padding: '12px 14px',
                    fontSize: 13,
                    fontWeight: 800,
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer'
                  }}
                >
                  <Dumbbell size={15} />
                  <span>Set Girmeye Devam Et</span>
                </button>
              )}

              {/* Option 2: Close / Discard */}
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="btn btn-secondary"
                style={{
                  padding: '11px 14px',
                  fontSize: 12.5,
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={15} />
                <span>Antrenmanı Kapat (Kaydetmeden Çık)</span>
              </button>

              {/* Option 3: Dismiss */}
              <button
                type="button"
                onClick={() => setIsZeroSetsHelpModalOpen(false)}
                className="btn btn-secondary"
                style={{
                  padding: '10px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. FINISH WORKOUT CONFIRMATION MODAL */}
      {isFinishModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsFinishModalOpen(false)}
          style={{ zIndex: 1150 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 400,
              width: '92%',
              padding: '22px 20px',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(180deg, #131b2e 0%, #0b1120 100%)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.15)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399',
                  flexShrink: 0
                }}
              >
                <Check size={20} strokeWidth={3} />
              </div>
              <div>
                <h3 style={{ fontSize: 16.5, fontWeight: 900, color: '#ffffff', margin: 0 }}>
                  Antrenmanı Bitir ve Kaydet?
                </h3>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  Seans özetinizi kontrol edip onaylayın
                </div>
              </div>
            </div>

            {/* Session Summary Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 8px',
                margin: '14px 0',
                textAlign: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)' }}>GEÇEN SÜRE</div>
                <div style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--cyan)', marginTop: 2 }}>
                  {formatTimer(elapsedSeconds)}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.08)', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)' }}>HAREKET</div>
                <div style={{ fontSize: 13.5, fontWeight: 900, color: '#ffffff', marginTop: 2 }}>
                  {completedExercisesCount} / {totalExercises}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)' }}>HACİM ({totalCompletedSets} SET)</div>
                <div style={{ fontSize: 13.5, fontWeight: 900, color: '#fbbf24', marginTop: 2 }}>
                  {totalCompletedVolume.toLocaleString('tr-TR')} kg
                </div>
              </div>
            </div>

            {/* Incomplete Exercises Warning Banner */}
            {completedExercisesCount < totalExercises && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  marginBottom: 14,
                  fontSize: 12,
                  color: '#fde68a',
                  lineHeight: 1.45
                }}
              >
                <strong>⚠️ {totalExercises - completedExercisesCount} hareket henüz tamamlanmadı.</strong>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                  Şimdi bitirirseniz tamamlanan hareketler günlüğünüze kaydedilir. Gün içinde tekrar girdiğinizde yalnızca kalan hareketlerden devam edebilirsiniz.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Primary Action: Confirm Save & Finish */}
              <button
                type="button"
                onClick={executeFinishWorkout}
                className="btn btn-primary"
                style={{
                  padding: '13px 16px',
                  fontSize: 14,
                  fontWeight: 900,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                  cursor: 'pointer'
                }}
              >
                <Check size={18} strokeWidth={3} />
                <span>Evet, Antrenmanı Bitir ve Kaydet</span>
              </button>

              {/* Secondary Option: Minimize and Continue Later */}
              <button
                type="button"
                onClick={handleMinimizeAndGoToHub}
                className="btn btn-secondary"
                style={{
                  padding: '11px 14px',
                  fontSize: 12.5,
                  fontWeight: 800,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: 'var(--cyan)',
                  cursor: 'pointer'
                }}
              >
                <Minimize2 size={15} />
                <span>Mola Ver / Daha Sonra Devam Et</span>
              </button>

              {/* Cancel / Dismiss */}
              <button
                type="button"
                onClick={() => setIsFinishModalOpen(false)}
                className="btn btn-secondary"
                style={{
                  padding: '10px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  marginTop: 2,
                  cursor: 'pointer'
                }}
              >
                Vazgeç (Antrenmana Dön)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
