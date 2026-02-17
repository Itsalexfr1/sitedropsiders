
const fs = require('fs');
const path = require('path');

function cleanFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const unique = new Map();
    data.forEach(item => {
        const key = (item.link || item.title).trim().toLowerCase();
        if (!unique.has(key)) {
            unique.set(key, item);
        }
    });
    const final = Array.from(unique.values());
    fs.writeFileSync(filePath, JSON.stringify(final, null, 2));
    console.log(`Cleaned ${path.basename(filePath)}: ${data.length} -> ${final.length}`);
}

const dataDir = path.join(__dirname, 'src', 'data');
cleanFile(path.join(dataDir, 'news.json'));
cleanFile(path.join(dataDir, 'recaps.json'));

// Final check across files
const news = JSON.parse(fs.readFileSync(path.join(dataDir, 'news.json'), 'utf8'));
const recaps = JSON.parse(fs.readFileSync(path.join(dataDir, 'recaps.json'), 'utf8'));

const newsTitles = new Set(news.map(i => i.title.toLowerCase()));
const duplicateInRecaps = recaps.filter(i => newsTitles.has(i.title.toLowerCase()));

if (duplicateInRecaps.length > 0) {
    console.log(`Removing ${duplicateInRecaps.length} items from recaps.json that are already in news.json`);
    const cleanRecaps = recaps.filter(i => !newsTitles.has(i.title.toLowerCase()));
    fs.writeFileSync(path.join(dataDir, 'recaps.json'), JSON.stringify(cleanRecaps, null, 2));
}

console.log('Cleanup complete.');
