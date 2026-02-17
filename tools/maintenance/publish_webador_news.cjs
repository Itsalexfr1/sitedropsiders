const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SOURCE_URL = "https://dropsiders.webador.fr";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const IMG_DIR = './public/images/news';
const DATA_FILE = './src/data/news.json';
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
    console.log(`=== PUBLICATION WEBADOR -> SITE (Target: ${TARGET_COUNT}) ===`);

    let existingData = [];
    if (fs.existsSync(DATA_FILE)) {
        existingData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
    const existingTitles = new Set(existingData.map(a => a.title));
    let nextId = existingData.length > 0 ? Math.max(...existingData.map(a => a.id)) + 1 : 1;

    let links = [];
    console.log("Fetching Page 1...");
    const p1Html = curlGet(`${SOURCE_URL}/news`);
    links = extractLinks(p1Html);

    // If we need more, try page 2
    if (links.length < TARGET_COUNT) {
        console.log("Fetching Page 2...");
        const p2Html = curlGet(`${SOURCE_URL}/news?page=2`);
        const p2Links = extractLinks(p2Html);
        p2Links.forEach(l => { if (!links.includes(l)) links.push(l); });
    }

    const toProcess = links.slice(0, TARGET_COUNT);
    let addedCount = 0;

    for (let i = 0; i < toProcess.length; i++) {
        const url = `${SOURCE_URL}${toProcess[i]}`;
        const articleHtml = curlGet(url);
        if (!articleHtml) continue;

        // Title
        let title = "Sans titre";
        const titleMatch = articleHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        if (titleMatch) title = titleMatch[1].replace(/<[^>]+>/g, '').trim();

        if (existingTitles.has(title)) {
            console.log(`[SKIP] Déjà présent : ${title}`);
            continue;
        }

        console.log(`[NEW] Processing: ${title}`);

        // Image
        let imageUrl = "";
        let localImage = "";
        const imgMatches = articleHtml.matchAll(/src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/gi);
        let imgIdx = 1;
        for (const m of imgMatches) {
            const iUrl = m[1].toLowerCase();
            if (iUrl.includes('logo') || iUrl.includes('favicon') || iUrl.includes('assets.jwwb.nl')) continue;

            imageUrl = m[1].replace(/&amp;/g, '&');
            const ext = imageUrl.split('.').pop().split(/[?#]/)[0] || 'jpg';
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 40);
            const filename = `web-${slug}-${imgIdx}.${ext}`;
            const filepath = path.join(IMG_DIR, filename);

            if (downloadFile(imageUrl, filepath)) {
                if (imgIdx === 1) localImage = `/images/news/${filename}`;
                imgIdx++;
            }
        }

        // Content (HTML for faithfulness)
        let contentHtml = "";
        const contentMatch = articleHtml.match(/<div[^>]*class="[^"]*news-page-content-container[^"]*"[^>]*>([\s\S]*?)<div[^>]*class="jw-bottom-bar/i) ||
            articleHtml.match(/<div[^>]*data-section-name="content"[^>]*>([\s\S]*?)<\/main>/i);
        if (contentMatch) contentHtml = contentMatch[1].trim();

        // Date
        const dateMatch = articleHtml.match(/itemprop="datePublished"[^>]*content="([^"]+)"/i);
        const date = dateMatch ? dateMatch[1] : new Date().toISOString();

        // Youtube
        const ytMatch = articleHtml.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
        const youtubeId = ytMatch ? ytMatch[1] : "";

        const newEntry = {
            id: nextId++,
            title,
            date,
            author: "Dropsiders",
            category: "News",
            image: localImage,
            content: contentHtml,
            youtubeId
        };

        existingData.push(newEntry);
        addedCount++;

        // Save at each step
        fs.writeFileSync(DATA_FILE, JSON.stringify(existingData, null, 2));
    }

    console.log(`\nFini ! ${addedCount} nouvelles news ajoutées au site.`);
}

main();
