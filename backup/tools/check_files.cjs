
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../public');

function scanPublicFolder(folder, allFiles = []) {
    const files = fs.readdirSync(folder);
    files.forEach(file => {
        const fullPath = path.join(folder, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanPublicFolder(fullPath, allFiles);
        } else {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
                allFiles.push(fullPath);
            }
        }
    });
    return allFiles;
}

const DATA_DIR = path.join(__dirname, '../src/data');
const JSON_FILES = ['news.json', 'recaps.json', 'agenda.json', 'galerie.json', 'shop.json'];

function checkOrphanImages() {
    console.log('🔍 Recherche des images orphelines (fichiers présents sur le disque mais non référencés)...');

    // 1. Get all images on disk
    const diskImages = scanPublicFolder(PUBLIC_DIR).map(p => path.relative(PUBLIC_DIR, p).replace(/\\/g, '/'));
    if (!diskImages[0].startsWith('/')) {
        // Normalize to start with / for comparison
        diskImages.forEach((p, i) => diskImages[i] = '/' + p);
    }

    console.log(`- ${diskImages.length} images trouvées sur le disque.`);

    // 2. Get all images referenced in JSON
    const referencedImages = new Set();
    JSON_FILES.forEach(file => {
        const filePath = path.join(DATA_DIR, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            // Regex to find potential local paths in the JSON string
            // Looking for "/something.ext"
            const matches = content.match(/"\/[^"]+\.(jpg|jpeg|png|webp|gif)"/gi);
            if (matches) {
                matches.forEach(m => referencedImages.add(m.replace(/"/g, '')));
            }
        }
    });

    console.log(`- ${referencedImages.size} chemins locaux encore référencés dans les fichiers JSON.`);

    // 3. Find Orphans (On disk but NOT referenced)
    // These are files we could probably delete right away if all JSONs were updated
    const orphans = diskImages.filter(p => !referencedImages.has(p));

    // 4. Find Missing (Referenced but NOT on disk)
    const missing = [...referencedImages].filter(p => !diskImages.includes(p));

    console.log('\n📈 BILAN :');
    console.log(`- Images à uploader (toujours référencées) : ${referencedImages.size}`);
    console.log(`- Images orphelines (posent problème ou inutilisées) : ${orphans.length}`);
    if (orphans.length > 0) {
        console.log('  (Exemples d\'orphelines : ' + orphans.slice(0, 5).join(', ') + ')');
    }
    console.log(`- Images manquantes (référencées mais absentes du disque) : ${missing.length}`);
    if (missing.length > 0) {
        console.log('  (Exemples de manquantes : ' + missing.slice(0, 5).join(', ') + ')');
    }
}

checkOrphanImages();
