import React, { useState, useEffect, useRef } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useAuth } from '../../context/AuthContext';
import { usePwaInstall } from '../../context/PwaInstallContext';
import { useBackButton } from '../../context/BackNavigationContext';
import { sounds } from '../../utils/audio';
import { nativeBridge } from '../../utils/nativeBridge';
import { CURRENT_APP_VERSION, checkAppUpdate } from '../../utils/appVersion';
import { exportToJSON, exportToCSV, parseImportJSON } from '../../utils/backup';
import { BackupModal } from './BackupModal';
import { UpdateModal } from './UpdateModal';
import {
  Settings,
  X,
  Volume2,
  VolumeX,
  Vibrate,
  VibrateOff,
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  RefreshCw,
  Cloud,
  CloudCheck,
  Smartphone,
  Sparkles,
  Timer,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const STORAGE_REST_DURATION_KEY = 'spor_preferred_rest_seconds';
const REST_OPTIONS = [
  { label: '45 sn', seconds: 45 },
  { label: '60 sn', seconds: 60 },
  { label: '90 sn', seconds: 90 },
  { label: '120 sn', seconds: 120 },
  { label: '180 sn', seconds: 180 }
];

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    soundEnabled,
    setSoundEnabled,
    vibrationEnabled,
    setVibrationEnabled,
    workouts,
    customExercises,
    profile,
    importAllData,
    showToast
  } = useWorkout();

  const { user, syncStatus, setIsAuthModalOpen } = useAuth();
  const { isInstalled, promptInstall } = usePwaInstall();

  const [preferredRest, setPreferredRest] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_REST_DURATION_KEY);
      return saved ? parseInt(saved, 10) : 90;
    } catch {
      return 90;
    }
  });

  const [hasUpdateBadge, setHasUpdateBadge] = useState<boolean>(false);
  const [isBackupOpen, setIsBackupOpen] = useState<boolean>(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useBackButton(isSettingsModalOpen, () => setIsSettingsModalOpen(false), 75);

  useEffect(() => {
    if (isSettingsModalOpen) {
      checkAppUpdate()
        .then((res) => {
          if (res.hasUpdate) {
            setHasUpdateBadge(true);
          }
        })
        .catch(() => {});
    }
  }, [isSettingsModalOpen]);

  if (!isSettingsModalOpen) return null;

  const handleClose = () => {
    sounds.playPop();
    setIsSettingsModalOpen(false);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) {
      sounds.playSuccess();
    }
  };

  const handleToggleVibration = () => {
    const next = !vibrationEnabled;
    setVibrationEnabled(next);
    if (next) {
      nativeBridge.vibrateLight();
    }
    sounds.playPop();
  };

  const handleTestSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playTimerFinish();
  };

  const handleTestVibration = (e: React.MouseEvent) => {
    e.stopPropagation();
    nativeBridge.vibrateSuccess();
  };

  const handleSelectRest = (seconds: number) => {
    sounds.playPop();
    setPreferredRest(seconds);
    try {
      localStorage.setItem(STORAGE_REST_DURATION_KEY, seconds.toString());
      showToast({
        title: '⏱️ Dinlenme Süresi Güncellendi',
        description: `Varsayılan süre ${seconds} saniye olarak ayarlandı.`,
        type: 'success'
      });
    } catch {
      // sessizce geç
    }
  };

  const handleExportJSON = async () => {
    sounds.playPop();
    const ok = await exportToJSON(workouts, customExercises, profile);
    if (ok) {
      showToast({
        title: '💾 JSON Yedeği İndirildi',
        description: 'Tüm antrenman geçmişi, profil ve ölçümler kaydedildi.',
        type: 'success'
      });
    }
  };

  const handleExportCSV = async () => {
    sounds.playPop();
    if (workouts.length === 0) {
      showToast({
        title: 'Kayıt Yok',
        description: 'Dışa aktarılacak antrenman bulunamadı.',
        type: 'info'
      });
      return;
    }
    const ok = await exportToCSV(workouts);
    if (ok) {
      showToast({
        title: '📊 Excel / CSV Hazır',
        description: 'Excel uyumlu antrenman tablosu oluşturuldu.',
        type: 'success'
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseImportJSON(file);
      importAllData(result.workouts, result.customExercises, result.athleteProfile);
      showToast({
        title: '✅ Yedek Başarıyla Yüklendi',
        description: `${result.workouts.length} antrenman içe aktarıldı.`,
        type: 'success'
      });
    } catch (err: any) {
      showToast({
        title: 'Hata',
        description: err.message || 'Yedek dosyası okunamadı.',
        type: 'error'
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div
        className="modal-backdrop"
        onClick={handleClose}
        style={{
          zIndex: 1100,
          padding: 'calc(14px + var(--safe-top, 0px)) 14px calc(14px + var(--safe-bottom, 0px)) 14px'
        }}
      >
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: 480,
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(180deg, #162032 0%, #0d131f 100%)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 35px rgba(168, 85, 247, 0.15)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            padding: 0
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(168, 85, 247, 0.16)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c084fc',
                  boxShadow: '0 0 16px rgba(168, 85, 247, 0.25)'
                }}
              >
                <Settings size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                  Ayarlar
                </h3>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  Geri bildirim, veri yönetimi & sistem seçenekleri
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="btn-icon"
              style={{ width: 34, height: 34, borderRadius: '50%' }}
              aria-label="Kapat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div
            style={{
              padding: '18px 20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 20
            }}
          >
            {/* 1. BÖLÜM: GERİ BİLDİRİM VE TERCİHLER */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#c084fc',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>Tercihler & Geri Bildirim</span>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                {/* Ses Efektleri */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: soundEnabled ? 'rgba(251, 191, 36, 0.16)' : 'rgba(255, 255, 255, 0.05)',
                        color: soundEnabled ? 'var(--gold)' : 'var(--text-dim)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                        Ses Efektleri
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Geri bildirim sesleri ve sayaç bitiş zili
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {soundEnabled && (
                      <button
                        type="button"
                        onClick={handleTestSound}
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: 'rgba(251, 191, 36, 0.12)',
                          color: 'var(--gold)',
                          border: '1px solid rgba(251, 191, 36, 0.3)',
                          cursor: 'pointer'
                        }}
                      >
                        Dene
                      </button>
                    )}

                    {/* Switch */}
                    <div
                      onClick={handleToggleSound}
                      style={{
                        width: 42,
                        height: 24,
                        borderRadius: 12,
                        background: soundEnabled ? 'var(--accent)' : 'rgba(255, 255, 255, 0.12)',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 2,
                        boxShadow: soundEnabled ? '0 0 12px rgba(255, 71, 87, 0.4)' : 'none'
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: '#ffffff',
                          transform: soundEnabled ? 'translateX(18px)' : 'translateX(0px)',
                          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.05)' }} />

                {/* Dokunsal Titreşim */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: vibrationEnabled ? 'rgba(168, 85, 247, 0.16)' : 'rgba(255, 255, 255, 0.05)',
                        color: vibrationEnabled ? '#c084fc' : 'var(--text-dim)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {vibrationEnabled ? <Vibrate size={18} /> : <VibrateOff size={18} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                        Dokunsal Titreşim
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Sayaç uyarıları ve tuş dokunma hissi
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {vibrationEnabled && (
                      <button
                        type="button"
                        onClick={handleTestVibration}
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: 'rgba(168, 85, 247, 0.12)',
                          color: '#c084fc',
                          border: '1px solid rgba(168, 85, 247, 0.3)',
                          cursor: 'pointer'
                        }}
                      >
                        Dene
                      </button>
                    )}

                    {/* Switch */}
                    <div
                      onClick={handleToggleVibration}
                      style={{
                        width: 42,
                        height: 24,
                        borderRadius: 12,
                        background: vibrationEnabled ? 'var(--accent)' : 'rgba(255, 255, 255, 0.12)',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 2,
                        boxShadow: vibrationEnabled ? '0 0 12px rgba(255, 71, 87, 0.4)' : 'none'
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: '#ffffff',
                          transform: vibrationEnabled ? 'translateX(18px)' : 'translateX(0px)',
                          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.05)' }} />

                {/* Varsayılan Dinlenme Sayacı */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: 'rgba(56, 189, 248, 0.14)',
                        color: 'var(--cyan)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Timer size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                        Varsayılan Dinlenme Sayacı
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Set tamamlandığında otomatik başlayan süre
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingLeft: 44 }}>
                    {REST_OPTIONS.map((opt) => {
                      const isSelected = preferredRest === opt.seconds;
                      return (
                        <button
                          key={opt.seconds}
                          type="button"
                          onClick={() => handleSelectRest(opt.seconds)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: isSelected ? '1px solid var(--cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                            background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                            color: isSelected ? '#ffffff' : 'var(--text-muted)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. BÖLÜM: VERİ YÖNETİMİ & YEDEKLEME */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--muscle-emerald)',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>Veri & Yedekleme</span>
                <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'none', fontWeight: 600 }}>
                  {workouts.length} Antrenman • {customExercises.length} Özel Hareket
                </span>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                {/* JSON Yedek İndir */}
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="burger-menu-item"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '8px 10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="burger-item-icon" style={{ background: 'rgba(16, 185, 129, 0.14)', color: 'var(--muscle-emerald)' }}>
                      <Download size={16} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>JSON Yedeği İndir</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tüm antrenman ve hareketleri dosyaya aktar</div>
                    </div>
                  </div>
                  <ChevronRight size={14} color="var(--text-dim)" />
                </button>

                {/* CSV / Excel Tablosu İndir */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="burger-menu-item"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '8px 10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="burger-item-icon" style={{ background: 'rgba(56, 189, 248, 0.14)', color: 'var(--cyan)' }}>
                      <FileSpreadsheet size={16} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>Excel / CSV Tablosu</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Antrenman geçmişini e-tabloda incele</div>
                    </div>
                  </div>
                  <ChevronRight size={14} color="var(--text-dim)" />
                </button>

                {/* JSON Yedeği Yükle (File Input) */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="burger-menu-item"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '8px 10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="burger-item-icon" style={{ background: 'rgba(251, 191, 36, 0.14)', color: 'var(--gold)' }}>
                      <Upload size={16} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>Yedekten Geri Yükle</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Daha önce indirdiğiniz JSON dosyasını seçin</div>
                    </div>
                  </div>
                  <ChevronRight size={14} color="var(--text-dim)" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  style={{ display: 'none' }}
                />

                {/* Gelişmiş Yedekleme & Sıfırlama Butonu */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setIsBackupOpen(true);
                  }}
                  className="burger-menu-item"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '8px 10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="burger-item-icon" style={{ background: 'rgba(168, 85, 247, 0.14)', color: '#c084fc' }}>
                      <Database size={16} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>Gelişmiş Veri & Sıfırlama</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Örnek veriler ve veritabanı sıfırlama yöneticisi</div>
                    </div>
                  </div>
                  <ChevronRight size={14} color="var(--text-dim)" />
                </button>
              </div>
            </div>

            {/* 3. BÖLÜM: HESAP VE BULUT EŞİTLEME */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--cyan)',
                  marginBottom: 10
                }}
              >
                <span>Bulut Hesabı & Eşitleme</span>
              </div>

              <div
                onClick={() => {
                  sounds.playPop();
                  setIsAuthModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-lg)',
                  background: user
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(56, 189, 248, 0.08))'
                    : 'linear-gradient(135deg, rgba(255, 71, 87, 0.12), rgba(56, 189, 248, 0.08))',
                  border: user ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 71, 87, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: user ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 71, 87, 0.15)',
                      border: user ? '1.5px solid var(--muscle-emerald)' : '1.5px solid var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: user ? 'var(--muscle-emerald)' : 'var(--accent)',
                      flexShrink: 0
                    }}
                  >
                    {user ? <ShieldCheck size={20} /> : <Cloud size={20} />}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 13.5, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user ? (user.displayName || user.email) : 'Bulut Hesabı Bağla'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      {user ? (
                        syncStatus === 'syncing' ? (
                          <>
                            <RefreshCw size={11} className="spin" color="var(--cyan)" />
                            <span style={{ color: 'var(--cyan)' }}>Bulutla senkronize ediliyor...</span>
                          </>
                        ) : (
                          <>
                            <CloudCheck size={12} color="var(--muscle-emerald)" />
                            <span style={{ color: 'var(--muscle-emerald)' }}>Bulut koruması devrede</span>
                          </>
                        )
                      ) : (
                        <span>Cihazlar arasında verileri yedeklemek için giriş yap</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: user ? 'var(--muscle-emerald)' : 'var(--accent)' }}>
                    {user ? 'Yönet' : 'Bağla'}
                  </span>
                  <ChevronRight size={16} color="var(--text-dim)" />
                </div>
              </div>
            </div>

            {/* 4. BÖLÜM: SÜRÜM & GÜNCELLEME MERKEZİ */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 10
                }}
              >
                <span>Sistem & Güncelleme</span>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                {/* Güncelleme Merkezi Butonu */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setIsUpdateOpen(true);
                  }}
                  className="burger-menu-item"
                  style={{
                    background: hasUpdateBadge ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: hasUpdateBadge ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '8px 10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      className="burger-item-icon"
                      style={{
                        background: hasUpdateBadge ? 'rgba(16, 185, 129, 0.16)' : 'rgba(168, 85, 247, 0.14)',
                        color: hasUpdateBadge ? 'var(--muscle-emerald)' : '#c084fc'
                      }}
                    >
                      {hasUpdateBadge ? <Sparkles size={16} /> : <RefreshCw size={16} />}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Güncelleme Merkezi</span>
                        {hasUpdateBadge && (
                          <span style={{ fontSize: 9, background: 'var(--muscle-emerald)', color: '#000', padding: '1px 5px', borderRadius: 4, fontWeight: 900 }}>
                            YENİ
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Sürüm kontrolü ve canlı yenileme
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        color: hasUpdateBadge ? 'var(--muscle-emerald)' : '#c084fc',
                        background: hasUpdateBadge ? 'rgba(16, 185, 129, 0.14)' : 'rgba(168, 85, 247, 0.14)',
                        padding: '2px 7px',
                        borderRadius: 6
                      }}
                    >
                      {hasUpdateBadge ? 'Güncelle' : CURRENT_APP_VERSION.version}
                    </span>
                    <ChevronRight size={14} color="var(--text-dim)" />
                  </div>
                </button>

                {/* Native Değilse: APK ve PWA Kurulum Butonları */}
                {!nativeBridge.isNative() && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                    <a
                      href="/GymPad.apk"
                      download="GymPad.apk"
                      onClick={() => sounds.playPop()}
                      className="burger-menu-item"
                      style={{
                        textDecoration: 'none',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        padding: '8px 10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="burger-item-icon" style={{ background: 'var(--muscle-emerald)', color: '#0b0f17' }}>
                          <Smartphone size={16} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>GymPad APK İndir</span>
                            <span style={{ fontSize: 9.5, background: 'var(--muscle-emerald)', color: '#000', padding: '1px 5px', borderRadius: 4, fontWeight: 900 }}>NATIVE</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tam donanım & titreşim destekli APK</div>
                        </div>
                      </div>
                      <Download size={15} color="var(--muscle-emerald)" />
                    </a>

                    {!isInstalled && (
                      <button
                        type="button"
                        onClick={() => {
                          promptInstall();
                        }}
                        className="burger-menu-item"
                        style={{
                          background: 'rgba(255, 71, 87, 0.08)',
                          border: '1px solid rgba(255, 71, 87, 0.25)',
                          padding: '8px 10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="burger-item-icon" style={{ background: 'var(--accent)', color: '#ffffff' }}>
                            <Smartphone size={16} />
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>Web Kısayolu Yükle</span>
                              <span style={{ fontSize: 9.5, background: 'rgba(255, 255, 255, 0.18)', color: '#fff', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>PWA</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tarayıcı üzerinden ana ekrana ekle</div>
                          </div>
                        </div>
                        <Download size={15} color="var(--accent)" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11,
              color: 'var(--text-dim)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <img src="/favicon.png" alt="GymPad" style={{ width: 16, height: 16, borderRadius: 4 }} />
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                {nativeBridge.isNative() ? 'GymPad Native Android' : 'GymPad Web PWA'}
              </span>
            </div>
            <div style={{ fontWeight: 700 }}>
              {CURRENT_APP_VERSION.displayVersion}
            </div>
          </div>
        </div>
      </div>

      {/* Nested Backup Modal */}
      <BackupModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />

      {/* Nested Update Modal */}
      <UpdateModal isOpen={isUpdateOpen} onClose={() => setIsUpdateOpen(false)} />
    </>
  );
};
