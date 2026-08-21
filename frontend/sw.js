const CACHE_NAME = 'kelvi-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './manifest.json',
  './img/logo.png',
  './img/icon-192.png',
  './img/icon-512.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activación y limpieza de caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia Network First con fallback a Cache
self.addEventListener('fetch', (event) => {
  // Ignorar llamadas a la API de backend para no cachear datos en tiempo real
  if (event.request.url.includes('/propiedades') || 
      event.request.url.includes('/usuarios') || 
      event.request.url.includes('/postulaciones') || 
      event.request.url.includes('/contratos') || 
      event.request.url.includes('/tickets') || 
      event.request.url.includes('/proveedores')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
