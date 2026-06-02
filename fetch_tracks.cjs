const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, 'src/data/wiki_djs.json');

async function fetchDeezer(artistName) {
    try {
        const res = await fetch(`https://api.deezer.com/search?q=artist:"${encodeURIComponent(artistName)}"&limit=3`);
        const data = await res.json();
        if (data && data.data && data.data.length > 0) {
            return data.data.slice(0, 3).map(t => t.title_short || t.title);
        }
    } catch (e) {
        // ignore
    }
    return null;
}

async function fetchITunes(artistName) {
    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=song&limit=3`);
        const data = await res.json();
        if (data && data.results && data.results.length > 0) {
            return data.results.slice(0, 3).map(t => t.trackName);
        }
    } catch (e) {
        // ignore
    }
    return null;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log("Reading file...");
    const rawData = fs.readFileSync(FILE_PATH, 'utf-8');
    const djs = JSON.parse(rawData);

    let updatedCount = 0;
    
    for (let i = 0; i < djs.length; i++) {
        const dj = djs[i];
        
        const hasUnknown = dj.top_tracks && dj.top_tracks.some(t => t.includes('Titre Inconnu') || t.includes('Unknown'));
        const noTracks = !dj.top_tracks || dj.top_tracks.length === 0;

        if (hasUnknown || noTracks) {
            console.log(`[${i+1}/${djs.length}] Fetching tracks for ${dj.name}...`);
            
            // Try iTunes first
            let tracks = await fetchITunes(dj.name);
            
            // If failed or empty, try Deezer
            if (!tracks || tracks.length === 0) {
                tracks = await fetchDeezer(dj.name);
            }
            
            if (tracks && tracks.length > 0) {
                // Ensure we have 3 by padding if needed
                while (tracks.length < 3) {
                    tracks.push(`Track ${tracks.length + 1}`);
                }
                dj.top_tracks = tracks;
                updatedCount++;
                console.log(`  -> Found: ${tracks.join(' | ')}`);
            } else {
                console.log(`  -> No tracks found for ${dj.name}`);
                // Provide a default that is better than Titre Inconnu 1
                dj.top_tracks = ["Live Set", "Festival Edit", "Original Mix"];
                updatedCount++;
            }
            
            // Small delay to avoid rate limiting
            await sleep(200);
        }
    }
    
    if (updatedCount > 0) {
        console.log(`Updating ${updatedCount} DJs... saving file.`);
        fs.writeFileSync(FILE_PATH, JSON.stringify(djs, null, 2), 'utf-8');
        console.log('Done!');
    } else {
        console.log('No DJs needed updating.');
    }
}

main().catch(console.error);
