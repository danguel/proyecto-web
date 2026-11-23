// ============================================================================
// validaciones.js - MÓDULO DE AUDITORÍA Y VALIDACIONES CENTRALIZADAS
// Centro de Atención Psicopedagógica - Programación Web II
//
// Patrón de diseño pedagógico: "Single Return" (Punto único de salida).
// Cada función define su variable de estado al inicio (let resultado = ...),
// ejecuta las reglas de sanitización y control de tipos, y tiene UN SOLO return al final.
// ============================================================================

const db = require('./db');

const Validaciones = {
    // ------------------------------------------------------------------------
    // 1. AUDITORÍA: Formulario de Evaluación Clínica (Paciente Existente o Nuevo + Tutor)
    // ------------------------------------------------------------------------
    evaluacion(body, files = []) {
        let resultado = { ok: true, error: null };

        const pacienteModo = body.paciente_modo === 'existente' ? 'existente' : 'nuevo';
        const pacienteId = Number(body.paciente_id || 0);
        const nombre = String(body.nombre_paciente || '').trim();
        const fechaNac = String(body.fecha_nacimiento || '').trim();
        const fechaEval = String(body.fecha || '').trim();
        const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
        const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
        const regexDni = /^\d{7,8}$/;
        const hoy = new Date().toISOString().split('T')[0];

        // Validaciones según si el paciente es existente o se registra nuevo
        if (pacienteModo === 'existente') {
            if (!pacienteId || pacienteId <= 0) {
                resultado = { ok: false, error: 'Debe seleccionar un paciente registrado de la lista.' };
            }
        } else {
            // Validaciones de Nuevo Paciente
            if (!nombre || nombre.length < 3) {
                resultado = { ok: false, error: 'El nombre del paciente debe tener al menos 3 caracteres.' };
            } else if (nombre.length > 100) {
                resultado = { ok: false, error: 'El nombre del paciente es demasiado largo (máximo 100 caracteres).' };
            } else if (!regexSoloLetras.test(nombre)) {
                resultado = { ok: false, error: 'El nombre del paciente solo puede contener letras y espacios (no se permiten números).' };
            } else if (!regexFecha.test(fechaNac)) {
                resultado = { ok: false, error: 'La fecha de nacimiento no tiene un formato válido (AAAA-MM-DD).' };
            } else if (fechaNac > hoy) {
                resultado = { ok: false, error: 'La fecha de nacimiento no puede superar al día actual.' };
            } else if (fechaNac < '1920-01-01') {
                resultado = { ok: false, error: 'La fecha de nacimiento ingresada no es realista.' };
            }

            // Validaciones del Tutor asignado
            if (resultado.ok && body.tutor_modo === 'crear') {
                const tutorNombre = String(body.nuevo_tutor_nombre || '').trim();
                const tutorDni = String(body.nuevo_tutor_dni || '').trim();

                if (!tutorNombre || tutorNombre.length < 3) {
                    resultado = { ok: false, error: 'El nombre del tutor debe tener al menos 3 caracteres.' };
                } else if (!regexSoloLetras.test(tutorNombre)) {
                    resultado = { ok: false, error: 'El nombre del tutor solo puede contener letras y espacios.' };
                } else if (!regexDni.test(tutorDni)) {
                    resultado = { ok: false, error: 'El DNI del tutor debe contener entre 7 y 8 números (sin puntos ni letras).' };
                }
            }
        }

        // Validaciones de la Evaluación Clínica (comunes a ambos modos)
        if (resultado.ok) {
            // Obtenemos dinámicamente las opciones activas desde la tabla paramétrica en BD
            const opcionesLenguaje = db.prepare("SELECT nombre FROM opciones_clinicas WHERE categoria = 'lenguaje' AND activo = 1").all().map(o => o.nombre);
            const opcionesAlimentacion = db.prepare("SELECT nombre FROM opciones_clinicas WHERE categoria = 'alimentacion' AND activo = 1").all().map(o => o.nombre);
            const opcionesSueno = db.prepare("SELECT nombre FROM opciones_clinicas WHERE categoria = 'sueno' AND activo = 1").all().map(o => o.nombre);

            if (!regexFecha.test(fechaEval)) {
                resultado = { ok: false, error: 'La fecha de la evaluación no tiene un formato válido (AAAA-MM-DD).' };
            } else if (fechaEval > hoy) {
                resultado = { ok: false, error: 'La fecha de la evaluación no puede ser futura (no debe superar al día actual).' };
            } else if (pacienteModo === 'nuevo' && fechaNac > fechaEval) {
                resultado = { ok: false, error: 'La fecha de nacimiento no puede ser posterior a la fecha de la evaluación.' };
            } else if (body.desarrollo_lenguaje && !opcionesLenguaje.includes(body.desarrollo_lenguaje)) {
                resultado = { ok: false, error: 'Opción no válida para Desarrollo del Lenguaje.' };
            } else if (body.alimentacion && !opcionesAlimentacion.includes(body.alimentacion)) {
                resultado = { ok: false, error: 'Opción no válida para Alimentación.' };
            } else if (body.sueno && !opcionesSueno.includes(body.sueno)) {
                resultado = { ok: false, error: 'Opción no válida para Sueño.' };
            } else if (body.motivo_consulta && /^\d+$/.test(String(body.motivo_consulta).trim())) {
                resultado = { ok: false, error: 'El motivo de consulta debe ser un texto descriptivo, no solo números.' };
            } else if (body.desarrollo_motor && /^\d+$/.test(String(body.desarrollo_motor).trim())) {
                resultado = { ok: false, error: 'El desarrollo motor debe ser un texto descriptivo, no solo números.' };
            } else if (body.tiempo_libre && /^\d+$/.test(String(body.tiempo_libre).trim())) {
                resultado = { ok: false, error: 'El tiempo libre debe ser descriptivo, no solo números.' };
            } else if (body.juego && /^\d+$/.test(String(body.juego).trim())) {
                resultado = { ok: false, error: 'La descripción de juego debe contener texto explicativo, no solo números.' };
            } else if (Array.isArray(files) && files.length > 0) {
                const tiposValidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
                const maxTamano = 8 * 1024 * 1024; // 8 MB

                for (const archivo of files) {
                    if (!tiposValidos.includes(archivo.mimetype)) {
                        resultado = { ok: false, error: 'Solo se permiten imágenes (JPG, PNG, WEBP o GIF).' };
                        break;
                    }
                    if (archivo.size > maxTamano) {
                        resultado = { ok: false, error: 'Cada imagen adjunta no debe superar los 8 MB.' };
                        break;
                    }
                }
            }
        }

        return resultado;
    },

    // ------------------------------------------------------------------------
    // 2. AUDITORÍA: Credenciales de Ingreso (Login)
    // ------------------------------------------------------------------------
    login(body) {
        let resultado = { ok: true, error: null };

        const username = String(body.username || '').trim();
        const password = String(body.password || body.pass || '').trim();

        if (!username || username.length < 3) {
            resultado = { ok: false, error: 'El usuario debe tener al menos 3 caracteres.' };
        } else if (username.length > 50) {
            resultado = { ok: false, error: 'El usuario no puede superar los 50 caracteres.' };
        } else if (!password) {
            resultado = { ok: false, error: 'Debe ingresar una contraseña.' };
        }

        return resultado;
    },

    // ------------------------------------------------------------------------
    // 3. AUDITORÍA: Filtros de Búsqueda del Historial
    // ------------------------------------------------------------------------
    historial(query) {
        let resultado = { ok: true, error: null };

        const desde = String(query.desde || '').trim();
        const hasta = String(query.hasta || '').trim();
        const nombre = String(query.nombre || '').trim();
        const regexFecha = /^\d{4}-\d{2}-\d{2}$/;

        if (!desde && !hasta && !nombre) {
            resultado = { ok: false, error: 'Completá al menos uno de los filtros: desde, hasta o nombre.' };
        } else if (desde && !regexFecha.test(desde)) {
            resultado = { ok: false, error: 'La fecha "desde" no tiene un formato válido (AAAA-MM-DD).' };
        } else if (hasta && !regexFecha.test(hasta)) {
            resultado = { ok: false, error: 'La fecha "hasta" no tiene un formato válido (AAAA-MM-DD).' };
        } else if (desde && hasta && desde > hasta) {
            resultado = { ok: false, error: 'La fecha "desde" no puede ser posterior a la fecha "hasta".' };
        } else if (nombre && nombre.length > 100) {
            resultado = { ok: false, error: 'El término de búsqueda de paciente es demasiado largo.' };
        }

        return resultado;
    },

    // ------------------------------------------------------------------------
    // 4. AUDITORÍA: Alta de Usuarios del Sistema (Admin)
    // ------------------------------------------------------------------------
    altaUsuario(body) {
        let resultado = { ok: true, error: null };

        const username = String(body.username || '').trim().toLowerCase();
        const nombre = String(body.nombre || '').trim();
        const password = String(body.password || '');
        const rol = String(body.rol || '');
        const rolesValidos = ['administrador', 'comun', 'tutor'];
        const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

        if (!username || username.length < 3) {
            resultado = { ok: false, error: 'El nombre de usuario debe tener al menos 3 caracteres.' };
        } else if (username.length > 30) {
            resultado = { ok: false, error: 'El nombre de usuario no puede exceder los 30 caracteres.' };
        } else if (!/^[a-z0-9_.-]+$/.test(username)) {
            resultado = { ok: false, error: 'El usuario solo puede contener letras minúsculas, números, puntos o guiones.' };
        } else if (!nombre || nombre.length < 3) {
            resultado = { ok: false, error: 'El nombre completo debe tener al menos 3 caracteres.' };
        } else if (nombre.length > 80) {
            resultado = { ok: false, error: 'El nombre completo no puede exceder los 80 caracteres.' };
        } else if (!regexSoloLetras.test(nombre)) {
            resultado = { ok: false, error: 'El nombre y apellido de la persona solo puede contener letras y espacios.' };
        } else if (!password || password.length < 4) {
            resultado = { ok: false, error: 'La contraseña debe tener un mínimo de 4 caracteres.' };
        } else if (!rolesValidos.includes(rol)) {
            resultado = { ok: false, error: 'El rol seleccionado no es válido.' };
        }

        return resultado;
    },

    // ------------------------------------------------------------------------
    // 5. AUDITORÍA: Cambio de Contraseña
    // ------------------------------------------------------------------------
    cambioPassword(body, passActualBD) {
        let resultado = { ok: true, error: null };

        const actual = String(body.actual || '');
        const nueva = String(body.nueva || '');
        const repetir = String(body.repetir || '');

        if (!actual || actual !== passActualBD) {
            resultado = { ok: false, error: 'La contraseña actual no es correcta.' };
        } else if (!nueva || nueva.length < 4) {
            resultado = { ok: false, error: 'La nueva contraseña debe tener al menos 4 caracteres.' };
        } else if (nueva.length > 64) {
            resultado = { ok: false, error: 'La nueva contraseña no puede exceder los 64 caracteres.' };
        } else if (nueva !== repetir) {
            resultado = { ok: false, error: 'La confirmación de la contraseña no coincide.' };
        } else if (nueva === actual) {
            resultado = { ok: false, error: 'La nueva contraseña no puede ser idéntica a la anterior.' };
        }

        return resultado;
    }
};

module.exports = Validaciones;
