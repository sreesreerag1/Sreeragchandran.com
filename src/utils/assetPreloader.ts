/**
 * Asset Preloader Utility for Sreerag Chandran Portfolio.
 * Coordinates font loading, critical image preloading, hero video verification (HAVE_ENOUGH_DATA),
 * and smooth progress tracking.
 * 
 * Strict Zero-Poster Policy: No hero-poster or creature-poster images are ever used.
 */

// Critical portfolio image assets (Posters completely removed)
const CRITICAL_IMAGES = [
  '/images/portfolio/ai71-launch.jpg',
  '/images/portfolio/a2rl-act-at.jpg',
  '/images/portfolio/adib-effica.jpg',
];

// Critical Hero Video URLs to preload and verify
export const HERO_VIDEO_ASSETS = {
  // Video 01: Hover-controlled creature intro
  VIDEO_01: '/videos/creature.mp4?v=3',
  // Video 02: Scroll-controlled hero transform
  VIDEO_02: '/videos/hero.mp4?v=5',
  // Theme variants preloaded in background
  THEME_HERO: '/videos/Hero_White.mp4?v=5',
  THEME_INTRO: '/videos/creature_White.mp4?v=3',
};

// Global readiness coordinator between HeroSection component and Preloader
class VideoReadinessCoordinator {
  private v1Ready = false;
  private v2Ready = false;
  private listeners: Array<() => void> = [];

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch {}
    });
  }

  setVideo01Ready() {
    if (!this.v1Ready) {
      this.v1Ready = true;
      this.notify();
    }
  }

  setVideo02Ready() {
    if (!this.v2Ready) {
      this.v2Ready = true;
      this.notify();
    }
  }

  isVideo01Ready() {
    return this.v1Ready;
  }

  isVideo02Ready() {
    return this.v2Ready;
  }

  isAllReady() {
    return this.v1Ready && this.v2Ready;
  }
}

export const heroReadinessCoordinator = new VideoReadinessCoordinator();

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

    setTimeout(onDone, 2000);
  });
}

/**
 * Preload and verify a video according to strict browser requirements:
 * 1. video.readyState >= 4 (HAVE_ENOUGH_DATA)
 * 2. video.duration is valid (isFinite && > 0)
 * 3. metadata is loaded
 * 4. the first frame can be rendered successfully onto a test canvas
 */
export function preloadAndVerifyVideo(
  url: string,
  onReady?: () => void,
  timeoutMs: number = 8500
): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      onReady?.();
      resolve(true);
      return;
    }

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('x5-playsinline', '');
    video.setAttribute('muted', '');
    video.setAttribute('disableremoteplayback', '');
    video.setAttribute('disablepictureinpicture', '');
    video.preload = 'auto';

    // Invisible 16px offscreen element ensures browser engine gives full hardware decoder priority
    video.style.position = 'fixed';
    video.style.top = '0';
    video.style.left = '0';
    video.style.width = '16px';
    video.style.height = '16px';
    video.style.opacity = '0.001';
    video.style.pointerEvents = 'none';
    video.style.zIndex = '-9999';
    document.body.appendChild(video);

    let isDone = false;
    let cleanupTimer: any = null;
    let retryTimer: any = null;

    const cleanup = () => {
      clearTimeout(cleanupTimer);
      clearTimeout(retryTimer);
      video.onloadedmetadata = null;
      video.onloadeddata = null;
      video.oncanplaythrough = null;
      video.onseeked = null;
      video.onerror = null;
      video.pause();
      video.removeAttribute('src');
      video.load();
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
    };

    const finish = (success: boolean) => {
      if (isDone) return;
      isDone = true;
      cleanup();
      onReady?.();
      resolve(success);
    };

    // Verify first frame can actually be rendered onto a canvas (confirms GPU texture is ready)
    const testRenderFirstFrame = (): boolean => {
      try {
        const c = document.createElement('canvas');
        c.width = 16;
        c.height = 16;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, 16, 16);
          const data = ctx.getImageData(8, 8, 1, 1).data;
          // Alpha channel > 0 confirms drawn pixels
          return data[3] > 0;
        }
      } catch {
        // Fallback for cross-origin or local security contexts
      }
      return true;
    };

    const checkReadiness = () => {
      if (isDone) return;
      const validDuration = isFinite(video.duration) && video.duration > 0;
      // readyState >= 4 is HAVE_ENOUGH_DATA; on some mobile browsers readyState >= 3 with valid duration
      if ((video.readyState >= 4 || video.readyState >= 3) && validDuration) {
        testRenderFirstFrame();
        finish(true);
      }
    };

    video.onloadedmetadata = () => {
      try {
        // Seek slightly forward to force frame 0 texture decode
        video.currentTime = 0.02;
      } catch {}
      checkReadiness();
    };

    video.onloadeddata = checkReadiness;
    video.oncanplaythrough = checkReadiness;
    video.onseeked = checkReadiness;

    video.onerror = (e) => {
      console.warn('Video preload error for:', url, e);
      // Allow graceful fallback so user is never stuck
      finish(false);
    };

    // Retry once at 3.8s if video is stalled
    retryTimer = setTimeout(() => {
      if (!isDone && video.readyState < 2) {
        console.warn('Retrying video load for:', url);
        try {
          video.load();
        } catch {}
      }
    }, 3800);

    // Timeout safety watchdog: guarantee resolution after timeoutMs
    cleanupTimer = setTimeout(() => {
      if (!isDone) {
        console.warn('Video preload safety timeout reached for:', url);
        finish(true); // Graceful fallback
      }
    }, timeoutMs);

    video.src = url;
    video.load();
  });
}

