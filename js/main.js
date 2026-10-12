/* BBQ Land — site interactions
   Where Fire Meets Flavor · 火と旨味の、出会い */

/* ─────────────────────────────────────────────────────────────
   HOURS — the single source of truth for every hours table and
   the "Open now" badge. Times are 24h "HH:MM", Eastern time.
   Use null for a closed day. Close after midnight like "24:00".

   Soft-opening hours (October 2026). These may change at the
   Oct 21 grand opening. `confirmed: true` turns on the live
   Open/Closed badge; set it to false if the hours are in doubt.
   ───────────────────────────────────────────────────────────── */
const HOURS = {
  confirmed: true,
  // Index 0 = Sunday (matches Date.getDay())
  days: [
    ['11:30', '22:00'], // Sunday
    ['16:00', '21:00'], // Monday
    ['16:00', '21:00'], // Tuesday
    ['16:00', '21:00'], // Wednesday
    ['16:00', '21:00'], // Thursday
    ['16:00', '22:00'], // Friday
    ['11:30', '22:00'], // Saturday
  ],
};

// Grand opening, Eastern time. The banner and hero line update themselves.
const GRAND_OPENING = '2026-10-21';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const isDev = ['localhost', '127.0.0.1', ''].includes(location.hostname);

document.documentElement.classList.toggle('is-dev', isDev);

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const money = n => '$' + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '');

/* One rAF-throttled scroll loop that every scroll effect hooks into */
const scrollHandlers = [];
function onScrollFrame(fn) {
  scrollHandlers.push(fn);
  fn();
}
(() => {
  let ticking = false;
  const run = () => {
    scrollHandlers.forEach(fn => fn());
    ticking = false;
  };
  const request = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(run);
    }
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
})();

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initProgress();
  initImages();
  initSplitTitles();
  initReveal();
  initHero();
  initManifesto();
  initTilt();
  initMagnetic();
  initCounters();
  initFavs();
  initSets();
  initHours();
  initOpening();
  initMenu();
  initLightbox();
  initParallaxBits();
  initToTop();
  document.querySelectorAll('[data-year]').forEach(el => (el.textContent = new Date().getFullYear()));
});

/* ── Navigation: solid on scroll, hides going down, returns going up ── */

function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  if (nav) {
    let lastY = window.scrollY;
    onScrollFrame(() => {
      const y = window.scrollY;
      nav.classList.toggle('nav--scrolled', y > 40);
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;
      if (goingDown && y > 500 && !document.body.classList.contains('nav-open')) nav.classList.add('nav--hidden');
      if (goingUp || y < 200) nav.classList.remove('nav--hidden');
      lastY = y;
    });
  }

  if (toggle && links) {
    const setOpen = open => {
      toggle.classList.toggle('open', open);
      links.classList.toggle('open', open);
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(!links.classList.contains('open')));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', e => e.key === 'Escape' && setOpen(false));
  }
}

function initProgress() {
  const bar = document.createElement('div');
  bar.className = 'progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  onScrollFrame(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--progress', max > 0 ? clamp(window.scrollY / max) : 0);
  });
}

/* ── Images fade in once loaded ── */

function initImages() {
  document.querySelectorAll('.media > img, .hero__media img').forEach(img => {
    const done = () => img.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) done();
    else {
      img.addEventListener('load', done);
      img.addEventListener('error', () => {
        img.classList.add('is-loaded');
        if (isDev) console.warn('Missing image:', img.getAttribute('src'));
      });
    }
  });
}

/* ── Titles rise word by word ── */

function initSplitTitles() {
  if (reduceMotion) return;
  document.querySelectorAll('.split-title').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
              return;
            }
            const mask = document.createElement('span');
            mask.className = 'wm';
            const inner = document.createElement('span');
            inner.style.setProperty('--i', i++);
            inner.textContent = part;
            mask.appendChild(inner);
            frag.appendChild(mask);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
    el.classList.add('reveal-only');
  });
}

/* ── Scroll reveal ── */

