import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Reveal } from '../components/Reveal';
import CreativePhilosophy from './CreativePhilosophy';
import { heroReadinessCoordinator } from '../utils/assetPreloader';

export interface HeroSectionProps {
  isSiteLoaded?: boolean;
}

// Dark Mode Videos (Default)
const DARK_HERO_VIDEO_URL = '/videos/hero.mp4?v=5';
const DARK_INTRO_VIDEO_URL = '/videos/creature.mp4?v=3';

// Light Mode Videos
const LIGHT_HERO_VIDEO_URL = '/videos/Hero_White.mp4?v=5';
const LIGHT_INTRO_VIDEO_URL = '/videos/creature_White.mp4?v=3';

const SERVICES = [
  '/ CREATIVE DIRECTION',
  '/ BRAND IDENTITY & CAMPAIGNS',
  '/ EXPERIENTIAL & SPATIAL',
];

// Cinematic smoothstep interpolation helper
const smoothstep = (min: number, max: number, val: number) => {
  const x = Math.max(0, Math.min(1, (val - min) / (max - min)));
  return x * x * (3 - 2 * x);
};

// Cinematic cubic easing helper for natural acceleration and deceleration
const easeInOutCubic = (t: number) => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};


// Full vertical composition framing: preserves 100% of the vertical frame on all screens
// - Desktop & Mobile: Complete height visible; head, body, legs, feet, and lower scene details 100% intact
// - Zero vertical crop on top or bottom; horizontal framing centered to keep character large, immersive, and fully visible
const calculateDrawBounds = (
  canvasW: number,
  canvasH: number,
  imgW: number,
  imgH: number
) => {
  if (canvasW <= 0 || canvasH <= 0 || imgW <= 0 || imgH <= 0) {
    return { shiftX: 0, shiftY: 0, drawWidth: canvasW, drawHeight: canvasH };
  }

  // Preserve complete vertical frame: height fits canvasH exactly (zero vertical crop)
  const drawHeight = canvasH;
  const drawWidth = imgW * (canvasH / imgH);

  // Controlled horizontal framing: character is kept centered and fully visible
  // Sides crop horizontally as needed to adapt wider video to the viewport
  const shiftX = (canvasW - drawWidth) / 2;
  const shiftY = 0;

  return { shiftX, shiftY, drawWidth, drawHeight };
};

// Dedicated, zero-flicker frame renderer that directly paints over the canvas without clearing to transparent
const drawFrameToCanvas = (
  canvas: HTMLCanvasElement | null,
  frame: CanvasImageSource | undefined,
  isDarkTheme: boolean
) => {
  if (!canvas || !frame) return;

  // Auto-sync canvas internal resolution with CSS display dimensions to eliminate stretching in all viewports
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const clientW = canvas.clientWidth || window.innerWidth;
  const clientH = canvas.clientHeight || window.innerHeight;
  const expectedW = Math.round(clientW * dpr);
  const expectedH = Math.round(clientH * dpr);
  if (expectedW > 0 && expectedH > 0 && (canvas.width !== expectedW || canvas.height !== expectedH)) {
    canvas.width = expectedW;
    canvas.height = expectedH;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const fWidth = (frame as any).width || 1280;
  const fHeight = (frame as any).height || 720;
  const bounds = calculateDrawBounds(canvas.width, canvas.height, fWidth, fHeight);

  // Fill pillarbox side margins on ultra-wide monitors without wiping the active character display
  if (bounds.shiftX > 0) {
    ctx.fillStyle = isDarkTheme ? '#050505' : '#ffffff';
    ctx.fillRect(0, 0, bounds.shiftX, canvas.height);
    ctx.fillRect(bounds.shiftX + bounds.drawWidth, 0, canvas.width - (bounds.shiftX + bounds.drawWidth), canvas.height);
  }
  ctx.drawImage(frame, 0, 0, fWidth, fHeight, bounds.shiftX, bounds.shiftY, bounds.drawWidth, bounds.drawHeight);
};

// Safe seek helper ensuring valid frame boundaries (readyState >= 2, non-seeking, throttled)
const safeSeek = (v: HTMLVideoElement, time: number) => {
  if (!v || v.readyState < 2) return;
  if (v.seeking) return; // Prevent seek flooding while browser is already seeking
  const dur = v.duration;
  if (!dur || !isFinite(dur) || dur <= 0) return;
  const clampedTime = Math.max(0.01, Math.min(dur - 0.02, time));
  if (Math.abs(v.currentTime - clampedTime) < 0.015) return; // Skip micro changes
  try {
    v.currentTime = clampedTime;
  } catch {}
};

// Helper to detect handheld mobile devices (phones/tablets only, never desktop)
const isMobileDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 && 'ontouchend' in document);
};

