
import React, { useEffect, useState } from 'react';

const Snowfall: React.FC = () => {
  const [snowflakes, setSnowflakes] = useState<{ id: number; left: string; delay: string; duration: string; size: string }[]>([]);

  useEffect(() => {
    const flakes = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${10 + Math.random() * 10}s`,
      size: `${2 + Math.random() * 4}px`
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
      {snowflakes.map(flake => (
        <div
          key={flake.id}
          className="snow"
          style={{
            left: flake.left,
            width: flake.size,
            height: flake.size,
            animationDelay: flake.delay,
            animationDuration: flake.duration
          }}
        />
      ))}
    </div>
  );
};

export default Snowfall;
