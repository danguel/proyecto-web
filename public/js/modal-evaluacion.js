// ============================================================================
// modal-evaluacion.js - Wizard de Evaluación Asistida en Pasos (Modal)
// Centro de Atención Psicopedagógica - Programación Web II
//
// Principio de Retorno Único: Todas las funciones declaran su variable de estado
// y tienen un único return al final.
// ============================================================================

(function () {
    'use strict';

    const dialog = document.getElementById('modal-evaluacion');
    const btnAbrir = document.getElementById('btn-abrir-modal-evaluacion');
    const btnCerrar = document.getElementById('btn-cerrar-modal');
    const btnCancelar = document.getElementById('btn-cancelar-modal');
    const btnSiguiente = document.getElementById('btn-paso-siguiente');
    const btnAnterior = document.getElementById('btn-paso-anterior');
    const btnGuardar = document.getElementById('btn-guardar-modal');
    const contadorPaso = document.getElementById('modal-paso-contador');
    const formModal = document.getElementById('form-modal-evaluacion');

    if (!dialog || !btnAbrir) {
        return;
    }

    let pasoActual = 1;
    const totalPasos = 3;
    const CLAVE_DRAFT = 'cap_draft_evaluacion_modal';

    // Elementos dinámicos del Paso 1 en el Modal
    const radiosPacienteModo = formModal ? formModal.querySelectorAll('input[name="paciente_modo"]') : [];
    const bloquePacienteExistente = document.getElementById('modal-bloque-paciente-existente');
    const bloquePacienteNuevo = document.getElementById('modal-bloque-paciente-nuevo');
    const selectPacienteId = document.getElementById('modal_paciente_id');
    const fichaPacienteExistente = document.getElementById('modal-ficha-paciente-existente');

    const inputNombreNuevo = document.getElementById('modal_nombre_paciente');
    const inputFechaNacNuevo = document.getElementById('modal_fecha_nacimiento');
    const selectTutorModo = document.getElementById('modal_tutor_modo');
    const bloqueTutorExistente = document.getElementById('modal-bloque-tutor-existente');
    const bloqueTutorCrear = document.getElementById('modal-bloque-tutor-crear');
    const inputTutorNombre = document.getElementById('modal_nuevo_tutor_nombre');
    const inputTutorDni = document.getElementById('modal_nuevo_tutor_dni');

    const inputFechaEval = document.getElementById('modal_fecha');
    const cajaEdad = document.getElementById('modal_edad_calculada');

    // Conectar validador en vivo al formulario del modal
    if (formModal && typeof ValidadorEnVivo !== 'undefined') {
        ValidadorEnVivo.conectarFormulario(formModal, { cajaEdad: cajaEdad });
    }

    // Refrescar cálculo de edad en el modal (Principio de Retorno Único)
    function refrescarEdadModal() {
        let ejecutado = false;

        if (cajaEdad && inputFechaEval) {
            let fechaNac = '';
            const modo = Array.from(radiosPacienteModo).find(r => r.checked)?.value || 'nuevo';

            if (modo === 'existente' && selectPacienteId) {
                const opt = selectPacienteId.options[selectPacienteId.selectedIndex];
                if (opt && opt.value) {
                    fechaNac = opt.getAttribute('data-nacimiento') || '';
                    const tutor = opt.getAttribute('data-tutor') || 'Sin tutor asignado';
                    if (fichaPacienteExistente) {
                        fichaPacienteExistente.textContent = `Nacimiento: ${fechaNac} — Tutor registrado: ${tutor}`;
                        fichaPacienteExistente.style.display = 'block';
                    }
                } else if (fichaPacienteExistente) {
                    fichaPacienteExistente.style.display = 'none';
                }
            } else if (inputFechaNacNuevo) {
                fechaNac = inputFechaNacNuevo.value;
                if (fichaPacienteExistente) {
                    fichaPacienteExistente.style.display = 'none';
                }
            }

            if (fechaNac && inputFechaEval.value && typeof ValidadorEnVivo !== 'undefined') {
                const res = ValidadorEnVivo.calcularEdad(fechaNac, inputFechaEval.value);
                if (res.valida) {
                    cajaEdad.textContent = `${res.anios} años y ${res.meses} meses`;
                    cajaEdad.classList.remove('placeholder-edad');
                } else {
                    cajaEdad.textContent = res.error || 'Fecha no válida';
                    cajaEdad.classList.add('placeholder-edad');
                }
            } else {
                cajaEdad.textContent = 'Completá la fecha de nacimiento y la de evaluación';
                cajaEdad.classList.add('placeholder-edad');
            }
            ejecutado = true;
        }

        return ejecutado;
    }

    // Alternar entre Paciente Existente y Nuevo Paciente (Principio de Retorno Único)
    function actualizarModoPaciente() {
        let actualizado = false;
        const modo = Array.from(radiosPacienteModo).find(r => r.checked)?.value || 'nuevo';
        const esExistente = modo === 'existente';

        if (bloquePacienteExistente) bloquePacienteExistente.style.display = esExistente ? 'block' : 'none';
        if (bloquePacienteNuevo) bloquePacienteNuevo.style.display = esExistente ? 'none' : 'block';

        if (selectPacienteId) selectPacienteId.required = esExistente;
        if (inputNombreNuevo) inputNombreNuevo.required = !esExistente;
        if (inputFechaNacNuevo) inputFechaNacNuevo.required = !esExistente;

        refrescarEdadModal();
        actualizado = true;
        return actualizado;
    }

    // Alternar modo de tutor (Principio de Retorno Único)
    function actualizarModoTutor() {
        let actualizado = false;
        const modo = selectTutorModo ? selectTutorModo.value : 'sin_tutor';
        if (bloqueTutorExistente) bloqueTutorExistente.style.display = modo === 'existente' ? 'block' : 'none';
        if (bloqueTutorCrear) bloqueTutorCrear.style.display = modo === 'crear' ? 'block' : 'none';

        if (inputTutorNombre) inputTutorNombre.required = modo === 'crear';
        if (inputTutorDni) inputTutorDni.required = modo === 'crear';

        actualizado = true;
        return actualizado;
    }

    // ------------------------------------------------------------------------
    // GESTIÓN DE BORRADOR Y PREVENCIÓN DE PÉRDIDA DE DATOS (P0 FIX)
    // ------------------------------------------------------------------------
    function formularioTieneDatos() {
        let tieneDatos = false;
        if (formModal) {
            const inputs = formModal.querySelectorAll('input:not([type="hidden"]):not([type="radio"]):not([type="submit"]):not([type="button"]), textarea');
            for (const input of inputs) {
                if (input.value && input.value.trim() !== '') {
                    tieneDatos = true;
                    break;
                }
            }
        }
        return tieneDatos;
    }

    function guardarBorrador() {
        let guardado = false;
        if (formModal) {
            try {
                const data = {};
                const inputs = formModal.querySelectorAll('input, select, textarea');
                inputs.forEach(el => {
                    if (el.name) {
                        if (el.type === 'radio') {
                            if (el.checked) data[el.name] = el.value;
                        } else {
                            data[el.name] = el.value;
                        }
                    }
                });
                data.__paso = pasoActual;
                sessionStorage.setItem(CLAVE_DRAFT, JSON.stringify(data));
                guardado = true;
            } catch (e) {}
        }
        return guardado;
    }

    function restaurarBorrador() {
        let restaurado = false;
        try {
            const raw = sessionStorage.getItem(CLAVE_DRAFT);
            if (raw) {
                const data = JSON.parse(raw);
                if (data && typeof data === 'object') {
                    Object.keys(data).forEach(name => {
                        if (name === '__paso') return;
                        const el = formModal.querySelector(`[name="${name}"]`);
                        if (el) {
                            if (el.type === 'radio') {
                                const radio = formModal.querySelector(`input[name="${name}"][value="${data[name]}"]`);
                                if (radio) radio.checked = true;
                            } else {
                                el.value = data[name];
                            }
                        }
                    });
                    if (data.__paso && data.__paso >= 1 && data.__paso <= totalPasos) {
                        pasoActual = data.__paso;
                    }
                    actualizarModoPaciente();
                    actualizarModoTutor();
                    refrescarEdadModal();
                    actualizarVistaPasos();
                    restaurado = true;
                }
            }
        } catch (e) {}
        return restaurado;
    }

    function limpiarBorrador() {
        let limpiado = false;
        try {
            sessionStorage.removeItem(CLAVE_DRAFT);
            limpiado = true;
        } catch (e) {}
        return limpiado;
    }

    async function solicitarConfirmacionSalida() {
        let puedeSalir = true;

        if (formularioTieneDatos()) {
            if (typeof window.confirmarAccion === 'function') {
                puedeSalir = await window.confirmarAccion({
                    titulo: 'Datos clínicos sin guardar',
                    mensaje: 'Tenés datos cargados en esta evaluación. ¿Estás seguro de que querés salir? Los cambios no guardados se perderán.',
                    textoAceptar: 'Salir sin guardar',
                    textoCancelar: 'Continuar editando',
                    tipoBoton: 'peligro'
                });
            } else {
                puedeSalir = window.confirm('Tenés datos clínicos cargados en esta evaluación. ¿Estás seguro de que querés salir sin guardar? Los cambios no guardados se perderán.');
            }
        }

        if (puedeSalir) {
            limpiarBorrador();
            dialog.close();
        }

        return puedeSalir;
    }

    radiosPacienteModo.forEach(radio => radio.addEventListener('change', actualizarModoPaciente));
    if (selectPacienteId) selectPacienteId.addEventListener('change', refrescarEdadModal);
    if (inputFechaNacNuevo) inputFechaNacNuevo.addEventListener('input', refrescarEdadModal);
    if (inputFechaEval) inputFechaEval.addEventListener('input', refrescarEdadModal);
    if (selectTutorModo) selectTutorModo.addEventListener('change', actualizarModoTutor);

    actualizarModoPaciente();
    actualizarModoTutor();

    // Autosave en cada modificación
    if (formModal) {
        formModal.addEventListener('input', guardarBorrador);
        formModal.addEventListener('change', guardarBorrador);
        formModal.addEventListener('submit', () => {
            limpiarBorrador();
        });
    }

    // Abrir ventana flotante y restaurar borrador si existiera
    btnAbrir.addEventListener('click', () => {
        pasoActual = 1;
        actualizarVistaPasos();
        dialog.showModal();
        restaurarBorrador();
    });

    if (btnCerrar) btnCerrar.addEventListener('click', (e) => { e.preventDefault(); solicitarConfirmacionSalida(); });
    if (btnCancelar) btnCancelar.addEventListener('click', (e) => { e.preventDefault(); solicitarConfirmacionSalida(); });

    // Clic fuera del cuadro de diálogo (backdrop click) protegido contra pérdida de datos
    dialog.addEventListener('click', (event) => {
        const rect = dialog.getBoundingClientRect();
        const isInDialog = (
            rect.top <= event.clientY &&
            event.clientY <= rect.top + rect.height &&
            rect.left <= event.clientX &&
            event.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
            solicitarConfirmacionSalida();
        }
    });

    // Interceptar la tecla Escape nativa de <dialog>
    dialog.addEventListener('cancel', async (event) => {
        if (formularioTieneDatos()) {
            event.preventDefault();
            let confirma = false;
            if (typeof window.confirmarAccion === 'function') {
                confirma = await window.confirmarAccion({
                    titulo: 'Datos clínicos sin guardar',
                    mensaje: 'Tenés datos cargados en esta evaluación. ¿Estás seguro de que querés salir? Los cambios no guardados se perderán.',
                    textoAceptar: 'Salir sin guardar',
                    textoCancelar: 'Continuar editando',
                    tipoBoton: 'peligro'
                });
            } else {
                confirma = window.confirm('Tenés datos clínicos cargados en esta evaluación. ¿Estás seguro de que querés salir sin guardar? Los cambios no guardados se perderán.');
            }
            if (confirma) {
                limpiarBorrador();
                dialog.close();
            }
        }
    });

    // Validar campos del paso actual antes de avanzar (Principio de Retorno Único)
    function validarPasoActual() {
        let esValido = true;
        const seccionActiva = dialog.querySelector(`#modal-paso-${pasoActual}`);
        if (seccionActiva) {
            const inputs = seccionActiva.querySelectorAll('input, select, textarea');
            for (const input of inputs) {
                // Si el input está dentro de un contenedor oculto, no validar
                if (input.closest('[style*="display: none"]')) {
                    continue;
                }
                // 1. Verificación nativa HTML5
                if (!input.checkValidity()) {
                    input.reportValidity();
                    esValido = false;
                    break;
                }
                // 2. Verificación del módulo de validación en vivo
                if (typeof ValidadorEnVivo !== 'undefined') {
                    const error = ValidadorEnVivo.validarCampo(input);
                    if (error) {
                        input.focus();
                        esValido = false;
                        break;
                    }
                }
            }
        }
        return esValido;
    }

    // Navegación: Siguiente
    if (btnSiguiente) {
        btnSiguiente.addEventListener('click', () => {
            if (validarPasoActual()) {
                if (pasoActual < totalPasos) {
                    pasoActual++;
                    actualizarVistaPasos();
                    guardarBorrador();
                }
            }
        });
    }

    // Navegación: Anterior
    if (btnAnterior) {
        btnAnterior.addEventListener('click', () => {
            if (pasoActual > 1) {
                pasoActual--;
                actualizarVistaPasos();
                guardarBorrador();
            }
        });
    }

    // Atajos de teclado para flujo clínico ágil (Ctrl+Enter para avanzar / guardar)
    dialog.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            if (pasoActual < totalPasos) {
                if (validarPasoActual()) {
                    pasoActual++;
                    actualizarVistaPasos();
                    guardarBorrador();
                }
            } else if (pasoActual === totalPasos) {
                if (validarPasoActual() && formModal) {
                    limpiarBorrador();
                    if (formModal.requestSubmit) {
                        formModal.requestSubmit();
                    } else {
                        formModal.submit();
                    }
                }
            }
        }
    });

    // Actualizar elementos visibles según el paso actual (Principio de Retorno Único)
    function actualizarVistaPasos() {
        let actualizado = false;

        if (contadorPaso) {
            contadorPaso.textContent = `Paso 0${pasoActual} de 0${totalPasos}`;
        }

        // Mostrar sección del paso activo y ocultar las demás
        for (let i = 1; i <= totalPasos; i++) {
            const sec = dialog.querySelector(`#modal-paso-${i}`);
            const itemPaso = dialog.querySelector(`.paso-item[data-paso="${i}"]`);

            if (sec) {
                sec.classList.toggle('activa', i === pasoActual);
            }
            if (itemPaso) {
                itemPaso.classList.toggle('activo', i === pasoActual);
                itemPaso.classList.toggle('completado', i < pasoActual);
            }
        }

        // Control de visibilidad de botones
        if (btnAnterior) {
            btnAnterior.style.display = pasoActual > 1 ? 'inline-flex' : 'none';
        }
        if (btnSiguiente) {
            btnSiguiente.style.display = pasoActual < totalPasos ? 'inline-flex' : 'none';
        }
        if (btnGuardar) {
            btnGuardar.style.display = pasoActual === totalPasos ? 'inline-flex' : 'none';
        }

        actualizado = true;
        return actualizado;
    }
})();
