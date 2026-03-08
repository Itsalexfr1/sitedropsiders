const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STATE_FILE = 'migration_state_v2.json';
const ASSETS_DIR = 'migration_assets';

async function rescue() {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const missing = Object.entries(state).filter(([k, v]) => v === null);

    console.log(`Starting rescue for ${missing.length} URLs...`);

    for (const [url, _] of missing) {
        try {
            console.log(`Trying: ${url}`);
            const uploadIndex = url.indexOf('/upload/');
            if (uploadIndex === -1) continue;

            const afterUpload = url.substring(uploadIndex + 8);
            const publicPath = afterUpload.replace(/^v\d+\//, '');
            const cleanPath = publicPath.split('?')[0];

            const localName = cleanPath.replace(/\//g, '_');
            const localPath = path.join(ASSETS_DIR, localName);

            // Download using curl
            try {
                execSync(`curl -s -L -o "${localPath}" "${url}"`);
            } catch (e) {
                console.log(`  Download failed: ${e.message}`);
                continue;
            }

            if (!fs.existsSync(localPath)) {
                console.log('  Failed: File not downloaded');
                continue;
            }

            const stats = fs.statSync(localPath);
            if (stats.size < 1000) {
                console.log('  Failed: 404 or empty file');
                fs.unlinkSync(localPath);
                continue;
            }

            console.log('  Downloaded! Uploading to R2...');
            const r2Key = `migrated/${cleanPath}`;
            const putCmd = `npx wrangler r2 object put "dropsiders-assets/${r2Key}" --file "${localPath}" --remote`;

            try {
                execSync(putCmd);
                state[url] = `https://dropsiders.fr/uploads/${r2Key}`;
                console.log('  Success!');
            } catch (e) {
                console.log(`  Upload failed: ${e.message}`);
            }

        } catch (e) {
            console.log(`  Error processing URL: ${e.message}`);
        }
    }

    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log('Rescue scan complete.');
}

rescue().catch(console.error);
