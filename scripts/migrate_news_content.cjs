const fs = require('fs');
const path = require('path');

const NEWS_PATH = path.join(__dirname, '..', 'src', 'data', 'news.json');
const LEGACY_CONTENT_PATH = path.join(__dirname, '..', 'src', 'data', 'news_content_legacy.json');

try {
    console.log('Reading news.json...');
    const newsData = JSON.parse(fs.readFileSync(NEWS_PATH, 'utf8'));
    
    const legacyContent = [];
    const strippedNews = [];

    console.log(`Processing ${newsData.length} articles...`);

    for (const article of newsData) {
        if (article.content && article.content.trim() !== '') {
            legacyContent.push({
                id: article.id,
                content: article.content
            });
            console.log(`Extracted content for ID: ${article.id}`);
        }
        
        // Create stripped version
        const { content, ...metadata } = article;
        strippedNews.push({
            ...metadata,
            content: ''
        });
    }

    console.log(`Saving ${legacyContent.length} legacy content items to news_content_legacy.json...`);
    fs.writeFileSync(LEGACY_CONTENT_PATH, JSON.stringify(legacyContent, null, 0));

    console.log('Saving stripped and minified news.json...');
    fs.writeFileSync(NEWS_PATH, JSON.stringify(strippedNews, null, 0));

    const oldSize = fs.statSync(NEWS_PATH).size; // This will actually be the NEW size since we just wrote it, wait
} catch (err) {
    console.error('Migration failed:', err);
}
