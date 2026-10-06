// Utility to generate a high-res 1080x1920 Vice City Instagram Story for GTA 6 Contest

export async function generateGTA6StoryVisual(params: {
    prenom: string;
    instagram: string;
    plateforme: string;
    referralCode: string;
    tickets: number;
}): Promise<string> {
    const width = 1080;
    const height = 1920;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // 1. Synthwave Vice City Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0d0221');
    bgGrad.addColorStop(0.3, '#19053b');
    bgGrad.addColorStop(0.65, '#3b074a');
    bgGrad.addColorStop(0.85, '#ff007f');
    bgGrad.addColorStop(1, '#00f0ff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Load and draw Hero Artwork (Lucia & Jason or Vice City)
    try {
        const heroImg = new Image();
        heroImg.crossOrigin = 'anonymous';
        heroImg.src = '/images/gta6_lucia_jason.jpg';
        await new Promise((resolve) => {
            heroImg.onload = resolve;
            heroImg.onerror = resolve;
        });

        if (heroImg.complete && heroImg.naturalWidth > 0) {
            // Draw cropped hero image in upper-middle
            const drawH = 750;
            const drawW = width;
            ctx.save();
            ctx.drawImage(heroImg, 0, 320, drawW, drawH);
            
            // Subtle fade gradient over image edges
            const fadeTop = ctx.createLinearGradient(0, 320, 0, 480);
            fadeTop.addColorStop(0, 'rgba(13, 2, 33, 1)');
            fadeTop.addColorStop(1, 'rgba(13, 2, 33, 0)');
            ctx.fillStyle = fadeTop;
            ctx.fillRect(0, 320, drawW, 160);

            const fadeBottom = ctx.createLinearGradient(0, 920, 0, 1070);
            fadeBottom.addColorStop(0, 'rgba(13, 2, 33, 0)');
            fadeBottom.addColorStop(1, 'rgba(13, 2, 33, 0.95)');
            ctx.fillStyle = fadeBottom;
            ctx.fillRect(0, 920, drawW, 150);
            ctx.restore();
        }
    } catch (e) {
        // Fallback gracefully
    }

    // 3. Synthwave Grid at bottom
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 2;
    const gridStartY = 1450;
    // Horizontal lines
    for (let y = gridStartY; y < height; y += 45) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    // Perspective vertical lines
    const vanishingX = width / 2;
    const vanishingY = 1350;
    for (let x = -width; x <= width * 2; x += 120) {
        ctx.beginPath();
        ctx.moveTo(vanishingX, vanishingY);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    ctx.restore();

    // 4. Header Badge / Logo Dropsiders
    try {
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        logo.src = '/logo.png';
        await new Promise((resolve) => {
            logo.onload = resolve;
            logo.onerror = resolve;
        });

        if (logo.complete && logo.naturalWidth > 0) {
            const logoW = 280;
            const logoH = (logo.naturalHeight / logo.naturalWidth) * logoW;
            ctx.drawImage(logo, width / 2 - logoW / 2, 110, logoW, logoH);
        }
    } catch {
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 italic 36px "Montserrat", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DROPSIDERS', width / 2, 140);
    }

    // Header neon sub-badge
    ctx.textAlign = 'center';
    ctx.font = '900 italic 28px "Montserrat", sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 15;
    ctx.fillText('★ JEU CONCOURS OFFICIEL ★', width / 2, 230);
    ctx.shadowBlur = 0;

    // 5. Main Title "GRAND THEFT AUTO VI"
    ctx.font = '900 italic 88px "Montserrat", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 30;
    ctx.fillText('JE JOUE POUR', width / 2, 1140);
    
    ctx.font = '900 italic 120px "Orbitron", sans-serif';
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 40;
    ctx.fillText('GTA VI', width / 2, 1260);
    ctx.shadowBlur = 0;

    // Platform Tag
    ctx.font = '900 uppercase 34px "Montserrat", sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`SUR ${params.plateforme.toUpperCase()}`, width / 2, 1330);

    // 6. User Card Info Container
    const cardY = 1420;
    const cardH = 260;
    const cardW = 900;
    const cardX = (width - cardW) / 2;

    // Card background
    ctx.save();
    ctx.fillStyle = 'rgba(13, 2, 33, 0.85)';
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(255, 0, 127, 0.5)';
    ctx.shadowBlur = 20;

    // Rounded rectangle
    const radius = 30;
    ctx.beginPath();
    ctx.moveTo(cardX + radius, cardY);
    ctx.lineTo(cardX + cardW - radius, cardY);
    ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + radius);
    ctx.lineTo(cardX + cardW, cardY + cardH - radius);
    ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - radius, cardY + cardH);
    ctx.lineTo(cardX + radius, cardY + cardH);
    ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - radius);
    ctx.lineTo(cardX, cardY + radius);
    ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // User instagram & tickets inside card
    ctx.textAlign = 'center';
    ctx.font = '900 italic 44px "Montserrat", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`PARTICIPANT : ${params.instagram.toUpperCase()}`, width / 2, cardY + 75);

    ctx.font = '900 uppercase 30px "Montserrat", sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`🎟️ ${params.tickets} CHANCE${params.tickets > 1 ? 'S' : ''} AU TIRAGE AU SORT`, width / 2, cardY + 140);

    ctx.font = '800 uppercase 24px "Montserrat", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`CODE PARRAIN : ${params.referralCode}`, width / 2, cardY + 200);

    // 7. Footer Call To Action
    ctx.font = '900 uppercase 32px "Orbitron", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 15;
    ctx.fillText('PARTICIPE SUR DROPSIDERS.FR', width / 2, 1780);
    ctx.shadowBlur = 0;

    ctx.font = '700 uppercase 22px "Montserrat", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('LIEN EN BIO OU EN STORY 🔗', width / 2, 1830);

    return canvas.toDataURL('image/png');
}
