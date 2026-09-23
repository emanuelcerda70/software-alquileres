const CACHE_NAME = 'kelvi-cache-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.html',
  './css/style.css',
  './js/app.js',
  './manifest.json',
  './img/logo.png',
  './img/icon-192.png',
  './img/icon-512.png'
];

// Instalación del Service Worker: Pre-cachear activos críticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activación y limpieza de versiones antiguas de caché
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Eliminando caché antiguo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia Network First con fallback a Cache y página offline amigable
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorar llamadas a endpoints de la API para mantener datos en tiempo real
  if (url.pathname.includes('/propiedades') || 
      url.pathname.includes('/usuarios') || 
      url.pathname.includes('/postulaciones') || 
      url.pathname.includes('/contratos') || 
      url.pathname.includes('/tickets') || 
      url.pathname.includes('/proveedores') ||
      url.pathname.includes('/dashboard')) {
    return;
  }

  // Para navegación HTML: Intentar red, si falla usar cache o fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) return cachedResponse;
          const appCached = await caches.match('./app.html');
          if (appCached) return appCached;

          // Si no hay nada en caché, devolver HTML offline nativo de Kelvi
          return new Response(
            `<!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Sin conexión | Kelvi</title>
              <link rel="icon" type="image/png" href="img/logo.png">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 40px 20px; background: #f8fafc; color: #0f172a; }
                .card { max-width: 400px; margin: 60px auto; background: white; padding: 32px 24px; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
                .icon { font-size: 48px; margin-bottom: 16px; }
                h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #0f172a; }
                p { font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 24px; }
                .btn { background: #00a650; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; text-decoration: none; display: inline-block; }
                .btn:hover { background: #008c44; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="icon">📡</div>
                <h1>Estás sin conexión</h1>
                <p>No pudimos conectarnos a los servidores de Kelvi. Revisá tu señal Wi-Fi o datos móviles para continuar.</p>
                <button class="btn" onclick="window.location.reload()">Reintentar conexión</button>
              </div>
            </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // Para otros activos (css, js, imágenes): Intentar red, fallback a cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

// ─── PUSH NOTIFICATIONS ──────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Kelvi', body: event.data.text() };
    }
  }

  const title = data.title || 'Kelvi Notificaciones';
  const options = {
    body: data.body || 'Tenés una novedad en tu alquiler.',
    icon: 'img/icon-192.png',
    badge: 'img/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/app.html'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Manejo del click en la notificación push
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/app.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes('/app.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
