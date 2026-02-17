import fs from 'fs';
import https from 'https';
import http from 'http';
import path from 'path';
import { URL } from 'url';

// Charger les données existantes
const newsData = JSON.parse(fs.readFileSync('./src/data/news.json', 'utf8'));

console.log(`📊 Total articles: ${newsData.length}`);
console.log(`   - News: ${newsData.filter(a => a.category === 'News').length}`);
console.log(`   - Recaps: ${newsData.filter(a => a.category === 'Recap').length}`);
console.log(`   - Interviews: ${newsData.filter(a => a.category === 'Interview').length}`);

// Fonction pour télécharger une image
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(filepath);

        protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(filepath);
                });
            } else {
                fs.unlink(filepath, () => { });
                reject(new Error(`Failed to download: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

// Fonction pour extraire toutes les URLs d'images d'un HTML
function extractImageUrls(html) {
    const urls = [];
    const regex = /src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp|gif))"/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        urls.push(match[1]);
    }
    return urls;
}

// Fonction pour générer un nom de fichier local à partir d'une URL
function getLocalFilename(url, category) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        let filename = pathname.split('/').pop();

        // Nettoyer le nom de fichier
        filename = filename.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();

        return filename;
    } catch (e) {
        return `image-${Date.now()}.jpg`;
    }
}

// Migration principale
async function migrateContent() {
    let totalDownloaded = 0;
    let totalReplaced = 0;
    const errors = [];

    for (let i = 0; i < newsData.length; i++) {
        const article = newsData[i];
        const category = article.category.toLowerCase();

        console.log(`\n[${i + 1}/${newsData.length}] Processing: ${article.title.substring(0, 50)}...`);

        // Créer le dossier de catégorie si nécessaire
        const categoryFolder = `./public/assets/${category === 'recap' ? 'recaps' : category === 'interview' ? 'interviews' : 'news'}`;
        if (!fs.existsSync(categoryFolder)) {
            fs.mkdirSync(categoryFolder, { recursive: true });
        }

        // Extraire toutes les images du HTML
        const imageUrls = extractImageUrls(article.htmlContent);

        if (imageUrls.length > 0) {
            console.log(`  Found ${imageUrls.length} external images`);
        }

        let updatedHtml = article.htmlContent;

        // Télécharger et remplacer chaque image
        for (const imageUrl of imageUrls) {
            try {
                const filename = getLocalFilename(imageUrl, category);
                const localPath = path.join(categoryFolder, filename);
                const webPath = `/assets/${category === 'recap' ? 'recaps' : category === 'interview' ? 'interviews' : 'news'}/${filename}`;

                // Télécharger si le fichier n'existe pas
                if (!fs.existsSync(localPath)) {
                    console.log(`  ⬇️  Downloading: ${filename}`);
                    await downloadImage(imageUrl, localPath);
                    totalDownloaded++;
                } else {
                    console.log(`  ✓ Already exists: ${filename}`);
                }

                // Remplacer dans le HTML
                updatedHtml = updatedHtml.replace(new RegExp(imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), webPath);
                totalReplaced++;

            } catch (error) {
                console.error(`  ❌ Error downloading ${imageUrl}: ${error.message}`);
                errors.push({ article: article.id, url: imageUrl, error: error.message });
            }
        }

        // Mettre à jour l'article
        article.htmlContent = updatedHtml;

        // Petit délai pour ne pas surcharger le serveur
        if (imageUrls.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // Sauvegarder les données mises à jour
    fs.writeFileSync('./src/data/news.json', JSON.stringify(newsData, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION TERMINÉE');
    console.log('='.repeat(60));
    console.log(`📥 Images téléchargées: ${totalDownloaded}`);
    console.log(`🔄 Liens remplacés: ${totalReplaced}`);
    console.log(`❌ Erreurs: ${errors.length}`);

    if (errors.length > 0) {
        console.log('\nErreurs détaillées:');
        errors.forEach(e => console.log(`  - Article ${e.article}: ${e.url} (${e.error})`));
    }
}

// Lancer la migration
migrateContent().catch(console.error);
