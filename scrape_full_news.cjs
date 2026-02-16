const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.dropsiders.eu';
const NEWS_URL = `${BASE_URL}/news`;
const INTERVIEW_URL = `${BASE_URL}/interviews`;
const RECAP_URL = `${BASE_URL}/recaps`;

const slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
};

async function downloadImage(url, filepath) {
    if (!url) return null;
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });
        return new Promise((resolve, reject) => {
            response.data.pipe(fs.createWriteStream(filepath))
                .on('error', reject)
                .on('finish', () => resolve(filepath));
        });
    } catch (err) {
        console.error(`Failed to download image ${url}:`, err.message);
        return null;
    }
}

async function scrapeFullNews() {
    console.log('Starting full news scrape with HTML preservation and media localization...');
    const allArticles = [];
    const assetsDir = path.join(__dirname, 'public', 'assets', 'news');
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }

    const categories = [
        { url: NEWS_URL, name: 'News' },
        { url: INTERVIEW_URL, name: 'Interview' },
        { url: RECAP_URL, name: 'Recap' }
    ];

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    for (const cat of categories) {
        let currentPage = 1;
        let hasNextPage = true;

        while (hasNextPage) {
            const pageUrl = currentPage === 1 ? cat.url : `${cat.url}?page=${currentPage}`;
            console.log(`Scraping category: ${cat.name} Page ${currentPage}...`);

            try {
                const response = await axios.get(pageUrl, { headers });
                const $ = cheerio.load(response.data);

                const articleElements = $('.jw-news-post');
                if (articleElements.length === 0) {
                    hasNextPage = false;
                    break;
                }

                console.log(`Found ${articleElements.length} articles on Page ${currentPage}`);

                for (let i = 0; i < articleElements.length; i++) {
                    const el = articleElements[i];
                    const entryTitle = $(el).find('.jw-news-post__title, .jw-news-entry__title').text().trim();
                    const entryLink = $(el).find('a.jw-news-post__block-link, a.jw-news-entry__link').attr('href');
                    const entryDate = $(el).find('.jw-news-post__meta, .jw-news-entry__date').text().trim();
                    const entryLead = $(el).find('.jw-news-post__lead, .jw-news-entry__lead').text().trim();

                    if (!entryLink) continue;

                    const url = entryLink.startsWith('http') ? entryLink : BASE_URL + entryLink;
                    const slug = slugify(entryTitle);

                    try {
                        const detailResponse = await axios.get(url, { headers });
                        const $detail = cheerio.load(detailResponse.data);

                        // Look for the primary content container
                        const contentContainer = $detail('.news-page-content-container, .block-content, .jw-strip__content').first();

                        if (contentContainer.length > 0) {
                            // 1. Remove boilerplate
                            contentContainer.find('.jw-footer, .jw-social-share, .jw-newsPostComment, .jw-news-page-pagination, .jw-strip--padding-end').remove();
                            contentContainer.find('footer, .share-button-container, .jw-comment-module, .scroll-top').remove();
                            contentContainer.find('.jw-news-page__meta').remove();
                            contentContainer.find('hr').remove();

                            // 2. Identify YouTube ID (Interviews)
                            let youtubeId = '';
                            contentContainer.find('iframe[src*="youtube.com/embed/"]').each((idx, elFrame) => {
                                const src = $detail(elFrame).attr('src');
                                if (src) {
                                    const match = src.match(/embed\/([^?]+)/);
                                    if (match && match[1]) {
                                        youtubeId = match[1];
                                    }
                                }
                            });

                            // 3. Localize all images in the content
                            const contentImages = [];
                            const imgElements = contentContainer.find('img');

                            for (let idx = 0; idx < imgElements.length; idx++) {
                                const elImg = imgElements[idx];
                                let imgSrc = $detail(elImg).attr('src');

                                // Handle lazy loading/srcset
                                if (!imgSrc || imgSrc.includes('transparent.gif')) {
                                    const srcset = $detail(elImg).attr('srcset');
                                    if (srcset) {
                                        const sources = srcset.split(',').map(s => s.trim().split(' ')[1] ? { url: s.trim().split(' ')[0], w: parseInt(s.trim().split(' ')[1]) } : { url: s.trim(), w: 0 });
                                        sources.sort((a, b) => b.w - a.w);
                                        imgSrc = sources[0].url;
                                    }
                                }

                                if (imgSrc) {
                                    if (!imgSrc.startsWith('http')) imgSrc = BASE_URL + imgSrc;
                                    // Remove query params for a clean source
                                    imgSrc = imgSrc.split('?')[0];

                                    const imgExt = path.extname(imgSrc) || '.jpg';
                                    const imgFilename = `${slug}-${idx + 1}${imgExt}`;
                                    const imgLocalPath = path.join(assetsDir, imgFilename);

                                    await downloadImage(imgSrc, imgLocalPath);

                                    const localWebPath = `/assets/news/${imgFilename}`;
                                    $detail(elImg).attr('src', localWebPath);
                                    $detail(elImg).removeAttr('srcset');
                                    $detail(elImg).removeAttr('sizes');

                                    contentImages.push(localWebPath);
                                }
                            }

                            // 4. Localize featured image (from og:image if not in content)
                            let featuredImageLocal = contentImages[0] || '';
                            if (!featuredImageLocal) {
                                let ogImage = $detail('meta[property="og:image"]').attr('content');
                                if (ogImage) {
                                    const imgExt = path.extname(ogImage.split('?')[0]) || '.jpg';
                                    const imgFilename = `${slug}-featured${imgExt}`;
                                    const imgLocalPath = path.join(assetsDir, imgFilename);
                                    await downloadImage(ogImage.split('?')[0], imgLocalPath);
                                    featuredImageLocal = `/assets/news/${imgFilename}`;
                                }
                            }

                            // 5. Clean up the HTML
                            // Remove forbidden text blocks that might be in simple paragraphs
                            const forbiddenTexts = [
                                "Créé en 2018, DROPSIDERS",
                                "Nos réseaux sociaux sont suivis",
                                "Nous proposons des Interviews",
                                "CONTACT - L'EQUIPE - NEWSLETTER",
                                "MENTIONS LEGALES - KIT MEDIA",
                                "Ajouter un commentaire",
                                "Commentaires",
                                "Il n'y a pas encore de commentaire"
                            ];

                            contentContainer.find('p, span, div').each((idx, el) => {
                                const text = $detail(el).text().trim();
                                if (forbiddenTexts.some(forbidden => text.includes(forbidden))) {
                                    $detail(el).remove();
                                }
                            });

                            // Remove empty tags
                            contentContainer.find('p, div, span').each((idx, el) => {
                                if ($detail(el).children().length === 0 && !$detail(el).text().trim()) {
                                    $detail(el).remove();
                                }
                            });

                            const cleanHtml = contentContainer.html().trim();

                            allArticles.push({
                                id: allArticles.length + 1,
                                title: entryTitle,
                                date: entryDate,
                                category: cat.name,
                                summary: entryLead,
                                htmlContent: cleanHtml,
                                image: featuredImageLocal,
                                youtubeId: youtubeId,
                                originalUrl: url
                            });
                        }

                    } catch (err) {
                        console.error(`Error scraping detail page ${url}:`, err.message);
                    }
                }

                // Check for next page
                const nextLink = $('.jw-pagination__control--next a, .jw-pagination a[data-page-next]');
                if (nextLink.length > 0 && currentPage < 10) {
                    currentPage++;
                } else {
                    hasNextPage = false;
                }

            } catch (err) {
                console.error(`Error scraping category ${cat.name} Page ${currentPage}:`, err.message);
                hasNextPage = false;
            }
        }
    }

    const outputPath = path.join(__dirname, 'src', 'data', 'news.json');
    fs.writeFileSync(outputPath, JSON.stringify(allArticles, null, 2));
    console.log(`Saved ${allArticles.length} articles to ${outputPath}`);
}

scrapeFullNews();
