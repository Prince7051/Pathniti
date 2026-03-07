'use client';

import React, { useState, useEffect } from 'react';

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';
import { InstallAppButton } from '@/components/InstallAppButton';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { Download, Smartphone, CheckCircle, Info } from 'lucide-react';

export default function TestPWAPage() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if running as PWA
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true
    );

    // Check online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">PWA Installation Test</h1>
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isStandalone ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <div>
                <h3 className="font-semibold">App Mode</h3>
                <p className="text-sm text-gray-600">
                  {isStandalone ? 'Running as PWA' : 'Running in Browser'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div>
                <h3 className="font-semibold">Connection</h3>
                <p className="text-sm text-gray-600">
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <div>
                <h3 className="font-semibold">Service Worker</h3>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Install Section */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-3">
            <Download className="w-6 h-6 text-blue-600" />
            <span>Install PathNiti App</span>
          </h2>
          
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <InstallAppButton variant="default" size="lg" />
              <InstallAppButton variant="outline" size="lg" />
              <InstallAppButton variant="ghost" size="lg" />
            </div>

            {isStandalone && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">App is installed and running!</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Info className="w-5 h-5 text-blue-600" />
            <span>Installation Instructions</span>
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-blue-800">Android (Chrome)</h4>
              <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1 mt-1">
                <li>Tap the menu (3 dots) in your browser</li>
                <li>Select &quot;Add to Home screen&quot;</li>
                <li>Tap &quot;Add&quot; to install</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-800">iPhone (Safari)</h4>
              <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1 mt-1">
                <li>Tap the share button (square with arrow)</li>
                <li>Select &quot;Add to Home Screen&quot;</li>
                <li>Tap &quot;Add&quot; to install</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">PWA Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-green-600" />
              <span className="text-sm">Works offline</span>
            </div>
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-green-600" />
              <span className="text-sm">Home screen icon</span>
            </div>
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-green-600" />
              <span className="text-sm">Push notifications</span>
            </div>
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-green-600" />
              <span className="text-sm">Full screen experience</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
