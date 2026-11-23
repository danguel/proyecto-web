// ============================================================================
// routes/evaluaciones.js - RUTAS DE ALTA Y GESTIÓN DE EVALUACIONES CLÍNICAS
// Centro de Atención Psicopedagógica - Programación Web II (I.E.S. Combate de Mbororé)
// ============================================================================

const express = require('express');
const router = express.Router();
const db = require('../db');
const Validaciones = require('../validaciones');
const { chequearLogin, chequearRol } = require('../middlewares/auth');
const { subirImagenes } = require('../config/multer');
const { calcularEdad } = require('../utils/helpers');

// ###   [FASE 1 y 4] - RUTAS DE EVALUACIONES (nuevo paciente + evaluación)

// GET /evaluaciones/nueva: formulario de carga.
// ¿Quién entra? Profesional (comun) y Administrador. El Tutor NO entra:
// es de solo lectura y esta pantalla CREA datos.
router.get('/nueva', chequearLogin, chequearRol('comun', 'administrador'), (req, res) => {
    res.render('evaluaciones-nueva', { mensaje: null, error: null });
});

// ============================================================================
// [FASE 4 - FLUJO DE GUARDADO DE EVALUACIONES]
// ¿Qué hace?: Recibe los datos enviados desde el formulario de la vista cuando
// el usuario hace clic en el botón "Guardar evaluación".
// Ruta: POST /evaluaciones/nueva
// ============================================================================
router.post('/nueva', chequearLogin, chequearRol('comun', 'administrador'), subirImagenes.array('imagenes'), (req, res) => {
    let respuestaFinal = null;

    // Corroboración con el Módulo de Validaciones ([FASE 3])
    const validacion = Validaciones.evaluacion(req.body || {}, req.files || []);

    if (!validacion.ok) {
        respuestaFinal = res.status(400).render('evaluaciones-nueva', {
            mensaje: null,
            error: validacion.error
        });
    } else {
        // [CAPTURA DE EVALUACIÓN CLÍNICA]: Extrae todos los campos del formulario desde req.body y req.files
        const {
            paciente_modo, paciente_id,
            nombre_paciente, fecha_nacimiento, fecha,
            tutor_modo, tutor_id, nuevo_tutor_nombre, nuevo_tutor_dni,
            motivo_consulta, desarrollo_lenguaje, desarrollo_motor,
            alimentacion, sueno, tiempo_libre, juego, observaciones
        } = req.body;

        // [FASE 4 - CAPTURA DE IDENTIDAD]: Extrae el ID del profesional logueado desde la sesión
        const profesionalId = req.session.usuario.id;
        const fechaEvaluacion = String(fecha || '').trim();
        const texto = (valor) => String(valor || '');

        let pacienteIdFinal = null;
        let nombrePacienteFinal = '';

        if (paciente_modo === 'existente') {
            const pacienteExistente = db.prepare('SELECT * FROM pacientes WHERE id = ?').get(Number(paciente_id));
            if (!pacienteExistente) {
                respuestaFinal = res.status(400).render('evaluaciones-nueva', {
                    mensaje: null,
                    error: 'El paciente seleccionado no existe en el sistema.'
                });
            } else {
                pacienteIdFinal = pacienteExistente.id;
                nombrePacienteFinal = pacienteExistente.nombre;
            }
        } else {
            // Alta de nuevo paciente
            const nombrePaciente = String(nombre_paciente || '').trim();
            const fechaNac = String(fecha_nacimiento || '').trim();
            const edad = calcularEdad(fechaNac, fechaEvaluacion);
            let tutorIdFinal = null;

            if (tutor_modo === 'existente' && tutor_id) {
                tutorIdFinal = Number(tutor_id) || null;
            } else if (tutor_modo === 'crear' && nuevo_tutor_dni && nuevo_tutor_nombre) {
                const dniLimpio = String(nuevo_tutor_dni).trim();
                const nombreTutorLimpio = String(nuevo_tutor_nombre).trim();

                // Verificar si ya existe una cuenta con ese DNI como username
                const tutorExistente = db.prepare('SELECT id FROM usuarios WHERE username = ?').get(dniLimpio);
                if (tutorExistente) {
                    tutorIdFinal = tutorExistente.id;
                } else {
                    // Contraseña inicial = DNI del tutor (modificable luego en /configuracion)
                    const resTutor = db.prepare(`
                        INSERT INTO usuarios (username, password, nombre, rol)
                        VALUES (?, ?, ?, 'tutor')
                    `).run(dniLimpio, dniLimpio, nombreTutorLimpio);
                    tutorIdFinal = resTutor.lastInsertRowid;
                }
            }

            // [FASE 4 - BBDD INSERT: PACIENTES]
            // Inserta el nuevo paciente y obtiene su ID generado automáticamente (lastInsertRowid)
            const resultadoPaciente = db.prepare(`
                INSERT INTO pacientes (nombre, fecha_nacimiento, edad_anios, edad_meses, profesional_id, tutor_id)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(nombrePaciente, fechaNac, edad.anios, edad.meses, profesionalId, tutorIdFinal);

            pacienteIdFinal = resultadoPaciente.lastInsertRowid;
            nombrePacienteFinal = nombrePaciente;
        }

        // Si no hubo error en la resolución del paciente, registramos la evaluación
        if (!respuestaFinal) {
            // [FASE 4 - BBDD INSERT: EVALUACIONES]
            // Inserta el informe clínico en la tabla "evaluaciones", enlazado a paciente_id y profesional_id
            const resultadoEvaluacion = db.prepare(`
                INSERT INTO evaluaciones
                    (paciente_id, profesional_id, fecha, motivo_consulta, desarrollo_lenguaje,
                     desarrollo_motor, alimentacion, sueno, tiempo_libre, juego, observaciones)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(pacienteIdFinal, profesionalId, fechaEvaluacion, texto(motivo_consulta),
                   texto(desarrollo_lenguaje), texto(desarrollo_motor), texto(alimentacion),
                   texto(sueno), texto(tiempo_libre), texto(juego), texto(observaciones));
            const evaluacionId = resultadoEvaluacion.lastInsertRowid;

            // [FASE 4 - BBDD INSERT: IMAGENES ADJUNTAS]
            // Guarda las imágenes vinculadas por clave foránea a la evaluación recién creada
            const archivos = req.files || [];
            for (const archivo of archivos) {
                db.prepare('INSERT INTO imagenes (evaluacion_id, ruta) VALUES (?, ?)')
                  .run(evaluacionId, '/uploads/' + archivo.filename);
            }

            // [FASE 4 - RETROALIMENTACIÓN A LA VISTA]
            // Devuelve la vista EJS con el mensaje de éxito para que el usuario lo vea
            respuestaFinal = res.render('evaluaciones-nueva', {
                mensaje: 'Se guardó exitosamente la evaluación de "' + nombrePacienteFinal + '".',
                error: null
            });
        }
    }

    return respuestaFinal;
});

module.exports = router;
