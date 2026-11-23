// ============================================================================
// evaluaciones-nueva.js - Asistente por pasos (Wizard) para Nueva Evaluación
// Centro de Atención Psicopedagógica - Programación Web II
//
// Principio de Retorno Único: Todas las funciones declaran su variable de estado
// y tienen un único return al final.
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const formulario = document.getElementById('form-evaluaciones-pasos');
    const btnSiguiente = document.getElementById('btn-paso-siguiente');
    const btnAnterior = document.getElementById('btn-paso-anterior');
    const btnGuardar = document.getElementById('btn-guardar-evaluacion');

    if (!formulario) {
        return;
    }

    let pasoActual = 1;
    const totalPasos = 3;

    // Elementos dinámicos del Paso 1
    const radiosPacienteModo = formulario.querySelectorAll('input[name="paciente_modo"]');
    const bloquePacienteExistente = document.getElementById('bloque-paciente-existente');
    const bloquePacienteNuevo = document.getElementById('bloque-paciente-nuevo');
    const selectPacienteId = document.getElementById('paciente_id');
    const fichaPacienteExistente = document.getElementById('ficha-paciente-existente');

    const inputNombreNuevo = document.getElementById('nombre_paciente');
    const inputFechaNacNuevo = document.getElementById('fecha_nacimiento');
    const selectTutorModo = document.getElementById('tutor_modo');
    const bloqueTutorExistente = document.getElementById('bloque-tutor-existente');
    const bloqueTutorCrear = document.getElementById('bloque-tutor-crear');
    const inputTutorNombre = document.getElementById('nuevo_tutor_nombre');
    const inputTutorDni = document.getElementById('nuevo_tutor_dni');

    const inputFechaEval = document.getElementById('fecha');
    const cajaEdad = document.getElementById('edad-calculada');

    // Conectar validador en vivo al formulario
    if (typeof ValidadorEnVivo !== 'undefined') {
        ValidadorEnVivo.conectarFormulario(formulario, { cajaEdad: cajaEdad });
    }

    // Refrescar cálculo de edad y resumen del paciente (Principio de Retorno Único)
    function refrescarEdad() {
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
                cajaEdad.textContent = 'Completá la fecha de nacimiento y la de la evaluación';
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

        refrescarEdad();
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

    radiosPacienteModo.forEach(radio => radio.addEventListener('change', actualizarModoPaciente));
    if (selectPacienteId) selectPacienteId.addEventListener('change', refrescarEdad);
    if (inputFechaNacNuevo) inputFechaNacNuevo.addEventListener('input', refrescarEdad);
    if (inputFechaEval) inputFechaEval.addEventListener('input', refrescarEdad);
    if (selectTutorModo) selectTutorModo.addEventListener('change', actualizarModoTutor);

    actualizarModoPaciente();
    actualizarModoTutor();

    // Validar campos del paso actual antes de avanzar (Principio de Retorno Único)
    function validarPasoActual() {
        let esValido = true;
        const seccionActiva = document.getElementById(`paso-${pasoActual}`);
        if (seccionActiva) {
            const inputs = seccionActiva.querySelectorAll('input, select, textarea');
            for (const input of inputs) {
                // Si el input está dentro de un bloque oculto, no validar
                if (input.closest('[style*="display: none"]')) {
                    continue;
                }
                // 1. Verificación nativa HTML5
                if (!input.checkValidity()) {
                    input.reportValidity();
                    esValido = false;
                    break;
                }
                // 2. Verificación del validador modular en tiempo real
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
                    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // Atajo de teclado clínico: Ctrl+Enter para avanzar o guardar
    document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            if (pasoActual < totalPasos) {
                if (validarPasoActual()) {
                    pasoActual++;
                    actualizarVistaPasos();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } else if (pasoActual === totalPasos) {
                if (validarPasoActual() && formulario) {
                    if (formulario.requestSubmit) {
                        formulario.requestSubmit();
                    } else {
                        formulario.submit();
                    }
                }
            }
        }
    });

    // Actualizar elementos visibles según el paso actual (Principio de Retorno Único)
    function actualizarVistaPasos() {
        let actualizado = false;

        for (let i = 1; i <= totalPasos; i++) {
            const sec = document.getElementById(`paso-${i}`);
            const itemPaso = document.querySelector(`.paso-item[data-paso="${i}"]`);

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
});
