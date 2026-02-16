import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BASE_URL = 'https://www.dropsiders.eu';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const DATA_FILE = './src/data/news.json';
const IMG_OUTPUT_DIR = './public/images/news';
const BATCH_SIZE = 3;

// Ensure directories exist
if (!fs.existsSync(IMG_OUTPUT_DIR)) {
    fs.mkdirSync(IMG_OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync('./src/data')) {
    fs.mkdirSync('./src/data', { recursive: true });
}

// Helper: Sleep
function sleep(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) { }
}

// Helper: Curl GET
function curlGet(url) {
    try {
        console.log(`Checking ${url}...`);
        const cmd = `curl.exe -L -A "${UA}" "${url}" --max-time 20 -s`;
        const result = execSync(cmd, { maxBuffer: 10 * 1024 * 1024, encoding: 'utf8' });
        return result;
    } catch (e) {
        console.log(`  ERROR curl: ${e.message.substring(0, 50)}...`);
        return '';
    }
}

// Helper: Download File
function downloadFile(url, filepath) {
    if (fs.existsSync(filepath)) return true;
    try {
        const cmd = `curl.exe -L -A "${UA}" "${url}" -o "${filepath}" --create-dirs --max-time 30 -s`;
        execSync(cmd, { stdio: 'ignore' });
        return fs.existsSync(filepath) && fs.statSync(filepath).size > 0;
    } catch (e) {
        console.log(`  ERROR downloading ${url}: ${e.message}`);
        return false;
    }
}

// Helper: Slugify
function slugify(text) {
    return text.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 80);
}

// Helper: Extract Article URLs from a list page
function extractArticleUrls(html) {
    const urls = new Set();
    const regex = /href="(\/news\/[^"]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        urls.add(match[1]);
    }
    return [...urls];
}

