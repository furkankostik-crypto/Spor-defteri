import React from 'react';
import { usePwaInstall } from '../../context/PwaInstallContext';
import { 
  Download, 
  Smartphone, 
  Share2, 
  PlusSquare, 
  X, 
  Zap, 
  WifiOff, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const { 
    isInstalled, 
    isIOS, 
    showModal, 
    setShowModal, 
    promptInstall
  } = usePwaInstall();

  // Zaten PWA modunda çalışıyorsa hiçbir şey gösterme
  if (isInstalled) return null;

  return (
    <>
      {/* DETAYLI YÜKLEME / iOS REHBER MODALI (Menüden "Uygulamayı Cihaza Yükle" seçildiğinde açılır) */}
      {showModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              background: 'linear-gradient(180deg, #161e31 0%, #0d121d 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px 20px',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.7)',
              position: 'relative'
            }}
          >
            {/* Kapat butonu */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: 'var(--text-muted)',
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            {/* Başlık ve İkon */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div 
                style={{
                  width: 68,
                  height: 68,
                  margin: '0 auto 12px auto',
                  borderRadius: 18,
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(255, 71, 87, 0.35)',
                  border: '2px solid rgba(255, 71, 87, 0.4)',
                  background: '#0b0f17',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img 
                  src="/icon-192.png" 
                  alt="Spor Defterim" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
                Spor Defterim'i Cihazına Yükle
              </h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>
                Tek dokunuşla tam ekran, internet bağlantısı olmadan da çalışan yerel uygulama deneyimi!
              </p>
            </div>

            {/* Avantajlar */}
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: 8, 
                marginBottom: 20 
              }}
            >
              <div style={{ background: 'var(--card-nested)', padding: '10px 6px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <WifiOff size={18} color="var(--muscle-emerald)" style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: 11, fontWeight: 700 }}>Çevrimdışı</div>
                <div style={{ fontSize: 9.5, color: 'var(--text-dim)' }}>Net gerekmez</div>
              </div>
              <div style={{ background: 'var(--card-nested)', padding: '10px 6px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <Zap size={18} color="var(--gold)" style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: 11, fontWeight: 700 }}>Işık Hızında</div>
                <div style={{ fontSize: 9.5, color: 'var(--text-dim)' }}>Anında açılır</div>
              </div>
              <div style={{ background: 'var(--card-nested)', padding: '10px 6px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <Smartphone size={18} color="var(--cyan)" style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: 11, fontWeight: 700 }}>Tam Ekran</div>
                <div style={{ fontSize: 9.5, color: 'var(--text-dim)' }}>Adres çubuğu yok</div>
              </div>
            </div>

            {/* Cihaza Özel Adımlar */}
            {isIOS ? (
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={16} /> iPhone / iPad Kurulum Adımları
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--cyan)', color: '#000', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      1
                    </div>
                    <div>
                      Safari'nin altındaki <strong style={{ color: '#ffffff' }}><Share2 size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> Paylaş</strong> butonuna dokunun.
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--cyan)', color: '#000', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      2
                    </div>
                    <div>
                      Açılan menüde aşağı kaydırıp <strong style={{ color: '#ffffff' }}><PlusSquare size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> "Ana Ekrana Ekle"</strong> seçeneğini seçin.
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--cyan)', color: '#000', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      3
                    </div>
                    <div>
                      Sağ üst köşedeki <strong style={{ color: 'var(--muscle-emerald)' }}>"Ekle"</strong> düğmesine dokunun. Hazır!
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muscle-emerald)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={16} /> Android / Chrome / Edge Kurulumu
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 12px 0' }}>
                  Aşağıdaki butona dokunduğunuzda tarayıcınız uygulamayı ana ekranınıza ekleyecektir. Eğer soru çıkmazsa tarayıcı menüsünden <strong>(⋮) "Uygulamayı Yükle"</strong> seçeneğine dokunabilirsiniz.
                </p>
                <button
                  onClick={promptInstall}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, var(--accent) 0%, #e03141 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 16px rgba(255, 71, 87, 0.4)'
                  }}
                >
                  <Download size={18} />
                  Şimdi Yükle
                </button>
              </div>
            )}

            {/* Kapat butonu */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-main)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '10px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Anladım, Kapat
            </button>
          </div>
        </div>
      )}
    </>
  );
};
