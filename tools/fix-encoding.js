/**
 * fix-encoding.js
 * Fixes UTF-8 characters that were incorrectly stored as Latin-1 (ISO-8859-1)
 * e.g. "Ã©" -> "é", "UshuaÃ¯a" -> "Ushuaïa", "RÃ©sidence" -> "Résidence"
 */

const fs = require('fs');
const path = require('path');

function fixEncoding(str) {
    // Re-encode: the string was read as UTF-8 but the bytes are Latin-1 encoded UTF-8
    // We convert each char code back to a byte, then decode as UTF-8
    try {
        const bytes = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) {
            bytes[i] = str.charCodeAt(i) & 0xff;
        }
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(bytes);
    } catch (e) {
        return str;
    }
}

function fixJsonFile(filePath) {
    console.log(`Processing: ${filePath}`);
    const raw = fs.readFileSync(filePath, 'latin1'); // Read as Latin-1 to get raw bytes

    // Parse the JSON (it will have correct chars now since we read as latin1)
    let data;
    try {
        data = JSON.parse(raw);
    } catch (e) {
        console.error(`  ERROR: Could not parse JSON: ${e.message}`);
        return;
    }

    // Write back as proper UTF-8
    const fixed = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log(`  ✅ Fixed and saved as UTF-8`);
}

// Files to fix
const files = [
    path.join(__dirname, '../src/data/agenda.json'),
    path.join(__dirname, '../src/data/news.json'),
    path.join(__dirname, '../src/data/recaps.json'),
];

files.forEach(f => {
    if (fs.existsSync(f)) {
        fixJsonFile(f);
    } else {
        console.log(`  SKIP (not found): ${f}`);
    }
});

console.log('\nDone!');
