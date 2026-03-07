"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ImageOptimizationUtils } from "@/lib/services/image-optimization-service";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  lazy?: boolean;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  lazy = true,
  quality = 85,
  sizes,
  fill = false,
  style,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [responsiveUrls, setResponsiveUrls] = useState<{
    thumbnail: string;
    medium: string;
    large: string;
    original: string;
  } | null>(null);

  useEffect(() => {
    // Generate responsive URLs if image optimization is supported
    if (ImageOptimizationUtils.isOptimizationSupported(src)) {
      const urls = ImageOptimizationUtils.getResponsiveUrls(src);
      setResponsiveUrls(urls);

      // Use medium size as default
      setImageSrc(urls.medium);
    } else {
      setImageSrc(src);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);

    // Fallback to original image if optimized version fails
    if (responsiveUrls && imageSrc !== responsiveUrls.original) {
      setImageSrc(responsiveUrls.original);
      setHasError(false);
      return;
    }

    onError?.();
  };

  // Generate srcSet for responsive images
  const generateSrcSet = () => {
    if (!responsiveUrls) return undefined;

    return [
      `${responsiveUrls.thumbnail} 300w`,
      `${responsiveUrls.medium} 800w`,
      `${responsiveUrls.large} 1920w`,
    ].join(", ");
  };

  // Generate sizes attribute
  const generateSizes = () => {
    if (sizes) return sizes;

    return [
      "(max-width: 640px) 300px",
      "(max-width: 1024px) 800px",
      "1920px",
    ].join(", ");
  };

  if (hasError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-gray-500 text-sm text-center p-4">
          <svg
            className="w-8 h-8 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Image not available
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Loading placeholder */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-gray-400">
            <svg
              className="w-8 h-8 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        </div>
      )}

      <Image
        src={imageSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        loading={lazy ? "lazy" : "eager"}
        quality={quality}
        {...(generateSrcSet() && { srcSet: generateSrcSet() })}
        sizes={generateSizes()}
        className={`transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          objectFit: "cover",
          ...(!fill && { width, height }),
        }}
      />
    </div>
  );
}

/**
 * Optimized image component specifically for college galleries
 */
export function CollegeGalleryImage({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={400}
      height={300}
      className={`rounded-lg overflow-hidden ${className}`}
      priority={priority}
      quality={90}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  );
}

/**
 * Optimized image component for college profile headers
 */
export function CollegeHeaderImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      className={`object-cover ${className}`}
      priority
      quality={95}
      sizes="100vw"
    />
  );
}

/**
 * Optimized image component for college cards/thumbnails
 */
export function CollegeThumbnailImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={300}
      height={200}
      className={`rounded-md overflow-hidden ${className}`}
      lazy
      quality={80}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
    />
  );
}
