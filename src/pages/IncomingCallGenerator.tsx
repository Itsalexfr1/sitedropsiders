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
    Lock
} from 'lucide-react';
import { toPng, toCanvas } from 'html-to-image';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

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
    const previewRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        setIsExporting(true);
        try {
            // Wait for any fonts/images to settle
            await new Promise(r => setTimeout(r, 500));
            
            const dataUrl = await toPng(previewRef.current, {
                quality: 1,
                pixelRatio: 3, // High res
                backgroundColor: bgType === 'transparent' ? undefined : '#000000',
            });
            
            const link = document.createElement('a');
            link.download = `appel-${callerName.toLowerCase().replace(/\s+/g, '-')}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Export failed:", err);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportVideo = async () => {
        if (!previewRef.current) return;
        if (!window.VideoEncoder) {
            alert("Ton navigateur ne supporte pas l'encodage vidéo natif (WebCodecs). Utilise Chrome, Edge ou Safari récent.");
            return;
        }

        setIsRecording(true);
        setRecordingProgress(0);

        try {
            // 1. Capture the UI as a transparent PNG to use as overlay
            // We temporarily hide the background to get only the UI
            const uiDataUrl = await toPng(previewRef.current, {
                pixelRatio: 2,
                backgroundColor: 'transparent',
                filter: (node) => {
                    // Filter out the background video/image elements
                    if (node instanceof HTMLVideoElement || (node instanceof HTMLImageElement && node.className.includes('absolute inset-0'))) return false;
                    return true;
                }
            });

            const uiImage = new Image();
            uiImage.src = uiDataUrl;
            await new Promise(r => uiImage.onload = r);

            // 2. Setup Canvas and Muxer
            const width = 720;
            const height = 1280;
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { alpha: false });
            if (!ctx) throw new Error("Could not get canvas context");

            const muxer = new Muxer({
                target: new ArrayBufferTarget(),
                video: {
                    codec: 'avc',
                    width,
                    height
                },
                fastStart: 'in-memory'
            });

            const videoEncoder = new VideoEncoder({
                output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
                error: (e) => console.error(e)
            });

            videoEncoder.configure({
                codec: 'avc1.42E01F', // H.264
                width,
                height,
                bitrate: 5_000_000, // 5 Mbps
                framerate: 30
            });

            // 3. Find background video if any
            const bgVideo = previewRef.current.querySelector('video');
            if (bgVideo) {
                bgVideo.currentTime = 0;
                await bgVideo.play();
            }

            // 4. Recording Loop
            const fps = 30;
            const totalFrames = videoDuration * fps;

            for (let i = 0; i < totalFrames; i++) {
                // Draw Background
                ctx.fillStyle = '#050505';
                ctx.fillRect(0, 0, width, height);

                if (bgVideo) {
                    ctx.drawImage(bgVideo, 0, 0, width, height);
                } else if (bgType === 'image' && bgUrl) {
                    const bgImg = previewRef.current.querySelector('img.absolute.inset-0') as HTMLImageElement;
                    if (bgImg) ctx.drawImage(bgImg, 0, 0, width, height);
                }

                // Draw UI Overlay
                ctx.drawImage(uiImage, 0, 0, width, height);

                // Add to encoder
                const frame = new VideoFrame(canvas, { timestamp: (i * 1000000) / fps });
                videoEncoder.encode(frame, { keyFrame: i % 30 === 0 });
                frame.close();

                setRecordingProgress(Math.round((i / totalFrames) * 100));
                // Small delay to allow UI to breathe
                if (i % 5 === 0) await new Promise(r => setTimeout(r, 10));
            }

            await videoEncoder.flush();
            muxer.finalize();

            const { buffer } = muxer.target as ArrayBufferTarget;
            const blob = new Blob([buffer], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.download = `appel-${callerName.toLowerCase().replace(/\s+/g, '-')}.mp4`;
            link.href = url;
            link.click();

        } catch (err) {
            console.error("Video export failed:", err);
            alert("Erreur lors de l'export vidéo. Vérifie la console.");
        } finally {
            setIsRecording(false);
            setRecordingProgress(0);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
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
                    {/* Header Mobile Tabs */}
                    <div className="md:hidden flex border-b border-white/5">
                        <button 
                            onClick={() => setMobileTab('config')}
                            className={`flex-1 p-4 text-[10px] font-black uppercase tracking-widest transition-all ${mobileTab === 'config' ? 'bg-neon-cyan text-black' : 'text-gray-500'}`}
                        >
                            Configuration
                        </button>
                        <button 
                            onClick={() => setMobileTab('preview')}
                            className={`flex-1 p-4 text-[10px] font-black uppercase tracking-widest transition-all ${mobileTab === 'preview' ? 'bg-neon-cyan text-black' : 'text-gray-500'}`}
                        >
                            Aperçu
                        </button>
                        <button onClick={onClose} className="p-4 border-l border-white/5"><X className="w-5 h-5 text-white" /></button>
                    </div>

                    {/* Left Side: Controls */}
                    <div className={`${mobileTab === 'config' ? 'block' : 'hidden md:block'} w-full md:w-[400px] p-8 overflow-y-auto border-r border-white/5 space-y-8 custom-scrollbar bg-black/40`}>
                        <div className="hidden md:flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neon-cyan/10 rounded-xl">
                                    <Phone className="w-5 h-5 text-neon-cyan" />
                                </div>
                                <h2 className="text-xl font-bold text-white uppercase italic tracking-wider">CALL GEN</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
                        </div>

                        {/* Caller Info */}
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

                        {/* Call Style Toggle */}
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

                        {/* Background Selection */}
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

                        {/* Video Duration Selection */}
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

                        {/* Export */}
                        <div className="pt-4 space-y-3">
                            <button
                                onClick={handleDownload}
                                disabled={isExporting || isRecording}
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Génération PNG...
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon className="w-5 h-5" />
                                        Exporter PNG
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleExportVideo}
                                disabled={isExporting || isRecording}
                                className="w-full p-4 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-2xl text-black font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                        {isRecording ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Vidéo {recordingProgress}%
                                    </>
                                ) : (
                                    <>
                                        <Video className="w-5 h-5" />
                                        Exporter MP4 ({videoDuration}s)
                                    </>
                                )}
                            </button>
                            
                            <p className="text-[9px] text-gray-500 text-center mt-3 font-bold uppercase tracking-wider">
                                MP4 pour tes stories • PNG pour overlay transparent
                            </p>
                        </div>
                    </div>

                    {/* Right Side: Preview */}
                    <div className={`${mobileTab === 'preview' ? 'flex' : 'hidden md:flex'} flex-1 p-4 md:p-12 bg-[#050505] flex-col items-center justify-center relative overflow-hidden group`}>
                        {/* Static Radial Gradient Background */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,255,243,0.05)_0%,transparent_70%)] pointer-events-none" />
                        
                        <div className="relative scale-[0.85] md:scale-100">
                            <div 
                                className="w-[360px] aspect-[9/16] bg-black rounded-[4rem] border-[8px] border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col"
                            >
                                <div 
                                    ref={previewRef}
                                    className={`w-full h-full relative flex flex-col items-center pt-20 px-6 overflow-hidden ${bgType === 'transparent' ? 'bg-transparent' : 'bg-[#050505]'}`}
                                >
                                    {/* Dynamic Island */}
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-[1.5rem] z-50 border border-white/5" />

                                    {/* BG Content */}
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
                                    <div className="relative z-10 w-full flex flex-col items-center text-center mt-12">
                                        <h1 className="text-4xl md:text-5xl font-medium text-white mb-2 drop-shadow-2xl tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif' }}>
                                            {callerName}
                                        </h1>
                                        <p className="text-xl text-white/80 font-normal drop-shadow-md tracking-wide">
                                            {callStatus}
                                        </p>
                                    </div>

                                    {/* Bottom Buttons Container */}
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
                                                <div className="w-[60px] h-[60px] bg-white rounded-full flex items-center justify-center shadow-lg">
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
                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full pointer-events-none"
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
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-[76px] h-[76px] bg-[#4CD964] rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer">
                                                        <svg viewBox="0 0 24 24" className="w-10 h-10 text-white fill-current">
                                                            <path d="M6.62 10.79c1.44 2.82 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-[14px] text-white font-medium">Accepter</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Indicator */}
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-36 h-1.5 bg-white/20 rounded-full z-10" />
                                </div>
                            </div>

                            {/* Info Badge */}
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                                <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                                iPhone 17 Pro Max Format
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const Loader2 = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
