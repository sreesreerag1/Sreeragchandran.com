import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { PortfolioProject, ProjectImageItem } from '../data/portfolioProjects';

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
  const currentIndex = allProjects.findIndex((p) => p.slug === project.slug || p.id === project.id);
  const prevProject =
    currentIndex > 0 ? allProjects[currentIndex - 1] : allProjects[allProjects.length - 1];
  const nextProject =
    currentIndex < allProjects.length - 1 ? allProjects[currentIndex + 1] : allProjects[0];

  const heroImage = project.galleryImages[0];
  const remainingImages = project.galleryImages.slice(1);

  // Helper to render uncropped gallery images with editorial rhythm
  const renderEditorialGallery = (images: ProjectImageItem[]) => {
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < images.length) {
      const current = images[i];
      const next = images[i + 1];

      // If last single image or wide panorama
      if (!next || current.aspectRatio > 1.8) {
        elements.push(
          <div key={current.id} className="col-span-12 w-full">
            <div className="w-full relative overflow-hidden rounded-xl md:rounded-3xl border border-white/10 bg-[#080808] shadow-2xl flex items-center justify-center p-2 sm:p-4 group">
              <img
                src={current.src}
                alt={`${project.title} - ${current.filename}`}
                loading="lazy"
                decoding="async"
                className="w-auto max-w-full max-h-[85vh] h-auto object-contain mx-auto transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />
            </div>
          </div>
        );
        i += 1;
        continue;
      }

      // If both are portraits: 2-column balanced layout with uncropped contain
      if (current.orientation === 'portrait' && next.orientation === 'portrait') {
        elements.push(
          <div key={`pair-${current.id}-${next.id}`} className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 items-stretch">
            <div className="w-full relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-[#080808] shadow-lg flex items-center justify-center p-2 sm:p-4 group">
              <img
                src={current.src}
                alt={`${project.title} - ${current.filename}`}
                loading="lazy"
                decoding="async"
                className="w-auto max-w-full max-h-[82vh] h-auto object-contain mx-auto transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />
            </div>
            <div className="w-full relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-[#080808] shadow-lg flex items-center justify-center p-2 sm:p-4 group">
              <img
                src={next.src}
                alt={`${project.title} - ${next.filename}`}
                loading="lazy"
                decoding="async"
                className="w-auto max-w-full max-h-[82vh] h-auto object-contain mx-auto transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />
            </div>
          </div>
        );
        i += 2;
        continue;
      }

      // If one portrait and one landscape: asymmetric layout (5 cols + 7 cols)
      if (current.orientation === 'portrait' && next.orientation !== 'portrait') {
        elements.push(
          <div key={`asym-${current.id}-${next.id}`} className="col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 md:gap-10 items-stretch">
            <div className="md:col-span-5 w-full relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-[#080808] shadow-lg flex items-center justify-center p-2 sm:p-4 group">
              <img
                src={current.src}
                alt={`${project.title} - ${current.filename}`}
                loading="lazy"
                decoding="async"
                className="w-auto max-w-full max-h-[80vh] h-auto object-contain mx-auto transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />
            </div>
            <div className="md:col-span-7 w-full relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-[#080808] shadow-lg flex items-center justify-center p-2 sm:p-4 group">
              <img
                src={next.src}
                alt={`${project.title} - ${next.filename}`}
                loading="lazy"
                decoding="async"
                className="w-auto max-w-full max-h-[80vh] h-auto object-contain mx-auto transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />
            </div>
          </div>
        );
        i += 2;
        continue;
      }

      if (current.orientation !== 'portrait' && next.orientation === 'portrait') {
        elements.push(
          <div key={`asym-${current.id}-${next.id}`} className="col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 md:gap-10 items-stretch">
            <div className="md:col-span-7 w-full relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-[#080808] shadow-lg flex items-center justify-center p-2 sm:p-4 group">
              <img
                src={current.src}
                alt={`${project.title} - ${current.filename}`}
                loading="lazy"
                decoding="async"
                className="w-auto max-w-full max-h-[80vh] h-auto object-contain mx-auto transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />
            </div>
            <div className="md:col-span-5 w-full relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-[#080808] shadow-lg flex items-center justify-center p-2 sm:p-4 group">
              <img
                src={next.src}
                alt={`${project.title} - ${next.filename}`}
                loading="lazy"
                decoding="async"
                className="w-auto max-w-full max-h-[80vh] h-auto object-contain mx-auto transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />
            </div>
          </div>
        );
        i += 2;
        continue;
      }

      // Default pair: 2 columns uncropped
      const isEven = Math.floor(i / 2) % 2 === 0;
      const leftCol = isEven ? 'md:col-span-7' : 'md:col-span-5';
      const rightCol = isEven ? 'md:col-span-5' : 'md:col-span-7';

      elements.push(
        <div key={`pair-${current.id}-${next.id}`} className="col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 md:gap-10 items-stretch">
          <div className={`${leftCol} w-full relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-[#080808] shadow-lg flex items-center justify-center p-2 sm:p-4 group`}>
            <img
              src={current.src}
              alt={`${project.title} - ${current.filename}`}
              loading="lazy"
              decoding="async"
              className="w-auto max-w-full max-h-[80vh] h-auto object-contain mx-auto transition-transform duration-700 ease-out group-hover:scale-[1.01]"
            />
          </div>
          <div className={`${rightCol} w-full relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-[#080808] shadow-lg flex items-center justify-center p-2 sm:p-4 group`}>
            <img
              src={next.src}
              alt={`${project.title} - ${next.filename}`}
              loading="lazy"
              decoding="async"
              className="w-auto max-w-full max-h-[80vh] h-auto object-contain mx-auto transition-transform duration-700 ease-out group-hover:scale-[1.01]"
            />
          </div>
        </div>
      );
      i += 2;
    }

    return elements;
  };

  return (
    <AnimatePresence>
      <motion.div
        key="project-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex flex-col bg-[#050505]/98 backdrop-blur-2xl text-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-project-title"
      >
        {/* Always Floating Persistent Close Button */}
        <div className="fixed top-3.5 right-4 sm:top-4 sm:right-6 md:top-5 md:right-8 z-[70] pointer-events-auto">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close project modal and go back"
            className="group flex items-center gap-2 rounded-full border border-white/30 bg-[#0a0a0a]/90 hover:bg-[#F5F5F2] hover:text-[#050505] text-[#F5F5F2] backdrop-blur-xl px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-[13px] font-mono tracking-[0.18em] uppercase font-semibold transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.85)] hover:shadow-[0_12px_36px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
            <span>CLOSE</span>
            <X className="w-3.5 h-3.5 opacity-75 transition-transform duration-200 group-hover:rotate-90" />
          </button>
        </div>

        {/* Sticky Header */}
        <header className="sticky top-0 z-40 w-full bg-[#050505]/95 backdrop-blur-xl border-b border-white/15 px-5 sm:px-8 md:px-14 lg:px-16 py-4 sm:py-5 transition-all shadow-xl">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pr-24 sm:pr-32">
            {/* LEFT: TITLE + SUBHEADING */}
            <div className="flex flex-col min-w-0 pr-4">
              <h2
                id="modal-project-title"
                className="font-kanit font-semibold text-xl sm:text-2xl md:text-3xl lg:text-4xl uppercase tracking-[-0.02em] text-white truncate"
              >
                {project.title}
              </h2>
              {project.subtitle && (
                <span className="font-mono text-xs sm:text-sm uppercase tracking-[0.2em] text-white/50 mt-1">
                  {project.subtitle}
                </span>
              )}
            </div>

            {/* RIGHT: COPYRIGHT NOTE */}
            {project.copyright && (
              <div className="shrink-0 max-w-sm">
                <p
                  className="text-white/60 font-sans text-left md:text-right select-none leading-snug"
                  style={{
                    fontSize: 'clamp(9px, 0.65vw, 11px)',
                  }}
                >
                  {project.copyright}
                </p>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Body */}
        <motion.div
          ref={scrollContainerRef}
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-14 lg:px-16 py-8 sm:py-12 md:py-16 flex flex-col gap-10 sm:gap-14 md:gap-20">
            {/* 1. Large Hero Image (Uncropped, Full Visual) */}
            {heroImage && (
              <section className="w-full">
                <div className="w-full relative overflow-hidden rounded-xl md:rounded-3xl border border-white/10 bg-[#080808] shadow-2xl flex items-center justify-center p-2 sm:p-4 md:p-6">
                  <img
                    src={heroImage.src}
                    alt={`${project.title} - ${heroImage.filename}`}
                    loading="eager"
                    decoding="async"
                    className="w-auto max-w-full max-h-[85vh] h-auto object-contain mx-auto"
                  />
                </div>
              </section>
            )}

            {/* 2. Editorial Gallery of all remaining non-thumbnail images (Uncropped) */}
            {remainingImages.length > 0 && (
              <section className="w-full flex flex-col gap-8 md:gap-12">
                <div className="grid grid-cols-12 gap-6 sm:gap-8 md:gap-10 items-stretch">
                  {renderEditorialGallery(remainingImages)}
                </div>
              </section>
            )}

            {/* 3. Bottom Return to Works Button */}
            <div className="w-full flex justify-center pt-6 pb-2">
              <button
                type="button"
                onClick={onClose}
                className="group inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/10 hover:bg-[#F5F5F2] hover:text-[#050505] text-[#F5F5F2] px-8 py-3.5 text-xs sm:text-sm font-mono tracking-[0.2em] uppercase font-medium transition-all duration-300 shadow-2xl active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
                <span>CLOSE & RETURN TO WORKS</span>
                <X className="w-3.5 h-3.5 opacity-70 ml-1" />
              </button>
            </div>

            {/* 4. Sequential Project Navigation */}
            <nav className="w-full border-t border-white/10 pt-8 sm:pt-10 pb-20 sm:pb-28 flex flex-col sm:flex-row items-center justify-between gap-6">
              <button
                type="button"
                onClick={() => onSelectProject(prevProject)}
                className="group flex items-center gap-3 font-mono text-xs sm:text-sm uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
                <span>PREV: {prevProject.title}</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectProject(nextProject)}
                className="group flex items-center gap-3 font-mono text-xs sm:text-sm uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <span>NEXT: {nextProject.title}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </nav>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProjectCaseStudyModal;
