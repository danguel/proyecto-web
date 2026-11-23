// ============================================================================
// db.js - BASE DE DATOS RELACIONAL (SQLite) - FASE 4
// Centro de Atención Psicopedagógica - Programación Web II (I.E.S. Combate de Mbororé)
//
// ----------------------------------------------------------------------------
// ESTRUCTURA Y MAPA DE LA BASE DE DATOS:
// ----------------------------------------------------------------------------
// 1. CONEXIÓN Y MOTOR: node:sqlite nativo -> Archivo: centro.db (Líneas 10-22)
// 2. INTEGRIDAD REFERENCIAL: PRAGMA foreign_keys = ON (Línea 26)
// 3. TABLAS DEFINIDAS (DDL):
//    - usuarios:          Cuentas y roles (admin, profesional, tutor) (Línea ~33)
//    - pacientes:         Niños/as atendidos con FK a profesional y tutor (Línea ~45)
//    - evaluaciones:      Informes psicopedagógicos con FK a paciente y profesional (Línea ~60)
//    - imagenes:          Archivos adjuntos con FK a evaluación (Línea ~80)
//    - configuracion:     Opciones de apariencia del sistema (Línea ~90)
//    - opciones_clinicas: Catálogo administrable de opciones de formulario (Línea ~100)
// 4. DATOS INICIALES (SEEDING):
//    - cargarDatosDePrueba(): Inserta usuarios y los 10 casos clínicos reales (Línea ~115)
// ============================================================================

// ###   BLOQUE 1  -  IMPORTACIONES
// node:sqlite: SQLite que viene DENTRO de Node. path: arma la ruta del archivo .db.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

// ###   BLOQUE 2  -  ABRIR (O CREAR) LA BASE DE DATOS
// Si el archivo no existe, SQLite lo crea. __dirname: la base queda al lado de este archivo.
const rutaArchivo = path.join(__dirname, 'centro.db');
const db = new DatabaseSync(rutaArchivo);

// ###   BLOQUE 3  -  ACTIVAR LAS CLAVES FORÁNEAS (FOREIGN KEYS)
// SQLite las trae apagadas: sin esto no respeta las relaciones entre tablas.
db.exec('PRAGMA foreign_keys = ON');

// ###   BLOQUE 4  -  CREAR LAS TABLAS (si todavía no existen)
// "IF NOT EXISTS": si la tabla ya está, no hace nada y no borra datos.

// usuarios: quiénes pueden iniciar sesión.
db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,  -- número único de cada usuario (lo genera la base)
        username TEXT    NOT NULL UNIQUE,            -- nombre de usuario; UNIQUE = no se repite
        password TEXT    NOT NULL,                   -- contraseña (de prueba; en producción iría encriptada)
        nombre   TEXT    NOT NULL,                   -- nombre completo de la persona
        rol      TEXT    NOT NULL                    -- 'administrador', 'comun', 'tutor'
    )
`);

// pacientes: cada paciente PERTENECE a un profesional (1 a N) y opcionalmente a un tutor (1 a N).
db.exec(`
    CREATE TABLE IF NOT EXISTS pacientes (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre           TEXT    NOT NULL,           -- nombre completo del paciente
        fecha_nacimiento TEXT,                       -- fecha de nacimiento ('AAAA-MM-DD'); de acá SALE la edad
        edad_anios       INTEGER,                    -- edad cronológica: años (se calcula al guardar)
        edad_meses       INTEGER,                    -- edad cronológica: meses (se calcula al guardar)
        profesional_id   INTEGER NOT NULL,           -- a qué profesional pertenece (FK -> usuarios.id)
        tutor_id         INTEGER,                    -- a qué tutor/familia pertenece (FK -> usuarios.id)
        FOREIGN KEY (profesional_id) REFERENCES usuarios(id),
        FOREIGN KEY (tutor_id)       REFERENCES usuarios(id)
    )
