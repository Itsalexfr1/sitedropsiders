const fs = require('fs');
const path = require('path');

const agendaPath = path.join(__dirname, 'src/data/agenda.json');
const agenda = JSON.parse(fs.readFileSync(agendaPath, 'utf8'));

const genres = {
    'ANTS': 'Tech House',
    'Calvin Harris': 'Big Room',
    'Carl Cox': 'Techno',
    'David Guetta': 'Big Room',
    'elrow': 'Tech House',
    'Experts Only': 'Tech House',
    'FISHER': 'Tech House',
    'John Summit': 'Tech House',
    'Martin Garrix': 'Big Room',
    'Paradise: Starship Eden': 'House',
    'Swedish House Mafia': 'Big Room',
    'Tomorrowland pres. Dimitri Vegas & Like Mike': 'Big Room',
    'Tomorrowland': 'Big Room',
    'Ultra Music Festival': 'Big Room',
    'EDC Las Vegas': 'Big Room',
    'EDC Week': 'Big Room',
    'Awakenings': 'Techno',
    'Coachella': 'Multi-Genre',
    'Cercle': 'Melodic Techno',
    'Cercle Festival': 'Melodic Techno',
    'Dour Festival': 'Multi-Genre',
    'Les DÃ©ferlantes': 'Multi-Genre',
    'Opening Party': 'Multi-Genre',
    'Opening 2026': 'Multi-Genre',
    'Defqon.1': 'HardMusic',
    'Masters of Hardcore': 'HardMusic',
    'Thunderdome': 'HardMusic'
};

const updatedAgenda = agenda.map(event => {
    let genre = '';
    const title = event.title;
    for (const [key, value] of Object.entries(genres)) {
        if (title.includes(key)) {
            genre = value;
            break;
        }
    }
    if (!genre) genre = 'Multi-Genre'; // Default for any remaining
    return { ...event, genre };
});

fs.writeFileSync(agendaPath, JSON.stringify(updatedAgenda, null, 4));
console.log('Agenda updated with genres!');
