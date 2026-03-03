/* ──────────────────────────────────────────
   个人邮局 · Interactions & Animations
────────────────────────────────────────── */

// ── Scroll Reveal ──────────────────────────
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger children with --i CSS variable
        const delay = parseFloat(
          getComputedStyle(entry.target).getPropertyValue('--i') || '0'
        ) * 1000;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── Nav dark/light based on section ─────────
const nav = document.getElementById('nav');
const darkSections = document.querySelectorAll(
  '.feature-block.dark, .how, .cta-banner'
);

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const rect = entry.target.getBoundingClientRect();
        // If section overlaps nav region
        if (rect.top <= 48) {
          nav.classList.add('dark');
        }
      }
    });
  },
  { threshold: [0, 0.05], rootMargin: `-${48}px 0px 0px 0px` }
);

// Simple scroll-based approach for nav theming
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      // Check each dark section
      let onDark = false;
      darkSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 48 && rect.bottom > 48) {
          onDark = true;
        }
      });
      nav.classList.toggle('dark', onDark);
      ticking = false;
    });
    ticking = true;
  }
});

// ── Counter Animation ─────────────────────
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = current.toLocaleString('zh-CN');
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll('.stat-num[data-target]').forEach(el =>
  counterObserver.observe(el)
);

// ── Smooth anchor scrolling ──────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── Parallax on hero visual ───────────────
const heroVisual = document.querySelector('.hero-visual');
if (heroVisual) {
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    heroVisual.style.transform = `translateY(${scrollY * 0.25}px)`;
  }, { passive: true });
}

// ── Paper line re-animation on scroll ────
const paperCard = document.querySelector('.paper-card');
if (paperCard) {
  let animated = false;
  const paperObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !animated) {
        animated = true;
        paperCard.querySelectorAll('.paper-line').forEach(line => {
          line.style.animation = 'none';
          line.offsetHeight; // reflow
          line.style.animation = '';
        });
      }
    },
    { threshold: 0.5 }
  );
  paperObserver.observe(paperCard);
}

// ── Hover tilt on plan cards ──────────────
document.querySelectorAll('.plan-card, .step-card, .story-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `
      perspective(800px)
      rotateY(${x * 6}deg)
      rotateX(${-y * 6}deg)
      translateY(-4px)
    `;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform .4s cubic-bezier(0.4,0,0.2,1)';
    setTimeout(() => { card.style.transition = ''; }, 400);
  });
});
