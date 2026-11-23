// ============================================================================
// routes/admin.js - ADMINISTRACIÓN DEL SISTEMA (USUARIOS, CATÁLOGOS, PACIENTES, EVALUACIONES)
// Centro de Atención Psicopedagógica - Programación Web II (I.E.S. Combate de Mbororé)
// ============================================================================

const express = require('express');
const router = express.Router();
const db = require('../db');
const Validaciones = require('../validaciones');
const { chequearLogin, chequearRol } = require('../middlewares/auth');
const { ROLES } = require('../config/app-config');
const { subirImagenes } = require('../config/multer');
const { esUltimoAdministrador, calcularEdad } = require('../utils/helpers');

// Todos los endpoints de este router requieren login y rol 'administrador'
router.use(chequearLogin, chequearRol('administrador'));

// ============================================================================
// 1. GESTIÓN DE USUARIOS
// ============================================================================

// GET /admin/usuarios: listado de cuentas
router.get('/usuarios', (req, res) => {
    const lista = db.prepare('SELECT id, nombre, username, rol FROM usuarios ORDER BY id').all();

    return res.render('admin-usuarios', {
        lista: lista,
        roles: Object.keys(ROLES),
        ok: req.query.ok || null,
        error: req.query.error || null
    });
});

// POST /admin/usuarios: crear una cuenta nueva.
router.post('/usuarios', (req, res) => {
    let destino = null;

    // Corroboración con el Módulo de Validaciones ([FASE 3])
    const validacion = Validaciones.altaUsuario(req.body || {});
    if (!validacion.ok) {
        let motivo = validacion.error.includes('rol') ? 'rol' : 'datos';
        destino = `/admin/usuarios?error=${motivo}#alta`;
    } else {
        // [CAPTURA DE NUEVO USUARIO]: Extrae username, nombre, password y rol desde req.body
        const username = String(req.body.username || '').trim().toLowerCase();
        const nombre = String(req.body.nombre || '').trim();
        const password = String(req.body.password || '');
        const rol = String(req.body.rol || '');

        const existe = db.prepare('SELECT id FROM usuarios WHERE username = ?').get(username);
        if (existe) {
            destino = '/admin/usuarios?error=duplicado#alta';
        } else {
            db.prepare('INSERT INTO usuarios (username, password, nombre, rol) VALUES (?, ?, ?, ?)')
              .run(username, password, nombre, rol);
            destino = '/admin/usuarios?ok=creado#listado';
        }
    }

    return res.redirect(destino);
});

// POST /admin/usuarios/:id/rol: cambiar el rol de una cuenta.
router.post('/usuarios/:id/rol', (req, res) => {
    let destino = null;
    const id = Number(req.params.id);
    const rol = String(req.body.rol || '');

    if (!ROLES[rol]) {
        destino = '/admin/usuarios?error=rol#listado';
    } else if (esUltimoAdministrador(id) && rol !== 'administrador') {
        destino = '/admin/usuarios?error=ultimo-admin#listado';
    } else {
        db.prepare('UPDATE usuarios SET rol = ? WHERE id = ?').run(rol, id);
        destino = '/admin/usuarios?ok=rol#listado';
    }

    return res.redirect(destino);
});

// POST /admin/usuarios/:id/eliminar: borrar una cuenta.
router.post('/usuarios/:id/eliminar', (req, res) => {
    let destino = null;
    const id = Number(req.params.id);

    if (id === req.session.usuario.id) {
        destino = '/admin/usuarios?error=propia#listado';
    } else if (esUltimoAdministrador(id)) {
        destino = '/admin/usuarios?error=ultimo-admin#listado';
    } else {
        try {
            db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
            destino = '/admin/usuarios?ok=eliminado#listado';
        } catch (e) {
            destino = '/admin/usuarios?error=con-datos#listado';
        }
    }

    return res.redirect(destino);
});

// ============================================================================
// 2. GESTIÓN DE CATÁLOGOS CLÍNICOS
// ============================================================================

// GET /admin/catalogos: vista de gestión de opciones clínicas
router.get('/catalogos', (req, res) => {
    let respuestaFinal = null;
    const lista = db.prepare('SELECT id, categoria, nombre, orden, activo FROM opciones_clinicas ORDER BY categoria ASC, orden ASC, id ASC').all();

    respuestaFinal = res.render('admin-catalogos', {
        lista: lista,
        ok: req.query.ok || null,
        error: req.query.error || null
    });

    return respuestaFinal;
});

