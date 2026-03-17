/* ============================
   Amber Hooijmans Portfolio
   Main JavaScript
   ============================ */

const ICON_VIMEO = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 12.5C4.603 9.913 3.83 8.619 3 8.619c-.179 0-.806.378-1.881 1.132L0 8.364c1.185-1.044 2.351-2.087 3.501-3.128C5.08 3.972 6.266 3.376 7.055 3.305c1.865-.18 3.013 1.092 3.45 3.818.467 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.612-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.475 4.431z"/></svg>`;
const ICON_LINKEDIN = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;
const ICON_INSTAGRAM = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`;

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

/* ---- Normalise a Vimeo value to just the numeric ID ---- */
function normaliseVimeoId(raw) {
  if (!raw) return null;
  const match = String(raw).match(/(\d{6,})/);
  return match ? match[1] : String(raw);
}

/* ---- Render a single project card ---- */
function renderProjectCard(project) {
  const vimeoId   = normaliseVimeoId(project.vimeo_id);
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

  // Use pre-fetched Vimeo thumbnail (set at build time), fall back to uploaded file
  const thumbSrc = project.thumbnail_url || project.thumbnail || '';

  el.innerHTML = `
    <a href="#" class="project-link"${vimeoAttr}${youtubeAttr} data-project="${projectData}">
      <div class="project-thumb">
        <img class="thumb-img" src="${thumbSrc}" alt="${project.title}" loading="lazy">
        <div class="project-overlay">${hasVideo ? PLAY_ICON_SVG : ''}</div>
      </div>
      <div class="project-meta">
        <div class="project-header-row">
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

  // Grid depths (px of travel): matches column spans, repeats every 9
  const DEPTHS = [65, 40, 40, 65, 40, 95, 65, 40, 95];
  projects.forEach((project, i) => {
    const card = renderProjectCard(project);
    card.dataset.depth = DEPTHS[i % DEPTHS.length];
    archive.appendChild(card);
  });

  // Update filter counts
  const counts = { all: projects.length };
  projects.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
  Object.entries(counts).forEach(([key, val]) => {
    const el = document.getElementById(`count-${key}`);
    if (el) el.textContent = val;
  });
}

/* ---- Render about content (language-aware, re-callable) ---- */
function renderAboutContent(data) {
  const lang    = window.LANG || 'en';
  const aboutEl = document.getElementById('aboutContent');
  if (!aboutEl) return;

  const lead      = lang === 'nl' && data.bio_lead_nl ? data.bio_lead_nl : data.bio_lead;
  const bodyArr   = lang === 'nl' && data.bio_body_nl ? data.bio_body_nl : data.bio_body;
  const bodyParas = bodyArr.map(p => `<p>${p}</p>`).join('');
  const tools     = data.tools.map(t => `<span class="tool-tag">${t}</span>`).join('');

  aboutEl.innerHTML = `
    <p class="about-lead">${lead}</p>
    ${bodyParas}
    <div class="about-tools">
      <h3>Tools</h3>
      <div class="tool-tags">${tools}</div>
    </div>`;
}

/* ---- Render about & contact from JSON ---- */
async function renderAbout() {
  const contactEl = document.getElementById('contactDetails');

  const res  = await fetch('data/about.json').catch(() => null);
  if (!res) return;
  const data = await res.json();
  ABOUT_DATA = data; // cache for lang switching

  renderAboutContent(data);

  if (contactEl) {
    const c = data.contact;
    const T = window.TRANSLATIONS?.[window.LANG || 'en'] || {};
    contactEl.innerHTML = `
      <div class="contact-item">
        <span class="contact-label">${T.contact_email || 'Email'}</span>
        <a href="mailto:${c.email}" class="contact-value contact-link">${c.email}</a>
      </div>
      <div class="contact-item">
        <span class="contact-label">${T.contact_phone || 'Phone'}</span>
        <a href="tel:${c.phone_href}" class="contact-value contact-link">${c.phone}</a>
      </div>
      <div class="contact-item">
        <span class="contact-label">${T.contact_location || 'Location'}</span>
        <span class="contact-value">${c.location}</span>
      </div>`;
  }

  // Render social links in footer
  const socialEl = document.getElementById('footerSocial');
  if (socialEl && data.social) {
    const links = [];
    if (data.social.vimeo)     links.push(`<a href="${data.social.vimeo}" target="_blank" rel="noopener" aria-label="Vimeo">${ICON_VIMEO}</a>`);
    if (data.social.linkedin)  links.push(`<a href="${data.social.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn">${ICON_LINKEDIN}</a>`);
    if (data.social.instagram) links.push(`<a href="${data.social.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${ICON_INSTAGRAM}</a>`);
    socialEl.innerHTML = links.join('');
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
    const vh = window.innerHeight;

    // Hero content drifts up gently as you scroll
    if (heroContent) {
      heroContent.style.transform = `translateY(${sy * 0.22}px)`;
    }

    // Card-level parallax — depth baked per card via data-depth
    document.querySelectorAll('.project-item[data-depth]').forEach(item => {
      const rect = item.getBoundingClientRect();
      if (rect.bottom < -300 || rect.top > vh + 300) return;
      // progress: -1 (below fold) → 0 (centred) → +1 (above fold)
      const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      const depth    = parseFloat(item.dataset.depth) || 55;
      item.style.transform = `translateY(${progress * depth}px)`;
      // Inner image shifts a little less — creates layered depth inside the card
      const img = item.querySelector('.thumb-img');
      if (img) img.style.transform = `translateY(${progress * 20}px) scale(1.07)`;
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
        // After reveal animation completes, remove transform from transition
        // so the parallax rAF loop can drive it without easing lag
        if (entry.target.dataset.depth) {
          setTimeout(() => {
            entry.target.style.transition = 'opacity 0.7s cubic-bezier(0,0,0.2,1)';
          }, 750);
        }
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

/* ---- Language toggle (EN / NL) ---- */
let ABOUT_DATA = null; // cached for re-render on lang switch

function applyLang(lang) {
  const T = window.TRANSLATIONS?.[lang];
  if (!T) return;
  window.LANG = lang;
  localStorage.setItem('lang', lang);

  // Update html lang attribute
  document.documentElement.lang = lang;

  // Swap all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (T[key] !== undefined) el.textContent = T[key];
  });

  // Re-render about section with correct language
  if (ABOUT_DATA) renderAboutContent(ABOUT_DATA);

  // Update toggle button
  const btn = document.getElementById('langToggle');
  if (btn) {
    btn.innerHTML = lang === 'en'
      ? '<strong>EN</strong> · NL'
      : 'EN · <strong>NL</strong>';
  }
}

function initLangToggle() {
  const saved = localStorage.getItem('lang') || 'en';
  applyLang(saved);

  const btn = document.getElementById('langToggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    applyLang(window.LANG === 'en' ? 'nl' : 'en');
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
async function resolveVimeoThumbs() {
  const imgs = document.querySelectorAll('img[data-vimeo-thumb]');
  await Promise.all([...imgs].map(async img => {
    const id = img.dataset.vimeoThumb;
    try {
      const res  = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}&width=640`);
      const data = await res.json();
      if (data.thumbnail_url) img.src = data.thumbnail_url;
    } catch (e) { /* leave blank on failure */ }
  }));
}

document.addEventListener('DOMContentLoaded', async () => {
  initLangToggle();   // sets window.LANG from localStorage before any render
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
  resolveVimeoThumbs();
});
