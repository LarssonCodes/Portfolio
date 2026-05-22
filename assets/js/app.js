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
  const mobileVideo = document.getElementById('intro-video-mobile');

  /* ── STATE ────────────────────────────────────── */
  let introActive    = true;  // are we in the fullscreen intro?
  let introExited    = false; // has the intro fully left?
  let ticking        = false;
  let lastScrollY    = 0;
  let scrollingUp    = false; // direction of scrolling
  let videoEnded     = false; // track if intro video finished playing


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
  function handleIntroScroll() {
    const scrollY = window.scrollY;
    const vh      = window.innerHeight;
    const progress = Math.min(scrollY / (vh * 0.6), 1);

    if (progress >= 0.85) {
      if (!introExited) {
        introExited = true;
        intro.style.transition = 'opacity 0.5s ease, pointer-events 0s 0.5s';
        intro.style.opacity    = '0';
        intro.style.pointerEvents = 'none';
        navbar.classList.add('revealed');
      }
    } else {
      // Re-entering intro from scrolling up
      if (introExited && scrollingUp) {
        introExited = false;
        videoEnded = false;
        intro.style.transition = 'none';
        intro.style.pointerEvents = 'all';
        navbar.classList.remove('revealed');

        // Restart active video
        const isMobile = window.innerWidth < 769;
        if (isMobile) {
          if (mobileVideo) {
            mobileVideo.style.display = '';
            mobileVideo.style.transition = 'none';
            mobileVideo.style.opacity = '1';
            mobileVideo.currentTime = 0;
            mobileVideo.play().catch(err => console.log('Play interrupted:', err));
          }
        } else {
          const desktopVideo = document.querySelector('.video-desktop');
          if (desktopVideo) {
            desktopVideo.style.transition = 'none';
            desktopVideo.style.opacity = '1';
            desktopVideo.currentTime = 0;
            desktopVideo.play().catch(err => console.log('Play interrupted:', err));
          }
        }
      }

      if (!introExited) {
        const scale = 1 - progress * 0.35;
        const translateY = -progress * 80;
        const layerOpacity = 1 - progress * 1.15;

        intro.style.opacity = Math.max(layerOpacity, 0).toString();
        introName.style.transform = `translateY(${translateY}px) scale(${scale})`;
        introName.style.opacity   = '1';

        if (videoEnded) {
          intro.style.background = 'transparent';
        } else {
          intro.style.background = `rgba(255, 255, 255, 1)`;
        }

        scrollHint.style.opacity = Math.max(1 - progress * 4, 0);
      }
    }
  }

  /* ── VIDEO: auto-exit on end, mobile loops ────── */
  const introVideos = document.querySelectorAll('video.intro-bg-video');

  introVideos.forEach(introVideo => {
    introVideo.addEventListener('ended', () => {
      if (!introExited) {
        const isMobile = introVideo.id === 'intro-video-mobile';
        if (!isMobile) {
          // Desktop: fade out and reveal site
          videoEnded = true;
          introVideo.style.transition = 'opacity 1.2s cubic-bezier(0.25, 1, 0.5, 1)';
          introVideo.style.opacity    = '0';
          intro.style.transition = 'background-color 1.2s cubic-bezier(0.25, 1, 0.5, 1)';
          intro.style.backgroundColor = 'transparent';
          intro.style.pointerEvents = 'none';
          navbar.classList.add('revealed');
          if (scrollHint) {
            scrollHint.style.transition = 'opacity 0.8s ease';
            scrollHint.style.opacity = '0';
          }
        }
      }
    });
  });

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

    if (profileImg) {
      const col = profileImg.closest('.hero-center-col') || profileImg.closest('.hero-image-col');
      if (col) {
        const rect = col.getBoundingClientRect();
        const offsetCenter = rect.top + rect.height / 2 - window.innerHeight / 2;
        profileImg.style.transform = `translateY(${offsetCenter * 0.12}px)`;
      }
    }

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
    const currentScrollY = window.scrollY;
    scrollingUp = currentScrollY < lastScrollY;
    lastScrollY = currentScrollY;

    intro.style.transition = 'none';

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
  if (window.scrollY > 10) {
    handleIntroScroll();
    navbar.classList.add('revealed');
  }

});
