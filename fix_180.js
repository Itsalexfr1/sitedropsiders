const fs = require('fs');
const cp = require('child_process');

// Get old version from stash (which has article 180 content)
const oldJson = cp.execSync('git show stash@{0}:src/data/news_content_3.json', { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
const oldData = JSON.parse(oldJson);
const item180 = oldData.find(x => x.id === 180);

if (!item180) {
    console.log('Article 180 not found in stash!');
    process.exit(1);
}

console.log('Article 180 content length:', item180.content.length);

// Get current version (HEAD)
const currentJson = fs.readFileSync('src/data/news_content_3.json', 'utf8');
const currentData = JSON.parse(currentJson);

// Check if 180 already exists in current
const idx = currentData.findIndex(x => x.id === 180);
if (idx !== -1) {
    console.log('Replacing existing entry at index', idx);
    currentData[idx].content = item180.content;
} else {
    console.log('Adding new entry for article 180');
    currentData.push(item180);
}

fs.writeFileSync('src/data/news_content_3.json', JSON.stringify(currentData, null, 2));
console.log('Done! Total items:', currentData.length);
