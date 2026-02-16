import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.dropsiders.eu';
const DATA_FILE = path.resolve('./src/data/news.json');

async function downloadImage(url, dest) {
    try {
        const response = await axios({ url, responseType: 'arraybuffer', timeout: 15000 });
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, response.data);
        return true;
    } catch (e) {
        console.log(`      Error downloading image ${url}: ${e.message}`);
        return false;
    }
}

function cleanHtml(html) {
    if (!html) return "";
    let $ = cheerio.load(html);
    $('a').each((_, el) => {
        let href = $(el).attr('href');
        if (href) {
            href = href.replace('https://www.dropsiders.eu', '').replace('http://www.dropsiders.eu', '');
            $(el).attr('href', href);
        }
    });
    $('*').each((_, el) => {
        $(el).removeAttr('style');
        if (!['iframe', 'img'].includes(el.name)) {
            $(el).removeAttr('width').removeAttr('height');
        }
    });
    $('img').each((_, el) => {
        $(el).addClass('rounded-2xl shadow-2xl mx-auto my-8 block max-w-full h-auto');
        $(el).removeAttr('width').removeAttr('height');
        let src = $(el).attr('src');
        if (src && src.startsWith('//')) $(el).attr('src', 'https:' + src);
        if (src && !src.startsWith('http')) $(el).attr('src', BASE_URL + src);
    });
    // Remove comment modules, pagination and forms
    $('.jw-comment-module, .jw-news-page-pagination, .jw-social-share, form').remove();
    $('.jw-strip:has(form), .jw-strip:has(.jw-comment-module)').remove();

    return $.html('body').replace('<body>', '').replace('</body>', '').trim();
}

async function run() {
    console.log("=== MISSION : IMPORTATION DES 20 DERNIÈRES NEWS (VIA SITEMAP) ===");

    let currentData = [];
    let nextId = 1;

    try {
        console.log("  Récupération du sitemap...");
        const { data: sitemap } = await axios.get(BASE_URL + '/sitemap.xml');
        const urls = sitemap.match(/https:\/\/www\.dropsiders\.eu\/news\/[^\s<]+/g);

        if (!urls) {
            throw new Error("Aucune URL de news trouvée dans le sitemap");
        }

        const uniqueUrls = [...new Set(urls)];
        const toProcess = uniqueUrls.slice(0, 20);
        console.log(`  ${uniqueUrls.length} news trouvées. Traitement des 20 dernières...`);

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

                // Image priority: og:image > itemprop="image" > first content image
                let imgSrc = $a('meta[property="og:image"]').attr('content') || $a('meta[itemprop="image"]').attr('content');
                if (!imgSrc) {
                    const firstImg = $a('.news-page-content-container img, .jw-element-image img').first();
                    imgSrc = firstImg.attr('src');
                }

                let localHeroImage = "";
                if (imgSrc) {
                    if (imgSrc.startsWith('//')) imgSrc = 'https:' + imgSrc;
                    if (!imgSrc.startsWith('http')) imgSrc = BASE_URL + imgSrc;

                    const slug = title.replace(/[^a-z0-9]+/gi, '-').toLowerCase().substring(0, 40);
                    const ext = imgSrc.split('.').pop().split(/[?#]/)[0] || 'jpg';
                    const filename = `${slug}.${ext}`;
                    const localPath = path.resolve(`./public/images/news/${filename}`);

                    if (await downloadImage(imgSrc, localPath)) {
                        localHeroImage = `/images/news/${filename}`;
                    }
                }

                const articleContainer = $a('.jw-element-news-content, .news-page-content-container, main').first();
                const htmlContent = articleContainer.html() || "";
                const content = cleanHtml(htmlContent);
                const summary = articleContainer.text().substring(0, 160).replace(/\s+/g, ' ').trim() + "...";

                currentData.push({
                    id: nextId++,
                    title,
                    date,
                    author: "Dropsiders",
                    category: "News",
                    summary,
                    content,
                    image: localHeroImage,
                    youtubeId,
                    url: fullUrl
                });

                // Update file progressively
                fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2));
            } catch (err) {
                console.error(`  Erreur ${fullUrl}: ${err.message}`);
            }
        }
    } catch (err) {
        console.error(`  Erreur globale: ${err.message}`);
    }
    console.log("=== MISSION TERMINÉE ===");
}
run();
