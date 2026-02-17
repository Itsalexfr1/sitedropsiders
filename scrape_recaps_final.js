
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.dropsiders.eu';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Specifically targeting Recaps
const CATEGORY = 'recaps';
const OUTPUT_DIR = './public/images';
const DATA_FILE = './src/data/recaps_scraped.json';

// Ensure directories exist
fs.mkdirSync(path.join(OUTPUT_DIR, CATEGORY), { recursive: true });
fs.mkdirSync('./src/data', { recursive: true });

function sleep(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) { }
}

function curlGet(url) {
    try {
        console.log(`fetching ${url}...`);
        // Use specifically curl.exe to avoid powershell alias issues
        const cmd = `curl.exe -L -A "${UA}" "${url}" --max-time 20 -s`;
        const result = execSync(cmd, { maxBuffer: 10 * 1024 * 1024, encoding: 'utf8' });
        return result;
    } catch (e) {
        console.log(`  ERROR curl: ${e.message.substring(0, 100)}...`);
        return '';
    }
}

function downloadFile(url, filepath) {
    if (fs.existsSync(filepath) && fs.statSync(filepath).size > 0) return true;
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
    if (!text) return 'untitled';
    return text.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 80);
}

function extractArticleUrls(html) {
    const urls = new Set();
    // Look for links like /recaps/123-title OR /recap/123-title
    // The main listing usually links to the detail page.
    // We search for both singular and plural forms just in case.
    const regex = /href="(\/(?:recaps|recap)\/[^"]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        // Exclude pagination links if they look like /recaps?page=...
        if (!match[1].includes('?')) {
            urls.add(match[1]);
        }
    }
    return [...urls];
}

