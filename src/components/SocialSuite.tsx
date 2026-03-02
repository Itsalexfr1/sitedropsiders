import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Download, Upload, PlusCircle,
    Video, Layout, Smartphone, Image as ImageIcon
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
    const [customText, setCustomText] = useState(title || '');
    const [bgImage, setBgImage] = useState<string>(imageUrl);
    const [bgVideo, setBgVideo] = useState<HTMLVideoElement | null>(null);
    const [textColor, setTextColor] = useState('#ffffff');
    const [textBgColor, setTextBgColor] = useState('transparent');
    const [isDownloading, setIsDownloading] = useState(false);
    const [isVideoRecording, setIsVideoRecording] = useState(false);
    const [visualsList, setVisualsList] = useState<string[]>([]);

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
    const [showDownloader, setShowDownloader] = useState(false);

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
            canvas.height = activeTab === 'REEL' ? 1920 : 1440;
            const safeTop = (activeTab === 'REEL') ? (canvas.height - 1080) / 2 : (canvas.height - 1080) / 2;
            const safeBottom = safeTop + 1080;

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

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#0a0a0a] w-full max-w-6xl h-[90vh] rounded-[40px] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col lg:flex-row">

                {/* Preview Section - Moved to top on mobile */}
                <div className="w-full lg:flex-1 bg-[#020202] py-6 px-4 flex flex-col items-center justify-center relative overflow-hidden h-[40vh] lg:h-full border-b lg:border-b-0 lg:border-l border-white/10 order-first lg:order-last">
                    <div className="h-full w-full max-w-[320px] lg:max-w-[450px] relative">
                        <div className="w-full h-full bg-[#111] rounded-[20px] lg:rounded-[30px] overflow-hidden border border-white/10 shadow-2xl relative">
                            <canvas ref={canvasRef} className="w-full h-full object-contain" />
                        </div>
                    </div>
                </div>

                {/* Controls Sidebar */}
                <div className="w-full lg:w-[400px] border-r border-white/10 p-6 lg:p-8 flex flex-col gap-6 lg:gap-8 overflow-y-auto custom-scrollbar h-[50vh] lg:h-full">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl lg:text-2xl font-black text-white italic tracking-tighter">SOCIAL STUDIO</h2>
                        </div>
                        <button onClick={onClose} className="p-2 lg:p-3 bg-white/5 hover:bg-white/10 rounded-xl lg:rounded-2xl text-white transition-all"><X className="w-5 h-5" /></button>
                    </div>

                    <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                        <button onClick={() => setActiveTab('REEL')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'REEL' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}><Smartphone className="w-4 h-4" /> REEL</button>
                        <button onClick={() => setActiveTab('PUBLICATION')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'PUBLICATION' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}><ImageIcon className="w-4 h-4" /> POST</button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {activeTab === 'REEL' ? (
                            <>
                                <button onClick={() => setTheme('INTRO')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${theme === 'INTRO' ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'bg-white/5 border-white/5 text-gray-400'}`}>INTRO</button>
                                <button onClick={() => setTheme('TOP 5 ARTISTE')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${theme === 'TOP 5 ARTISTE' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-white/5 border-white/5 text-gray-400'}`}>TOP 5 ARTISTES</button>
                                <button onClick={() => setTheme('TOP 5 STYLES')} className={`px-2 py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${theme === 'TOP 5 STYLES' ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'bg-white/5 border-white/5 text-gray-400'}`}>TOP 5 STYLES</button>
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

                    {/* Background Selection Section - Moved Up for priority */}
                    <div className="space-y-3">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Fond Visuel</span>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-gray-400 text-[10px] font-black uppercase hover:border-white/30 hover:text-white transition-all bg-white/5 group">
                            <Upload className="w-4 h-4 group-hover:text-neon-red transition-colors" />
                            {bgImage || bgVideo ? 'Modifier le fond' : 'Importer Image/Vidéo'}
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />

                        <button
                            onClick={() => setShowDownloader(true)}
                            className="w-full py-4 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-neon-cyan text-[10px] font-black uppercase hover:bg-neon-cyan/10 transition-all bg-white/5"
                        >
                            <Download className="w-4 h-4" />
                            Ouvrir Downloader (Insta/TikTok)
                        </button>
                    </div>

                    {activeTab === 'REEL' && (theme === 'INTRO' || theme === 'TOP 5 STYLES') && (
                        <div className="space-y-4">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Style de musique</span>
                            <div className="flex flex-wrap gap-2">
                                {STYLE_PRESETS.map(s => (
                                    <button
                                        key={s.name}
                                        onClick={() => setThemeColor(s)}
                                        className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase transition-all border-2 ${themeColor?.name === s.name ? 'bg-white text-black border-white' : 'bg-black/40 border-white/10 hover:border-white/30'}`}
                                        style={themeColor?.name === s.name ? {} : { borderColor: `rgba(${s.grad}, 0.3)`, color: s.color }}
                                    >
                                        {s.name}
                                    </button>
                                ))}
                                <button onClick={() => setThemeColor(null)} className="px-2 text-[8px] font-bold text-gray-500 uppercase hover:text-white transition-all underline underline-offset-4 decoration-neon-red">Reset</button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {theme.startsWith('TOP 5') ? (
                            <>
                                <span className="text-[10px] font-black text-gray-500 uppercase">Éléments du Top 5</span>
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
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const input = document.createElement('input');
                                                        input.type = 'file';
                                                        input.accept = 'image/*';
                                                        input.onchange = (ev: any) => {
                                                            const file = ev.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onload = (re) => {
                                                                    const n = [...top5Items];
                                                                    n[i].photo = re.target?.result as string;
                                                                    setTop5Items(n);
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        };
                                                        input.click();
                                                    }}
                                                    className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                                >
                                                    < ImageIcon className="w-3 h-3" /> {item.photo ? 'Modifier Photo' : 'Ajouter Photo'}
                                                </button>
                                                {item.photo && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const n = [...top5Items];
                                                            n[i].photo = '';
                                                            setTop5Items(n);
                                                        }}
                                                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <span className="text-[10px] font-black text-gray-500 uppercase">Contenu Texte</span>
                                <textarea
                                    ref={textAreaRef}
                                    value={customText}
                                    onSelect={(e) => {
                                        const t = e.target as HTMLTextAreaElement;
                                        setSelection({ start: t.selectionStart, end: t.selectionEnd });
                                    }}
                                    onChange={e => setCustomText(e.target.value.slice(0, 1100))}
                                    placeholder="VOTRE TEXTE..."
                                    className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold italic resize-none focus:border-neon-red outline-none transition-all shadow-inner shadow-black uppercase"
                                />
                                <p className="text-[9px] text-white/30 italic mt-1 px-4">Les codes comme [C:...] ou [B:...] seront transformés en style sur l'image finale.</p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-500 uppercase">Couleur Texte</label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="color"
                                                value={textColor}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onChange={e => handleTextStyler('C', e.target.value)}
                                                className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                                            />
                                            <span className="text-[10px] font-mono text-white/50">{textColor}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-500 uppercase">Fond Texte</label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="color"
                                                value={textBgColor === 'transparent' ? '#000000' : textBgColor}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onChange={e => handleTextStyler('B', e.target.value)}
                                                className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                                            />
                                            <button
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => { setTextBgColor('transparent'); setSelection({ start: 0, end: 0 }); }}
                                                className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase transition-all ${textBgColor === 'transparent' ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                                            >
                                                Aucun
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 mt-auto pb-8">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer group" onClick={() => setShowSwipe(!showSwipe)}>
                            <div className="flex items-center gap-3"><Layout className="w-4 h-4 text-gray-500" /><span className="text-[10px] font-black text-white uppercase">Afficher Swipe</span></div>
                            <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${showSwipe ? 'bg-neon-red border-neon-red shadow-[0_0_10px_rgba(255,18,65,0.4)]' : 'bg-black/40 border-white/20 group-hover:border-white/40'}`}>
                                {showSwipe && (
                                    <motion.svg initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </motion.svg>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            {activeTab === 'REEL' ? (
                                <button onClick={startVideoRecording} disabled={isVideoRecording} className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-3 transition-all ${isVideoRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-neon-red/10 border border-neon-red/30 text-neon-red hover:bg-neon-red/20'}`}><Video className="w-4 h-4" /> {isVideoRecording ? 'CAPTURE EN COURS...' : `Générer Vidéo Instagram (${theme})`}</button>
                            ) : (
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={addVisualToList} className="py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-white/10 transition-all"><PlusCircle className="w-3.5 h-3.5" /> Ajouter</button>
                                        <button onClick={downloadSingle} disabled={isDownloading} className="py-4 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-neon-cyan/20 transition-all"><Download className="w-3.5 h-3.5" /> Télécharger PNG</button>
                                    </div>
                                    <button onClick={startVideoRecording} disabled={isVideoRecording} className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-3 transition-all ${isVideoRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-neon-red/10 border border-neon-red/30 text-neon-red hover:bg-neon-red/20'}`}><Video className="w-4 h-4" /> {isVideoRecording ? 'CAPTURE EN COURS...' : `Générer Vidéo Instagram (${theme})`}</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Downloader Popup */}
            <AnimatePresence>
                {showDownloader && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[#0a0a0a] w-full max-w-5xl h-[85vh] rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">Social Downloader</h3>
                                <button onClick={() => setShowDownloader(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all"><X className="w-6 h-6" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <Downloader
                                    isPopup={true}
                                    onSelect={(url) => {
                                        const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('.webm') || url.includes('tiktok') || url.includes('googlevideo') || url.includes('video');
                                        if (isVideo) {
                                            const video = document.createElement('video');
                                            video.src = url;
                                            video.muted = true;
                                            video.loop = true;
                                            video.crossOrigin = "anonymous";
                                            video.play().catch(e => console.error("Auto-play failed", e));
                                            setBgVideo(video);
                                            setBgImage('');
                                        } else {
                                            setBgImage(url);
                                            setBgVideo(null);
                                        }
                                        setShowDownloader(false);
                                    }}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
