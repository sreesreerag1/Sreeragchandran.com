import React from 'react';
import { Hexagon, ArrowUpRight } from 'lucide-react';
import { Reveal } from '../components/Reveal';

const SOCIALS = [
  { label: 'Instagram', href: '#' },
  { label: 'LinkedIn', href: '#' },
  { label: 'Behance', href: '#' },
  { label: 'X', href: '#' },
];

export const Footer: React.FC = () => {
  return (
    <footer
      id="contact"
      className="relative z-30 w-full bg-[#050505] text-[#F5F5F2] pt-24 sm:pt-36 md:pt-48 pb-12 px-5 sm:px-8 md:px-14 lg:px-16 border-t border-white/[0.15]"
    >
      <div className="mx-auto max-w-7xl">
        {/* Top Engagement Pitch */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 pb-16 sm:pb-24 md:pb-32 border-b border-white/[0.15]">
          <div className="max-w-3xl">
            <Reveal delay={100}>
              <h2 className="font-kanit font-semibold text-4xl sm:text-6xl md:text-7xl lg:text-[84px] uppercase tracking-[-0.03em] leading-[1.02] text-[#F5F5F2]">
                LET'S CREATE
                <br />
                <span className="text-[#F5F5F2]/90">SOMETHING WORTH</span>
                <br />
                <span className="text-[#C8C1B5]">REMEMBERING.</span>
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="font-sans text-sm sm:text-base md:text-lg text-[#A6A6A6] font-light leading-relaxed max-w-xl mt-4 sm:mt-6">
                Have a brand, campaign or experience in mind? Let’s turn the idea into something people can feel.
              </p>
            </Reveal>
          </div>

          <Reveal delay={180}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <a
                href="mailto:sreerag1@live.in"
                className="group inline-flex items-center gap-3 rounded-full border border-white/40 bg-transparent text-[#F5F5F2] hover:bg-[#F5F5F2] hover:text-[#050505] hover:border-[#F5F5F2] px-8 sm:px-9 py-4 text-xs sm:text-sm font-mono tracking-[0.2em] uppercase transition-all duration-300 shadow-2xl cursor-pointer"
              >
                <span>START A CONVERSATION →</span>
                <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:rotate-45" />
              </a>
            </div>
          </Reveal>
        </div>

        {/* Studio Info & Links Grid */}
        <div className="py-16 md:py-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-[#707070] block mb-3.5 font-semibold">
              Location & Availability
            </span>
            <p className="font-sans text-sm sm:text-base text-[#A6A6A6] font-light leading-relaxed">
              Based in Dubai.
              <br />
              Directing select brand identities, campaigns, and experiential projects globally.
            </p>
          </div>

          <div>
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-[#707070] block mb-3.5 font-semibold">
              Direct Inquiries
            </span>
            <div className="space-y-2">
              <a
                href="mailto:sreerag1@live.in"
                className="font-sans text-sm sm:text-base text-[#F5F5F2] hover:text-white font-light underline underline-offset-4 decoration-white/30 transition-colors block"
              >
                sreerag1@live.in
              </a>
              <a
                href="tel:+971544940801"
                className="font-sans text-sm sm:text-base text-[#F5F5F2] hover:text-white font-light underline underline-offset-4 decoration-white/30 transition-colors block"
              >
                +971 544940801
              </a>
            </div>
          </div>

          <div>
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-[#707070] block mb-3.5 font-semibold">
              Core Disciplines
            </span>
            <ul className="font-sans text-sm text-[#A6A6A6] font-light space-y-1.5">
              <li className="hover:text-white transition-colors cursor-default">01 Brand Identity</li>
              <li className="hover:text-white transition-colors cursor-default">02 Experiential Concepts</li>
              <li className="hover:text-white transition-colors cursor-default">03 Campaign Ideation</li>
              <li className="hover:text-white transition-colors cursor-default">04 Visual Narrative</li>
              <li className="hover:text-white transition-colors cursor-default">05 Creative Direction</li>
            </ul>
          </div>

          <div>
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-[#707070] block mb-3.5 font-semibold">
              Networks & Profiles
            </span>
            <ul className="flex flex-wrap gap-x-5 gap-y-2.5 text-sm text-[#A6A6A6] font-light">
              {SOCIALS.map((soc) => (
                <li key={soc.label}>
                  <a
                    href={soc.href}
                    className="inline-flex items-center gap-1 text-[#A6A6A6] hover:text-white transition-colors"
                  >
                    <span>{soc.label}</span>
                    <ArrowUpRight size={12} className="text-[#707070]" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.15] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono uppercase tracking-[0.18em] text-[#707070]">
          <div className="flex items-center gap-2.5">
            <Hexagon size={16} strokeWidth={1.5} className="text-[#C8C1B5]" />
            <span className="text-[#A6A6A6]">SREERAG CHANDRAN © 2026</span>
          </div>

          <div className="text-[#707070]">CREATIVE DIRECTION • DUBAI • DIRECTING GLOBALLY</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
