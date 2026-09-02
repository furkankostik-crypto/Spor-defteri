import { MuscleGroup } from '../types/workout';

export interface MuscleMeta {
  id: MuscleGroup;
  name: string;
  latinName: string;
  view: 'front' | 'back' | 'both';
  category: 'upper' | 'lower' | 'core' | 'cardio';
  color: string;
  glowColor: string;
  icon: string;
  description: string;
}

export const muscleMetadata: Record<MuscleGroup, MuscleMeta> = {
  chest: {
    id: 'chest',
    name: 'Göğüs',
    latinName: 'Pectoralis Major',
    view: 'front',
    category: 'upper',
    color: '#ff4757',
    glowColor: 'rgba(255, 71, 87, 0.6)',
    icon: '💪',
    description: 'Üst göğüs, orta göğüs ve alt göğüs kasları'
  },
  back: {
    id: 'back',
    name: 'Sırt & Kanat',
    latinName: 'Latissimus Dorsi & Trapezius',
    view: 'back',
    category: 'upper',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.6)',
    icon: '🦅',
    description: 'Trapez, kanat kasları ve orta-alt sırt'
  },
  shoulder: {
    id: 'shoulder',
    name: 'Omuz',
    latinName: 'Deltoideus',
    view: 'both',
    category: 'upper',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    icon: '🛡️',
    description: 'Ön omuz, yan omuz ve arka omuz deltoidleri'
  },
  biceps: {
    id: 'biceps',
    name: 'Biceps (Ön Kol)',
    latinName: 'Biceps Brachii',
    view: 'front',
    category: 'upper',
    color: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.6)',
    icon: '💪',
    description: 'Pazu ve ön kol fleksör kasları'
  },
  triceps: {
    id: 'triceps',
    name: 'Triceps (Arka Kol)',
    latinName: 'Triceps Brachii',
    view: 'back',
    category: 'upper',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    icon: '⚡',
    description: 'Arka kol üç başlı kas grubu'
  },
  abs: {
    id: 'abs',
    name: 'Karın & Core',
    latinName: 'Rectus Abdominis & Obliques',
    view: 'front',
    category: 'core',
    color: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.6)',
    icon: '🔥',
    description: 'Six pack, yan oblikler ve merkez kaslar'
  },
  quads: {
    id: 'quads',
    name: 'Ön Bacak (Quadriceps)',
    latinName: 'Quadriceps Femoris',
    view: 'front',
    category: 'lower',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.6)',
    icon: '🦵',
    description: 'Ön uyluk ve dört başlı bacak kasları'
  },
  hamstring: {
    id: 'hamstring',
    name: 'Arka Bacak (Hamstrings)',
    latinName: 'Biceps Femoris',
    view: 'back',
    category: 'lower',
    color: '#14b8a6',
    glowColor: 'rgba(20, 184, 166, 0.6)',
    icon: '🍗',
    description: 'Arka uyluk ve hamstring kas grubu'
  },
  glutes: {
    id: 'glutes',
    name: 'Kalça (Glutes)',
    latinName: 'Gluteus Maximus',
    view: 'back',
    category: 'lower',
    color: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.6)',
    icon: '🍑',
    description: 'Büyük ve orta kalça kasları'
  },
  calves: {
    id: 'calves',
    name: 'Kalf (Baldır)',
    latinName: 'Gastrocnemius & Soleus',
    view: 'both',
    category: 'lower',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.6)',
    icon: '🏃',
    description: 'Alt bacak baldır ve soleus kasları'
  },
  cardio: {
    id: 'cardio',
    name: 'Kardiyo & Kondisyon',
    latinName: 'Cardiovascular',
    view: 'front',
    category: 'cardio',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    icon: '❤️',
    description: 'Kalp sağlığı ve dayanıklılık çalışmaları'
  }
};
