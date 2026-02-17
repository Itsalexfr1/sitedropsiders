
const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, 'src', 'data');
const files = ['news.json', 'recaps.json', 'interviews.json'];

const allItems = [];
files.forEach(file => {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        data.forEach(item => {
            allItems.push({ ...item, sourceFile: file });
        });
    }
});

const titleMap = new Map();
const duplicates = [];

allItems.forEach(item => {
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

console.log(`Total items across all files: ${allItems.length}`);
console.log(`Found ${duplicates.length} duplicate titles!`);

if (duplicates.length > 0) {
    const categories = {};
    duplicates.forEach(d => {
        const key = `${d.existing.sourceFile} vs ${d.duplicate.sourceFile}`;
        categories[key] = (categories[key] || 0) + 1;
    });
    console.log('Duplicate source breakdown:', categories);

    console.log('\nSample duplicates:');
    duplicates.slice(0, 10).forEach(d => {
        console.log(`- "${d.existing.title}"`);
        console.log(`  Found in: ${d.existing.sourceFile} (ID: ${d.existing.id}) and ${d.duplicate.sourceFile} (ID: ${d.duplicate.id})`);
    });
}
