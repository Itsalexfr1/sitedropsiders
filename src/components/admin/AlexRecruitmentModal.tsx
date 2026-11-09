import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Upload, Volume2, VolumeX, Video, Download, Sparkles, Check, Film, Settings2, Clock, Image as ImageIcon } from 'lucide-react';
// @ts-ignore
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { isSuperAdmin } from '../../utils/auth';

interface AlexRecruitmentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AlexRecruitmentModal: React.FC<AlexRecruitmentModalProps> = ({ isOpen, onClose }) => {
    // ── Vérification stricte Alex ──
    const currentUser = (typeof window !== 'undefined' ? localStorage.getItem('admin_user') || '' : '').toLowerCase().trim();
    const isAlex = isSuperAdmin(currentUser) || currentUser === 'alex' || currentUser === 'alexf' || currentUser === 'itsalexfr1' || currentUser.startsWith('alex');

    // ── Configuration des Durées (Augmentées pour un visionnage confortable) ──
    // Scène 1 : DROPSIDERS RECRUTE
    const [introTitle, setIntroTitle] = useState('DROPSIDERS');
    const [introSubtitle, setIntroSubtitle] = useState('RECRUTE');
    const [introBadge, setIntroBadge] = useState('SAISON 2026');
    const [introDuration, setIntroDuration] = useState(4.5); // Augmenté de 2.8s à 4.5s

    // Scène 2 : Accroche Vibe / Backstages / REJOINS-NOUS
    const [vibeLine1, setVibeLine1] = useState('TU VIBRES AU SON DE LA MUSIQUE ÉLECTRONIQUE ?');
    const [vibeLine2, setVibeLine2] = useState('TU RÊVES DE DÉCOUVRIR LES BACKSTAGES DES MEILLEURS EVENTS DU MONDE ?');
    const [vibeCta, setVibeCta] = useState('⚡ REJOINS-NOUS ! ⚡');
    const [vibeDuration, setVibeDuration] = useState(6.0); // Augmenté de 3.5s à 6.0s (beaucoup de texte)

    // Scène 3 : Profil 1 (Rédacteurs & Journalistes)
    const [p1Tag, setP1Tag] = useState('PROFIL RECHERCHÉ #1');
    const [p1Title, setP1Title] = useState('RÉDACTEURS & JOURNALISTES');
    const [p1Desc, setP1Desc] = useState("Passionné(e) d'électro, capable d'écrire des articles de fond, réaliser des interviews d'artistes et couvrir les plus gros festivals.");
    const [p1Badge, setP1Badge] = useState('🇬🇧 PARLER ANGLAIS EST UN VRAI PLUS');
    const [p1Duration, setP1Duration] = useState(5.5); // Augmenté de 3.5s à 5.5s

    // Scène 4 : Profil 2 (Créateurs de Contenu)
    const [p2Tag, setP2Tag] = useState('PROFIL RECHERCHÉ #2');
    const [p2Title, setP2Title] = useState('CRÉATEURS DE CONTENU');
    const [p2Sub, setP2Sub] = useState('TIKTOK & INSTAGRAM');
    const [p2Desc, setP2Desc] = useState("À l'aise face caméra ou caméra au poing, pour capturer l'énergie des scènes, interviewer le public et produire du contenu viral.");
    const [p2Badge, setP2Badge] = useState('🇬🇧 ANGLAIS APPRÉCIÉ POUR LES INTERVIEWS');
    const [p2Duration, setP2Duration] = useState(5.5); // Augmenté de 3.5s à 5.5s

    // Scène 5 : Contact
    const [contactHeadline, setContactHeadline] = useState('PRÊT(E) À VIVRE LES FESTIVALS DE L\'INTÉRIEUR ?');
    const [contactEmail, setContactEmail] = useState('contact@dropsiders.fr');
    const [contactSite, setContactSite] = useState('dropsiders.fr');
    const [contactDuration, setContactDuration] = useState(5.0); // Augmenté de 3.2s à 5.0s

    // Scène 6 : Outro Finale Logo
    const [logoDuration, setLogoDuration] = useState(4.0); // Augmenté de 2.8s à 4.0s

    // ── Fond Visuel (Vidéo de Fond, Lasers de Concert ou Image Uploadée) ──
    const [bgType, setBgType] = useState<'video' | 'image' | 'lasers'>('video');
    const [bgImageSrc, setBgImageSrc] = useState<string>('');
    const [bgVideoSrc, setBgVideoSrc] = useState<string>('');
    const [bgVideoStartTime, setBgVideoStartTime] = useState<number>(0);
    const [bgVideoDuration, setBgVideoDuration] = useState<number>(0);
    const [isVideoAudioMuted, setIsVideoAudioMuted] = useState<boolean>(true); // Muted par défaut pour autoplay navigateur
    const [bgOverlayOpacity, setBgOverlayOpacity] = useState<number>(0.50);

    // ── Contrôles Lecture Haute Fluidité (60 FPS) ──
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [uiDisplayTime, setUiDisplayTime] = useState<number>(0); // Mis à jour à 10 FPS pour le scrubber sans saccade
    const [activeTab, setActiveTab] = useState<'fond' | 'durees' | 'textes' | 'export'>('fond');

    // ── Export MP4 ──
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [exportProgress, setExportProgress] = useState<number>(0);
    const [exportFps, setExportFps] = useState<number>(60);
    const [exportTimeLeft, setExportTimeLeft] = useState<number>(0);

    // Refs
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const bgImgRef = useRef<HTMLImageElement | null>(null);
    const logoImgRef = useRef<HTMLImageElement | null>(null);
    const logoPureImgRef = useRef<HTMLImageElement | null>(null);

    // Time Tracking Ref pour 60 FPS fluide sans React re-render
    const currentTimeRef = useRef<number>(0);
    const lastTimestampRef = useRef<number>(performance.now());
    const isPlayingRef = useRef<boolean>(true);
    const isExportingRef = useRef<boolean>(false);
    const bgVideoStartTimeRef = useRef<number>(0);
    const lastUiUpdateRef = useRef<number>(0);

    const totalDuration = introDuration + vibeDuration + p1Duration + p2Duration + contactDuration + logoDuration;

    // Synchroniser refs
    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    useEffect(() => {
        bgVideoStartTimeRef.current = bgVideoStartTime;
    }, [bgVideoStartTime]);

