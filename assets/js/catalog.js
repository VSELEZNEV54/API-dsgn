/* API Decor Studio — каталог (демо): фильтры, сортировка, карточка товара. */
(() => {
  'use strict';
  const d = document;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => Array.from(c.querySelectorAll(s));
  const dataEl = d.getElementById('products-data');
  if (!dataEl) return;
  const PRODUCTS = JSON.parse(dataEl.textContent);
  const byId = Object.fromEntries(PRODUCTS.map((p) => [String(p.uid), p]));
  const grid = $('[data-grid]');
  const cards = $$('.pcard[data-uid]', grid);
  const ctaCard = $('.pcard--cta', grid);
  const empty = $('[data-empty]', grid);
  const fmt = (n) => n.toLocaleString('ru-RU').replace(/ |,/g, ' ');

  /* ---------- Filters ---------- */
  const groups = ['brand', 'style', 'subject', 'color'];
  const labels = {};
  $$('.filters input[type="checkbox"]').forEach((i) => { labels[i.name + ':' + i.value] = i.getAttribute('data-label') || i.value; });
  const state = () => {
    const s = {};
    groups.forEach((g) => { s[g] = $$(`.filters input[name="${g}"]:checked`).map((i) => i.value); });
    return s;
  };
  const shownEl = $('[data-shown]');
  const applyEl = $('[data-count-apply]');
  const active = $('[data-active]');

  const apply = (animate = true) => {
    const s = state();
    let n = 0;
    cards.forEach((c) => {
      const ok = groups.every((g) => !s[g].length || s[g].includes(c.dataset[g]));
      const was = !c.classList.contains('is-hidden');
      c.classList.toggle('is-hidden', !ok);
      if (ok) {
        n++;
        if (animate && !was) { c.classList.remove('is-in'); requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add('is-in'))); }
      }
    });
    if (shownEl) shownEl.textContent = n;
    if (applyEl) applyEl.textContent = n;
    if (empty) empty.classList.toggle('is-on', n === 0);
    if (ctaCard) ctaCard.classList.toggle('is-hidden', n < 4);
    // brand chips sync
    $$('.bchip[data-brand]').forEach((b) => {
      const v = b.dataset.brand;
      b.classList.toggle('is-on', v ? (s.brand.length === 1 && s.brand[0] === v) : s.brand.length === 0);
    });
    // active chips
    if (active) {
      active.innerHTML = '';
      groups.forEach((g) => s[g].forEach((v) => {
        const b = d.createElement('button');
        b.type = 'button'; b.className = 'afchip';
        b.innerHTML = `${labels[g + ':' + v] || v} <svg><use href="#i-close"/></svg>`;
        b.addEventListener('click', () => { const i = $(`.filters input[name="${g}"][value="${CSS.escape(v)}"]`); if (i) { i.checked = false; apply(); } });
        active.appendChild(b);
      }));
    }
    placeCta();
  };
  const placeCta = () => {
    if (!ctaCard) return;
    const vis = $$('.pcard[data-uid]:not(.is-hidden)', grid);
    const anchor = vis[4] || vis[vis.length - 1];
    if (anchor) anchor.after(ctaCard);
  };
  $$('.filters input').forEach((i) => i.addEventListener('change', () => apply()));
  $$('[data-reset]').forEach((b) => b.addEventListener('click', () => { $$('.filters input').forEach((i) => { i.checked = false; }); apply(); }));
  $$('.bchip[data-brand]').forEach((b) => b.addEventListener('click', () => {
    const v = b.dataset.brand;
    $$('.filters input[name="brand"]').forEach((i) => { i.checked = !!v && i.value === v; });
    apply();
  }));

  /* ---------- Sorting ---------- */
  const sortSel = $('[data-sort]');
  const original = cards.slice();
  sortSel && sortSel.addEventListener('change', () => {
    const v = sortSel.value;
    let list = original.slice();
    const price = (c) => { const p = parseFloat(c.dataset.price); return isNaN(p) ? null : p; };
    if (v === 'price-asc' || v === 'price-desc') {
      list.sort((a, b) => {
        const pa = price(a); const pb = price(b);
        if (pa === null && pb === null) return 0;
        if (pa === null) return 1; if (pb === null) return -1;
        return v === 'price-asc' ? pa - pb : pb - pa;
      });
    } else if (v === 'name') list.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name, 'ru'));
    list.forEach((c) => { grid.insertBefore(c, empty); c.classList.remove('is-in'); });
    requestAnimationFrame(() => requestAnimationFrame(() => list.forEach((c, i) => { c.style.setProperty('--rd', (i * 0.04).toFixed(2) + 's'); c.classList.add('is-in'); })));
    placeCta();
  });

  /* ---------- Grid view ---------- */
  $$('[data-view]').forEach((b) => b.addEventListener('click', () => {
    $$('[data-view]').forEach((x) => x.classList.toggle('is-on', x === b));
    grid.classList.toggle('is-dense', b.dataset.view === '4');
  }));

  /* ---------- Mobile filters drawer ---------- */
  const filters = $('.filters');
  const fbg = $('.filters-bg');
  const setF = (on) => {
    filters.classList.toggle('is-open', on); fbg && fbg.classList.toggle('is-open', on);
    d.body.style.overflow = on ? 'hidden' : '';
  };
  $$('[data-filters-open]').forEach((b) => b.addEventListener('click', () => setF(true)));
  $$('[data-filters-close]').forEach((b) => b.addEventListener('click', () => setF(false)));

  /* ---------- URL presets (?brand=fresq) ---------- */
  const params = new URLSearchParams(location.search);
  const presetBrand = params.get('brand');
  if (presetBrand) { const i = $(`.filters input[name="brand"][value="${CSS.escape(presetBrand)}"]`); if (i) i.checked = true; }
  apply(false);

  /* ---------- SEO text expand ---------- */
  const seoBtn = $('[data-seo-more]');
  seoBtn && seoBtn.addEventListener('click', () => {
    const t = $('[data-seo]'); const on = t.classList.toggle('is-open');
    $('.btn__t', seoBtn).textContent = on ? 'свернуть' : 'читать полностью';
  });

  /* ---------- Product quick view (карточка товара) ---------- */
  const pv = d.getElementById('pv');
  const main = $('[data-pv-main]', pv);
  const thumbs = $('[data-pv-thumbs]', pv);
  const count = $('[data-pv-count]', pv);
  const mini = $('[data-pv-mini]', pv);
  let cur = null; let idx = 0;
  const show = (i) => {
    const imgs = $$('img', main); if (!imgs.length) return;
    idx = (i + imgs.length) % imgs.length;
    imgs.forEach((im, k) => im.classList.toggle('is-on', k === idx));
    $$('button', thumbs).forEach((t, k) => t.classList.toggle('is-on', k === idx));
    count.textContent = `${idx + 1} / ${imgs.length}`;
    const nav = $('.pv__nav', pv); nav.style.display = imgs.length > 1 ? '' : 'none';
  };
  const priceHtml = (p) => p.price ? `<small>цена от</small>${fmt(p.price)} ₽/м²` : '<small>цена</small>по запросу';
  const openPV = (uid, push = true) => {
    const p = byId[String(uid)]; if (!p) return;
    cur = p;
    main.innerHTML = p.imgs.map((src, k) => `<img src="${src}" alt="${p.title} — фото ${k + 1}" ${k ? 'loading="lazy"' : ''}>`).join('');
    thumbs.innerHTML = p.imgs.map((src, k) => `<button type="button" aria-label="Фото ${k + 1}"><img src="${src}" alt="" loading="lazy"></button>`).join('');
    thumbs.style.display = p.imgs.length > 1 ? '' : 'none';
    $$('button', thumbs).forEach((t, k) => t.addEventListener('click', () => show(k)));
    $('[data-pv-crumbs]', pv).textContent = `фрески / ${p.brand.toLowerCase()} / ${p.coll.toLowerCase()}`;
    $('[data-pv-title]', pv).innerHTML = `${p.brand} <span class="tail">· ${p.name}</span>`;
    $('[data-pv-sku]', pv).textContent = `арт. ${p.sku} · коллекция ${p.coll}`;
    $('[data-pv-price]', pv).innerHTML = priceHtml(p);
    $('[data-pv-specs]', pv).innerHTML = p.specs.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    $('[data-pv-desc]', pv).innerHTML = p.desc.map((t) => `<p>${t}</p>`).join('');
    $('[data-pv-mini-name]', pv).textContent = `— ${p.brand} ${p.name}`;
    mini.classList.remove('is-open');
    const form = $('form', mini); if (form) { form.classList.remove('is-sent'); const pi = $('input[name="product"]', form); if (pi) pi.value = p.title + ' (' + p.sku + ')'; }
    show(0);
    window.APIModal.open('pv');
    if (push) history.replaceState(null, '', '#p-' + p.uid);
  };
  pv.addEventListener('modal:close', () => { if (location.hash.startsWith('#p-')) history.replaceState(null, '', location.pathname + location.search); });
  d.addEventListener('click', (e) => {
    const t = e.target.closest('[data-pv]');
    if (!t) return;
    e.preventDefault();
    openPV(t.getAttribute('data-pv'));
  });
  $('[data-pv-prev]', pv).addEventListener('click', () => show(idx - 1));
  $('[data-pv-next]', pv).addEventListener('click', () => show(idx + 1));
  d.addEventListener('keydown', (e) => {
    if (!pv.classList.contains('is-open')) return;
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
  // swipe
  let sx = null;
  main.addEventListener('pointerdown', (e) => { sx = e.clientX; });
  main.addEventListener('pointerup', (e) => { if (sx === null) return; const dx = e.clientX - sx; if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1)); sx = null; });
  $('[data-pv-req]', pv).addEventListener('click', () => {
    mini.classList.add('is-open');
    const inp = $('input[name="name"]', mini);
    mini.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => inp && inp.focus({ preventScroll: true }), 350);
  });
  const openFromHash = () => {
    const m = location.hash.match(/^#p-(\d+)/);
    if (m && byId[m[1]]) openPV(m[1], false);
  };
  if (d.documentElement.classList.contains('is-loaded')) openFromHash();
  else d.addEventListener('api:ready', () => setTimeout(openFromHash, 400), { once: true });
  window.addEventListener('hashchange', openFromHash);
})();
