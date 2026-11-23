// ============================================================================
// config/app-config.js - CONFIGURACIONES GLOBALES Y PARÁMETROS DEL SISTEMA
// Centro de Atención Psicopedagógica - Programación Web II (I.E.S. Combate de Mbororé)
// ============================================================================

const db = require('../db');

// ###   [FASE 2] - ROLES Y MENÚ
// El menú se define UNA sola vez, como dato, y cada rol dice a qué claves accede.
// POR QUÉ así y no escribiendo los <a> a mano en cada vista: cuando el menú estaba
// duplicado en el HTML, un ítem quedó sin declarar en ningún rol y la pantalla de
// Historial existía pero no se podía alcanzar. Con una sola fuente de verdad,
// agregar una pantalla es agregar una línea acá.
const ROLES = {
    administrador: {
        etiqueta: 'Administrador',
        secciones: ['Inicio', 'Nueva Evaluación', 'Historial', 'Estadísticas', 'Pacientes', 'Usuarios', 'Catálogos', 'Configuración']
    },
    comun: {
        etiqueta: 'Profesional',
        secciones: ['Inicio', 'Nueva Evaluación', 'Historial', 'Estadísticas', 'Configuración']
    },
    tutor: {
        etiqueta: 'Tutor',
        secciones: ['Inicio', 'Estadísticas', 'Configuración']
    }
};

// Cada ítem del sistema, con su clave, su texto visible y su ruta.
// "porGrupo" solo sirve para separar visualmente con un rótulo en la barra lateral.
const ITEMS_MENU = [
    { clave: 'Inicio',           texto: 'Inicio',            href: '/dashboard' },
    { clave: 'Nueva Evaluación', texto: 'Nueva evaluación',  href: '/evaluaciones/nueva' },
    { clave: 'Historial',        texto: 'Historial',         href: '/historial' },
    { clave: 'Estadísticas',     texto: 'Estadísticas',      href: '/estadisticas' },
    { clave: 'Pacientes',        texto: 'Pacientes',         href: '/admin/pacientes', porGrupo: 'Administración' },
    { clave: 'Usuarios',         texto: 'Usuarios',          href: '/admin/usuarios',  porGrupo: 'Administración' },
    { clave: 'Catálogos',        texto: 'Catálogos clínicos',href: '/admin/catalogos', porGrupo: 'Administración' },
    { clave: 'Configuración',    texto: 'Configuración',     href: '/configuracion',   porGrupo: 'Cuenta' }
];

// Devuelve solo los ítems que el rol tiene habilitados, en el orden de ITEMS_MENU.
function menuDelRol(rolInfo) {
    return ITEMS_MENU.filter(item => rolInfo.secciones.includes(item.clave));
}

// ###   [FASE 3] - APARIENCIA (CONFIGURACIÓN EDITABLE)
// El Anexo I pide que el administrador pueda cambiar botoneras, menúes y
// combinación de colores. Para que eso sea posible, los colores NO pueden estar
// escritos a mano en 28 lugares del CSS: viven en variables CSS y acá solo se
// elige cuál preset usar.
const ACENTOS = {
    terracota: '#B65335',
    salvia:    '#537162',
    bosque:    '#4E6B5D',
    grafito:   '#44403C',
    vino:      '#8C4351'
};

// leerConfig: trae los valores guardados y los VALIDA contra los dominios permitidos.
// POR QUÉ valida: si alguien edita la base a mano y deja un color inexistente, la
// vista no se rompe; cae al valor por defecto.
function leerConfig() {
    const filas = db.prepare('SELECT clave, valor FROM configuracion').all();
    const guardado = {};
    for (const fila of filas) {
        guardado[fila.clave] = fila.valor;
    }

    const acento = ACENTOS[guardado.acento] ? guardado.acento : 'terracota';
    const botones = ['redondeado', 'recto'].includes(guardado.botones) ? guardado.botones : 'redondeado';
    const menu = ['comodo', 'compacto'].includes(guardado.menu) ? guardado.menu : 'comodo';

    return { acento: acento, acentoHex: ACENTOS[acento], botones: botones, menu: menu };
}

// guardarConfig: inserta o actualiza una clave. "ON CONFLICT" es el upsert de SQLite.
function guardarConfig(clave, valor) {
    db.prepare(`
        INSERT INTO configuracion (clave, valor) VALUES (?, ?)
        ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor
    `).run(clave, valor);
}

module.exports = {
    ROLES,
    ITEMS_MENU,
    menuDelRol,
    ACENTOS,
    leerConfig,
    guardarConfig
};