export const HeroSection: React.FC<HeroSectionProps> = ({ isSiteLoaded = true }) => {
  const isSiteLoadedRef = useRef(isSiteLoaded);
  useEffect(() => {
    isSiteLoadedRef.current = isSiteLoaded;
  }, [isSiteLoaded]);

  // Visual Mood Theme: 'dark' (default) vs 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const isDark = theme === 'dark';

  const containerRef = useRef<HTMLDivElement>(null);

  // Video 2: Hero scroll-scrubbed layers (Dark & Light)
  const videoDarkRef = useRef<HTMLVideoElement>(null);
  const videoLightRef = useRef<HTMLVideoElement>(null);
  const heroCanvasDarkRef = useRef<HTMLCanvasElement>(null);
  const heroCanvasLightRef = useRef<HTMLCanvasElement>(null);
  const darkHeroFramesRef = useRef<CanvasImageSource[]>([]);
  const lightHeroFramesRef = useRef<CanvasImageSource[]>([]);
  const [isDarkHeroFramesReady, setIsDarkHeroFramesReady] = useState(false);
  const [isLightHeroFramesReady, setIsLightHeroFramesReady] = useState(false);

  // Queued Non-Interrupting Seek Refs for Hero
  const pendingDarkHeroTimeRef = useRef<number | null>(null);
  const pendingLightHeroTimeRef = useRef<number | null>(null);
  const isDarkHeroSeekingRef = useRef(false);
  const lastDarkHeroSeekTimeRef = useRef(0);
  const isLightHeroSeekingRef = useRef(false);
  const lastLightHeroSeekTimeRef = useRef(0);

  // Video 1: Intro creature hover layers (Dark & Light)
  const introContainerRef = useRef<HTMLDivElement>(null);
  const introVideoDarkRef = useRef<HTMLVideoElement>(null);
  const introVideoLightRef = useRef<HTMLVideoElement>(null);
  const introCanvasDarkRef = useRef<HTMLCanvasElement>(null);
  const introCanvasLightRef = useRef<HTMLCanvasElement>(null);
  const darkIntroFramesRef = useRef<CanvasImageSource[]>([]);
  const lightIntroFramesRef = useRef<CanvasImageSource[]>([]);
  const [isDarkIntroFramesReady, setIsDarkIntroFramesReady] = useState(false);
  const [isLightIntroFramesReady, setIsLightIntroFramesReady] = useState(false);

  // Queued Non-Interrupting Seek Refs for Creature Intro
  const pendingDarkIntroTimeRef = useRef<number | null>(null);
  const pendingLightIntroTimeRef = useRef<number | null>(null);
  const isDarkIntroSeekingRef = useRef(false);
  const lastDarkIntroSeekTimeRef = useRef(0);
  const isLightIntroSeekingRef = useRef(false);
  const lastLightIntroSeekTimeRef = useRef(0);

  // Hero Video Control State Machine: HOVER_ACTIVE | SCROLL_ACTIVE | TRANSITIONING
  type HeroState = 'HOVER_ACTIVE' | 'SCROLL_ACTIVE' | 'TRANSITIONING';

  const heroStateRef = useRef<HeroState>('HOVER_ACTIVE');
  const transitionDirectionRef = useRef<'TO_SCROLL' | 'TO_HOVER'>('TO_SCROLL');
  const rewindStartProgressRef = useRef(0);
  const rewindStartTimeRef = useRef(0);
  const rewindDurationRef = useRef(350);

  const returnStartTimeRef = useRef(0);
  const returnDurationRef = useRef(350);
  const returnTargetProgressRef = useRef(0.5);

  const latestMouseProgressRef = useRef(0.5);

  const introTargetProgressRef = useRef(0.5);
  const introSmoothedProgressRef = useRef(0.5);

  // iOS Safari Motion & Gyro Permission state (Mobile only)
  const [isMotionPermNeeded, setIsMotionPermNeeded] = useState(false);
  const [isMotionActive, setIsMotionActive] = useState(false);
  const isMotionActiveRef = useRef(false);
  const smoothedRollRef = useRef<number | null>(null);

  useEffect(() => {
    // Only check or request motion permissions on real mobile devices
    if (
      isMobileDevice() &&
      typeof window !== 'undefined' &&
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      setIsMotionPermNeeded(true);
    }
  }, []);

  // Direct DOM refs for buttery-smooth hardware-accelerated animations (zero React re-renders)
  const pushContainerRef = useRef<HTMLDivElement>(null);
  const topPromptRef = useRef<HTMLDivElement>(null);
  const statusCueRef = useRef<HTMLDivElement>(null);

  const headline1Ref = useRef<HTMLDivElement>(null);
  const headline2Ref = useRef<HTMLDivElement>(null);
  const supportTextRef = useRef<HTMLParagraphElement>(null);
  const rightTextRef = useRef<HTMLDivElement>(null);

  // Unified high-precision scroll tracking
  const rawScrollYRef = useRef(0);
  const smoothedScrollYRef = useRef(0);

  // Cached frame indexes to eliminate redundant canvas redraws when idle
  const lastDrawnDarkHeroFrameRef = useRef(-1);
  const lastDrawnLightHeroFrameRef = useRef(-1);
  const lastDrawnDarkIntroFrameRef = useRef(-1);
  const lastDrawnLightIntroFrameRef = useRef(-1);

  const darkHeroDurationRef = useRef(10.0);
  const lightHeroDurationRef = useRef(10.0);
  const darkIntroDurationRef = useRef(10.0);
  const lightIntroDurationRef = useRef(10.0);

  // Queued Non-Interrupting Seek Callbacks (consumed on seeked event)
  const handleDarkHeroSeeked = useCallback(() => {
    isDarkHeroSeekingRef.current = false;
    const v = videoDarkRef.current;
    if (v && pendingDarkHeroTimeRef.current !== null) {
      const nextTime = pendingDarkHeroTimeRef.current;
      pendingDarkHeroTimeRef.current = null;
      if (Math.abs(v.currentTime - nextTime) > 0.02) {
        isDarkHeroSeekingRef.current = true;
        lastDarkHeroSeekTimeRef.current = performance.now();
        safeSeek(v, nextTime);
      }
    }
  }, []);

  const handleLightHeroSeeked = useCallback(() => {
    isLightHeroSeekingRef.current = false;
    const v = videoLightRef.current;
    if (v && pendingLightHeroTimeRef.current !== null) {
      const nextTime = pendingLightHeroTimeRef.current;
      pendingLightHeroTimeRef.current = null;
      if (Math.abs(v.currentTime - nextTime) > 0.02) {
        isLightHeroSeekingRef.current = true;
        lastLightHeroSeekTimeRef.current = performance.now();
        safeSeek(v, nextTime);
      }
    }
  }, []);

  const handleDarkIntroSeeked = useCallback(() => {
    isDarkIntroSeekingRef.current = false;
    const v = introVideoDarkRef.current;
    if (v && pendingDarkIntroTimeRef.current !== null) {
      const nextTime = pendingDarkIntroTimeRef.current;
      pendingDarkIntroTimeRef.current = null;
      if (Math.abs(v.currentTime - nextTime) > 0.02) {
        isDarkIntroSeekingRef.current = true;
        lastDarkIntroSeekTimeRef.current = performance.now();
        safeSeek(v, nextTime);
      }
    }
  }, []);

  const handleLightIntroSeeked = useCallback(() => {
    isLightIntroSeekingRef.current = false;
    const v = introVideoLightRef.current;
    if (v && pendingLightIntroTimeRef.current !== null) {
      const nextTime = pendingLightIntroTimeRef.current;
      pendingLightIntroTimeRef.current = null;
      if (Math.abs(v.currentTime - nextTime) > 0.02) {
        isLightIntroSeekingRef.current = true;
        lastLightIntroSeekTimeRef.current = performance.now();
        safeSeek(v, nextTime);
      }
    }
  }, []);

  // Resize canvas to match container or window with DPR cap of 2
  const handleResize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = containerRef.current?.querySelector('.sticky');
    const width = parent && parent.clientWidth > 0 ? parent.clientWidth : window.innerWidth;
    const height = parent && parent.clientHeight > 0 ? parent.clientHeight : window.innerHeight;
    [introCanvasDarkRef, introCanvasLightRef, heroCanvasDarkRef, heroCanvasLightRef].forEach((ref) => {
      if (ref.current) {
        ref.current.width = width * dpr;
        ref.current.height = height * dpr;
      }
    });
    // Invalidate cached drawn frames to re-render at new dimensions
    lastDrawnDarkHeroFrameRef.current = -1;
    lastDrawnLightHeroFrameRef.current = -1;
    lastDrawnDarkIntroFrameRef.current = -1;
    lastDrawnLightIntroFrameRef.current = -1;
  };

  // Synchronous pre-paint resize to eliminate video and canvas stretching during initial load
  useLayoutEffect(() => {
    handleResize();
  }, []);


  // Lean passive scroll and resize listener strictly recording scroll and viewport changes
  useEffect(() => {
    const handleScroll = () => {
      if (!isSiteLoadedRef.current) return;
      const container = containerRef.current;
      if (!container) return;

      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      const trackTop = container.offsetTop;
      const trackHeight = container.offsetHeight - window.innerHeight;
      rawScrollYRef.current = Math.max(0, Math.min(trackHeight, scrollY - trackTop));
    };

    // Tab visibility recovery: restore canvas frames and re-check dimensions when user returns
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        lastDrawnDarkHeroFrameRef.current = -1;
        lastDrawnLightHeroFrameRef.current = -1;
        lastDrawnDarkIntroFrameRef.current = -1;
        lastDrawnLightIntroFrameRef.current = -1;
        handleResize();
        handleScroll();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    handleResize();
    handleScroll();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(() => {
        handleResize();
        handleScroll();
      });
      ro.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (ro) ro.disconnect();
    };
  }, []);

  // =========================================================================
  // Mobile Motion Controller: Strictly Left-to-Right Tilt Only
  // Mathematically isolates the horizontal roll axis using:
  //   roll = atan2(sin(gamma), cos(gamma) * sin(beta))
  // This completely decouples horizontal tilt from front-to-back pitch:
  // Tilting the phone forward/backward produces ZERO movement on the creature.
  // =========================================================================
  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (!isSiteLoadedRef.current) return;
    if (!isMobileDevice()) return;
    if (e.gamma === null || typeof e.gamma !== 'number') return;

    if (!isMotionActiveRef.current) {
      isMotionActiveRef.current = true;
      setIsMotionActive(true);
      setIsMotionPermNeeded(false);
    }

    let gamma = e.gamma;
    // Protect against 180° Euler angle inversion when leaning forward past vertical
    if (gamma > 90) gamma = 180 - gamma;
    else if (gamma < -90) gamma = -180 - gamma;

    // Extract roll angle in screen plane, decoupled from pitch (beta)
    const beta = e.beta !== null && typeof e.beta === 'number' ? e.beta : 70;
    const bRad = (beta * Math.PI) / 180;
    const gRad = (gamma * Math.PI) / 180;
    const sinB = Math.max(0.15, Math.sin(bRad));
    const rollRad = Math.atan2(Math.sin(gRad), Math.cos(gRad) * sinB);
    const rollDeg = (rollRad * 180) / Math.PI;

    // Initialize smoothing on first event to eliminate ramp-up lag
    if (smoothedRollRef.current === null) {
      smoothedRollRef.current = rollDeg;
    } else {
      // Exponential low-pass filter (0.22) eliminates hand tremors & sensor noise
      // while keeping creature head tracking fluid and responsive
      smoothedRollRef.current += (rollDeg - smoothedRollRef.current) * 0.22;
    }

    // Natural ergonomic tilt range: ±22° wrist tilt
    const maxRoll = 22.0;
    const clampedRoll = Math.max(-maxRoll, Math.min(maxRoll, smoothedRollRef.current));

    // Map strictly left-to-right:
    // Tilting phone left  (rollDeg < 0) -> 1.0 (creature looks left)
    // Upright             (rollDeg = 0) -> 0.5 (creature looks center)
    // Tilting phone right (rollDeg > 0) -> creature looks right
    const tiltNorm = 0.5 + clampedRoll / (maxRoll * 2.0);
    const clampedTilt = Math.max(0.001, Math.min(0.999, tiltNorm));
    latestMouseProgressRef.current = clampedTilt;
    if (heroStateRef.current === 'HOVER_ACTIVE') {
      introTargetProgressRef.current = clampedTilt;
    }
  }, []);

  // Request motion permission on iOS 13+ on user interaction
  const requestMotionPermission = useCallback(async () => {
    // Prime the video decoder synchronously inside user-gesture context
    if (introVideoDarkRef.current) {
      introVideoDarkRef.current.muted = true;
      const p = introVideoDarkRef.current.play();
      if (p !== undefined) {
        p.then(() => {
          introVideoDarkRef.current?.pause();
        }).catch(() => {});
      }
    }

    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const perm = await (DeviceOrientationEvent as any).requestPermission();
        if (perm === 'granted') {
          setIsMotionPermNeeded(false);
          window.addEventListener('deviceorientation', handleOrientation, { passive: true });
        } else {
          setIsMotionPermNeeded(false);
        }
      } catch (err) {
        console.warn('Motion permission request error:', err);
        setIsMotionPermNeeded(false);
      }
    } else {
      setIsMotionPermNeeded(false);
      window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    }
  }, [handleOrientation]);

  // Intro video controller: Mouse hover on Desktop, Device Motion (Gyroscope Tilt) on Mobile
  useEffect(() => {
    // Desktop mouse hover controller: mouseX / window.innerWidth (0 = first frame, 1 = last frame)
    const handleMouseMove = (e: MouseEvent) => {
      if (!isSiteLoadedRef.current) return;
      const norm = Math.max(0, Math.min(1, e.clientX / window.innerWidth));
      latestMouseProgressRef.current = norm;
      if (heroStateRef.current === 'HOVER_ACTIVE') {
        introTargetProgressRef.current = norm;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSiteLoadedRef.current) return;
      // If motion is actively streaming real tilt data, do not let touch drag conflict
      if (isMotionActiveRef.current) return;
      if (e.touches && e.touches.length > 0) {
        const norm = Math.max(0, Math.min(1, e.touches[0].clientX / window.innerWidth));
        latestMouseProgressRef.current = norm;
        if (heroStateRef.current === 'HOVER_ACTIVE') {
          introTargetProgressRef.current = norm;
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Standard mobile browsers (Android Chrome, etc.): listen directly on mount
    if (
      isMobileDevice() &&
      (typeof DeviceOrientationEvent === 'undefined' ||
        typeof (DeviceOrientationEvent as any).requestPermission !== 'function')
    ) {
      window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    }

    // iOS WebKit mobile: listen on touchend on mobile devices only
    if (isMobileDevice()) {
      window.addEventListener('touchend', requestMotionPermission, { passive: true });
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('touchend', requestMotionPermission);
    };
  }, [handleOrientation, requestMotionPermission]);

  // Media unlock & decoder priming for iOS Safari, WebKit, Gecko, and Blink
  useEffect(() => {
    const unlockVideos = () => {
      const videos = [
        introVideoDarkRef.current,
        videoDarkRef.current,
        introVideoLightRef.current,
        videoLightRef.current,
      ];
      videos.forEach((vid) => {
        if (!vid) return;
        vid.muted = true;
        vid.defaultMuted = true;
        vid.setAttribute('playsinline', '');
        vid.setAttribute('webkit-playsinline', '');
        vid.setAttribute('x5-playsinline', '');
        vid.setAttribute('muted', '');
        const p = vid.play();
        if (p !== undefined) {
          p.then(() => {
            vid.pause();
          }).catch(() => {});
        }
      });
    };

    unlockVideos();

    const unlockEvents: Array<keyof WindowEventMap> = [
      'touchstart',
      'pointerdown',
      'click',
      'wheel',
      'scroll',
      'keydown',
    ];
    unlockEvents.forEach((evt) => {
      window.addEventListener(evt, unlockVideos, { once: true, passive: true });
    });

    return () => {
      unlockEvents.forEach((evt) => {
        window.removeEventListener(evt, unlockVideos);
      });
    };
  }, [isDark]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('hero-theme-change', { detail: { isLight: !isDark } }));
  }, [isDark]);

  // Reusable frame extractor with progressive caching & fallback
  const extractFrames = async (
    videoUrl: string,
    targetFrames: number,
    targetRef: React.MutableRefObject<CanvasImageSource[]>,
    durationRefTarget: React.MutableRefObject<number>,
    setReady: (val: boolean) => void,
    isMounted: () => boolean
  ) => {
    if (targetRef.current.length >= targetFrames) return;
    try {
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
      offscreenVideo.src = videoUrl;

      // In iOS Safari / WebKit, elements with opacity:0 or 1px x 1px get power-throttled by the OS.
      // An invisible 16px element with 0.001 opacity guarantees full hardware decoder speed without visual bleed.
      offscreenVideo.style.position = 'fixed';
      offscreenVideo.style.top = '0';
      offscreenVideo.style.left = '0';
      offscreenVideo.style.opacity = '0.001';
      offscreenVideo.style.pointerEvents = 'none';
      offscreenVideo.style.zIndex = '-9999';
      offscreenVideo.style.width = '16px';
      offscreenVideo.style.height = '16px';
      document.body.appendChild(offscreenVideo);
      offscreenVideo.load();

      await new Promise<void>((resolve) => {
        const onMeta = () => {
          offscreenVideo.removeEventListener('loadedmetadata', onMeta);
          resolve();
        };
        if (offscreenVideo.readyState >= 1) {
          resolve();
        } else {
          offscreenVideo.addEventListener('loadedmetadata', onMeta);
          setTimeout(resolve, 3000);
        }
      });

      // Hardware decoder priming: start muted playback and pause immediately so frame 0 texture is in GPU buffer
      try {
        const playPromise = offscreenVideo.play();
        if (playPromise !== undefined) {
          await playPromise.catch(() => {});
          offscreenVideo.pause();
        }
      } catch {}

      const duration = offscreenVideo.duration || 10;
      durationRefTarget.current = duration;

      const vWidth = offscreenVideo.videoWidth || 1920;
      const vHeight = offscreenVideo.videoHeight || 1080;
      const isMobile = isMobileDevice();
      // On mobile devices, 720px width slashes memory by 70% while keeping retina sharpness.
      const maxW = isMobile ? 720 : 1280;
      const scale = Math.min(1, maxW / vWidth);
      const targetWidth = Math.round(vWidth * scale);
      const targetHeight = Math.round(vHeight * scale);

      const extractCanvas = document.createElement('canvas');
      extractCanvas.width = targetWidth;
      extractCanvas.height = targetHeight;
      const ctx = extractCanvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = isMobile ? 'medium' : 'high';
      }

      // Safe bounds: frame 0 starts at 0.01s (guaranteed valid first frame),
      // and frame N ends at duration - 0.02s (guaranteed final frame without EOF black flush).
      const safeStart = 0.01;
      const safeEnd = Math.max(safeStart + 0.5, duration - 0.02);

      const extracted: CanvasImageSource[] = [];
      for (let i = 0; i < targetFrames; i++) {
        if (!isMounted()) break;
        const targetTime = safeStart + (i / Math.max(1, targetFrames - 1)) * (safeEnd - safeStart);
        await new Promise<void>((resolve) => {
          let done = false;
          let tid: any = null;
          const finish = () => {
            if (done) return;
            done = true;
            clearTimeout(tid);
            // In Gecko / WebKit, requestAnimationFrame gives the compositor time to commit the decoded frame
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

        if (!isMounted()) break;

        if (ctx) {
          try {
            ctx.drawImage(offscreenVideo, 0, 0, targetWidth, targetHeight);
            // Persistent canvas elements: immune to ImageBitmap invalidation, survives React StrictMode & HMR
            const c = document.createElement('canvas');
            c.width = targetWidth;
            c.height = targetHeight;
            const cCtx = c.getContext('2d');
            if (cCtx) {
              cCtx.drawImage(extractCanvas, 0, 0);

              // Blank frame detection: ensure extracted frame has valid non-transparent pixels
              let isBlank = false;
              try {
                const sample = cCtx.getImageData(Math.round(targetWidth / 2), Math.round(targetHeight / 2), 1, 1).data;
                if (sample[3] === 0) {
                  isBlank = true;
                }
              } catch {}

              if (!isBlank) {
                extracted.push(c);
              } else if (extracted.length > 0) {
                // If a boundary seek produced an empty frame, clone the previous valid frame so zero blank frames exist
                const fallbackCanvas = document.createElement('canvas');
                fallbackCanvas.width = targetWidth;
                fallbackCanvas.height = targetHeight;
                const fbCtx = fallbackCanvas.getContext('2d');
                if (fbCtx) {
                  fbCtx.drawImage(extracted[extracted.length - 1], 0, 0);
                  extracted.push(fallbackCanvas);
                }
              }
            }
          } catch {}
        }

        // Progressive activation:
        // As soon as the very first frame is ready, immediately paint it onto the target canvas, then set ready
        if (isMounted() && extracted.length === 1) {
          targetRef.current = [...extracted];
          if (videoUrl === DARK_INTRO_VIDEO_URL) {
            drawFrameToCanvas(introCanvasDarkRef.current, extracted[0], true);
            lastDrawnDarkIntroFrameRef.current = 0;
            heroReadinessCoordinator.setVideo01Ready();
          } else if (videoUrl === DARK_HERO_VIDEO_URL) {
            drawFrameToCanvas(heroCanvasDarkRef.current, extracted[0], true);
            lastDrawnDarkHeroFrameRef.current = 0;
            heroReadinessCoordinator.setVideo02Ready();
          } else if (videoUrl === LIGHT_INTRO_VIDEO_URL) {
            drawFrameToCanvas(introCanvasLightRef.current, extracted[0], false);
            lastDrawnLightIntroFrameRef.current = 0;
          } else if (videoUrl === LIGHT_HERO_VIDEO_URL) {
            drawFrameToCanvas(heroCanvasLightRef.current, extracted[0], false);
            lastDrawnLightHeroFrameRef.current = 0;
          }
          setReady(true);
        } else if (isMounted() && extracted.length % 4 === 0) {
          targetRef.current = [...extracted];
          setReady(true);
        }
      }

      // Cleanup DOM video element & explicitly release OS decoder handles
      offscreenVideo.pause();
      offscreenVideo.removeAttribute('src');
      offscreenVideo.load();
      if (offscreenVideo.parentNode) {
        offscreenVideo.parentNode.removeChild(offscreenVideo);
      }

      // Complete sequence assignment
      if (isMounted() && extracted.length > 0) {
        targetRef.current = extracted;
        setReady(true);
        lastDrawnDarkHeroFrameRef.current = -1;
        lastDrawnDarkIntroFrameRef.current = -1;
      }
    } catch (err) {
      console.warn('Frame cache extraction fallback to video scrub:', videoUrl, err);
    }
  };

  // Preload and cache frames concurrently during loading screen
  useEffect(() => {
    let isMounted = true;
    const checkMounted = () => isMounted;

    const isMobile = isMobileDevice();

    const startExtraction = async () => {
      // 1. Dark Creature Intro (Video 01) and Dark Hero (Video 02): Extract concurrently
      const introPromise = extractFrames(
        DARK_INTRO_VIDEO_URL,
        isMobile ? 24 : 32,
        darkIntroFramesRef,
        darkIntroDurationRef,
        setIsDarkIntroFramesReady,
        checkMounted
      );

      const heroPromise = extractFrames(
        DARK_HERO_VIDEO_URL,
        isMobile ? 40 : 60,
        darkHeroFramesRef,
        darkHeroDurationRef,
        setIsDarkHeroFramesReady,
        checkMounted
      );

      // 2. Preload theme variants right away during loading screen (no waiting until hero appears)
      extractFrames(
        LIGHT_INTRO_VIDEO_URL,
        isMobile ? 20 : 28,
        lightIntroFramesRef,
        lightIntroDurationRef,
        setIsLightIntroFramesReady,
        checkMounted
      );

      extractFrames(
        LIGHT_HERO_VIDEO_URL,
        isMobile ? 32 : 48,
        lightHeroFramesRef,
        lightHeroDurationRef,
        setIsLightHeroFramesReady,
        checkMounted
      );

      await Promise.all([introPromise, heroPromise]);
    };

    startExtraction();

    return () => {
      isMounted = false;
    };
  }, []);

  // Unified 60fps/120fps Animation & Scrub Loop (Synchronizes Video, Canvas, Typography, and Downward Push)
  useEffect(() => {
    let animId: number;

    const render = () => {
      const rawScroll = rawScrollYRef.current;

      if (!isSiteLoadedRef.current) {
        smoothedScrollYRef.current = 0;
        animId = requestAnimationFrame(render);
        return;
      }

      const now = performance.now();

      // =======================================================================
      // HERO INTERACTION STATE MACHINE (STRICT CONTROL PRIORITY & SEAMLESS HANDOFF)
      // States: HOVER_ACTIVE | SCROLL_ACTIVE | TRANSITIONING
      // Page load: Default state = HOVER_ACTIVE
      // =======================================================================

      if (heroStateRef.current === 'HOVER_ACTIVE') {
        if (rawScroll > 4) {
          // Scroll begins:
          // 1. Detect the current frame position of VIDEO 01
          // 2. Freeze the current hover-controlled frame
          // 3. Move VIDEO 01 rapidly back to frame 0 (disable hover, keep visible, don't switch yet)
          heroStateRef.current = 'TRANSITIONING';
          transitionDirectionRef.current = 'TO_SCROLL';
          rewindStartProgressRef.current = introSmoothedProgressRef.current;
          rewindStartTimeRef.current = now;
          const dist = Math.abs(rewindStartProgressRef.current);
          rewindDurationRef.current = Math.round(140 + Math.max(0.1, dist) * 110);
        } else {
          // Locked at top: only mouse movement controls VIDEO 01
          smoothedScrollYRef.current = 0;
          const diff = introTargetProgressRef.current - introSmoothedProgressRef.current;
          const absDiff = Math.abs(diff);
          const lerpFactor = 0.22 + 0.14 * Math.min(1.0, absDiff / 0.3);
          introSmoothedProgressRef.current += diff * lerpFactor;
          if (absDiff < 0.0002) {
            introSmoothedProgressRef.current = introTargetProgressRef.current;
          }
        }
      } else if (heroStateRef.current === 'TRANSITIONING') {
        // Hold scroll locked at 0 during transition so VIDEO 02 stays at matching frame 0
        smoothedScrollYRef.current = 0;

        if (transitionDirectionRef.current === 'TO_SCROLL') {
          // Rapid rewind back to frame 0
          const elapsed = now - rewindStartTimeRef.current;
          const duration = Math.max(80, rewindDurationRef.current);
          const progress = Math.min(1.0, elapsed / duration);
          const eased = easeInOutCubic(progress);

          introSmoothedProgressRef.current = rewindStartProgressRef.current * (1 - eased);

          // Reversal interrupt: If user cancelled scroll and returned to absolute top before reaching frame 0:
          if (rawScroll <= 0 && progress < 1.0) {
            transitionDirectionRef.current = 'TO_HOVER';
            returnStartTimeRef.current = now;
            returnTargetProgressRef.current = latestMouseProgressRef.current;
            const returnDist = Math.abs(returnTargetProgressRef.current - introSmoothedProgressRef.current);
            returnDurationRef.current = Math.round(140 + Math.max(0.1, returnDist) * 110);
          } else if (progress >= 1.0) {
            // 4. When VIDEO 01 reaches exactly frame 0:
            introSmoothedProgressRef.current = 0;
            introTargetProgressRef.current = 0;

            // Synchronize currentTime on both videos before switching (0.02s avoids keyframe stall)
            if (introVideoDarkRef.current) safeSeek(introVideoDarkRef.current, 0.02);
            if (introVideoLightRef.current) safeSeek(introVideoLightRef.current, 0.02);
            if (videoDarkRef.current) safeSeek(videoDarkRef.current, 0.02);
            if (videoLightRef.current) safeSeek(videoLightRef.current, 0.02);

            // Synchronously pre-draw frame 0 onto VIDEO 02 BEFORE hiding VIDEO 01 to eliminate any 1-frame blank gap
            if (isDark && darkHeroFramesRef.current[0]) {
              drawFrameToCanvas(heroCanvasDarkRef.current, darkHeroFramesRef.current[0], true);
              lastDrawnDarkHeroFrameRef.current = 0;
            } else if (!isDark && lightHeroFramesRef.current[0]) {
              drawFrameToCanvas(heroCanvasLightRef.current, lightHeroFramesRef.current[0], false);
              lastDrawnLightHeroFrameRef.current = 0;
            }

            lastDrawnDarkIntroFrameRef.current = 0;
            lastDrawnLightIntroFrameRef.current = 0;

            // Immediately switch control to VIDEO 02 in the exact same animation frame (zero delay handoff)
            heroStateRef.current = 'SCROLL_ACTIVE';
            if (introContainerRef.current) {
              introContainerRef.current.style.visibility = 'hidden';
            }
          }
        } else if (transitionDirectionRef.current === 'TO_HOVER') {
          // Reverse scroll transition: scrub from frame 0 to current mouse position
          if (rawScroll > 4) {
            transitionDirectionRef.current = 'TO_SCROLL';
            rewindStartProgressRef.current = introSmoothedProgressRef.current;
            rewindStartTimeRef.current = now;
            const dist = Math.abs(rewindStartProgressRef.current);
            rewindDurationRef.current = Math.round(140 + Math.max(0.1, dist) * 110);
          } else {
            const target = latestMouseProgressRef.current;
            returnTargetProgressRef.current = target;

            const elapsed = now - returnStartTimeRef.current;
            const duration = Math.max(80, returnDurationRef.current);
            const progress = Math.min(1.0, elapsed / duration);
            const eased = easeInOutCubic(progress);

            introSmoothedProgressRef.current = target * eased;

            if (progress >= 1.0) {
              // Once VIDEO 01 reaches the correct cursor frame: restore hover control
              introSmoothedProgressRef.current = target;
              introTargetProgressRef.current = target;
              heroStateRef.current = 'HOVER_ACTIVE';
            }
          }
        }
      } else if (heroStateRef.current === 'SCROLL_ACTIVE') {
        // Continuous, silky smooth scroll scrub interpolation with natural inertia
        const targetScroll = rawScrollYRef.current;
        const scrollDelta = targetScroll - smoothedScrollYRef.current;
        const absDelta = Math.abs(scrollDelta);
        // Continuous velocity-adaptive damping: smooth micro-scrolls and immediate responsive fast scrubs
        const lerpFactor = 0.32 + 0.20 * Math.min(1.0, absDelta / 150);
        smoothedScrollYRef.current += scrollDelta * lerpFactor;
        if (absDelta < 0.05) {
          smoothedScrollYRef.current = targetScroll;
        }

        // REVERSE SCROLL: When scrolling back upward and VIDEO 02 reaches the beginning frame (scroll reaches 0):
        if (rawScroll <= 0 && smoothedScrollYRef.current <= 2) {
          smoothedScrollYRef.current = 0;

          // Synchronize: both videos at matching frame (0.02s)
          if (videoDarkRef.current) safeSeek(videoDarkRef.current, 0.02);
          if (videoLightRef.current) safeSeek(videoLightRef.current, 0.02);
          if (introVideoDarkRef.current) safeSeek(introVideoDarkRef.current, 0.02);
          if (introVideoLightRef.current) safeSeek(introVideoLightRef.current, 0.02);

          // Synchronously pre-draw frame 0 onto VIDEO 01 BEFORE making it visible
          if (isDark && darkIntroFramesRef.current[0]) {
            drawFrameToCanvas(introCanvasDarkRef.current, darkIntroFramesRef.current[0], true);
            lastDrawnDarkIntroFrameRef.current = 0;
          } else if (!isDark && lightIntroFramesRef.current[0]) {
            drawFrameToCanvas(introCanvasLightRef.current, lightIntroFramesRef.current[0], false);
            lastDrawnLightIntroFrameRef.current = 0;
          }

          lastDrawnDarkHeroFrameRef.current = 0;
          lastDrawnLightHeroFrameRef.current = 0;

          // VIDEO 01 appears at frame 0
          introSmoothedProgressRef.current = 0;
          if (introContainerRef.current) {
            introContainerRef.current.style.visibility = 'visible';
          }

          // State becomes TRANSITIONING towards HOVER_ACTIVE
          heroStateRef.current = 'TRANSITIONING';
          transitionDirectionRef.current = 'TO_HOVER';
          returnStartTimeRef.current = now;
          returnTargetProgressRef.current = latestMouseProgressRef.current;
          const returnDist = Math.abs(returnTargetProgressRef.current);
          returnDurationRef.current = Math.round(140 + Math.max(0.1, returnDist) * 110);
        }
      }

      const s = smoothedScrollYRef.current;

      // =======================================================================
      // LAYER VISIBILITY (ZERO OPACITY MANIPULATION, NO BLENDING)
      // =======================================================================
      if (heroStateRef.current === 'SCROLL_ACTIVE') {
        if (introVideoDarkRef.current && !introVideoDarkRef.current.paused) introVideoDarkRef.current.pause();
        if (introVideoLightRef.current && !introVideoLightRef.current.paused) introVideoLightRef.current.pause();
        if (introContainerRef.current) {
          introContainerRef.current.style.visibility = 'hidden';
          introContainerRef.current.style.pointerEvents = 'none';
        }
      } else {
        if (introContainerRef.current) {
          introContainerRef.current.style.visibility = 'visible';
          introContainerRef.current.style.pointerEvents = heroStateRef.current === 'HOVER_ACTIVE' ? 'auto' : 'none';
        }
      }

      // Top prompt visibility (only at top during hover)
      if (topPromptRef.current) {
        const showTop = heroStateRef.current === 'HOVER_ACTIVE' && s <= 15;
        topPromptRef.current.style.opacity = showTop ? '1' : '0';
        topPromptRef.current.style.pointerEvents = showTop ? 'auto' : 'none';
      }

      // Status cue visibility (freeze stage 1200px -> 1350px)
      if (statusCueRef.current) {
        const showCue = s >= 1200 && s < 1350;
        statusCueRef.current.style.opacity = showCue ? '1' : '0';
      }

      // =======================================================================
      // VIDEO 1 (CREATURE INTRO) EXPLORE / HOVER RENDERING
      // Active whenever heroState is NOT SCROLL_ACTIVE
      // =======================================================================
      if (heroStateRef.current !== 'SCROLL_ACTIVE') {
        const introProgress = introSmoothedProgressRef.current;

        // Dark Creature:
        if (introCanvasDarkRef.current && darkIntroFramesRef.current.length > 0) {
          const darkFrames = darkIntroFramesRef.current;
          const frameIndex = Math.min(
            darkFrames.length - 1,
            Math.max(0, Math.round(introProgress * (darkFrames.length - 1)))
          );
          if (frameIndex !== lastDrawnDarkIntroFrameRef.current) {
            lastDrawnDarkIntroFrameRef.current = frameIndex;
            drawFrameToCanvas(introCanvasDarkRef.current, darkFrames[frameIndex], true);
          }
        } else if (introVideoDarkRef.current && darkIntroDurationRef.current > 0) {
          const v = introVideoDarkRef.current;
          const dur = darkIntroDurationRef.current;
          const targetTime = 0.01 + introProgress * (dur - 0.03);
          if (Math.abs(v.currentTime - targetTime) > 0.02) {
            const isStuck = isDarkIntroSeekingRef.current && (now - lastDarkIntroSeekTimeRef.current > 500);
            if (v.seeking && !isStuck) {
              pendingDarkIntroTimeRef.current = targetTime;
            } else {
              isDarkIntroSeekingRef.current = true;
              lastDarkIntroSeekTimeRef.current = now;
              safeSeek(v, targetTime);
            }
          }
        }

        // Light Creature:
        if (introCanvasLightRef.current && lightIntroFramesRef.current.length > 0) {
          const lightFrames = lightIntroFramesRef.current;
          const frameIndex = Math.min(
            lightFrames.length - 1,
            Math.max(0, Math.round(introProgress * (lightFrames.length - 1)))
          );
          if (frameIndex !== lastDrawnLightIntroFrameRef.current) {
            lastDrawnLightIntroFrameRef.current = frameIndex;
            drawFrameToCanvas(introCanvasLightRef.current, lightFrames[frameIndex], false);
          }
        } else if (introVideoLightRef.current && lightIntroDurationRef.current > 0) {
          const v = introVideoLightRef.current;
          const dur = lightIntroDurationRef.current;
          const targetTime = 0.01 + introProgress * (dur - 0.03);
          if (Math.abs(v.currentTime - targetTime) > 0.02) {
            const isStuck = isLightIntroSeekingRef.current && (now - lastLightIntroSeekTimeRef.current > 500);
            if (v.seeking && !isStuck) {
              pendingLightIntroTimeRef.current = targetTime;
            } else {
              isLightIntroSeekingRef.current = true;
              lastLightIntroSeekTimeRef.current = now;
              safeSeek(v, targetTime);
            }
          }
        }
      }

      // =======================================================================
      // VIDEO 2 (HERO VIDEO) SCROLL SCRUBBING (0px -> HERO_SCRUB_DISTANCE px)
      // Fast, high-responsiveness scrubbing covering 100% of video duration
      // =======================================================================
      const HERO_SCRUB_DISTANCE = 1200;
      const heroProgress = heroStateRef.current === 'SCROLL_ACTIVE' ? Math.min(1.0, Math.max(0, s / HERO_SCRUB_DISTANCE)) : 0;

      // Dark Hero Video / Canvas:
      if (heroCanvasDarkRef.current && darkHeroFramesRef.current.length > 0) {
        const darkFrames = darkHeroFramesRef.current;
        const frameIndex = Math.min(
          darkFrames.length - 1,
          Math.max(0, Math.round(heroProgress * (darkFrames.length - 1)))
        );
        if (frameIndex !== lastDrawnDarkHeroFrameRef.current) {
          lastDrawnDarkHeroFrameRef.current = frameIndex;
          drawFrameToCanvas(heroCanvasDarkRef.current, darkFrames[frameIndex], true);
        }
      } else if (videoDarkRef.current && darkHeroDurationRef.current > 0) {
        const v = videoDarkRef.current;
        const dur = darkHeroDurationRef.current;
        const targetTime = 0.01 + heroProgress * (dur - 0.03);
        if (Math.abs(v.currentTime - targetTime) > 0.02) {
          const isStuck = isDarkHeroSeekingRef.current && (now - lastDarkHeroSeekTimeRef.current > 500);
          if (v.seeking && !isStuck) {
            pendingDarkHeroTimeRef.current = targetTime;
          } else {
            isDarkHeroSeekingRef.current = true;
            lastDarkHeroSeekTimeRef.current = now;
            safeSeek(v, targetTime);
          }
        }
      }

      // Light Hero Video / Canvas:
      if (heroCanvasLightRef.current && lightHeroFramesRef.current.length > 0) {
        const lightFrames = lightHeroFramesRef.current;
        const frameIndex = Math.min(
          lightFrames.length - 1,
          Math.max(0, Math.round(heroProgress * (lightFrames.length - 1)))
        );
        if (frameIndex !== lastDrawnLightHeroFrameRef.current) {
          lastDrawnLightHeroFrameRef.current = frameIndex;
          drawFrameToCanvas(heroCanvasLightRef.current, lightFrames[frameIndex], false);
        }
      } else if (videoLightRef.current && lightHeroDurationRef.current > 0) {
        const v = videoLightRef.current;
        const dur = lightHeroDurationRef.current;
        const targetTime = 0.01 + heroProgress * (dur - 0.03);
        if (Math.abs(v.currentTime - targetTime) > 0.02) {
          const isStuck = isLightHeroSeekingRef.current && (now - lastLightHeroSeekTimeRef.current > 500);
          if (v.seeking && !isStuck) {
            pendingLightHeroTimeRef.current = targetTime;
          } else {
            isLightHeroSeekingRef.current = true;
            lastLightHeroSeekTimeRef.current = now;
            safeSeek(v, targetTime);
          }
        }
      }

      // =======================================================================
      // TYPOGRAPHY EVOLUTION (PROPORTIONALLY SCALED TO 1200px SCRUB)
      // =======================================================================
      // Headline 1: moves upward (0px -> -22px) and fades out (1.0 -> 0.0) between 100px and 450px
      const f1 = smoothstep(100, 450, s);
      const h1Y = -f1 * 22;
      const h1Op = 1 - f1;

      // Headline 2: rises from below (+35px -> 0px) and fades in (0.0 -> 1.0) between 400px and 800px
      const f2 = smoothstep(400, 800, s);
      const h2Y = (1 - f2) * 35;
      const h2Op = f2;

      // Supporting text: emerges gently (15px -> 0px, 0.0 -> 1.0) between 650px and 1050px
      const fSup = smoothstep(650, 1050, s);
      const supY = (1 - fSup) * 15;
      const supOp = fSup;

      // Right column subtle parallax lift (0px -> -20px) across entire 1200px scrub
      const rightProgress = Math.min(1.0, Math.max(0, s / 1200));
      const rightY = -rightProgress * 20;

      if (headline1Ref.current) {
        headline1Ref.current.style.transform = `translate3d(0, ${h1Y.toFixed(2)}px, 0)`;
        headline1Ref.current.style.opacity = h1Op.toFixed(3);
        headline1Ref.current.style.pointerEvents = h1Op > 0.05 ? 'auto' : 'none';
      }
      if (headline2Ref.current) {
        headline2Ref.current.style.transform = `translate3d(0, ${h2Y.toFixed(2)}px, 0)`;
        headline2Ref.current.style.opacity = h2Op.toFixed(3);
        headline2Ref.current.style.pointerEvents = h2Op > 0.05 ? 'auto' : 'none';
      }
      if (supportTextRef.current) {
        supportTextRef.current.style.transform = `translate3d(0, ${supY.toFixed(2)}px, 0)`;
        supportTextRef.current.style.opacity = supOp.toFixed(3);
      }
      if (rightTextRef.current) {
        rightTextRef.current.style.transform = `translate3d(0, ${rightY.toFixed(2)}px, 0)`;
      }

      // =======================================================================
      // DOWNWARD PUSH TRANSITION (1350px -> 1850px)
      // =======================================================================
      const pushStart = 1350;
      const pushEnd = 1850;
      let push = 0;
      if (s > pushStart) {
        push = Math.min(1.0, (s - pushStart) / (pushEnd - pushStart));
      }
      const easedPush =
        push < 0.5
          ? 4 * push * push * push
          : 1 - Math.pow(-2 * push + 2, 3) / 2;

      if (pushContainerRef.current) {
        pushContainerRef.current.style.transform = `translate3d(0, calc(-100vh + ${(easedPush * 100).toFixed(3)}vh), 0)`;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isDark]);

  return (
    /* Outer Pinned Scroll Track: Controls Video Scrubbing (Phase 1), Text Storytelling (Phase 2), and Downward Push (Phase 3) */
    <div
      ref={containerRef}
      data-hero-container="true"
      className="relative w-full"
      style={{
        height: 'calc(100vh + 3250px)',
        opacity: isSiteLoaded ? 1 : 0,
        pointerEvents: isSiteLoaded ? 'auto' : 'none',
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Sticky Viewport Stage: Pinned at top: 0 during Phase 1, 2, and 3 */}
      <div
        className={`sticky top-0 h-screen h-[100dvh] w-full overflow-hidden transition-colors duration-700 ${
          isDark ? 'bg-[#050505]' : 'bg-[#FFFFFF]'
        }`}
      >
        {/* =========================================================================
            VERTICAL PHYSICAL STACK (200vh total):
            [ TOP 100vh ]:    ABOUT SECTION (appears first from above)
            --------------------------------------------------------
            [ BOTTOM 100vh ]: FINAL VIDEO FRAME (moves downward and leaves viewport)
            
            Initial position:
              translateY: -100vh -> Bottom 100vh (Video) fills the viewport.
            As downward push advances (0 -> 1):
              translateY: calc(-100vh + (easedPush * 100vh)).
              Video moves DOWNWARD out through the bottom.
              About section moves DOWNWARD into the viewport from above.
            At downward push completion:
              translateY: 0vh -> About section fills the viewport.
              Video is at +100vh (completely exited viewport).
           ========================================================================= */}
        <div
          ref={pushContainerRef}
          className="relative w-full will-change-transform"
          style={{
            height: '200vh',
            transform: 'translate3d(0, -100vh, 0)',
          }}
        >
          {/* =====================================================================
              TOP SECTION (100vh): CREATIVE PHILOSOPHY (Appears Above Video)
             ===================================================================== */}
          <div className="relative h-screen h-[100dvh] w-full overflow-hidden bg-[#050505]">
            <CreativePhilosophy isHeroIntegrated={true} />
          </div>

          {/* =====================================================================
              PHYSICAL DIVIDER LINE (Between Philosophy Section and Final Video Frame)
             ===================================================================== */}
          <div
            className={`w-full h-[1px] transition-colors duration-700 ${
              isDark ? 'bg-white/[0.15]' : 'bg-black/[0.1]'
            }`}
          />

          {/* =====================================================================
              BOTTOM SECTION (100vh): FINAL VIDEO FRAME & HERO
              (Moves downward with user scroll and leaves the viewport at bottom)
             ===================================================================== */}
          <div
            data-hero-stage="true"
            data-hero-light={!isDark ? 'true' : undefined}
            className={`relative h-screen h-[100dvh] w-full overflow-hidden flex flex-col justify-between pt-12 sm:pt-16 md:pt-20 pb-4 sm:pb-8 md:pb-12 md:px-14 lg:px-16 transition-colors duration-700 ${
              isDark ? 'bg-[#050505] text-white' : 'bg-[#FFFFFF] text-[#3A3A3A]'
            }`}
          >
            {/* Mobile Top Row: Meta Header */}
            <div className="md:hidden flex items-center justify-between pointer-events-auto px-1 pb-1">
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.2em] font-medium transition-colors duration-600 ${
                  isDark ? 'text-white' : 'text-[#555555]'
                }`}
              >
                DUBAI • 2026
              </span>
              <span
                className={`font-mono text-[9px] uppercase tracking-[0.2em] font-medium transition-colors duration-600 ${
                  isDark ? 'text-white' : 'text-[#777777]'
                }`}
              >
                STUDIO DIRECTING
              </span>
            </div>

            {/* Top Row: Meta Header (Desktop only) */}
            <div className="hidden md:flex items-start justify-between pointer-events-auto px-5 sm:px-8 md:px-0">
              {/* Left: Service List */}
              <div className="flex flex-col gap-2">
                {SERVICES.map((service, index) => (
                  <Reveal key={service} delay={100 + index * 100}>
                    <div
                      className={`font-mono text-[11px] uppercase tracking-[0.2em] font-medium transition-colors duration-600 ${
                        isDark ? 'text-white' : 'text-[#555555]'
                      }`}
                    >
                      {service}
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* Right: Meta Location */}
              <Reveal delay={200}>
                <div className="text-right flex flex-col items-end gap-1">
                  <span
                    className={`font-mono text-[11px] uppercase tracking-[0.2em] font-medium transition-colors duration-600 ${
                      isDark ? 'text-white' : 'text-[#555555]'
                    }`}
                  >
                    DIRECTING GLOBALLY
                  </span>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.16em] transition-colors duration-600 ${
                      isDark ? 'text-white' : 'text-[#777777]'
                    }`}
                  >
                    DUBAI • STUDIO 2026
                  </span>
                </div>
              </Reveal>
            </div>

            {/* =====================================================================
                VIDEO STAGE WRAPPER:
                Dual-track 700ms crossfade between Dark and Light mode videos.
                Zero vertical crop: height fits 100% of container.
               ===================================================================== */}
            <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none rounded-none">
              {/* Background Video / Canvas Stage (Video 2: Hero scroll-scrub) */}
              <div className="absolute inset-0 overflow-hidden">
                {/* Dark Hero Video Track */}
                <div
                  className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                  style={{ opacity: isDark ? 1 : 0 }}
                >
                  <video
                    ref={videoDarkRef}
                    muted
                    defaultMuted
                    playsInline
                    {...({ 'webkit-playsinline': '', 'playsinline': '', 'x5-playsinline': '' } as any)}
                    preload="auto"
                    autoPlay={false}
                    loop={false}
                    controls={false}
                    disablePictureInPicture
                    disableRemotePlayback
                    onLoadedMetadata={(e) => {
                      if (e.currentTarget.duration) darkHeroDurationRef.current = e.currentTarget.duration;
                      if (e.currentTarget.readyState >= 2) {
                        heroReadinessCoordinator.setVideo02Ready();
                      }
                    }}
                    onLoadedData={(e) => {
                      if (e.currentTarget.duration) darkHeroDurationRef.current = e.currentTarget.duration;
                      if (e.currentTarget.readyState >= 2) {
                        heroReadinessCoordinator.setVideo02Ready();
                      }
                    }}
                    onCanPlay={(e) => {
                      if (e.currentTarget.readyState >= 2) {
                        heroReadinessCoordinator.setVideo02Ready();
                      }
                    }}
                    onCanPlayThrough={(e) => {
                      if (e.currentTarget.readyState >= 2) {
                        heroReadinessCoordinator.setVideo02Ready();
                      }
                    }}
                    onSeeked={handleDarkHeroSeeked}
                    className={`absolute top-0 left-1/2 -translate-x-1/2 h-full w-auto aspect-[16/9] max-w-none object-cover pointer-events-none transform-gpu will-change-transform ${
                      isDarkHeroFramesReady ? 'opacity-0' : 'opacity-100'
                    }`}
                    style={{ height: '100%', width: 'auto', aspectRatio: '16 / 9', objectFit: 'cover' }}
                  >
                    <source src={DARK_HERO_VIDEO_URL} type="video/mp4" />
                  </video>
                  <canvas
                    ref={heroCanvasDarkRef}
                    className="absolute inset-0 w-full h-full opacity-100 pointer-events-none"
                  />
                </div>

                {/* Light Hero Video Track */}
                <div
                  className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                  style={{ opacity: !isDark ? 1 : 0 }}
                >
                  <video
                    ref={videoLightRef}
                    muted
                    defaultMuted
                    playsInline
                    {...({ 'webkit-playsinline': '', 'playsinline': '', 'x5-playsinline': '' } as any)}
                    preload="auto"
                    autoPlay={false}
                    loop={false}
                    controls={false}
                    disablePictureInPicture
                    disableRemotePlayback
                    onLoadedMetadata={(e) => {
                      if (e.currentTarget.duration) lightHeroDurationRef.current = e.currentTarget.duration;
                    }}
                    onLoadedData={(e) => {
                      if (e.currentTarget.duration) lightHeroDurationRef.current = e.currentTarget.duration;
                    }}
                    onSeeked={handleLightHeroSeeked}
                    className={`absolute top-0 left-1/2 -translate-x-1/2 h-full w-auto aspect-[16/9] max-w-none object-cover pointer-events-none transform-gpu will-change-transform ${
                      isLightHeroFramesReady ? 'opacity-0' : 'opacity-100'
                    }`}
                    style={{ height: '100%', width: 'auto', aspectRatio: '16 / 9', objectFit: 'cover' }}
                  >
                    <source src={LIGHT_HERO_VIDEO_URL} type="video/mp4" />
                  </video>
                  <canvas
                    ref={heroCanvasLightRef}
                    className="absolute inset-0 w-full h-full opacity-100 pointer-events-none"
                  />
                </div>
              </div>

              {/* Video 1 (Intro Hover Video Layer: Creature) */}
              <div
                ref={introContainerRef}
                className="absolute inset-0 z-[5] overflow-hidden pointer-events-none"
                style={{ visibility: 'visible' }}
              >
                {/* Dark Creature Track */}
                <div
                  className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                  style={{ opacity: isDark ? 1 : 0 }}
                >
                  <video
                    ref={introVideoDarkRef}
                    muted
                    defaultMuted
                    playsInline
                    {...({ 'webkit-playsinline': '', 'playsinline': '', 'x5-playsinline': '' } as any)}
                    preload="auto"
                    autoPlay={false}
                    loop={false}
                    controls={false}
                    disablePictureInPicture
                    disableRemotePlayback
                    onLoadedMetadata={(e) => {
                      if (e.currentTarget.duration) darkIntroDurationRef.current = e.currentTarget.duration;
                      if (e.currentTarget.readyState >= 2) {
                        heroReadinessCoordinator.setVideo01Ready();
                      }
                    }}
                    onLoadedData={(e) => {
                      if (e.currentTarget.duration) darkIntroDurationRef.current = e.currentTarget.duration;
                      if (e.currentTarget.readyState >= 2) {
                        heroReadinessCoordinator.setVideo01Ready();
                      }
                    }}
                    onCanPlay={(e) => {
                      if (e.currentTarget.readyState >= 2) {
                        heroReadinessCoordinator.setVideo01Ready();
                      }
                    }}
                    onCanPlayThrough={(e) => {
                      if (e.currentTarget.readyState >= 2) {
                        heroReadinessCoordinator.setVideo01Ready();
                      }
                    }}
                    onSeeked={handleDarkIntroSeeked}
                    className={`absolute top-0 left-1/2 -translate-x-1/2 h-full w-auto aspect-[16/9] max-w-none object-cover pointer-events-none transform-gpu will-change-transform ${
                      isDarkIntroFramesReady ? 'opacity-0' : 'opacity-100'
                    }`}
                    style={{ height: '100%', width: 'auto', aspectRatio: '16 / 9', objectFit: 'cover' }}
                  >
                    <source src={DARK_INTRO_VIDEO_URL} type="video/mp4" />
                  </video>
                  <canvas
                    ref={introCanvasDarkRef}
                    className="absolute inset-0 w-full h-full opacity-100 pointer-events-none"
                  />
                </div>

                {/* Light Creature Track */}
                <div
                  className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                  style={{ opacity: !isDark ? 1 : 0 }}
                >
                  <video
                    ref={introVideoLightRef}
                    muted
                    defaultMuted
                    playsInline
                    {...({ 'webkit-playsinline': '', 'playsinline': '', 'x5-playsinline': '' } as any)}
                    preload="auto"
                    autoPlay={false}
                    loop={false}
                    controls={false}
                    disablePictureInPicture
                    disableRemotePlayback
                    onLoadedMetadata={(e) => {
                      if (e.currentTarget.duration) lightIntroDurationRef.current = e.currentTarget.duration;
                    }}
                    onLoadedData={(e) => {
                      if (e.currentTarget.duration) lightIntroDurationRef.current = e.currentTarget.duration;
                    }}
                    onSeeked={handleLightIntroSeeked}
                    className={`absolute top-0 left-1/2 -translate-x-1/2 h-full w-auto aspect-[16/9] max-w-none object-cover pointer-events-none transform-gpu will-change-transform ${
                      isLightIntroFramesReady ? 'opacity-0' : 'opacity-100'
                    }`}
                    style={{ height: '100%', width: 'auto', aspectRatio: '16 / 9', objectFit: 'cover' }}
                  >
                    <source src={LIGHT_INTRO_VIDEO_URL} type="video/mp4" />
                  </video>
                  <canvas
                    ref={introCanvasLightRef}
                    className="absolute inset-0 w-full h-full opacity-100 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* =====================================================================
                EDITORIAL CONTENT AREA:
                On mobile: Floats over the bottom ~20-30% of the full-height video.
                On desktop: Bilateral editorial spread framing outside/around the center character.
               ===================================================================== */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between w-full mt-auto pt-1 md:pt-10 pointer-events-auto px-5 sm:px-8 md:px-0 pb-16 sm:pb-20 md:pb-0">
              {/* Subtle contrast mask on mobile to ensure crisp typography readability over character's lower area */}
              <div
                className={`md:hidden absolute -inset-x-5 -bottom-6 h-64 pointer-events-none -z-10 transition-opacity duration-700 ${
                  isDark
                    ? 'bg-gradient-to-t from-[#050505]/95 via-[#050505]/65 to-transparent'
                    : 'bg-gradient-to-t from-white/95 via-white/65 to-transparent'
                }`}
              />

              {/* LEFT SIDE: CREATIVE PHILOSOPHY & STORYTELLING EVOLUTION */}
              <div className="flex flex-col items-start max-w-xl xl:max-w-2xl w-full">
                <Reveal delay={150}>
                  <div className="flex flex-col items-start w-full">
                    {/* Headline Stage: Exact same position for outgoing and incoming text */}
                    <div className="relative grid grid-cols-1 grid-rows-1 items-start min-h-[75px] sm:min-h-[100px] md:min-h-[160px] w-full">
                      {/* INITIAL HEADLINE: Moves upward into space beneath label & fades out */}
                      <div
                        ref={headline1Ref}
                        className="col-start-1 row-start-1 flex flex-col items-start will-change-transform"
                        style={{
                          opacity: 1,
                          transform: 'translate3d(0, 0px, 0)',
                        }}
                      >
                        <h1
                          className={`font-kanit text-2xl sm:text-3xl md:text-4xl lg:text-[44px] xl:text-[50px] font-semibold tracking-[-0.025em] uppercase leading-[1.12] md:leading-[1.12] drop-shadow-sm transition-colors duration-600 ${
                            isDark ? 'text-white' : 'text-[#3A3A3A]'
                          }`}
                        >
                          <span className="md:hidden">
                            CREATIVE DIRECTOR
                            <br />
                            SHAPING IDEAS INTO EXPERIENCES.
                          </span>
                          <span className="hidden md:inline">
                            CREATIVE DIRECTOR
                            <br />
                            SHAPING IDEAS INTO EXPERIENCES.
                          </span>
                        </h1>
                      </div>

                      {/* NEW INCOMING HEADLINE: Rises from underneath & fades in */}
                      <div
                        ref={headline2Ref}
                        className="col-start-1 row-start-1 flex flex-col items-start will-change-transform"
                        style={{
                          opacity: 0,
                          transform: 'translate3d(0, 35px, 0)',
                          pointerEvents: 'none',
                        }}
                      >
                        <h2
                          className={`font-kanit text-2xl sm:text-3xl md:text-4xl lg:text-[44px] xl:text-[50px] font-semibold tracking-[-0.025em] uppercase leading-[1.12] md:leading-[1.12] drop-shadow-sm transition-colors duration-600 ${
                            isDark ? 'text-white' : 'text-[#3A3A3A]'
                          }`}
                        >
                          <span className="md:hidden">
                            IDEAS DESIGNED
                            <br />
                            TO BE FELT.
                          </span>
                          <span className="hidden md:inline">
                            IDEAS DESIGNED
                            <br />
                            TO BE FELT.
                          </span>
                        </h2>

                        {/* Supporting text revealed below */}
                        <p
                          ref={supportTextRef}
                          className={`mt-2 sm:mt-3 md:mt-5 max-w-sm sm:max-w-md text-xs sm:text-xs md:text-sm font-normal leading-relaxed drop-shadow-sm will-change-transform transition-colors duration-600 ${
                            isDark ? 'text-white' : 'text-[#555555]'
                          }`}
                          style={{
                            opacity: 0,
                            transform: 'translate3d(0, 15px, 0)',
                          }}
                        >
                          I build ideas that move between brands, spaces, screens and culture, turning strategy into visual stories people remember.
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>

                {/* Mobile clean discipline strip */}
                <div
                  className={`md:hidden mt-3 pt-2.5 border-t flex items-center justify-between font-mono text-[9px] uppercase tracking-wider w-full transition-colors duration-600 ${
                    isDark
                      ? 'border-white/20 text-white'
                      : 'border-[#3A3A3A]/20 text-[#555555]'
                  }`}
                >
                  <span>CREATIVE DIRECTION • BRAND IDENTITY • EXPERIENTIAL</span>
                  <span className={isDark ? 'text-white' : 'text-[#777777]'}>
                    DUBAI • 2026
                  </span>
                </div>
              </div>

              {/* RIGHT SIDE: DESKTOP-ONLY INFORMATION BLOCK */}
              <div
                ref={rightTextRef}
                className="hidden md:flex w-full max-w-md lg:max-w-sm xl:max-w-md flex-col justify-end will-change-transform"
                style={{
                  transform: 'translate3d(0, 0px, 0)',
                }}
              >
                <Reveal delay={300}>
                  <div className="flex flex-col">
                    {/* Studio Focus Narrative */}
                    <div
                      className={`space-y-2.5 border-l-2 pl-5 backdrop-blur-sm py-2 transition-colors duration-600 ${
                        isDark
                          ? 'border-white/30 bg-white/[0.04]'
                          : 'border-[#3A3A3A]/25 bg-[#3A3A3A]/[0.02]'
                      }`}
                    >
                      <p
                        className={`text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] transition-colors duration-600 ${
                          isDark ? 'text-white' : 'text-[#3A3A3A]'
                        }`}
                      >
                        15 Years of Turning Ideas into Reality
                      </p>
                      <p
                        className={`text-xs sm:text-sm font-light leading-relaxed transition-colors duration-600 ${
                          isDark ? 'text-white' : 'text-[#555555]'
                        }`}
                      >
                        From brand identities and campaigns to large-scale live experiences, I’ve worked across disciplines where creativity needs to perform in the real world, not just look good on a presentation slide.
                      </p>
                    </div>

                    {/* Disciplines / Combine */}
                    <div
                      className={`mt-6 sm:mt-8 pt-5 border-t transition-colors duration-600 ${
                        isDark ? 'border-white/20' : 'border-[#3A3A3A]/15'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`font-mono text-[10px] uppercase tracking-[0.24em] font-semibold transition-colors duration-600 ${
                            isDark ? 'text-white' : 'text-[#777777]'
                          }`}
                        >
                          CORE DISCIPLINES
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5">
                        {[
                          'Brand Identity',
                          'Experiential Concepts',
                          'Campaign Ideation',
                          'Visual Narrative',
                          'Creative Direction',
                        ].map((discipline, idx) => (
                          <div
                            key={discipline}
                            className={`flex items-center justify-between text-xs sm:text-[13px] font-medium tracking-tight py-1.5 border-b group cursor-default transition-colors duration-600 ${
                              isDark
                                ? 'text-white border-white/20 hover:text-white'
                                : 'text-[#3A3A3A] border-[#3A3A3A]/15 hover:text-black'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`font-mono text-[10px] transition-colors duration-600 ${
                                  isDark ? 'text-white' : 'text-[#777777]'
                                }`}
                              >
                                0{idx + 1}
                              </span>
                              <span className="uppercase tracking-[0.04em]">
                                {discipline}
                              </span>
                            </div>
                            <span
                              className={`font-mono text-xs transition-colors duration-600 ${
                                isDark
                                  ? 'text-white group-hover:text-white'
                                  : 'text-[#777777] group-hover:text-[#3A3A3A]'
                              }`}
                            >
                              ↗
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>

            {/* Persistent Theme Switcher Slider Button: Always on & pinned at bottom of hero section */}
            <div className="absolute bottom-3 sm:bottom-5 md:bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center">
              <div
                className={`flex items-center gap-2.5 sm:gap-3 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border backdrop-blur-md shadow-xl transition-all duration-500 ${
                  isDark
                    ? 'border-white/20 bg-[#0B0B0B]/90 text-white shadow-black/50'
                    : 'border-[#3A3A3A]/25 bg-white/90 text-[#3A3A3A] shadow-black/15'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-medium transition-colors duration-300 cursor-pointer ${
                    isDark
                      ? 'text-white font-semibold drop-shadow-sm'
                      : 'text-[#777777] hover:text-[#3A3A3A]'
                  }`}
                >
                  DARK
                </button>

                <button
                  type="button"
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} theme`}
                  className={`relative inline-flex h-5 w-10 sm:h-5.5 sm:w-11 items-center rounded-full transition-colors duration-500 cursor-pointer border ${
                    isDark
                      ? 'bg-[#1F1F1F] border-white/25 hover:border-white/50'
                      : 'bg-[#E5E5E5] border-black/15 hover:border-black/30'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 transform rounded-full transition-transform duration-500 shadow-md ${
                      isDark
                        ? 'translate-x-5.5 sm:translate-x-6 bg-white'
                        : 'translate-x-0.5 sm:translate-x-1 bg-[#3A3A3A]'
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-medium transition-colors duration-300 cursor-pointer ${
                    !isDark
                      ? 'text-[#1F1F1F] font-semibold drop-shadow-sm'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  LIGHT
                </button>
              </div>
            </div>

            {/* Interactive Prompt: Mobile shows tilt/motion prompt; Desktop strictly shows clean hover cue */}
            <div
              ref={topPromptRef}
              className={`absolute bottom-16 sm:bottom-18 md:bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full border backdrop-blur-md font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.22em] shadow-sm transition-opacity duration-300 pointer-events-auto ${
                isDark
                  ? 'border-white/20 bg-[#0B0B0B]/80 text-white'
                  : 'border-[#3A3A3A]/20 bg-white/80 text-[#3A3A3A]'
              }`}
              style={{ opacity: 1 }}
            >
              {/* Mobile Only: Motion Tilt Permission Button / Swipe Prompt */}
              <div className="md:hidden">
                {isMotionPermNeeded ? (
                  <button
                    type="button"
                    onClick={requestMotionPermission}
                    className="flex items-center gap-2 cursor-pointer font-bold tracking-[0.24em] text-white hover:text-[#C8C1B5] transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>TAP TO ACTIVATE MOTION TILT ✦</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2.5 pointer-events-none">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full animate-pulse ${
                        isDark ? 'bg-white' : 'bg-[#555555]'
                      }`}
                    />
                    <span className={isDark ? 'text-white' : ''}>
                      {isMotionActive ? 'TILT DEVICE ↔ EXPLORE' : 'SWIPE OR TILT ↔ EXPLORE'}
                    </span>
                  </div>
                )}
              </div>

              {/* Desktop Only: Clean Subdued Hover Indicator (Zero Motion Controls) */}
              <div className="hidden md:flex items-center gap-2.5 pointer-events-none">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full animate-pulse ${
                    isDark ? 'bg-white' : 'bg-[#555555]'
                  }`}
                />
                <span className={isDark ? 'text-white' : ''}>HOVER ↔ EXPLORE SCENE</span>
              </div>
            </div>

            {/* Dynamic Status Cue during scroll stages: positioned above bottom button */}
            <div
              ref={statusCueRef}
              className={`absolute bottom-16 sm:bottom-18 md:bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-opacity duration-300 pointer-events-none z-20 ${
                isDark ? 'text-white' : 'text-[#555555]'
              }`}
              style={{ opacity: 0 }}
            >
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full animate-pulse ${
                  isDark ? 'bg-white' : 'bg-[#555555]'
                }`}
              />
              <span className={isDark ? 'text-white' : ''}>CONTINUE SCROLLING FOR PHILOSOPHY ↓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
