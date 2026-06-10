import { useMemo } from 'react';
import './FallingPetals.css';

export default function FallingPetals({ count = 15 }) {
  // Generate random properties for each petal once
  const petals = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDurationFall: `${Math.random() * 10 + 15}s`, // 15-25s fall (much slower)
      animationDelayFall: `-${Math.random() * 25}s`, // stagger start over 25s
      animationDurationSway: `${Math.random() * 3 + 3}s`, // 3-6s sway (floaty)
      size: `${Math.random() * 6 + 8}px`, // 8-14px size
      opacity: Math.random() * 0.4 + 0.3, // 0.3-0.7 opacity
      color: Math.random() > 0.5 ? 'var(--green-400)' : '#fca5a5' // mix of green and pink petals
    }));
  }, [count]);

  return (
    <div className="petal-container">
      {petals.map(p => (
        <div
          key={p.id}
          className="petal"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            opacity: p.opacity,
            animationDuration: `${p.animationDurationFall}, ${p.animationDurationSway}`,
            animationDelay: `${p.animationDelayFall}, 0s`
          }}
        />
      ))}
    </div>
  );
}
