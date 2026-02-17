
const fs = require('fs');
const path = require('path');

const inputFile = './src/data/recaps_scraped.json';
const outputFile = './src/data/recaps.json';

if (!fs.existsSync(inputFile)) {
    console.log('Input file not found.');
    process.exit(1);
}

const raw = fs.readFileSync(inputFile, 'utf8');
let data;
try {
    data = JSON.parse(raw);
} catch (e) {
    console.error('Json parse error:', e);
    process.exit(1);
}

console.log(`Read ${data.length} entries.`);

// Dedup by URL
const seen = new Set();
const unique = [];

for (const item of data) {
    if (!seen.has(item.link)) {
        seen.add(item.link);
        unique.push(item);
    }
}

console.log(`Unique entries: ${unique.length}`);

// Fix potential missing images field if needed
unique.forEach(item => {
    if (!item.images) {
        if (item.image) item.images = [item.image];
        else item.images = [];
    }
});

fs.writeFileSync(outputFile, JSON.stringify(unique, null, 2));
console.log(`Saved to ${outputFile}`);
