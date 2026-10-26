import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkout } from '../../context/WorkoutContext';
import { sounds } from '../../utils/audio';
import { BackupModal } from '../common/BackupModal';
import { 
  Menu, 
  X, 
  Cloud, 
  CloudCheck, 
  RefreshCw, 
  Download, 
  Database, 
  Volume2, 
  VolumeX, 
  User as UserIcon, 
  ChevronRight,
  Smartphone,
  Scale
} from 'lucide-react';
import { usePwaInstall } from '../../context/PwaInstallContext';
import { useBackButton } from '../../context/BackNavigationContext';
import { nativeBridge } from '../../utils/nativeBridge';

export const HeaderBurgerMenu: React.FC = () => {
  const { user, syncStatus, setIsAuthModalOpen } = useAuth();
  const { isInstalled, promptInstall } = usePwaInstall();
  const { 
    workouts, 
    soundEnabled, 
    setSoundEnabled, 
    setIsProfileModalOpen,
    showToast
  } = useWorkout();

  const [isOpen, setIsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isUpdatingApp, setIsUpdatingApp] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useBackButton(isOpen, () => setIsOpen(false), 70);

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

  const handleCheckUpdate = async () => {
    if (isUpdatingApp) return;
    sounds.playPop();
    setIsUpdatingApp(true);

    try {
      // 1. Unregister Service Workers & force update check
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(async (reg) => {
            try {
              await reg.update();
              await reg.unregister();
            } catch {}
          })
        );
      }

      // 2. Clear all Cache Storage (leaves localStorage/IndexedDB workout data completely intact!)
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }

      showToast({
        title: 'Güncelleme Alındı',
        description: 'Uygulama en son sürüme yenileniyor...',
        type: 'success'
      });

      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('v', Date.now().toString());
        window.location.replace(url.toString());
      }, 450);
    } catch {
      window.location.reload();
    }
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
              width: 'min(320px, calc(100vw - 32px))',
              background: 'rgba(15, 23, 42, 0.96)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              zIndex: 999,
              padding: '12px',
              animation: 'burgerMenuFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              transformOrigin: 'top right'
            }}
          >
            {/* 1. Hesap & Bulut Eşitleme */}
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
                marginBottom: 8,
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
                    {user ? (user.displayName || 'Kullanıcı') : 'Bulut Hesabı Bağla'}
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
                        <span>Cihazlar arası yedekle</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <ChevronRight size={16} color="var(--text-dim)" style={{ flexShrink: 0 }} />
            </div>

            {/* Android Native APK İndirme Butonu (Sadece Web/PWA üzerinde gösterilir) */}
            {!nativeBridge.isNative() && (
              <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <a
                  href="https://github.com/furkankostik-crypto/Spor-defteri/releases/download/v1.4.0/GymPad.apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    sounds.playPop();
                    setIsOpen(false);
                  }}
                  className="burger-menu-item"
                  style={{
                    textDecoration: 'none',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(56, 189, 248, 0.08) 100%)'
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

            {/* Menu Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
              {/* 2. Sporcu Profili */}
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="burger-menu-item"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="burger-item-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', color: 'var(--cyan)' }}>
                    <Scale size={16} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>Sporcu Profili</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Vücut ağırlığı ve antrenman hedefi</div>
                  </div>
                </div>
                <ChevronRight size={14} color="var(--text-dim)" />
              </button>

              {/* 3. Veri & Yedekleme */}
              <button
                type="button"
                onClick={handleOpenBackup}
                className="burger-menu-item"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="burger-item-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--muscle-emerald)' }}>
                    <Database size={16} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>Veri & Yedekleme</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>JSON/Excel dışa aktar, geri yükle</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {workouts.length > 0 && (
                    <span className="badge badge-lvl" style={{ fontSize: 9.5, padding: '1px 6px' }}>
                      {workouts.length}
                    </span>
                  )}
                  <ChevronRight size={14} color="var(--text-dim)" />
                </div>
              </button>

              {/* 4. Ses Efektleri */}
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
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Geri bildirim sesleri</div>
                  </div>
                </div>
                
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

              {/* 5. Uygulamayı Güncelle (Sadece Web/PWA için) */}
              {!nativeBridge.isNative() && (
                <button
                  type="button"
                  onClick={handleCheckUpdate}
                  disabled={isUpdatingApp}
                  className="burger-menu-item"
                  style={{ opacity: isUpdatingApp ? 0.7 : 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="burger-item-icon" style={{ background: 'rgba(168, 85, 247, 0.14)', color: '#c084fc' }}>
                      <RefreshCw size={16} className={isUpdatingApp ? 'spin' : ''} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                        {isUpdatingApp ? 'Güncelleniyor...' : 'Uygulamayı Güncelle'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Önbelleği yenile ve son sürümü yükle
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#c084fc',
                      background: 'rgba(168, 85, 247, 0.14)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      padding: '2px 7px',
                      borderRadius: 6
                    }}
                  >
                    Yenile
                  </span>
                </button>
              )}
            </div>

            {/* Footer / App Info */}
            <div
              style={{
                marginTop: 4,
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
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <img src="/favicon.png" alt="GymPad" style={{ width: 14, height: 14, borderRadius: 4 }} />
                {nativeBridge.isNative() ? 'GymPad • Native App' : 'GymPad • PWA'}
              </span>
              <span>v1.4.0 (Build 14)</span>
            </div>
          </div>
        )}
      </div>

      {/* Backup & Restore Modal */}
      <BackupModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />
    </>
  );
};
