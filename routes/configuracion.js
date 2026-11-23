// ============================================================================
// routes/configuracion.js - CONFIGURACIÓN DE CUENTA Y APARIENCIA INSTITUCIONAL
// Centro de Atención Psicopedagógica - Programación Web II (I.E.S. Combate de Mbororé)
// ============================================================================

const express = require('express');
const router = express.Router();
const db = require('../db');
const Validaciones = require('../validaciones');
const { chequearLogin, chequearRol } = require('../middlewares/auth');
const { ACENTOS, guardarConfig } = require('../config/app-config');

// ###   [FASE 3] - CONFIGURACIÓN (contraseña propia y apariencia)
router.get('/', chequearLogin, (req, res) => {
    const esAdmin = req.session.usuario.rol === 'administrador';

    res.render('configuracion', {
        esAdmin: esAdmin,
        acentos: ACENTOS,
        ok: req.query.ok || null,
        error: req.query.error || null
    });
});

// POST /configuracion/password: cambio individual de contraseña (Anexo I).
// Cualquier rol puede cambiar la suya; nadie puede cambiar la de otro desde acá.
router.post('/password', chequearLogin, (req, res) => {
    let destino = null;
    const fila = db.prepare('SELECT password FROM usuarios WHERE id = ?').get(req.session.usuario.id);

    // Corroboración con el Módulo de Validaciones ([FASE 3])
    const validacion = Validaciones.cambioPassword(req.body || {}, fila ? fila.password : null);
    if (!validacion.ok) {
        let motivo = 'actual';
        if (validacion.error.includes('mínimo') || validacion.error.includes('al menos')) motivo = 'corta';
        if (validacion.error.includes('coincide')) motivo = 'repetir';
        destino = `/configuracion?error=${motivo}#password`;
    } else {
        db.prepare('UPDATE usuarios SET password = ? WHERE id = ?').run(String(req.body.nueva), req.session.usuario.id);
        destino = '/configuracion?ok=password#password';
    }

    return res.redirect(destino);
});

// POST /configuracion/apariencia: solo el administrador (Anexo I: botoneras,
// menúes y combinación de colores). Los valores se validan contra los presets.
router.post('/apariencia', chequearLogin, chequearRol('administrador'), (req, res) => {
    const acento = String(req.body.acento || '');
    const botones = String(req.body.botones || '');
    const menu = String(req.body.menu || '');

    if (ACENTOS[acento]) {
        guardarConfig('acento', acento);
    }
    if (['redondeado', 'recto'].includes(botones)) {
        guardarConfig('botones', botones);
    }
    if (['comodo', 'compacto'].includes(menu)) {
        guardarConfig('menu', menu);
    }

    return res.redirect('/configuracion?ok=apariencia#apariencia');
});

module.exports = router;
