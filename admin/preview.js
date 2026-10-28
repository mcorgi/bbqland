/* Live preview beside the /admin editor, drawn with the site's own CSS and
   the same render code the build uses, so it matches the real page. */
import * as R from '/admin/render.js';

const { CMS, h, createClass } = window;

CMS.registerPreviewStyle('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@400;500&display=swap');
CMS.registerPreviewStyle('/css/styles.css');
CMS.registerPreviewStyle('.reveal { opacity: 1 !important; transform: none !important; } body { padding: 24px 0; }', { raw: true });

const html = render => createClass({
  render() {
    const data = this.props.entry.get('data').toJS();
    try {
      return h('div', { dangerouslySetInnerHTML: { __html: render(data) } });
    } catch {
      // Mid-edit (e.g. a day with no times yet); the build checks the finished version
      return h('p', { style: { padding: '24px' } }, 'The preview will appear once the fields are filled in.');
    }
  },
});

const section = (title, intro, body, extra = '') => `
  <section class="menu-section"><div class="wrap">
    <div class="menu-section__head"><div><h2 class="title">${title}</h2></div><p>${R.esc(intro)}</p></div>
    ${extra}${body}
  </div></section>`;

const menu = title => html(d => section(title, d.intro, `<div class="menu-cols">${R.menuColumns(d).join('\n')}</div>`));

CMS.registerPreviewTemplate('grill', menu('For the <em>grill.</em>'));
CMS.registerPreviewTemplate('kitchen', menu('From the <em>kitchen.</em>'));
CMS.registerPreviewTemplate('drinks', menu('Something <em>sweet.</em>'));
CMS.registerPreviewTemplate('lunch', html(d => section('Lunch <em>specials.</em>', d.intro,
  `<div class="lunch on-dark">${R.lunchLines(d).join('\n')}</div>`)));
CMS.registerPreviewTemplate('sets', html(d => section('Signature <em>sets.</em>', d.intro,
  `<div class="set-cards">${R.setCardLines(d.sets || []).join('\n')}</div>`,
  `<ul class="set-prices" style="max-width:420px;margin-bottom:32px">${R.setPriceLines(d.sets || []).join('')}</ul>`)));
CMS.registerPreviewTemplate('hours', html(d => `
  <div class="wrap" style="max-width:560px">
    <h2 class="title">Hours</h2>
    <table class="hours">${R.hoursTableLines(d, true).join('')}</table>
    ${d.grandOpening ? `<p style="margin-top:24px">Grand opening: ${R.esc(new Date(d.grandOpening + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }))}</p>` : ''}
  </div>`));

CMS.init();
