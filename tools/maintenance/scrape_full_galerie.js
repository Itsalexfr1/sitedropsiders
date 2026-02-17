import fs from 'fs';
import { JSDOM } from 'jsdom';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, 'src/data');
const galerieDir = path.join(__dirname, 'public/assets/galeries');

// Force clean start as requested
if (fs.existsSync(galerieDir)) {
    console.log(`Nettoyage de ${galerieDir}...`);
    fs.rmSync(galerieDir, { recursive: true, force: true });
}
fs.mkdirSync(galerieDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

function slugify(text) {
    if (!text) return 'album';
    return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

function detectCategory(title) {
    const t = title.toLowerCase();
    if (t.includes('tomorrowland') || t.includes('ultra') || t.includes('festival') || t.includes('edc') || t.includes('burning man')) {
        return "Festivals";
    }
    if (t.includes('@') || t.includes('ushuaia') || t.includes('hi ibiza') || t.includes('ibiza') || t.includes('pacha')) {
        return "Clubs & Events";
    }
    if (t.includes('dj snake') || t.includes('david guetta') || t.includes('concert')) {
        return "Concerts";
    }
    return "Others";
}

async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Status ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => reject(err));
        });
    });
}

async function scrapeGalerie() {
    console.log("=== MISSION : SCRAPER TOUTE LA GALERIE DROPSIDERS (RESET & CATEGORISATION) ===");

    let html;
    if (fs.existsSync('page3.html')) {
        console.log("Lecture de page3.html local (10MB)...");
        html = fs.readFileSync('page3.html', 'utf8');
    } else {
        console.log("Fetching https://www.dropsiders.eu/galerie...");
        const { execSync } = await import('child_process');
        html = execSync('curl.exe -L -s https://www.dropsiders.eu/galerie', { maxBuffer: 25 * 1024 * 1024, encoding: 'utf8' });
    }

    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const elements = doc.querySelectorAll('div[id^="jw-element-"]');
    console.log(`Analyse de ${elements.length} blocks Webador...`);

    let albumsData = [];
    let currentTitle = null;

    elements.forEach((el) => {
        const titleNodes = el.querySelectorAll('h1, h2, h3, strong');
        let blockTitle = null;
        for (const node of titleNodes) {
            const text = node.textContent.trim();
            if (text.length > 5 &&
                !text.toLowerCase().includes('newsletter') &&
                !text.toLowerCase().includes('legal') &&
                !text.toLowerCase().includes('page suivante') &&
                text.toLowerCase() !== 'galerie' &&
                text.toLowerCase() !== 'contact' &&
                text.toLowerCase() !== 'interviews') {
                blockTitle = text;
                break;
            }
        }

        if (blockTitle) {
            currentTitle = blockTitle;
        }

        const albumRaster = el.querySelector('.jw-album');
        if (albumRaster && currentTitle) {
            const imgLinks = albumRaster.querySelectorAll('.jw-album-image');
            const urls = Array.from(imgLinks).map(a => a.getAttribute('href')).filter(u => u);

            if (urls.length > 0) {
                const existing = albumsData.find(a => a.title === currentTitle);
                if (existing) {
                    existing.images.push(...urls);
                } else {
                    albumsData.push({ title: currentTitle, images: urls });
                }
            }
        }
    });

    console.log(`\n${albumsData.length} albums uniques identifiés.`);

    const finalResult = [];
    for (const album of albumsData) {
        const slug = slugify(album.title);
        const category = detectCategory(album.title);
        console.log(`Processing : [${category}] ${album.title} (${album.images.length} images) -> ${slug}`);

        const eventDir = path.join(galerieDir, slug);
        if (!fs.existsSync(eventDir)) fs.mkdirSync(eventDir, { recursive: true });

        const localImages = [];
        // Limit to 80 images per album to be faster but still representative
        const imagesToDownload = album.images.slice(0, 80);

        for (let i = 0; i < imagesToDownload.length; i++) {
            const url = imagesToDownload[i];
            const filename = `img-${i + 1}.jpg`;
            const filepath = path.join(eventDir, filename);
            const relativePath = `/assets/galeries/${slug}/${filename}`;

            try {
                if (i % 20 === 0) process.stdout.write(`  Ddl Progress: ${i + 1}/${imagesToDownload.length}\r`);
                await downloadImage(url, filepath);
                localImages.push(relativePath);
            } catch (err) {
            }
        }
        console.log(`\n  OK: ${localImages.length} images.`);

        // Extract year from title if possible
        const yearMatch = album.title.match(/20\d{2}/);
        const date = yearMatch ? yearMatch[0] : "2024-2025";

        finalResult.push({
            id: slug,
            title: album.title,
            category: category,
            cover: localImages[0] || "",
            images: localImages,
            date: date
        });
    }

    fs.writeFileSync(path.join(outputDir, 'galerie.json'), JSON.stringify(finalResult, null, 2));
    console.log(`\n=== TERMINE : ${finalResult.length} albums sauvegardés avec catégories ===`);
}

scrapeGalerie().catch(console.error);
