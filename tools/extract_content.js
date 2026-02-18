import fs from 'fs';
import path from 'path';

const ROOT = 'c:\\Users\\alexf\\Documents\\Site Dropsiders V2';
const DATA = path.join(ROOT, 'src', 'data');

// Correction mojibake Latin-1 -> UTF-8
function fixMojibake(text) {
    try {
        return Buffer.from(text, 'latin1').toString('utf8');
    } catch (e) { return text; }
}

function processFile(backupFile, outputPrefix, mainFile) {
    console.log(`\n=== Traitement de ${backupFile} ===`);

    const raw = fs.readFileSync(path.join(DATA, backupFile), 'latin1');
    let data;
    try {
        // Le fichier a été sauvegardé avec Out-File qui peut ajouter un BOM
        const cleaned = raw.replace(/^\uFEFF/, '');
        data = JSON.parse(Buffer.from(cleaned, 'latin1').toString('utf8'));
    } catch (e) {
        console.log('Erreur parse JSON, tentative avec utf8...');
        try {
            const raw2 = fs.readFileSync(path.join(DATA, backupFile), 'utf8');
            data = JSON.parse(raw2.replace(/^\uFEFF/, ''));
        } catch (e2) {
            console.log('ERREUR:', e2.message);
            return;
        }
    }

    console.log(`  ${data.length} articles trouvés`);

    // Séparer: articles avec content vs sans
    const withContent = data.filter(a => a.content && a.content.trim().length > 10);
    const withoutContent = data.filter(a => !a.content || a.content.trim().length <= 10);

    console.log(`  ${withContent.length} avec contenu, ${withoutContent.length} sans`);

    // Créer le fichier content séparé (id + content uniquement)
    // Diviser en chunks de ~800KB pour rester sous 1MB GitHub
    const contentOnly = withContent.map(a => ({
        id: a.id,
        content: a.content
    }));

    // Calculer la taille approximative
    const totalSize = JSON.stringify(contentOnly).length;
    console.log(`  Taille totale du contenu: ${Math.round(totalSize / 1024)}KB`);

    if (totalSize < 900000) {
        // Un seul fichier suffit
        const outPath = path.join(DATA, `${outputPrefix}_content.json`);
        fs.writeFileSync(outPath, JSON.stringify(contentOnly, null, 2), 'utf8');
        console.log(`  ✓ Créé: ${outputPrefix}_content.json (${Math.round(totalSize / 1024)}KB)`);
    } else {
        // Diviser en plusieurs fichiers
        let chunk = [];
        let chunkSize = 0;
        let chunkIndex = 1;

        for (const item of contentOnly) {
            const itemSize = JSON.stringify(item).length;
            if (chunkSize + itemSize > 850000 && chunk.length > 0) {
                const outPath = path.join(DATA, `${outputPrefix}_content_${chunkIndex}.json`);
                fs.writeFileSync(outPath, JSON.stringify(chunk, null, 2), 'utf8');
                console.log(`  ✓ Créé: ${outputPrefix}_content_${chunkIndex}.json (${Math.round(chunkSize / 1024)}KB, ${chunk.length} articles)`);
                chunk = [];
                chunkSize = 0;
                chunkIndex++;
            }
            chunk.push(item);
            chunkSize += itemSize;
        }
        if (chunk.length > 0) {
            const outPath = path.join(DATA, `${outputPrefix}_content_${chunkIndex}.json`);
            fs.writeFileSync(outPath, JSON.stringify(chunk, null, 2), 'utf8');
            console.log(`  ✓ Créé: ${outputPrefix}_content_${chunkIndex}.json (${Math.round(chunkSize / 1024)}KB, ${chunk.length} articles)`);
        }
    }

    // Mettre à jour le fichier principal avec les contenus restaurés
    const mainPath = path.join(DATA, mainFile);
    const mainRaw = fs.readFileSync(mainPath, 'utf8');
    let mainData = JSON.parse(mainRaw);

    // Créer un map id -> content depuis le backup
    const contentMap = {};
    for (const a of withContent) {
        contentMap[a.id] = a.content;
    }

    // Restaurer le content dans le fichier principal
    let restored = 0;
    mainData = mainData.map(a => {
        if (contentMap[a.id]) {
            restored++;
            return { ...a, content: contentMap[a.id] };
        }
        return a;
    });

    // Vérifier la taille
    const mainSize = JSON.stringify(mainData).length;
    console.log(`  Taille fichier principal avec content: ${Math.round(mainSize / 1024)}KB`);

    if (mainSize < 900000) {
        fs.writeFileSync(mainPath, JSON.stringify(mainData, null, 2), 'utf8');
        console.log(`  ✓ ${mainFile} mis à jour avec ${restored} contenus restaurés`);
    } else {
        console.log(`  ⚠ Trop grand pour GitHub (${Math.round(mainSize / 1024)}KB > 900KB)`);
        console.log(`  → Le contenu est dans les fichiers _content séparés`);
        console.log(`  → ${mainFile} reste sans content (pour la liste)`);
    }
}

// Traiter news
processFile('news_backup_full.json', 'news', 'news.json');

// Traiter recaps
processFile('recaps_backup_full.json', 'recaps', 'recaps.json');

console.log('\n=== Terminé ! ===');
