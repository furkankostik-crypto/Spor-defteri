import React, { useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { SplitType, MuscleGroup, Workout, ExerciseDefinition } from '../../types/workout';
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
import { HistoryCard } from '../history/HistoryCard';
import { EditWorkoutModal } from '../history/EditWorkoutModal';
import { getSuggestedNextWorkout } from '../../utils/recommendationEngine';
import { PTGuidanceCard } from './PTGuidanceCard';
import { WorkoutSessionProgressCard } from './WorkoutSessionProgressCard';
import { calculateWorkoutSessionTarget, MuscleTargetProgress } from '../../utils/workoutTargets';
import { 
  Calendar, 
  PlusCircle, 
  Flame, 
  Map, 
  ListFilter, 
  Sparkles, 
  ChevronRight, 
  Plus, 
  ArrowLeft, 
  History as HistoryIcon,
  Zap,
  Check,
  CheckCircle2,
  Info
} from 'lucide-react';
import { HeaderBurgerMenu } from '../layout/HeaderBurgerMenu';
import { TimeFilterSelector, TimeFilterState } from './TimeFilterSelector';
import { getTodayLocalDate, getWeekBounds } from '../../utils/dateUtils';

export const WorkoutView: React.FC = () => {
  const { 
    draft, 
    updateDraftDate, 
    updateDraftSplit, 
    allExercises, 
    workouts, 
    overallStats,
    populateSampleData,
    isLoggingWorkout,
    setIsLoggingWorkout
  } = useWorkout();

  const suggestedNext = getSuggestedNextWorkout(workouts);

  // Navigation state within workout entry
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [selectedOverlayExercise, setSelectedOverlayExercise] = useState<ExerciseDefinition | null>(null);

  const [viewMode, setViewMode] = useState<'map' | 'all'>('map');
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);

  // History list time & split filter state
  const todayStr = getTodayLocalDate();
  const todayWeek = getWeekBounds(todayStr);
  const now = new Date();

  const [timeFilter, setTimeFilter] = useState<TimeFilterState>({
    mode: 'all',
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    selectedDate: todayStr,
    weekStart: todayWeek.start,
    weekEnd: todayWeek.end
  });

  const [splitFilter, setSplitFilter] = useState<string>('all');
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(30);

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

  // Calculate session live estimated stats & trained muscles breakdown
  let liveSessionSets = 0;
  let liveSessionVolume = 0;
  const trainedMusclesMap: Record<MuscleGroup, number> = {} as any;

  Object.entries(draft.exerciseSets).forEach(([exId, sets]) => {
    const ex = allExercises.find(e => e.id === exId);
    sets.forEach((s) => {
      if (s.weight > 0) {
        liveSessionSets++;
        liveSessionVolume += s.weight * (s.reps || 5);
        if (ex) {
          trainedMusclesMap[ex.muscle] = (trainedMusclesMap[ex.muscle] || 0) + 1;
        }
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
      suggestedNext.recommendedMuscles || []
    );
  }, [draft.splitType, draft.exerciseSets, allExercises, suggestedNext.recommendedMuscles]);

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

  const handleStartNewWorkout = (preferredSplit?: SplitType) => {
    sounds.playPop();
    if (Object.keys(draft.exerciseSets).length === 0) {
      const splitToSet = preferredSplit || (suggestedNext.isTodayCompleted ? 'custom' : suggestedNext?.recommendedSplit) || 'upper';
      updateDraftSplit(splitToSet);
    }
    setIsLoggingWorkout(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToFeed = () => {
    sounds.playPop();
    setIsLoggingWorkout(false);
    setSelectedMuscle(null);
  };

  // Filter workouts for history list according to TimeFilter and SplitFilter
  const filteredWorkouts = workouts.filter((w) => {
    const matchesSplit = splitFilter === 'all' || w.type.toLowerCase().includes(splitFilter.toLowerCase());
    
    let matchesTime = true;
    if (timeFilter.mode === 'year') {
      matchesTime = w.date.startsWith(`${timeFilter.year}-`);
    } else if (timeFilter.mode === 'month') {
      const monthPad = String(timeFilter.month).padStart(2, '0');
      matchesTime = w.date.startsWith(`${timeFilter.year}-${monthPad}`);
    } else if (timeFilter.mode === 'week') {
      matchesTime = w.date >= timeFilter.weekStart && w.date <= timeFilter.weekEnd;
    } else if (timeFilter.mode === 'day') {
      matchesTime = w.date === timeFilter.selectedDate;
    }

    return matchesSplit && matchesTime;
  });

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

        {/* Live Session Progress & Target Metrics Dashboard */}
        <WorkoutSessionProgressCard sessionTarget={sessionTarget} />

        {/* View Mode Switcher (Full Width Standalone) */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            background: 'rgba(15, 23, 42, 0.85)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            marginBottom: 14,
            gap: 4
          }}
        >
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
              gap: 8,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: viewMode === 'map' ? 'var(--accent)' : 'transparent',
              color: viewMode === 'map' ? '#ffffff' : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: viewMode === 'map' ? '0 2px 10px rgba(239, 68, 68, 0.35)' : 'none'
            }}
          >
            <Map size={15} />
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
              gap: 8,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: viewMode === 'all' ? 'var(--accent)' : 'transparent',
              color: viewMode === 'all' ? '#ffffff' : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: viewMode === 'all' ? '0 2px 10px rgba(239, 68, 68, 0.35)' : 'none'
            }}
          >
            <ListFilter size={15} />
            <span>Tüm Liste</span>
          </button>
        </div>

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

                {/* Recommended Muscles Summary Cards (Shows today's recommended split regions) */}
                {suggestedNext.recommendedMuscles && suggestedNext.recommendedMuscles.length > 0 && (
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
                  const isSuggested = suggestedNext.recommendedSplit === s.id;
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
  // VIEW 2: MAIN WORKOUTS FEED & HISTORY
  // ==========================================
  return (
    <div style={{ padding: '16px 16px calc(92px + var(--safe-bottom)) 16px', animation: 'fadeIn 0.2s ease-out' }}>
      {/* Top Banner & Quick Stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14
        }}
      >
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Antrenman Günlüğü
          </h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Toplam {workouts.length} kayıtlı seans • {overallStats.activeStreak} gün aktif seri
          </div>
        </div>

        {/* Top Right: Unified Burger Menu */}
        <HeaderBurgerMenu />
      </div>

      {/* Smart Personal Trainer (PT) Daily Guidance Hero Card */}
      {suggestedNext?.ptGuidance && (
        <PTGuidanceCard
          guidance={suggestedNext.ptGuidance}
          onStartWorkout={handleStartNewWorkout}
        />
      )}

      {/* Time & Split Filters */}
      <div style={{ marginBottom: 16 }}>
        <TimeFilterSelector
          filter={timeFilter}
          onChange={setTimeFilter}
          workouts={workouts}
          matchingCount={filteredWorkouts.length}
        />

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {[
            { id: 'all', label: 'Tüm Bölgeler' },
            { id: 'üst', label: 'Üst Vücut' },
            { id: 'alt', label: 'Alt Vücut' },
            { id: 'tüm', label: 'Tüm Vücut' }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => {
                sounds.playPop();
                setSplitFilter(pill.id);
              }}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                border: splitFilter === pill.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: splitFilter === pill.id ? 'var(--accent-soft)' : 'var(--input-bg)',
                color: splitFilter === pill.id ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Workout History List */}
      <div>
        {filteredWorkouts.length > 0 ? (
          <>
            {(timeFilter.mode !== 'all' || splitFilter !== 'all' ? filteredWorkouts : filteredWorkouts.slice(0, visibleLimit)).map((w) => (
              <HistoryCard
                key={w.id}
                workout={w}
                onEdit={(target) => setEditingWorkout(target)}
              />
            ))}

            {timeFilter.mode === 'all' && splitFilter === 'all' && visibleLimit < filteredWorkouts.length && (
              <button
                type="button"
                onClick={() => setVisibleLimit(prev => prev + 30)}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  marginTop: 6,
                  marginBottom: 16,
                  padding: '12px',
                  fontWeight: 700,
                  fontSize: 13
                }}
              >
                <span>Daha Fazla Göster (+30 / Kalan {filteredWorkouts.length - visibleLimit})</span>
              </button>
            )}
          </>
        ) : (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-dim)'
              }}
            >
              <HistoryIcon size={26} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>
                Henüz Antrenman Kaydı Yok
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                Tamamladığınız antrenmanları kaydettiğinizde tüm detaylar burada listelenecek.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 280, marginTop: 6 }}>
              <button
                onClick={() => handleStartNewWorkout()}
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Plus size={16} />
                <span>İlk Antrenmanını Kaydet</span>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  <Zap size={10} fill="currentColor" />
                  1 Öneri
                </span>
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

      {/* Floating Action Button (+ FAB) for convenient access when scrolling */}
      <button
        type="button"
        onClick={() => handleStartNewWorkout()}
        className="fab-btn"
        title={
          suggestedNext.isTodayCompleted
            ? 'Bugünkü Antrenman Tamamlandı (Yeni / Ek Seans Girişi)'
            : `Yeni Antrenman Girişi (Öneri: ${suggestedNext.splitTitle})`
        }
        aria-label={
          suggestedNext.isTodayCompleted
            ? 'Bugünkü Antrenman Tamamlandı - Yeni Seans Girişi'
            : `Yeni Antrenman Girişi - 1 Öneri: ${suggestedNext.splitTitle}`
        }
      >
        <Plus size={22} strokeWidth={2.5} />
        
        {/* Smart Recommendation Notification Badge: ONLY when NOT completed today and workout is ready */}
        {!suggestedNext.isTodayCompleted && suggestedNext.ptGuidance?.state === 'workout_ready' && (
          <div className="fab-badge-container">
            <span className="fab-badge-ping" />
            <span className="fab-notification-badge">
              <Zap size={8.5} fill="currentColor" />
              <span>1</span>
            </span>
          </div>
        )}

        {/* Completed State Badge */}
        {suggestedNext.isTodayCompleted && (
          <div
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              background: '#10b981',
              color: '#ffffff',
              borderRadius: '50%',
              width: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #0f172a',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)'
            }}
            title="Bugün Tamamlandı ✓"
          >
            <Check size={11} strokeWidth={3.5} />
          </div>
        )}

        {/* Floating Tooltip on Hover */}
        <div className="fab-tooltip">
          {suggestedNext.isTodayCompleted ? (
            <>
              <CheckCircle2 size={11} color="#10b981" />
              <span>Bugün Tamamlandı (Toparlanma Modu)</span>
            </>
          ) : (
            <>
              <Zap size={11} color="var(--cyan)" fill="currentColor" />
              <span>Öneri: {suggestedNext.splitTitle}</span>
            </>
          )}
        </div>
      </button>

      {/* Edit Workout Modal */}
      <EditWorkoutModal
        workout={editingWorkout}
        isOpen={Boolean(editingWorkout)}
        onClose={() => setEditingWorkout(null)}
      />
    </div>
  );
};
