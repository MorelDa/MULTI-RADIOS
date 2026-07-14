// MultiRadios Service Worker - PWA
const CACHE_NAME = 'multiradios-v1.4.0';
const ASSETS = [
  './',
  './index.html',
  './admin.html',
  './radios.json',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn('SW cache skip:', url, err))
        )
      )
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Nunca cachear los streams de audio (radio en vivo) ni el endpoint de compartir
  if (req.destination === 'audio' || url.pathname.includes('/stream') || url.pathname.includes('/live') || url.pathname.includes('/api/share')) {
    return;
  }

  // Network-first para radios.json (datos siempre frescos)
  if (url.pathname.endsWith('radios.json')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first para el resto (app shell)
  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req)
          .then((res) => {
            if (res && res.status === 200 && req.method === 'GET') {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => cached)
      );
    })
  );
});

// Al pulsar una notificación del sistema, abre/enfoca la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || './index.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});

// Soporte opcional de Web Push (si en el futuro se configura un servidor con VAPID)
self.addEventListener('push', (event) => {
  let payload = { title: 'MultiRadios', body: 'Tienes una novedad', icon: 'icon-192.png' };
  try { if (event.data) payload = Object.assign(payload, event.data.json()); } catch (_) {}
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body, icon: payload.icon || 'icon-192.png', badge: 'icon-192.png',
      data: { url: payload.link || './index.html' }
    })
  );
});
