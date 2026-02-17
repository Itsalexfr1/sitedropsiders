const fs = require('fs');
const path = require('path');

// Read news.json
const newsPath = path.join(__dirname, 'src', 'data', 'news.json');
const newsData = JSON.parse(fs.readFileSync(newsPath, 'utf-8'));

console.log(`Total articles: ${newsData.length}`);

// Find all interviews
const interviews = newsData.filter(item =>
    item.category === 'Interview' || item.category === 'Interviews'
);

console.log(`\nTotal interviews: ${interviews.length}`);
console.log('\nInterviews found:');
interviews.forEach((interview, index) => {
    console.log(`${index + 1}. ${interview.title} (ID: ${interview.id})`);
});

// Check for Webador pagination links in content
console.log('\n\nChecking for Webador pagination links...');
interviews.forEach(interview => {
    if (interview.content && interview.content.includes('jw-news-page-pagination')) {
        console.log(`\n❌ Found pagination in: ${interview.title}`);

        // Extract the pagination text
        const paginationMatch = interview.content.match(/INTERVIEW[^<]*(?:HARDWELL|DA TWEEKAZ|MORTEN)/gi);
        if (paginationMatch) {
            console.log(`   Links: ${paginationMatch.join(', ')}`);
        }
    }
});

// Find Morten interview specifically
const mortenInterview = interviews.find(i => i.title.includes('MORTEN'));
if (mortenInterview) {
    console.log(`\n\n📌 Morten Interview Details:`);
    console.log(`   Title: ${mortenInterview.title}`);
    console.log(`   ID: ${mortenInterview.id}`);
    console.log(`   Date: ${mortenInterview.date}`);

    // Check if it has social media links
    const hasSocialLinks = mortenInterview.content.includes('instagram.com') ||
        mortenInterview.content.includes('facebook.com') ||
        mortenInterview.content.includes('twitter.com') ||
        mortenInterview.content.includes('tiktok.com');
    console.log(`   Has social links: ${hasSocialLinks}`);

    // Check if it has YouTube embed
    const hasYouTube = mortenInterview.content.includes('youtube.com/embed');
    console.log(`   Has YouTube: ${hasYouTube}`);
}
