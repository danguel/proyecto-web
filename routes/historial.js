// ============================================================================
// routes/historial.js - HISTORIAL CLÍNICO, FILTROS Y DESCARGAS (CSV / PDF)
// Centro de Atención Psicopedagógica - Programación Web II (I.E.S. Combate de Mbororé)
// ============================================================================

const express = require('express');
const router = express.Router();
const db = require('../db');
const PDFDocument = require('pdfkit');
const { chequearLogin, chequearRol } = require('../middlewares/auth');

// ###   [FASE 4] - HISTORIAL DE EVALUACIONES
// Muestra evaluaciones con filtros (desde / hasta / nombre) y permite bajarlas en CSV o PDF.
// Requiere al menos UN filtro, igual que el enunciado.

// ============================================================================
// [FASE 4 - BÚSQUEDA POR FILTRO (HISTORIAL CLÍNICO)]
// ¿Dónde hace la búsqueda que coincide con la base de datos?:
// Esta función construye dinámicamente la cláusula WHERE y los parámetros SQL:
//  - Fecha desde/hasta: compara rangos de fecha (e.fecha >= ? y e.fecha <= ?)
//  - Nombre del paciente: búsqueda parcial insensible a mayúsculas
//    usando LOWER(p.nombre) LIKE LOWER(?) con comodines '%' + nombre + '%'
// ============================================================================
function armarFiltrosHistorial(query) {
    // [CAPTURA DE FILTROS DE HISTORIAL]: Extrae desde, hasta y nombre desde query de URL (req.query)
    const desde = (query.desde || '').trim();
    const hasta = (query.hasta || '').trim();
    const nombre = (query.nombre || '').trim();

    const condiciones = [];
    const parametros = [];

    if (desde !== '') { condiciones.push('e.fecha >= ?'); parametros.push(desde); }
    if (hasta !== '') { condiciones.push('e.fecha <= ?'); parametros.push(hasta); }
    if (nombre !== '') {
        condiciones.push('LOWER(p.nombre) LIKE LOWER(?)');
        parametros.push('%' + nombre + '%');
    }

    return {
        filtros: { desde: desde, hasta: hasta, nombre: nombre },
        sinFiltros: condiciones.length === 0,
        where: condiciones.length > 0 ? (' WHERE ' + condiciones.join(' AND ')) : '',
        parametros: parametros
    };
}

// normalizarFiltrosQuery: si el usuario no especificó filtros, precarga por defecto
// el mes en curso (primer y último día) para mostrar los datos actuales de inmediato.
function normalizarFiltrosQuery(query) {
    let params = { ...query };
    const tieneParametros = Object.keys(query).length > 0;
    if (!tieneParametros) {
        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const ultimoDia = new Date(anio, hoy.getMonth() + 1, 0).getDate();

        params.desde = `${anio}-${mes}-01`;
        params.hasta = `${anio}-${mes}-${String(ultimoDia).padStart(2, '0')}`;
    }
    return armarFiltrosHistorial(params);
}

// Columnas que se muestran en pantalla y se exportan al CSV. Una sola definición.
const COLUMNAS_HISTORIAL = [
    { campo: 'fecha',               titulo: 'Fecha' },
    { campo: 'paciente',            titulo: 'Paciente' },
    { campo: 'profesional',         titulo: 'Profesional' },
    { campo: 'motivo_consulta',     titulo: 'Motivo de consulta' },
    { campo: 'desarrollo_lenguaje', titulo: 'Desarrollo del lenguaje' },
    { campo: 'desarrollo_motor',    titulo: 'Desarrollo motor' },
    { campo: 'alimentacion',        titulo: 'Alimentación' },
    { campo: 'sueno',               titulo: 'Sueño' },
    { campo: 'tiempo_libre',        titulo: 'Tiempo libre' },
    { campo: 'juego',               titulo: 'Juego' },
    { campo: 'observaciones',       titulo: 'Observaciones' }
];

