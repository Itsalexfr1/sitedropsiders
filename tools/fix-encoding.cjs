/**
 * fix-encoding.cjs
 * Fixes "Mojibake" - UTF-8 text that was incorrectly interpreted as Latin-1
 * The file is stored as UTF-8 but contains sequences like "Ã©" instead of "é"
 * This happens when UTF-8 bytes were read as Latin-1 and then re-encoded as UTF-8
 */

const fs = require('fs');
const path = require('path');

function fixMojibake(str) {
    // The string contains UTF-8 bytes that were mis-decoded as Latin-1 then re-encoded as UTF-8
    // We need to: take each char, get its char code (which is the Latin-1 byte value), 
    // collect the bytes, then decode as UTF-8

    // Build byte array from the string (treating each char as a Latin-1 byte)
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code < 256) {
            bytes.push(code);
        } else {
            // Multi-byte UTF-16 char - shouldn't happen in mojibake but handle gracefully
            bytes.push(63); // '?'
        }
    }

    // Decode the bytes as UTF-8
    const buf = Buffer.from(bytes);
    return buf.toString('utf8');
}

function fixJsonFile(filePath) {
    console.log(`Processing: ${filePath}`);

    // Read as UTF-8 (the file IS utf-8, but contains mojibake sequences)
    const rawUtf8 = fs.readFileSync(filePath, 'utf8');

    // Apply the fix: treat each char as a Latin-1 byte, then decode as UTF-8
    const fixed = fixMojibake(rawUtf8);

    // Verify it's valid JSON
    try {
        JSON.parse(fixed);
    } catch (e) {
        console.error(`  ERROR: Result is not valid JSON: ${e.message}`);
        // Try to show what went wrong
        const idx = parseInt(e.message.match(/position (\d+)/)?.[1] || '0');
        console.error(`  Context: ...${fixed.slice(Math.max(0, idx - 20), idx + 20)}...`);
        return;
    }

    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log(`  ✅ Fixed and saved`);

    // Show a sample to verify
    const data = JSON.parse(fixed);
    if (Array.isArray(data) && data.length > 0) {
        const sample = data[0];
        console.log(`  Sample: title="${sample.title}", type="${sample.type}", location="${sample.location}"`);
    }
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
