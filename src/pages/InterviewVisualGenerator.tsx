import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, Download, Image, Youtube, Instagram, Trash2, RefreshCw, Eye } from 'lucide-react';
import { isSuperAdmin } from '../utils/auth';

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
type Format = 'youtube' | 'instagram';

const FORMATS = {
    youtube:   { w: 1280, h: 720,  label: 'YouTube Thumbnail', ratio: '16:9', badge: 'YT', icon: Youtube },
    instagram: { w: 1080, h: 1080, label: 'Instagram Post',    ratio: '1:1',  badge: 'IG', icon: Instagram },
};

/* ─────────────────────────────────────────
   Draw Helpers
───────────────────────────────────────── */

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export function InterviewVisualGenerator() {
    const navigate = useNavigate();
    const adminUser = localStorage.getItem('admin_user');
    const storedPermissions = JSON.parse(localStorage.getItem('admin_permissions') || '[]');
    const isAuthorized = storedPermissions.includes('all') || storedPermissions.includes('social') || isSuperAdmin(adminUser);

    // Form state
    const [artistName, setArtistName]     = useState('');
    const [artistPhoto, setArtistPhoto]   = useState<string | null>(null);
    const [artistLogo, setArtistLogo]     = useState<string | null>(null);
    const [festivalName, setFestivalName] = useState('');
    const [festivalLogo, setFestivalLogo] = useState<string | null>(null);
    const [activeFormat, setActiveFormat] = useState<Format>('youtube');
    const [previewUrl, setPreviewUrl]     = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [dropsidersLogo, setDropsidersLogo] = useState<HTMLImageElement | null>(null);
    const [visualMode, setVisualMode]     = useState<'interview' | 'recap'>('interview');

    const photoInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef  = useRef<HTMLInputElement>(null);
    const festivalLogoRef = useRef<HTMLInputElement>(null);
    const canvasRef     = useRef<HTMLCanvasElement>(null);

    // Load Dropsiders logo
    useEffect(() => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => setDropsidersLogo(img);
        img.onerror = () => console.warn('Dropsiders logo failed to load');
        img.src = '/Logo.png';
    }, []);

    /* ─── Image File Handling ─── */
    const handleFile = (file: File, setter: (url: string | null) => void) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => setter(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const loadImage = (src: string): Promise<HTMLImageElement> =>
        new Promise((res, rej) => {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload  = () => res(img);
            img.onerror = rej;
            img.src = src;
        });

    /* ─────────────────────────────────────
       GENERATE CANVAS
    ───────────────────────────────────── */
    const generate = useCallback(async (fmt: Format) => {
        if (!artistPhoto || (!artistName.trim() && !artistLogo)) return;
        setIsGenerating(true);

        const { w, h } = FORMATS[fmt];
        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;

        // ── 1. Background : dark gradient ──
        const bg = ctx.createLinearGradient(0, 0, w, h);
        bg.addColorStop(0,   '#050505');
        bg.addColorStop(0.6, '#0d0d0d');
        bg.addColorStop(1,   '#1a0008');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // ── 2. Grid lines ──
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        const gridSize = w / 20;
        for (let x = 0; x <= w; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
        for (let y = 0; y <= h; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
        ctx.restore();

        // ── 3. Red glow top-left ──
        const redGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.7);
        redGlow.addColorStop(0,   'rgba(255,0,51,0.18)');
        redGlow.addColorStop(1,   'rgba(255,0,51,0)');
        ctx.fillStyle = redGlow;
        ctx.fillRect(0, 0, w, h);

        // ── 4. Cyan glow bottom-right ──
        const cyanGlow = ctx.createRadialGradient(w, h, 0, w, h, w * 0.5);
        cyanGlow.addColorStop(0,   'rgba(0,240,255,0.08)');
        cyanGlow.addColorStop(1,   'rgba(0,240,255,0)');
        ctx.fillStyle = cyanGlow;
        ctx.fillRect(0, 0, w, h);

        // ── 5. Artist photo ──
        try {
            const photoImg = await loadImage(artistPhoto);
            ctx.save();
            if (fmt === 'youtube') {
                // Right side half
                const ph = h;
                const pw = ph * (photoImg.width / photoImg.height);
                const px = w - pw * 0.75;
                const py = 0;
                // Clip to right portion
                ctx.beginPath();
                ctx.rect(w * 0.35, 0, w * 0.65, h);
                ctx.clip();
                ctx.drawImage(photoImg, px, py, pw, ph);
                // Fade left edge of photo
                const fadeGrad = ctx.createLinearGradient(w * 0.35, 0, w * 0.55, 0);
                fadeGrad.addColorStop(0, '#050505');
                fadeGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = fadeGrad;
                ctx.fillRect(w * 0.35, 0, w * 0.2, h);
            } else {
                // Instagram: bottom-center, large, faded at bottom
                const ph = h * 0.85;
                const pw = ph * (photoImg.width / photoImg.height);
                const px = (w - pw) / 2;
                const py = h - ph + h * 0.05;
                ctx.beginPath();
                ctx.rect(0, 0, w, h);
                ctx.clip();
                ctx.drawImage(photoImg, px, py, pw, ph);
                // Fade bottom
                const fadeB = ctx.createLinearGradient(0, h * 0.5, 0, h);
                fadeB.addColorStop(0, 'transparent');
                fadeB.addColorStop(1, '#050505');
                ctx.fillStyle = fadeB;
                ctx.fillRect(0, 0, w, h);
                // Fade left & right
                const fadeL = ctx.createLinearGradient(0, 0, w * 0.2, 0);
                fadeL.addColorStop(0, '#050505');
                fadeL.addColorStop(1, 'transparent');
                ctx.fillStyle = fadeL;
                ctx.fillRect(0, 0, w, h);
                const fadeR = ctx.createLinearGradient(w * 0.8, 0, w, 0);
                fadeR.addColorStop(0, 'transparent');
                fadeR.addColorStop(1, '#050505');
                ctx.fillStyle = fadeR;
                ctx.fillRect(0, 0, w, h);
            }
            ctx.restore();
        } catch (_) { /* skip photo if error */ }

        // ── 6. content block ──
        if (fmt === 'youtube') {
            const blockX  = w * 0.05;
            const blockY  = h * 0.08;
            const blockW  = w * 0.52;

            // "INTERVIEW" label
            const labelFontSize = Math.round(h * 0.045);
            ctx.font = `900 ${labelFontSize}px 'Arial Black', Arial, sans-serif`;
            ctx.letterSpacing = '6px';
            ctx.textBaseline = 'alphabetic';

            // Red rectangle before label
            ctx.fillStyle = '#ff0033';
            ctx.fillRect(blockX, blockY, labelFontSize * 0.4, labelFontSize * 1.2);

            ctx.fillStyle = '#ffffff';
            ctx.fillText(visualMode === 'interview' ? 'INTERVIEW' : 'RÉCAP VIDÉO', blockX + labelFontSize * 0.7, blockY + labelFontSize);

            const nameY = blockY + labelFontSize * 2.2;

            if (artistLogo) {
                try {
                    const logoImg = await loadImage(artistLogo);
                    const lw = blockW * 0.85;
                    const lh = lw * (logoImg.height / logoImg.width);
                    const finalH = Math.min(lh, h * 0.35); // Réduit de 0.45 à 0.35
                    const finalW = finalH * (logoImg.width / logoImg.height);
                    ctx.drawImage(logoImg, blockX, nameY, finalW, finalH);
                    ctx.fillStyle = '#ff0033';
                    ctx.fillRect(blockX, nameY + finalH + 15, finalW * 0.35, 6);
                } catch (_) { /* fallback handled by logic below if needed */ }
            } else {
                const nameFontSize = Math.round(h * 0.13);
                ctx.font = `900 italic ${nameFontSize}px 'Arial Black', Arial, sans-serif`;
                ctx.textBaseline = 'top'; 
                ctx.fillStyle = '#ffffff';
                const nameUpper = artistName.toUpperCase();
                const maxW = blockW;
                const words = nameUpper.split(' ');
                let line = '';
                const lines: string[] = [];
                for (const word of words) {
                    const testLine = line + (line ? ' ' : '') + word;
                    if (ctx.measureText(testLine).width > maxW && line) { lines.push(line); line = word; }
                    else line = testLine;
                }
                lines.push(line);
                const lineH = nameFontSize * 1.05;
                lines.forEach((l, i) => ctx.fillText(l, blockX, nameY + i * lineH));
                const textW = Math.min(ctx.measureText(lines[0]).width, maxW);
                ctx.fillStyle = '#ff0033';
                ctx.fillRect(blockX, nameY + lines.length * lineH + 10, textW * 0.35, 6);
            }

            // Dropsiders logo
            let currentLogoW = 0;
            if (dropsidersLogo) {
                const logoH = h * 0.09;
                currentLogoW = logoH * (dropsidersLogo.width / dropsidersLogo.height);
                ctx.drawImage(dropsidersLogo, blockX, h - logoH - h * 0.07, currentLogoW, logoH);
            }

            // URL bottom
            const tagFontSize = Math.round(h * 0.028);
            ctx.font = `900 ${tagFontSize}px Arial, sans-serif`;
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.textAlign = 'center';
            const logoCenterX = currentLogoW > 0 ? (blockX + currentLogoW / 2) : blockX;
            ctx.fillText('dropsiders.fr', logoCenterX, h - h * 0.04);
            ctx.textAlign = 'left';

            // ── Festival Info (YouTube Top Right) ──
            if (festivalName || festivalLogo) {
                const festY = h * 0.08;
                const festX = w - w * 0.05;
                ctx.textAlign = 'right';
                if (festivalLogo) {
                    try {
                        const fLogo = await loadImage(festivalLogo);
                        const flh = h * 0.08;
                        const flw = flh * (fLogo.width / fLogo.height);
                        ctx.drawImage(fLogo, festX - flw, festY, flw, flh);
                        if (festivalName) {
                            ctx.font = `900 ${h * 0.02}px Arial, sans-serif`;
                            ctx.fillStyle = 'rgba(255,255,255,0.6)';
                            ctx.fillText(festivalName.toUpperCase(), festX, festY + flh + 15);
                        }
                    } catch(_) {}
                } else {
                    ctx.font = `900 ${h * 0.03}px 'Arial Black', Arial, sans-serif`;
                    ctx.fillStyle = '#ff0033';
                    ctx.fillText(festivalName.toUpperCase(), festX, festY);
                }
                ctx.textAlign = 'left';
            }

        } else {
            // ─── INSTAGRAM layout ───
            const cx   = w / 2;
            const topY = h * 0.08;

            // Dropsiders logo centered top
            if (dropsidersLogo) {
                const logoH = h * 0.07;
                const logoW = logoH * (dropsidersLogo.width / dropsidersLogo.height);
                ctx.drawImage(dropsidersLogo, cx - logoW / 2, topY, logoW, logoH);
            }

            // "INTERVIEW" label
            const labelFontSize = Math.round(h * 0.038);
            ctx.font = `900 ${labelFontSize}px 'Arial Black', Arial, sans-serif`;
            ctx.fillStyle = '#ff0033';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(visualMode === 'interview' ? '— INTERVIEW —' : '— RÉCAP VIDÉO —', cx, topY + h * 0.08);

            const nameY = h * 0.78;
            ctx.fillStyle = '#ffffff';

            if (artistLogo) {
                try {
                    const logoImg = await loadImage(artistLogo);
                    const lw = w * 0.60; // Réduit en largeur (de 0.75 à 0.60)
                    const lh = lw * (logoImg.height / logoImg.width);
                    const finalH = Math.min(lh, h * 0.12); // Réduit en hauteur max (de 0.16 à 0.12)
                    const finalW = finalH * (logoImg.width / logoImg.height);
                    ctx.drawImage(logoImg, cx - finalW / 2, nameY, finalW, finalH);
                    ctx.fillStyle = '#ff0033';
                    ctx.fillRect(cx - 50, nameY + finalH + 12, 100, 5);
                } catch (_) { /* fallback */ }
            } else {
                const nameFontSize = Math.round(h * 0.11);
                ctx.font = `900 italic ${nameFontSize}px 'Arial Black', Arial, sans-serif`;
                const nameUpper = artistName.toUpperCase();
                const words = nameUpper.split(' ');
                let line = '';
                const lines: string[] = [];
                const maxW = w * 0.86;
                for (const word of words) {
                    const testLine = line + (line ? ' ' : '') + word;
                    if (ctx.measureText(testLine).width > maxW && line) { lines.push(line); line = word; }
                    else line = testLine;
                }
                lines.push(line);
                const lineH = nameFontSize * 1.05;
                lines.forEach((l, i) => ctx.fillText(l, cx, nameY + i * lineH));
                ctx.fillStyle = '#ff0033';
                ctx.fillRect(cx - 50, nameY + lines.length * lineH + 15, 100, 5);
            }

            // URL bottom
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.font = `900 ${Math.round(h * 0.022)}px Arial, sans-serif`;
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.fillText('dropsiders.fr', cx, h - h * 0.04);
            ctx.textAlign = 'left';

            // ── Festival Info (Instagram Top Left) ──
            if (festivalName || festivalLogo) {
                const festY = h * 0.05;
                const festX = w * 0.05;
                ctx.textAlign = 'left';
                if (festivalLogo) {
                    try {
                        const fLogo = await loadImage(festivalLogo);
                        const flh = h * 0.06;
                        const flw = flh * (fLogo.width / fLogo.height);
                        ctx.drawImage(fLogo, festX, festY, flw, flh);
                    } catch(_) {}
                } else {
                    ctx.font = `900 ${h * 0.02}px Arial, sans-serif`;
                    ctx.fillStyle = 'rgba(255,255,255,0.5)';
                    ctx.fillText(festivalName.toUpperCase(), festX, festY + h * 0.02);
                }
            }
        }

        // ── 7. Corner logo (only if not used as hero) ──
        // Removed to avoid clutter if using logo as main element


        // ── 8. Corner accent ──
        ctx.save();
        ctx.fillStyle = '#ff0033';
        // Top-left corner bracket
        const cs = Math.round(w * 0.025);
        const cw = Math.round(w * 0.004);
        ctx.fillRect(0, 0, cs, cw);
        ctx.fillRect(0, 0, cw, cs);
        // Bottom-right
        ctx.fillRect(w - cs, h - cw, cs, cw);
        ctx.fillRect(w - cw, h - cs, cw, cs);
        ctx.restore();

        // ── 9. Export ──
        const url = canvas.toDataURL('image/png', 1.0);
        setPreviewUrl(url);
        setIsGenerating(false);
        return url;
    }, [artistPhoto, artistName, artistLogo, dropsidersLogo, festivalName, festivalLogo]);

    const handleGenerate = () => { generate(activeFormat); };

    const handleDownload = async () => {
        const url = previewUrl ?? await generate(activeFormat);
        if (!url) return;
        const a = document.createElement('a');
        a.href = url;
        a.download = `dropsiders_interview_${artistName.replace(/\s+/g, '_').toLowerCase()}_${activeFormat}.png`;
        a.click();
    };

    // Auto-regenerate when format/data changes
    useEffect(() => {
        if (artistPhoto && artistName.trim()) {
            const t = setTimeout(() => generate(activeFormat), 300);
            return () => clearTimeout(t);
        }
    }, [activeFormat, artistName, artistPhoto, artistLogo, generate]);

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <p className="text-red-500 font-black uppercase tracking-widest text-sm">Accès restreint</p>
                    <button onClick={() => navigate(-1)} className="text-gray-400 text-xs font-bold hover:text-white transition-colors">← Retour</button>
                </div>
            </div>
        );
    }

    const fmt = FORMATS[activeFormat];

    return (
        <div className="min-h-screen bg-[#050505]">
            {/* Hidden canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Nav */}
            <div className="fixed top-4 left-4 z-50">
                <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-2 px-6 py-3 bg-black/60 border border-white/10 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:border-red-500/50 transition-all backdrop-blur-md shadow-2xl group"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Tableau de Bord
                </button>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-20 lg:py-16 lg:pl-8 lg:pr-8">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
                    <div className="inline-flex items-center gap-3 px-5 py-2 bg-neon-red/10 border border-neon-red/20 rounded-full mb-6">
                        <Image className="w-4 h-4 text-neon-red" />
                        <span className="text-neon-red font-black uppercase tracking-widest text-[10px]">Visual Generator</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter mb-3">
                        {visualMode === 'recap' ? 'Récap' : 'Interview'} <span className={visualMode === 'recap' ? 'text-neon-cyan' : 'text-neon-red'}>Visuals</span>
                    </h1>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">
                        Génère tes miniatures YouTube & Instagram
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-[420px_1fr] gap-8">
                    {/* ─── LEFT : CONTROLS ─── */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">

                        {/* Mode selector */}
                        <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-6 backdrop-blur-md">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-4">Type de création</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setVisualMode('interview')} className={`py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${visualMode === 'interview' ? 'bg-neon-red/15 border-neon-red/50 text-neon-red shadow-[0_0_20px_rgba(255,0,51,0.15)]' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'}`}>Interview</button>
                                <button onClick={() => setVisualMode('recap')} className={`py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${visualMode === 'recap' ? 'bg-neon-cyan/15 border-neon-cyan/50 text-neon-cyan shadow-[0_0_20px_rgba(0,255,255,0.15)]' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'}`}>Récap Vidéo</button>
                            </div>
                        </div>

                        {/* Format selector */}
                        <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-6 backdrop-blur-md">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-4">Format</label>
                            <div className="grid grid-cols-2 gap-3">
                                {(Object.entries(FORMATS) as [Format, typeof FORMATS[Format]][]).map(([key, f]) => {
                                    const Icon = f.icon;
                                    const active = activeFormat === key;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setActiveFormat(key)}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${active ? 'bg-neon-red/15 border-neon-red/50 text-neon-red shadow-[0_0_20px_rgba(255,0,51,0.15)]' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'}`}
                                        >
                                            <Icon className="w-6 h-6" />
                                            <span>{f.label}</span>
                                            <span className="text-[9px] text-gray-500">{f.w}×{f.h}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Artist Info Group */}
                        {visualMode === 'interview' && (
                            <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-6 backdrop-blur-md">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">
                                Artiste <span className="text-neon-red">*</span>
                            </label>
                            
                            {/* Name Input */}
                            <input
                                type="text"
                                value={artistName}
                                onChange={(e) => setArtistName(e.target.value)}
                                placeholder="Nom de l'artiste"
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg font-black italic tracking-tight focus:outline-none focus:border-neon-red transition-all placeholder:text-gray-600 mb-4"
                            />

                            {/* Logo Upload inside same block */}
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], setArtistLogo)}
                            />
                            {artistLogo ? (
                                <div className="flex items-center gap-4 p-4 bg-black/30 rounded-2xl border border-white/5">
                                    <img src={artistLogo} alt="Logo" className="h-10 w-10 object-contain" />
                                    <p className="text-[10px] font-black uppercase text-gray-400 flex-1">Logo Artiste</p>
                                    <button onClick={() => setArtistLogo(null)} className="p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-all text-red-500"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => logoInputRef.current?.click()}
                                    className="w-full py-3 rounded-xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3 text-gray-500 text-[10px] uppercase font-black tracking-widest"
                                >
                                    <Upload className="w-4 h-4" />
                                    Logo Artiste (Optionnel)
                                </button>
                            )}
                        </div>
                        )}

                        {/* Person photo (keep separate as it's the main visual element) */}
                        <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-6 backdrop-blur-md">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">
                                {visualMode === 'interview' ? "Photo de l'artiste" : "Photo de couverture"} <span className="text-neon-red">*</span>
                            </label>
                            <input
                                ref={photoInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], setArtistPhoto)}
                            />
                            {artistPhoto ? (
                                <div className="relative group rounded-2xl overflow-hidden aspect-square">
                                    <img src={artistPhoto} alt="Artist" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <button onClick={() => photoInputRef.current?.click()} className="p-3 bg-white/20 rounded-2xl hover:bg-white/30 transition-all"><RefreshCw className="w-5 h-5 text-white" /></button>
                                        <button onClick={() => setArtistPhoto(null)} className="p-3 bg-red-500/20 rounded-2xl hover:bg-red-500/40 transition-all"><Trash2 className="w-5 h-5 text-red-400" /></button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => photoInputRef.current?.click()}
                                    className="w-full aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-neon-red/40 transition-all flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-neon-red"
                                >
                                    <Upload className="w-8 h-8" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Importer une photo</span>
                                    <span className="text-[9px] text-gray-600">PNG, JPG, WEBP</span>
                                </button>
                            )}
                        </div>

                        {/* Festival info (new) */}
                        <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-6 backdrop-blur-md">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">
                                Festival / Événement
                            </label>
                            <input
                                type="text"
                                value={festivalName}
                                onChange={(e) => setFestivalName(e.target.value)}
                                placeholder="Nom du festival (optionnel)"
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-bold uppercase tracking-widest mb-4 focus:border-neon-red transition-all"
                            />
                            <input
                                ref={festivalLogoRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], setFestivalLogo)}
                            />
                            {festivalLogo ? (
                                <div className="flex items-center gap-4 p-4 bg-black/30 rounded-2xl border border-white/5">
                                    <img src={festivalLogo} alt="Festival Logo" className="h-10 w-10 object-contain" />
                                    <p className="text-[9px] font-black uppercase text-gray-400 flex-1">Logo Festival</p>
                                    <button onClick={() => setFestivalLogo(null)} className="p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-all"><Trash2 className="w-3 h-3 text-red-500" /></button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => festivalLogoRef.current?.click()}
                                    className="w-full py-3 rounded-xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3 text-gray-500 text-[10px] uppercase font-black tracking-widest"
                                >
                                    <Image className="w-4 h-4" />
                                    Logo Festival (Optionnel)
                                </button>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleGenerate}
                                disabled={!artistPhoto || (visualMode === 'interview' && !artistName.trim()) || isGenerating}
                                className="flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Eye className="w-4 h-4" />
                                Prévisualiser
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={!artistPhoto || (visualMode === 'interview' && !artistName.trim()) || isGenerating}
                                className="flex items-center justify-center gap-2 py-4 bg-neon-red text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neon-red/80 transition-all shadow-[0_0_20px_rgba(255,0,51,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Download className="w-4 h-4" />
                                Télécharger
                            </button>
                        </div>

                        {/* Both formats download */}
                        {previewUrl && (
                            <button
                                onClick={async () => {
                                    for (const fmt of Object.keys(FORMATS) as Format[]) {
                                        setActiveFormat(fmt);
                                        await new Promise(r => setTimeout(r, 500));
                                        const url = await generate(fmt);
                                        if (!url) continue;
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `dropsiders_interview_${artistName.replace(/\s+/g, '_').toLowerCase()}_${fmt}.png`;
                                        a.click();
                                        await new Promise(r => setTimeout(r, 300));
                                    }
                                }}
                                className="w-full py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Télécharger les 2 formats
                            </button>
                        )}
                    </motion.div>

                    {/* ─── RIGHT : PREVIEW ─── */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        {/* Format badge */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                {(Object.keys(FORMATS) as Format[]).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setActiveFormat(f)}
                                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${activeFormat === f ? 'bg-neon-red border-neon-red text-white' : 'border-white/10 text-gray-500 hover:border-white/20 hover:text-white'}`}
                                    >
                                        {FORMATS[f].badge} — {FORMATS[f].ratio}
                                    </button>
                                ))}
                            </div>
                            <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-auto">
                                {fmt.w} × {fmt.h} px
                            </span>
                        </div>

                        {/* Preview area */}
                        <div
                            className={`w-full bg-black/30 border border-white/8 rounded-3xl overflow-hidden flex items-center justify-center relative ${isGenerating ? 'opacity-60' : ''}`}
                            style={{ aspectRatio: activeFormat === 'youtube' ? '16/9' : '1/1' }}
                        >
                            {isGenerating && (
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <div className="w-10 h-10 border-4 border-neon-red/20 border-t-neon-red rounded-full animate-spin" />
                                </div>
                            )}
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-full h-full object-contain"
                                    style={{ imageRendering: 'auto' }}
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-4 text-gray-600">
                                    <Image className="w-12 h-12 opacity-30" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-center">
                                        {!artistPhoto
                                            ? 'Importe une photo pour commencer'
                                            : !artistName.trim()
                                            ? 'Saisis le nom de l\'artiste'
                                            : 'Clique sur Prévisualiser'
                                        }
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Info cards */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Format', value: activeFormat === 'youtube' ? 'YouTube' : 'Instagram' },
                                { label: 'Résolution', value: `${fmt.w}×${fmt.h}` },
                                { label: 'Export', value: 'PNG HD' },
                            ].map(item => (
                                <div key={item.label} className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 text-center">
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">{item.label}</p>
                                    <p className="text-white font-black text-sm">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Tips */}
                        <div className="bg-neon-red/5 border border-neon-red/20 rounded-2xl p-5">
                            <p className="text-[9px] font-black text-neon-red uppercase tracking-widest mb-2">💡 Conseils</p>
                            <ul className="space-y-1.5 text-[10px] text-gray-400">
                                <li>• Préfère une photo en haute résolution (min. 1500px)</li>
                                <li>• Le fond doit idéalement être sombre ou neutre</li>
                                <li>• Le logo artiste sera placé en coin — PNG transparent recommandé</li>
                                <li>• Le logo Dropsiders est ajouté automatiquement</li>
                            </ul>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
