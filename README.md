# BBQ Land — Where Fire Meets Flavor

Website for **BBQ Land, Asian Grill & Barbecue**: modern Asian yakiniku at
31 Boston Turnpike, Shrewsbury, MA. Plain HTML/CSS/JS, plus a small no-dependency build step that fills in the
menu and hours from `content/*.json`.

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
npm run preview      # builds dist/ and serves it at http://localhost:8080
```

## Editing: the /admin page

The restaurant edits the menu, lunch specials, signature sets, hours and the
grand-opening date themselves at **https://www.bbqlandma.com/admin/**
([Decap CMS](https://decapcms.org/docs/)). They sign in with email/password or
Google through [DecapBridge](https://decapbridge.com) (free tier), so they don't
need a GitHub account. Invite or remove editors under "Manage collaborators" in
the DecapBridge dashboard.

- Saving makes a **draft**: a `cms/…` branch and pull request. The editor shows
  a live preview beside the form; Vercel also builds a preview site for the PR.
- **Publish** merges it into `main`, and Vercel deploys the live site.
- Those files are `content/*.json`. `scripts/build.mjs` (run by Vercel) writes
  them into every `cms:NAME` region of the HTML, the hours tables, the
  structured data Google reads in `index.html`, and `HOURS` / `GRAND_OPENING` in
  `js/main.js`. It refuses to build if the content is broken (missing name,
  non-numeric price, closing before opening…), so a bad edit fails its preview
  deploy and never reaches the live site.
- **Don't hand-edit inside `cms:` regions.** Edit `content/*.json` (or use /admin),
  then `npm run sync` to refresh the committed HTML so it matches. The editor
  fields themselves are defined in `admin/config.yml`.
- To try the editor locally: `npx decap-server` in the repo, then
  `npm run preview` and open http://localhost:8080/admin/ (no login needed).
- DecapBridge commits with a fine-grained GitHub token (Contents + Pull requests,
  read/write, this repo only) saved in its dashboard. If edits stop saving,
  check that token hasn't expired.

### Still edited by hand

- **Phone:** (508) 719-8105, in every page's header, footer and mobile call bar.
  Search for `5087198105` to find them all.
- **Printed menus:** replace the PDFs in `menus/` and re-export the images in
  `images/menus/` (e.g. `pdftoppm -r 220 -png menu.pdf out`, then resize).
  Each dish links to its own Toast item page; if an item is rebuilt in Toast,
  its link changes (editable in /admin).
- **Instagram:** https://www.instagram.com/bbq_land_shrewsbury/

## File structure

```
bbqland/
├── index.html, menu.html, reservations.html, about.html
├── contact.html, drinks.html, savenors.html   # redirects
├── css/styles.css
├── js/main.js        # hours, header, mobile menu, hero video, menu tabs
├── content/          # menu, sets, lunch, hours: edited at /admin
├── admin/            # the /admin editor (Decap CMS config + live preview)
├── lib/render.js     # content → HTML, shared by the build and the preview
├── scripts/build.mjs # builds dist/, which is what Vercel serves
├── images/           # see images/README.md
├── media/            # hero video (wide + tall) and poster frames
└── menus/            # printed dinner & lunch menus (PDF)
```

## Deploying

Vercel runs `npm run build` and serves `dist/` (see `vercel.json`). Every push
to `main`, including a Publish in /admin, redeploys the site.

## Search (Google)

- The official address is `https://www.bbqlandma.com`. Every page has a canonical tag.
- `sitemap.xml` lists the four pages; `robots.txt` points to it.
- `index.html` has Restaurant structured data (name, address, phone, hours,
  menu, Instagram). The hours in it are written by the build.
