import React, { useState } from 'react';
import { 
  Calendar, 
  CalendarDays, 
  CalendarRange, 
  Clock,
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  Sparkles,
  CalendarCheck
} from 'lucide-react';
import { 
  TURKISH_MONTHS, 
  TURKISH_MONTHS_SHORT,
  getTodayLocalDate, 
  shiftDateByDays, 
  shiftMonth, 
  getWeekBounds, 
  formatWeekRangeDisplay, 
  formatDisplayDate,
  getAvailableYears
} from '../../utils/dateUtils';
import { Workout } from '../../types/workout';
import { sounds } from '../../utils/audio';

export type TimeFilterMode = 'all' | 'year' | 'month' | 'week' | 'day';

export interface TimeFilterState {
  mode: TimeFilterMode;
  year: number;
  month: number; // 1 - 12
  selectedDate: string; // YYYY-MM-DD
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
}

interface TimeFilterSelectorProps {
  filter: TimeFilterState;
  onChange: (newFilter: TimeFilterState) => void;
  workouts: Workout[];
  matchingCount: number;
}

export const TimeFilterSelector: React.FC<TimeFilterSelectorProps> = ({
  filter,
  onChange,
  workouts,
  matchingCount
}) => {
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const todayStr = getTodayLocalDate();
  const availableYears = getAvailableYears(workouts);

  // Helper to switch mode
  const handleModeChange = (mode: TimeFilterMode) => {
    sounds.playPop();
    setShowMonthPicker(false);
    
    // When switching to week, ensure bounds are correct for selectedDate
    if (mode === 'week') {
      const bounds = getWeekBounds(filter.selectedDate || todayStr);
      onChange({
        ...filter,
        mode,
        weekStart: bounds.start,
        weekEnd: bounds.end
      });
      return;
    }

    onChange({
      ...filter,
      mode
    });
  };

  // Reset to all time
  const handleReset = () => {
    sounds.playPop();
    setShowMonthPicker(false);
    const bounds = getWeekBounds(todayStr);
    const now = new Date();
    onChange({
      mode: 'all',
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      selectedDate: todayStr,
      weekStart: bounds.start,
      weekEnd: bounds.end
    });
  };

  // Year navigation
  const handlePrevYear = () => {
    sounds.playPop();
    onChange({ ...filter, year: filter.year - 1 });
  };
  const handleNextYear = () => {
    sounds.playPop();
    onChange({ ...filter, year: filter.year + 1 });
  };
  const handleSelectYear = (y: number) => {
    sounds.playPop();
    onChange({ ...filter, year: y });
  };

  // Month navigation
  const handlePrevMonth = () => {
    sounds.playPop();
    const shifted = shiftMonth(filter.year, filter.month, -1);
    onChange({ ...filter, year: shifted.year, month: shifted.month });
  };
  const handleNextMonth = () => {
    sounds.playPop();
    const shifted = shiftMonth(filter.year, filter.month, 1);
    onChange({ ...filter, year: shifted.year, month: shifted.month });
  };
  const handleSelectMonth = (mIndex: number) => {
    sounds.playPop();
    onChange({ ...filter, month: mIndex + 1 });
    setShowMonthPicker(false);
  };

  // Week navigation
  const handlePrevWeek = () => {
    sounds.playPop();
    const newStart = shiftDateByDays(filter.weekStart, -7);
    const newEnd = shiftDateByDays(filter.weekEnd, -7);
    onChange({ ...filter, weekStart: newStart, weekEnd: newEnd, selectedDate: newStart });
  };
  const handleNextWeek = () => {
    sounds.playPop();
    const newStart = shiftDateByDays(filter.weekStart, 7);
    const newEnd = shiftDateByDays(filter.weekEnd, 7);
    onChange({ ...filter, weekStart: newStart, weekEnd: newEnd, selectedDate: newStart });
  };
  const handleThisWeek = () => {
    sounds.playPop();
    const bounds = getWeekBounds(todayStr);
    onChange({ ...filter, weekStart: bounds.start, weekEnd: bounds.end, selectedDate: todayStr });
  };

  // Day navigation
  const handlePrevDay = () => {
    sounds.playPop();
    const prev = shiftDateByDays(filter.selectedDate, -1);
    onChange({ ...filter, selectedDate: prev });
  };
  const handleNextDay = () => {
    sounds.playPop();
    const next = shiftDateByDays(filter.selectedDate, 1);
    onChange({ ...filter, selectedDate: next });
  };
  const handleToday = () => {
    sounds.playPop();
    const now = new Date();
    const bounds = getWeekBounds(todayStr);
    onChange({ 
      ...filter, 
      selectedDate: todayStr, 
      year: now.getFullYear(), 
      month: now.getMonth() + 1,
      weekStart: bounds.start,
      weekEnd: bounds.end
    });
  };

  // Check if current week includes today
  const isCurrentWeek = todayStr >= filter.weekStart && todayStr <= filter.weekEnd;
  const isTodaySelected = filter.selectedDate === todayStr;

  return (
    <div 
      className="card"
      style={{
        padding: '12px 14px',
        marginBottom: 14,
        background: 'linear-gradient(135deg, rgba(18, 24, 38, 0.95), rgba(12, 17, 28, 0.98))',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
      }}
    >
      {/* Mode Switcher Tabs */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 4,
          background: 'rgba(15, 23, 42, 0.85)',
          padding: 3,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          marginBottom: 10
        }}
      >
        {[
          { id: 'all', label: 'Tümü', icon: Clock },
          { id: 'year', label: 'Yıl', icon: Calendar },
          { id: 'month', label: 'Ay', icon: CalendarDays },
          { id: 'week', label: 'Hafta', icon: CalendarRange },
          { id: 'day', label: 'Gün', icon: CalendarCheck }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = filter.mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleModeChange(item.id as TimeFilterMode)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                padding: '6px 4px',
                borderRadius: 'var(--radius-sm)',
                border: isActive ? '1px solid var(--accent)' : '1px solid transparent',
                background: isActive 
                  ? 'linear-gradient(135deg, var(--accent), #e11d48)' 
                  : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isActive ? '0 2px 8px rgba(255, 71, 87, 0.35)' : 'none'
              }}
            >
              <Icon size={12} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contextual Time Control Sub-Bar */}
      {filter.mode !== 'all' && (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          {/* YEAR SELECTOR */}
          {filter.mode === 'year' && (
            <div>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 8px'
                }}
              >
                <button
                  type="button"
                  onClick={handlePrevYear}
                  className="btn-icon"
                  style={{ width: 30, height: 30 }}
                  title="Önceki Yıl"
                >
                  <ChevronLeft size={16} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={15} color="var(--accent)" />
                  <span style={{ fontSize: 15, fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
                    {filter.year} Yılı
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleNextYear}
                  className="btn-icon"
                  style={{ width: 30, height: 30 }}
                  title="Sonraki Yıl"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Quick Year Chips */}
              {availableYears.length > 1 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto', paddingBottom: 2 }}>
                  {availableYears.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => handleSelectYear(y)}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        border: filter.year === y ? '1px solid var(--accent)' : '1px solid var(--border)',
                        background: filter.year === y ? 'var(--accent-soft)' : 'var(--input-bg)',
                        color: filter.year === y ? 'var(--accent)' : 'var(--text-muted)',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MONTH SELECTOR */}
          {filter.mode === 'month' && (
            <div>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 8px'
                }}
              >
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="btn-icon"
                  style={{ width: 30, height: 30 }}
                  title="Önceki Ay"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setShowMonthPicker(!showMonthPicker);
                  }}
                  style={{
                    background: showMonthPicker ? 'var(--accent-soft)' : 'transparent',
                    border: showMonthPicker ? '1px solid var(--accent)' : '1px solid transparent',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    color: '#ffffff'
                  }}
                >
                  <CalendarDays size={15} color="var(--accent)" />
                  <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.01em' }}>
                    {TURKISH_MONTHS[filter.month - 1]} {filter.year}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                    {showMonthPicker ? '▲' : '▼'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="btn-icon"
                  style={{ width: 30, height: 30 }}
                  title="Sonraki Ay"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* 12-Month Quick Grid Picker */}
              {showMonthPicker && (
                <div 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 6,
                    marginTop: 8,
                    padding: 8,
                    background: 'rgba(15, 23, 42, 0.95)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    animation: 'fadeIn 0.15s ease-out'
                  }}
                >
                  {TURKISH_MONTHS_SHORT.map((mShort, idx) => {
                    const isSelected = filter.month === idx + 1;
                    return (
                      <button
                        key={mShort}
                        type="button"
                        onClick={() => handleSelectMonth(idx)}
                        style={{
                          padding: '6px 2px',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '1px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.05)',
                          background: isSelected ? 'var(--accent)' : 'rgba(255, 255, 255, 0.03)',
                          color: isSelected ? '#ffffff' : 'var(--text-muted)',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {mShort}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* WEEK SELECTOR */}
          {filter.mode === 'week' && (
            <div>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 8px'
                }}
              >
                <button
                  type="button"
                  onClick={handlePrevWeek}
                  className="btn-icon"
                  style={{ width: 30, height: 30 }}
                  title="Önceki Hafta"
                >
                  <ChevronLeft size={16} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, textAlign: 'center' }}>
                  <CalendarRange size={15} color="var(--accent)" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>
                    {formatWeekRangeDisplay(filter.weekStart, filter.weekEnd)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleNextWeek}
                  className="btn-icon"
                  style={{ width: 30, height: 30 }}
                  title="Sonraki Hafta"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Quick This Week Jump */}
              {!isCurrentWeek && (
                <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={handleThisWeek}
                    style={{
                      padding: '3px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      background: 'rgba(56, 189, 248, 0.12)',
                      color: 'var(--cyan)',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Sparkles size={11} />
                    <span>Bu Haftaya Dön</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* DAY SELECTOR */}
          {filter.mode === 'day' && (
            <div>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 8px'
                }}
              >
                <button
                  type="button"
                  onClick={handlePrevDay}
                  className="btn-icon"
                  style={{ width: 30, height: 30 }}
                  title="Önceki Gün"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Date input disguised as styled date label */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CalendarCheck size={15} color="var(--accent)" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>
                    {formatDisplayDate(filter.selectedDate)}
                  </span>
                  <input
                    type="date"
                    value={filter.selectedDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        sounds.playPop();
                        const newD = new Date(e.target.value);
                        onChange({ 
                          ...filter, 
                          selectedDate: e.target.value,
                          year: newD.getFullYear(),
                          month: newD.getMonth() + 1
                        });
                      }
                    }}
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      left: 0,
                      top: 0,
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer'
                    }}
                    title="Takvimden Tarih Seç"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNextDay}
                  className="btn-icon"
                  style={{ width: 30, height: 30 }}
                  title="Sonraki Gün"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Quick Today Jump */}
              {!isTodaySelected && (
                <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={handleToday}
                    style={{
                      padding: '3px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: 'var(--muscle-emerald)',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Sparkles size={11} />
                    <span>Bugüne Dön</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary and Reset Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: filter.mode === 'all' ? 4 : 10,
          paddingTop: 6,
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: 11
        }}
      >
        <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span 
            style={{ 
              fontWeight: 700, 
              color: matchingCount > 0 ? '#ffffff' : 'var(--accent)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            {matchingCount > 0 ? (
              <>
                <span 
                  style={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    background: 'var(--muscle-emerald)',
                    boxShadow: '0 0 6px var(--muscle-emerald)'
                  }} 
                />
                {matchingCount} Antrenman Bulundu
              </>
            ) : (
              <>
                <span 
                  style={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    background: 'var(--accent)' 
                  }} 
                />
                Bu zaman diliminde kayıt yok
              </>
            )}
          </span>
        </div>

        {filter.mode !== 'all' && (
          <button
            type="button"
            onClick={handleReset}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.2s'
            }}
          >
            <RotateCcw size={11} />
            <span>Filtreyi Sıfırla</span>
          </button>
        )}
      </div>
    </div>
  );
};
