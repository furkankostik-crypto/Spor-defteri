import { 
  Workout, 
  ExerciseDefinition, 
  AthleteProfile 
} from '../types/workout';
import { 
  calculateOverallGymLevels, 
  calculateWeeklyVolumeLandmarks, 
  getExerciseStrengthAnalysis, 
  detectExercisePlateau 
} from '../utils/scientificCalculations';
import { getSuggestedNextWorkout } from '../utils/recommendationEngine';

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * Builds sports science context prompt from athlete's actual logged data
 */
export function buildAthleteContextPrompt(
  profile: AthleteProfile,
  workouts: Workout[],
  allExercises: ExerciseDefinition[]
): string {
  const gymLevels = calculateOverallGymLevels(workouts, allExercises, profile);
  const volumeLandmarks = calculateWeeklyVolumeLandmarks(workouts, allExercises);
  const nextWorkout = getSuggestedNextWorkout(workouts);

  // Collect key compound 1RMs
  const keyLiftIds = ['bench', 'squat', 'deadlift', 'shoulder_press', 'latpull', 'row'];
  const keyLifts = keyLiftIds.map((id) => {
    const ex = allExercises.find((e) => e.id === id);
    if (!ex) return null;
    const analysis = getExerciseStrengthAnalysis(ex, workouts, profile);
    const plateau = detectExercisePlateau(id, workouts);
    return {
      name: ex.name,
      estimated1RM: analysis.estimated1RM,
      ratio: analysis.bodyweightRatio,
      tier: analysis.tierTitle,
      score: analysis.strengthScore,
      isPlateau: plateau.isPlateau
    };
  }).filter(Boolean);

  const underVolumeMuscles = volumeLandmarks.filter(v => v.landmark === 'under_mev').map(v => v.muscleName);
  const optimalVolumeMuscles = volumeLandmarks.filter(v => v.landmark === 'mav').map(v => v.muscleName);
  const highVolumeMuscles = volumeLandmarks.filter(v => v.landmark === 'mrv_risk').map(v => v.muscleName);

  return `
[SPORCU PROFİLİ & BİLİMSEL VERİLER]
- Cinsiyet: ${profile.gender === 'female' ? 'Kadın' : 'Erkek'}
- Vücut Ağırlığı: ${profile.bodyWeightKg} kg
- Yaş: ${profile.age || 'Belirtilmemiş'}
- Genel Güç Skoru (GymLevels): ${gymLevels.overallStrengthScore} / 100 (${gymLevels.overallTierTitle})
- Toplam Kayıtlı İdman: ${workouts.length}

[TEMEL KALDIRIŞLAR VE 1RM DEĞERLERİ]
${keyLifts.map(l => `- ${l?.name}: 1RM ~${l?.estimated1RM} kg (${l?.ratio}x Vücut Ağırlığı) -> Kategori: ${l?.tier} (Skor: ${l?.score}/100)${l?.isPlateau ? ' [⚠️ DİKKAT: PLATO TESPİT EDİLDİ]' : ''}`).join('\n')}

[HAFTALIK HİPERTROFİ HACİM DURUMU (RP LANDMARKS)]
- Optimal Gelişim Aralığında (MAV 12-20 set): ${optimalVolumeMuscles.join(', ') || 'Yok'}
- Yetersiz Hacimde (< MEV 8 set altı): ${underVolumeMuscles.join(', ') || 'Yok'}
- Aşırı Yıpranma / Yüksek Hacim (> MRV): ${highVolumeMuscles.join(', ') || 'Yok'}

[SONRAKİ ANTRENMAN ÖNERİSİ]
- Önerilen Split: ${nextWorkout.splitTitle}
- Gerekçe: ${nextWorkout.reason}
- En Çok Dinlenmiş Kaslar: ${nextWorkout.priorityMuscles.map(m => `${m.muscleName} (${m.daysSinceTrained} gün önce)`).join(', ')}
`.trim();
}

/**
 * Offline rule-based expert coach response generator
 */
