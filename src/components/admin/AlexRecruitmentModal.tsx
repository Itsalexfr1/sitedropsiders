import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Upload, Volume2, VolumeX, Video, Download, Sparkles, Check, Film, Settings2, Clock, Image as ImageIcon, Save, Music, Search } from 'lucide-react';
// @ts-ignore
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
// @ts-ignore
import { FFmpeg } from '@ffmpeg/ffmpeg';
// @ts-ignore
import { fetchFile } from '@ffmpeg/util';
import { isSuperAdmin } from '../../utils/auth';
import { searchMusicTracksList, type ResolvedMusicData } from '../../utils/musicResolver';

const FFMPEG_CORE_CDNS = [
    'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.9/dist/esm',
    'https://unpkg.com/@ffmpeg/core@0.12.9/dist/esm',
];

const safeFetchToBlobURL = async (url: string, mimeType: string): Promise<string> => {
    const resp = await fetch(url, { mode: 'cors' });
    if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} sur ${url}`);
    }
    const buf = await resp.arrayBuffer();
    if (buf.byteLength < 1024) {
        throw new Error(`Réponse invalide (${buf.byteLength} octets) sur ${url}`);
    }
    return URL.createObjectURL(new Blob([buf], { type: mimeType }));
};

interface AlexRecruitmentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const STORAGE_KEY = 'dropsiders_reel_recrutement_config_v1';

const DEFAULT_RECRUITMENT_TEXTS = {
    introTitle: 'DROPSIDERS',
    introSubtitle: 'RECRUTE',
    introBadge: 'SAISON 2026',
    introDuration: 4.5,
    vibeLine1: 'TU VIBRES AU SON DE LA MUSIQUE ÉLECTRONIQUE ?',
    vibeLine2: 'TU RÊVES DE DÉCOUVRIR LES BACKSTAGES DES MEILLEURS EVENTS DU MONDE ?',
    vibeCta: '⚡ REJOINS-NOUS ! ⚡',
    vibeDuration: 6.0,
    p1Tag: 'PROFIL RECHERCHÉ #1',
    p1Title: 'RÉDACTEURS & JOURNALISTES',
    p1Desc: "Passionné(e) d'électro, capable d'écrire des articles de fond, réaliser des interviews d'artistes et couvrir les plus gros festivals.",
    p1Badge: '🇬🇧 PARLER ANGLAIS EST UN VRAI PLUS',
    p1Duration: 5.5,
    p2Tag: 'PROFIL RECHERCHÉ #2',
    p2Title: 'CRÉATEURS DE CONTENU',
    p2Sub: 'TIKTOK & INSTAGRAM',
    p2Desc: "À l'aise face caméra ou caméra au poing, pour capturer l'énergie des scènes, interviewer le public et produire du contenu viral.",
    p2Badge: '🇬🇧 ANGLAIS APPRÉCIÉ POUR LES INTERVIEWS',
    p2Duration: 5.5,
    contactHeadline: 'PRÊT(E) À VIVRE LES FESTIVALS DE L\'INTÉRIEUR ?',
    contactEmail: 'contact@dropsiders.fr',
    contactSite: 'dropsiders.fr',
    contactDuration: 5.0,
    logoDuration: 5.5,
};

export const AlexRecruitmentModal: React.FC<AlexRecruitmentModalProps> = ({ isOpen, onClose }) => {
    // ── Vérification stricte Alex ──
    const currentUser = (typeof window !== 'undefined' ? localStorage.getItem('admin_user') || '' : '').toLowerCase().trim();
    const isAlex = isSuperAdmin(currentUser) || currentUser === 'alex' || currentUser === 'alexf' || currentUser === 'itsalexfr1' || currentUser.startsWith('alex');

    // ── Configuration des Textes et Durées ──
    // Scène 1 : DROPSIDERS RECRUTE
    const [introTitle, setIntroTitle] = useState(DEFAULT_RECRUITMENT_TEXTS.introTitle);
    const [introSubtitle, setIntroSubtitle] = useState(DEFAULT_RECRUITMENT_TEXTS.introSubtitle);
    const [introBadge, setIntroBadge] = useState(DEFAULT_RECRUITMENT_TEXTS.introBadge);
    const [introDuration, setIntroDuration] = useState(DEFAULT_RECRUITMENT_TEXTS.introDuration);

    // Scène 2 : Accroche Vibe / Backstages / REJOINS-NOUS
    const [vibeLine1, setVibeLine1] = useState(DEFAULT_RECRUITMENT_TEXTS.vibeLine1);
    const [vibeLine2, setVibeLine2] = useState(DEFAULT_RECRUITMENT_TEXTS.vibeLine2);
    const [vibeCta, setVibeCta] = useState(DEFAULT_RECRUITMENT_TEXTS.vibeCta);
    const [vibeDuration, setVibeDuration] = useState(DEFAULT_RECRUITMENT_TEXTS.vibeDuration);

    // Scène 3 : Profil 1 (Rédacteurs & Journalistes)
    const [p1Tag, setP1Tag] = useState(DEFAULT_RECRUITMENT_TEXTS.p1Tag);
    const [p1Title, setP1Title] = useState(DEFAULT_RECRUITMENT_TEXTS.p1Title);
    const [p1Desc, setP1Desc] = useState(DEFAULT_RECRUITMENT_TEXTS.p1Desc);
    const [p1Badge, setP1Badge] = useState(DEFAULT_RECRUITMENT_TEXTS.p1Badge);
    const [p1Duration, setP1Duration] = useState(DEFAULT_RECRUITMENT_TEXTS.p1Duration);

    // Scène 4 : Profil 2 (Créateurs de Contenu)
    const [p2Tag, setP2Tag] = useState(DEFAULT_RECRUITMENT_TEXTS.p2Tag);
    const [p2Title, setP2Title] = useState(DEFAULT_RECRUITMENT_TEXTS.p2Title);
    const [p2Sub, setP2Sub] = useState(DEFAULT_RECRUITMENT_TEXTS.p2Sub);
    const [p2Desc, setP2Desc] = useState(DEFAULT_RECRUITMENT_TEXTS.p2Desc);
    const [p2Badge, setP2Badge] = useState(DEFAULT_RECRUITMENT_TEXTS.p2Badge);
    const [p2Duration, setP2Duration] = useState(DEFAULT_RECRUITMENT_TEXTS.p2Duration);

    // Scène 5 : Contact
    const [contactHeadline, setContactHeadline] = useState(DEFAULT_RECRUITMENT_TEXTS.contactHeadline);
    const [contactEmail, setContactEmail] = useState(DEFAULT_RECRUITMENT_TEXTS.contactEmail);
    const [contactSite, setContactSite] = useState(DEFAULT_RECRUITMENT_TEXTS.contactSite);
    const [contactDuration, setContactDuration] = useState(DEFAULT_RECRUITMENT_TEXTS.contactDuration);

    // Scène 6 : Outro Finale Logo (Durée confortable 5.5s pour apprécier l'animation ralentie)
    const [logoDuration, setLogoDuration] = useState(DEFAULT_RECRUITMENT_TEXTS.logoDuration);

    // Feedback Sauvegarde
    const [isSavedJustNow, setIsSavedJustNow] = useState<boolean>(false);

    // ── Fond Visuel (Vidéo de Fond, Lasers de Concert ou Image Uploadée) ──
    const [bgType, setBgType] = useState<'video' | 'image' | 'lasers'>('video');
    const [bgImageSrc, setBgImageSrc] = useState<string>('');
    const [bgVideoSrc, setBgVideoSrc] = useState<string>('');
    const [bgAudioSrc, setBgAudioSrc] = useState<string>('');
    const [bgAudioStartTime, setBgAudioStartTime] = useState<number>(0);
    const [bgAudioDuration, setBgAudioDuration] = useState<number>(0);
    const [bgAudioTitle, setBgAudioTitle] = useState<string>('');
    const [bgAudioArtist, setBgAudioArtist] = useState<string>('');
    const [bgAudioCover, setBgAudioCover] = useState<string>('');
    const [isBeatportSearchOpen, setIsBeatportSearchOpen] = useState<boolean>(false);
    const [beatportQuery, setBeatportQuery] = useState<string>('');
    const [beatportResults, setBeatportResults] = useState<ResolvedMusicData[]>([]);
    const [isSearchingBeatport, setIsSearchingBeatport] = useState<boolean>(false);
    const [bgVideoStartTime, setBgVideoStartTime] = useState<number>(0);
    const [bgVideoDuration, setBgVideoDuration] = useState<number>(0);
    const [isVideoAudioMuted, setIsVideoAudioMuted] = useState<boolean>(false);
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
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const bgImgRef = useRef<HTMLImageElement | null>(null);
    const logoImgRef = useRef<HTMLImageElement | null>(null);
    const logoPureImgRef = useRef<HTMLImageElement | null>(null);
    const darkLogoCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const bgVideoBlobRef = useRef<Blob | null>(null);
    const bgAudioBlobRef = useRef<Blob | null>(null);

    // Time Tracking Ref pour 60 FPS fluide sans React re-render
    const currentTimeRef = useRef<number>(0);
    const lastTimestampRef = useRef<number>(performance.now());
    const isPlayingRef = useRef<boolean>(true);
    const isExportingRef = useRef<boolean>(false);
    const bgVideoStartTimeRef = useRef<number>(0);
    const bgAudioStartTimeRef = useRef<number>(0);
    const lastUiUpdateRef = useRef<number>(0);

    const totalDuration = introDuration + vibeDuration + p1Duration + p2Duration + contactDuration + logoDuration;

    // Charger les textes sauvegardés au démarrage
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const p = JSON.parse(raw);
                if (p.introTitle !== undefined) setIntroTitle(p.introTitle);
                if (p.introSubtitle !== undefined) setIntroSubtitle(p.introSubtitle);
                if (p.introBadge !== undefined) setIntroBadge(p.introBadge);
                if (p.introDuration !== undefined) setIntroDuration(p.introDuration);
                if (p.vibeLine1 !== undefined) setVibeLine1(p.vibeLine1);
                if (p.vibeLine2 !== undefined) setVibeLine2(p.vibeLine2);
                if (p.vibeCta !== undefined) setVibeCta(p.vibeCta);
                if (p.vibeDuration !== undefined) setVibeDuration(p.vibeDuration);
                if (p.p1Tag !== undefined) setP1Tag(p.p1Tag);
                if (p.p1Title !== undefined) setP1Title(p.p1Title);
                if (p.p1Desc !== undefined) setP1Desc(p.p1Desc);
                if (p.p1Badge !== undefined) setP1Badge(p.p1Badge);
                if (p.p1Duration !== undefined) setP1Duration(p.p1Duration);
                if (p.p2Tag !== undefined) setP2Tag(p.p2Tag);
                if (p.p2Title !== undefined) setP2Title(p.p2Title);
                if (p.p2Sub !== undefined) setP2Sub(p.p2Sub);
                if (p.p2Desc !== undefined) setP2Desc(p.p2Desc);
                if (p.p2Badge !== undefined) setP2Badge(p.p2Badge);
                if (p.p2Duration !== undefined) setP2Duration(p.p2Duration);
                if (p.contactHeadline !== undefined) setContactHeadline(p.contactHeadline);
                if (p.contactEmail !== undefined) setContactEmail(p.contactEmail);
                if (p.contactSite !== undefined) setContactSite(p.contactSite);
                if (p.contactDuration !== undefined) setContactDuration(p.contactDuration);
                if (p.logoDuration !== undefined) setLogoDuration(p.logoDuration);
            }
        } catch (e) {
            console.warn("Could not load saved recruitment reel config:", e);
        }
    }, []);

    // Sauvegarder la configuration des textes
    const handleSaveConfig = () => {
        const config = {
            introTitle, introSubtitle, introBadge, introDuration,
            vibeLine1, vibeLine2, vibeCta, vibeDuration,
            p1Tag, p1Title, p1Desc, p1Badge, p1Duration,
            p2Tag, p2Title, p2Sub, p2Desc, p2Badge, p2Duration,
            contactHeadline, contactEmail, contactSite, contactDuration,
            logoDuration
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
            setIsSavedJustNow(true);
            setTimeout(() => setIsSavedJustNow(false), 2500);
        } catch (e) {
            console.error("Save config error:", e);
        }
    };

    // Rétablir les textes par défaut
    const handleResetDefaults = () => {
        if (!confirm("Rétablir les textes et durées par défaut du Reel Recrutement ?")) return;
        setIntroTitle(DEFAULT_RECRUITMENT_TEXTS.introTitle);
        setIntroSubtitle(DEFAULT_RECRUITMENT_TEXTS.introSubtitle);
        setIntroBadge(DEFAULT_RECRUITMENT_TEXTS.introBadge);
        setIntroDuration(DEFAULT_RECRUITMENT_TEXTS.introDuration);
        setVibeLine1(DEFAULT_RECRUITMENT_TEXTS.vibeLine1);
        setVibeLine2(DEFAULT_RECRUITMENT_TEXTS.vibeLine2);
        setVibeCta(DEFAULT_RECRUITMENT_TEXTS.vibeCta);
        setVibeDuration(DEFAULT_RECRUITMENT_TEXTS.vibeDuration);
        setP1Tag(DEFAULT_RECRUITMENT_TEXTS.p1Tag);
        setP1Title(DEFAULT_RECRUITMENT_TEXTS.p1Title);
        setP1Desc(DEFAULT_RECRUITMENT_TEXTS.p1Desc);
        setP1Badge(DEFAULT_RECRUITMENT_TEXTS.p1Badge);
        setP1Duration(DEFAULT_RECRUITMENT_TEXTS.p1Duration);
        setP2Tag(DEFAULT_RECRUITMENT_TEXTS.p2Tag);
        setP2Title(DEFAULT_RECRUITMENT_TEXTS.p2Title);
        setP2Sub(DEFAULT_RECRUITMENT_TEXTS.p2Sub);
        setP2Desc(DEFAULT_RECRUITMENT_TEXTS.p2Desc);
        setP2Badge(DEFAULT_RECRUITMENT_TEXTS.p2Badge);
        setP2Duration(DEFAULT_RECRUITMENT_TEXTS.p2Duration);
        setContactHeadline(DEFAULT_RECRUITMENT_TEXTS.contactHeadline);
        setContactEmail(DEFAULT_RECRUITMENT_TEXTS.contactEmail);
        setContactSite(DEFAULT_RECRUITMENT_TEXTS.contactSite);
        setContactDuration(DEFAULT_RECRUITMENT_TEXTS.contactDuration);
        setLogoDuration(DEFAULT_RECRUITMENT_TEXTS.logoDuration);
        try {
            localStorage.removeItem(STORAGE_KEY);
            setIsSavedJustNow(true);
            setTimeout(() => setIsSavedJustNow(false), 2500);
        } catch {}
    };

    // Ref pour l'état audio afin d'éviter les pièges de capture et les désynchronisations
    const isVideoAudioMutedRef = useRef<boolean>(isVideoAudioMuted);

    // Débloquer le son dès le moindre clic utilisateur dans la modal (politique autoplay navigateur)
    const handleUserInteractionUnlockAudio = () => {
        const vid = videoRef.current;
        const aud = audioRef.current;
        if (!isVideoAudioMutedRef.current) {
            if (vid && vid.muted) {
                vid.muted = false;
                vid.volume = 1.0;
                vid.play().catch(() => {});
            }
            if (aud && aud.muted) {
                aud.muted = false;
                aud.volume = 1.0;
                aud.play().catch(() => {});
            }
        }
    };

    // Basculer l'état audio (Muet / Son Actif) avec déverrouillage forcé AudioContext
    const toggleAudio = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const vid = videoRef.current;
        const aud = audioRef.current;

        // Déterminer si on doit activer le son
        const willUnmute = isVideoAudioMuted || (vid && vid.muted) || (aud && aud.muted);

        if (willUnmute) {
            setIsVideoAudioMuted(false);
            isVideoAudioMutedRef.current = false;

            if (vid) {
                vid.muted = false;
                vid.volume = 1.0;
                try {
                    await vid.play();
                } catch (err) {
                    console.warn("Direct play unmuted error, attempting AudioContext resume:", err);
                    try {
                        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
                        if (AudioCtx) {
                            const actx = new AudioCtx();
                            await actx.resume();
                        }
                        vid.muted = false;
                        vid.volume = 1.0;
                        await vid.play();
                    } catch (e2) {
                        console.warn("Audio unlock failed:", e2);
                    }
                }
            }

            if (aud) {
                aud.muted = false;
                aud.volume = 1.0;
                aud.play().catch(() => {});
            }
        } else {
            setIsVideoAudioMuted(true);
            isVideoAudioMutedRef.current = true;
            if (vid) vid.muted = true;
            if (aud) aud.muted = true;
        }
    };

    // Upload d'une piste audio MP3 dédiée pour le reel
    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const blobUrl = URL.createObjectURL(file);
        bgAudioBlobRef.current = file;
        setBgAudioSrc(blobUrl);
        setBgAudioTitle(file.name.replace(/\.[^/.]+$/, ''));
        setBgAudioArtist('Fichier Audio MP3');
        setBgAudioCover('');
        setBgAudioStartTime(0);
        bgAudioStartTimeRef.current = 0;
        const aud = audioRef.current;
        if (aud) {
            aud.src = blobUrl;
            aud.muted = false;
            aud.volume = 1.0;
            aud.currentTime = 0;
            aud.onloadedmetadata = () => {
                setBgAudioDuration(aud.duration || 0);
            };
            aud.play().then(() => {
                setIsVideoAudioMuted(false);
                isVideoAudioMutedRef.current = false;
            }).catch(() => {});
        }
    };

    // Recherche de tracks Beatport officielles (120s Drop)
    const handleBeatportSearch = async () => {
        const q = beatportQuery.trim();
        if (!q) return;
        setIsSearchingBeatport(true);
        setBeatportResults([]);
        try {
            const results = await searchMusicTracksList(q, 6);
            setBeatportResults(results);
        } catch (e) {
            console.warn("Erreur recherche Beatport Reel :", e);
        } finally {
            setIsSearchingBeatport(false);
        }
    };

    // Sélection d'un son Beatport (avec préchargement Blob sans CORS via proxy-media si nécessaire)
    const handleSelectBeatportTrack = async (item: ResolvedMusicData) => {
        const rawUrl = item.audioUrl;
        setBgAudioSrc(rawUrl);
        bgAudioBlobRef.current = null;
        setBgAudioTitle(item.title || '');
        setBgAudioArtist(item.artist || 'Beatport');
        setBgAudioCover(item.coverUrl || '');
        setBgAudioStartTime(0);
        bgAudioStartTimeRef.current = 0;
        setBgAudioDuration(item.duration || 120);
        setIsBeatportSearchOpen(false);
        setBeatportResults([]);
        setIsVideoAudioMuted(false);
        isVideoAudioMutedRef.current = false;

        if (videoRef.current) {
            videoRef.current.muted = true;
        }

        const aud = audioRef.current;
        if (aud) {
            aud.src = rawUrl;
            aud.muted = false;
            aud.volume = 1.0;
            aud.currentTime = 0;
            aud.play().catch(() => {});
        }

        try {
            let res = await fetch(rawUrl).catch(() => null);
            if ((!res || !res.ok) && /^https?:\/\//i.test(rawUrl) && !rawUrl.includes('/api/proxy-media')) {
                res = await fetch(`/api/proxy-media?url=${encodeURIComponent(rawUrl)}`).catch(() => null);
            }
            if (res && res.ok) {
                const blob = await res.blob();
                if (blob && blob.size > 0) {
                    bgAudioBlobRef.current = blob;
                    const blobUrl = URL.createObjectURL(blob);
                    setBgAudioSrc(blobUrl);
                    if (audioRef.current) {
                        const curT = audioRef.current.currentTime || 0;
                        audioRef.current.src = blobUrl;
                        audioRef.current.muted = isVideoAudioMutedRef.current;
                        audioRef.current.volume = 1.0;
                        audioRef.current.currentTime = curT;
                        if (isPlayingRef.current) {
                            audioRef.current.play().catch(() => {});
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('Beatport audio preload fallback:', err);
        }
    };

    // Synchroniser refs
    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    useEffect(() => {
        bgVideoStartTimeRef.current = bgVideoStartTime;
    }, [bgVideoStartTime]);

    useEffect(() => {
        bgAudioStartTimeRef.current = bgAudioStartTime;
    }, [bgAudioStartTime]);

    useEffect(() => {
        const aud = audioRef.current;
        if (!aud || !bgAudioSrc) return;
        const handleMeta = () => {
            if (aud.duration && isFinite(aud.duration)) {
                setBgAudioDuration(aud.duration);
            }
        };
        aud.addEventListener('loadedmetadata', handleMeta);
        return () => aud.removeEventListener('loadedmetadata', handleMeta);
    }, [bgAudioSrc]);

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
            // Pré-générer la version 3D sombre offscreen (0 lag, 60 FPS sans aucun ctx.filter)
            try {
                const off = document.createElement('canvas');
                off.width = pureImg.naturalWidth;
                off.height = pureImg.naturalHeight;
                const octx = off.getContext('2d');
                if (octx) {
                    octx.drawImage(pureImg, 0, 0);
                    octx.globalCompositeOperation = 'source-in';
                    octx.fillStyle = '#2d3340'; // Acier sombre brossé
                    octx.fillRect(0, 0, off.width, off.height);
                    darkLogoCanvasRef.current = off;
                }
            } catch {}
        };
    }, []);

    // ── Gestionnaire d'Upload Médias (Vidéo ou Image) ──
    const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isVid = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(file.name);
        const blobUrl = URL.createObjectURL(file);

        if (isVid) {
            bgVideoBlobRef.current = file;
            setBgType('video');
            setBgVideoSrc(blobUrl);
            setBgVideoStartTime(0);
            bgVideoStartTimeRef.current = 0;
            currentTimeRef.current = 0;
            setUiDisplayTime(0);
            setIsVideoAudioMuted(false);
            isVideoAudioMutedRef.current = false;

            // Immédiatement lancer avec son dans le contexte direct de ce clic utilisateur
            const vid = videoRef.current;
            if (vid) {
                vid.src = blobUrl;
                vid.muted = Boolean(bgAudioSrc);
                vid.volume = 1.0;
                vid.currentTime = 0;
                vid.play().catch((err) => {
                    if (err?.name === 'AbortError') return;
                    vid.muted = true;
                    vid.play().catch(() => {});
                });
            }
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

    // Synchroniser l'état audio et volume sans recharger la vidéo
    useEffect(() => {
        isVideoAudioMutedRef.current = isVideoAudioMuted;
        const vid = videoRef.current;
        const aud = audioRef.current;
        const hasMusicTrack = Boolean(bgAudioSrc);
        if (vid) {
            vid.muted = hasMusicTrack ? true : isVideoAudioMuted;
            vid.volume = 1.0;
            if (!isVideoAudioMuted && isPlaying && bgVideoSrc) {
                vid.play().catch(() => {});
            }
        }
        if (aud) {
            aud.muted = isVideoAudioMuted;
            aud.volume = 1.0;
            if (!isVideoAudioMuted && isPlaying && hasMusicTrack) {
                aud.play().catch(() => {});
            }
        }
    }, [isVideoAudioMuted, isPlaying, bgAudioSrc, bgVideoSrc]);

    // Chargement automatique et persistant de la vidéo de fond uploadée (sans interrompre un play() déjà lancé)
    useEffect(() => {
        if (!bgVideoSrc) return;
        const vid = videoRef.current;
        if (!vid) return;

        const handleMetadata = () => {
            if (vid.duration && !isNaN(vid.duration)) {
                setBgVideoDuration(vid.duration);
            }
            vid.volume = 1.0;
            if (isPlayingRef.current) {
                vid.muted = Boolean(bgAudioSrc) ? true : isVideoAudioMutedRef.current;
                vid.play().catch((err) => {
                    if (err?.name === 'AbortError') return;
                    vid.muted = true;
                    vid.play().catch(() => {});
                });
            }
        };

        vid.addEventListener('loadedmetadata', handleMetadata);
        if (vid.src !== bgVideoSrc) {
            vid.src = bgVideoSrc;
            vid.currentTime = bgVideoStartTimeRef.current;
            vid.load();
        } else if (vid.readyState >= 1) {
            handleMetadata();
        }
        return () => {
            vid.removeEventListener('loadedmetadata', handleMetadata);
        };
    }, [bgVideoSrc]);

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
            ctx.font = '800 30px "Montserrat", sans-serif';
            ctx.fillStyle = '#aaaaaa';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
            ctx.shadowBlur = 15;
            ctx.fillText('🌐 OU VIA LE FORMULAIRE SUR LE SITE :', width / 2, height * 0.60);

            ctx.font = '900 62px "Syncopate", "Orbitron", sans-serif';
            (ctx as any).letterSpacing = '8px';
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
        // SCÈNE 6 : APPARITION DU VRAI LOGO DROPSIDERS 3D VOLUMÉTRIQUE (EFFET HOMEPAGE ANIMATED3DLOGO)
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

            // ── Chronologie d'apparition ralentie & cinématographique ──
            const strokeDuration = 1.25;
            const frameProgress = Math.min(1, Math.max(0, sceneTime / strokeDuration));

            const textStart = 0.45;
            const totalLetters = 13; // D-R-O-P-S-I-D-E-R-S-.-F-R
            const letterDuration = 0.11;
            const elapsedForText = Math.max(0, sceneTime - textStart);
            const lettersVisible = Math.min(totalLetters, Math.floor(elapsedForText / letterDuration));

            const subText = "WWW.DROPSIDERS.FR";
            const subStart = 2.0;
            const subSpeed = 0.065;
            const elapsedForSub = Math.max(0, sceneTime - subStart);
            const numSubVisible = Math.min(subText.length, Math.floor(elapsedForSub / subSpeed));

            // ── Mouvement de Pendule 3D (Identique à Animated3DLogo.tsx de l'accueil) ──
            const swingSpeed = (2 * Math.PI) / 4.2; // Période exacte de 4.2s
            const swingProgress = Math.min(1, Math.max(0, sceneTime / 0.8));
            const rotY = Math.sin(sceneTime * swingSpeed) * (0.32 * swingProgress); // Balancement ~18°
            const rotX = 0.07 * swingProgress; // Inclinaison 4°

            // Helper de tracé des éléments du logo pour chaque tranche 3D (0 lag, 60 FPS fluide sans ctx.filter)
            const renderLogoSlice = (
                c: CanvasRenderingContext2D,
                isFront: boolean,
                sliceShade: number = 1
            ) => {
                // 1. Tracé dynamique des lignes du cadre
                if (frameProgress > 0) {
                    c.save();
                    c.lineWidth = isFront ? 10 : 8;
                    if (isFront) {
                        c.strokeStyle = '#ffffff';
                        c.shadowColor = 'rgba(0, 0, 0, 0.95)';
                        c.shadowOffsetX = -Math.sin(rotY) * 6;
                        c.shadowOffsetY = 6;
                        c.shadowBlur = 10;
                    } else {
                        const val = Math.round(35 + sliceShade * 75);
                        c.strokeStyle = `rgb(${val}, ${val + 5}, ${val + 15})`;
                        c.shadowColor = 'transparent';
                        c.shadowBlur = 0;
                        c.shadowOffsetX = 0;
                        c.shadowOffsetY = 0;
                    }
                    c.lineCap = 'square';
                    c.lineJoin = 'miter';

                    const perimeterHalf = halfW + boxH + halfW;
                    const currentDist = frameProgress * perimeterHalf;

                    // Côté Droit : Haut-centre -> Coin haut-droit -> Coin bas-droit -> Bas-centre
                    c.beginPath();
                    c.moveTo(0, -halfH);
                    if (currentDist <= halfW) {
                        c.lineTo(currentDist, -halfH);
                    } else if (currentDist <= halfW + boxH) {
                        c.lineTo(halfW, -halfH);
                        c.lineTo(halfW, -halfH + (currentDist - halfW));
                    } else {
                        c.lineTo(halfW, -halfH);
                        c.lineTo(halfW, halfH);
                        c.lineTo(halfW - (currentDist - (halfW + boxH)), halfH);
                    }
                    c.stroke();

                    // Côté Gauche : Haut-centre -> Coin haut-gauche -> Coin bas-gauche -> Bas-centre
                    c.beginPath();
                    c.moveTo(0, -halfH);
                    if (currentDist <= halfW) {
                        c.lineTo(-currentDist, -halfH);
                    } else if (currentDist <= halfW + boxH) {
                        c.lineTo(-halfW, -halfH);
                        c.lineTo(-halfW, -halfH + (currentDist - halfW));
                    } else {
                        c.lineTo(-halfW, -halfH);
                        c.lineTo(-halfW, halfH);
                        c.lineTo(-halfW + (currentDist - (halfW + boxH)), halfH);
                    }
                    c.stroke();
                    c.restore();
                }

                // 2. Lettres du vrai logo officiel DROPSIDERS.FR
                if (lettersVisible > 0) {
                    const pureImg = logoPureImgRef.current;
                    const fallbackImg = logoImgRef.current;
                    const darkImg = darkLogoCanvasRef.current;

                    if (pureImg && pureImg.complete && pureImg.naturalWidth > 0) {
                        const lw = 760;
                        const lh = Math.round(lw * (pureImg.naturalHeight / pureImg.naturalWidth));
                        const revealW = (lettersVisible / totalLetters) * lw;

                        c.save();
                        if (isFront) {
                            c.shadowColor = 'rgba(0, 0, 0, 0.95)';
                            c.shadowOffsetX = -Math.sin(rotY) * 6;
                            c.shadowOffsetY = 6;
                            c.shadowBlur = 10;
                        } else {
                            c.shadowColor = 'transparent';
                            c.shadowBlur = 0;
                            c.shadowOffsetX = 0;
                            c.shadowOffsetY = 0;
                        }
                        c.beginPath();
                        c.rect(-lw / 2, -lh / 2, revealW, lh);
                        c.clip();
                        // Tranches arrière rendues instantanément via buffer offscreen dark (0 lag GPU !)
                        c.drawImage(isFront ? pureImg : (darkImg || pureImg), -lw / 2, -lh / 2, lw, lh);
                        c.restore();

                        // Curseur lumineux d'écriture à la dernière lettre révélée (sur la face avant uniquement)
                        if (isFront && lettersVisible < totalLetters) {
                            c.save();
                            c.fillStyle = '#ff0033';
                            c.shadowColor = '#ff0033';
                            c.shadowBlur = 12;
                            c.fillRect(-lw / 2 + revealW - 2, -lh / 2 + 10, 6, lh - 20);
                            c.restore();
                        }
                    } else if (fallbackImg && fallbackImg.complete && fallbackImg.naturalWidth > 0) {
                        const lw = 820;
                        const lh = Math.round(lw * (fallbackImg.naturalHeight / fallbackImg.naturalWidth));
                        const revealW = (lettersVisible / totalLetters) * lw;

                        c.save();
                        if (isFront) {
                            c.shadowColor = 'rgba(0, 0, 0, 0.95)';
                            c.shadowOffsetX = -Math.sin(rotY) * 6;
                            c.shadowOffsetY = 6;
                            c.shadowBlur = 10;
                        } else {
                            c.shadowColor = 'transparent';
                            c.shadowBlur = 0;
                            c.shadowOffsetX = 0;
                            c.shadowOffsetY = 0;
                        }
                        c.beginPath();
                        c.rect(-lw / 2, -lh / 2, revealW, lh * 0.72);
                        c.clip();
                        c.drawImage(fallbackImg, -lw / 2, -lh / 2, lw, lh);
                        c.restore();
                    }
                }

                // 3. Sous-titre WWW.DROPSIDERS.FR (Police moderne Syncopate / Orbitron avec espacement racé)
                if (numSubVisible > 0) {
                    const visibleSub = subText.slice(0, numSubVisible);
                    c.save();
                    c.font = '900 36px "Syncopate", "Orbitron", sans-serif';
                    (c as any).letterSpacing = '10px';
                    if (isFront) {
                        c.fillStyle = '#ffffff';
                        c.shadowColor = 'rgba(0, 0, 0, 0.95)';
                        c.shadowOffsetX = -Math.sin(rotY) * 6;
                        c.shadowOffsetY = 6;
                        c.shadowBlur = 10;
                    } else {
                        const val = Math.round(40 + sliceShade * 60);
                        c.fillStyle = `rgb(${val}, ${val + 5}, ${val + 12})`;
                        c.shadowColor = 'transparent';
                        c.shadowBlur = 0;
                        c.shadowOffsetX = 0;
                        c.shadowOffsetY = 0;
                    }
                    c.fillText(visibleSub, 0, halfH + 68);

                    if (isFront && numSubVisible < subText.length) {
                        const metrics = c.measureText(visibleSub);
                        const curX = metrics.width / 2 + 10;
                        c.fillStyle = '#ff0033';
                        c.shadowColor = '#ff0033';
                        c.shadowBlur = 10;
                        c.fillRect(curX, halfH + 48, 4, 30);
                    }
                    c.restore();
                }
            };

            // ── 1. OMBRE PORTÉE DE CONTACT (0 lag, ombre matérielle ultra fluide) ──
            ctx.save();
            const shadowZ = -22;
            ctx.transform(
                Math.cos(rotY),
                Math.sin(rotX) * Math.sin(rotY),
                0,
                Math.cos(rotX),
                -Math.sin(rotY) * shadowZ,
                Math.sin(rotX) * shadowZ + 12
            );
            ctx.globalAlpha = 0.50;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 8;
            renderLogoSlice(ctx, false, 0.1);
            ctx.restore();

            // ── 2. TRANCHES 3D VOLUMÉTRIQUES EXTRUDÉES (Acier / Titane sombre comme Animated3DLogo, 60 FPS garanti) ──
            const sliceCount = 8;
            const maxDepth = 20;
            for (let idx = 0; idx < sliceCount; idx++) {
                const i = sliceCount - idx;
                const z = -((i / sliceCount) * maxDepth);
                const ratio = 1 - (i / sliceCount);
                const shade = 0.18 + ratio * 0.55;

                ctx.save();
                ctx.transform(
                    Math.cos(rotY),
                    Math.sin(rotX) * Math.sin(rotY),
                    0,
                    Math.cos(rotX),
                    -Math.sin(rotY) * z,
                    Math.sin(rotX) * z
                );
                ctx.globalAlpha = 0.95;
                renderLogoSlice(ctx, false, shade);
                ctx.restore();
            }

            // ── 3. FACE AVANT 3D (Blanc pur éclatant + relief ciselé sans filtre laguant) ──
            ctx.save();
            ctx.transform(
                Math.cos(rotY),
                Math.sin(rotX) * Math.sin(rotY),
                0,
                Math.cos(rotX),
                0,
                0
            );
            ctx.globalAlpha = 1.0;
            renderLogoSlice(ctx, true, 1.0);
            ctx.restore();

            ctx.restore();

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
                    if (audioRef.current && audioRef.current.src) {
                        audioRef.current.currentTime = bgAudioStartTimeRef.current;
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

    // Gestion propre de la lecture/pause de la vidéo de fond et de la musique
    useEffect(() => {
        const vid = videoRef.current;
        const aud = audioRef.current;
        if (isPlaying) {
            if (vid && !isNaN(vid.duration) && vid.duration > 0) {
                vid.play().catch(() => {});
            }
            if (aud && aud.src) {
                aud.play().catch(() => {});
            }
        } else {
            if (vid) vid.pause();
            if (aud) aud.pause();
        }
    }, [isPlaying]);

    const ffmpegRef = useRef<any>(null);
    const ensureFFmpegLoaded = async (): Promise<any> => {
        if (ffmpegRef.current && ffmpegRef.current.loaded) {
            return ffmpegRef.current;
        }
        if (ffmpegRef.current) {
            try { ffmpegRef.current.terminate(); } catch {}
            ffmpegRef.current = null;
        }
        let lastErr: unknown = null;
        for (const baseURL of FFMPEG_CORE_CDNS) {
            const instance = new FFmpeg();
            try {
                await instance.load({
                    coreURL: `${baseURL}/ffmpeg-core.js`,
                    wasmURL: `${baseURL}/ffmpeg-core.wasm`,
                });
                ffmpegRef.current = instance;
                return instance;
            } catch (err) {
                lastErr = err;
                try { instance.terminate(); } catch {}
            }
        }
        for (const baseURL of FFMPEG_CORE_CDNS) {
            const instance = new FFmpeg();
            try {
                const coreBlobUrl = await safeFetchToBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
                const wasmBlobUrl = await safeFetchToBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
                await instance.load({ coreURL: coreBlobUrl, wasmURL: wasmBlobUrl });
                ffmpegRef.current = instance;
                return instance;
            } catch (err) {
                lastErr = err;
                try { instance.terminate(); } catch {}
            }
        }
        throw lastErr || new Error('Impossible de charger FFmpeg');
    };

    const audioBufferToWavBlob = (renderedBuffer: AudioBuffer): Blob => {
        const numCh = renderedBuffer.numberOfChannels;
        const numSamples = renderedBuffer.length;
        const sr = renderedBuffer.sampleRate;
        const wavBuffer = new ArrayBuffer(44 + numSamples * numCh * 2);
        const view = new DataView(wavBuffer);
        const writeStr = (off: number, str: string) => {
            for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
        };
        writeStr(0, 'RIFF');
        view.setUint32(4, 36 + numSamples * numCh * 2, true);
        writeStr(8, 'WAVE');
        writeStr(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numCh, true);
        view.setUint32(24, sr, true);
        view.setUint32(28, sr * numCh * 2, true);
        view.setUint16(32, numCh * 2, true);
        view.setUint16(34, 16, true);
        writeStr(36, 'data');
        view.setUint32(40, numSamples * numCh * 2, true);
        let offset2 = 44;
        const chData: Float32Array[] = [];
        for (let ch = 0; ch < numCh; ch++) chData.push(renderedBuffer.getChannelData(ch));
        for (let i = 0; i < numSamples; i++) {
            for (let ch = 0; ch < numCh; ch++) {
                const sample = Math.max(-1, Math.min(1, chData[ch][i]));
                view.setInt16(offset2, sample < 0 ? sample * 32768 : sample * 32767, true);
                offset2 += 2;
            }
        }
        return new Blob([wavBuffer], { type: 'audio/wav' });
    };

    // Helper : extraction et bouclage audio pour l'export MP4
    const extractAudioBuffer = async (blob: Blob, durationSec: number, startSec: number = 0): Promise<AudioBuffer | null> => {
        try {
            const arr = await blob.arrayBuffer();
            if (!arr || arr.byteLength === 0) return null;
            const OfflineCtxCls = (window as any).OfflineAudioContext || (window as any).webkitOfflineAudioContext;
            const AudioCtxCls = (window as any).AudioContext || (window as any).webkitAudioContext || OfflineCtxCls;
            if (!AudioCtxCls || !OfflineCtxCls) return null;
            const tempCtx = AudioCtxCls === OfflineCtxCls ? new OfflineCtxCls(2, 1, 48000) : new AudioCtxCls();
            if (tempCtx.state === 'suspended' && typeof tempCtx.resume === 'function') {
                await tempCtx.resume().catch(() => {});
            }
            const fullBuf = await new Promise<AudioBuffer>((resolve, reject) => {
                let settled = false;
                const onOk = (b: AudioBuffer) => { if (!settled) { settled = true; resolve(b); } };
                const onErr = (e: any) => { if (!settled) { settled = true; reject(e); } };
                try {
                    const p = tempCtx.decodeAudioData(arr.slice(0), onOk, onErr);
                    if (p && typeof p.then === 'function') p.then(onOk, onErr).catch(onErr);
                } catch (err) {
                    onErr(err);
                }
            });
            if (typeof tempCtx.close === 'function') {
                tempCtx.close().catch(() => {});
            }

            if (!fullBuf || fullBuf.numberOfChannels === 0 || fullBuf.length === 0 || fullBuf.duration <= 0) return null;

            const sr = 48000;
            const outChannels = Math.min(2, Math.max(1, fullBuf.numberOfChannels));
            const targetLen = Math.max(1, Math.round(durationSec * sr));
            const offline = new OfflineCtxCls(outChannels, targetLen, sr);
            const source = offline.createBufferSource();
            source.buffer = fullBuf;
            source.loop = true;
            source.loopStart = 0;
            source.loopEnd = fullBuf.duration;
            const safeStart = Math.max(0, startSec) % fullBuf.duration;
            source.start(0, isFinite(safeStart) ? safeStart : 0);
            source.connect(offline.destination);

            return await offline.startRendering();
        } catch (e) {
            console.warn("Extraction audio impossible via WebAudio (repli FFmpeg possible) :", e);
            return null;
        }
    };

    // ── MOTEUR D'EXPORTATION MP4 (1080x1920, 60 ou 30 FPS avec Audio garanti) ──
    const handleExportMp4 = async () => {
        if (isExporting) return;
        setIsExporting(true);
        isExportingRef.current = true;
        setIsPlaying(false);
        isPlayingRef.current = false;
        setExportProgress(0);

        if (audioRef.current) {
            audioRef.current.pause();
        }

        const targetWidth = 1080;
        const targetHeight = 1920;
        const fps = exportFps;
        const totalFrames = Math.max(1, Math.round(totalDuration * fps));

        // Canvas d'export haute résolution
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = targetWidth;
        exportCanvas.height = targetHeight;
        const exportCtx = exportCanvas.getContext('2d')!;

        // Extraction audio : priorité à la musique dédiée (MP3/Beatport), sinon son de la vidéo de fond
        // On n'ignore JAMAIS le son à l'export à cause du mute de la preview !
        const vid = videoRef.current;
        const hasBgVideo = bgType === 'video' && Boolean((vid && !isNaN(vid.duration) && vid.duration > 0) || bgVideoBlobRef.current || bgVideoSrc);
        const hasDedicatedAudio = Boolean(bgAudioBlobRef.current || bgAudioSrc);
        let audioBuf: AudioBuffer | null = null;
        let resolvedBgVideoBlob: Blob | null = bgVideoBlobRef.current;
        const AudioEncoderCls = (window as any).AudioEncoder;
        const AudioDataCls = (window as any).AudioData;
        const canEncodeAudio = typeof AudioEncoderCls !== 'undefined' && typeof AudioDataCls !== 'undefined';

        const fetchBlobWithProxyFallback = async (url: string): Promise<Blob | null> => {
            if (!url) return null;
            let res = await fetch(url).catch(() => null);
            if ((!res || !res.ok) && /^https?:\/\//i.test(url) && !url.includes('/api/proxy-media')) {
                res = await fetch(`/api/proxy-media?url=${encodeURIComponent(url)}`).catch(() => null);
            }
            if (res && res.ok) {
                return await res.blob().catch(() => null);
            }
            return null;
        };

        try {
            if (hasDedicatedAudio) {
                const audioBlob = bgAudioBlobRef.current || (bgAudioSrc ? await fetchBlobWithProxyFallback(bgAudioSrc) : null);
                if (audioBlob) {
                    bgAudioBlobRef.current = audioBlob;
                    audioBuf = await extractAudioBuffer(audioBlob, totalDuration, bgAudioStartTimeRef.current);
                }
            } else if (hasBgVideo) {
                const blob = bgVideoBlobRef.current || (bgVideoSrc ? await fetchBlobWithProxyFallback(bgVideoSrc) : null);
                if (blob) {
                    resolvedBgVideoBlob = blob;
                    bgVideoBlobRef.current = blob;
                    audioBuf = await extractAudioBuffer(blob, totalDuration, bgVideoStartTimeRef.current);
                }
            }
        } catch (err) {
            console.warn("Extraction audio WebAudio ignorée :", err);
        }

        // Encodeur WebCodecs Vidéo
        const VideoEncoderCls = (window as any).VideoEncoder;
        const VideoFrameCls = (window as any).VideoFrame;
        const hasWebCodecs = typeof VideoEncoderCls !== 'undefined' && typeof VideoFrameCls !== 'undefined';

        if (!hasWebCodecs) {
            alert("L'export MP4 haute vitesse nécessite un navigateur supportant WebCodecs (Google Chrome, Edge, Brave ou Safari récent).");
            setIsExporting(false);
            isExportingRef.current = false;
            return;
        }

        const rawVideoChunks: Array<{ data: Uint8Array; type: 'key' | 'delta'; timestamp: number; duration: number; meta: any }> = [];
        const videoOnlyTarget = new ArrayBufferTarget();
        const videoOnlyMuxer = new Muxer({
            target: videoOnlyTarget,
            video: {
                codec: 'avc',
                width: targetWidth,
                height: targetHeight
            },
            fastStart: 'in-memory',
            firstTimestampBehavior: 'offset'
        });

        const encoder = new VideoEncoderCls({
            output: (chunk: any, meta: any) => {
                const rawBytes = new Uint8Array(chunk.byteLength);
                chunk.copyTo(rawBytes);
                const cType: 'key' | 'delta' = chunk.type === 'key' ? 'key' : 'delta';
                rawVideoChunks.push({
                    data: rawBytes,
                    type: cType,
                    timestamp: chunk.timestamp,
                    duration: chunk.duration,
                    meta
                });
                videoOnlyMuxer.addVideoChunkRaw(rawBytes, cType, chunk.timestamp, chunk.duration, meta);
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

        // Utilisation de la vidéo de fond pour l'export (lecture continue matérielle GPU en muet pour éviter tout blocage autoplay)
        const prevVidMuted = vid ? vid.muted : false;
        if (hasBgVideo && vid) {
            vid.pause();
            vid.muted = true;
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

            if (hasBgVideo && vid) {
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

            drawFrame(exportCtx, targetWidth, targetHeight, frameTimeSec, true, vid);

            const frameBitmap = await createImageBitmap(exportCanvas);
            const videoFrame = new VideoFrameCls(frameBitmap, {
                timestamp: Math.round(f * frameDurationUs),
                duration: frameDurationUs
            });

            const isKeyFrame = f % (fps * 2) === 0;
            encoder.encode(videoFrame, { keyFrame: isKeyFrame });
            videoFrame.close();
            frameBitmap.close();

            const p = Math.round(((f + 1) / totalFrames) * 90);
            setExportProgress(p);
            setExportTimeLeft(Math.max(0, Math.ceil((totalFrames - (f + 1)) / fps)));

            if (f % 5 === 0) {
                await new Promise(r => setTimeout(r, 0));
            }
        }

        if (hasBgVideo && vid) {
            vid.pause();
            vid.muted = prevVidMuted;
            vid.currentTime = bgVideoStartTimeRef.current;
        }

        await encoder.flush();
        videoOnlyMuxer.finalize();
        let finalMp4Blob = new Blob([videoOnlyTarget.buffer], { type: 'video/mp4' });
        let audioMuxedSuccess = false;

        // ── PHASE 1 : Encodage audio natif WebCodecs AAC si supporté ──
        if (audioBuf && canEncodeAudio && typeof AudioEncoderCls.isConfigSupported === 'function') {
            try {
                const audioSr = audioBuf.sampleRate;
                const audioCh = Math.min(2, Math.max(1, audioBuf.numberOfChannels));
                const candidateBitrates = [192_000, 160_000, 128_000, 96_000];
                let selectedAudioCfg: any = null;

                for (const br of candidateBitrates) {
                    try {
                        const res = await AudioEncoderCls.isConfigSupported({
                            codec: 'mp4a.40.2',
                            sampleRate: audioSr,
                            numberOfChannels: audioCh,
                            bitrate: br
                        });
                        if (res?.supported) {
                            selectedAudioCfg = res.config || {
                                codec: 'mp4a.40.2',
                                sampleRate: audioSr,
                                numberOfChannels: audioCh,
                                bitrate: br
                            };
                            break;
                        }
                    } catch {}
                }

                if (selectedAudioCfg) {
                    const avTarget = new ArrayBufferTarget();
                    const avMuxer = new Muxer({
                        target: avTarget,
                        video: {
                            codec: 'avc',
                            width: targetWidth,
                            height: targetHeight
                        },
                        audio: {
                            codec: 'aac',
                            numberOfChannels: audioCh,
                            sampleRate: audioSr
                        },
                        fastStart: 'in-memory',
                        firstTimestampBehavior: 'offset'
                    });

                    for (const vc of rawVideoChunks) {
                        avMuxer.addVideoChunkRaw(vc.data, vc.type, vc.timestamp, vc.duration, vc.meta);
                    }

                    let audioEncErr: any = null;
                    let fallbackAudioTs = 0;
                    const defaultChunkDurUs = Math.round((1024 / audioSr) * 1_000_000);

                    const audioEncoder = new AudioEncoderCls({
                        output: (chunk: any, meta: any) => {
                            try {
                                const rawBytes = new Uint8Array(chunk.byteLength);
                                chunk.copyTo(rawBytes);
                                const safeTs = (typeof chunk.timestamp === 'number' && Number.isFinite(chunk.timestamp) && chunk.timestamp >= 0)
                                    ? chunk.timestamp
                                    : fallbackAudioTs;
                                const safeDur = (typeof chunk.duration === 'number' && Number.isFinite(chunk.duration) && chunk.duration >= 0)
                                    ? chunk.duration
                                    : defaultChunkDurUs;
                                fallbackAudioTs = safeTs + safeDur;
                                avMuxer.addAudioChunkRaw(rawBytes, chunk.type === 'delta' ? 'delta' : 'key', safeTs, safeDur, meta);
                            } catch (mErr) {
                                audioEncErr = mErr;
                            }
                        },
                        error: (e: any) => {
                            audioEncErr = e;
                        }
                    });

                    audioEncoder.configure(selectedAudioCfg);

                    const chunkFrames = 1024;
                    const totalSamples = audioBuf.length;
                    const chArrays: Float32Array[] = [];
                    for (let ch = 0; ch < audioCh; ch++) {
                        chArrays.push(audioBuf.getChannelData(ch));
                    }

                    for (let offset = 0; offset < totalSamples; offset += chunkFrames) {
                        if (audioEncErr) break;
                        while (audioEncoder.encodeQueueSize > 24) {
                            await new Promise(r => setTimeout(r, 2));
                        }
                        const frameCount = Math.min(chunkFrames, totalSamples - offset);
                        const planar = new Float32Array(frameCount * audioCh);
                        for (let ch = 0; ch < audioCh; ch++) {
                            planar.set(chArrays[ch].subarray(offset, offset + frameCount), ch * frameCount);
                        }
                        const ad = new AudioDataCls({
                            format: 'f32-planar',
                            sampleRate: audioSr,
                            numberOfFrames: frameCount,
                            numberOfChannels: audioCh,
                            timestamp: Math.round((offset / audioSr) * 1_000_000),
                            data: planar
                        });
                        audioEncoder.encode(ad);
                        ad.close();
                    }

                    if (!audioEncErr && audioEncoder.state === 'configured') {
                        await audioEncoder.flush();
                    }
                    try { audioEncoder.close(); } catch {}

                    if (audioEncErr) throw audioEncErr;

                    avMuxer.finalize();
                    finalMp4Blob = new Blob([avTarget.buffer], { type: 'video/mp4' });
                    audioMuxedSuccess = true;
                }
            } catch (aErr) {
                console.warn("WebCodecs AAC non supporté ou échoué, bascule sur FFmpeg :", aErr);
            }
        }

        // ── PHASE 2 : Repli universel FFmpeg AAC (-c:v copy, ultra rapide) si WebCodecs AAC n'a pas muxé l'audio ──
        if (!audioMuxedSuccess && (audioBuf || (!hasDedicatedAudio && resolvedBgVideoBlob))) {
            try {
                setExportProgress(94);
                const ffmpeg = await ensureFFmpegLoaded();
                try { await ffmpeg.deleteFile('input.mp4'); } catch {}
                try { await ffmpeg.deleteFile('audio.wav'); } catch {}
                try { await ffmpeg.deleteFile('output.mp4'); } catch {}

                await ffmpeg.writeFile('input.mp4', await fetchFile(finalMp4Blob));
                let hasWav = false;

                if (audioBuf) {
                    const wavBlob = audioBufferToWavBlob(audioBuf);
                    await ffmpeg.writeFile('audio.wav', await fetchFile(wavBlob));
                    hasWav = true;
                } else if (resolvedBgVideoBlob) {
                    const ext = resolvedBgVideoBlob.type.includes('webm') ? 'webm' : (resolvedBgVideoBlob.type.includes('quicktime') ? 'mov' : 'mp4');
                    const srcName = `bg_src.${ext}`;
                    await ffmpeg.writeFile(srcName, await fetchFile(resolvedBgVideoBlob));
                    try {
                        const ssArgs = bgVideoStartTimeRef.current > 0 ? ['-ss', String(bgVideoStartTimeRef.current)] : [];
                        await ffmpeg.exec([...ssArgs, '-i', srcName, '-vn', '-c:a', 'pcm_s16le', '-ar', '48000', '-ac', '2', 'audio.wav']);
                        hasWav = true;
                    } catch (extErr) {
                        console.warn('Extraction FFmpeg bg_src échouée :', extErr);
                    }
                    try { await ffmpeg.deleteFile(srcName); } catch {}
                }

                if (hasWav) {
                    const targetSec = totalDuration.toFixed(2);
                    await ffmpeg.exec([
                        '-i', 'input.mp4', '-i', 'audio.wav',
                        '-map', '0:v:0', '-map', '1:a:0',
                        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
                        '-t', targetSec, '-movflags', '+faststart', 'output.mp4'
                    ]);
                    const outData: any = await ffmpeg.readFile('output.mp4');
                    const safeBytes = outData instanceof Uint8Array ? new Uint8Array(outData) : outData;
                    if (safeBytes && safeBytes.byteLength > 1024) {
                        finalMp4Blob = new Blob([safeBytes], { type: 'video/mp4' });
                        audioMuxedSuccess = true;
                    }
                }

                try { await ffmpeg.deleteFile('input.mp4'); } catch {}
                try { await ffmpeg.deleteFile('audio.wav'); } catch {}
                try { await ffmpeg.deleteFile('output.mp4'); } catch {}
            } catch (ffErr) {
                console.warn('Muxage FFmpeg de secours échoué :', ffErr);
            }
        }

        const downloadUrl = URL.createObjectURL(finalMp4Blob);
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
        <div
            onPointerDownCapture={handleUserInteractionUnlockAudio}
            className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-2xl flex flex-col overflow-hidden text-white font-sans animate-in fade-in duration-200"
        >
            
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
                        onClick={handleSaveConfig}
                        className={`px-3.5 py-2 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95 ${
                            isSavedJustNow
                                ? 'bg-emerald-500 text-black border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        }`}
                        title="Sauvegarder les modifications des textes et réglages"
                    >
                        {isSavedJustNow ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        <span>{isSavedJustNow ? 'Textes Sauvegardés !' : 'Sauvegarder'}</span>
                    </button>
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
                                loop
                                className={`absolute inset-0 w-full h-full object-cover z-0 pointer-events-none transition-opacity duration-300 ${
                                    bgType === 'video' && bgVideoSrc ? 'opacity-100' : 'opacity-0'
                                }`}
                            />

                            {/* Piste audio dédiée (MP3 ou son importé) */}
                            <audio
                                ref={audioRef}
                                playsInline
                                loop
                                className="hidden"
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

                            {/* Badge Son Direct sur Player */}
                            <button
                                type="button"
                                onClick={toggleAudio}
                                className={`absolute top-3 right-3 px-3 py-1.5 rounded-full border text-[11px] font-black uppercase flex items-center gap-1.5 backdrop-blur-md z-30 transition-all active:scale-95 shadow-lg ${
                                    !isVideoAudioMuted
                                        ? 'bg-emerald-500/90 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                                        : 'bg-amber-500 hover:bg-amber-400 text-black border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse'
                                }`}
                                title={!isVideoAudioMuted ? "Couper le son" : "Cliquer pour ACTIVER le son"}
                            >
                                {!isVideoAudioMuted ? (
                                    <>
                                        <Volume2 className="w-3.5 h-3.5 text-white animate-pulse" />
                                        <span>SON ACTIF</span>
                                    </>
                                ) : (
                                    <>
                                        <VolumeX className="w-3.5 h-3.5 text-black" />
                                        <span>ACTIVER LE SON 🔊</span>
                                    </>
                                )}
                            </button>

                            {/* Bannière flottante interactive si son coupé pendant la lecture */}
                            {isVideoAudioMuted && isPlaying && (
                                <button
                                    type="button"
                                    onClick={toggleAudio}
                                    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-black/90 hover:bg-black text-amber-300 border border-amber-400/70 backdrop-blur-md text-[10px] font-extrabold uppercase flex items-center gap-1.5 shadow-2xl active:scale-95 transition"
                                >
                                    <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                    <span>Son en sourdine • Clique pour activer 🔊</span>
                                </button>
                            )}

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
                                    if (audioRef.current && audioRef.current.src) {
                                        audioRef.current.currentTime = bgAudioStartTimeRef.current + val;
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
                                        if (audioRef.current && audioRef.current.src) {
                                            audioRef.current.currentTime = bgAudioStartTimeRef.current;
                                        }
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold text-xs uppercase transition active:scale-95"
                                    title="Recommencer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={toggleAudio}
                                    className={`px-2.5 py-1.5 rounded-xl border font-bold text-xs uppercase flex items-center gap-1.5 transition active:scale-95 ${
                                        !isVideoAudioMuted
                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                            : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                                    }`}
                                    title={!isVideoAudioMuted ? 'Couper le son' : 'Activer le son'}
                                >
                                    {!isVideoAudioMuted ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-gray-400" />}
                                    <span>{!isVideoAudioMuted ? 'Son Actif' : 'Son Coupé'}</span>
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
                                            if (audioRef.current && audioRef.current.src) {
                                                audioRef.current.currentTime = bgAudioStartTimeRef.current + sc.time;
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
                                                onClick={toggleAudio}
                                                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-black uppercase flex items-center justify-center gap-2 transition ${
                                                    !isVideoAudioMuted ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]' : 'bg-white/5 text-gray-400 border-white/10'
                                                }`}
                                            >
                                                {!isVideoAudioMuted ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
                                                <span>{!isVideoAudioMuted ? 'Son Vidéo Actif (Non-Mute)' : 'Son Vidéo en Sourdine (Mute)'}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Piste Audio / Musique de Fond (MP3 ou Beatport) */}
                                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black uppercase text-gray-300 flex items-center gap-1.5">
                                            <Music className="w-4 h-4 text-[#00f0ff]" />
                                            Musique de Fond (MP3 ou Beatport)
                                        </span>
                                        {bgAudioSrc && (
                                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                                                ✓ Musique Active
                                            </span>
                                        )}
                                    </div>

                                    {/* 2 Choix : Importer un MP3 OU Rechercher sur Beatport */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-white/20 hover:border-[#00f0ff] rounded-xl cursor-pointer bg-black/40 transition group text-center">
                                            <Upload className="w-4 h-4 text-gray-400 group-hover:text-[#00f0ff] mb-1 transition" />
                                            <span className="text-[11px] font-bold text-gray-200">1. Importer MP3</span>
                                            <span className="text-[9px] text-gray-500">Fichier local audio</span>
                                            <input type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg" onChange={handleAudioUpload} className="hidden" />
                                        </label>

                                        <button
                                            type="button"
                                            onClick={() => setIsBeatportSearchOpen(!isBeatportSearchOpen)}
                                            className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 rounded-xl bg-emerald-950/20 hover:bg-emerald-900/30 transition text-center group"
                                        >
                                            <Search className="w-4 h-4 text-emerald-400 group-hover:scale-110 mb-1 transition" />
                                            <span className="text-[11px] font-bold text-emerald-300">2. Via Beatport</span>
                                            <span className="text-[9px] text-emerald-500/80">Recherche catalogue</span>
                                        </button>
                                    </div>

                                    {/* Tiroir de recherche Beatport */}
                                    {isBeatportSearchOpen && (
                                        <div className="p-3 bg-black/60 rounded-xl border border-emerald-500/30 space-y-2.5 animate-fadeIn">
                                            <div className="text-[11px] font-black uppercase text-emerald-400 flex items-center gap-1.5">
                                                <Sparkles className="w-3.5 h-3.5" />
                                                Recherche de track Beatport (Preview 120s)
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={beatportQuery}
                                                    onChange={(e) => setBeatportQuery(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleBeatportSearch()}
                                                    placeholder="Artiste, titre ou mot clé..."
                                                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleBeatportSearch}
                                                    disabled={isSearchingBeatport || !beatportQuery.trim()}
                                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black text-xs rounded-lg uppercase transition"
                                                >
                                                    {isSearchingBeatport ? '...' : 'Chercher'}
                                                </button>
                                            </div>

                                            {/* Résultats Beatport */}
                                            {beatportResults.length > 0 && (
                                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                                    {beatportResults.map((item, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => handleSelectBeatportTrack(item)}
                                                            className="flex items-center gap-2.5 p-2 bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 rounded-lg cursor-pointer transition text-left"
                                                        >
                                                            {item.coverUrl ? (
                                                                <img src={item.coverUrl} alt={item.title} className="w-9 h-9 rounded object-cover border border-white/10 flex-shrink-0" />
                                                            ) : (
                                                                <div className="w-9 h-9 rounded bg-emerald-900/50 flex items-center justify-center text-emerald-300 flex-shrink-0">
                                                                    <Music className="w-4 h-4" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold text-white truncate">{item.title}</p>
                                                                <p className="text-[10px] text-gray-400 truncate">{item.artist}</p>
                                                            </div>
                                                            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex-shrink-0">
                                                                Choisir
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Piste sélectionnée active (MP3 ou Beatport) */}
                                    {bgAudioSrc && (
                                        <div className="space-y-3 pt-2 border-t border-white/10">
                                            {/* Détails du morceau */}
                                            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/40 border border-white/10">
                                                {bgAudioCover ? (
                                                    <img src={bgAudioCover} alt="Cover" className="w-10 h-10 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff] flex-shrink-0">
                                                        <Music className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-white truncate">
                                                        {bgAudioTitle || (bgAudioBlobRef.current ? "Fichier MP3 Local" : "Piste Audio")}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 truncate">
                                                        {bgAudioArtist || (bgAudioBlobRef.current ? "Fichier importé" : "Audio synchronisé")}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const aud = audioRef.current;
                                                        if (aud) {
                                                            if (aud.paused) {
                                                                aud.currentTime = bgAudioStartTime;
                                                                aud.play().catch(() => {});
                                                            } else {
                                                                aud.pause();
                                                            }
                                                        }
                                                    }}
                                                    className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-bold flex items-center gap-1 flex-shrink-0"
                                                >
                                                    <Play className="w-3 h-3 text-[#00f0ff]" /> Test
                                                </button>
                                            </div>

                                            {/* Sélecteur de départ de la musique */}
                                            <div className="flex justify-between items-center text-xs font-black uppercase text-gray-300">
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-[#00f0ff]" />
                                                    Départ de la musique :
                                                </span>
                                                <span className="text-[#00f0ff] font-mono font-bold bg-[#00f0ff]/10 px-2 py-0.5 rounded border border-[#00f0ff]/30">
                                                    {bgAudioStartTime.toFixed(1)}s / {bgAudioDuration.toFixed(1)}s
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min={0}
                                                max={Math.max(0, bgAudioDuration - 5)}
                                                step={0.5}
                                                value={bgAudioStartTime}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    setBgAudioStartTime(val);
                                                    if (audioRef.current) audioRef.current.currentTime = val + currentTimeRef.current;
                                                }}
                                                className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#00f0ff]"
                                            />
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase text-gray-400">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setBgAudioStartTime(0);
                                                        if (audioRef.current) audioRef.current.currentTime = 0;
                                                    }}
                                                    className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md"
                                                >
                                                    ⏪ 0:00
                                                </button>
                                                <div className="flex gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const n = Math.max(0, bgAudioStartTime - 5);
                                                            setBgAudioStartTime(n);
                                                            if (audioRef.current) audioRef.current.currentTime = n;
                                                        }}
                                                        className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md"
                                                    >
                                                        -5s
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const n = Math.min(bgAudioDuration - 5, bgAudioStartTime + 5);
                                                            setBgAudioStartTime(n);
                                                            if (audioRef.current) audioRef.current.currentTime = n;
                                                        }}
                                                        className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md"
                                                    >
                                                        +5s
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-1">
                                                <span className="text-[10px] text-gray-400">Piste synchronisée avec le Reel</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setBgAudioSrc('');
                                                        bgAudioBlobRef.current = null;
                                                        setBgAudioTitle('');
                                                        setBgAudioArtist('');
                                                        setBgAudioCover('');
                                                        setBgAudioStartTime(0);
                                                        setBgAudioDuration(0);
                                                        if (audioRef.current) {
                                                            audioRef.current.src = '';
                                                        }
                                                    }}
                                                    className="text-[10px] font-bold text-red-400 hover:text-red-300 transition underline"
                                                >
                                                    Supprimer la musique
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

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
                                
                                {/* Bannière Sauvegarder en haut du formulaire */}
                                <div className="sticky top-0 z-20 p-3 rounded-2xl bg-[#0d0f14]/95 border border-amber-500/40 backdrop-blur-xl flex items-center justify-between shadow-2xl">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                                            <Save className="w-4 h-4" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs font-black uppercase text-amber-300">Textes du Reel Recrutement</div>
                                            <div className="text-[10px] text-gray-400">Modifie les phrases puis clique sur Sauvegarder</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleResetDefaults}
                                            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-gray-300 hover:text-white uppercase transition"
                                            title="Rétablir les textes et durées par défaut"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveConfig}
                                            className={`px-3.5 py-1.5 rounded-xl border text-xs font-black uppercase flex items-center gap-1.5 shadow-md transition-all active:scale-95 ${
                                                isSavedJustNow
                                                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                                                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                            }`}
                                        >
                                            {isSavedJustNow ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                                            <span>{isSavedJustNow ? 'Sauvegardé !' : 'Sauvegarder'}</span>
                                        </button>
                                    </div>
                                </div>
                                
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
                                    <p className="text-[11px] text-gray-400">Le logo officiel Dropsiders apparaît en plein centre avec son tracé dynamique et l'apparition progressive des lettres.</p>
                                </div>

                                {/* Bouton Sauvegarder en bas */}
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={handleSaveConfig}
                                        className={`w-full py-3.5 rounded-2xl border text-xs font-black uppercase flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${
                                            isSavedJustNow
                                                ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                                                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-[#ff0033] hover:brightness-110 text-black border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                                        }`}
                                    >
                                        {isSavedJustNow ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        <span>{isSavedJustNow ? '✓ Tous les Textes ont été Sauvegardés !' : '💾 Sauvegarder les Textes du Reel'}</span>
                                    </button>
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