`);

// evaluaciones: un estudio hecho a un paciente. Guarda todos los campos del enunciado.
db.exec(`
    CREATE TABLE IF NOT EXISTS evaluaciones (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente_id         INTEGER NOT NULL,        -- a qué paciente pertenece (FK -> pacientes.id)
        profesional_id      INTEGER NOT NULL,        -- qué profesional la cargó (FK -> usuarios.id)
        fecha               TEXT    NOT NULL,        -- fecha de la evaluación (formato 'AAAA-MM-DD')
        motivo_consulta     TEXT,                    -- por qué vino el paciente
        desarrollo_lenguaje TEXT,                    -- Bajo / Por encima del promedio / Óptimo / Avanzado
        desarrollo_motor    TEXT,
        alimentacion        TEXT,                    -- A considerar / Aceptable
        sueno               TEXT,                    -- Escaso / Interrumpido / Aceptable
        tiempo_libre        TEXT,
        juego               TEXT,
        observaciones       TEXT,
        FOREIGN KEY (paciente_id)    REFERENCES pacientes(id),
        FOREIGN KEY (profesional_id) REFERENCES usuarios(id)
    )
`);

// imagenes: las imágenes/producciones que se suben junto a una evaluación (1 evaluación -> N imágenes).
db.exec(`
    CREATE TABLE IF NOT EXISTS imagenes (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        evaluacion_id INTEGER NOT NULL,              -- a qué evaluación pertenece (FK -> evaluaciones.id)
        ruta          TEXT    NOT NULL,              -- dónde quedó guardado el archivo
        FOREIGN KEY (evaluacion_id) REFERENCES evaluaciones(id)
    )
`);

// configuracion: preferencias editables desde la pantalla de configuración.
db.exec(`
    CREATE TABLE IF NOT EXISTS configuracion (
        clave TEXT PRIMARY KEY,                      -- nombre de la opción ('acento', 'botones', ...)
        valor TEXT NOT NULL                          -- valor guardado como texto
    )
`);

// opciones_clinicas: tabla paramétrica/maestra con las opciones de los formularios clínicos.
// Permite que el Administrador modifique o agregue categorías sin tocar código.
db.exec(`
    CREATE TABLE IF NOT EXISTS opciones_clinicas (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        categoria TEXT    NOT NULL,                  -- 'lenguaje', 'alimentacion', 'sueno'
        nombre    TEXT    NOT NULL,                  -- texto visible de la opción
        orden     INTEGER DEFAULT 0,                 -- posición en los desplegables
        activo    INTEGER DEFAULT 1                  -- 1 = activo, 0 = deshabilitado
    )
