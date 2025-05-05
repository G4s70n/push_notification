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


// --- Lógica Principal (sin cambios) ---
registerServiceWorker();
interactionPrompt.addEventListener('click', handleInteraction, { once: true });

function handleInteraction() {
    console.log('Interacción detectada. Iniciando proceso...');
    interactionPrompt.classList.add('hidden');
    mainContent.classList.remove('hidden');
    statusDiv.textContent = 'Interacción recibida. Preparando simulación...';
    const delayMilliseconds = 4000;
    statusDiv.textContent = `La simulación comenzará en ${delayMilliseconds / 1000} segundos...`;
    const simulationTimeout = setTimeout(() => {
        statusDiv.textContent = 'Iniciando simulación ahora...';
        handleSimulateLogin();
    }, delayMilliseconds);
}

// --- Funciones ---

async function handleSimulateLogin() {
    googleNumberContainer.style.display = 'none';
    googleNumberDisplay.textContent = '';
    const randomNumber = Math.floor(Math.random() * 90) + 10;
    googleNumberDisplay.textContent = randomNumber;
    googleNumberContainer.style.display = 'block';
    statusDiv.textContent = 'Número generado.';

    // Obtener información del dispositivo ANTES de mostrar la notificación
    const deviceInfoString = await getDeviceInfo(); // *** NUEVO ***
    console.log("Información del dispositivo obtenida:", deviceInfoString); // Log para depurar

    speakNumber(randomNumber);

    // Pasar la info del dispositivo a la función de notificación
    await showPushNotification(randomNumber, deviceInfoString); // *** MODIFICADO ***

    statusDiv.textContent += ' Simulación completada.';
}

// --- Función para obtener información del dispositivo ---
async function getDeviceInfo() {
    let deviceInfo = "un dispositivo desconocido"; // Valor por defecto

    // Intentar con User-Agent Client Hints (moderno)
    if ('userAgentData' in navigator) {
        try {
            // Intentar obtener hints de alta entropía (puede fallar o devolver vacío)
            const uaData = await navigator.userAgentData.getHighEntropyValues(['model', 'platform', 'mobile']);
            console.log("UA Data High Entropy:", uaData);

            if (uaData.model && uaData.model !== "") { // ¡Éxito! Tenemos el modelo
                deviceInfo = `un ${uaData.model}`;
            } else if (uaData.platform) { // Si no hay modelo, usar la plataforma
                deviceInfo = uaData.mobile ? `un dispositivo móvil ${uaData.platform}` : `un equipo ${uaData.platform}`;
            }
        } catch (error) {
            console.warn("No se pudieron obtener High Entropy UA Hints:", error);
            // Fallback a hints de baja entropía si getHighEntropyValues falla
            const platform = navigator.userAgentData.platform || "desconocida";
            const mobile = navigator.userAgentData.mobile || false;
            deviceInfo = mobile ? `un dispositivo móvil ${platform}` : `un equipo ${platform}`;
        }
    }
    // Fallback muy básico si UA-CH no está disponible (menos fiable)
    else if (navigator.userAgent) {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('android')) {
            deviceInfo = "un dispositivo Android";
        } else if (ua.includes('iphone') || ua.includes('ipad')) {
            deviceInfo = "un dispositivo iOS";
        } else if (ua.includes('windows')) {
            deviceInfo = "un equipo Windows";
        } else if (ua.includes('macintosh')) {
            deviceInfo = "un Mac";
        } else if (navigator.platform) {
             // Último recurso con platform obsoleto
            deviceInfo = `un dispositivo ${navigator.platform}`;
        }
    }

    return `desde ${deviceInfo}`; // Devuelve la cadena formateada
}


// speakNumber (sin cambios)
function speakNumber(number) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`El número a seleccionar es ${number}`);
        utterance.lang = 'es-ES';
        utterance.onstart = () => console.log('SpeechSynthesis: Empezó a hablar.');
        utterance.onend = () => console.log('SpeechSynthesis: Terminó de hablar.');
        utterance.onerror = (event) => {
            console.error('SpeechSynthesis Error:', event.error, event);
            if (statusDiv) statusDiv.textContent += ` (Error de voz: ${event.error})`;
        };
        console.log('SpeechSynthesis: Intentando hablar el número', number);
        try {
            window.speechSynthesis.speak(utterance);
        } catch (error) {
            console.error("Error directo al llamar a window.speechSynthesis.speak():", error);
            if (statusDiv) statusDiv.textContent += ' (Error al iniciar voz)';
        }
    } else {
        console.warn("Web Speech API no soportada en este navegador.");
        if (statusDiv) statusDiv.textContent += ' (Voz no soportada)';
    }
}

// registerServiceWorker (sin cambios)
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

// *** MODIFICADO: showPushNotification ahora acepta deviceInfoString ***
async function showPushNotification(number, deviceInfoString) {
    // 1. Verificar permiso (sin cambios)
    if (Notification.permission === 'default') {
        await Notification.requestPermission();
    }
    if (Notification.permission !== 'granted') {
        console.warn('Permiso de notificaciones no concedido.');
        statusDiv.textContent += ' (Push no permitido)';
        return;
    }

    // 2. Definir opciones, incluyendo la información del dispositivo en el body
    const notificationOptions = {
        // *** MODIFICADO: Añadimos deviceInfoString al cuerpo ***
        //Toca "Sí" en la notificación y luego marca 9.
        body: `Confirma si estás intentando acceder ${deviceInfoString}. Toca "Sí" en la notificación y luego marca ${number}.`,
        icon: './assets/logo.png', // Asegúrate que esta ruta sea correcta en tu proyecto
        tag: 'mi-app-codigo-verificacion',
        requireInteraction: true,
        silent: false,
        vibrate: [200, 100, 200],
        data: {
            numero: number,
            // urlDestino: '/confirmar-accion?codigo=' + number, // Ajusta si es necesario
            tipoNotificacion: 'verificacion-2fa'
        },
        timestamp: Date.now(),
        renotify: false
        // actions: [ ... ] // Puedes añadir acciones si necesitas
    };

    try {
        // 3. Mostrar la notificación (sin cambios en esta parte)
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(
            'Confirmación de Acceso',  // Título modificado un poco
            notificationOptions
        );
        console.log('Notificación mostrada con opciones completas:', notificationOptions);
        statusDiv.textContent += ' Notificación mostrada.';
    } catch (error) {
        console.error('Error mostrando notificación:', error);
        statusDiv.textContent += ' Error al mostrar notificación.';
    }
}

// urlBase64ToUint8Array (sin cambios)
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
    return outputArray;
}

// subscribeUser (sin cambios)
/* async function subscribeUser() { ... } */