// POST /admin/catalogos: crear nueva opción clínica
router.post('/catalogos', (req, res) => {
    let destino = null;
    // [CAPTURA DE OPCIÓN CLÍNICA]: Extrae categoria, nombre y orden desde req.body
    const categoria = String(req.body.categoria || '').trim().toLowerCase();
    const nombre = String(req.body.nombre || '').trim();
    const orden = Number(req.body.orden || 0);

    const categoriasValidas = ['lenguaje', 'alimentacion', 'sueno'];

    if (!categoriasValidas.includes(categoria) || nombre.length < 2 || nombre.length > 80) {
        destino = '/admin/catalogos?error=datos#alta';
    } else {
        const existe = db.prepare('SELECT id FROM opciones_clinicas WHERE categoria = ? AND LOWER(nombre) = LOWER(?)').get(categoria, nombre);
        if (existe) {
            destino = '/admin/catalogos?error=duplicado#alta';
        } else {
            db.prepare('INSERT INTO opciones_clinicas (categoria, nombre, orden, activo) VALUES (?, ?, ?, 1)')
              .run(categoria, nombre, orden);
            destino = '/admin/catalogos?ok=creado#listado';
        }
    }

    return res.redirect(destino);
});

// POST /admin/catalogos/:id/toggle: activar o deshabilitar una opción clínica
router.post('/catalogos/:id/toggle', (req, res) => {
    let destino = null;
    const id = Number(req.params.id);
    const opcion = db.prepare('SELECT id, activo FROM opciones_clinicas WHERE id = ?').get(id);

    if (!opcion) {
        destino = '/admin/catalogos?error=no-existe#listado';
    } else {
        const nuevoEstado = opcion.activo === 1 ? 0 : 1;
        db.prepare('UPDATE opciones_clinicas SET activo = ? WHERE id = ?').run(nuevoEstado, id);
        destino = '/admin/catalogos?ok=estado#listado';
    }

    return res.redirect(destino);
});

// POST /admin/catalogos/:id/eliminar: borrar una opción clínica
router.post('/admin/catalogos/:id/eliminar', (req, res) => {
    let destino = null;
    const id = Number(req.params.id);

    try {
        db.prepare('DELETE FROM opciones_clinicas WHERE id = ?').run(id);
        destino = '/admin/catalogos?ok=eliminado#listado';
    } catch (e) {
        destino = '/admin/catalogos?error=fallo#listado';
    }

    return res.redirect(destino);
});

// ============================================================================
// 3. GESTIÓN Y EDICIÓN DE PACIENTES
// ============================================================================

// GET /admin/pacientes: listado completo para gestión y edición
router.get('/pacientes', (req, res) => {
    let respuestaFinal = null;

    const pacientes = db.prepare(`
        SELECT p.id, p.nombre, p.fecha_nacimiento, p.edad_anios, p.edad_meses,
               prof.nombre AS profesional_nombre,
               tut.nombre  AS tutor_nombre,
               tut.username AS tutor_dni,
               COUNT(e.id) AS total_evaluaciones
        FROM pacientes p
        LEFT JOIN usuarios prof ON prof.id = p.profesional_id
        LEFT JOIN usuarios tut  ON tut.id  = p.tutor_id
        LEFT JOIN evaluaciones e ON e.paciente_id = p.id
        GROUP BY p.id
        ORDER BY p.nombre ASC
    `).all();

    respuestaFinal = res.render('admin-pacientes', {
        pacientes: pacientes,
        ok: req.query.ok || null,
        error: req.query.error || null
    });

    return respuestaFinal;
});

// GET /admin/pacientes/:id/editar: formulario de edición de datos del paciente
router.get('/pacientes/:id/editar', (req, res) => {
    let respuestaFinal = null;
    const id = Number(req.params.id);
    const paciente = db.prepare('SELECT * FROM pacientes WHERE id = ?').get(id);

    if (!paciente) {
        respuestaFinal = res.redirect('/admin/pacientes?error=no-existe');
    } else {
        const profesionales = db.prepare("SELECT id, nombre, username FROM usuarios WHERE rol IN ('comun', 'administrador') ORDER BY nombre ASC").all();
        const tutores = db.prepare("SELECT id, nombre, username FROM usuarios WHERE rol = 'tutor' ORDER BY nombre ASC").all();

        respuestaFinal = res.render('admin-pacientes-editar', {
            paciente: paciente,
            profesionales: profesionales,
            tutores: tutores,
            error: null,
            mensaje: req.query.ok === 'guardado' ? 'Cambios guardados exitosamente.' : null
        });
    }

    return respuestaFinal;
});

