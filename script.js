// --- Configuración Push (¡REEMPLAZA CON TU CLAVE PÚBLICA VAPID REAL!) ---
// Genera tus claves aquí: https://www.npmjs.com/package/web-push#command-line
// O usa: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = 'BGHsIWQg0ymY4p_ZC4rMXT927zhFCq1goXNfw-NK1OBylZkZqimwld7yQ5w65PuIZtK-EUE8ktsctYwLRWC2Ij4'; // <-- ¡¡¡ REEMPLAZA ESTA CLAVE !!!

// --- Código del Service Worker (embebido como string) ---
const serviceWorkerCode = `
// service-worker.js (Contenido embebido)

// Evento 'install': Se dispara cuando el SW se instala por primera vez.
self.addEventListener('install', event => {
  console.log('Service Worker: Instalado');
  // Forzar al SW a activarse inmediatamente después de la instalación
  // Esto asegura que el SW tome control de la página actual sin necesidad de recargar.
  event.waitUntil(self.skipWaiting());
});

// Evento 'activate': Se dispara cuando el SW se activa (después de 'install').
self.addEventListener('activate', event => {
  console.log('Service Worker: Activado');
  // Tomar control de los clientes (pestañas) abiertos inmediatamente.
  // Esencial para que el SW pueda interceptar eventos como 'push' de inmediato.
  event.waitUntil(clients.claim());
});

// Evento 'push': Se dispara cuando llega una notificación push DESDE EL SERVIDOR.
// Este es el listener principal para notificaciones push reales enviadas por tu backend.
self.addEventListener('push', event => {
  console.log('Service Worker: Push Recibido.');

  let title = 'Nueva Notificación';
  let options = {
    body: 'Tienes un nuevo mensaje.',
    icon: './assets/logo.png', // Asegúrate que esta ruta sea accesible desde la raíz del SW
    tag: 'default-push-message',
    // Puedes añadir más opciones por defecto aquí
  };

  // Intentar parsear datos del push enviados por el servidor (si los hay)
  if (event.data) {
    try {
      const data = event.data.json(); // Asume que el backend envía JSON
      console.log('Service Worker: Datos del Push (JSON):', data);
      title = data.title || title;
      options.body = data.body || options.body;
      options.icon = data.icon || options.icon;
      options.tag = data.tag || options.tag; // Un tag único puede reemplazar notificaciones anteriores con el mismo tag
      options.data = data.data || {}; // Datos personalizados para usar en 'notificationclick'
      // Ejemplo: options.data = { url: '/ruta/especifica' };
    } catch (e) {
      // Si no es JSON, usar como texto plano
      const textData = event.data.text();
      console.log('Service Worker: Datos del Push (Texto):', textData);
      options.body = textData;
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
  const notificationData = event.notification.data; // Obtener datos personalizados
  event.notification.close(); // Cierra la notificación

  // Acción a realizar: Enfocar una ventana existente o abrir una nueva.
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // Intenta encontrar una ventana abierta que coincida con la URL de los datos (si existe)
      const urlToOpen = (notificationData && notificationData.url) ? notificationData.url : '/'; // URL por defecto si no hay datos específicos

      for (const client of clientList) {
        // Si la URL coincide (o si solo queremos enfocar cualquier ventana de la app) y se puede enfocar
        if (client.url === urlToOpen && 'focus' in client) {
           console.log('Service Worker: Enfocando cliente existente:', client.url);
           return client.focus();
        }
      }
      // Si no hay ninguna ventana abierta con esa URL (o no se especificó URL), abrir una nueva
      if (clients.openWindow) {
        console.log('Service Worker: Abriendo nueva ventana a:', urlToOpen);
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
`; // Fin del string del Service Worker

// --- Funciones Principales (Exportables) ---

/**
 * Registra el Service Worker embebido.
 * Debe llamarse al cargar la página principal.
 */
async function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Service Worker o PushManager no son soportados en este navegador.');
        return false;
    }

    try {
        // Crear un Blob a partir del string del código del SW
        const swBlob = new Blob([serviceWorkerCode], { type: 'application/javascript' });
        // Crear una URL temporal para el Blob
        const swUrl = URL.createObjectURL(swBlob);

        // Registrar el Service Worker usando la URL del Blob
        const registration = await navigator.serviceWorker.register(swUrl, { scope: './' });
        console.log('Service Worker registrado con éxito desde Blob, scope:', registration.scope);

        // Opcional: Liberar la URL del Blob una vez registrado (buena práctica)
        // Aunque el navegador suele manejarlo, hacerlo explícitamente es más limpio.
        // No lo revocamos inmediatamente para asegurar que el registro complete.
        // Podría revocarse más tarde si es necesario, pero generalmente no causa problemas.
        // URL.revokeObjectURL(swUrl); // Descomentar con precaución o si se gestiona el ciclo de vida

        return true;
    } catch (error) {
        console.error('Error registrando Service Worker desde Blob:', error);
        return false;
    }
}

