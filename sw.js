const CACHE_NAME = 'esp-ui-v5';

const FILES_TO_CACHE = [
  './',
  './index.html',
  './all.min.css',
  './loader.css',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Установка Service Worker
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Активация и удаление старых кэшей
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => key !== CACHE_NAME && caches.delete(key))
      )
    )
  );
  self.clients.claim();
});


// Стратегия "Cache then Network"
// self.addEventListener('fetch', e => {
//   e.respondWith(
//     fetch(e.request)
//       .then(res => {
//         // Если есть ответ от сервера, сохраняем его в кэш
//         const resClone = res.clone();
//         caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
//         return res;
//       })
//       .catch(() => caches.match(e.request).then(r => r || caches.match('./offline.html')))
//   );
// });
