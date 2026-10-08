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
    Square
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

export function SocialSuite({ title, imageUrl, onClose, initialTheme, initialTab, onGeneratePromo, isGeneratingPromo }: SocialSuiteProps) {
    const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'PUBLICATION');
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
    }[]>([]);
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
    const [menuOpacity, setMenuOpacity] = useState<number>(35); // Menu transparency (35% default so image is visible behind)
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
    const [isConseilsLargeTitle, setIsConseilsLargeTitle] = useState(false);
    const [promoCategory, setPromoCategory] = useState<string>(() => {
        if (initialTheme && initialTheme !== 'PROMO') return initialTheme;
        return 'NEWS';
    });

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
    const recordingStartTimeRef = useRef<number>(0);
    const ffmpegRef = useRef<any>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    // On stocke la source et la dest pour ne pas rappeler createMediaElementSource
    // sur le même élément vidéo (lance un InvalidStateError si rappelé)
    const audioSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const audioDestNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
    const audioSourceVideoRef = useRef<HTMLVideoElement | null>(null); // pour détecter si bgVideo a changé
    const [isR2ModalOpen, setIsR2ModalOpen] = useState(false);
    const [r2TargetIdx, setR2TargetIdx] = useState<number | null>(null);
    const [r2TargetType, setR2TargetType] = useState<'top5' | 'top10' | 'background' | 'logo' | 'affiche' | null>(null);

    // AFFICHE Theme States (Poster Événement Flottant)
    const [afficheImage, setAfficheImage] = useState<string>('');
    const afficheImageRef = useRef<HTMLImageElement | null>(null);
    const [afficheGlow, setAfficheGlow] = useState<boolean>(true);
    const [afficheBorderColor, setAfficheBorderColor] = useState<string>('rgba(255, 255, 255, 0.22)');
    const [afficheMode, setAfficheMode] = useState<'cover' | 'contain'>('cover');
    const [afficheScale, setAfficheScale] = useState<number>(100);
    const [afficheOffsetY, setAfficheOffsetY] = useState<number>(0);
    const afficheFileInputRef = useRef<HTMLInputElement>(null);

    const handleAfficheImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setAfficheImage(url);
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
        if (activeTab === 'REEL') {
            // Only set default if current theme is not a Reel-specific theme
            if (theme !== 'TRACKLIST' && theme !== 'TOP 100 DROPSIDERS' && theme !== 'MAP' && !theme.startsWith('TOP ')) {
                setTheme('TRACKLIST');
            }
        } else {
            if (theme === 'TRACKLIST' || theme === 'MAP' || theme.startsWith('TOP ')) {
                setTheme('NEWS');
            }
        }
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
                if (mapStyle === 'voyager') {
                    tileUrl = `https://basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${wrappedX}/${mapY}@2x.png`;
                } else if (mapStyle === 'satellite') {
                    tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${mapY}/${wrappedX}`;
                } else {
                    tileUrl = `https://basemaps.cartocdn.com/rastertiles/dark_all/${zoom}/${wrappedX}/${mapY}@2x.png`;
                }

                let tileImg = imageCacheRef.current[tileUrl];
                if (!tileImg) {
                    const imgObj = new Image();
                    imgObj.crossOrigin = 'anonymous';
                    imgObj.src = tileUrl;
                    imgObj.onload = () => {
                        imageCacheRef.current[tileUrl] = imgObj;
                        generateImage();
                    };
                    imageCacheRef.current[tileUrl] = imgObj;
                } else if (tileImg.complete && tileImg.naturalWidth > 0) {
                    const tileDx = canvasCenterX + (x - centerTileX) * 256;
                    const tileDy = canvasCenterY + (y - centerTileY) * 256;
                    ctx.drawImage(tileImg, tileDx, tileDy, 256, 256);
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
        const effectiveTheme = forceTheme || theme;

        try {
            await (async (theme: ThemeType) => {
                const isPromoTheme = theme === 'PROMO';
                const promoCategoryKey = (promoCategory as ThemeType) || 'NEWS';
                const promoThemeData = baseThemeData[promoCategoryKey] || baseThemeData['NEWS'];
                const activeColor = isPromoTheme 
                    ? (themeColor || promoThemeData) 
                    : (themeColor || baseThemeData[theme]);
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

            canvas.width = 1080;
            canvas.height = effectiveTab === 'REEL' ? 1920 : 1350;
            const safeSize = effectiveTab === 'PUBLICATION' ? 1050 : 1080;
            const safeTop = (canvas.height - safeSize) / 2;
            const safeBottom = safeTop + safeSize;

            if (bgVideo) {
                const scale = Math.max(canvas.width / bgVideo.videoWidth, canvas.height / bgVideo.videoHeight);
                let x = ((canvas.width - bgVideo.videoWidth * scale) / 2) + bgOffsetX;
                let y = ((canvas.height - bgVideo.videoHeight * scale) / 2) + bgOffsetY;
                if (imgLayoutMode === 'PAR_LIGNES') {
                    y = ((canvas.height * 0.62 - bgVideo.videoHeight * scale) / 2) + bgOffsetY;
                } else if (imgLayoutMode === 'HAUT_LIGNE') {
                    y = ((canvas.height * 0.42 - bgVideo.videoHeight * scale) / 2) + bgOffsetY;
                } else if (imgLayoutMode === 'BAS_LIGNE') {
                    y = ((canvas.height * 0.85 - bgVideo.videoHeight * scale) / 2) + bgOffsetY;
                }
                if (theme === 'AFFICHE') {
                    ctx.save();
                    ctx.filter = 'blur(14px)';
                    const blurBleed = 28;
                    ctx.drawImage(bgVideo, x - blurBleed, y - blurBleed, bgVideo.videoWidth * scale + blurBleed * 2, bgVideo.videoHeight * scale + blurBleed * 2);
                    ctx.restore();
                } else {
                    ctx.drawImage(bgVideo, x, y, bgVideo.videoWidth * scale, bgVideo.videoHeight * scale);
                }
            } else if (img) {
                if (theme === 'SPOTLIGHT') {
                    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                    const iw = img.width * scale;
                    const ih = img.height * scale;
                    // Position photo on the right with manual offset
                    const x = (canvas.width - iw) + bgOffsetX;
                    const y = ((canvas.height - ih) / 2) + bgOffsetY;
                    ctx.drawImage(img, x, y, iw, ih);
                } else {
                    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                    let x = ((canvas.width - img.width * scale) / 2) + bgOffsetX;
                    let y = ((canvas.height - img.height * scale) / 2) + bgOffsetY;
                    if (imgLayoutMode === 'PAR_LIGNES') {
                        y = ((canvas.height * 0.62 - img.height * scale) / 2) + bgOffsetY;
                    } else if (imgLayoutMode === 'HAUT_LIGNE') {
                        y = ((canvas.height * 0.42 - img.height * scale) / 2) + bgOffsetY;
                    } else if (imgLayoutMode === 'BAS_LIGNE') {
                        y = ((canvas.height * 0.85 - img.height * scale) / 2) + bgOffsetY;
                    }
                    if (theme === 'AFFICHE') {
                        ctx.save();
                        ctx.filter = 'blur(14px)';
                        const blurBleed = 28;
                        ctx.drawImage(img, x - blurBleed, y - blurBleed, img.width * scale + blurBleed * 2, img.height * scale + blurBleed * 2);
                        ctx.restore();
                    } else {
                        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                    }
                }
            } else {
                if (!isTransparent) {
                    ctx.fillStyle = '#111';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
                    ctx.fillStyle = seg.color || defaultColor;
                    ctx.fillText(seg.text, currentX, y);
                    currentX += segWidth;
                });
                ctx.restore();
            };

            if (!showText) return; 

            // Gradient overlays for CONSEILS / REELS (Smooth continuous gradient without harsh cuts)
            if (theme === 'CONSEILS' || theme === 'REELS') {
                // Top subtle header shadow
                const topGrad = ctx.createLinearGradient(0, 0, 0, 220);
                topGrad.addColorStop(0, 'rgba(0,0,0,0.60)');
                topGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = topGrad;
                ctx.fillRect(0, 0, canvas.width, 220);

                // Continuous smooth bottom gradient that goes all the way down to the bottom
                const bottomGrad = ctx.createLinearGradient(0, canvas.height * 0.48, 0, canvas.height);
                bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
                bottomGrad.addColorStop(0.35, 'rgba(0,0,0,0.45)');
                bottomGrad.addColorStop(0.65, 'rgba(0,0,0,0.80)');
                bottomGrad.addColorStop(0.9, 'rgba(0,0,0,0.96)');
                bottomGrad.addColorStop(1, 'rgba(0,0,0,1)');
                ctx.fillStyle = bottomGrad;
                ctx.fillRect(0, canvas.height * 0.48, canvas.width, canvas.height * 0.52);
            }

            const isModernEditorialTheme = (
                ['NEWS', 'FOCUS', 'MUSIQUE', 'RECAP', 'EVENTS', 'INTERVIEW', 'LIVESTREAM'].includes(theme) ||
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
                // Top subtle header shadow for CONCOURS
                if (theme === 'CONCOURS') {
                    const topGrad = ctx.createLinearGradient(0, 0, 0, 160);
                    topGrad.addColorStop(0, 'rgba(0,0,0,0.50)');
                    topGrad.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = topGrad;
                    ctx.fillRect(0, 0, canvas.width, 160);
                }

                if (theme !== 'CONSEILS' && theme !== 'REELS' && theme !== 'TRACKLIST' && theme !== 'SPOTLIGHT' && theme !== 'CITATION' && theme !== 'PROMO' && theme !== 'JEU' && theme !== 'JEU_FESTIVAL' && theme !== 'AFFICHE' && theme !== 'PLANNING' && !(theme === 'ARTISTE FESTIVAL' && artisteFestivalSlide === 2)) {
                    const gradStart = (theme === 'TOP 5 ARTISTE' || theme === 'TOP 5 STYLES')
                        ? canvas.height * 0.8
                        : (theme === 'CONCOURS' ? canvas.height * 0.35 : canvas.height * 0.4);

                    const grad = ctx.createLinearGradient(0, gradStart, 0, canvas.height);
                    grad.addColorStop(0, 'rgba(0,0,0,0)');
                    if (theme === 'CONCOURS') {
                        // Fond noir profond cinématographique pour garantir une lisibilité absolue des textes
                        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
                        grad.addColorStop(0.18, 'rgba(3, 4, 10, 0.65)');
                        grad.addColorStop(0.40, 'rgba(5, 6, 14, 0.92)');
                        grad.addColorStop(0.70, 'rgba(6, 7, 16, 0.98)');
                        grad.addColorStop(1, 'rgba(4, 4, 10, 1)');
                        ctx.fillStyle = grad;
                        ctx.fillRect(0, gradStart, canvas.width, canvas.height - gradStart);

                        // Ambiance néon délicate tout en bas (sans saturer ni masquer le texte)
                        if (concoursBottomColor) {
                            const rgb = hexToRgb(concoursBottomColor);
                            const neonAtmosphere = ctx.createLinearGradient(0, canvas.height * 0.72, 0, canvas.height);
                            neonAtmosphere.addColorStop(0, `rgba(${rgb}, 0)`);
                            neonAtmosphere.addColorStop(1, `rgba(${rgb}, 0.22)`);
                            ctx.fillStyle = neonAtmosphere;
                            ctx.fillRect(0, canvas.height * 0.72, canvas.width, canvas.height * 0.28);
                        }
                    } else {
                        const rgbGrad = activeData.grad;
                        grad.addColorStop(0.3, 'rgba(0,0,0,0.2)');
                        grad.addColorStop(0.8, `rgba(${rgbGrad}, 0.7)`);
                        grad.addColorStop(1, `rgba(${rgbGrad}, 1)`);
                        ctx.fillStyle = grad;
                        ctx.fillRect(0, gradStart, canvas.width, canvas.height - gradStart);
                    }
                }

                // Lignes de scan rétro (uniquement sur les thèmes non modernisés)
                if (theme !== 'PLANNING' && theme !== 'CONSEILS' && theme !== 'REELS') {
                    const scanlineLimitY = theme === 'CONCOURS' ? canvas.height * 0.42 : canvas.height;
                    ctx.fillStyle = 'rgba(0,0,0,0.1)';
                    for (let i = 0; i < scanlineLimitY; i += 6) ctx.fillRect(0, i, canvas.width, 2);
                }
            }

            // Transition Slide logic
            let slideX = 0;
            if (transitionProgress > 0) {
                if (transitionProgress < 0.5) {
                    // Slide OUT to the LEFT (Ease In)
                    const p = transitionProgress * 2;
                    slideX = -canvas.width * (p * p);
                } else {
                    // Slide IN from the RIGHT (Ease Out)
                    const p = (transitionProgress - 0.5) * 2;
                    slideX = canvas.width * (1 - (p * (2 - p)));
                }
            }

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
                ctx.textAlign = 'center';
                ctx.fillStyle = '#ffffff';
                ctx.font = '900 italic 62px "Montserrat", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 15;
                ctx.fillText(`${item.main.toUpperCase()} - ${item.sub.toUpperCase()}`, centerX + slideX, centerY + radius + 140);

                // Restore Ranking Number
                ctx.textAlign = 'right';
                ctx.font = '900 italic 147px "Montserrat", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillText(`#${5 - currentPreviewIndex}`, canvas.width - 100 + slideX, canvas.height - 120);

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

                ctx.textAlign = 'right';
                ctx.font = '900 italic 117px "Montserrat", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillText(`#${5 - currentPreviewIndex}`, canvas.width - 100 + slideX, canvas.height - 120); 



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

                if (agendaSlide === 1) {
                    // ══════════════════════════════════════════════════════════
                    // SLIDE 1 : COVER CARROUSEL (ACCROCHE INSTAGRAM)
                    // ══════════════════════════════════════════════════════════

                    // 1. TOP-LEFT BADGE (Cyber capsule assortie)
                    ctx.save();
                    const badgeX = 65;
                    const badgeY = isStory ? 90 : 65;
                    const badgeText = (agendaCoverBadge || 'AGENDA FESTIVALS & SOIRÉES').toUpperCase().trim();

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
                    } else if (badgeText.length <= 32) {
                        badgeFontSize = 11;
                        letterSpacing = '1.8px';
                    } else {
                        badgeFontSize = 9.5;
                        letterSpacing = '1px';
                    }

                    ctx.font = `900 italic ${badgeFontSize}px "Orbitron", sans-serif`;
                    ctx.letterSpacing = letterSpacing;
                    const textWidth = ctx.measureText(badgeText).width;
                    const pillPadding = 34;
                    const pillW = Math.max(180, Math.ceil(textWidth + pillPadding));
                    const pillH = 46;

                    // Tilt badge ~ -2.3 deg
                    const pillCenterX = badgeX + pillW / 2;
                    const pillCenterY = badgeY + pillH / 2;
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

                    // 2. CENTRAL SECTION (Sur-titre Mois, Grand Hook, Genres)
                    const centerY = isStory ? 940 : 660;

                    // A) Sur-titre Mois & Année
                    const monthTagText = `${(agendaMonth || 'OCTOBRE').toUpperCase()}${agendaCoverYear ? ' ' + agendaCoverYear.trim() : ''}`;
                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = `900 italic 28px "Orbitron", sans-serif`;
                    ctx.letterSpacing = '7px';
                    ctx.fillStyle = monthColor;
                    ctx.shadowColor = `rgba(${monthGrad}, 0.9)`;
                    ctx.shadowBlur = 16;
                    const tagY = centerY - 145;
                    ctx.fillText(monthTagText, centerX, tagY);

                    // Decorative accent horizontal lines
                    const tagMeasureW = ctx.measureText(monthTagText).width;
                    const lineW = 90;
                    const lineGap = 26;
                    
                    const leftGrad = ctx.createLinearGradient(centerX - tagMeasureW / 2 - lineGap - lineW, 0, centerX - tagMeasureW / 2 - lineGap, 0);
                    leftGrad.addColorStop(0, 'rgba(255, 55, 0, 0)');
                    leftGrad.addColorStop(1, monthColor);
                    ctx.strokeStyle = leftGrad;
                    ctx.lineWidth = 2.5;
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

                    let titleFontSize = titleLines.length > 2 ? 54 : (titleLines.length === 2 ? 66 : 74);
                    ctx.font = `900 italic ${titleFontSize}px "Montserrat", Arial, sans-serif`;
                    ctx.letterSpacing = '2px';
                    titleLines.forEach(l => {
                        while (ctx.measureText(l).width > 920 && titleFontSize > 34) {
                            titleFontSize -= 2;
                            ctx.font = `900 italic ${titleFontSize}px "Montserrat", Arial, sans-serif`;
                        }
                    });

                    const titleLineHeight = titleFontSize * 1.18;
                    const titleBlockHeight = titleLines.length * titleLineHeight;
                    const titleStartY = centerY - 30 - ((titleLines.length - 1) * titleLineHeight) / 2;

                    titleLines.forEach((line, idx) => {
                        const lineY = titleStartY + idx * titleLineHeight;
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                        ctx.shadowBlur = 24;
                        ctx.shadowOffsetX = 3;
                        ctx.shadowOffsetY = 4;
                        ctx.fillStyle = '#ffffff';
                        ctx.fillText(line, centerX, lineY);
                    });
                    ctx.restore();

                    // C) Subtitle / Genres Musicaux
                    const genresText = (agendaCoverGenres || 'HARD TECHNO • RAWSTYLE • MULTI-GENRES').toUpperCase().trim();
                    if (genresText) {
                        ctx.save();
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        let genresFontSize = 18;
                        ctx.font = `800 ${genresFontSize}px "Montserrat", Arial, sans-serif`;
                        ctx.letterSpacing = '3px';
                        while (ctx.measureText(genresText).width > 840 && genresFontSize > 13) {
                            genresFontSize -= 1;
                            ctx.font = `800 ${genresFontSize}px "Montserrat", Arial, sans-serif`;
                        }

                        const genresW = ctx.measureText(genresText).width;
                        const genresPillW = Math.min(canvas.width - 80, genresW + 48);
                        const genresPillH = 44;
                        const genresY = titleStartY + titleBlockHeight / 2 + (titleLines.length > 1 ? 55 : 45);

                        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                        ctx.shadowBlur = 12;
                        ctx.fillStyle = 'rgba(15, 12, 10, 0.78)';
                        ctx.strokeStyle = `rgba(${monthGrad}, 0.45)`;
                        ctx.lineWidth = 1.8;
                        ctx.beginPath();
                        ctx.roundRect(centerX - genresPillW / 2, genresY - genresPillH / 2, genresPillW, genresPillH, 12);
                        ctx.fill();
                        ctx.stroke();

                        ctx.shadowColor = 'transparent';
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
                        ctx.fillText(genresText, centerX, genresY + 1);
                        ctx.restore();
                    }

                    // 3. BOTTOM CTA SWIPE
                    const ctaText = (agendaCoverCta || 'Les meilleurs events et coups de cœur du mois rassemblés en un post ➡️').trim();
                    if (ctaText) {
                        ctx.save();
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
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

                } else {
                    // ══════════════════════════════════════════════════════════
                    // SLIDE 2 : ÉVÉNEMENTS (DATES & LINEUPS)
                    // ══════════════════════════════════════════════════════════

                    // 1. TOP-LEFT BADGE (Cyber capsule assortie à la couleur du mois)
                    ctx.save();
                    const badgeX = 65;
                    const badgeY = isStory ? 90 : 65;
                const badgeText = (agendaBadgeText || 'COUPS DE CŒUR DU MOIS').toUpperCase().trim();

                // Dynamic font size & letter spacing to keep the badge ultra sharp
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

                // Tilt the badge ~ -2.3 degrees centered on the pill
                const pillCenterX = badgeX + pillW / 2;
                const pillCenterY = badgeY + pillH / 2;
                ctx.translate(pillCenterX, pillCenterY);
                ctx.rotate(-0.04);
                ctx.translate(-pillCenterX, -pillCenterY);

                // Cyber Box Glow & Fill (même couleur que le mois)
                ctx.shadowColor = `rgba(${monthGrad}, 0.75)`;
                ctx.shadowBlur = 18;
                ctx.fillStyle = 'rgba(12, 6, 4, 0.92)';
                ctx.strokeStyle = monthColor;
                ctx.lineWidth = 2.5;

                ctx.beginPath();
                ctx.roundRect(badgeX, badgeY, pillW, pillH, 10);
                ctx.fill();
                ctx.stroke();

                // Notches cyber assorties à la couleur du mois
                ctx.strokeStyle = monthColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(badgeX - 14, badgeY + pillH / 2);
                ctx.lineTo(badgeX - 4, badgeY + pillH / 2);
                ctx.moveTo(badgeX + pillW + 4, badgeY + pillH / 2);
                ctx.lineTo(badgeX + pillW + 14, badgeY + pillH / 2);
                ctx.stroke();

                // Inner text with glow matching the month color
                ctx.shadowColor = `rgba(${monthGrad}, 0.85)`;
                ctx.shadowBlur = 12;
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = `900 italic ${badgeFontSize}px "Orbitron", sans-serif`;
                ctx.letterSpacing = letterSpacing;
                ctx.fillText(badgeText, badgeX + pillW / 2 + 1, badgeY + pillH / 2 + 1);
                ctx.restore();

                // 2. BIG HOLLOW MONTH TITLE
                const monthY = isStory ? 430 : 310;
                const monthText = (agendaMonth || 'OCTOBRE').toUpperCase().trim();

                // Adaptive font size so any month name fits nicely
                let monthFontSize = isStory ? 104 : 94;
                ctx.font = `900 ${monthFontSize}px "Montserrat", Arial, sans-serif`;
                ctx.letterSpacing = '6px';
                while (ctx.measureText(monthText).width > 720 && monthFontSize > 44) {
                    monthFontSize -= 2;
                    ctx.font = `900 ${monthFontSize}px "Montserrat", Arial, sans-serif`;
                }

                // Clean Hollow Outline (Knockout Technique):
                // Eliminates internal intersecting contours in variable font glyphs (M, A, B, R, etc.)
                const offW = canvas.width;
                const offH = Math.ceil(monthFontSize * 2.2);
                const offCanvas = document.createElement('canvas');
                offCanvas.width = offW;
                offCanvas.height = offH;
                const offCtx = offCanvas.getContext('2d');

                if (offCtx) {
                    const offCenterX = offW / 2;
                    const offCenterY = offH / 2;

                    offCtx.font = `900 ${monthFontSize}px "Montserrat", Arial, sans-serif`;
                    offCtx.letterSpacing = '6px';
                    offCtx.textAlign = 'center';
                    offCtx.textBaseline = 'middle';

                    // Sharp, vibrant orange stroke (no blurry glow)
                    offCtx.strokeStyle = '#ff3700';
                    offCtx.lineWidth = 6;
                    offCtx.strokeText(monthText, offCenterX, offCenterY);

                    // KNOCKOUT: Punch out glyph solid interiors to erase any crossing lines inside the letters
                    offCtx.globalCompositeOperation = 'destination-out';
                    offCtx.fillStyle = '#000000';
                    offCtx.fillText(monthText, offCenterX, offCenterY);

                    // Draw clean hollow outline onto main canvas with a crisp subtle shadow for contrast
                    ctx.save();
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                    ctx.shadowBlur = 6;
                    ctx.shadowOffsetY = 2;
                    ctx.drawImage(offCanvas, 0, monthY - offCenterY);
                    ctx.restore();
                } else {
                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.strokeStyle = '#ff3700';
                    ctx.lineWidth = 6;
                    ctx.strokeText(monthText, centerX, monthY);
                    ctx.restore();
                }

                // 3. EVENTS LIST - With generous breathing room from the month title
                const itemsToDraw = planningItems.slice(0, isStory ? 8 : 7);
                const listStartY = isStory ? 630 : 470;
                const bottomMargin = isStory ? 140 : 80;
                const availableHeight = canvas.height - listStartY - bottomMargin;
                let rowSpacing = Math.min(
                    isStory ? 180 : 140,
                    Math.floor(availableHeight / Math.max(1, itemsToDraw.length))
                );
                if (itemsToDraw.length <= 4 && itemsToDraw.length > 0) {
                    rowSpacing = isStory ? 170 : 138;
                }

                itemsToDraw.forEach((item, i) => {
                    const rowY = listStartY + (i * rowSpacing);
                    if (rowY > canvas.height - 60) return;

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
                    
                    // Sticker angle: subtle tilt like real stickers/tape
                    const stickerAngle = (i % 2 === 0 ? -0.04 : -0.025);
                    ctx.translate(badgeXCenter, rowY);
                    ctx.rotate(stickerAngle);

                    // Sticker drop shadow
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                    ctx.shadowBlur = 14;
                    ctx.shadowOffsetX = 3;
                    ctx.shadowOffsetY = 4;

                    // Sticker background: vibrant Rave red-orange #ff3700
                    ctx.fillStyle = '#ff3700';
                    ctx.beginPath();
                    ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 6);
                    ctx.fill();

                    // Sticker text: ultra-bold black
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
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';

                    const hasArtists = Boolean(artistsText);
                    const hasDetails = Boolean(genreText || venueText);

                    // Dynamic row vertical positions:
                    // If only 1 line exists, vertically center it with the sticker!
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

                    // 1. Title / Event Name (White Bold)
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

                    // 2. Artists / Lineup (Light Silver)
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

                    // 3. Genre | Venue
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

            } else if (theme === 'CALENDRIER') {
                const calCenterX = canvas.width / 2;
                const calTopY = effectiveTab === 'PUBLICATION' ? 280 : 580;

                ctx.save();
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
                // Top black banner with opacity
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(0, 0, canvas.width, 180);
                
                // Draw Dropsiders White Logo (Native)
                if (logoRef.current) {
                    const logo = logoRef.current;
                    const lw = 500;
                    const lh = (logo.height * lw) / logo.width;
                    
                    ctx.save();
                    ctx.shadowColor = 'rgba(0,0,0,0.8)';
                    ctx.shadowBlur = 10;
                    ctx.drawImage(logo, (canvas.width - lw) / 2, 90 - lh / 2, lw, lh);
                    ctx.restore();
                }
                ctx.restore();

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
                        { text: (lines[0] || '').toUpperCase(), size: 90, color: '#ff0033' },
                        { text: (lines[1] || '').toUpperCase(), size: 60, color: '#ffffff' },
                        { text: (lines[2] || '').toUpperCase(), size: 36, color: '#ffffff', isOrbitron: true },
                    ];

                    ctx.save();
                    ctx.textAlign = 'center';
                    
                    // Animation logic: Loop in preview, start from 0 in recording
                    const elapsed = (isVideoRecording || (bgVideo && !isDownloading))
                        ? (isVideoRecording 
                            ? (Date.now() - recordingStartTimeRef.current) / 1000 
                            : (Date.now() % 5000) / 1000)
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
                    if (isArtistLogoNegative) {
                        ctx.filter = 'brightness(0) invert(1)'; // Effet négatif (blanc)
                    }
                    ctx.drawImage(logo, 80, 150, lw, lh); // Remonté de 200 à 150
                    ctx.restore();
                } else if (artistNameText) {
                    ctx.save();
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

            } else if (theme === 'CONSEILS' || theme === 'REELS') {
                ctx.save();

                // 1. TOP HEADER (Top Right Photo Credit)
                const headerY = safeTop + 65;
                const headerRightX = canvas.width - 380; // Left of top-right logo

                // Top Right: Photo Credit (citationAuthor)
                if (citationAuthor) {
                    ctx.save();
                    ctx.font = '600 22px "Montserrat", sans-serif';
                    ctx.fillStyle = 'rgba(255,255,255,0.85)';
                    ctx.shadowColor = 'rgba(0,0,0,0.85)';
                    ctx.shadowBlur = 8;
                    ctx.textAlign = 'right';
                    ctx.fillText(citationAuthor, headerRightX, headerY);
                    ctx.restore();
                }

                // 2. DIVIDER LINE & SWIPE (Lowered by 25% to 65% height)
                const dividerY = Math.floor(canvas.height * 0.65);
                let swipeSpaceRight = 0;

                // Swipe indicator on the exact same line as the divider line
                if (showSwipe) {
                    ctx.save();
                    ctx.font = '800 24px "Montserrat", sans-serif';
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = 'rgba(0,0,0,0.85)';
                    ctx.shadowBlur = 8;
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'middle';
                    const swipeText = 'Swipe ──>';
                    swipeSpaceRight = ctx.measureText(swipeText).width + 20;
                    ctx.fillText(swipeText, canvas.width - 60, dividerY);
                    ctx.restore();
                }

                const lineRightX = canvas.width - 60 - swipeSpaceRight;

                // Horizontal line (Thicker line: 5px)
                ctx.save();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 5;
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                ctx.shadowBlur = 8;

                if (artistLogoRef.current) {
                    const badgeW = 60;
                    const badgeH = 50;
                    const badgeX = (canvas.width - badgeW) / 2;
                    const badgeY = dividerY - (badgeH / 2);

                    ctx.beginPath();
                    ctx.moveTo(60, dividerY);
                    ctx.lineTo(badgeX - 16, dividerY);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(badgeX + badgeW + 16, dividerY);
                    ctx.lineTo(lineRightX, dividerY);
                    ctx.stroke();

                    // Badge Container for custom logo
                    ctx.save();
                    ctx.fillStyle = '#000000';
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2.5;
                    ctx.shadowColor = 'rgba(0,0,0,0.6)';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 10);
                    ctx.fill();
                    ctx.stroke();

                    const img = artistLogoRef.current;
                    const padding = 10;
                    const maxLW = badgeW - padding * 2;
                    const maxLH = badgeH - padding * 2;
                    let lw = img.width;
                    let lh = img.height;
                    const r = Math.min(maxLW / lw, maxLH / lh);
                    lw *= r; lh *= r;
                    ctx.drawImage(img, (canvas.width - lw) / 2, dividerY - (lh / 2), lw, lh);
                    ctx.restore();
                } else {
                    // Line shortened on right if swipe is active
                    ctx.beginPath();
                    ctx.moveTo(60, dividerY);
                    ctx.lineTo(lineRightX, dividerY);
                    ctx.stroke();
                }
                ctx.restore();

                // 3. MAIN TITLE IN WHITE (BOLD) & SUBTEXT UNDERNEATH (ITALIC)
                const mainTitleText = (conseilsTitle && conseilsTitle !== 'LE TITRE ICI') ? conseilsTitle : '';
                const bodyText = conseilsSubtext || '';

                const lineWidth = canvas.width - 120; // Exactement 960px entre 60px et 1020px
                const isTitleOnly = mainTitleText && !bodyText;
                let curY = dividerY + 62;

                // --- A) MAIN TITLE IN WHITE ---
                if (mainTitleText) {
                    ctx.save();
                    
                    // Titre réduit et élégant (58px solo, 42px avec texte)
                    let titleFontSize = isTitleOnly ? 58 : 42;
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
                                if (ctx.measureText(test.toUpperCase()).width > lineWidth) {
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
                    while (titleFontSize > 26 && titleLines.some(l => ctx.measureText(l.toUpperCase()).width > lineWidth)) {
                        titleFontSize -= 2;
                        titleLines = formatTitleLines(titleFontSize);
                    }

                    const titleLineHeight = Math.round(titleFontSize * 1.18);
                    ctx.font = `900 ${titleFontSize}px "Montserrat", sans-serif`;
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                    ctx.shadowBlur = 16;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'alphabetic';

                    titleLines.forEach(tLine => {
                        ctx.fillText(tLine.toUpperCase(), canvas.width / 2, curY);
                        curY += titleLineHeight;
                    });
                    ctx.restore();
                    curY += 22; // Espacement propre
                }

                // --- B) SUBTEXT UNDERNEATH ---
                if (bodyText) {
                    ctx.save();
                    let subFontSize = 26;
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
                                if (ctx.measureText(test).width > lineWidth) {
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
                    while (subFontSize > 16 && subLines.some(l => ctx.measureText(l).width > lineWidth)) {
                        subFontSize -= 1;
                        subLines = formatSubLines(subFontSize);
                    }

                    const subLineHeight = Math.round(subFontSize * 1.36);
                    ctx.font = `italic 400 ${subFontSize}px "Montserrat", sans-serif`;
                    ctx.fillStyle = 'rgba(255,255,255,0.92)';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                    ctx.shadowBlur = 10;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'alphabetic';

                    subLines.forEach(bLine => {
                        ctx.fillText(bLine, canvas.width / 2, curY);
                        curY += subLineHeight;
                    });
                    ctx.restore();
                }

                // 4. DISCREET AUDIO SPEAKER ICON (Bottom Right Corner)
                ctx.save();
                const spkX = canvas.width - 65;
                const spkY = canvas.height - safeBottom - 15;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.moveTo(spkX - 8, spkY - 6);
                ctx.lineTo(spkX - 3, spkY - 6);
                ctx.lineTo(spkX + 4, spkY - 12);
                ctx.lineTo(spkX + 4, spkY + 12);
                ctx.lineTo(spkX - 3, spkY + 6);
                ctx.lineTo(spkX - 8, spkY + 6);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(spkX + 4, spkY, 7, -Math.PI / 3, Math.PI / 3);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(spkX + 4, spkY, 13, -Math.PI / 3, Math.PI / 3);
                ctx.stroke();
                ctx.restore();

                ctx.restore();

            } else if (theme === 'CONCOURS') {
                ctx.save();

                const isGTA = concoursMode === 'GTA6';

                // 1. BANDEAU HAUT GAUCHE (Attaché au bord gauche x=0, ajusté finement au texte avec ~5-8% de marge, centré sur le logo à droite)
                const wLogo = 320;
                const logoH = logoRef.current ? (logoRef.current.height * wLogo) / logoRef.current.width : 65.5;
                const yOffset = bgVideo ? 70 : 20;
                const logoCenterY = yOffset + (logoH / 2);

                const lateralLabel = (concoursLateralText || (isGTA ? 'JEU CONCOURS GTA 6' : 'JEUX CONCOURS')).toUpperCase();
                const textFontSize = 32;
                ctx.font = `900 italic ${textFontSize}px "Montserrat", sans-serif`;
                const textMetrics = ctx.measureText(lateralLabel);

                const bandeauH = 48;
                const bandeauY = Math.round(logoCenterY - (bandeauH / 2));
                const bandeauCenterY = logoCenterY;
                const bandeauW = Math.max(340, Math.round(textMetrics.width + 60));

                const opacity = concoursLateralOpacity !== undefined ? concoursLateralOpacity : (isGTA ? 0.50 : 0.40);
                // Fond bandeau néon
                ctx.fillStyle = isGTA ? `rgba(255, 0, 127, ${opacity})` : `rgba(112, 0, 255, ${opacity})`;
                ctx.beginPath();
                ctx.roundRect(0, bandeauY, bandeauW, bandeauH, [0, 12, 12, 0]);
                ctx.fill();

                // Cadre / liseré néon autour du bandeau
                ctx.strokeStyle = isGTA ? 'rgba(0, 240, 255, 0.95)' : 'rgba(168, 85, 247, 0.85)';
                ctx.lineWidth = 2.5;
                ctx.stroke();

                // Texte centré optiquement
                ctx.fillStyle = concoursBadgeTextColor || (isGTA ? '#00f0ff' : '#ffffff');
                ctx.shadowColor = isGTA ? 'rgba(0, 240, 255, 0.6)' : 'rgba(0, 0, 0, 0.95)';
                ctx.shadowBlur = isGTA ? 12 : 10;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(lateralLabel, bandeauW / 2, bandeauCenterY + 2);

                if (isGTA) {
                    // ==========================================
                    // 2. TEMPLATE GTA 6 (Style Vice City Ultra Lisible)
                    // ==========================================
                    const headline = (concoursGTAHeadline || 'DROPSIDERS TE FAIT GAGNER').toUpperCase();
                    const gtaTitle = (concoursGTATitle || 'GTA 6').toUpperCase();
                    const platform = (concoursGTAPlatformText || 'SUR LA PLATEFORME DE TON CHOIX').toUpperCase();
                    const subtitle = "POUR PARTICIPER :";

                    const isPub = effectiveTab === 'PUBLICATION';
                    let curY = isPub ? 730 : 1130;

                    // A) HEADLINE : DROPSIDERS TE FAIT GAGNER
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'alphabetic';
                    ctx.font = isPub ? '900 italic 38px "Montserrat", sans-serif' : '900 italic 44px "Montserrat", sans-serif';
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = 'rgba(0, 0, 0, 1)';
                    ctx.shadowBlur = 18;
                    ctx.fillText(headline, canvas.width / 2, curY);

                    // B) GRAND TITRE DU LOT : GTA 6 (Énorme néon avec contour sombre et éclat)
                    curY += isPub ? 86 : 105;
                    const titleFontSize = isPub ? 96 : 115;
                    ctx.font = `900 italic ${titleFontSize}px "Montserrat", sans-serif`;
                    ctx.lineWidth = 8;
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
                    ctx.strokeText(gtaTitle, canvas.width / 2, curY);
                    ctx.fillStyle = '#ff007f';
                    ctx.shadowColor = 'rgba(255, 0, 127, 0.95)';
                    ctx.shadowBlur = 30;
                    ctx.fillText(gtaTitle, canvas.width / 2, curY);

                    // C) PLATEFORME : Pilule élégante jaune néon / or
                    curY += isPub ? 48 : 58;
                    ctx.font = isPub ? '900 italic 21px "Montserrat", sans-serif' : '900 italic 25px "Montserrat", sans-serif';
                    const platLabel = `🎮  ${platform}`;
                    const platTextW = ctx.measureText(platLabel).width;
                    const platPillW = platTextW + 48;
                    const platPillH = isPub ? 38 : 44;
                    const platPillX = (canvas.width - platPillW) / 2;
                    const platPillY = curY - (platPillH * 0.75);

                    ctx.fillStyle = 'rgba(255, 230, 0, 0.16)';
                    ctx.beginPath();
                    ctx.roundRect(platPillX, platPillY, platPillW, platPillH, platPillH / 2);
                    ctx.fill();

                    ctx.strokeStyle = '#ffe600';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = 'rgba(255, 230, 0, 0.6)';
                    ctx.shadowBlur = 12;
                    ctx.stroke();

                    ctx.fillStyle = '#ffe600';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                    ctx.shadowBlur = 8;
                    ctx.fillText(platLabel, canvas.width / 2, curY);

                    // D) SOUS-TITRE : POUR PARTICIPER :
                    curY += isPub ? 50 : 60;
                    ctx.font = isPub ? '900 italic 25px "Montserrat", sans-serif' : '900 italic 29px "Montserrat", sans-serif';
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = 'rgba(0, 0, 0, 1)';
                    ctx.shadowBlur = 12;
                    ctx.fillText(subtitle, canvas.width / 2, curY);

                    // E) CARTE ULTRA-LISIBLE POUR LES 4 CONDITIONS
                    curY += isPub ? 25 : 30;
                    const cardMargin = 50;
                    const cardW = canvas.width - (cardMargin * 2);
                    const cardH = isPub ? 355 : 430;
                    const cardX = cardMargin;
                    const cardY = curY;

                    // Fond de carte sombre et opaque (assure une lisibilité parfaite à 100%)
                    ctx.save();
                    ctx.fillStyle = 'rgba(8, 12, 24, 0.94)';
                    ctx.beginPath();
                    ctx.roundRect(cardX, cardY, cardW, cardH, 24);
                    ctx.fill();

                    // Bordure dégradé néon (Cyan vers Rose)
                    const cardBorderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
                    cardBorderGrad.addColorStop(0, 'rgba(0, 240, 255, 0.7)');
                    cardBorderGrad.addColorStop(1, 'rgba(255, 0, 127, 0.7)');
                    ctx.strokeStyle = cardBorderGrad;
                    ctx.lineWidth = 2.5;
                    ctx.shadowColor = 'rgba(0, 240, 255, 0.35)';
                    ctx.shadowBlur = 18;
                    ctx.stroke();
                    ctx.restore();

                    // 4 LIGNES DE CONDITIONS STRUCTURÉES AVEC BADGES
                    const conditionsData = [
                        {
                            num: '1',
                            badgeColor: '#ff007f',
                            badgeBg: 'rgba(255, 0, 127, 0.25)',
                            text: concoursGTACondition1 || '1 - likez la publication'
                        },
                        {
                            num: '2',
                            badgeColor: '#00f0ff',
                            badgeBg: 'rgba(0, 240, 255, 0.25)',
                            text: concoursGTACondition2 || '2 - identifiez 2 potes qui doivent liker la page'
                        },
                        {
                            num: '3',
                            badgeColor: '#ffe600',
                            badgeBg: 'rgba(255, 230, 0, 0.25)',
                            text: concoursGTACondition3 || '3 - partagez en storie'
                        },
                        {
                            num: '4',
                            badgeColor: '#00f0ff',
                            badgeBg: 'rgba(0, 240, 255, 0.25)',
                            text: concoursGTACondition4 || '4 - pour validez la participation repondez aux 3 questions qui sont disponible sur le site dropsiders.fr'
                        }
                    ];

                    const rowH = isPub ? 82 : 100;
                    const badgeR = isPub ? 21 : 25;
                    const badgeX = cardX + (isPub ? 46 : 56);
                    const textStartX = badgeX + badgeR + (isPub ? 22 : 26);

                    conditionsData.forEach((cond, idx) => {
                        const rowCenterY = cardY + 28 + (idx * rowH) + (badgeR);

                        // 1. Badge numéro circulaire
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(badgeX, rowCenterY, badgeR, 0, Math.PI * 2);
                        ctx.fillStyle = cond.badgeBg;
                        ctx.fill();
                        ctx.strokeStyle = cond.badgeColor;
                        ctx.lineWidth = 2;
                        ctx.shadowColor = cond.badgeColor;
                        ctx.shadowBlur = 10;
                        ctx.stroke();

                        ctx.fillStyle = '#ffffff';
                        ctx.font = `900 italic ${isPub ? 21 : 25}px "Montserrat", sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                        ctx.shadowBlur = 6;
                        ctx.fillText(cond.num, badgeX, rowCenterY + 1);
                        ctx.restore();

                        // 2. Texte de la condition (Gras, net, lisible)
                        ctx.save();
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'middle';

                        let fontSize = isPub ? (idx === 3 ? 19.5 : 22.5) : (idx === 3 ? 24 : 27);
                        ctx.font = `800 italic ${fontSize}px "Montserrat", sans-serif`;

                        const rawText = (cond.text || '').toUpperCase().trim();
                        const cleanedText = rawText.replace(/^\d+\s*[-–.]\s*/, '');

                        const keywords = [
                            { word: 'DROPSIDERS.FR', color: '#00f0ff' },
                            { word: '3 QUESTIONS', color: '#ffe600' },
                            { word: '2 POTES', color: '#00f0ff' },
                            { word: 'EN STORIE', color: '#ffe600' },
                            { word: 'EN STORY', color: '#ffe600' },
                            { word: 'LIKEZ LA PUBLICATION', color: '#ff007f' },
                            { word: 'LA PUBLICATION', color: '#ff007f' }
                        ];

                        const kwPattern = new RegExp(`(${keywords.map(k => k.word.replace('.', '\\.')).join('|')})`, 'g');
                        const tokens = cleanedText.split(kwPattern);

                        let currentX = textStartX;
                        const maxTextW = (cardX + cardW - 25) - textStartX;

                        while (ctx.measureText(cleanedText).width > maxTextW && fontSize > 14) {
                            fontSize -= 0.5;
                            ctx.font = `800 italic ${fontSize}px "Montserrat", sans-serif`;
                        }

                        tokens.forEach(tok => {
                            if (!tok) return;
                            const matchedKw = keywords.find(k => k.word === tok);
                            const textColor = matchedKw ? matchedKw.color : '#ffffff';

                            ctx.fillStyle = textColor;
                            ctx.shadowColor = matchedKw ? matchedKw.color : 'rgba(0, 0, 0, 0.95)';
                            ctx.shadowBlur = matchedKw ? 12 : 8;
                            ctx.fillText(tok, currentX, rowCenterY + 1);
                            currentX += ctx.measureText(tok).width;
                        });

                        ctx.restore();
                    });

                } else {
                    // ==========================================
                    // 2. TEMPLATE FESTIVAL (Original)
                    // ==========================================
                    const festName = (concoursFestivalName || festivalNameText || 'NOM DU FESTIVAL').toUpperCase();
                    const headlineText = 'GAGNE TES INVITATIONS POUR';
                    const subtitleText = "POUR PARTICIPER C'EST TRÈS SIMPLE :";

                    const baseStartY = effectiveTab === 'PUBLICATION' ? 950 : 1380;
                    let curY = baseStartY;

                    // A) GRAND TITRE : GAGNE TES INVITATIONS POUR
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'alphabetic';
                    ctx.font = '900 italic 44px "Montserrat", sans-serif';
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                    ctx.shadowBlur = 14;
                    ctx.fillText(headlineText, canvas.width / 2, curY);

                    // B) NOM DU FESTIVAL
                    curY += 58;
                    let festFontSize = 52;
                    ctx.font = `900 italic ${festFontSize}px "Montserrat", sans-serif`;
                    while (ctx.measureText(festName).width > (canvas.width - 120) && festFontSize > 26) {
                        festFontSize -= 2;
                        ctx.font = `900 italic ${festFontSize}px "Montserrat", sans-serif`;
                    }
                    ctx.fillStyle = '#00ffff';
                    ctx.shadowColor = 'rgba(0, 255, 255, 0.45)';
                    ctx.shadowBlur = 18;
                    ctx.fillText(festName, canvas.width / 2, curY);

                    // C) SOUS-TITRE : POUR PARTICIPER C'EST TRÈS SIMPLE :
                    curY += 62;
                    ctx.font = '900 italic 28px "Montserrat", sans-serif';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                    ctx.shadowBlur = 10;
                    ctx.fillText(subtitleText, canvas.width / 2, curY);

                    // D) CONDITIONS DE PARTICIPATION FIXES
                    curY += 58;
                    const rawHandle = concoursFestivalHandle.trim();
                    const festHandle = rawHandle
                        ? (rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`)
                        : (festivalNameText ? `@${festivalNameText.toLowerCase().replace(/\s+/g, '')}` : '@FESTIVAL');

                    const flashyColor = '#00ffff';
                    const stepSegments: Array<Array<{ text: string; color: string }>> = [
                        [
                            { text: '1. FOLLOW LA PAGE ', color: '#ffffff' },
                            { text: '@DROPSIDERS.FR', color: flashyColor },
                            { text: ' + ', color: '#ffffff' },
                            { text: festHandle.toUpperCase(), color: flashyColor }
                        ],
                        [
                            { text: "2. IDENTIFIE LA PERSONNE QUI T'ACCOMPAGNERA", color: '#ffffff' }
                        ],
                        [
                            { text: '3. PARTAGE EN STORY (PUBLIC) EN NOUS IDENTIFIANT + ', color: '#ffffff' },
                            { text: festHandle.toUpperCase(), color: flashyColor }
                        ],
                        [
                            { text: '4. REPOST CE POST', color: '#ffffff' }
                        ]
                    ];

                    let ruleFontSize = effectiveTab === 'PUBLICATION' ? 24 : 26;
                    const ruleLineHeight = effectiveTab === 'PUBLICATION' ? 52 : 60;

                    ctx.font = `800 italic ${ruleFontSize}px "Montserrat", sans-serif`;
                    stepSegments.forEach(segments => {
                        const fullText = segments.map(s => s.text).join('');
                        while (ctx.measureText(fullText).width > (canvas.width - 100) && ruleFontSize > 18) {
                            ruleFontSize -= 1;
                            ctx.font = `800 italic ${ruleFontSize}px "Montserrat", sans-serif`;
                        }
                    });

                    stepSegments.forEach((segments) => {
                        const fullWidth = segments.reduce((acc, s) => acc + ctx.measureText(s.text).width, 0);
                        let startX = (canvas.width / 2) - (fullWidth / 2);

                        ctx.textAlign = 'left';
                        segments.forEach(seg => {
                            ctx.fillStyle = seg.color;
                            ctx.shadowColor = seg.color === flashyColor ? 'rgba(0, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.95)';
                            ctx.shadowBlur = seg.color === flashyColor ? 14 : 12;
                            ctx.fillText(seg.text, startX, curY);
                            startX += ctx.measureText(seg.text).width;
                        });

                        curY += ruleLineHeight;
                    });
                }

                ctx.restore();

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

            } else if (theme === 'PROMO') {
                const centerX = canvas.width / 2;
                const isReel = effectiveTab === 'REEL';

                // 1. Dark overlay — 75% opaque black
                ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Scan lines subtle texture
                ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
                for (let i = 0; i < canvas.height; i += 6) {
                    ctx.fillRect(0, i, canvas.width, 2);
                }

                // ==========================================
                // ZONE 1 : QUESTION DE L'ARTICLE
                // ==========================================
                // Question texte (auto-wrap multi-lignes)
                const rawQuestion = (customText && customText.trim()) 
                    ? customText.trim().replace(/^["']|["']$/g, '') 
                    : "ET TOI, QU'EN PENSES-TU ?";
                
                const cleanQuestion = rawQuestion.toUpperCase();

                // Helper pour découper en lignes (max ~920px)
                const qLines: string[] = [];
                const words = cleanQuestion.split(' ');
                let currentLine = '';
                let questionFontSize = isReel ? 62 : 54;
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

                // Si trop de lignes (> 3), réduire la police
                if (qLines.length > 3) {
                    questionFontSize = isReel ? 48 : 40;
                    ctx.font = `900 italic ${questionFontSize}px "Montserrat", sans-serif`;
                }

                const qLineHeight = questionFontSize * 1.25;

                // Offsets précis pour centrage vertical parfait
                const ctaCommentOffset = isReel ? 70 : 60;
                const sepOffset = isReel ? 65 : 55;
                const outroOffset = isReel ? 75 : 65;
                const outroSpacing = isReel ? 42 : 38;
                const abonneOffset = outroSpacing + (isReel ? 30 : 28);
                const dropsidersOffset = isReel ? 90 : 80;
                const pillsOffset = isReel ? 65 : 55;
                const pillH = isReel ? 44 : 40;

                const blockSpanFromFirstBaseline = (qLines.length - 1) * qLineHeight 
                    + ctaCommentOffset 
                    + sepOffset 
                    + outroOffset 
                    + outroSpacing 
                    + abonneOffset 
                    + dropsidersOffset 
                    + pillsOffset 
                    + pillH;
                
                const questionAscender = questionFontSize * 0.8;
                const totalBlockHeight = questionAscender + blockSpanFromFirstBaseline;

                // Centrage vertical : centre optique sur le canvas (1350 ou 1920)
                const targetCenterY = isReel ? 950 : 675;
                const qStartY = Math.round(targetCenterY - (totalBlockHeight / 2) + questionAscender);

                // Accent glow centre derriere le bloc de texte
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
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(line, centerX, qStartY + idx * qLineHeight);
                });
                ctx.restore();

                // Call-to-action d'engagement : "DONNE TON AVIS EN COMMENTAIRE 👇"
                const lastQLineY = qStartY + (qLines.length - 1) * qLineHeight;
                const ctaCommentY = lastQLineY + ctaCommentOffset;

                ctx.save();
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

                // ==========================================
                // ZONE 2 : PHRASE OFFICIELLE
                // "Pour être informé de toutes les news sur la musique électronique et les festivals, abonnez-vous à DROPSIDERS"
                // ==========================================
                const outroStartY = sepY + outroOffset;

                ctx.save();
                ctx.textAlign = 'center';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                ctx.shadowBlur = 16;

                const outroLines = [
                    'POUR ÊTRE INFORMÉ DE TOUTES LES NEWS',
                    'SUR LA MUSIQUE ÉLECTRONIQUE ET LES FESTIVALS,'
                ];
                ctx.font = `700 ${isReel ? 28 : 25}px "Montserrat", sans-serif`;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';

                outroLines.forEach((line: string, i: number) => {
                    ctx.fillText(line, centerX, outroStartY + i * outroSpacing);
                });

                // "ABONNEZ-VOUS À"
                const abonneY = outroStartY + outroLines.length * outroSpacing + (isReel ? 30 : 28);
                ctx.font = `700 ${isReel ? 26 : 24}px "Montserrat", sans-serif`;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.fillText('ABONNEZ-VOUS À', centerX, abonneY);

                // "DROPSIDERS" en grand Orbitron néon
                const dropsidersY = abonneY + dropsidersOffset;
                ctx.font = `900 italic ${isReel ? 92 : 86}px "Orbitron", sans-serif`;
                ctx.letterSpacing = '-2px';
                ctx.fillStyle = activeColor.color;
                ctx.shadowColor = `rgba(${activeColor.grad}, 0.7)`;
                ctx.shadowBlur = 36;
                ctx.fillText('DROPSIDERS', centerX, dropsidersY);
                ctx.restore();

                // ==========================================
                // ZONE 3 : BULLES ARRONDIES
                // NEWS - MUSIQUE - FOCUS - RECAPS - CONCOURS - EVENTS - INTERVIEWS - VIDEOS
                // ==========================================
                const categories = ['NEWS', 'MUSIQUE', 'FOCUS', 'RECAPS', 'CONCOURS', 'EVENTS', 'INTERVIEWS', 'VIDEOS'];
                const pillsY = dropsidersY + pillsOffset;
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
                    const promoCatStr = (promoCategory || 'NEWS').toLowerCase();
                    const isSpecificCat = ['musique', 'focus', 'recap', 'concour', 'event', 'interview', 'video'].some(c => promoCatStr.includes(c));
                    const isPillActive = promoCatStr.includes(cat.toLowerCase().slice(0, 4)) || (!isSpecificCat && idx === 0);
                    ctx.save();
                    // Bulle arrondie (pill)
                    ctx.beginPath();
                    ctx.roundRect(currentPillX, pillsY, pw, pillH, pillH / 2);
                    ctx.fillStyle = isPillActive ? `rgba(${activeColor.grad}, 0.15)` : 'rgba(255, 255, 255, 0.08)';
                    ctx.fill();
                    ctx.strokeStyle = isPillActive ? activeColor.color : 'rgba(255, 255, 255, 0.22)';
                    ctx.lineWidth = 1.5;
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

            } else if (theme === 'AFFICHE') {
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

                // 2. Dimensions de la carte d'affiche (réduite pour ne plus passer sous le logo Dropsiders)
                const baseCardW = 800;
                const baseCardH = isStory ? 1380 : 980;
                const baseCardY = isStory ? (bgVideo ? 250 : 220) : (bgVideo ? 230 : 195);

                const scale = (afficheScale || 100) / 100;
                const cardW = Math.round(baseCardW * scale);
                const cardH = Math.round(baseCardH * scale);
                const cardX = Math.round((canvas.width - cardW) / 2);
                const cardY = Math.round(baseCardY + ((baseCardH - cardH) / 2) + (afficheOffsetY || 0));
                const rad = isStory ? 28 : 24;

                // 3. Ombre portée 3D et halo ambiant néon
                ctx.save();
                if (afficheGlow) {
                    ctx.shadowColor = `rgba(${activeColor.grad}, 0.35)`;
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

                // 4. Rendu de l'affiche de l'événement dans le rectangle arrondi clippé
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

                // 5. Contour bordure élégant
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(cardX, cardY, cardW, cardH, rad);
                ctx.strokeStyle = afficheBorderColor || 'rgba(255, 255, 255, 0.22)';
                ctx.lineWidth = 2.5;
                ctx.stroke();
                ctx.restore();

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
                const badgeX = isReel ? 80 : 60;
                const badgeY = isReel ? 70 : 45;
                const themeDotColor = (theme === 'INTERVIEW') ? '#ffffff' : activeData.color;
                const badgeLabelText = (theme === 'ARTISTE FESTIVAL') 
                    ? (festivalNameText ? festivalNameText.toUpperCase() : 'FESTIVAL')
                    : (('label' in activeData) ? (activeData as any).label : theme);

                ctx.save();
                const badgeFontSize = 21;
                ctx.font = `900 italic ${badgeFontSize}px "Montserrat", sans-serif`;
                const textMeasure = ctx.measureText(badgeLabelText);
                const badgePadX = 20;
                const dotSize = 6;
                const dotGap = 12;
                const badgeW = badgePadX + (dotSize * 2) + dotGap + textMeasure.width + badgePadX;
                const badgeH = 46;
                const badgeRadius = 23;

                // Glass Pill Background
                ctx.fillStyle = 'rgba(12, 14, 20, 0.78)';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
                ctx.shadowBlur = 16;
                ctx.shadowOffsetY = 4;
                ctx.beginPath();
                ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeRadius);
                ctx.fill();

                // Pill Border with Theme Accent
                ctx.shadowColor = 'transparent';
                ctx.strokeStyle = (theme === 'INTERVIEW')
                    ? 'rgba(255, 255, 255, 0.55)'
                    : `rgba(${activeData.grad}, 0.55)`;
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeRadius);
                ctx.stroke();

                // Glowing Theme Dot
                const dotCenterX = badgeX + badgePadX + dotSize;
                const dotCenterY = badgeY + (badgeH / 2);
                ctx.save();
                ctx.fillStyle = themeDotColor;
                ctx.shadowColor = themeDotColor;
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(dotCenterX, dotCenterY, dotSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Pill Text (White bold italic)
                ctx.fillStyle = '#ffffff';
                ctx.letterSpacing = '2px';
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'left';
                ctx.fillText(badgeLabelText, dotCenterX + dotSize + dotGap, dotCenterY + 1);
                ctx.restore();

                // 2. OPTIONAL ARTIST LOGO (For Interview or other themes if uploaded)
                if (theme === 'INTERVIEW' && artistLogoRef.current) {
                    ctx.save();
                    const aLogo = artistLogoRef.current;
                    const maxW = 420;
                    const maxH = 140;
                    let lw = aLogo.width;
                    let lh = aLogo.height;
                    const ratio = Math.min(maxW / lw, maxH / lh);
                    lw *= ratio; lh *= ratio;
                    const logoX = (canvas.width - lw) / 2;
                    const logoY = (effectiveTab === 'PUBLICATION' ? 820 : safeBottom - 500);
                    ctx.shadowColor = 'rgba(0,0,0,0.9)';
                    ctx.shadowBlur = 20;
                    if (isArtistLogoNegative) {
                        ctx.filter = 'brightness(0) invert(1)';
                    }
                    ctx.drawImage(aLogo, logoX, logoY, lw, lh);
                    ctx.restore();
                }

                // 3. LOWER-THIRD HOOK TYPOGRAPHY (French Crowd Style)
                const textToRender = (theme === 'ARTISTE FESTIVAL')
                    ? (customText || 'LES 10 ARTISTES À NE PAS LOUPER')
                    : customText;

                if (textToRender) {
                    const rawLines = textToRender.toUpperCase().split('\n');
                    const maxLineWidth = canvas.width - 120; // 960px width
                    
                    // Dynamic font size computation based on text length
                    let fontSize = 56;
                    const charCount = textToRender.length;
                    if (charCount < 40) fontSize = 62;
                    else if (charCount < 85) fontSize = 54;
                    else if (charCount < 140) fontSize = 48;
                    else fontSize = 40;

                    const computeLines = (fSize: number) => {
                        ctx.font = `900 italic ${fSize}px "Montserrat", sans-serif`;
                        const res: string[] = [];
                        for (const para of rawLines) {
                            if (para.trim() === '') { res.push(''); continue; }
                            const words = para.trim().split(/\s+/);
                            let cur = '';
                            for (const w of words) {
                                const test = cur ? `${cur} ${w}` : w;
                                if (ctx.measureText(stripTags(test)).width <= maxLineWidth) {
                                    cur = test;
                                } else {
                                    if (cur) res.push(cur);
                                    cur = w;
                                }
                            }
                            if (cur) res.push(cur);
                        }
                        return res;
                    };

                    let lines = computeLines(fontSize);
                    while (fontSize > 32 && lines.length > 5) {
                        fontSize -= 4;
                        lines = computeLines(fontSize);
                    }

                    const lineHeight = Math.round(fontSize * 1.22);
                    const totalTextH = lines.length * lineHeight;

                    // Compute baseline: anchored nicely in the lower third
                    const subtitleExtraH = (theme === 'ARTISTE FESTIVAL' && festivalNameText) ? 46 : 0;
                    const bottomMargin = (effectiveTab === 'PUBLICATION')
                        ? (showSwipe || theme === 'ARTISTE FESTIVAL' || showArticleLink || showVoteLink ? 130 : 85)
                        : (showSwipe || theme === 'ARTISTE FESTIVAL' || showArticleLink || showVoteLink ? 320 : 260);

                    const startY = canvas.height - bottomMargin - subtitleExtraH - totalTextH + (fontSize * 0.88);

                    // Render lines with rich text (*mot* colored in theme color) and deep readable drop shadow
                    ctx.save();
                    ctx.font = `900 italic ${fontSize}px "Montserrat", sans-serif`;
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.98)';
                    ctx.shadowBlur = 24;
                    ctx.shadowOffsetY = 6;
                    lines.forEach((line, i) => {
                        if (line !== '') {
                            const yPos = startY + (i * lineHeight);
                            drawRichText(ctx, line, canvas.width / 2, yPos, textColor, 'center');
                        }
                    });
                    ctx.restore();

                    // Subtitle for ARTISTE FESTIVAL Slide 1
                    if (theme === 'ARTISTE FESTIVAL' && festivalNameText) {
                        ctx.save();
                        ctx.font = '800 24px "Montserrat", sans-serif';
                        ctx.letterSpacing = '3px';
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                        ctx.shadowBlur = 12;
                        ctx.textAlign = 'center';
                        ctx.fillText(`${festivalNameText.toUpperCase()} • SÉLECTION EXCLUSIVE`, canvas.width / 2, startY + totalTextH + 20);
                        ctx.restore();
                    }
                }

                // 4. BOTTOM INDICATORS (Swipe & Bio Links)
                const indicatorY = (effectiveTab === 'PUBLICATION') ? canvas.height - 55 : canvas.height - 230;

                // Swipe indicator at bottom right
                if (showSwipe || theme === 'ARTISTE FESTIVAL') {
                    ctx.save();
                    ctx.font = '900 italic 24px "Montserrat", sans-serif';
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                    ctx.shadowBlur = 12;
                    ctx.textAlign = 'right';
                    ctx.fillText('Swipe ──>', canvas.width - 60, indicatorY);
                    ctx.restore();
                }

                // Link in bio indicator at bottom left
                if (showArticleLink) {
                    ctx.save();
                    ctx.font = '800 20px "Montserrat", sans-serif';
                    ctx.letterSpacing = '1px';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                    ctx.shadowBlur = 10;
                    ctx.textAlign = 'left';
                    ctx.fillText('🔗 LIEN EN BIO', 60, indicatorY);
                    ctx.restore();
                } else if (showVoteLink) {
                    ctx.save();
                    ctx.font = '800 20px "Montserrat", sans-serif';
                    ctx.letterSpacing = '1px';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                    ctx.shadowBlur = 10;
                    ctx.textAlign = 'left';
                    ctx.fillText('🗳️ VOTER EN BIO', 60, indicatorY);
                    ctx.restore();
                }
            }

            // 5. Apply Transition Effects (Glitch / Zoom)
            if (transitionProgress > 0) {
                const glitchIntensity = Math.sin(transitionProgress * Math.PI);

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
            if (logoRef.current && theme !== 'TRACKLIST' && theme !== 'SPOTLIGHT' && !(theme === 'ARTISTE FESTIVAL' && artisteFestivalSlide === 2) && theme !== 'PROMO') {
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

            // Swipe & links legacy fallback (uniquement pour les thèmes non modernisés et non exports PROMO)
            const isPromoExport = exportMode === 'PROMO';

            if (showSwipe && !isPromoExport && theme !== 'CONSEILS' && theme !== 'REELS' && !isModernEditorialTheme) {
                ctx.save();
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                ctx.font = '900 italic 45px "Montserrat", sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 10;
                ctx.fillText('>>', canvas.width - 40, canvas.height - 10);
                ctx.restore();
            }

            if (showArticleLink && !isPromoExport && !isModernEditorialTheme) {
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

            if (showVoteLink && !isPromoExport && !isModernEditorialTheme) {
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
        if (bgVideo || isVideoRecording) {
            const loop = () => { generateImage(); anim = requestAnimationFrame(loop); };
            anim = requestAnimationFrame(loop);
        } else { generateImage(); }
        return () => cancelAnimationFrame(anim);
    }, [bgImage, bgVideo, customText, theme, showSwipe, showArticleLink, showVoteLink, top5Items, currentPreviewIndex, activeTab, rotation, themeColor, isVideoRecording, transitionProgress, showText, planningDate, planningItems, agendaMonth, agendaBadgeText, agendaSlide, agendaCoverBadge, agendaCoverTitle, agendaCoverYear, agendaCoverGenres, agendaCoverCta, artisteFestivalSlide, calendarMonth, calendarEvents, isRetouchMode, retouchPath, isTransparent, showBottomLogo, artistLogo, festivalLogo, bgOffsetX, bgOffsetY, artistNameText, festivalNameText, isArtistLogoNegative, mapFestivalText, mapCityCountry, mapZoom, mapLatitude, mapLongitude, mapStyle, isMapLoading, mapPinColor, mapLabelText, showMapPin, showMapLabel, imgLayoutMode, quizColor1, quizColor2, showFrame, conseilsTitle, conseilsSubtext, isConseilsLargeTitle, concoursFestivalName, concoursFestivalHandle, concoursBottomColor, concoursLateralText, concoursLateralOpacity, concoursBadgeTextColor, concoursMode, concoursGTAHeadline, concoursGTATitle, concoursGTAPlatformText, concoursGTACondition1, concoursGTACondition2, concoursGTACondition3, concoursGTACondition4, afficheImage, afficheGlow, afficheBorderColor, afficheMode, afficheScale, afficheOffsetY]);

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

    const startVideoRecording = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setIsVideoRecording(true);
        recordingStartTimeRef.current = Date.now();

        const formats = [
            'video/mp4;codecs=h264',
            'video/mp4',
            'video/quicktime',
            'video/webm;codecs=h264',
            'video/webm;codecs=vp9',
            'video/webm'
        ];

        const mimeType = formats.find(f => MediaRecorder.isTypeSupported(f)) || 'video/webm';

        const fps = 30; // 30 FPS ensures smoother recording on most hardware compared to 60
        const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(fps) : (canvas as any).mozCaptureStream ? (canvas as any).mozCaptureStream(fps) : null;

        if (!canvasStream) {
            setErrorMessage("Votre navigateur ne supporte pas la capture vidéo.");
            setIsVideoRecording(false);
            return;
        }

        let combinedStream = canvasStream;

        if (bgVideo) {
            try {
                // ⚠️ IMPORTANT : démuter AVANT play() pour que le navigateur initialise
                // le décodeur audio. Avec muted=true, certains navigateurs (Chrome notamment)
                // ne décodent pas l'audio → la piste AudioContext est silencieuse.
                bgVideo.muted = false;
                bgVideo.currentTime = 0;
                bgVideo.loop = false;
                await bgVideo.play().catch(e => console.warn("Audio capture play failed", e));

                // Ferme l'ancien AudioContext s'il existe, puis en crée un nouveau propre.
                // On doit recréer à chaque export car createMediaElementSource sur un même
                // élément dans un même AudioContext lance InvalidStateError.
                if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                    await audioCtxRef.current.close();
                }
                audioCtxRef.current = new AudioContext();
                audioSourceNodeRef.current = null;
                audioDestNodeRef.current = null;
                audioSourceVideoRef.current = null;

                const audioCtx = audioCtxRef.current;
                await audioCtx.resume();

                const source = audioCtx.createMediaElementSource(bgVideo);
                const dest = audioCtx.createMediaStreamDestination();
                source.connect(dest);
                audioSourceNodeRef.current = source;
                audioDestNodeRef.current = dest;
                audioSourceVideoRef.current = bgVideo;

                const audioTracks = dest.stream.getAudioTracks();
                if (audioTracks.length > 0) {
                    combinedStream = new MediaStream([
                        ...canvasStream.getTracks(),
                        ...audioTracks
                    ]);
                } else {
                    console.warn('Aucune piste audio disponible pour cet élément vidéo.');
                }
            } catch (e) {
                console.error("Audio capture error:", e);
            }
        }

        const bitrate = isMobile ? 6000000 : 12000000;

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
                setIsVideoRecording(false);
                return;
            }

            const initialBlob = new Blob(chunks, { type: mimeType });
            
            // On PC we always use FFmpeg to ensure .MOV format
            // On mobile, we bypass FFmpeg for performance, but we will force the .mov extension in the UI if possible
            if (isMobile) {
                const url = URL.createObjectURL(initialBlob);
                setIsVideoRecording(false);
                setRecordingProgress(0);
                setReadyVideoBlob(initialBlob);
                setReadyVideoUrl(url);
                setActivePanel(null);
                return;
            }

            // --- FFMPEG CONVERSION START ---
            try {
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
                
                // Optimized MOV export (H.264)
                // Note: True transparency in MOV (ProRes/qtrle) is too heavy for browser WASM memory (hits 2GB limit).
                // We use high-compatibility H.264 (.mov) for all exports.
                await ffmpeg.exec([
                    '-i', 'input.webm',
                    '-c:v', 'libx264',
                    '-preset', 'ultrafast', // Switch back to ultrafast for stability/speed during debug
                    '-crf', '22',
                    '-pix_fmt', 'yuv420p',
                    '-profile:v', 'high',
                    '-level', '4.1',
                    '-tune', 'stillimage',
                    '-c:a', 'aac',
                    '-b:a', '128k',
                    'output.mov'
                ]);

                const data: any = await ffmpeg.readFile('output.mov');
                const movBlob = new Blob([data.buffer], { type: 'video/quicktime' });
                const url = URL.createObjectURL(movBlob);

                setIsConverting(false);
                setReadyVideoBlob(movBlob);
                setReadyVideoUrl(url);
                setActivePanel(null);
            } catch (err) {
                console.error("FFmpeg Error:", err);
                setErrorMessage("Erreur lors de l'optimisation MOV. Essayez de rafraîchir.");
                setIsConverting(false);
                // Fallback to initial webm if conversion fails
                const url = URL.createObjectURL(initialBlob);
                setReadyVideoBlob(initialBlob);
                setReadyVideoUrl(url);
                setActivePanel(null);
            }
        };

        recorder.start(1000);

        let totalDuration = 0;
        if (theme.startsWith('TOP 5')) {
            totalDuration = 5 * (16800 + 1200); // 5 slides + transitions
        } else if (theme === 'TOP 10 FESTIVAL') {
            totalDuration = 4 * (16800 + 1200); // 4 slides (Cover + 3 Grid pages)
        } else {
            // Utilise la durée exacte de la vidéo uploadée.
            // Fallback à 60s si aucune vidéo n'est présente.
            // Plafond à 10 minutes pour éviter les exports trop lourds.
            totalDuration = (bgVideo && !isNaN(bgVideo.duration) && bgVideo.duration > 0) ? bgVideo.duration * 1000 : 60000;
            if (totalDuration > 600000) totalDuration = 600000; // Limit to 10 minutes
        }

        const startTime = Date.now();
        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / totalDuration) * 100, 99);
            setRecordingProgress(progress);
            setRecordingTimeLeft(Math.max(0, Math.ceil((totalDuration - elapsed) / 1000)));
        }, 100);

        if (theme.startsWith('TOP 5')) {
            for (let i = 0; i < 5; i++) {
                if (i > 0) {
                    const durationTransition = 1200;
                    const startT = Date.now();
                    let switched = false;
                    while (Date.now() - startT < durationTransition) {
                        const progress = (Date.now() - startT) / durationTransition;
                        setTransitionProgress(progress);
                        if (progress > 0.5 && !switched) {
                            setCurrentPreviewIndex(i);
                            switched = true;
                        }
                        await new Promise(r => requestAnimationFrame(r));
                    }
                } else {
                    setCurrentPreviewIndex(i);
                }
                setTransitionProgress(0);
                await new Promise(r => setTimeout(r, 16800));
            }
        } else if (theme === 'TOP 10 FESTIVAL') {
            for (let i = 0; i < 11; i++) {
                if (i > 0) {
                    const durationTransition = 1200;
                    const startT = Date.now();
                    let switched = false;
                    while (Date.now() - startT < durationTransition) {
                        const progress = (Date.now() - startT) / durationTransition;
                        setTransitionProgress(progress);
                        if (progress > 0.5 && !switched) {
                            setCurrentPreviewIndex(i);
                            switched = true;
                        }
                        await new Promise(r => requestAnimationFrame(r));
                    }
                    setTransitionProgress(0);
                } else {
                    setCurrentPreviewIndex(i);
                }
                await new Promise(r => setTimeout(r, 16800));
            }
        } else {
            await new Promise(r => setTimeout(r, totalDuration));
        }

        clearInterval(progressInterval);
        setRecordingProgress(100);
        setRecordingTimeLeft(0);
        setTransitionProgress(0);
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
        if (newTheme === 'MAP') {
            setActiveTab('REEL');
        }
        setTheme(newTheme);
        if (newTheme === 'JEU') {
            setCustomText('DE QUEL CLIP CETTE IMAGE EST TIRÉE ?');
        } else if (newTheme === 'JEU_FESTIVAL') {
            setCustomText('DANS QUEL FESTIVAL PEUT-ON VOIR CETTE STAGE ?');
        }
        setTextColor(LIGHT_TEXT_THEMES.includes(newTheme) ? '#000000' : '#ffffff');
    };

    const bgPositionControls = (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    🎯 Centrage Image (X / Y)
                </span>
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
                    <RotateCcw className="w-3 h-3" /> Centrer Image
                </button>
            </div>

            <div className="space-y-2 pt-1">
                {/* Menu Panel Transparency Control */}
                <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/10">
                    <div className="flex justify-between text-[8px] font-black uppercase text-gray-400">
                        <span>👁️ Opacité du Menu Option</span>
                        <span className="text-neon-cyan font-mono">{menuOpacity}%</span>
                    </div>
                    <input
                        type="range" min="10" max="100" value={menuOpacity}
                        onChange={e => setMenuOpacity(parseInt(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                    />
                </div>

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
            <button onClick={() => handleSetTheme('AFFICHE')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'AFFICHE' ? 'bg-neon-red/20 border-neon-red text-neon-red shadow-[0_0_12px_rgba(255,0,51,0.35)]' : 'bg-white/5 border-white/10 text-gray-400'}`}>AFFICHE</button>
            <button onClick={() => handleSetTheme('EVENTS')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'EVENTS' ? 'bg-[#ff007f]/20 border-[#ff007f] text-[#ff007f] shadow-[0_0_12px_rgba(255,0,127,0.35)]' : 'bg-white/5 border-white/10 text-gray-400'}`}>EVENTS</button>
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
                    <button onClick={() => handleSetTheme('TRACKLIST')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'TRACKLIST' ? 'bg-orange-500/20 border-orange-500 text-orange-500' : 'bg-white/5 border-white/5 text-gray-400'}`}>TRACKLIST</button>
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
                    <Sparkles className="w-3.5 h-3.5" /> Exporter le Carrousel Complet (Slide 1 + 2)
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
                                <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Année</label>
                                <input
                                    value={agendaCoverYear}
                                    onChange={e => setAgendaCoverYear(e.target.value)}
                                    placeholder="ex: 2026"
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

    const promoEditor = (
        <div className="space-y-4">
            {/* 1. Sélecteur de catégorie & couleur pour la page Promo */}
            <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-3.5">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        🎨 Thème & Couleur Promo
                    </label>
                    <span 
                        className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
                        style={{ 
                            backgroundColor: `${(baseThemeData[promoCategory as ThemeType] || baseThemeData['NEWS']).color}20`, 
                            color: (baseThemeData[promoCategory as ThemeType] || baseThemeData['NEWS']).color,
                            border: `1px solid ${(baseThemeData[promoCategory as ThemeType] || baseThemeData['NEWS']).color}60` 
                        }}
                    >
                        {promoCategory}
                    </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[
                        { id: 'NEWS', label: 'NEWS', color: '#ff0033' },
                        { id: 'RECAP', label: 'RÉCAP', color: '#c026d3' },
                        { id: 'MUSIQUE', label: 'MUSIQUE', color: '#39ff14' },
                        { id: 'FOCUS', label: 'FOCUS', color: '#ffaa00' },
                        { id: 'EVENTS', label: 'EVENTS', color: '#ff007f' },
                        { id: 'INTERVIEW', label: 'INTERVIEW', color: '#ffffff' },
                        { id: 'CONCOURS', label: 'CONCOURS', color: '#008cff' },
                    ].map(cat => {
                        const isSelected = (promoCategory || 'NEWS') === cat.id;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                    setPromoCategory(cat.id);
                                    setTimeout(() => generateImage(), 50);
                                }}
                                className={`py-2 px-2.5 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1.5 border transition-all ${
                                    isSelected 
                                        ? 'bg-white/15 text-white shadow-md' 
                                        : 'bg-black/30 border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                                style={isSelected ? { borderColor: cat.color, color: cat.color, boxShadow: `0 0 12px ${cat.color}40` } : {}}
                            >
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                                <span className="truncate">{cat.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-neon-red" /> Question / Débat de l'article
                    </label>
                    <span className="text-[9px] text-gray-500 font-bold">{customText.length}/200</span>
                </div>
                <textarea
                    value={customText}
                    onChange={e => setCustomText(e.target.value.slice(0, 200))}
                    placeholder="Ex: Que penses-tu du nouveau titre de l'artiste ?"
                    spellCheck="true"
                    autoCorrect="on"
                    className="w-full h-20 bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs font-bold resize-none focus:border-neon-red outline-none transition-all uppercase"
                />
            </div>

            <div>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Suggestions rapides en 1 clic :</p>
                <div className="flex flex-wrap gap-1.5">
                    {[
                        "Et toi, qu'en penses-tu ?",
                        "Validé ou surcoté ?",
                        "Tu y seras cet été ?",
                        "Dans ta playlist ou poubelle ?",
                        "Tu valides ce retour ?",
                        "Quelle est ta collab de rêve ?"
                    ].map((sug, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setCustomText(sug)}
                            className="px-2.5 py-1.5 bg-white/5 hover:bg-neon-red/20 border border-white/10 hover:border-neon-red text-gray-300 hover:text-white rounded-lg text-[9px] font-bold transition-all"
                        >
                            {sug}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <p className="text-[9px] font-black text-neon-cyan uppercase tracking-widest">Aperçu Outro & Bulles (Automatique) :</p>
                <p className="text-[10px] text-gray-300 font-bold leading-relaxed">
                    « Pour être informé de toutes les news sur la musique électronique et les festivals, abonnez-vous à DROPSIDERS »
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                    {['NEWS', 'MUSIQUE', 'FOCUS', 'RECAPS', 'CONCOURS', 'EVENTS', 'INTERVIEWS', 'VIDEOS'].map((tag, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white/10 border border-white/15 rounded-full text-[8px] font-black text-white/90">
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
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Ligne 1 : Artiste</label>
                <input 
                    value={customText.split('\n')[0] || ''} 
                    onChange={e => {
                        const lines = customText.split('\n');
                        lines[0] = e.target.value;
                        setCustomText(lines.join('\n'));
                    }} 
                    placeholder="EX: ODD MOB" 
                    className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white font-black italic uppercase text-sm focus:border-neon-red outline-none transition-all shadow-xl" 
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Ligne 2 : Festival</label>
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
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Ligne 3 : Ville, Pays, Année</label>
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
            <p className="text-[9px] text-white/30 italic px-1 pt-1">
                Design automatisé : L1 en rouge, L2 en blanc gras, L3 en blanc Orbitron.
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
                            onChange={e => setCustomText(e.target.value)}
                            placeholder="LES 10 ARTISTES À NE PAS LOUPER"
                            className="w-full h-24 bg-white/10 border border-white/20 rounded-xl p-3 text-white font-black italic uppercase text-xs"
                        />
                        <span className="text-[8px] text-gray-400 block px-1">Astuce : entoure un mot de *étoiles* pour le colorer en néon rouge (ex: LES *10 ARTISTES* À NE PAS LOUPER)</span>
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

    const conseilsEditor = (
        <div className="space-y-4">
            <div 
                className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl cursor-pointer group hover:border-white/20 transition-all" 
                onClick={() => setIsConseilsLargeTitle(!isConseilsLargeTitle)}
            >
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-neon-cyan transition-colors">Titre Extra Large (Pleine Largeur)</span>
                    <span className="text-[8px] font-bold text-gray-500">Grossit le titre pour occuper toute la largeur de la ligne</span>
                </div>
                <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center flex-shrink-0 ${isConseilsLargeTitle ? 'bg-neon-cyan border-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.4)]' : 'bg-black/40 border-white/20 group-hover:border-white/40'}`}>
                    {isConseilsLargeTitle && (
                        <motion.svg initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-3 h-3 text-black font-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </motion.svg>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Titre des Reels (Grand texte blanc)</label>
                <textarea 
                    rows={2}
                    value={conseilsTitle} 
                    onChange={e => setConseilsTitle(e.target.value)} 
                    placeholder="EX: BLACK ROCK CITY CENTERS AROUND &quot;THE MAN&quot;" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold uppercase focus:border-white/40 outline-none transition-all shadow-md resize-none" 
                />
            </div>
            <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Texte en dessous du titre (italique)</label>
                <textarea 
                    rows={3}
                    value={conseilsSubtext} 
                    onChange={e => setConseilsSubtext(e.target.value)} 
                    placeholder="EX: Le département des travaux publics, une équipe de bénévoles, conçoit et construit Black Rock City." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white italic focus:border-white/40 outline-none transition-all shadow-md resize-none" 
                />
            </div>
            <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Logo / Icône du Badge Central (Optionnel)</label>
                <div className="relative group/logo">
                    {artistLogo && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setArtistLogo(''); artistLogoRef.current = null; }}
                            className="absolute top-2 right-2 z-10 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full transition-all opacity-100"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                    <input type="file" onChange={handleArtistLogoChange} className="hidden" id="conseils-img-up" accept="image/*" />
                    <button onClick={() => document.getElementById('conseils-img-up')?.click()} className="w-full aspect-video bg-white/5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all group overflow-hidden relative">
                        {artistLogo ? (
                            <img 
                                src={artistLogo} 
                                alt="Logo Badge" 
                                className="w-full h-full object-contain p-4 transition-all" 
                            />
                        ) : (
                            <>
                                <ImageIcon className="w-8 h-8 text-white/20 group-hover:text-neon-cyan transition-colors" />
                                <span className="text-[10px] font-black text-white/50 uppercase group-hover:text-white transition-colors">Personaliser le Logo du Badge</span>
                            </>
                        )}
                    </button>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => {
                        setR2TargetType('logo');
                        setIsR2ModalOpen(true);
                    }} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4 text-neon-cyan" /> {artistLogo ? 'Modifier Image Cloud' : 'Importer Cloud'}
                    </button>
                </div>
            </div>
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
        <div className="space-y-2">
            <button onClick={addVisualToList} className="w-full py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-white/10 transition-all"><PlusCircle className="w-3.5 h-3.5" /> Ajouter à la liste</button>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => downloadFormat('PUBLICATION')} disabled={isDownloading} className="py-2.5 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-neon-cyan/20 transition-all">
                    <Download className="w-3.5 h-3.5" /> PNG POST
                </button>
                <button onClick={() => downloadFormat('REEL')} disabled={isDownloading} className="py-2.5 bg-neon-purple/10 border border-neon-purple/30 text-neon-purple rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-neon-purple/20 transition-all">
                    <Download className="w-3.5 h-3.5" /> PNG STORY
                </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                <button
                    onClick={() => downloadPromoFormat('PUBLICATION')}
                    disabled={isDownloading}
                    className="py-2.5 bg-neon-red/10 border border-neon-red/30 text-neon-red rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-neon-red hover:text-white transition-all disabled:opacity-40"
                >
                    <Download className="w-3.5 h-3.5" /> PROMO POST
                </button>
                <button
                    onClick={() => downloadPromoFormat('REEL')}
                    disabled={isDownloading}
                    className="py-2.5 bg-neon-red/10 border border-neon-red/30 text-neon-red rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-neon-red hover:text-white transition-all disabled:opacity-40"
                >
                    <Download className="w-3.5 h-3.5" /> PROMO STORY
                </button>
            </div>
            <button onClick={startVideoRecording} disabled={isVideoRecording}
                className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${isVideoRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-neon-red/10 border border-neon-red/30 text-neon-red hover:bg-neon-red/20'}`}>
                <Video className="w-4 h-4" /> {isVideoRecording ? 'CAPTURE EN COURS...' : `Générer Vidéo (${theme})`}
            </button>
        </div>
    );

    const afficheEditor = (
        <div className="space-y-4">
            {/* 1. AFFICHE DE L'ÉVÉNEMENT (CARTE FLOTTANTE) */}
            <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-neon-red uppercase tracking-widest flex items-center gap-1.5">
                        🖼️ Affiche de l'Événement
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
                    <div className="relative group rounded-xl overflow-hidden border border-white/20 bg-black/40 aspect-[4/5] max-h-48 mx-auto flex items-center justify-center">
                        <img src={afficheImage} alt="Affiche Event" className="w-full h-full object-contain" />
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
                        className="w-full py-6 border-2 border-dashed border-white/15 hover:border-neon-red/50 rounded-2xl flex flex-col items-center justify-center gap-2 bg-black/20 hover:bg-neon-red/5 transition-all group"
                    >
                        <Upload className="w-6 h-6 text-gray-500 group-hover:text-neon-red transition-colors" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider group-hover:text-white transition-colors">
                            Importer l'affiche (Photo / Poster)
                        </span>
                        <span className="text-[8px] text-gray-500">PNG, JPG, WEBP</span>
                    </button>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                        type="button"
                        onClick={() => afficheFileInputRef.current?.click()}
                        className="py-2.5 bg-white/5 border border-white/10 hover:border-white/25 rounded-xl text-[9px] font-black uppercase text-white flex items-center justify-center gap-1.5 transition-all"
                    >
                        <Upload className="w-3.5 h-3.5 text-neon-red" /> Fichier Local
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
                        placeholder="OU COLLER LE LIEN D'UNE AFFICHE..."
                        value={afficheImage.startsWith('blob:') ? '' : afficheImage}
                        onChange={e => {
                            setAfficheImage(e.target.value);
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-[9px] font-medium placeholder-gray-500 outline-none focus:border-neon-red/50 transition-all"
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

                {/* Contrôles de taille et position (évite de passer sous le logo Dropsiders) */}
                <div className="space-y-2.5 pt-2 border-t border-white/5">
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase text-gray-400">
                            <span>Taille de l'affiche</span>
                            <span className="text-neon-red font-mono">{afficheScale}%</span>
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
                            className="w-full accent-neon-red bg-white/10 rounded-lg h-1.5 cursor-pointer"
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
                                        className="text-[8px] text-neon-red hover:underline cursor-pointer uppercase font-bold"
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
                            className="w-full accent-neon-red bg-white/10 rounded-lg h-1.5 cursor-pointer"
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
                        className={`px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all ${afficheGlow ? 'bg-neon-red/20 text-neon-red border border-neon-red/40' : 'bg-white/5 text-gray-500 border border-white/10'}`}
                    >
                        {afficheGlow ? 'ACTIVE' : 'DÉSACTIVÉE'}
                    </button>
                </div>
            </div>

            {/* 2. IMAGE DE FOND (SCÈNE / FESTIVAL / WAREHOUSE) */}
            <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        🎆 Image de Fond (Ambiance)
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
                        <Upload className="w-3.5 h-3.5 text-neon-red" /> Importer Fond
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
            </div>

            {/* 3. SWIPE DROPSIDERS >> */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div>
                    <span className="text-[9px] font-black text-white uppercase block">Swipe Studio ({'>>'})</span>
                    <span className="text-[8px] text-gray-500 font-medium">Afficher la mention swipe en bas à droite</span>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setShowSwipe(!showSwipe);
                        setTimeout(() => generateImage(), 50);
                    }}
                    className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase transition-all ${showSwipe ? 'bg-neon-red/20 text-neon-red border border-neon-red/40' : 'bg-white/5 text-gray-500 border border-white/10'}`}
                >
                    {showSwipe ? 'ACTIF' : 'MASQUÉ'}
                </button>
            </div>

            {exportButtons}
        </div>
    );

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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl">

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
                            <button onClick={() => setActiveTab('PUBLICATION')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'PUBLICATION' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}><ImageIcon className="w-3.5 h-3.5" /> POST</button>
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
                                <button
                                    onClick={() => bgVideo.play().catch(() => { })}
                                    className="w-full py-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded-xl text-[9px] font-black text-neon-cyan uppercase hover:bg-neon-cyan/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Video className="w-3.5 h-3.5" /> Relancer la prévisualisation
                                </button>
                            )}
                            {!(bgImage || bgVideo) && (
                                <button 
                                    onClick={() => setIsTransparent(!isTransparent)} 
                                    className={`w-full py-2.5 border rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase transition-all ${isTransparent ? 'bg-white/20 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                                >
                                    <Sparkles className={`w-3.5 h-3.5 ${isTransparent ? 'text-white' : 'text-gray-500'}`} />
                                    FOND TRANSPARENT : {isTransparent ? 'OUI (PNG)' : 'NON'}
                                </button>
                            )}
                        </div>

                        {/* Content editor */}
                        <div className="space-y-4">
                            {theme === 'CALENDRIER' ? (
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
                            ) : theme === 'INTERVIEW' ? (
                                <><span className="text-[10px] font-black text-gray-500 uppercase">Infos Interview & Logo</span>{interviewEditor}</>
                            ) : theme === 'SPOTLIGHT' ? (
                                <><span className="text-[10px] font-black text-gray-500 uppercase">Infos Spotlight & Logos</span>{spotlightEditor}</>
                            ) : theme === 'CONSEILS' || theme === 'REELS' ? (
                                <><span className="text-[10px] font-black text-gray-500 uppercase">Contenu Reels & Image</span>{conseilsEditor}</>
                            ) : theme === 'CONCOURS' ? (
                                <><span className="text-[10px] font-black text-[#c084fc] uppercase">Paramètres Jeu Concours</span>{concoursEditor}</>
                            ) : theme === 'CITATION' ? (
                                <><span className="text-[10px] font-black text-gray-500 uppercase">Citation & Auteur</span>{citationEditor}</>
                            ) : theme === 'ARTISTE FESTIVAL' ? (
                                <><span className="text-[10px] font-black text-neon-red uppercase">Artiste Festival (Carrousel)</span>{artisteFestivalEditor}</>
                            ) : theme === 'AFFICHE' ? (
                                <><span className="text-[10px] font-black text-neon-red uppercase">Affiche Événement</span>{afficheEditor}</>
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
                        <div className="space-y-4 mt-auto pb-8">
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
                            <div className="mb-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 shadow-2xl z-20">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider mr-1">Carrousel Insta :</span>
                                <button
                                    type="button"
                                    onClick={() => setAgendaSlide(1)}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                                        agendaSlide === 1
                                            ? 'bg-[#ff3700] text-black shadow-[0_0_12px_rgba(255,55,0,0.5)]'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    🎴 Slide 1 (Cover)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAgendaSlide(2)}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                                        agendaSlide === 2
                                            ? 'bg-[#ff3700] text-black shadow-[0_0_12px_rgba(255,55,0,0.5)]'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    📋 Slide 2 (Événements)
                                </button>
                            </div>
                        )}
                        {theme === 'ARTISTE FESTIVAL' && (
                            <div className="mb-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 shadow-2xl z-20">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider mr-1">Carrousel Insta :</span>
                                <button
                                    type="button"
                                    onClick={() => setArtisteFestivalSlide(1)}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                                        artisteFestivalSlide === 1
                                            ? 'bg-neon-red text-white shadow-[0_0_12px_rgba(255,0,51,0.5)]'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    🎪 Slide 1 (Cover)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setArtisteFestivalSlide(2)}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                                        artisteFestivalSlide === 2
                                            ? 'bg-neon-red text-white shadow-[0_0_12px_rgba(255,0,51,0.5)]'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    ⭐ Slide 2 (Spotlight)
                                </button>
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
                            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-2xl border border-white/10 shadow-2xl">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setAgendaSlide(1); }}
                                    className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase transition-all ${
                                        agendaSlide === 1 ? 'bg-[#ff3700] text-black shadow-md' : 'text-gray-400'
                                    }`}
                                >
                                    Slide 1 (Cover)
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setAgendaSlide(2); }}
                                    className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase transition-all ${
                                        agendaSlide === 2 ? 'bg-[#ff3700] text-black shadow-md' : 'text-gray-400'
                                    }`}
                                >
                                    Slide 2 (Events)
                                </button>
                            </div>
                        )}
                        {theme === 'ARTISTE FESTIVAL' && (
                            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-2xl border border-white/10 shadow-2xl">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setArtisteFestivalSlide(1); }}
                                    className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase transition-all ${
                                        artisteFestivalSlide === 1 ? 'bg-neon-red text-white shadow-md' : 'text-gray-400'
                                    }`}
                                >
                                    Slide 1 (Cover)
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setArtisteFestivalSlide(2); }}
                                    className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase transition-all ${
                                        artisteFestivalSlide === 2 ? 'bg-neon-red text-white shadow-md' : 'text-gray-400'
                                    }`}
                                >
                                    Slide 2 (Spotlight)
                                </button>
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
                                    <div className="px-6 pb-8">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Contenu</p>
                                        {theme === 'CALENDRIER' ? (
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
                                        ) : theme === 'PLANNING' ? planningEditor : theme.startsWith('TOP 5') ? top5Editor : theme === 'TRACKLIST' ? tracklistEditor : theme === 'INTERVIEW' ? interviewEditor : theme === 'SPOTLIGHT' ? spotlightEditor : theme === 'CONSEILS' || theme === 'REELS' ? conseilsEditor : theme === 'CONCOURS' ? concoursEditor : theme === 'CITATION' ? citationEditor : theme === 'MAP' ? mapEditor : theme === 'ARTISTE FESTIVAL' ? artisteFestivalEditor : theme === 'AFFICHE' ? afficheEditor : theme === 'PROMO' ? promoEditor : textEditor}
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
                                            {!(bgImage || bgVideo) && (
                                                <button 
                                                    onClick={() => setIsTransparent(!isTransparent)} 
                                                    className={`w-full py-4 border rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all ${isTransparent ? 'bg-white/20 border-white text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                                                >
                                                    <Sparkles className="w-4 h-4" /> FOND TRANSPARENT (PNG) : {isTransparent ? 'OUI' : 'NON'}
                                                </button>
                                            )}
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
                filename={`dropsiders-${theme.replace(/ /g, '-')}.${readyVideoBlob?.type.includes('mp4') ? 'mp4' : 'webm'}`}
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

