import React, { useEffect, useRef, useState } from 'react';
import { runPreloadSequence } from '../utils/assetPreloader';

interface PreloaderProps {
  onComplete?: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [percent, setPercent] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'holding' | 'exiting' | 'finished'>('loading');
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  const targetPercentRef = useRef(0);
  const currentPercentRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lock body scrolling during preloading
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setIsReducedMotion(prefersReduced);

    let animId: number;

    // Smooth RAF lerp for visually fluid percentage increment
    const updateLerp = () => {
      const target = targetPercentRef.current;
      const current = currentPercentRef.current;

      // Speed factor: quicker when far behind, smooth when close
      const diff = target - current;
      const step = Math.max(0.4, diff * 0.12);

      if (current < target) {
        currentPercentRef.current = Math.min(target, current + step);
        setPercent(Math.floor(currentPercentRef.current));
      }

      if (currentPercentRef.current >= 100) {
        setPercent(100);
        return; // Lerp complete
      }

      animId = requestAnimationFrame(updateLerp);
    };

    animId = requestAnimationFrame(updateLerp);

    // Run real asset preload manager
    runPreloadSequence((realProgress) => {
      targetPercentRef.current = realProgress;
    }).then(() => {
      targetPercentRef.current = 100;
    });

    return () => {
      cancelAnimationFrame(animId);
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // When percent reaches 100, trigger cinematic exit sequence
  useEffect(() => {
    if (percent >= 100 && phase === 'loading') {
      setPhase('holding');

      // Hold at 100% for 250ms for visual polish
      const holdTimer = setTimeout(() => {
        setPhase('exiting');

        // Exit duration: 750ms slide upward
        const exitTimer = setTimeout(() => {
          setPhase('finished');
          document.body.style.overflow = '';
          if (onComplete) {
            onComplete();
          }
        }, 750);

        return () => clearTimeout(exitTimer);
      }, 250);

      return () => clearTimeout(holdTimer);
    }
  }, [percent, phase, onComplete]);

  if (phase === 'finished') {
    return null;
  }

  const formattedNumber = String(percent).padStart(2, '0');

  return (
    <div
      ref={containerRef}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Website preloader"
      className={`fixed inset-0 z-[99999999] bg-[#050505] text-[#F5F5F2] flex flex-col justify-between p-6 sm:p-10 md:p-16 select-none overflow-hidden will-change-transform ${
        phase === 'exiting'
          ? isReducedMotion
            ? 'opacity-0 transition-opacity duration-500 ease-out pointer-events-none'
            : '-translate-y-full transition-transform duration-750 ease-[cubic-bezier(0.76,0,0.24,1)] pointer-events-none'
          : 'translate-y-0 opacity-100'
      }`}
    >
      {/* Top Meta Bar */}
      <div
        className={`flex items-center justify-between font-mono text-[9px] sm:text-[10px] tracking-[0.22em] text-[#F5F5F2]/45 uppercase transition-opacity duration-300 ${
          phase === 'exiting' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <span className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F5F5F2]/60 animate-pulse" />
          <span>CREATIVE DIRECTOR • 2026</span>
        </span>
        <span className="hidden sm:inline">DUBAI / GLOBAL</span>
      </div>

      {/* Center Cinematic Title */}
      <div
        className={`flex flex-col items-center justify-center transition-all duration-500 ease-out ${
          phase === 'exiting'
            ? '-translate-y-3 opacity-0'
            : phase === 'holding'
            ? '-translate-y-1 opacity-100'
            : 'translate-y-0 opacity-100'
        }`}
      >
        <h1 className="font-sans font-semibold text-2xl sm:text-3xl md:text-5xl lg:text-6xl tracking-[0.2em] sm:tracking-[0.24em] text-[#F5F5F2] uppercase text-center leading-none">
          SREERAG CHANDRAN
        </h1>
        <div className="flex items-center gap-3 mt-3 sm:mt-4">
          <span className="font-mono text-[9px] sm:text-[11px] tracking-[0.3em] text-[#F5F5F2]/40 uppercase">
            PORTFOLIO EXPERIENCE
          </span>
        </div>
      </div>

      {/* Bottom Progress Engine */}
      <div
        className={`flex flex-col gap-3 w-full max-w-md mx-auto transition-opacity duration-300 ${
          phase === 'exiting' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Hairline Progress Gauge */}
        <div className="relative w-full h-[1px] bg-white/15 overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-[#F5F5F2] transition-[width] duration-150 ease-out shadow-[0_0_10px_rgba(255,255,255,0.6)]"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Counter and Status Strip */}
        <div className="flex items-center justify-between font-mono text-[10px] sm:text-xs tracking-[0.2em] uppercase text-[#F5F5F2]/50">
          <span className="text-[#F5F5F2]/40">
            {percent >= 100 ? 'READY' : 'PRELOADING ASSETS'}
          </span>
          <span className="font-mono text-[#F5F5F2] font-semibold tabular-nums">
            {formattedNumber}
            <span className="text-[#F5F5F2]/40 ml-0.5">%</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
