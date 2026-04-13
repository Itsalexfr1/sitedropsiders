import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
    X, Download, Upload, PlusCircle, Plus, Eraser,
    Video, Layout, Smartphone, Image as ImageIcon,
    Home, Link as LinkIcon, Palette, Type, Film,
    Check, Layers, Sparkles, Wand2, RotateCcw
} from 'lucide-react';
import { fixEncoding } from '../utils/standardizer';
import { Downloader } from '../pages/Downloader';
import recapsData from '../data/recaps.json';

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
}

type TabType = 'REEL' | 'PUBLICATION';
type ThemeType = 'TOP 5 ARTISTE' | 'TOP 5 STYLES' | 'INTRO' | 'NEWS' | 'FOCUS' | 'MUSIQUE' | 'RECAP' | 'LIVESTREAM' | 'HIGHLIGHTS' | 'PLANNING' | 'TRACKLIST';

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

export function SocialSuite({ title, imageUrl, onClose }: SocialSuiteProps) {
    const [activeTab, setActiveTab] = useState<TabType>('PUBLICATION');
    const [theme, setTheme] = useState<ThemeType>('NEWS');
    const [showSwipe, setShowSwipe] = useState(false);
    const [showArticleLink, setShowArticleLink] = useState(false);
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
    // InShot-style: active bottom panel and format modal
    const [activePanel, setActivePanel] = useState<string | null>(null);
    const [showFormatModal, setShowFormatModal] = useState(true);
    const [readyVideoBlob, setReadyVideoBlob] = useState<Blob | null>(null);
    const [readyVideoUrl, setReadyVideoUrl] = useState<string>('');
    const [recordingProgress, setRecordingProgress] = useState(0);
    const [recordingTimeLeft, setRecordingTimeLeft] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showText, setShowText] = useState(true);
    const [planningItems, setPlanningItems] = useState<{ time: string; artist: string }[]>(Array.from({ length: 8 }, () => ({ time: '00:00', artist: 'ARTISTE' })));
    const [planningDate, setPlanningDate] = useState('21 MARS - 28 MARS');
    const [highlightsFestival, setHighlightsFestival] = useState('');
    const [highlightsArtists, setHighlightsArtists] = useState('');
    const [isRetouchMode, setIsRetouchMode] = useState(false);
    const [retouchPath, setRetouchPath] = useState<{ x: number, y: number }[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(35);
    const [planningTimezoneOffset, setPlanningTimezoneOffset] = useState<number>(0);

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
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const [selection, setSelection] = useState({ start: 0, end: 0 });
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
        const start = selection.start;
        const end = selection.end;

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
        'NEWS': { label: 'NEWS', grad: '255, 0, 51', color: '#ff0033' },
        'FOCUS': { label: 'FOCUS', grad: '255, 170, 0', color: '#ffaa00' },
        'HIGHLIGHTS': { label: 'HIGHLIGHTS', grad: '0, 112, 255', color: '#0070ff' },
        'MUSIQUE': { label: 'MUSIQUE', grad: '57, 255, 20', color: '#39ff14' },
        'RECAP': { label: 'RÉCAP', grad: '189, 0, 255', color: '#bd00ff' },
        'INTRO': { label: 'INTRO', grad: '0, 50, 255', color: '#0032ff' },
        'LIVESTREAM': { label: 'DIRECT', grad: '255, 18, 65', color: '#ff1241' },
        'PLANNING': { label: 'PLANNING', grad: '255, 18, 65', color: '#ff1241' },
        'TRACKLIST': { label: 'TRACKLIST', grad: '255, 120, 0', color: '#ff7800' }
    };

    useEffect(() => {
        if (activeTab === 'REEL') setTheme('TOP 5 ARTISTE');
        else setTheme('NEWS');
        setThemeColor(null);
    }, [activeTab]);

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

    const generateImage = async (targetTab?: TabType) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const effectiveTab = targetTab || activeTab;

        try {
            let img: HTMLImageElement | null = null;
            if (bgImage) {
                img = new Image();
                img.crossOrigin = "anonymous";
                img.src = bgImage;
                await new Promise((res, rej) => { img!.onload = res; img!.onerror = rej; });
            }

            canvas.width = 1080;
            canvas.height = effectiveTab === 'REEL' ? 1920 : 1350;
            const safeSize = effectiveTab === 'PUBLICATION' ? 1050 : 1080;
            const safeTop = (canvas.height - safeSize) / 2;
            const safeBottom = safeTop + safeSize;

            if (bgVideo) {
                const scale = Math.max(canvas.width / bgVideo.videoWidth, canvas.height / bgVideo.videoHeight);
                const x = (canvas.width - bgVideo.videoWidth * scale) / 2;
                const y = (canvas.height - bgVideo.videoHeight * scale) / 2;
                ctx.drawImage(bgVideo, x, y, bgVideo.videoWidth * scale, bgVideo.videoHeight * scale);
            } else if (img) {
                const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                const x = (canvas.width - img.width * scale) / 2;
                const y = (canvas.height - img.height * scale) / 2;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            } else {
                ctx.fillStyle = '#111';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            if (theme === 'PLANNING') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            if (!showText) return; 

            const activeData = activeColor;
            // Shrunk gradient for Top 5 (Request 6), restored for others
            const gradStart = (theme === 'TOP 5 ARTISTE' || theme === 'TOP 5 STYLES')
                ? canvas.height * 0.8
                : canvas.height * 0.4; // Remonté de 0.5 à 0.4 pour couvrir le texte plus haut

            const grad = ctx.createLinearGradient(0, gradStart, 0, canvas.height);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(0.3, 'rgba(0,0,0,0.2)');
            grad.addColorStop(0.8, `rgba(${activeData.grad}, 0.7)`);
            grad.addColorStop(1, `rgba(${activeData.grad}, 1)`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, gradStart, canvas.width, canvas.height - gradStart);

            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for (let i = 0; i < canvas.height; i += 6) ctx.fillRect(0, i, canvas.width, 2);

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

            // HELPER: Draw Tape/Label
            const drawTapeLabel = (text: string, x: number, y: number, w: number, h: number, color: string, gradStr: string) => {
                ctx.save();
                ctx.translate(x, y);
                ctx.shadowColor = `rgba(${gradStr}, 0.5)`;
                ctx.shadowBlur = 30;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(-w / 2 - 20, -h / 2 + 10);
                ctx.lineTo(w / 2 + 20, -h / 2 - 10);
                ctx.lineTo(w / 2 + 40, h / 2 + 5);
                ctx.lineTo(-w / 2 - 30, h / 2 - 5);
                ctx.closePath();
                ctx.fill();

                const plasticGrad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
                plasticGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
                plasticGrad.addColorStop(0.5, 'rgba(0,0,0,0.1)');
                plasticGrad.addColorStop(1, 'rgba(255,255,255,0.05)');
                ctx.fillStyle = plasticGrad;
                ctx.fill();

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = `900 italic 67px "Montserrat", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif`;
                const textGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
                textGrad.addColorStop(0, '#ffffff');
                textGrad.addColorStop(0.4, '#e0e0e0');
                textGrad.addColorStop(0.5, '#a0a0a0');
                textGrad.addColorStop(0.6, '#e0e0e0');
                textGrad.addColorStop(1, '#ffffff');
                ctx.fillStyle = textGrad;
                ctx.shadowColor = 'rgba(0,0,0,0.3)';
                ctx.shadowBlur = 10;
                ctx.fillText(text, 0, 5);
                ctx.restore();
            };

            if (theme === 'INTRO') {
                drawTapeLabel(customText || 'INTRO', canvas.width / 2, canvas.height / 2, 900, 260, activeData.color, activeData.grad);

            } else if (theme === 'TOP 5 STYLES') {
                const item = top5Items[currentPreviewIndex];
                const centerX = canvas.width / 2;
                const centerY = safeTop + 620; // Descendu de 80px supplémentaires
                const radius = 240; // Encore plus réduit (était 280)
                const currentItem = top5Items[currentPreviewIndex];
                let itemPhotoImg: HTMLImageElement | null = null;
                if (currentItem.photo) {
                    itemPhotoImg = new Image();
                    itemPhotoImg.src = currentItem.photo;
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
                        const scale = Math.max((radius * 2) / targetImg.width, (radius * 2) / targetImg.height);
                        ctx.drawImage(targetImg, -(targetImg.width * scale) / 2, -(targetImg.height * scale) / 2, targetImg.width * scale, targetImg.height * scale);
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
                const itemX = 100 + slideX;

                if (item.photo) {
                    const photoImg = new Image();
                    photoImg.src = item.photo;
                    if (photoImg.complete || photoImg.width > 0) {
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
                const barWidth = 880; const barHeight = 90; const barX = 90; const barY = baseY + 45;
                ctx.fillStyle = `rgba(${activeData.grad}, 0.4)`;
                ctx.fillRect(barX - 10 + slideX, barY - 10, barWidth + 20, barHeight + 20);
                ctx.fillStyle = activeData.color;
                ctx.fillRect(barX + slideX, barY, barWidth, barHeight);
                ctx.fillStyle = '#000'; // Black text on yellow bar
                ctx.font = '900 italic 43px "Montserrat", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
                ctx.fillText(`${item.value.toUpperCase()} MILLIONS D'ÉCOUTES`, barX + 30 + slideX, barY + 60);
                ctx.textAlign = 'right';
                ctx.font = '900 italic 117px "Montserrat", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillText(`#${5 - currentPreviewIndex}`, canvas.width - 100 + slideX, canvas.height - 120); // Descendu dans le dégradé

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
                const topY = effectiveTab === 'PUBLICATION' ? 340 : 660;

                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 20;
                
                // Title "LINE-UP" - Utilisation d'Orbitron (Police du site)
                ctx.textAlign = 'center';
                ctx.fillStyle = '#ffffff';
                ctx.font = '900 75px "Orbitron", sans-serif';
                ctx.letterSpacing = "12px";
                ctx.fillText((customText || 'LINE-UP').toUpperCase(), centerX, topY + 40);

                // Date below title - Utilisation de Montserrat (Police du site)
                ctx.fillStyle = `rgb(${activeData.grad})`;
                ctx.font = '900 30px "Montserrat", sans-serif';
                ctx.letterSpacing = "6px";
                ctx.fillText(planningDate.toUpperCase(), centerX, topY + 95);

                // Elegant divider
                const lineW = 200;
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillRect(centerX - lineW, topY + 120, lineW * 2, 2);
                ctx.restore();

                // List items (compact block)
                const startY = topY + (effectiveTab === 'PUBLICATION' ? 190 : 230);
                const spacing = effectiveTab === 'PUBLICATION' ? 58 : 78;
                planningItems.forEach((item, i) => {
                    const y = startY + (i * spacing);
                    if (y > canvas.height - 120) return;

                    ctx.save();
                    ctx.shadowColor = 'rgba(0,0,0,0.8)';
                    ctx.shadowBlur = 10;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;

                    // Hour (Premium Bold) - Montserrat avec alignement tabulaire manuel
                    ctx.textAlign = 'right';
                    ctx.fillStyle = `rgb(${activeData.grad})`;
                    ctx.font = '900 42px "Montserrat", sans-serif';
                    ctx.letterSpacing = "0px";
                    
                    let timeText = item.time.toUpperCase().trim();
                    if (timeText.length === 4 && /^\d+$/.test(timeText)) {
                        timeText = timeText.slice(0, 2) + 'H' + timeText.slice(2);
                    } else if (timeText.includes(':')) {
                        timeText = timeText.replace(':', 'H');
                    }

                    // Dessin caractère par caractère pour forcer la même dimension horizontale
                    const charWidth = 28; 
                    const startX = centerX - 200; // La limite gauche que tu as fixée

                    ctx.textAlign = 'center';
                    for (let charIdx = 0; charIdx < timeText.length; charIdx++) {
                        const char = timeText[timeText.length - 1 - charIdx];
                        // On part de la droite (startX) et on recule
                        ctx.fillText(char, startX - (charIdx * charWidth) - (charWidth/2), y);
                    }

                    // Artist (Premium Modern) - Utilisation de Montserrat
                    ctx.textAlign = 'left';
                    ctx.fillStyle = '#fff';
                    const artistText = item.artist.toUpperCase();
                    ctx.font = '900 42px "Montserrat", sans-serif';
                    ctx.letterSpacing = "-1px";
                    
                    const maxW = (canvas.width / 2) + 120; 
                    if (ctx.measureText(artistText).width > maxW) {
                        if (artistText.includes(' B2B ')) {
                            const parts = artistText.split(' B2B ');
                            ctx.font = '900 42px "Montserrat", sans-serif';
                            ctx.fillText(parts[0], centerX - 150, y - 22);
                            ctx.font = '900 30px "Montserrat", sans-serif';
                            ctx.fillText('B2B ' + parts[1], centerX - 150, y + 18);
                        } else {
                            let fs = 42;
                            while (ctx.measureText(artistText).width > maxW && fs > 18) {
                                fs--;
                                ctx.font = `900 ${fs}px "Montserrat", sans-serif`;
                            }
                            ctx.fillText(artistText, centerX - 150, y);
                        }
                    } else {
                        ctx.fillText(artistText, centerX - 150, y);
                    }
                    ctx.restore();
                });

                // Display link in the remaining empty space if there is enough room
                if (planningItems.length > 0) {
                    const lastY = startY + ((planningItems.length - 1) * spacing);
                    const remainingSpaceStart = lastY + spacing;
                    const remainingHeight = canvas.height - remainingSpaceStart;
                    
                    if (remainingHeight > 150) { // Only if there's significant space
                        ctx.save();
                        const textY = remainingSpaceStart + (remainingHeight / 2) - 20; // Center vertically in the remaining space
                        
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                        ctx.shadowColor = 'rgba(0,0,0,0.9)';
                        ctx.shadowBlur = 20;

                        ctx.font = '900 italic 28px "Montserrat", sans-serif';
                        ctx.letterSpacing = "6px";
                        ctx.fillText('RENDEZ-VOUS SUR DROPSIDERS.FR/LIVE', centerX, textY);
                        ctx.restore();
                    }
                }

            } else if (theme === 'TRACKLIST') {
                // Sleek Top Gradient for logo readability
                const topGrad = ctx.createLinearGradient(0, 0, 0, 350);
                topGrad.addColorStop(0, 'rgba(0,0,0,0.8)');
                topGrad.addColorStop(0.5, 'rgba(0,0,0,0.4)');
                topGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = topGrad;
                ctx.fillRect(0, 0, canvas.width, 350);
                
                // Draw Dropsiders White Logo (Premium)
                if (logoRef.current) {
                    const logo = logoRef.current;
                    const lw = 350; // Elegant size
                    const lh = (logo.height * lw) / logo.width;
                    
                    ctx.save();
                    ctx.shadowColor = 'rgba(0,0,0,0.6)';
                    ctx.shadowBlur = 15;
                    ctx.drawImage(logo, (canvas.width - lw) / 2, 70);
                    
                    // Add a subtle "TRACK ID" badge underneath
                    ctx.textAlign = 'center';
                    ctx.font = '900 22px "Orbitron", sans-serif';
                    ctx.letterSpacing = "8px";
                    ctx.fillStyle = activeData.color;
                    ctx.fillText('TRACK ID', canvas.width / 2, 70 + lh + 45);
                    ctx.restore();
                }

                if (customText) {
                    const lines = customText.split('\n').filter(l => l.trim() !== '');
                    
                    const texts = [
                        { text: (lines[0] || '').toUpperCase(), font: '900 95px "Montserrat", sans-serif', color: activeData.color },
                        { text: (lines[1] || '').toUpperCase(), font: '900 65px "Montserrat", sans-serif', color: '#ffffff' },
                        { text: (lines[2] || '').toUpperCase(), font: '900 italic 45px "Montserrat", sans-serif', color: 'rgba(255,255,255,0.7)' },
                    ];

                    ctx.save();
                    ctx.textAlign = 'center';
                    
                    let currY = effectiveTab === 'PUBLICATION' ? canvas.height - 180 : safeBottom - 180;
                    currY -= texts.length * 80; 
                    
                    const bgGrad = ctx.createLinearGradient(0, currY - 140, 0, canvas.height);
                    bgGrad.addColorStop(0, 'rgba(0,0,0,0)');
                    bgGrad.addColorStop(0.4, 'rgba(0,0,0,0.7)');
                    bgGrad.addColorStop(1, 'rgba(0,0,0,0.95)');
                    ctx.fillStyle = bgGrad;
                    ctx.fillRect(0, currY - 140, canvas.width, canvas.height - (currY - 140));

                    texts.forEach((item, i) => {
                        ctx.font = item.font;
                        ctx.fillStyle = item.color;
                        ctx.shadowColor = 'rgba(0,0,0,0.9)';
                        ctx.shadowBlur = 15;
                        ctx.shadowOffsetY = 4;
                        
                        let yPos = currY + (i * 85);
                        
                        // Add a sleek line between the artist and festival
                        if (i === 1 && lines[0] && lines[1]) {
                            ctx.save();
                            ctx.fillStyle = activeData.color;
                            ctx.shadowColor = activeData.color;
                            ctx.shadowBlur = 10;
                            ctx.fillRect(canvas.width / 2 - 50, yPos - 55, 100, 4);
                            ctx.restore();
                        }
                        
                        if (i > 0) yPos += 20; 
                        
                        ctx.fillText(item.text, canvas.width / 2, yPos);
                    });
                    
                    ctx.restore();
                }
            } else {
                const fontSize = 55; const lineHeight = fontSize * 1.15;
                ctx.textAlign = 'center';
                
                const textToRender = theme === 'HIGHLIGHTS' 
                    ? `${highlightsFestival}${highlightsFestival && highlightsArtists ? '\n' : ''}${highlightsArtists}`.trim()
                    : customText;
                    
                const paragraphs = textToRender.toUpperCase().split('\n');
                const lines: string[] = [];
                ctx.font = `900 italic ${fontSize}px "Montserrat", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif`;
                const stripTags = (s: string) => s.replace(/\[[CB]:[^\]]+\]|\[\/[CB]\]/gi, '');
                for (const para of paragraphs) {
                    if (para.trim() === '') { lines.push(''); continue; }
                    const words = para.split(' ');
                    let currentLine = '';
                    for (const word of words) {
                        const testLine = currentLine + word + ' ';
                        if (ctx.measureText(stripTags(testLine)).width < canvas.width - 240) currentLine += word + ' ';
                        else { lines.push(currentLine.trim()); currentLine = word + ' '; }
                    }
                    lines.push(currentLine.trim());
                }
                const labelY = effectiveTab === 'PUBLICATION' ? 880 : safeBottom - 450;
                const startY = labelY + 130;
                const labelText = ('label' in activeData) ? (activeData as any).label : theme;
                const labelW = ctx.measureText(labelText).width + 80;

                ctx.save();
                ctx.globalAlpha = 0.9;
                ctx.fillStyle = activeData.color;
                const rectX = (canvas.width - labelW) / 2;
                const rectY = labelY - 52;
                const rectW = labelW;
                const rectH = 80;
                const radius = 20;

                ctx.beginPath();
                ctx.roundRect(rectX, rectY, rectW, rectH, radius);
                ctx.fill();

                ctx.globalAlpha = 1;
                ctx.fillStyle = labelText === 'MUSIQUE' ? '#000' : '#FFF';
                const labelFontSize = 42;
                ctx.font = `900 italic ${labelFontSize}px "Montserrat", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif`;
                ctx.textBaseline = 'middle';
                ctx.fillText(labelText, canvas.width / 2, rectY + (rectH / 2) + 4);
                ctx.restore();
                const parseRichText = (str: string) => {
                    const segments: { text: string; color?: string; bg?: string }[] = [];
                    const regex = /\[([CB]):([^\]]+)\](.*?)\[\/\1\]|([^\[]+|\[(?!([CB]):[^\]]+\]))/gi;
                    let match;
                    while ((match = regex.exec(str)) !== null) {
                        if (match[1]) {
                            const type = match[1];
                            const color = match[2];
                            const content = match[3];
                            segments.push({
                                text: content,
                                color: type === 'C' ? color : undefined,
                                bg: type === 'B' ? color : undefined
                            });
                        } else if (match[4]) {
                            segments.push({ text: match[4] });
                        }
                    }
                    return segments;
                };

                const maxLines = effectiveTab === 'PUBLICATION' ? 8 : 10;
                lines.slice(0, maxLines).forEach((line, i) => {
                    if (line !== '') {
                        const yPos = startY + (i * lineHeight);
                        const segments = parseRichText(line);

                        // Calculate total width for centering
                        let totalWidth = 0;
                        segments.forEach(seg => {
                            totalWidth += ctx.measureText(seg.text).width;
                        });

                        let currentX = (canvas.width - totalWidth) / 2;

                        segments.forEach(seg => {
                            const segWidth = ctx.measureText(seg.text).width;

                            // Draw segment background
                            const effectiveBg = seg.bg || (textBgColor !== 'transparent' ? textBgColor : null);
                            if (effectiveBg) {
                                ctx.save();
                                ctx.globalAlpha = 0.9;
                                ctx.fillStyle = effectiveBg;
                                const px = 12;
                                const rectH = fontSize + 8;
                                const rectW = segWidth + px;
                                const rectX = currentX - px / 2;
                                const rectY = yPos - fontSize + 15;

                                ctx.beginPath();
                                ctx.roundRect(rectX, rectY, rectW, rectH, 12); // Premium rounded corners
                                ctx.fill();
                                ctx.restore();
                            }

                            // Draw segment text
                            ctx.fillStyle = seg.color || textColor;
                            ctx.fillText(seg.text, currentX + segWidth / 2, yPos);

                            currentX += segWidth;
                        });
                    }
                });

                if (lines.length > maxLines) {
                    ctx.fillStyle = textColor;
                    ctx.globalAlpha = 0.3;
                    ctx.font = '900 italic 27px "Montserrat", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
                    ctx.fillText('...', canvas.width / 2, startY + (maxLines * lineHeight) - 20);
                    ctx.globalAlpha = 1;
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
            if (logoRef.current && theme !== 'TRACKLIST') {
                const logo = logoRef.current;
                const w = 320;
                // Move left and down for video backgrounds to avoid cropping and match requested safety margins
                const xOffset = bgVideo ? 140 : 40;
                const yOffset = bgVideo ? 70 : 20;
                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 20;
                ctx.drawImage(logo, canvas.width - w - xOffset, yOffset, w, (logo.height * w) / logo.width);
                ctx.restore();
            }

            if (showSwipe) {
                ctx.save();
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                ctx.font = '900 italic 45px "Montserrat", sans-serif';
                ctx.fillStyle = theme === 'MUSIQUE' ? '#000000' : '#ffffff';
                ctx.shadowColor = theme === 'MUSIQUE' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 10;
                ctx.fillText('>>', canvas.width - 40, canvas.height - 10);
                ctx.restore();
            }

            if (showArticleLink) {
                ctx.save();
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                ctx.font = '900 italic 24px "Montserrat", sans-serif'; // Réduit de 40% (40px -> 24px)
                ctx.fillStyle = theme === 'MUSIQUE' ? '#000000' : '#ffffff';
                ctx.shadowColor = theme === 'MUSIQUE' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 10;
                ctx.fillText('ARTICLE COMPLET SUR DROPSIDERS.FR', 40, canvas.height - 10);
                ctx.restore();
            }

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
    }, [bgImage, bgVideo, customText, theme, showSwipe, showArticleLink, top5Items, currentPreviewIndex, activeTab, rotation, themeColor, isVideoRecording, transitionProgress, showText, planningDate, planningItems, isRetouchMode, retouchPath, highlightsFestival, highlightsArtists]);

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
            video.muted = true;
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

        const formats = [
            'video/mp4;codecs=h264',
            'video/webm;codecs=h264',
            'video/webm;codecs=vp9',
            'video/webm'
        ];

        const mimeType = formats.find(f => MediaRecorder.isTypeSupported(f)) || 'video/webm';

        const fps = isMobile ? 30 : 60;
        const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(fps) : (canvas as any).mozCaptureStream ? (canvas as any).mozCaptureStream(fps) : null;

        if (!canvasStream) {
            setErrorMessage("Votre navigateur ne supporte pas la capture vidéo.");
            setIsVideoRecording(false);
            return;
        }

        let combinedStream = canvasStream;
        const previousMutedState = bgVideo ? bgVideo.muted : true;

        if (bgVideo) {
            try {
                // IMPORTANT: Unmute to capture sound
                bgVideo.muted = false;
                bgVideo.volume = 1.0;
                bgVideo.currentTime = 0;
                bgVideo.loop = false;
                await bgVideo.play().catch(e => console.warn("Audio capture play failed", e));

                // Get audio tracks from video
                const videoStream = (bgVideo as any).captureStream ? (bgVideo as any).captureStream() : (bgVideo as any).mozCaptureStream ? (bgVideo as any).mozCaptureStream() : null;
                if (videoStream && videoStream.getAudioTracks().length > 0) {
                    const audioTrack = videoStream.getAudioTracks()[0];
                    combinedStream = new MediaStream([...canvasStream.getTracks(), audioTrack]);
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

            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);

            setIsVideoRecording(false);
            setRecordingProgress(0);
            setReadyVideoBlob(blob);
            setReadyVideoUrl(url);
            setActivePanel(null); // Close export panel
        };

        recorder.start(1000);

        let totalDuration = 0;
        if (theme === 'INTRO') {
            totalDuration = 10000;
        } else if (theme.startsWith('TOP 5')) {
            totalDuration = 5 * (16800 + 1200); // 5 slides + transitions
        } else {
            totalDuration = (bgVideo && !isNaN(bgVideo.duration) && bgVideo.duration > 0) ? bgVideo.duration * 1000 : 15000;
            if (totalDuration > 60000) totalDuration = 60000;
        }

        const startTime = Date.now();
        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / totalDuration) * 100, 99);
            setRecordingProgress(progress);
            setRecordingTimeLeft(Math.max(0, Math.ceil((totalDuration - elapsed) / 1000)));
        }, 100);

        if (theme === 'INTRO') {
            await new Promise(r => setTimeout(r, 10000));
        } else if (theme.startsWith('TOP 5')) {
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
        } else {
            await new Promise(r => setTimeout(r, totalDuration));
        }

        clearInterval(progressInterval);
        setRecordingProgress(100);
        setRecordingTimeLeft(0);
        setTransitionProgress(0);
        if (bgVideo) {
            bgVideo.muted = previousMutedState;
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
                        alert("Erreur d'exportation. Vérifiez que les images utilisées sont accessibles (pas de blocage CORS).");
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
            alert("Erreur d'exportation inattendue.");
            setTimeout(() => setIsDownloading(false), 1000);
        }
    };
    
    const downloadBoth = async () => {
        if (!canvasRef.current) return;
        setIsDownloading(true);
        try {
            // 1. STORY
            await generateImage('REEL');
            const storyData = canvasRef.current!.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = storyData;
            a.download = `STORY-${theme.toLowerCase().replace(/\s+/g, '-')}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Small delay to ensure browser handles dual download
            await new Promise(r => setTimeout(r, 600));

            // 2. POST
            await generateImage('PUBLICATION');
            const postData = canvasRef.current!.toDataURL('image/png');
            const b = document.createElement('a');
            b.href = postData;
            b.download = `POST-${theme.toLowerCase().replace(/\s+/g, '-')}.png`;
            document.body.appendChild(b);
            b.click();
            document.body.removeChild(b);
        } catch (e) {
            console.error(e);
        } finally {
            setTimeout(() => {
                setIsDownloading(false);
                generateImage();
            }, 1000);
        }
    };

    // Shared content blocks (used in both mobile & desktop)
    const themeButtons = (
        <div className="grid grid-cols-3 gap-1.5">
            {/* All themes accessible in both modes, except TOP 5 which are Story-specific for now */}
            <button onClick={() => setTheme('NEWS')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'NEWS' ? 'bg-neon-red/20 border-neon-red text-neon-red' : 'bg-white/5 border-white/5 text-gray-400'}`}>NEWS</button>
            <button onClick={() => setTheme('FOCUS')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'FOCUS' ? 'bg-[#ffaa00]/20 border-[#ffaa00] text-[#ffaa00]' : 'bg-white/5 border-white/10 text-gray-400'}`}>FOCUS</button>
            <button onClick={() => setTheme('HIGHLIGHTS')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'HIGHLIGHTS' ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'bg-white/5 border-white/10 text-gray-400'}`}>HIGHLIGHTS</button>
            <button onClick={() => setTheme('MUSIQUE')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'MUSIQUE' ? 'bg-neon-green/20 border-neon-green text-neon-green' : 'bg-white/5 border-white/5 text-gray-400'}`}>MUSIQUE</button>
            <button onClick={() => setTheme('RECAP')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'RECAP' ? 'bg-neon-purple/20 border-neon-purple text-neon-purple' : 'bg-white/5 border-white/5 text-gray-400'}`}>RÉCAP</button>
            <button onClick={() => setTheme('LIVESTREAM')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'LIVESTREAM' ? 'bg-pink-500/20 border-pink-500 text-pink-500' : 'bg-white/5 border-white/5 text-gray-400'}`}>DIRECT</button>
            <button onClick={() => setTheme('PLANNING')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'PLANNING' ? 'bg-white/20 border-white text-white' : 'bg-white/5 border-white/5 text-gray-400'}`}>PLANNING</button>
            <button onClick={() => setTheme('TRACKLIST')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'TRACKLIST' ? 'bg-orange-500/20 border-orange-500 text-orange-500' : 'bg-white/5 border-white/5 text-gray-400'}`}>TRACKLIST</button>
            
            {activeTab === 'REEL' && (
                <>
                    <button onClick={() => setTheme('INTRO')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'INTRO' ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'bg-white/5 border-white/5 text-gray-400'}`}>INTRO</button>
                    <button onClick={() => setTheme('TOP 5 ARTISTE')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'TOP 5 ARTISTE' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-white/5 border-white/5 text-gray-400'}`}>TOP 5 ARTISTES</button>
                    <button onClick={() => setTheme('TOP 5 STYLES')} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${theme === 'TOP 5 STYLES' ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'bg-white/5 border-white/5 text-gray-400'}`}>TOP 5 STYLES</button>
                </>
            )}
        </div>
    );

    const styleMusicButtons = activeTab === 'REEL' && (theme === 'INTRO' || theme === 'TOP 5 STYLES') ? (
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
                        <input value={item.main} onChange={e => { const n = [...top5Items]; n[i].main = e.target.value; setTop5Items(n); }} placeholder="ARTISTE" spellCheck={true} autoCapitalize="words" className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold" />
                        <input value={item.sub} onChange={e => { const n = [...top5Items]; n[i].sub = e.target.value; setTop5Items(n); }} placeholder="TITRE" spellCheck={true} autoCapitalize="words" className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold" />
                    </div>
                    {theme === 'TOP 5 ARTISTE' && (
                        <input value={item.value} onChange={e => { const n = [...top5Items]; n[i].value = e.target.value; setTop5Items(n); }} placeholder="STREAMS (MILLIONS)" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold mb-2" />
                    )}
                    <input value={item.spotifyUrl} onChange={e => { const n = [...top5Items]; n[i].spotifyUrl = e.target.value; setTop5Items(n); }} placeholder="LIEN SPOTIFY / VIDEO" className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-[10px] text-[#1DB954] font-bold mb-2" />
                    <div className="flex items-center gap-2">
                        <button onClick={(e) => {
                            e.stopPropagation();
                            const input = document.createElement('input');
                            input.type = 'file'; input.accept = 'image/*';
                            input.onchange = (ev: any) => {
                                const file = ev.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (re) => { const n = [...top5Items]; n[i].photo = re.target?.result as string; setTop5Items(n); };
                                    reader.readAsDataURL(file);
                                }
                            };
                            input.click();
                        }} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                            <ImageIcon className="w-3 h-3" /> {item.photo ? 'Modifier Photo' : 'Ajouter Photo'}
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
            let cleaned = item.time.trim().toLowerCase();
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

    const planningEditor = (
        <div className="space-y-3">
            <input 
                value={customText} 
                onChange={e => setCustomText(e.target.value)} 
                placeholder="TITRE (ex: LINE-UP)" 
                className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white font-black italic uppercase text-xs mb-2" 
            />
            <div className="flex gap-2 mb-2">
                <select 
                    value={planningTimezoneOffset} 
                    onChange={e => setPlanningTimezoneOffset(Number(e.target.value))}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-gray-400 font-bold outline-none focus:border-neon-cyan transition-all"
                >
                    <option value={0}>SÉLECTIONNER LE FUSEAU LOCAL DU FESTIVAL</option>
                    {FESTIVAL_TIMEZONES.map(group => (
                        <optgroup key={group.group} label={group.group}>
                            {group.options.map(opt => (
                                <option key={opt.label} value={opt.offset}>{opt.label}</option>
                            ))}
                        </optgroup>
                    ))}
                </select>
                <button 
                    onClick={handleConvertPlanningTimes}
                    disabled={planningTimezoneOffset === 0}
                    className={`px-4 bg-neon-cyan/20 border border-neon-cyan/30 rounded-xl text-[9px] font-black uppercase text-neon-cyan transition-all ${planningTimezoneOffset === 0 ? 'opacity-30' : 'hover:bg-neon-cyan hover:text-black shadow-[0_0_15px_rgba(0,255,255,0.2)]'}`}
                >
                    CONVERTIR EN FR
                </button>
            </div>
            <input 
                value={planningDate} 
                onChange={e => setPlanningDate(e.target.value)} 
                placeholder="DATE (ex: 21 MARS - 28 MARS)" 
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold uppercase text-[10px] mb-2" 
            />

            <div className="border border-white/10 bg-black/20 rounded-xl p-3 mb-4 space-y-3">
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
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {planningItems.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <input 
                            value={item.time} 
                            onChange={e => { const n = [...planningItems]; n[i].time = e.target.value; setPlanningItems(n); }} 
                            placeholder="00:00" 
                            className="w-20 bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-neon-cyan font-bold text-center" 
                        />
                        <input 
                            value={item.artist} 
                            onChange={e => { const n = [...planningItems]; n[i].artist = e.target.value; setPlanningItems(n); }} 
                            placeholder="ARTISTE" 
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold" 
                        />
                        <button onClick={() => setPlanningItems(planningItems.filter((_, idx) => idx !== i))} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><X className="w-3 h-3" /></button>
                    </div>
                ))}
            </div>
            <button onClick={() => setPlanningItems([...planningItems, { time: '00:00', artist: 'NOUVEL ARTISTE' }])} className="w-full py-3 bg-white/5 border border-dashed border-white/20 rounded-xl text-[9px] font-black uppercase text-gray-400 hover:text-white hover:border-white/40 transition-all flex items-center justify-center gap-2">
                <Plus className="w-3.5 h-3.5" /> Ajouter un créneau
            </button>
        </div>
    );

    const textEditor = (
        <div className="space-y-2">
            <textarea
                ref={textAreaRef}
                value={customText}
                onSelect={(e) => { const t = e.target as HTMLTextAreaElement; setSelection({ start: t.selectionStart, end: t.selectionEnd }); }}
                onChange={e => setCustomText(e.target.value.slice(0, 1100))}
                placeholder="VOTRE TEXTE..."
                spellCheck={true}
                autoCorrect="on"
                autoComplete="on"
                autoCapitalize="sentences"
                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm font-bold italic resize-none focus:border-cyan-500 outline-none transition-all shadow-inner shadow-black font-sans uppercase break-words"
            />
            <div className="flex justify-end">
                <button 
                    onClick={() => setCustomText(fixEncoding(customText))}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-[9px] font-black uppercase hover:bg-green-500 hover:text-white transition-all"
                >
                    <Sparkles className="w-3 h-3" /> Nettoyer & Corriger
                </button>
            </div>
            <p className="text-[9px] text-white/30 italic px-1">Les codes comme [C:...] ou [B:...] seront transformés en style sur l'image finale.</p>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase">Couleur Texte</label>
                    <div className="flex gap-2 items-center">
                        <input type="color" value={textColor} onMouseDown={(e) => e.stopPropagation()} onChange={e => handleTextStyler('C', e.target.value)} className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer" />
                        <span className="text-[10px] font-mono text-white/50">{textColor}</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase">Fond Texte</label>
                    <div className="flex gap-2 items-center">
                        <input type="color" value={textBgColor === 'transparent' ? '#000000' : textBgColor} onMouseDown={(e) => e.stopPropagation()} onChange={e => handleTextStyler('B', e.target.value)} className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer" />
                        <button onMouseDown={(e) => e.preventDefault()} onClick={() => { setTextBgColor('transparent'); setSelection({ start: 0, end: 0 }); }}
                            className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase transition-all ${textBgColor === 'transparent' ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500 hover:text-white'}`}>
                            Aucun
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const highlightsEditor = (
        <div className="space-y-3">
            <span className="text-[10px] font-black text-gray-500 uppercase">Festivals</span>
            <input 
                value={highlightsFestival} 
                onChange={e => setHighlightsFestival(e.target.value)} 
                placeholder="FESTIVAL(S) (ex: TOMORROWLAND)" 
                className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white text-sm font-black italic focus:border-cyan-500 outline-none transition-all uppercase mb-2" 
            />
            <span className="text-[10px] font-black text-gray-500 uppercase">Artistes</span>
            <textarea
                value={highlightsArtists}
                onChange={e => setHighlightsArtists(e.target.value)}
                placeholder="ARTISTES..."
                spellCheck={true}
                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm font-bold italic resize-none focus:border-cyan-500 outline-none transition-all shadow-inner shadow-black font-sans uppercase break-words"
            />
            <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase">Couleur Texte</label>
                    <div className="flex gap-2 items-center">
                        <input type="color" value={textColor} onMouseDown={(e) => e.stopPropagation()} onChange={e => setTextColor(e.target.value)} className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase">Fond Texte</label>
                    <div className="flex gap-2 items-center">
                        <input type="color" value={textBgColor === 'transparent' ? '#000000' : textBgColor} onMouseDown={(e) => e.stopPropagation()} onChange={e => setTextBgColor(e.target.value)} className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer" />
                        <button onMouseDown={(e) => e.preventDefault()} onClick={() => setTextBgColor('transparent')}
                            className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase transition-all ${textBgColor === 'transparent' ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500 hover:text-white'}`}>
                            Aucun
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const exportButtons = (
        <div className="space-y-2">
            {activeTab === 'PUBLICATION' && (
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={addVisualToList} className="py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-white/10 transition-all"><PlusCircle className="w-3.5 h-3.5" /> Ajouter</button>
                    <button onClick={downloadSingle} disabled={isDownloading} className="py-2.5 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-neon-cyan/20 transition-all">
                        <Download className="w-3.5 h-3.5" /> Télécharger PNG
                    </button>
                </div>
            )}
            <button onClick={startVideoRecording} disabled={isVideoRecording}
                className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${isVideoRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-neon-red/10 border border-neon-red/30 text-neon-red hover:bg-neon-red/20'}`}>
                <Video className="w-4 h-4" /> {isVideoRecording ? 'CAPTURE EN COURS...' : `Générer Vidéo (${theme})`}
            </button>
            <button onClick={downloadBoth} disabled={isDownloading} className="w-full py-2.5 bg-white text-black rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-neon-cyan transition-all shadow-lg active:scale-95 group">
                <Layers className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" /> PACK COMPLET ( <span className="text-neon-red">POST</span> + <span className="text-neon-cyan">STORY</span> )
            </button>
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
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-purple via-pink-500 to-neon-red" />
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-1">Importer un <span className="text-neon-purple">Récap Écrit</span></h2>
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
                                            <p className="text-[10px] font-black text-neon-purple uppercase tracking-widest mb-1">{recap.festival || 'FESTIVAL'}</p>
                                            <h3 className="text-white font-black uppercase italic tracking-tighter text-sm line-clamp-1 mb-1">{fixEncoding(recap.title)}</h3>
                                            <p className="text-[9px] text-gray-500 font-medium line-clamp-2 leading-relaxed">{fixEncoding(recap.summary || '')}</p>
                                        </div>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-8 h-8 rounded-full bg-neon-purple text-white flex items-center justify-center">
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

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl">

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
                        {styleMusicButtons}

                        {/* Background */}
                        <div className="space-y-2">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Fond Visuel</span>
                            <button onClick={() => fileInputRef.current?.click()} className="w-full py-2.5 border border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 text-gray-400 text-[9px] font-black uppercase hover:border-white/30 hover:text-white transition-all bg-white/5 group">
                                <Upload className="w-3.5 h-3.5 group-hover:text-neon-red transition-colors" />
                                {bgImage || bgVideo ? 'Modifier le fond' : 'Importer Image/Vidéo'}
                            </button>
                            <button onClick={() => setIsDownloaderOpen(true)} className="w-full py-2.5 border border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 text-gray-400 text-[9px] font-black uppercase hover:border-white/30 hover:text-white transition-all bg-white/5 group">
                                <LinkIcon className="w-3.5 h-3.5 group-hover:text-neon-cyan transition-colors" />
                                Télécharger Vidéo/Photo (URL)
                            </button>
                            <button onClick={() => setIsRecapPickerOpen(true)} className="w-full py-2.5 bg-neon-purple/10 border border-neon-purple/30 rounded-xl flex items-center justify-center gap-2 text-neon-purple text-[9px] font-black uppercase hover:bg-neon-purple/20 transition-all group">
                                <PlusCircle className="w-3.5 h-3.5" />
                                Importer un RÉCAP ÉCRIT
                            </button>
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
                        </div>

                        {/* Content editor */}
                        <div className="space-y-4">
                            {theme === 'PLANNING' ? (
                                <><span className="text-[10px] font-black text-gray-500 uppercase">Horaires Planning</span>{planningEditor}</>
                            ) : theme.startsWith('TOP 5') ? (
                                <><span className="text-[10px] font-black text-gray-500 uppercase">Éléments du Top 5</span>{top5Editor}</>
                            ) : theme === 'HIGHLIGHTS' ? (
                                <>{highlightsEditor}</>
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
                                    <div className="flex items-center gap-2 min-w-0"><LinkIcon className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" /><span className="text-[9px] font-black text-white uppercase truncate">Lien</span></div>
                                    <div className={`w-4 h-4 rounded-md border-2 transition-all flex items-center justify-center flex-shrink-0 ${showArticleLink ? 'bg-neon-cyan border-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.4)]' : 'bg-black/40 border-white/20 group-hover:border-white/40'}`}>
                                        {showArticleLink && (<motion.svg initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></motion.svg>)}
                                    </div>
                                </div>
                                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer group" onClick={() => setShowSwipe(!showSwipe)}>
                                    <div className="flex items-center gap-2 min-w-0"><Layout className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" /><span className="text-[9px] font-black text-white uppercase truncate">Swipe</span></div>
                                    <div className={`w-4 h-4 rounded-md border-2 transition-all flex items-center justify-center flex-shrink-0 ${showSwipe ? 'bg-neon-red border-neon-red shadow-[0_0_10px_rgba(255,18,65,0.4)]' : 'bg-black/40 border-white/20 group-hover:border-white/40'}`}>
                                        {showSwipe && (<motion.svg initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></motion.svg>)}
                                    </div>
                                </div>
                                <div className="col-span-2 p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer group" onClick={() => setShowText(!showText)}>
                                    <div className="flex items-center gap-2"><Eraser className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" /><span className="text-[9px] font-black text-white uppercase whitespace-nowrap">Gomme (Masquer le texte)</span></div>
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
                        <div className="aspect-auto w-full max-w-[450px] relative">
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
                                    {isVideoRecording && (
                                        <motion.div
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
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
                                                    <h3 className="text-white font-black uppercase italic tracking-tighter">Génération en cours</h3>
                                                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Veuillez ne pas quitter cette page</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
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
                                            <button onClick={() => { setActiveTab('REEL'); setTheme('TOP 5 ARTISTE'); setShowFormatModal(false); }}
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
                                initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
                                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                                className="absolute inset-x-0 bottom-[130px] z-30 rounded-t-[28px]"
                                style={{ background: 'linear-gradient(180deg,#161616 0%,#0d0d0d 100%)', borderTop: '1px solid rgba(255,255,255,0.08)', maxHeight: '60vh', overflowY: 'auto' }}>
                                <div className="flex justify-center pt-3 pb-2"><div className="w-8 h-1 rounded-full bg-white/20" /></div>

                                {activePanel === 'format' && (
                                    <div className="px-6 pb-8">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Format</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={() => { setActiveTab('REEL'); setTheme('TOP 5 ARTISTE'); setActivePanel(null); }}
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
                                    <div className="px-6 pb-8">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Thème visuel</p>
                                        {themeButtons}
                                        {styleMusicButtons && <div className="mt-4">{styleMusicButtons}</div>}
                                    </div>
                                )}

                                {activePanel === 'texte' && (
                                    <div className="px-6 pb-8">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Contenu</p>
                                        {theme === 'PLANNING' ? planningEditor : theme.startsWith('TOP 5') ? top5Editor : theme === 'HIGHLIGHTS' ? highlightsEditor : textEditor}
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
                                            <button onClick={() => { setActivePanel(null); setIsRecapPickerOpen(true); }} className="w-full py-4 bg-neon-purple/10 border border-neon-purple/30 rounded-2xl flex items-center justify-center gap-2 text-neon-purple text-[10px] font-black uppercase hover:bg-neon-purple/20 transition-all group">
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
                                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Export panel */}
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
                                <LinkIcon className="w-3 h-3" /> Lien {showArticleLink ? 'ON' : 'OFF'}
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
            <AnimatePresence>
                {readyVideoBlob && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-dark-bg border border-white/10 rounded-[3rem] p-8 flex flex-col items-center">

                            <div className="w-20 h-20 bg-neon-green/10 rounded-full flex items-center justify-center mb-6 border border-neon-green/20">
                                <Check className="w-10 h-10 text-neon-green" />
                            </div>

                            <h2 className="text-2xl font-black text-white italic uppercase mb-2 text-center leading-none">VIDÉO PRÊTE !</h2>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-8 text-center">Enregistrez-la pour vos réseaux</p>

                            <div className="w-full aspect-[9/16] max-h-[300px] mb-8 rounded-2xl overflow-hidden bg-black border border-white/5 relative group">
                                <video src={readyVideoUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline controls />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                            </div>

                            <div className="w-full space-y-3">
                                <button
                                    onClick={async () => {
                                        const extension = readyVideoBlob.type.includes('mp4') ? 'mp4' : 'webm';
                                        const fileName = `dropsiders-${theme.replace(/ /g, '-')}.${extension}`;
                                        const file = new File([readyVideoBlob], fileName, { type: readyVideoBlob.type });

                                        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                                            try {
                                                await navigator.share({
                                                    files: [file],
                                                    title: 'Dropsiders Video',
                                                    text: 'Ma vidéo générée via Dropsiders Social Studio'
                                                });
                                                return;
                                            } catch (err) {
                                                console.warn("Share failed:", err);
                                            }
                                        }

                                        // Fallback: Direct download
                                        const a = document.createElement('a');
                                        a.href = readyVideoUrl;
                                        a.download = fileName;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);

                                        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                                        if (isIOS || /OPR\/|Opera\/|Edition\sGX/.test(navigator.userAgent)) {
                                            setErrorMessage("Maintenez la vidéo qui s'affiche pour l'enregistrer manuellement.");
                                        }
                                    }}
                                    className="w-full py-5 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-[11px] shadow-[0_10px_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    📥 Enregistrer la vidéo
                                </button>

                                <button
                                    onClick={() => {
                                        const extension = readyVideoBlob.type.includes('mp4') ? 'mp4' : 'webm';
                                        const fileName = `dropsiders-${theme.replace(/ /g, '-')}.${extension}`;
                                        const a = document.createElement('a');
                                        a.href = readyVideoUrl;
                                        a.download = fileName;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                    }}
                                    className="w-full py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                >
                                    <Download className="w-3.5 h-3.5" /> Lien Miroir (Secours)
                                </button>

                                <button
                                    onClick={() => {
                                        if (readyVideoUrl) URL.revokeObjectURL(readyVideoUrl);
                                        setReadyVideoBlob(null);
                                        setReadyVideoUrl('');
                                    }}
                                    className="w-full py-4 text-gray-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors"
                                >
                                    Fermer
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Shared downloader modal (visible on both) */}
            {downloaderModal}
            {recapPickerModal}

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
        </motion.div>
    );
}

// Sync Heartbeat: 2024-03-06T16:32:00Z

