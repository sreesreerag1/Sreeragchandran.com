import React, { useEffect, useRef, useState } from 'react';
import { runPreloadSequence } from '../utils/assetPreloader';

interface PreloaderProps {
  onComplete?: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [percent, setPercent] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  const targetPercentRef = useRef(0);
  const currentPercentRef = useRef(0);
  const hasExitedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Lock body and html scrolling during preloader
    const originalBodyOverflow = document.body.style.overflow;
    const originalDocOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setIsReducedMotion(prefersReduced);

    let animId: number;

    const triggerExit = () => {
      if (hasExitedRef.current) return;
      hasExitedRef.current = true;

      // 100ms hold at 100% / READY
      setTimeout(() => {
        setIsExiting(true);
        // Call onComplete immediately as exit slide begins so Hero is interactive on the very first visible frame
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }

        // 750ms upward slide transition
        setTimeout(() => {
          setIsFinished(true);
          document.body.style.overflow = originalBodyOverflow;
          document.documentElement.style.overflow = originalDocOverflow;
        }, 750);
      }, 100);
    };

    // Smooth RAF ticker
    const tick = () => {
      const target = targetPercentRef.current;
      const current = currentPercentRef.current;

      if (current < target) {
        const step = Math.max(0.6, (target - current) * 0.18);
        currentPercentRef.current = Math.min(target, current + step);
        const rounded = Math.floor(currentPercentRef.current);
        setPercent(rounded);

        if (rounded >= 100) {
          setPercent(100);
          triggerExit();
          return;
        }
      } else if (current >= 100) {
        setPercent(100);
        triggerExit();
        return;
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    // Run real asset preload sequence
    runPreloadSequence((progress) => {
      if (progress > targetPercentRef.current) {
        targetPercentRef.current = progress;
      }
    }).then(() => {
      targetPercentRef.current = 100;
    });

    // Hard fallback safety watchdog: guarantee exit after 9.5s max (prevents infinite lock if offline)
    const safetyWatchdog = setTimeout(() => {
      targetPercentRef.current = 100;
      currentPercentRef.current = 100;
      setPercent(100);
      triggerExit();
    }, 9500);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(safetyWatchdog);
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalDocOverflow;
    };
  }, []);

  if (isFinished) {
    return null;
  }

  const formattedNumber = String(percent).padStart(2, '0');

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Website preloader"
      className={`fixed inset-0 z-[99999999] bg-[#050505] text-[#F5F5F2] flex flex-col justify-between p-6 sm:p-10 md:p-16 select-none overflow-hidden will-change-transform ${
        isExiting
          ? isReducedMotion
            ? 'opacity-0 transition-opacity duration-500 ease-out pointer-events-none'
            : '-translate-y-full transition-transform duration-750 ease-[cubic-bezier(0.76,0,0.24,1)] pointer-events-none'
          : 'translate-y-0 opacity-100'
      }`}
    >
      {/* Top Meta Bar */}
      <div
        className={`flex items-center justify-between font-mono text-[9px] sm:text-[10px] tracking-[0.22em] text-[#F5F5F2]/45 uppercase transition-opacity duration-300 ${
          isExiting ? 'opacity-0' : 'opacity-100'
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
          isExiting
            ? '-translate-y-3 opacity-0'
            : percent >= 100
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
          isExiting ? 'opacity-0' : 'opacity-100'
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
