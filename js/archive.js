/* ============================
   Amber Hooijmans — Archive
   ============================ */

const PLAY_SVG = `<svg class="arc-play-icon" width="36" height="36" viewBox="0 0 48 48" fill="none">
  <circle cx="24" cy="24" r="23" stroke="currentColor" stroke-width="1.5"/>
  <path d="M20 16L32 24L20 32V16Z" fill="currentColor"/>
</svg>`;

/* ---- Credit label helpers ---- */
const PRIMARY_KEYS = ['Director', 'Directors', 'Production'];

function buildCreditLines(credits) {
  const primary = [];
  for (const [key, val] of Object.entries(credits)) {
    if (!val) continue;
    if (PRIMARY_KEYS.includes(key)) {
      primary.push(`<span class="arc-credit-line"><span class="arc-credit-key">${key}.</span> ${val}</span>`);
    }
  }
  const seoText = Object.entries(credits)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  return { primary, seoText };
}

/* ---- Render one archive card ---- */
function renderCard(project) {
  const { primary, seoText } = buildCreditLines(project.credits || {});
  const vimeoAttr  = project.vimeo_id  ? ` data-vimeo="${project.vimeo_id}"`   : '';
  const youtubeAttr= project.youtube_id? ` data-youtube="${project.youtube_id}"`: '';
  const hasVideo   = project.vimeo_id || project.youtube_id;
  const thumb      = project.thumbnail_url || '';
  const needsThumb = !thumb && project.vimeo_id;

  const card = document.createElement('article');
  card.className  = 'arc-card';
  card.dataset.category = project.category;
  card.dataset.year  = project.year;
  card.dataset.title = project.title.toLowerCase();
  card.dataset.director = (project.credits?.Director || project.credits?.Directors || '').toLowerCase();

  const projectData = encodeURIComponent(JSON.stringify({
    title: project.title, type: project.category, year: project.year, credits: project.credits
  }));

  card.innerHTML = `
    <a class="arc-link" href="#"${vimeoAttr}${youtubeAttr} data-project="${projectData}">
      <div class="arc-thumb">
        <img src="${thumb}" alt="${project.title}" loading="lazy" width="640" height="360"${needsThumb ? ` data-vimeo-thumb="${project.vimeo_id}"` : ''}>
        ${hasVideo ? `<div class="arc-overlay">${PLAY_SVG}</div>` : ''}
      </div>
      <div class="arc-meta">
        <div class="arc-meta-row">
          <span class="arc-type">${project.category.replace('-', ' ')}</span>
          <span class="arc-year">${project.year}</span>
        </div>
        <h3 class="arc-name">${project.title}</h3>
        <div class="arc-primary-credits">${primary.join('')}</div>
        ${seoText ? `<span class="sr-only">${seoText}</span>` : ''}
      </div>
    </a>`;
  return card;
}

/* ---- Render full grid ---- */
function renderGrid(projects) {
  const grid = document.getElementById('arcGrid');
  projects.forEach(p => grid.appendChild(renderCard(p)));
}

/* ---- Populate filter counts ---- */
function populateCounts(projects) {
  const cats = { all: projects.length };
  projects.forEach(p => { cats[p.category] = (cats[p.category] || 0) + 1; });
  Object.entries(cats).forEach(([k, v]) => {
    const el = document.getElementById(`arc-count-${k}`);
    if (el) el.textContent = v;
  });
}

/* ---- Build year filter pills ---- */
function buildYearFilters(projects) {
  const years = [...new Set(projects.map(p => p.year))].sort((a, b) => b - a);
  const wrap  = document.getElementById('arcYearBtns');
  years.forEach(yr => {
    const btn = document.createElement('button');
    btn.className    = 'year-btn';
    btn.dataset.year = yr;
    btn.textContent  = yr;
    wrap.appendChild(btn);
  });
}

/* ---- Filtering logic ---- */
let activeCategory = 'all';
let activeYear     = 'all';
let searchQuery    = '';

function applyFilters() {
  const cards   = document.querySelectorAll('.arc-card');
  const empty   = document.getElementById('arcEmpty');
  let   visible = 0;

  cards.forEach(card => {
    const catOk  = activeCategory === 'all' || card.dataset.category === activeCategory;
    const yearOk = activeYear     === 'all' || card.dataset.year      === activeYear;
    const q      = searchQuery.trim().toLowerCase();
    const searchOk = !q ||
      card.dataset.title.includes(q) ||
      card.dataset.director.includes(q);

    const show = catOk && yearOk && searchOk;
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });

  empty.style.display = visible === 0 ? '' : 'none';
  // Update subtitle
  const total = document.querySelectorAll('.arc-card').length;
  const sub = document.getElementById('arcSubtitle');
  if (sub) sub.textContent = visible === total
    ? `${total} projects · 2012–2025`
    : `${visible} of ${total} projects`;
}

function initFilters(projects) {
  populateCounts(projects);
  buildYearFilters(projects);

  // Category buttons
  document.getElementById('arcCategoryBtns').addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    document.querySelectorAll('#arcCategoryBtns .filter-btn').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    activeCategory = btn.dataset.filter;
    applyFilters();
  });

  // Year buttons
  document.getElementById('arcYearBtns').addEventListener('click', e => {
    const btn = e.target.closest('.year-btn');
    if (!btn) return;
    const isSame = btn.classList.contains('is-active');
    document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('is-active'));
    if (!isSame) {
      btn.classList.add('is-active');
      activeYear = btn.dataset.year;
    } else {
      activeYear = 'all';
    }
    applyFilters();
  });

  // Search
  document.getElementById('arcSearch').addEventListener('input', e => {
    searchQuery = e.target.value;
    applyFilters();
  });
}

/* ---- Video modal ---- */
function initModal() {
  const modal  = document.getElementById('videoModal');
  const wrap   = document.getElementById('modalIframeWrap');
  const credEl = document.getElementById('modalCreditsCol');
  const close  = document.getElementById('modalClose');

  function openModal(src, project) {
    wrap.innerHTML = `<iframe src="${src}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
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
    setTimeout(() => { wrap.innerHTML = ''; if (credEl) credEl.innerHTML = ''; }, 350);
  }

  document.getElementById('arcGrid').addEventListener('click', e => {
    const link = e.target.closest('.arc-link');
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

  close.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
}

/* ---- Nav scroll ---- */
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
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    toggle.classList.remove('is-open');
    links.classList.remove('is-open');
    document.body.style.overflow = '';
  }));
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

/* ---- Auto-fetch missing Vimeo thumbnails ---- */
async function resolveVimeoThumbs(container) {
  const imgs = (container || document).querySelectorAll('img[data-vimeo-thumb]');
  await Promise.all([...imgs].map(async img => {
    const id = img.dataset.vimeoThumb;
    try {
      const res  = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}&width=640`);
      const data = await res.json();
      if (data.thumbnail_url) img.src = data.thumbnail_url;
    } catch (e) { /* leave blank on failure */ }
  }));
}

/* ---- Boot ---- */
document.addEventListener('DOMContentLoaded', async () => {
  initHeroAnimation();
  initNav();
  initMobileMenu();

  const res = await fetch('data/archive.json');
  const { projects } = await res.json();

  renderGrid(projects);
  initFilters(projects);
  initModal();
  resolveVimeoThumbs();
});
