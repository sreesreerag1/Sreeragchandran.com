import React, { useState, useRef, useEffect } from 'react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  aspectRatio?: number;
  className?: string;
  containerClassName?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
  isCardPreview?: boolean;
  sizes?: string;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  aspectRatio,
  className = '',
  containerClassName = '',
  loading = 'lazy',
  decoding = 'async',
  fetchPriority = 'auto',
  isCardPreview = true,
  sizes,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Derive responsive & format variants
  const isJpg = src.endsWith('.jpg');
  const basePath = isJpg ? src.replace(/\.jpg$/, '') : src;

  const avif800 = isJpg ? `${basePath}-800.avif` : src;
  const avifFull = isJpg ? `${basePath}.avif` : src;
  const jpg800 = isJpg ? `${basePath}-800.jpg` : src;
  const jpgFull = src;

  // Immediate cache check on mount (eliminates flicker if already cached)
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-[#070707] ${containerClassName}`}
      style={aspectRatio ? { aspectRatio: String(aspectRatio) } : undefined}
    >
      {/* Skeleton Loading Placeholder (Zero Layout Shift) */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-white/[0.03] animate-pulse pointer-events-none transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Modern Responsive Picture Tag */}
      <picture className="w-full h-full flex items-center justify-center">
        {/* AVIF Next-Gen Format */}
        <source
          type="image/avif"
          srcSet={
            isCardPreview
              ? `${avif800} 800w, ${avifFull} 1600w`
              : `${avifFull} 1600w, ${avif800} 800w`
          }
          sizes={sizes || (isCardPreview ? '(max-width: 1024px) 100vw, 800px' : '100vw')}
        />

        {/* JPEG Fallback */}
        <source
          type="image/jpeg"
          srcSet={
            isCardPreview
              ? `${jpg800} 800w, ${jpgFull} 1600w`
              : `${jpgFull} 1600w, ${jpg800} 800w`
          }
          sizes={sizes || (isCardPreview ? '(max-width: 1024px) 100vw, 800px' : '100vw')}
        />

        {/* Base Fallback Image */}
        <img
          ref={imgRef}
          src={isCardPreview ? jpg800 : jpgFull}
          alt={alt}
          loading={loading}
          decoding={decoding}
          // @ts-ignore - fetchPriority is supported in modern browsers
          fetchpriority={fetchPriority}
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full object-contain transition-opacity duration-500 ease-out transform-gpu ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
        />
      </picture>
    </div>
  );
};

export default ProgressiveImage;
