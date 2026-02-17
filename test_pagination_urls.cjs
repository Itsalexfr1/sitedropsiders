
const https = require('https');

function checkUrl(path) {
    const url = `https://www.dropsiders.eu${path}`;
    console.log(`Checking ${url}...`);
    https.get(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            // Check if JSON or HTML.
            // Also check length.
            console.log(`${path}: status=${res.statusCode}, length=${data.length}, isJson=${data.trim().startsWith('{')}`);
        });
    }).on('error', (e) => {
        console.error(`${path}: error=${e.message}`);
    });
}

// Try standard pagination
checkUrl('/recaps?page=2');
// Try AJAX or layout
checkUrl('/recaps?ajax=1&page=2');
checkUrl('/recaps?layout=list&page=2');
