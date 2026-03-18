const fs = require('fs');
const cp = require('child_process');

const filePath = 'c:\\Users\\alexf\\Documents\\Site Dropsiders V2\\src\\data\\wiki_festivals.json';
const fests = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

console.log(`Found ${fests.length} Festivals.`);

const commits = cp.execSync('git log --grep="Update photo" --pretty=format:%H src/data/wiki_festivals.json', { encoding: 'utf-8' }).split('\n').filter(Boolean);

console.log(`Searching through ${commits.length} manual update commits...`);

const updateMap = new Map();

for (const commit of commits) {
    const diff = cp.execSync(`git show ${commit} src/data/wiki_festivals.json`, { encoding: 'utf-8' });
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
                    console.log(`Found previous upload for Festival ID ${cid}: ${img}`);
                }
            }
        }
    }
}

let restored = 0;
for (const fest of fests) {
    if (updateMap.has(fest.id)) {
        if (!fest.image.includes('/uploads/')) {
            console.log(`Restoring ${fest.name} (ID ${fest.id}): ${updateMap.get(fest.id)}`);
            fest.image = updateMap.get(fest.id);
            if (fest.status === 'waiting') {
                delete fest.status;
            }
            restored++;
        }
    }
}

if (restored > 0) {
    fs.writeFileSync(filePath, JSON.stringify(fests, null, 2), 'utf-8');
    console.log(`Successfully restored ${restored} Festival photos.`);
} else {
    console.log('No Festival photos needed restoring.');
}
