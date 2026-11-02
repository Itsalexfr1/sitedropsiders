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

    // Voile sombre léger (40% d'opacité) pour laisser la photo de fond de Slide 1 parfaitement visible
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Lueur d'ambiance thème diffusée derrière le smartphone
    const glowX = canvas.width * 0.75;
    const glowY = canvas.height * 0.55;
    const glowR = canvas.width * 0.65;
    const radialGlow = ctx.createRadialGradient(glowX, glowY, 40 * s, glowX, glowY, glowR);
    radialGlow.addColorStop(0, `rgba(${activeColor.grad}, 0.28)`);
    radialGlow.addColorStop(0.45, `rgba(${activeColor.grad}, 0.06)`);
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
    const phoneBottom = (isReel ? 90 : 54) * s;
    const phoneX = canvas.width - phoneRight - phoneW;
    const phoneBaseY = canvas.height - phoneBottom - phoneH;

    // Lévitation flottante douce (période 4.5s)
    const floatOffset = isStaticPreview ? 0 : Math.sin((tAnim / 4.5) * Math.PI * 2) * (4 * s);
    const phoneY = phoneBaseY + floatOffset;

    ctx.save();

    // Légère rotation 3D perspective
    ctx.translate(phoneX + phoneW / 2, phoneY + phoneH / 2);
    ctx.rotate(-0.015); // ~0.9° tilt subtil pour le look 3D réaliste
    ctx.translate(-(phoneX + phoneW / 2), -(phoneY + phoneH / 2));

    // 3.1 Ombre portée profonde du smartphone
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(phoneX, phoneY, phoneW, phoneH, 38 * s);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 45 * s;
    ctx.shadowOffsetX = -16 * s;
    ctx.shadowOffsetY = 20 * s;
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

    // Rendu des 3 handles
    nets.forEach((net, idx) => {
        const nx = netsStartX + idx * netItemW + netItemW / 2;
        const isActive = idx === activeNetIdx;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `800 ${7.5 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = isActive ? '#111111' : 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(net.handle, nx, dockY + dockH / 2);
    });

    ctx.restore();
}

