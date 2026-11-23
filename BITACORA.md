# BITÁCORA DEL PROYECTO — PROYECTOWEB

**Proyecto:** Sistema de gestión de datos para un Centro de Atención Psicopedagógica
**Materia:** Programación Web II — I.E.S. Combate de Mbororé
**Ruta del proyecto:** `C:\Users\dbaez\Downloads\PROYECTOWEB`
**Responsable:** Daniel Baez
**Bitácora creada:** 25/10/2026
**Última verificación del código contra esta bitácora:** 26/10/2026

---

## 0. Cómo se generó esta bitácora (leer primero)

Este documento se armó con dos fuentes:

1. **La memoria del proyecto en Engram** (`project: "dbaez"`), que guarda 23 observaciones técnicas y los resúmenes de sesión del 13/10, 14/10, 16/10 y 23/10.
2. **Verificación directa del código en disco el 25/10/2026**: lectura completa de `app.js` (736 líneas) y `db.js` (145 líneas), inventario de archivos, `node --check` en ambos archivos, cruce automático de clases CSS usadas por las vistas contra las definidas en `styles.css`, y lectura de la base `centro.db` en modo solo lectura.

**Advertencia importante:** los cambios de código posteriores a la auditoría de diseño del 23/10 a las 16:11 (reescritura de vistas con parciales, tokens CSS, pantallas nuevas) **no quedaron registrados en Engram**. Se reconstruyeron desde los archivos y sus fechas de modificación. Si algo de esa reconstrucción no coincide con lo que se decidió en su momento, el código en disco es la fuente de verdad y esta sección debe corregirse.

---

## 1. Entregas de la cátedra y estado

| Fase | Tema | Entrega | Tipo | Estado al 25/10/2026 |
|------|------|---------|------|----------------------|
| Fase 1 | Login: sesiones y roles | 30/09/2026 | Cualitativa | **Implementada** y repasada bajo las reglas del proyecto |
| Fase 2 | Formularios de carga | 14/10/2026 | **Cuantitativa (nota)** | **Implementada**: registro de evaluaciones, historial, estadísticas, configuración y control de usuarios |
| Fase 3 | Interacción y navegación (menú/tablero a cada opción) | 28/10/2026 | Cualitativa | **Implementada de hecho** (menú lateral generado por rol, panel con accesos rápidos). Falta ensayo y revisión final |
| Fase 4 | Integración front-end / back-end | 03/11/2026 | **Cuantitativa (nota)** | Técnicamente **ya integrada** (EJS + rutas + SQLite). Falta cierre formal y defensa |

Regla de la cátedra: en las entregas cuantitativas hay nota numérica y si es menor a 6 se recupera en la clase posterior inmediata; las cualitativas son devoluciones del docente con puntos a optimizar.

---

## 2. Qué pide el enunciado (resumen operativo)

**Título:** "Propuesta desarrollo de un sistema de gestión de datos: Integración front-end y back-end".

**Tres puntos de interés del flujo de información:**

1. **Registro de evaluaciones.** Campos: nombre completo del paciente; edad cronológica (años + meses); fecha de evaluación; motivo inicial de consulta; Desarrollo del Lenguaje (opciones: Bajo / Por encima del promedio / Óptimo / Avanzado para la edad); Desarrollo motor (texto libre); Alimentación (A considerar / Aceptable); Sueño (Escaso / Interrumpido / Aceptable); Tiempo libre (texto); Juego (texto); Otras observaciones (texto + **subir imágenes** de producciones del paciente).
2. **Historial por paciente.** Búsqueda por período de fechas **y** por nombre; descarga de PDF(s) del paciente; al menos un campo obligatorio.
3. **Ventana estadística.** Cantidad de evaluaciones; porcentajes de incidencia por Desarrollo del Lenguaje; rango etario de consultas con mayor incidencia; otros datos opcionales.

**Anexo I — Roles.**
- **Común (Profesional):** registro de evaluaciones, búsqueda y gestión de historial, cambio individual de contraseña, búsqueda en panel estadístico.
- **Administrador:** puede modificar cualquier información del sistema y el diseño (botoneras, menúes, combinación de colores, etc.).
- **Tutor** (agregado por decisión del proyecto): solo lectura de los informes de su paciente.

**Anexo II — Calidad.**
- No debe haber botones sin acción ni casillas ocultas/deshabilitadas sin propósito.
- Diseño visual uniforme, buen uso de CSS.
- Buenas técnicas de programación: polimorfismo, encapsulamiento, modularidad.

---

## 3. Stack, estructura y cómo correrlo

**Stack:** Node.js v26.3.0 · Express 4.21 · EJS 3.1 · express-session 1.18 · multer 2.4 · SQLite nativo (`node:sqlite`, `DatabaseSync`). Sin ORM, sin bundler, sin framework de CSS. Arquitectura MVC básica.

**Dependencias:** solo cuatro (`ejs`, `express`, `express-session`, `multer`). **No hay `pdfkit` ni ninguna librería de PDF**, y eso condiciona una decisión de diseño (ver §10.6).

**Inventario de archivos (25/10/2026):**

