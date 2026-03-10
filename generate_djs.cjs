const fs = require('fs');
const https = require('https');

const djs = [
    "David Guetta", "Dimitri Vegas & Like Mike", "Martin Garrix", "Alok", "Armin van Buuren", "Timmy Trumpet", "Afrojack", "Steve Aoki", "Peggy Gou", "Vintage Culture",
    "Alan Walker", "Calvin Harris", "Don Diablo", "R3hab", "KSHMR", "W&W", "Skrillex", "Charlotte de Witte", "Oliver Heldens", "Fisher",
    "Gordo", "Lost Frequencies", "Tiësto", "Nicky Romero", "Diplo", "Carl Cox", "Meduza", "Amelie Lens", "Eric Prydz", "Boris Brejcha",
    "Hardwell", "CamelPhat", "Fred again..", "Anyma", "John Summit", "Mau P", "James Hype", "Chris Lake", "Maddix", "Swedish House Mafia",
    "Kevin de Vries", "Dom Dolla", "Eli Brown", "Miss Monique", "Tale Of Us", "Illenium", "Marshmello", "The Chainsmokers", "Kygo", "Zedd",
    "DJ Snake", "Alesso", "Nervo", "Paul van Dyk", "Above & Beyond", "Vini Vici", "Claptone", "Nora En Pure", "Nina Kraviz", "Adam Beyer",
    "REZZ", "Subtronics", "Excision", "Alison Wonderland", "Deadmau5", "Kaskade", "Flume", "Disclosure", "Bicep", "Rüfüs Du Sol",
    "Solomun", "Maceo Plex", "Jamie Jones", "Michael Bibi", "The Martinez Brothers", "Gorgon City", "Sonny Fodera", "MK", "Duke Dumont", "Joel Corry",
    "Robin Schulz", "Felix Jaehn", "Sigala", "Galantis", "Yellow Claw", "Jauz", "San Holo", "Odesza", "Zeds Dead", "Tchami", "Malaa",
    "DJ Isaac", "Headhunterz", "Brennan Heart", "Da Tweekaz", "Sub Zero Project", "Angerfist", "Mochakk", "Indira Paganotto", "Sara Landry", "Klangkuenstler",
    "I Hate Models", "Nico Moreno", "Trym", "Shlømo", "Marlon Hoffstadt", "Patrick Mason", "Dimitri K"
];

async function fetchDeezer(name) {
    return new Promise((resolve) => {
        https.get(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=1`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.data && json.data.length > 0) resolve(json.data[0]);
                    else resolve(null);
                } catch { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

function getRandomGenre(index) {
    const genres = ["EDM / Mainstage", "Techno", "House", "Tech House", "Melodic Techno", "Hardstyle", "Bass / Dubstep", "Trance", "Deep House"];
    return genres[index % genres.length];
}

async function run() {
    const results = [];
    for (let i = 0; i < djs.length; i++) {
        const name = djs[i];
        const data = await fetchDeezer(name);
        
        let imageUrl = "https://images.unsplash.com/photo-1542158025-0fa22d861d8a?w=500&h=500&fit=crop";
        if (data && data.picture_xl) imageUrl = data.picture_xl;

        results.push({
            id: String(i + 1),
            name: name,
            genre: getRandomGenre(i),
            bio: `Artiste incontournable du moment, très présent dans les classements Top 100 DJ Mag ou Top 101 Producers (1001Tracklists). S'est produit dans les plus gros festivals du monde.`,
            country: 'Intl',
            image: imageUrl,
            rating: (Math.random() * (5.0 - 4.2) + 4.2).toFixed(1)
        });
        await new Promise(r => setTimeout(r, 100)); // Rate limiting
    }
    
    fs.writeFileSync('src/data/wiki_djs.json', JSON.stringify(results, null, 2));
    console.log('Done generating ' + results.length + ' DJs.');
}
run();
