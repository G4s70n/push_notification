// service-worker.js

const CACHE_NAME = '2fa-demo-cache-v1';
const urlsToCache = [
  // Puedes añadir aquí URLs de assets que quieras precachear (opcional)
  // './', // Cuidado con cachear '/', puede dar problemas al actualizar SW
  // './index.html',
  // './script.js',
  // './icon.png',
  // './manifest.json'
];

// Evento 'install': Se dispara cuando el SW se instala por primera vez.
self.addEventListener('install', event => {
  console.log('Service Worker: Instalado');
  // Precaching opcional
  // event.waitUntil(
  //   caches.open(CACHE_NAME)
  //     .then(cache => {
  //       console.log('Service Worker: Cacheando archivos iniciales');
  //       return cache.addAll(urlsToCache);
  //     })
  // );
  // Forzar al SW a activarse inmediatamente después de la instalación
  self.skipWaiting();
});

// Evento 'activate': Se dispara cuando el SW se activa (después de 'install').
self.addEventListener('activate', event => {
  console.log('Service Worker: Activado');
  // Tomar control de los clientes (pestañas) abiertos inmediatamente
  event.waitUntil(clients.claim());
  // Opcional: Limpiar caches antiguas si cambias CACHE_NAME
  // event.waitUntil(
  //   caches.keys().then(cacheNames => {
  //     return Promise.all(
  //       cacheNames.map(cache => {
  //         if (cache !== CACHE_NAME) {
  //           console.log('Service Worker: Borrando cache antigua', cache);
  //           return caches.delete(cache);
  //         }
  //       })
  //     );
  //   })
  // );
});

// Evento 'fetch': Opcional, para manejar peticiones de red (cache-first, network-first, etc.)
// No es estrictamente necesario para la funcionalidad de Push/Voz.
/*
self.addEventListener('fetch', event => {
  // console.log('Service Worker: Fetching', event.request.url);
  // event.respondWith(
  //   caches.match(event.request)
  //     .then(response => {
  //       // Cache hit - return response
  //       if (response) {
  //         return response;
  //       }
  //       // Clone the request because it's a one-time use stream
  //       const fetchRequest = event.request.clone();
  //       return fetch(fetchRequest).then(
  //         response => {
  //           // Check if we received a valid response
  //           if(!response || response.status !== 200 || response.type !== 'basic') {
  //             return response;
  //           }
  //           // Clone the response because it's also a one-time use stream
  //           const responseToCache = response.clone();
  //           caches.open(CACHE_NAME)
  //             .then(cache => {
  //               cache.put(event.request, responseToCache);
  //             });
  //           return response;
  //         }
  //       );
  //     })
  //   );
});
*/

// Evento 'push': Se dispara cuando llega una notificación push DESDE EL SERVIDOR.
// Aunque en la demo la activamos desde el cliente, este es el listener para pushes reales.
self.addEventListener('push', event => {
  console.log('Service Worker: Push Recibido.');

  let title = 'Notificación Push';
  let options = {
    body: 'Contenido del push recibido.',
    icon: 'icon.png',
    badge: 'icon.png',
    tag: 'generic-push-message'
  };

  // Intentar parsear datos del push enviados por el servidor (si los hay)
  if (event.data) {
    try {
      const data = event.data.json(); // Asume que el backend envía JSON
      console.log('Service Worker: Datos del Push (JSON):', data);
      title = data.title || title;
      options.body = data.body || options.body;
      options.icon = data.icon || options.icon;
      options.badge = data.badge || options.badge;
      options.tag = data.tag || options.tag;
      // Puedes añadir más opciones aquí basadas en `data`
      // options.actions = data.actions;
      // options.data = data.customData; // Datos para usar en 'notificationclick'
    } catch (e) {
      // Si no es JSON, usar como texto plano
      console.log('Service Worker: Datos del Push (Texto):', event.data.text());
      options.body = event.data.text();
      options.tag = 'text-push-message';
    }
  } else {
      console.log('Service Worker: Push recibido sin datos.');
  }

  // Mostrar la notificación
  // event.waitUntil mantiene el SW activo hasta que la promesa se resuelva
  const notificationPromise = self.registration.showNotification(title, options);
  event.waitUntil(notificationPromise);
});

// Evento 'notificationclick': Se dispara cuando el usuario hace clic en una notificación MOSTRADA por este SW.
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Clic en Notificación. Tag:', event.notification.tag);
  event.notification.close(); // Cierra la notificación

  // Acción a realizar: Enfocar una ventana existente o abrir una nueva.
  event.waitUntil(
    clients.matchAll({
      type: 'window', // Buscar solo ventanas/pestañas
      includeUncontrolled: true // Incluir clientes que el SW no controla todavía
    }).then(clientList => {
      // Buscar una ventana/pestaña ya abierta de nuestra app
      for (const client of clientList) {
        // Puedes hacer la condición más específica, por ejemplo, por URL:
        // if (client.url === '/' && 'focus' in client)
        if ('focus' in client) { // Si se puede enfocar
          console.log('Service Worker: Enfocando cliente existente.');
          return client.focus();
        }
      }
      // Si no hay ninguna ventana abierta, abrir una nueva
      if (clients.openWindow) {
        console.log('Service Worker: Abriendo nueva ventana.');
        // Cambia '/' por la URL específica que quieres abrir
        return clients.openWindow('/');
      }
    })
  );
});
