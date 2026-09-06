import React, { useEffect, useRef, useState } from 'react';
import { Reveal } from '../components/Reveal';
import CreativePhilosophy from './CreativePhilosophy';

// Dark Mode Videos (Default)
const DARK_HERO_VIDEO_URL = '/videos/hero.mp4?v=5';
const DARK_INTRO_VIDEO_URL = '/videos/creature.mp4?v=3';

// Light Mode Videos
const LIGHT_HERO_VIDEO_URL = '/videos/Hero_White.mp4?v=5';
const LIGHT_INTRO_VIDEO_URL = '/videos/creature_White.mp4?v=3';

const DARK_HERO_POSTER = '/videos/hero-poster.jpg';
const DARK_CREATURE_POSTER = '/videos/creature-poster.jpg';

const SERVICES = [
  '/ CREATIVE DIRECTION',
  '/ BRAND STRATEGY',
  '/ VISUAL EXPERIENCE DESIGN',
];

// Cinematic smoothstep interpolation helper
const smoothstep = (min: number, max: number, val: number) => {
  const x = Math.max(0, Math.min(1, (val - min) / (max - min)));
  return x * x * (3 - 2 * x);
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

// Helper to detect mobile devices
const isMobileDevice = () =>
  typeof window !== 'undefined' &&
  (window.innerWidth < 768 ||
    'ontouchstart' in window ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

export const HeroSection: React.FC = () => {
  // Visual Mood Theme: 'dark' (default) vs 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const isDark = theme === 'dark';

  const containerRef = useRef<HTMLDivElement>(null);

  // Video 2: Hero scroll-scrubbed layers (Dark & Light)
  const canvasDarkRef = useRef<HTMLCanvasElement>(null);
  const canvasLightRef = useRef<HTMLCanvasElement>(null);
  const videoDarkRef = useRef<HTMLVideoElement>(null);
  const videoLightRef = useRef<HTMLVideoElement>(null);
  const darkFramesRef = useRef<ImageBitmap[]>([]);
  const lightFramesRef = useRef<ImageBitmap[]>([]);
  const [isDarkFramesReady, setIsDarkFramesReady] = useState(false);
  const [isLightFramesReady, setIsLightFramesReady] = useState(false);

  // Video 1: Intro creature hover layers (Dark & Light)
  const introContainerRef = useRef<HTMLDivElement>(null);
  const introVideoDarkRef = useRef<HTMLVideoElement>(null);
  const introVideoLightRef = useRef<HTMLVideoElement>(null);
  const introCanvasDarkRef = useRef<HTMLCanvasElement>(null);
  const introCanvasLightRef = useRef<HTMLCanvasElement>(null);
  const darkIntroFramesRef = useRef<ImageBitmap[]>([]);
  const lightIntroFramesRef = useRef<ImageBitmap[]>([]);
  const [isDarkIntroFramesReady, setIsDarkIntroFramesReady] = useState(false);
  const [isLightIntroFramesReady, setIsLightIntroFramesReady] = useState(false);

  const introPhaseRef = useRef<'EXPLORE' | 'REWINDING' | 'HANDOFF' | 'COMPLETE'>('EXPLORE');
  const rewindStartProgressRef = useRef(0.2);
  const rewindStartTimeRef = useRef(0);
  const rewindDurationRef = useRef(350);
  const handoffStartTimeRef = useRef(0);
  const isTransitionCompleteRef = useRef(false);

  const introTargetProgressRef = useRef(0.2);
  const introSmoothedProgressRef = useRef(0.2);
  const [isAtTop, setIsAtTop] = useState(true);

  // Direct DOM ref for buttery-smooth hardware-accelerated downward push transition (zero React re-renders)
  const pushContainerRef = useRef<HTMLDivElement>(null);
  const [showCue, setShowCue] = useState(false);
  const [cueText, setCueText] = useState('');

  const headline1Ref = useRef<HTMLDivElement>(null);
  const headline2Ref = useRef<HTMLDivElement>(null);
  const supportTextRef = useRef<HTMLParagraphElement>(null);
  const rightTextRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef({ show: false, text: '' });

  const scrollTargetProgressRef = useRef(0);
  const smoothedVideoProgressRef = useRef(0);
  const darkHeroDurationRef = useRef(10.0);
  const lightHeroDurationRef = useRef(10.0);
  const darkIntroDurationRef = useRef(10.0);
  const lightIntroDurationRef = useRef(10.0);

  // Resize canvas to match container or window with DPR cap of 2
  const handleResize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = containerRef.current?.querySelector('.sticky');
    const width = parent && parent.clientWidth > 0 ? parent.clientWidth : window.innerWidth;
    const height = parent && parent.clientHeight > 0 ? parent.clientHeight : window.innerHeight;
    [canvasDarkRef, canvasLightRef, introCanvasDarkRef, introCanvasLightRef].forEach((ref) => {
      if (ref.current) {
        ref.current.width = width * dpr;
        ref.current.height = height * dpr;
      }
    });
  };

  // Scroll listener strictly mapping hero pinned track
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const scrollY = window.scrollY || window.pageYOffset;
      const trackTop = container.offsetTop;
      const totalScroll = container.offsetHeight - window.innerHeight;

      if (totalScroll <= 0) return;

      const currentScroll = Math.max(0, scrollY - trackTop);

      // =========================================================================
      // SCROLL-SCRUB CINEMATIC SEQUENCE:
      // Video continues scrubbing across 0px -> 1550px
      // Typography animates directly linked to scroll progress:
      //   - Headline 1 moves upward to nearly touch label & fades out (300px -> 850px)
      //   - Headline 2 rises from below & fades in (600px -> 1150px) [Overlap 600px - 850px]
      //   - Supporting text emerges once headline 2 arrives (900px -> 1250px)
      // Video freezes on final frame (1550px -> 1800px)
      // Downward push into next section (1800px -> 2600px)
      // =========================================================================

      // 0. Intro Video (Video 1) Rewind & Transition Trigger:
      if (currentScroll > 3) {
        if (introPhaseRef.current === 'EXPLORE') {
          if (isMobileDevice() || currentScroll > 60) {
            // Instant seamless transition on mobile or during fast scroll on desktop
            introPhaseRef.current = 'COMPLETE';
            isTransitionCompleteRef.current = true;
            setIsAtTop(false);
            if (introVideoDarkRef.current) introVideoDarkRef.current.pause();
            if (introVideoLightRef.current) introVideoLightRef.current.pause();
            if (introContainerRef.current) {
              introContainerRef.current.style.transition = 'opacity 250ms ease-out';
              introContainerRef.current.style.opacity = '0';
              setTimeout(() => {
                if (introContainerRef.current && introPhaseRef.current === 'COMPLETE') {
                  introContainerRef.current.style.visibility = 'hidden';
                }
              }, 260);
            }
          } else {
            // Desktop gentle scroll: trigger rapid smooth rewind back to frame 0 via pre-cached canvas
            introPhaseRef.current = 'REWINDING';
            rewindStartProgressRef.current = introSmoothedProgressRef.current;
            rewindStartTimeRef.current = performance.now();
            rewindDurationRef.current = Math.max(250, Math.min(380, rewindStartProgressRef.current * 420));
            setIsAtTop(false);
          }
        } else if (introPhaseRef.current === 'REWINDING' && currentScroll > 60) {
          // Fast-scroll during rewind: complete handoff immediately to avoid video seek jump
          introPhaseRef.current = 'COMPLETE';
          isTransitionCompleteRef.current = true;
          if (introContainerRef.current) {
            introContainerRef.current.style.opacity = '0';
            introContainerRef.current.style.visibility = 'hidden';
          }
        }
      } else if (currentScroll <= 2) {
        // Return to absolute top: re-enable explore state
        if (introPhaseRef.current === 'COMPLETE') {
          introPhaseRef.current = 'EXPLORE';
          isTransitionCompleteRef.current = false;
          setIsAtTop(true);
          if (introContainerRef.current) {
            introContainerRef.current.style.transition = 'opacity 300ms ease-out';
            introContainerRef.current.style.opacity = '1';
            introContainerRef.current.style.visibility = 'visible';
          }
          if (isMobileDevice()) {
            if (introVideoDarkRef.current && isDark) introVideoDarkRef.current.play().catch(() => {});
            if (introVideoLightRef.current && !isDark) introVideoLightRef.current.play().catch(() => {});
          }
        }
      }

      // 1. Continuous Video Scrub: 0.0 to 1.0 (activated immediately once handoff begins)
      const videoTarget = (isTransitionCompleteRef.current || currentScroll > 60)
        ? Math.min(1.0, currentScroll / 1550)
        : 0;
      scrollTargetProgressRef.current = videoTarget;

      // 2. Scroll-Linked Typography Evolution (while video is playing):
      // Headline 1: moves upward (0px -> -22px) toward label & fades out (1.0 -> 0.0) between 300px and 850px
      const f1 = smoothstep(300, 850, currentScroll);
      const h1Y = -f1 * 22;
      const h1Op = 1 - f1;

      // Headline 2: rises from below (+35px -> 0px) & fades in (0.0 -> 1.0) between 600px and 1150px
      const f2 = smoothstep(600, 1150, currentScroll);
      const h2Y = (1 - f2) * 35;
      const h2Op = f2;

      // Supporting text: emerges gently once headline 2 settles (between 900px and 1250px)
      const fSupport = smoothstep(900, 1250, currentScroll);
      const supY = (1 - fSupport) * 15;
      const supOp = fSupport;

      // Right column subtle parallax lift while video plays (0px -> 1550px)
      const rightProgress = Math.min(1.0, currentScroll / 1550);
      const rightY = -rightProgress * 20;

      if (headline1Ref.current) {
        headline1Ref.current.style.transform = `translateY(${h1Y.toFixed(1)}px)`;
        headline1Ref.current.style.opacity = h1Op.toFixed(3);
        headline1Ref.current.style.pointerEvents = h1Op > 0.05 ? 'auto' : 'none';
      }
      if (headline2Ref.current) {
        headline2Ref.current.style.transform = `translateY(${h2Y.toFixed(1)}px)`;
        headline2Ref.current.style.opacity = h2Op.toFixed(3);
        headline2Ref.current.style.pointerEvents = h2Op > 0.05 ? 'auto' : 'none';
      }
      if (supportTextRef.current) {
        supportTextRef.current.style.transform = `translateY(${supY.toFixed(1)}px)`;
        supportTextRef.current.style.opacity = supOp.toFixed(3);
      }
      if (rightTextRef.current) {
        rightTextRef.current.style.transform = `translateY(${rightY.toFixed(1)}px)`;
      }

      // 3. Status Cue: Shows once video finishes & holds (1550px -> 1800px)
      const freezeStart = 1550;
      const pushStart = 1800;
      let newShow = false;
      let newText = '';
      if (currentScroll >= freezeStart && currentScroll < pushStart) {
        newShow = true;
        newText = 'CONTINUE SCROLLING FOR PHILOSOPHY ↓';
      }

      if (cueRef.current.show !== newShow || cueRef.current.text !== newText) {
        cueRef.current = { show: newShow, text: newText };
        setShowCue(newShow);
        setCueText(newText);
      }

      // 4. Downward Push Progress (1800px -> 2600px):
      // Direct DOM transform with zero CSS transition interference and zero React state lag
      const pushEnd = 2600;
      let push = 0;
      if (currentScroll > pushStart) {
        push = Math.min(1.0, (currentScroll - pushStart) / (pushEnd - pushStart));
      }
      const easedPush =
        push < 0.5
          ? 4 * push * push * push
          : 1 - Math.pow(-2 * push + 2, 3) / 2;

      if (pushContainerRef.current) {
        pushContainerRef.current.style.transform = `translate3d(0, calc(-100vh + ${(easedPush * 100).toFixed(3)}vh), 0)`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    handleResize();
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Intro video controller: Mouse hover on Desktop, Device Motion (Gyroscope Tilt) on Mobile
  useEffect(() => {
    // Desktop mouse hover controller
    const handleMouseMove = (e: MouseEvent) => {
      if (isMobileDevice()) return;
      if (introPhaseRef.current !== 'EXPLORE') return;
      const xNorm = 1 - Math.max(0, Math.min(1, e.clientX / window.innerWidth));
      introTargetProgressRef.current = xNorm;
    };

    // Desktop wheel rewind trigger
    const handleWheel = (e: WheelEvent) => {
      if (introPhaseRef.current === 'EXPLORE' && e.deltaY > 0) {
        // First wheel input detected: immediately trigger rapid rewind
        introPhaseRef.current = 'REWINDING';
        rewindStartProgressRef.current = introSmoothedProgressRef.current;
        rewindStartTimeRef.current = performance.now();
        rewindDurationRef.current = Math.max(250, Math.min(380, rewindStartProgressRef.current * 420));
        setIsAtTop(false);
      }
    };

    // Mobile Device Orientation Motion Controller (Gyroscope Tilt)
    // Tilting phone left turns creature head left; tilting right turns head right
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (!isMobileDevice()) return;
      if (introPhaseRef.current !== 'EXPLORE') return;
      if (e.gamma !== null && typeof e.gamma === 'number') {
        // gamma: left-to-right tilt in degrees (-90 to +90)
        // Neutral holding upright: gamma ≈ 0
        // Tilting left: negative (clamped to -25°)
        // Tilting right: positive (clamped to +25°)
        const clampedGamma = Math.max(-25, Math.min(25, e.gamma));
        // Map: tilt left -> 1.0 (creature looks left), tilt right -> 0.0 (creature looks right)
        const tiltNorm = 1 - (clampedGamma + 25) / 50;
        introTargetProgressRef.current = tiltNorm;
      }
    };

    // Request motion permission on iOS 13+ on user interaction
    const requestMotionPermission = async () => {
      if (
        typeof DeviceOrientationEvent !== 'undefined' &&
        typeof (DeviceOrientationEvent as any).requestPermission === 'function'
      ) {
        try {
          const perm = await (DeviceOrientationEvent as any).requestPermission();
          if (perm === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation, { passive: true });
          }
        } catch {}
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });

    // Attach orientation listener
    if (
      typeof DeviceOrientationEvent === 'undefined' ||
      typeof (DeviceOrientationEvent as any).requestPermission !== 'function'
    ) {
      // Android and standard browsers: listen directly
      window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    }
    // iOS: request on first user interaction
    window.addEventListener('touchstart', requestMotionPermission, { once: true, passive: true });
    window.addEventListener('click', requestMotionPermission, { once: true, passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('touchstart', requestMotionPermission);
      window.removeEventListener('click', requestMotionPermission);
    };
  }, []);

  // Media unlock & decoder priming for iOS Safari & Android mobile decoders
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
        const p = vid.play();
        if (p !== undefined) {
          p.then(() => {
            vid.pause();
          }).catch(() => {});
        }
      });
    };

    unlockVideos();

    window.addEventListener('touchstart', unlockVideos, { once: true, passive: true });
    window.addEventListener('click', unlockVideos, { once: true, passive: true });

    return () => {
      window.removeEventListener('touchstart', unlockVideos);
      window.removeEventListener('click', unlockVideos);
    };
  }, [isDark]);

  // Reusable frame extractor
  const extractFrames = async (
    videoUrl: string,
    targetFrames: number,
    targetRef: React.MutableRefObject<ImageBitmap[]>,
    durationRefTarget: React.MutableRefObject<number>,
    setReady: (val: boolean) => void,
    isMounted: () => boolean
  ) => {
    if (targetRef.current.length > 0) return;
    try {
      const offscreenVideo = document.createElement('video');
      offscreenVideo.muted = true;
      offscreenVideo.playsInline = true;
      offscreenVideo.preload = 'auto';
      offscreenVideo.src = videoUrl;

      await new Promise<void>((resolve, reject) => {
        offscreenVideo.onloadedmetadata = () => resolve();
        offscreenVideo.onerror = (e) => reject(e);
      });

      const duration = offscreenVideo.duration || 10;
      durationRefTarget.current = duration;

      const vWidth = offscreenVideo.videoWidth || 1920;
      const vHeight = offscreenVideo.videoHeight || 1080;
      const scale = Math.min(1, 960 / vWidth);
      const targetWidth = Math.round(vWidth * scale);
      const targetHeight = Math.round(vHeight * scale);

      const extractCanvas = document.createElement('canvas');
      extractCanvas.width = targetWidth;
      extractCanvas.height = targetHeight;
      const ctx = extractCanvas.getContext('2d');

      const extracted: ImageBitmap[] = [];
      for (let i = 0; i < targetFrames; i++) {
        if (!isMounted()) break;
        const targetTime = (i / (targetFrames - 1)) * Math.max(0, duration - 0.05);
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

      if (isMounted() && extracted.length >= 8) {
        targetRef.current = extracted;
        setReady(true);
      }
    } catch (err) {
      console.warn('Frame cache extraction fallback to video scrub:', videoUrl, err);
    }
  };

  // Preload and cache frames for both Dark and Light video moods (Desktop only)
  useEffect(() => {
    let isMounted = true;
    const checkMounted = () => isMounted;

    const isMobile = isMobileDevice();

    if (isMobile) {
      // On mobile devices, extract 32 lightweight frames of the intro creature
      // so device motion / tilt control is instant and zero-lag without heavy memory consumption
      extractFrames(DARK_INTRO_VIDEO_URL, 32, darkIntroFramesRef, darkIntroDurationRef, setIsDarkIntroFramesReady, checkMounted);
      return () => {
        isMounted = false;
        darkIntroFramesRef.current.forEach((bmp) => bmp.close());
      };
    }

    // Extract dark theme frames first (default active theme)
    extractFrames(DARK_INTRO_VIDEO_URL, 48, darkIntroFramesRef, darkIntroDurationRef, setIsDarkIntroFramesReady, checkMounted);
    extractFrames(DARK_HERO_VIDEO_URL, 72, darkFramesRef, darkHeroDurationRef, setIsDarkFramesReady, checkMounted);

    // Preload light theme frames shortly after
    const timer = setTimeout(() => {
      if (!isMounted) return;
      extractFrames(LIGHT_INTRO_VIDEO_URL, 48, lightIntroFramesRef, lightIntroDurationRef, setIsLightIntroFramesReady, checkMounted);
      extractFrames(LIGHT_HERO_VIDEO_URL, 72, lightFramesRef, lightHeroDurationRef, setIsLightFramesReady, checkMounted);
    }, 450);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      darkIntroFramesRef.current.forEach((bmp) => bmp.close());
      lightIntroFramesRef.current.forEach((bmp) => bmp.close());
      darkFramesRef.current.forEach((bmp) => bmp.close());
      lightFramesRef.current.forEach((bmp) => bmp.close());
    };
  }, []);

  // Animation & scrub loop with lerp (0.16) - Synchronously updates both Dark & Light layers
  useEffect(() => {
    let animId: number;

    const render = () => {
      const now = performance.now();

      // =======================================================================
      // VIDEO 1 LIFECYCLE: EXPLORE -> REWINDING -> HANDOFF -> COMPLETE
      // =======================================================================
      if (introPhaseRef.current === 'EXPLORE') {
        introSmoothedProgressRef.current +=
          (introTargetProgressRef.current - introSmoothedProgressRef.current) * 0.14;
        if (Math.abs(introTargetProgressRef.current - introSmoothedProgressRef.current) < 0.001) {
          introSmoothedProgressRef.current = introTargetProgressRef.current;
        }
      } else if (introPhaseRef.current === 'REWINDING') {
        const elapsed = now - rewindStartTimeRef.current;
        const t = Math.min(1, elapsed / rewindDurationRef.current);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const currentRewind = rewindStartProgressRef.current * (1 - eased);
        introSmoothedProgressRef.current = Math.max(0, currentRewind);

        if (t >= 1) {
          introSmoothedProgressRef.current = 0;
          introPhaseRef.current = 'HANDOFF';
          handoffStartTimeRef.current = now;
        }
      } else if (introPhaseRef.current === 'HANDOFF') {
        introSmoothedProgressRef.current = 0;
        if (now - handoffStartTimeRef.current >= 70) {
          introPhaseRef.current = 'COMPLETE';
          isTransitionCompleteRef.current = true;

          // Fade Video 1 out smoothly
          if (introContainerRef.current) {
            introContainerRef.current.style.transition = 'opacity 250ms ease-out';
            introContainerRef.current.style.opacity = '0';
            setTimeout(() => {
              if (introContainerRef.current && introPhaseRef.current === 'COMPLETE') {
                introContainerRef.current.style.visibility = 'hidden';
              }
            }, 260);
          }

          // Unclamp Video 2 scroll target to match current scroll
          const scrollY = window.scrollY || window.pageYOffset;
          const trackTop = containerRef.current?.offsetTop || 0;
          const currentScroll = Math.max(0, scrollY - trackTop);
          scrollTargetProgressRef.current = Math.min(1.0, currentScroll / 1550);
        }
      }

      // Draw Video 1 (Creature Intro): Synchronously update both Dark & Light layers
      if (introPhaseRef.current !== 'COMPLETE' || introSmoothedProgressRef.current > 0) {
        const introProgress = introSmoothedProgressRef.current;

        // Dark Creature:
        if (introCanvasDarkRef.current && darkIntroFramesRef.current.length > 0) {
          const darkFrames = darkIntroFramesRef.current;
          const frameIndex = Math.min(
            darkFrames.length - 1,
            Math.max(0, Math.round(introProgress * (darkFrames.length - 1)))
          );
          const frame = darkFrames[frameIndex];
          if (frame) {
            const ctx = introCanvasDarkRef.current.getContext('2d');
            if (ctx) {
              const bounds = calculateDrawBounds(
                introCanvasDarkRef.current.width,
                introCanvasDarkRef.current.height,
                frame.width,
                frame.height
              );
              ctx.clearRect(0, 0, introCanvasDarkRef.current.width, introCanvasDarkRef.current.height);
              ctx.drawImage(frame, 0, 0, frame.width, frame.height, bounds.shiftX, bounds.shiftY, bounds.drawWidth, bounds.drawHeight);
            }
          }
        } else if (introVideoDarkRef.current && darkIntroDurationRef.current > 0) {
          const v = introVideoDarkRef.current;
          if (!v.seeking && v.readyState >= 2) {
            const targetTime = introProgress * Math.max(0, darkIntroDurationRef.current - 0.05);
            if (Math.abs(v.currentTime - targetTime) > 0.04) {
              v.currentTime = targetTime;
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
          const frame = lightFrames[frameIndex];
          if (frame) {
            const ctx = introCanvasLightRef.current.getContext('2d');
            if (ctx) {
              const bounds = calculateDrawBounds(
                introCanvasLightRef.current.width,
                introCanvasLightRef.current.height,
                frame.width,
                frame.height
              );
              ctx.clearRect(0, 0, introCanvasLightRef.current.width, introCanvasLightRef.current.height);
              ctx.drawImage(frame, 0, 0, frame.width, frame.height, bounds.shiftX, bounds.shiftY, bounds.drawWidth, bounds.drawHeight);
            }
          }
        } else if (introVideoLightRef.current && lightIntroDurationRef.current > 0) {
          const v = introVideoLightRef.current;
          if (!v.seeking && v.readyState >= 2) {
            const targetTime = introProgress * Math.max(0, lightIntroDurationRef.current - 0.05);
            if (Math.abs(v.currentTime - targetTime) > 0.04) {
              v.currentTime = targetTime;
            }
          }
        }
      }

      // 2. Main Hero Scroll Scrubbing: Synchronously update both Dark & Light layers
      const target = scrollTargetProgressRef.current;
      const delta = Math.abs(target - smoothedVideoProgressRef.current);
      const lerpFactor = delta > 0.25 ? 0.45 : 0.16;
      smoothedVideoProgressRef.current +=
        (target - smoothedVideoProgressRef.current) * lerpFactor;

      if (Math.abs(target - smoothedVideoProgressRef.current) < 0.002) {
        smoothedVideoProgressRef.current = target;
      }

      const smoothed = smoothedVideoProgressRef.current;

      // Dark Hero:
      if (canvasDarkRef.current && darkFramesRef.current.length > 0) {
        const darkFrames = darkFramesRef.current;
        const frameIndex = Math.min(
          darkFrames.length - 1,
          Math.max(0, Math.round(smoothed * (darkFrames.length - 1)))
        );
        const frame = darkFrames[frameIndex];
        if (frame) {
          const ctx = canvasDarkRef.current.getContext('2d');
          if (ctx) {
            const bounds = calculateDrawBounds(
              canvasDarkRef.current.width,
              canvasDarkRef.current.height,
              frame.width,
              frame.height
            );
            ctx.clearRect(0, 0, canvasDarkRef.current.width, canvasDarkRef.current.height);
            ctx.drawImage(frame, 0, 0, frame.width, frame.height, bounds.shiftX, bounds.shiftY, bounds.drawWidth, bounds.drawHeight);
          }
        }
      } else if (videoDarkRef.current && darkHeroDurationRef.current > 0) {
        const v = videoDarkRef.current;
        if (!v.seeking && v.readyState >= 2) {
          const targetTime = smoothed * Math.max(0, darkHeroDurationRef.current - 0.05);
          if (Math.abs(v.currentTime - targetTime) > 0.04) {
            v.currentTime = targetTime;
          }
        }
      }

      // Light Hero:
      if (canvasLightRef.current && lightFramesRef.current.length > 0) {
        const lightFrames = lightFramesRef.current;
        const frameIndex = Math.min(
          lightFrames.length - 1,
          Math.max(0, Math.round(smoothed * (lightFrames.length - 1)))
        );
        const frame = lightFrames[frameIndex];
        if (frame) {
          const ctx = canvasLightRef.current.getContext('2d');
          if (ctx) {
            const bounds = calculateDrawBounds(
              canvasLightRef.current.width,
              canvasLightRef.current.height,
              frame.width,
              frame.height
            );
            ctx.clearRect(0, 0, canvasLightRef.current.width, canvasLightRef.current.height);
            ctx.drawImage(frame, 0, 0, frame.width, frame.height, bounds.shiftX, bounds.shiftY, bounds.drawWidth, bounds.drawHeight);
          }
        }
      } else if (videoLightRef.current && lightHeroDurationRef.current > 0) {
        const v = videoLightRef.current;
        if (!v.seeking && v.readyState >= 2) {
          const targetTime = smoothed * Math.max(0, lightHeroDurationRef.current - 0.05);
          if (Math.abs(v.currentTime - targetTime) > 0.04) {
            v.currentTime = targetTime;
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    /* Outer Pinned Scroll Track: Controls Video Scrubbing (Phase 1), Text Storytelling (Phase 2), and Downward Push (Phase 3) */
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: 'calc(100vh + 4800px)' }}
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
            className={`relative h-screen h-[100dvh] w-full overflow-hidden flex flex-col justify-between pt-12 sm:pt-16 md:pt-20 pb-4 sm:pb-8 md:pb-12 md:px-14 lg:px-16 transition-colors duration-700 ${
              isDark ? 'bg-[#050505] text-[#F5F5F5]' : 'bg-[#FFFFFF] text-[#3A3A3A]'
            }`}
          >
            {/* Mobile Top Row: Meta Header */}
            <div className="md:hidden flex items-center justify-between pointer-events-auto px-1 pb-1">
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.2em] font-medium transition-colors duration-600 ${
                  isDark ? 'text-[#A6A6A6]' : 'text-[#555555]'
                }`}
              >
                DUBAI • 2026
              </span>
              <span
                className={`font-mono text-[9px] uppercase tracking-[0.2em] font-medium transition-colors duration-600 ${
                  isDark ? 'text-[#707070]' : 'text-[#777777]'
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
                        isDark ? 'text-[#A6A6A6]' : 'text-[#555555]'
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
                      isDark ? 'text-[#A6A6A6]' : 'text-[#555555]'
                    }`}
                  >
                    DIRECTING GLOBALLY
                  </span>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.16em] transition-colors duration-600 ${
                      isDark ? 'text-[#707070]' : 'text-[#777777]'
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
                    src={DARK_HERO_VIDEO_URL}
                    poster={DARK_HERO_POSTER}
                    muted
                    playsInline
                    preload="auto"
                    onLoadedMetadata={(e) => {
                      if (e.currentTarget.duration) darkHeroDurationRef.current = e.currentTarget.duration;
                    }}
                    className={`absolute top-0 left-1/2 -translate-x-1/2 h-full w-auto max-w-none transition-opacity duration-500 ${
                      !isDarkFramesReady ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <canvas
                    ref={canvasDarkRef}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
                      isDarkFramesReady ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>

                {/* Light Hero Video Track */}
                <div
                  className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                  style={{ opacity: !isDark ? 1 : 0 }}
                >
                  <video
                    ref={videoLightRef}
                    src={LIGHT_HERO_VIDEO_URL}
                    muted
                    playsInline
                    preload={isDark ? 'none' : 'auto'}
                    onLoadedMetadata={(e) => {
                      if (e.currentTarget.duration) lightHeroDurationRef.current = e.currentTarget.duration;
                    }}
                    className={`absolute top-0 left-1/2 -translate-x-1/2 h-full w-auto max-w-none transition-opacity duration-500 ${
                      !isLightFramesReady ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <canvas
                    ref={canvasLightRef}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
                      isLightFramesReady ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>
              </div>

              {/* Video 1 (Intro Hover Video Layer: Creature) */}
              <div
                ref={introContainerRef}
                className="absolute inset-0 z-[5] overflow-hidden pointer-events-none transition-opacity duration-250 ease-out"
                style={{ opacity: 1 }}
              >
                {/* Dark Creature Track */}
                <div
                  className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                  style={{ opacity: isDark ? 1 : 0 }}
                >
                  <video
                    ref={introVideoDarkRef}
                    src={DARK_INTRO_VIDEO_URL}
                    poster={DARK_CREATURE_POSTER}
                    muted
                    playsInline
                    preload="auto"
                    onLoadedMetadata={(e) => {
                      if (e.currentTarget.duration) darkIntroDurationRef.current = e.currentTarget.duration;
                    }}
                    className={`absolute top-0 left-1/2 -translate-x-1/2 h-full w-auto max-w-none transition-opacity duration-300 ${
                      isDarkIntroFramesReady ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                  <canvas
                    ref={introCanvasDarkRef}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
                      isDarkIntroFramesReady ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>

                {/* Light Creature Track */}
                <div
                  className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                  style={{ opacity: !isDark ? 1 : 0 }}
                >
                  <video
                    ref={introVideoLightRef}
                    src={LIGHT_INTRO_VIDEO_URL}
                    muted
                    playsInline
                    preload={isDark ? 'none' : 'auto'}
                    onLoadedMetadata={(e) => {
                      if (e.currentTarget.duration) lightIntroDurationRef.current = e.currentTarget.duration;
                    }}
                    className={`absolute top-0 left-1/2 -translate-x-1/2 h-full w-auto max-w-none transition-opacity duration-300 ${
                      isLightIntroFramesReady ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                  <canvas
                    ref={introCanvasLightRef}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
                      isLightIntroFramesReady ? 'opacity-100' : 'opacity-0'
                    }`}
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
                        className="col-start-1 row-start-1 flex flex-col items-start will-change-transform transition-all duration-75 ease-out"
                        style={{
                          opacity: 1,
                          transform: 'translateY(0px)',
                        }}
                      >
                        <h1
                          className={`font-kanit text-2xl sm:text-3xl md:text-4xl lg:text-[44px] xl:text-[50px] font-semibold tracking-[-0.025em] uppercase leading-[1.12] md:leading-[1.12] drop-shadow-sm transition-colors duration-600 ${
                            isDark ? 'text-[#F5F5F5]' : 'text-[#3A3A3A]'
                          }`}
                        >
                          <span className="md:hidden">
                            I DON'T JUST CREATE VISUALS.
                            <br />
                            I BUILD PERCEPTION.
                          </span>
                          <span className="hidden md:inline">
                            I DON'T JUST CREATE VISUALS.
                            <br />
                            I BUILD PERCEPTION.
                          </span>
                        </h1>
                      </div>

                      {/* NEW INCOMING HEADLINE: Rises from underneath & fades in */}
                      <div
                        ref={headline2Ref}
                        className="col-start-1 row-start-1 flex flex-col items-start will-change-transform transition-all duration-75 ease-out"
                        style={{
                          opacity: 0,
                          transform: 'translateY(35px)',
                          pointerEvents: 'none',
                        }}
                      >
                        <h2
                          className={`font-kanit text-2xl sm:text-3xl md:text-4xl lg:text-[44px] xl:text-[50px] font-semibold tracking-[-0.025em] uppercase leading-[1.12] md:leading-[1.12] drop-shadow-sm transition-colors duration-600 ${
                            isDark ? 'text-[#F5F5F5]' : 'text-[#3A3A3A]'
                          }`}
                        >
                          <span className="md:hidden">
                            EVERY IDEA BEGINS WITH A STORY.
                            <br />
                            I TURN IT INTO VISUAL LANGUAGE.
                          </span>
                          <span className="hidden md:inline">
                            EVERY IDEA BEGINS WITH A STORY.
                            <br />
                            I TURN IT INTO
                            <br />
                            VISUAL LANGUAGE.
                          </span>
                        </h2>

                        {/* Supporting text revealed below */}
                        <p
                          ref={supportTextRef}
                          className={`mt-2 sm:mt-3 md:mt-5 max-w-sm sm:max-w-md text-xs sm:text-xs md:text-sm font-normal leading-relaxed drop-shadow-sm will-change-transform transition-all duration-75 ease-out transition-colors duration-600 ${
                            isDark ? 'text-[#A6A6A6]' : 'text-[#555555]'
                          }`}
                          style={{
                            opacity: 0,
                            transform: 'translateY(15px)',
                          }}
                        >
                          Every idea begins with a story.
                          <br />
                          My role is to transform that story into meaningful identity, experience, and memory.
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>

                {/* Mobile clean discipline strip */}
                <div
                  className={`md:hidden mt-3 pt-2.5 border-t flex items-center justify-between font-mono text-[9px] uppercase tracking-wider w-full transition-colors duration-600 ${
                    isDark
                      ? 'border-white/15 text-[#A6A6A6]'
                      : 'border-[#3A3A3A]/20 text-[#555555]'
                  }`}
                >
                  <span>ART DIRECTION • BRAND STRATEGY • DIGITAL</span>
                  <span className={isDark ? 'text-[#707070]' : 'text-[#777777]'}>
                    DUBAI • 2026
                  </span>
                </div>
              </div>

              {/* RIGHT SIDE: DESKTOP-ONLY INFORMATION BLOCK */}
              <div
                ref={rightTextRef}
                className="hidden md:flex w-full max-w-md lg:max-w-sm xl:max-w-md flex-col justify-end will-change-transform transition-all duration-75 ease-out"
              >
                <Reveal delay={300}>
                  <div className="flex flex-col">
                    {/* Studio Focus Narrative */}
                    <div
                      className={`space-y-2.5 border-l-2 pl-5 backdrop-blur-sm py-2 transition-colors duration-600 ${
                        isDark
                          ? 'border-white/20 bg-white/[0.03]'
                          : 'border-[#3A3A3A]/25 bg-[#3A3A3A]/[0.02]'
                      }`}
                    >
                      <p
                        className={`text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] transition-colors duration-600 ${
                          isDark ? 'text-[#F5F5F5]' : 'text-[#3A3A3A]'
                        }`}
                      >
                        Strategic Clarity & Visceral Craft
                      </p>
                      <p
                        className={`text-xs sm:text-sm font-light leading-relaxed transition-colors duration-600 ${
                          isDark ? 'text-[#A6A6A6]' : 'text-[#555555]'
                        }`}
                      >
                        Architecting perception, brand authority, and digital flagships for visionary enterprises.
                      </p>
                    </div>

                    {/* Disciplines / Combine */}
                    <div
                      className={`mt-6 sm:mt-8 pt-5 border-t transition-colors duration-600 ${
                        isDark ? 'border-white/15' : 'border-[#3A3A3A]/15'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`font-mono text-[10px] uppercase tracking-[0.24em] font-semibold transition-colors duration-600 ${
                            isDark ? 'text-[#707070]' : 'text-[#777777]'
                          }`}
                        >
                          COMBINE / DISCIPLINES
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5">
                        {[
                          'Art Direction',
                          'Brand Strategy',
                          'Visual Storytelling',
                          'Digital Experiences',
                        ].map((discipline, idx) => (
                          <div
                            key={discipline}
                            className={`flex items-center justify-between text-xs sm:text-[13px] font-medium tracking-tight py-1.5 border-b group cursor-default transition-colors duration-600 ${
                              isDark
                                ? 'text-[#F5F5F5] border-white/15 hover:text-white'
                                : 'text-[#3A3A3A] border-[#3A3A3A]/15 hover:text-black'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`font-mono text-[10px] transition-colors duration-600 ${
                                  isDark ? 'text-[#707070]' : 'text-[#777777]'
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
                                  ? 'text-[#707070] group-hover:text-white'
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
                    ? 'border-white/20 bg-[#0B0B0B]/90 text-[#F5F5F5] shadow-black/50'
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
                      : 'text-[#707070] hover:text-white'
                  }`}
                >
                  LIGHT
                </button>
              </div>
            </div>

            {/* Initial Interactive Hover Prompt: positioned above bottom button */}
            <div
              className={`absolute bottom-16 sm:bottom-18 md:bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full border backdrop-blur-md font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.22em] shadow-sm transition-all duration-300 pointer-events-none ${
                isDark
                  ? 'border-white/20 bg-[#0B0B0B]/80 text-[#F5F5F5]'
                  : 'border-[#3A3A3A]/20 bg-white/80 text-[#3A3A3A]'
              } ${
                isAtTop && !showCue ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full animate-pulse ${
                  isDark ? 'bg-[#A6A6A6]' : 'bg-[#555555]'
                }`}
              />
              <span>HOVER ↔ EXPLORE SCENE</span>
            </div>

            {/* Dynamic Status Cue during scroll stages: positioned above bottom button */}
            <div
              className={`absolute bottom-16 sm:bottom-18 md:bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-opacity duration-300 pointer-events-none z-20 ${
                isDark ? 'text-[#A6A6A6]' : 'text-[#555555]'
              } ${
                showCue ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full animate-pulse ${
                  isDark ? 'bg-[#A6A6A6]' : 'bg-[#555555]'
                }`}
              />
              <span>{cueText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
