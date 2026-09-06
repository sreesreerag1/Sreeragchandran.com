import React, { useState, useEffect } from 'react';
import { Reveal } from './Reveal';

const NAV_LINKS = [
  { label: 'WORK', href: '#works' },
  { label: 'ABOUT', href: '#philosophy' },
  { label: 'WHAT I DO', href: '#what-i-do' },
  { label: 'CONTACT', href: '#contact' },
];

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? 'border-b border-white/[0.15] bg-[#050505]/90 backdrop-blur-xl py-2 sm:py-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.6)]'
          : 'border-b border-white/10 bg-[#050505]/60 backdrop-blur-md py-2.5 sm:py-4 md:py-5'
      }`}
    >
      <nav className="mx-auto flex w-full items-center justify-between px-4 sm:px-8 md:px-12">
        {/* Brand Logo: SREERAG CHANDRAN (Delay 0ms) */}
        <Reveal delay={0} className="flex items-center">
          <a
            href="#"
            className="group flex items-center text-[#F5F5F2] transition-opacity hover:opacity-80"
          >
            <span className="font-sans text-[11px] sm:text-sm font-semibold tracking-[0.14em] sm:tracking-[0.16em] text-[#F5F5F2] uppercase">
              SREERAG CHANDRAN
            </span>
          </a>
        </Reveal>

        {/* Center Nav Links: Work, About, What I Do, Contact */}
        <div className="hidden md:flex items-center gap-8 lg:gap-11">
          {NAV_LINKS.map((link, index) => (
            <Reveal key={link.label} delay={100 + index * 80}>
              <a
                href={link.href}
                className="font-sans text-xs uppercase tracking-[0.16em] text-[#A6A6A6] hover:text-[#F5F5F2] font-medium transition-colors duration-300"
              >
                {link.label}
              </a>
            </Reveal>
          ))}
        </div>

        {/* Right CTA: Start a Conversation */}
        <Reveal delay={450}>
          <a
            href="#contact"
            className="group inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-white/30 bg-white/[0.04] hover:bg-[#F5F5F2] hover:text-[#050505] hover:border-[#F5F5F2] px-3.5 py-1.5 sm:px-5 sm:py-2.5 text-[10px] sm:text-xs font-mono tracking-[0.14em] uppercase text-[#F5F5F2] transition-all duration-300 cursor-pointer shadow-sm"
          >
            <span className="sm:hidden">CONTACT →</span>
            <span className="hidden sm:inline">START A CONVERSATION →</span>
          </a>
        </Reveal>
      </nav>
    </header>
  );
};

export default Navbar;
