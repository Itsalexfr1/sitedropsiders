const fs = require('fs');
try {
const newsData = JSON.parse(fs.readFileSync('src/data/news.json', 'utf8'));
const recapsData = JSON.parse(fs.readFileSync('src/data/recaps.json', 'utf8'));
const agendaData = JSON.parse(fs.readFileSync('src/data/agenda.json', 'utf8'));

// Simulated slugify
function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function generateSlug(title, id) {
    if (typeof id === 'string' && isNaN(Number(id))) return id;
    const slug = slugify(title);
    return \\-\\;
}

console.log('Testing generateSlug on all files...');
newsData.forEach(n => generateSlug(n.title, n.id));
recapsData.forEach(n => generateSlug(n.title, n.id));
agendaData.forEach(n => generateSlug(n.title, n.id));

console.log('All links generated successfully!');
} catch (e) {
  console.log('ERROR:', e.message);
}
