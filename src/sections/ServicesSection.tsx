import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { Reveal } from '../components/Reveal';

interface ServiceData {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  deliverables: string[];
}

const SERVICES: ServiceData[] = [
  {
    number: '01',
    title: '3D MODELING',
    subtitle: 'High-precision spatial geometry, hard-surface assets & parametric forms',
    description:
      'Architecting sculptural, photorealistic 3D assets and parametric environments. From bespoke industrial product prototypes to surrealist brand sculptures, each polygonal mesh is sculpted with mathematical precision and material authenticity.',
    deliverables: [
      'Parametric & Organic Surface Modeling',
      'Industrial Product Prototyping',
      'Architectural & Spatial Environments',
      'Optimized Real-Time WebGL Geometries',
    ],
  },
  {
    number: '02',
    title: 'RENDERING',
    subtitle: 'Photorealistic lighting simulation, subsurface scattering & cinematic frames',
    description:
      'Harnessing unbiased ray-tracing, spectral dispersion, and tangible surface physics. We craft museum-grade visual stills and hero compositions that elevate ordinary product forms into high-luxury cultural artifacts.',
    deliverables: [
      'Octane & Redshift Spectral Lighting',
      'Custom Procedural Material Shaders',
      'Key visual & Hero Editorial Stills',
      'Print-Resolution Hyper-Detail Mastery',
    ],
  },
  {
    number: '03',
    title: 'MOTION DESIGN',
    subtitle: 'Temporal choreography, kinetic rhythm & fluid cinematic physics',
    description:
      'Translating brand tension and architectural rhythm into hypnotic temporal arcs. We choreograph title sequences, product reveal films, and kinetic brand systems that command sustained fascination across digital screens.',
    deliverables: [
      'Cinematic Reveal Trailers & Teasers',
      'Kinetic Typographic Systems',
      'Physics-Driven Particle & Fluid Sims',
      'Micro-Interactions for Immersive Web',
    ],
  },
  {
    number: '04',
    title: 'BRANDING',
    subtitle: 'Perception architecture, typographic tension & unified visual identity',
    description:
      'Engineering undeniable visual authority for visionary founders and global enterprises. We strip away decorative excess to forge typographic systems, monogram symbols, and design frameworks that anchor lasting market presence.',
    deliverables: [
      'Comprehensive Brand Architecture',
      'Custom Bespoke Typography Systems',
      'Executive Brand Guidelines & Directives',
      'Physical Collateral & Packaging Craft',
    ],
  },
  {
    number: '05',
    title: 'WEB DESIGN',
    subtitle: 'Museum-grade digital flagships, spatial UI & interactive choreography',
    description:
      'Rejecting generic templates in favor of tailor-made digital journeys. We engineer award-winning interactive flagships that fuse narrative pacing, GLSL canvas shaders, and effortless usability into unforgettable web experiences.',
    deliverables: [
      'Experiential Flagships & E-Commerce',
      'Interactive 3D & GLSL Shaders',
      'Mobile-Optimized Fluid Performance',
      'Design Engineering & Creative Direction',
    ],
  },
];

export const ServicesSection: React.FC = () => {
  const [activeService, setActiveService] = useState<string | null>('01');

  const toggleService = (num: string) => {
    setActiveService((prev) => (prev === num ? null : num));
  };

  return (
    <section
      id="services"
      className="relative z-30 w-full bg-[#050505] text-[#F5F5F2] pt-24 sm:pt-32 md:pt-40 pb-28 sm:pb-36 md:pb-48 px-5 sm:px-8 md:px-14 lg:px-16 border-t border-white/[0.15]"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-12 sm:pb-16 md:pb-20 border-b border-white/[0.15] gap-6">
          <div>
            <Reveal delay={100}>
              <h2 className="font-kanit font-semibold text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-[-0.03em] uppercase leading-[1.0] text-[#F5F5F2]">
                CAPABILITIES
              </h2>
            </Reveal>
          </div>

          <Reveal delay={180}>
            <div className="flex flex-col md:text-right max-w-sm">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#707070] font-semibold mb-1">
                DISCIPLINED CRAFT
              </span>
              <p className="font-sans text-xs sm:text-sm text-[#A6A6A6] font-light leading-relaxed">
                Strategic vision executed across five focused creative disciplines.
              </p>
            </div>
          </Reveal>
        </div>

        {/* 5 Numbered Capabilities: Minimal Editorial Layout with Framer Motion Scroll Reveals */}
        <div className="divide-y divide-white/[0.15]">
          {SERVICES.map((service, index) => {
            const isExpanded = activeService === service.number;

            return (
              <motion.div
                key={service.number}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="group py-8 sm:py-12 md:py-16 transition-colors duration-300"
              >
                <div
                  onClick={() => toggleService(service.number)}
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 cursor-pointer select-none"
                >
                  {/* Left: Number + Title */}
                  <div className="flex items-baseline gap-5 sm:gap-8 md:gap-12">
                    <span className="font-kanit text-3xl sm:text-5xl md:text-6xl font-light text-white/[0.15] group-hover:text-white/40 transition-colors w-12 sm:w-20 shrink-0">
                      {service.number}
                    </span>
                    <div>
                      <h3 className="font-kanit font-medium text-2xl sm:text-4xl md:text-5xl tracking-tight uppercase text-[#F5F5F2] group-hover:text-white group-hover:translate-x-2 transition-all duration-300">
                        {service.title}
                      </h3>
                      {/* Subtle champagne underline accent expanding on hover */}
                      <div className="h-[2px] w-0 group-hover:w-16 bg-[#C8C1B5] transition-all duration-500 ease-out mt-2" />
                    </div>
                  </div>

                  {/* Right: Subtitle & Expand Toggle */}
                  <div className="flex items-center justify-between lg:justify-end gap-6 pl-16 lg:pl-0">
                    <span className="hidden sm:inline font-sans text-xs sm:text-sm text-[#A6A6A6] group-hover:text-[#F5F5F2]/90 font-light max-w-md line-clamp-1 lg:text-right transition-colors">
                      {service.subtitle}
                    </span>

                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-white/[0.15] flex items-center justify-center text-[#A6A6A6] group-hover:border-[#C8C1B5] group-hover:text-[#F5F5F2] group-hover:bg-white/[0.04] transition-all shrink-0">
                      {isExpanded ? (
                        <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Editorial Content Drawer */}
                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    isExpanded ? 'max-h-[500px] opacity-100 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/[0.15]' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pl-0 sm:pl-16 md:pl-32">
                    {/* Left: Authoritative Description */}
                    <div className="md:col-span-7">
                      <p className="font-sans text-sm sm:text-base md:text-lg text-[#A6A6A6] font-light leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    {/* Right: Key Deliverables */}
                    <div className="md:col-span-5 border-l-2 border-white/[0.15] pl-6 space-y-2">
                      <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.22em] text-[#707070] font-semibold block mb-2">
                        KEY DELIVERABLES
                      </span>
                      <ul className="space-y-1.5 font-sans text-xs sm:text-sm text-[#F5F5F2]/90 font-normal">
                        {service.deliverables.map((item) => (
                          <li key={item} className="flex items-center gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C8C1B5]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
