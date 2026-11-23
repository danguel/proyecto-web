// ============================================================================
// middlewares/auth.js - MIDDLEWARES DE CONTROL DE ACCESO (RBAC)
// Centro de Atención Psicopedagógica - Programación Web II (I.E.S. Combate de Mbororé)
// ============================================================================

// ###   [FASE 2] - MIDDLEWARES DE CONTROL DE ACCESO
// Estos dos middlewares son la BARRERA real del sistema: aunque alguien escriba
// la URL a mano, sin sesión no pasa.

// chequearLogin: valida la existencia de una sesión activa (soporta vistas web y clientes API como Thunder Client/Postman)
function chequearLogin(req, res, next) {
    if (req.session && req.session.usuario) {
        return next();
    }
    // Si la petición viene de Thunder Client / Postman (ruta /api o pide JSON), respondemos con 401
    if (req.path.startsWith('/api') || req.is('json') || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ error: 'Debes iniciar sesion' });
    }
    return res.redirect('/login');
}

// chequearRol: deja pasar SOLO si el rol del usuario está entre los permitidos.
function chequearRol(...rolesPermitidos) {
    return function (req, res, next) {
        const usuario = req.session && req.session.usuario;
        if (usuario && rolesPermitidos.includes(usuario.rol)) {
            return next();
        }
        if (req.path.startsWith('/api') || req.is('json') || req.headers.accept?.includes('application/json')) {
            return res.status(403).json({ error: 'Tu rol no tiene permisos para entrar acá.' });
        }
        return res.status(403).render('error', {
            mensaje: 'Tu rol no tiene permisos para entrar acá.'
        });
    };
}

module.exports = {
    chequearLogin,
    chequearRol
};
