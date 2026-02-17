const fs = require('fs');
const content = fs.readFileSync('src/data/agenda.json', 'utf8');
const lines = content.split('\n');
const line9 = lines[8];

console.log('Line 9:', line9);
let hex = '';
for (let i = 0; i < line9.length; i++) {
    hex += line9.charCodeAt(i).toString(16).padStart(4, '0') + ' ';
}
console.log('Hex:', hex);
