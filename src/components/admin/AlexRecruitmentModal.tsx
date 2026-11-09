import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Upload, Volume2, VolumeX, Video, Download, Sparkles, Check, Film, Settings2 } from 'lucide-react';
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
    const isAlex = isSuperAdmin(currentUser) || currentUser === 'alex' || currentUser === 'alexf' || currentUser === 'itsalexfr1';

    // ── Configuration des 5 Scènes ──
    const [introTitle, setIntroTitle] = useState('DROPSIDERS');
    const [introSubtitle, setIntroSubtitle] = useState('RECRUTE');
    const [introBadge, setIntroBadge] = useState('SAISON 2026');
    const [introDuration, setIntroDuration] = useState(3.0); // 3.0s

    const [p1Title, setP1Title] = useState('RÉDACTEURS & JOURNALISTES');
    const [p1Desc, setP1Desc] = useState("Passionné(e) d'électro, capable d'écrire des articles de fond, réaliser des interviews d'artistes et couvrir les plus gros festivals.");
    const [p1Badge, setP1Badge] = useState('🇬🇧 PARLER ANGLAIS EST UN VRAI PLUS');
    const [p1Duration, setP1Duration] = useState(3.5); // 3.5s

    const [p2Title, setP2Title] = useState('CRÉATEURS DE CONTENU (TIKTOK / INSTA)');
    const [p2Desc, setP2Desc] = useState("À l'aise face caméra ou caméra au poing, pour capturer l'énergie des scènes, interviewer le public et produire du contenu viral.");
    const [p2Badge, setP2Badge] = useState('🇬🇧 ANGLAIS APPRÉCIÉ POUR LES INTERVIEWS');
    const [p2Duration, setP2Duration] = useState(3.5); // 3.5s

    const [contactHeadline, setContactHeadline] = useState('PRÊT(E) À VIVRE LES FESTIVALS DE L\'INTÉRIEUR ?');
    const [contactEmail, setContactEmail] = useState('contact@dropsiders.fr');
    const [contactSite, setContactSite] = useState('dropsiders.fr');
    const [contactDuration, setContactDuration] = useState(3.0); // 3.0s

    const [logoDuration, setLogoDuration] = useState(3.0); // 3.0s

    // ── Vidéo de fond ──
    const [bgVideoBlob, setBgVideoBlob] = useState<Blob | null>(null);
    const [bgVideoSrc, setBgVideoSrc] = useState<string>('');
    const [bgVideoStartTime, setBgVideoStartTime] = useState<number>(0);
    const [bgVideoDuration, setBgVideoDuration] = useState<number>(0);
    const [isVideoAudioMuted, setIsVideoAudioMuted] = useState<boolean>(false);
    const [bgOverlayOpacity, setBgOverlayOpacity] = useState<number>(0.50);

    // ── Contrôles Lecture ──
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<'video' | 'textes' | 'export'>('video');

    // ── Export MP4 ──
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [exportProgress, setExportProgress] = useState<number>(0);
    const [exportFps, setExportFps] = useState<number>(60);
    const [exportTimeLeft, setExportTimeLeft] = useState<number>(0);

    // Refs
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const lastTimestampRef = useRef<number>(performance.now());
    const isExportingRef = useRef<boolean>(false);
    const bgVideoStartTimeRef = useRef<number>(0);
    const logoImgRef = useRef<HTMLImageElement | null>(null);

    const totalDuration = introDuration + p1Duration + p2Duration + contactDuration + logoDuration;

    useEffect(() => {
        bgVideoStartTimeRef.current = bgVideoStartTime;
    }, [bgVideoStartTime]);

    // Charger le logo Dropsiders
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = '/logo_white.png';
        img.onload = () => { logoImgRef.current = img; };
    }, []);

    // ── Upload de vidéo de fond ──
    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const blobUrl = URL.createObjectURL(file);
        setBgVideoBlob(file);
        setBgVideoSrc(blobUrl);
        setBgVideoStartTime(0);
        setCurrentTime(0);

        if (videoRef.current) {
            videoRef.current.src = blobUrl;
            videoRef.current.currentTime = 0;
            videoRef.current.onloadedmetadata = () => {
                if (videoRef.current) {
                    setBgVideoDuration(videoRef.current.duration || 0);
                    videoRef.current.play().catch(() => {});
                }
            };
        }
    };

    // Calcul de la scène active et de son opacité de transition
    const getSceneState = (t: number) => {
        const t1 = introDuration;
        const t2 = t1 + p1Duration;
        const t3 = t2 + p2Duration;
        const t4 = t3 + contactDuration;
        const t5 = t4 + logoDuration;

        let sceneIdx = 0;
        let sceneTime = 0;
        let sceneDur = 0;

        if (t < t1) {
            sceneIdx = 1;
            sceneTime = t;
            sceneDur = introDuration;
        } else if (t < t2) {
            sceneIdx = 2;
            sceneTime = t - t1;
            sceneDur = p1Duration;
        } else if (t < t3) {
            sceneIdx = 3;
            sceneTime = t - t2;
            sceneDur = p2Duration;
        } else if (t < t4) {
            sceneIdx = 4;
            sceneTime = t - t3;
            sceneDur = contactDuration;
        } else {
            sceneIdx = 5;
            sceneTime = t - t4;
            sceneDur = logoDuration;
        }

        // Fondu d'entrée 0.35s et fondu de sortie 0.35s
        const fadeDur = 0.35;
        let alpha = 1.0;
        if (sceneTime < fadeDur) {
            alpha = Math.min(1, Math.max(0, sceneTime / fadeDur));
        } else if (sceneTime > sceneDur - fadeDur) {
            alpha = Math.min(1, Math.max(0, (sceneDur - sceneTime) / fadeDur));
        }

        // Effet d'entrée en translation Y douce
        const enterY = sceneTime < fadeDur ? (1 - (sceneTime / fadeDur)) * 25 : 0;
        // Effet de sortie en translation Y douce vers le haut
        const exitY = sceneTime > sceneDur - fadeDur ? ((sceneTime - (sceneDur - fadeDur)) / fadeDur) * -20 : 0;
        const translateY = enterY + exitY;

        return { sceneIdx, sceneTime, sceneDur, alpha, translateY };
    };

    // ── Dessin de la frame sur le Canvas (1080x1920) ──
    const drawFrame = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
        ctx.clearRect(0, 0, width, height);

        // 1. Fond : Vidéo ou Dégradé festival EDM immersif
        const vid = videoRef.current;
        if (vid && vid.readyState >= 2 && !isNaN(vid.videoWidth) && vid.videoWidth > 0) {
            const scale = Math.max(width / vid.videoWidth, height / vid.videoHeight);
            const vw = vid.videoWidth * scale;
            const vh = vid.videoHeight * scale;
            const vx = (width - vw) / 2;
            const vy = (height - vh) / 2;
            ctx.drawImage(vid, vx, vy, vw, vh);
        } else {
            // Fond dégradé scène concert club par défaut si pas de vidéo uploadée
            const grad = ctx.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, '#0a0208');
            grad.addColorStop(0.5, '#12041a');
            grad.addColorStop(1, '#02050e');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);

            // Faisceaux laser d'ambiance festival par défaut
            ctx.save();
            const beamX = width / 2;
            const beamY = height * 0.45;
            for (let i = -3; i <= 3; i++) {
                const angle = (i * 0.22) + Math.sin(time * 1.5 + i) * 0.15;
                ctx.beginPath();
                ctx.moveTo(beamX, beamY);
                ctx.lineTo(beamX + Math.sin(angle) * (height * 1.1), beamY - Math.cos(angle) * (height * 1.1));
                ctx.strokeStyle = i % 2 === 0 ? 'rgba(0, 240, 255, 0.25)' : 'rgba(255, 0, 51, 0.3)';
                ctx.lineWidth = 4;
                ctx.shadowColor = ctx.strokeStyle;
                ctx.shadowBlur = 18;
                ctx.stroke();
            }
            ctx.restore();
        }

        // 2. Voile sombre dégradé pour garantir 100% de lisibilité
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${bgOverlayOpacity})`;
        ctx.fillRect(0, 0, width, height);

        // Vignette cinématographique
        const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.95);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.65)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();

        // 3. Calcul de la scène active et transitions fluides
        const { sceneIdx, sceneTime, alpha, translateY } = getSceneState(time);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(0, translateY);

        // ─────────────────────────────────────────────────────────────
        // SCÈNE 1 : EN PLEIN ÉCRAN DROPSIDERS ET EN DESSOUS RECRUTE
        // ─────────────────────────────────────────────────────────────
        if (sceneIdx === 1) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Badge Saison
            const badgeY = height * 0.35;
            ctx.save();
            ctx.font = '900 32px "Montserrat", sans-serif';
            const badgeText = `• ${introBadge} •`;
            const badgeMetrics = ctx.measureText(badgeText);
            const badgeW = badgeMetrics.width + 60;
            const badgeH = 54;
            ctx.fillStyle = 'rgba(255, 0, 51, 0.18)';
            ctx.strokeStyle = 'rgba(255, 0, 51, 0.8)';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ff0033';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.roundRect((width - badgeW) / 2, badgeY - badgeH / 2, badgeW, badgeH, 27);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ff3355';
            ctx.fillText(badgeText, width / 2, badgeY);
            ctx.restore();

            // Gros Titre Plein Écran : DROPSIDERS
            const dropY = height * 0.46;
            ctx.save();
            ctx.font = '900 115px "Montserrat", sans-serif';
            ctx.shadowColor = 'rgba(255, 0, 51, 0.9)';
            ctx.shadowBlur = 40;
            ctx.fillStyle = '#ffffff';
            ctx.letterSpacing = '4px';
            ctx.fillText(introTitle, width / 2, dropY);
            ctx.restore();

            // En dessous : RECRUTE
            const recruteY = height * 0.56;
            ctx.save();
            ctx.font = '900 92px "Montserrat", sans-serif';
            const neonPulse = (Math.sin(sceneTime * 8) + 1) / 2;
            ctx.shadowColor = neonPulse > 0.4 ? '#ffe600' : '#ff0033';
            ctx.shadowBlur = 45;
            const recruteGrad = ctx.createLinearGradient(0, recruteY - 40, 0, recruteY + 40);
            recruteGrad.addColorStop(0, '#ffe600');
            recruteGrad.addColorStop(1, '#ff8800');
            ctx.fillStyle = recruteGrad;
            ctx.letterSpacing = '8px';
            ctx.fillText(introSubtitle, width / 2, recruteY);
            ctx.restore();

            // Micro texte d'accroche bas
            ctx.save();
            ctx.font = '700 28px "Montserrat", sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText('LE MÉDIA ÉLECTRO RECHERCHE SES NOUVEAUX TALENTS', width / 2, height * 0.65);
            ctx.restore();
        }

        // ─────────────────────────────────────────────────────────────
        // SCÈNE 2 : AU MILIEU LE 1ER PROFIL RECHERCHÉ (RÉDACTEURS)
        // ─────────────────────────────────────────────────────────────
        else if (sceneIdx === 2) {
            const cardW = 900;
            const cardH = 680;
            const cardX = (width - cardW) / 2;
            const cardY = (height - cardH) / 2;

            // Carte Glassmorphism Cyan
            ctx.save();
            ctx.fillStyle = 'rgba(5, 10, 20, 0.88)';
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 5;
            ctx.shadowColor = 'rgba(0, 240, 255, 0.75)';
            ctx.shadowBlur = 35;
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, 40);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // En-tête profil (Numéro / Tag)
            ctx.save();
            ctx.font = '900 28px "Montserrat", sans-serif';
            ctx.fillStyle = '#00f0ff';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ PROFIL RECHERCHÉ #1 ⚡', width / 2, cardY + 80);
            ctx.restore();

            // Icône
            ctx.save();
            ctx.font = '70px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('✍️', width / 2, cardY + 175);
            ctx.restore();

            // Titre profil
            ctx.save();
            ctx.font = '900 48px "Montserrat", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 20;
            ctx.fillText(p1Title, width / 2, cardY + 270);
            ctx.restore();

            // Ligne de séparation
            ctx.save();
            const sepGrad = ctx.createLinearGradient(cardX + 100, 0, cardX + cardW - 100, 0);
            sepGrad.addColorStop(0, 'transparent');
            sepGrad.addColorStop(0.5, '#00f0ff');
            sepGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = sepGrad;
            ctx.fillRect(cardX + 100, cardY + 315, cardW - 200, 3);
            ctx.restore();

            // Description multiligne
            ctx.save();
            ctx.font = '600 32px "Montserrat", sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.textAlign = 'center';
            const words = p1Desc.split(' ');
            let line = '';
            let lineY = cardY + 380;
            const maxLineWidth = cardW - 120;
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxLineWidth && n > 0) {
                    ctx.fillText(line, width / 2, lineY);
                    line = words[n] + ' ';
                    lineY += 46;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, width / 2, lineY);
            ctx.restore();

            // Badge Anglais en bas de la carte
            ctx.save();
            ctx.font = '900 26px "Montserrat", sans-serif';
            const bMetrics = ctx.measureText(p1Badge);
            const bW = bMetrics.width + 44;
            const bH = 50;
            const bX = (width - bW) / 2;
            const bY = cardY + cardH - 85;
            ctx.fillStyle = 'rgba(255, 204, 0, 0.18)';
            ctx.strokeStyle = 'rgba(255, 204, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ffcc00';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.roundRect(bX, bY, bW, bH, 25);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ffdd33';
            ctx.textAlign = 'center';
            ctx.fillText(p1Badge, width / 2, bY + 34);
            ctx.restore();
        }

        // ─────────────────────────────────────────────────────────────
        // SCÈNE 3 : AU MILIEU LE 2EME PROFIL RECHERCHÉ (CRÉATEURS)
        // ─────────────────────────────────────────────────────────────
        else if (sceneIdx === 3) {
            const cardW = 900;
            const cardH = 680;
            const cardX = (width - cardW) / 2;
            const cardY = (height - cardH) / 2;

            // Carte Glassmorphism Rouge Neon
            ctx.save();
            ctx.fillStyle = 'rgba(20, 5, 10, 0.88)';
            ctx.strokeStyle = '#ff0033';
            ctx.lineWidth = 5;
            ctx.shadowColor = 'rgba(255, 0, 51, 0.75)';
            ctx.shadowBlur = 35;
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, 40);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // En-tête profil
            ctx.save();
            ctx.font = '900 28px "Montserrat", sans-serif';
            ctx.fillStyle = '#ff3355';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ PROFIL RECHERCHÉ #2 ⚡', width / 2, cardY + 80);
            ctx.restore();

            // Icône
            ctx.save();
            ctx.font = '70px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('📱', width / 2, cardY + 175);
            ctx.restore();

            // Titre profil
            ctx.save();
            ctx.font = '900 44px "Montserrat", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#ff0033';
            ctx.shadowBlur = 20;
            ctx.fillText(p2Title, width / 2, cardY + 270);
            ctx.restore();

            // Ligne de séparation
            ctx.save();
            const sepGrad = ctx.createLinearGradient(cardX + 100, 0, cardX + cardW - 100, 0);
            sepGrad.addColorStop(0, 'transparent');
            sepGrad.addColorStop(0.5, '#ff0033');
            sepGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = sepGrad;
            ctx.fillRect(cardX + 100, cardY + 315, cardW - 200, 3);
            ctx.restore();

            // Description multiligne
            ctx.save();
            ctx.font = '600 32px "Montserrat", sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.textAlign = 'center';
            const words = p2Desc.split(' ');
            let line = '';
            let lineY = cardY + 380;
            const maxLineWidth = cardW - 120;
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxLineWidth && n > 0) {
                    ctx.fillText(line, width / 2, lineY);
                    line = words[n] + ' ';
                    lineY += 46;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, width / 2, lineY);
            ctx.restore();

            // Badge Anglais en bas de la carte
            ctx.save();
            ctx.font = '900 26px "Montserrat", sans-serif';
            const bMetrics = ctx.measureText(p2Badge);
            const bW = bMetrics.width + 44;
            const bH = 50;
            const bX = (width - bW) / 2;
            const bY = cardY + cardH - 85;
            ctx.fillStyle = 'rgba(255, 204, 0, 0.18)';
            ctx.strokeStyle = 'rgba(255, 204, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ffcc00';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.roundRect(bX, bY, bW, bH, 25);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ffdd33';
            ctx.textAlign = 'center';
            ctx.fillText(p2Badge, width / 2, bY + 34);
            ctx.restore();
        }

        // ─────────────────────────────────────────────────────────────
        // SCÈNE 4 : PHRASE CONTACT PAR MAIL OU FORMULAIRE
        // ─────────────────────────────────────────────────────────────
        else if (sceneIdx === 4) {
            const cardW = 920;
            const cardH = 650;
            const cardX = (width - cardW) / 2;
            const cardY = (height - cardH) / 2;

            // Carte Glassmorphism Contact
            ctx.save();
            ctx.fillStyle = 'rgba(10, 8, 15, 0.90)';
            ctx.strokeStyle = 'rgba(255, 204, 0, 0.7)';
            ctx.lineWidth = 4;
            ctx.shadowColor = 'rgba(255, 204, 0, 0.5)';
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, 40);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Accroche
            ctx.save();
            ctx.font = '900 36px "Montserrat", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(contactHeadline, width / 2, cardY + 110);
            ctx.restore();

            // Bloc Option 1 : EMAIL
            const emailBoxY = cardY + 190;
            ctx.save();
            ctx.fillStyle = 'rgba(255, 0, 51, 0.15)';
            ctx.strokeStyle = 'rgba(255, 0, 51, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cardX + 60, emailBoxY, cardW - 120, 150, 25);
            ctx.fill();
            ctx.stroke();

            ctx.font = '800 26px "Montserrat", sans-serif';
            ctx.fillStyle = '#aaaaaa';
            ctx.textAlign = 'center';
            ctx.fillText('📩 PAR EMAIL DIRECTEMENT :', width / 2, emailBoxY + 50);

            ctx.font = '900 46px "Montserrat", sans-serif';
            ctx.fillStyle = '#ff3355';
            ctx.shadowColor = '#ff0033';
            ctx.shadowBlur = 25;
            ctx.fillText(contactEmail, width / 2, emailBoxY + 105);
            ctx.restore();

            // Bloc Option 2 : FORMULAIRE SITE
            const siteBoxY = cardY + 380;
            ctx.save();
            ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cardX + 60, siteBoxY, cardW - 120, 150, 25);
            ctx.fill();
            ctx.stroke();

            ctx.font = '800 26px "Montserrat", sans-serif';
            ctx.fillStyle = '#aaaaaa';
            ctx.textAlign = 'center';
            ctx.fillText('🌐 OU VIA LE FORMULAIRE SUR LE SITE :', width / 2, siteBoxY + 50);

            ctx.font = '900 46px "Montserrat", sans-serif';
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 25;
            ctx.fillText(contactSite.toUpperCase(), width / 2, siteBoxY + 105);
            ctx.restore();

            // Indication bas
            ctx.save();
            ctx.font = '800 24px "Montserrat", sans-serif';
            ctx.fillStyle = '#ffe600';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ RÉPONSE RAPIDE DE L\'ÉQUIPE GARANTIE ⚡', width / 2, cardY + cardH - 45);
            ctx.restore();
        }

        // ─────────────────────────────────────────────────────────────
        // SCÈNE 5 : APPARITION DU LOGO DROPSIDERS FINAL
        // ─────────────────────────────────────────────────────────────
        else if (sceneIdx === 5) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Pulsation du logo
            const pump = 1.0 + Math.sin(sceneTime * 6) * 0.04;
            ctx.save();
            ctx.translate(width / 2, height * 0.48);
            ctx.scale(pump, pump);

            // Halo rougeoyant majestueux
            const halo = ctx.createRadialGradient(0, 0, 50, 0, 0, 320);
            halo.addColorStop(0, 'rgba(255, 0, 51, 0.7)');
            halo.addColorStop(0.6, 'rgba(255, 0, 51, 0.2)');
            halo.addColorStop(1, 'transparent');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(0, 0, 320, 0, Math.PI * 2);
            ctx.fill();

            // Boîte logo officielle Dropsiders
            const boxW = 540;
            const boxH = 180;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 6;
            ctx.shadowColor = '#ff0033';
            ctx.shadowBlur = 35;
            ctx.beginPath();
            ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 30);
            ctx.fill();
            ctx.stroke();

            // Dessin du Logo Image si chargée, sinon texte stylisé officiel
            if (logoImgRef.current && logoImgRef.current.complete) {
                const imgScale = Math.min((boxW - 60) / logoImgRef.current.width, (boxH - 40) / logoImgRef.current.height);
                const iw = logoImgRef.current.width * imgScale;
                const ih = logoImgRef.current.height * imgScale;
                ctx.drawImage(logoImgRef.current, -iw / 2, -ih / 2, iw, ih);
            } else {
                ctx.font = '900 68px "Montserrat", sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.letterSpacing = '6px';
                ctx.fillText('DROPSIDERS', 0, -10);

                ctx.font = '800 26px "Montserrat", sans-serif';
                ctx.fillStyle = '#ff0033';
                ctx.letterSpacing = '10px';
                ctx.fillText('.FR', 160, -10);
            }

            ctx.restore();

            // Sous-titre Web
            ctx.save();
            ctx.font = '800 32px "Montserrat", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.letterSpacing = '6px';
            ctx.shadowColor = 'rgba(255,255,255,0.6)';
            ctx.shadowBlur = 15;
            ctx.fillText('WWW.DROPSIDERS.FR', width / 2, height * 0.63);

            ctx.font = '700 24px "Montserrat", sans-serif';
            ctx.fillStyle = '#aaaaaa';
            ctx.letterSpacing = '2px';
            ctx.fillText('LE MÉDIA N°1 ÉLECTRO & FESTIVALS', width / 2, height * 0.68);
            ctx.restore();
        }

        ctx.restore();
    }, [
        introTitle, introSubtitle, introBadge, introDuration,
        p1Title, p1Desc, p1Badge, p1Duration,
        p2Title, p2Desc, p2Badge, p2Duration,
        contactHeadline, contactEmail, contactSite, contactDuration,
        logoDuration, bgOverlayOpacity
    ]);

    // ── Boucle d'animation en temps réel pour le preview (60 FPS) ──
    useEffect(() => {
        if (!isOpen) return;

        let lastTime = performance.now();
        const renderLoop = (now: number) => {
            const dt = (now - lastTime) / 1000;
            lastTime = now;

            if (isPlaying && !isExportingRef.current) {
                setCurrentTime(prev => {
                    const next = prev + dt;
                    if (next >= totalDuration) {
                        // Boucle fluide
                        if (videoRef.current) {
                            videoRef.current.currentTime = bgVideoStartTimeRef.current;
                        }
                        return 0;
                    }
                    return next;
                });
            }

            // Sync de la vidéo de fond
            const vid = videoRef.current;
            if (vid && isPlaying && !isExportingRef.current) {
                if (vid.paused) vid.play().catch(() => {});
                // Si la vidéo dérive trop ou boucle nativement, la recaler
                const targetVidTime = bgVideoStartTimeRef.current + currentTime;
                if (Math.abs(vid.currentTime - targetVidTime) > 0.4 && vid.duration && targetVidTime < vid.duration) {
                    vid.currentTime = targetVidTime;
                }
            }

            // Dessin frame canvas
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    drawFrame(ctx, canvas.width, canvas.height, currentTime);
                }
            }

            animFrameRef.current = requestAnimationFrame(renderLoop);
        };

        animFrameRef.current = requestAnimationFrame(renderLoop);
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [isOpen, isPlaying, totalDuration, currentTime, drawFrame]);

    // ── Export Vidéo MP4 HD (1080x1920) Haute Fidélité ──
    const handleExportMp4 = async () => {
        if (isExporting || !canvasRef.current) return;
        setIsExporting(true);
        isExportingRef.current = true;
        setExportProgress(0);

        const canvas = canvasRef.current;
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

        // Vidéo de fond : calage précis à bgVideoStartTime
        const vid = videoRef.current;
        if (vid) {
            vid.pause();
            vid.currentTime = bgVideoStartTimeRef.current;
            await new Promise<void>(res => {
                const onSeek = () => { vid.removeEventListener('seeked', onSeek); res(); };
                vid.addEventListener('seeked', onSeek, { once: true });
                setTimeout(res, 300);
            });
        }

        const frameDurationUs = Math.round(1_000_000 / fps);

        // Boucle déterministe d'encodage frame par frame
        for (let f = 0; f < totalFrames; f++) {
            const frameTimeSec = f / fps;

            // Recaler la vidéo sur le timestamp exact
            if (vid && !isNaN(vid.duration) && vid.duration > 0) {
                const targetTime = bgVideoStartTimeRef.current + frameTimeSec;
                if (targetTime < vid.duration) {
                    vid.currentTime = targetTime;
                }
            }

            // Dessin
            drawFrame(exportCtx, targetWidth, targetHeight, frameTimeSec);

            // Capture Frame
            const vFrame = new VideoFrameCls(exportCanvas, {
                timestamp: f * frameDurationUs,
                duration: frameDurationUs
            });

            const isKey = (f % (fps * 2) === 0);
            encoder.encode(vFrame, { keyFrame: isKey });
            vFrame.close();

            const p = Math.round(((f + 1) / totalFrames) * 100);
            setExportProgress(p);
            setExportTimeLeft(Math.max(0, Math.ceil((totalFrames - (f + 1)) / fps)));

            if (f % 5 === 0) {
                await new Promise(r => setTimeout(r, 0));
            }
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
                        <p className="text-[10px] text-gray-400">Générateur vidéo 9:16 personnalisé avec vidéo de fond & animation 5 étapes</p>
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
                            
                            {/* Canvas 1080x1920 réel */}
                            <canvas
                                ref={canvasRef}
                                width={1080}
                                height={1920}
                                className="w-full h-full object-contain"
                            />

                            {/* Élément vidéo invisible servant de texture au canvas */}
                            <video
                                ref={videoRef}
                                src={bgVideoSrc}
                                playsInline
                                muted={isVideoAudioMuted}
                                loop
                                className="hidden"
                            />

                            {/* Badge Timeline HUD */}
                            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/70 border border-white/15 text-[9px] font-mono text-gray-300 backdrop-blur-md z-30">
                                {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
                            </div>
                        </div>
                    </div>

                    {/* BARRE DE LECTURE DU PREVIEW */}
                    <div className="w-full max-w-[420px] mt-3 space-y-2 bg-black/60 border border-white/10 p-2.5 rounded-2xl backdrop-blur-md">
                        {/* Timeline Scrubber */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-gray-400 w-10 text-right">{currentTime.toFixed(1)}s</span>
                            <input
                                type="range"
                                min={0}
                                max={totalDuration}
                                step={0.05}
                                value={currentTime}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setCurrentTime(val);
                                    if (videoRef.current) {
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
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase flex items-center gap-1.5 transition active:scale-95"
                                >
                                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                    <span>{isPlaying ? 'Pause' : 'Lecture'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCurrentTime(0);
                                        if (videoRef.current) videoRef.current.currentTime = bgVideoStartTimeRef.current;
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold text-xs uppercase transition active:scale-95"
                                    title="Recommencer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Raccourcis Scènes 1 à 5 */}
                            <div className="flex items-center gap-1">
                                {[
                                    { id: 1, label: '1. Intro', time: 0 },
                                    { id: 2, label: '2. P1', time: introDuration },
                                    { id: 3, label: '3. P2', time: introDuration + p1Duration },
                                    { id: 4, label: '4. Contact', time: introDuration + p1Duration + p2Duration },
                                    { id: 5, label: '5. Logo', time: introDuration + p1Duration + p2Duration + contactDuration },
                                ].map(sc => (
                                    <button
                                        key={sc.id}
                                        type="button"
                                        onClick={() => {
                                            setCurrentTime(sc.time);
                                            if (videoRef.current) videoRef.current.currentTime = bgVideoStartTimeRef.current + sc.time;
                                        }}
                                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[9px] font-black uppercase text-gray-300"
                                    >
                                        {sc.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* DROITE : PANNEAU DE CONTRÔLE ET RÉGLAGES ALEX */}
                <div className="w-full lg:w-[460px] border-l border-white/10 bg-[#0a0c12] flex flex-col overflow-hidden">
                    
                    {/* Onglets */}
                    <div className="flex border-b border-white/10 bg-black/40">
                        <button
                            type="button"
                            onClick={() => setActiveTab('video')}
                            className={`flex-1 py-3 text-xs font-black uppercase flex items-center justify-center gap-1.5 transition ${
                                activeTab === 'video' ? 'bg-[#ff0033]/20 text-[#ff3355] border-b-2 border-[#ff0033]' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Film className="w-4 h-4" /> Vidéo de Fond
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('textes')}
                            className={`flex-1 py-3 text-xs font-black uppercase flex items-center justify-center gap-1.5 transition ${
                                activeTab === 'textes' ? 'bg-[#ffe600]/20 text-[#ffe600] border-b-2 border-[#ffe600]' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Settings2 className="w-4 h-4" /> Textes & Profils
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
                        
                        {/* ONGLET 1 : VIDÉO DE FOND */}
                        {activeTab === 'video' && (
                            <div className="space-y-4">
                                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black uppercase text-gray-300 flex items-center gap-1.5">
                                            <Video className="w-4 h-4 text-[#ff0033]" />
                                            Fichier Vidéo de Fond
                                        </span>
                                        {bgVideoSrc && (
                                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                ✓ Vidéo Chargée
                                            </span>
                                        )}
                                    </div>

                                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-white/20 hover:border-[#ff0033] rounded-2xl cursor-pointer bg-black/40 transition group">
                                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#ff0033] mb-1 transition" />
                                        <span className="text-xs font-bold text-gray-200">Clique pour choisir une vidéo festival / club</span>
                                        <span className="text-[10px] text-gray-500 mt-0.5">MP4, MOV, WebM (Vertical ou Horizontal)</span>
                                        <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                                    </label>
                                </div>

                                {/* Scrubber de départ du passage vidéo */}
                                {videoRef.current && (
                                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                                        <div className="flex justify-between items-center text-xs font-black uppercase text-gray-300">
                                            <span>Point de départ de la vidéo :</span>
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
                                                if (videoRef.current) videoRef.current.currentTime = val + currentTime;
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
                                    </div>
                                )}

                                {/* Réglage Sourdine / Son & Voile Sombre */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                        <span className="text-[10px] font-black uppercase text-gray-400">Piste Son Vidéo</span>
                                        <button
                                            type="button"
                                            onClick={() => setIsVideoAudioMuted(!isVideoAudioMuted)}
                                            className={`w-full py-2 px-3 rounded-xl border text-xs font-black uppercase flex items-center justify-center gap-1.5 transition ${
                                                !isVideoAudioMuted ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-white/5 text-gray-400 border-white/10'
                                            }`}
                                        >
                                            {!isVideoAudioMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                            <span>{!isVideoAudioMuted ? 'Son Actif' : 'En Sourdine'}</span>
                                        </button>
                                    </div>

                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                                        <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                                            <span>Voile Sombre</span>
                                            <span className="text-amber-400">{Math.round(bgOverlayOpacity * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={0.1}
                                            max={0.85}
                                            step={0.05}
                                            value={bgOverlayOpacity}
                                            onChange={(e) => setBgOverlayOpacity(parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-amber-400 mt-2"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ONGLET 2 : TEXTES DES 5 ÉTAPES */}
                        {activeTab === 'textes' && (
                            <div className="space-y-3.5">
                                
                                {/* Étape 1 : Intro Plein Écran */}
                                <div className="p-3 rounded-2xl bg-black/40 border border-red-500/30 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-black uppercase text-[#ff3355]">
                                        <span>1. Intro Plein Écran</span>
                                        <span className="text-gray-400 font-mono text-[10px]">Durée : {introDuration}s</span>
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
                                    </div>
                                </div>

                                {/* Étape 2 : Profil 1 */}
                                <div className="p-3 rounded-2xl bg-black/40 border border-[#00f0ff]/30 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-black uppercase text-[#00f0ff]">
                                        <span>2. Profil 1 (Cyan)</span>
                                        <span className="text-gray-400 font-mono text-[10px]">Durée : {p1Duration}s</span>
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

                                {/* Étape 3 : Profil 2 */}
                                <div className="p-3 rounded-2xl bg-black/40 border border-[#ff0033]/30 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-black uppercase text-[#ff3355]">
                                        <span>3. Profil 2 (Rouge)</span>
                                        <span className="text-gray-400 font-mono text-[10px]">Durée : {p2Duration}s</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        <input
                                            type="text"
                                            value={p2Title}
                                            onChange={(e) => setP2Title(e.target.value)}
                                            placeholder="Titre Profil 2"
                                            className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs font-bold text-[#ff3355] focus:border-[#ff0033] outline-none"
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

                                {/* Étape 4 : Contact Mail / Site */}
                                <div className="p-3 rounded-2xl bg-black/40 border border-amber-500/30 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-black uppercase text-amber-300">
                                        <span>4. Phrase Contact</span>
                                        <span className="text-gray-400 font-mono text-[10px]">Durée : {contactDuration}s</span>
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

                                {/* Étape 5 : Outro Logo */}
                                <div className="p-3 rounded-2xl bg-black/40 border border-white/20 space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-black uppercase text-white">
                                        <span>5. Outro Finale Logo</span>
                                        <span className="text-gray-400 font-mono text-[10px]">Durée : {logoDuration}s</span>
                                    </div>
                                    <p className="text-[11px] text-gray-400">Le logo officiel Dropsiders apparaît au centre en grand avec pulsation néon EDM.</p>
                                </div>

                            </div>
                        )}

                        {/* ONGLET 3 : EXPORT MP4 */}
                        {activeTab === 'export' && (
                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#ff0033]/15 to-amber-500/15 border border-[#ff0033]/30 space-y-3">
                                    <div className="flex items-center gap-2 text-white font-black text-sm uppercase">
                                        <Sparkles className="w-4 h-4 text-amber-400" />
                                        <span>Paramètres d'Exportation Reel</span>
                                    </div>
                                    <ul className="text-xs text-gray-300 space-y-1.5">
                                        <li>• Résolution : <strong>1080 x 1920 (9:16 Vertical HD)</strong></li>
                                        <li>• Durée totale : <strong>{totalDuration.toFixed(1)} secondes</strong></li>
                                        <li>• Piste audio : <strong>{isVideoAudioMuted ? 'Muette' : 'Son de la vidéo inclus'}</strong></li>
                                        <li>• Encodage matériel : <strong>MP4 H.264 High Profile</strong></li>
                                    </ul>

                                    <div className="pt-2 flex items-center justify-between">
                                        <span className="text-xs font-black uppercase text-gray-400">Fluidité (FPS) :</span>
                                        <div className="flex gap-2">
                                            {[30, 60].map(f => (
                                                <button
                                                    key={f}
                                                    type="button"
                                                    onClick={() => setExportFps(f)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                                                        exportFps === f ? 'bg-[#ff0033] text-white shadow-md' : 'bg-white/5 border border-white/10 text-gray-400'
                                                    }`}
                                                >
                                                    {f} FPS
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleExportMp4}
                                    disabled={isExporting}
                                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-98 ${
                                        isExporting
                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                            : 'bg-gradient-to-r from-[#ff0033] via-rose-500 to-amber-500 hover:brightness-110 text-white shadow-[0_0_30px_rgba(255,0,51,0.5)]'
                                    }`}
                                >
                                    <Download className="w-5 h-5" />
                                    <span>{isExporting ? `Génération MP4 (${exportProgress}%)` : '🎬 Lancer l\'Export Vidéo MP4'}</span>
                                </button>
                            </div>
                        )}

                    </div>

                </div>

            </div>

        </div>
    );
};
