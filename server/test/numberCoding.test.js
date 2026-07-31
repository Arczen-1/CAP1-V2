/**
 * Metro Manila number coding tests.
 *
 * Covers venue-zone detection (including the traps: venues *named* "Manila" that
 * sit in a province, and provincial venues near NCR), the weekday digit table,
 * plate parsing, and the combined per-vehicle evaluation.
 *
 * Run: node server/test/numberCoding.test.js
 */

const {
  isMetroManilaVenue,
  getPlateLastDigit,
  getCodedDigitsForDate,
  evaluateVehicleCoding,
  getEventCodingSummary
} = require('../utils/numberCoding');

let passed = 0;
let failed = 0;
const failures = [];

const check = (label, actual, expected) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed += 1;
  } else {
    failed += 1;
    failures.push(`  FAIL  ${label}\n        expected ${e}, got ${a}`);
  }
};

// Fixed dates with known weekdays (2026).
const MONDAY = new Date('2026-08-03T00:00:00');
const TUESDAY = new Date('2026-08-04T00:00:00');
const WEDNESDAY = new Date('2026-08-05T00:00:00');
const THURSDAY = new Date('2026-08-06T00:00:00');
const FRIDAY = new Date('2026-08-07T00:00:00');
const SATURDAY = new Date('2026-08-08T00:00:00');
const SUNDAY = new Date('2026-08-09T00:00:00');

// Sanity: confirm the fixtures really are those weekdays.
check('fixture Monday', MONDAY.getDay(), 1);
check('fixture Friday', FRIDAY.getDay(), 5);
check('fixture Sunday', SUNDAY.getDay(), 0);

// ---------------------------------------------------- weekday digit table
check('Monday digits', getCodedDigitsForDate(MONDAY), [1, 2]);
check('Tuesday digits', getCodedDigitsForDate(TUESDAY), [3, 4]);
check('Wednesday digits', getCodedDigitsForDate(WEDNESDAY), [5, 6]);
check('Thursday digits', getCodedDigitsForDate(THURSDAY), [7, 8]);
check('Friday digits', getCodedDigitsForDate(FRIDAY), [9, 0]);
check('Saturday digits (none)', getCodedDigitsForDate(SATURDAY), []);
check('Sunday digits (none)', getCodedDigitsForDate(SUNDAY), []);

// ---------------------------------------------------- plate parsing
check('plate NEA 4821 -> 1', getPlateLastDigit('NEA 4821'), 1);
check('plate UVW 812 -> 2', getPlateLastDigit('UVW 812'), 2);
check('plate PBQ 447 -> 7', getPlateLastDigit('PBQ 447'), 7);
check('plate ZAR 1198 -> 8', getPlateLastDigit('ZAR 1198'), 8);
check('plate KLM 8842 -> 2', getPlateLastDigit('KLM 8842'), 2);
check('plate ending 0', getPlateLastDigit('ABC 1230'), 0);
check('hyphenated legacy plate', getPlateLastDigit('JCS-4103'), 3);
check('plate with no digits', getPlateLastDigit('EXEMPT'), null);
check('missing plate', getPlateLastDigit(undefined), null);

// ---------------------------------------------------- venue zone detection
const inZone = [
  ['Pasay (WTC)', { name: 'World Trade Center - Hall C', address: 'Pasay City' }],
  ['Pasay full address', { name: 'WORLD TRADE CENTER', address: 'Mezzanine Level WTCMM Building, Sen. Gil J. Puyat Ave. cor. Diosdado Macapagal Blvd., Pasay City 1300' }],
  ['Taguig / Fort Bonifacio', { name: 'BLUE LEAF PAVILION', address: '100 Park Avenue, McKinley Hill Village, Fort Bonifacio, Taguig' }],
  ['Quezon City', { name: 'Blue Leaf Cosmopolitan', address: 'Quezon City' }],
  ['Pasig City', { name: 'Glass Garden Events', address: 'Pasig City' }],
  ['Paranaque (Okada)', { name: 'Okada Manila Ballroom', address: 'Paranaque City' }],
  ['Mall of Asia complex', { name: 'SMX MANILA', address: 'Seashell Lane, Mall of Asia Complex, Pasay City 1300' }],
  ['Makati', { name: 'Peninsula', address: 'Ayala Ave, Makati' }],
  ['Las Pinas with enye', { name: 'Venue', address: 'Las Piñas City' }]
];
inZone.forEach(([label, venue]) => check(`in zone: ${label}`, isMetroManilaVenue(venue), true));

