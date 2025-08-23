/**
 * Service Worker compatível com Vite
 * Versão simplificada sem dependências externas do Workbox
 */

const CACHE_NAME = 'whatize-v2-dynamic';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/logo_icon.svg',
  '/version.json'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files...');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Service Worker: Cache failed:', error);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - Dinâmico para Vite
self.addEventListener('fetch', (event) => {
  // Apenas cachear requisições GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Não cachear recursos do Vite dev server (node_modules/.vite)
  if (event.request.url.includes('node_modules/.vite') || 
      event.request.url.includes('@vite/') ||
      event.request.url.includes('?v=')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Fallback para página offline se necessário
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Message event para skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Claim clients imediatamente
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
