const CACHE_NAME = 'berlin-guida-v2-11';
const APP_FILES = [
  './', './index.html', './manifest.json', './icon.svg', './css/style.css',
  './js/app.js', './js/treasure-hunt.js', './js/map.js', './js/audio.js', './js/navigation.js',
  './data/itineraries.json', './data/treasure-hunt.json', './data/day-1.json', './data/day-2.json',
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

async function cachedRangeResponse(request, cachedResponse) {
  const range = request.headers.get('range');
  const match = range && range.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return cachedResponse;

  const blob = await cachedResponse.blob();
  const size = blob.size;
  let start;
  let end;
  if (match[1] === '') {
    const suffixLength = Number(match[2]);
    if (!suffixLength) return new Response(null, { status: 416 });
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= size || start > end) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': 'bytes */' + size }
    });
  }

  const headers = new Headers(cachedResponse.headers);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Range', 'bytes ' + start + '-' + end + '/' + size);
  headers.set('Content-Length', String(end - start + 1));
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers
  });
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Media players can request byte ranges. Serve them from the complete
    // cached audio file when available; never cache a partial 206 response.
    if (request.headers.has('range')) {
      const fullRequest = new Request(requestUrl.href, { method: 'GET' });
      const cachedAudio = await cache.match(fullRequest);
      if (cachedAudio) return cachedRangeResponse(request, cachedAudio);
      return fetch(request);
    }

    // JSON is network-first so updated itineraries replace older cached data.
    if (requestUrl.pathname.endsWith('.json')) {
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;
        return new Response('Contenuto non disponibile offline.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    }

    // Downloaded audio stays cache-first; app shell files are network-first
    // so an installed PWA receives fixes as soon as it is opened online.
    const isAudio = /\\.(mp3|m4a|ogg|wav)$/i.test(requestUrl.pathname);
    if (isAudio) {
      const cachedAudio = await cache.match(request);
      if (cachedAudio) return cachedAudio;
    }
    try {
      const response = await fetch(request, { cache: 'no-store' });
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(request);
      if (cached) return cached;
      return new Response('Contenuto non disponibile offline.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});

self.addEventListener('message', event => {
  if (!event.data || event.data.type !== 'CACHE_URLS') return;
  const port = event.ports && event.ports[0];
  const urls = Array.isArray(event.data.urls) ? event.data.urls : [];

  const work = (async () => {
    const cache = await caches.open(CACHE_NAME);
    const results = [];
    for (const rawUrl of urls) {
      try {
        const url = new URL(rawUrl, self.location.href);
        if (url.origin !== self.location.origin) throw new Error('Risorsa esterna non consentita');
        const cached = await cache.match(url.href);
        try {
          const response = await fetch(url.href, { cache: 'no-store' });
          if (!response.ok) throw new Error('HTTP ' + response.status);
          await cache.put(url.href, response.clone());
          results.push({ url: url.href, ok: true, cached: false });
        } catch (networkError) {
          if (cached) {
            results.push({ url: url.href, ok: true, cached: true });
          } else {
            results.push({ url: url.href, ok: false, error: networkError.message || String(networkError) });
          }
        }
      } catch (error) {
        results.push({ url: String(rawUrl), ok: false, error: error.message || String(error) });
      }
      if (port) port.postMessage({ type: 'progress', completed: results.length, total: urls.length });
    }
    if (port) port.postMessage({ type: 'complete', results });
  })();

  event.waitUntil(work.catch(error => {
    if (port) port.postMessage({ type: 'error', message: error.message || String(error) });
  }));
});
