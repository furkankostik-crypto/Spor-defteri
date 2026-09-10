import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { TabType } from '../../types/workout';
import { sounds } from '../../utils/audio';
import { Dumbbell, History, Trophy } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab } = useWorkout();

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'workout',
      label: 'Antrenman',
      icon: <Dumbbell size={22} />
    },
    {
      id: 'history',
      label: 'Geçmiş',
      icon: <History size={22} />
    },
    {
      id: 'stats',
      label: 'Gelişim & İstatistik',
      icon: <Trophy size={22} />
    }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = activeTab === item.id || (item.id === 'stats' && (activeTab === 'levels' || activeTab === 'stats'));
        return (
          <div
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-tab ${isActive ? 'active' : ''}`}
            onClick={() => {
              sounds.playPop();
              setActiveTab(item.id);
            }}
          >
            <div className="nav-icon" style={{ position: 'relative' }}>
              {item.icon}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
};
