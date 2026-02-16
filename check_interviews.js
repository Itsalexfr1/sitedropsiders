import axios from 'axios';
import * as cheerio from 'cheerio';

async function checkInterviews() {
    const { data } = await axios.get('https://www.dropsiders.eu/interviews-videos');
    const $ = cheerio.load(data);
    const links = [];
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href) links.push(href);
    });
    console.log('Sample links from Interviews:');
    console.log(links.slice(0, 100).filter(l => l.length > 2).join('\n'));
}
checkInterviews();
