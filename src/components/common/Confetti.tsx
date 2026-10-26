import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useWorkout } from '../../context/WorkoutContext';

export const Confetti: React.FC = () => {
  const { confettiTrigger } = useWorkout();

  useEffect(() => {
    if (!confettiTrigger) return;

    // Ekranı boğmayan, çok hafif ve minimal tek seferlik mikro kutlama efekti
    confetti({
      particleCount: 22,
      spread: 45,
      startVelocity: 16,
      origin: { x: 0.5, y: 0.08 },
      scalar: 0.65,
      ticks: 60,
      colors: ['#ff4757', '#ffd700', '#10b981', '#38bdf8', '#ff6b81'],
      disableForReducedMotion: true
    });
  }, [confettiTrigger]);

  return null;
};
