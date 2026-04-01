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

// 1. GRID START
html = html.replace(/display: flex; flex-wrap: wrap; gap: 40px; justify-content: flex-start; margin-bottom: 20px;/g, 
                   'display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-bottom: 40px; width: 100%;');

// 2. WRAPPER CLEANUP
html = html.replace(/flex: 1 1 280px; min-width: 280px; width: calc\(33\.333% - 27px\); margin-bottom: 40px;/g, 
                   'width: 100%; margin-bottom: 40px;');

// 3. ARTIST NAMES (16px + Premium Style)
html = html.replace(/color: #9ca3af; font-size: 10px; font-weight: 900; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.2em;/g, 
                   'color: #9ca3af; font-size: 16px; font-weight: 900; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 0.25em; color: #fff !important; text-shadow: 0 0 10px rgba(255,255,255,0.3);');

article.content = html;

fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
console.log('Article 247 fixed successfully with simpler regex!');
