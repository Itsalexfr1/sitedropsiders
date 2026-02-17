/**
 * SCRIPT DE SCRAPING MANUEL - RÉCAPS DROPSIDERS
 * 
 * INSTRUCTIONS:
 * 1. Ouvrez https://www.dropsiders.eu/recaps dans Chrome/Firefox
 * 2. Ouvrez la Console (F12 → Console)
 * 3. Copiez-collez TOUT ce script
 * 4. Appuyez sur Entrée
 * 5. Attendez la fin (peut prendre 2-3 minutes)
 * 6. Le fichier recaps_data.json sera téléchargé automatiquement
 * 7. Placez-le dans src/data/recaps.json
 */

(async function () {
    console.log('🎬 SCRAPING DES RÉCAPS DROPSIDERS');
    console.log('='.repeat(60));

    const recaps = [];
    const baseUrl = 'https://www.dropsiders.eu';

    // Fonction pour extraire les données d'un récap
    async function scrapeRecap(url) {
        try {
            const response = await fetch(url);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // ID depuis l'URL
            const idMatch = url.match(/\/recaps\/(\d+)_/);
            const id = idMatch ? parseInt(idMatch[1]) : Math.floor(Math.random() * 1000000);

            // Titre
            const titleEl = doc.querySelector('h1, .jw-news-page-title, .page-title');
            const title = titleEl ? titleEl.textContent.trim() : 'Sans titre';

            // Date
            const dateEl = doc.querySelector('time[datetime], .jw-news-page-date, .date');
            let date = new Date().toISOString();
            if (dateEl) {
                const datetime = dateEl.getAttribute('datetime');
                if (datetime) {
                    date = datetime;
                } else {
                    // Parser la date française
                    const dateText = dateEl.textContent.trim();
                    const parsed = new Date(dateText);
                    if (!isNaN(parsed)) date = parsed.toISOString();
                }
            }

            // Contenu HTML
            const contentEl = doc.querySelector('.jw-news-page-content, .article-content, .content, article');
            const content = contentEl ? contentEl.innerHTML : '';

            // Image de couverture
            let coverImage = '';
            const coverEl = doc.querySelector('.jw-news-page-image img, .cover-image img, article img');
            if (coverEl) {
                coverImage = coverEl.src || coverEl.getAttribute('data-src') || '';
            }

            // Extraire toutes les images du contenu
            const images = [];
            const imgElements = contentEl ? contentEl.querySelectorAll('img') : [];
            imgElements.forEach(img => {
                const src = img.src || img.getAttribute('data-src');
                if (src && !images.includes(src)) {
                    images.push(src);
                }
            });

            // Vidéo YouTube si présente
            let youtubeId = '';
            const iframe = doc.querySelector('iframe[src*="youtube"]');
            if (iframe) {
                const match = iframe.src.match(/embed\/([a-zA-Z0-9_-]+)/);
                if (match) youtubeId = match[1];
            }

            // Lieu/Festival (essayer d'extraire du titre)
            let location = '';
            let festival = '';
            const titleUpper = title.toUpperCase();

            // Patterns communs
            if (titleUpper.includes('TOMORROWLAND')) festival = 'Tomorrowland';
            else if (titleUpper.includes('ULTRA')) festival = 'Ultra Music Festival';
            else if (titleUpper.includes('EDC')) festival = 'EDC';
            else if (titleUpper.includes('BURNING MAN')) festival = 'Burning Man';
            else if (titleUpper.includes('COACHELLA')) festival = 'Coachella';

            // Localisation
            if (titleUpper.includes('BELGIQUE') || titleUpper.includes('BELGIUM')) location = 'Belgique';
            else if (titleUpper.includes('USA') || titleUpper.includes('VEGAS') || titleUpper.includes('MIAMI')) location = 'USA';
            else if (titleUpper.includes('FRANCE')) location = 'France';
            else if (titleUpper.includes('ESPAGNE') || titleUpper.includes('SPAIN') || titleUpper.includes('IBIZA')) location = 'Espagne';
            else if (titleUpper.includes('CROATIE')) location = 'Croatie';
            else if (titleUpper.includes('PAYS-BAS') || titleUpper.includes('NETHERLANDS')) location = 'Pays-Bas';

            return {
                id,
                title,
                date,
                author: 'Dropsiders',
                category: 'Recap',
                festival,
                location,
                summary: title,
                content,
                coverImage,
                images,
                youtubeId,
                url
            };

        } catch (error) {
            console.error(`❌ Erreur sur ${url}:`, error.message);
            return null;
        }
    }

    // Fonction pour scraper une page de liste
    async function scrapePage(pageNum) {
        const url = pageNum === 1
            ? `${baseUrl}/recaps`
            : `${baseUrl}/recaps?page=${pageNum}`;

        console.log(`\n📄 Page ${pageNum}`);

        // Naviguer si nécessaire
        if (window.location.href !== url) {
            window.location.href = url;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Extraire les liens
        const links = Array.from(document.querySelectorAll('a[href*="/recaps/"]'))
            .map(a => a.href)
            .filter(href => href.match(/\/recaps\/\d+_/))
            .filter((href, i, arr) => arr.indexOf(href) === i);

        console.log(`   Trouvé: ${links.length} récaps`);

        if (links.length === 0) return false;

        // Scraper chaque récap
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            const slug = link.split('/').pop();
            console.log(`   [${i + 1}/${links.length}] ${slug}`);

            const data = await scrapeRecap(link);
            if (data) {
                recaps.push(data);
                console.log(`      ✅ ${data.title.substring(0, 50)}...`);
            }

            // Pause
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Vérifier page suivante
        const nextBtn = document.querySelector('.jw-pagination-next:not(.disabled), a[rel="next"]');
        return nextBtn !== null;
    }

    // Scraper toutes les pages
    let page = 1;
    const maxPages = 20;

    while (page <= maxPages) {
        const hasMore = await scrapePage(page);
        if (!hasMore) break;
        page++;
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ TERMINÉ! ${recaps.length} récaps scrapés`);
    console.log('='.repeat(60));

    // Trier par date
    recaps.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Télécharger le JSON
    const json = JSON.stringify(recaps, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recaps_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('💾 Fichier téléchargé: recaps_data.json');
    console.log('📋 Placez-le dans: src/data/recaps.json');

    return recaps;
})();