// POST /admin/pacientes/:id/editar: actualiza datos del paciente y recalcula edad
router.post('/pacientes/:id/editar', (req, res) => {
    let respuestaFinal = null;
    // [CAPTURA DE EDICIÓN DE PACIENTE]: Extrae ID desde URL (req.params.id) y campos desde req.body
    const id = Number(req.params.id);
    const paciente = db.prepare('SELECT * FROM pacientes WHERE id = ?').get(id);

    if (!paciente) {
        respuestaFinal = res.redirect('/admin/pacientes?error=no-existe');
    } else {
        const nombre = String(req.body.nombre || '').trim();
        const fechaNac = String(req.body.fecha_nacimiento || '').trim();
        const profesionalId = Number(req.body.profesional_id);
        const tutorId = req.body.tutor_id ? Number(req.body.tutor_id) : null;
        const hoy = new Date().toISOString().split('T')[0];

        const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

        if (!nombre || nombre.length < 3 || !regexSoloLetras.test(nombre)) {
            const profesionales = db.prepare("SELECT id, nombre, username FROM usuarios WHERE rol IN ('comun', 'administrador') ORDER BY nombre ASC").all();
            const tutores = db.prepare("SELECT id, nombre, username FROM usuarios WHERE rol = 'tutor' ORDER BY nombre ASC").all();
            respuestaFinal = res.status(400).render('admin-pacientes-editar', {
                paciente: { ...paciente, nombre, fecha_nacimiento: fechaNac, profesional_id: profesionalId, tutor_id: tutorId },
                profesionales: profesionales,
                tutores: tutores,
                error: 'El nombre del paciente debe tener al menos 3 caracteres y solo contener letras.',
                mensaje: null
            });
        } else if (!fechaNac || fechaNac > hoy) {
            const profesionales = db.prepare("SELECT id, nombre, username FROM usuarios WHERE rol IN ('comun', 'administrador') ORDER BY nombre ASC").all();
            const tutores = db.prepare("SELECT id, nombre, username FROM usuarios WHERE rol = 'tutor' ORDER BY nombre ASC").all();
            respuestaFinal = res.status(400).render('admin-pacientes-editar', {
                paciente: { ...paciente, nombre, fecha_nacimiento: fechaNac, profesional_id: profesionalId, tutor_id: tutorId },
                profesionales: profesionales,
                tutores: tutores,
                error: 'La fecha de nacimiento no puede ser futura.',
                mensaje: null
            });
        } else {
            const edad = calcularEdad(fechaNac, hoy);

            db.prepare(`
                UPDATE pacientes
                SET nombre = ?, fecha_nacimiento = ?, edad_anios = ?, edad_meses = ?, profesional_id = ?, tutor_id = ?
                WHERE id = ?
            `).run(nombre, fechaNac, edad.anios, edad.meses, profesionalId, tutorId, id);

            respuestaFinal = res.redirect('/admin/pacientes?ok=editado');
        }
    }

    return respuestaFinal;
});

// POST /admin/pacientes/:id/eliminar: borrar un paciente
router.post('/pacientes/:id/eliminar', (req, res) => {
    let destino = null;
    const id = Number(req.params.id);

    try {
        const evaluaciones = db.prepare('SELECT id FROM evaluaciones WHERE paciente_id = ?').all(id);
        for (const ev of evaluaciones) {
            db.prepare('DELETE FROM imagenes WHERE evaluacion_id = ?').run(ev.id);
        }
        db.prepare('DELETE FROM evaluaciones WHERE paciente_id = ?').run(id);
        db.prepare('DELETE FROM pacientes WHERE id = ?').run(id);
        destino = '/admin/pacientes?ok=eliminado';
    } catch (e) {
        destino = '/admin/pacientes?error=fallo';
    }

    return res.redirect(destino);
});

// ============================================================================
// 4. GESTIÓN Y EDICIÓN DE EVALUACIONES CLÍNICAS
// ============================================================================

