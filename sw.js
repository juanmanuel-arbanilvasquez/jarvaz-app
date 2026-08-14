// Service Worker para JARVAZ PWA
const CACHE_NAME = 'jarvaz-cache-v1';
const ASSETS_CACHE = [
  'inicio.html',
  'inicio_de_sesion_general.html',
  'inicio_de_sesion_profesor.html',
  'clave_premium_jarvas.html',
  'https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-400-normal.css',
  'https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-600-normal.css',
  'https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-700-normal.css',
  'https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-700-normal.css',
  'https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-900-normal.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('JARVAZ SW: Cache abierto');
        return cache.addAll(ASSETS_CACHE);
      })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('JARVAZ SW: Limpiando cache viejo', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: estrategia Network First con fallback a Cache
self.addEventListener('fetch', (event) => {
  // Solo manejar peticiones GET
  if (event.request.method !== 'GET') return;
  
  // No cachear peticiones a la API de Google Apps Script
  if (event.request.url.includes('script.google.com')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, actualizar el cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar servir del cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Si no está en cache y falla la red, devolver inicio.html
          if (event.request.mode === 'navigate') {
            return caches.match('inicio.html');
          }
        });
      })
  );
});