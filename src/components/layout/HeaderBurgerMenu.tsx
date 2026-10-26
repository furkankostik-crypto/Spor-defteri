import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkout } from '../../context/WorkoutContext';
import { sounds } from '../../utils/audio';
import { 
  Menu, 
  X, 
  Cloud, 
  CloudCheck, 
  RefreshCw, 
  Download, 
  User as UserIcon, 
  ChevronRight,
  Smartphone,
  Settings
} from 'lucide-react';
import { usePwaInstall } from '../../context/PwaInstallContext';
import { useBackButton } from '../../context/BackNavigationContext';
import { nativeBridge } from '../../utils/nativeBridge';
import { CURRENT_APP_VERSION, checkAppUpdate } from '../../utils/appVersion';

export const HeaderBurgerMenu: React.FC = () => {
  const { user, syncStatus, setIsAuthModalOpen } = useAuth();
  const { isInstalled, promptInstall } = usePwaInstall();
  const { 
    setIsSettingsModalOpen
  } = useWorkout();

  const [isOpen, setIsOpen] = useState(false);
  const [hasUpdateBadge, setHasUpdateBadge] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Background update check on mount & when returning to foreground
  useEffect(() => {
    let isMounted = true;
    let lastCheckedAt = Date.now();

    const runCheck = () => {
      checkAppUpdate().then((res) => {
        if (isMounted && res.hasUpdate) {
          setHasUpdateBadge(true);
        }
      }).catch(() => {});
    };

    runCheck();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastCheckedAt > 5 * 60 * 1000) {
        lastCheckedAt = Date.now();
        runCheck();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

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

  const handleOpenSettings = () => {
    sounds.playPop();
    setIsOpen(false);
    setIsSettingsModalOpen(true);
  };

  const userInitial = (user?.displayName || user?.email || 'S').charAt(0).toUpperCase();

  return (
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
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          height: 31,
          padding: user ? '0 10px 0 5px' : '0 11px',
          borderRadius: 999,
          background: isOpen ? 'rgba(255, 71, 87, 0.15)' : 'rgba(18, 24, 38, 0.85)',
          border: isOpen ? '1px solid var(--accent)' : '1px solid var(--border)',
          color: '#ffffff',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          backdropFilter: 'blur(10px)',
          boxShadow: isOpen ? '0 0 16px rgba(255, 71, 87, 0.3)' : 'var(--shadow-sm)',
          boxSizing: 'border-box',
          lineHeight: 1
        }}
        title="Menü & Seçenekler"
      >
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1 }}>
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'Profil'} 
                style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid var(--accent)', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), #e11d48)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10.5,
                  fontWeight: 800,
                  flexShrink: 0
                }}
              >
                {userInitial}
              </div>
            )}
            
            <span style={{ fontSize: 11.5, fontWeight: 700, maxWidth: 75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.displayName?.split(' ')[0] || 'Hesap'}
            </span>

            {/* Status Dot / Cloud Indicator */}
            {syncStatus === 'syncing' ? (
              <RefreshCw size={11.5} className="spin" color="var(--cyan)" style={{ flexShrink: 0 }} />
            ) : (
              <CloudCheck size={12.5} color="var(--muscle-emerald)" style={{ flexShrink: 0 }} />
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1 }}>
            <div
              style={{
                width: 7.5,
                height: 7.5,
                borderRadius: '50%',
                background: 'var(--accent)',
                boxShadow: '0 0 8px var(--accent)',
                flexShrink: 0
              }}
            />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>
              Menü
            </span>
          </div>
        )}

        {/* Hamburger / Close Icon */}
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: isOpen ? 'var(--accent)' : 'var(--text-muted)', position: 'relative', flexShrink: 0 }}>
          {isOpen ? <X size={15} /> : <Menu size={15} />}
          {hasUpdateBadge && !isOpen && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--muscle-emerald)',
                boxShadow: '0 0 6px var(--muscle-emerald)'
              }}
            />
          )}
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
            width: 'min(300px, calc(100vw - 32px))',
            background: 'rgba(15, 23, 42, 0.97)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            zIndex: 999,
            padding: '12px',
            animation: 'burgerMenuFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            transformOrigin: 'top right'
          }}
        >
          {/* Header row with Title and quick gear icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '2px 4px 8px 4px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: 10
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              GymPad Menü
            </span>
            <button
              type="button"
              onClick={handleOpenSettings}
              style={{
                background: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                color: '#c084fc',
                borderRadius: '50%',
                width: 26,
                height: 26,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Ayarlar Sayfası (Çark)"
              aria-label="Ayarlar"
            >
              <Settings size={14} />
            </button>
          </div>

          {/* 1. Hesap & Bulut Eşitleme Kartı */}
          <div
            onClick={handleOpenAuth}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
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
                  style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--accent)', flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: user ? 'linear-gradient(135deg, var(--accent), #e11d48)' : 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 800,
                    flexShrink: 0
                  }}
                >
                  {user ? userInitial : <UserIcon size={16} color="var(--accent)" />}
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

            <ChevronRight size={15} color="var(--text-dim)" style={{ flexShrink: 0 }} />
          </div>

          {/* Menü Öğeleri Listesi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {/* Ayarlar Sayfası Butonu */}
            <button
              type="button"
              onClick={handleOpenSettings}
              className="burger-menu-item"
              style={{
                border: hasUpdateBadge ? '1px solid rgba(168, 85, 247, 0.35)' : undefined,
                background: hasUpdateBadge ? 'rgba(168, 85, 247, 0.08)' : undefined
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  className="burger-item-icon"
                  style={{
                    background: 'rgba(168, 85, 247, 0.16)',
                    color: '#c084fc',
                    boxShadow: '0 0 8px rgba(168, 85, 247, 0.2)'
                  }}
                >
                  <Settings size={16} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Ayarlar</span>
                    {hasUpdateBadge && (
                      <span style={{ fontSize: 9, background: 'var(--muscle-emerald)', color: '#000', padding: '1px 5px', borderRadius: 4, fontWeight: 900 }}>
                        YENİ
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Ses, titreşim, veri yedekleme, sistem
                  </div>
                </div>
              </div>
              <ChevronRight size={14} color="var(--text-dim)" />
            </button>
          </div>

          {/* Android APK & PWA Kompakt İndirme Şeridi (Sadece Web/PWA üzerinde gösterilir) */}
          {!nativeBridge.isNative() && (
            <div style={{ marginBottom: 8, display: 'grid', gridTemplateColumns: !isInstalled ? '1fr 1fr' : '1fr', gap: 6 }}>
              <a
                href="/GymPad.apk"
                download="GymPad.apk"
                onClick={() => {
                  sounds.playPop();
                  setIsOpen(false);
                }}
                className="burger-menu-item"
                style={{
                  textDecoration: 'none',
                  padding: '7px 8px',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  background: 'rgba(16, 185, 129, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <Smartphone size={13} color="var(--muscle-emerald)" />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#ffffff' }}>APK İndir</span>
                <span style={{ fontSize: 8.5, background: 'var(--muscle-emerald)', color: '#000', padding: '0px 4px', borderRadius: 3, fontWeight: 900 }}>APK</span>
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
                    padding: '7px 8px',
                    border: '1px solid rgba(255, 71, 87, 0.35)',
                    background: 'rgba(255, 71, 87, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <Download size={13} color="var(--accent)" />
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#ffffff' }}>PWA Ekle</span>
                  <span style={{ fontSize: 8.5, background: 'rgba(255, 255, 255, 0.18)', color: '#fff', padding: '0px 4px', borderRadius: 3, fontWeight: 800 }}>WEB</span>
                </button>
              )}
            </div>
          )}

          {/* Footer / App Info */}
          <div
            style={{
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
            <span>{CURRENT_APP_VERSION.displayVersion}</span>
          </div>
        </div>
      )}
    </div>
  );
};
