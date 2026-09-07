import React, { useEffect, useRef, useState } from 'react';

type CursorMode = 'default' | 'link' | 'project' | 'explore' | 'close' | 'text';

interface CustomCursorProps {
  isEnabled?: boolean;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ isEnabled = true }) => {
  const [isDesktop, setIsDesktop] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  // Position coordinates and velocities
  const coords = useRef({
    mouseX: -200,
    mouseY: -200,
    dotX: -200,
    dotY: -200,
    ringX: -200,
    ringY: -200,
  });

  const modeRef = useRef<CursorMode>('default');
  const textContentRef = useRef<string>('');
  const isPointerDownRef = useRef(false);
  const isVisibleRef = useRef(false);
  const isInitializedRef = useRef(false);
  const isInsideHeroRef = useRef(false);
  const isLightHeroRef = useRef(false);
  const isEnabledRef = useRef(isEnabled);

  useEffect(() => {
    isEnabledRef.current = isEnabled;
    window.dispatchEvent(new CustomEvent('cursor-enable-change'));
  }, [isEnabled]);

  useEffect(() => {
    // Strictly detect touch devices and mobile screens
    const isTouchOnly =
      window.matchMedia('(hover: none), (pointer: coarse)').matches ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isTouchOnly) {
      return;
    }

    setIsDesktop(true);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animId: number;

    const updateVisualStyles = () => {
      const mode = modeRef.current;
      const isVisible = isVisibleRef.current;
      const isInsideHero = isInsideHeroRef.current;
      const isLightHero = isLightHeroRef.current;
      const isEnabledActive = isEnabledRef.current;

      const ring = ringRef.current;
      const dot = dotRef.current;
      const text = textRef.current;

      if (!ring || !dot || !text) return;

      // Strictly only display the custom cursor inside the Hero Section
      if (!isEnabledActive || !isVisible || !isInsideHero || mode === 'text') {
        ring.style.opacity = '0';
        dot.style.opacity = '0';
        return;
      }

      // On the light version of the hero section: change cursor color to black.
      // In dark version of hero section: keep original inverted difference cursor.
      if (isLightHero) {
        ring.style.mixBlendMode = 'normal';
        dot.style.mixBlendMode = 'normal';
        dot.style.backgroundColor = '#000000';
      } else {
        ring.style.mixBlendMode = 'difference';
        dot.style.mixBlendMode = 'difference';
        dot.style.backgroundColor = '#FFFFFF';
      }

      switch (mode) {
        case 'project': {
          ring.style.opacity = '1';
          ring.style.width = '92px';
          ring.style.height = '92px';
          ring.style.border = 'none';
          ring.style.backgroundColor = isLightHero ? '#000000' : '#FFFFFF';

          text.style.opacity = '1';
          text.textContent = textContentRef.current || 'VIEW';
          text.style.color = isLightHero ? '#FFFFFF' : '#000000';

          dot.style.opacity = '0';
          break;
        }
        case 'explore': {
          ring.style.opacity = '1';
          ring.style.width = '92px';
          ring.style.height = '92px';
          ring.style.border = 'none';
          ring.style.backgroundColor = isLightHero ? '#000000' : '#FFFFFF';

          text.style.opacity = '1';
          text.textContent = textContentRef.current || 'EXPLORE';
          text.style.color = isLightHero ? '#FFFFFF' : '#000000';

          dot.style.opacity = '0';
          break;
        }
        case 'close': {
          ring.style.opacity = '1';
          ring.style.width = '48px';
          ring.style.height = '48px';
          ring.style.border = 'none';
          ring.style.backgroundColor = isLightHero ? '#000000' : '#FFFFFF';

          text.style.opacity = '1';
          text.textContent = textContentRef.current || 'CLOSE';
          text.style.color = isLightHero ? '#FFFFFF' : '#000000';

          dot.style.opacity = '0';
          break;
        }
        case 'link': {
          ring.style.opacity = '1';
          ring.style.width = '56px';
          ring.style.height = '56px';
          ring.style.border = isLightHero
            ? '1px solid rgba(0, 0, 0, 0.85)'
            : '1px solid rgba(255, 255, 255, 0.9)';
          ring.style.backgroundColor = isLightHero
            ? 'rgba(0, 0, 0, 0.08)'
            : 'rgba(255, 255, 255, 0.08)';

          text.style.opacity = '0';
          text.textContent = '';

          dot.style.opacity = '1';
          break;
        }
        case 'default':
        default: {
          ring.style.opacity = '1';
          ring.style.width = '40px';
          ring.style.height = '40px';
          ring.style.border = isLightHero
            ? '1px solid rgba(0, 0, 0, 0.8)'
            : '1px solid rgba(255, 255, 255, 0.85)';
          ring.style.backgroundColor = 'transparent';

          text.style.opacity = '0';
          text.textContent = '';

          dot.style.opacity = '1';
          break;
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      coords.current.mouseX = e.clientX;
      coords.current.mouseY = e.clientY;

      if (!isInitializedRef.current) {
        coords.current.dotX = e.clientX;
        coords.current.dotY = e.clientY;
        coords.current.ringX = e.clientX;
        coords.current.ringY = e.clientY;
        isInitializedRef.current = true;
      }

      const target = e.target as HTMLElement | null;
      const isInsideHero = Boolean(target?.closest('[data-hero-stage="true"]'));
      const isLightHero = Boolean(target?.closest('[data-hero-light="true"]'));
      let needsStyleUpdate = false;

      if (isInsideHero !== isInsideHeroRef.current) {
        isInsideHeroRef.current = isInsideHero;
        needsStyleUpdate = true;
      }
      if (isLightHero !== isLightHeroRef.current) {
        isLightHeroRef.current = isLightHero;
        needsStyleUpdate = true;
      }

      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        needsStyleUpdate = true;
      }

      if (needsStyleUpdate) {
        updateVisualStyles();
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInsideHero = Boolean(target.closest('[data-hero-stage="true"]'));
      const isLightHero = Boolean(target.closest('[data-hero-light="true"]'));
      isInsideHeroRef.current = isInsideHero;
      isLightHeroRef.current = isLightHero;

      // If outside the hero section, hide cursor immediately and return
      if (!isInsideHero) {
        updateVisualStyles();
        return;
      }

      // Inputs / text editing inside hero
      if (target.closest('input, textarea, select, [contenteditable="true"]')) {
        modeRef.current = 'text';
        textContentRef.current = '';
        updateVisualStyles();
        return;
      }

      // Generic interactive links and buttons inside hero
      const linkEl = target.closest('a, button, [role="button"], .cursor-pointer, [data-cursor="link"]');
      if (linkEl) {
        modeRef.current = 'link';
        textContentRef.current = '';
        updateVisualStyles();
        return;
      }

      // Default state inside hero
      if (modeRef.current !== 'default') {
        modeRef.current = 'default';
        textContentRef.current = '';
        updateVisualStyles();
      } else {
        updateVisualStyles();
      }
    };

    const handleMouseDown = () => {
      isPointerDownRef.current = true;
      updateVisualStyles();
    };

    const handleMouseUp = () => {
      isPointerDownRef.current = false;
      updateVisualStyles();
    };

    const handleMouseLeave = () => {
      isVisibleRef.current = false;
      updateVisualStyles();
    };

    const handleMouseEnter = () => {
      isVisibleRef.current = true;
      updateVisualStyles();
    };

    const handleScroll = () => {
      const el = document.elementFromPoint(coords.current.mouseX, coords.current.mouseY) as HTMLElement | null;
      const isInsideHero = Boolean(el?.closest('[data-hero-stage="true"]'));
      const isLightHero = Boolean(el?.closest('[data-hero-light="true"]'));
      if (isInsideHero !== isInsideHeroRef.current || isLightHero !== isLightHeroRef.current) {
        isInsideHeroRef.current = isInsideHero;
        isLightHeroRef.current = isLightHero;
        updateVisualStyles();
      }
    };

    const handleHeroThemeChange = () => {
      requestAnimationFrame(() => {
        const el = document.elementFromPoint(coords.current.mouseX, coords.current.mouseY) as HTMLElement | null;
        isInsideHeroRef.current = Boolean(el?.closest('[data-hero-stage="true"]'));
        isLightHeroRef.current = Boolean(el?.closest('[data-hero-light="true"]'));
        updateVisualStyles();
      });
    };

    const handleEnableChange = () => {
      updateVisualStyles();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    document.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('hero-theme-change', handleHeroThemeChange);
    window.addEventListener('cursor-enable-change', handleEnableChange);

    // Single rAF lerp render loop
    const dotLerp = prefersReducedMotion ? 1 : 0.32;
    const ringLerp = prefersReducedMotion ? 1 : 0.13;

    const render = () => {
      const { mouseX, mouseY } = coords.current;

      // Interpolate dot
      coords.current.dotX += (mouseX - coords.current.dotX) * dotLerp;
      coords.current.dotY += (mouseY - coords.current.dotY) * dotLerp;

      // Interpolate ring
      coords.current.ringX += (mouseX - coords.current.ringX) * ringLerp;
      coords.current.ringY += (mouseY - coords.current.ringY) * ringLerp;

      const ringScale = isPointerDownRef.current ? 0.82 : 1;
      const dotScale =
        modeRef.current === 'link'
          ? 0.55
          : isPointerDownRef.current
          ? 1.25
          : 1;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${coords.current.ringX.toFixed(2)}px, ${coords.current.ringY.toFixed(2)}px, 0) translate(-50%, -50%) scale(${ringScale})`;
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${coords.current.dotX.toFixed(2)}px, ${coords.current.dotY.toFixed(2)}px, 0) translate(-50%, -50%) scale(${dotScale})`;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hero-theme-change', handleHeroThemeChange);
      window.removeEventListener('cursor-enable-change', handleEnableChange);
    };
  }, [isDesktop]);

  if (!isDesktop) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[999999] overflow-hidden">
      {/* Outer Ring / Interaction Badge */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none will-change-transform rounded-full flex items-center justify-center text-center transition-[width,height,background-color,border-color,opacity,color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none overflow-hidden"
        style={{
          mixBlendMode: 'difference',
          width: 40,
          height: 40,
          border: '1px solid rgba(255, 255, 255, 0.85)',
          backgroundColor: 'transparent',
          opacity: 0,
        }}
      >
        <span
          ref={textRef}
          className="font-mono text-[9px] uppercase font-bold tracking-[0.24em] text-[#000000] opacity-0 transition-opacity duration-200 pointer-events-none whitespace-nowrap pl-0.5"
        />
      </div>

      {/* Inner Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none will-change-transform rounded-full bg-white transition-[opacity,background-color] duration-200 ease-out select-none"
        style={{
          mixBlendMode: 'difference',
          width: 8,
          height: 8,
          opacity: 0,
        }}
      />
    </div>
  );
};

export default CustomCursor;
