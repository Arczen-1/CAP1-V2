
const fs = require('fs');
const path = require('path');

// Fix MenuTasting.js
const menuTastingPath = path.join(__dirname, 'server', 'models', 'MenuTasting.js');
let menuTastingContent = fs.readFileSync(menuTastingPath, 'utf8');

// Replace the corrupted regex with the correct one
menuTastingContent = menuTastingContent.replace(
  /match:\s*\[\s*\/\^\[[^\]]*\]\*\$\/\s*,\s*['"]Please enter a valid phone number['"]\s*\]/g,
  "match: [/^[\\+\\d\\s\\-\\(\\)]{7,20}$/, 'Please enter a valid phone number']"
);

fs.writeFileSync(menuTastingPath, menuTastingContent);
console.log('✅ Fixed MenuTasting.js');

// Fix Contract.js
const contractPath = path.join(__dirname, 'server', 'models', 'Contract.js');
let contractContent = fs.readFileSync(contractPath, 'utf8');

contractContent = contractContent.replace(
  /match:\s*\[\s*\/\^\[[^\]]*\]\*\$\/\s*,\s*['"]Please enter a valid phone number['"]\s*\]/g,
  "match: [/^[\\+\\d\\s\\-\\(\\)]{7,20}$/, 'Please enter a valid phone number']"
);

fs.writeFileSync(contractPath, contractContent);
console.log('✅ Fixed Contract.js');
console.log('\nYou can now run: npm run seed');
