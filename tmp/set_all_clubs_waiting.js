import fs from 'fs';

const clubsPath = 'c:/Users/alexf/Documents/Site Dropsiders V2/src/data/wiki_clubs.json';

try {
    const data = JSON.parse(fs.readFileSync(clubsPath, 'utf8'));
    const updated = data.map(item => ({
        ...item,
        status: 'waiting'
    }));
    
    fs.writeFileSync(clubsPath, JSON.stringify(updated, null, 2), 'utf8');
    console.log(`Successfully updated ${updated.length} clubs to 'waiting' status.`);
} catch (error) {
    console.error('Error updating clubs:', error);
}
