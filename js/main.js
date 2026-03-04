/* ============================
   Amber Hooijmans Portfolio
   Main JavaScript
   ============================ */

const PLAY_ICON_SVG = `
  <svg class="play-icon" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="23" stroke="currentColor" stroke-width="1.5"/>
    <path d="M20 16L32 24L20 32V16Z" fill="currentColor"/>
  </svg>`;

/* ---- Credit key sets ---- */
const PRIMARY_KEYS = ['Director', 'Directors', 'Production'];

function buildCreditLines(credits) {
  const primary = [];
  for (const [key, val] of Object.entries(credits || {})) {
    if (!val) continue;
    if (PRIMARY_KEYS.includes(key)) {
      primary.push(`<span class="credit-line"><span class="credit-key">${key}.</span> ${val}</span>`);
    }
  }
  // All credits as plain text for SEO (hidden from view)
  const seoText = Object.entries(credits || {})
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  return { primary, seoText };
}

/* ---- Render a single project card ---- */
function renderProjectCard(project) {
  const vimeoId   = project.vimeo_id   || null;
  const youtubeId = project.youtube_id || null;
  const hasVideo  = vimeoId || youtubeId;

  const vimeoAttr   = vimeoId   ? ` data-vimeo="${vimeoId}"`     : '';
  const youtubeAttr = youtubeId ? ` data-youtube="${youtubeId}"` : '';

  const { primary, seoText } = buildCreditLines(project.credits);

  const el = document.createElement('div');
  el.className = 'project-item reveal';
  el.dataset.category = project.category;

  const projectData = encodeURIComponent(JSON.stringify({
    title: project.title, type: project.type, year: project.year, credits: project.credits
  }));

  el.innerHTML = `
    <a href="#" class="project-link"${vimeoAttr}${youtubeAttr} data-project="${projectData}">
      <div class="project-thumb">
        <img class="thumb-img" src="${project.thumbnail}" alt="${project.title}" loading="lazy">
        <div class="project-overlay">${hasVideo ? PLAY_ICON_SVG : ''}</div>
      </div>
      <div class="project-meta">
        <div class="project-header-row">
          <span class="project-type">${project.type}</span>
          <span class="project-year">${project.year}</span>
        </div>
        <h3 class="project-name">${project.title}</h3>
        <div class="project-primary-credits">${primary.join('')}</div>
        ${seoText ? `<span class="sr-only">${seoText}</span>` : ''}
      </div>
    </a>`;
  return el;
}

/* ---- Render the full project archive from JSON ---- */
async function renderProjects() {
  const archive = document.getElementById('projectArchive');
  if (!archive) return;

  const res = await fetch('data/projects.json');
  const { projects } = await res.json();

  projects.forEach(project => archive.appendChild(renderProjectCard(project)));

  // Update filter counts
  const counts = { all: projects.length };
  projects.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
  Object.entries(counts).forEach(([key, val]) => {
    const el = document.getElementById(`count-${key}`);
    if (el) el.textContent = val;
  });
}

/* ---- Render about & contact from JSON ---- */
async function renderAbout() {
  const aboutEl   = document.getElementById('aboutContent');
  const contactEl = document.getElementById('contactDetails');
  if (!aboutEl && !contactEl) return;

  const res  = await fetch('data/about.json');
  const data = await res.json();

  if (aboutEl) {
    const bodyParas   = data.bio_body.map(p => `<p>${p}</p>`).join('');
    const tools       = data.tools.map(t => `<span class="tool-tag">${t}</span>`).join('');
    const specialties = data.specialties.map(s => `<span class="tool-tag">${s}</span>`).join('');

    aboutEl.innerHTML = `
      <p class="about-lead">${data.bio_lead}</p>
      ${bodyParas}
      <div class="about-tools">
        <h3>Tools</h3>
        <div class="tool-tags">${tools}</div>
      </div>
      <div class="about-specialties">
        <h3>Specialties</h3>
        <div class="tool-tags">${specialties}</div>
      </div>`;
  }

  if (contactEl) {
    const c = data.contact;
    contactEl.innerHTML = `
      <div class="contact-item">
        <span class="contact-label">Email</span>
        <a href="mailto:${c.email}" class="contact-value contact-link">${c.email}</a>
      </div>
      <div class="contact-item">
        <span class="contact-label">Phone</span>
        <a href="tel:${c.phone_href}" class="contact-value contact-link">${c.phone}</a>
      </div>
      <div class="contact-item">
        <span class="contact-label">Location</span>
        <span class="contact-value">${c.location}</span>
      </div>`;
  }
}

