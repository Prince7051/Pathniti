'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallAppButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function InstallAppButton({ 
  className = '', 
  variant = 'default',
  size = 'md' 
}: InstallAppButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback: show instructions for manual installation
      alert(`To install PathNiti as an app:

Android Chrome:
1. Tap the menu (3 dots) in your browser
2. Select "Add to Home screen"
3. Tap "Add"

iPhone Safari:
1. Tap the share button
2. Select "Add to Home Screen"
3. Tap "Add"

The app will then appear on your home screen!`);
      return;
    }

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return (
      <div className={`flex items-center space-x-2 text-green-600 ${className}`}>
        <Check className="w-4 h-4" />
        <span className="text-sm font-medium">App Installed</span>
      </div>
    );
  }

  // Don't show if not installable
  if (typeof window !== 'undefined' && !deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
    return null;
  }

  const baseClasses = "inline-flex items-center space-x-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    outline: "border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
    ghost: "text-blue-600 hover:bg-blue-50 focus:ring-blue-500"
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm rounded-md",
    md: "px-4 py-2 text-sm rounded-lg",
    lg: "px-6 py-3 text-base rounded-lg"
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      onClick={handleInstallClick}
      disabled={isInstalling}
      className={classes}
    >
      {isInstalling ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Installing...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Install App</span>
        </>
      )}
    </button>
  );
}

export default InstallAppButton;
