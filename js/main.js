/* ============================
   Amber Hooijmans Portfolio
   Main JavaScript
   ============================ */

const PLAY_ICON_SVG = `
  <svg class="play-icon" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="23" stroke="currentColor" stroke-width="1.5"/>
    <path d="M20 16L32 24L20 32V16Z" fill="currentColor"/>
  </svg>`;

/* --- Extract Vimeo video ID from a URL --- */
function getVimeoId(url) {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/);
  return match ? match[1] : null;
}

/* --- Render a single project card --- */
function renderProjectCard(project) {
  const vimeoId = getVimeoId(project.vimeo_url);
  const extraHtml = project.extra
    ? `<span class="project-extra">${project.extra}</span>` : '';

  const el = document.createElement('div');
  el.className = 'project-item reveal';
  el.dataset.category = project.category;
  el.innerHTML = `
    <a href="#" class="project-link"${vimeoId ? ` data-vimeo="${vimeoId}"` : ''}>
      <div class="project-thumb">
        <img class="thumb-img" src="${project.thumbnail}" alt="${project.title}" loading="lazy">
        <div class="project-overlay">${PLAY_ICON_SVG}</div>
      </div>
      <div class="project-meta">
        <div class="project-header-row">
          <span class="project-type">${project.type}</span>
          <span class="project-year">${project.year}</span>
        </div>
        <h3 class="project-name">${project.title}</h3>
        <span class="project-credits">Dir. ${project.director}</span>
        ${extraHtml}
      </div>
    </a>`;
  return el;
}

/* --- Render the full project archive from JSON --- */
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

/* --- Render about & contact from JSON --- */
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
        <a href="tel:+${c.phone_href}" class="contact-value contact-link">${c.phone}</a>
      </div>
      <div class="contact-item">
        <span class="contact-label">Location</span>
        <span class="contact-value">${c.location}</span>
      </div>`;
  }
}

/* --- Video modal --- */
function initModal() {
  const modal = document.getElementById('videoModal');
  const wrap  = document.getElementById('modalIframeWrap');
  const close = document.getElementById('modalClose');

  function openModal(vimeoId) {
    wrap.innerHTML = `<iframe
      src="https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0&color=ffffff"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen></iframe>`;
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
    const id = link.dataset.vimeo;
    if (id) openModal(id);
  });

  // Showreel play button
  const reelBtn = document.getElementById('reelPlayBtn');
  if (reelBtn) {
    reelBtn.addEventListener('click', () => {
      const reelId = reelBtn.dataset.vimeo || '';
      if (reelId) openModal(reelId);
    });
  }

  close.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
}

/* --- Hero letter animation --- */
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

/* --- Nav scroll effect --- */
function initNav() {
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* --- Mobile menu --- */
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

/* --- Scroll reveal --- */
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

/* --- Smooth scroll for anchor links --- */
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

/* --- Project filter --- */
function initFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const archive    = document.getElementById('projectArchive');

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

/* --- Netlify Identity redirect helper --- */
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
});
