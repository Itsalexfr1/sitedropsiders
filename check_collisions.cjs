const fs = require('fs');
const state = JSON.parse(fs.readFileSync('migration_state_v2.json', 'utf8'));
const values = Object.values(state).filter(v => v !== null);
const counts = {};
values.forEach(v => {
    counts[v] = (counts[v] || 0) + 1;
});
const duplicates = Object.entries(counts).filter(([k, v]) => v > 1);
console.log(`Duplicate destinations: ${duplicates.length}`);
if (duplicates.length > 0) {
    console.log('Sample duplicates:', duplicates.slice(0, 5));
}
const keys = Object.keys(state);
const collisions = keys.filter(k => {
    const parts = k.split('/');
    const name = parts[parts.length - 1];
    return keys.filter(k2 => k2 !== k && k2.endsWith('/' + name)).length > 0;
});
console.log(`Potential filename collisions in Cloudinary URLs: ${collisions.length}`);
