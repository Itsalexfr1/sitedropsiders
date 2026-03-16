
const fs = require('fs');
const path = require('path');

const clubsPath = path.join(__dirname, 'src/data/wiki_clubs.json');
const festsPath = path.join(__dirname, 'src/data/wiki_festivals.json');

function updateStatus(filePath) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const updated = data.map(item => {
        const isPlaceholder = item.image.includes('unsplash.com/photo-') || item.image.includes('images.unsplash.com');
        return {
            ...item,
            status: isPlaceholder ? 'waiting' : 'published'
        };
    });
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
    console.log(`Updated ${filePath}: ${updated.filter(i => i.status === 'published').length} published, ${updated.filter(i => i.status === 'waiting').length} waiting.`);
}

updateStatus(clubsPath);
updateStatus(festsPath);
