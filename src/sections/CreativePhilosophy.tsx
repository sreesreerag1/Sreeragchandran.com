import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, MotionValue } from 'framer-motion';

const VIDEO_URL = '/turn-toward-camera.mp4';
const FALLBACK_VIDEO_URL = '/Turn toword camer.mp4';

const ABOUT_PARAGRAPH =
  "Directing at the intersection of creative strategy, brand experience, and visual storytelling. With over a decade of leadership across brand systems, immersive environments, and global campaigns, I guide ideas from raw concept to commanding cultural execution.";

interface CharacterProps {
  char: string;
  progress: MotionValue<number>;
  range: [number, number];
}

const CharacterSpan: React.FC<CharacterProps> = ({ char, progress, range }) => {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return <motion.span style={{ opacity }}>{char}</motion.span>;
};

const CharacterRevealParagraph: React.FC<{
  text: string;
  progress: MotionValue<number>;
  className?: string;
}> = ({ text, progress, className }) => {
  const words = text.split(' ');
  const totalChars = text.length;
  let charCounter = 0;

  return (
    <p className={className}>
      {words.map((word, wIdx) => {
        const chars = word.split('');
        const wordSpans = chars.map((char) => {
          const i = charCounter++;
          const start = i / totalChars;
          const end = Math.min(1, (i + 1) / totalChars);
          return (
            <CharacterSpan
              key={i}
              char={char}
              progress={progress}
              range={[start, end]}
            />
          );
        });

        let spaceSpan: React.ReactNode = null;
        if (wIdx < words.length - 1) {
          const i = charCounter++;
          const start = i / totalChars;
          const end = Math.min(1, (i + 1) / totalChars);
          spaceSpan = (
            <CharacterSpan
              key={`space-${wIdx}`}
              char=" "
              progress={progress}
              range={[start, end]}
            />
          );
        }

        return (
          <span key={wIdx} className="inline-block whitespace-nowrap">
            {wordSpans}
            {spaceSpan}
          </span>
        );
      })}
    </p>
  );
};

interface CreativePhilosophyProps {
  isHeroIntegrated?: boolean;
  scrollProgress?: number;
}


