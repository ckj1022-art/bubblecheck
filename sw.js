// Bubble Check 離線小幫手：有網路時一律拿最新版；沒網路時用上次存下來的檔案打開
const CACHE = 'bubblecheck-v2';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './favicon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // 雲端同步的連線（Firestore）不經過這裡，也不存，避免卡住即時更新
  if (/googleapis\.com$/.test(new URL(req.url).hostname)) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        // 網頁本身、圖示，還有 React／Tailwind／字型，存一份備用
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./') : undefined)))
  );
});
