import fs from 'fs';

const djsPath = 'c:/Users/alexf/Documents/Site Dropsiders V2/src/data/wiki_djs.json';

try {
    const data = JSON.parse(fs.readFileSync(djsPath, 'utf8'));
    const updated = data.map(item => ({
        ...item,
        status: 'waiting'
    }));
    
    fs.writeFileSync(djsPath, JSON.stringify(updated, null, 2), 'utf8');
    console.log(`Successfully updated ${updated.length} DJs to 'waiting' status.`);
} catch (error) {
    console.error('Error updating DJs:', error);
}
