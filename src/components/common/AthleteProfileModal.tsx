import React, { useState, useEffect, useMemo, useId } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useBackButton } from '../../context/BackNavigationContext';
import { Gender } from '../../types/workout';
import { calculateBodyCompositionMetrics, estimateNavyBodyFatPct } from '../../utils/scientificCalculations';
import { getTodayLocalDate } from '../../utils/dateUtils';
import {
  sanitizeDecimalInput,
  sanitizeIntegerInput,
  parseDecimalOrFallback,
  parseIntOrFallback,
  selectAllOnFocus
} from '../../utils/inputUtils';
import { sounds } from '../../utils/audio';
import {
  X,
  Scale,
  Save,
  Check,
  TrendingUp,
  Activity,
  Ruler,
  Trash2,
  Calculator,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calendar
} from 'lucide-react';

type ChartMetric = 'weightKg' | 'bodyFatPct' | 'muscleMassKg' | 'waistCm';

export const AthleteProfileModal: React.FC = () => {
  const {
    profile,
    updateProfile,
    logBodyMeasurement,
    deleteBodyMeasurement,
    isProfileModalOpen,
    setIsProfileModalOpen,
    profileModalInitialTab,
    setActiveTab: setMainAppTab
  } = useWorkout();

  const formIdPrefix = useId();
  const [activeTab, setActiveTab] = useState<'entry' | 'trends'>('entry');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('weightKg');
  const [showTapeCalculator, setShowTapeCalculator] = useState<boolean>(false);

  // Form states
  const [entryDate, setEntryDate] = useState<string>(getTodayLocalDate());
  const [weightStr, setWeightStr] = useState<string>(String(profile.bodyWeightKg || 75));
  const [heightStr, setHeightStr] = useState<string>(String(profile.heightCm || 178));
  const [bodyFatStr, setBodyFatStr] = useState<string>(
    profile.bodyFatPct !== undefined ? String(profile.bodyFatPct) : ''
  );
  const [muscleMassStr, setMuscleMassStr] = useState<string>(
    profile.muscleMassKg !== undefined ? String(profile.muscleMassKg) : ''
  );
  const [waistStr, setWaistStr] = useState<string>('');
  const [neckStr, setNeckStr] = useState<string>('');
  const [hipStr, setHipStr] = useState<string>('');
  const [armStr, setArmStr] = useState<string>('');
  const [gender, setGender] = useState<Gender>(profile.gender || 'male');
  const [ageStr, setAgeStr] = useState<string>(String(profile.age || 25));
  const [goal, setGoal] = useState<'hypertrophy' | 'strength' | 'endurance'>(
    profile.trainingGoal || 'hypertrophy'
  );

  const weight = parseDecimalOrFallback(weightStr, profile.bodyWeightKg || 75);
  const heightCm = parseIntOrFallback(
    heightStr,
    profile.heightCm || (profile.gender === 'female' ? 165 : 178)
  );
  const age = parseIntOrFallback(ageStr, profile.age || 25);

  useBackButton(
    isProfileModalOpen,
    () => {
      sounds.playPop();
      setIsProfileModalOpen(false);
    },
    75
  );

  useEffect(() => {
    if (isProfileModalOpen) {
      setActiveTab(profileModalInitialTab || 'entry');
      setEntryDate(getTodayLocalDate());
      setWeightStr(String(profile.bodyWeightKg || 75));
      setHeightStr(String(profile.heightCm || (profile.gender === 'female' ? 165 : 178)));
      setBodyFatStr(profile.bodyFatPct !== undefined ? String(profile.bodyFatPct) : '');
      setMuscleMassStr(profile.muscleMassKg !== undefined ? String(profile.muscleMassKg) : '');
      setGender(profile.gender || 'male');
      setAgeStr(String(profile.age || 25));
      setGoal(profile.trainingGoal || 'hypertrophy');

      // Pre-fill tape measurements from latest entry if available
      const sorted = [...(profile.measurements || [])].sort((a, b) => a.date.localeCompare(b.date));
      const latest = sorted[sorted.length - 1];
      setWaistStr(latest?.waistCm !== undefined ? String(latest.waistCm) : '');
      setNeckStr(latest?.neckCm !== undefined ? String(latest.neckCm) : '');
      setHipStr(latest?.hipCm !== undefined ? String(latest.hipCm) : '');
      setArmStr(latest?.armCm !== undefined ? String(latest.armCm) : '');
    }
  }, [isProfileModalOpen, profile, profileModalInitialTab]);

  // Live preview of body composition metrics while editing
  const parsedBf = parseFloat(bodyFatStr);
  const parsedMuscle = parseFloat(muscleMassStr);
  const liveMetrics = useMemo(() => {
    return calculateBodyCompositionMetrics(profile, {
      weightKg: weight,
      heightCm,
      bodyFatPct: !isNaN(parsedBf) && parsedBf > 0 ? parsedBf : undefined,
      muscleMassKg: !isNaN(parsedMuscle) && parsedMuscle > 0 ? parsedMuscle : undefined,
      gender
    });
  }, [profile, weight, heightCm, parsedBf, parsedMuscle, gender]);

  // US Navy Body Fat estimation preview
  const navyEstimatedBf = useMemo(() => {
    const w = parseFloat(waistStr);
    const n = parseFloat(neckStr);
    const h = parseFloat(hipStr);
    if (isNaN(w) || isNaN(n)) return null;
    return estimateNavyBodyFatPct(gender, heightCm, w, n, !isNaN(h) ? h : undefined);
  }, [gender, heightCm, waistStr, neckStr, hipStr]);

  // Sorted measurements for Trends tab
  const sortedMeasurements = useMemo(() => {
    const list = [...(profile.measurements || [])].sort((a, b) => a.date.localeCompare(b.date));
    if (list.length === 0) {
      return [
        {
          id: 'current-preview',
          date: getTodayLocalDate(),
          weightKg: profile.bodyWeightKg || 75,
          bodyFatPct: profile.bodyFatPct ?? liveMetrics.bodyFatPct,
          muscleMassKg: profile.muscleMassKg ?? liveMetrics.muscleMassKg,
          createdAt: Date.now()
        }
      ];
    }
    return list;
  }, [profile.measurements, profile.bodyWeightKg, profile.bodyFatPct, profile.muscleMassKg, liveMetrics]);

  if (!isProfileModalOpen) return null;

  const handleApplyNavyBf = () => {
    if (navyEstimatedBf !== null) {
      sounds.playSuccess();
      setBodyFatStr(String(navyEstimatedBf));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const safeWeight = Math.max(30, Math.min(250, weight));
    const safeHeight = Math.max(130, Math.min(230, heightCm));
    const safeBf = !isNaN(parsedBf) && parsedBf >= 3 && parsedBf <= 55 ? Math.round(parsedBf * 10) / 10 : undefined;
    const safeMuscle =
      !isNaN(parsedMuscle) && parsedMuscle >= 15 && parsedMuscle < safeWeight
        ? Math.round(parsedMuscle * 10) / 10
        : undefined;

    const wCm = parseFloat(waistStr);
    const nCm = parseFloat(neckStr);
    const hCm = parseFloat(hipStr);
    const aCm = parseFloat(armStr);

    // 1. Update static profile fields
    updateProfile({
      bodyWeightKg: safeWeight,
      heightCm: safeHeight,
      bodyFatPct: safeBf,
      muscleMassKg: safeMuscle,
      gender,
      age: Math.max(12, Math.min(100, age)),
      trainingGoal: goal
    });

    // 2. Log dated body measurement entry
    logBodyMeasurement({
      date: entryDate || getTodayLocalDate(),
      weightKg: safeWeight,
      bodyFatPct: safeBf ?? liveMetrics.bodyFatPct,
      muscleMassKg: safeMuscle ?? liveMetrics.muscleMassKg,
      waistCm: !isNaN(wCm) && wCm > 40 ? Math.round(wCm * 10) / 10 : undefined,
      neckCm: !isNaN(nCm) && nCm > 20 ? Math.round(nCm * 10) / 10 : undefined,
      hipCm: !isNaN(hCm) && hCm > 50 ? Math.round(hCm * 10) / 10 : undefined,
      armCm: !isNaN(aCm) && aCm > 15 ? Math.round(aCm * 10) / 10 : undefined
    });

    setIsProfileModalOpen(false);
  };

  const handleClose = () => {
    sounds.playPop();
    setIsProfileModalOpen(false);
  };

  // Prepare SVG Chart points for active chartMetric
  const chartPoints = sortedMeasurements
    .map((m) => {
      let val: number | undefined;
      if (chartMetric === 'weightKg') val = m.weightKg;
      else if (chartMetric === 'bodyFatPct') val = m.bodyFatPct;
      else if (chartMetric === 'muscleMassKg') val = m.muscleMassKg;
      else if (chartMetric === 'waistCm') val = m.waistCm;
      return val !== undefined && val > 0 ? { date: m.date, value: val } : null;
    })
    .filter((item): item is { date: string; value: number } => item !== null)
    .slice(-16); // Show up to last 16 measurements clearly

  const chartColor =
    chartMetric === 'weightKg'
      ? '#38bdf8'
      : chartMetric === 'bodyFatPct'
      ? '#fbbf24'
      : chartMetric === 'muscleMassKg'
      ? '#10b981'
      : '#c084fc';

  const chartUnit = chartMetric === 'bodyFatPct' ? '%' : chartMetric === 'waistCm' ? 'cm' : 'kg';

  return (
    <div
      className="modal-backdrop"
      onClick={handleClose}
      style={{
        zIndex: 1100,
        padding: 'calc(12px + var(--safe-top, 0px)) 12px calc(12px + var(--safe-bottom, 0px)) 12px'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 460,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #162032 0%, #0d131f 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 30px rgba(56, 189, 248, 0.15)',
          borderRadius: 'var(--radius-xl)',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 18px 12px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cyan)'
              }}
            >
              <Scale size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                Vücut Analizi & Ölçümler
              </h3>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Kilo, yağ oranı, kas kütlesi (FFMI) ve mezura takibi
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsProfileModalOpen(false);
                setMainAppTab('body');
              }}
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: 'var(--cyan)',
                borderRadius: 8,
                padding: '5px 8px',
                fontSize: 10.5,
                fontWeight: 800,
                cursor: 'pointer'
              }}
              title="Tam Sayfa Vücut Analizini Aç"
            >
              Tam Sayfa ➔
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="btn-icon"
              aria-label="Kapat"
              style={{ width: 32, height: 32, borderRadius: '50%' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Segmented Tab Switcher */}
        <div style={{ padding: '10px 18px 0 18px' }}>
          <div className="segment-control" style={{ marginBottom: 0 }}>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setActiveTab('entry');
              }}
              className={`segment-btn ${activeTab === 'entry' ? 'active' : ''}`}
            >
              <Activity size={14} />
              <span>Ölçüm & Profil</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setActiveTab('trends');
              }}
              className={`segment-btn ${activeTab === 'trends' ? 'active' : ''}`}
            >
              <TrendingUp size={14} />
              <span>Gelişim Trendi ({(profile.measurements || []).length})</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '14px 18px 18px 18px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'entry' ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Canlı Bilimsel Vücut Kompozisyonu Özeti */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(56, 189, 248, 0.22)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 6,
                  textAlign: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>FFMI (Kas)</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: liveMetrics.ffmiColor, fontFamily: 'Outfit' }}>
                    {liveMetrics.normalizedFfmi}
                  </div>
                  <div style={{ fontSize: 9.5, color: liveMetrics.ffmiColor, fontWeight: 700 }}>
                    {liveMetrics.ffmiTier}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Yağsız (LBM)</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit' }}>
                    {liveMetrics.leanBodyMassKg} <span style={{ fontSize: 10, fontWeight: 600 }}>kg</span>
                  </div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-dim)' }}>
                    Yağ: {liveMetrics.fatMassKg} kg
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>İskelet Kası</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--muscle-emerald)', fontFamily: 'Outfit' }}>
                    {liveMetrics.muscleMassKg} <span style={{ fontSize: 10, fontWeight: 600 }}>kg</span>
                  </div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-dim)' }}>
                    {liveMetrics.isMuscleEstimated ? 'Tahmini' : 'Ölçülen'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>BMI</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--cyan)', fontFamily: 'Outfit' }}>
                    {liveMetrics.bmi}
                  </div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-dim)' }}>
                    {liveMetrics.bmiCategory}
                  </div>
                </div>
              </div>

              {/* Ölçüm Tarihi & Boy (cm) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 10 }}>
                <div>
                  <label
                    htmlFor={`${formIdPrefix}-date`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#ffffff',
                      marginBottom: 5
                    }}
                  >
                    <Calendar size={13} color="var(--cyan)" />
                    <span>Ölçüm Tarihi</span>
                  </label>
                  <input
                    id={`${formIdPrefix}-date`}
                    name="entryDate"
                    type="date"
                    value={entryDate}
                    max={getTodayLocalDate()}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="form-input"
                    style={{ height: 42, fontSize: 16 }}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor={`${formIdPrefix}-height`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#ffffff',
                      marginBottom: 5
                    }}
                  >
                    <span>Boy</span>
                    <span style={{ color: 'var(--cyan)', fontWeight: 800 }}>{heightCm} cm</span>
                  </label>
                  <input
                    id={`${formIdPrefix}-height`}
                    name="heightCm"
                    type="text"
                    inputMode="numeric"
                    enterKeyHint="next"
                    placeholder={String(profile.heightCm || 178)}
                    value={heightStr}
                    onChange={(e) => setHeightStr(sanitizeIntegerInput(e.target.value))}
                    onFocus={selectAllOnFocus}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setHeightStr(String(Math.min(230, heightCm + 1)));
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setHeightStr(String(Math.max(130, heightCm - 1)));
                      }
                    }}
                    className="form-input"
                    style={{ height: 42, fontSize: 16, fontWeight: 800, textAlign: 'center' }}
                  />
                </div>
              </div>

              {/* Vücut Ağırlığı */}
              <div>
                <label
                  htmlFor={`${formIdPrefix}-weight`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#ffffff',
                    marginBottom: 5
                  }}
                >
                  <span>Vücut Ağırlığı (Kilo)</span>
                  <span style={{ color: 'var(--cyan)', fontWeight: 800 }}>{weight} kg</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    id={`${formIdPrefix}-weight`}
                    name="weightKg"
                    type="text"
                    inputMode="decimal"
                    enterKeyHint="next"
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
                        setWeightStr(String(Math.min(250, Math.round((weight + 0.1) * 10) / 10)));
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setWeightStr(String(Math.max(30, Math.round((weight - 0.1) * 10) / 10)));
                      }
                    }}
                    aria-describedby={`${formIdPrefix}-weight-help`}
                    className="form-input"
                    style={{ fontSize: 16, fontWeight: 800, textAlign: 'center', height: 42 }}
                  />
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[-1, -0.5, +0.5, +1].map((delta) => (
                      <button
                        key={delta}
                        type="button"
                        onClick={() => {
                          sounds.playPop();
                          const next = Math.max(30, Math.min(250, Math.round((weight + delta) * 10) / 10));
                          setWeightStr(String(next));
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-muted)',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '8px 8px',
                          cursor: 'pointer'
                        }}
                      >
                        {delta > 0 ? `+${delta}` : delta}
                      </button>
                    ))}
                  </div>
                </div>
                <div id={`${formIdPrefix}-weight-help`} style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 4 }}>
                  Kaldırdığınız ağırlıkların vücut kütlenize oranını (Rölatif Güç) ve gelişim grafiğinizi günceller.
                </div>
              </div>

              {/* Yağ Oranı (%) ve Kas Kütlesi (kg) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label
                    htmlFor={`${formIdPrefix}-bf`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#ffffff',
                      marginBottom: 5
                    }}
                  >
                    <span>Yağ Oranı (%)</span>
                    <span style={{ color: 'var(--gold)', fontWeight: 800 }}>
                      %{liveMetrics.bodyFatPct}
                    </span>
                  </label>
                  <input
                    id={`${formIdPrefix}-bf`}
                    name="bodyFatPct"
                    type="text"
                    inputMode="decimal"
                    enterKeyHint="next"
                    placeholder={`Tahmini: %${liveMetrics.bodyFatPct}`}
                    value={bodyFatStr}
                    onChange={(e) => setBodyFatStr(sanitizeDecimalInput(e.target.value))}
                    onFocus={selectAllOnFocus}
                    className="form-input"
                    style={{ height: 42, fontSize: 16, textAlign: 'center' }}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`${formIdPrefix}-muscle`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#ffffff',
                      marginBottom: 5
                    }}
                  >
                    <span>Kas Kütlesi (kg)</span>
                    <span style={{ color: 'var(--muscle-emerald)', fontWeight: 800 }}>
                      {liveMetrics.muscleMassKg} kg
                    </span>
                  </label>
                  <input
                    id={`${formIdPrefix}-muscle`}
                    name="muscleMassKg"
                    type="text"
                    inputMode="decimal"
                    enterKeyHint="next"
                    placeholder={`Tahmini: ${liveMetrics.muscleMassKg} kg`}
                    value={muscleMassStr}
                    onChange={(e) => setMuscleMassStr(sanitizeDecimalInput(e.target.value))}
                    onFocus={selectAllOnFocus}
                    className="form-input"
                    style={{ height: 42, fontSize: 16, textAlign: 'center' }}
                  />
                </div>
              </div>

              {/* Mezura & US Navy Otomatik Yağ Oranı Hesaplayıcı (Açılır Panel) */}
              <div
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  overflow: 'hidden'
                }}
              >
                <button
                  type="button"
                  aria-expanded={showTapeCalculator}
                  aria-controls={`${formIdPrefix}-tape-panel`}
                  onClick={() => {
                    sounds.playPop();
                    setShowTapeCalculator((prev) => !prev);
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Ruler size={14} color="var(--gold)" />
                    <span>Mezura Ölçümleri & Yağ Oranı Hesaplayıcı (Opsiyonel)</span>
                  </span>
                  {showTapeCalculator ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {showTapeCalculator && (
                  <div
                    id={`${formIdPrefix}-tape-panel`}
                    style={{
                      padding: '10px 12px 12px 12px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10
                    }}
                  >
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Akıllı tartınız yoksa <strong>Bel</strong> ve <strong>Boyun</strong> çevrenizi (cm) girerek US Navy formülüyle yağ oranınızı hesaplayabilirsiniz.
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      <div>
                        <label
                          htmlFor={`${formIdPrefix}-waist`}
                          style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', display: 'block', marginBottom: 4 }}
                        >
                          Bel (cm)
                        </label>
                        <input
                          id={`${formIdPrefix}-waist`}
                          name="waistCm"
                          type="text"
                          inputMode="decimal"
                          enterKeyHint="next"
                          placeholder="82"
                          value={waistStr}
                          onChange={(e) => setWaistStr(sanitizeDecimalInput(e.target.value))}
                          onFocus={selectAllOnFocus}
                          className="form-input"
                          style={{ height: 38, fontSize: 16, textAlign: 'center' }}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`${formIdPrefix}-neck`}
                          style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', display: 'block', marginBottom: 4 }}
                        >
                          Boyun (cm)
                        </label>
                        <input
                          id={`${formIdPrefix}-neck`}
                          name="neckCm"
                          type="text"
                          inputMode="decimal"
                          enterKeyHint="next"
                          placeholder="39"
                          value={neckStr}
                          onChange={(e) => setNeckStr(sanitizeDecimalInput(e.target.value))}
                          onFocus={selectAllOnFocus}
                          className="form-input"
                          style={{ height: 38, fontSize: 16, textAlign: 'center' }}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`${formIdPrefix}-arm`}
                          style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', display: 'block', marginBottom: 4 }}
                        >
                          Kol / Biceps (cm)
                        </label>
                        <input
                          id={`${formIdPrefix}-arm`}
                          name="armCm"
                          type="text"
                          inputMode="decimal"
                          enterKeyHint="next"
                          placeholder="38"
                          value={armStr}
                          onChange={(e) => setArmStr(sanitizeDecimalInput(e.target.value))}
                          onFocus={selectAllOnFocus}
                          className="form-input"
                          style={{ height: 38, fontSize: 16, textAlign: 'center' }}
                        />
                      </div>
                    </div>

                    {navyEstimatedBf !== null && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(251, 191, 36, 0.1)',
                          border: '1px solid rgba(251, 191, 36, 0.3)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '7px 10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
                          <Calculator size={14} color="var(--gold)" />
                          <span>
                            US Navy Tahmini: <strong style={{ color: 'var(--gold)' }}>%{navyEstimatedBf} Yağ</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyNavyBf}
                          style={{
                            background: 'var(--gold)',
                            color: '#0b0f17',
                            border: 'none',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Uygula
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cinsiyet & Yaş */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.65fr', gap: 10 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginBottom: 5, display: 'block' }}>
                    Cinsiyet
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        setGender('male');
                      }}
                      style={{
                        height: 40,
                        borderRadius: 'var(--radius-md)',
                        border: gender === 'male' ? '1.5px solid var(--cyan)' : '1px solid var(--border)',
                        background: gender === 'male' ? 'rgba(56, 189, 248, 0.15)' : 'var(--input-bg)',
                        color: gender === 'male' ? '#ffffff' : 'var(--text-muted)',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <span>Erkek</span>
                      {gender === 'male' && <Check size={13} color="var(--cyan)" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        setGender('female');
                      }}
                      style={{
                        height: 40,
                        borderRadius: 'var(--radius-md)',
                        border: gender === 'female' ? '1.5px solid #ec4899' : '1px solid var(--border)',
                        background: gender === 'female' ? 'rgba(236, 72, 153, 0.15)' : 'var(--input-bg)',
                        color: gender === 'female' ? '#ffffff' : 'var(--text-muted)',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <span>Kadın</span>
                      {gender === 'female' && <Check size={13} color="#ec4899" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={`${formIdPrefix}-age`}
                    style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginBottom: 5, display: 'block' }}
                  >
                    Yaş
                  </label>
                  <input
                    id={`${formIdPrefix}-age`}
                    name="age"
                    type="text"
                    inputMode="numeric"
                    enterKeyHint="done"
                    placeholder={String(profile.age || 25)}
                    value={ageStr}
                    onChange={(e) => setAgeStr(sanitizeIntegerInput(e.target.value))}
                    onFocus={selectAllOnFocus}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setAgeStr(String(Math.min(99, age + 1)));
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setAgeStr(String(Math.max(12, age - 1)));
                      }
                    }}
                    className="form-input"
                    style={{ textAlign: 'center', height: 40, fontSize: 16, fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* Antrenman Odağı (Görünür 3 Seçenekli Radyo Buton Grubu - Sıfır Tıklamayla Tarama) */}
              <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                <legend style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginBottom: 6, padding: 0 }}>
                  Antrenman Odağı
                </legend>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {[
                    { id: 'hypertrophy', label: 'Hipertrofi', sub: 'Kas İnşası' },
                    { id: 'strength', label: 'Maks. Güç', sub: '1RM Odaklı' },
                    { id: 'endurance', label: 'Dayanıklılık', sub: 'Kondisyon' }
                  ].map((opt) => {
                    const isSelected = goal === opt.id;
                    return (
                      <label
                        key={opt.id}
                        style={{
                          padding: '8px 6px',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '1.5px solid var(--cyan)' : '1px solid var(--border)',
                          background: isSelected ? 'rgba(56, 189, 248, 0.14)' : 'var(--input-bg)',
                          color: isSelected ? '#ffffff' : 'var(--text-muted)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2
                        }}
                      >
                        <input
                          type="radio"
                          name="trainingGoal"
                          value={opt.id}
                          checked={isSelected}
                          onChange={() => {
                            sounds.playPop();
                            setGoal(opt.id as any);
                          }}
                          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                        />
                        <span style={{ fontSize: 11.5, fontWeight: 800 }}>{opt.label}</span>
                        <span style={{ fontSize: 9.5, color: 'var(--text-dim)' }}>{opt.sub}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Kaydet Butonu */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  marginTop: 2,
                  height: 46,
                  fontSize: 14,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  boxShadow: '0 4px 16px rgba(56, 189, 248, 0.4)'
                }}
              >
                <Save size={16} />
                <span>Ölçümü ve Profili Kaydet</span>
              </button>
            </form>
          ) : (
            /* SEKME 2: VÜCUT GELİŞİM TRENDİ VE GEÇMİŞ */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeIn 0.2s ease-out' }}>
              {/* Rekompozisyon Durum Rozeti */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: `1px solid ${liveMetrics.recompColor}55`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: liveMetrics.recompColor, marginBottom: 2 }}>
                    {liveMetrics.recompBadge}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    {liveMetrics.recompDescription}
                  </div>
                </div>
                <Sparkles size={20} color={liveMetrics.recompColor} style={{ flexShrink: 0 }} />
              </div>

              {/* 3'lü Toplam Değişim Kartları */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <div
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '9px 10px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Kilo Değişimi</div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 900,
                      color: '#38bdf8',
                      fontFamily: 'Outfit',
                      marginTop: 2
                    }}
                  >
                    {liveMetrics.deltaWeightKg > 0 ? `+${liveMetrics.deltaWeightKg}` : liveMetrics.deltaWeightKg} kg
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '9px 10px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Yağ Değişimi</div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 900,
                      color: liveMetrics.deltaBodyFatPct <= 0 ? 'var(--muscle-emerald)' : 'var(--gold)',
                      fontFamily: 'Outfit',
                      marginTop: 2
                    }}
                  >
                    {liveMetrics.deltaBodyFatPct > 0 ? `+${liveMetrics.deltaBodyFatPct}` : liveMetrics.deltaBodyFatPct}%
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '9px 10px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Kas Değişimi</div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 900,
                      color: liveMetrics.deltaMuscleKg >= 0 ? 'var(--muscle-emerald)' : 'var(--accent)',
                      fontFamily: 'Outfit',
                      marginTop: 2
                    }}
                  >
                    {liveMetrics.deltaMuscleKg > 0 ? `+${liveMetrics.deltaMuscleKg}` : liveMetrics.deltaMuscleKg} kg
                  </div>
                </div>
              </div>

              {/* Grafik Metrik Seçici */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                {[
                  { id: 'weightKg', label: 'Kilo (kg)', color: '#38bdf8' },
                  { id: 'bodyFatPct', label: 'Yağ (%)', color: '#fbbf24' },
                  { id: 'muscleMassKg', label: 'Kas (kg)', color: '#10b981' },
                  { id: 'waistCm', label: 'Bel (cm)', color: '#c084fc' }
                ].map((m) => {
                  const active = chartMetric === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        setChartMetric(m.id as ChartMetric);
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: active ? `1.5px solid ${m.color}` : '1px solid var(--border)',
                        background: active ? `${m.color}22` : 'var(--input-bg)',
                        color: active ? '#ffffff' : 'var(--text-muted)',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* SVG Zaman Serisi Grafiği */}
              <div
                style={{
                  background: 'rgba(11, 15, 23, 0.7)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px'
                }}
              >
                {chartPoints.length >= 2 ? (
                  (() => {
                    const values = chartPoints.map((p) => p.value);
                    const minVal = Math.min(...values);
                    const maxVal = Math.max(...values);
                    const range = Math.max(0.5, maxVal - minVal);
                    const width = 340;
                    const height = 110;
                    const padX = 18;
                    const padY = 18;

                    const coords = chartPoints.map((pt, idx) => {
                      const x =
                        padX +
                        (idx / Math.max(1, chartPoints.length - 1)) * (width - padX * 2);
                      const y =
                        height -
                        padY -
                        ((pt.value - minVal) / range) * (height - padY * 2);
                      return { ...pt, x, y };
                    });

                    const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
                    const areaPoints = `${coords[0].x},${height - padY} ${polylinePoints} ${coords[coords.length - 1].x},${height - padY}`;

                    return (
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            marginBottom: 6
                          }}
                        >
                          <span>
                            Başlangıç: <strong style={{ color: '#fff' }}>{chartPoints[0].value} {chartUnit}</strong>
                          </span>
                          <span>
                            Güncel:{' '}
                            <strong style={{ color: chartColor }}>
                              {chartPoints[chartPoints.length - 1].value} {chartUnit}
                            </strong>
                          </span>
                        </div>
                        <svg
                          viewBox={`0 0 ${width} ${height}`}
                          style={{ width: '100%', height: 115, overflow: 'visible' }}
                        >
                          <defs>
                            <linearGradient id="bodyMetricGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={chartColor} stopOpacity="0.35" />
                              <stop offset="100%" stopColor={chartColor} stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <polygon points={areaPoints} fill="url(#bodyMetricGrad)" />
                          <polyline
                            fill="none"
                            stroke={chartColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={polylinePoints}
                          />
                          {coords.map((c, i) => (
                            <g key={c.date + i}>
                              <circle
                                cx={c.x}
                                cy={c.y}
                                r={i === coords.length - 1 ? 4.5 : 3}
                                fill={i === coords.length - 1 ? chartColor : '#0b0f17'}
                                stroke={chartColor}
                                strokeWidth="2"
                              />
                            </g>
                          ))}
                        </svg>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 10,
                            color: 'var(--text-dim)',
                            marginTop: 2
                          }}
                        >
                          <span>{chartPoints[0].date}</span>
                          <span>{chartPoints[chartPoints.length - 1].date}</span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', padding: '18px 8px' }}>
                    Trend grafiği için en az 2 farklı tarihte ölçüm kaydı gereklidir. "Ölçüm & Profil" sekmesinden yeni kayıt ekleyebilirsiniz.
                  </div>
                )}
              </div>

              {/* Ölçüm Geçmişi Listesi */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#ffffff',
                    marginBottom: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>Kayıtlı Ölçüm Geçmişi</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    Son {Math.min(15, sortedMeasurements.length)} Kayıt
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 190, overflowY: 'auto' }}>
                  {[...sortedMeasurements]
                    .reverse()
                    .slice(0, 15)
                    .map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border)',
                          fontSize: 12
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: '#ffffff' }}>
                            {item.weightKg} kg
                            {item.bodyFatPct !== undefined && (
                              <span style={{ color: 'var(--gold)', marginLeft: 8, fontWeight: 600 }}>
                                %{item.bodyFatPct} Yağ
                              </span>
                            )}
                            {item.muscleMassKg !== undefined && (
                              <span style={{ color: 'var(--muscle-emerald)', marginLeft: 8, fontWeight: 600 }}>
                                {item.muscleMassKg} kg Kas
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 1 }}>
                            {item.date}
                            {item.waistCm ? ` • Bel: ${item.waistCm}cm` : ''}
                            {item.armCm ? ` • Kol: ${item.armCm}cm` : ''}
                          </div>
                        </div>

                        {item.id !== 'current-preview' && (
                          <button
                            type="button"
                            onClick={() => deleteBodyMeasurement(item.id)}
                            className="btn-icon"
                            title="Ölçümü Sil"
                            aria-label={`${item.date} tarihli ölçümü sil`}
                            style={{ width: 28, height: 28, color: 'var(--text-dim)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
