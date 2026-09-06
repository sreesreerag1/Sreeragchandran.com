import { useState, useEffect } from 'react';

/**
 * Custom hook to track overall page scroll progress normalized between 0 and 1.
 */
export const useScrollProgress = (): number => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId: number;

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const current = window.scrollY || window.pageYOffset;
        setProgress(total > 0 ? Math.max(0, Math.min(1, current / total)) : 0);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return progress;
};

export default useScrollProgress;
