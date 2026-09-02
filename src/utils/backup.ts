import { Workout, ExerciseDefinition } from '../types/workout';
import { mergeWorkoutsByDate } from './workoutMerge';

export interface BackupData {
  version: string;
  exportedAt: string;
  workouts: Workout[];
  customExercises?: ExerciseDefinition[];
}

/**
 * Downloads data as a JSON file
 */
export function exportToJSON(workouts: Workout[], customExercises: ExerciseDefinition[] = []) {
  const data: BackupData = {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    workouts,
    customExercises
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spor-defterim-yedek-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads workouts as a formatted CSV spreadsheet
 */
export function exportToCSV(workouts: Workout[]) {
  const headers = ['Tarih', 'Bölge', 'Egzersiz', 'Set Numarası', 'Ağırlık (kg)', 'Tekrar', 'EXP'];
  const rows: string[][] = [headers];

  workouts.forEach((w) => {
    w.exercises.forEach((ex) => {
      if (ex.detailedSets && ex.detailedSets.length > 0) {
        ex.detailedSets.forEach((set, idx) => {
          if (set.weight > 0) {
            rows.push([
              w.date,
              w.type,
              `"${ex.name.replace(/"/g, '""')}"`,
              String(idx + 1),
              String(set.weight),
              String(set.reps || 5),
              String(Math.round(set.weight * (set.reps || 5)))
            ]);
          }
        });
      } else if (ex.sets) {
        ex.sets.forEach((wgt, idx) => {
          if (wgt > 0) {
            rows.push([
              w.date,
              w.type,
              `"${ex.name.replace(/"/g, '""')}"`,
              String(idx + 1),
              String(wgt),
              '5',
              String(Math.round(wgt * 5))
            ]);
          }
        });
      }
    });
  });

  const csvContent = '\uFEFF' + rows.map(r => r.join(';')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spor-defterim-antrenmanlar-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports and parses a JSON backup file
 */
export function parseImportJSON(file: File): Promise<{ workouts: Workout[]; customExercises: ExerciseDefinition[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        let importedWorkouts: Workout[] = [];
        let importedCustom: ExerciseDefinition[] = [];

        if (Array.isArray(parsed)) {
          // Old array of workouts from legacy deneme6
          importedWorkouts = parsed.map((item, i) => ({
            id: item.id || `imported-${Date.now()}-${i}`,
            date: item.date || new Date().toISOString().slice(0, 10),
            type: item.type || 'Antrenman',
            exercises: item.exercises || [],
            createdAt: item.createdAt || Date.now() - i * 1000
          }));
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.workouts)) {
            importedWorkouts = parsed.workouts;
          }
          if (Array.isArray(parsed.customExercises)) {
            importedCustom = parsed.customExercises;
          }
        }

        resolve({ workouts: mergeWorkoutsByDate(importedWorkouts), customExercises: importedCustom });
      } catch (err) {
        reject(new Error('Geçersiz JSON dosyası formatı.'));
      }
    };
    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.readAsText(file);
  });
}
