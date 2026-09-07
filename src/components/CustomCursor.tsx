import React, { useEffect, useRef, useState } from 'react';

type CursorMode = 'default' | 'link' | 'project' | 'explore' | 'close' | 'text';

export const CustomCursor: React.FC = () => {
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

      const ring = ringRef.current;
      const dot = dotRef.current;
      const text = textRef.current;

      if (!ring || !dot || !text) return;

      if (!isVisible || mode === 'text') {
        ring.style.opacity = '0';
        dot.style.opacity = '0';
        return;
      }

      switch (mode) {
        case 'project': {
          ring.style.opacity = '1';
          ring.style.width = '92px';
          ring.style.height = '92px';
          ring.style.border = 'none';
          ring.style.backgroundColor = '#FFFFFF';

          text.style.opacity = '1';
          text.textContent = textContentRef.current || 'VIEW';

          dot.style.opacity = '0';
          break;
        }
        case 'explore': {
          ring.style.opacity = '1';
          ring.style.width = '92px';
          ring.style.height = '92px';
          ring.style.border = 'none';
          ring.style.backgroundColor = '#FFFFFF';

          text.style.opacity = '1';
          text.textContent = textContentRef.current || 'EXPLORE';

          dot.style.opacity = '0';
          break;
        }
        case 'close': {
          ring.style.opacity = '1';
          ring.style.width = '48px';
          ring.style.height = '48px';
          ring.style.border = 'none';
          ring.style.backgroundColor = '#FFFFFF';

          text.style.opacity = '1';
          text.textContent = textContentRef.current || 'CLOSE';

          dot.style.opacity = '0';
          break;
        }
        case 'link': {
          ring.style.opacity = '1';
          ring.style.width = '56px';
          ring.style.height = '56px';
          ring.style.border = '1px solid rgba(255, 255, 255, 0.9)';
          ring.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';

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
          ring.style.border = '1px solid rgba(255, 255, 255, 0.85)';
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

      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        updateVisualStyles();
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Inputs / text editing
      if (target.closest('input, textarea, select, [contenteditable="true"]')) {
        modeRef.current = 'text';
        textContentRef.current = '';
        updateVisualStyles();
        return;
      }

      // Close controls (Modal close button)
      const closeEl = target.closest('[data-cursor="close"]');
      if (closeEl) {
        modeRef.current = 'close';
        textContentRef.current = closeEl.getAttribute('data-cursor-text') || 'CLOSE';
        updateVisualStyles();
        return;
      }

      // Explore controls (Modal gallery inspection)
      const exploreEl = target.closest('[data-cursor="explore"]');
      if (exploreEl) {
        modeRef.current = 'explore';
        textContentRef.current = exploreEl.getAttribute('data-cursor-text') || 'EXPLORE';
        updateVisualStyles();
        return;
      }

      // Project previews (Marquee & Sticky Stacks)
      const projectEl = target.closest('[data-cursor="project"]');
      if (projectEl) {
        modeRef.current = 'project';
        textContentRef.current = projectEl.getAttribute('data-cursor-text') || 'VIEW';
        updateVisualStyles();
        return;
      }

      // Custom explicit cursor text attribute
      const customTextEl = target.closest('[data-cursor-text]');
      if (customTextEl) {
        modeRef.current = 'project';
        textContentRef.current = customTextEl.getAttribute('data-cursor-text') || 'VIEW';
        updateVisualStyles();
        return;
      }

      // Generic interactive links and buttons
      const linkEl = target.closest('a, button, [role="button"], .cursor-pointer, [data-cursor="link"]');
      if (linkEl) {
        modeRef.current = 'link';
        textContentRef.current = '';
        updateVisualStyles();
        return;
      }

      // Default state
      if (modeRef.current !== 'default') {
        modeRef.current = 'default';
        textContentRef.current = '';
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

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    document.addEventListener('mouseenter', handleMouseEnter, { passive: true });

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
    };
  }, [isDesktop]);

  if (!isDesktop) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[999999] overflow-hidden">
      {/* Outer Ring / Interaction Badge */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none will-change-transform rounded-full flex items-center justify-center text-center transition-[width,height,background-color,border-color,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none overflow-hidden"
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
        className="fixed top-0 left-0 pointer-events-none will-change-transform rounded-full bg-white transition-[opacity] duration-200 ease-out select-none"
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
