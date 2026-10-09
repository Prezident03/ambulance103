// Ambulance 103 — service worker: sayt internetsiz ham ochiladi.
// Sahifalar va skriptlar: avval tarmoq (yangi versiya), bo'lmasa kesh.
// Shriftlar, ikonkalar, Firebase SDK, rasmlar: keshdan, fonda yangilanadi.
// Firestore ma'lumotlari Firebase'ning o'z oflayn keshida saqlanadi (firebase.js).
const VERSION = 'v1';
const SHELL = `shell-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const PRECACHE = ['/', '/index.html', '/app.js', '/firebase.js', '/1.webp', '/manifest.webmanifest', '/icons/icon.svg', '/icons/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== ASSETS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const CDN_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net', 'www.gstatic.com'];

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // API va Firestore so'rovlariga tegmaymiz
  if (url.pathname.startsWith('/api/')) return;
  if (url.origin === location.origin) {
    e.respondWith(networkFirst(req));
  } else if (CDN_HOSTS.includes(url.hostname)) {
    e.respondWith(staleWhileRevalidate(req));
  }
});

async function networkFirst(req) {
  const cache = await caches.open(SHELL);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
    if (hit) return hit;
    if (req.mode === 'navigate') return cache.match('/index.html');
    throw err;
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(req);
  const fresh = fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
    return res;
  }).catch(() => hit);
  return hit || fresh;
}
