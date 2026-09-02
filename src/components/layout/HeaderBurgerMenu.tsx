import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkout } from '../../context/WorkoutContext';
import { exportToJSON, exportToCSV } from '../../utils/backup';
import { sounds } from '../../utils/audio';
import { BackupModal } from '../common/BackupModal';
import { 
  Menu, 
  X, 
  Cloud, 
  CloudCheck, 
  RefreshCw, 
  Download, 
  FileSpreadsheet, 
  Database, 
  Volume2, 
  VolumeX, 
  User as UserIcon, 
  ChevronRight,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { usePwaInstall } from '../../context/PwaInstallContext';

export const HeaderBurgerMenu: React.FC = () => {
  const { user, syncStatus, setIsAuthModalOpen } = useAuth();
  const { isInstalled, promptInstall } = usePwaInstall();
  const { 
    workouts, 
    customExercises, 
    soundEnabled, 
    setSoundEnabled, 
    showToast 
  } = useWorkout();

  const [isOpen, setIsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen && 
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current && 
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    sounds.playPop();
    setIsOpen(!isOpen);
  };

  const handleOpenAuth = () => {
    sounds.playPop();
    setIsOpen(false);
    setIsAuthModalOpen(true);
  };

  const handleExportJSONClick = () => {
    sounds.playPop();
    exportToJSON(workouts, customExercises);
    showToast({
      title: '💾 Yedek İndirildi',
      description: 'JSON formatında yedek dosyanız kaydedildi.',
      type: 'success'
    });
    setIsOpen(false);
  };

  const handleExportCSVClick = () => {
    sounds.playPop();
    if (workouts.length === 0) {
      showToast({
        title: 'Kayıt Yok',
        description: 'Dışa aktarılacak antrenman bulunamadı.',
        type: 'info'
      });
      setIsOpen(false);
      return;
    }
    exportToCSV(workouts);
    showToast({
      title: '📊 CSV İndirildi',
      description: 'Excel uyumlu antrenman tablosu kaydedildi.',
      type: 'success'
    });
    setIsOpen(false);
  };

  const handleOpenBackup = () => {
    sounds.playPop();
    setIsOpen(false);
    setIsBackupOpen(true);
  };

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playPop();
    setSoundEnabled(!soundEnabled);
  };

  const userInitial = (user?.displayName || user?.email || 'S').charAt(0).toUpperCase();

  return (
    <>
      <div style={{ position: 'relative' }}>
        {/* Burger Button Trigger */}
        <button
          ref={triggerRef}
          type="button"
          onClick={toggleMenu}
          className="burger-trigger-btn"
          aria-expanded={isOpen}
          aria-label="Ana Menü"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: user ? '4px 10px 4px 6px' : '6px 12px',
            borderRadius: '24px',
            background: isOpen ? 'rgba(255, 71, 87, 0.15)' : 'rgba(18, 24, 38, 0.85)',
            border: isOpen ? '1px solid var(--accent)' : '1px solid var(--border)',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            backdropFilter: 'blur(10px)',
            boxShadow: isOpen ? '0 0 16px rgba(255, 71, 87, 0.3)' : 'var(--shadow-sm)'
          }}
          title="Menü & Seçenekler"
        >
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'Profil'} 
                  style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid var(--accent)' }}
                />
              ) : (
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent), #e11d48)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 800
                  }}
                >
                  {userInitial}
                </div>
              )}
              
              <span style={{ fontSize: 12, fontWeight: 700, maxWidth: 75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.displayName?.split(' ')[0] || 'Hesap'}
              </span>

              {/* Status Dot / Cloud Indicator */}
              {syncStatus === 'syncing' ? (
                <RefreshCw size={12} className="spin" color="var(--cyan)" />
              ) : (
                <CloudCheck size={13} color="var(--muscle-emerald)" />
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 8px var(--accent)'
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                Menü
              </span>
            </div>
          )}

          {/* Hamburger / Close Icon */}
          <div style={{ display: 'flex', alignItems: 'center', color: isOpen ? 'var(--accent)' : 'var(--text-muted)' }}>
            {isOpen ? <X size={17} /> : <Menu size={17} />}
          </div>
        </button>

        {/* Floating Dropdown Drawer */}
        {isOpen && (
          <div
            ref={menuRef}
            className="burger-dropdown-menu"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 'min(340px, calc(100vw - 32px))',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              zIndex: 999,
              padding: '14px',
              animation: 'burgerMenuFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              transformOrigin: 'top right'
            }}
          >
            {/* Header: User Profile / Cloud status banner */}
            <div
              onClick={handleOpenAuth}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: user 
                  ? 'linear-gradient(135deg, rgba(255, 71, 87, 0.12), rgba(16, 185, 129, 0.08))' 
                  : 'linear-gradient(135deg, rgba(255, 71, 87, 0.15), rgba(56, 189, 248, 0.1))',
                border: user ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(255, 71, 87, 0.3)',
                cursor: 'pointer',
                marginBottom: '12px',
                transition: 'all 0.2s'
              }}
              title="Hesap ve Bulut Durumunu Aç"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'Profil'} 
                    style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--accent)', flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: user ? 'linear-gradient(135deg, var(--accent), #e11d48)' : 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 800,
                      flexShrink: 0
                    }}
                  >
                    {user ? userInitial : <UserIcon size={18} color="var(--accent)" />}
                  </div>
                )}

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user ? (user.displayName || 'Kullanıcı') : 'Misafir Kullanıcı'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    {user ? (
                      syncStatus === 'syncing' ? (
                        <>
                          <RefreshCw size={11} className="spin" color="var(--cyan)" />
                          <span style={{ color: 'var(--cyan)' }}>Senkronize ediliyor...</span>
                        </>
                      ) : (
                        <>
                          <CloudCheck size={12} color="var(--muscle-emerald)" />
                          <span style={{ color: 'var(--muscle-emerald)' }}>Bulut Koruması Aktif</span>
                        </>
                      )
                    ) : (
                      <>
                        <Cloud size={12} color="var(--accent)" />
                        <span style={{ color: 'var(--accent)' }}>Bulut Hesabı Bağla</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <ChevronRight size={16} color="var(--text-dim)" style={{ flexShrink: 0 }} />
            </div>

            {/* PWA YÜKLEME BUTONU (Eğer yüklü değilse) */}
            {!isInstalled && (
              <div style={{ marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    promptInstall();
                  }}
                  className="burger-menu-item"
                  style={{
                    border: '1px solid rgba(255, 71, 87, 0.35)',
                    background: 'linear-gradient(135deg, rgba(255, 71, 87, 0.12) 0%, rgba(56, 189, 248, 0.08) 100%)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="burger-item-icon" style={{ background: 'var(--accent)', color: '#ffffff' }}>
                      <Smartphone size={16} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Uygulamayı Cihaza Yükle</span>
                        <span style={{ fontSize: 9.5, background: 'var(--muscle-emerald)', color: '#000', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>PWA</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ana ekrana ekle, internetsiz kullan</div>
                    </div>
                  </div>
                  <Download size={15} color="var(--accent)" />
                </button>
              </div>
            )}

            {/* SECTION: DIŞA AKTARMA VE YEDEK (Export & Data) */}
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, paddingLeft: 4 }}>
              Veri & Dışa Aktarma
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {/* JSON Export */}
              <button
                type="button"
                onClick={handleExportJSONClick}
                className="burger-menu-item"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="burger-item-icon" style={{ background: 'rgba(255, 71, 87, 0.12)', color: 'var(--accent)' }}>
                    <Download size={16} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>JSON Yedek İndir</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tüm verileri tam yedek olarak kaydet</div>
                  </div>
                </div>
                <span className="badge badge-lvl" style={{ fontSize: 10, padding: '2px 6px' }}>
                  {workouts.length} Kayıt
                </span>
              </button>

              {/* CSV Export */}
              <button
                type="button"
                onClick={handleExportCSVClick}
                className="burger-menu-item"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="burger-item-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--muscle-emerald)' }}>
                    <FileSpreadsheet size={16} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>CSV / Excel Tablosu</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Excel uyumlu antrenman tablosu</div>
                  </div>
                </div>
                <ChevronRight size={14} color="var(--text-dim)" />
              </button>

              {/* Advanced Data Management */}
              <button
                type="button"
                onClick={handleOpenBackup}
                className="burger-menu-item"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="burger-item-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', color: 'var(--cyan)' }}>
                    <Database size={16} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>Yedekleme & Geri Yükle</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>JSON yükle, sıfırla veya örnek veri</div>
                  </div>
                </div>
                <ChevronRight size={14} color="var(--text-dim)" />
              </button>
            </div>

            {/* SECTION: TERCİHLER (Preferences) */}
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, paddingLeft: 4 }}>
              Tercihler & Ayarlar
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {/* Sound Toggle */}
              <div
                onClick={handleToggleSound}
                className="burger-menu-item"
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="burger-item-icon" style={{ background: 'rgba(251, 191, 36, 0.12)', color: 'var(--gold)' }}>
                    {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>Ses Efektleri</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sayaç ve buton geri bildirim sesleri</div>
                  </div>
                </div>
                
                {/* Modern Switch UI */}
                <div
                  style={{
                    width: 38,
                    height: 22,
                    borderRadius: 12,
                    background: soundEnabled ? 'var(--accent)' : 'rgba(255, 255, 255, 0.1)',
                    position: 'relative',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 2,
                    boxShadow: soundEnabled ? '0 0 10px rgba(255, 71, 87, 0.4)' : 'none'
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#ffffff',
                      transform: soundEnabled ? 'translateX(16px)' : 'translateX(0px)',
                      transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Footer / App Info */}
            <div
              style={{
                marginTop: 6,
                paddingTop: 8,
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 10,
                color: 'var(--text-dim)',
                paddingLeft: 4,
                paddingRight: 4
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={12} color="var(--muscle-emerald)" />
                Hüs Spor Günlüğü • PWA
              </span>
              <span>v2.1.0</span>
            </div>
          </div>
        )}
      </div>

      {/* Backup & Restore Modal */}
      <BackupModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />
    </>
  );
};
