const CACHE_NAME = 'stat-app-v12';
// オフライン時に手元に残しておきたいファイルのリスト
const ASSETS = [
  'index.html',
  'style.css',
  'app.js',
  'court.png',
  'manifest.json'
];

// アプリ起動時にファイルをスマホ内部に保存（インストール）する
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 通信（リクエスト）が発生した際、ネットが繋がらなくても保存したファイルを返す
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
