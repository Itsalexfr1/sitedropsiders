const fs = require('fs');
const path = require('path');

const djsPath = path.join(__dirname, 'src', 'data', 'wiki_djs.json');
const clubsPath = path.join(__dirname, 'src', 'data', 'wiki_clubs.json');
const festivalsPath = path.join(__dirname, 'src', 'data', 'wiki_festivals.json');

const djBiosEn = {
    'David Guetta': "David Guetta is a French DJ and record producer who has sold over 50 million records worldwide. He has been voted number one DJ in the DJ Mag Top 100 DJs poll multiple times.",
    'Martin Garrix': "Martin Garrix is a Dutch DJ and producer. He is known for his solo release 'Animals', which became a top-ten hit in more than ten countries.",
    'Armin van Buuren': "Armin van Buuren is a Dutch DJ and record producer. He has hosted A State of Trance, a weekly radio show, since 2001.",
    'Tiësto': "Tiësto is a Dutch DJ and record producer. He was voted 'the Greatest DJ of All Time' by Mix magazine fans in 2011.",
    'Charlotte de Witte': "Charlotte de Witte is a Belgian DJ and record producer, best known for her 'dark and stripped-back' brand of minimal techno and acid techno.",
    'Amelie Lens': "Amelie Lens is a Belgian electronic music DJ, record producer, and co-owner of the Lenske record label.",
    'Carl Cox': "Carl Cox is an English industry figure, DJ, and producer. A pioneer of the British house and techno scene.",
    'Eric Prydz': "Eric Prydz is a Swedish DJ and producer best known for his 2004 hit single 'Call on Me', and his legendary live shows.",
    'Hardwell': "Hardwell is a Dutch DJ, record producer and remixer from Breda, North Brabant. He was voted the world's number one DJ on DJ Mag in 2013 and 2014.",
    'Steve Aoki': "Steve Aoki is an American DJ, record producer, and music executive. He is one of the most hardworking and popular DJs in the world.",
    'Skrillex': "Skrillex is an American DJ and music producer who is credited with bringing dubstep into the mainstream.",
    'Fred again..': "Fred again.. is an English record producer, singer, songwriter, and multi-instrumentalist who has taken the electronic world by storm.",
    'John Summit': "John Summit is an American DJ and producer from Chicago who has quickly become one of the biggest names in tech house.",
    'Dom Dolla': "Dom Dolla is an Australian house music producer and DJ who has achieved massive international success with hits like 'Take It'.",
    'Fisher': "Fisher is an Australian music producer and DJ. He was nominated for the 2018 ARIA Award for Best Dance Release as well as the Best Dance Recording at the 61st Annual Grammy Awards for his solo single 'Losing It'.",
    'Peggy Gou': "Peggy Gou is a South Korean DJ and record producer based in Germany. She has released several EPs and reached international fame with '(It Goes Like) Nanana'.",
    'Nina Kraviz': "Nina Kraviz is a Russian DJ, music producer, and singer. She is one of the most recognizable figures in the global techno scene.",
    'Boris Brejcha': "Boris Brejcha is a German DJ and record producer. He describes his music style as 'High-Tech Minimal'.",
    'Solomun': "Solomun is a Bosnian-German DJ and producer. He is a four-time DJ Awards winner for Best Producers, Best DJ and Best Melodic House DJ.",
    'Tale of Us': "Tale of Us is an Italian DJ and production duo consisting of Carmine Conte and Matteo Milleri. They are the founders of the Afterlife label and event series.",
    'Artbat': "Artbat is a Ukrainian electronic music duo from Kyiv consisting of Artur and Batish. They are known for their cinematic melodic techno sound.",
    'Miss Monique': "Miss Monique is a Ukrainian DJ and producer, known for her progressive house sets and her popular YouTube channels.",
    'Deborah De Luca': "Deborah De Luca is an Italian techno DJ and producer. She founded Sola_mente Records in 2013.",
};

const djs = JSON.parse(fs.readFileSync(djsPath, 'utf8'));
djs.forEach(dj => {
    if (djBiosEn[dj.name]) {
        dj.bio_en = djBiosEn[dj.name];
    } else if (!dj.bio_en) {
        // Simple translation for others or placeholder
        dj.bio_en = dj.bio; // For now
    }
});
fs.writeFileSync(djsPath, JSON.stringify(djs, null, 2));

const clubs = JSON.parse(fs.readFileSync(clubsPath, 'utf8'));
clubs.forEach(club => {
    if (!club.description_en) club.description_en = club.description;
});
fs.writeFileSync(clubsPath, JSON.stringify(clubs, null, 2));

const festivals = JSON.parse(fs.readFileSync(festivalsPath, 'utf8'));
festivals.forEach(fest => {
    if (!fest.description_en) fest.description_en = fest.description;
});
fs.writeFileSync(festivalsPath, JSON.stringify(festivals, null, 2));

console.log('Wiki files updated with English bios for top artists.');
