# BBQ Land — Where Fire Meets Flavor

Website for **BBQ Land, Asian Grill & Barbecue**: modern Asian yakiniku at
31 Boston Turnpike, Shrewsbury, MA. Plain HTML/CSS/JS, no build step to deploy.

## Pages

| Page       | File            | What's there |
|------------|-----------------|--------------|
| Home       | `index.html`    | Storefront hero, manifesto, philosophy, Savenor's, sets, favorites, gallery, visit, careers |
| About      | `about.html`    | Story, motto, philosophy, Savenor's summary, timeline, feedback |
| Savenor's  | `savenors.html` | Dedicated page on our butcher: history, Julia Child, why it matters, beef highlights |
| Menu       | `menu.html`     | Full Toast menu with chef's picks / vegetarian filters and search |
| Drinks     | `drinks.html`   | Non-alcoholic drinks; bar "coming soon" (no liquor license yet) |
| Visit      | `contact.html`  | Call / reserve / order / directions, hours, map |

## Running locally

```bash
python -m http.server 8080
# then open http://localhost:8080
```

Opening the HTML file directly mostly works, but the brush-stroke mask needs a
server. On `localhost` you'll also see orange **DEV NOTE** boxes for things
that still need input; they're hidden on the live site.

## Before going live

- **Grand opening: Wednesday, Oct 21, 2026.** The red banner and the line under
  the hero count down automatically, then switch to "Grand opening today!" and
  "Now open". The date is `GRAND_OPENING` in `js/main.js`.
- **Hours may change at the grand opening.** Edit the `HOURS` block at the top of `js/main.js`.
  Current soft-opening hours: Mon–Thu 4–9 PM, Fri 4–10 PM, Sat–Sun 11:30 AM–10 PM.
  The live "Open now / Closed" badge is on (`confirmed: true`); set it to false if the hours are in doubt.
- **Distributor.** On `about.html`, fill in the `[Distributor name]` card and
  remove its `dev-only` class.
- **Set contents.** Meat Lover / Chef's Selection descriptions are general,
  because what's in each set isn't published yet.
- **Logo.** Currently cut from a photo of the business card. Swap in the
  original artwork if available (see `images/README.md`).

## Editing content

Menu content lives in `menu.html` and `drinks.html`. Hours live only in
`js/main.js`. Links (Toast order/reserve, phone, Facebook, Indeed) are plain
`href`s in each page.

All ordering goes straight to Toast. Toast doesn't let outside websites
pre-fill a cart, so the site links to the Toast menu rather than keeping its
own cart.

## Interactive bits

- Embers rising over the storefront hero
- Manifesto that lights up word by word as you read
- Party-size toggle on sets (with per-person price), hover-to-preview favorites
- 3D tilt cards, magnetic buttons, count-up numbers
- Menu: sticky section tabs, chef's-pick / vegetarian filters, live search
- Photo lightbox (keyboard + swipe)
- Everything respects `prefers-reduced-motion`

## File structure

```
bbqland/
├── index.html, about.html, savenors.html, menu.html, drinks.html, contact.html
├── css/styles.css
├── js/main.js        # all interactions + HOURS
└── images/           # see images/README.md
```

## Deploying

Upload the folder as-is to Netlify, Vercel, GitHub Pages, or any static host.
`images/_originals/` isn't used by the site and can be left out of the upload.
