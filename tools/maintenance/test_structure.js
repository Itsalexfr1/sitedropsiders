import axios from 'axios';
import * as cheerio from 'cheerio';

async function check() {
    try {
        const { data } = await axios.get('https://www.dropsiders.eu/news');
        const $ = cheerio.load(data);
        const links = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href) links.push(href);
        });
        console.log('Total links:', links.length);
        console.log('Sample links (first 100):');
        console.log(links.slice(0, 100).join('\n'));

        const newsLinks = links.filter(l => l.includes('/news/'));
        console.log('\nPotential News links:', newsLinks.length);
        if (newsLinks.length > 0) console.log('Sample News link:', newsLinks[0]);

    } catch (e) {
        console.error(e.message);
    }
}
check();
