
const fs = require('fs');

try {
    const content = fs.readFileSync('recaps_page_ascii.html', 'utf16le');

    console.log('File length:', content.length);
    console.log('First 100 chars:', content.substring(0, 100));

    // Search for 'page='
    const pageMatches = content.match(/href="[^"]*page=[^"]*"/g);
    if (pageMatches) {
        console.log('Found page links:');
        pageMatches.forEach(m => console.log(m));
    } else {
        console.log('No "page=" links found.');
    }

    // Search for Recaps links
    const recapMatches = content.match(/href="\/recaps\/[^"]+"/g);
    if (recapMatches) {
        console.log('Found recap links:', recapMatches.length);
        // Print first few
        recapMatches.slice(0, 5).forEach(m => console.log(m));
    } else {
        console.log('No recap links found.');
    }
} catch (err) {
    console.error(err);
}