    // Charger l'image de fond si l'utilisateur en uploade une
    useEffect(() => {
        if (!bgImageSrc) {
            bgImgRef.current = null;
            return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = bgImageSrc;
        img.onload = () => {
            bgImgRef.current = img;
        };
    }, [bgImageSrc]);

    // Charger le logo Dropsiders officiel (version complète et version pure typographie)
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = '/logo_white.png';
        img.onload = () => {
            logoImgRef.current = img;
        };

        const pureImg = new Image();
        pureImg.crossOrigin = 'anonymous';
        pureImg.src = '/logo_dropsiders_brand_pure.png';
        pureImg.onload = () => {
            logoPureImgRef.current = pureImg;
        };
    }, []);

    // ── Gestionnaire d'Upload Médias (Vidéo ou Image) ──
    const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isVid = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(file.name);
        const blobUrl = URL.createObjectURL(file);

        if (isVid) {
            setBgType('video');
            setBgVideoSrc(blobUrl);
            setBgVideoStartTime(0);
            bgVideoStartTimeRef.current = 0;
            currentTimeRef.current = 0;
            setUiDisplayTime(0);
        } else {
            // Image
            setBgType('image');
            setBgImageSrc(blobUrl);
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = blobUrl;
            img.onload = () => {
                bgImgRef.current = img;
            };
        }
    };

    // Chargement automatique et persistant de la vidéo de fond uploadée
    useEffect(() => {
        if (!bgVideoSrc) return;
        const vid = videoRef.current;
        if (!vid) return;

        vid.src = bgVideoSrc;
        vid.muted = isVideoAudioMuted;
        vid.currentTime = bgVideoStartTimeRef.current;
        vid.load();

        const handleMetadata = () => {
            setBgVideoDuration(vid.duration || 0);
            if (isPlayingRef.current) {
                vid.play().catch(() => {});
            }
        };

        vid.addEventListener('loadedmetadata', handleMetadata);
        return () => {
            vid.removeEventListener('loadedmetadata', handleMetadata);
        };
    }, [bgVideoSrc, isVideoAudioMuted]);

    // Helper: Dessiner du texte multiligne centré
    const drawCenteredWrappedText = (
        ctx: CanvasRenderingContext2D,
        text: string,
        centerX: number,
        startY: number,
        maxWidth: number,
        lineHeight: number
    ): number => {
        const words = text.split(' ');
        let line = '';
        const lines: string[] = [];
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                lines.push(line.trim());
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line.trim());

        // Centrer verticalement l'ensemble des lignes autour de startY
        const totalBlockHeight = (lines.length - 1) * lineHeight;
        const initialY = startY - totalBlockHeight / 2;

        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], centerX, initialY + i * lineHeight);
        }
        return initialY + lines.length * lineHeight;
    };

    // Easing doux pour transition cinématique
    const smoothStep = (t: number): number => {
        const clamped = Math.max(0, Math.min(1, t));
        return clamped * clamped * (3 - 2 * clamped);
    };

    // Calcul de la scène active et transitions fluides
    const getSceneState = (t: number) => {
        const t1 = introDuration;
        const t2 = t1 + vibeDuration;
        const t3 = t2 + p1Duration;
        const t4 = t3 + p2Duration;
        const t5 = t4 + contactDuration;
        const t6 = t5 + logoDuration;

        let sceneIdx = 1;
        let sceneTime = 0;
        let sceneDur = 0;

        if (t < t1) {
            sceneIdx = 1;
            sceneTime = t;
            sceneDur = introDuration;
        } else if (t < t2) {
            sceneIdx = 2;
            sceneTime = t - t1;
            sceneDur = vibeDuration;
        } else if (t < t3) {
            sceneIdx = 3;
            sceneTime = t - t2;
            sceneDur = p1Duration;
        } else if (t < t4) {
            sceneIdx = 4;
            sceneTime = t - t3;
            sceneDur = p2Duration;
        } else if (t < t5) {
            sceneIdx = 5;
            sceneTime = t - t4;
            sceneDur = contactDuration;
        } else {
            sceneIdx = 6;
            sceneTime = t - t5;
            sceneDur = logoDuration;
        }

        // Fondu d'entrée 0.5s et fondu de sortie 0.5s très doux
        const fadeDur = 0.5;
        let alpha = 1.0;
        if (sceneTime < fadeDur) {
            alpha = smoothStep(sceneTime / fadeDur);
        } else if (sceneTime > sceneDur - fadeDur) {
            alpha = smoothStep((sceneDur - sceneTime) / fadeDur);
        }

        // Translation fluide
        const enterY = sceneTime < fadeDur ? (1 - smoothStep(sceneTime / fadeDur)) * 30 : 0;
        const exitY = sceneTime > sceneDur - fadeDur ? ((1 - smoothStep((sceneDur - sceneTime) / fadeDur))) * -25 : 0;
        const translateY = enterY + exitY;

        // Travelling avant cinématique doux (zoom 0.97 -> 1.03)
        const progress = Math.min(1, Math.max(0, sceneTime / Math.max(0.1, sceneDur)));
        const textScale = 0.97 + progress * 0.06;

        return { sceneIdx, sceneTime, sceneDur, alpha, translateY, textScale };
    };

    // ── Dessin de la frame sur le Canvas (1080x1920) ──
    const drawFrame = useCallback((
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        time: number,
        isExport: boolean = false,
        customVideoElem?: HTMLVideoElement | null
    ) => {
        ctx.clearRect(0, 0, width, height);

        // 1. FOND VISUEL (En export MP4 ou si Image : dessiné sur canvas. En live preview : la balise vidéo joue en direct)
        let hasCustomBg = false;

        if (isExport && bgType === 'video') {
            const vid = customVideoElem || videoRef.current;
            if (vid && !isNaN(vid.videoWidth) && vid.videoWidth > 0) {
                const scale = Math.max(width / vid.videoWidth, height / vid.videoHeight);
                const vw = vid.videoWidth * scale;
                const vh = vid.videoHeight * scale;
                const vx = (width - vw) / 2;
                const vy = (height - vh) / 2;
                ctx.drawImage(vid, vx, vy, vw, vh);
                hasCustomBg = true;
            }
        } else if (bgType === 'image' && bgImgRef.current) {
            const img = bgImgRef.current;
            if (img && img.complete && img.naturalWidth > 0) {
                const zoomFactor = 1.0 + (Math.sin(time * 0.15) * 0.5 + 0.5) * 0.04;
                const baseScale = Math.max(width / img.naturalWidth, height / img.naturalHeight) * zoomFactor;
                const iw = img.naturalWidth * baseScale;
                const ih = img.naturalHeight * baseScale;
                const ix = (width - iw) / 2;
                const iy = (height - ih) / 2;
                ctx.drawImage(img, ix, iy, iw, ih);
                hasCustomBg = true;
            }
        }

        // Si aucun fond custom en export ou si mode minimal
        if (isExport && !hasCustomBg) {
            ctx.fillStyle = '#050608';
            ctx.fillRect(0, 0, width, height);
        }

        // 2. VOILE SOMBRE 100% UNIFORME SUR TOUTE LA SURFACE (AUCUNE BANDE CLAIRE EN HAUT/BAS)
        if (isExport) {
            ctx.save();
            ctx.fillStyle = `rgba(0, 0, 0, ${bgOverlayOpacity})`;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }

        // 3. SCÈNE ACTIVE & ANIMATION DU TEXTE (SANS CADRE)
        const { sceneIdx, sceneTime, alpha, translateY, textScale } = getSceneState(time);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(width / 2, height / 2);
        ctx.scale(textScale, textScale);
        ctx.translate(-width / 2, -height / 2 + translateY);

        // ─────────────────────────────────────────────────────────────
        // SCÈNE 1 : EN PLEIN ÉCRAN DROPSIDERS ET EN DESSOUS RECRUTE (SANS CADRE)
        // ─────────────────────────────────────────────────────────────
        if (sceneIdx === 1) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Surtitre stylé avec étoiles
            const badgeY = height * 0.37;
            ctx.save();
            ctx.font = '900 32px "Montserrat", sans-serif';
            ctx.shadowColor = 'rgba(0,0,0,0.95)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 4;
            ctx.fillStyle = '#ff3355';
            ctx.fillText(`✦ ${introBadge.toUpperCase()} ✦`, width / 2, badgeY);
            ctx.restore();

            // Gros Titre Plein Écran : DROPSIDERS
            const dropY = height * 0.46;
            ctx.save();
            ctx.font = '900 120px "Montserrat", sans-serif';
            ctx.shadowColor = 'rgba(255, 0, 51, 0.95)';
            ctx.shadowBlur = 45;
            ctx.shadowOffsetY = 6;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(introTitle, width / 2, dropY);
            ctx.restore();

            // En dessous : RECRUTE avec pulsation dorée / rouge
            const recruteY = height * 0.55;
            ctx.save();
            ctx.font = '900 96px "Montserrat", sans-serif';
            const neonPulse = (Math.sin(sceneTime * 6) + 1) / 2;
            ctx.shadowColor = neonPulse > 0.4 ? '#ffe600' : '#ff0033';
            ctx.shadowBlur = 35 + neonPulse * 20;
            ctx.shadowOffsetY = 6;
            const recruteGrad = ctx.createLinearGradient(0, recruteY - 45, 0, recruteY + 45);
            recruteGrad.addColorStop(0, '#ffe600');
            recruteGrad.addColorStop(1, '#ff6600');
            ctx.fillStyle = recruteGrad;
            ctx.fillText(introSubtitle, width / 2, recruteY);
            ctx.restore();

            // Ligne d'accroche bas
            ctx.save();
            ctx.font = '800 28px "Montserrat", sans-serif';
            ctx.shadowColor = 'rgba(0,0,0,0.95)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetY = 3;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.fillText('LE MÉDIA ÉLECTRO & FESTIVALS', width / 2, height * 0.64);
            ctx.restore();
        }

        // ─────────────────────────────────────────────────────────────
        // SCÈNE 2 : TU VIBRES AU SON DE LA MUSIQUE ÉLECTRONIQUE ? REJOINS-NOUS !
        // ─────────────────────────────────────────────────────────────
        else if (sceneIdx === 2) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Question 1 : Tu vibres au son de la musique électronique ?
            ctx.save();
            ctx.font = '900 56px "Montserrat", sans-serif';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
            ctx.shadowBlur = 25;
            ctx.shadowOffsetY = 4;
            ctx.fillStyle = '#ffffff';
            drawCenteredWrappedText(ctx, vibeLine1, width / 2, height * 0.35, 960, 70);
            ctx.restore();

            // Séparateur discret lumineux
            ctx.save();
            const sepGrad = ctx.createLinearGradient(width / 2 - 200, 0, width / 2 + 200, 0);
            sepGrad.addColorStop(0, 'transparent');
            sepGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.8)');
            sepGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = sepGrad;
            ctx.fillRect(width / 2 - 200, height * 0.45, 400, 3);
            ctx.restore();

            // Question 2 : Tu rêves de découvrir les backstages des meilleurs events du monde ?
            ctx.save();
            ctx.font = '800 44px "Montserrat", sans-serif';
            ctx.shadowColor = 'rgba(0, 240, 255, 0.85)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetY = 4;
            ctx.fillStyle = '#00f0ff';
            drawCenteredWrappedText(ctx, vibeLine2, width / 2, height * 0.52, 940, 60);
            ctx.restore();

            // Call To Action : ⚡ REJOINS-NOUS ! ⚡
            const ctaPulse = (Math.sin(sceneTime * 6) + 1) / 2;
            ctx.save();
            ctx.font = '900 84px "Montserrat", sans-serif';
            ctx.shadowColor = `rgba(255, 230, 0, ${0.75 + ctaPulse * 0.25})`;
            ctx.shadowBlur = 35 + ctaPulse * 25;
            ctx.shadowOffsetY = 5;
            const ctaGrad = ctx.createLinearGradient(0, height * 0.69 - 40, 0, height * 0.69 + 40);
            ctaGrad.addColorStop(0, '#ffffff');
            ctaGrad.addColorStop(0.3, '#ffe600');
            ctaGrad.addColorStop(1, '#ff9900');
            ctx.fillStyle = ctaGrad;
            ctx.fillText(vibeCta, width / 2, height * 0.69);
            ctx.restore();
        }

        // ─────────────────────────────────────────────────────────────
        // SCÈNE 3 : PROFIL 1 (RÉDACTEURS & JOURNALISTES) - SANS CADRE
        // ─────────────────────────────────────────────────────────────
        else if (sceneIdx === 3) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Tag Profil Cyan
            ctx.save();
            ctx.font = '900 34px "Montserrat", sans-serif';
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = 'rgba(0, 240, 255, 0.9)';
            ctx.shadowBlur = 25;
            ctx.shadowOffsetY = 3;
            ctx.fillText(`⚡ ${p1Tag.toUpperCase()} ⚡`, width / 2, height * 0.32);
            ctx.restore();

            // Titre Profil
            ctx.save();
            ctx.font = '900 72px "Montserrat", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetY = 5;
            drawCenteredWrappedText(ctx, p1Title, width / 2, height * 0.41, 980, 82);
            ctx.restore();

            // Ligne de lueur cyan
            ctx.save();
            const sepGrad = ctx.createLinearGradient(width / 2 - 250, 0, width / 2 + 250, 0);
            sepGrad.addColorStop(0, 'transparent');
            sepGrad.addColorStop(0.5, '#00f0ff');
            sepGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = sepGrad;
            ctx.fillRect(width / 2 - 250, height * 0.48, 500, 3);
            ctx.restore();

            // Description textuelle pure sans boîte
            ctx.save();
            ctx.font = '600 40px "Montserrat", sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 3;
            drawCenteredWrappedText(ctx, p1Desc, width / 2, height * 0.56, 940, 56);
            ctx.restore();

            // Mention Anglais stylée
            ctx.save();
            ctx.font = '900 36px "Montserrat", sans-serif';
            ctx.fillStyle = '#ffdd33';
            ctx.shadowColor = 'rgba(255, 204, 0, 0.85)';
            ctx.shadowBlur = 25;
            ctx.shadowOffsetY = 4;
            ctx.fillText(p1Badge, width / 2, height * 0.70);
            ctx.restore();
        }

        // ─────────────────────────────────────────────────────────────
        // SCÈNE 4 : PROFIL 2 (CRÉATEURS DE CONTENU) - SANS CADRE
        // ─────────────────────────────────────────────────────────────
        else if (sceneIdx === 4) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Tag Profil Rouge / Rose
            ctx.save();
            ctx.font = '900 34px "Montserrat", sans-serif';
            ctx.fillStyle = '#ff3355';
            ctx.shadowColor = 'rgba(255, 0, 51, 0.9)';
            ctx.shadowBlur = 25;
            ctx.shadowOffsetY = 3;
            ctx.fillText(`⚡ ${p2Tag.toUpperCase()} ⚡`, width / 2, height * 0.30);
            ctx.restore();

            // Titre Profil
            ctx.save();
            ctx.font = '900 72px "Montserrat", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetY = 5;
            ctx.fillText(p2Title, width / 2, height * 0.38);
            ctx.restore();

            // Sous-titre Plateformes (TikTok / Insta)
            ctx.save();
            ctx.font = '900 48px "Montserrat", sans-serif';
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = 'rgba(0, 240, 255, 0.8)';
            ctx.shadowBlur = 25;
            ctx.shadowOffsetY = 4;
            ctx.fillText(`(${p2Sub})`, width / 2, height * 0.44);
            ctx.restore();

            // Ligne de lueur rouge
            ctx.save();
            const sepGrad = ctx.createLinearGradient(width / 2 - 250, 0, width / 2 + 250, 0);
            sepGrad.addColorStop(0, 'transparent');
            sepGrad.addColorStop(0.5, '#ff0033');
            sepGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = sepGrad;
            ctx.fillRect(width / 2 - 250, height * 0.48, 500, 3);
            ctx.restore();

            // Description textuelle sans boîte
            ctx.save();
            ctx.font = '600 40px "Montserrat", sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 3;
            drawCenteredWrappedText(ctx, p2Desc, width / 2, height * 0.56, 940, 56);
            ctx.restore();

            // Mention Anglais
            ctx.save();
            ctx.font = '900 36px "Montserrat", sans-serif';
            ctx.fillStyle = '#ffdd33';
            ctx.shadowColor = 'rgba(255, 204, 0, 0.85)';
            ctx.shadowBlur = 25;
            ctx.shadowOffsetY = 4;
            ctx.fillText(p2Badge, width / 2, height * 0.70);
            ctx.restore();
        }

        // ─────────────────────────────────────────────────────────────
        // SCÈNE 5 : CONTACT MAIL OU FORMULAIRE SITE - SANS CADRE
        // ─────────────────────────────────────────────────────────────
        else if (sceneIdx === 5) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Grande accroche
            ctx.save();
            ctx.font = '900 52px "Montserrat", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
            ctx.shadowBlur = 25;
            ctx.shadowOffsetY = 4;
            drawCenteredWrappedText(ctx, contactHeadline, width / 2, height * 0.33, 960, 68);
            ctx.restore();

            // Par Email
            ctx.save();
            ctx.font = '800 32px "Montserrat", sans-serif';
            ctx.fillStyle = '#aaaaaa';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
            ctx.shadowBlur = 15;
            ctx.fillText('📩 PAR EMAIL DIRECTEMENT :', width / 2, height * 0.46);

            ctx.font = '900 64px "Montserrat", sans-serif';
            ctx.fillStyle = '#ff3355';
            ctx.shadowColor = 'rgba(255, 0, 51, 0.95)';
            ctx.shadowBlur = 35;
            ctx.shadowOffsetY = 5;
            ctx.fillText(contactEmail, width / 2, height * 0.52);
            ctx.restore();

            // Ou via le site
            ctx.save();
            ctx.font = '800 32px "Montserrat", sans-serif';
            ctx.fillStyle = '#aaaaaa';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
            ctx.shadowBlur = 15;
            ctx.fillText('🌐 OU VIA LE FORMULAIRE SUR LE SITE :', width / 2, height * 0.60);

            ctx.font = '900 72px "Montserrat", sans-serif';
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = 'rgba(0, 240, 255, 0.95)';
            ctx.shadowBlur = 35;
            ctx.shadowOffsetY = 5;
            ctx.fillText(contactSite.toUpperCase(), width / 2, height * 0.66);
            ctx.restore();

            // Mention bas
            ctx.save();
            ctx.font = '900 32px "Montserrat", sans-serif';
            ctx.fillStyle = '#ffe600';
            ctx.shadowColor = 'rgba(255, 230, 0, 0.8)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 3;
            ctx.fillText('⚡ RÉPONSE RAPIDE DE L\'ÉQUIPE ⚡', width / 2, height * 0.75);
            ctx.restore();
        }

        // ─────────────────────────────────────────────────────────────
        // SCÈNE 6 : APPARITION DU VRAI LOGO DROPSIDERS OFFICIEL
        // ─────────────────────────────────────────────────────────────
        else if (sceneIdx === 6) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const centerY = height * 0.48;
            ctx.save();
            ctx.translate(width / 2, centerY);

            // Dimensions agrandies du cadre logo officiel (820px)
            const boxW = 820;
            const boxH = 256;
            const halfW = boxW / 2;
            const halfH = boxH / 2;

            // 1. DESSIN PROGRESSIF DES LIGNES DU CADRE EN DIRECT ("comme s'il se dessinait")
            const strokeDuration = 0.8;
            const frameProgress = Math.min(1, Math.max(0, sceneTime / strokeDuration));
            const perimeterHalf = halfW + boxH + halfW;
            const currentDist = frameProgress * perimeterHalf;

            ctx.save();
            ctx.lineWidth = 9;
            ctx.strokeStyle = '#ffffff';
            ctx.lineCap = 'square';
            ctx.lineJoin = 'miter';
            ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
            ctx.shadowBlur = 8;

            // Côté Droit : Haut-centre -> Coin haut-droit -> Coin bas-droit -> Bas-centre
            ctx.beginPath();
            ctx.moveTo(0, -halfH);
            if (currentDist <= halfW) {
                ctx.lineTo(currentDist, -halfH);
            } else if (currentDist <= halfW + boxH) {
                ctx.lineTo(halfW, -halfH);
                ctx.lineTo(halfW, -halfH + (currentDist - halfW));
            } else {
                ctx.lineTo(halfW, -halfH);
                ctx.lineTo(halfW, halfH);
                ctx.lineTo(halfW - (currentDist - (halfW + boxH)), halfH);
            }
            ctx.stroke();

            // Côté Gauche : Haut-centre -> Coin haut-gauche -> Coin bas-gauche -> Bas-centre
            ctx.beginPath();
            ctx.moveTo(0, -halfH);
            if (currentDist <= halfW) {
                ctx.lineTo(-currentDist, -halfH);
            } else if (currentDist <= halfW + boxH) {
                ctx.lineTo(-halfW, -halfH);
                ctx.lineTo(-halfW, -halfH + (currentDist - halfW));
            } else {
                ctx.lineTo(-halfW, -halfH);
                ctx.lineTo(-halfW, halfH);
                ctx.lineTo(-halfW + (currentDist - (halfW + boxH)), halfH);
            }
            ctx.stroke();
            ctx.restore();

            // 2. APPARITION DES LETTRES DU VRAI LOGO UNE PAR UNE (VRAIE POLICE OFFICIELLE CONDENSÉE)
            const pureImg = logoPureImgRef.current;
            if (pureImg && pureImg.complete && pureImg.naturalWidth > 0) {
                const textStart = 0.25;
                const totalLetters = 13; // D-R-O-P-S-I-D-E-R-S-.-F-R
                const letterDuration = 0.065;
                const elapsed = Math.max(0, sceneTime - textStart);
                const lettersVisible = Math.min(totalLetters, Math.floor(elapsed / letterDuration));

                const lw = 760;
                const lh = Math.round(lw * (pureImg.naturalHeight / pureImg.naturalWidth));

                if (lettersVisible > 0) {
                    const revealW = (lettersVisible / totalLetters) * lw;

                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(-lw / 2, -lh / 2, revealW, lh);
                    ctx.clip();
                    ctx.drawImage(pureImg, -lw / 2, -lh / 2, lw, lh);
                    ctx.restore();

                    // Curseur lumineux d'écriture à la dernière lettre révélée
                    if (lettersVisible < totalLetters) {
                        ctx.save();
                        ctx.fillStyle = '#ff0033';
                        ctx.shadowColor = '#ff0033';
                        ctx.shadowBlur = 12;
                        ctx.fillRect(-lw / 2 + revealW - 2, -lh / 2 + 10, 6, lh - 20);
                        ctx.restore();
                    }
                }
            } else if (logoImgRef.current && logoImgRef.current.complete && logoImgRef.current.naturalWidth > 0) {
                // Fallback avec logo_white.png si logo_dropsiders_brand_pure pas encore prêt
                const img = logoImgRef.current;
                const textStart = 0.25;
                const totalLetters = 13;
                const letterDuration = 0.065;
                const elapsed = Math.max(0, sceneTime - textStart);
                const lettersVisible = Math.min(totalLetters, Math.floor(elapsed / letterDuration));
                const lw = 820;
                const lh = Math.round(lw * (img.naturalHeight / img.naturalWidth));

                if (lettersVisible > 0) {
                    const revealW = (lettersVisible / totalLetters) * lw;
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(-lw / 2, -lh / 2, revealW, lh * 0.72);
                    ctx.clip();
                    ctx.drawImage(img, -lw / 2, -lh / 2, lw, lh);
                    ctx.restore();
                }
            }

            // 3. SOUS-TITRE WWW.DROPSIDERS.FR (Apparaît lettre par lettre)
            const subText = "WWW.DROPSIDERS.FR";
            const subStart = 1.15;
            const subSpeed = 0.045;
            const elapsedForSub = Math.max(0, sceneTime - subStart);
            const numSubVisible = Math.min(subText.length, Math.floor(elapsedForSub / subSpeed));
            const visibleSub = subText.slice(0, numSubVisible);

            if (visibleSub.length > 0) {
                ctx.save();
                ctx.font = '900 42px "Montserrat", sans-serif';
                (ctx as any).letterSpacing = '8px';
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                ctx.shadowBlur = 20;
                ctx.shadowOffsetY = 3;
                ctx.fillText(visibleSub, 0, halfH + 70);

                if (numSubVisible < subText.length) {
                    const metrics = ctx.measureText(visibleSub);
                    const curX = metrics.width / 2 + 8;
                    ctx.fillStyle = '#ff0033';
                    ctx.shadowColor = '#ff0033';
                    ctx.shadowBlur = 10;
                    ctx.fillRect(curX, halfH + 50, 4, 38);
                }
                ctx.restore();
            }

            ctx.restore();
        }

        ctx.restore();
    }, [
        bgType,
        bgOverlayOpacity,
        introTitle, introSubtitle, introBadge, introDuration,
        vibeLine1, vibeLine2, vibeCta, vibeDuration,
        p1Tag, p1Title, p1Desc, p1Badge, p1Duration,
        p2Tag, p2Title, p2Sub, p2Desc, p2Badge, p2Duration,
        contactHeadline, contactEmail, contactSite, contactDuration,
        logoDuration
    ]);

    // ── BOUCLE DE RENDU 60 FPS HAUTE FLUIDITÉ SANS RE-RENDER REACT ──
    useEffect(() => {
        if (!isOpen) return;

        let frameId: number;

        const renderLoop = (now: number) => {
            const dt = (now - lastTimestampRef.current) / 1000;
            lastTimestampRef.current = now;

            // Avancer le temps de manière fluide
            if (isPlayingRef.current && !isExportingRef.current) {
                currentTimeRef.current += dt;
                if (currentTimeRef.current >= totalDuration) {
                    currentTimeRef.current = 0;
                    if (videoRef.current && !isNaN(videoRef.current.duration)) {
                        videoRef.current.currentTime = bgVideoStartTimeRef.current;
                    }
                }
            }

            // Dessiner immédiatement sur le canvas sans attendre React (sauf pendant l'export pour 100% de fluidité)
            if (canvasRef.current && !isExportingRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    drawFrame(ctx, 1080, 1920, currentTimeRef.current);
                }
            }

            // Rafraîchir l'affichage du scrubber et de la timeline à ~10 FPS (toutes les 100ms)
            // pour garantir une fluidité 60 FPS parfaite du canvas sans surcharge React
            if (now - lastUiUpdateRef.current > 100) {
                lastUiUpdateRef.current = now;
                setUiDisplayTime(currentTimeRef.current);
            }

            frameId = requestAnimationFrame(renderLoop);
        };

        lastTimestampRef.current = performance.now();
        lastUiUpdateRef.current = performance.now();
        frameId = requestAnimationFrame(renderLoop);

        return () => cancelAnimationFrame(frameId);
    }, [isOpen, totalDuration, drawFrame]);

    // Gestion propre de la lecture/pause de la vidéo de fond
    useEffect(() => {
        const vid = videoRef.current;
        if (!vid || isNaN(vid.duration) || vid.duration <= 0) return;

        if (isPlaying) {
            vid.play().catch(() => {});
        } else {
            vid.pause();
        }
    }, [isPlaying]);

    // ── MOTEUR D'EXPORTATION MP4 (1080x1920, 60 ou 30 FPS) ──
    const handleExportMp4 = async () => {
        if (isExporting) return;
        setIsExporting(true);
        isExportingRef.current = true;
        setIsPlaying(false);
        isPlayingRef.current = false;
        setExportProgress(0);

        const targetWidth = 1080;
        const targetHeight = 1920;
        const fps = exportFps;
        const totalFrames = Math.max(1, Math.round(totalDuration * fps));

        // Canvas d'export haute résolution
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = targetWidth;
        exportCanvas.height = targetHeight;
        const exportCtx = exportCanvas.getContext('2d')!;

        // Initialisation Muxer MP4
        const muxerTarget = new ArrayBufferTarget();
        const muxer = new Muxer({
            target: muxerTarget,
            video: {
                codec: 'avc',
                width: targetWidth,
                height: targetHeight
            },
            fastStart: 'in-memory'
        });

        // Encodeur WebCodecs
        const VideoEncoderCls = (window as any).VideoEncoder;
        const VideoFrameCls = (window as any).VideoFrame;
        const hasWebCodecs = typeof VideoEncoderCls !== 'undefined' && typeof VideoFrameCls !== 'undefined';

        if (!hasWebCodecs) {
            alert("L'export MP4 haute vitesse nécessite un navigateur supportant WebCodecs (Google Chrome, Edge, Brave ou Safari récent).");
            setIsExporting(false);
            isExportingRef.current = false;
            return;
        }

        const encoder = new VideoEncoderCls({
            output: (chunk: any, meta: any) => {
                const rawBytes = new Uint8Array(chunk.byteLength);
                chunk.copyTo(rawBytes);
                muxer.addVideoChunkRaw(rawBytes, chunk.type === 'key' ? 'key' : 'delta', chunk.timestamp, chunk.duration, meta);
            },
            error: (e: any) => console.error("WebCodecs export error:", e)
        });

        await encoder.configure({
            codec: 'avc1.64002a', // H.264 High Profile 1080p
            width: targetWidth,
            height: targetHeight,
            bitrate: 10_000_000, // 10 Mbps cristal
            framerate: fps
        });

        // Utilisation de la vidéo de fond pour l'export (lecture continue matérielle GPU sans seek saccadé, identique à Social Suite)
        const vid = videoRef.current;
        const hasBgVideo = bgType === 'video' && Boolean(vid && !isNaN(vid.duration) && vid.duration > 0);

        if (hasBgVideo && vid) {
            vid.pause();
            vid.currentTime = bgVideoStartTimeRef.current;
            await new Promise<void>((resolve) => {
                let done = false;
                const onSeeked = () => {
                    if (done) return;
                    done = true;
                    vid.removeEventListener('seeked', onSeeked);
                    resolve();
                };
                vid.addEventListener('seeked', onSeeked, { once: true });
                setTimeout(onSeeked, 300);
            });
            await vid.play().catch(() => {});
        }

        const segmentStartTime = performance.now();
        const frameIntervalMs = 1000 / fps;
        const frameDurationUs = Math.round(1_000_000 / fps);

        // Boucle d'encodage temps réel ultra-fluide identique à Social Suite
        for (let f = 0; f < totalFrames; f++) {
            const frameTimeSec = f / fps;

            // Cadence fluide en temps réel alignée sur le décodage matériel GPU de la vidéo de fond
            if (hasBgVideo && vid) {
                // Empêcher la vidéo de dévier ou de boucler
                if (vid.currentTime < bgVideoStartTimeRef.current - 0.2 || vid.currentTime >= (vid.duration - 0.1)) {
                    vid.currentTime = bgVideoStartTimeRef.current + frameTimeSec;
                }
                const targetMs = f * frameIntervalMs;
                const elapsed = performance.now() - segmentStartTime;
                const delay = targetMs - elapsed;
                if (delay > 2) {
                    await new Promise(r => setTimeout(r, delay));
                }
            }

            // Dessin sur le canvas d'export avec la vidéo fluide
            drawFrame(exportCtx, targetWidth, targetHeight, frameTimeSec, true, vid);

            // Création frame WebCodecs
            const frameBitmap = await createImageBitmap(exportCanvas);
            const videoFrame = new VideoFrameCls(frameBitmap, {
                timestamp: Math.round(f * frameDurationUs),
                duration: frameDurationUs
            });

            const isKeyFrame = f % (fps * 2) === 0;
            encoder.encode(videoFrame, { keyFrame: isKeyFrame });
            videoFrame.close();
            frameBitmap.close();

            const p = Math.round(((f + 1) / totalFrames) * 100);
            setExportProgress(p);
            setExportTimeLeft(Math.max(0, Math.ceil((totalFrames - (f + 1)) / fps)));

            if (f % 5 === 0) {
                await new Promise(r => setTimeout(r, 0));
            }
        }

        if (hasBgVideo && vid) {
            vid.pause();
            vid.currentTime = bgVideoStartTimeRef.current;
        }

        await encoder.flush();
        muxer.finalize();

        const mp4Blob = new Blob([muxerTarget.buffer], { type: 'video/mp4' });
        const downloadUrl = URL.createObjectURL(mp4Blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `DROPSIDERS_RECRUTEMENT_REEL_2026.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setIsExporting(false);
        isExportingRef.current = false;
        setExportProgress(100);
    };

    if (!isOpen || !isAlex) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-2xl flex flex-col overflow-hidden text-white font-sans animate-in fade-in duration-200">
            
            {/* ── BARRE D'EN-TÊTE ── */}
            <header className="h-14 border-b border-white/10 px-4 sm:px-6 flex items-center justify-between bg-black/60">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff0033] to-[#ffcc00] flex items-center justify-center font-black text-black text-sm shadow-[0_0_15px_rgba(255,0,51,0.6)]">
                        ⚡
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-white via-amber-200 to-[#ff0033] bg-clip-text text-transparent">
                                Studio Reel Recrutement Dropsiders
                            </h2>
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase tracking-wider">
                                VIP Alex
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-400">Générateur vidéo 9:16 avec fond festival/vidéo & typographie cinématique sans cadre</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleExportMp4}
                        disabled={isExporting}
                        className={`px-4 py-2 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95 ${
                            isExporting
                                ? 'bg-amber-500/30 text-amber-400 border border-amber-500/50 animate-pulse'
                                : 'bg-gradient-to-r from-[#ff0033] via-rose-500 to-amber-500 hover:brightness-110 text-white shadow-[0_0_20px_rgba(255,0,51,0.4)]'
                        }`}
                    >
                        <Download className="w-4 h-4" />
                        <span>{isExporting ? `Export en cours (${exportProgress}%)` : '🎬 Exporter en MP4 (Reel 9:16)'}</span>
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* ── CORPS DU MODAL (Split View : Preview à gauche, Réglages à droite) ── */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                
                {/* GAUCHE : LECTEUR REEL 9:16 INTERACTIF */}
                <div className="flex-1 bg-[#050608] flex flex-col items-center justify-center p-3 sm:p-5 relative overflow-hidden">
                    
                    {/* Mockup iPhone Frame */}
                    <div className="relative w-full max-w-[320px] sm:max-w-[350px] aspect-[9/16] bg-black rounded-[42px] p-2.5 shadow-[0_0_50px_rgba(255,0,51,0.25),0_20px_50px_rgba(0,0,0,0.9)] border-[3px] border-white/20 overflow-hidden flex flex-col">
                        <div className="relative w-full h-full rounded-[34px] overflow-hidden bg-black flex items-center justify-center">
                            
                            {/* Élément vidéo natif en direct sous le canvas (accélération GPU 100% fluide, 0 lag) */}
                            <video
                                ref={videoRef}
                                playsInline
                                crossOrigin="anonymous"
                                muted={isVideoAudioMuted}
                                autoPlay
                                loop
                                className={`absolute inset-0 w-full h-full object-cover z-0 pointer-events-none transition-opacity duration-300 ${
                                    bgType === 'video' && bgVideoSrc ? 'opacity-100' : 'opacity-0'
                                }`}
                            />

                            {/* Image de fond en preview si mode image */}
                            {bgType === 'image' && bgImageSrc && (
                                <img
                                    src={bgImageSrc}
                                    alt="Fond"
                                    className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
                                />
                            )}

                            {/* Voile sombre 100% couvrant et uniforme sur tout l'écran (élimine les bandes plus claires en haut et en bas) */}
                            <div
                                className="absolute inset-0 z-[5] pointer-events-none transition-colors"
                                style={{ backgroundColor: `rgba(0, 0, 0, ${bgOverlayOpacity})` }}
                            />

                            {/* Canvas 1080x1920 réel couvrant 100% de la zone sans bordure letterbox */}
                            <canvas
                                ref={canvasRef}
                                width={1080}
                                height={1920}
                                className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
                            />

                            {/* Badge Timeline HUD */}
                            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/70 border border-white/15 text-[9px] font-mono text-gray-300 backdrop-blur-md z-30">
                                {uiDisplayTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
                            </div>

                            {/* Overlay d'exportation MP4 fluide sans freeze de la preview */}
                            {isExporting && (
                                <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-3">
                                    <div className="w-14 h-14 rounded-full border-3 border-[#ff0033]/30 border-t-[#ff0033] animate-spin flex items-center justify-center">
                                        <Download className="w-5 h-5 text-white animate-pulse" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-white uppercase tracking-wider">Exportation MP4 60 FPS</h4>
                                        <p className="text-[10px] text-gray-400 mt-0.5">Encodage vidéo en arrière-plan • {exportProgress}%</p>
                                    </div>
                                    <div className="w-44 h-2 bg-white/10 rounded-full overflow-hidden border border-white/10 mt-1">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#ff0033] via-amber-400 to-[#00f0ff] transition-all duration-150"
                                            style={{ width: `${exportProgress}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-mono text-gray-400">~{exportTimeLeft}s restantes</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BARRE DE LECTURE DU PREVIEW */}
                    <div className="w-full max-w-[440px] mt-3 space-y-2 bg-black/60 border border-white/10 p-2.5 rounded-2xl backdrop-blur-md">
                        {/* Timeline Scrubber */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-gray-400 w-10 text-right">{uiDisplayTime.toFixed(1)}s</span>
                            <input
                                type="range"
                                min={0}
                                max={totalDuration}
                                step={0.05}
                                value={uiDisplayTime}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    currentTimeRef.current = val;
                                    setUiDisplayTime(val);
                                    if (videoRef.current && !isNaN(videoRef.current.duration)) {
                                        videoRef.current.currentTime = bgVideoStartTimeRef.current + val;
                                    }
                                }}
                                className="flex-1 h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#ff0033]"
                            />
                            <span className="text-[10px] font-mono text-gray-400 w-10">{totalDuration.toFixed(1)}s</span>
                        </div>

                        {/* Boutons de contrôle */}
                        <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsPlaying(!isPlaying);
                                        isPlayingRef.current = !isPlaying;
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase flex items-center gap-1.5 transition active:scale-95"
                                >
                                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                    <span>{isPlaying ? 'Pause' : 'Lecture'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        currentTimeRef.current = 0;
                                        setUiDisplayTime(0);
                                        if (videoRef.current && !isNaN(videoRef.current.duration)) {
                                            videoRef.current.currentTime = bgVideoStartTimeRef.current;
                                        }
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold text-xs uppercase transition active:scale-95"
                                    title="Recommencer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Raccourcis Scènes 1 à 6 */}
                            <div className="flex items-center gap-1 flex-wrap">
                                {[
                                    { id: 1, label: '1. Intro', time: 0 },
                                    { id: 2, label: '2. Vibe', time: introDuration },
                                    { id: 3, label: '3. P1', time: introDuration + vibeDuration },
                                    { id: 4, label: '4. P2', time: introDuration + vibeDuration + p1Duration },
                                    { id: 5, label: '5. Contact', time: introDuration + vibeDuration + p1Duration + p2Duration },
                                    { id: 6, label: '6. Logo', time: introDuration + vibeDuration + p1Duration + p2Duration + contactDuration },
                                ].map(sc => (
                                    <button
                                        key={sc.id}
                                        type="button"
                                        onClick={() => {
                                            currentTimeRef.current = sc.time;
                                            setUiDisplayTime(sc.time);
                                            if (videoRef.current && !isNaN(videoRef.current.duration)) {
                                                videoRef.current.currentTime = bgVideoStartTimeRef.current + sc.time;
                                            }
                                        }}
                                        className="px-1.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[8px] font-black uppercase text-gray-300"
                                    >
                                        {sc.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* DROITE : PANNEAU DE CONTRÔLE ET RÉGLAGES ALEX */}
                <div className="w-full lg:w-[490px] border-l border-white/10 bg-[#0a0c12] flex flex-col overflow-hidden">
                    
                    {/* Onglets */}
                    <div className="flex border-b border-white/10 bg-black/40">
                        <button
                            type="button"
                            onClick={() => setActiveTab('fond')}
                            className={`flex-1 py-3 text-xs font-black uppercase flex items-center justify-center gap-1.5 transition ${
                                activeTab === 'fond' ? 'bg-[#ff0033]/20 text-[#ff3355] border-b-2 border-[#ff0033]' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Film className="w-4 h-4" /> Fond Visuel
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('durees')}
                            className={`flex-1 py-3 text-xs font-black uppercase flex items-center justify-center gap-1.5 transition ${
                                activeTab === 'durees' ? 'bg-[#00f0ff]/20 text-[#00f0ff] border-b-2 border-[#00f0ff]' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Clock className="w-4 h-4" /> Durées ({totalDuration.toFixed(1)}s)
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('textes')}
                            className={`flex-1 py-3 text-xs font-black uppercase flex items-center justify-center gap-1.5 transition ${
                                activeTab === 'textes' ? 'bg-[#ffe600]/20 text-[#ffe600] border-b-2 border-[#ffe600]' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Settings2 className="w-4 h-4" /> Textes (6 Scènes)
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('export')}
                            className={`flex-1 py-3 text-xs font-black uppercase flex items-center justify-center gap-1.5 transition ${
                                activeTab === 'export' ? 'bg-cyan-500/20 text-[#00f0ff] border-b-2 border-[#00f0ff]' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Download className="w-4 h-4" /> Export MP4
                        </button>
                    </div>

                    {/* Contenu de l'onglet actif */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        
                        {/* ONGLET 1 : FOND VISUEL (VIDÉO OU IMAGE) */}
                        {activeTab === 'fond' && (
                            <div className="space-y-4">
                                {/* Sélecteur de type de fond */}
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setBgType('video')}
                                        className={`p-2.5 rounded-xl border text-xs font-black uppercase flex flex-col items-center gap-1 transition ${
                                            bgType === 'video' ? 'bg-[#ff0033]/20 border-[#ff0033] text-[#ff3355]' : 'bg-white/5 border-white/10 text-gray-400'
                                        }`}
                                    >
                                        <Video className="w-4 h-4" />
                                        <span>Vidéo de Fond</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBgType('image')}
                                        className={`p-2.5 rounded-xl border text-xs font-black uppercase flex flex-col items-center gap-1 transition ${
                                            bgType === 'image' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-white/5 border-white/10 text-gray-400'
                                        }`}
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                        <span>Image Custom</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBgType('lasers')}
                                        className={`p-2.5 rounded-xl border text-xs font-black uppercase flex flex-col items-center gap-1 transition ${
                                            bgType === 'lasers' ? 'bg-white/20 border-white/40 text-white' : 'bg-white/5 border-white/10 text-gray-400'
                                        }`}
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span>Fond Noir Épuré</span>
                                    </button>
                                </div>

                                {/* Uploader Vidéo ou Image */}
                                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black uppercase text-gray-300 flex items-center gap-1.5">
                                            <Upload className="w-4 h-4 text-[#ff0033]" />
                                            Importer une Vidéo ou une Photo
                                        </span>
                                        {bgType === 'image' && bgImageSrc && (
                                            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                                ✓ Image Custom Active
                                            </span>
                                        )}
                                        {bgType === 'video' && bgVideoSrc && (
                                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                ✓ Vidéo Chargée
                                            </span>
                                        )}
                                    </div>

                                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-white/20 hover:border-[#ff0033] rounded-2xl cursor-pointer bg-black/40 transition group">
                                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#ff0033] mb-1 transition" />
                                        <span className="text-xs font-bold text-gray-200">Clique pour choisir un fichier vidéo ou photo</span>
                                        <span className="text-[10px] text-gray-500 mt-0.5">MP4, MOV, WebM, JPG, PNG (Vertical 9:16 ou Horizontal)</span>
                                        <input type="file" accept="video/*,image/*" onChange={handleMediaUpload} className="hidden" />
                                    </label>
                                </div>

                                {/* Réglages spécifiques si Vidéo */}
                                {bgType === 'video' && (
                                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                                        <div className="flex justify-between items-center text-xs font-black uppercase text-gray-300">
                                            <span>Départ de la vidéo :</span>
                                            <span className="text-[#00f0ff] font-mono font-bold bg-[#00f0ff]/10 px-2 py-0.5 rounded border border-[#00f0ff]/30">
                                                {bgVideoStartTime.toFixed(1)}s / {bgVideoDuration.toFixed(1)}s
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={Math.max(0, bgVideoDuration - 5)}
                                            step={0.5}
                                            value={bgVideoStartTime}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                setBgVideoStartTime(val);
                                                if (videoRef.current) videoRef.current.currentTime = val + currentTimeRef.current;
                                            }}
                                            className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#00f0ff]"
                                        />
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-gray-400">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setBgVideoStartTime(0);
                                                    if (videoRef.current) videoRef.current.currentTime = 0;
                                                }}
                                                className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md"
                                            >
                                                ⏪ 0:00
                                            </button>
                                            <div className="flex gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const n = Math.max(0, bgVideoStartTime - 5);
                                                        setBgVideoStartTime(n);
                                                        if (videoRef.current) videoRef.current.currentTime = n;
                                                    }}
                                                    className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md"
                                                >
                                                    -5s
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const n = Math.min(bgVideoDuration - 5, bgVideoStartTime + 5);
                                                        setBgVideoStartTime(n);
                                                        if (videoRef.current) videoRef.current.currentTime = n;
                                                    }}
                                                    className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md"
                                                >
                                                    +5s
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsVideoAudioMuted(!isVideoAudioMuted)}
                                                className={`w-full py-2 px-3 rounded-xl border text-xs font-black uppercase flex items-center justify-center gap-1.5 transition ${
                                                    !isVideoAudioMuted ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-white/5 text-gray-400 border-white/10'
                                                }`}
                                            >
                                                {!isVideoAudioMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                                <span>{!isVideoAudioMuted ? 'Son Vidéo Actif' : 'En Sourdine'}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Réglage du Voile Sombre pour lisibilité */}
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                                    <div className="flex justify-between text-xs font-black uppercase text-gray-300">
                                        <span>Voile d'obscurcissement (Lisibilité)</span>
                                        <span className="text-amber-400 font-mono">{Math.round(bgOverlayOpacity * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0.15}
                                        max={0.85}
                                        step={0.05}
                                        value={bgOverlayOpacity}
                                        onChange={(e) => setBgOverlayOpacity(parseFloat(e.target.value))}
                                        className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-amber-400 mt-2"
                                    />
                                    <p className="text-[10px] text-gray-400">Permet au texte de ressortir avec un contraste parfait sans aucun cadre.</p>
                                </div>
                            </div>
                        )}

                        {/* ONGLET 2 : DURÉES PERSONNALISABLES */}
                        {activeTab === 'durees' && (
                            <div className="space-y-3.5">
                                <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-black uppercase text-cyan-300 block">Durée Totale de la Vidéo</span>
                                        <span className="text-[11px] text-gray-300">Idéal pour un Reel Instagram ou TikTok (25s à 35s)</span>
                                    </div>
                                    <span className="text-xl font-black font-mono text-cyan-400 bg-cyan-500/20 px-3 py-1 rounded-xl border border-cyan-500/40">
                                        {totalDuration.toFixed(1)}s
                                    </span>
                                </div>

                                {/* Presets rapides de durée */}
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIntroDuration(3.5);
                                            setVibeDuration(4.5);
                                            setP1Duration(4.5);
                                            setP2Duration(4.5);
                                            setContactDuration(4.0);
                                            setLogoDuration(3.0);
                                        }}
                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase text-gray-300"
                                    >
                                        ⚡ Rapide (24s)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIntroDuration(4.5);
                                            setVibeDuration(6.0);
                                            setP1Duration(5.5);
                                            setP2Duration(5.5);
                                            setContactDuration(5.0);
                                            setLogoDuration(4.0);
                                        }}
                                        className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[10px] font-black uppercase text-amber-300"
                                    >
                                        ⭐ Standard (30.5s)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIntroDuration(5.5);
                                            setVibeDuration(8.0);
                                            setP1Duration(7.0);
                                            setP2Duration(7.0);
                                            setContactDuration(6.5);
                                            setLogoDuration(5.0);
                                        }}
                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase text-gray-300"
                                    >
                                        📖 Détaillé (39s)
                                    </button>
                                </div>

                                {/* Sliders par Scène */}
                                <div className="space-y-3 pt-1">
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                                        <div className="flex justify-between text-xs font-black uppercase text-[#ff3355]">
                                            <span>1. Intro Plein Écran</span>
                                            <span className="font-mono">{introDuration.toFixed(1)}s</span>
                                        </div>
                                        <input
                                            type="range" min={2.0} max={10.0} step={0.5} value={introDuration}
                                            onChange={(e) => setIntroDuration(parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#ff3355]"
                                        />
                                    </div>

                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                                        <div className="flex justify-between text-xs font-black uppercase text-amber-300">
                                            <span>2. Accroche Backstages & Vibe</span>
                                            <span className="font-mono">{vibeDuration.toFixed(1)}s</span>
                                        </div>
                                        <input
                                            type="range" min={3.0} max={12.0} step={0.5} value={vibeDuration}
                                            onChange={(e) => setVibeDuration(parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-amber-400"
                                        />
                                    </div>

                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                                        <div className="flex justify-between text-xs font-black uppercase text-[#00f0ff]">
                                            <span>3. Profil 1 (Rédacteurs)</span>
                                            <span className="font-mono">{p1Duration.toFixed(1)}s</span>
                                        </div>
                                        <input
                                            type="range" min={3.0} max={12.0} step={0.5} value={p1Duration}
                                            onChange={(e) => setP1Duration(parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#00f0ff]"
                                        />
                                    </div>

                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                                        <div className="flex justify-between text-xs font-black uppercase text-[#ff3355]">
                                            <span>4. Profil 2 (Créateurs Contenu)</span>
                                            <span className="font-mono">{p2Duration.toFixed(1)}s</span>
                                        </div>
                                        <input
                                            type="range" min={3.0} max={12.0} step={0.5} value={p2Duration}
                                            onChange={(e) => setP2Duration(parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#ff3355]"
                                        />
                                    </div>

                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                                        <div className="flex justify-between text-xs font-black uppercase text-amber-300">
                                            <span>5. Coordonnées Contact</span>
                                            <span className="font-mono">{contactDuration.toFixed(1)}s</span>
                                        </div>
                                        <input
                                            type="range" min={3.0} max={10.0} step={0.5} value={contactDuration}
                                            onChange={(e) => setContactDuration(parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-amber-400"
                                        />
                                    </div>

                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                                        <div className="flex justify-between text-xs font-black uppercase text-white">
                                            <span>6. Outro Logo Final</span>
                                            <span className="font-mono">{logoDuration.toFixed(1)}s</span>
                                        </div>
                                        <input
                                            type="range" min={2.0} max={8.0} step={0.5} value={logoDuration}
                                            onChange={(e) => setLogoDuration(parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ONGLET 3 : TEXTES DES 6 SCÈNES (SANS CADRE) */}
                        {activeTab === 'textes' && (
                            <div className="space-y-3.5">
                                
                                {/* Scène 1 : Intro Plein Écran */}
                                <div className="p-3 rounded-2xl bg-black/40 border border-red-500/30 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-black uppercase text-[#ff3355]">
                                        <span>1. Intro Plein Écran</span>
                                        <span className="text-gray-400 font-mono text-[10px]">Durée : {introDuration.toFixed(1)}s</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        <input
                                            type="text"
                                            value={introTitle}
                                            onChange={(e) => setIntroTitle(e.target.value)}
                                            placeholder="Gros Titre (ex: DROPSIDERS)"
                                            className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-[#ff0033] outline-none"
                                        />
                                        <input
                                            type="text"
                                            value={introSubtitle}
                                            onChange={(e) => setIntroSubtitle(e.target.value)}
                                            placeholder="Sous-titre (ex: RECRUTE)"
                                            className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs font-bold text-amber-400 focus:border-amber-400 outline-none"
                                        />
                                        <input
                                            type="text"
                                            value={introBadge}
                                            onChange={(e) => setIntroBadge(e.target.value)}
                                            placeholder="Surtitre (ex: SAISON 2026)"
                                            className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-[10px] font-bold text-[#ff3355] focus:border-[#ff0033] outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Scène 2 : Accroche Vibe / Backstages / REJOINS-NOUS */}
                                <div className="p-3 rounded-2xl bg-black/40 border border-amber-500/30 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-black uppercase text-amber-300">
                                        <span>2. Accroche Backstages & Vibe</span>
                                        <span className="text-gray-400 font-mono text-[10px]">Durée : {vibeDuration.toFixed(1)}s</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        <textarea
                                            rows={2}
                                            value={vibeLine1}
                                            onChange={(e) => setVibeLine1(e.target.value)}
                                            placeholder="Question 1 (ex: Tu vibres au son de la musique électronique ?)"
                                            className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-amber-400 outline-none resize-none"
                                        />
                                        <textarea
                                            rows={2}
                                            value={vibeLine2}
                                            onChange={(e) => setVibeLine2(e.target.value)}
                                            placeholder="Question 2 (ex: Tu rêves de découvrir les backstages...)"
                                            className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-[11px] font-bold text-[#00f0ff] focus:border-[#00f0ff] outline-none resize-none"
                                        />
                                        <input
                                            type="text"
                                            value={vibeCta}
                                            onChange={(e) => setVibeCta(e.target.value)}
                                            placeholder="Bouton Appel (ex: ⚡ REJOINS-NOUS ! ⚡)"
                                            className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs font-black text-amber-400 focus:border-amber-400 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Scène 3 : Profil 1 */}
                                <div className="p-3 rounded-2xl bg-black/40 border border-[#00f0ff]/30 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-black uppercase text-[#00f0ff]">
                                        <span>3. Profil 1 (Cyan)</span>
                                        <span className="text-gray-400 font-mono text-[10px]">Durée : {p1Duration.toFixed(1)}s</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        <input
                                            type="text"
                                            value={p1Title}
                                            onChange={(e) => setP1Title(e.target.value)}
                                            placeholder="Titre Profil 1"
                                            className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs font-bold text-[#00f0ff] focus:border-[#00f0ff] outline-none"
                                        />
                                        <textarea
                                            rows={2}
                                            value={p1Desc}
                                            onChange={(e) => setP1Desc(e.target.value)}
                                            placeholder="Description profil 1"
                                            className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-[11px] font-medium text-gray-300 focus:border-[#00f0ff] outline-none resize-none"
                                        />
                                        <input
                                            type="text"
                                            value={p1Badge}
                                            onChange={(e) => setP1Badge(e.target.value)}
                                            placeholder="Badge (ex: 🇬🇧 Anglais)"
                                            className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-[10px] font-bold text-amber-300 focus:border-amber-300 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Scène 4 : Profil 2 */}
                                <div className="p-3 rounded-2xl bg-black/40 border border-[#ff0033]/30 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-black uppercase text-[#ff3355]">
                                        <span>4. Profil 2 (Rouge)</span>
                                        <span className="text-gray-400 font-mono text-[10px]">Durée : {p2Duration.toFixed(1)}s</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        <input
                                            type="text"
                                            value={p2Title}
                                            onChange={(e) => setP2Title(e.target.value)}
                                            placeholder="Titre Profil 2"
                                            className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs font-bold text-[#ff3355] focus:border-[#ff0033] outline-none"
                                        />
                                        <input
                                            type="text"
                                            value={p2Sub}
                                            onChange={(e) => setP2Sub(e.target.value)}
                                            placeholder="Plateformes (ex: TIKTOK & INSTAGRAM)"
                                            className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs font-bold text-[#00f0ff] focus:border-[#00f0ff] outline-none"
                                        />
                                        <textarea
                                            rows={2}
                                            value={p2Desc}
                                            onChange={(e) => setP2Desc(e.target.value)}
                                            placeholder="Description profil 2"
                                            className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-[11px] font-medium text-gray-300 focus:border-[#ff0033] outline-none resize-none"
                                        />
                                        <input
                                            type="text"
                                            value={p2Badge}
                                            onChange={(e) => setP2Badge(e.target.value)}
                                            placeholder="Badge"
                                            className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-[10px] font-bold text-amber-300 focus:border-amber-300 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Scène 5 : Contact Mail / Site */}
                                <div className="p-3 rounded-2xl bg-black/40 border border-amber-500/30 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-black uppercase text-amber-300">
                                        <span>5. Phrase Contact</span>
                                        <span className="text-gray-400 font-mono text-[10px]">Durée : {contactDuration.toFixed(1)}s</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        <input
                                            type="text"
                                            value={contactHeadline}
                                            onChange={(e) => setContactHeadline(e.target.value)}
                                            placeholder="Accroche"
                                            className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs font-bold text-white outline-none"
                                        />
                                        <input
                                            type="text"
                                            value={contactEmail}
                                            onChange={(e) => setContactEmail(e.target.value)}
                                            placeholder="Email"
                                            className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs font-bold text-[#ff3355] outline-none"
                                        />
                                        <input
                                            type="text"
                                            value={contactSite}
                                            onChange={(e) => setContactSite(e.target.value)}
                                            placeholder="Site web / Formulaire"
                                            className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs font-bold text-[#00f0ff] outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Scène 6 : Outro Logo */}
                                <div className="p-3 rounded-2xl bg-black/40 border border-white/20 space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-black uppercase text-white">
                                        <span>6. Outro Finale Logo Dropsiders</span>
                                        <span className="text-gray-400 font-mono text-[10px]">Durée : {logoDuration.toFixed(1)}s</span>
                                    </div>
                                    <p className="text-[11px] text-gray-400">Le logo officiel Dropsiders apparaît en plein centre avec pulsation néon sans aucun cadre.</p>
                                </div>

                            </div>
                        )}

                        {/* ONGLET 4 : EXPORT MP4 */}
                        {activeTab === 'export' && (
                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#ff0033]/15 to-amber-500/15 border border-[#ff0033]/30 space-y-3">
                                    <div className="flex items-center gap-2 text-white font-black text-sm uppercase">
                                        <Sparkles className="w-4 h-4 text-amber-400" />
                                        <span>Paramètres d'Exportation Reel</span>
                                    </div>
                                    <p className="text-xs text-gray-300">
                                        Génération MP4 haute qualité (1080x1920) avec accélération matérielle WebCodecs.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setExportFps(60)}
                                            className={`p-3 rounded-xl border text-xs font-black uppercase flex flex-col items-center gap-1 transition ${
                                                exportFps === 60 ? 'bg-[#ff0033]/20 border-[#ff0033] text-white' : 'bg-black/40 border-white/10 text-gray-400'
                                            }`}
                                        >
                                            <span className="text-base font-black">60 FPS</span>
                                            <span className="text-[9px] text-gray-400">Fluidité maximale</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setExportFps(30)}
                                            className={`p-3 rounded-xl border text-xs font-black uppercase flex flex-col items-center gap-1 transition ${
                                                exportFps === 30 ? 'bg-amber-500/20 border-amber-500 text-white' : 'bg-black/40 border-white/10 text-gray-400'
                                            }`}
                                        >
                                            <span className="text-base font-black">30 FPS</span>
                                            <span className="text-[9px] text-gray-400">Export ultra rapide</span>
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleExportMp4}
                                    disabled={isExporting}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff0033] via-rose-500 to-amber-500 text-white font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(255,0,51,0.5)] hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2.5"
                                >
                                    <Download className="w-5 h-5" />
                                    <span>Lancer le Rendu & Télécharger la Vidéo MP4</span>
                                </button>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
};
