const fs = require('fs');
const path = 'src/data/news_content_3.json';
let content = fs.readFileSync(path, 'utf8');
let data = JSON.parse(content);

const article = data.find(a => a.id === 247);
if (!article) {
    console.log('Article 247 not found');
    process.exit(1);
}

let html = article.content;

// 1. FORCE GRID ON ALL ROWS (Regardless of current style)
html = html.replace(/<div class=\"premium-video-row\"[^>]*>/g, 
                   '<div class=\"premium-video-row\" style=\"display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; width: 100%;\">');

// 2. FORCE WRAPPER FULL WIDTH INSIDE GRID
html = html.replace(/<div class=\"premium-video-wrapper\"[^>]*>/g, 
                   '<div class=\"premium-video-wrapper\" style=\"width: 100%; margin-bottom: 30px;\">');

// 3. FORCE ARTIST NAMES 16px + WHITE + SHADOW
// Use a very broad regex to catch the label div
html = html.replace(/<div style=\"color: #9ca3af; font-size: [^;]+;[^>]*>([^<]+)<\/div>/g, (match, artist) => {
    return `<div style="color: #fff; font-size: 16px; font-weight: 900; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.25em; text-shadow: 0 0 10px rgba(255,255,255,0.4);">${artist}</div>`;
});

article.content = html;

fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
console.log('Article 247 FORCE FIXED successfully!');
