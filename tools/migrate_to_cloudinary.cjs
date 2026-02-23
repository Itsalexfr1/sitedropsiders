
const fs = require('fs');
const path = require('path');

// CONFIGURATION
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'djnvjsmvr';
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'dropsiders_unsigned';

const DATA_DIR = path.join(__dirname, '../src/data');
const PUBLIC_DIR = path.join(__dirname, '../public');
const FILES_TO_SCAN = ['news.json', 'recaps.json', 'agenda.json', 'galerie.json', 'shop.json'];

async function uploadToCloudinary(filePath, localPath) {
    try {
        if (!fs.existsSync(filePath)) {
            // console.error(`  ⚠️  File missing locally: ${filePath}`);
            return null;
        }
        const fileContent = fs.readFileSync(filePath, { encoding: 'base64' });
        const ext = path.extname(filePath).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        const base64 = `data:${mimeType};base64,${fileContent}`;

        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

        // Clean folder path from local path
        // e.g. /assets/galeries/foo/img.jpg -> dropsiders/assets/galeries/foo
        const folderPath = path.dirname(localPath).replace(/^\//, '').replace(/\\/g, '/');

        const formData = new FormData();
        formData.append('file', base64);
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('folder', `dropsiders/${folderPath}`);
        // Clean filename (basename) to avoid Cloudinary display name errors
        const fileName = path.basename(filePath, ext);
        formData.append('public_id', fileName);

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
        console.error(`  ❌ Failed to upload ${filePath}:`, err.message);
        return null;
    }
}

async function migrateFile(fileName) {
    const filePath = path.join(DATA_DIR, fileName);
    if (!fs.existsSync(filePath)) return;

    console.log(`\n📄 Scanning ${fileName}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    let data = JSON.parse(content);
    let changed = false;
    let uploadCount = 0;

    const processObject = async (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                const val = obj[key].trim();
                // Check if it's a local path (starts with / and has image extension)
                if (val.startsWith('/') && (val.toLowerCase().endsWith('.jpg') || val.toLowerCase().endsWith('.jpeg') || val.toLowerCase().endsWith('.png') || val.toLowerCase().endsWith('.webp'))) {
                    // console.log(`  📤 Uploading ${val}...`);
                    const localFile = path.join(PUBLIC_DIR, val);
                    const cloudinaryUrl = await uploadToCloudinary(localFile, val);
                    if (cloudinaryUrl) {
                        obj[key] = cloudinaryUrl;
                        changed = true;
                        uploadCount++;
                        if (uploadCount % 10 === 0) process.stdout.write('.');
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
        console.log(`\n  ✅ Updated ${fileName} (${uploadCount} images uploaded)`);
    } else {
        console.log(`  ℹ️ No local images found in ${fileName}`);
    }
}

async function run() {
    console.log('\n🚀 Starting BROAD Migration to Cloudinary (Catching all local links)...');
    for (const file of FILES_TO_SCAN) {
        await migrateFile(file);
    }
    console.log('\n✨ Migration Complete!');
    console.log('⚠️  Note: Local files are still in /public. Delete them once you verify the site works.');
}

run().catch(err => console.error('FAILED:', err));
