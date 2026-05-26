"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  target: number;
  durationMs?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  /** If true, keeps ticking up by `tickRate` per second after reaching target */
  liveIncrement?: number;
};

export function AnimatedCounter({
  target,
  durationMs = 1800,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  liveIncrement = 0
}: Props) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const targetRef = useRef(target);

  useEffect(() => {
    targetRef.current = target;
    startRef.current = null;
    let raf: number;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const t = Math.min(1, (ts - startRef.current) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(eased * targetRef.current);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  useEffect(() => {
    if (!liveIncrement) return;
    const id = setInterval(() => {
      setValue((v) => v + liveIncrement * (0.4 + Math.random() * 1.2));
    }, 800);
    return () => clearInterval(id);
  }, [liveIncrement]);

  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
