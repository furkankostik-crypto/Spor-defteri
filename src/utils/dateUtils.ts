import { Workout } from '../types/workout';

export const TURKISH_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export const TURKISH_MONTHS_SHORT = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
];

/**
 * Returns today's date in local time YYYY-MM-DD format (no UTC day-shift bugs)
 */
export function getTodayLocalDate(): string {
  const d = new Date();
  return formatDateISO(d);
}

/**
 * Converts a Date object to YYYY-MM-DD local format
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses YYYY-MM-DD string into a safe local Date object
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/**
 * Shifts a YYYY-MM-DD date by N days (+/-)
 */
export function shiftDateByDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateISO(d);
}

/**
 * Shifts a year/month combination by N months (+/-)
 */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  let totalMonths = year * 12 + (month - 1) + delta;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  return { year: newYear, month: newMonth };
}

/**
 * Computes Monday (start) and Sunday (end) for the week containing dateStr
 */
export function getWeekBounds(dateStr: string): { start: string; end: string } {
  const d = parseLocalDate(dateStr);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: formatDateISO(monday),
    end: formatDateISO(sunday)
  };
}

/**
 * Formats a week range into a friendly Turkish string
 * e.g. "31 Ağu – 6 Eyl 2026" or "1 – 7 Eyl 2026"
 */
export function formatWeekRangeDisplay(startStr: string, endStr: string): string {
  if (!startStr || !endStr) return '';
  const d1 = parseLocalDate(startStr);
  const d2 = parseLocalDate(endStr);

  const day1 = d1.getDate();
  const day2 = d2.getDate();
  const m1 = TURKISH_MONTHS_SHORT[d1.getMonth()];
  const m2 = TURKISH_MONTHS_SHORT[d2.getMonth()];
  const y1 = d1.getFullYear();
  const y2 = d2.getFullYear();

  if (y1 === y2) {
    if (m1 === m2) {
      return `${day1} – ${day2} ${m1} ${y1}`;
    }
    return `${day1} ${m1} – ${day2} ${m2} ${y1}`;
  }
  return `${day1} ${m1} ${y1} – ${day2} ${m2} ${y2}`;
}

/**
 * Extracts distinct years present in workouts (descending)
 */
export function getAvailableYears(workouts: Workout[]): number[] {
  const currentYear = new Date().getFullYear();
  const yearSet = new Set<number>();
  yearSet.add(currentYear);

  if (workouts && workouts.length > 0) {
    workouts.forEach((w) => {
      if (w.date && w.date.length >= 4) {
        const y = parseInt(w.date.slice(0, 4), 10);
        if (!isNaN(y)) {
          yearSet.add(y);
        }
      }
    });
  }

  return Array.from(yearSet).sort((a, b) => b - a);
}

/**
 * Formats YYYY-MM-DD to localized Turkish string
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Calculate active workout streak (in days)
 */
export function calculateStreak(workouts: Workout[]): number {
  if (!workouts || workouts.length === 0) return 0;

  // Get unique sorted dates in descending order
  const uniqueDates = Array.from(new Set(workouts.map(w => w.date))).sort().reverse();
  if (uniqueDates.length === 0) return 0;

  const today = getTodayLocalDate();
  
  // Calculate yesterday's date
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = formatDateISO(yesterdayDate);

  let streak = 0;
  let expectedDate = uniqueDates[0] === today ? today : (uniqueDates[0] === yesterday ? yesterday : null);

  if (!expectedDate) return 0;

  const cur = parseLocalDate(expectedDate);
  for (const dateStr of uniqueDates) {
    const checkDateStr = formatDateISO(cur);
    if (dateStr === checkDateStr) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
