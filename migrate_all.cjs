const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.dropsiders.eu';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

const CONFIG = {
    news: {
        pattern: '/news/',
        dataFile: path.join(__dirname, 'src/data/news.json'),
        imageDir: path.join(__dirname, 'public/images/news'),
        imagePrefix: '/images/news/'
    },
    recaps: {
        pattern: '/recaps/',
        dataFile: path.join(__dirname, 'src/data/recaps.json'),
        imageDir: path.join(__dirname, 'public/images/recaps'),
        imagePrefix: '/images/recaps/'
    },
    interviews: {
        pattern: '/interviews/',
        dataFile: path.join(__dirname, 'src/data/interviews.json'),
        imageDir: path.join(__dirname, 'public/images/interviews'),
        imagePrefix: '/images/interviews/'
    }
};

// Ensure all directories exist
Object.values(CONFIG).forEach(c => {
    if (!fs.existsSync(c.imageDir)) fs.mkdirSync(c.imageDir, { recursive: true });
    if (!fs.existsSync(path.dirname(c.dataFile))) fs.mkdirSync(path.dirname(c.dataFile), { recursive: true });
});

function slugify(text) {
    return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function downloadImage(url, filename, category) {
    try {
        const conf = CONFIG[category];
        const filePath = path.join(conf.imageDir, filename);

        if (fs.existsSync(filePath)) return conf.imagePrefix + filename;

        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            headers: { 'User-Agent': UA, 'Referer': BASE_URL + '/' },
            timeout: 10000
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(conf.imagePrefix + filename));
            writer.on('error', reject);
        });
    } catch (e) {
        return null;
    }
}

async function scrapePage(url, category, id) {
    try {
        const response = await axios.get(url, { headers: { 'User-Agent': UA }, timeout: 15000 });
        const $ = cheerio.load(response.data);

        let title = $('h1').first().text().trim();
        if (!title) title = $('title').text().split('|')[0].trim();
        const slug = slugify(title) || `article-${id}`;

        let date = $('meta[property="article:published_time"]').attr('content') ||
            $('meta[itemprop="datePublished"]').attr('content') ||
            $('.jw-blog-entry__date, .jw-news-date').first().text().trim() ||
            new Date().toISOString();

        let summary = $('meta[name="description"]').attr('content') ||
            $('.jw-blog-entry__intro, .jw-news-post__lead').first().text().trim() || "";

        // Remove noise
        $('header, footer, .jw-footer, .jw-comments, .jw-news-page-pagination, .jw-social-follow, .jw-element-social-follow, .jw-credits, .jw-skip-link, #jw-variable-values, .jw-mobile-menu').remove();

        let contentContainer = $('.jw-section-content').first();
        if (contentContainer.length === 0) contentContainer = $('.block-content').first();
        if (contentContainer.length === 0) contentContainer = $('main');

        const noiseTexts = ["Précédent", "Suivant", "HAUT", "Envoyer un commentaire", "Commentaires", "dropsiders.eu", "Tous droits réservés"];
        contentContainer.find('p, div, span, h1, h2, h3, a').each((_, elem) => {
            const t = $(elem).text().trim();
            if (noiseTexts.some(n => t.includes(n))) $(elem).remove();
        });

        // Images
        let mainImage = '';
        const galleryImages = [];
        const imgs = contentContainer.find('img');
        for (let j = 0; j < imgs.length; j++) {
            let src = $(imgs[j]).attr('src') || $(imgs[j]).attr('srcset')?.split(' ')[0];
            if (!src) continue;
            if (src.startsWith('data:')) continue;

            let cleanSrc = src.split('?')[0];
            if (!cleanSrc.startsWith('http')) cleanSrc = BASE_URL + (cleanSrc.startsWith('/') ? '' : '/') + cleanSrc;
            if (cleanSrc.match(/logo|icon|transparent|newsletter|facebook|twitter|instagram|tiktok/i)) continue;

            const ext = path.extname(cleanSrc) || '.jpg';
            const imgName = `${slug}-${j}${ext}`;

            const localPath = await downloadImage(cleanSrc, imgName, category);
            if (localPath) {
                galleryImages.push(localPath);
                if (!mainImage) mainImage = localPath;

                if (category === 'recaps') {
                    $(imgs[j]).remove();
                } else {
                    $(imgs[j]).attr('src', localPath).removeAttr('srcset').removeAttr('loading').css({ 'max-width': '100%', 'height': 'auto' });
                }
            }
        }

        if (!mainImage) {
            const ogImage = $('meta[property="og:image"]').attr('content');
            if (ogImage) {
                const imgName = `${slug}-cover${path.extname(ogImage.split('?')[0]) || '.jpg'}`;
                mainImage = await downloadImage(ogImage, imgName, category);
                if (mainImage && category === 'recaps' && !galleryImages.includes(mainImage)) {
                    galleryImages.push(mainImage);
                }
            }
        }

        contentContainer.find('p, div').each((_, el) => { if ($(el).text().trim() === '' && $(el).find('img, iframe').length === 0) $(el).remove(); });
        const htmlContent = contentContainer.html()?.trim() || '';

        let youtubeId = '';
        const iframe = contentContainer.find('iframe[src*="youtube"]');
        if (iframe.length > 0) {
            const match = iframe.attr('src').match(/embed\/([^?]+)/);
            if (match) youtubeId = match[1];
        }

        return {
            id,
            title,
            date,
            summary,
            content: htmlContent,
            image: mainImage,
            images: galleryImages,
            youtubeId,
            link: url,
            category: category.charAt(0).toUpperCase() + category.slice(1)
        };
    } catch (e) {
        console.error(`  Error scraping ${url}: ${e.message}`);
        return null;
    }
}

async function main() {
    console.log("Starting Migration from dropsiders.eu...");

    if (!fs.existsSync('sitemap.xml')) {
        console.log("Downloading sitemap.xml...");
        const res = await axios.get(BASE_URL + '/sitemap.xml');
        fs.writeFileSync('sitemap.xml', res.data);
    }
    const sitemapContent = fs.readFileSync('sitemap.xml', 'utf8');
    const $s = cheerio.load(sitemapContent, { xmlMode: true });

    const allUrls = [];
    $s('url > loc').each((_, el) => allUrls.push($s(el).text().trim()));

    for (const [catName, catConf] of Object.entries(CONFIG)) {
        console.log(`\n--- Migrating ${catName.toUpperCase()} ---`);
        const catUrls = allUrls.filter(u => u.includes(catConf.pattern));
        console.log(`Found ${catUrls.length} URLs.`);

        const results = [];
        for (let i = 0; i < catUrls.length; i++) {
            console.log(`[${i + 1}/${catUrls.length}] ${catUrls[i]}`);
            const data = await scrapePage(catUrls[i], catName, i + 1);
            if (data) results.push(data);

            // Batching & Timeout Handling
            if ((i + 1) % 10 === 0) {
                console.log("  Batch of 10 completed, pausing 2s...");
                await new Promise(r => setTimeout(r, 2000));
            } else {
                await new Promise(r => setTimeout(r, 300));
            }
        }

        fs.writeFileSync(catConf.dataFile, JSON.stringify(results, null, 2));
        console.log(`Finished ${catName}. Saved to ${catConf.dataFile}`);
    }

    console.log("\nMigration Complete!");
}

main();
