/**
 * Image Optimization Service
 * Handles image compression, resizing, and optimization for college galleries
 */

interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
  progressive?: boolean;
}

interface OptimizedImage {
  url: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

interface ImageVariant {
  thumbnail: OptimizedImage;
  medium: OptimizedImage;
  large: OptimizedImage;
  original: OptimizedImage;
}

class ImageOptimizationService {
  private readonly defaultOptions: Required<ImageOptimizationOptions> = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    format: "webp",
    progressive: true,
  };

  /**
   * Generate responsive image variants for college galleries
   */
  async generateImageVariants(
    imageUrl: string,
    options: Partial<ImageOptimizationOptions> = {},
  ): Promise<ImageVariant | null> {
    try {
      const opts = { ...this.defaultOptions, ...options };

      // Generate different sizes for responsive images
      const variants = await Promise.all([
        this.optimizeImage(imageUrl, {
          ...opts,
          maxWidth: 300,
          maxHeight: 200,
        }), // thumbnail
        this.optimizeImage(imageUrl, {
          ...opts,
          maxWidth: 800,
          maxHeight: 600,
        }), // medium
        this.optimizeImage(imageUrl, {
          ...opts,
          maxWidth: 1920,
          maxHeight: 1080,
        }), // large
        this.getOriginalImageInfo(imageUrl), // original
      ]);

      const [thumbnail, medium, large, original] = variants;

      if (!thumbnail || !medium || !large || !original) {
        return null;
      }

      return {
        thumbnail,
        medium,
        large,
        original,
      };
    } catch (error) {
      console.error("Error generating image variants:", error);
      return null;
    }
  }

  /**
   * Optimize a single image with specified options
   */
  private async optimizeImage(
    imageUrl: string,
    options: ImageOptimizationOptions,
  ): Promise<OptimizedImage | null> {
    try {
      // For Supabase Storage, we can use URL parameters for optimization
      if (imageUrl.includes("supabase")) {
        return this.optimizeSupabaseImage(imageUrl, options);
      }

      // For external images, we might need a different approach
      // This is a placeholder for external image optimization
      return this.optimizeExternalImage(imageUrl, options);
    } catch (error) {
      console.error("Error optimizing image:", error);
      return null;
    }
  }

  /**
   * Optimize Supabase Storage images using URL parameters
   */
  private async optimizeSupabaseImage(
    imageUrl: string,
    options: ImageOptimizationOptions,
  ): Promise<OptimizedImage | null> {
    try {
      const url = new URL(imageUrl);
      const params = new URLSearchParams();

      // Add optimization parameters
      if (options.maxWidth) {
        params.set("width", options.maxWidth.toString());
      }
      if (options.maxHeight) {
        params.set("height", options.maxHeight.toString());
      }
      if (options.quality) {
        params.set("quality", options.quality.toString());
      }
      if (options.format) {
        params.set("format", options.format);
      }

      // Construct optimized URL
      const optimizedUrl = `${url.origin}${url.pathname}?${params.toString()}`;

      // Get image dimensions (this would need to be implemented based on your setup)
      const dimensions = await this.getImageDimensions(optimizedUrl);

      return {
        url: optimizedUrl,
        width: dimensions.width,
        height: dimensions.height,
        format: options.format || "webp",
        size: 0, // Size would need to be calculated
      };
    } catch (error) {
      console.error("Error optimizing Supabase image:", error);
      return null;
    }
  }

  /**
   * Optimize external images (placeholder implementation)
   */
  private async optimizeExternalImage(
    imageUrl: string,
    _options: ImageOptimizationOptions,
  ): Promise<OptimizedImage | null> {
    // This would integrate with an image optimization service like Cloudinary, ImageKit, etc.
    // For now, return the original image
    return this.getOriginalImageInfo(imageUrl);
  }

  /**
   * Get original image information
   */
  private async getOriginalImageInfo(
    imageUrl: string,
  ): Promise<OptimizedImage | null> {
    try {
      const dimensions = await this.getImageDimensions(imageUrl);

      return {
        url: imageUrl,
        width: dimensions.width,
        height: dimensions.height,
        format: this.getImageFormat(imageUrl),
        size: 0, // Size would need to be fetched
      };
    } catch (error) {
      console.error("Error getting original image info:", error);
      return null;
    }
  }