```
PROYECTOWEB/
├── app.js                      736 líneas  Servidor, middlewares y rutas (17 BLOQUES)
├── db.js                       145 líneas  Conexión SQLite, esquema y datos de prueba
├── centro.db                    36 KB      Base SQLite (se crea sola si no existe)
├── package.json / package-lock.json
├── Proyecto final - Programación Web II.pdf  Enunciado original
├── _consigna.txt               207 líneas  Texto del PDF extraído (generado con pypdf)
├── .practicos.json                         Estado del lector de PDF (no es del proyecto)
├── otro-backup-fase1/                      Backup congelado del estado 29/09
├── views/
│   ├── parciales/_arriba.ejs   101 líneas  <head> + barra lateral + apertura del main
│   ├── parciales/_abajo.ejs      9 líneas  Cierre del main, body y html
│   ├── _menu.ejs                25 líneas  Menú viejo, HOY HUÉRFANO (ver §13.7)
│   ├── login.ejs                46 líneas
│   ├── dashboard.ejs            84 líneas
│   ├── evaluaciones-nueva.ejs  111 líneas
│   ├── historial.ejs           102 líneas
│   ├── estadisticas.ejs        120 líneas
│   ├── configuracion.ejs       119 líneas
│   ├── admin-usuarios.ejs      127 líneas
│   └── error.ejs                19 líneas
└── public/
    ├── css/styles.css         1221 líneas  19 custom properties, 6 @media
    ├── js/evaluaciones-nueva.js 54 líneas  Cálculo de edad en vivo
    └── uploads/                            Imágenes subidas (vacía al 25/10)
```

**Cómo correrlo:**

```
cd C:\Users\dbaez\Downloads\PROYECTOWEB
npm install          # solo la primera vez
node app.js          # o: npm start
# abrir http://localhost:3000
```

`npm run dev` usa `node --watch app.js` (reinicio automático al guardar).

**Cómo resetear la base a los datos de prueba:** borrar `centro.db` y volver a levantar el servidor. `db.js` la recrea y siembra solo si la tabla `usuarios` está vacía.

**Comandos de verificación rápida:**

```
node --check app.js
node --check db.js
```

---

## 4. Roles y permisos (estado real del código)

Tres roles. Definidos en `ROLES` (app.js, BLOQUE 5) con etiqueta visible y lista de secciones.

| Rol interno | Etiqueta UI | Secciones habilitadas |
|-------------|-------------|------------------------|
| `administrador` | Administrador | Inicio, Nueva Evaluación, Historial, Estadísticas, Usuarios, Configuración |
| `comun` | Profesional | Inicio, Nueva Evaluación, Historial, Estadísticas, Configuración |
| `tutor` | Tutor | Inicio, Estadísticas, Configuración |

**Barreras reales (no estéticas):**

- `chequearLogin` (BLOQUE 8): sin sesión redirige a `/login`.
- `chequearRol(...roles)` (BLOQUE 8): si el rol no está en la lista devuelve **403** renderizando `error.ejs`.
- Ocultar un botón del menú **no** es seguridad: la barrera es el middleware. Esto ya se explicó en la defensa de la Fase 1 y sigue siendo cierto.

**Matriz real por ruta:**

| Ruta | Quién pasa |
|------|-----------|
| `/`, `/login`, `POST /login`, `/logout` | Público |
| `/dashboard` | Cualquier sesión |
| `/evaluaciones/nueva` (GET y POST) | `comun`, `administrador` |
| `/historial`, `/historial/descargar` | `comun`, `administrador` |
| `/estadisticas` | Cualquier sesión (los datos se filtran por rol) |
| `/configuracion`, `POST /configuracion/password` | Cualquier sesión (solo cambia la propia) |
| `POST /configuracion/apariencia` | Solo `administrador` |
| `/admin/usuarios` y sus POST | Solo `administrador` |

**Aislamiento de datos:** cada profesional ve **solo sus pacientes y evaluaciones**; el administrador ve todo el centro. Implementado con la función `filtroPorRol(usuario, columna)` (BLOQUE 16), que devuelve `WHERE columna = ?` con el id del usuario, o vacío si es administrador. La usan el panel, el historial y las estadísticas. Es una decisión del usuario y refleja un centro real: **cada profesional tiene su propia cartera**.

---

## 5. Modelo de datos

`db.js` abre `centro.db` con `DatabaseSync` (BLOQUE 2), activa `PRAGMA foreign_keys = ON` (BLOQUE 3) y crea las tablas con `CREATE TABLE IF NOT EXISTS` (BLOQUE 4). Es idempotente: nunca borra datos.

**Tablas:**

| Tabla | Columnas principales | Relaciones |
|-------|----------------------|------------|
| `usuarios` | `id`, `username` UNIQUE, `password`, `nombre`, `rol` | — |
| `pacientes` | `id`, `nombre`, `fecha_nacimiento`, `edad_anios`, `edad_meses`, `profesional_id` | FK → `usuarios.id` |
| `evaluaciones` | `id`, `paciente_id`, `profesional_id`, `fecha`, `motivo_consulta`, `desarrollo_lenguaje`, `desarrollo_motor`, `alimentacion`, `sueno`, `tiempo_libre`, `juego`, `observaciones` | FK → `pacientes.id`, FK → `usuarios.id` |
| `imagenes` | `id`, `evaluacion_id`, `ruta` | FK → `evaluaciones.id` |
| `configuracion` | `clave` PK, `valor` | — (patrón clave/valor) |

`sqlite_sequence` es una tabla interna de SQLite (la crea AUTOINCREMENT); es normal verla.

**Seed de `db.js` (solo si `usuarios` está vacía):**

| id | username | password | nombre | rol |
|----|----------|----------|--------|-----|
| 1 | admin | 123 | Administrador | administrador |
| 2 | ana | 123 | Lic. Ana | comun |
| 3 | carlos | 123 | Lic. Carlos | comun |
| 4 | luca | 123 | Luca Perez | tutor |

Pacientes: Tomas Gomez (2019-06-10, de Ana), Julieta Ruiz (2017-09-18, de Ana), Mateo Diaz (2020-01-25, de Carlos). Una evaluación por paciente.

**Estado real de `centro.db` al 25/10/2026 (verificado en solo lectura) — DIFERENTE AL SEED:**

