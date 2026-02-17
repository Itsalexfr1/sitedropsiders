import fs from 'fs';
import path from 'path';
import https from 'https';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, 'src/data');
const imagesDir = path.join(__dirname, 'public/images/galerie');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download image: ${response.statusCode}`));
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

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function scrapeGalerie() {
    const html = fs.readFileSync('gallery_page.html', 'utf8');
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const albums = [];
    const elements = document.querySelectorAll('.jw-element');

    let currentAlbumTitle = "Galerie";
    let currentAlbumImages = [];

    elements.forEach((el) => {
        const h1 = el.querySelector('h1.jw-heading-130, h1.jw-heading-200');
        const h2 = el.querySelector('h2');

        if (h1 || h2) {
            const title = (h1 ? h1.textContent : h2.textContent).trim();
            if (title && title.toLowerCase() !== 'galerie') {
                if (currentAlbumImages.length > 0) {
                    albums.push({
                        id: slugify(currentAlbumTitle),
                        title: currentAlbumTitle,
                        images: [...currentAlbumImages]
                    });
                }
                currentAlbumTitle = title;
                currentAlbumImages = [];
            }
        }

        const albumRaster = el.querySelector('.jw-album');
        if (albumRaster) {
            const images = albumRaster.querySelectorAll('.jw-album-image');
            images.forEach(img => {
                const href = img.getAttribute('href');
                if (href) {
                    currentAlbumImages.push(href);
                }
            });
        }
    });

    if (currentAlbumImages.length > 0) {
        albums.push({
            id: slugify(currentAlbumTitle),
            title: currentAlbumTitle,
            images: [...currentAlbumImages]
        });
    }

    console.log(`Found ${albums.length} albums.`);

    const finalData = [];
    // Limit to 5 albums for testing if it's too much, but let's try all
    for (const album of albums) {
        console.log(`Processing album: ${album.title}`);
        const albumSlug = album.id;
        const albumImagesDir = path.join(imagesDir, albumSlug);
        if (!fs.existsSync(albumImagesDir)) fs.mkdirSync(albumImagesDir, { recursive: true });

        const localImages = [];
        // Take only first 20 images per album to avoid massive download
        const imagesToDownload = album.images.slice(0, 20);

        for (let i = 0; i < imagesToDownload.length; i++) {
            const url = imagesToDownload[i];
            const filename = `photo-${i + 1}.jpg`;
            const filepath = path.join(albumImagesDir, filename);
            const relativePath = `/images/galerie/${albumSlug}/${filename}`;

            try {
                process.stdout.write(`  Downloading ${i + 1}/${imagesToDownload.length}...\r`);
                await downloadImage(url, filepath);
                localImages.push(relativePath);
            } catch (err) {
                console.error(`\nError downloading ${url}:`, err.message);
            }
        }
        console.log(`\nFinished ${album.title}`);

        finalData.push({
            id: albumSlug,
            title: album.title,
            cover: localImages[0],
            images: localImages,
            date: "2025"
        });
    }

    fs.writeFileSync(path.join(outputDir, 'galerie.json'), JSON.stringify(finalData, null, 2));
    console.log('Successfully saved galerie.json');
}

scrapeGalerie();
