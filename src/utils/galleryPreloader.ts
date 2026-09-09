/**
 * Gallery Asset Background Preloader
 * Warms up Selected Work thumbnails and metadata in the background during idle time
 * using requestIdleCallback, ensuring zero impact on hero interactions or frame rates.
 */
import { PORTFOLIO_PROJECTS } from '../data/portfolioProjects';

const preloadedUrls = new Set<string>();

function preloadSingleImage(url: string): Promise<void> {
  if (preloadedUrls.has(url)) return Promise.resolve();
  preloadedUrls.add(url);

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

/**
 * Returns the best progressive URL for an image path:
 * Prefers the 800px AVIF variant if available, falling back to 800px JPG.
 */
export function getOptimizedImageUrl(src: string, isThumbnail: boolean = true): string {
  if (!src || !src.endsWith('.jpg')) return src;
  const base = src.replace(/\.jpg$/, '');
  return isThumbnail ? `${base}-800.avif` : `${base}.avif`;
}

export function getFallbackImageUrl(src: string, isThumbnail: boolean = true): string {
  if (!src || !src.endsWith('.jpg')) return src;
  const base = src.replace(/\.jpg$/, '');
  return isThumbnail ? `${base}-800.jpg` : src;
}

let hasStarted = false;

export function preloadGalleryAssets(): void {
  if (hasStarted || typeof window === 'undefined') return;
  hasStarted = true;

  const scheduleTask = (fn: () => void, timeout: number = 2000) => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(fn, { timeout });
    } else {
      setTimeout(fn, 120);
    }
  };

  // Phase 1: Top 3 cards primary thumbnails (urgent for fast scroll)
  scheduleTask(() => {
    const topProjects = PORTFOLIO_PROJECTS.slice(0, 3);
    topProjects.forEach((p) => {
      const primary = p.galleryImages[0]?.src || p.thumbnail;
      if (primary) {
        preloadSingleImage(getOptimizedImageUrl(primary, true));
        preloadSingleImage(getFallbackImageUrl(primary, true));
      }
    });

    // Phase 2: Secondary images for top 2 cards
    scheduleTask(() => {
      const firstTwo = PORTFOLIO_PROJECTS.slice(0, 2);
      firstTwo.forEach((p) => {
        p.galleryImages.slice(1, 4).forEach((img) => {
          preloadSingleImage(getOptimizedImageUrl(img.src, true));
        });
      });

      // Phase 3: Remaining cards primary thumbnails
      scheduleTask(() => {
        PORTFOLIO_PROJECTS.slice(3).forEach((p) => {
          const primary = p.galleryImages[0]?.src || p.thumbnail;
          if (primary) {
            preloadSingleImage(getOptimizedImageUrl(primary, true));
          }
        });
      }, 3000);
    }, 2000);
  }, 1000);
}
