import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // For mobile builds, we'll use a regular build, not static export
  // output: process.env.CAPACITOR_BUILD === 'true' ? 'export' : undefined,
  trailingSlash: true,
  // For Next.js 15, serverComponentsExternalPackages moved to root level
  serverExternalPackages: [
    "@supabase/ssr",
    "@supabase/realtime-js",
  ],
  // Fix client reference manifest issues
  experimental: {
    // Fix client reference manifest issues in Next.js 15
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  images: {
    unoptimized: process.env.CAPACITOR_BUILD === 'true',
    domains: ["localhost", "maps.googleapis.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
        port: "",
        pathname: "/maps/api/place/photo**",
      },
    ],
  },
  // Explicitly define environment variables for client-side access
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_JS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_JS_API_KEY,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "PathNiti",
    NEXT_PUBLIC_APP_DESCRIPTION:
      process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
      "One-Stop Personalized Career & Education Advisor for Indian Students",
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Optimize build performance
  compress: true,
  webpack: (config, { isServer, dev }) => {
    // Fix webpack module loading issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Improve module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    // Fix client reference manifest issues
    if (!isServer) {
      // Remove problematic aliases that cause module resolution issues
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }

    // Fix chunk loading issues
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          maxInitialRequests: 30,
          maxAsyncRequests: 30,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              priority: 20,
              chunks: 'all',
            },
            capacitor: {
              test: /[\\/]node_modules[\\/]@capacitor[\\/]/,
              name: 'capacitor',
              priority: 15,
              chunks: 'async',
            },
          },
        },
      };
      
      // Fix module loading issues
      config.output = {
        ...config.output,
        chunkLoadingGlobal: 'webpackChunk_N_E',
        globalObject: 'self',
        // Improve chunk loading reliability
        chunkLoadTimeout: 30000,
      };

      // Improve dynamic import handling for Capacitor modules
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          // Add fallbacks for Capacitor modules when not available
          '@capacitor/core': false,
          '@capacitor/app': false,
          '@capacitor/status-bar': false,
          '@capacitor/splash-screen': false,
          '@capacitor/push-notifications': false,
          '@capacitor/local-notifications': false,
          '@capacitor/geolocation': false,
          '@capacitor/camera': false,
          '@capacitor/network': false,
          '@capacitor/device': false,
          '@capacitor/preferences': false,
          '@capacitor/haptics': false,
        },
      };
    }

    // Create missing CSS file during build to prevent ENOENT errors
    if (isServer) {
      // Create CSS file in all possible locations
      const locations = [
        path.join(__dirname, ".next", "browser", "default-stylesheet.css"),
        path.join(
          __dirname,
          ".next",
          "server",
          "app",
          "auth",
          "browser",
          "default-stylesheet.css",
        ),
        path.join(
          __dirname,
          ".next",
          "server",
          "app",
          "auth",
          "signup",
          "college",
          "browser",
          "default-stylesheet.css",
        ),
        path.join(
          __dirname,
          ".next",
          "server",
          "app",
          "api",
          "colleges",
          "register",
          "browser",
          "default-stylesheet.css",
        ),
      ];

      locations.forEach((cssFile) => {
        const cssDir = path.dirname(cssFile);
        if (!fs.existsSync(cssDir)) {
          fs.mkdirSync(cssDir, { recursive: true });
        }

        if (!fs.existsSync(cssFile)) {
          fs.writeFileSync(cssFile, "/* Default stylesheet placeholder */");
        }
      });
    }

    return config;
  },
};

export default nextConfig;
