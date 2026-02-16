const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://dropsiders.webador.fr';
const NEWS_URL = `${BASE_URL}/news`;
const IMG_DIR = path.resolve('./public/webador_news');
const DATA_DIR = path.resolve('./data/news');

// Ensure directories exist
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

async function downloadImage(url, filename) {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer'
        });
        const filepath = path.join(IMG_DIR, filename);
        fs.writeFileSync(filepath, response.data);
        return true;
    } catch (e) {
        console.error(`  [IMG ERR] ${url}: ${e.message}`);
        return false;
    }
}

async function scrape() {
    console.log(`--- DÉBUT SCRAPING WEBADOR (CIBLAGE : 10 NEWS) ---`);

    try {
        const { data: mainHtml } = await axios.get(NEWS_URL, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(mainHtml);

        // Initialize links from the first page
        const links = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.startsWith('/news/') && !links.includes(href)) {
                links.push(href);
            }
        });

        // Check for more pages if needed using both common patterns
        let page = 2;
        const segmentId = $('div.jw-news').attr('data-jw-element-id') || '203713190';

        while (links.length < 10 && page < 5) {
            const paginateUrls = [
                `${NEWS_URL}?page=${page}`,
                `${NEWS_URL}?${segmentId}-page=${page}`
            ];

            for (const pUrl of paginateUrls) {
                console.log(`Fetching Page ${page} using ${pUrl}...`);
                try {
                    const { data: pageHtml } = await axios.get(pUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0' },
                        timeout: 5000
                    });
                    const $p = cheerio.load(pageHtml);
                    let foundOnThisPage = 0;
                    $p('a').each((i, el) => {
                        const href = $p(el).attr('href');
                        if (href && href.startsWith('/news/') && !links.includes(href)) {
                            links.push(href);
                            foundOnThisPage++;
                        }
                    });
                    if (foundOnThisPage > 0) {
                        console.log(`  Found ${foundOnThisPage} new links.`);
                        break; // Stop trying other URLs for this page
                    }
                } catch (pErr) {
                    console.log(`  Error on ${pUrl}: ${pErr.message}`);
                }
            }
            page++;
        }

        const toProcess = links.slice(0, 10);
        console.log(`Processing total of ${toProcess.length} articles...`);

        for (let i = 0; i < toProcess.length; i++) {
            const articleUrl = toProcess[i].startsWith('http') ? toProcess[i] : `${BASE_URL}${toProcess[i]}`;
            console.log(`\n[${i + 1}/${toProcess.length}] Fetching: ${articleUrl}`);

            try {
                const { data: artHtml } = await axios.get(articleUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                const $a = cheerio.load(artHtml);

                const title = $a('h1').first().text().trim() || `Article-${i + 1}`;
                const date = $a('meta[itemprop="datePublished"]').attr('content') || new Date().toISOString();

                // Content extraction (main section)
                let content = $a('div.news-page-content-container').text().trim() ||
                    $a('main').text().trim() ||
                    "No content found.";

                // Image extraction
                let coverImgUrl = "";
                let localImgPath = "";

                // Try to find the first large image that isn't a logo
                $a('img').each((idx, img) => {
                    const src = $a(img).attr('src');
                    if (src && !src.includes('logo') && !src.includes('favicon') && !src.includes('avatar')) {
                        coverImgUrl = src.startsWith('http') ? src : src; // usually absolute or handled by browser
                        if (src.startsWith('//')) coverImgUrl = 'https:' + src;
                        return false; // Break
                    }
                });

                if (coverImgUrl) {
                    const ext = coverImgUrl.split('.').pop().split(/[?#]/)[0] || 'jpg';
                    const filename = `news-${i + 1}.${ext}`;
                    const success = await downloadImage(coverImgUrl, filename);
                    if (success) {
                        localImgPath = `/webador_news/${filename}`;
                        console.log(`  [OK] Image: ${filename}`);
                    }
                }

                const newsData = {
                    id: i + 1,
                    title,
                    date,
                    content: content.substring(0, 5000), // Safety limit
                    originalUrl: articleUrl,
                    localImage: localImgPath,
                    scrapedAt: new Date().toISOString()
                };

                const dataPath = path.join(DATA_DIR, `news-${i + 1}.json`);
                fs.writeFileSync(dataPath, JSON.stringify(newsData, null, 2));
                console.log(`  [OK] saved to ${dataPath} (${fs.statSync(dataPath).size} bytes)`);

            } catch (err) {
                console.error(`  [ERR] Failed to process ${articleUrl}: ${err.message}`);
            }
        }

        console.log(`\n--- MISSION TERMINÉE ---`);
    } catch (e) {
        console.error(`CRITICAL ERROR: ${e.message}`);
    }
}

scrape();
