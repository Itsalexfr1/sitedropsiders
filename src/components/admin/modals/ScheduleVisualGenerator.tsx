import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Sun, Moon, Plus, Trash2, Download, Smartphone, Image as ImageIcon, Sparkles, ChevronRight, Type, Upload, ChevronLeft } from 'lucide-react';

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

export function ScheduleVisualGenerator({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [schedule, setSchedule] = useState<DaySchedule[]>([
        { id: '1', date: '', events: [
            { id: 'e1', type: 'day', artist: '', location: '' },
            { id: 'e2', type: 'night', artist: '', location: '' }
        ]}
    ]);
    const [showLogo, setShowLogo] = useState(true);
    const [showWebsite, setShowWebsite] = useState(true);
    const [customTitle, setCustomTitle] = useState('PLANNING LIVETAKEOVER');
    const [festivalLogo, setFestivalLogo] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [backgroundVideo, setBackgroundVideo] = useState<string | null>(null);
    const [logoScale, setLogoScale] = useState(1.0);
    const [viewMode, setViewMode] = useState<'planning' | 'timetable'>('planning');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);

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
                setFestivalLogo(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const isVideo = file.type.startsWith('video/');
            const reader = new FileReader();
            reader.onload = (event) => {
                if (isVideo) {
                    setBackgroundVideo(event.target?.result as string);
                    setBackgroundImage(null);
                } else {
                    setBackgroundImage(event.target?.result as string);
                    setBackgroundVideo(null);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const generateImage = async () => {
        setIsGenerating(true);
        const width = 1080;
        const height = 1920;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        // 1. Filter active days to avoid wasting space
        const activeSchedule = schedule.filter(d => d.date || d.events.some(e => e.artist || e.location));
        const numDays = activeSchedule.length;
        if (numDays === 0) {
            setIsGenerating(false);
            return;
        }

        // 2. Wait for fonts to ensure correct metrics and rendering
        if (document.fonts) {
            try {
                await document.fonts.ready;
            } catch (e) {
                console.warn("Font loading failed, proceeding with fallbacks", e);
            }
        }

        // 1. Background
        if (backgroundImage || backgroundVideo) {
            if (backgroundImage) {
                const bgImg = new Image();
                bgImg.src = backgroundImage;
                await new Promise((resolve) => { bgImg.onload = resolve; bgImg.onerror = resolve; });
                if (bgImg.complete) {
                    // Cover logic
                    const scale = Math.max(width / bgImg.width, height / bgImg.height);
                    const w = bgImg.width * scale;
                    const h = bgImg.height * scale;
                    ctx.drawImage(bgImg, (width - w) / 2, (height - h) / 2, w, h);
                }
            } else if (backgroundVideo) {
                const video = document.createElement('video');
                video.src = backgroundVideo;
                await new Promise((resolve) => { 
                    video.onloadeddata = resolve; 
                    video.onerror = resolve; 
                    video.currentTime = 0;
                });
                // Cover logic for video
                const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
                const w = video.videoWidth * scale;
                const h = video.videoHeight * scale;
                ctx.drawImage(video, (width - w) / 2, (height - h) / 2, w, h);
            }

            // Stylish Dark Overlay (Gradient for depth)
            const overlay = ctx.createLinearGradient(0, 0, 0, height);
            overlay.addColorStop(0, 'rgba(0, 0, 0, 0.85)');    // Darker top for logo
            overlay.addColorStop(0.3, 'rgba(0, 0, 0, 0.6)');  // Lighter middle
            overlay.addColorStop(0.7, 'rgba(0, 0, 0, 0.6)');  // Lighter middle
            overlay.addColorStop(1, 'rgba(0, 0, 0, 0.9)');    // Darker bottom for website
            ctx.fillStyle = overlay;
            ctx.fillRect(0, 0, width, height);

            const vignette = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, height);
            vignette.addColorStop(0, 'rgba(0,0,0,0)');
            vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, width, height);
        } else {
            const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
            bgGrad.addColorStop(0, '#0a0b12');
            bgGrad.addColorStop(0.5, '#1a0510');
            bgGrad.addColorStop(1, '#050a0f');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            ctx.globalAlpha = 0.05;
            for (let i = 0; i < 5000; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#ff1241';
                ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
            }
            ctx.globalAlpha = 1.0;
        }

        // 3. Logo & Scaling Logic
        let currentLogoScale = logoScale;
        if (numDays > 5) {
            currentLogoScale = Math.min(logoScale, 1.4 - (numDays - 5) * 0.1);
        }

        // 4. Header & Vertical Placement
        let logoHeightOffset = 0;
        if (showLogo) {
            const logo = new Image();
            logo.src = festivalLogo || '/Logo.png';
            await new Promise((resolve) => { logo.onload = resolve; logo.onerror = resolve; });
            if (logo.complete) {
                const baseWidth = 350;
                const logoW = baseWidth * currentLogoScale;
                const logoH = (logo.height / logo.width) * logoW;
                ctx.drawImage(logo, width / 2 - logoW / 2, 40, logoW, logoH);
                logoHeightOffset = logoH + 20;
            }
        }

        ctx.textAlign = 'center';
        let headerY = showLogo ? 40 + logoHeightOffset + 40 : 140;
        
        if (customTitle && customTitle.trim()) {
            ctx.font = '900 italic 45px "Montserrat", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(customTitle.toUpperCase(), width / 2, headerY);
        } else {
            headerY -= 40;
        }

        // 4. Calculate Content Height and determine Scale
        const baseDateSize = 75;
        const baseEventSize = 50;
        const baseSpacing = 70;
        const baseDayGap = 60; // Increased gap for better day separation
        
        let totalBaseHeight = 0;
        activeSchedule.forEach(day => {
            if (viewMode === 'planning') {
                if (day.date) totalBaseHeight += baseDateSize * 1.2;
                const visibleEvents = day.events.filter(e => e.artist);
                totalBaseHeight += visibleEvents.length * baseSpacing;
            } else {
                const visibleEvents = day.events.filter(e => e.artist || e.location);
                totalBaseHeight += visibleEvents.length * baseSpacing;
            }
            totalBaseHeight += baseDayGap;
        });

        const footerHeight = 150;
        const startYOffset = (customTitle?.trim() ? 100 : 20);
        const startY = headerY + startYOffset;
        const availableHeight = height - startY - footerHeight;

        let scale = 1.0;
        if (totalBaseHeight > availableHeight) {
            scale = availableHeight / totalBaseHeight;
        }
        
        // Minimum scale to keep it legible, maximum to avoid huge text
        scale = Math.max(0.35, Math.min(1.1, scale));

        const dateFontSize = baseDateSize * scale;
        const eventFontSize = baseEventSize * scale;
        const eventSpacing = baseSpacing * scale;
        const dayGap = baseDayGap * scale;
        
        const finalContentHeight = totalBaseHeight * scale;
        // Start from startY, and center if there is extra space. If not enough space, start exactly at startY.
        let runningY = startY + Math.max(0, (availableHeight - finalContentHeight) / 2);

        activeSchedule.forEach((day: DaySchedule) => {
            const iconDay = viewMode === 'planning' ? '☀️ ' : '';
            const iconNight = viewMode === 'planning' ? '🌒 ' : '';

            // 1. Date Header
            if (viewMode === 'planning' && day.date) {
                ctx.textAlign = 'center';
                ctx.font = `900 italic ${dateFontSize}px "Orbitron", sans-serif`;
                ctx.fillStyle = '#ff1241';
                ctx.shadowBlur = 15 * scale;
                ctx.shadowColor = 'rgba(255, 18, 65, 0.5)';
                ctx.fillText(day.date.toUpperCase(), width / 2, runningY + dateFontSize);
                ctx.shadowBlur = 0;
                runningY += dateFontSize * 1.2;
            }

            // 2. Events
            if (viewMode === 'timetable') {
                day.events.forEach((evt) => {
                    const hourText = (evt.artist || '').toUpperCase();
                    const artistText = (evt.location || '').toUpperCase();
                    const separator = ' - ';
                    
                    ctx.font = `900 italic ${eventFontSize}px "Montserrat", sans-serif`;
                    const hourWidth = hourText ? ctx.measureText(hourText).width : 0;
                    ctx.font = `900 ${eventFontSize}px "Montserrat", sans-serif`;
                    const sepWidth = ctx.measureText(separator).width;
                    ctx.font = `900 ${eventFontSize}px "Orbitron", sans-serif`;
                    const artistWidth = artistText ? ctx.measureText(artistText).width : 0;
                    
                    const totalWidth = hourWidth + (hourText && artistText ? sepWidth : 0) + artistWidth;
                    let currentX = (width - totalWidth) / 2;
                    const textY = runningY + eventSpacing / 2;

                    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                    ctx.shadowBlur = 10 * scale;
                    ctx.shadowOffsetY = 2 * scale;

                    if (hourText) {
                        ctx.textAlign = 'left';
                        ctx.font = `900 italic ${eventFontSize}px "Montserrat", sans-serif`;
                        ctx.fillStyle = '#ff1241';
                        ctx.fillText(hourText, currentX, textY);
                        currentX += hourWidth;
                    }
                    if (hourText && artistText) {
                        ctx.textAlign = 'left';
                        ctx.font = `900 ${eventFontSize}px "Montserrat", sans-serif`;
                        ctx.fillStyle = '#ffffff';
                        ctx.fillText(separator, currentX, textY);
                        currentX += sepWidth;
                    }
                    if (artistText) {
                        ctx.textAlign = 'left';
                        ctx.font = `900 ${eventFontSize}px "Orbitron", sans-serif`;
                        ctx.fillStyle = '#ffffff';
                        ctx.fillText(artistText, currentX, textY);
                    }
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetY = 0;
                    runningY += eventSpacing;
                });
            } else {
                day.events.forEach(evt => {
                    if (!evt.artist) return;
                    const icon = evt.type === 'day' ? iconDay : iconNight;
                    const artistText = (icon + evt.artist).toUpperCase();
                    const locText = evt.location ? ` ${evt.location.toUpperCase()}` : '';
                    
                    ctx.font = `900 ${eventFontSize}px "Montserrat", sans-serif`;
                    const artistWidth = ctx.measureText(artistText).width;
                    ctx.font = `500 italic ${eventFontSize * 0.7}px "Montserrat", sans-serif`;
                    const locWidth = ctx.measureText(locText).width;
                    
                    const totalW = artistWidth + (evt.location ? 20 : 0) + locWidth;
                    let startX = (width - totalW) / 2;
                    const textY = runningY + eventSpacing / 2;

                    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                    ctx.shadowBlur = 12 * scale;
                    ctx.shadowOffsetY = 3 * scale;

                    ctx.textAlign = 'left';
                    ctx.font = `900 ${eventFontSize}px "Montserrat", sans-serif`;
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(artistText, startX, textY);
                    
                    if (evt.location) {
                        ctx.font = `500 italic ${eventFontSize * 0.7}px "Montserrat", sans-serif`;
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                        ctx.fillText(evt.location.toUpperCase(), startX + artistWidth + 20, textY);
                    }
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetY = 0;
                    runningY += eventSpacing;
                });
            }
            
            runningY += dayGap;
        });

        // 5. Footer
        if (showWebsite) {
            ctx.textAlign = 'center';
            ctx.font = '900 24px "Orbitron", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.letterSpacing = '10px';
            ctx.fillText('DROPSIDERS.EU', width / 2, height - 100);
        }

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `dropsiders-planning-${schedule[0]?.date || 'schedule'}.png`;
        link.click();
        setIsGenerating(false);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-5xl bg-gray-900 border border-white/10 rounded-[2.5rem] flex flex-col max-h-[95vh] overflow-hidden shadow-2xl">
                    
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
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Créez des visuels de programmation</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div className="flex flex-col gap-4 mb-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Options du Visuel</h3>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setShowLogo(!showLogo)} className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[9px] font-black uppercase transition-all ${showLogo ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-gray-500'}`}>
                                                <ImageIcon className={`w-3 h-3 ${showLogo ? 'text-neon-cyan' : ''}`} /> Logo: {showLogo ? 'OUI' : 'NON'}
                                            </button>
                                            <button onClick={() => setShowWebsite(!showWebsite)} className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[9px] font-black uppercase transition-all ${showWebsite ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-gray-500'}`}>
                                                <Smartphone className={`w-3 h-3 ${showWebsite ? 'text-neon-cyan' : ''}`} /> Site: {showWebsite ? 'OUI' : 'NON'}
                                            </button>
                                            <button onClick={() => setViewMode(viewMode === 'planning' ? 'timetable' : 'planning')} className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[9px] font-black uppercase transition-all ${viewMode === 'planning' ? 'bg-white/10 border-white/20 text-white' : 'bg-neon-cyan border-neon-cyan text-black'}`}>
                                                <Calendar className={`w-3 h-3 ${viewMode === 'timetable' ? 'text-black' : ''}`} /> Mode: {viewMode === 'planning' ? 'DATE' : 'HEURE'}
                                            </button>
                                            <button onClick={addDay} disabled={schedule.length >= 25} className="flex items-center gap-2 px-3 py-1.5 bg-neon-cyan text-black text-[9px] font-black uppercase rounded-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                                                <Plus className="w-3 h-3" /> Ajouter ({schedule.length}/25)
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Type className="w-3 h-3 text-neon-cyan" /> Titre du Planning
                                        </label>
                                        <input type="text" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan outline-none transition-all font-bold italic" placeholder="PLANNING LIVETAKEOVER" />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                                <span className="flex items-center gap-2"><ImageIcon className="w-3 h-3 text-neon-cyan" /> Logo du Festival</span>
                                                <span className="text-neon-cyan">{Math.round(logoScale * 100)}%</span>
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white hover:bg-white/10 transition-all uppercase">
                                                    <Upload className="w-4 h-4 text-neon-cyan" /> {festivalLogo ? 'Changer' : 'Upload'}
                                                </button>
                                                <input type="range" min="0.5" max="2.5" step="0.1" value={logoScale} onChange={(e) => setLogoScale(parseFloat(e.target.value))} className="w-24 accent-neon-cyan" />
                                                {festivalLogo && <button onClick={() => setFestivalLogo(null)} className="p-3 bg-neon-red/20 border border-neon-red/30 rounded-xl text-neon-red hover:bg-neon-red/30 transition-all"><Trash2 className="w-4 h-4" /></button>}
                                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <ImageIcon className="w-3 h-3 text-neon-cyan" /> Fond (Image/Vidéo)
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => bgInputRef.current?.click()} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white hover:bg-white/10 transition-all uppercase ${backgroundImage || backgroundVideo ? 'border-neon-cyan/50' : ''}`}>
                                                    <Upload className="w-4 h-4 text-neon-cyan" /> {backgroundImage || backgroundVideo ? 'Changer Fond' : 'Upload Fond'}
                                                </button>
                                                {(backgroundImage || backgroundVideo) && <button onClick={() => { setBackgroundImage(null); setBackgroundVideo(null); }} className="p-3 bg-neon-red/20 border border-neon-red/30 rounded-xl text-neon-red hover:bg-neon-red/30 transition-all"><Trash2 className="w-4 h-4" /></button>}
                                                <input ref={bgInputRef} type="file" accept="image/*,video/*" onChange={handleBackgroundUpload} className="hidden" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

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
                                                                    <label className="text-[8px] font-black text-gray-400 uppercase ml-1 tracking-widest">{viewMode === 'planning' ? 'Lieu' : 'Artiste / Stage'}</label>
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

                            <div className="relative">
                                <div className="sticky top-0 space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Aperçu Layout</h3>
                                        <div className="px-2 py-0.5 bg-neon-cyan/10 border border-neon-cyan/30 rounded text-[8px] font-black text-neon-cyan uppercase tracking-widest">Story 9:16</div>
                                    </div>

                                    <div className="aspect-[9/19.2] w-full max-w-[380px] mx-auto bg-black rounded-[3.5rem] border-[8px] border-[#1a1a1a] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col p-6 text-white scale-[0.55] origin-top transition-all duration-700 hover:scale-[0.58] group">
                                        {backgroundImage || backgroundVideo ? (
                                            <div className="absolute inset-0">
                                                {backgroundImage ? <img src={backgroundImage ?? undefined} alt="Background" className="w-full h-full object-cover" /> : <video src={backgroundVideo ?? undefined} autoPlay muted loop className="w-full h-full object-cover" />}
                                                <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/60 to-black/90" />
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0b12] via-[#1a0510] to-[#050a0f]" />
                                        )}
                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="w-20 h-6 bg-black rounded-full mx-auto mb-6 flex items-center justify-center border border-white/5 shadow-inner">
                                                <div className="w-2 h-2 bg-[#1a1a1a] rounded-full mr-2" />
                                                <div className="w-8 h-1 bg-[#1a1a1a] rounded-full" />
                                            </div>
                                            {showLogo && (
                                                <div className="flex flex-col items-center mb-6">
                                                    {festivalLogo ? <img src={festivalLogo} alt="Logo" className="h-12 object-contain" style={{ transform: `scale(${logoScale})` }} /> : <div className="w-24 h-6 bg-white/10 rounded-lg mb-2" style={{ transform: `scale(${logoScale})` }} />}
                                                </div>
                                            )}
                                            {customTitle && customTitle.trim() && <div className="text-center mb-4 -mt-2"><div className="text-[14px] font-black text-white italic uppercase tracking-widest">{customTitle}</div></div>}
                                            <div className={`${viewMode === 'timetable' ? 'space-y-1' : 'space-y-4'} text-center ${!showLogo ? 'mt-6' : ''}`}>
                                                {schedule.map(day => (
                                                    <div key={day.id} className="space-y-1">
                                                        {viewMode === 'planning' && <div className="text-[15px] font-black text-neon-red italic uppercase tracking-tighter">{day.date || 'DATE'}</div>}
                                                        <div className={viewMode === 'planning' ? "space-y-2" : "space-y-1"}>
                                                            {day.events.map(evt => (
                                                                <div key={evt.id} className="flex items-center justify-center gap-2">
                                                                    {viewMode === 'planning' ? (
                                                                        <>
                                                                            <div className="text-[12px] text-white font-bold uppercase tracking-wide">{evt.type === 'day' ? '☀️' : '🌒'} {evt.artist || '...'}</div>
                                                                            {evt.location && <div className="text-[9px] text-white/40 italic uppercase ml-2">{evt.location}</div>}
                                                                        </>
                                                                    ) : (
                                                                        <div className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wide">
                                                                            {evt.artist && <span className="text-neon-red italic">{evt.artist}</span>}
                                                                            {evt.artist && evt.location && <span className="text-white/20">-</span>}
                                                                            {evt.location && <span className="font-display text-white">{evt.location}</span>}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-auto pt-8 flex flex-col items-center">
                                                {showWebsite && <><div className="text-[10px] font-black text-white uppercase tracking-[0.5em]">DROPSIDERS.EU</div><div className="w-16 h-0.5 bg-neon-cyan/40 mt-2" /></>}
                                            </div>
                                        </div>
                                    </div>

                                    <button onClick={generateImage} disabled={isGenerating} className="w-full h-16 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-neon-cyan transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50">
                                        {isGenerating ? <Sparkles className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                                        Générer le Visuel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
