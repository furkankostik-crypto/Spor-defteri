import React, { useRef, useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useAuth } from '../../context/AuthContext';
import { exportToJSON, exportToCSV, parseImportJSON } from '../../utils/backup';
import { X, Download, Upload, FileSpreadsheet, Trash2, Database, AlertCircle, Sparkles, Cloud } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const { 
    workouts, 
    customExercises, 
    importAllData, 
    resetAllData, 
    populateSampleData, 
    showToast 
  } = useWorkout();

  const { user, setIsAuthModalOpen } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    exportToJSON(workouts, customExercises);
    showToast({
      title: '💾 Yedek İndirildi',
      description: 'JSON formatında yedek dosyanız kaydedildi.',
      type: 'success'
    });
  };

  const handleExportCSV = () => {
    if (workouts.length === 0) {
      showToast({
        title: 'Kayıt Yok',
        description: 'Dışa aktarılacak antrenman bulunamadı.',
        type: 'info'
      });
      return;
    }
    exportToCSV(workouts);
    showToast({
      title: '📊 CSV İndirildi',
      description: 'Excel uyumlu antrenman tablosu kaydedildi.',
      type: 'success'
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseImportJSON(file);
      importAllData(result.workouts, result.customExercises);
      onClose();
    } catch (err: any) {
      showToast({
        title: 'Hata',
        description: err.message || 'Yedek dosyası okunamadı.',
        type: 'error'
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    resetAllData();
    setConfirmReset(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="anatomy-badge" style={{ color: 'var(--accent)' }}>
              <Database size={20} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Veri & Yedekleme Yönetimi</h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Cloud Sync & Auth Entry */}
          <div 
            onClick={() => {
              onClose();
              setIsAuthModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(255, 71, 87, 0.15), rgba(56, 189, 248, 0.15))',
              border: '1px solid rgba(255, 71, 87, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Cloud size={20} color="var(--accent)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#ffffff' }}>
                  {user ? 'Bulut Senkronizasyonu (Aktif)' : 'Bulut Hesabı Bağla & Eşitle'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {user ? `${user.email} ile senkronize` : 'Google, Apple veya E-posta ile tarayıcı sıfırlansa da verilerinizi koruyun'}
                </div>
              </div>
            </div>
            <span className="badge" style={{ background: user ? 'var(--muscle-emerald)' : 'var(--accent)', color: '#ffffff', fontWeight: 800 }}>
              {user ? 'Bağlı' : 'Bağlan'}
            </span>
          </div>

          {/* JSON Export */}
          <div 
            onClick={handleExportJSON}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Download size={18} color="var(--accent)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>JSON Yedeği İndir</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tüm antrenmanları ve özel hareketleri kaydeder</div>
              </div>
            </div>
            <span className="badge badge-lvl">{workouts.length} Kayıt</span>
          </div>

          {/* CSV Export */}
          <div 
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FileSpreadsheet size={18} color="var(--muscle-emerald)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Excel / CSV Tablosu İndir</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tablo programlarında açmak için</div>
              </div>
            </div>
          </div>

          {/* JSON Import */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Upload size={18} color="var(--cyan)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Yedekten Geri Yükle</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Daha önce indirdiğiniz JSON dosyasını seçin</div>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".json" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
          </div>

          {/* Sample Data */}
          <div 
            onClick={() => {
              populateSampleData();
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(251, 191, 36, 0.08)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Sparkles size={18} color="var(--gold)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--gold)' }}>2 Yıllık Örnek Veri Yükle</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>300+ gerçekçi seans (kademeli ağırlık/tekrar artışı)</div>
              </div>
            </div>
          </div>

          {/* Reset All Data */}
          <div 
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: confirmReset ? 'rgba(255, 71, 87, 0.2)' : 'rgba(255, 71, 87, 0.06)',
              border: '1px solid rgba(255, 71, 87, 0.3)',
              cursor: 'pointer',
              marginTop: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Trash2 size={18} color="var(--accent)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--accent)' }}>
                  {confirmReset ? 'Emin misiniz? Tekrar tıklayın!' : 'Tüm Verileri Sıfırla'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {confirmReset ? 'Bu işlem geri alınamaz!' : 'Tüm geçmiş ve ayarları siler'}
                </div>
              </div>
            </div>
            {confirmReset && <AlertCircle size={18} color="var(--accent)" />}
          </div>
        </div>
      </div>
    </div>
  );
};