`);

// ###   BLOQUE 5  -  CARGAR DATOS DE PRUEBA (solo la primera vez)
// Si la base está vacía no habría con quién iniciar sesión.
// Cumple con el Principio de Retorno Único (variable de estado).
function cargarDatosDePrueba() {
    let seCargo = false;
    const { total } = db.prepare('SELECT COUNT(*) AS total FROM usuarios').get();

    if (total === 0) {
        // prepare(...).run(...) ejecuta un INSERT; cada "?" se completa con un valor del run.
        const insertarUsuario = db.prepare(
            'INSERT INTO usuarios (username, password, nombre, rol) VALUES (?, ?, ?, ?)'
        );

        // Usuarios del sistema: Administrador, Profesionales y Tutores
        insertarUsuario.run('admin', '123', 'Administrador', 'administrador');
        insertarUsuario.run('ana', '123', 'Lic. Ana Fernández', 'comun');
        insertarUsuario.run('carlos', '123', 'Lic. Carlos Benítez', 'comun');
        insertarUsuario.run('luca', '123', 'Luca Pérez', 'tutor');
        insertarUsuario.run('marina', '123', 'Marina Albornoz', 'tutor');

        // Sentencia para registrar pacientes
        const insertarPaciente = db.prepare(
            'INSERT INTO pacientes (nombre, fecha_nacimiento, edad_anios, edad_meses, profesional_id, tutor_id) VALUES (?, ?, ?, ?, ?, ?)'
        );

        // Sentencia para registrar evaluaciones clínicas
        const insertarEvaluacion = db.prepare(`
            INSERT INTO evaluaciones
                (paciente_id, profesional_id, fecha, motivo_consulta, desarrollo_lenguaje, desarrollo_motor, alimentacion, sueno, tiempo_libre, juego, observaciones)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // ====================================================================
        // 10 CASOS CLÍNICOS REALES DE PSICOPEDAGOGÍA
        // ====================================================================

        // Caso 1: Dificultades de lectoescritura / sospecha dislexia (Hijo de Luca Pérez - Tutor)
        insertarPaciente.run('Mateo Pérez', '2019-02-14', 7, 6, 2, 4);
        insertarEvaluacion.run(
            1, 2, '2026-08-15',
            'Derivado por la escuela primaria por dificultades en la adquisición de la lectoescritura, silabeo persistente y confusión de grafemas b/d.',
            'Bajo',
            'Prensión palmar en transición a trípode; fatiga muscular rápida en grafomotricidad y dibujo libre.',
            'Aceptable',
            'Interrumpido',
            'Videojuegos en tablet y videos en internet; reducida actividad recreativa al aire libre.',
            'Juego reglado incipiente con baja tolerancia a la frustración; prefiere encastre y construcciones guiadas.',
            'Se sugiere plan de estimulación fonológica y ejercitación grafomotora con mediación lúdica, junto a pautas de descanso.'
        );

        // Caso 2: Retraso fonológico simple en nivel inicial (Hija de Marina Albornoz - Tutora)
        insertarPaciente.run('Martina Gómez', '2020-11-20', 5, 9, 2, 5);
        insertarEvaluacion.run(
            2, 2, '2026-08-22',
            'Inquietud docente por lenguaje oral poco inteligible, omisión de fonemas finales y dificultades de integración en sala de 5.',
            'Bajo',
            'Excelente motricidad gruesa, trepa y salta con agilidad. Motricidad fina en pautas esperables con buen uso de tijera.',
            'Aceptable',
            'Aceptable',
            'Juegos de plaza, bicicleta con rueditas y juego interactivo con primos de edad similar.',
            'Juego simbólico muy enriquecido (juega a la médica y a la docente); compensa dificultades fonológicas con mímica expresiva.',
            'Se indica interconsulta fonoaudiológica y seguimiento psicopedagógico en conciencia fonológica y funciones ejecutivas.'
        );

        // Caso 3: Déficit atencional e inquietud motriz (Lic. Carlos)
        insertarPaciente.run('Joaquín Benítez', '2017-05-12', 9, 3, 3, null);
        insertarEvaluacion.run(
            3, 3, '2026-09-02',
            'Sospecha de déficit de atención e impulsividad; abandono de tareas a mitad de camino, olvido de útiles y errores por descuido frecuente.',
            'Óptimo',
            'Inquietud motriz observable en sesión: balanceo constante en la silla y manipulación continua de objetos cercanos.',
            'A considerar',
            'Escaso',
            'Fútbol recreativo 2 veces por semana y uso prolongado de pantallas antes del horario de dormir.',
            'Juegos dinámicos y de resolución rápida; abandona juegos de mesa prolongados de estrategia o memoria.',
            'Pautas al equipo escolar para fraccionar consignas de trabajo y conceder pausas activas breves en el aula.'
        );

        // Caso 4: Discalculia / razonamiento lógico-matemático (Lic. Ana)
        insertarPaciente.run('Sofía Domínguez', '2018-03-30', 8, 5, 2, null);
        insertarEvaluacion.run(
            4, 2, '2026-09-05',
            'Dificultades en el cálculo matemático escolar; confusión de signos (+, -), dificultad para encolumnar cuentas y comprender valor posicional.',
            'Por encima del promedio',
            'Adecuada coordinación visomotora y prensión correcta de los útiles de escritura.',
            'Aceptable',
            'Aceptable',
            'Taller de plástica y cerámica artística; disfruta de actividades plásticas y modelado en arcilla.',
            'Juegos de rol y armado de escenarios narrativos; bloqueo ante actividades lúdicas que requieran conteo numérico o dados.',
            'Se sugiere incorporación de material concreto manipulativo (ábaco y regletas) para afianzar el concepto de número.'
        );

        // Caso 5: Evaluación evolutiva / control de desarrollo (Segundo hijo de Luca Pérez - Tutor)
        insertarPaciente.run('Lucas Ramírez', '2021-04-18', 5, 4, 3, 4);
        insertarEvaluacion.run(
            5, 3, '2026-09-10',
            'Evaluación integral del desarrollo para ingreso a nivel inicial; control evolutivo general solicitado por la familia.',
            'Avanzado para la edad',
            'Control postural armónico, equilibrio dinámico coordinado y lateralidad homogénea diestra.',
            'Aceptable',
            'Aceptable',
            'Lectura de cuentos ilustrados compartida con la familia y armado de rompecabezas de 48 piezas.',
            'Juego cooperativo espontáneo con pares; asume diferentes roles y despliega empatía vincular.',
            'Desarrollo madurativo acorde y superior a su franja etaria. Sin alertas psicopedagógicas al momento.'
        );

        // Caso 6: Bloqueo emocional y ansiedad escolar (Lic. Carlos)
        insertarPaciente.run('Camila Herrera', '2016-08-04', 10, 1, 3, null);
        insertarEvaluacion.run(
            6, 3, '2026-09-14',
            'Bloqueo emocional ante instancias evaluativas en la escuela; llanto previo a exámenes y quejas somáticas recurrentes los lunes.',
            'Óptimo',
            'Tensión muscular postural en los primeros minutos de sesión, distendiéndose durante el diálogo.',
            'A considerar',
            'Interrumpido',
            'Escucha de música, escritura de microrrelatos y práctica recreativa de danza contemporánea.',
            'Juegos cooperativos de mesa sin descarte ni penalizaciones severas; gran nivel asociativo y reflexivo.',
            'Trabajo articulado con psicología clínica infanto-juvenil para el manejo de la ansiedad de rendimiento.'
        );

        // Caso 7: Dispraxia motriz y esquema corporal (Lic. Ana)
        insertarPaciente.run('Bautista Morales', '2022-07-15', 4, 2, 2, null);
        insertarEvaluacion.run(
            7, 2, '2026-09-20',
            'Derivación pedagógica por torpeza motora general, caídas reiteradas y trazo débil en la representación de la figura humana.',
            'Por encima del promedio',
            'Dispraxia motriz leve; prensión débil y lateralidad aún en proceso de definición activa.',
            'Aceptable',
            'Aceptable',
            'Actividades sensoriales con masas y plastilinas; visionado de series de animación infantil.',
            'Invención de historias y tramas imaginarias con juguetes; rehúye de actividades deportivas de velocidad.',
            'Estimulación psicomotriz focalizada en esquema corporal, equilibrio dinámico y disociación de muñeca y dedos.'
        );

        // Caso 8: Altas capacidades intelectuales y enriquecimiento (Lic. Carlos)
        insertarPaciente.run('Valentina Ríos', '2015-10-10', 10, 11, 3, null);
        insertarEvaluacion.run(
            8, 3, '2026-09-28',
            'Desmotivación en el aula escolar y aburrimiento reiterado; potencial indicio de altas capacidades intelectuales.',
            'Avanzado para la edad',
            'Desarrollo motriz armónico y preciso; práctica sistemática de natación dos veces por semana.',
            'Aceptable',
            'Aceptable',
            'Robótica inicial, proyectos de programación por bloques y lectura autónoma de novelas infantiles.',
            'Ajedrez, acertijos lógicos y rompecabezas tridimensionales de alta complejidad cognitiva.',
            'Elaboración de informe de orientación al gabinete escolar con sugerencias de enriquecimiento curricular.'
        );

        // Caso 9: Hipotonía y fatiga en grafomotricidad (Lic. Ana)
        insertarPaciente.run('Emiliano Castro', '2019-12-05', 6, 9, 2, null);
        insertarEvaluacion.run(
            9, 2, '2026-10-05',
            'Dificultad en la prensión del lápiz, caligrafía poco legible y resistencia marcada a la copia del pizarrón escolar.',
            'Óptimo',
            'Hipotonía leve en miembros superiores; agarre palmar rígido y postura encorvada en la mesa de trabajo.',
            'Aceptable',
            'Escaso',
            'Uso de dispositivos táctiles por más de tres horas al día; baja actividad física espontánea al aire libre.',
            'Juegos mecánicos y de encastre; resistencia ante propuestas lúdicas con reglas cambiantes.',
            'Pautas de ergonomía postural al hogar, adaptador de lápiz triangular y disminución paulatina de pantallas.'
        );

        // Caso 10: Comprensión lectora e inferencia de significados (Lic. Ana)
        insertarPaciente.run('Zoe Navarro', '2018-06-25', 8, 3, 2, null);
        insertarEvaluacion.run(
            10, 2, '2026-10-12',
            'Dificultades en la comprensión lectora; memorización mecánica de palabras sin extracción de ideas centrales.',
            'Por encima del promedio',
            'Desarrollo psicomotor acorde a su etapa evolutiva, sin alteraciones en motricidad fina ni gruesa.',
            'Aceptable',
            'Aceptable',
            'Patinaje artístico recreativo, juegos familiares de cartas y escucha guiada de audiolibros infantiles.',
            'Teatro de títeres y dramatizaciones expresivas compartidas con compañeros de grado escolar.',
            'Estimulación de estrategias metacognitivas: formulación de hipótesis lectoras, relectura guiada y síntesis gráfica.'
        );

        seCargo = true;
    }

    return seCargo;
}

