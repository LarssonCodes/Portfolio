/* ===================================================
   LARSSON PORTFOLIO — CINEMATIC SCROLL ENGINE
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ── ELEMENTS ─────────────────────────────────── */
  const intro      = document.getElementById('intro');
  const introName  = document.getElementById('intro-name');
  const scrollHint = document.getElementById('scroll-hint');
  const navbar     = document.getElementById('navbar');
  const mainContent = document.getElementById('main-content');
  const hamburger  = document.getElementById('hamburger');
  const nav        = document.getElementById('nav');
  const profileImg = document.querySelector('.hero-profile-img');

  /* ── STATE ────────────────────────────────────── */
  let introActive    = true;  // are we in the fullscreen intro?
  let introExited    = false; // has the intro fully left?
  let ticking        = false;
  let lastScrollY    = 0;


  /* ── PHASE 1: Typing cursor disappears after 1.5s
       then show scroll hint ─────────────────────── */
  setTimeout(() => {
    const cursor = document.querySelector('.intro-cursor');
    if (cursor) {
      cursor.style.transition = 'opacity 0.4s ease';
      cursor.style.opacity = '0';
      setTimeout(() => cursor.remove(), 500);
    }
    scrollHint.classList.add('visible');
  }, 1500);

  /* ── INTRO EXIT LOGIC ─────────────────────────── */
  // The intro stays fixed on top. As user scrolls,
  // we animate the name upward + fade intro overlay out.

  function handleIntroScroll() {
    const scrollY = window.scrollY;
    const vh      = window.innerHeight;
    // Progress 0→1 over first 60% of viewport height
    const progress = Math.min(scrollY / (vh * 0.6), 1);

    if (progress >= 0.85) {
      // Intro fully exited
      if (!introExited) {
        introExited = true;
        intro.style.transition = 'opacity 0.5s ease, pointer-events 0s 0.5s';
        intro.style.opacity    = '0';
        intro.style.pointerEvents = 'none';

        // Reveal navbar
        navbar.classList.add('revealed');
      }
    } else {
      // Re-entering intro from scrolling up
      if (introExited) {
        introExited = false;
        intro.style.transition = 'none'; // Instantly prepare to animate
        intro.style.pointerEvents = 'all';
        navbar.classList.remove('revealed');
      }
      
      // Calculate smooth values
      const scale = 1 - progress * 0.35;
      const translateY = -progress * 80;
      const layerOpacity = 1 - progress * 1.15; // Fades out completely near progress=0.85

      intro.style.opacity = Math.max(layerOpacity, 0).toString();
      introName.style.transform = `translateY(${translateY}px) scale(${scale})`;
      introName.style.opacity   = '1'; // Keep name solid, fade the whole layer

      // Keep background solid gray so it covers the site until the layer fades
      intro.style.background = `rgba(248, 249, 250, 1)`;

      // Hide scroll hint as we scroll
      scrollHint.style.opacity = Math.max(1 - progress * 4, 0);
    }
  }

  /* ── SCROLL REVEAL (Intersection Observer) ────── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.08
  });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ── PARALLAX ─────────────────────────────────── */
  function updateParallax() {
    const scrollY = window.scrollY;

    // Profile image subtle parallax
    if (profileImg) {
      const col = profileImg.closest('.hero-center-col') || profileImg.closest('.hero-image-col');
      if (col) {
        const rect = col.getBoundingClientRect();
        const offsetCenter = rect.top + rect.height / 2 - window.innerHeight / 2;
        profileImg.style.transform = `translateY(${offsetCenter * 0.12}px)`;
      }
    }

    // Custom parallax layers
    document.querySelectorAll('[data-parallax]').forEach(el => {
      const speed  = parseFloat(el.dataset.parallax) || 0.2;
      const rect   = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      el.style.transform = `translateY(${center * speed}px)`;
    });
  }

  /* ── NAVBAR SCROLL STATE ──────────────────────── */
  function updateNavbar() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  /* ── MAIN SCROLL HANDLER ──────────────────────── */
  window.addEventListener('scroll', () => {
    lastScrollY = window.scrollY;
    if (!ticking) {
      requestAnimationFrame(() => {
        handleIntroScroll();
        updateParallax();
        updateNavbar();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  /* ── MOBILE MENU ──────────────────────────────── */
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      nav.classList.toggle('active');
      hamburger.classList.toggle('active');
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('active');
        hamburger.classList.remove('active');
      });
    });
  }

  /* ── SMOOTH ANCHOR SCROLL ─────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── CURSOR MAGNETIC EFFECT on project cards ─── */
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect   = card.getBoundingClientRect();
      const x      = (e.clientX - rect.left - rect.width  / 2) / rect.width;
      const y      = (e.clientY - rect.top  - rect.height / 2) / rect.height;
      card.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 3}deg) translateZ(4px)`;
      card.style.transition = 'transform 0.1s ease';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
    });
  });

  /* ── INITIAL CALL ─────────────────────────────── */
  updateParallax();
  // If user somehow reloads mid-page, handle correctly
  if (window.scrollY > 10) {
    handleIntroScroll();
    navbar.classList.add('revealed');
  }

});
