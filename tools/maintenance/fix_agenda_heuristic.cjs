const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/data/agenda.json');
let content = fs.readFileSync(filePath, 'utf8');

const buddyMap = {
    '\u00a9': 'é',
    '\u00a7': 'ç',
    '\u00a0': 'à',
    '\u00aa': 'ê',
    '\u00a8': 'è',
    '\u00ae': 'î',
    '\u00af': 'ï',
    '\u00b4': 'ô',
    '\u00bb': 'û',
    '\u00b9': 'ù',
    '\u00ab': 'ë',
    '\u00a2': 'â',
    '\u00b2': 'ò',
    '\u00c2': 'à', // Sometimes it hangs around
};

// Also handle the multi-character ones discovered in the hex dump
// 00c3 0082 00c2 00a9 -> é
// 00c3 0082 00c2 00a7 -> ç

content = content.replace(/[^\x00-\x7F]+/g, (match) => {
    // Look at the very last character
    const lastChar = match[match.length - 1];

    // Check if it's in our buddy map
    if (buddyMap[lastChar]) {
        return buddyMap[lastChar];
    }

    // Special case for œ which often ends with something else or is more complex
    if (match.includes('\u2026') || match.includes('\u201c') || match.includes('\u201d')) {
        if (match.includes('c')) return 'cœur'; // Specific common word
        return ' '; // fallback
    }

    // If we don't know, return a space or nothing instead of the mess
    return match.length > 20 ? ' ' : match;
});

// Final pass for some remaining common artifacts
content = content.replace(/à‚Â/g, "")
    .replace(/àƒÆ’/g, "")
    .replace(/à†â€™/g, "")
    .replace(/â€™/g, "'")
    .replace(/à /g, "à")
    .replace(/à /g, "à ");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed agenda.json characters using Last-Buddy heuristic.');
