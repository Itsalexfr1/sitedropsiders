const axios = require('axios');
const fs = require('fs');

async function debug() {
    try {
        const response = await axios.get('https://www.dropsiders.eu/news', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        fs.writeFileSync('debug_news.html', response.data);
        console.log("Saved debug_news.html");
    } catch (e) {
        console.error(e);
    }
}

debug();
