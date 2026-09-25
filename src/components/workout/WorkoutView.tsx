import React, { useState, useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { SplitType } from '../../types/workout';
import { ActiveWorkoutLogger } from './ActiveWorkoutLogger';
import { AnatomyIcon } from '../../data/anatomyIcons';
import { muscleMetadata } from '../../data/muscleMetadata';
import { sounds } from '../../utils/audio';
import { getSuggestedNextWorkout, getRecommendedRoutineForSplit } from '../../utils/recommendationEngine';
import { getTodayLocalDate } from '../../utils/dateUtils';
import { 
  Flame, 
  ChevronRight, 
  History as HistoryIcon,
  Zap,
  CheckCircle2,
  Check,
  Play,
  ArrowRight,
  Bot,
  Dumbbell,
  PlusCircle
} from 'lucide-react';
import { HeaderBurgerMenu } from '../layout/HeaderBurgerMenu';

export const WorkoutView: React.FC = () => {
  const { 
    allExercises, 
    workouts, 
    overallStats,
    profile,
    isLoggingWorkout,
    isWorkoutMinimized,
    setIsWorkoutMinimized,
    resumeActiveWorkout,
    draft,
    startWorkoutWithRoutine,
    setActiveTab,
    setIsAICoachOpen
  } = useWorkout();

  const todayStr = getTodayLocalDate();
  const todayWorkout = useMemo(() => workouts.find(w => w.date === todayStr), [workouts, todayStr]);
  const suggestedNext = getSuggestedNextWorkout(workouts);

  // Selected split for recommended routine
  const [selectedSplit, setSelectedSplit] = useState<SplitType>(() => {
    if (isLoggingWorkout && draft.splitType) return draft.splitType;
    if (todayWorkout?.splitType) return todayWorkout.splitType;
    return suggestedNext.recommendedSplit || 'upper';
  });

  const recommendedRoutine = useMemo(() => {
    return getRecommendedRoutineForSplit(selectedSplit, allExercises, workouts, profile);
  }, [selectedSplit, allExercises, workouts, profile]);

  // Combine routine items with active draft sets or today's completed logs
  const routineWithStatus = useMemo(() => {
    return recommendedRoutine.map((item) => {
      // Check if this exercise has progress in the active draft session
      const draftSets = isLoggingWorkout ? draft.exerciseSets[item.exercise.id] : undefined;
      const completedDraftSets = draftSets ? draftSets.filter(s => s.completed && s.weight > 0) : [];
      const isDoneInDraft = Boolean(draftSets && draftSets.length > 0 && completedDraftSets.length === draftSets.length);
      const isPartialInDraft = Boolean(completedDraftSets.length > 0 && !isDoneInDraft);
      const draftMaxWeight = completedDraftSets.length > 0 ? Math.max(...completedDraftSets.map(s => s.weight)) : undefined;

      // Completed if in saved workout today OR completely finished in current active draft
      const isCompleted = Boolean(item.isCompletedToday || isDoneInDraft);
      const completedSetsCount = isDoneInDraft ? completedDraftSets.length : (item.todaySetsCount || 0);
      const completedMaxWeight = isDoneInDraft ? draftMaxWeight : item.todayMaxWeight;

      return {
        ...item,
        isCompleted,
        isPartialInDraft,
        completedDraftSetsCount: completedDraftSets.length,
        totalDraftSetsCount: draftSets?.length || 3,
        completedSetsCount,
        completedMaxWeight
      };
    });
  }, [recommendedRoutine, isLoggingWorkout, draft.exerciseSets]);

  const completedExercisesCount = routineWithStatus.filter(r => r.isCompleted).length;
  const remainingExercises = routineWithStatus.filter(r => !r.isCompleted);
  const remainingExercisesCount = remainingExercises.length;
  const totalRoutineExercises = routineWithStatus.length;
  const isAllRoutineCompleted = totalRoutineExercises > 0 && remainingExercisesCount === 0;

  const splits: { id: SplitType; label: string }[] = [
    { id: 'upper', label: 'Üst Vücut' },
    { id: 'lower', label: 'Alt Vücut' },
    { id: 'full', label: 'Tüm Vücut' },
    { id: 'custom', label: 'Core / Özel' }
  ];

  // Smart handler to start or resume recommended workout
  const handleStartOrResumeRecommendedWorkout = () => {
    // 1. If this exact routine is already in progress (minimized), smoothly resume without restarting!
    if (isLoggingWorkout && draft.splitType === selectedSplit) {
      resumeActiveWorkout();
      return;
    }

    // 2. If another workout is active in background, warn user before overwriting
    if (isLoggingWorkout && draft.splitType !== selectedSplit) {
      if (!window.confirm('Farklı bir bölgede devam eden bir antrenmanınız var. Mevcut seansı iptal edip yeni antrenman başlatmak istiyor musunuz?')) {
        return;
      }
    }

    sounds.playSuccess();

    // 3. Prepare exercises:
    // If an exercise was already completed today in today's saved workout,
    // load its completed sets with completed: true so they are displayed as done!
    // Remaining uncompleted exercises are loaded with target weights ready to perform.
    const preparedExercises = recommendedRoutine.map((item) => {
      if (item.isCompletedToday && item.todaySets && item.todaySets.length > 0) {
        return {
          exerciseId: item.exercise.id,
          sets: item.todaySets.map(s => ({ weight: s.weight, reps: s.reps, completed: true }))
        };
      }

      const targetWeight = item.suggestedWeight || item.lastWeight || 0;
      return {
        exerciseId: item.exercise.id,
        sets: [
          { weight: targetWeight, reps: 8, completed: false },
          { weight: targetWeight, reps: 8, completed: false },
          { weight: targetWeight, reps: 8, completed: false }
        ]
      };
    });

    startWorkoutWithRoutine(selectedSplit, preparedExercises);
  };

  const handleStartBlankWorkout = () => {
    if (isLoggingWorkout && Object.keys(draft.exerciseSets).length > 0) {
      if (!window.confirm('Devam eden bir antrenmanınız var. Yeni boş antrenman başlatırsanız mevcut aktif oturum sıfırlanacaktır. Devam etmek istiyor musunuz?')) {
        return;
      }
    }
    sounds.playPop();
    startWorkoutWithRoutine(selectedSplit, []);
  };

  // If in an active workout logging session and not minimized, render the intuitive step-by-step logger
  if (isLoggingWorkout && !isWorkoutMinimized) {
    return <ActiveWorkoutLogger onBackToHub={() => setIsWorkoutMinimized(true)} />;
  }

  // ==========================================
  // VIEW: SEZGİSEL VE PROFESYONEL ANTRENMAN MERKEZİ (WORKOUT HUB)
  // ==========================================
  return (
    <div style={{ padding: '16px 16px calc(92px + var(--safe-bottom)) 16px', animation: 'fadeIn 0.2s ease-out' }}>
      {/* 1. TOP HEADER & QUICK STATS */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <span style={{ fontSize: 19 }}>🏋️</span>
            <h2 style={{ fontSize: 21, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
              Bugünün Antrenmanı
            </h2>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</span>
            <span style={{ color: 'var(--border)' }}>•</span>
            <span style={{ color: '#fbbf24', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Flame size={12} fill="currentColor" />
              {overallStats.activeStreak} Gün Seri
            </span>
          </div>
        </div>

        {/* Top Right: AI Coach button & Burger Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setIsAICoachOpen(true);
            }}
            className="btn btn-secondary"
            style={{
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 'var(--radius-full)',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: 'var(--cyan)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}
            title="AI Antrenör Danışmanı"
          >
            <Bot size={14} />
            <span>AI Koç</span>
          </button>
          <HeaderBurgerMenu />
        </div>
      </div>

      {/* ONGOING WORKOUT RESUME BANNER (WHEN MINIMIZED) */}
      {isLoggingWorkout && isWorkoutMinimized && (
        <div
          onClick={resumeActiveWorkout}
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1.5px solid rgba(16, 185, 129, 0.55)',
            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.2)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <Dumbbell size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#ffffff' }}>
                Devam Eden Bir Antrenmanınız Var!
              </div>
              <div style={{ fontSize: 12, color: '#a7f3d0' }}>
                {completedExercisesCount} / {totalRoutineExercises} hareket tamamlandı • Dokunarak devam edin
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              resumeActiveWorkout();
            }}
            className="btn btn-primary"
            style={{
              padding: '8px 14px',
              fontSize: 12.5,
              fontWeight: 800,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span>Devam Et</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 2. DAILY PT STATUS & CONTEXT CARD */}
      {suggestedNext.isTodayCompleted ? (
        /* TODAY WORKOUT COMPLETED / IN-PROGRESS STATUS CARD */
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.85) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.1)',
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircle2 size={16} color="#10b981" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#ffffff' }}>
                {isAllRoutineCompleted
                  ? 'Bugünkü Program Başarıyla Tamamlandı! 🎉'
                  : `Bugün ${todayWorkout?.exercises.length || 0} Hareket Tamamlandı 🔥`}
              </div>
              <div style={{ fontSize: 11.5, color: '#a7f3d0' }}>
                {isAllRoutineCompleted 
                  ? 'Harika iş çıkardın! Kasların dinlenme ve toparlanma moduna geçti.'
                  : `Kalan ${remainingExercisesCount} hareketi şimdi tamamlayabilir veya dinlenebilirsiniz.`}
              </div>
            </div>
          </div>

          {suggestedNext.ptGuidance?.todayWorkoutSummary && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 6,
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                marginTop: 10,
                marginBottom: 10,
                textAlign: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 700 }}>BÖLGE</div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#ffffff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {suggestedNext.ptGuidance.todayWorkoutSummary.splitName}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 700 }}>TOPLAM SET</div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#ffffff' }}>
                  {suggestedNext.ptGuidance.todayWorkoutSummary.totalSets} Set
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 700 }}>HACİM</div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#fbbf24' }}>
                  {suggestedNext.ptGuidance.todayWorkoutSummary.totalVolumeKg.toLocaleString('tr-TR')} kg
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <span>Sıradaki Hedef: <strong style={{ color: '#ffffff' }}>{suggestedNext.ptGuidance?.nextSessionTarget || 'Alt Vücut'}</strong></span>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3
              }}
            >
              <span>Geçmişte Gör</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      ) : (
        /* WORKOUT READY / COACH RECOMMENDATION CARD */
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(15, 23, 42, 0.85) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.28)',
            boxShadow: '0 8px 32px rgba(56, 189, 248, 0.08)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 16
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 9px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                fontSize: 11,
                fontWeight: 800,
                color: '#7dd3fc',
                letterSpacing: '0.02em'
              }}
            >
              <Zap size={13} fill="currentColor" />
              <span>GÜNÜN KOÇ ÖNERİSİ: {suggestedNext.splitTitle.toUpperCase()}</span>
            </div>

            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
              Kişisel PT
            </span>
          </div>

          <p
            style={{
              fontSize: 12.5,
              color: 'var(--text-secondary)',
              margin: '0',
              lineHeight: 1.45
            }}
          >
            {suggestedNext.reason}
          </p>
        </div>
      )}

      {/* SPLIT SELECTOR BAR (Always visible and accessible) */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span>Antrenman Bölgesini Seç / Değiştir:</span>
          {completedExercisesCount > 0 && (
            <span style={{ color: '#10b981', fontWeight: 800 }}>
              ✓ {completedExercisesCount} / {totalRoutineExercises} Hareket Tamamlandı
            </span>
          )}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 5,
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {splits.map((s) => {
            const isActive = selectedSplit === s.id;
            const isSuggested = suggestedNext.recommendedSplit === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setSelectedSplit(s.id);
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
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  boxShadow: isActive ? '0 2px 8px rgba(255, 71, 87, 0.35)' : 'none'
                }}
              >
                <span>{s.label}</span>
                {isSuggested && (
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 900,
                      color: isActive ? '#ffe4e6' : 'var(--cyan)',
                      letterSpacing: '0.04em'
                    }}
                  >
                    ● ÖNERİ
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. RECOMMENDED EXERCISE ROUTINE LIST */}
      <div
        className="card"
        style={{
          padding: '16px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 16,
          border: '1px solid rgba(255, 255, 255, 0.09)',
          background: 'rgba(15, 23, 42, 0.75)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Dumbbell size={16} color="var(--accent)" />
              <span>Program Listesi</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
              {splits.find(s => s.id === selectedSplit)?.label} için optimize edilmiş hipertrofi akışı
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {completedExercisesCount > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(16, 185, 129, 0.18)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.35)'
                }}
              >
                ✓ {completedExercisesCount} Bitti
              </span>
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {totalRoutineExercises} Hareket
            </span>
          </div>
        </div>

        {/* Exercise Items List with intelligent completion badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {routineWithStatus.map((item, index) => {
            const meta = muscleMetadata[item.exercise.muscle];
            const isDone = item.isCompleted;
            const isPartial = item.isPartialInDraft;

            return (
              <div
                key={item.exercise.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: isDone 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.7) 100%)' 
                    : isPartial
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 23, 42, 0.7) 100%)'
                    : 'rgba(30, 41, 59, 0.4)',
                  border: isDone 
                    ? '1.5px solid rgba(16, 185, 129, 0.45)' 
                    : isPartial
                    ? '1.5px solid rgba(245, 158, 11, 0.45)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  gap: 10,
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Left: Index / Check icon + Muscle badge + Exercise Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: isDone 
                        ? '#10b981' 
                        : isPartial
                        ? '#f59e0b'
                        : 'rgba(255, 255, 255, 0.08)',
                      color: isDone || isPartial ? '#ffffff' : 'var(--text-muted)',
                      fontSize: 11,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {isDone ? <Check size={14} strokeWidth={3} /> : index + 1}
                  </div>

                  <div
                    className={`anatomy-badge muscle-${item.exercise.muscle}`}
                    style={{ width: 32, height: 32, flexShrink: 0 }}
                  >
                    <AnatomyIcon muscle={item.exercise.muscle} size={18} />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 13,
                        color: isDone ? '#a7f3d0' : '#ffffff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.exercise.name}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span>{meta?.name || item.exercise.muscle}</span>
                      <span>•</span>
                      <span style={{ color: isDone ? '#34d399' : 'var(--cyan)', fontWeight: 600 }}>
                        {isDone ? `${item.completedSetsCount} Set Tamam` : item.targetReps}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Completed Status Badge OR Target Weight */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {isDone ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end'
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: '#34d399',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          padding: '2px 7px',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        ✓ Bugün Yapıldı
                      </span>
                      {item.completedMaxWeight ? (
                        <div style={{ fontSize: 9.5, color: '#a7f3d0', marginTop: 2 }}>
                          {item.completedMaxWeight} kg
                        </div>
                      ) : null}
                    </div>
                  ) : isPartial ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: '#fde68a',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      {item.completedDraftSetsCount}/{item.totalDraftSetsCount} Set
                    </span>
                  ) : item.lastWeight ? (
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: item.isOverload ? '#10b981' : '#ffffff'
                        }}
                      >
                        {item.suggestedWeight ? `${item.suggestedWeight} kg` : `${item.lastWeight} kg`}
                      </div>
                      <div style={{ fontSize: 9.5, color: 'var(--text-dim)' }}>
                        Son: {item.lastWeight} kg
                      </div>
                    </div>
                  ) : (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'var(--text-dim)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        padding: '3px 7px',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      Form Oturtma
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. WORKOUT ACTIONS (3 EQUAL BUTTONS IN ONE ROW) */}
      <div className="workout-actions-grid">
        <button
          type="button"
          onClick={handleStartOrResumeRecommendedWorkout}
          className="btn btn-primary workout-action-btn"
          style={{
            background: isLoggingWorkout
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : (completedExercisesCount > 0 && remainingExercisesCount > 0)
              ? 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)'
              : isAllRoutineCompleted
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #ff4757 0%, #e84118 100%)',
            boxShadow: isLoggingWorkout || isAllRoutineCompleted
              ? '0 4px 14px rgba(16, 185, 129, 0.35)'
              : (completedExercisesCount > 0 && remainingExercisesCount > 0)
              ? '0 4px 14px rgba(14, 165, 233, 0.35)'
              : '0 4px 14px rgba(255, 71, 87, 0.35)',
            border: '1px solid transparent',
            color: '#ffffff'
          }}
        >
          {isLoggingWorkout ? (
            <>
              <ArrowRight size={15} style={{ flexShrink: 0 }} />
              <span>Devam Et</span>
            </>
          ) : completedExercisesCount > 0 && remainingExercisesCount > 0 ? (
            <>
              <Play size={15} fill="currentColor" style={{ flexShrink: 0 }} />
              <span>Kalanı Başlat</span>
            </>
          ) : isAllRoutineCompleted ? (
            <>
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>Tamamlandı</span>
            </>
          ) : (
            <>
              <Play size={15} fill="currentColor" style={{ flexShrink: 0 }} />
              <span>Antrenmanı Başlat</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleStartBlankWorkout}
          className="btn btn-secondary workout-action-btn"
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <PlusCircle size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <span>Boş Antrenman</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setActiveTab('history');
          }}
          className="btn btn-secondary workout-action-btn"
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <HistoryIcon size={15} color="var(--accent)" style={{ flexShrink: 0 }} />
          <span>Geçmiş İdmanlar</span>
        </button>
      </div>
    </div>
  );
};
