/**
 * PromoPhone3DRenderer.ts
 * Moteur de rendu Canvas haute définition pour le style Promo Smartphone 3D de Dropsiders.
 * Rendu Post 4:5 / Reel avec perspective 3D, animation Follow, lévitation et reflets.
 */

export interface PromoPhone3DOptions {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    isReel: boolean;
    tAnim: number;
    isStaticPreview: boolean;
    activeColor: { grad: string; color: string };
    effectiveHeadline: string;
    effectiveSubphrase: string;
    qLines: string[];
    qLineHeight: number;
    questionFontSize: number;
    promoFollowersCount: number;
    promoPostsCount: number;
    applyTextAnimCtx: (ctx: CanvasRenderingContext2D, delay: number, anchorX: number, anchorY: number) => void;
    imageCache: Record<string, HTMLImageElement>;
}

// Couleurs dégradé officiel Stories Instagram
const IG_GRADIENT_STOPS: [number, string][] = [
    [0.0, '#ffd600'],
    [0.25, '#ff7800'],
    [0.60, '#ff1493'],
    [1.0, '#9400d3']
];


// Paths vectoriels SVG officiels pour les logos du dock réseaux sociaux
interface SocialPaths {
    igPath: Path2D;
    ytBodyPath: Path2D;
    ytPlayPath: Path2D;
    ttPath1: Path2D;
    ttPath2: Path2D;
}

let socialPathsCache: SocialPaths | null = null;

function getSocialPaths(): SocialPaths | null {
    if (typeof Path2D === 'undefined') return null;
    if (!socialPathsCache) {
        socialPathsCache = {
            igPath: new Path2D("M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"),
            ytBodyPath: new Path2D("M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"),
            ytPlayPath: new Path2D("M9.545 15.568V8.432L15.818 12l-6.273 3.568z"),
            ttPath1: new Path2D("M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.89 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.31 0 .6.05.88.13V9.4a6.84 6.84 0 0 0-.88-.06A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"),
            ttPath2: new Path2D("M20.63 6.79a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.31 0 .6.05.88.13V9.4a6.84 6.84 0 0 0-.88-.06A6.33 6.33 0 0 0 4.96 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4z")
        };
    }
    return socialPathsCache;
}

function drawSocialIcon(ctx: CanvasRenderingContext2D, netName: string, iconX: number, iconCenterY: number, size: number, isActive: boolean) {
    const paths = getSocialPaths();
    if (!paths) return;

    ctx.save();
    ctx.translate(iconX, iconCenterY - size / 2);
    ctx.scale(size / 24, size / 24);

    if (netName === 'Instagram') {
        ctx.fillStyle = isActive ? '#E1306C' : 'rgba(255, 255, 255, 0.85)';
        ctx.fill(paths.igPath);
    } else if (netName === 'TikTok') {
        ctx.fillStyle = '#69C9D0';
        ctx.fill(paths.ttPath1);
        ctx.fillStyle = isActive ? '#010101' : '#ffffff';
        ctx.globalAlpha = isActive ? 0.85 : 0.95;
        ctx.fill(paths.ttPath2);
    } else if (netName === 'YouTube') {
        ctx.fillStyle = '#FF0000';
        ctx.fill(paths.ytBodyPath);
        ctx.fillStyle = '#ffffff';
        ctx.fill(paths.ytPlayPath);
    }

    ctx.restore();
}

