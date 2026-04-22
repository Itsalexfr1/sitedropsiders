import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Sun, Moon, Plus, Trash2, Download, Smartphone, Image as ImageIcon, Sparkles, ChevronRight, Type, Upload } from 'lucide-react';

interface DaySchedule {
    id: string;
    date: string;
    dayEvent: string;
    nightEvent: string;
}

export function ScheduleVisualGenerator({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [schedule, setSchedule] = useState<DaySchedule[]>([
        { id: '1', date: '13 Mai', dayEvent: 'Musee Titanic at Louxor', nightEvent: 'Mau P at Encore Beach At Night' },
        { id: '2', date: '14 Mai', dayEvent: 'Porter Robinson at Tao Beach', nightEvent: 'Dom Dolla at Liv Nightclub' }
    ]);
    const [showLogo, setShowLogo] = useState(true);
    const [showWebsite, setShowWebsite] = useState(true);
    const [customTitle, setCustomTitle] = useState('PLANNING LIVETAKEOVER');
    const [festivalLogo, setFestivalLogo] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [backgroundVideo, setBackgroundVideo] = useState<string | null>(null);
    const [logoScale, setLogoScale] = useState(1.0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);

    const addDay = () => {
        if (schedule.length >= 8) return;
        setSchedule([...schedule, { id: Math.random().toString(), date: '', dayEvent: '', nightEvent: '' }]);
    };

    const removeDay = (id: string) => {
        setSchedule(schedule.filter(d => d.id !== id));
    };

    const updateDay = (id: string, field: keyof DaySchedule, value: string) => {
        setSchedule(schedule.map(d => d.id === id ? { ...d, [field]: value } : d));
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

            // Add subtle vignette
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

            // Subtle texture/noise
            ctx.globalAlpha = 0.05;
            for (let i = 0; i < 5000; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#ff1241';
                ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
            }
            ctx.globalAlpha = 1.0;
        }

        // 2. Logo
        let logoHeightOffset = 0;
        if (showLogo) {
            const logo = new Image();
            logo.src = festivalLogo || '/Logo.png';
            await new Promise((resolve) => { logo.onload = resolve; logo.onerror = resolve; });
            if (logo.complete) {
                const baseWidth = festivalLogo ? 350 : 300;
                const logoW = baseWidth * logoScale;
                const logoH = (logo.height / logo.width) * logoW;
                ctx.drawImage(logo, width / 2 - logoW / 2, 80, logoW, logoH); // Remonté (was 120)
                logoHeightOffset = logoH + 20;
            }
        }

        // 3. Header
        ctx.textAlign = 'center';
        let headerY = showLogo ? 100 + logoHeightOffset : 140;
        
        if (customTitle && customTitle.trim()) {
            ctx.font = '900 italic 45px "Montserrat", sans-serif'; // Agrandi (was 30px)
            ctx.fillStyle = '#ffffff'; // Blanc pur (was 0.4 opacity)
            ctx.fillText(customTitle.toUpperCase(), width / 2, headerY);
        } else {
            // If no title, pull content up
            headerY -= 40;
        }

        // 4. Render Days
        const startY = headerY + (customTitle?.trim() ? 100 : 40);
        const availableHeight = height - startY - 200; // 200 for footer margin
        const numDays = schedule.length;
        
        // Dynamic sizing
        let dayHeight = 210; // Encore un peu plus d'espace
        let dateFontSize = 65; 
        let eventFontSize = 40; // Passé à 40
        let eventSpacing = 70;
        let eventNightSpacing = 125;

        if (numDays > 4) {
            const scale = Math.max(0.6, 1 - (numDays - 4) * 0.1);
            dayHeight = 180 * scale;
            dateFontSize = 50 * scale;
            eventFontSize = 30 * scale;
            eventSpacing = 50 * scale;
            eventNightSpacing = 95 * scale;
        }

        const marginX = 80;

        schedule.forEach((day, index) => {
            const y = startY + index * dayHeight;
            
            // Date Header
            ctx.textAlign = 'center';
            ctx.font = `900 italic ${dateFontSize}px "Orbitron", sans-serif`;
            ctx.fillStyle = '#ff1241';
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(255, 18, 65, 0.5)';
            ctx.fillText(day.date.toUpperCase(), width / 2, y);
            ctx.shadowBlur = 0;

            // Day Event
            if (day.dayEvent) {
                ctx.font = `700 ${eventFontSize}px "Montserrat", sans-serif`;
                ctx.fillStyle = '#ffffff';
                ctx.fillText('☀️ ' + day.dayEvent.toUpperCase(), width / 2, y + eventSpacing);
            }

            // Night Event
            if (day.nightEvent) {
                ctx.font = `700 ${eventFontSize}px "Montserrat", sans-serif`;
                ctx.fillStyle = '#ffffff';
                ctx.fillText('🌒 ' + day.nightEvent.toUpperCase(), width / 2, y + (day.dayEvent ? eventNightSpacing : eventSpacing));
            }

            // Divider
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(marginX, y + (dayHeight * 0.7));
            ctx.lineTo(width - marginX, y + (dayHeight * 0.7));
            ctx.stroke();
        });

        // 5. Footer
        if (showWebsite) {
            ctx.textAlign = 'center';
            ctx.font = '900 24px "Orbitron", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.letterSpacing = '10px';
            ctx.fillText('DROPSIDERS.EU', width / 2, height - 100);
        }

        // Export
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
                    
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-neon-cyan/20 rounded-2xl border border-neon-cyan/30">
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
                            {/* Editor */}
                            <div className="space-y-6">
                                <div className="flex flex-col gap-4 mb-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Options du Visuel</h3>
                                        <div className="flex items-center gap-4">
                                            <button 
                                                onClick={() => setShowLogo(!showLogo)}
                                                className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-black uppercase transition-all ${showLogo ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-gray-500'}`}
                                            >
                                                <Sparkles className={`w-4 h-4 ${showLogo ? 'text-neon-cyan' : ''}`} /> Logo: {showLogo ? 'OUI' : 'NON'}
                                            </button>
                                            <button 
                                                onClick={() => setShowWebsite(!showWebsite)}
                                                className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-black uppercase transition-all ${showWebsite ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-gray-500'}`}
                                            >
                                                <Smartphone className={`w-4 h-4 ${showWebsite ? 'text-neon-cyan' : ''}`} /> Site: {showWebsite ? 'OUI' : 'NON'}
                                            </button>
                                            <button onClick={addDay} disabled={schedule.length >= 8} className="flex items-center gap-2 px-4 py-2 bg-neon-cyan text-black text-[10px] font-black uppercase rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100">
                                                <Plus className="w-4 h-4" /> Ajouter ({schedule.length}/8)
                                            </button>
                                        </div>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Type className="w-3 h-3 text-neon-cyan" /> Titre du Planning
                                    </label>
                                    <input 
                                        type="text" 
                                        value={customTitle} 
                                        onChange={(e) => setCustomTitle(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan outline-none transition-all font-bold italic"
                                        placeholder="PLANNING LIVETAKEOVER"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Festival Logo Upload */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                            <span className="flex items-center gap-2"><ImageIcon className="w-3 h-3 text-neon-cyan" /> Logo du Festival</span>
                                            <span className="text-neon-cyan">{Math.round(logoScale * 100)}%</span>
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white hover:bg-white/10 transition-all uppercase"
                                            >
                                                <Upload className="w-4 h-4 text-neon-cyan" /> {festivalLogo ? 'Changer' : 'Upload'}
                                            </button>
                                            <input 
                                                type="range" min="0.5" max="2.5" step="0.1" 
                                                value={logoScale} onChange={(e) => setLogoScale(parseFloat(e.target.value))}
                                                className="w-24 accent-neon-cyan"
                                            />
                                            {festivalLogo && (
                                                <button 
                                                    onClick={() => setFestivalLogo(null)}
                                                    className="p-3 bg-neon-red/20 border border-neon-red/30 rounded-xl text-neon-red hover:bg-neon-red/30 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                        </div>
                                    </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <ImageIcon className="w-3 h-3 text-neon-cyan" /> Fond (Image/Vidéo)
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => bgInputRef.current?.click()}
                                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white hover:bg-white/10 transition-all uppercase ${backgroundImage || backgroundVideo ? 'border-neon-cyan/50' : ''}`}
                                                >
                                                    <Upload className="w-4 h-4 text-neon-cyan" /> {backgroundImage || backgroundVideo ? 'Changer Fond' : 'Upload Fond'}
                                                </button>
                                                {(backgroundImage || backgroundVideo) && (
                                                    <button 
                                                        onClick={() => { setBackgroundImage(null); setBackgroundVideo(null); }}
                                                        className="p-3 bg-neon-red/20 border border-neon-red/30 rounded-xl text-neon-red hover:bg-neon-red/30 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
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
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-gray-500 uppercase ml-2 tracking-[0.2em]">Jour {idx + 1} - Date (ex: 13 Mai)</label>
                                                    <input 
                                                        type="text" value={day.date} onChange={(e) => updateDay(day.id, 'date', e.target.value)}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan outline-none transition-all italic font-bold"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-gray-500 uppercase ml-2 tracking-[0.2em]">Evénement Jour ☀️</label>
                                                        <input 
                                                            type="text" value={day.dayEvent} onChange={(e) => updateDay(day.id, 'dayEvent', e.target.value)}
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-neon-cyan outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-gray-500 uppercase ml-2 tracking-[0.2em]">Evénement Nuit 🌒</label>
                                                        <input 
                                                            type="text" value={day.nightEvent} onChange={(e) => updateDay(day.id, 'nightEvent', e.target.value)}
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-neon-cyan outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="relative">
                                <div className="sticky top-0 space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Aperçu Layout</h3>
                                        <div className="px-2 py-0.5 bg-neon-cyan/10 border border-neon-cyan/30 rounded text-[8px] font-black text-neon-cyan uppercase tracking-widest">Story 9:16</div>
                                    </div>

                                    <div className="aspect-[9/16] w-full max-w-[320px] mx-auto bg-black rounded-[2.5rem] border-[10px] border-gray-800 shadow-2xl relative overflow-hidden flex flex-col p-6 text-white scale-[0.85] origin-top">
                                        {/* Fake Story Background */}
                                        {backgroundImage || backgroundVideo ? (
                                            <div className="absolute inset-0">
                                                {backgroundImage ? (
                                                    <img src={backgroundImage || undefined} alt="Background" className="w-full h-full object-cover" />
                                                ) : (
                                                    <video src={backgroundVideo || undefined} autoPlay muted loop className="w-full h-full object-cover" />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/60 to-black/90" />
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0b12] via-[#1a0510] to-[#050a0f]" />
                                        )}
                                        
                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="w-16 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
                                            
                                            {showLogo && (
                                                <div className="flex flex-col items-center mb-6">
                                                    {festivalLogo ? (
                                                        <img src={festivalLogo} alt="Logo" className="h-12 object-contain" style={{ transform: `scale(${logoScale})` }} />
                                                    ) : (
                                                        <div className="w-24 h-6 bg-white/10 rounded-lg mb-2" style={{ transform: `scale(${logoScale})` }} />
                                                    )}
                                                </div>
                                            )}

                                            {customTitle && customTitle.trim() && (
                                                <div className="text-center mb-4 -mt-2">
                                                    <div className="text-[14px] font-black text-white italic uppercase tracking-widest">{customTitle}</div>
                                                </div>
                                            )}

                                            <div className={`space-y-4 text-center ${!showLogo ? 'mt-6' : ''}`}>
                                                {schedule.map(day => (
                                                    <div key={day.id} className="space-y-1">
                                                        <div className="text-[15px] font-black text-neon-red italic uppercase tracking-tighter">{day.date || 'DATE'}</div>
                                                        {day.dayEvent && <div className="text-[12px] text-gray-300 font-bold uppercase tracking-wide">☀️ {day.dayEvent}</div>}
                                                        {day.nightEvent && <div className="text-[12px] text-gray-300 font-bold uppercase tracking-wide">🌒 {day.nightEvent}</div>}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-auto pt-8 flex flex-col items-center">
                                                {showWebsite && (
                                                    <>
                                                        <div className="text-[10px] font-black text-white uppercase tracking-[0.5em]">DROPSIDERS.EU</div>
                                                        <div className="w-16 h-0.5 bg-neon-cyan/40 mt-2" />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={generateImage}
                                        disabled={isGenerating}
                                        className="w-full h-16 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-neon-cyan transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50"
                                    >
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
