const fs = require('fs');
const path = require('path');

const files = [
    'src/data/news.json',
    'src/data/subscribers.json'
];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        // Find the last occurrence of ']'
        const lastBracket = content.lastIndexOf(']');
        if (lastBracket !== -1) {
            content = content.substring(0, lastBracket + 1);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Successfully fixed ${file}`);
        } else {
            console.error(`Could not find closing bracket in ${file}`);
        }
    } catch (e) {
        console.error(`Error processing ${file}: ${e.message}`);
    }
});
