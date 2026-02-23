
const fs = require('fs');
const path = require('path');

// CONFIGURATION
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'djnvjsmvr';
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'dropsiders_unsigned';

const DATA_DIR = path.join(__dirname, '../src/data');
const FILES_TO_SCAN = ['news.json', 'recaps.json', 'agenda.json', 'galerie.json'];

// Domains we want to "secure" by moving to Cloudinary
const DOMAINS_TO_MIGRATE = [
    'fbcdn.net',
    'scontent',
    'facebook.com',
    'instagram.com',
    'twitter.com',
    'pbs.twimg.com',
    'googleusercontent.com',
    'blob.core.windows.net'
];

async function uploadUrlToCloudinary(imageUrl, fileName) {
    try {
        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

        const formData = new FormData();
        formData.append('file', imageUrl);
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('folder', `dropsiders/external/${fileName.replace('.json', '')}`);

        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.secure_url) {
            return data.secure_url;
        }
        throw new Error(data.error?.message || 'Unknown error');
    } catch (err) {
        console.error(`  ❌ Failed to migrate URL ${imageUrl}:`, err.message);
        return null;
    }
}

async function migrateExternalLinks(fileName) {
    const filePath = path.join(DATA_DIR, fileName);
    if (!fs.existsSync(filePath)) return;

    console.log(`\n📄 scanning ${fileName} for external links...`);
    let content = fs.readFileSync(filePath, 'utf8');
    let data = JSON.parse(content);
    let changed = false;
    let migrateCount = 0;

    const processObject = async (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                const val = obj[key].trim();

                // If it's a URL
                if (val.startsWith('http')) {
                    const isTargetDomain = DOMAINS_TO_MIGRATE.some(domain => val.includes(domain));
                    const isAlreadyCloudinary = val.includes('res.cloudinary.com');

                    if (isTargetDomain && !isAlreadyCloudinary) {
                        console.log(`  🔗 Migrating external link: ${val.substring(0, 60)}...`);
                        const cloudinaryUrl = await uploadUrlToCloudinary(val, fileName);
                        if (cloudinaryUrl) {
                            obj[key] = cloudinaryUrl;
                            changed = true;
                            migrateCount++;
                            // Simple progress indicator
                            if (migrateCount % 5 === 0) process.stdout.write('*');
                        }
                    }
                }
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                await processObject(obj[key]);
            }
        }
    };

    await processObject(data);

    if (changed) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`\n  ✅ Updated ${fileName} (${migrateCount} external links migrated)`);
    } else {
        console.log(`  ℹ️ No insecure external links found in ${fileName}`);
    }
}

async function run() {
    console.log('\n🚀 Starting External Image Migration (Facebook, Instagram, etc. -> Cloudinary)...');
    for (const file of FILES_TO_SCAN) {
        await migrateExternalLinks(file);
    }
    console.log('\n✨ External Migration Complete!');
}

run().catch(err => console.error('FAILED:', err));
