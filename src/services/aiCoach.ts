import { 
  Workout, 
  ExerciseDefinition, 
  AthleteProfile,
  MuscleGroup
} from '../types/workout';
import { 
  calculateOverallGymLevels, 
  calculateWeeklyVolumeLandmarks, 
  getExerciseStrengthAnalysis, 
  detectExercisePlateau,
  getBest1RMForExercise 
} from '../utils/scientificCalculations';
import { 
  getSuggestedNextWorkout, 
  getExerciseOverloadSuggestion 
} from '../utils/recommendationEngine';
import { muscleMetadata } from '../data/muscleMetadata';

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * Normalizes Turkish text for fuzzy keyword matching:
 * Converts to lowercase, handles dotted/dotless I, strips accents and non-alphanumeric chars.
 */
export function normalizeTurkish(text: string): string {
  return text
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
- Antrenman Hedefi: ${profile.trainingGoal === 'strength' ? 'Maksimal Güç' : profile.trainingGoal === 'endurance' ? 'Dayanıklılık' : 'Hipertrofi (Kas İnşası)'}
- Genel Güç Skoru (GymLevels): ${gymLevels.overallStrengthScore} / 100 (${gymLevels.overallTierTitle})
- Toplam Kayıtlı İdman: ${workouts.length}

[TEMEL KALDIRIŞLAR VE 1RM DEĞERLERİ]
${keyLifts.map(l => `- ${l?.name}: 1RM ~${l?.estimated1RM} kg (${l?.ratio}x Vücut Ağırlığı) -> Kategori: ${l?.tier} (Skor: ${l?.score}/100)${l?.isPlateau ? ' [⚠️ DİKKAT: PLATO TESPİT EDİLDİ]' : ''}`).join('\n')}

[HAFTALIK HİPERTROFİ HACİM DURUMU (RP LANDMARKS)]
- Optimal Gelişim Aralığında (MAV 12-20 set): ${optimalVolumeMuscles.join(', ') || 'Yok'}
- Yetersiz Hacimde (< MEV 8 set altı): ${underVolumeMuscles.join(', ') || 'Yok'}
- Aşırı Yıpranma / Yüksek Hacim (> MRV): ${highVolumeMuscles.join(', ') || 'Yok'}

[GÜNLÜK ANTRENÖR / PT DURUMU]
- Bugün Antrenman Yapıldı mı: ${nextWorkout.isTodayCompleted ? `EVET (Bugün tamamlanan: ${nextWorkout.todayWorkoutSummary?.splitName}, ${nextWorkout.todayWorkoutSummary?.totalSets} Set, ${nextWorkout.todayWorkoutSummary?.totalVolumeKg} kg Hacim)` : 'HAYIR (Bugün henüz idman girilmedi)'}
- PT Durumu: ${nextWorkout.ptGuidance?.state || 'workout_ready'}
- Sonraki Seans Hedefi: ${nextWorkout.ptGuidance?.nextSessionTarget || nextWorkout.splitTitle} (${nextWorkout.ptGuidance?.nextSessionTiming || 'Yakında'})
- ÖNEMLİ KURAL: Sporcu bugün antrenmanını tamamlamışsa onu kutla ve bugünkü toparlanmaya (protein sentezi, su, uyku) odaklanmasını söyle. Bugün için tekrar ağırlık idmanı önerme, bir sonraki seansı yarın için planla.
`.trim();
}

/**
 * Biomechanical cues for key gym exercises
 */
const exerciseBiomechanicalTips: Record<string, string> = {
  bench: 'Skapulanızı (kürek kemiklerinizi) geriye ve aşağıya kilitleyin. Ayak tabanlarıyla zeminden güç (leg drive) alın ve barı göğüs ucuna kontrollü indirip patlayıcı itin.',
  squat: 'Nefesi diyaframa doldurup karın içi basınç (valsalva manevrası) oluşturun. Dizlerinizin ayak parmak uçlarınızı takip etmesini sağlayın, kalçayı geriye ve aşağıya kontrollü oturtun.',
  deadlift: 'Bar kaval kemiklerine temas etmeli. Lat kaslarınızı sıkarak göğsü dik tutun. Yerden kaldırırken barı çekmek yerine yeri ayaklarınızla ittiğinizi hayal edin.',
  shoulder_press: 'Core (karın/bel) ve glute kaslarınızı sıkın, omurgada aşırı bel çukurluğu (lordoz) yaratmayın. Barı kafanızın hemen üzerinden düz dikey bir hatla tavana doğru itin.',
  latpull: 'Gövdenizi arkaya aşırı savurmayın. Hareketi kollarla değil, dirsekleri yan ceplerinize doğru çekerek kanat (latissimus) kaslarıyla başlatın.',
  row: 'Omurgayı nötr tutun (45-60 derece gövde açısı). Barı göbeğinize doğru çekerken omuzları düşürmeyin, tepe noktada sırt kaslarınızı 1 saniye sıkın.',
  biceps: 'Dirseklerinizi gövdenizin yanında sabitleyin. Ağırlığı savurmadan (momentum kullanmadan) sadece ön kollarınızla kaldırın ve tepede 1 saniye pazuya odaklanın.',
  triceps: 'Dirseklerin dışa açılmasına izin vermeyin. Hareketi sonuna kadar tamamlayarak triceps kas liflerinin en kısa pozisyonda kasılmasını sağlayın.'
};

/**
 * Highly intelligent offline rule-based expert coach response generator
 */
export function generateOfflineCoachResponse(
  userQuery: string,
  profile: AthleteProfile,
  workouts: Workout[],
  allExercises: ExerciseDefinition[]
): string {
  const norm = normalizeTurkish(userQuery);
  const gymLevels = calculateOverallGymLevels(workouts, allExercises, profile);
  const nextWorkout = getSuggestedNextWorkout(workouts);
  const volumeLandmarks = calculateWeeklyVolumeLandmarks(workouts, allExercises);

  // 1. SIRADA NE VAR / PROGRAM / NE ÇALIŞAYIM / BUGÜN NE VAR / YARIN NE VAR
  const isNextWorkoutQuery = 
    norm.includes('sirada') ||
    norm.includes('sira') ||
    norm.includes('ne calis') ||
    norm.includes('ne yapayim') ||
    norm.includes('ne yapmaliyim') ||
    norm.includes('ne basayim') ||
    norm.includes('bugun ne') ||
    norm.includes('yarin ne') ||
    norm.includes('sonraki') ||
    norm.includes('program') ||
    norm.includes('idman') ||
    norm.includes('antrenman') ||
    norm.includes('split') ||
    norm.includes('hangi bolge') ||
    norm.includes('hangi gun');

  if (isNextWorkoutQuery) {
    if (nextWorkout.isTodayCompleted && nextWorkout.todayWorkoutSummary) {
      return `### 🟢 Günün Antrenmanı Tamamlandı (Toparlanma Modu)

**Tebrikler Şampiyon!** Bugünkü seansını başarıyla bitirdin:
- **Tamamlanan Bölge:** ${nextWorkout.todayWorkoutSummary.splitName}
- **Toplam Hacim:** **${nextWorkout.todayWorkoutSummary.totalVolumeKg.toLocaleString('tr-TR')} kg** (${nextWorkout.todayWorkoutSummary.totalSets} set)

**Fizyolojik PT Değerlendirmesi:**
${nextWorkout.ptGuidance?.advice || 'Bugünkü antrenmanda kas liflerinde oluşan mikro yırtıklar şu an protein sentezi ve dinlenmeyle onarılıyor.'}

---

**🎯 Sıradaki Seans Hedefi (${nextWorkout.ptGuidance?.nextSessionTiming || 'Yarın'}):**
- **Hedef Bölge:** **${nextWorkout.ptGuidance?.nextSessionTarget || nextWorkout.splitTitle}**
- **Hazır / Dinlenmiş Kaslar:** ${nextWorkout.priorityMuscles.map(m => `**${m.muscleName}** (${m.daysSinceTrained} gündür dinleniyor)`).join(', ') || 'Tüm kaslar dinleniyor'}

**Bugünün Altın Kuralı:**
Bugün tekrar ağırlık çalışması yapmayın. Kaslar salonda değil, **dinlenirken ve uykuda büyür**. Bol su (min 2.5L), kaliteli protein ve 7-8 saat derin uykuya odaklanın!`;
    }

    return `### 💡 Önerilen Sıradaki Antrenman: **${nextWorkout.splitTitle}**

**Fizyolojik Gerekçe:**
${nextWorkout.reason}

**Öncelikli Kas Grupları (Dinlenmiş & Hazır):**
${nextWorkout.priorityMuscles.map(m => `- **${m.muscleName}**: ${m.daysSinceTrained} gündür dinleniyor (${m.recoveryStatus === 'fresh' ? '🟢 Tamamen taze' : '🔵 Toparlandı'})`).join('\n')}

**Antrenör Tavsiyesi:**
1. İdmana en çok dinlenmiş kas grubunun bileşke (compound) hareketiyle başlayın.
2. 3-4 çalışma setinde 6-10 tekrar aralığında, tükenişe 1-2 tekrar kala (RIR 1-2) çalışın.
3. Set aralarında minimum 2-3 dakika dinlenerek maksimal ATP yenilenmesi sağlayın.`;
  }

  // 2. EGZERSİZ BAZLI SORGULAR (Bench Press, Squat, Deadlift vb.)
  // Check if query matches an exercise name
  const matchedExercise = allExercises.find(ex => {
    const exNorm = normalizeTurkish(ex.name);
    const exIdNorm = normalizeTurkish(ex.id);
    return (
      norm.includes(exNorm) || 
      norm.includes(exIdNorm) ||
      (ex.id === 'bench' && (norm.includes('bench') || norm.includes('gogus pres'))) ||
      (ex.id === 'squat' && norm.includes('squat')) ||
      (ex.id === 'deadlift' && (norm.includes('deadlift') || norm.includes('rdl'))) ||
      (ex.id === 'shoulder_press' && (norm.includes('ohp') || norm.includes('shoulder press') || norm.includes('omuz pres'))) ||
      (ex.id === 'latpull' && (norm.includes('lat pull') || norm.includes('pulldown') || norm.includes('barfiks'))) ||
      (ex.id === 'row' && (norm.includes('barbell row') || norm.includes('kurek') || norm.includes('dumble row'))) ||
      (ex.id === 'biceps' && (norm.includes('biceps curl') || norm.includes('curl') || norm.includes('pazu')))
    );
  });

  if (matchedExercise) {
    const best1RM = getBest1RMForExercise(matchedExercise.id, workouts);
    const strengthAnalysis = getExerciseStrengthAnalysis(matchedExercise, workouts, profile);
    const overload = getExerciseOverloadSuggestion(matchedExercise, workouts, profile);
    const plateau = detectExercisePlateau(matchedExercise.id, workouts);
    const bioTip = exerciseBiomechanicalTips[matchedExercise.id] || 'Hareketi tam hareket açıklığı (Full ROM) ve kontrollü negatif tempo (2-3 sn iniş) ile uygulayın.';

    return `### 🏋️ Egzersiz Analizi: **${matchedExercise.name}**

**Güç & 1RM Performansınız:**
- 🏆 **Kişisel Rekor (1RM):** **${strengthAnalysis.estimated1RM > 0 ? `${strengthAnalysis.estimated1RM} kg` : 'Henüz kayıt yok'}** (${strengthAnalysis.bodyweightRatio}x Vücut Ağırlığı)
- 🎖️ **Güç Seviyesi:** **${strengthAnalysis.tierTitle}** (Skor: ${strengthAnalysis.strengthScore}/100)
${best1RM.weight > 0 ? `- 📋 **En İyi Set:** ${best1RM.weight} kg x ${best1RM.reps} tekrar` : ''}
${plateau.isPlateau ? `\n⚠️ **Plato Uyarısı:** Bu harekette son ${plateau.consecutiveCount} antrenmandır ağırlık artışı durdu. Stratejik deload (%10 indirim) veya tekrar aralığı değişimi önerilir.` : ''}

---

**🎯 Sıradaki Antrenman İçin Hedef:**
- **${overload.title}**
- ${overload.description}
- **Önerilen Setler:** ${overload.suggestedSets.map((s, idx) => `Set ${idx + 1}: ${s.weight} kg x ${s.reps} tekrar`).join(' | ')}

**💡 Biyomekanik Form İpucu:**
${bioTip}`;
  }

  // 3. KAS GRUBU BAZLI SORGULAR (Göğüs, Sırt, Omuz, Bacak, Kol vb.)
  const muscleGroupsList: { id: MuscleGroup; keywords: string[] }[] = [
    { id: 'chest', keywords: ['gogus', 'pec', 'chest'] },
    { id: 'back', keywords: ['sirt', 'kanat', 'lats', 'trapez', 'back'] },
    { id: 'shoulder', keywords: ['omuz', 'deltoid', 'shoulder'] },
    { id: 'biceps', keywords: ['biceps', 'on kol', 'pazu'] },
    { id: 'triceps', keywords: ['triceps', 'arka kol'] },
    { id: 'quads', keywords: ['bacak', 'quad', 'on bacak'] },
    { id: 'hamstring', keywords: ['arka bacak', 'hamstring'] },
    { id: 'glutes', keywords: ['kalca', 'glute'] },
    { id: 'calves', keywords: ['kalf', 'baldir', 'calf'] },
    { id: 'abs', keywords: ['karin', 'abs', 'core'] }
  ];

  const matchedMuscle = muscleGroupsList.find(m => m.keywords.some(k => norm.includes(k)));
  if (matchedMuscle) {
    const meta = muscleMetadata[matchedMuscle.id];
    const volumeInfo = volumeLandmarks.find(v => v.muscle === matchedMuscle.id);
    const priorityInfo = nextWorkout.priorityMuscles.find(p => p.muscle === matchedMuscle.id);
    const daysSince = priorityInfo ? priorityInfo.daysSinceTrained : 'Bilinmiyor';
    const isFresh = priorityInfo ? (priorityInfo.recoveryStatus === 'fresh' ? '🟢 Tamamen dinlenmiş (Taze)' : '🔵 Toparlandı') : '🟡 Dinleniyor';

    return `### ${meta.icon} Bölgesel Durum: **${meta.name}** (${meta.latinName})

**Toparlanma & Hazırlık:**
- **Dinlenme Süresi:** Son antrenmandan bu yana **${daysSince} gün** geçti.
- **Hazırlık Durumu:** ${isFresh}

**Haftalık Hipertrofi Hacmi (RP Landmarks):**
- **Bu Hafta Yapılan:** **${volumeInfo?.weeklySets || 0} Set** (${volumeInfo?.landmarkLabel || 'Normal'})
- **Tavsiye:** ${volumeInfo?.feedback || 'Haftalık 10-18 set aralığında kalmak optimal hipertrofi sağlar.'}

**Bilimsel Gelişim Tüyoları:**
1. Kas protein sentezi (MPS) antrenmandan sonra ~48 saat yüksek kalır. Bu nedenle kası haftada 2 kez uyarmak, haftada 1 kez yüksek set yapmaktan %30 daha fazla kas inşası sağlar.
2. 8-12 tekrar aralığında, tükenişe 1-2 tekrar kala (RIR 1-2) çalışın.`;
  }

  // 4. PLATO / TAKILDIM / AĞIRLIK ARTMIYOR
  if (
    norm.includes('plato') || 
    norm.includes('takil') || 
    norm.includes('artmi') || 
    norm.includes('agirlik art') ||
    norm.includes('kilo art') ||
    norm.includes('overload') ||
    norm.includes('asami') ||
    norm.includes('tikandi')
  ) {
    // Check if any exercises currently have real plateaus
    const plateauExercises = allExercises
      .map(ex => ({ ex, plat: detectExercisePlateau(ex.id, workouts) }))
      .filter(item => item.plat.isPlateau);

    let plateauDetails = '';
    if (plateauExercises.length > 0) {
      plateauDetails = `\n⚠️ **Plato Tespit Edilen Hareketleriniz:**\n` +
        plateauExercises.map(p => `- **${p.ex.name}**: Son ${p.plat.consecutiveCount} antrenmandır ağırlık/tekrar artışı durdu.`).join('\n') + '\n';
    }

    return `### ⚡ Plato Kırma ve Aşırı Yükleme Protokolü
${plateauDetails}
Bir egzersizde 3 antrenmandan uzun süredir ağırlık veya tekrar artıramıyorsanız, sinir sistemi yorgunluğu (CNS fatigue) veya kas adaptasyon doygunluğu oluşmuştur.

**Bilimsel 4 Adımlı Çözüm:**
1. **%10 Stratejik Deload:** Bir sonraki seansta ağırlığı %10 indirin; fakat iniş fazını (negatif) 3 saniye kontrollü, kalkış fazını patlayıcı hızda yapın.
2. **Tekrar Aralığı Dönüşümü:** 5 tekrar güç çalışıyorsanız, 2-3 hafta 8-10 tekrar hipertrofi aralığına geçerek kas liflerini yeni gerilim açısına maruz bırakın.
3. **Dinlenme Süresi:** Set aralarını kronometreyle **2.5 - 3 dakikaya** çıkarın. Kas içi ATP-CP depolarının %95'i ancak 3 dakikada yenilenir.
4. **Varyasyon Değişimi:** Düz bar yerine dumbbell varyasyonuna geçin veya tutuş açısını (grip) değiştirin.`;
  }

  // 5. GELİŞİM / ANALİZ / SEVİYE / GYMLEVELS / SKOR
  if (
    norm.includes('analiz') || 
    norm.includes('gelisim') || 
    norm.includes('seviye') || 
    norm.includes('durum') ||
    norm.includes('skor') ||
    norm.includes('ilerleme') ||
    norm.includes('gecmis') ||
    norm.includes('rapor') ||
    norm.includes('nasilim')
  ) {
    const optimal = volumeLandmarks.filter(v => v.landmark === 'mav').map(v => v.muscleName);
    const needAttention = volumeLandmarks.filter(v => v.landmark === 'under_mev' && v.weeklySets > 0).map(v => v.muscleName);

    return `### 📊 Bilimsel Gelişim Analiziniz

**Kuvvet Seviyeniz (GymLevels):**
- **Genel Güç Skoru:** **${gymLevels.overallStrengthScore} / 100** (${gymLevels.overallTierTitle} Seviye)
- **Vücut Ağırlığı Oranı:** Kilonuz (${profile.bodyWeightKg} kg) baz alındığında kaldırışlarınız kayıt altındadır.
- **Toplam Antrenman:** ${workouts.length} kayıtlı seans.
${gymLevels.strongestLift ? `- 🏆 **En Güçlü Kaldırış:** ${gymLevels.strongestLift.exerciseName} (1RM: ${gymLevels.strongestLift.estimated1RM} kg, ${gymLevels.strongestLift.bodyweightRatio}x BW)` : ''}
${gymLevels.needsWorkLift ? `- 🎯 **Geliştirilmesi Gereken:** ${gymLevels.needsWorkLift.exerciseName} (${gymLevels.needsWorkLift.tierTitle})` : ''}

**Haftalık Hipertrofi Hacim Durumu (RP Landmarks):**
${optimal.length > 0 ? `- 🟢 **Optimal Gelişim (MAV):** ${optimal.join(', ')}` : '- Düzenli antrenmanla altın hacim aralığına (12-20 set) ulaşabilirsiniz.'}
${needAttention.length > 0 ? `- ⚠️ **Hacim Artırılmalı (< MEV):** ${needAttention.join(', ')}` : ''}

**Tavsiye:** Haftalık set sayılarınızı kas grubu başına 10-18 set (MAV) bandında tutmak hipertrofiyi maksimize edecektir.`;
  }

  // 6. KAÇ SET / KAÇ TEKRAR / DİNLENME / RPE / RIR
  if (
    norm.includes('kac set') ||
    norm.includes('kac tekrar') ||
    norm.includes('dinlenme') ||
    norm.includes('rpe') ||
    norm.includes('rir') ||
    norm.includes('tukenis') ||
    norm.includes('mola') ||
    norm.includes('kac dakika')
  ) {
    return `### ⏱️ Bilimsel Set, Tekrar ve Dinlenme Rehberi

**1. Tekrar Sayıları (Rep Ranges):**
- **Maksimal Güç:** 3 - 6 tekrar (%80-85 1RM)
- **Hipertrofi (Kas Büyümesi):** 6 - 12 tekrar (%65-80 1RM)
- **Dayanıklılık / Metabolik Stres:** 12 - 20 tekrar

**2. Dinlenme Süreleri:**
- **Bileşke (Compound) Hareketler (Squat, Bench, Deadlift):** **2.5 - 3.5 dakika**. (ATP-CP depolarının tam dolması ve sinir sistemi toparlanması için şarttır).
- **İzolasyon Hareketleri (Lateral Raise, Biceps Curl):** **60 - 90 saniye**.

**3. Tükeniş & RPE/RIR Kuralı:**
- Her sette tam tükenişe (0 RIR / failure) gitmek sistemik yorgunluğu aşırı artırır.
- Çoğu çalışma setini **1-2 RIR** (yani tükenişe 1-2 tekrar kala) bırakın. Son sette kontrollü tükeniş uygulayabilirsiniz.`;
  }

  // 7. BESLENME / PROTEİN / KİLO / KALORİ / SU / KREATİN / BULK / CUT
  if (
    norm.includes('beslenme') || 
    norm.includes('protein') || 
    norm.includes('kilo') || 
    norm.includes('kalori') ||
    norm.includes('kreatin') ||
    /\bsu\b/.test(norm) ||
    norm.includes('su ic') ||
    norm.includes('su tuket') ||
    norm.includes('diyet') ||
    norm.includes('yemek') ||
    norm.includes('bulk') ||
    norm.includes('cut') ||
    norm.includes('zayifla') ||
    norm.includes('definas')
  ) {
    const minProtein = Math.round(profile.bodyWeightKg * 1.6);
    const optProtein = Math.round(profile.bodyWeightKg * 2.2);
    const water = (profile.bodyWeightKg * 0.04).toFixed(1);

    return `### 🥗 Kişiselleştirilmiş Beslenme & Toparlanma Rehberi

Vücut ağırlığınız **${profile.bodyWeightKg} kg** baz alınarak hesaplanan sporcu değerleri:

- **Günlük Protein İhtiyacı:** **${minProtein}g - ${optProtein}g** (Öğün başına 30-40g kaliteli protein tüketerek kas protein sentezini [MPS] tepe noktada tutun).
- **Günlük Su İhtiyacı:** Minimum **${water} Litre/gün**. Kas dokusunun %70'i sudur; %2'lik dehidrasyon bile güç çıktısını %15 düşürür.
- **Kreatin Monohidrat:** Günde **3 - 5 gram** düzenli alın. Hücre içi su tutulumunu, kas dolgunluğunu ve 1RM gücünü bilimsel olarak artırır.
- **Kalori Stratejisi:**
  * *Kas Kazanımı (Lean Bulk):* Günlük harcamanızın **+300-400 kcal** fazlası.
  * *Yağ Yakımı (Definasyon):* Günlük harcamanızın **-400-500 kcal** açığı (proteini 2.2g/kg'da tutarak kas kaybını önleyin).`;
  }

  // 8. AĞRI / SAKATLIK / HAMLIK / DOMS / YORULDUM
  if (
    norm.includes('agri') ||
    /\baci\b/.test(norm) ||
    norm.includes('hamlik') ||
    norm.includes('doms') ||
    norm.includes('sakat') ||
    norm.includes('omzum agri') ||
    norm.includes('belim') ||
    norm.includes('dizim') ||
    norm.includes('yipran') ||
    norm.includes('yorgun')
  ) {
    return `### 🩺 Ağrı, Hamlık (DOMS) ve Toparlanma Rehberi

**Ağrının Türünü Belirleyin:**
1. **Kas Hamlığı (DOMS):** Antrenmandan 24-48 saat sonra kas gövdesinde hissedilen tatlı sızı normaldir. Mikro yırtıkların onarıldığını gösterir.
   - *Çözüm:* Hafif tempolu yürüyüş (aktif toparlanma), bol su, kaliteli protein ve hafif esneme.
2. **Eklem / Tendon Ağrısı (Tehlike Sinyali):** Diz, omuz içi veya dirsekte keskin, batan veya hareket açıklığını engelleyen bir ağrı varsa **o eklemi zorlayan egzersizi derhal durdurun**.

**Tavsiyeler:**
- Ağrıyan ekleme soğuk kompres uygulayın ve 48 saat ağır yük bindirmeyin.
- Kronik eklem ağrısında hareket açısını (incline/decline/nötr tutuş) değiştirin veya fizik tedavi uzmanına danışın.`;
  }

  // 9. ISINMA / MOBİLİTE / ESNEME
  if (
    norm.includes('isinma') ||
    norm.includes('warm') ||
    norm.includes('mobil') ||
    norm.includes('esne') ||
    norm.includes('strech')
  ) {
    return `### 🤸 Bilimsel Isınma ve Mobilite Protokolü

Ağır çalışma setlerine girmeden önce 3 aşamalı piramit ısınma uygulayın:

1. **Genel Isınma (3-5 Dakika):** Hafif tempo kürek, bisiklet veya koşu bandı ile vücut ısısını ve kan dolaşımını artırın.
2. **Dinamik Eklem Açma:**
   - Üst vücut için: Kol çevirme, omuz dislokasyonu (lastik veya sopa ile), göğüs açışları.
   - Alt vücut için: Kalça açıcılar (hip openers), vücut ağırlığıyla squat, ayak bileği mobilitesi.
   *(Önemli: Ağır antrenman öncesi statik/hareketsiz esneme yapmayın; kasın patlayıcı güç çıktısını azaltır).*
3. **Ramp-Up (Piramit) Setleri:**
   - 1. Set: Boş bar veya hafif ağırlık x 10 tekrar
   - 2. Set: Çalışma ağırlığının %50'si x 5 tekrar
   - 3. Set: Çalışma ağırlığının %75'i x 3 tekrar
   - 4. Set: Çalışma ağırlığına geçiş (Maksimum güç!)`;
  }

  // 10. KARDİYO / YAĞ YAKIMI / KOŞU
  if (
    norm.includes('kardiyo') ||
    norm.includes('cardio') ||
    norm.includes('kosu') ||
    norm.includes('yuruyus') ||
    norm.includes('hiit') ||
    norm.includes('liss') ||
    norm.includes('yag yak')
  ) {
    return `### 🏃 Kardiyo ve Hipertrofi Dengesi (Interference Effect)

Ağırlık çalışan bir sporcu için kardiyonun bilimsel kuralları:

1. **Zamanlama:** Kardiyoyu ağırlık antrenmanından **HEMEN ÖNCE YAPMAYIN**. Ağırlık öncesi kardiyo glikojen depolarını tüketir ve 1RM güç çıktınızı düşürür. Kardiyoyu ağırlık idmanının sonuna veya dinlenme günlerine koyun.
2. **En İyi Kardiyo Türü (LISS):** Eğimli yürüyüş bandında (örn. %8-10 eğim, 4.5-5.5 km/s hız) 20-30 dakika yürümek kas liflerini yıpratmadan yüksek yağ yakımı sağlar.
3. **HIIT:** Bacak kaslarına aşırı yorgunluk bindirdiği için haftada 1-2 seansı aşmamalıdır.`;
  }

  // 11. SELAMLAŞMA / KİMSİN / MERHABA
  if (
    norm.includes('selam') ||
    norm.includes('merhaba') ||
    norm.includes('naber') ||
    norm.includes('nasilsin') ||
    norm.includes('gunaydin') ||
    norm.includes('iyi gunler') ||
    norm.includes('iyi aksamlar') ||
    norm.includes('kimsin') ||
    norm.includes('hey')
  ) {
    return `### 👋 Merhaba Şampiyon! Ben Bilimsel AI Koçun.

Vücut ağırlığın (**${profile.bodyWeightKg} kg**), kayıtlı **${workouts.length}** antrenmanın ve GymLevels güç verilerin hafızamda hazır.

${nextWorkout.isTodayCompleted 
  ? `🟢 **Bugünkü idmanını tamamladın!** Şu anda toparlanma ve kas onarım sürecindesin.` 
  : `💡 **Sıradaki seansın:** **${nextWorkout.splitTitle}** planlandı ve dinlenmiş kasların hazır.`}

Sana nasıl yardımcı olabilirim? Örneğin şunları sorabilirsin:
- *"Sırada ne var?"* (Sıradaki seansın detayları)
- *"Bench press durumum nasıl?"* (1RM ve kilo artış hedefin)
- *"Gelişimimi analiz et"* (Kuvvet ve hacim raporun)
- *"Plato kırma planı"* (Ağırlık artıramadığın hareketler)
- *"Beslenme önerisi ver"* (Kilona özel protein ve su hesabı)`;
  }

  // 12. AKILLI DİNAMİK FALLBACK (Kullanıcının sorusuna özel, asla "Save ve analiz" demez!)
  return `### 🤖 Bilimsel AI Antrenör Yanıtı

Sorunuz: *"${userQuery.trim()}"*

Spor bilimi standartları (Epley 1RM, Mike Israetel RP Landmarks, Schoenfeld) ve profil verilerinize (**${profile.bodyWeightKg} kg**, **${workouts.length} idman**) dayanarak:

1. **Temel Hipertrofi İlkesi:** Kas büyümesini tetikleyen ana unsur **Progressive Overload** (kademeli ağırlık/tekrar artışı) ve haftalık kas başına **10-18 kaliteli çalışma seti**dir.
2. **Toparlanma Dengesi:** Kas lifleri salonda değil, antrenman sonrası 48-72 saatlik dinlenme penceresinde kaliteli protein (günlük ~**${Math.round(profile.bodyWeightKg * 1.8)}g**) ve derin uyku ile büyür.
3. **Mevcut Durumunuz:** ${nextWorkout.isTodayCompleted ? 'Bugünkü idmanınızı tamamladınız, toparlanmaya odaklanın.' : `Sıradaki önerilen seansınız: **${nextWorkout.splitTitle}**.`}

💡 **Özel analizler için şu butonları veya soruları kullanabilirsiniz:**
- *"Sırada ne var?"* (Sıradaki antrenman ve dinlenmiş kaslar)
- *"Bench press kaç basmalıyım?"* (1RM ve yüklenme hedefi)
- *"Göğüs durumum nasıl?"* (Kas grubu hacmi ve dinlenme)
- *"Plato kırma planı"* (Ağırlık takılmalarını çözme)`;
}

