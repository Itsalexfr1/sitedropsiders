const fs = require('fs');

const files = [
    'src/data/wiki_djs.json',
    'src/data/wiki_clubs.json',
    'src/data/wiki_festivals.json'
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    let changed = false;

    data.forEach(item => {
        const img = (item.image || '').toLowerCase();
        const name = (item.name || '').toLowerCase();
        
        const isPlaceholder = 
            !img || 
            img.includes('placeholder') || 
            img.includes('exemple') || 
            img.includes('example') ||
            img.includes('999999999') ||
            img === '#' ||
            name.includes('999999999');

        if (isPlaceholder && item.status !== 'waiting') {
            item.status = 'waiting';
            changed = true;
            console.log(`Marking ${item.name} (${item.id}) as waiting in ${file}`);
        }
    });

    if (changed) {
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`No changes for ${file}`);
    }
});
