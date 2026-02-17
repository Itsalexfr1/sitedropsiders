import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://dropsiders.webador.fr';
const NEWS_URL = `${BASE_URL}/news`;
const IMG_DIR = path.resolve('./public/webador_news');
const DATA_DIR = path.resolve('./data/news');

// Configuration
const MAX_ARTICLES = 10;

// Init directories
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

async function downloadImage(url, filename) {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
            timeout: 10000
        });
        const filepath = path.join(IMG_DIR, filename);
        fs.writeFileSync(filepath, response.data);
        return true;
    } catch (e) {
        return false;
    }
}

async function scrape() {
    console.log("--- SCRAPER START ---");
    let allLinks = [];

    try {
        // 1. Get List of Articles (support pagination if needed)
        for (let page = 1; page <= 3; page++) {
            if (allLinks.length >= MAX_ARTICLES) break;

            const pUrl = page === 1 ? NEWS_URL : `${NEWS_URL}?page=${page}`;
            console.log(`Scanning list: ${pUrl}`);
            const { data: pageHtml } = await axios.get(pUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(pageHtml);

            $('a').each((_, el) => {
                const href = $(el).attr('href');
                if (href && href.startsWith('/news/') && !allLinks.includes(href)) {
                    allLinks.push(href);
                }
            });

            // If the special Webador segment pagination is used
            const segmentId = $('.jw-news').attr('data-jw-element-id');
            if (segmentId && page > 1) {
                const altPUrl = `${NEWS_URL}?${segmentId}-page=${page}`;
                const { data: altHtml } = await axios.get(altPUrl).catch(() => ({ data: '' }));
                if (altHtml) {
                    const $alt = cheerio.load(altHtml);
                    $alt('a').each((_, el) => {
                        const href = $alt(el).attr('href');
                        if (href && href.startsWith('/news/') && !allLinks.includes(href)) {
                            allLinks.push(href);
                        }
                    });
                }
            }
        }

        const toProcess = allLinks.slice(0, MAX_ARTICLES);
        console.log(`Found ${allLinks.length} total. Processing ${toProcess.length}...`);

        for (let i = 0; i < toProcess.length; i++) {
            const articleUrl = toProcess[i].startsWith('http') ? toProcess[i] : `${BASE_URL}${toProcess[i]}`;
            console.log(`\n[${i + 1}/${toProcess.length}] Processing: ${articleUrl}`);

            try {
                const { data: artHtml } = await axios.get(articleUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                const $a = cheerio.load(artHtml);

                const title = $a('h1').first().text().trim() || "No Title";
                const date = $a('meta[itemprop="datePublished"]').attr('content') || new Date().toISOString();

                // Targeted Content Extraction
                let textContent = "";
                // Webador specific containers
                const containers = [
                    'div.jw-element-news-content',
                    'div.news-page-content-container',
                    'main#main-content',
                    'div[data-section-name="content"]'
                ];

                for (const selector of containers) {
                    const el = $a(selector);
                    if (el.length) {
                        // Extract text and clean up whitespace
                        textContent = el.text().replace(/\s+/g, ' ').trim();
                        if (textContent.length > 100) break;
                    }
                }

                // Image Extraction
                let localImage = "";
                let coverImgUrl = "";

                $a('img').each((_, img) => {
                    let src = $a(img).attr('src');
                    if (src && !src.includes('logo') && !src.includes('favicon')) {
                        if (src.startsWith('//')) src = 'https:' + src;
                        if (!src.startsWith('http')) src = BASE_URL + src;
                        coverImgUrl = src;
                        return false;
                    }
                });

                if (coverImgUrl) {
                    const ext = coverImgUrl.split('.').pop().split(/[?#]/)[0] || 'jpg';
                    const filename = `news-${i + 1}.${ext.substring(0, 4)}`;
                    if (await downloadImage(coverImgUrl, filename)) {
                        localImage = `/webador_news/${filename}`;
                    }
                }

                const newsObject = {
                    id: i + 1,
                    title,
                    date,
                    content: textContent,
                    image: localImage,
                    url: articleUrl
                };

                const filePath = path.join(DATA_DIR, `news-${i + 1}.json`);
                fs.writeFileSync(filePath, JSON.stringify(newsObject, null, 2));
                console.log(`  Saved: ${filePath} (${textContent.length} chars)`);

            } catch (err) {
                console.error(`  Error processing article: ${err.message}`);
            }
        }

        console.log("\n--- SCRAPER FINISHED SUCCESS ---");
    } catch (e) {
        console.error(`CRITICAL: ${e.message}`);
    }
}

scrape();