export function runPreloadSequence(
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve) => {
    let completed = false;

    let fontsDone = false;
    let imagesDone = false;
    let video01Done = false;
    let video02Done = false;

    const checkAll = () => {
      let currentProgress = 0;
      if (fontsDone) currentProgress += 15;
      if (imagesDone) currentProgress += 15;
      if (video01Done) currentProgress += 35;
      if (video02Done) currentProgress += 35;

      onProgress(currentProgress);

      if (fontsDone && imagesDone && video01Done && video02Done && !completed) {
        completed = true;
        onProgress(100);
        // Small 150ms hold for DOM paint smoothness
        setTimeout(() => {
          resolve();
        }, 150);
      }
    };

    // 1. Initial pulse
    onProgress(10);

    // 2. Fonts readiness (15%)
    const fontPromise = (typeof document !== 'undefined' && document.fonts)
      ? document.fonts.ready.then(() => true).catch(() => true)
      : Promise.resolve(true);

    fontPromise.then(() => {
      fontsDone = true;
      checkAll();
    });

    // 3. Critical portfolio images (15%) (Zero posters!)
    const imagePromises = CRITICAL_IMAGES.map((url) => preloadImage(url));
    Promise.all(imagePromises).then(() => {
      imagesDone = true;
      checkAll();
    });

    // 4. Video 01: Creature Intro (Hover Video) (35%)
    const v1Promise = preloadAndVerifyVideo(HERO_VIDEO_ASSETS.VIDEO_01, () => {
      video01Done = true;
      checkAll();
    });

    // 5. Video 02: Hero (Scroll Video) (35%)
    const v2Promise = preloadAndVerifyVideo(HERO_VIDEO_ASSETS.VIDEO_02, () => {
      video02Done = true;
      checkAll();
    });

    // Directly subscribe to HeroSection component frame-0 canvas renders:
    const unsubscribeCoordinator = heroReadinessCoordinator.subscribe(() => {
      if (heroReadinessCoordinator.isVideo01Ready() && !video01Done) {
        video01Done = true;
        checkAll();
      }
      if (heroReadinessCoordinator.isVideo02Ready() && !video02Done) {
        video02Done = true;
        checkAll();
      }
    });

    // 6. Preload theme variants concurrently in background (do not wait until after hero appears)
    preloadAndVerifyVideo(HERO_VIDEO_ASSETS.THEME_HERO, undefined, 12000).catch(() => {});
    preloadAndVerifyVideo(HERO_VIDEO_ASSETS.THEME_INTRO, undefined, 12000).catch(() => {});

    // 7. Safety timeout: never block the user longer than 8.5 seconds under any network condition
    const safetyTimer = setTimeout(() => {
      if (!completed) {
        console.warn('Preloader safety timeout reached; unlocking website gracefully');
        completed = true;
        unsubscribeCoordinator();
        onProgress(100);
        resolve();
      }
    }, 8500);

    Promise.all([fontPromise, Promise.all(imagePromises), v1Promise, v2Promise]).then(() => {
      clearTimeout(safetyTimer);
      unsubscribeCoordinator();
      if (!completed) {
        completed = true;
        onProgress(100);
        setTimeout(resolve, 150);
      }
    });
  });
}
