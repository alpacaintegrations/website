// ============================================
// TRAINING PAGINA - LOGICA
// Leest config.js en vult de pagina
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  renderHero();
  renderWaarom();
  renderPakketten();
  renderDetails();
  renderPrijs();
  renderCta();
  renderFaq();
  initFaqAccordion();
});

// --- HERO ---
function renderHero() {
  const el = document.getElementById('hero');
  if (!el) return;
  el.querySelector('.hero-title').innerHTML = CONFIG.hero.title;
  el.querySelector('.subtitle').textContent = CONFIG.hero.subtitle;
}

// --- WAAROM WIJ ---
function renderWaarom() {
  const el = document.getElementById('waarom');
  if (!el) return;
  el.querySelector('.intro').textContent = CONFIG.waarom.intro;

  const lijst = el.querySelector('.punten-lijst');
  lijst.innerHTML = CONFIG.waarom.punten
    .map(punt => `<li>${punt}</li>`)
    .join('');
}

// --- PAKKETTEN OVERZICHT ---
function renderPakketten() {
  const grid = document.getElementById('pakketten-grid');
  if (!grid) return;

  grid.innerHTML = CONFIG.pakketten.map(pak => `
    <div class="pakket-card">
      <h3>${pak.naam}</h3>
      <ul>
        ${pak.punten.map(p => `<li>${p}</li>`).join('')}
      </ul>
      ${pak.closer ? `<p class="pakket-closer">${pak.closer}</p>` : ''}
    </div>
  `).join('');
}

// --- PAKKETDETAILS ---
function renderDetails() {
  const grid = document.getElementById('details-grid');
  if (!grid) return;

  grid.innerHTML = CONFIG.pakketten.map(pak => `
    <div class="detail-blok">
      <h3>${pak.naam}</h3>
      <table>
        ${pak.details.map(d => `
          <tr>
            <td>${d.label}</td>
            <td>${d.waarde}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `).join('');
}

// --- PRIJS ---
function renderPrijs() {
  const grid = document.getElementById('prijs-grid');
  if (!grid) return;

  grid.innerHTML = CONFIG.pakketten.map(pak => `
    <div class="prijs-blok">
      <h3>${pak.naam}</h3>
      <div class="prijs-bedrag">&euro;${pak.prijs}</div>
      <p class="prijs-garantie">${pak.garantie}</p>
    </div>
  `).join('');
}

// --- CTA ---
function renderCta() {
  const el = document.getElementById('cta');
  if (!el) return;

  el.querySelector('.cta-titel').textContent = CONFIG.cta.titel;
  el.querySelector('.cta-tekst').textContent = CONFIG.cta.tekst;
  el.querySelector('.cta-knop-tekst').textContent = CONFIG.cta.knopTekst;
  el.querySelector('.cta-vraag').textContent = CONFIG.cta.vraag;

  const phoneIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  document.getElementById('cta-opties').innerHTML = CONFIG.cta.opties.map(opt => `
    <a href="${opt.url}" target="_blank" class="cta-optie">${phoneIcon} ${opt.label}</a>
  `).join('');

  // Toggle - klik op knop toont opties
  document.getElementById('cta-trigger').addEventListener('click', () => {
    document.getElementById('cta-keuze').classList.toggle('open');
  });
}

// --- FAQ ---
function renderFaq() {
  const container = document.getElementById('faq-lijst');
  if (!container) return;

  container.innerHTML = CONFIG.faq.map((item, i) => `
    <div class="faq-item" data-index="${i}">
      <div class="faq-vraag">
        <h4>${item.vraag}</h4>
        <span class="faq-icon"></span>
      </div>
      <div class="faq-antwoord">
        <p>${item.antwoord}</p>
      </div>
    </div>
  `).join('');
}

// --- FAQ ACCORDION ---
function initFaqAccordion() {
  const container = document.getElementById('faq-lijst');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const vraag = e.target.closest('.faq-vraag');
    if (!vraag) return;

    const item = vraag.parentElement;
    const wasOpen = item.classList.contains('open');

    // Sluit alle items
    container.querySelectorAll('.faq-item.open').forEach(openItem => {
      openItem.classList.remove('open');
    });

    // Open het aangeklikte item (tenzij het al open was)
    if (!wasOpen) {
      item.classList.add('open');
    }
  });
}
