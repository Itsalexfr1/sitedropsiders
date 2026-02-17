
const fs = require('fs');
const path = require('path');

const newsFile = path.join(__dirname, 'src', 'data', 'news.json');

if (!fs.existsSync(newsFile)) {
    console.error('File not found:', newsFile);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(newsFile, 'utf8'));

const cleanedData = data.map(item => {
    if (item.date && item.date.includes('T')) {
        // format ISO: 2026-02-12T20:56:02+00:00 -> 2026-02-12
        item.date = item.date.split('T')[0];
    }
    return item;
});

fs.writeFileSync(newsFile, JSON.stringify(cleanedData, null, 2));
console.log('Finished cleaning dates in news.json');
