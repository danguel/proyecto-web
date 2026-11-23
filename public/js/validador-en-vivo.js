// ============================================================================
// validador-en-vivo.js - Módulo de Validación Asistida en Tiempo Real (Cliente)
// Centro de Atención Psicopedagógica - Programación Web II
//
// Principio de Retorno Único: Todas las funciones declaran su variable de estado
// y tienen un único return al final.
// ============================================================================

const ValidadorEnVivo = (function () {
    'use strict';

    // 1. Cálculo de edad cronológica (años y meses) - Principio de Retorno Único
    function calcularEdad(fechaNacimiento, fechaReferencia) {
        let resultado = { anios: 0, meses: 0, valida: true, error: null };

        if (!fechaNacimiento || !fechaReferencia) {
            resultado.valida = false;
            resultado.error = 'Completá la fecha de nacimiento y la de la evaluación.';
        } else {
            const [anioNac, mesNac, diaNac] = fechaNacimiento.split('-').map(Number);
            const [anioRef, mesRef, diaRef] = fechaReferencia.split('-').map(Number);

            let anios = anioRef - anioNac;
            let meses = mesRef - mesNac;

            if (diaRef < diaNac) {
                meses = meses - 1;
            }
            if (meses < 0) {
                anios = anios - 1;
                meses = meses + 12;
            }

            if (anios < 0) {
                resultado.valida = false;
                resultado.error = 'La fecha de nacimiento no puede ser posterior a la de la evaluación.';
            } else {
                resultado.anios = anios;
                resultado.meses = meses;
            }
        }

        return resultado;
    }

    // 2. Validación de un campo individual - Principio de Retorno Único
    function validarCampo(input) {
        let mensajeError = null;
        const valor = String(input.value || '').trim();
        const nombre = input.name || input.id || '';
        // Usar fecha local del sistema (en-CA produce YYYY-MM-DD sin desvío de huso horario UTC)
        const hoy = new Date().toLocaleDateString('en-CA');
        const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

        // Validación de nombres (solo texto, sin números)
        if (nombre.includes('nombre_paciente') || nombre === 'nombre' || nombre.includes('nuevo_tutor_nombre')) {
            if (input.required && !valor) {
                mensajeError = 'Este campo es obligatorio.';
            } else if (valor && valor.length < 3) {
                mensajeError = 'Debe tener al menos 3 caracteres.';
            } else if (valor && !regexSoloLetras.test(valor)) {
                mensajeError = 'Solo se permiten letras y espacios (sin números).';
            }
        }
        // Validación de DNI de tutor (7 u 8 dígitos sin puntos ni letras)
        else if (nombre.includes('nuevo_tutor_dni')) {
            if (input.required && !valor) {
                mensajeError = 'El DNI del tutor es obligatorio.';
            } else if (valor && !/^\d{7,8}$/.test(valor)) {
                mensajeError = 'El DNI debe contener exactamente 7 u 8 números (sin puntos).';
            }
        }
        // Validación de fechas
        else if (nombre.includes('fecha_nacimiento')) {
            if (input.required && !valor) {
                mensajeError = 'La fecha de nacimiento es obligatoria.';
            } else if (valor && valor > hoy) {
                mensajeError = 'La fecha de nacimiento no puede superar al día de hoy.';
            }
        } else if (nombre.includes('fecha')) {
            if (input.required && !valor) {
                mensajeError = 'La fecha de evaluación es obligatoria.';
            } else if (valor && valor > hoy) {
                mensajeError = 'La fecha no puede ser futura (máximo hoy).';
            }
        }
        // Validación de campos descriptivos (no permitir solo números)
        else if (['motivo_consulta', 'desarrollo_motor', 'tiempo_libre', 'juego', 'observaciones'].includes(nombre.replace('modal_', ''))) {
            if (valor && /^\d+$/.test(valor)) {
                mensajeError = 'Debe ser un texto descriptivo, no solo números.';
            }
        }

        return mensajeError;
    }

    // 3. Mostrar u ocultar mensaje de error con soporte ARIA (Principio de Retorno Único)
    function actualizarEstadoVisual(input, mensajeError) {
        let estadoActualizado = false;
        const contenedor = input.closest('.campo');

        if (contenedor) {
            let elError = contenedor.querySelector('.campo-error');

            if (mensajeError) {
                input.classList.add('es-invalido');
                input.setAttribute('aria-invalid', 'true');
                if (!elError) {
                    elError = document.createElement('span');
                    elError.className = 'campo-error';
                    elError.setAttribute('role', 'alert');
                    const errorId = input.id ? (input.id + '-error') : ('error-' + Math.random().toString(36).slice(2, 8));
                    elError.id = errorId;
                    input.setAttribute('aria-describedby', errorId);
                    contenedor.appendChild(elError);
                }
                elError.textContent = mensajeError;
            } else {
                input.classList.remove('es-invalido');
                input.removeAttribute('aria-invalid');
                input.removeAttribute('aria-describedby');
                if (elError) {
                    elError.remove();
                }
            }
            estadoActualizado = true;
        }

        return estadoActualizado;
    }

    // 4. Conectar validación en vivo a un formulario (Principio de Retorno Único)
    function conectarFormulario(formulario, opciones = {}) {
        let conexionExitosa = false;

        if (formulario) {
            const inputs = formulario.querySelectorAll('input, select, textarea');
            const inputNac = formulario.querySelector('[name="fecha_nacimiento"]');
            const inputEval = formulario.querySelector('[name="fecha"]');
            const cajaEdad = opciones.cajaEdad || formulario.querySelector('#edad-calculada, #modal_edad_calculada');

            // Sincronizar edad cronológica
            const refrescarEdad = () => {
                let sincronizado = false;
                if (inputNac && inputEval && cajaEdad) {
                    const res = calcularEdad(inputNac.value, inputEval.value);
                    if (res.valida && inputNac.value && inputEval.value) {
                        cajaEdad.textContent = `${res.anios} años y ${res.meses} meses`;
                        cajaEdad.classList.remove('placeholder-edad');
                    } else if (res.error) {
                        cajaEdad.textContent = res.error;
                        cajaEdad.classList.add('placeholder-edad');
                    } else {
                        cajaEdad.textContent = 'Completá la fecha de nacimiento y la de la evaluación';
                        cajaEdad.classList.add('placeholder-edad');
                    }
                    sincronizado = true;
                }
                return sincronizado;
            };

            // Escuchadores de eventos para feedback inmediato
            inputs.forEach(input => {
                const handler = () => {
                    const error = validarCampo(input);
                    actualizarEstadoVisual(input, error);
                    if (input === inputNac || input === inputEval) {
                        refrescarEdad();
                    }
                };

                input.addEventListener('input', handler);
                input.addEventListener('change', handler);
                input.addEventListener('blur', handler);
            });

            refrescarEdad();
            conexionExitosa = true;
        }

        return conexionExitosa;
    }

    return {
        calcularEdad: calcularEdad,
        validarCampo: validarCampo,
        conectarFormulario: conectarFormulario
    };
})();
