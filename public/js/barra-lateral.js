// ============================================================================
// barra-lateral.js - Control de colapso y expansión del menú lateral (Dock)
// Centro de Atención Psicopedagógica - Programación Web II
// ============================================================================
(function () {
    'use strict';

    function inicializarToggleBarra() {
        const btnToggle = document.getElementById('btn-toggle-barra');
        if (!btnToggle) return;

        // Aplicar estado según localStorage
        const guardado = localStorage.getItem('barraColapsada') === 'true';
        if (guardado) {
            document.body.classList.add('barra-colapsada');
            document.documentElement.classList.add('barra-colapsada');
            btnToggle.setAttribute('aria-expanded', 'false');
        } else {
            btnToggle.setAttribute('aria-expanded', 'true');
        }

        btnToggle.addEventListener('click', () => {
            const estaColapsada = document.body.classList.toggle('barra-colapsada');
            document.documentElement.classList.toggle('barra-colapsada', estaColapsada);
            localStorage.setItem('barraColapsada', String(estaColapsada));
            btnToggle.setAttribute('aria-expanded', String(!estaColapsada));
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarToggleBarra);
    } else {
        inicializarToggleBarra();
    }
})();
