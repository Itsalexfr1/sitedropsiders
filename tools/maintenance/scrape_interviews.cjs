const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_URL = 'https://www.dropsiders.eu';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const OUTPUT_DIR = './public/images/interviews';
const DATA_FILE = './src/data/news.json';

// Ensure directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function sleep(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) { }
}

function curlGet(url) {
    try {
        console.log(`fetching ${url}...`);
        const cmd = `curl.exe -L -A "${UA}" "${url}" --max-time 20 -s`;
        const result = execSync(cmd, { maxBuffer: 10 * 1024 * 1024, encoding: 'utf8' });
        return result;
    } catch (e) {
        console.log(`  ERROR curl: ${e.message.substring(0, 100)}...`);
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
        console.log(`  ERROR downloading ${url}: ${e.message}`);
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
    const regex = /href="(\/interviews\/[^"]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        urls.add(match[1]);
    }
    return [...urls];
}

function extractDataFromArticle(html) {
    let title = '';
    const h1Match = html.match(/<h1[^>]*itemprop="headline"[^>]*>([\s\S]*?)<\/h1>/i) ||
        html.match(/<h1[^>]*class="[^"]*jw-heading[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match) title = h1Match[1].replace(/<[^>]+>/g, '').trim();

    let date = '';
    const dateMetaMatch = html.match(/<meta[^>]*itemprop="datePublished"[^>]*content="([^"T]+)/i);
    if (dateMetaMatch) {
        date = dateMetaMatch[1];
    } else {
        const dateTextMatch = html.match(/Publi.{1,5}\s+(\d{1,2}\s+\w+\.?\s+\d{4})/i);
        if (dateTextMatch) date = dateTextMatch[1];
    }

    let contentHtml = '';
    const contentMatch = html.match(/<div[^>]*class="[^"]*news-page-content-container[^"]*"[^>]*>([\s\S]*?)<div[^>]*class="jw-bottom-bar/i) ||
        html.match(/<div[^>]*data-section-name="content"[^>]*>([\s\S]*?)<\/main>/i);

    if (contentMatch) contentHtml = contentMatch[1];

    let summary = '';
    const pMatches = contentHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    if (pMatches) {
        for (let p of pMatches) {
            const cleanText = p.replace(/<[^>]+>/g, '').trim();
            if (cleanText.length > 50) {
                summary = cleanText;
                break;
            }
        }
    }

    let youtubeId = '';
    const ytMatch = html.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (ytMatch) youtubeId = ytMatch[1];

    return { title, date, content: contentHtml, summary, youtubeId };
}

function processImages(content, articleSlug) {
    const imgRegex = /src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp|gif)[^"]*)"/gi;
    let newContent = content;
    let coverImage = '';
    let images = [];
    let imgIndex = 1;
    let match;
    const imagesToDownload = [];

    while ((match = imgRegex.exec(content)) !== null) {
        let cleanUrl = match[1].replace(/&amp;/g, '&');
        if (cleanUrl.includes('favicon') || cleanUrl.includes('logo') || cleanUrl.includes('assets.jwwb.nl')) continue;
        imagesToDownload.push(cleanUrl);
    }

    const uniqueImages = [...new Set(imagesToDownload)];
    for (const imgUrl of uniqueImages) {
        let ext = '.jpg';
        if (imgUrl.includes('.png')) ext = '.png';
        if (imgUrl.includes('.webp')) ext = '.webp';
        const filename = `${articleSlug}-${imgIndex}${ext}`;
        const localPath = path.join(OUTPUT_DIR, filename);
        const publicPath = `/images/interviews/${filename}`;

        if (downloadFile(imgUrl, localPath)) {
            const escapedUrl = imgUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            newContent = newContent.replace(new RegExp(escapedUrl, 'g'), publicPath);
            if (imgIndex === 1) coverImage = publicPath;
            images.push(publicPath);
            imgIndex++;
        }
    }
    return { content: newContent, coverImage, images };
}

async function main() {
    console.log('Scraping Interviews from dropsiders.eu...');
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    let maxId = Math.max(...data.map(i => i.id), 0);
    const existingLinks = new Set(data.map(i => i.link));

    let page = 1;
    let hasNext = true;
    const newInterviews = [];

    while (hasNext) {
        const pageUrl = page === 1 ? `${BASE_URL}/interviews` : `${BASE_URL}/interviews?page=${page}`;
        const html = curlGet(pageUrl);
        if (!html || html.length < 1000) break;

        const urls = extractArticleUrls(html);
        if (urls.length === 0) break;

        for (const relUrl of urls) {
            const fullUrl = `${BASE_URL}${relUrl}`;
            if (existingLinks.has(fullUrl)) continue;

            const articleHtml = curlGet(fullUrl);
            if (!articleHtml) continue;

            const raw = extractDataFromArticle(articleHtml);
            if (!raw.title) continue;

            const slug = slugify(raw.title);
            const { content, coverImage, images } = processImages(raw.content, slug);

            newInterviews.push({
                id: ++maxId,
                title: raw.title,
                date: raw.date,
                category: 'Interview',
                summary: raw.summary,
                content: content,
                image: coverImage,
                images: images,
                youtubeId: raw.youtubeId,
                link: fullUrl
            });
            sleep(300);
        }
        page++;
        if (page > 10) break;
    }

    const finalData = [...newInterviews, ...data];
    fs.writeFileSync(DATA_FILE, JSON.stringify(finalData, null, 2));
    console.log(`Added ${newInterviews.length} interviews to ${DATA_FILE}`);
}

main();
