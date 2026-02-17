/**
 * SCRIPT AUTOMATIQUE - SCRAPING RÉCAPS WEBADOR
 * 
 * Extrait TOUS les récaps depuis dropsiders.webador.fr
 * 
 * INSTRUCTIONS:
 * 1. Ouvrir https://dropsiders.webador.fr/recap dans Chrome
 * 2. F12 → Console
 * 3. Taper: allow pasting (puis Entrée)
 * 4. Coller ce script (Ctrl+V)
 * 5. Appuyer sur Entrée
 * 6. ATTENDRE (le script parcourt toutes les pages)
 */

(async function () {
    console.log('🎬 SCRAPING RÉCAPS WEBADOR');
    console.log('='.repeat(60));
    console.log('📍 Source: dropsiders.webador.fr');
    console.log('');

    const recaps = [];
    const baseUrl = 'https://dropsiders.webador.fr';
    let currentPage = 1;
    const maxPages = 20;

    // Fonction pour extraire les données d'un récap complet
    async function scrapeRecapDetail(url) {
        try {
            console.log(`      📥 Chargement des détails...`);

            const response = await fetch(url);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // ID depuis l'URL
            const idMatch = url.match(/\/recap\/(\d+)_/);
            const id = idMatch ? parseInt(idMatch[1]) : Math.floor(Math.random() * 1000000);

            // Titre
            const titleEl = doc.querySelector('h1, .jw-news-page-title, .page-title, .article-title');
            const title = titleEl ? titleEl.textContent.trim() : 'Sans titre';

            // Date
            const dateEl = doc.querySelector('time[datetime], .jw-news-page-date, .date, .published');
            let date = new Date().toISOString();
            if (dateEl) {
                const datetime = dateEl.getAttribute('datetime');
                if (datetime) {
                    date = datetime;
                } else {
                    const dateText = dateEl.textContent.trim();
                    // Parser format français
                    const parsed = new Date(dateText);
                    if (!isNaN(parsed)) date = parsed.toISOString();
                }
            }

            // Contenu HTML
            const contentEl = doc.querySelector('.jw-news-page-content, .article-content, .content, article, .post-content');
            const content = contentEl ? contentEl.innerHTML : '';

            // Image de couverture
            let coverImage = '';
            const coverEl = doc.querySelector('.jw-news-page-image img, .cover-image img, .featured-image img, article img');
            if (coverEl) {
                coverImage = coverEl.src || coverEl.getAttribute('data-src') || '';
            }

            // Extraire TOUTES les images du contenu
            const images = [];
            if (contentEl) {
                const imgElements = contentEl.querySelectorAll('img');
                imgElements.forEach(img => {
                    const src = img.src || img.getAttribute('data-src');
                    if (src && !images.includes(src)) {
                        images.push(src);
                    }
                });
            }

            // Si pas d'images dans le contenu, utiliser la cover
            if (images.length === 0 && coverImage) {
                images.push(coverImage);
            }

            // Vidéo YouTube
            let youtubeId = '';
            const iframe = doc.querySelector('iframe[src*="youtube"]');
            if (iframe) {
                const match = iframe.src.match(/embed\/([a-zA-Z0-9_-]+)/);
                if (match) youtubeId = match[1];
            }

            // Détecter festival et location
            const titleUpper = title.toUpperCase();
            let festival = '';
            let location = '';

            // Festivals
            if (titleUpper.includes('TOMORROWLAND')) festival = 'Tomorrowland';
            else if (titleUpper.includes('ULTRA')) festival = 'Ultra Music Festival';
            else if (titleUpper.includes('EDC')) festival = 'EDC';
            else if (titleUpper.includes('BURNING MAN')) festival = 'Burning Man';
            else if (titleUpper.includes('COACHELLA')) festival = 'Coachella';
            else if (titleUpper.includes('AWAKENINGS')) festival = 'Awakenings';
            else if (titleUpper.includes('DEFQON')) festival = 'Defqon.1';
            else if (titleUpper.includes('MYSTERYLAND')) festival = 'Mysteryland';
            else if (titleUpper.includes('PAROOKAVILLE')) festival = 'Parookaville';
            else if (titleUpper.includes('UNTOLD')) festival = 'Untold';
            else if (titleUpper.includes('NEVERSEA')) festival = 'Neversea';
            else if (titleUpper.includes('CREAMFIELDS')) festival = 'Creamfields';
            else if (titleUpper.includes('ELECTRIC LOVE')) festival = 'Electric Love';
            else if (titleUpper.includes('LOLLAPALOOZA')) festival = 'Lollapalooza';
            else if (titleUpper.includes('SZIGET')) festival = 'Sziget';
            else if (titleUpper.includes('DEFERLANTES')) festival = 'Les Déferlantes';
            else if (titleUpper.includes('DOUR')) festival = 'Dour Festival';

            // Locations
            if (titleUpper.includes('BELGIQUE') || titleUpper.includes('BELGIUM') || titleUpper.includes('BOOM')) location = 'Belgique';
            else if (titleUpper.includes('USA') || titleUpper.includes('VEGAS') || titleUpper.includes('MIAMI') || titleUpper.includes('ORLANDO')) location = 'USA';
            else if (titleUpper.includes('FRANCE') || titleUpper.includes('PARIS') || titleUpper.includes('BARCARES')) location = 'France';
            else if (titleUpper.includes('ESPAGNE') || titleUpper.includes('SPAIN') || titleUpper.includes('IBIZA') || titleUpper.includes('BARCELONA')) location = 'Espagne';
            else if (titleUpper.includes('CROATIE') || titleUpper.includes('CROATIA')) location = 'Croatie';
            else if (titleUpper.includes('PAYS-BAS') || titleUpper.includes('NETHERLANDS') || titleUpper.includes('AMSTERDAM')) location = 'Pays-Bas';
            else if (titleUpper.includes('ROUMANIE') || titleUpper.includes('ROMANIA')) location = 'Roumanie';
            else if (titleUpper.includes('HONGRIE') || titleUpper.includes('HUNGARY') || titleUpper.includes('BUDAPEST')) location = 'Hongrie';
            else if (titleUpper.includes('AUTRICHE') || titleUpper.includes('AUSTRIA')) location = 'Autriche';
            else if (titleUpper.includes('ALLEMAGNE') || titleUpper.includes('GERMANY')) location = 'Allemagne';
            else if (titleUpper.includes('UK') || titleUpper.includes('ANGLETERRE') || titleUpper.includes('ENGLAND')) location = 'Royaume-Uni';

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
                coverImage: coverImage || (images.length > 0 ? images[0] : ''),
                images,
                youtubeId,
                url
            };

        } catch (error) {
            console.error(`      ❌ Erreur: ${error.message}`);
            return null;
        }
    }

    // Fonction pour charger une page de liste
    async function loadPage(pageNum) {
        const url = pageNum === 1
            ? `${baseUrl}/recap`
            : `${baseUrl}/recap?page=${pageNum}`;

        console.log(`\n📄 Page ${pageNum}: ${url}`);

        // Naviguer si nécessaire
        if (window.location.href !== url) {
            window.location.href = url;
            await new Promise(resolve => {
                if (document.readyState === 'complete') {
                    resolve();
                } else {
                    window.addEventListener('load', resolve, { once: true });
                }
            });
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Extraire les liens des récaps
        const links = Array.from(document.querySelectorAll('a[href*="/recap/"]'))
            .map(a => a.href)
            .filter(href => href.match(/\/recap\/\d+_/))
            .filter((href, i, arr) => arr.indexOf(href) === i);

        console.log(`   Trouvé: ${links.length} récaps`);

        if (links.length === 0) return false;

        // Scraper chaque récap
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            const slug = link.split('/').pop();
            console.log(`   [${i + 1}/${links.length}] ${slug.substring(0, 40)}...`);

            const data = await scrapeRecapDetail(link);
            if (data && !recaps.some(r => r.url === data.url)) {
                recaps.push(data);
                console.log(`      ✅ ${data.title.substring(0, 50)}...`);
                console.log(`      📸 ${data.images.length} photos`);
            }

            // Pause entre les requêtes
            await new Promise(resolve => setTimeout(resolve, 400));
        }

        // Vérifier page suivante
        const nextBtn = document.querySelector('.jw-pagination-next:not(.disabled), a[rel="next"], .next-page:not(.disabled)');
        return nextBtn !== null;
    }

    // Parcourir toutes les pages
    while (currentPage <= maxPages) {
        const hasMore = await loadPage(currentPage);

        if (!hasMore) {
            console.log('\n✅ Dernière page atteinte');
            break;
        }

        currentPage++;
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ TERMINÉ! ${recaps.length} récaps extraits`);
    console.log('='.repeat(60));

    // Trier par date
    recaps.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Statistiques
    const festivals = recaps.filter(r => r.festival).length;
    const withLocation = recaps.filter(r => r.location).length;
    const withImages = recaps.filter(r => r.images.length > 0).length;
    const totalImages = recaps.reduce((sum, r) => sum + r.images.length, 0);
    const withVideo = recaps.filter(r => r.youtubeId).length;

    console.log('\n📊 STATISTIQUES:');
    console.log(`   Total récaps: ${recaps.length}`);
    console.log(`   Avec festival: ${festivals}`);
    console.log(`   Avec localisation: ${withLocation}`);
    console.log(`   Avec images: ${withImages}`);
    console.log(`   Total images: ${totalImages}`);
    console.log(`   Avec vidéo: ${withVideo}`);

    // Télécharger le JSON
    const json = JSON.stringify(recaps, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'recaps_webador.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    console.log('\n💾 Fichier téléchargé: recaps_webador.json');
    console.log('📋 Renommez-le en recaps.json');
    console.log('📂 Placez-le dans: src/data/recaps.json');
    console.log('\n🎉 TERMINÉ ! Vous pouvez fermer cette fenêtre.');

    return recaps;
})();
