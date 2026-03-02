import fs from 'fs';

let lines = fs.readFileSync('worker.ts', 'utf8').split('\n');

const firstPart = lines.slice(0, 3012);

let secondPart = lines.slice(6283, 6574).map(line => {
    if (line.startsWith('                    ')) { // 20 spaces
        return line.substring(20);
    }
    return line;
});

// We want to trim the junk braces at the end of secondPart
// Let's strip backwards until we hit a specific brace or we just drop the last 2 lines
let trimmedSecondPart = [...secondPart];
while (trimmedSecondPart.length > 0 && trimmedSecondPart[trimmedSecondPart.length - 1].trim() === '}') {
    trimmedSecondPart.pop();
}

// Then we must add the correct ends
trimmedSecondPart.push('}');
trimmedSecondPart.push('};');
trimmedSecondPart.push(''); // newline

const newContent = [...firstPart, ...trimmedSecondPart].join('\n');
fs.writeFileSync('worker_fixed.ts', newContent);
console.log('Fixed worker.ts saved to worker_fixed.ts');
