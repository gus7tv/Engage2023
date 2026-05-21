# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Sitio estático multi-página para **Avaya ENGAGE 2023** (Orlando, FL — 18–21 junio 2023). Refactorizado a Vite (multi-page) + tokens CSS + BEM + GSAP/ScrollTrigger.

Páginas: `index.html`, `agenda.html`, `faq.html`, `speakers.html`, `sponsors.html`, `wit.html`, `partner-forum.html` — cada una es una entry de Vite definida en `vite.config.js`.

## Comandos

```bash
npm install
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm run build    # genera dist/
npm run preview  # sirve dist/ para verificar el build
```

## Arquitectura

### Tokens CSS (`src/styles/tokens/`)
Todos los valores de diseño viven como custom properties. **Nunca hardcodear** colores, espacios, tipografía, motion, layout, breakpoints en componentes — siempre `var(--token-…)`.

- `colors.css` — paleta (jade/teal/denim/ocean/red/orange) + escala de neutrals + alias semánticos (`--color-text-primary`, `--color-bg-page`, etc.).
- `typography.css` — `--font-family-base/display/accent`, `--font-size-*`, `--font-weight-*`, `--line-height-*`, `--letter-spacing-*`. Carga Noto Sans JP de Google Fonts y `Kalam`/`Noteworthy` desde `/public/fonts/`.
- `spacing.css` — escala `--space-0..11` (4–120 px), radios y sombras.
- `layout.css` — `--layout-*` (header height, content padding) y `--z-*` (capas de z-index), más `--bp-*` para referencia (los media queries siguen usando px literales).
- `motion.css` — `--duration-*`, `--ease-*`, `--transition-*`. Respeta `prefers-reduced-motion`.

`tokens/index.css` agrupa todo. `main.css` lo importa primero, luego base, components, pages.

### BEM
Convención estricta en `src/styles/components/` y `src/styles/pages/`:
- Bloque: `.header`
- Elemento: `.header__logo`, `.header__nav-list`
- Modificador: `.header--scrolled`, `.header__logo--scrolled`, `.button--white`, `.section--home`

Las clases de estado dinámico (las que JS agrega/quita) son modificadores BEM y se aplican vía `classList.toggle()`. Ver `src/scripts/home.js`.

### Componentes activos
`src/styles/components/`:
- `header.css` — `.header`, `.header__logo`, `.header__nav-list`, `--scrolled`
- `scroll-icon.css` — `.scroll-icon` + `--white`, `--left`, `--inverse`
- `section.css` — `.section` + `--home`, `--about`, `--agenda`, `--speakers`, `--sponsor`; `.section__marker` (anclas invisibles para ScrollTrigger)
- `button.css` — `.button` + `--white`, `--red`

### JS y animaciones (`src/scripts/`)
- `main.js` — entry común. Importa `main.css`, registra GSAP + ScrollTrigger, e inicializa el reveal genérico `[data-animate]` (acepta `data-animate="fade|up|down|left|right"` y opcional `data-animate-delay="0.5"`).
- `home.js` — extiende `main.js` con la lógica de scroll-icon y header scrolled state. Detecta secciones por `[data-section="home|about|agenda|speakers|sponsor|kids|speaker-N"]` y aplica modificadores BEM al header (`--scrolled`) y al icono (`--white`, `--left`, `--inverse`). El click del icono hace `scrollBy/scrollTo` con `behavior: 'smooth'`.

GSAP/ScrollTrigger reemplaza por completo a AniJS + Animate.css + IntersectionObserver del proyecto original. Cualquier nueva animación: usa `data-animate` en el HTML, o crea un timeline dedicado en un módulo nuevo bajo `src/scripts/`.

### HTML
Cada página carga `<script type="module" src="/src/scripts/main.js">` (o `home.js` en la home). El `<head>` también carga Bootstrap 5 + Splide CSS desde jsDelivr — esos no se autogestionan vía npm porque el sitio aún depende del markup de Bootstrap (`col-*`, `dropdown-menu`, `accordion-button`, `navbar-toggler`, etc.).

