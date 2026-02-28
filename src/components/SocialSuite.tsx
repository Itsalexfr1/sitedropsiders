import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    X, Download, Type, Upload, PlusCircle, Layers,
    Music, Video, Layout, Trash2, Smartphone, Image as ImageIcon
} from 'lucide-react';

interface SocialSuiteProps {
    title: string;
    imageUrl: string;
    onClose: () => void;
}

type TabType = 'REEL' | 'PUBLICATION';
type ThemeType = 'TOP 5 ARTISTE' | 'TOP 5 STYLES' | 'NEWS' | 'FOCUS' | 'MUSIQUE' | 'RECAP';

interface Top5Item {
    main: string; // Artist or Genre
    sub: string;  // Song or Description
    value: string; // Streams or Percent
    spotifyUrl?: string;
}

const MUSIC_GENRES = [
    'HOUSE', 'TECH HOUSE', 'AFRO HOUSE', 'HARD TECHNO', 'HARD STYLE',
    'ELECTRO', 'INDIE DANCE', 'PROGRESSIVE', 'MELODIC', 'DRUM N BASS'
];

export function SocialSuite({ title, imageUrl, onClose }: SocialSuiteProps) {
    const [activeTab, setActiveTab] = useState<TabType>('PUBLICATION');
    const [theme, setTheme] = useState<ThemeType>('NEWS');
    const [showSwipe, setShowSwipe] = useState(false);
    const [customText, setCustomText] = useState((title || '').toUpperCase());
    const [bgImage, setBgImage] = useState<string>(imageUrl);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isVideoRecording, setIsVideoRecording] = useState(false);
    const [visualsList, setVisualsList] = useState<string[]>([]);

    // For Top 5 (Artiste or Styles)
    const [top5Items, setTop5Items] = useState<Top5Item[]>(Array.from({ length: 5 }, () => ({
        main: 'ARTISTE',
        sub: 'TITRE DU MORCEAU',
        value: '50',
        spotifyUrl: ''
    })));
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
    const [selectedGenre, setSelectedGenre] = useState('TECH HOUSE');

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const themeData: Record<ThemeType, { label: string; grad: string; color: string }> = {
        'TOP 5 ARTISTE': { label: 'TOP 5 ARTISTES', grad: '255, 18, 65', color: '#ff1241' },
        'TOP 5 STYLES': { label: 'TOP 5 STYLES', grad: '0, 240, 255', color: '#00f0ff' },
        'NEWS': { label: 'NEWS', grad: '255, 0, 51', color: '#ff0033' },
        'FOCUS': { label: 'FOCUS', grad: '255, 170, 0', color: '#ffaa00' },
        'MUSIQUE': { label: 'MUSIQUE', grad: '57, 255, 20', color: '#39ff14' },
        'RECAP': { label: 'REPLAY', grad: '189, 0, 255', color: '#bd00ff' }
    };

    // Auto-update theme when tab changes
    useEffect(() => {
        if (activeTab === 'REEL') setTheme('TOP 5 ARTISTE');
        else setTheme('NEWS');
    }, [activeTab]);

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

            // Canvas Setup
            canvas.width = 1080;
            canvas.height = activeTab === 'REEL' ? 1920 : 1440;

            const safeTop = (canvas.height - 1080) / 2;
            const safeBottom = safeTop + 1080;

            // 1. Draw Background
            if (img) {
                const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                const x = (canvas.width - img.width * scale) / 2;
                const y = (canvas.height - img.height * scale) / 2;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            } else {
                ctx.fillStyle = '#111';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // 2. Gradient Overlay
            const activeTheme = themeData[theme];
            const grad = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(0.3, 'rgba(0,0,0,0.2)');
            grad.addColorStop(0.8, `rgba(${activeTheme.grad}, 0.6)`);
            grad.addColorStop(1, `rgba(${activeTheme.grad}, 0.9)`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, canvas.height * 0.3, canvas.width, canvas.height * 0.7);

            // 3. Scanlines
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for (let i = 0; i < canvas.height; i += 6) ctx.fillRect(0, i, canvas.width, 2);

            // 4. Layout Logic
            if (theme.startsWith('TOP 5')) {
                const item = top5Items[currentPreviewIndex];
                const baseY = activeTab === 'REEL' ? 1500 : safeBottom - 280;

                // Main Info (Artist or Style)
                ctx.textAlign = 'left';
                ctx.fillStyle = '#ffffff';
                ctx.font = '900 italic 52px "Inter", sans-serif';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 10;
                ctx.fillText(`${item.main} - ${item.sub}`.toUpperCase(), 100, baseY);

                // Bar
                const barWidth = 880;
                const barHeight = 90;
                const barX = 90;
                const barY = baseY + 45;

                ctx.fillStyle = `rgba(${activeTheme.grad}, 0.4)`;
                ctx.fillRect(barX - 10, barY - 10, barWidth + 20, barHeight + 20);

                ctx.fillStyle = activeTheme.color;
                ctx.fillRect(barX, barY, barWidth, barHeight);

                ctx.fillStyle = theme === 'TOP 5 STYLES' ? '#000' : '#fff';
                ctx.font = '900 italic 46px "Inter", sans-serif';
                const labelSuffix = theme === 'TOP 5 STYLES' ? '% DE L\'AUDIENCE' : 'MILLIONS DE STREAMS';
                ctx.fillText(`${item.value} ${labelSuffix}`, barX + 30, barY + barHeight / 2 + 15);

                // Logo Mini (Spotify for Artists, Genre icon for styles?)
                const spotX = barX + barWidth - 60;
                const spotY = barY + barHeight / 2;
                ctx.beginPath();
                ctx.fillStyle = theme === 'TOP 5 STYLES' ? '#000' : '#1DB954';
                ctx.arc(spotX, spotY, 30, 0, Math.PI * 2);
                ctx.fill();

                // Rank
                ctx.textAlign = 'right';
                ctx.font = '900 italic 120px "Inter", sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.fillText(`#${5 - currentPreviewIndex}`, canvas.width - 100, canvas.height - 150);

            } else if (theme === 'MUSIQUE') {
                const singleItem = top5Items[0];
                const baseY = safeBottom - 220;

                // Genre Label
                ctx.textAlign = 'center';
                ctx.fillStyle = '#39ff14';
                const genreW = ctx.measureText(selectedGenre).width + 60;
                ctx.fillRect((canvas.width - genreW) / 2, safeTop + 240, genreW, 60);
                ctx.fillStyle = '#000';
                ctx.font = '900 italic 34px "Inter", sans-serif';
                ctx.fillText(selectedGenre, canvas.width / 2, safeTop + 282);

                // Text info
                ctx.textAlign = 'left';
                ctx.fillStyle = '#ffffff';
                ctx.font = '900 italic 52px "Inter", sans-serif';
                ctx.fillText(`${singleItem.main} - ${singleItem.sub}`.toUpperCase(), 100, baseY);

                const barY = baseY + 45;
                ctx.fillStyle = 'rgba(57, 255, 20, 0.4)';
                ctx.fillRect(80, barY - 10, 900, 110);
                ctx.fillStyle = '#39ff14';
                ctx.fillRect(90, barY, 880, 90);
                ctx.fillStyle = '#000';
                ctx.font = '900 italic 46px "Inter", sans-serif';
                ctx.fillText(`${singleItem.value} MILLIONS DE STREAMS`, 120, barY + 60);

            } else {
                // NEWS, FOCUS, RECAP
                const fontSize = 85;
                const lineHeight = fontSize * 1.2;
                ctx.font = `900 italic ${fontSize}px "Inter", sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillStyle = '#ffffff';

                const words = customText.split(' ');
                let lines: string[] = [];
                let currentLine = '';
                for (let word of words) {
                    if (ctx.measureText(currentLine + word).width < canvas.width - 200) currentLine += word + ' ';
                    else { lines.push(currentLine.trim()); currentLine = word + ' '; }
                }
                lines.push(currentLine.trim());

                const totalH = lines.length * lineHeight;
                const startY = safeBottom - 100 - (totalH / 2); // Lowest in 1:1

                // Label
                ctx.fillStyle = activeTheme.color;
                const labelW = ctx.measureText(activeTheme.label).width + 80;
                ctx.fillRect((canvas.width - labelW) / 2, startY - 100, labelW, 80);
                ctx.fillStyle = activeTheme.color === '#ffaa00' ? '#000' : '#fff';
                ctx.font = '900 italic 50px "Inter", sans-serif';
                ctx.fillText(activeTheme.label, canvas.width / 2, startY - 45);

                ctx.font = `900 italic ${fontSize}px "Inter", sans-serif`;
                lines.forEach((line, i) => ctx.fillText(line, canvas.width / 2, startY + (i * lineHeight)));
            }

            // Official Logo - ABSOLUTE TOP
            try {
                const logo = new Image();
                logo.src = '/Logo.png';
                await new Promise(r => { logo.onload = r; logo.onerror = r; });
                if (logo.complete && logo.width > 0) {
                    const w = 320;
                    ctx.drawImage(logo, canvas.width - w - 40, 40, w, (logo.height * w) / logo.width);
                }
            } catch { }

            // Swipe arrows
            if (showSwipe) {
                ctx.textAlign = 'right';
                ctx.font = '900 italic 38px "Inter", sans-serif';
                ctx.fillStyle = '#fff';
                ctx.fillText('>>', canvas.width - 80, safeBottom - 30);
            }

        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => { generateImage(); }, [bgImage, customText, theme, showSwipe, top5Items, currentPreviewIndex, selectedGenre, activeTab]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setBgImage(URL.createObjectURL(file));
    };

    const startVideoRecording = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setIsVideoRecording(true);
        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dropsiders-${theme.replace(/ /g, '-')}-${Date.now()}.webm`;
            a.click();
            setIsVideoRecording(false);
        };
        recorder.start();
        for (let i = 0; i < 5; i++) {
            setCurrentPreviewIndex(i);
            await new Promise(r => setTimeout(r, 12000));
        }
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

                {/* Sidebar */}
                <div className="w-full lg:w-[400px] border-r border-white/10 p-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-white italic tracking-tighter">SOCIAL STUDIO</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Générateur de publications</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all"><X className="w-5 h-5" /></button>
                    </div>

                    {/* Main Tabs */}
                    <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                        <button onClick={() => setActiveTab('REEL')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'REEL' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                            <Smartphone className="w-4 h-4" /> REEL
                        </button>
                        <button onClick={() => setActiveTab('PUBLICATION')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'PUBLICATION' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                            <ImageIcon className="w-4 h-4" /> PUBLICATION
                        </button>
                    </div>

                    {/* Sub-Themes */}
                    <div className="grid grid-cols-2 gap-2">
                        {activeTab === 'REEL' ? (
                            <>
                                <button onClick={() => setTheme('TOP 5 ARTISTE')} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all border ${theme === 'TOP 5 ARTISTE' ? 'bg-neon-red/20 border-neon-red text-neon-red' : 'bg-white/5 border-white/5 text-gray-400'}`}>TOP 5 ARTISTES</button>
                                <button onClick={() => setTheme('TOP 5 STYLES')} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all border ${theme === 'TOP 5 STYLES' ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'bg-white/5 border-white/5 text-gray-400'}`}>TOP 5 STYLES</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setTheme('NEWS')} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all border ${theme === 'NEWS' ? 'bg-neon-red/20 border-neon-red text-neon-red' : 'bg-white/5 border-white/5 text-gray-400'}`}>NEWS</button>
                                <button onClick={() => setTheme('FOCUS')} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all border ${theme === 'FOCUS' ? 'bg-[#ffaa00]/20 border-[#ffaa00] text-[#ffaa00]' : 'bg-white/5 border-white/5 text-gray-400'}`}>FOCUS</button>
                                <button onClick={() => setTheme('MUSIQUE')} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all border ${theme === 'MUSIQUE' ? 'bg-neon-green/20 border-neon-green text-neon-green' : 'bg-white/5 border-white/5 text-gray-400'}`}>MUSIQUE</button>
                                <button onClick={() => setTheme('RECAP')} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all border ${theme === 'RECAP' ? 'bg-neon-purple/20 border-neon-purple text-neon-purple' : 'bg-white/5 border-white/5 text-gray-400'}`}>RECAP</button>
                            </>
                        )}
                    </div>

                    {/* Fields based on Theme */}
                    {theme.startsWith('TOP 5') ? (
                        <div className="space-y-4">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Édition des 5 éléments</span>
                            <div className="space-y-3">
                                {top5Items.map((item, i) => (
                                    <div key={i} className={`p-4 rounded-2xl border transition-all cursor-pointer ${currentPreviewIndex === i ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/5'}`} onClick={() => setCurrentPreviewIndex(i)}>
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <input value={item.main} onChange={e => {
                                                const news = [...top5Items];
                                                news[i] = { ...item, main: e.target.value.toUpperCase() };
                                                setTop5Items(news);
                                            }} placeholder={theme === 'TOP 5 STYLES' ? "STYLE" : "ARTISTE"} className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold" />
                                            <input value={item.sub} onChange={e => {
                                                const news = [...top5Items];
                                                news[i] = { ...item, sub: e.target.value.toUpperCase() };
                                                setTop5Items(news);
                                            }} placeholder={theme === 'TOP 5 STYLES' ? "DESCRIPTION" : "TITRE"} className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold" />
                                        </div>
                                        <input value={item.value} onChange={e => {
                                            const news = [...top5Items];
                                            news[i] = { ...item, value: e.target.value };
                                            setTop5Items(news);
                                        }} placeholder={theme === 'TOP 5 STYLES' ? "% AUDIENCE" : "STREAMS (MILLIONS)"} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : theme === 'MUSIQUE' ? (
                        <div className="space-y-6">
                            <div className="flex flex-wrap gap-2">
                                {MUSIC_GENRES.map(g => (
                                    <button key={g} onClick={() => setSelectedGenre(g)} className={`px-2 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${selectedGenre === g ? 'bg-neon-green text-black' : 'bg-white/5 text-gray-400'}`}>{g}</button>
                                ))}
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <input value={top5Items[0].main} onChange={e => { const n = [...top5Items]; n[0].main = e.target.value.toUpperCase(); setTop5Items(n); }} className="bg-white/10 rounded-lg p-2 text-[10px] text-white font-bold" placeholder="ARTISTE" />
                                    <input value={top5Items[0].sub} onChange={e => { const n = [...top5Items]; n[0].sub = e.target.value.toUpperCase(); setTop5Items(n); }} className="bg-white/10 rounded-lg p-2 text-[10px] text-white font-bold" placeholder="TITRE" />
                                </div>
                                <input value={top5Items[0].value} onChange={e => { const n = [...top5Items]; n[0].value = e.target.value; setTop5Items(n); }} className="w-full bg-white/10 rounded-lg p-2 text-[10px] text-white font-bold" placeholder="STREAMS" />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Contenu du post</span>
                            <textarea value={customText} onChange={e => setCustomText(e.target.value.toUpperCase())} className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold italic resize-none" />
                        </div>
                    )}

                    {/* Shared controls */}
                    <div className="space-y-4 mt-auto">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer" onClick={() => setShowSwipe(!showSwipe)}>
                            <div className="flex items-center gap-3">
                                <Layout className="w-4 h-4 text-gray-500" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Logo Swipe</span>
                            </div>
                            <div className={`w-8 h-4 rounded-full relative ${showSwipe ? 'bg-neon-red' : 'bg-gray-800'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${showSwipe ? 'right-0.5' : 'left-0.5'}`} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            {activeTab === 'REEL' ? (
                                <button onClick={startVideoRecording} disabled={isVideoRecording} className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-3 transition-all ${isVideoRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-neon-red/10 border border-neon-red/30 text-neon-red hover:bg-neon-red/20'}`}>
                                    <Video className="w-4 h-4" /> {isVideoRecording ? 'ENREGISTREMENT...' : `Générer Vidéo ${theme}`}
                                </button>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={addVisualToList} className="py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-white/10 transition-all"><PlusCircle className="w-3.5 h-3.5" /> Ajouter</button>
                                    <button onClick={downloadSingle} disabled={isDownloading} className="py-4 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-neon-cyan/20 transition-all">
                                        <Download className="w-3.5 h-3.5" /> {isDownloading ? '...' : 'Télécharger'}
                                    </button>
                                </div>
                            )}
                            {visualsList.length > 0 && activeTab === 'PUBLICATION' && (
                                <div className="grid grid-cols-4 gap-2 py-2">
                                    {visualsList.slice(-4).map((src, idx) => (
                                        <div key={idx} className="aspect-[3/4] bg-white/5 rounded-lg overflow-hidden border border-white/10"><img src={src} className="w-full h-full object-cover" /></div>
                                    ))}
                                </div>
                            )}
                            <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-gray-500 text-[10px] font-black uppercase hover:border-white/30 transition-all"><Upload className="w-4 h-4" /> Modifier fond</button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="flex-1 bg-[#020202] p-8 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="h-full w-full max-w-[450px] relative">
                        <div className="w-full h-full bg-[#111] rounded-[30px] overflow-hidden border border-white/10 shadow-2xl relative">
                            <canvas ref={canvasRef} className="w-full h-full object-contain" />
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
