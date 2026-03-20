const path = require('path');

const {
  getLegacyLinenImages,
  getLegacyCreativeImages,
  getLegacyStockroomImages,
} = require('./legacyInventoryPhotos');

const DEFAULT_SOURCE = path.join(__dirname, '..', 'legacy_juancarlos_inventory.csv');
const IMPORT_TAG = '[LEGACY-JC-IMPORT]';
const CURATED_TAG = '[LEGACY-JC-CURATED]';

const LEGACY_DEPARTMENT_MAPPING = {
  linen: 'Linen',
  creative: 'Creative',
  warehouse: 'Purchasing / Stockroom',
};

function parseCsv(csvText) {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }

      currentRow.push(currentCell);
      currentCell = '';

      if (currentRow.some((cell) => cell.trim() !== '')) {
        rows.push(currentRow);
      }

      currentRow = [];
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.some((cell) => cell.trim() !== '')) {
      rows.push(currentRow);
    }
  }

  const [headerRow = [], ...dataRows] = rows;
  let missingHeaderCount = 0;
  const headers = headerRow.map((header) => {
    const trimmed = String(header || '').trim();
    if (trimmed) {
      return trimmed;
    }

    missingHeaderCount += 1;
    return `H${missingHeaderCount}`;
  });

  return dataRows.map((row) => {
    const record = {};

    headers.forEach((header, index) => {
      record[header] = String(row[index] || '').trim();
    });

    return record;
  });
}

function parseNumber(value) {
  const normalized = String(value || '').replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function joinNotes(parts) {
  return parts
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean)
    .join(' | ');
}

function makeLegacyItemCode(prefix, itemId) {
  const numericId = String(itemId || '').replace(/\D/g, '');
  return `LEG-${prefix}-${numericId.padStart(4, '0')}`;
}

function buildPhotoReferenceUrl(name, mappedCategory, legacyCategory) {
  const query = [name, legacyCategory, mappedCategory].filter(Boolean).join(' ');
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
}

function inferLinenCategory(category, name) {
  const haystack = `${category} ${name}`.toLowerCase();

  if (haystack.includes('napkin')) return 'Napkin';
  if (haystack.includes('runner')) return 'Runner';
  if (haystack.includes('table cloth') || haystack.includes('rtc') || haystack.includes('couch')) return 'Tablecloth';
  if (haystack.includes('seat cover') || haystack.includes('built in')) return 'Chair Cover';
  if (haystack.includes('band') || haystack.includes('ribbon')) return 'Sash';
  if (haystack.includes('topper')) return 'Overlay';
  if (haystack.includes('skirting')) return 'Skirting';

  return 'Other';
}

function inferLinenMaterial(category, name) {
  const haystack = `${category} ${name}`.toLowerCase();

  if (haystack.includes('organza')) return 'Organza';
  if (haystack.includes('satin')) return 'Satin';
  if (haystack.includes('spandex')) return 'Spandex';
  if (haystack.includes('taffeta')) return 'Taffeta';
  if (haystack.includes('linen')) return 'Linen';
  if (haystack.includes('cotton') || haystack.includes('uniform') || haystack.includes('apron')) return 'Cotton';
  if (haystack.includes('velvet')) return 'Velvet';

  return 'Polyester';
}

function inferLinenSize(category, name) {
  const haystack = `${category} ${name}`.toLowerCase();

  if (haystack.includes('extra large') || haystack.includes('xl')) return 'extra_large';
  if (haystack.includes('large') || haystack.includes('big')) return 'large';
  if (haystack.includes('medium')) return 'medium';
  if (haystack.includes('small')) return 'small';
  if (haystack.includes('90')) return 'round_90';
  if (haystack.includes('72')) return 'round_72';
  if (haystack.includes('60')) return 'round_60';

  if (haystack.includes('seat cover') || haystack.includes('built in')) return 'banquet';
  if (haystack.includes('napkin')) return 'medium';

  return 'custom';
}

function inferLinenColor(name, category) {
  let color = normalizeWhitespace(name)
    .replace(/^table napkin/i, '')
    .replace(/^runner/i, '')
    .replace(/^rtc/i, '')
    .replace(/^band/i, '')
    .replace(/^built in/i, '')
    .replace(/^seat cover/i, '')
    .replace(/^organza ribbon/i, '')
    .replace(/^topper/i, '')
    .replace(/^apron/i, '')
    .replace(/^cap/i, '')
    .replace(/^uniform/i, '')
    .replace(/^bowtie/i, '')
    .replace(/^necktie/i, '')
    .replace(/\b(big|small|medium|large|new|old|plain|all)\b/gi, '')
    .replace(/[()]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!color || color.toLowerCase() === normalizeWhitespace(category).toLowerCase()) {
    color = normalizeWhitespace(category);
  }

  return color || 'Assorted';
}

