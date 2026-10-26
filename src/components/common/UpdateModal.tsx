import React, { useState, useEffect } from 'react';
import { 
  X, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Smartphone, 
  AlertTriangle,
  RotateCcw,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { useBackButton } from '../../context/BackNavigationContext';
import { nativeBridge } from '../../utils/nativeBridge';
import { sounds } from '../../utils/audio';
import { 
  CURRENT_APP_VERSION, 
  checkAppUpdate, 
  refreshAppCache, 
  downloadAppApk, 
  RemoteVersionInfo 
} from '../../utils/appVersion';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [remoteInfo, setRemoteInfo] = useState<RemoteVersionInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useBackButton(isOpen, onClose, 80);

  const runCheck = async () => {
    setIsChecking(true);
    setErrorMsg(null);
    try {
      const result = await checkAppUpdate();
      if (result.isError) {
        setErrorMsg(result.errorMessage || 'Güncelleme sunucusuna ulaşılamadı');
        setRemoteInfo(null);
        setHasUpdate(false);
      } else {
        setRemoteInfo(result.remote || null);
        setHasUpdate(result.hasUpdate);
      }
    } catch {
      setErrorMsg('Bağlantı sağlanırken bir hata oluştu');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runCheck();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRefreshCache = async () => {
    sounds.playPop();
    setIsUpdating(true);
    await refreshAppCache();
  };

  const handleDownloadApk = () => {
    sounds.playPop();
    downloadAppApk(remoteInfo?.apkUrl);
  };

  const isNative = nativeBridge.isNative();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'calc(16px + var(--safe-top, 0px)) 16px calc(16px + var(--safe-bottom, 0px)) 16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sounds.playPop();
          onClose();
        }
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '100%',
          overflowY: 'auto',
          background: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 71, 87, 0.15)',
          animation: 'burgerMenuFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '12px',
                background: hasUpdate 
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(56, 189, 248, 0.2))' 
                  : 'linear-gradient(135deg, rgba(255, 71, 87, 0.2), rgba(168, 85, 247, 0.2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: hasUpdate ? '1px solid var(--muscle-emerald)' : '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {hasUpdate ? (
                <Sparkles size={22} color="var(--muscle-emerald)" />
              ) : (
                <RotateCcw size={22} color="var(--accent)" className={isChecking ? 'spin' : ''} />
              )}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#ffffff' }}>
                Güncelleme Merkezi
              </h3>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Smartphone size={12} color="var(--text-dim)" />
                <span>{isNative ? 'GymPad Native Android' : 'GymPad Web / PWA'}</span>
                <span>•</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{CURRENT_APP_VERSION.displayVersion}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Card */}
        <div
          style={{
            padding: '16px',
            borderRadius: '16px',
            background: hasUpdate 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(56, 189, 248, 0.08))' 
              : errorMsg 
              ? 'rgba(239, 68, 68, 0.1)' 
              : 'rgba(255, 255, 255, 0.03)',
            border: hasUpdate 
              ? '1px solid rgba(16, 185, 129, 0.35)' 
              : errorMsg 
              ? '1px solid rgba(239, 68, 68, 0.3)' 
              : '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {isChecking ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
              <RefreshCw size={20} className="spin" color="var(--cyan)" />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#ffffff' }}>
                  Güncellemeler Denetleniyor...
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  Sunucudaki son sürüm bilgisi kontrol ediliyor
                </div>
              </div>
            </div>
          ) : errorMsg ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertTriangle size={18} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                  Sunucuya Erişilemedi
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  {errorMsg}. Çevrimdışı olabilirsiniz veya ağınız sunucuyu engelliyor olabilir.
                </div>
              </div>
            </div>
          ) : hasUpdate ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span
                  style={{
                    background: 'var(--muscle-emerald)',
                    color: '#000000',
                    fontWeight: 900,
                    fontSize: 10.5,
                    padding: '2px 8px',
                    borderRadius: 6,
                    letterSpacing: '0.04em'
                  }}
                >
                  YENİ SÜRÜM MEVCUT
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--muscle-emerald)' }}>
                  v{remoteInfo?.version} (Build {remoteInfo?.build})
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-main)', lineHeight: 1.5 }}>
                GymPad için yeni bir güncelleme hazırlandı! Yeni özellikleri ve performans geliştirmelerini hemen edinebilirsiniz.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle2 size={24} color="var(--muscle-emerald)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#ffffff' }}>
                  GymPad En Güncel Sürümde
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  Cihazınızda en son kararlı sürüm ({CURRENT_APP_VERSION.displayVersion}) çalışıyor.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Release Notes */}
        {remoteInfo?.releaseNotes && remoteInfo.releaseNotes.length > 0 && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '14px',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Zap size={12} color="var(--gold)" />
              <span>Sürüm Yenilikleri & İyileştirmeler:</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {remoteInfo.releaseNotes.map((note, idx) => (
                <li key={idx} style={{ lineHeight: 1.4 }}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Safe notice */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)', paddingLeft: 4 }}>
          <ShieldCheck size={14} color="var(--cyan)" style={{ flexShrink: 0 }} />
          <span>Güncelleme ve yenileme işlemleri antrenman verilerinizi kesinlikle silmez.</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {/* 1. Android APK Update / Download Button */}
          {(hasUpdate || isNative) && (
            <button
              type="button"
              onClick={handleDownloadApk}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '14px',
                background: hasUpdate
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(56, 189, 248, 0.15) 100%)',
                color: hasUpdate ? '#000000' : '#ffffff',
                border: hasUpdate ? 'none' : '1px solid rgba(16, 185, 129, 0.4)',
                fontWeight: 800,
                fontSize: 13.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: hasUpdate ? '0 4px 16px rgba(16, 185, 129, 0.4)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <Download size={17} />
              <span>
                {hasUpdate
                  ? `Yeni GymPad APK'yı İndir & Kur${remoteInfo?.apkSize ? ` (${remoteInfo.apkSize})` : ''}`
                  : `Güncel GymPad APK'sını Tekrar İndir`}
              </span>
            </button>
          )}

          {/* 2. Web / Live Cache Refresh Button (Works on BOTH Android WebView & Browser) */}
          <button
            type="button"
            onClick={handleRefreshCache}
            disabled={isUpdating}
            style={{
              width: '100%',
              padding: '11px 16px',
              borderRadius: '14px',
              background: (!hasUpdate && !isNative)
                ? 'linear-gradient(135deg, var(--accent) 0%, #e11d48 100%)'
                : 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              border: (!hasUpdate && !isNative) ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
              fontWeight: 700,
              fontSize: 13,
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: isUpdating ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={15} className={isUpdating ? 'spin' : ''} />
            <span>
              {isUpdating 
                ? 'Yenileniyor...' 
                : isNative 
                ? 'Arayüzü & Önbelleği Yenile (Hızlı Canlı Güncelleme)' 
                : 'Önbelleği Temizle & Yenile'}
            </span>
          </button>

          {/* 3. Re-check button */}
          <button
            type="button"
            onClick={runCheck}
            disabled={isChecking}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: 12,
              padding: '6px',
              cursor: 'pointer',
              textAlign: 'center',
              textDecoration: 'underline'
            }}
          >
            {isChecking ? 'Denetleniyor...' : 'Güncellemeleri Tekrar Denetle'}
          </button>
        </div>
      </div>
    </div>
  );
};
