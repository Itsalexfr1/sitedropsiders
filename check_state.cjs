const fs = require('fs');
const state = JSON.parse(fs.readFileSync('migration_state_v2.json', 'utf8'));
const entries = Object.entries(state);
const successful = entries.filter(([k, v]) => v !== null);
console.log(`Total: ${entries.length}`);
console.log(`Successful: ${successful.length}`);
if (successful.length > 0) {
    console.log('Sample success:', successful[0]);
}
