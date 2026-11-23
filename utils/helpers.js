// ============================================================================
// utils/helpers.js - FUNCIONES AUXILIARES Y SERVICIOS CLÍNICOS
// Centro de Atención Psicopedagógica - Programación Web II (I.E.S. Combate de Mbororé)
// ============================================================================

const db = require('../db');

// obtenerPacientesYTutores: lista pacientes vinculados (o todos para admin) y tutores registrados.
// Principio de Retorno Único.
function obtenerPacientesYTutores(usuario) {
    let resultado = { pacientes: [], tutores: [] };

    if (usuario) {
        const esAdmin = usuario.rol === 'administrador';
        const queryPacientes = esAdmin
            ? `SELECT p.id, p.nombre, p.fecha_nacimiento, p.edad_anios, p.edad_meses, p.tutor_id, u.nombre AS tutor_nombre
               FROM pacientes p
               LEFT JOIN usuarios u ON u.id = p.tutor_id
               ORDER BY p.nombre ASC`
            : `SELECT p.id, p.nombre, p.fecha_nacimiento, p.edad_anios, p.edad_meses, p.tutor_id, u.nombre AS tutor_nombre
               FROM pacientes p
               LEFT JOIN usuarios u ON u.id = p.tutor_id
               WHERE p.profesional_id = ?
               ORDER BY p.nombre ASC`;

        resultado.pacientes = esAdmin
            ? db.prepare(queryPacientes).all()
            : db.prepare(queryPacientes).all(usuario.id);

        resultado.tutores = db.prepare(`
            SELECT id, nombre, username
            FROM usuarios
            WHERE rol = 'tutor'
            ORDER BY nombre ASC
        `).all();
    }

    return resultado;
}

// obtenerOpcionesClinicas: recupera las opciones paramétricas activas agrupadas por categoría.
// Cumple con el Principio de Retorno Único.
function obtenerOpcionesClinicas() {
    let resultado = { lenguaje: [], alimentacion: [], sueno: [] };
    const filas = db.prepare(`
        SELECT id, categoria, nombre, orden, activo 
        FROM opciones_clinicas 
        WHERE activo = 1 
        ORDER BY orden ASC, id ASC
    `).all();

    for (const fila of filas) {
        if (resultado[fila.categoria]) {
            resultado[fila.categoria].push(fila);
        }
    }

    return resultado;
}

// rangoEtarioFrecuente: de una lista de pacientes, devuelve la franja que MÁS se repite.
function rangoEtarioFrecuente(pacientes) {
    if (pacientes.length === 0) {
        return 'Sin datos';
    }
    const franjas = ['0 a 3', '4 a 6', '7 a 9', '10 a 12', '13 o más'];
    const conteo = contarPorFranja(pacientes);
    let mayor = 0;
    for (let i = 1; i < conteo.length; i++) {
        if (conteo[i] > conteo[mayor]) {
            mayor = i;
        }
    }
    return franjas[mayor];
}

// contarPorFranja: devuelve cuántos pacientes hay en cada uno de los 5 tramos.
// POR QUÉ una función aparte: la usan el panel (para el tramo más frecuente) y la
// pantalla de estadísticas (para el gráfico completo). Misma cuenta, un solo lugar.
function contarPorFranja(pacientes) {
    const conteo = [0, 0, 0, 0, 0];
    for (const paciente of pacientes) {
        const anios = paciente.edad_anios || 0;
        if (anios <= 3)       conteo[0]++;
        else if (anios <= 6)  conteo[1]++;
        else if (anios <= 9)  conteo[2]++;
        else if (anios <= 12) conteo[3]++;
        else                  conteo[4]++;
    }
    return conteo;
}

// filtroPorRol: devuelve el fragmento WHERE y los parámetros según el rol.
// El administrador ve todo el centro; el resto ve solo lo propio.
function filtroPorRol(usuario, columna) {
    if (usuario.rol === 'administrador') {
        return { where: '', parametros: [] };
    }
    return { where: ' WHERE ' + columna + ' = ?', parametros: [usuario.id] };
}

// armarResumen: los tres indicadores del panel, contados desde la base.
function armarResumen(usuario) {
    const filtroEvaluaciones = filtroPorRol(usuario, 'profesional_id');
    const filtroPacientes = filtroPorRol(usuario, 'profesional_id');

    const { totalEvaluaciones } = db.prepare(
        'SELECT COUNT(*) AS totalEvaluaciones FROM evaluaciones' + filtroEvaluaciones.where
    ).get(...filtroEvaluaciones.parametros);

    const { pacientesAtendidos } = db.prepare(
        'SELECT COUNT(*) AS pacientesAtendidos FROM pacientes' + filtroPacientes.where
    ).get(...filtroPacientes.parametros);

    const pacientes = db.prepare(
        'SELECT edad_anios FROM pacientes' + filtroPacientes.where
    ).all(...filtroPacientes.parametros);

    return {
        totalEvaluaciones: totalEvaluaciones,
        pacientesAtendidos: pacientesAtendidos,
        rangoFrecuente: rangoEtarioFrecuente(pacientes)
    };
}

