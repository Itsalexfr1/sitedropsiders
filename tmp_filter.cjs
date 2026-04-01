const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\alexf\\.gemini\\antigravity\\brain\\0d520b2a-ed5e-4f59-820e-80d5fbe6acb2\\.system_generated\\steps\\1150\\content.md', 'utf8');

const jsonStartIndex = content.indexOf('[');
const jsonContent = content.substring(jsonStartIndex);

try {
    const airports = JSON.parse(jsonContent);
    const filtered = airports
        .filter(a => a.iata && (a.size === 'large' || a.size === 'medium'))
        .map(a => {
            let name = (a.name && a.name !== 'Unknown Airport') ? a.name : a.iata;
            let city = (a.city && a.city !== 'Unknown City') ? a.city : (name.split(' Airport')[0].split(' /')[0]);
            
            return {
                iata: a.iata,
                name: name,
                city: city,
                country: a.iso || 'UN'
            };
        });
    
    if (!fs.existsSync('c:/Users/alexf/Documents/Site Dropsiders V2/src/data')) {
        fs.mkdirSync('c:/Users/alexf/Documents/Site Dropsiders V2/src/data', { recursive: true });
    }
    
    fs.writeFileSync('c:/Users/alexf/Documents/Site Dropsiders V2/src/data/airports.json', JSON.stringify(filtered));
    console.log(`Success: Saved ${filtered.length} airports to src/data/airports.json`);
} catch (e) {
    console.error('Failed to parse or filter JSON', e);
}
