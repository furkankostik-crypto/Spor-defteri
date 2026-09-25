import React from 'react';
import { useBackNavigation } from '../../context/BackNavigationContext';
import { useWorkout } from '../../context/WorkoutContext';
import { LogOut, X, ArrowLeft, ShieldAlert } from 'lucide-react';

export const ExitConfirmModal: React.FC = () => {
  const { isExitModalOpen, exitModalPulse, cancelExit, confirmExit } = useBackNavigation();
  const { isLoggingWorkout } = useWorkout();

  if (!isExitModalOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={cancelExit}
      style={{
        zIndex: 2000,
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div
        key={exitModalPulse}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 380,
          width: '90%',
          padding: '22px 20px',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(180deg, #131b2e 0%, #0b1120 100%)',
          border: exitModalPulse > 0 ? '1.5px solid rgba(239, 68, 68, 0.75)' : '1.5px solid rgba(239, 68, 68, 0.35)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(239, 68, 68, 0.2)',
          animation: exitModalPulse > 0 ? 'fadeIn 0.12s ease-out' : 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171',
                flexShrink: 0
              }}
            >
              <LogOut size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>
                Uygulamadan Çıkılsın mı?
              </h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Spor Defterim
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={cancelExit}
            className="btn-icon"
            style={{
              color: 'var(--text-muted)',
              borderRadius: 'var(--radius-full)',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              cursor: 'pointer'
            }}
            title="Kapat"
          >
            <X size={17} />
          </button>
        </div>

        {/* Message */}
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px' }}>
          Uygulamayı kapatmak istediğinize emin misiniz?
        </p>

        {exitModalPulse > 0 && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#fca5a5',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 11px',
              marginBottom: 14
            }}
          >
            Çıkmak için lütfen ekrandaki <strong>"Evet, Uygulamadan Çık"</strong> butonuna dokunun.
          </div>
        )}

        {/* Active workout alert if currently logging */}
        {isLoggingWorkout && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 9,
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              marginBottom: 16,
              fontSize: 12,
              color: '#fde68a',
              lineHeight: 1.45
            }}
          >
            <ShieldAlert size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>Devam eden bir antrenmanınız var.</strong>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Oturumunuz otomatik olarak saklanır, uygulamayı tekrar açtığınızda kaldığınız yerden devam edebilirsiniz.
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {/* Safe Primary Action: Stay in App (Vazgeç) */}
          <button
            type="button"
            onClick={cancelExit}
            className="btn btn-primary"
            style={{
              padding: '12px 16px',
              fontSize: 13.5,
              fontWeight: 800,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(56, 189, 248, 0.25)'
            }}
          >
            <ArrowLeft size={16} />
            <span>Uygulamada Kal (Vazgeç)</span>
          </button>

          {/* Danger Action: Confirm Exit */}
          <button
            type="button"
            onClick={confirmExit}
            className="btn btn-secondary"
            style={{
              padding: '11px 16px',
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              cursor: 'pointer'
            }}
          >
            <LogOut size={15} />
            <span>Evet, Uygulamadan Çık</span>
          </button>
        </div>
      </div>
    </div>
  );
};
