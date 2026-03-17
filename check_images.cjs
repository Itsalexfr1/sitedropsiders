const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const dataDir = path.join(__dirname, 'src', 'data');
const filesToCheck = [
    "agenda.json", "galerie.json", "news.json", "shop.json", 
    "wiki_djs.json", "wiki_clubs.json", "wiki_festivals.json", "team.json"
];

function findUrls(data, urls = new Set()) {
    if (typeof data === 'object' && data !== null) {
        if (Array.isArray(data)) {
            data.forEach(item => findUrls(item, urls));
        } else {
            Object.values(data).forEach(value => findUrls(value, urls));
        }
    } else if (typeof data === 'string') {
        if (data.startsWith('http')) {
            urls.add(data);
        }
    }
    return urls;
}

function checkUrl(url) {
    return new Promise((resolve) => {
        const reqMod = url.startsWith('https') ? https : http;
        const options = { method: 'HEAD', timeout: 5000 };
        
        const req = reqMod.request(url, options, (res) => {
            if (res.statusCode >= 400 && res.statusCode !== 405) { // some servers block HEAD
                resolve({ url, status: res.statusCode });
            } else {
                resolve(null);
            }
        });

        req.on('error', (e) => resolve({ url, error: e.message }));
        req.on('timeout', () => { req.destroy(); resolve({ url, error: 'Timeout' }); });
        req.end();
    });
}

async function main() {
    const allUrls = new Set();
    const urlFoundIn = {};

    for (const fileName of filesToCheck) {
        const filePath = path.join(dataDir, fileName);
        if (!fs.existsSync(filePath)) continue;

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const fileUrls = Array.from(findUrls(data));
            fileUrls.forEach(url => {
                if (!urlFoundIn[url]) urlFoundIn[url] = [];
                if (!urlFoundIn[url].includes(fileName)) {
                    urlFoundIn[url].push(fileName);
                }
                allUrls.add(url);
            });
        } catch (e) {
            console.error(`Error reading ${fileName}:`, e.message);
        }
    }

    const urlsArray = Array.from(allUrls);
    console.log(`Found ${urlsArray.length} unique HTTP/HTTPS URLs. Checking...`);

    const brokenImages = [];
    const concurrency = 10;
    
    for (let i = 0; i < urlsArray.length; i += concurrency) {
        const chunk = urlsArray.slice(i, i + concurrency);
        const results = await Promise.all(chunk.map(checkUrl));
        results.forEach(res => {
            if (res) brokenImages.push(res);
        });
        
        // Progress
        process.stdout.write(`\rChecked ${Math.min(i + concurrency, urlsArray.length)}/${urlsArray.length}`);
    }

    console.log('\n');
    
    // Filter out common false positives (e.g., standard links that aren't images but return 40X or block HEAD)
    // We mainly care about dropsiders.fr/uploads
    const actualBroken = brokenImages.filter(item => 
        item.url.includes('dropsiders.fr') || 
        item.url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)
    );

    if (actualBroken.length === 0) {
        console.log("No broken images found! All good. ✅");
    } else {
        console.log(`Found ${actualBroken.length} potentially broken images on Dropsiders or image links:\n`);
        actualBroken.forEach(item => {
            const files = urlFoundIn[item.url].join(', ');
            console.log(`- ${item.url} | Reason: ${item.status || item.error} | Found in: ${files}`);
        });
    }
}

main();
