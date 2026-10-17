import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Download, 
    Upload, 
    Type,
    Video,
    Image as ImageIcon,
    Phone,
    PhoneOff,
    MessageCircle,
    Bell,
    Clock,
    Sparkles,
    Lock,
    Check,
    Eye,
    ChevronLeft,
    Loader2,
    Mic,
    MicOff,
    Volume2,
    Grid,
    UserPlus,
    Activity,
    Vibrate,
    User
} from 'lucide-react';
import { toPng, toCanvas, toBlob } from 'html-to-image';
import { ExportSuccessModal } from '../components/ExportSuccessModal';

interface IncomingCallGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
}

export const IncomingCallGenerator = ({ isOpen, onClose }: IncomingCallGeneratorProps) => {
    const [callerName, setCallerName] = useState('EDC LAS VEGAS');
    const [callStatus, setCallStatus] = useState('Appel entrant...');
    const [bgType, setBgType] = useState<'transparent' | 'image' | 'video'>('transparent');
    const [bgUrl, setBgUrl] = useState<string | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingProgress, setRecordingProgress] = useState(0);
    const [videoDuration, setVideoDuration] = useState(10);
    const [mobileTab, setMobileTab] = useState<'config' | 'preview'>('config');
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [readyBlob, setReadyBlob] = useState<Blob | null>(null);
    const [readyUrl, setReadyUrl] = useState<string>('');
    const [readyFilename, setReadyFilename] = useState('');

    // Nouvelles fonctionnalités ultra-réalistes Apple iPhone :
    const [showDynamicIsland, setShowDynamicIsland] = useState(true);
    const [dynamicIslandExpanded, setDynamicIslandExpanded] = useState(true);
    const [showHapticRipples, setShowHapticRipples] = useState(true);
    const [isPhoneVibrating, setIsPhoneVibrating] = useState(true);
    const [callState, setCallState] = useState<'incoming' | 'connected'>('incoming');
    const [contactAvatar, setContactAvatar] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [callSeconds, setCallSeconds] = useState(4);

    useEffect(() => {
        if (callState !== 'connected') return;
        const interval = setInterval(() => {
            setCallSeconds(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [callState]);

    const formatCallTime = (totalSecs: number) => {
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    useEffect(() => {
        return () => {
            if (readyUrl) URL.revokeObjectURL(readyUrl);
        };
    }, [readyUrl]);

    const previewRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setBgUrl(url);
        if (file.type.startsWith('video/')) {
            setBgType('video');
        } else {
            setBgType('image');
        }
    };


    const handleDownload = async () => {
        if (!previewRef.current) return;
        
        // Force preview tab on mobile to ensure element is visible for capture
        setMobileTab('preview');
        setIsExporting(true);

        try {
            // Small delay to ensure tab switch and rendering
            await new Promise(r => setTimeout(r, 800));
            
            const blob = await toBlob(previewRef.current, {
                pixelRatio: window.innerWidth < 768 ? 1.5 : 2,
                backgroundColor: bgType === 'transparent' ? undefined : '#000000',
            });
            
            if (blob) {
                const url = URL.createObjectURL(blob);
                setReadyBlob(blob);
                setReadyUrl(url);
                setReadyFilename(`appel-${callerName.toLowerCase().replace(/\s+/g, '-')}.png`);
                setShowSuccess(true);
            }
        } catch (err) {
            console.error("Export failed:", err);
            setError("Erreur lors de l'exportation. Veuillez réessayer.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportVideo = async () => {
        const previewEl = previewRef.current;
        if (!previewEl) return;
        
        // Force preview tab on mobile to ensure element is visible for capture
        setMobileTab('preview');
        setIsRecording(true);
        setRecordingProgress(0);

        try {
            // Small delay to ensure tab switch and rendering
            await new Promise(r => setTimeout(r, 800));

            // 1. Capture the UI as a transparent canvas
            const uiCanvas = await toCanvas(previewEl, {
                pixelRatio: 1, 
                backgroundColor: 'transparent',
                filter: (node: any) => {
                    const isVideo = node instanceof HTMLVideoElement;
                    const isBgImg = node instanceof HTMLImageElement && 
                                   typeof node.className === 'string' && 
                                   node.className.includes('absolute inset-0');
                    return !isVideo && !isBgImg;
                }
            });

            const width = 720;
            const height = 1280;
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { alpha: false });
            if (!ctx) throw new Error("Could not get canvas context");

            // Setup MediaRecorder
            const stream = canvas.captureStream(30);
            const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
            const chunks: Blob[] = [];
            const recorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: 2500000
            });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            const exportPromise = new Promise<Blob>((resolve) => {
                recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
            });

            recorder.start();

            const bgVideo = previewEl.querySelector('video') as HTMLVideoElement;
            const startTime = Date.now();
            const durationMs = videoDuration * 1000;
            
            if (bgVideo && bgType === 'video') {
                bgVideo.currentTime = 0;
                try { await bgVideo.play(); } catch (e) { console.warn(e); }
            }

            return new Promise<void>((resolve, reject) => {
                const renderFrame = () => {
                    const now = Date.now();
                    const elapsed = now - startTime;
                    
                    if (elapsed >= durationMs || !isRecording) {
                        recorder.stop();
                        return;
                    }

                    ctx.fillStyle = '#050505';
                    ctx.fillRect(0, 0, width, height);

                    if (bgVideo && bgType === 'video') {
                        ctx.drawImage(bgVideo, 0, 0, width, height);
                    } else if (bgType === 'image' && bgUrl) {
                        const bgImg = previewEl.querySelector('img.absolute.inset-0') as HTMLImageElement;
                        if (bgImg) ctx.drawImage(bgImg, 0, 0, width, height);
                    }

                    ctx.drawImage(uiCanvas, 0, 0, width, height);
                    setRecordingProgress(Math.min(99, Math.round((elapsed / durationMs) * 100)));
                    requestAnimationFrame(renderFrame);
                };

                exportPromise.then(async (blob) => {
                    const fileName = `appel-${callerName.toLowerCase().replace(/\s+/g, '-')}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`;
                    const url = URL.createObjectURL(blob);
                    setReadyBlob(blob);
                    setReadyUrl(url);
                    setReadyFilename(fileName);
                    setShowSuccess(true);
                    resolve();
                }).catch(reject);

                requestAnimationFrame(renderFrame);
            });

        } catch (err) {
            console.error("Video export failed:", err);
            setError("Erreur lors de l'export vidéo. Essaye sur PC si le problème persiste.");
        } finally {
            setIsRecording(false);
            setRecordingProgress(0);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 isolate-dark">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-6xl h-[90vh] bg-[#0A0A0A] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
                >
                    <div className="md:hidden flex border-b border-white/5">
                        <button 
                            onClick={onClose}
                            className="p-4 bg-neon-cyan/20 border-r border-white/5 text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setMobileTab('config')}
                            className={`flex-1 p-4 text-[10px] font-black uppercase tracking-widest transition-all ${mobileTab === 'config' ? 'bg-neon-cyan text-black' : 'text-gray-500'}`}
                        >
                            Config
                        </button>
                        <button 
                            onClick={() => setMobileTab('preview')}
                            className={`flex-1 p-4 text-[10px] font-black uppercase tracking-widest transition-all ${mobileTab === 'preview' ? 'bg-neon-cyan text-black' : 'text-gray-500'}`}
                        >
                            Aperçu
                        </button>
                        <button onClick={onClose} className="p-4 border-l border-white/5"><X className="w-5 h-5 text-white" /></button>
                    </div>

                    <div className={`${mobileTab === 'config' ? 'block' : 'hidden md:block'} w-full md:w-[400px] p-8 overflow-y-auto border-r border-white/5 space-y-8 custom-scrollbar bg-black/40`}>
                        <div className="hidden md:flex flex-col gap-4 mb-8">
                            <button 
                                onClick={onClose}
                                className="w-fit p-3 bg-neon-cyan/10 hover:bg-neon-cyan text-neon-cyan hover:text-black rounded-2xl border border-neon-cyan/20 transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-widest group"
                            >
                                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                RETOUR
                            </button>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-neon-cyan/10 rounded-xl">
                                        <Phone className="w-5 h-5 text-neon-cyan" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white uppercase italic tracking-wider">CALL GEN</h2>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors flex items-center gap-2">
                                    <span className="text-[8px] font-black text-gray-600 uppercase">Fermer</span>
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Étape d'appel : Entrant vs En communication */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Phone className="w-3 h-3 text-[#4CD964]" /> Étape de l'Appel
                            </label>
                            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                                <button 
                                    onClick={() => setCallState('incoming')}
                                    className={`flex-1 py-3 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${callState === 'incoming' ? 'bg-[#4CD964] text-black font-black shadow-[0_0_15px_rgba(76,217,100,0.35)]' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Appel Entrant
                                </button>
                                <button 
                                    onClick={() => setCallState('connected')}
                                    className={`flex-1 py-3 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${callState === 'connected' ? 'bg-[#4CD964] text-black font-black shadow-[0_0_15px_rgba(76,217,100,0.35)]' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Décroché (00:04)
                                </button>
                            </div>
                        </div>

                        {/* Effets Apple iOS Réalistes */}
                        <div className="space-y-3 bg-white/5 border border-white/10 p-4 rounded-2xl">
                            <label className="text-[10px] font-black text-neon-cyan uppercase tracking-widest flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-neon-cyan" /> Effets Apple iOS Réalistes
                            </label>

                            {/* Toggle Dynamic Island */}
                            <div className="flex items-center justify-between py-1">
                                <span className="text-[11px] text-gray-300 font-medium flex items-center gap-2">
                                    <Activity className="w-3.5 h-3.5 text-neon-cyan" /> Dynamic Island (Waveform)
                                </span>
                                <button 
                                    onClick={() => setShowDynamicIsland(!showDynamicIsland)}
                                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${showDynamicIsland ? 'bg-[#34C759]' : 'bg-white/10'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${showDynamicIsland ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* Toggle Ondes Haptiques Radar */}
                            <div className="flex items-center justify-between py-1">
                                <span className="text-[11px] text-gray-300 font-medium flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-[#34C759]" /> Ondes Radar Haptiques
                                </span>
                                <button 
                                    onClick={() => setShowHapticRipples(!showHapticRipples)}
                                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${showHapticRipples ? 'bg-[#34C759]' : 'bg-white/10'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${showHapticRipples ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* Toggle Vibreur Téléphone */}
                            <div className="flex items-center justify-between py-1">
                                <span className="text-[11px] text-gray-300 font-medium flex items-center gap-2">
                                    <Vibrate className="w-3.5 h-3.5 text-neon-purple" /> Micro-Vibration Physique
                                </span>
                                <button 
                                    onClick={() => setIsPhoneVibrating(!isPhoneVibrating)}
                                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${isPhoneVibrating ? 'bg-[#34C759]' : 'bg-white/10'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isPhoneVibrating ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Type className="w-3 h-3 text-neon-cyan" /> Infos Appelant
                            </label>
                            <input 
                                type="text"
                                value={callerName}
                                onChange={(e) => setCallerName(e.target.value)}
                                placeholder="Nom de l'appelant"
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-neon-cyan/50 transition-all font-medium"
                            />
                            <input 
                                type="text"
                                value={callStatus}
                                onChange={(e) => setCallStatus(e.target.value)}
                                placeholder="Statut (ex: Appel entrant...)"
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-neon-cyan/50 transition-all text-sm"
                            />
                        </div>

                        {/* Photo de profil de l'appelant (optionnel) */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3 h-3 text-neon-cyan" /> Photo Appelant (Optionnel)
                            </label>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-bold text-gray-300 hover:text-white hover:bg-white/10 flex items-center justify-center gap-2 transition-all"
                                >
                                    <Upload className="w-4 h-4 text-neon-cyan" />
                                    {contactAvatar ? "Changer la photo" : "Ajouter une photo / logo"}
                                </button>
                                {contactAvatar && (
                                    <button 
                                        onClick={() => setContactAvatar(null)}
                                        className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-2xl transition-all"
                                        title="Supprimer la photo"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <input 
                                type="file"
                                ref={avatarInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) setContactAvatar(URL.createObjectURL(f));
                                }}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Lock className="w-3 h-3 text-neon-cyan" /> État du téléphone
                            </label>
                            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                                <button 
                                    onClick={() => setIsLocked(false)}
                                    className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${!isLocked ? 'bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,255,243,0.3)]' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Déverrouillé
                                </button>
                                <button 
                                    onClick={() => setIsLocked(true)}
                                    className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${isLocked ? 'bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,255,243,0.3)]' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Verrouillé
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <ImageIcon className="w-3 h-3 text-neon-purple" /> Arrière-plan
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button 
                                    onClick={() => setBgType('transparent')}
                                    className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${bgType === 'transparent' ? 'bg-neon-purple/20 border-neon-purple text-white shadow-[0_0_15px_rgba(189,0,255,0.2)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                >
                                    <div className="w-6 h-6 border-2 border-dashed border-current rounded-md flex items-center justify-center">
                                        <X className="w-3 h-3" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Transparent</span>
                                </button>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${bgType === 'image' || bgType === 'video' ? 'bg-neon-cyan/20 border-neon-cyan text-white shadow-[0_0_15px_rgba(0,255,243,0.2)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                >
                                    <Upload className="w-6 h-6" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{bgType === 'video' ? 'Vidéo' : 'Image'}</span>
                                </button>
                                <button 
                                    onClick={() => { setBgType('image'); setBgUrl('https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1000'); }}
                                    className="p-3 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 flex flex-col items-center gap-2"
                                >
                                    <Sparkles className="w-6 h-6" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Demo</span>
                                </button>
                            </div>
                            <input 
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,video/*"
                                onChange={handleFileUpload}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3 h-3 text-neon-purple" /> Durée Vidéo (s)
                            </label>
                            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                                {[5, 10, 15].map((d) => (
                                    <button 
                                        key={d}
                                        onClick={() => setVideoDuration(d)}
                                        className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-bold transition-all ${videoDuration === d ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(189,0,255,0.3)]' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        {d}s
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 space-y-3">
                            <button
                                onClick={handleDownload}
                                disabled={isExporting || isRecording}
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isExporting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <ImageIcon className="w-5 h-5" />
                                )}
                                {isExporting ? 'Génération PNG...' : 'GÉNÉRER PNG STORY'}
                            </button>

                            <button
                                onClick={handleExportVideo}
                                disabled={isExporting || isRecording}
                                className="w-full p-4 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-2xl text-black font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isRecording ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Video className="w-5 h-5" />
                                )}
                                {isRecording ? `Vidéo ${recordingProgress}%` : `Exporter MP4 (${videoDuration}s)`}
                            </button>
                            
                            <p className="text-[9px] text-gray-500 text-center mt-3 font-bold uppercase tracking-wider">
                                MP4 pour tes stories • PNG pour overlay transparent
                            </p>
                        </div>
                    </div>

                    <div className={`${mobileTab === 'preview' ? 'flex' : 'hidden md:flex'} flex-1 p-4 md:p-12 bg-[#050505] flex-col items-center justify-center relative overflow-hidden group`}>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,255,243,0.05)_0%,transparent_70%)] pointer-events-none" />
                        
                        <div className="relative scale-[0.65] sm:scale-[0.85] lg:scale-100 transition-transform duration-500">
                            <motion.div 
                                animate={isPhoneVibrating ? {
                                    x: [0, -1.2, 1.2, -1, 1, 0, 0, 0, -1.2, 1.2, -1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                                    y: [0, 0.6, -0.6, 0.4, -0.4, 0, 0, 0, 0.6, -0.6, 0.4, -0.4, 0, 0, 0, 0, 0, 0, 0, 0],
                                } : { x: 0, y: 0 }}
                                transition={{
                                    duration: 2.2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="w-[400px] aspect-[9/19.5] bg-black rounded-[3.5rem] border-[8px] border-[#1c1c1e] shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(255,255,255,0.04)] overflow-hidden relative flex flex-col select-none"
                                style={{ backgroundColor: '#000000', color: '#ffffff' }}
                            >
                                <div 
                                    ref={previewRef}
                                    style={{ backgroundColor: bgType === 'transparent' ? 'transparent' : '#050505', color: '#ffffff' }}
                                    className={`w-full h-full relative flex flex-col items-center pt-24 px-6 overflow-hidden ${bgType === 'transparent' ? 'bg-transparent' : 'bg-[#050505]'}`}
                                >

                                    {/* Dynamic Island */}
                                    {showDynamicIsland ? (
                                        <motion.div 
                                            onClick={() => setDynamicIslandExpanded(!dynamicIslandExpanded)}
                                            animate={{
                                                width: dynamicIslandExpanded ? 340 : 130,
                                                height: dynamicIslandExpanded ? 58 : 34,
                                                borderRadius: dynamicIslandExpanded ? 26 : 18
                                            }}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            className="absolute top-4 left-1/2 -translate-x-1/2 bg-black border border-white/10 z-50 flex items-center justify-between px-3.5 shadow-2xl cursor-pointer select-none overflow-hidden"
                                            style={{ backgroundColor: '#000000', color: '#ffffff' }}
                                        >
                                            {!dynamicIslandExpanded ? (
                                                <>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
                                                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#34C759] fill-current">
                                                            <path d="M6.62 10.79c1.44 2.82 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 h-3">
                                                        {[0.5, 0.9, 0.4, 0.8, 0.3].map((val, i) => (
                                                            <motion.span 
                                                                key={i}
                                                                className="w-[2.5px] bg-[#34C759] rounded-full"
                                                                animate={{ height: ['4px', `${val * 14}px`, '4px'] }}
                                                                transition={{
                                                                    duration: 0.6 + i * 0.15,
                                                                    repeat: Infinity,
                                                                    ease: "easeInOut"
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-3">
                                                        {contactAvatar ? (
                                                            <img src={contactAvatar} className="w-9 h-9 rounded-full object-cover border border-white/20" alt="" />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-neon-purple to-neon-cyan flex items-center justify-center text-xs font-bold text-white">
                                                                {callerName.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className="text-left">
                                                            <p className="text-xs font-semibold text-white leading-tight">{callerName}</p>
                                                            <p className="text-[10px] text-[#34C759] font-medium leading-tight">
                                                                {callState === 'connected' ? formatCallTime(callSeconds) : 'Appel entrant...'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1 h-4">
                                                            {[0.6, 1.0, 0.5, 0.9, 0.7].map((val, i) => (
                                                                <motion.span 
                                                                    key={i}
                                                                    className="w-[3px] bg-[#34C759] rounded-full"
                                                                    animate={{ height: ['4px', `${val * 18}px`, '4px'] }}
                                                                    transition={{
                                                                        duration: 0.5 + i * 0.12,
                                                                        repeat: Infinity,
                                                                        ease: "easeInOut"
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCallState('incoming');
                                                            }}
                                                            className="w-7 h-7 rounded-full bg-[#FF3B30] flex items-center justify-center text-white"
                                                        >
                                                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current rotate-[135deg]">
                                                                <path d="M6.62 10.79c1.44 2.82 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-32 h-8 bg-black rounded-[1.5rem] z-50 border border-white/5" style={{ backgroundColor: '#000000' }} />
                                    )}

                                    {bgType === 'image' && bgUrl && (
                                        <img src={bgUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
                                    )}
                                    {bgType === 'video' && bgUrl && (
                                        <video src={bgUrl} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline />
                                    )}
                                    
                                    {/* Overlay for better readability if background is present */}
                                    {bgType !== 'transparent' && (
                                        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
                                    )}

                                    {/* Call UI Content */}
                                    <div className="relative z-10 w-full flex flex-col items-center text-center mt-12 px-8">
                                        {/* Optional Contact Avatar */}
                                        {contactAvatar && (
                                            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-white/20 shadow-2xl ring-4 ring-black/40">
                                                <img src={contactAvatar} className="w-full h-full object-cover" alt="" />
                                            </div>
                                        )}

                                        <h1 className="text-[34px] font-semibold text-white mb-1 drop-shadow-2xl tracking-normal whitespace-nowrap overflow-hidden text-ellipsis w-full" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif' }}>
                                            {callerName}
                                        </h1>
                                        <p className={`text-[17px] font-normal drop-shadow-md tracking-normal ${callState === 'connected' ? 'text-[#34C759] font-medium' : 'text-white/70'}`}>
                                            {callState === 'connected' ? formatCallTime(callSeconds) : callStatus}
                                        </p>
                                    </div>

                                    {/* Bottom Buttons Container */}
                                    {callState === 'connected' ? (
                                        <div className="mt-auto mb-16 relative z-10 w-full max-w-[320px]">
                                            {/* 6-Button In-Call Grid (iOS Style) */}
                                            <div className="grid grid-cols-3 gap-y-6 gap-x-5 px-3 mb-10">
                                                {/* Micro / Silence */}
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <button 
                                                        onClick={() => setIsMuted(!isMuted)}
                                                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-white text-black' : 'bg-white/15 text-white backdrop-blur-xl border border-white/10 hover:bg-white/20 active:scale-95'}`}
                                                    >
                                                        {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                                                    </button>
                                                    <span className="text-[11px] text-white/90 font-medium">silence</span>
                                                </div>

                                                {/* Clavier */}
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <button className="w-16 h-16 rounded-full bg-white/15 text-white backdrop-blur-xl border border-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all">
                                                        <Grid className="w-7 h-7" />
                                                    </button>
                                                    <span className="text-[11px] text-white/90 font-medium">clavier</span>
                                                </div>

                                                {/* Haut-parleur */}
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <button 
                                                        onClick={() => setIsSpeaker(!isSpeaker)}
                                                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isSpeaker ? 'bg-white text-black' : 'bg-white/15 text-white backdrop-blur-xl border border-white/10 hover:bg-white/20 active:scale-95'}`}
                                                    >
                                                        <Volume2 className="w-7 h-7" />
                                                    </button>
                                                    <span className="text-[11px] text-white/90 font-medium">haut-parleur</span>
                                                </div>

                                                {/* Nouvel appel */}
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <button className="w-16 h-16 rounded-full bg-white/15 text-white backdrop-blur-xl border border-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all">
                                                        <UserPlus className="w-7 h-7" />
                                                    </button>
                                                    <span className="text-[11px] text-white/90 font-medium">nouvel appel</span>
                                                </div>

                                                {/* FaceTime */}
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <button className="w-16 h-16 rounded-full bg-white/15 text-white backdrop-blur-xl border border-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all">
                                                        <Video className="w-7 h-7" />
                                                    </button>
                                                    <span className="text-[11px] text-white/90 font-medium">FaceTime</span>
                                                </div>

                                                {/* Contacts */}
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <button className="w-16 h-16 rounded-full bg-white/15 text-white backdrop-blur-xl border border-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all">
                                                        <User className="w-7 h-7" />
                                                    </button>
                                                    <span className="text-[11px] text-white/90 font-medium">contacts</span>
                                                </div>
                                            </div>

                                            {/* End Call Button */}
                                            <div className="flex justify-center">
                                                <button 
                                                    onClick={() => setCallState('incoming')}
                                                    className="w-[74px] h-[74px] bg-[#FF3B30] rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                                                >
                                                    <svg viewBox="0 0 24 24" className="w-9 h-9 text-white fill-current rotate-[135deg]">
                                                        <path d="M6.62 10.79c1.44 2.82 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-auto mb-20 relative z-10 w-full max-w-[300px]">
                                            {/* Top Icons: Remind & Message */}
                                            <div className="flex justify-between px-6 mb-20 text-white">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-10 h-10 flex items-center justify-center">
                                                        <Clock className="w-7 h-7 stroke-[1.5px]" />
                                                    </div>
                                                    <span className="text-[11px] font-medium opacity-90">Rappel</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-10 h-10 flex items-center justify-center">
                                                        <MessageCircle className="w-7 h-7 stroke-[1.5px]" />
                                                    </div>
                                                    <span className="text-[11px] font-medium opacity-90">Message</span>
                                                </div>
                                            </div>

                                            {isLocked ? (
                                                /* Slide to Answer (Locked) */
                                                <div className="relative w-full h-[76px] bg-white/10 backdrop-blur-md rounded-full flex items-center p-2 border border-white/5">
                                                    <div className="relative w-[60px] h-[60px] bg-white rounded-full flex items-center justify-center shadow-lg">
                                                        {showHapticRipples && (
                                                            <>
                                                                {[0, 0.7, 1.4].map((delay, i) => (
                                                                    <motion.div
                                                                        key={i}
                                                                        className="absolute inset-0 rounded-full border-2 border-[#4CD964] pointer-events-none"
                                                                        animate={{
                                                                            scale: [1, 1.8],
                                                                            opacity: [0.7, 0],
                                                                        }}
                                                                        transition={{
                                                                            duration: 2.1,
                                                                            repeat: Infinity,
                                                                            delay,
                                                                            ease: "easeOut"
                                                                        }}
                                                                    />
                                                                ))}
                                                            </>
                                                        )}
                                                        <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#4CD964] fill-current">
                                                            <path d="M6.62 10.79c1.44 2.82 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 text-center pr-6">
                                                        <span className="text-[13px] text-white/70 font-medium tracking-tight">
                                                            Faire glisser pour répondre
                                                        </span>
                                                    </div>
                                                    {/* Shimmer overlay animation */}
                                                    <motion.div 
                                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full pointer-events-none rounded-full"
                                                        animate={{ x: ['-100%', '100%'] }}
                                                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                                    />
                                                </div>
                                            ) : (
                                                /* Decline & Accept (Unlocked) */
                                                <div className="flex justify-between">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-[76px] h-[76px] bg-[#FF3B30] rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer">
                                                            <svg viewBox="0 0 24 24" className="w-10 h-10 text-white fill-current rotate-[135deg]">
                                                                <path d="M6.62 10.79c1.44 2.82 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                                            </svg>
                                                        </div>
                                                        <span className="text-[14px] text-white font-medium">Refuser</span>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-3 relative">
                                                        <div 
                                                            onClick={() => setCallState('connected')}
                                                            className="relative w-[76px] h-[76px] bg-[#4CD964] rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                                                        >
                                                            {showHapticRipples && (
                                                                <>
                                                                    {[0, 0.7, 1.4].map((delay, i) => (
                                                                        <motion.div
                                                                            key={i}
                                                                            className="absolute inset-0 rounded-full border-2 border-[#4CD964] pointer-events-none"
                                                                            animate={{
                                                                                scale: [1, 2.1],
                                                                                opacity: [0.8, 0],
                                                                            }}
                                                                            transition={{
                                                                                duration: 2.1,
                                                                                repeat: Infinity,
                                                                                delay,
                                                                                ease: "easeOut"
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </>
                                                            )}
                                                            <svg viewBox="0 0 24 24" className="w-10 h-10 text-white fill-current relative z-10">
                                                                <path d="M6.62 10.79c1.44 2.82 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                                            </svg>
                                                        </div>
                                                        <span className="text-[14px] text-white font-medium">Accepter</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Indicator */}
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-36 h-1.5 bg-white/20 rounded-full z-10" />
                                </div>
                            </motion.div>

                            {/* Info Badge */}
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                                <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                                iPhone 17 Pro Max Format
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[400] px-8 py-4 bg-red-500/10 border border-red-500/30 rounded-2xl backdrop-blur-xl flex items-center gap-4 shadow-2xl"
                            >
                                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                                    <X className="w-5 h-5 text-red-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none mb-1">Erreur</p>
                                    <p className="text-white text-xs font-bold">{error}</p>
                                </div>
                                <button onClick={() => setError(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
                <ExportSuccessModal 
                    isOpen={showSuccess && !!readyBlob} 
                    onClose={() => {
                        setShowSuccess(false);
                        setReadyBlob(null);
                    }}
                    readyBlob={readyBlob}
                    readyUrl={readyUrl}
                    filename={readyFilename}
                    type={readyBlob?.type.includes('video') ? 'video' : 'image'}
                    title="GÉNÉRATION RÉUSSIE !"
                    subtitle="Votre contenu est prêt"
                />
            </div>
        </AnimatePresence>
    );
};
