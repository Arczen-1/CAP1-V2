#!/usr/bin/env node

const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const LinenInventory = require('./models/LinenInventory');
const CreativeInventory = require('./models/CreativeInventory');
const StockroomInventory = require('./models/StockroomInventory');
const User = require('./models/User');
const {
  DEFAULT_SOURCE,
  normalizeWhitespace,
  parseCsv,
  parseNumber,
  toCreativeDocument,
  toLinenDocument,
  toStockroomDocument,
} = require('./legacyInventoryImportUtils');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/juancarlos';
const ITEMS_PER_DEPARTMENT = 30;

function buildSelectionScore(row) {
  const quantity = parseNumber(row.Quantity);
  const price = parseNumber(row.Price);
  const itemName = normalizeWhitespace(row['Item Name']).toLowerCase();
  const categoryText = normalizeWhitespace(row.Category).toLowerCase();
  const noteText = normalizeWhitespace(`${row.Description} ${row.H1}`).toLowerCase();
  const nameTokens = itemName.split(' ').filter((token) => token.length >= 3);
  const categoryTokens = categoryText.split(/[^a-z0-9]+/).filter((token) => token.length >= 3);
  const hasCategoryKeyword = categoryTokens.some((token) => itemName.includes(token) || token.includes(itemName));

  let score = quantity * 1000 + price;

  if (noteText.includes('condemed') || noteText.includes('condemned') || noteText.includes('phase out') || noteText.includes('retire')) {
    score -= 1000000;
  }

  if (noteText.includes('repair') || noteText.includes('damage')) {
    score -= 250000;
  }

  if (noteText.includes('new item')) {
    score += 25000;
  }

  if (nameTokens.length >= 2) {
    score += 75000;
  }

  if (hasCategoryKeyword) {
    score += 100000;
  }

  if (nameTokens.length === 1 && !hasCategoryKeyword) {
    score -= 10000000;
  }

  return score;
}

function pickCuratedRows(rows, department, limit) {
  const departmentRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => normalizeWhitespace(row.Department).toLowerCase() === department)
    .filter(({ row }) => normalizeWhitespace(row['Item Name']))
    .filter(({ row }) => parseNumber(row.Quantity) > 0);

  const categories = [];
  const groupedRows = new Map();

  for (const entry of departmentRows) {
    const category = normalizeWhitespace(entry.row.Category) || 'Uncategorized';

    if (!groupedRows.has(category)) {
      groupedRows.set(category, []);
      categories.push(category);
    }

    groupedRows.get(category).push(entry);
  }

  for (const category of categories) {
    groupedRows.get(category).sort((left, right) => {
      const scoreDelta = buildSelectionScore(right.row) - buildSelectionScore(left.row);
      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      return left.index - right.index;
    });
  }

  const selected = [];
  let addedInRound = true;

  while (selected.length < limit && addedInRound) {
    addedInRound = false;

    for (const category of categories) {
      const bucket = groupedRows.get(category);
      if (!bucket || bucket.length === 0) {
        continue;
      }

      selected.push(bucket.shift().row);
      addedInRound = true;

      if (selected.length >= limit) {
        break;
      }
    }
  }

  return selected;
}

async function main() {
  const sourcePath = process.argv[2] || DEFAULT_SOURCE;

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Legacy CSV source not found: ${sourcePath}`);
  }

  const csvText = fs.readFileSync(sourcePath, 'utf8');
  const rows = parseCsv(csvText);

  if (rows.length === 0) {
    throw new Error('Legacy CSV is empty.');
  }

  const curatedRows = {
    linen: pickCuratedRows(rows, 'linen', ITEMS_PER_DEPARTMENT),
    creative: pickCuratedRows(rows, 'creative', ITEMS_PER_DEPARTMENT),
    warehouse: pickCuratedRows(rows, 'warehouse', ITEMS_PER_DEPARTMENT),
  };

  if (
    curatedRows.linen.length < ITEMS_PER_DEPARTMENT
    || curatedRows.creative.length < ITEMS_PER_DEPARTMENT
    || curatedRows.warehouse.length < ITEMS_PER_DEPARTMENT
  ) {
    throw new Error('Not enough rows in the legacy sheet to build the curated inventory set.');
  }

  console.log('Connecting to MongoDB...');
  console.log(`URI: ${MONGODB_URI.replace(/:([^@]+)@/, ':****@')}`);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const adminUser = await User.findOne({ role: 'admin' }).select('_id').lean();
  const adminUserId = adminUser?._id || null;

  const linenDocs = curatedRows.linen.map((row) => toLinenDocument(row, adminUserId, { curated: true }));
  const creativeDocs = curatedRows.creative.map((row) => toCreativeDocument(row, adminUserId, { curated: true }));
  const stockroomDocs = curatedRows.warehouse.map((row) => toStockroomDocument(row, { curated: true }));

  await Promise.all([
    LinenInventory.deleteMany({}),
    CreativeInventory.deleteMany({}),
    StockroomInventory.deleteMany({}),
  ]);

  await LinenInventory.insertMany(linenDocs);
  await CreativeInventory.insertMany(creativeDocs);
  await StockroomInventory.insertMany(stockroomDocs);

  console.log('\nCurated legacy inventory rebuild complete.');
  console.log(`  Linen items created: ${linenDocs.length}`);
  console.log(`  Creative items created: ${creativeDocs.length}`);
  console.log(`  Stockroom items created: ${stockroomDocs.length}`);
  console.log(`  Total items created: ${linenDocs.length + creativeDocs.length + stockroomDocs.length}`);
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(`\nCurated legacy inventory rebuild failed: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    });
}

module.exports = {
  main,
  pickCuratedRows,
};