function initReveal() {
  const els = document.querySelectorAll('.reveal, .split-title, .brush.paint, .footer__slogan');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    els.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  els.forEach(el => io.observe(el));
}

/* ── Hero: embers rising over the storefront ── */

function initHero() {
  const hero = document.querySelector('.hero');
  const canvas = hero && hero.querySelector('.hero__embers');
  if (canvas && !reduceMotion) embers(canvas, hero);
}

function embers(canvas, host) {
  const ctx = canvas.getContext('2d');
  let w, h, particles, running = true;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const spawn = (initial = false) => ({
    x: Math.random() * w,
    y: initial ? Math.random() * h : h + 10,
    r: Math.random() * 1.8 + 0.4,
    vy: Math.random() * 0.7 + 0.3,
    vx: (Math.random() - 0.5) * 0.25,
    sway: Math.random() * Math.PI * 2,
    life: Math.random() * 0.5 + 0.5,
  });

  resize();
  particles = Array.from({ length: Math.round(Math.min(80, w / 16)) }, () => spawn(true));
  window.addEventListener('resize', resize);

  // Embers drift toward the cursor a little
  let mx = null;
  host.addEventListener('pointermove', e => (mx = e.clientX));
  host.addEventListener('pointerleave', () => (mx = null));

  const tick = () => {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of particles) {
      p.sway += 0.02;
      p.y -= p.vy;
      p.x += p.vx + Math.sin(p.sway) * 0.3 + (mx !== null ? (mx - p.x) * 0.0008 : 0);
      const fade = clamp(p.y / h) * p.life;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      g.addColorStop(0, `rgba(255, 180, 100, ${0.95 * fade})`);
      g.addColorStop(0.4, `rgba(236, 59, 64, ${0.45 * fade})`);
      g.addColorStop(1, 'rgba(236, 59, 64, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fill();
      if (p.y < -10) Object.assign(p, spawn());
    }
    requestAnimationFrame(tick);
  };
  tick();

  new IntersectionObserver(([entry]) => {
    const was = running;
    running = entry.isIntersecting;
    if (running && !was) tick();
  }).observe(host);
}

/* ── Manifesto: each word lights up as you read down ── */

function initManifesto() {
  const el = document.querySelector('[data-words]');
  if (!el) return;
  const words = [];
  const walk = (node, hl) => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(part));
          const s = document.createElement('span');
          s.className = 'w' + (hl ? ' hl' : '');
          s.textContent = part;
          words.push(s);
          frag.appendChild(s);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) {
        walk(child, hl || child.hasAttribute('data-hl'));
      }
    });
  };
  walk(el, false);
  if (reduceMotion) {
    words.forEach(w => w.classList.add('lit'));
    return;
  }
  onScrollFrame(() => {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35));
    const n = Math.round(p * words.length * 1.15);
    words.forEach((w, i) => w.classList.toggle('lit', i < n));
  });
}

/* ── 3D tilt + spotlight on cards ── */

