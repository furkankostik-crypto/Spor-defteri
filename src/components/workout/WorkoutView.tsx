import React, { useState, useMemo, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { SplitType, Workout } from '../../types/workout';
import { ActiveWorkoutLogger } from './ActiveWorkoutLogger';
import { sounds } from '../../utils/audio';
import { getSuggestedNextWorkout, getRecommendedRoutineForSplit } from '../../utils/recommendationEngine';
import { isDurationExercise, isSetValid, getSetDurationSeconds } from '../../utils/calculations';
import { calculateOverallGymLevels } from '../../utils/scientificCalculations';
import { getTodayLocalDate, formatDisplayDate } from '../../utils/dateUtils';
import { 
  Flame, 
  ChevronRight, 
  CheckCircle2,
  Play,
  ArrowRight,
  Dumbbell,
  History as HistoryIcon,
  Calendar,
  Award,
  Trophy,
  RotateCcw
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
    activeSessionStartTime,
    draft,
    startWorkoutWithRoutine,
    setActiveTab,
    showToast
  } = useWorkout();

  const todayStr = getTodayLocalDate();
  const todayWorkout = useMemo(() => workouts.find(w => w.date === todayStr), [workouts, todayStr]);
  const suggestedNext = getSuggestedNextWorkout(workouts);
  const gymLevels = useMemo(() => calculateOverallGymLevels(workouts, allExercises, profile), [workouts, allExercises, profile]);

  // Live timer for minimized active session banner
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    if (!activeSessionStartTime) return 0;
    return Math.max(0, Math.floor((Date.now() - activeSessionStartTime) / 1000));
  });

  useEffect(() => {
    if (!isLoggingWorkout || !activeSessionStartTime) return;
    const updateTimer = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - activeSessionStartTime) / 1000)));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isLoggingWorkout, activeSessionStartTime]);

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hours > 0) {
      return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const splits: { id: SplitType; label: string; shortDesc: string; color: string }[] = [
    { id: 'upper', label: 'Üst Vücut', shortDesc: 'Göğüs, Sırt, Omuz, Kol', color: '#38bdf8' },
    { id: 'lower', label: 'Alt Vücut', shortDesc: 'Ön/Arka Bacak, Kalça, Kalf', color: '#c084fc' },
    { id: 'full', label: 'Tüm Vücut', shortDesc: 'Bileşik Temel Hareketler', color: '#34d399' },
    { id: 'custom', label: 'Core & Özel', shortDesc: 'Karın, Merkez & İzole', color: '#fbbf24' }
  ];

  // Start a blank custom workout session
  const handleStartBlankWorkout = () => {
    sounds.playSuccess();
    if (isLoggingWorkout) {
      resumeActiveWorkout();
      return;
    }
    startWorkoutWithRoutine('custom', []);
  };

  // Start a specific split routine immediately
  const handleQuickStartSplit = (splitId: SplitType) => {
    sounds.playSuccess();
    const splitRoutine = getRecommendedRoutineForSplit(splitId, allExercises, workouts, profile);
    const preparedExercises = splitRoutine.map((item) => {
      const isDur = isDurationExercise(item.exercise);
      if (item.isCompletedToday && item.todaySets && item.todaySets.length > 0) {
        return {
          exerciseId: item.exercise.id,
          sets: item.todaySets.map(s => ({ weight: s.weight, reps: s.reps, completed: true }))
        };
      }
      const targetVal = item.suggestedWeight || item.lastWeight || (isDur ? 45 : 0);
      return {
        exerciseId: item.exercise.id,
        sets: [
          { weight: isDur ? 0 : targetVal, reps: isDur ? targetVal : 8, completed: false },
          { weight: isDur ? 0 : targetVal, reps: isDur ? targetVal : 8, completed: false },
          { weight: isDur ? 0 : targetVal, reps: isDur ? targetVal : 8, completed: false }
        ]
      };
    });
    startWorkoutWithRoutine(splitId, preparedExercises);
  };

  // Repeat a past workout session
  const handleRepeatPastWorkout = (pastWorkout: Workout) => {
    sounds.playSuccess();
    const inferredSplit: SplitType = pastWorkout.splitType || 'upper';
    const preparedExercises = pastWorkout.exercises.map((savedEx) => {
      const isDur = isDurationExercise(savedEx.id);
      if (savedEx.detailedSets && savedEx.detailedSets.length > 0) {
        return {
          exerciseId: savedEx.id,
          sets: savedEx.detailedSets.map(s => ({
            weight: isDur ? 0 : s.weight,
            reps: isDur ? getSetDurationSeconds(s, true) : (s.reps || 8),
            completed: false
          }))
        };
      }
      const fallbackSets = (savedEx.sets || [0, 0, 0]).map(w => ({
        weight: isDur ? 0 : w,
        reps: isDur ? (w > 0 ? w : 45) : 8,
        completed: false
      }));
      return {
        exerciseId: savedEx.id,
        sets: fallbackSets.length > 0 ? fallbackSets : [
          { weight: 0, reps: isDur ? 45 : 8, completed: false },
          { weight: 0, reps: isDur ? 45 : 8, completed: false },
          { weight: 0, reps: isDur ? 45 : 8, completed: false }
        ]
      };
    });
    startWorkoutWithRoutine(inferredSplit, preparedExercises);
    showToast({
      title: '🔄 Antrenman Yüklendi',
      description: `${pastWorkout.type} (${pastWorkout.exercises.length} hareket) yeni seansa aktarıldı.`,
      type: 'success'
    });
  };

  // Helper to compute sets & volume of a Workout for recent history summary
  const getWorkoutMetrics = (w: Workout) => {
    let sets = 0;
    let vol = 0;
    w.exercises.forEach(ex => {
      const isDur = isDurationExercise(ex.id);
      if (ex.detailedSets && ex.detailedSets.length > 0) {
        ex.detailedSets.forEach(s => {
          if (isSetValid(s, isDur)) {
            sets++;
            if (!isDur) vol += s.weight * (s.reps || 5);
          }
        });
      } else if (ex.sets) {
        ex.sets.forEach(wgt => {
          if (wgt > 0) {
            sets++;
            if (!isDur) vol += wgt * 5;
          }
        });
      }
    });
    return { sets, vol };
  };

  const recentWorkouts = useMemo(() => workouts.slice(0, 2), [workouts]);

  const activeDraftExercisesCount = Object.keys(draft.exerciseSets).length;
  const activeDraftCompletedSetsCount = Object.entries(draft.exerciseSets).reduce((sum, [exId, sets]) => {
    const isDur = isDurationExercise(exId);
    return sum + sets.filter(s => s.completed && isSetValid(s, isDur)).length;
  }, 0);

  // If in an active workout logging session and not minimized, render the full logger
  if (isLoggingWorkout && !isWorkoutMinimized) {
    return <ActiveWorkoutLogger onBackToHub={() => setIsWorkoutMinimized(true)} />;
  }

  return (
    <div style={{ padding: '16px 16px calc(92px + var(--safe-bottom)) 16px', animation: 'fadeIn 0.2s ease-out' }}>
      {/* ========================================================= */}
      {/* 1. HEADER: APP TITLE, DATE & BURGER MENU                  */}
      {/* ========================================================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
            Spor Defterim
          </h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Calendar size={12} color="var(--accent)" />
            <span>{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</span>
          </div>
        </div>

        <HeaderBurgerMenu />
      </div>

      {/* ========================================================= */}
      {/* 2. PROGRESS & STATUS SUMMARY STRIP (GELİŞİM ÖZETİ)        */}
      {/* ========================================================= */}
      <div
        onClick={() => {
          sounds.playPop();
          setActiveTab('stats');
        }}
        style={{
          background: 'linear-gradient(135deg, rgba(24, 34, 52, 0.92), rgba(15, 23, 42, 0.96))',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 14px',
          marginBottom: 14,
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)'
        }}
      >
        {/* Top Row: Rank / Level + Progress Bar + Detail Link */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 'var(--radius-md)',
                background: overallStats.rankGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 900,
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
            >
              {gymLevels.overallTierBadge || '🏆'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#ffffff' }}>
                  {overallStats.rankTitle}
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: 'var(--cyan)',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  Lv {overallStats.overallLevel}
                </span>
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>
                {gymLevels.strongestLift
                  ? `En Güçlü: ${gymLevels.strongestLift.exerciseName} (${gymLevels.strongestLift.estimated1RM} kg)`
                  : 'Gelişim ve seviye detayları için dokun'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: 'var(--cyan)', flexShrink: 0 }}>
            <span>Gelişim</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* 3 Compact Stat Pills: Seri | Toplam Antrenman | Toplam Hacim */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            paddingTop: 10,
            borderTop: '1px solid rgba(255, 255, 255, 0.07)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Flame size={15} color="#fbbf24" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
                {overallStats.activeStreak} Gün
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                Aktif Seri
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={15} color="#10b981" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
                {overallStats.totalWorkouts} Seans
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                Toplam İdman
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trophy size={15} color="#38bdf8" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
                {overallStats.totalVolumeKg >= 1000
                  ? `${(overallStats.totalVolumeKg / 1000).toFixed(1)} Ton`
                  : `${overallStats.totalVolumeKg} kg`}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                Toplam Hacim
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. WORKOUT LAUNCHPAD (YENİ ANTRENMAN BAŞLATMA ALANI)       */}
      {/* ========================================================= */}
      {isLoggingWorkout ? (
        /* Active Session Resume Card */
        <div
          onClick={resumeActiveWorkout}
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1.5px solid rgba(16, 185, 129, 0.5)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.18)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0
              }}
            >
              <Dumbbell size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14.5, fontWeight: 900, color: '#ffffff' }}>
                  Antrenman Devam Ediyor
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#34d399',
                    background: 'rgba(16, 185, 129, 0.18)',
                    padding: '1px 7px',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  {formatTimer(elapsedSeconds)}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {activeDraftExercisesCount} Hareket • {activeDraftCompletedSetsCount} Set Tamamlandı
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              resumeActiveWorkout();
            }}
            style={{
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '9px 14px',
              fontSize: 12.5,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <span>Devam Et</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        /* Start New Workout Card */
        <div
          className="card"
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 16,
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.92) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Yeni Antrenman Başlat
            </div>
            {todayWorkout && (
              <span
                onClick={() => setActiveTab('history')}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#34d399',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer'
                }}
              >
                <CheckCircle2 size={13} />
                <span>Bugün {todayWorkout.exercises.length} hareket yapıldı</span>
              </span>
            )}
          </div>

          {/* Primary CTA: Start Blank / Custom Workout */}
          <button
            type="button"
            onClick={handleStartBlankWorkout}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '13px 16px',
              fontSize: 14,
              fontWeight: 900,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent) 0%, #e11d48 100%)',
              boxShadow: '0 6px 20px rgba(255, 71, 87, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Play size={17} fill="currentColor" />
              <div style={{ textAlign: 'left' }}>
                <div>Serbest Antrenman Başlat</div>
                <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.88 }}>
                  Kendi hareketlerini seçerek boş seans aç
                </div>
              </div>
            </div>
            <ArrowRight size={17} />
          </button>

          {/* Quick Split Routine Starter Chips (Üst / Alt / Tüm Vücut / Core) */}
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
            veya hazır programla başla:
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 6
            }}
          >
            {splits.map((s) => {
              const isRecommended = suggestedNext.recommendedSplit === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleQuickStartSplit(s.id)}
                  style={{
                    position: 'relative',
                    padding: '8px 4px',
                    borderRadius: 'var(--radius-sm)',
                    background: isRecommended ? `${s.color}15` : 'rgba(15, 23, 42, 0.85)',
                    border: isRecommended ? `1.5px solid ${s.color}` : `1px solid ${s.color}35`,
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 800, color: s.color, whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Program →
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. RECENT WORKOUTS SUMMARY (SON ANTRENMANLAR ÖZETİ)       */}
      {/* ========================================================= */}
      {recentWorkouts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <HistoryIcon size={13} color="var(--cyan)" />
              <span>Son Antrenmanlar</span>
            </div>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setActiveTab('history');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--cyan)',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                padding: 0
              }}
            >
              <span>Tüm Geçmiş ({workouts.length})</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentWorkouts.map((w) => {
              const { sets, vol } = getWorkoutMetrics(w);
              const exerciseNames = w.exercises.slice(0, 3).map(e => e.name).join(', ');
              const extraCount = w.exercises.length > 3 ? ` +${w.exercises.length - 3}` : '';

              return (
                <div
                  key={w.id}
                  onClick={() => {
                    sounds.playPop();
                    setActiveTab('history');
                  }}
                  style={{
                    background: 'rgba(15, 23, 42, 0.78)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>
                        {w.type}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>
                        • {formatDisplayDate(w.date)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginTop: 2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {exerciseNames}{extraCount}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 10.5, fontWeight: 700 }}>
                      <span style={{ color: '#34d399' }}>{w.exercises.length} Hareket ({sets} Set)</span>
                      {vol > 0 && (
                        <>
                          <span style={{ color: 'var(--border)' }}>•</span>
                          <span style={{ color: '#fbbf24' }}>{vol.toLocaleString('tr-TR')} kg</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRepeatPastWorkout(w);
                    }}
                    title="Bu antrenmanı tekrar başlat"
                    style={{
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: 'var(--cyan)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 10px',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      flexShrink: 0
                    }}
                  >
                    <RotateCcw size={12} />
                    <span>Tekrarla</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