/**
 * Sends prompt to Gemini API if key exists, otherwise uses the enhanced offline scientific engine
 */
export async function askAICoach(
  userQuery: string,
  profile: AthleteProfile,
  workouts: Workout[],
  allExercises: ExerciseDefinition[]
): Promise<string> {
  const envKey = (typeof import.meta !== 'undefined' && typeof import.meta.env?.VITE_GEMINI_API_KEY === 'string' 
    ? (import.meta.env.VITE_GEMINI_API_KEY as string).trim() 
    : '');
  const apiKey = profile.geminiApiKey?.trim() || envKey;

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
5. "Sırada ne var?" diye sorulduğunda kullanıcının bugünkü antrenmanını tamamlayıp tamamlamadığına dikkat etmek. Eğer bugün idman bittiyse tebrik edip yarınki seansı planlamak.
6. Türkçe konuşmak.
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
      console.warn('Gemini API error, falling back to offline coach engine. Status:', response.status);
      return generateOfflineCoachResponse(userQuery, profile, workouts, allExercises);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (candidateText) {
      return candidateText;
    }

    return generateOfflineCoachResponse(userQuery, profile, workouts, allExercises);
  } catch (error) {
    console.error('Error calling Gemini API, falling back to offline coach:', error);
    return generateOfflineCoachResponse(userQuery, profile, workouts, allExercises);
  }
}
