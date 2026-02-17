const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/data/agenda.json');
let content = fs.readFileSync(filePath, 'utf8');

function fix(str) {
    let prev = '';
    let curr = str;

    // Iteratively decode
    for (let i = 0; i < 5; i++) {
        prev = curr;
        try {
            // Treat current string as if it was incorrectly read as Latin-1
            // but was actually UTF-8 bytes.
            let buf = Buffer.from(curr, 'binary');
            let next = buf.toString('utf8');

            // If it failed or didn't change, OR if it made things worse (like producing control chars)
            if (next === curr || next.includes('\ufffd')) break;

            curr = next;
        } catch (e) {
            break;
        }
    }
    return curr;
}

// Global replace might be too aggressive if some strings are fine.
// But usually in these scraped files, all strings are broken similarly.
// Let's try to fix just the values.

const data = JSON.parse(content);

function process(obj) {
    if (typeof obj === 'string') {
        return fix(obj);
    } else if (Array.isArray(obj)) {
        return obj.map(process);
    } else if (obj !== null && typeof obj === 'object') {
        let newObj = {};
        for (let k in obj) {
            newObj[k] = process(obj[k]);
        }
        return newObj;
    }
    return obj;
}

const fixedData = process(data);

fs.writeFileSync(filePath, JSON.stringify(fixedData, null, 2), 'utf8');
console.log('Fixed agenda.json encoding recursively.');