/**
 * Solicita permiso al usuario para mostrar notificaciones.
 * DEBE ser llamada como resultado de una interacción del usuario (ej. clic en botón).
 * @returns {Promise<boolean>} - Resuelve a true si el permiso fue concedido, false en caso contrario.
 */
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('Este navegador no soporta notificaciones de escritorio.');
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Permiso de notificación concedido.');
            // Opcional: Aquí podrías intentar suscribir al usuario a Push si aún no lo está
            // subscribeUser(); // Descomentar si implementas la suscripción real
            return true;
        } else {
            console.warn('Permiso de notificación NO concedido:', permission);
            return false;
        }
    } catch (error) {
        console.error('Error solicitando permiso de notificación:', error);
        return false;
    }
}

/**
 * Muestra una notificación push con un número específico.
 * @param {number} number - El número a mostrar en la notificación.
 */
async function showPushNotificationWithNumber(number) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push no soportado.');
        return;
    }

    // 1. Verificar permiso (aunque idealmente ya se pidió antes)
    if (Notification.permission !== 'granted') {
        console.warn('Intento de mostrar notificación sin permiso. Solicítalo primero con requestNotificationPermission().');
        // Podrías intentar solicitar permiso aquí, pero es MEJOR hacerlo con interacción del usuario.
        // const granted = await requestNotificationPermission();
        // if (!granted) return;
        return; // Salir si no hay permiso
    }

    // 2. Definir opciones de la notificación
    const notificationOptions = {
        body: `El número recibido es: ${number}`,
        icon: './assets/logo.png', // Asegúrate que esta ruta es accesible
        tag: `numero-${number}`, // Un tag para agrupar o reemplazar notificaciones similares
        // requireInteraction: false, // Por defecto es false, el usuario no necesita interactuar para que desaparezca
        // silent: true, // Para que no suene ni vibre (si quieres que sea silenciosa)
        data: { // Datos personalizados que puedes usar en el evento 'notificationclick' del SW
            numeroRecibido: number,
            url: window.location.origin + '/ruta-al-clickear?numero=' + number // Ejemplo de URL a abrir al hacer clic
        }
        // Puedes añadir más opciones: vibrate, actions, etc.
    };

    try {
        // 3. Obtener el registro del Service Worker activo
        const registration = await navigator.serviceWorker.ready; // Espera a que el SW esté activo

        // 4. Mostrar la notificación usando el Service Worker
        await registration.showNotification(
            'Número Recibido', // Título de la notificación
            notificationOptions
        );
        console.log(`Notificación mostrada para el número: ${number}`);

    } catch (error) {
        console.error('Error al mostrar la notificación desde el script principal:', error);
    }
}

// --- Funciones Auxiliares (No exportadas directamente, pero usadas internamente o para referencia) ---

// Función de utilidad para convertir la clave VAPID (necesaria para suscripción real a push)
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Función para suscribir al usuario a notificaciones push (requiere tu VAPID_PUBLIC_KEY)
// Esta función es para notificaciones PUSH REALES enviadas desde tu servidor.
// Deberías llamarla DESPUÉS de obtener el permiso del usuario.
/*
async function subscribeUser() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    try {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            console.log('Usuario ya suscrito:', subscription);
            // Opcional: Podrías reenviar la suscripción al backend por si se perdió
            // sendSubscriptionToBackend(subscription);
            return subscription;
        }

        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true, // Requerido, indica que cada push mostrará una notificación
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) // Tu clave pública VAPID
        });

        console.log('Nueva suscripción obtenida:', subscription);

        // *** PASO CRÍTICO: ENVIAR 'subscription' A TU BACKEND AQUÍ ***
        // await sendSubscriptionToBackend(subscription);

        return subscription;
    } catch (error) {
        console.error('Error al suscribir al usuario:', error);
        if (error.name === 'NotAllowedError') {
             console.warn('El usuario denegó el permiso de notificación persistentemente.');
        }
        return null;
    }
}

async function sendSubscriptionToBackend(subscription) {
     // Ejemplo de cómo podrías enviar la suscripción a tu servidor
     try {
         const response = await fetch('/api/subscribe', { // Cambia '/api/subscribe' por tu endpoint real
             method: 'POST',
             body: JSON.stringify(subscription),
             headers: {
                 'Content-Type': 'application/json'
             }
         });
         if (!response.ok) {
             throw new Error('Falló la respuesta del servidor al enviar suscripción.');
         }
         console.log('Suscripción enviada al backend con éxito.');
     } catch (error) {
         console.error('Error enviando la suscripción al backend:', error);
     }
}
*/


// --- Exportar las funciones que necesitas usar desde otros scripts ---
export {
    registerServiceWorker,
    requestNotificationPermission,
    showPushNotificationWithNumber,
    registerServiceWorker,
    // Exporta subscribeUser si decides implementar la suscripción real
    // subscribeUser
};

// --- Inicialización ---
// Registrar el Service Worker tan pronto como el script se cargue.
// No bloquea la ejecución de otras partes de tu página.
//registerServiceWorker();