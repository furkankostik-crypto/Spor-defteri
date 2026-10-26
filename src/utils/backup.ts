import { Workout, ExerciseDefinition } from '../types/workout';
import { mergeWorkoutsByDate } from './workoutMerge';
import { getTodayLocalDate } from './dateUtils';
import { isDurationExercise, isSetValid, getSetDurationSeconds, calculateSetEXP } from './calculations';
import { nativeBridge } from './nativeBridge';

export interface BackupData {
  version: string;
  exportedAt: string;
  workouts: Workout[];
  customExercises?: ExerciseDefinition[];
}

/**
 * Exports or shares data as a JSON file (uses Native Share Sheet on Android/iOS APK)
 */
export async function exportToJSON(workouts: Workout[], customExercises: ExerciseDefinition[] = []): Promise<boolean> {
  const data: BackupData = {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    workouts,
    customExercises
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const filename = `gympad-yedek-${getTodayLocalDate()}.json`;
  return nativeBridge.exportOrShareFile(
    filename,
    jsonStr,
    'application/json',
    'GymPad JSON Yedeği'
  );
}

/**
 * Exports or shares workouts as a formatted CSV spreadsheet (uses Native Share Sheet on Android/iOS APK)
 */
export async function exportToCSV(workouts: Workout[]): Promise<boolean> {
  const headers = ['Tarih', 'Bölge', 'Egzersiz', 'Set Numarası', 'Ağırlık (kg)', 'Tekrar / Süre (sn)', 'EXP'];
  const rows: string[][] = [headers];

  workouts.forEach((w) => {
    w.exercises.forEach((ex) => {
      const isDuration = isDurationExercise(ex.id);
      if (ex.detailedSets && ex.detailedSets.length > 0) {
        ex.detailedSets.forEach((set, idx) => {
          if (isSetValid(set, isDuration)) {
            const secsOrReps = isDuration ? getSetDurationSeconds(set, true) : (set.reps || 5);
            const wgt = isDuration ? 0 : set.weight;
            rows.push([
              w.date,
              w.type,
              `"${ex.name.replace(/"/g, '""')}"`,
              String(idx + 1),
              String(wgt),
              isDuration ? `${secsOrReps} sn` : String(secsOrReps),
              String(calculateSetEXP(wgt, secsOrReps, isDuration))
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
              isDuration ? '0' : String(wgt),
              isDuration ? `${wgt} sn` : '5',
              String(calculateSetEXP(isDuration ? 0 : wgt, isDuration ? wgt : 5, isDuration))
            ]);
          }
        });
      }
    });
  });

  const csvContent = '\uFEFF' + rows.map(r => r.join(';')).join('\n');
  const filename = `gympad-antrenmanlar-${getTodayLocalDate()}.csv`;
  return nativeBridge.exportOrShareFile(
    filename,
    csvContent,
    'text/csv;charset=utf-8;',
    'GymPad Excel (CSV) Tablosu'
  );
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
            date: item.date || getTodayLocalDate(),
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
