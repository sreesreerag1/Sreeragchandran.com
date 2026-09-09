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
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Immediate cache check on mount (eliminates flicker if already cached)
  useEffect(() => {
    setHasError(false);
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src]);

  return (
    <div
      data-error={hasError ? 'true' : undefined}
      className={`relative w-full h-full overflow-hidden bg-[#070707] flex items-center justify-center ${containerClassName}`}
      style={aspectRatio ? { aspectRatio: String(aspectRatio) } : undefined}
    >
      {/* Skeleton Loading Placeholder (Zero Layout Shift) */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-white/[0.04] animate-pulse pointer-events-none transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Robust Image Element with Fallback */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        // @ts-ignore - fetchPriority is supported in modern browsers
        fetchpriority={fetchPriority}
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          console.warn('Failed to load image:', src);
          setHasError(true);
          setIsLoaded(true);
          const target = e.currentTarget;
          if (target.src !== '/fallback-image.jpg' && !target.src.includes('data:image')) {
            target.src = '/fallback-image.jpg';
          }
        }}
        className={`w-full h-full object-contain transition-opacity duration-500 ease-out transform-gpu ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
      />
    </div>
  );
};

export default ProgressiveImage;
