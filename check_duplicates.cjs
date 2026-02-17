
const fs = require('fs');
const path = require('path');
const newsFile = path.join(__dirname, 'src', 'data', 'news.json');
const data = JSON.parse(fs.readFileSync(newsFile, 'utf8'));

const titleMap = new Map();
const duplicates = [];

data.forEach(item => {
    const title = item.title.trim().toLowerCase();
    if (titleMap.has(title)) {
        duplicates.push({
            existing: titleMap.get(title),
            duplicate: item
        });
    } else {
        titleMap.set(title, item);
    }
});

if (duplicates.length > 0) {
    console.log(`Found ${duplicates.length} duplicate titles!`);
    duplicates.slice(0, 5).forEach(d => {
        console.log(`- "${d.existing.title}" (ID: ${d.existing.id}) vs (ID: ${d.duplicate.id})`);
    });
} else {
    console.log('No duplicate titles found.');
}
