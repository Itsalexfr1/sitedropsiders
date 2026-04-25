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
    Sparkles
} from 'lucide-react';
import { toPng } from 'html-to-image';

interface IncomingCallGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
}

export const IncomingCallGenerator = ({ isOpen, onClose }: IncomingCallGeneratorProps) => {
    const [callerName, setCallerName] = useState('EDC LAS VEGAS');
    const [callStatus, setCallStatus] = useState('Appel entrant...');
    const [bgType, setBgType] = useState<'transparent' | 'image' | 'video'>('transparent');
    const [bgUrl, setBgUrl] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
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
                    {/* Header Mobile */}
                    <div className="md:hidden p-6 flex justify-between items-center border-b border-white/5">
                        <h2 className="text-xl font-bold text-white italic">CALL GENERATOR</h2>
                        <button onClick={onClose} className="p-2 bg-white/5 rounded-full"><X className="w-6 h-6 text-white" /></button>
                    </div>

                    {/* Left Side: Controls */}
                    <div className="w-full md:w-[400px] p-8 overflow-y-auto border-r border-white/5 space-y-8 custom-scrollbar bg-black/40">
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

                        {/* Export */}
                        <div className="pt-4">
                            <button
                                onClick={handleDownload}
                                disabled={isExporting}
                                className="w-full p-4 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-2xl text-black font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Génération...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        Exporter PNG
                                    </>
                                )}
                            </button>
                            <p className="text-[9px] text-gray-500 text-center mt-3 font-bold uppercase tracking-wider">
                                PNG avec fond transparent pour tes stories
                            </p>
                        </div>
                    </div>

                    {/* Right Side: Preview */}
                    <div className="flex-1 p-4 md:p-12 bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden group">
                        {/* Static Radial Gradient Background */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,255,243,0.05)_0%,transparent_70%)] pointer-events-none" />
                        
                        <div className="relative scale-[0.85] md:scale-100">
                            <div 
                                className="w-[360px] aspect-[9/16] bg-black rounded-[4rem] border-[8px] border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col"
                            >
                                <div 
                                    ref={previewRef}
                                    className={`w-full h-full relative flex flex-col items-center pt-24 px-6 overflow-hidden ${bgType === 'transparent' ? 'bg-transparent' : 'bg-black'}`}
                                >
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
                                    <div className="relative z-10 w-full flex flex-col items-center text-center">
                                        <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                                            {callerName}
                                        </h1>
                                        <p className="text-xl text-white/90 font-medium drop-shadow-md">
                                            {callStatus}
                                        </p>
                                    </div>

                                    {/* Bottom Buttons Container */}
                                    <div className="mt-auto mb-16 relative z-10 w-full max-w-[280px]">
                                        {/* Top Icons: Remind & Message */}
                                        <div className="flex justify-between px-4 mb-16 text-white">
                                            <div className="flex flex-col items-center gap-2">
                                                <Clock className="w-7 h-7" />
                                                <span className="text-[11px] font-medium">Rappel</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <MessageCircle className="w-7 h-7" />
                                                <span className="text-[11px] font-medium">Message</span>
                                            </div>
                                        </div>

                                        {/* Main Buttons: Decline & Accept */}
                                        <div className="flex justify-between">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-[72px] h-[72px] bg-[#FF3B30] rounded-full flex items-center justify-center shadow-xl">
                                                    <PhoneOff className="w-8 h-8 text-white fill-white" />
                                                </div>
                                                <span className="text-[13px] text-white font-medium">Refuser</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-[72px] h-[72px] bg-[#4CD964] rounded-full flex items-center justify-center shadow-xl">
                                                    <Phone className="w-8 h-8 text-white fill-white" />
                                                </div>
                                                <span className="text-[13px] text-white font-medium">Accepter</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Indicator */}
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/20 rounded-full z-10" />
                                </div>
                            </div>

                            {/* Info Badge */}
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                                <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                                Preview 9:16 Story
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
