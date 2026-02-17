const fs = require('fs');
const file = process.argv[2] || 'src/data/agenda.json';
const content = fs.readFileSync(file, 'utf8');

const nonAscii = {};
for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char.charCodeAt(0) > 127) {
        nonAscii[char] = (nonAscii[char] || 0) + 1;
    }
}

console.log(file, 'Non-ASCII chars count:', Object.keys(nonAscii).length);

const sequences = {};
content.replace(/[^\x00-\x7F]{2,}/g, (match) => {
    sequences[match] = (sequences[match] || 0) + 1;
    return match;
});

const sortedSeqs = Object.entries(sequences).sort((a, b) => b[1] - a[1]).slice(0, 5);
if (sortedSeqs.length > 0) {
    console.log('Top sequences:');
    sortedSeqs.forEach(s => console.log(`  ${s[0]} (${s[1]})`));
}