export function renderPromoPhone3D(opts: PromoPhone3DOptions) {
    const {
        ctx,
        canvas,
        isReel,
        tAnim,
        isStaticPreview,
        activeColor,
        effectiveHeadline,
        effectiveSubphrase,
        qLines,
        promoFollowersCount,
        promoPostsCount,
        applyTextAnimCtx,
        imageCache
    } = opts;

    // Échelle de conversion depuis la référence 520px vers la résolution réelle du canvas
    const baseWidth = 520;
    const s = canvas.width / baseWidth;

    // Voile sombre équilibré (50% d'opacité) pour un parfait compromis lisibilité / visibilité de la photo
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.60)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Lueur d'ambiance thème diffusée derrière le smartphone
    const glowX = canvas.width * 0.75;
    const glowY = canvas.height * 0.55;
    const glowR = canvas.width * 0.65;
    const radialGlow = ctx.createRadialGradient(glowX, glowY, 40 * s, glowX, glowY, glowR);
    radialGlow.addColorStop(0, `rgba(${activeColor.grad}, 0.42)`);
    radialGlow.addColorStop(0.45, `rgba(${activeColor.grad}, 0.14)`);
    radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // ==========================================
    // 1. QUESTION ÉDITORIALE (Haut, Centrée)
    // ==========================================
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 20 * s;

    const qY = (isReel ? 120 : 68) * s;
    const qFontSize = (isReel ? 24 : 22) * s;
    ctx.font = `900 italic ${qFontSize}px "Montserrat", sans-serif`;

    qLines.forEach((line, idx) => {
        ctx.save();
        applyTextAnimCtx(ctx, 0.12 + idx * 0.08, canvas.width / 2, qY + idx * (qFontSize * 1.25));
        ctx.fillStyle = '#ffffff';
        ctx.fillText(line, canvas.width / 2, qY + idx * (qFontSize * 1.25));
        ctx.restore();
    });

    ctx.restore();

    // ==========================================
    // 2. BLOC TYPOGRAPHIQUE ASYMÉTRIQUE (Gauche)
    // ==========================================
    const leftTextX = (isReel ? 30 : 24) * s;
    const leftTextWidth = 215 * s;
    const leftTextY = (isReel ? 340 : 275) * s;

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // 2.1 Phrase Principale
    const headlineFontSize = (isReel ? 20 : 18) * s;
    ctx.font = `900 italic ${headlineFontSize}px "Montserrat", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 1)';
    ctx.shadowBlur = 18 * s;

    // Découpage automatique en lignes si besoin
    const words = effectiveHeadline.split(' ');
    const headlineLines: string[] = [];
    let currentLine = '';
    words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width > leftTextWidth && currentLine) {
            headlineLines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });
    if (currentLine) headlineLines.push(currentLine);

    let curY = leftTextY;
    headlineLines.forEach((line, idx) => {
        ctx.save();
        applyTextAnimCtx(ctx, 0.15 + idx * 0.08, leftTextX, curY);
        ctx.fillText(line, leftTextX, curY);
        ctx.restore();
        curY += headlineFontSize * 1.22;
    });

    curY += 8 * s;

    // 2.2 Barre d'accent néon couleur active
    ctx.save();
    applyTextAnimCtx(ctx, 0.45, leftTextX, curY);
    ctx.beginPath();
    ctx.roundRect(leftTextX, curY, 48 * s, 3.5 * s, 2 * s);
    ctx.fillStyle = activeColor.color;
    ctx.shadowColor = activeColor.color;
    ctx.shadowBlur = 12 * s;
    ctx.fill();
    ctx.restore();

    curY += 12 * s;

    // 2.3 "ABONNE-TOI À"
    const subFontSize = (isReel ? 12 : 11.5) * s;
    ctx.save();
    applyTextAnimCtx(ctx, 0.65, leftTextX, curY);
    ctx.font = `700 ${subFontSize}px "Montserrat", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 8 * s;
    ctx.fillText('ABONNE-TOI À', leftTextX, curY);
    ctx.restore();

    curY += subFontSize * 1.35;

    // 2.4 "DROPSIDERS" en Orbitron néon éclatant
    const brandFontSize = (isReel ? 28 : 26) * s;
    ctx.save();
    applyTextAnimCtx(ctx, 0.85, leftTextX, curY);
    ctx.font = `900 italic ${brandFontSize}px "Orbitron", sans-serif`;
    ctx.fillStyle = activeColor.color;
    ctx.shadowColor = activeColor.color;
    ctx.shadowBlur = 20 * s;
    ctx.fillText('DROPSIDERS', leftTextX, curY);
    ctx.restore();

    ctx.restore();

    // ==========================================
    // 3. LE SMARTPHONE 3D (Droite)
    // ==========================================
    // Dimensions du téléphone calibrées au ratio
    const phoneW = 228 * s;
    const phoneH = 472 * s;
    const phoneRight = ((isReel ? 20 : 12) + 1) * s; // Déplacé de 1px vers la gauche
    const phoneBottom = (isReel ? 90 : 72) * s; // Position optimale, téléphone éloigné du dock
    const phoneBaseX = canvas.width - phoneRight - phoneW;
    const phoneBaseY = canvas.height - phoneBottom - phoneH;

    // Lévitation flottante douce et balancement 3D naturel (haut/bas + gauche/droite + inclinaison tilt)
    const phaseY = (tAnim / 4.2) * Math.PI * 2;
    const phaseX = (tAnim / 3.6) * Math.PI * 2;
    const floatOffsetY = isStaticPreview ? 0 : Math.sin(phaseY) * (4.5 * s);
    const floatOffsetX = isStaticPreview ? 0 : Math.sin(phaseX) * (3.5 * s);
    const phoneX = phoneBaseX + floatOffsetX;
    const phoneY = phoneBaseY + floatOffsetY;

    // Tilt dynamique : oscille entre gauche et droite (~ ±1.6°) en synchronisation avec le balancement
    const dynamicTilt = isStaticPreview ? -0.015 : -0.015 + Math.sin(phaseX) * 0.028;

    ctx.save();

    // Légère rotation 3D perspective avec inclinaison gauche/droite vivante
    ctx.translate(phoneX + phoneW / 2, phoneY + phoneH / 2);
    ctx.rotate(dynamicTilt);
    ctx.translate(-(phoneX + phoneW / 2), -(phoneY + phoneH / 2));

    // 3.0 Lueur ambiante néon douce couleur thème autour du smartphone (halo élégant & non agressif)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(phoneX, phoneY, phoneW, phoneH, 38 * s);
    ctx.shadowColor = `rgba(${activeColor.grad}, 0.65)`;
    ctx.shadowBlur = 45 * s;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = `rgba(${activeColor.grad}, 0.22)`;
    ctx.fill();
    ctx.restore();

    // 3.1 Ombre portée profonde du smartphone (profondeur 3D)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(phoneX, phoneY, phoneW, phoneH, 38 * s);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.92)';
    ctx.shadowBlur = 42 * s;
    ctx.shadowOffsetX = -14 * s;
    ctx.shadowOffsetY = 18 * s;
    ctx.fillStyle = '#0a0a0f';
    ctx.fill();
    ctx.restore();

    // 3.2 Corps titane sombre biseauté
    ctx.beginPath();
    ctx.roundRect(phoneX, phoneY, phoneW, phoneH, 38 * s);
    const phoneGrad = ctx.createLinearGradient(phoneX, phoneY, phoneX + phoneW, phoneY + phoneH);
    phoneGrad.addColorStop(0, '#3a3b47');
    phoneGrad.addColorStop(0.4, '#202130');
    phoneGrad.addColorStop(1, '#0c0d14');
    ctx.fillStyle = phoneGrad;
    ctx.fill();

    // Contour extérieur fin
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();

    // Boutons latéraux
    ctx.fillStyle = '#3a3b45';
    // Volume haut / bas (gauche)
    ctx.fillRect(phoneX - 3 * s, phoneY + 90 * s, 3 * s, 22 * s);
    ctx.fillRect(phoneX - 3 * s, phoneY + 122 * s, 3 * s, 22 * s);
    // Power (droite)
    ctx.fillRect(phoneX + phoneW, phoneY + 108 * s, 3 * s, 34 * s);

    // 3.3 Écran OLED intérieur
    const pad = 7 * s;
    const screenX = phoneX + pad;
    const screenY = phoneY + pad;
    const screenW = phoneW - pad * 2;
    const screenH = phoneH - pad * 2;
    const screenRadius = 30 * s;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(screenX, screenY, screenW, screenH, screenRadius);
    ctx.clip(); // Masque de l'écran

    // Fond noir OLED
    ctx.fillStyle = '#000000';
    ctx.fillRect(screenX, screenY, screenW, screenH);

    // Reflet spéculaire traversant
    const glareProgress = isStaticPreview ? 0.35 : ((tAnim * 0.18) % 1.0);
    const glareX = screenX - screenW + glareProgress * (screenW * 3);
    const glareGrad = ctx.createLinearGradient(glareX, screenY, glareX + 120 * s, screenY + screenH);
    glareGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    glareGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
    glareGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glareGrad;
    ctx.fillRect(screenX, screenY, screenW, screenH);

    // ==========================================
    // STATUS BAR
    // ==========================================
    const statusY = screenY + 6 * s;
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${7 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Heure d'export réelle
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    ctx.fillText(timeStr, screenX + 10 * s, statusY);

    // Dynamic Island
    const islandW = 44 * s;
    const islandH = 11 * s;
    const islandX = screenX + (screenW - islandW) / 2;
    ctx.beginPath();
    ctx.roundRect(islandX, statusY, islandW, islandH, 6 * s);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1 * s;
    ctx.stroke();

    // 5G & Batterie
    ctx.textAlign = 'right';
    ctx.font = `700 ${6.5 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillText('5G', screenX + screenW - 20 * s, statusY);
    // Icône batterie
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1 * s;
    ctx.strokeRect(screenX + screenW - 17 * s, statusY + 1 * s, 12 * s, 7 * s);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(screenX + screenW - 15 * s, statusY + 2.5 * s, 8 * s, 4 * s);

    // ==========================================
    // HEADER INSTAGRAM : dropsiders.fr
    // ==========================================
    const igHeaderY = statusY + 16 * s;
    ctx.textAlign = 'left';
    ctx.font = `900 ${9 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('dropsiders.fr', screenX + 10 * s, igHeaderY);

    // Ligne séparatrice fine
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 0.5 * s;
    ctx.beginPath();
    ctx.moveTo(screenX, igHeaderY + 13 * s);
    ctx.lineTo(screenX + screenW, igHeaderY + 13 * s);
    ctx.stroke();

    // ==========================================
    // AVATAR + STATS DU PROFIL
    // ==========================================
    const profileRowY = igHeaderY + 19 * s;
    const avatarSize = 42 * s;
    const avatarX = screenX + 10 * s;

    // Anneau Stories Instagram dégradé officiel (1 seul ring, propre)
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, profileRowY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    const ringGrad = ctx.createLinearGradient(avatarX, profileRowY, avatarX + avatarSize, profileRowY + avatarSize);
    IG_GRADIENT_STOPS.forEach(([pos, col]) => ringGrad.addColorStop(pos, col));
    ctx.fillStyle = ringGrad;
    ctx.fill();

    // Fond noir intérieur de l'anneau
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, profileRowY + avatarSize / 2, avatarSize / 2 - 2 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.clip();

    // Image de l'avatar officiel Dropsiders (sans double cercle)
    const avatarImg = imageCache['/images/instagram/avatar_clean.png'] || imageCache['/Logo.png'];
    if (avatarImg && avatarImg.complete) {
        ctx.drawImage(avatarImg, avatarX + 2 * s, profileRowY + 2 * s, avatarSize - 4 * s, avatarSize - 4 * s);
    }
    ctx.restore();

    // Stats officielles
    const statsStartX = avatarX + avatarSize + 10 * s;
    const statsWidth = screenW - (avatarSize + 24 * s);
    const statColW = statsWidth / 3;

    // Follow conditionnel à 1.5s
    const isFollowed = isStaticPreview || tAnim >= 1.5;
    const displayFollowers = isFollowed ? (promoFollowersCount + 1) : promoFollowersCount;

    const statsData = [
        { val: promoPostsCount.toLocaleString('fr-FR'), lbl: 'Posts' },
        { val: displayFollowers.toLocaleString('fr-FR'), lbl: 'Abonnés' },
        { val: '668', lbl: 'Abonn.' }
    ];

    statsData.forEach((st, idx) => {
        const sx = statsStartX + statColW * idx + statColW / 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Valeur du compteur
        ctx.font = `900 ${8.5 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = (idx === 1 && isFollowed) ? '#4ade80' : '#ffffff';
        if (idx === 1 && isFollowed) {
            ctx.shadowColor = 'rgba(74, 222, 128, 0.8)';
            ctx.shadowBlur = 8 * s;
        } else {
            ctx.shadowBlur = 0;
        }
        ctx.fillText(st.val, sx, profileRowY + 7 * s);
        ctx.shadowBlur = 0;

        // Label
        ctx.font = `600 ${5.5 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = '#9ca3af';
        ctx.fillText(st.lbl, sx, profileRowY + 18 * s);
    });

    // ==========================================
    // BIO DU COMPTE DROPSIDERS
    // ==========================================
    const bioY = profileRowY + avatarSize + 6 * s;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `900 ${7.5 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('DROPSIDERS', screenX + 10 * s, bioY);

    // Badge certifié bleu
    const certifX = screenX + 10 * s + ctx.measureText('DROPSIDERS').width + 4 * s;
    ctx.beginPath();
    ctx.arc(certifX + 3.5 * s, bioY + 4 * s, 3.5 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#3897f0';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${4.5 * s}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('✓', certifX + 3.5 * s, bioY + 2.5 * s);

    // Description bio
    ctx.textAlign = 'left';
    ctx.font = `500 ${6 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText("La 1ère plateforme interactive dédiée à l'électro & aux festivals 🔥", screenX + 10 * s, bioY + 10 * s);
    ctx.font = `700 ${6 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = '#60a5fa';
    ctx.fillText('🔗 dropsiders.fr', screenX + 10 * s, bioY + 18 * s);

    // ==========================================
    // BOUTON SUIVRE (ANIMÉ À 1.5s + SHOCKWAVE)
    // ==========================================
    const btnY = bioY + 28 * s;
    const btnW = screenW - 20 * s;
    const btnH = 17 * s;
    const btnX = screenX + 10 * s;

    // Enfoncement du bouton entre 1.45s et 1.6s
    const isPressing = !isStaticPreview && tAnim >= 1.45 && tAnim < 1.65;
    const btnScale = isPressing ? 0.94 : 1.0;
    const btnCenterX = btnX + btnW / 2;
    const btnCenterY = btnY + btnH / 2;

    ctx.save();
    if (btnScale !== 1.0) {
        ctx.translate(btnCenterX, btnCenterY);
        ctx.scale(btnScale, btnScale);
        ctx.translate(-btnCenterX, -btnCenterY);
    }

    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 6 * s);
    if (isFollowed) {
        ctx.fillStyle = '#1f2026';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = 1 * s;
        ctx.stroke();

        // Label "✓ Suivi ▾"
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `900 ${7.5 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = '#4ade80';
        ctx.fillText('✓ Suivi ▾', btnCenterX, btnCenterY);
    } else {
        ctx.fillStyle = '#0095f6';
        ctx.shadowColor = 'rgba(0, 149, 246, 0.5)';
        ctx.shadowBlur = 8 * s;
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `900 ${8 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.fillText('Suivre', btnCenterX, btnCenterY);
    }
    ctx.restore();

    // Shockwave néon circulaire
    if (!isStaticPreview && tAnim >= 1.5 && tAnim < 2.2) {
        const waveP = (tAnim - 1.5) / 0.7;
        const waveR = (btnH / 2) + waveP * (60 * s);
        const waveA = (1 - waveP) * 0.9;
        ctx.save();
        ctx.beginPath();
        ctx.arc(btnCenterX, btnCenterY, waveR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${activeColor.grad}, ${waveA})`;
        ctx.lineWidth = 2.5 * s;
        ctx.shadowColor = activeColor.color;
        ctx.shadowBlur = 14 * s;
        ctx.stroke();
        ctx.restore();
    }

    // ==========================================
    // HIGHLIGHTS DU COMPTE OFFICIEL
    // ==========================================
    const hlRowY = btnY + btnH + 8 * s;
    const hlItems = [
        { url: '/images/instagram/hl_circle_escape.png', lbl: 'Escape 26' },
        { url: '/images/instagram/hl_circle_guetta.png', lbl: 'David Guetta' },
        { url: '/images/instagram/hl_circle_electra.png', lbl: 'Electra 2026' },
        { url: '/images/instagram/hl_circle_edc.png', lbl: 'EDC Week' }
    ];

    const hlSize = 25 * s;
    const hlColW = screenW / hlItems.length;

    hlItems.forEach((hl, idx) => {
        const hx = screenX + hlColW * idx + (hlColW - hlSize) / 2;
        const hlImg = imageCache[hl.url];
        if (hlImg && hlImg.complete) {
            ctx.drawImage(hlImg, hx, hlRowY, hlSize, hlSize);
        } else {
            ctx.beginPath();
            ctx.arc(hx + hlSize / 2, hlRowY + hlSize / 2, hlSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = '#222';
            ctx.fill();
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = `700 ${5 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = '#9ca3af';
        ctx.fillText(hl.lbl, hx + hlSize / 2, hlRowY + hlSize + 2 * s);
    });

    // Ligne sous les highlights
    const postGridY = hlRowY + hlSize + 11 * s;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 0.5 * s;
    ctx.beginPath();
    ctx.moveTo(screenX, postGridY);
    ctx.lineTo(screenX + screenW, postGridY);
    ctx.stroke();

    // ==========================================
    // GRILLE DE 6 POSTS COMPLETS SANS SUR-ZOOM
    // ==========================================
    const gridCols = 3;
    const gridRows = 2;
    const gridGap = 1.5 * s;
    const cellW = (screenW - gridGap * (gridCols - 1)) / gridCols;
    const cellH = (screenH - (postGridY - screenY) - gridGap) / gridRows;

    const postUrls = [
        '/images/instagram/post_full_1.jpg',
        '/images/instagram/post_full_2.jpg',
        '/images/instagram/post_full_3.jpg',
        '/images/instagram/post_full_4.jpg',
        '/images/instagram/post_full_5.jpg',
        '/images/instagram/post_full_6.jpg'
    ];

    postUrls.forEach((pUrl, idx) => {
        const col = idx % gridCols;
        const row = Math.floor(idx / gridCols);
        const px = screenX + col * (cellW + gridGap);
        const py = postGridY + 1 * s + row * (cellH + gridGap);

        ctx.fillStyle = '#111111';
        ctx.fillRect(px, py, cellW, cellH);

        const pImg = imageCache[pUrl];
        if (pImg && pImg.complete) {
            ctx.drawImage(pImg, px, py, cellW, cellH);
        }
    });

    ctx.restore(); // Fin clip écran
    ctx.restore(); // Fin perspective smartphone

    // ==========================================
    // 4. DOCK RÉSEAUX SOCIAUX COMPACT ET CENTRÉ
    // ==========================================
    const dockW = 380 * s;
    const dockH = 28 * s;
    const dockX = (canvas.width - dockW) / 2;
    const dockY = canvas.height - (isReel ? 48 : 20) * s - dockH;

    ctx.save();
    // Capsule fond sombre
    ctx.beginPath();
    ctx.roundRect(dockX, dockY, dockW, dockH, dockH / 2);
    ctx.fillStyle = 'rgba(10, 10, 14, 0.94)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 18 * s;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1 * s;
    ctx.stroke();

    // Label SUIS-NOUS fixe à gauche
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${7 * s}px "Montserrat", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SUIS-NOUS', dockX + 12 * s, dockY + dockH / 2);

    // Séparateur vertical
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(dockX + 68 * s, dockY + 6 * s);
    ctx.lineTo(dockX + 68 * s, dockY + dockH - 6 * s);
    ctx.stroke();

    // 3 Réseaux avec pilule blanche glissante
    const nets = [
        { name: 'Instagram', handle: '@dropsiders.fr', color: '#E1306C' },
        { name: 'TikTok', handle: '@dropsiders.fr', color: '#00f2fe' },
        { name: 'YouTube', handle: '@dropsiders', color: '#ff0000' }
    ];

    // Calcul de l'index actif (cycle 8.0s)
    const activeNetIdx = isStaticPreview ? 0 : Math.floor((tAnim / 2.66) % 3);
    const netsStartX = dockX + 74 * s;
    const netsAreaW = dockW - 78 * s;
    const netItemW = netsAreaW / 3;

    // Dessin de la pilule blanche glissante sous le réseau actif
    const pillTargetX = netsStartX + activeNetIdx * netItemW + 2 * s;
    const pillW = netItemW - 4 * s;
    const pillH = dockH - 6 * s;
    const pillY = dockY + 3 * s;

    ctx.beginPath();
    ctx.roundRect(pillTargetX, pillY, pillW, pillH, pillH / 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 6 * s;
    ctx.fill();

    // Rendu des 3 handles avec leurs logos officiels devant le @
    nets.forEach((net, idx) => {
        const nx = netsStartX + idx * netItemW + netItemW / 2;
        const isActive = idx === activeNetIdx;

        ctx.font = `800 ${7.5 * s}px -apple-system, BlinkMacSystemFont, "Montserrat", sans-serif`;
        const textMetrics = ctx.measureText(net.handle);
        const textW = textMetrics.width;
        const iconSize = 11.5 * s;
        const gap = 4 * s;
        const totalW = iconSize + gap + textW;
        const startX = nx - totalW / 2;

        // Dessin du logo officiel
        drawSocialIcon(ctx, net.name, startX, dockY + dockH / 2, iconSize, isActive);

        // Dessin du texte @handle
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isActive ? '#111111' : 'rgba(255, 255, 255, 0.75)';
        ctx.fillText(net.handle, startX + iconSize + gap, dockY + dockH / 2);
    });

    ctx.restore();
}

