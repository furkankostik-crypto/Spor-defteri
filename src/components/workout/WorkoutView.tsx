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
  History as HistoryIcon
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

  const handleSelectMuscle = (muscle: MuscleGroup) => {
    setSelectedMuscle(muscle);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartNewWorkout = () => {
    sounds.playPop();
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
                {liveSessionSets > 0 && (
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
                {/* Interactive Full-Body Anatomical Map */}
                <AnatomicalBodyMap
                  onSelectMuscle={handleSelectMuscle}
                  selectedMuscle={selectedMuscle}
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
                  return (
                    <button
                      type="button"
                      key={s.id}
                      className={`split-pill ${isActive ? 'active' : ''}`}
                      onClick={() => updateDraftSplit(s.id)}
                    >
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
    <div style={{ padding: '16px', animation: 'fadeIn 0.2s ease-out' }}>
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
                onClick={handleStartNewWorkout}
                className="btn btn-primary"
                style={{ width: '100%' }}
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

      {/* Floating Action Button (+ FAB) for convenient access when scrolling */}
      <button
        type="button"
        onClick={handleStartNewWorkout}
        className="fab-btn"
        title="Yeni Antrenman Girişi"
        aria-label="Yeni Antrenman Girişi"
      >
        <Plus size={26} strokeWidth={2.5} />
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
