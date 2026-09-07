/**
 * High-performance background image prefetcher for Selected Work section.
 * Caches project imagery during browser idle periods so that scrolling
 * through sticky cards is instantaneous with zero loading delay.
 */

const PREFETCH_CACHE = new Set<string>();

export const SELECTED_WORK_PROJECT_IMAGES: { id: string; urls: string[] }[] = [
  {
    id: 'ai-71-launch',
    urls: [
      '/images/projects-gallery/ai-71-launch/img-01.jpg',
      '/images/projects-gallery/ai-71-launch/img-04.jpg',
      '/images/projects-gallery/ai-71-launch/img-03.jpg',
    ],
  },
  {
    id: 'a2rl-act-at',
    urls: [
      '/images/projects-gallery/a2rl-act-at/img-01.jpg',
      '/images/projects-gallery/a2rl-act-at/img-04.jpg',
      '/images/projects-gallery/a2rl-act-at/img-05.jpg',
    ],
  },
  {
    id: 'adib-effica',
    urls: [
      '/images/projects-gallery/adib-effica/img-01.jpg',
      '/images/projects-gallery/adib-effica/img-04.jpg',
      '/images/projects-gallery/adib-effica/img-03.jpg',
    ],
  },
  {
    id: 'exhibition-stands',
    urls: [
      '/images/projects-gallery/exhibition-stands/img-01.jpg',
      '/images/projects-gallery/exhibition-stands/img-02.jpg',
      '/images/projects-gallery/exhibition-stands/img-04.jpg',
    ],
  },
  {
    id: 'being-human-photo-exhibition',
    urls: [
      '/images/projects-gallery/being-human-photo-exhibition/img-02.jpg',
      '/images/projects-gallery/being-human-photo-exhibition/img-03.jpg',
      '/images/projects-gallery/being-human-photo-exhibition/img-01.jpg',
    ],
  },
  {
    id: 'ncema',
    urls: [
      '/images/projects-gallery/ncema/img-01.jpg',
      '/images/projects-gallery/ncema/img-02.jpg',
      '/images/projects-gallery/ncema/img-09.jpg',
    ],
  },
  {
    id: 'eduladder',
    urls: [
      '/images/projects-gallery/eduladder/img-01.jpg',
      '/images/projects-gallery/eduladder/img-03.jpg',
      '/images/projects-gallery/eduladder/img-02.jpg',
    ],
  },
  {
    id: 'rta-annual-gathering',
    urls: [
      '/images/projects-gallery/rta-annual-gathering/img-06.jpg',
      '/images/projects-gallery/rta-annual-gathering/img-07.jpg',
      '/images/projects-gallery/rta-annual-gathering/img-04.jpg',
    ],
  },
  {
    id: 'tii-ai-summit',
    urls: [
      '/images/projects-gallery/tii-ai-summit/img-01.jpg',
      '/images/projects-gallery/tii-ai-summit/img-03.jpg',
      '/images/projects-gallery/tii-ai-summit/img-04.jpg',
    ],
  },
  {
    id: 'adib-national-day',
    urls: [
      '/images/projects-gallery/adib-national-day/img-02.jpg',
      '/images/projects-gallery/adib-national-day/img-03.jpg',
      '/images/projects-gallery/adib-national-day/img-01.jpg',
    ],
  },
  {
    id: 'ncema-generation-readiness',
    urls: [
      '/images/projects-gallery/ncema-generation-readiness/img-01.jpg',
      '/images/projects-gallery/ncema-generation-readiness/img-04.jpg',
      '/images/projects-gallery/ncema-generation-readiness/img-06.jpg',
    ],
  },
  {
    id: 'sef-2022',
    urls: [
      '/images/projects-gallery/sef-2022/img-01.jpg',
      '/images/projects-gallery/sef-2022/img-06.jpg',
      '/images/projects-gallery/sef-2022/img-11.jpg',
    ],
  },
  {
    id: 'yfc-photo-campaign',
    urls: [
      '/images/projects-gallery/yfc-photo-campaign/img-01.jpg',
      '/images/projects-gallery/yfc-photo-campaign/img-03.jpg',
      '/images/projects-gallery/yfc-photo-campaign/img-02.jpg',
    ],
  },
];

export function prefetchImage(url: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (PREFETCH_CACHE.has(url)) return Promise.resolve();

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    const done = () => {
      PREFETCH_CACHE.add(url);
      resolve();
    };
    img.onload = done;
    img.onerror = done;
    img.src = url;

    if (img.complete) {
      done();
    }
  });
}

export function prefetchUrls(urls: string[]): Promise<void[]> {
  return Promise.all(urls.map((url) => prefetchImage(url)));
}

let hasStartedPrefetch = false;

/**
 * Starts staged background prefetching for the Selected Work section.
 * - Stage 1 (Immediate): Cards 01 and 02
 * - Stage 2 (Short delay): Cards 03 and 04
 * - Stage 3 (Idle queue): Cards 05 to 13
 */
export function startSelectedWorkPrefetch(): void {
  if (typeof window === 'undefined' || hasStartedPrefetch) return;
  hasStartedPrefetch = true;

  // Stage 1: Card 01 & 02 immediately
  const stage1 = [
    ...SELECTED_WORK_PROJECT_IMAGES[0].urls,
    ...SELECTED_WORK_PROJECT_IMAGES[1].urls,
  ];
  prefetchUrls(stage1);

  // Stage 2: Card 03 & 04 after 500ms
  setTimeout(() => {
    if (SELECTED_WORK_PROJECT_IMAGES[2]) {
      prefetchUrls(SELECTED_WORK_PROJECT_IMAGES[2].urls);
    }
    if (SELECTED_WORK_PROJECT_IMAGES[3]) {
      prefetchUrls(SELECTED_WORK_PROJECT_IMAGES[3].urls);
    }
  }, 500);

  // Stage 3: Cards 05-13 sequentially during idle periods
  let remainingProjects = SELECTED_WORK_PROJECT_IMAGES.slice(4);

  const scheduleNextIdleBatch = () => {
    if (remainingProjects.length === 0) return;

    const nextProject = remainingProjects.shift();
    if (!nextProject) return;

    const runBatch = () => {
      prefetchUrls(nextProject.urls).then(() => {
        if (remainingProjects.length > 0) {
          if ('requestIdleCallback' in window) {
            (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(
              scheduleNextIdleBatch
            );
          } else {
            setTimeout(scheduleNextIdleBatch, 200);
          }
        }
      });
    };

    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(
        runBatch
      );
    } else {
      setTimeout(runBatch, 200);
    }
  };

  setTimeout(scheduleNextIdleBatch, 1200);
}