function inferCreativeCategory(category, name) {
  const categoryText = normalizeWhitespace(category).toLowerCase();
  const nameText = normalizeWhitespace(name).toLowerCase();

  if (categoryText.includes('backdrop') || nameText.includes('backdrop') || nameText.includes('curtain')) return 'Backdrop';
  if (categoryText.includes('entrance') || nameText.includes('welcome') || nameText.includes('sign') || nameText.includes('frame')) return 'Signage';
  if (categoryText.includes('light') || nameText.includes('light') || nameText.includes('lantern') || nameText.includes('chandelier')) return 'Lighting';
  if (categoryText.includes('flower') || nameText.includes('rose') || nameText.includes('hydra') || nameText.includes('blossom') || nameText.includes('tulip')) return 'Floral';
  if (nameText.includes('centerpiece') || nameText.includes('vase') || nameText.includes('urn') || nameText.includes('candle holder')) return 'Centerpiece';
  if (nameText.includes('drape')) return 'Drapery';
  if (nameText.includes('mirror') || nameText.includes('box') || nameText.includes('glass') || nameText.includes('bottle')) return 'Table Decor';

  return 'Props';
}

function inferStockroomCategory(category, name) {
  const haystack = `${category} ${name}`.toLowerCase();

  if (haystack.includes('chair') || haystack.includes('bench') || haystack.includes('stool') || haystack.includes('sofa')) return 'Chair';
  if (haystack.includes('table')) return 'Table';
  if (haystack.includes('tent')) return 'Tent';
  if (haystack.includes('decor') || haystack.includes('vase') || haystack.includes('flower') || haystack.includes('runner') || haystack.includes('curtain') || haystack.includes('candle')) return 'Decor';
  if (haystack.includes('cleaning') || haystack.includes('office') || haystack.includes('miscellaneous') || haystack.includes('utensils')) return 'Tool';
  if (haystack.includes('tool')) return 'Tool';

  return 'Equipment';
}

function inferLinenState(noteText) {
  const text = noteText.toLowerCase();

  if (text.includes('condemed') || text.includes('condemned') || text.includes('phase out') || text.includes('retire')) {
    return { condition: 'needs_replacement', status: 'retired' };
  }

  if (text.includes('repair')) {
    return { condition: 'damaged', status: 'maintenance' };
  }

  if (text.includes('stain') || text.includes('burn') || text.includes('oil') || text.includes('fadded') || text.includes('faded')) {
    return { condition: 'stained', status: 'available' };
  }

  if (text.includes('new item')) {
    return { condition: 'new', status: 'available' };
  }

  return { condition: 'good', status: 'available' };
}

function inferCreativeState(noteText) {
  const text = noteText.toLowerCase();

  if (text.includes('condemed') || text.includes('condemned') || text.includes('phase out') || text.includes('retire')) {
    return { condition: 'damaged', status: 'retired' };
  }

  if (text.includes('repair') || text.includes('damage')) {
    return { condition: 'needs_repair', status: 'maintenance' };
  }

  if (text.includes('new item')) {
    return { condition: 'excellent', status: 'available' };
  }

  if (text.includes('stain') || text.includes('burn') || text.includes('loss')) {
    return { condition: 'fair', status: 'available' };
  }

  return { condition: 'good', status: 'available' };
}

function inferStockroomState(noteText) {
  const text = noteText.toLowerCase();

  if (text.includes('condemed') || text.includes('condemned') || text.includes('phase out') || text.includes('retire')) {
    return { condition: 'damaged', status: 'retired' };
  }

  if (text.includes('repair') || text.includes('maintenance')) {
    return { condition: 'poor', status: 'maintenance' };
  }

  if (text.includes('new item')) {
    return { condition: 'excellent', status: 'available' };
  }

  if (text.includes('damage') || text.includes('loss') || text.includes('stain') || text.includes('burn')) {
    return { condition: 'fair', status: 'available' };
  }

  return { condition: 'good', status: 'available' };
}

function buildImportNotes(row, mappedDepartment, category, unit, description, options = {}) {
  return joinNotes([
    description,
    row.H1,
    `${IMPORT_TAG} Legacy department: ${row.Department} -> mapped to ${mappedDepartment}.`,
    `Legacy category: ${category}.`,
    unit ? `Legacy unit: ${unit}.` : '',
    options.curated ? `${CURATED_TAG} Included in curated 30-item department rebuild.` : '',
  ]);
}

