const AUTO_IMAGE_TAG = '[LEGACY-JC-AUTO-IMAGE]';

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function truncate(value, limit) {
  const text = String(value || '').trim();
  if (!text || text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit - 1)}...`;
}

function toDataUrl(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildImage(url, caption) {
  return [{
    url,
    caption,
    isPrimary: true,
  }];
}

function isLegacyManagedImage(image) {
  return String(image?.caption || '').includes(AUTO_IMAGE_TAG);
}

function pickAccentColor(text, fallback) {
  const source = String(text || '').toLowerCase();

  if (source.includes('white') || source.includes('ivory')) return '#E8DDD1';
  if (source.includes('black')) return '#2E2B2A';
  if (source.includes('gold') || source.includes('mustard')) return '#C89B43';
  if (source.includes('silver') || source.includes('gray') || source.includes('grey')) return '#9AA4AF';
  if (source.includes('beige') || source.includes('khaki') || source.includes('nude')) return '#CDAE8A';
  if (source.includes('brown') || source.includes('maong')) return '#8A5B3F';
  if (source.includes('red') || source.includes('burgundy') || source.includes('maroon')) return '#9D4650';
  if (source.includes('pink') || source.includes('old rose') || source.includes('fuchsia')) return '#C2728C';
  if (source.includes('orange') || source.includes('peach')) return '#D98958';
  if (source.includes('yellow')) return '#D3B34D';
  if (source.includes('green') || source.includes('olive') || source.includes('moss')) return '#6A8C67';
  if (source.includes('blue') || source.includes('aqua') || source.includes('navy') || source.includes('aquamarine')) return '#557FAA';
  if (source.includes('violet') || source.includes('purple')) return '#7A6B9B';

  return fallback;
}

function getPalette(accent) {
  return {
    accent,
    accentSoft: `${accent}22`,
    page: '#F6F1EA',
    card: '#FFFFFF',
    frame: '#EAE0D3',
    ink: '#2F2B27',
    subtle: '#7D7266',
    badge: '#F5EFE6',
  };
}

function getLinenKind(name, legacyCategory, mappedCategory) {
  const text = `${name} ${legacyCategory} ${mappedCategory}`.toLowerCase();

  if (text.includes('napkin') || text.includes('runner') || text.includes('ribbon') || text.includes('sash') || text.includes('band')) return 'napkin';
  if (text.includes('chair') || text.includes('seat cover') || text.includes('built in')) return 'chair';
  if (text.includes('uniform') || text.includes('apron') || text.includes('cap') || text.includes('bowtie') || text.includes('necktie') || text.includes('barong')) return 'apparel';
  if (text.includes('machine') || text.includes('fan') || text.includes('steamer') || text.includes('juki')) return 'machine';
  if (text.includes('couch') || text.includes('foam') || text.includes('carpet') || text.includes('basket') || text.includes('theme')) return 'lounge';

  return 'table';
}

function getCreativeKind(name, legacyCategory, mappedCategory) {
  const text = `${name} ${legacyCategory} ${mappedCategory}`.toLowerCase();

  if (text.includes('backdrop') || text.includes('entrance') || text.includes('screen') || text.includes('ring') || text.includes('arko')) return 'backdrop';
  if (text.includes('flower') || text.includes('hydra') || text.includes('peony') || text.includes('leaves') || text.includes('grass') || text.includes('mat')) return 'floral';
  if (text.includes('light') || text.includes('electric') || text.includes('led') || text.includes('neon') || text.includes('signage') || text.includes('sign')) return 'lighting';

  return 'decor';
}

function getStockroomKind(name, legacyCategory, mappedCategory) {
  const text = `${name} ${legacyCategory} ${mappedCategory}`.toLowerCase();

  if (text.includes('utensil') || text.includes('tableware') || text.includes('plate') || text.includes('bowl') || text.includes('fork') || text.includes('spoon') || text.includes('container') || text.includes('bin')) return 'tableware';
  if (text.includes('cookware') || text.includes('kitchen') || text.includes('catering') || text.includes('chafing') || text.includes('stove') || text.includes('oven') || text.includes('refrigerator') || text.includes('warmer')) return 'cookware';
  if (text.includes('chair')) return 'chair';
  if (text.includes('table')) return 'table';
  if (text.includes('tent') || text.includes('staging') || text.includes('platform')) return 'tent';
  if (text.includes('audio') || text.includes('speaker') || text.includes('subwoofer') || text.includes('lighting') || text.includes('equipment') || text.includes('trolley')) return 'audio';
  if (text.includes('cleaning') || text.includes('office') || text.includes('broom') || text.includes('mop') || text.includes('vacuum') || text.includes('stapler') || text.includes('clips')) return 'cleaning';

  return 'tableware';
}

function renderKindGraphic(kind, palette) {
  switch (kind) {
    case 'napkin':
      return `
        <rect x="478" y="98" width="126" height="126" rx="24" transform="rotate(10 478 98)" fill="${palette.accent}"/>
        <path d="M512 134L586 156L528 214L512 134Z" fill="#FFFFFF" opacity="0.92"/>
        <rect x="180" y="210" width="312" height="78" rx="24" fill="#FFFFFF" opacity="0.96"/>
        <rect x="198" y="228" width="276" height="42" rx="16" fill="${palette.accentSoft}"/>
      `;
    case 'table':
      return `
        <ellipse cx="378" cy="176" rx="150" ry="60" fill="${palette.accent}"/>
        <rect x="350" y="176" width="56" height="118" rx="24" fill="#AFA193" opacity="0.55"/>
        <path d="M378 294L314 340" stroke="#7A6D62" stroke-width="12" stroke-linecap="round"/>
        <path d="M378 294L442 340" stroke="#7A6D62" stroke-width="12" stroke-linecap="round"/>
      `;
    case 'chair':
      return `
        <rect x="270" y="112" width="216" height="132" rx="40" fill="${palette.accent}"/>
        <rect x="306" y="84" width="144" height="76" rx="24" fill="#FFFFFF" opacity="0.95"/>
        <path d="M300 236L276 336" stroke="#6F655C" stroke-width="14" stroke-linecap="round"/>
        <path d="M456 236L480 336" stroke="#6F655C" stroke-width="14" stroke-linecap="round"/>
      `;
    case 'apparel':
      return `
        <path d="M312 88L352 64H404L444 88L490 142L450 172L428 144V304H328V144L306 172L266 142L312 88Z" fill="${palette.accent}"/>
        <path d="M352 64H404L392 116H364L352 64Z" fill="#FFFFFF" opacity="0.96"/>
      `;
    case 'machine':
      return `
        <rect x="214" y="144" width="328" height="146" rx="28" fill="#FFFFFF"/>
        <rect x="238" y="166" width="126" height="102" rx="18" fill="${palette.accentSoft}"/>
        <circle cx="470" cy="218" r="56" fill="${palette.accent}"/>
        <circle cx="470" cy="218" r="28" fill="#FFFFFF" opacity="0.95"/>
      `;
    case 'lounge':
      return `
        <rect x="210" y="178" width="336" height="88" rx="30" fill="${palette.accent}"/>
        <rect x="234" y="132" width="102" height="74" rx="24" fill="#FFFFFF" opacity="0.95"/>
        <rect x="420" y="132" width="102" height="74" rx="24" fill="#FFFFFF" opacity="0.95"/>
      `;
    case 'backdrop':
      return `
        <rect x="188" y="92" width="34" height="224" rx="17" fill="#B8AB9C"/>
        <rect x="536" y="92" width="34" height="224" rx="17" fill="#B8AB9C"/>
        <path d="M222 114C270 92 316 84 380 84C444 84 490 92 536 114V292H222V114Z" fill="${palette.accent}"/>
        <path d="M250 136C294 118 330 112 380 112C430 112 466 118 508 136V292H250V136Z" fill="#FFFFFF" opacity="0.88"/>
      `;
    case 'floral':
      return `
        <path d="M378 138V304" stroke="#6F8B60" stroke-width="12" stroke-linecap="round"/>
        <path d="M378 138C378 110 400 88 428 88C428 116 406 138 378 138Z" fill="${palette.accent}"/>
        <path d="M378 138C378 110 356 88 328 88C328 116 350 138 378 138Z" fill="${palette.accent}"/>
        <path d="M414 176C442 176 466 152 466 124C438 124 414 148 414 176Z" fill="${palette.accent}" opacity="0.92"/>
        <path d="M342 176C314 176 290 152 290 124C318 124 342 148 342 176Z" fill="${palette.accent}" opacity="0.92"/>
        <rect x="332" y="276" width="92" height="34" rx="14" fill="#C4AE96"/>
      `;
    case 'lighting':
      return `
        <circle cx="378" cy="116" r="46" fill="#FFE4A6"/>
        <path d="M378 70V36" stroke="#796C61" stroke-width="10" stroke-linecap="round"/>
        <path d="M302 230C302 196.863 328.863 170 362 170H394C427.137 170 454 196.863 454 230V304H302V230Z" fill="${palette.accent}"/>
      `;
    case 'decor':
      return `
        <path d="M330 108C330 82.595 350.595 62 376 62C401.405 62 422 82.595 422 108C422 142 404 160 400 196H352C348 160 330 142 330 108Z" fill="#FFFFFF" opacity="0.96"/>
        <rect x="338" y="196" width="76" height="102" rx="22" fill="${palette.accent}"/>
      `;
    case 'tableware':
      return `
        <circle cx="330" cy="188" r="92" fill="#FFFFFF" opacity="0.98"/>
        <circle cx="330" cy="188" r="62" fill="${palette.accentSoft}"/>
        <path d="M490 100V278" stroke="#7A6D62" stroke-width="12" stroke-linecap="round"/>
        <path d="M524 100V278" stroke="#7A6D62" stroke-width="12" stroke-linecap="round"/>
      `;
    case 'cookware':
      return `
        <rect x="238" y="156" width="284" height="112" rx="30" fill="${palette.accent}"/>
        <rect x="280" y="114" width="200" height="44" rx="18" fill="#FFFFFF" opacity="0.96"/>
        <path d="M218 202H188" stroke="#7A6D62" stroke-width="12" stroke-linecap="round"/>
        <path d="M572 202H542" stroke="#7A6D62" stroke-width="12" stroke-linecap="round"/>
      `;
    case 'tent':
      return `
        <path d="M380 56L566 180H194L380 56Z" fill="${palette.accent}"/>
        <path d="M224 180H536V304H224V180Z" fill="#FFFFFF" opacity="0.95"/>
        <path d="M380 56V304" stroke="#7A6D62" stroke-width="10" stroke-linecap="round" opacity="0.28"/>
      `;
    case 'audio':
      return `
        <rect x="244" y="82" width="152" height="222" rx="26" fill="#363231"/>
        <circle cx="320" cy="164" r="34" fill="#FFFFFF" opacity="0.94"/>
        <circle cx="320" cy="236" r="50" fill="${palette.accent}"/>
        <rect x="452" y="118" width="90" height="186" rx="18" fill="${palette.accent}"/>
      `;
    case 'cleaning':
      return `
        <path d="M314 64L392 284" stroke="#7A6D62" stroke-width="14" stroke-linecap="round"/>
        <path d="M388 284H246L278 212H354L388 284Z" fill="${palette.accent}"/>
        <rect x="450" y="178" width="98" height="112" rx="24" fill="#FFFFFF" opacity="0.96"/>
      `;
    default:
      return `
        <rect x="220" y="112" width="320" height="164" rx="32" fill="${palette.accent}"/>
        <rect x="248" y="138" width="264" height="112" rx="24" fill="#FFFFFF" opacity="0.92"/>
      `;
  }
}

function renderReferencePreview({ kind, accent }) {
  const palette = getPalette(accent);

  const svg = `
    <svg width="640" height="640" viewBox="0 0 640 640" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="80" y1="64" x2="560" y2="592" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FBF7F1"/>
          <stop offset="1" stop-color="${palette.frame}"/>
        </linearGradient>
        <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(470 164) rotate(136) scale(226 284)">
          <stop stop-color="${palette.accent}" stop-opacity="0.38"/>
          <stop offset="1" stop-color="${palette.accent}" stop-opacity="0"/>
        </radialGradient>
        <filter id="shadow" x="96" y="112" width="448" height="438" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feDropShadow dx="0" dy="24" stdDeviation="24" flood-color="#2F2B27" flood-opacity="0.12"/>
        </filter>
      </defs>
      <rect width="640" height="640" rx="48" fill="url(#bg)"/>
      <circle cx="472" cy="164" r="188" fill="url(#glow)"/>
      <circle cx="150" cy="146" r="120" fill="${palette.card}" opacity="0.74"/>
      <rect x="56" y="56" width="528" height="528" rx="40" fill="${palette.card}" fill-opacity="0.9"/>
      <ellipse cx="320" cy="534" rx="186" ry="34" fill="#2F2B27" opacity="0.08"/>
      <path d="M92 506C180 472 248 458 320 458C392 458 460 472 548 506V584H92V506Z" fill="${palette.badge}"/>
      <g filter="url(#shadow)" transform="translate(0 122)">
        ${renderKindGraphic(kind, palette)}
      </g>
      <rect x="56" y="56" width="528" height="528" rx="40" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="8"/>
    </svg>
  `;

  return toDataUrl(svg);
}

function getLegacyLinenImages({ itemName, category, legacyCategory }) {
  const kind = getLinenKind(itemName, legacyCategory, category);
  const accent = pickAccentColor(`${itemName} ${legacyCategory} ${category}`, '#8A6C57');
  return buildImage(renderReferencePreview({ kind, accent }), `${AUTO_IMAGE_TAG} ${itemName}`);
}

function getLegacyCreativeImages({ itemName, category, legacyCategory }) {
  const kind = getCreativeKind(itemName, legacyCategory, category);
  const accent = pickAccentColor(`${itemName} ${legacyCategory} ${category}`, '#B07B5A');
  return buildImage(renderReferencePreview({ kind, accent }), `${AUTO_IMAGE_TAG} ${itemName}`);
}

function getLegacyStockroomImages({ itemName, category, legacyCategory }) {
  const kind = getStockroomKind(itemName, legacyCategory, category);
  const accent = pickAccentColor(`${itemName} ${legacyCategory} ${category}`, '#6E8A82');
  return buildImage(renderReferencePreview({ kind, accent }), `${AUTO_IMAGE_TAG} ${itemName}`);
}

module.exports = {
  AUTO_IMAGE_TAG,
  getLegacyLinenImages,
  getLegacyCreativeImages,
  getLegacyStockroomImages,
  isLegacyManagedImage,
};
