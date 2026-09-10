import React, { useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { SplitType, MuscleGroup, ExerciseDefinition } from '../../types/workout';
import { ExerciseSquareCard } from './ExerciseSquareCard';
import { ExerciseInputOverlay } from './ExerciseInputOverlay';
import { WorkoutCartDrawer } from './WorkoutCartDrawer';
import { AddCustomExerciseModal } from './AddCustomExerciseModal';
import { AnatomicalBodyMap } from './AnatomicalBodyMap';
import { MuscleDetailView } from './MuscleDetailView';
import { SplitIcon } from './SplitIcon';
import { AnatomyIcon } from '../../data/anatomyIcons';
import { muscleMetadata } from '../../data/muscleMetadata';
import { sounds } from '../../utils/audio';
import { getSuggestedNextWorkout } from '../../utils/recommendationEngine';
import { PTGuidanceCard } from './PTGuidanceCard';
import { WorkoutSessionProgressCard } from './WorkoutSessionProgressCard';
import { RecommendedRoutineView } from './RecommendedRoutineView';
import { calculateWorkoutSessionTarget, MuscleTargetProgress } from '../../utils/workoutTargets';
import { 
  Calendar, 
  PlusCircle, 
  Flame, 
  Map, 
  ListFilter, 
  Sparkles, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Plus, 
  ArrowLeft, 
  Zap,
  CheckCircle2,
  Info,
  Dumbbell
} from 'lucide-react';
import { HeaderBurgerMenu } from '../layout/HeaderBurgerMenu';
import { getTodayLocalDate } from '../../utils/dateUtils';

export const WorkoutView: React.FC = () => {
  const { 
    draft, 
    updateDraftDate, 
    updateDraftSplit, 
    updateDraftIsManual,
    allExercises, 
    workouts, 
    overallStats,
    populateSampleData,
    isLoggingWorkout,
    setIsLoggingWorkout
  } = useWorkout();

  const suggestedNext = getSuggestedNextWorkout(workouts);
  const isManual = Boolean(draft.isManual);

  // Navigation state within workout entry
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [selectedOverlayExercise, setSelectedOverlayExercise] = useState<ExerciseDefinition | null>(null);

  const [viewMode, setViewMode] = useState<'recommended' | 'map' | 'all'>('recommended');
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [showOtherModes, setShowOtherModes] = useState(false);

  const todayStr = getTodayLocalDate();

  const splits: { id: SplitType; label: string }[] = [
    { id: 'upper', label: 'Üst Vücut' },
    { id: 'lower', label: 'Alt Vücut' },
    { id: 'full', label: 'Tüm Vücut' },
    { id: 'custom', label: 'Core / Özel' }
  ];

  // Filter exercises for "all" mode
  const activeExercises = allExercises.filter(ex => {
    if (draft.splitType === 'upper') return ex.category === 'upper';
    if (draft.splitType === 'lower') return ex.category === 'lower';
    if (draft.splitType === 'custom') return ex.category === 'core' || ex.isCustom;
    return true;
  });

  // Active workout draft calculation (Live session counters)
  const trainedMusclesMap: Partial<Record<MuscleGroup, number>> = {};
  let liveSessionSets = 0;
  let liveSessionVolume = 0;

  Object.entries(draft.exerciseSets).forEach(([exId, sets]) => {
    const ex = allExercises.find((e) => e.id === exId);
    if (!ex) return;

    sets.forEach((s) => {
      if (s.weight > 0) {
        liveSessionSets++;
        liveSessionVolume += s.weight * (s.reps || 5);
        trainedMusclesMap[ex.muscle] = (trainedMusclesMap[ex.muscle] || 0) + 1;
      }
    });
  });

  const trainedMusclesList = Object.keys(trainedMusclesMap) as MuscleGroup[];

  // Session targets & completion calculation (scientific volume & exercise requirements)
  const sessionTarget = React.useMemo(() => {
    return calculateWorkoutSessionTarget(
      draft.splitType,
      draft.exerciseSets,
      allExercises,
      isManual ? [] : (suggestedNext.recommendedMuscles || [])
    );
  }, [draft.splitType, draft.exerciseSets, allExercises, isManual, suggestedNext.recommendedMuscles]);

  const muscleTargetMap = React.useMemo(() => {
    const map: Partial<Record<MuscleGroup, MuscleTargetProgress>> = {};
    sessionTarget.muscleTargets.forEach((mt) => {
      map[mt.muscle] = mt;
    });
    return map;
  }, [sessionTarget]);

  const handleSelectMuscle = (muscle: MuscleGroup) => {
    setSelectedMuscle(muscle);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartNewWorkout = (
    preferredSplit?: SplitType, 
    isRecommendedLaunch: boolean = false, 
    isManualLaunch: boolean = false
  ) => {
    sounds.playPop();
    const isManualMode = isManualLaunch || !isRecommendedLaunch;
    updateDraftIsManual(isManualMode);
    const splitToSet = preferredSplit || (isManualMode ? 'custom' : (suggestedNext.isTodayCompleted ? 'custom' : suggestedNext?.recommendedSplit)) || 'upper';
    if (Object.keys(draft.exerciseSets).length === 0) {
      updateDraftSplit(splitToSet);
    } else if (preferredSplit && preferredSplit !== draft.splitType) {
      updateDraftSplit(preferredSplit);
    }
    if (isRecommendedLaunch) {
      setViewMode('recommended');
      setShowOtherModes(false);
    } else {
      setViewMode('map');
    }
    setIsLoggingWorkout(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToFeed = () => {
    sounds.playPop();
    setIsLoggingWorkout(false);
    setSelectedMuscle(null);
    setShowOtherModes(false);
  };

  // ==========================================
  // VIEW 1: ACTIVE WORKOUT LOGGING SESSION
  // ==========================================
  if (isLoggingWorkout) {
    return (
      <div style={{ padding: '16px 16px calc(80px + var(--safe-bottom)) 16px', animation: 'fadeIn 0.2s ease-out' }}>
        {/* Ultra-Compact Session Header & Date Card */}
        <div className="card" style={{ padding: '8px 12px', marginBottom: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              gap: 10
            }}
          >
            {/* Left: 2-Row Height Back Button */}
            <button
              type="button"
              onClick={handleBackToFeed}
              className="btn btn-secondary"
              aria-label="Listeye Dön"
              title="Listeye Dön"
              style={{
                width: 38,
                minWidth: 38,
                padding: 0,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid var(--border)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                alignSelf: 'stretch',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={18} color="var(--accent)" />
            </button>

            {/* Right: 2 Rows (Row 1: Title, Row 2: Date Picker) */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 5,
                flex: 1,
                minWidth: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <h2
                  style={{
                    fontSize: 15,
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                    margin: 0,
                    lineHeight: 1.2
                  }}
                >
                  Yeni Antrenman Girişi
                </h2>
                {liveSessionSets > 0 ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'var(--muscle-emerald)',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-full)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {liveSessionSets} Set
                  </span>
                ) : isManual ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--cyan)',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Dumbbell size={11} />
                    <span>Serbest Seans</span>
                  </span>
                ) : suggestedNext.isTodayCompleted && draft.date === todayStr ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      whiteSpace: 'nowrap'
                    }}
                    title="Bugün için ana antrenman zaten tamamlandı. Ek seans ekleniyor."
                  >
                    <CheckCircle2 size={11} color="#10b981" />
                    <span>Ek Seans</span>
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--cyan)',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      whiteSpace: 'nowrap'
                    }}
                    title={suggestedNext.reason}
                  >
                    <Zap size={11} fill="currentColor" />
                    <span>Öneri: {suggestedNext.splitTitle.split(' ')[0]}</span>
                  </span>
                )}
              </div>

              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 9,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--accent)'
                  }}
                >
                  <Calendar size={13} />
                </div>
                <input
                  id="workout-date"
                  type="date"
                  value={draft.date}
                  onChange={(e) => updateDraftDate(e.target.value)}
                  className="form-input"
                  style={{
                    fontWeight: 600,
                    padding: '4px 10px 4px 28px',
                    fontSize: 12.5,
                    height: 28,
                    width: '100%',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid var(--border)',
                    colorScheme: 'dark'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Gentle PT Context Alert: If today's workout is already completed */}
          {suggestedNext.isTodayCompleted && draft.date === todayStr && liveSessionSets === 0 && (
            <div
              style={{
                marginTop: 8,
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 11.5,
                color: '#d1fae5',
                lineHeight: 1.35
              }}
            >
              <Info size={13} color="#10b981" style={{ flexShrink: 0 }} />
              <span>
                <strong>PT Bilgisi:</strong> Bugün zaten <strong>{suggestedNext.todayWorkoutSummary?.splitName}</strong> tamamlandı ({suggestedNext.todayWorkoutSummary?.totalSets} Set). Buradan ek bir seans (Kardiyo / Karın) ekleyebilirsiniz.
              </span>
            </div>
          )}

          {/* Live Session Counter Banner (Only when active) */}
          {liveSessionSets > 0 && (
            <div
              style={{
                marginTop: 8,
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muscle-emerald)', fontWeight: 700 }}>
                  <Flame size={14} />
                  Canlı Seans: {liveSessionSets} Set
                </span>
                <span style={{ color: '#ffffff', fontWeight: 800 }}>
                  {liveSessionVolume.toLocaleString()} kg Hacim
                </span>
              </div>

              {/* Trained muscles mini chips */}
              {trainedMusclesList.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                  {trainedMusclesList.map((tm) => (
                    <span
                      key={tm}
                      onClick={() => handleSelectMuscle(tm)}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: 'rgba(16, 185, 129, 0.25)',
                        color: '#a7f3d0',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <AnatomyIcon muscle={tm} size={12} />
                      <span>{muscleMetadata[tm]?.name}: {trainedMusclesMap[tm]} Set</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Session Progress & Target Metrics Dashboard (Shown in Map & All modes only for recommended sessions) */}
        {!isManual && viewMode !== 'recommended' && (
          <WorkoutSessionProgressCard sessionTarget={sessionTarget} />
        )}

        {/* View Mode Switcher */}
        {(() => {
          const isOtherModesVisible = isManual || showOtherModes || viewMode !== 'recommended';
          return (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                background: 'rgba(15, 23, 42, 0.85)',
                padding: '4px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                marginBottom: 14,
                gap: 4,
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {!isOtherModesVisible ? (
                /* COLLAPSED: Önerilen Program covers the selector, button on the right reveals other options */
                <>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setViewMode('recommended');
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: 'linear-gradient(135deg, #ff4757, #ff6b81)',
                      color: '#ffffff',
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 12px rgba(255, 71, 87, 0.45)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Zap size={15} fill="#ffffff" />
                    <span>Önerilen Program</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setShowOtherModes(true);
                    }}
                    title="Diğer Seçenekleri Göster (Harita, Tüm Liste)"
                    aria-label="Diğer Seçenekleri Göster"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-muted)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                  >
                    <span>Diğer Seçenekler</span>
                    <ChevronDown size={14} />
                  </button>
                </>
              ) : (
                /* EXPANDED: All options visible */
                <>
                  {!isManual && (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        setViewMode('recommended');
                        setShowOtherModes(false);
                      }}
                      style={{
                        flex: 1.15,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '10px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: viewMode === 'recommended' ? 'linear-gradient(135deg, #ff4757, #ff6b81)' : 'transparent',
                        color: viewMode === 'recommended' ? '#ffffff' : 'var(--text-muted)',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: viewMode === 'recommended' ? '0 2px 10px rgba(255, 71, 87, 0.4)' : 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Zap size={14} fill={viewMode === 'recommended' ? '#ffffff' : 'currentColor'} />
                      <span>Önerilen Program</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setViewMode('map');
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '10px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: viewMode === 'map' ? 'var(--accent)' : 'transparent',
                      color: viewMode === 'map' ? '#ffffff' : 'var(--text-muted)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: viewMode === 'map' ? '0 2px 10px rgba(239, 68, 68, 0.35)' : 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Map size={14} />
                    <span>Harita</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setViewMode('all');
                      setSelectedMuscle(null);
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '10px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: viewMode === 'all' ? 'var(--accent)' : 'transparent',
                      color: viewMode === 'all' ? '#ffffff' : 'var(--text-muted)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: viewMode === 'all' ? '0 2px 10px rgba(239, 68, 68, 0.35)' : 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <ListFilter size={14} />
                    <span>Tüm Liste</span>
                  </button>
                  {!isManual && (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        setShowOtherModes(false);
                        setViewMode('recommended');
                      }}
                      title="Seçenekleri gizle ve Önerilen Programa dön"
                      aria-label="Seçenekleri Gizle"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }}
                    >
                      <ChevronUp size={15} />
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })()}

        {/* VIEW MODE 0: RECOMMENDED ROUTINE (FOCUSED ONLY ON RECOMMENDED EXERCISES) */}
        {viewMode === 'recommended' && (
          <RecommendedRoutineView
            split={draft.splitType}
            onOpenExerciseInput={(exercise) => setSelectedOverlayExercise(exercise)}
            onOpenAddCustom={() => setIsAddCustomOpen(true)}
            onSwitchToAllMode={() => setViewMode('all')}
          />
        )}

        {/* VIEW MODE 1: BODY MAP NAVIGATION */}
        {viewMode === 'map' && (
          <>
            {selectedMuscle === null ? (
              <div>
                {/* Interactive Full-Body Anatomical Map with Recommendations */}
                <AnatomicalBodyMap
                  onSelectMuscle={handleSelectMuscle}
                  selectedMuscle={selectedMuscle}
                  suggestion={suggestedNext}
                  isManual={isManual}
                />

                {/* Active / Quick Muscle Summary Cards */}
                {trainedMusclesList.length > 0 && (
                  <div style={{ marginTop: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                      Giriş Yapılan Kas Bölgeleri:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {trainedMusclesList.map((tm) => {
                        const meta = muscleMetadata[tm];
                        return (
                          <div
                            key={tm}
                            onClick={() => handleSelectMuscle(tm)}
                            className="card"
                            style={{
                              padding: '10px 12px',
                              marginBottom: 0,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              background: 'rgba(16, 185, 129, 0.08)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className={`anatomy-badge muscle-${tm}`} style={{ width: 34, height: 34 }}>
                                <AnatomyIcon muscle={tm} size={22} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 12, color: '#ffffff' }}>
                                  {meta.name}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--muscle-emerald)', fontWeight: 600 }}>
                                  {trainedMusclesMap[tm]} Set Girildi
                                </div>
                              </div>
                            </div>
                            <ChevronRight size={14} color="var(--muscle-emerald)" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recommended Muscles Summary Cards (Shows today's recommended split regions only when not in manual mode) */}
                {!isManual && suggestedNext.recommendedMuscles && suggestedNext.recommendedMuscles.length > 0 && (
                  <div style={{ marginTop: trainedMusclesList.length > 0 ? 6 : 14, marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Zap size={13} color="var(--cyan)" fill="currentColor" />
                        <span>
                          {suggestedNext.isTodayCompleted && draft.date === todayStr
                            ? 'Sıradaki Seans Odak Kasları (Yarın)'
                            : `Günün Önerilen Kasları (${suggestedNext.splitTitle.split(' ')[0]})`}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 700 }}>
                        {suggestedNext.recommendedMuscles.length} Bölge
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {suggestedNext.recommendedMuscles.map((rm) => {
                        const meta = muscleMetadata[rm];
                        if (!meta) return null;
                        const targetInfo = muscleTargetMap[rm];
                        const targetSets = targetInfo?.targetSets || 3;
                        const targetExercises = targetInfo?.targetExercises || 1;
                        const completedSets = trainedMusclesMap[rm] || 0;
                        const isGoalMet = completedSets >= targetSets;
                        const isTrained = completedSets > 0;
                        const muscleProgressPct = Math.min(100, Math.round((completedSets / targetSets) * 100));

                        return (
                          <div
                            key={rm}
                            onClick={() => handleSelectMuscle(rm)}
                            className="card"
                            style={{
                              padding: '10px 12px',
                              marginBottom: 0,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              border: isGoalMet
                                ? '1px solid rgba(16, 185, 129, 0.5)'
                                : isTrained
                                ? '1px solid rgba(56, 189, 248, 0.4)'
                                : '1px solid rgba(255, 255, 255, 0.08)',
                              background: isGoalMet
                                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 23, 42, 0.85))'
                                : isTrained
                                ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(15, 23, 42, 0.85))'
                                : 'rgba(15, 23, 42, 0.65)',
                              transition: 'all 0.2s',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                                <div
                                  className={`anatomy-badge muscle-${rm}`}
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderColor: isGoalMet ? '#10b981' : isTrained ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)',
                                    flexShrink: 0
                                  }}
                                >
                                  <AnatomyIcon muscle={rm} size={20} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 800, fontSize: 12, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {meta.name}
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 10,
                                      color: isGoalMet ? 'var(--muscle-emerald)' : isTrained ? 'var(--cyan)' : 'var(--text-muted)',
                                      fontWeight: 600,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    {isGoalMet
                                      ? `✓ ${completedSets}/${targetSets} Set`
                                      : isTrained
                                      ? `${completedSets}/${targetSets} Set`
                                      : `Hedef: ${targetSets} Set`}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight
                                size={14}
                                color={isGoalMet ? 'var(--muscle-emerald)' : isTrained ? 'var(--cyan)' : 'var(--text-dim)'}
                                style={{ flexShrink: 0, marginTop: 2 }}
                              />
                            </div>

                            {/* Mini Progress Bar at bottom of card */}
                            <div style={{ marginTop: 8 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: 9.5,
                                  color: 'var(--text-dim)',
                                  marginBottom: 3
                                }}
                              >
                                <span>{isGoalMet ? 'Hedef Bitti' : `${targetExercises} Hareket`}</span>
                                <span style={{ fontWeight: 800, color: isGoalMet ? '#34d399' : isTrained ? 'var(--cyan)' : 'var(--text-muted)' }}>
                                  %{muscleProgressPct}
                                </span>
                              </div>
                              <div
                                style={{
                                  height: 4,
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  borderRadius: 'var(--radius-full)',
                                  overflow: 'hidden'
                                }}
                              >
                                <div
                                  style={{
                                    width: `${muscleProgressPct}%`,
                                    height: '100%',
                                    background: isGoalMet
                                      ? '#10b981'
                                      : 'linear-gradient(90deg, #0284c7, #38bdf8)',
                                    borderRadius: 'var(--radius-full)',
                                    transition: 'width 0.3s ease'
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Muscle Specific Drill-Down View */
              <MuscleDetailView
                muscle={selectedMuscle}
                onBack={() => setSelectedMuscle(null)}
                onSelectOtherMuscle={(m) => setSelectedMuscle(m)}
                isManual={isManual}
              />
            )}
          </>
        )}

        {/* VIEW MODE 2: UNIFIED ALL EXERCISES LIST */}
        {viewMode === 'all' && (
          <div>
            {/* Split Selector */}
            <div className="card" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ marginBottom: 8 }}>Antrenman Bölgesi / Split</label>
              <div className="split-selector" style={{ marginBottom: 0 }}>
                {splits.map((s) => {
                  const isActive = draft.splitType === s.id;
                  const isSuggested = !isManual && suggestedNext.recommendedSplit === s.id;
                  return (
                    <button
                      type="button"
                      key={s.id}
                      className={`split-pill ${isActive ? 'active' : ''}`}
                      onClick={() => updateDraftSplit(s.id)}
                      style={{ position: 'relative' }}
                    >
                      {isSuggested && (
                        <span
                          style={{
                            position: 'absolute',
                            top: -6,
                            right: 4,
                            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                            color: '#ffffff',
                            fontSize: 8.5,
                            fontWeight: 900,
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid #0f172a',
                            boxShadow: '0 2px 6px rgba(56, 189, 248, 0.4)'
                          }}
                        >
                          ÖNERİ
                        </span>
                      )}
                      <SplitIcon split={s.id} size={30} active={isActive} />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exercise Grid */}
            <div className="exercise-cards-grid">
              {activeExercises.map((exercise) => (
                <ExerciseSquareCard 
                  key={exercise.id} 
                  exercise={exercise} 
                  onClick={() => setSelectedOverlayExercise(exercise)}
                />
              ))}
            </div>

            {/* Add Custom Exercise Trigger */}
            <button
              type="button"
              onClick={() => setIsAddCustomOpen(true)}
              className="btn btn-secondary"
              style={{ width: '100%', marginBottom: 14, padding: '12px' }}
            >
              <PlusCircle size={16} color="var(--muscle-emerald)" />
              <span>Listeye Özel Egzersiz Ekle</span>
            </button>
          </div>
        )}

        {/* Expandable Workout Cart Bar & Save Drawer */}
        <WorkoutCartDrawer
          onSaveSuccess={() => {
            setIsLoggingWorkout(false);
            setSelectedMuscle(null);
          }}
          isManual={isManual}
        />

        {/* Add Custom Exercise Modal */}
        <AddCustomExerciseModal
          isOpen={isAddCustomOpen}
          onClose={() => setIsAddCustomOpen(false)}
        />

        {/* Interactive Exercise Input Overlay */}
        <ExerciseInputOverlay
          exercise={selectedOverlayExercise}
          isOpen={Boolean(selectedOverlayExercise)}
          onClose={() => setSelectedOverlayExercise(null)}
        />
      </div>
    );
  }

  // ==========================================
  // VIEW 2: MAIN WORKOUTS & TODAY'S DASHBOARD
  // ==========================================

  return (
    <div style={{ padding: '12px 14px calc(76px + var(--safe-bottom)) 14px', animation: 'fadeIn 0.2s ease-out' }}>
      {/* Top Banner & Quick Stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
            Antrenman Günlüğü
          </h2>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
            Toplam {workouts.length} seans • {overallStats.activeStreak} gün aktif seri
          </div>
        </div>

        {/* Top Right: Unified Burger Menu */}
        <HeaderBurgerMenu />
      </div>

      {/* Smart Personal Trainer (PT) Daily Guidance Hero Card */}
      {suggestedNext?.ptGuidance && (
        <PTGuidanceCard
          guidance={suggestedNext.ptGuidance}
          suggestion={suggestedNext}
          onStartWorkout={(split, isRec) => handleStartNewWorkout(split, isRec ?? true, false)}
          onStartManualWorkout={(split) => {
            handleStartNewWorkout(split || 'custom', false, true);
            setViewMode('map');
          }}
        />
      )}


      {/* Empty State (Shown only if no workouts exist) */}
      {workouts.length === 0 && (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '32px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-dim)'
            }}
          >
            <Dumbbell size={24} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
              Henüz Kayıtlı Antrenman Yok
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              İlk antrenmanınızı başlatın veya test için örnek veri yükleyin.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 260 }}>
            <button
              onClick={() => handleStartNewWorkout('upper', false, true)}
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Plus size={16} />
              <span>İlk Antrenmanını Kaydet</span>
            </button>
            <button
              onClick={populateSampleData}
              className="btn btn-secondary"
              style={{ width: '100%', border: '1px solid rgba(251, 191, 36, 0.3)', color: 'var(--gold)' }}
            >
              <Sparkles size={16} color="var(--gold)" />
              <span>2 Yıllık Örnek Veri Yükle</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

