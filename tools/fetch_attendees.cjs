/**
 * fetch_attendees.cjs
 * 
 * Enrichit wiki_festivals.json et wiki_clubs.json avec le nombre de
 * participants (attendees) via l'API Wikipedia (REST, sans clé requise).
 * 
 * Usage: node tools/fetch_attendees.cjs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const festivalsPath = path.join(__dirname, '../src/data/wiki_festivals.json');
const clubsPath     = path.join(__dirname, '../src/data/wiki_clubs.json');

// ── Données connues (capacité / fréquentation) ─────────────────────────────
// Rempli manuellement pour les grands noms dont Wikipedia n'est pas fiable.
const KNOWN_ATTENDEES = {
  // Festivals
  'Tomorrowland':                  { attendees: 400000, label: '400 000 festivaliers (2 weekends)' },
  'Ultra Music Festival':          { attendees: 165000, label: '165 000 festivaliers' },
  'EDC Las Vegas':                 { attendees: 500000, label: '+500 000 festivaliers sur 3 nuits' },
  'Movement Detroit':              { attendees: 100000, label: '100 000 festivaliers' },
  'Sónar':                         { attendees: 120000, label: '120 000 festivaliers' },
  'Defqon.1':                      { attendees: 80000,  label: '80 000 festivaliers' },
  'Time Warp':                     { attendees: 20000,  label: '20 000 festivaliers (indoor)' },
  'Creamfields':                   { attendees: 70000,  label: '70 000 festivaliers' },
  'Mysteryland':                   { attendees: 50000,  label: '50 000 festivaliers' },
  'Exit Festival':                 { attendees: 200000, label: '200 000 festivaliers sur 4 jours' },
  'Untold Festival':               { attendees: 350000, label: '350 000 festivaliers sur 4 jours' },
  'Medusa Festival':               { attendees: 80000,  label: '80 000 festivaliers' },
  'Dimensions Festival':           { attendees: 12000,  label: '12 000 festivaliers' },
  'Electric Zoo':                  { attendees: 100000, label: '100 000 festivaliers' },
  'Neopop Festival':               { attendees: 15000,  label: '15 000 festivaliers' },
  'Loveland Festival':             { attendees: 20000,  label: '20 000 festivaliers' },
  'SW4 Festival':                  { attendees: 40000,  label: '40 000 festivaliers' },
  'Transmission Festival':         { attendees: 20000,  label: '20 000 festivaliers (indoor)' },
  'Electric Castle':               { attendees: 200000, label: '200 000 festivaliers sur 5 jours' },
  'Qlimax':                        { attendees: 25000,  label: '25 000 festivaliers (indoor)' },
  'Epizode Festival':              { attendees: 5000,   label: '~5 000 festivaliers' },
  'Elrow Festival':                { attendees: 10000,  label: '~10 000 par édition' },
  'Tomorrowland Brasil':           { attendees: 180000, label: '180 000 festivaliers' },
  'Ultra Europe':                  { attendees: 150000, label: '150 000 festivaliers' },
  'Glastonbury Festival':          { attendees: 210000, label: '210 000 festivaliers' },
  'Kappa FuturFestival':           { attendees: 20000,  label: '20 000 festivaliers' },
  'World Club Dome':               { attendees: 30000,  label: '30 000 festivaliers (par nuit)' },
  'Coachella Valley Music & Arts Festival': { attendees: 250000, label: '250 000 festivaliers sur 2 weekends' },
  'Sunburn Festival':              { attendees: 300000, label: '300 000 festivaliers' },
  'AMF (Amsterdam Music Festival)': { attendees: 40000, label: '40 000 festivaliers' },
  'Parookaville':                  { attendees: 80000,  label: '80 000 festivaliers' },
  'Parklife':                      { attendees: 80000,  label: '80 000 festivaliers' },
  'Sziget Festival':               { attendees: 450000, label: '450 000 festivaliers sur 7 jours' },
  'Balaton Sound':                 { attendees: 200000, label: '200 000 festivaliers' },
  'Monegros Desert Festival':      { attendees: 30000,  label: '30 000 festivaliers' },
  'Neversea Festival':             { attendees: 200000, label: '200 000 festivaliers' },
  'Boomtown':                      { attendees: 60000,  label: '60 000 festivaliers' },
  'Lollapalooza':                  { attendees: 400000, label: '400 000 festivaliers sur 4 jours' },
  'Electric Love':                 { attendees: 50000,  label: '50 000 festivaliers' },
  'EDC Orlando':                   { attendees: 180000, label: '180 000 festivaliers' },
  'Sonus Festival':                { attendees: 12000,  label: '12 000 festivaliers' },
  '808 Festival':                  { attendees: 100000, label: '100 000 festivaliers' },
  'Veld Music Festival':           { attendees: 60000,  label: '60 000 festivaliers' },
  'Bonnaroo Music & Arts Festival':{ attendees: 80000,  label: '80 000 festivaliers' },
  'Lovefest':                      { attendees: 40000,  label: '40 000 festivaliers' },
  'Terminal V':                    { attendees: 15000,  label: '15 000 festivaliers' },
  'Arc Music Festival':            { attendees: 20000,  label: '20 000 festivaliers' },
  'Les Plages Electroniques':      { attendees: 100000, label: '100 000 festivaliers sur 3 jours' },
  'Burning Man':                   { attendees: 80000,  label: '~80 000 participants' },
  'Airbeat One':                   { attendees: 70000,  label: '70 000 festivaliers' },
  'EDC Mexico':                    { attendees: 220000, label: '220 000 festivaliers' },
  'Nameless Festival':             { attendees: 40000,  label: '40 000 festivaliers' },
  'Electric Love':                 { attendees: 50000,  label: '50 000 festivaliers' },

  // Clubs (capacité max par soirée)
  'Fabric':              { attendees: 2500,  label: 'Capacité : 2 500 personnes' },
  'Berghain':            { attendees: 1500,  label: 'Capacité : ~1 500 personnes' },
  'DC-10':               { attendees: 2000,  label: 'Capacité : ~2 000 personnes' },
  'Amnesia':             { attendees: 5000,  label: 'Capacité : 5 000 personnes' },
  'Hï':                  { attendees: 5000,  label: 'Capacité : 5 000 personnes' },
  'Avant Gardner':       { attendees: 5000,  label: 'Capacité : 5 000 personnes' },
  'Drumsheds':           { attendees: 7000,  label: 'Capacité : 7 000 personnes' },
  'XOYO':                { attendees: 800,   label: 'Capacité : 800 personnes' },
  'Watergate':           { attendees: 600,   label: 'Capacité : 600 personnes' },
  'Womb':                { attendees: 1000,  label: 'Capacité : 1 000 personnes' },
  'Club der Visionaere': { attendees: 800,   label: 'Capacité : ~800 personnes' },
  'Shelter':             { attendees: 700,   label: 'Capacité : 700 personnes' },
  'Sub Club':            { attendees: 400,   label: 'Capacité : 400 personnes' },
  'Egg':                 { attendees: 1200,  label: 'Capacité : 1 200 personnes' },
  'Input':               { attendees: 1000,  label: 'Capacité : 1 000 personnes' },
  'Exchange':            { attendees: 1500,  label: 'Capacité : 1 500 personnes' },
  'Social Club':         { attendees: 600,   label: 'Capacité : 600 personnes' },
  'Studio 338':          { attendees: 3000,  label: 'Capacité : 3 000 personnes' },
  'Suicide Circus':      { attendees: 1500,  label: 'Capacité : 1 500 personnes' },
  'Oval Space':          { attendees: 1000,  label: 'Capacité : 1 000 personnes' },
  'La Machine du Moulin Rouge': { attendees: 600, label: 'Capacité : 600 personnes' },
  'Green Valley':        { attendees: 8000,  label: 'Capacité : 8 000 personnes' },
  'Echostage':           { attendees: 3000,  label: 'Capacité : 3 000 personnes' },
  'Ushuaïa':             { attendees: 10000, label: 'Capacité : 10 000 personnes' },
  'Bootshaus':           { attendees: 3000,  label: 'Capacité : 3 000 personnes' },
  'Savaya':              { attendees: 2000,  label: 'Capacité : 2 000 personnes' },
  'Laroc Club':          { attendees: 10000, label: 'Capacité : 10 000 personnes' },
  'Illuzion':            { attendees: 3000,  label: 'Capacité : 3 000 personnes' },
  'Noa Beach Club':      { attendees: 2500,  label: 'Capacité : 2 500 personnes' },
  'Papaya Club':         { attendees: 2000,  label: 'Capacité : 2 000 personnes' },
  'FABRIK':              { attendees: 5000,  label: 'Capacité : 5 000 personnes' },
  'Opium':               { attendees: 2000,  label: 'Capacité : 2 000 personnes' },
  'Eden':                { attendees: 4000,  label: 'Capacité : 4 000 personnes' },
  'Elsewhere':           { attendees: 1500,  label: 'Capacité : 1 500 personnes' },
  'Tenax Club':          { attendees: 1200,  label: 'Capacité : 1 200 personnes' },
  'Il Muretto':          { attendees: 3000,  label: 'Capacité : 3 000 personnes' },
  'Sub Club':            { attendees: 400,   label: 'Capacité : 400 personnes' },
  'D-Edge':              { attendees: 1000,  label: 'Capacité : 1 000 personnes' },
  'Warung Beach Club':   { attendees: 3000,  label: 'Capacité : 3 000 personnes' },
  'Paradise Club':       { attendees: 2000,  label: 'Capacité : 2 000 personnes' },
  'Zouk':                { attendees: 5000,  label: 'Capacité : 5 000 personnes' },
  'Marquee':             { attendees: 4000,  label: 'Capacité : 4 000 personnes' },
  'Badaboum':            { attendees: 500,   label: 'Capacité : 500 personnes' },
  'Djoon':               { attendees: 300,   label: 'Capacité : 300 personnes' },
  'Nitsa':               { attendees: 1500,  label: 'Capacité : 1 500 personnes' },
  'E1':                  { attendees: 1500,  label: 'Capacité : 1 500 personnes' },
  'Phonox':              { attendees: 600,   label: 'Capacité : 600 personnes' },
  'Kater Blau':          { attendees: 1500,  label: 'Capacité : 1 500 personnes' },
  'Sisyphos':            { attendees: 3000,  label: 'Capacité : 3 000 personnes' },
  'Robert Johnson':      { attendees: 400,   label: 'Capacité : 400 personnes' },
  'Village Underground': { attendees: 700,   label: 'Capacité : 700 personnes' },
  'Kunsthaus Tacheles':  { attendees: 2000,  label: 'Capacité : ~2 000 personnes' },
};

const delay = ms => new Promise(r => setTimeout(r, ms));

/**
 * Cherche dans Wikipedia l'infobox d'un article et extrait
 * le nombre de participants si disponible.
 */
