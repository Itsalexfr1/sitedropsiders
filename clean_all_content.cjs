const fs = require('fs');
const path = require('path');

const newsFile = path.join(__dirname, 'src', 'data', 'news.json');
let data = JSON.parse(fs.readFileSync(newsFile, 'utf8'));

console.log('🧹 Nettoyage en profondeur de tous les articles...\n');

let cleanedCount = 0;

data.forEach((item, index) => {
    const before = item.content;

    // Nettoyage exhaustif
    item.content = item.content
        // Blocs HTML Webador
        .replace(/<div[^>]*class="[^"]*jw-social-share[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="[^"]*jw-news-page-pagination[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="[^"]*jw-block-footer-content[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="[^"]*jw-footer-text[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<div[^>]*class="[^"]*jw-comments-container[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="[^"]*jw-comment-module[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="[^"]*scroll-top[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="[^"]*jw-news-comments[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*id="[^"]*jw-comments[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="[^"]*jw-bottom-bar[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="[^"]*jw-element-form[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')

        // Textes de navigation
        .replace(/Précédent\s*\|\s*Liste\s*\|\s*Suivant/gi, '')
        .replace(/Précédent/gi, '')
        .replace(/Suivant/gi, '')
        .replace(/Retour/gi, '')
        .replace(/Liste/gi, '')

        // Boutons et actions
        .replace(/Partager/gi, '')
        .replace(/HAUT/g, '')
        .replace(/Envoyer\s*un\s*commentaire/gi, '')
        .replace(/Commentaires/gi, '')
        .replace(/Il\s*n'y\s+a\s+pas\s+encore\s+de\s+commentaire\./gi, '')

        // Formulaires
        .replace(/Nom\s*\*/gi, '')
        .replace(/Adresse\s*e-mail\s*\*/gi, '')
        .replace(/Message\s*\*/gi, '')
        .replace(/Laisser\s*ce\s*champ\s*vide\s*\*/gi, '')

        // Mentions légales
        .replace(/&copy;\s*20\d{2}/gi, '')
        .replace(/©\s*20\d{2}/gi, '')
        .replace(/Tous\s+droits\s+réservés/gi, '')
        .replace(/Propulsé\s+par\s+Webador/gi, '')
        .replace(/Modifier\s+cette\s+page/gi, '')

        // Métadonnées parasites
        .replace(/Posté\s+par[\s\S]*?(?=<\/p>|<\/div>|<p|<div|$)/gi, '')
        .replace(/Publié\s+par[\s\S]*?(?=<\/p>|<\/div>|<p|<div|$)/gi, '')
        .replace(/Catégorie\s*:[\s\S]*?(?=<\/p>|<\/div>|<p|<div|$)/gi, '')
        .replace(/Tags\s*:[\s\S]*?(?=<\/p>|<\/div>|<p|<div|$)/gi, '')
        .replace(/Auteur\s*:[\s\S]*?(?=<\/p>|<\/div>|<p|<div|$)/gi, '')

        // Numéros de pages (ex: "1 2 3 4 5")
        .replace(/\b\d+\s+\d+\s+\d+(\s+\d+)*\b/g, '')

        // Liens de pagination
        .replace(/<a[^>]*href="[^"]*page[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '')

        // Nettoyage des tags vides
        .replace(/<p[^>]*>\s*<\/p>/gi, '')
        .replace(/<div[^>]*>\s*<\/div>/gi, '')
        .replace(/<span[^>]*>\s*<\/span>/gi, '')
        .replace(/<br[^>]*>\s*$/gi, '')

        // Espaces multiples
        .replace(/\s{3,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')

        // Trim final
        .trim();

    if (before !== item.content) {
        cleanedCount++;
        console.log(`✅ [${index + 1}/${data.length}] ${item.title.substring(0, 50)}...`);
    }
});

// Sauvegarde
fs.writeFileSync(newsFile, JSON.stringify(data, null, 2));

console.log(`\n✨ Nettoyage terminé !`);
console.log(`📊 ${cleanedCount} articles sur ${data.length} ont été nettoyés.`);
console.log(`💾 Fichier sauvegardé : ${newsFile}`);
