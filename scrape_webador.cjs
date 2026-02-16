const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SOURCE_URL = "https://dropsiders.webador.fr";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const IMG_DIR = './public/webador_news';
const DATA_FILE = './webador_news.json';
const TARGET_COUNT = 10;

if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

function curlGet(url) {
    try {
        const cmd = `curl.exe -L -A "${UA}" "${url}" -s`;
        return execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    } catch (e) { return ''; }
}

function downloadFile(url, filepath) {
    try {
        const cmd = `curl.exe -L -A "${UA}" "${url}" -o "${filepath}" --create-dirs -s`;
        execSync(cmd);
        return fs.existsSync(filepath) && fs.statSync(filepath).size > 0;
    } catch (e) { return false; }
}

function extractLinks(html) {
    const found = [];
    const regex = /href="(\/news\/[0-9]{5,}_[^"]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        if (!found.includes(match[1])) found.push(match[1]);
    }
    return found;
}

async function main() {
    console.log(`--- SCRAPING WEBADOR (Target: ${TARGET_COUNT}) ---`);

    let links = [];

    // Page 1
    console.log("Fetching Page 1...");
    const p1Html = curlGet(`${SOURCE_URL}/news`);
    links = extractLinks(p1Html);
    console.log(`  Found ${links.length} links on page 1.`);

    // Page 2 if needed
    if (links.length < TARGET_COUNT) {
        console.log("Fetching Page 2...");
        // Usually webador pagination is ?page=2
        const p2Html = curlGet(`${SOURCE_URL}/news?page=2`);
        const p2Links = extractLinks(p2Html);
        p2Links.forEach(l => {
            if (!links.includes(l)) links.push(l);
        });
        console.log(`  Total links after page 2: ${links.length}`);
    }

    const toProcess = links.slice(0, TARGET_COUNT);
    const results = [];

    for (let i = 0; i < toProcess.length; i++) {
        const relLink = toProcess[i];
        const url = `${SOURCE_URL}${relLink}`;
        console.log(`\n[${i + 1}/${toProcess.length}] Processing: ${url}`);

        const articleHtml = curlGet(url);
        if (!articleHtml) continue;

        // Title
        let title = "Sans titre";
        const titleMatch = articleHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        if (titleMatch) title = titleMatch[1].replace(/<[^>]+>/g, '').trim();

        // Image
        let imageUrl = "";
        let localImage = "";
        const imgMatches = articleHtml.matchAll(/src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/gi);
        for (const m of imgMatches) {
            const iUrl = m[1].toLowerCase();
            if (iUrl.includes('logo') || iUrl.includes('favicon') || iUrl.includes('assets.jwwb.nl')) continue;

            imageUrl = m[1].replace(/&amp;/g, '&');
            let ext = 'jpg';
            if (imageUrl.includes('.png')) ext = 'png';
            if (imageUrl.includes('.webp')) ext = 'webp';

            const filename = `news-${i + 1}.${ext}`;
            const filepath = path.join(IMG_DIR, filename);

            if (downloadFile(imageUrl, filepath)) {
                localImage = `/webador_news/${filename}`;
                console.log(`  [OK] Image: ${filename}`);
                break;
            }
        }

        // Content
        let content = "";
        const contentMatch = articleHtml.match(/<div[^>]*class="[^"]*news-page-content-container[^"]*"[^>]*>([\s\S]*?)<div[^>]*class="jw-bottom-bar/i) ||
            articleHtml.match(/<div[^>]*data-section-name="content"[^>]*>([\s\S]*?)<\/main>/i);
        if (contentMatch) {
            content = contentMatch[1].replace(/<[^>]+>/g, '\n').trim();
        }

        results.push({
            id: i + 1,
            title,
            url,
            imageUrl,
            localImage,
            content: content.substring(0, 1000)
        });

        // Save progressively
        fs.writeFileSync(DATA_FILE, JSON.stringify(results, null, 2));
    }

    console.log(`\nMission complete. ${results.length} articles saved.`);
}

main();
