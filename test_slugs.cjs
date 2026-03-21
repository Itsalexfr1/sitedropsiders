const fs = require('fs');

const newsData = JSON.parse(fs.readFileSync('src/data/news.json', 'utf8').replace(/^\uFEFF/, ''));
const recapsData = JSON.parse(fs.readFileSync('src/data/recaps.json', 'utf8').replace(/^\uFEFF/, ''));
const agendaData = JSON.parse(fs.readFileSync('src/data/agenda.json', 'utf8').replace(/^\uFEFF/, ''));

// Simulated original slugify (the one that crashes)
function slugify(text) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function generateSlug(title, id) {
    if (typeof id === 'string' && isNaN(Number(id))) return id;
    const slug = slugify(title);
    return slug + '-' + id;
}

console.log('Testing generateSlug on all files to find the missing title...');
try {
  let errors = 0;
  newsData.forEach(n => { try { generateSlug(n.title, n.id); } catch (e) { console.log('News missing title:', n); errors++; } });
  recapsData.forEach(n => { try { generateSlug(n.title, n.id); } catch (e) { console.log('Recap missing title:', n); errors++; } });
  agendaData.forEach(n => { try { generateSlug(n.title, n.id); } catch (e) { console.log('Agenda missing title:', n); errors++; } });
  console.log('Done scanning. Errors found:', errors);
} catch (e) {
  console.log('ERROR:', e.message);
}
