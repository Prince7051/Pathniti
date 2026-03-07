"use client";

import { useEffect, useState, useCallback } from "react";

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

export function ServiceWorkerProvider({
  children,
}: ServiceWorkerProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [, setSwRegistration] = useState<ServiceWorkerRegistration | null>(
    null,
  );

  const registerServiceWorker = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      setSwRegistration(registration);

      // Handle service worker updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New service worker is available
              showUpdateNotification();
            }
          });
        }
      });

      console.log("Service Worker registered successfully:", registration);
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }, []);

  useEffect(() => {
    // Temporarily disable service worker registration for development
    // if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    //   registerServiceWorker()
    // }

    // Handle online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Set initial online status
    setIsOnline(typeof window !== "undefined" ? navigator.onLine : true);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [registerServiceWorker]);

  const showUpdateNotification = () => {
    // Show a notification that a new version is available
    if (
      confirm(
        "A new version of PathNiti is available. Would you like to update?",
      )
    ) {
      window.location.reload();
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        console.log("Notification permission granted");
      }
    }
  };

  // Request notification permission on first visit
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <>
      {children}

      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 text-sm z-50">
          📱 You&apos;re offline. Some features may be limited.
        </div>
      )}

      {/* Install prompt */}
      <InstallPrompt />
    </>
  );
}

// Install prompt component
function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("PWA install prompt event received");
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
      console.log("PWA install prompt set to show:", true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    console.log("Install button clicked, deferredPrompt:", !!deferredPrompt);
    if (deferredPrompt) {
      const promptEvent = deferredPrompt as unknown as {
        prompt: () => void;
        userChoice: Promise<{ outcome: string }>;
      };
      console.log("Calling prompt()");
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;

      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }

      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    localStorage.setItem("installPromptDismissed", "true");
  };

  // Don't show if user has dismissed it
  useEffect(() => {
    const dismissed = localStorage.getItem("installPromptDismissed");
    if (dismissed) {
      setShowInstallPrompt(false);
    }
  }, []);

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-sm mx-auto">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900">
            Install PathNiti
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Get quick access to career guidance on your device
          </p>
          <div className="flex space-x-2 mt-3">
            <button
              onClick={handleInstallClick}
              className="bg-blue-600 text-white text-xs px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="text-gray-500 text-xs px-3 py-1 hover:text-gray-700 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
