import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { CheckCircle2, Trophy, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useWorkout();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        let iconColor = '#10b981';

        if (toast.type === 'pr' || toast.type === 'level') {
          Icon = Trophy;
          iconColor = '#fbbf24';
        } else if (toast.type === 'error') {
          Icon = AlertTriangle;
          iconColor = '#ff4757';
        } else if (toast.type === 'info') {
          Icon = Info;
          iconColor = '#38bdf8';
        }

        return (
          <div key={toast.id} className={`toast ${toast.type === 'pr' ? 'toast-pr' : ''}`}>
            <Icon size={20} color={iconColor} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#f8fafc' }}>
                {toast.title}
              </div>
              {toast.description && (
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {toast.description}
                </div>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: 2
              }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
