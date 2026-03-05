const fs = require('fs');
const cp = require('child_process');

try {
    const oldNews = JSON.parse(cp.execSync('git show 3270576:src/data/news.json', { encoding: 'utf-8' }));
    const article = oldNews.find(a => a.id === 237);
    console.log(JSON.stringify(article, null, 2));
    fs.writeFileSync('tmp_article_237.json', JSON.stringify(article, null, 2));
} catch (e) {
    console.error(e);
}
