import fs from 'fs';
const data = JSON.parse(fs.readFileSync('c:/Users/alexf/Documents/Site Dropsiders V2/src/data/wiki_djs.json', 'utf8'));
data.forEach(dj => console.log(dj.name));