  /**
   * Get image dimensions
   */
  private async getImageDimensions(
    imageUrl: string,
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        // Server-side: return default dimensions
        resolve({ width: 800, height: 600 });
        return;
      }

      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };
      img.src = imageUrl;
    });
  }

  /**
   * Get image format from URL
   */
  private getImageFormat(imageUrl: string): string {
    const extension = imageUrl.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "jpg":
      case "jpeg":
        return "jpeg";
      case "png":
        return "png";
      case "webp":
        return "webp";
      default:
        return "jpeg";
    }
  }

  /**
   * Generate srcSet string for responsive images
   */
  generateSrcSet(variants: ImageVariant): string {
    return [
      `${variants.thumbnail.url} ${variants.thumbnail.width}w`,
      `${variants.medium.url} ${variants.medium.width}w`,
      `${variants.large.url} ${variants.large.width}w`,
    ].join(", ");
  }

  /**
   * Generate sizes attribute for responsive images
   */
  generateSizes(): string {
    return [
      "(max-width: 640px) 300px",
      "(max-width: 1024px) 800px",
      "1920px",
    ].join(", ");
  }

  /**
   * Preload critical images
   */
  preloadImage(imageUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        resolve();
        return;
      }

      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = imageUrl;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error("Failed to preload image"));

      document.head.appendChild(link);
    });
  }

  /**
   * Lazy load images with intersection observer
   */
  setupLazyLoading(selector: string = "[data-lazy]"): void {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.lazy;

          if (src) {
            img.src = src;
            img.classList.remove("lazy");
            observer.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll(selector).forEach((img) => {
      imageObserver.observe(img);
    });
  }
}

/**
 * React hook for image optimization
 */
export function useImageOptimization() {
  const service = new ImageOptimizationService();

  const optimizeImage = async (
    imageUrl: string,
    options?: Partial<ImageOptimizationOptions>,
  ) => {
    return service.generateImageVariants(imageUrl, options);
  };

  const generateResponsiveProps = (variants: ImageVariant) => ({
    src: variants.medium.url,
    srcSet: service.generateSrcSet(variants),
    sizes: service.generateSizes(),
  });

  return {
    optimizeImage,
    generateResponsiveProps,
    preloadImage: service.preloadImage.bind(service),
    setupLazyLoading: service.setupLazyLoading.bind(service),
  };
}

/**
 * Utility functions for image optimization
 */
export const ImageOptimizationUtils = {
  /**
   * Get optimized image URL for Supabase Storage
   */
  getOptimizedUrl: (
    originalUrl: string,
    width?: number,
    height?: number,
    quality = 85,
    format: "webp" | "jpeg" | "png" = "webp",
  ): string => {
    if (!originalUrl.includes("supabase")) {
      return originalUrl;
    }

    const url = new URL(originalUrl);
    const params = new URLSearchParams();

    if (width) params.set("width", width.toString());
    if (height) params.set("height", height.toString());
    params.set("quality", quality.toString());
    params.set("format", format);

    return `${url.origin}${url.pathname}?${params.toString()}`;
  },

  /**
   * Generate responsive image URLs
   */
  getResponsiveUrls: (originalUrl: string) => ({
    thumbnail: ImageOptimizationUtils.getOptimizedUrl(originalUrl, 300, 200),
    medium: ImageOptimizationUtils.getOptimizedUrl(originalUrl, 800, 600),
    large: ImageOptimizationUtils.getOptimizedUrl(originalUrl, 1920, 1080),
    original: originalUrl,
  }),

  /**
   * Check if image optimization is supported
   */
  isOptimizationSupported: (imageUrl: string): boolean => {
    return (
      imageUrl.includes("supabase") ||
      imageUrl.includes("cloudinary") ||
      imageUrl.includes("imagekit")
    );
  },
};

export default ImageOptimizationService;
