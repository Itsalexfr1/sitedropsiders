const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/data/agenda.json');
let content = fs.readFileSync(filePath, 'utf8');

function decodeTriple(str) {
    let prev = '';
    let curr = str;
    // Keep trying to decode until it stops changing or we hit a limit
    for (let i = 0; i < 10; i++) {
        prev = curr;
        try {
            // This handles the typical "interpreted as ISO-8859-1 instead of UTF-8"
            curr = decodeURIComponent(escape(curr));
        } catch (e) {
            // If it fails, try a manual common replacement for some edge cases
            curr = curr.replace(/Ã©/g, 'é')
                .replace(/Ã¨/g, 'è')
                .replace(/Ãª/g, 'ê')
                .replace(/Ã«/g, 'ë')
                .replace(/Ã´/g, 'ô')
                .replace(/Ã®/g, 'î')
                .replace(/Ã¯/g, 'ï')
                .replace(/Ã»/g, 'û')
                .replace(/Ã¹/g, 'ù')
                .replace(/Ã /g, 'à')
                .replace(/Ã§/g, 'ç')
                .replace(/Ã¢/g, 'â')
                .replace(/Ã‰/g, 'É')
                .replace(/Ã€/g, 'À');
        }
        if (curr === prev) break;
    }
    return curr;
}

// We only want to fix the values in the JSON, not the keys or structure
const data = JSON.parse(content);

function fixObject(obj) {
    for (let key in obj) {
        if (typeof obj[key] === 'string') {
            obj[key] = decodeTriple(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            fixObject(obj[key]);
        }
    }
}

fixObject(data);

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Fixed agenda.json encoding with recursive decoding.');
