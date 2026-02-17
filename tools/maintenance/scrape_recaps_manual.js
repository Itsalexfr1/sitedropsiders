/**
 * SCRIPT DE SCRAPING MANUEL DES RÉCAPS DROPSIDERS
 * 
 * INSTRUCTIONS:
 * 1. Ouvrez https://www.dropsiders.eu/recap dans votre navigateur
 * 2. Ouvrez la console développeur (F12)
 * 3. Copiez-collez ce script complet dans la console
 * 4. Appuyez sur Entrée
 * 5. Le script va parcourir toutes les pages et extraire les récaps
 * 6. À la fin, il affichera un JSON que vous pourrez copier
 * 7. Sauvegardez le résultat dans un fichier recaps_scraped.json
 */

(async function scrapeAllRecaps() {
    console.log('🚀 Démarrage du scraping des récaps...');

    const allRecaps = [];
    let currentPage = 1;
    const maxPages = 15; // Limiter à 15 pages pour éviter les boucles infinies

    async function scrapePage(pageNum) {
        const url = pageNum === 1
            ? 'https://www.dropsiders.eu/recap'
            : `https://www.dropsiders.eu/recap?page=${pageNum}`;

        console.log(`📄 Page ${pageNum}: ${url}`);

        // Si on n'est pas sur la bonne page, naviguer
        if (window.location.href !== url) {
            window.location.href = url;
            // Attendre le chargement
            await new Promise(resolve => {
                window.addEventListener('load', resolve, { once: true });
            });
        }

        // Attendre que les articles se chargent
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Extraire les liens des récaps
        const recapLinks = Array.from(document.querySelectorAll('a[href*="/recap/"]'))
            .map(a => a.href)
            .filter((href, index, self) => self.indexOf(href) === index) // Unique
            .filter(href => href.match(/\/recap\/\d+_/)); // Seulement les articles

        console.log(`   ✅ ${recapLinks.length} récaps trouvés`);

        if (recapLinks.length === 0) {
            return false; // Pas de récaps, arrêter
        }

        // Pour chaque récap, extraire les données
        for (const recapUrl of recapLinks) {
            try {
                console.log(`   📰 Scraping: ${recapUrl.split('/').pop()}`);

                // Ouvrir dans un nouvel onglet invisible
                const response = await fetch(recapUrl);
                const html = await response.text();

                // Parser le HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // Extraire l'ID
                const idMatch = recapUrl.match(/\/recap\/(\d+)_/);
                const id = idMatch ? parseInt(idMatch[1]) : Date.now();

                // Titre
                const titleEl = doc.querySelector('h1, .jw-news-page-title');
                const title = titleEl ? titleEl.textContent.trim() : '';

                // Date
                const dateEl = doc.querySelector('time[datetime], .jw-news-page-date');
                const date = dateEl ? (dateEl.getAttribute('datetime') || dateEl.textContent.trim()) : new Date().toISOString();

                // Contenu
                const contentEl = doc.querySelector('.jw-news-page-content, .article-content');
                const content = contentEl ? contentEl.innerHTML : '';

                // Image
                const imgEl = doc.querySelector('.jw-news-page-image img, article img');
                const image = imgEl ? (imgEl.src || imgEl.getAttribute('data-src') || '') : '';

                // YouTube ID
                let youtubeId = '';
                const iframe = doc.querySelector('iframe[src*="youtube"]');
                if (iframe) {
                    const ytMatch = iframe.src.match(/embed\/([a-zA-Z0-9_-]+)/);
                    if (ytMatch) youtubeId = ytMatch[1];
                }

                const recapData = {
                    id,
                    title,
                    date,
                    author: 'Dropsiders',
                    category: 'Recap',
                    summary: title + '...',
                    content,
                    image,
                    youtubeId,
                    url: recapUrl
                };

                allRecaps.push(recapData);
                console.log(`      ✅ "${title}"`);

                // Pause pour ne pas surcharger
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (error) {
                console.error(`      ❌ Erreur: ${error.message}`);
            }
        }

        // Vérifier s'il y a une page suivante
        const nextButton = document.querySelector('.jw-pagination-next:not(.disabled), a[rel="next"]');
        return nextButton !== null;
    }

    // Scraper toutes les pages
    while (currentPage <= maxPages) {
        const hasMore = await scrapePage(currentPage);
        if (!hasMore) break;
        currentPage++;
    }

    console.log(`\n✅ Scraping terminé!`);
    console.log(`📊 ${allRecaps.length} récaps trouvés`);

    // Afficher le résultat
    console.log('\n📋 COPIEZ LE JSON CI-DESSOUS:');
    console.log('='.repeat(80));
    console.log(JSON.stringify(allRecaps, null, 2));
    console.log('='.repeat(80));

    // Télécharger automatiquement
    const blob = new Blob([JSON.stringify(allRecaps, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'recaps_scraped.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    console.log('\n💾 Fichier téléchargé: recaps_scraped.json');

    return allRecaps;
})();
