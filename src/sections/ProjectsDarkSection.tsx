import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '../components/Reveal';
import { PORTFOLIO_PROJECTS, PortfolioProject } from '../data/portfolioProjects';
import { ProjectCaseStudyModal } from '../components/ProjectCaseStudyModal';
import { ProgressiveImage } from '../components/ProgressiveImage';

interface StickyCardProps {
  project: PortfolioProject;
  index: number;
  onOpenModal: (projectId: string) => void;
}

const StickyCard: React.FC<StickyCardProps> = ({ project, index, onOpenModal }) => {
  const cardContainerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: cardContainerRef,
    offset: ['start end', 'start start'],
  });

  // Calculate subtle scaling as cards stack across 15 items
  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    [0.94 + index * 0.0035, 1]
  );

  const isTopCard = index < 2;
  const images = project.galleryImages;

  const renderCardCollage = () => {
    if (!images || images.length === 0) return null;

    const primary = images[0];
    const secondary = images[1];
    const tertiary = images[2];
    const moreCount = images.length > 3 ? images.length - 3 : 0;

    // Case A: Square-dominant projects (e.g. ACTIVE & EARN, PHOTO CAMPAIGN)
    const isSquareDominant = images.slice(0, 4).every((img) => img.orientation === 'square');
    if (isSquareDominant && images.length >= 3) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 pt-5 md:pt-7 flex-1 min-h-0 overflow-hidden">
          {/* Left: Featured Large Square (6 cols) */}
          <div className="lg:col-span-6 h-full min-h-0 relative rounded-2xl md:rounded-3xl overflow-hidden border border-white/[0.15] bg-[#070707] flex items-center justify-center p-2 sm:p-4">
            <ProgressiveImage
              src={primary.src}
              alt={`${project.title} featured`}
              aspectRatio={primary.aspectRatio}
              loading={isTopCard ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={index === 0 ? 'high' : 'auto'}
              isCardPreview={true}
              className="group-hover/card:scale-[1.02] transition-transform duration-700"
            />
          </div>

          {/* Right: Supporting Grid of detail squares (6 cols) */}
          <div className="hidden lg:grid lg:col-span-6 grid-cols-2 gap-4 sm:gap-6 h-full min-h-0">
            {images.slice(1, 5).map((img, i) => (
              <div key={img.id} className="relative w-full h-full rounded-2xl overflow-hidden border border-white/[0.15] bg-[#070707] flex items-center justify-center p-2">
                <ProgressiveImage
                  src={img.src}
                  alt={`${project.title} detail ${i + 1}`}
                  aspectRatio={img.aspectRatio}
                  loading="lazy"
                  decoding="async"
                  isCardPreview={true}
                  className="group-hover/card:scale-[1.02] transition-transform duration-700"
                />
                {i === 3 && images.length > 5 && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center pointer-events-none z-10">
                    <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#F5F5F2] font-semibold">
                      +{images.length - 5} MORE
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Case B: Portrait-rich projects (e.g. BEING HUMAN, SIP FRESH FEEL ALIVE)
    // Requires at least 2 portraits so the left 2-column grid is completely filled without empty voids
    const portraitImages = images.filter((img) => img.orientation === 'portrait');
    if (portraitImages.length >= 2 && images.length >= 3) {
      const landscapeImages = images.filter((img) => img.orientation !== 'portrait');
      const portraitsToDisplay = portraitImages.slice(0, 2);
      const heroImg =
        landscapeImages.length > 0
          ? landscapeImages[0]
          : images.find((img) => !portraitsToDisplay.some((p) => p.id === img.id)) || primary;

      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 pt-5 md:pt-7 flex-1 min-h-0 overflow-hidden">
          {/* Left: 2 Paired Vertical Portraits (5 cols) */}
          <div className="hidden lg:grid lg:col-span-5 grid-cols-2 gap-4 sm:gap-6 h-full min-h-0">
            {portraitsToDisplay.map((pImg, pIdx) => (
              <div key={pImg.id} className="relative w-full h-full rounded-2xl overflow-hidden border border-white/[0.15] bg-[#070707] flex items-center justify-center p-2">
                <ProgressiveImage
                  src={pImg.src}
                  alt={`${project.title} portrait ${pIdx + 1}`}
                  aspectRatio={pImg.aspectRatio}
                  loading="lazy"
                  decoding="async"
                  isCardPreview={true}
                  className="group-hover/card:scale-[1.02] transition-transform duration-700"
                />
              </div>
            ))}
          </div>

          {/* Right: Key Hero Visual (7 cols) */}
          <div className="lg:col-span-7 h-full min-h-0 relative rounded-2xl md:rounded-3xl overflow-hidden border border-white/[0.15] bg-[#070707] flex items-center justify-center p-2 sm:p-4">
            <ProgressiveImage
              src={heroImg.src}
              alt={`${project.title} hero`}
              aspectRatio={heroImg.aspectRatio}
              loading={isTopCard ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={index === 0 ? 'high' : 'auto'}
              isCardPreview={true}
              className="group-hover/card:scale-[1.02] transition-transform duration-700"
            />
            {moreCount > 0 && (
              <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full pointer-events-none z-10">
                <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.18em] text-[#C8C1B5]">
                  +{moreCount} MORE SHOTS
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Case C: Standard Landscape-Dominant projects (Default editorial layout)
    const leftTop = secondary || primary;
    const leftBottom = tertiary || secondary || primary;
    const rightHero = primary;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 pt-5 md:pt-7 flex-1 min-h-0 overflow-hidden">
        {/* Left: Two Stacked Images (5 cols) */}
        <div className="hidden lg:grid lg:col-span-5 grid-cols-1 gap-4 sm:gap-6 h-full min-h-0">
          <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/[0.15] bg-[#070707] flex items-center justify-center p-2">
            <ProgressiveImage
              src={leftTop.src}
              alt={`${project.title} detail 1`}
              aspectRatio={leftTop.aspectRatio}
              loading="lazy"
              decoding="async"
              isCardPreview={true}
              className="group-hover/card:scale-[1.02] transition-transform duration-700"
            />
          </div>
          <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/[0.15] bg-[#070707] flex items-center justify-center p-2">
            <ProgressiveImage
              src={leftBottom.src}
              alt={`${project.title} detail 2`}
              aspectRatio={leftBottom.aspectRatio}
              loading="lazy"
              decoding="async"
              isCardPreview={true}
              className="group-hover/card:scale-[1.02] transition-transform duration-700"
            />
            {moreCount > 0 && (
              <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full pointer-events-none z-10">
                <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-[#C8C1B5] font-medium">
                  +{moreCount} MORE SHOTS
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: One Large Hero Image (7 cols) */}
        <div className="lg:col-span-7 h-full min-h-0 relative rounded-2xl md:rounded-3xl overflow-hidden border border-white/[0.15] bg-[#070707] flex items-center justify-center p-2 sm:p-4">
          <ProgressiveImage
            src={rightHero.src}
            alt={`${project.title} hero`}
            aspectRatio={rightHero.aspectRatio}
            loading={isTopCard ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={index === 0 ? 'high' : 'auto'}
            isCardPreview={true}
            className="group-hover/card:scale-[1.02] transition-transform duration-700"
          />
        </div>
      </div>
    );
  };

  return (
    <div
      ref={cardContainerRef}
      className="sticky top-16 sm:top-20 md:top-24 w-full mb-12 sm:mb-16 md:mb-20 last:mb-0"
      style={{
        zIndex: 10 + index,
      }}
    >
      <motion.div
        style={{ scale }}
        onClick={() => onOpenModal(project.slug)}
        data-cursor="project"
        data-cursor-text="VIEW"
        className="group/card cursor-pointer relative w-full h-[78vh] sm:h-[80vh] md:h-[82vh] min-h-[460px] sm:min-h-[500px] max-h-[820px] rounded-3xl md:rounded-[36px] bg-[#0c0c0c] border border-white/[0.15] hover:border-[#C8C1B5]/40 shadow-2xl overflow-hidden flex flex-col p-5 sm:p-7 md:p-10 transition-colors duration-300 transform-gpu"
      >
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 md:pb-6 border-b border-white/[0.15] shrink-0">
          {/* LEFT: Project Number + SUBTITLE + TITLE + DISCIPLINES */}
          <div className="flex items-baseline gap-4 sm:gap-6 min-w-0">
            <span className="font-kanit text-2xl sm:text-3xl md:text-4xl font-light text-white/[0.2] shrink-0">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              {project.subtitle && (
                <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#A6A6A6] block truncate mb-1">
                  {project.subtitle}
                </span>
              )}
              <h3 className="font-kanit font-medium text-xl sm:text-2xl md:text-3xl tracking-tight uppercase text-[#F5F5F2] group-hover/card:text-[#C8C1B5] transition-colors truncate">
                {project.title}
              </h3>
              {project.disciplines && project.disciplines.length > 0 && (
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {project.disciplines.map((discipline, dIdx) => (
                    <React.Fragment key={discipline}>
                      <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.14em] text-[#C8C1B5]/80 font-normal">
                        {discipline}
                      </span>
                      {dIdx < project.disciplines!.length - 1 && (
                        <span className="text-white/20 text-[9px] select-none">•</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: COPYRIGHT NOTE + VIEW PROJECT BUTTON */}
          <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end shrink-0">
            {project.copyright && (
              <p
                className="hidden md:block text-[#A6A6A6] font-sans text-right select-none leading-snug"
                style={{
                  fontSize: 'clamp(9px, 0.65vw, 11px)',
                  opacity: 0.55,
                  maxWidth: '320px',
                }}
              >
                {project.copyright}
              </p>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenModal(project.slug);
              }}
              data-cursor="project"
              data-cursor-text="VIEW"
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] hover:bg-[#F5F5F2] hover:text-[#050505] px-4 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-medium tracking-[0.1em] uppercase text-[#F5F5F2] transition-all duration-300 w-fit shrink-0 backdrop-blur-md"
            >
              <span>View Project</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110" />
            </button>
          </div>
        </div>

        {/* Mobile copyright notice */}
        {project.copyright && (
          <div className="md:hidden pt-2 shrink-0">
            <p
              className="text-[#A6A6A6] font-sans text-[9px] leading-tight select-none opacity-55 text-left"
              style={{ maxWidth: '340px' }}
            >
              {project.copyright}
            </p>
          </div>
        )}

        {/* Card Body: Dynamic Aspect-Ratio Aware Editorial Collage */}
        {renderCardCollage()}
      </motion.div>
    </div>
  );
};

export const ProjectsDarkSection: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);

  const handleOpenModal = (projectId: string) => {
    const project = PORTFOLIO_PROJECTS.find((p) => p.slug === projectId || p.id === projectId);
    if (project) {
      setSelectedProject(project);
    }
  };

  return (
    <section
      id="projects"
      className="relative z-30 w-full bg-[#050505] text-[#F5F5F2] pt-24 sm:pt-36 md:pt-48 pb-28 sm:pb-40 px-5 sm:px-8 md:px-14 lg:px-16 border-t border-white/[0.15]"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-12 sm:pb-16 md:pb-20 border-b border-white/[0.15] mb-12 sm:mb-16 md:mb-20 gap-6">
          <div>
            <Reveal delay={100}>
              <h2 className="font-kanit font-semibold text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-[-0.03em] uppercase leading-[1.0] text-[#F5F5F2]">
                SELECTED WORK
              </h2>
            </Reveal>
          </div>

          <Reveal delay={180}>
            <div className="flex flex-col md:text-right max-w-sm">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#707070] font-semibold mb-1">
                CURATED CASE STUDIES
              </span>
              <p className="font-sans text-xs sm:text-sm text-[#A6A6A6] font-light leading-relaxed">
                A collection of ideas, campaigns and experiences created across brands, spaces and platforms.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Sticky Stacking Cards Container */}
        <div className="relative w-full">
          {PORTFOLIO_PROJECTS.map((project, idx) => (
            <StickyCard
              key={project.id}
              project={project}
              index={idx}
              onOpenModal={handleOpenModal}
            />
          ))}
        </div>
      </div>

      {/* Case Study Fullscreen Modal */}
      <ProjectCaseStudyModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onSelectProject={setSelectedProject}
        allProjects={PORTFOLIO_PROJECTS}
      />
    </section>
  );
};

export default ProjectsDarkSection;
