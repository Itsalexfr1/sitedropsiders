const fs = require('fs');

let file = fs.readFileSync('src/pages/TakeoverPage.tsx', 'utf-8');

file = file.replace(
    /<\/div>\r?\n\s*<\/div>\r?\n\s*<\/div>\r?\n\s*<\/div>\r?\n\) : adminActiveTab === 'shazam' \? \(/,
    '                                            </div>\n                                        ) : adminActiveTab === \'shazam\' ? ('
);

fs.writeFileSync('src/pages/TakeoverPage.tsx', file);
console.log('Fixed syntax error via JS replace string.');
