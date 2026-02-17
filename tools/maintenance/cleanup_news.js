import fs from 'fs';
import path from 'path';

const DATA_FILE = path.resolve('./src/data/news.json');

async function cleanup() {
    if (!fs.existsSync(DATA_FILE)) return;
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    const unique = [];
    const titles = new Set();

    for (const item of data) {
        // Normalize title for comparison
        const normTitle = item.title.trim().toLowerCase();
        if (titles.has(normTitle)) continue;

        // Clean content a bit more if needed
        if (item.content) {
            // Ensure no absolute dropsiders.eu links
            item.content = item.content.split('https://www.dropsiders.eu').join('');
            item.content = item.content.split('http://www.dropsiders.eu').join('');
        }

        // Fix missing hero image from content if empty
        if (!item.image || item.image === "") {
            const imgMatch = item.content?.match(/src=\"([^\"]+)\"/);
            if (imgMatch) {
                item.image = imgMatch[1];
            }
        }

        // Fix placeholder summaries
        if (item.summary === "...") {
            const plainText = item.content?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || "";
            item.summary = plainText.substring(0, 160) + "...";
        }

        titles.add(normTitle);
        unique.push(item);
    }

    // Re-id
    unique.forEach((item, idx) => {
        item.id = idx + 1;
    });

    fs.writeFileSync(DATA_FILE, JSON.stringify(unique, null, 2));
    console.log(`Cleanup terminé. ${data.length} -> ${unique.length} articles.`);
}

cleanup();
