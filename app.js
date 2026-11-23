// ============================================================================
// app.js - SERVIDOR PRINCIPAL Y ENSAMBLADO DE ARQUITECTURA MODULAR
// Centro de Atención Psicopedagógica - Programación Web II (I.E.S. Combate de Mbororé)
//
// ----------------------------------------------------------------------------
// MAPA DEL PROYECTO POR FASES ACADÉMICAS (ÍNDICE DE CONSULTA RÁPIDA):
// ----------------------------------------------------------------------------
// [FASE 1] SERVIDOR BASE, RUTAS ESTÁTICAS Y VISTAS EJS
//   - Configuración del motor de plantillas EJS (views/)
//   - Middlewares de estáticos (public/) y parseo de peticiones (express.json, urlencoded)
//   - Escucha del servidor HTTP en el puerto 3000
//
// [FASE 2] AUTENTICACIÓN, SESIONES Y CONTROL DE ACCESO POR ROLES (RBAC)
//   - Configuración de express-session con cookie de 15 min
//   - Definición de ROLES y menús dinámicos: config/app-config.js
//   - Inyección de res.locals global (usuario, rol, menú, paleta)
//   - Guardianes de seguridad: middlewares/auth.js (chequearLogin, chequearRol)
//   - Controlador de autenticación y sesiones: routes/auth.js
//
// [FASE 3] VALIDACIONES CENTRALIZADAS, SUBIDA DE ARCHIVOS Y APARIENCIA
//   - Módulo de validación de entradas: validaciones.js
//   - Configuración de multer y carga de imágenes clínicas: config/multer.js
//   - Configuración editable de colores y estilo institucional: routes/configuracion.js
//
// [FASE 4] BASE DE DATOS RELACIONAL (SQLite), PERSISTENCIA Y CRUD COMPLETO
//   - Conexión nativa con node:sqlite, Foreign Keys y DDL: db.js
//   - [FASE 4 - BÚSQUEDA POR USUARIO]: Consulta en SQLite por username en Login (routes/auth.js)
//   - [FASE 4 - BÚSQUEDA POR FILTRO]: Filtros dinámicos por fecha y paciente (routes/historial.js)
//   - Alta y guardado de evaluaciones clínicas e imágenes: routes/evaluaciones.js
//   - Estadísticas y métricas agregadas (COUNT, GROUP BY): routes/estadisticas.js
//   - Panel de Administración (Usuarios, Catálogos, Pacientes, Evaluaciones): routes/admin.js
//   - API REST en formato JSON para pruebas Thunder Client / Postman: routes/api.js
//
//   -- MAPA DE PUNTOS DE CAPTURA (Express -> Base de Datos SQLite):
//      * [CAPTURA DE CREDENCIALES]:              req.body en Login (routes/auth.js)
//      * [CAPTURA DE EVALUACIÓN CLÍNICA]:        req.body + req.files en Alta (routes/evaluaciones.js)
//      * [CAPTURA DE FILTROS DE HISTORIAL]:      req.query en Historial (routes/historial.js)
//      * [CAPTURA DE NUEVO USUARIO]:             req.body en Usuarios (routes/admin.js)
//      * [CAPTURA DE OPCIÓN CLÍNICA]:            req.body en Catálogos (routes/admin.js)
//      * [CAPTURA DE EDICIÓN DE PACIENTE]:       req.params.id + req.body (routes/admin.js)
//      * [CAPTURA DE EDICIÓN DE EVALUACIÓN]:     req.params.id + req.body (routes/admin.js)
// ============================================================================

// 1. DEPENDENCIAS EXTERNAS
const express = require('express');
const session = require('express-session');
const path = require('path');

// 2. CONFIGURACIÓN Y SERVICIOS
const { ROLES, menuDelRol, leerConfig } = require('./config/app-config');
const { obtenerPacientesYTutores, obtenerOpcionesClinicas } = require('./utils/helpers');

// 3. ENRUTADORES MODULARES
const authRouter = require('./routes/auth');
const evaluacionesRouter = require('./routes/evaluaciones');
const historialRouter = require('./routes/historial');
const estadisticasRouter = require('./routes/estadisticas');
const configuracionRouter = require('./routes/configuracion');
const adminRouter = require('./routes/admin');
const apiRouter = require('./routes/api');

// INICIALIZACIÓN DE LA APLICACIÓN
const app = express();
const puerto = 3000;

// ### [FASE 1] - MOTOR DE PLANTILLAS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ### [FASE 1] - MIDDLEWARES BÁSICOS
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Habilita parseo JSON (Thunder Client y Postman)

// ### [FASE 2] - SESIONES DE USUARIO
app.use(session({
    secret: 'mi_clave_secreta',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 15 * 60 * 1000 } // 15 minutos de inactividad
}));

// ### [FASE 2] - MIDDLEWARE GLOBAL (DATOS COMUNES PARA TODAS LAS VISTAS)
app.use((req, res, next) => {
    const usuario = (req.session && req.session.usuario) || null;
    const rolInfo = usuario ? ROLES[usuario.rol] : null;

    res.locals.config = leerConfig();
    res.locals.usuario = usuario;
    res.locals.rolInfo = rolInfo;
    res.locals.menu = rolInfo ? menuDelRol(rolInfo) : [];
    res.locals.hoy = new Date().toISOString().split('T')[0];
    res.locals.opcionesClinicas = obtenerOpcionesClinicas();

    if (usuario && (usuario.rol === 'comun' || usuario.rol === 'administrador')) {
        const clinica = obtenerPacientesYTutores(usuario);
        res.locals.pacientes = clinica.pacientes;
        res.locals.tutores = clinica.tutores;
    } else {
        res.locals.pacientes = [];
        res.locals.tutores = [];
    }

    next();
});

// ### MONTAJE DE RUTAS MODULARES
app.use('/', authRouter);
app.use('/evaluaciones', evaluacionesRouter);
app.use('/historial', historialRouter);
app.use('/estadisticas', estadisticasRouter);
app.use('/configuracion', configuracionRouter);
app.use('/admin', adminRouter);
app.use('/api', apiRouter);

// ### [FASE 1] - INICIO DEL SERVIDOR HTTP
app.listen(puerto, () => {
    console.log('Servidor escuchando en http://localhost:' + puerto);
});
