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

// 1. FORCE THE GRID WITH 3 COLUMNS ON EVERY ROW
// We replace the entire opening tag of premium-video-row
html = html.replace(/<div class=\"premium-video-row\"[^>]*>/g, 
                   '<div class=\"premium-video-row\" style=\"display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 75px !important; margin-bottom: 75px !important; width: 100% !important; display: -ms-grid; -ms-grid-columns: 1fr 1fr 1fr;\">');

// 2. FORCE WRAPPERS TO NOT BREAK THE GRID
html = html.replace(/<div class=\"premium-video-wrapper\"[^>]*>/g, 
                   '<div class=\"premium-video-wrapper\" style=\"width: 100% !important; min-width: 0 !important; margin-bottom: 20px !important;\">');

// 3. FORCE ARTIST TITLES TO 16PX WHITE SHADOW
// Catching the label div regardless of its current style
html = html.replace(/<div style=\"[^>]*color:[^>]*font-size:[^>]*>[^<]*<\/div>/g, (match) => {
    // If it looks like a label (uppercase artist name usually), we replace it
    if (match.includes('AFROJACK') || match.includes('AGENTS') || match.includes('ALOK') || match.includes('AXWELL') || match.includes('CHARLOTTE') || match.includes('CYRIL') || match.includes('DA TWEEKAZ')) {
         // This is a bit too specific, let's use a general approach
    }
    return match;
});

// Better label replace: match any div inside wrapper that is NOT the video container
html = html.replace(/<div style=\"color: #9ca3af;[^>]*>([\s\S]*?)<\/div>/g, (match, artist) => {
    return `<div style="color: #fff !important; font-size: 16px !important; font-weight: 900 !important; text-transform: uppercase !important; margin-bottom: 15px !important; letter-spacing: 0.25em !important; text-shadow: 0 0 10px rgba(255,255,255,0.4) !important;">${artist}</div>`;
});

// 4. CLEANUP (Remove the white border and adjust margin)
html = html.replace(/border-l-4 border-white pl-6/g, '');
html = html.replace(/mb-10/g, 'mb-[57px]');

article.content = html;

fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
console.log('BRUTE FORCE V3: Article 247 FIXED successfully!');