export function generateOfflineCoachResponse(
  userQuery: string,
  profile: AthleteProfile,
  workouts: Workout[],
  allExercises: ExerciseDefinition[]
): string {
  const query = userQuery.toLowerCase();
  const gymLevels = calculateOverallGymLevels(workouts, allExercises, profile);
  const nextWorkout = getSuggestedNextWorkout(workouts);
  const volumeLandmarks = calculateWeeklyVolumeLandmarks(workouts, allExercises);

  if (query.includes('analiz') || query.includes('gelişim') || query.includes('durum')) {
    const optimal = volumeLandmarks.filter(v => v.landmark === 'mav').map(v => v.muscleName);
    const needAttention = volumeLandmarks.filter(v => v.landmark === 'under_mev' && v.weeklySets > 0).map(v => v.muscleName);

    return `### 📊 Bilimsel Gelişim Analiziniz

**Kuvvet Seviyeniz (GymLevels):**
- **Genel Güç Skoru:** **${gymLevels.overallStrengthScore} / 100** (${gymLevels.overallTierTitle} Seviye)
- **Vücut Ağırlığı Oranı:** Kilonuz (${profile.bodyWeightKg} kg) baz alındığında kaldırışlarınız dengeli bir gelişim sergiliyor.
${gymLevels.strongestLift ? `- 🏆 **En Güçlü Hareket:** ${gymLevels.strongestLift.exerciseName} (1RM: ${gymLevels.strongestLift.estimated1RM} kg, ${gymLevels.strongestLift.bodyweightRatio}x BW)` : ''}
${gymLevels.needsWorkLift ? `- 🎯 **Geliştirilmesi Gereken:** ${gymLevels.needsWorkLift.exerciseName} (${gymLevels.needsWorkLift.tierTitle})` : ''}

**Haftalık Hipertrofi Hacim Durumu (RP):**
${optimal.length > 0 ? `- 🟢 **Optimal Gelişim (MAV):** ${optimal.join(', ')}` : '- Düzenli antrenmanla altın hacim aralığına ulaşabilirsiniz.'}
${needAttention.length > 0 ? `- ⚠️ **Hacim Artırılmalı (< MEV):** ${needAttention.join(', ')}` : ''}
Haftalık set sayılarınızı 10-18 set (MAV) bandında tutmak hipertrofiyi maksimize edecektir.`;
  }

  if (query.includes('plato') || query.includes('takıldım') || query.includes('artmıyor') || query.includes('ağırlık')) {
    return `### ⚡ Plato Kırma ve Aşırı Yükleme Protokolü

Bir egzersizde 3 antrenmandan uzun süredir ağırlık veya tekrar artıramıyorsanız, sinir sistemi yorgunluğu (CNS fatigue) veya aşırı adaptasyon gerçekleşmiş olabilir.

**Bilimsel Çözüm Adımları:**
1. **%10 Deload:** Ağırlığı bir sonraki seansta %10 düşürün, ancak hareketi 3 saniye negatif (eksantrik) ve patlayıcı pozitif tempo ile yapın.
2. **Tekrar Aralığı Dönüşümü:** Örneğin 5 tekrar güç çalışıyorsanız, 2 hafta boyunca 8-10 tekrar hipertrofi aralığına geçin.
3. **Dinlenme Süresi:** Set aralarını kronometre ile en az **2.5 - 3 dakikaya** çıkarın. ATP-CP depolarının %95'i ancak 3 dakikada yenilenir.
4. **Varyasyon Şoku:** Barbell yerine Dumbbell varyasyonunu veya farklı bir tutuş açısını deneyin.`;
  }

  if (query.includes('sonraki') || query.includes('bugün') || query.includes('program') || query.includes('idman')) {
    return `### 💡 Önerilen Sıradaki Antrenman: **${nextWorkout.splitTitle}**

**Fizyolojik Gerekçe:**
${nextWorkout.reason}

**Öncelikli Kas Grupları (Dinlenmiş & Hazır):**
${nextWorkout.priorityMuscles.map(m => `- **${m.muscleName}**: ${m.daysSinceTrained} gündür dinleniyor (${m.recoveryStatus === 'fresh' ? '🟢 Tamamen taze' : '🔵 Toparlandı'})`).join('\n')}

**Öneri:** Antrenmana en çok dinlenmiş kas grubunun bileşke (compound) hareketiyle başlayın ve 3-4 çalışma seti hedefleyin.`;
  }

  if (query.includes('beslenme') || query.includes('protein') || query.includes('kilo') || query.includes('kalori')) {
    const minProtein = Math.round(profile.bodyWeightKg * 1.6);
    const optProtein = Math.round(profile.bodyWeightKg * 2.2);
    const water = (profile.bodyWeightKg * 0.04).toFixed(1);

    return `### 🥗 Bilimsel Beslenme & Toparlanma Rehberi

Vücut ağırlığınız **${profile.bodyWeightKg} kg** baz alınarak hesaplanan sporcu değerleri:

- **Günlük Protein Eşiği:** **${minProtein}g - ${optProtein}g** (Kas protein sentezini [MPS] maksimize etmek için öğün başına 30-40g kaliteli protein).
- **Su İhtiyacı:** Minimum **${water} Litre/gün**. Dehidrasyon güç çıktısını %15'e kadar düşürür.
- **Kreatin:** Günde 3-5g Kreatin Monohidrat hücre içi ATP üretimini ve 1RM gücünü artırır.
- **Uyku:** Derin uyku fazında büyüme hormonu (GH) salgılanır, minimum 7.5 - 8 saat hedefleyin.`;
  }

  // General response
  return `### 🤖 Bilimsel Antrenör Yanıtı

Sorunuz: *"Save ve analiz önerileri"*

Spor biliminde sürdürülebilir kas inşası 3 temel sütuna dayanır:
1. **Mekanik Gerilim (Progressive Overload):** Her antrenmanda ağırlık veya tekrar hacmini kademeli artırmak.
2. **Yeterli Hacim (Weekly Volume):** Kas başına haftalık 10-20 çalışma seti.
3. **Sistemik Toparlanma:** 48-72 saat kas dinlenme süresi.

*İpucu: Özel analiz almak için "Plato kırma planı", "Gelişimimi analiz et" veya "Sonraki antrenmanım ne olmalı?" butonlarını kullanabilirsiniz.*`;
}

