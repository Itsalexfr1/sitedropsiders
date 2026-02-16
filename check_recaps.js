import axios from 'axios';
import * as cheerio from 'cheerio';

async function checkRecaps() {
    const { data } = await axios.get('https://www.dropsiders.eu/recaps-ecrit');
    const $ = cheerio.load(data);
    const links = [];
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href) links.push(href);
    });
    console.log('Sample links from Recaps (first 100):');
    console.log(links.slice(0, 100).join('\n'));
}
checkRecaps();
