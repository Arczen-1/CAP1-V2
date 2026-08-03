// Adds per-dish client preferences to the same-day scenario contract used in
// the advisor demo. The kitchen checklist prints these notes, so without them
// the "Print Kitchen Checklist" beat shows an empty preference column.
//
// SCN-SAMEDAY-RESERVED-A is not produced by any seed script -- it already
// exists in the database -- so this runs separately and is safe to repeat.
// It only ever writes the notes field of dishes it recognises by name.
require('dotenv').config();
const mongoose = require('mongoose');
const Contract = require('./models/Contract');

const TARGET = 'SCN-SAMEDAY-RESERVED-A';

// Matched case-insensitively against the dish name, so a slightly different
// spelling in another database still lands.
const NOTES = [
  ['caldereta', 'Mild sauce - the client has elderly guests and children at the family tables.'],
  ['cordon bleu', 'Serve the gravy on the side, not poured over.'],
  ['mango float', 'Less sweet than the tasting portion. Keep one tray aside for the principal sponsors.'],
];

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to ${mongoose.connection.name}`);

  const contract = await Contract.findOne({ contractNumber: TARGET });
  if (!contract) {
    console.log(`\n  ${TARGET} not found in this database - nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  const dishes = contract.menuDetails || [];
  if (!dishes.length) {
    console.log(`\n  ${TARGET} has no menu items - nothing to annotate.`);
    await mongoose.disconnect();
    return;
  }

  let applied = 0;
  for (const dish of dishes) {
    const name = String(dish.item || '').toLowerCase();
    const match = NOTES.find(([needle]) => name.includes(needle));
    if (!match) continue;
    if (dish.notes === match[1]) continue; // already set - keep it idempotent
    dish.notes = match[1];
    applied += 1;
  }

  if (applied) {
    contract.markModified('menuDetails');
    await contract.save();
  }

  console.log(`\n  ${TARGET} - ${applied} dish note(s) written.\n`);
  (contract.menuDetails || []).forEach((d) => {
    console.log(`    [${d.category}] ${d.item}`);
    console.log(`        ${d.notes ? d.notes : '(no client preference)'}`);
  });
  console.log('\n  These print on the kitchen preparation checklist.\n');

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
