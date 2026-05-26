const fs = require('fs');
const path = require('path');
const https = require('https');

const djsFilePath = path.join(__dirname, '../src/data/wiki_djs.json');
let djsData = [];

try {
    const rawData = fs.readFileSync(djsFilePath, 'utf8');
    djsData = JSON.parse(rawData);
} catch (error) {
    console.error("Erreur lors de la lecture de wiki_djs.json:", error);
    process.exit(1);
}

// Fonction pour faire une requête HTTP (iTunes API)
function fetchTopTracks(artistName) {
    return new Promise((resolve, reject) => {
        // Encodage de l'URL pour gérer les espaces et caractères spéciaux
        const query = encodeURIComponent(artistName);
        const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=3`;
        
        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    if (parsedData.results && parsedData.results.length > 0) {
                        // Récupère uniquement le nom des musiques
                        const tracks = parsedData.results.map(track => track.trackName);
                        resolve(tracks);
                    } else {
                        resolve([]); // Aucun résultat trouvé
                    }
                } catch (e) {
                    resolve([]); // Erreur de parsing
                }
            });
        }).on('error', (err) => {
            resolve([]); // Ignorer les erreurs réseau pour ne pas bloquer le script
        });
    });
}

// Fonction utilitaire pour éviter de spammer l'API
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function updateAllDjs() {
    console.log(`Début de la mise à jour pour ${djsData.length} DJs via iTunes Music...`);
    let updatedCount = 0;

    for (let i = 0; i < djsData.length; i++) {
        const dj = djsData[i];
        
        // Si on a déjà les top tracks, on peut sauter (ou forcer la mise à jour)
        if (!dj.top_tracks || dj.top_tracks.length === 0) {
            console.log(`[${i+1}/${djsData.length}] Recherche pour: ${dj.name}...`);
            const tracks = await fetchTopTracks(dj.name);
            
            if (tracks.length > 0) {
                dj.top_tracks = tracks;
                console.log(`   -> Trouvé: ${tracks.join(', ')}`);
                updatedCount++;
            } else {
                console.log(`   -> Aucun titre trouvé.`);
                dj.top_tracks = ["Titre Inconnu 1", "Titre Inconnu 2", "Titre Inconnu 3"];
            }
            
            // Attendre un peu pour ne pas surcharger l'API d'Apple (Rate Limit)
            await delay(300);
        } else {
            console.log(`[${i+1}/${djsData.length}] Top tracks déjà existantes pour: ${dj.name}`);
        }
    }

    // Sauvegarder le fichier mis à jour
    fs.writeFileSync(djsFilePath, JSON.stringify(djsData, null, 2), 'utf8');
    console.log(`Terminé ! ${updatedCount} DJs ont été mis à jour avec leurs titres les plus écoutés.`);
}

updateAllDjs();
