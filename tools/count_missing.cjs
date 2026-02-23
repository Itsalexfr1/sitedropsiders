
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../src/data');
const FILES_TO_SCAN = ['news.json', 'recaps.json', 'agenda.json', 'galerie.json', 'shop.json'];

function countLocalImages() {
    let totalMissing = 0;
    const details = {};

    FILES_TO_SCAN.forEach(fileName => {
        const filePath = path.join(DATA_DIR, fileName);
        if (!fs.existsSync(filePath)) return;

        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        let count = 0;

        const scan = (obj) => {
            for (let key in obj) {
                if (typeof obj[key] === 'string' && obj[key].startsWith('/') && (obj[key].includes('.') || obj[key].includes('images') || obj[key].includes('uploads'))) {
                    // It's a local path
                    count++;
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    scan(obj[key]);
                }
            }
        };

        scan(data);
        details[fileName] = count;
        totalMissing += count;
    });

    console.log('📊 Rapport des images locales restantes :');
    Object.entries(details).forEach(([file, count]) => {
        console.log(`- ${file}: ${count}`);
    });
    console.log(`\nTOTAL: ${totalMissing} images encore en local.`);
}

countLocalImages();