function fetchFromWikipedia(name) {
  return new Promise((resolve) => {
    const query = encodeURIComponent(name);
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${query}`;

    https.get(url, { headers: { 'User-Agent': 'DropsidersBot/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          // On cherche des chiffres dans l'extrait
          const text = json.extract || '';
          const match = text.match(/(\d[\d,\.]+)\s*(attendees|visitors|people|persons|capacity|participants)/i);
          if (match) {
            const num = parseInt(match[1].replace(/[,\.]/g, ''));
            resolve({ attendees: num, label: `~${num.toLocaleString('fr-FR')} personnes (Wikipedia)` });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function enrichFile(filePath, type) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  let updated = 0;

  console.log(`\n📂 ${type.toUpperCase()} — ${data.length} entrées`);

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    // Déjà enrichi, on saute
    if (item.attendees) {
      console.log(`[${i+1}/${data.length}] ✓ ${item.name} (déjà présent: ${item.attendees_label || item.attendees})`);
      continue;
    }

    // 1. Base connue en dur
    const known = KNOWN_ATTENDEES[item.name];
    if (known) {
      item.attendees       = known.attendees;
      item.attendees_label = known.label;
      console.log(`[${i+1}/${data.length}] ✓ ${item.name} → ${known.label} (base locale)`);
      updated++;
      continue;
    }

    // 2. Tentative Wikipedia
    console.log(`[${i+1}/${data.length}] 🌐 ${item.name} — Wikipedia...`);
    const wiki = await fetchFromWikipedia(item.name);
    if (wiki) {
      item.attendees       = wiki.attendees;
      item.attendees_label = wiki.label;
      console.log(`   → ${wiki.label}`);
      updated++;
    } else {
      // Valeur générique selon le type
      if (type === 'festival') {
        item.attendees       = 50000;
        item.attendees_label = '~50 000 festivaliers';
      } else {
        item.attendees       = 1000;
        item.attendees_label = 'Capacité : ~1 000 personnes';
      }
      console.log(`   → Non trouvé, valeur par défaut`);
    }

    await delay(200);
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ ${updated} entrées mises à jour`);
}

(async () => {
  await enrichFile(festivalsPath, 'festival');
  await enrichFile(clubsPath, 'club');
  console.log('\n🎉 Terminé !');
})();
