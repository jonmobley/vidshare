// VidShare PWA Service Worker
const CACHE_NAME = 'vidshare-v1.0.0';
const STATIC_CACHE = 'vidshare-static-v1';
const DYNAMIC_CACHE = 'vidshare-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/vertical/',
  '/vertical/index.html',
  '/vertical/manifest.json',
  '/vertical/styles/main.css',
  '/vertical/styles/animations.css',
  '/vertical/styles/controls.css',
  '/vertical/js/main.js',
  '/vertical/js/VirtualVideoGallery.js',
  '/vertical/js/core/VideoRenderer.js',
  '/vertical/js/core/VideoPool.js',
  '/vertical/js/core/NavigationController.js',
  '/vertical/js/core/ControlsManager.js',
  '/vertical/js/core/GestureHandler.js',
  '/vertical/js/data/videoData.js'
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Caching static files...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Static files cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Failed to cache static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/vertical/index.html')
        .then(response => {
          return response || fetch(request);
        })
    );
    return;
  }
  
  // Handle static files
  if (STATIC_FILES.includes(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          return response || fetch(request);
        })
    );
    return;
  }
  
  // Handle video and media files
  if (request.url.includes('/videos/') || request.url.includes('.mp4') || request.url.includes('.webm')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE)
        .then(cache => {
          return cache.match(request)
            .then(response => {
              if (response) {
                return response;
              }
              
              return fetch(request)
                .then(fetchResponse => {
                  // Only cache successful responses
                  if (fetchResponse.status === 200) {
                    cache.put(request, fetchResponse.clone());
                  }
                  return fetchResponse;
                })
                .catch(() => {
                  // Return offline fallback for videos if available
                  return new Response('Video temporarily unavailable', {
                    status: 503,
                    statusText: 'Service Unavailable'
                  });
                });
            });
        })
    );
    return;
  }
  
  // Handle all other requests with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then(response => {
        return response || fetch(request)
          .then(fetchResponse => {
            return caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(request, fetchResponse.clone());
                return fetchResponse;
              });
          });
      })
      .catch(() => {
        // Offline fallback
        if (request.destination === 'document') {
          return caches.match('/vertical/index.html');
        }
      })
  );
});

// Background sync for improved performance
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Pre-cache upcoming videos for smoother experience
  return caches.open(DYNAMIC_CACHE)
    .then(cache => {
      // Logic to prefetch next videos could go here
      console.log('🎬 Background sync completed');
    });
}

// Handle messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notification support (for future features)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/vertical/icons/icon-192x192.png',
        badge: '/vertical/icons/icon-72x72.png',
        tag: 'vidshare-notification'
      })
    );
  }
});

console.log('🎯 VidShare Service Worker loaded successfully'); 