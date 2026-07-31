/**
 * Metro Manila number coding (UVVRP) support.
 *
 * Vehicles are barred from Metro Manila roads on one weekday, decided by the last
 * digit of the plate:
 *
 *   Monday    1, 2
 *   Tuesday   3, 4
 *   Wednesday 5, 6
 *   Thursday  7, 8
 *   Friday    9, 0
 *   Weekends  no coding
 *
 * The rule only matters when the event venue is inside Metro Manila, so every
 * check is a function of (plate, event date, venue). Batangas/Cavite/Laguna
 * events are unaffected.
 *
 * This module is the single source of truth: the operations summary tags each
 * vehicle choice with it, and auto-assign filters on it.
 */

const CODED_DIGITS_BY_WEEKDAY = {
  1: [1, 2], // Monday
  2: [3, 4], // Tuesday
  3: [5, 6], // Wednesday
  4: [7, 8], // Thursday
  5: [9, 0] // Friday
};

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Cities and municipalities covered by MMDA's coding scheme, plus the district
// names that commonly appear in a venue address instead of the city itself.
const METRO_MANILA_AREAS = [
  'metro manila', 'ncr', 'national capital region',
  'caloocan', 'las pinas', 'las piñas', 'makati', 'malabon', 'mandaluyong',
  'marikina', 'muntinlupa', 'navotas', 'paranaque', 'parañaque', 'pasay',
  'pasig', 'quezon city', 'san juan', 'taguig', 'valenzuela', 'pateros',
  // District / landmark aliases
  'bonifacio global city', 'fort bonifacio', 'mckinley hill', 'bgc',
  'ortigas', 'mall of asia', 'moa complex', 'cubao', 'alabang',
  'intramuros', 'ermita', 'malate', 'binondo', 'tondo', 'sampaloc',
  'manila city', 'city of manila'
];

// Provincial names that must never be mistaken for Metro Manila. "Okada Manila"
// and "SMX Manila" are venue brand names, so a bare "manila" match is unsafe —
// these keep a nearby province from being misread when it appears alongside.
const OUTSIDE_METRO_MANILA = [
  'batangas', 'cavite', 'laguna', 'rizal', 'bulacan', 'pampanga',
  'tagaytay', 'lipa', 'taal', 'malvar', 'silang', 'dasmarinas',
  'dasmariñas', 'sta. rosa', 'santa rosa', 'calamba', 'antipolo'
];

const normalize = (value) => String(value || '')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

/**
 * True when the venue sits inside the Metro Manila coding zone.
 * Checks the address first (most reliable), then the venue name.
 */
const isMetroManilaVenue = (venue) => {
  if (!venue) return false;

  const address = normalize(venue.address);
  const name = normalize(venue.name);
  const haystack = `${address} ${name}`;

  // An explicit province anywhere in the address wins: a Batangas venue is not
  // covered even if its name happens to contain a Metro Manila word.
  if (OUTSIDE_METRO_MANILA.some((area) => address.includes(area))) {
    return false;
  }

  return METRO_MANILA_AREAS.some((area) => haystack.includes(area));
};

/**
 * Last numeric digit of a plate. Returns null when the plate has no digits
 * (or is missing), in which case coding cannot be evaluated.
 */
const getPlateLastDigit = (plateNumber) => {
  const digits = String(plateNumber || '').replace(/\D/g, '');
  if (!digits) return null;
  return Number(digits[digits.length - 1]);
};

/** Digits barred on the given date. Empty array on weekends. */
const getCodedDigitsForDate = (date) => {
  const day = new Date(date).getDay();
  return CODED_DIGITS_BY_WEEKDAY[day] || [];
};

const getWeekdayLabel = (date) => WEEKDAY_LABELS[new Date(date).getDay()] || '';

/**
 * Evaluate one vehicle against one event.
 *
 * Returns:
 *   applies  - whether coding is relevant at all (Metro Manila + weekday)
 *   coded    - true when this plate is barred on that date
 *   reason   - user-facing explanation when coded
 *   lastDigit, codedDigits, weekday - detail for the UI
 */
const evaluateVehicleCoding = ({ plateNumber, eventDate, venue }) => {
  const inZone = isMetroManilaVenue(venue);
  const codedDigits = eventDate ? getCodedDigitsForDate(eventDate) : [];
  const lastDigit = getPlateLastDigit(plateNumber);
  const weekday = eventDate ? getWeekdayLabel(eventDate) : '';

  const applies = Boolean(inZone && eventDate && codedDigits.length > 0);
  const coded = Boolean(applies && lastDigit !== null && codedDigits.includes(lastDigit));

  return {
    applies,
    inCodingZone: inZone,
    coded,
    lastDigit,
    codedDigits,
    weekday,
    reason: coded
      ? `Plate ${plateNumber} ends in ${lastDigit} and is number-coded on ${weekday} in Metro Manila.`
      : ''
  };
};

/** Convenience predicate for filtering vehicle lists. */
const isVehicleCoded = (plateNumber, eventDate, venue) => (
  evaluateVehicleCoding({ plateNumber, eventDate, venue }).coded
);

/**
 * Summary for the whole event, used to explain the restriction once in the UI
 * instead of repeating it on every vehicle row.
 */
const getEventCodingSummary = ({ eventDate, venue }) => {
  const inZone = isMetroManilaVenue(venue);
  const codedDigits = eventDate ? getCodedDigitsForDate(eventDate) : [];
  const weekday = eventDate ? getWeekdayLabel(eventDate) : '';
  const active = Boolean(inZone && codedDigits.length > 0);

  let note;
  if (!inZone) {
    note = 'This venue is outside Metro Manila, so number coding does not apply.';
  } else if (codedDigits.length === 0) {
    note = `${weekday} events in Metro Manila are not number-coded (no coding on weekends).`;
  } else {
    note = `Metro Manila number coding is in effect: plates ending in ${codedDigits.join(' or ')} cannot be used on ${weekday}.`;
  }

  return { active, inCodingZone: inZone, weekday, codedDigits, note };
};

module.exports = {
  CODED_DIGITS_BY_WEEKDAY,
  METRO_MANILA_AREAS,
  isMetroManilaVenue,
  getPlateLastDigit,
  getCodedDigitsForDate,
  getWeekdayLabel,
  evaluateVehicleCoding,
  isVehicleCoded,
  getEventCodingSummary
};
