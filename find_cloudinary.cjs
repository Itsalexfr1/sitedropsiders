const fs = require('fs');
const path = require('path');

function findCloudinaryUrls(dir, urls = new Set()) {
    const files = fs.readdirSync(dir);
    const regex = /https?:\/\/res\.cloudinary\.com\/[a-zA-Z0-9_-]+\/image\/upload\/[^"'\)\s]*/g;

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            findCloudinaryUrls(fullPath, urls);
        } else if (file.match(/\.(json|tsx|ts|js|html)$/)) {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const matches = content.match(regex);
                if (matches) {
                    matches.forEach(url => urls.add(url));
                }
            } catch (e) {
                console.error(`Error reading ${fullPath}: ${e}`);
            }
        }
    }
    return urls;
}

const srcDir = path.join(__dirname, 'src');
const urls = findCloudinaryUrls(srcDir);
Array.from(urls).sort().forEach(url => console.log(url));
