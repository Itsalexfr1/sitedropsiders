
const fs = require('fs');
const path = require('path');
const newsFile = path.join(__dirname, 'src', 'data', 'news.json');
const data = JSON.parse(fs.readFileSync(newsFile, 'utf8'));

const interviews = data.filter(i => i.category === 'Interview');
const news = data.filter(i => i.category === 'News');
const counts = {};
data.forEach(i => counts[i.category] = (counts[i.category] || 0) + 1);

console.log('Stats by category:', counts);

// Check for similar titles in interviews
const titles = interviews.map(i => i.title.toLowerCase().trim());
const uniqueTitles = new Set(titles);
console.log(`Unique Interview Titles: ${uniqueTitles.size} / Total Interviews: ${interviews.length}`);
