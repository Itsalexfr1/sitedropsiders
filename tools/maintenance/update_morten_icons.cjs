const fs = require('fs');
const path = require('path');

// Read news.json
const newsPath = path.join(__dirname, 'src', 'data', 'news.json');
const newsData = JSON.parse(fs.readFileSync(newsPath, 'utf-8'));

console.log('Updating Morten interview with simple horizontal social icons...\n');

// Find Morten interview (ID: 37)
const mortenInterview = newsData.find(item => item.id === 37);

if (!mortenInterview) {
    console.error('❌ Morten interview not found!');
    process.exit(1);
}

console.log(`Found: ${mortenInterview.title}`);

// Create new content with VERY SIMPLE horizontal social icons
const newContent = `<div class="jw-block-element"><div style="max-width: 1200px; margin: 0 auto; padding: 2rem;">
 
 <div style="margin-bottom: 2rem;">
 <img src="https://primary.jwwb.nl/public/x/b/s/temp-rsueidauyieolliplvix/maxresdefault-standard-gn31e7.jpg" alt="Morten Interview" style="width: 100%; border-radius: 16px;" />
 </div>
 
 <p style="text-align: center; font-size: 1.125rem; color: #fff; margin-bottom: 2rem;">
 Découvrez notre interview de la star Morten lors du mythique EDC Las Vegas !!
 </p>
 
 <div style="position: relative; padding-bottom: 56.25%; height: 0; margin-bottom: 3rem;">
 <iframe src="https://www.youtube.com/embed/kKmjrqHS840?rel=0&amp;hl=fr-FR" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; border-radius: 12px;" allowfullscreen allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"></iframe>
 </div>
 
 <div style="margin-top: 3rem; text-align: center;">
 <h3 style="color: #ff0033; font-size: 0.875rem; font-weight: 700; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.1em;">Suivez MORTEN</h3>
 <div style="display: flex; justify-content: center; align-items: center; gap: 1.5rem; margin-bottom: 3rem; flex-wrap: wrap;">
 
 <a href="https://www.mortenofficial.com" target="_blank" rel="noopener noreferrer" style="color: #9ca3af; text-decoration: none; font-size: 0.875rem; font-weight: 600; transition: color 0.3s;" onmouseover="this.style.color='#ff0033'" onmouseout="this.style.color='#9ca3af'">Website</a>
 <span style="color: #4b5563;">•</span>
 
 <a href="https://www.instagram.com/mortenofficial/" target="_blank" rel="noopener noreferrer" style="color: #9ca3af; text-decoration: none; font-size: 0.875rem; font-weight: 600; transition: color 0.3s;" onmouseover="this.style.color='#ec4899'" onmouseout="this.style.color='#9ca3af'">Instagram</a>
 <span style="color: #4b5563;">•</span>
 
 <a href="https://www.facebook.com/MORTENofficial" target="_blank" rel="noopener noreferrer" style="color: #9ca3af; text-decoration: none; font-size: 0.875rem; font-weight: 600; transition: color 0.3s;" onmouseover="this.style.color='#2563eb'" onmouseout="this.style.color='#9ca3af'">Facebook</a>
 <span style="color: #4b5563;">•</span>
 
 <a href="https://x.com/MORTENofficial" target="_blank" rel="noopener noreferrer" style="color: #9ca3af; text-decoration: none; font-size: 0.875rem; font-weight: 600; transition: color 0.3s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#9ca3af'">X</a>
 <span style="color: #4b5563;">•</span>
 
 <a href="https://www.youtube.com/c/MORTENofficial/" target="_blank" rel="noopener noreferrer" style="color: #9ca3af; text-decoration: none; font-size: 0.875rem; font-weight: 600; transition: color 0.3s;" onmouseover="this.style.color='#dc2626'" onmouseout="this.style.color='#9ca3af'">YouTube</a>
 <span style="color: #4b5563;">•</span>
 
 <a href="https://www.tiktok.com/@mortenofficial" target="_blank" rel="noopener noreferrer" style="color: #9ca3af; text-decoration: none; font-size: 0.875rem; font-weight: 600; transition: color 0.3s;" onmouseover="this.style.color='#22d3ee'" onmouseout="this.style.color='#9ca3af'">TikTok</a>
 
 </div>
 </div>
 
 <div style="margin-top: 3rem; text-align: center;">
 <h3 style="color: #ff0033; font-size: 0.875rem; font-weight: 700; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.1em;">Suivez EDC Las Vegas</h3>
 <div style="display: flex; justify-content: center; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
 
 <a href="https://lasvegas.electricdaisycarnival.com" target="_blank" rel="noopener noreferrer" style="color: #9ca3af; text-decoration: none; font-size: 0.875rem; font-weight: 600; transition: color 0.3s;" onmouseover="this.style.color='#ff0033'" onmouseout="this.style.color='#9ca3af'">Website</a>
 <span style="color: #4b5563;">•</span>
 
 <a href="https://www.instagram.com/edc_lasvegas/" target="_blank" rel="noopener noreferrer" style="color: #9ca3af; text-decoration: none; font-size: 0.875rem; font-weight: 600; transition: color 0.3s;" onmouseover="this.style.color='#ec4899'" onmouseout="this.style.color='#9ca3af'">Instagram</a>
 <span style="color: #4b5563;">•</span>
 
 <a href="https://www.facebook.com/electricdaisycarnival" target="_blank" rel="noopener noreferrer" style="color: #9ca3af; text-decoration: none; font-size: 0.875rem; font-weight: 600; transition: color 0.3s;" onmouseover="this.style.color='#2563eb'" onmouseout="this.style.color='#9ca3af'">Facebook</a>
 <span style="color: #4b5563;">•</span>
 
 <a href="https://www.tiktok.com/@electric_daisy_carnival" target="_blank" rel="noopener noreferrer" style="color: #9ca3af; text-decoration: none; font-size: 0.875rem; font-weight: 600; transition: color 0.3s;" onmouseover="this.style.color='#22d3ee'" onmouseout="this.style.color='#9ca3af'">TikTok</a>
 
 </div>
 </div>
 
</div></div>`;

mortenInterview.content = newContent;

// Save the updated data
fs.writeFileSync(newsPath, JSON.stringify(newsData, null, 2), 'utf-8');

console.log('\n✅ Morten interview updated with simple horizontal links!');
console.log('   - Simple text links separated by bullets');
console.log('   - Horizontal layout (aligned in width)');
console.log('   - Hover color effects');
console.log(`   - Saved to: ${newsPath}`);
