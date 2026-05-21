import { gsap, ScrollTrigger, setupReveals, lenis } from './main.js';
import Splide from '@splidejs/splide';
import '@splidejs/splide/dist/css/splide.min.css';

const HEADER_DARK_SECTIONS = new Set([
  'about-section',
  'agenda-section',
  'speakers-section',
  'avaya-speakers-section',
  'wit-section',
]);

const MOBILE_BREAKPOINT = 1199.98;

function initSplide() {
  document.querySelectorAll('.splide').forEach((node) => {
    new Splide(node, {
      updateOnMove: true,
      autoplay: true,
      pagination: true,
      type: 'loop',
      perPage: 1,
      perMove: 1,
      focus: 'center',
      gap: '3em',
      breakpoints: { 900: { perPage: 1 } },
    }).mount();
  });
}

function initHome() {
  const wrapper = document.querySelector('.horizontal-scroll');
  const track = document.querySelector('.horizontal-scroll__track');
  if (!wrapper || !track) return;

  // Reparar el árbol: el HTML legacy tiene <style> intercalados que rompen el
  // anidamiento. Movemos todas las <section.section> que quedaron como hermanas
  // del track adentro del track, y descartamos <style> sueltos del wrapper.
  const orphanSections = Array.from(wrapper.children).filter(
    (el) => el !== track && el.matches('section.section')
  );
  orphanSections.forEach((s) => track.appendChild(s));
  Array.from(wrapper.children).forEach((el) => {
    if (el !== track) wrapper.removeChild(el);
  });



  const sections = gsap.utils.toArray('.horizontal-scroll__track > .section');
  const header = document.querySelector('.header');
  const headerLogo = document.querySelector('.header__logo');

  if (sections.length === 0) return;

  function applyHeaderState(section) {
    if (!header) return;
    const dark = HEADER_DARK_SECTIONS.has(section.id);
    header.classList.toggle('header--scrolled', dark);
    if (headerLogo) headerLogo.classList.toggle('header__logo--scrolled', dark);
  }

  const mediaQuery = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT + 0.02}px)`);

  let horizontalTween = null;
  const sectionTriggers = [];

  function buildHorizontal() {
    if (!mediaQuery.matches) {
      setupReveals();
      return;
    }

    const totalDistance = () => track.scrollWidth - window.innerWidth;
    // ~400 px de scroll por cada sección horizontal: un wheel chico ya basta.
    const PER_SECTION_SCROLL = 400;
    const scrollRange = () => PER_SECTION_SCROLL * (sections.length - 1);

    horizontalTween = window.__horizontalTween = gsap.to(track, {
      x: () => -totalDistance(),
      ease: 'none',
      scrollTrigger: {
        trigger: wrapper,
        pin: true,
        scrub: 0.4,
        anticipatePin: 1,
        end: () => '+=' + scrollRange(),
        invalidateOnRefresh: true,
      },
    });

    // Snap a sección vía Lenis. Clave para que no se sienta tosco: el snap
    // NUNCA interrumpe el momentum. Cada frame de scroll reinicia un timer;
    // cuando Lenis deja de emitir 'scroll' (el deslizamiento ya se agotó),
    // recién ahí se hace un ajuste suave a la sección más cercana.
    let isSnapping = false;
    let userScrolled = false;
    let settleTimer = null;
    let snappingTimeout = null;
    const SETTLE_DELAY = 130;
    const totalSnaps = sections.length;

    function setSnapping(value) {
      isSnapping = value;
      if (snappingTimeout) clearTimeout(snappingTimeout);
      // Fallback por si onComplete no se dispara (snap interrumpido).
      if (value) snappingTimeout = setTimeout(() => { isSnapping = false; }, 1400);
    }

    function snapToNearest() {
      if (!horizontalTween || !lenis || isSnapping) return;
      const st = horizontalTween.scrollTrigger;
      const cur = lenis.scroll;
      if (cur < st.start - 4 || cur > st.end + 4) return;
      const progress = (cur - st.start) / (st.end - st.start);
      const nearest = Math.round(progress * (totalSnaps - 1)) / (totalSnaps - 1);
      const targetScroll = st.start + (st.end - st.start) * nearest;
      if (Math.abs(cur - targetScroll) < 2) { userScrolled = false; return; }
      setSnapping(true);
      userScrolled = false;
      lenis.scrollTo(targetScroll, {
        duration: 0.7,
        easing: (t) => 1 - Math.pow(1 - t, 4),
        onComplete: () => setSnapping(false),
      });
    }

    function scheduleSettleSnap() {
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(snapToNearest, SETTLE_DELAY);
    }

    if (lenis) {
      // Mientras Lenis emita scroll, se reprograma el timer. El snap sólo
      // corre cuando el scroll quedó completamente quieto.
      lenis.on('scroll', () => {
        if (userScrolled && !isSnapping) scheduleSettleSnap();
      });
      // Si el usuario scrollea durante un snap, Lenis cancela su scrollTo:
      // liberamos el flag para volver a evaluar el reposo.
      function markScrolled() {
        userScrolled = true;
        if (isSnapping) setSnapping(false);
      }
      window.addEventListener('wheel', markScrolled, { passive: true });
      window.addEventListener('touchmove', markScrolled, { passive: true });
      window.addEventListener('keydown', (e) => {
        if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '].includes(e.key)) {
          markScrolled();
        }
      });
    }

    sections.forEach((section) => {
      const t = ScrollTrigger.create({
        trigger: section,
        containerAnimation: horizontalTween,
        start: 'left 60%',
        end: 'right 40%',
        onEnter: () => applyHeaderState(section),
        onEnterBack: () => applyHeaderState(section),
      });
      sectionTriggers.push(t);
    });

    // Animación de escala horizontal del trazo de pincel (Paint Wipe)
    sections.forEach((section) => {
      const brush = section.querySelector('.section__brush');
      if (!brush) return;

      const t = gsap.fromTo(brush,
        { scaleX: 1, rotate: 3 },
        {
          scaleX: 1.25,
          rotate: 0,
          ease: 'power1.inOut',
          scrollTrigger: {
            trigger: section,
            containerAnimation: horizontalTween,
            start: 'right 85%', // Inicia al entrar el borde derecho
            end: 'right 15%',   // Termina antes de cubrir la pantalla anterior prematuramente
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );
      if (t.scrollTrigger) {
        sectionTriggers.push(t.scrollTrigger);
      }
    });

    setupReveals(horizontalTween);
    applyHeaderState(sections[0]);
  }

  function destroyHorizontal() {
    sectionTriggers.forEach((t) => t.kill());
    sectionTriggers.length = 0;
    if (horizontalTween) {
      horizontalTween.scrollTrigger && horizontalTween.scrollTrigger.kill();
      horizontalTween.kill();
      horizontalTween = null;
    }
    gsap.set(track, { clearProps: 'transform' });
  }

  buildHorizontal();

  mediaQuery.addEventListener('change', () => {
    destroyHorizontal();
    buildHorizontal();
    ScrollTrigger.refresh();
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      const index = sections.indexOf(target);
      if (index === -1 || !horizontalTween) return;
      event.preventDefault();
      const st = horizontalTween.scrollTrigger;
      const targetProgress = index / (sections.length - 1);
      const targetScroll = st.start + (st.end - st.start) * targetProgress;
      if (lenis) lenis.scrollTo(targetScroll, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 3) });
      else window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    });
  });
}

function boot() {
  initHome();
  initSplide();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
