// ============================================================================
// routes/auth.js - RUTAS DE AUTENTICACIÓN, SESIONES Y DASHBOARD
// Centro de Atención Psicopedagógica - Programación Web II (I.E.S. Combate de Mbororé)
// ============================================================================

const express = require('express');
const router = express.Router();
const db = require('../db');
const Validaciones = require('../validaciones');
const { chequearLogin } = require('../middlewares/auth');
const { armarResumen, ultimasEvaluaciones } = require('../utils/helpers');

// ###   [FASE 2] - RUTAS DE SESIÓN (entrar, salir, panel)

// Raíz "/": es la puerta de entrada. Si ya está logueado va al panel; si no, al login.
router.get('/', (req, res) => {
    if (req.session && req.session.usuario) {
        return res.redirect('/dashboard');
    }
    return res.redirect('/login');
});

// GET /login: muestra el formulario. Si ya está logueado no tiene sentido, así que al panel.
router.get('/login', (req, res) => {
    if (req.session && req.session.usuario) {
        return res.redirect('/dashboard');
    }
    res.render('login', { error: null });
});

// POST /login: procesa el formulario de ingreso (soporta formulario HTML y clientes API como Thunder Client/Postman)
// ============================================================================
// [FASE 2 y 4 - LOGIN Y CONSULTA DE USUARIOS EN BBDD]
// ¿Qué hace?: Recibe usuario y contraseña enviados desde views/login.ejs y
// consulta en SQLite si la cuenta existe en la tabla "usuarios".
// ============================================================================
router.post('/login', (req, res) => {
    // Variable de estado de respuesta (Principio de Retorno Único)
    let respuestaFinal = null;
    const esApi = req.is('json') || req.headers.accept?.includes('application/json');

    // 1. Corroboración con el Módulo de Validaciones ([FASE 3])
    const validacion = Validaciones.login(req.body || {});

    if (!validacion.ok) {
        respuestaFinal = esApi
            ? res.status(400).json({ error: validacion.error })
            : res.status(400).render('login', { error: validacion.error });
    } else {
        // [CAPTURA DE CREDENCIALES]: Extrae usuario y contraseña desde req.body
        const { username, password, pass } = req.body || {};
        const clave = password || pass;

        // [FASE 4 - BÚSQUEDA POR USUARIO]: Ejecuta SELECT en SQLite buscando por username exacto
        const usuario = db.prepare('SELECT * FROM usuarios WHERE username = ?').get(username);

        const coincide = usuario && usuario.password === clave;
        if (!coincide) {
            respuestaFinal = esApi
                ? res.status(401).json({ error: 'Usuario o contraseña incorrecta' })
                : res.status(401).render('login', { error: 'Usuario o contraseña incorrecta' });
        } else {
            // Guardamos en la sesión solo lo mínimo: id, usuario, nombre y rol.
            req.session.usuario = {
                id: usuario.id,
                username: usuario.username,
                nombre: usuario.nombre,
                rol: usuario.rol
            };

            respuestaFinal = esApi
                ? res.json({ ok: true, mensaje: 'Inicio de sesion exitoso', usuario: req.session.usuario })
                : res.redirect('/dashboard');
        }
    }

    // Único return al final de la ruta
    return respuestaFinal;
});

// GET /logout: cierra la sesión (destruye los datos) y vuelve al login.
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// GET /dashboard: panel principal con los números reales del centro (o portal familiar si es tutor).
router.get('/dashboard', chequearLogin, (req, res) => {
    let respuestaFinal = null;
    const usuario = req.session.usuario;

    if (usuario.rol === 'tutor') {
        const hijos = db.prepare(`
            SELECT p.*, u.nombre AS profesional_nombre
            FROM pacientes p
            JOIN usuarios u ON u.id = p.profesional_id
            WHERE p.tutor_id = ?
        `).all(usuario.id);

        const evaluacionesHijos = db.prepare(`
            SELECT e.*, p.nombre AS paciente_nombre, u.nombre AS profesional_nombre
            FROM evaluaciones e
            JOIN pacientes p ON p.id = e.paciente_id
            JOIN usuarios u ON u.id = e.profesional_id
            WHERE p.tutor_id = ?
            ORDER BY e.fecha DESC
        `).all(usuario.id);

        respuestaFinal = res.render('dashboard', {
            esTutor: true,
            hijos: hijos,
            evaluacionesHijos: evaluacionesHijos,
            resumen: null,
            ultimas: []
        });
    } else {
        respuestaFinal = res.render('dashboard', {
            esTutor: false,
            hijos: [],
            evaluacionesHijos: [],
            resumen: armarResumen(usuario),
            ultimas: ultimasEvaluaciones(usuario)
        });
    }

    return respuestaFinal;
});

module.exports = router;