// Safe seek helper setting currentTime directly for responsive, artifact-free scrubbing
const safeSeek = (v: HTMLVideoElement, time: number) => {
  try {
    v.currentTime = time;
  } catch {}
};

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
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Framer Motion useScroll hook with offset ['start 0.8', 'end 0.2']
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.8', 'end 0.2'],
  });

  const animatedProgress = useMotionValue(0.2);

  // Animated elements refs for 120fps hardware-accelerated scroll synchronization
  const textContainerRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);

  const scrollTargetRef = useRef(0);
  const smoothedProgressRef = useRef(0);
  const durationRef = useRef(6.67);
  const framesRef = useRef<CanvasImageSource[]>([]);
  const isExtractingRef = useRef(false);

  // Synchronize scroll target from external prop (Hero integrated) or internal scroll
  useEffect(() => {
    if (isHeroIntegrated) {
      if (typeof externalScrollProgress === 'number') {
        const p = Math.max(0, Math.min(1, externalScrollProgress));
        scrollTargetRef.current = p;
        animatedProgress.set(p);
      } else {
        const handleWindowScroll = () => {
          const currentY = window.scrollY || window.pageYOffset;
          // Hero downward push finishes at 1850px; philosophy section scrubs from 1850px to 3050px (1200px duration)
          const p = Math.max(0, Math.min(1, (currentY - 1850) / 1200));
          scrollTargetRef.current = p;
          animatedProgress.set(p);
        };
        window.addEventListener('scroll', handleWindowScroll, { passive: true });
        handleWindowScroll();
        return () => window.removeEventListener('scroll', handleWindowScroll);
      }
    } else {
      const unsubscribe = scrollYProgress.on('change', (latest) => {
        animatedProgress.set(latest);
      });
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
      return () => {
        unsubscribe();
        window.removeEventListener('scroll', handleStandaloneScroll);
      };
    }
  }, [isHeroIntegrated, externalScrollProgress, scrollYProgress, animatedProgress]);

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

  // Media unlock & decoder priming for iOS Safari, WebKit, Gecko, and Blink
  useEffect(() => {
    const unlockVideo = () => {
      const v = videoRef.current;
      if (!v) return;
      v.muted = true;
      v.defaultMuted = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.setAttribute('x5-playsinline', '');
      v.setAttribute('muted', '');
      const p = v.play();
      if (p !== undefined) {
        p.then(() => {
          v.pause();
        }).catch(() => {});
      }
    };

    unlockVideo();
    const unlockEvents: Array<keyof WindowEventMap> = [
      'touchstart',
      'pointerdown',
      'click',
      'wheel',
      'scroll',
      'keydown',
    ];
    unlockEvents.forEach((evt) => {
      window.addEventListener(evt, unlockVideo, { once: true, passive: true });
    });

    return () => {
      unlockEvents.forEach((evt) => {
        window.removeEventListener(evt, unlockVideo);
      });
    };
  }, []);

  // Decoder priming on initial mount to ensure first video frame is pre-rendered
  useEffect(() => {
    const v = videoRef.current;
    if (v && v.readyState >= 1) {
      try {
        v.currentTime = 0.02;
      } catch {}
    }
  }, []);

  // Background frame extraction for instant 120fps reverse/forward scrubbing
  useEffect(() => {
    let isMounted = true;

    const startExtraction = async () => {
      // On mobile devices, avoid heavy background frame extraction to prevent WebKit memory exhaustion
      const isMobile =
        typeof window !== 'undefined' &&
        (window.innerWidth < 768 ||
          'ontouchstart' in window ||
          (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));

      if (isMobile) return;

      if (isExtractingRef.current || framesRef.current.length > 0) return;
      isExtractingRef.current = true;

      const offscreenVideo = document.createElement('video');
      offscreenVideo.muted = true;
      offscreenVideo.defaultMuted = true;
      offscreenVideo.playsInline = true;
      offscreenVideo.setAttribute('playsinline', '');
      offscreenVideo.setAttribute('webkit-playsinline', '');
      offscreenVideo.setAttribute('x5-playsinline', '');
      offscreenVideo.setAttribute('muted', '');
      offscreenVideo.setAttribute('disableremoteplayback', '');
      offscreenVideo.setAttribute('disablepictureinpicture', '');
      offscreenVideo.preload = 'auto';
      offscreenVideo.src = VIDEO_URL;

      // Attach invisible element for WebKit/iOS Safari compliance
      offscreenVideo.style.position = 'fixed';
      offscreenVideo.style.top = '0';
      offscreenVideo.style.left = '0';
      offscreenVideo.style.opacity = '0.001';
      offscreenVideo.style.pointerEvents = 'none';
      offscreenVideo.style.zIndex = '-9999';
      offscreenVideo.style.width = '16px';
      offscreenVideo.style.height = '16px';
      document.body.appendChild(offscreenVideo);

      await new Promise<void>((resolve) => {
        offscreenVideo.onloadedmetadata = () => resolve();
        offscreenVideo.onerror = () => {
          offscreenVideo.src = FALLBACK_VIDEO_URL;
          offscreenVideo.onloadedmetadata = () => resolve();
        };
      });

      if (!isMounted) {
        if (offscreenVideo.parentNode) offscreenVideo.parentNode.removeChild(offscreenVideo);
        return;
      }

      const duration = offscreenVideo.duration || 6.67;
      durationRef.current = duration;

      const targetFrames = Math.min(75, Math.max(24, Math.floor(duration * 11)));
      const extractCanvas = document.createElement('canvas');
      const ctx = extractCanvas.getContext('2d', { willReadFrequently: true });

      const videoWidth = offscreenVideo.videoWidth || 1920;
      const videoHeight = offscreenVideo.videoHeight || 1080;
      const maxWidth = 1280;
      const scale = Math.min(1, maxWidth / videoWidth);
      const targetWidth = Math.round(videoWidth * scale);
      const targetHeight = Math.round(videoHeight * scale);

      extractCanvas.width = targetWidth;
      extractCanvas.height = targetHeight;

      const extracted: CanvasImageSource[] = [];

      try {
        for (let i = 0; i < targetFrames; i++) {
          if (!isMounted) break;
          const targetTime =
            (i / (targetFrames - 1)) * Math.max(0, duration - 0.05);

          await new Promise<void>((resolve) => {
            let done = false;
            let tid: any = null;
            const finish = () => {
              if (done) return;
              done = true;
              clearTimeout(tid);
              requestAnimationFrame(() => {
                resolve();
              });
            };
            const onSeeked = () => {
              offscreenVideo.removeEventListener('seeked', onSeeked);
              if ('requestVideoFrameCallback' in offscreenVideo) {
                (offscreenVideo as any).requestVideoFrameCallback(finish);
              } else {
                finish();
              }
            };
            tid = setTimeout(() => {
              offscreenVideo.removeEventListener('seeked', onSeeked);
              finish();
            }, 800);
            offscreenVideo.addEventListener('seeked', onSeeked, { once: true });
            offscreenVideo.currentTime = targetTime;
          });

          if (ctx) {
            ctx.drawImage(offscreenVideo, 0, 0, targetWidth, targetHeight);
            // Persistent canvas elements: immune to ImageBitmap invalidation, survives all browsers
            const c = document.createElement('canvas');
            c.width = targetWidth;
            c.height = targetHeight;
            const cCtx = c.getContext('2d');
            if (cCtx) {
              cCtx.drawImage(extractCanvas, 0, 0);
              extracted.push(c);
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
        offscreenVideo.pause();
        offscreenVideo.removeAttribute('src');
        offscreenVideo.load();
        if (offscreenVideo.parentNode) {
          offscreenVideo.parentNode.removeChild(offscreenVideo);
        }
      }
    };

    let triggered = false;
    const triggerExtraction = () => {
      if (triggered || !isMounted) return;
      triggered = true;
      window.removeEventListener('scroll', onScrollTrigger);
      startExtraction();
    };

    const onScrollTrigger = () => {
      if ((window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0) > 500) {
        triggerExtraction();
      }
    };

    window.addEventListener('scroll', onScrollTrigger, { passive: true });
    const idleTid = setTimeout(triggerExtraction, 6000);

    return () => {
      isMounted = false;
      window.removeEventListener('scroll', onScrollTrigger);
      clearTimeout(idleTid);
    };
  }, []);

  // Apple-style smooth interpolation render loop (requestAnimationFrame)
  useEffect(() => {
    let animId: number;

    const render = () => {
      const target = scrollTargetRef.current;
      const delta = Math.abs(target - smoothedProgressRef.current);
      const factor = delta > 0.2 ? 0.36 : 0.12;
      smoothedProgressRef.current += (target - smoothedProgressRef.current) * factor;

      if (Math.abs(target - smoothedProgressRef.current) < 0.002) {
        smoothedProgressRef.current = target;
      }
      const smooth = smoothedProgressRef.current;

      // 1. Direct HTML5 video scrubbing (0 -> 100% timeline)
      const video = videoRef.current;
      const duration =
        video && video.duration && !isNaN(video.duration) && video.duration > 0
          ? video.duration
          : durationRef.current;
      if (video && duration > 0) {
        if (!video.seeking && video.readyState >= 2) {
          const targetTime = Math.max(
            0.02,
            Math.min(duration - 0.05, 0.02 + smooth * (duration - 0.07))
          );
          if (Math.abs(video.currentTime - targetTime) > 0.03) {
            safeSeek(video, targetTime);
          }
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
            const focalX = 0.68;
            const frameW = (bmp as any).width || 1280;
            const frameH = (bmp as any).height || 720;
            const { shiftX, shiftY, drawWidth, drawHeight } =
              calculateDrawBounds(
                canvas.width,
                canvas.height,
                frameW,
                frameH,
                focalX
              );
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(bmp, shiftX, shiftY, drawWidth, drawHeight);
          }
        }
      }

      // 3. TEXT & EDITORIAL SYNCHRONIZATION:
      // Always fully visible (opacity: 1) and aligned so the About section is immediately readable
      if (textContainerRef.current) {
        textContainerRef.current.style.transform = 'translate3d(0, 0px, 0)';
        textContainerRef.current.style.opacity = '1';
      }

      // Synchronize top and bottom editorial bars: always fully visible
      if (topBarRef.current) {
        topBarRef.current.style.opacity = '1';
      }
      if (bottomBarRef.current) {
        bottomBarRef.current.style.opacity = '1';
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
      ref={sectionRef}
      id="philosophy"
      className="relative z-20 w-full h-full bg-[#050505] text-[#F5F5F2] flex flex-col justify-between select-none overflow-hidden px-5 sm:px-8 md:px-14 lg:px-18 xl:px-24 pt-16 sm:pt-20 md:pt-24 pb-3 sm:pb-5 md:pb-8"
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
          preload="auto"
          muted
          defaultMuted
          playsInline
          {...({ 'webkit-playsinline': '', 'playsinline': '', 'x5-playsinline': '' } as any)}
          disablePictureInPicture
          disableRemotePlayback
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            if (v.duration) {
              durationRef.current = v.duration;
            }
            try {
              v.currentTime = 0.02;
            } catch {}
          }}
          onError={() => {
            if (videoRef.current && !videoRef.current.src.includes('Turn%20toword')) {
              videoRef.current.src = FALLBACK_VIDEO_URL;
            }
          }}
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
        className="relative z-10 w-full flex items-center justify-end pb-2.5 sm:pb-4 border-b border-white/15 flex-shrink-0"
        style={{ opacity: 1 }}
      >
        <div className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white font-medium">
          BASED IN DUBAI • STUDIO 2026
        </div>
      </div>

      {/* =========================================================================
          MAIN EDITORIAL CONTENT (Balanced above the cinematic background)
          Mobile: Anchored in the LOWER THIRD as a cinematic editorial overlay
          Desktop: 50/50 two-column bilateral spread (text left / open video right)
         ========================================================================= */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-end lg:justify-between lg:flex-row items-start lg:items-center gap-3 sm:gap-6 lg:gap-12 xl:gap-16 mt-auto lg:my-auto pt-0 sm:pt-2 lg:py-4 pb-2 sm:pb-3 lg:pb-0">
        {/* LEFT SIDE / LOWER THIRD: Text Content */}
        <div
          ref={textContainerRef}
          className="w-full lg:w-[50%] xl:w-[46%] flex flex-col justify-end lg:justify-center will-change-transform max-w-lg lg:max-w-none"
          style={{
            transform: 'translate3d(0, 0px, 0)',
            opacity: 1,
          }}
        >
          {/* Name */}
          <h1 className="font-kanit font-bold text-2xl sm:text-3xl md:text-5xl lg:text-[44px] xl:text-[54px] uppercase tracking-[-0.025em] leading-[1.05] text-white drop-shadow-sm">
            SREERAG CHANDRAN
          </h1>

          {/* Role */}
          <p className="font-sans text-[10px] sm:text-xs md:text-[14px] uppercase tracking-[0.2em] text-white font-medium mt-1 sm:mt-1.5">
            Creative Director
          </p>

          {/* Main Statement (Slow cinematic reveal) */}
          <div className="mt-2.5 sm:mt-4 lg:mt-6">
            <h2 className="font-kanit font-medium text-lg sm:text-xl md:text-[28px] lg:text-[32px] xl:text-[38px] leading-[1.18] sm:leading-[1.15] lg:leading-[1.12] tracking-[-0.02em] text-white uppercase">
              “Crafting perception through design.”
            </h2>
          </div>

          {/* Restored Scroll-Based Character-by-Character Animated Paragraph */}
          <CharacterRevealParagraph
            text={ABOUT_PARAGRAPH}
            progress={animatedProgress}
            className="font-sans text-[11px] sm:text-xs md:text-[13px] xl:text-[14px] text-white leading-[1.6] sm:leading-[1.65] lg:leading-[1.72] font-light mt-3 sm:mt-4 lg:mt-5 max-w-xl"
          />

          {/* Contact Button CTA */}
          <div className="mt-4 sm:mt-6">
            <a
              href="#contact"
              className="group inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border border-white/20 bg-white/[0.04] hover:bg-white hover:text-black font-mono text-[10px] sm:text-xs uppercase tracking-[0.16em] text-white transition-all duration-300 cursor-pointer shadow-sm"
            >
              <span>START A CONVERSATION</span>
              <span className="transform transition-transform group-hover:translate-x-1">→</span>
            </a>
          </div>
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
        className="relative z-10 pt-2 sm:pt-4 border-t border-white/15 flex-shrink-0"
        style={{ opacity: 1 }}
      >
        <div className="flex flex-wrap items-center gap-y-1 font-mono text-[9px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-[0.16em] text-white font-medium">
          <span className="hover:text-white transition-colors cursor-default">Brand Systems</span>
          <span className="text-white/40 mx-2 sm:mx-4 font-light select-none">|</span>
          <span className="hover:text-white transition-colors cursor-default">Experience Design</span>
          <span className="text-white/40 mx-2 sm:mx-4 font-light select-none">|</span>
          <span className="hover:text-white transition-colors cursor-default">Creative Campaigns</span>
          <span className="text-white/40 mx-2 sm:mx-4 font-light select-none">|</span>
          <span className="hover:text-white transition-colors cursor-default">Storytelling & Content</span>
          <span className="text-white/40 mx-2 sm:mx-4 font-light select-none">|</span>
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
