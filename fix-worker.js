const fs = require('fs');
let c = fs.readFileSync('worker.ts', 'utf8');

const targetLine = 3011; // 0-indexed line 3012
const lines = c.split('\n');
if (lines.length > targetLine) {
    let line = lines[targetLine];
    console.log('Ends with:', line.substring(line.length - 20));
    const idx = line.lastIndexOf('timestamp: now');
    if (idx !== -1) {
        line = line.substring(0, idx) + 'timestamp: now }];';
        lines[targetLine] = line;
        fs.writeFileSync('worker.ts', lines.join('\n'));
        console.log('Fixed rigorously.');
    }
}