function toLinenDocument(row, adminUserId, options = {}) {
  const itemId = row['Item ID'];
  const itemCode = makeLegacyItemCode('LN', itemId);
  const name = normalizeWhitespace(row['Item Name']);
  const category = normalizeWhitespace(row.Category);
  const unit = normalizeWhitespace(row.Unit);
  const quantity = parseNumber(row.Quantity);
  const price = parseNumber(row.Price);
  const description = normalizeWhitespace(row.Description);
  const mappedCategory = inferLinenCategory(category, name);
  const notes = buildImportNotes(
    row,
    LEGACY_DEPARTMENT_MAPPING[row.Department],
    category,
    unit,
    description,
    options,
  );
  const state = inferLinenState(notes);

  return {
    itemCode,
    name,
    category: mappedCategory,
    size: inferLinenSize(category, name),
    material: inferLinenMaterial(category, name),
    color: inferLinenColor(name, category),
    images: getLegacyLinenImages({
      itemCode,
      itemName: name,
      category: mappedCategory,
      legacyCategory: category,
    }),
    referenceUrl: buildPhotoReferenceUrl(name, mappedCategory, category),
    quantity,
    availableQuantity: quantity,
    minimumStock: quantity > 0 ? Math.min(Math.max(Math.ceil(quantity * 0.1), 1), 25) : 1,
    condition: state.condition,
    status: state.status,
    storageLocation: options.curated ? 'Curated Legacy Linen Inventory' : 'Legacy Linen Inventory',
    acquisition: price > 0 ? { cost: price } : undefined,
    notes,
    createdBy: adminUserId || undefined,
    updatedBy: adminUserId || undefined,
  };
}

function toCreativeDocument(row, adminUserId, options = {}) {
  const itemId = row['Item ID'];
  const itemCode = makeLegacyItemCode('CR', itemId);
  const name = normalizeWhitespace(row['Item Name']);
  const category = normalizeWhitespace(row.Category);
  const unit = normalizeWhitespace(row.Unit);
  const quantity = parseNumber(row.Quantity);
  const price = parseNumber(row.Price);
  const description = normalizeWhitespace(row.Description);
  const mappedCategory = inferCreativeCategory(category, name);
  const notes = buildImportNotes(
    row,
    LEGACY_DEPARTMENT_MAPPING[row.Department],
    category,
    unit,
    description,
    options,
  );
  const state = inferCreativeState(notes);

  return {
    itemCode,
    name,
    category: mappedCategory,
    subCategory: category || 'Legacy Creative Item',
    description: joinNotes([
      description,
      unit ? `Legacy unit: ${unit}` : '',
    ]),
    images: getLegacyCreativeImages({
      itemCode,
      itemName: name,
      category: mappedCategory,
      legacyCategory: category,
    }),
    referenceUrl: buildPhotoReferenceUrl(name, mappedCategory, category),
    quantity,
    availableQuantity: quantity,
    condition: state.condition,
    storageLocation: options.curated ? 'Curated Legacy Creative Inventory' : 'Legacy Creative Inventory',
    acquisition: {
      type: 'purchased',
      cost: price > 0 ? price : undefined,
    },
    status: state.status,
    notes,
    createdBy: adminUserId || undefined,
    updatedBy: adminUserId || undefined,
  };
}

function toStockroomDocument(row, options = {}) {
  const itemId = row['Item ID'];
  const itemCode = makeLegacyItemCode('ST', itemId);
  const name = normalizeWhitespace(row['Item Name']);
  const category = normalizeWhitespace(row.Category);
  const unit = normalizeWhitespace(row.Unit);
  const quantity = parseNumber(row.Quantity);
  const price = parseNumber(row.Price);
  const description = normalizeWhitespace(row.Description);
  const mappedCategory = inferStockroomCategory(category, name);
  const notes = buildImportNotes(
    row,
    LEGACY_DEPARTMENT_MAPPING[row.Department],
    category,
    unit,
    description,
    options,
  );
  const state = inferStockroomState(notes);

  return {
    itemCode,
    name,
    category: mappedCategory,
    subcategory: category || 'Legacy Warehouse Item',
    description: joinNotes([
      description,
      unit ? `Legacy unit: ${unit}` : '',
    ]),
    images: getLegacyStockroomImages({
      itemCode,
      itemName: name,
      category: mappedCategory,
      legacyCategory: category,
    }),
    referenceUrl: buildPhotoReferenceUrl(name, mappedCategory, category),
    quantity,
    availableQuantity: quantity,
    reservedQuantity: 0,
    minimumStock: quantity > 0 ? Math.min(Math.max(Math.ceil(quantity * 0.1), 1), 50) : 1,
    condition: state.condition,
    status: state.status,
    storageLocation: {
      warehouse: options.curated ? 'Curated Legacy Warehouse' : 'Legacy Warehouse',
      section: category || 'General',
      shelf: '',
      bin: '',
    },
    purchasePrice: price > 0 ? price : undefined,
    replacementCost: price > 0 ? price : undefined,
    notes,
    internalNotes: joinNotes([
      `${IMPORT_TAG} Original department ${row.Department} mapped to current stockroom inventory under Purchasing.`,
      options.curated ? `${CURATED_TAG} Included in curated 30-item department rebuild.` : '',
    ]),
  };
}

module.exports = {
  CURATED_TAG,
  DEFAULT_SOURCE,
  IMPORT_TAG,
  LEGACY_DEPARTMENT_MAPPING,
  buildPhotoReferenceUrl,
  inferCreativeState,
  inferLinenState,
  inferStockroomState,
  normalizeWhitespace,
  parseCsv,
  parseNumber,
  toCreativeDocument,
  toLinenDocument,
  toStockroomDocument,
};
