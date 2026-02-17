
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'src', 'data');
const newsFile = path.join(dataDir, 'news.json');
const interviewsFile = path.join(dataDir, 'interviews.json');

const newsData = JSON.parse(fs.readFileSync(newsFile, 'utf8'));
let interviewsData = [];
if (fs.existsSync(interviewsFile)) {
    interviewsData = JSON.parse(fs.readFileSync(interviewsFile, 'utf8'));
}

const allInterviews = [...newsData.filter(i => i.category === 'Interview' || i.category === 'Interviews'), ...interviewsData];
const newsItems = newsData.filter(i => i.category === 'News');

// Normalize interviews
allInterviews.forEach(i => i.category = 'Interview');

// Deduplicate interviews
const interviewMap = new Map();
allInterviews.forEach(item => {
    const key = (item.link || item.title).trim().toLowerCase();
    if (!interviewMap.has(key)) {
        interviewMap.set(key, item);
    } else {
        // Keep the one with more content or images
        const existing = interviewMap.get(key);
        const existingScore = (existing.content?.length || 0) + (existing.images?.length || 0) * 100;
        const currentScore = (item.content?.length || 0) + (item.images?.length || 0) * 100;
        if (currentScore > existingScore) {
            interviewMap.set(key, item);
        }
    }
});

const uniqueInterviews = Array.from(interviewMap.values());
const finalData = [...newsItems, ...uniqueInterviews];

// Sort by date descending
finalData.sort((a, b) => new Date(b.date) - new Date(a.date));

// Re-index
finalData.forEach((item, index) => {
    item.id = index + 1;
});

fs.writeFileSync(newsFile, JSON.stringify(finalData, null, 2));

console.log(`Merged and cleaned news.json.`);
console.log(`Original: ${newsData.length} items.`);
console.log(`Final: ${finalData.length} items (${newsItems.length} news, ${uniqueInterviews.length} interviews).`);

// Delete interviews.json as it's now redundant
if (fs.existsSync(interviewsFile)) {
    fs.unlinkSync(interviewsFile);
    console.log('Deleted interviews.json');
}
