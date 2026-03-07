/**
 * Mobile Wrapper Component
 * Conditionally renders mobile-specific components only when needed
 */

'use client';

import React, { useState, useEffect } from 'react';
import { MobileProvider } from './MobileProvider';
import { MobileSplashScreen } from './MobileSplashScreen';
import { MobileOfflineIndicator } from './MobileOfflineIndicator';

interface MobileWrapperProps {
  children: React.ReactNode;
}

export function MobileWrapper({ children }: MobileWrapperProps) {
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check if we're in a mobile environment
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    setIsMobile(isMobileDevice);
  }, []);

  // Don't render mobile components during SSR
  if (!isClient) {
    return <>{children}</>;
  }

  // Only wrap with mobile features if we're in a mobile environment
  if (isMobile) {
    return (
      <MobileProvider>
        <MobileSplashScreen>
          <MobileOfflineIndicator />
          {children}
        </MobileSplashScreen>
      </MobileProvider>
    );
  }

  // For web, just return children without mobile wrapper
  return <>{children}</>;
}

export default MobileWrapper;
