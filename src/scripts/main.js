import '../styles/main.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);

// Genera un path SVG con bordes "pincelados" — perturbaciones aleatorias por
// segmento. Cada botón recibe uno único, así no se repite el patrón.
function generateBrushSVG(fillHex, seed = Math.random(), opts = {}) {
  const W = opts.w ?? 180;
  const H = opts.h ?? 80;
  const segs = opts.segs ?? 8;
  const noiseTopBottom = opts.noiseTopBottom ?? 10;
  const noiseSide = opts.noiseSide ?? 0.3;
  let r = seed * 1e6;
  // valor en [-amp, amp]
  const rand = (amp) => {
    r = (r * 9301 + 49297) % 233280;
    return ((r / 233280) - 0.5) * 2 * amp;
  };
  // siempre positivo en [0, amp] — para empujar los bordes hacia ADENTRO
  const randPos = (amp) => Math.abs(rand(amp));
  // factor 0..1 que se aproxima a 0 en las esquinas para "calmar" el noise allí
  const taper = (t) => Math.sin(t * Math.PI);

  const pts = [];
  // Top — Y positivo hacia abajo (4 → 4+noise)
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    pts.push([t * W + rand(noiseSide), 4 + randPos(noiseTopBottom) * taper(t)]);
  }
  // Right — X hacia la izquierda (W-4 → W-4-noise)
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    pts.push([W - 4 - randPos(noiseSide) * taper(t), t * H + rand(noiseSide)]);
  }
  // Bottom — Y hacia arriba (H-4 → H-4-noise)
  for (let i = segs - 1; i >= 0; i--) {
    const t = i / segs;
    pts.push([t * W + rand(noiseSide), H - 4 - randPos(noiseTopBottom) * taper(t)]);
  }
  // Left — X hacia la derecha (4 → 4+noise)
  for (let i = segs - 1; i >= 1; i--) {
    const t = i / segs;
    pts.push([4 + randPos(noiseSide) * taper(t), t * H + rand(noiseSide)]);
  }

  // Pasada de suavizado adicional: cada punto se reemplaza por el promedio
  // entre sus vecinos. Más pasadas → curvas más amplias.
  function smooth(arr) {
    return arr.map((p, i) => {
      const prev = arr[(i - 1 + arr.length) % arr.length];
      const next = arr[(i + 1) % arr.length];
      return [(prev[0] + p[0] * 2 + next[0]) / 4, (prev[1] + p[1] * 2 + next[1]) / 4];
    });
  }
  let smoothed = pts;
  for (let i = 0; i < 1; i++) smoothed = smooth(smoothed);

  // Curvas Bezier cuadráticas: vértice = punto de control, path pasa por midpoints.
  const mids = smoothed.map((p, i) => {
    const n = smoothed[(i + 1) % smoothed.length];
    return [(p[0] + n[0]) / 2, (p[1] + n[1]) / 2];
  });
  let d = `M${mids[0][0].toFixed(1)} ${mids[0][1].toFixed(1)}`;
  for (let i = 0; i < smoothed.length; i++) {
    const cp = smoothed[(i + 1) % smoothed.length];
    const m = mids[(i + 1) % smoothed.length];
    d += ` Q${cp[0].toFixed(1)} ${cp[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  }
  d += ' Z';

  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' preserveAspectRatio='none'>` +
    `<path d='${d}' fill='${fillHex}'/></svg>`;
  return `url("data:image/svg+xml;utf8,${svg.replace(/#/g, '%23')}")`;
}

const BUTTON_FILL = {
  white: '#ffffff',
  ocean: '#1b77af',
  red: '#d1291c',
};

function applyBrushToButtons() {
  document.querySelectorAll('.button').forEach((btn) => {
    if (btn.dataset.brushApplied === 'true') return;
    btn.dataset.brushApplied = 'true';
    let fill = BUTTON_FILL.red;
    if (btn.classList.contains('button--white')) fill = BUTTON_FILL.white;
    else if (btn.classList.contains('button--ocean')) fill = BUTTON_FILL.ocean;
    btn.style.backgroundImage = generateBrushSVG(fill);
  });
}

// Burbujas de diálogo: mismo lenguaje pincelado que los botones.
// El cuerpo es un rectángulo brocheado con los 4 bordes irregulares.
// Cada burbuja recibe una seed propia, así no se repiten.
function applyBrushToBubbles() {
  document.querySelectorAll('.speech-bubble').forEach((bubble) => {
    if (bubble.dataset.brushApplied === 'true') return;
    bubble.dataset.brushApplied = 'true';
    bubble.style.backgroundImage = generateBrushSVG(BUTTON_FILL.white, Math.random(), {
      w: 300, h: 210, segs: 11, noiseTopBottom: 12, noiseSide: 12,
    });
  });
}

// Píldoras de fecha (sección WIT): mismo trazo de pincel, en azul claro.
function applyBrushToDates() {
  document.querySelectorAll('.agenda-time-container').forEach((el) => {
    if (el.dataset.brushApplied === 'true') return;
    el.dataset.brushApplied = 'true';
    el.style.backgroundImage = generateBrushSVG(BUTTON_FILL.ocean, Math.random(), {
      w: 340,
      h: 70,
    });
  });
}

function applyBrushDecorations() {
  applyBrushToButtons();
  applyBrushToBubbles();
  applyBrushToDates();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyBrushDecorations);
} else {
  applyBrushDecorations();
}


// Lenis: smooth scrolling con su propio rAF y ScrollTrigger sincronizado en cada tick.
export const lenis = new Lenis({
  autoRaf: true,
  duration: 0.8,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 1.5,
});

lenis.on('scroll', () => ScrollTrigger.update());
if (typeof window !== 'undefined') {
  window.__lenis = lenis;
  window.__ScrollTrigger = ScrollTrigger;
}

export function setupReveals(containerAnimation = null) {
  const firstSection = document.querySelector('.horizontal-scroll__track > .section');

  gsap.utils.toArray('[data-animate]').forEach((el) => {
    if (el.dataset.animateBound === 'true') return;
    el.dataset.animateBound = 'true';

    // Elementos visibles al inicio (primera sección horizontal) se muestran sin animación
    if (firstSection && firstSection.contains(el)) {
      gsap.set(el, { opacity: 1, x: 0, y: 0 });
      return;
    }

    // Contenido dentro de un carrusel Bootstrap: lo gestiona el propio
    // carrusel. Los slides inactivos están en display:none, así que
    // ScrollTrigger no puede medirlos y el elemento quedaría atascado en
    // opacity 0. Se muestran directamente sin reveal por scroll.
    if (el.closest('.carousel-item')) {
      gsap.set(el, { opacity: 1, x: 0, y: 0 });
      return;
    }

    const direction = el.dataset.animate || 'fade';
    const delay = parseFloat(el.dataset.animateDelay || '0');
    const x = direction === 'left' ? -60 : direction === 'right' ? 60 : 0;
    const y = direction === 'up' ? 60 : direction === 'down' ? -60 : 0;

    const scrollTrigger = containerAnimation
      ? {
          trigger: el,
          containerAnimation,
          start: 'left 90%',
          toggleActions: 'play none none reverse',
        }
      : {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        };

    gsap.from(el, {
      opacity: 0,
      x,
      y,
      duration: 0.9,
      delay,
      ease: 'power2.out',
      scrollTrigger,
    });
  });
}

function init() {
  if (!document.querySelector('.horizontal-scroll')) {
    setupReveals();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { gsap, ScrollTrigger };
