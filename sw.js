// Service worker del portal: guarda lo necesario para abrir el plan sin conexión (gimnasio sin señal).
const CACHE = 'clab-portal-v2';
const SHELL = ['portal.html', 'portal.css', 'portal.js', 'logo-mark.svg', 'manifest.webmanifest'];
const mine = (u) => u.origin === location.origin && /(portal\.(html|js|css)|logo-mark\.svg|manifest\.webmanifest)$/.test(u.pathname);

self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });

self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  // Imágenes de ejercicios y fuentes: primero caché
  if (r.destination === 'image' || u.hostname.includes('fonts.g')) {
    e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(r, cp)); return res; }).catch(() => hit)));
    return;
  }
  // Archivos del portal: primero red, caché si no hay internet
  if (mine(u)) {
    e.respondWith(fetch(r).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(r, cp)); return res; })
      .catch(() => caches.match(r).then((h) => h || caches.match(r, { ignoreSearch: true }))));
  }
});
