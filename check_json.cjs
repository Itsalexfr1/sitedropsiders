const fs = require('fs');
const dir = 'src/data';
fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.json')) {
        try {
            JSON.parse(fs.readFileSync(dir + '/' + file, 'utf8'));
            console.log(file + ' is OK');
        } catch (e) {
            console.error('ERROR IN ' + file + ':', e.message);
        }
    }
});
