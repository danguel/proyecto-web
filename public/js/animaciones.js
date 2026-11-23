// ============================================================================
// animaciones.js - Coreografía y Movimiento Calmo (GSAP + ScrollTrigger)
// Tesis: "Editorial Cálido & Espacio Terapéutico"
// Principios: Serenidad, baja estimulación, respeto sensorial absoluto
// ============================================================================

(function () {
    'use strict';

    if (typeof gsap === 'undefined') {
        return;
    }

    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // Configuración global de GSAP: solo animar transform y autoAlpha (opacity + visibility)
    // para máximo rendimiento en GPU y 0 repaints innecesarios.
    const mm = gsap.matchMedia();

    // ------------------------------------------------------------------------
    // 1. CONDICIÓN: PREFERS-REDUCED-MOTION (Accesibilidad cognitiva y sensorial)
    // ------------------------------------------------------------------------
    mm.add('(prefers-reduced-motion: reduce)', () => {
        // En modo movimiento reducido: revelación inmediata sin desplazamientos
        gsap.set([
            '.encabezado-pagina',
            '.indicador',
            '.tarjeta',
            '.acceso-caja',
            '.ficha',
            '.barra',
            '.nav-lista li',
            '.tabla',
            '.formulario'
        ], {
            autoAlpha: 1,
            clearProps: 'transform'
        });
    });

    // ------------------------------------------------------------------------
    // 2. CONDICIÓN: PREFERS-REDUCED-MOTION: NO-PREFERENCE (Coreografía orgánica)
    // ------------------------------------------------------------------------
    mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Revelación serena del encabezado editorial
        const encabezado = document.querySelector('.encabezado-pagina');
        if (encabezado) {
            gsap.fromTo(encabezado,
                { autoAlpha: 0, y: 12 },
                { autoAlpha: 1, y: 0, duration: 0.75, ease: 'power2.out', delay: 0.05 }
            );
        }

        // Indicadores editoriales: secuencia rítmica calmada
        const indicadores = document.querySelectorAll('.indicador');
        if (indicadores.length > 0) {
            gsap.fromTo(indicadores,
                { autoAlpha: 0, y: 14 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.7,
                    stagger: 0.08,
                    ease: 'power2.out',
                    delay: 0.12
                }
            );
        }

        // Tarjetas y paneles: entrada suave con ScrollTrigger
        const tarjetas = document.querySelectorAll('.tarjeta');
        tarjetas.forEach((tarjeta, i) => {
            gsap.fromTo(tarjeta,
                { autoAlpha: 0, y: 16 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.8,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: tarjeta,
                        start: 'top 93%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        });

        // Pantalla de Login: centro de atención calmo y gradual
        const loginCaja = document.querySelector('.acceso-caja');
        if (loginCaja) {
            gsap.fromTo(loginCaja,
                { autoAlpha: 0, y: 18 },
                { autoAlpha: 1, y: 0, duration: 0.85, ease: 'expo.out', delay: 0.08 }
            );
        }

        // Menú de navegación lateral: transición sutil en eje X
        const itemsMenu = document.querySelectorAll('.nav-lista li');
        if (itemsMenu.length > 0) {
            gsap.fromTo(itemsMenu,
                { autoAlpha: 0, x: -6 },
                { autoAlpha: 1, x: 0, duration: 0.55, stagger: 0.03, ease: 'power2.out', delay: 0.1 }
            );
        }
    });
})();
