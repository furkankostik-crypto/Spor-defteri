import { RankTier } from '../types/workout';

export const rankTiers: RankTier[] = [
  {
    minLevel: 1,
    title: 'Çaylak Sporcu',
    badge: '🌱',
    color: '#94a3b8',
    gradient: 'linear-gradient(135deg, #64748b, #94a3b8)',
    description: 'Yolculuğun henüz başındasın, disiplin her şeydir.'
  },
  {
    minLevel: 10,
    title: 'Demir Savaşçı',
    badge: '⚔️',
    color: '#a8a29e',
    gradient: 'linear-gradient(135deg, #78716c, #a8a29e)',
    description: 'Ağırlıklar sana alışmaya başladı.'
  },
  {
    minLevel: 25,
    title: 'Bronz Gladyatör',
    badge: '🥉',
    color: '#d97706',
    gradient: 'linear-gradient(135deg, #b45309, #f59e0b)',
    description: 'Temel kas gücünü inşa ettin.'
  },
  {
    minLevel: 50,
    title: 'Gümüş Atlet',
    badge: '🥈',
    color: '#cbd5e1',
    gradient: 'linear-gradient(135deg, #94a3b8, #e2e8f0)',
    description: 'Spor salonunda artık deneyimli bir isimsin.'
  },
  {
    minLevel: 100,
    title: 'Altın Şampiyon',
    badge: '🥇',
    color: '#eab308',
    gradient: 'linear-gradient(135deg, #ca8a04, #facc15)',
    description: 'Yüksek hacimli antrenmanların ustası.'
  },
  {
    minLevel: 200,
    title: 'Platin Canavar',
    badge: '💎',
    color: '#38bdf8',
    gradient: 'linear-gradient(135deg, #0284c7, #38bdf8)',
    description: 'Plakalar senin karşında titriyor.'
  },
  {
    minLevel: 350,
    title: 'Zümrüt Titan',
    badge: '🛡️',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #059669, #34d399)',
    description: 'Kusursuz form, insanüstü dayanıklılık.'
  },
  {
    minLevel: 500,
    title: 'Elmas Efsane',
    badge: '👑',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #7e22ce, #c084fc)',
    description: 'Salonun en ilham verici sporcularından birisin.'
  },
  {
    minLevel: 750,
    title: 'Yarı Tanrı',
    badge: '⚡',
    color: '#f43f5e',
    gradient: 'linear-gradient(135deg, #e11d48, #fb7185)',
    description: 'Fiziksel sınırları tamamen aştın.'
  },
  {
    minLevel: 1000,
    title: 'Kutsal Titan 1000 Lv',
    badge: '🔥',
    color: '#ffd700',
    gradient: 'linear-gradient(135deg, #ff4757, #ffd700, #ff6b81)',
    description: 'Maksimum seviyeye ulaştın! Gerçek bir Titan.'
  }
];

export function getRankByLevel(level: number): RankTier {
  for (let i = rankTiers.length - 1; i >= 0; i--) {
    if (level >= rankTiers[i].minLevel) {
      return rankTiers[i];
    }
  }
  return rankTiers[0];
}
