import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    X, Download, Type, Upload, PlusCircle, Layers,
    Music, Video, Layout, Trash2
} from 'lucide-react';

interface SocialSuiteProps {
    title: string;
    imageUrl: string;
    onClose: () => void;
}

type ThemeType = 'NEWS' | 'RECAP' | 'MUSIQUE' | 'INTERVIEW' | 'TOP5';

interface Top5Track {
    artist: string;
    song: string;
    streams: string;
    spotifyUrl: string;
}

const MUSIC_GENRES = [
    'HOUSE', 'TECH HOUSE', 'AFRO HOUSE', 'HARD TECHNO', 'HARD STYLE',
    'ELECTRO', 'INDIE DANCE', 'PROGRESSIVE', 'MELODIC', 'DRUM N BASS'
];

export function SocialSuite({ title, imageUrl, onClose }: SocialSuiteProps) {
    const [theme, setTheme] = useState<ThemeType>('NEWS');
    const [showSwipe, setShowSwipe] = useState(false);
    const [customText, setCustomText] = useState((title || '').toUpperCase());
    const [bgImage, setBgImage] = useState<string>(imageUrl);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isVideoRecording, setIsVideoRecording] = useState(false);
    const [visualsList, setVisualsList] = useState<string[]>([]);
    const [top5Tracks, setTop5Tracks] = useState<Top5Track[]>(Array.from({ length: 5 }, () => ({
        artist: 'ARTISTE',
        song: 'TITRE DU MORCEAU',
        streams: '50',
        spotifyUrl: ''
    })));
    const [currentPreviewTrack, setCurrentPreviewTrack] = useState(0);
    const [selectedGenre, setSelectedGenre] = useState('TECH HOUSE');

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const themeColors: Record<ThemeType, { label: string; grad: string }> = {
        'NEWS': { label: '#ff0033', grad: '255, 0, 51' },
        'RECAP': { label: '#bd00ff', grad: '189, 0, 255' },
        'MUSIQUE': { label: '#39ff14', grad: '57, 255, 20' },
        'INTERVIEW': { label: '#00f0ff', grad: '0, 240, 255' },
        'TOP5': { label: '#ff1241', grad: '255, 18, 65' }
    };

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

                await new Promise((resolve, reject) => {
                    img!.onload = resolve;
                    img!.onerror = reject;
                });
            }

            // Set canvas size (Post 1080x1440)
            canvas.width = 1080;
            canvas.height = 1440;

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

            // 2. Draw Gradient Overlay
            const activeColor = themeColors[theme];
            const grad = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(0.3, 'rgba(0,0,0,0.2)');
            grad.addColorStop(0.8, `rgba(${activeColor.grad}, 0.6)`);
            grad.addColorStop(1, `rgba(${activeColor.grad}, 0.9)`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, canvas.height * 0.3, canvas.width, canvas.height * 0.7);

            // 3. Scanlines
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for (let i = 0; i < canvas.height; i += 6) {
                ctx.fillRect(0, i, canvas.width, 2);
            }

            // 4. Layout Logic
            if (theme === 'TOP5') {
                const track = top5Tracks[currentPreviewTrack];
                const baseY = canvas.height - 380;

                // Artist - Song
                ctx.textAlign = 'left';
                ctx.fillStyle = '#ffffff';
                ctx.font = '900 italic 52px "Inter", sans-serif';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 10;
                ctx.fillText(`${track.artist} - ${track.song}`.toUpperCase(), 100, baseY);

                // Streams Bar
                const barWidth = 880;
                const barHeight = 90;
                const barX = 90;
                const barY = baseY + 45;

                ctx.fillStyle = 'rgba(189, 0, 255, 0.4)'; // Purple glow
                ctx.fillRect(barX - 10, barY - 10, barWidth + 20, barHeight + 20);

                ctx.fillStyle = '#ff1241'; // Solid Dropsiders Red
                ctx.fillRect(barX, barY, barWidth, barHeight);

                ctx.fillStyle = '#ffffff';
                ctx.font = '900 italic 46px "Inter", sans-serif';
                ctx.fillText(`${track.streams} MILLIONS DE STREAMS`, barX + 30, barY + barHeight / 2 + 15);

                // Spotify Logo (Mini)
                const spotX = barX + barWidth - 60;
                const spotY = barY + barHeight / 2;
                ctx.beginPath();
                ctx.fillStyle = '#1DB954';
                ctx.arc(spotX, spotY, 30, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 4;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.arc(spotX, spotY + 5, 20 - i * 5, -1.2, -0.2);
                    ctx.stroke();
                }

                // Rank
                ctx.textAlign = 'right';
                ctx.font = '900 italic 120px "Inter", sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.fillText(`#${5 - currentPreviewTrack}`, canvas.width - 100, canvas.height - 150);

            } else if (theme === 'MUSIQUE') {
                // Single Track Layout (Similar to TOP 5)
                const track = top5Tracks[0];
                const baseY = canvas.height - 380;

                // Genre Label Top Center
                ctx.textAlign = 'center';
                ctx.fillStyle = '#39ff14'; // Music Green
                const genreW = ctx.measureText(selectedGenre).width + 60;
                ctx.fillRect((canvas.width - genreW) / 2, 450, genreW, 60);
                ctx.fillStyle = '#000';
                ctx.font = '900 italic 34px "Inter", sans-serif';
                ctx.fillText(selectedGenre, canvas.width / 2, 492);

                // Artist - Song
                ctx.textAlign = 'left';
                ctx.fillStyle = '#ffffff';
                ctx.font = '900 italic 52px "Inter", sans-serif';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 10;
                ctx.fillText(`${track.artist} - ${track.song}`.toUpperCase(), 100, baseY);

                // Streams Bar
                const barWidth = 880;
                const barHeight = 90;
                const barX = 90;
                const barY = baseY + 45;

                ctx.fillStyle = 'rgba(57, 255, 20, 0.4)'; // Green glow
                ctx.fillRect(barX - 10, barY - 10, barWidth + 20, barHeight + 20);

                ctx.fillStyle = '#39ff14'; // Music Green
                ctx.fillRect(barX, barY, barWidth, barHeight);

                ctx.fillStyle = '#000';
                ctx.font = '900 italic 46px "Inter", sans-serif';
                ctx.fillText(`${track.streams} MILLIONS DE STREAMS`, barX + 30, barY + barHeight / 2 + 15);

                // Spotify Logo (Mini)
                const spotX = barX + barWidth - 60;
                const spotY = barY + barHeight / 2;
                ctx.beginPath();
                ctx.fillStyle = '#000';
                ctx.arc(spotX, spotY, 30, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#39ff14';
                ctx.lineWidth = 4;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.arc(spotX, spotY + 5, 20 - i * 5, -1.2, -0.2);
                    ctx.stroke();
                }

            } else {
                // Classic News Layout
                const fontSize = 85;
                const lineHeight = fontSize * 1.2;
                ctx.font = `900 italic ${fontSize}px "Inter", sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillStyle = '#ffffff';

                const words = customText.split(' ');
                let lines: string[] = [];
                let currentLine = '';
                for (let word of words) {
                    if (ctx.measureText(currentLine + word).width < canvas.width - 200) {
                        currentLine += word + ' ';
                    } else {
                        lines.push(currentLine.trim());
                        currentLine = word + ' ';
                    }
                }
                lines.push(currentLine.trim());

                const totalH = lines.length * lineHeight;
                const startY = canvas.height - 220 - (totalH / 2); // Lowered from 400 to 220 to be near the bottom safe zone (1260)

                // Label
                ctx.fillStyle = activeColor.label;
                const labelW = ctx.measureText(theme).width + 80;
                ctx.fillRect((canvas.width - labelW) / 2, startY - 100, labelW, 80);
                ctx.fillStyle = '#fff';
                ctx.font = '900 italic 50px "Inter", sans-serif';
                ctx.fillText(theme, canvas.width / 2, startY - 45);

                ctx.font = `900 italic ${fontSize}px "Inter", sans-serif`;
                lines.forEach((line, i) => {
                    ctx.fillText(line, canvas.width / 2, startY + (i * lineHeight));
                });
            }

            // Top Right Official Logo
            try {
                const logo = new Image();
                logo.src = '/Logo.png';
                await new Promise(r => { logo.onload = r; logo.onerror = r; });
                if (logo.complete && logo.width > 0) {
                    const w = 320;
                    ctx.drawImage(logo, canvas.width - w - 60, 190, w, (logo.height * w) / logo.width);
                }
            } catch { }

            // Swipe arrows
            if (showSwipe) {
                ctx.textAlign = 'right';
                ctx.font = '900 italic 38px "Inter", sans-serif';
                ctx.fillStyle = '#fff';
                ctx.fillText('>>', canvas.width - 80, 1250);
            }

        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => { generateImage(); }, [bgImage, customText, theme, showSwipe, top5Tracks, currentPreviewTrack, selectedGenre]);

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
            a.download = `dropsiders-top5-${Date.now()}.webm`;
            a.click();
            setIsVideoRecording(false);
        };
        recorder.start();
        for (let i = 0; i < 5; i++) {
            setCurrentPreviewTrack(i);
            await new Promise(r => setTimeout(r, 12000)); // 12s per track = 60s total
        }
        recorder.stop();
    };

    const addVisualToList = () => {
        if (!canvasRef.current) return;
        setVisualsList([...visualsList, canvasRef.current.toDataURL('image/png')]);
    };

    const removeVisual = (index: number) => {
        setVisualsList(visualsList.filter((_, i) => i !== index));
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

    const downloadAll = async () => {
        setIsDownloading(true);
        for (let i = 0; i < visualsList.length; i++) {
            const a = document.createElement('a');
            a.download = `dropsiders-pack-${i}.png`;
            a.href = visualsList[i];
            a.click();
            await new Promise(r => setTimeout(r, 300));
        }
        setIsDownloading(false);
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

                    {/* Themes */}
                    <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(themeColors) as ThemeType[]).map(t => (
                            <button key={t} onClick={() => setTheme(t)} className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${theme === t ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/20'}`}>
                                {t === 'TOP5' ? 'VIDEO TOP 5' : t}
                            </button>
                        ))}
                    </div>

                    {theme === 'TOP5' ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-neon-red">
                                <Music className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Top 5 Artistes</span>
                            </div>
                            <div className="space-y-4">
                                {top5Tracks.map((track, i) => (
                                    <div key={i} className={`p-4 rounded-2xl border transition-all ${currentPreviewTrack === i ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/5'}`} onClick={() => setCurrentPreviewTrack(i)}>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-black text-neon-red"># {5 - i}</span>
                                            {currentPreviewTrack === i && <span className="text-[8px] font-black text-white/40 uppercase">Aperçu actif</span>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <input value={track.artist} onChange={e => {
                                                const news = [...top5Tracks];
                                                news[i] = { ...track, artist: e.target.value.toUpperCase() };
                                                setTop5Tracks(news);
                                            }} placeholder="ARTISTE" className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold" />
                                            <input value={track.song} onChange={e => {
                                                const news = [...top5Tracks];
                                                news[i] = { ...track, song: e.target.value.toUpperCase() };
                                                setTop5Tracks(news);
                                            }} placeholder="TITRE" className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold" />
                                        </div>
                                        <div className="flex gap-2">
                                            <input value={track.streams} onChange={e => {
                                                const news = [...top5Tracks];
                                                news[i] = { ...track, streams: e.target.value };
                                                setTop5Tracks(news);
                                            }} placeholder="STREAMS (MILLIONS)" className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold" />
                                            <input value={track.spotifyUrl} onChange={e => {
                                                const news = [...top5Tracks];
                                                news[i] = { ...track, spotifyUrl: e.target.value };
                                                setTop5Tracks(news);
                                            }} placeholder="LIEN SPOTIFY" className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : theme === 'MUSIQUE' ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-neon-green">
                                <Music className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Style Musical</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {MUSIC_GENRES.map(g => (
                                    <button key={g} onClick={() => setSelectedGenre(g)} className={`px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${selectedGenre === g ? 'bg-neon-green text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                                        {g}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <input value={top5Tracks[0].artist} onChange={e => {
                                            const news = [...top5Tracks];
                                            news[0] = { ...news[0], artist: e.target.value.toUpperCase() };
                                            setTop5Tracks(news);
                                        }} placeholder="ARTISTE" className="bg-white/10 border border-white/20 rounded-lg p-2 text-[10px] text-white font-bold" />
                                        <input value={top5Tracks[0].song} onChange={e => {
                                            const news = [...top5Tracks];
                                            news[0] = { ...news[0], song: e.target.value.toUpperCase() };
                                            setTop5Tracks(news);
                                        }} placeholder="TITRE" className="bg-white/10 border border-white/20 rounded-lg p-2 text-[10px] text-white font-bold" />
                                    </div>
                                    <input value={top5Tracks[0].streams} onChange={e => {
                                        const news = [...top5Tracks];
                                        news[0] = { ...news[0], streams: e.target.value };
                                        setTop5Tracks(news);
                                    }} placeholder="STREAMS (MILLIONS)" className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-[10px] text-white font-bold" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-neon-cyan"><Type className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Texte de l'article</span></div>
                            <textarea value={customText} onChange={e => setCustomText(e.target.value.toUpperCase())} className="w-full h-28 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold italic resize-none" />
                        </div>
                    )}

                    {/* Swipe Toggle */}
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer group hover:border-white/20 transition-all mb-4" onClick={() => setShowSwipe(!showSwipe)}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${showSwipe ? 'bg-neon-red/10 text-neon-red' : 'bg-white/5 text-gray-500'}`}>
                                <Layout className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Logo Swipe</span>
                        </div>
                        <div className={`w-8 h-4 rounded-full relative ${showSwipe ? 'bg-neon-red' : 'bg-gray-800'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${showSwipe ? 'right-0.5' : 'left-0.5'}`} />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/10">
                        {theme === 'TOP5' ? (
                            <button onClick={startVideoRecording} disabled={isVideoRecording} className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${isVideoRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-neon-red/10 border border-neon-red/30 text-neon-red hover:bg-neon-red/20 shadow-[0_0_20px_rgba(255,18,65,0.1)]'}`}>
                                <Video className="w-4 h-4" />
                                {isVideoRecording ? 'ENREGISTREMENT...' : 'Générer Vidéo Top 5'}
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={addVisualToList} className="py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all"><PlusCircle className="w-3.5 h-3.5" /> Ajouter</button>
                                    <button onClick={downloadSingle} disabled={isDownloading} className="py-4 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neon-cyan/20 transition-all shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                                        <Download className="w-3.5 h-3.5" />
                                        {isDownloading ? '...' : 'Télécharger'}
                                    </button>
                                </div>

                                {visualsList.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-2">
                                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Collection ({visualsList.length})</span>
                                            <button onClick={() => setVisualsList([])} className="text-[8px] font-black text-red-500 uppercase hover:underline">Vider</button>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {visualsList.slice(-4).map((src, idx) => (
                                                <div key={idx} className="aspect-[3/4] bg-white/5 rounded-lg overflow-hidden border border-white/10 relative group">
                                                    <img src={src} className="w-full h-full object-cover" />
                                                    <button onClick={() => removeVisual(idx)} className="absolute top-1 right-1 p-1 bg-black/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-2 h-2 text-white" /></button>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={downloadAll} disabled={isDownloading} className="w-full py-3 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                                            <Layers className="w-3.5 h-3.5" /> Tout Télécharger
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-gray-500 text-[10px] font-black uppercase hover:border-white/30 transition-all"><Upload className="w-4 h-4" /> Modifier fond</button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    </div>
                </div>

                {/* Preview */}
                <div className="flex-1 bg-[#020202] p-8 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="h-full w-full max-w-[450px] relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-neon-red/10 via-neon-purple/10 to-neon-cyan/10 blur-3xl opacity-50" />
                        <div className="w-full h-full bg-[#111] rounded-[30px] overflow-hidden border border-white/10 shadow-2xl relative">
                            <canvas ref={canvasRef} className="w-full h-full object-contain" />
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

