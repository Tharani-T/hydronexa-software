import { useMemo } from "react";

export function Particles({ count = 30, className = "" }: { count?: number; className?: string }) {
  const items = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 5,
    })),
    [count]
  );
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {items.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-cyan-glow"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: 0.5,
            boxShadow: `0 0 ${p.size * 4}px var(--cyan-glow)`,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
