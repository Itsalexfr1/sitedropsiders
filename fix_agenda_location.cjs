const fs = require('fs');

const path = 'src/data/agenda.json';
let data = JSON.parse(fs.readFileSync(path, 'utf8'));

let modified = 0;

data.forEach(item => {
    if (item.location) {
        let parts = item.location.split(',').map(s => s.trim());
        let venue = item.venue || '';
        let city = item.location;
        let country = item.country || '';

        if (parts.length === 3) {
            venue = venue || parts[0];
            city = parts[1];
            country = country || parts[2];
        } else if (parts.length === 2) {
            city = parts[0];
            country = country || parts[1];
        }

        // Always clean up `country` empty values from Agenda form empty defaults "" if the split found it

        if (!item.venue && venue) item.venue = venue;
        if (item.location !== city) {
            item.location = city;
        }
        if (country) {
            item.country = country;
        }
        modified++;
    }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
console.log(`Updated ${modified} items successfully.`);
