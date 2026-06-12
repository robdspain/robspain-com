const CACHE_NAME = 'family-command-v1';
const APP_SHELL = [
  '/admin/family/',
  '/admin/court-compliance/',
  '/admin/home-search/',
  '/family-command.webmanifest',
  '/public/images/family-command-icon-180.png',
  '/public/images/family-command-icon-192.png',
  '/public/images/family-command-icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key.startsWith('family-command-'))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin/api/')) return;

  const isFamilyPage = url.pathname === '/admin/family/' ||
    url.pathname === '/admin/court-compliance/' ||
    url.pathname === '/admin/home-search/';
  const isFamilyAsset = url.pathname === '/family-command.webmanifest' ||
    url.pathname === '/public/images/family-command-icon-180.png' ||
    url.pathname === '/public/images/family-command-icon-192.png' ||
    url.pathname === '/public/images/family-command-icon-512.png';

  if (!isFamilyPage && !isFamilyAsset) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/admin/family/')))
  );
});
