/* API Decor Studio — демо-макет. Общие скрипты для всех страниц. */
(() => {
  'use strict';
  const d = document;
  const html = d.documentElement;
  html.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => Array.from(c.querySelectorAll(s));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* noop */ } },
    sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* noop */ } }
  };

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (!reduce && window.Lenis && !/Android|iPhone|iPad/i.test(navigator.userAgent)) {
    lenis = new window.Lenis({ lerp: 0.095, wheelMultiplier: 1, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const headerH = () => parseInt(getComputedStyle(html).getPropertyValue('--header-h'), 10) || 76;
  const scrollToEl = (el) => {
    const off = -headerH() - 12;
    if (lenis) lenis.scrollTo(el, { offset: off, duration: 1.4 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + off, behavior: reduce ? 'auto' : 'smooth' });
  };
  let locks = 0;
  const lock = (on) => {
    locks = Math.max(0, locks + (on ? 1 : -1));
    const l = locks > 0;
    if (lenis) l ? lenis.stop() : lenis.start();
    d.body.style.overflow = l ? 'hidden' : '';
  };

  /* ---------- Preloader / page transitions ---------- */
  const curtain = $('.curtain');
  const firstVisit = !store.sget('api-visited');
  store.sset('api-visited', '1');
  if (curtain && !firstVisit) { const inner = $('.curtain__in', curtain); if (inner) inner.style.display = 'none'; }
  const minDelay = firstVisit ? 1100 : 250;
  const heroImg = $('.hero__media img, .chero__media img');
  const waitImg = heroImg && !heroImg.complete ? new Promise((r) => { heroImg.addEventListener('load', r, { once: true }); heroImg.addEventListener('error', r, { once: true }); }) : Promise.resolve();
  const waitFonts = d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve();
  Promise.race([
    Promise.all([waitImg, waitFonts, new Promise((r) => setTimeout(r, minDelay))]),
    new Promise((r) => setTimeout(r, 2600))
  ]).then(() => {
    html.classList.add('is-loaded');
    setTimeout(() => d.dispatchEvent(new CustomEvent('api:ready')), 50);
  });
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && curtain) { curtain.classList.remove('is-leaving'); html.classList.add('is-loaded'); }
  });
  d.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-demo')) return;
    const url = new URL(a.href, location.href);
    if (url.protocol !== location.protocol || url.host !== location.host) return;
    if (!/\.html$|\/$/.test(url.pathname)) return;
    if (url.pathname === location.pathname) return; // same page anchors handled elsewhere
    if (!curtain || reduce) return;
    e.preventDefault();
    const inner = $('.curtain__in', curtain); if (inner) inner.style.display = 'none';
    curtain.style.transition = 'none';
    html.classList.remove('is-loaded');
    curtain.classList.add('is-leaving');
    setTimeout(() => { location.href = a.href; }, 640);
  });

  /* ---------- Header ---------- */
  const header = $('.header');
  let lastY = 0;
  const onScrollHeader = () => {
    const y = window.scrollY;
    if (!header) return;
    header.classList.toggle('is-scrolled', y > 8);
    const menuOpen = html.classList.contains('menu-open') || (mega && mega.classList.contains('is-open'));
    if (!menuOpen) header.classList.toggle('is-hidden', y > lastY && y > 420);
    lastY = y;
    const mbar = $('.mbar');
    if (mbar) mbar.classList.toggle('is-on', y > 520);
  };

  /* Mega menu */
  const mega = $('.mega');
  const megaBg = $('.mega-backdrop');
  const megaBtn = $('[data-mega]');
  let megaTimer;
  const setMega = (on) => {
    if (!mega) return;
    mega.classList.toggle('is-open', on);
    megaBg && megaBg.classList.toggle('is-open', on);
    megaBtn && megaBtn.setAttribute('aria-expanded', String(on));
    if (on) header.classList.remove('is-hidden');
  };
  if (megaBtn && mega) {
    megaBtn.addEventListener('click', (e) => { e.preventDefault(); setMega(!mega.classList.contains('is-open')); });
    const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
    if (fine) {
      megaBtn.addEventListener('mouseenter', () => { clearTimeout(megaTimer); megaTimer = setTimeout(() => setMega(true), 120); });
      megaBtn.addEventListener('mouseleave', () => { clearTimeout(megaTimer); megaTimer = setTimeout(() => setMega(false), 260); });
      mega.addEventListener('mouseenter', () => clearTimeout(megaTimer));
      mega.addEventListener('mouseleave', () => { megaTimer = setTimeout(() => setMega(false), 260); });
    }
    megaBg && megaBg.addEventListener('click', () => setMega(false));
    $$('a', mega).forEach((a) => a.addEventListener('click', () => setMega(false)));
  }

  /* Mobile menu */
  const burger = $('.burger');
  if (burger) {
    burger.addEventListener('click', () => {
      const on = !html.classList.contains('menu-open');
      html.classList.toggle('menu-open', on);
      burger.setAttribute('aria-expanded', String(on));
      lock(on);
      $$('.mmenu__a').forEach((a, i) => { a.style.transitionDelay = on ? (0.25 + i * 0.05) + 's' : '0s'; });
    });
    $$('.mmenu a').forEach((a) => a.addEventListener('click', () => {
      if (html.classList.contains('menu-open')) { html.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); lock(false); }
    }));
  }

  /* ---------- Modals ---------- */
  let lastFocus = null;
  const openModal = (id) => {
    const m = d.getElementById(id);
    if (!m || m.classList.contains('is-open')) return m;
    lastFocus = d.activeElement;
    m.classList.add('is-open');
    m.setAttribute('aria-hidden', 'false');
    lock(true);
    setTimeout(() => { const box = $('.modal__box', m); if (box) { box.setAttribute('tabindex', '-1'); box.focus({ preventScroll: true }); } }, 320);
    return m;
  };
  const closeModal = (m) => {
    if (!m || !m.classList.contains('is-open')) return;
    m.classList.remove('is-open');
    m.setAttribute('aria-hidden', 'true');
    lock(false);
    m.dispatchEvent(new CustomEvent('modal:close'));
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  };
  window.APIModal = { open: openModal, close: closeModal };
  d.addEventListener('click', (e) => {
    const c = e.target.closest('[data-close]');
    if (c) { e.preventDefault(); closeModal(c.closest('.modal')); }
  });
  d.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = $$('.modal.is-open');
    if (open.length) closeModal(open[open.length - 1]);
    else if (mega && mega.classList.contains('is-open')) setMega(false);
    else if (html.classList.contains('menu-open') && burger) burger.click();
  });

  /* Demo popup: any [data-demo] link or button */
  d.addEventListener('click', (e) => {
    const t = e.target.closest('[data-demo]');
    if (!t) return;
    e.preventDefault();
    const name = (t.getAttribute('data-demo') || t.textContent || '').replace(/\s+/g, ' ').trim();
    const m = d.getElementById('demo-modal');
    if (!m) return;
    const slot = $('[data-demo-name]', m);
    if (slot) slot.textContent = name || 'раздел';
    const openModals = $$('.modal.is-open');
    openModals.forEach((x) => { if (x !== m) closeModal(x); });
    openModal('demo-modal');
  });

  /* Lead popup: [data-lead] with optional product info */
  d.addEventListener('click', (e) => {
    const t = e.target.closest('[data-lead]');
    if (!t) return;
    e.preventDefault();
    const m = d.getElementById('lead-modal');
    if (!m) return;
    const topic = t.getAttribute('data-lead') || '';
    const form = $('form', m);
    if (form) {
      form.classList.remove('is-sent');
      const ti = $('input[name="topic"]', form); if (ti) ti.value = topic;
    }
    const title = $('[data-lead-title]', m);
    if (title) title.innerHTML = t.getAttribute('data-lead-title') || title.getAttribute('data-default');
    const box = $('.lead-box__prod', m);
    const prod = t.getAttribute('data-product');
    if (box) {
      if (prod) {
        try {
          const p = JSON.parse(prod);
          $('img', box).src = p.img; $('img', box).alt = p.name;
          $('b', box).textContent = p.name; $('span', box).textContent = p.meta || '';
          box.hidden = false;
          const pi = $('input[name="product"]', form); if (pi) pi.value = p.name;
        } catch (err) { box.hidden = true; }
      } else box.hidden = true;
    }
    $$('.modal.is-open').forEach((x) => { if (x !== m) closeModal(x); });
    openModal('lead-modal');
  });

  /* ---------- Forms: phone mask + validation (demo, без отправки) ---------- */
  const fmtPhone = (v) => {
    let x = v.replace(/^\s*\+7/, '').replace(/\D/g, '');
    if (!x) return v.trim() ? '+7 (' : '';
    if (x.length === 11 && (x[0] === '7' || x[0] === '8')) x = x.slice(1);
    x = ('7' + x).slice(0, 11);
    let out = '+7 (' + x.slice(1, 4);
    if (x.length >= 4) out += ')';
    if (x.length > 4) out += ' ' + x.slice(4, 7);
    if (x.length > 7) out += '-' + x.slice(7, 9);
    if (x.length > 9) out += '-' + x.slice(9, 11);
    return out;
  };
  $$('input[type="tel"]').forEach((inp) => {
    inp.addEventListener('input', () => { inp.value = fmtPhone(inp.value); });
    inp.addEventListener('focus', () => {
      if (!inp.value) inp.value = '+7 (';
      requestAnimationFrame(() => { const l = inp.value.length; try { inp.setSelectionRange(l, l); } catch (e) { /* noop */ } });
    });
    inp.addEventListener('blur', () => { if (inp.value.replace(/\D/g, '').length <= 1) inp.value = ''; });
  });
  $$('form.js-form').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      $$('[data-req]', form).forEach((inp) => {
        const field = inp.closest('.field');
        let valid = inp.value.trim().length >= 2;
        if (inp.type === 'tel') valid = inp.value.replace(/\D/g, '').length === 11;
        if (field) field.classList.toggle('is-error', !valid);
        if (!valid) ok = false;
      });
      const consent = $('input[name="consent"]', form);
      if (consent && !consent.checked) { ok = false; consent.closest('.consent').style.color = '#B4412D'; }
      if (!ok) { const bad = $('.is-error input', form); bad && bad.focus(); return; }
      const btn = $('button[type="submit"]', form);
      if (btn) { btn.disabled = true; $('.btn__t', btn) && ($('.btn__t', btn).textContent = 'отправляем…'); }
      setTimeout(() => {
        form.classList.add('is-sent');
        if (btn) { btn.disabled = false; $('.btn__t', btn) && ($('.btn__t', btn).textContent = btn.getAttribute('data-label') || 'отправить заявку'); }
      }, 700);
    });
    $$('[data-req]', form).forEach((inp) => inp.addEventListener('input', () => { const f = inp.closest('.field'); f && f.classList.remove('is-error'); }));
    const consent = $('input[name="consent"]', form);
    consent && consent.addEventListener('change', () => { consent.closest('.consent').style.color = ''; });
    const again = $('[data-again]', form);
    again && again.addEventListener('click', () => { form.reset(); form.classList.remove('is-sent'); });
  });

  /* ---------- Split headings into words ---------- */
  const splitEl = (el) => {
    let i = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/([ \t\n\r]+)/);
          const frag = d.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^[ \t\n\r]+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; }
            const w = d.createElement('span'); w.className = 'w';
            const s = d.createElement('span'); s.textContent = p; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR' && !n.classList.contains('w')) walk(n);
      });
    };
    walk(el);
  };
  $$('.split').forEach(splitEl);

  /* ---------- Stagger groups ---------- */
  $$('[data-stagger]').forEach((g) => {
    const step = parseFloat(g.getAttribute('data-stagger')) || 0.08;
    $$('[data-reveal], [data-reveal-img]', g).forEach((el, i) => { el.style.setProperty('--rd', (i * step).toFixed(2) + 's'); });
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('[data-reveal], [data-reveal-img], .split');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    // Элементы, скрытые собственным clip-path, наблюдаем через родителя:
    // IntersectionObserver учитывает clip-path цели и иначе не срабатывает.
    const imgTargets = new Map();
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        (imgTargets.get(en.target) || []).forEach((el) => el.classList.add('is-in'));
        io2.unobserve(en.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
    const start = () => revealEls.forEach((el) => {
      if (el.hasAttribute('data-reveal-img')) {
        const host = el.parentElement;
        if (!imgTargets.has(host)) imgTargets.set(host, []);
        imgTargets.get(host).push(el);
        io2.observe(host);
      } else io.observe(el);
    });
    if (html.classList.contains('is-loaded')) start(); else d.addEventListener('api:ready', start, { once: true });
  } else revealEls.forEach((el) => el.classList.add('is-in'));

  /* ---------- Counters ---------- */
  const counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const fmt = (n) => n.toLocaleString('ru-RU').replace(/,/g, ' ');
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io2.unobserve(en.target);
        const el = en.target; const to = parseFloat(el.getAttribute('data-count'));
        if (reduce) { el.textContent = fmt(to); return; }
        const dur = 1600; const t0 = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / dur); const e2 = 1 - Math.pow(1 - p, 4);
          el.textContent = fmt(Math.round(to * e2));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => io2.observe(c));
  }

  /* ---------- Parallax ---------- */
  const px = $$('[data-parallax]');
  const runParallax = () => {
    const vh = window.innerHeight;
    px.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const k = parseFloat(el.getAttribute('data-parallax')) || 0.1;
      const off = (r.top + r.height / 2 - vh / 2) * -k;
      el.style.transform = `translate3d(0,${off.toFixed(1)}px,0)`;
    });
  };

  /* ---------- Steps: active state ---------- */
  const steps = $$('.step');
  if (steps.length && 'IntersectionObserver' in window) {
    const io3 = new IntersectionObserver((entries) => {
      entries.forEach((en) => en.target.classList.toggle('is-active', en.isIntersecting));
    }, { rootMargin: '-40% 0px -45% 0px' });
    steps.forEach((s) => io3.observe(s));
  }

  /* ---------- Scroll loop ---------- */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { onScrollHeader(); if (!reduce && px.length) runParallax(); ticking = false; });
  };
  if (lenis) lenis.on('scroll', onScroll);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Anchor links ---------- */
  d.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-demo') || a.hasAttribute('data-lead')) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const el = d.querySelector(id);
    if (!el) return;
    e.preventDefault();
    scrollToEl(el);
  });

  /* ---------- Hero hotspots (object-fit: cover mapping) ---------- */
  const hsBox = $('.hero__media-box');
  if (hsBox) {
    const img = $('img', hsBox);
    const card = $('.hero__card');
    const spots = $$('.hs', hsBox);
    spots.forEach((s, i) => { s.style.setProperty('--i', i); $('.hs__btn', s).style.setProperty('--d', (i * 0.3) + 's'); });
    const place = () => {
      const W = hsBox.clientWidth; const H = hsBox.clientHeight;
      const iw = img.naturalWidth || 1653; const ih = img.naturalHeight || 952;
      const s = Math.max(W / iw, H / ih); const dw = iw * s; const dh = ih * s;
      const ox = (W - dw) / 2; const oy = (H - dh) / 2;
      const boxR = hsBox.getBoundingClientRect();
      const cr = card ? card.getBoundingClientRect() : null;
      const cardOver = cr && getComputedStyle(card).position === 'absolute';
      spots.forEach((sp) => {
        const x = ox + dw * parseFloat(sp.dataset.x) / 100;
        const y = oy + dh * parseFloat(sp.dataset.y) / 100;
        sp.style.left = x + 'px'; sp.style.top = y + 'px';
        let hide = x < 20 || x > W - 20 || y < 20 || y > H - 70;
        if (cardOver) {
          const cx = cr.left - boxR.left; const cy = cr.top - boxR.top;
          if (x > cx - 24 && x < cx + cr.width + 24 && y > cy - 24 && y < cy + cr.height + 24) hide = true;
        }
        sp.hidden = hide;
        sp.classList.toggle('hs--below', y < 230);
        sp.classList.toggle('hs--left', x > W - 150);
      });
    };
    if (img.complete) place(); else img.addEventListener('load', place);
    window.addEventListener('resize', place);
    d.addEventListener('api:ready', place);
    spots.forEach((sp) => {
      const btn = $('.hs__btn', sp);
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const on = !sp.classList.contains('is-open');
        spots.forEach((o) => o.classList.remove('is-open'));
        sp.classList.toggle('is-open', on);
        btn.setAttribute('aria-expanded', String(on));
      });
    });
    d.addEventListener('click', (e) => { if (!e.target.closest('.hs')) spots.forEach((o) => o.classList.remove('is-open')); });
  }

  /* ---------- Rails (horizontal sliders) ---------- */
  $$('.rail-wrap').forEach((wrap) => {
    const rail = $('.rail', wrap);
    if (!rail) return;
    const bar = $('.rail-progress i', wrap);
    const prev = $('[data-rail-prev]', wrap);
    const next = $('[data-rail-next]', wrap);
    const upd = () => {
      if (!bar) return;
      const w = rail.clientWidth / rail.scrollWidth;
      bar.style.width = (w * 100) + '%';
      bar.style.transform = `translateX(${(rail.scrollLeft / rail.clientWidth) * 100}%)`;
    };
    const stepW = () => { const f = rail.firstElementChild; return f ? f.getBoundingClientRect().width + 16 : 300; };
    prev && prev.addEventListener('click', () => rail.scrollBy({ left: -stepW(), behavior: 'smooth' }));
    next && next.addEventListener('click', () => rail.scrollBy({ left: stepW(), behavior: 'smooth' }));
    rail.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();
    // drag to scroll (mouse)
    let down = false; let sx = 0; let sl = 0; let moved = false;
    rail.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 6 && !moved) { moved = true; rail.classList.add('is-drag'); }
      if (moved) rail.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return; down = false;
      if (moved) { setTimeout(() => rail.classList.remove('is-drag'), 30); }
    });
    rail.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    rail.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.stopPropagation(); }, { passive: true });
  });

  /* ---------- Accordions with height animation ---------- */
  $$('details[data-acc]').forEach((det) => {
    const sum = $('summary', det);
    const body = det.querySelector(':scope > .acc__body, :scope > .fgroup__body');
    if (!sum || !body) return;
    sum.addEventListener('click', (e) => {
      if (reduce) return;
      e.preventDefault();
      if (det.open) {
        const h = body.scrollHeight;
        body.style.height = h + 'px'; body.style.overflow = 'hidden';
        requestAnimationFrame(() => { body.style.transition = 'height .5s cubic-bezier(.22,.8,.2,1)'; body.style.height = '0px'; });
        body.addEventListener('transitionend', function te() { det.open = false; body.removeAttribute('style'); body.removeEventListener('transitionend', te); });
      } else {
        det.open = true;
        const h = body.scrollHeight;
        body.style.height = '0px'; body.style.overflow = 'hidden';
        requestAnimationFrame(() => { body.style.transition = 'height .6s cubic-bezier(.22,.8,.2,1)'; body.style.height = h + 'px'; });
        body.addEventListener('transitionend', function te() { body.removeAttribute('style'); body.removeEventListener('transitionend', te); });
      }
    });
  });

  /* ---------- Reviews: expand ---------- */
  $$('.rcard').forEach((c) => {
    const t = $('.rcard__txt', c); const b = $('.rcard__more', c);
    if (!t || !b) return;
    const check = () => { b.hidden = c.classList.contains('is-open') ? false : t.scrollHeight <= t.clientHeight + 2; };
    check(); window.addEventListener('resize', check);
    d.fonts && d.fonts.ready.then(check);
    b.addEventListener('click', () => { const on = c.classList.toggle('is-open'); b.textContent = on ? 'свернуть' : 'читать полностью'; });
  });

  /* ---------- Cookie notice ---------- */
  const cookie = $('.cookie');
  if (cookie && !store.get('api-cookie')) {
    setTimeout(() => cookie.classList.add('is-on'), 2600);
    $('button', cookie).addEventListener('click', () => { cookie.classList.remove('is-on'); store.set('api-cookie', '1'); });
  }

  /* ---------- Year ---------- */
  $$('[data-year]').forEach((y) => { y.textContent = new Date().getFullYear(); });
})();
