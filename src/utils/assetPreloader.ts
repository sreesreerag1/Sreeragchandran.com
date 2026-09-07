/**
 * Asset Preloader Utility for Sreerag Chandran Portfolio.
 * Coordinates font loading, critical image/poster preloading, and smooth progress tracking.
 */

const CRITICAL_IMAGES = [
  '/videos/hero-poster.jpg',
  '/images/portfolio/ai71-launch.jpg',
  '/images/portfolio/a2rl-act-at.jpg',
  '/images/portfolio/adib-effica.jpg',
];

function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    let resolved = false;

    const onDone = () => {
      if (!resolved) {
        resolved = true;
        resolve(true);
      }
    };

    img.onload = onDone;
    img.onerror = onDone; // Never block on image failure
    img.src = url;

    if (img.complete) {
      onDone();
    }

    setTimeout(onDone, 1800);
  });
}

export function runPreloadSequence(
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve) => {
    let completed = false;

    const finish = () => {
      if (!completed) {
        completed = true;
        onProgress(100);
        resolve();
      }
    };

    // Initial starting pulse
    onProgress(12);

    // 1. Font readiness
    const fontPromise = (typeof document !== 'undefined' && document.fonts)
      ? document.fonts.ready.then(() => true).catch(() => true)
      : Promise.resolve(true);

    fontPromise.then(() => {
      if (!completed) onProgress(45);
    });

    // 2. Critical images and posters
    const imagePromises = CRITICAL_IMAGES.map((url) => preloadImage(url));

    Promise.all(imagePromises).then(() => {
      if (!completed) onProgress(85);
    });

    // 3. Overall completion when both fonts and images are ready
    Promise.all([fontPromise, ...imagePromises]).then(() => {
      // Small pause to let DOM paint smoothly
      setTimeout(() => {
        finish();
      }, 150);
    });

    // Safety timeout: Never hold user longer than 2.2 seconds
    setTimeout(() => {
      finish();
    }, 2200);
  });
}
