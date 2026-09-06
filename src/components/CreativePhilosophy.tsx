import React, { useEffect, useRef } from 'react';

const VIDEO_URL = '/turn-toward-camera.mp4';
const FALLBACK_VIDEO_URL = '/Turn toword camer.mp4';
const POSTER_URL = '/turn-toward-camera-poster.jpg';

interface CreativePhilosophyProps {
  isHeroIntegrated?: boolean;
  scrollProgress?: number;
}

// Precise cubic-bezier solver for cubic-bezier(0.22, 1, 0.36, 1)
const solveCubicBezier = (
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number
) => {
  return (x: number): number => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const currentX =
        3 * (1 - t) * (1 - t) * t * p1x +
        3 * (1 - t) * t * t * p2x +
        t * t * t;
      const currentSlope =
        3 * (1 - t) * (1 - t) * p1x +
        6 * (1 - t) * t * (p2x - p1x) +
        3 * t * t * (1 - p2x);
      if (Math.abs(currentSlope) < 1e-5) break;
      t -= (currentX - x) / currentSlope;
      t = Math.max(0, Math.min(1, t));
    }
    return (
      3 * (1 - t) * (1 - t) * t * p1y +
      3 * (1 - t) * t * t * p2y +
      t * t * t
    );
  };
};

const easeCubic = solveCubicBezier(0.22, 1, 0.36, 1);

// Calculate cover framing preserving full vertical height (zero vertical crop)
const calculateDrawBounds = (
  canvasW: number,
  canvasH: number,
  imgW: number,
  imgH: number,
  focalX: number = 0.68
) => {
  if (canvasW <= 0 || canvasH <= 0 || imgW <= 0 || imgH <= 0) {
    return { shiftX: 0, shiftY: 0, drawWidth: canvasW, drawHeight: canvasH };
  }
  const scale = Math.max(canvasW / imgW, canvasH / imgH);
  const drawWidth = imgW * scale;
  const drawHeight = imgH * scale;

  // Center vertically, anchor horizontally on focalX (e.g. 68% for desktop subject position)
  const shiftX = Math.min(
    0,
    Math.max(canvasW - drawWidth, canvasW * focalX - drawWidth * focalX)
  );
  const shiftY = (canvasH - drawHeight) / 2;

  return { shiftX, shiftY, drawWidth, drawHeight };
};

