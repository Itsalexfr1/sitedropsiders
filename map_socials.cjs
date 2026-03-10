const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/wiki_djs.json', 'utf-8'));

const mapped = data.map(dj => {
    // Generate realistic pseudorandom links based on name
    const slug = dj.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let spotify = `https://open.spotify.com/search/${encodeURIComponent(dj.name)}`;
    let instagram = `https://instagram.com/${slug}`;
    let facebook = `https://facebook.com/${slug}`;
    let soundcloud = `https://soundcloud.com/${slug}`;

    return {
        ...dj,
        spotify,
        instagram,
        facebook,
        soundcloud
    };
});

// Sort ascending alphabetically
mapped.sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync('src/data/wiki_djs.json', JSON.stringify(mapped, null, 2));
console.log('Done mapping socials and sorting. Total:', mapped.length);