GTM, OneTrust y Oracle Infinity se conservan tal cual: son parte del contrato de producción y NO se tocan.

## Cosas que dejaron de existir
- `css/` y `js/` legacy → archivados en `_legacy/`. Ya no se cargan.
- `animations.css` (4071 líneas de Animate.css) → eliminado completamente, GSAP cubre todo.
- `anijs-min.js` y atributos `data-anijs="…"` → reemplazados por `data-animate` + reveal de `main.js`.
- IntersectionObservers de `js/index.js` → reemplazados por `ScrollTrigger.create(...)` en `home.js`.
- Script inline del dropdown-redirect que forzaba `window.location.href` en cada click del menú → eliminado.
- Imports CSS desde Eloqua (`images.news.avaya.com/Web/AvayaInc/{uuid}_*.css`) → eliminados; el CSS ahora viene de `src/styles/`.

## Convenciones al hacer cambios

- **Cero valores hardcodeados en CSS.** Si necesitas un color/espacio/duración que no existe, agrégalo primero como token en `src/styles/tokens/` y luego úsalo.
- **BEM o no.** Si introduces una clase nueva, debe ser un bloque/elemento/modificador BEM. No agregues clases utilitarias `.text-red`, `.mt-3`, etc. — para utilidades hay Bootstrap externo (las páginas siguen siendo Bootstrap markup-heavy).
- **Animaciones: GSAP, no CSS keyframes.** La única excepción que dejamos es el pulse interno del `.scroll-icon::before`. Cualquier scroll-reveal nuevo va con `data-animate` o con un timeline GSAP propio.
- **El doble-espaciado del HTML original ya no aplica** — el refactor lo limpió. Editar los HTML como HTML normal.
- **Deploy a producción:** este repo ahora produce un `dist/` con `npm run build`. El flujo legacy de subir archivos a Eloqua (`images.news.avaya.com/Web/AvayaInc/{uuid}_*`) ya no es relevante para CSS/JS; cualquier asset bundled se sirve relativo. Las URLs absolutas a `images.news.avaya.com/EloquaImages/...` que aún hay en el CSS y HTML son **imágenes**, no código, y se mantienen.

## Estructura

```
.
├── index.html, agenda.html, faq.html, …  ← entries Vite
├── public/
│   ├── favicon.ico, icon.png
│   ├── img/                              ← assets servidos en /img/...
│   └── fonts/                            ← (pendiente: copiar Kalam-Bold.ttf y Noteworthy)
├── src/
│   ├── styles/
│   │   ├── main.css                      ← entry CSS
│   │   ├── tokens/   (colors, typography, spacing, layout, motion)
│   │   ├── base/     (reset, globals)
│   │   ├── components/ (header, scroll-icon, section, button)
│   │   └── pages/    (home, agenda, faq, speakers)
│   └── scripts/
│       ├── main.js                       ← entry JS (CSS + GSAP + reveal)
│       └── home.js                       ← lógica scroll-icon/header
├── vite.config.js
├── package.json
└── _legacy/        ← snapshot del css/ y js/ originales (no cargado)
```

## Pendientes conocidos
- Las fuentes locales `Kalam-Bold.ttf` y `FontsFree-Net-Noteworthy-Bold.ttf` referenciadas en `tokens/typography.css` aún no están en `public/fonts/`. Si las necesitas, recupéralas del backup original y colócalas en esa carpeta — si no, las @font-face se ignorarán silenciosamente y se usará la fallback `cursive`.
- El contenido específico de cada página (agenda grid completa, FAQ accordion completo, listas de speakers, sponsors grid) sigue usando clases legacy en su HTML interno. Los componentes globales (header, scroll-icon, sections, buttons) ya están en BEM y consumen tokens, pero un refactor profundo por página queda como trabajo futuro.
