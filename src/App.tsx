import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './sections/HeroSection';
import MarqueeGallery from './sections/MarqueeGallery';
import ServicesSection from './sections/ServicesSection';
import ProjectsDarkSection from './sections/ProjectsDarkSection';
import Footer from './sections/Footer';
import Preloader from './components/Preloader';
import { preloadGalleryAssets } from './utils/galleryPreloader';

export const App: React.FC = () => {
  const [isSiteLoaded, setIsSiteLoaded] = useState(false);

  useEffect(() => {
    if (isSiteLoaded) {
      preloadGalleryAssets();
    }
  }, [isSiteLoaded]);

  return (
    <div className="relative min-h-screen bg-[#050505] text-[#F5F5F2] selection:bg-[#C8C1B5]/30 selection:text-[#F5F5F2] overflow-x-clip font-sans">
      {/* Editorial Preloader with real asset progress & cinematic upward exit */}
      <Preloader onComplete={() => setIsSiteLoaded(true)} />

      {/* Global Luxury Navbar */}
      <Navbar />

      <main className="relative w-full">
        {/* HERO & SECTION 01: CREATIVE PHILOSOPHY DOWNWARD TRANSITION:
            1. Scroll controls hero video animation.
            2. Video remains pinned while animation plays.
            3. Final frame freezes.
            4. User continues scrolling.
            5. Video container moves downward naturally (maintaining full cinematic scale).
            6. Creative Philosophy section reveals from ABOVE the video container.
            7. Video exits viewport.
        */}
        <HeroSection isSiteLoaded={isSiteLoaded} />

        {/* SECTION 02: MARQUEE PORTFOLIO GALLERY (#050505 dark luxury editorial gallery) */}
        <MarqueeGallery />

        {/* SECTION 03: CAPABILITIES (#050505 dark luxury aesthetic, 5 numbered disciplines) */}
        <ServicesSection />

        {/* SECTION 04: SELECTED PROJECTS (#050505 dark aesthetic, 85vh sticky stacking cards) */}
        <ProjectsDarkSection />
      </main>

      {/* SECTION 05: ENGAGEMENT & INQUIRY (#050505 dark luxury editorial aesthetic) */}
      <Footer />
    </div>
  );
};

export default App;