// ultimasEvaluaciones: las 5 más recientes, para el panel.
function ultimasEvaluaciones(usuario) {
    const filtro = filtroPorRol(usuario, 'e.profesional_id');

    return db.prepare(`
        SELECT e.id, e.fecha, p.nombre AS paciente, e.desarrollo_lenguaje
        FROM evaluaciones e
        JOIN pacientes p ON p.id = e.paciente_id
        ${filtro.where}
        ORDER BY e.fecha DESC, e.id DESC
        LIMIT 5
    `).all(...filtro.parametros);
}

// armarEstadisticas: todos los agregados de la pantalla de estadísticas.
function armarEstadisticas(usuario) {
    const filtroEvaluaciones = filtroPorRol(usuario, 'profesional_id');
    const filtroPacientes = filtroPorRol(usuario, 'profesional_id');

    const pacientes = db.prepare(
        'SELECT edad_anios FROM pacientes' + filtroPacientes.where
    ).all(...filtroPacientes.parametros);

    const franjasEtarias = ['0 a 3', '4 a 6', '7 a 9', '10 a 12', '13 o más']
        .map((etiqueta, indice) => ({ etiqueta: etiqueta, total: contarPorFranja(pacientes)[indice] }));

    const porLenguaje = db.prepare(`
        SELECT COALESCE(NULLIF(desarrollo_lenguaje, ''), 'Sin registrar') AS etiqueta, COUNT(*) AS total
        FROM evaluaciones
        ${filtroEvaluaciones.where}
        GROUP BY etiqueta
        ORDER BY total DESC, etiqueta ASC
    `).all(...filtroEvaluaciones.parametros);

    // Últimos 6 meses con actividad. substr(fecha,1,7) devuelve 'AAAA-MM'.
    const porMes = db.prepare(`
        SELECT substr(fecha, 1, 7) AS etiqueta, COUNT(*) AS total
        FROM evaluaciones
        ${filtroEvaluaciones.where}
        GROUP BY etiqueta
        ORDER BY etiqueta DESC
        LIMIT 6
    `).all(...filtroEvaluaciones.parametros).reverse();

    // Solo tiene sentido para el administrador: el profesional vería una sola barra.
    const porProfesional = usuario.rol === 'administrador'
        ? db.prepare(`
            SELECT u.nombre AS etiqueta, COUNT(e.id) AS total
            FROM usuarios u
            LEFT JOIN evaluaciones e ON e.profesional_id = u.id
            WHERE u.rol IN ('comun', 'administrador')
            GROUP BY u.id
            ORDER BY total DESC, u.nombre ASC
        `).all()
        : [];

    const totalEvaluaciones = porLenguaje.reduce((suma, fila) => suma + fila.total, 0);

    return {
        totalEvaluaciones: totalEvaluaciones,
        totalPacientes: pacientes.length,
        franjasEtarias: franjasEtarias,
        porLenguaje: porLenguaje,
        porMes: porMes,
        porProfesional: porProfesional
    };
}

// esUltimoAdministrador: ¿esta cuenta es el único administrador que queda?
function esUltimoAdministrador(id) {
    const fila = db.prepare('SELECT rol FROM usuarios WHERE id = ?').get(id);
    if (!fila || fila.rol !== 'administrador') {
        return false;
    }
    const { total } = db.prepare("SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'administrador'").get();
    return total <= 1;
}

// calcularEdad: a partir de dos fechas ('AAAA-MM-DD') devuelve la edad en años y meses.
// POR QUÉ se parten las fechas a mano y NO se usa new Date(): una fecha como
// '2019-06-10' puede "caer" un día antes según la zona horaria y cambiar el resultado.
function calcularEdad(fechaNacimiento, fechaReferencia) {
    const [anioNac, mesNac, diaNac] = fechaNacimiento.split('-').map(Number);
    const [anioRef, mesRef, diaRef] = fechaReferencia.split('-').map(Number);

    let anios = anioRef - anioNac;
    let meses = mesRef - mesNac;

    if (diaRef < diaNac) {
        meses = meses - 1;
    }
    if (meses < 0) {
        anios = anios - 1;
        meses = meses + 12;
    }

    return { anios: anios, meses: meses };
}

module.exports = {
    obtenerPacientesYTutores,
    obtenerOpcionesClinicas,
    rangoEtarioFrecuente,
    contarPorFranja,
    filtroPorRol,
    armarResumen,
    ultimasEvaluaciones,
    armarEstadisticas,
    esUltimoAdministrador,
    calcularEdad
};
