/* Cantaí Gorete — service worker
   Necessário pro Chrome instalar o app. Estratégia "rede primeiro":
   sempre busca a versão nova; só usa a cópia guardada se estiver sem internet. */
const CACHE = 'cantai-v2';
const BASE = ['/', '/index.html', '/qr.js', '/manifest.webmanifest', '/icone-192.png', '/icone-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;   // YouTube, ntfy etc. passam direto
  if (url.pathname.endsWith('.mp3')) return;                             // trilha: deixa o navegador cuidar
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('/') : Response.error())))
  );
});
