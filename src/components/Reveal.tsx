import React, { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: React.ElementType;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  className = '',
  as: Component = 'div',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.15,
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Component
      ref={ref}
      style={{
        transitionDuration: '700ms',
        transitionTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
        transitionDelay: `${delay}ms`,
      }}
      className={`transition-all will-change-transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
    >
      {children}
    </Component>
  );
};

export default Reveal;
