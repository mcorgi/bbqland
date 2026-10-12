/* BBQ Land — site interactions
   Where Fire Meets Flavor · 火と旨味の、出会い */

/* ─────────────────────────────────────────────────────────────
   HOURS — the single source of truth for every hours table and
   the "Open now" line. Times are 24h "HH:MM", Eastern time.
   Use null for a closed day.

   Soft-opening hours (October 2026). These may change at the
   Oct 21 grand opening. `confirmed: true` turns on the live
   Open/Closed line; set it to false if the hours are in doubt.
   When hours change, also update the static hours tables in the
   HTML (shown if JavaScript is off) and openingHoursSpecification
   in the structured data in index.html (that's what Google reads).
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

// Grand opening, Eastern time. The hero line updates itself, then disappears a week after.
const GRAND_OPENING = '2026-10-21';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initDrawer();
  initReveal();
  initHours();
  initOpening();
  initHeroVideo();
  initMenuNav();
  initPrintedMenus();
  document.querySelectorAll('[data-year]').forEach(el => (el.textContent = new Date().getFullYear()));
});

/* Header turns solid once the page scrolls off the hero */
function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;
  let ticking = false;
  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
}

function initDrawer() {
  const toggle = document.querySelector('.menu-toggle');
  const drawer = document.getElementById('drawer');
  if (!toggle || !drawer) return;
  const set = open => {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    drawer.toggleAttribute('inert', !open);
  };
  set(false);
  toggle.addEventListener('click', () => set(!document.body.classList.contains('nav-open')));
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
      set(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', e => e.matches && set(false));
}

function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    items.forEach(el => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach(el => io.observe(el));
}

/* ── Hours ─────────────────────────────────────────────── */

// Current date and time in Shrewsbury, regardless of the visitor's time zone
function easternNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short',
    }).formatToParts(new Date()).map(p => [p.type, p.value])
  );
  const hour = Number(parts.hour) % 24;
  return {
    day: DAY_SHORT.indexOf(parts.weekday),
    minutes: hour * 60 + Number(parts.minute),
    date: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

const toMinutes = t => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 && h < 24 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`;
}

function formatRange([open, close]) {
  const a = formatTime(open);
  const b = formatTime(close);
  // "4 – 9 PM" when both sides share AM/PM, otherwise "11:30 AM – 10 PM"
  return a.slice(-2) === b.slice(-2) ? `${a.slice(0, -3)} – ${b}` : `${a} – ${b}`;
}

// Monday-first groups of consecutive days with identical hours
function hourGroups() {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const groups = [];
  order.forEach(d => {
    const key = JSON.stringify(HOURS.days[d]);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.days.push(d);
    else groups.push({ key, days: [d], hours: HOURS.days[d] });
  });
  return groups;
}

function initHours() {
  const now = easternNow();
  const groups = hourGroups();

  document.querySelectorAll('[data-hours]').forEach(table => {
    const long = table.hasAttribute('data-long');
    const names = long ? DAY_LONG : DAY_SHORT;
    const tbody = document.createElement('tbody');
    groups.forEach(g => {
      const first = names[g.days[0]];
      const last = names[g.days[g.days.length - 1]];
      const tr = document.createElement('tr');
      if (g.days.includes(now.day)) tr.className = 'is-today';
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = g.days.length > 1 ? `${first} – ${last}` : first;
      const td = document.createElement('td');
      td.textContent = g.hours ? formatRange(g.hours) : 'Closed';
      tr.append(th, td);
      tbody.append(tr);
    });
    table.querySelector('tbody')?.remove();
    table.append(tbody);
  });

  document.querySelectorAll('[data-status]').forEach(el => {
    if (!HOURS.confirmed) {
      el.hidden = true;
      return;
    }
    const today = HOURS.days[now.day];
    let text;
    let open = false;
    if (today && now.minutes >= toMinutes(today[0]) && now.minutes < toMinutes(today[1])) {
      open = true;
      text = `Open now · until ${formatTime(today[1])}`;
    } else if (today && now.minutes < toMinutes(today[0])) {
      text = `Closed · opens today at ${formatTime(today[0])}`;
    } else {
      let d = (now.day + 1) % 7;
      while (!HOURS.days[d] && d !== now.day) d = (d + 1) % 7;
      const next = HOURS.days[d];
      const when = d === (now.day + 1) % 7 ? 'tomorrow' : DAY_LONG[d];
      text = next ? `Closed · opens ${when} at ${formatTime(next[0])}` : 'Closed';
    }
    el.classList.add(open ? 'is-open' : 'is-closed');
    const label = el.querySelector('[data-status-text]') || el;
    label.textContent = text;
  });
}

/* "Grand opening Wednesday, Oct 21" → "Grand opening today" → hidden */
function initOpening() {
  const els = document.querySelectorAll('[data-opening]');
  if (!els.length) return;
  const today = easternNow().date;
  const daysUntil = Math.round((Date.parse(GRAND_OPENING + 'T12:00:00Z') - Date.parse(today + 'T12:00:00Z')) / 864e5);
  const label = new Date(GRAND_OPENING + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
  els.forEach(el => {
    if (daysUntil > 0) el.textContent = `Soft opening now · Grand opening ${label}`;
    else if (daysUntil === 0) el.textContent = 'Grand opening today';
    else if (daysUntil > -7) el.textContent = 'Now open';
    else el.hidden = true;
  });
}

/* ── Hero video ────────────────────────────────────────── */
function initHeroVideo() {
  const video = document.querySelector('[data-hero-video]');
  if (!video) return;
  const toggle = document.querySelector('[data-video-toggle]');
  const saveData = navigator.connection && navigator.connection.saveData;
  const tall = window.matchMedia('(max-aspect-ratio: 4/5)').matches;
  const src = tall ? video.dataset.srcTall : video.dataset.srcWide;

  const setLabel = playing => {
    if (!toggle) return;
    toggle.querySelector('[data-video-label]').textContent = playing ? 'Pause video' : 'Play video';
    toggle.querySelector('[data-icon-pause]').style.display = playing ? '' : 'none';
    toggle.querySelector('[data-icon-play]').style.display = playing ? 'none' : '';
  };

  const load = () => {
    if (!video.src) {
      video.src = src;
      video.load();
    }
  };
  const play = () => {
    load();
    const p = video.play();
    if (p && p.catch) p.catch(() => setLabel(false));
  };

  video.addEventListener('playing', () => {
    video.classList.add('is-playing');
    setLabel(true);
  });
  video.addEventListener('pause', () => setLabel(false));

  if (reduceMotion || saveData) {
    setLabel(false);
  } else {
    play();
  }

  toggle?.addEventListener('click', () => {
    if (video.paused) play();
    else video.pause();
  });
}

/* ── Menu: highlight the section in view ───────────────── */
function initMenuNav() {
  const nav = document.querySelector('.menu-nav');
  if (!nav || !('IntersectionObserver' in window)) return;
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const setActive = id => {
    links.forEach(a => {
      const on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('is-active', on);
      if (on) {
        a.setAttribute('aria-current', 'true');
        const strip = a.parentElement;
        const left = a.offsetLeft - strip.clientWidth / 2 + a.clientWidth / 2;
        strip.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
      } else {
        a.removeAttribute('aria-current');
      }
    });
  };
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => e.isIntersecting && setActive(e.target.id));
  }, { rootMargin: '-35% 0px -60% 0px' });
  sections.forEach(s => io.observe(s));
}

/* ── Menu: Dinner / Lunch switch for the printed menus ─── */
// Without JavaScript both printed menus simply show one after the other.
function initPrintedMenus() {
  const root = document.querySelector('[data-printed]');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const select = tab => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      select(next);
      next.focus();
    });
  });
  select(tabs[0]);
}
