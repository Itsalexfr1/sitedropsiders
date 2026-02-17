const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.dropsiders.eu';
const RECAP_URL = `${BASE_URL}/recap`;
const OUTPUT_FILE = path.join(__dirname, 'src/data/news.json');

function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function extractRecapLinks(html) {
    const links = [];
    const regex = /href=["']([^"']*\/recap\/\d+_[^"']*)["']/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
        let link = match[1];
        if (!link.startsWith('http')) {
            link = BASE_URL + link;
        }
        if (!links.includes(link)) {
            links.push(link);
        }
    }

    return links;
}

function extractRecapData(html, url) {
    // Extraire l'ID
    const idMatch = url.match(/\/recap\/(\d+)_/);
    const id = idMatch ? parseInt(idMatch[1]) : Date.now();

    // Titre
    let title = '';
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
    if (titleMatch) {
        title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
    }

    // Date - chercher plusieurs formats
    let date = new Date().toISOString();
    const dateMatch = html.match(/datetime=["']([^"']+)["']/);
    if (dateMatch) {
        date = dateMatch[1];
    }

    // Contenu - extraire le bloc principal
    let content = '';
    const contentMatch = html.match(/<div[^>]*class="[^"]*jw-news-page-content[^"]*"[^>]*>(.*?)<\/div>\s*<div[^>]*class="[^"]*jw-strip/s);
    if (contentMatch) {
        content = contentMatch[1];
    } else {
        // Fallback
        const altMatch = html.match(/<article[^>]*>(.*?)<\/article>/s);
        if (altMatch) content = altMatch[1];
    }

    // Image principale
    let image = '';
    const imgMatch = html.match(/<img[^>]*src=["']([^"']*\.(jpg|jpeg|png|webp))["']/i);
    if (imgMatch) {
        image = imgMatch[1];
        if (!image.startsWith('http')) {
            image = BASE_URL + image;
        }
    }

    // YouTube ID
    let youtubeId = '';
    const ytMatch = html.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (ytMatch) {
        youtubeId = ytMatch[1];
    }

    return {
        id,
        title,
        date,
        author: 'Dropsiders',
        category: 'Recap',
        summary: title + '...',
        content,
        image,
        youtubeId,
        url
    };
}

async function scrapeRecaps() {
    console.log('🚀 Démarrage du scraping des récaps...');

    // Charger les données existantes
    let existingData = [];
    if (fs.existsSync(OUTPUT_FILE)) {
        const fileContent = fs.readFileSync(OUTPUT_FILE, 'utf8');
        existingData = JSON.parse(fileContent);
        console.log(`📂 ${existingData.length} articles existants chargés`);
    }

    const allRecaps = [];
    const processedUrls = new Set();

    // Ajouter les URLs déjà existantes
    existingData.forEach(item => {
        if (item.url) processedUrls.add(item.url);
    });

    try {
        // Scraper plusieurs pages
        for (let pageNum = 1; pageNum <= 10; pageNum++) {
            const url = pageNum === 1 ? RECAP_URL : `${RECAP_URL}?page=${pageNum}`;
            console.log(`\n📄 Page ${pageNum}: ${url}`);

            const html = await httpsGet(url);
            const recapLinks = extractRecapLinks(html);

            console.log(`   ✅ ${recapLinks.length} récaps trouvés`);

            if (recapLinks.length === 0) break;

            // Scraper chaque récap
            for (const recapUrl of recapLinks) {
                if (processedUrls.has(recapUrl)) {
                    console.log(`   ⏭️  Déjà traité: ${recapUrl.split('/').pop()}`);
                    continue;
                }

                try {
                    console.log(`   📰 Scraping: ${recapUrl.split('/').pop()}`);

                    const recapHtml = await httpsGet(recapUrl);
                    const recapData = extractRecapData(recapHtml, recapUrl);

                    if (recapData.title) {
                        allRecaps.push(recapData);
                        processedUrls.add(recapUrl);
                        console.log(`      ✅ "${recapData.title}"`);
                    }

                    // Pause pour ne pas surcharger le serveur
                    await new Promise(resolve => setTimeout(resolve, 300));

                } catch (error) {
                    console.error(`      ❌ Erreur: ${error.message}`);
                }
            }
        }

    } catch (error) {
        console.error(`❌ Erreur générale: ${error.message}`);
    }

    console.log(`\n✅ Scraping terminé!`);
    console.log(`📊 ${allRecaps.length} nouveaux récaps trouvés`);

    // Fusionner avec les données existantes
    const mergedData = [...existingData, ...allRecaps];

    // Trier par date décroissante
    mergedData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Sauvegarder
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mergedData, null, 2), 'utf8');
    console.log(`💾 Fichier sauvegardé: ${OUTPUT_FILE}`);
    console.log(`📈 Total: ${mergedData.length} articles (${existingData.length} existants + ${allRecaps.length} nouveaux)`);

    // Statistiques par catégorie
    const stats = mergedData.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
    }, {});

    console.log('\n📊 Statistiques:');
    Object.entries(stats).forEach(([category, count]) => {
        console.log(`   ${category}: ${count}`);
    });
}

scrapeRecaps().catch(console.error);