| id | username | nombre | rol |
|----|----------|--------|-----|
| 1 | admin | Administrador | administrador |
| 2 | ana | Lic. Ana | **tutor** (cambiada desde `comun` durante pruebas) |
| 3 | carlos | Lic. Carlos | comun |
| 4 | luca | Luca Perez | tutor |
| 6 | **test_demo** | Demo Prueba | comun (cuenta de prueba) |

Conteos: 3 pacientes, 3 evaluaciones, 0 imágenes. Configuración: `acento=terracota`, `botones=redondeado`, `menu=comodo`.

> **Antes de una demo o entrega:** conviene borrar `centro.db` y dejar que se re-siembre, o al menos volver a poner a `ana` como `comun` y eliminar `test_demo`. Con `ana` en `tutor` el historial queda con datos de una profesional que ya no puede entrar a verlos.

---

## 6. Mapa de rutas

| Método | Ruta | Guard | Qué hace |
|--------|------|-------|----------|
| GET | `/` | — | Redirige a `/dashboard` si hay sesión, si no a `/login` |
| GET | `/login` | — | Formulario; si ya hay sesión, al panel |
| POST | `/login` | — | Busca el usuario, compara contraseña, arma `req.session.usuario` |
| GET | `/logout` | — | Destruye la sesión |
| GET | `/dashboard` | login | Indicadores reales + últimas 5 evaluaciones |
| GET | `/evaluaciones/nueva` | comun, admin | Formulario de carga |
| POST | `/evaluaciones/nueva` | comun, admin | Valida, calcula edad, inserta paciente + evaluación + imágenes |
| GET | `/historial` | comun, admin | Filtros (desde / hasta / nombre) + tabla |
| GET | `/historial/descargar` | comun, admin | Mismo filtro, salida **CSV** |
| GET | `/estadisticas` | login | 4 bloques de agregados según rol |
| GET | `/configuracion` | login | Cambio de contraseña + apariencia (solo admin) |
| POST | `/configuracion/password` | login | Cambia la contraseña **propia** |
| POST | `/configuracion/apariencia` | admin | Guarda acento, botones y densidad del menú |
| GET | `/admin/usuarios` | admin | Listado + alta + cambio de rol + baja |
| POST | `/admin/usuarios` | admin | Crea cuenta (valida duplicado y largo de clave) |
| POST | `/admin/usuarios/:id/rol` | admin | Cambia rol (bloquea dejar el sistema sin admin) |
| POST | `/admin/usuarios/:id/eliminar` | admin | Elimina (bloquea borrarse a sí mismo, último admin o usuario con datos) |

---

## 7. Módulos implementados, en detalle

### 7.1 Login y sesión (Fase 1)

- `express-session` con `secret: 'mi_clave_secreta'`, `resave: false`, `saveUninitialized: false`, cookie de **15 minutos**.
- La sesión guarda solo `{ id, username, nombre, rol }`. **La contraseña no se guarda en la sesión.**
- Comparación de contraseña en texto plano contra la columna `password`.
- La sesión es **por persona/navegador**, no por rol: el rol viaja dentro de la sesión y solo decide permisos. Intentar "una sesión por rol" sería un error de diseño.
- `error.ejs` muestra 403 con un mensaje claro cuando el rol no alcanza.

### 7.2 Panel (`/dashboard`)

- Tres indicadores calculados con `COUNT(*)` real sobre SQLite, filtrados por rol (`armarResumen`).
- "Rango etario más frecuente" calculado con `rangoEtarioFrecuente` + `contarPorFranja`.
- Tabla con las últimas 5 evaluaciones (`ultimasEvaluaciones`).
- Accesos rápidos condicionados por rol (solo aparecen las pantallas que existen y que el rol puede ver).

### 7.3 Nueva evaluación (Fase 2)

- Formulario de 11 campos + subida múltiple de imágenes (`multer`, destino `public/uploads`, nombre `Date.now() + originalname`).
- **La edad no se pide: se calcula.** El formulario pide fecha de nacimiento y fecha de evaluación; el **servidor** calcula años y meses y los guarda (`calcularEdad`, BLOQUE 16). El navegador solo muestra el cálculo en vivo (`public/js/evaluaciones-nueva.js`), no es fuente de verdad.
- Validación del lado del servidor: nombre, fecha de nacimiento y fecha son obligatorios; rechaza nacimiento posterior a la evaluación (400).
- Los opcionales se normalizan con `String(valor || '')` para que `node:sqlite` nunca reciba `undefined`.
- Inserta paciente → evaluación → una fila por imagen. **No hay transacción**: se mitiga validando antes, pero no es atómico.

### 7.4 Historial (Fase 2)

- Filtros: `desde`, `hasta`, `nombre` (LIKE insensible a mayúsculas). **Exige al menos un filtro**, como pide el enunciado.
- `armarFiltrosHistorial` arma el `WHERE` y los parámetros **una sola vez**, y lo reutilizan la pantalla y la descarga (antes estaban duplicados).
- `COLUMNAS_HISTORIAL` define las 11 columnas en un solo lugar; la tabla y el CSV salen de esa misma definición.
- Descarga: **CSV** con escapado tipo RFC 4180, `Content-Disposition: attachment; filename="historial.csv"`.
- `ORDER BY e.fecha DESC, p.nombre ASC`.

### 7.5 Estadísticas (Fase 2)

Cuatro bloques, todos desde SQLite y filtrados por rol:

1. Pacientes por franja etaria (barras con `role="meter"` y `aria-valuenow`).
2. Evaluaciones por Desarrollo del Lenguaje (agrupadas por el texto guardado; vacío se muestra como "Sin registrar").
3. Evaluaciones por mes (últimos 6 meses con actividad, `substr(fecha,1,7)`).
4. Evaluaciones por profesional (solo para administrador; para un profesional sería una sola barra).