export const CreativePhilosophy: React.FC<CreativePhilosophyProps> = ({
  isHeroIntegrated = false,
  scrollProgress: externalScrollProgress,
}) => {
  const standaloneContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Animated elements refs for 120fps hardware-accelerated scroll synchronization
  const textContainerRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);

  const scrollTargetRef = useRef(0);
  const smoothedProgressRef = useRef(0);
  const durationRef = useRef(6.67);
  const framesRef = useRef<ImageBitmap[]>([]);
  const isExtractingRef = useRef(false);

  // Synchronize scroll target from external prop (Hero integrated) or internal scroll
  useEffect(() => {
    if (isHeroIntegrated) {
      if (typeof externalScrollProgress === 'number') {
        scrollTargetRef.current = Math.max(0, Math.min(1, externalScrollProgress));
      } else {
        const handleWindowScroll = () => {
          const currentY = window.scrollY || window.pageYOffset;
          // When integrated, hero downward push ends at 2600px; video scrub is 2600px -> 4800px
          const p = Math.max(0, Math.min(1, (currentY - 2600) / 2200));
          scrollTargetRef.current = p;
        };
        window.addEventListener('scroll', handleWindowScroll, { passive: true });
        handleWindowScroll();
        return () => window.removeEventListener('scroll', handleWindowScroll);
      }
    } else {
      // Standalone dedicated scroll container listener
      const handleStandaloneScroll = () => {
        const container = standaloneContainerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const windowH = window.innerHeight;
        const totalScrollable = container.offsetHeight - windowH;
        if (totalScrollable <= 0) return;

        const currentScrolled = -rect.top;
        const p = Math.max(0, Math.min(1, currentScrolled / totalScrollable));
        scrollTargetRef.current = p;
      };

      window.addEventListener('scroll', handleStandaloneScroll, { passive: true });
      handleStandaloneScroll();
      return () => window.removeEventListener('scroll', handleStandaloneScroll);
    }
  }, [isHeroIntegrated, externalScrollProgress]);

  // Handle canvas resize with DPR cap of 2
  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = canvas.parentElement;
    const w = parent && parent.clientWidth > 0 ? parent.clientWidth : window.innerWidth;
    const h = parent && parent.clientHeight > 0 ? parent.clientHeight : window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Background frame extraction for instant 120fps reverse/forward scrubbing
  useEffect(() => {
    let isMounted = true;

    const startExtraction = async () => {
      if (isExtractingRef.current || framesRef.current.length > 0) return;
      isExtractingRef.current = true;

      const offscreenVideo = document.createElement('video');
      offscreenVideo.muted = true;
      offscreenVideo.playsInline = true;
      offscreenVideo.preload = 'auto';
      offscreenVideo.src = VIDEO_URL;

      await new Promise<void>((resolve) => {
        offscreenVideo.onloadedmetadata = () => resolve();
        offscreenVideo.onerror = () => {
          offscreenVideo.src = FALLBACK_VIDEO_URL;
          offscreenVideo.onloadedmetadata = () => resolve();
        };
      });

      if (!isMounted) return;

      const duration = offscreenVideo.duration || 6.67;
      durationRef.current = duration;

      const targetFrames = Math.min(75, Math.max(24, Math.floor(duration * 11)));
      const extractCanvas = document.createElement('canvas');
      const ctx = extractCanvas.getContext('2d');

      const videoWidth = offscreenVideo.videoWidth || 1920;
      const videoHeight = offscreenVideo.videoHeight || 1080;
      const maxWidth = 1280;
      const scale = Math.min(1, maxWidth / videoWidth);
      const targetWidth = Math.round(videoWidth * scale);
      const targetHeight = Math.round(videoHeight * scale);

      extractCanvas.width = targetWidth;
      extractCanvas.height = targetHeight;

      const extracted: ImageBitmap[] = [];

      try {
        for (let i = 0; i < targetFrames; i++) {
          if (!isMounted) break;
          const targetTime =
            (i / (targetFrames - 1)) * Math.max(0, duration - 0.05);

          await new Promise<void>((resolve) => {
            const onSeeked = () => {
              offscreenVideo.removeEventListener('seeked', onSeeked);
              resolve();
            };
            offscreenVideo.addEventListener('seeked', onSeeked);
            offscreenVideo.currentTime = targetTime;
          });

          if (ctx) {
            ctx.drawImage(offscreenVideo, 0, 0, targetWidth, targetHeight);
            if ('createImageBitmap' in window) {
              const bmp = await createImageBitmap(extractCanvas);
              extracted.push(bmp);
            }
          }
        }

        if (isMounted && extracted.length > 0) {
          framesRef.current = extracted;
        }
      } catch (err) {
        console.warn('Frame cache extraction complete with fallback', err);
      } finally {
        isExtractingRef.current = false;
      }
    };

    startExtraction();

    return () => {
      isMounted = false;
      framesRef.current.forEach((bmp) => bmp.close());
    };
  }, []);

  // Apple-style smooth interpolation render loop (requestAnimationFrame)
  useEffect(() => {
    let animId: number;

    const render = () => {
      const target = scrollTargetRef.current;
      // Weighted lerp for Apple-style smooth glide
      smoothedProgressRef.current += (target - smoothedProgressRef.current) * 0.12;
      const smooth = smoothedProgressRef.current;

      // 1. Direct HTML5 video scrubbing (0 -> 100% timeline)
      const video = videoRef.current;
      if (video && video.duration && !isNaN(video.duration)) {
        const targetTime = Math.max(
          0,
          Math.min(video.duration - 0.05, smooth * video.duration)
        );
        if (Math.abs(video.currentTime - targetTime) > 0.02) {
          video.currentTime = targetTime;
        }
      }

      // 2. High-performance canvas drawing from pre-cached frames (instant reverse-seek)
      const canvas = canvasRef.current;
      const frames = framesRef.current;
      if (canvas && frames.length > 0) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const frameIndex = Math.max(
            0,
            Math.min(
              frames.length - 1,
              Math.round(smooth * (frames.length - 1))
            )
          );
          const bmp = frames[frameIndex];
          if (bmp) {
            const isDesktop = window.innerWidth >= 1024;
            const focalX = isDesktop ? 0.68 : 0.58;
            const { shiftX, shiftY, drawWidth, drawHeight } =
              calculateDrawBounds(
                canvas.width,
                canvas.height,
                bmp.width,
                bmp.height,
                focalX
              );
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(bmp, shiftX, shiftY, drawWidth, drawHeight);
          }
        }
      }

      // 3. TEXT & EDITORIAL SYNCHRONIZATION CONTROLLER:
      // 0% -> 50% scroll progress:
      //   - translateY(120px) -> translateY(0px)
      //   - opacity 0 -> opacity 1
      //   - cubic-bezier(0.22, 1, 0.36, 1) smooth easing
      // 50% -> 100% scroll progress:
      //   - translateY(0px)
      //   - opacity 1 (held firm while video continues to scrub)
      if (textContainerRef.current) {
        let textY = 0;
        let textOpacity = 1;
        if (smooth < 0.5) {
          const rawProgress = Math.max(0, smooth / 0.5);
          const eased = easeCubic(rawProgress);
          textY = (1 - eased) * 120;
          textOpacity = eased;
        }
        textContainerRef.current.style.transform = `translate3d(0, ${textY.toFixed(2)}px, 0)`;
        textContainerRef.current.style.opacity = textOpacity.toFixed(3);
      }

      // Synchronize top and bottom editorial bars
      if (topBarRef.current) {
        const topOpacity = Math.min(1, Math.max(0, smooth / 0.25));
        topBarRef.current.style.opacity = topOpacity.toFixed(3);
      }
      if (bottomBarRef.current) {
        const bottomOpacity = Math.min(1, Math.max(0, smooth / 0.35));
        bottomBarRef.current.style.opacity = bottomOpacity.toFixed(3);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  const content = (
    <section
      id="philosophy"
      className="relative z-20 w-full h-full bg-[#050505] text-[#F5F5F2] flex flex-col justify-between select-none overflow-hidden px-5 sm:px-8 md:px-14 lg:px-18 xl:px-24 pt-7 sm:pt-10 md:pt-14 pb-3 sm:pb-5 md:pb-8"
    >
      {/* =========================================================================
          CINEMATIC FULL BACKGROUND VIDEO & CANVAS SCRUB LAYER
          Asset: /turn-toward-camera.mp4
          Features:
          - HTML5 video + pre-cached canvas frame interpolation
          - Zero vertical crop (full height of character visible)
          - Framed on the right-third (object-[68%_center]) on both mobile & desktop
          - Mobile text overlay on lower third with face visible and vertically centered
         ========================================================================= */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        {/* HTML5 video element */}
        <video
          ref={videoRef}
          src={VIDEO_URL}
          poster={POSTER_URL}
          preload="auto"
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-[68%_center] pointer-events-none"
        />

        {/* High-speed canvas layer for instantaneous forward/reverse scrubbing */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Subtle Dark Vignette & Readability Layers */}
        {/* Desktop: left-to-right vignette protects text legibility on left while keeping character vivid on right */}
        <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-[#050505]/95 via-[#050505]/60 to-transparent w-full pointer-events-none" />
        <div className="hidden lg:block absolute inset-0 bg-gradient-to-t from-[#050505]/85 via-transparent to-[#050505]/40 pointer-events-none" />

        {/* Mobile: dark transparent gradient rising from the bottom with soft falloff, protecting lower third text while face stays crystal clear */}
        <div className="lg:hidden absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-[#050505] via-[#050505]/85 via-45% to-transparent pointer-events-none" />
        <div className="lg:hidden absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#050505]/60 to-transparent pointer-events-none" />
      </div>

      {/* =========================================================================
          TOP EDITORIAL LABEL
          Minimal editorial info bar with hairline divider
         ========================================================================= */}
      <div
        ref={topBarRef}
        className="relative z-10 w-full flex items-center justify-end pb-3 sm:pb-4 border-b border-white/15 flex-shrink-0"
        style={{ opacity: 0 }}
      >
        <div className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/50 font-medium">
          BASED IN DUBAI • STUDIO 2026
        </div>
      </div>

      {/* =========================================================================
          MAIN EDITORIAL CONTENT (Balanced above the cinematic background)
          Text Entry: 0% -> 50% scroll: translateY(120px) -> 0, opacity 0 -> 1
                      50% -> 100% scroll: translateY(0), opacity 1 (held)
         ========================================================================= */}
      <div className="relative z-10 w-full flex-1 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 lg:gap-12 xl:gap-16 my-auto py-4 sm:py-6">
        {/* LEFT SIDE: Text Content */}
        <div
          ref={textContainerRef}
          className="w-full lg:w-[50%] xl:w-[46%] flex flex-col justify-center will-change-transform"
          style={{
            transform: 'translate3d(0, 120px, 0)',
            opacity: 0,
          }}
        >
          {/* Name */}
          <h1 className="font-kanit font-bold text-3xl sm:text-4xl md:text-5xl lg:text-[44px] xl:text-[54px] uppercase tracking-[-0.03em] leading-none text-white drop-shadow-sm">
            SREERAG CHANDRAN
          </h1>

          {/* Role */}
          <p className="font-sans text-xs sm:text-sm md:text-[14px] uppercase tracking-[0.18em] text-white/60 font-medium mt-1.5 sm:mt-2">
            Creative Director
          </p>

          {/* Main Statement (Slow cinematic reveal) */}
          <div className="mt-4 sm:mt-5 lg:mt-6">
            <h2 className="font-kanit font-medium text-xl sm:text-2xl md:text-[28px] lg:text-[32px] xl:text-[38px] leading-[1.15] sm:leading-[1.12] tracking-[-0.02em] text-white uppercase">
              “I create ideas that don’t stay on the page.”
            </h2>
          </div>

          {/* Supporting Paragraph 1 */}
          <p className="font-sans text-xs sm:text-sm md:text-[13px] xl:text-[14px] text-white/80 leading-[1.68] font-light mt-3 sm:mt-4 max-w-xl">
            I’m Sreerag Chandran, a multidisciplinary Creative Director with 15 years of experience across advertising, branding, live experiences and visual storytelling.
          </p>

          {/* Supporting Paragraph 2 */}
          <p className="font-sans text-xs sm:text-sm md:text-[13px] xl:text-[14px] text-white/80 leading-[1.68] font-light mt-2 sm:mt-2.5 max-w-xl">
            I believe the strongest ideas don’t belong to a single medium. They can live on a billboard, transform a space, become an immersive experience or exist on a screen.
          </p>

          {/* Supporting Paragraph 3 */}
          <p className="font-sans text-xs sm:text-sm md:text-[13px] xl:text-[14px] text-white/80 leading-[1.68] font-light mt-2 sm:mt-2.5 max-w-xl">
            My work sits at the intersection of strategy, storytelling and design — creating ideas that are not only visually distinctive, but built to connect with people.
          </p>
        </div>

        {/* RIGHT SIDE: Open space letting the cinematic subject & atmospheric smoke shine through */}
        <div className="hidden lg:block w-full lg:w-[50%] xl:w-[54%] h-full pointer-events-none" />
      </div>

      {/* =========================================================================
          BOTTOM DISCIPLINE LIST
          Minimal expertise row with thin separators and elegant spacing
         ========================================================================= */}
      <div
        ref={bottomBarRef}
        className="relative z-10 pt-3 sm:pt-4 border-t border-white/15 flex-shrink-0"
        style={{ opacity: 0 }}
      >
        <div className="flex flex-wrap items-center gap-y-2 font-mono text-[10px] sm:text-xs uppercase tracking-[0.16em] text-white/70 font-medium">
          <span className="hover:text-white transition-colors cursor-default">Brand Identity</span>
          <span className="text-white/30 mx-2.5 sm:mx-4 font-light select-none">|</span>
          <span className="hover:text-white transition-colors cursor-default">Experiential Concepts</span>
          <span className="text-white/30 mx-2.5 sm:mx-4 font-light select-none">|</span>
          <span className="hover:text-white transition-colors cursor-default">Campaign Ideation</span>
          <span className="text-white/30 mx-2.5 sm:mx-4 font-light select-none">|</span>
          <span className="hover:text-white transition-colors cursor-default">Visual Narrative</span>
          <span className="text-white/30 mx-2.5 sm:mx-4 font-light select-none">|</span>
          <span className="hover:text-white transition-colors cursor-default">Creative Direction</span>
        </div>
      </div>
    </section>
  );

  // If integrated within the hero physical downward push, return the content directly
  if (isHeroIntegrated) {
    return content;
  }

  // If standalone, wrap in dedicated 250vh sticky scroll container
  return (
    <div
      ref={standaloneContainerRef}
      className="relative w-full"
      style={{ height: 'calc(100vh + 2200px)' }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#050505]">
        {content}
      </div>
    </div>
  );
};

export default CreativePhilosophy;
