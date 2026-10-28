/* BBQ Land — turns content/*.json into the site's HTML.
   Shared by scripts/build.mjs (at deploy) and admin/preview.js (the live
   preview in /admin), so keep it free of Node or browser imports.
   Every function returns an array of lines (indented relative to the
   region they fill) or, for one-line regions, a string. */

export const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const price = n => String(Number(n));
const indent = (lines, by = '  ') => lines.map(l => by + l);

const CHEF_MARK = '<span class="mark" title="Chef\'s recommendation"><span class="sr-only">Chef\'s recommendation</span></span>';
const VEG_MARK = '<span class="mark mark--veg" title="Vegetarian"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3 13C3 7 7 3 13 3c0 6-4 10-10 10z"/><path d="M3 13l6-6"/></svg><span class="sr-only">Vegetarian</span></span>';
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>';

/* ── Menu: grill, kitchen, drinks ─────────────────────── */

function dishLines(d) {
  const marks = (d.vegetarian ? VEG_MARK : '') + (d.chefsPick ? CHEF_MARK : '');
  const note = d.priceNote ? `<small>${esc(d.priceNote)}</small>` : '';
  const body = `<span class="dish__code">${esc(d.code)}</span><h4 class="dish__name">${esc(d.name)}${marks}</h4><span class="dish__price">${price(d.price)}${note}</span>`;
  const [open, close] = d.toastUrl
    ? [`<a class="dish dish--order" href="${esc(d.toastUrl)}" target="_blank" rel="noopener" aria-label="Order ${esc(d.name)} on Toast (opens in a new tab)">`,
      '<span class="dish__order" aria-hidden="true">Order ↗</span></a>']
    : ['<div class="dish">', '</div>'];
  if (!d.description) return [open + body + close];
  return [open + body, `  <p class="dish__desc">${esc(d.description)}</p>${close}`];
}

function groupLines(g) {
  return [
    '<div class="menu-group">',
    `  <h3>${esc(g.title)}</h3>`,
    ...indent((g.items || []).flatMap(dishLines)),
    '</div>',
  ];
}

// The two columns inside .menu-cols; each category says which column it sits in
export function menuColumns(section) {
  const groups = section.groups || [];
  return ['left', 'right'].flatMap(col => [
    '<div>',
    ...groups.filter(g => (g.column || 'left') === col).flatMap(groupLines),
    '</div>',
  ]);
}

/* ── Lunch specials ───────────────────────────────────── */

const dealPrice = (now, was) => `$${price(now)}${was !== '' && was != null ? `<span class="was">$${price(was)}</span>` : ''}`;

export function lunchLines(lunch) {
  const c = lunch.combo;
  const rows = [];
  for (let i = 0; i < c.items.length; i += 4) rows.push(c.items.slice(i, i + 4).map(item => `<li>${esc(item)}</li>`).join(''));
  const setLines = (lunch.sets || []).flatMap(s => {
    const choices = s.choices ? `<b>Choose one:</b> ${esc(s.choices.replace(/\.\s*$/, ''))}. ` : '';
    return [
      '<div class="lunch-set">',
      `  <div class="lunch-set__top"><h3>${esc(s.title)}</h3><strong>${dealPrice(s.price, s.was)}</strong></div>`,
      `  <p>${choices}${esc(s.servedWith)}</p>`,
      '</div>',
    ];
  });
  return [
    '<div class="lunch-grid">',
    '  <div class="lunch-combo">',
    ...(c.badge ? [`    <span class="chip">${esc(c.badge)}</span>`] : []),
    `    <h3>${esc(c.title)}</h3>`,
    ...(c.note ? [`    <p class="note">${esc(c.note)}</p>`] : []),
    '    <div class="lunch-prices">',
    ...c.prices.map(p => `      <div><span>${esc(p.label)}</span><strong>${dealPrice(p.price, p.was)}</strong></div>`),
    '    </div>',
    '    <ul class="lunch-items">',
    ...indent(rows, '      '),
    '    </ul>',
    ...(c.footnote ? [`    <p class="note" style="margin-top:20px">${esc(c.footnote)}</p>`] : []),
    '  </div>',
    '  <div class="lunch-side">',
    ...indent(setLines, '    '),
    '  </div>',
    '</div>',
  ];
}

/* ── Signature sets ───────────────────────────────────── */

const setTitle = s => `${esc(s.name)}${s.size ? ` <small>${esc(s.size)}</small>` : ''}`;
const listItems = items => (items || []).map(i => `<li>${esc(i)}</li>`).join('');