function initTilt() {
  if (!finePointer || reduceMotion) return;
  document.querySelectorAll('[data-tilt]').forEach(card => {
    const max = Number(card.dataset.tilt) || 6;
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', `${((x - 0.5) * max).toFixed(2)}deg`);
      card.style.setProperty('--rx', `${((0.5 - y) * max).toFixed(2)}deg`);
      card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}

/* ── Magnetic buttons ── */

function initMagnetic() {
  if (!finePointer || reduceMotion) return;
  document.querySelectorAll('[data-magnetic]').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.22}px, ${dy * 0.35}px)`;
    });
    el.addEventListener('pointerleave', () => (el.style.transform = ''));
  });
}

/* ── Count-up numbers ── */

function initCounters() {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;
  const run = el => {
    const to = Number(el.dataset.count);
    const from = Number(el.dataset.from || 0);
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) return (el.textContent = to + suffix);
    const start = performance.now();
    const dur = 1600;
    const step = now => {
      const t = clamp((now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = Math.round(from + (to - from) * eased) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        run(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.6 });
  els.forEach(el => io.observe(el));
}

/* ── Favorites: hovering a dish swaps the photo ── */

function initFavs() {
  const root = document.querySelector('[data-favs]');
  if (!root) return;
  const rows = [...root.querySelectorAll('[data-photo]')];
  const imgs = [...root.querySelectorAll('.favs__stage img')];
  const cap = root.querySelector('.favs__stage .media__cap');
  const show = row => {
    rows.forEach(r => r.classList.toggle('on', r === row));
    imgs.forEach(img => img.classList.toggle('on', img.dataset.key === row.dataset.photo));
    const img = imgs.find(i => i.dataset.key === row.dataset.photo);
    if (cap && img) cap.textContent = img.alt;
  };
  rows.forEach(row => {
    row.addEventListener('mouseenter', () => show(row));
    row.addEventListener('focus', () => show(row));
    row.addEventListener('click', () => show(row));
  });
  show(rows[0]);
}

/* ── Sets: party-size toggle ── */

function initSets() {
  const root = document.querySelector('[data-sets]');
  if (!root) return;
  const buttons = [...root.querySelectorAll('[data-party]')];
  const thumb = root.querySelector('.sets__thumb');

  const select = (btn, animate = true) => {
    const party = Number(btn.dataset.party);
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    if (thumb) {
      thumb.style.width = `${btn.offsetWidth}px`;
      thumb.style.transform = `translateX(${btn.offsetLeft}px)`;
    }
    root.querySelectorAll('[data-price-2]').forEach(card => {
      const price = Number(card.getAttribute(`data-price-${party}`));
      card.querySelector('[data-amount]').innerHTML = animate ? `<span class="flip-num">$${price}</span>` : `$${price}`;
      card.querySelector('[data-pp]').innerHTML = `for ${party} guests<br><strong>${money(price / party)}</strong> per person`;
    });
  };

  buttons.forEach(b => b.addEventListener('click', () => select(b)));
  const current = () => buttons.find(b => b.getAttribute('aria-pressed') === 'true') || buttons[0];
  select(current(), false);
  window.addEventListener('resize', () => select(current(), false));
  document.fonts && document.fonts.ready.then(() => select(current(), false));
}

/* ── Grand opening countdown in the banner + hero ── */

function initOpening() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  const days = Math.round((Date.parse(GRAND_OPENING) - Date.parse(today)) / 86400000);
  const banner = document.querySelector('[data-banner]');
  const hero = document.querySelector('[data-opening]');
  let bannerHTML, heroText;
  if (days > 1) {
    bannerHTML = `Now in soft opening<span class="soft-opening__extra"> &middot; Grand opening Wednesday, October 21 &middot; ${days} days to go</span>`;
    heroText = `Grand opening Wednesday, October 21 · ${days} days to go`;
  } else if (days === 1) {
    bannerHTML = 'Grand opening tomorrow<span class="soft-opening__extra"> &middot; Wednesday, October 21</span>';
    heroText = 'Grand opening tomorrow · Wednesday, October 21';
  } else if (days === 0) {
    bannerHTML = 'Grand opening today!<span class="soft-opening__extra"> &middot; Come celebrate with us</span>';
    heroText = 'Grand opening today · Come celebrate with us';
  } else {
    bannerHTML = 'Now open<span class="soft-opening__extra"> &middot; Asian Grill &amp; Barbecue on Route 9</span>';
    heroText = '';
  }
  if (banner) banner.innerHTML = bannerHTML;
  if (hero) {
    hero.textContent = heroText;
    hero.hidden = !heroText;
  }
}

/* ── Hours & open status ── */

function toMinutes(t) {
  const [hh, mm] = t.split(':').map(Number);
  return hh * 60 + mm;
}

function formatTime(t) {
  let [hh, mm] = t.split(':').map(Number);
  if (hh === 24 || hh === 0) return 'Midnight';
  if (hh === 12 && mm === 0) return 'Noon';
  const suffix = hh >= 12 ? 'PM' : 'AM';
  hh = hh % 12 || 12;
  return `${hh}${mm ? ':' + String(mm).padStart(2, '0') : ''} ${suffix}`;
}

function easternNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date());
  const get = type => parts.find(p => p.type === type).value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
}

function initHours() {
  const { day, minutes } = easternNow();

  document.querySelectorAll('[data-hours]').forEach(table => {
    const order = [1, 2, 3, 4, 5, 6, 0];
    table.innerHTML = order
      .map(d => {
        const hrs = HOURS.days[d];
        const text = hrs ? `${formatTime(hrs[0])} – ${formatTime(hrs[1])}` : 'Closed';
        return `<tr class="${d === day ? 'is-today' : ''}"><td>${DAY_NAMES[d]}</td><td>${text}</td></tr>`;
      })
      .join('');
  });

  document.querySelectorAll('[data-status]').forEach(el => {
    if (!HOURS.confirmed) {
      el.className = 'status';
      el.textContent = 'Soft opening · Call ahead';
      return;
    }
    const today = HOURS.days[day];
    const open = today && minutes >= toMinutes(today[0]) && minutes < toMinutes(today[1]);
    el.className = `status ${open ? 'status--open' : 'status--closed'}`;
    if (open) {
      el.textContent = `Open now · until ${formatTime(today[1])}`;
      return;
    }
    for (let i = 0; i < 7; i++) {
      const d = (day + i) % 7;
      const hrs = HOURS.days[d];
      if (!hrs || (i === 0 && minutes >= toMinutes(hrs[0]))) continue;
      el.textContent = `Closed · opens ${i === 0 ? '' : i === 1 ? 'tomorrow ' : DAY_NAMES[d] + ' '}${formatTime(hrs[0])}`;
      break;
    }
  });
}

/* ── Menu: scroll-spy tabs, live search, chef/veg filters ── */

function initMenu() {
  const tabs = document.querySelector('.menu-tabs');
  const search = document.getElementById('menuSearch');
  const filterBtns = [...document.querySelectorAll('[data-filter]')];
  if (!tabs && !search) return;

  const links = tabs ? [...tabs.querySelectorAll('a')] : [];
  const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  let activeId = null;

  if (sections.length) {
    onScrollFrame(() => {
      let current = sections[0].id;
      for (const s of sections) {
        if (!s.hidden && s.getBoundingClientRect().top - 220 <= 0) current = s.id;
      }
      if (current === activeId) return;
      activeId = current;
      links.forEach(a => {
        const on = a.getAttribute('href') === `#${current}`;
        a.classList.toggle('active', on);
        if (on) tabs.scrollTo({ left: a.offsetLeft - tabs.clientWidth / 2 + a.offsetWidth / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
  }

  const items = [...document.querySelectorAll('[data-menu-item]')];
  items.forEach(item => {
    item._nameHTML = item.querySelector('.menu-item__name').innerHTML;
    item._text = item.textContent.toLowerCase().replace(/\s+/g, ' ');
    item._tags = (item.dataset.tags || '').split(' ');
  });
  const empty = document.querySelector('.menu-empty');
  let filter = 'all';

  const apply = () => {
    const q = search ? search.value.trim().toLowerCase() : '';
    let shown = 0;
    items.forEach(item => {
      const match = (!q || item._text.includes(q)) && (filter === 'all' || item._tags.includes(filter));
      item.hidden = !match;
      const name = item.querySelector('.menu-item__name');
      name.innerHTML = item._nameHTML;
      if (match && q) highlight(name, q);
      if (match) shown++;
    });
    const narrowing = Boolean(q) || filter !== 'all';
    document.querySelectorAll('[data-menu-section]').forEach(sec => {
      sec.hidden = !sec.querySelector('[data-menu-item]:not([hidden])');
    });
    document.querySelectorAll('[data-menu-group]').forEach(group => {
      group.hidden = narrowing && !group.querySelector('[data-menu-section]:not([hidden])');
    });
    if (empty) {
      empty.classList.toggle('show', shown === 0);
      const span = empty.querySelector('span');
      if (span) span.textContent = search ? search.value : '';
    }
  };

  search && search.addEventListener('input', apply);
  filterBtns.forEach(btn =>
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      filterBtns.forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', String(on));
      filter = on ? btn.dataset.filter : 'all';
      apply();
    })
  );
}

