import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BASE_URL = 'https://www.dropsiders.eu';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const DATA_FILE = './src/data/news.json';
const IMG_OUTPUT_DIR = './public/images/news';

if (!fs.existsSync(IMG_OUTPUT_DIR)) {
    fs.mkdirSync(IMG_OUTPUT_DIR, { recursive: true });
}

function curlGet(url) {
    try {
        console.log(`Fetching ${url}...`);
        return execSync(`curl.exe -L -A "${UA}" "${url}" --max-time 20 -s`, { maxBuffer: 10 * 1024 * 1024, encoding: 'utf8' });
    } catch (e) {
        console.error(`  Error fetching ${url}: ${e.message.substring(0, 100)}`);
        return '';
    }
}

function downloadFile(url, filepath) {
    try {
        execSync(`curl.exe -L -A "${UA}" "${url}" -o "${filepath}" --create-dirs --max-time 30 -s`, { stdio: 'ignore' });
        return fs.existsSync(filepath) && fs.statSync(filepath).size > 0;
    } catch (e) {
        return false;
    }
}

function extractArticleUrls(html) {
    const urls = new Set();
    const regex = /href="(\/news\/[0-9]{5,}_[^"]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        urls.add(match[1]);
    }
    return [...urls];
}

async function main() {
    console.log("=== MISSION : RÉCUPÉRER 2 NOUVEAUX ARTICLES ===");

    let articles = [];
    if (fs.existsSync(DATA_FILE)) {
        try {
            articles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        } catch (e) { console.error("Error reading JSON:", e.message); }
    }

    const existingLinks = new Set(articles.map(a => a.link).filter(l => !!l));
    const existingTitles = new Set(articles.map(a => a.title).filter(t => !!t));

    // Try multiple pagination styles
    const pagesToTry = [
        `${BASE_URL}/news`,
        `${BASE_URL}/news?page=2`,
        `${BASE_URL}/news?12850969-page=2`
    ];

    let candidates = [];
    for (const pageUrl of pagesToTry) {
        const html = curlGet(pageUrl);
        if (!html) continue;
        const urls = extractArticleUrls(html).map(u => `${BASE_URL}${u}`);
        console.log(`  Found ${urls.length} links on ${pageUrl}`);

        for (const url of urls) {
            if (!existingLinks.has(url)) {
                candidates.push(url);
            }
        }
        if (candidates.length >= 2) break;
    }

    const uniqueCandidates = [...new Set(candidates)];
    const toProcess = uniqueCandidates.slice(0, 2);
    console.log(`Articles identifiés : ${toProcess.length}`);

    if (toProcess.length === 0) {
        console.log("Aucun nouvel article trouvé sur les premières pages.");
        return;
    }

    let idCounter = articles.length > 0 ? Math.max(...articles.map(a => a.id).filter(id => !isNaN(id))) + 1 : 1;

    for (const url of toProcess) {
        console.log(`Processing: ${url}`);
        const html = curlGet(url);
        if (!html) continue;

        const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'Sans titre';

        if (existingTitles.has(title)) {
            console.log(`  Article déjà présent par titre : ${title}`);
            continue;
        }

        const dateMatch = html.match(/itemprop="datePublished"[^>]*content="([^"]+)"/i);
        const date = dateMatch ? dateMatch[1] : '2026-02-16';

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);

        const imgMatch = html.match(/src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i);
        let coverImage = '';
        if (imgMatch) {
            const imgUrl = imgMatch[1].replace(/&amp;/g, '&');
            const ext = imgUrl.split('.').pop().split(/[?#]/)[0] || 'jpg';
            const filename = `${slug}.${ext}`;
            const localPath = path.join(IMG_OUTPUT_DIR, filename);
            if (downloadFile(imgUrl, localPath)) {
                coverImage = `/images/news/${filename}`;
                console.log(`  Image : ${filename}`);
            }
        }

        const newArticle = {
            id: idCounter++,
            title,
            date,
            author: "Dropsiders",
            category: "News",
            image: coverImage,
            content: "Contenu extrait...",
            link: url
        };

        articles.push(newArticle);
        fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2));
        console.log(`  Ajouté : ${title}`);
    }

    console.log("Terminé.");
}

main();