// ###   BLOQUE 5b - CARGAR LA CONFIGURACIÓN INICIAL (solo las claves que falten)
// Cumple con el Principio de Retorno Único (variable de estado).
function cargarConfiguracionInicial() {
    let configurado = true;
    const insertar = db.prepare('INSERT OR IGNORE INTO configuracion (clave, valor) VALUES (?, ?)');
    insertar.run('acento', 'terracota');
    insertar.run('botones', 'redondeado');
    insertar.run('menu', 'comodo');
    return configurado;
}

// ###   BLOQUE 5c - CARGAR LAS OPCIONES CLÍNICAS INICIALES (si la tabla está vacía)
// Cumple con el Principio de Retorno Único (variable de estado).
function cargarOpcionesClinicasIniciales() {
    let seCargo = false;
    const { total } = db.prepare('SELECT COUNT(*) AS total FROM opciones_clinicas').get();

    if (total === 0) {
        const insertar = db.prepare(
            'INSERT INTO opciones_clinicas (categoria, nombre, orden, activo) VALUES (?, ?, ?, 1)'
        );

        // Lenguaje (consigna oficial punto 01.e)
        insertar.run('lenguaje', 'Bajo', 1);
        insertar.run('lenguaje', 'Por encima del promedio', 2);
        insertar.run('lenguaje', 'Óptimo', 3);
        insertar.run('lenguaje', 'Avanzado para la edad', 4);

        // Alimentación (consigna oficial punto 01.g)
        insertar.run('alimentacion', 'A considerar', 1);
        insertar.run('alimentacion', 'Aceptable', 2);

        // Sueño (consigna oficial punto 01.h)
        insertar.run('sueno', 'Escaso', 1);
        insertar.run('sueno', 'Interrumpido', 2);
        insertar.run('sueno', 'Aceptable', 3);

        seCargo = true;
    }

    return seCargo;
}

// Ejecutamos la carga inicial
cargarDatosDePrueba();
cargarConfiguracionInicial();
cargarOpcionesClinicasIniciales();

// ###   BLOQUE 6  -  EXPORTAR LA CONEXIÓN
module.exports = db;
