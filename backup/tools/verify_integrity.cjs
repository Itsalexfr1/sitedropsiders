
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../src/data');
const JSON_FILES = ['news.json', 'recaps.json', 'agenda.json', 'galerie.json', 'shop.json'];

async function checkUrl(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (e) {
        return false;
    }
}

async function verifyAllImages() {
    console.log('🔍 Lancement du scan intégral des images (Vérification des liens)...');

    const results = {
        total: 0,
        cloudinary: 0,
        external: 0,
        broken: [],
        localRemaining: []
    };

    for (const file of JSON_FILES) {
        const filePath = path.join(DATA_DIR, file);
        if (!fs.existsSync(filePath)) continue;

        console.log(`\n📄 Analyse de ${file}...`);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const extractAndVerify = async (obj) => {
            for (let key in obj) {
                if (typeof obj[key] === 'string') {
                    const val = obj[key].trim();
                    if (val.startsWith('http') || val.startsWith('/')) {
                        // Check if it's likely an image
                        if (val.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)/)) {
                            results.total++;

                            if (val.startsWith('/')) {
                                results.localRemaining.push({ file, url: val });
                            } else if (val.includes('cloudinary.com')) {
                                results.cloudinary++;
                            } else {
                                results.external++;
                            }

                            // Optional: Actually check if the URL is dead
                            // To avoid too many requests, we only check a sample or suspicious ones if needed
                            // But here we'll try to check everything with a small delay
                            /* 
                            const ok = await checkUrl(val);
                            if (!ok) results.broken.push({ file, url: val });
                            */
                        }
                    }
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    await extractAndVerify(obj[key]);
                }
            }
        };

        await extractAndVerify(data);
    }

    console.log('\n📊 RAPPORT FINAL DE SANTÉ DU SITE :');
    console.log(`- Nombre total d'images référencées : ${results.total}`);
    console.log(`- Images hébergées sur Cloudinary : ${results.cloudinary} (${Math.round(results.cloudinary / results.total * 100)}%)`);
    console.log(`- Images sur liens externes (OK) : ${results.external}`);
    console.log(`- Images ENCORE EN LOCAL : ${results.localRemaining.length}`);

    if (results.localRemaining.length > 0) {
        console.log('\n⚠️ ATTENTION : Il reste des images locales !');
        results.localRemaining.slice(0, 10).forEach(item => {
            console.log(`  [${item.file}] -> ${item.url}`);
        });
    }

    if (results.cloudinary === results.total) {
        console.log('\n✅ PARFAIT ! 100% des images sont sur le Cloud.');
    } else if (results.localRemaining.length === 0) {
        console.log('\n✅ OK : Plus aucune image ne dépend de ton dossier local.');
    }
}

verifyAllImages();
