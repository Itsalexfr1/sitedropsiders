const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/data/agenda.json');
let content = fs.readFileSync(filePath, 'utf8');

// Step 1: Replace the long prefix with the basic distal character Ã
const prefix = "ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â";
content = content.split(prefix).join("Ã");

// Step 2: Handle some other variations if they exist
const prefix2 = "ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ"; // for œ
content = content.split(prefix2).join("œ");

// Step 3: Now we have things like Ã©, Ã§, Ãà, etc. 
// We can use the Buffer trick to decode them in one go.
try {
    const buf = Buffer.from(content, 'binary');
    content = buf.toString('utf8');
} catch (e) {
    console.log('Buffer conversion failed, falling back to manual');
    const manual = {
        'Ã©': 'é', 'Ã§': 'ç', 'Ã ': 'à', 'Ã¢': 'â', 'Ãª': 'ê', 'Ã¨': 'è', 'Ã®': 'î', 'Ã¯': 'ï', 'Ã´': 'ô', 'Ã»': 'û', 'Ã¹': 'ù',
        'Ã‰': 'É', 'Ã€': 'À', 'Ãˆ': 'È', 'Ã‡': 'Ç'
    };
    for (let k in manual) {
        content = content.split(k).join(manual[k]);
    }
}

// Final check for some weird ones
content = content.replace(/Ã /g, 'à')
    .replace(/Ã /g, 'à ')
    .replace(/â€™/g, "'")
    .replace(/â€¦/g, "…")
    .replace(/à‚Â/g, ""); // leftover artifacts

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed agenda.json characters with prefix reduction.');
