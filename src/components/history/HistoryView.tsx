import React, { useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { Workout } from '../../types/workout';
import { HistoryCard } from './HistoryCard';
import { EditWorkoutModal } from './EditWorkoutModal';
import { TimeFilterSelector, TimeFilterState } from '../workout/TimeFilterSelector';
import { HeaderBurgerMenu } from '../layout/HeaderBurgerMenu';
import { getTodayLocalDate, getWeekBounds } from '../../utils/dateUtils';
import { sounds } from '../../utils/audio';
import { 
  History as HistoryIcon, 
  Plus, 
  Sparkles, 
  RotateCcw
} from 'lucide-react';

export const HistoryView: React.FC = () => {
  const { 
    workouts, 
    populateSampleData, 
    setIsLoggingWorkout, 
    setActiveTab, 
    updateDraftSplit, 
    updateDraftIsManual,
    draft 
  } = useWorkout();

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

  // Filter workouts according to TimeFilter and SplitFilter
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

  const handleStartNewWorkout = () => {
    sounds.playPop();
    updateDraftIsManual(true);
    if (Object.keys(draft.exerciseSets).length === 0) {
      updateDraftSplit('upper');
    }
    setActiveTab('workout');
    setIsLoggingWorkout(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    sounds.playPop();
    setTimeFilter({
      mode: 'all',
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      selectedDate: todayStr,
      weekStart: todayWeek.start,
      weekEnd: todayWeek.end
    });
    setSplitFilter('all');
    setVisibleLimit(30);
  };

  return (
    <div style={{ padding: '16px 16px calc(92px + var(--safe-bottom)) 16px', animation: 'fadeIn 0.2s ease-out' }}>
      {/* Top Banner & Title */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14
        }}
      >
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
            Antrenman Geçmişi
          </h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Toplam {workouts.length} kayıtlı seans • Detayları inceleyin ve düzenleyin
          </div>
        </div>

        {/* Top Right: Burger Menu */}
        <HeaderBurgerMenu />
      </div>

      {/* Time & Split Filter Controls */}
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

      {/* Workouts History List */}
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
                {workouts.length === 0 ? 'Henüz Antrenman Kaydı Yok' : 'Filtreye Uygun Seans Bulunamadı'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                {workouts.length === 0
                  ? 'Tamamladığınız antrenmanları kaydettiğinizde tüm detaylar burada listelenecek.'
                  : 'Seçili tarih veya bölge filtresinde kayıt bulunmuyor. Filtreyi değiştirebilir veya sıfırlayabilirsiniz.'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 280, marginTop: 6 }}>
              {workouts.length > 0 ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn btn-secondary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <RotateCcw size={16} />
                  <span>Filtreleri Sıfırla</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleStartNewWorkout}
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
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button (+ FAB) for Quick Workout Logging */}
      <button
        type="button"
        onClick={handleStartNewWorkout}
        className="fab-btn"
        title="Yeni Antrenman Girişi"
        aria-label="Yeni Antrenman Girişi"
      >
        <Plus size={22} strokeWidth={2.5} />
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
