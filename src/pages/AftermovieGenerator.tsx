import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, ChevronRight, Upload, Music, Trash2, 
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
    const [activeFilter, setActiveFilter] = useState<'none' | 'neon' | 'vhs' | 'glitch' | 'pro_mix'>('pro_mix');
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
                console.error("Erreur d'import vidéo pour", file.name, e);
                URL.revokeObjectURL(url);
                rejectedCount++;
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

    const moveClip = (index: number, direction: 'up' | 'down') => {
        setClips(prev => {
            if (direction === 'up' && index > 0) {
                const newClips = [...prev];
                [newClips[index - 1], newClips[index]] = [newClips[index], newClips[index - 1]];
                return newClips;
            }
            if (direction === 'down' && index < prev.length - 1) {
                const newClips = [...prev];
                [newClips[index], newClips[index + 1]] = [newClips[index + 1], newClips[index]];
                return newClips;
            }
            return prev;
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

        // Dessiner un fond noir initial pour forcer le canvas à s'activer en mémoire avant la capture
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        const stream = canvas.captureStream(30);
        let mixedStream: MediaStream;
        let audioContext: AudioContext | null = null;
        
        if (music) {
            audioContext = new AudioContext();
            const dest = audioContext.createMediaStreamDestination();
            const musicEl = new Audio(music.blobUrl);
            musicEl.crossOrigin = "anonymous";
            const musicSource = audioContext.createMediaElementSource(musicEl);
            musicSource.connect(dest);
            musicSource.connect(audioContext.destination);
            musicEl.play();
            mixedStream = new MediaStream([...stream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
        } else {
            mixedStream = new MediaStream([...stream.getVideoTracks()]);
        }

        let options: MediaRecorderOptions = { videoBitsPerSecond: 8000000 };
        let blobMimeType = 'video/webm';
        
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
            options.mimeType = 'video/webm;codecs=vp9';
            blobMimeType = 'video/webm';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            options.mimeType = 'video/webm;codecs=vp8';
            blobMimeType = 'video/webm';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
            options.mimeType = 'video/webm';
            blobMimeType = 'video/webm';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            options.mimeType = 'video/mp4';
            blobMimeType = 'video/mp4';
        }
        
        let recorder: MediaRecorder;
        try {
            recorder = new MediaRecorder(mixedStream, options);
        } catch (e) {
            recorder = new MediaRecorder(mixedStream);
        }

        const chunks: Blob[] = [];
        recorder.ondataavailable = e => {
            if (e.data && e.data.size > 0) {
                chunks.push(e.data);
            }
        };
        recorder.onstop = () => {
            if (chunks.length === 0) {
                console.error("Aucune donnée enregistrée !");
                alert("Erreur: Le rendu a été bloqué par votre navigateur. Gardez cette page ouverte et visible pendant la génération.");
            }
            const blob = new Blob(chunks, { type: blobMimeType });
            setPreviewUrl(URL.createObjectURL(blob));
            setIsGenerating(false);
            if (audioContext && audioContext.state !== 'closed') audioContext.close();
        };

        recorder.start(100);

        const videoEl = document.createElement('video');
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.crossOrigin = "anonymous";
        videoEl.style.position = 'fixed';
        videoEl.style.opacity = '0.01';
        videoEl.style.width = '200px';
        videoEl.style.height = '200px';
        videoEl.style.bottom = '0';
        videoEl.style.right = '0';
        videoEl.style.pointerEvents = 'none';
        videoEl.style.zIndex = '50';
        document.body.appendChild(videoEl);


        const clipTime = targetDuration / clips.length;
        const beatInterval = 60 / bpm;
        let totalTimeElapsed = 0;

        for (let i = 0; i < clips.length; i++) {
            const clip = clips[i];
            setProgress(Math.round((i / clips.length) * 100));
            
            await new Promise<void>((resolve) => {
                videoEl.src = clip.blobUrl;
                videoEl.onloadeddata = () => {
                        videoEl.play().catch(e => console.warn('Video play prevented:', e));
                        let clipStartTime = Date.now();
                        
                        const drawFrame = () => {
                            const now = Date.now();
                            const elapsedInClip = (now - clipStartTime) / 1000;
                            const globalElapsed = totalTimeElapsed + elapsedInClip;

                            // On se fie uniquement au chronomètre pour forcer le respect de la durée, 
                            // ignorant si la vidéo plante ou dit avoir "terminé"
                            if (elapsedInClip >= clipTime) {
                                totalTimeElapsed += elapsedInClip;
                                resolve();
                                return;
                            }

                            const timeSinceBeat = globalElapsed % beatInterval;
                            const beatPower = Math.max(0, 1 - (timeSinceBeat / 0.3)); // Décroissance douce du beat (300ms)

                            ctx.fillStyle = '#050505';
                            ctx.fillRect(0, 0, w, h);

                            const vRatio = videoEl.videoWidth / videoEl.videoHeight || (16/9);
                            const cRatio = w / h;
                            let baseDw = w, baseDh = h;
                            if (vRatio > cRatio) { baseDw = h * vRatio; }
                            else { baseDh = w / vRatio; }

                            // Pumping effect rythmique
                            const scale = 1 + (beatPower * 0.03); 
                            const dw = baseDw * scale;
                            const dh = baseDh * scale;
                            const dx = (w - dw) / 2;
                            const dy = (h - dh) / 2;
                            
                            ctx.save();
                            
                            const isProMix = activeFilter === 'pro_mix';
                            const doGlitch = (activeFilter === 'glitch' && beatPower > 0.6) || (isProMix && beatPower > 0.85 && (Math.floor(globalElapsed / beatInterval) % 4 === 0));
                            const doVhsBase = activeFilter === 'vhs' || (isProMix && elapsedInClip > clipTime - 0.6);
                            const doNeonStyle = activeFilter === 'neon' || isProMix;
                            const doVhsNoise = activeFilter === 'vhs' || (isProMix && elapsedInClip > clipTime - 0.6);

                            try {
                                if (doGlitch) {
                                    // Base video
                                    ctx.drawImage(videoEl, dx, dy, dw, dh);
                                    
                                    // Glitch RGB Split
                                    ctx.globalCompositeOperation = 'screen';
                                    ctx.globalAlpha = 0.4;
                                    ctx.drawImage(videoEl, dx - 15, dy, dw, dh); // Cyan shift
                                    ctx.drawImage(videoEl, dx + 15, dy, dw, dh); // Red shift
                                    
                                    ctx.globalAlpha = 1;
                                    ctx.globalCompositeOperation = 'source-over';
                                    
                                    // Slicing offset horizontal
                                    const sliceY = Math.random() * h;
                                    const sliceH = 40 + Math.random() * 80;
                                    const offset = (Math.random() - 0.5) * 60;
                                    ctx.save();
                                    ctx.beginPath();
                                    ctx.rect(0, sliceY, w, sliceH);
                                    ctx.clip();
                                    ctx.drawImage(videoEl, dx + offset, dy, dw, dh);
                                    ctx.restore();

                                } else if (doVhsBase) {
                                    // VHS Base + Bleeding
                                    ctx.drawImage(videoEl, dx, dy, dw, dh);
                                    ctx.globalCompositeOperation = 'screen';
                                    ctx.globalAlpha = 0.25;
                                    ctx.drawImage(videoEl, dx - 6, dy, dw, dh);
                                    ctx.drawImage(videoEl, dx + 6, dy, dw, dh);
                                    ctx.globalAlpha = 1;
                                    ctx.globalCompositeOperation = 'source-over';
                                } else {
                                    // Default / Neon
                                    ctx.drawImage(videoEl, dx, dy, dw, dh);
                                }
                            } catch (e) {
                                ctx.fillStyle = '#111';
                                ctx.fillRect(dx, dy, dw, dh);
                            }

                            // Filtres colorimétriques & superpositions
                            ctx.globalCompositeOperation = 'source-over';

                            if (doNeonStyle) {
                                const grad = ctx.createLinearGradient(0, 0, w, h);
                                if (isRecapMode) {
                                    grad.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
                                    grad.addColorStop(1, 'rgba(0, 100, 255, 0.0)');
                                } else {
                                    grad.addColorStop(0, 'rgba(255, 0, 51, 0.25)');
                                    grad.addColorStop(1, 'rgba(100, 0, 20, 0.0)');
                                }
                                ctx.globalCompositeOperation = 'overlay';
                                ctx.fillStyle = grad;
                                ctx.fillRect(0, 0, w, h);

                                // Vignette sombre
                                const vignette = ctx.createRadialGradient(w/2, h/2, h*0.4, w/2, h/2, h*0.85);
                                vignette.addColorStop(0, 'rgba(0,0,0,0)');
                                vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
                                ctx.globalCompositeOperation = 'multiply';
                                ctx.fillStyle = vignette;
                                ctx.fillRect(0, 0, w, h);
                            } 
                            
                            if (doVhsNoise) {
                                ctx.globalCompositeOperation = 'source-over';
                                ctx.fillStyle = 'rgba(0,0,0,0.12)';
                                for(let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
                                
                                const trackY = (globalElapsed * 200) % h;
                                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                                ctx.fillRect(0, trackY, w, 30);
                            }

                            ctx.globalCompositeOperation = 'source-over';

                            // Transitions harmonieuses (Fondu doux + flash rythmique léger)
                            if (elapsedInClip < 0.4) {
                                const fade = 1 - (elapsedInClip / 0.4);
                                ctx.fillStyle = `rgba(5, 5, 5, ${fade})`;
                                ctx.fillRect(0, 0, w, h);
                            }
                            
                            if (beatPower > 0.8 && activeFilter !== 'vhs') {
                                const flash = (beatPower - 0.8) * 0.3; 
                                ctx.globalCompositeOperation = 'screen';
                                ctx.fillStyle = `rgba(255, 255, 255, ${flash})`;
                                ctx.fillRect(0, 0, w, h);
                                ctx.globalCompositeOperation = 'source-over';
                            }

                            if (showLogo && dropsidersLogo.current) {
                                const lw = videoFormat === 'youtube' ? 120 : 90;
                                const lh = lw * (dropsidersLogo.current.height / dropsidersLogo.current.width);
                                ctx.globalAlpha = 0.85;
                                ctx.drawImage(dropsidersLogo.current, w - lw - 30, 30, lw, lh);
                            }

                            ctx.restore();

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
        document.body.removeChild(videoEl);
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
                                        <video src={clip.blobUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded-md text-[8px] font-black italic tracking-tighter shadow-md z-10 text-white">#{index+1}</div>
                                        
                                        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                            {index > 0 && <button onClick={() => moveClip(index, 'up')} className="p-2 bg-black/40 hover:bg-white/20 backdrop-blur-md rounded-full text-white pointer-events-auto border border-white/10 hover:border-white/30 transition-all"><ChevronLeft className="w-4 h-4" /></button>}
                                            {index < clips.length - 1 && <button onClick={() => moveClip(index, 'down')} className="p-2 bg-black/40 hover:bg-white/20 backdrop-blur-md rounded-full text-white pointer-events-auto border border-white/10 hover:border-white/30 transition-all"><ChevronRight className="w-4 h-4" /></button>}
                                        </div>

                                        <button onClick={() => removeClip(clip.id)} className="absolute top-2 right-2 p-1.5 bg-red-500/20 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20 text-white"><Trash2 className="w-3 h-3" /></button>
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
                                    { id: 'pro_mix', label: 'Mix Club (Pro)', icon: Zap, color: 'text-neon-yellow' },
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
            <canvas ref={canvasRef} className="fixed bottom-0 right-0 pointer-events-none z-50 w-[200px] h-[200px]" style={{ opacity: 0.01 }} />
        </div>
    );
}
