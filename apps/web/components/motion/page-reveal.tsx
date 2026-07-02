'use client';

import gsap from 'gsap';
import { useEffect, useRef } from 'react';

export function PageReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }
    );
  }, []);

  return <div ref={ref}>{children}</div>;
}
