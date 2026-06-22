/* ===================================================
   LARSSON PORTFOLIO — CINEMATIC SCROLL ENGINE
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ── INITIALIZE LENIS SMOOTH SCROLL ──────────────── */
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

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
  const slides     = document.querySelectorAll('.project-slide');
  const slideNav   = document.querySelector('.slide-nav');
  const slideNavItems = document.querySelectorAll('.slide-nav-item');

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

  /* ── PROJECT SCROLL ENGINE (SMOOTH HORIZONTAL WIPE & GLITCH) ── */
  const workSection = document.getElementById('work');
  const swipeLine = document.querySelector('.swipe-line');
  const displacementMaps = [
    document.getElementById('glitch-displacement-0'),
    document.getElementById('glitch-displacement-1'),
    document.getElementById('glitch-displacement-2'),
    document.getElementById('glitch-displacement-3')
  ];
  const glitchImages = [
    document.getElementById('glitch-image-0'),
    document.getElementById('glitch-image-1'),
    document.getElementById('glitch-image-2'),
    document.getElementById('glitch-image-3')
  ];

  function updateProjectScrollEffects() {
    if (!workSection) return;

    const scrollY = window.scrollY;
    const rect = workSection.getBoundingClientRect();
    const startY = rect.top + scrollY;
    const totalScrollHeight = workSection.offsetHeight - window.innerHeight;

    // Calculate relative scroll position within the work container
    const relScroll = Math.max(0, Math.min(scrollY - startY, totalScrollHeight));

    // Normalized progress across the 5 slides (goes from 0.0 to 4.0)
    const progress = (relScroll / window.innerHeight);

    // Active slide index (0 to 4)
    const currentSlideIdx = Math.max(0, Math.min(Math.floor(progress), slides.length - 1));

    // Transition progress between current slide and next slide (from 0 to 1)
    const transitionProgress = progress - currentSlideIdx;

    // Y coordinate percentage of the swipe line (moves from 100% down to 0% as transition progress goes 0 to 1)
    const Y_pct = (1 - transitionProgress) * 100;

    const isMobile = window.innerWidth < 901;

    slides.forEach((slide, idx) => {
      const slideProgress = progress - idx;
      const video = slide.querySelector('video');

      if (idx === currentSlideIdx) {
        slide.classList.add('active');
        
        // Play video when slide becomes active
        if (video && video.paused) {
          video.play().catch(() => {});
        }
        
        if (transitionProgress > 0 && currentSlideIdx < slides.length - 1) {
          // Outgoing slide is visible ABOVE the swipe line (from 0% to Y_pct)
          slide.style.clipPath = `inset(0px 0px ${100 - Y_pct}% 0px)`;
        } else {
          // Settled state: fully visible
          slide.style.clipPath = 'none';
        }
      } else if (idx === currentSlideIdx + 1 && transitionProgress > 0) {
        slide.classList.add('active');
        
        // Play video when slide is incoming
        if (video && video.paused) {
          video.play().catch(() => {});
        }
        
        // Incoming slide is visible BELOW the swipe line (from Y_pct to 100%)
        slide.style.clipPath = `inset(${Y_pct}% 0px 0px 0px)`;
      } else {
        // Completely hidden
        slide.classList.remove('active');
        slide.style.clipPath = 'none';
        
        // Pause video of inactive slide to conserve mobile GPU resources
        if (video && !video.paused) {
          video.pause();
        }
      }

      // Translate columns vertically to simulate natural vertical scrolling
      const colLeft = slide.querySelector('.project-col-left');
      const colRight = slide.querySelector('.project-col-right');
      
      const translateY = slideProgress * -100; // in vh units
      
      if (colLeft) {
        // Project title column fades out/in instead of translating vertically
        const titleOpacity = Math.max(0, 1 - Math.abs(slideProgress) / 0.4);
        colLeft.style.transform = 'none';
        colLeft.style.opacity = titleOpacity.toString();
      }
      if (colRight) {
        if (isMobile) {
          // On mobile, fade out/in statically to prevent vertical overlapping with visual box
          const descOpacity = Math.max(0, 1 - Math.abs(slideProgress) / 0.4);
          colRight.style.transform = 'none';
          colRight.style.opacity = descOpacity.toString();
        } else {
          // On desktop, translate vertically
          colRight.style.transform = `translateY(${translateY}vh)`;
          colRight.style.opacity = '1';
        }
      }
    });

    // Update active class on dot nav items
    slideNavItems.forEach((item, idx) => {
      const activeIndex = Math.min(Math.round(progress), slides.length - 1);
      if (idx === activeIndex) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Calculate displacement scale & swipe line opacity
    let scaleVal = 0;
    let lineOpacity = 0;

    if (transitionProgress > 0 && transitionProgress < 1 && currentSlideIdx < slides.length - 1) {
      // Smooth sine wave peaking at transitionProgress = 0.5
      const wave = Math.sin(transitionProgress * Math.PI);
      scaleVal = 40 * wave; // Peak displacement scale is 40px (clean slices)
      lineOpacity = wave;
    }

    // Position and show/hide the swipe line (works on both mobile and desktop)
    if (swipeLine) {
      swipeLine.style.top = Y_pct + '%';
      swipeLine.style.opacity = lineOpacity.toString();
    }

    // Toggle nav dot visibility based on container bounding box
    const vh = window.innerHeight;
    if (rect.top <= vh * 0.5 && rect.bottom >= vh * 0.5) {
      if (slideNav) {
        slideNav.classList.add('visible');
        slideNav.classList.add('slide-nav-light');
      }
    } else {
      if (slideNav) {
        slideNav.classList.remove('visible');
      }
    }

    // On mobile, skip the heavy real-time SVG displacement calculations entirely
    if (isMobile) {
      return;
    }

    // Find the visual box of the active slide to calculate the relative swipe position inside it
    const activeSlide = slides[currentSlideIdx];
    const visualBox = activeSlide ? activeSlide.querySelector('.project-visual-box') : null;
    let relativeY_pct = 50; // default middle
    if (visualBox) {
      const boxRect = visualBox.getBoundingClientRect();
      const swipeY = (Y_pct / 100) * window.innerHeight; // Swipe line Y coordinate in viewport pixels
      
      if (boxRect.height > 0) {
        // Calculate vertical position of swipe line relative to visual box top
        const relativeY = swipeY - boxRect.top;
        relativeY_pct = (relativeY / boxRect.height) * 100;
      }
    }

    // Set scale on displacement maps and position displacement band at the swipe line
    displacementMaps.forEach((map, idx) => {
      if (map) {
        // Only apply glitch to the incoming slide (revealed slide) to keep transition clean
        let isIncoming = false;
        if (scrollingUp) {
          isIncoming = (idx === currentSlideIdx); // entering Slide A
        } else {
          isIncoming = (idx === currentSlideIdx + 1); // entering Slide B
        }

        if (isIncoming && scaleVal > 0) {
          map.setAttribute('scale', scaleVal.toString());
        } else {
          map.setAttribute('scale', '0');
        }
      }
    });

    glitchImages.forEach((img, idx) => {
      if (img) {
        let isIncoming = false;
        if (scrollingUp) {
          isIncoming = (idx === currentSlideIdx);
        } else {
          isIncoming = (idx === currentSlideIdx + 1);
        }

        if (isIncoming) {
          // Center the 20% height glitch band exactly on the relative swipe Y percentage
          const glitchY = relativeY_pct - 10;
          img.setAttribute('y', glitchY + '%');
        } else {
          img.setAttribute('y', '40%');
        }
      }
    });
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
        updateProjectScrollEffects();
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

  /* ── SMOOTH SCROLL BYPASS HELPER FOR NAVIGATION ─── */
  function smoothScrollTo(target) {
    if (!target) return;
    lenis.scrollTo(target, {
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    });
  }

  function smoothScrollToSlide(idx) {
    if (!workSection) return;
    const targetY = (workSection.getBoundingClientRect().top + window.scrollY) + idx * window.innerHeight;
    lenis.scrollTo(targetY, {
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    });
  }

  /* ── SMOOTH ANCHOR SCROLL ─────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#work') {
        e.preventDefault();
        smoothScrollToSlide(0);
      } else {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          smoothScrollTo(target);
        }
      }
    });
  });

  // Click handler for side navigation dots
  slideNavItems.forEach((item, idx) => {
    item.addEventListener('click', () => {
      smoothScrollToSlide(idx);
    });
  });

  /* ── MOCKUP 3D TILT HOVER EFFECT ─── */
  slides.forEach((slide) => {
    const visual = slide.querySelector('.project-visual-box');
    if (visual) {
      slide.addEventListener('mousemove', (e) => {
        // Disable tilt effect on mobile viewports
        if (window.innerWidth < 901) return;
        
        const rect   = slide.getBoundingClientRect();
        const x      = (e.clientX - rect.left - rect.width  / 2) / rect.width;
        const y      = (e.clientY - rect.top  - rect.height / 2) / rect.height;
        visual.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(15px)`;
        visual.style.transition = 'transform 0.1s ease';
      });
      slide.addEventListener('mouseleave', () => {
        visual.style.transform = '';
        visual.style.transition = 'transform 0.8s cubic-bezier(0.16,1,0.3,1)';
      });
    }
  });

  /* ── INITIAL CALL ─────────────────────────────── */
  updateParallax();
  updateProjectScrollEffects();
  if (window.scrollY > 10) {
    handleIntroScroll();
    navbar.classList.add('revealed');
  }

  window.addEventListener('resize', () => {
    updateProjectScrollEffects();
    updateParallax();
  });

});
