
const fs = require('fs');
const path = require('path');

const RECAPS_FILE = 'src/data/recaps.json';
const CONTENT_FILES = [
    'src/data/recaps_content_2.json',
    'src/data/recaps_content_1.json'
];

const REPLACEMENTS = [
    { pattern: /Ã /g, replacement: 'à' },
    { pattern: /Ã©/g, replacement: 'é' },
    { pattern: /Ã¨/g, replacement: 'è' },
    { pattern: /Ãª/g, replacement: 'ê' },
    { pattern: /Ã»/g, replacement: 'û' },
    { pattern: /Ã´/g, replacement: 'ô' },
    { pattern: /Ã®/g, replacement: 'î' },
    { pattern: /Ã§/g, replacement: 'ç' },
    { pattern: /Ã¹/g, replacement: 'ù' },
    { pattern: /Ã«/g, replacement: 'ë' },
    { pattern: /Ã¯/g, replacement: 'ï' },
    { pattern: /Â /g, replacement: ' ' },
    { pattern: /Â/g, replacement: '' }
];

function cleanString(str) {
    if (!str) return str;
    let s = str;
    REPLACEMENTS.forEach(({ pattern, replacement }) => {
        s = s.replace(pattern, replacement);
    });
    return s;
}

function extractImages(html) {
    const images = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
        images.push(match[1]);
    }
    const mdImgRegex = /!\[.*?\]\((.*?)\)/g;
    while ((match = mdImgRegex.exec(html)) !== null) {
        images.push(match[1]);
    }
    return [...new Set(images)];
}

function extractYoutubeId(html) {
    const iframeRegex = /embed\/([a-zA-Z0-9_-]{11})/;
    const match = html.match(iframeRegex);
    if (match) return match[1];
    const linkRegex = /(?:v=|v\/|embed\/|youtu.be\/|watch\?v=)([a-zA-Z0-9_-]{11})/;
    const linkMatch = html.match(linkRegex);
    if (linkMatch) return linkMatch[1];
    return null;
}

function standardize() {
    console.log('Starting recaps standardization...');

    if (!fs.existsSync(RECAPS_FILE)) {
        console.error('recaps.json not found');
        return;
    }

    const recaps = JSON.parse(fs.readFileSync(RECAPS_FILE, 'utf8'));
    const allContent = [];

    CONTENT_FILES.forEach(file => {
        if (fs.existsSync(file)) {
            allContent.push(...JSON.parse(fs.readFileSync(file, 'utf8')));
        }
    });

    let modified = false;

    recaps.forEach(item => {
        const originalTitle = item.title;
        item.title = cleanString(item.title);
        item.summary = cleanString(item.summary);
        if (originalTitle !== item.title) modified = true;

        const contentItem = allContent.find(c => c.id === item.id);
        if (contentItem) {
            const content = contentItem.content;

            if (!item.images || item.images.length === 0) {
                const foundImages = extractImages(content);
                if (foundImages.length > 0) {
                    item.images = foundImages;
                    if (!item.image) item.image = foundImages[0];
                    modified = true;
                    console.log(`Extracted ${foundImages.length} images for recap ${item.id}`);
                }
            }

            if (!item.youtubeId) {
                const foundId = extractYoutubeId(content);
                if (foundId) {
                    item.youtubeId = foundId;
                    modified = true;
                    console.log(`Extracted YoutubeId ${foundId} for recap ${item.id}`);
                }
            }

            if (!item.summary || item.summary.trim() === '') {
                const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                item.summary = text.substring(0, 200) + (text.length > 200 ? '...' : '');
                modified = true;
                console.log(`Generated summary for recap ${item.id}`);
            }
        }
    });

    if (modified) {
        fs.writeFileSync(RECAPS_FILE, JSON.stringify(recaps, null, 2), 'utf8');
        console.log('recaps.json updated successfully.');
    } else {
        console.log('No changes needed in recaps.json.');
    }
}

standardize();
