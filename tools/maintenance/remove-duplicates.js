import fs from 'fs';

// Charger les données
const data = JSON.parse(fs.readFileSync('./src/data/news.json', 'utf8'));

console.log(`\n📊 ANALYSE INITIALE: ${data.length} articles\n`);

// Détecter les doublons par titre
const titleCounts = {};
data.forEach(a => {
    titleCounts[a.title] = (titleCounts[a.title] || 0) + 1;
});

const duplicates = Object.entries(titleCounts).filter(([title, count]) => count > 1);

console.log('DOUBLONS DETECTES:\n');
duplicates.forEach(([title, count]) => {
    console.log(`  ${count}x: ${title.substring(0, 70)}`);
});

// Supprimer les doublons en gardant le premier exemplaire
const seen = new Set();
const uniqueData = data.filter(article => {
    if (seen.has(article.title)) {
        console.log(`\nSuppression doublon: ${article.title.substring(0, 60)}`);
        return false;
    }
    seen.add(article.title);
    return true;
});

console.log(`\n${'='.repeat(60)}`);
console.log(`AVANT: ${data.length} articles`);
console.log(`APRES: ${uniqueData.length} articles`);
console.log(`SUPPRIMES: ${data.length - uniqueData.length} doublons`);
console.log('='.repeat(60));

// Vérifier que toutes les images sont locales
let externalImages = 0;
uniqueData.forEach(article => {
    if (article.image && article.image.startsWith('http')) {
        console.log(`\nATTENTION: Image externe detectee dans "${article.title.substring(0, 50)}"`);
        externalImages++;
    }
});

console.log(`\nImages externes: ${externalImages}`);

// Sauvegarder les données nettoyées
fs.writeFileSync('./src/data/news.json', JSON.stringify(uniqueData, null, 2));

console.log('\n✅ Fichier news.json nettoye et sauvegarde!\n');

// Statistiques finales
const stats = {
    total: uniqueData.length,
    news: uniqueData.filter(a => a.category === 'News').length,
    recaps: uniqueData.filter(a => a.category === 'Recap').length,
    interviews: uniqueData.filter(a => a.category === 'Interview').length
};

console.log('STATISTIQUES FINALES:');
console.log(`  News: ${stats.news}`);
console.log(`  Recaps: ${stats.recaps}`);
console.log(`  Interviews: ${stats.interviews}`);
console.log(`  TOTAL: ${stats.total}\n`);
