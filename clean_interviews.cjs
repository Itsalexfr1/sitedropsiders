const fs = require('fs');
const path = require('path');

// Read news.json
const newsPath = path.join(__dirname, 'src', 'data', 'news.json');
const newsData = JSON.parse(fs.readFileSync(newsPath, 'utf-8'));

console.log('Starting interview cleanup...\n');

let modifiedCount = 0;

newsData.forEach((item, index) => {
    if (item.category === 'Interview' || item.category === 'Interviews') {
        let modified = false;

        // Remove Webador pagination section
        if (item.content && item.content.includes('jw-news-page-pagination')) {
            const beforeLength = item.content.length;

            // Remove the pagination section - it starts with a separator and ends before the comment form
            item.content = item.content.replace(
                /<div style="margin-top: \.75em"[^>]*class="jw-strip[^"]*"[^>]*>.*?jw-news-page-pagination.*?<\/p>\s*<\/div><\/div><\/div>/gs,
                ''
            );

            const afterLength = item.content.length;
            if (beforeLength !== afterLength) {
                modified = true;
                console.log(`✓ Removed pagination from: ${item.title}`);
            }
        }

        // Special handling for Morten interview (ID: 37)
        if (item.id === 37) {
            console.log(`\n📌 Processing Morten interview...`);

            // Extract YouTube embed
            const youtubeMatch = item.content.match(/<iframe src="https:\/\/www\.youtube\.com\/embed\/[^"]+[^>]*>.*?<\/iframe>/s);

            // Extract social media links
            const socialLinksPattern = /<p[^>]*style="text-align: center;"[^>]*>.*?(?:mortenofficial\.com|instagram\.com\/mortenofficial|facebook\.com\/MORTENofficial|x\.com\/MORTENofficial|youtube\.com\/c\/MORTENofficial|tiktok\.com\/@mortenofficial).*?<\/p>/gs;
            const socialLinks = item.content.match(socialLinksPattern);

            // Extract EDC links
            const edcLinksPattern = /<p[^>]*style="text-align: center;"[^>]*>.*?(?:lasvegas\.electricdaisycarnival\.com|instagram\.com\/edc_lasvegas|facebook\.com\/electricdaisycarnival|tiktok\.com\/@electric_daisy_carnival).*?<\/p>/gs;
            const edcLinks = item.content.match(edcLinksPattern);

            // Create new clean content with just intro text, YouTube, and social links
            const newContent = `<div class="jw-block-element"><div id="jw-element-509514950" data-jw-element-id="509514950" class="jw-tree-node jw-element jw-strip-root jw-tree-container jw-responsive jw-node-is-first-child jw-node-is-last-child">
 <div id="jw-element-509514951" data-jw-element-id="509514951" class="jw-tree-node jw-element jw-strip jw-tree-container jw-responsive jw-strip--default jw-strip--style-color jw-strip--color-default jw-strip--padding-both jw-node-is-first-child jw-strip--primary jw-node-is-last-child">
 <div class="jw-strip__content-container"><div class="jw-strip__content jw-responsive"><div id="jw-element-509514957" data-jw-element-id="509514957" class="jw-tree-node jw-element jw-image jw-node-is-first-child">
 <div class="jw-intent jw-element-image jw-element-content jw-element-image-is-left" style="width: 100%;" > <picture class="jw-element-image__image-wrapper jw-image-is-rounded jw-intrinsic" style="padding-top: 56.25%;" > <img class="jw-element-image__image jw-intrinsic__item" style="--jw-element-image--pan-x: 0.5; --jw-element-image--pan-y: 0.5;" alt="" src="https://primary.jwwb.nl/public/x/b/s/temp-rsueidauyieolliplvix/maxresdefault-standard-gn31e7.jpg" loading="lazy" width="800" height="450"> </picture> </div>
</div><div id="jw-element-509515342" data-jw-element-id="509515342" class="jw-tree-node jw-element jw-image-text">
 <div class="jw-element-imagetext-text"> <p style="text-align: center;"><span>Découvrez notre interview de la star Morten lors du mythique EDC Las Vegas !! </span></p>
<p style="text-align: center;">&nbsp;</p>
${youtubeMatch ? `<div id="jw-element-509514975" data-jw-element-id="509514975" class="jw-tree-node jw-element jw-embed">
 <div class="jw-html-wrapper"> <div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">${youtubeMatch[0]}</div> </div>
</div>` : ''}
<p style="text-align: center;">&nbsp;</p>
<h3 style="text-align: center;"><span>Suivez MORTEN</span></h3>
${socialLinks ? socialLinks.join('\n') : ''}
<p style="text-align: center;">&nbsp;</p>
<h3 style="text-align: center;"><span>Suivez EDC Las Vegas</span></h3>
${edcLinks ? edcLinks.join('\n') : ''}
 </div>
</div></div></div></div></div></div>`;

            item.content = newContent;
            modified = true;
            console.log(`✓ Reformatted Morten interview with YouTube and social links only`);
        }

        if (modified) {
            modifiedCount++;
        }
    }
});

// Save the cleaned data
fs.writeFileSync(newsPath, JSON.stringify(newsData, null, 2), 'utf-8');

console.log(`\n✅ Cleanup complete!`);
console.log(`   Modified ${modifiedCount} interviews`);
console.log(`   Saved to: ${newsPath}`);
