const fs = require('fs');
const djs = JSON.parse(fs.readFileSync('src/data/wiki_djs.json', 'utf8'));
const adri = djs.find(d => d.name === 'Adriatique');
console.log(JSON.stringify(adri, null, 2));
