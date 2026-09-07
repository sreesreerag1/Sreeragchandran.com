import React, { useState, useEffect } from 'react';
import { Reveal } from './Reveal';
import { Magnetic } from './Magnetic';

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
          <Magnetic strength={0.18} maxOffset={3}>
            <a
              href="#"
              className="group flex items-center text-white transition-opacity hover:opacity-80 py-1 px-2"
            >
              <span className="font-sans text-[11px] sm:text-sm font-semibold tracking-[0.14em] sm:tracking-[0.16em] text-white uppercase">
                SREERAG CHANDRAN
              </span>
            </a>
          </Magnetic>
        </Reveal>

        {/* Center Nav Links: Work, About, What I Do, Contact */}
        <div className="hidden md:flex items-center gap-7 lg:gap-10">
          {NAV_LINKS.map((link, index) => (
            <Reveal key={link.label} delay={100 + index * 80}>
              <Magnetic strength={0.22} maxOffset={4}>
                <a
                  href={link.href}
                  className="font-sans text-xs uppercase tracking-[0.16em] text-white hover:text-white/80 font-medium transition-colors duration-300 py-1 px-2 block"
                >
                  {link.label}
                </a>
              </Magnetic>
            </Reveal>
          ))}
        </div>

        {/* Right CTA: Start a Conversation */}
        <Reveal delay={450}>
          <Magnetic strength={0.25} maxOffset={4}>
            <a
              href="#contact"
              className="group inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-white/30 bg-white/[0.04] hover:bg-white hover:text-[#050505] hover:border-white px-3.5 py-1.5 sm:px-5 sm:py-2.5 text-[10px] sm:text-xs font-mono tracking-[0.14em] uppercase text-white transition-all duration-300 cursor-pointer shadow-sm"
            >
              <span className="sm:hidden">CONTACT →</span>
              <span className="hidden sm:inline">START A CONVERSATION →</span>
            </a>
          </Magnetic>
        </Reveal>
      </nav>
    </header>
  );
};

export default Navbar;