### 7.6 Configuración (Fase 2 / Anexo I)

- **Cambio de contraseña propio**: pide actual, nueva (mínimo 4) y repetida; valida las tres cosas y actualiza solo la fila del usuario logueado.
- **Apariencia (solo administrador)**: acento entre 5 presets, botones redondeados/rectos y menú cómodo/compacto. Se guarda en la tabla `configuracion` (upsert con `ON CONFLICT`) y se aplica por variables CSS + atributos `data-*` en `<html>`.
- `leerConfig()` **valida** los valores guardados contra los dominios permitidos: si alguien edita la base a mano y deja un color inexistente, la vista no se rompe, cae al valor por defecto.

### 7.7 Control de usuarios (solo administrador)

- Alta con validación de duplicado, largo mínimo de clave y rol existente.
- Cambio de rol con protección: no se puede degradar al **último administrador**.
- Baja con tres protecciones: no puede borrarse a sí mismo, no puede borrar al último admin, y si el usuario tiene pacientes/evaluaciones las claves foráneas lo impiden (mensaje `error=con-datos`).

### 7.8 Layout compartido

- `views/parciales/_arriba.ejs` arma `<head>`, barra lateral, ficha del usuario, menú generado por rol y apertura del `<main>`.
- `views/parciales/_abajo.ejs` cierra el marco.
- El menú se construye desde **datos** (`ITEMS_MENU` + `menuDelRol`), con grupos ("Administración", "Cuenta") e íconos SVG decorativos (`aria-hidden`).
- Incluye enlace "Saltar al contenido principal" y `aria-current="page"` en el ítem activo.

---

## 8. Reglas de trabajo del proyecto

Estas reglas las fijó el usuario y **siguen vigentes**. Cualquier cambio de código debe respetarlas.

**Reglas de código (6):**

1. **TODO PLANO.** Sin sobreingeniería, sin abstracciones que no se necesiten.
2. **TODO VISIBLE.** Nada falso, escondido ni "de adorno": sin números simulados, sin botones sin acción, sin secciones fantasma, sin estilos inline.
3. **TODO COMENTADO.** Cada bloque explica **qué hace y por qué**, con ejemplos cuando ayuden. El "por qué" es el punto de la entrega.
4. **SENCILLO.** La solución más directa que funcione.
5. **MANTENER EL DISEÑO APROBADO** (paleta salmón/rosa original, hoy evolucionada a terracota con tokens).
6. **SIN RESTOS.** Antes de cerrar una pantalla: sacar CSS de clases que no usa ninguna vista, comentarios con nombres viejos de funciones/variables, rutas o variables huérfanas.

**Reglas de proceso (3):**

7. **Preguntar los roles ANTES de agregar cada módulo.** Nunca asumir quién entra: preguntar, esperar respuesta y recién ahí crear vista + GET + POST con el guard correcto. *(pedido explícito del usuario, 13/10)*
8. **Una pregunta NO autoriza cambios.** Si el usuario pregunta algo conceptual, se responde y se frena. No se edita código "de paso" aunque el cambio sea técnicamente correcto. Ante la duda, backup y pedir un "sí" explícito para ese cambio puntual. *(aprendido a la fuerza el 14/10)*
9. **Guardar siempre el contexto en Engram** al cerrar cada sesión (`mem_session_summary`), con `project: "dbaez"`.

**Excepción temporal documentada:** durante la preparación de la presentación se redujeron los comentarios extensos de los `.ejs` y de `db.js` a una línea por bloque. `app.js` conserva los "por qué" de sesión, roles y permisos, que son el eje de la defensa.

---

## 9. Cronología del trabajo

### 29/09/2026 — Estado inicial

Existe `otro-backup-fase1/` con la versión de la Fase 1: `app.js` de 163 líneas con usuarios en memoria (admin/ana/carlos), sin base de datos. Ese backup quedó congelado y no se toca.

### 13/10/2026 — Reconstrucción completa del proyecto

- Se recuperó el contexto del proyecto (no estaba registrado en Engram): es el TP de Programación Web II sobre un Centro Psicopedagógico.
- Se extrajo y analizó el enunciado completo: 4 fases con fechas, 3 puntos de flujo, Anexos I y II.
- Se fijaron las **6 reglas de código**.
- **Fase 1 repasada entera bajo las reglas** (14 puntos): `app.js` reescrito con comentarios de "por qué" por bloque, `chequearLogin` simplificado sin optional chaining, `error.ejs` sin estilo inline (nueva clase `.btn-bloque`), menú del dashboard sin ítems deshabilitados. Verificado con `node --check` y prueba real de rutas (200/401/403 según rol).
- **Modelo de datos decidido:** cada profesional tiene sus propios pacientes (multi-tenant por profesional).
- **Roles reducidos de 5 a 3:** se sacaron `recepcion` y `coordinador`; quedan `administrador`, `comun` (Profesional) y `tutor`.
- **Base de datos creada:** `db.js` con `node:sqlite` (cero dependencias), 4 tablas, `PRAGMA foreign_keys = ON`, seed de 4 usuarios + 3 pacientes + 3 evaluaciones. `app.js` dejó el array en memoria y pasó a consultar la base.
- **Regla nueva:** preguntar los roles con acceso antes de cada módulo.
- **Fase 2 — módulo Nuevo Paciente:** formulario completo, multer, cálculo de edad en servidor, validación de obligatorios.
- **Bug encontrado y corregido:** un POST incompleto tiraba 500 **y** dejaba un paciente huérfano, porque `node:sqlite` no acepta `undefined` y no había validación de servidor. Se agregaron las dos defensas.
- **Menú compartido `_menu.ejs`:** estaba duplicado en tres vistas y se había desincronizado (el admin no podía llegar a Usuarios). Se unificó.
- **Auditoría de código completa:** se documentaron fortalezas (consultas parametrizadas, guard clauses, control de acceso centralizado, separación de capas, edad recalculada en servidor) y deudas (contraseñas en texto plano, secret hardcodeado, MemoryStore, multer sin límites, sin CSRF, sin manejador global de errores, sin transacciones).
- **Limpieza de hallazgos:** se eliminaron los números simulados del panel (decía 14 evaluaciones / 8 pacientes cuando la base tenía 3 y 3), se alinearon menú y panel, se borró CSS muerto y se corrigieron comentarios con nombres viejos.
- **Documento de estudio** `EXPLICACION - Roles y permisos.txt` (código + flujo de una petición). **Hoy ese archivo ya no está en la carpeta.**
- **Nombres profesionales:** admin → "Administrador", ana → "Lic. Ana", carlos → "Lic. Carlos", luca → "Luca Perez" (el tutor no lleva título porque no es del plantel). Se actualizaron la base y el seed.
- **Banners `BLOQUE n`** en `app.js` y `db.js` para ubicar secciones con Ctrl+F sin depender de números de línea.

