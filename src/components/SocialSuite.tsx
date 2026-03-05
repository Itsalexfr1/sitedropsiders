import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Download, Upload, PlusCircle,
    Video, Layout, Smartphone, Image as ImageIcon,
    Home, Link as LinkIcon, Palette, Type, Film,
    Check, Layers
} from 'lucide-react';
import { Downloader } from '../pages/Downloader';


interface SocialSuiteProps {
    title: string;
    imageUrl: string;
    onClose: () => void;
}

type TabType = 'REEL' | 'PUBLICATION';
type ThemeType = 'TOP 5 ARTISTE' | 'TOP 5 STYLES' | 'INTRO' | 'NEWS' | 'FOCUS' | 'MUSIQUE' | 'RECAP';

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
    // InShot-style: active bottom panel and format modal
    const [activePanel, setActivePanel] = useState<string | null>(null);
    const [showFormatModal, setShowFormatModal] = useState(true);

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

    // Detect mobile vs desktop (lg breakpoint = 1024px) — JS-based to avoid canvasRef conflict
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
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
        'MUSIQUE': { label: 'MUSIQUE', grad: '57, 255, 20', color: '#39ff14' },
        'RECAP': { label: 'RECAP', grad: '189, 0, 255', color: '#bd00ff' },
        'INTRO': { label: 'INTRO', grad: '0, 50, 255', color: '#0032ff' }
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

    const generateImage = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        try {
            let img: HTMLImageElement | null = null;
            if (bgImage) {
                img = new Image();
                img.crossOrigin = "anonymous";
                img.src = bgImage;
                await new Promise((res, rej) => { img!.onload = res; img!.onerror = rej; });
            }

            canvas.width = 1080;
            canvas.height = activeTab === 'REEL' ? 1920 : 1350;
            const safeSize = activeTab === 'PUBLICATION' ? 1050 : 1080;
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
                ctx.font = `900 italic 67px "Inter", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif`;
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
                ctx.font = '900 italic 62px "Inter", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 15;
                ctx.fillText(`${item.main} - ${item.sub}`, centerX + slideX, centerY + radius + 140);

                // Restore Ranking Number
                ctx.textAlign = 'right';
                ctx.font = '900 italic 147px "Inter", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
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
                ctx.font = '900 italic 49px "Inter", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 10;
                ctx.fillText(`${item.main} - ${item.sub}`, itemX, baseY);
                const barWidth = 880; const barHeight = 90; const barX = 90; const barY = baseY + 45;
                ctx.fillStyle = `rgba(${activeData.grad}, 0.4)`;
                ctx.fillRect(barX - 10 + slideX, barY - 10, barWidth + 20, barHeight + 20);
                ctx.fillStyle = activeData.color;
                ctx.fillRect(barX + slideX, barY, barWidth, barHeight);
                ctx.fillStyle = '#000'; // Black text on yellow bar
                ctx.font = '900 italic 43px "Inter", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
                ctx.fillText(`${item.value} MILLIONS DE STREAMS`, barX + 30 + slideX, barY + 60);
                ctx.textAlign = 'right';
                ctx.font = '900 italic 117px "Inter", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillText(`#${5 - currentPreviewIndex}`, canvas.width - 100 + slideX, canvas.height - 120); // Descendu dans le dégradé

            } else {
                const fontSize = activeTab === 'PUBLICATION' ? 55 : 78; const lineHeight = fontSize * 1.15;
                ctx.textAlign = 'center';
                const paragraphs = customText.toUpperCase().split('\n');
                let lines: string[] = [];
                ctx.font = `900 italic ${fontSize}px "Inter", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif`;
                const stripTags = (s: string) => s.replace(/\[[CB]:[^\]]+\]|\[\/[CB]\]/gi, '');
                for (let para of paragraphs) {
                    if (para.trim() === '') { lines.push(''); continue; }
                    const words = para.split(' ');
                    let currentLine = '';
                    for (let word of words) {
                        const testLine = currentLine + word + ' ';
                        if (ctx.measureText(stripTags(testLine)).width < canvas.width - 240) currentLine += word + ' ';
                        else { lines.push(currentLine.trim()); currentLine = word + ' '; }
                    }
                    lines.push(currentLine.trim());
                }
                const labelY = activeTab === 'PUBLICATION' ? 880 : safeBottom - 450;
                const startY = labelY + 130;
                const labelText = ('label' in activeData) ? (activeData as any).label : theme;
                const labelW = ctx.measureText(labelText).width + (activeTab === 'PUBLICATION' ? 80 : 50);

                ctx.save();
                ctx.globalAlpha = 0.9;
                ctx.fillStyle = activeData.color;
                const rectX = (canvas.width - labelW) / 2;
                const rectY = labelY - (activeTab === 'PUBLICATION' ? 52 : 42);
                const rectW = labelW;
                const rectH = activeTab === 'PUBLICATION' ? 80 : 65;
                const radius = 20; // Slightly smaller radius for smaller box

                ctx.beginPath();
                ctx.roundRect(rectX, rectY, rectW, rectH, radius);
                ctx.fill();

                ctx.globalAlpha = 1;
                ctx.fillStyle = labelText === 'MUSIQUE' ? '#000' : '#FFF';
                const labelFontSize = activeTab === 'PUBLICATION' ? 42 : 35;
                ctx.font = `900 italic ${labelFontSize}px "Inter", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif`;
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

                const maxLines = activeTab === 'PUBLICATION' ? 8 : 10;
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
                    ctx.font = '900 italic 27px "Inter", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
                    ctx.fillText('...', canvas.width / 2, startY + (maxLines * lineHeight) - 20);
                    ctx.globalAlpha = 1;
                }
            }

            // Logic removed here to be drawn at the end as overlay

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
            if (logoRef.current) {
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
                ctx.font = '900 italic 45px "Inter", sans-serif';
                ctx.fillStyle = '#fff';
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 10;
                ctx.fillText('>>', canvas.width - 40, canvas.height - 10);
                ctx.restore();
            }

            if (showArticleLink) {
                ctx.save();
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                ctx.font = '900 italic 24px "Inter", sans-serif'; // Réduit de 40% (40px -> 24px)
                ctx.fillStyle = '#fff';
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 10;
                ctx.fillText('ARTICLE COMPLET À LIRE SUR DROPSIDERS.FR', 40, canvas.height - 10);
                ctx.restore();
            }

        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        let anim: number;
        if (bgVideo || isVideoRecording) {
            const loop = () => { generateImage(); anim = requestAnimationFrame(loop); };
            anim = requestAnimationFrame(loop);
        } else { generateImage(); }
        return () => cancelAnimationFrame(anim);
    }, [bgImage, bgVideo, customText, theme, showSwipe, top5Items, currentPreviewIndex, activeTab, rotation, themeColor, isVideoRecording, transitionProgress]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = url; video.muted = true; video.loop = true; video.play();
            setBgVideo(video); setBgImage('');
        } else { setBgImage(url); setBgVideo(null); }
    };

    const startVideoRecording = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setIsVideoRecording(true);

        // Detect best supported format
        const formats = [
            'video/mp4;codecs=h264',
            'video/webm;codecs=h264',
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm'
        ];

        const mimeType = formats.find(f => MediaRecorder.isTypeSupported(f)) || 'video/webm';
        const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';

        const canvasStream = canvas.captureStream(60);
        let combinedStream = canvasStream;

        if (bgVideo) {
            try {
                bgVideo.currentTime = 0;
                bgVideo.loop = false;
                bgVideo.play();
                // If bgVideo has audio tracks, add them to our stream
                const videoStream = (bgVideo as any).captureStream ? (bgVideo as any).captureStream() : (bgVideo as any).mozCaptureStream ? (bgVideo as any).mozCaptureStream() : null;
                if (videoStream && videoStream.getAudioTracks().length > 0) {
                    const audioTrack = videoStream.getAudioTracks()[0];
                    combinedStream = new MediaStream([...canvasStream.getTracks(), audioTrack]);
                }
            } catch (e) {
                console.error("Could not capture audio from video", e);
            }
        }

        const recorder = new MediaRecorder(combinedStream, {
            mimeType,
            videoBitsPerSecond: 12000000 // 12Mbps for pro quality
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dropsiders-${theme.replace(/ /g, '-')}-${Date.now()}.${extension}`;
            a.click();
            setIsVideoRecording(false);
        };
        recorder.start();

        if (theme === 'INTRO') {
            await new Promise(r => setTimeout(r, 10000));
        } else if (theme.startsWith('TOP 5')) {
            for (let i = 0; i < 5; i++) {
                if (i > 0) {
                    const duration = 1200;
                    const start = Date.now();
                    let switched = false;
                    while (Date.now() - start < duration) {
                        const progress = (Date.now() - start) / duration;
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
            // Match background video duration or default to 15s (better for social posts than 60s)
            const duration = (bgVideo && bgVideo.duration) ? bgVideo.duration * 1000 : 15000;
            await new Promise(r => setTimeout(r, duration));
        }
        setTransitionProgress(0); // Safety reset
        if (bgVideo) bgVideo.loop = true; // Restore looping for preview
        recorder.stop();
    };

    const addVisualToList = () => {
        if (!canvasRef.current) return;
        setVisualsList([...visualsList, canvasRef.current.toDataURL('image/png')]);
    };

    const downloadSingle = () => {
        if (!canvasRef.current) return;
        setIsDownloading(true);
        const a = document.createElement('a');
        a.download = `dropsiders-${theme}-${Date.now()}.png`;
        a.href = canvasRef.current.toDataURL('image/png');
        a.click();
        setTimeout(() => setIsDownloading(false), 1000);
    };

    // Shared content blocks (used in both mobile & desktop)
    const themeButtons = (
        <div className="grid grid-cols-2 gap-2">
            {activeTab === 'REEL' ? (
                <>
                    <button onClick={() => setTheme('INTRO')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${theme === 'INTRO' ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'bg-white/5 border-white/5 text-gray-400'}`}>INTRO</button>
                    <button onClick={() => setTheme('TOP 5 ARTISTE')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${theme === 'TOP 5 ARTISTE' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-white/5 border-white/5 text-gray-400'}`}>TOP 5 ARTISTES</button>
                    <button onClick={() => setTheme('TOP 5 STYLES')} className={`px-2 py-3 rounded-xl text-[9px] font-black uppercase border transition-all col-span-2 ${theme === 'TOP 5 STYLES' ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'bg-white/5 border-white/5 text-gray-400'}`}>TOP 5 STYLES</button>
                </>
            ) : (
                <>
                    <button onClick={() => setTheme('NEWS')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${theme === 'NEWS' ? 'bg-neon-red/20 border-neon-red text-neon-red' : 'bg-white/5 border-white/5 text-gray-400'}`}>NEWS</button>
                    <button onClick={() => setTheme('FOCUS')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${theme === 'FOCUS' ? 'bg-[#ffaa00]/20 border-[#ffaa00] text-[#ffaa00]' : 'bg-white/5 border-white/5 text-gray-400'}`}>FOCUS</button>
                    <button onClick={() => setTheme('MUSIQUE')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${theme === 'MUSIQUE' ? 'bg-neon-green/20 border-neon-green text-neon-green' : 'bg-white/5 border-white/5 text-gray-400'}`}>MUSIQUE</button>
                    <button onClick={() => setTheme('RECAP')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${theme === 'RECAP' ? 'bg-neon-purple/20 border-neon-purple text-neon-purple' : 'bg-white/5 border-white/5 text-gray-400'}`}>RECAP</button>
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
                        <input value={item.main} onChange={e => { const n = [...top5Items]; n[i].main = e.target.value.toUpperCase(); setTop5Items(n); }} placeholder="ARTISTE" className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold" />
                        <input value={item.sub} onChange={e => { const n = [...top5Items]; n[i].sub = e.target.value.toUpperCase(); setTop5Items(n); }} placeholder="TITRE" className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold" />
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

    const textEditor = (
        <div className="space-y-4">
            <textarea
                ref={textAreaRef}
                value={customText}
                onSelect={(e) => { const t = e.target as HTMLTextAreaElement; setSelection({ start: t.selectionStart, end: t.selectionEnd }); }}
                onChange={e => setCustomText(e.target.value.slice(0, 1100))}
                placeholder="VOTRE TEXTE..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold italic resize-none focus:border-neon-red outline-none transition-all shadow-inner shadow-black uppercase"
            />
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

    const exportButtons = (
        <div className="space-y-2">
            {activeTab === 'PUBLICATION' && (
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={addVisualToList} className="py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-white/10 transition-all"><PlusCircle className="w-3.5 h-3.5" /> Ajouter</button>
                    <button onClick={downloadSingle} disabled={isDownloading} className="py-4 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-neon-cyan/20 transition-all"><Download className="w-3.5 h-3.5" /> Télécharger PNG</button>
                </div>
            )}
            <button onClick={startVideoRecording} disabled={isVideoRecording}
                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-3 transition-all ${isVideoRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-neon-red/10 border border-neon-red/30 text-neon-red hover:bg-neon-red/20'}`}>
                <Video className="w-4 h-4" /> {isVideoRecording ? 'CAPTURE EN COURS...' : `Générer Vidéo Instagram (${theme})`}
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

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl">

            {!isMobile ? (
                /* ══════════════════════════════════════════════════════════
                    DESKTOP LAYOUT (lg+) — original two-column design
                ══════════════════════════════════════════════════════════ */
                <div className="flex w-full h-full max-w-6xl mx-auto rounded-[40px] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden bg-[#0a0a0a]">

                    {/* Controls Sidebar */}
                    <div className="w-[400px] border-r border-white/10 p-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar h-full">
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
                        <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                            <button onClick={() => setActiveTab('REEL')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'REEL' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}><Smartphone className="w-4 h-4" /> REEL</button>
                            <button onClick={() => setActiveTab('PUBLICATION')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'PUBLICATION' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}><ImageIcon className="w-4 h-4" /> POST</button>
                        </div>

                        {themeButtons}
                        {styleMusicButtons}

                        {/* Background */}
                        <div className="space-y-3">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Fond Visuel</span>
                            <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-gray-400 text-[10px] font-black uppercase hover:border-white/30 hover:text-white transition-all bg-white/5 group">
                                <Upload className="w-4 h-4 group-hover:text-neon-red transition-colors" />
                                {bgImage || bgVideo ? 'Modifier le fond' : 'Importer Image/Vidéo'}
                            </button>
                            <button onClick={() => setIsDownloaderOpen(true)} className="w-full py-4 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-gray-400 text-[10px] font-black uppercase hover:border-white/30 hover:text-white transition-all bg-white/5 group">
                                <LinkIcon className="w-4 h-4 group-hover:text-neon-cyan transition-colors" />
                                Télécharger Vidéo/Photo (URL)
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
                        </div>

                        {/* Content editor */}
                        <div className="space-y-4">
                            {theme.startsWith('TOP 5') ? (
                                <><span className="text-[10px] font-black text-gray-500 uppercase">Éléments du Top 5</span>{top5Editor}</>
                            ) : (
                                <><span className="text-[10px] font-black text-gray-500 uppercase">Contenu Texte</span>{textEditor}</>
                            )}
                        </div>

                        {/* Toggles + Export */}
                        <div className="space-y-4 mt-auto pb-8">
                            <div className="flex gap-2">
                                <div className="flex-1 p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer group" onClick={() => setShowArticleLink(!showArticleLink)}>
                                    <div className="flex items-center gap-2"><LinkIcon className="w-3.5 h-3.5 text-gray-500" /><span className="text-[9px] font-black text-white uppercase whitespace-nowrap">Lien Article</span></div>
                                    <div className={`w-4 h-4 rounded-md border-2 transition-all flex items-center justify-center flex-shrink-0 ${showArticleLink ? 'bg-neon-cyan border-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.4)]' : 'bg-black/40 border-white/20 group-hover:border-white/40'}`}>
                                        {showArticleLink && (<motion.svg initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></motion.svg>)}
                                    </div>
                                </div>
                                <div className="flex-1 p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer group" onClick={() => setShowSwipe(!showSwipe)}>
                                    <div className="flex items-center gap-2"><Layout className="w-3.5 h-3.5 text-gray-500" /><span className="text-[9px] font-black text-white uppercase">Swipe</span></div>
                                    <div className={`w-4 h-4 rounded-md border-2 transition-all flex items-center justify-center flex-shrink-0 ${showSwipe ? 'bg-neon-red border-neon-red shadow-[0_0_10px_rgba(255,18,65,0.4)]' : 'bg-black/40 border-white/20 group-hover:border-white/40'}`}>
                                        {showSwipe && (<motion.svg initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></motion.svg>)}
                                    </div>
                                </div>
                            </div>
                            {exportButtons}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="flex-1 bg-[#020202] flex flex-col items-center justify-center relative overflow-hidden h-full border-l border-white/10">
                        <div className="aspect-auto w-full max-w-[450px] relative">
                            <div className="w-full h-full bg-[#111] rounded-[30px] overflow-hidden border border-white/10 shadow-2xl">
                                <canvas ref={canvasRef} className="w-full h-full object-contain" />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* ══════════════════════════════════════════════════════════
                    MOBILE LAYOUT — InShot style: full-screen + bottom bar
                ══════════════════════════════════════════════════════════ */
                <div className="relative w-full h-full">

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

                    {/* Full-screen canvas */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black" style={{ paddingBottom: '130px' }}>
                        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" style={{ borderRadius: '10px', boxShadow: '0 0 60px rgba(0,0,0,0.9)' }} />
                    </div>

                    {/* Top bar */}
                    <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-4 pb-3 z-20" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0.7) 0%,transparent 100%)' }}>
                        <button onClick={onClose} className="p-2.5 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 transition-all"><X className="w-5 h-5" /></button>
                        <span className="text-[11px] font-black text-white/50 uppercase tracking-widest italic">SOCIAL STUDIO</span>
                        <button onClick={() => window.location.href = '/'} className="p-2.5 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 transition-all"><Home className="w-5 h-5" /></button>
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
                                        {theme.startsWith('TOP 5') ? top5Editor : textEditor}
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

                    {/* Bottom icon bar */}
                    <div className="absolute bottom-0 inset-x-0 z-40"
                        style={{ background: 'linear-gradient(0deg,rgba(0,0,0,0.98) 0%,rgba(0,0,0,0.85) 100%)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        {/* Quick toggles */}
                        <div className="flex items-center justify-center gap-3 px-4 pt-2 pb-1">
                            <button onClick={() => setShowSwipe(!showSwipe)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all border ${showSwipe ? 'bg-neon-red/20 border-neon-red/50 text-neon-red' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
                                <Layout className="w-3 h-3" /> Swipe {showSwipe ? 'ON' : 'OFF'}
                            </button>
                            <button onClick={() => setShowArticleLink(!showArticleLink)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all border ${showArticleLink ? 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
                                <LinkIcon className="w-3 h-3" /> Lien {showArticleLink ? 'ON' : 'OFF'}
                            </button>
                        </div>
                        {/* Icon buttons */}
                        <div className="flex items-center justify-around px-2 py-3">
                            {[
                                { id: 'format', icon: <Layers className="w-5 h-5" />, label: 'Format' },
                                { id: 'theme', icon: <Palette className="w-5 h-5" />, label: 'Thème' },
                                { id: 'texte', icon: <Type className="w-5 h-5" />, label: 'Texte' },
                                { id: 'fond', icon: <ImageIcon className="w-5 h-5" />, label: 'Fond' },
                                { id: 'export', icon: <Film className="w-5 h-5" />, label: 'Export' },
                            ].map(btn => (
                                <button key={btn.id} onClick={() => togglePanel(btn.id)} className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all group">
                                    <div className={`p-2.5 rounded-2xl transition-all ${activePanel === btn.id ? 'bg-white text-black scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-gray-400 bg-white/5 group-hover:bg-white/10 group-hover:text-white'}`}>
                                        {btn.icon}
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-wide ${activePanel === btn.id ? 'text-white' : 'text-gray-600 group-hover:text-gray-400'}`}>{btn.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            )} {/* end isMobile ternary */}

            {/* Shared downloader modal (visible on both) */}
            {downloaderModal}
        </motion.div>
    );
}

