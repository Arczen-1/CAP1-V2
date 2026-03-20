#!/usr/bin/env node

const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const LinenInventory = require('./models/LinenInventory');
const CreativeInventory = require('./models/CreativeInventory');
const StockroomInventory = require('./models/StockroomInventory');
const User = require('./models/User');
const { isLegacyManagedImage } = require('./legacyInventoryPhotos');
const {
  DEFAULT_SOURCE,
  normalizeWhitespace,
  parseCsv,
  toCreativeDocument,
  toLinenDocument,
  toStockroomDocument,
} = require('./legacyInventoryImportUtils');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/juancarlos';

async function upsertInventory(Model, payload) {
  const existing = await Model.findOne({ itemCode: payload.itemCode });

  if (!existing) {
    const doc = new Model(payload);
    await doc.save();
    return 'created';
  }

  const existingImages = Array.isArray(existing.images)
    ? existing.images.filter((image) => normalizeWhitespace(image?.url))
    : [];
  const hasCustomImages = existingImages.some((image) => !isLegacyManagedImage(image));

  if (existingImages.length > 0 && hasCustomImages) {
    delete payload.images;
  }

  if (existing.referenceUrl && hasCustomImages) {
    delete payload.referenceUrl;
  }

  Object.assign(existing, payload);
  await existing.save();
  return 'updated';
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

  console.log('Connecting to MongoDB...');
  console.log(`URI: ${MONGODB_URI.replace(/:([^@]+)@/, ':****@')}`);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const adminUser = await User.findOne({ role: 'admin' }).select('_id').lean();
  const adminUserId = adminUser?._id || null;

  const summary = {
    totalRows: rows.length,
    linen: { created: 0, updated: 0, skipped: 0 },
    creative: { created: 0, updated: 0, skipped: 0 },
    warehouse: { created: 0, updated: 0, skipped: 0 },
    unknownDepartments: {},
  };

  for (const row of rows) {
    const department = normalizeWhitespace(row.Department).toLowerCase();

    try {
      if (department === 'linen') {
        const result = await upsertInventory(LinenInventory, toLinenDocument(row, adminUserId));
        summary.linen[result] += 1;
        continue;
      }

      if (department === 'creative') {
        const result = await upsertInventory(CreativeInventory, toCreativeDocument(row, adminUserId));
        summary.creative[result] += 1;
        continue;
      }

      if (department === 'warehouse') {
        const result = await upsertInventory(StockroomInventory, toStockroomDocument(row));
        summary.warehouse[result] += 1;
        continue;
      }

      summary.unknownDepartments[department || '(blank)'] = (summary.unknownDepartments[department || '(blank)'] || 0) + 1;
    } catch (error) {
      console.error(`Failed to import row ${row['Item ID']} (${row['Item Name']}): ${error.message}`);
      throw error;
    }
  }

  console.log('\nLegacy inventory import complete.');
  console.log(`  Source rows: ${summary.totalRows}`);
  console.log(`  Linen: ${summary.linen.created} created, ${summary.linen.updated} updated, ${summary.linen.skipped} skipped`);
  console.log(`  Creative: ${summary.creative.created} created, ${summary.creative.updated} updated, ${summary.creative.skipped} skipped`);
  console.log(`  Warehouse -> Stockroom: ${summary.warehouse.created} created, ${summary.warehouse.updated} updated, ${summary.warehouse.skipped} skipped`);

  if (Object.keys(summary.unknownDepartments).length > 0) {
    console.log('\nUnknown legacy departments encountered:');
    for (const [department, count] of Object.entries(summary.unknownDepartments)) {
      console.log(`  ${department}: ${count}`);
    }
  }
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(`\nLegacy inventory import failed: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    });
}

module.exports = {
  main,
  upsertInventory,
};
