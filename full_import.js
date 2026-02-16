import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.dropsiders.eu';
const DATA_FILE = path.resolve('./src/data/news.json');

const CATEGORIES = [
    { url: '/news', label: 'News' },
    { url: '/recaps-ecrit', label: 'Recap' },
    { url: '/interviews-videos', label: 'Interview' }
];

async function downloadImage(url, dest) {
    if (fs.existsSync(dest)) return true;
    try {
        const response = await axios({ url, responseType: 'arraybuffer', timeout: 15000 });
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, response.data);
        return true;
    } catch (e) {
        return false;
    }
}

function cleanHtml(html) {
    if (!html) return "";
    let $ = cheerio.load(html);

    // 1. Remove domain
    $('a').each((_, el) => {
        let href = $(el).attr('href');
        if (href) {
            href = href.replace('https://www.dropsiders.eu', '');
            href = href.replace('http://www.dropsiders.eu', '');
            $(el).attr('href', href);
        }
    });

    // 2. Clean styles
    $('*').each((_, el) => {
        $(el).removeAttr('style');
        if (!['iframe', 'img'].includes(el.name)) {
            $(el).removeAttr('width');
            $(el).removeAttr('height');
        }
    });

    // 3. Linearize (No photos side by side)
    $('.jw-tree-horizontal, .jw-columns, .jw-column').each((_, el) => {
        $(el).removeClass('jw-tree-horizontal jw-columns jw-column').addClass('block w-full');
    });

    // 4. Premium Images (rounded, shadow)
    $('img').each((_, el) => {
        $(el).addClass('rounded-2xl shadow-2xl mx-auto my-8 block max-w-full h-auto');
        $(el).removeAttr('width');
        $(el).removeAttr('height');
    });

    // 5. Remove empty elements
    $('p, div').each((_, el) => {
        const text = $(el).text().trim();
        if (text === '' && $(el).children().length === 0) {
            $(el).remove();
        }
    });

    return $.html('body').replace('<body>', '').replace('</body>', '').trim();
}

async function run() {
    console.log("=== MISSION : IMPORTATION COMPLÈTE DROPSIDERS.EU ===");

    let currentData = [];
    if (fs.existsSync(DATA_FILE)) {
        try {
            currentData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        } catch (e) { }
    }
    const existingUrls = new Set(currentData.map(a => a.url));
    let nextId = currentData.length > 0 ? Math.max(...currentData.map(a => a.id)) + 1 : 1;

    for (const cat of CATEGORIES) {
        console.log(`\n--- CATÉGORIE : ${cat.label} ---`);
        try {
            const { data: firstPage } = await axios.get(BASE_URL + cat.url);
            const $first = cheerio.load(firstPage);

            const segmentId = $first('.jw-news, .jw-element-news').attr('data-jw-element-id');
            const pageTotal = parseInt($first('.jw-pagination').attr('data-page-total') || '1');
            console.log(`Détection : ID=${segmentId}, Pages=${pageTotal}`);

            const allLinks = [];
            for (let p = 1; p <= pageTotal; p++) {
                const pUrl = (p === 1 || !segmentId) ? cat.url : `${cat.url}?${segmentId}-page=${p}`;
                console.log(`  Page ${p}/${pageTotal}...`);
                try {
                    const { data: pHtml } = await axios.get(BASE_URL + pUrl);
                    const $p = cheerio.load(pHtml);
                    $p('a').each((_, el) => {
                        const href = $p(el).attr('href');
                        if (href && (href.includes('/news/') || href.includes('/recaps/')) && href.length > 10) {
                            const full = href.startsWith('http') ? href : BASE_URL + href;
                            if (!allLinks.includes(full)) allLinks.push(full);
                        }
                    });
                } catch (e) { console.log(`  Erreur page ${p}: ${e.message}`); }
            }

            const toProcess = allLinks.filter(l => !existingUrls.has(l));
            console.log(`  Total à traiter : ${toProcess.length} (Déjà importés : ${allLinks.length - toProcess.length})`);

            for (let i = 0; i < toProcess.length; i++) {
                const fullUrl = toProcess[i];
                try {
                    const { data: artHtml } = await axios.get(fullUrl);
                    const $a = cheerio.load(artHtml);

                    const title = $a('h1').first().text().trim() || "Sans Titre";
                    console.log(`  [${i + 1}/${toProcess.length}] ${title}`);

                    const date = $a('meta[itemprop="datePublished"]').attr('content') || new Date().toISOString();
                    const ytMatch = artHtml.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
                    const youtubeId = ytMatch ? ytMatch[1] : "";

                    // Hero Image
                    let heroImage = "";
                    const firstImg = $a('img').not('[src*="logo"]').not('[src*="favicon"]').first();
                    let imgSrc = firstImg.attr('src');

                    if (imgSrc) {
                        if (imgSrc.startsWith('//')) imgSrc = 'https:' + imgSrc;
                        if (!imgSrc.startsWith('http')) imgSrc = BASE_URL + imgSrc;

                        const slug = title.replace(/[^a-z0-9]+/gi, '-').toLowerCase().substring(0, 40);
                        const ext = imgSrc.split('.').pop().split(/[?#]/)[0] || 'jpg';
                        const filename = `${slug}.${ext}`;
                        const localDir = `./public/images/${cat.label.toLowerCase()}s`;
                        const localPath = path.resolve(`${localDir}/${filename}`);

                        if (await downloadImage(imgSrc, localPath)) {
                            heroImage = `/images/${cat.label.toLowerCase()}s/${filename}`;
                        }
                    }

                    // Content
                    const articleContainer = $a('.jw-element-news-content, .news-page-content-container, main').first();
                    const rawContent = articleContainer.html() || "";
                    const content = cleanHtml(rawContent);
                    const summary = articleContainer.text().substring(0, 160).replace(/\s+/g, ' ').trim() + "...";

                    currentData.push({
                        id: nextId++,
                        title,
                        date,
                        author: "Dropsiders",
                        category: cat.label,
                        summary,
                        content: content,
                        image: heroImage,
                        youtubeId,
                        url: fullUrl
                    });

                    existingUrls.add(fullUrl);
                    fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2));

                } catch (err) {
                    console.error(`  Erreur ${fullUrl}: ${err.message}`);
                }
            }
        } catch (err) {
            console.error(`  Erreur catégorie ${cat.label}: ${err.message}`);
        }
    }

    console.log("\n=== MISSION TERMINÉE : TOUT LE CONTENU EST IMPORTÉ ===");
}

run();
