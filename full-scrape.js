import fs from 'fs';
import https from 'https';
import http from 'http';
import path from 'path';
import { execSync } from 'child_process';

const BASE = 'https://dropsiders.webador.fr';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ----- UTILITIES -----
function curlGet(url) {
    try {
        const result = execSync(`curl.exe -L -A "${UA}" "${url}" --max-time 20 -s`, { maxBuffer: 10 * 1024 * 1024 });
        return result.toString('utf8');
    } catch (e) {
        console.log(`  ERREUR curl: ${e.message.substring(0, 80)}`);
        return '';
    }
}

function sleep(ms) {
    execSync(`ping -n ${Math.ceil(ms / 1000) + 1} 127.0.0.1 > nul`, { stdio: 'ignore' });
}

function downloadFile(url, filepath) {
    try {
        execSync(`curl.exe -L -A "${UA}" "${url}" -o "${filepath}" --max-time 30 -s`, { stdio: 'ignore' });
        return fs.existsSync(filepath) && fs.statSync(filepath).size > 100;
    } catch (e) {
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

// ----- EXTRACT ARTICLE URLS FROM LIST PAGE -----
function extractArticleUrls(html, prefix) {
    const urls = new Set();
    const regex = new RegExp(`href="(/${prefix}/[^"]+)"`, 'g');
    let match;
    while ((match = regex.exec(html)) !== null) {
        urls.add(match[1]);
    }
    return [...urls];
}

// ----- EXTRACT IMAGE URLS FROM HTML -----
function extractAllImageUrls(html) {
    const urls = [];
    // Images with full URLs
    const regex1 = /src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp|gif)[^"]*)"/gi;
    let match;
    while ((match = regex1.exec(html)) !== null) {
        let url = match[1].split('?')[0]; // remove query params
        urls.push(url);
    }
    return [...new Set(urls)];
}

// ----- PARSE ARTICLE PAGE -----
function parseArticlePage(html, category) {
    // Extract title
    let title = '';
    const h1Match = html.match(/<h1[^>]*itemprop="headline"[^>]*>([\s\S]*?)<\/h1>/i) ||
        html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match) {
        title = h1Match[1].replace(/<[^>]+>/g, '').trim();
    }

    // Extract date
    let date = '';
    const dateMatch = html.match(/<time[^>]*datetime="([^"]+)"/i) ||
        html.match(/class="[^"]*date[^"]*"[^>]*>([\s\S]*?)<\//i) ||
        html.match(/(\d{1,2}\s+\w+\.?\s+\d{4})/i);
    if (dateMatch) {
        date = dateMatch[1].trim();
    }
    // Also try metadata
    const metaDateMatch = html.match(/class="jw-news-meta[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (metaDateMatch && !date) {
        date = metaDateMatch[1].replace(/<[^>]+>/g, '').trim();
    }
    // More robust date extraction
    const dateMatch2 = html.match(/(\d{1,2}\s+\w+\.\s+\d{4}\s+\d{2}:\d{2})/);
    if (dateMatch2) {
        date = dateMatch2[1].trim();
    }

    // Extract content section
    let content = '';
    const contentMatch = html.match(/<div[^>]*data-section-name="content"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*$/mi) ||
        html.match(/<div[^>]*class="[^"]*news-page-content[^"]*"[^>]*>([\s\S]*)/i) ||
        html.match(/<div[^>]*data-section-name="content"[^>]*>([\s\S]*)/i);
    if (contentMatch) {
        content = contentMatch[0];
    }

    // Extract YouTube IDs
    let youtubeId = '';
    const ytMatch = html.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (ytMatch) {
        youtubeId = ytMatch[1];
    }

    // Extract summary (first 2 paragraphs of text)
    let summary = '';
    const pTags = content.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
    const textParagraphs = pTags.map(p => p.replace(/<[^>]+>/g, '').trim()).filter(t => t.length > 30);
    summary = textParagraphs.slice(0, 2).join('\n');

    return { title, date, content, youtubeId, summary, category };
}

// ----- DOWNLOAD IMAGES FOR AN ARTICLE -----
function downloadArticleImages(html, articleSlug, categoryFolder) {
    const imageUrls = extractAllImageUrls(html);
    const imageMap = {}; // old url -> new local path
    let imgIndex = 1;

    for (const url of imageUrls) {
        // Skip tiny icons, tracking pixels etc
        if (url.includes('favicon') || url.includes('logo') || url.includes('1x1')) continue;

        const ext = path.extname(url.split('?')[0]) || '.jpg';
        const localFilename = `${articleSlug}-${imgIndex}${ext}`;
        const localPath = path.join(categoryFolder, localFilename);
        const webPath = `/assets/${path.basename(categoryFolder)}/${localFilename}`;

        if (!fs.existsSync(localPath)) {
            const ok = downloadFile(url, localPath);
            if (ok) {
                console.log(`    IMG ${imgIndex}: ${localFilename}`);
                imageMap[url] = webPath;
                imgIndex++;
            }
        } else {
            imageMap[url] = webPath;
            imgIndex++;
        }
    }

    return imageMap;
}

// ----- MAIN -----
async function main() {
    console.log('='.repeat(60));
    console.log('  SCRAPE COMPLET DE DROPSIDERS.WEBADOR.FR');
    console.log('='.repeat(60));

    // Ensure directories exist
    const dirs = ['./public/assets/news', './public/assets/recaps', './public/assets/interviews'];
    dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

    const allArticles = [];
    let nextId = 1;

    // ===== 1. SCRAPE ALL NEWS PAGES (1–24) =====
    console.log('\n--- PHASE 1: SCRAPE NEWS (24 pages) ---\n');
    const allNewsUrls = new Set();

    for (let page = 1; page <= 24; page++) {
        const url = page === 1
            ? `${BASE}/news/`
            : `${BASE}/news/?page=${page}`;
        console.log(`Page ${page}/24: ${url}`);
        const html = curlGet(url);
        const urls = extractArticleUrls(html, 'news');
        urls.forEach(u => allNewsUrls.add(u));
        console.log(`  -> ${urls.length} articles trouvés (total unique: ${allNewsUrls.size})`);
        if (page < 24) sleep(800);
    }

    console.log(`\nTotal URLs News uniques: ${allNewsUrls.size}`);

    // Fetch each news article
    let newsCount = 0;
    for (const articleUrl of allNewsUrls) {
        newsCount++;
        console.log(`\n[NEWS ${newsCount}/${allNewsUrls.size}] ${articleUrl}`);

        const fullUrl = `${BASE}${articleUrl}`;
        const html = curlGet(fullUrl);

        if (!html || html.length < 500) {
            console.log('  SKIP: contenu vide');
            continue;
        }

        const parsed = parseArticlePage(html, 'News');
        if (!parsed.title) {
            console.log('  SKIP: pas de titre');
            continue;
        }

        console.log(`  Titre: ${parsed.title.substring(0, 60)}`);

        // Download images
        const slug = slugify(parsed.title);
        const imageMap = downloadArticleImages(html, slug, './public/assets/news');

        // Replace image URLs in content
        let cleanedContent = parsed.content;
        for (const [oldUrl, newPath] of Object.entries(imageMap)) {
            cleanedContent = cleanedContent.replace(new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newPath);
        }

        // Get cover image
        let coverImage = Object.values(imageMap)[0] || '';

        allArticles.push({
            id: nextId++,
            title: parsed.title,
            date: parsed.date,
            category: 'News',
            summary: parsed.summary,
            htmlContent: cleanedContent,
            image: coverImage,
            youtubeId: parsed.youtubeId
        });

        sleep(600);
    }

    // ===== 2. SCRAPE ALL RECAPS =====
    console.log('\n\n--- PHASE 2: SCRAPE RECAPS ---\n');
    const recapUrls = [
        '/recaps/2613014_recap-dj-snake-festival-de-nimes',
        '/recaps/2625149_recap-sea-you-festival',
        '/recaps/2630431_recap-tomorrowland-2025',
        '/recaps/2738175_recap-john-summit-ushuaia-ibiza',
        '/recaps/2738181_recap-top-100-djs-awards-unvrs-ibiza',
        '/recaps/2802106_recap-escape-psycho-circus-2025'
    ];

    let recapCount = 0;
    for (const articleUrl of recapUrls) {
        recapCount++;
        console.log(`\n[RECAP ${recapCount}/${recapUrls.length}] ${articleUrl}`);

        const fullUrl = `${BASE}${articleUrl}`;
        const html = curlGet(fullUrl);

        if (!html || html.length < 500) {
            console.log('  SKIP: contenu vide');
            continue;
        }

        const parsed = parseArticlePage(html, 'Recap');
        if (!parsed.title) {
            console.log('  SKIP: pas de titre');
            continue;
        }

        console.log(`  Titre: ${parsed.title.substring(0, 60)}`);

        const slug = slugify(parsed.title);
        const imageMap = downloadArticleImages(html, slug, './public/assets/recaps');

        let cleanedContent = parsed.content;
        for (const [oldUrl, newPath] of Object.entries(imageMap)) {
            cleanedContent = cleanedContent.replace(new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newPath);
        }

        let coverImage = Object.values(imageMap)[0] || '';

        allArticles.push({
            id: nextId++,
            title: parsed.title,
            date: parsed.date,
            category: 'Recap',
            summary: parsed.summary,
            htmlContent: cleanedContent,
            image: coverImage,
            youtubeId: parsed.youtubeId
        });

        sleep(600);
    }

    // ===== 3. SCRAPE ALL INTERVIEWS =====
    console.log('\n\n--- PHASE 3: SCRAPE INTERVIEWS ---\n');
    const interviewUrls = [
        '/interviews/1006753_interviews-tube-berger',
        '/interviews/1006754_interviews-oliver-heldens',
        '/interviews/1006755_interviews-reinier-zonneveld',
        '/interviews/1006759_interviews-ran-d',
        '/interviews/1006760_interviews-morten',
        '/interviews/1046360_interview-hardwell',
        '/interviews/2468702_interview-video-yves-v-tomorrowland-winter',
        '/interviews/2468703_interview-video-topic-tomorrowland-winter',
        '/interviews/2468713_interview-video-dubvision-tomorrowland-winter',
        '/interviews/2468720_interview-video-vintage-culture-tomorrowland-winter',
        '/interviews/2537123_interview-morten-edc-las-vegas-2025',
        '/interviews/2548164_interview-da-tweekaz-edc-las-vegas-2025'
    ];

    let interviewCount = 0;
    for (const articleUrl of interviewUrls) {
        interviewCount++;
        console.log(`\n[INTERVIEW ${interviewCount}/${interviewUrls.length}] ${articleUrl}`);

        const fullUrl = `${BASE}${articleUrl}`;
        const html = curlGet(fullUrl);

        if (!html || html.length < 500) {
            console.log('  SKIP: contenu vide');
            continue;
        }

        const parsed = parseArticlePage(html, 'Interview');
        if (!parsed.title) {
            console.log('  SKIP: pas de titre');
            continue;
        }

        console.log(`  Titre: ${parsed.title.substring(0, 60)}`);

        const slug = slugify(parsed.title);
        const imageMap = downloadArticleImages(html, slug, './public/assets/interviews');

        let cleanedContent = parsed.content;
        for (const [oldUrl, newPath] of Object.entries(imageMap)) {
            cleanedContent = cleanedContent.replace(new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newPath);
        }

        let coverImage = Object.values(imageMap)[0] || '';

        allArticles.push({
            id: nextId++,
            title: parsed.title,
            date: parsed.date,
            category: 'Interview',
            summary: parsed.summary,
            htmlContent: cleanedContent,
            image: coverImage,
            youtubeId: parsed.youtubeId
        });

        sleep(600);
    }

    // ===== DEDUPLICATE =====
    console.log('\n\n--- DEDUPLICATION ---\n');
    const seen = new Set();
    const uniqueArticles = allArticles.filter(a => {
        const key = a.title.toLowerCase().trim();
        if (seen.has(key)) {
            console.log(`  Doublon supprime: ${a.title.substring(0, 50)}`);
            return false;
        }
        seen.add(key);
        return true;
    });

    // Re-assign IDs
    uniqueArticles.forEach((a, i) => a.id = i + 1);

    // ===== SAVE =====
    fs.writeFileSync('./src/data/news.json', JSON.stringify(uniqueArticles, null, 2));

    // ===== REPORT =====
    console.log('\n' + '='.repeat(60));
    console.log('  MIGRATION TERMINEE');
    console.log('='.repeat(60));
    console.log(`  News:       ${uniqueArticles.filter(a => a.category === 'News').length}`);
    console.log(`  Recaps:     ${uniqueArticles.filter(a => a.category === 'Recap').length}`);
    console.log(`  Interviews: ${uniqueArticles.filter(a => a.category === 'Interview').length}`);
    console.log(`  TOTAL:      ${uniqueArticles.length} articles uniques`);
    console.log('='.repeat(60));

    // Count local images
    const countFiles = (dir) => {
        try { return fs.readdirSync(dir).length; } catch { return 0; }
    };
    console.log(`\n  Images /public/assets/news:       ${countFiles('./public/assets/news')}`);
    console.log(`  Images /public/assets/recaps:     ${countFiles('./public/assets/recaps')}`);
    console.log(`  Images /public/assets/interviews: ${countFiles('./public/assets/interviews')}`);
}

main().catch(console.error);
