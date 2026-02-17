
const fs = require('fs');
const news = JSON.parse(fs.readFileSync('src/data/news.json', 'utf8'));
const recaps = JSON.parse(fs.readFileSync('src/data/recaps.json', 'utf8'));

console.log('NEWS FILE:');
const newsCats = {};
news.forEach(i => newsCats[i.category] = (newsCats[i.category] || 0) + 1);
console.log(newsCats);

console.log('RECAPS FILE:');
const recapCats = {};
recaps.forEach(i => recapCats[i.category] = (recapCats[i.category] || 0) + 1);
console.log(recapCats);
