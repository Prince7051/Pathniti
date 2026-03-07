'use client';

import React, { useState, useEffect } from 'react';
import { capacitorService } from '@/lib/capacitor-service';

export default function TestMobilePage() {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const initTest = async () => {
      try {
        // Get device info
        const info = await capacitorService.getDeviceInfo();
        setDeviceInfo(info);

        // Check online status
        const online = await capacitorService.isOnline();
        setIsOnline(online);

        // Get location (if permission granted)
        try {
          const pos = await capacitorService.getCurrentLocation();
          setLocation(pos);
        } catch (error) {
          console.log('Location not available:', error);
        }
      } catch (error) {
        console.error('Failed to initialize test:', error);
      }
    };

    initTest();
  }, [isClient]);

  const testCamera = async () => {
    try {
      const photo = await capacitorService.takePhoto();
      if (photo) {
        alert('Photo taken successfully!');
        console.log('Photo:', photo);
      }
    } catch (error) {
      alert('Camera not available: ' + error);
    }
  };

  const testSplashScreen = async () => {
    alert('Splash screen will be shown automatically when the app launches on mobile devices');
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mobile test...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Mobile App Testing</h1>
        
        {/* Device Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Device Information</h2>
          <div className="space-y-2">
            <p><strong>Platform:</strong> {deviceInfo?.platform || 'Loading...'}</p>
            <p><strong>Model:</strong> {deviceInfo?.model || 'Loading...'}</p>
            <p><strong>OS Version:</strong> {deviceInfo?.osVersion || 'Loading...'}</p>
            <p><strong>Is Native:</strong> {deviceInfo?.isNative ? 'Yes' : 'No'}</p>
            <p><strong>Online:</strong> {isOnline ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Location</h2>
          {location ? (
            <div className="space-y-2">
              <p><strong>Latitude:</strong> {location.coords.latitude}</p>
              <p><strong>Longitude:</strong> {location.coords.longitude}</p>
              <p><strong>Accuracy:</strong> {location.coords.accuracy}m</p>
            </div>
          ) : (
            <p className="text-gray-500">Location not available or permission denied</p>
          )}
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Mobile Features</h2>
          <div className="space-y-4">
            <button
              onClick={testCamera}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Test Camera
            </button>
            
            <button
              onClick={testSplashScreen}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Test Splash Screen
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Testing Instructions</h2>
          <div className="space-y-2 text-blue-700">
            <p>• <strong>Web Testing:</strong> Use browser dev tools to simulate mobile devices</p>
            <p>• <strong>Android:</strong> Run <code>npm run run:android</code> with Android Studio</p>
            <p>• <strong>iOS:</strong> Run <code>npm run run:ios</code> with Xcode</p>
            <p>• <strong>PWA:</strong> Look for &quot;Add to Home Screen&quot; prompt on mobile browsers</p>
            <p>• <strong>Offline:</strong> Test by going offline in browser dev tools</p>
          </div>
        </div>
      </div>
    </div>
  );
}