/* BBQ Land — build
   Copies the site into dist/ and fills every `cms:NAME` region in the HTML
   and js/main.js from content/*.json (the files edited at /admin).

     node scripts/build.mjs             build dist/ (what Vercel deploys)
     node scripts/build.mjs --in-place  rewrite the committed HTML/JS instead,
                                        e.g. after pulling edits made in /admin

   The build stops with a readable error if the content is broken, so a bad
   edit fails its preview deploy instead of reaching the live site. */

import { readFileSync, writeFileSync, cpSync, rmSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as R from '../lib/render.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const inPlace = process.argv.includes('--in-place');
const out = inPlace ? root : join(root, 'dist');

// Everything the live site serves. Owner reference files and sources stay out.
const PUBLIC = ['css', 'js', 'images', 'media', 'menus', 'admin', 'robots.txt', 'sitemap.xml'];
const SKIP = [join(root, 'images', '_originals')];

const load = name => JSON.parse(readFileSync(join(root, 'content', `${name}.json`), 'utf8'));
const content = {
  lunch: load('menu-lunch'),
  grill: load('menu-grill'),
  kitchen: load('menu-kitchen'),
  sets: load('menu-sets'),
  drinks: load('menu-drinks'),
  hours: load('hours'),
};

/* ── Validation ───────────────────────────────────────── */

function validate({ lunch, grill, kitchen, sets, drinks, hours }) {
  const errors = [];
  const isPrice = n => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  const isUrl = u => !u || /^https:\/\/\S+$/.test(u);
  const isTime = t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t || '');

  [['Grill', grill], ['Kitchen', kitchen], ['Drinks & dessert', drinks]].forEach(([label, section]) => {
    (section.groups || []).forEach(g => {
      if (!g.title) errors.push(`${label}: a category has no name`);
      (g.items || []).forEach((d, i) => {
        const where = `${label} → ${g.title} → ${d.name || `dish #${i + 1}`}`;
        if (!d.name) errors.push(`${where}: missing name`);
        if (!isPrice(d.price)) errors.push(`${where}: price must be a number`);
        if (!isUrl(d.toastUrl)) errors.push(`${where}: Toast link must start with https://`);
      });
    });
  });
  [...lunch.combo.prices, ...(lunch.sets || [])].forEach(p => {
    if (!isPrice(p.price)) errors.push(`Lunch → ${p.label || p.title}: price must be a number`);
    if (p.was !== '' && p.was != null && !isPrice(p.was)) errors.push(`Lunch → ${p.label || p.title}: "was" price must be a number or empty`);
  });
  sets.sets.forEach(s => {
    if (!s.name) errors.push('Signature sets: a set has no name');
    if (!isPrice(s.price)) errors.push(`Signature sets → ${s.name}: price must be a number`);
    if (!isUrl(s.toastUrl)) errors.push(`Signature sets → ${s.name}: Toast link must start with https://`);
  });
  Object.entries(hours.days).forEach(([day, d]) => {
    if (d.closed) return;
    if (!isTime(d.open) || !isTime(d.close)) errors.push(`Hours → ${day}: needs an opening and closing time (or tick "Closed")`);
    else if (d.close <= d.open) errors.push(`Hours → ${day}: closing time must be after opening time`);
  });
  if (hours.grandOpening && !/^\d{4}-\d{2}-\d{2}$/.test(hours.grandOpening)) errors.push('Hours → grand opening: not a valid date');
  return errors;
}

const errors = validate(content);
if (errors.length) {
  console.error(`Content has ${errors.length} problem(s), nothing was built:\n  - ${errors.join('\n  - ')}`);
  process.exit(1);
}

/* ── Regions ──────────────────────────────────────────── */

const { lunch, grill, kitchen, sets, drinks, hours } = content;
const REGIONS = {
  'lunch-intro': () => R.esc(lunch.intro),
  'grill-intro': () => R.esc(grill.intro),
  'kitchen-intro': () => R.esc(kitchen.intro),
  'sets-intro': () => R.esc(sets.intro),
  'drinks-intro': () => R.esc(drinks.intro),
  lunch: () => R.lunchLines(lunch),
  grill: () => R.menuColumns(grill),
  kitchen: () => R.menuColumns(kitchen),
  sets: () => R.setCardLines(sets.sets),
  drinks: () => R.menuColumns(drinks),
  'set-prices': () => R.setPriceLines(sets.sets),
  'infobar-hours': () => R.infobarLines(hours),
  hours: () => R.mainJsHours(hours),
};

// <!-- cms:NAME --> … <!-- /cms:NAME -->, or /* cms:NAME */ … /* /cms:NAME */ in JS
const REGION = /(<!--|\/\*) cms:([\w-]+) (-->|\*\/)[\s\S]*?(<!--|\/\*) \/cms:\2 (-->|\*\/)/g;

// Python-style separators, matching how the structured data was first written
const ldJson = v => (Array.isArray(v) ? `[${v.map(ldJson).join(', ')}]`
  : v && typeof v === 'object' ? `{${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${ldJson(x)}`).join(', ')}}`
  : JSON.stringify(v));

function fill(text, file) {
  text = text.replace(REGION, (match, open, name, close, open2, close2, offset) => {
    if (!REGIONS[name]) throw new Error(`${file}: unknown region cms:${name}`);
    const value = REGIONS[name]();
    const start = `${open} cms:${name} ${close}`;
    const end = `${open2} /cms:${name} ${close2}`;
    if (typeof value === 'string') return start + value + end;
    const pad = text.slice(text.lastIndexOf('\n', offset) + 1, offset);
    return `${start}\n${value.map(l => (l ? pad + l : l)).join('\n')}\n${pad}${end}`;
  });
  text = text.replace(/(<table class="hours" data-hours( data-long)?>\n)([ \t]*)<tbody>[\s\S]*?<\/tbody>/g,
    (m, open, long, pad) => open + R.hoursTableLines(hours, Boolean(long)).map(l => pad + l).join('\n'));
  text = text.replace(/(<script type="application\/ld\+json">)(.*?)(<\/script>)/s, (m, open, json, close) => {
    const data = JSON.parse(json);
    data.openingHoursSpecification = R.openingHoursSpec(hours);
    return open + ldJson(data) + close;
  });
  return text;
}

/* ── Output ───────────────────────────────────────────── */

const pages = readdirSync(root).filter(f => f.endsWith('.html') && f !== 'BBQ Land Website.html');

if (!inPlace) {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out);
  pages.forEach(f => cpSync(join(root, f), join(out, f)));
  PUBLIC.filter(p => existsSync(join(root, p))).forEach(p => cpSync(join(root, p), join(out, p), {
    recursive: true,
    filter: src => !SKIP.some(s => src === s || src.startsWith(s + sep)),
  }));
  // The admin preview renders with the same code as the build
  cpSync(join(root, 'lib', 'render.js'), join(out, 'admin', 'render.js'));
}

const changed = [];
[...pages, join('js', 'main.js')].forEach(f => {
  // Git on Windows checks files out with CRLF; the patterns above expect \n
  const before = readFileSync(join(out, f), 'utf8').replace(/\r\n/g, '\n');
  const after = fill(before, f);
  if (after !== before) {
    writeFileSync(join(out, f), after);
    changed.push(f);
  }
});

console.log(inPlace
  ? (changed.length ? `Updated ${changed.join(', ')}` : 'Already up to date')
  : 'Built dist/ from content/');
