import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, Download, Image, Youtube, Instagram, Trash2, RefreshCw, Eye, Scissors, Check, X, AlertCircle } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { isSuperAdmin } from '../utils/auth';

/* ─────────────────────────────────────────
   Types
   Update Instagram to 1080x1350 (Portrait)
───────────────────────────────────────── */
type Format = 'youtube' | 'instagram';

const FORMATS = {
    youtube:   { w: 1280, h: 720,  label: 'YouTube Thumbnail', ratio: '16:9', badge: 'YT', icon: Youtube },
    instagram: { w: 1080, h: 1350, label: 'Instagram Portrait', ratio: '4:5',  badge: 'IG', icon: Instagram },
};

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
    const [visualMode, setVisualMode]     = useState<'interview' | 'recap' | 'top100' | 'news'>('interview');
    const [error, setError] = useState<string | null>(null);

    // Photo position controls
    const [photoOffsetX, setPhotoOffsetX] = useState(0);   // -100 to +100
    const [photoOffsetY, setPhotoOffsetY] = useState(0);   // -100 to +100
    const [photoScale, setPhotoScale]     = useState(100); // 50 to 200 (%)
    const [invertArtistLogo, setInvertArtistLogo] = useState(false);
    const [invertFestivalLogo, setInvertFestivalLogo] = useState(false);
    const [artistLogoScale, setArtistLogoScale] = useState(100);
    const [festivalLogoScale, setFestivalLogoScale] = useState(100);

    // Cropping state
    const [showCropper, setShowCropper] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    // Drag state for photo positioning
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);

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
    const handleFile = (file: File, setter: (val: string | null) => void, isArtistPhoto = false) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            
            if (isArtistPhoto) {
                const img = new window.Image();
                img.onload = () => {
                    if (img.width < 800) {
                        setError("La photo est trop petite (min. 800px de large) pour un rendu premium.");
                        setArtistPhoto(null);
                    } else {
                        setError(null);
                        setter(dataUrl);
                        setImageToCrop(dataUrl);
                        setShowCropper(true);
                    }
                };
                img.src = dataUrl;
            } else {
                setter(dataUrl);
            }
        };
        reader.readAsDataURL(file);
    };

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const getCroppedImg = async () => {
        if (!imageToCrop || !croppedAreaPixels) return;
        const image = await loadImage(imageToCrop);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        ctx.drawImage(
            image,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            croppedAreaPixels.width,
            croppedAreaPixels.height
        );

        const base64Image = canvas.toDataURL('image/jpeg');
        setArtistPhoto(base64Image);
        setShowCropper(false);
        setImageToCrop(null);
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

        // ── Drawing Logic ──
        const generateYouTube = async (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            const isMinimal = visualMode === 'top100' || visualMode === 'news';

            // Background
            if (isMinimal) {
                const grad = ctx.createLinearGradient(0, 0, 0, h);
                grad.addColorStop(0, '#0a0a0a');
                grad.addColorStop(0.6, '#0a0a0a');
                grad.addColorStop(1, '#ff0033');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
            } else {
                ctx.fillStyle = '#0a0a0a';
                ctx.fillRect(0, 0, w, h);

                if (artistPhoto) {
                    const photoImg = await loadImage(artistPhoto);
                    const BASE_H = 1050;
                    const ph = BASE_H * (photoScale / 100);
                    const pw = ph * (photoImg.width / photoImg.height);
                    const px = (w - pw * 0.8) + (photoOffsetX / 100) * h;
                    const py = (h - ph) / 2 + (photoOffsetY / 100) * h * 0.5;
                    
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(w * 0.35, 0, w * 0.65, h);
                    ctx.clip();
                    ctx.drawImage(photoImg, px, py, pw, ph);
                    
                    const fadeWidth = w * 0.4;
                    const fadeGrad = ctx.createLinearGradient(w * 0.35, 0, w * 0.35 + fadeWidth, 0);
                    fadeGrad.addColorStop(0,   '#0a0a0a');
                    fadeGrad.addColorStop(1,   'transparent');
                    ctx.fillStyle = fadeGrad;
                    ctx.fillRect(w * 0.35, 0, fadeWidth, h);
                    ctx.restore();
                }
            }

            // Logo Dropsiders Top Right
            if (dropsidersLogo) {
                const logoW = w * 0.15;
                const logoH = (dropsidersLogo.height / dropsidersLogo.width) * logoW;
                ctx.drawImage(dropsidersLogo, w - logoW - 40, 40, logoW, logoH);
            }

            if (isMinimal) {
                // Centered Label
                let labelText = 'NEWS';
                let labelBg = '#ff0033'; // Default Red
                if (visualMode === 'top100') {
                    labelText = 'TOP 100 DROPSIDERS';
                    labelBg = '#fff01f'; // Gold/Yellow
                }

                const fontSize = h * 0.08;
                ctx.font = `900 ${fontSize}px 'Arial Black', Arial, sans-serif`;
                const textWidth = ctx.measureText(labelText).width;
                const padX = 60;
                const padY = 30;
                const bx = (w - textWidth) / 2 - padX;
                const by = (h - fontSize) / 2 - padY;

                ctx.fillStyle = labelBg;
                ctx.beginPath();
                ctx.roundRect(bx, by, textWidth + padX * 2, fontSize + padY * 2, 25);
                ctx.fill();

                ctx.fillStyle = visualMode === 'top100' ? '#000000' : '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(labelText, w / 2, h / 2 + 5);

                // FOOTER (Top 100 only)
                if (visualMode === 'top100') {
                    ctx.font = `900 italic ${h * 0.06}px 'Orbitron', sans-serif`;
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText('VOTER SUR DROPSIDERS', w / 2, h - h * 0.12);
                }
                return;
            }

            // NORMAL YT TEMPLATE
            const blockX = 80;
            const blockY = 80;
            const labelFontSize = Math.round(h * 0.045);
            ctx.font = `900 ${labelFontSize}px 'Arial Black', Arial, sans-serif`;
            ctx.letterSpacing = '6px';
            ctx.textBaseline = 'alphabetic';

            let labelText = 'INTERVIEW';
            if (visualMode === 'recap') labelText = 'RÉCAP VIDÉO';

            ctx.fillStyle = '#ff0033';
            const textW = ctx.measureText(labelText).width;
            ctx.beginPath();
            ctx.roundRect(blockX - 20, blockY - labelFontSize * 1.05, textW + 40, labelFontSize * 1.5, 10);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(labelText, blockX, blockY);

            const nameY = blockY + labelFontSize * 2.5;
            if (artistLogo) {
                const logoImg = await loadImage(artistLogo);
                const lw = (w * 0.52) * 0.85 * (artistLogoScale / 100);
                const lh = lw * (logoImg.height / logoImg.width);
                const finalH = Math.min(lh, h * 0.45); 
                const finalW = finalH * (logoImg.width / logoImg.height);
                if (invertArtistLogo) ctx.filter = 'invert(1) brightness(10)';
                ctx.drawImage(logoImg, blockX, nameY, finalW, finalH);
                ctx.filter = 'none';
            } else {
                ctx.font = `900 italic ${h * 0.13}px 'Arial Black', Arial, sans-serif`;
                ctx.fillStyle = '#ffffff';
                ctx.fillText(artistName.toUpperCase(), blockX, nameY + h * 0.1);
            }
        };

        const generateInstagram = async (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            const isMinimal = visualMode === 'top100' || visualMode === 'news';

            // Background
            if (isMinimal) {
                const grad = ctx.createLinearGradient(0, 0, 0, h);
                grad.addColorStop(0, '#0a0a0a');
                grad.addColorStop(0.6, '#0a0a0a');
                grad.addColorStop(1, '#ff0033');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
            } else {
                ctx.fillStyle = '#0a0a0a';
                ctx.fillRect(0, 0, w, h);
                if (artistPhoto) {
                    const photoImg = await loadImage(artistPhoto);
                    const BASE_H = 1050;
                    const ph = BASE_H * (photoScale / 100);
                    const pw = ph * (photoImg.width / photoImg.height);
                    const px = (w - pw) / 2 + (photoOffsetX / 100) * h;
                    const py = (h - ph) / 2 + (photoOffsetY / 100) * h * 0.4;
                    ctx.save();
                    ctx.globalAlpha = 0.5;
                    ctx.drawImage(photoImg, px, py, pw, ph);
                    ctx.restore();
                }
                const grad = ctx.createLinearGradient(0, 0, 0, h);
                grad.addColorStop(0, 'rgba(10,10,10,0)');
                grad.addColorStop(1, '#0a0a0a');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
            }

            const cx = w / 2;
            if (dropsidersLogo) {
                const lw = w * 0.25;
                const lh = (dropsidersLogo.height / dropsidersLogo.width) * lw;
                ctx.drawImage(dropsidersLogo, w - lw - 40, 40, lw, lh);
            }

            if (isMinimal) {
                let labelText = 'NEWS';
                let labelBg = '#ff0033';
                if (visualMode === 'top100') {
                    labelText = 'TOP 100 DROPSIDERS';
                    labelBg = '#fff01f';
                }

                const fontSize = h * 0.07;
                ctx.font = `900 ${fontSize}px 'Arial Black', Arial, sans-serif`;
                const textWidth = ctx.measureText(labelText).width;
                const padX = 50;
                const padY = 25;
                const bx = (w - textWidth) / 2 - padX;
                const by = (h - fontSize) / 2 - padY;

                ctx.fillStyle = labelBg;
                ctx.beginPath();
                ctx.roundRect(bx, by, textWidth + padX * 2, fontSize + padY * 2, 20);
                ctx.fill();

                ctx.fillStyle = visualMode === 'top100' ? '#000000' : '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(labelText, cx, h / 2 + 5);

                if (visualMode === 'top100') {
                    ctx.font = `900 italic ${h * 0.052}px 'Orbitron', sans-serif`;
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText('VOTER SUR DROPSIDERS', cx, h - h * 0.15);
                }
                return;
            }

            // NORMAL INSTA TEMPLATE
            ctx.textAlign = 'center';
            let labelText = '— INTERVIEW —';
            if (visualMode === 'recap') labelText = '— RÉCAP VIDÉO —';

            ctx.font = `900 ${h * 0.032}px 'Arial Black', Arial, sans-serif`;
            ctx.fillStyle = '#ff0033';
            ctx.fillText(labelText, cx, h * 0.15);

            const nameY = h * 0.82;
            if (artistLogo) {
                const logoImg = await loadImage(artistLogo);
                const lw = w * 0.6 * (artistLogoScale / 100);
                const lh = lw * (logoImg.height / logoImg.width);
                const finalH = Math.min(lh, h * 0.15);
                const finalW = finalH * (logoImg.width / logoImg.height);
                if (invertArtistLogo) ctx.filter = 'invert(1) brightness(10)';
                ctx.drawImage(logoImg, cx - finalW / 2, nameY, finalW, finalH);
                ctx.filter = 'none';
            } else {
                ctx.font = `900 italic ${h * 0.09}px 'Arial Black', Arial, sans-serif`;
                ctx.fillStyle = '#ffffff';
                ctx.fillText(artistName.toUpperCase(), cx, nameY + h * 0.05);
            }
        };

        if (fmt === 'youtube') await generateYouTube(ctx, w, h);
        else await generateInstagram(ctx, w, h);

        const url = canvas.toDataURL('image/png', 1.0);
        setPreviewUrl(url);
        setIsGenerating(false);
        return url;
    }, [artistPhoto, artistName, artistLogo, dropsidersLogo, festivalName, festivalLogo, visualMode, photoOffsetX, photoOffsetY, photoScale, artistLogoScale, invertArtistLogo, activeFormat, invertFestivalLogo, festivalLogoScale]);

    const handleGenerate = () => { generate(activeFormat); };

    const handleDownload = async () => {
        const url = previewUrl ?? await generate(activeFormat);
        if (!url) return;
        const name = artistName ? artistName.replace(/\s+/g, '_').toLowerCase() : 'dropsiders';
        const a = document.createElement('a');
        a.href = url;
        a.download = `dropsiders_${visualMode}_${name}_${activeFormat}.png`;
        a.click();
    };

    // Auto-regenerate
    useEffect(() => {
        if (artistPhoto && (artistName.trim() || artistLogo)) {
            const t = setTimeout(() => generate(activeFormat), 300);
            return () => clearTimeout(t);
        }
    }, [activeFormat, artistName, artistPhoto, artistLogo, generate, photoOffsetX, photoOffsetY, photoScale]);

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
        <div className="min-h-screen bg-[#050505] text-white">
            <canvas ref={canvasRef} className="hidden" />

            {/* Cropper Modal */}
            <AnimatePresence>
                {showCropper && imageToCrop && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 className="text-xl font-black uppercase italic tracking-tighter">Rogner la photo</h2>
                            <button onClick={() => setShowCropper(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X className="w-6 h-6" /></button>
                        </div>
                        
                        <div className="flex-1 relative bg-black/50">
                            <Cropper
                                image={imageToCrop}
                                crop={crop}
                                zoom={zoom}
                                aspect={activeFormat === 'youtube' ? 1 : 4/5}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>

                        <div className="p-8 bg-black/80 border-t border-white/10 flex flex-col gap-6">
                            <div className="flex items-center gap-6">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Zoom</span>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e: any) => setZoom(e.target.value)}
                                    className="flex-1 h-1 bg-white/10 rounded-full appearance-none accent-neon-red cursor-pointer"
                                />
                            </div>
                            <div className="flex justify-end gap-4">
                                <button onClick={() => setShowCropper(false)} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Annuler</button>
                                <button onClick={getCroppedImg} className="px-10 py-4 bg-neon-red text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neon-red/80 transition-all flex items-center gap-2">
                                    <Check className="w-4 h-4" /> Appliquer
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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

            <div className="max-w-7xl mx-auto px-4 py-20 lg:py-16">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
                    <div className="inline-flex items-center gap-3 px-5 py-2 bg-neon-red/10 border border-neon-red/20 rounded-full mb-6">
                        <Image className="w-4 h-4 text-neon-red" />
                        <span className="text-neon-red font-black uppercase tracking-widest text-[10px]">Visual Studio v2.0</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter mb-3">
                        {visualMode === 'recap' ? 'Récap' : visualMode === 'top100' ? 'Top 100' : visualMode === 'news' ? 'News' : 'Interview'} <span className={visualMode === 'recap' ? 'text-neon-cyan' : visualMode === 'top100' ? 'text-neon-yellow' : visualMode === 'news' ? 'text-neon-red' : 'text-neon-red'}>Visuals</span>
                    </h1>
                </motion.div>

                <div className="grid lg:grid-cols-[400px_1fr] gap-8">
                    {/* ─── LEFT : CONTROLS ─── */}
                    <div className="space-y-6">
                        {/* Creation Type */}
                        <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-6 backdrop-blur-md">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <button onClick={() => setVisualMode('interview')} className={`py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${visualMode === 'interview' ? 'bg-neon-red/15 border-neon-red/50 text-neon-red shadow-[0_0_20px_rgba(255,0,51,0.15)]' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'}`}>Interview</button>
                                <button onClick={() => setVisualMode('recap')} className={`py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${visualMode === 'recap' ? 'bg-neon-cyan/15 border-neon-cyan/50 text-neon-cyan shadow-[0_0_20px_rgba(0,255,255,0.15)]' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'}`}>Récap</button>
                                <button onClick={() => setVisualMode('top100')} className={`py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${visualMode === 'top100' ? 'bg-yellow-500/15 border-yellow-500/50 text-yellow-500 shadow-[0_0_20px_rgba(255,240,31,0.15)]' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'}`}>Top 100</button>
                                <button onClick={() => setVisualMode('news')} className={`py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${visualMode === 'news' ? 'bg-white/15 border-white/50 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'}`}>News</button>
                            </div>
                        </div>

                        {/* Format */}
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

                        {/* Artiste Input */}
                        <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-6 backdrop-blur-md">
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">
                                    Artiste {!artistLogo && <span className="text-neon-red">*</span>}
                                </label>
                                {artistLogo && <span className="text-[8px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded font-black uppercase">Nom Optionnel</span>}
                            </div>
                            
                            <input
                                type="text"
                                value={artistName}
                                onChange={(e) => setArtistName(e.target.value)}
                                placeholder="Nom de l'artiste"
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg font-black italic tracking-tight focus:outline-none focus:border-neon-red transition-all placeholder:text-gray-600 mb-4"
                            />

                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], setArtistLogo)}
                            />
                            {artistLogo ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4 p-4 bg-black/30 rounded-2xl border border-white/5 group">
                                        <div className="w-10 h-10 bg-white/5 rounded-lg p-1 flex items-center justify-center">
                                            <img src={artistLogo} alt="Logo" className={`w-full h-full object-contain ${invertArtistLogo ? 'invert brightness-200' : ''}`} />
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-gray-400 flex-1">Logo Artiste</p>
                                        <button onClick={() => setArtistLogo(null)} className="p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-all text-red-500"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                    <button
                                        onClick={() => setInvertArtistLogo(!invertArtistLogo)}
                                        className={`w-full py-2 rounded-xl border flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${invertArtistLogo ? 'bg-white border-white text-black' : 'border-white/10 text-gray-500 hover:border-white/20'}`}
                                    >
                                        <RefreshCw className={`w-3 h-3 ${invertArtistLogo ? 'animate-spin-slow' : ''}`} />
                                        Mode Négatif (Blanc) : {invertArtistLogo ? 'ON' : 'OFF'}
                                    </button>
                                    <div className="space-y-2 pt-2">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Taille Logo</span>
                                            <span className="text-[10px] font-black text-white tabular-nums">{artistLogoScale}%</span>
                                        </div>
                                        <input
                                            type="range" min={30} max={180} step={1}
                                            value={artistLogoScale}
                                            onChange={(e) => setArtistLogoScale(Number(e.target.value))}
                                            className="w-full h-1 bg-white/10 rounded-full appearance-none accent-neon-red cursor-pointer"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => logoInputRef.current?.click()}
                                    className="w-full py-3 rounded-xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3 text-gray-500 text-[10px] uppercase font-black tracking-widest"
                                >
                                    <Image className="w-4 h-4" /> Logo Artiste (Optionnel)
                                </button>
                            )}
                        </div>

                        {/* Photo Upload & Crop */}
                        <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-6 backdrop-blur-md">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-4">
                                {visualMode === 'interview' ? "Photo de l'artiste" : "Photo de couverture"} <span className="text-neon-red">*</span>
                            </label>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{error}</p>
                                </div>
                            )}
                            
                            <input
                                ref={photoInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], setArtistPhoto, true)}
                            />

                            {artistPhoto ? (
                                <div className="space-y-4">
                                    <div className="relative group rounded-2xl overflow-hidden aspect-[4/3] bg-black/20">
                                        <img src={artistPhoto} alt="Artist" className="w-full h-full object-contain" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <button onClick={() => { setImageToCrop(artistPhoto); setShowCropper(true); }} className="p-3 bg-white/20 rounded-2xl hover:bg-white/30 transition-all" title="Rogner"><Scissors className="w-5 h-5 text-white" /></button>
                                            <button onClick={() => photoInputRef.current?.click()} className="p-3 bg-white/20 rounded-2xl hover:bg-white/30 transition-all" title="Remplacer"><RefreshCw className="w-5 h-5 text-white" /></button>
                                            <button onClick={() => setArtistPhoto(null)} className="p-3 bg-red-500/20 rounded-2xl hover:bg-red-500/40 transition-all" title="Supprimer"><Trash2 className="w-5 h-5 text-red-400" /></button>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => { setImageToCrop(artistPhoto); setShowCropper(true); }}
                                        className="w-full py-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                    >
                                        <Scissors className="w-4 h-4" /> Rogner la photo
                                    </button>
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

                        {/* Photo Position Controls – zoom only, drag on preview for X/Y */}
                        {artistPhoto && (
                            <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-6 backdrop-blur-md space-y-5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Zoom photo</label>
                                    <button
                                        onClick={() => { setPhotoOffsetX(0); setPhotoOffsetY(0); setPhotoScale(100); }}
                                        className="text-[9px] font-black text-gray-600 hover:text-neon-red uppercase tracking-widest transition-colors"
                                    >
                                        Réinitialiser
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">⊞ Taille</span>
                                        <span className="text-[10px] font-black text-white tabular-nums">{photoScale}%</span>
                                    </div>
                                    <input
                                        type="range" min={50} max={200} step={1}
                                        value={photoScale}
                                        onChange={(e) => setPhotoScale(Number(e.target.value))}
                                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-neon-red cursor-pointer"
                                    />
                                </div>
                                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center pt-1">
                                    ✦ Glisse directement sur l'aperçu pour repositionner
                                </p>
                            </div>
                        )}

                        <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-6 backdrop-blur-md">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-4">Festival / Événement</label>
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
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4 p-4 bg-black/30 rounded-2xl border border-white/5">
                                        <img src={festivalLogo} alt="Logo" className={`h-10 w-10 object-contain ${invertFestivalLogo ? 'invert brightness-200' : ''}`} />
                                        <p className="text-[9px] font-black uppercase text-gray-400 flex-1">Logo Festival</p>
                                        <button onClick={() => setFestivalLogo(null)} className="p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-all"><Trash2 className="w-3 h-3 text-red-500" /></button>
                                    </div>
                                    <button
                                        onClick={() => setInvertFestivalLogo(!invertFestivalLogo)}
                                        className={`w-full py-2 rounded-xl border flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${invertFestivalLogo ? 'bg-white border-white text-black' : 'border-white/10 text-gray-500 hover:border-white/20'}`}
                                    >
                                        <RefreshCw className={`w-3 h-3 ${invertFestivalLogo ? 'animate-spin-slow' : ''}`} />
                                        Mode Négatif (Blanc) : {invertFestivalLogo ? 'ON' : 'OFF'}
                                    </button>
                                    <div className="space-y-2 pt-2">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Taille Logo Fest</span>
                                            <span className="text-[10px] font-black text-white tabular-nums">{festivalLogoScale}%</span>
                                        </div>
                                        <input
                                            type="range" min={30} max={180} step={1}
                                            value={festivalLogoScale}
                                            onChange={(e) => setFestivalLogoScale(Number(e.target.value))}
                                            className="w-full h-1 bg-white/10 rounded-full appearance-none accent-neon-red cursor-pointer"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => festivalLogoRef.current?.click()}
                                    className="w-full py-3 rounded-xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3 text-gray-500 text-[10px] uppercase font-black tracking-widest"
                                >
                                    <Upload className="w-4 h-4" /> Logo Festival (Optionnel)
                                </button>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                             <button
                                onClick={handleGenerate}
                                disabled={!artistPhoto || (!artistName.trim() && !artistLogo) || isGenerating}
                                className="flex items-center justify-center gap-2 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all disabled:opacity-40"
                            >
                                <Eye className="w-4 h-4" /> Prévisualiser
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={!artistPhoto || (!artistName.trim() && !artistLogo) || isGenerating}
                                className="flex items-center justify-center gap-2 py-5 bg-neon-red text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neon-red/80 transition-all shadow-[0_0_20px_rgba(255,0,51,0.3)] disabled:opacity-40"
                            >
                                <Download className="w-4 h-4" /> Télécharger {activeFormat === 'youtube' ? 'YouTube' : 'Instagram'}
                            </button>
                        </div>
                    </div>

                    {/* ─── RIGHT : PREVIEW ─── */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {(Object.keys(FORMATS) as Format[]).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setActiveFormat(f)}
                                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${activeFormat === f ? 'bg-white border-white text-black' : 'border-white/10 text-gray-500 hover:border-white/20 hover:text-white'}`}
                                    >
                                        {FORMATS[f].badge} — {FORMATS[f].ratio}
                                    </button>
                                ))}
                            </div>
                            <span className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">{fmt.w} × {fmt.h} px</span>
                        </div>

                        <div
                            ref={previewRef}
                            className={`w-full bg-black/40 border border-white/10 rounded-[40px] overflow-hidden flex items-center justify-center relative shadow-2xl select-none ${
                                isGenerating ? 'opacity-60' : ''
                            } ${artistPhoto && previewUrl ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
                            style={{ aspectRatio: fmt.w / fmt.h }}
                            onMouseDown={(e) => {
                                if (!artistPhoto || !previewUrl) return;
                                setIsDragging(true);
                                dragStartRef.current = { x: e.clientX, y: e.clientY, ox: photoOffsetX, oy: photoOffsetY };
                            }}
                            onMouseMove={(e) => {
                                if (!isDragging || !dragStartRef.current || !previewRef.current) return;
                                const rect = previewRef.current.getBoundingClientRect();
                                const dx = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
                                const dy = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
                                setPhotoOffsetX(Math.max(-100, Math.min(100, dragStartRef.current.ox + dx * 1.5)));
                                setPhotoOffsetY(Math.max(-100, Math.min(100, dragStartRef.current.oy + dy * 1.5)));
                            }}
                            onMouseUp={() => setIsDragging(false)}
                            onMouseLeave={() => setIsDragging(false)}
                            onTouchStart={(e) => {
                                if (!artistPhoto || !previewUrl) return;
                                const t = e.touches[0];
                                setIsDragging(true);
                                dragStartRef.current = { x: t.clientX, y: t.clientY, ox: photoOffsetX, oy: photoOffsetY };
                            }}
                            onTouchMove={(e) => {
                                if (!isDragging || !dragStartRef.current || !previewRef.current) return;
                                const rect = previewRef.current.getBoundingClientRect();
                                const t = e.touches[0];
                                const dx = ((t.clientX - dragStartRef.current.x) / rect.width) * 100;
                                const dy = ((t.clientY - dragStartRef.current.y) / rect.height) * 100;
                                setPhotoOffsetX(Math.max(-100, Math.min(100, dragStartRef.current.ox + dx * 1.5)));
                                setPhotoOffsetY(Math.max(-100, Math.min(100, dragStartRef.current.oy + dy * 1.5)));
                            }}
                            onTouchEnd={() => setIsDragging(false)}
                        >
                            {isGenerating && (
                                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 backdrop-blur-sm">
                                    <div className="w-12 h-12 border-4 border-neon-red/20 border-t-neon-red rounded-full animate-spin" />
                                </div>
                            )}
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain pointer-events-none" />
                            ) : (
                                <div className="flex flex-col items-center gap-6 text-gray-700">
                                    <Image className="w-16 h-16 opacity-20" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-center max-w-xs leading-relaxed">
                                        {!artistPhoto ? 'Importe une photo pour commencer' : 'Génère l\'aperçu pour voir le résultat'}
                                    </p>
                                </div>
                            )}
                            {/* Drag hint overlay */}
                            {artistPhoto && previewUrl && !isDragging && (
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/60 backdrop-blur-sm rounded-full pointer-events-none">
                                    <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">✦ Glisse pour repositionner</span>
                                </div>
                            )}
                        </div>

                        {/* Selective Export Buttons */}
                        {previewUrl && (
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={async () => {
                                        const url = activeFormat === 'youtube' ? previewUrl : await generate('youtube');
                                        if (!url) return;
                                        const name = artistName ? artistName.replace(/\s+/g, '_').toLowerCase() : 'dropsiders';
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `dropsiders_${visualMode}_${name}_youtube.png`;
                                        a.click();
                                    }}
                                    className="flex-1 py-5 bg-white text-black rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-100 transition-all flex items-center justify-center gap-3 shadow-xl"
                                >
                                    <Download className="w-4 h-4" /> YouTube (16:9)
                                </button>
                                <button
                                    onClick={async () => {
                                        const url = activeFormat === 'instagram' ? previewUrl : await generate('instagram');
                                        if (!url) return;
                                        const name = artistName ? artistName.replace(/\s+/g, '_').toLowerCase() : 'dropsiders';
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `dropsiders_${visualMode}_${name}_instagram.png`;
                                        a.click();
                                    }}
                                    className="flex-1 py-5 bg-white text-black rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-100 transition-all flex items-center justify-center gap-3 shadow-xl"
                                >
                                    <Download className="w-4 h-4" /> Instagram (4:5)
                                </button>
                            </div>
                        )}

                        {/* Tips */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8">
                            <h4 className="text-[10px] font-black text-neon-red uppercase tracking-[0.3em] mb-4 italic">Social Media Studio v2.0 Tips</h4>
                            <div className="grid md:grid-cols-2 gap-8">
                                <ul className="space-y-3 text-[10px] text-gray-500 font-bold uppercase tracking-wide leading-relaxed">
                                    <li className="flex items-start gap-2"><span className="text-neon-red italic">01.</span> Les visuels Instagram sont optimisés pour le mode Portrait (4:5) pour plus de visisbilité.</li>
                                    <li className="flex items-start gap-2"><span className="text-neon-red italic">02.</span> Rogne tes photos directement ici pour un cadrage parfait.</li>
                                </ul>
                                <ul className="space-y-3 text-[10px] text-gray-500 font-bold uppercase tracking-wide leading-relaxed">
                                    <li className="flex items-start gap-2"><span className="text-neon-red italic">03.</span> Le nom d'artiste disparait si le logo est présent pour éviter les doublons.</li>
                                    <li className="flex items-start gap-2"><span className="text-neon-red italic">04.</span> PNG transparent recommandé pour les logos artistes.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
