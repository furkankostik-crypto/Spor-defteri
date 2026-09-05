import React, { useState, useEffect, useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { calculateExerciseLevelInfo, calculateProportionalMuscleVolume } from '../../utils/calculations';
import { AnatomyIcon } from '../../data/anatomyIcons';
import { MuscleGroup, ExerciseLevelInfo } from '../../types/workout';
import { OverallRankCard } from '../levels/OverallRankCard';
import { ExerciseLevelCard } from '../levels/ExerciseLevelCard';
import { MuscleMasteryCard } from '../levels/MuscleMasteryCard';
import { BackupModal } from '../common/BackupModal';
import { HeaderBurgerMenu } from '../layout/HeaderBurgerMenu';
import { ScientificVolumeCard } from './ScientificVolumeCard';
import { sounds } from '../../utils/audio';
import { 
  BarChart3, 
  Trophy, 
  Flame, 
  Award, 
  Shield, 
  Target,
  TrendingUp, 
  Sparkles, 
  Volume2,
  VolumeX,
  Database, 
  DownloadCloud, 
  Settings,
  Search, 
  SlidersHorizontal,
  Bot
} from 'lucide-react';

export const ProgressView: React.FC = () => {
  const { 
    overallStats, 
    workouts, 
    allExercises, 
    soundEnabled, 
    setSoundEnabled,
    setIsAICoachOpen
  } = useWorkout();
  
  // Segment tab: 'stats' (Genel Analiz) or 'levels' (Egzersiz Seviyeleri & PR'lar)
  const [activeSegment, setActiveSegment] = useState<'stats' | 'levels'>('stats');

  // Level search and filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'upper' | 'lower' | 'core'>('all');
  const [sortBy, setSortBy] = useState<'level' | 'exp' | 'name'>('level');

  // Backup & PWA install state
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
    }
    setDeferredPrompt(null);
  };

  // Precompute level info for all exercises once to eliminate redundant calculations during sort
  const exerciseInfoMap = useMemo(() => {
    const map = new Map<string, ExerciseLevelInfo>();
    allExercises.forEach((ex) => {
      map.set(ex.id, calculateExerciseLevelInfo(ex, workouts));
    });
    return map;
  }, [allExercises, workouts]);

  // Filter and sort exercises for levels tab
  const filteredExercises = useMemo(() => {
    return allExercises.filter((ex) => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = filterCategory === 'all' || ex.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allExercises, search, filterCategory]);

  const sortedExercises = useMemo(() => {
    return [...filteredExercises].sort((a, b) => {
      const infoA = exerciseInfoMap.get(a.id);
      const infoB = exerciseInfoMap.get(b.id);
      const levelA = infoA ? infoA.currentLevel : 1;
      const levelB = infoB ? infoB.currentLevel : 1;
      const expA = infoA ? infoA.totalEXP : 0;
      const expB = infoB ? infoB.totalEXP : 0;

      if (sortBy === 'level') {
        return levelB - levelA || expB - expA;
      }
      if (sortBy === 'exp') {
        return expB - expA;
      }
      return a.name.localeCompare(b.name, 'tr');
    });
  }, [filteredExercises, exerciseInfoMap, sortBy]);

  // Calculate volume distribution per muscle group using scientific proportional ratios
  const muscleVolume = useMemo(() => {
    return calculateProportionalMuscleVolume(workouts, allExercises);
  }, [workouts, allExercises]);

  const muscleList: { muscle: MuscleGroup; label: string; volume: number }[] = useMemo(() => [
    { muscle: 'chest' as MuscleGroup, label: 'Göğüs', volume: muscleVolume['chest'] || 0 },
    { muscle: 'back' as MuscleGroup, label: 'Sırt & Kanat', volume: muscleVolume['back'] || 0 },
    { muscle: 'shoulder' as MuscleGroup, label: 'Omuz', volume: muscleVolume['shoulder'] || 0 },
    { muscle: 'biceps' as MuscleGroup, label: 'Biceps', volume: muscleVolume['biceps'] || 0 },
    { muscle: 'triceps' as MuscleGroup, label: 'Triceps', volume: muscleVolume['triceps'] || 0 },
    { muscle: 'quads' as MuscleGroup, label: 'Ön Bacak', volume: muscleVolume['quads'] || 0 },
    { muscle: 'hamstring' as MuscleGroup, label: 'Arka Bacak', volume: muscleVolume['hamstring'] || 0 },
    { muscle: 'glutes' as MuscleGroup, label: 'Kalça', volume: muscleVolume['glutes'] || 0 },
    { muscle: 'calves' as MuscleGroup, label: 'Kalf', volume: muscleVolume['calves'] || 0 },
    { muscle: 'abs' as MuscleGroup, label: 'Karın', volume: muscleVolume['abs'] || 0 }
  ].sort((a, b) => b.volume - a.volume), [muscleVolume]);

  const maxMuscleVol = Math.max(...muscleList.map(m => m.volume), 1);

  // Top 5 PR records using memoized map
  const prList = useMemo(() => {
    return allExercises
      .map(ex => exerciseInfoMap.get(ex.id) || calculateExerciseLevelInfo(ex, workouts))
      .filter(info => info.prWeight > 0)
      .sort((a, b) => b.prWeight - a.prWeight)
      .slice(0, 5);
  }, [allExercises, exerciseInfoMap, workouts]);

  return (
    <div style={{ padding: '16px', animation: 'fadeIn 0.2s ease-out' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14
        }}
      >
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Gelişim & İstatistik
          </h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Kaldırılan ağırlıklar, seviyeler ve bulut senkronizasyonu
          </div>
        </div>

        {/* Top Right: Unified Burger Menu */}
        <HeaderBurgerMenu />
      </div>

      {/* AI Bilimsel Koç Hero Banner */}
      <div
        onClick={() => {
          sounds.playPop();
          setIsAICoachOpen(true);
        }}
        style={{
          background: 'linear-gradient(135deg, rgba(126, 34, 206, 0.22), rgba(192, 132, 252, 0.12))',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 14px',
          marginBottom: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(168, 85, 247, 0.15)',
          transition: 'all 0.2s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #7e22ce, #c084fc)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(168, 85, 247, 0.35)',
              flexShrink: 0
            }}
          >
            <Bot size={20} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Bilimsel AI Antrenör</span>
              <span 
                style={{ 
                  fontSize: 9, 
                  background: 'rgba(168, 85, 247, 0.3)', 
                  color: '#e9d5ff', 
                  padding: '1px 5px', 
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 800 
                }}
              >
                YAPAY ZEKA
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Gelişim analizi, plato çözümleri ve kişisel koçluk için dokun
            </div>
          </div>
        </div>
        <span style={{ fontSize: 12, color: '#c084fc', fontWeight: 800 }}>Sor ➔</span>
      </div>

      {/* Segmented Tab Switcher */}
      <div className="segment-control">
        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setActiveSegment('stats');
          }}
          className={`segment-btn ${activeSegment === 'stats' ? 'active' : ''}`}
        >
          <BarChart3 size={15} />
          <span>Genel İstatistikler</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setActiveSegment('levels');
          }}
          className={`segment-btn ${activeSegment === 'levels' ? 'active' : ''}`}
        >
          <Trophy size={15} />
          <span>GymLevels & PR</span>
        </button>
      </div>

      {/* SEGMENT 1: GENEL İSTATİSTİKLER */}
      {activeSegment === 'stats' && (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          {/* Hero Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
              marginBottom: 16
            }}
          >
            <div className="card" style={{ padding: '14px', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold)', marginBottom: 6 }}>
                <Shield size={16} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Toplam Hacim</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit' }}>
                {(overallStats.totalVolumeKg / 1000).toFixed(2)} <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Ton</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                {overallStats.totalVolumeKg.toLocaleString()} kg
              </div>
            </div>

            <div className="card" style={{ padding: '14px', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muscle-emerald)', marginBottom: 6 }}>
                <TrendingUp size={16} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Toplam EXP</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit' }}>
                {overallStats.totalEXP.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                Karakter Seviyesi: {overallStats.overallLevel}
              </div>
            </div>

            <div className="card" style={{ padding: '14px', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', marginBottom: 6 }}>
                <Flame size={16} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Aktif Seri</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit' }}>
                {overallStats.activeStreak} <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Gün</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                Disiplinli devam
              </div>
            </div>

            <div className="card" style={{ padding: '14px', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--cyan)', marginBottom: 6 }}>
                <Award size={16} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Toplam Set</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit' }}>
                {overallStats.totalSetsCount} <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Set</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                {overallStats.totalWorkouts} Antrenmanda
              </div>
            </div>
          </div>

          {/* Top PR Records */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="var(--gold)" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>En Yüksek Kişisel Rekorlar (PR)</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setActiveSegment('levels');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Tümünü Gör ➔
              </button>
            </div>

            {prList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {prList.map((pr, index) => (
                  <div
                    key={pr.exerciseId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: index === 0 ? 'var(--gold)' : (index === 1 ? '#cbd5e1' : (index === 2 ? '#b45309' : 'rgba(255,255,255,0.1)')),
                          color: index < 3 ? '#0b0f17' : '#ffffff',
                          fontSize: 11,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {index + 1}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#ffffff' }}>{pr.name}</span>
                    </div>
                    <span className="badge badge-pr" style={{ fontSize: 12 }}>
                      {pr.prWeight} kg
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                Henüz antrenman kaydı girilmedi.
              </div>
            )}
          </div>

          {/* Bilimsel Haftalık Hipertrofi Hacmi (RP Landmarks) */}
          <ScientificVolumeCard />

          {/* Muscle Group Distribution Bar Chart */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Target size={16} color="var(--muscle-emerald)" />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>Kas Grubu Hacim Dağılımı</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {muscleList.map((item) => {
                const pct = Math.round((item.volume / maxMuscleVol) * 100);
                return (
                  <div key={item.muscle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AnatomyIcon muscle={item.muscle} size={18} />
                        <span style={{ fontWeight: 600, color: '#ffffff' }}>{item.label}</span>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                        {item.volume.toLocaleString()} kg
                      </span>
                    </div>
                    <div className="progress-bar-track" style={{ height: 6 }}>
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: item.volume > 0 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'transparent'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Settings & Data Management Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Settings size={16} color="var(--cyan)" />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>Ayarlar & Veri Yönetimi</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Sound Toggle */}
              <div
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {soundEnabled ? <Volume2 size={18} color="var(--accent)" /> : <VolumeX size={18} color="var(--text-dim)" />}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>Ses Efektleri</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Level atlama ve buton sesleri</div>
                  </div>
                </div>
                <span className={`badge ${soundEnabled ? 'badge-lvl' : ''}`} style={{ fontSize: 11 }}>
                  {soundEnabled ? 'Açık' : 'Kapalı'}
                </span>
              </div>

              {/* Backup Modal Trigger */}
              <div
                onClick={() => setIsBackupOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Database size={18} color="var(--muscle-emerald)" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>Yedekleme & Sıfırlama</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>JSON / Excel indir veya geri yükle</div>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>➔</span>
              </div>

              {/* PWA Install if available */}
              {canInstall && (
                <div
                  onClick={handleInstallClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 71, 87, 0.12)',
                    border: '1px solid rgba(255, 71, 87, 0.3)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <DownloadCloud size={18} color="var(--accent)" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>Uygulamayı Cihaza Yükle</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tam ekran PWA olarak kullanın</div>
                    </div>
                  </div>
                  <span className="badge badge-pr" style={{ fontSize: 11 }}>Yükle</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SEGMENT 2: LEVEL & PR (EGZERSİZLER) */}
      {activeSegment === 'levels' && (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          {/* Overall Character Rank Hero Card */}
          <OverallRankCard />

          {/* Regional Muscle Mastery Level Cards */}
          <MuscleMasteryCard />

          {/* Filter and Search Bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <Search
                size={16}
                color="var(--text-dim)"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Egzersizlerde ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 36 }}
              />
            </div>

            {/* Category Pills & Sort */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                {[
                  { id: 'all', label: 'Tümü' },
                  { id: 'upper', label: 'Üst' },
                  { id: 'lower', label: 'Alt' },
                  { id: 'core', label: 'Core' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      sounds.playPop();
                      setFilterCategory(cat.id as any);
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: filterCategory === cat.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: filterCategory === cat.id ? 'var(--accent-soft)' : 'var(--input-bg)',
                      color: filterCategory === cat.id ? 'var(--accent)' : 'var(--text-muted)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Sort selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <SlidersHorizontal size={14} color="var(--text-dim)" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="form-input"
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    background: 'var(--input-bg)',
                    width: 'auto'
                  }}
                >
                  <option value="level">Seviye (Azalan)</option>
                  <option value="exp">EXP (Azalan)</option>
                  <option value="name">İsim (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Exercise Level Cards */}
          <div>
            {sortedExercises.length > 0 ? (
              sortedExercises.map((exercise) => (
                <ExerciseLevelCard key={exercise.id} exercise={exercise} />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--text-muted)' }}>
                Aramanıza uygun egzersiz bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backup & Restore Modal */}
      <BackupModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />
    </div>
  );
};