const outsideZone = [
  ['Lipa, Batangas', { name: 'Casa Consuelo Events Place', address: 'Lipa City, Batangas' }],
  ['Taal, Batangas', { name: 'Balai Taal Garden Pavilion', address: 'Taal, Batangas' }],
  ['Malvar, Batangas', { name: 'Lima Park Hotel - Grand Ballroom', address: 'Malvar, Batangas' }],
  ['Batangas City', { name: 'Pontefino Residences', address: 'Batangas City' }],
  ['Tagaytay', { name: 'FERNWOOD GARDENS', address: 'Neogan, Tagaytay City' }],
  ['Silang, Cavite', { name: 'Antonio Garden Hall', address: 'Silang, Cavite' }],
  ['Dasmarinas, Cavite', { name: 'The Orchard Pavilion', address: 'Dasmarinas, Cavite' }],
  ['Tagaytay-Sta. Rosa Road', { name: 'Juan Carlo Garden Pavilion', address: 'Tagaytay-Sta. Rosa Road' }],
  ['Old Grove Lipa', { name: 'OLD GROVE', address: 'Purok 5, U. Mojares Street Barangay Lodlod, Lipa City, 4217 Batangas' }],
  // The trap: brand name contains "Manila" but the venue is in a province.
  ['provincial venue named Manila', { name: 'Manila Grand Ballroom', address: 'Sto. Tomas, Batangas' }],
  ['empty venue', {}],
  ['null venue', null]
];
outsideZone.forEach(([label, venue]) => check(`outside zone: ${label}`, isMetroManilaVenue(venue), false));

// ---------------------------------------------------- per-vehicle evaluation
const pasay = { name: 'World Trade Center - Hall C', address: 'Pasay City' };
const batangas = { name: 'Lima Park Hotel', address: 'Malvar, Batangas' };

// Monday bars 1 and 2.
check('Mon + Pasay + plate ...1 = coded',
  evaluateVehicleCoding({ plateNumber: 'NEA 4821', eventDate: MONDAY, venue: pasay }).coded, true);
check('Mon + Pasay + plate ...2 = coded',
  evaluateVehicleCoding({ plateNumber: 'KLM 8842', eventDate: MONDAY, venue: pasay }).coded, true);
check('Mon + Pasay + plate ...7 = allowed',
  evaluateVehicleCoding({ plateNumber: 'PBQ 447', eventDate: MONDAY, venue: pasay }).coded, false);

// Same plate, same day, provincial venue = unaffected.
check('Mon + Batangas + plate ...1 = allowed (outside zone)',
  evaluateVehicleCoding({ plateNumber: 'NEA 4821', eventDate: MONDAY, venue: batangas }).coded, false);

// Weekend in Metro Manila = unaffected.
check('Sat + Pasay + plate ...1 = allowed (weekend)',
  evaluateVehicleCoding({ plateNumber: 'NEA 4821', eventDate: SATURDAY, venue: pasay }).coded, false);
check('Sun + Pasay + plate ...0 = allowed (weekend)',
  evaluateVehicleCoding({ plateNumber: 'ABC 1230', eventDate: SUNDAY, venue: pasay }).coded, false);

// Friday bars 9 and 0.
check('Fri + Pasay + plate ...0 = coded',
  evaluateVehicleCoding({ plateNumber: 'ABC 1230', eventDate: FRIDAY, venue: pasay }).coded, true);
check('Fri + Pasay + plate ...9 = coded',
  evaluateVehicleCoding({ plateNumber: 'XYZ 1119', eventDate: FRIDAY, venue: pasay }).coded, true);
check('Fri + Pasay + plate ...8 = allowed',
  evaluateVehicleCoding({ plateNumber: 'ZAR 1198', eventDate: FRIDAY, venue: pasay }).coded, false);

// Thursday bars 7 and 8.
check('Thu + Pasay + plate ...8 = coded',
  evaluateVehicleCoding({ plateNumber: 'ZAR 1198', eventDate: THURSDAY, venue: pasay }).coded, true);

// A plate with no digits can never be coded.
check('no-digit plate never coded',
  evaluateVehicleCoding({ plateNumber: 'EXEMPT', eventDate: MONDAY, venue: pasay }).coded, false);

// Missing event date -> cannot evaluate.
check('missing event date = not applicable',
  evaluateVehicleCoding({ plateNumber: 'NEA 4821', eventDate: null, venue: pasay }).applies, false);

// Detail fields
const detail = evaluateVehicleCoding({ plateNumber: 'NEA 4821', eventDate: MONDAY, venue: pasay });
check('detail.lastDigit', detail.lastDigit, 1);
check('detail.codedDigits', detail.codedDigits, [1, 2]);
check('detail.weekday', detail.weekday, 'Monday');
check('detail.applies', detail.applies, true);
check('detail.reason mentions plate + day',
  /NEA 4821/.test(detail.reason) && /Monday/.test(detail.reason), true);

// ---------------------------------------------------- event summary
const sMon = getEventCodingSummary({ eventDate: MONDAY, venue: pasay });
check('summary Mon/Pasay active', sMon.active, true);
check('summary Mon/Pasay digits', sMon.codedDigits, [1, 2]);

const sProv = getEventCodingSummary({ eventDate: MONDAY, venue: batangas });
check('summary provincial inactive', sProv.active, false);
check('summary provincial note', /outside Metro Manila/.test(sProv.note), true);

const sSat = getEventCodingSummary({ eventDate: SATURDAY, venue: pasay });
check('summary weekend inactive', sSat.active, false);
check('summary weekend note', /not number-coded/.test(sSat.note), true);

// ---------------------------------------------------- report
console.log('\nMetro Manila number coding test');
console.log('===============================');
if (failures.length) console.log(failures.join('\n'));
console.log(`\n${passed} passed, ${failed} failed (${passed + failed} assertions).`);
process.exit(failed === 0 ? 0 : 1);
