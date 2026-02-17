
const fs = require('fs');
const path = require('path');

const newsFile = path.join(__dirname, 'src', 'data', 'news.json');
let data = JSON.parse(fs.readFileSync(newsFile, 'utf8'));

console.log(`Starting with ${data.length} items.`);

const uniqueMap = new Map();
const duplicatesRemoved = [];

data.forEach(item => {
    // Generate a unique key based on multiple factors
    const titleKey = item.title.trim().toLowerCase();
    const contentKey = item.content ? item.content.substring(0, 200).toLowerCase() : '';
    const linkKey = item.link ? item.link.trim().toLowerCase() : '';

    // We consider it a duplicate if either the link is the same OR (title AND content) are very similar
    const key = linkKey || `${titleKey}|${contentKey}`;

    if (uniqueMap.has(key)) {
        duplicatesRemoved.push(item.title);
    } else {
        uniqueMap.set(key, item);
    }
});

let deduped = Array.from(uniqueMap.values());

// Fix categories
deduped = deduped.map(item => {
    if (item.category === 'Interviews' || item.category === 'Interview') {
        item.category = 'Interview';
    }
    return item;
});

// Re-index
deduped.sort((a, b) => new Date(b.date) - new Date(a.date));
deduped.forEach((item, index) => {
    item.id = index + 1;
});

fs.writeFileSync(newsFile, JSON.stringify(deduped, null, 2));

console.log(`Deduplication finished.`);
console.log(`Final count: ${deduped.length} items.`);
if (duplicatesRemoved.length > 0) {
    console.log(`Removed ${duplicatesRemoved.length} duplicates:`, duplicatesRemoved);
} else {
    console.log('No overlaps found.');
}
