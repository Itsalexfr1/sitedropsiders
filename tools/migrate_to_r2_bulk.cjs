const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// CONFIGURATION
const BUCKET_NAME = 'dropsiders-assets';
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

async function run() {
    console.log('\n🚀 Starting Migration of local /public/uploads to R2...');
    
    if (!fs.existsSync(UPLOADS_DIR)) {
        console.error('❌ Directory /public/uploads not found.');
        return;
    }

    const files = fs.readdirSync(UPLOADS_DIR).filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp3', '.mp4'].includes(ext);
    });

    console.log(`📦 Found ${files.length} files to migrate.\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const localPath = path.join(UPLOADS_DIR, file);
        const r2Path = `uploads/${file}`; // We always use uploads/ prefix in R2

        process.stdout.write(`[${i + 1}/${files.length}] Uploading ${file}... `);

        try {
            // Using wrangler CLI to handle authentication and direct R2 access
            // We use npx to ensure wrangler is available
            execSync(`npx wrangler r2 object put ${BUCKET_NAME}/${r2Path} --file "${localPath}"`, { stdio: 'ignore' });
            console.log('✅');
            successCount++;
        } catch (err) {
            console.log('❌');
            console.error(`  Error uploading ${file}:`, err.message);
            failCount++;
        }
    }

    console.log('\n✨ Migration Summary:');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`\n⚠️  Don't delete local files until you've verified everything works on production!`);
    console.log(`💡 Once verified, you can move them to _BACKUP_UPLOADS or delete them to slim down the repository.`);
}

run().catch(err => console.error('FATAL ERROR:', err));
