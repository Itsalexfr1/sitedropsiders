const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/data/agenda.json');
let content = fs.readFileSync(filePath, 'utf8');

const mapping = {
    "ÃƒÆ’Ã†šÃƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©": "é",
    "ÃƒÆ’Ã†šÃƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®": "î",
    "ÃƒÆ’Ã†šÃƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âª": "ê",
    "ÃƒÆ’Ã†šÃƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨": "è",
    "ÃƒÆ’Ã†šÃƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´": "ô",
    "ÃƒÆ’Ã†šÃƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§": "ç",
    "ÃƒÆ’Ã†šÃƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ": "à",
    "ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒ…Ã¢â‚¬Å“": "œur",
    "ÃƒÆ’Ã†š": "", // Cleanup any leftover prefixes
    "Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â": "" // Cleanup any leftover suffixes
};

for (const [bad, good] of Object.entries(mapping)) {
    content = content.split(bad).join(good);
}

// Second level Moibake (simpler ones)
const mapping2 = {
    "Ã©": "é",
    "Ã®": "î",
    "Ãª": "ê",
    "Ã¨": "è",
    "Ã´": "ô",
    "Ã§": "ç",
    "Ã ": "à",
    "Ã ": "à ",
    "â€™": "'",
    "â€¦": "…"
};

for (const [bad, good] of Object.entries(mapping2)) {
    content = content.split(bad).join(good);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed agenda.json characters using EXACT sequence mapping.');
