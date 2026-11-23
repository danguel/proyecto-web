// ============================================================================
// routes/estadisticas.js - MÉTRICAS Y AGREGACIONES DEL CENTRO
// Centro de Atención Psicopedagógica - Programación Web II (I.E.S. Combate de Mbororé)
// ============================================================================

const express = require('express');
const router = express.Router();
const { chequearLogin } = require('../middlewares/auth');
const { armarEstadisticas } = require('../utils/helpers');

// ###   [FASE 4] - ESTADÍSTICAS
// Los números salen de la base, no de valores escritos a mano. El administrador ve
// todo el centro; el profesional ve solo sus pacientes (mismo criterio que el panel).
router.get('/', chequearLogin, (req, res) => {
    res.render('estadisticas', { datos: armarEstadisticas(req.session.usuario) });
});

module.exports = router;