### 14/10/2026 — Limpieza y preparación de la presentación

- `app.js` limpio (el completo se guardó aparte como `app-completo-comentado.js`, **hoy ya no está**): solo se conservan los "por qué" de sesión, roles y permisos.
- `app.js` **reordenado** para la exposición: sesión, roles y control de acceso arriba; rutas; subida de imágenes; funciones auxiliares; arranque, al final.
- Comentarios extensos reducidos a una línea en los 5 `.ejs` y en `db.js`.
- **Incidente de proceso:** se editó `app.js` sin autorización a partir de una pregunta conceptual. Se dejó registrado como regla (§8, regla 8).

### 16/10/2026 — Cierre de la Fase 2 y extracción del enunciado

- Verificación completa de las rutas de evaluaciones contra el PDF, campo por campo (a–k), con declaración formal de cierre del punto 01.
- El PDF se extrajo a `_consigna.txt` con `pypdf` para poder citarlo sin depender de un lector.
- Se decidió la estrategia del Historial: **CSV + vista imprimible en lugar de PDF**, porque el proyecto no tiene ninguna librería de PDF y no se quería sumar una dependencia.
- Plan de los módulos 02 (Historial) y 03 (Estadísticas).

### 23/10/2026 — Auditoría de diseño y reescritura de la interfaz

- **Auditoría con la skill `impeccable`: 5/20, banda Critical.** Hallazgos principales:
  - **P0:** `views/historial.ejs` usaba **21 clases CSS que no existían** (`barra-superior`, `columna-menu`, `contenedor-principal`, `btn-primario`, `tabla`, `alerta`, etc.) y ponía `class="pantalla-dashboard"` en el `<body>`, donde las demás vistas usan un `<div>`.
  - **Contraste:** 12 de 17 pares fallaban WCAG AA; el peor era botón principal blanco sobre `#e2877a` = 2,63:1.
  - **Cero `@media queries`**, sidebar fijo de 240 px: a 375 px quedaban 35 px útiles.
  - **Cero custom properties**: 28 colores hex hardcodeados, lo que hacía estructuralmente imposible el requisito del Anexo I de que el admin cambie la combinación de colores.
  - **Cero `:focus-visible`**; los inputs mataban el outline.
  - Faltaban tres capacidades del Anexo I: formulario estadístico, configuración y cambio individual de contraseña.
  - Tabla de historial con 11 columnas de texto libre, sin contenedor con scroll.
  - Positivos: indicadores reales filtrados por rol, `label for` correcto en los 13 campos, paleta coherente en 6 de 7 vistas, edad sin `new Date()`.
- **Después de la auditoría (timestamps 16:20–17:44) el proyecto quedó reescrito:** parciales `_arriba`/`_abajo`, sistema de tokens CSS (19 custom properties), 6 breakpoints, pantallas de Historial, Estadísticas y Configuración integradas al sistema visual, apariencia editable por el administrador y control de usuarios con alta, cambio de rol y baja.
- **No hay registro en Engram de esa reescritura**: se reconstruyó desde los archivos.

### 25/10/2026 — Esta bitácora

- Se relevó el estado real del código y de la base, y se documentó todo en este archivo.
- Verificaciones de esta pasada: `node --check app.js` OK, `node --check db.js` OK, cruce de clases CSS (solo falla `_menu.ejs`, que está huérfano), lectura de `centro.db` en solo lectura, puerto 3000 libre.

### 26/10/2026 — Reparación del layout roto por la reescritura del 23/10

**Síntoma reportado:** después de la auditoría de diseño, "se pisan algunos botones o partes". El diseño en sí estaba bien; lo que estaba roto era el layout.

**Causa raíz (una sola, y explicaba todo):** `styles.css` definía **dos componentes distintos con la misma clase `.barra`**:

| Definición | Propiedades | Componente real |
|-----------|-------------|-----------------|
| `styles.css:222` | `display:flex; flex-direction:column; position:sticky; height:100vh; border-right` | barra lateral (`<aside class="barra">` en `_arriba.ejs`) |
| `styles.css:859` | `display:grid; grid-template-columns:minmax(90px,30%) 1fr auto` | cada barra de estadística (`<li class="barra">`) |

Como tienen la misma especificidad, se pisaban entre sí:

- **La barra lateral** quedaba como una grilla de 3 columnas: el menú de 6 ítems caía en la tercera columna (`auto`), aplastado → el solapamiento que se veía en *todas* las pantallas.
- **Cada barra de estadística** heredaba `position:sticky`, `height:100vh` y `border-right` de la barra lateral → cada barra ocupaba una pantalla entera.

