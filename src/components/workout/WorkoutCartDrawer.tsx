import React, { useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { muscleMetadata } from '../../data/muscleMetadata';
import { AnatomyIcon } from '../../data/anatomyIcons';
import { sounds } from '../../utils/audio';
import { 
  ShoppingBag, 
  ChevronUp, 
  CheckCircle, 
  Trash2, 
  Plus, 
  Dumbbell, 
  Flame, 
  X
} from 'lucide-react';

interface WorkoutCartDrawerProps {
  onSaveSuccess?: () => void;
}

export const WorkoutCartDrawer: React.FC<WorkoutCartDrawerProps> = ({ 
  onSaveSuccess
}) => {
  const { 
    draft, 
    allExercises, 
    saveWorkout, 
    addDraftSet, 
    removeDraftSet, 
    clearDraftExercise
  } = useWorkout();

  const [isOpen, setIsOpen] = useState(false);

  // Compute active cart items with valid sets (weight > 0)
  const activeCartItems = allExercises
    .map((ex) => {
      const sets = draft.exerciseSets[ex.id] || [];
      const validSets = sets.filter((s) => s.weight > 0);
      const totalVolume = validSets.reduce((sum, s) => sum + s.weight * (s.reps || 5), 0);
      return {
        exercise: ex,
        sets,
        validSets,
        totalVolume,
        setCount: validSets.length
      };
    })
    .filter((item) => item.setCount > 0);

  const totalSetsCount = activeCartItems.reduce((acc, item) => acc + item.setCount, 0);
  const totalVolumeSum = activeCartItems.reduce((acc, item) => acc + item.totalVolume, 0);
  const distinctExercisesCount = activeCartItems.length;

  const handleToggle = () => {
    sounds.playPop();
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    sounds.playPop();
    setIsOpen(false);
  };

  const handleSave = () => {
    const res = saveWorkout();
    if (res.success) {
      setIsOpen(false);
      if (onSaveSuccess) onSaveSuccess();
    }
  };

  return (
    <>
      {/* 1. COLLAPSED FLOATING BOTTOM BAR (CART BAR) */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: 520,
          margin: '0 auto',
          padding: '10px 14px calc(10px + var(--safe-bottom)) 14px',
          zIndex: 850,
          pointerEvents: 'none'
        }}
      >
        <div
          onClick={handleToggle}
          role="button"
          tabIndex={0}
          style={{
            pointerEvents: 'auto',
            background: 'linear-gradient(135deg, rgba(18, 24, 38, 0.95), rgba(11, 15, 23, 0.98))',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: totalSetsCount > 0 
              ? '1px solid rgba(255, 71, 87, 0.4)' 
              : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-xl)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: totalSetsCount > 0 
              ? '0 10px 30px rgba(255, 71, 87, 0.25), 0 0 1px rgba(255, 255, 255, 0.2)' 
              : '0 8px 24px rgba(0, 0, 0, 0.4)',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: 'translateY(0)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {/* Left: Bag Icon with badge + Summary text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                position: 'relative',
                width: 42,
                height: 42,
                borderRadius: 'var(--radius-md)',
                background: totalSetsCount > 0 
                  ? 'linear-gradient(135deg, var(--accent), #e11d48)' 
                  : 'rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: totalSetsCount > 0 ? '0 4px 12px var(--accent-glow)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <ShoppingBag size={20} />
              {totalSetsCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    background: 'var(--muscle-emerald)',
                    color: '#ffffff',
                    fontSize: 10,
                    fontWeight: 800,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.5)',
                    animation: 'pulseGlow 2s infinite'
                  }}
                >
                  {totalSetsCount}
                </span>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>
                  {totalSetsCount > 0 
                    ? `Antrenman Sepeti (${totalSetsCount} Set)` 
                    : 'Antrenman Sepeti'}
                </span>
                {distinctExercisesCount > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: 'rgba(255, 71, 87, 0.15)',
                      color: 'var(--accent-hover)',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    {distinctExercisesCount} Hareket
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                {totalSetsCount > 0 ? (
                  <>
                    <span style={{ color: 'var(--muscle-emerald)', fontWeight: 700 }}>
                      {totalVolumeSum.toLocaleString()} kg Hacim
                    </span>
                    <span>•</span>
                    <span style={{ color: 'var(--text-dim)' }}>Listeyi görmek için dokunun</span>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-dim)' }}>Hareket seçip ağırlık girin</span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Expand / Save Trigger Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                background: totalSetsCount > 0 ? 'var(--accent)' : 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 700,
                boxShadow: totalSetsCount > 0 ? '0 4px 12px var(--accent-glow)' : 'none'
              }}
            >
              <span>{totalSetsCount > 0 ? 'Sepeti Gör' : 'Özet'}</span>
              <ChevronUp size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. EXPANDED BOTTOM SHEET / DRAWER */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 950,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Dark Backdrop */}
          <div
            onClick={handleClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(5, 8, 14, 0.75)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          />

          {/* Slide-Up Sheet Container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 520,
              maxHeight: '85vh',
              background: 'linear-gradient(180deg, #131b2e 0%, #0c111d 100%)',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
              borderRight: '1px solid rgba(255, 255, 255, 0.06)',
              borderTopLeftRadius: 'var(--radius-xl)',
              borderTopRightRadius: 'var(--radius-xl)',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden'
            }}
          >
            {/* Top Handle / Pull Indicator */}
            <div
              style={{
                width: '100%',
                padding: '10px 0 4px 0',
                display: 'flex',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              onClick={handleClose}
            >
              <div
                style={{
                  width: 38,
                  height: 4,
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255, 255, 255, 0.2)'
                }}
              />
            </div>

            {/* Header */}
            <div
              style={{
                padding: '8px 16px 12px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, var(--accent), #e11d48)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff'
                  }}
                >
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
                    Antrenman Sepeti & Kayıt
                  </h3>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {totalSetsCount > 0 
                      ? `${distinctExercisesCount} Farklı Hareket • Toplam ${totalSetsCount} Set Girildi` 
                      : 'Henüz antrenman hareketi girilmedi'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="btn-icon"
                style={{ width: 34, height: 34, borderRadius: 'var(--radius-full)' }}
                title="Kapat"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Body: Entered Exercises List */}
            <div
              style={{
                padding: '14px 16px',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                maxHeight: 'calc(85vh - 190px)'
              }}
            >
              {activeCartItems.length === 0 ? (
                /* Empty Cart State */
                <div
                  style={{
                    textAlign: 'center',
                    padding: '36px 16px',
                    color: 'var(--text-muted)'
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px dashed rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px auto',
                      color: 'var(--text-dim)'
                    }}
                  >
                    <Dumbbell size={26} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
                    Sepetinizde Henüz Hareket Yok
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', maxWidth: 280, margin: '0 auto 16px auto', lineHeight: 1.4 }}>
                    Vücut haritasından kas bölgesini seçip veya tüm listeden hareketlerinize ağırlık/tekrar girin.
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: 12, borderRadius: 'var(--radius-full)' }}
                  >
                    Hareket Seçmeye Başla
                  </button>
                </div>
              ) : (
                /* Active Exercises Breakdown */
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Girilen Hareketler ({activeCartItems.length})
                  </div>

                  {activeCartItems.map((item) => {
                    const meta = muscleMetadata[item.exercise.muscle] || muscleMetadata.chest;

                    return (
                      <div
                        key={item.exercise.id}
                        className="card"
                        style={{
                          padding: '12px 14px',
                          marginBottom: 0,
                          background: 'rgba(15, 23, 42, 0.75)',
                          border: `1px solid ${meta.color}30`
                        }}
                      >
                        {/* Exercise Header */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 10,
                            paddingBottom: 8,
                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 'var(--radius-md)',
                                background: `${meta.color}20`,
                                border: `1px solid ${meta.color}50`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <AnatomyIcon muscle={item.exercise.muscle} size={18} />
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>
                                {item.exercise.name}
                              </div>
                              <div style={{ fontSize: 10, color: meta.color, fontWeight: 600 }}>
                                {meta.name} • {item.setCount} Set • {item.totalVolume.toLocaleString()} kg
                              </div>
                            </div>
                          </div>

                          {/* Exercise Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => addDraftSet(item.exercise.id)}
                              style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--muscle-emerald)',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                fontSize: 11,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                              title="Yeni Set Ekle"
                            >
                              <Plus size={12} />
                              <span>Set</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => clearDraftExercise(item.exercise.id)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--accent)',
                                cursor: 'pointer',
                                padding: '4px 6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Bu Hareketi Sepetten Kaldır"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Sets List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {item.sets.map((set, setIdx) => {
                            const isSetValid = set.weight > 0;
                            return (
                              <div
                                key={setIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  background: isSetValid ? 'rgba(30, 41, 59, 0.6)' : 'rgba(30, 41, 59, 0.25)',
                                  padding: '5px 10px',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: 12,
                                  opacity: isSetValid ? 1 : 0.6
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontWeight: 700, color: 'var(--text-dim)', fontSize: 11 }}>
                                    #{setIdx + 1}
                                  </span>
                                  <span style={{ fontWeight: 700, color: '#ffffff' }}>
                                    {set.weight} kg
                                  </span>
                                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                                    × {set.reps || 5} tekrar
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 10, color: 'var(--muscle-emerald)', fontWeight: 600 }}>
                                    {set.weight * (set.reps || 5)} kg
                                  </span>
                                  {item.sets.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeDraftSet(item.exercise.id, setIdx)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-dim)',
                                        cursor: 'pointer',
                                        padding: 2,
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}
                                      title="Seti Sil"
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Summary Box */}
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(56, 189, 248, 0.08))',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 4
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Flame size={18} color="var(--muscle-emerald)" />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#ffffff' }}>
                          Toplam Seans Hacmi
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {distinctExercisesCount} hareket, {totalSetsCount} tamamlanan set
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--muscle-emerald)' }}>
                        {totalVolumeSum.toLocaleString()} kg
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Sticky Action Footer */}
            <div
              style={{
                padding: '12px 16px calc(14px + var(--safe-bottom)) 16px',
                borderTop: '1px solid var(--border)',
                background: 'rgba(11, 15, 23, 0.95)',
                display: 'flex',
                gap: 10
              }}
            >
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '14px', fontSize: 13, fontWeight: 700 }}
              >
                <span>Harekete Devam Et</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={totalSetsCount === 0}
                className="btn btn-primary"
                style={{
                  flex: 2,
                  padding: '14px 18px',
                  fontSize: 14,
                  fontWeight: 800,
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: totalSetsCount > 0 ? '0 8px 24px rgba(255, 71, 87, 0.45)' : 'none',
                  opacity: totalSetsCount === 0 ? 0.5 : 1,
                  cursor: totalSetsCount === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <CheckCircle size={18} />
                <span>
                  {totalSetsCount > 0 
                    ? `ANTRENMANI KAYDET (${totalSetsCount} SET)` 
                    : 'ANTRENMANI KAYDET'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
