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
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Fond de base dégradé Vice City sombre
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#090214');
    bgGrad.addColorStop(0.35, '#150529');
    bgGrad.addColorStop(0.65, '#2a053b');
    bgGrad.addColorStop(0.85, '#10031c');
    bgGrad.addColorStop(1, '#05010a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Image principale officielle GTA 6 (Lucia & Jason) HD
    try {
        const heroImg = new Image();
        heroImg.crossOrigin = 'anonymous';
        heroImg.src = '/images/gta6_lucia_jason.jpg';
        await new Promise((resolve) => {
            heroImg.onload = resolve;
            heroImg.onerror = () => {
                const fallbackImg = new Image();
                fallbackImg.crossOrigin = 'anonymous';
                fallbackImg.src = '/images/gta6_vice_city_hero.jpg';
                fallbackImg.onload = resolve;
                fallbackImg.onerror = resolve;
            };
        });

        if (heroImg.complete && heroImg.naturalWidth > 0) {
            ctx.save();
            const imgAspect = heroImg.naturalWidth / heroImg.naturalHeight;
            const targetW = width;
            const targetH = targetW / imgAspect;
            ctx.drawImage(heroImg, 0, 0, targetW, targetH);

            // Fondu haut (pour le logo et le header sans assombrir excessivement)
            const topFade = ctx.createLinearGradient(0, 0, 0, 310);
            topFade.addColorStop(0, 'rgba(8, 2, 18, 0.92)');
            topFade.addColorStop(0.5, 'rgba(8, 2, 18, 0.60)');
            topFade.addColorStop(1, 'rgba(8, 2, 18, 0)');
            ctx.fillStyle = topFade;
            ctx.fillRect(0, 0, width, 310);

            // Fondu bas cinématique vers le noir complet sous Jason & Lucia
            const bottomFade = ctx.createLinearGradient(0, 820, 0, 1180);
            bottomFade.addColorStop(0, 'rgba(6, 1, 14, 0)');
            bottomFade.addColorStop(0.40, 'rgba(6, 1, 14, 0.75)');
            bottomFade.addColorStop(0.80, 'rgba(6, 1, 14, 0.97)');
            bottomFade.addColorStop(1, '#06010e');
            ctx.fillStyle = bottomFade;
            ctx.fillRect(0, 820, width, height - 820);
            ctx.restore();
        }
    } catch {
        // Fallback transparent
    }

    // 3. Grille perspective Synthwave subtile tout en bas
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
    ctx.lineWidth = 1.5;
    const gridStartY = 1660;
    for (let y = gridStartY; y < height; y += 45) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    const vanishingX = width / 2;
    const vanishingY = 1560;
    for (let x = -width * 0.5; x <= width * 1.5; x += 110) {
        ctx.beginPath();
        ctx.moveTo(vanishingX, vanishingY);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    ctx.restore();

    // 4. Logo Dropsiders en haut
    try {
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        logo.src = '/logo.png';
        await new Promise((resolve) => {
            logo.onload = resolve;
            logo.onerror = resolve;
        });

        if (logo.complete && logo.naturalWidth > 0) {
            const logoW = 310;
            const logoH = (logo.naturalHeight / logo.naturalWidth) * logoW;
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
            ctx.shadowBlur = 18;
            ctx.drawImage(logo, (width - logoW) / 2, 45, logoW, logoH);
            ctx.restore();
        }
    } catch {
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 italic 38px "Montserrat", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DROPSIDERS', width / 2, 85);
    }

    // Badge haut néon Cyan (positionné avec marge sous le logo)
    ctx.save();
    const badgeText = '★ GRAND JEU CONCOURS OFFICIEL ★';
    ctx.font = '900 italic 21px "Montserrat", sans-serif';
    const badgeW = ctx.measureText(badgeText).width + 46;
    const badgeH = 42;
    const badgeX = (width - badgeW) / 2;
    const badgeY = 205;

    ctx.fillStyle = 'rgba(0, 240, 255, 0.20)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 21);
    ctx.fill();

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.75)';
    ctx.shadowBlur = 15;
    ctx.stroke();

    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, width / 2, badgeY + badgeH / 2 + 1);
    ctx.restore();

    // =========================================================================
    // 5. TITRES : ZERO CHEVAUCHEMENT - ESPACEMENT ET HIÉRARCHIE PARFAITS
    // =========================================================================
    // A) Accroche : JE JOUE POUR GAGNER
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '900 italic 38px "Montserrat", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 1)';
    ctx.shadowBlur = 20;
    ctx.fillText('JE JOUE POUR GAGNER', width / 2, 1050);
    ctx.restore();

    // B) Grand Titre : GTA 6 (Massif, néon rose avec contour sombre net)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '900 italic 125px "Montserrat", sans-serif';
    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.strokeText('GTA 6', width / 2, 1175);
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = 'rgba(255, 0, 127, 0.95)';
    ctx.shadowBlur = 35;
    ctx.fillText('GTA 6', width / 2, 1175);
    ctx.restore();

    // C) Plateforme : Pilule jaune or néon adaptée au texte
    ctx.save();
    const platClean = params.plateforme.includes('PS5') || params.plateforme.includes('PlayStation')
        ? 'SUR PLAYSTATION 5'
        : (params.plateforme.includes('Xbox') ? 'SUR XBOX SERIES X' : `SUR ${params.plateforme.toUpperCase()}`);
    const platLabel = `🎮  ${platClean}`;

    ctx.font = '900 italic 25px "Montserrat", sans-serif';
    const platTextW = ctx.measureText(platLabel).width;
    const platPillW = Math.min(width - 120, platTextW + 54);
    const platPillH = 46;
    const platPillX = (width - platPillW) / 2;
    const platPillY = 1205;

    ctx.fillStyle = 'rgba(255, 230, 0, 0.16)';
    ctx.beginPath();
    ctx.roundRect(platPillX, platPillY, platPillW, platPillH, 23);
    ctx.fill();

    ctx.strokeStyle = '#ffe600';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(255, 230, 0, 0.6)';
    ctx.shadowBlur = 14;
    ctx.stroke();

    ctx.fillStyle = '#ffe600';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 8;
    ctx.fillText(platLabel, width / 2, platPillY + platPillH / 2 + 1);
    ctx.restore();

    // =========================================================================
    // 6. CARTE VIP TICKET DU PARTICIPANT (Structure Pro et Haute Lisibilité)
    // =========================================================================
    const cardY = 1285;
    const cardH = 375;
    const cardW = 940;
    const cardX = (width - cardW) / 2;

    ctx.save();
    // Fond carte sombre opaque
    ctx.fillStyle = 'rgba(10, 14, 28, 0.95)';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 28);
    ctx.fill();

    // Bordure dégradé Cyan vers Rose néon
    const cardBorderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    cardBorderGrad.addColorStop(0, '#00f0ff');
    cardBorderGrad.addColorStop(1, '#ff007f');
    ctx.strokeStyle = cardBorderGrad;
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.4)';
    ctx.shadowBlur = 24;
    ctx.stroke();
    ctx.restore();

    // Ligne 1 : Header de carte VIP
    ctx.save();
    ctx.font = '800 uppercase 23px "Montserrat", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'left';
    ctx.fillText('PARTICIPANT OFFICIEL', cardX + 45, cardY + 52);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = 'rgba(0, 255, 136, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText('🟢 PARTICIPATION VALIDÉE', cardX + cardW - 45, cardY + 52);
    ctx.restore();

    // Ligne 2 : Nom Instagram du participant (Grand, blanc éclatant)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '900 italic 54px "Montserrat", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 14;

    const rawInsta = (params.instagram || '').trim().toUpperCase();
    const cleanInsta = rawInsta.startsWith('@') ? rawInsta : `@${rawInsta}`;
    ctx.fillText(cleanInsta, width / 2, cardY + 128);
    ctx.restore();

    // Ligne 3 : Badge Inscription Tirage au sort (sans mention de 2 chances)
    ctx.save();
    const ticketText = '🎟️  INSCRIT AU TIRAGE AU SORT OFFICIEL';
    ctx.font = '900 italic 27px "Montserrat", sans-serif';
    const tBadgeW = ctx.measureText(ticketText).width + 50;
    const tBadgeH = 54;
    const tBadgeX = (width - tBadgeW) / 2;
    const tBadgeY = cardY + 165;

    ctx.fillStyle = 'rgba(0, 240, 255, 0.18)';
    ctx.beginPath();
    ctx.roundRect(tBadgeX, tBadgeY, tBadgeW, tBadgeH, 27);
    ctx.fill();

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
    ctx.shadowBlur = 12;
    ctx.stroke();

    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ticketText, width / 2, tBadgeY + tBadgeH / 2 + 1);
    ctx.restore();

    // Ligne 4 : Capsule Spéciale Code Parrain (Sublime et très lisible)
    ctx.save();
    const refCode = (params.referralCode || 'DS-GTA6').toUpperCase();
    const refText = `CODE PARRAIN : ${refCode}`;
    ctx.font = '900 uppercase 32px "Montserrat", sans-serif';
    const refW = ctx.measureText(refText).width + 64;
    const refH = 62;
    const refX = (width - refW) / 2;
    const refY = cardY + 252;

    ctx.fillStyle = 'rgba(255, 230, 0, 0.15)';
    ctx.beginPath();
    ctx.roundRect(refX, refY, refW, refH, 18);
    ctx.fill();

    ctx.strokeStyle = '#ffe600';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(255, 230, 0, 0.6)';
    ctx.shadowBlur = 14;
    ctx.stroke();

    ctx.fillStyle = '#ffe600';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 8;
    ctx.fillText(refText, width / 2, refY + refH / 2 + 1);
    ctx.restore();

    // Mention parrainage sous la capsule
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '800 uppercase 18px "Montserrat", sans-serif';
    ctx.fillStyle = 'rgba(255, 230, 0, 0.85)';
    ctx.fillText('⚡ PARTAGE CE CODE POUR PARRAINER TES AMIS', width / 2, cardY + 345);
    ctx.restore();

    // =========================================================================
    // 7. FOOTER CALL-TO-ACTION (Propre et Aéré)
    // =========================================================================
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '900 italic 34px "Montserrat", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 240, 255, 0.7)';
    ctx.shadowBlur = 16;
    ctx.fillText('PARTICIPE SUR DROPSIDERS.FR', width / 2, 1750);

    ctx.font = '800 uppercase 23px "Montserrat", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 8;
    ctx.fillText('LIEN DISPONIBLE EN BIO OU EN STORY 🔗', width / 2, 1805);
    ctx.restore();

    return canvas.toDataURL('image/png');
}