/* ---- Video modal (Vimeo + YouTube) ---- */
function initModal() {
  const modal  = document.getElementById('videoModal');
  const wrap   = document.getElementById('modalIframeWrap');
  const credEl = document.getElementById('modalCreditsCol');
  const close  = document.getElementById('modalClose');
  if (!modal) return;

  function openModal(src, project) {
    wrap.innerHTML = `<iframe src="${src}"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen></iframe>`;
    if (credEl && project) {
      const lines = Object.entries(project.credits || {})
        .filter(([, v]) => v)
        .map(([k, v]) => `<div class="modal-credit-line">
          <span class="modal-credit-key">${k}</span>
          <span class="modal-credit-val">${v}</span>
        </div>`).join('');
      credEl.innerHTML = `
        <p class="modal-meta-type">${project.type}</p>
        <h2 class="modal-meta-title">${project.title}</h2>
        <p class="modal-meta-year">${project.year}</p>
        <div class="modal-credits">${lines}</div>`;
    }
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { wrap.innerHTML = ''; }, 350);
  }

  // Project card clicks
  document.getElementById('projectArchive').addEventListener('click', e => {
    const link = e.target.closest('.project-link');
    if (!link) return;
    e.preventDefault();
    const vid     = link.dataset.vimeo;
    const yt      = link.dataset.youtube;
    const project = link.dataset.project ? JSON.parse(decodeURIComponent(link.dataset.project)) : null;
    if (vid) {
      openModal(`https://player.vimeo.com/video/${vid}?autoplay=1&title=0&byline=0&portrait=0&color=ffffff`, project);
    } else if (yt) {
      openModal(`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0`, project);
    }
  });

  // Showreel play button
  const reelBtn = document.getElementById('reelPlayBtn');
  if (reelBtn) {
    reelBtn.addEventListener('click', () => {
      const vid = reelBtn.dataset.vimeo;
      const yt  = reelBtn.dataset.youtube;
      if (vid) {
        openModal(`https://player.vimeo.com/video/${vid}?autoplay=1&title=0&byline=0&portrait=0&color=ffffff`);
      } else if (yt) {
        openModal(`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0`);
      }
    });
  }

  close.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
}

/* ---- Parallax ---- */
function initParallax() {
  const heroContent = document.querySelector('.hero-content');
  let ticking = false;

  function tick() {
    const sy = window.scrollY;

    // Hero content drifts up gently as you scroll
    if (heroContent) {
      heroContent.style.transform = `translateY(${sy * 0.22}px)`;
    }

    // Thumbnail inner parallax
    document.querySelectorAll('.project-item').forEach(item => {
      const img = item.querySelector('.thumb-img');
      if (!img) return;
      const rect = item.getBoundingClientRect();
      const vh   = window.innerHeight;
      if (rect.bottom < 0 || rect.top > vh) return;
      // progress: -1 (item below fold) → 0 (center) → 1 (item above fold)
      const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      img.style.transform = `translateY(${progress * 28}px) scale(1.07)`;
    });

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(tick); ticking = true; }
  }, { passive: true });

  tick(); // initial call
}

/* ---- Hero letter animation ---- */
function initHeroAnimation() {
  document.querySelectorAll('.hero-line').forEach((line, lineIndex) => {
    const text = line.textContent;
    line.textContent = '';
    [...text].forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'letter';
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.animationDelay = `${lineIndex * 0.3 + i * 0.05 + 0.3}s`;
      line.appendChild(span);
    });
  });
}

/* ---- Nav scroll effect ---- */
function initNav() {
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---- Mobile menu ---- */
function initMobileMenu() {
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('is-open');
    links.classList.toggle('is-open');
    document.body.style.overflow = links.classList.contains('is-open') ? 'hidden' : '';
  });

  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('is-open');
      links.classList.remove('is-open');
      document.body.style.overflow = '';
    });
  });
}

/* ---- Scroll reveal ---- */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ---- Smooth scroll for anchor links ---- */
function initSmoothScroll() {
  const nav = document.getElementById('nav');
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight - 20;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

/* ---- Project filter ---- */
function initFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const archive    = document.getElementById('projectArchive');
  if (!archive) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const filter = btn.dataset.filter;
      const items  = archive.querySelectorAll('.project-item');

      if (filter === 'all') {
        items.forEach(item => { item.style.display = ''; });
        archive.classList.remove('is-filtered');
      } else {
        items.forEach(item => {
          item.style.display = item.dataset.category === filter ? '' : 'none';
        });
        archive.classList.add('is-filtered');
      }
    });
  });
}

/* ---- Netlify Identity redirect helper ---- */
function initNetlifyIdentity() {
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on('init', user => {
      if (!user) {
        window.netlifyIdentity.on('login', () => {
          document.location.href = '/admin/';
        });
      }
    });
  }
}

/* ============================
   Boot
   ============================ */
document.addEventListener('DOMContentLoaded', async () => {
  initHeroAnimation();
  initNav();
  initMobileMenu();
  initSmoothScroll();
  initNetlifyIdentity();

  await Promise.all([renderProjects(), renderAbout()]);

  initScrollReveal();
  initFilter();
  initModal();
  initParallax();
});