// GET /admin/evaluaciones/:id/editar: formulario para que el Administrador corrija cualquier informe
router.get('/evaluaciones/:id/editar', (req, res) => {
    let respuestaFinal = null;
    const id = Number(req.params.id);

    const evaluacion = db.prepare(`
        SELECT e.*, p.nombre AS paciente_nombre, p.fecha_nacimiento AS paciente_nacimiento,
               u.nombre AS profesional_nombre
        FROM evaluaciones e
        JOIN pacientes p ON p.id = e.paciente_id
        JOIN usuarios u ON u.id = e.profesional_id
        WHERE e.id = ?
    `).get(id);

    if (!evaluacion) {
        respuestaFinal = res.redirect('/historial?error=no-existe');
    } else {
        const imagenes = db.prepare('SELECT * FROM imagenes WHERE evaluacion_id = ?').all(id);

        respuestaFinal = res.render('admin-evaluaciones-editar', {
            evaluacion: evaluacion,
            imagenes: imagenes,
            error: null,
            mensaje: req.query.ok === 'guardado' ? 'Informe clínico actualizado exitosamente.' : null
        });
    }

    return respuestaFinal;
});

// POST /admin/evaluaciones/:id/editar: actualiza cualquier informe clínico
router.post('/evaluaciones/:id/editar', subirImagenes.array('imagenes'), (req, res) => {
    let respuestaFinal = null;
    // [CAPTURA DE EDICIÓN DE EVALUACIÓN]: Extrae ID desde URL (req.params.id) y notas actualizadas desde req.body
    const id = Number(req.params.id);
    const evaluacion = db.prepare('SELECT * FROM evaluaciones WHERE id = ?').get(id);

    if (!evaluacion) {
        respuestaFinal = res.redirect('/historial?error=no-existe');
    } else {
        const {
            fecha, motivo_consulta, desarrollo_lenguaje, desarrollo_motor,
            alimentacion, sueno, tiempo_libre, juego, observaciones
        } = req.body;

        const fechaEval = String(fecha || '').trim();
        const texto = (valor) => String(valor || '');
        const hoy = new Date().toISOString().split('T')[0];

        if (!fechaEval || fechaEval > hoy) {
            const evCompleta = db.prepare(`
                SELECT e.*, p.nombre AS paciente_nombre, p.fecha_nacimiento AS paciente_nacimiento, u.nombre AS profesional_nombre
                FROM evaluaciones e
                JOIN pacientes p ON p.id = e.paciente_id
                JOIN usuarios u ON u.id = e.profesional_id
                WHERE e.id = ?
            `).get(id);
            const imagenes = db.prepare('SELECT * FROM imagenes WHERE evaluacion_id = ?').all(id);

            respuestaFinal = res.status(400).render('admin-evaluaciones-editar', {
                evaluacion: { ...evCompleta, ...req.body },
                imagenes: imagenes,
                error: 'La fecha de la evaluación es obligatoria y no puede ser futura.',
                mensaje: null
            });
        } else {
            db.prepare(`
                UPDATE evaluaciones
                SET fecha = ?, motivo_consulta = ?, desarrollo_lenguaje = ?,
                    desarrollo_motor = ?, alimentacion = ?, sueno = ?,
                    tiempo_libre = ?, juego = ?, observaciones = ?
                WHERE id = ?
            `).run(fechaEval, texto(motivo_consulta), texto(desarrollo_lenguaje),
                   texto(desarrollo_motor), texto(alimentacion), texto(sueno),
                   texto(tiempo_libre), texto(juego), texto(observaciones), id);

            // Guardar nuevas imágenes si se adjuntaron
            const archivos = req.files || [];
            for (const archivo of archivos) {
                db.prepare('INSERT INTO imagenes (evaluacion_id, ruta) VALUES (?, ?)')
                  .run(id, '/uploads/' + archivo.filename);
            }

            respuestaFinal = res.redirect('/historial?ok=eval-editada');
        }
    }

    return respuestaFinal;
});

// POST /admin/evaluaciones/:id/eliminar: elimina una evaluación clínica errónea
router.post('/evaluaciones/:id/eliminar', (req, res) => {
    let destino = null;
    const id = Number(req.params.id);

    try {
        db.prepare('DELETE FROM imagenes WHERE evaluacion_id = ?').run(id);
        db.prepare('DELETE FROM evaluaciones WHERE id = ?').run(id);
        destino = '/historial?ok=eval-eliminada';
    } catch (e) {
        destino = '/historial?error=fallo';
    }

    return res.redirect(destino);
});

module.exports = router;
