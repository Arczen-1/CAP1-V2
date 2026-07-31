/**
 * Backfill missing `fullName` on Driver and BanquetStaff records.
 *
 * `fullName` is derived by a pre('validate') hook, so any record inserted around
 * those hooks (raw collection writes, bulk imports) is stored without it. The UI
 * now tolerates the gap, but the stored data should still be correct — searching
 * and reporting both read this field.
 *
 * Usage:  node server/backfillFullNames.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const { Driver } = require('./models/Logistics');
const BanquetStaff = require('./models/BanquetStaff');

const buildName = (doc) => [doc.firstName, doc.lastName]
  .map((part) => (part || '').trim())
  .filter(Boolean)
  .join(' ');

async function backfill(Model, label) {
  const rows = await Model.find({
    $or: [{ fullName: { $exists: false } }, { fullName: null }, { fullName: '' }]
  }).select('_id firstName lastName');

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const fullName = buildName(row);
    if (!fullName) {
      skipped += 1;
      continue;
    }
    // updateOne avoids re-running validators on unrelated legacy fields.
    await Model.updateOne({ _id: row._id }, { $set: { fullName } });
    updated += 1;
  }

  console.log(`${label}: ${rows.length} missing, ${updated} backfilled, ${skipped} had no name parts`);
  return { found: rows.length, updated, skipped };
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log(`Connected to ${mongoose.connection.name}\n`);

  await backfill(Driver, 'Drivers');
  await backfill(BanquetStaff, 'Banquet staff');

  await mongoose.disconnect();
  console.log('\nDone.');
}

run().catch(async (error) => {
  console.error('BACKFILL FAILED:', error.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});
