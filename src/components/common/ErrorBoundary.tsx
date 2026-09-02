import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary yakaladı:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = () => {
    if (window.confirm('Verileri sıfırlamak istediğinize emin misiniz? Bozuk bir yerel veri varsa bu işlem sorunu çözecektir.')) {
      try {
        localStorage.clear();
      } catch (e) {
        console.error('localStorage temizlenemedi:', e);
      }
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: '#0b0f17',
            color: '#f8fafc',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          <div
            style={{
              maxWidth: 440,
              width: '100%',
              background: 'rgba(18, 24, 38, 0.95)',
              border: '1px solid rgba(255, 71, 87, 0.3)',
              borderRadius: 20,
              padding: 24,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(255, 71, 87, 0.15)',
                color: '#ff4757',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#ffffff' }}>
              Bir Şeyler Ters Gitti
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, marginBottom: 20 }}>
              Uygulama beklenmedik bir hatayla karşılaştı. Sayfayı yenileyerek kaldığınız yerden devam edebilirsiniz.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  padding: 10,
                  fontSize: 11,
                  fontFamily: 'monospace',
                  color: '#ff6b81',
                  textAlign: 'left',
                  overflowX: 'auto',
                  marginBottom: 20,
                  maxHeight: 120
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #ff4757, #ff6b81)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={16} />
                <span>Sayfayı Yenile</span>
              </button>

              <button
                onClick={this.handleResetData}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={14} />
                <span>Önbelleği & Verileri Temizle</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
