
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BASE_URL = 'https://www.dropsiders.eu';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const CATEGORIES = ['news', 'recaps', 'interviews'];
const OUTPUT_DIR = './public/images';
const DATA_FILE = './src/data/news.json';

// Ensure directories exist
CATEGORIES.forEach(cat => {
    fs.mkdirSync(path.join(OUTPUT_DIR, cat), { recursive: true });
});
fs.mkdirSync('./src/data', { recursive: true });

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

function extractArticleUrls(html, category) {
    const urls = new Set();
    // Look for links like /news/123-title or /recaps/123-title
    const regex = new RegExp(`href="(/${category}/[^"]+)"`, 'g');
    let match;
    while ((match = regex.exec(html)) !== null) {
        urls.add(match[1]);
    }
    return [...urls];
}

function extractDataFromArticle(html, category, articleUrl) {
    // Title: <h1 ... itemprop="headline">...</h1> OR class="jw-heading-130..."
    let title = '';
    const h1Match = html.match(/<h1[^>]*itemprop="headline"[^>]*>([\s\S]*?)<\/h1>/i) ||
        html.match(/<h1[^>]*class="[^"]*jw-heading[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match) {
        title = h1Match[1].replace(/<[^>]+>/g, '').trim();
    }

    // Date: meta itemprop="datePublished" content="..."
    let date = '';
    const dateMetaMatch = html.match(/<meta[^>]*itemprop="datePublished"[^>]*content="([^"]+)"/i);
    if (dateMetaMatch) {
        date = dateMetaMatch[1];
    } else {
        // Fallback to text: "Publié le 12 février 2026"
        const dateTextMatch = html.match(/Publi.{1,5}\s+(\d{1,2}\s+\w+\.?\s+\d{4})/i);
        if (dateTextMatch) date = dateTextMatch[1];
    }

    // Unescape date if it formatted weirdly, but usually iso string in meta is fine

    // Content Container
    // Based on inspection, content seems to be in <div class="news-page-content-container"> or data-section-name="content"
    // Also look for blocks of text
    let contentHtml = '';
    const contentMatch = html.match(/<div[^>]*class="[^"]*news-page-content-container[^"]*"[^>]*>([\s\S]*?)<div[^>]*class="jw-bottom-bar/i) ||
        html.match(/<div[^>]*data-section-name="content"[^>]*>([\s\S]*?)<\/main>/i);
    // Note: The regex might need to be loose. The structure in debug_article.html showed <div class="news-page-content-container">... content ...</div> then footer/bottom bar.

    if (contentMatch) {
        contentHtml = contentMatch[1];
    } else {
        // Fallback: try to grab the jw-section-content
        const sectionMatch = html.match(/<div[^>]*data-section-name="content"[^>]*>([\s\S]*?)<footer/i);
        if (sectionMatch) contentHtml = sectionMatch[1];
    }

    // Clean up content: Remove sharing buttons, comments, etc if they were captured
    contentHtml = contentHtml.replace(/<div[^>]*jw-social-share[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '');
    contentHtml = contentHtml.replace(/<div[^>]*jw-comment-module[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '');

    // Extract Summary (first valid p)
    let summary = '';
    const pMatches = contentHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    if (pMatches && pMatches.length > 0) {
        for (let p of pMatches) {
            const cleanText = p.replace(/<[^>]+>/g, '').trim();
            if (cleanText.length > 50) {
                summary = cleanText;
                break;
            }
        }
    }

    // Youtube ID
    let youtubeId = '';
    const ytMatch = html.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (ytMatch) {
        youtubeId = ytMatch[1];
    }

    return { title, date, content: contentHtml, summary, youtubeId };
}

function processImages(content, articleSlug, category) {
    const imgRegex = /src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp|gif)[^"]*)"/gi;
    let newContent = content;
    let coverImage = '';
    let imgIndex = 1;
    let match;
    const imagesToDownload = [];

    while ((match = imgRegex.exec(content)) !== null) {
        const fullUrl = match[1];
        // Clean URL (remove query params for extension check, but keep for download if needed? usually webador adds params for scaling)
        // Webador urls: https://primary.jwwb.nl/.../image.jpg?params...
        // We want the clean url or handle it safely.

        let cleanUrl = fullUrl.replace(/&amp;/g, '&');

        // Skip tiny assets
        if (cleanUrl.includes('favicon') || cleanUrl.includes('logo') || cleanUrl.includes('assets.jwwb.nl')) continue;

        imagesToDownload.push(cleanUrl);
    }

    // Unique images
    const uniqueImages = [...new Set(imagesToDownload)];

    for (const imgUrl of uniqueImages) {
        // determine extension
        let ext = '.jpg';
        if (imgUrl.includes('.png')) ext = '.png';
        if (imgUrl.includes('.webp')) ext = '.webp';
        if (imgUrl.includes('.gif')) ext = '.gif';
        if (imgUrl.includes('.jpeg')) ext = '.jpg';

        const filename = `${articleSlug}-${imgIndex}${ext}`;
        const localPath = path.join(OUTPUT_DIR, category, filename);
        const publicPath = `/images/${category}/${filename}`;

        const success = downloadFile(imgUrl, localPath);

        if (success) {
            // Replace in content. Note: Regex needs to handle the exact string found in source, 
            // but we have the full URL from the regex match group 1.
            // We need to be careful about escaping for regex replacement.
            const escapedUrl = imgUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const replaceRegex = new RegExp(escapedUrl, 'g');
            newContent = newContent.replace(replaceRegex, publicPath);

            if (imgIndex === 1) coverImage = publicPath;
            imgIndex++;
        }
    }

    return { content: newContent, coverImage };
}

async function main() {
    console.log('Starting Dropsiders.eu Scraper...');

    let allArticles = [];
    let idCounter = 1;

    for (const category of CATEGORIES) {
        console.log(`\n=== Processing Category: ${category.toUpperCase()} ===`);
        // Iterate pages until no more articles found, or 404
        let page = 1;
        let hasNext = true;
        const categoryArticles = [];

        while (hasNext) {
            const pageUrl = page === 1 ? `${BASE_URL}/${category}` : `${BASE_URL}/${category}?page=${page}`;
            console.log(`Scanning ${pageUrl}...`);
            const html = curlGet(pageUrl);

            if (!html || html.length < 1000) {
                console.log('  Empty or short response, stopping pagination for ' + category);
                hasNext = false;
                break;
            }

            const articleUrls = extractArticleUrls(html, category);
            if (articleUrls.length === 0) {
                console.log('  No articles found on this page, stopping.');
                hasNext = false;
                break;
            }

            console.log(`  Found ${articleUrls.length} articles.`);

            for (const relUrl of articleUrls) {
                const fullUrl = `${BASE_URL}${relUrl}`;
                console.log(`    Processing: ${fullUrl}`);

                const articleHtml = curlGet(fullUrl);
                if (!articleHtml) continue;

                const rawData = extractDataFromArticle(articleHtml, category, fullUrl);
                if (!rawData.title) {
                    console.log('      WARNING: Could not parse title, skipping.');
                    continue;
                }

                const slug = slugify(rawData.title);
                const { content: finalContent, coverImage } = processImages(rawData.content, slug, category);

                // Add to list
                categoryArticles.push({
                    id: idCounter++,
                    originalId: relUrl, // keep track to avoid dupes if running multiple times?
                    title: rawData.title,
                    date: rawData.date,
                    author: "Dropsiders", // Default
                    category: category === 'recaps' ? 'Recap' : (category === 'interviews' ? 'Interview' : 'News'),
                    summary: rawData.summary,
                    content: finalContent,
                    image: coverImage,
                    youtubeId: rawData.youtubeId,
                    link: fullUrl
                });

                sleep(500); // Politeness delay
            }

            page++;
            // Safety break for testing (remove if you want ALL pages)
            if (page > 30) { hasNext = false; console.log("Max pages reached limit"); }
        }

        allArticles = allArticles.concat(categoryArticles);
    }

    console.log(`\nTotal Articles Scraped: ${allArticles.length}`);
    fs.writeFileSync(DATA_FILE, JSON.stringify(allArticles, null, 2));
    console.log(`Saved to ${DATA_FILE}`);
}

main();
