import fs from 'fs';
import { JSDOM } from 'jsdom';
import https from 'https';

async function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function start() {
    const baseUrl = 'https://www.dropsiders.eu/';
    const html = await fetchUrl(baseUrl);
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const links = Array.from(document.querySelectorAll('a')).map(a => a.getAttribute('href'));
    console.log('Detected Links on Homepage:');
    links.forEach(link => {
        if (link && (link.includes('galerie') || link.includes('photo'))) {
            console.log(link);
        }
    });
}

start();
