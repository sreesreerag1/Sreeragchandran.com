import React, { useRef, useEffect } from 'react';

interface MagneticProps {
  children: React.ReactElement;
  strength?: number;
  maxOffset?: number;
  className?: string;
}

export const Magnetic: React.FC<MagneticProps> = ({
  children,
  strength = 0.22,
  maxOffset = 4,
  className = 'inline-block',
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const isReducedMotion = useRef(false);

  useEffect(() => {
    isReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReducedMotion.current || !elementRef.current) return;

    const rect = elementRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    const clampedX = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
    const clampedY = Math.max(-maxOffset, Math.min(maxOffset, deltaY));

    elementRef.current.style.transition = 'transform 0.12s ease-out';
    elementRef.current.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
  };

  const handleMouseLeave = () => {
    if (!elementRef.current) return;
    elementRef.current.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
    elementRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
  };

  return (
    <div
      ref={elementRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </div>
  );
};

export default Magnetic;
