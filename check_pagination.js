import fs from 'fs';
import { JSDOM } from 'jsdom';

const html = fs.readFileSync('gallery_page.html', 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

const pagination = document.querySelector('.jw-pagination');
if (pagination) {
    console.log('Pagination found!');
    const links = pagination.querySelectorAll('a');
    links.forEach(link => {
        console.log(`Link: ${link.textContent.trim()} -> ${link.getAttribute('href')}`);
    });
} else {
    console.log('No pagination found via class .jw-pagination');
    // Check for any link with "page="
    const links = Array.from(document.querySelectorAll('a')).filter(a => a.getAttribute('href')?.includes('page='));
    if (links.length > 0) {
        console.log('Found page links:');
        links.forEach(link => console.log(link.getAttribute('href')));
    } else {
        console.log('No obvious pagination links found.');
    }
}
