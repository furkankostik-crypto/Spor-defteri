import React, { useState, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useBackButton } from '../../context/BackNavigationContext';
import { ExerciseDefinition } from '../../types/workout';
import { HeaderBurgerMenu } from '../layout/HeaderBurgerMenu';
import { OverviewTabSection } from './OverviewTabSection';
import { BodyAnalysisSection } from './BodyAnalysisSection';
import { StrengthLevelsSection } from './StrengthLevelsSection';
import { ExerciseDetailModal } from '../levels/ExerciseDetailModal';
import { sounds } from '../../utils/audio';
import { BarChart3, Scale, Trophy } from 'lucide-react';

export const ProgressView: React.FC = () => {
  const { activeTab, setActiveTab } = useWorkout();

  // Segment tab: 'stats' (Özet), 'body' (Vücut), or 'levels' (Güç & PR)
  const [activeSegment, setActiveSegment] = useState<'stats' | 'body' | 'levels'>(() =>
    activeTab === 'levels' ? 'levels' : activeTab === 'body' ? 'body' : 'stats'
  );
  const [autoOpenBodyEntry, setAutoOpenBodyEntry] = useState<boolean>(false);
  const [inspectedExercise, setInspectedExercise] = useState<ExerciseDefinition | null>(null);

  useEffect(() => {
    if (activeTab === 'levels') {
      setActiveSegment('levels');
    } else if (activeTab === 'body') {
      setActiveSegment('body');
    } else if (activeTab === 'stats') {
      setActiveSegment('stats');
    }
  }, [activeTab]);

  useBackButton(
    activeSegment !== 'stats',
    () => {
      sounds.playPop();
      setActiveSegment('stats');
      setActiveTab('stats');
    },
    30
  );

  const subtitleText =
    activeSegment === 'body'
      ? 'Kilo, yağ oranı ve mezura takibi'
      : activeSegment === 'levels'
      ? 'Güç standartları ve egzersiz rekorları'
      : 'Haftalık aktivite, kas dengesi ve rekorlar';

  return (
    <div style={{ padding: '14px 16px calc(92px + var(--safe-bottom)) 16px', animation: 'fadeIn 0.2s ease-out' }}>
      {/* Clean Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          gap: 10
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
            Gelişim
          </h2>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {subtitleText}
          </div>
        </div>

        <HeaderBurgerMenu />
      </div>

      {/* Segmented Tab Switcher (3 Equal Columns, Crisp Labels) */}
      <div className="segment-control" role="tablist" aria-label="Gelişim sekmeleri" style={{ marginBottom: 14 }}>
        <button
          type="button"
          role="tab"
          aria-selected={activeSegment === 'stats'}
          onClick={() => {
            sounds.playPop();
            setActiveSegment('stats');
            setActiveTab('stats');
          }}
          className={`segment-btn ${activeSegment === 'stats' ? 'active' : ''}`}
          style={{ fontSize: 12.5, padding: '9px 6px', whiteSpace: 'nowrap' }}
        >
          <BarChart3 size={15} />
          <span>Özet</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeSegment === 'body'}
          onClick={() => {
            sounds.playPop();
            setActiveSegment('body');
            setActiveTab('body');
          }}
          className={`segment-btn ${activeSegment === 'body' ? 'active' : ''}`}
          style={{ fontSize: 12.5, padding: '9px 6px', whiteSpace: 'nowrap' }}
        >
          <Scale size={15} />
          <span>Vücut</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeSegment === 'levels'}
          onClick={() => {
            sounds.playPop();
            setActiveSegment('levels');
            setActiveTab('levels');
          }}
          className={`segment-btn ${activeSegment === 'levels' ? 'active' : ''}`}
          style={{ fontSize: 12.5, padding: '9px 6px', whiteSpace: 'nowrap' }}
        >
          <Trophy size={15} />
          <span>Güç & PR</span>
        </button>
      </div>

      {/* SEGMENT 1: ÖZET */}
      {activeSegment === 'stats' && (
        <OverviewTabSection
          onSelectExercise={(ex) => setInspectedExercise(ex)}
          onNavigateTab={(tab, openEntry) => {
            if (tab === 'body' && openEntry) {
              setAutoOpenBodyEntry(true);
            }
            setActiveSegment(tab);
            setActiveTab(tab);
          }}
        />
      )}

      {/* SEGMENT 2: VÜCUT ANALİZİ */}
      {activeSegment === 'body' && (
        <BodyAnalysisSection
          autoOpenEntry={autoOpenBodyEntry}
          onEntryOpened={() => setAutoOpenBodyEntry(false)}
        />
      )}

      {/* SEGMENT 3: GÜÇ & PR */}
      {activeSegment === 'levels' && (
        <StrengthLevelsSection
          onSelectExercise={(ex) => setInspectedExercise(ex)}
        />
      )}

      {/* Egzersiz 1RM, Güç Cetveli & Tekrar Maksimumları Detay Modalı */}
      <ExerciseDetailModal
        exercise={inspectedExercise}
        onClose={() => setInspectedExercise(null)}
      />
    </div>
  );
};