/**
 * Sends prompt to Gemini API if key exists, otherwise falls back to offline coach
 */
export async function askAICoach(
  userQuery: string,
  profile: AthleteProfile,
  workouts: Workout[],
  allExercises: ExerciseDefinition[]
): Promise<string> {
  const apiKey = profile.geminiApiKey?.trim();

  // If no API key is provided, use offline scientific engine
  if (!apiKey) {
    return generateOfflineCoachResponse(userQuery, profile, workouts, allExercises);
  }

  try {
    const athleteContext = buildAthleteContextPrompt(profile, workouts, allExercises);
    const systemInstruction = `
Sen "Spor Defteri" uygulamasının elit düzeydeki Bilimsel Güç & Hipertrofi Antrenörüsün (CSCS / Spor Bilimcisi).
Kullanıcının gerçek antrenman kayıtları, 1RM değerleri, vücut ağırlığı ve GymLevels verileri sana verilmiştir.

Görevlerin:
1. Kullanıcıya spor bilimi (Epley, Mike Israetel RP landmarks, Brad Schoenfeld araştırmaları) ışığında net, uygulanabilir, motive edici ve doğrudan tavsiyeler vermek.
2. Kullanıcının kilo ve 1RM verilerine sadık kalmak.
3. Cevaplarını anlaşılır Markdown formatında başlıklar, maddeler ve net rakamlarla sunmak.
4. Gereksiz laf kalabalığı yapmadan doğrudan hedefe yönelik olmak.
5. Türkçe konuşmak.
`.trim();

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemInstruction}\n\n${athleteContext}\n\n[KULLANICI SORUSU]:\n${userQuery}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      console.warn('Gemini API error, falling back to offline coach:', response.status);
      return generateOfflineCoachResponse(userQuery, profile, workouts, allExercises);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (candidateText) {
      return candidateText;
    }

    return generateOfflineCoachResponse(userQuery, profile, workouts, allExercises);
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return generateOfflineCoachResponse(userQuery, profile, workouts, allExercises);
  }
}
