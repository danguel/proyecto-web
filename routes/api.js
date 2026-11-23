// ============================================================================
// routes/api.js - ENDPOINTS DE API REST (TESTEO CON THUNDER CLIENT / POSTMAN)
// Centro de Atención Psicopedagógica - Programación Web II (I.E.S. Combate de Mbororé)
// ============================================================================

const express = require('express');
const router = express.Router();
const db = require('../db');
const { chequearLogin, chequearRol } = require('../middlewares/auth');
const { armarResumen } = require('../utils/helpers');

// ###   [FASE 1 y 2] - ENDPOINTS DE API (TESTEO THUNDER CLIENT / POSTMAN)
// Requeridos para demostrar la Fase 1 y Fase 2 sin navegador: devuelven JSON y validan cookie de sesión.

// GET /api/dashboard: devuelve los indicadores del centro en JSON (401 si no hay sesión)
router.get('/dashboard', chequearLogin, (req, res) => {
    res.json({
        ok: true,
        mensaje: `Bienvenido/a ${req.session.usuario.nombre}`,
        rol: req.session.usuario.rol,
        resumen: armarResumen(req.session.usuario)
    });
});

// GET /api/admin/usuarios: lista de usuarios en JSON (403 si el rol no es administrador)
router.get('/admin/usuarios', chequearLogin, chequearRol('administrador'), (req, res) => {
    const lista = db.prepare('SELECT id, nombre, username, rol FROM usuarios ORDER BY id').all();
    res.json({ ok: true, usuarios: lista });
});

// POST /api/logout: cierre de sesión vía API
router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ ok: true, mensaje: 'Sesión cerrada' });
    });
});

module.exports = router;
