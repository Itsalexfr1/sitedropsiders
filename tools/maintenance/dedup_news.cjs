
const fs = require('fs');
const path = require('path');

const newsFile = path.join(__dirname, 'src', 'data', 'news.json');

if (!fs.existsSync(newsFile)) {
    console.error('File not found:', newsFile);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(newsFile, 'utf8'));
console.log(`Initial count: ${data.length} items.`);

// Use a Map to keep unique items by link
const uniqueMap = new Map();

data.forEach(item => {
    // Generate a key (prefer link, fallback to title)
    const key = item.link || item.title;

    if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
    } else {
        // If we want to keep the "best" version, we could compare properties
        // For now, first one wins is usually fine if the previous import was additive
    }
});

let deduped = Array.from(uniqueMap.values());

// Sort by date (descending)
deduped.sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    return dateB.localeCompare(dateA);
});

// Re-assign sequential IDs
deduped = deduped.map((item, index) => {
    item.id = index + 1;
    return item;
});

fs.writeFileSync(newsFile, JSON.stringify(deduped, null, 2));
console.log(`Deduplication finished. New count: ${deduped.length} items.`);
console.log('Saved to src/data/news.json');
