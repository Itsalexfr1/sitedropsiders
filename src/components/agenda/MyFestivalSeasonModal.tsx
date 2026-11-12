import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Download, Smartphone, Heart, Instagram, Check, Copy } from 'lucide-react';
import { shareOrDownloadFile, triggerBlobDownload } from '../../utils/imageExport';

export interface MyFestivalSeasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    events: any[];
    favoriteIds: number[];
    onToggleFavorite: (id: number) => void;
}

const MONTHS_FR = ['JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'];

export function MyFestivalSeasonModal({ isOpen, onClose, events, favoriteIds, onToggleFavorite }: MyFestivalSeasonModalProps) {
    const [pseudo, setPseudo] = useState('@dropsiders_raver');
    const [theme, setTheme] = useState<'NEON' | 'ACID' | 'CYBER'>('NEON');
    const [isSharing, setIsSharing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Favoris triés par date
    const favEvents = useMemo(() => {
        const set = new Set(favoriteIds);
        return events
            .filter(e => set.has(e.id) && (e.startDate || e.date))
            .sort((a, b) => new Date(a.startDate || a.date).getTime() - new Date(b.startDate || b.date).getTime());
    }, [events, favoriteIds]);

    const currentMonth = MONTHS_FR[new Date().getMonth()];
    const year = new Date().getFullYear();

    // Génération du canvas 1080x1920
    useEffect(() => {
        if (!isOpen) return;

        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        canvasRef.current = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const primary = theme === 'ACID' ? '#00ff66' : theme === 'CYBER' ? '#00f0ff' : '#ff00ff';
        const accent  = theme === 'ACID' ? '#ffff00' : theme === 'CYBER' ? '#8b5cf6' : '#00f0ff';
        const bgFrom  = theme === 'ACID' ? '#040d06' : theme === 'CYBER' ? '#04091a' : '#0d0414';
        const bgTo    = theme === 'ACID' ? '#020503' : theme === 'CYBER' ? '#020710' : '#050208';

        // Fond
        const bg = ctx.createLinearGradient(0, 0, 0, 1920);
        bg.addColorStop(0, bgFrom);
        bg.addColorStop(1, bgTo);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 1080, 1920);

        // Halos
        const h1 = ctx.createRadialGradient(200, 300, 0, 200, 300, 600);
        h1.addColorStop(0, primary + '28'); h1.addColorStop(1, 'transparent');
        ctx.fillStyle = h1; ctx.fillRect(0, 0, 1080, 1000);

        const h2 = ctx.createRadialGradient(900, 1700, 0, 900, 1700, 500);
        h2.addColorStop(0, accent + '20'); h2.addColorStop(1, 'transparent');
        ctx.fillStyle = h2; ctx.fillRect(0, 1200, 1080, 720);

        // Grille
        ctx.strokeStyle = 'rgba(255,255,255,0.025)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 1080; x += 72) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1920); ctx.stroke(); }
        for (let y = 0; y < 1920; y += 72) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1080, y); ctx.stroke(); }

        // ── HEADER
        ctx.fillStyle = primary;
        ctx.font = '900 20px Arial, sans-serif';
        ctx.letterSpacing = '4px';
        ctx.fillText('DROPSIDERS.COM', 90, 115);

        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '700 15px Arial, sans-serif';
        ctx.letterSpacing = '2px';
        ctx.fillText('× AGENDA FESTIVALS', 460, 115);
        ctx.letterSpacing = '0px';

        // Trait déco
        ctx.strokeStyle = primary + '55';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(90, 130); ctx.lineTo(990, 130); ctx.stroke();

        // Titre
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.font = 'italic 900 80px Arial, sans-serif';
        ctx.fillText('MES EVENTS', 90, 220);
        ctx.fillStyle = primary;
        ctx.shadowColor = primary;
        ctx.shadowBlur = 35;
        ctx.fillText(currentMonth + ' ' + year, 90, 310);
        ctx.shadowBlur = 0;

        // Badge pseudo
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.strokeStyle = 'rgba(255,255,255,0.14)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        (ctx as any).roundRect ? ctx.roundRect(90, 345, 900, 90, 20) : ctx.rect(90, 345, 900, 90);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 32px Arial, sans-serif';
        ctx.fillText(pseudo || '@dropsiders', 130, 405);
        ctx.fillStyle = accent;
        ctx.font = '700 16px Arial, sans-serif';
        ctx.fillText('⚡ MON AGENDA FAVORIS', 580, 405);

        // Stats chips
        const stats = [
            { v: String(favEvents.length), l: 'EVENTS', c: primary },
            { v: String(favEvents.reduce((s, e) => { const st = new Date(e.startDate||e.date).getTime(); const en = new Date(e.endDate||e.startDate||e.date).getTime(); return s + Math.max(1, Math.round((en-st)/86400000)+1); }, 0)), l: 'JOURS', c: accent },
            { v: String(new Set(favEvents.map(e => (e.location||'').trim().toUpperCase())).size), l: 'VILLES', c: '#ffffff' },
        ];
        stats.forEach((s, i) => {
            const bx = 90 + i * 310;
            const sy = 465;
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            (ctx as any).roundRect ? ctx.roundRect(bx, sy, 288, 108, 16) : ctx.rect(bx, sy, 288, 108);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = s.c;
            ctx.font = 'italic 900 50px Arial, sans-serif';
            ctx.fillText(s.v, bx + 20, sy + 65);
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '700 15px Arial, sans-serif';
            ctx.fillText(s.l, bx + 20, sy + 93);
        });

        // ── LISTE EVENTS
        const listY = 620;
        const displayEvs = favEvents.slice(0, 7);
        const cardH = displayEvs.length > 0 ? Math.min(160, Math.floor(1070 / Math.max(displayEvs.length, 1))) : 160;

        if (displayEvs.length === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.beginPath();
            (ctx as any).roundRect ? ctx.roundRect(90, listY, 900, 480, 20) : ctx.rect(90, listY, 900, 480);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = 'italic 800 28px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('AUCUN EVENT FAVORI', 540, listY + 220);
            ctx.fillStyle = primary;
            ctx.font = '700 18px Arial, sans-serif';
            ctx.fillText('Clique ❤️ sur les events dans l\'Agenda', 540, listY + 268);
            ctx.textAlign = 'left';
        } else {
            displayEvs.forEach((ev, i) => {
                const cy = listY + i * (cardH + 10);
                ctx.fillStyle = i === 0 ? `${primary}12` : 'rgba(255,255,255,0.03)';
                ctx.strokeStyle = i === 0 ? primary + '55' : 'rgba(255,255,255,0.08)';
                ctx.lineWidth = i === 0 ? 1.5 : 1;
                ctx.beginPath();
                (ctx as any).roundRect ? ctx.roundRect(90, cy, 900, cardH, 16) : ctx.rect(90, cy, 900, cardH);
                ctx.fill(); ctx.stroke();

                const d = new Date(ev.startDate || ev.date);
                const dateStr = isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).toUpperCase();

                // Numéro
                ctx.fillStyle = primary;
                ctx.font = `italic 900 ${cardH > 130 ? 22 : 18}px Arial, sans-serif`;
                ctx.fillText(`0${i+1}`, 112, cy + 40);

                // Date
                ctx.fillStyle = accent;
                ctx.font = `700 ${cardH > 130 ? 15 : 13}px Arial, sans-serif`;
                ctx.fillText(dateStr, 165, cy + 40);

                // Titre
                ctx.fillStyle = '#ffffff';
                ctx.font = `italic 900 ${cardH > 130 ? 32 : 26}px Arial, sans-serif`;
                const title = (ev.title || '').length > 30 ? ev.title.slice(0, 29) + '…' : ev.title;
                ctx.fillText(title.toUpperCase(), 112, cy + 80);

                // Lieu & Genre
                if (cardH > 110) {
                    ctx.fillStyle = 'rgba(255,255,255,0.5)';
                    ctx.font = '700 16px Arial, sans-serif';
                    ctx.fillText(`📍 ${(ev.location||'?').toUpperCase()}  •  ${(ev.genre||ev.type||'EDM').toUpperCase()}`, 112, cy + 115);
                }
            });

            if (favEvents.length > 7) {
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.font = 'italic 700 20px Arial, sans-serif';
                ctx.textAlign = 'center';
                const restY = listY + displayEvs.length * (cardH + 10) + 28;
                ctx.fillText(`+ ${favEvents.length - 7} autre(s) sur dropsiders.com/agenda`, 540, restY);
                ctx.textAlign = 'left';
            }
        }

        // ── FOOTER
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(90, 1760); ctx.lineTo(990, 1760); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 22px Arial, sans-serif';
        ctx.fillText('DROPSIDERS', 90, 1820);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '600 16px Arial, sans-serif';
        ctx.fillText('dropsiders.com/agenda • Partage ta saison rave', 90, 1850);
        ctx.fillStyle = primary;
        ctx.font = '800 18px Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('#DROPSIDERS' + year, 990, 1835);
        ctx.textAlign = 'left';

        setPreviewUrl(canvas.toDataURL('image/png'));
    }, [isOpen, favEvents, pseudo, theme, currentMonth, year]);

    const handleShare = async () => {
        if (!canvasRef.current) return;
        setIsSharing(true);
        const blob = await new Promise<Blob | null>(r => canvasRef.current!.toBlob(r, 'image/png'));
        if (blob) await shareOrDownloadFile(blob, `mes-events-${currentMonth.toLowerCase()}-${year}.png`, `Mes Events ${currentMonth} ${year}`, 'Mon agenda favoris sur Dropsiders !');
        setIsSharing(false);
    };

    const handleDownload = () => {
        canvasRef.current?.toBlob(b => b && triggerBlobDownload(b, `mes-events-${currentMonth.toLowerCase()}-${year}.png`), 'image/png');
    };

    const handleCopy = () => {
        const lines = [`🎪 MES EVENTS FAVORIS ${currentMonth} ${year} :`, ...favEvents.map((e, i) => `${i+1}. ${e.title} — ${new Date(e.startDate||e.date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})} @ ${e.location}`), '\n👉 dropsiders.com/agenda'];
        navigator.clipboard.writeText(lines.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-black/90 backdrop-blur-2xl" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="relative w-full max-w-3xl bg-[#09090f] border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-white/10">
                        <div>
                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-neon-fuchsia mb-0.5">Dropsiders</div>
                            <h2 className="text-xl font-black italic uppercase text-white tracking-tight">
                                ❤️ Mon Récap Story — {currentMonth} {year}
                            </h2>
                        </div>
                        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 p-5 max-h-[80vh] overflow-y-auto">
                        {/* Preview Story */}
                        <div className="flex-shrink-0 flex justify-center sm:justify-start">
                            <div className="relative w-[160px] aspect-[9/16] rounded-[1.8rem] p-2 bg-black border-4 border-white/20 shadow-[0_0_30px_rgba(255,0,255,0.2)] overflow-hidden">
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-3 bg-black rounded-full z-10 border border-white/15" />
                                {previewUrl
                                    ? <img src={previewUrl} alt="Story" className="w-full h-full object-cover rounded-[1.2rem]" />
                                    : <div className="w-full h-full flex items-center justify-center text-gray-700 text-[9px] text-center">Génération...</div>
                                }
                            </div>
                        </div>

                        {/* Droite : réglages + boutons */}
                        <div className="flex-1 space-y-5">
                            {/* Nombre de favoris */}
                            {favEvents.length === 0 ? (
                                <div className="p-4 bg-neon-fuchsia/8 border border-neon-fuchsia/25 rounded-2xl text-sm text-neon-fuchsia font-bold">
                                    💡 Clique sur les ❤️ dans l'Agenda pour sélectionner tes events favoris du mois !
                                </div>
                            ) : (
                                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Events sélectionnés ({favEvents.length})</span>
                                    <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                                        {favEvents.map(ev => (
                                            <div key={ev.id} className="flex items-center justify-between gap-2 text-sm">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-neon-fuchsia text-[10px] font-black flex-shrink-0">
                                                        {new Date(ev.startDate||ev.date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}).toUpperCase()}
                                                    </span>
                                                    <span className="text-white font-bold truncate">{ev.title}</span>
                                                </div>
                                                <button onClick={() => onToggleFavorite(ev.id)} className="w-6 h-6 flex-shrink-0 text-red-400 hover:text-red-300 transition-colors">
                                                    <Heart className="w-3.5 h-3.5 fill-current" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Pseudo */}
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">Ton pseudo Instagram</label>
                                <div className="relative">
                                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neon-fuchsia" />
                                    <input type="text" value={pseudo} onChange={e => setPseudo(e.target.value)} placeholder="@ton_pseudo" className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm font-bold text-white focus:outline-none focus:border-neon-fuchsia transition-all" />
                                </div>
                            </div>

                            {/* Thème */}
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">Ambiance visuelle</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[{id:'NEON',l:'Neon',c:'from-neon-fuchsia to-neon-cyan'},{id:'ACID',l:'Acid',c:'from-[#00ff66] to-[#ffff00]'},{id:'CYBER',l:'Cyber',c:'from-neon-cyan to-indigo-600'}].map(t => (
                                        <button key={t.id} type="button" onClick={() => setTheme(t.id as any)}
                                            className={`p-2.5 rounded-xl border text-center transition-all ${theme === t.id ? 'bg-white/10 border-white' : 'bg-black/40 border-white/10 opacity-50 hover:opacity-80'}`}>
                                            <div className={`w-full h-1.5 rounded-full bg-gradient-to-r ${t.c} mb-1.5`} />
                                            <span className="text-[9px] font-black uppercase text-white">{t.l}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Boutons export */}
                            <div className="space-y-2.5">
                                <button type="button" onClick={handleShare} disabled={isSharing}
                                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-neon-fuchsia via-[#ee2a7b] to-neon-cyan text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(255,0,255,0.3)] hover:brightness-110 disabled:opacity-50 transition-all active:scale-[0.98]">
                                    <Smartphone className="w-4 h-4" />
                                    {isSharing ? 'Ouverture...' : '📱 Partager Story (Instagram / TikTok)'}
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={handleDownload}
                                        className="py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all">
                                        <Download className="w-3.5 h-3.5 text-neon-cyan" />PNG
                                    </button>
                                    <button type="button" onClick={handleCopy} disabled={favEvents.length === 0}
                                        className="py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-40">
                                        {copied ? <Check className="w-3.5 h-3.5 text-neon-cyan" /> : <Copy className="w-3.5 h-3.5 text-neon-fuchsia" />}
                                        {copied ? 'Copié !' : 'Texte'}
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
