import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useWorkout } from '../../context/WorkoutContext';

export const Confetti: React.FC = () => {
  const { confettiTrigger } = useWorkout();

  useEffect(() => {
    if (!confettiTrigger) return;

    // Trigger celebration fireworks
    const end = Date.now() + 1500;
    const colors = ['#ff4757', '#ffd700', '#10b981', '#38bdf8', '#ff6b81'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, [confettiTrigger]);

  return null;
};
