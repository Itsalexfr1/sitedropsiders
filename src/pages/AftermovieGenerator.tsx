import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, Upload, Video, Music, Trash2, 
    RefreshCw, Film, Play, List, Sparkles, Zap, Layers, Plus
} from 'lucide-react';
import { isSuperAdmin } from '../utils/auth';

interface Clip {
    id: string;
    blobUrl: string;
    file: File;
    duration: number;
    title: string;
}

export function AftermovieGenerator() {
    const navigate = useNavigate();
    const adminUser = localStorage.getItem('admin_user');
    const storedPermissions = JSON.parse(localStorage.getItem('admin_permissions') || '[]');
    const isAuthorized = storedPermissions.includes('all') || storedPermissions.includes('social') || isSuperAdmin(adminUser);

    const [clips, setClips] = useState<Clip[]>([]);
    const [music, setMusic] = useState<{ blobUrl: string; file: File } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<'none' | 'neon' | 'vhs' | 'glitch'>('neon');
    const [showLogo, setShowLogo] = useState(true);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dropsidersLogo = useRef<HTMLImageElement | null>(null);

    // Initial load logo
    useEffect(() => {
        const img = new window.Image();
        img.src = '/Logo.png';
        img.onload = () => { dropsidersLogo.current = img; };
    }, []);

    const handleVideoImport = (files: FileList | null) => {
        if (!files) return;
        const newClips: Clip[] = [];
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('video/')) return;
            const url = URL.createObjectURL(file);
            newClips.push({
                id: Math.random().toString(36).substr(2, 9),
                blobUrl: url,
                file: file,
                duration: 0, // calculated on load
                title: file.name
            });
        });
        setClips(prev => [...prev, ...newClips]);
    };

    const handleMusicImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('audio/')) {
            if (music) URL.revokeObjectURL(music.blobUrl);
            setMusic({
                blobUrl: URL.createObjectURL(file),
                file: file
            });
        }
    };

    const removeClip = (id: string) => {
        setClips(prev => {
            const clip = prev.find(c => c.id === id);
            if (clip) URL.revokeObjectURL(clip.blobUrl);
            return prev.filter(c => c.id !== id);
        });
    };

    /* ─────────────────────────────────────
       VIDEO GENERATION LOGIC
    ───────────────────────────────────── */
    const generateAftermovie = async () => {
        if (clips.length === 0) return;
        setIsGenerating(true);
        setProgress(0);
        setPreviewUrl(null);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false })!;
        
        // Final Quality Settings (Full HD 1080p or 720p)
        canvas.width = 1280;
        canvas.height = 720;
        const w = canvas.width;
        const h = canvas.height;

        const stream = canvas.captureStream(30); // 30 FPS
        
        // Add Audio
        const audioContext = new AudioContext();
        const dest = audioContext.createMediaStreamDestination();
        
        if (music) {
            const musicEl = new Audio(music.blobUrl);
            musicEl.crossOrigin = "anonymous";
            const musicSource = audioContext.createMediaElementSource(musicEl);
            musicSource.connect(dest);
            musicSource.connect(audioContext.destination);
            musicEl.play();
        }

        const combinedStream = new MediaStream([
            ...stream.getVideoTracks(),
            ...dest.stream.getAudioTracks()
        ]);

        const recorder = new MediaRecorder(combinedStream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 8000000 // 8 Mbps
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            setPreviewUrl(URL.createObjectURL(blob));
            setIsGenerating(false);
            if (audioContext.state !== 'closed') audioContext.close();
        };

        recorder.start();

        const videoEl = document.createElement('video');
        videoEl.muted = true;
        videoEl.playsInline = true;

        for (let i = 0; i < clips.length; i++) {
            const clip = clips[i];
            setProgress(Math.round(((i) / clips.length) * 100));
            
            await new Promise<void>((resolve) => {
                videoEl.src = clip.blobUrl;
                videoEl.onloadeddata = () => {
                    videoEl.play();
                    
                    const drawFrame = () => {
                        if (videoEl.paused || videoEl.ended) {
                            resolve();
                            return;
                        }

                        // 1. Draw Background
                        ctx.fillStyle = '#000';
                        ctx.fillRect(0, 0, w, h);

                        // 2. Center & Fill Video
                        const vRatio = videoEl.videoWidth / videoEl.videoHeight;
                        const cRatio = w / h;
                        let dw, dh, dx, dy;
                        
                        if (vRatio > cRatio) {
                            dw = h * vRatio;
                            dh = h;
                            dx = (w - dw) / 2;
                            dy = 0;
                        } else {
                            dw = w;
                            dh = w / vRatio;
                            dx = 0;
                            dy = (h - dh) / 2;
                        }
                        ctx.drawImage(videoEl, dx, dy, dw, dh);

                        // 3. APPLY FILTERS
                        if (activeFilter === 'neon') {
                            ctx.save();
                            ctx.globalCompositeOperation = 'screen';
                            ctx.fillStyle = 'rgba(255,0,51,0.05)';
                            ctx.fillRect(0, 0, w, h);
                            ctx.restore();
                        } else if (activeFilter === 'vhs') {
                            ctx.save();
                            ctx.globalAlpha = 0.1;
                            ctx.fillStyle = i % 2 === 0 ? '#ff00ff' : '#00ffff';
                            ctx.fillRect(Math.random() * 2, Math.random() * 2, w, h);
                            ctx.restore();
                        }

                        // 4. WATERMARK
                        if (showLogo && dropsidersLogo.current) {
                            const lw = 150;
                            const lh = lw * (dropsidersLogo.current.height / dropsidersLogo.current.width);
                            ctx.globalAlpha = 0.8;
                            ctx.drawImage(dropsidersLogo.current, w - lw - 40, 40, lw, lh);
                            ctx.globalAlpha = 1;
                        }

                        // 5. FLASH EFFECT (at start of clip)
                        if (videoEl.currentTime < 0.2) {
                            ctx.fillStyle = `rgba(255,255,255,${1 - (videoEl.currentTime * 5)})`;
                            ctx.fillRect(0, 0, w, h);
                        }

                        requestAnimationFrame(drawFrame);
                    };
                    drawFrame();
                };
            });
        }

        setProgress(100);
        recorder.stop();
        videoEl.pause();
        videoEl.src = "";
    };

    if (!isAuthorized) return <div className="p-20 text-white text-center font-black">ACCÈS REFUSÉ</div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <div className="max-w-7xl mx-auto px-6 py-12">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <button onClick={() => navigate('/admin')} className="mb-4 text-gray-500 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors group">
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Retour Studio
                        </button>
                        <h1 className="text-5xl font-display font-black uppercase italic italic tracking-tighter">
                            Aftermovie <span className="text-neon-red">Maker</span>
                        </h1>
                        <p className="text-gray-500 text-[10px] uppercase font-black tracking-[0.3em] mt-2">Générateur de séquences festivals v1.0</p>
                    </div>
                    
                    <div className="flex gap-4">
                        <button 
                            onClick={generateAftermovie}
                            disabled={clips.length === 0 || isGenerating}
                            className="bg-neon-red text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_25px_rgba(255,0,51,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-3"
                        >
                            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Film className="w-4 h-4 text-white" />}
                            {isGenerating ? `Génération (${progress}%)` : 'Générer l\'aftermovie'}
                        </button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-[1fr_400px] gap-10">
                    
                    {/* LEFTSIDE: CLIP MANAGEMENT */}
                    <div className="space-y-8">
                        
                        {/* Preview Area */}
                        <div className="aspect-video bg-black/40 border border-white/10 rounded-[2.5rem] overflow-hidden relative shadow-2xl group">
                            {previewUrl ? (
                                <video src={previewUrl} controls className="w-full h-full" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-4">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                        <Play className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest">Prévisualisation du rendu</p>
                                </div>
                            )}
                            
                            {isGenerating && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-6 z-20">
                                    <div className="relative w-40 h-40">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle cx="80" cy="80" r="70" className="stroke-white/5 fill-none" strokeWidth="8" />
                                            <circle 
                                                cx="80" cy="80" r="70" 
                                                className="stroke-neon-red fill-none transition-all duration-500" 
                                                strokeWidth="8" 
                                                strokeDasharray={440}
                                                strokeDashoffset={440 - (progress / 100) * 440}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-3xl font-display font-black italic">{progress}%</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neon-red animate-pulse italic">Encodage des séquences...</p>
                                </div>
                            )}
                        </div>

                        {/* Timeline */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                    <List className="w-4 h-4 text-neon-red" />
                                    Timeline des clips ({clips.length})
                                </h3>
                                <button
                                    onClick={() => document.getElementById('video-upload')?.click()}
                                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 group"
                                >
                                    <Plus className="w-4 h-4 text-gray-500 group-hover:text-white" />
                                </button>
                                <input id="video-upload" type="file" multiple accept="video/*" className="hidden" onChange={(e) => handleVideoImport(e.target.files)} />
                            </div>

                            {clips.length === 0 ? (
                                <div 
                                    onClick={() => document.getElementById('video-upload')?.click()}
                                    className="h-48 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-neon-red/30 hover:bg-neon-red/[0.02] transition-all group"
                                >
                                    <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
                                        <Upload className="w-6 h-6 text-gray-600 group-hover:text-neon-red" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 group-hover:text-white transition-colors">Dépose tes clips vidéo ici</p>
                                        <p className="text-[9px] text-gray-700 font-bold uppercase mt-1">MP4, MOV ou WEBM conseillés</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {clips.map((clip, index) => (
                                        <div key={clip.id} className="relative group rounded-2xl overflow-hidden aspect-[4/3] bg-black border border-white/10 shadow-lg">
                                            <video src={clip.blobUrl} className="w-full h-full object-cover opacity-60" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded-md text-[8px] font-black italic">#{index+1}</div>
                                            <button 
                                                onClick={() => removeClip(clip.id)}
                                                className="absolute top-2 right-2 p-1.5 bg-red-500/20 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all text-white scale-75"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                            <div className="absolute bottom-2 left-2 right-2 truncate">
                                                <p className="text-[8px] font-bold uppercase tracking-tight text-white/50">{clip.title}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => document.getElementById('video-upload')?.click()}
                                        className="aspect-[4/3] bg-white/5 border border-white/5 border-dashed rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all hover:border-white/20 group"
                                    >
                                        <Plus className="w-6 h-6 text-gray-700 group-hover:text-white group-hover:scale-110 transition-all" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHTSIDE: SETTINGS */}
                    <div className="space-y-6">
                        
                        {/* Audio track */}
                        <div className="bg-white/[0.04] border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                <Music className="w-4 h-4 text-neon-cyan" />
                                Audio / Musique
                            </h3>
                            {music ? (
                                <div className="p-5 bg-neon-cyan/5 border border-neon-cyan/20 rounded-2xl flex items-center gap-4">
                                    <div className="w-10 h-10 bg-neon-cyan/20 rounded-xl flex items-center justify-center border border-neon-cyan/30">
                                        <Music className="w-5 h-5 text-neon-cyan" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-tight truncate text-white">{music.file.name}</p>
                                        <p className="text-[8px] text-neon-cyan font-bold uppercase">Prêt pour le mixage</p>
                                    </div>
                                    <button onClick={() => setMusic(null)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-red-400" /></button>
                                </div>
                            ) : (
                                <label className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/5 rounded-[1.5rem] cursor-pointer hover:bg-white/[0.02] transition-all group">
                                    <input type="file" accept="audio/*" className="hidden" onChange={handleMusicImport} />
                                    <Upload className="w-6 h-6 text-gray-600 mb-2 group-hover:text-neon-cyan transition-colors" />
                                    <span className="text-[9px] font-black uppercase text-gray-600 tracking-widest group-hover:text-white transition-colors">Choisir une track</span>
                                </label>
                            )}
                        </div>

                        {/* Aftermovie FX */}
                        <div className="bg-white/[0.04] border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                <Zap className="w-4 h-4 text-neon-yellow" />
                                Dropsiders FX
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { id: 'neon', label: 'Dropsiders Neon', icon: Sparkles, color: 'text-neon-red' },
                                    { id: 'vhs', label: 'Vintage VHS', icon: Film, color: 'text-neon-purple' },
                                    { id: 'glitch', label: 'Glitch Error', icon: RefreshCw, color: 'text-neon-cyan' },
                                    { id: 'none', label: 'Brut / No Filter', icon: Video, color: 'text-gray-400' },
                                ].map(filter => (
                                    <button
                                        key={filter.id}
                                        onClick={() => setActiveFilter(filter.id as any)}
                                        className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all ${activeFilter === filter.id ? 'bg-white/10 border-white/20 shadow-lg' : 'bg-white/5 border-white/5 opacity-50 hover:opacity-100 hover:bg-white/8'}`}
                                    >
                                        <filter.icon className={`w-4 h-4 ${filter.color}`} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{filter.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/5">
                                <label className="flex items-center justify-between cursor-pointer group">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Logo Watermark</span>
                                    <div 
                                        onClick={() => setShowLogo(!showLogo)}
                                        className={`w-12 h-6 rounded-full p-1 transition-all ${showLogo ? 'bg-neon-red' : 'bg-white/10'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full transition-all ${showLogo ? 'ml-6' : 'ml-0'}`} />
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="bg-neon-yellow/5 border border-neon-yellow/15 rounded-2xl p-6">
                            <p className="text-[9px] font-black text-neon-yellow uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                                <Layers className="w-3 h-3" />
                                Pro Tip
                            </p>
                            <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                                Pour un meilleur rendu, utilise des clips de <span className="text-white">même résolution</span>. L'export se fait au format <span className="text-white">WebM HD</span> pour conserver les effets de lumière.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
