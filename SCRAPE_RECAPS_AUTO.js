/**
 * SCRIPT AUTOMATIQUE - SCRAPING RÉCAPS SANS CLIQUER
 * 
 * Ce script extrait TOUS les récaps directement depuis la page de liste
 * SANS avoir besoin de cliquer sur chaque article !
 * 
 * INSTRUCTIONS:
 * 1. Ouvrir https://www.dropsiders.eu/recaps dans Chrome
 * 2. F12 → Console
 * 3. Taper: allow pasting (puis Entrée)
 * 4. Coller ce script (Ctrl+V)
 * 5. Appuyer sur Entrée
 * 6. ATTENDRE (le script parcourt toutes les pages automatiquement)
 */

(async function () {
    console.log('🎬 SCRAPING AUTOMATIQUE DES RÉCAPS');
    console.log('='.repeat(60));
    console.log('⚡ Mode rapide : extraction depuis les pages de liste');
    console.log('');

    const recaps = [];
    const baseUrl = 'https://www.dropsiders.eu';
    let currentPage = 1;
    const maxPages = 20;

    // Fonction pour extraire les données d'un article depuis la liste
    function extractRecapFromListItem(article, index) {
        try {
            // Lien de l'article
            const linkEl = article.querySelector('a[href*="/recaps/"]');
            if (!linkEl) return null;

            const url = linkEl.href;

            // ID depuis l'URL
            const idMatch = url.match(/\/recaps\/(\d+)_/);
            const id = idMatch ? parseInt(idMatch[1]) : Date.now() + index;

            // Titre
            const titleEl = article.querySelector('h2, h3, .title, .jw-news-list-item__title');
            const title = titleEl ? titleEl.textContent.trim() : 'Sans titre';

            // Date
            const dateEl = article.querySelector('time, .date, .jw-news-list-item__date');
            let date = new Date().toISOString();
            if (dateEl) {
                const datetime = dateEl.getAttribute('datetime');
                if (datetime) {
                    date = datetime;
                } else {
                    const dateText = dateEl.textContent.trim();
                    const parsed = new Date(dateText);
                    if (!isNaN(parsed)) date = parsed.toISOString();
                }
            }

            // Image
            const imgEl = article.querySelector('img');
            const coverImage = imgEl ? (imgEl.src || imgEl.getAttribute('data-src') || '') : '';

            // Résumé/Description
            const summaryEl = article.querySelector('.summary, .description, .excerpt, p');
            const summary = summaryEl ? summaryEl.textContent.trim() : title;

            // Détecter festival et location depuis le titre
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

            // Locations
            if (titleUpper.includes('BELGIQUE') || titleUpper.includes('BELGIUM') || titleUpper.includes('BOOM')) location = 'Belgique';
            else if (titleUpper.includes('USA') || titleUpper.includes('VEGAS') || titleUpper.includes('MIAMI') || titleUpper.includes('ORLANDO')) location = 'USA';
            else if (titleUpper.includes('FRANCE') || titleUpper.includes('PARIS')) location = 'France';
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
                summary,
                content: `<p>${summary}</p>`,
                coverImage,
                images: coverImage ? [coverImage] : [],
                youtubeId: '',
                url
            };

        } catch (error) {
            console.error('❌ Erreur extraction:', error.message);
            return null;
        }
    }

    // Fonction pour charger une page
    async function loadPage(pageNum) {
        const url = pageNum === 1
            ? `${baseUrl}/recaps`
            : `${baseUrl}/recaps?page=${pageNum}`;

        console.log(`\n📄 Page ${pageNum}: ${url}`);

        // Si on n'est pas sur la bonne page, naviguer
        if (window.location.href !== url) {
            window.location.href = url;
            // Attendre le chargement
            await new Promise(resolve => {
                if (document.readyState === 'complete') {
                    resolve();
                } else {
                    window.addEventListener('load', resolve, { once: true });
                }
            });
            // Attendre un peu plus pour être sûr
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Extraire les articles de la page actuelle
        const articles = document.querySelectorAll('.jw-news-list-item, .news-item, article, .recap-item');

        console.log(`   Trouvé: ${articles.length} articles`);

        if (articles.length === 0) {
            return false; // Pas d'articles, arrêter
        }

        // Extraire les données de chaque article
        articles.forEach((article, index) => {
            const data = extractRecapFromListItem(article, index);
            if (data && !recaps.some(r => r.url === data.url)) {
                recaps.push(data);
                console.log(`   ✅ [${index + 1}/${articles.length}] ${data.title.substring(0, 50)}...`);
            }
        });

        // Vérifier s'il y a une page suivante
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

        // Petite pause entre les pages
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ TERMINÉ! ${recaps.length} récaps extraits`);
    console.log('='.repeat(60));

    // Trier par date décroissante
    recaps.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Afficher les statistiques
    const festivals = recaps.filter(r => r.festival).length;
    const withLocation = recaps.filter(r => r.location).length;
    const withImages = recaps.filter(r => r.images.length > 0).length;

    console.log('\n📊 STATISTIQUES:');
    console.log(`   Total récaps: ${recaps.length}`);
    console.log(`   Avec festival: ${festivals}`);
    console.log(`   Avec localisation: ${withLocation}`);
    console.log(`   Avec images: ${withImages}`);

    // Télécharger le JSON
    const json = JSON.stringify(recaps, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'recaps_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    console.log('\n💾 Fichier téléchargé: recaps_data.json');
    console.log('📋 Placez-le dans: src/data/recaps.json');
    console.log('\n🎉 TERMINÉ ! Vous pouvez fermer cette fenêtre.');

    return recaps;
})();
