import fs from 'fs';
import path from 'path';

const DATA_NEWS_DIR = path.resolve('./data/news');
const SITE_NEWS_FILE = path.resolve('./src/data/news.json');

async function mergeNews() {
    console.log("--- MERGE START ---");

    // 1. Load existing site news
    let siteNews = [];
    if (fs.existsSync(SITE_NEWS_FILE)) {
        try {
            siteNews = JSON.parse(fs.readFileSync(SITE_NEWS_FILE, 'utf8'));
            console.log(`Site news loaded: ${siteNews.length} articles.`);
        } catch (e) {
            console.error("Error reading news.json, starting fresh.");
            siteNews = [];
        }
    }

    // 2. Load newly scraped news from ./data/news/
    if (!fs.existsSync(DATA_NEWS_DIR)) {
        console.error("Scraped data directory not found.");
        return;
    }

    const files = fs.readdirSync(DATA_NEWS_DIR).filter(f => f.endsWith('.json'));
    console.log(`Found ${files.length} new articles to merge.`);

    const existingTitles = new Set(siteNews.map(n => n.title));
    let nextId = siteNews.length > 0 ? Math.max(...siteNews.map(n => n.id)) + 1 : 1;
    let addedCount = 0;

    for (const file of files) {
        try {
            const filePath = path.join(DATA_NEWS_DIR, file);
            const newsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            if (!existingTitles.has(newsData.title)) {
                // Adapt structure to match site schema
                const newArticle = {
                    id: nextId++,
                    title: newsData.title,
                    date: newsData.date,
                    author: "Dropsiders",
                    category: "News",
                    image: newsData.image,
                    content: newsData.content,
                    url: newsData.url
                };

                siteNews.push(newArticle);
                existingTitles.add(newsData.title);
                addedCount++;
                console.log(`  Added: ${newsData.title}`);
            } else {
                console.log(`  Skipped (Duplicate): ${newsData.title}`);
            }
        } catch (err) {
            console.error(`  Error merging ${file}: ${err.message}`);
        }
    }

    // 3. Save final file
    fs.writeFileSync(SITE_NEWS_FILE, JSON.stringify(siteNews, null, 2));
    console.log(`\nSUCCESS: ${addedCount} articles added. Total site news: ${siteNews.length}`);
}

mergeNews();
