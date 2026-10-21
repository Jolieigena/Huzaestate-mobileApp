// Switches which HuzaEstate the development app shows:  node scripts/set-target.js server|local
// It rewrites src/target.ts; Metro reloads the running app by itself.
const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (target !== 'server' && target !== 'local') {
  console.error('Use: node scripts/set-target.js server   or   node scripts/set-target.js local');
  process.exit(1);
}

const file = path.join(__dirname, '..', 'src', 'target.ts');
const text = fs.readFileSync(file, 'utf8').replace(/export const TARGET: 'server' \| 'local' = '(server|local)';/, `export const TARGET: 'server' | 'local' = '${target}';`);
fs.writeFileSync(file, text);
console.log(`The development app now shows the ${target === 'server' ? 'deployed site and its real database' : 'local site and its test database'}.`);
