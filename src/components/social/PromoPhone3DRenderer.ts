/**
 * PromoPhone3DRenderer.ts
 * Moteur de rendu Canvas haute définition pour le style Promo Smartphone 3D de Dropsiders.
 * Rendu Post 4:5 / Reel avec perspective 3D, profils ultra-réalistes Instagram, TikTok et YouTube,
 * vraies publications et vidéos de Dropsiders, et dock avec cadre glissant fluide.
 */

export interface PromoSocialProfiles {
    instagram?: {
        handle?: string;
        name?: string;
        followers?: number;
        posts?: number;
        following?: number;
        bio?: string;
    };
    tiktok?: {
        handle?: string;
        name?: string;
        followers?: number;
        likes?: number;
        following?: number;
        bio?: string;
    };
    youtube?: {
        handle?: string;
        name?: string;
        subscribers?: number;
        videos?: number;
        bio?: string;
    };
}

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
    socialProfiles?: PromoSocialProfiles;
    previewNetwork?: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE';
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

/**
 * Dessin d'un logo réseau social :
 * - Actif sous le cadre blanc -> couleurs officielles vives
 * - En dehors du cadre blanc -> monochrome éteint (aucun résidu de couleur)
 */
function drawSocialIcon(
    ctx: CanvasRenderingContext2D,
    netName: string,
    iconX: number,
    iconCenterY: number,
    size: number,
    activeProgress: number
) {
    const paths = getSocialPaths();
    if (!paths) return;

    ctx.save();
    ctx.translate(iconX, iconCenterY - size / 2);
    ctx.scale(size / 24, size / 24);

    if (netName === 'Instagram') {
        if (activeProgress > 0.05) {
            ctx.fillStyle = '#E1306C';
            ctx.globalAlpha = activeProgress;
            ctx.fill(paths.igPath);
        }
        if (activeProgress < 0.95) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
            ctx.globalAlpha = 1 - activeProgress;
            ctx.fill(paths.igPath);
        }
    } else if (netName === 'TikTok') {
        if (activeProgress > 0.05) {
            ctx.globalAlpha = activeProgress;
            ctx.fillStyle = '#25F4EE';
            ctx.fill(paths.ttPath1);
            ctx.fillStyle = '#FE2C55';
            ctx.fill(paths.ttPath2);
            ctx.fillStyle = '#010101';
            ctx.globalAlpha = activeProgress * 0.92;
            ctx.fill(paths.ttPath2);
        }
        if (activeProgress < 0.95) {
            ctx.globalAlpha = 1 - activeProgress;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
            ctx.fill(paths.ttPath1);
            ctx.fill(paths.ttPath2);
        }
    } else if (netName === 'YouTube') {
        if (activeProgress > 0.05) {
            ctx.globalAlpha = activeProgress;
            ctx.fillStyle = '#FF0000';
            ctx.fill(paths.ytBodyPath);
            ctx.fillStyle = '#ffffff';
            ctx.fill(paths.ytPlayPath);
        }
        if (activeProgress < 0.95) {
            ctx.globalAlpha = 1 - activeProgress;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
            ctx.fill(paths.ytBodyPath);
            // Découpe sombre du triangle de lecture pour un aspect ajouré net
            ctx.fillStyle = '#0a0a0e';
            ctx.fill(paths.ytPlayPath);
        }
    }

    ctx.restore();
}

/**
 * Status bar iOS épurée
 */
