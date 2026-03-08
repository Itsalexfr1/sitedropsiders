const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const BUCKET_NAME = 'dropsiders-assets';
const PUBLIC_DOMAIN = 'https://dropsiders.fr/uploads';
const SRC_DIR = path.join(__dirname, 'src');
const ASSETS_DIR = path.join(__dirname, 'migration_assets');
const STATE_FILE = path.join(__dirname, 'migration_state_v2.json');
const CONCURRENCY = 30; // Increased further to speed up upload

if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR);
}

const cloudinaryRegex = /https?:\/\/res\.cloudinary\.com\/[a-zA-Z0-9_-]+\/(?:image|video)\/upload\/[^"'\)\s\\]*/g;

async function migrate() {
    console.log('--- Phase 1: Finding Cloudinary URLs ---');
    const files = getAllFiles(SRC_DIR);
    let urlMap = {};

    if (fs.existsSync(STATE_FILE)) {
        try {
            urlMap = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
            console.log(`Loaded ${Object.keys(urlMap).length} existing mappings from state file.`);
        } catch (e) {
            console.error('Failed to load state file.');
        }
    }

    const currentUrls = new Set();
    for (const file of files) {
        if (file.match(/\.(json|tsx|ts|js|html)$/)) {
            const content = fs.readFileSync(file, 'utf8');
            const matches = content.match(cloudinaryRegex);
            if (matches) {
                matches.forEach(url => {
                    currentUrls.add(url);
                    if (!urlMap[url]) {
                        urlMap[url] = null;
                    }
                });
            }
        }
    }

    console.log(`Found ${currentUrls.size} unique Cloudinary URLs in codebase.`);

    console.log('--- Phase 2: Downloading and Uploading to R2 ---');
    const urlsToProcess = Array.from(currentUrls).filter(url => !urlMap[url]);
    console.log(`${urlsToProcess.length} URLs need to be processed.`);

    let completed = 0;
    const total = urlsToProcess.length;

    async function processUrl(url) {
        try {
            // Extract the path after /upload/
            const uploadIndex = url.indexOf('/upload/');
            let publicPath;
            if (uploadIndex !== -1) {
                const afterUpload = url.substring(uploadIndex + 8);
                // Remove v12354/ if present at the start
                publicPath = afterUpload.replace(/^v\d+\//, '');
            } else {
                publicPath = url.split('/').pop().split('?')[0];
            }

            // Clean up version/params if any (Cloudinary URLs sometimes have them)
            const cleanPath = publicPath.split('?')[0];
            const key = `migrated/${cleanPath}`;

            // Local path: replace slashes with underscores to keep a flat folder but ensure uniqueness
            const localSafeName = cleanPath.replace(/\//g, '_');
            const localPath = path.join(ASSETS_DIR, localSafeName);

            // Download
            if (!fs.existsSync(localPath)) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`Status ${response.status}`);
                    const buffer = await response.arrayBuffer();
                    fs.writeFileSync(localPath, Buffer.from(buffer));
                } catch (e) {
                    console.error(`[FAIL DOWNLOAD] ${url}: ${e.message}`);
                    return;
                }
            }

            // Upload
            try {
                // We use double quotes for the key in case it has spaces
                const cmd = `npx wrangler r2 object put "${BUCKET_NAME}/${key}" --file "${localPath}" --remote`;
                await execPromise(cmd);
            } catch (e) {
                console.error(`[FAIL UPLOAD] ${key}: ${e.message}`);
                // If it fails with 503, we might want to slow down or retry
                if (e.message.includes('503')) {
                    console.log('Sleeping 5s due to 503...');
                    await new Promise(r => setTimeout(r, 5000));
                }
                return;
            }

            urlMap[url] = `${PUBLIC_DOMAIN}/${key}`;
            completed++;
            if (completed % 10 === 0 || completed === total) {
                console.log(`Progress: ${completed}/${total} (${Math.round((completed / total) * 100)}%)`);
                fs.writeFileSync(STATE_FILE, JSON.stringify(urlMap, null, 2));
            }
        } catch (err) {
            console.error(`Unexpected error for ${url}:`, err);
        }
    }

    const queue = [...urlsToProcess];
    if (queue.length > 0) {
        const workers = Array(Math.min(CONCURRENCY, queue.length)).fill(0).map(async () => {
            while (queue.length > 0) {
                const url = queue.shift();
                await processUrl(url);
            }
        });
        await Promise.all(workers);
    }

    fs.writeFileSync(STATE_FILE, JSON.stringify(urlMap, null, 2));

    console.log('--- Phase 3: Replacing URLs in Codebase ---');
    const successfulMap = {};
    for (const oldUrl in urlMap) {
        if (urlMap[oldUrl]) {
            successfulMap[oldUrl] = urlMap[oldUrl];
        }
    }

    let updatedFilesCount = 0;
    for (const file of files) {
        if (file.match(/\.(json|tsx|ts|js|html)$/)) {
            let content = fs.readFileSync(file, 'utf8');
            let replaced = false;

            content = content.replace(cloudinaryRegex, (match) => {
                if (successfulMap[match]) {
                    replaced = true;
                    return successfulMap[match];
                }
                return match;
            });

            if (replaced) {
                fs.writeFileSync(file, content, 'utf8');
                updatedFilesCount++;
                if (updatedFilesCount % 10 === 0) {
                    console.log(`Updated ${updatedFilesCount} files...`);
                }
            }
        }
    }

    console.log(`--- Migration Complete! Updated ${updatedFilesCount} files. ---`);
}

function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);
    files.forEach(function (file) {
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'migration_assets') return;
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    });
    return arrayOfFiles;
}

migrate().catch(console.error);
