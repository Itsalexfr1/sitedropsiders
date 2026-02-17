import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.resolve(__dirname, 'src/data/news.json');
const FULL_DATA_FILE = path.resolve(__dirname, 'src/data/news_full.json');

const DIRS_TO_CLEAN = [
    'public/images/news',
    'public/images/recaps',
    'public/images/interviews',
    // Check assets too just in case
    'public/assets/news',
    'public/assets/recaps',
    'public/assets/interviews'
];

// 1. Empty news.json
console.log(`Clearing ${DATA_FILE}...`);
const schemaPlaceholder = [
    {
        "id": 0,
        "title": "SCHEMA_PLACEHOLDER",
        "date": "",
        "author": "",
        "category": "__SCHEMA__",
        "image": "",
        "summary": "",
        "content": "",
        "htmlContent": "",
        "youtubeId": "",
        "url": ""
    }
];
fs.writeFileSync(DATA_FILE, JSON.stringify(schemaPlaceholder, null, 2));

// 2. Remove news_full.json
if (fs.existsSync(FULL_DATA_FILE)) {
    console.log(`Removing ${FULL_DATA_FILE}...`);
    fs.unlinkSync(FULL_DATA_FILE);
}

// 3. Clean directories
for (const dirRelative of DIRS_TO_CLEAN) {
    const dirPath = path.resolve(__dirname, dirRelative);
    if (fs.existsSync(dirPath)) {
        console.log(`Cleaning ${dirRelative}...`);
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            // safe check: only delete files, not subdirs if unexpected, but usually recursive is fine for clean
            // using fs.rmSync with recursive for simplicity if needed, but unlink is safer for files
            if (fs.statSync(filePath).isDirectory()) {
                fs.rmSync(filePath, { recursive: true, force: true });
            } else {
                fs.unlinkSync(filePath);
            }
        }
    } else {
        console.log(`Directory ${dirRelative} does not exist, creating it empty...`);
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

console.log("Cleanup complete.");
