const CACHE_NAME = 'clinica-mais-v1';
const urlsToCache = [
  '/',
  '/clinica-mais-inventario.html',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install: cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Offline na instalação? Tudo bem, só guarda o que conseguir
        console.log('Alguns recursos não conseguiram ser cacheados (ok offline)');
      });
    })
  );
  self.skipWaiting();
});

// Activate: limpar caches antigas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first para dados, cache-first para assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Para chamadas ao Supabase: tenta network primeiro
  if (url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Copia a resposta no cache
          if (response && response.status === 200 && request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Sem internet? Volta a versão em cache
          return caches.match(request);
        })
    );
  } else {
    // Para assets locais: cache-first
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).catch(() => new Response('Offline'));
      })
    );
  }
});

// Background Sync: sincroniza movimentos pendentes quando volta internet
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-movements') {
    event.waitUntil(syncPendingMovements());
  }
});

async function syncPendingMovements() {
  // Esta função será chamada quando volta internet
  // Os dados pendentes estão guardados em IndexedDB/localStorage pela app
  // Aqui é onde sincrizaria com Supabase
  console.log('Background sync: tentando sincronizar movimentos pendentes...');
}
