import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../src/data');

const replacements = [
    // --- Double Encoded UTF-8 (C3 83 C2 xx) ---
    // é -> C3 A9 -> C3 83 C2 A9
    { pattern: /\u00C3\u0083\u00C2\u00A9/g, replacement: 'e' },
    // è -> C3 A8 -> C3 83 C2 A8
    { pattern: /\u00C3\u0083\u00C2\u00A8/g, replacement: 'e' },
    // ê -> C3 AA -> C3 83 C2 AA
    { pattern: /\u00C3\u0083\u00C2\u00AA/g, replacement: 'e' },
    // ë -> C3 AB -> C3 83 C2 AB
    { pattern: /\u00C3\u0083\u00C2\u00AB/g, replacement: 'e' },
    // ô -> C3 B4 -> C3 83 C2 B4
    { pattern: /\u00C3\u0083\u00C2\u00B4/g, replacement: 'o' },
    // ö -> C3 B6 -> C3 83 C2 B6
    { pattern: /\u00C3\u0083\u00C2\u00B6/g, replacement: 'o' },
    // î -> C3 AE -> C3 83 C2 AE
    { pattern: /\u00C3\u0083\u00C2\u00AE/g, replacement: 'i' },
    // ï -> C3 AF -> C3 83 C2 AF
    { pattern: /\u00C3\u0083\u00C2\u00AF/g, replacement: 'i' },
    // ù -> C3 B9 -> C3 83 C2 B9
    { pattern: /\u00C3\u0083\u00C2\u00B9/g, replacement: 'u' },
    // û -> C3 BB -> C3 83 C2 BB
    { pattern: /\u00C3\u0083\u00C2\u00BB/g, replacement: 'u' },
    // ü -> C3 BC -> C3 83 C2 BC
    { pattern: /\u00C3\u0083\u00C2\u00BC/g, replacement: 'u' },
    // ç -> C3 A7 -> C3 83 C2 A7
    { pattern: /\u00C3\u0083\u00C2\u00A7/g, replacement: 'c' },
    // à -> C3 A0 -> C3 83 C2 A0  (Caution: might be space if interpreted differently)
    { pattern: /\u00C3\u0083\u00C2\u00A0/g, replacement: 'a' },

    // --- Complex / Other Artifacts based on observation ---
    // UshuaÃƒÂ¯a -> Ushuaia (Handles the specific `ï` case above too, but good to be explicit for the query)
    { pattern: /Ushua\u00C3\u0083\u00C2\u00AFa/g, replacement: 'Ushuaia' },
    // UshuaÃ¯a -> Ushuaia (Single encoded case: \u00C3\u00AF)
    { pattern: /Ushua\u00C3\u00AFa/g, replacement: 'Ushuaia' },
    // Ushuaïa -> Ushuaia (Correct UTF-8 case)
    { pattern: /Ushuaïa/g, replacement: 'Ushuaia' },

    // Single encoded Ã + punctuation
    { pattern: /\u00C3\u00A9/g, replacement: 'e' }, // Ã©
    { pattern: /\u00C3\u00A8/g, replacement: 'e' }, // Ã¨
    { pattern: /\u00C3\u00AA/g, replacement: 'e' }, // Ãª
    { pattern: /\u00C3\u00AB/g, replacement: 'e' }, // Ã«
    { pattern: /\u00C3\u00B4/g, replacement: 'o' }, // Ã´
    { pattern: /\u00C3\u00B6/g, replacement: 'o' }, // Ã¶
    { pattern: /\u00C3\u00AE/g, replacement: 'i' }, // Ã®
    { pattern: /\u00C3\u00AF/g, replacement: 'i' }, // Ã¯
    { pattern: /\u00C3\u00B9/g, replacement: 'u' }, // Ã¹
    { pattern: /\u00C3\u00BB/g, replacement: 'u' }, // Ã»
    { pattern: /\u00C3\u00BC/g, replacement: 'u' }, // Ã¼
    { pattern: /\u00C3\u00A0/g, replacement: 'a' }, // Ã 
    { pattern: /\u00C3\u00A7/g, replacement: 'c' }, // Ã§

    // Filenames / Special words
    // présents -> presents. Correct UTF-8 `é` is \u00E9.
    // If the file has valid UTF-8 `présents`, replace it too as per user request to remove accents.
    { pattern: /pr\u00E9sents/g, replacement: 'presents' },
    { pattern: /d\u00E9sert/g, replacement: 'desert' },
    { pattern: /f\u00EAtes/g, replacement: 'fetes' },
    { pattern: /H\u00EFl/g, replacement: 'Hi' }, // Hï -> Hi? User said Hï Ibiza usually. But removing accents -> Hi.

    // Garbage
    { pattern: /\u00C3\u0082/g, replacement: ' ' }, // Ã‚Â (NBSP artifact)
];

fs.readdir(dataDir, (err, files) => {
    if (err) return console.error(err);

    files.forEach(file => {
        if (!file.endsWith('.json')) return;

        const filePath = path.join(dataDir, file);
        fs.readFile(filePath, 'utf8', (err, content) => {
            if (err) return console.error(err);

            let newContent = content;
            replacements.forEach(({ pattern, replacement }) => {
                newContent = newContent.replace(pattern, replacement);
            });

            if (content !== newContent) {
                fs.writeFile(filePath, newContent, 'utf8', (err) => {
                    if (err) console.error(err);
                    else console.log(`Updated ${file}`);
                });
            } else {
                // console.log(`No changes for ${file}`);
            }
        });
    });
});
