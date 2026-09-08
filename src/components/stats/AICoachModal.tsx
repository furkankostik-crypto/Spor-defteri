import React, { useState, useRef, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { askAICoach, AIChatMessage } from '../../services/aiCoach';
import { sounds } from '../../utils/audio';
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  Zap, 
  TrendingUp, 
  Dumbbell, 
  Coffee, 
  Key 
} from 'lucide-react';

export const AICoachModal: React.FC = () => {
  const { 
    isAICoachOpen, 
    setIsAICoachOpen, 
    profile, 
    workouts, 
    allExercises,
    setIsProfileModalOpen 
  } = useWorkout();

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: `Merhaba! Ben senin **Bilimsel AI Antrenörünüm**.
Kaldırdığın ağırlıkları, 1RM güç seviyelerini, toparlanma sürelerini ve haftalık hipertrofi hacmini spor bilimi standartlarına göre analiz ettim.

Bana her şeyi sorabilirsin, örneğin:
- *"Sırada ne var?"*
- *"Bench press kaç basmalıyım?"*
- *"Göğüs kasım toparlandı mı?"*
- *"Günde kaç gram protein almalıyım?"*
- *"Ağırlıklar takıldı, nasıl artırırım?"*`,
      timestamp: Date.now()
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAICoachOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAICoachOpen]);

  if (!isAICoachOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    sounds.playPop();
    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const reply = await askAICoach(query, profile, workouts, allExercises);
      const botMsg: AIChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        content: reply,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, botMsg]);
      sounds.playSuccess();
    } catch (err) {
      console.error(err);
      const errMsg: AIChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'assistant',
        content: 'Yanıt oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.',
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const hasApiKey = Boolean(
    profile.geminiApiKey?.trim() || 
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_GEMINI_API_KEY as string)?.trim())
  );

  return (
    <div 
      className="modal-backdrop" 
      onClick={() => {
        sounds.playPop();
        setIsAICoachOpen(false);
      }}
      style={{ zIndex: 1150, padding: 12 }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 480,
          height: '85vh',
          maxHeight: 700,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #131b2c 0%, #0a0f18 100%)',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(168, 85, 247, 0.2)',
          borderRadius: 'var(--radius-xl)',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(24, 34, 54, 0.6)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div 
              style={{ 
                width: 38, 
                height: 38, 
                borderRadius: 'var(--radius-md)', 
                background: 'linear-gradient(135deg, #7e22ce, #c084fc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.35)'
              }}
            >
              <Bot size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                  Bilimsel AI Koç
                </h3>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  title={hasApiKey ? 'Gemini AI Aktif' : 'Gemini API Key eklemek için tıklayın (Ücretsiz)'}
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    background: hasApiKey ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                    color: hasApiKey ? 'var(--muscle-emerald)' : 'var(--cyan)',
                    border: `1px solid ${hasApiKey ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`,
                    cursor: 'pointer'
                  }}
                >
                  {hasApiKey ? 'Gemini 1.5 Flash 🌐' : 'Dahili Uzman Motor ⚡'}
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Kişiselleştirilmiş hipertrofi & güç rehberi
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              title="Profil & Gemini API Anahtarı"
              className="btn-icon"
              style={{ width: 32, height: 32, borderRadius: '50%', color: 'var(--text-muted)' }}
            >
              <Key size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsAICoachOpen(false);
              }}
              className="btn-icon"
              style={{ width: 32, height: 32, borderRadius: '50%' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Quick Action Chips */}
        <div 
          style={{ 
            padding: '8px 12px', 
            background: 'rgba(15, 23, 42, 0.7)', 
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            scrollbarWidth: 'none'
          }}
        >
          {[
            { label: '🏋️ Sırada Ne Var?', prompt: 'Sırada ne var?', icon: Dumbbell },
            { label: '📊 Gelişimimi Analiz Et', prompt: 'Gelişimimi ve Antrenman Geçmişimi Analiz Et', icon: TrendingUp },
            { label: '⚡ Plato Kırma Planı', prompt: 'Takıldığım Egzersizler İçin Plato Kırma Planı Hazırla', icon: Zap },
            { label: '🥗 Beslenme & Toparlanma', prompt: 'Kilo ve hedefime uygun beslenme önerisi ver', icon: Coffee }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickPrompt(item.prompt)}
                disabled={isLoading}
                style={{
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(168, 85, 247, 0.12)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  color: '#e9d5ff',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
              >
                <Icon size={12} color="#c084fc" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Messages Scroll Area */}
        <div 
          style={{ 
            flex: 1, 
            padding: '14px', 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 12 
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                  gap: 8
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'rgba(168, 85, 247, 0.2)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#c084fc',
                      flexShrink: 0,
                      marginTop: 2
                    }}
                  >
                    <Bot size={15} />
                  </div>
                )}

                <div
                  style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isUser ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'rgba(18, 24, 38, 0.95)',
                    border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    fontSize: 13,
                    lineHeight: 1.5,
                    boxShadow: 'var(--shadow-sm)',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div 
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(168, 85, 247, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c084fc'
                }}
              >
                <Bot size={15} />
              </div>
              <div 
                style={{ 
                  background: 'rgba(18, 24, 38, 0.95)', 
                  padding: '10px 14px', 
                  borderRadius: '16px 16px 16px 4px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: 'var(--text-muted)'
                }}
              >
                <Sparkles size={14} className="animate-spin" color="#c084fc" />
                <span>Antrenman verileri analiz ediliyor...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div 
          style={{ 
            padding: '10px 12px', 
            background: 'rgba(15, 23, 42, 0.85)', 
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            gap: 8,
            alignItems: 'center'
          }}
        >
          <input
            type="text"
            placeholder="AI Koçuna antrenmanınla ilgili bir soru sor..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="form-input"
            style={{ height: 42, fontSize: 13 }}
            disabled={isLoading}
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim() || isLoading}
            style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-md)',
              background: inputQuery.trim() ? 'linear-gradient(135deg, #7e22ce, #a855f7)' : 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: inputQuery.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
