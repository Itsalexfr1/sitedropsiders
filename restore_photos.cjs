const fs = require('fs');
const cp = require('child_process');

const filePath = 'c:\\Users\\alexf\\Documents\\Site Dropsiders V2\\src\\data\\wiki_clubs.json';
const clubs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

console.log(`Found ${clubs.length} clubs.`);

// Get a map of ID -> latest upload image from git history
// We use git log --grep="Update photo" to find the commits
const commits = cp.execSync('git log --grep="Update photo" --pretty=format:%H src/data/wiki_clubs.json', { encoding: 'utf-8' }).split('\n').filter(Boolean);

console.log(`Searching through ${commits.length} manual update commits...`);

const updateMap = new Map(); // ID -> latest URL

for (const commit of commits) {
    const diff = cp.execSync(`git show ${commit} src/data/wiki_clubs.json`, { encoding: 'utf-8' });
    
    // Look for +    "image": "/uploads/..." and find context ID
    // We split by hunk header @@
    const hunks = diff.split('@@');
    for (const hunk of hunks) {
        if (hunk.includes('/uploads/')) {
            // Find ID in the hunk context
            const idMatch = hunk.match(/\"id\": \"(\d+|c\d+)\"/);
            const imgMatch = hunk.match(/\+    \"image\": \"(\/uploads\/[^\"]+)\"/);
            
            if (idMatch && imgMatch) {
                const cid = idMatch[1];
                const img = imgMatch[1];
                if (!updateMap.has(cid)) {
                    updateMap.set(cid, img);
                    console.log(`Found previous upload for ID ${cid}: ${img}`);
                }
            }
        }
    }
}

console.log(`Total manual updates discovered: ${updateMap.size}`);

let restored = 0;
for (const club of clubs) {
    if (updateMap.has(club.id)) {
        // If current image is an RA link or missing /uploads/, restore it
        if (!club.image.includes('/uploads/')) {
            console.log(`Restoring ${club.name} (ID ${club.id}): ${updateMap.get(club.id)}`);
            club.image = updateMap.get(club.id);
            if (club.status === 'waiting') {
                delete club.status;
                console.log(`  -> Marked as published.`);
            }
            restored++;
        }
    }
}

if (restored > 0) {
    fs.writeFileSync(filePath, JSON.stringify(clubs, null, 2), 'utf-8');
    console.log(`Successfully restored ${restored} club photos.`);
} else {
    console.log('No club photos needed restoring.');
}
