/**
 * High-performance asset preloader utility for Sreerag Chandran Portfolio.
 * Preloads critical initial experience assets (fonts, video metadata, posters, key thumbnails)
 * with mobile throttling, per-asset error recovery, and a hard safety timeout.
 */

const CRITICAL_IMAGES = [
  '/videos/hero-poster.jpg',
  '/videos/creature-poster.jpg',
  '/images/portfolio/ai71-launch.jpg',
  '/images/portfolio/a2rl-act-at.jpg',
  '/images/portfolio/adib-effica.jpg',
  '/images/portfolio/exhibition-stands.jpg',
  '/images/projects-gallery/ai-71-launch/img-01.jpg',
];

const DESKTOP_VIDEOS = [
  '/videos/creature.mp4?v=3',
  '/videos/hero.mp4?v=5',
  '/videos/creature_White.mp4?v=3',
  '/videos/Hero_White.mp4?v=5',
];

const MOBILE_VIDEOS = [
  '/videos/creature.mp4?v=3',
  '/videos/hero.mp4?v=5',
];

function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    let resolved = false;

    const onComplete = () => {
      if (!resolved) {
        resolved = true;
        resolve(true);
      }
    };

    img.onload = onComplete;
    img.onerror = onComplete; // Gracefully continue on error
    img.src = url;

    if (img.complete) {
      onComplete();
    }

    // Safety per-image timeout
    setTimeout(onComplete, 2500);
  });
}

function preloadVideoMetadata(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    let resolved = false;

    const onComplete = () => {
      if (!resolved) {
        resolved = true;
        video.onloadedmetadata = null;
        video.oncanplay = null;
        video.onerror = null;
        resolve(true);
      }
    };

    video.onloadedmetadata = () => {
      if (!isNaN(video.duration) && video.duration > 0) {
        onComplete();
      }
    };
    video.oncanplay = onComplete;
    video.onerror = onComplete; // Fail gracefully

    video.src = url;
    video.load();

    // Safety per-video timeout
    setTimeout(onComplete, 3500);
  });
}

export function runPreloadSequence(
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve) => {
    const isMobile =
      typeof window !== 'undefined' &&
      (window.matchMedia('(hover: none), (pointer: coarse)').matches ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

    const videoUrls = isMobile ? MOBILE_VIDEOS : DESKTOP_VIDEOS;
    const allTasks: Promise<boolean>[] = [];

    // 1. Font readiness
    if (typeof document !== 'undefined' && document.fonts) {
      allTasks.push(
        document.fonts.ready
          .then(() => true)
          .catch(() => true)
      );
    }

    // 2. Images and Posters
    CRITICAL_IMAGES.forEach((url) => {
      allTasks.push(preloadImage(url));
    });

    // 3. Videos
    videoUrls.forEach((url) => {
      allTasks.push(preloadVideoMetadata(url));
    });

    const totalTasks = allTasks.length;
    let completedTasks = 0;
    let hasFinished = false;

    const markFinished = () => {
      if (!hasFinished) {
        hasFinished = true;
        onProgress(100);
        resolve();
      }
    };

    // Hard safety watchdog (6.5s max)
    const watchdogTimer = setTimeout(() => {
      markFinished();
    }, 6500);

    allTasks.forEach((task) => {
      task.then(() => {
        if (hasFinished) return;
        completedTasks++;
        const currentPercent = Math.min(
          99,
          Math.round((completedTasks / totalTasks) * 100)
        );
        onProgress(currentPercent);

        if (completedTasks >= totalTasks) {
          clearTimeout(watchdogTimer);
          markFinished();
        }
      });
    });
  });
}
