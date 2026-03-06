const fs = require('fs');
const path = require('path');

const files = [
    'src/data/news.json',
    'src/data/subscribers.json'
];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    try {
        const content = fs.readFileSync(filePath, 'utf8').trim();
        const data = JSON.parse(content);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Fixed ${file}`);
    } catch (e) {
        console.error(`Error fixing ${file}: ${e.message}`);
    }
});
