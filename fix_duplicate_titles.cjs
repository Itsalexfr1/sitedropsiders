const fs = require('fs');
const path = require('path');

const newsFile = path.join(__dirname, 'src', 'data', 'news.json');
let data = JSON.parse(fs.readFileSync(newsFile, 'utf8'));

console.log('🔍 Recherche de textes parasites dans les articles...\n');

let fixedCount = 0;

data.forEach((item, index) => {
    const before = item.content;

    // Pattern pour détecter les titres d'articles collés (ex: "INTERVIEW VIDEO : DUBVISION INTERVIEW : HARDWELL")
    // Ces textes apparaissent souvent en fin de contenu
    item.content = item.content
        // Retire les titres d'interviews/articles qui se répètent
        .replace(/INTERVIEW\s*(VIDEO)?\s*:\s*[A-Z\s&()]+(?=INTERVIEW|$)/gi, '')
        .replace(/INTERVIEWS?\s*:\s*[A-Z\s&()]+(?=INTERVIEW|$)/gi, '')

        // Retire les blocs de liens "À lire aussi" qui ont été scrapés
        .replace(/<div[^>]*class="[^"]*related[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="[^"]*sidebar[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')

        // Retire les titres en majuscules répétés en fin de texte
        .replace(/([A-Z\s:&()]{20,})\1+/g, '$1')

        // Nettoyage final
        .replace(/<p[^>]*>\s*<\/p>/gi, '')
        .replace(/<div[^>]*>\s*<\/div>/gi, '')
        .replace(/\s{3,}/g, ' ')
        .trim();

    if (before !== item.content) {
        fixedCount++;
        const removed = before.length - item.content.length;
        console.log(`✅ [${index + 1}] ${item.title.substring(0, 60)}... (-${removed} chars)`);
    }
});

fs.writeFileSync(newsFile, JSON.stringify(data, null, 2));

console.log(`\n✨ Nettoyage terminé !`);
console.log(`📊 ${fixedCount} articles corrigés.`);
