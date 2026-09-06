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
    title: 'BRAND IDENTITY',
    subtitle: 'Creating distinctive visual identities that give brands a clear and memorable presence.',
    description:
      'From foundational visual systems to high-touch brand collateral, I build distinctive, coherent identities designed to give brands an enduring, commanding market presence across all cultural touchpoints.',
    deliverables: [
      'Comprehensive Visual Systems',
      'Bespoke Typographic Design',
      'Brand Architecture & Guidelines',
      'Packaging & Physical Collateral',
    ],
  },
  {
    number: '02',
    title: 'EXPERIENTIAL CONCEPTS',
    subtitle: 'Creating original concepts that transform spaces, events and interactions into memorable experiences.',
    description:
      'Conceiving spatial environments, live stages, interactive pavilions, and brand activations that dissolve the barrier between audience and space, turning physical gatherings into unforgettable communal memories.',
    deliverables: [
      'Spatial Experience Design',
      'Immersive Stage & Set Direction',
      'Interactive Environments & Installations',
      'Large-Scale Event Activations',
    ],
  },
  {
    number: '03',
    title: 'CAMPAIGN IDEATION',
    subtitle: 'Turning insights into strong creative ideas that connect with audiences across multiple touchpoints.',
    description:
      'Distilling strategic brand objectives into arresting conceptual hooks and 360-degree creative campaigns that capture cultural attention and spark conversations across digital, broadcast, and physical mediums.',
    deliverables: [
      '360° Creative Campaign Concepts',
      'Transmedia Storytelling Arcs',
      'Cultural Activation Frameworks',
      'Cross-Platform Creative Strategy',
    ],
  },
  {
    number: '04',
    title: 'VISUAL NARRATIVE',
    subtitle: 'Translating ideas into compelling visual stories, from the first frame to the final execution.',
    description:
      'Directing cinematic visual worlds, key visuals, motion aesthetics, and storyboards that articulate complex emotional narratives with striking visual clarity and artistic rigor.',
    deliverables: [
      'Key Visuals & Hero Stills',
      'Motion Aesthetics & Treatment',
      'Film & Content Storyboards',
      'Art Direction & World-Building',
    ],
  },
  {
    number: '05',
    title: 'CREATIVE DIRECTION',
    subtitle: 'Leading the creative vision from concept to execution, ensuring every element works as one cohesive idea.',
    description:
      'Guiding multidisciplinary teams, agencies, and production partners with uncompromising artistic standards, ensuring every detail from initial pitch to final delivery adheres to one cohesive, elevated vision.',
    deliverables: [
      'End-to-End Creative Leadership',
      'Vision & Pitch Direction',
      'Multidisciplinary Team Orchestration',
      'Executive Creative Quality Control',
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
      id="what-i-do"
      className="relative z-30 w-full bg-[#050505] text-[#F5F5F2] pt-24 sm:pt-32 md:pt-40 pb-28 sm:pb-36 md:pb-48 px-5 sm:px-8 md:px-14 lg:px-16 border-t border-white/[0.15]"
    >
      {/* Anchor for backward compatibility with #services */}
      <span id="services" className="sr-only" />

      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-12 sm:pb-16 md:pb-20 border-b border-white/[0.15] gap-6">
          <div>
            <Reveal delay={100}>
              <h2 className="font-kanit font-semibold text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-[-0.03em] uppercase leading-[1.0] text-[#F5F5F2]">
                WHAT I DO
              </h2>
            </Reveal>
          </div>

          <Reveal delay={180}>
            <div className="flex flex-col md:text-right max-w-sm">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#707070] font-semibold mb-1">
                CREATIVE STRENGTHS
              </span>
              <p className="font-sans text-xs sm:text-sm text-[#A6A6A6] font-light leading-relaxed">
                Strategic vision executed across five core creative strengths.
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
