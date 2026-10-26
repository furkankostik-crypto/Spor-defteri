import React, { useState, useMemo, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { SplitType, Workout, MuscleGroup } from '../../types/workout';
import { ActiveWorkoutLogger } from './ActiveWorkoutLogger';
import { BodyReadinessMap } from './BodyReadinessMap';
import { WorkoutDetailModal } from '../history/WorkoutDetailModal';
import { EditWorkoutModal } from '../history/EditWorkoutModal';
import { sounds } from '../../utils/audio';
import { getSuggestedNextWorkout, getRecommendedRoutineForSplit } from '../../utils/recommendationEngine';
import {
  isDurationExercise,
  isSetValid,
  getSetDurationSeconds,
  calculateMuscleLevels
} from '../../utils/calculations';
import {
  calculateOverallGymLevels,
  getExerciseStrengthAnalysis,
  calculate1RM,
  calculateWeeklyVolumeLandmarks
} from '../../utils/scientificCalculations';
import { muscleMetadata } from '../../data/muscleMetadata';
import { AnatomyIcon } from '../../data/anatomyIcons';
import { getTodayLocalDate, getWeekBounds, shiftDateByDays, parseLocalDate } from '../../utils/dateUtils';
import { useBackButton } from '../../context/BackNavigationContext';
import {
  ChevronRight,
  Check,
  Play,
  ArrowRight,
  Dumbbell,
  Trophy,
  RotateCcw,
  Layers,
  X,
  Clock,
  Flame,
  Sparkles,
  Calendar,
  Zap
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
  const suggestedNext = useMemo(() => getSuggestedNextWorkout(workouts), [workouts]);
  const gymLevels = useMemo(
    () => calculateOverallGymLevels(workouts, allExercises, profile),
    [workouts, allExercises, profile]
  );

  // Dynamic screen size and orientation detection for automatic responsive dashboard scaling
  const [screenHeight, setScreenHeight] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerHeight : 800
  );

  useEffect(() => {
    const handleResize = () => {
      setScreenHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Automatic adaptive compact mode: activates when viewport height < 780px
  const isCompact = screenHeight < 780;

  // User customizable weekly workout goal (default 4 days/week)
  const [weeklyGoal, setWeeklyGoal] = useState<number>(() => {
    const saved = localStorage.getItem('gympad_weekly_goal');
    const parsed = saved ? parseInt(saved, 10) : 4;
    return [3, 4, 5, 6].includes(parsed) ? parsed : 4;
  });

  const handleCycleWeeklyGoal = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playPop();
    const options = [3, 4, 5, 6];
    const nextGoal = options[(options.indexOf(weeklyGoal) + 1) % options.length];
    setWeeklyGoal(nextGoal);
    localStorage.setItem('gympad_weekly_goal', String(nextGoal));
    showToast({
      title: 'Haftalık Hedef Güncellendi',
      description: `Haftalık antrenman hedefiniz ${nextGoal} gün olarak ayarlandı.`,
      type: 'info'
    });
  };

  // Interactive split selector state (defaults to AI coach's recommended split)
  const [selectedSplit, setSelectedSplit] = useState<SplitType>(() => suggestedNext.recommendedSplit || 'upper');
  const [isPlannedModalOpen, setIsPlannedModalOpen] = useState<boolean>(false);
  const [bodyMapMode, setBodyMapMode] = useState<'readiness' | 'development'>('readiness');
  const [bottomCardTab, setBottomCardTab] = useState<'recent' | 'prs'>('recent');

  // Direct workout inspection & editing modals right from the Home Hub
  const [inspectingWorkout, setInspectingWorkout] = useState<Workout | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  // Hook hardware back button to dismiss planned workout overlay if open
  useBackButton(isPlannedModalOpen, () => {
    sounds.playPop();
    setIsPlannedModalOpen(false);
  }, 60);

  useEffect(() => {
    if (suggestedNext.recommendedSplit) {
      setSelectedSplit(suggestedNext.recommendedSplit);
    }
  }, [suggestedNext.recommendedSplit]);

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

  // Clean exercise name helper (strips secondary Turkish parentheses for cleaner UI)
  const cleanExName = (name: string) => {
    const idx = name.indexOf('(');
    return idx > 0 ? name.slice(0, idx).trim() : name;
  };

  // Helper to compute volume of a workout
  const calcWorkoutVolumeKg = (w: Workout | null) => {
    if (!w) return 0;
    let vol = 0;
    w.exercises.forEach((ex) => {
      const isDur = isDurationExercise(ex.id);
      if (isDur) return;
      if (ex.detailedSets && ex.detailedSets.length > 0) {
        ex.detailedSets.forEach((s) => {
          if (isSetValid(s, false)) vol += s.weight * (s.reps || 5);
        });
      } else if (ex.sets && ex.sets.length > 0) {
        ex.sets.forEach((wt) => {
          if (wt > 0) vol += wt * 5;
        });
      }
    });
    return Math.round(vol);
  };

  // Weekly 7-day consistency with direct workout references + daily volume bar height
  const weekDays = useMemo(() => {
    const todayWeek = getWeekBounds(todayStr);
    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const rawDays = dayNames.map((label, idx) => {
      const curDateStr = shiftDateByDays(todayWeek.start, idx);
      const dayWorkout = workouts.find(w => w.date === curDateStr) || null;
      const volumeKg = calcWorkoutVolumeKg(dayWorkout);
      const isToday = curDateStr === todayStr;
      return {
        dateStr: curDateStr,
        label,
        hasWorkout: Boolean(dayWorkout),
        workout: dayWorkout,
        volumeKg,
        isToday
      };
    });

    const maxVol = Math.max(...rawDays.map(d => d.volumeKg), 1000);
    return rawDays.map(d => ({
      ...d,
      barPct: d.hasWorkout ? Math.max(30, Math.min(100, Math.round((d.volumeKg / maxVol) * 100))) : 0
    }));
  }, [todayStr, workouts]);

  const thisWeekCount = useMemo(() => {
    const todayWeek = getWeekBounds(todayStr);
    return workouts.filter(w => w.date >= todayWeek.start && w.date <= todayWeek.end).length;
  }, [workouts, todayStr]);

  // 3 Main Regional Readiness (Üst, Alt, Core) with concise labels (zero truncation)
  const regionReadiness = useMemo(() => {
    const map = suggestedNext.muscleRecoveryMap || {};
    const calcReady = (muscles: MuscleGroup[]) => {
      if (workouts.length === 0) {
        return { pct: 100, state: 'Hazır', color: '#10b981' };
      }
      const days = Math.min(...muscles.map(m => map[m]?.daysSinceTrained ?? 99));
      if (days === 0) return { pct: 30, state: 'Dinleniyor', color: '#f59e0b' };
      if (days === 1) return { pct: 68, state: 'Toparlanıyor', color: '#38bdf8' };
      return {
        pct: 100,
        state: 'Hazır',
        color: '#10b981'
      };
    };

    return [
      {
        id: 'upper' as SplitType,
        name: 'Üst Vücut',
        shortName: 'Üst',
        iconMuscle: 'chest' as MuscleGroup,
        ...calcReady(['chest', 'back', 'shoulder', 'biceps', 'triceps'])
      },
      {
        id: 'lower' as SplitType,
        name: 'Alt Vücut',
        shortName: 'Alt',
        iconMuscle: 'quads' as MuscleGroup,
        ...calcReady(['quads', 'hamstring', 'glutes'])
      },
      {
        id: 'custom' as SplitType,
        name: 'Core',
        shortName: 'Core',
        iconMuscle: 'abs' as MuscleGroup,
        ...calcReady(['abs'])
      }
    ];
  }, [suggestedNext, workouts.length]);

  // Muscle Development & Hypertrophy Volume Map for "Kas Gelişimi" mode
  const { muscleDevelopmentMap, regionDevelopment } = useMemo(() => {
    const levels = calculateMuscleLevels(workouts, allExercises);
    const landmarks = calculateWeeklyVolumeLandmarks(workouts, allExercises);

    const devMap: Partial<Record<MuscleGroup, { weeklySets: number; level: number }>> = {};
    levels.forEach((l) => {
      devMap[l.muscle] = { weeklySets: 0, level: l.level };
    });
    landmarks.forEach((lm) => {
      devMap[lm.muscle] = {
        weeklySets: lm.weeklySets,
        level: devMap[lm.muscle]?.level ?? 1
      };
    });

    const calcRegDev = (muscles: MuscleGroup[], targetSets: number) => {
      const avgLevel = Math.max(
        1,
        Math.round(
          muscles.reduce((sum, m) => sum + (devMap[m]?.level ?? 1), 0) / Math.max(1, muscles.length)
        )
      );
      const totalSets = Math.round(
        muscles.reduce((sum, m) => sum + (devMap[m]?.weeklySets ?? 0), 0)
      );
      const pct = Math.min(100, Math.max(12, Math.round((totalSets / targetSets) * 100)));

      let state = `${totalSets}/${targetSets} set`;
      let color = '#38bdf8';
      if (totalSets >= targetSets * 0.85) {
        color = '#fbbf24';
        state = `${totalSets} set · Zirve`;
      } else if (totalSets >= targetSets * 0.45) {
        color = '#10b981';
        state = `${totalSets} set · Aktif`;
      } else if (totalSets > 0) {
        color = '#38bdf8';
        state = `${totalSets} set · Başlangıç`;
      } else {
        color = avgLevel > 1 ? '#a855f7' : '#64748b';
        state = `0/${targetSets} set`;
      }

      return { avgLevel, totalSets, targetSets, pct, state, color };
    };

    return {
      muscleDevelopmentMap: devMap,
      regionDevelopment: [
        {
          id: 'upper' as SplitType,
          name: 'Üst Vücut',
          ...calcRegDev(['chest', 'back', 'shoulder', 'biceps', 'triceps'], 28)
        },
        {
          id: 'lower' as SplitType,
          name: 'Alt Vücut',
          ...calcRegDev(['quads', 'hamstring', 'glutes', 'calves'], 18)
        },
        {
          id: 'custom' as SplitType,
          name: 'Core',
          ...calcRegDev(['abs'], 8)
        }
      ]
    };
  }, [workouts, allExercises]);

  // Recommended split metadata (independent from modal tab state)
  const splitMetaMap: Record<SplitType, { title: string; shortTitle: string; subtitle: string; accent: string }> = {
    upper: {
      title: 'Üst Vücut Antrenmanı',
      shortTitle: 'Üst Vücut',
      subtitle: 'Göğüs, Sırt, Omuz ve Kol odaklı seans',
      accent: '#38bdf8'
    },
    lower: {
      title: 'Alt Vücut Antrenmanı',
      shortTitle: 'Alt Vücut',
      subtitle: 'Ön bacak, arka bacak ve kalça odaklı seans',
      accent: '#a855f7'
    },
    full: {
      title: 'Tüm Vücut (Full Body)',
      shortTitle: 'Tüm Vücut',
      subtitle: 'Tüm büyük kas gruplarını uyaran bileşik seans',
      accent: '#10b981'
    },
    custom: {
      title: 'Core & İzole Antrenman',
      shortTitle: 'Core & Özel',
      subtitle: 'Karın, merkez bölge dayanıklılığı ve izole kaslar',
      accent: '#f59e0b'
    }
  };

  const recommendedSplitId: SplitType = suggestedNext.recommendedSplit || 'upper';
  const recommendedSplitMeta = splitMetaMap[recommendedSplitId];

  // Top 3 Personal Records (1RM) + Mini Sparkline Trend Points
  const topPersonalRecords = useMemo(() => {
    const list = allExercises
      .map(ex => {
        const analysis = getExerciseStrengthAnalysis(ex, workouts, profile);
        const historyPoints: number[] = [];
        for (let i = workouts.length - 1; i >= 0; i--) {
          const w = workouts[i];
          const found = w.exercises.find(e => e.id === ex.id);
          if (found) {
            let sessionMax = 0;
            if (found.detailedSets && found.detailedSets.length > 0) {
              found.detailedSets.forEach(s => {
                if (s.weight > 0) {
                  sessionMax = Math.max(sessionMax, calculate1RM(s.weight, s.reps || 5));
                }
              });
            } else if (found.sets && found.sets.length > 0) {
              found.sets.forEach(wt => {
                if (wt > 0) sessionMax = Math.max(sessionMax, calculate1RM(wt, 5));
              });
            }
            if (sessionMax > 0) historyPoints.push(sessionMax);
          }
        }
        return {
          ...analysis,
          muscle: ex.muscle,
          historyPoints: historyPoints.slice(-6)
        };
      })
      .filter(a => a.estimated1RM > 0 && !isDurationExercise(a.exerciseId))
      .sort((a, b) => b.estimated1RM - a.estimated1RM);
    return list.slice(0, 3);
  }, [allExercises, workouts, profile]);

  // Preview of exercises for the currently selected split tab in the modal
  const selectedSplitPreview = useMemo(() => {
    const routine = getRecommendedRoutineForSplit(selectedSplit, allExercises, workouts, profile);
    return {
      ...splitMetaMap[selectedSplit],
      exercises: routine
    };
  }, [selectedSplit, allExercises, workouts, profile]);

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
      title: 'Antrenman Yüklendi',
      description: `${pastWorkout.type} (${pastWorkout.exercises.length} hareket) yeni seansa aktarıldı.`,
      type: 'success'
    });
  };

  const latestWorkout = workouts.length > 0 ? workouts[0] : null;

  // Detailed summary of the latest workout + Muscle Stacked Distribution
  const latestWorkoutSummary = useMemo(() => {
    if (!latestWorkout) return null;
    const now = Date.now();
    let timeString = '';

    if (latestWorkout.createdAt && latestWorkout.createdAt > 0) {
      const diffMs = Math.max(0, now - latestWorkout.createdAt);
      const diffMinutes = Math.floor(diffMs / (60 * 1000));
      const diffHours = Math.floor(diffMs / (3600 * 1000));
      const diffDays = Math.floor(diffMs / (24 * 3600 * 1000));

      if (diffMinutes < 60) {
        timeString = diffMinutes <= 1 ? 'Az önce' : `${diffMinutes} dk önce`;
      } else if (diffHours < 24) {
        timeString = `${diffHours} saat önce`;
      } else if (diffDays === 1) {
        timeString = 'Dün';
      } else {
        timeString = `${diffDays}g önce`;
      }
    } else if (latestWorkout.date) {
      if (latestWorkout.date === todayStr) {
        timeString = 'Bugün';
      } else {
        const lastD = parseLocalDate(latestWorkout.date);
        const todayD = parseLocalDate(todayStr);
        const days = Math.max(1, Math.round((todayD.getTime() - lastD.getTime()) / (1000 * 60 * 60 * 24)));
        timeString = days === 1 ? 'Dün' : `${days}g önce`;
      }
    }

    let totalSets = 0;
    let totalVolumeKg = 0;
    const muscleSetCounts: Partial<Record<MuscleGroup, number>> = {};

    latestWorkout.exercises.forEach((ex) => {
      const def = allExercises.find(a => a.id === ex.id);
      const mGroup: MuscleGroup = ex.muscle || def?.muscle || 'chest';
      const isDur = isDurationExercise(ex.id);
      let exSets = 0;

      if (ex.detailedSets && ex.detailedSets.length > 0) {
        ex.detailedSets.forEach((s) => {
          if (isSetValid(s, isDur)) {
            totalSets++;
            exSets++;
            if (!isDur) totalVolumeKg += s.weight * (s.reps || 5);
          }
        });
      } else if (ex.sets && ex.sets.length > 0) {
        ex.sets.forEach((w) => {
          if (w > 0) {
            totalSets++;
            exSets++;
            if (!isDur) totalVolumeKg += w * 5;
          }
        });
      }

      if (exSets > 0) {
        muscleSetCounts[mGroup] = (muscleSetCounts[mGroup] || 0) + exSets;
      }
    });

    const totalMuscleSets = Math.max(1, Object.values(muscleSetCounts).reduce((a, b) => a + (b || 0), 0));
    const muscleBreakdown = (Object.entries(muscleSetCounts) as [MuscleGroup, number][])
      .sort((a, b) => b[1] - a[1])
      .map(([muscle, sets]) => {
        const meta = muscleMetadata[muscle] || muscleMetadata.chest;
        return {
          muscle,
          name: meta.name.split(' ')[0],
          sets,
          pct: Math.round((sets / totalMuscleSets) * 100),
          color: meta.color
        };
      });

    return {
      timeString,
      type: latestWorkout.type,
      exercisesCount: latestWorkout.exercises.length,
      totalSets,
      totalVolumeKg: Math.round(totalVolumeKg),
      muscleBreakdown
    };
  }, [latestWorkout, todayStr, allExercises]);

  // Keep inspectingWorkout synced with latest workouts array in case it was edited/deleted
  const currentInspectingWorkout = useMemo(() => {
    if (!inspectingWorkout) return null;
    return workouts.find(w => w.id === inspectingWorkout.id) || null;
  }, [inspectingWorkout, workouts]);

  const activeDraftExercisesCount = Object.keys(draft.exerciseSets).length;
  const activeDraftCompletedSetsCount = Object.entries(draft.exerciseSets).reduce((sum, [exId, sets]) => {
    const isDur = isDurationExercise(exId);
    return sum + sets.filter(s => s.completed && isSetValid(s, isDur)).length;
  }, 0);

  if (isLoggingWorkout && !isWorkoutMinimized) {
    return <ActiveWorkoutLogger onBackToHub={() => setIsWorkoutMinimized(true)} />;
  }

  // Concentric SVG Ring math
  const ringSize = isCompact ? 56 : 68;
  const weeklyPct = Math.min(100, Math.round((thisWeekCount / weeklyGoal) * 100));
  const outerR = 33.5;
  const outerC = 2 * Math.PI * outerR;
  const outerOffset = outerC - (weeklyPct / 100) * outerC;

  const innerR = 25;
  const innerC = 2 * Math.PI * innerR;
  const innerOffset = innerC - (overallStats.rankProgressPct / 100) * innerC;

  // Helper to build SVG sparkline path from points
  const buildSparkline = (points: number[], width = 76, height = isCompact ? 10 : 14) => {
    if (points.length <= 1) {
      const y = height / 2;
      return {
        linePath: `M 2 ${y} L ${width - 2} ${y}`,
        areaPath: `M 2 ${y} L ${width - 2} ${y} L ${width - 2} ${height} L 2 ${height} Z`,
        lastX: width - 2,
        lastY: y
      };
    }
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const padX = 2;
    const padY = 2;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;

    const coords = points.map((val, idx) => {
      const x = padX + (idx / (points.length - 1)) * usableW;
      const y = max === min ? height / 2 : padY + usableH - ((val - min) / range) * usableH;
      return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    });

    const linePath = coords.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
    const last = coords[coords.length - 1];
    const first = coords[0];
    const areaPath = `${linePath} L ${last.x} ${height} L ${first.x} ${height} Z`;

    return { linePath, areaPath, lastX: last.x, lastY: last.y };
  };

  const splitTabs: { id: SplitType; label: string }[] = [
    { id: 'upper', label: 'Üst Vücut' },
    { id: 'lower', label: 'Alt Vücut' },
    { id: 'full', label: 'Tüm Vücut' },
    { id: 'custom', label: 'Core' }
  ];

  /* ==========================================================================
     DASHBOARD COCKPIT ARCHITECTURAL CONTRACT (DOKUNULMAZLIK KURALLARI)
     1. ZERO-SCROLL GUARANTEE: Bu sayfa bir liste değil, tek ekranlı kokpittir.
        Kullanıcı dikey kaydırma yapmadan tüm temel özetleri görmelidir.
     2. HEIGHT BUDGET: Toplam dikey alan (100dvh) 3 ferah ana kart + başlatıcı
        arasında dengeli paylaştırılır:
        - Bölüm 1 (Header): Logo, Başlık, Bugün Yapıldı Rozeti & Menü
        - Bölüm 2 (Sporcu Durumu, Seri & 7 Günlük Haftalık Ritim)
        - Bölüm 3 (Kas Hazırlık & Bölgesel Gelişim Haritası + AI Öneri)
        - Bölüm 4 (Son Seans Özeti / En İyi 1RM Rekorlar Sekmeli Vitrin)
        - Bölüm 5 (Alt Aksiyon Başlatıcı & Hızlı Program Seçici)
     3. COMPACT SCALABILITY: isCompact true olduğunda tüm kartlar, ikonlar ve
        padding değerleri minyatür oranlara geçer. Asla taşma yapamaz.
     4. MODAL BOUNDARY: Detaylı analizler ve listeler daima modal içinde açılır.
     ========================================================================== */

  return (
    <div
      className="dashboard-container"
      style={{
        flex: 1,
        height: '100%',
        minHeight: 0,
        padding: isCompact
          ? 'clamp(4px, 0.8vh, 8px) clamp(10px, 2.5vw, 14px)'
          : 'clamp(8px, 1.2vh, 12px) clamp(12px, 3vw, 16px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: isCompact ? 'clamp(5px, 0.8vh, 8px)' : 'clamp(8px, 1.2vh, 12px)',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        animation: 'fadeIn 0.2s ease-out',
        fontVariantNumeric: 'tabular-nums',
        boxSizing: 'border-box'
      }}
    >
      {/* ========================================================= */}
      {/* 1. COMPACT HEADER                                         */}
      {/* ========================================================= */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
          minHeight: isCompact ? 30 : 36
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isCompact ? 8 : 10, minWidth: 0, flexShrink: 1 }}>
          <div
            style={{
              width: isCompact ? 28 : 34,
              height: isCompact ? 28 : 34,
              borderRadius: isCompact ? 8 : 10,
              overflow: 'hidden',
              background: '#0b0f17',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)'
            }}
          >
            <img
              src="/icon-192.png"
              alt="GymPad"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flexWrap: 'nowrap' }}>
              <h1
                style={{
                  fontSize: isCompact ? 15.5 : 17.5,
                  fontWeight: 800,
                  color: '#f8fafc',
                  margin: 0,
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.1
                }}
              >
                GymPad
              </h1>
              {todayWorkout && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setInspectingWorkout(todayWorkout);
                  }}
                  title="Bugünkü tamamlanan antrenmanı incele"
                  style={{
                    fontSize: isCompact ? 8.5 : 9.5,
                    fontWeight: 700,
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.13)',
                    border: '1px solid rgba(16, 185, 129, 0.28)',
                    padding: isCompact ? '2px 6px' : '2.5px 7px',
                    borderRadius: 999,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    flexShrink: 0,
                    lineHeight: 1
                  }}
                >
                  <Check size={isCompact ? 8.5 : 9.5} strokeWidth={3} />
                  <span>Bugün Yapıldı</span>
                </button>
              )}
            </div>
            <div
              style={{
                fontSize: isCompact ? 9.5 : 10.5,
                fontWeight: 500,
                color: 'var(--text-dim)',
                marginTop: 1,
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <HeaderBurgerMenu />
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. ATHLETE STATUS, STREAK & 7-DAY WEEKLY RHYTHM CARD      */}
      {/* ========================================================= */}
      <div
        className="dashboard-card"
        style={{
          borderRadius: isCompact ? 13 : 16,
          padding: isCompact ? '7px 10px' : '11px 13px'
        }}
      >
        {/* Top Row: Concentric Dual Ring (Left) + Rank & 3 Crisp KPI Pills (Right) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${ringSize}px minmax(0, 1fr)`,
            gap: isCompact ? 9 : 12,
            alignItems: 'center',
            paddingBottom: isCompact ? 6 : 9,
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          {/* Concentric Dual Ring */}
          <div
            onClick={handleCycleWeeklyGoal}
            title="Haftalık hedefi değiştirmek için dokun (3-6 gün)"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <div style={{ position: 'relative', width: ringSize, height: ringSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={ringSize} height={ringSize} viewBox="0 0 76 76" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="38"
                  cy="38"
                  r={outerR}
                  fill="none"
                  stroke="rgba(16, 185, 129, 0.14)"
                  strokeWidth="5.5"
                />
                <circle
                  cx="38"
                  cy="38"
                  r={outerR}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeDasharray={outerC}
                  strokeDashoffset={outerOffset}
                  style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />

                <circle
                  cx="38"
                  cy="38"
                  r={innerR}
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.14)"
                  strokeWidth="4"
                />
                <circle
                  cx="38"
                  cy="38"
                  r={innerR}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={innerC}
                  strokeDashoffset={innerOffset}
                  style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
              </svg>

              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: isCompact ? 12.5 : 14.5, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                  {thisWeekCount}<span style={{ color: 'var(--text-dim)', fontSize: isCompact ? 8.5 : 10 }}>/{weeklyGoal}</span>
                </div>
                <div style={{ fontSize: isCompact ? 6 : 7, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 1.5 }}>
                  HAFTA
                </div>
              </div>
            </div>
          </div>

          {/* Athlete Profile + 3 Clean KPI Pills */}
          <div style={{ minWidth: 0 }}>
            <div
              onClick={() => {
                sounds.playPop();
                setActiveTab('levels');
              }}
              style={{
                marginBottom: isCompact ? 5 : 7,
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: isCompact ? 13.5 : 15, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {overallStats.rankTitle}
                  </span>
                  <span
                    style={{
                      fontSize: isCompact ? 8.5 : 9.5,
                      fontWeight: 800,
                      color: '#38bdf8',
                      background: 'rgba(56, 189, 248, 0.14)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      padding: isCompact ? '1px 5px' : '1.5px 6px',
                      borderRadius: 6,
                      flexShrink: 0
                    }}
                  >
                    SV {overallStats.overallLevel}
                  </span>
                </div>
                <span style={{ fontSize: isCompact ? 8.5 : 9.5, fontWeight: 700, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                  %{overallStats.rankProgressPct}
                  <ChevronRight size={isCompact ? 11 : 13} color="var(--text-dim)" />
                </span>
              </div>

              {/* Smooth XP Progress Bar */}
              <div
                style={{
                  width: '100%',
                  height: isCompact ? 3.5 : 4.5,
                  background: 'rgba(255, 255, 255, 0.07)',
                  borderRadius: 999,
                  overflow: 'hidden',
                  marginTop: isCompact ? 3 : 4
                }}
              >
                <div
                  style={{
                    width: `${overallStats.rankProgressPct}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #38bdf8, #10b981)',
                    borderRadius: 999,
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
            </div>

            {/* 3 Clean, Readable Performance Pills (Seri, Toplam Seans, Güç Skoru) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: isCompact ? 4.5 : 6
              }}
            >
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setActiveTab('history');
                }}
                style={{
                  minWidth: 0,
                  cursor: 'pointer',
                  background: 'rgba(245, 158, 11, 0.07)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: isCompact ? 7 : 9,
                  padding: isCompact ? '3.5px 6px' : '5px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isCompact ? 4 : 5.5,
                  textAlign: 'left'
                }}
              >
                <Flame size={isCompact ? 11 : 13} color="#f59e0b" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: isCompact ? 10.5 : 12, fontWeight: 800, color: '#f8fafc', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                    {overallStats.activeStreak} Gün
                  </div>
                  <div style={{ fontSize: isCompact ? 7 : 8, color: 'var(--text-muted)', fontWeight: 600 }}>Seri</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setActiveTab('history');
                }}
                style={{
                  minWidth: 0,
                  cursor: 'pointer',
                  background: 'rgba(16, 185, 129, 0.07)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: isCompact ? 7 : 9,
                  padding: isCompact ? '3.5px 6px' : '5px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isCompact ? 4 : 5.5,
                  textAlign: 'left'
                }}
              >
                <Calendar size={isCompact ? 11 : 13} color="#10b981" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: isCompact ? 10.5 : 12, fontWeight: 800, color: '#f8fafc', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                    {overallStats.totalWorkouts}
                  </div>
                  <div style={{ fontSize: isCompact ? 7 : 8, color: 'var(--text-muted)', fontWeight: 600 }}>Seans</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setActiveTab('levels');
                }}
                style={{
                  minWidth: 0,
                  cursor: 'pointer',
                  background: 'rgba(168, 85, 247, 0.08)',
                  border: '1px solid rgba(168, 85, 247, 0.22)',
                  borderRadius: isCompact ? 7 : 9,
                  padding: isCompact ? '3.5px 6px' : '5px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isCompact ? 4 : 5.5,
                  textAlign: 'left'
                }}
              >
                <Zap size={isCompact ? 11 : 13} color="#c084fc" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: isCompact ? 10.5 : 12, fontWeight: 800, color: '#c084fc', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                    {gymLevels.overallStrengthScore}
                  </div>
                  <div style={{ fontSize: isCompact ? 7 : 8, color: 'var(--text-muted)', fontWeight: 600 }}>Güç Skoru</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row: 7-Day Interactive Rhythm */}
        <div style={{ paddingTop: isCompact ? 5 : 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: isCompact ? 4 : 6 }}>
            {weekDays.map((d) => (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => {
                  sounds.playPop();
                  if (d.workout) {
                    setInspectingWorkout(d.workout);
                  } else if (d.isToday) {
                    setIsPlannedModalOpen(true);
                  }
                }}
                title={
                  d.workout
                    ? `${d.label}: ${d.workout.type} (${(d.volumeKg / 1000).toFixed(1)}t)`
                    : d.label
                }
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: isCompact ? '3px 0 3.5px 0' : '4.5px 0 5px 0',
                  borderRadius: isCompact ? 7.5 : 9,
                  minWidth: 0,
                  cursor: d.workout || d.isToday ? 'pointer' : 'default',
                  background: d.hasWorkout
                    ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)'
                    : d.isToday
                    ? 'rgba(255, 255, 255, 0.055)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: d.hasWorkout
                    ? '1px solid rgba(16, 185, 129, 0.36)'
                    : d.isToday
                    ? '1px solid rgba(56, 189, 248, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.04)'
                }}
              >
                <span
                  style={{
                    fontSize: isCompact ? 8.5 : 9.5,
                    fontWeight: d.isToday || d.hasWorkout ? 700 : 500,
                    color: d.hasWorkout ? '#10b981' : d.isToday ? '#38bdf8' : 'var(--text-dim)',
                    marginBottom: isCompact ? 2 : 3
                  }}
                >
                  {d.label}
                </span>

                <div
                  style={{
                    width: isCompact ? 14 : 16,
                    height: isCompact ? 12 : 15,
                    borderRadius: isCompact ? 4 : 4.5,
                    background: 'rgba(255, 255, 255, 0.04)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    padding: 1,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {d.hasWorkout ? (
                    <div
                      style={{
                        width: '100%',
                        height: `${d.barPct}%`,
                        borderRadius: 3,
                        background: 'linear-gradient(180deg, #34d399 0%, #10b981 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 6px rgba(16, 185, 129, 0.45)'
                      }}
                    >
                      <Check size={isCompact ? 7.5 : 8.5} color="#06130e" strokeWidth={3.5} />
                    </div>
                  ) : (
                    <span
                      style={{
                        width: isCompact ? 3 : 4,
                        height: isCompact ? 3 : 4,
                        borderRadius: '50%',
                        marginBottom: isCompact ? 3.5 : 4.5,
                        background: d.isToday ? '#38bdf8' : 'rgba(255, 255, 255, 0.16)'
                      }}
                    />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. ANATOMICAL BODY HEATMAP & REGIONAL READINESS CARD      */}
      {/* ========================================================= */}
      <div
        className="dashboard-card"
        style={{
          borderRadius: isCompact ? 13 : 16,
          padding: isCompact ? '7px 10px' : '10px 13px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 0
        }}
      >
        {/* Header: Segmented Mode Switcher (Kas Hazırlığı | Kas Gelişimi) + AI Coach Pill */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCompact ? 5 : 8, gap: 6, flexShrink: 0 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(9, 13, 21, 0.78)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 999,
              padding: 2.5,
              gap: 2
            }}
          >
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setBodyMapMode('readiness');
              }}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: isCompact ? '2.5px 8px' : '3.5px 10px',
                fontSize: isCompact ? 9 : 10.5,
                fontWeight: 800,
                cursor: 'pointer',
                background: bodyMapMode === 'readiness' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
                color: bodyMapMode === 'readiness' ? '#10b981' : 'var(--text-dim)',
                transition: 'all 0.15s ease'
              }}
            >
              Kas Hazırlığı
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setBodyMapMode('development');
              }}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: isCompact ? '2.5px 8px' : '3.5px 10px',
                fontSize: isCompact ? 9 : 10.5,
                fontWeight: 800,
                cursor: 'pointer',
                background: bodyMapMode === 'development' ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                color: bodyMapMode === 'development' ? '#38bdf8' : 'var(--text-dim)',
                transition: 'all 0.15s ease'
              }}
            >
              Kas Gelişimi
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setSelectedSplit(recommendedSplitId);
              setIsPlannedModalOpen(true);
            }}
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 999,
              padding: isCompact ? '2.5px 7px' : '3.5px 9px',
              fontSize: isCompact ? 9 : 10,
              color: '#10b981',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3.5,
              cursor: 'pointer',
              minWidth: 0,
              maxWidth: '48%'
            }}
          >
            <Sparkles size={isCompact ? 9 : 10.5} style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Öneri: {recommendedSplitMeta.shortTitle}
            </span>
            <ChevronRight size={isCompact ? 9.5 : 11} style={{ flexShrink: 0 }} />
          </button>
        </div>

        {/* 2-Column Visual Schema: Left = Front/Back Body Heatmap, Right = 3 Radial Gauges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isCompact ? '110px minmax(0, 1fr)' : '146px minmax(0, 1fr)',
            gap: isCompact ? 8 : 11,
            alignItems: 'stretch',
            flex: 1,
            minHeight: 0
          }}
        >
          {/* Interactive Front/Back Anatomical Silhouette */}
          <BodyReadinessMap
            mode={bodyMapMode}
            muscleRecoveryMap={suggestedNext.muscleRecoveryMap}
            muscleDevelopmentMap={muscleDevelopmentMap}
            hasAnyWorkouts={workouts.length > 0}
            compact={isCompact}
            onSelectSplit={(split) => {
              if (bodyMapMode === 'development') {
                setActiveTab('levels');
              } else {
                setSelectedSplit(split);
                setIsPlannedModalOpen(true);
              }
            }}
          />

          {/* 3 Radial Region Gauges (Readiness or Muscle Development) */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: isCompact ? 4 : 6 }}>
            {(bodyMapMode === 'readiness' ? regionReadiness : regionDevelopment).map((reg) => {
              const isReadiness = bodyMapMode === 'readiness';
              const isRecommended = isReadiness && recommendedSplitId === reg.id;
              const r = 13.5;
              const c = 2 * Math.PI * r;
              const offset = c - (reg.pct / 100) * c;
              const gaugeSize = isCompact ? 26 : 33;
              const centerLabel = isReadiness
                ? `%${reg.pct}`
                : `SV${(reg as typeof regionDevelopment[number]).avgLevel}`;

              return (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    if (isReadiness) {
                      setSelectedSplit(reg.id);
                      setIsPlannedModalOpen(true);
                    } else {
                      setActiveTab('levels');
                    }
                  }}
                  style={{
                    width: '100%',
                    flex: 1,
                    background: isRecommended
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.11) 0%, rgba(255, 255, 255, 0.025) 100%)'
                      : 'rgba(255, 255, 255, 0.025)',
                    border: isRecommended
                      ? '1px solid rgba(16, 185, 129, 0.32)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: isCompact ? 8.5 : 11,
                    padding: isCompact ? '3.5px 7px' : '5px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: isCompact ? 6 : 8,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: isCompact ? 6 : 8.5, minWidth: 0 }}>
                    {/* Circular Radial Gauge */}
                    <div style={{ position: 'relative', width: gaugeSize, height: gaugeSize, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width={gaugeSize} height={gaugeSize} viewBox="0 0 34 34" style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                          cx="17"
                          cy="17"
                          r={r}
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.08)"
                          strokeWidth="3"
                        />
                        <circle
                          cx="17"
                          cy="17"
                          r={r}
                          fill="none"
                          stroke={reg.color}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={c}
                          strokeDashoffset={offset}
                          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                        />
                      </svg>
                      <span style={{ position: 'absolute', fontSize: isCompact ? 7 : 8.5, fontWeight: 800, color: '#f8fafc' }}>
                        {centerLabel}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: isCompact ? 11 : 12.5, fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap', lineHeight: 1.15 }}>
                        {reg.name}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3.5, minWidth: 0, marginTop: 1 }}>
                        <span
                          style={{
                            width: isCompact ? 4 : 5,
                            height: isCompact ? 4 : 5,
                            borderRadius: '50%',
                            background: reg.color,
                            flexShrink: 0
                          }}
                        />
                        <span style={{ fontSize: isCompact ? 8.5 : 10, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {reg.state}
                        </span>
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={isCompact ? 11 : 13.5} color="var(--text-dim)" style={{ flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. UNIFIED TABBED CARD: SON SEANS | EN İYİ REKORLAR (1RM) */}
      {/* ========================================================= */}
      <div
        className="dashboard-card"
        style={{
          borderRadius: isCompact ? 13 : 16,
          padding: isCompact ? '6px 10px 7px 10px' : '9px 13px 10px 13px',
          display: 'flex',
          flexDirection: 'column',
          gap: isCompact ? 5 : 7,
          flexShrink: 0
        }}
      >
        {/* Card Header: Mini Segmented Switcher (Son Seans | Rekorlar) + Contextual Action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(9, 13, 21, 0.78)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 999,
              padding: 2,
              gap: 2
            }}
          >
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setBottomCardTab('recent');
              }}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: isCompact ? '2px 8px' : '3px 10px',
                fontSize: isCompact ? 8.5 : 10,
                fontWeight: 800,
                cursor: 'pointer',
                background: bottomCardTab === 'recent' ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                color: bottomCardTab === 'recent' ? '#38bdf8' : 'var(--text-dim)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s ease'
              }}
            >
              <Clock size={isCompact ? 9 : 10.5} />
              <span>Son Seans</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setBottomCardTab('prs');
              }}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: isCompact ? '2px 8px' : '3px 10px',
                fontSize: isCompact ? 8.5 : 10,
                fontWeight: 800,
                cursor: 'pointer',
                background: bottomCardTab === 'prs' ? 'rgba(251, 191, 36, 0.18)' : 'transparent',
                color: bottomCardTab === 'prs' ? '#fbbf24' : 'var(--text-dim)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Trophy size={isCompact ? 9 : 10.5} />
              <span>1RM Rekorlar</span>
            </button>
          </div>

          {bottomCardTab === 'recent' && latestWorkout ? (
            <button
              type="button"
              onClick={() => handleRepeatPastWorkout(latestWorkout)}
              style={{
                background: 'rgba(56, 189, 248, 0.14)',
                border: '1px solid rgba(56, 189, 248, 0.32)',
                borderRadius: 999,
                padding: isCompact ? '2px 7px' : '3px 9px',
                color: '#38bdf8',
                fontSize: isCompact ? 8.5 : 10,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3.5,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <RotateCcw size={isCompact ? 8.5 : 10} />
              <span>Seansı Tekrarla</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setActiveTab('levels');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#38bdf8',
                fontSize: isCompact ? 8.5 : 10,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                padding: '2px 4px'
              }}
            >
              <span>Tüm Seviyeler</span>
              <ChevronRight size={isCompact ? 9.5 : 11} />
            </button>
          )}
        </div>

        {/* Tab Content A: Recent Workout Summary */}
        {bottomCardTab === 'recent' ? (
          latestWorkout && latestWorkoutSummary ? (
            <div
              onClick={() => {
                sounds.playPop();
                setInspectingWorkout(latestWorkout);
              }}
              title="Antrenman detaylarını görmek için dokun"
              style={{
                background: 'rgba(255, 255, 255, 0.028)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: isCompact ? 8.5 : 11,
                padding: isCompact ? '6px 8px' : '8px 11px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: isCompact ? 4.5 : 6.5
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: isCompact ? 11.5 : 13, fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {latestWorkoutSummary.type}
                  </span>
                  <span style={{ fontSize: isCompact ? 8.5 : 10, fontWeight: 600, color: 'var(--text-dim)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    · {latestWorkoutSummary.timeString}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <span style={{ fontSize: isCompact ? 9.5 : 11, fontWeight: 700, color: '#cbd5e1' }}>
                    {latestWorkoutSummary.exercisesCount} hareket · {latestWorkoutSummary.totalSets} set ·{' '}
                    <strong style={{ color: '#38bdf8' }}>{(latestWorkoutSummary.totalVolumeKg / 1000).toFixed(1)}t</strong>
                  </span>
                  <ChevronRight size={isCompact ? 11 : 13} color="var(--text-dim)" />
                </div>
              </div>

              {latestWorkoutSummary.muscleBreakdown.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: isCompact ? 6 : 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      flex: 1,
                      height: isCompact ? 4 : 5,
                      borderRadius: 999,
                      overflow: 'hidden',
                      gap: 1.5,
                      background: 'rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    {latestWorkoutSummary.muscleBreakdown.map((m) => (
                      <div
                        key={m.muscle}
                        style={{
                          width: `${Math.max(8, m.pct)}%`,
                          height: '100%',
                          background: m.color,
                          borderRadius: 999
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: isCompact ? 5 : 7, flexShrink: 0 }}>
                    {latestWorkoutSummary.muscleBreakdown.slice(0, 3).map((m) => (
                      <div key={m.muscle} style={{ display: 'inline-flex', alignItems: 'center', gap: 2.5 }}>
                        <span style={{ width: isCompact ? 4 : 5, height: isCompact ? 4 : 5, borderRadius: '50%', background: m.color }} />
                        <span style={{ fontSize: isCompact ? 8 : 9.5, fontWeight: 700, color: '#cbd5e1' }}>{m.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => {
                sounds.playPop();
                setIsPlannedModalOpen(true);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px dashed rgba(255, 255, 255, 0.12)',
                borderRadius: 9,
                padding: isCompact ? '6px 9px' : '9px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Calendar size={isCompact ? 13 : 15} color="#38bdf8" />
                <div>
                  <div style={{ fontSize: isCompact ? 10.5 : 12, fontWeight: 700, color: '#f8fafc' }}>İlk Antrenmanını Başlat</div>
                  <div style={{ fontSize: isCompact ? 8.5 : 10, color: 'var(--text-dim)' }}>Hazır programlardan birini seç</div>
                </div>
              </div>
              <ChevronRight size={isCompact ? 11 : 14} color="var(--text-dim)" />
            </div>
          )
        ) : (
          /* Tab Content B: Top 3 Personal Records (1RM) */
          topPersonalRecords.length > 0 ? (
            <div
              onClick={() => {
                sounds.playPop();
                setActiveTab('levels');
              }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: isCompact ? 4.5 : 6.5,
                cursor: 'pointer'
              }}
            >
              {topPersonalRecords.map((rec, idx) => {
                const accentColor = idx === 0 ? '#fbbf24' : idx === 1 ? '#38bdf8' : '#10b981';
                const sparkHeight = isCompact ? 9 : 12;
                const spark = buildSparkline(rec.historyPoints, 76, sparkHeight);

                return (
                  <div
                    key={rec.exerciseId}
                    style={{
                      background: idx === 0
                        ? 'linear-gradient(160deg, rgba(251, 191, 36, 0.09) 0%, rgba(255, 255, 255, 0.025) 100%)'
                        : 'rgba(255, 255, 255, 0.025)',
                      border: idx === 0
                        ? '1px solid rgba(251, 191, 36, 0.25)'
                        : '1px solid rgba(255, 255, 255, 0.055)',
                      borderRadius: isCompact ? 7.5 : 10,
                      padding: isCompact ? '4px 6px 3.5px 6px' : '6px 8px 5px 8px',
                      minWidth: 0,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: isCompact ? 2 : 3
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                      <span
                        style={{
                          fontSize: isCompact ? 8.5 : 9.5,
                          fontWeight: 700,
                          color: '#cbd5e1',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {cleanExName(rec.exerciseName)}
                      </span>
                      <AnatomyIcon muscle={rec.muscle} size={isCompact ? 11 : 13} />
                    </div>

                    <div style={{ fontSize: isCompact ? 11.5 : 14, fontWeight: 800, color: idx === 0 ? '#fbbf24' : '#f8fafc', lineHeight: 1.05 }}>
                      {rec.estimated1RM} <span style={{ fontSize: isCompact ? 7.5 : 9, fontWeight: 600, color: 'var(--text-dim)' }}>kg</span>
                    </div>

                    <svg width="100%" height={sparkHeight} viewBox={`0 0 76 ${sparkHeight}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id={`spark-grad-${rec.exerciseId}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={accentColor} stopOpacity="0.32" />
                          <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d={spark.areaPath} fill={`url(#spark-grad-${rec.exerciseId})`} />
                      <path
                        d={spark.linePath}
                        fill="none"
                        stroke={accentColor}
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx={spark.lastX} cy={spark.lastY} r="1.5" fill={accentColor} />
                    </svg>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: isCompact ? 9.5 : 11, color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>
              Antrenman kaydettikçe en iyi 1RM rekorların burada listelenir.
            </div>
          )
        )}
      </div>

      {/* ========================================================= */}
      {/* 5. BOTTOM WORKOUT LAUNCHPAD (FITS ABOVE THE FOLD)         */}
      {/* ========================================================= */}
      <div style={{ flexShrink: 0 }}>
        {isLoggingWorkout ? (
          <div
            onClick={resumeActiveWorkout}
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(11, 16, 26, 0.98) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              padding: isCompact ? '7px 11px' : '12px 15px',
              borderRadius: isCompact ? 13 : 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
              minHeight: isCompact ? 44 : 56
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: isCompact ? 8 : 11, minWidth: 0 }}>
              <div
                style={{
                  width: isCompact ? 30 : 40,
                  height: isCompact ? 30 : 40,
                  borderRadius: isCompact ? 8.5 : 11,
                  background: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#090d14',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                }}
              >
                <Dumbbell size={isCompact ? 15 : 19} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: isCompact ? 12.5 : 14, fontWeight: 800, color: '#ffffff' }}>
                    Aktif Antrenman
                  </span>
                  <span
                    style={{
                      fontSize: isCompact ? 9.5 : 11,
                      fontWeight: 700,
                      color: '#34d399',
                      background: 'rgba(16, 185, 129, 0.16)',
                      padding: isCompact ? '1px 5.5px' : '1.5px 7px',
                      borderRadius: 999
                    }}
                  >
                    {formatTimer(elapsedSeconds)}
                  </span>
                </div>
                <div style={{ fontSize: isCompact ? 9.5 : 11, color: 'var(--text-muted)', marginTop: 1 }}>
                  {activeDraftExercisesCount} hareket · {activeDraftCompletedSetsCount} set tamamlandı
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#10b981',
                color: '#090d14',
                borderRadius: isCompact ? 8 : 10,
                padding: isCompact ? '6px 9px' : '9px 13px',
                fontSize: isCompact ? 10.5 : 12,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0
              }}
            >
              <span>Devam Et</span>
              <ArrowRight size={isCompact ? 12 : 14} />
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.42fr) minmax(0, 1fr)',
              alignItems: 'stretch',
              gap: isCompact ? 7 : 9
            }}
          >
            {/* Primary Button: Serbest Antrenman */}
            <button
              type="button"
              onClick={handleStartBlankWorkout}
              style={{
                minWidth: 0,
                minHeight: isCompact ? 44 : 54,
                padding: isCompact ? '7px 9px' : '9px 11px',
                borderRadius: isCompact ? 13 : 16,
                background: 'linear-gradient(135deg, #ff6b35 0%, #f97316 55%, #ea580c 100%)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: isCompact ? 7 : 9,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(249, 115, 22, 0.38)',
                textAlign: 'left',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: isCompact ? 28 : 32,
                  height: isCompact ? 28 : 32,
                  borderRadius: isCompact ? 8 : 10,
                  background: 'rgba(255, 255, 255, 0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Play size={isCompact ? 13 : 15} fill="#ffffff" color="#ffffff" />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: isCompact ? 'clamp(11px, 3.2vw, 12px)' : 'clamp(11.5px, 3.4vw, 13px)',
                    fontWeight: 800,
                    color: '#ffffff',
                    lineHeight: 1.15,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  Serbest Antrenman
                </div>
                <div
                  style={{
                    fontSize: isCompact ? 8.5 : 9.5,
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.88)',
                    marginTop: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  Hemen boş seans başlat
                </div>
              </div>
            </button>

            {/* Secondary Button: Hazır Programlar (Açık Etiketli Kompakt Buton) */}
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsPlannedModalOpen(true);
              }}
              title={`Hazır Programlar (${recommendedSplitMeta.shortTitle})`}
              style={{
                minWidth: 0,
                minHeight: isCompact ? 44 : 54,
                padding: isCompact ? '6px 9px' : '9px 11px',
                borderRadius: isCompact ? 13 : 16,
                background: 'linear-gradient(155deg, rgba(22, 32, 50, 0.96) 0%, rgba(13, 19, 31, 0.98) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.36)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                gap: isCompact ? 6.5 : 8,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.32)',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: isCompact ? 26 : 30,
                  height: isCompact ? 26 : 30,
                  borderRadius: isCompact ? 7.5 : 9.5,
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Layers size={isCompact ? 13 : 15} color="#38bdf8" />
              </div>
              <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: isCompact ? 'clamp(10.5px, 3vw, 11.5px)' : 'clamp(11px, 3.2vw, 12.5px)',
                    fontWeight: 800,
                    color: '#f8fafc',
                    lineHeight: 1.15,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  Programlar
                </div>
                <div
                  style={{
                    fontSize: isCompact ? 8.5 : 9.5,
                    fontWeight: 700,
                    color: '#38bdf8',
                    marginTop: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {recommendedSplitMeta.shortTitle}
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* PLANNED WORKOUT SELECTION OVERLAY                         */}
      {/* ========================================================= */}
      {isPlannedModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => {
            sounds.playPop();
            setIsPlannedModalOpen(false);
          }}
          style={{
            zIndex: 1050,
            padding: '16px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.18s ease-out'
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 440,
              maxHeight: '88vh',
              overflowY: 'auto',
              background: 'linear-gradient(175deg, #141c2c 0%, #0c101a 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 20,
              padding: '18px 16px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65)',
              display: 'flex',
              flexDirection: 'column',
              gap: 13
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8'
                  }}
                >
                  <Layers size={17} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                    Planlı Antrenman
                  </h3>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Bölge seçin ve hazırlanan programı başlatın
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsPlannedModalOpen(false);
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
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

            {/* Split Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 5,
                background: 'rgba(9, 13, 20, 0.85)',
                padding: 4,
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              {splitTabs.map((tab) => {
                const isSelected = selectedSplit === tab.id;
                const isRec = recommendedSplitId === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setSelectedSplit(tab.id);
                    }}
                    style={{
                      minWidth: 0,
                      padding: '8px 4px',
                      borderRadius: 9,
                      border: isSelected ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                      background: isSelected ? 'rgba(56, 189, 248, 0.16)' : 'transparent',
                      color: isSelected ? '#38bdf8' : 'var(--text-muted)',
                      fontSize: 11.5,
                      fontWeight: isSelected ? 800 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3
                    }}
                  >
                    <span>{tab.label}</span>
                    {isRec && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: '#10b981',
                          lineHeight: 1
                        }}
                      >
                        Önerilen
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Split Details Box */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: '13px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <h4 style={{ fontSize: 14.5, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                    {selectedSplitPreview.title}
                  </h4>
                  {recommendedSplitId === selectedSplit && (
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        color: '#10b981',
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        padding: '1px 6px',
                        borderRadius: 6
                      }}
                    >
                      Önerilen
                    </span>
                  )}
                </div>

                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', flexShrink: 0 }}>
                  {selectedSplitPreview.exercises.length} hareket
                </span>
              </div>

              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {selectedSplitPreview.subtitle}
              </div>

              {/* Exercises List */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  maxHeight: 210,
                  overflowY: 'auto',
                  paddingRight: 2
                }}
              >
                {selectedSplitPreview.exercises.map((item, idx) => {
                  const isDur = isDurationExercise(item.exercise);
                  const val = item.suggestedWeight || item.lastWeight || 0;
                  return (
                    <div
                      key={item.exercise.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.035)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: 9,
                        padding: '7px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 12
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, width: 14 }}>
                          {idx + 1}
                        </span>
                        <span style={{ color: '#f1f5f9', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cleanExName(item.exercise.name)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {val > 0 && (
                          <span style={{ color: selectedSplitPreview.accent, fontWeight: 700, fontSize: 11.5 }}>
                            {val}{isDur ? 'sn' : 'kg'}
                          </span>
                        )}
                        <span style={{ color: 'var(--text-dim)', fontSize: 10.5 }}>
                          3 set
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Start Button */}
              <button
                type="button"
                onClick={() => {
                  setIsPlannedModalOpen(false);
                  handleQuickStartSplit(selectedSplit);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 13.5,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(14, 165, 233, 0.3)',
                  marginTop: 2
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Play size={15} fill="#ffffff" />
                  <span>Programı Başlat ({selectedSplitPreview.exercises.length} Hareket)</span>
                </div>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Quick Repeat Past Workout in Overlay */}
            {latestWorkout && latestWorkoutSummary && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 12,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Son Seans: <strong style={{ color: '#e2e8f0' }}>{latestWorkout.type}</strong>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                    {latestWorkoutSummary.timeString} · {latestWorkout.exercises.length} hareket
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsPlannedModalOpen(false);
                    handleRepeatPastWorkout(latestWorkout);
                  }}
                  style={{
                    padding: '6px 11px',
                    borderRadius: 8,
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <RotateCcw size={12} />
                  <span>Son Seansı Tekrarla</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Direct Workout Detail Modal right from Home View */}
      <WorkoutDetailModal
        workout={currentInspectingWorkout}
        isOpen={Boolean(currentInspectingWorkout)}
        onClose={() => setInspectingWorkout(null)}
        onEdit={(target) => {
          setInspectingWorkout(null);
          setEditingWorkout(target);
        }}
      />

      {/* Direct Edit Workout Modal right from Home View */}
      <EditWorkoutModal
        workout={editingWorkout}
        isOpen={Boolean(editingWorkout)}
        onClose={() => setEditingWorkout(null)}
      />
    </div>
  );
};
