const CACHE_NAME = 'berlin-guida-v2-5';
const APP_FILES = [
  './', './index.html', './manifest.json', './icon.svg', './css/style.css',
  './js/app.js', './js/map.js', './js/audio.js', './js/navigation.js',
  './data/itineraries.json', './data/day-1.json', './data/day-2.json',
  './data/day-3.json', './data/day-4.json', './pois/poi-001.json',
  './pois/poi-template.json'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME)
    .then(cache => cache.addAll(APP_FILES))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys
      .filter(key => key.startsWith('berlin-guida-') && key !== CACHE_NAME)
      .map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => {
    if (cached) return cached;
    return fetch(event.request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    });
  }));
});
