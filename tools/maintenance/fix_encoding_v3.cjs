const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/data/agenda.json');
const content = fs.readFileSync(filePath, 'utf8');

function fixEncoding(s) {
    if (typeof s !== 'string') return s;

    let curr = s;
    for (let i = 0; i < 5; i++) {
        try {
            // Check if string contains typical Mojibake characters
            if (!/[ÃÂâ]/.test(curr)) break;

            // Treat string as Latin-1 and decode as UTF-8
            let next = Buffer.from(curr, 'binary').toString('utf8');

            // If the output is the same or it seems to have introduced more issues, stop
            if (next === curr) break;

            // Basic sanity check: if it replaced a long sequence with something shorter/better
            curr = next;
        } catch (e) {
            break;
        }
    }

    // Manual cleanup for anything the buffer dance missed or over-fixed
    const leftovers = {
        'Ã©': 'é', 'Ã¨': 'è', 'Ãª': 'ê', 'Ã«': 'ë',
        'Ã´': 'ô', 'Ã®': 'î', 'Ã¯': 'ï', 'Ã»': 'û',
        'Ã¹': 'ù', 'Ã ': 'à', 'Ã§': 'ç', 'Ã¢': 'â',
        'Ã‰': 'É', 'Ã€': 'À', 'Ãˆ': 'È', 'Ã‡': 'Ç',
        'Â©': '©', 'Â®': '®', 'â€œ': '“', 'â€ ': '”',
        'â€™': "'", 'â€¦': '…', 'Â ': ' ', 'Â ': 'à ',
        'Ã¯': 'ï', 'Ã ': 'à'
    };

    for (let [old, rep] of Object.entries(leftovers)) {
        curr = curr.split(old).join(rep);
    }

    return curr;
}

const data = JSON.parse(content);

function recurse(obj) {
    if (Array.isArray(obj)) {
        return obj.map(recurse);
    } else if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (let key in obj) {
            newObj[key] = recurse(obj[key]);
        }
        return newObj;
    } else if (typeof obj === 'string') {
        return fixEncoding(obj);
    }
    return obj;
}

const fixedData = recurse(data);

fs.writeFileSync(filePath, JSON.stringify(fixedData, null, 2), 'utf8');
console.log('Fixed agenda.json encoding using Buffer binary-to-utf8.');
