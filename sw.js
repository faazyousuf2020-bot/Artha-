// Offline cache for Artha. Bump VERSION when files change.
const VERSION = 'artha-v1.0.0';
const FILES = ['./','index.html','css/styles.css','js/format.js','js/data.js','js/charts.js','js/views.js','js/assistant.js','js/app.js','icon.svg','manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
