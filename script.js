// Referencias a elementos del DOM
const googleNumberDisplay = document.getElementById('googleNumber');
const googleNumberContainer = document.getElementById('googleNumberContainer');
const statusDiv = document.getElementById('status');
const interactionPrompt = document.getElementById('interactionPrompt');
const mainContent = document.getElementById('mainContent');

// --- Configuración Push (¡REEMPLAZA CON TU CLAVE PÚBLICA VAPID REAL!) ---
const VAPID_PUBLIC_KEY = 'BGHsIWQg0ymY4p_ZC4rMXT927zhFCq1goXNfw-NK1OBylZkZqimwld7yQ5w65PuIZtK-EUE8ktsctYwLRWC2Ij4'; // <-- ¡¡¡ REEMPLAZA ESTA CLAVE !!!

// --- Lógica Principal ---

// 1. Registrar Service Worker al inicio (no depende de la interacción)
registerServiceWorker();

// 2. Esperar la interacción del usuario en el prompt
interactionPrompt.addEventListener('click', handleInteraction, { once: true }); // Ejecutar solo una vez

function handleInteraction() {
    console.log('Interacción detectada. Iniciando proceso...');

    // Ocultar el prompt y mostrar el contenido principal
    interactionPrompt.classList.add('hidden');
    mainContent.classList.remove('hidden');
    statusDiv.textContent = 'Interacción recibida. Preparando simulación...';

    // 3. Iniciar la cuenta atrás para la simulación DESPUÉS de la interacción
    const delayMilliseconds = 4000; // 4 segundos
    statusDiv.textContent = `La simulación comenzará en ${delayMilliseconds / 1000} segundos...`;

    setTimeout(() => {
        statusDiv.textContent = 'Iniciando simulación ahora...';
        handleSimulateLogin();
    }, delayMilliseconds);
}

// --- Funciones ---

async function handleSimulateLogin() {
    googleNumberContainer.style.display = 'none'; // Ocultar previo
    googleNumberDisplay.textContent = '';

    // 1. Generar número simulado
    const randomNumber = Math.floor(Math.random() * 90) + 10; // Número de 2 dígitos

    // 2. Mostrar el número visualmente
    googleNumberDisplay.textContent = randomNumber;
    googleNumberContainer.style.display = 'block';
    statusDiv.textContent = 'Número generado.';

    // 3. Intentar mostrar notificación push (simulada)
    await showPushNotification(randomNumber);

    statusDiv.textContent += ' Simulación completada.';
}

async function registerServiceWorker() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            const registration = await navigator.serviceWorker.register('service-worker.js', { scope: './' });
            console.log('Service Worker registrado con éxito, scope:', registration.scope);
        } catch (error) {
            console.error('Error registrando Service Worker:', error);
        }
    } else {
        console.warn('Service Worker o PushManager no soportado.');
    }
}

async function showPushNotification(number) {
    // 1. Verificar que tenemos permiso
    if (Notification.permission === 'default') {
        await Notification.requestPermission();
    }
    if (Notification.permission !== 'granted') {
        console.warn('Permiso de notificaciones no concedido.');
        statusDiv.textContent += ' (Push no permitido)';
        return;
    }

    // 2. Definir todas las opciones según tu estructura
    const notificationOptions = {
        body: `Toca "Sí" en la notificación y luego marca ${number}`,
        icon: './assets/logo.png',
        tag: 'mi-app-codigo-verificacion',
        requireInteraction: true,
        silent: false,
        vibrate: [200, 100, 200],
        data: {
            numero: number,
            urlDestino: '/confirmar-accion?codigo=' + number,
            tipoNotificacion: 'verificacion-2fa'
        },
        timestamp: Date.now(),
        renotify: false
    };

    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('Código de verificación', notificationOptions);
        console.log('Notificación mostrada con opciones completas:', notificationOptions);
        statusDiv.textContent += ' Notificación mostrada.';
    } catch (error) {
        console.error('Error mostrando notificación:', error);
        statusDiv.textContent += ' Error al mostrar notificación.';
    }
}

// Utilidad para convertir la clave VAPID
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