Los `@media` agravaban el problema: la regla de la línea 1114 estaba escrita para las estadísticas pero también alcanzaba al sidebar.

**Arreglo aplicado (sin tocar colores ni proporciones):**

1. La barra de estadística pasó a llamarse `.barra-fila` (CSS y las 4 filas de `estadisticas.ejs`).
2. Se eliminó la regla suelta de `@media (max-width:860px)` que rompía el sidebar.
3. Se pasaron a clase los estilos inline de `admin-usuarios.ejs` (`.celda-acciones`, con `flex-wrap` para que "Eliminar" no se salga de la celda).
4. Se pasó a clase el `margin-top` inline de `error.ejs` (`.acciones-formulario--separadas`).

**Verificación (medida en el navegador, no "a ojo"):** se levantó el servidor, se renderizaron las 6 pantallas y se midió con Edge headless + CDP en **1366, 1280, 1024, 768 y 390 px** de ancho: **0 solapamientos** entre elementos interactivos, **0 textos recortados**, **0 desborde horizontal**. La barra lateral mide 264 px y es `flex` arriba de 860 px; por debajo pasa a franja superior (`grid`), como estaba diseñado.

---

## 10. Decisiones técnicas clave y por qué

1. **`node:sqlite` en vez de un paquete externo.** Node 26 trae SQLite nativo estable: cero dependencias, cero instalación, y la entrega se explica sola. API usada: `new DatabaseSync(ruta)`, `db.exec(sql)`, `db.prepare(sql).run/get/all`.
2. **La edad se calcula en el servidor y sin `new Date()`.** Se parten las fechas `AAAA-MM-DD` con `split('-')` y `.map(Number)` porque `new Date('2019-06-10')` puede correrse un día según la zona horaria y cambiar años/meses. La fórmula está espejada en el cliente solo para mostrar.
3. **La sesión es por persona, no por rol.** El rol vive dentro de la sesión y decide permisos mediante `chequearRol`.
4. **El menú es dato, no HTML repetido.** `ITEMS_MENU` + `ROLES.secciones` + `menuDelRol` evita el bug que ya ocurrió: una pantalla existente que ningún rol podía alcanzar.
5. **Datos comunes por `res.locals`.** Un middleware inyecta `usuario`, `rolInfo`, `menu` y `config` en todas las vistas; así ninguna pantalla puede quedar sin menú.
6. **Historial en CSV, no PDF.** No hay librería de PDF en el proyecto y se prefirió no agregar una dependencia para la entrega. Queda como deuda explícita si el docente exige PDF.
7. **`configuracion` como tabla clave/valor.** Agregar una opción nueva no obliga a migrar el esquema: es una fila más. Es el patrón más barato para un panel que el administrador va a tocar seguido.
8. **Colores por variables CSS + presets validados.** Es lo que hace posible el requisito del Anexo I sin reescribir el CSS cada vez; el servidor valida el preset antes de aplicarlo.
9. **Parciales de layout en vez de repetir `<head>` y barra lateral.** Cuando algo se repetía siete veces ya se había desincronizado una vez.
10. **Una sola definición de columnas del historial.** `COLUMNAS_HISTORIAL` alimenta tabla y CSV; si se agrega una columna, se agrega en un lugar.

---

## 11. Problemas encontrados y cómo se resolvieron

| Problema | Causa | Solución |
|----------|-------|----------|
| 500 y paciente huérfano al enviar el formulario incompleto | `node:sqlite` rechaza `undefined`; solo había validación HTML | Validación de servidor previa (400 sin tocar la base) + normalizar opcionales con `String(x \|\| '')` |
| El administrador no podía llegar a Usuarios | Menú duplicado en 3 vistas, desincronizado | `_menu.ejs` primero; hoy `ITEMS_MENU` + parcial `_arriba` |
| El panel mostraba 14 evaluaciones / 8 pacientes con 3 y 3 reales | Objeto `datosResumen` hardcodeado | `armarResumen` + `filtroPorRol` con `COUNT(*)` real |
| Menú y tabla de accesos no coincidían | `ROLES.secciones` listaba pantallas inexistentes | Se dejaron solo pantallas existentes |
| CSS muerto y comentarios con nombres viejos (`chequearAdmin`) | Restos de versiones anteriores | Regla 6: limpieza antes de cerrar cada pantalla |
| `EADDRINUSE` en 3000 al probar | Ya había un servidor del usuario corriendo | No es error de código: usar otro puerto o cerrar el proceso |
| Historial sin estilos y 21 clases inexistentes | Vista escrita fuera del sistema visual | Reescritura con parciales y tokens |
| Apariencia no editable por el admin | Colores hardcodeados en 28 lugares | Tokens CSS + presets en `configuracion` |
| Se editó código a partir de una pregunta | Confusión entre consultar y pedir cambios | Regla 8: responder y frenar; backup antes de tocar |

---

## 12. Estado verificado al 25/10/2026

| Verificación | Resultado |
|--------------|-----------|
| `node --check app.js` | OK (exit 0) |
| `node --check db.js` | OK (exit 0) |
| Clases CSS usadas por las vistas vs definidas | Sin faltantes, **excepto** `_menu.ejs` (huérfano) |
| Solapamientos de layout medidos en navegador (1366 / 1280 / 1024 / 768 / 390 px) | **0** solapamientos, **0** textos recortados, **0** desborde horizontal |
| Custom properties en `styles.css` | 19 |
| `@media` en `styles.css` | 6 |
| Tablas en `centro.db` | 5 |
| Conteos en la base | 3 pacientes, 3 evaluaciones, 0 imágenes |
| Puerto 3000 | Libre (no hay servidor levantado) |
| Repositorio git | **No hay** |

