import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '../components/Reveal';
import { PORTFOLIO_PROJECTS, PortfolioProject } from '../data/portfolioProjects';
import { ProjectCaseStudyModal } from '../components/ProjectCaseStudyModal';

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

  const { scrollYProgress } = useScroll({
    target: cardContainerRef,
    offset: ['start end', 'start start'],
  });

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
        className="group/card cursor-pointer relative w-full h-[85vh] min-h-[560px] max-h-[860px] rounded-3xl md:rounded-[36px] bg-[#0B0B0B] border border-white/[0.15] shadow-[0_24px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col p-5 sm:p-7 md:p-10 transition-colors hover:border-white/30"
      >
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 md:pb-7 border-b border-white/[0.15] shrink-0">
          <div className="flex items-baseline gap-4 sm:gap-6">
            <span className="font-kanit text-2xl sm:text-3xl md:text-4xl font-light text-white/[0.2]">
              {project.number}
            </span>
            <div>
              <h3 className="font-kanit font-medium text-xl sm:text-2xl md:text-3xl tracking-tight uppercase text-[#F5F5F2] group-hover/card:text-[#C8C1B5] transition-colors">
                {project.name}
              </h3>
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#A6A6A6] block mt-0.5">
                {project.category}
              </span>
            </div>
          </div>

          {/* View Project Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal(project.id);
            }}
            className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] hover:bg-[#F5F5F2] hover:text-[#050505] px-4 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-medium tracking-[0.1em] uppercase text-[#F5F5F2] transition-all duration-300 w-fit shrink-0 backdrop-blur-md"
          >
            <span>View Project</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110" />
          </button>
        </div>

        {/* Card Body: Image Layout: Left 2 stacked images, Right 1 large image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 pt-5 md:pt-7 flex-1 min-h-0 overflow-hidden">
          {/* Left: Two Stacked Images (5 cols) */}
          <div className="hidden sm:grid lg:col-span-5 grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6 h-full min-h-0">
            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/[0.15] bg-black/40">
              <img
                src={project.leftImageTop}
                alt={`${project.name} detail 1`}
                loading="lazy"
                className="w-full h-full object-cover filter brightness-[0.9] group-hover/card:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/[0.15] bg-black/40">
              <img
                src={project.leftImageBottom}
                alt={`${project.name} detail 2`}
                loading="lazy"
                className="w-full h-full object-cover filter brightness-[0.9] group-hover/card:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

          {/* Right: One Large Image (7 cols) */}
          <div className="lg:col-span-7 h-full min-h-0 relative rounded-2xl md:rounded-3xl overflow-hidden border border-white/[0.15] bg-black/40">
            <img
              src={project.rightImageLarge}
              alt={`${project.name} hero`}
              loading="lazy"
              className="w-full h-full object-cover filter brightness-[0.95] group-hover/card:scale-105 transition-transform duration-700"
            />

            {/* Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const ProjectsDarkSection: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);

  const handleOpenModal = (projectId: string) => {
    const project = PORTFOLIO_PROJECTS.find((p) => p.slug === projectId);
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
