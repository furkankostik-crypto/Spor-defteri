import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { CheckCircle2, Trophy, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useWorkout();

  // En son 2 bildirimi göstererek ekranı asla doldurmayalım
  const visibleToasts = toasts.slice(-2);
  const isActive = visibleToasts.length > 0;

  return (
    <aside
      className={`toast-bar-container ${isActive ? 'is-active' : ''}`}
      aria-live="polite"
      role="region"
      aria-label="Bildirimler"
    >
      {visibleToasts.map((toast) => {
        let Icon = CheckCircle2;
        let iconColor = '#10b981';
        let barTypeClass = 'toast-bar-success';

        if (toast.type === 'pr' || toast.type === 'level') {
          Icon = Trophy;
          iconColor = '#fbbf24';
          barTypeClass = 'toast-bar-pr';
        } else if (toast.type === 'error') {
          Icon = AlertTriangle;
          iconColor = '#ff4757';
          barTypeClass = 'toast-bar-error';
        } else if (toast.type === 'info') {
          Icon = Info;
          iconColor = '#38bdf8';
          barTypeClass = 'toast-bar-info';
        }

        // Başlıktaki mükerrer emojileri temizleyip minimal ve şık gösterelim
        const cleanTitle = toast.title
          ? toast.title.replace(/^[\p{Emoji}\s]+/u, '').trim()
          : '';
        const displayTitle = cleanTitle || toast.title;

        return (
          <div
            key={toast.id}
            className={`toast-bar ${barTypeClass}`}
            onClick={() => removeToast(toast.id)}
            role="status"
          >
            <div className="toast-bar-icon">
              <Icon size={14} color={iconColor} strokeWidth={2.4} />
            </div>

            <div className="toast-bar-text">
              <span className="toast-bar-title">{displayTitle}</span>
              {toast.description && (
                <span className="toast-bar-desc">{toast.description}</span>
              )}
            </div>

            <button
              type="button"
              className="toast-bar-close"
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              aria-label="Kapat"
            >
              <X size={13} strokeWidth={2.2} />
            </button>
          </div>
        );
      })}
    </aside>
  );
};
