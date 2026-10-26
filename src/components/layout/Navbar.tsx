import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { TabType } from '../../types/workout';
import { sounds } from '../../utils/audio';
import { Dumbbell, History, Trophy } from 'lucide-react';

interface NavItemConfig {
  id: TabType;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  activeColor: string;
  pillBg: string;
  pillBorder: string;
  glow: string;
}

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab } = useWorkout();

  const navItems: NavItemConfig[] = [
    {
      id: 'workout',
      label: 'Antrenman',
      activeColor: '#38bdf8',
      pillBg: 'rgba(56, 189, 248, 0.15)',
      pillBorder: 'rgba(56, 189, 248, 0.35)',
      glow: '0 0 16px rgba(56, 189, 248, 0.28)',
      icon: (active) => <Dumbbell size={20} strokeWidth={active ? 2.4 : 1.85} />
    },
    {
      id: 'history',
      label: 'Geçmiş',
      activeColor: '#a855f7',
      pillBg: 'rgba(168, 85, 247, 0.15)',
      pillBorder: 'rgba(168, 85, 247, 0.35)',
      glow: '0 0 16px rgba(168, 85, 247, 0.28)',
      icon: (active) => <History size={20} strokeWidth={active ? 2.4 : 1.85} />
    },
    {
      id: 'stats',
      label: 'Gelişim',
      activeColor: '#fbbf24',
      pillBg: 'rgba(251, 191, 36, 0.15)',
      pillBorder: 'rgba(251, 191, 36, 0.35)',
      glow: '0 0 16px rgba(251, 191, 36, 0.28)',
      icon: (active) => <Trophy size={20} strokeWidth={active ? 2.4 : 1.85} />
    }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive =
          activeTab === item.id ||
          (item.id === 'stats' && (activeTab === 'levels' || activeTab === 'stats' || activeTab === 'body'));
        return (
          <div
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-tab ${isActive ? 'active' : ''}`}
            onClick={() => {
              sounds.playPop();
              setActiveTab(item.id);
            }}
            style={{
              color: isActive ? item.activeColor : '#64748b'
            }}
          >
            <div
              className="nav-pill"
              style={{
                background: isActive ? item.pillBg : 'transparent',
                border: isActive ? `1px solid ${item.pillBorder}` : '1px solid transparent',
                boxShadow: isActive ? item.glow : 'none',
                color: isActive ? item.activeColor : '#64748b'
              }}
            >
              {item.icon(isActive)}
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: isActive ? 800 : 600,
                color: isActive ? item.activeColor : '#64748b',
                letterSpacing: '0.01em',
                transition: 'color 0.2s ease'
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
};
