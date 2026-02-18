import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../src/data');

const file = 'agenda.json';
const filePath = path.join(dataDir, file);

fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) return console.error(err);

    const match = content.match(/L'([^ ]+)dition/);
    if (match) {
        console.log('Found pattern:', match[0]);
        const garbage = match[1];
        console.log('Garbage part:', garbage);
        console.log('Garbage codes:', garbage.split('').map(c => c.charCodeAt(0).toString(16)));
    } else {
        console.log('Could not find L\'...dition pattern');
        // fall back to finding "dition"
        const idx = content.indexOf('dition');
        if (idx !== -1) {
            console.log('Context around dition:', content.substring(idx - 10, idx + 10));
            console.log('Codes:', content.substring(idx - 10, idx + 10).split('').map(c => c.charCodeAt(0).toString(16)));
        }
    }
});