export function setCardLines(sets) {
  return sets.flatMap((s, i) => [
    `<article class="set-card reveal" style="--d: ${(i * 0.06).toFixed(2)}s">`,
    `  <div class="set-card__top"><h3>${setTitle(s)}</h3><span class="set-card__price">$${price(s.price)}</span></div>`,
    '  <div class="set-card__cols">',
    `    <div><h4>For the Grill</h4><ul>${listItems(s.grill)}</ul></div>`,
    `    <div><h4>From the Kitchen</h4><ul>${listItems(s.kitchen)}</ul></div>`,
    '  </div>',
    ...(s.toastUrl ? [`  <a class="link set-card__order" href="${esc(s.toastUrl)}" target="_blank" rel="noopener">Order this set on Toast ${ARROW}</a>`] : []),
    '</article>',
  ]);
}

// The short price list on the home page
export function setPriceLines(sets) {
  return sets.map(s => `<li><span>${esc([s.name, s.size].filter(Boolean).join(' '))}</span><span class="leader"></span><span>$${price(s.price)}</span></li>`);
}

/* ── Hours ────────────────────────────────────────────── */

// Monday first, matching how the site lists hours
const WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const SHORT = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
const LONG = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' };

const dayHours = d => (d.closed ? null : [d.open, d.close]);

// Runs of consecutive days with identical hours
export function hourGroups(hours) {
  const groups = [];
  WEEK.forEach(day => {
    const h = dayHours(hours.days[day]);
    const last = groups[groups.length - 1];
    if (last && JSON.stringify(last.hours) === JSON.stringify(h)) last.days.push(day);
    else groups.push({ days: [day], hours: h });
  });
  return groups;
}

const dayLabel = (days, names) => (days.length > 1 ? `${names[days[0]]} – ${names[days[days.length - 1]]}` : names[days[0]]);

function formatTime(t, withMinutes) {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 && h < 24 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m || withMinutes ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`;
}

// Same wording js/main.js produces: "11:30 AM – 9 PM", "4 – 9 PM"
function formatRange(hours) {
  if (!hours) return 'Closed';
  const a = formatTime(hours[0]);
  const b = formatTime(hours[1]);
  return a.slice(-2) === b.slice(-2) ? `${a.slice(0, -3)} – ${b}` : `${a} – ${b}`;
}

// Static fallback for <table class="hours" data-hours> (main.js redraws it)
export function hoursTableLines(hours, long) {
  return [
    '<tbody>',
    ...hourGroups(hours).map(g => `  <tr><th scope="row">${dayLabel(g.days, long ? LONG : SHORT)}</th><td>${formatRange(g.hours)}</td></tr>`),
    '</tbody>',
  ];
}

// The two hours cells in the bar under the home hero: the first run of days,
// then everything else together ("Fri – Sun")
export function infobarLines(hours) {
  const full = h => (h ? `${formatTime(h[0], true)} – ${formatTime(h[1], true)}` : 'Closed');
  const item = (title, body) => ['<div class="infobar__item">', `  <h2>${title}</h2>`, `  <p>${body}</p>`, '</div>'];
  const [first, ...rest] = hourGroups(hours);
  const lines = item(dayLabel(first.days, SHORT), full(first.hours));
  if (rest.length === 1) lines.push(...item(dayLabel(rest[0].days, SHORT), full(rest[0].hours)));
  else if (rest.length > 1) {
    lines.push(...item(
      `${SHORT[rest[0].days[0]]} – ${SHORT[rest[rest.length - 1].days.slice(-1)[0]]}`,
      rest.map(g => `${dayLabel(g.days, SHORT)} ${full(g.hours)}`).join('<br />'),
    ));
  }
  return lines;
}

// openingHoursSpecification for the structured data Google reads
export function openingHoursSpec(hours) {
  return hourGroups(hours).filter(g => g.hours).map(g => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: g.days.length > 1 ? g.days.map(d => LONG[d]) : LONG[g.days[0]],
    opens: g.hours[0],
    closes: g.hours[1],
  }));
}

// The HOURS and GRAND_OPENING constants at the top of js/main.js
export function mainJsHours(hours) {
  const sundayFirst = ['sunday', ...WEEK.slice(0, 6)];
  return [
    'const HOURS = {',
    `  confirmed: ${Boolean(hours.showOpenNow)},`,
    '  // Index 0 = Sunday (matches Date.getDay())',
    '  days: [',
    ...sundayFirst.map(day => {
      const h = dayHours(hours.days[day]);
      return `    ${h ? `['${h[0]}', '${h[1]}']` : 'null'}, // ${LONG[day]}`;
    }),
    '  ],',
    '};',
    '',
    '// Grand opening, Eastern time. The hero line updates itself, then disappears a week after.',
    `const GRAND_OPENING = ${hours.grandOpening ? `'${hours.grandOpening}'` : 'null'};`,
  ];
}
