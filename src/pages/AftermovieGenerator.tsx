import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, Upload, Music, Trash2, 
    RefreshCw, Film, Play, List, Sparkles, Zap, Plus, X, Download
} from 'lucide-react';
import { isSuperAdmin } from '../utils/auth';

interface Clip {
    id: string;
    blobUrl: string;
    file: File;
    duration: number;
    title: string;
}

export function VideoStudioGenerator() {
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
    const [targetDuration, setTargetDuration] = useState<number>(30);
    const [bpm, setBpm] = useState(128);
    const [isRecapMode, setIsRecapMode] = useState(false);
    const [videoFormat, setVideoFormat] = useState<'youtube' | 'reel'>('youtube');
    const showLogo = true;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dropsidersLogo = useRef<HTMLImageElement | null>(null);

    const DURATIONS = [30, 60, 90, 120, 150, 180, 210];
    const themeColor = isRecapMode ? 'text-neon-cyan' : 'text-neon-red';
    const themeBg = isRecapMode ? 'bg-neon-cyan/20 border-neon-cyan' : 'bg-neon-red/20 border-neon-red';
    const themeBtn = isRecapMode ? 'bg-neon-cyan text-black' : 'bg-neon-red text-white';
    const themeShadow = isRecapMode ? 'shadow-[0_0_25px_rgba(0,255,255,0.3)]' : 'shadow-[0_0_25px_rgba(255,0,51,0.3)]';

    useEffect(() => {
        const img = new window.Image();
        img.src = '/Logo.png';
        img.onload = () => { dropsidersLogo.current = img; };
    }, []);

    const handleVideoImport = async (files: FileList | null) => {
        if (!files) return;
        const newClips: Clip[] = [];
        let rejectedCount = 0;

        for (const file of Array.from(files)) {
            const isVideo = file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mov');
            if (!isVideo) continue;
            
            const url = URL.createObjectURL(file);
            
            try {
                const duration = await new Promise<number>((resolve, reject) => {
                    const video = document.createElement('video');
                    video.preload = 'metadata';
                    video.onloadedmetadata = () => resolve(video.duration);
                    video.onerror = reject;
                    video.src = url;
                });

                if (duration >= 10) {
                    newClips.push({
                        id: Math.random().toString(36).substr(2, 9),
                        blobUrl: url,
                        file: file,
                        duration: duration,
                        title: file.name
                    });
                } else {
                    URL.revokeObjectURL(url);
                    rejectedCount++;
                }
            } catch (e) {
                URL.revokeObjectURL(url);
            }
        }
        
        if (rejectedCount > 0) {
            alert(`${rejectedCount} vidéo(s) ignorée(s) car la durée est inférieure à 10 secondes.`);
        }

        if (newClips.length > 0) {
            setClips(prev => [...prev, ...newClips]);
        }
    };

    const handleMusicImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('audio/')) {
            if (music) URL.revokeObjectURL(music.blobUrl);
            setMusic({ blobUrl: URL.createObjectURL(file), file: file });
        }
    };

    const removeClip = (id: string) => {
        setClips(prev => {
            const clip = prev.find(c => c.id === id);
            if (clip) URL.revokeObjectURL(clip.blobUrl);
            return prev.filter(c => c.id !== id);
        });
    };

    const generateVideo = async () => {
        if (clips.length === 0) return;
        setIsGenerating(true);
        setProgress(0);
        setPreviewUrl(null);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false })!;
        
        // Define dimensions based on format
        const w = videoFormat === 'youtube' ? 1280 : 720;
        const h = videoFormat === 'youtube' ? 720 : 1280;
        canvas.width = w;
        canvas.height = h;

        const stream = canvas.captureStream(30);
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

        const combinedStream = new MediaStream([...stream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
        const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 8000000 });

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

        const clipTime = targetDuration / clips.length;
        const beatInterval = 60 / bpm;
        let totalTimeElapsed = 0;

        for (let i = 0; i < clips.length; i++) {
            const clip = clips[i];
            setProgress(Math.round((i / clips.length) * 100));
            
            await new Promise<void>((resolve) => {
                videoEl.src = clip.blobUrl;
                videoEl.onloadeddata = () => {
                    videoEl.play();
                    let clipStartTime = Date.now();
                    
                    const drawFrame = () => {
                        const now = Date.now();
                        const elapsedInClip = (now - clipStartTime) / 1000;
                        const globalElapsed = totalTimeElapsed + elapsedInClip;

                        // On a enlevé `videoEl.paused ||` car la lecture est asynchrone
                        // et renvoyait `true` au tout début, coupant la génération instantanément.
                        if (videoEl.ended || elapsedInClip >= clipTime) {
                            totalTimeElapsed += elapsedInClip;
                            resolve();
                            return;
                        }

                        ctx.fillStyle = '#000';
                        ctx.fillRect(0, 0, w, h);

                        const vRatio = videoEl.videoWidth / videoEl.videoHeight;
                        const cRatio = w / h;
                        let dw = w, dh = h, dx = 0, dy = 0;
                        if (vRatio > cRatio) { dw = h * vRatio; dx = (w - dw) / 2; }
                        else { dh = w / vRatio; dy = (h - dh) / 2; }
                        
                        const isBeat = (globalElapsed % beatInterval) < 0.05;
                        const shake = isBeat ? (Math.random() - 0.5) * 10 : 0;
                        ctx.drawImage(videoEl, dx + shake, dy + shake, dw, dh);

                        if (activeFilter === 'neon') {
                            ctx.save();
                            ctx.globalCompositeOperation = 'screen';
                            ctx.fillStyle = isRecapMode ? 'rgba(0,255,255,0.08)' : 'rgba(255,0,51,0.08)';
                            ctx.fillRect(0, 0, w, h);
                            ctx.restore();
                        } else if (activeFilter === 'vhs') {
                            ctx.save();
                            ctx.globalAlpha = 0.12;
                            ctx.fillStyle = (Math.floor(globalElapsed * 10) % 2 === 0) ? '#ff00ff' : '#00ffff';
                            ctx.fillRect(0, Math.random() * h, w, 2);
                            ctx.restore();
                        }

                        if (showLogo && dropsidersLogo.current) {
                            const lw = 100;
                            const lh = lw * (dropsidersLogo.current.height / dropsidersLogo.current.width);
                            ctx.globalAlpha = 0.7;
                            ctx.drawImage(dropsidersLogo.current, w - lw - 30, 30, lw, lh);
                            ctx.globalAlpha = 1;
                        }

                        if (elapsedInClip < 0.15 || isBeat) {
                            const alpha = isBeat ? 0.3 : (1 - elapsedInClip * 6);
                            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
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
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12">
                    <div>
                        <button onClick={() => navigate('/admin')} className="mb-4 text-gray-500 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors group">
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Retour Studio
                        </button>
                        <h1 className="text-5xl md:text-6xl font-display font-black uppercase italic tracking-tighter">
                            {isRecapMode ? 'Récap' : 'Aftermovie'} <span className={themeColor}>Studio</span>
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 mt-5">
                            <button onClick={() => setIsRecapMode(false)} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${!isRecapMode ? 'bg-neon-red text-white shadow-lg' : 'bg-white/5 text-gray-500 border border-white/5'}`}>Aftermovie</button>
                            <button onClick={() => setIsRecapMode(true)} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isRecapMode ? 'bg-neon-cyan text-black shadow-lg' : 'bg-white/5 text-gray-500 border border-white/5'}`}>Récap Actu</button>
                            <div className="w-px h-4 bg-white/10 mx-2 hidden md:block" />
                            <button onClick={() => setVideoFormat('youtube')} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${videoFormat === 'youtube' ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500 border border-white/5'}`}>16:9 YT</button>
                            <button onClick={() => setVideoFormat('reel')} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${videoFormat === 'reel' ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500 border border-white/5'}`}>9:16 Reel</button>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        {previewUrl && (
                            <a href={previewUrl} download={`dropsiders_video_${videoFormat}_${targetDuration}s.webm`} className="bg-white/10 border border-white/20 text-white px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-white/20 transition-all flex items-center gap-3">
                                <Download className="w-5 h-5" /> Télécharger
                            </a>
                        )}
                        <button onClick={generateVideo} disabled={clips.length === 0 || isGenerating} className={`${themeBtn} px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] ${themeShadow} hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100 flex items-center gap-3`}>
                            {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Film className="w-5 h-5" />}
                            {isGenerating ? `Génération ${progress}%` : 'Lancer le rendu pro'}
                        </button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-[1fr_450px] gap-10">
                    <div className="space-y-8">
                        <div className={`bg-black/40 border border-white/10 rounded-[2.5rem] overflow-hidden relative shadow-2xl transition-all duration-500 ${videoFormat === 'youtube' ? 'aspect-video w-full' : 'aspect-[9/16] w-full max-w-[360px] mx-auto'}`}>
                            {previewUrl ? <video src={previewUrl} controls className="w-full h-full" /> : 
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-4">
                                <Play className="w-8 h-8 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Prévisualisation Vidéo Studio</p>
                            </div>}
                            {isGenerating && <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-6"><div className="text-4xl font-display font-black italic">{progress}%</div><p className={`text-[10px] font-black uppercase tracking-[0.4em] ${themeColor} animate-pulse`}>Sync au tempo...</p></div>}
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className={`text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3`}><List className={`w-4 h-4 ${themeColor}`} /> Clips Vidéos ({clips.length})</h3>
                                <button onClick={() => document.getElementById('video-upload')?.click()} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"><Plus className="w-4 h-4 text-gray-500" /></button>
                                <input id="video-upload" type="file" multiple accept="video/*,.mov" className="hidden" onChange={(e) => handleVideoImport(e.target.files)} />
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {clips.map((clip, index) => (
                                    <div key={clip.id} className="relative group rounded-2xl overflow-hidden aspect-[4/3] bg-black border border-white/10 shadow-lg">
                                        <video src={clip.blobUrl} className="w-full h-full object-cover opacity-60" />
                                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded-md text-[8px] font-black italic tracking-tighter">#{index+1}</div>
                                        <button onClick={() => removeClip(clip.id)} className="absolute top-2 right-2 p-1.5 bg-red-500/20 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all text-white"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white/[0.04] border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl transition-all">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-7 flex items-center gap-3"><Music className={`w-4 h-4 ${isRecapMode ? 'text-neon-cyan' : 'text-neon-red'}`} /> Durée & Rythme</h3>
                            <div className="grid grid-cols-4 gap-2 mb-8">
                                {DURATIONS.map(d => (
                                    <button key={d} onClick={() => setTargetDuration(d)} className={`py-3.5 rounded-xl border text-[10px] font-black transition-all ${targetDuration === d ? `${themeBg} ${themeColor}` : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}>{d}s</button>
                                ))}
                            </div>
                            {music ? <div className={`p-4 ${isRecapMode ? 'bg-neon-cyan/5 border-neon-cyan/20' : 'bg-neon-red/5 border-neon-red/20'} border rounded-2xl flex items-center gap-4 transition-colors`}><Music className={`w-4 h-4 ${themeColor}`} /><p className="text-[9px] font-black uppercase tracking-tight truncate flex-1">{music.file.name}</p><button onClick={() => setMusic(null)} className="text-red-400 hover:scale-110 transition-transform"><X className="w-4 h-4" /></button></div> : 
                                <label className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/5 rounded-[2rem] cursor-pointer hover:bg-white/[0.02] hover:border-white/10 transition-all group"><input type="file" accept="audio/*" className="hidden" onChange={handleMusicImport} /><Upload className="w-7 h-7 text-gray-600 mb-3 group-hover:text-gray-400 group-hover:-translate-y-1 transition-all" /><span className="text-[9px] font-black uppercase tracking-widest text-gray-600 group-hover:text-gray-400">Importer Audio</span></label>}
                            <div className="mt-8 flex items-center justify-between p-5 bg-black/40 border border-white/5 rounded-2xl shadow-inner">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Tempo de sync (BPM)</span>
                                <input type="number" value={bpm} onChange={e => setBpm(parseInt(e.target.value) || 128)} className={`w-16 bg-transparent text-right font-black italic ${themeColor} focus:outline-none text-lg`} />
                            </div>
                        </div>

                        <div className="bg-white/[0.04] border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-7 flex items-center gap-3"><Zap className="w-4 h-4 text-neon-yellow" /> Styles & FX Spéciaux</h3>
                            <div className="space-y-4">
                                {[
                                    { id: 'neon', label: 'Dropsiders Color', icon: Sparkles, color: themeColor }, 
                                    { id: 'vhs', label: 'Vintage VHS', icon: Film, color: 'text-neon-purple' }, 
                                    { id: 'glitch', label: 'Glitch Sync', icon: RefreshCw, color: 'text-neon-cyan' }
                                ].map(f => (
                                    <button key={f.id} onClick={() => setActiveFilter(f.id as any)} className={`w-full p-5 rounded-2xl border flex items-center gap-4 transition-all ${activeFilter === f.id ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 opacity-40 hover:opacity-100'}`}><f.icon className={`w-5 h-5 ${f.color}`} /><span className="text-[10px] font-black uppercase tracking-[0.2em]">{f.label}</span></button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