// ============================================================================
// [FASE 4 - CONSULTA Y MUESTRA DEL HISTORIAL CLÍNICO]
// ¿Qué hace?: Cuando el usuario entra a /historial o hace clic en "Aplicar filtros",
// ejecuta un SELECT con JOIN entre 3 tablas (evaluaciones + pacientes + usuarios).
// ============================================================================
function consultarHistorial(filtroArmado) {
    // [FASE 4 - SENTENCIA SQL CON JOINS]: Combina datos de paciente y profesional
    const sql = `
        SELECT
            e.id,
            e.fecha,
            p.nombre AS paciente,
            u.nombre AS profesional,
            e.motivo_consulta,
            e.desarrollo_lenguaje,
            e.desarrollo_motor,
            e.alimentacion,
            e.sueno,
            e.tiempo_libre,
            e.juego,
            e.observaciones
        FROM evaluaciones e
        JOIN pacientes p ON p.id = e.paciente_id
        JOIN usuarios u ON u.id = e.profesional_id
        ${filtroArmado.where}
        ORDER BY e.fecha DESC, p.nombre ASC
    `;

    // [FASE 4 - EJECUCIÓN CON SENTENCIAS PREPARADAS]: .all() retorna el array de filas
    return db.prepare(sql).all(...filtroArmado.parametros);
}

// [FASE 4 - RUTA GET /historial]: Recibe los filtros y envía los datos a la vista
router.get('/', chequearLogin, chequearRol('comun', 'administrador'), (req, res) => {
    let respuestaFinal = null;
    // [FASE 4 - CAPTURA DE DATOS (HISTORIAL URL)]: Captura los parámetros de la URL desde req.query
    const armado = normalizarFiltrosQuery(req.query);

    let mensajeExito = null;
    if (req.query.ok === 'eval-editada') mensajeExito = 'Informe clínico actualizado exitosamente.';
    if (req.query.ok === 'eval-eliminada') mensajeExito = 'Informe clínico eliminado correctamente.';

    // Validación: si se limpiaron todos los campos manualmente, se le indica al usuario
    if (armado.sinFiltros) {
        respuestaFinal = res.render('historial', {
            filtros: armado.filtros,
            resultados: [],
            columnas: COLUMNAS_HISTORIAL,
            error: 'Completá al menos uno de los filtros: desde, hasta o nombre.',
            mensaje: null,
            ok: mensajeExito
        });
    } else {
        let resultados = [];
        let errorConsulta = null;
        try {
            resultados = consultarHistorial(armado);
        } catch (e) {
            errorConsulta = 'No se pudo obtener el historial.';
        }

        respuestaFinal = res.render('historial', {
            filtros: armado.filtros,
            resultados: resultados,
            columnas: COLUMNAS_HISTORIAL,
            error: errorConsulta,
            mensaje: resultados.length === 0 ? 'No hay evaluaciones registradas en el período seleccionado.' : null,
            ok: mensajeExito
        });
    }

    return respuestaFinal;
});

