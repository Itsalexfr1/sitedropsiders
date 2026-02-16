import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BASE_URL = 'https://www.dropsiders.eu';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const DATA_FILE = './src/data/news.json';
const IMG_OUTPUT_DIR = './public/images/news';
const BATCH_SIZE = 2; // User requested max 2 articles at a time
const PAGES_TO_SCAN = 3;

// Ensure directories exist
if (!fs.existsSync(IMG_OUTPUT_DIR)) {
    fs.mkdirSync(IMG_OUTPUT_DIR, { recursive: true });
}

function sleep(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) { }
}

function curlGet(url) {
    try {
        console.log(`Fetching ${url}...`);
        const cmd = `curl.exe -L -A "${UA}" "${url}" --max-time 20 -s`;
        const result = execSync(cmd, { maxBuffer: 10 * 1024 * 1024, encoding: 'utf8' });
        return result;
    } catch (e) {
        console.log(`  ERROR curl: ${e.message.substring(0, 50)}...`);
        return '';
    }
}

function downloadFile(url, filepath) {
    if (fs.existsSync(filepath)) return true;
    try {
        const cmd = `curl.exe -L -A "${UA}" "${url}" -o "${filepath}" --create-dirs --max-time 30 -s`;
        execSync(cmd, { stdio: 'ignore' });
        return fs.existsSync(filepath) && fs.statSync(filepath).size > 0;
    } catch (e) {
        console.log(`  ERROR downloading image: ${e.message}`);
        return false;
    }
}

function slugify(text) {
    return text.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 80);
}

function extractArticleUrls(html) {
    const urls = new Set();
    const regex = /href="(\/news\/[^"]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        urls.add(match[1]);
    }
    return [...urls];
}

function extractArticleData(html) {
    let title = '';
    const h1Match = html.match(/<h1[^>]*itemprop="headline"[^>]*>([\s\S]*?)<\/h1>/i) ||
        html.match(/<h1[^>]*class="[^"]*jw-heading[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match) title = h1Match[1].replace(/<[^>]+>/g, '').trim();

    let date = '';
    const dateMeta = html.match(/<meta[^>]*itemprop="datePublished"[^>]*content="([^"]+)"/i);
    if (dateMeta) {
        date = dateMeta[1];
    } else {
        const dateText = html.match(/Publi.{1,5}\s+(\d{1,2}\s+\w+\.?\s+\d{4})/i);
        if (dateText) date = dateText[1];
    }

    let content = '';
    const contentMatch = html.match(/<div[^>]*class="[^"]*news-page-content-container[^"]*"[^>]*>([\s\S]*?)<div[^>]*class="jw-bottom-bar/i) ||
        html.match(/<div[^>]*data-section-name="content"[^>]*>([\s\S]*?)<\/main>/i) ||
        html.match(/<div[^>]*data-section-name="content"[^>]*>([\s\S]*?)<footer/i);
    if (contentMatch) content = contentMatch[1];

    // Clean content
    content = content.replace(/<div[^>]*jw-social-share[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '');
    content = content.replace(/<div[^>]*jw-comment-module[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '');

    let youtubeId = '';
    const ytMatch = html.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (ytMatch) youtubeId = ytMatch[1];

    return { title, date, content, youtubeId };
}

function processImages(content, articleSlug) {
    const imgRegex = /src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp|gif)[^"]*)"/gi;
    let newContent = content;
    let coverImage = '';
    let imgIndex = 1;
    let match;
    const imagesToProcess = [];

    while ((match = imgRegex.exec(content)) !== null) {
        imagesToProcess.push(match[1]);
    }
    const uniqueImages = [...new Set(imagesToProcess)];

    for (const imgUrl of uniqueImages) {
        let cleanUrl = imgUrl.replace(/&amp;/g, '&');
        if (cleanUrl.includes('favicon') || cleanUrl.includes('logo') || cleanUrl.includes('assets.jwwb.nl')) continue;

        let ext = '.jpg';
        if (imgUrl.includes('.png')) ext = '.png';
        if (imgUrl.includes('.webp')) ext = '.webp';

        const filename = `${articleSlug}-${imgIndex}${ext}`;
        const localPath = path.join(IMG_OUTPUT_DIR, filename);
        const webPath = `/images/news/${filename}`; // Public path for Vite

        const success = downloadFile(cleanUrl, localPath);
        if (success) {
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
    console.log(`=== BATCH MIGRATION (Max ${BATCH_SIZE}) ===`);

    let existingArticles = [];
    if (fs.existsSync(DATA_FILE)) {
        existingArticles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }

    const articlesMap = new Map();
    existingArticles.forEach(a => articlesMap.set(a.link, a));

    // Simple page parameter discovery (usually ?page=X or ?12850969-page=X)
    // Based on previous test, ?12850969-page=X worked.
    const pageParam = '12850969-page';

    let newUrls = [];
    for (let page = 1; page <= PAGES_TO_SCAN; page++) {
        const url = page === 1 ? `${BASE_URL}/news` : `${BASE_URL}/news?${pageParam}=${page}`;
        const html = curlGet(url);
        if (!html) continue;

        const urls = extractArticleUrls(html);
        for (const relUrl of urls) {
            const fullUrl = `${BASE_URL}${relUrl}`;
            if (!articlesMap.has(fullUrl)) {
                newUrls.push(fullUrl);
            }
        }
    }

    console.log(`Trouvé ${newUrls.length} nouveaux articles.`);
    const batch = newUrls.slice(0, BATCH_SIZE);

    if (batch.length === 0) {
        console.log("Rien à traiter.");
        return;
    }

    console.log(`Traitement du lot de ${batch.length} articles...`);
    let idCounter = existingArticles.length > 0 ? Math.max(...existingArticles.map(a => a.id)) + 1 : 1;

    for (const url of batch) {
        console.log(`Processing: ${url}`);
        const html = curlGet(url);
        if (!html) continue;

        const data = extractArticleData(html);
        if (!data.title) continue;

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

        articlesMap.set(url, newArticle);
        console.log(`  Saved: ${data.title}`);

        fs.writeFileSync(DATA_FILE, JSON.stringify([...articlesMap.values()], null, 2));
        sleep(1000);
    }

    console.log(`\nLot terminé. Total articles: ${articlesMap.size}`);
}

main();
