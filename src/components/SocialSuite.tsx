import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
    X, 
    Download, 
    Upload, 
    PlusCircle, 
    Plus, 
    Eraser,
    Video, 
    Layout, 
    Smartphone, 
    Image as ImageIcon,
    Home, 
    Link as LinkIcon, 
    Palette, 
    Type, 
    Film,
    Check, 
    Layers, 
    Sparkles, 
    Wand2, 
    RotateCcw,
    CheckCircle2,
    Eye,
    MessageSquare,
    Calendar,
    Search,
    CheckSquare,
    Square,
    Play
} from 'lucide-react';
import { ExportSuccessModal } from './ExportSuccessModal';
import { fixEncoding } from '../utils/standardizer';
import { Downloader } from '../pages/Downloader';
import { ImageUploadModal } from './ImageUploadModal';
import { resolveImageUrl } from '../utils/image';
import recapsData from '../data/recaps.json';
// @ts-ignore
import { FFmpeg } from '@ffmpeg/ffmpeg';
// @ts-ignore
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const FESTIVAL_TIMEZONES = [
    { group: "🌍 Europe (Aucun décalage)", options: [{ label: "🇫🇷 Heure Française", offset: 0 }] },
    { group: "🇬🇧 Royaume-Uni (-1h)", options: [{ label: "Londres / Creamfields", offset: 1 }] },
    { group: "🌴 US - Côte Est (Miami / NY | -5h)", options: [
        { label: "Ultra Miami / Lost Lands (Été)", offset: 5 },
        { label: "Miami / NY (Hiver)", offset: 6 }
    ]},
    { group: "🎡 US - Côte Ouest (Vegas / LA | -8h)", options: [
        { label: "EDC LV / Coachella / Day Trip (Été)", offset: 8 },
        { label: "Vegas / LA (Hiver)", offset: 9 }
    ]},
    { group: "🤠 US - Centre (Chicago / Texas | -6h)", options: [
        { label: "Lollapalooza / Ubbi Dubbi (Été)", offset: 6 },
        { label: "Chicago / Texas (Hiver)", offset: 7 }
    ]},
    { group: "🌏 Asie & Océanie", options: [
        { label: "Japon / Tokyo (+8h)", offset: -8 },
        { label: "Sydney (+7h)", offset: -7 }
    ]}
];


interface SocialSuiteProps {
    title: string;
    imageUrl: string;
    onClose: () => void;
    initialTheme?: ThemeType;
    initialTab?: TabType;
    onGeneratePromo?: (format: 'story_promo' | 'post_promo') => void;
    isGeneratingPromo?: string | null;
}

type TabType = 'REEL' | 'PUBLICATION' | 'YOUTUBE';
type ThemeType = 'TOP 5 ARTISTE' | 'TOP 5 STYLES' | 'TOP 10 FESTIVAL' | 'TOP 100 DROPSIDERS' | 'NEWS' | 'FOCUS' | 'MUSIQUE' | 'RECAP' | 'EVENTS' | 'LIVESTREAM' | 'PLANNING' | 'TRACKLIST' | 'INTERVIEW' | 'SPOTLIGHT' | 'CITATION' | 'CONSEILS' | 'REELS' | 'CONCOURS' | 'ARTISTE FESTIVAL' | 'AFFICHE' | 'PROMO' | 'MAP' | 'CALENDRIER' | 'JEU' | 'JEU_FESTIVAL';

interface Top5Item {
    main: string; // Artist or Genre
    sub: string;  // Song or Description
    value: string; // Streams or Percent
    spotifyUrl?: string;
    photo?: string;
}

const STYLE_PRESETS = [
    { name: 'HOUSE', grad: '189, 0, 255', color: '#bd00ff' },
    { name: 'TECH HOUSE', grad: '255, 170, 0', color: '#ffaa00' },
    { name: 'AFRO HOUSE', grad: '57, 255, 20', color: '#39ff14' },
    { name: 'HARD TECHNO', grad: '255, 0, 51', color: '#ff0033' },
    { name: 'HARD STYLE', grad: '255, 10, 10', color: '#ff0a0a' },
    { name: 'ELECTRO', grad: '0, 240, 255', color: '#00f0ff' },
    { name: 'INDIE DANCE', grad: '0, 50, 255', color: '#0032ff' },
    { name: 'PROGRESSIVE', grad: '0, 200, 255', color: '#00c8ff' },
    { name: 'MELODIC', grad: '0, 150, 255', color: '#0096ff' },
    { name: 'DRUM N BASS', grad: '150, 0, 255', color: '#9600ff' }
];

const hexToRgb = (hex: string) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16) || 112;
    const g = parseInt(clean.substring(2, 4), 16) || 0;
    const b = parseInt(clean.substring(4, 6), 16) || 255;
    return `${r}, ${g}, ${b}`;
};

const lon2tile = (lon: number, zoom: number) => {
    return ((lon + 180) / 360) * Math.pow(2, zoom);
};

const lat2tile = (lat: number, zoom: number) => {
    return (
        ((1 -
            Math.log(
                Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
            ) /
                Math.PI) /
            2) *
        Math.pow(2, zoom)
    );
};

// Petits helpers visuels pour les accordéons rétractables (badge d'état + chevron)
const AccordionBadge = ({ active, label }: { active: boolean; label: string }) => (
    <span className={`px-1.5 py-0.5 rounded-md text-[7.5px] font-black uppercase tracking-wider border whitespace-nowrap ${
        active
            ? 'bg-neon-cyan/15 border-neon-cyan/40 text-neon-cyan shadow-[0_0_8px_rgba(0,240,255,0.3)]'
            : 'bg-white/5 border-white/10 text-gray-500'
    }`}>
        {label}
    </span>
);

const AccordionChevron = ({ open }: { open: boolean }) => (
    <span className={`text-[10px] text-gray-400 group-hover:text-white transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>▾</span>
);

export function SocialSuite({ title, imageUrl, onClose, initialTheme, initialTab, onGeneratePromo, isGeneratingPromo }: SocialSuiteProps) {
    const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'PUBLICATION');
    // Accordéons rétractables : fermés par défaut sur POST, ouverts sur REEL
    const isInitialReel = (initialTab || 'PUBLICATION') === 'REEL';
    const [animOptionsOpen, setAnimOptionsOpen] = useState<boolean>(isInitialReel);
    const [videoOptionsOpen, setVideoOptionsOpen] = useState<boolean>(isInitialReel);
    const [slideTransOptionsOpen, setSlideTransOptionsOpen] = useState<boolean>(isInitialReel);
    const [bgPositionOptionsOpen, setBgPositionOptionsOpen] = useState<boolean>(isInitialReel);
    useEffect(() => {
        const isReel = activeTab === 'REEL';
        setAnimOptionsOpen(isReel);
        setVideoOptionsOpen(isReel);
        setSlideTransOptionsOpen(isReel);
        setBgPositionOptionsOpen(isReel);
    }, [activeTab]);
    const [theme, setTheme] = useState<ThemeType>(() => {
        if (initialTheme) return initialTheme;
        return 'NEWS';
    });
    const [showSwipe, setShowSwipe] = useState(false);
    const [showArticleLink, setShowArticleLink] = useState(false);
    const [showVoteLink, setShowVoteLink] = useState(false);
    const [customText, setCustomText] = useState(title || '');
    const [bgImage, setBgImage] = useState<string>(imageUrl);
    const [bgVideo, setBgVideo] = useState<HTMLVideoElement | null>(null);
    const [textColor, setTextColor] = useState('#ffffff');
    const [textBgColor, setTextBgColor] = useState('transparent');
    const [isDownloading, setIsDownloading] = useState(false);
    const [isVideoRecording, setIsVideoRecording] = useState(false);
    const [visualsList, setVisualsList] = useState<string[]>([]);
    const [isDownloaderOpen, setIsDownloaderOpen] = useState(false);
    const [isRecapPickerOpen, setIsRecapPickerOpen] = useState(false);
    const [isAgendaPickerOpen, setIsAgendaPickerOpen] = useState(false);
    const [siteAgendaEvents, setSiteAgendaEvents] = useState<any[]>([]);
    const [isSiteAgendaLoading, setIsSiteAgendaLoading] = useState(false);
    const [agendaPickerSearch, setAgendaPickerSearch] = useState('');
    const [agendaPickerMonth, setAgendaPickerMonth] = useState<string>('ALL');
    const [selectedSiteEventIds, setSelectedSiteEventIds] = useState<number[]>([]);
    const [autoSyncAgendaMonth, setAutoSyncAgendaMonth] = useState(true);
    // InShot-style: active bottom panel and format modal
    const [activePanel, setActivePanel] = useState<string | null>(null);
    const [showFormatModal, setShowFormatModal] = useState(true);
    const [readyVideoBlob, setReadyVideoBlob] = useState<Blob | null>(null);
    const [readyVideoUrl, setReadyVideoUrl] = useState<string>('');
    const [recordingProgress, setRecordingProgress] = useState(0);
    const [recordingTimeLeft, setRecordingTimeLeft] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showText, setShowText] = useState(true);
    const [planningItems, setPlanningItems] = useState<{ 
        day?: string; 
        title?: string; 
        artists?: string; 
        genre?: string; 
        venue?: string; 
        time?: string; 
        artist?: string; 
    }[]>([
        { day: '06 OCT', title: 'WAREHOUSE RAVE', artists: 'I HATE MODELS • NICO MORENO', genre: 'HARD TECHNO', venue: 'PARIS' },
        { day: '13 OCT', title: 'SUB ZERO PROJECT LIVE', artists: 'SUB ZERO PROJECT • REBELION', genre: 'RAWSTYLE', venue: 'LYON' },
        { day: '20 OCT', title: 'APEX FESTIVAL', artists: 'AMELIE LENS • CHARLOTTE DE WITTE', genre: 'TECHNO', venue: 'MARSEILLE' },
        { day: '27 OCT', title: 'HALLOWEEN MASSACRE', artists: 'D-STURB • WARFACE', genre: 'HARDSTYLE', venue: 'BORDEAUX' },
    ]);
    const [agendaMonth, setAgendaMonth] = useState<string>(() => {
        const MONTHS_FR = ['JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'];
        return MONTHS_FR[new Date().getMonth()] || 'OCTOBRE';
    });
    const [agendaBadgeText, setAgendaBadgeText] = useState<string>('COUPS DE CŒUR DU MOIS');
    const [agendaSlide, setAgendaSlide] = useState<1 | 2>(1);
    const [agendaCoverBadge, setAgendaCoverBadge] = useState<string>('AGENDA FESTIVALS & SOIRÉES');
    const [agendaCoverTitle, setAgendaCoverTitle] = useState<string>('ON VA OÙ CE MOIS-CI ?');
    const [agendaCoverYear, setAgendaCoverYear] = useState<string>(() => String(new Date().getFullYear()));
    const [agendaCoverGenres, setAgendaCoverGenres] = useState<string>('HARD TECHNO • RAWSTYLE • MULTI-GENRES');
    const [agendaCoverCta, setAgendaCoverCta] = useState<string>('Les meilleurs events et coups de cœur du mois rassemblés en un post ➡️');
    const [artisteFestivalSlide, setArtisteFestivalSlide] = useState<1 | 2>(1);
    const [eventsSlide, setEventsSlide] = useState<1 | 2>(1);
    const [editorialSlide, setEditorialSlide] = useState<number>(1);
    const [planningDate, setPlanningDate] = useState('OCTOBRE');
    const [calendarMonth, setCalendarMonth] = useState('MARS 2025');
    const [calendarEvents, setCalendarEvents] = useState<{ date: string; label: string }[]>([
        { date: '1', label: 'FESTIVAL 1' },
        { date: '8', label: 'LIVE SET' },
        { date: '15', label: 'RELEASE' },
        { date: '22', label: 'SHOWCASE' },
    ]);
    const [isRetouchMode, setIsRetouchMode] = useState(false);
    const [retouchPath, setRetouchPath] = useState<{ x: number, y: number }[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(35);
    const [planningTimezoneOffset, setPlanningTimezoneOffset] = useState<number>(0);
    const [isConverting, setIsConverting] = useState(false);
    const [conversionProgress, setConversionProgress] = useState(0);
    const [isTransparent, setIsTransparent] = useState(true);
    const [showBottomLogo, setShowBottomLogo] = useState(false);
    const [artistLogo, setArtistLogo] = useState<string>(''); // NEW
    const artistLogoRef = useRef<HTMLImageElement | null>(null); // NEW
    const [festivalLogo, setFestivalLogo] = useState<string>(''); // NEW
    const festivalLogoRef = useRef<HTMLImageElement | null>(null); // NEW
    const [bgOffsetX, setBgOffsetX] = useState<number>(0);
    const [bgOffsetY, setBgOffsetY] = useState<number>(0);
    const [menuOpacity, setMenuOpacity] = useState<number>(95);
    const [isSlidingPosition, setIsSlidingPosition] = useState<boolean>(false);
    const [imgLayoutMode, setImgLayoutMode] = useState<'1_PAR_LIGNE' | 'PAR_LIGNES' | 'HAUT_LIGNE' | 'BAS_LIGNE'>('1_PAR_LIGNE');
    const [quizColor1, setQuizColor1] = useState<string>('#38bdf8');
    const [quizColor2, setQuizColor2] = useState<string>('#a855f7');
    const [showFrame, setShowFrame] = useState<boolean>(false);
    const [artistNameText, setArtistNameText] = useState('');
    const [festivalNameText, setFestivalNameText] = useState('');
    const [isArtistLogoNegative, setIsArtistLogoNegative] = useState(true);
    const [citationAuthor, setCitationAuthor] = useState('');
    const [citationMedia, setCitationMedia] = useState('pour Dropsiders');
    const [conseilsTitle, setConseilsTitle] = useState('LE TITRE ICI');
    const [conseilsSubtext, setConseilsSubtext] = useState('');
    const conseilsTitleInputRef = useRef<HTMLTextAreaElement | null>(null);
    const conseilsSubtextInputRef = useRef<HTMLTextAreaElement | null>(null);
    const [isConseilsLargeTitle, setIsConseilsLargeTitle] = useState(false);
    const [showTitleOnSlide2, setShowTitleOnSlide2] = useState<boolean>(false);
    const [extraEditorialSlides, setExtraEditorialSlides] = useState<string[]>([]); // Slides 3, 4, 5... (texte de chaque slide)
    const [skipEditorialSlide2, setSkipEditorialSlide2] = useState<boolean>(false); // Masquer Slide 2 dans l'export Reel (Slide 1 + Promo uniquement)
    const [editorialSlide1Duration, setEditorialSlide1Duration] = useState<number>(5); // Durée Slide 1 (en secondes, min 2s, max 15s)
    const [editorialPromoDuration, setEditorialPromoDuration] = useState<number>(3.5); // Durée Promo (en secondes, min 2s, max 8s)
    const [exportFps, setExportFps] = useState<number>(60); // Fluidité vidéo : 60 FPS ultra-fluide par défaut (ou 30 FPS standard)
    const [promoCategory, setPromoCategory] = useState<string>(() => {
        if (initialTheme && initialTheme !== 'PROMO') return initialTheme;
        return 'NEWS';
    });

    const addEditorialSlide = () => {
        if (extraEditorialSlides.length >= 5) return; // Limite à 7 slides totales max (2 de base + 5 supplémentaires)
        const nextSlideNum = 2 + extraEditorialSlides.length + 1;
        setExtraEditorialSlides(prev => [...prev, '']);
        setEditorialSlide(nextSlideNum);
    };

    const removeEditorialSlide = (slideIndexToRemove: number) => {
        if (slideIndexToRemove < 3) return; // Les slides 1 et 2 restent indispensables
        const extraIdx = slideIndexToRemove - 3;
        setExtraEditorialSlides(prev => prev.filter((_, idx) => idx !== extraIdx));
        if (editorialSlide >= slideIndexToRemove) {
            setEditorialSlide(Math.max(2, editorialSlide - 1));
        }
    };

    const updateEditorialSlideText = (slideNum: number, text: string) => {
        if (slideNum === 2) {
            setConseilsSubtext(text);
        } else if (slideNum >= 3) {
            const extraIdx = slideNum - 3;
            setExtraEditorialSlides(prev => {
                const next = [...prev];
                next[extraIdx] = text;
                return next;
            });
        }
    };

    // Détection clôture GTA 6 après le 12 novembre 2026
    const isGTA6Expired = typeof window !== 'undefined' && new Date() > new Date('2026-11-12T23:59:59');

    // CONCOURS Theme States
    const [concoursMode, setConcoursMode] = useState<'FESTIVAL' | 'GTA6'>(() => {
        return (typeof window !== 'undefined' && new Date() > new Date('2026-11-12T23:59:59')) ? 'FESTIVAL' : 'GTA6';
    });
    const [concoursFestivalName, setConcoursFestivalName] = useState('');
    const [concoursFestivalHandle, setConcoursFestivalHandle] = useState('');
    const [concoursBottomColor, setConcoursBottomColor] = useState('#008cff');
    const [concoursLateralText, setConcoursLateralText] = useState(() => (typeof window !== 'undefined' && new Date() > new Date('2026-11-12T23:59:59')) ? 'JEUX CONCOURS' : 'JEU CONCOURS GTA 6');
    const [concoursLateralOpacity, setConcoursLateralOpacity] = useState(0.50);
    const [concoursBadgeTextColor, setConcoursBadgeTextColor] = useState('#00f0ff');

    // GTA 6 Template specific states
    const [concoursGTAHeadline, setConcoursGTAHeadline] = useState('DROPSIDERS TE FAIT GAGNER');
    const [concoursGTATitle, setConcoursGTATitle] = useState('GTA 6');
    const [concoursGTAPlatformText, setConcoursGTAPlatformText] = useState('SUR LA PLATEFORME DE TON CHOIX');
    const [concoursGTACondition1, setConcoursGTACondition1] = useState('1 - LIKEZ LA PUBLICATION');
    const [concoursGTACondition2, setConcoursGTACondition2] = useState('2 - IDENTIFIEZ 2 POTES QUI DOIVENT LIKER LA PAGE');
    const [concoursGTACondition3, setConcoursGTACondition3] = useState('3 - PARTAGEZ EN STORIE');
    const [concoursGTACondition4, setConcoursGTACondition4] = useState('4 - POUR VALIDER LA PARTICIPATION RÉPONDEZ AUX 3 QUESTIONS SUR DROPSIDERS.FR');
    const isVideoRecordingRef = useRef<boolean>(false);
    const recordingStartTimeRef = useRef<number>(0);
    const agendaSlideOverrideRef = useRef<1 | 2 | null>(null);
    const editorialSlideOverrideRef = useRef<number | null>(null);
    const transitionProgressRef = useRef<number | null>(null);
    const promoOutroOverrideRef = useRef<boolean>(false);
    const transitionTargetRef = useRef<'SLIDE_1_TO_2' | 'SLIDE_2_TO_PROMO' | null>(null);
    const ffmpegRef = useRef<any>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    // On stocke la source et la dest pour ne pas rappeler createMediaElementSource
    // sur le même élément vidéo (lance un InvalidStateError si rappelé)
    const audioSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const audioDestNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
    const audioSourceVideoRef = useRef<HTMLVideoElement | null>(null); // pour détecter si bgVideo a changé
    const [isR2ModalOpen, setIsR2ModalOpen] = useState(false);
    const [r2TargetIdx, setR2TargetIdx] = useState<number | null>(null);
    const [r2TargetType, setR2TargetType] = useState<'top5' | 'top10' | 'background' | 'logo' | 'affiche' | 'musicCover' | null>(null);

    // AFFICHE Theme States (Poster Événement Flottant)
    const [afficheImage, setAfficheImage] = useState<string>('');
    const afficheImageRef = useRef<HTMLImageElement | null>(null);
    const [afficheGlow, setAfficheGlow] = useState<boolean>(true);
    const [afficheBorderColor, setAfficheBorderColor] = useState<string>('rgba(255, 255, 255, 0.22)');
    const [afficheMode, setAfficheMode] = useState<'cover' | 'contain'>('cover');
    const [afficheScale, setAfficheScale] = useState<number>(100);
    const [afficheOffsetY, setAfficheOffsetY] = useState<number>(0);
    const afficheFileInputRef = useRef<HTMLInputElement>(null);

    // MUSIQUE : Slide 1 = Annonce, Slides 2 à 19 = Tracks (pochette + titre + artiste + label), Slide 20 = Promo
    type MusicTrackSlide = { cover: string; title: string; artist: string; label: string };
    const MAX_MUSIC_TRACKS = 18; // 1 intro + 18 tracks + 1 promo = 20 slides max (limite carrousel Instagram)
    const createEmptyMusicTrack = (): MusicTrackSlide => ({ cover: '', title: '', artist: '', label: '' });
    const [musicTracks, setMusicTracks] = useState<MusicTrackSlide[]>(() => [createEmptyMusicTrack()]);
    const musicCoverImgsRef = useRef<Record<string, HTMLImageElement>>({});

    const updateMusicTrack = (idx: number, patch: Partial<MusicTrackSlide>) => {
        setMusicTracks(prev => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
    };

    const addMusicTrack = () => {
        if (musicTracks.length >= MAX_MUSIC_TRACKS) return;
        const newSlideNum = musicTracks.length + 2; // Slide 1 = annonce, tracks à partir de la slide 2
        setMusicTracks(prev => [...prev, createEmptyMusicTrack()]);
        setIsCarouselPromoActive(false);
        setEditorialSlide(newSlideNum);
    };

    const removeMusicTrack = (idx: number) => {
        if (musicTracks.length <= 1) return; // Au moins 1 track (slide 2) indispensable
        const removedSlideNum = idx + 2;
        setMusicTracks(prev => prev.filter((_, i) => i !== idx));
        if (editorialSlide >= removedSlideNum && editorialSlide > 2) {
            setEditorialSlide(editorialSlide - 1);
        }
    };

    const handleAfficheImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        if (theme === 'MUSIQUE') {
            // Pochette propre à la slide track active
            updateMusicTrack(Math.max(0, editorialSlide - 2), { cover: url });
        } else {
            setAfficheImage(url);
        }
        e.target.value = '';
    };

    // Text animation states for Reels
    type TextAnimType = 'NONE' | 'SLIDE_LEFT' | 'WORD_BY_WORD' | 'POP_UP' | 'ZOOM_IMPACT' | 'TYPEWRITER' | 'BOUNCE' | 'GLITCH';
    const [textAnimation, setTextAnimation] = useState<TextAnimType>('NONE');
    const [animReplayKey, setAnimReplayKey] = useState<number>(0);
    const animStartTimeRef = useRef<number>(Date.now());

    // Background animation states for Reels / Posts
    type BgAnimType = 'NONE' | 'ZOOM_IN' | 'ZOOM_OUT' | 'PAN_LEFT' | 'PAN_RIGHT' | 'PULSE' | 'BREATHE' | 'GLITCH';
    const [bgAnimation, setBgAnimation] = useState<BgAnimType>('NONE');

    // Slide transition states for Multi-Slide / Carrousel / Reels
    type SlideTransitionType = 'SLIDE' | 'FADE' | 'ZOOM' | 'GLITCH' | 'CUT';
    const SLIDE_TRANSITIONS: { id: SlideTransitionType; label: string; icon: string; desc: string }[] = [
        { id: 'SLIDE', label: 'Glissement', icon: '➡️', desc: 'Carrousel fluide horizontal' },
        { id: 'FADE', label: 'Fondu', icon: '🎚️', desc: 'Crossfade enchaîné doux' },
        { id: 'ZOOM', label: 'Zoom', icon: '🔍', desc: 'Zoom avant / arrière percutant' },
        { id: 'GLITCH', label: 'Glitch Cyber', icon: '⚡', desc: 'Flash & secousse numérique' },
        { id: 'CUT', label: 'Cut Direct', icon: '✂️', desc: 'Passage sec instantané' },
    ];
    const [slideTransition, setSlideTransition] = useState<SlideTransitionType>(() => {
        try {
            const saved = localStorage.getItem('dropsiders_slide_transition');
            if (saved && ['SLIDE', 'FADE', 'ZOOM', 'GLITCH', 'CUT'].includes(saved)) {
                return saved as SlideTransitionType;
            }
        } catch {}
        return 'SLIDE';
    });
    const isTransitioningRef = useRef<boolean>(false);
    const [isCarouselPromoActive, setIsCarouselPromoActive] = useState<boolean>(false);
    const [promoCustomPhrase, setPromoCustomPhrase] = useState<string>('');
    const [promoCustomSubphrase, setPromoCustomSubphrase] = useState<string>('');
    const [showPromoHook, setShowPromoHook] = useState<boolean>(true);
    const [showPromoHeadline, setShowPromoHeadline] = useState<boolean>(true);

    const getTransitionDuration = (t: SlideTransitionType) => {
        switch (t) {
            case 'CUT': return 80;
            case 'GLITCH': return 550;
            case 'FADE': return 650;
            case 'ZOOM': return 650;
            case 'SLIDE':
            default: return 700;
        }
    };

    const handleSetSlideTransition = (mode: SlideTransitionType) => {
        setSlideTransition(mode);
        try {
            localStorage.setItem('dropsiders_slide_transition', mode);
        } catch {}
    };

    const playTransitionPreview = async (overrideMode?: SlideTransitionType) => {
        if (isTransitioningRef.current) return;
        isTransitioningRef.current = true;
        const mode = overrideMode || slideTransition;
        const duration = getTransitionDuration(mode);
        const startTime = Date.now();

        const step = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / duration);
            setTransitionProgress(progress);
            if (elapsed < duration) {
                requestAnimationFrame(step);
            } else {
                setTransitionProgress(0);
                isTransitioningRef.current = false;
            }
        };
        requestAnimationFrame(step);
    };

    // MAP Theme States
    const [mapFestivalText, setMapFestivalText] = useState('LOLLAPALOOZA');
    const [mapCity, setMapCity] = useState('Paris');
    const [mapCountry, setMapCountry] = useState('France');
    const [mapVenue, setMapVenue] = useState('');
    const mapCityCountry = `${mapCity}, ${mapCountry}`;
    // If a venue is specified, use it as the primary search query (with city/country as context)
    const mapSearchQuery = mapVenue.trim()
        ? `${mapVenue.trim()}, ${mapCity}, ${mapCountry}`
        : mapCityCountry;
    const [mapZoom, setMapZoom] = useState(11);
    const [mapLatitude, setMapLatitude] = useState(48.8566);
    const [mapLongitude, setMapLongitude] = useState(2.3522);
    const [isMapLoading, setIsMapLoading] = useState(false);
    const [mapStyle, setMapStyle] = useState<'dark' | 'voyager' | 'satellite'>('dark');
    const [mapPinColor, setMapPinColor] = useState('#ff0033');
    const [mapLabelText, setMapLabelText] = useState('PARIS, FRANCE');
    const [showMapPin, setShowMapPin] = useState(true);
    const [showMapLabel, setShowMapLabel] = useState(true);

    // Selected Music Style state
    const [themeColor, setThemeColor] = useState<typeof STYLE_PRESETS[0] | null>(null);

    // For Top 5
    const [top5Items, setTop5Items] = useState<Top5Item[]>(Array.from({ length: 5 }, () => ({
        main: 'ARTISTE',
        sub: 'TITRE DU MORCEAU',
        value: '50',
        spotifyUrl: '',
        photo: ''
    })));

    const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
    const [rotation, setRotation] = useState(0);
    const [transitionProgress, setTransitionProgress] = useState(0); // 0 to 1 for glitches/fades

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const logoRef = useRef<HTMLImageElement | null>(null);
    const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});
    const offCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const [selection, setSelection] = useState({ start: 0, end: 0 });
    const selectionRef = useRef({ start: 0, end: 0 });
    const dragControls = useDragControls();
    const [isTakeoverLoading, setIsTakeoverLoading] = useState(false);
    const [takeoverData, setTakeoverData] = useState<{ lineup: any[], streams: any[] } | null>(null);

    // Detect mobile vs desktop (lg breakpoint = 1024px) — JS-based to avoid canvasRef conflict
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Disable body scroll while SocialStudio is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);


    const togglePanel = (panel: string) => setActivePanel(prev => prev === panel ? null : panel);


    const handleTextStyler = (type: 'C' | 'B', value: string) => {
        if (!textAreaRef.current) return;
        const start = selectionRef.current.start;
        const end = selectionRef.current.end;

        if (start === end) {
            if (type === 'C') setTextColor(value);
            else setTextBgColor(value);
            return;
        }

        const current = customText;
        const selectedText = current.substring(start, end);
        const tagRegex = new RegExp(`^\\[${type}:[^\\]]+\\](.*?)\\[\\/${type}\\]$`, 'i');
        const match = selectedText.match(tagRegex);

        const valueToUse = value.toUpperCase();
        let newText;
        if (match) {
            newText = current.substring(0, start) + `[${type}:${valueToUse}]${match[1]}[/${type}]` + current.substring(end);
        } else {
            newText = current.substring(0, start) + `[${type}:${valueToUse}]${selectedText}[/${type}]` + current.substring(end);
        }

        setCustomText(newText);
        setTimeout(() => {
            if (textAreaRef.current) {
                textAreaRef.current.focus();
                textAreaRef.current.setSelectionRange(start, end);
            }
        }, 50);
    };

    // Initial load for logo
    useEffect(() => {
        const logo = new Image();
        logo.src = '/Logo.png';
        logo.crossOrigin = "anonymous";
        logo.onload = () => { logoRef.current = logo; };
    }, []);

    const baseThemeData: Record<ThemeType, { label: string; grad: string; color: string }> = {
        'TOP 5 ARTISTE': { label: 'TOP 5 ARTISTES', grad: '255, 230, 0', color: '#ffe600' }, // Unique Yellow/Gold
        'TOP 5 STYLES': { label: 'TOP 5 STYLES', grad: '0, 240, 255', color: '#00f0ff' },
        'TOP 10 FESTIVAL': { label: 'TOP 10 ARTISTES', grad: '255, 0, 51', color: '#ff0033' }, // Neon Red
        'TOP 100 DROPSIDERS': { label: 'TOP 100 DROPSIDERS', grad: '255, 230, 0', color: '#ffe600' },
        'NEWS': { label: 'NEWS', grad: '255, 0, 51', color: '#ff0033' },
        'FOCUS': { label: 'FOCUS', grad: '255, 170, 0', color: '#ffaa00' },
        'MUSIQUE': { label: 'MUSIQUE', grad: '57, 255, 20', color: '#39ff14' },
        'RECAP': { label: 'RÉCAP', grad: '192, 38, 211', color: '#c026d3' },
        'EVENTS': { label: 'EVENTS', grad: '255, 0, 127', color: '#ff007f' },
        'LIVESTREAM': { label: 'DIRECT', grad: '255, 18, 65', color: '#ff1241' },
        'PLANNING': { label: 'AGENDA', grad: '255, 55, 0', color: '#ff3700' },
        'TRACKLIST': { label: 'TRACKLIST', grad: '255, 120, 0', color: '#ff7800' },
        'INTERVIEW': { label: 'INTERVIEW', grad: '255, 255, 255', color: '#ffffff' },
        'SPOTLIGHT': { label: 'SPOTLIGHT', grad: '255, 0, 51', color: '#ff0033' },
        'CITATION': { label: 'CITATION', grad: '255, 255, 255', color: '#ffffff' },
        'CONSEILS': { label: 'REELS', grad: '255, 0, 51', color: '#ff0033' },
        'REELS': { label: 'REELS', grad: '255, 0, 51', color: '#ff0033' },
        'CONCOURS': { label: 'JEUX CONCOURS', grad: '0, 140, 255', color: '#008cff' },
        'ARTISTE FESTIVAL': { label: 'ARTISTE FESTIVAL', grad: '255, 0, 51', color: '#ff0033' },
        'AFFICHE': { label: 'AFFICHE', grad: '255, 0, 51', color: '#ff0033' },
        'PROMO': { label: 'PROMO', grad: '255, 0, 51', color: '#ff0033' },
        'MAP': { label: 'MAP', grad: '255, 0, 51', color: '#ff0033' },
        'CALENDRIER': { label: 'CALENDRIER', grad: '255, 103, 0', color: '#ff6700' },
        'JEU': { label: 'JEU', grad: '0, 240, 255', color: '#00f0ff' },
        'JEU_FESTIVAL': { label: 'JEU_FESTIVAL', grad: '255, 170, 0', color: '#ffaa00' },
    };

    useEffect(() => {
        try {
            localStorage.removeItem('dropsiders_custom_planning_import');
        } catch {}
    }, []);

    useEffect(() => {
        setThemeColor(null);
    }, [activeTab]);

    useEffect(() => {
        if (theme !== 'PROMO' && baseThemeData[theme]) {
            setPromoCategory(theme);
        }
    }, [theme]);

    const handleArtistLogoChange = (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        const imgObj = new Image();
        imgObj.crossOrigin = "anonymous";
        imgObj.src = url;
        imgObj.onload = () => {
            artistLogoRef.current = imgObj;
            setArtistLogo(url);
            generateImage();
        };
    };

    const handleFestivalLogoChange = (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        const imgObj = new Image();
        imgObj.crossOrigin = "anonymous";
        imgObj.src = url;
        imgObj.onload = () => {
            festivalLogoRef.current = imgObj;
            setFestivalLogo(url);
            generateImage();
        };
    };

    const activeColor = themeColor || baseThemeData[theme];

    // Rotation Animation
    useEffect(() => {
        let frame: number;
        if (theme === 'TOP 5 STYLES' && isVideoRecording) {
            const animate = () => {
                setRotation(prev => (prev + 0.012) % (Math.PI * 2));
                frame = requestAnimationFrame(animate);
            };
            frame = requestAnimationFrame(animate);
        } else {
            setRotation(0);
        }
        return () => cancelAnimationFrame(frame);
    }, [theme, isVideoRecording]);

    const handleGeocode = async () => {
        if (!mapSearchQuery.trim()) return;
        setIsMapLoading(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}&limit=1`);
            const data = await response.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                setMapLatitude(lat);
                setMapLongitude(lon);
                const labelBase = mapVenue.trim() ? mapVenue.trim() : mapCityCountry;
                setMapLabelText(labelBase.toUpperCase());
            }
        } catch (error) {
            console.error("Geocoding error:", error);
        } finally {
            setIsMapLoading(false);
        }
    };

    useEffect(() => {
        if (!mapSearchQuery.trim() || mapSearchQuery.trim().length < 3) return;
        const timer = setTimeout(() => {
            handleGeocode();
        }, 600);
        return () => clearTimeout(timer);
    }, [mapSearchQuery]);

    const drawMap = (
        ctx: CanvasRenderingContext2D,
        lat: number,
        lon: number,
        zoom: number,
        width: number,
        height: number,
        dx: number,
        dy: number
    ) => {
        const centerTileX = lon2tile(lon, zoom);
        const centerTileY = lat2tile(lat, zoom);

        const canvasCenterX = dx + width / 2;
        const canvasCenterY = dy + height / 2;

        const tilesX = Math.ceil(width / 256) + 1;
        const tilesY = Math.ceil(height / 256) + 1;

        const startX = Math.floor(centerTileX - tilesX / 2);
        const endX = Math.ceil(centerTileX + tilesX / 2);
        const startY = Math.floor(centerTileY - tilesY / 2);
        const endY = Math.ceil(centerTileY + tilesY / 2);

        ctx.save();
        ctx.beginPath();
        ctx.rect(dx, dy, width, height);
        ctx.clip();

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const mapX = Math.floor(x);
                const mapY = Math.floor(y);
                const maxTileVal = Math.pow(2, zoom);
                
                if (mapY < 0 || mapY >= maxTileVal) continue;
                const wrappedX = ((mapX % maxTileVal) + maxTileVal) % maxTileVal;

                let tileUrl = '';
                let tileRefUrl = '';
                if (mapStyle === 'voyager') {
                    tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${zoom}/${mapY}/${wrappedX}`;
                } else if (mapStyle === 'satellite') {
                    tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${mapY}/${wrappedX}`;
                    tileRefUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${zoom}/${mapY}/${wrappedX}`;
                } else {
                    tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${zoom}/${mapY}/${wrappedX}`;
                    tileRefUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/${zoom}/${mapY}/${wrappedX}`;
                }

                const tileDx = canvasCenterX + (x - centerTileX) * 256;
                const tileDy = canvasCenterY + (y - centerTileY) * 256;

                const renderTile = (url: string) => {
                    if (!url) return;
                    let tileImg = imageCacheRef.current[url];
                    if (!tileImg) {
                        const imgObj = new Image();
                        imgObj.crossOrigin = 'anonymous';
                        imgObj.src = url;
                        imgObj.onload = () => {
                            imageCacheRef.current[url] = imgObj;
                            generateImage();
                        };
                        imageCacheRef.current[url] = imgObj;
                    } else if (tileImg.complete && tileImg.naturalWidth > 0) {
                        ctx.drawImage(tileImg, tileDx, tileDy, 256, 256);
                    }
                };

                renderTile(tileUrl);
                if (tileRefUrl) {
                    renderTile(tileRefUrl);
                }
            }
        }

        if (showMapPin) {
            ctx.shadowColor = mapPinColor;
            ctx.shadowBlur = 20;
            ctx.fillStyle = mapPinColor;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;

            ctx.beginPath();
            ctx.arc(canvasCenterX, canvasCenterY, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(canvasCenterX, canvasCenterY, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }

        if (showMapLabel && mapLabelText) {
            const locationText = mapLabelText.toUpperCase();
            ctx.save();
            ctx.shadowColor = mapPinColor;
            ctx.shadowBlur = 10;
            ctx.font = '900 italic 28px "Montserrat", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const tagW = ctx.measureText(locationText).width + 60;
            const tagH = 56;
            const tagX = canvasCenterX;
            const tagY = showMapPin ? canvasCenterY + 70 : canvasCenterY;

            ctx.fillStyle = 'rgba(10, 10, 10, 0.9)';
            ctx.beginPath();
            ctx.roundRect(tagX - tagW / 2, tagY - tagH / 2, tagW, tagH, 12);
            ctx.fill();

            ctx.strokeStyle = mapPinColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(tagX - tagW / 2, tagY - tagH / 2, tagW, tagH, 12);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.fillText(locationText, tagX, tagY + 2);
            ctx.restore();
        }

        ctx.restore();
    };

    const generateImage = async (targetTab?: TabType, exportMode: boolean | ThemeType = false, forceThemeParam?: ThemeType) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const effectiveTab = targetTab || activeTab;
        const forceTheme = typeof exportMode === 'string' ? (exportMode as ThemeType) : forceThemeParam;
        const isPromoRequested = isVideoRecordingRef.current
            ? promoOutroOverrideRef.current
            : (promoOutroOverrideRef.current || (isCarouselPromoActive && isMultiSlideTheme));
        const effectiveTheme = isPromoRequested ? 'PROMO' : (forceTheme || theme);

        try {
            await (async (theme: ThemeType) => {
                const isPromoTheme = theme === 'PROMO';
                const isAgendaSource = theme === 'PLANNING' || promoCategory === 'PLANNING';
                const sourceThemeKey = (isPromoRequested
                    ? (isAgendaSource ? 'PLANNING' : (promoCategory as ThemeType || theme || 'NEWS'))
                    : (theme === 'PROMO' ? (promoCategory as ThemeType || 'NEWS') : theme)) as ThemeType;
                const effectiveBaseThemeData = baseThemeData[sourceThemeKey] || baseThemeData['NEWS'];
                const promoThemeData = themeColor || effectiveBaseThemeData;
                const activeColor = isPromoTheme 
                    ? promoThemeData 
                    : (themeColor || baseThemeData[theme] || baseThemeData['NEWS']);
                let img: HTMLImageElement | null = null;
            if (bgImage) {
                if (imageCacheRef.current[bgImage]) {
                    img = imageCacheRef.current[bgImage];
                } else {
                    const imgObj = new Image();
                    imgObj.crossOrigin = "anonymous";
                    imgObj.src = bgImage;
                    imgObj.onload = () => {
                        imageCacheRef.current[bgImage] = imgObj;
                        generateImage();
                    };
                    img = null;
                }
            }

            const targetHeight = effectiveTab === 'REEL' ? 1920 : 1350;
            if (canvas.width !== 1080) canvas.width = 1080;
            if (canvas.height !== targetHeight) canvas.height = targetHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const safeSize = effectiveTab === 'PUBLICATION' ? 1050 : 1080;
            const safeTop = (canvas.height - safeSize) / 2;
            const safeBottom = safeTop + safeSize;

            const effectiveAgendaSlide = agendaSlideOverrideRef.current !== null ? agendaSlideOverrideRef.current : agendaSlide;
            const effectiveEditorialSlide = editorialSlideOverrideRef.current !== null ? editorialSlideOverrideRef.current : editorialSlide;
            const effectiveTransitionProgress = transitionProgressRef.current !== null ? transitionProgressRef.current : transitionProgress;

            // Pour MUSIQUE slide >= 2 : récupérer la cover active si aucun fond personnalisé n'a été chargé
            const isMusiqueTrackSlide = (theme === 'MUSIQUE' && effectiveEditorialSlide >= 2);
            const musiqueTrackIdx = isMusiqueTrackSlide ? Math.max(0, effectiveEditorialSlide - 2) : 0;
            const musiqueActiveTrack = isMusiqueTrackSlide ? musicTracks[musiqueTrackIdx] : null;
            const musiqueCoverUrl = musiqueActiveTrack?.cover || (musiqueTrackIdx === 0 ? afficheImage : '');
            const musiqueCoverImg = (musiqueCoverUrl && musicCoverImgsRef.current[musiqueCoverUrl]) || (musiqueTrackIdx === 0 ? afficheImageRef.current : null);

            const effectiveImg = img || (isMusiqueTrackSlide ? musiqueCoverImg : null);

            const isAnyAnimationActive = (textAnimation !== 'NONE' || bgAnimation !== 'NONE');
            // Animation d'entrée jouée une seule fois au début, puis reste 100% fixe (aucun re-bouclage intempestif)
            const animElapsed = (isVideoRecording || (bgVideo && !isDownloading) || isAnyAnimationActive)
                ? (Date.now() - animStartTimeRef.current) / 1000
                : 99.0;

            const getTextAnimTransform = (delay: number = 0) => {
                if (textAnimation === 'NONE') {
                    return { alpha: 1, xOff: 0, yOff: 0, scale: 1 };
                }
                const el = animElapsed - delay;
                let alpha = 1;
                let xOff = 0;
                let yOff = 0;
                let scale = 1;

                switch (textAnimation) {
                    case 'SLIDE_LEFT': {
                        const t = Math.max(0, Math.min(1, el / 0.55));
                        const ease = 1 - Math.pow(1 - t, 3);
                        xOff = -450 * (1 - ease);
                        alpha = t;
                        break;
                    }
                    case 'WORD_BY_WORD': {
                        const t = Math.max(0, Math.min(1, el / 0.40));
                        const ease = 1 - Math.pow(1 - t, 3);
                        yOff = 25 * (1 - ease);
                        alpha = t;
                        break;
                    }
                    case 'POP_UP': {
                        const t = Math.max(0, Math.min(1, el / 0.50));
                        const ease = 1 - Math.pow(1 - t, 3);
                        yOff = 80 * (1 - ease);
                        alpha = t;
                        break;
                    }
                    case 'ZOOM_IMPACT': {
                        const t = Math.max(0, Math.min(1, el / 0.40));
                        const ease = 1 - Math.pow(1 - t, 3);
                        scale = 1.6 - (0.6 * ease);
                        alpha = Math.min(1, t * 2);
                        break;
                    }
                    case 'TYPEWRITER': {
                        alpha = el >= 0 ? 1 : 0;
                        break;
                    }
                    case 'BOUNCE': {
                        const t = Math.max(0, Math.min(1, el / 0.65));
                        let bounce = 1;
                        if (t < 1) {
                            bounce = 1 - Math.pow(2, -10 * t) * Math.cos((t * 10 - 0.75) * ((2 * Math.PI) / 3));
                        }
                        yOff = -140 * (1 - bounce);
                        alpha = Math.min(1, t * 2.5);
                        break;
                    }
                    case 'GLITCH': {
                        if (el < 0) {
                            alpha = 0;
                        } else if (el < 0.45) {
                            const step = Math.floor(el * 28);
                            xOff = Math.sin(step * 7.5) * 35;
                            alpha = (step % 3 === 0) ? 0.35 : 1;
                        } else {
                            xOff = 0;
                            alpha = 1;
                        }
                        break;
                    }
                    default:
                        break;
                }
                return { alpha, xOff, yOff, scale };
            };

            const applyTextAnimCtx = (ctx: CanvasRenderingContext2D, delay: number, anchorX: number, anchorY: number) => {
                if (textAnimation === 'NONE') return;
                const anim = getTextAnimTransform(delay);
                ctx.globalAlpha *= Math.max(0, Math.min(1, anim.alpha));
                ctx.translate(anchorX + anim.xOff, anchorY + anim.yOff);
                if (anim.scale !== 1) {
                    ctx.scale(anim.scale, anim.scale);
                }
                ctx.translate(-anchorX, -anchorY);
            };

            let bgAnimScale = 1.0;
            let bgAnimX = 0;
            let bgAnimY = 0;

            if (bgAnimation !== 'NONE' && (effectiveImg || bgVideo)) {
                const loopDuration = 6.0;
                const tLinear = isVideoRecording 
                    ? Math.min(1, animElapsed / loopDuration) 
                    : ((animElapsed % loopDuration) / loopDuration);
                const tSmooth = isVideoRecording 
                    ? Math.min(1, animElapsed / loopDuration) 
                    : (0.5 - 0.5 * Math.cos(tLinear * 2 * Math.PI));

                switch (bgAnimation) {
                    case 'ZOOM_IN':
                        bgAnimScale = 1.0 + tSmooth * 0.16;
                        break;
                    case 'ZOOM_OUT':
                        bgAnimScale = 1.16 - tSmooth * 0.16;
                        break;
                    case 'PAN_LEFT':
                        bgAnimScale = 1.12;
                        bgAnimX = (0.5 - tSmooth) * 90;
                        break;
                    case 'PAN_RIGHT':
                        bgAnimScale = 1.12;
                        bgAnimX = (tSmooth - 0.5) * 90;
                        break;
                    case 'PULSE': {
                        const beat = (animElapsed % 0.468) / 0.468;
                        const beatDecay = Math.pow(Math.max(0, 1 - beat), 2.5);
                        bgAnimScale = 1.0 + beatDecay * 0.055;
                        break;
                    }
                    case 'BREATHE': {
                        const breathePhase = (animElapsed / 4.0) * 2 * Math.PI;
                        bgAnimScale = 1.04 + Math.sin(breathePhase) * 0.035;
                        bgAnimY = Math.cos(breathePhase) * 16;
                        break;
                    }
                    case 'GLITCH': {
                        const shakeIntensity = 0.8 + 0.2 * Math.sin(animElapsed * 6);
                        bgAnimScale = 1.04;
                        bgAnimX = (Math.sin(animElapsed * 38) + Math.cos(animElapsed * 71)) * 4.5 * shakeIntensity;
                        bgAnimY = (Math.cos(animElapsed * 43) + Math.sin(animElapsed * 67)) * 3.5 * shakeIntensity;
                        break;
                    }
                    default:
                        break;
                }
            }

            if (bgVideo) {
                const baseScale = Math.max(canvas.width / bgVideo.videoWidth, canvas.height / bgVideo.videoHeight);
                const scale = baseScale * bgAnimScale;
                const vw = bgVideo.videoWidth * scale;
                const vh = bgVideo.videoHeight * scale;
                let x = ((canvas.width - vw) / 2) + bgOffsetX + bgAnimX;
                let y = ((canvas.height - vh) / 2) + bgOffsetY + bgAnimY;
                if (imgLayoutMode === 'PAR_LIGNES') {
                    y = ((canvas.height * 0.62 - vh) / 2) + bgOffsetY + bgAnimY;
                } else if (imgLayoutMode === 'HAUT_LIGNE') {
                    y = ((canvas.height * 0.42 - vh) / 2) + bgOffsetY + bgAnimY;
                } else if (imgLayoutMode === 'BAS_LIGNE') {
                    y = ((canvas.height * 0.85 - vh) / 2) + bgOffsetY + bgAnimY;
                }
                if (theme === 'AFFICHE' || (theme === 'EVENTS' && eventsSlide === 2) || (theme === 'MUSIQUE' && effectiveEditorialSlide >= 2)) {
                    ctx.save();
                    ctx.filter = 'blur(14px)';
                    const blurBleed = 28;
                    ctx.drawImage(bgVideo, x - blurBleed, y - blurBleed, vw + blurBleed * 2, vh + blurBleed * 2);
                    ctx.restore();
                } else {
                    ctx.drawImage(bgVideo, x, y, vw, vh);
                }
            } else if (effectiveImg) {
                if (theme === 'SPOTLIGHT') {
                    const baseScale = Math.max(canvas.width / effectiveImg.width, canvas.height / effectiveImg.height);
                    const scale = baseScale * bgAnimScale;
                    const iw = effectiveImg.width * scale;
                    const ih = effectiveImg.height * scale;
                    // Position photo on the right with manual offset
                    const x = (canvas.width - iw) + bgOffsetX + bgAnimX;
                    const y = ((canvas.height - ih) / 2) + bgOffsetY + bgAnimY;
                    ctx.drawImage(effectiveImg, x, y, iw, ih);
                } else {
                    const baseScale = Math.max(canvas.width / effectiveImg.width, canvas.height / effectiveImg.height);
                    const scale = baseScale * bgAnimScale;
                    const iw = effectiveImg.width * scale;
                    const ih = effectiveImg.height * scale;
                    let x = ((canvas.width - iw) / 2) + bgOffsetX + bgAnimX;
                    let y = ((canvas.height - ih) / 2) + bgOffsetY + bgAnimY;
                    if (imgLayoutMode === 'PAR_LIGNES') {
                        y = ((canvas.height * 0.62 - ih) / 2) + bgOffsetY + bgAnimY;
                    } else if (imgLayoutMode === 'HAUT_LIGNE') {
                        y = ((canvas.height * 0.42 - ih) / 2) + bgOffsetY + bgAnimY;
                    } else if (imgLayoutMode === 'BAS_LIGNE') {
                        y = ((canvas.height * 0.85 - ih) / 2) + bgOffsetY + bgAnimY;
                    }
                    if (theme === 'AFFICHE' || (theme === 'EVENTS' && eventsSlide === 2) || (theme === 'MUSIQUE' && effectiveEditorialSlide >= 2)) {
                        ctx.save();
                        ctx.filter = 'blur(28px) brightness(0.60)';
                        const blurBleed = 60;
                        ctx.drawImage(effectiveImg, x - blurBleed, y - blurBleed, iw + blurBleed * 2, ih + blurBleed * 2);
                        ctx.restore();
                    } else {
                        ctx.drawImage(effectiveImg, x, y, iw, ih);
                    }
                }
            } else {
                if (!isTransparent) {
                    if (theme === 'MUSIQUE') {
                        const bgGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height * 0.35, 60, canvas.width / 2, canvas.height / 2, canvas.height * 0.75);
                        bgGrad.addColorStop(0, '#101712');
                        bgGrad.addColorStop(0.5, '#090d0a');
                        bgGrad.addColorStop(1, '#040504');
                        ctx.fillStyle = bgGrad;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    } else {
                        ctx.fillStyle = '#111';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                } else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }

            if (theme === 'PLANNING') {
                const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
                grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
                grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.55)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else if (theme === 'CITATION') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            const activeData = activeColor;
            const stripTags = (s: string) => s.replace(/\[[CB]:[^\]]+\]|\[\/[CB]\]|\*/gi, '');
            const parseRichText = (str: string) => {
                let processed = str.replace(/\*(.*?)\*/g, `[C:${activeData.color}]$1[/C]`);
                const segments: { text: string; color?: string; bg?: string }[] = [];
                const regex = /\[([CB]):([^\]]+)\](.*?)\[\/\1\]|([^\[]+|\[(?!([CB]):[^\]]+\]))/gi;
                let match;
                while ((match = regex.exec(processed)) !== null) {
                    if (match[1]) {
                        segments.push({ text: match[3], color: match[1] === 'C' ? match[2] : undefined, bg: match[1] === 'B' ? match[2] : undefined });
                    } else if (match[4]) {
                        segments.push({ text: match[4] });
                    }
                }
                return segments;
            };

            const drawRichText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, defaultColor: string, align: 'left'|'center'|'right' = 'left') => {
                const segments = parseRichText(text);
                let currentX = x;
                
                if (align === 'center') {
                    let totalWidth = 0;
                    segments.forEach(seg => { totalWidth += ctx.measureText(seg.text).width; });
                    currentX = x - (totalWidth / 2);
                } else if (align === 'right') {
                    let totalWidth = 0;
                    segments.forEach(seg => { totalWidth += ctx.measureText(seg.text).width; });
                    currentX = x - totalWidth;
                }

                ctx.save();
                ctx.textAlign = 'left';
                segments.forEach(seg => {
                    const segWidth = ctx.measureText(seg.text).width;
                    const effectiveBg = seg.bg || (textBgColor !== 'transparent' ? textBgColor : null);
                    if (effectiveBg) {
                        ctx.save();
                        ctx.globalAlpha = 0.9;
                        ctx.fillStyle = effectiveBg;
                        const px = 12;
                        const matchFont = ctx.font.match(/(\d+(?:\.\d+)?)px/);
                        const fSize = matchFont ? parseFloat(matchFont[1]) : 40;
                        ctx.beginPath();
                        ctx.roundRect(currentX - px/2, y - fSize + 15, segWidth + px, fSize + 8, 12);
                        ctx.fill();
                        ctx.restore();
                    }
                    if (seg.color) {
                        ctx.save();
                        ctx.fillStyle = seg.color;
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                        ctx.shadowBlur = 4;
                        ctx.fillText(seg.text, currentX, y);
                        ctx.restore();
                    } else {
                        ctx.fillStyle = defaultColor;
                        ctx.fillText(seg.text, currentX, y);
                    }
                    currentX += segWidth;
                });
                ctx.restore();
            };

            const drawTopCapsuleBadge = (label: string, dotColor: string, gradStr: string) => {
                const isReel = effectiveTab === 'REEL';
                const badgeX = isReel ? 80 : 60;
                // Alignement au pixel près avec le haut du cadre du logo Dropsiders
                const badgeY = isReel ? 74 : 50;

                ctx.save();
                const badgeFontSize = 20;
                const badgeLetterSpacing = 1.8;
                ctx.font = `900 italic ${badgeFontSize}px "Montserrat", sans-serif`;
                if ('letterSpacing' in ctx) {
                    (ctx as any).letterSpacing = `${badgeLetterSpacing}px`;
                }

                // Mesure précise du texte avec espacement
                const textMetrics = ctx.measureText(label);
                const textWidth = textMetrics.width;
                const italicSlantBuffer = 6;

                // Géométrie de la capsule
                const badgePadLeft = 18;
                const dotRadius = 5.5;
                const dotGap = 11;
                const badgePadRight = 24;

                const badgeH = 46;
                const badgeRadius = badgeH / 2;
                const dotCenterX = badgeX + badgePadLeft + dotRadius;
                const dotCenterY = badgeY + (badgeH / 2);
                const textStartX = dotCenterX + dotRadius + dotGap;
                const badgeW = Math.ceil(badgePadLeft + (dotRadius * 2) + dotGap + textWidth + italicSlantBuffer + badgePadRight);

                // Fond capsule verre fumé
                ctx.fillStyle = 'rgba(12, 14, 20, 0.78)';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
                ctx.shadowBlur = 16;
                ctx.shadowOffsetY = 4;
                ctx.beginPath();
                ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeRadius);
                ctx.fill();

                // Bordure fine avec accent du thème
                ctx.shadowColor = 'transparent';
                ctx.strokeStyle = `rgba(${gradStr}, 0.55)`;
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeRadius);
                ctx.stroke();

                // Point lumineux néon
                ctx.save();
                ctx.fillStyle = dotColor;
                ctx.shadowColor = dotColor;
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(dotCenterX, dotCenterY, dotRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Texte de la capsule en blanc gras italique
                ctx.fillStyle = '#ffffff';
                if ('letterSpacing' in ctx) {
                    (ctx as any).letterSpacing = `${badgeLetterSpacing}px`;
                }
                ctx.textAlign = 'left';

                let textY = dotCenterY;
                if (textMetrics.actualBoundingBoxAscent !== undefined && textMetrics.actualBoundingBoxDescent !== undefined) {
                    ctx.textBaseline = 'alphabetic';
                    textY = dotCenterY + (textMetrics.actualBoundingBoxAscent - textMetrics.actualBoundingBoxDescent) / 2;
                } else {
                    ctx.textBaseline = 'middle';
                    textY = dotCenterY - 0.5;
                }

                ctx.fillText(label, textStartX, textY);
                ctx.restore();
            };

            if (!showText) return; 

            const isModernEditorialTheme = (
                ['NEWS', 'FOCUS', 'RECAP', 'INTERVIEW', 'LIVESTREAM', 'TRACKLIST', 'CONCOURS', 'CONSEILS', 'REELS'].includes(theme) ||
                (theme === 'MUSIQUE' && effectiveEditorialSlide === 1) ||
                (theme === 'EVENTS' && eventsSlide === 1) ||
                (theme === 'ARTISTE FESTIVAL' && artisteFestivalSlide === 1)
            );

            // Modern editorial themes (NEWS, FOCUS, MUSIQUE, RECAP, EVENTS, INTERVIEW, LIVESTREAM, ARTISTE FESTIVAL Slide 1)
            // Use smooth cinematic header shadow & continuous dark bottom gradient (no scanlines)
            if (isModernEditorialTheme) {
                // Top subtle header shadow for clean badge and logo legibility
                const topGrad = ctx.createLinearGradient(0, 0, 0, 220);
                topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
                topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = topGrad;
                ctx.fillRect(0, 0, canvas.width, 220);

                // Continuous cinematic bottom gradient (from ~44% height down to bottom)
                const gradStart = canvas.height * 0.44;
                const bGrad = ctx.createLinearGradient(0, gradStart, 0, canvas.height);
                bGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
                bGrad.addColorStop(0.30, 'rgba(0, 0, 0, 0.45)');
                bGrad.addColorStop(0.60, 'rgba(0, 0, 0, 0.82)');
                bGrad.addColorStop(0.88, 'rgba(0, 0, 0, 0.98)');
                bGrad.addColorStop(1, 'rgba(0, 0, 0, 1.0)');
                ctx.fillStyle = bGrad;
                ctx.fillRect(0, gradStart, canvas.width, canvas.height - gradStart);

                // Subtle ambient colored glow at the bottom edge (max 14% opacity, skip for Interview pure white)
                if (activeData?.grad && theme !== 'INTERVIEW') {
                    const edgeGrad = ctx.createLinearGradient(0, canvas.height * 0.82, 0, canvas.height);
                    edgeGrad.addColorStop(0, `rgba(${activeData.grad}, 0)`);
                    edgeGrad.addColorStop(1, `rgba(${activeData.grad}, 0.14)`);
                    ctx.fillStyle = edgeGrad;
                    ctx.fillRect(0, canvas.height * 0.82, canvas.width, canvas.height * 0.18);
                }
            } else {
                if (theme !== 'CONSEILS' && theme !== 'REELS' && theme !== 'CONCOURS' && theme !== 'TRACKLIST' && theme !== 'SPOTLIGHT' && theme !== 'CITATION' && theme !== 'PROMO' && theme !== 'JEU' && theme !== 'JEU_FESTIVAL' && theme !== 'AFFICHE' && !(theme === 'EVENTS' && eventsSlide === 2) && !(theme === 'MUSIQUE' && effectiveEditorialSlide >= 2) && theme !== 'PLANNING' && !(theme === 'ARTISTE FESTIVAL' && artisteFestivalSlide === 2)) {
                    const gradStart = (theme === 'TOP 5 ARTISTE' || theme === 'TOP 5 STYLES')
                        ? canvas.height * 0.8
                        : canvas.height * 0.4;

                    const grad = ctx.createLinearGradient(0, gradStart, 0, canvas.height);
                    grad.addColorStop(0, 'rgba(0,0,0,0)');
                    const rgbGrad = activeData.grad;
                    grad.addColorStop(0.3, 'rgba(0,0,0,0.2)');
                    grad.addColorStop(0.8, `rgba(${rgbGrad}, 0.7)`);
                    grad.addColorStop(1, `rgba(${rgbGrad}, 1)`);
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, gradStart, canvas.width, canvas.height - gradStart);
                }

                // Lignes de scan rétro (uniquement sur les thèmes non modernisés)
                if (theme !== 'PLANNING' && theme !== 'CONSEILS' && theme !== 'REELS' && theme !== 'CONCOURS') {
                    const scanlineLimitY = canvas.height;
                    ctx.fillStyle = 'rgba(0,0,0,0.1)';
                    for (let i = 0; i < scanlineLimitY; i += 6) ctx.fillRect(0, i, canvas.width, 2);
                }
            }

            // Universal Slide Transition Engine (SLIDE, FADE, ZOOM, GLITCH, CUT)
            let slideX = 0;
            const applySlideTransitionCtx = (targetCtx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
                if (effectiveTransitionProgress <= 0) return;
                const p = effectiveTransitionProgress;

                switch (slideTransition) {
                    case 'SLIDE': {
                        if (p < 0.5) {
                            const subP = p * 2;
                            const sx = -canvas.width * (subP * subP);
                            targetCtx.translate(sx, 0);
                        } else {
                            const subP = (p - 0.5) * 2;
                            const sx = canvas.width * (1 - (subP * (2 - subP)));
                            targetCtx.translate(sx, 0);
                        }
                        break;
                    }
                    case 'FADE': {
                        const alpha = p < 0.5 ? Math.max(0, 1 - (p * 2)) : Math.min(1, (p - 0.5) * 2);
                        targetCtx.globalAlpha *= alpha;
                        break;
                    }
                    case 'ZOOM': {
                        targetCtx.translate(centerX, centerY);
                        if (p < 0.5) {
                            const subP = p * 2;
                            const scale = 1 - (subP * 0.22);
                            const alpha = Math.max(0, 1 - (subP * 1.5));
                            targetCtx.scale(scale, scale);
                            targetCtx.globalAlpha *= alpha;
                        } else {
                            const subP = (p - 0.5) * 2;
                            const scale = 0.78 + (subP * 0.22);
                            const alpha = Math.min(1, subP * 1.5);
                            targetCtx.scale(scale, scale);
                            targetCtx.globalAlpha *= alpha;
                        }
                        targetCtx.translate(-centerX, -centerY);
                        break;
                    }
                    case 'GLITCH': {
                        const shake = Math.sin(p * 50) * 35;
                        targetCtx.translate(shake, Math.cos(p * 35) * 12);
                        if (p > 0.42 && p < 0.58) {
                            targetCtx.globalAlpha *= 0.35;
                        } else {
                            targetCtx.globalAlpha *= (0.75 + 0.25 * Math.sin(p * 25));
                        }
                        break;
                    }
                    case 'CUT':
                    default:
                        break;
                }
            };

            if (effectiveTransitionProgress > 0) {
                if (slideTransition === 'SLIDE') {
                    if (effectiveTransitionProgress < 0.5) {
                        const p = effectiveTransitionProgress * 2;
                        slideX = -canvas.width * (p * p);
                    } else {
                        const p = (effectiveTransitionProgress - 0.5) * 2;
                        slideX = canvas.width * (1 - (p * (2 - p)));
                    }
                } else if (slideTransition === 'GLITCH') {
                    slideX = Math.sin(effectiveTransitionProgress * 50) * 35;
                }
            }

            const renderPromoOutro = (pCtx: CanvasRenderingContext2D, offsetX: number = 0, alpha: number = 1.0) => {
                pCtx.save();
                if (alpha < 1) pCtx.globalAlpha *= alpha;
                if (offsetX !== 0) pCtx.translate(offsetX, 0);
                const ctx = pCtx;
                const centerX = canvas.width / 2;
                const isReel = effectiveTab === 'REEL';
                if (offsetX === 0 && alpha === 1.0 && effectiveTransitionProgress > 0 && !transitionTargetRef.current) {
                    applySlideTransitionCtx(ctx, centerX, canvas.height / 2);
                }

                // 1. Dark overlay — 75% opaque black
                ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Scan lines subtle texture
                ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
                for (let i = 0; i < canvas.height; i += 6) {
                    ctx.fillRect(0, i, canvas.width, 2);
                }

                // ==========================================
                // ZONE 1 & 2 : PROMO OUTRO (ACCROCHE & PHRASE OFFICIELLE)
                // ==========================================
                const isAgendaPromo = promoCategory === 'PLANNING';
                const isTopHookActive = showPromoHook && !isAgendaPromo;

                const getTargetPromoCategory = (t: string): string => {
                    const raw = (t || 'NEWS').toUpperCase().trim();
                    if (raw.includes('MUSIQUE') || raw.includes('TRACKLIST') || raw.includes('TOP 5') || raw.includes('TOP 100')) {
                        return 'MUSIQUE';
                    }
                    if (raw.includes('FOCUS') || raw.includes('SPOTLIGHT') || raw.includes('CITATION')) {
                        return 'FOCUS';
                    }
                    if (raw.includes('RECAP')) {
                        return 'RECAPS';
                    }
                    if (raw.includes('CONCOURS') || raw.includes('JEU')) {
                        return 'CONCOURS';
                    }
                    if (raw.includes('EVENT') || raw.includes('PLANNING') || raw.includes('AGENDA') || raw.includes('FESTIVAL') || raw.includes('AFFICHE') || raw.includes('MAP') || raw.includes('CALENDRIER')) {
                        return 'EVENTS';
                    }
                    if (raw.includes('INTERVIEW')) {
                        return 'INTERVIEWS';
                    }
                    if (raw.includes('REEL') || raw.includes('VIDEO') || raw.includes('DIRECT') || raw.includes('LIVESTREAM') || raw.includes('CONSEIL')) {
                        return 'VIDEOS';
                    }
                    return 'NEWS';
                };

                const activeTargetCategory = isAgendaPromo 
                    ? 'EVENTS' 
                    : getTargetPromoCategory(promoCategory || theme);

                const defaultHeadline = (activeTargetCategory === 'EVENTS')
                    ? 'POUR ÊTRE INFORMÉ DE TOUS LES ÉVÉNEMENTS'
                    : (activeTargetCategory === 'MUSIQUE')
                    ? 'POUR ÊTRE INFORMÉ DE TOUTES LES SORTIES MUSICALES'
                    : (activeTargetCategory === 'FOCUS')
                    ? 'POUR NE RIEN MANQUER DE NOS FOCUS & DOSSIERS'
                    : (activeTargetCategory === 'RECAPS')
                    ? 'POUR REVIVRE TOUS LES MEILLEURS FESTIVALS'
                    : (activeTargetCategory === 'CONCOURS')
                    ? 'POUR NE RATER AUCUN CONCOURS & PASS FESTIVALS'
                    : (activeTargetCategory === 'INTERVIEWS')
                    ? 'POUR NE RIEN MANQUER DE NOS INTERVIEWS EXCLUSIVES'
                    : (activeTargetCategory === 'VIDEOS')
                    ? 'POUR NE RIEN MANQUER DE NOS VIDÉOS & REELS'
                    : 'POUR ÊTRE INFORMÉ DE TOUTES LES NEWS';

                const effectiveHeadline = promoCustomPhrase.trim() 
                    ? promoCustomPhrase.trim().toUpperCase() 
                    : defaultHeadline;

                const effectiveSubphrase = promoCustomSubphrase.trim()
                    ? promoCustomSubphrase.trim().toUpperCase()
                    : 'SUR LA MUSIQUE ÉLECTRONIQUE ET LES FESTIVALS,';

                const headlineParts = (showPromoHeadline && effectiveHeadline) ? effectiveHeadline.split('\n').filter(Boolean) : [];
                const outroLines = showPromoHeadline ? [
                    ...headlineParts,
                    ...(effectiveSubphrase ? [effectiveSubphrase] : [])
                ] : [];

                const rawQuestion = (customText && customText.trim()) 
                    ? customText.trim().replace(/^["']|["']$/g, '') 
                    : "ET TOI, QU'EN PENSES-TU ?";
                
                const cleanQuestion = rawQuestion.toUpperCase();

                const qLines: string[] = [];
                let questionFontSize = isReel ? 62 : 54;

                if (isTopHookActive) {
                    const words = cleanQuestion.split(' ');
                    let currentLine = '';
                    ctx.font = `900 italic ${questionFontSize}px "Montserrat", sans-serif`;

                    words.forEach((w: string) => {
                        const test = currentLine ? `${currentLine} ${w}` : w;
                        if (ctx.measureText(test).width > 920) {
                            if (currentLine) qLines.push(currentLine);
                            currentLine = w;
                        } else {
                            currentLine = test;
                        }
                    });
                    if (currentLine) qLines.push(currentLine);

                    if (qLines.length > 3) {
                        questionFontSize = isReel ? 48 : 40;
                        ctx.font = `900 italic ${questionFontSize}px "Montserrat", sans-serif`;
                    }
                }

                const qLineHeight = questionFontSize * 1.25;

                const ctaCommentOffset = isReel ? 70 : 60;
                const sepOffset = isReel ? 65 : 55;
                const outroOffset = isReel ? 75 : 65;
                const outroSpacing = isReel ? (isAgendaPromo ? 48 : 42) : 38;
                const abonneGap = outroLines.length > 0 ? (isReel ? (isAgendaPromo ? 36 : 30) : 28) : (isReel ? 20 : 18);
                const dropsidersOffset = isReel ? (isAgendaPromo ? 105 : 90) : 80;
                const pillsOffset = isReel ? (isAgendaPromo ? 75 : 65) : 55;
                const pillH = isReel ? 44 : 40;

                const targetCenterY = isReel ? 950 : 675;
                let outroStartY = 0;
                let dropsidersY = 0;
                let pillsY = 0;

                const outroLinesSpan = outroLines.length > 0 ? (outroLines.length * outroSpacing) : 0;
                const lowerBlockHeight = outroLinesSpan + abonneGap + dropsidersOffset + pillsOffset + pillH;

                if (isTopHookActive) {
                    const blockSpanFromFirstBaseline = (qLines.length - 1) * qLineHeight 
                        + ctaCommentOffset 
                        + sepOffset 
                        + outroOffset 
                        + lowerBlockHeight;
                    
                    const questionAscender = questionFontSize * 0.8;
                    const totalBlockHeight = questionAscender + blockSpanFromFirstBaseline;
                    const qStartY = Math.round(targetCenterY - (totalBlockHeight / 2) + questionAscender);

                    const bgGlow = ctx.createRadialGradient(centerX, targetCenterY, 60, centerX, targetCenterY, isReel ? 520 : 480);
                    bgGlow.addColorStop(0, `rgba(${activeColor.grad}, 0.20)`);
                    bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.fillStyle = bgGlow;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'alphabetic';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                    ctx.shadowBlur = 24;

                    qLines.forEach((line: string, idx: number) => {
                        let fs = questionFontSize;
                        ctx.font = `900 italic ${fs}px "Montserrat", sans-serif`;
                        while (ctx.measureText(line).width > 940 && fs > 24) {
                            fs--;
                            ctx.font = `900 italic ${fs}px "Montserrat", sans-serif`;
                        }
                        ctx.save();
                        applyTextAnimCtx(ctx, 0.08 + idx * 0.08, centerX, qStartY + idx * qLineHeight);
                        ctx.fillStyle = '#ffffff';
                        ctx.fillText(line, centerX, qStartY + idx * qLineHeight);
                        ctx.restore();
                    });
                    ctx.restore();

                    // Call-to-action d'engagement : "DONNE TON AVIS EN COMMENTAIRE 👇"
                    const lastQLineY = qStartY + (qLines.length - 1) * qLineHeight;
                    const ctaCommentY = lastQLineY + ctaCommentOffset;

                    ctx.save();
                    applyTextAnimCtx(ctx, 0.22, centerX, ctaCommentY);
                    ctx.textAlign = 'center';
                    ctx.font = `800 ${isReel ? 26 : 24}px "Montserrat", sans-serif`;
                    ctx.fillStyle = activeColor.color;
                    ctx.shadowColor = `rgba(${activeColor.grad}, 0.6)`;
                    ctx.shadowBlur = 18;
                    ctx.fillText('DONNE TON AVIS EN COMMENTAIRE 👇', centerX, ctaCommentY);
                    ctx.restore();

                    // Ligne de séparation fine néon
                    const sepY = ctaCommentY + sepOffset;
                    const sepGrad = ctx.createLinearGradient(centerX - 200, 0, centerX + 200, 0);
                    sepGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                    sepGrad.addColorStop(0.5, activeColor.color);
                    sepGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    ctx.fillStyle = sepGrad;
                    ctx.fillRect(centerX - 200, sepY, 400, 2);

                    outroStartY = sepY + outroOffset;
                } else {
                    // Phrase d'accroche DÉSACTIVÉE : Centrage parfait du texte en dessous au milieu du visuel
                    outroStartY = Math.round(targetCenterY - (lowerBlockHeight / 2));

                    const bgGlow = ctx.createRadialGradient(centerX, targetCenterY, 80, centerX, targetCenterY, isReel ? 560 : 480);
                    bgGlow.addColorStop(0, `rgba(${activeColor.grad}, 0.26)`);
                    bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.fillStyle = bgGlow;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                // ZONE 2 : PHRASE OFFICIELLE & ABONNEMENT
                ctx.save();
                ctx.textAlign = 'center';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
                ctx.shadowBlur = 18;

                if (outroLines.length > 0) {
                    let outroFontSize = isReel ? (isAgendaPromo ? 30 : 28) : 25;
                    ctx.font = `700 ${outroFontSize}px "Montserrat", sans-serif`;
                    outroLines.forEach(line => {
                        while (ctx.measureText(line).width > 940 && outroFontSize > 18) {
                            outroFontSize--;
                            ctx.font = `700 ${outroFontSize}px "Montserrat", sans-serif`;
                        }
                    });
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

                    outroLines.forEach((line: string, i: number) => {
                        ctx.save();
                        applyTextAnimCtx(ctx, 0.28 + i * 0.08, centerX, outroStartY + i * outroSpacing);
                        ctx.fillText(line, centerX, outroStartY + i * outroSpacing);
                        ctx.restore();
                    });
                }

                // "ABONNEZ-VOUS À"
                const abonneY = outroLines.length > 0
                    ? (outroStartY + outroLines.length * outroSpacing + abonneGap)
                    : (outroStartY + abonneGap);
                ctx.font = `700 ${isReel ? 26 : 24}px "Montserrat", sans-serif`;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
                ctx.fillText('ABONNEZ-VOUS À', centerX, abonneY);

                // "DROPSIDERS" en grand Orbitron néon
                dropsidersY = abonneY + dropsidersOffset;
                ctx.font = `900 italic ${isReel ? (isAgendaPromo ? 98 : 92) : 86}px "Orbitron", sans-serif`;
                ctx.letterSpacing = '-2px';
                ctx.fillStyle = activeColor.color;
                ctx.shadowColor = `rgba(${activeColor.grad}, 0.75)`;
                ctx.shadowBlur = 38;
                ctx.fillText('DROPSIDERS', centerX, dropsidersY);
                ctx.restore();

                // ==========================================
                // ZONE 3 : BULLES ARRONDIES
                // NEWS - MUSIQUE - FOCUS - RECAPS - CONCOURS - EVENTS - INTERVIEWS - VIDEOS
                // ==========================================
                const categories = ['NEWS', 'MUSIQUE', 'FOCUS', 'RECAPS', 'CONCOURS', 'EVENTS', 'INTERVIEWS', 'VIDEOS'];
                pillsY = dropsidersY + pillsOffset;
                const pillFont = `800 ${isReel ? 15 : 14}px "Montserrat", sans-serif`;
                ctx.font = pillFont;

                // Calculer la largeur de chaque pill
                const pillPaddingX = 14;
                const pillGap = 8;
                const pillWidths = categories.map((cat: string) => ctx.measureText(cat).width + pillPaddingX * 2);
                const totalPillsWidth = pillWidths.reduce((a: number, b: number) => a + b, 0) + (categories.length - 1) * pillGap;

                let currentPillX = centerX - totalPillsWidth / 2;

                categories.forEach((cat: string, idx: number) => {
                    const pw = pillWidths[idx];
                    const isPillActive = cat === activeTargetCategory;
                    ctx.save();
                    // Bulle arrondie (pill)
                    ctx.beginPath();
                    ctx.roundRect(currentPillX, pillsY, pw, pillH, pillH / 2);
                    ctx.fillStyle = isPillActive ? `rgba(${activeColor.grad}, 0.18)` : 'rgba(255, 255, 255, 0.08)';
                    ctx.fill();
                    ctx.strokeStyle = isPillActive ? activeColor.color : 'rgba(255, 255, 255, 0.22)';
                    ctx.lineWidth = isPillActive ? 2 : 1.5;
                    if (isPillActive) {
                        ctx.shadowColor = `rgba(${activeColor.grad}, 0.7)`;
                        ctx.shadowBlur = 14;
                    }
                    ctx.stroke();

                    // Texte
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = isPillActive ? activeColor.color : '#ffffff';
                    ctx.font = pillFont;
                    ctx.fillText(cat, currentPillX + pw / 2, pillsY + pillH / 2);
                    ctx.restore();

                    currentPillX += pw + pillGap;
                });

                // ==========================================
                // ZONE 4 : LOGO DROPSIDERS TOUT EN BAS
                // ==========================================
                if (logoRef.current) {
                    const logo = logoRef.current;
                    const lw = isReel ? 240 : 220;
                    const lh = (logo.height / logo.width) * lw;
                    const logoY = canvas.height - lh - (isReel ? 65 : 50);
                    ctx.save();
                    ctx.filter = 'brightness(0) invert(1)';
                    ctx.globalAlpha = 0.85;
                    ctx.drawImage(logo, centerX - lw / 2, logoY, lw, lh);
                    ctx.restore();
                }
                ctx.restore();
                pCtx.restore();
            };

            if (theme === 'TOP 5 STYLES') {
                const item = top5Items[currentPreviewIndex];
                const centerX = canvas.width / 2;
                const centerY = safeTop + 620; // Descendu de 80px supplémentaires
                const radius = 240; // Encore plus réduit (était 280)
                const currentItem = top5Items[currentPreviewIndex];
                let itemPhotoImg: HTMLImageElement | null = null;
                if (currentItem.photo) {
                    if (imageCacheRef.current[currentItem.photo]) {
                        itemPhotoImg = imageCacheRef.current[currentItem.photo];
                    } else {
                        const imgObj = new Image();
                        imgObj.src = currentItem.photo;
                        imgObj.onload = () => { 
                            imageCacheRef.current[currentItem.photo!] = imgObj;
                            generateImage(); 
                        };
                        itemPhotoImg = null; // Will draw on next frame
                    }
                }

                if (itemPhotoImg || img) {
                    ctx.save();
                    ctx.shadowColor = `rgba(${activeData.grad}, 0.5)`;
                    ctx.shadowBlur = 40;
                    ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.fill();
                    ctx.clip();
                    ctx.translate(centerX, centerY); ctx.rotate(rotation);
                    const targetImg = itemPhotoImg || img;
                    if (targetImg) {
                        try {
                            const scale = Math.max((radius * 2) / targetImg.width, (radius * 2) / targetImg.height);
                            ctx.drawImage(targetImg, -(targetImg.width * scale) / 2, -(targetImg.height * scale) / 2, targetImg.width * scale, targetImg.height * scale);
                        } catch (e) {
                            // If drawing fails (e.g. image not ready), skip
                        }
                    }
                    ctx.restore();
                    ctx.beginPath(); ctx.arc(centerX, centerY, 45, 0, Math.PI * 2); ctx.fillStyle = '#0a0a0a'; ctx.fill();
                    ctx.strokeStyle = activeData.color; ctx.lineWidth = 10; ctx.stroke();
                }
                // Artist & Title - Single Line Bold Italic
                ctx.save();
                applyTextAnimCtx(ctx, 0.20, centerX, centerY + radius + 140);
                ctx.textAlign = 'center';
                ctx.fillStyle = '#ffffff';
                ctx.font = '900 italic 62px "Montserrat", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 15;
                ctx.fillText(`${item.main.toUpperCase()} - ${item.sub.toUpperCase()}`, centerX + slideX, centerY + radius + 140);
                ctx.restore();

                // Restore Ranking Number
                ctx.save();
                applyTextAnimCtx(ctx, 0.10, canvas.width - 100, canvas.height - 120);
                ctx.textAlign = 'right';
                ctx.font = '900 italic 147px "Montserrat", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillText(`#${5 - currentPreviewIndex}`, canvas.width - 100 + slideX, canvas.height - 120);
                ctx.restore();

            } else if (theme === 'TOP 5 ARTISTE') {
                const item = top5Items[currentPreviewIndex];
                const baseY = 1540;
                const itemX = 57 + slideX;

                if (item.photo) {
                    let photoImg: HTMLImageElement | null = null;
                    if (imageCacheRef.current[item.photo]) {
                        photoImg = imageCacheRef.current[item.photo];
                    } else {
                        const imgObj = new Image();
                        imgObj.src = item.photo;
                        imgObj.onload = () => { 
                            imageCacheRef.current[item.photo!] = imgObj;
                            generateImage(); 
                        };
                        photoImg = null;
                    }

                    if (photoImg && (photoImg.complete || photoImg.width > 0)) {
                        ctx.save();
                        applyTextAnimCtx(ctx, 0.10, itemX + 160, baseY - 450 + 160);
                        ctx.shadowColor = 'rgba(0,0,0,0.5)';
                        ctx.shadowBlur = 30;
                        const size = 320;
                        const photoY = baseY - 450;
                        // Rounded corners for the cover
                        ctx.beginPath();
                        ctx.roundRect(itemX, photoY, size, size, 40);
                        ctx.clip();
                        ctx.drawImage(photoImg, itemX, photoY, size, size);
                        ctx.restore();
                    }
                }

                ctx.save();
                applyTextAnimCtx(ctx, 0.18, itemX + 200, baseY);
                ctx.textAlign = 'left';
                ctx.fillStyle = '#ffffff';
                ctx.font = '900 italic 49px "Montserrat", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 10;
                ctx.fillText(`${item.main.toUpperCase()} - ${item.sub.toUpperCase()}`, itemX, baseY);
                const barWidth = 966; const barHeight = 90; const barX = 57; const barY = baseY + 45;
                ctx.fillStyle = `rgba(${activeData.grad}, 0.4)`;
                ctx.fillRect(barX - 10 + slideX, barY - 10, barWidth + 20, barHeight + 20);
                ctx.fillStyle = activeData.color;
                ctx.fillRect(barX + slideX, barY, barWidth, barHeight);
                ctx.fillStyle = '#000'; // Black text on yellow bar
                ctx.font = '900 italic 43px "Montserrat", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(`${item.value.toUpperCase()} MILLIONS D'ÉCOUTES`, barX + 30 + slideX, barY + 60);
                ctx.restore();

                ctx.save();
                applyTextAnimCtx(ctx, 0.10, canvas.width - 100, canvas.height - 120);
                ctx.textAlign = 'right';
                ctx.font = '900 italic 117px "Montserrat", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillText(`#${5 - currentPreviewIndex}`, canvas.width - 100 + slideX, canvas.height - 120); 
                ctx.restore(); 



            } else if (theme === 'LIVESTREAM') {
                const centerX = canvas.width / 2;
                const centerY = (canvas.height / 2);

                // 1. Background Enhancement: Elegant dark vignette and soft color wash
                const vignetteGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, canvas.width);
                vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
                vignetteGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
                ctx.fillStyle = vignetteGrad;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = `rgba(${activeData.grad}, 0.15)`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 2. The "LIVE" Indicator (Ultra minimal)
                ctx.save();
                const badgeY = effectiveTab === 'PUBLICATION' ? 140 : 280;

                const pulse = (Math.sin(Date.now() / 400) + 1) / 2;

                // Red glowing dot
                ctx.beginPath();
                ctx.arc(centerX - 95, badgeY, 6 + (pulse * 2), 0, Math.PI * 2);
                ctx.fillStyle = '#ff0033';
                ctx.shadowColor = '#ff0033';
                ctx.shadowBlur = 15;
                ctx.fill();

                // Text "EN DIRECT"
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#fff';
                ctx.font = '600 24px "Montserrat", sans-serif';
                ctx.letterSpacing = "8px";
                ctx.shadowBlur = 0;
                ctx.fillText('EN DIRECT', centerX - 70, badgeY);
                ctx.restore();

                // 3. MAIN TITLE: "TAKEOVER" (Sleek, Wide, High-End)
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const takeoverY = centerY - 50;

                ctx.fillStyle = '#fff';
                ctx.shadowColor = `rgba(${activeData.grad}, 0.6)`;
                ctx.shadowBlur = 30;

                ctx.font = '900 110px "Montserrat", sans-serif';
                ctx.letterSpacing = "12px";
                ctx.fillText('LIVESTREAM', centerX + 6, takeoverY); // offset for letterSpacing centering
                ctx.restore();

                // 4. DECORATIVE LINE (Always visible)
                const infoY = centerY + 80;
                const lineW = 300;
                const gradLine = ctx.createLinearGradient(centerX - lineW, 0, centerX + lineW, 0);
                gradLine.addColorStop(0, 'rgba(255,255,255,0)');
                gradLine.addColorStop(0.5, `rgb(${activeData.grad})`);
                gradLine.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = gradLine;
                ctx.fillRect(centerX - lineW, infoY, lineW * 2, 2);

                // 5. INFO SECTION (Minimalist floating typography)
                if (customText) {
                    const lines = customText.split('\n').filter(l => l.trim() !== '');
                    const mainInfo = lines[0]?.toUpperCase() || '';
                    const subInfo = lines[1]?.toUpperCase() || '';
                    const extraInfo = lines[2]?.toUpperCase() || '';

                    ctx.save();

                    // Texts
                    ctx.textAlign = 'center';

                    // Main Info
                    ctx.fillStyle = '#fff';
                    ctx.font = '800 italic 45px "Montserrat", sans-serif';
                    ctx.letterSpacing = "4px";
                    ctx.fillText(mainInfo, centerX + 2, infoY + 60);

                    // Sub Info
                    if (subInfo) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                        ctx.font = '500 italic 30px "Montserrat", sans-serif';
                        ctx.letterSpacing = "10px";
                        ctx.fillText(subInfo, centerX + 5, infoY + 115);
                    }

                    // Extra Info
                    if (extraInfo) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                        ctx.font = '400 italic 22px "Montserrat", sans-serif';
                        ctx.letterSpacing = "12px";
                        ctx.fillText(extraInfo, centerX + 6, infoY + 160);
                    }
                    ctx.restore();
                }

                // 5. BOTTOM NAVIGATION BAR (No background, just elegant floating text)
                ctx.save();
                const footerY = canvas.height - 100;

                ctx.font = '500 24px "Montserrat", sans-serif';
                ctx.letterSpacing = "4px";
                ctx.textAlign = 'center';

                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                const textPart1 = "RENDEZ-VOUS SUR ";
                const textPart2 = "DROPSIDERS.FR/LIVE";

                const w1 = ctx.measureText(textPart1).width;
                const w2 = ctx.measureText(textPart2).width;
                const totalW = w1 + w2;
                const startX = centerX - totalW / 2;

                ctx.textAlign = 'left';
                ctx.fillText(textPart1, startX, footerY);

                ctx.fillStyle = '#fff';
                ctx.fillText(textPart2, startX + w1, footerY);

                // Clean accent line under the link
                ctx.fillStyle = `rgb(${activeData.grad})`;
                ctx.fillRect(startX + w1, footerY + 15, w2, 2);

                ctx.restore();
                        

} else if (theme === 'PLANNING') {
                const centerX = canvas.width / 2;
                const isStory = effectiveTab === 'REEL';
                const monthColor = activeData.color || '#ff3700';
                const monthGrad = activeData.grad || '255, 55, 0';

                const renderAgendaSlide1 = (sCtx: CanvasRenderingContext2D, offsetX: number = 0, alpha: number = 1.0) => {
                    sCtx.save();
                    if (alpha < 1) sCtx.globalAlpha *= alpha;
                    if (offsetX !== 0) sCtx.translate(offsetX, 0);
                    const ctx = sCtx;

                    // 1. TOP-LEFT BADGE (Cyber capsule assortie à la couleur du mois)
                    ctx.save();
                    const badgeX = 65;
                    const badgeY = isStory ? 90 : 65;
                    const badgeText = (agendaCoverBadge || agendaBadgeText || 'AGENDA FESTIVALS & SOIRÉES').toUpperCase().trim();

                    let badgeFontSize = 13;
                    let letterSpacing = '3px';
                    if (badgeText.length <= 8) {
                        badgeFontSize = 18;
                        letterSpacing = '5px';
                    } else if (badgeText.length <= 14) {
                        badgeFontSize = 15;
                        letterSpacing = '4px';
                    } else if (badgeText.length <= 22) {
                        badgeFontSize = 12.5;
                        letterSpacing = '2.5px';
                    } else {
                        badgeFontSize = 11;
                        letterSpacing = '1.5px';
                    }

                    ctx.font = `900 italic ${badgeFontSize}px "Orbitron", sans-serif`;
                    ctx.letterSpacing = letterSpacing;
                    const textWidth = ctx.measureText(badgeText).width;
                    const pillPadding = 34;
                    const pillW = Math.max(180, Math.ceil(textWidth + pillPadding));
                    const pillH = 46;

                    const pillCenterX = badgeX + pillW / 2;
                    const pillCenterY = badgeY + pillH / 2;
                    applyTextAnimCtx(ctx, 0.05, pillCenterX, pillCenterY);
                    ctx.translate(pillCenterX, pillCenterY);
                    ctx.rotate(-0.04);
                    ctx.translate(-pillCenterX, -pillCenterY);

                    // Cyber Box Glow & Fill
                    ctx.shadowColor = `rgba(${monthGrad}, 0.75)`;
                    ctx.shadowBlur = 18;
                    ctx.fillStyle = 'rgba(12, 6, 4, 0.92)';
                    ctx.strokeStyle = monthColor;
                    ctx.lineWidth = 2.5;

                    ctx.beginPath();
                    ctx.roundRect(badgeX, badgeY, pillW, pillH, 10);
                    ctx.fill();
                    ctx.stroke();

                    // Notches cyber
                    ctx.strokeStyle = monthColor;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(badgeX - 14, badgeY + pillH / 2);
                    ctx.lineTo(badgeX - 4, badgeY + pillH / 2);
                    ctx.moveTo(badgeX + pillW + 4, badgeY + pillH / 2);
                    ctx.lineTo(badgeX + pillW + 14, badgeY + pillH / 2);
                    ctx.stroke();

                    // Inner text
                    ctx.shadowColor = `rgba(${monthGrad}, 0.85)`;
                    ctx.shadowBlur = 12;
                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = `900 italic ${badgeFontSize}px "Orbitron", sans-serif`;
                    ctx.letterSpacing = letterSpacing;
                    ctx.fillText(badgeText, badgeX + pillW / 2 + 1, badgeY + pillH / 2 + 1);
                    ctx.restore();

                    // 2. HERO COVER HOOK
                    const centerY = canvas.height / 2;

                    // A) Top Month / Tag (remplace DROPSIDERS 2026 par le mois)
                    const monthName = (agendaMonth || 'OCTOBRE').toUpperCase().trim();
                    const tagYear = (agendaCoverYear || '').trim();
                    const tagText = tagYear && !monthName.includes(tagYear)
                        ? `${monthName} • ${tagYear}`
                        : monthName;
                    const tagY = centerY - (isStory ? 220 : 160);

                    ctx.save();
                    applyTextAnimCtx(ctx, 0.16, centerX, tagY);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = `900 20px "Orbitron", sans-serif`;
                    ctx.letterSpacing = '5px';
                    ctx.shadowColor = `rgba(${monthGrad}, 0.85)`;
                    ctx.shadowBlur = 16;
                    ctx.fillStyle = monthColor;
                    ctx.fillText(tagText, centerX, tagY);

                    // Lignes néon fines à gauche et droite du tag
                    const tagMeasureW = ctx.measureText(tagText).width;
                    const lineW = isStory ? 80 : 60;
                    const lineGap = 20;

                    const leftGrad = ctx.createLinearGradient(centerX - tagMeasureW / 2 - lineGap - lineW, 0, centerX - tagMeasureW / 2 - lineGap, 0);
                    leftGrad.addColorStop(0, 'rgba(255, 55, 0, 0)');
                    leftGrad.addColorStop(1, monthColor);
                    ctx.strokeStyle = leftGrad;
                    ctx.lineWidth = isStory ? 3.5 : 2.5;
                    ctx.beginPath();
                    ctx.moveTo(centerX - tagMeasureW / 2 - lineGap - lineW, tagY);
                    ctx.lineTo(centerX - tagMeasureW / 2 - lineGap, tagY);
                    ctx.stroke();

                    const rightGrad = ctx.createLinearGradient(centerX + tagMeasureW / 2 + lineGap, 0, centerX + tagMeasureW / 2 + lineGap + lineW, 0);
                    rightGrad.addColorStop(0, monthColor);
                    rightGrad.addColorStop(1, 'rgba(255, 55, 0, 0)');
                    ctx.strokeStyle = rightGrad;
                    ctx.beginPath();
                    ctx.moveTo(centerX + tagMeasureW / 2 + lineGap, tagY);
                    ctx.lineTo(centerX + tagMeasureW / 2 + lineGap + lineW, tagY);
                    ctx.stroke();
                    ctx.restore();

                    // B) Grand Hook Principal
                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const rawTitle = (agendaCoverTitle || 'ON VA OÙ CE MOIS-CI ?').toUpperCase().trim();
                    
                    let titleLines: string[] = [];
                    if (rawTitle.includes('\n')) {
                        titleLines = rawTitle.split('\n').map(l => l.trim()).filter(Boolean);
                    } else if (rawTitle.length > 18 && rawTitle.includes(' ')) {
                        const words = rawTitle.split(' ');
                        const mid = Math.ceil(words.length / 2);
                        titleLines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
                    } else {
                        titleLines = [rawTitle];
                    }

                    let titleFontSize = isStory 
                        ? (titleLines.length > 2 ? 80 : (titleLines.length === 2 ? 105 : 120))
                        : (titleLines.length > 2 ? 58 : (titleLines.length === 2 ? 76 : 88));
                    ctx.font = `900 italic ${titleFontSize}px "Montserrat", Arial, sans-serif`;
                    ctx.letterSpacing = '2px';
                    titleLines.forEach(l => {
                        while (ctx.measureText(l).width > (canvas.width - 100) && titleFontSize > 36) {
                            titleFontSize -= 2;
                            ctx.font = `900 italic ${titleFontSize}px "Montserrat", Arial, sans-serif`;
                        }
                    });

                    const titleLineHeight = titleFontSize * 1.16;
                    const titleBlockHeight = titleLines.length * titleLineHeight;
                    const titleStartY = centerY - 10 - ((titleLines.length - 1) * titleLineHeight) / 2;

                    titleLines.forEach((line, idx) => {
                        const lineY = titleStartY + idx * titleLineHeight;
                        ctx.save();
                        applyTextAnimCtx(ctx, 0.30 + idx * 0.12, centerX, lineY);
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                        ctx.shadowBlur = 28;
                        ctx.shadowOffsetX = 3;
                        ctx.shadowOffsetY = 4;
                        ctx.fillStyle = '#ffffff';
                        ctx.fillText(line, centerX, lineY);
                        ctx.restore();
                    });
                    ctx.restore();

                    // C) Subtitle / Genres Musicaux
                    const genresText = (agendaCoverGenres || 'HARD TECHNO • RAWSTYLE • MULTI-GENRES').toUpperCase().trim();
                    if (genresText) {
                        let genresFontSize = isStory ? 28 : 20;
                        ctx.font = `800 ${genresFontSize}px "Montserrat", Arial, sans-serif`;
                        ctx.letterSpacing = isStory ? '3.5px' : '3px';
                        while (ctx.measureText(genresText).width > (canvas.width - 140) && genresFontSize > 14) {
                            genresFontSize -= 1;
                            ctx.font = `800 ${genresFontSize}px "Montserrat", Arial, sans-serif`;
                        }

                        const genresW = ctx.measureText(genresText).width;
                        const genresPillW = Math.min(canvas.width - 60, genresW + (isStory ? 64 : 48));
                        const genresPillH = isStory ? 58 : 46;
                        const genresY = titleStartY + titleBlockHeight / 2 + (isStory ? (titleLines.length > 1 ? 88 : 72) : (titleLines.length > 1 ? 55 : 45));

                        ctx.save();
                        applyTextAnimCtx(ctx, 0.48, centerX, genresY);
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                        ctx.shadowBlur = 14;
                        ctx.fillStyle = 'rgba(15, 12, 10, 0.82)';
                        ctx.strokeStyle = `rgba(${monthGrad}, 0.55)`;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.roundRect(centerX - genresPillW / 2, genresY - genresPillH / 2, genresPillW, genresPillH, 14);
                        ctx.fill();
                        ctx.stroke();

                        ctx.shadowColor = 'transparent';
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                        ctx.fillText(genresText, centerX, genresY + 1);
                        ctx.restore();
                    }

                    // 3. BOTTOM CTA SWIPE
                    const ctaText = (agendaCoverCta || 'Les meilleurs events et coups de cœur du mois rassemblés en un post ➡️').trim();
                    if (ctaText) {
                        const ctaY = canvas.height - (isStory ? 170 : 95);

                        let ctaFontSize = 18;
                        ctx.font = `800 italic ${ctaFontSize}px "Montserrat", Arial, sans-serif`;
                        ctx.letterSpacing = '1px';
                        while (ctx.measureText(ctaText).width > 880 && ctaFontSize > 12) {
                            ctaFontSize -= 0.5;
                            ctx.font = `800 italic ${ctaFontSize}px "Montserrat", Arial, sans-serif`;
                        }

                        const ctaW = ctx.measureText(ctaText).width;
                        const ctaPillW = Math.min(canvas.width - 80, ctaW + 52);
                        const ctaPillH = 50;

                        ctx.save();
                        applyTextAnimCtx(ctx, 0.62, centerX, ctaY);
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.shadowColor = `rgba(${monthGrad}, 0.4)`;
                        ctx.shadowBlur = 16;
                        ctx.fillStyle = 'rgba(12, 8, 6, 0.88)';
                        ctx.strokeStyle = monthColor;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.roundRect(centerX - ctaPillW / 2, ctaY - ctaPillH / 2, ctaPillW, ctaPillH, 14);
                        ctx.fill();
                        ctx.stroke();

                        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                        ctx.shadowBlur = 6;
                        ctx.fillStyle = '#ffffff';
                        ctx.fillText(ctaText, centerX, ctaY + 1);
                        ctx.restore();
                    }

                    sCtx.restore();
                };

                const renderAgendaSlide2 = (sCtx: CanvasRenderingContext2D, offsetX: number = 0, alpha: number = 1.0) => {
                    sCtx.save();
                    if (alpha < 1) sCtx.globalAlpha *= alpha;
                    if (offsetX !== 0) sCtx.translate(offsetX, 0);
                    const ctx = sCtx;

                    // 1. TOP-LEFT BADGE (Cyber capsule)
                    ctx.save();
                    const badgeX = 65;
                    const badgeY = isStory ? 90 : 65;
                    const badgeText = (agendaBadgeText || 'AGENDA DU MOIS').toUpperCase().trim();

                    let badgeFontSize = 13;
                    let letterSpacing = '3px';
                    if (badgeText.length <= 8) {
                        badgeFontSize = 18;
                        letterSpacing = '5px';
                    } else if (badgeText.length <= 14) {
                        badgeFontSize = 15;
                        letterSpacing = '4px';
                    } else if (badgeText.length <= 22) {
                        badgeFontSize = 12.5;
                        letterSpacing = '2.5px';
                    } else {
                        badgeFontSize = 11;
                        letterSpacing = '1.5px';
                    }

                    ctx.font = `900 italic ${badgeFontSize}px "Orbitron", sans-serif`;
                    ctx.letterSpacing = letterSpacing;
                    const textWidth = ctx.measureText(badgeText).width;
                    const pillPadding = 34;
                    const pillW = Math.max(180, Math.ceil(textWidth + pillPadding));
                    const pillH = 46;

                    const pillCenterX = badgeX + pillW / 2;
                    const pillCenterY = badgeY + pillH / 2;
                    applyTextAnimCtx(ctx, 0.05, pillCenterX, pillCenterY);
                    ctx.translate(pillCenterX, pillCenterY);
                    ctx.rotate(-0.04);
                    ctx.translate(-pillCenterX, -pillCenterY);

                    ctx.shadowColor = `rgba(${monthGrad}, 0.75)`;
                    ctx.shadowBlur = 18;
                    ctx.fillStyle = 'rgba(12, 6, 4, 0.92)';
                    ctx.strokeStyle = monthColor;
                    ctx.lineWidth = 2.5;

                    ctx.beginPath();
                    ctx.roundRect(badgeX, badgeY, pillW, pillH, 10);
                    ctx.fill();
                    ctx.stroke();

                    ctx.strokeStyle = monthColor;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(badgeX - 14, badgeY + pillH / 2);
                    ctx.lineTo(badgeX - 4, badgeY + pillH / 2);
                    ctx.moveTo(badgeX + pillW + 4, badgeY + pillH / 2);
                    ctx.lineTo(badgeX + pillW + 14, badgeY + pillH / 2);
                    ctx.stroke();

                    ctx.shadowColor = `rgba(${monthGrad}, 0.85)`;
                    ctx.shadowBlur = 12;
                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = `900 italic ${badgeFontSize}px "Orbitron", sans-serif`;
                    ctx.letterSpacing = letterSpacing;
                    ctx.fillText(badgeText, badgeX + pillW / 2 + 1, badgeY + pillH / 2 + 1);
                    ctx.restore();

                    // 2. GRAND TITRE DU MOIS EN CONTOUR NÉON CREUX (Style Rave Hollow, sans blanc)
                    const monthY = isStory ? 370 : 280;
                    const monthText = (agendaMonth || 'OCTOBRE').toUpperCase().trim();

                    let monthFontSize = isStory ? 104 : 92;
                    ctx.font = `900 ${monthFontSize}px "Montserrat", Arial, sans-serif`;
                    ctx.letterSpacing = '6px';
                    while (ctx.measureText(monthText).width > (canvas.width - 160) && monthFontSize > 44) {
                        monthFontSize -= 2;
                        ctx.font = `900 ${monthFontSize}px "Montserrat", Arial, sans-serif`;
                    }

                    ctx.save();
                    applyTextAnimCtx(ctx, 0.18, centerX, monthY);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = `900 ${monthFontSize}px "Montserrat", Arial, sans-serif`;
                    ctx.letterSpacing = '6px';

                    // A) Ombre noire profonde derrière pour détacher le contour du fond
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                    ctx.shadowBlur = 18;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 4;
                    ctx.strokeStyle = monthColor;
                    ctx.lineWidth = isStory ? 6 : 5;
                    ctx.strokeText(monthText, centerX, monthY);

                    // B) Halo néon vibrant dans la couleur du thème
                    ctx.shadowColor = `rgba(${monthGrad}, 0.90)`;
                    ctx.shadowBlur = 20;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    ctx.strokeStyle = monthColor;
                    ctx.lineWidth = isStory ? 5 : 4;
                    ctx.strokeText(monthText, centerX, monthY);

                    // C) Contour net de précision (ultra-propre, creux à l'intérieur)
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                    ctx.strokeStyle = monthColor;
                    ctx.lineWidth = isStory ? 3.5 : 2.8;
                    ctx.strokeText(monthText, centerX, monthY);

                    ctx.restore();

                    // 3. EVENTS LIST
                    const itemsToDraw = planningItems.slice(0, isStory ? 8 : 7);
                    const listStartY = isStory ? 570 : 440;
                    const bottomMargin = isStory ? 120 : 70;
                    const availableHeight = canvas.height - listStartY - bottomMargin;
                    let rowSpacing = Math.min(
                        isStory ? 180 : 140,
                        Math.floor(availableHeight / Math.max(1, itemsToDraw.length))
                    );
                    if (itemsToDraw.length <= 4 && itemsToDraw.length > 0) {
                        rowSpacing = isStory ? 170 : 138;
                    }

                    if (itemsToDraw.length === 0) {
                        ctx.save();
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                        ctx.font = '700 italic 24px "Montserrat", sans-serif';
                        ctx.fillText("Aucun événement renseigné — ajoutez vos dates dans le panneau latéral", centerX, listStartY + 100);
                        ctx.restore();
                    } else {
                        itemsToDraw.forEach((item, i) => {
                            const rowY = listStartY + (i * rowSpacing);
                            if (rowY > canvas.height - 60) return;

                            const itemDelay = 0.28 + (i * 0.10);

                            const dayText = (item.day || item.time || 'VENDREDI').toUpperCase().trim();
                            const titleText = (item.title || item.artist || 'ÉVÉNEMENT').toUpperCase().trim();
                            const artistsText = (item.artists || '').trim();
                            const genreText = (item.genre || '').trim();
                            const venueText = (item.venue || '').toUpperCase().trim();

                            // A) Left sticker badge for Day
                            ctx.save();
                            ctx.font = '900 italic 20px "Montserrat", sans-serif';
                            const dayMeasureW = ctx.measureText(dayText).width;
                            const badgeW = Math.max(125, Math.min(185, dayMeasureW + 36));
                            const badgeH = 42;
                            const badgeXCenter = 75 + badgeW / 2;
                            
                            applyTextAnimCtx(ctx, itemDelay, badgeXCenter, rowY);

                            const stickerAngle = (i % 2 === 0 ? -0.04 : -0.025);
                            ctx.translate(badgeXCenter, rowY);
                            ctx.rotate(stickerAngle);

                            ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                            ctx.shadowBlur = 14;
                            ctx.shadowOffsetX = 3;
                            ctx.shadowOffsetY = 4;

                            ctx.fillStyle = '#ff3700';
                            ctx.beginPath();
                            ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 6);
                            ctx.fill();

                            ctx.shadowColor = 'transparent';
                            ctx.fillStyle = '#000000';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.font = '900 italic 20px "Montserrat", sans-serif';
                            ctx.letterSpacing = '1.2px';
                            ctx.fillText(dayText, 0, 1);
                            ctx.restore();

                            // B) Right content block
                            ctx.save();
                            const contentX = badgeXCenter + badgeW / 2 + 28;
                            const maxContentW = canvas.width - contentX - 55;
                            applyTextAnimCtx(ctx, itemDelay + 0.04, contentX + (maxContentW / 3), rowY);
                            ctx.textAlign = 'left';
                            ctx.textBaseline = 'middle';

                            const hasArtists = Boolean(artistsText);
                            const hasDetails = Boolean(genreText || venueText);

                            let titleY = rowY;
                            let artistsY = rowY;
                            let subY = rowY;

                            if (hasArtists && hasDetails) {
                                titleY = rowY - (rowSpacing > 130 ? 24 : 20);
                                artistsY = rowY + (rowSpacing > 130 ? 4 : 2);
                                subY = rowY + (rowSpacing > 130 ? 29 : 23);
                            } else if (hasArtists || hasDetails) {
                                titleY = rowY - 14;
                                artistsY = rowY + 16;
                                subY = rowY + 16;
                            } else {
                                titleY = rowY;
                            }

                            ctx.fillStyle = '#ffffff';
                            const baseTitleSize = (hasArtists || hasDetails) ? 27 : 29;
                            ctx.font = `900 ${baseTitleSize}px "Montserrat", sans-serif`;
                            ctx.letterSpacing = '0.5px';
                            ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                            ctx.shadowBlur = 12;

                            let displayTitle = titleText;
                            if (ctx.measureText(displayTitle).width > maxContentW) {
                                let fs = baseTitleSize;
                                while (ctx.measureText(displayTitle).width > maxContentW && fs > 18) {
                                    fs--;
                                    ctx.font = `900 ${fs}px "Montserrat", sans-serif`;
                                }
                            }
                            ctx.fillText(displayTitle, contentX, titleY);

                            if (hasArtists) {
                                ctx.font = '700 18px "Montserrat", sans-serif';
                                ctx.letterSpacing = '0px';
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
                                ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
                                ctx.shadowBlur = 8;
                                
                                let displayArtists = artistsText;
                                if (ctx.measureText(displayArtists).width > maxContentW) {
                                    while (ctx.measureText(displayArtists + '...').width > maxContentW && displayArtists.length > 5) {
                                        displayArtists = displayArtists.slice(0, -1);
                                    }
                                    displayArtists += '...';
                                }
                                ctx.fillText(displayArtists, contentX, artistsY);
                            }

                            if (hasDetails) {
                                const targetLineY = hasArtists ? subY : artistsY;
                                ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
                                ctx.shadowBlur = 8;
                                let curLineX = contentX;

                                if (genreText) {
                                    ctx.font = '600 16px "Montserrat", sans-serif';
                                    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
                                    ctx.fillText(genreText, curLineX, targetLineY);
                                    curLineX += ctx.measureText(genreText).width;
                                }

                                if (genreText && venueText) {
                                    ctx.font = '600 16px "Montserrat", sans-serif';
                                    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                                    ctx.fillText(' | ', curLineX, targetLineY);
                                    curLineX += ctx.measureText(' | ').width;
                                }

                                if (venueText) {
                                    ctx.font = '900 17px "Montserrat", sans-serif';
                                    ctx.fillStyle = '#ff3700';
                                    ctx.shadowColor = 'rgba(255, 55, 0, 0.6)';
                                    ctx.shadowBlur = 10;
                                    ctx.fillText(venueText, curLineX, targetLineY);
                                }
                            }

                            ctx.restore();
                        });
                    }

                    sCtx.restore();
                };

                if (transitionTargetRef.current === 'SLIDE_1_TO_2') {
                    const p = effectiveTransitionProgress;
                    const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
                    if (slideTransition === 'SLIDE') {
                        renderAgendaSlide1(ctx, -ease * canvas.width, 1.0);
                        renderAgendaSlide2(ctx, (1 - ease) * canvas.width, 1.0);
                    } else if (slideTransition === 'FADE') {
                        renderAgendaSlide1(ctx, 0, Math.max(0, 1 - p));
                        renderAgendaSlide2(ctx, 0, Math.min(1, p));
                    } else if (slideTransition === 'ZOOM') {
                        ctx.save();
                        const s1 = 1 + ease * 0.12;
                        ctx.translate(centerX, canvas.height / 2);
                        ctx.scale(s1, s1);
                        ctx.translate(-centerX, -canvas.height / 2);
                        renderAgendaSlide1(ctx, 0, Math.max(0, 1 - p));
                        ctx.restore();

                        ctx.save();
                        const s2 = 0.88 + ease * 0.12;
                        ctx.translate(centerX, canvas.height / 2);
                        ctx.scale(s2, s2);
                        ctx.translate(-centerX, -canvas.height / 2);
                        renderAgendaSlide2(ctx, 0, Math.min(1, p));
                        ctx.restore();
                    } else if (slideTransition === 'GLITCH') {
                        const shake1 = Math.sin(p * 45) * (1 - p) * 32;
                        const shake2 = Math.sin(p * 45) * p * 32;
                        renderAgendaSlide1(ctx, shake1, Math.max(0, 1 - p));
                        renderAgendaSlide2(ctx, shake2, Math.min(1, p));
                    } else {
                        if (p < 0.5) renderAgendaSlide1(ctx, 0, 1);
                        else renderAgendaSlide2(ctx, 0, 1);
                    }
                } else if (transitionTargetRef.current === 'SLIDE_2_TO_PROMO') {
                    const p = effectiveTransitionProgress;
                    const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
                    if (slideTransition === 'SLIDE') {
                        renderAgendaSlide2(ctx, -ease * canvas.width, 1.0);
                        renderPromoOutro(ctx, (1 - ease) * canvas.width, 1.0);
                    } else if (slideTransition === 'FADE') {
                        renderAgendaSlide2(ctx, 0, Math.max(0, 1 - p));
                        renderPromoOutro(ctx, 0, Math.min(1, p));
                    } else if (slideTransition === 'ZOOM') {
                        ctx.save();
                        const s1 = 1 + ease * 0.12;
                        ctx.translate(centerX, canvas.height / 2);
                        ctx.scale(s1, s1);
                        ctx.translate(-centerX, -canvas.height / 2);
                        renderAgendaSlide2(ctx, 0, Math.max(0, 1 - p));
                        ctx.restore();

                        ctx.save();
                        const s2 = 0.88 + ease * 0.12;
                        ctx.translate(centerX, canvas.height / 2);
                        ctx.scale(s2, s2);
                        ctx.translate(-centerX, -canvas.height / 2);
                        renderPromoOutro(ctx, 0, Math.min(1, p));
                        ctx.restore();
                    } else if (slideTransition === 'GLITCH') {
                        const shake1 = Math.sin(p * 45) * (1 - p) * 32;
                        const shake2 = Math.sin(p * 45) * p * 32;
                        renderAgendaSlide2(ctx, shake1, Math.max(0, 1 - p));
                        renderPromoOutro(ctx, shake2, Math.min(1, p));
                    } else {
                        if (p < 0.5) renderAgendaSlide2(ctx, 0, 1);
                        else renderPromoOutro(ctx, 0, 1);
                    }
                } else {
                    if (effectiveAgendaSlide === 1) {
                        if (effectiveTransitionProgress > 0) {
                            const p = effectiveTransitionProgress;
                            const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
                            if (slideTransition === 'SLIDE') {
                                renderAgendaSlide1(ctx, -ease * canvas.width, 1.0);
                                renderAgendaSlide2(ctx, (1 - ease) * canvas.width, 1.0);
                            } else if (slideTransition === 'FADE') {
                                renderAgendaSlide1(ctx, 0, Math.max(0, 1 - p));
                                renderAgendaSlide2(ctx, 0, Math.min(1, p));
                            } else {
                                renderAgendaSlide1(ctx, 0, 1.0);
                            }
                        } else {
                            renderAgendaSlide1(ctx, 0, 1.0);
                        }
                    } else {
                        renderAgendaSlide2(ctx, 0, 1.0);
                    }
                }

            } else if (theme === 'CALENDRIER') {
                const calCenterX = canvas.width / 2;
                const calTopY = effectiveTab === 'PUBLICATION' ? 280 : 580;

                ctx.save();
                applyTextAnimCtx(ctx, 0.10, calCenterX, calTopY);
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 20;

                // Title
                ctx.textAlign = 'center';
                ctx.fillStyle = '#c026d3';
                ctx.font = '900 italic 60px "Montserrat", sans-serif';
                ctx.letterSpacing = '8px';
                ctx.fillText('📅  ' + (calendarMonth || 'CALENDRIER').toUpperCase(), calCenterX, calTopY);

                // Divider line
                ctx.fillStyle = 'rgba(192,38,211,0.4)';
                ctx.fillRect(calCenterX - 420, calTopY + 30, 840, 2);
                ctx.restore();

                // Event cards
                const cardStartY = calTopY + 70;
                const cardH = effectiveTab === 'PUBLICATION' ? 80 : 100;
                const cardGap = effectiveTab === 'PUBLICATION' ? 12 : 16;
                const cardPadX = 57;

                calendarEvents.forEach((evt, i) => {
                    const cardY = cardStartY + i * (cardH + cardGap);
                    if (cardY + cardH > canvas.height - 120) return;

                    // Card background
                    ctx.save();
                    applyTextAnimCtx(ctx, 0.22 + i * 0.10, calCenterX, cardY + cardH / 2);
                    ctx.fillStyle = 'rgba(0,0,0,0.45)';
                    ctx.beginPath();
                    ctx.roundRect(cardPadX, cardY, canvas.width - cardPadX * 2, cardH, 18);
                    ctx.fill();

                    // Left magenta accent bar
                    ctx.fillStyle = '#c026d3';
                    ctx.beginPath();
                    ctx.roundRect(cardPadX, cardY, 8, cardH, [18, 0, 0, 18]);
                    ctx.fill();

                    // Date badge (circle)
                    const circleX = cardPadX + 55;
                    const circleY = cardY + cardH / 2;
                    ctx.fillStyle = 'rgba(192,38,211,0.85)';
                    ctx.beginPath();
                    ctx.arc(circleX, circleY, 32, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#fff';
                    ctx.font = '900 28px "Montserrat", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.letterSpacing = '0px';
                    ctx.fillText(evt.date, circleX, circleY + 2);

                    // Event label
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#ffffff';
                    ctx.font = `900 italic ${effectiveTab === 'PUBLICATION' ? 34 : 40}px "Montserrat", sans-serif`;
                    ctx.letterSpacing = '-1px';
                    ctx.shadowColor = 'rgba(0,0,0,0.8)';
                    ctx.shadowBlur = 10;

                    const labelX = circleX + 52;
                    const maxLabelW = canvas.width - cardPadX * 2 - 120;
                    let labelText = evt.label.toUpperCase();
                    let fs = effectiveTab === 'PUBLICATION' ? 34 : 40;
                    while (ctx.measureText(labelText).width > maxLabelW && fs > 18) {
                        fs--;
                        ctx.font = `900 italic ${fs}px "Montserrat", sans-serif`;
                    }
                    ctx.fillText(labelText, labelX, cardY + cardH / 2 + 2);
                    ctx.restore();
                });

                // Footer
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillStyle = 'rgba(192,38,211,0.7)';
                ctx.font = '900 italic 22px "Montserrat", sans-serif';
                ctx.letterSpacing = '4px';
                ctx.fillText('DROPSIDERS.FR', calCenterX, canvas.height - 40);
                ctx.restore();

            } else if (theme === 'TRACKLIST') {
                // Charte V2 : Capsule Badge en haut à gauche [ • TRACKLIST ]
                drawTopCapsuleBadge('TRACKLIST', activeData.color || '#ff7800', activeData.grad || '255, 120, 0');

                if (customText) {
                    const lines = customText.split('\n');
                    
                    const maxWidth = 966; // Max horizontal width before shrinking
                    
                    const getFontSize = (text: string, base: number) => {
                        ctx.font = `900 ${base}px "Montserrat", sans-serif`;
                        const width = ctx.measureText(text).width;
                        if (width > maxWidth) {
                            return Math.floor(base * (maxWidth / width));
                        }
                        return base;
                    };

                    const texts = [
                        { text: (lines[0] || '').toUpperCase(), size: 90, color: activeData.color || '#ff7800' },
                        { text: (lines[1] || '').toUpperCase(), size: 60, color: '#ffffff' },
                        { text: (lines[2] || '').toUpperCase(), size: 36, color: '#ffffff', isOrbitron: true },
                    ];

                    ctx.save();
                    ctx.textAlign = 'center';
                    
                    // Animation logic: Entrée au début puis reste fixe
                    const elapsed = (isVideoRecording || (bgVideo && !isDownloading))
                        ? (Date.now() - animStartTimeRef.current) / 1000
                        : 99.0;
                    
                    let currY = 1480; 

                    texts.forEach((item, i) => {
                        ctx.save();
                        const dynamicSize = getFontSize(item.text, item.size);
                        ctx.font = item.isOrbitron ? `900 ${dynamicSize}px "Orbitron", sans-serif` : `900 ${dynamicSize}px "Montserrat", sans-serif`;
                        ctx.fillStyle = item.color;
                        ctx.shadowColor = 'rgba(0,0,0,0.8)';
                        ctx.shadowBlur = 15;
                        ctx.shadowOffsetY = 4;
                        if (item.isOrbitron) ctx.letterSpacing = '10px';
                        else ctx.letterSpacing = '0px';
                        
                        let yPos = currY + (i * 85);
                        if (item.isOrbitron) yPos -= 5; 
                        
                        let xOff = 0;
                        let yOff = 0;
                        let alpha = 1;

                        const duration = 0.8;
                        const delay = i * 0.2;
                        const t = Math.max(0, Math.min(1, (elapsed - delay) / duration));
                        const ease = 1 - Math.pow(1 - t, 3); // Ease out cubic

                        if (i === 0) xOff = -600 * (1 - ease); // From Left
                        else if (i === 1) xOff = 600 * (1 - ease); // From Right
                        else if (i === 2) yOff = 200 * (1 - ease); // From Bottom
                        alpha = t;

                        ctx.globalAlpha = alpha;
                        ctx.fillText(item.text, (canvas.width / 2) + xOff, yPos + yOff);
                        ctx.restore();
                    });

                    // FOOTER LOGO (Hidden in Insta Grid)
                    if (showBottomLogo && logoRef.current) {
                        const elapsed = isVideoRecording ? (Date.now() - recordingStartTimeRef.current) / 1000 : 1.5;
                        const duration = 0.8;
                        const delay = 0.6; // Last to arrive
                        const t = Math.max(0, Math.min(1, (elapsed - delay) / duration));
                        const ease = 1 - Math.pow(1 - t, 3);
                        
                        ctx.save();
                        ctx.globalAlpha = t;
                        const logoW = 120;
                        const logoH = (logoRef.current.height / logoRef.current.width) * logoW;
                        const logoY = 1780 - (20 * (1 - ease)); // Slight slide up
                        ctx.drawImage(logoRef.current, (canvas.width / 2) - (logoW / 2), logoY, logoW, logoH);
                        ctx.restore();
                    }
                    
                    ctx.restore();
                }
            } else if (theme === 'SPOTLIGHT' || (theme === 'ARTISTE FESTIVAL' && artisteFestivalSlide === 2)) {
                // 1. Black Fade from left (Darker and deeper for text legibility)
                const fadeGrad = ctx.createLinearGradient(0, 0, canvas.width * 0.8, 0);
                fadeGrad.addColorStop(0, '#000000');
                fadeGrad.addColorStop(0.4, '#000000'); // Deeper black area
                fadeGrad.addColorStop(0.7, 'rgba(0,0,0,0.6)');
                fadeGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = fadeGrad;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 2. Artist Logo or Name (Top Left)
                if (artistLogoRef.current) {
                    const logo = artistLogoRef.current;
                    const maxW = 420; // Réduit de 500
                    const maxH = 180; // Réduit de 220
                    let lw = logo.width;
                    let lh = logo.height;
                    const ratio = Math.min(maxW / lw, maxH / lh);
                    lw *= ratio; lh *= ratio;
                    ctx.save();
                    applyTextAnimCtx(ctx, 0.10, 80 + lw / 2, 150 + lh / 2);
                    if (isArtistLogoNegative) {
                        ctx.filter = 'brightness(0) invert(1)'; // Effet négatif (blanc)
                    }
                    ctx.drawImage(logo, 80, 150, lw, lh); // Remonté de 200 à 150
                    ctx.restore();
                } else if (artistNameText) {
                    ctx.save();
                    applyTextAnimCtx(ctx, 0.10, 80 + 200, 280);
                    ctx.fillStyle = '#ffffff';
                    let fontSize = 80;
                    ctx.font = `900 italic ${fontSize}px "Orbitron", sans-serif`;
                    const maxArtistWidth = 748;
                    let textWidth = ctx.measureText(artistNameText.toUpperCase()).width;
                    if (textWidth > maxArtistWidth) {
                        fontSize = Math.max(30, Math.floor(fontSize * (maxArtistWidth / textWidth)));
                        ctx.font = `900 italic ${fontSize}px "Orbitron", sans-serif`;
                    }
                    ctx.textAlign = 'left';
                    ctx.shadowColor = 'rgba(0,0,0,0.5)';
                    ctx.shadowBlur = 15;
                    ctx.fillText(artistNameText.toUpperCase(), 80, 280); // Remonté de 300 à 280
                    ctx.restore();
                }

                // 3. Texts (Tagline, Stage & Day)
                if (customText) {
                    const lines = customText.split('\n').map(l => l.trim().toUpperCase());
                    const tagline = lines[0] || '';
                    const stageName = lines[1] || '';
                    // dayName est récupéré plus bas via lines[2]

                    ctx.save();
                    applyTextAnimCtx(ctx, 0.22, 250, 480);
                    ctx.textAlign = 'left';
                    ctx.shadowColor = 'rgba(0,0,0,0.8)';
                    ctx.shadowBlur = 15;
                    
                    // Tagline (White, small)
                    let taglineY = 440; // Descendu de 420 à 440 pour laisser plus d'air sous le logo
                    if (tagline) {
                        ctx.fillStyle = '#ffffff';
                        ctx.font = '800 28px "Montserrat", sans-serif';
                        ctx.letterSpacing = '3px';
                        
                        const taglinePart1 = lines[0] || '';
                        const taglinePart2 = lines[3] || '';
                        
                        ctx.fillText(taglinePart1, 80, taglineY);
                        if (taglinePart2) {
                            taglineY += 40;
                            ctx.fillText(taglinePart2, 80, taglineY);
                        }
                        
                        // Decorative Red Bar
                        ctx.fillStyle = activeColor.color;
                        ctx.fillRect(80, taglineY + 50, 70, 8);
                    }

                    // Stage Section
                    let currY = taglineY + 180; // Restored base layout spacing
                    ctx.fillStyle = 'rgba(255,255,255,0.6)';
                    ctx.font = '900 32px "Orbitron", sans-serif'; // Restored base size
                    ctx.letterSpacing = '4px';
                    ctx.fillText('STAGE', 80, currY);
                    
                    ctx.fillStyle = activeColor.color; // Yellow
                    let stageFontSize = 85; // Restored base size
                    ctx.font = `900 italic ${stageFontSize}px "Orbitron", sans-serif`;
                    let stageWidth = ctx.measureText(stageName).width;
                    const maxStageWidth = 748;
                    if (stageWidth > maxStageWidth) {
                        stageFontSize = Math.max(30, Math.floor(stageFontSize * (maxStageWidth / stageWidth)));
                        ctx.font = `900 italic ${stageFontSize}px "Orbitron", sans-serif`;
                    }
                    ctx.letterSpacing = '-2px';
                    ctx.fillText(stageName, 75, currY + 85); // Restored base offset
                    
                    // Day Section
                    currY += 210; // Restored base layout spacing
                    ctx.fillStyle = 'rgba(255,255,255,0.6)';
                    ctx.font = '900 32px "Orbitron", sans-serif'; // Restored base size
                    ctx.letterSpacing = '4px';
                    ctx.fillText('JOUR', 80, currY);
                    
                    const dayName = lines[2] || '';
                    ctx.fillStyle = activeColor.color; // Yellow
                    let dayFontSize = 85; // Restored base size
                    ctx.font = `900 italic ${dayFontSize}px "Orbitron", sans-serif`;
                    let dayWidth = ctx.measureText(dayName).width;
                    const maxDayWidth = 748;
                    if (dayWidth > maxDayWidth) {
                        dayFontSize = Math.max(30, Math.floor(dayFontSize * (maxDayWidth / dayWidth)));
                        ctx.font = `900 italic ${dayFontSize}px "Orbitron", sans-serif`;
                    }
                    ctx.letterSpacing = '-2px';
                    ctx.fillText(dayName, 75, currY + 85); // Restored base offset
                    
                    // Hour Section
                    currY += 210; // Restored base layout spacing
                    ctx.fillStyle = 'rgba(255,255,255,0.6)';
                    ctx.font = '900 32px "Orbitron", sans-serif'; // Restored base size
                    ctx.letterSpacing = '4px';
                    ctx.fillText('HEURE', 80, currY);
                    
                    const hourName = lines[4] || '';
                    ctx.fillStyle = activeColor.color; // Yellow
                    let hourFontSize = 85; // Restored base size
                    ctx.font = `900 italic ${hourFontSize}px "Orbitron", sans-serif`;
                    let hourWidth = ctx.measureText(hourName).width;
                    const maxHourWidth = 748;
                    if (hourWidth > maxHourWidth) {
                        hourFontSize = Math.max(30, Math.floor(hourFontSize * (maxHourWidth / hourWidth)));
                        ctx.font = `900 italic ${hourFontSize}px "Orbitron", sans-serif`;
                    }
                    ctx.letterSpacing = '-2px';
                    ctx.fillText(hourName, 75, currY + 85); // Restored base offset
                    
                    ctx.restore();
                }

                // 4. Festival Logo or Name (Bottom Left)
                if (festivalLogoRef.current) {
                    const fest = festivalLogoRef.current;
                    const maxW = 350;
                    const maxH = 120;
                    let lw = fest.width;
                    let lh = fest.height;
                    const ratio = Math.min(maxW / lw, maxH / lh);
                    lw *= ratio; lh *= ratio;
                    ctx.drawImage(fest, 80, canvas.height - 180, lw, lh);
                } else if (festivalNameText) {
                    ctx.save();
                    ctx.fillStyle = '#ffffff';
                    let festFontSize = 45;
                    ctx.font = `900 italic ${festFontSize}px "Montserrat", sans-serif`;
                    const maxFestWidth = 748;
                    let festWidth = ctx.measureText(festivalNameText.toUpperCase()).width;
                    if (festWidth > maxFestWidth) {
                        festFontSize = Math.max(20, Math.floor(festFontSize * (maxFestWidth / festWidth)));
                        ctx.font = `900 italic ${festFontSize}px "Montserrat", sans-serif`;
                    }
                    ctx.textAlign = 'left';
                    ctx.letterSpacing = '2px';
                    ctx.fillText(festivalNameText.toUpperCase(), 80, canvas.height - 120);
                    ctx.restore();
                }

                // 5. Dropsiders Logo (Top Right) - Aligned with other themes
                if (logoRef.current) {
                    const logo = logoRef.current;
                    const lw = 320;
                    const lh = (logo.height / logo.width) * lw;
                    const xOffset = bgVideo ? 140 : 40;
                    const yOffset = bgVideo ? 70 : 20;
                    ctx.save();
                    ctx.filter = 'brightness(0) invert(1)'; // White logo
                    ctx.drawImage(logo, canvas.width - lw - xOffset, yOffset, lw, lh);
                    ctx.restore();
                }

            } else if (theme === 'CITATION') {
                const safeW = 1012;
                
                if (customText) {
                    const lines = customText.split('\n').filter(l => l.trim() !== '');
                    const quote = lines.join('\n');

                    ctx.save();
                    applyTextAnimCtx(ctx, 0.15, 500, 500);
                    
                    ctx.textAlign = 'left';
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '900 italic 140px "Montserrat", sans-serif';
                    ctx.shadowColor = 'rgba(0,0,0,0.8)';
                    ctx.shadowBlur = 10;
                    ctx.fillText('“', 34, 400);

                    ctx.font = '700 48px "Montserrat", sans-serif';
                    ctx.letterSpacing = "-1px";
                    
                    const words = quote.split(' ');
                    let line = '';
                    let y = 480;
                    
                    words.forEach(word => {
                        const testLine = line + word + ' ';
                        if (ctx.measureText(stripTags(testLine)).width > safeW) {
                            drawRichText(ctx, line, 34, y, '#ffffff', 'left');
                            line = word + ' ';
                            y += 65;
                        } else {
                            line = testLine;
                        }
                    });
                    drawRichText(ctx, line, 34, y, '#ffffff', 'left');
                    
                    if (citationAuthor) {
                        y += 100;
                        ctx.font = '600 italic 36px "Montserrat", sans-serif';
                        ctx.fillStyle = '#ffffff';
                        ctx.fillText(citationAuthor.toUpperCase(), 34, y);
                    }
                    
                    if (citationMedia) {
                        y += (citationAuthor ? 40 : 100);
                        ctx.font = '400 italic 28px "Montserrat", sans-serif';
                        ctx.fillStyle = 'rgba(255,255,255,0.7)';
                        ctx.fillText(citationMedia, 34, y);
                    }
                    
                    ctx.restore();
                }


            } else if (theme === 'JEU') {
                const centerX = canvas.width / 2;
                const labelY = effectiveTab === 'PUBLICATION' ? 880 : safeBottom - 450;
                const startY = labelY + 130;

                // 1. Discreet Subtle Dark Vignette & Dual Gradient
                const gradStart = canvas.height * 0.45;
                const grad = ctx.createLinearGradient(0, gradStart, 0, canvas.height);
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(0.4, 'rgba(8,10,20,0.65)');
                grad.addColorStop(0.8, quizColor1 + '33');
                grad.addColorStop(1, quizColor2 + '44');
                ctx.fillStyle = grad;
                ctx.fillRect(0, gradStart, canvas.width, canvas.height - gradStart);

                // 2. Discreet & Stylish Capsule Badge "🎬 DEVINE LE CLIP"
                const labelText = "🎬 DEVINE LE CLIP";
                ctx.save();
                const labelFontSize = 38;
                ctx.font = `900 italic ${labelFontSize}px "Montserrat", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const labelW = ctx.measureText(labelText).width + 70;
                const rectX = (canvas.width - labelW) / 2;
                const rectY = labelY - 50;
                const rectW = labelW;
                const rectH = 72;
                const radius = 20;

                applyTextAnimCtx(ctx, 0.10, centerX, rectY + (rectH / 2));

                // Dark elegant glass capsule fill
                ctx.fillStyle = 'rgba(10, 15, 28, 0.88)';
                ctx.beginPath();
                ctx.roundRect(rectX, rectY, rectW, rectH, radius);
                ctx.fill();

                // Dynamic bicolore border gradient (Quiz Color 1 -> Quiz Color 2)
                const borderGrad = ctx.createLinearGradient(rectX, 0, rectX + rectW, 0);
                borderGrad.addColorStop(0, quizColor1);
                borderGrad.addColorStop(1, quizColor2);

                ctx.lineWidth = 2.5;
                ctx.strokeStyle = borderGrad;
                ctx.stroke();

                // Soft glow shadow
                ctx.shadowColor = quizColor1;
                ctx.shadowBlur = 12;

                ctx.fillStyle = '#ffffff';
                ctx.fillText(labelText, centerX, rectY + (rectH / 2) + 3);
                ctx.restore();

                // 3. Question / Custom Text - Clean, Crisp White with Dark Shadow
                const fontSize = 54;
                const lineHeight = fontSize * 1.22;
                const textToRender = customText || 'DE QUEL CLIP CETTE IMAGE EST TIRÉE ?';
                const paragraphs = textToRender.toUpperCase().split('\n');
                const lines: string[] = [];
                ctx.font = `900 italic ${fontSize}px "Montserrat", sans-serif`;

                for (const para of paragraphs) {
                    if (para.trim() === '') { lines.push(''); continue; }
                    const words = para.split(' ');
                    let currentLine = '';
                    for (const word of words) {
                        const testLine = currentLine + word + ' ';
                        if (ctx.measureText(stripTags(testLine)).width < canvas.width - 114) currentLine += word + ' ';
                        else { lines.push(currentLine.trim()); currentLine = word + ' '; }
                    }
                    lines.push(currentLine.trim());
                }

                ctx.save();
                applyTextAnimCtx(ctx, 0.22, centerX, startY + 100);
                ctx.textAlign = 'center';
                const maxLines = effectiveTab === 'PUBLICATION' ? 8 : 10;
                lines.slice(0, maxLines).forEach((line, i) => {
                    if (line !== '') {
                        const yPos = startY + (i * lineHeight);
                        ctx.save();
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                        ctx.shadowBlur = 12;
                        drawRichText(ctx, line, canvas.width / 2, yPos, '#ffffff', 'center');
                        ctx.restore();
                    }
                });

                if (lines.length > maxLines) {
                    ctx.fillStyle = '#ffffff';
                    ctx.globalAlpha = 0.4;
                    ctx.font = '900 italic 27px "Montserrat", sans-serif';
                    ctx.fillText('...', canvas.width / 2, startY + (maxLines * lineHeight) - 20);
                    ctx.globalAlpha = 1;
                }
                ctx.restore();

                // 4. Discreet CTA Banner (Soft gradient pill)
                ctx.save();
                const ctaY = canvas.height - 60;
                applyTextAnimCtx(ctx, 0.35, centerX, ctaY);
                const ctaText = "💬 DEVINE EN COMMENTAIRE !";
                ctx.font = '900 italic 25px "Montserrat", sans-serif';
                ctx.letterSpacing = '3px';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const ctaW = ctx.measureText(ctaText).width + 50;
                const ctaGrad = ctx.createLinearGradient(centerX - ctaW / 2, 0, centerX + ctaW / 2, 0);
                ctaGrad.addColorStop(0, 'rgba(10, 15, 28, 0.8)');
                ctaGrad.addColorStop(0.5, 'rgba(20, 28, 45, 0.9)');
                ctaGrad.addColorStop(1, 'rgba(10, 15, 28, 0.8)');

                ctx.fillStyle = ctaGrad;
                ctx.beginPath();
                ctx.roundRect(centerX - ctaW / 2, ctaY - 22, ctaW, 44, 14);
                ctx.fill();

                // Discreet gradient border
                const ctaBorder = ctx.createLinearGradient(centerX - ctaW / 2, 0, centerX + ctaW / 2, 0);
                ctaBorder.addColorStop(0, quizColor1);
                ctaBorder.addColorStop(1, quizColor2);
                ctx.strokeStyle = ctaBorder;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 8;
                ctx.fillText(ctaText, centerX, ctaY);
                ctx.restore();

            } else if (theme === 'JEU_FESTIVAL') {
                const centerX = canvas.width / 2;
                const labelY = effectiveTab === 'PUBLICATION' ? 880 : safeBottom - 450;
                const startY = labelY + 130;

                // 1. Dark Vignette & Warm Gradient
                const gradStart = canvas.height * 0.45;
                const grad = ctx.createLinearGradient(0, gradStart, 0, canvas.height);
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(0.4, 'rgba(8,10,20,0.65)');
                grad.addColorStop(0.8, '#ffaa0033');
                grad.addColorStop(1, '#ff440044');
                ctx.fillStyle = grad;
                ctx.fillRect(0, gradStart, canvas.width, canvas.height - gradStart);

                // 2. Badge "🎪 DEVINE LE FESTIVAL"
                const labelText = "🎪 DEVINE LE FESTIVAL";
                ctx.save();
                const labelFontSize = 38;
                ctx.font = `900 italic ${labelFontSize}px "Montserrat", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const labelW = ctx.measureText(labelText).width + 70;
                const rectX = (canvas.width - labelW) / 2;
                const rectY = labelY - 50;
                const rectW = labelW;
                const rectH = 72;
                const radius = 20;

                applyTextAnimCtx(ctx, 0.10, centerX, rectY + (rectH / 2));

                ctx.fillStyle = 'rgba(10, 15, 28, 0.88)';
                ctx.beginPath();
                ctx.roundRect(rectX, rectY, rectW, rectH, radius);
                ctx.fill();

                const borderGrad = ctx.createLinearGradient(rectX, 0, rectX + rectW, 0);
                borderGrad.addColorStop(0, '#ffaa00');
                borderGrad.addColorStop(1, '#ff4400');
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = borderGrad;
                ctx.stroke();

                ctx.shadowColor = '#ffaa00';
                ctx.shadowBlur = 12;
                ctx.fillStyle = '#ffffff';
                ctx.fillText(labelText, centerX, rectY + (rectH / 2) + 3);
                ctx.restore();

                // 3. Question text
                const fontSize = 54;
                const lineHeight = fontSize * 1.22;
                const textToRender = customText || 'DANS QUEL FESTIVAL PEUT-ON VOIR CETTE STAGE ?';
                const paragraphs = textToRender.toUpperCase().split('\n');
                const lines: string[] = [];
                ctx.font = `900 italic ${fontSize}px "Montserrat", sans-serif`;

                for (const para of paragraphs) {
                    if (para.trim() === '') { lines.push(''); continue; }
                    const words = para.split(' ');
                    let currentLine = '';
                    for (const word of words) {
                        const testLine = currentLine + word + ' ';
                        if (ctx.measureText(stripTags(testLine)).width < canvas.width - 114) currentLine += word + ' ';
                        else { lines.push(currentLine.trim()); currentLine = word + ' '; }
                    }
                    lines.push(currentLine.trim());
                }

                ctx.save();
                applyTextAnimCtx(ctx, 0.22, centerX, startY + 100);
                ctx.textAlign = 'center';
                const maxLines = effectiveTab === 'PUBLICATION' ? 8 : 10;
                lines.slice(0, maxLines).forEach((line, i) => {
                    if (line !== '') {
                        const yPos = startY + (i * lineHeight);
                        ctx.save();
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                        ctx.shadowBlur = 12;
                        drawRichText(ctx, line, canvas.width / 2, yPos, '#ffffff', 'center');
                        ctx.restore();
                    }
                });
                ctx.restore();

                // 4. CTA Banner
                ctx.save();
                const ctaY = canvas.height - 60;
                applyTextAnimCtx(ctx, 0.35, centerX, ctaY);
                const ctaText = "💬 DEVINE EN COMMENTAIRE !";
                ctx.font = '900 italic 25px "Montserrat", sans-serif';
                ctx.letterSpacing = '3px';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const ctaW = ctx.measureText(ctaText).width + 50;
                const ctaGrad = ctx.createLinearGradient(centerX - ctaW / 2, 0, centerX + ctaW / 2, 0);
                ctaGrad.addColorStop(0, 'rgba(10, 15, 28, 0.8)');
                ctaGrad.addColorStop(0.5, 'rgba(20, 28, 45, 0.9)');
                ctaGrad.addColorStop(1, 'rgba(10, 15, 28, 0.8)');
                ctx.fillStyle = ctaGrad;
                ctx.beginPath();
                ctx.roundRect(centerX - ctaW / 2, ctaY - 22, ctaW, 44, 14);
                ctx.fill();

                const ctaBorder = ctx.createLinearGradient(centerX - ctaW / 2, 0, centerX + ctaW / 2, 0);
                ctaBorder.addColorStop(0, '#ffaa00');
                ctaBorder.addColorStop(1, '#ff4400');
                ctx.strokeStyle = ctaBorder;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 8;
                ctx.fillText(ctaText, centerX, ctaY);
                ctx.restore();

            } else if (theme === 'AFFICHE' || (theme === 'EVENTS' && eventsSlide === 2)) {
                const isStory = canvas.height > 1500;

                // 1. Dark Vignette overlay (Atmosphère sombre et immersive Dropsiders)
                const vig = ctx.createRadialGradient(
                    canvas.width / 2, canvas.height / 2, canvas.width * 0.15,
                    canvas.width / 2, canvas.height / 2, canvas.height * 0.72
                );
                vig.addColorStop(0, 'rgba(0, 0, 0, 0.20)');
                vig.addColorStop(0.65, 'rgba(0, 0, 0, 0.60)');
                vig.addColorStop(1, 'rgba(0, 0, 0, 0.88)');
                ctx.fillStyle = vig;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 2. Top Capsule Badge EVENTS
                drawTopCapsuleBadge(theme === 'EVENTS' ? 'EVENTS' : 'AFFICHE', '#ff007f', '255, 0, 127');

                // 3. Dimensions de la carte d'affiche
                const baseCardW = 800;
                const baseCardH = isStory ? 1380 : 980;
                const baseCardY = isStory ? (bgVideo ? 250 : 220) : (bgVideo ? 230 : 195);

                const scale = (afficheScale || 100) / 100;
                const cardW = Math.round(baseCardW * scale);
                const cardH = Math.round(baseCardH * scale);
                const cardX = Math.round((canvas.width - cardW) / 2);
                const cardY = Math.round(baseCardY + ((baseCardH - cardH) / 2) + (afficheOffsetY || 0));
                const rad = isStory ? 28 : 24;

                // 4. Ombre portée 3D et halo ambiant néon
                ctx.save();
                if (afficheGlow) {
                    ctx.shadowColor = `rgba(${activeColor.grad || '255, 0, 127'}, 0.35)`;
                    ctx.shadowBlur = 45;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    ctx.beginPath();
                    ctx.roundRect(cardX, cardY, cardW, cardH, rad);
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.fill();
                }

                ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
                ctx.shadowBlur = 55;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 22;
                ctx.beginPath();
                ctx.roundRect(cardX, cardY, cardW, cardH, rad);
                ctx.fillStyle = '#0a0a0c';
                ctx.fill();
                ctx.restore();

                // 5. Rendu de l'affiche de l'événement dans le rectangle arrondi clippé
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(cardX, cardY, cardW, cardH, rad);
                ctx.clip();

                if (afficheImageRef.current) {
                    const poster = afficheImageRef.current;
                    if (afficheMode === 'contain') {
                        ctx.fillStyle = '#0a0a0e';
                        ctx.fillRect(cardX, cardY, cardW, cardH);
                        const fitScale = Math.min(cardW / poster.width, cardH / poster.height);
                        const dw = poster.width * fitScale;
                        const dh = poster.height * fitScale;
                        const dx = cardX + (cardW - dw) / 2;
                        const dy = cardY + (cardH - dh) / 2;
                        ctx.drawImage(poster, dx, dy, dw, dh);
                    } else {
                        // Mode Cover
                        const posterRatio = poster.width / poster.height;
                        const cardRatio = cardW / cardH;
                        let sx = 0, sy = 0, sw = poster.width, sh = poster.height;
                        if (posterRatio > cardRatio) {
                            sw = poster.height * cardRatio;
                            sx = (poster.width - sw) / 2;
                        } else {
                            sh = poster.width / cardRatio;
                            sy = (poster.height - sh) / 2;
                        }
                        ctx.drawImage(poster, sx, sy, sw, sh, cardX, cardY, cardW, cardH);
                    }
                } else {
                    // Carte placeholder élégante en attente d'image
                    const phGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
                    phGrad.addColorStop(0, 'rgba(26, 26, 32, 0.95)');
                    phGrad.addColorStop(1, 'rgba(12, 12, 16, 0.98)');
                    ctx.fillStyle = phGrad;
                    ctx.fillRect(cardX, cardY, cardW, cardH);

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '900 italic 30px "Orbitron", sans-serif';
                    ctx.fillText("AFFICHE DE L'ÉVÉNEMENT", cardX + cardW / 2, cardY + cardH / 2 - 25);

                    ctx.font = '700 16px "Montserrat", sans-serif';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
                    ctx.fillText("Importez l'affiche dans le panneau latéral", cardX + cardW / 2, cardY + cardH / 2 + 25);
                }

                // Reflet subtil en dégradé sur le haut de la carte
                const glossGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH * 0.35);
                glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
                glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = glossGrad;
                ctx.fillRect(cardX, cardY, cardW, cardH * 0.35);
                ctx.restore();

                // 6. Contour bordure élégant
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(cardX, cardY, cardW, cardH, rad);
                ctx.strokeStyle = afficheBorderColor || 'rgba(255, 255, 255, 0.22)';
                ctx.lineWidth = 2.5;
                ctx.stroke();
                ctx.restore();

                // 7. Mention Swipe
                if (showSwipe) {
                    ctx.save();
                    const swipeY = canvas.height - (isStory ? 80 : 50);
                    ctx.font = '800 24px "Montserrat", sans-serif';
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = 'rgba(0,0,0,0.85)';
                    ctx.shadowBlur = 8;
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('Swipe ──>', canvas.width - (isStory ? 80 : 60), swipeY);
                    ctx.restore();
                }

            } else if (theme === 'MUSIQUE' && effectiveEditorialSlide >= 2) {
                const isStory = canvas.height > 1500;
                const trackIdx = Math.max(0, effectiveEditorialSlide - 2);
                const currentTrack = musicTracks[trackIdx] || { cover: '', title: '', artist: '', label: '' };
                const currentCoverUrl = currentTrack.cover || (trackIdx === 0 ? afficheImage : '');
                const currentCoverImg = (currentCoverUrl && musicCoverImgsRef.current[currentCoverUrl]) || (trackIdx === 0 ? afficheImageRef.current : null);

                // 1. Ambiance sombre & immersive avec halo néon vert Dropsiders
                const vig = ctx.createRadialGradient(
                    canvas.width / 2, canvas.height / 2, canvas.width * 0.15,
                    canvas.width / 2, canvas.height / 2, canvas.height * 0.72
                );
                vig.addColorStop(0, 'rgba(0, 0, 0, 0.20)');
                vig.addColorStop(0.60, 'rgba(0, 0, 0, 0.55)');
                vig.addColorStop(1, 'rgba(0, 0, 0, 0.86)');
                ctx.fillStyle = vig;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Halo lumineux néon vert centré derrière la pochette
                const haloY = isStory ? 730 : 555;
                const haloGrad = ctx.createRadialGradient(
                    canvas.width / 2, haloY, 80,
                    canvas.width / 2, haloY, isStory ? 560 : 460
                );
                haloGrad.addColorStop(0, 'rgba(57, 255, 20, 0.18)');
                haloGrad.addColorStop(0.55, 'rgba(57, 255, 20, 0.04)');
                haloGrad.addColorStop(1, 'rgba(57, 255, 20, 0)');
                ctx.fillStyle = haloGrad;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 2. Top Capsule Badge MUSIQUE (vert néon #39ff14)
                drawTopCapsuleBadge('MUSIQUE', '#39ff14', '57, 255, 20');

                // 3. Dimensions et proportions de la pochette carrée 1:1
                const baseCardSize = isStory ? 780 : 640;
                const scale = (afficheScale || 100) / 100;
                const cardW = Math.round(baseCardSize * scale);
                const cardH = cardW; // Format 1:1
                const cardX = Math.round((canvas.width - cardW) / 2);
                const baseCardY = isStory ? 340 : 235;
                const cardY = Math.round(baseCardY + (afficheOffsetY || 0));
                const rad = isStory ? 34 : 28;

                // 4. Ombre portée 3D et halo ambiant néon vert
                ctx.save();
                if (afficheGlow) {
                    ctx.shadowColor = 'rgba(57, 255, 20, 0.40)';
                    ctx.shadowBlur = 50;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    ctx.beginPath();
                    ctx.roundRect(cardX, cardY, cardW, cardH, rad);
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
                    ctx.fill();
                }

                ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                ctx.shadowBlur = 60;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 24;
                ctx.beginPath();
                ctx.roundRect(cardX, cardY, cardW, cardH, rad);
                ctx.fillStyle = '#080a08';
                ctx.fill();
                ctx.restore();

                // 5. Rendu de l'image de la pochette ou vinyle stylisé Dropsiders
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(cardX, cardY, cardW, cardH, rad);
                ctx.clip();

                if (currentCoverImg) {
                    const poster = currentCoverImg;
                    if (afficheMode === 'contain') {
                        ctx.fillStyle = '#0a0a0e';
                        ctx.fillRect(cardX, cardY, cardW, cardH);
                        const fitScale = Math.min(cardW / poster.width, cardH / poster.height);
                        const dw = poster.width * fitScale;
                        const dh = poster.height * fitScale;
                        const dx = cardX + (cardW - dw) / 2;
                        const dy = cardY + (cardH - dh) / 2;
                        ctx.drawImage(poster, dx, dy, dw, dh);
                    } else {
                        // Mode Cover 1:1
                        const posterRatio = poster.width / poster.height;
                        const cardRatio = cardW / cardH;
                        let sx = 0, sy = 0, sw = poster.width, sh = poster.height;
                        if (posterRatio > cardRatio) {
                            sw = poster.height * cardRatio;
                            sx = (poster.width - sw) / 2;
                        } else {
                            sh = poster.width / cardRatio;
                            sy = (poster.height - sh) / 2;
                        }
                        ctx.drawImage(poster, sx, sy, sw, sh, cardX, cardY, cardW, cardH);
                    }
                } else {
                    // Placeholder vinyle / music art élégant et épuré
                    const phGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
                    phGrad.addColorStop(0, '#151b16');
                    phGrad.addColorStop(0.5, '#0e120f');
                    phGrad.addColorStop(1, '#070908');
                    ctx.fillStyle = phGrad;
                    ctx.fillRect(cardX, cardY, cardW, cardH);

                    // Sillons de disque vinyle
                    const cCenterX = cardX + cardW / 2;
                    const cCenterY = cardY + cardH * 0.44;
                    [0.34, 0.28, 0.22, 0.16].forEach(rRatio => {
                        ctx.beginPath();
                        ctx.arc(cCenterX, cCenterY, cardW * rRatio, 0, Math.PI * 2);
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                    });

                    // Centre du vinyle avec pastille néon vert
                    ctx.beginPath();
                    ctx.arc(cCenterX, cCenterY, 34, 0, Math.PI * 2);
                    ctx.fillStyle = '#0a0e0b';
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(57, 255, 20, 0.45)';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(cCenterX, cCenterY, 8, 0, Math.PI * 2);
                    ctx.fillStyle = '#39ff14';
                    ctx.fill();

                    // Textes de consignes épurés
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = '800 24px "Montserrat", sans-serif';
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText("POCHETTE DU MORCEAU", cCenterX, cardY + cardH * 0.77);

                    ctx.font = '600 14px "Montserrat", sans-serif';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
                    ctx.fillText("Format carré 1:1 • Importer dans le panneau", cCenterX, cardY + cardH * 0.84);
                }

                // Reflet gloss sur le haut de la pochette
                const glossGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH * 0.38);
                glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
                glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = glossGrad;
                ctx.fillRect(cardX, cardY, cardW, cardH * 0.38);
                ctx.restore();

                // 6. Contour bordure vert néon élégant
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(cardX, cardY, cardW, cardH, rad);
                ctx.strokeStyle = afficheBorderColor || 'rgba(57, 255, 20, 0.40)';
                ctx.lineWidth = 2.5;
                ctx.stroke();
                ctx.restore();

                // 7. ZONE TEXTES EN DESSOUS : TITRE + ARTISTE + LABEL + LECTEUR 30S
                const contentWidth = canvas.width - (isStory ? 160 : 120);
                const centerX = canvas.width / 2;

                // A) Track Number Pill (ex: "TRACK 01")
                const pillY = isStory ? 1180 : 925;
                const trackNumText = `TRACK ${String(trackIdx + 1).padStart(2, '0')}`;
                ctx.save();
                ctx.font = '900 italic 15px "Montserrat", sans-serif';
                ctx.letterSpacing = '1.5px';
                const pillPaddingX = 16;
                const pillH = isStory ? 32 : 28;
                const pillW = ctx.measureText(trackNumText).width + (pillPaddingX * 2);
                ctx.fillStyle = 'rgba(57, 255, 20, 0.14)';
                ctx.strokeStyle = 'rgba(57, 255, 20, 0.45)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(centerX - pillW / 2, pillY - pillH / 2, pillW, pillH, pillH / 2);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#39ff14';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(trackNumText, centerX, pillY);
                ctx.restore();

                // B) TITRE DU MORCEAU (Gros, blanc avec highlights)
                const titleY = isStory ? 1275 : 995;
                const titleText = currentTrack.title?.trim() || (trackIdx === 0 && conseilsTitle && conseilsTitle !== 'LE TITRE ICI' ? conseilsTitle : `TITRE DU MORCEAU`);
                ctx.save();
                let titleFontSize = isStory ? 52 : 44;
                ctx.font = `900 ${titleFontSize}px "Montserrat", sans-serif`;
                while (ctx.measureText(stripTags(titleText).toUpperCase()).width > contentWidth && titleFontSize > 24) {
                    titleFontSize -= 2;
                    ctx.font = `900 ${titleFontSize}px "Montserrat", sans-serif`;
                }
                ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                ctx.shadowBlur = 14;
                drawRichText(ctx, titleText.toUpperCase(), centerX, titleY, '#ffffff', 'center');
                ctx.restore();

                // C) ARTISTE (En vert néon gras italique)
                const artistY = isStory ? 1370 : 1070;
                const artistText = currentTrack.artist?.trim() || (trackIdx === 0 && artistNameText ? artistNameText : 'NOM DE L\'ARTISTE');
                ctx.save();
                let artistFontSize = isStory ? 36 : 28;
                ctx.font = `800 italic ${artistFontSize}px "Montserrat", sans-serif`;
                while (ctx.measureText(artistText.toUpperCase()).width > contentWidth && artistFontSize > 20) {
                    artistFontSize -= 2;
                    ctx.font = `800 italic ${artistFontSize}px "Montserrat", sans-serif`;
                }
                ctx.fillStyle = '#39ff14';
                ctx.shadowColor = 'rgba(57, 255, 20, 0.55)';
                ctx.shadowBlur = 12;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(artistText.toUpperCase(), centerX, artistY);
                ctx.restore();

                // D) LABEL DISCOGRAPHIQUE (Badge capsule élégant si renseigné)
                const labelRaw = currentTrack.label?.trim();
                if (labelRaw) {
                    const labelY = isStory ? 1465 : 1150;
                    const labelDisplay = `LABEL : ${labelRaw.toUpperCase()}`;
                    ctx.save();
                    const labelFontSize = isStory ? 20 : 16;
                    ctx.font = `800 ${labelFontSize}px "Montserrat", sans-serif`;
                    const lPadX = 20;
                    const lH = isStory ? 42 : 36;
                    const lW = ctx.measureText(labelDisplay).width + (lPadX * 2);

                    ctx.fillStyle = 'rgba(18, 22, 19, 0.85)';
                    ctx.strokeStyle = 'rgba(57, 255, 20, 0.35)';
                    ctx.lineWidth = 1.5;
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
                    ctx.shadowBlur = 12;
                    ctx.beginPath();
                    ctx.roundRect(centerX - lW / 2, labelY - lH / 2, lW, lH, 10);
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                    ctx.shadowBlur = 0;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(labelDisplay, centerX, labelY);
                    ctx.restore();
                }

                // F) FOOTER & SWIPE
                const footerY = canvas.height - (isStory ? 80 : 50);
                // Left branding
                ctx.save();
                ctx.font = '800 15px "Montserrat", sans-serif';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText('DROPSIDERS.FR', isStory ? 80 : 60, footerY);
                ctx.restore();

                // Right Swipe
                if (showSwipe) {
                    ctx.save();
                    ctx.font = '800 24px "Montserrat", sans-serif';
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = 'rgba(0,0,0,0.85)';
                    ctx.shadowBlur = 8;
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('Swipe ──>', canvas.width - (isStory ? 80 : 60), footerY);
                    ctx.restore();
                }

            } else if (theme === 'PROMO') {
                renderPromoOutro(ctx, 0, 1.0);

            } else if (theme === 'MAP') {
                // 1. Draw Map Tiles
                drawMap(ctx, mapLatitude, mapLongitude, mapZoom, canvas.width, canvas.height, 0, 0);

                // 2. LIVE FROM Badge Frame
                const frameX = 80;
                const frameY = bgVideo ? 160 : 100;
                const frameW = 440;
                const frameH = 200;

                ctx.save();
                ctx.shadowColor = '#ff0033';
                ctx.shadowBlur = 20;

                ctx.fillStyle = 'rgba(10, 10, 10, 0.9)';
                ctx.beginPath();
                ctx.roundRect(frameX, frameY, frameW, frameH, 24);
                ctx.fill();

                ctx.strokeStyle = '#ff0033';
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                ctx.roundRect(frameX, frameY, frameW, frameH, 24);
                ctx.stroke();

                ctx.shadowBlur = 0;

                const dotPulse = (Math.sin(Date.now() / 300) + 1) / 2;
                ctx.beginPath();
                ctx.arc(frameX + 45, frameY + 50, 8 + (dotPulse * 2.5), 0, Math.PI * 2);
                ctx.fillStyle = '#ff0033';
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.font = '900 26px "Montserrat", sans-serif';
                ctx.letterSpacing = '4px';
                ctx.textAlign = 'left';
                ctx.fillText('LIVE FROM', frameX + 75, frameY + 58);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.fillRect(frameX + 30, frameY + 95, frameW - 60, 2);

                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                let festFontSize = 36;
                ctx.font = `900 italic ${festFontSize}px "Orbitron", sans-serif`;
                const festName = mapFestivalText.toUpperCase();

                while (ctx.measureText(festName).width > frameW - 60 && festFontSize > 18) {
                    festFontSize--;
                    ctx.font = `900 italic ${festFontSize}px "Orbitron", sans-serif`;
                }
                ctx.fillText(festName, frameX + frameW / 2, frameY + 152);
                ctx.restore();

                if (isMapLoading) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '900 italic 30px "Montserrat", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('RECHERCHE EN COURS...', canvas.width / 2, canvas.height / 2);
                    ctx.restore();
                }

            } else {
                // Draw Stylized Footer for Top 100
                if (theme === 'TOP 100 DROPSIDERS') {
                    ctx.save();
                    const ctaSize = 24;
                    const prefix = 'VOTER SUR ';
                    const domain = 'DROPSIDERS.FR';
                    const centerX = canvas.width / 2;
                    const footerY = canvas.height - 60;
                    
                    ctx.font = `600 ${ctaSize}px "Montserrat", sans-serif`;
                    const w1 = ctx.measureText(prefix).width;
                    ctx.font = `900 ${ctaSize}px "Montserrat", sans-serif`;
                    const w2 = ctx.measureText(domain).width;
                    const totalW = w1 + w2;
                    let curX = centerX - totalW / 2;

                    ctx.textAlign = 'left';
                    ctx.fillStyle = '#ffffff';
                    ctx.font = `600 ${ctaSize}px "Montserrat", sans-serif`;
                    ctx.fillText(prefix, curX, footerY);
                    curX += w1;
                    
                    ctx.font = `900 ${ctaSize}px "Montserrat", sans-serif`;
                    ctx.fillText(domain, curX, footerY);
                    
                    ctx.beginPath();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.moveTo(curX, footerY + 8);
                    ctx.lineTo(curX + w2, footerY + 8);
                    ctx.stroke();
                    ctx.restore();
                }

                // 1. TOP-LEFT STYLIZED CAPSULE BADGE (French Crowd / Modern Editorial)
                const isReel = effectiveTab === 'REEL';
                const isEditorialCarouselTheme = ['NEWS', 'FOCUS', 'MUSIQUE', 'RECAP', 'INTERVIEW', 'LIVESTREAM', 'CONSEILS', 'REELS', 'CONCOURS'].includes(theme);

                ctx.save();
                if (isEditorialCarouselTheme) {
                    applySlideTransitionCtx(ctx, canvas.width / 2, canvas.height / 2);
                }

                const themeDotColor = (theme === 'INTERVIEW') ? '#ffffff' : activeData.color;
                const badgeLabelText = (theme === 'ARTISTE FESTIVAL') 
                    ? (festivalNameText ? festivalNameText.toUpperCase() : 'FESTIVAL')
                    : (('label' in activeData) ? (activeData as any).label : theme);

                drawTopCapsuleBadge(badgeLabelText, themeDotColor, (theme === 'INTERVIEW') ? '255, 255, 255' : activeData.grad);

                // 2. TOP RIGHT PHOTO CREDIT (Left of logo)
                const headerRightX = canvas.width - (isReel ? 420 : 380);
                const badgeY = isReel ? 74 : 50;
                const headerY = badgeY + 23;
                if (citationAuthor) {
                    ctx.save();
                    ctx.font = '600 22px "Montserrat", sans-serif';
                    ctx.fillStyle = 'rgba(255,255,255,0.85)';
                    ctx.shadowColor = 'rgba(0,0,0,0.85)';
                    ctx.shadowBlur = 8;
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(citationAuthor, headerRightX, headerY);
                    ctx.restore();
                }

                // 3. HORIZONTAL DIVIDER LINE & SWIPE (Positioned at ~68-70% height)
                const dividerY = Math.floor(canvas.height * (isReel ? 0.68 : 0.70));
                const lineMarginX = isReel ? 80 : 60;
                let swipeSpaceRight = 0;

                // Swipe indicator aligned directly on the divider line
                if (showSwipe) {
                    ctx.save();
                    ctx.font = '800 24px "Montserrat", sans-serif';
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = 'rgba(0,0,0,0.85)';
                    ctx.shadowBlur = 6;
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'middle';
                    const swipeText = 'Swipe ──>';
                    swipeSpaceRight = ctx.measureText(swipeText).width + 20;
                    ctx.fillText(swipeText, canvas.width - lineMarginX, dividerY);
                    ctx.restore();
                }

                const lineRightX = canvas.width - lineMarginX - swipeSpaceRight;

                // Animation temporelle pour les textes (jouée une seule fois au début, puis le texte reste 100% fixe)
                const animElapsed = (isVideoRecording || (bgVideo && !isDownloading) || textAnimation !== 'NONE')
                    ? (Date.now() - animStartTimeRef.current) / 1000
                    : 99.0;

                // Date automatique centrée dans la barre blanche (avec un segment de barre blanche de chaque côté)
                const showEditorialDate = ['NEWS', 'FOCUS', 'RECAP', 'INTERVIEW', 'LIVESTREAM', 'MUSIQUE', 'EVENTS', 'ARTISTE FESTIVAL', 'CONCOURS', 'REELS', 'CONSEILS'].includes(theme);

                ctx.save();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 5;
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                ctx.shadowBlur = 6;

                if (textAnimation !== 'NONE') {
                    const lineT = Math.max(0, Math.min(1, animElapsed / 0.35));
                    ctx.globalAlpha = 1 - Math.pow(1 - lineT, 3);
                }

                if (showEditorialDate) {
                    const now = new Date();
                    const dayStr = String(now.getDate()).padStart(2, '0');
                    const monthStr = now.toLocaleDateString('fr-FR', { month: 'long' }).toUpperCase();
                    const yearStr = now.getFullYear();
                    const dateText = `${dayStr} ${monthStr} ${yearStr}`;

                    const dateFontSize = isReel ? 18 : 16;
                    const dateLetterSpacing = 3;
                    ctx.font = `800 ${dateFontSize}px "Montserrat", sans-serif`;
                    if ('letterSpacing' in ctx) {
                        (ctx as any).letterSpacing = `${dateLetterSpacing}px`;
                    }
                    const dateWidth = ctx.measureText(dateText).width;
                    const gap = 24; // Espace net entre le texte et chaque bout de barre blanche
                    const centerX = canvas.width / 2;
                    const dateLeft = centerX - (dateWidth / 2);
                    const dateRight = centerX + (dateWidth / 2);

                    // 1. Bout de bande blanche gauche
                    if (dateLeft - gap > lineMarginX) {
                        ctx.beginPath();
                        ctx.moveTo(lineMarginX, dividerY);
                        ctx.lineTo(dateLeft - gap, dividerY);
                        ctx.stroke();
                    }

                    // 2. Texte de la date au centre exact
                    let dateAlpha = 1;
                    if (textAnimation !== 'NONE') {
                        const dateT = Math.max(0, Math.min(1, (animElapsed - 0.20) / 0.30));
                        dateAlpha = 1 - Math.pow(1 - dateT, 3);
                    }
                    ctx.save();
                    ctx.globalAlpha = dateAlpha;
                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                    ctx.shadowBlur = 8;
                    ctx.fillText(dateText, centerX, dividerY);
                    ctx.restore();

                    // 3. Bout de bande blanche droite
                    if (lineRightX > dateRight + gap) {
                        ctx.beginPath();
                        ctx.moveTo(dateRight + gap, dividerY);
                        ctx.lineTo(lineRightX, dividerY);
                        ctx.stroke();
                    }
                } else {
                    // Barre continue normale si le thème n'utilise pas la date
                    ctx.beginPath();
                    ctx.moveTo(lineMarginX, dividerY);
                    ctx.lineTo(lineRightX, dividerY);
                    ctx.stroke();
                }
                ctx.restore();

                // 4. MAIN TITLE IN WHITE (BOLD) & SUBTEXT UNDERNEATH (ITALIC)
                let mainTitleText = (conseilsTitle && conseilsTitle !== 'LE TITRE ICI') 
                    ? conseilsTitle 
                    : (customText || (theme === 'ARTISTE FESTIVAL' ? 'LES 10 ARTISTES À NE PAS LOUPER' : ''));
                
                // Sur les slides 2+ des thèmes éditoriaux, possibilité de masquer le grand titre selon le choix de l'utilisateur
                if (effectiveEditorialSlide >= 2 && isEditorialCarouselTheme && !showTitleOnSlide2) {
                    mainTitleText = '';
                }

                // Récupération du bodyText pour la slide active (Slide 1 = pas de bodyText, Slide 2 = conseilsSubtext, Slide >= 3 = extraEditorialSlides[s - 3])
                let bodyText = '';
                if (effectiveEditorialSlide === 1 && isEditorialCarouselTheme) {
                    bodyText = '';
                } else if (effectiveEditorialSlide === 2) {
                    bodyText = conseilsSubtext || '';
                } else if (effectiveEditorialSlide >= 3) {
                    const extraIdx = effectiveEditorialSlide - 3;
                    bodyText = extraEditorialSlides[extraIdx] || '';
                } else {
                    bodyText = conseilsSubtext || '';
                }

                const lineWidth = canvas.width - (lineMarginX * 2);
                const isTitleOnly = mainTitleText && !bodyText;
                
                // Décalage du texte par rapport à la barre horizontale (donne de l'air pour que le texte ne soit pas trop proche de la ligne)
                let curY = dividerY + (isReel ? (!mainTitleText ? 85 : 118) : (!mainTitleText ? 75 : 108));

                // --- A) MAIN TITLE IN WHITE (WITH THEME COLOR HIGHLIGHTS) ---
                if (mainTitleText) {
                    ctx.save();
                    // Sur la slide 1 (titre seul), le titre est agrandi pour un maximum d'impact
                    let titleFontSize = isTitleOnly ? 64 : (isEditorialCarouselTheme ? 50 : 44);
                    ctx.font = `900 ${titleFontSize}px "Montserrat", sans-serif`;

                    const formatTitleLines = (fSize: number) => {
                        ctx.font = `900 ${fSize}px "Montserrat", sans-serif`;
                        const lines: string[] = [];
                        mainTitleText.split('\n').forEach(line => {
                            if (!line.trim()) return;
                            const words = line.trim().split(/\s+/);
                            let cur = '';
                            words.forEach(w => {
                                const test = cur ? `${cur} ${w}` : w;
                                if (ctx.measureText(stripTags(test).toUpperCase()).width > lineWidth) {
                                    if (cur) lines.push(cur);
                                    cur = w;
                                } else {
                                    cur = test;
                                }
                            });
                            if (cur) lines.push(cur);
                        });
                        return lines;
                    };

                    let titleLines = formatTitleLines(titleFontSize);
                    while (titleFontSize > 26 && titleLines.some(l => ctx.measureText(stripTags(l).toUpperCase()).width > lineWidth)) {
                        titleFontSize -= 2;
                        titleLines = formatTitleLines(titleFontSize);
                    }

                    const titleLineHeight = Math.round(titleFontSize * 1.18);
                    ctx.font = `900 ${titleFontSize}px "Montserrat", sans-serif`;
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                    ctx.shadowBlur = 6;
                    ctx.textBaseline = 'alphabetic';

                    titleLines.forEach((tLine, tIndex) => {
                        let xOff = 0;
                        let yOff = 0;
                        let alpha = 1;
                        let scale = 1;
                        let displayText = tLine.toUpperCase();

                        if (textAnimation === 'SLIDE_LEFT') {
                            const delay = 0.20 + (tIndex * 0.22);
                            const t = Math.max(0, Math.min(1, (animElapsed - delay) / 0.55));
                            const ease = 1 - Math.pow(1 - t, 3);
                            xOff = -450 * (1 - ease);
                            alpha = t;
                        } else if (textAnimation === 'WORD_BY_WORD') {
                            const delay = 0.15 + (tIndex * 0.30);
                            const t = Math.max(0, Math.min(1, (animElapsed - delay) / 0.40));
                            const ease = 1 - Math.pow(1 - t, 3);
                            yOff = 25 * (1 - ease);
                            alpha = t;
                        } else if (textAnimation === 'POP_UP') {
                            const delay = 0.20 + (tIndex * 0.20);
                            const t = Math.max(0, Math.min(1, (animElapsed - delay) / 0.50));
                            const ease = 1 - Math.pow(1 - t, 3);
                            yOff = 80 * (1 - ease);
                            alpha = t;
                        } else if (textAnimation === 'ZOOM_IMPACT') {
                            const delay = 0.15 + (tIndex * 0.24);
                            const t = Math.max(0, Math.min(1, (animElapsed - delay) / 0.40));
                            const ease = 1 - Math.pow(1 - t, 3);
                            scale = 1.6 - (0.6 * ease);
                            alpha = Math.min(1, t * 2);
                        } else if (textAnimation === 'TYPEWRITER') {
                            const delay = 0.15 + (tIndex * 0.35);
                            const words = displayText.split(/\s+/);
                            const wordsToShow = Math.min(words.length, Math.floor(Math.max(0, animElapsed - delay) / 0.14));
                            const visibleWords = words.slice(0, wordsToShow).join(' ');
                            displayText = visibleWords + (wordsToShow < words.length && wordsToShow > 0 ? ' ▌' : '');
                            alpha = wordsToShow > 0 ? 1 : 0;
                        } else if (textAnimation === 'BOUNCE') {
                            const delay = 0.15 + (tIndex * 0.18);
                            const t = Math.max(0, Math.min(1, (animElapsed - delay) / 0.65));
                            let bounce = 1;
                            if (t < 1) {
                                bounce = 1 - Math.pow(2, -10 * t) * Math.cos((t * 10 - 0.75) * ((2 * Math.PI) / 3));
                            }
                            yOff = -140 * (1 - bounce);
                            alpha = Math.min(1, t * 2.5);
                        } else if (textAnimation === 'GLITCH') {
                            const delay = 0.15 + (tIndex * 0.18);
                            const el = animElapsed - delay;
                            if (el < 0) {
                                alpha = 0;
                            } else if (el < 0.45) {
                                const step = Math.floor(el * 28);
                                xOff = Math.sin(step * 7.5) * 35;
                                alpha = (step % 3 === 0) ? 0.35 : 1;
                            } else {
                                xOff = 0;
                                alpha = 1;
                            }
                        }

                        ctx.save();
                        ctx.globalAlpha = alpha;
                        if (scale !== 1) {
                            ctx.translate((canvas.width / 2) + xOff, curY + yOff);
                            ctx.scale(scale, scale);
                            drawRichText(ctx, displayText, 0, 0, '#ffffff', 'center');
                        } else {
                            drawRichText(ctx, displayText, (canvas.width / 2) + xOff, curY + yOff, '#ffffff', 'center');
                        }
                        ctx.restore();
                        curY += titleLineHeight;
                    });
                    ctx.restore();
                    curY += 26; // Clean spacing
                }

                // --- B) SUBTEXT UNDERNEATH (ITALIC, WITH THEME COLOR HIGHLIGHTS) ---
                if (bodyText) {
                    ctx.save();
                    // Sur la slide 2, le texte en dessous est agrandi (jusqu'à 38px si le titre est retiré) pour une excellente lisibilité
                    let subFontSize = !mainTitleText ? (isReel ? 38 : 34) : (isEditorialCarouselTheme ? 32 : 26);
                    ctx.font = `italic 400 ${subFontSize}px "Montserrat", sans-serif`;

                    const formatSubLines = (fSize: number) => {
                        ctx.font = `italic 400 ${fSize}px "Montserrat", sans-serif`;
                        const lines: string[] = [];
                        bodyText.split('\n').forEach(line => {
                            if (!line.trim()) return;
                            const words = line.trim().split(/\s+/);
                            let cur = '';
                            words.forEach(w => {
                                const test = cur ? `${cur} ${w}` : w;
                                if (ctx.measureText(stripTags(test)).width > lineWidth) {
                                    if (cur) lines.push(cur);
                                    cur = w;
                                } else {
                                    cur = test;
                                }
                            });
                            if (cur) lines.push(cur);
                        });
                        return lines;
                    };

                    let subLines = formatSubLines(subFontSize);
                    while (subFontSize > 18 && subLines.some(l => ctx.measureText(stripTags(l)).width > lineWidth)) {
                        subFontSize -= 1;
                        subLines = formatSubLines(subFontSize);
                    }

                    const subLineHeight = Math.round(subFontSize * 1.38);
                    ctx.font = `italic 400 ${subFontSize}px "Montserrat", sans-serif`;
                    ctx.fillStyle = 'rgba(255,255,255,0.92)';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                    ctx.shadowBlur = 4;
                    ctx.textBaseline = 'alphabetic';

                    const subBaseDelay = 0.20 + ((mainTitleText ? 1 : 0) * 0.45);

                    subLines.forEach((bLine, sIndex) => {
                        let xOff = 0;
                        let yOff = 0;
                        let alpha = 1;
                        let scale = 1;
                        let displayText = bLine;

                        if (textAnimation === 'SLIDE_LEFT') {
                            const delay = subBaseDelay + (sIndex * 0.18);
                            const t = Math.max(0, Math.min(1, (animElapsed - delay) / 0.50));
                            const ease = 1 - Math.pow(1 - t, 3);
                            xOff = -350 * (1 - ease);
                            alpha = t;
                        } else if (textAnimation === 'WORD_BY_WORD') {
                            const delay = subBaseDelay + (sIndex * 0.25);
                            const t = Math.max(0, Math.min(1, (animElapsed - delay) / 0.35));
                            const ease = 1 - Math.pow(1 - t, 3);
                            yOff = 20 * (1 - ease);
                            alpha = t;
                        } else if (textAnimation === 'POP_UP') {
                            const delay = subBaseDelay + (sIndex * 0.16);
                            const t = Math.max(0, Math.min(1, (animElapsed - delay) / 0.45));
                            const ease = 1 - Math.pow(1 - t, 3);
                            yOff = 50 * (1 - ease);
                            alpha = t;
                        } else if (textAnimation === 'ZOOM_IMPACT') {
                            const delay = subBaseDelay + (sIndex * 0.20);
                            const t = Math.max(0, Math.min(1, (animElapsed - delay) / 0.38));
                            const ease = 1 - Math.pow(1 - t, 3);
                            scale = 1.4 - (0.4 * ease);
                            alpha = Math.min(1, t * 2);
                        } else if (textAnimation === 'TYPEWRITER') {
                            const delay = subBaseDelay + (sIndex * 0.30);
                            const words = displayText.split(/\s+/);
                            const wordsToShow = Math.min(words.length, Math.floor(Math.max(0, animElapsed - delay) / 0.12));
                            const visibleWords = words.slice(0, wordsToShow).join(' ');
                            displayText = visibleWords + (wordsToShow < words.length && wordsToShow > 0 ? ' ▌' : '');
                            alpha = wordsToShow > 0 ? 1 : 0;
                        } else if (textAnimation === 'BOUNCE') {
                            const delay = subBaseDelay + (sIndex * 0.16);
                            const t = Math.max(0, Math.min(1, (animElapsed - delay) / 0.55));
                            let bounce = 1;
                            if (t < 1) {
                                bounce = 1 - Math.pow(2, -10 * t) * Math.cos((t * 10 - 0.75) * ((2 * Math.PI) / 3));
                            }
                            yOff = -80 * (1 - bounce);
                            alpha = Math.min(1, t * 2);
                        } else if (textAnimation === 'GLITCH') {
                            const delay = subBaseDelay + (sIndex * 0.16);
                            const el = animElapsed - delay;
                            if (el < 0) {
                                alpha = 0;
                            } else if (el < 0.35) {
                                const step = Math.floor(el * 28);
                                xOff = Math.sin(step * 7.5) * 20;
                                alpha = (step % 3 === 0) ? 0.4 : 1;
                            } else {
                                xOff = 0;
                                alpha = 1;
                            }
                        }

                        ctx.save();
                        ctx.globalAlpha = alpha;
                        if (scale !== 1) {
                            ctx.translate((canvas.width / 2) + xOff, curY + yOff);
                            ctx.scale(scale, scale);
                            drawRichText(ctx, displayText, 0, 0, 'rgba(255,255,255,0.92)', 'center');
                        } else {
                            drawRichText(ctx, displayText, (canvas.width / 2) + xOff, curY + yOff, 'rgba(255,255,255,0.92)', 'center');
                        }
                        ctx.restore();
                        curY += subLineHeight;
                    });
                    ctx.restore();
                }



                // 5. BOTTOM LINK INDICATORS (If activated)
                let curIndicatorY = (effectiveTab === 'PUBLICATION') ? canvas.height - 55 : canvas.height - 230;
                if (showArticleLink) {
                    ctx.save();
                    ctx.font = '900 italic 22px "Montserrat", sans-serif';
                    ctx.letterSpacing = '0.5px';
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                    ctx.shadowBlur = 12;
                    ctx.textAlign = 'left';
                    ctx.fillText('ARTICLE COMPLET SUR DROPSIDERS.FR', lineMarginX, curIndicatorY);
                    ctx.restore();
                    if (showVoteLink) {
                        curIndicatorY -= 32;
                    }
                }
                if (showVoteLink) {
                    ctx.save();
                    ctx.font = '900 italic 22px "Montserrat", sans-serif';
                    ctx.letterSpacing = '0.5px';
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                    ctx.shadowBlur = 12;
                    ctx.textAlign = 'left';
                    ctx.fillText('VOTER SUR DROPSIDERS.FR', lineMarginX, curIndicatorY);
                    ctx.restore();
                }
                ctx.restore();
            }

            // 5. Apply Transition Effects (Glitch / Zoom)
            if (effectiveTransitionProgress > 0) {
                const glitchIntensity = Math.sin(effectiveTransitionProgress * Math.PI);

                // Zoom Blur effect
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                ctx.globalAlpha = glitchIntensity * 0.3;
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.scale(1 + glitchIntensity * 0.1, 1 + glitchIntensity * 0.1);
                ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
                ctx.restore();

                // RGB Glitch Strips
                if (glitchIntensity > 0.2) {
                    for (let i = 0; i < 20; i++) {
                        const h = Math.random() * 100 + 10;
                        const y = Math.random() * canvas.height;
                        const offset = (Math.random() - 0.5) * glitchIntensity * 120;

                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(0, y, canvas.width, h);
                        ctx.clip();

                        // Shift original image
                        ctx.globalAlpha = 0.5;
                        ctx.drawImage(canvas, offset, 0);

                        // Add some noise/color
                        ctx.globalCompositeOperation = 'screen';
                        ctx.fillStyle = i % 2 === 0 ? `rgba(255, 0, 50, 0.1)` : `rgba(0, 255, 255, 0.1)`;
                        ctx.fillRect(0, y, canvas.width, h);
                        ctx.restore();
                    }
                }

                // White Flash
                ctx.fillStyle = `rgba(255, 255, 255, ${glitchIntensity * 0.2})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // --- FINAL OVERLAYS (Logo & Swipe) ---
            if (logoRef.current && theme !== 'SPOTLIGHT' && !(theme === 'ARTISTE FESTIVAL' && artisteFestivalSlide === 2) && theme !== 'PROMO') {
                const logo = logoRef.current;
                const isReel = effectiveTab === 'REEL';
                const w = isReel ? 275 : 290;
                // Safe margins preventing cropping from rounded corners and Instagram UI
                const xOffset = isReel ? 80 : 60;
                const yOffset = isReel ? 70 : 45;
                const logoH = (logo.height * w) / logo.width;
                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.6)';
                ctx.shadowBlur = 18;
                if (isArtistLogoNegative) {
                    ctx.filter = 'brightness(0) invert(1)';
                    ctx.drawImage(logo, canvas.width - w - xOffset, yOffset, w, logoH);
                    ctx.filter = 'none';
                } else {
                    ctx.drawImage(logo, canvas.width - w - xOffset, yOffset, w, logoH);
                }
                ctx.restore();
            }

            // Optional discreet frame around the image/canvas
            if (showFrame) {
                ctx.save();
                const pad = 30;
                const frameW = canvas.width - (pad * 2);
                const frameH = canvas.height - (pad * 2);
                if (theme === 'JEU') {
                    const frameGrad = ctx.createLinearGradient(pad, pad, pad + frameW, pad + frameH);
                    frameGrad.addColorStop(0, quizColor1);
                    frameGrad.addColorStop(1, quizColor2);
                    ctx.strokeStyle = frameGrad;
                    ctx.lineWidth = 3.5;
                    ctx.shadowColor = quizColor1;
                    ctx.shadowBlur = 12;
                } else {
                    ctx.strokeStyle = `rgba(${activeData.grad}, 0.7)`;
                    ctx.lineWidth = 3;
                    ctx.shadowColor = `rgba(${activeData.grad}, 0.4)`;
                    ctx.shadowBlur = 10;
                }
                ctx.beginPath();
                ctx.roundRect(pad, pad, frameW, frameH, 24);
                ctx.stroke();
                ctx.restore();
            }

            // Links legacy fallback (uniquement pour les thèmes non modernisés et non exports PROMO)
            const isPromoExport = exportMode === 'PROMO';
            const isCustomLayoutTheme = ['MUSIQUE', 'EVENTS', 'AFFICHE'].includes(theme);

            if (showArticleLink && !isPromoExport && !isModernEditorialTheme && !isCustomLayoutTheme) {
                ctx.save();
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                ctx.font = '900 italic 24px "Montserrat", sans-serif'; // Réduit de 40% (40px -> 24px)
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 10;
                ctx.fillText('ARTICLE COMPLET SUR DROPSIDERS.FR', 40, canvas.height - 10);
                ctx.restore();
            }

            if (showVoteLink && !isPromoExport && !isModernEditorialTheme && !isCustomLayoutTheme) {
                ctx.save();
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                ctx.font = '900 italic 24px "Montserrat", sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 10;
                ctx.fillText('VOTER SUR DROPSIDERS.FR', 40, canvas.height - (showArticleLink ? 45 : 10));
                ctx.restore();
            }

            })(effectiveTheme);
        } catch (e) { console.error(e); }
    };

    // --- MAGIC ERASER ENGINE (IN-STUDIO CLEANUP) ---
    const applyMagicErase = () => {
        if (!canvasRef.current || retouchPath.length === 0) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // 1. Create a mask of the painted area
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        const mctx = maskCanvas.getContext('2d');
        if (!mctx) return;

        mctx.lineJoin = 'round'; mctx.lineCap = 'round';
        mctx.strokeStyle = '#fff';
        mctx.lineWidth = brushSize * (canvas.width / 450); // Scale to canvas
        mctx.beginPath();
        retouchPath.forEach((p, i) => {
            if (i === 0) mctx.moveTo(p.x, p.y);
            else mctx.lineTo(p.x, p.y);
        });
        mctx.stroke();

        // 2. Perform localized patching (Mimics Magic Eraser)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const maskData = mctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const mask = maskData.data;

        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const i = (y * canvas.width + x) * 4;
                if (mask[i] > 128) { // Masked pixel
                    let found = false;
                    // Search in a larger radius for valid background pixels to copy
                    for (let r = 2; r < 40; r += 3) {
                        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                            const sx = Math.round(x + Math.cos(angle) * r);
                            const sy = Math.round(y + Math.sin(angle) * r);
                            if (sx >= 0 && sx < canvas.width && sy >= 0 && sy < canvas.height) {
                                const si = (sy * canvas.width + sx) * 4;
                                if (mask[si] === 0) {
                                    data[i] = data[si]; data[i+1] = data[si+1]; data[i+2] = data[si+2];
                                    found = true; break;
                                }
                            }
                        }
                        if (found) break;
                    }
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);

        // Update photo state with cleaned version
        setBgImage(canvas.toDataURL('image/jpeg', 0.9));
        setRetouchPath([]);
        setIsRetouchMode(false);
    };

    useEffect(() => {
        let anim: number;
        // Pendant l'export vidéo actif, la boucle de capture gère elle-même les frames pour éviter les doublons
        if (isVideoRecording) {
            return;
        }
        if (bgVideo || textAnimation !== 'NONE' || bgAnimation !== 'NONE' || theme === 'TRACKLIST' || transitionProgress > 0) {
            const loop = () => { generateImage(); anim = requestAnimationFrame(loop); };
            anim = requestAnimationFrame(loop);
        } else { generateImage(); }
        return () => cancelAnimationFrame(anim);
    }, [bgImage, bgVideo, customText, theme, showSwipe, showArticleLink, showVoteLink, top5Items, currentPreviewIndex, activeTab, rotation, themeColor, isVideoRecording, transitionProgress, showText, planningDate, planningItems, agendaMonth, agendaBadgeText, agendaSlide, agendaCoverBadge, agendaCoverTitle, agendaCoverYear, agendaCoverGenres, agendaCoverCta, artisteFestivalSlide, eventsSlide, editorialSlide, showTitleOnSlide2, extraEditorialSlides, musicTracks, calendarMonth, calendarEvents, isRetouchMode, retouchPath, isTransparent, showBottomLogo, artistLogo, festivalLogo, bgOffsetX, bgOffsetY, artistNameText, festivalNameText, isArtistLogoNegative, mapFestivalText, mapCityCountry, mapZoom, mapLatitude, mapLongitude, mapStyle, isMapLoading, mapPinColor, mapLabelText, showMapPin, showMapLabel, imgLayoutMode, quizColor1, quizColor2, showFrame, conseilsTitle, conseilsSubtext, isConseilsLargeTitle, concoursFestivalName, concoursFestivalHandle, concoursBottomColor, concoursLateralText, concoursLateralOpacity, concoursBadgeTextColor, concoursMode, concoursGTAHeadline, concoursGTATitle, concoursGTAPlatformText, concoursGTACondition1, concoursGTACondition2, concoursGTACondition3, concoursGTACondition4, afficheImage, afficheGlow, afficheBorderColor, afficheMode, afficheScale, afficheOffsetY, textAnimation, animReplayKey, bgAnimation, isCarouselPromoActive, promoCustomPhrase, promoCustomSubphrase, promoCategory, showPromoHook, showPromoHeadline]);

    // Pre-charger les pochettes des tracks du thème MUSIQUE
    useEffect(() => {
        musicTracks.forEach(t => {
            if (t.cover && !musicCoverImgsRef.current[t.cover]) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    musicCoverImgsRef.current[t.cover] = img;
                    generateImage();
                };
                img.onerror = () => {
                    console.warn("Erreur de chargement de la cover track:", t.cover);
                };
                img.src = t.cover;
            }
        });
    }, [musicTracks]);

    // Pre-charger l'affiche de l'événement dès que son URL change
    useEffect(() => {
        if (!afficheImage) {
            afficheImageRef.current = null;
            generateImage();
            return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            afficheImageRef.current = img;
            generateImage();
        };
        img.onerror = () => {
            console.warn("Erreur de chargement de l'affiche de l'événement:", afficheImage);
        };
        img.src = afficheImage;
    }, [afficheImage]);

    // --- FONT LOADER ---
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Antonio:wght@700;900&family=Montserrat:wght@700;900&family=Orbitron:wght@700;900&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => { document.head.removeChild(link); };
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = url;
            video.loop = true;
            video.playsInline = true; // Important for mobile preview
            video.crossOrigin = "anonymous";
            video.currentTime = 0;
            const onLoaded = () => {
                video.currentTime = 0;
                video.play().catch(e => console.warn("Auto-preview play failed", e));
                video.removeEventListener('loadedmetadata', onLoaded);
            };
            video.addEventListener('loadedmetadata', onLoaded);
            video.play().catch(e => console.warn("Auto-preview play failed", e));
            setBgVideo(video); setBgImage('');
        } else {
            // Pre-load image to ensure it works with toDataURL
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                setBgImage(url);
                setBgVideo(null);
            };
            img.src = url;
        }
    };

    const startVideoRecording = async (combinedMode: 'NONE' | 'PLANNING' | 'EDITORIAL' = 'NONE') => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const prevAgendaSlide = agendaSlide;
        const prevEditorialSlide = editorialSlide;

        // Helper pour animer frame-par-frame avec timing fluide
        const renderDuration = async (durationMs: number) => {
            const t0 = Date.now();
            while (Date.now() - t0 < durationMs) {
                await generateImage();
                await new Promise(r => requestAnimationFrame(r));
            }
        };

        isVideoRecordingRef.current = true;
        promoOutroOverrideRef.current = false;
        const prevWasCarouselPromoActive = isCarouselPromoActive;
        if (combinedMode === 'PLANNING') {
            agendaSlideOverrideRef.current = 1;
            setIsCarouselPromoActive(false);
        } else if (combinedMode === 'EDITORIAL') {
            editorialSlideOverrideRef.current = 1;
            setIsCarouselPromoActive(false);
        } else {
            setArtisteFestivalSlide(1);
            setEventsSlide(1);
            setIsCarouselPromoActive(false);
        }
        transitionProgressRef.current = 0;

        setIsVideoRecording(true);
        recordingStartTimeRef.current = Date.now();
        animStartTimeRef.current = Date.now();

        const formats = [
            'video/mp4;codecs=h264',
            'video/mp4',
            'video/quicktime',
            'video/webm;codecs=h264',
            'video/webm;codecs=vp9',
            'video/webm'
        ];

        const mimeType = formats.find(f => MediaRecorder.isTypeSupported(f)) || 'video/webm';

        const fps = exportFps || 60; // 60 FPS Studio
        const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(fps) : (canvas as any).mozCaptureStream ? (canvas as any).mozCaptureStream(fps) : null;

        if (!canvasStream) {
            setErrorMessage("Votre navigateur ne supporte pas la capture vidéo.");
            isVideoRecordingRef.current = false;
            setIsVideoRecording(false);
            if (combinedMode === 'PLANNING') {
                agendaSlideOverrideRef.current = null;
                setAgendaSlide(prevAgendaSlide);
                setIsCarouselPromoActive(prevWasCarouselPromoActive);
            } else if (combinedMode === 'EDITORIAL') {
                editorialSlideOverrideRef.current = null;
                setEditorialSlide(prevEditorialSlide);
                setIsCarouselPromoActive(prevWasCarouselPromoActive);
            }
            return;
        }

        let combinedStream = canvasStream;
        let hasAudioTrack = false;

        if (bgVideo) {
            try {
                // Impératif : la vidéo de fond doit recommencer à 0:00 pile pour que l'export commence au tout début du clip
                bgVideo.pause();
                bgVideo.currentTime = 0;
                await new Promise<void>((resolve) => {
                    const onSeeked = () => {
                        bgVideo.removeEventListener('seeked', onSeeked);
                        resolve();
                    };
                    bgVideo.addEventListener('seeked', onSeeked);
                    setTimeout(resolve, 200);
                });
                bgVideo.loop = true;

                // Tente de jouer avec le son démuté
                try {
                    bgVideo.muted = false;
                    await bgVideo.play();
                } catch (unmutedErr) {
                    console.warn("Lecture unmuted bloquée par le navigateur, bascule en muette :", unmutedErr);
                    bgVideo.muted = true;
                    await bgVideo.play().catch(e => console.error("Échec play() vidéo :", e));
                }

                // Configuration de la piste audio fluide (zéro micro-coupure)
                if (!bgVideo.muted) {
                    // 1. Tente d'extraire la piste audio directement du stream natif matériel (Zero CPU, zéro jitter)
                    try {
                        const directStream = (bgVideo as any).captureStream
                            ? (bgVideo as any).captureStream()
                            : (bgVideo as any).mozCaptureStream
                                ? (bgVideo as any).mozCaptureStream()
                                : null;
                        if (directStream && directStream.getAudioTracks().length > 0) {
                            const nativeAudioTrack = directStream.getAudioTracks()[0];
                            hasAudioTrack = true;
                            combinedStream = new MediaStream([
                                ...canvasStream.getTracks(),
                                nativeAudioTrack
                            ]);
                        }
                    } catch (e) {
                        console.warn("captureStream direct vidéo indisponible:", e);
                    }

                    // 2. Fallback WebAudio AudioContext si pas de piste directe
                    if (!hasAudioTrack) {
                        try {
                            if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
                                audioCtxRef.current = new AudioContext({ sampleRate: 48000 });
                            }
                            const audioCtx = audioCtxRef.current;
                            if (audioCtx.state === 'suspended') {
                                await audioCtx.resume();
                            }

                            if (!audioSourceNodeRef.current || audioSourceVideoRef.current !== bgVideo) {
                                try {
                                    audioSourceNodeRef.current = audioCtx.createMediaElementSource(bgVideo);
                                    audioSourceVideoRef.current = bgVideo;
                                } catch (e) {
                                    console.warn("createMediaElementSource déjà lié :", e);
                                }
                            }

                            if (audioSourceNodeRef.current) {
                                const dest = audioCtx.createMediaStreamDestination();
                                try {
                                    audioSourceNodeRef.current.disconnect();
                                } catch (_) {}
                                audioSourceNodeRef.current.connect(dest);
                                audioDestNodeRef.current = dest;

                                const audioTracks = dest.stream.getAudioTracks();
                                if (audioTracks.length > 0) {
                                    hasAudioTrack = true;
                                    combinedStream = new MediaStream([
                                        ...canvasStream.getTracks(),
                                        ...audioTracks
                                    ]);
                                }
                            }
                        } catch (audioErr) {
                            console.warn("Configuration AudioContext impossible :", audioErr);
                        }
                    }
                }
            } catch (e) {
                console.error("Erreur initialisation vidéo de fond :", e);
                bgVideo.muted = true;
                bgVideo.loop = true;
                await bgVideo.play().catch(() => {});
            }
        }

        // Bitrate fluide équilibré pour éviter toute saturation CPU/mémoire et zéro drop de frame
        const bitrate = isMobile ? 8000000 : (fps === 60 ? 12000000 : 8000000);

        const recorder = new MediaRecorder(combinedStream, {
            mimeType,
            videoBitsPerSecond: bitrate
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
            if (chunks.length === 0) {
                setErrorMessage("Erreur de capture vidéo.");
                isVideoRecordingRef.current = false;
                setIsVideoRecording(false);
                return;
            }

            const initialBlob = new Blob(chunks, { type: mimeType });
            
            // Sur mobile : modal de prévisualisation et partage natif
            if (isMobile) {
                const url = URL.createObjectURL(initialBlob);
                isVideoRecordingRef.current = false;
                setIsVideoRecording(false);
                setRecordingProgress(0);
                setReadyVideoBlob(initialBlob);
                setReadyVideoUrl(url);
                setActivePanel(null);
                return;
            }

            // Sur PC : conversion rapide MP4 H.264 et téléchargement automatique immédiat
            try {
                isVideoRecordingRef.current = false;
                setIsVideoRecording(false);
                setIsConverting(true);
                setConversionProgress(0);

                if (!ffmpegRef.current) {
                    const ffmpeg = new FFmpeg();
                    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
                    await ffmpeg.load({
                        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                    });
                    ffmpegRef.current = ffmpeg;
                }

                const ffmpeg = ffmpegRef.current;
                ffmpeg.on('progress', ({ progress }: any) => {
                    setConversionProgress(Math.min(99, Math.round(progress * 100)));
                });

                await ffmpeg.writeFile('input.webm', await fetchFile(initialBlob));
                
                const ffmpegArgs = [
                    '-i', 'input.webm',
                    '-c:v', 'libx264',
                    '-preset', 'fast',
                    '-crf', '19',
                    '-pix_fmt', 'yuv420p',
                    '-r', String(fps),
                    '-movflags', '+faststart'
                ];
                if (hasAudioTrack) {
                    ffmpegArgs.push(
                        '-c:a', 'aac',
                        '-b:a', '192k',
                        '-ar', '48000'
                    );
                } else {
                    ffmpegArgs.push('-an');
                }
                ffmpegArgs.push('output.mp4');

                await ffmpeg.exec(ffmpegArgs);

                const data: any = await ffmpeg.readFile('output.mp4');
                const mp4Blob = new Blob([data.buffer], { type: 'video/mp4' });
                const url = URL.createObjectURL(mp4Blob);

                setIsConverting(false);
                setReadyVideoBlob(mp4Blob);
                setReadyVideoUrl(url);
                setActivePanel(null);

                // Téléchargement automatique direct pour l'utilisateur
                const a = document.createElement('a');
                a.href = url;
                a.download = `dropsiders-${theme.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.mp4`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } catch (err) {
                console.error("FFmpeg Error:", err);
                setIsConverting(false);
                // Repli direct sur le fichier brut capturé
                const ext = initialBlob.type.includes('mp4') ? 'mp4' : 'webm';
                const url = URL.createObjectURL(initialBlob);
                setReadyVideoBlob(initialBlob);
                setReadyVideoUrl(url);
                setActivePanel(null);

                const a = document.createElement('a');
                a.href = url;
                a.download = `dropsiders-${theme.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${ext}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        };

        recorder.start();

        let totalDuration = 0;
        const currentTransitionDuration = getTransitionDuration(slideTransition);
        if (combinedMode === 'EDITORIAL') {
            const isMusicTheme = (theme === 'MUSIQUE');
            const shouldSkipSlide2 = skipEditorialSlide2;
            const contentSlideNumbers: number[] = isMusicTheme
                ? [1, ...musicTracks.map((_, i) => i + 2)]
                : (shouldSkipSlide2
                    ? [1, ...extraEditorialSlides.map((_, i) => i + 3)]
                    : [1, 2, ...extraEditorialSlides.map((_, i) => i + 3)]);
            const numContentSlides = contentSlideNumbers.length;
            const promoDuration = Math.round(editorialPromoDuration * 1000);
            const transitionDuration = currentTransitionDuration;
            const slideDuration = Math.round(editorialSlide1Duration * 1000);
            totalDuration = (numContentSlides * slideDuration) + (numContentSlides * transitionDuration) + promoDuration;
        } else if (combinedMode === 'PLANNING') {
            const promoDuration = 4800;
            const transitionDuration = currentTransitionDuration;
            const slideDuration = 5200;
            totalDuration = (2 * slideDuration) + (2 * transitionDuration) + promoDuration;
        } else if (theme.startsWith('TOP 5')) {
            totalDuration = 5 * (16800 + 1200); // 5 slides + transitions
        } else if (theme === 'TOP 10 FESTIVAL') {
            totalDuration = 4 * (16800 + 1200); // 4 slides (Cover + 3 Grid pages)
        } else {
            // Utilise la durée exacte de la vidéo uploadée.
            totalDuration = (bgVideo && !isNaN(bgVideo.duration) && bgVideo.duration > 0)
                ? bgVideo.duration * 1000
                : ((activeTab === 'REEL' || textAnimation !== 'NONE' || bgAnimation !== 'NONE' || theme === 'TRACKLIST') ? 15000 : 60000);
            if (totalDuration > 600000) totalDuration = 600000; // Limit to 10 minutes
        }

        const startTime = Date.now();
        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / totalDuration) * 100, 99);
            setRecordingProgress(progress);
            setRecordingTimeLeft(Math.max(0, Math.ceil((totalDuration - elapsed) / 1000)));
        }, 400);

        if (combinedMode === 'EDITORIAL') {
            const isMusicTheme = (theme === 'MUSIQUE');
            const shouldSkipSlide2 = skipEditorialSlide2;
            const contentSlideNumbers: number[] = isMusicTheme
                ? [1, ...musicTracks.map((_, i) => i + 2)]
                : (shouldSkipSlide2
                    ? [1, ...extraEditorialSlides.map((_, i) => i + 3)]
                    : [1, 2, ...extraEditorialSlides.map((_, i) => i + 3)]);
            const promoDuration = Math.round(editorialPromoDuration * 1000);
            const transitionDuration = currentTransitionDuration;
            const slideDuration = Math.round(editorialSlide1Duration * 1000);

            // 1. Déroulement des slides de contenu (selon contentSlideNumbers)
            for (let i = 0; i < contentSlideNumbers.length; i++) {
                const s = contentSlideNumbers[i];
                if (i > 0) {
                    const startT = Date.now();
                    let switched = false;
                    while (Date.now() - startT < transitionDuration) {
                        const progress = Math.min(1, (Date.now() - startT) / transitionDuration);
                        transitionProgressRef.current = progress;
                        if (progress >= 0.5 && !switched) {
                            editorialSlideOverrideRef.current = s;
                            animStartTimeRef.current = Date.now();
                            switched = true;
                        }
                        await generateImage();
                        await new Promise(r => requestAnimationFrame(r));
                    }
                    transitionProgressRef.current = 0;
                    editorialSlideOverrideRef.current = s;
                } else {
                    editorialSlideOverrideRef.current = s;
                    animStartTimeRef.current = Date.now();
                }

                // Rendu actif frame-par-frame
                await renderDuration(slideDuration);
            }

            // 2. Transition vers le visuel PROMO outro à la fin du Reel
            const startPromoT = Date.now();
            let switchedPromo = false;
            while (Date.now() - startPromoT < transitionDuration) {
                const progress = Math.min(1, (Date.now() - startPromoT) / transitionDuration);
                transitionProgressRef.current = progress;
                if (progress >= 0.5 && !switchedPromo) {
                    promoOutroOverrideRef.current = true;
                    animStartTimeRef.current = Date.now();
                    switchedPromo = true;
                }
                await generateImage();
                await new Promise(r => requestAnimationFrame(r));
            }
            transitionProgressRef.current = 0;

            // 3. Affichage du visuel promo final pendant promoDuration
            await renderDuration(promoDuration);
            promoOutroOverrideRef.current = false;

        } else if (combinedMode === 'PLANNING') {
            const promoDuration = 4800; // 4.8s pour avoir tout le temps de lire le message
            const transitionDuration = currentTransitionDuration;
            const slideDuration = 5200;

            // 1. Slide 1 (Cover)
            agendaSlideOverrideRef.current = 1;
            animStartTimeRef.current = Date.now();
            await renderDuration(slideDuration);

            // 2. Transition carrousel vers Slide 2
            const startT = Date.now();
            let switched = false;
            while (Date.now() - startT < transitionDuration) {
                const progress = Math.min(1, (Date.now() - startT) / transitionDuration);
                transitionProgressRef.current = progress;
                if (progress >= 0.5 && !switched) {
                    agendaSlideOverrideRef.current = 2;
                    animStartTimeRef.current = Date.now();
                    switched = true;
                }
                await generateImage();
                await new Promise(r => requestAnimationFrame(r));
            }
            transitionProgressRef.current = 0;
            agendaSlideOverrideRef.current = 2;

            // 3. Slide 2 (Lineup)
            await renderDuration(slideDuration);

            // 4. Transition vers le visuel PROMO outro à la fin du Reel
            const startPromoT = Date.now();
            let switchedPromo = false;
            while (Date.now() - startPromoT < transitionDuration) {
                const progress = Math.min(1, (Date.now() - startPromoT) / transitionDuration);
                transitionProgressRef.current = progress;
                if (progress >= 0.5 && !switchedPromo) {
                    promoOutroOverrideRef.current = true;
                    animStartTimeRef.current = Date.now();
                    switchedPromo = true;
                }
                await generateImage();
                await new Promise(r => requestAnimationFrame(r));
            }
            transitionProgressRef.current = 0;

            // 5. Affichage du visuel promo final pendant promoDuration
            await renderDuration(promoDuration);
            promoOutroOverrideRef.current = false;

        } else if (theme.startsWith('TOP 5')) {
            for (let i = 0; i < 5; i++) {
                if (i > 0) {
                    const durationTransition = 1200;
                    const startT = Date.now();
                    let switched = false;
                    while (Date.now() - startT < durationTransition) {
                        const progress = (Date.now() - startT) / durationTransition;
                        transitionProgressRef.current = progress;
                        if (progress > 0.5 && !switched) {
                            setCurrentPreviewIndex(i);
                            switched = true;
                        }
                        await generateImage();
                        await new Promise(r => requestAnimationFrame(r));
                    }
                    transitionProgressRef.current = 0;
                } else {
                    setCurrentPreviewIndex(i);
                }
                await renderDuration(16800);
            }
        } else if (theme === 'TOP 10 FESTIVAL') {
            for (let i = 0; i < 11; i++) {
                if (i > 0) {
                    const durationTransition = 1200;
                    const startT = Date.now();
                    let switched = false;
                    while (Date.now() - startT < durationTransition) {
                        const progress = (Date.now() - startT) / durationTransition;
                        transitionProgressRef.current = progress;
                        if (progress > 0.5 && !switched) {
                            setCurrentPreviewIndex(i);
                            switched = true;
                        }
                        await generateImage();
                        await new Promise(r => requestAnimationFrame(r));
                    }
                    transitionProgressRef.current = 0;
                } else {
                    setCurrentPreviewIndex(i);
                }
                await renderDuration(16800);
            }
        } else {
            await renderDuration(totalDuration);
        }

        clearInterval(progressInterval);
        setRecordingProgress(100);
        setRecordingTimeLeft(0);
        isVideoRecordingRef.current = false;
        promoOutroOverrideRef.current = false;
        transitionProgressRef.current = null;
        transitionTargetRef.current = null;
        setTransitionProgress(0);
        if (combinedMode === 'PLANNING') {
            agendaSlideOverrideRef.current = null;
            setAgendaSlide(prevAgendaSlide);
            setIsCarouselPromoActive(prevWasCarouselPromoActive);
        } else if (combinedMode === 'EDITORIAL') {
            editorialSlideOverrideRef.current = null;
            setEditorialSlide(prevEditorialSlide);
            setIsCarouselPromoActive(prevWasCarouselPromoActive);
        }
        if (bgVideo) {
            bgVideo.muted = true; // remet en silencieux pour le preview
            bgVideo.loop = true;
            bgVideo.play().catch(() => { });
        }

        if (recorder.state !== 'inactive') recorder.stop();
    };

    const addVisualToList = () => {
        if (!canvasRef.current) return;
        setVisualsList([...visualsList, canvasRef.current.toDataURL('image/png')]);
    };

    const downloadSingle = async () => {
        if (!canvasRef.current) return;
        setIsDownloading(true);
        // Regenerate canvas without swipe/article overlays for clean export
        await generateImage(undefined, true);
        try {
            // Use toBlob (more reliable, avoids CORS taint issues)
            canvasRef.current.toBlob(async (blob) => {
                if (!blob) {
                    // Fallback: toDataURL
                    try {
                        const dataUrl = canvasRef.current!.toDataURL('image/png');
                        if (!dataUrl || dataUrl === 'data:,') throw new Error('Empty canvas');

                        // On mobile, try Web Share API first if available for generated image
                        if (isMobile && ('share' in navigator)) {
                            const response = await fetch(dataUrl);
                            const blobFromUrl = await response.blob();
                            const file = new File([blobFromUrl], `dropsiders-${theme.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' });
                            try {
                                await (navigator as any).share({
                                    files: [file],
                                    title: 'Dropsiders Social Studio',
                                    text: 'Visuel généré avec le Social Studio Dropsiders'
                                });
                                setIsDownloading(false);
                                return;
                            } catch (err) {
                                console.warn('Share rejected or failed, falling back to traditional download', err);
                            }
                        }

                        const a = document.createElement('a');
                        a.download = `dropsiders-${theme.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
                        a.href = dataUrl;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    } catch (err) {
                        console.error('Export fallback failed:', err);
                        setErrorMessage("Erreur d'exportation. Vérifiez que les images utilisées sont accessibles (pas de blocage CORS).");
                    } finally {
                        setTimeout(() => setIsDownloading(false), 1000);
                    }
                    return;
                }

                // Native Share for Mobile (if supported and it's a blob)
                if (isMobile && ('share' in navigator)) {
                    try {
                        const file = new File([blob], `dropsiders-${theme.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' });
                        await (navigator as any).share({
                            files: [file],
                            title: 'Dropsiders Social Studio',
                            text: 'Visuel généré avec le Social Studio Dropsiders'
                        });
                        setIsDownloading(false);
                        return;
                    } catch (err) {
                        console.warn('Share rejected or failed, falling back to traditional download', err);
                    }
                }

                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.download = `dropsiders-${theme.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
                a.href = url;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 2000);
                setActivePanel(null);
                setTimeout(() => setIsDownloading(false), 1000);
            }, 'image/png');
        } catch (err) {
            console.error('Export failed:', err);
            setErrorMessage("Erreur d'exportation inattendue.");
            setTimeout(() => setIsDownloading(false), 1000);
        }
    };
    
    const downloadFormat = async (format: TabType) => {
        if (!canvasRef.current) return;
        setIsDownloading(true);
        try {
            await generateImage(format, true);
            const fileName = theme === 'PLANNING'
                ? `${format === 'REEL' ? 'STORY' : 'POST'}-agenda-slide${agendaSlide}-${agendaSlide === 1 ? 'cover' : 'events'}.png`
                : `${format === 'REEL' ? 'STORY' : 'POST'}-${theme.toLowerCase().replace(/\s+/g, '-')}.png`;
            const isMobile = /iPad|iPhone|iPod|Android/.test(navigator.userAgent) || ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0);

            if (isMobile && navigator.share) {
                try {
                    const blob = await new Promise<Blob | null>(resolve => canvasRef.current!.toBlob(resolve, 'image/png'));
                    if (blob) {
                        const file = new File([blob], fileName, { type: 'image/png' });
                        await navigator.share({
                            files: [file],
                            title: 'Dropsiders Visual'
                        });
                        return; // If Share succeeds, stop here
                    }
                } catch (e) {
                    console.log('Share API denied or failed', e);
                }
            }

            // Default fallback for desktop or if Share failed
            const dataUrl = canvasRef.current!.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) {
            console.error(e);
            setErrorMessage("Erreur lors de l'exportation PNG.");
        } finally {
            setTimeout(() => {
                setIsDownloading(false);
                generateImage(); // Restore preview with overlays
            }, 500);
        }
    };

    const downloadBackgroundVisual = async (targetTab?: TabType) => {
        if (!canvasRef.current) return;
        setIsDownloading(true);
        const prevShowText = showText;
        try {
            setShowText(false);
            const format = targetTab || activeTab;
            await new Promise(r => setTimeout(r, 50));
            await generateImage(format, true);
            const fileName = `dropsiders-fond-${format === 'REEL' ? 'story-9-16' : 'post-4-5'}-${Date.now()}.png`;

            if (isMobile && ('share' in navigator)) {
                try {
                    const blob = await new Promise<Blob | null>(resolve => canvasRef.current!.toBlob(resolve, 'image/png'));
                    if (blob) {
                        const file = new File([blob], fileName, { type: 'image/png' });
                        await (navigator as any).share({
                            files: [file],
                            title: 'Dropsiders Fond Visuel',
                            text: 'Fond visuel généré avec Dropsiders Studio'
                        });
                        return;
                    }
                } catch (e) {
                    console.log('Share API denied or failed', e);
                }
            }

            const dataUrl = canvasRef.current!.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) {
            console.error('Erreur export fond visuel:', e);
            setErrorMessage("Erreur lors de l'export du fond visuel.");
        } finally {
            setShowText(prevShowText);
            setTimeout(() => {
                setIsDownloading(false);
                generateImage();
            }, 300);
        }
    };

    const downloadAgendaSlide = async (slideNumber: 1 | 2, format: TabType = (activeTab || 'PUBLICATION')) => {
        if (!canvasRef.current) return;
        setIsDownloading(true);
        const prevSlide = agendaSlide;
        try {
            setAgendaSlide(slideNumber);
            await new Promise(r => setTimeout(r, 60));
            await generateImage(format, true);
            const fileName = `${format === 'REEL' ? 'STORY' : 'POST'}-agenda-slide${slideNumber}-${slideNumber === 1 ? 'cover' : 'events'}.png`;
            const dataUrl = canvasRef.current.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) {
            console.error(e);
            setErrorMessage(`Erreur lors du téléchargement de la slide ${slideNumber}.`);
        } finally {
            setTimeout(() => {
                setAgendaSlide(prevSlide);
                setIsDownloading(false);
                generateImage();
            }, 400);
        }
    };

    const downloadFullAgendaCarousel = async (format: TabType = (activeTab || 'PUBLICATION')) => {
        if (!canvasRef.current) return;
        setIsDownloading(true);
        const prevSlide = agendaSlide;
        try {
            // 1. Slide 1 (Cover)
            setAgendaSlide(1);
            await new Promise(r => setTimeout(r, 60));
            await generateImage(format, true);
            const dataUrl1 = canvasRef.current.toDataURL('image/png');
            const a1 = document.createElement('a');
            a1.href = dataUrl1;
            a1.download = `${format === 'REEL' ? 'STORY' : 'POST'}-agenda-slide1-cover.png`;
            document.body.appendChild(a1);
            a1.click();
            document.body.removeChild(a1);

            // 2. Slide 2 (Events)
            await new Promise(r => setTimeout(r, 350));
            setAgendaSlide(2);
            await new Promise(r => setTimeout(r, 60));
            await generateImage(format, true);
            const dataUrl2 = canvasRef.current.toDataURL('image/png');
            const a2 = document.createElement('a');
            a2.href = dataUrl2;
            a2.download = `${format === 'REEL' ? 'STORY' : 'POST'}-agenda-slide2-events.png`;
            document.body.appendChild(a2);
            a2.click();
            document.body.removeChild(a2);
        } catch (e) {
            console.error(e);
            setErrorMessage("Erreur lors de l'exportation du carrousel.");
        } finally {
            setTimeout(() => {
                setAgendaSlide(prevSlide);
                setIsDownloading(false);
                generateImage();
            }, 500);
        }
    };

    const downloadArtisteFestivalSlide = async (slideNumber: 1 | 2, format: TabType = (activeTab || 'PUBLICATION')) => {
        if (!canvasRef.current) return;
        setIsDownloading(true);
        const prevSlide = artisteFestivalSlide;
        try {
            setArtisteFestivalSlide(slideNumber);
            await new Promise(r => setTimeout(r, 60));
            await generateImage(format, true);
            const fileName = `${format === 'REEL' ? 'STORY' : 'POST'}-artiste-festival-slide${slideNumber}-${slideNumber === 1 ? 'cover' : 'spotlight'}.png`;
            const dataUrl = canvasRef.current.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) {
            console.error(e);
            setErrorMessage(`Erreur lors du téléchargement de la slide ${slideNumber}.`);
        } finally {
            setTimeout(() => {
                setArtisteFestivalSlide(prevSlide);
                setIsDownloading(false);
                generateImage();
            }, 400);
        }
    };

    const downloadArtisteFestivalCarousel = async (format: TabType = (activeTab || 'PUBLICATION')) => {
        if (!canvasRef.current) return;
        setIsDownloading(true);
        const prevSlide = artisteFestivalSlide;
        try {
            // 1. Slide 1 (Cover)
            setArtisteFestivalSlide(1);
            await new Promise(r => setTimeout(r, 60));
            await generateImage(format, true);
            const dataUrl1 = canvasRef.current.toDataURL('image/png');
            const a1 = document.createElement('a');
            a1.href = dataUrl1;
            a1.download = `${format === 'REEL' ? 'STORY' : 'POST'}-artiste-festival-slide1-cover.png`;
            document.body.appendChild(a1);
            a1.click();
            document.body.removeChild(a1);

            // 2. Slide 2 (Spotlight)
            await new Promise(r => setTimeout(r, 350));
            setArtisteFestivalSlide(2);
            await new Promise(r => setTimeout(r, 60));
            await generateImage(format, true);
            const dataUrl2 = canvasRef.current.toDataURL('image/png');
            const a2 = document.createElement('a');
            a2.href = dataUrl2;
            a2.download = `${format === 'REEL' ? 'STORY' : 'POST'}-artiste-festival-slide2-spotlight.png`;
            document.body.appendChild(a2);
            a2.click();
            document.body.removeChild(a2);
        } catch (e) {
            console.error(e);
            setErrorMessage("Erreur lors de l'exportation du carrousel.");
        } finally {
            setTimeout(() => {
                setArtisteFestivalSlide(prevSlide);
                setIsDownloading(false);
                generateImage();
            }, 500);
        }
    };

    const downloadEventsSlide = async (slideNumber: 1 | 2, format: TabType = (activeTab || 'PUBLICATION')) => {
        if (!canvasRef.current) return;
        setIsDownloading(true);
        const prevSlide = eventsSlide;
        try {
            setEventsSlide(slideNumber);
            await new Promise(r => setTimeout(r, 60));
            await generateImage(format, true);
            const fileName = `${format === 'REEL' ? 'STORY' : 'POST'}-event-slide${slideNumber}-${slideNumber === 1 ? 'post' : 'affiche'}.png`;
            const dataUrl = canvasRef.current.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) {
            console.error(e);
            setErrorMessage(`Erreur lors du téléchargement de la slide ${slideNumber}.`);
        } finally {
            setTimeout(() => {
                setEventsSlide(prevSlide);
                setIsDownloading(false);
                generateImage();
            }, 400);
        }
    };

    const downloadEventsCarousel = async (format: TabType = (activeTab || 'PUBLICATION')) => {
        if (!canvasRef.current) return;
        setIsDownloading(true);
        const prevSlide = eventsSlide;
        try {
            // 1. Slide 1 (Post)
            setEventsSlide(1);
            await new Promise(r => setTimeout(r, 60));
            await generateImage(format, true);
            const dataUrl1 = canvasRef.current.toDataURL('image/png');
            const a1 = document.createElement('a');
            a1.href = dataUrl1;
            a1.download = `${format === 'REEL' ? 'STORY' : 'POST'}-event-slide1-post.png`;
            document.body.appendChild(a1);
            a1.click();
            document.body.removeChild(a1);

            // 2. Slide 2 (Affiche)
            await new Promise(r => setTimeout(r, 350));
            setEventsSlide(2);
            await new Promise(r => setTimeout(r, 60));
            await generateImage(format, true);
            const dataUrl2 = canvasRef.current.toDataURL('image/png');
            const a2 = document.createElement('a');
            a2.href = dataUrl2;
            a2.download = `${format === 'REEL' ? 'STORY' : 'POST'}-event-slide2-affiche.png`;
            document.body.appendChild(a2);
            a2.click();
            document.body.removeChild(a2);
        } catch (e) {
            console.error(e);
            setErrorMessage("Erreur lors de l'exportation du carrousel.");
        } finally {
            setTimeout(() => {
                setEventsSlide(prevSlide);
                setIsDownloading(false);
                generateImage();
            }, 500);
        }
    };

    const downloadEditorialSlide = async (slideNumber: number, format: TabType = (activeTab || 'PUBLICATION')) => {
        if (!canvasRef.current) return;
        setIsDownloading(true);
        const prevSlide = editorialSlide;
        try {
            setEditorialSlide(slideNumber);
            await new Promise(r => setTimeout(r, 60));
            await generateImage(format, true);
            const isMusicTheme = (theme === 'MUSIQUE');
            const suffix = slideNumber === 1 
                ? (isMusicTheme ? 'annonce' : 'cover') 
                : (isMusicTheme ? 'track-cover' : `detail-slide${slideNumber}`);
            const fileName = `${format === 'REEL' ? 'STORY' : 'POST'}-${theme.toLowerCase().replace(/\s+/g, '-')}-slide${slideNumber}-${suffix}.png`;
            const dataUrl = canvasRef.current.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) {
            console.error(e);
            setErrorMessage(`Erreur lors du téléchargement de la slide ${slideNumber}.`);
        } finally {
            setTimeout(() => {
                setEditorialSlide(prevSlide);
                setIsDownloading(false);
                generateImage();
            }, 400);
        }
    };

    const downloadEditorialCarousel = async (format: TabType = (activeTab || 'PUBLICATION')) => {
        if (!canvasRef.current) return;
        setIsDownloading(true);
        const prevSlide = editorialSlide;
        const isMusicTheme = (theme === 'MUSIQUE');
        const numSlides = isMusicTheme ? (1 + musicTracks.length) : (2 + extraEditorialSlides.length);
        try {
            for (let s = 1; s <= numSlides; s++) {
                if (s > 1) await new Promise(r => setTimeout(r, 350));
                setEditorialSlide(s);
                await new Promise(r => setTimeout(r, 60));
                await generateImage(format, true);
                const dataUrl = canvasRef.current.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = dataUrl;
                const suffix = s === 1 ? (isMusicTheme ? 'annonce' : 'cover') : (isMusicTheme ? `track-${s - 1}-cover` : `detail-slide${s}`);
                a.download = `${format === 'REEL' ? 'STORY' : 'POST'}-${theme.toLowerCase().replace(/\s+/g, '-')}-slide${s}-${suffix}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        } catch (e) {
            console.error(e);
            setErrorMessage("Erreur lors de l'exportation du carrousel.");
        } finally {
            setTimeout(() => {
                setEditorialSlide(prevSlide);
                setIsDownloading(false);
                generateImage();
            }, 500);
        }
    };

    const downloadPromoFormat = async (format: TabType) => {
        if (!canvasRef.current) return;
        setIsDownloading(true);
        try {
            await generateImage(format, 'PROMO');
            const fileName = `${format === 'REEL' ? 'STORY' : 'POST'}-promo-${Date.now()}.png`;
            const isMobile = /iPad|iPhone|iPod|Android/.test(navigator.userAgent) || ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0);

            if (isMobile && navigator.share) {
                try {
                    const blob = await new Promise<Blob | null>(resolve => canvasRef.current!.toBlob(resolve, 'image/png'));
                    if (blob) {
                        const file = new File([blob], fileName, { type: 'image/png' });
                        await navigator.share({
                            files: [file],
                            title: 'Dropsiders Visual'
                        });
                        return; // If Share succeeds, stop here
                    }
                } catch (e) {
                    console.log('Share API denied or failed', e);
                }
            }

            // Default fallback for desktop or if Share failed
            const dataUrl = canvasRef.current!.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) {
            console.error(e);
            setErrorMessage("Erreur lors de l'exportation PNG.");
        } finally {
            setTimeout(() => {
                setIsDownloading(false);
                generateImage();
            }, 500);
        }
    };

    // Themes that use a bright/light color and need black text on the canvas
    const LIGHT_TEXT_THEMES: ThemeType[] = ['TOP 5 ARTISTE', 'TOP 5 STYLES'];

    const handleSetTheme = (newTheme: ThemeType) => {
        setIsCarouselPromoActive(false);
        if (newTheme === 'MAP') {
            setActiveTab('REEL');
        }
        setTheme(newTheme);
        if (newTheme !== 'PROMO') {
            setPromoCategory(newTheme);
        }
        if (newTheme === 'JEU') {
            setCustomText('DE QUEL CLIP CETTE IMAGE EST TIRÉE ?');
        } else if (newTheme === 'JEU_FESTIVAL') {
            setCustomText('DANS QUEL FESTIVAL PEUT-ON VOIR CETTE STAGE ?');
        } else if (newTheme === 'CONCOURS') {
            if (!conseilsTitle || conseilsTitle === 'LE TITRE ICI') {
                const defT = '*1X PASS VIP 3 JOURS* À GAGNER';
                setConseilsTitle(defT);
                setCustomText(defT);
            }
            if (!conseilsSubtext) {
                setConseilsSubtext('POUR PARTICIPER :\n1. *Like* ce post & *abonne-toi* à @dropsiders\n2. *Identifie 2 potes* en commentaire\n3. *Partage en story* pour doubler tes chances !\nTirage au sort le dimanche 25 octobre.');
            }
        } else if (newTheme === 'TRACKLIST') {
            if (!customText || !customText.includes('\n')) {
                setCustomText('ODD MOB\nCRSSD FESTIVAL\nSAN DIEGO, USA, 2026');
            }
        }
        setTextColor(LIGHT_TEXT_THEMES.includes(newTheme) ? '#000000' : '#ffffff');
    };

    const bgPositionControls = (
        <div className={`bg-white/5 border border-white/10 rounded-2xl p-3.5 transition-all ${bgPositionOptionsOpen ? 'space-y-3' : ''}`}>
            <div className="flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={() => setBgPositionOptionsOpen(o => !o)}
                    className="flex-1 flex items-center justify-between gap-2 group min-w-0"
                    title={bgPositionOptionsOpen ? 'Masquer le centrage' : 'Afficher le centrage'}
                >
                    <span className="text-[9px] font-black text-gray-400 group-hover:text-white uppercase tracking-widest flex items-center gap-1.5 transition-colors truncate">
                        🎯 Centrage Image (X / Y)
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                        <AccordionBadge
                            active={bgOffsetX !== 0 || bgOffsetY !== 0}
                            label={bgOffsetX !== 0 || bgOffsetY !== 0 ? '● Décalé' : 'Centré'}
                        />
                        <AccordionChevron open={bgPositionOptionsOpen} />
                    </span>
                </button>
                <button
                    onClick={() => {
                        setBgOffsetX(0);
                        setBgOffsetY(0);
                        setImgLayoutMode('1_PAR_LIGNE');
                        setTimeout(() => generateImage(), 50);
                    }}
                    className="px-2.5 py-1 bg-neon-cyan/10 border border-neon-cyan/30 rounded-xl text-[8px] font-black uppercase text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all flex items-center gap-1 shadow-sm active:scale-95"
                    title="Réinitialiser et centrer l'image au milieu"
                >
                    <RotateCcw className="w-3 h-3" /> Centrer
                </button>
            </div>

            {bgPositionOptionsOpen && (
            <div className="space-y-2 pt-1">

                <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-black uppercase text-gray-400">
                        <span>Position Horizontale (Gauche / Droite)</span>
                        <span className="text-white font-mono">{bgOffsetX}px</span>
                    </div>
                    <input
                        type="range" min="-800" max="800" value={bgOffsetX}
                        onChange={e => {
                            setBgOffsetX(parseInt(e.target.value));
                            setTimeout(() => generateImage(), 50);
                        }}
                        onMouseDown={() => setIsSlidingPosition(true)}
                        onMouseUp={() => setIsSlidingPosition(false)}
                        onTouchStart={() => setIsSlidingPosition(true)}
                        onTouchEnd={() => setIsSlidingPosition(false)}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                    />
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-black uppercase text-gray-400">
                        <span>Position Verticale (Haut / Bas)</span>
                        <span className="text-white font-mono">{bgOffsetY}px</span>
                    </div>
                    <input
                        type="range" min="-800" max="800" value={bgOffsetY}
                        onChange={e => {
                            setBgOffsetY(parseInt(e.target.value));
                            setTimeout(() => generateImage(), 50);
                        }}
                        onMouseDown={() => setIsSlidingPosition(true)}
                        onMouseUp={() => setIsSlidingPosition(false)}
                        onTouchStart={() => setIsSlidingPosition(true)}
                        onTouchEnd={() => setIsSlidingPosition(false)}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                    />
                </div>
            </div>
            )}
        </div>
    );

    const bgAnimationControl = (
        <div className={`bg-white/5 border border-white/10 rounded-2xl p-3.5 transition-all ${animOptionsOpen ? 'space-y-3' : ''}`}>
            <button
                type="button"
                onClick={() => setAnimOptionsOpen(o => !o)}
                className="w-full flex items-center justify-between gap-2 group"
                title={animOptionsOpen ? 'Masquer les options d\'animation' : 'Afficher les options d\'animation'}
            >
                <span className="text-[9px] font-black text-gray-400 group-hover:text-white uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                    🎬 Animation du Fond (Reels / MP4)
                </span>
                <span className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded-md text-[7.5px] font-black uppercase tracking-wider border ${
                        bgAnimation !== 'NONE'
                            ? 'bg-neon-cyan/15 border-neon-cyan/40 text-neon-cyan shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                            : 'bg-white/5 border-white/10 text-gray-500'
                    }`}>
                        {bgAnimation !== 'NONE' ? '● Active' : 'Statique'}
                    </span>
                    <span className={`text-[10px] text-gray-400 group-hover:text-white transition-transform duration-300 ${animOptionsOpen ? 'rotate-180' : ''}`}>▾</span>
                </span>
            </button>

            {animOptionsOpen && (<>
            <div className="grid grid-cols-4 gap-1.5">
                {[
                    { id: 'NONE', label: 'Statique', icon: '⏹️', activeClass: 'bg-white text-black border-white shadow-sm' },
                    { id: 'ZOOM_IN', label: 'Zoom Lent', icon: '🔍', activeClass: 'bg-neon-red border-neon-red text-white shadow-[0_0_12px_rgba(255,0,51,0.5)]' },
                    { id: 'ZOOM_OUT', label: 'Dézoom', icon: '🔎', activeClass: 'bg-neon-cyan border-neon-cyan text-black shadow-[0_0_12px_rgba(0,240,255,0.5)]' },
                    { id: 'PAN_LEFT', label: 'Pan Gauche', icon: '⬅️', activeClass: 'bg-neon-purple border-neon-purple text-white shadow-[0_0_12px_rgba(176,38,255,0.5)]' },
                    { id: 'PAN_RIGHT', label: 'Pan Droite', icon: '➡️', activeClass: 'bg-amber-400 border-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.5)]' },
                    { id: 'PULSE', label: 'Pulsation', icon: '💓', activeClass: 'bg-emerald-400 border-emerald-400 text-black shadow-[0_0_12px_rgba(52,211,153,0.5)]' },
                    { id: 'BREATHE', label: 'Flottement', icon: '🌊', activeClass: 'bg-pink-500 border-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)]' },
                    { id: 'GLITCH', label: 'Cyber Shake', icon: '⚡', activeClass: 'bg-indigo-500 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]' },
                ].map(anim => (
                    <button
                        key={anim.id}
                        type="button"
                        onClick={() => {
                            setBgAnimation(anim.id as BgAnimType);
                            animStartTimeRef.current = Date.now();
                            setAnimReplayKey(k => k + 1);
                        }}
                        className={`py-2 px-1 rounded-xl text-[8.5px] font-black uppercase border transition-all flex flex-col items-center justify-center gap-0.5 ${
                            bgAnimation === anim.id
                                ? anim.activeClass
                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        <span className="text-[11px] leading-none">{anim.icon}</span>
                        <span className="truncate w-full text-center">{anim.label}</span>
                    </button>
                ))}
            </div>

            {bgAnimation !== 'NONE' && (
                <div className="pt-0.5">
                    <p className="text-[8px] text-gray-400 italic px-1">
                        ✨ Animation de fond active ! Retrouvez le bouton d'export dans la section <span className="text-neon-cyan font-bold">Vidéo Animée (MP4)</span> ci-dessous.
                    </p>
                </div>
            )}
            </>)}
        </div>
    );

    const quizColorControls = theme === 'JEU' ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    🎨 Double Couleurs Quiz
                </span>
                <div className="w-5 h-5 rounded-full border border-white/20 shadow-sm" style={{ background: `linear-gradient(135deg, ${quizColor1}, ${quizColor2})` }} />
            </div>

            {/* Color Presets */}
            <div className="grid grid-cols-2 gap-1.5">
                {[
                    { label: 'Cyan & Violet', c1: '#38bdf8', c2: '#a855f7' },
                    { label: 'Rouge & Or', c1: '#ff0033', c2: '#ffaa00' },
                    { label: 'Bleu & Émeraude', c1: '#00f0ff', c2: '#39ff14' },
                    { label: 'Fuchsia & Rose', c1: '#c026d3', c2: '#f43f5e' },
                    { label: 'Sunset Red', c1: '#ff6700', c2: '#ff0055' },
                ].map(p => (
                    <button
                        key={p.label}
                        onClick={() => {
                            setQuizColor1(p.c1);
                            setQuizColor2(p.c2);
                            setTimeout(() => generateImage(), 50);
                        }}
                        className="py-1.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[8px] font-black uppercase text-white flex items-center gap-1.5 transition-all"
                    >
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: `linear-gradient(135deg, ${p.c1}, ${p.c2})` }} />
                        <span className="truncate">{p.label}</span>
                    </button>
                ))}
            </div>

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                <div className="space-y-1">
                    <span className="text-[7px] font-black uppercase text-gray-400 block">Couleur 1</span>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1.5 rounded-xl">
                        <input
                            type="color"
                            value={quizColor1}
                            onChange={e => {
                                setQuizColor1(e.target.value);
                                setTimeout(() => generateImage(), 50);
                            }}
                            className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-[8px] font-mono text-white uppercase">{quizColor1}</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <span className="text-[7px] font-black uppercase text-gray-400 block">Couleur 2</span>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1.5 rounded-xl">
                        <input
                            type="color"
                            value={quizColor2}
                            onChange={e => {
                                setQuizColor2(e.target.value);
                                setTimeout(() => generateImage(), 50);
                            }}
                            className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-[8px] font-mono text-white uppercase">{quizColor2}</span>
                    </div>
                </div>
            </div>
        </div>
    ) : null;

    // Shared content blocks (used in both mobile & desktop)
    const themeButtons = (
        <div className="grid grid-cols-3 gap-1.5">
            <button onClick={() => handleSetTheme('NEWS')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'NEWS' ? 'bg-neon-red/20 border-neon-red text-neon-red' : 'bg-white/5 border-white/5 text-gray-400'}`}>NEWS</button>
            <button onClick={() => handleSetTheme('FOCUS')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'FOCUS' ? 'bg-[#ffaa00]/20 border-[#ffaa00] text-[#ffaa00]' : 'bg-white/5 border-white/10 text-gray-400'}`}>FOCUS</button>
            <button onClick={() => handleSetTheme('MUSIQUE')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'MUSIQUE' ? 'bg-neon-green/20 border-neon-green text-neon-green' : 'bg-white/5 border-white/5 text-gray-400'}`}>MUSIQUE</button>
            <button onClick={() => handleSetTheme('RECAP')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'RECAP' ? 'bg-[#c026d3]/20 border-[#c026d3] text-[#c026d3]' : 'bg-white/5 border-white/5 text-gray-400'}`}>RÉCAP</button>
            <button onClick={() => { handleSetTheme('EVENTS'); setEventsSlide(1); }} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'EVENTS' || theme === 'AFFICHE' ? 'bg-[#ff007f]/20 border-[#ff007f] text-[#ff007f] shadow-[0_0_12px_rgba(255,0,127,0.35)]' : 'bg-white/5 border-white/10 text-gray-400'}`}>EVENTS</button>
            <button onClick={() => handleSetTheme('CONCOURS')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'CONCOURS' ? 'bg-[#008cff]/20 border-[#008cff] text-[#008cff] shadow-[0_0_12px_rgba(0,140,255,0.35)]' : 'bg-white/5 border-white/10 text-gray-400'}`}>CONCOURS</button>
            <button onClick={() => handleSetTheme('LIVESTREAM')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'LIVESTREAM' ? 'bg-pink-500/20 border-pink-500 text-pink-500' : 'bg-white/5 border-white/5 text-gray-400'}`}>DIRECT</button>
            <button onClick={() => handleSetTheme('PLANNING')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'PLANNING' ? 'bg-[#ff3700]/20 border-[#ff3700] text-[#ff3700] shadow-[0_0_12px_rgba(255,55,0,0.35)]' : 'bg-white/5 border-white/5 text-gray-400'}`}>AGENDA</button>
            <button onClick={() => handleSetTheme('INTERVIEW')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'INTERVIEW' ? 'bg-white/20 border-white text-white shadow-[0_0_12px_rgba(255,255,255,0.35)]' : 'bg-white/5 border-white/5 text-gray-400'}`}>INTERVIEW</button>
            <button onClick={() => { handleSetTheme('ARTISTE FESTIVAL'); setArtisteFestivalSlide(2); }} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'SPOTLIGHT' || (theme === 'ARTISTE FESTIVAL' && artisteFestivalSlide === 2) ? 'bg-neon-red/20 border-neon-red text-neon-red shadow-[0_0_12px_rgba(255,0,51,0.35)]' : 'bg-white/5 border-white/10 text-gray-400'}`}>SPOTLIGHT</button>
            <button onClick={() => handleSetTheme('CITATION')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'CITATION' ? 'bg-white/20 border-white text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}>CITATION</button>
            <button onClick={() => { handleSetTheme('ARTISTE FESTIVAL'); setArtisteFestivalSlide(1); }} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'ARTISTE FESTIVAL' && artisteFestivalSlide === 1 ? 'bg-neon-red/20 border-neon-red text-neon-red shadow-[0_0_12px_rgba(255,0,51,0.35)]' : 'bg-white/5 border-white/10 text-gray-400'}`}>ARTISTE FESTIVAL</button>
            <button
                onClick={() => handleSetTheme('JEU')}
                style={theme === 'JEU' ? { background: `linear-gradient(135deg, ${quizColor1}44, ${quizColor2}44)`, borderColor: quizColor1 } : {}}
                className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'JEU' ? 'text-white shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'bg-white/5 border-white/10 text-gray-400'}`}
            >
                DEVINE LE CLIP
            </button>
            <button
                onClick={() => handleSetTheme('JEU_FESTIVAL')}
                className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'JEU_FESTIVAL' ? 'bg-[#ffaa00]/20 border-[#ffaa00] text-[#ffaa00] shadow-[0_0_15px_rgba(255,170,0,0.4)]' : 'bg-white/5 border-white/10 text-gray-400'}`}
            >
                DEVINE LE FESTIVAL
            </button>
            <button onClick={() => handleSetTheme('TOP 100 DROPSIDERS')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'TOP 100 DROPSIDERS' ? 'bg-[#ffe600]/20 border-[#ffe600] text-[#ffe600]' : 'bg-white/5 border-white/10 text-gray-400'}`}>TOP 100 DROPSIDERS</button>
            
            {activeTab === 'REEL' && (
                <>
                    <button onClick={() => handleSetTheme('REELS')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'REELS' || theme === 'CONSEILS' ? 'bg-neon-red/20 border-neon-red text-neon-red shadow-[0_0_12px_rgba(255,0,51,0.35)]' : 'bg-white/5 border-white/10 text-gray-400'}`}>REELS</button>
                    <button onClick={() => handleSetTheme('TRACKLIST')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'TRACKLIST' ? 'bg-orange-500/20 border-orange-500 text-orange-500 shadow-[0_0_12px_rgba(255,120,0,0.35)]' : 'bg-white/5 border-white/5 text-gray-400'}`}>TRACKLIST</button>
                    <button onClick={() => handleSetTheme('MAP')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'MAP' ? 'bg-neon-red/20 border-neon-red text-neon-red animate-pulse' : 'bg-white/5 border-white/5 text-gray-400'}`}>CARTE (STORY)</button>
                </>
            )}

        </div>
    );

    const styleMusicButtons = activeTab === 'REEL' && theme === 'TOP 5 STYLES' ? (
        <div className="space-y-4">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Style de musique</span>
            <div className="flex flex-wrap gap-2">
                {STYLE_PRESETS.map(s => (
                    <button key={s.name} onClick={() => setThemeColor(s)}
                        className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase transition-all border-2 ${themeColor?.name === s.name ? 'bg-white text-black border-white' : 'bg-black/40 border-white/10 hover:border-white/30'}`}
                        style={themeColor?.name === s.name ? {} : { borderColor: `rgba(${s.grad}, 0.3)`, color: s.color }}>
                        {s.name}
                    </button>
                ))}
                <button onClick={() => setThemeColor(null)} className="px-2 text-[8px] font-bold text-gray-500 uppercase hover:text-white transition-all underline underline-offset-4 decoration-neon-red">Reset</button>
            </div>
        </div>
    ) : null;

    const top5Editor = (
        <div className="space-y-4">
            {top5Items.map((item, i) => (
                <div key={i} className={`p-4 rounded-2xl border transition-all cursor-pointer ${currentPreviewIndex === i ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/5'}`} onClick={() => setCurrentPreviewIndex(i)}>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <input value={item.main} onChange={e => { const n = [...top5Items]; n[i].main = e.target.value; setTop5Items(n); }} placeholder="ARTISTE" spellCheck="true" autoCorrect="on" autoCapitalize="words" className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold" />
                        <input value={item.sub} onChange={e => { const n = [...top5Items]; n[i].sub = e.target.value; setTop5Items(n); }} placeholder="TITRE" spellCheck="true" autoCorrect="on" autoCapitalize="words" className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold" />
                    </div>
                    {theme === 'TOP 5 ARTISTE' && (
                        <input value={item.value} onChange={e => { const n = [...top5Items]; n[i].value = e.target.value; setTop5Items(n); }} placeholder="STREAMS (MILLIONS)" spellCheck="true" autoCorrect="on" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold mb-2" />
                    )}
                    <input value={item.spotifyUrl} onChange={e => { const n = [...top5Items]; n[i].spotifyUrl = e.target.value; setTop5Items(n); }} placeholder="LIEN SPOTIFY / VIDEO" spellCheck="false" autoCorrect="off" autoCapitalize="none" className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-[10px] text-[#1DB954] font-bold mb-2" />
                    <div className="flex items-center gap-2">
                        <button onClick={(e) => {
                            e.stopPropagation();
                            setR2TargetIdx(i);
                            setR2TargetType('top5');
                            setIsR2ModalOpen(true);
                        }} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                            <Upload className="w-3 h-3 text-neon-red" /> {item.photo ? 'Modifier Photo' : 'Ajouter Photo (Cloud)'}
                        </button>
                        {item.photo && (
                            <button onClick={(e) => { e.stopPropagation(); const n = [...top5Items]; n[i].photo = ''; setTop5Items(n); }}
                                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );



    const handleConvertPlanningTimes = () => {
        if (planningTimezoneOffset === 0) return;
        const next = planningItems.map(item => {
            let cleaned = (item.time || '00:00').trim().toLowerCase();
            const isPM = cleaned.includes('pm') || cleaned.includes(' p.m');
            cleaned = cleaned.replace('am', '').replace('pm', '').replace(' a.m', '').replace(' p.m', '').trim();
            cleaned = cleaned.replace('.', ':').replace('h', ':');

            let [hStr, mStr] = cleaned.split(':');
            let h = parseInt(hStr || '0', 10);
            let m = parseInt(mStr || '0', 10);
            if (isNaN(h)) h = 0;
            if (isNaN(m)) m = 0;
            if (isPM && h < 12) h += 12;
            if (!isPM && h === 12) h = 0;

            h = (h + planningTimezoneOffset) % 24;
            if (h < 0) h += 24;
            
            return { ...item, time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}` };
        });
        setPlanningItems(next);
        setPlanningTimezoneOffset(0);
    };

    const fetchTakeover = async () => {
        setIsTakeoverLoading(true);
        try {
            const resp = await fetch('/api/takeover-settings');
            const data = await resp.json();
            
            // The API returns settings at the root, and lineup is a stringified JSON
            let parsedLineup = [];
            if (data.lineup) {
                try {
                    const l = typeof data.lineup === 'string' ? JSON.parse(data.lineup) : data.lineup;
                    parsedLineup = Array.isArray(l) ? l : [];
                } catch (e) { console.error(e); }
            }

            if (parsedLineup.length > 0 || (data.streams && data.streams.length > 0)) {
                setTakeoverData({
                    lineup: parsedLineup,
                    streams: data.streams || []
                });
            } else {
              setErrorMessage("Aucune donnée de planning trouvée.");
            }
        } catch (e) {
            console.error(e);
            setErrorMessage("Erreur lors de la récupération du Live Takeover");
        } finally {
            setIsTakeoverLoading(false);
        }
    };

    const handleImportFromTakeover = (stageMatch: string, day: string) => {
        if (!takeoverData) return;
        
        const filtered = takeoverData.lineup
            .filter(item => {
                const itemStage = (item.stage || '').toUpperCase();
                const target = stageMatch.toUpperCase();
                return (itemStage === target) && item.day === day;
            })
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

        if (filtered.length === 0) {
            setErrorMessage(`Aucun artiste trouvé sur ${stageMatch} le ${day}`);
            return;
        }

        const items = filtered.map(item => ({
            time: item.startTime || '00:00',
            artist: item.artist || 'INCONNU'
        }));

        setPlanningItems(items);
        setCustomText(`LINE-UP ${stageMatch.toUpperCase()}`);
        
        const [, m, d] = day.split('-');
        const dateNames = ['JAN', 'FEV', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUIL', 'AOUT', 'SEPT', 'OCT', 'NOV', 'DEC'];
        setPlanningDate(`${d} ${dateNames[parseInt(m) - 1] || '??'}`);
        
        setTakeoverData(null);
    };

    const parseAgendaDate = (dateStr: string) => {
        if (!dateStr) return null;
        const clean = dateStr.split('T')[0];
        const parts = clean.split('-');
        if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            return new Date(y, m, d);
        }
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? null : parsed;
    };

    const getEventMonthName = (event: any): string => {
        if (event.month && typeof event.month === 'string' && event.month.trim()) {
            return event.month.trim().toUpperCase();
        }
        const rawDate = event.startDate || event.date;
        if (rawDate) {
            const d = parseAgendaDate(rawDate);
            if (d) {
                const MONTHS_FR = ['JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'];
                return MONTHS_FR[d.getMonth()] || 'OCTOBRE';
            }
        }
        return 'OCTOBRE';
    };

    const formatEventDayForVisual = (event: any): string => {
        const rawDate = event.startDate || event.date;
        if (!rawDate) return 'DATE';
        
        const start = parseAgendaDate(rawDate);
        if (!start) return 'DATE';
        
        const DAYS_SHORT = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
        const MONTHS_SHORT = ['JAN', 'FÉV', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'];
        
        const dayName = DAYS_SHORT[start.getDay()];
        const dayNum = start.getDate();
        
        if (event.endDate && event.endDate !== rawDate) {
            const end = parseAgendaDate(event.endDate);
            if (end && end.getDate() !== dayNum) {
                const endDayNum = end.getDate();
                const startMonth = MONTHS_SHORT[start.getMonth()];
                const endMonth = MONTHS_SHORT[end.getMonth()];
                if (start.getMonth() === end.getMonth()) {
                    return `${dayNum}-${endDayNum} ${startMonth}`;
                }
                return `${dayNum} ${startMonth}-${endDayNum} ${endMonth}`;
            }
        }
        
        return `${dayName} ${dayNum}`;
    };

    const fetchSiteAgenda = async () => {
        setIsSiteAgendaLoading(true);
        try {
            const res = await fetch('/api/agenda');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    const sorted = [...data].sort((a, b) => {
                        const dateA = new Date(a.startDate || a.date || 0).getTime();
                        const dateB = new Date(b.startDate || b.date || 0).getTime();
                        return dateA - dateB;
                    });
                    setSiteAgendaEvents(sorted);
                }
            } else {
                setErrorMessage("Impossible de récupérer l'agenda du site");
            }
        } catch (e) {
            console.error('Failed to load site agenda:', e);
            setErrorMessage("Erreur réseau lors de la récupération de l'agenda");
        } finally {
            setIsSiteAgendaLoading(false);
        }
    };

    const handleImportFromSiteAgenda = (eventsToImport: any[], replace: boolean = true) => {
        if (!eventsToImport || eventsToImport.length === 0) return;
        
        const newItems = eventsToImport.map(ev => {
            const formattedDay = formatEventDayForVisual(ev);
            const titleStr = (ev.title || '').trim().toUpperCase();
            
            let artistsStr = '';
            if (Array.isArray(ev.lineUp)) {
                artistsStr = ev.lineUp.filter(Boolean).join(' / ').toUpperCase();
            } else if (typeof ev.lineUp === 'string' && ev.lineUp.trim()) {
                artistsStr = ev.lineUp.trim().toUpperCase();
            } else if (ev.description) {
                artistsStr = ev.description.trim().toUpperCase();
            }
            
            const genreStr = (ev.genre || ev.type || '').trim().toUpperCase();
            const venueStr = (ev.venue || ev.location || (ev.country ? `${ev.location || ''} (${ev.country})` : '')).trim().toUpperCase();
            
            return {
                day: formattedDay,
                time: formattedDay,
                title: titleStr,
                artist: titleStr,
                artists: artistsStr,
                genre: genreStr,
                venue: venueStr
            };
        });
        
        if (replace) {
            setPlanningItems(newItems);
        } else {
            setPlanningItems(prev => [...prev, ...newItems]);
        }
        
        if (autoSyncAgendaMonth && eventsToImport.length > 0) {
            const detectedMonth = getEventMonthName(eventsToImport[0]);
            if (detectedMonth) {
                setAgendaMonth(detectedMonth);
                setPlanningDate(detectedMonth);
            }
        }
        
        setIsAgendaPickerOpen(false);
        setSelectedSiteEventIds([]);
    };

    const availableAgendaMonths = useMemo(() => {
        const set = new Set<string>();
        siteAgendaEvents.forEach(e => {
            const m = getEventMonthName(e);
            if (m) set.add(m);
        });
        return Array.from(set);
    }, [siteAgendaEvents]);

    const filteredSiteAgendaList = useMemo(() => {
        let list = siteAgendaEvents;
        if (agendaPickerMonth !== 'ALL') {
            list = list.filter(e => getEventMonthName(e) === agendaPickerMonth);
        }
        if (agendaPickerSearch.trim()) {
            const q = agendaPickerSearch.toLowerCase().trim();
            list = list.filter(e => {
                const title = (e.title || '').toLowerCase();
                const venue = (e.venue || '').toLowerCase();
                const loc = (e.location || '').toLowerCase();
                const genre = (e.genre || '').toLowerCase();
                const country = (e.country || '').toLowerCase();
                const artists = Array.isArray(e.lineUp) ? e.lineUp.join(' ').toLowerCase() : (e.lineUp || '').toLowerCase();
                return title.includes(q) || venue.includes(q) || loc.includes(q) || genre.includes(q) || country.includes(q) || artists.includes(q);
            });
        }
        return list;
    }, [siteAgendaEvents, agendaPickerMonth, agendaPickerSearch]);

    const interviewEditor = (
        <div className="space-y-3">
            <textarea 
                value={customText} 
                onChange={e => setCustomText(e.target.value)} 
                placeholder={`[NOM DE L'ARTISTE]\n[SOUS TITRE / DESCRIPTION]`} 
                spellCheck="true"
                autoCorrect="on"
                autoCapitalize="sentences"
                className="w-full h-24 bg-white/10 border border-white/20 rounded-xl p-3 text-white font-black italic uppercase text-xs mb-2 transition-all focus:border-neon-cyan focus:bg-white/[0.15]" 
            />
            <div className="flex gap-2">
                <button onClick={() => {
                    setR2TargetType('logo');
                    setIsR2ModalOpen(true);
                }} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4 text-neon-cyan" /> {artistLogo ? 'Modifier Logo Artiste' : 'Ajouter Logo Artiste (Cloud)'}
                </button>
                {artistLogo && (
                    <button onClick={() => { setArtistLogo(''); artistLogoRef.current = null; generateImage(); }} className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );

    const MONTH_OPTIONS = [
        'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 
        'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'
    ];

    const planningEditor = (
        <div className="space-y-4">
            {/* 1. CARROUSEL SLIDE SWITCHER */}
            <div className="p-1.5 bg-black/60 border border-[#ff3700]/30 rounded-2xl flex gap-1 shadow-xl">
                <button
                    type="button"
                    onClick={() => setAgendaSlide(1)}
                    className={`flex-1 py-3 px-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${
                        agendaSlide === 1
                            ? 'bg-[#ff3700] text-black shadow-[0_0_15px_rgba(255,55,0,0.5)] scale-[1.02]'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <span className="text-xs">🎴</span> Slide 1 : Cover (Accroche)
                </button>
                <button
                    type="button"
                    onClick={() => setAgendaSlide(2)}
                    className={`flex-1 py-3 px-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${
                        agendaSlide === 2
                            ? 'bg-[#ff3700] text-black shadow-[0_0_15px_rgba(255,55,0,0.5)] scale-[1.02]'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <span className="text-xs">📋</span> Slide 2 : Événements ({planningItems.length})
                </button>
            </div>

            {/* Quick Carousel Download Bar */}
            <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[8px] font-bold text-gray-400 uppercase px-1">
                    <span>Export Carrousel Rapide</span>
                    <span className="text-[#ff3700]">Format {activeTab === 'REEL' ? 'Story' : 'Post (4:5)'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => downloadAgendaSlide(1)}
                        disabled={isDownloading}
                        className="py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-black text-[9px] uppercase rounded-lg transition-all flex items-center justify-center gap-1.5"
                    >
                        <Download className="w-3 h-3 text-[#ff3700]" /> Télécharger Slide 1
                    </button>
                    <button
                        type="button"
                        onClick={() => downloadAgendaSlide(2)}
                        disabled={isDownloading}
                        className="py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-black text-[9px] uppercase rounded-lg transition-all flex items-center justify-center gap-1.5"
                    >
                        <Download className="w-3 h-3 text-[#ff3700]" /> Télécharger Slide 2
                    </button>
                </div>
                <button
                    type="button"
                    onClick={() => downloadFullAgendaCarousel()}
                    disabled={isDownloading}
                    className="w-full py-2 bg-[#ff3700]/20 hover:bg-[#ff3700]/30 border border-[#ff3700]/40 text-[#ff3700] hover:text-white font-black text-[9px] uppercase rounded-lg transition-all flex items-center justify-center gap-2"
                >
                    <Sparkles className="w-3.5 h-3.5" /> Exporter le Carrousel Images (Slide 1 + 2)
                </button>
                
            </div>

            {agendaSlide === 1 ? (
                /* ══════════════════════════════════════════════════════════
                   EDITEUR SLIDE 1 : COVER (ACCROCHE INSTAGRAM)
                   ══════════════════════════════════════════════════════════ */
                <div className="space-y-3.5 animate-in fade-in duration-200">
                    {/* Mois & Année (Synchronisé) */}
                    <div className="p-3 bg-black/40 border border-white/10 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black text-[#ff3700] uppercase tracking-wider">
                                📅 Mois & Année de l'Agenda
                            </label>
                            <span className="text-[8px] font-bold text-gray-500 uppercase">Synchronisé sur les 2 slides</span>
                        </div>
                        {/* Sélecteur rapide des 12 mois */}
                        <div className="grid grid-cols-6 gap-1">
                            {MONTH_OPTIONS.map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => {
                                        setAgendaMonth(m);
                                        setPlanningDate(m);
                                    }}
                                    className={`py-1 rounded-lg text-[8px] font-black uppercase transition-all border ${
                                        agendaMonth.toUpperCase() === m
                                            ? 'bg-[#ff3700] border-[#ff3700] text-black shadow-[0_0_10px_rgba(255,55,0,0.5)]'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {m.slice(0, 4)}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                                <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Mois écrit</label>
                                <input
                                    value={agendaMonth}
                                    onChange={e => {
                                        setAgendaMonth(e.target.value);
                                        setPlanningDate(e.target.value);
                                    }}
                                    placeholder="ex: OCTOBRE"
                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-black uppercase text-xs focus:border-[#ff3700] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Année (optionnel)</label>
                                <input
                                    value={agendaCoverYear}
                                    onChange={e => setAgendaCoverYear(e.target.value)}
                                    placeholder="ex: 2026 (ou vide)"
                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-black uppercase text-xs focus:border-[#ff3700] focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Badge en haut à gauche */}
                    <div className="p-3 bg-black/40 border border-white/10 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black text-[#ff3700] uppercase tracking-wider">
                                🏷️ Badge Haut Gauche (Slide 1)
                            </label>
                            <span className="text-[8px] font-bold text-gray-500 uppercase">Capsule Cyber</span>
                        </div>
                        <input
                            value={agendaCoverBadge}
                            onChange={e => setAgendaCoverBadge(e.target.value)}
                            placeholder="ex: AGENDA FESTIVALS & SOIRÉES"
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-black uppercase text-xs focus:border-[#ff3700] focus:outline-none"
                        />
                        <div className="flex flex-wrap gap-1 pt-1">
                            {[
                                'AGENDA FESTIVALS & SOIRÉES',
                                'COUPS DE CŒUR DU MOIS',
                                'SÉLECTION DU MOIS',
                                'AGENDA DU MOIS',
                                'OÙ SORTIR ?'
                            ].map(b => (
                                <button
                                    key={b}
                                    type="button"
                                    onClick={() => setAgendaCoverBadge(b)}
                                    className={`px-2 py-0.5 rounded text-[7px] font-black uppercase transition-all border ${
                                        agendaCoverBadge.toUpperCase() === b
                                            ? 'bg-[#ff3700] border-[#ff3700] text-black shadow-sm'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {b}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grand Titre d'Accroche */}
                    <div className="p-3 bg-black/40 border border-white/10 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black text-[#ff3700] uppercase tracking-wider">
                                🔥 Grand Titre d'Accroche (Hook)
                            </label>
                            <span className="text-[8px] font-bold text-gray-500 uppercase">Texte principal géant</span>
                        </div>
                        <textarea
                            value={agendaCoverTitle}
                            onChange={e => setAgendaCoverTitle(e.target.value)}
                            placeholder="ex: ON VA OÙ CE MOIS-CI ?"
                            rows={2}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-black uppercase text-xs focus:border-[#ff3700] focus:outline-none resize-none"
                        />
                        <div className="flex flex-wrap gap-1 pt-1">
                            {[
                                'ON VA OÙ CE MOIS-CI ?',
                                'OÙ SORTIR CE MOIS-CI ?',
                                'TON AGENDA DU MOIS',
                                'LES INCONTOURNABLES',
                                'LE GUIDE DES SOIRÉES'
                            ].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setAgendaCoverTitle(t)}
                                    className={`px-2 py-0.5 rounded text-[7px] font-black uppercase transition-all border ${
                                        agendaCoverTitle.toUpperCase() === t
                                            ? 'bg-[#ff3700] border-[#ff3700] text-black shadow-sm'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Styles Musicaux / Genres */}
                    <div className="p-3 bg-black/40 border border-white/10 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black text-[#ff3700] uppercase tracking-wider">
                                🎧 Ambiance & Genres Musicaux
                            </label>
                            <span className="text-[8px] font-bold text-gray-500 uppercase">Pilule centrale</span>
                        </div>
                        <input
                            value={agendaCoverGenres}
                            onChange={e => setAgendaCoverGenres(e.target.value)}
                            placeholder="ex: HARD TECHNO • RAWSTYLE • MULTI-GENRES"
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-black uppercase text-xs focus:border-[#ff3700] focus:outline-none"
                        />
                        <div className="flex flex-wrap gap-1 pt-1">
                            {[
                                'HARD TECHNO • RAWSTYLE • MULTI-GENRES',
                                'TECHNO • HARD TECHNO • TRANCE',
                                'ELECTRO • HOUSE • TECH HOUSE',
                                'TOUS LES STYLES • TOUTES LES VILLES'
                            ].map(g => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setAgendaCoverGenres(g)}
                                    className={`px-2 py-0.5 rounded text-[7px] font-black uppercase transition-all border ${
                                        agendaCoverGenres.toUpperCase() === g
                                            ? 'bg-[#ff3700] border-[#ff3700] text-black shadow-sm'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Call to action Swipe */}
                    <div className="p-3 bg-black/40 border border-white/10 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black text-[#ff3700] uppercase tracking-wider">
                                ➡️ Call to Action (Bas de page)
                            </label>
                            <span className="text-[8px] font-bold text-gray-500 uppercase">Incitation Swipe</span>
                        </div>
                        <input
                            value={agendaCoverCta}
                            onChange={e => setAgendaCoverCta(e.target.value)}
                            placeholder="ex: Les meilleurs events et coups de cœur du mois rassemblés en un post ➡️"
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-black text-xs focus:border-[#ff3700] focus:outline-none"
                        />
                        <div className="flex flex-wrap gap-1 pt-1">
                            {[
                                'Les meilleurs events et coups de cœur du mois rassemblés en un post ➡️',
                                'Glisse pour découvrir la sélection complète ➡️',
                                'Swipe pour ton agenda du mois ➡️',
                                'Swipe pour voir toutes les dates ➡️'
                            ].map(cta => (
                                <button
                                    key={cta}
                                    type="button"
                                    onClick={() => setAgendaCoverCta(cta)}
                                    className={`px-2 py-0.5 rounded text-[7px] font-black transition-all border text-left ${
                                        agendaCoverCta === cta
                                            ? 'bg-[#ff3700] border-[#ff3700] text-black shadow-sm'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {cta}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setAgendaSlide(2)}
                        className="w-full py-3 bg-[#ff3700] hover:bg-[#ff5522] text-black font-black text-[10px] uppercase rounded-xl transition-all shadow-lg shadow-[#ff3700]/20 flex items-center justify-center gap-2"
                    >
                        Continuer vers la Slide 2 (Événements) ➔
                    </button>
                </div>
            ) : (
                /* ══════════════════════════════════════════════════════════
                   EDITEUR SLIDE 2 : ÉVÉNEMENTS & DATES
                   ══════════════════════════════════════════════════════════ */
                <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header: Mois & Badge en haut à gauche */}
            <div className="p-3.5 bg-black/40 border border-[#ff3700]/30 rounded-2xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#ff3700] uppercase tracking-widest flex items-center gap-1.5">
                        🏷️ Badge & Mois de l'Agenda
                    </span>
                    <span className="text-[9px] font-bold text-gray-500 uppercase">En-tête visuel</span>
                </div>

                {/* Badge en haut à gauche */}
                <div className="space-y-1.5 bg-black/30 p-2.5 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                        <label className="block text-[8px] font-black text-[#ff3700] uppercase tracking-wider">Texte du carré en haut à gauche</label>
                        <span className="text-[8px] font-bold text-gray-500 uppercase">Capsule Cyber Fluo</span>
                    </div>
                    <input
                        value={agendaBadgeText}
                        onChange={e => setAgendaBadgeText(e.target.value)}
                        placeholder="ex: COUPS DE CŒUR DU MOIS"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-black uppercase text-xs focus:border-[#ff3700] focus:outline-none"
                    />
                    {/* Suggestions rapides */}
                    <div className="flex flex-wrap gap-1 pt-1">
                        {[
                            'COUPS DE CŒUR DU MOIS',
                            'NOS EVENTS DU MOIS',
                            'EVENTS COUPS DE CŒUR',
                            'SÉLECTION DU MOIS',
                            'AGENDA DU MOIS',
                            'AGENDA'
                        ].map(badge => (
                            <button
                                key={badge}
                                type="button"
                                onClick={() => setAgendaBadgeText(badge)}
                                className={`px-2 py-0.5 rounded text-[7px] font-black uppercase transition-all border ${
                                    agendaBadgeText.toUpperCase() === badge
                                        ? 'bg-[#ff3700] border-[#ff3700] text-black shadow-[0_0_8px_rgba(255,55,0,0.5)]'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                {badge}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Mois affiché (Titre fluo creux)</span>
                </div>

                {/* Sélecteur rapide des 12 mois */}
                <div className="grid grid-cols-6 gap-1">
                    {MONTH_OPTIONS.map(m => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => {
                                setAgendaMonth(m);
                                setPlanningDate(m);
                            }}
                            className={`py-1 rounded-lg text-[8px] font-black uppercase transition-all border ${
                                agendaMonth.toUpperCase() === m
                                    ? 'bg-[#ff3700] border-[#ff3700] text-black shadow-[0_0_10px_rgba(255,55,0,0.5)]'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {m.slice(0, 4)}
                        </button>
                    ))}
                </div>

                {/* Champ personnalisé pour le mois + Action vider */}
                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Mois affiché (Titre central)</label>
                        <input
                            value={agendaMonth}
                            onChange={e => {
                                setAgendaMonth(e.target.value);
                                setPlanningDate(e.target.value);
                            }}
                            placeholder="ex: OCTOBRE"
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-black uppercase text-xs focus:border-[#ff3700] focus:outline-none"
                        />
                    </div>
                    {planningItems.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setPlanningItems([])}
                            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 h-[34px]"
                            title="Effacer tous les événements"
                        >
                            <Eraser className="w-3.5 h-3.5" /> Tout effacer
                        </button>
                    )}
                </div>
            </div>

            {/* Importer depuis l'Agenda du Site */}
            <div className="border border-[#ff3700]/30 bg-gradient-to-br from-[#ff3700]/15 via-black/40 to-black/20 rounded-2xl p-3.5 space-y-2 shadow-lg shadow-[#ff3700]/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-[#ff3700]/20 border border-[#ff3700]/40 flex items-center justify-center text-[#ff3700] shadow-sm">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-white uppercase tracking-wider block">Agenda du Site</span>
                            <span className="text-[8px] text-gray-400 font-medium">Prendre les soirées & festivals du site</span>
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={() => {
                            setIsAgendaPickerOpen(true);
                            if (siteAgendaEvents.length === 0) {
                                fetchSiteAgenda();
                            }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff3700] hover:bg-[#ff5522] text-black font-black text-[9px] uppercase rounded-xl shadow-md shadow-[#ff3700]/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Sparkles className="w-3 h-3" /> Importer
                    </button>
                </div>
            </div>

            {/* Live Takeover Import */}
            <div className="border border-white/10 bg-black/20 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Takeover Import</span>
                    <button 
                        onClick={fetchTakeover}
                        disabled={isTakeoverLoading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase text-white hover:bg-white/10 transition-all"
                    >
                        {isTakeoverLoading ? <RotateCcw className="w-3 h-3 animate-spin" /> : <Layers className="w-3 h-3" />}
                        {takeoverData ? 'Actualiser' : 'Charger les données'}
                    </button>
                </div>

                {takeoverData && (
                    <div className="grid grid-cols-1 gap-2 p-2 bg-white/5 rounded-lg border border-white/5 animate-in fade-in slide-in-from-top-2">
                        <p className="text-[8px] font-black text-gray-500 uppercase px-1 mb-1">Sélectionnez une stage & date :</p>
                        <div className="max-h-[150px] overflow-y-auto space-y-1 custom-scrollbar">
                            {Array.from(new Set(takeoverData.lineup.map(l => `${l.stage}:${l.day}`)))
                                .sort()
                                .map(key => {
                                    const [st, dy] = key.split(':');
                                    return (
                                        <button 
                                            key={key}
                                            onClick={() => handleImportFromTakeover(st, dy)}
                                            className="w-full px-3 py-2 bg-white/5 hover:bg-neon-cyan/20 border border-white/5 hover:border-neon-cyan/30 rounded-lg text-left transition-all group"
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-white group-hover:text-neon-cyan uppercase">{st || 'STAGE INCONNUE'}</span>
                                                <span className="text-[9px] font-bold text-gray-500">{dy}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </div>

            {/* Liste des événements de l'Agenda */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        Événements ({planningItems.length})
                    </span>
                    <span className="text-[8px] text-[#ff3700] font-bold">Style Rave Feed</span>
                </div>

                {planningItems.length === 0 ? (
                    <div className="p-6 bg-white/[0.03] border border-dashed border-white/10 rounded-2xl text-center space-y-2.5">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Aucun événement pour le moment</p>
                        <p className="text-[9px] text-gray-500 font-medium">Ajoutez un événement manuellement ou prenez ceux du site.</p>
                        <div className="pt-1 flex flex-col sm:flex-row gap-2 justify-center">
                            <button 
                                type="button"
                                onClick={() => {
                                    setIsAgendaPickerOpen(true);
                                    if (siteAgendaEvents.length === 0) {
                                        fetchSiteAgenda();
                                    }
                                }}
                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#ff3700]/20 border border-[#ff3700]/40 text-[#ff3700] hover:bg-[#ff3700] hover:text-black rounded-xl text-[9px] font-black uppercase transition-all"
                            >
                                <Calendar className="w-3.5 h-3.5" /> Prendre les events du site
                            </button>
                        </div>
                    </div>
                ) : (
                    planningItems.map((item, i) => (
                        <div key={i} className="p-3 bg-white/5 hover:bg-white/[0.07] border border-white/10 rounded-xl space-y-2 transition-all">
                            {/* Ligne 1 : Jour & Titre */}
                            <div className="flex gap-2 items-center">
                                <input 
                                    value={item.day || item.time || ''} 
                                    onChange={e => { 
                                        const n = [...planningItems]; 
                                        n[i].day = e.target.value.toUpperCase(); 
                                        n[i].time = e.target.value.toUpperCase(); 
                                        setPlanningItems(n); 
                                    }} 
                                    placeholder="JOUR (ex: VENDREDI)" 
                                    spellCheck="false"
                                    className="w-28 bg-[#ff3700]/15 border border-[#ff3700]/30 rounded-lg p-2 text-[10px] text-[#ff3700] font-black uppercase text-center" 
                                />
                                <input 
                                    value={item.title || item.artist || ''} 
                                    onChange={e => { 
                                        const n = [...planningItems]; 
                                        n[i].title = e.target.value.toUpperCase(); 
                                        n[i].artist = e.target.value.toUpperCase(); 
                                        setPlanningItems(n); 
                                    }} 
                                    placeholder="TITRE ÉVÉNEMENT (ex: GODDESS RAVE)" 
                                    spellCheck="false"
                                    className="flex-1 bg-white/10 border border-white/20 rounded-lg p-2 text-[10px] text-white font-black uppercase" 
                                />
                                <button 
                                    onClick={() => setPlanningItems(planningItems.filter((_, idx) => idx !== i))} 
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                    title="Supprimer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Ligne 2 : Artistes / Lineup */}
                            <input 
                                value={item.artists || ''} 
                                onChange={e => { 
                                    const n = [...planningItems]; 
                                    n[i].artists = e.target.value; 
                                    setPlanningItems(n); 
                                }} 
                                placeholder="LINEUP (ex: URUMI / A5KM / ESILISE ...)" 
                                spellCheck="false"
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-1.5 text-[10px] text-gray-200 font-semibold" 
                            />

                            {/* Ligne 3 : Genre & Lieu */}
                            <div className="flex gap-2">
                                <input 
                                    value={item.genre || ''} 
                                    onChange={e => { 
                                        const n = [...planningItems]; 
                                        n[i].genre = e.target.value; 
                                        setPlanningItems(n); 
                                    }} 
                                    placeholder="GENRE (ex: Hard-Techno)" 
                                    spellCheck="false"
                                    className="w-1/2 bg-white/5 border border-white/10 rounded-lg p-1.5 text-[9px] text-gray-400 font-bold" 
                                />
                                <input 
                                    value={item.venue || ''} 
                                    onChange={e => { 
                                        const n = [...planningItems]; 
                                        n[i].venue = e.target.value.toUpperCase(); 
                                        setPlanningItems(n); 
                                    }} 
                                    placeholder="LIEU (ex: MKILOMÈTRE25)" 
                                    spellCheck="false"
                                    className="w-1/2 bg-[#ff3700]/10 border border-[#ff3700]/20 rounded-lg p-1.5 text-[9px] text-[#ff3700] font-black uppercase" 
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button 
                onClick={() => setPlanningItems([
                    ...planningItems, 
                    { day: 'VENDREDI', title: '', artists: '', genre: '', venue: '' }
                ])} 
                className="w-full py-3 bg-[#ff3700]/10 border border-dashed border-[#ff3700]/30 hover:border-[#ff3700] rounded-xl text-[9px] font-black uppercase text-[#ff3700] hover:bg-[#ff3700]/20 transition-all flex items-center justify-center gap-2"
            >
                <Plus className="w-3.5 h-3.5" /> Ajouter un événement à l'Agenda
            </button>

            <button
                type="button"
                onClick={() => setAgendaSlide(1)}
                className="w-full py-2.5 text-gray-400 hover:text-white text-[9px] font-black uppercase transition-colors"
            >
                ❮ Revenir à la Slide 1 (Cover)
            </button>
        </div>
    )}
</div>
    );

    const textAnimationControl = (
        <div className={`p-3 bg-white/5 border border-white/10 rounded-2xl transition-all ${animOptionsOpen ? 'space-y-2.5' : ''}`}>
            <div className="flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={() => setAnimOptionsOpen(o => !o)}
                    className="flex-1 flex items-center justify-between gap-2 group min-w-0"
                    title={animOptionsOpen ? 'Masquer les options d\'animation' : 'Afficher les options d\'animation'}
                >
                    <span className="text-[9px] font-black uppercase text-neon-cyan tracking-wider flex items-center gap-1.5 truncate">
                        🎬 Animation du texte {activeTab === 'REEL' ? '(Reel 9:16)' : ''}
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-1.5 py-0.5 rounded-md text-[7.5px] font-black uppercase tracking-wider border ${
                            textAnimation !== 'NONE'
                                ? 'bg-neon-cyan/15 border-neon-cyan/40 text-neon-cyan shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                                : 'bg-white/5 border-white/10 text-gray-500'
                        }`}>
                            {textAnimation !== 'NONE' ? '● Active' : 'Statique'}
                        </span>
                        <span className={`text-[10px] text-gray-400 group-hover:text-white transition-transform duration-300 ${animOptionsOpen ? 'rotate-180' : ''}`}>▾</span>
                    </span>
                </button>
                {animOptionsOpen && textAnimation !== 'NONE' && (
                    <button
                        type="button"
                        onClick={() => {
                            animStartTimeRef.current = Date.now();
                            setAnimReplayKey(k => k + 1);
                        }}
                        className="px-2 py-0.5 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg text-[8px] font-black uppercase text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all flex items-center gap-1"
                        title="Rejouer l'animation depuis le début"
                    >
                        <RotateCcw className="w-2.5 h-2.5" /> Rejouer
                    </button>
                )}
            </div>

            {animOptionsOpen && (
            <div className="grid grid-cols-4 gap-1.5">
                {[
                    { id: 'NONE', label: 'Statique', icon: '⏹️', activeClass: 'bg-white text-black border-white shadow-sm' },
                    { id: 'SLIDE_LEFT', label: 'Glissement', icon: '➡️', activeClass: 'bg-neon-red border-neon-red text-white shadow-[0_0_12px_rgba(255,0,51,0.5)]' },
                    { id: 'WORD_BY_WORD', label: 'Mot / Mot', icon: '✨', activeClass: 'bg-neon-cyan border-neon-cyan text-black shadow-[0_0_12px_rgba(0,240,255,0.5)]' },
                    { id: 'POP_UP', label: 'Pop Up', icon: '⬆️', activeClass: 'bg-neon-purple border-neon-purple text-white shadow-[0_0_12px_rgba(176,38,255,0.5)]' },
                    { id: 'ZOOM_IMPACT', label: 'Zoom Impact', icon: '💥', activeClass: 'bg-amber-400 border-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.5)]' },
                    { id: 'TYPEWRITER', label: 'Machine', icon: '⌨️', activeClass: 'bg-emerald-400 border-emerald-400 text-black shadow-[0_0_12px_rgba(52,211,153,0.5)]' },
                    { id: 'BOUNCE', label: 'Rebond', icon: '🏀', activeClass: 'bg-pink-500 border-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)]' },
                    { id: 'GLITCH', label: 'Glitch Cyber', icon: '⚡', activeClass: 'bg-indigo-500 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]' },
                ].map(anim => (
                    <button
                        key={anim.id}
                        type="button"
                        onClick={() => {
                            setTextAnimation(anim.id as TextAnimType);
                            animStartTimeRef.current = Date.now();
                            setAnimReplayKey(k => k + 1);
                        }}
                        className={`py-2 px-1 rounded-xl text-[8.5px] font-black uppercase border transition-all flex flex-col items-center justify-center gap-0.5 ${
                            textAnimation === anim.id
                                ? anim.activeClass
                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        <span className="text-[11px] leading-none">{anim.icon}</span>
                        <span className="truncate w-full text-center">{anim.label}</span>
                    </button>
                ))}
            </div>
            )}
        </div>
    );

    const promoEditor = (
        <div className="space-y-4">
            {/* Effet & Animation du texte */}
            <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-neon-cyan tracking-wider flex items-center gap-1.5">
                    ✨ Effet & Animation du texte
                </span>
                {textAnimationControl}
            </div>
            {isCarouselPromoActive && (
                <div className="p-3 bg-neon-red/10 border border-neon-red/30 rounded-2xl flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-2">
                        <span className="text-base">🔥</span>
                        <div>
                            <p className="text-[10px] font-black uppercase text-neon-red tracking-wider">Slide Outro PROMO active</p>
                            <p className="text-[8px] text-gray-400">Modifiez ici la phrase et la question de fin de carrousel</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setIsCarouselPromoActive(false);
                            setTimeout(() => generateImage(), 50);
                        }}
                        className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[8.5px] font-black uppercase transition-all flex items-center gap-1 active:scale-95"
                    >
                        ❮ Revenir aux slides
                    </button>
                </div>
            )}

            {/* Toggle Principal : Phrase d'accroche (Question / Débat) */}
            <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="space-y-0.5 pr-2">
                    <div className="text-[10px] font-black uppercase text-white flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-neon-red" />
                        <span>Phrase d'accroche (Question)</span>
                        <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-bold ${
                            showPromoHook 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                        }`}>
                            {showPromoHook ? 'Activée' : 'Désactivée (Texte Centré)'}
                        </span>
                    </div>
                    <p className="text-[8px] text-gray-400">
                        {showPromoHook 
                            ? 'Affiche la question débat en haut + "Donne ton avis en commentaire".' 
                            : 'Masquée : le texte en dessous est automatiquement centré au milieu du visuel.'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setShowPromoHook(!showPromoHook);
                        setTimeout(() => generateImage(), 50);
                    }}
                    className={`px-3 py-2 rounded-xl text-[9.5px] font-black uppercase transition-all flex items-center gap-1.5 border shrink-0 ${
                        showPromoHook
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                            : 'bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/30 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                    }`}
                >
                    {showPromoHook ? '👁️ Accroche Active' : '🚫 Désactivée (Centré)'}
                </button>
            </div>

            {/* Thème & Couleur synchronisés avec la publication */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-gray-300 flex items-center gap-1.5">
                        🎨 Thème & Couleur Promo
                    </span>
                    <p className="text-[8px] text-gray-400">
                        Synchronisé avec le thème officiel de votre publication ({theme})
                    </p>
                </div>
                <span 
                    className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full border shadow-sm"
                    style={{ 
                        backgroundColor: `${(baseThemeData[promoCategory as ThemeType] || baseThemeData[theme] || baseThemeData['NEWS']).color}20`, 
                        color: (baseThemeData[promoCategory as ThemeType] || baseThemeData[theme] || baseThemeData['NEWS']).color,
                        borderColor: `${(baseThemeData[promoCategory as ThemeType] || baseThemeData[theme] || baseThemeData['NEWS']).color}60` 
                    }}
                >
                    {promoCategory || theme}
                </span>
            </div>

            {/* 2. Phrase officielle Promo d'information (Pour être informé...) */}
            <div className="space-y-2.5 bg-white/5 border border-white/10 rounded-2xl p-3.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-black text-neon-cyan uppercase tracking-widest flex items-center gap-1.5">
                            📢 Phrase Promo (Ligne 1 & 2)
                        </label>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                            showPromoHeadline 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                            {showPromoHeadline ? 'Affichée' : 'Masquée (Centré)'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => {
                                setShowPromoHeadline(!showPromoHeadline);
                                setTimeout(() => generateImage(), 50);
                            }}
                            className={`px-2 py-1 rounded-lg text-[8.5px] font-bold uppercase transition-all border ${
                                showPromoHeadline
                                    ? 'bg-white/10 border-white/20 text-gray-300 hover:text-white'
                                    : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            }`}
                        >
                            {showPromoHeadline ? 'Masquer' : 'Afficher'}
                        </button>
                        {promoCustomPhrase && (
                            <button
                                type="button"
                                onClick={() => {
                                    setPromoCustomPhrase('');
                                    setTimeout(() => generateImage(), 50);
                                }}
                                className="text-[8.5px] text-gray-400 hover:text-white uppercase font-bold"
                            >
                                ↺ Par défaut
                            </button>
                        )}
                    </div>
                </div>

                {showPromoHeadline && (
                    <>
                        <input
                            value={promoCustomPhrase}
                            onChange={e => {
                                setPromoCustomPhrase(e.target.value);
                                setTimeout(() => generateImage(), 50);
                            }}
                            placeholder={
                                promoCategory === 'EVENTS' || promoCategory === 'PLANNING'
                                    ? "POUR ÊTRE INFORMÉ DE TOUS LES ÉVÉNEMENTS"
                                    : promoCategory === 'MUSIQUE'
                                    ? "POUR ÊTRE INFORMÉ DE TOUTES LES SORTIES MUSICALES"
                                    : promoCategory === 'FOCUS'
                                    ? "POUR NE RIEN MANQUER DE NOS FOCUS & DOSSIERS"
                                    : "POUR ÊTRE INFORMÉ DE TOUTES LES NEWS"
                            }
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-bold uppercase focus:border-neon-cyan outline-none transition-all placeholder:text-gray-600"
                        />

                        <div className="pt-1 space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                Ligne 2 (Sous-phrase)
                            </label>
                            <input
                                value={promoCustomSubphrase}
                                onChange={e => {
                                    setPromoCustomSubphrase(e.target.value);
                                    setTimeout(() => generateImage(), 50);
                                }}
                                placeholder="SUR LA MUSIQUE ÉLECTRONIQUE ET LES FESTIVALS,"
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-bold uppercase focus:border-neon-cyan outline-none transition-all placeholder:text-gray-600"
                            />
                        </div>

                        <div className="pt-2 space-y-1">
                            <label className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">
                                💡 Phrases suggérées en 1 clic :
                            </label>
                            <select
                                value=""
                                onChange={e => {
                                    if (e.target.value) {
                                        setPromoCustomPhrase(e.target.value);
                                        setTimeout(() => generateImage(), 50);
                                    }
                                }}
                                className="w-full bg-black/60 border border-white/10 hover:border-neon-cyan/50 focus:border-neon-cyan rounded-xl p-2.5 text-white text-xs font-bold uppercase outline-none transition-all cursor-pointer"
                            >
                                <option value="" disabled>-- Choisir une phrase suggérée --</option>
                                <option value="POUR ÊTRE INFORMÉ DE TOUTES LES NEWS">POUR ÊTRE INFORMÉ DE TOUTES LES NEWS</option>
                                <option value="POUR ÊTRE INFORMÉ DE TOUS LES ÉVÉNEMENTS">POUR ÊTRE INFORMÉ DE TOUS LES ÉVÉNEMENTS</option>
                                <option value="POUR ÊTRE INFORMÉ DE TOUTES LES SORTIES MUSICALES">POUR ÊTRE INFORMÉ DE TOUTES LES SORTIES MUSICALES</option>
                                <option value="POUR NE RIEN MANQUER DE NOS FOCUS & DOSSIERS">POUR NE RIEN MANQUER DE NOS FOCUS & DOSSIERS</option>
                                <option value="POUR REVIVRE TOUS LES MEILLEURS FESTIVALS">POUR REVIVRE TOUS LES MEILLEURS FESTIVALS</option>
                            </select>
                        </div>
                    </>
                )}
            </div>

            {/* 3. Question / Débat de l'article (Accroche du haut) */}
            <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-3.5">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-neon-red" /> Question / Débat de l'article
                    </label>
                    <span className="text-[9px] text-gray-500 font-bold">{customText.length}/200</span>
                </div>
                {showPromoHook ? (
                    <>
                        <textarea
                            value={customText}
                            onChange={e => setCustomText(e.target.value.slice(0, 200))}
                            placeholder="Ex: Que penses-tu du nouveau titre de l'artiste ?"
                            spellCheck="true"
                            autoCorrect="on"
                            className="w-full h-20 bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-bold resize-none focus:border-neon-red outline-none transition-all uppercase"
                        />
                        <div className="pt-1 space-y-1">
                                <label className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">
                                    💡 Suggestions rapides pour la question :
                                </label>
                                <select
                                    value=""
                                    onChange={e => {
                                        if (e.target.value) {
                                            setCustomText(e.target.value.toUpperCase());
                                            setTimeout(() => generateImage(), 50);
                                        }
                                    }}
                                    className="w-full bg-black/60 border border-white/10 hover:border-neon-red/50 focus:border-neon-red rounded-xl p-2.5 text-white text-xs font-bold uppercase outline-none transition-all cursor-pointer"
                                >
                                    <option value="" disabled>-- Choisir une question suggérée --</option>
                                    <option value="Et toi, qu'en penses-tu ?">Et toi, qu'en penses-tu ?</option>
                                    <option value="Validé ou surcoté ?">Validé ou surcoté ?</option>
                                    <option value="Tu y seras cet été ?">Tu y seras cet été ?</option>
                                    <option value="Dans ta playlist ou poubelle ?">Dans ta playlist ou poubelle ?</option>
                                    <option value="Tu valides ce retour ?">Tu valides ce retour ?</option>
                                    <option value="Quelle est ta collab de rêve ?">Quelle est ta collab de rêve ?</option>
                                </select>
                            </div>
                    </>
                ) : (
                    <div className="p-2.5 bg-neon-cyan/10 border border-neon-cyan/20 rounded-xl text-[9px] text-neon-cyan font-bold flex items-center justify-between">
                        <span>Accroche désactivée : Le texte d'abonnement est centré sur le visuel.</span>
                        <button
                            type="button"
                            onClick={() => {
                                setShowPromoHook(true);
                                setTimeout(() => generateImage(), 50);
                            }}
                            className="text-[8.5px] underline hover:text-white uppercase font-black"
                        >
                            Réactiver
                        </button>
                    </div>
                )}
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <p className="text-[9px] font-black text-neon-cyan uppercase tracking-widest">Aperçu Outro & Bulles :</p>
                <p className="text-[10px] text-gray-300 font-bold leading-relaxed">
                    « {promoCustomPhrase || (promoCategory === 'EVENTS' || promoCategory === 'PLANNING' ? "Pour être informé de tous les événements" : "Pour être informé de toutes les news")} {promoCustomSubphrase || "sur la musique électronique et les festivals"}, abonnez-vous à DROPSIDERS »
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                    {['NEWS', 'MUSIQUE', 'FOCUS', 'RECAPS', 'CONCOURS', 'EVENTS', 'INTERVIEWS', 'VIDEOS'].map((tag, i) => (
                        <span key={i} className={`px-2.5 py-1 border rounded-full text-[8px] font-black transition-all ${
                            (promoCategory === tag || (promoCategory === 'PLANNING' && tag === 'EVENTS'))
                                ? 'bg-neon-red/20 border-neon-red text-neon-red'
                                : 'bg-white/10 border-white/15 text-white/90'
                        }`}>
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );

    const textEditor = (
        <div className="space-y-2">
            <textarea
                ref={textAreaRef}
                value={customText}
                onSelect={(e) => { 
                    const t = e.target as HTMLTextAreaElement; 
                    setSelection({ start: t.selectionStart, end: t.selectionEnd }); 
                    selectionRef.current = { start: t.selectionStart, end: t.selectionEnd };
                }}
                onChange={e => setCustomText(e.target.value.slice(0, 1100))}
                placeholder="VOTRE TEXTE..."
                spellCheck="true"
                autoCorrect="on"
                autoComplete="on"
                autoCapitalize="sentences"
                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm font-bold italic resize-none focus:border-cyan-500 outline-none transition-all shadow-inner shadow-black font-sans uppercase break-words"
            />
            <div className="flex justify-between items-center gap-2 px-1">
                <span className="text-[9px] text-white/40 italic">Astuce : entoure un mot de *étoiles* pour le colorer en néon (ex: *EXCLUSIF*)</span>
                <button 
                    onClick={() => setCustomText(fixEncoding(customText))}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-[9px] font-black uppercase hover:bg-green-500 hover:text-white transition-all shrink-0"
                >
                    <Sparkles className="w-3 h-3" /> Nettoyer
                </button>
            </div>
        </div>
    );

    const tracklistEditor = (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest pl-1">Ligne 1 : Artiste (Orange)</label>
                <input 
                    value={customText.split('\n')[0] || ''} 
                    onChange={e => {
                        const lines = customText.split('\n');
                        lines[0] = e.target.value;
                        setCustomText(lines.join('\n'));
                    }} 
                    placeholder="EX: ODD MOB" 
                    className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white font-black italic uppercase text-sm focus:border-orange-500 outline-none transition-all shadow-xl" 
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Ligne 2 : Festival / Événement (Blanc)</label>
                <input 
                    value={customText.split('\n')[1] || ''} 
                    onChange={e => {
                        const lines = customText.split('\n');
                        while (lines.length < 2) lines.push('');
                        lines[1] = e.target.value;
                        setCustomText(lines.join('\n'));
                    }} 
                    placeholder="EX: CRSSD FESTIVAL" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-black italic uppercase text-sm focus:border-white/40 outline-none transition-all shadow-lg" 
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Ligne 3 : Ville, Pays, Année (Orbitron)</label>
                <input 
                    value={customText.split('\n')[2] || ''} 
                    onChange={e => {
                        let val = e.target.value;
                        if (val.endsWith(' ') && val.length > 1 && val[val.length - 2] !== ',' && !val.endsWith(', ')) {
                            val = val.slice(0, -1).trim() + ', ';
                        }
                        const lines = customText.split('\n');
                        while (lines.length < 3) lines.push('');
                        lines[2] = val;
                        setCustomText(lines.join('\n'));
                    }} 
                    placeholder="EX: SAN DIEGO, USA, 2026" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold uppercase text-[10px] focus:border-white/40 outline-none transition-all shadow-md" 
                />
                <button 
                    onClick={() => setShowBottomLogo(!showBottomLogo)}
                    className={`w-full py-3 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${showBottomLogo ? 'bg-white/20 text-white border border-white' : 'bg-white/5 text-gray-500 border border-white/10'}`}
                >
                    {showBottomLogo ? '✅ LOGO BAS ACTIVÉ (CACHÉ GRILLE)' : '❌ LOGO BAS DÉSACTIVÉ'}
                </button>
            </div>
            <p className="text-[9px] text-white/40 italic px-1 pt-1">
                Charte Graphique V2 : Badge <strong className="text-orange-400">• TRACKLIST</strong> en haut à gauche, logo Dropsiders en haut à droite, L1 en orange, L2 en blanc, L3 en blanc Orbitron.
            </p>
        </div>
    );

    const spotlightEditor = (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Logo Artiste</label>
                    <div className="relative group/logo">
                        {artistLogo && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setArtistLogo(''); artistLogoRef.current = null; }}
                                className="absolute top-2 right-2 z-10 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full transition-all opacity-100"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                        <input type="file" onChange={handleArtistLogoChange} className="hidden" id="artist-logo-up" accept="image/*" />
                        <button onClick={() => document.getElementById('artist-logo-up')?.click()} className="w-full aspect-square bg-white/5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all group overflow-hidden">
                            {artistLogo ? (
                                <img 
                                    src={artistLogo} 
                                    alt="Artist Logo" 
                                    className="w-full h-full object-contain p-2 transition-all" 
                                    style={{ filter: isArtistLogoNegative ? 'brightness(0) invert(1)' : 'none' }}
                                />
                            ) : (
                                <>
                                    <Plus className="w-5 h-5 text-gray-600 group-hover:text-neon-red" />
                                    <span className="text-[8px] font-black text-gray-600 uppercase">Logo Artiste</span>
                                </>
                            )}
                        </button>
                    </div>
                    {!artistLogo && (
                        <input 
                            value={artistNameText}
                            onChange={e => setArtistNameText(e.target.value)}
                            placeholder="Ou nom artiste..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[9px] text-white uppercase font-bold"
                        />
                    )}
                    {artistLogo && (
                        <div className="flex items-center gap-2 px-1">
                            <input 
                                type="checkbox" 
                                checked={isArtistLogoNegative} 
                                onChange={e => setIsArtistLogoNegative(e.target.checked)}
                                className="w-3 h-3 accent-neon-red"
                                id="logo-neg-toggle"
                            />
                            <label htmlFor="logo-neg-toggle" className="text-[8px] font-black text-gray-500 uppercase cursor-pointer">Effet Négatif (Blanc)</label>
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Logo Festival</label>
                    <div className="relative group/logo">
                        {festivalLogo && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setFestivalLogo(''); festivalLogoRef.current = null; }}
                                className="absolute top-2 right-2 z-10 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full transition-all opacity-100"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                        <input type="file" onChange={handleFestivalLogoChange} className="hidden" id="fest-logo-up" accept="image/*" />
                        <button onClick={() => document.getElementById('fest-logo-up')?.click()} className="w-full aspect-square bg-white/5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all group overflow-hidden">
                            {festivalLogo ? (
                                <img src={festivalLogo} alt="Fest Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <>
                                    <Plus className="w-5 h-5 text-gray-600 group-hover:text-neon-red" />
                                    <span className="text-[8px] font-black text-gray-600 uppercase">Logo Festival</span>
                                </>
                            )}
                        </button>
                    </div>
                    {!festivalLogo && (
                        <input 
                            value={festivalNameText}
                            onChange={e => setFestivalNameText(e.target.value)}
                            placeholder="Ou nom festival..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[9px] text-white uppercase font-bold"
                        />
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tagline / Phrase (Ligne 1 & 2)</label>
                <div className="space-y-2">
                    <input 
                        value={customText.split('\n')[0] || ''} 
                        onChange={e => {
                            const lines = customText.split('\n');
                            lines[0] = e.target.value;
                            setCustomText(lines.join('\n'));
                        }} 
                        placeholder="LIGNE 1 (EX: FROM UNDERGROUND ROOTS)" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold uppercase text-[10px]" 
                    />
                    <input 
                        value={customText.split('\n')[3] || ''} 
                        onChange={e => {
                            const lines = customText.split('\n');
                            while (lines.length < 4) lines.push('');
                            lines[3] = e.target.value;
                            setCustomText(lines.join('\n'));
                        }} 
                        placeholder="LIGNE 2 (EX: TO BASS CULTURE ICON)" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold uppercase text-[10px]" 
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nom Stage</label>
                    <input 
                        value={customText.split('\n')[1] || ''} 
                        onChange={e => {
                            const lines = customText.split('\n');
                            while (lines.length < 2) lines.push('');
                            lines[1] = e.target.value;
                            setCustomText(lines.join('\n'));
                        }} 
                        placeholder="BASSPOD" 
                        className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-neon-red font-black italic uppercase text-xs" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Jour</label>
                    <input 
                        value={customText.split('\n')[2] || ''} 
                        onChange={e => {
                            const lines = customText.split('\n');
                            while (lines.length < 3) lines.push('');
                            lines[2] = e.target.value;
                            setCustomText(lines.join('\n'));
                        }} 
                        placeholder="SATURDAY" 
                        className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-neon-red font-black italic uppercase text-xs" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Heure</label>
                    <input 
                        value={customText.split('\n')[4] || ''} 
                        onChange={e => {
                            const lines = customText.split('\n');
                            while (lines.length < 5) lines.push('');
                            lines[4] = e.target.value;
                            setCustomText(lines.join('\n'));
                        }} 
                        placeholder="22:00 - 23:00" 
                        className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-neon-red font-black italic uppercase text-xs" 
                    />
                </div>
            </div>

            {/* Background Offsets for Spotlight */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ajuster la position de la photo</p>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-black uppercase text-gray-500">
                            <span>Horizontal (Gauche/Droite)</span>
                            <span className="text-white">{bgOffsetX}px</span>
                        </div>
                        <input 
                            type="range" min="-800" max="800" value={bgOffsetX} 
                            onChange={e => setBgOffsetX(parseInt(e.target.value))}
                            onMouseDown={() => setIsSlidingPosition(true)}
                            onMouseUp={() => setIsSlidingPosition(false)}
                            onTouchStart={() => setIsSlidingPosition(true)}
                            onTouchEnd={() => setIsSlidingPosition(false)}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-red" 
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-black uppercase text-gray-500">
                            <span>Vertical (Haut/Bas)</span>
                            <span className="text-white">{bgOffsetY}px</span>
                        </div>
                        <input 
                            type="range" min="-800" max="800" value={bgOffsetY} 
                            onChange={e => setBgOffsetY(parseInt(e.target.value))}
                            onMouseDown={() => setIsSlidingPosition(true)}
                            onMouseUp={() => setIsSlidingPosition(false)}
                            onTouchStart={() => setIsSlidingPosition(true)}
                            onTouchEnd={() => setIsSlidingPosition(false)}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-red" 
                        />
                    </div>
                    <button onClick={() => { setBgOffsetX(0); setBgOffsetY(0); }} className="w-full py-1.5 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-gray-500 uppercase hover:text-white transition-all">Réinitialiser Position</button>
                </div>
            </div>
        </div>
    );

    const artisteFestivalEditor = (
        <div className="space-y-4">
            {/* CARROUSEL SLIDE SWITCHER */}
            <div className="p-1.5 bg-black/60 border border-neon-red/30 rounded-2xl flex gap-1 shadow-xl">
                <button
                    type="button"
                    onClick={() => setArtisteFestivalSlide(1)}
                    className={`flex-1 py-3 px-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${
                        artisteFestivalSlide === 1
                            ? 'bg-neon-red text-white shadow-[0_0_15px_rgba(255,0,51,0.5)] scale-[1.02]'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <span className="text-xs">🎪</span> Slide 1 : Cover Festival
                </button>
                <button
                    type="button"
                    onClick={() => setArtisteFestivalSlide(2)}
                    className={`flex-1 py-3 px-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${
                        artisteFestivalSlide === 2
                            ? 'bg-neon-red text-white shadow-[0_0_15px_rgba(255,0,51,0.5)] scale-[1.02]'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <span className="text-xs">⭐</span> Slide 2 : Spotlight Artiste
                </button>
            </div>

            {/* Quick Carousel Download Bar */}
            <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[8px] font-bold text-gray-400 uppercase px-1">
                    <span>Export Carrousel Rapide</span>
                    <span className="text-neon-red">Format {activeTab === 'REEL' ? 'Story' : 'Post (4:5)'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => downloadArtisteFestivalSlide(1)}
                        disabled={isDownloading}
                        className="py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-black text-[9px] uppercase rounded-lg transition-all flex items-center justify-center gap-1.5"
                    >
                        <Download className="w-3.5 h-3.5 text-neon-red" /> Slide 1 (PNG)
                    </button>
                    <button
                        type="button"
                        onClick={() => downloadArtisteFestivalSlide(2)}
                        disabled={isDownloading}
                        className="py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-black text-[9px] uppercase rounded-lg transition-all flex items-center justify-center gap-1.5"
                    >
                        <Download className="w-3.5 h-3.5 text-neon-red" /> Slide 2 (PNG)
                    </button>
                </div>
                <button
                    type="button"
                    onClick={() => downloadArtisteFestivalCarousel()}
                    disabled={isDownloading}
                    className="w-full py-2.5 bg-gradient-to-r from-[#ff0033] to-[#ff4400] hover:from-[#ff1a47] hover:to-[#ff551a] text-white font-black text-[10px] uppercase rounded-lg shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
                >
                    <Download className="w-4 h-4" /> Télécharger Carrousel (1 + 2)
                </button>
            </div>

            {/* Slide 1 Content */}
            {artisteFestivalSlide === 1 && (
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase">Nom du Festival</label>
                        <input
                            value={festivalNameText}
                            onChange={e => setFestivalNameText(e.target.value)}
                            placeholder="NOM DU FESTIVAL (ex: TOMORROWLAND)"
                            className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white font-black italic uppercase text-xs"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase">Titre de la Cover (Hook)</label>
                        <textarea
                            value={customText || 'LES 10 ARTISTES À NE PAS LOUPER'}
                            onChange={e => {
                                setCustomText(e.target.value);
                                setConseilsTitle(e.target.value);
                            }}
                            placeholder="LES 10 ARTISTES À NE PAS LOUPER"
                            className="w-full h-20 bg-white/10 border border-white/20 rounded-xl p-3 text-white font-black italic uppercase text-xs"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase">Sous-titre / Détails (Italique)</label>
                        <textarea
                            rows={2}
                            value={conseilsSubtext}
                            onChange={e => setConseilsSubtext(e.target.value)}
                            placeholder="EX: Édition 2026&#10;Belgique"
                            className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white italic text-xs resize-none"
                        />
                    </div>
                </div>
            )}

            {/* Slide 2 Content (Spotlight) */}
            {artisteFestivalSlide === 2 && (
                <div className="space-y-3">
                    <div className="px-1 py-1 text-[9px] font-bold text-gray-400 uppercase flex items-center justify-between">
                        <span>Édition Spotlight de l'Artiste</span>
                        <span className="text-neon-red">Slide 2</span>
                    </div>
                    {spotlightEditor}
                </div>
            )}
        </div>
    );

    const isMultiSlideTheme = ['PLANNING', 'ARTISTE FESTIVAL', 'EVENTS', 'AFFICHE', 'MUSIQUE', 'NEWS', 'FOCUS', 'RECAP', 'INTERVIEW', 'LIVESTREAM', 'CONSEILS', 'REELS', 'CONCOURS', 'TOP 5 STYLES', 'TOP 5 ARTISTE', 'TOP 10 FESTIVAL'].includes(theme);

    const slideTransitionQuickBar = (
        <div className="flex items-center gap-1 pl-2 ml-1 border-l border-white/15">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider hidden sm:inline">Enchaînement :</span>
            <div className="flex items-center bg-black/60 rounded-xl p-0.5 border border-white/10 gap-0.5">
                {SLIDE_TRANSITIONS.map(trans => (
                    <button
                        key={trans.id}
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSetSlideTransition(trans.id);
                            playTransitionPreview(trans.id);
                        }}
                        className={`px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase transition-all flex items-center gap-1 ${
                            slideTransition === trans.id
                                ? 'bg-neon-red text-white shadow-sm'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                        title={`${trans.label} - ${trans.desc}`}
                    >
                        <span>{trans.icon}</span>
                        <span className="hidden md:inline text-[7.5px]">{trans.label}</span>
                    </button>
                ))}
            </div>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    playTransitionPreview();
                }}
                disabled={isTransitioningRef.current}
                className="px-1.5 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg text-[8px] font-black uppercase text-gray-200 transition-all flex items-center gap-0.5 active:scale-95 disabled:opacity-40"
                title="Tester l'enchaînement en direct sur le canvas"
            >
                <Play className="w-2 h-2 fill-current text-neon-red" />
            </button>
        </div>
    );

    const slideTransitionControl = (
        <div className={`p-3 bg-white/5 border border-white/10 rounded-2xl transition-all ${slideTransOptionsOpen ? 'space-y-2.5' : ''}`}>
            <div className="flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={() => setSlideTransOptionsOpen(o => !o)}
                    className="flex-1 flex items-center justify-between gap-2 group min-w-0"
                    title={slideTransOptionsOpen ? 'Masquer les enchaînements' : 'Afficher les enchaînements'}
                >
                    <span className="text-[9px] font-black uppercase text-neon-red tracking-wider flex items-center gap-1.5 truncate">
                        🎚️ Enchaînement des Slides
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                        {(() => {
                            const current = SLIDE_TRANSITIONS.find(t => t.id === slideTransition);
                            return <AccordionBadge active={!!current} label={current ? `${current.icon} ${current.label}` : 'Aucun'} />;
                        })()}
                        <AccordionChevron open={slideTransOptionsOpen} />
                    </span>
                </button>
                {slideTransOptionsOpen && (
                <button
                    type="button"
                    onClick={() => playTransitionPreview()}
                    disabled={isTransitioningRef.current}
                    className="px-2 py-0.5 bg-neon-red/10 border border-neon-red/30 rounded-lg text-[8px] font-black uppercase text-neon-red hover:bg-neon-red hover:text-white transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                    title="Tester l'enchaînement en direct sur le canvas"
                >
                    <Play className="w-2.5 h-2.5 fill-current" /> Tester
                </button>
                )}
            </div>

            {slideTransOptionsOpen && (<>
            <div className="grid grid-cols-5 gap-1">
                {SLIDE_TRANSITIONS.map(trans => (
                    <button
                        key={trans.id}
                        type="button"
                        onClick={() => {
                            handleSetSlideTransition(trans.id);
                            playTransitionPreview(trans.id);
                        }}
                        className={`py-2 px-1 rounded-xl text-[8px] font-black uppercase border transition-all flex flex-col items-center justify-center gap-0.5 ${
                            slideTransition === trans.id
                                ? 'bg-neon-red border-neon-red text-white shadow-[0_0_12px_rgba(255,0,51,0.5)] scale-[1.02]'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                        title={trans.desc}
                    >
                        <span className="text-[12px] leading-none">{trans.icon}</span>
                        <span className="truncate w-full text-center">{trans.label}</span>
                    </button>
                ))}
            </div>

            <div className="flex items-center justify-between text-[8px] text-gray-400 italic px-1 pt-0.5">
                <span>{SLIDE_TRANSITIONS.find(t => t.id === slideTransition)?.desc}</span>
                <span className="text-gray-500 font-mono font-normal">{getTransitionDuration(slideTransition)}ms</span>
            </div>
            </>)}
        </div>
    );

    const conseilsEditor = (
        <div className="space-y-4">

            {/* CARROUSEL SLIDE SWITCHER (POUR NEWS, RÉCAP, FOCUS, ETC.) */}
            {['NEWS', 'FOCUS', 'RECAP', 'INTERVIEW', 'LIVESTREAM', 'CONSEILS', 'REELS', 'CONCOURS'].includes(theme) && (
                <>
                    <div className="p-2 bg-black/60 border border-white/10 rounded-2xl space-y-2 shadow-xl">
                        <div className="flex items-center justify-between text-[8.5px] font-bold text-gray-400 uppercase px-1">
                            <span>Slides du Carrousel ({2 + extraEditorialSlides.length}/7 max)</span>
                            {extraEditorialSlides.length < 5 && (
                                <button
                                    type="button"
                                    onClick={addEditorialSlide}
                                    className="px-2.5 py-1 bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan border border-neon-cyan/40 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 shadow-sm active:scale-95"
                                >
                                    <span>➕</span> Ajouter Slide
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                type="button"
                                onClick={() => { setIsCarouselPromoActive(false); setEditorialSlide(1); }}
                                className={`flex-1 min-w-[90px] py-2 px-2.5 rounded-xl text-[9.5px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                                    !isCarouselPromoActive && editorialSlide === 1
                                        ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-[1.02]'
                                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <span className="text-xs">📌</span> Slide 1 : Cover
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsCarouselPromoActive(false); setEditorialSlide(2); }}
                                className={`flex-1 min-w-[90px] py-2 px-2.5 rounded-xl text-[9.5px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                                    !isCarouselPromoActive && editorialSlide === 2
                                        ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-[1.02]'
                                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <span className="text-xs">📖</span> Slide 2
                            </button>
                            {extraEditorialSlides.map((_, idx) => {
                                const sNum = idx + 3;
                                return (
                                    <button
                                        key={sNum}
                                        type="button"
                                        onClick={() => { setIsCarouselPromoActive(false); setEditorialSlide(sNum); }}
                                        className={`flex-1 min-w-[90px] py-2 px-2.5 rounded-xl text-[9.5px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                                            !isCarouselPromoActive && editorialSlide === sNum
                                                ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-[1.02]'
                                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        <span className="text-xs">📄</span> Slide {sNum}
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCarouselPromoActive(true);
                                    setTimeout(() => generateImage(), 50);
                                }}
                                className={`flex-1 min-w-[90px] py-2 px-2.5 rounded-xl text-[9.5px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                                    isCarouselPromoActive
                                        ? 'bg-neon-red text-white shadow-[0_0_15px_rgba(255,0,51,0.5)] scale-[1.02]'
                                        : 'bg-neon-red/10 border border-neon-red/30 text-neon-red hover:bg-neon-red/20'
                                }`}
                                title="Prévisualiser et modifier la slide Promo Outro du carrousel"
                            >
                                <span className="text-xs">🔥</span> Slide PROMO
                            </button>
                        </div>

                        {/* Contrôle de la durée et du format Reel (Slide 1, Promo, Slide 2) */}
                        {activeTab === 'REEL' && (() => {
                            const numSlides = skipEditorialSlide2 ? (1 + extraEditorialSlides.length) : (2 + extraEditorialSlides.length);
                            const totalSec = ((numSlides * editorialSlide1Duration) + (numSlides * 0.7) + editorialPromoDuration).toFixed(1);
                            return (
                                <div className="space-y-2 p-2.5 bg-gradient-to-r from-neon-cyan/5 via-black/40 to-indigo-500/5 border border-neon-cyan/20 rounded-2xl">
                                    <div className="flex items-center justify-between text-[8.5px]">
                                        <div className="space-y-0.5">
                                            <span className="font-black uppercase text-white flex items-center gap-1">
                                                ⚡ Format Reel :
                                            </span>
                                            <span className="text-gray-400 text-[8px]">
                                                {skipEditorialSlide2 ? 'Slide 1 + Promo uniquement' : 'Slide 1 + Slide 2 + Promo'}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSkipEditorialSlide2(!skipEditorialSlide2)}
                                            className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase transition-all border ${
                                                skipEditorialSlide2
                                                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                                    : 'bg-white/10 border-white/20 text-gray-300 hover:text-white'
                                            }`}
                                        >
                                            {skipEditorialSlide2 ? '🚫 Slide 2 Masquée' : '👁️ Slide 2 Incluse'}
                                        </button>
                                    </div>

                                    {/* Durée Slide 1 */}
                                    <div className="pt-2 border-t border-white/10 space-y-1">
                                        <div className="flex items-center justify-between text-[8px]">
                                            <span className="text-gray-300 font-bold">⏱️ Durée Slide 1 :</span>
                                            <span className="text-amber-400 font-mono font-black bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                                {editorialSlide1Duration}s
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            {[3, 4, 5, 7, 10].map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setEditorialSlide1Duration(s)}
                                                    className={`flex-1 py-1 rounded-lg text-[8px] font-black transition-all border ${
                                                        editorialSlide1Duration === s
                                                            ? 'bg-amber-500 text-black border-amber-400'
                                                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                                    }`}
                                                >
                                                    {s}s
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Durée Outro Promo */}
                                    <div className="pt-1.5 border-t border-white/10 space-y-1">
                                        <div className="flex items-center justify-between text-[8px]">
                                            <span className="text-gray-300 font-bold">🔥 Durée Promo Outro :</span>
                                            <span className="text-rose-400 font-mono font-black bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                                {editorialPromoDuration}s
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            {[2.5, 3.5, 4.5, 6].map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setEditorialPromoDuration(s)}
                                                    className={`flex-1 py-1 rounded-lg text-[8px] font-black transition-all border ${
                                                        editorialPromoDuration === s
                                                            ? 'bg-rose-500 text-white border-rose-400'
                                                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                                    }`}
                                                >
                                                    {s}s
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sélecteur de Fluidité (FPS) */}
                                    <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[8px]">
                                        <span className="text-gray-300 font-bold">🚀 Fluidité :</span>
                                        <div className="flex gap-1">
                                            {[60, 30].map(f => (
                                                <button
                                                    key={f}
                                                    type="button"
                                                    onClick={() => setExportFps(f)}
                                                    className={`px-2 py-0.5 rounded text-[7.5px] font-black uppercase transition-all border ${
                                                        exportFps === f
                                                            ? 'bg-neon-cyan text-black border-neon-cyan'
                                                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                                    }`}
                                                >
                                                    {f} FPS
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Récap total */}
                                    <div className="p-1.5 bg-black/50 rounded-xl border border-white/5 flex items-center justify-between text-[8px]">
                                        <span className="text-neon-cyan font-black">⏱️ Durée Totale Reel :</span>
                                        <span className="text-white font-mono font-black">{totalSec}s ({exportFps} FPS • Hi-Fi)</span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Quick Carousel Download Bar */}
                    <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-[8px] font-bold text-gray-400 uppercase px-1">
                            <span>Export Carrousel Rapide ({2 + extraEditorialSlides.length} Slides)</span>
                            <span className="text-white font-mono">Format {activeTab === 'REEL' ? 'Story' : 'Post (4:5)'}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {Array.from({ length: 2 + extraEditorialSlides.length }).map((_, i) => (
                                <button
                                    key={i + 1}
                                    type="button"
                                    onClick={() => downloadEditorialSlide(i + 1)}
                                    disabled={isDownloading}
                                    className="flex-1 min-w-[70px] py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-black text-[9px] uppercase rounded-lg transition-all flex items-center justify-center gap-1"
                                >
                                    <Download className="w-3.5 h-3.5 text-neon-cyan" /> S{i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => downloadEditorialCarousel()}
                            disabled={isDownloading}
                            className="w-full py-2.5 bg-gradient-to-r from-neon-cyan via-blue-500 to-indigo-600 hover:opacity-90 text-black font-black text-[10px] uppercase rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
                        >
                            <Download className="w-4 h-4 text-black" /> Télécharger Carrousel Images ({2 + extraEditorialSlides.length} Slides)
                        </button>
                    </div>

                    {theme === 'CONCOURS' && (
                        <div className="p-2.5 bg-[#008cff]/10 border border-[#008cff]/20 rounded-xl space-y-1.5">
                            <span className="text-[8px] font-black uppercase text-[#008cff] tracking-wider flex items-center gap-1.5">
                                🎁 Modèles rapides Concours en 1 clic :
                            </span>
                            <div className="grid grid-cols-3 gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const t = '*1X PASS VIP 3 JOURS* À GAGNER';
                                        const s = 'POUR PARTICIPER :\n1. *Like* ce post & *abonne-toi* à @dropsiders\n2. *Identifie 2 potes* en commentaire\n3. *Partage en story* pour doubler tes chances !\nTirage au sort dimanche prochain.';
                                        setConseilsTitle(t);
                                        setCustomText(t);
                                        setConseilsSubtext(s);
                                    }}
                                    className="py-1.5 px-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[8px] font-bold text-white text-center truncate transition-all"
                                >
                                    🎟️ Pass Festival
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const t = '*CASQUE AUDIO SANS FIL* À GAGNER';
                                        const s = 'POUR PARTICIPER :\n1. *Like* ce post & *follow* @dropsiders\n2. *Tag 2 potes* qui ont besoin de bon son\n3. *Partage en story* !';
                                        setConseilsTitle(t);
                                        setCustomText(t);
                                        setConseilsSubtext(s);
                                    }}
                                    className="py-1.5 px-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[8px] font-bold text-white text-center truncate transition-all"
                                >
                                    🎧 Tech / Audio
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const t = '*LE JEU DE TON CHOIX* À GAGNER';
                                        const s = 'POUR PARTICIPER :\n1. *Like* ce post & *abonne-toi*\n2. *Commente ton jeu préféré* & identifie 1 pote\n3. *Partage en story* !';
                                        setConseilsTitle(t);
                                        setCustomText(t);
                                        setConseilsSubtext(s);
                                    }}
                                    className="py-1.5 px-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[8px] font-bold text-white text-center truncate transition-all"
                                >
                                    🎮 Jeu Vidéo
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="space-y-2">
                <div className="flex items-center justify-between pl-1">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Titre Principal</label>
                    <span className="text-[8px] font-bold text-gray-500">Astuce: entoure un mot avec *étoiles*</span>
                </div>
                <textarea 
                    ref={conseilsTitleInputRef}
                    rows={2}
                    value={conseilsTitle === 'LE TITRE ICI' ? (customText || '') : conseilsTitle} 
                    onChange={e => {
                        setConseilsTitle(e.target.value);
                        setCustomText(e.target.value);
                    }} 
                    placeholder="EX: 3 *FESTIVALS* INCONTOURNABLES" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold uppercase focus:border-white/40 outline-none transition-all shadow-md resize-none" 
                />
                {(() => {
                    const currentTitle = conseilsTitle === 'LE TITRE ICI' ? (customText || '') : conseilsTitle;
                    const rawWords = currentTitle ? currentTitle.split(/\s+/).filter(Boolean) : [];
                    if (rawWords.length === 0) return null;
                    return (
                        <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <span 
                                        className="w-2 h-2 rounded-full inline-block animate-pulse" 
                                        style={{ backgroundColor: activeColor.color, boxShadow: `0 0 8px ${activeColor.color}` }}
                                    />
                                    Clique pour colorer un mot :
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const el = conseilsTitleInputRef.current;
                                        if (!el) return;
                                        const start = el.selectionStart;
                                        const end = el.selectionEnd;
                                        if (start === end) return;
                                        const sel = currentTitle.substring(start, end);
                                        const rep = (sel.startsWith('*') && sel.endsWith('*') && sel.length >= 2) ? sel.slice(1, -1) : `*${sel.trim()}*`;
                                        const updated = currentTitle.substring(0, start) + rep + currentTitle.substring(end);
                                        setConseilsTitle(updated);
                                        setCustomText(updated);
                                    }}
                                    className="text-[9px] font-bold text-gray-400 hover:text-white transition-colors underline flex items-center gap-1"
                                    title="Sélectionne du texte dans le champ ci-dessus puis clique ici"
                                >
                                    Colorer sélection
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5 p-2 bg-black/40 border border-white/10 rounded-xl max-h-28 overflow-y-auto">
                                {rawWords.map((word, idx) => {
                                    const isHighlighted = word.startsWith('*') && word.endsWith('*') && word.length >= 2;
                                    const cleanWord = isHighlighted ? word.slice(1, -1) : word;
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                const parts = currentTitle.split(/(\s+)/);
                                                let curIdx = 0;
                                                const res = parts.map(p => {
                                                    if (/^\s+$/.test(p) || !p) return p;
                                                    if (curIdx === idx) {
                                                        curIdx++;
                                                        if (p.startsWith('*') && p.endsWith('*') && p.length >= 2) {
                                                            return p.slice(1, -1);
                                                        } else {
                                                            const clean = p.replace(/^\*+|\*+$/g, '');
                                                            return `*${clean}*`;
                                                        }
                                                    }
                                                    curIdx++;
                                                    return p;
                                                });
                                                const updated = res.join('');
                                                setConseilsTitle(updated);
                                                setCustomText(updated);
                                            }}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                                                isHighlighted 
                                                    ? 'shadow-md border-transparent' 
                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20'
                                            }`}
                                            style={isHighlighted ? {
                                                backgroundColor: `${activeColor.color}30`,
                                                borderColor: activeColor.color,
                                                color: activeColor.color,
                                                boxShadow: `0 0 10px ${activeColor.color}50`,
                                            } : undefined}
                                            title={isHighlighted ? "Cliquer pour repasser en blanc" : `Cliquer pour illuminer en ${theme}`}
                                        >
                                            {cleanWord}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}
            </div>

            {editorialSlide >= 2 && (() => {
                const currentSlideText = editorialSlide === 2 ? conseilsSubtext : (extraEditorialSlides[editorialSlide - 3] || '');
                return (
                    <div className="space-y-3">
                        {/* Header Slide info & delete button */}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-neon-cyan flex items-center gap-1.5">
                                <span>📄 Contenu de la Slide {editorialSlide}</span>
                                <span className="text-[8px] font-bold text-gray-400">({editorialSlide}/{2 + extraEditorialSlides.length})</span>
                            </span>
                            {editorialSlide >= 3 && (
                                <button
                                    type="button"
                                    onClick={() => removeEditorialSlide(editorialSlide)}
                                    className="px-2 py-1 text-[8.5px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all flex items-center gap-1 active:scale-95"
                                >
                                    🗑️ Supprimer Slide {editorialSlide}
                                </button>
                            )}
                        </div>

                        {/* Toggle Afficher / Masquer le grand titre sur Slide 2+ */}
                        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between shadow-sm">
                            <div className="space-y-0.5">
                                <div className="text-[10px] font-black uppercase text-white flex items-center gap-1.5">
                                    <span>Titre principal sur Slide {editorialSlide}</span>
                                    <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-bold ${showTitleOnSlide2 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'}`}>
                                        {showTitleOnSlide2 ? 'Affiché' : 'Masqué (Texte Plein Écran)'}
                                    </span>
                                </div>
                                <p className="text-[8.5px] text-gray-400">
                                    {showTitleOnSlide2 ? 'Le grand titre reste au-dessus.' : 'Masque le grand titre pour agrandir le texte de l\'article (38px) et libérer tout l\'espace.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowTitleOnSlide2(!showTitleOnSlide2)}
                                className={`px-3 py-1.5 rounded-xl text-[9.5px] font-black uppercase transition-all flex items-center gap-1.5 border ${
                                    showTitleOnSlide2
                                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20 shadow-md'
                                }`}
                            >
                                {showTitleOnSlide2 ? '👁️ Titre Visible' : '🚫 Titre Masqué'}
                            </button>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between pl-1">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <span>Texte de la slide</span>
                                    <span className="text-[8px] font-bold text-neon-cyan px-1.5 py-0.5 rounded bg-neon-cyan/10 border border-neon-cyan/20">Slide {editorialSlide}</span>
                                </label>
                                <span className="text-[8px] font-bold text-gray-500">Astuce: *mot*</span>
                            </div>
                            <textarea 
                                ref={conseilsSubtextInputRef}
                                rows={3}
                                value={currentSlideText} 
                                onChange={e => updateEditorialSlideText(editorialSlide, e.target.value)} 
                                placeholder={editorialSlide === 2 ? "EX: Halloween 2026\n*Electro* to Techno to Hard Techno" : `Texte pour la Slide ${editorialSlide}...`} 
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white italic focus:border-white/40 outline-none transition-all shadow-md resize-none" 
                            />
                            {(() => {
                                const rawWords = currentSlideText ? currentSlideText.split(/\s+/).filter(Boolean) : [];
                                if (rawWords.length === 0) return null;
                                return (
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <span 
                                                    className="w-2 h-2 rounded-full inline-block animate-pulse" 
                                                    style={{ backgroundColor: activeColor.color, boxShadow: `0 0 8px ${activeColor.color}` }}
                                                />
                                                Clique pour colorer un mot :
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const el = conseilsSubtextInputRef.current;
                                                    if (!el) return;
                                                    const start = el.selectionStart;
                                                    const end = el.selectionEnd;
                                                    if (start === end) return;
                                                    const sel = currentSlideText.substring(start, end);
                                                    const rep = (sel.startsWith('*') && sel.endsWith('*') && sel.length >= 2) ? sel.slice(1, -1) : `*${sel.trim()}*`;
                                                    const updated = currentSlideText.substring(0, start) + rep + currentSlideText.substring(end);
                                                    updateEditorialSlideText(editorialSlide, updated);
                                                }}
                                                className="text-[9px] font-bold text-gray-400 hover:text-white transition-colors underline flex items-center gap-1"
                                                title="Sélectionne du texte dans le champ ci-dessus puis clique ici"
                                            >
                                                Colorer sélection
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 p-2 bg-black/40 border border-white/10 rounded-xl max-h-28 overflow-y-auto">
                                            {rawWords.map((word, idx) => {
                                                const isHighlighted = word.startsWith('*') && word.endsWith('*') && word.length >= 2;
                                                const cleanWord = isHighlighted ? word.slice(1, -1) : word;
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            const parts = currentSlideText.split(/(\s+)/);
                                                            let curIdx = 0;
                                                            const res = parts.map(p => {
                                                                if (/^\s+$/.test(p) || !p) return p;
                                                                if (curIdx === idx) {
                                                                    curIdx++;
                                                                    if (p.startsWith('*') && p.endsWith('*') && p.length >= 2) {
                                                                        return p.slice(1, -1);
                                                                    } else {
                                                                        const clean = p.replace(/^\*+|\*+$/g, '');
                                                                        return `*${clean}*`;
                                                                    }
                                                                }
                                                                curIdx++;
                                                                return p;
                                                            });
                                                            updateEditorialSlideText(editorialSlide, res.join(''));
                                                        }}
                                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                                                            isHighlighted 
                                                                ? 'shadow-md border-transparent' 
                                                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20'
                                                        }`}
                                                        style={isHighlighted ? {
                                                            backgroundColor: `${activeColor.color}30`,
                                                            borderColor: activeColor.color,
                                                            color: activeColor.color,
                                                            boxShadow: `0 0 10px ${activeColor.color}50`,
                                                        } : undefined}
                                                        title={isHighlighted ? "Cliquer pour repasser en blanc" : `Cliquer pour illuminer en ${theme}`}
                                                    >
                                                        {cleanWord}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                );
            })()}
        </div>
    );

    const concoursEditor = (
        <div className="space-y-4">
            {/* Mode Switcher */}
            {!isGTA6Expired && (
                <div className="grid grid-cols-2 gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl">
                    <button
                        type="button"
                        onClick={() => {
                            setConcoursMode('GTA6');
                            setConcoursBottomColor('#ff007f');
                            setConcoursBadgeTextColor('#00f0ff');
                            setConcoursLateralText('JEU CONCOURS GTA 6');
                            if (!bgImage || !bgImage.includes('gta')) {
                                setBgImage('/images/gta6_vice_city_hero.jpg');
                                setBgVideo(null);
                            }
                            setTimeout(() => generateImage(), 50);
                        }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${
                            concoursMode === 'GTA6'
                                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-[0_0_15px_rgba(255,0,127,0.5)] border border-pink-400'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        🎮 Template GTA 6
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setConcoursMode('FESTIVAL');
                            setConcoursBottomColor('#008cff');
                            setConcoursBadgeTextColor('#ffffff');
                            setConcoursLateralText('JEUX CONCOURS');
                            setTimeout(() => generateImage(), 50);
                        }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${
                            concoursMode === 'FESTIVAL'
                                ? 'bg-[#008cff] text-white shadow-[0_0_15px_rgba(0,140,255,0.5)] border border-[#38bdf8]'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        🎪 Mode Festival
                    </button>
                </div>
            )}

            {!isGTA6Expired && concoursMode === 'GTA6' ? (
                <>
                    {/* Visual Presets GTA 6 */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-neon-cyan uppercase tracking-widest pl-1">
                            Fonds Vice City & GTA 6
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { name: '🌴 Vice City Néon', url: '/images/gta6_vice_city_hero.jpg' },
                                { name: '🔥 Cover Officielle', url: '/images/gta6_cover.jpg' },
                                { name: '👫 Lucia & Jason', url: '/images/gta6_lucia_jason.jpg' },
                                { name: '🛥️ Vice City Boat', url: '/images/gta_vice_city_boat.jpg' },
                                { name: '🏙️ Vice City Towers', url: '/images/gta_vice_city_towers.jpg' },
                                { name: '🪧 Enseigne Vice', url: '/images/gta_vice_city_sign.jpg' },
                            ].map((preset) => (
                                <button
                                    key={preset.url}
                                    type="button"
                                    onClick={() => {
                                        setBgImage(preset.url);
                                        setBgVideo(null);
                                        setTimeout(() => generateImage(), 50);
                                    }}
                                    className={`p-2 rounded-xl border text-[9px] font-bold text-center transition-all truncate ${
                                        bgImage === preset.url
                                            ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-[0_0_10px_rgba(255,0,127,0.3)]'
                                            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                    }`}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Titres GTA 6 */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Accroche Haute</label>
                        <input
                            value={concoursGTAHeadline}
                            onChange={e => {
                                setConcoursGTAHeadline(e.target.value);
                                setTimeout(() => generateImage(), 50);
                            }}
                            placeholder="DROPSIDERS TE FAIT GAGNER"
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold uppercase focus:border-white/40 outline-none transition-all shadow-md text-xs"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-pink-400 uppercase tracking-widest pl-1">Grand Titre (Lot)</label>
                            <input
                                value={concoursGTATitle}
                                onChange={e => {
                                    setConcoursGTATitle(e.target.value);
                                    setTimeout(() => generateImage(), 50);
                                }}
                                placeholder="GTA 6"
                                className="w-full bg-white/5 border border-pink-500/30 rounded-xl p-3 text-pink-300 font-extrabold uppercase focus:border-pink-500 outline-none transition-all shadow-md text-xs"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-yellow-400 uppercase tracking-widest pl-1">Sous-titre Plateforme</label>
                            <input
                                value={concoursGTAPlatformText}
                                onChange={e => {
                                    setConcoursGTAPlatformText(e.target.value);
                                    setTimeout(() => generateImage(), 50);
                                }}
                                placeholder="SUR LA PLATEFORME DE TON CHOIX"
                                className="w-full bg-white/5 border border-yellow-500/30 rounded-xl p-3 text-yellow-300 font-bold uppercase focus:border-yellow-400 outline-none transition-all shadow-md text-xs"
                            />
                        </div>
                    </div>

                    {/* Les 4 Conditions demandées */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between pl-1">
                            <label className="text-[9px] font-black text-neon-cyan uppercase tracking-widest">
                                4 Conditions de Participation
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    setConcoursGTACondition1('1 - likez la publication');
                                    setConcoursGTACondition2('2 - identifiez 2 potes qui doivent liker la page');
                                    setConcoursGTACondition3('3 - partagez en storie');
                                    setConcoursGTACondition4('4 - pour validez la participation repondez aux 3 questions qui sont disponible sur le site dropsiders.fr');
                                    setTimeout(() => generateImage(), 50);
                                }}
                                className="text-[9px] font-bold text-gray-400 hover:text-white underline"
                            >
                                Réinitialiser
                            </button>
                        </div>
                        <div className="space-y-2">
                            <div className="space-y-1">
                                <span className="text-[8px] font-black uppercase text-gray-400 block pl-1">Condition 1</span>
                                <input
                                    value={concoursGTACondition1}
                                    onChange={e => {
                                        setConcoursGTACondition1(e.target.value);
                                        setTimeout(() => generateImage(), 50);
                                    }}
                                    placeholder="1 - likez la publication"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-medium focus:border-neon-cyan outline-none transition-all text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[8px] font-black uppercase text-gray-400 block pl-1">Condition 2</span>
                                <input
                                    value={concoursGTACondition2}
                                    onChange={e => {
                                        setConcoursGTACondition2(e.target.value);
                                        setTimeout(() => generateImage(), 50);
                                    }}
                                    placeholder="2 - identifiez 2 potes qui doivent liker la page"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-medium focus:border-neon-cyan outline-none transition-all text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[8px] font-black uppercase text-gray-400 block pl-1">Condition 3</span>
                                <input
                                    value={concoursGTACondition3}
                                    onChange={e => {
                                        setConcoursGTACondition3(e.target.value);
                                        setTimeout(() => generateImage(), 50);
                                    }}
                                    placeholder="3 - partagez en storie"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-medium focus:border-neon-cyan outline-none transition-all text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[8px] font-black uppercase text-neon-cyan block pl-1">Condition 4 (Validation site web)</span>
                                <textarea
                                    rows={2}
                                    value={concoursGTACondition4}
                                    onChange={e => {
                                        setConcoursGTACondition4(e.target.value);
                                        setTimeout(() => generateImage(), 50);
                                    }}
                                    placeholder="4 - pour validez la participation repondez aux 3 questions qui sont disponible sur le site dropsiders.fr"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-medium focus:border-neon-cyan outline-none transition-all text-xs resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* Festival editor (original) */
                <>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Nom du Festival</label>
                        <input 
                            value={concoursFestivalName} 
                            onChange={e => {
                                setConcoursFestivalName(e.target.value);
                                setTimeout(() => generateImage(), 50);
                            }} 
                            placeholder="EX: TOMORROWLAND / DELTA FESTIVAL" 
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold uppercase focus:border-white/40 outline-none transition-all shadow-md text-xs" 
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-neon-cyan uppercase tracking-widest pl-1">@ du Festival (Instagram)</label>
                        <input 
                            value={concoursFestivalHandle} 
                            onChange={e => {
                                setConcoursFestivalHandle(e.target.value);
                                setTimeout(() => generateImage(), 50);
                            }} 
                            placeholder="ex: @tomorrowland" 
                            className="w-full bg-white/5 border border-neon-cyan/40 focus:border-neon-cyan rounded-xl p-3 text-white font-bold focus:shadow-[0_0_15px_rgba(0,255,255,0.2)] outline-none transition-all text-xs font-mono" 
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Étapes de participation fixes</label>
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1.5 text-[10px] text-gray-300 font-medium">
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-neon-cyan/20 text-neon-cyan font-black text-[9px] flex items-center justify-center flex-shrink-0">1</span>
                                <span>Follow la page <strong>@dropsiders.fr</strong> + <strong>{concoursFestivalHandle || '@festival'}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-neon-cyan/20 text-neon-cyan font-black text-[9px] flex items-center justify-center flex-shrink-0">2</span>
                                <span>Identifie la personne qui t'accompagnera</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-neon-cyan/20 text-neon-cyan font-black text-[9px] flex items-center justify-center flex-shrink-0">3</span>
                                <span>Partage en story <strong>(public)</strong> en nous identifiant + <strong>{concoursFestivalHandle || '@festival'}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-neon-cyan/20 text-neon-cyan font-black text-[9px] flex items-center justify-center flex-shrink-0">4</span>
                                <span>Repost ce post</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Common Color and Badge controls */}
            <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Couleur du Fondu Inférieur</label>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2.5">
                    <input 
                        type="color" 
                        value={concoursBottomColor} 
                        onChange={e => {
                            setConcoursBottomColor(e.target.value);
                            setTimeout(() => generateImage(), 50);
                        }} 
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0" 
                    />
                    <span className="text-xs font-mono font-bold text-white uppercase">{concoursBottomColor}</span>
                    <div className="flex gap-1.5 ml-auto">
                        {[
                            { color: '#ff007f', name: 'Vice City Rose Néon' },
                            { color: '#7000ff', name: 'Violet Royal Électrique' },
                            { color: '#00ffff', name: 'Cyan Néon' },
                            { color: '#ffe600', name: 'Jaune Or Néon' },
                            { color: '#00d26a', name: 'Émeraude' },
                        ].map(c => (
                            <button
                                key={c.color}
                                type="button"
                                onClick={() => {
                                    setConcoursBottomColor(c.color);
                                    setTimeout(() => generateImage(), 50);
                                }}
                                className="w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-110"
                                style={{ backgroundColor: c.color }}
                                title={c.name}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center pl-1">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Bandeau Haut Gauche</label>
                    <span className="text-[9px] font-mono font-bold text-neon-cyan">{Math.round(concoursLateralOpacity * 100)}%</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <input 
                        value={concoursLateralText} 
                        onChange={e => {
                            setConcoursLateralText(e.target.value);
                            setTimeout(() => generateImage(), 50);
                        }} 
                        placeholder={concoursMode === 'GTA6' ? 'JEU CONCOURS GTA 6' : 'JEUX CONCOURS'} 
                        className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-bold uppercase focus:border-white/40 outline-none text-xs" 
                    />
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3">
                        <input 
                            type="range" 
                            min="0.1" 
                            max="0.9" 
                            step="0.05"
                            value={concoursLateralOpacity} 
                            onChange={e => {
                                setConcoursLateralOpacity(parseFloat(e.target.value));
                                setTimeout(() => generateImage(), 50);
                            }} 
                            className="w-full accent-white cursor-pointer" 
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2.5">
                    <input 
                        type="color" 
                        value={concoursBadgeTextColor} 
                        onChange={e => {
                            setConcoursBadgeTextColor(e.target.value);
                            setTimeout(() => generateImage(), 50);
                        }} 
                        className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0" 
                        title="Couleur du texte du bandeau"
                    />
                    <span className="text-[11px] font-mono font-bold text-white uppercase">{concoursBadgeTextColor} (Texte Bandeau)</span>
                    <div className="flex gap-1.5 ml-auto">
                        {[
                            { color: '#00ffff', name: 'Cyan Néon' },
                            { color: '#ff007f', name: 'Rose Vif' },
                            { color: '#ffe600', name: 'Jaune Néon / Or' },
                            { color: '#ffffff', name: 'Blanc Pur' },
                            { color: '#00ff88', name: 'Vert Néon' }
                        ].map(c => (
                            <button
                                key={c.color}
                                type="button"
                                onClick={() => {
                                    setConcoursBadgeTextColor(c.color);
                                    setTimeout(() => generateImage(), 50);
                                }}
                                className="w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-110"
                                style={{ backgroundColor: c.color }}
                                title={c.name}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const mapEditor = (
        <div className="space-y-4">
            {/* 1. Nom du Festival */}
            <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Nom du Festival</label>
                <input 
                    value={mapFestivalText} 
                    onChange={e => {
                        setMapFestivalText(e.target.value);
                        setTimeout(() => generateImage(), 50);
                    }} 
                    placeholder="EX: LOLLAPALOOZA" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold italic uppercase focus:border-white/40 outline-none transition-all shadow-md" 
                />
            </div>

            {/* 2. Recherche Lieu, Ville & Pays */}
            <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Localisation</label>

                {/* Lieu spécifique (optionnel) */}
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 pl-1">
                        <span className="text-[8px] font-black text-neon-cyan/70 uppercase tracking-widest">📍 Lieu</span>
                        <span className="text-[7px] font-bold text-gray-600 uppercase">(optionnel)</span>
                    </div>
                    <div className="relative">
                        <input 
                            value={mapVenue}
                            onChange={e => setMapVenue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleGeocode(); }}
                            placeholder="EX: Parc de Schoore, Adidas Arena Paris..."
                            className={`w-full bg-neon-cyan/5 border rounded-xl p-3 pr-10 text-white font-bold focus:outline-none transition-all shadow-md text-xs placeholder-gray-600 ${
                                mapVenue.trim()
                                    ? 'border-neon-cyan/40 focus:border-neon-cyan/70 shadow-[0_0_8px_rgba(0,240,255,0.1)]'
                                    : 'border-white/10 focus:border-neon-cyan/30'
                            }`}
                        />
                        {mapVenue.trim() && (
                            <button
                                onClick={() => setMapVenue('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-red-500/30 text-gray-400 hover:text-white transition-all text-[10px]"
                                title="Effacer le lieu"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    {mapVenue.trim() && (
                        <p className="text-[8px] text-neon-cyan/60 pl-1 italic">🔍 Recherche : «&nbsp;{mapVenue.trim()}, {mapCity}, {mapCountry}&nbsp;»</p>
                    )}
                </div>

                {/* Ville & Pays */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest pl-1">Ville *</label>
                        <input 
                            value={mapCity}
                            onChange={e => setMapCity(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleGeocode(); }}
                            placeholder="EX: Las Vegas"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold focus:border-white/40 outline-none transition-all shadow-md text-xs placeholder-gray-600"
                        />
                    </div>
                    <div className="space-y-1 relative">
                        <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest pl-1">Pays *</label>
                        <input 
                            value={mapCountry}
                            onChange={e => setMapCountry(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleGeocode(); }}
                            placeholder="EX: France"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pr-10 text-white font-bold focus:border-white/40 outline-none transition-all shadow-md text-xs placeholder-gray-600"
                        />
                        {isMapLoading && (
                            <div className="absolute right-3 bottom-3 w-4 h-4 border-2 border-neon-red/50 border-t-neon-red rounded-full animate-spin" />
                        )}
                    </div>
                </div>
                <p className="text-[8px] text-gray-600 pl-1 italic">Appuie sur Entrée pour centrer la carte</p>
            </div>

            {/* 3. Texte du Badge personnalisé */}
            <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Texte de l'étiquette (Badge)</label>
                <input 
                    value={mapLabelText} 
                    onChange={e => {
                        setMapLabelText(e.target.value);
                        setTimeout(() => generateImage(), 50);
                    }} 
                    placeholder="EX: PARIS, FRANCE (Ou nom de scène...)" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold focus:border-white/40 outline-none transition-all shadow-md text-xs" 
                />
            </div>

            {/* 4. Style de la carte */}
            <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] uppercase font-black text-gray-500 pl-1">
                    <span>Style de la carte</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <button 
                        onClick={() => { setMapStyle('dark'); setTimeout(() => generateImage(), 50); }}
                        className={`py-2 text-[9px] font-black uppercase rounded-lg border transition-all ${mapStyle === 'dark' ? 'bg-white/10 border-white text-white font-black' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >
                        Sombre
                    </button>
                    <button 
                        onClick={() => { setMapStyle('voyager'); setTimeout(() => generateImage(), 50); }}
                        className={`py-2 text-[9px] font-black uppercase rounded-lg border transition-all ${mapStyle === 'voyager' ? 'bg-white/10 border-white text-white font-black' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >
                        Couleur
                    </button>
                    <button 
                        onClick={() => { setMapStyle('satellite'); setTimeout(() => generateImage(), 50); }}
                        className={`py-2 text-[9px] font-black uppercase rounded-lg border transition-all ${mapStyle === 'satellite' ? 'bg-white/10 border-white text-white font-black' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >
                        Satellite
                    </button>
                </div>
            </div>

            {/* 5. Zoom de la carte */}
            <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] uppercase font-black text-gray-500 pl-1">
                    <span>Zoom de la carte</span>
                    <span className="text-neon-red font-black">{mapZoom}</span>
                </div>
                <input 
                    type="range" 
                    min="3" 
                    max="18" 
                    value={mapZoom} 
                    onChange={e => {
                        setMapZoom(parseInt(e.target.value));
                        setTimeout(() => generateImage(), 50);
                    }} 
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-red" 
                />
            </div>

            {/* 6. Couleur du Marqueur & Badge */}
            <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Couleur du Marqueur (Néon)</label>
                <div className="flex gap-2.5 p-2 bg-white/5 border border-white/10 rounded-xl justify-around">
                    {[
                        { name: 'Red', hex: '#ff0033' },
                        { name: 'Cyan', hex: '#00f0ff' },
                        { name: 'Green', hex: '#39ff14' },
                        { name: 'Orange', hex: '#ff5e00' },
                        { name: 'Purple', hex: '#b026ff' },
                        { name: 'Yellow', hex: '#ffe600' },
                    ].map(col => (
                        <button
                            key={col.hex}
                            onClick={() => {
                                setMapPinColor(col.hex);
                                setTimeout(() => generateImage(), 50);
                            }}
                            className={`w-6 h-6 rounded-full border transition-all hover:scale-110 active:scale-95 ${mapPinColor === col.hex ? 'border-white scale-105 shadow-[0_0_10px_currentColor]' : 'border-white/20'}`}
                            style={{ backgroundColor: col.hex, color: col.hex }}
                            title={col.name}
                        />
                    ))}
                </div>
            </div>

            {/* 7. Options d'affichage */}
            <div className="grid grid-cols-2 gap-2 bg-white/5 border border-white/10 rounded-xl p-2">
                <button
                    onClick={() => {
                        setShowMapPin(!showMapPin);
                        setTimeout(() => generateImage(), 50);
                    }}
                    className={`py-1.5 rounded-lg text-[8px] font-black uppercase transition-all border ${showMapPin ? 'bg-white/10 border-white/30 text-white' : 'bg-transparent border-white/5 text-gray-500'}`}
                >
                    {showMapPin ? '✅ PIN ACTIVÉ' : '❌ PIN MASQUÉ'}
                </button>
                <button
                    onClick={() => {
                        setShowMapLabel(!showMapLabel);
                        setTimeout(() => generateImage(), 50);
                    }}
                    className={`py-1.5 rounded-lg text-[8px] font-black uppercase transition-all border ${showMapLabel ? 'bg-white/10 border-white/30 text-white' : 'bg-transparent border-white/5 text-gray-500'}`}
                >
                    {showMapLabel ? '✅ BADGE ACTIVÉ' : '❌ BADGE MASQUÉ'}
                </button>
            </div>

            {/* 8. Ajustement GPS (D-pad & Manuel) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest text-center">Décalage GPS de la carte</p>
                
                {/* D-pad */}
                <div className="grid grid-cols-3 gap-2 max-w-[120px] mx-auto">
                    <div></div>
                    <button
                        onClick={() => {
                            const step = 0.01 / Math.pow(2, mapZoom - 11);
                            setMapLatitude(prev => prev + step);
                            setTimeout(() => generateImage(), 50);
                        }}
                        className="py-1.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/30 text-white font-black text-[12px] flex items-center justify-center transition-all"
                        title="Nord"
                    >
                        ▲
                    </button>
                    <div></div>
                    <button
                        onClick={() => {
                            const step = 0.01 / Math.pow(2, mapZoom - 11);
                            setMapLongitude(prev => prev - step);
                            setTimeout(() => generateImage(), 50);
                        }}
                        className="py-1.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/30 text-white font-black text-[12px] flex items-center justify-center transition-all"
                        title="Ouest"
                    >
                        ◀
                    </button>
                    <button
                        onClick={() => {
                            handleGeocode();
                        }}
                        className="py-1.5 bg-neon-red/10 border border-neon-red/30 rounded-xl hover:bg-neon-red/20 text-neon-red font-black text-[9px] flex items-center justify-center uppercase transition-all"
                        title="Recenter sur la recherche"
                    >
                        ◉
                    </button>
                    <button
                        onClick={() => {
                            const step = 0.01 / Math.pow(2, mapZoom - 11);
                            setMapLongitude(prev => prev + step);
                            setTimeout(() => generateImage(), 50);
                        }}
                        className="py-1.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/30 text-white font-black text-[12px] flex items-center justify-center transition-all"
                        title="Est"
                    >
                        ▶
                    </button>
                    <div></div>
                    <button
                        onClick={() => {
                            const step = 0.01 / Math.pow(2, mapZoom - 11);
                            setMapLatitude(prev => prev - step);
                            setTimeout(() => generateImage(), 50);
                        }}
                        className="py-1.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/30 text-white font-black text-[12px] flex items-center justify-center transition-all"
                        title="Sud"
                    >
                        ▼
                    </button>
                    <div></div>
                </div>

                {/* Saisie Manuelle */}
                <div className="grid grid-cols-2 gap-2 text-[8px]">
                    <div className="space-y-1">
                        <label className="text-gray-500 uppercase font-black">Latitude (GPS)</label>
                        <input
                            type="number"
                            step="0.000001"
                            value={mapLatitude}
                            onChange={e => {
                                setMapLatitude(parseFloat(e.target.value) || 0);
                                setTimeout(() => generateImage(), 50);
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-center font-bold outline-none focus:border-white/30"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-gray-500 uppercase font-black">Longitude (GPS)</label>
                        <input
                            type="number"
                            step="0.000001"
                            value={mapLongitude}
                            onChange={e => {
                                setMapLongitude(parseFloat(e.target.value) || 0);
                                setTimeout(() => generateImage(), 50);
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-center font-bold outline-none focus:border-white/30"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const citationEditor = (
        <div className="space-y-4">
            {textEditor}
            <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Auteur de la citation</label>
                <input 
                    value={citationAuthor} 
                    onChange={e => setCitationAuthor(e.target.value)} 
                    placeholder="EX: LAURENT GARNIER" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold italic uppercase focus:border-white/40 outline-none transition-all shadow-md" 
                />
            </div>
            <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Média / Contexte</label>
                <input 
                    value={citationMedia} 
                    onChange={e => setCitationMedia(e.target.value)} 
                    placeholder="EX: pour Toca UOL" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold italic focus:border-white/40 outline-none transition-all shadow-md" 
                />
            </div>
        </div>
    );

    const exportButtons = (
        <div className="p-4 bg-gradient-to-b from-white/[0.08] to-black/60 border border-white/15 rounded-3xl space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-neon-cyan" />
                    <span className="text-[10px] font-black uppercase text-white tracking-widest">Centre d'Exportation</span>
                </div>
                <span className="text-[8px] font-bold text-gray-400 uppercase bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                    {theme} • {activeTab === 'REEL' ? 'Story / Reel 9:16' : 'Post 1:1'}
                </span>
            </div>

            {/* Section 1 : Visuel Actuel (PNG) */}
            <div className="space-y-1.5">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">📸 Visuel Actuel (PNG)</span>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => downloadFormat('PUBLICATION')}
                        disabled={isDownloading}
                        className="py-2.5 px-3 bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/30 hover:border-neon-cyan text-neon-cyan rounded-xl text-[9.5px] font-black uppercase flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-40"
                    >
                        <Download className="w-3.5 h-3.5" /> PNG POST
                    </button>
                    <button
                        type="button"
                        onClick={() => downloadFormat('REEL')}
                        disabled={isDownloading}
                        className="py-2.5 px-3 bg-neon-purple/10 hover:bg-neon-purple/20 border border-neon-purple/30 hover:border-neon-purple text-neon-purple rounded-xl text-[9.5px] font-black uppercase flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-40"
                    >
                        <Download className="w-3.5 h-3.5" /> PNG STORY
                    </button>
                </div>
            </div>

            {/* Section 2 : Slide Promo Outro (PNG) */}
            <div className="space-y-1.5">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">🔥 Slide Promo Outro (PNG)</span>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => downloadPromoFormat('PUBLICATION')}
                        disabled={isDownloading}
                        className="py-2.5 px-3 bg-neon-red/10 hover:bg-neon-red/20 border border-neon-red/30 hover:border-neon-red text-neon-red rounded-xl text-[9.5px] font-black uppercase flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-40"
                    >
                        <Download className="w-3.5 h-3.5" /> PROMO POST
                    </button>
                    <button
                        type="button"
                        onClick={() => downloadPromoFormat('REEL')}
                        disabled={isDownloading}
                        className="py-2.5 px-3 bg-neon-red/10 hover:bg-neon-red/20 border border-neon-red/30 hover:border-neon-red text-neon-red rounded-xl text-[9.5px] font-black uppercase flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-40"
                    >
                        <Download className="w-3.5 h-3.5" /> PROMO STORY
                    </button>
                </div>
            </div>

            {/* Section Carrousel Événements (Slide 1 + 2) */}
            {(theme === 'EVENTS' || theme === 'AFFICHE') && (
                <div className="space-y-1.5 pt-1 border-t border-white/10">
                    <span className="text-[8px] font-black text-[#ff007f] uppercase tracking-wider block">🎨 Carrousel Événement (Post + Affiche)</span>
                    <button
                        type="button"
                        onClick={() => downloadEventsCarousel()}
                        disabled={isDownloading}
                        className="w-full py-2.5 bg-gradient-to-r from-[#ff007f] to-[#ff4400] hover:from-[#ff1a8c] hover:to-[#ff551a] text-white font-black text-[10px] uppercase rounded-xl shadow-lg shadow-pink-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-40"
                    >
                        <Download className="w-4 h-4" /> Télécharger Carrousel (Slide 1 + 2)
                    </button>
                </div>
            )}

            {/* Section 3 : Vidéo Animée (MP4) */}
            <div className="space-y-1.5 pt-1 border-t border-white/10">
                <button
                    type="button"
                    onClick={() => setVideoOptionsOpen(o => !o)}
                    className="w-full flex items-center justify-between gap-2 group py-0.5"
                    title={videoOptionsOpen ? 'Masquer la vidéo animée' : 'Afficher la vidéo animée'}
                >
                    <span className="text-[8px] font-black text-gray-400 group-hover:text-white uppercase tracking-wider transition-colors">🎬 Vidéo Animée (MP4)</span>
                    <span className="flex items-center gap-1.5">
                        <AccordionBadge
                            active={isVideoRecording || textAnimation !== 'NONE' || bgAnimation !== 'NONE'}
                            label={isVideoRecording ? '● REC' : `${activeTab === 'REEL' ? '9:16' : '1:1'} • ${exportFps} FPS`}
                        />
                        <AccordionChevron open={videoOptionsOpen} />
                    </span>
                </button>
                {!videoOptionsOpen ? null : theme === 'PLANNING' ? (
                    <button
                        type="button"
                        onClick={() => startVideoRecording('PLANNING')}
                        disabled={isVideoRecording}
                        className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2.5 transition-all shadow-xl ${
                            isVideoRecording
                                ? 'bg-[#ff3700]/30 text-[#ff3700] border border-[#ff3700]/50 animate-pulse'
                                : 'bg-gradient-to-r from-[#ff3700] via-orange-500 to-amber-500 text-black hover:brightness-110 active:scale-[0.98] shadow-[0_0_25px_rgba(255,55,0,0.45)]'
                        }`}
                    >
                        <Video className="w-4 h-4 text-black" />
                        {isVideoRecording ? 'CAPTURE VIDÉO EN COURS...' : '🎬 EXPORTER VIDÉO COMPLÈTE (SLIDE 1 + 2 + PROMO) • MP4'}
                    </button>
                ) : ['NEWS', 'FOCUS', 'RECAP', 'MUSIQUE', 'INTERVIEW', 'LIVESTREAM', 'CONSEILS', 'REELS', 'CONCOURS'].includes(theme) ? (
                    <div className="space-y-2">
{/* Configuration Reel : Format & Timing */}
                        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-2.5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-[9px] font-black uppercase text-white flex items-center gap-1.5">
                                        ⚡ Format Vidéo {activeTab === 'REEL' ? 'Reel 9:16' : 'Post 1:1'} • {theme}
                                    </span>
                                    <p className="text-[8px] text-gray-400">
                                        {skipEditorialSlide2
                                            ? 'Slide 2 masquée (Slide 1 + Promo uniquement)'
                                            : `Complet (Slide 1 + Slide 2${extraEditorialSlides.length > 0 ? ` + ${extraEditorialSlides.length} slides` : ''} + Promo)`}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSkipEditorialSlide2(!skipEditorialSlide2)}
                                    className={`px-2.5 py-1.5 rounded-xl text-[8.5px] font-black uppercase transition-all border flex items-center gap-1.5 ${
                                        skipEditorialSlide2
                                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                                            : 'bg-white/10 border-white/20 text-gray-300 hover:text-white'
                                    }`}
                                >
                                    {skipEditorialSlide2 ? '🚫 Slide 2 Masquée' : '👁️ Slide 2 Incluse'}
                                </button>
                            </div>

                            {/* Durée Slide 1 */}
                            <div className="pt-2 border-t border-white/10 space-y-1.5">
                                <div className="flex items-center justify-between text-[8.5px]">
                                    <span className="text-gray-300 font-bold flex items-center gap-1">
                                        ⏱️ Durée Slide 1 (Titre) :
                                    </span>
                                    <span className="text-amber-400 font-mono font-black bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                        {editorialSlide1Duration} secondes
                                    </span>
                                </div>
                                <div className="flex gap-1.5">
                                    {[3, 4, 5, 7, 10].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setEditorialSlide1Duration(s)}
                                            className={`flex-1 py-1 rounded-lg text-[8px] font-black transition-all border ${
                                                editorialSlide1Duration === s
                                                    ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                            }`}
                                        >
                                            {s}s
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="range"
                                    min="2"
                                    max="15"
                                    step="0.5"
                                    value={editorialSlide1Duration}
                                    onChange={(e) => setEditorialSlide1Duration(parseFloat(e.target.value))}
                                    className="w-full accent-amber-400 h-1 bg-white/10 rounded-lg cursor-pointer"
                                />
                            </div>

                            {/* Durée Promo Outro */}
                            <div className="pt-2 border-t border-white/10 space-y-1.5">
                                <div className="flex items-center justify-between text-[8.5px]">
                                    <span className="text-gray-300 font-bold flex items-center gap-1">
                                        🔥 Durée Outro Promo :
                                    </span>
                                    <span className="text-rose-400 font-mono font-black bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                                        {editorialPromoDuration} secondes
                                    </span>
                                </div>
                                <div className="flex gap-1.5">
                                    {[2.5, 3.5, 4.5, 6].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setEditorialPromoDuration(s)}
                                            className={`flex-1 py-1 rounded-lg text-[8px] font-black transition-all border ${
                                                editorialPromoDuration === s
                                                    ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                            }`}
                                        >
                                            {s}s
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sélecteur de Fluidité (FPS) */}
                            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[8.5px]">
                                <div className="space-y-0.5">
                                    <span className="font-bold text-gray-300 flex items-center gap-1">
                                        🚀 Fluidité Vidéo :
                                    </span>
                                    <span className="text-[7.5px] text-gray-400">
                                        {exportFps === 60 ? '60 FPS Ultra-Fluide • Audio 256k' : '30 FPS Standard • Audio 256k'}
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    {[60, 30].map(f => (
                                        <button
                                            key={f}
                                            type="button"
                                            onClick={() => setExportFps(f)}
                                            className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase transition-all border ${
                                                exportFps === f
                                                    ? 'bg-neon-cyan text-black border-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            {f} FPS {f === 60 ? '✨' : ''}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Résumé timing */}
                            <div className="p-2 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between text-[8px] text-gray-300">
                                <span>Timing : S1 ({editorialSlide1Duration}s) + Promo ({editorialPromoDuration}s)</span>
                                <span className="text-neon-cyan font-mono font-bold">
                                    Total : ~{(((skipEditorialSlide2 ? (1 + extraEditorialSlides.length) : (2 + extraEditorialSlides.length)) * editorialSlide1Duration) + ((skipEditorialSlide2 ? (1 + extraEditorialSlides.length) : (2 + extraEditorialSlides.length)) * 0.7) + editorialPromoDuration).toFixed(1)}s • {exportFps} FPS
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => startVideoRecording('EDITORIAL')}
                            disabled={isVideoRecording}
                            className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2.5 transition-all shadow-xl ${
                                isVideoRecording
                                    ? 'bg-red-500/30 text-red-400 border border-red-500/50 animate-pulse'
                                    : 'bg-gradient-to-r from-neon-red via-rose-500 to-pink-600 text-white hover:brightness-110 active:scale-[0.98] shadow-[0_0_25px_rgba(255,0,51,0.45)]'
                            }`}
                        >
                            <Video className="w-4 h-4" />
                            {isVideoRecording
                                ? 'CAPTURE VIDÉO EN COURS...'
                                : skipEditorialSlide2
                                    ? `🎬 EXPORTER VIDÉO (${activeTab === 'REEL' ? 'REEL 9:16' : 'POST 1:1'} • ${exportFps} FPS • SLIDE 1 [${editorialSlide1Duration}s] + PROMO [${editorialPromoDuration}s]) • MP4`
                                    : `🎬 EXPORTER VIDÉO COMPLÈTE (${activeTab === 'REEL' ? 'REEL 9:16' : 'POST 1:1'} • ${exportFps} FPS • ${2 + extraEditorialSlides.length} SLIDES + PROMO) • MP4`}
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => startVideoRecording('NONE')}
                        disabled={isVideoRecording}
                        className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2.5 transition-all shadow-xl ${
                            isVideoRecording
                                ? 'bg-red-500/30 text-red-400 border border-red-500/50 animate-pulse'
                                : 'bg-gradient-to-r from-neon-red to-pink-600 text-white hover:brightness-110 active:scale-[0.98] shadow-[0_0_25px_rgba(255,0,51,0.45)]'
                        }`}
                    >
                        <Video className="w-4 h-4" />
                        {isVideoRecording ? 'CAPTURE MP4 EN COURS...' : `🎬 EXPORTER EN VIDÉO MP4 (${activeTab === 'REEL' ? 'REEL 9:16' : theme})`}
                    </button>
                )}
            </div>

            {/* Actions secondaires */}
            <div className="pt-2 border-t border-white/5 flex gap-2">
                <button
                    type="button"
                    onClick={addVisualToList}
                    className="flex-1 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-[8.5px] font-black uppercase flex items-center justify-center gap-1.5 transition-all"
                >
                    <PlusCircle className="w-3 h-3" /> Ajouter à la liste
                </button>
                <button
                    type="button"
                    onClick={() => downloadBackgroundVisual(activeTab)}
                    disabled={isDownloading}
                    className="flex-1 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-[8.5px] font-black uppercase flex items-center justify-center gap-1.5 transition-all"
                    title="Exporter l'image de fond seule sans texte"
                >
                    <Download className="w-3 h-3 text-neon-cyan" /> Fond seul
                </button>
            </div>
        </div>
    );

        const afficheEditor = (() => {
        const isMusicTheme = (theme === 'MUSIQUE');
        const accentTextClass = isMusicTheme ? 'text-[#00ff66]' : 'text-neon-red';
        const accentGlowBorder = isMusicTheme ? 'border-[#00ff66]/40 text-[#00ff66] bg-[#00ff66]/20' : 'border-neon-red/40 text-neon-red bg-neon-red/20';
        const accentSlider = isMusicTheme ? 'accent-[#00ff66]' : 'accent-neon-red';

        return (
            <div className="space-y-4">
                {/* 1. AFFICHE / COVER DE LA TRACK (CARTE FLOTTANTE) */}
                <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <label className={`text-[10px] font-black ${accentTextClass} uppercase tracking-widest flex items-center gap-1.5`}>
                            {isMusicTheme ? '💿 Cover du Track (1:1 Carré)' : '🖼️ Affiche de l\'Événement'}
                        </label>
                        {afficheImage && (
                            <button
                                type="button"
                                onClick={() => {
                                    setAfficheImage('');
                                    afficheImageRef.current = null;
                                    setTimeout(() => generateImage(), 50);
                                }}
                                className="text-[9px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase"
                            >
                                Retirer
                            </button>
                        )}
                    </div>

                    {/* Hidden file input */}
                    <input
                        type="file"
                        ref={afficheFileInputRef}
                        onChange={handleAfficheImageChange}
                        accept="image/*"
                        className="hidden"
                    />

                    {afficheImage ? (
                        <div className={`relative group rounded-xl overflow-hidden border border-white/20 bg-black/40 ${isMusicTheme ? 'aspect-square max-h-48' : 'aspect-[4/5] max-h-48'} mx-auto flex items-center justify-center`}>
                            <img src={afficheImage} alt={isMusicTheme ? "Cover Track" : "Affiche Event"} className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => afficheFileInputRef.current?.click()}
                                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-[10px] font-black uppercase backdrop-blur-md"
                                >
                                    Changer
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => afficheFileInputRef.current?.click()}
                            className={`w-full py-6 border-2 border-dashed border-white/15 ${isMusicTheme ? 'hover:border-[#00ff66]/50 hover:bg-[#00ff66]/5' : 'hover:border-neon-red/50 hover:bg-neon-red/5'} rounded-2xl flex flex-col items-center justify-center gap-2 bg-black/20 transition-all group`}
                        >
                            <Upload className={`w-6 h-6 text-gray-500 ${isMusicTheme ? 'group-hover:text-[#00ff66]' : 'group-hover:text-neon-red'} transition-colors`} />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider group-hover:text-white transition-colors">
                                {isMusicTheme ? 'Importer la cover (Artwork carré 1:1)' : 'Importer l\'affiche (Photo / Poster)'}
                            </span>
                            <span className="text-[8px] text-gray-500">PNG, JPG, WEBP (Carré 1:1 recommandé)</span>
                        </button>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => afficheFileInputRef.current?.click()}
                            className="py-2.5 bg-white/5 border border-white/10 hover:border-white/25 rounded-xl text-[9px] font-black uppercase text-white flex items-center justify-center gap-1.5 transition-all"
                        >
                            <Upload className={`w-3.5 h-3.5 ${accentTextClass}`} /> Fichier Local
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setR2TargetType('affiche');
                                setIsR2ModalOpen(true);
                            }}
                            className="py-2.5 bg-white/5 border border-white/10 hover:border-white/25 rounded-xl text-[9px] font-black uppercase text-white flex items-center justify-center gap-1.5 transition-all"
                        >
                            <ImageIcon className="w-3.5 h-3.5 text-neon-cyan" /> Cloud R2
                        </button>
                    </div>

                    {/* Direct Image URL input */}
                    <div className="pt-1">
                        <input
                            type="url"
                            placeholder={isMusicTheme ? "OU COLLER LE LIEN DIRECT DE LA COVER..." : "OU COLLER LE LIEN D'UNE AFFICHE..."}
                            value={afficheImage.startsWith('blob:') ? '' : afficheImage}
                            onChange={e => {
                                setAfficheImage(e.target.value);
                            }}
                            className={`w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-[9px] font-medium placeholder-gray-500 outline-none ${isMusicTheme ? 'focus:border-[#00ff66]/50' : 'focus:border-neon-red/50'} transition-all`}
                        />
                    </div>

                    {/* Mode Cover vs Contain */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                            type="button"
                            onClick={() => { setAfficheMode('cover'); setTimeout(() => generateImage(), 50); }}
                            className={`py-1.5 rounded-lg text-[8px] font-black uppercase border transition-all ${afficheMode === 'cover' ? 'bg-white/15 border-white text-white' : 'bg-black/20 border-white/5 text-gray-500 hover:text-white'}`}
                        >
                            Remplir (Cover)
                        </button>
                        <button
                            type="button"
                            onClick={() => { setAfficheMode('contain'); setTimeout(() => generateImage(), 50); }}
                            className={`py-1.5 rounded-lg text-[8px] font-black uppercase border transition-all ${afficheMode === 'contain' ? 'bg-white/15 border-white text-white' : 'bg-black/20 border-white/5 text-gray-500 hover:text-white'}`}
                        >
                            Entière (Contain)
                        </button>
                    </div>

                    {/* Contrôles de taille et position */}
                    <div className="space-y-2.5 pt-2 border-t border-white/5">
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[9px] font-black uppercase text-gray-400">
                                <span>{isMusicTheme ? 'Taille de la Cover' : 'Taille de l\'affiche'}</span>
                                <span className={`${accentTextClass} font-mono`}>{afficheScale}%</span>
                            </div>
                            <input
                                type="range"
                                min="60"
                                max="120"
                                value={afficheScale}
                                onChange={(e) => {
                                    setAfficheScale(Number(e.target.value));
                                    setTimeout(() => generateImage(), 30);
                                }}
                                className={`w-full ${accentSlider} bg-white/10 rounded-lg h-1.5 cursor-pointer`}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[9px] font-black uppercase text-gray-400">
                                <span>Position Verticale</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-300 font-mono text-[8px]">{afficheOffsetY > 0 ? `+${afficheOffsetY}` : afficheOffsetY}px</span>
                                    {(afficheOffsetY !== 0 || afficheScale !== 100) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAfficheScale(100);
                                                setAfficheOffsetY(0);
                                                setTimeout(() => generateImage(), 30);
                                            }}
                                            className={`text-[8px] ${accentTextClass} hover:underline cursor-pointer uppercase font-bold`}
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </div>
                            <input
                                type="range"
                                min="-150"
                                max="150"
                                value={afficheOffsetY}
                                onChange={(e) => {
                                    setAfficheOffsetY(Number(e.target.value));
                                    setTimeout(() => generateImage(), 30);
                                }}
                                className={`w-full ${accentSlider} bg-white/10 rounded-lg h-1.5 cursor-pointer`}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[9px] font-black text-gray-400 uppercase">Lueur 3D & Ombre Portée</span>
                        <button
                            type="button"
                            onClick={() => {
                                setAfficheGlow(!afficheGlow);
                                setTimeout(() => generateImage(), 50);
                            }}
                            className={`px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all ${afficheGlow ? accentGlowBorder : 'bg-white/5 text-gray-500 border border-white/10'}`}
                        >
                            {afficheGlow ? 'ACTIVE' : 'DÉSACTIVÉE'}
                        </button>
                    </div>
                </div>

                {/* 2. IMAGE DE FOND (SCÈNE / FESTIVAL / WAREHOUSE) */}
                <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                            🎆 Image de Fond (Ambiance Floutée)
                        </label>
                        <span className="text-[8px] font-bold text-neon-cyan uppercase bg-neon-cyan/10 px-2 py-0.5 rounded-full border border-neon-cyan/20">
                            Flou auto cohérent
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="py-2.5 bg-white/5 border border-white/10 hover:border-white/25 rounded-xl text-[9px] font-black uppercase text-white flex items-center justify-center gap-1.5 transition-all"
                        >
                            <Upload className={`w-3.5 h-3.5 ${accentTextClass}`} /> Importer Fond
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setR2TargetType('background');
                                setIsR2ModalOpen(true);
                            }}
                            className="py-2.5 bg-white/5 border border-white/10 hover:border-white/25 rounded-xl text-[9px] font-black uppercase text-white flex items-center justify-center gap-1.5 transition-all"
                        >
                            <ImageIcon className="w-3.5 h-3.5 text-neon-cyan" /> Fond Cloud R2
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsDownloaderOpen(true)}
                        className="w-full py-2 bg-white/5 border border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 text-gray-400 text-[9px] font-black uppercase hover:border-white/30 hover:text-white transition-all"
                    >
                        <LinkIcon className="w-3.5 h-3.5 text-neon-cyan" /> Télécharger via Lien (URL)
                    </button>
                    <button
                        type="button"
                        onClick={() => downloadBackgroundVisual(activeTab)}
                        disabled={isDownloading}
                        className="w-full py-2 bg-white/5 border border-white/10 hover:border-white/25 rounded-xl text-[9px] font-black uppercase text-white hover:text-neon-cyan flex items-center justify-center gap-1.5 transition-all"
                    >
                        <Download className="w-3.5 h-3.5 text-neon-cyan" /> Exporter le Fond Visuel (PNG)
                    </button>
                    {theme !== 'MAP' && bgAnimationControl}
                </div>

                {/* 3. SWIPE DROPSIDERS >> */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <span className="text-[9px] font-black text-white uppercase block">Swipe Studio</span>
                        <span className="text-[8px] text-gray-500 font-medium">Afficher la mention swipe en bas à droite</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setShowSwipe(!showSwipe);
                            setTimeout(() => generateImage(), 50);
                        }}
                        className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase transition-all ${showSwipe ? accentGlowBorder : 'bg-white/5 text-gray-500 border border-white/10'}`}
                    >
                        {showSwipe ? 'ACTIF' : 'MASQUÉ'}
                    </button>
                </div>

                {exportButtons}
            </div>
        );
    })();

    const eventsEditor = (
        <div className="space-y-4">
            {/* Slide 1 Content */}
            {eventsSlide === 1 && (
                <div className="space-y-3">
                    <div className="px-1 py-1 text-[9px] font-bold text-gray-400 uppercase flex items-center justify-between">
                        <span>Édition Post Événement</span>
                        <span className="text-[#ff007f]">Slide 1</span>
                    </div>
                    {conseilsEditor}
                </div>
            )}

            {/* Slide 2 Content (Affiche) */}
            {eventsSlide === 2 && (
                <div className="space-y-3">
                    <div className="px-1 py-1 text-[9px] font-bold text-gray-400 uppercase flex items-center justify-between">
                        <span>Édition Affiche de l'Événement</span>
                        <span className="text-[#ff007f]">Slide 2</span>
                    </div>
                    {afficheEditor}
                </div>
            )}
        </div>
    );

    const musiqueEditor = (() => {
        const totalSlides = 1 + musicTracks.length; // Slide 1 (annonce) + Tracks
        const activeTrackIdx = Math.max(0, editorialSlide - 2);
        const activeTrack = musicTracks[activeTrackIdx] || createEmptyMusicTrack();
        const activeCoverUrl = activeTrack.cover || (activeTrackIdx === 0 ? afficheImage : '');

        return (
            <div className="space-y-4">
                {/* 1. CARROUSEL SLIDE SWITCHER (JUSQU'À 20 SLIDES EN TOUT) */}
                <div className="p-2.5 bg-black/60 border border-[#00ff66]/30 rounded-2xl space-y-2.5 shadow-xl">
                    <div className="flex items-center justify-between text-[8.5px] font-bold text-gray-400 uppercase px-1">
                        <span className="flex items-center gap-1.5">
                            <span className="text-[#00ff66] font-black">CARROUSEL MUSIQUE</span>
                            <span>({totalSlides}/20 max)</span>
                        </span>
                        {musicTracks.length < MAX_MUSIC_TRACKS && (
                            <button
                                type="button"
                                onClick={addMusicTrack}
                                className="px-2.5 py-1 bg-[#00ff66]/20 hover:bg-[#00ff66]/30 text-[#00ff66] border border-[#00ff66]/40 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 shadow-sm active:scale-95"
                            >
                                <span>➕</span> Ajouter Track
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
                        <button
                            type="button"
                            onClick={() => { setIsCarouselPromoActive(false); setEditorialSlide(1); }}
                            className={`flex-1 min-w-[110px] py-2 px-2.5 rounded-xl text-[9.5px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                                !isCarouselPromoActive && editorialSlide === 1
                                    ? 'bg-[#00ff66] text-black shadow-[0_0_15px_rgba(0,255,102,0.5)] scale-[1.02]'
                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <span className="text-xs">📢</span> Slide 1 : Annonce
                        </button>

                        {musicTracks.map((tr, idx) => {
                            const sNum = idx + 2;
                            const isSelected = !isCarouselPromoActive && editorialSlide === sNum;
                            return (
                                <button
                                    key={sNum}
                                    type="button"
                                    onClick={() => { setIsCarouselPromoActive(false); setEditorialSlide(sNum); }}
                                    className={`flex-1 min-w-[110px] py-2 px-2.5 rounded-xl text-[9.5px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                                        isSelected
                                            ? 'bg-[#00ff66] text-black shadow-[0_0_15px_rgba(0,255,102,0.5)] scale-[1.02]'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    <span className="text-xs">💿</span> S{sNum} : {tr.title ? (tr.title.length > 10 ? tr.title.substring(0, 10) + '...' : tr.title) : `Track ${idx + 1}`}
                                </button>
                            );
                        })}

                        <button
                            type="button"
                            onClick={() => {
                                setIsCarouselPromoActive(true);
                                setTimeout(() => generateImage(), 50);
                            }}
                            className={`flex-1 min-w-[110px] py-2 px-2.5 rounded-xl text-[9.5px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                                isCarouselPromoActive
                                    ? 'bg-neon-red text-white shadow-[0_0_15px_rgba(255,0,51,0.5)] scale-[1.02]'
                                    : 'bg-neon-red/10 border border-neon-red/30 text-neon-red hover:bg-neon-red/20'
                            }`}
                            title="Slide de fin d'outro promo Dropsiders"
                        >
                            <span className="text-xs">🔥</span> Slide PROMO
                        </button>
                    </div>
                </div>

                {/* 2. Quick Carousel Download Bar */}
                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[8px] font-bold text-gray-400 uppercase px-1">
                        <span>Export Carrousel Rapide ({totalSlides} Slides)</span>
                        <span className="text-[#00ff66]">Format {activeTab === 'REEL' ? 'Story' : 'Post (4:5)'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: totalSlides }).map((_, i) => (
                            <button
                                key={i + 1}
                                type="button"
                                onClick={() => downloadEditorialSlide(i + 1)}
                                disabled={isDownloading}
                                className="flex-1 min-w-[55px] py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-black text-[9px] uppercase rounded-lg transition-all flex items-center justify-center gap-1"
                            >
                                <Download className="w-3 h-3 text-[#00ff66]" /> S{i + 1}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => downloadEditorialCarousel()}
                        disabled={isDownloading}
                        className="w-full py-2.5 bg-gradient-to-r from-[#00ff66] to-[#00cc88] hover:from-[#33ff85] hover:to-[#00e699] text-black font-black text-[10px] uppercase rounded-lg shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
                    >
                        <Download className="w-4 h-4 text-black" /> Télécharger Carrousel Musique ({totalSlides} Slides)
                    </button>
                </div>

                {/* 3. Slide 1 Content (Annonce) */}
                {editorialSlide === 1 && (
                    <div className="space-y-3 pt-2">
                        <div className="px-1 py-1 text-[9px] font-bold text-gray-400 uppercase flex items-center justify-between">
                            <span>Édition Annonce Sortie Track</span>
                            <span className="text-[#00ff66]">Slide 1 (Intro)</span>
                        </div>
                        {conseilsEditor}
                    </div>
                )}

                {/* 4. Slide 2..19 Content (Fiche Track avec Pochette + Titre + Artiste + Label) */}
                {editorialSlide >= 2 && (
                    <div className="space-y-4 pt-2">
                        <div className="px-1 py-1 text-[9px] font-bold text-gray-400 uppercase flex items-center justify-between border-b border-white/10 pb-2">
                            <span className="flex items-center gap-2">
                                <span className="text-white font-black">TRACK {String(activeTrackIdx + 1).padStart(2, '0')}</span>
                                <span className="text-[#00ff66]">Slide {editorialSlide}</span>
                            </span>
                            {musicTracks.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeMusicTrack(activeTrackIdx)}
                                    className="text-[9px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase flex items-center gap-1"
                                >
                                    🗑️ Supprimer cette slide
                                </button>
                            )}
                        </div>

                        {/* SECTION A : POCHETTE CARREE 1:1 */}
                        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-[#00ff66] uppercase tracking-widest flex items-center gap-1.5">
                                    💿 Pochette du Son (Cover 1:1)
                                </label>
                                {activeCoverUrl && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            updateMusicTrack(activeTrackIdx, { cover: '' });
                                            if (activeTrackIdx === 0) {
                                                setAfficheImage('');
                                                afficheImageRef.current = null;
                                            }
                                            setTimeout(() => generateImage(), 50);
                                        }}
                                        className="text-[9px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase"
                                    >
                                        Retirer
                                    </button>
                                )}
                            </div>

                            <input
                                type="file"
                                ref={afficheFileInputRef}
                                onChange={handleAfficheImageChange}
                                accept="image/*"
                                className="hidden"
                            />

                            {activeCoverUrl ? (
                                <div className="relative group rounded-xl overflow-hidden border border-[#00ff66]/30 bg-black/40 aspect-square max-h-48 mx-auto flex items-center justify-center shadow-lg">
                                    <img src={activeCoverUrl} alt="Cover Track" className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => afficheFileInputRef.current?.click()}
                                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-[10px] font-black uppercase backdrop-blur-md"
                                        >
                                            Changer
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => afficheFileInputRef.current?.click()}
                                    className="w-full py-6 border-2 border-dashed border-white/15 hover:border-[#00ff66]/50 hover:bg-[#00ff66]/5 rounded-2xl flex flex-col items-center justify-center gap-2 bg-black/20 transition-all group"
                                >
                                    <Upload className="w-6 h-6 text-gray-500 group-hover:text-[#00ff66] transition-colors" />
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider group-hover:text-white transition-colors">
                                        Importer la pochette (Carré 1:1)
                                    </span>
                                    <span className="text-[8px] text-gray-500">PNG, JPG, WEBP • Pochette officielle</span>
                                </button>
                            )}

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => afficheFileInputRef.current?.click()}
                                    className="py-2.5 bg-white/5 border border-white/10 hover:border-white/25 rounded-xl text-[9px] font-black uppercase text-white flex items-center justify-center gap-1.5 transition-all"
                                >
                                    <Upload className="w-3.5 h-3.5 text-[#00ff66]" /> Fichier Local
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setR2TargetType('musicCover');
                                        setR2TargetIdx(activeTrackIdx);
                                        setIsR2ModalOpen(true);
                                    }}
                                    className="py-2.5 bg-white/5 border border-white/10 hover:border-white/25 rounded-xl text-[9px] font-black uppercase text-white flex items-center justify-center gap-1.5 transition-all"
                                >
                                    <ImageIcon className="w-3.5 h-3.5 text-neon-cyan" /> Cloud R2
                                </button>
                            </div>

                            <div className="pt-1">
                                <input
                                    type="url"
                                    placeholder="OU COLLER LE LIEN DIRECT DE LA COVER..."
                                    value={activeCoverUrl.startsWith('blob:') ? '' : activeCoverUrl}
                                    onChange={e => {
                                        updateMusicTrack(activeTrackIdx, { cover: e.target.value });
                                        if (activeTrackIdx === 0) setAfficheImage(e.target.value);
                                    }}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-[9px] font-medium placeholder-gray-500 outline-none focus:border-[#00ff66]/50 transition-all"
                                />
                            </div>

                            {/* Réglages précis de taille et position de la cover */}
                            <div className="space-y-2.5 pt-2.5 border-t border-white/10">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[9px] font-black uppercase text-gray-400">
                                        <span>Taille de la Pochette</span>
                                        <span className="text-[#00ff66] font-mono">{afficheScale}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="60"
                                        max="120"
                                        value={afficheScale}
                                        onChange={(e) => {
                                            setAfficheScale(Number(e.target.value));
                                            setTimeout(() => generateImage(), 30);
                                        }}
                                        className="w-full accent-[#00ff66] bg-white/10 rounded-lg h-1.5 cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[9px] font-black uppercase text-gray-400">
                                        <span>Position Verticale (Haut / Bas)</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-300 font-mono text-[8px]">{afficheOffsetY > 0 ? `+${afficheOffsetY}` : afficheOffsetY}px</span>
                                            {(afficheOffsetY !== 0 || afficheScale !== 100) && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setAfficheScale(100);
                                                        setAfficheOffsetY(0);
                                                        setTimeout(() => generateImage(), 30);
                                                    }}
                                                    className="text-[8px] text-[#00ff66] hover:underline cursor-pointer uppercase font-bold"
                                                >
                                                    Reset
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="-100"
                                        max="150"
                                        value={afficheOffsetY}
                                        onChange={(e) => {
                                            setAfficheOffsetY(Number(e.target.value));
                                            setTimeout(() => generateImage(), 30);
                                        }}
                                        className="w-full accent-[#00ff66] bg-white/10 rounded-lg h-1.5 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECTION B : TEXTES DU SON (TITRE + ARTISTE + LABEL) */}
                        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                            <label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                                ✍️ Informations du Morceau (Slide {editorialSlide})
                            </label>

                            {/* 1. Titre du Morceau */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-[9px] font-bold uppercase text-gray-400">
                                    <span>Titre du Morceau</span>
                                    <span className="text-[8px] text-[#00ff66] font-normal">*mot* en vert</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Ex: STROBE (DIMENSION REMIX)..."
                                    value={activeTrack.title}
                                    onChange={e => updateMusicTrack(activeTrackIdx, { title: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-[10px] font-black placeholder-gray-500 outline-none focus:border-[#00ff66]/50 transition-all uppercase"
                                />
                            </div>

                            {/* 2. Nom de l'Artiste */}
                            <div className="space-y-1">
                                <span className="text-[9px] font-bold uppercase text-gray-400 block">Artiste(s)</span>
                                <input
                                    type="text"
                                    placeholder="Ex: DEADMAU5, DIMENSION..."
                                    value={activeTrack.artist}
                                    onChange={e => updateMusicTrack(activeTrackIdx, { artist: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-[#00ff66] text-[10px] font-bold placeholder-gray-500 outline-none focus:border-[#00ff66]/50 transition-all uppercase"
                                />
                            </div>

                            {/* 3. Label Discographique */}
                            <div className="space-y-1">
                                <span className="text-[9px] font-bold uppercase text-gray-400 block">Label Discographique</span>
                                <input
                                    type="text"
                                    placeholder="Ex: MAU5TRAP, SPINNIN' RECORDS, STMPD..."
                                    value={activeTrack.label}
                                    onChange={e => updateMusicTrack(activeTrackIdx, { label: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-[9px] font-medium placeholder-gray-500 outline-none focus:border-[#00ff66]/50 transition-all uppercase"
                                />
                            </div>
                        </div>

                        {/* SECTION C : IMAGE DE FOND / AMBIANCE */}
                        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                    🎆 Image de Fond (Ambiance Floutée)
                                </label>
                                <span className="text-[8px] font-bold text-[#00ff66] uppercase bg-[#00ff66]/10 px-2 py-0.5 rounded-full border border-[#00ff66]/20">
                                    Flou auto DropSiders
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="py-2.5 bg-white/5 border border-white/10 hover:border-white/25 rounded-xl text-[9px] font-black uppercase text-white flex items-center justify-center gap-1.5 transition-all"
                                >
                                    <Upload className="w-3.5 h-3.5 text-[#00ff66]" /> Importer Fond
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setR2TargetType('background');
                                        setIsR2ModalOpen(true);
                                    }}
                                    className="py-2.5 bg-white/5 border border-white/10 hover:border-white/25 rounded-xl text-[9px] font-black uppercase text-white flex items-center justify-center gap-1.5 transition-all"
                                >
                                    <ImageIcon className="w-3.5 h-3.5 text-neon-cyan" /> Fond Cloud R2
                                </button>
                            </div>
                        </div>

                        {/* SECTION D : SWIPE DROPSIDERS */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                            <div>
                                <span className="text-[9px] font-black text-white uppercase block">Swipe Studio</span>
                                <span className="text-[8px] text-gray-500 font-medium">Afficher la mention Swipe en bas</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowSwipe(!showSwipe);
                                    setTimeout(() => generateImage(), 50);
                                }}
                                className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase transition-all ${showSwipe ? 'border-[#00ff66]/40 text-[#00ff66] bg-[#00ff66]/20' : 'bg-white/5 text-gray-500 border border-white/10'}`}
                            >
                                {showSwipe ? 'ACTIF' : 'MASQUÉ'}
                            </button>
                        </div>

                        {exportButtons}
                    </div>
                )}
            </div>
        );
    })();

    // Shared downloader modal
    const downloaderModal = (
        <AnimatePresence>
            {isDownloaderOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl">
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-4xl w-full shadow-2xl relative overflow-hidden h-[80vh] flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan via-blue-500 to-neon-purple" />
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">Import <span className="text-neon-cyan">Social</span></h2>
                                <p className="text-gray-400 font-medium">Copiez un lien Instagram, TikTok ou YouTube</p>
                            </div>
                            <button onClick={() => setIsDownloaderOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <Downloader isPopup={true} onSelect={(url) => {
                                const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('.webm') || url.includes('video') || url.includes('googlevideo') || url.includes('play') || url.includes('tiktok');
                                if (isVideo) {
                                    const video = document.createElement('video');
                                    video.src = url; video.crossOrigin = "anonymous";
                                    video.onloadeddata = () => { setBgVideo(video); setBgImage(''); };
                                    video.onerror = () => { setBgImage(url); setBgVideo(null); };
                                } else { setBgImage(url); setBgVideo(null); }
                                setIsDownloaderOpen(false);
                            }} />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    const recapPickerModal = (
        <AnimatePresence>
            {isRecapPickerOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl">
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-8 max-w-4xl w-full shadow-2xl relative overflow-hidden h-[80vh] flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-orange via-pink-500 to-neon-red" />
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-1">Importer un <span className="text-neon-orange">Récap Écrit</span></h2>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Sélectionnez un article pour générer le visuel</p>
                            </div>
                            <button onClick={() => setIsRecapPickerOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {recapsData.slice(0, 30).map((recap: any) => (
                                    <button 
                                        key={recap.id}
                                        onClick={() => {
                                            const cleanTitle = fixEncoding(recap.title).replace(/^Rcap\s*:\s*/i, '').replace(/^Rcap\s*:\s*/i, '').replace(/^Récap\s*:\s*/i, '');
                                            const cleanSummary = fixEncoding(recap.summary || '').split('. ')[0] + '.';
                                            setCustomText(`${cleanTitle.toUpperCase()}\n\n${cleanSummary.toUpperCase()}`);
                                            setBgImage(recap.image);
                                            setBgVideo(null);
                                            setTheme('RECAP');
                                            setIsRecapPickerOpen(false);
                                        }}
                                        className="group relative flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 hover:border-white/20 transition-all text-left"
                                    >
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-white/10">
                                            <img src={recap.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-[#c026d3] uppercase tracking-widest mb-1">{recap.festival || 'FESTIVAL'}</p>
                                            <h3 className="text-white font-black uppercase italic tracking-tighter text-sm line-clamp-1 mb-1">{fixEncoding(recap.title)}</h3>
                                            <p className="text-[9px] text-gray-500 font-medium line-clamp-2 leading-relaxed">{fixEncoding(recap.summary || '')}</p>
                                        </div>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-8 h-8 rounded-full bg-neon-orange text-white flex items-center justify-center">
                                                <Plus className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    const agendaPickerModal = (
        <AnimatePresence>
            {isAgendaPickerOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.94, y: 20 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.94, y: 20 }}
                        className="bg-[#0b0c10] border border-[#ff3700]/30 rounded-[2.5rem] p-5 sm:p-8 max-w-5xl w-full shadow-[0_0_80px_rgba(255,55,0,0.2)] relative overflow-hidden h-[88vh] flex flex-col"
                    >
                        {/* Top neon line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff3700] via-amber-500 to-[#00f0ff]" />
                        
                        {/* Header */}
                        <div className="flex justify-between items-start mb-5 gap-3">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff3700]/15 border border-[#ff3700]/30 text-[#ff3700] text-[9px] font-black uppercase tracking-widest mb-1.5">
                                    <Calendar className="w-3.5 h-3.5" /> Agenda Dropsiders.fr
                                </div>
                                <h2 className="text-xl sm:text-3xl font-black text-white uppercase italic tracking-tighter">
                                    Importer les événements <span className="text-[#ff3700]">du Site</span>
                                </h2>
                                <p className="text-[10px] text-gray-400 font-medium tracking-wide">
                                    Sélectionnez les soirées et festivals du site à intégrer dans votre visuel Rave Agenda
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={fetchSiteAgenda} 
                                    disabled={isSiteAgendaLoading}
                                    title="Rafraîchir les données"
                                    className="p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all disabled:opacity-50"
                                >
                                    <RotateCcw className={`w-4 h-4 ${isSiteAgendaLoading ? 'animate-spin text-[#ff3700]' : ''}`} />
                                </button>
                                <button 
                                    onClick={() => setIsAgendaPickerOpen(false)} 
                                    className="p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Search & Month Filter Bar */}
                        <div className="space-y-2.5 mb-4">
                            <div className="flex flex-col sm:flex-row gap-2">
                                {/* Search input */}
                                <div className="relative flex-1">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input 
                                        type="text"
                                        value={agendaPickerSearch}
                                        onChange={e => setAgendaPickerSearch(e.target.value)}
                                        placeholder="Rechercher par titre, ville, genre, salle..."
                                        className="w-full bg-white/5 border border-white/10 focus:border-[#ff3700] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-gray-500 font-bold focus:outline-none transition-all"
                                    />
                                    {agendaPickerSearch && (
                                        <button 
                                            onClick={() => setAgendaPickerSearch('')}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Quick selection toggles */}
                                <div className="flex gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const filteredIds = filteredSiteAgendaList.map((e: any) => e.id);
                                            setSelectedSiteEventIds(filteredIds);
                                        }}
                                        className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase text-gray-300 hover:text-white transition-all whitespace-nowrap flex items-center gap-1.5"
                                    >
                                        <CheckSquare className="w-3.5 h-3.5 text-[#ff3700]" /> Tout cocher
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setSelectedSiteEventIds([])}
                                        className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase text-gray-400 hover:text-white transition-all whitespace-nowrap flex items-center gap-1.5"
                                    >
                                        <Square className="w-3.5 h-3.5" /> Tout décocher
                                    </button>
                                </div>
                            </div>

                            {/* Month Filter Chips */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                                <button
                                    onClick={() => setAgendaPickerMonth('ALL')}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap border ${
                                        agendaPickerMonth === 'ALL'
                                            ? 'bg-[#ff3700] border-[#ff3700] text-black shadow-md shadow-[#ff3700]/30'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    Tous ({siteAgendaEvents.length})
                                </button>
                                {availableAgendaMonths.map((m: string) => {
                                    const count = siteAgendaEvents.filter((ev: any) => getEventMonthName(ev) === m).length;
                                    return (
                                        <button
                                            key={m}
                                            onClick={() => setAgendaPickerMonth(m)}
                                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap border ${
                                                agendaPickerMonth === m
                                                    ? 'bg-[#ff3700] border-[#ff3700] text-black shadow-md shadow-[#ff3700]/30'
                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                            }`}
                                        >
                                            {m} ({count})
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Events Grid */}
                        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                            {isSiteAgendaLoading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400 py-16">
                                    <RotateCcw className="w-8 h-8 animate-spin text-[#ff3700]" />
                                    <p className="text-xs font-black uppercase tracking-wider">Chargement des événements de l'Agenda...</p>
                                </div>
                            ) : filteredSiteAgendaList.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-500 py-16">
                                    <Calendar className="w-10 h-10 stroke-[1.5] text-gray-600 mb-1" />
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Aucun événement trouvé</p>
                                    <p className="text-[10px] text-gray-500">Essayez de modifier votre recherche ou sélectionnez un autre mois.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pb-2">
                                    {filteredSiteAgendaList.map((event: any) => {
                                        const isSelected = selectedSiteEventIds.includes(event.id);
                                        const dayStr = formatEventDayForVisual(event);
                                        const eventMonth = getEventMonthName(event);
                                        const imgUrl = resolveImageUrl(event.image);

                                        return (
                                            <div 
                                                key={event.id}
                                                onClick={() => {
                                                    setSelectedSiteEventIds(prev => 
                                                        prev.includes(event.id) 
                                                            ? prev.filter(id => id !== event.id)
                                                            : [...prev, event.id]
                                                    );
                                                }}
                                                className={`group relative flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                                                    isSelected 
                                                        ? 'bg-[#ff3700]/15 border-[#ff3700] shadow-lg shadow-[#ff3700]/10' 
                                                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/20'
                                                }`}
                                            >
                                                {/* Checkbox indicator */}
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                                                    isSelected 
                                                        ? 'bg-[#ff3700] text-black font-black' 
                                                        : 'border border-white/20 text-transparent group-hover:border-white/40'
                                                }`}>
                                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                </div>

                                                {/* Flyer Thumbnail */}
                                                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 relative bg-black/40">
                                                    <img 
                                                        src={imgUrl} 
                                                        alt="" 
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={e => {
                                                            (e.target as HTMLElement).style.display = 'none';
                                                        }}
                                                    />
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0 space-y-0.5">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="px-1.5 py-0.5 rounded-md bg-[#ff3700] text-black font-black italic text-[9px] uppercase tracking-wider">
                                                            {dayStr}
                                                        </span>
                                                        {event.genre && (
                                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider">
                                                                {event.genre}
                                                            </span>
                                                        )}
                                                        <span className="text-[8px] font-bold text-gray-500 uppercase">
                                                            {eventMonth}
                                                        </span>
                                                    </div>

                                                    <h3 className="text-white font-black uppercase text-xs line-clamp-1 group-hover:text-[#ff3700] transition-colors">
                                                        {fixEncoding(event.title)}
                                                    </h3>

                                                    <p className="text-[9px] text-gray-400 font-medium line-clamp-1">
                                                        {event.venue ? `${event.venue} • ` : ''}{event.location || ''} {event.country ? `(${event.country})` : ''}
                                                    </p>
                                                </div>

                                                {/* Quick Action buttons */}
                                                <div className="flex flex-col gap-1 flex-shrink-0 opacity-80 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleImportFromSiteAgenda([event], false)}
                                                        title="Ajouter immédiatement au visuel"
                                                        className="px-2 py-1 bg-white/10 hover:bg-[#ff3700] hover:text-black text-white text-[8px] font-black uppercase rounded-lg transition-all"
                                                    >
                                                        + Ajouter
                                                    </button>
                                                    {event.image && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setBgImage(imgUrl);
                                                                setBgVideo(null);
                                                            }}
                                                            title="Mettre l'affiche de cet événement en fond"
                                                            className="px-2 py-1 bg-white/5 hover:bg-white/20 text-gray-400 hover:text-white text-[8px] font-bold uppercase rounded-lg transition-all"
                                                        >
                                                            Fond 🖼️
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer Action Bar */}
                        <div className="pt-3.5 mt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0b0c10]">
                            {/* Left: Status & auto month sync */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-white">
                                    <span className="text-[#ff3700]">{selectedSiteEventIds.length}</span> événement{selectedSiteEventIds.length > 1 ? 's' : ''} sélectionné{selectedSiteEventIds.length > 1 ? 's' : ''}
                                </span>
                                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-gray-400 select-none">
                                    <input 
                                        type="checkbox" 
                                        checked={autoSyncAgendaMonth} 
                                        onChange={e => setAutoSyncAgendaMonth(e.target.checked)}
                                        className="rounded accent-[#ff3700]"
                                    />
                                    <span>Adapter le mois du visuel auto</span>
                                </label>
                            </div>

                            {/* Right: Import Actions */}
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    type="button"
                                    disabled={selectedSiteEventIds.length === 0}
                                    onClick={() => {
                                        const events = siteAgendaEvents.filter((e: any) => selectedSiteEventIds.includes(e.id));
                                        handleImportFromSiteAgenda(events, false);
                                    }}
                                    className="flex-1 sm:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    Ajouter (+{selectedSiteEventIds.length})
                                </button>
                                <button
                                    type="button"
                                    disabled={selectedSiteEventIds.length === 0}
                                    onClick={() => {
                                        const events = siteAgendaEvents.filter((e: any) => selectedSiteEventIds.includes(e.id));
                                        handleImportFromSiteAgenda(events, true);
                                    }}
                                    className="flex-1 sm:flex-none px-5 py-2.5 bg-[#ff3700] hover:bg-[#ff5522] text-black font-black text-xs uppercase rounded-xl transition-all shadow-lg shadow-[#ff3700]/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5"
                                >
                                    <Sparkles className="w-3.5 h-3.5" /> Remplacer l'Agenda ({selectedSiteEventIds.length})
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100001] bg-black/95 backdrop-blur-3xl">

            {!isMobile ? (
                /* ══════════════════════════════════════════════════════════
                    DESKTOP LAYOUT (lg+) — original two-column design
                ══════════════════════════════════════════════════════════ */
                <div className="flex w-full h-full max-w-6xl mx-auto rounded-[40px] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden bg-[#0a0a0a]">

                    {/* Controls Sidebar */}
                    <div className="w-[360px] border-r border-white/10 p-5 flex flex-col gap-5 overflow-y-auto custom-scrollbar h-full">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-white italic tracking-tighter">SOCIAL STUDIO</h2>
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">ÉDITION CRÉATIVE</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => window.location.href = '/'} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-neon-cyan transition-all flex items-center gap-2 group" title="Retour au site">
                                    <Home className="w-5 h-5" /><span className="text-[10px] font-black uppercase">SITE</span>
                                </button>
                                <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-neon-red transition-all" title="Quitter">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Tab selector */}
                        <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
                            <button onClick={() => setActiveTab('REEL')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'REEL' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}><Smartphone className="w-3.5 h-3.5" /> STORY / REEL</button>
                            <button onClick={() => { setActiveTab('PUBLICATION'); if (theme === 'REELS' || theme === 'CONSEILS') handleSetTheme('NEWS'); }} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'PUBLICATION' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}><ImageIcon className="w-3.5 h-3.5" /> POST</button>
                        </div>

                        {themeButtons}
                        {quizColorControls}
                        {styleMusicButtons}

                        {/* Background */}
                        <div className="space-y-2">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Fond Visuel</span>
                            <button onClick={() => {
                                setR2TargetType('background');
                                setIsR2ModalOpen(true);
                            }} className="w-full py-2.5 border border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 text-gray-400 text-[9px] font-black uppercase hover:border-white/30 hover:text-white transition-all bg-white/5 group">
                                <Upload className="w-3.5 h-3.5 group-hover:text-neon-red transition-colors" />
                                {bgImage || bgVideo ? 'Modifier le fond' : 'Importer du Cloud (Vidéos/Photos)'}
                            </button>
                            <button onClick={() => setIsDownloaderOpen(true)} className="w-full py-2.5 border border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 text-gray-400 text-[9px] font-black uppercase hover:border-white/30 hover:text-white transition-all bg-white/5 group">
                                <LinkIcon className="w-3.5 h-3.5 group-hover:text-neon-cyan transition-colors" />
                                Télécharger Vidéo/Photo (URL)
                            </button>
                            <button onClick={() => setIsRecapPickerOpen(true)} className="w-full py-2.5 bg-[#c026d3]/10 border border-[#c026d3]/30 rounded-xl flex items-center justify-center gap-2 text-[#c026d3] text-[9px] font-black uppercase hover:bg-[#c026d3]/20 transition-all group">
                                <PlusCircle className="w-3.5 h-3.5" />
                                Importer un RÉCAP ÉCRIT
                            </button>

                            {bgPositionControls}
                            <button onClick={() => setIsRetouchMode(!isRetouchMode)} className={`w-full py-2 bg-neon-cyan/10 border rounded-xl flex items-center justify-center gap-2 text-neon-cyan text-[9px] font-black uppercase hover:bg-neon-cyan/20 transition-all group ${isRetouchMode ? 'border-neon-cyan shadow-[0_0_20px_rgba(0,255,255,0.2)]' : 'border-neon-cyan/20'}`}>
                                <Wand2 className="w-3.5 h-3.5" /> Nettoyage Photo (Outil IA Local)
                            </button>
                            {isRetouchMode && (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                                    <div className="flex justify-between items-center text-[9px] uppercase font-black text-gray-500">
                                        <span>Taille pinceau</span>
                                        <span className="text-neon-cyan">{brushSize}px</span>
                                    </div>
                                    <input type="range" min="10" max="100" value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-cyan" />
                                    <div className="flex gap-2 pt-1">
                                        <button onClick={() => setRetouchPath([])} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase text-gray-400 hover:text-white transition-all flex items-center justify-center gap-1"><RotateCcw className="w-3 h-3" /> Reset</button>
                                        <button onClick={applyMagicErase} className="flex-[2] py-2 bg-neon-cyan text-black rounded-lg text-[9px] font-black uppercase shadow-[0_0_15px_rgba(0,255,255,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-1"><Sparkles className="w-3 h-3" /> Appliquer (IA)</button>
                                    </div>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
                            {bgVideo && (
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                bgVideo.currentTime = 0;
                                                bgVideo.play().catch(() => {});
                                            }}
                                            className="flex-1 py-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded-xl text-[9px] font-black text-neon-cyan uppercase hover:bg-neon-cyan/20 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                                            title="Remettre la vidéo à 0:00 et relancer"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" /> Recommencer à 0:00
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (bgVideo.paused) {
                                                    bgVideo.play().catch(() => {});
                                                } else {
                                                    bgVideo.pause();
                                                }
                                            }}
                                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-gray-300 uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                            title="Mettre en pause ou relancer la lecture"
                                        >
                                            <Video className="w-3.5 h-3.5" /> Play / Pause
                                        </button>
                                    </div>
                                    <p className="text-[7.5px] text-gray-400 italic text-center">
                                        ⏱️ Le clip repartira automatiquement à 0:00 pile lors de l'export MP4
                                    </p>
                                </div>
                            )}

                            {/* Export du fond visuel + Option pour animer le fond */}
                            <div className="pt-2 border-t border-white/10 space-y-2">
                                <button
                                    type="button"
                                    onClick={() => downloadBackgroundVisual(activeTab)}
                                    disabled={isDownloading}
                                    className="w-full py-2.5 bg-white/5 border border-white/10 hover:border-white/30 rounded-xl text-[9px] font-black uppercase text-white hover:text-neon-cyan flex items-center justify-center gap-2 transition-all group shadow-sm"
                                    title="Exporter l'image de fond seule sans texte"
                                >
                                    <Download className="w-3.5 h-3.5 group-hover:text-neon-cyan transition-colors" />
                                    Exporter le fond visuel (PNG)
                                </button>
                                {theme !== 'MAP' && bgAnimationControl}
                            </div>
                        </div>

                        {/* Animation universelle du texte & éléments (tous les thèmes sauf MAP) */}
                        {theme !== 'MAP' && textAnimationControl}
                        {theme !== 'MAP' && isMultiSlideTheme && slideTransitionControl}

                        {/* Content editor */}
                        <div className="space-y-4">
                            {(isCarouselPromoActive && isMultiSlideTheme) ? (
                                <><span className="text-[10px] font-black text-neon-red uppercase">🔥 Outro Carrousel : Question & Phrase Promo</span>{promoEditor}</>
                            ) : theme === 'MAP' ? (
                                <><span className="text-[10px] font-black text-neon-cyan uppercase">Carte & Localisation</span>{mapEditor}</>
                            ) : theme === 'CALENDRIER' ? (
                                <>
                                    <span className="text-[10px] font-black text-gray-500 uppercase">Calendrier des événements</span>
                                    <div className="space-y-3">
                                        <input
                                            value={calendarMonth}
                                            onChange={e => setCalendarMonth(e.target.value)}
                                            placeholder="MARS 2025"
                                            className="w-full bg-white/10 border border-neon-orange/40 rounded-xl p-3 text-white font-black italic uppercase text-xs"
                                        />
                                        <div className="space-y-2">
                                            {calendarEvents.map((evt, i) => (
                                                <div key={i} className="flex gap-2 items-center">
                                                    <input
                                                        value={evt.date}
                                                        onChange={e => { const n = [...calendarEvents]; n[i].date = e.target.value; setCalendarEvents(n); }}
                                                        placeholder="JJ"
                                                        className="w-14 bg-neon-orange/20 border border-neon-orange/40 rounded-lg p-2 text-neon-orange font-black uppercase text-xs text-center"
                                                    />
                                                    <input
                                                        value={evt.label}
                                                        onChange={e => { const n = [...calendarEvents]; n[i].label = e.target.value; setCalendarEvents(n); }}
                                                        placeholder="NOM DE L'ÉVÉNEMENT"
                                                        className="flex-1 bg-white/10 border border-white/20 rounded-lg p-2 text-white font-black italic uppercase text-xs"
                                                    />
                                                    <button onClick={() => setCalendarEvents(calendarEvents.filter((_, idx) => idx !== i))} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><span className="text-xs">✕</span></button>
                                                </div>
                                            ))}
                                            <button onClick={() => setCalendarEvents([...calendarEvents, { date: '??', label: 'NOUVEL ÉVÉNEMENT' }])} className="w-full py-3 bg-neon-orange/10 border border-dashed border-neon-orange/30 rounded-xl text-[9px] font-black uppercase text-neon-orange hover:bg-neon-orange/20 transition-all">+ Ajouter un événement</button>
                                        </div>
                                    </div>
                                </>
                            ) : theme === 'PLANNING' ? (
                                <><span className="text-[10px] font-black text-[#ff3700] uppercase tracking-wider">📅 Agenda des Soirées & Festivals</span>{planningEditor}</>
                            ) : theme.startsWith('TOP 5') ? (
                                <><span className="text-[10px] font-black text-gray-500 uppercase">Éléments du Top 5</span>{top5Editor}</>

                            ) : theme === 'TRACKLIST' ? (
                                <><span className="text-[10px] font-black text-gray-500 uppercase">Détails Tracklist</span>{tracklistEditor}</>
                            ) : theme === 'SPOTLIGHT' ? (
                                <><span className="text-[10px] font-black text-gray-500 uppercase">Infos Spotlight & Logos</span>{spotlightEditor}</>
                            ) : theme === 'ARTISTE FESTIVAL' ? (
                                <><span className="text-[10px] font-black text-neon-red uppercase">Artiste Festival (Carrousel)</span>{artisteFestivalEditor}</>
                            ) : (theme === 'EVENTS' || theme === 'AFFICHE') ? (
                                <><span className="text-[10px] font-black text-[#ff007f] uppercase">Événements & Affiche (Carrousel)</span>{eventsEditor}</>
                            ) : theme === 'MUSIQUE' ? (
                                <><span className="text-[10px] font-black text-[#00ff66] uppercase">Musique & Cover Track (Carrousel)</span>{musiqueEditor}</>
                            ) : ['NEWS', 'FOCUS', 'RECAP', 'INTERVIEW', 'REELS', 'CONSEILS', 'CONCOURS'].includes(theme) ? (
                                <><span className="text-[10px] font-black text-neon-cyan uppercase">Contenu Titre & Sous-titre ({theme})</span>{conseilsEditor}</>
                            ) : theme === 'CITATION' ? (
                                <><span className="text-[10px] font-black text-gray-500 uppercase">Citation & Auteur</span>{citationEditor}</>
                            ) : theme === 'PROMO' ? (
                                <><span className="text-[10px] font-black text-neon-red uppercase">Question & Outro Réseaux</span>{promoEditor}</>
                            ) : (
                                <><span className="text-[10px] font-black text-gray-500 uppercase">Contenu Texte</span>{textEditor}</>
                            )}
                        </div>

                        {/* Visuals Gallery */}
                        {visualsList.length > 0 && (
                            <div className="space-y-3">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Vos Captures ({visualsList.length})</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {visualsList.map((vis, idx) => (
                                        <div key={idx} className="group relative aspect-[9/12] rounded-xl overflow-hidden border border-white/10 bg-black shadow-lg">
                                            <img src={vis} alt={`Visual ${idx}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button onClick={() => {
                                                    const a = document.createElement('a'); a.href = vis;
                                                    a.download = `dropsiders-capture-${idx}.png`; a.click();
                                                }} className="p-2 bg-white text-black rounded-lg hover:bg-neon-cyan transition-colors">
                                                    <Download className="w-3 h-3" />
                                                </button>
                                                <button onClick={() => setVisualsList(prev => prev.filter((_, i) => i !== idx))}
                                                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Toggles + Export */}
                        <div className="space-y-4 mt-auto pb-36">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer group" onClick={() => setShowArticleLink(!showArticleLink)}>
                                    <div className="flex items-center gap-2 min-w-0"><LinkIcon className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" /><span className="text-[9px] font-black text-white uppercase truncate">Lien Article</span></div>
                                    <div className={`w-4 h-4 rounded-md border-2 transition-all flex items-center justify-center flex-shrink-0 ${showArticleLink ? 'bg-neon-cyan border-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.4)]' : 'bg-black/40 border-white/20 group-hover:border-white/40'}`}>
                                        {showArticleLink && (<motion.svg initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></motion.svg>)}
                                    </div>
                                </div>
                                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer group" onClick={() => setShowVoteLink(!showVoteLink)}>
                                    <div className="flex items-center gap-2 min-w-0"><LinkIcon className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" /><span className="text-[9px] font-black text-white uppercase truncate">Lien Vote</span></div>
                                    <div className={`w-4 h-4 rounded-md border-2 transition-all flex items-center justify-center flex-shrink-0 ${showVoteLink ? 'bg-neon-purple border-neon-purple shadow-[0_0_10px_rgba(189,0,255,0.4)]' : 'bg-black/40 border-white/20 group-hover:border-white/40'}`}>
                                        {showVoteLink && (<motion.svg initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></motion.svg>)}
                                    </div>
                                </div>
                                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer group" onClick={() => setShowSwipe(!showSwipe)}>
                                    <div className="flex items-center gap-2 min-w-0"><Layout className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" /><span className="text-[9px] font-black text-white uppercase truncate">Swipe</span></div>
                                    <div className={`w-4 h-4 rounded-md border-2 transition-all flex items-center justify-center flex-shrink-0 ${showSwipe ? 'bg-neon-red border-neon-red shadow-[0_0_10px_rgba(255,18,65,0.4)]' : 'bg-black/40 border-white/20 group-hover:border-white/40'}`}>
                                        {showSwipe && (<motion.svg initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></motion.svg>)}
                                    </div>
                                </div>
                                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer group" onClick={() => setShowText(!showText)}>
                                    <div className="flex items-center gap-2"><Eraser className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" /><span className="text-[9px] font-black text-white uppercase whitespace-nowrap">Masquer Texte</span></div>
                                    <div className={`w-4 h-4 rounded-md border-2 transition-all flex items-center justify-center flex-shrink-0 ${!showText ? 'bg-yellow-500 border-yellow-500 shadow-[0_0_100px_rgba(234,179,8,0.4)]' : 'bg-black/40 border-white/20 group-hover:border-white/40'}`}>
                                        {!showText && (<motion.svg initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></motion.svg>)}
                                    </div>
                                </div>
                            </div>
                            {exportButtons}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="flex-1 bg-[#020202] flex flex-col items-center justify-center relative overflow-hidden h-full border-l border-white/10">
                        {theme === 'PLANNING' && (
                            <div className="mb-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 shadow-2xl z-20 flex-wrap justify-center">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider mr-1">Carrousel Insta :</span>
                                <button
                                    type="button"
                                    onClick={() => { setIsCarouselPromoActive(false); setAgendaSlide(1); }}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                                        !isCarouselPromoActive && agendaSlide === 1
                                            ? 'bg-[#ff3700] text-black shadow-[0_0_12px_rgba(255,55,0,0.5)]'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    🎴 Slide 1 (Cover)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsCarouselPromoActive(false); setAgendaSlide(2); }}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                                        !isCarouselPromoActive && agendaSlide === 2
                                            ? 'bg-[#ff3700] text-black shadow-[0_0_12px_rgba(255,55,0,0.5)]'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    📋 Slide 2 (Événements)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCarouselPromoActive(true);
                                        setTimeout(() => generateImage(), 50);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                                        isCarouselPromoActive
                                            ? 'bg-neon-red text-white shadow-[0_0_12px_rgba(255,0,51,0.5)]'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    🔥 Slide PROMO
                                </button>
                                {slideTransitionQuickBar}
                            </div>
                        )}
                        {theme === 'ARTISTE FESTIVAL' && (
                            <div className="mb-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 shadow-2xl z-20 flex-wrap justify-center">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider mr-1">Carrousel Insta :</span>
                                <button
                                    type="button"
                                    onClick={() => { setIsCarouselPromoActive(false); setArtisteFestivalSlide(1); }}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                                        !isCarouselPromoActive && artisteFestivalSlide === 1
                                            ? 'bg-neon-red text-white shadow-[0_0_12px_rgba(255,0,51,0.5)]'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    🎪 Slide 1 (Cover)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsCarouselPromoActive(false); setArtisteFestivalSlide(2); }}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                                        !isCarouselPromoActive && artisteFestivalSlide === 2
                                            ? 'bg-neon-red text-white shadow-[0_0_12px_rgba(255,0,51,0.5)]'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    ⭐ Slide 2 (Spotlight)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCarouselPromoActive(true);
                                        setTimeout(() => generateImage(), 50);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                                        isCarouselPromoActive
                                            ? 'bg-neon-red text-white shadow-[0_0_12px_rgba(255,0,51,0.5)]'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    🔥 Slide PROMO
                                </button>
                                {slideTransitionQuickBar}
                            </div>
                        )}
                        {(theme === 'EVENTS' || theme === 'AFFICHE') && (
                            <div className="mb-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 shadow-2xl z-20 flex-wrap justify-center">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider mr-1">Carrousel Insta :</span>
                                <button
                                    type="button"
                                    onClick={() => { setIsCarouselPromoActive(false); setEventsSlide(1); if (theme === 'AFFICHE') handleSetTheme('EVENTS'); }}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                                        !isCarouselPromoActive && eventsSlide === 1 && theme !== 'AFFICHE'
                                            ? 'bg-[#ff007f] text-white shadow-[0_0_12px_rgba(255,0,127,0.5)]'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    📢 Slide 1 (Post)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsCarouselPromoActive(false); setEventsSlide(2); }}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                                        !isCarouselPromoActive && (eventsSlide === 2 || theme === 'AFFICHE')
                                            ? 'bg-[#ff007f] text-white shadow-[0_0_12px_rgba(255,0,127,0.5)]'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    🎨 Slide 2 (Affiche)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCarouselPromoActive(true);
                                        setTimeout(() => generateImage(), 50);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                                        isCarouselPromoActive
                                            ? 'bg-neon-red text-white shadow-[0_0_12px_rgba(255,0,51,0.5)]'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    🔥 Slide PROMO
                                </button>
                                {slideTransitionQuickBar}
                            </div>
                        )}
                        {theme === 'MUSIQUE' && (
                            <div className="mb-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-[#00ff66]/30 shadow-2xl z-20 flex-wrap justify-center">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider mr-1">Carrousel Musique :</span>
                                <button
                                    type="button"
                                    onClick={() => { setIsCarouselPromoActive(false); setEditorialSlide(1); }}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                                        !isCarouselPromoActive && editorialSlide === 1
                                            ? 'bg-[#00ff66] text-black shadow-[0_0_12px_rgba(0,255,102,0.6)]'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    🎵 Slide 1 (Annonce)
                                </button>
                                {musicTracks.map((_, tIdx) => {
                                    const sNum = tIdx + 2;
                                    return (
                                        <button
                                            key={sNum}
                                            type="button"
                                            onClick={() => { setIsCarouselPromoActive(false); setEditorialSlide(sNum); }}
                                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                                                !isCarouselPromoActive && editorialSlide === sNum
                                                    ? 'bg-[#00ff66] text-black shadow-[0_0_12px_rgba(0,255,102,0.6)]'
                                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                            }`}
                                        >
                                            💿 S{sNum} (Track {tIdx + 1})
                                        </button>
                                    );
                                })}
                                {musicTracks.length < MAX_MUSIC_TRACKS && (
                                    <button
                                        type="button"
                                        onClick={addMusicTrack}
                                        className="px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/30 hover:bg-[#00ff66]/25 flex items-center gap-1"
                                        title="Ajouter une track"
                                    >
                                        ➕ Track
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCarouselPromoActive(true);
                                        setTimeout(() => generateImage(), 50);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                                        isCarouselPromoActive
                                            ? 'bg-neon-red text-white shadow-[0_0_12px_rgba(255,0,51,0.5)]'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    🔥 Slide PROMO
                                </button>
                                {slideTransitionQuickBar}
                            </div>
                        )}
                        {['NEWS', 'FOCUS', 'RECAP', 'INTERVIEW', 'LIVESTREAM', 'CONSEILS', 'REELS', 'CONCOURS'].includes(theme) && (
                            <div className="mb-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 shadow-2xl z-20 flex-wrap justify-center">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider mr-1">Carrousel Insta :</span>
                                <button
                                    type="button"
                                    onClick={() => { setIsCarouselPromoActive(false); setEditorialSlide(1); }}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                                        !isCarouselPromoActive && editorialSlide === 1
                                            ? 'bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.5)]'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    📌 Slide 1 (Cover)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsCarouselPromoActive(false); setEditorialSlide(2); }}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                                        !isCarouselPromoActive && editorialSlide === 2
                                            ? 'bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.5)]'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    📖 Slide 2
                                </button>
                                {extraEditorialSlides.map((_, idx) => {
                                    const sNum = idx + 3;
                                    return (
                                        <button
                                            key={sNum}
                                            type="button"
                                            onClick={() => { setIsCarouselPromoActive(false); setEditorialSlide(sNum); }}
                                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                                                !isCarouselPromoActive && editorialSlide === sNum
                                                    ? 'bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.5)]'
                                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                            }`}
                                        >
                                            📄 Slide {sNum}
                                        </button>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCarouselPromoActive(true);
                                        setTimeout(() => generateImage(), 50);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                                        isCarouselPromoActive
                                            ? 'bg-neon-red text-white shadow-[0_0_12px_rgba(255,0,51,0.5)]'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    🔥 Slide PROMO
                                </button>
                                {slideTransitionQuickBar}
                            </div>
                        )}
                        <div className={`relative ${activeTab === 'REEL' ? 'w-full max-w-[280px]' : 'w-full max-w-[450px]'} transition-all duration-300`} style={{ aspectRatio: activeTab === 'REEL' ? '9/16' : '4/5' }}>
                            <div className="w-full h-full bg-[#111] rounded-[30px] overflow-hidden border border-white/10 shadow-2xl relative">
                                <canvas 
                                    ref={canvasRef} 
                                    className={`w-full h-full object-contain ${isRetouchMode ? 'cursor-crosshair' : 'cursor-default'}`} 
                                    onMouseDown={(e) => {
                                        if (!isRetouchMode) return;
                                        setIsDrawing(true);
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = (e.clientX - rect.left) * (e.currentTarget.width / rect.width);
                                        const y = (e.clientY - rect.top) * (e.currentTarget.height / rect.height);
                                        setRetouchPath([{ x, y }]);
                                    }}
                                    onMouseMove={(e) => {
                                        if (!isDrawing || !isRetouchMode) return;
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = (e.clientX - rect.left) * (e.currentTarget.width / rect.width);
                                        const y = (e.clientY - rect.top) * (e.currentTarget.height / rect.height);
                                        setRetouchPath(prev => [...prev, { x, y }]);
                                    }}
                                    onMouseUp={() => setIsDrawing(false)}
                                    onTouchStart={(e) => {
                                        if (!isRetouchMode) return;
                                        setIsDrawing(true);
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const touch = e.touches[0];
                                        const x = (touch.clientX - rect.left) * (e.currentTarget.width / rect.width);
                                        const y = (touch.clientY - rect.top) * (e.currentTarget.height / rect.height);
                                        setRetouchPath([{ x, y }]);
                                    }}
                                    onTouchMove={(e) => {
                                        if (!isDrawing || !isRetouchMode) return;
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const touch = e.touches[0];
                                        const x = (touch.clientX - rect.left) * (e.currentTarget.width / rect.width);
                                        const y = (touch.clientY - rect.top) * (e.currentTarget.height / rect.height);
                                        setRetouchPath(prev => [...prev, { x, y }]);
                                    }}
                                    onTouchEnd={() => setIsDrawing(false)}
                                />

                                <AnimatePresence>
                                    {/* The global overlay at the end of the file handles desktop and mobile now */}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* ══════════════════════════════════════════════════════════
                    MOBILE LAYOUT — InShot style: full-screen + bottom bar
                ══════════════════════════════════════════════════════════ */
                <motion.div
                    drag="y"
                    dragControls={dragControls}
                    dragListener={false}
                    dragConstraints={{ top: 0, bottom: 300 }}
                    dragElastic={{ top: 0.1, bottom: 0.8 }}
                    onDragEnd={(_, info) => {
                        if (info.offset.y > 150) {
                            if (activePanel) setActivePanel(null);
                        }
                    }}
                    className="relative w-full h-full bg-black flex flex-col overflow-hidden">

                    {/* Format selection modal (mobile only) */}
                    <AnimatePresence>
                        {showFormatModal && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[400] flex items-end justify-center"
                                style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}>
                                <motion.div
                                    initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 120, opacity: 0 }}
                                    transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                                    className="w-full max-w-lg rounded-t-[36px] overflow-hidden"
                                    style={{ background: 'linear-gradient(180deg, #141414 0%, #0a0a0a 100%)', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}>
                                    <div className="flex justify-center pt-4 pb-2"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
                                    <div className="px-8 pb-10">
                                        <h2 className="text-2xl font-black text-white italic tracking-tighter text-center mb-1">SOCIAL STUDIO</h2>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest text-center mb-8">Choisir le format</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => { setActiveTab('REEL'); setTheme('NEWS'); setShowFormatModal(false); }}
                                                className="group flex flex-col items-center gap-3 p-6 rounded-3xl border-2 border-white/10 bg-white/5 hover:border-white/30 transition-all">
                                                <div className="w-12 h-20 rounded-xl border-2 border-white/30 flex items-center justify-center group-hover:border-neon-red/60 transition-all" style={{ background: 'linear-gradient(180deg,#1a1a1a,#0a0a0a)' }}>
                                                    <Smartphone className="w-5 h-5 text-gray-400 group-hover:text-neon-red transition-colors" />
                                                </div>
                                                <span className="text-[11px] font-black text-white uppercase">Réel</span>
                                                <span className="text-[9px] text-gray-500">1080 × 1920</span>
                                            </button>
                                            <button onClick={() => { setActiveTab('PUBLICATION'); setTheme('NEWS'); setShowFormatModal(false); }}
                                                className="group flex flex-col items-center gap-3 p-6 rounded-3xl border-2 border-white/10 bg-white/5 hover:border-white/30 transition-all">
                                                <div className="w-16 h-16 rounded-xl border-2 border-white/30 flex items-center justify-center group-hover:border-neon-cyan/60 transition-all" style={{ background: 'linear-gradient(180deg,#1a1a1a,#0a0a0a)' }}>
                                                    <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-neon-cyan transition-colors" />
                                                </div>
                                                <span className="text-[11px] font-black text-white uppercase">Publication</span>
                                                <span className="text-[9px] text-gray-500">1080 × 1350</span>
                                            </button>
                                        </div>
                                        <button onClick={() => setShowFormatModal(false)} className="mt-6 w-full py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Continuer sans changer</button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Full-screen canvas — click to close any open panel */}
                    <div
                        className="absolute inset-0 flex items-center justify-center bg-black"
                        onClick={() => { if (activePanel) setActivePanel(null); }}
                    >
                        {theme === 'PLANNING' && (
                            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-2xl border border-white/10 shadow-2xl max-w-[95vw] overflow-x-auto scrollbar-none">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setIsCarouselPromoActive(false); setAgendaSlide(1); }}
                                    className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase transition-all shrink-0 ${
                                        !isCarouselPromoActive && agendaSlide === 1 ? 'bg-[#ff3700] text-black shadow-md' : 'text-gray-400'
                                    }`}
                                >
                                    Slide 1 (Cover)
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setIsCarouselPromoActive(false); setAgendaSlide(2); }}
                                    className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase transition-all shrink-0 ${
                                        !isCarouselPromoActive && agendaSlide === 2 ? 'bg-[#ff3700] text-black shadow-md' : 'text-gray-400'
                                    }`}
                                >
                                    Slide 2 (Events)
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsCarouselPromoActive(true);
                                        setTimeout(() => generateImage(), 50);
                                    }}
                                    className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase transition-all shrink-0 ${
                                        isCarouselPromoActive
                                            ? 'bg-neon-red text-white shadow-md'
                                            : 'text-gray-400'
                                    }`}
                                >
                                    🔥 PROMO
                                </button>
                                {slideTransitionQuickBar}
                            </div>
                        )}
                        {theme === 'ARTISTE FESTIVAL' && (
                            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-2xl border border-white/10 shadow-2xl max-w-[95vw] overflow-x-auto scrollbar-none">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setIsCarouselPromoActive(false); setArtisteFestivalSlide(1); }}
                                    className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase transition-all shrink-0 ${
                                        !isCarouselPromoActive && artisteFestivalSlide === 1 ? 'bg-neon-red text-white shadow-md' : 'text-gray-400'
                                    }`}
                                >
                                    Slide 1 (Cover)
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setIsCarouselPromoActive(false); setArtisteFestivalSlide(2); }}
                                    className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase transition-all shrink-0 ${
                                        !isCarouselPromoActive && artisteFestivalSlide === 2 ? 'bg-neon-red text-white shadow-md' : 'text-gray-400'
                                    }`}
                                >
                                    Slide 2 (Spotlight)
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsCarouselPromoActive(true);
                                        setTimeout(() => generateImage(), 50);
                                    }}
                                    className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase transition-all shrink-0 ${
                                        isCarouselPromoActive
                                            ? 'bg-neon-red text-white shadow-md'
                                            : 'text-gray-400'
                                    }`}
                                >
                                    🔥 PROMO
                                </button>
                                {slideTransitionQuickBar}
                            </div>
                        )}
                        {(theme === 'EVENTS' || theme === 'AFFICHE') && (
                            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-2xl border border-white/10 shadow-2xl max-w-[95vw] overflow-x-auto scrollbar-none">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setIsCarouselPromoActive(false); setEventsSlide(1); if (theme === 'AFFICHE') handleSetTheme('EVENTS'); }}
                                    className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase transition-all shrink-0 ${
                                        !isCarouselPromoActive && eventsSlide === 1 && theme !== 'AFFICHE' ? 'bg-[#ff007f] text-white shadow-md' : 'text-gray-400'
                                    }`}
                                >
                                    Slide 1 (Post)
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setIsCarouselPromoActive(false); setEventsSlide(2); }}
                                    className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase transition-all shrink-0 ${
                                        !isCarouselPromoActive && (eventsSlide === 2 || theme === 'AFFICHE') ? 'bg-[#ff007f] text-white shadow-md' : 'text-gray-400'
                                    }`}
                                >
                                    Slide 2 (Affiche)
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsCarouselPromoActive(true);
                                        setTimeout(() => generateImage(), 50);
                                    }}
                                    className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase transition-all shrink-0 ${
                                        isCarouselPromoActive
                                            ? 'bg-neon-red text-white shadow-md'
                                            : 'text-gray-400'
                                    }`}
                                >
                                    🔥 PROMO
                                </button>
                                {slideTransitionQuickBar}
                            </div>
                        )}
                        {theme === 'MUSIQUE' && (
                            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-2xl border border-[#00ff66]/30 shadow-2xl max-w-[95vw] overflow-x-auto scrollbar-none">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setIsCarouselPromoActive(false); setEditorialSlide(1); }}
                                    className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase transition-all shrink-0 ${
                                        !isCarouselPromoActive && editorialSlide === 1 ? 'bg-[#00ff66] text-black shadow-md' : 'text-gray-400'
                                    }`}
                                >
                                    Slide 1 (Annonce)
                                </button>
                                {musicTracks.map((_, tIdx) => {
                                    const sNum = tIdx + 2;
                                    return (
                                        <button
                                            key={sNum}
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setIsCarouselPromoActive(false); setEditorialSlide(sNum); }}
                                            className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase transition-all shrink-0 ${
                                                !isCarouselPromoActive && editorialSlide === sNum ? 'bg-[#00ff66] text-black shadow-md' : 'text-gray-400'
                                            }`}
                                        >
                                            S{sNum} (Track {tIdx + 1})
                                        </button>
                                    );
                                })}
                                {musicTracks.length < MAX_MUSIC_TRACKS && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); addMusicTrack(); }}
                                        className="px-2 py-1 rounded-xl text-[8px] font-black uppercase transition-all shrink-0 bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/30"
                                    >
                                        ➕ Track
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsCarouselPromoActive(true);
                                        setTimeout(() => generateImage(), 50);
                                    }}
                                    className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase transition-all shrink-0 ${
                                        isCarouselPromoActive
                                            ? 'bg-neon-red text-white shadow-md'
                                            : 'text-gray-400'
                                    }`}
                                >
                                    🔥 PROMO
                                </button>
                                {slideTransitionQuickBar}
                            </div>
                        )}
                        {['NEWS', 'FOCUS', 'RECAP', 'INTERVIEW', 'LIVESTREAM', 'CONSEILS', 'REELS', 'CONCOURS'].includes(theme) && (
                            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-2xl border border-white/10 shadow-2xl max-w-[95vw] overflow-x-auto scrollbar-none">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setIsCarouselPromoActive(false); setEditorialSlide(1); }}
                                    className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase transition-all shrink-0 ${
                                        !isCarouselPromoActive && editorialSlide === 1 ? 'bg-white text-black shadow-md' : 'text-gray-400'
                                    }`}
                                >
                                    Slide 1 (Titre)
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setIsCarouselPromoActive(false); setEditorialSlide(2); }}
                                    className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase transition-all shrink-0 ${
                                        !isCarouselPromoActive && editorialSlide === 2 ? 'bg-white text-black shadow-md' : 'text-gray-400'
                                    }`}
                                >
                                    Slide 2 (Détail)
                                </button>
                                {extraEditorialSlides.map((_, idx) => {
                                    const sNum = idx + 3;
                                    return (
                                        <button
                                            key={sNum}
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setIsCarouselPromoActive(false); setEditorialSlide(sNum); }}
                                            className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase transition-all shrink-0 ${
                                                !isCarouselPromoActive && editorialSlide === sNum ? 'bg-white text-black shadow-md' : 'text-gray-400'
                                            }`}
                                        >
                                            Slide {sNum}
                                        </button>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsCarouselPromoActive(true);
                                        setTimeout(() => generateImage(), 50);
                                    }}
                                    className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase transition-all shrink-0 ${
                                        isCarouselPromoActive
                                            ? 'bg-neon-red text-white shadow-md'
                                            : 'text-gray-400'
                                    }`}
                                >
                                    🔥 PROMO
                                </button>
                                {slideTransitionQuickBar}
                            </div>
                        )}
                        <canvas 
                            ref={canvasRef} 
                            className={`w-full h-full object-contain ${isRetouchMode ? 'cursor-crosshair' : 'cursor-default'}`} 
                            onTouchStart={(e) => {
                                if (!isRetouchMode) return;
                                setIsDrawing(true);
                                const rect = e.currentTarget.getBoundingClientRect();
                                const touch = e.touches[0];
                                const x = (touch.clientX - rect.left) * (e.currentTarget.width / rect.width);
                                const y = (touch.clientY - rect.top) * (e.currentTarget.height / rect.height);
                                setRetouchPath([{ x, y }]);
                            }}
                            onTouchMove={(e) => {
                                if (!isDrawing || !isRetouchMode) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                const touch = e.touches[0];
                                const x = (touch.clientX - rect.left) * (e.currentTarget.width / rect.width);
                                const y = (touch.clientY - rect.top) * (e.currentTarget.height / rect.height);
                                setRetouchPath(prev => [...prev, { x, y }]);
                            }}
                            onTouchEnd={() => setIsDrawing(false)}
                            onMouseDown={(e) => {
                                if (!isRetouchMode) return;
                                setIsDrawing(true);
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = (e.clientX - rect.left) * (e.currentTarget.width / rect.width);
                                const y = (e.clientY - rect.top) * (e.currentTarget.height / rect.height);
                                setRetouchPath([{ x, y }]);
                            }}
                            onMouseMove={(e) => {
                                if (!isDrawing || !isRetouchMode) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = (e.clientX - rect.left) * (e.currentTarget.width / rect.width);
                                const y = (e.clientY - rect.top) * (e.currentTarget.height / rect.height);
                                setRetouchPath(prev => [...prev, { x, y }]);
                            }}
                            onMouseUp={() => setIsDrawing(false)}
                        />

                        <AnimatePresence>
                            {isVideoRecording && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-50"
                                >
                                    <div className="w-full max-w-xs space-y-6">
                                        <div className="relative w-32 h-32 mx-auto">
                                            <svg className="w-full h-full -rotate-90">
                                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                                                <motion.circle
                                                    cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
                                                    className="text-neon-red"
                                                    strokeDasharray={364.4}
                                                    strokeDashoffset={364.4 - (364.4 * recordingProgress) / 100}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-2xl font-black italic text-white">{recordingTimeLeft}S</span>
                                                <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">Restant</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Capture Vidéo</h2>
                                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">Génération du rendu en cours<br />Ne fermez pas votre navigateur</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Swipe Indicator (top handle) + Drag listener hook */}
                    <div
                        onPointerDown={(e) => dragControls.start(e)}
                        className="absolute top-0 inset-x-0 h-16 flex justify-center z-[60] cursor-grab active:cursor-grabbing">
                        <div className="w-12 h-1.5 rounded-full bg-white/20 shadow-lg mt-3" />
                    </div>

                    {/* Top bar (Header) */}
                    <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-5 pb-3 z-20 pointer-events-none" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0.8) 0%,transparent 100%)' }}>
                        <button
                            onClick={() => { if (activePanel) setActivePanel(null); }}
                            className={`p-2.5 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95 pointer-events-auto ${!activePanel ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <span className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em] italic">SOCIAL STUDIO</span>
                        <button onClick={onClose} className="p-2.5 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95 pointer-events-auto"><Home className="w-5 h-5" /></button>
                    </div>

                    {/* Contextual panels (slide up) */}
                    <AnimatePresence>
                        {activePanel && activePanel !== 'export' && (
                            <motion.div key={activePanel}
                                initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: isSlidingPosition ? 0.15 : 1 }} exit={{ y: '100%', opacity: 0 }}
                                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                                className="absolute inset-x-0 bottom-[130px] z-30 rounded-t-[28px] transition-opacity duration-200"
                                style={{
                                    background: `rgba(12, 12, 12, ${menuOpacity / 100})`,
                                    backdropFilter: 'blur(16px)',
                                    WebkitBackdropFilter: 'blur(16px)',
                                    borderTop: '1px solid rgba(255,255,255,0.12)',
                                    maxHeight: '60vh',
                                    overflowY: 'auto',
                                    opacity: isSlidingPosition ? 0.15 : 1
                                }}>
                                <div className="flex justify-center pt-3 pb-2"><div className="w-8 h-1 rounded-full bg-white/20" /></div>

                                {activePanel === 'format' && (
                                    <div className="px-6 pb-8">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Format</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={() => { setActiveTab('REEL'); setTheme('NEWS'); setActivePanel(null); }}
                                                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${activeTab === 'REEL' ? 'border-neon-red/60 bg-neon-red/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                                                <Smartphone className={`w-5 h-5 ${activeTab === 'REEL' ? 'text-neon-red' : 'text-gray-400'}`} />
                                                <div className="text-left"><p className={`text-[11px] font-black uppercase ${activeTab === 'REEL' ? 'text-white' : 'text-gray-400'}`}>Réel</p><p className="text-[9px] text-gray-600">1080×1920</p></div>
                                                {activeTab === 'REEL' && <Check className="w-4 h-4 text-neon-red ml-auto" />}
                                            </button>
                                            <button onClick={() => { setActiveTab('PUBLICATION'); setTheme('NEWS'); setActivePanel(null); }}
                                                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${activeTab === 'PUBLICATION' ? 'border-neon-cyan/60 bg-neon-cyan/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                                                <ImageIcon className={`w-5 h-5 ${activeTab === 'PUBLICATION' ? 'text-neon-cyan' : 'text-gray-400'}`} />
                                                <div className="text-left"><p className={`text-[11px] font-black uppercase ${activeTab === 'PUBLICATION' ? 'text-white' : 'text-gray-400'}`}>Publication</p><p className="text-[9px] text-gray-600">1080×1350</p></div>
                                                {activeTab === 'PUBLICATION' && <Check className="w-4 h-4 text-neon-cyan ml-auto" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activePanel === 'theme' && (
                                    <div className="px-6 pb-8 space-y-4">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Thème visuel</p>
                                        {themeButtons}
                                        {quizColorControls}
                                        {styleMusicButtons && <div className="mt-4">{styleMusicButtons}</div>}
                                    </div>
                                )}

                                {activePanel === 'texte' && (
                                    <div className="px-6 pb-8 space-y-4">
                                        {theme !== 'MAP' && textAnimationControl}
                                        {theme !== 'MAP' && isMultiSlideTheme && slideTransitionControl}
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Contenu</p>
                                        {(isCarouselPromoActive && isMultiSlideTheme) ? promoEditor : theme === 'CALENDRIER' ? (
                                            <div className="space-y-3">
                                                <input value={calendarMonth} onChange={e => setCalendarMonth(e.target.value)} placeholder="MARS 2025" className="w-full bg-white/10 border border-neon-orange/40 rounded-xl p-3 text-white font-black italic uppercase text-xs" />
                                                {calendarEvents.map((evt, i) => (
                                                    <div key={i} className="flex gap-2 items-center">
                                                        <input value={evt.date} onChange={e => { const n = [...calendarEvents]; n[i].date = e.target.value; setCalendarEvents(n); }} placeholder="JJ" className="w-14 bg-neon-orange/20 border border-neon-orange/40 rounded-lg p-2 text-neon-orange font-black uppercase text-xs text-center" />
                                                        <input value={evt.label} onChange={e => { const n = [...calendarEvents]; n[i].label = e.target.value; setCalendarEvents(n); }} placeholder="ÉVÉNEMENT" className="flex-1 bg-white/10 border border-white/20 rounded-lg p-2 text-white font-black italic uppercase text-xs" />
                                                        <button onClick={() => setCalendarEvents(calendarEvents.filter((_, idx) => idx !== i))} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><span className="text-xs">✕</span></button>
                                                    </div>
                                                ))}
                                                <button onClick={() => setCalendarEvents([...calendarEvents, { date: '??', label: 'NOUVEL ÉVÉNEMENT' }])} className="w-full py-3 bg-neon-orange/10 border border-dashed border-neon-orange/30 rounded-xl text-[9px] font-black uppercase text-neon-orange hover:bg-neon-orange/20 transition-all">+ Ajouter</button>
                                            </div>
                                        ) : theme === 'PLANNING' ? planningEditor : theme.startsWith('TOP 5') ? top5Editor : theme === 'TRACKLIST' ? tracklistEditor : theme === 'SPOTLIGHT' ? spotlightEditor : theme === 'ARTISTE FESTIVAL' ? artisteFestivalEditor : (theme === 'EVENTS' || theme === 'AFFICHE') ? eventsEditor : theme === 'MUSIQUE' ? musiqueEditor : ['NEWS', 'FOCUS', 'RECAP', 'INTERVIEW', 'REELS', 'CONSEILS', 'CONCOURS'].includes(theme) ? conseilsEditor : theme === 'CITATION' ? citationEditor : theme === 'MAP' ? mapEditor : theme === 'PROMO' ? promoEditor : textEditor}
                                    </div>
                                )}

                                {activePanel === 'fond' && (
                                    <div className="px-6 pb-8">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Fond Visuel</p>
                                        <div className="space-y-3">
                                            <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-gray-400 text-[10px] font-black uppercase hover:border-white/30 hover:text-white transition-all bg-white/5 group">
                                                <Upload className="w-4 h-4 group-hover:text-neon-red transition-colors" />{bgImage || bgVideo ? 'Modifier le fond' : 'Importer Image/Vidéo'}
                                            </button>
                                            <button onClick={() => { setActivePanel(null); setIsDownloaderOpen(true); }} className="w-full py-4 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-gray-400 text-[10px] font-black uppercase hover:border-white/30 hover:text-white transition-all bg-white/5 group">
                                                <LinkIcon className="w-4 h-4 group-hover:text-neon-cyan transition-colors" />Télécharger Vidéo/Photo (URL)
                                            </button>
                                            {bgPositionControls}
                                            <button onClick={() => { setActivePanel(null); setIsRecapPickerOpen(true); }} className="w-full py-4 bg-[#c026d3]/10 border border-[#c026d3]/30 rounded-2xl flex items-center justify-center gap-2 text-[#c026d3] text-[10px] font-black uppercase hover:bg-[#c026d3]/20 transition-all group">
                                                <PlusCircle className="w-4 h-4" />Importer un RÉCAP ÉCRIT
                                            </button>
                                            <button onClick={() => setShowText(!showText)} className={`w-full py-4 border rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all ${!showText ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30'}`}>
                                                <Eraser className="w-4 h-4" /> Gomme (Masquer le texte) : {!showText ? 'ACTIVE' : 'OFF'}
                                            </button>
                                            <button onClick={() => setIsRetouchMode(!isRetouchMode)} className={`w-full py-4 border rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all ${isRetouchMode ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_20px_rgba(0,255,255,0.2)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30'}`}>
                                                <Wand2 className="w-4 h-4" /> Nettoyer Photo (Direct Studio)
                                            </button>
                                            {isRetouchMode && (
                                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                                                    <div className="flex justify-between items-center text-[9px] uppercase font-black text-gray-500">
                                                        <span>Taille pinceau</span>
                                                        <span className="text-neon-cyan">{brushSize}px</span>
                                                    </div>
                                                    <input type="range" min="10" max="100" value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-cyan" />
                                                    <div className="flex gap-2 pt-2">
                                                        <button onClick={() => setRetouchPath([])} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase text-gray-400 hover:text-white transition-all flex items-center justify-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Réinitialiser</button>
                                                        <button onClick={applyMagicErase} className="flex-[2] py-3 bg-neon-cyan text-black rounded-xl text-[9px] font-black uppercase shadow-[0_0_15px_rgba(0,255,255,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Appliquer</button>
                                                    </div>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => downloadBackgroundVisual(activeTab)}
                                                disabled={isDownloading}
                                                className="w-full py-3.5 bg-white/5 border border-white/10 hover:border-white/30 rounded-2xl text-[10px] font-black uppercase text-white hover:text-neon-cyan flex items-center justify-center gap-2 transition-all shadow-sm"
                                            >
                                                <Download className="w-4 h-4 text-neon-cyan" /> Exporter le fond visuel (PNG)
                                            </button>
                                            {theme !== 'MAP' && bgAnimationControl}
                                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Export panel logic remains, progress overlay moved to global */}
                    <AnimatePresence>
                        {activePanel === 'export' && (
                            <motion.div key="export"
                                initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
                                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                                className="absolute inset-x-0 bottom-[130px] z-30 rounded-t-[28px]"
                                style={{ background: 'linear-gradient(180deg,#161616 0%,#0d0d0d 100%)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                <div className="flex justify-center pt-3 pb-2"><div className="w-8 h-1 rounded-full bg-white/20" /></div>
                                <div className="px-6 pb-8">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Exporter</p>
                                    {exportButtons}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Bottom icon bar - Floating and transparent */}
                    <div className="absolute bottom-0 inset-x-0 z-40 pb-6 pt-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none">

                        {/* Quick toggles */}
                        <div className="flex items-center justify-center gap-3 px-4 mb-4 pointer-events-auto">
                            <button onClick={() => setShowSwipe(!showSwipe)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all border backdrop-blur-md ${showSwipe ? 'bg-neon-red/20 border-neon-red/50 text-neon-red' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'}`}>
                                <Layout className="w-3 h-3" /> Swipe {showSwipe ? 'ON' : 'OFF'}
                            </button>
                            <button onClick={() => setShowArticleLink(!showArticleLink)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all border backdrop-blur-md ${showArticleLink ? 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'}`}>
                                <LinkIcon className="w-3 h-3" /> Lien Article {showArticleLink ? 'ON' : 'OFF'}
                            </button>
                            <button onClick={() => setShowVoteLink(!showVoteLink)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all border backdrop-blur-md ${showVoteLink ? 'bg-neon-purple/20 border-neon-purple/50 text-neon-purple' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'}`}>
                                <LinkIcon className="w-3 h-3" /> Lien Vote {showVoteLink ? 'ON' : 'OFF'}
                            </button>
                        </div>

                        {/* Icon buttons */}
                        <div className="flex items-center justify-around px-2 pointer-events-auto">
                            {[
                                { id: 'format', icon: <Layers className="w-5 h-5" />, label: 'Format' },
                                { id: 'theme', icon: <Palette className="w-5 h-5" />, label: 'Thème' },
                                { id: 'texte', icon: <Type className="w-5 h-5" />, label: 'Texte' },
                                { id: 'fond', icon: <ImageIcon className="w-5 h-5" />, label: 'Fond' },
                                { id: 'export', icon: <Film className="w-5 h-5" />, label: 'Export' },
                            ].map(btn => (
                                <button key={btn.id} onClick={() => togglePanel(btn.id)} className="flex flex-col items-center gap-1.5 px-2 py-1 transition-all group">
                                    <div className={`p-3 rounded-full backdrop-blur-md transition-all ${activePanel === btn.id ? 'bg-white text-black scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'text-white bg-black/40 border border-white/10 group-hover:bg-white/20'}`}>
                                        {btn.icon}
                                    </div>
                                    <span style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }} className={`text-[8px] font-black uppercase tracking-wide ${activePanel === btn.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{btn.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

            )} {/* end isMobile ternary */}

            {/* Video Ready Success Modal (Mobile Only) */}
            <ExportSuccessModal 
                isOpen={!!readyVideoBlob} 
                onClose={() => {
                    if (readyVideoUrl) URL.revokeObjectURL(readyVideoUrl);
                    setReadyVideoBlob(null);
                    setReadyVideoUrl('');
                }}
                readyBlob={readyVideoBlob}
                readyUrl={readyVideoUrl}
                filename={`dropsiders-${theme.toLowerCase().replace(/\s+/g, '-')}.${readyVideoBlob?.type.includes('mp4') ? 'mp4' : (readyVideoBlob?.type.includes('quicktime') ? 'mov' : 'mp4')}`}
                type="video"
                title="VIDÉO PRÊTE !"
                subtitle="Enregistrez-la pour vos réseaux"
            />

            {/* Shared downloader modal (visible on both) */}
            {downloaderModal}
            {recapPickerModal}
            {agendaPickerModal}

            {/* Local Error Banner */}
            <AnimatePresence>
                {errorMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] px-8 py-5 bg-black/90 backdrop-blur-3xl border border-neon-red/30 rounded-[2.5rem] flex items-center gap-5 shadow-[0_20px_60px_rgba(0,0,0,0.8)] min-w-[320px]"
                    >
                        <div className="p-3 bg-neon-red/20 rounded-2xl">
                            <X className="w-5 h-5 text-neon-red" />
                        </div>
                        <div className="flex-1">
                            <p className="text-white font-black italic uppercase tracking-tighter text-sm leading-none">{errorMessage}</p>
                            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1.5 line-clamp-1">Social Studio Error</p>
                        </div>
                        <button 
                            onClick={() => setErrorMessage(null)}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global Progress Overlay (Desktop & Mobile) */}
            <AnimatePresence mode="wait">
                {(isVideoRecording || isConverting) && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center"
                    >
                        <div className="relative w-48 h-48 mb-10">
                            {/* Circular Progress */}
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="96" cy="96" r="90" stroke="#FFFFFF0a" strokeWidth="6" fill="transparent" />
                                <circle 
                                    cx="96" cy="96" r="90" stroke="#FF0033" strokeWidth="8" fill="transparent"
                                    strokeDasharray={565}
                                    strokeDashoffset={565 - (565 * (isVideoRecording ? recordingProgress : conversionProgress)) / 100}
                                    strokeLinecap="round"
                                    className="transition-all duration-300 shadow-[0_0_15px_rgba(255,0,51,0.5)]"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-black text-white leading-none tracking-tighter">
                                    {(isVideoRecording ? recordingProgress : conversionProgress).toFixed(0)}%
                                </span>
                            </div>
                        </div>
                        
                        <h3 className="text-2xl font-black text-white italic uppercase mb-3">
                            {isConverting ? "OPTIMISATION MOV..." : "ENREGISTREMENT..."}
                        </h3>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] max-w-[280px] leading-relaxed">
                            {isConverting 
                                ? "Conversion en format MOV (H.264) compatible iPhone. Merci de patienter." 
                                : isTransparent && !(bgImage || bgVideo)
                                    ? `Capture avec transparence activée. Finalisation...`
                                    : `Capture du réel (${recordingTimeLeft}s restantes). Ne pas quitter.`}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
            <ImageUploadModal 
                isOpen={isR2ModalOpen} 
                onClose={() => {
                    setIsR2ModalOpen(false);
                    setR2TargetIdx(null);
                    setR2TargetType(null);
                }}
                aspect={
                    (r2TargetType === 'top10' || r2TargetType === 'top5') ? 1 : 
                    (r2TargetType === 'background') ? (activeTab === 'REEL' ? 9/16 : 1) : 
                    undefined
                }
                allowMultiple={false}
                onUploadSuccess={(url) => {
                    const finalUrl = Array.isArray(url) ? url[0] : url;
                    if (!finalUrl) return;

                    if ((r2TargetType === 'top5' || r2TargetType === 'top10') && r2TargetIdx !== null) {
                        const n = [...top5Items];
                        if (n[r2TargetIdx]) {
                            n[r2TargetIdx].photo = finalUrl;
                            setTop5Items(n);
                        }
                    } else if (r2TargetType === 'background') {
                        const isVid = finalUrl.match(/\.(mp4|webm|mov|ogg)$/i) || finalUrl.includes('/video/upload/');
                        if (isVid) {
                            const video = document.createElement('video');
                            video.src = finalUrl;
                            video.muted = true;
                            video.loop = true;
                            video.playsInline = true;
                            video.crossOrigin = "anonymous";
                            video.play().catch(e => console.warn("Auto-preview play failed", e));
                            setBgVideo(video);
                            setBgImage('');
                        } else {
                            setBgImage(finalUrl);
                            setBgVideo(null);
                        }
                    } else if (r2TargetType === 'logo') {
                        setArtistLogo(finalUrl);
                        // Logo pre-caching
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.src = finalUrl;
                        img.onload = () => {
                            artistLogoRef.current = img;
                            generateImage();
                        };
                    } else if (r2TargetType === 'affiche') {
                        setAfficheImage(finalUrl);
                    } else if (r2TargetType === 'musicCover') {
                        if (r2TargetIdx !== null) {
                            updateMusicTrack(r2TargetIdx, { cover: finalUrl });
                        }
                    }
                    setR2TargetIdx(null);
                    setR2TargetType(null);
                }}
            />
        </motion.div>,
        document.body
    );
}

// Sync Heartbeat: 2026-03-06T16:32:00Z

