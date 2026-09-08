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

  // Helper to render uncropped gallery images with full-screen editorial rhythm
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
            <div className="w-full relative overflow-hidden rounded-xl md:rounded-3xl border border-white/10 bg-[#080808] shadow-2xl flex items-center justify-center p-2 sm:p-4 md:p-6 group">
              <img
                src={current.src}
                alt={`${project.title} - ${current.filename}`}
                loading="lazy"
                decoding="async"
                className="w-full max-h-[92vh] h-auto object-contain mx-auto transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />
            </div>
          </div>
        );
        i += 1;
        continue;
      }

      // If both are portraits: 2-column balanced layout filling full width uncropped
      if (current.orientation === 'portrait' && next.orientation === 'portrait') {
        elements.push(
          <div key={`pair-${current.id}-${next.id}`} className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 items-stretch">
            <div className="w-full relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-[#080808] shadow-lg flex items-center justify-center p-2 sm:p-4 group">
              <img
                src={current.src}
                alt={`${project.title} - ${current.filename}`}
                loading="lazy"
                decoding="async"
                className="w-full max-h-[88vh] h-auto object-contain mx-auto transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />
            </div>
            <div className="w-full relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-[#080808] shadow-lg flex items-center justify-center p-2 sm:p-4 group">
              <img
                src={next.src}
                alt={`${project.title} - ${next.filename}`}
                loading="lazy"
                decoding="async"
                className="w-full max-h-[88vh] h-auto object-contain mx-auto transition-transform duration-700 ease-out group-hover:scale-[1.01]"
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
                className="w-full max-h-[88vh] h-auto object-contain mx-auto transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />
            </div>
            <div className="md:col-span-7 w-full relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-[#080808] shadow-lg flex items-center justify-center p-2 sm:p-4 group">
              <img
                src={next.src}
                alt={`${project.title} - ${next.filename}`}
                loading="lazy"
                decoding="async"
                className="w-full max-h-[88vh] h-auto object-contain mx-auto transition-transform duration-700 ease-out group-hover:scale-[1.01]"
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
                className="w-full max-h-[88vh] h-auto object-contain mx-auto transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />
            </div>
            <div className="md:col-span-5 w-full relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-[#080808] shadow-lg flex items-center justify-center p-2 sm:p-4 group">
              <img
                src={next.src}
                alt={`${project.title} - ${next.filename}`}
                loading="lazy"
                decoding="async"
                className="w-full max-h-[88vh] h-auto object-contain mx-auto transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />
            </div>
          </div>
        );
        i += 2;
        continue;
      }

      // Default pair: 2 equal or balanced columns taking full width
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
              className="w-full max-h-[88vh] h-auto object-contain mx-auto transition-transform duration-700 ease-out group-hover:scale-[1.01]"
            />
          </div>
          <div className={`${rightCol} w-full relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-[#080808] shadow-lg flex items-center justify-center p-2 sm:p-4 group`}>
            <img
              src={next.src}
              alt={`${project.title} - ${next.filename}`}
              loading="lazy"
              decoding="async"
              className="w-full max-h-[88vh] h-auto object-contain mx-auto transition-transform duration-700 ease-out group-hover:scale-[1.01]"
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
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex flex-col bg-[#050505] text-white overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-project-title"
      >
        {/* ALWAYS-FLOATING PROMINENT CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal and return to works"
          className="fixed top-4 right-4 sm:top-5 sm:right-7 md:top-6 md:right-10 z-[100] flex items-center gap-2.5 rounded-full bg-white text-black hover:bg-[#EAEAEA] active:scale-95 px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-mono tracking-[0.2em] uppercase font-bold shadow-[0_10px_35px_rgba(0,0,0,0.9),0_0_25px_rgba(255,255,255,0.25)] transition-all duration-200 cursor-pointer pointer-events-auto hover:scale-105"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
          <span>CLOSE</span>
        </button>

        {/* Sticky Header - Full Screen Width */}
        <header className="sticky top-0 z-40 w-full bg-[#050505]/95 backdrop-blur-xl border-b border-white/15 px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-4 sm:py-5 transition-all shadow-xl">
          <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pr-32 sm:pr-44">
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

            {/* RIGHT: COPYRIGHT ATTRIBUTION */}
            {project.copyright && (
              <div className="shrink-0 max-w-sm md:max-w-md">
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

        {/* Scrollable Body - Full Screen Width */}
        <motion.div
          ref={scrollContainerRef}
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth w-full"
        >
          <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-8 sm:py-12 md:py-16 flex flex-col gap-10 sm:gap-14 md:gap-20">
            {/* 1. Large Hero Image (Full Width, Uncropped) */}
            {heroImage && (
              <section className="w-full">
                <div className="w-full relative overflow-hidden rounded-xl md:rounded-3xl border border-white/10 bg-[#080808] shadow-2xl flex items-center justify-center p-2 sm:p-4 md:p-6">
                  <img
                    src={heroImage.src}
                    alt={`${project.title} - ${heroImage.filename}`}
                    loading="eager"
                    decoding="async"
                    className="w-full max-h-[92vh] h-auto object-contain mx-auto"
                  />
                </div>
              </section>
            )}

            {/* 2. Editorial Gallery of all remaining non-thumbnail images (Full Width, Uncropped) */}
            {remainingImages.length > 0 && (
              <section className="w-full flex flex-col gap-8 md:gap-12">
                <div className="grid grid-cols-12 gap-6 sm:gap-8 md:gap-10 items-stretch">
                  {renderEditorialGallery(remainingImages)}
                </div>
              </section>
            )}

            {/* 3. Bottom Close & Return to Works Button */}
            <div className="w-full flex justify-center pt-8 pb-4">
              <button
                type="button"
                onClick={onClose}
                className="group inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/10 hover:bg-white hover:text-black text-white px-8 py-4 text-xs sm:text-sm font-mono tracking-[0.2em] uppercase font-bold transition-all duration-300 shadow-2xl active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
                <span>CLOSE & RETURN TO WORKS</span>
                <X className="w-4 h-4 opacity-70 ml-1" />
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
