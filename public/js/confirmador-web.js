// ============================================================================
// confirmador-web.js - Diálogo de Confirmación Editorial en la Web
// Centro de Atención Psicopedagógica - Programación Web II
//
// Reemplaza los popups nativos y toscos del navegador (window.confirm) por una
// ventana modal sobria y accesible en la parte superior de la interfaz.
//
// Principio de Retorno Único: Todas las funciones declaran su variable de estado
// y tienen un único return al final.
// ============================================================================

(function () {
    'use strict';

    function crearConfirmador() {
        let inicializado = false;
        const dialog = document.getElementById('modal-confirmacion-web');

        if (dialog) {
            window.confirmarAccion = function (opciones) {
                let promesa = null;
                const opts = opciones || {};

                promesa = new Promise(function (resolve) {
                    const tituloEl = document.getElementById('modal-confirm-titulo');
                    const mensajeEl = document.getElementById('modal-confirm-mensaje');
                    const iconoEl = document.getElementById('modal-confirm-icono');
                    const btnAceptar = document.getElementById('btn-confirm-aceptar');
                    const btnCancelar = document.getElementById('btn-confirm-cancelar');

                    if (tituloEl) tituloEl.textContent = opts.titulo || 'Confirmación requerida';
                    if (mensajeEl) mensajeEl.textContent = opts.mensaje || '¿Estás seguro de que deseás continuar?';

                    const esPeligro = opts.tipoBoton !== 'primario';
                    if (iconoEl) {
                        iconoEl.classList.toggle('modal-confirmacion-icono--peligro', esPeligro);
                    }

                    if (btnAceptar) {
                        btnAceptar.textContent = opts.textoAceptar || (esPeligro ? 'Confirmar' : 'Aceptar');
                        btnAceptar.className = esPeligro ? 'btn btn--peligro' : 'btn btn--primario';
                    }
                    if (btnCancelar) {
                        btnCancelar.textContent = opts.textoCancelar || 'Cancelar';
                    }

                    function onAceptar() {
                        limpiar();
                        dialog.close();
                        resolve(true);
                    }

                    function onCancelar() {
                        limpiar();
                        dialog.close();
                        resolve(false);
                    }

                    function onCancelDialog(e) {
                        e.preventDefault();
                        onCancelar();
                    }

                    function onBackdropClick(e) {
                        const rect = dialog.getBoundingClientRect();
                        const dentro = (
                            rect.top <= e.clientY &&
                            e.clientY <= rect.top + rect.height &&
                            rect.left <= e.clientX &&
                            e.clientX <= rect.left + rect.width
                        );
                        if (!dentro) {
                            onCancelar();
                        }
                    }

                    function limpiar() {
                        if (btnAceptar) btnAceptar.removeEventListener('click', onAceptar);
                        if (btnCancelar) btnCancelar.removeEventListener('click', onCancelar);
                        dialog.removeEventListener('cancel', onCancelDialog);
                        dialog.removeEventListener('click', onBackdropClick);
                    }

                    if (btnAceptar) btnAceptar.addEventListener('click', onAceptar);
                    if (btnCancelar) btnCancelar.addEventListener('click', onCancelar);
                    dialog.addEventListener('cancel', onCancelDialog);
                    dialog.addEventListener('click', onBackdropClick);

                    dialog.showModal();
                    if (btnCancelar) btnCancelar.focus();
                });

                return promesa;
            };

            // Interceptar formularios con confirmaciones de eliminación
            document.addEventListener('submit', function (e) {
                const form = e.target;
                const mensaje = form.getAttribute('data-confirmar');

                if (mensaje && !form.dataset.confirmado) {
                    e.preventDefault();
                    window.confirmarAccion({
                        titulo: form.getAttribute('data-confirmar-titulo') || 'Eliminar registro',
                        mensaje: mensaje,
                        textoAceptar: 'Eliminar',
                        textoCancelar: 'Cancelar',
                        tipoBoton: 'peligro'
                    }).then(function (aceptado) {
                        if (aceptado) {
                            form.dataset.confirmado = 'true';
                            form.submit();
                        }
                    });
                }
            });

            inicializado = true;
        }

        return inicializado;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', crearConfirmador);
    } else {
        crearConfirmador();
    }
})();