---

## 13. Pendientes y desvíos respecto del enunciado

Ordenados por impacto para la entrega.

1. **Descarga del historial en PDF.** Hoy es CSV. El enunciado pide PDF. Opciones: instalar `pdfkit` y generar el PDF en el servidor, o dejar el CSV + vista imprimible y justificarlo en la defensa. **Decisión pendiente del usuario.**
2. **Listas de opciones en el formulario de evaluación (regresión).** El enunciado pide opciones cerradas para **Desarrollo del Lenguaje** (Bajo / Por encima del promedio / Óptimo / Avanzado para la edad), **Alimentación** (A considerar / Aceptable) y **Sueño** (Escaso / Interrumpido / Aceptable). Hoy los tres son `<textarea>` de texto libre. Esto **degrada las estadísticas por lenguaje** (agrupa texto libre) y es un desvío directo del punto 1 del enunciado. Es el arreglo de mayor impacto.
3. **El tutor no está vinculado a un paciente.** No existe `pacientes.tutor_id` ni tabla puente. Hoy `tutor` solo ve Inicio, Estadísticas (vacías, porque se filtran por su id) y Configuración. El rol quedó creado y la regla de acceso definida, pero la funcionalidad de "ver los informes de su paciente" no existe.
4. **Las imágenes se suben pero nunca se muestran.** Se guardan en `public/uploads` y en la tabla `imagenes`, pero ninguna vista las lista ni las abre. El enunciado pide "subir imágenes de producciones del paciente"; falta el visor.
5. **Contraste y accesibilidad sin re-auditar.** Se cambiaron los colores a tonos más oscuros (`#A44A3A` como acento base) y se agregaron breakpoints, pero **no se volvió a correr la auditoría**: no hay medición nueva de contraste, foco visible ni tamaños táctiles.
6. **Seguridad (deuda consciente, no tocada a propósito).** Contraseñas en texto plano (sin bcrypt), `secret` de sesión hardcodeado, `MemoryStore` (las sesiones se pierden al reiniciar), multer sin límite de tamaño ni tipo, sin CSRF, sin manejador global de errores, sin transacciones. Cambiar el hash obligaría a re-sembrar la base y rompería la demo; hay que decidirlo antes de la entrega final.
7. **`views/_menu.ejs` quedó huérfano.** Ninguna vista lo incluye y usa dos clases que ya no existen (`.menu-lateral`, `.item-menu`). Por la regla 6 hay que **borrarlo**.
8. **Estilos inline residuales.** Quedan solo dos, y los dos son **datos**, no diseño: `configuracion.ejs` (el color de la muestra, uno por preset) y `parciales/_arriba.ejs` (inyección de `--acento`). Los de `admin-usuarios.ejs` y `error.ejs` ya se pasaron a clase el 26/10.
9. **Datos de prueba alterados en `centro.db`.** `ana` quedó como `tutor` y existe `test_demo`. Re-sembrar antes de la demo.
10. **Sin control de versiones.** No hay git: no hay historial ni posibilidad de volver atrás salvo por `otro-backup-fase1/`, que es de la Fase 1. Conviene `git init` y un primer commit.
11. **Estadísticas sin filtro de período.** El enunciado lo plantea como opcional ("búsqueda en panel estadístico"); hoy la pantalla muestra todo el histórico.
12. **Sin paginación ni límite en el historial.** Con muchos registros la tabla crece sin control (tiene scroll horizontal, pero no paginación).

---

## 14. Trampas y gotchas (para no volver a pisarlas)

1. **`node:sqlite` no acepta `undefined`.** Siempre normalizar con `String(valor || '')` antes de un `INSERT`/`UPDATE`.
2. **`required` en HTML no es validación.** El servidor valida por su cuenta; sin eso quedan registros a medias.
3. **Cambiar `db.js` no cambia datos ya cargados.** `cargarDatosDePrueba()` sale temprano si hay usuarios: hay que hacer `UPDATE` directo sobre `centro.db` o borrar el archivo.
4. **Una sesión abierta conserva el nombre y el rol viejos** hasta re-login o hasta que venza (15 min).
5. **`new Date('AAAA-MM-DD')` corre fechas por zona horaria.** Partir el string siempre.
6. **`multer.diskStorage` con destino string crea la carpeta sola**, pero el nombre se arma con `Date.now()`: no hay validación de tipo ni de tamaño.
7. **Los comentarios HTML llegan al navegador.** Para verificar permisos en el HTML hay que buscar el `href` real (`href="/admin/usuarios"`), no la palabra "Usuarios".
8. **`EADDRINUSE` en 3000 no es un bug**: hay un servidor ya corriendo.
9. **Node no recarga `app.js` ni `db.js` en caliente.** Las vistas EJS sí se releen.
10. **Los archivos del proyecto tienen codificación despareja** en algunos comentarios (mojibake tipo `Ã³`). Al reescribir, guardar **UTF-8 sin BOM** y con LF.
11. **Engram:** usar `project: "dbaez"`. La ruta `C:\Users\dbaez` da `invalid_project`; un `session_id` inventado da `unknown_session`.
12. **Dos componentes con la misma clase rompen a los dos.** El CSS no avisa: gana la última regla del archivo y las propiedades que la primera define y la segunda no, se filtran. Antes de dar por cerrada una pantalla, contar cuántas veces aparece cada clase como selector (`grep` del nombre + `{`). Así se encontró el bug del 26/10.
13. **Un solapamiento no se diagnostica leyendo CSS "a ojo".** Lo que lo cerró fue medir: renderizar la página real, pedir `getBoundingClientRect()` de cada control y comparar rectángulos. Se puede hacer sin instalar nada con Edge headless (`--remote-debugging-port`) y CDP.

