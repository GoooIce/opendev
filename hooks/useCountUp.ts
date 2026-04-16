"use client";

import { useState, useEffect, useRef } from "react";

interface UseCountUpOptions {
  end: number;
  duration?: number;
  decimals?: number;
  delay?: number;
}

export function useCountUp({ end, duration = 2000, decimals = 0, delay = 0 }: UseCountUpOptions) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const startTime = Date.now() + delay;
    const startValue = 0;

    const animate = () => {
      const now = Date.now();
      if (now < startTime) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setValue(startValue + (end - startValue) * eased);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [end, duration, decimals, delay]);

  return decimals > 0 ? Number(value.toFixed(decimals)) : Math.round(value);
}