// GET /historial/descargar: mismo filtro, salida CSV (RFC 4180 básico).
router.get('/descargar', chequearLogin, chequearRol('comun', 'administrador'), (req, res) => {
    const armado = normalizarFiltrosQuery(req.query);

    // Función para escapar comillas y separadores.
    const escaparCsv = (valor) => {
        if (valor === null || valor === undefined) return '';
        const texto = String(valor);
        if (texto.includes('"') || texto.includes(',') || texto.includes('\n') || texto.includes('\r')) {
            return '"' + texto.replace(/"/g, '""') + '"';
        }
        return texto;
    };

    const lineas = [COLUMNAS_HISTORIAL.map(c => escaparCsv(c.titulo)).join(',')];

    if (!armado.sinFiltros) {
        let resultados = [];
        try {
            resultados = consultarHistorial(armado);
        } catch (e) {
            resultados = [];
        }
        for (const fila of resultados) {
            lineas.push(COLUMNAS_HISTORIAL.map(c => escaparCsv(fila[c.campo])).join(','));
        }
    }

    const csv = lineas.join('\n') + '\n';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="historial.csv"');
    res.send(csv);
});

// GET /historial/descargar-pdf: genera un documento PDF con pdfkit cumpliendo la consigna del PDF (02.c)
router.get('/descargar-pdf', chequearLogin, chequearRol('comun', 'administrador', 'tutor'), (req, res) => {
    let resultados = [];
    const usuario = req.session.usuario;

    if (usuario.rol === 'tutor') {
        let queryTutor = `
            SELECT e.fecha, p.nombre AS paciente, p.edad_anios, p.edad_meses,
                   u.nombre AS profesional, e.motivo_consulta, e.desarrollo_lenguaje,
                   e.desarrollo_motor, e.alimentacion, e.sueno, e.tiempo_libre,
                   e.juego, e.observaciones
            FROM evaluaciones e
            JOIN pacientes p ON p.id = e.paciente_id
            JOIN usuarios u  ON u.id = e.profesional_id
            WHERE p.tutor_id = ?
        `;
        const paramsTutor = [usuario.id];
        if (req.query.nombre && req.query.nombre.trim() !== '') {
            queryTutor += ' AND LOWER(p.nombre) LIKE LOWER(?)';
            paramsTutor.push('%' + req.query.nombre.trim() + '%');
        }
        queryTutor += ' ORDER BY e.fecha DESC';
        try {
            resultados = db.prepare(queryTutor).all(...paramsTutor);
        } catch (e) {
            resultados = [];
        }
    } else {
        const armado = normalizarFiltrosQuery(req.query);
        if (!armado.sinFiltros) {
            try {
                resultados = consultarHistorial(armado);
            } catch (e) {
                resultados = [];
            }
        }
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="historial-evaluaciones.pdf"');

    doc.pipe(res);

    // Encabezado institucional
    doc.fillColor('#A44A3A').fontSize(16).text('Centro de Atención Psicopedagógica', { align: 'center' });
    doc.fillColor('#666666').fontSize(10).text('I.E.S. Combate de Mbororé - Programación Web II', { align: 'center' });
    doc.moveDown(0.5);
    doc.fillColor('#222222').fontSize(13).text('Reporte de Historial de Evaluaciones Clínicas', { align: 'center' });
    doc.moveDown(0.3);

    const fechaHoy = new Date().toLocaleDateString('es-AR');
    doc.fontSize(9).fillColor('#777777').text(`Generado el: ${fechaHoy} | Solicitado por: ${req.session.usuario.nombre}`, { align: 'center' });
    doc.moveDown();

    // Línea divisoria
    doc.strokeColor('#E0D0CE').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.8);

    if (resultados.length === 0) {
        doc.fillColor('#555555').fontSize(11).text('No se encontraron evaluaciones con los filtros indicados.', { align: 'center' });
    } else {
        doc.fillColor('#444444').fontSize(10).text(`Total de evaluaciones encontradas: ${resultados.length}`);
        doc.moveDown(0.5);

        resultados.forEach((ev, index) => {
            if (doc.y > 670) {
                doc.addPage();
            }

            // Cabecera de la ficha del paciente
            const yInicio = doc.y;
            doc.rect(40, yInicio, 515, 20).fill('#FBF5F4');
            doc.fillColor('#A44A3A').fontSize(10).text(`Evaluación #${index + 1} | Paciente: ${ev.paciente} | Fecha: ${ev.fecha}`, 48, yInicio + 5, { stroke: false });
            doc.moveDown(1);

            doc.fillColor('#333333').fontSize(9);
            doc.text(`Profesional a cargo: ${ev.profesional}`);
            doc.text(`Motivo de consulta: ${ev.motivo_consulta || 'No especificado'}`);
            doc.text(`Desarrollo del lenguaje: ${ev.desarrollo_lenguaje || 'No especificado'}`);
            doc.text(`Desarrollo motor: ${ev.desarrollo_motor || 'No especificado'}`);
            doc.text(`Alimentación: ${ev.alimentacion || 'No especificado'} | Sueño: ${ev.sueno || 'No especificado'}`);
            doc.text(`Tiempo libre: ${ev.tiempo_libre || 'No especificado'} | Juego: ${ev.juego || 'No especificado'}`);
            if (ev.observaciones) {
                doc.text(`Observaciones: ${ev.observaciones}`);
            }

            doc.moveDown(0.8);
            doc.strokeColor('#F0E4E2').lineWidth(0.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
            doc.moveDown(0.6);
        });
    }

    doc.end();
});

module.exports = router;
