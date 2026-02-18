/**
 * slim-json.cjs
 * Removes the 'content' field from news.json and recaps.json to reduce file size below 1MB.
 * The 'content' field contains raw scraped HTML that is not used in the frontend.
 */

const fs = require('fs');
const path = require('path');

function slimFile(filePath, fieldsToRemove) {
    console.log(`\nProcessing: ${filePath}`);
    const before = fs.statSync(filePath).size;

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const slimmed = data.map(item => {
        const newItem = { ...item };
        for (const field of fieldsToRemove) {
            delete newItem[field];
        }
        return newItem;
    });

    const output = JSON.stringify(slimmed, null, 2);
    fs.writeFileSync(filePath, output, 'utf8');

    const after = fs.statSync(filePath).size;
    console.log(`  Before: ${(before / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  After:  ${(after / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Saved:  ${((before - after) / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Items:  ${slimmed.length}`);

    if (after > 1024 * 1024) {
        console.log(`  ⚠️  Still over 1MB! GitHub API will use download_url fallback.`);
    } else {
        console.log(`  ✅ Under 1MB - GitHub API will work normally.`);
    }
}

slimFile(path.join(__dirname, '../src/data/news.json'), ['content']);
slimFile(path.join(__dirname, '../src/data/recaps.json'), ['content']);

console.log('\nDone!');
