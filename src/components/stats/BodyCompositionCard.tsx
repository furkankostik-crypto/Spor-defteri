import React, { useMemo, useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { calculateBodyCompositionMetrics } from '../../utils/scientificCalculations';
import { sounds } from '../../utils/audio';
import { Scale, Plus, ChevronRight } from 'lucide-react';

interface BodyCompositionCardProps {
  onOpenBodyTab?: (openEntry?: boolean) => void;
}

export const BodyCompositionCard: React.FC<BodyCompositionCardProps> = ({ onOpenBodyTab }) => {
  const { profile, setActiveTab } = useWorkout();
  const [activeMetric, setActiveMetric] = useState<'weightKg' | 'bodyFatPct' | 'muscleMassKg'>('weightKg');

  const metrics = useMemo(() => calculateBodyCompositionMetrics(profile), [profile]);

  const sortedHistory = useMemo(() => {
    return [...(profile.measurements || [])].sort((a, b) => a.date.localeCompare(b.date));
  }, [profile.measurements]);

  const sparklinePoints = useMemo(() => {
    return sortedHistory
      .map((m) => {
        const val =
          activeMetric === 'weightKg'
            ? m.weightKg
            : activeMetric === 'bodyFatPct'
            ? m.bodyFatPct
            : m.muscleMassKg;
        return val !== undefined && val > 0 ? { date: m.date, value: val } : null;
      })
      .filter((x): x is { date: string; value: number } => x !== null)
      .slice(-14);
  }, [sortedHistory, activeMetric]);

  const sparkColor =
    activeMetric === 'weightKg'
      ? '#38bdf8'
      : activeMetric === 'bodyFatPct'
      ? '#fbbf24'
      : '#10b981';

  const handleNavigateBody = (openEntry = false) => {
    sounds.playPop();
    if (onOpenBodyTab) {
      onOpenBodyTab(openEntry);
    } else {
      setActiveTab('body');
    }
  };

  return (
    <div className="card" style={{ padding: '14px', marginBottom: 14 }}>
      {/* Clean Single-Line Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          gap: 8
        }}
      >
        <div
          onClick={() => handleNavigateBody(false)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', minWidth: 0 }}
        >
          <Scale size={16} color="var(--cyan)" style={{ flexShrink: 0 }} />
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', margin: 0, whiteSpace: 'nowrap' }}>
            Vücut Kompozisyonu
          </h3>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: metrics.recompColor,
              background: `${metrics.recompColor}15`,
              padding: '2px 7px',
              borderRadius: 999,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {metrics.recompBadge}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleNavigateBody(true)}
          style={{
            background: 'rgba(56, 189, 248, 0.14)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: 'var(--cyan)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 10px',
            fontSize: 11,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0
          }}
        >
          <Plus size={13} />
          <span>Ölçüm</span>
        </button>
      </div>

      {/* 4 Core Body Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6
        }}
      >
        {/* Kilo */}
        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setActiveMetric('weightKg');
          }}
          style={{
            background: activeMetric === 'weightKg' ? 'rgba(56, 189, 248, 0.1)' : 'var(--input-bg)',
            border: activeMetric === 'weightKg' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 4px',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Ağırlık</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit', marginTop: 2 }}>
            {metrics.weightKg} <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>kg</span>
          </div>
          <div style={{ fontSize: 9.5, color: '#38bdf8', fontWeight: 700, marginTop: 1 }}>
            {metrics.deltaWeightKg !== 0
              ? `${metrics.deltaWeightKg > 0 ? '+' : ''}${metrics.deltaWeightKg} kg`
              : `BMI ${metrics.bmi}`}
          </div>
        </button>

        {/* Yağ Oranı */}
        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setActiveMetric('bodyFatPct');
          }}
          style={{
            background: activeMetric === 'bodyFatPct' ? 'rgba(251, 191, 36, 0.1)' : 'var(--input-bg)',
            border: activeMetric === 'bodyFatPct' ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 4px',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Yağ Oranı</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--gold)', fontFamily: 'Outfit', marginTop: 2 }}>
            %{metrics.bodyFatPct}
          </div>
          <div
            style={{
              fontSize: 9.5,
              color: metrics.deltaBodyFatPct <= 0 ? 'var(--muscle-emerald)' : 'var(--gold)',
              fontWeight: 700,
              marginTop: 1
            }}
          >
            {metrics.deltaBodyFatPct !== 0
              ? `${metrics.deltaBodyFatPct > 0 ? '+' : ''}${metrics.deltaBodyFatPct}%`
              : `${metrics.fatMassKg} kg`}
          </div>
        </button>

        {/* Kas Kütlesi */}
        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setActiveMetric('muscleMassKg');
          }}
          style={{
            background: activeMetric === 'muscleMassKg' ? 'rgba(16, 185, 129, 0.1)' : 'var(--input-bg)',
            border: activeMetric === 'muscleMassKg' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 4px',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>İskelet Kası</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--muscle-emerald)', fontFamily: 'Outfit', marginTop: 2 }}>
            {metrics.muscleMassKg} <span style={{ fontSize: 10, fontWeight: 600 }}>kg</span>
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--muscle-emerald)', fontWeight: 700, marginTop: 1 }}>
            {metrics.deltaMuscleKg !== 0
              ? `${metrics.deltaMuscleKg > 0 ? '+' : ''}${metrics.deltaMuscleKg} kg`
              : `LBM ${metrics.leanBodyMassKg}`}
          </div>
        </button>

        {/* FFMI İndeksi */}
        <button
          type="button"
          onClick={() => handleNavigateBody(false)}
          style={{
            background: 'var(--input-bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 4px',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>FFMI</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: metrics.ffmiColor, fontFamily: 'Outfit', marginTop: 2 }}>
            {metrics.normalizedFfmi}
          </div>
          <div
            style={{
              fontSize: 9.5,
              color: metrics.ffmiColor,
              fontWeight: 700,
              marginTop: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}
          >
            <span>{metrics.ffmiTier}</span>
            <ChevronRight size={10} />
          </div>
        </button>
      </div>

      {/* Sparkline Mini Trend (Only shown when 2+ logs exist — zero visual clutter when empty) */}
      {sparklinePoints.length >= 2 && (
        (() => {
          const vals = sparklinePoints.map((p) => p.value);
          const minV = Math.min(...vals);
          const maxV = Math.max(...vals);
          const range = Math.max(0.5, maxV - minV);
          const w = 320;
          const h = 46;
          const padX = 8;
          const padY = 6;

          const coords = sparklinePoints.map((p, idx) => ({
            ...p,
            x: padX + (idx / Math.max(1, sparklinePoints.length - 1)) * (w - padX * 2),
            y: h - padY - ((p.value - minV) / range) * (h - padY * 2)
          }));

          const poly = coords.map((c) => `${c.x},${c.y}`).join(' ');
          const area = `${coords[0].x},${h - padY} ${poly} ${coords[coords.length - 1].x},${h - padY}`;
          const unit = activeMetric === 'bodyFatPct' ? '%' : 'kg';
          const label =
            activeMetric === 'weightKg'
              ? 'Ağırlık Trendi'
              : activeMetric === 'bodyFatPct'
              ? 'Yağ Oranı Trendi'
              : 'Kas Kütlesi Trendi';

          return (
            <div
              onClick={() => handleNavigateBody(false)}
              style={{
                marginTop: 10,
                background: 'rgba(11, 15, 23, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 10.5,
                  marginBottom: 2
                }}
              >
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
                <span style={{ color: sparkColor, fontWeight: 800 }}>
                  {sparklinePoints[0].value} {unit} ➔ {sparklinePoints[sparklinePoints.length - 1].value} {unit}
                </span>
              </div>
              <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 46, display: 'block' }}>
                <defs>
                  <linearGradient id="sparkCardGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparkColor} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={sparkColor} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <polygon points={area} fill="url(#sparkCardGrad)" />
                <polyline
                  fill="none"
                  stroke={sparkColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={poly}
                />
              </svg>
            </div>
          );
        })()
      )}
    </div>
  );
};