function extractDataFromArticle(html, articleUrl) {
    // Title
    let title = '';
    const h1Match = html.match(/<h1[^>]*itemprop="headline"[^>]*>([\s\S]*?)<\/h1>/i) ||
        html.match(/<h1[^>]*class="[^"]*jw-heading[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ||
        html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);

    if (h1Match) {
        title = h1Match[1].replace(/<[^>]+>/g, '').trim();
    }

    // Date
    let date = new Date().toISOString();
    const dateMetaMatch = html.match(/<meta[^>]*itemprop="datePublished"[^>]*content="([^"]+)"/i);
    if (dateMetaMatch) {
        date = dateMetaMatch[1];
    } else {
        const dateTextMatch = html.match(/Publi.{1,5}\s+(\d{1,2}\s+\w+\.?\s+\d{4})/i);
        if (dateTextMatch) {
            // naive parse or just use current if impossible
            // We just keep the raw if we can't parse easily without a library, but usually ISO is best
            // Let's try to pass the raw string if needed, or default to now
        }
    }

    // Content
    // Often in <div class="news-page-content-container"> or data-section-name="content"
    let contentHtml = '';
    const contentMatch = html.match(/<div[^>]*class="[^"]*news-page-content-container[^"]*"[^>]*>([\s\S]*?)<div[^>]*class="jw-bottom-bar/i) ||
        html.match(/<div[^>]*data-section-name="content"[^>]*>([\s\S]*?)<\/main>/i) ||
        html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);

    if (contentMatch) {
        contentHtml = contentMatch[1];
    }

    // Cleanup extra UI elements in content
    contentHtml = contentHtml.replace(/<div[^>]*jw-social-share[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '');
    contentHtml = contentHtml.replace(/<div[^>]*jw-comment-module[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '');

    // Summary (first P > 50 chars)
    let summary = '';
    const pMatches = contentHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    if (pMatches) {
        for (let p of pMatches) {
            const clean = p.replace(/<[^>]+>/g, '').trim();
            if (clean.length > 50) {
                summary = clean;
                break;
            }
        }
    }

    // Youtube
    let youtubeId = '';
    const ytMatch = html.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (ytMatch) youtubeId = ytMatch[1];

    return { title, date, content: contentHtml, summary, youtubeId };
}

function processImages(content, articleSlug) {
    // Regex for images
    const imgRegex = /src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp|gif)[^"]*)"/gi;
    let newContent = content;
    let coverImage = '';
    let imgIndex = 1;
    let match;
    const imagesToDownload = [];

    // Find all images
    while ((match = imgRegex.exec(content)) !== null) {
        let fullUrl = match[1];
        let cleanUrl = fullUrl.replace(/&amp;/g, '&');

        // Filter out icons/logos
        if (cleanUrl.includes('favicon') || cleanUrl.includes('assets.jwwb.nl')) continue;

        imagesToDownload.push(cleanUrl);
    }

    // Unique
    const uniqueImages = [...new Set(imagesToDownload)];

    for (const imgUrl of uniqueImages) {
        let ext = '.jpg';
        if (imgUrl.includes('.png')) ext = '.png';
        if (imgUrl.includes('.webp')) ext = '.webp';
        if (imgUrl.includes('.gif')) ext = '.gif';

        const filename = `${articleSlug}-${imgIndex}${ext}`;
        const localPath = path.join(OUTPUT_DIR, CATEGORY, filename);
        // Path used in the JSON/Frontend
        const publicPath = `/images/${CATEGORY}/${filename}`;

        const success = downloadFile(imgUrl, localPath);
        if (success) {
            // Replace in content
            // Escape special chars for regex
            const escapedUrl = imgUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // We replace generic src="..." with our local path
            // Note: simplistic replacement
            newContent = newContent.replace(new RegExp(escapedUrl, 'g'), publicPath);

            if (imgIndex === 1) coverImage = publicPath;
            imgIndex++;
        }
    }

    // Return the list of all successfully processed/downloaded images (public paths)
    // We can reconstruct the list from uniqueImages if we know they were successful, 
    // but better to collect the public paths of successful ones.
    const validImages = [];
    imgIndex = 1;
    for (const imgUrl of uniqueImages) {
        let ext = '.jpg';
        if (imgUrl.includes('.png')) ext = '.png';
        if (imgUrl.includes('.webp')) ext = '.webp';
        if (imgUrl.includes('.gif')) ext = '.gif';
        const filename = `${articleSlug}-${imgIndex}${ext}`;
        const publicPath = `/images/${CATEGORY}/${filename}`;
        // We assume if one worked, we add it. 
        // Realistically we should check if downloadFile returned true, 
        // but we didn't track it per image in the loop above efficiently.
        // Let's just re-calculate or better yet, refactor the loop slightly.
        const localPath = path.join(OUTPUT_DIR, CATEGORY, filename);
        if (fs.existsSync(localPath)) {
            validImages.push(publicPath);
        }
        imgIndex++;
    }

    return { content: newContent, coverImage, images: validImages };
}

async function main() {
    console.log('Starting Dropsiders Recaps Scraper...');
    let allArticles = [];
    let idCounter = 1;

    // Iterate pages
    let page = 1;
    let hasNext = true;

    // We check both recaps and recap singular just in case, but usually base url is /recaps or /recap
    // Adjust base if needed. Dropsiders.eu usually uses plural for listing.
    const RECAP_BASE = `${BASE_URL}/recaps`;
    // If 404, try singular? We can try-catch.

    while (hasNext) {
        const pageUrl = page === 1 ? RECAP_BASE : `${RECAP_BASE}?page=${page}`;
        console.log(`\nScanning Page ${page}: ${pageUrl}`);

        let html = curlGet(pageUrl);
        // Check if 404 or empty
        if (!html || html.length < 1000 || html.includes('404 Not Found')) {
            // Try singular 'recap' if page 1 fails?
            if (page === 1) {
                console.log("  /recaps not found, trying /recap ...");
                const altUrl = `${BASE_URL}/recap`;
                html = curlGet(altUrl);
                if (!html || html.length < 1000) {
                    console.log("  /recap also failed. Stopping.");
                    hasNext = false;
                    break;
                }
            } else {
                console.log('  End of pagination or error.');
                hasNext = false;
                break;
            }
        }

        const articleUrls = extractArticleUrls(html);
        if (articleUrls.length === 0) {
            console.log('  No articles found. Stopping.');
            hasNext = false;
            break;
        }

        console.log(`  Found ${articleUrls.length} articles.`);

        for (const relUrl of articleUrls) {
            const fullUrl = `${BASE_URL}${relUrl}`;
            console.log(`    Processing: ${fullUrl}`);

            try {
                const articleHtml = curlGet(fullUrl);
                if (!articleHtml) continue;

                const data = extractDataFromArticle(articleHtml, fullUrl);
                if (!data.title) {
                    console.log('      WARNING: Could not parse title.');
                    continue;
                }

                const slug = slugify(data.title);
                const { content, coverImage, images } = processImages(data.content, slug);

                const isDuplicate = allArticles.some(article => article.link === fullUrl);
                if (!isDuplicate) {
                    allArticles.push({
                        id: idCounter++,
                        title: data.title,
                        date: data.date,
                        author: "Dropsiders",
                        category: "Recap",
                        summary: data.summary,
                        content: content,
                        image: coverImage,
                        images: images,
                        youtubeId: data.youtubeId,
                        link: fullUrl
                    });
                } else {
                    console.log(`      Skipping duplicate: ${data.title}`);
                }

                // Output progress
                console.log(`      Saved: ${data.title} (Images: ${images.length})`);
            } catch (err) {
                console.error(`      ERROR processing ${fullUrl}:`, err);
            }
            sleep(500);
        }

        page++;
        // Limit to 20 pages to avoid infinite loops if pagination detection fails
        if (page > 20) hasNext = false;
    }

    console.log(`\nTotal Recaps Scraped: ${allArticles.length}`);
    fs.writeFileSync(DATA_FILE, JSON.stringify(allArticles, null, 2));
    console.log(`Saved to ${DATA_FILE}`);
}

main();
