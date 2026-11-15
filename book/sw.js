// Service worker: TEPPEN 書籍版
// ・画面（HTML）は「通信できれば最新を取得 → 端末に保存」、通信できないときだけ保存分を使う
// ・アイコン等は保存分を優先
const CACHE = 'teppen-book-v7';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(ASSETS.map(u => fetch(new Request(u, { cache: 'reload' })).then(r => r.ok && c.put(u, r)).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('teppen-book-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const path = new URL(req.url).pathname;
  const isPage = req.mode === 'navigate' || /\/(index\.html)?$/.test(path);
  if (isPage) {
    e.respondWith(
      fetch(new Request(req.url, { cache: 'no-store' }))
        .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return r; })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
