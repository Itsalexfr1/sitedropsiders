import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BASE_URL = 'https://www.dropsiders.eu';
const NEWS_URL = 'https://www.dropsiders.eu/news';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const IMG_OUTPUT_DIR = './public/images/news';

// Ensure directories exist
if (!fs.existsSync(IMG_OUTPUT_DIR)) {
    fs.mkdirSync(IMG_OUTPUT_DIR, { recursive: true });
}

// Helper: Curl GET
function curlGet(url) {
    try {
        console.log(`Fetching ${url}...`);
        // Added -I to check headers first if needed, but for now just get body with verbose error if fails
        const cmd = `curl.exe -L -A "${UA}" "${url}" --max-time 20 -s -o - -w "%{http_code}"`;
        // We capture stdout. The last 3 chars will be status code if we use -w %{http_code} but since we mix output, let's just use standard catch
        // Simpler: just get content. logic below checks length.

        const cmd2 = `curl.exe -L -A "${UA}" "${url}" --max-time 20 -s`;
        const result = execSync(cmd2, { maxBuffer: 10 * 1024 * 1024, encoding: 'utf8' });
        return result;
    } catch (e) {
        console.log(`  ERROR curl: ${e.message}`);
        // Try to get status code if possible or just return null
        return null;
    }
}

// Helper: Download File
function downloadFile(url, filepath) {
    try {
        const cmd = `curl.exe -L -A "${UA}" "${url}" -o "${filepath}" --create-dirs --max-time 30 -s`;
        execSync(cmd, { stdio: 'ignore' });
        return fs.existsSync(filepath) && fs.statSync(filepath).size > 0;
    } catch (e) {
        console.log(`  ERROR downloading ${url}: ${e.message}`);
        return false;
    }
}

function extractArticleUrl(html) {
    // Get the first news link
    const regex = /href="(\/news\/[^"]+)"/;
    const match = regex.exec(html);
    return match ? match[1] : null;
}

function extractArticleData(html) {
    // 1. Title
    let title = '';
    const h1Match = html.match(/<h1[^>]*itemprop="headline"[^>]*>([\s\S]*?)<\/h1>/i) ||
        html.match(/<h1[^>]*class="[^"]*jw-heading[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match) title = h1Match[1].replace(/<[^>]+>/g, '').trim();

    // 2. Date
    let date = '';
    const dateMeta = html.match(/<meta[^>]*itemprop="datePublished"[^>]*content="([^"]+)"/i);
    if (dateMeta) date = dateMeta[1];

    // 3. Content
    let content = '';
    const contentMatch = html.match(/<div[^>]*class="[^"]*news-page-content-container[^"]*"[^>]*>([\s\S]*?)<div[^>]*class="jw-bottom-bar/i) ||
        html.match(/<div[^>]*data-section-name="content"[^>]*>([\s\S]*?)<\/main>/i) ||
        html.match(/<div[^>]*data-section-name="content"[^>]*>([\s\S]*?)<footer/i);
    if (contentMatch) content = contentMatch[1];

    // Clean content
    content = content.replace(/<div[^>]*jw-social-share[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '');
    content = content.replace(/<div[^>]*jw-comment-module[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '');

    return { title, date, content };
}

function processImages(content, articleSlug) {
    const imgRegex = /src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp|gif)[^"]*)"/gi;
    let match;
    const images = [];
    while ((match = imgRegex.exec(content)) !== null) {
        images.push(match[1]);
    }

    // Just take the first image for this test
    if (images.length === 0) return { newContent: content, coverImage: null };

    const firstImage = images[0];
    const cleanUrl = firstImage.replace(/&amp;/g, '&');

    // Define local path
    let ext = '.jpg';
    if (cleanUrl.includes('.png')) ext = '.png';
    const filename = `${articleSlug}-cover${ext}`;
    const localPath = path.join(IMG_OUTPUT_DIR, filename);
    const webPath = `/public/images/news/${filename}`; // Just for display

    console.log(`  Downloading image: ${cleanUrl} -> ${localPath}`);
    const success = downloadFile(cleanUrl, localPath);

    let newContent = content;
    if (success) {
        newContent = content.replace(firstImage, webPath);
    }

    return { newContent, coverImage: webPath, originalImage: cleanUrl, success };
}

async function main() {
    console.log('=== SINGLE ARTICLE TEST ===');

    // 1. Get List
    const listHtml = curlGet(NEWS_URL);
    if (!listHtml) {
        console.error('FAILED to fetch news list.');
        return;
    }

    const relUrl = extractArticleUrl(listHtml);
    if (!relUrl) {
        console.error('FAILED to find any article URL in the list.');
        return;
    }

    const fullUrl = `${BASE_URL}${relUrl}`;
    console.log(`Target Article: ${fullUrl}`);

    // 2. Get Article
    const articleHtml = curlGet(fullUrl);
    if (!articleHtml) {
        console.error('FAILED to fetch article content.');
        return;
    }

    // 3. Extract
    const { title, date, content } = extractArticleData(articleHtml);
    if (!title) {
        console.error('FAILED to extract title.');
        return;
    }

    console.log(`\n--- EXTRACTED DATA ---`);
    console.log(`Title: ${title}`);
    console.log(`Date:  ${date}`);
    console.log(`Content Length: ${content.length} chars`);

    // 4. Download 1 Image
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 50);
    const { coverImage, success } = processImages(content, slug);

    if (coverImage && success) {
        console.log(`Image Status: SUCCESS (${coverImage})`);
    } else {
        console.log(`Image Status: FAILED or NO IMAGE FOUND`);
    }

    console.log('\n=== TEST COMPLETE ===');
    console.log('Please validate this output before I proceed with the batch.');
}

main();
