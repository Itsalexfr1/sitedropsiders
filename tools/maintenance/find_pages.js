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
    const baseUrl = 'https://www.dropsiders.eu/galerie';
    const html = await fetchUrl(baseUrl);
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const pageLinks = new Set();
    pageLinks.add(baseUrl);

    // Look for pagination
    const paginationLinks = document.querySelectorAll('.jw-pagination a, .jw-pagination-page a');
    paginationLinks.forEach(link => {
        let href = link.getAttribute('href');
        if (href) {
            if (!href.startsWith('http')) {
                href = 'https://www.dropsiders.eu' + (href.startsWith('/') ? '' : '/') + href;
            }
            pageLinks.add(href);
        }
    });

    console.log('Detected Gallery Pages:');
    Array.from(pageLinks).forEach(url => console.log(url));
}

start();
