# BBQ Land — Where Fire Meets Flavor

Website for **BBQ Land, Asian Grill & Barbecue**: modern Asian yakiniku at
31 Boston Turnpike, Shrewsbury, MA. Plain HTML/CSS/JS, no build step to deploy.

## Pages

| Page         | File                | What's there |
|--------------|---------------------|--------------|
| Home         | `index.html`        | Grilling-video hero, visit & hours bar, the menu, signature sets, our standard, inside BBQ Land, Instagram, closing banner |
| Menu         | `menu.html`         | Printed dinner/lunch menus as images (+ PDF downloads), then every dish as text linking to its Toast item page: lunch, grill, kitchen, sets, drinks & dessert |
| Reservations | `reservations.html` | Reserve online (Toast) or by phone, order for pickup, live hours, directions, map |
| About        | `about.html`        | Story, motto, philosophy, our standard (brief Savenor's mention), the room |

`contact.html`, `drinks.html` and `savenors.html` are redirects to the pages
above, so old links and Google results keep working.

## Running locally

```bash
python -m http.server 8080
# then open http://localhost:8080
```

## Editing

- **Phone:** (508) 719-8105, in every page's header, footer and mobile call bar.
  Search for `5087198105` to find them all.
- **Hours** live in `HOURS` at the top of `js/main.js` (drives every hours table
  and the "Open now" line). Also update the static fallback tables in the HTML
  and `openingHoursSpecification` in `index.html` (that's what Google reads).
- **Grand opening** date is `GRAND_OPENING` in `js/main.js`. The hero shows
  "Soft opening now · Grand opening …", then "Grand opening today", then hides.
- **Menu** content is in `menu.html`. Each dish links to its own Toast item
  page; if an item is rebuilt in Toast its link changes. When the printed menu
  changes, replace the PDFs in `menus/` and re-export the images in
  `images/menus/` (e.g. `pdftoppm -r 220 -png menu.pdf out`, then resize).
- **The hours bar** under the home hero has the hours typed in directly; update
  it along with `HOURS`.
- **Instagram:** https://www.instagram.com/bbq_land_shrewsbury/

## File structure

```
bbqland/
├── index.html, menu.html, reservations.html, about.html
├── contact.html, drinks.html, savenors.html   # redirects
├── css/styles.css
├── js/main.js        # hours, header, mobile menu, hero video, menu tabs
├── images/           # see images/README.md
├── media/            # hero video (wide + tall) and poster frames
└── menus/            # printed dinner & lunch menus (PDF)
```

## Deploying

Upload the folder as-is to any static host (currently Vercel).
**Don't deploy until the owner has approved the redesign.**

## Search (Google)

- The official address is `https://www.bbqlandma.com`. Every page has a canonical tag.
- `sitemap.xml` lists the four pages; `robots.txt` points to it.
- `index.html` has Restaurant structured data (name, address, phone, hours,
  menu, Instagram). Keep the hours in sync with `HOURS` in `js/main.js`.
