// service-worker.js (SIN CAMBIOS)

const CACHE_NAME = '2fa-demo-cache-v1';
// ... (resto del código del service worker igual que antes) ...

self.addEventListener('install', event => {
  console.log('Service Worker: Instalado');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activado');
  event.waitUntil(clients.claim());
});

// Evento 'push': Maneja notificaciones push REALES (enviadas desde un servidor)
self.addEventListener('push', event => {
  console.log('Service Worker: Push Recibido.');
  // ... (lógica para mostrar notificación basada en datos del push) ...
  let title = 'Notificación Push';
  let options = {
    body: 'Contenido del push recibido.',
    icon: './assets/logo.png', // Asegúrate que esta ruta es correcta
    tag: 'generic-push-message'
  };
   if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      options.body = data.body || options.body;
      // ... más opciones
    } catch (e) {
      options.body = event.data.text();
    }
  }
  const notificationPromise = self.registration.showNotification(title, options);
  event.waitUntil(notificationPromise);
});

// Evento 'notificationclick': Maneja clics en las notificaciones
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Clic en Notificación. Tag:', event.notification.tag);
  event.notification.close();

  // Acción por defecto: enfocar/abrir ventana
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        // Cambia '/' por la URL que quieras abrir
        return clients.openWindow('/');
      }
    })
  );
});