function renderStatusBar(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    screenW: number,
    s: number
) {
    const statusY = screenY + 6 * s;
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${7 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    ctx.fillText(timeStr, screenX + 10 * s, statusY);

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

    ctx.textAlign = 'right';
    ctx.font = `700 ${6.5 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillText('5G', screenX + screenW - 20 * s, statusY);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1 * s;
    ctx.strokeRect(screenX + screenW - 17 * s, statusY + 1 * s, 12 * s, 7 * s);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(screenX + screenW - 15 * s, statusY + 2.5 * s, 8 * s, 4 * s);
}

/**
 * Dessine un avatar Dropsiders net avec bordure et logo blanc officiel
 */
function drawDropsidersAvatar(
    ctx: CanvasRenderingContext2D,
    ax: number,
    ay: number,
    size: number,
    borderCol: string,
    s: number,
    imageCache: Record<string, HTMLImageElement>
) {
    ctx.save();
    // Cercle extérieur avec bordure nette
    ctx.beginPath();
    ctx.arc(ax + size / 2, ay + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#050508';
    ctx.fill();
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 1.8 * s;
    ctx.stroke();

    // Masque circulaire
    ctx.beginPath();
    ctx.arc(ax + size / 2, ay + size / 2, size / 2 - 1.5 * s, 0, Math.PI * 2);
    ctx.clip();

    // Image du logo blanc Dropsiders net
    const logoImg = imageCache['/logo_white_official.png'] || imageCache['/logo_white.png'] || imageCache['/logo.png'] || imageCache['/images/instagram/avatar_clean.png'];
    if (logoImg && logoImg.complete) {
        const p = 5 * s;
        ctx.drawImage(logoImg, ax + p, ay + p, size - p * 2, size - p * 2);
    } else {
        // Fallback texte stylisé si l'image charge encore
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 ${10 * s}px "Montserrat", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('D', ax + size / 2, ay + size / 2);
    }
    ctx.restore();
}

/**
 * Barre de navigation mobile du bas (commune aux applications pour combler le bas)
 */
function renderAppBottomNav(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    s: number,
    appType: 'IG' | 'TK' | 'YT'
) {
    const navH = 24 * s;
    const navY = h - navH;

    ctx.save();
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, navY, w, navH);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 0.5 * s;
    ctx.beginPath();
    ctx.moveTo(0, navY);
    ctx.lineTo(w, navY);
    ctx.stroke();

    ctx.font = `700 ${5.2 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const items = appType === 'YT'
        ? ['Accueil', 'Shorts', '＋', 'Abonnements', 'Vous']
        : appType === 'TK'
        ? ['Accueil', 'Amis', '＋', 'Boîte', 'Profil']
        : ['Accueil', 'Recherche', '＋', 'Reels', 'Profil'];

    const colW = w / items.length;
    items.forEach((label, idx) => {
        const ix = colW * idx + colW / 2;
        const isSelected = idx === (appType === 'YT' ? 3 : items.length - 1);
        ctx.fillStyle = isSelected ? '#ffffff' : '#6b7280';
        ctx.fillText(label, ix, navY + navH / 2);
    });

    ctx.restore();
}

/**
 * 1. PROFIL INSTAGRAM OFFICIEL DROPSIDERS
 */
function renderInstagramScreen(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    s: number,
    tAnim: number,
    isStaticPreview: boolean,
    stats: { followers: number; posts: number; following: number; handle: string },
    imageCache: Record<string, HTMLImageElement>
) {
    ctx.save();
    ctx.translate(x, y);

    // Header : dropsiders.fr
    const headerY = 0;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `900 ${9 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('dropsiders.fr ▾', 10 * s, headerY);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 0.5 * s;
    ctx.beginPath();
    ctx.moveTo(0, headerY + 13 * s);
    ctx.lineTo(w, headerY + 13 * s);
    ctx.stroke();

    // Avatar + Anneau Stories dégradé officiel
    const profileRowY = headerY + 18 * s;
    const avatarSize = 42 * s;
    const avatarX = 10 * s;

    // Anneau Stories
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, profileRowY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    const ringGrad = ctx.createLinearGradient(avatarX, profileRowY, avatarX + avatarSize, profileRowY + avatarSize);
    IG_GRADIENT_STOPS.forEach(([pos, col]) => ringGrad.addColorStop(pos, col));
    ctx.fillStyle = ringGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, profileRowY + avatarSize / 2, avatarSize / 2 - 2 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.clip();

    const logoImg = imageCache['/logo_white_official.png'] || imageCache['/logo_white.png'] || imageCache['/logo.png'];
    if (logoImg && logoImg.complete) {
        ctx.drawImage(logoImg, avatarX + 4 * s, profileRowY + 4 * s, avatarSize - 8 * s, avatarSize - 8 * s);
    }
    ctx.restore();

    // Stats Instagram
    const statsStartX = avatarX + avatarSize + 10 * s;
    const statsWidth = w - (avatarSize + 24 * s);
    const statColW = statsWidth / 3;

    // Follow conditionnel à 1.4s (en aperçu statique, bouton initial bleu "Suivre")
    const isFollowed = !isStaticPreview && tAnim >= 1.4;
    const displayFollowers = isFollowed ? (stats.followers + 1) : stats.followers;

    const statsData = [
        { val: stats.posts.toLocaleString('fr-FR'), lbl: 'Posts' },
        { val: displayFollowers.toLocaleString('fr-FR'), lbl: 'Abonnés' },
        { val: stats.following.toLocaleString('fr-FR'), lbl: 'Abonn.' }
    ];

    statsData.forEach((st, idx) => {
        const sx = statsStartX + statColW * idx + statColW / 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = `900 ${8.5 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = (idx === 1 && isFollowed) ? '#4ade80' : '#ffffff';
        ctx.fillText(st.val, sx, profileRowY + 7 * s);

        ctx.font = `600 ${5.5 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = '#9ca3af';
        ctx.fillText(st.lbl, sx, profileRowY + 18 * s);
    });

    // Bio
    const bioY = profileRowY + avatarSize + 6 * s;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `900 ${7.5 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('DROPSIDERS', 10 * s, bioY);

    const certifX = 10 * s + ctx.measureText('DROPSIDERS').width + 4 * s;
    ctx.beginPath();
    ctx.arc(certifX + 3.5 * s, bioY + 4 * s, 3.5 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#3897f0';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${4.5 * s}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('✓', certifX + 3.5 * s, bioY + 2.5 * s);

    ctx.textAlign = 'left';
    ctx.font = `500 ${6 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText("La 1ère plateforme interactive dédiée à l'électro & aux festivals 🔥", 10 * s, bioY + 10 * s);
    ctx.font = `700 ${6 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = '#60a5fa';
    ctx.fillText('🔗 dropsiders.fr', 10 * s, bioY + 18 * s);

    // Bouton Suivre
    const btnY = bioY + 28 * s;
    const btnW = w - 20 * s;
    const btnH = 17 * s;
    const btnX = 10 * s;
    const btnCenterX = btnX + btnW / 2;
    const btnCenterY = btnY + btnH / 2;

    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 6 * s);
    if (isFollowed) {
        ctx.fillStyle = '#1f2026';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = 1 * s;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `900 ${7.5 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = '#4ade80';
        ctx.fillText('✓ Suivi ▾', btnCenterX, btnCenterY);
    } else {
        ctx.fillStyle = '#0095f6';
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `900 ${8 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Suivre', btnCenterX, btnCenterY);
    }

    // Highlights
    const hlRowY = btnY + btnH + 8 * s;
    const hlItems = [
        { url: '/images/instagram/hl_circle_escape.png', lbl: 'Escape 26' },
        { url: '/images/instagram/hl_circle_guetta.png', lbl: 'David Guetta' },
        { url: '/images/instagram/hl_circle_electra.png', lbl: 'Electra 2026' },
        { url: '/images/instagram/hl_circle_edc.png', lbl: 'EDC Week' }
    ];

    const hlSize = 25 * s;
    const hlColW = w / hlItems.length;

    hlItems.forEach((hl, idx) => {
        const hx = hlColW * idx + (hlColW - hlSize) / 2;
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

    // Grille 6 posts
    const postGridY = hlRowY + hlSize + 11 * s;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 0.5 * s;
    ctx.beginPath();
    ctx.moveTo(0, postGridY);
    ctx.lineTo(w, postGridY);
    ctx.stroke();

    const gridCols = 3;
    const gridRows = 2;
    const gridGap = 1.5 * s;
    const cellW = (w - gridGap * (gridCols - 1)) / gridCols;
    const cellH = (h - 24 * s - postGridY - gridGap) / gridRows;

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
        const px = col * (cellW + gridGap);
        const py = postGridY + 1 * s + row * (cellH + gridGap);

        ctx.fillStyle = '#111111';
        ctx.fillRect(px, py, cellW, cellH);

        const pImg = imageCache[pUrl];
        if (pImg && pImg.complete) {
            ctx.drawImage(pImg, px, py, cellW, cellH);
        }
    });

    // Barre d'onglets du bas de l'application
    renderAppBottomNav(ctx, w, h, s, 'IG');

    ctx.restore();
}

/**
 * 2. PROFIL TIKTOK OFFICIEL DROPSIDERS AVEC LES VRAIES PUBLICATIONS
 */
function renderTiktokScreen(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    s: number,
    tAnim: number,
    isStaticPreview: boolean,
    stats: { followers: number; likes: number; following: number; handle: string },
    imageCache: Record<string, HTMLImageElement>
) {
    ctx.save();
    ctx.translate(x, y);

    // Header : Handle centré avec chevron et notifications
    const headerY = 0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `900 ${9 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${stats.handle || '@dropsiders.fr'} ▾`, w / 2, headerY);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 0.5 * s;
    ctx.beginPath();
    ctx.moveTo(0, headerY + 13 * s);
    ctx.lineTo(w, headerY + 13 * s);
    ctx.stroke();

    // Avatar centré avec halo cyan/magenta TikTok
    const avatarY = headerY + 16 * s;
    const avatarSize = 46 * s;
    const avatarX = (w - avatarSize) / 2;
    drawDropsidersAvatar(ctx, avatarX, avatarY, avatarSize, '#25F4EE', s, imageCache);

    // Titre sous l'avatar : DROPSIDERS ✓
    const nameY = avatarY + avatarSize + 4 * s;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `900 ${8.5 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('DROPSIDERS ✓', w / 2, nameY);

    // Stats officielles TikTok (Abonnements, Abonnés, J'aime)
    const statsY = nameY + 12 * s;
    const statColW = w / 3;

    const isFollowed = !isStaticPreview && tAnim >= 4.7;
    const displayFollowers = isFollowed ? (stats.followers + 1) : stats.followers;

    const formatMetric = (val: number) => {
        if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
        if (val >= 10000) return (val / 1000).toFixed(1) + 'K';
        return val.toLocaleString('fr-FR');
    };

    const tkStats = [
        { val: formatMetric(stats.following), lbl: 'Abonnements' },
        { val: formatMetric(displayFollowers), lbl: 'Abonnés' },
        { val: formatMetric(stats.likes), lbl: "J'aime" }
    ];

    tkStats.forEach((st, idx) => {
        const sx = statColW * idx + statColW / 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = `900 ${8.5 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = (idx === 1 && isFollowed) ? '#25F4EE' : '#ffffff';
        ctx.fillText(st.val, sx, statsY);

        ctx.font = `600 ${5 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = '#9ca3af';
        ctx.fillText(st.lbl, sx, statsY + 10 * s);
    });

    // Bouton Suivre TikTok signature rouge #FE2C55 (aucun flou ni cercle noir)
    const btnY = statsY + 20 * s;
    const btnW = w - 48 * s;
    const btnH = 17 * s;
    const btnX = (w - btnW) / 2;
    const btnCenterX = btnX + btnW / 2;
    const btnCenterY = btnY + btnH / 2;

    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 4 * s);
    if (isFollowed) {
        ctx.fillStyle = '#262626';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = 1 * s;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `900 ${7.5 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('✓ Abonné', btnCenterX, btnCenterY);
    } else {
        ctx.fillStyle = '#FE2C55';
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `900 ${8 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Suivre', btnCenterX, btnCenterY);
    }

    // Bio TikTok
    const bioY = btnY + btnH + 5 * s;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `500 ${5.8 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = '#d1d5db';
    ctx.fillText('⚡ Média Électro N°1 en France | Actus, Livesets & Recaps', w / 2, bioY);
    ctx.font = `700 ${5.8 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = '#60a5fa';
    ctx.fillText('🔗 dropsiders.fr', w / 2, bioY + 8 * s);

    // Onglets TikTok (Grille vidéo active)
    const tabsY = bioY + 18 * s;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 0.5 * s;
    ctx.beginPath();
    ctx.moveTo(0, tabsY);
    ctx.lineTo(w, tabsY);
    ctx.stroke();

    const tabCenter = w / 3 / 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(tabCenter - 10 * s, tabsY + 10 * s, 20 * s, 1.5 * s);

    // LES VRAIES PUBLICATIONS TIKTOK DE DROPSIDERS (avec accroches texte & compteurs réels)
    const vidGridY = tabsY + 14 * s;
    const gridCols = 3;
    const gridRows = 2;
    const gridGap = 1.5 * s;
    const cellW = (w - gridGap * (gridCols - 1)) / gridCols;
    const cellH = (h - 24 * s - vidGridY - gridGap) / gridRows;

    const realTiktoks = [
        {
            img: '/images/gta6_cover.jpg',
            hook: 'CONCOURS GTA 6 + PS5 🎮',
            views: '452.8K',
            isPinned: true
        },
        {
            img: '/assets/galeries/dj-snake-arenes-de-nimes-2025-france/img-1.jpg',
            hook: 'DJ SNAKE AUX ARÈNES 🇫🇷',
            views: '280.4K',
            isPinned: false
        },
        {
            img: '/assets/galeries/john-summit-ushuaia-ibiza-2025-espagne/img-2.jpg',
            hook: 'JOHN SUMMIT À IBIZA 🔥',
            views: '189.6K',
            isPinned: false
        },
        {
            img: '/assets/galeries/tomorrowland-2025-belgique/img-1.jpg',
            hook: 'TOMORROWLAND 2026 ✨',
            views: '340.1K',
            isPinned: false
        },
        {
            img: '/assets/galeries/edc-las-vegas-2025-usa/img-1.jpg',
            hook: 'FEUX D\'ARTIFICE EDC 🎆',
            views: '145.2K',
            isPinned: false
        },
        {
            img: '/assets/galeries/ultra-europe-2025-croatie/img-2.jpg',
            hook: 'THE END OF GENESYS 🤯',
            views: '890.5K',
            isPinned: false
        }
    ];

    realTiktoks.forEach((tk, idx) => {
        const col = idx % gridCols;
        const row = Math.floor(idx / gridCols);
        const px = col * (cellW + gridGap);
        const py = vidGridY + row * (cellH + gridGap);

        ctx.fillStyle = '#111111';
        ctx.fillRect(px, py, cellW, cellH);

        const img = imageCache[tk.img] || imageCache[`/images/instagram/post_full_${idx + 1}.jpg`];
        if (img && img.complete) {
            ctx.drawImage(img, px, py, cellW, cellH);
        }

        // Voile dégradé bas & haut pour les textes TikTok
        const vGrad = ctx.createLinearGradient(px, py, px, py + cellH);
        vGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
        vGrad.addColorStop(0.3, 'rgba(0,0,0,0)');
        vGrad.addColorStop(0.65, 'rgba(0,0,0,0)');
        vGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = vGrad;
        ctx.fillRect(px, py, cellW, cellH);

        // Badge épinglé si besoin
        if (tk.isPinned) {
            ctx.fillStyle = '#FE2C55';
            ctx.fillRect(px + 2 * s, py + 2 * s, 17 * s, 6 * s);
            ctx.fillStyle = '#ffffff';
            ctx.font = `800 ${3.8 * s}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Épinglé', px + 10.5 * s, py + 5 * s);
        }

        // Accroche texte TikTok au milieu
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `900 ${4.5 * s}px "Montserrat", sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(tk.hook, px + cellW / 2, py + cellH / 2);

        // Vues TikTok en bas à gauche
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.font = `800 ${5 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`▶ ${tk.views}`, px + 3 * s, py + cellH - 2 * s);
    });

    // Barre d'onglets du bas de l'application TikTok
    renderAppBottomNav(ctx, w, h, s, 'TK');

    ctx.restore();
}

/**
 * 3. PROFIL YOUTUBE OFFICIEL DROPSIDERS AVEC LES VRAIES VIDÉOS D'INTERVIEWS & SANS CERCLE NOIR
 */
function renderYoutubeScreen(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    s: number,
    tAnim: number,
    isStaticPreview: boolean,
    stats: { subscribers: number; videos: number; handle: string },
    imageCache: Record<string, HTMLImageElement>
) {
    ctx.save();
    ctx.translate(x, y);

    // Bannière YouTube Officielle : vraie photo festival avec incrustation DROPSIDERS
    const bannerH = 50 * s;
    const bannerImg = imageCache['/assets/galeries/tomorrowland-2025-belgique/img-1.jpg'] || imageCache['/Banniere_Fluide_Clean.jpg'];
    if (bannerImg && bannerImg.complete) {
        ctx.drawImage(bannerImg, 0, 0, w, bannerH);
    } else {
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, w, bannerH);
    }

    // Voile sombre sur la bannière avec logo de chaîne en filigrane
    const bGrad = ctx.createLinearGradient(0, 0, 0, bannerH);
    bGrad.addColorStop(0, 'rgba(0,0,0,0.3)');
    bGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = bGrad;
    ctx.fillRect(0, 0, w, bannerH);

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = `900 italic ${9 * s}px "Montserrat", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText('DROPSIDERS', w - 10 * s, bannerH / 2);

    // Avatar circulaire YouTube net avec bordure blanche
    const avatarSize = 40 * s;
    const avatarX = 10 * s;
    const avatarY = bannerH - 14 * s;
    drawDropsidersAvatar(ctx, avatarX, avatarY, avatarSize, '#ffffff', s, imageCache);

    // Titre de la chaîne : DROPSIDERS ✓
    const channelNameY = avatarY + avatarSize + 4 * s;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `900 ${9.5 * s}px "Montserrat", -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('DROPSIDERS', 10 * s, channelNameY);

    const certifX = 10 * s + ctx.measureText('DROPSIDERS').width + 4 * s;
    ctx.beginPath();
    ctx.arc(certifX + 3.5 * s, channelNameY + 4.5 * s, 3.5 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#888888';
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = `900 ${4.5 * s}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('✓', certifX + 3.5 * s, channelNameY + 3 * s);

    // Stats réelles de la chaîne
    const isSubscribed = !isStaticPreview && tAnim >= 8.0;
    const displaySubs = isSubscribed ? (stats.subscribers + 1) : stats.subscribers;

    const formatMetric = (val: number) => {
        if (val >= 10000) return (val / 1000).toFixed(1) + ' k';
        return val.toLocaleString('fr-FR');
    };

    const subInfoY = channelNameY + 12 * s;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `600 ${5.8 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(`${stats.handle || '@dropsiders'} • ${formatMetric(displaySubs)} abonnés • ${stats.videos} vidéos`, 10 * s, subInfoY);

    // Bio YouTube
    const bioY = subInfoY + 8 * s;
    ctx.font = `500 ${5.2 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = '#888888';
    ctx.fillText('Chaîne officielle de Dropsiders. Interviews exclusives & aftermovies.', 10 * s, bioY);

    // Bouton S'abonner officiel YouTube : BLANC PUR éclatant (zéro cercle noir, zéro halo)
    const btnY = bioY + 10 * s;
    const btnW = w - 20 * s;
    const btnH = 17 * s;
    const btnX = 10 * s;
    const btnCenterX = btnX + btnW / 2;
    const btnCenterY = btnY + btnH / 2;

    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, btnH / 2);
    if (isSubscribed) {
        ctx.fillStyle = '#272727';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = 1 * s;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `900 ${7.5 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('✓ Abonné 🔔', btnCenterX, btnCenterY);
    } else {
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `900 ${8 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = '#0f0f0f';
        ctx.fillText("S'abonner", btnCenterX, btnCenterY);
    }

    // Onglets YouTube (Accueil, Vidéos, Shorts)
    const tabsY = btnY + btnH + 5 * s;
    const ytTabs = ['Accueil', 'Vidéos', 'Shorts', 'Playlists'];
    const tabItemW = w / ytTabs.length;

    ytTabs.forEach((tab, idx) => {
        const tx = tabItemW * idx + tabItemW / 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = `700 ${6 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = idx === 1 ? '#ffffff' : '#888888';
        ctx.fillText(tab, tx, tabsY);

        if (idx === 1) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(tx - 10 * s, tabsY + 9 * s, 20 * s, 1.5 * s);
        }
    });

    // LES VRAIES VIDÉOS DE LA CHAÎNE YOUTUBE DE DROPSIDERS (comble 100% de l'écran sans vide)
    const feedY = tabsY + 13 * s;
    const cardW = w - 20 * s;
    const cardH = 58 * s;

    const realYoutubeVideos = [
        {
            thumb: '/assets/galeries/edc-las-vegas-2025-usa/img-1.jpg',
            title: 'EDC Las Vegas : Interview HAYLA',
            sub: 'DROPSIDERS • 18 k vues • il y a 3 mois',
            duration: '14:20'
        },
        {
            thumb: '/assets/galeries/tomorrowland-2025-belgique/img-1.jpg',
            title: 'Tomorrowland Winter : Henri Pfr',
            sub: 'DROPSIDERS • 34 k vues • il y a 5 mois',
            duration: '09:45'
        },
        {
            thumb: '/assets/galeries/john-summit-ushuaia-ibiza-2025-espagne/img-2.jpg',
            title: 'Interview Da Tweekaz - EDC Las Vegas',
            sub: 'DROPSIDERS • 28 k vues • il y a 1 an',
            duration: '12:10'
        },
        {
            thumb: '/assets/galeries/ultra-europe-2025-croatie/img-2.jpg',
            title: 'Aftermovie Tomorrowland by Dropsiders',
            sub: 'DROPSIDERS • 95 k vues • il y a 8 mois',
            duration: '08:30'
        }
    ];

    realYoutubeVideos.forEach((vid, idx) => {
        const vy = feedY + idx * (cardH + 4 * s);
        if (vy + cardH > h - 24 * s) return;

        // Miniature 16:9 haute définition
        const imgH = 38 * s;
        ctx.fillStyle = '#111111';
        ctx.fillRect(10 * s, vy, cardW, imgH);

        const vImg = imageCache[vid.thumb] || imageCache[`/images/instagram/post_full_${idx + 1}.jpg`];
        if (vImg && vImg.complete) {
            ctx.drawImage(vImg, 10 * s, vy, cardW, imgH);
        }

        // Badge durée bas droite
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.roundRect(10 * s + cardW - 19 * s, vy + imgH - 8 * s, 17 * s, 6.5 * s, 2 * s);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `700 ${4 * s}px sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(vid.duration, 10 * s + cardW - 10.5 * s, vy + imgH - 4.8 * s);

        // Titre réel de la vidéo
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = `800 ${6.2 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(vid.title, 10 * s, vy + imgH + 2.5 * s);

        ctx.font = `500 ${5 * s}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = '#888888';
        ctx.fillText(vid.sub, 10 * s, vy + imgH + 10 * s);
    });

    // Barre d'onglets du bas de l'application YouTube
    renderAppBottomNav(ctx, w, h, s, 'YT');

    ctx.restore();
}

/**
 * Rendu principal de la slide promo 3D
 */
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
        imageCache,
        socialProfiles,
        previewNetwork
    } = opts;

    const resolvedProfiles = {
        instagram: {
            handle: socialProfiles?.instagram?.handle || '@dropsiders.fr',
            name: socialProfiles?.instagram?.name || 'DROPSIDERS',
            followers: socialProfiles?.instagram?.followers ?? promoFollowersCount ?? 4698,
            posts: socialProfiles?.instagram?.posts ?? promoPostsCount ?? 1471,
            following: socialProfiles?.instagram?.following ?? 668
        },
        tiktok: {
            handle: socialProfiles?.tiktok?.handle || '@dropsiders.fr',
            name: socialProfiles?.tiktok?.name || 'DROPSIDERS',
            followers: socialProfiles?.tiktok?.followers ?? 14200,
            likes: socialProfiles?.tiktok?.likes ?? 185600,
            following: socialProfiles?.tiktok?.following ?? 210
        },
        youtube: {
            handle: socialProfiles?.youtube?.handle || '@dropsiders',
            name: socialProfiles?.youtube?.name || 'DROPSIDERS',
            subscribers: socialProfiles?.youtube?.subscribers ?? 4820,
            videos: socialProfiles?.youtube?.videos ?? 320
        }
    };

    const baseWidth = 520;
    const s = canvas.width / baseWidth;

    // Voile sombre
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.60)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Lueur d'ambiance
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

    // 1. Question Éditoriale (Haut)
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

    // 2. Bloc Typographique Asymétrique (Gauche)
    const leftTextX = (isReel ? 30 : 24) * s;
    const leftTextWidth = 215 * s;
    const leftTextY = (isReel ? 340 : 275) * s;

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const headlineFontSize = (isReel ? 20 : 18) * s;
    ctx.font = `900 italic ${headlineFontSize}px "Montserrat", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 1)';
    ctx.shadowBlur = 18 * s;

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

    // 3. Le Smartphone 3D (Droite)
    const phoneW = 228 * s;
    const phoneH = 472 * s;
    const phoneRight = ((isReel ? 20 : 12) + 1) * s;
    const phoneBottom = (isReel ? 90 : 72) * s;
    const phoneBaseX = canvas.width - phoneRight - phoneW;
    const phoneBaseY = canvas.height - phoneBottom - phoneH;

    const phaseY = (tAnim / 4.2) * Math.PI * 2;
    const phaseX = (tAnim / 3.6) * Math.PI * 2;
    const floatOffsetY = isStaticPreview ? 0 : Math.sin(phaseY) * (4.5 * s);
    const floatOffsetX = isStaticPreview ? 0 : Math.sin(phaseX) * (3.5 * s);
    const phoneX = phoneBaseX + floatOffsetX;
    const phoneY = phoneBaseY + floatOffsetY;

    const dynamicTilt = isStaticPreview ? -0.015 : -0.015 + Math.sin(phaseX) * 0.028;

    ctx.save();
    ctx.translate(phoneX + phoneW / 2, phoneY + phoneH / 2);
    ctx.rotate(dynamicTilt);
    ctx.translate(-(phoneX + phoneW / 2), -(phoneY + phoneH / 2));

    // Halo extérieur
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(phoneX, phoneY, phoneW, phoneH, 38 * s);
    ctx.shadowColor = `rgba(${activeColor.grad}, 0.65)`;
    ctx.shadowBlur = 45 * s;
    ctx.fillStyle = `rgba(${activeColor.grad}, 0.22)`;
    ctx.fill();
    ctx.restore();

    // Ombre 3D
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

    // Corps titane
    ctx.beginPath();
    ctx.roundRect(phoneX, phoneY, phoneW, phoneH, 38 * s);
    const phoneGrad = ctx.createLinearGradient(phoneX, phoneY, phoneX + phoneW, phoneY + phoneH);
    phoneGrad.addColorStop(0, '#3a3b47');
    phoneGrad.addColorStop(0.4, '#202130');
    phoneGrad.addColorStop(1, '#0c0d14');
    ctx.fillStyle = phoneGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();

    // Boutons
    ctx.fillStyle = '#3a3b45';
    ctx.fillRect(phoneX - 3 * s, phoneY + 90 * s, 3 * s, 22 * s);
    ctx.fillRect(phoneX - 3 * s, phoneY + 122 * s, 3 * s, 22 * s);
    ctx.fillRect(phoneX + phoneW, phoneY + 108 * s, 3 * s, 34 * s);

    // Écran OLED
    const pad = 7 * s;
    const screenX = phoneX + pad;
    const screenY = phoneY + pad;
    const screenW = phoneW - pad * 2;
    const screenH = phoneH - pad * 2;
    const screenRadius = 30 * s;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(screenX, screenY, screenW, screenH, screenRadius);
    ctx.clip();

    ctx.fillStyle = '#000000';
    ctx.fillRect(screenX, screenY, screenW, screenH);

    renderStatusBar(ctx, screenX, screenY, screenW, s);

    // Cycle multi-réseaux 10s
    const cycleTotal = 10.0;
    const slotDuration = cycleTotal / 3;
    const transDuration = 0.52;

    let rawIdx = 0;
    let transitionProgress = 0;
    let nextIdx = 0;
    let pillPos = 0;

    if (isStaticPreview) {
        const mapNet: Record<string, number> = { 'INSTAGRAM': 0, 'TIKTOK': 1, 'YOUTUBE': 2 };
        rawIdx = mapNet[previewNetwork || 'INSTAGRAM'] ?? 0;
        nextIdx = rawIdx;
        transitionProgress = 0;
        pillPos = rawIdx;
    } else {
        const loopTime = (tAnim % cycleTotal + cycleTotal) % cycleTotal;
        const currentSlot = Math.floor(loopTime / slotDuration);
        const slotLocalTime = loopTime - currentSlot * slotDuration;

        rawIdx = currentSlot % 3;
        nextIdx = (rawIdx + 1) % 3;

        const holdDuration = slotDuration - transDuration;
        if (slotLocalTime < holdDuration) {
            transitionProgress = 0;
            pillPos = rawIdx;
        } else {
            const p = (slotLocalTime - holdDuration) / transDuration;
            transitionProgress = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

            if (rawIdx === 2) {
                pillPos = 2 - transitionProgress * 2;
            } else {
                pillPos = rawIdx + transitionProgress;
            }
        }
    }

    const appY = screenY + 22 * s;
    const appH = screenH - 22 * s;

    const renderNetworkScreen = (idx: number, offsetX: number) => {
        if (idx === 0) {
            renderInstagramScreen(
                ctx,
                screenX + offsetX,
                appY,
                screenW,
                appH,
                s,
                tAnim,
                isStaticPreview,
                resolvedProfiles.instagram,
                imageCache
            );
        } else if (idx === 1) {
            renderTiktokScreen(
                ctx,
                screenX + offsetX,
                appY,
                screenW,
                appH,
                s,
                tAnim,
                isStaticPreview,
                resolvedProfiles.tiktok,
                imageCache
            );
        } else if (idx === 2) {
            renderYoutubeScreen(
                ctx,
                screenX + offsetX,
                appY,
                screenW,
                appH,
                s,
                tAnim,
                isStaticPreview,
                resolvedProfiles.youtube,
                imageCache
            );
        }
    };

    if (transitionProgress === 0) {
        renderNetworkScreen(rawIdx, 0);
    } else {
        renderNetworkScreen(rawIdx, -transitionProgress * screenW);
        renderNetworkScreen(nextIdx, (1 - transitionProgress) * screenW);
    }

    // Reflet spéculaire doux
    const glareProgress = isStaticPreview ? 0.35 : ((tAnim * 0.18) % 1.0);
    const glareX = screenX - screenW + glareProgress * (screenW * 3);
    const glareGrad = ctx.createLinearGradient(glareX, screenY, glareX + 120 * s, screenY + screenH);
    glareGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    glareGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
    glareGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glareGrad;
    ctx.fillRect(screenX, screenY, screenW, screenH);

    ctx.restore();
    ctx.restore();

    // 4. Dock Réseaux Sociaux avec Pilule Blanche Glissante
    const dockW = 380 * s;
    const dockH = 28 * s;
    const dockX = (canvas.width - dockW) / 2;
    const dockY = canvas.height - (isReel ? 48 : 20) * s - dockH;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(dockX, dockY, dockW, dockH, dockH / 2);
    ctx.fillStyle = 'rgba(10, 10, 14, 0.94)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 18 * s;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1 * s;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${7 * s}px "Montserrat", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SUIS-NOUS', dockX + 12 * s, dockY + dockH / 2);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(dockX + 68 * s, dockY + 6 * s);
    ctx.lineTo(dockX + 68 * s, dockY + dockH - 6 * s);
    ctx.stroke();

    const nets = [
        { name: 'Instagram', handle: resolvedProfiles.instagram.handle },
        { name: 'TikTok', handle: resolvedProfiles.tiktok.handle },
        { name: 'YouTube', handle: resolvedProfiles.youtube.handle }
    ];

    const netsStartX = dockX + 74 * s;
    const netsAreaW = dockW - 78 * s;
    const netItemW = netsAreaW / 3;

    const pillTargetX = netsStartX + pillPos * netItemW + 2 * s;
    const pillW = netItemW - 4 * s;
    const pillH = dockH - 6 * s;
    const pillY = dockY + 3 * s;

    ctx.beginPath();
    ctx.roundRect(pillTargetX, pillY, pillW, pillH, pillH / 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 6 * s;
    ctx.fill();

    nets.forEach((net, idx) => {
        const nx = netsStartX + idx * netItemW + netItemW / 2;
        const dist = Math.abs(pillPos - idx);
        const activeWeight = Math.max(0, Math.min(1, 1 - dist * 1.6));

        ctx.font = `800 ${7.5 * s}px -apple-system, BlinkMacSystemFont, "Montserrat", sans-serif`;
        const textMetrics = ctx.measureText(net.handle);
        const textW = textMetrics.width;
        const iconSize = 11.5 * s;
        const gap = 4 * s;
        const totalW = iconSize + gap + textW;
        const startX = nx - totalW / 2;

        drawSocialIcon(ctx, net.name, startX, dockY + dockH / 2, iconSize, activeWeight);

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        if (activeWeight > 0.5) {
            ctx.fillStyle = '#111111';
        } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.40 + activeWeight * 0.45})`;
        }
        ctx.fillText(net.handle, startX + iconSize + gap, dockY + dockH / 2);
    });

    ctx.restore();
}
