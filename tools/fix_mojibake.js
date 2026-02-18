
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIRECTORY = path.join(__dirname, '../src/data');

const REPLACEMENTS = [
    { pattern: /├®/g, replacement: 'é' },
    { pattern: /├á/g, replacement: 'à' },
    { pattern: /├¿/g, replacement: 'è' },
    { pattern: /├¬/g, replacement: 'ê' },
    { pattern: /ÔÇÖ/g, replacement: "'" },
    { pattern: /┬½/g, replacement: '«' },
    { pattern: /┬╗/g, replacement: '»' },
    { pattern: /ÔÇ£/g, replacement: '“' },
    { pattern: /ÔÇØ/g, replacement: '”' },
    { pattern: /ÔÇª/g, replacement: '...' },
    { pattern: /├º/g, replacement: 'ç' },
    { pattern: /├ó/g, replacement: 'â' },
    { pattern: /├«/g, replacement: 'î' },
    { pattern: /├╗/g, replacement: 'û' },
    { pattern: /├┤/g, replacement: 'ô' },
    { pattern: /├ë/g, replacement: 'É' },
    { pattern: /├Ç/g, replacement: 'À' },
    { pattern: /ÔÇô/g, replacement: '–' },
    { pattern: /ÔÇö/g, replacement: '—' },
    { pattern: /┼ô/g, replacement: 'œ' },
    { pattern: /Â /g, replacement: ' ' },
    { pattern: /Â/g, replacement: '' }, // Often a ghost character before others
    { pattern: /Ã /g, replacement: 'à' },
    { pattern: /Ã©/g, replacement: 'é' },
    { pattern: /Ã¨/g, replacement: 'è' },
    { pattern: /Ãª/g, replacement: 'ê' },
    { pattern: /Ã»/g, replacement: 'û' },
    { pattern: /Ã´/g, replacement: 'ô' },
    { pattern: /Ã®/g, replacement: 'î' },
    { pattern: /Ã§/g, replacement: 'ç' },
    { pattern: /Ã¹/g, replacement: 'ù' },
    { pattern: /Ã«/g, replacement: 'ë' },
    { pattern: /Ã¯/g, replacement: 'ï' },
    { pattern: /Ã‰/g, replacement: 'É' },
    { pattern: /Ã€/g, replacement: 'À' },
    { pattern: /â€TM/g, replacement: "'" },
    { pattern: /â€/g, replacement: '"' },
    { pattern: /┬░/g, replacement: '°' },
    { pattern: /ÔÇ»/g, replacement: ' ' },
    { pattern: /├å/g, replacement: 'Æ' }
];

function fixFile(filePath) {
    if (!fs.existsSync(filePath)) return;

    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        let content = raw;

        REPLACEMENTS.forEach(({ pattern, replacement }) => {
            content = content.replace(pattern, replacement);
        });

        if (content !== raw) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed encoding in: ${path.basename(filePath)}`);
        } else {
            console.log(`No changes needed for: ${path.basename(filePath)}`);
        }
    } catch (e) {
        console.error(`Error processing ${filePath}:`, e);
    }
}

// Scan for content files
fs.readdirSync(DIRECTORY).forEach(file => {
    if ((file.includes('news_content') || file.includes('recaps_content') || file.includes('news.json') || file.includes('recaps.json')) && file.endsWith('.json')) {
        fixFile(path.join(DIRECTORY, file));
    }
});
