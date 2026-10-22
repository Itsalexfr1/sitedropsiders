import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Calendar, Sun, Moon, Plus, Trash2, Download, Smartphone, 
    Image as ImageIcon, Sparkles, ChevronLeft, Type, Upload, 
    EyeOff, Video, Play, RotateCcw, Film, Check, Zap, Wand2
} from 'lucide-react';

interface ScheduledEvent {
    id: string;
    type: 'day' | 'night';
    artist: string;
    location: string;
}

interface DaySchedule {
    id: string;
    date: string;
    events: ScheduledEvent[];
}

export type TextAnimationType = 'none' | 'fade' | 'slide' | 'glow' | 'cyber' | 'pop';

export function ScheduleVisualGenerator({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [schedule, setSchedule] = useState<DaySchedule[]>(() => {
        const saved = localStorage.getItem('dropsiders_schedule_data');
        return saved ? JSON.parse(saved) : [
            { id: '1', date: '', events: [
                { id: 'e1', type: 'day', artist: '', location: '' },
                { id: 'e2', type: 'night', artist: '', location: '' }
            ]}
        ];
    });
    const [showLogo, setShowLogo] = useState(() => localStorage.getItem('dropsiders_schedule_showLogo') !== 'false');
    const [showWebsite, setShowWebsite] = useState(() => localStorage.getItem('dropsiders_schedule_showWebsite') !== 'false');
    const [customTitle, setCustomTitle] = useState(() => localStorage.getItem('dropsiders_schedule_title') || 'PLANNING LIVETAKEOVER');
    const [festivalLogo, setFestivalLogo] = useState<string | null>(() => {
        try {
            return localStorage.getItem('dropsiders_schedule_festivalLogo');
        } catch {
            return null;
        }
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordProgress, setRecordProgress] = useState(0);

    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [backgroundVideo, setBackgroundVideo] = useState<string | null>(null);
    const [videoDuration, setVideoDuration] = useState<number>(8); // In seconds
    const [textAnimation, setTextAnimation] = useState<TextAnimationType>(() => {
        return (localStorage.getItem('dropsiders_schedule_animation') as TextAnimationType) || 'none';
    });
    const [animationKey, setAnimationKey] = useState(0);

    const [logoScale, setLogoScale] = useState(() => parseFloat(localStorage.getItem('dropsiders_schedule_logoScale') || '1.0'));
    const [viewMode, setViewMode] = useState<'planning' | 'timetable'>(() => (localStorage.getItem('dropsiders_schedule_mode') as any) || 'planning');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);
    const previewVideoRef = useRef<HTMLVideoElement>(null);

    // Persistence
    useEffect(() => {
        localStorage.setItem('dropsiders_schedule_data', JSON.stringify(schedule));
    }, [schedule]);

    useEffect(() => {
        localStorage.setItem('dropsiders_schedule_showLogo', String(showLogo));
    }, [showLogo]);

    useEffect(() => {
        try {
            if (festivalLogo) {
                localStorage.setItem('dropsiders_schedule_festivalLogo', festivalLogo);
            } else {
                localStorage.removeItem('dropsiders_schedule_festivalLogo');
            }
        } catch (e) {
            console.warn('LocalStorage error for festival logo:', e);
        }
    }, [festivalLogo]);

    useEffect(() => {
        localStorage.setItem('dropsiders_schedule_showWebsite', String(showWebsite));
    }, [showWebsite]);

    useEffect(() => {
        localStorage.setItem('dropsiders_schedule_title', customTitle);
    }, [customTitle]);

    useEffect(() => {
        localStorage.setItem('dropsiders_schedule_logoScale', String(logoScale));
    }, [logoScale]);

    useEffect(() => {
        localStorage.setItem('dropsiders_schedule_mode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        localStorage.setItem('dropsiders_schedule_animation', textAnimation);
    }, [textAnimation]);

    const addDay = () => {
        if (schedule.length >= 25) return;
        setSchedule([...schedule, { 
            id: Math.random().toString(), 
            date: '', 
            events: [
                { id: Math.random().toString(), type: 'day', artist: '', location: '' },
                { id: Math.random().toString(), type: 'night', artist: '', location: '' }
            ] 
        }]);
    };

    const addEventToDay = (dayId: string, type: 'day' | 'night') => {
        setSchedule(schedule.map(d => d.id === dayId ? {
            ...d,
            events: [...d.events, { id: Math.random().toString(), type, artist: '', location: '' }]
        } : d));
    };

    const removeEventFromDay = (dayId: string, eventId: string) => {
        setSchedule(schedule.map(d => d.id === dayId ? {
            ...d,
            events: d.events.filter(e => e.id !== eventId)
        } : d));
    };

    const updateEvent = (dayId: string, eventId: string, field: keyof ScheduledEvent, value: string) => {
        setSchedule(schedule.map(d => d.id === dayId ? {
            ...d,
            events: d.events.map(e => e.id === eventId ? { ...e, [field]: value } : e)
        } : d));
    };

    const removeDay = (id: string) => {
        setSchedule(schedule.filter(d => d.id !== id));
    };

    const updateDayDate = (id: string, date: string) => {
        setSchedule(schedule.map(d => d.id === id ? { ...d, date } : d));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const data = event.target?.result as string;
                setFestivalLogo(data);
                setShowLogo(true);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|mkv)$/i.test(file.name);
            if (isVideo) {
                // Use ObjectURL for instantaneous loading without memory crashes
                const url = URL.createObjectURL(file);
                setBackgroundVideo(url);
                setBackgroundImage(null);
            } else {
                const url = URL.createObjectURL(file);
                setBackgroundImage(url);
                setBackgroundVideo(null);
            }
        }
        e.target.value = '';
    };

    // Shared layout and rendering logic for both static PNG and video frames
    const renderSceneToCanvas = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        loadedBg: HTMLImageElement | HTMLVideoElement | null,
        loadedLogo: HTMLImageElement | null,
        activeSchedule: DaySchedule[],
        animProgress: number // 0 to 1
    ) => {
        ctx.clearRect(0, 0, width, height);

        // 1. Background
        if (loadedBg) {
            let bgW = 0;
            let bgH = 0;
            if (loadedBg instanceof HTMLImageElement) {
                bgW = loadedBg.width;
                bgH = loadedBg.height;
            } else if (loadedBg instanceof HTMLVideoElement) {
                bgW = loadedBg.videoWidth || loadedBg.width;
                bgH = loadedBg.videoHeight || loadedBg.height;
            }

            if (bgW > 0 && bgH > 0) {
                const scale = Math.max(width / bgW, height / bgH);
                const w = bgW * scale;
                const h = bgH * scale;
                ctx.drawImage(loadedBg, (width - w) / 2, (height - h) / 2, w, h);
            } else {
                ctx.drawImage(loadedBg, 0, 0, width, height);
            }

            // Stylish Dark Overlay (Gradient for depth)
            const overlay = ctx.createLinearGradient(0, 0, 0, height);
            overlay.addColorStop(0, 'rgba(0, 0, 0, 0.88)');    // Darker top for logo
            overlay.addColorStop(0.3, 'rgba(0, 0, 0, 0.65)');  // Lighter middle
            overlay.addColorStop(0.7, 'rgba(0, 0, 0, 0.65)');  // Lighter middle
            overlay.addColorStop(1, 'rgba(0, 0, 0, 0.92)');    // Darker bottom for website
            ctx.fillStyle = overlay;
            ctx.fillRect(0, 0, width, height);

            const vignette = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, height * 0.8);
            vignette.addColorStop(0, 'rgba(0,0,0,0)');
            vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, width, height);
        } else {
            const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
            bgGrad.addColorStop(0, '#0a0b12');
            bgGrad.addColorStop(0.5, '#1a0510');
            bgGrad.addColorStop(1, '#050a0f');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            // Tech particles
            ctx.globalAlpha = 0.05;
            for (let i = 0; i < 3000; i++) {
                ctx.fillStyle = i % 2 === 0 ? '#fff' : '#ff1241';
                ctx.fillRect((i * 137) % width, (i * 269) % height, 1.5, 1.5);
            }
            ctx.globalAlpha = 1.0;
        }

        // 2. Logo & Scaling Logic
        const numDays = activeSchedule.length;
        let currentLogoScale = logoScale;
        if (numDays > 4) {
            currentLogoScale = Math.min(logoScale, 1.2 - (numDays - 4) * 0.08);
        }
        currentLogoScale = Math.max(0.6, currentLogoScale);

        let logoHeightOffset = 0;
        if (showLogo && loadedLogo) {
            const baseWidth = 320;
            const logoW = baseWidth * currentLogoScale;
            const logoH = (loadedLogo.height / loadedLogo.width) * logoW;
            ctx.drawImage(loadedLogo, width / 2 - logoW / 2, 45, logoW, logoH);
            logoHeightOffset = logoH + 20;
        }

        // 3. Header Title (Safe width = 920px)
        ctx.textAlign = 'center';
        let headerY = showLogo ? 45 + logoHeightOffset + 35 : 130;
        const MAX_SAFE_WIDTH = 920; // 80px safe margin left and right

        if (customTitle && customTitle.trim()) {
            const rawTitle = customTitle.toUpperCase();
            let titleFontSize = 42;
            ctx.font = `900 italic ${titleFontSize}px "Montserrat", sans-serif`;
            const titleWidth = ctx.measureText(rawTitle).width;
            if (titleWidth > MAX_SAFE_WIDTH) {
                titleFontSize = Math.floor(titleFontSize * (MAX_SAFE_WIDTH / titleWidth));
                ctx.font = `900 italic ${titleFontSize}px "Montserrat", sans-serif`;
            }
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 10;
            ctx.fillText(rawTitle, width / 2, headerY);
            ctx.shadowBlur = 0;
        } else {
            headerY -= 30;
        }

        // 4. Calculate Content Height and determine Scale so nothing is ever cut off vertically
        const baseDateSize = 65;
        const baseEventSize = 46;
        const baseSpacing = 62;
        const baseDayGap = 50;

        let totalBaseHeight = 0;
        activeSchedule.forEach(day => {
            if (viewMode === 'planning' && day.date) {
                totalBaseHeight += baseDateSize * 1.5;
            }
            const visibleEvents = day.events.filter(e => e.artist || e.location);
            totalBaseHeight += visibleEvents.length * baseSpacing;
            totalBaseHeight += baseDayGap;
        });

        const footerHeight = 140;
        const startYOffset = (customTitle?.trim() ? 70 : 20);
        const startY = headerY + startYOffset;
        const availableHeight = height - startY - footerHeight;

        let scale = 1.0;
        if (totalBaseHeight > availableHeight) {
            scale = availableHeight / totalBaseHeight;
        }
        // Adaptive scale: allows down to 0.3 if necessary so large festival lineups NEVER get truncated
        scale = Math.max(0.28, Math.min(1.15, scale));

        const dateFontSize = baseDateSize * scale;
        const eventFontSize = baseEventSize * scale;
        const eventSpacing = baseSpacing * scale;
        const dayGap = baseDayGap * scale;

        const finalContentHeight = totalBaseHeight * scale;
        let runningY = startY + Math.max(0, (availableHeight - finalContentHeight) / 2);

        // Animation helper: returns alpha, yOffset, scale for an item index
        let totalItemsCount = 0;
        activeSchedule.forEach(d => {
            if (viewMode === 'planning' && d.date) totalItemsCount++;
            totalItemsCount += d.events.filter(e => e.artist || e.location).length;
        });

        let currentItemIndex = 0;

        const getItemAnimState = (index: number) => {
            if (textAnimation === 'none') {
                return { opacity: 1, offsetY: 0, scale: 1, glow: 0 };
            }
            // Stagger each item across the first 70% of total animation progress
            const staggerStep = Math.min(0.06, 0.65 / Math.max(1, totalItemsCount));
            const itemStart = index * staggerStep;
            const itemDuration = 0.25; // 25% of progress window
            const localP = Math.max(0, Math.min(1, (animProgress - itemStart) / itemDuration));

            switch (textAnimation) {
                case 'fade': {
                    return { opacity: localP, offsetY: (1 - localP) * 15, scale: 1, glow: 0 };
                }
                case 'slide': {
                    const eased = 1 - Math.pow(1 - localP, 3);
                    return { opacity: eased, offsetY: (1 - eased) * 45, scale: 1, glow: 0 };
                }
                case 'glow': {
                    const pulse = Math.sin(animProgress * Math.PI * 4 + index * 0.4);
                    return { 
                        opacity: localP, 
                        offsetY: 0, 
                        scale: 1, 
                        glow: localP > 0.5 ? Math.max(0, pulse * 18 + 12) : 0 
                    };
                }
                case 'pop': {
                    // Elastic scale pop
                    let sc = 1;
                    if (localP < 0.6) {
                        sc = localP * 1.8;
                    } else if (localP < 0.85) {
                        sc = 1.15 - (localP - 0.6) * 0.6;
                    } else {
                        sc = 1;
                    }
                    return { opacity: Math.min(1, localP * 2), offsetY: 0, scale: sc, glow: 0 };
                }
                case 'cyber': {
                    const eased = Math.floor(localP * 4) / 4; // stepped
                    return { opacity: eased > 0 ? 1 : 0, offsetY: (1 - localP) * 10, scale: 1, glow: localP > 0 ? 14 : 0 };
                }
                default:
                    return { opacity: 1, offsetY: 0, scale: 1, glow: 0 };
            }
        };

        // Render each Day & its Events
        activeSchedule.forEach((day: DaySchedule) => {
            const iconDay = viewMode === 'planning' ? '☀️ ' : '';
            const iconNight = viewMode === 'planning' ? '🌒 ' : '';

            // 1. Date Header
            if (viewMode === 'planning' && day.date) {
                const anim = getItemAnimState(currentItemIndex++);
                if (anim.opacity > 0) {
                    ctx.save();
                    ctx.globalAlpha = anim.opacity;
                    ctx.textAlign = 'center';

                    let curDateSize = dateFontSize * anim.scale;
                    ctx.font = `900 italic ${curDateSize}px "Orbitron", sans-serif`;
                    const dateW = ctx.measureText(day.date.toUpperCase()).width;
                    if (dateW > MAX_SAFE_WIDTH) {
                        curDateSize = Math.floor(curDateSize * (MAX_SAFE_WIDTH / dateW));
                        ctx.font = `900 italic ${curDateSize}px "Orbitron", sans-serif`;
                    }

                    ctx.fillStyle = '#ff1241';
                    ctx.shadowBlur = Math.max(15 * scale, anim.glow);
                    ctx.shadowColor = 'rgba(255, 18, 65, 0.7)';
                    ctx.fillText(day.date.toUpperCase(), width / 2, runningY + curDateSize + anim.offsetY);
                    ctx.restore();
                }
                runningY += dateFontSize * 1.5;
            }

            // 2. Events Rendering with Horizontal Overflow Protection
            if (viewMode === 'timetable') {
                day.events.forEach((evt) => {
                    const hourText = (evt.artist || '').toUpperCase();
                    const artistText = (evt.location || '').toUpperCase();
                    if (!hourText && !artistText) return;

                    const anim = getItemAnimState(currentItemIndex++);
                    if (anim.opacity > 0) {
                        ctx.save();
                        ctx.globalAlpha = anim.opacity;

                        const separator = hourText && artistText ? ' - ' : '';

                        // Measure at baseline eventFontSize
                        ctx.font = `900 italic ${eventFontSize}px "Montserrat", sans-serif`;
                        let hourW = hourText ? ctx.measureText(hourText).width : 0;

                        ctx.font = `900 ${eventFontSize}px "Montserrat", sans-serif`;
                        let sepW = separator ? ctx.measureText(separator).width : 0;

                        ctx.font = `900 ${eventFontSize}px "Orbitron", sans-serif`;
                        let artistW = artistText ? ctx.measureText(artistText).width : 0;

                        let totalRowW = hourW + sepW + artistW;
                        let lineScale = 1.0;
                        if (totalRowW > MAX_SAFE_WIDTH) {
                            lineScale = MAX_SAFE_WIDTH / totalRowW;
                        }

                        const effEventSize = eventFontSize * lineScale * anim.scale;
                        // Re-measure with scaled font
                        ctx.font = `900 italic ${effEventSize}px "Montserrat", sans-serif`;
                        hourW = hourText ? ctx.measureText(hourText).width : 0;
                        ctx.font = `900 ${effEventSize}px "Montserrat", sans-serif`;
                        sepW = separator ? ctx.measureText(separator).width : 0;
                        ctx.font = `900 ${effEventSize}px "Orbitron", sans-serif`;
                        artistW = artistText ? ctx.measureText(artistText).width : 0;

                        totalRowW = hourW + sepW + artistW;
                        let curX = (width - totalRowW) / 2;
                        const textY = runningY + eventSpacing / 2 + anim.offsetY;

                        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                        ctx.shadowBlur = Math.max(10 * scale, anim.glow);
                        ctx.shadowOffsetY = 2 * scale;

                        if (hourText) {
                            ctx.textAlign = 'left';
                            ctx.font = `900 italic ${effEventSize}px "Montserrat", sans-serif`;
                            ctx.fillStyle = '#ff1241';
                            ctx.fillText(hourText, curX, textY);
                            curX += hourW;
                        }
                        if (separator) {
                            ctx.textAlign = 'left';
                            ctx.font = `900 ${effEventSize}px "Montserrat", sans-serif`;
                            ctx.fillStyle = '#ffffff';
                            ctx.fillText(separator, curX, textY);
                            curX += sepW;
                        }
                        if (artistText) {
                            ctx.textAlign = 'left';
                            ctx.font = `900 ${effEventSize}px "Orbitron", sans-serif`;
                            ctx.fillStyle = '#ffffff';
                            ctx.fillText(artistText, curX, textY);
                        }
                        ctx.restore();
                    }
                    runningY += eventSpacing;
                });
            } else {
                day.events.forEach(evt => {
                    if (!evt.artist) return;
                    const anim = getItemAnimState(currentItemIndex++);
                    if (anim.opacity > 0) {
                        ctx.save();
                        ctx.globalAlpha = anim.opacity;

                        const icon = evt.type === 'day' ? iconDay : iconNight;
                        const artistText = (icon + evt.artist).toUpperCase();
                        const locText = evt.location ? evt.location.toUpperCase() : '';

                        // Measure
                        ctx.font = `900 ${eventFontSize}px "Montserrat", sans-serif`;
                        let artW = ctx.measureText(artistText).width;
                        ctx.font = `600 italic ${eventFontSize * 0.7}px "Montserrat", sans-serif`;
                        let locW = locText ? ctx.measureText(locText).width : 0;
                        const gap = locText ? 18 * scale : 0;

                        let totalRowW = artW + gap + locW;
                        let lineScale = 1.0;
                        if (totalRowW > MAX_SAFE_WIDTH) {
                            lineScale = MAX_SAFE_WIDTH / totalRowW;
                        }

                        const effEventSize = eventFontSize * lineScale * anim.scale;
                        const effLocSize = effEventSize * 0.7;
                        const effGap = locText ? 18 * scale * lineScale : 0;

                        ctx.font = `900 ${effEventSize}px "Montserrat", sans-serif`;
                        artW = ctx.measureText(artistText).width;
                        ctx.font = `600 italic ${effLocSize}px "Montserrat", sans-serif`;
                        locW = locText ? ctx.measureText(locText).width : 0;
                        totalRowW = artW + effGap + locW;

                        const startX = (width - totalRowW) / 2;
                        const textY = runningY + eventSpacing / 2 + anim.offsetY;

                        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                        ctx.shadowBlur = Math.max(12 * scale, anim.glow);
                        ctx.shadowOffsetY = 3 * scale;

                        ctx.textAlign = 'left';
                        ctx.font = `900 ${effEventSize}px "Montserrat", sans-serif`;
                        ctx.fillStyle = '#ffffff';
                        ctx.fillText(artistText, startX, textY);

                        if (locText) {
                            ctx.font = `600 italic ${effLocSize}px "Montserrat", sans-serif`;
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
                            ctx.fillText(locText, startX + artW + effGap, textY);
                        }
                        ctx.restore();
                    }
                    runningY += eventSpacing;
                });
            }
            runningY += dayGap;
        });

        // 5. Footer (Website Branding)
        if (showWebsite) {
            ctx.textAlign = 'center';
            ctx.font = '900 24px "Orbitron", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.letterSpacing = '10px';
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.fillText('DROPSIDERS.FR', width / 2, height - 90);
            ctx.shadowBlur = 0;
        }
    };

    // Load background asset (Image or Video)
    const loadBackgroundAsset = async (): Promise<HTMLImageElement | HTMLVideoElement | null> => {
        if (backgroundImage) {
            const bgImg = new Image();
            bgImg.crossOrigin = 'anonymous';
            bgImg.src = backgroundImage;
            await new Promise((resolve) => { bgImg.onload = resolve; bgImg.onerror = resolve; });
            return bgImg.complete ? bgImg : null;
        } else if (backgroundVideo) {
            const video = document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.src = backgroundVideo;
            video.muted = true;
            video.playsInline = true;
            await new Promise((resolve) => {
                video.onloadeddata = resolve;
                video.onerror = resolve;
                video.currentTime = 0.1;
            });
            return video;
        }
        return null;
    };

    const loadLogoAsset = async (): Promise<HTMLImageElement | null> => {
        if (!showLogo) return null;
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        logo.src = festivalLogo || '/Logo.png';
        await new Promise((resolve) => { logo.onload = resolve; logo.onerror = resolve; });
        return logo.complete ? logo : null;
    };

    // 1. GENERATE STATIC PNG (High Res 1080x1920)
    const generateImage = async () => {
        setIsGenerating(true);
        try {
            const width = 1080;
            const height = 1920;
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;

            const activeSchedule = schedule.filter(d => d.date || d.events.some(e => e.artist || e.location));
            if (activeSchedule.length === 0) {
                setIsGenerating(false);
                return;
            }

            if (document.fonts) {
                try { await document.fonts.ready; } catch (e) { console.warn(e); }
            }

            const [loadedBg, loadedLogo] = await Promise.all([
                loadBackgroundAsset(),
                loadLogoAsset()
            ]);

            // animProgress = 1.0 (fully revealed)
            renderSceneToCanvas(ctx, width, height, loadedBg, loadedLogo, activeSchedule, 1.0);

            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `dropsiders-planning-${schedule[0]?.date || 'schedule'}.png`;
            link.click();
        } catch (err) {
            console.error('Error generating image:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    // 2. GENERATE ANIMATED VIDEO STORY (MP4 / WebM)
    const generateVideo = async () => {
        setIsRecording(true);
        setRecordProgress(0);

        try {
            const width = 1080;
            const height = 1920;
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;

            const activeSchedule = schedule.filter(d => d.date || d.events.some(e => e.artist || e.location));
            if (activeSchedule.length === 0) {
                setIsRecording(false);
                return;
            }

            if (document.fonts) {
                try { await document.fonts.ready; } catch (e) { console.warn(e); }
            }

            const [loadedBg, loadedLogo] = await Promise.all([
                loadBackgroundAsset(),
                loadLogoAsset()
            ]);

            // Start playing background video if present
            if (loadedBg instanceof HTMLVideoElement) {
                loadedBg.currentTime = 0;
                loadedBg.loop = true;
                try { await loadedBg.play(); } catch (e) { console.warn(e); }
            }

            // Setup MediaRecorder
            const stream = canvas.captureStream(30);
            let mimeType = 'video/webm';
            if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
                mimeType = 'video/mp4;codecs=avc1';
            } else if (MediaRecorder.isTypeSupported('video/mp4')) {
                mimeType = 'video/mp4';
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                mimeType = 'video/webm;codecs=vp9';
            }

            const chunks: Blob[] = [];
            const recorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: 8000000 // 8 Mbps high quality
            });

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
            };

            const recordPromise = new Promise<Blob>((resolve) => {
                recorder.onstop = () => {
                    resolve(new Blob(chunks, { type: mimeType.includes('mp4') ? 'video/mp4' : 'video/webm' }));
                };
            });

            recorder.start(100);

            const durationMs = videoDuration * 1000;
            const startTime = performance.now();

            await new Promise<void>((resolve) => {
                const renderFrame = (now: number) => {
                    const elapsed = now - startTime;
                    const progress = Math.min(1.0, elapsed / durationMs);

                    setRecordProgress(Math.round(progress * 100));

                    // Render scene at current progress
                    renderSceneToCanvas(ctx, width, height, loadedBg, loadedLogo, activeSchedule, progress);

                    if (elapsed < durationMs) {
                        requestAnimationFrame(renderFrame);
                    } else {
                        recorder.stop();
                        if (loadedBg instanceof HTMLVideoElement) {
                            loadedBg.pause();
                        }
                        resolve();
                    }
                };
                requestAnimationFrame(renderFrame);
            });

            const blob = await recordPromise;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
            a.download = `dropsiders-planning-story-${schedule[0]?.date || 'story'}.${ext}`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        } catch (err) {
            console.error('Video generation failed:', err);
        } finally {
            setIsRecording(false);
            setRecordProgress(0);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-5xl bg-gray-900 border border-white/10 rounded-[2.5rem] flex flex-col max-h-[95vh] overflow-hidden shadow-2xl">
                    
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                        <div className="flex items-center gap-4">
                            <button onClick={onClose} className="p-3 bg-neon-cyan/20 hover:bg-neon-cyan text-white hover:text-black rounded-2xl border border-neon-cyan/30 transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-widest group">
                                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                RETOUR
                            </button>
                            <div className="p-3 bg-neon-cyan/10 rounded-2xl border border-neon-cyan/20">
                                <Calendar className="w-6 h-6 text-neon-cyan" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tighter">Planning <span className="text-neon-cyan">Story Generator</span></h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Créez des visuels & vidéos de programmation pour Instagram</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            
                            {/* Left Column: Controls & Schedule inputs */}
                            <div className="space-y-6">
                                <div className="flex flex-col gap-4 mb-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Options du Visuel</h3>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button 
                                                onClick={() => setShowLogo(!showLogo)} 
                                                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[9px] font-black uppercase transition-all ${
                                                    showLogo 
                                                        ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_12px_rgba(0,255,255,0.25)]' 
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                                                }`}
                                            >
                                                <ImageIcon className={`w-3 h-3 ${showLogo ? 'text-neon-cyan' : 'text-gray-400'}`} /> Logo: {showLogo ? 'OUI' : 'NON'}
                                            </button>
                                            <button 
                                                onClick={() => setShowWebsite(!showWebsite)} 
                                                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[9px] font-black uppercase transition-all ${
                                                    showWebsite 
                                                        ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_12px_rgba(0,255,255,0.25)]' 
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                                                }`}
                                            >
                                                <Smartphone className={`w-3 h-3 ${showWebsite ? 'text-neon-cyan' : 'text-gray-400'}`} /> Site: {showWebsite ? 'OUI' : 'NON'}
                                            </button>
                                            <button 
                                                onClick={() => setViewMode(viewMode === 'planning' ? 'timetable' : 'planning')} 
                                                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[9px] font-black uppercase transition-all ${
                                                    viewMode === 'planning' 
                                                        ? 'bg-white/10 border-white/20 text-white' 
                                                        : 'bg-neon-cyan border-neon-cyan text-black font-extrabold shadow-[0_0_15px_rgba(0,255,255,0.3)]'
                                                }`}
                                            >
                                                <Calendar className={`w-3 h-3 ${viewMode === 'timetable' ? 'text-black' : 'text-neon-cyan'}`} /> Mode: {viewMode === 'planning' ? 'DATE' : 'HEURE'}
                                            </button>
                                            <button onClick={addDay} disabled={schedule.length >= 25} className="flex items-center gap-2 px-3 py-1.5 bg-neon-cyan text-black text-[9px] font-black uppercase rounded-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                                                <Plus className="w-3 h-3" /> Ajouter ({schedule.length}/25)
                                            </button>
                                        </div>
                                    </div>

                                    {/* Title input */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Type className="w-3 h-3 text-neon-cyan" /> Titre du Planning
                                        </label>
                                        <input type="text" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan outline-none transition-all font-bold italic" placeholder="PLANNING LIVETAKEOVER" />
                                    </div>

                                    {/* Assets upload: Logo + Background (Image / Video) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                    <ImageIcon className="w-3 h-3 text-neon-cyan" /> Logo du Festival
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    {!showLogo && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowLogo(true)}
                                                            className="text-[9px] font-bold text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <EyeOff className="w-2.5 h-2.5 text-amber-400" /> Masqué
                                                        </button>
                                                    )}
                                                    <span className="text-neon-cyan text-[10px] font-bold">{Math.round(logoScale * 100)}%</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => {
                                                        setShowLogo(true);
                                                        fileInputRef.current?.click();
                                                    }} 
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 hover:border-neon-cyan/40 rounded-xl text-[10px] font-black text-white hover:bg-white/10 transition-all uppercase"
                                                >
                                                    <Upload className="w-4 h-4 text-neon-cyan" /> {festivalLogo ? 'Changer' : 'Upload'}
                                                </button>
                                                <input type="range" min="0.5" max="2.5" step="0.1" value={logoScale} onChange={(e) => setLogoScale(parseFloat(e.target.value))} className="w-24 accent-neon-cyan cursor-pointer" />
                                                {festivalLogo && <button onClick={() => setFestivalLogo(null)} className="p-3 bg-neon-red/20 border border-neon-red/30 rounded-xl text-neon-red hover:bg-neon-red/30 transition-all" title="Supprimer le logo"><Trash2 className="w-4 h-4" /></button>}
                                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                    {backgroundVideo ? <Video className="w-3 h-3 text-neon-red animate-pulse" /> : <ImageIcon className="w-3 h-3 text-neon-cyan" />}
                                                    Fond (Image ou Vidéo)
                                                </label>
                                                {backgroundVideo && (
                                                    <span className="text-[9px] font-black text-neon-red bg-neon-red/10 border border-neon-red/30 px-2 py-0.5 rounded-full uppercase">
                                                        Vidéo Active
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => bgInputRef.current?.click()} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white hover:bg-white/10 transition-all uppercase ${backgroundImage || backgroundVideo ? 'border-neon-cyan/50 text-neon-cyan' : ''}`}>
                                                    <Upload className="w-4 h-4 text-neon-cyan" /> {backgroundVideo ? 'Changer Vidéo' : backgroundImage ? 'Changer Image' : 'Upload Image / Vidéo'}
                                                </button>
                                                {(backgroundImage || backgroundVideo) && (
                                                    <button onClick={() => { setBackgroundImage(null); setBackgroundVideo(null); }} className="p-3 bg-neon-red/20 border border-neon-red/30 rounded-xl text-neon-red hover:bg-neon-red/30 transition-all" title="Supprimer le fond">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <input ref={bgInputRef} type="file" accept="image/*,video/mp4,video/quicktime,video/webm,video/*" onChange={handleBackgroundUpload} className="hidden" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Text Animation Choice Section */}
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Wand2 className="w-4 h-4 text-neon-cyan" />
                                                <span className="text-xs font-black text-white uppercase tracking-wider">Animation des Textes</span>
                                            </div>
                                            <button 
                                                onClick={() => setAnimationKey(k => k + 1)}
                                                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-neon-cyan/20 border border-white/10 hover:border-neon-cyan/40 rounded-lg text-[9px] font-black uppercase text-gray-300 hover:text-neon-cyan transition-all"
                                                title="Rejouer l'animation dans l'aperçu"
                                            >
                                                <RotateCcw className="w-3 h-3" /> Rejouer
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: 'none', label: 'Statique', icon: X, desc: 'Pas d\'animation' },
                                                { id: 'fade', label: 'Cascade Fondu', icon: Sparkles, desc: 'Apparition progressive' },
                                                { id: 'slide', label: 'Slide Up', icon: Zap, desc: 'Montée fluide' },
                                                { id: 'glow', label: 'Pulsation Néon', icon: Film, desc: 'Lueur cyber' },
                                                { id: 'pop', label: 'Zoom Punchy', icon: Play, desc: 'Impact festival' },
                                                { id: 'cyber', label: 'Cyber Glitch', icon: Wand2, desc: 'Reveal futuriste' },
                                            ].map((anim) => {
                                                const isSel = textAnimation === anim.id;
                                                const IconComp = anim.icon;
                                                return (
                                                    <button
                                                        key={anim.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setTextAnimation(anim.id as TextAnimationType);
                                                            setAnimationKey(k => k + 1);
                                                        }}
                                                        className={`flex flex-col items-start p-2.5 rounded-xl border transition-all text-left ${
                                                            isSel 
                                                                ? 'bg-neon-cyan/20 border-neon-cyan text-white shadow-[0_0_15px_rgba(0,255,255,0.2)]' 
                                                                : 'bg-black/30 border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between w-full mb-1">
                                                            <IconComp className={`w-3.5 h-3.5 ${isSel ? 'text-neon-cyan' : 'text-gray-400'}`} />
                                                            {isSel && <Check className="w-3 h-3 text-neon-cyan" />}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-tight">{anim.label}</span>
                                                        <span className="text-[8px] text-gray-500 font-medium">{anim.desc}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Video Duration selector (when video background or animations active) */}
                                        {(backgroundVideo || textAnimation !== 'none') && (
                                            <div className="pt-2 flex items-center justify-between border-t border-white/5">
                                                <span className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1.5">
                                                    <Film className="w-3 h-3 text-neon-cyan" /> Durée Export Vidéo
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    {[5, 8, 10, 15].map((sec) => (
                                                        <button
                                                            key={sec}
                                                            type="button"
                                                            onClick={() => setVideoDuration(sec)}
                                                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-all ${
                                                                videoDuration === sec 
                                                                    ? 'bg-neon-cyan text-black' 
                                                                    : 'bg-white/5 text-gray-400 hover:text-white'
                                                            }`}
                                                        >
                                                            {sec}s
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Dates & Events Section */}
                                <h3 className="text-sm font-black text-white uppercase italic tracking-widest mb-4">Dates & Événements</h3>
                                <div className="space-y-4">
                                    {schedule.map((day, idx) => (
                                        <motion.div layout key={day.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 relative group">
                                            <button onClick={() => removeDay(day.id)} className="absolute -top-2 -right-2 w-8 h-8 bg-neon-red text-white flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div className="grid grid-cols-1 gap-4">
                                                {viewMode === 'planning' && (
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-gray-500 uppercase ml-2 tracking-[0.2em]">Jour {idx + 1} - Date (ex: 13 Mai)</label>
                                                        <input type="text" value={day.date} onChange={(e) => updateDayDate(day.id, e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan outline-none transition-all italic font-bold" />
                                                    </div>
                                                )}
                                                <div className="space-y-4">
                                                    {day.events.map((evt) => (
                                                        <div key={evt.id} className="flex flex-col gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl relative group/evt">
                                                            <button onClick={() => removeEventFromDay(day.id, evt.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500/20 text-red-500 rounded-lg opacity-0 group-hover/evt:opacity-100 transition-all hover:bg-red-500 hover:text-white"><X className="w-3 h-3" /></button>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <div className={`px-2 py-1 rounded text-[7px] font-black uppercase tracking-widest ${evt.type === 'day' ? 'bg-amber-400/10 text-amber-400' : 'bg-indigo-400/10 text-indigo-400'}`}>
                                                                    {evt.type === 'day' ? <Sun className="w-2 h-2 inline mr-1" /> : <Moon className="w-2 h-2 inline mr-1" />}
                                                                    {evt.type === 'day' ? 'JOUR' : 'NUIT'}
                                                                </div>
                                                                <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Événement</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-1">
                                                                    <label className="text-[8px] font-black text-gray-400 uppercase ml-1 tracking-widest">{viewMode === 'planning' ? 'Artiste' : 'Heure'}</label>
                                                                    <input type="text" value={evt.artist} onChange={(e) => updateEvent(day.id, evt.id, 'artist', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-neon-cyan outline-none" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[8px] font-black text-gray-400 uppercase ml-1 tracking-widest">{viewMode === 'planning' ? 'Lieu / Stage' : 'Artiste / Stage'}</label>
                                                                    <input type="text" value={evt.location} onChange={(e) => updateEvent(day.id, evt.id, 'location', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-neon-cyan outline-none" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="flex gap-3 pt-2">
                                                        <button onClick={() => addEventToDay(day.id, 'day')} className="flex-1 py-3 bg-amber-400/5 border border-amber-400/20 rounded-xl text-amber-400 text-[8px] font-black uppercase tracking-widest hover:bg-amber-400/10 transition-all flex items-center justify-center gap-2"><Plus className="w-3 h-3" /> Event Jour</button>
                                                        <button onClick={() => addEventToDay(day.id, 'night')} className="flex-1 py-3 bg-indigo-400/5 border border-indigo-400/20 rounded-xl text-indigo-400 text-[8px] font-black uppercase tracking-widest hover:bg-indigo-400/10 transition-all flex items-center justify-center gap-2"><Plus className="w-3 h-3" /> Event Nuit</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Column: Live Phone Mockup & Export Buttons */}
                            <div className="relative">
                                <div className="sticky top-0 space-y-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Aperçu Story 9:16</h3>
                                            {backgroundVideo && <span className="px-2 py-0.5 bg-neon-red/10 border border-neon-red/30 rounded text-[8px] font-black text-neon-red uppercase">Vidéo</span>}
                                            {textAnimation !== 'none' && <span className="px-2 py-0.5 bg-neon-cyan/10 border border-neon-cyan/30 rounded text-[8px] font-black text-neon-cyan uppercase">{textAnimation}</span>}
                                        </div>
                                        <button
                                            onClick={() => setAnimationKey(k => k + 1)}
                                            className="text-gray-400 hover:text-white text-[9px] font-bold uppercase flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg transition-all"
                                            title="Rejouer l'animation"
                                        >
                                            <RotateCcw className="w-3 h-3" /> Rejouer
                                        </button>
                                    </div>

                                    {/* Mockup Phone Frame */}
                                    <div className="aspect-[9/19.2] w-full max-w-[360px] mx-auto bg-black rounded-[3.2rem] border-[8px] border-[#181818] shadow-[0_0_50px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col p-5 text-white scale-[0.62] origin-top transition-all duration-500 hover:scale-[0.64] group">
                                        
                                        {/* Background Layer */}
                                        {backgroundImage || backgroundVideo ? (
                                            <div className="absolute inset-0">
                                                {backgroundImage ? (
                                                    <img src={backgroundImage} alt="Background" className="w-full h-full object-cover" />
                                                ) : (
                                                    <video 
                                                        ref={previewVideoRef}
                                                        src={backgroundVideo!} 
                                                        autoPlay 
                                                        muted 
                                                        loop 
                                                        playsInline 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/60 to-black/90 pointer-events-none" />
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0b12] via-[#1a0510] to-[#050a0f]" />
                                        )}

                                        {/* Dynamic Content Container */}
                                        <div key={animationKey} className="relative z-10 flex flex-col h-full justify-between overflow-hidden">
                                            
                                            {/* Dynamic Island / Notch */}
                                            <div className="w-20 h-5 bg-black rounded-full mx-auto mb-4 flex items-center justify-center border border-white/5 shadow-inner shrink-0">
                                                <div className="w-2 h-2 bg-[#222] rounded-full mr-2" />
                                                <div className="w-8 h-1 bg-[#222] rounded-full" />
                                            </div>

                                            {/* Header: Logo */}
                                            {showLogo && (
                                                <div className="flex flex-col items-center justify-center mb-3 shrink-0" style={{ minHeight: `${Math.round(38 * logoScale)}px` }}>
                                                    <img
                                                        src={festivalLogo || '/Logo.png'}
                                                        alt="Logo"
                                                        className="object-contain transition-all"
                                                        style={{
                                                            height: `${Math.round(38 * logoScale)}px`,
                                                            maxWidth: '85%'
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            {/* Header: Custom Title */}
                                            {customTitle && customTitle.trim() && (
                                                <div className="text-center mb-3 px-2 shrink-0">
                                                    <div className="text-[13px] font-black text-white italic uppercase tracking-wider truncate">
                                                        {customTitle}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Schedule items with auto-fit layout & animations */}
                                            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col justify-center space-y-3 py-1 px-1">
                                                {schedule.map((day, dIdx) => (
                                                    <motion.div 
                                                        key={day.id} 
                                                        initial={
                                                            textAnimation === 'slide' ? { opacity: 0, y: 15 } :
                                                            textAnimation === 'fade' ? { opacity: 0 } :
                                                            textAnimation === 'pop' ? { opacity: 0, scale: 0.8 } :
                                                            textAnimation === 'cyber' ? { opacity: 0, x: -10 } :
                                                            { opacity: 1 }
                                                        }
                                                        animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                                                        transition={{ duration: 0.4, delay: textAnimation !== 'none' ? dIdx * 0.12 : 0 }}
                                                        className="space-y-1 text-center"
                                                    >
                                                        {viewMode === 'planning' && (
                                                            <div className={`text-[13px] font-black text-neon-red italic uppercase tracking-tight ${textAnimation === 'glow' ? 'animate-pulse' : ''}`}>
                                                                {day.date || 'DATE'}
                                                            </div>
                                                        )}
                                                        <div className="space-y-1">
                                                            {day.events.map((evt, eIdx) => (
                                                                <motion.div 
                                                                    key={evt.id} 
                                                                    initial={
                                                                        textAnimation === 'slide' ? { opacity: 0, y: 10 } :
                                                                        textAnimation === 'fade' ? { opacity: 0 } :
                                                                        textAnimation === 'pop' ? { opacity: 0, scale: 0.85 } :
                                                                        { opacity: 1 }
                                                                    }
                                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                    transition={{ duration: 0.35, delay: textAnimation !== 'none' ? (dIdx * 0.12) + (eIdx * 0.06) : 0 }}
                                                                    className="flex items-center justify-center flex-wrap gap-1 px-1"
                                                                >
                                                                    {viewMode === 'planning' ? (
                                                                        <>
                                                                            <span className={`text-[11px] text-white font-extrabold uppercase tracking-tight ${textAnimation === 'glow' ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : ''}`}>
                                                                                {evt.type === 'day' ? '☀️' : '🌒'} {evt.artist || '...'}
                                                                            </span>
                                                                            {evt.location && (
                                                                                <span className="text-[9px] text-white/50 italic uppercase font-semibold">
                                                                                    {evt.location}
                                                                                </span>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <div className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wide">
                                                                            {evt.artist && <span className="text-neon-red italic font-extrabold">{evt.artist}</span>}
                                                                            {evt.artist && evt.location && <span className="text-white/30">-</span>}
                                                                            {evt.location && <span className="font-display text-white">{evt.location}</span>}
                                                                        </div>
                                                                    )}
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {/* Footer Branding */}
                                            {showWebsite && (
                                                <div className="pt-2 pb-1 shrink-0 flex flex-col items-center">
                                                    <div className="text-[9px] font-black text-white uppercase tracking-[0.4em]">DROPSIDERS.FR</div>
                                                    <div className="w-12 h-0.5 bg-neon-cyan/40 mt-1" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons: Dual Export (Image PNG + Animated Video) */}
                                    <div className="space-y-3 pt-2">
                                        {/* Progress indicator during video generation */}
                                        {isRecording && (
                                            <div className="p-4 bg-neon-cyan/10 border border-neon-cyan/30 rounded-2xl space-y-2">
                                                <div className="flex items-center justify-between text-xs font-black uppercase text-neon-cyan">
                                                    <span className="flex items-center gap-2">
                                                        <Sparkles className="w-4 h-4 animate-spin" /> Rendu de la vidéo Story...
                                                    </span>
                                                    <span>{recordProgress}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-neon-cyan transition-all duration-200" 
                                                        style={{ width: `${recordProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {/* PNG Image Download */}
                                            <button 
                                                onClick={generateImage} 
                                                disabled={isGenerating || isRecording} 
                                                className="h-14 bg-white text-black font-black uppercase tracking-wider text-[11px] rounded-2xl hover:bg-neon-cyan transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95 disabled:opacity-50 cursor-pointer"
                                            >
                                                {isGenerating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                                Image (PNG)
                                            </button>

                                            {/* Animated Video Story Export */}
                                            <button 
                                                onClick={generateVideo} 
                                                disabled={isGenerating || isRecording} 
                                                className="h-14 bg-gradient-to-r from-neon-red to-neon-purple text-white font-black uppercase tracking-wider text-[11px] rounded-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,18,65,0.3)] active:scale-95 disabled:opacity-50 cursor-pointer border border-white/20"
                                            >
                                                {isRecording ? <Sparkles className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4 text-neon-cyan" />}
                                                Story Vidéo ({videoDuration}s)
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            </div>

                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
