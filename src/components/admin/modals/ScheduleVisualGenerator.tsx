import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Sun, Moon, Plus, Trash2, Download, Smartphone, Image as ImageIcon, Sparkles, ChevronRight } from 'lucide-react';

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
    const [isGenerating, setIsGenerating] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const addDay = () => {
        setSchedule([...schedule, { id: Math.random().toString(), date: '', dayEvent: '', nightEvent: '' }]);
    };

    const removeDay = (id: string) => {
        setSchedule(schedule.filter(d => d.id !== id));
    };

    const updateDay = (id: string, field: keyof DaySchedule, value: string) => {
        setSchedule(schedule.map(d => d.id === id ? { ...d, [field]: value } : d));
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

        // 2. Logo
        if (showLogo) {
            const logo = new Image();
            logo.src = '/Logo.png';
            await new Promise((resolve) => { logo.onload = resolve; logo.onerror = resolve; });
            if (logo.complete) {
                const logoW = 300;
                const logoH = (logo.height / logo.width) * logoW;
                ctx.drawImage(logo, width / 2 - logoW / 2, 120, logoW, logoH);
            }
        }

        // 3. Header
        ctx.textAlign = 'center';
        ctx.font = '900 italic 30px "Montserrat", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText('PLANNING LIVETAKEOVER', width / 2, showLogo ? 280 : 180);

        // 4. Render Days
        const startY = showLogo ? 400 : 300;
        const dayHeight = 180;
        const marginX = 80;

        schedule.forEach((day, index) => {
            const y = startY + index * dayHeight;
            
            // Date Header
            ctx.textAlign = 'left';
            ctx.font = '900 italic 50px "Orbitron", sans-serif';
            ctx.fillStyle = '#ff1241';
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(255, 18, 65, 0.5)';
            ctx.fillText(day.date.toUpperCase(), marginX, y);
            ctx.shadowBlur = 0;

            // Day Event
            if (day.dayEvent) {
                ctx.font = '700 30px "Montserrat", sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.fillText('☀️ ' + day.dayEvent, marginX + 20, y + 50);
            }

            // Night Event
            if (day.nightEvent) {
                ctx.font = '700 30px "Montserrat", sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.fillText('🌒 ' + day.nightEvent, marginX + 20, y + (day.dayEvent ? 95 : 50));
            }

            // Divider
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(marginX, y + 130);
            ctx.lineTo(width - marginX, y + 130);
            ctx.stroke();
        });

        // 5. Footer
        ctx.textAlign = 'center';
        ctx.font = '900 24px "Orbitron", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.letterSpacing = '10px';
        ctx.fillText('DROPSIDERS.EU', width / 2, height - 100);

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
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-4xl bg-gray-900 border border-white/10 rounded-[2.5rem] flex flex-col max-h-[90vh] overflow-hidden shadow-2xl">
                    
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
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Édition du Planning</h3>
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => setShowLogo(!showLogo)}
                                            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-black uppercase transition-all ${showLogo ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-gray-500'}`}
                                        >
                                            <Sparkles className={`w-4 h-4 ${showLogo ? 'text-neon-cyan' : ''}`} /> Logo: {showLogo ? 'OUI' : 'NON'}
                                        </button>
                                        <button onClick={addDay} className="flex items-center gap-2 px-4 py-2 bg-neon-cyan text-black text-[10px] font-black uppercase rounded-xl hover:scale-105 transition-all">
                                            <Plus className="w-4 h-4" /> Ajouter
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {schedule.map((day, idx) => (
                                        <motion.div layout key={day.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 relative group">
                                            <button onClick={() => removeDay(day.id)} className="absolute -top-2 -right-2 w-8 h-8 bg-neon-red text-white flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-gray-500 uppercase ml-2 tracking-[0.2em]">Date (ex: 13 Mai)</label>
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

                                    <div className="aspect-[9/16] w-full max-w-[320px] mx-auto bg-black rounded-[2rem] border-[8px] border-gray-800 shadow-2xl relative overflow-hidden flex flex-col p-6 text-white scale-95 origin-top">
                                        {/* Fake Story Background */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-950" />
                                        
                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="w-16 h-1 bg-white/10 rounded-full mx-auto mb-6" />
                                            
                                            {showLogo && (
                                                <div className="flex flex-col items-center mb-8">
                                                    <div className="w-24 h-6 bg-white/10 rounded-lg mb-2" />
                                                    <div className="w-40 h-3 bg-white/5 rounded-full" />
                                                </div>
                                            )}

                                            <div className={`space-y-6 ${!showLogo ? 'mt-10' : ''}`}>
                                                {schedule.slice(0, 5).map(day => (
                                                    <div key={day.id} className="space-y-1">
                                                        <div className="text-[14px] font-black text-neon-red italic uppercase tracking-tighter">{day.date || 'DATE'}</div>
                                                        {day.dayEvent && <div className="text-[10px] text-gray-300 font-bold">☀️ {day.dayEvent}</div>}
                                                        {day.nightEvent && <div className="text-[10px] text-gray-300 font-bold">🌒 {day.nightEvent}</div>}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-auto pt-8 flex flex-col items-center">
                                                <div className="w-32 h-2 bg-white/10 rounded-full mb-2" />
                                                <div className="w-20 h-1 bg-neon-cyan/20 rounded-full" />
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
