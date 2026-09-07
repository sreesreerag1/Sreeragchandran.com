import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '../components/Reveal';
import { PORTFOLIO_PROJECTS, PortfolioProject } from '../data/portfolioProjects';
import { ProjectCaseStudyModal } from '../components/ProjectCaseStudyModal';
import { prefetchUrls, startSelectedWorkPrefetch } from '../utils/imagePrefetcher';

interface OptimizedProjectImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

const OptimizedProjectImage: React.FC<OptimizedProjectImageProps> = ({
  src,
  alt,
  className = '',
  priority = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, [src]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
      {/* Luxury Liquid Glass Shimmer Placeholder */}
      <div
        className={`absolute inset-0 z-0 bg-[#0d0d0d] transition-opacity duration-700 pointer-events-none ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
      </div>

      {/* Actual Image with smooth fade-in */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setIsLoaded(true)}
        className={`${className} transition-all duration-700 ease-out ${
          isLoaded ? 'opacity-100 filter brightness-[0.94]' : 'opacity-0'
        }`}
      />
    </div>
  );
};

interface StickyProjectItem {
  id: string;
  number: string;
  name: string;
  category: string;
  leftImageTop: string;
  leftImageBottom: string;
  rightImageLarge: string;
}

const STICKY_PROJECTS: StickyProjectItem[] = [
  {
    id: 'ai-71-launch',
    number: '01',
    name: 'AI 71 LAUNCH',
    category: 'SPATIAL ARCHITECTURE / CREATIVE DIRECTION',
    leftImageTop: '/images/projects-gallery/ai-71-launch/img-01.jpg',
    leftImageBottom: '/images/projects-gallery/ai-71-launch/img-04.jpg',
    rightImageLarge: '/images/projects-gallery/ai-71-launch/img-03.jpg',
  },
  {
    id: 'a2rl-act-at',
    number: '02',
    name: 'A2RL ACT AT',
    category: 'AUTONOMOUS MOTORSPORT / KINETIC ARCHITECTURE',
    leftImageTop: '/images/projects-gallery/a2rl-act-at/img-01.jpg',
    leftImageBottom: '/images/projects-gallery/a2rl-act-at/img-04.jpg',
    rightImageLarge: '/images/projects-gallery/a2rl-act-at/img-05.jpg',
  },
  {
    id: 'adib-effica',
    number: '03',
    name: 'ADIB EFFICA',
    category: 'PLENARY SCENOGRAPHY / STAGE ARCHITECTURE',
    leftImageTop: '/images/projects-gallery/adib-effica/img-01.jpg',
    leftImageBottom: '/images/projects-gallery/adib-effica/img-04.jpg',
    rightImageLarge: '/images/projects-gallery/adib-effica/img-03.jpg',
  },
  {
    id: 'exhibition-stands',
    number: '04',
    name: 'EXHIBITION STANDS',
    category: 'SPATIAL PAVILIONS / 3D EXHIBITION DESIGN',
    leftImageTop: '/images/projects-gallery/exhibition-stands/img-01.jpg',
    leftImageBottom: '/images/projects-gallery/exhibition-stands/img-02.jpg',
    rightImageLarge: '/images/projects-gallery/exhibition-stands/img-04.jpg',
  },
  {
    id: 'being-human-photo-exhibition',
    number: '05',
    name: 'BEING HUMAN PHOTO EXHIBITION',
    category: 'FINE ART PORTRAITURE / CURATION & DIRECTION',
    leftImageTop: '/images/projects-gallery/being-human-photo-exhibition/img-02.jpg',
    leftImageBottom: '/images/projects-gallery/being-human-photo-exhibition/img-03.jpg',
    rightImageLarge: '/images/projects-gallery/being-human-photo-exhibition/img-01.jpg',
  },
  {
    id: 'ncema',
    number: '06',
    name: 'NCEMA',
    category: 'GLOBAL SUMMIT / ARENA STAGE ARCHITECTURE',
    leftImageTop: '/images/projects-gallery/ncema/img-01.jpg',
    leftImageBottom: '/images/projects-gallery/ncema/img-02.jpg',
    rightImageLarge: '/images/projects-gallery/ncema/img-09.jpg',
  },
  {
    id: 'eduladder',
    number: '07',
    name: 'EDULADDER',
    category: 'BRAND IDENTITY / TYPOGRAPHIC SYSTEMS',
    leftImageTop: '/images/projects-gallery/eduladder/img-01.jpg',
    leftImageBottom: '/images/projects-gallery/eduladder/img-03.jpg',
    rightImageLarge: '/images/projects-gallery/eduladder/img-02.jpg',
  },
  {
    id: 'rta-annual-gathering',
    number: '08',
    name: 'RTA ANNUAL GATHERING',
    category: 'MONUMENTAL INSTALLATION / SCULPTURAL LED',
    leftImageTop: '/images/projects-gallery/rta-annual-gathering/img-06.jpg',
    leftImageBottom: '/images/projects-gallery/rta-annual-gathering/img-07.jpg',
    rightImageLarge: '/images/projects-gallery/rta-annual-gathering/img-04.jpg',
  },
  {
    id: 'tii-ai-summit',
    number: '09',
    name: 'TII AI SUMMIT',
    category: 'TECH PLENARY / DIGITAL SCENOGRAPHY',
    leftImageTop: '/images/projects-gallery/tii-ai-summit/img-01.jpg',
    leftImageBottom: '/images/projects-gallery/tii-ai-summit/img-03.jpg',
    rightImageLarge: '/images/projects-gallery/tii-ai-summit/img-04.jpg',
  },
  {
    id: 'adib-national-day',
    number: '10',
    name: 'ADIB NATIONAL DAY',
    category: 'CULTURAL ARCHITECTURE / EXPERIENTIAL PAVILION',
    leftImageTop: '/images/projects-gallery/adib-national-day/img-02.jpg',
    leftImageBottom: '/images/projects-gallery/adib-national-day/img-03.jpg',
    rightImageLarge: '/images/projects-gallery/adib-national-day/img-01.jpg',
  },
  {
    id: 'ncema-generation-readiness',
    number: '11',
    name: 'NCEMA GENERATION READINESS',
    category: 'INTERACTIVE LEARNING / SPATIAL SCENOGRAPHY',
    leftImageTop: '/images/projects-gallery/ncema-generation-readiness/img-01.jpg',
    leftImageBottom: '/images/projects-gallery/ncema-generation-readiness/img-04.jpg',
    rightImageLarge: '/images/projects-gallery/ncema-generation-readiness/img-06.jpg',
  },
  {
    id: 'sef-2022',
    number: '12',
    name: 'SEF 2022',
    category: 'FESTIVAL MASTERPLANNING / BIOPHILIC DESIGN',
    leftImageTop: '/images/projects-gallery/sef-2022/img-01.jpg',
    leftImageBottom: '/images/projects-gallery/sef-2022/img-06.jpg',
    rightImageLarge: '/images/projects-gallery/sef-2022/img-11.jpg',
  },
  {
    id: 'yfc-photo-campaign',
    number: '13',
    name: 'YFC PHOTO CAMPAIGN',
    category: 'CAMPAIGN DIRECTION / VISUAL STORYTELLING',
    leftImageTop: '/images/projects-gallery/yfc-photo-campaign/img-01.jpg',
    leftImageBottom: '/images/projects-gallery/yfc-photo-campaign/img-03.jpg',
    rightImageLarge: '/images/projects-gallery/yfc-photo-campaign/img-02.jpg',
  },
];

interface StickyCardProps {
  project: StickyProjectItem;
  index: number;
  onOpenModal: (projectId: string) => void;
}

const StickyCard: React.FC<StickyCardProps> = ({ project, index, onOpenModal }) => {
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const isPriority = index <= 2; // Cards 01, 02, and 03 load with highest priority

  const { scrollYProgress } = useScroll({
    target: cardContainerRef,
    offset: ['start end', 'start start'],
  });

  // Lookahead prefetch for cards further down the stack
  useEffect(() => {
    if (isPriority) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          prefetchUrls([
            project.leftImageTop,
            project.leftImageBottom,
            project.rightImageLarge,
          ]);
          observer.disconnect();
        }
      },
      { rootMargin: '1000px 0px' }
    );

    if (cardContainerRef.current) {
      observer.observe(cardContainerRef.current);
    }

    return () => observer.disconnect();
  }, [project, isPriority]);

  // Calculate subtle scaling as cards stack across 13 items
  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    [0.94 + index * 0.004, 1]
  );

  return (
    <div
      ref={cardContainerRef}
      className="sticky top-20 sm:top-24 md:top-28 w-full mb-12 sm:mb-16 md:mb-20 last:mb-0"
      style={{
        zIndex: 10 + index,
      }}
    >
      <motion.div
        style={{ scale }}
        onClick={() => onOpenModal(project.id)}
        data-cursor="project"
        data-cursor-text="VIEW"
        className="group/card cursor-pointer relative w-full h-[85vh] min-h-[560px] max-h-[860px] rounded-3xl md:rounded-[36px] bg-[#0c0c0c]/70 backdrop-blur-2xl border border-white/[0.18] hover:border-white/[0.38] shadow-[0_30px_80px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.25),inset_0_-1px_1px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col p-5 sm:p-7 md:p-10 transition-all duration-500"
      >
        {/* Liquid Glass Top Edge Specular Highlight */}
        <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/45 to-transparent pointer-events-none z-10" />

        {/* Liquid Glass Specular Surface Reflection */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.015] to-transparent pointer-events-none z-0 rounded-3xl md:rounded-[36px]" />

        {/* Liquid Ambient Refraction Glow */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/[0.03] rounded-full blur-3xl pointer-events-none z-0 group-hover/card:bg-white/[0.06] transition-colors duration-700" />

        {/* Card Header */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 md:pb-7 border-b border-white/[0.14] shrink-0">
          <div className="flex items-baseline gap-4 sm:gap-6">
            <span className="font-kanit text-2xl sm:text-3xl md:text-4xl font-light text-white/35 drop-shadow-sm">
              {project.number}
            </span>
            <div>
              <h3 className="font-kanit font-medium text-xl sm:text-2xl md:text-3xl tracking-tight uppercase text-[#F5F5F2] group-hover/card:text-white transition-colors drop-shadow-sm">
                {project.name}
              </h3>
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#A6A6A6] block mt-0.5">
                {project.category}
              </span>
            </div>
          </div>

          {/* View Project Button (Liquid Glass Pill) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal(project.id);
            }}
            data-cursor="project"
            data-cursor-text="VIEW"
            className="group/btn inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.06] hover:bg-[#F5F5F2] hover:text-[#050505] hover:border-white px-4 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-medium tracking-[0.1em] uppercase text-[#F5F5F2] transition-all duration-300 w-fit shrink-0 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_8px_20px_rgba(0,0,0,0.3)]"
          >
            <span>View Project</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:rotate-45 group-hover/btn:scale-110" />
          </button>
        </div>

        {/* Card Body: Image Layout: Left 2 stacked images, Right 1 large image */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 pt-5 md:pt-7 flex-1 min-h-0 overflow-hidden">
          {/* Left: Two Stacked Images (5 cols) */}
          <div className="hidden sm:grid lg:col-span-5 grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6 h-full min-h-0">
            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/[0.18] bg-black/40 backdrop-blur-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_32px_rgba(0,0,0,0.4)] group/img">
              <OptimizedProjectImage
                src={project.leftImageTop}
                alt={`${project.name} detail 1`}
                priority={isPriority}
                className="w-full h-full object-cover group-hover/card:scale-105"
              />
              {/* Liquid Glass Edge Glare */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none z-10" />
            </div>
            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/[0.18] bg-black/40 backdrop-blur-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_32px_rgba(0,0,0,0.4)] group/img">
              <OptimizedProjectImage
                src={project.leftImageBottom}
                alt={`${project.name} detail 2`}
                priority={isPriority}
                className="w-full h-full object-cover group-hover/card:scale-105"
              />
              {/* Liquid Glass Edge Glare */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none z-10" />
            </div>
          </div>

          {/* Right: One Large Image (7 cols) */}
          <div className="lg:col-span-7 h-full min-h-0 relative rounded-2xl md:rounded-3xl overflow-hidden border border-white/[0.18] bg-black/40 backdrop-blur-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_16px_40px_rgba(0,0,0,0.5)] group/img">
            <OptimizedProjectImage
              src={project.rightImageLarge}
              alt={`${project.name} hero`}
              priority={isPriority}
              className="w-full h-full object-cover group-hover/card:scale-105"
            />

            {/* Liquid Glass Top Edge Glare */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-10" />

            {/* Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none z-10" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const ProjectsDarkSection: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          startSelectedWorkPrefetch();
          observer.disconnect();
        }
      },
      { rootMargin: '1200px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleOpenModal = (projectId: string) => {
    const project = PORTFOLIO_PROJECTS.find((p) => p.slug === projectId);
    if (project) {
      setSelectedProject(project);
    }
  };

  return (
    <section
      ref={sectionRef}
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
          {STICKY_PROJECTS.map((project, idx) => (
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