// Helper: Extract Data from Article Page
function extractArticleData(html, url) {
    // 1. Title
    let title = '';
    const h1Match = html.match(/<h1[^>]*itemprop="headline"[^>]*>([\s\S]*?)<\/h1>/i) ||
        html.match(/<h1[^>]*class="[^"]*jw-heading[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match) {
        title = h1Match[1].replace(/<[^>]+>/g, '').trim();
    }

    // 2. Date
    let date = '';
    const dateMeta = html.match(/<meta[^>]*itemprop="datePublished"[^>]*content="([^"]+)"/i);
    if (dateMeta) {
        date = dateMeta[1];
    } else {
        const dateText = html.match(/Publi.{1,5}\s+(\d{1,2}\s+\w+\.?\s+\d{4})/i);
        if (dateText) date = dateText[1];
    }

    // 3. Content
    let content = '';
    const contentMatch = html.match(/<div[^>]*class="[^"]*news-page-content-container[^"]*"[^>]*>([\s\S]*?)<div[^>]*class="jw-bottom-bar/i) ||
        html.match(/<div[^>]*data-section-name="content"[^>]*>([\s\S]*?)<\/main>/i) ||
        html.match(/<div[^>]*data-section-name="content"[^>]*>([\s\S]*?)<footer/i);

    if (contentMatch) {
        content = contentMatch[1];
    }

    // Cleanup Content
    content = content.replace(/<div[^>]*jw-social-share[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '');
    content = content.replace(/<div[^>]*jw-comment-module[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '');

    // 4. YouTube
    let youtubeId = '';
    const ytMatch = html.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (ytMatch) youtubeId = ytMatch[1];

    return { title, date, content, youtubeId };
}

// Helper: Process Images
function processImages(content, articleSlug) {
    const imgRegex = /src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp|gif)[^"]*)"/gi;
    let newContent = content;
    let coverImage = '';
    let imgIndex = 1;
    let match;
    const imagesToProcess = [];

    // Find all images first
    while ((match = imgRegex.exec(content)) !== null) {
        imagesToProcess.push(match[1]);
    }
    const uniqueImages = [...new Set(imagesToProcess)];

    for (const imgUrl of uniqueImages) {
        let cleanUrl = imgUrl.replace(/&amp;/g, '&');

        // Skip junk
        if (cleanUrl.includes('favicon') || cleanUrl.includes('logo') || cleanUrl.includes('assets.jwwb.nl')) continue;

        // Extension
        let ext = '.jpg';
        if (imgUrl.includes('.png')) ext = '.png';
        if (imgUrl.includes('.webp')) ext = '.webp';
        if (imgUrl.includes('.gif')) ext = '.gif';

        const filename = `${articleSlug}-${imgIndex}${ext}`;
        const localPath = path.join(IMG_OUTPUT_DIR, filename);
        // User requested ex: /public/image_nom.jpg
        const webPath = `/public/images/news/${filename}`;

        const success = downloadFile(cleanUrl, localPath);
        if (success) {
            // Replace in content
            // Escape regex special chars in URL
            const escapedUrl = imgUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const replaceRegex = new RegExp(escapedUrl, 'g');
            newContent = newContent.replace(replaceRegex, webPath);

            if (imgIndex === 1) coverImage = webPath;
            imgIndex++;
        }
    }

    return { content: newContent, coverImage };
}

async function main() {
    console.log('=== STARTING BATCH MIGRATION (Max 3) ===');

    // 1. Load existing data
    let articles = [];
    if (fs.existsSync(DATA_FILE)) {
        articles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
    const processedUrls = new Set(articles.map(a => a.link));
    console.log(`Loaded ${articles.length} existing articles.`);

    // 2. Scan for new articles
    let page = 1;
    let newArticlesFound = [];
    let stopScanning = false;

    while (!stopScanning) {
        const url = page === 1 ? `${BASE_URL}/news` : `${BASE_URL}/news?page=${page}`;
        const html = curlGet(url);

        if (!html || html.length < 1000) {
            console.log("End of pages or empty response.");
            break;
        }

        const foundUrls = extractArticleUrls(html);
        if (foundUrls.length === 0) break;

        for (const relUrl of foundUrls) {
            const fullUrl = `${BASE_URL}${relUrl}`;
            if (!processedUrls.has(fullUrl)) {
                newArticlesFound.push(fullUrl);
            }
        }

        // If we have enough for a batch, we can stop scanning deep pages
        // But scanning a few pages is fast. Let's limit to 5 pages scan to be safe or until we have at least BATCH_SIZE
        if (newArticlesFound.length >= BATCH_SIZE) {
            stopScanning = true;
        } else {
            page++;
            if (page > 5) stopScanning = true; // limit scan depth for now
        }
    }

    console.log(`Found ${newArticlesFound.length} new articles to process.`);

    // 3. Process Batch
    const batch = newArticlesFound.slice(0, BATCH_SIZE);
    if (batch.length === 0) {
        console.log("No new articles to process.");
        return;
    }

    let idCounter = articles.length > 0 ? Math.max(...articles.map(a => a.id)) + 1 : 1;

    for (const url of batch) {
        console.log(`Processing: ${url}`);
        const html = curlGet(url);
        if (!html) continue;

        const data = extractArticleData(html, url);
        if (!data.title) {
            console.log("  SKIP: Could not extract title.");
            continue;
        }

        const slug = slugify(data.title);
        const { content: finalContent, coverImage } = processImages(data.content, slug);

        const newArticle = {
            id: idCounter++,
            title: data.title,
            date: data.date,
            author: "Dropsiders",
            category: "News",
            image: coverImage,
            content: finalContent,
            youtubeId: data.youtubeId,
            link: url
        };

        articles.push(newArticle);
        console.log(`  Saved: ${data.title}`);

        // Save immediately to avoid data loss
        fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2));

        sleep(1000); // Politeness
    }

    console.log(`\nBatch complete. ${batch.length} articles processed.`);
    console.log(`Total articles in DB: ${articles.length}`);
}

main();
