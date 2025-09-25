// Script para limpar service worker problemático
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      console.log('🧹 Removendo service worker:', registration.scope);
      registration.unregister();
    }
  });
}

// Limpar caches
if ('caches' in window) {
  caches.keys().then(function(cacheNames) {
    return Promise.all(
      cacheNames.map(function(cacheName) {
        console.log('🧹 Removendo cache:', cacheName);
        return caches.delete(cacheName);
      })
    );
  });
}

console.log('🧹 Service Workers e caches limpos. Recarregue a página.');