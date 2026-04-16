const fs = require('fs');
const path = './src/data/wiki_djs.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

let count = 0;
data.forEach(dj => {
    if (dj.status === 'waiting') {
        dj.status = 'verified';
        count++;
    }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log(`Updated ${count} DJs from waiting to verified.`);
