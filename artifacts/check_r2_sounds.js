


const ADMIN_PASSWORD = '01062026Ac';
const BASE_URL = 'https://dropsiders.fr'; // Assuming production

async function listFiles(prefix = '') {
    const url = `${BASE_URL}/api/r2/list?prefix=${encodeURIComponent(prefix)}&limit=1000`;
    const res = await fetch(url, {
        headers: {
            'X-Session-ID': 'initial-session-id',
            'X-Admin-Username': 'alex'
        }
    });
    if (!res.ok) {
        throw new Error(`Failed to list files: ${res.status} ${await res.text()}`);
    }
    return await res.json();
}

async function main() {
    console.log('Listing ALL objects in R2...');
    const all = await listFiles('');
    console.log(`Found ${all.objects.length} objects total`);
    
    console.log('\nFirst 10 objects:');
    all.objects.slice(0, 10).forEach(obj => console.log(`- ${obj.key}`));

    const folders = new Set();
    all.objects.forEach(obj => {
        const parts = obj.key.split('/');
        if (parts.length > 1) folders.add(parts[0]);
    });
    console.log(`\nFound prefixes/folders: ${Array.from(folders).join(', ')}`);
}

main().catch(console.error);
