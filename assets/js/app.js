/* ══ LARSSON PORTFOLIO — APP.JS ══ */

// ── Custom Cursor ──
const cursorDot = document.createElement('div');
const cursorRing = document.createElement('div');
cursorDot.className = 'cursor-dot';
cursorRing.className = 'cursor-ring';
document.body.appendChild(cursorDot);
document.body.appendChild(cursorRing);

let mx = 0, my = 0, rx = 0, ry = 0;
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursorDot.style.left = mx + 'px'; cursorDot.style.top = my + 'px';
});
(function animRing() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  cursorRing.style.left = rx + 'px'; cursorRing.style.top = ry + 'px';
  requestAnimationFrame(animRing);
})();
document.querySelectorAll('a, button, input, select, textarea, .project-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursorRing.style.width = '48px';
    cursorRing.style.height = '48px';
    cursorRing.style.borderColor = 'rgba(124,106,255,.8)';
  });
  el.addEventListener('mouseleave', () => {
    cursorRing.style.width = '32px';
    cursorRing.style.height = '32px';
    cursorRing.style.borderColor = 'rgba(124,106,255,.5)';
  });
});

// ── Animated Canvas Background ──
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let W, H, particles = [];

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.r = Math.random() * 1.5 + 0.3;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = (Math.random() - 0.5) * 0.3;
    this.a = Math.random() * 0.5 + 0.1;
    const hues = [260, 175, 0];
    this.hue = hues[Math.floor(Math.random() * hues.length)];
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${this.hue},80%,65%,${this.a})`;
    ctx.fill();
  }
}

for (let i = 0; i < 120; i++) particles.push(new Particle());

function drawConnections() {
  const thresh = 120;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < thresh) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(124,106,255,${0.06 * (1 - dist / thresh)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
}

function animCanvas() {
  ctx.clearRect(0, 0, W, H);
  particles.forEach(p => { p.update(); p.draw(); });
  drawConnections();
  requestAnimationFrame(animCanvas);
}
animCanvas();

// ── Navbar Scroll ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

// ── Hamburger ──
const ham = document.getElementById('hamburger');
const navEl = document.getElementById('nav');
if (ham && navEl) {
  ham.addEventListener('click', () => navEl.classList.toggle('open'));
  navEl.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navEl.classList.remove('open')));
}

// ── Scroll Reveal ──
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));
setTimeout(() => {
  document.querySelectorAll('.reveal-up:not(.visible)').forEach(el => el.classList.add('visible'));
}, 1500);

// ── Contact Form (Firebase-free fallback via mailto) ──
const buildForm = document.getElementById('build-form');
const statusMsg = document.getElementById('status-msg');

if (buildForm) {
  buildForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    const name = document.getElementById('client-name').value;
    const phone = document.getElementById('client-phone').value;
    const type = document.getElementById('project-type').value;
    const budget = document.getElementById('budget').value;
    const reqs = document.getElementById('requirements').value;

    try {
      // Try Firebase if available
      if (typeof db !== 'undefined' && typeof addDoc !== 'undefined') {
        await addDoc(collection(db, 'proposals'), {
          clientName: name, clientPhone: phone,
          projectType: type, budget, requirements: reqs,
          timestamp: serverTimestamp()
        });
      } else {
        // Fallback: open mailto
        const body = encodeURIComponent(`Name: ${name}\nPhone: ${phone}\nType: ${type}\nBudget: ${budget}\n\n${reqs}`);
        window.open(`mailto:lrtlarsson@gmail.com?subject=Project Proposal from ${name}&body=${body}`);
      }
      statusMsg.className = 'success';
      statusMsg.textContent = '🎉 Proposal sent! I\'ll reach out soon.';
      buildForm.reset();
    } catch (err) {
      statusMsg.className = 'error';
      statusMsg.textContent = '❌ Error sending. Try emailing directly.';
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Send Proposal <span class="btn-arrow">→</span>';
    }
  });
}

console.log('%cLARSSON.DEV — ONLINE', 'color:#7c6aff;font-family:monospace;font-size:14px;font-weight:bold;');
