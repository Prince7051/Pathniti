// PathNiti Mobile Service Worker
// Enhanced version for Capacitor mobile app

const STATIC_CACHE = "pathniti-mobile-static-v1.0.0";
const DYNAMIC_CACHE = "pathniti-mobile-dynamic-v1.0.0";
const OFFLINE_CACHE = "pathniti-mobile-offline-v1.0.0";

// Files to cache for offline functionality
const STATIC_FILES = [
  "/",
  "/manifest.json",
  "/favicon-pathniti.svg",
  "/icons/icon-72x72.svg",
  "/icons/icon-96x96.svg",
  "/icons/icon-128x128.svg",
  "/icons/icon-144x144.svg",
  "/icons/icon-152x152.svg",
  "/icons/icon-192x192.svg",
  "/icons/icon-384x384.svg",
  "/icons/icon-512x512.svg",
  "/offline",
];

// API routes that should be cached for offline use
const API_CACHE_PATTERNS = [
  '/api/colleges',
  '/api/scholarships',
  '/api/timeline',
  '/api/quiz/questions',
  '/api/assessment/last-test',
];

// Install event - cache static files
self.addEventListener("install", (event) => {
  console.log("Mobile Service Worker: Installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("Mobile Service Worker: Caching static files");
        return Promise.allSettled(
          STATIC_FILES.map((file) => {
            return cache.add(file).catch((error) => {
              console.warn(`Mobile Service Worker: Failed to cache ${file}:`, error);
              return null;
            });
          })
        );
      })
      .then(() => {
        console.log("Mobile Service Worker: Installation complete");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Mobile Service Worker: Installation failed", error);
        return self.skipWaiting();
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Mobile Service Worker: Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.includes("pathniti-mobile")) {
              console.log("Mobile Service Worker: Deleting old cache", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        console.log("Mobile Service Worker: Activated");
        return self.clients.claim();
      }),
  );
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip requests to external domains
  if (url.origin !== location.origin) {
    return;
  }

  // Handle different types of requests
  if (isStaticFile(request)) {
    // Static files - cache first strategy
    event.respondWith(cacheFirst(request));
  } else if (isApiRequest(request)) {
    // API requests - network first with cache fallback
    event.respondWith(networkFirstWithOfflineFallback(request));
  } else if (isPageRequest(request)) {
    // Page requests - network first with offline fallback
    event.respondWith(networkFirstWithOfflineFallback(request));
  } else {
    // Other requests - network first
    event.respondWith(networkFirst(request));
  }
});

// Cache first strategy for static files
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error("Cache first strategy failed:", error);
    return new Response("Offline - Static file not available", { status: 503 });
  }
}

// Network first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("Network failed, trying cache:", error);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response("Resource not available offline", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

// Network first with offline fallback
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("Network failed, trying cache:", error);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for page requests
    if (isPageRequest(request)) {
      const offlineResponse = await caches.match("/offline");
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    // Return offline response for API requests
    if (isApiRequest(request)) {
      return new Response(
        JSON.stringify({
          error: "Offline",
          message: "This data is not available offline",
          offline: true,
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Fallback offline response
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PathNiti - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              text-align: center; 
              padding: 2rem; 
              background: #f3f4f6;
            }
            .container { 
              max-width: 400px; 
              margin: 0 auto; 
              background: white; 
              padding: 2rem; 
              border-radius: 8px; 
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            h1 { color: #1E40AF; }
            p { color: #6B7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📱 PathNiti</h1>
            <h2>You're Offline</h2>
            <p>Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      },
    );
  }
}

// Helper functions
function isStaticFile(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg")
  );
}

function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith("/api/");
}

function isPageRequest(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith("/") &&
    !url.pathname.startsWith("/api/") &&
    !url.pathname.startsWith("/_next/") &&
    !url.pathname.startsWith("/icons/") &&
    !url.pathname.includes(".")
  );
}

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("Mobile Service Worker: Background sync triggered", event.tag);

  if (event.tag === "quiz-submission") {
    event.waitUntil(syncQuizSubmission());
  } else if (event.tag === "profile-update") {
    event.waitUntil(syncProfileUpdate());
  } else if (event.tag === "assessment-submission") {
    event.waitUntil(syncAssessmentSubmission());
  }
});

// Sync quiz submissions when back online
async function syncQuizSubmission() {
  try {
    const pendingSubmissions = await getPendingQuizSubmissions();

    for (const submission of pendingSubmissions) {
      try {
        const response = await fetch("/api/quiz/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submission),
        });

        if (response.ok) {
          await removePendingQuizSubmission(submission.id);
          console.log("Quiz submission synced:", submission.id);
        }
      } catch (error) {
        console.error("Failed to sync quiz submission:", error);
      }
    }
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Sync profile updates when back online
async function syncProfileUpdate() {
  try {
    const pendingUpdates = await getPendingProfileUpdates();

    for (const update of pendingUpdates) {
      try {
        const response = await fetch("/api/profile/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(update),
        });

        if (response.ok) {
          await removePendingProfileUpdate(update.id);
          console.log("Profile update synced:", update.id);
        }
      } catch (error) {
        console.error("Failed to sync profile update:", error);
      }
    }
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Sync assessment submissions when back online
async function syncAssessmentSubmission() {
  try {
    const pendingSubmissions = await getPendingAssessmentSubmissions();

    for (const submission of pendingSubmissions) {
      try {
        const response = await fetch("/api/assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submission),
        });

        if (response.ok) {
          await removePendingAssessmentSubmission(submission.id);
          console.log("Assessment submission synced:", submission.id);
        }
      } catch (error) {
        console.error("Failed to sync assessment submission:", error);
      }
    }
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// IndexedDB helpers for offline storage
async function getPendingQuizSubmissions() {
  // Implementation would use IndexedDB
  return [];
}

async function removePendingQuizSubmission(id) {
  console.log("Removed pending quiz submission:", id);
}

async function getPendingProfileUpdates() {
  return [];
}

async function removePendingProfileUpdate(id) {
  console.log("Removed pending profile update:", id);
}

async function getPendingAssessmentSubmissions() {
  return [];
}

async function removePendingAssessmentSubmission(id) {
  console.log("Removed pending assessment submission:", id);
}

// Push notification handling
self.addEventListener("push", (event) => {
  console.log("Mobile Service Worker: Push notification received");

  const options = {
    body: "You have new updates on PathNiti",
    icon: "/icons/icon-192x192.svg",
    badge: "/icons/icon-72x72.svg",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View Updates",
        icon: "/icons/icon-192x192.svg",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/icon-192x192.svg",
      },
    ],
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data = { ...options.data, ...data };
  }

  event.waitUntil(self.registration.showNotification("PathNiti", options));
});

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  console.log("Mobile Service Worker: Notification clicked");

  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/dashboard"));
  } else if (event.action === "close") {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(clients.openWindow("/"));
  }
});

console.log("Mobile Service Worker: Loaded successfully");
