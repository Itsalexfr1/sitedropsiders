
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'src/data');
const jsonFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

let urlMap = {};

for (const filename of jsonFiles) {
    const filePath = path.join(dataDir, filename);
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);

        function findUrls(obj, fileOrigin) {
            if (typeof obj === 'string') {
                if (obj.includes('cloudinary.com')) {
                    if (!urlMap[obj]) {
                        urlMap[obj] = [];
                    }
                    urlMap[obj].push(fileOrigin);
                }
            } else if (Array.isArray(obj)) {
                for (const item of obj) {
                    findUrls(item, fileOrigin);
                }
            } else if (typeof obj === 'object' && obj !== null) {
                for (const key in obj) {
                    findUrls(obj[key], fileOrigin);
                }
            }
        }

        findUrls(data, filename);
    } catch (e) {
        console.error(`Error reading ${filename}: ${e.message}`);
    }
}

const duplicates = Object.entries(urlMap).filter(([url, files]) => files.length > 1);

if (duplicates.length > 0) {
    console.log("Found duplicate Cloudinary URLs:");
    for (const [url, files] of duplicates) {
        console.log(`URL: ${url}`);
        console.log(`Used in: ${files.join(', ')}`);
        console.log("-" * 20);
    }
} else {
    console.log("No duplicate Cloudinary URLs found across JSON files.");
}
