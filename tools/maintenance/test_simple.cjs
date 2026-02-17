const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const IMG_DIR = './public/images/news';
const MD_DIR = './news_migrated';

if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });
if (!fs.existsSync(MD_DIR)) fs.mkdirSync(MD_DIR, { recursive: true });

function curlGet(url) {
    try {
        const cmd = `curl.exe -L -A "${UA}" "${url}" -s`;
        return execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    } catch (e) { return ''; }
}

function downloadFile(url, filepath) {
    try {
        const cmd = `curl.exe -L -A "${UA}" "${url}" -o "${filepath}" --create-dirs -s`;
        execSync(cmd);
        return fs.existsSync(filepath) && fs.statSync(filepath).size > 0;
    } catch (e) { return false; }
}

const html = fs.readFileSync('source.html', 'utf8');
const links = [];
const regex = /href="(\/news\/[0-9]{5,}_[^"]+)"/g; // More specific regex for article links
let match;
while ((match = regex.exec(html)) !== null) {
    if (!links.includes(match[1])) links.push(match[1]);
}

const toProcess = links.slice(0, 3);
console.log(`Processing improved 3 articles...`);

toProcess.forEach((relLink, index) => {
    const url = `https://www.dropsiders.eu${relLink}`;
    const articleHtml = curlGet(url);
    if (!articleHtml) return;

    // Title
    let title = "Article " + (index + 1);
    const titleMatch = articleHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (titleMatch) title = titleMatch[1].replace(/<[^>]+>/g, '').trim();

    // Content
    let content = "";
    const contentMatch = articleHtml.match(/<div[^>]*class="[^"]*news-page-content-container[^"]*"[^>]*>([\s\S]*?)<div[^>]*class="jw-bottom-bar/i) ||
        articleHtml.match(/<div[^>]*data-section-name="content"[^>]*>([\s\S]*?)<\/main>/i);
    if (contentMatch) content = contentMatch[1].replace(/<[^>]+>/g, '\n').trim();

    // Image Targeting
    let coverImage = "";
    const imgMatches = articleHtml.matchAll(/src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/gi);
    for (const m of imgMatches) {
        const iUrl = m[1].toLowerCase();
        if (iUrl.includes('logo') || iUrl.includes('favicon') || iUrl.includes('assets.jwwb.nl')) continue;

        // This looks like a real article image
        const imgUrl = m[1].replace(/&amp;/g, '&');
        const ext = imgUrl.split('.').pop().split(/[?#]/)[0] || 'jpg';
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
        const filename = `${slug}-${index}.${ext}`;
        const filepath = path.join(IMG_DIR, filename);

        if (downloadFile(imgUrl, filepath)) {
            coverImage = `/images/news/${filename}`;
            console.log(`[OK] Image for "${title}": ${filename}`);
            break;
        }
    }

    const mdContent = `---
title: "${title}"
date: "${new Date().toLocaleDateString()}"
category: News
image: "${coverImage}"
---

${content.substring(0, 1000)}...

[Source](${url})
`;
    fs.writeFileSync(path.join(MD_DIR, `${index + 1}.md`), mdContent);
});

console.log("Improved mission finished.");
