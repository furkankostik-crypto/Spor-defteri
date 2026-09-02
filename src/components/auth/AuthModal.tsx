import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkout } from '../../context/WorkoutContext';
import { sounds } from '../../utils/audio';
import { 
  X, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  LogOut, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2,
  Zap
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    user, 
    isConfigured, 
    syncStatus, 
    lastSyncedAt, 
    lastSyncMessage,
    savedWritesCount,
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    loginWithGoogle, 
    loginWithApple, 
    loginWithEmail, 
    registerWithEmail, 
    resetPassword, 
    logout 
  } = useAuth();

  const { syncWithCloud, workouts, showToast } = useWorkout();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setFormError(null);
    setForgotSuccess(false);
  };

  const handleGoogleLogin = async () => {
    sounds.playPop();
    setIsSubmitting(true);
    setFormError(null);
    const res = await loginWithGoogle();
    setIsSubmitting(false);
    if (res.success) {
      sounds.playSuccess();
      showToast({
        title: '🎉 Giriş Yapıldı',
        description: 'Google hesabınızla başarıyla bağlandınız.',
        type: 'success'
      });
      handleClose();
    } else {
      setFormError(res.error || 'Google ile giriş yapılamadı.');
    }
  };

  const handleAppleLogin = async () => {
    sounds.playPop();
    setIsSubmitting(true);
    setFormError(null);
    const res = await loginWithApple();
    setIsSubmitting(false);
    if (res.success) {
      sounds.playSuccess();
      showToast({
        title: '🎉 Giriş Yapıldı',
        description: 'Apple hesabınızla başarıyla bağlandınız.',
        type: 'success'
      });
      handleClose();
    } else {
      setFormError(res.error || 'Apple ile giriş yapılamadı.');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (!password && mode !== 'forgot')) {
      setFormError('Lütfen gerekli alanları doldurun.');
      return;
    }

    sounds.playPop();
    setIsSubmitting(true);
    setFormError(null);

    if (mode === 'login') {
      const res = await loginWithEmail(email, password);
      setIsSubmitting(false);
      if (res.success) {
        sounds.playSuccess();
        showToast({
          title: '✅ Giriş Başarılı',
          description: 'Antrenmanlarınız bulutla eşitlendi.',
          type: 'success'
        });
        handleClose();
      } else {
        setFormError(res.error || 'Giriş başarısız.');
      }
    } else if (mode === 'register') {
      const res = await registerWithEmail(email, password, displayName);
      setIsSubmitting(false);
      if (res.success) {
        sounds.playSuccess();
        showToast({
          title: '✨ Hoş Geldiniz!',
          description: 'Hesabınız başarıyla oluşturuldu.',
          type: 'success'
        });
        handleClose();
      } else {
        setFormError(res.error || 'Kayıt başarısız.');
      }
    } else if (mode === 'forgot') {
      const res = await resetPassword(email);
      setIsSubmitting(false);
      if (res.success) {
        setForgotSuccess(true);
      } else {
        setFormError(res.error || 'Sıfırlama e-postası gönderilemedi.');
      }
    }
  };

  const handleManualSync = async () => {
    sounds.playPop();
    await syncWithCloud({ isManual: true });
  };

  const handleLogout = async () => {
    sounds.playPop();
    await logout();
    showToast({
      title: 'Çıkış Yapıldı',
      description: 'Yerel moddasınız.',
      type: 'info'
    });
  };

  const formatLastSync = (ts: number | null) => {
    if (!ts) return 'Henüz eşitlenmedi';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 10) return 'Az önce';
    if (diff < 60) return `${diff} saniye önce`;
    if (diff < 3600) return `${Math.floor(diff / 60)} dakika önce`;
    const d = new Date(ts);
    return `${d.toLocaleDateString('tr-TR')} ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: 420, 
          padding: 22, 
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div 
              style={{
                width: 38,
                height: 38,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(255, 71, 87, 0.2), rgba(56, 189, 248, 0.2))',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)'
              }}
            >
              <Cloud size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                {user ? 'Hesap & Bulut Koruması' : 'Bulut Hesabı Bağla'}
              </h3>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {user ? 'Verileriniz Google Firebase bulutunda güvende' : 'Geçmişinizin asla silinmemesi için bağlanın'}
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={handleClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        {/* NOT CONFIGURED BANNER */}
        {!isConfigured && (
          <div 
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.25)',
              marginBottom: 16,
              fontSize: 12,
              color: '#fde68a',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start'
            }}
          >
            <AlertCircle size={18} color="var(--gold)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>Firebase Kurulumu Bekleniyor:</strong> Bulut senkronizasyonunu aktif etmek için projenize <code>.env</code> değişkenlerini ekleyin.
              <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
                Uygulama şu an <strong>Yerel Depolama (Offline)</strong> modunda çalışmaktadır.
              </div>
            </div>
          </div>
        )}

        {/* LOGGED IN VIEW - CLEAN, MINIMAL & REASSURING */}
        {user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* User Profile Card */}
            <div 
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'Profil'} 
                  style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid var(--accent)', flexShrink: 0 }}
                />
              ) : (
                <div 
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent), #ff7675)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 17,
                    fontWeight: 800,
                    color: '#ffffff',
                    flexShrink: 0
                  }}
                >
                  {(user.displayName || user.email || 'S').charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.displayName || 'Sporcu'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                  <ShieldCheck size={12} color="var(--muscle-emerald)" />
                  <span style={{ fontSize: 10, color: 'var(--muscle-emerald)', fontWeight: 700 }}>
                    Bulut Koruması Aktif
                  </span>
                </div>
              </div>
            </div>

            {/* Sync Info Card */}
            <div 
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                  Bulut Durumu
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {syncStatus === 'syncing' ? (
                    <>
                      <RefreshCw size={13} className="spin" color="var(--cyan)" />
                      <span style={{ color: 'var(--cyan)' }}>Senkronize ediliyor...</span>
                    </>
                  ) : syncStatus === 'error' ? (
                    <>
                      <CloudOff size={13} color="var(--accent)" />
                      <span style={{ color: 'var(--accent)' }}>Bağlantı Hatası</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} color="var(--muscle-emerald)" />
                      <span>{workouts.length} Antrenman Bulutta Güvende</span>
                    </>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {lastSyncMessage || 'Son Senkronizasyon'}: {formatLastSync(lastSyncedAt)}
                </div>
              </div>

              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncStatus === 'syncing'}
                className="btn btn-secondary"
                style={{ padding: '8px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                title="Bulutla hemen eşitle"
              >
                <RefreshCw size={13} className={syncStatus === 'syncing' ? 'spin' : ''} />
                <span>Şimdi Eşitle</span>
              </button>
            </div>

            {/* Smart Quota Engine Badge */}
            {savedWritesCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  fontSize: 11,
                  color: '#a7f3d0'
                }}
              >
                <Zap size={14} color="var(--muscle-emerald)" />
                <span>Akıllı kota motoru <strong>{savedWritesCount}</strong> gereksiz isteği engelledi.</span>
              </div>
            )}

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}
              >
                <LogOut size={15} />
                <span>Çıkış Yap</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-primary"
                style={{ flex: 1, padding: '11px', fontSize: 13 }}
              >
                Tamam
              </button>
            </div>
          </div>
        ) : (
          /* LOGGED OUT (LOGIN / REGISTER / FORGOT) VIEW */
          <div>
            {/* Mode Switcher */}
            {mode !== 'forgot' && (
              <div 
                style={{
                  display: 'flex',
                  background: 'var(--input-bg)',
                  padding: 4,
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 16,
                  border: '1px solid var(--border)'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setMode('login');
                    setFormError(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: mode === 'login' ? 'var(--accent)' : 'transparent',
                    color: mode === 'login' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Giriş Yap
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setMode('register');
                    setFormError(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: mode === 'register' ? 'var(--accent)' : 'transparent',
                    color: mode === 'register' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Hesap Oluştur
                </button>
              </div>
            )}

            {/* Error Message */}
            {formError && (
              <div 
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 71, 87, 0.15)',
                  border: '1px solid rgba(255, 71, 87, 0.3)',
                  color: '#ff8a93',
                  fontSize: 12,
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            {/* Social Logins */}
            {mode !== 'forgot' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {/* Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting || !isConfigured}
                  className="btn"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#ffffff',
                    color: '#1f2937',
                    fontWeight: 700,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    opacity: isConfigured ? 1 : 0.6,
                    cursor: isConfigured ? 'pointer' : 'not-allowed'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google ile Devam Et</span>
                </button>

                {/* Apple Button */}
                <button
                  type="button"
                  onClick={handleAppleLogin}
                  disabled={isSubmitting || !isConfigured}
                  className="btn"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#000000',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    opacity: isConfigured ? 1 : 0.6,
                    cursor: isConfigured ? 'pointer' : 'not-allowed'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.85.94-2.93-.93.04-2.07.62-2.73 1.39-.58.67-1.1 1.77-.96 2.82 1.04.08 2.11-.51 2.75-1.28z" />
                  </svg>
                  <span>Apple ile Devam Et</span>
                </button>
              </div>
            )}

            {mode !== 'forgot' && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 16,
                  color: 'var(--text-dim)',
                  fontSize: 12
                }}
              >
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span>veya E-posta ile</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
            )}

            {/* Email Form */}
            {forgotSuccess ? (
              <div 
                style={{
                  textAlign: 'center',
                  padding: '20px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div 
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--muscle-emerald)'
                  }}
                >
                  <CheckCircle2 size={28} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#ffffff' }}>
                  Sıfırlama Bağlantısı Gönderildi!
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 300 }}>
                  <strong>{email}</strong> adresine şifre sıfırlama talimatlarını içeren bir e-posta ilettik.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setForgotSuccess(false);
                  }}
                  className="btn btn-secondary"
                  style={{ marginTop: 10, padding: '8px 16px', fontSize: 13 }}
                >
                  Giriş Ekranına Dön
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {mode === 'register' && (
                  <div>
                    <label className="form-label" style={{ marginBottom: 4 }}>
                      <UserIcon size={13} color="var(--accent)" />
                      İsim & Soyisim
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Hakan Yılmaz"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="form-input"
                    />
                  </div>
                )}

                <div>
                  <label className="form-label" style={{ marginBottom: 4 }}>
                    <Mail size={13} color="var(--accent)" />
                    E-posta Adresi
                  </label>
                  <input
                    type="email"
                    placeholder="ornek@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label className="form-label" style={{ margin: 0 }}>
                        <Lock size={13} color="var(--accent)" />
                        Şifre
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot');
                            setFormError(null);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--cyan)',
                            fontSize: 11,
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          Şifremi Unuttum?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="form-input"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !isConfigured}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: 14,
                    fontWeight: 800,
                    marginTop: 6,
                    opacity: isConfigured ? 1 : 0.6
                  }}
                >
                  {isSubmitting ? (
                    <RefreshCw size={16} className="spin" />
                  ) : mode === 'login' ? (
                    'Giriş Yap'
                  ) : mode === 'register' ? (
                    'Hesabı Oluştur & Eşitle'
                  ) : (
                    'Sıfırlama Bağlantısı Gönder'
                  )}
                </button>

                {mode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setFormError(null);
                    }}
                    className="btn btn-secondary"
                    style={{ width: '100%', padding: '10px', fontSize: 12 }}
                  >
                    Giriş Ekranına Geri Dön
                  </button>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