---

## 15. Verificación manual rápida (smoke test)

Con el servidor levantado en `http://localhost:3000`:

| Caso | Resultado esperado |
|------|--------------------|
| `GET /dashboard` sin sesión | 302 → `/login` |
| Login `admin` / `123` | 302 → `/dashboard` |
| Login con clave incorrecta | 401 + mensaje |
| `GET /admin/usuarios` como admin | 200 |
| `GET /admin/usuarios` como `carlos` (comun) | 403 |
| `GET /evaluaciones/nueva` como `luca` (tutor) | 403 |
| `GET /historial` sin filtros | 200 con el aviso "Completá al menos uno de los filtros" |
| `GET /historial?nombre=Tomas` | 200 con la fila de Tomas Gomez |
| `GET /historial/descargar?nombre=Tomas` | Descarga `historial.csv` |
| `POST /evaluaciones/nueva` vacío | 400 sin escribir en la base |
| `GET /estadisticas` como admin | Totales de todo el centro |
| `GET /estadisticas` como `carlos` | Totales solo de sus pacientes |
| `POST /configuracion/apariencia` como `carlos` | 403 |
| Cambiar contraseña con la actual incorrecta | Redirige con `error=actual` |

---

## 16. Dónde vive la memoria del proyecto

Todo el contexto está en **Engram**, `project: "dbaez"`. Observaciones clave:

| ID | Contenido |
|----|-----------|
| 177 | Descripción del proyecto, estructura y fases |
| 178 | Enunciado completo y fechas de entrega |
| 179 | Regla 6 (sin restos) + las 5 anteriores |
| 180 | Fase 1 repasada bajo las reglas + verificación |
| 181 | Aislamiento por profesional (modelo de datos) |
| 182 | Roles definitivos (3) |
| 183 | Creación de `db.js` y esquema SQLite |
| 184 | Regla: preguntar roles antes de cada módulo |
| 185 | Módulo Nuevo Paciente (Fase 2) |
| 186 | Bug de `undefined` + validación de servidor |
| 187 | Menú compartido |
| 188 | Auditoría de código (fortalezas y deudas) |
| 189 | Limpieza de hallazgos |
| 190 | Documento de roles (archivo ya eliminado) |
| 191 | Nombres profesionales de los usuarios |
| 192 | Banners `BLOQUE n` |
| 193 | `app.js` limpio (archivo completo ya eliminado) |
| 194 | Regla: una pregunta no autoriza editar |
| 195 | Reordenamiento de `app.js` |
| 196 | Comentarios EJS minimizados |
| 197 | Comentarios `db.js` minimizados |
| 198-206, 227, 260, 263 | Resúmenes de sesión con verificación de Fase 2 y plan de Historial/Estadísticas |
| 379 | Auditoría `impeccable`: 5/20 y hallazgos |

**Gap conocido:** la reescritura posterior a la auditoría (23/10, 16:20 en adelante) **no tiene observación en Engram**. Esta bitácora cubre ese hueco; si se retoma el proyecto, conviene guardar un resumen nuevo con el estado actual.

---

## 17. Próximos pasos sugeridos (en orden)

1. Re-sembrar `centro.db` (borrar el archivo) para dejar los datos de demo limpios.
2. Devolver los `<select>` de Desarrollo del Lenguaje, Alimentación y Sueño (§13.2) — es el desvío de mayor impacto.
3. Decidir PDF vs CSV en el historial (§13.1).
4. Borrar `views/_menu.ejs` y el estilo inline de `admin-usuarios.ejs` (§13.7 y §13.8).
5. `git init` + primer commit, para no depender de la memoria (§13.10).
6. Ensayar la Fase 3: recorrido por el menú con los tres roles, mostrando que el admin ve 6 secciones y el tutor 3.
7. Si queda tiempo: visor de imágenes por evaluación (§13.4) y vínculo tutor–paciente (§13.3).

---

## Anexo — Mapa de BLOQUES

**`app.js` (17 bloques, en el orden en que una petición los atraviesa):**

| Bloque | Contenido |
|--------|-----------|
| 1 | Importaciones |
| 2 | Configuración de vistas EJS |
| 3 | Middlewares básicos (`static`, `urlencoded`) |
| 4 | Sesión |
| 5 | Roles y menú (`ROLES`, `ITEMS_MENU`, `menuDelRol`) |
| 6 | Apariencia (`ACENTOS`, `leerConfig`, `guardarConfig`) |
| 7 | Datos comunes a todas las vistas (`res.locals`) |
| 8 | Control de acceso (`chequearLogin`, `chequearRol`) |
| 9 | Rutas de sesión (`/`, `/login`, `/dashboard`, `/logout`) |
| 10 | Multer |
| 11 | Rutas de evaluaciones |
| 12 | Historial (`armarFiltrosHistorial`, `COLUMNAS_HISTORIAL`, `consultarHistorial`, CSV) |
| 13 | Estadísticas |
| 14 | Configuración (contraseña y apariencia) |
| 15 | Control de usuarios |
| 16 | Funciones auxiliares (`rangoEtarioFrecuente`, `contarPorFranja`, `filtroPorRol`, `armarResumen`, `ultimasEvaluaciones`, `armarEstadisticas`, `esUltimoAdministrador`, `calcularEdad`) |
| 17 | Arranque del servidor (puerto 3000) |

**`db.js` (6 bloques):** 1 importaciones · 2 abrir/crear la base · 3 claves foráneas · 4 tablas · 5 datos de prueba · 5b configuración inicial · 6 exportar la conexión.

---

*Fin de la bitácora. Si algo acá no coincide con el código, gana el código: corregir este archivo y guardar el cambio en Engram.*
