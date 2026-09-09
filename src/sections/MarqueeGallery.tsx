import React, { useEffect, useRef, useState } from 'react';
import { Reveal } from '../components/Reveal';
import { PORTFOLIO_PROJECTS, PortfolioProject } from '../data/portfolioProjects';
import { ProjectCaseStudyModal } from '../components/ProjectCaseStudyModal';

const ROW_1_CARDS: PortfolioProject[] = PORTFOLIO_PROJECTS.slice(0, 8);
const ROW_2_CARDS: PortfolioProject[] = PORTFOLIO_PROJECTS.slice(8);

export const MarqueeGallery: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animId: number;
    let lastScrollY = window.scrollY || window.pageYOffset;
    let scrollVelocity = 0;

    // Offsets for rows: Row 1 moves right (x increases), Row 2 moves left (x decreases)
    let offset1 = -800;
    let offset2 = 0;

    const baseSpeed = 0.55;

    const handleScroll = () => {
      const currentScrollY = window.scrollY || window.pageYOffset;
      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;
      scrollVelocity += delta * 0.08;
      // Cap scroll velocity so fast scroll flings don't cause jitter or visual skips
      scrollVelocity = Math.max(-25, Math.min(25, scrollVelocity));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    const animate = () => {
      // Damping on scroll velocity
      scrollVelocity *= 0.92;

      // Row 1 moves right (+)
      offset1 += baseSpeed + scrollVelocity;
      // Row 2 moves left (-)
      offset2 -= baseSpeed + scrollVelocity;

      // Loop boundaries for infinite scroll illusion
      const loopWidth1 = row1Ref.current ? row1Ref.current.scrollWidth / 3 : 3136;
      const loopWidth2 = row2Ref.current ? row2Ref.current.scrollWidth / 3 : 2688;

      while (offset1 > 0) offset1 -= loopWidth1;
      while (offset1 < -loopWidth1) offset1 += loopWidth1;

      while (offset2 < -loopWidth2) offset2 += loopWidth2;
      while (offset2 > 0) offset2 -= loopWidth2;

      if (row1Ref.current) {
        row1Ref.current.style.transform = `translate3d(${offset1.toFixed(2)}px, 0, 0)`;
      }
      if (row2Ref.current) {
        row2Ref.current.style.transform = `translate3d(${offset2.toFixed(2)}px, 0, 0)`;
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Triple items for infinite seamlessly repeating rows
  const displayRow1 = [...ROW_1_CARDS, ...ROW_1_CARDS, ...ROW_1_CARDS];
  const displayRow2 = [...ROW_2_CARDS, ...ROW_2_CARDS, ...ROW_2_CARDS];

  return (
    <section
      id="works"
      ref={sectionRef}
      className="relative z-20 w-full bg-[#050505] text-[#F5F5F2] py-20 sm:py-28 md:py-36 overflow-hidden border-t border-white/[0.15]"
    >
      {/* Section Header */}
      <div className="mx-auto max-w-7xl px-5 sm:px-8 md:px-14 lg:px-16 mb-12 sm:mb-16 md:mb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/[0.15]">
          <div>
            <Reveal delay={100}>
              <h2 className="font-kanit font-semibold text-3xl sm:text-5xl md:text-6xl tracking-[-0.03em] uppercase leading-[1.05] text-[#F5F5F2]">
                WORK
              </h2>
            </Reveal>
          </div>

          <Reveal delay={180}>
            <div className="flex flex-col md:text-right max-w-sm">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#707070] font-semibold mb-1">
                PORTFOLIO ARCHIVE
              </span>
              <p className="font-sans text-xs sm:text-sm text-[#A6A6A6] font-light leading-relaxed">
                Curated projects spanning brand systems, live activations, and visual storytelling.
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Two-Row Moving Marquee Container */}
      <div className="flex flex-col gap-6 sm:gap-8 w-full">
        {/* ROW 1: MOVES RIGHT */}
        <div className="relative w-full overflow-hidden">
          <div
            ref={row1Ref}
            className="flex gap-5 sm:gap-6 md:gap-7 will-change-transform"
            style={{ width: 'max-content' }}
          >
            {displayRow1.map((item, idx) => (
              <button
                type="button"
                key={`r1-${item.id}-${idx}`}
                onClick={() => setSelectedProject(item)}
                data-cursor="project"
                data-cursor-text="VIEW"
                className="group relative w-[320px] sm:w-[380px] md:w-[420px] h-[200px] sm:h-[240px] md:h-[270px] rounded-2xl overflow-hidden bg-[#0B0B0B] border border-white/[0.15] hover:border-[#C8C1B5]/40 shadow-2xl shrink-0 cursor-pointer transition-all duration-500 hover:-translate-y-1 text-left"
                aria-label={`Open case study for ${item.title}`}
              >
                {/* Background Image - Uncropped contain */}
                <div className="w-full h-full flex items-center justify-center bg-[#070707] p-2">
                  <img
                    src={item.thumbnail}
                    alt={`${item.title} - ${item.subtitle}`}
                    loading="lazy"
                    className="w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02] filter brightness-[0.92] group-hover:brightness-100"
                  />
                </div>

                {/* Subtle gradient behind text for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/95 via-black/35 to-transparent pointer-events-none" />

                {/* Card Content Overlay - Minimal Visual Project Tile */}
                <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-end text-white pointer-events-none">
                  <div className="flex items-end justify-between gap-3">
                    <div className="flex flex-col min-w-0 pr-2">
                      {/* Project Subheading / Brand */}
                      {item.subtitle && (
                        <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-[#A6A6A6] truncate font-normal mb-1">
                          {item.subtitle}
                        </span>
                      )}
                      {/* Project Title: Primary typography */}
                      <h3 className="font-kanit font-medium text-sm sm:text-base md:text-lg uppercase tracking-wider text-[#F5F5F2] leading-snug truncate">
                        {item.title}
                      </h3>
                    </div>

                    {/* Minimal hover indicator: VIEW PROJECT → (only shown on hover) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 group-hover:translate-x-0 shrink-0">
                      <span className="font-mono text-[10px] sm:text-xs tracking-[0.18em] uppercase text-[#C8C1B5] font-medium whitespace-nowrap">
                        VIEW PROJECT →
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ROW 2: MOVES LEFT */}
        <div className="relative w-full overflow-hidden">
          <div
            ref={row2Ref}
            className="flex gap-5 sm:gap-6 md:gap-7 will-change-transform"
            style={{ width: 'max-content' }}
          >
            {displayRow2.map((item, idx) => (
              <button
                type="button"
                key={`r2-${item.id}-${idx}`}
                onClick={() => setSelectedProject(item)}
                data-cursor="project"
                data-cursor-text="VIEW"
                className="group relative w-[320px] sm:w-[380px] md:w-[420px] h-[200px] sm:h-[240px] md:h-[270px] rounded-2xl overflow-hidden bg-[#0B0B0B] border border-white/[0.15] hover:border-[#C8C1B5]/40 shadow-2xl shrink-0 cursor-pointer transition-all duration-500 hover:-translate-y-1 text-left"
                aria-label={`Open case study for ${item.title}`}
              >
                {/* Background Image - Uncropped contain */}
                <div className="w-full h-full flex items-center justify-center bg-[#070707] p-2">
                  <img
                    src={item.thumbnail}
                    alt={`${item.title} - ${item.subtitle}`}
                    loading="lazy"
                    className="w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02] filter brightness-[0.92] group-hover:brightness-100"
                  />
                </div>

                {/* Subtle gradient behind text for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/95 via-black/35 to-transparent pointer-events-none" />

                {/* Card Content Overlay - Minimal Visual Project Tile */}
                <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-end text-white pointer-events-none">
                  <div className="flex items-end justify-between gap-3">
                    <div className="flex flex-col min-w-0 pr-2">
                      {/* Project Subheading / Brand */}
                      {item.subtitle && (
                        <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-[#A6A6A6] truncate font-normal mb-1">
                          {item.subtitle}
                        </span>
                      )}
                      {/* Project Title: Primary typography */}
                      <h3 className="font-kanit font-medium text-sm sm:text-base md:text-lg uppercase tracking-wider text-[#F5F5F2] leading-snug truncate">
                        {item.title}
                      </h3>
                    </div>

                    {/* Minimal hover indicator: VIEW PROJECT → (only shown on hover) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 group-hover:translate-x-0 shrink-0">
                      <span className="font-mono text-[10px] sm:text-xs tracking-[0.18em] uppercase text-[#C8C1B5] font-medium whitespace-nowrap">
                        VIEW PROJECT →
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cinematic Full-Screen Project Case Study Modal */}
      <ProjectCaseStudyModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onSelectProject={setSelectedProject}
        allProjects={PORTFOLIO_PROJECTS}
      />
    </section>
  );
};

export default MarqueeGallery;
