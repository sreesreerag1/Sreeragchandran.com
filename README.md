# Sreerag Chandran — Creative Director & Visual Artist Portfolio

An award-winning editorial portfolio website engineered for **Sreerag Chandran**, Creative Director & Visual Artist based in Dubai.

The digital experience is designed with high-fashion luxury publication aesthetics, featuring fluid mouse-scrubbed intro video exploration, 60fps canvas scroll-scrub video narration, a physics-based container transition, a two-column editorial creative philosophy spread, interactive marquee galleries, and 85vh dark stacking project showcases.

---

## 🛠 Tech Stack & Framework

- **Core Framework**: [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 5](https://vitejs.dev/) (lightning-fast HMR and optimized ES modules)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/) + PostCSS + Autoprefixer
- **Motion & Interactions**: [Framer Motion 13](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Typography**: 
  - **Kanit** (Display & Headings, 300 to 900 weights)
  - **Inter** (Body Prose & Meta UI)
  - System Monospace (Numerals & Indicators)

---

## 📁 Project Structure

```
Website sreerag/
├── public/
│   ├── images/
│   │   ├── sreerag-portrait.jpg   # High-res pencil sketch portrait (main visual)
│   │   ├── sreerag.jpg            # Original wide-format artistic sketch
│   │   └── projects/              # Portfolio project thumbnails & mockups
│   │       ├── project-01.jpg     # Nextlevel Studio
│   │       ├── project-02.jpg     # Aura Brand Identity
│   │       └── project-03.png     # Solaris Digital
│   ├── videos/
│   │   ├── creature.mp4           # Video 1: Intro interactive mouse/touch hover scrub
│   │   ├── hero.mp4               # Video 2: Cinematic character scroll-scrub sequence
│   │   ├── Animated c.mp4         # Master character animation sequence
│   │   ├── Animated c 2.mp4       # Full extended visual render
│   │   └── mouse.mp4              # Interaction test capture
│   ├── fonts/
│   │   └── README.md              # Font stack & typography reference
│   └── icons/
│       └── favicon.svg            # Custom geometric vector favicon
│
├── src/
│   ├── sections/                  # Full-page storytelling sections
│   │   ├── HeroSection.tsx        # Video scrub, freeze & downward push transition
│   │   ├── CreativePhilosophy.tsx # 2-column editorial spread (About & manifesto)
│   │   ├── MarqueeGallery.tsx     # 2-row opposite-direction scroll marquee
│   │   ├── ServicesSection.tsx    # 5 numbered services with interactive reveal
│   │   ├── ProjectsDarkSection.tsx# 85vh dark sticky stacking cards
│   │   └── Footer.tsx             # Editorial contact & Dubai studio credentials
│   │
│   ├── components/                # Reusable UI controls & components
│   │   ├── Navbar.tsx             # Minimalist sticky navigation bar
│   │   ├── Reveal.tsx             # IntersectionObserver reveal wrapper
│   │   └── [archive components]   # Preserved exploration modules
│   │
│   ├── hooks/
│   │   └── useScrollProgress.ts   # Normalized scroll progress hook
│   │
│   ├── utils/
│   │   └── cn.ts                  # Classname merging utility
│   │
│   ├── styles/
│   │   └── index.css              # Tailwind base, utilities & typography import
│   │
│   ├── App.tsx                    # Main section sequencer
│   └── main.tsx                   # React root entry point
│
├── package.json                   # Dependencies and scripts
├── vite.config.ts                 # Vite bundler configuration
├── tailwind.config.js             # Tailwind design tokens & font extensions
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### Installation

```bash
# Navigate to the project directory
cd "/Users/sreeragchandran/Desktop/Sreerag Website /Website sreerag"

# Install dependencies (already pre-installed in backup)
npm install
```

### Development Server

```bash
# Start local development server with HMR
npm run dev
```

The dev server will launch at `http://localhost:5173/` (or the next available port).

### Production Build

```bash
# Type-check and compile optimized production bundle
npm run build
```

The output files will be generated in `dist/`.

### Preview Production Build

```bash
# Preview the production build locally
npm run preview
```

---

## 🎬 Core Interactive Mechanisms & Motion Architecture

### 1. Dual-Video Hero Pipeline (`HeroSection.tsx`)
- **Phase 1: Video 1 Intro Mouse Hover Scrub**:
  - Controlled by horizontal pointer movement across the viewport (`0` to `window.innerWidth`).
  - Allows tactile, real-time scrubbing through the introductory creature video.
  - Zero auto-play; completely interactive.
- **Rewind & Handoff**:
  - The very first downward scroll motion engages a rapid, smooth rewind of Video 1 back to frame 0.
  - Instantly hands off to Video 2 at frame 0.
- **Phase 2: Video 2 Scroll Scrubbing**:
  - High-performance 60fps HTML5 `<canvas>` rendering pipeline synchronized directly with scroll delta.
  - Pre-buffers and decodes video frames to eliminate seek jitter.
  - **Zero Vertical Cropping**: Full vertical composition (head, torso, legs, feet, ground) is 100% preserved on both desktop and mobile viewports.
- **Phase 3: Final Frame Freeze & Physical Downward Push**:
  - When the scrub reaches the final frame, the character freezes in position.
  - The pinned container begins physical downward translation (`1800px → 2600px`).
  - Section 01 (`CreativePhilosophy.tsx`) appears from **above** the video container, pushing the video downward out of the viewport.

### 2. Two-Column Creative Philosophy Section (`CreativePhilosophy.tsx`)
- **Desktop Layout (45% Left / 55% Right)**:
  - **Left**: Editorial typography with tight hierarchy, large uppercase title, role, main statement, and two supporting paragraphs.
  - **Right**: High-resolution sketch portrait (`public/images/sreerag-portrait.jpg`).
  - **Zero Vertical Cropping**: Natural proportions maintained via `object-contain`, blending seamlessly with the page via `mix-blend-multiply`.
- **Mobile Layout**:
  - Portrait image appears first, commanding the upper screen (`h-[36vh] sm:h-[40vh]`).
  - Text smoothly overlaps the lower ~25% of the pencil fade with high legibility.
- **Bottom Discipline Row**:
  - Minimalist uppercase row separated by clean `|` dividers:
    `Art Direction | Brand Identity | Visual Storytelling | Creative Strategy`.

### 3. Marquee Portfolio Gallery (`MarqueeGallery.tsx`)
- Two horizontal rows moving in opposite directions.
- Dynamically accelerates according to user scroll velocity.

### 4. Selected Projects (`ProjectsDarkSection.tsx`)
- Dark luxury `#0C0C0C` aesthetic.
- Sticky cards pinned at 85vh height with Framer Motion `useScroll` and `useTransform` scale interpolation.
