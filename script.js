// Referencias a elementos del DOM
const googleNumberDisplay = document.getElementById('googleNumber');
const googleNumberContainer = document.getElementById('googleNumberContainer');
const statusDiv = document.getElementById('status');
const interactionPrompt = document.getElementById('interactionPrompt');
const mainContent = document.getElementById('mainContent');

// --- Configuración Push (¡REEMPLAZA CON TU CLAVE PÚBLICA VAPID REAL!) ---
// Genera tus claves aquí: https://www.npmjs.com/package/web-push#command-line
// O usa: npx web-push generate-vapid-keys
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

    // Opcional: Intentar activar el contexto de audio inmediatamente
    // playSilentSound(); // Descomentar si quieres probar esto

    // 3. Iniciar la cuenta atrás para la simulación DESPUÉS de la interacción
    const delayMilliseconds = 4000; // 8 segundos
    statusDiv.textContent = `La simulación comenzará en ${delayMilliseconds / 1000} segundos...`;

    const simulationTimeout = setTimeout(() => {
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

    // 3. Leer el número en voz alta (debería funcionar ahora por la interacción previa)
    speakNumber(randomNumber);

    // 4. Intentar mostrar notificación push (simulada)
    await showPushNotification(randomNumber);

    statusDiv.textContent += ' Simulación completada.';
}

function speakNumber(number) {
    if ('speechSynthesis' in window) {
        // Cancelar cualquier habla anterior pendiente (importante si hay recargas rápidas o múltiples llamadas)
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(`El número a seleccionar es ${number}`);
        utterance.lang = 'es-ES'; // Establecer idioma español

        // Listeners para depuración (muy útiles)
        utterance.onstart = () => {
            console.log('SpeechSynthesis: Empezó a hablar.');
        };
        utterance.onend = () => {
            console.log('SpeechSynthesis: Terminó de hablar.');
        };
        utterance.onerror = (event) => {
            console.error('SpeechSynthesis Error:', event.error, event);
            if (statusDiv) statusDiv.textContent += ` (Error de voz: ${event.error})`;
        };

        console.log('SpeechSynthesis: Intentando hablar el número', number);
        try {
            // Intenta hablar
            window.speechSynthesis.speak(utterance);
        } catch (error) {
            // Captura errores síncronos al intentar iniciar el habla
            console.error("Error directo al llamar a window.speechSynthesis.speak():", error);
            if (statusDiv) statusDiv.textContent += ' (Error al iniciar voz)';
        }

    } else {
        console.warn("Web Speech API no soportada en este navegador.");
        if (statusDiv) statusDiv.textContent += ' (Voz no soportada)';
    }
}

// Opcional: Función para intentar "despertar" el contexto de audio
/*
function playSilentSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') { // Solo si está suspendido
        audioContext.resume();
    }
    const buffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
    console.log('Intento de reproducir audio silencioso para desbloquear contexto.');
  } catch (e) {
    console.warn('No se pudo crear/reproducir audio silencioso:', e);
  }
}
*/

async function registerServiceWorker() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            const registration = await navigator.serviceWorker.register('service-worker.js', { scope: './' }); // Especificar scope puede ayudar
            console.log('Service Worker registrado con éxito, scope:', registration.scope);
            // No actualizamos statusDiv aquí, ya que puede estar oculto
        } catch (error) {
            console.error('Error registrando Service Worker:', error);
            // Podrías mostrar un error en la consola o en un área de errores separada
        }
    } else {
        console.warn('Service Worker o PushManager no soportado.');
        // Podrías informar al usuario si las notificaciones no funcionarán
    }
}

async function showPushNotification(number) {
    // Verificar soporte de nuevo por si acaso
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push no soportado.');
        if (statusDiv) statusDiv.textContent += ' (Push no soportado)';
        return;
    }

    try {
        // 1. Verificar Permiso
        let permission = Notification.permission;
        if (permission === 'default') {
            if (statusDiv) statusDiv.textContent += ' Solicitando permiso para notificaciones...';
            // Esperar a que el usuario responda al diálogo
            permission = await Notification.requestPermission();
        }

        // 2. Actuar según el permiso
        if (permission === 'granted') {
            if (statusDiv) statusDiv.textContent += ' Permiso concedido.';

            // Obtener registro del Service Worker (espera a que esté activo)
            const registration = await navigator.serviceWorker.ready;

            // 3. Mostrar la notificación (simulada desde el cliente en esta demo)
            // En una app real, esta lógica estaría en el evento 'push' del SW,
            // activado por un mensaje de tu servidor.
            await registration.showNotification('Confirmación Google (Demo)', {
                body: `El número automático es: ${number}`,
                icon: 'icon.png', // Opcional: Asegúrate de tener este archivo
                badge: 'icon.png', // Opcional: Icono para barra de notificaciones Android
                tag: 'google-2fa-auto-interactive', // Tag único para esta notificación
                requireInteraction: true,
                // Puedes añadir más opciones: vibrate, actions, etc.
                // vibrate: [200, 100, 200]
            });
            console.log('Notificación automática simulada mostrada.');
            if (statusDiv) statusDiv.textContent += ' Notificación mostrada.';

        } else {
            console.warn('Permiso de notificación denegado.');
            if (statusDiv) statusDiv.textContent += ' Permiso de notificación denegado.';
        }
    } catch (error) {
        console.error('Error mostrando notificación push automática:', error);
        if (statusDiv) statusDiv.textContent += ' Error con notificaciones push.';
    }
}

// Función de utilidad para convertir la clave VAPID (necesaria para suscripción real)
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// La función subscribeUser para obtener la suscripción y enviarla al backend
// no se llama activamente en esta demo, pero es esencial para notificaciones reales.
/*
async function subscribeUser() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
            console.log('Usuario ya suscrito:', existingSubscription);
            return existingSubscription;
        }
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        console.log('Nueva suscripción obtenida:', subscription);
        // *** ENVIAR 'subscription' A TU BACKEND AQUÍ ***
        // await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify(subscription), headers: {'Content-Type': 'application/json'} });
        return subscription;
    } catch (error) {
        console.error('Error al suscribir usuario:', error);
        return null;
    }
}
*/