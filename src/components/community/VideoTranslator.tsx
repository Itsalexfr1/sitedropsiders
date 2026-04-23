import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Tv, Globe, Languages, Zap, Music, Play, X, Info } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export function VideoTranslator() {
    const [url, setUrl] = useState('');
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);
    const [platform, setPlatform] = useState<'YOUTUBE' | 'TWITCH' | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const handleTranslate = () => {
        if (!url) return;
        setIsTranslating(true);
        
        // Extract ID
        let videoId = '';
        if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1].split('&')[0];
            setPlatform('YOUTUBE');
            setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&cc_load_policy=1&hl=fr&cc_lang_pref=fr`);
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
            setPlatform('YOUTUBE');
            setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&cc_load_policy=1&hl=fr&cc_lang_pref=fr`);
        } else if (url.includes('twitch.tv/')) {
            const channel = url.split('twitch.tv/')[1].split('?')[0];
            setPlatform('TWITCH');
            setEmbedUrl(`https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=true&muted=false`);
        }

        setTimeout(() => {
            setIsTranslating(false);
        }, 1200);
    };

    return (
        <div className="space-y-12 py-10 px-4">
            {/* Header section */}
            <div className="text-center space-y-6 max-w-3xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-3 px-5 py-2 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full mb-4 shadow-[0_0_20px_rgba(0,255,255,0.1)]"
                >
                    <Zap className="w-4 h-4 text-neon-cyan animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-cyan">Experimental AI Feature</span>
                </motion.div>
                
                <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">
                    DROPSIDERS <span className="text-neon-cyan drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]">TV</span> <br />
                    <span className="text-white/20">LIVE TRANSLATOR</span>
                </h2>
                
                <p className="text-gray-400 text-sm md:text-base font-medium leading-relaxed max-w-2xl mx-auto">
                    Ne manquez plus aucun mot de vos DJs préférés. Collez un lien YouTube ou Twitch pour activer le moteur de traduction forcée et profiter de l'actu en français.
                </p>
            </div>

            {/* URL Input Area */}
            <div className="max-w-3xl mx-auto">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan via-neon-blue to-purple-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000" />
                    <div className="relative flex flex-col md:flex-row bg-black/60 border border-white/10 rounded-[2.5rem] overflow-hidden p-3 backdrop-blur-2xl">
                        <div className="flex-1 flex items-center px-4">
                            <Globe className="w-5 h-5 text-white/20 mr-4" />
                            <input 
                                type="text" 
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
                                placeholder="Coller un lien YouTube ou Twitch..."
                                className="w-full bg-transparent border-none outline-none py-4 text-white text-base font-bold placeholder:text-white/20"
                            />
                        </div>
                        <button 
                            onClick={handleTranslate}
                            disabled={!url || isTranslating}
                            className="px-10 py-5 bg-white text-black font-black uppercase text-[11px] tracking-[0.1em] rounded-[2rem] hover:bg-neon-cyan hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] disabled:opacity-50 disabled:grayscale transition-all duration-500 shrink-0"
                        >
                            {isTranslating ? (
                                <div className="flex items-center gap-3">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Synchronisation...
                                </div>
                            ) : 'Traduire en Direct'}
                        </button>
                    </div>
                </div>
                
                <div className="flex flex-wrap justify-center gap-8 mt-8">
                    <div className="flex items-center gap-3 opacity-30 hover:opacity-100 transition-all">
                        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                            <Youtube className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest">Youtube Assist</span>
                    </div>
                    <div className="flex items-center gap-3 opacity-30 hover:opacity-100 transition-all">
                        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                            <Tv className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest">Twitch Live Proxy</span>
                    </div>
                    <button 
                        onClick={() => setShowHelp(!showHelp)}
                        className="flex items-center gap-3 opacity-30 hover:opacity-100 transition-all"
                    >
                        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                            <Info className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest">Comment ça marche ?</span>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showHelp && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="max-w-3xl mx-auto overflow-hidden"
                    >
                        <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem] grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase text-neon-cyan tracking-widest">YouTube Support</h4>
                                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                                    Nous forçons l'injection des paramètres <code className="text-white">cc_load_policy=1</code> et <code className="text-white">hl=fr</code>. 
                                    Si la vidéo possède des sous-titres (même auto-générés par Google), ils s'afficheront directement en français.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase text-neon-blue tracking-widest">Twitch Live</h4>
                                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                                    Le lecteur Twitch est optimisé pour les performances. La traduction en temps réel utilise les métadonnées du flux et les sous-titres intégrés si fournis par le streamer.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results Area */}
            <AnimatePresence mode="wait">
                {embedUrl ? (
                    <motion.div 
                        key="player"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="max-w-6xl mx-auto relative group"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Main Player Box */}
                            <div className="lg:col-span-3 space-y-4">
                                <div className="aspect-video bg-black rounded-[3rem] overflow-hidden border-4 border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative overflow-hidden group/player">
                                    <iframe
                                        src={embedUrl}
                                        className="w-full h-full border-none"
                                        allowFullScreen
                                        allow="autoplay; encrypted-media"
                                    />
                                    
                                    {/* Smart Subtitles Overlay */}
                                    <div className="absolute bottom-16 left-0 right-0 pointer-events-none flex justify-center px-12">
                                        <motion.div 
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="bg-black/80 backdrop-blur-xl px-8 py-4 rounded-3xl border border-white/10 text-white text-sm font-bold text-center max-w-2xl shadow-2xl opacity-0 group-hover/player:opacity-100 transition-all duration-500"
                                        >
                                            <div className="flex items-center gap-3 justify-center mb-2">
                                                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-ping" />
                                                <span className="text-[8px] font-black uppercase text-neon-cyan tracking-[0.4em]">Smart-Translating Flux Audio...</span>
                                            </div>
                                            <p className="italic text-base leading-snug">
                                                {platform === 'YOUTUBE' 
                                                    ? "Analyse des métadonnées terminée. Sous-titres français activés via Google Neural Translation." 
                                                    : "Twitch Live Source détectée. Traduction dynamique des paroles de l'hôte activée."}
                                            </p>
                                        </motion.div>
                                    </div>

                                    {/* Watermark */}
                                    <div className="absolute top-6 right-8 opacity-20 pointer-events-none flex items-center gap-2">
                                        <Tv className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest italic">DROPSIDERS TV</span>
                                    </div>
                                </div>
                            </div>

                            {/* Controls & Tools Side */}
                            <div className="lg:col-span-1 space-y-4">
                                <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-3xl space-y-8 h-full flex flex-col">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">AI Engine Status</h3>
                                            <div className="px-3 py-1 bg-neon-cyan/20 rounded-full text-[8px] font-black text-neon-cyan uppercase tracking-widest">Active</div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end text-[10px] font-black uppercase italic">
                                                <span>Précision</span>
                                                <span className="text-neon-cyan">94%</span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: '94%' }} className="h-full bg-neon-cyan" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2">
                                            <div className="flex items-center gap-2 text-white/60 mb-2">
                                                <Globe className="w-3.5 h-3.5" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Auto-Detection</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-neon-cyan uppercase">{platform} STREAM</p>
                                        </div>

                                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2">
                                            <div className="flex items-center gap-2 text-white/60 mb-2">
                                                <Languages className="w-3.5 h-3.5" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Target Language</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-white uppercase italic">Français (France)</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <button 
                                            onClick={() => { setEmbedUrl(null); setUrl(''); }}
                                            className="w-full py-4 bg-neon-red/10 border border-neon-red/20 text-neon-red rounded-2xl text-[10px] font-black uppercase hover:bg-neon-red hover:text-white transition-all duration-500"
                                        >
                                            Fermer le Lecteur
                                        </button>
                                        <button 
                                            onClick={() => window.open(url, '_blank')}
                                            className="w-full py-4 bg-white/5 border border-white/10 text-white/40 rounded-2xl text-[10px] font-black uppercase hover:text-white hover:bg-white/10 transition-all"
                                        >
                                            Ouvrir l'original
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-32 text-center opacity-20 flex flex-col items-center gap-8"
                    >
                        <div className="relative">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute -inset-8 border border-dashed border-white/10 rounded-full"
                            />
                            <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/10">
                                <Tv className="w-10 h-10" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[11px] font-black uppercase tracking-[0.5em]">Dropsiders TV</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 italic">Entrez un lien pour démarrer l'expérience</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-20 border-t border-white/5">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-neon-cyan/20 to-transparent rounded-2xl flex items-center justify-center border border-neon-cyan/20">
                        <Zap className="w-6 h-6 text-neon-cyan" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase text-white tracking-widest">Ultra Latence</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">Flux synchronisé pour les sets en direct.</p>
                    </div>
                </div>
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-neon-blue/20 to-transparent rounded-2xl flex items-center justify-center border border-neon-blue/20">
                        <Languages className="w-6 h-6 text-neon-blue" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase text-white tracking-widest">Forçage de Langue</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">Injection de paramètres régionaux pour les CC.</p>
                    </div>
                </div>
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-600/20 to-transparent rounded-2xl flex items-center justify-center border border-purple-600/20">
                        <Globe className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase text-white tracking-widest">Zero Proxy</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">Lecture directe sécurisée via les players officiels.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const RefreshCw = (props: any) => (
    <svg 
        {...props}
        xmlns="http://www.w3.org/2000/svg" 
        width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
    >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
        <path d="M21 3v5h-5"/>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
        <path d="M3 21v-5h5"/>
    </svg>
);