function highlight(el, q) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const idx = node.textContent.toLowerCase().indexOf(q);
    if (idx === -1) return;
    const mark = document.createElement('mark');
    const after = node.splitText(idx);
    after.splitText(q.length);
    mark.textContent = after.textContent;
    after.replaceWith(mark);
  });
}

/* ── Gallery lightbox ── */

function initLightbox() {
  const triggers = [...document.querySelectorAll('[data-lightbox]')];
  if (!triggers.length) return;

  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Photo viewer');
  box.innerHTML = `
    <img alt="">
    <button class="lightbox__btn lightbox__close" aria-label="Close">&times;</button>
    <button class="lightbox__btn lightbox__prev" aria-label="Previous photo">&#8249;</button>
    <button class="lightbox__btn lightbox__next" aria-label="Next photo">&#8250;</button>
    <p class="lightbox__caption"></p>`;
  document.body.appendChild(box);

  const view = box.querySelector('img');
  const caption = box.querySelector('.lightbox__caption');
  let index = 0;
  let lastFocus = null;

  const show = i => {
    index = (i + triggers.length) % triggers.length;
    const img = triggers[index].querySelector('img');
    view.src = triggers[index].dataset.lightbox || img.src;
    view.alt = img.alt;
    caption.textContent = img.alt;
  };
  const open = i => {
    lastFocus = document.activeElement;
    show(i);
    box.classList.add('open');
    document.body.style.overflow = 'hidden';
    box.querySelector('.lightbox__close').focus();
  };
  const close = () => {
    box.classList.remove('open');
    document.body.style.overflow = '';
    lastFocus && lastFocus.focus();
  };

  triggers.forEach((t, i) => t.addEventListener('click', () => open(i)));
  box.querySelector('.lightbox__close').addEventListener('click', close);
  box.querySelector('.lightbox__prev').addEventListener('click', () => show(index - 1));
  box.querySelector('.lightbox__next').addEventListener('click', () => show(index + 1));
  box.addEventListener('click', e => e.target === box && close());

  // Swipe on touch screens
  let sx = null;
  box.addEventListener('touchstart', e => (sx = e.touches[0].clientX), { passive: true });
  box.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    sx = null;
  });

  document.addEventListener('keydown', e => {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
}

/* ── Small scroll-linked touches ── */

function initParallaxBits() {
  if (reduceMotion) return;
  const hero = document.querySelector('.page-hero');
  const timeline = document.querySelector('.timeline');
  const tItems = timeline ? [...timeline.querySelectorAll('.timeline__item')] : [];
  const seals = [...document.querySelectorAll('.cta-band__seal')];

  onScrollFrame(() => {
    const vh = window.innerHeight;
    if (hero) hero.style.setProperty('--hp', clamp(window.scrollY / hero.offsetHeight).toFixed(3));
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const tp = clamp((vh * 0.75 - r.top) / (r.width > 0 ? vh * 0.5 : 1));
      timeline.style.setProperty('--tp', tp.toFixed(3));
      tItems.forEach((item, i) => item.classList.toggle('lit', tp >= i / Math.max(1, tItems.length - 1) - 0.02));
    }
    seals.forEach(seal => {
      const r = seal.parentElement.getBoundingClientRect();
      seal.style.setProperty('--sr', `${((r.top - vh / 2) * -0.06).toFixed(1)}deg`);
    });
  });
}

/* ── Back to top ── */

function initToTop() {
  const btn = document.createElement('button');
  btn.className = 'to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  document.body.appendChild(btn);
  onScrollFrame(() => btn.classList.toggle('show', window.scrollY > window.innerHeight * 1.5));
}
