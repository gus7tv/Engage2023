# Engage2023

Sitio multi-página para **Avaya ENGAGE 2023** (Orlando, FL — 18–21 junio 2023).
Refactorizado a Vite + tokens CSS + BEM + GSAP/ScrollTrigger.

## Stack

- **Vite** (multi-page, una entry HTML por sección del sitio)
- **CSS tokens** en `src/styles/tokens/` (colores, tipografía, espaciado, motion, layout)
- **BEM** en `src/styles/components/` y `src/styles/pages/`
- **GSAP + ScrollTrigger** para animaciones y scroll horizontal
- **Bootstrap 5** + **Splide** vía CDN para markup utilitario

## Comandos

```bash
npm install
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm run build    # genera dist/
npm run preview  # sirve dist/ para verificar el build
```

## Páginas

`index.html`, `agenda.html`, `faq.html`, `speakers.html`, `sponsors.html`, `wit.html`, `partner-forum.html` — cada una es una entry de Vite definida en `vite.config.js`.
