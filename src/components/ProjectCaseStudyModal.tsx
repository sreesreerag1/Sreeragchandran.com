import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { PortfolioProject } from '../data/portfolioProjects';

interface ProjectCaseStudyModalProps {
  project: PortfolioProject | null;
  onClose: () => void;
  onSelectProject: (project: PortfolioProject) => void;
  allProjects: PortfolioProject[];
}

export const ProjectCaseStudyModal: React.FC<ProjectCaseStudyModalProps> = ({
  project,
  onClose,
  onSelectProject,
  allProjects,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!project) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Reset scroll position to top when project changes
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [project, onClose]);

  if (!project) return null;

  // Find prev/next projects for sequential navigation
  const currentIndex = allProjects.findIndex((p) => p.slug === project.slug);
  const prevProject =
    currentIndex > 0 ? allProjects[currentIndex - 1] : allProjects[allProjects.length - 1];
  const nextProject =
    currentIndex < allProjects.length - 1 ? allProjects[currentIndex + 1] : allProjects[0];

  // Separate hero image from remaining gallery images
  const remainingImages = project.images.filter((img) => img.src !== project.heroImage);
  const midpoint = Math.ceil(remainingImages.length / 2);
  const firstHalfImages = remainingImages.slice(0, midpoint);
  const secondHalfImages = remainingImages.slice(midpoint);

  return (
    <AnimatePresence>
      <motion.div
        key="project-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex flex-col bg-[#050505]/98 backdrop-blur-2xl text-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-project-title"
      >
        {/* Sticky Minimal Editorial Header */}
        <header className="sticky top-0 z-40 w-full bg-[#050505]/90 backdrop-blur-xl border-b border-white/10 px-5 sm:px-8 md:px-14 lg:px-16 py-4 sm:py-5 transition-all">
          <div className="max-w-7xl mx-auto flex flex-col gap-2">
            {/* Top Bar: Title & Close Button */}
            <div className="flex items-center justify-between gap-4">
              <h2
                id="modal-project-title"
                className="font-kanit font-semibold text-xl sm:text-2xl md:text-3xl lg:text-4xl uppercase tracking-[-0.02em] text-white truncate"
              >
                {project.title}
              </h2>

              <button
                onClick={onClose}
                aria-label="Close project modal"
                className="group flex items-center gap-2 font-mono text-xs sm:text-[13px] uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors px-3 py-1.5 rounded-full border border-white/15 hover:border-white/40 bg-white/5 shrink-0 cursor-pointer"
              >
                <span>CLOSE</span>
                <X className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-90 text-white/80" />
              </button>
            </div>

            {/* Sub-header: CATEGORY • YEAR • DISCIPLINE */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/50">
              <span className="text-white/80 font-medium">{project.category}</span>
              <span className="text-white/25">•</span>
              <span>{project.year}</span>
              <span className="text-white/25">•</span>
              <span className="text-white/60">{project.discipline}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Cinematic Case Study Body */}
        <motion.div
          ref={scrollContainerRef}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-14 lg:px-16 py-8 sm:py-12 md:py-16 flex flex-col gap-14 sm:gap-20 md:gap-28">
            {/* 1. Large Hero Image (Full Width, High Impact) */}
            <section className="w-full flex flex-col gap-3">
              <div className="w-full relative overflow-hidden rounded-xl md:rounded-3xl border border-white/10 bg-neutral-900 shadow-2xl">
                <img
                  src={project.heroImage}
                  alt={`${project.title} Hero Key Visual`}
                  loading="eager"
                  className="w-full max-h-[82vh] aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/9] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
              </div>
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/40 self-end">
                KEY VISUAL / PRIMARY ARCHITECTURE
              </span>
            </section>

            {/* 2. Asymmetric Masonry Gallery (Part 1) */}
            {firstHalfImages.length > 0 && (
              <section className="w-full flex flex-col gap-8 md:gap-14">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 md:gap-12 items-start">
                  {firstHalfImages.map((img, idx) => {
                    // Editorial asymmetrical rhythm:
                    const isEven = idx % 2 === 0;
                    const isSolo = idx === firstHalfImages.length - 1 && firstHalfImages.length % 2 === 1;

                    let colSpan = isEven ? 'md:col-span-7' : 'md:col-span-5';
                    let aspectClass = isEven ? 'aspect-[4/3] sm:aspect-[16/11]' : 'aspect-[3/4] sm:aspect-[4/5]';

                    if (isSolo) {
                      colSpan = 'md:col-span-12';
                      aspectClass = 'aspect-[16/9] max-h-[75vh]';
                    }

                    return (
                      <div
                        key={`first-${img.id}-${idx}`}
                        className={`w-full ${colSpan} flex flex-col gap-2.5`}
                      >
                        <div className="relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-neutral-900 shadow-lg group">
                          <img
                            src={img.src}
                            alt={`${project.title} gallery documentation`}
                            loading="lazy"
                            className={`w-full ${aspectClass} object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]`}
                          />
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300 pointer-events-none" />
                        </div>
                        <div className="flex items-center justify-between font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-white/35 px-1">
                          <span>EXP. {String(idx + 1).padStart(2, '0')}</span>
                          <span className="truncate max-w-[200px]">{img.originalName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 3. Creative Description / Pull Quote Breakout */}
            <section className="w-full py-8 md:py-14 border-y border-white/10 flex flex-col gap-8 md:gap-12">
              <blockquote className="font-kanit font-normal text-2xl sm:text-3xl md:text-4xl lg:text-5xl uppercase tracking-[-0.02em] text-white leading-[1.12] max-w-5xl">
                “{project.creativeQuote}”
              </blockquote>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 pt-4">
                <div className="md:col-span-4 font-mono text-xs uppercase tracking-[0.2em] text-white/40">
                  METHODOLOGY & EXECUTION
                </div>
                <p className="md:col-span-8 font-sans text-sm sm:text-base md:text-lg text-white/70 font-light leading-relaxed tracking-wide">
                  {project.creativeDescription}
                </p>
              </div>
            </section>

            {/* 4. Asymmetric Masonry Gallery (Part 2 - Final Images) */}
            {secondHalfImages.length > 0 && (
              <section className="w-full flex flex-col gap-8 md:gap-14">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 md:gap-12 items-start">
                  {secondHalfImages.map((img, idx) => {
                    const isEven = idx % 2 === 0;
                    const isSolo = idx === secondHalfImages.length - 1 && secondHalfImages.length % 2 === 1;

                    let colSpan = isEven ? 'md:col-span-5' : 'md:col-span-7';
                    let aspectClass = isEven ? 'aspect-[3/4] sm:aspect-[4/5]' : 'aspect-[4/3] sm:aspect-[16/11]';

                    if (isSolo) {
                      colSpan = 'md:col-span-12';
                      aspectClass = 'aspect-[16/9] max-h-[75vh]';
                    }

                    return (
                      <div
                        key={`second-${img.id}-${idx}`}
                        className={`w-full ${colSpan} flex flex-col gap-2.5`}
                      >
                        <div className="relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-neutral-900 shadow-lg group">
                          <img
                            src={img.src}
                            alt={`${project.title} final installation view`}
                            loading="lazy"
                            className={`w-full ${aspectClass} object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]`}
                          />
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300 pointer-events-none" />
                        </div>
                        <div className="flex items-center justify-between font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-white/35 px-1">
                          <span>EXP. {String(midpoint + idx + 1).padStart(2, '0')}</span>
                          <span className="truncate max-w-[200px]">{img.originalName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 5. Project Overview Text Section (At End of Gallery) */}
            <section className="w-full bg-neutral-950/80 border border-white/10 rounded-2xl md:rounded-3xl p-6 sm:p-10 md:p-16 flex flex-col gap-5 sm:gap-6">
              <h3 className="font-kanit font-semibold text-2xl sm:text-3xl md:text-5xl uppercase tracking-[-0.02em] text-white leading-tight">
                {project.overviewHeading}
              </h3>

              <p className="font-sans text-sm sm:text-base md:text-lg text-white/70 font-light leading-relaxed max-w-4xl tracking-wide">
                {project.overviewDescription}
              </p>
            </section>

            {/* 6. Sequential Project Navigation & Exit Bar */}
            <nav className="w-full border-t border-white/10 pt-8 sm:pt-12 pb-24 sm:pb-32 flex flex-col sm:flex-row items-center justify-between gap-6">
              <button
                onClick={() => onSelectProject(prevProject)}
                className="group flex items-center gap-3 font-mono text-xs sm:text-sm uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
                <span className="hidden sm:inline">PREVIOUS:</span>
                <span className="text-white font-medium">{prevProject.title}</span>
              </button>

              <button
                onClick={onClose}
                className="font-mono text-xs sm:text-sm uppercase tracking-[0.25em] text-white/60 hover:text-white px-6 py-2.5 rounded-full border border-white/20 hover:border-white/60 bg-white/5 transition-all cursor-pointer"
              >
                RETURN TO ARCHIVE ✕
              </button>

              <button
                onClick={() => onSelectProject(nextProject)}
                className="group flex items-center gap-3 font-mono text-xs sm:text-sm uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <span className="hidden sm:inline">NEXT:</span>
                <span className="text-white font-medium">{nextProject.title}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </nav>
          </div>
        </motion.div>

        {/* Floating Return to Archive Button (Always visible on all pop up views) */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.95 }}
          transition={{ delay: 0.15, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
        >
          <button
            onClick={onClose}
            aria-label="Return to archive"
            className="group flex items-center gap-3 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#0A0A0A]/90 hover:bg-[#F5F5F2] text-[#F5F5F2] hover:text-[#050505] border border-white/20 hover:border-white shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl font-mono text-[11px] sm:text-xs uppercase tracking-[0.22em] font-medium transition-all duration-300 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
            <span>RETURN TO ARCHIVE</span>
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
