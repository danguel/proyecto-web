// ============================================================================
// config/multer.js - CONFIGURACIÓN DE SUBIDA DE IMÁGENES CLÍNICAS
// Centro de Atención Psicopedagógica - Programación Web II (I.E.S. Combate de Mbororé)
// ============================================================================

const multer = require('multer');
const path = require('path');

// ###   [FASE 3] - CONFIGURACIÓN DE SUBIDA DE IMÁGENES (multer)
// Guarda los archivos subidos en public/uploads asegurando nombres de archivo únicos con Date.now().
const almacenamientoImagenes = multer.diskStorage({
    destination: path.join(__dirname, '..', 'public', 'uploads'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const subirImagenes = multer({ storage: almacenamientoImagenes });

module.exports = {
    almacenamientoImagenes,
    subirImagenes
};
