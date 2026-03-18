const fs = require('fs');
const cp = require('child_process');

const filePath = 'c:\\Users\\alexf\\Documents\\Site Dropsiders V2\\src\\data\\wiki_djs.json';
const djs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

console.log(`Found ${djs.length} DJs.`);

// Get a map of ID -> latest upload image from git history
const commits = cp.execSync('git log --grep="Update photo" --pretty=format:%H src/data/wiki_djs.json', { encoding: 'utf-8' }).split('\n').filter(Boolean);

console.log(`Searching through ${commits.length} manual update commits...`);

const updateMap = new Map(); // ID -> latest URL

for (const commit of commits) {
    const diff = cp.execSync(`git show ${commit} src/data/wiki_djs.json`, { encoding: 'utf-8' });
    const hunks = diff.split('@@');
    for (const hunk of hunks) {
        if (hunk.includes('/uploads/')) {
            const idMatch = hunk.match(/\"id\": \"(\d+)\"/);
            const imgMatch = hunk.match(/\+    \"image\": \"(\/uploads\/[^\"]+)\"/);
            if (idMatch && imgMatch) {
                const cid = idMatch[1];
                const img = imgMatch[1];
                if (!updateMap.has(cid)) {
                    updateMap.set(cid, img);
                    console.log(`Found previous upload for DJ ID ${cid}: ${img}`);
                }
            }
        }
    }
}

let restored = 0;
for (const dj of djs) {
    if (updateMap.has(dj.id)) {
        if (!dj.image.includes('/uploads/')) {
            console.log(`Restoring ${dj.name} (ID ${dj.id}): ${updateMap.get(dj.id)}`);
            dj.image = updateMap.get(dj.id);
            if (dj.status === 'waiting') {
                delete dj.status;
                console.log(`  -> Marked as published.`);
            }
            restored++;
        }
    }
}

if (restored > 0) {
    fs.writeFileSync(filePath, JSON.stringify(djs, null, 2), 'utf-8');
    console.log(`Successfully restored ${restored} DJ photos.`);
} else {
    console.log('No DJ photos needed restoring.');
}
