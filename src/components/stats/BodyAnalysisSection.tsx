import React, { useState, useMemo, useId, useEffect, useRef, useCallback } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useBackButton } from '../../context/BackNavigationContext';
import {
  calculateBodyCompositionMetrics,
  estimateNavyBodyFatPct
} from '../../utils/scientificCalculations';
import {
  getTodayLocalDate,
  formatDisplayDate,
  parseLocalDate,
  TURKISH_MONTHS_SHORT
} from '../../utils/dateUtils';
import {
  sanitizeDecimalInput,
  sanitizeIntegerInput,
  parseDecimalOrFallback,
  parseIntOrFallback,
  selectAllOnFocus
} from '../../utils/inputUtils';
import { Gender } from '../../types/workout';
import { sounds } from '../../utils/audio';
import {
  Scale,
  TrendingUp,
  Ruler,
  Calculator,
  Plus,
  Trash2,
  Calendar,
  Check,
  SlidersHorizontal,
  X,
  Percent,
  History,
  Target
} from 'lucide-react';

type TrendMetric = 'weightKg' | 'bodyFatPct' | 'muscleMassKg' | 'waistCm';

interface BodyAnalysisSectionProps {
  autoOpenEntry?: boolean;
  onEntryOpened?: () => void;
}

export const BodyAnalysisSection: React.FC<BodyAnalysisSectionProps> = ({
  autoOpenEntry = false,
  onEntryOpened
}) => {
  const {
    profile,
    updateProfile,
    logBodyMeasurement,
    deleteBodyMeasurement
  } = useWorkout();

  const idPrefix = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedMetric, setSelectedMetric] = useState<TrendMetric>('weightKg');
  const [selectedPointIdx, setSelectedPointIdx] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showExtraComp, setShowExtraComp] = useState<boolean>(false);
  const [showTapeInputs, setShowTapeInputs] = useState<boolean>(false);
  const [activeSheet, setActiveSheet] = useState<'none' | 'profile' | 'target'>('none');
  const [showAllHistory, setShowAllHistory] = useState<boolean>(false);

  const sortedMeasurements = useMemo(() => {
    return [...(profile.measurements || [])].sort((a, b) => a.date.localeCompare(b.date));
  }, [profile.measurements]);

  const latestMeasurement = sortedMeasurements[sortedMeasurements.length - 1];

  // New Measurement Form State
  const [entryDate, setEntryDate] = useState<string>(getTodayLocalDate());
  const [weightStr, setWeightStr] = useState<string>(String(profile.bodyWeightKg || 75));
  const [bodyFatStr, setBodyFatStr] = useState<string>(
    profile.bodyFatPct !== undefined ? String(profile.bodyFatPct) : ''
  );
  const [muscleMassStr, setMuscleMassStr] = useState<string>(
    profile.muscleMassKg !== undefined ? String(profile.muscleMassKg) : ''
  );
  const [waistStr, setWaistStr] = useState<string>('');
  const [neckStr, setNeckStr] = useState<string>('');
  const [armStr, setArmStr] = useState<string>('');

  // Profile State (Boy, Yaş, Cinsiyet)
  const [heightStr, setHeightStr] = useState<string>(
    String(profile.heightCm || (profile.gender === 'female' ? 165 : 178))
  );
  const [ageStr, setAgeStr] = useState<string>(String(profile.age || 25));
  const [gender, setGender] = useState<Gender>(profile.gender || 'male');

  // Target Goal State
  const [targetWeightStr, setTargetWeightStr] = useState<string>(
    profile.targetWeightKg ? String(profile.targetWeightKg) : '72'
  );
  const [targetBfStr, setTargetBfStr] = useState<string>(
    profile.targetBodyFatPct ? String(profile.targetBodyFatPct) : '15'
  );

  const weightKg = parseDecimalOrFallback(weightStr, profile.bodyWeightKg || 75);
  const heightCm = parseIntOrFallback(
    heightStr,
    profile.heightCm || (profile.gender === 'female' ? 165 : 178)
  );
  const age = parseIntOrFallback(ageStr, profile.age || 25);

  const openMeasurementModal = useCallback(
    (focusTape = false) => {
      const latest = sortedMeasurements[sortedMeasurements.length - 1];
      setEntryDate(getTodayLocalDate());
      setWeightStr(String(profile.bodyWeightKg || 75));
      setBodyFatStr(profile.bodyFatPct !== undefined ? String(profile.bodyFatPct) : '');
      setMuscleMassStr(profile.muscleMassKg !== undefined ? String(profile.muscleMassKg) : '');
      setWaistStr(latest?.waistCm !== undefined ? String(latest.waistCm) : '');
      setNeckStr(latest?.neckCm !== undefined ? String(latest.neckCm) : '');
      setArmStr(latest?.armCm !== undefined ? String(latest.armCm) : '');
      if (focusTape) {
        setShowTapeInputs(true);
      }
      setIsModalOpen(true);
      const dlg = dialogRef.current;
      if (dlg && !dlg.open) {
        dlg.showModal();
      }
    },
    [profile.bodyFatPct, profile.bodyWeightKg, profile.muscleMassKg, sortedMeasurements]
  );

  const closeMeasurementModal = useCallback(() => {
    const dlg = dialogRef.current;
    if (dlg && dlg.open) {
      dlg.close();
    }
    setIsModalOpen(false);
  }, []);

  useBackButton(
    isModalOpen,
    () => {
      sounds.playPop();
      closeMeasurementModal();
    },
    75
  );

  useEffect(() => {
    if (autoOpenEntry) {
      openMeasurementModal(false);
      onEntryOpened?.();
    }
  }, [autoOpenEntry, onEntryOpened, openMeasurementModal]);

  // Sync native dialog close & fallback light-dismiss
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;

    const handleNativeClose = () => {
      dlg.returnValue = '';
      setIsModalOpen(false);
    };

    dlg.addEventListener('close', handleNativeClose);

    let cleanupLightDismiss: (() => void) | undefined;
    if (typeof HTMLDialogElement !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
      const isOutside = (e: PointerEvent, dialog: HTMLDialogElement) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = isOutside(e, dlg);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && isOutside(e, dlg)) {
          dlg.close();
        }
      };
      dlg.addEventListener('pointerdown', onPointerDown);
      dlg.addEventListener('pointerup', onPointerUp);
      cleanupLightDismiss = () => {
        dlg.removeEventListener('pointerdown', onPointerDown);
        dlg.removeEventListener('pointerup', onPointerUp);
      };
    }

    return () => {
      dlg.removeEventListener('close', handleNativeClose);
      cleanupLightDismiss?.();
    };
  }, []);

  const metrics = useMemo(() => calculateBodyCompositionMetrics(profile), [profile]);

  const navyBf = useMemo(() => {
    const w = parseFloat(waistStr);
    const n = parseFloat(neckStr);
    if (isNaN(w) || isNaN(n) || w <= 40 || n <= 20) return null;
    return estimateNavyBodyFatPct(profile.gender || 'male', profile.heightCm || 178, w, n);
  }, [profile.gender, profile.heightCm, waistStr, neckStr]);

  const adjustWeight = (delta: number) => {
    sounds.playPop();
    const base = parseDecimalOrFallback(weightStr, profile.bodyWeightKg || 75);
    const next = Math.max(30, Math.min(250, Math.round((base + delta) * 10) / 10));
    setWeightStr(String(next));
  };

  const handleSaveProfileBasics = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();
    updateProfile({
      heightCm: Math.max(130, Math.min(230, heightCm)),
      age: Math.max(12, Math.min(99, age)),
      gender
    });
    setActiveSheet('none');
  };

  const handleSaveTargets = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();
    const tw = parseDecimalOrFallback(targetWeightStr, metrics.weightKg);
    const tb = parseDecimalOrFallback(targetBfStr, metrics.bodyFatPct);
    updateProfile({
      targetWeightKg: Math.max(35, Math.min(220, Math.round(tw * 10) / 10)),
      targetBodyFatPct: Math.max(4, Math.min(45, Math.round(tb * 10) / 10))
    });
    setActiveSheet('none');
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const safeWeight = Math.max(30, Math.min(250, weightKg));
    const safeHeight = profile.heightCm || (profile.gender === 'female' ? 165 : 178);
    const parsedBf = parseFloat(bodyFatStr);
    const parsedMuscle = parseFloat(muscleMassStr);
    const safeBf = !isNaN(parsedBf) && parsedBf >= 3 && parsedBf <= 55 ? Math.round(parsedBf * 10) / 10 : undefined;
    const safeMuscle =
      !isNaN(parsedMuscle) && parsedMuscle >= 15 && parsedMuscle < safeWeight
        ? Math.round(parsedMuscle * 10) / 10
        : undefined;

    const wCm = parseFloat(waistStr);
    const nCm = parseFloat(neckStr);
    const aCm = parseFloat(armStr);

    const preview = calculateBodyCompositionMetrics(profile, {
      weightKg: safeWeight,
      heightCm: safeHeight,
      bodyFatPct: safeBf,
      muscleMassKg: safeMuscle
    });

    updateProfile({
      bodyWeightKg: safeWeight,
      bodyFatPct: safeBf ?? preview.bodyFatPct,
      muscleMassKg: safeMuscle ?? preview.muscleMassKg
    });

    logBodyMeasurement({
      date: entryDate || getTodayLocalDate(),
      weightKg: safeWeight,
      bodyFatPct: safeBf ?? preview.bodyFatPct,
      muscleMassKg: safeMuscle ?? preview.muscleMassKg,
      waistCm: !isNaN(wCm) && wCm > 40 ? Math.round(wCm * 10) / 10 : undefined,
      neckCm: !isNaN(nCm) && nCm > 20 ? Math.round(nCm * 10) / 10 : undefined,
      armCm: !isNaN(aCm) && aCm > 15 ? Math.round(aCm * 10) / 10 : undefined
    });

    closeMeasurementModal();
  };

  const chartPoints = useMemo(() => {
    const pts = sortedMeasurements
      .map((m) => {
        const val = m[selectedMetric];
        if (typeof val === 'number' && val > 0) {
          const d = parseLocalDate(m.date);
          return {
            date: m.date,
            shortDate: `${d.getDate()} ${TURKISH_MONTHS_SHORT[d.getMonth()]}`,
            value: val
          };
        }
        return null;
      })
      .filter((x): x is { date: string; shortDate: string; value: number } => x !== null);
    return pts.slice(-20);
  }, [sortedMeasurements, selectedMetric]);

  const metricMeta: Record<
    TrendMetric,
    { label: string; shortLabel: string; unit: string; color: string; target?: number }
  > = {
    weightKg: {
      label: 'Ağırlık',
      shortLabel: 'Kilo',
      unit: 'kg',
      color: '#38bdf8',
      target: profile.targetWeightKg
    },
    bodyFatPct: {
      label: 'Yağ Oranı',
      shortLabel: 'Yağ %',
      unit: '%',
      color: '#fbbf24',
      target: profile.targetBodyFatPct
    },
    muscleMassKg: {
      label: 'İskelet Kası',
      shortLabel: 'Kas kg',
      unit: 'kg',
      color: '#10b981'
    },
    waistCm: {
      label: 'Bel Çevresi',
      shortLabel: 'Bel cm',
      unit: 'cm',
      color: '#c084fc'
    }
  };

  const activeMeta = metricMeta[selectedMetric];

  const reversedHistory = useMemo(() => {
    return [...sortedMeasurements].reverse();
  }, [sortedMeasurements]);

  const massBreakdown = useMemo(() => {
    const total = Math.max(1, metrics.weightKg);
    const muscleKg = metrics.muscleMassKg;
    const fatKg = metrics.fatMassKg;
    const otherLbmKg = Math.max(1, Math.round((total - muscleKg - fatKg) * 10) / 10);

    const musclePct = Math.round((muscleKg / total) * 100);
    const fatPct = Math.round((fatKg / total) * 100);
    const otherPct = Math.max(5, 100 - musclePct - fatPct);

    return {
      muscleKg,
      fatKg,
      otherLbmKg,
      musclePct,
      fatPct,
      otherPct
    };
  }, [metrics]);

  const bfPinPct = useMemo(() => {
    return Math.min(96, Math.max(4, Math.round(((metrics.bodyFatPct - 5) / 30) * 100)));
  }, [metrics.bodyFatPct]);

  const ffmiPinPct = useMemo(() => {
    const isFemale = profile.gender === 'female';
    const minF = isFemale ? 12 : 15;
    const maxF = isFemale ? 22 : 25;
    return Math.min(96, Math.max(4, Math.round(((metrics.normalizedFfmi - minF) / (maxF - minF)) * 100)));
  }, [metrics.normalizedFfmi, profile.gender]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeIn 0.2s ease-out' }}>
      {/* 1. KOMPAKT ÜST KONTROL BAR: Yeni Ölçüm + Fiziksel Bilgiler + Hedef */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr 1fr', gap: 6 }}>
        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            openMeasurementModal(false);
          }}
          className="btn"
          style={{
            minHeight: 44,
            background: 'linear-gradient(135deg, #059669, #10b981)',
            border: '1px solid rgba(52, 211, 153, 0.5)',
            borderRadius: 'var(--radius-md)',
            padding: '0 10px',
            color: '#ffffff',
            fontSize: 12.5,
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
          }}
        >
          <Plus size={16} strokeWidth={2.8} />
          <span>Ölçüm Ekle</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setHeightStr(String(profile.heightCm || 178));
            setAgeStr(String(profile.age || 25));
            setGender(profile.gender || 'male');
            setActiveSheet((prev) => (prev === 'profile' ? 'none' : 'profile'));
          }}
          style={{
            minHeight: 44,
            borderRadius: 'var(--radius-md)',
            background: activeSheet === 'profile' ? 'rgba(56, 189, 248, 0.16)' : 'var(--card-bg)',
            border: activeSheet === 'profile' ? '1.5px solid var(--cyan)' : '1px solid var(--border)',
            color: '#ffffff',
            fontSize: 11.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            padding: '0 8px',
            whiteSpace: 'nowrap'
          }}
        >
          <SlidersHorizontal size={13} color="var(--cyan)" />
          <span>
            {metrics.heightCm}cm • {profile.age || 25}y
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setTargetWeightStr(String(profile.targetWeightKg || Math.max(50, metrics.weightKg - 3)));
            setTargetBfStr(String(profile.targetBodyFatPct || 15));
            setActiveSheet((prev) => (prev === 'target' ? 'none' : 'target'));
          }}
          style={{
            minHeight: 44,
            borderRadius: 'var(--radius-md)',
            background: activeSheet === 'target' ? 'rgba(251, 191, 36, 0.16)' : 'var(--card-bg)',
            border: activeSheet === 'target' ? '1.5px solid var(--gold)' : '1px solid var(--border)',
            color: '#ffffff',
            fontSize: 11.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            padding: '0 8px',
            whiteSpace: 'nowrap'
          }}
        >
          <Target size={13} color="var(--gold)" />
          <span>
            {profile.targetWeightKg ? `Hedef ${profile.targetWeightKg}kg` : 'Hedef Seç'}
          </span>
        </button>
      </div>

      {/* AÇILIR PANEL 1: BOY, YAŞ VE CİNSİYET DÜZENLEME */}
      {activeSheet === 'profile' && (
        <form
          onSubmit={handleSaveProfileBasics}
          className="card"
          style={{
            padding: '14px',
            marginBottom: 0,
            border: '1px solid rgba(56, 189, 248, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>
              Fiziksel Bilgiler (FFMI & BMI Hesabı)
            </span>
            <button
              type="button"
              onClick={() => setActiveSheet('none')}
              className="btn-icon"
              aria-label="Kapat"
              style={{ width: 28, height: 28 }}
            >
              <X size={15} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 8 }}>
            <div>
              <label
                htmlFor={`${idPrefix}-prof-height`}
                style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}
              >
                Boy (cm)
              </label>
              <input
                id={`${idPrefix}-prof-height`}
                type="text"
                inputMode="numeric"
                value={heightStr}
                onChange={(e) => setHeightStr(sanitizeIntegerInput(e.target.value))}
                onFocus={selectAllOnFocus}
                className="form-input"
                style={{ minHeight: 42, fontSize: 16, textAlign: 'center', fontWeight: 800, padding: '6px' }}
              />
            </div>

            <div>
              <label
                htmlFor={`${idPrefix}-prof-age`}
                style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}
              >
                Yaş
              </label>
              <input
                id={`${idPrefix}-prof-age`}
                type="text"
                inputMode="numeric"
                value={ageStr}
                onChange={(e) => setAgeStr(sanitizeIntegerInput(e.target.value))}
                onFocus={selectAllOnFocus}
                className="form-input"
                style={{ minHeight: 42, fontSize: 16, textAlign: 'center', fontWeight: 800, padding: '6px' }}
              />
            </div>

            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, padding: 0 }}>
                Cinsiyet
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {[
                  { id: 'male', label: 'Erkek' },
                  { id: 'female', label: 'Kadın' }
                ].map((g) => {
                  const active = gender === g.id;
                  return (
                    <label
                      key={g.id}
                      style={{
                        minHeight: 42,
                        borderRadius: 'var(--radius-sm)',
                        border: active ? '1.5px solid var(--cyan)' : '1px solid var(--border)',
                        background: active ? 'rgba(56, 189, 248, 0.15)' : 'var(--input-bg)',
                        color: active ? '#ffffff' : 'var(--text-muted)',
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={g.id}
                        checked={active}
                        onChange={() => setGender(g.id as Gender)}
                        style={{
                          position: 'absolute',
                          clipPath: 'inset(50%)',
                          overflow: 'hidden',
                          width: 1,
                          height: 1,
                          margin: -1,
                          padding: 0,
                          border: 0,
                          whiteSpace: 'nowrap'
                        }}
                      />
                      {g.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              minHeight: 42,
              fontSize: 13,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)'
            }}
          >
            Bilgileri Güncelle
          </button>
        </form>
      )}

      {/* AÇILIR PANEL 2: HEDEF KİLO VE YAĞ ORANI BELİRLEME */}
      {activeSheet === 'target' && (
        <form
          onSubmit={handleSaveTargets}
          className="card"
          style={{
            padding: '14px',
            marginBottom: 0,
            border: '1px solid rgba(251, 191, 36, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>
              Vücut Hedefi Belirle
            </span>
            <button
              type="button"
              onClick={() => setActiveSheet('none')}
              className="btn-icon"
              aria-label="Kapat"
              style={{ width: 28, height: 28 }}
            >
              <X size={15} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label
                htmlFor={`${idPrefix}-targ-w`}
                style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}
              >
                Hedef Kilo (kg)
              </label>
              <input
                id={`${idPrefix}-targ-w`}
                type="text"
                inputMode="decimal"
                value={targetWeightStr}
                onChange={(e) => setTargetWeightStr(sanitizeDecimalInput(e.target.value))}
                onFocus={selectAllOnFocus}
                className="form-input"
                style={{ minHeight: 42, fontSize: 16, textAlign: 'center', fontWeight: 800 }}
              />
            </div>

            <div>
              <label
                htmlFor={`${idPrefix}-targ-bf`}
                style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}
              >
                Hedef Yağ Oranı (%)
              </label>
              <input
                id={`${idPrefix}-targ-bf`}
                type="text"
                inputMode="decimal"
                value={targetBfStr}
                onChange={(e) => setTargetBfStr(sanitizeDecimalInput(e.target.value))}
                onFocus={selectAllOnFocus}
                className="form-input"
                style={{ minHeight: 42, fontSize: 16, textAlign: 'center', fontWeight: 800 }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              minHeight: 42,
              fontSize: 13,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #d97706, #fbbf24)',
              color: '#0b0f17'
            }}
          >
            Hedefi Kaydet
          </button>
        </form>
      )}

      {/* 2. VÜCUT KOMPOZİSYONU & SKALA KARTI (2x2 Ferah Metrikler + Kütle Barı) */}
      <div className="card" style={{ padding: '14px', marginBottom: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            gap: 8
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Scale size={16} color="var(--cyan)" />
            <h3 style={{ fontSize: 14.5, fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Vücut Kompozisyonu
            </h3>
          </div>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 9px',
              borderRadius: 999,
              background: `${metrics.recompColor}18`,
              border: `1px solid ${metrics.recompColor}40`,
              fontSize: 11,
              fontWeight: 800,
              color: metrics.recompColor
            }}
          >
            {metrics.recompBadge}
          </span>
        </div>

        {/* 2x2 Ferah ve Okunaklı Ana Metrik Kartları (Taşma Yok, İçinde Kendi Skalası Var) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8,
            marginBottom: 12
          }}
        >
          {/* 1. Ağırlık & BMI */}
          <div
            onClick={() => {
              sounds.playPop();
              setSelectedMetric('weightKg');
            }}
            style={{
              background: selectedMetric === 'weightKg' ? 'rgba(56, 189, 248, 0.12)' : 'var(--input-bg)',
              border: selectedMetric === 'weightKg' ? '1.5px solid #38bdf8' : '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '11px 12px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 700 }}>Vücut Ağırlığı</span>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: '#38bdf8' }}>BMI {metrics.bmi}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit' }}>
                {metrics.weightKg} <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>kg</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)' }}>
                {profile.targetWeightKg ? `Hedef: ${profile.targetWeightKg}kg` : metrics.bmiCategory}
              </span>
            </div>
          </div>

          {/* 2. İskelet Kası & LBM */}
          <div
            onClick={() => {
              sounds.playPop();
              setSelectedMetric('muscleMassKg');
            }}
            style={{
              background: selectedMetric === 'muscleMassKg' ? 'rgba(16, 185, 129, 0.12)' : 'var(--input-bg)',
              border: selectedMetric === 'muscleMassKg' ? '1.5px solid var(--muscle-emerald)' : '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '11px 12px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 700 }}>İskelet Kası</span>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--muscle-emerald)' }}>
                %{massBreakdown.musclePct} Kütle
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--muscle-emerald)', fontFamily: 'Outfit' }}>
                {metrics.muscleMassKg} <span style={{ fontSize: 12, fontWeight: 600 }}>kg</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)' }}>
                LBM {metrics.leanBodyMassKg}kg
              </span>
            </div>
          </div>

          {/* 3. Yağ Oranı + Görsel Skala */}
          <div
            onClick={() => {
              sounds.playPop();
              setSelectedMetric('bodyFatPct');
            }}
            style={{
              background: selectedMetric === 'bodyFatPct' ? 'rgba(251, 191, 36, 0.12)' : 'var(--input-bg)',
              border: selectedMetric === 'bodyFatPct' ? '1.5px solid var(--gold)' : '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '11px 12px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 700 }}>Yağ Oranı</span>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--gold)' }}>{metrics.fatMassKg} kg</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--gold)', fontFamily: 'Outfit', margin: '3px 0 6px' }}>
              %{metrics.bodyFatPct}
            </div>
            <div
              style={{
                position: 'relative',
                height: 6,
                borderRadius: 999,
                background: 'linear-gradient(90deg, #38bdf8 0%, #10b981 35%, #fbbf24 70%, #ef4444 100%)'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: `${bfPinPct}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: '2px solid #0b0f17'
                }}
              />
            </div>
          </div>

          {/* 4. FFMI Kas İndeksi + Görsel Skala */}
          <div
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '11px 12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 700 }}>FFMI İndeks</span>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: metrics.ffmiColor }}>{metrics.ffmiTier}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: metrics.ffmiColor, fontFamily: 'Outfit', margin: '3px 0 6px' }}>
              {metrics.normalizedFfmi}
            </div>
            <div
              style={{
                position: 'relative',
                height: 6,
                borderRadius: 999,
                background: 'linear-gradient(90deg, #64748b 0%, #38bdf8 30%, #10b981 60%, #fbbf24 85%, #f43f5e 100%)'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: `${ffmiPinPct}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: '2px solid #0b0f17'
                }}
              />
            </div>
          </div>
        </div>

        {/* Kütle Dağılım Barı (Kas / Kemik & Su / Yağ) */}
        <div
          style={{
            background: 'rgba(11, 15, 23, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px'
          }}
        >
          <div
            style={{
              height: 10,
              borderRadius: 999,
              overflow: 'hidden',
              display: 'flex',
              gap: 2,
              background: 'rgba(255, 255, 255, 0.05)',
              marginBottom: 8
            }}
          >
            <div
              style={{
                width: `${massBreakdown.musclePct}%`,
                background: 'linear-gradient(90deg, #059669, #10b981)',
                height: '100%'
              }}
            />
            <div
              style={{
                width: `${massBreakdown.otherPct}%`,
                background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
                height: '100%'
              }}
            />
            <div
              style={{
                width: `${massBreakdown.fatPct}%`,
                background: 'linear-gradient(90deg, #d97706, #fbbf24)',
                height: '100%'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }} />
              <span>Kas: <strong style={{ color: '#fff' }}>{massBreakdown.muscleKg} kg</strong></span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#38bdf8' }} />
              <span>Kemik/Su: <strong style={{ color: '#fff' }}>{massBreakdown.otherLbmKg} kg</strong></span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#fbbf24' }} />
              <span>Yağ: <strong style={{ color: '#fff' }}>{massBreakdown.fatKg} kg</strong></span>
            </span>
          </div>
        </div>

        {/* Entegre Mezura Şeridi (Bel, Kol, Boyun + Mezura Gir) */}
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 700 }}>
              <Ruler size={13} color="#c084fc" />
              <span>Bel: <strong style={{ color: '#c084fc' }}>{latestMeasurement?.waistCm ? `${latestMeasurement.waistCm}cm` : '—'}</strong></span>
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 700 }}>
              Kol: <strong style={{ color: '#f43f5e' }}>{latestMeasurement?.armCm ? `${latestMeasurement.armCm}cm` : '—'}</strong>
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 700 }}>
              Boyun: <strong style={{ color: 'var(--cyan)' }}>{latestMeasurement?.neckCm ? `${latestMeasurement.neckCm}cm` : '—'}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              openMeasurementModal(true);
            }}
            style={{
              background: 'rgba(192, 132, 252, 0.14)',
              border: '1px solid rgba(192, 132, 252, 0.38)',
              color: '#e9d5ff',
              borderRadius: 'var(--radius-sm)',
              padding: '5px 9px',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0
            }}
          >
            <Plus size={12} />
            <span>Mezura</span>
          </button>
        </div>
      </div>

      {/* 4. GELİŞİM GRAFİĞİ & ÖLÇÜM GEÇMİŞİ (Birleşik, Taşmasız 4'lü Grid Sekme) */}
      <div className="card" style={{ padding: '14px', marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <TrendingUp size={16} color={activeMeta.color} />
            <h3 style={{ fontSize: 14.5, fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Gelişim Trendi & Kayıtlar
            </h3>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 700 }}>
            {reversedHistory.length} Kayıt
          </span>
        </div>

        {/* 4 Eşit Sütunlu Sekme: Asla Taşmaz, Yatay Scrollbar Çıkarmaz */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
            marginBottom: 12
          }}
        >
          {(Object.keys(metricMeta) as TrendMetric[]).map((key) => {
            const m = metricMeta[key];
            const active = selectedMetric === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setSelectedMetric(key);
                  setSelectedPointIdx(null);
                }}
                style={{
                  padding: '7px 4px',
                  borderRadius: 'var(--radius-sm)',
                  border: active ? `1.5px solid ${m.color}` : '1px solid var(--border)',
                  background: active ? `${m.color}20` : 'var(--input-bg)',
                  color: active ? '#ffffff' : 'var(--text-muted)',
                  fontSize: 11.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                {m.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Grafik (2+ kayıt varsa gösterilir) */}
        {chartPoints.length >= 2 && (
          (() => {
            const vals = chartPoints.map((p) => p.value);
            const targetVal = activeMeta.target;
            const allVals = targetVal ? [...vals, targetVal] : vals;
            const minV = Math.min(...allVals);
            const maxV = Math.max(...allVals);
            const range = Math.max(0.5, maxV - minV);
            const width = 360;
            const height = 112;
            const padX = 18;
            const padY = 18;

            const coords = chartPoints.map((pt, idx) => ({
              ...pt,
              x: padX + (idx / Math.max(1, chartPoints.length - 1)) * (width - padX * 2),
              y: height - padY - ((pt.value - minV) / range) * (height - padY * 2)
            }));

            const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ');
            const area = `${coords[0].x},${height - padY} ${polyline} ${coords[coords.length - 1].x},${height - padY}`;
            const firstVal = chartPoints[0].value;
            const lastVal = chartPoints[chartPoints.length - 1].value;
            const diff = Math.round((lastVal - firstVal) * 10) / 10;
            const activePt =
              selectedPointIdx !== null && coords[selectedPointIdx]
                ? coords[selectedPointIdx]
                : coords[coords.length - 1];

            const targetY =
              targetVal !== undefined
                ? height - padY - ((targetVal - minV) / range) * (height - padY * 2)
                : null;

            return (
              <div
                style={{
                  background: 'rgba(11, 15, 23, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px',
                  marginBottom: 12
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 11,
                    marginBottom: 6
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>
                    {activePt.shortDate}:{' '}
                    <strong style={{ color: '#ffffff' }}>
                      {activePt.value} {activeMeta.unit}
                    </strong>
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Değişim:{' '}
                    <strong style={{ color: activeMeta.color }}>
                      {diff > 0 ? `+${diff}` : diff} {activeMeta.unit}
                    </strong>
                  </span>
                </div>

                <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 112, display: 'block' }}>
                  <defs>
                    <linearGradient id="bodyTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={activeMeta.color} stopOpacity="0.32" />
                      <stop offset="100%" stopColor={activeMeta.color} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {targetY !== null && (
                    <g>
                      <line
                        x1={padX}
                        y1={targetY}
                        x2={width - padX}
                        y2={targetY}
                        stroke="var(--gold)"
                        strokeWidth="1.3"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={width - padX}
                        y={Math.max(10, targetY - 4)}
                        fill="var(--gold)"
                        fontSize="9"
                        fontWeight="800"
                        textAnchor="end"
                      >
                        Hedef: {targetVal} {activeMeta.unit}
                      </text>
                    </g>
                  )}

                  <polygon points={area} fill="url(#bodyTrendGrad)" />
                  <polyline
                    fill="none"
                    stroke={activeMeta.color}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polyline}
                  />

                  {coords.map((c, idx) => {
                    const isPicked =
                      selectedPointIdx === idx ||
                      (selectedPointIdx === null && idx === coords.length - 1);
                    return (
                      <g
                        key={c.date + idx}
                        onClick={() => {
                          sounds.playPop();
                          setSelectedPointIdx(idx);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle cx={c.x} cy={c.y} r={12} fill="transparent" />
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r={isPicked ? 4.5 : 2.8}
                          fill={isPicked ? activeMeta.color : '#0b0f17'}
                          stroke={activeMeta.color}
                          strokeWidth="2"
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
            );
          })()
        )}

        {/* Geçmiş Kayıtlar Listesi */}
        {reversedHistory.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(showAllHistory ? reversedHistory : reversedHistory.slice(0, 5)).map((entry, idx) => {
              const prevEntry = reversedHistory[idx + 1];
              const weightDiff = prevEntry
                ? Math.round((entry.weightKg - prevEntry.weightKg) * 10) / 10
                : 0;

              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    gap: 8
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, minWidth: 74 }}>
                      {formatDisplayDate(entry.date)}
                    </span>

                    <span style={{ fontSize: 14, fontWeight: 800, color: '#ffffff' }}>
                      {entry.weightKg} kg
                    </span>

                    {prevEntry && weightDiff !== 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: weightDiff > 0 ? 'var(--cyan)' : 'var(--muscle-emerald)',
                          background: weightDiff > 0 ? 'rgba(56, 189, 248, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          padding: '1px 5px',
                          borderRadius: 4
                        }}
                      >
                        {weightDiff > 0 ? `+${weightDiff}` : weightDiff} kg
                      </span>
                    )}

                    {entry.bodyFatPct !== undefined && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: 'var(--gold)',
                          background: 'rgba(251, 191, 36, 0.1)',
                          padding: '1px 6px',
                          borderRadius: 4
                        }}
                      >
                        %{entry.bodyFatPct} Yağ
                      </span>
                    )}

                    {entry.muscleMassKg !== undefined && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: 'var(--muscle-emerald)',
                          background: 'rgba(16, 185, 129, 0.1)',
                          padding: '1px 6px',
                          borderRadius: 4
                        }}
                      >
                        {entry.muscleMassKg} kg Kas
                      </span>
                    )}

                    {(entry.waistCm || entry.armCm) && (
                      <span style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>
                        {entry.waistCm ? `Bel ${entry.waistCm}cm ` : ''}
                        {entry.armCm ? `Kol ${entry.armCm}cm` : ''}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteBodyMeasurement(entry.id)}
                    className="btn-icon"
                    title="Kaydı Sil"
                    aria-label={`${entry.date} ölçümünü sil`}
                    style={{ width: 28, height: 28, color: 'var(--text-dim)', flexShrink: 0 }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}

            {reversedHistory.length > 5 && (
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setShowAllHistory((prev) => !prev);
                }}
                style={{
                  marginTop: 2,
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  fontSize: 11.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                {showAllHistory
                  ? 'Daha Az Göster'
                  : `Tüm Kayıtları Göster (+${reversedHistory.length - 5})`}
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(11, 15, 23, 0.45)',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 12px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 12
            }}
          >
            <History size={20} color="var(--cyan)" style={{ marginBottom: 6, opacity: 0.8 }} />
            <div>
              Henüz ölçüm geçmişi yok. En üstteki <strong>Yeni Vücut Ölçümü Ekle</strong> butonuna dokunarak ilk kaydınızı oluşturun; zaman içindeki kilo, yağ ve kas değişim grafiğiniz burada çizilecektir.
            </div>
          </div>
        )}
      </div>

      {/* YENİ ÖLÇÜM EKLEME MODALI (Native <dialog>) */}
      <dialog
        ref={dialogRef}
        className="measurement-dialog"
        aria-labelledby={`${idPrefix}-dialog-title`}
        {...({ closedby: 'any' } as any)}
      >
        <form
          onSubmit={handleSaveEntry}
          style={{
            border: '1px solid rgba(56, 189, 248, 0.35)',
            background: 'linear-gradient(180deg, #162032 0%, #0d131f 100%)',
            borderRadius: 'var(--radius-xl)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75)',
            maxHeight: 'calc(100dvh - 48px)',
            overflowY: 'auto'
          }}
        >
          {/* Modal Başlığı + Tarih Seçici + Kapat */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Scale size={17} color="var(--cyan)" />
              <h3
                id={`${idPrefix}-dialog-title`}
                style={{ fontSize: 15, fontWeight: 900, color: '#ffffff', margin: 0 }}
              >
                Yeni Ölçüm Ekle
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <label
                  htmlFor={`${idPrefix}-date`}
                  style={{ position: 'absolute', left: 8, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}
                >
                  <Calendar size={12} color="var(--cyan)" />
                </label>
                <input
                  id={`${idPrefix}-date`}
                  name="entryDate"
                  type="date"
                  max={getTodayLocalDate()}
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="form-input"
                  aria-label="Ölçüm Tarihi"
                  style={{
                    height: 32,
                    fontSize: 16,
                    padding: '2px 8px 2px 26px',
                    borderRadius: 8,
                    width: 'auto',
                    background: 'rgba(255, 255, 255, 0.05)'
                  }}
                  required
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  closeMeasurementModal();
                }}
                className="btn-icon"
                aria-label="Kapat"
                style={{ width: 30, height: 30 }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Güncel Ağırlık (kg) Stepper */}
          <div
            style={{
              background: 'rgba(11, 15, 23, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px'
            }}
          >
            <label
              htmlFor={`${idPrefix}-weight`}
              style={{
                display: 'block',
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-muted)',
                marginBottom: 6
              }}
            >
              Güncel Ağırlık (kg)
            </label>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <button
                type="button"
                onClick={() => adjustWeight(-0.5)}
                style={{
                  minHeight: 46,
                  minWidth: 46,
                  padding: '0 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                -0.5
              </button>

              <button
                type="button"
                onClick={() => adjustWeight(-0.1)}
                style={{
                  minHeight: 46,
                  minWidth: 46,
                  padding: '0 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                -0.1
              </button>

              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  id={`${idPrefix}-weight`}
                  name="weightKg"
                  type="text"
                  inputMode="decimal"
                  enterKeyHint="done"
                  placeholder={String(profile.bodyWeightKg || 75)}
                  value={weightStr}
                  onChange={(e) => setWeightStr(sanitizeDecimalInput(e.target.value))}
                  onFocus={selectAllOnFocus}
                  onBlur={() => {
                    if (weightStr.endsWith('.')) {
                      setWeightStr(weightStr.slice(0, -1));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      adjustWeight(0.1);
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      adjustWeight(-0.1);
                    }
                  }}
                  className="form-input"
                  style={{
                    minHeight: 46,
                    fontSize: 22,
                    fontWeight: 900,
                    fontFamily: 'Outfit',
                    textAlign: 'center',
                    color: 'var(--cyan)',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1.5px solid rgba(56, 189, 248, 0.35)',
                    padding: '4px 8px'
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => adjustWeight(0.1)}
                style={{
                  minHeight: 46,
                  minWidth: 46,
                  padding: '0 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                +0.1
              </button>

              <button
                type="button"
                onClick={() => adjustWeight(0.5)}
                style={{
                  minHeight: 46,
                  minWidth: 46,
                  padding: '0 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                +0.5
              </button>
            </div>
          </div>

          {/* Opsiyonel Detay Seçiciler */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              aria-expanded={showExtraComp}
              onClick={() => {
                sounds.playPop();
                setShowExtraComp((p) => !p);
              }}
              style={{
                flex: 1,
                minHeight: 42,
                borderRadius: 'var(--radius-sm)',
                border: showExtraComp ? '1px solid var(--gold)' : '1px solid var(--border)',
                background: showExtraComp ? 'rgba(251, 191, 36, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                color: showExtraComp ? 'var(--gold)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5
              }}
            >
              <Percent size={14} />
              <span>{showExtraComp ? 'Yağ & Kas Gizle' : '+ Yağ / Kas Oranı'}</span>
            </button>

            <button
              type="button"
              aria-expanded={showTapeInputs}
              onClick={() => {
                sounds.playPop();
                setShowTapeInputs((p) => !p);
              }}
              style={{
                flex: 1,
                minHeight: 42,
                borderRadius: 'var(--radius-sm)',
                border: showTapeInputs ? '1px solid #c084fc' : '1px solid var(--border)',
                background: showTapeInputs ? 'rgba(192, 132, 252, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                color: showTapeInputs ? '#c084fc' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5
              }}
            >
              <Ruler size={14} />
              <span>{showTapeInputs ? 'Mezurayı Gizle' : '+ Mezura (Bel/Kol)'}</span>
            </button>
          </div>

          {showExtraComp && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div>
                <label
                  htmlFor={`${idPrefix}-bf`}
                  style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}
                >
                  Yağ Oranı (%)
                </label>
                <input
                  id={`${idPrefix}-bf`}
                  name="bodyFatPct"
                  type="text"
                  inputMode="decimal"
                  enterKeyHint="next"
                  placeholder={`Tahmini: %${metrics.bodyFatPct}`}
                  value={bodyFatStr}
                  onChange={(e) => setBodyFatStr(sanitizeDecimalInput(e.target.value))}
                  onFocus={selectAllOnFocus}
                  className="form-input"
                  style={{ minHeight: 42, fontSize: 16, textAlign: 'center', fontWeight: 700 }}
                />
              </div>

              <div>
                <label
                  htmlFor={`${idPrefix}-muscle`}
                  style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}
                >
                  İskelet Kası (kg)
                </label>
                <input
                  id={`${idPrefix}-muscle`}
                  name="muscleMassKg"
                  type="text"
                  inputMode="decimal"
                  enterKeyHint="done"
                  placeholder={`Tahmini: ${metrics.muscleMassKg}`}
                  value={muscleMassStr}
                  onChange={(e) => setMuscleMassStr(sanitizeDecimalInput(e.target.value))}
                  onFocus={selectAllOnFocus}
                  className="form-input"
                  style={{ minHeight: 42, fontSize: 16, textAlign: 'center', fontWeight: 700 }}
                />
              </div>
            </div>
          )}

          {showTapeInputs && (
            <div
              style={{
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <div>
                  <label
                    htmlFor={`${idPrefix}-waist`}
                    style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}
                  >
                    Bel (cm)
                  </label>
                  <input
                    id={`${idPrefix}-waist`}
                    name="waistCm"
                    type="text"
                    inputMode="decimal"
                    enterKeyHint="next"
                    placeholder="82"
                    value={waistStr}
                    onChange={(e) => setWaistStr(sanitizeDecimalInput(e.target.value))}
                    onFocus={selectAllOnFocus}
                    className="form-input"
                    style={{ minHeight: 42, fontSize: 16, textAlign: 'center' }}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`${idPrefix}-neck`}
                    style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}
                  >
                    Boyun (cm)
                  </label>
                  <input
                    id={`${idPrefix}-neck`}
                    name="neckCm"
                    type="text"
                    inputMode="decimal"
                    enterKeyHint="next"
                    placeholder="39"
                    value={neckStr}
                    onChange={(e) => setNeckStr(sanitizeDecimalInput(e.target.value))}
                    onFocus={selectAllOnFocus}
                    className="form-input"
                    style={{ minHeight: 42, fontSize: 16, textAlign: 'center' }}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`${idPrefix}-arm`}
                    style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}
                  >
                    Kol (cm)
                  </label>
                  <input
                    id={`${idPrefix}-arm`}
                    name="armCm"
                    type="text"
                    inputMode="decimal"
                    enterKeyHint="done"
                    placeholder="38"
                    value={armStr}
                    onChange={(e) => setArmStr(sanitizeDecimalInput(e.target.value))}
                    onFocus={selectAllOnFocus}
                    className="form-input"
                    style={{ minHeight: 42, fontSize: 16, textAlign: 'center' }}
                  />
                </div>
              </div>

              {navyBf !== null ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    fontSize: 11.5
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calculator size={13} color="var(--gold)" />
                    <span>
                      US Navy Yağ Tahmini: <strong style={{ color: 'var(--gold)' }}>%{navyBf}</strong>
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSuccess();
                      setBodyFatStr(String(navyBf));
                      setShowExtraComp(true);
                    }}
                    style={{
                      background: 'var(--gold)',
                      color: '#0b0f17',
                      border: 'none',
                      borderRadius: 5,
                      padding: '4px 8px',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Uygula
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>
                  Bel ve boyun ölçünüzü girerseniz US Navy formülü ile yağ oranınız otomatik hesaplanır.
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              minHeight: 48,
              fontSize: 14.5,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #059669, #10b981)',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Check size={18} />
            <span>Ölçümü Kaydet</span>
          </button>
        </form>
      </dialog>
    </div>
  );
};
