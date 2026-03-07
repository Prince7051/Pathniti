/**
 * Mobile Splash Screen Component
 * Displays a custom splash screen for mobile app
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useMobile } from './MobileProvider';

// Conditionally import Capacitor SplashScreen only when available
let SplashScreen: any = null;

// Initialize SplashScreen safely
const initializeSplashScreen = async () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Check if Capacitor is available
    if ((window as any).Capacitor) {
      const splashModule = await import('@capacitor/splash-screen');
      SplashScreen = splashModule.SplashScreen;
      console.log('Capacitor SplashScreen loaded successfully');
    }
  } catch (error) {
    console.log('Capacitor SplashScreen not available in web environment:', error);
    SplashScreen = null;
  }
};

// Initialize immediately if in browser
if (typeof window !== 'undefined') {
  initializeSplashScreen();
}

interface MobileSplashScreenProps {
  children: React.ReactNode;
}

export function MobileSplashScreen({ children }: MobileSplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const { isNative } = useMobile();
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const hideSplashScreen = async () => {
      if (isClient && isNative && SplashScreen) {
        try {
          // Hide the native splash screen
          await SplashScreen.hide();
        } catch (error) {
          console.error('Failed to hide splash screen:', error);
        }
      }
      
      // Hide our custom splash screen after a delay
      setTimeout(() => {
        setIsVisible(false);
      }, 1500);
    };

    // Hide splash screen after app initialization
    const timer = setTimeout(hideSplashScreen, 2000);

    return () => clearTimeout(timer);
  }, [isClient, isNative]);

  if (!isVisible) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
      {/* Splash Screen Content */}
      <div className="text-center">
        {/* App Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-2xl">
            <svg
              className="w-16 h-16 text-blue-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>

        {/* App Name */}
        <h1 className="text-4xl font-bold text-white mb-2">PathNiti</h1>
        <p className="text-blue-100 text-lg mb-8">Your Path. Your Future. Simplified.</p>

        {/* Loading Animation */}
        <div className="flex justify-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>

        {/* Loading Text */}
        <p className="text-blue-200 text-sm mt-6">Loading your personalized experience...</p>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white rounded-full"></div>
        <div className="absolute top-32 right-16 w-16 h-16 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-32 right-10 w-24 h-24 border-2 border-white rounded-full"></div>
      </div>
    </div>
  );
}

export default MobileSplashScreen;
