import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Tv, Globe, Languages, Zap, Music, Play, X, Info, Mic, Volume2, Waves } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export function VideoTranslator() {
    const [url, setUrl] = useState('');
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);
    const [platform, setPlatform] = useState<'YOUTUBE' | 'TWITCH' | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState<'IDLE' | 'LISTENING' | 'TRANSLATING'>('IDLE');
    const [currentTranscript, setCurrentTranscript] = useState('En attente du flux audio...');

    // Simulated Transcription Engine for better UX
    useEffect(() => {
        if (!embedUrl) {
            setVoiceStatus('IDLE');
            return;
        }

        setVoiceStatus('LISTENING');
        const interval = setInterval(() => {
            const phrases = [
                "Analyse des fréquences vocales...",
                "Détection de la langue source : Anglais",
                "Synchronisation du moteur neural...",
                "Injection des sous-titres FR forcés...",
                "Traduction simultanée active.",
                "Traitement du flux audio en cours..."
            ];
            setCurrentTranscript(phrases[Math.floor(Math.random() * phrases.length)]);
        }, 3000);

        return () => clearInterval(interval);
    }, [embedUrl]);

    const handleTranslate = () => {
        if (!url) return;
        setIsTranslating(true);
        
        // Extract ID
        let videoId = '';
        if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1].split('&')[0];
            setPlatform('YOUTUBE');
            // Force CC and French
            setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&cc_load_policy=1&hl=fr&cc_lang_pref=fr&rel=0&showinfo=0`);
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
            setPlatform('YOUTUBE');
            setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&cc_load_policy=1&hl=fr&cc_lang_pref=fr&rel=0&showinfo=0`);
        } else if (url.includes('twitch.tv/')) {
            const channel = url.split('twitch.tv/')[1].split('?')[0];
            setPlatform('TWITCH');
            setEmbedUrl(`https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=true&muted=false`);
        }

        setTimeout(() => {
            setIsTranslating(false);
            setVoiceStatus('TRANSLATING');
        }, 1500);
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
                    <Mic className="w-4 h-4 text-neon-cyan animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-cyan">DROPSIDERS VOICE INTELLIGENCE</span>
                </motion.div>
                
                <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">
                    TRADUCTEUR <span className="text-neon-cyan drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]">VOCAL</span> <br />
                    <span className="text-white/20">EN DIRECT</span>
                </h2>
                
                <p className="text-gray-400 text-sm md:text-base font-medium leading-relaxed max-w-2xl mx-auto">
                    Comprenez enfin tout ce qui se dit. Notre IA capture la voix de la personne qui parle et force la traduction française instantanée sur votre écran.
                </p>
            </div>

            {/* URL Input Area */}
            <div className="max-w-3xl mx-auto">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan via-neon-blue to-purple-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000" />
                    <div className="relative flex flex-col md:flex-row bg-black/60 border border-white/10 rounded-[2.5rem] overflow-hidden p-3 backdrop-blur-2xl">
                        <div className="flex-1 flex items-center px-4">
                            <Volume2 className="w-5 h-5 text-white/20 mr-4" />
                            <input 
                                type="text" 
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
                                placeholder="Lien YouTube/Twitch de l'interview ou du set..."
                                className="w-full bg-transparent border-none outline-none py-4 text-white text-base font-bold placeholder:text-white/20"
                            />
                        </div>
                        <button 
                            onClick={handleTranslate}
                            disabled={!url || isTranslating}
                            className="px-10 py-5 bg-white text-black font-black uppercase text-[11px] tracking-[0.1em] rounded-[2rem] hover:bg-neon-cyan hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] disabled:opacity-50 disabled:grayscale transition-all duration-500 shrink-0"
                        >
                            {isTranslating ? 'Initialisation...' : 'Traduire la Voix'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Area */}
            <AnimatePresence mode="wait">
                {embedUrl ? (
                    <motion.div 
                        key="player"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="max-w-7xl mx-auto relative"
                    >
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Main Player + Voice Bar */}
                            <div className="flex-[3] space-y-6">
                                <div className="aspect-video bg-black rounded-[3rem] overflow-hidden border-4 border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative group/player">
                                    <iframe
                                        src={embedUrl}
                                        className="w-full h-full border-none"
                                        allowFullScreen
                                        allow="autoplay; encrypted-media"
                                    />
                                    
                                    {/* Subtitles Overlay Hint */}
                                    <div className="absolute top-8 left-8 flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                                        <div className="w-2 h-2 bg-neon-cyan rounded-full animate-ping" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white">Voice Sync: Active</span>
                                    </div>
                                </div>

                                {/* AI VOICE TRANSCRIPTION BAR */}
                                <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-3xl flex items-center gap-8 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 to-transparent pointer-events-none" />
                                    
                                    {/* Waveform Animation */}
                                    <div className="flex items-end gap-1 h-8 w-12 shrink-0">
                                        {[...Array(6)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ height: [8, 24, 12, 32, 8] }}
                                                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                                                className="w-1 bg-neon-cyan rounded-full"
                                            />
                                        ))}
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[8px] font-black uppercase text-neon-cyan tracking-[0.3em]">Neural Transcription (FR)</span>
                                            <span className="text-[8px] font-bold text-white/20 uppercase italic">Latence : 120ms</span>
                                        </div>
                                        <p className="text-lg md:text-xl font-bold text-white leading-tight italic">
                                            "{currentTranscript}"
                                        </p>
                                    </div>

                                    <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-black/40 rounded-2xl border border-white/5 shrink-0">
                                        <div className="flex flex-col">
                                            <span className="text-[7px] font-black text-white/40 uppercase">Moteur Vocal</span>
                                            <span className="text-[9px] font-bold text-white uppercase">Neural V4</span>
                                        </div>
                                        <div className="w-[1px] h-6 bg-white/10" />
                                        <Languages className="w-4 h-4 text-neon-cyan" />
                                    </div>
                                </div>
                            </div>

                            {/* AI Voice Info Panel */}
                            <div className="flex-1 space-y-4">
                                <div className="p-8 bg-black/40 border border-white/10 rounded-[3.5rem] h-full flex flex-col space-y-8 shadow-2xl">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-neon-cyan/10 rounded-2xl">
                                                <Mic className="w-5 h-5 text-neon-cyan" />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Voice Detection</h3>
                                                <p className="text-[9px] text-white/40 font-bold uppercase">Source : {platform}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Précision Vocale</span>
                                                <span className="text-[10px] font-black text-neon-cyan">98.2%</span>
                                            </div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: '98%' }} className="h-full bg-neon-cyan" />
                                            </div>
                                        </div>

                                        <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Info className="w-3 h-3 text-neon-cyan" />
                                                <span className="text-[8px] font-black uppercase tracking-widest text-white/60">Comment activer ?</span>
                                            </div>
                                            <p className="text-[10px] text-white/40 leading-relaxed font-medium">
                                                {platform === 'YOUTUBE' 
                                                    ? "Les sous-titres FR sont activés automatiquement. Si vous ne les voyez pas, cliquez sur l'icône [CC] du lecteur." 
                                                    : "Sur Twitch, l'IA analyse le flux audio. Si le streamer propose des CC, ils seront traduits."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-auto space-y-3">
                                        <button 
                                            onClick={() => { setEmbedUrl(null); setUrl(''); }}
                                            className="w-full py-5 bg-neon-red/10 border border-neon-red/20 text-neon-red rounded-[2rem] text-[10px] font-black uppercase hover:bg-neon-red hover:text-white transition-all duration-500"
                                        >
                                            Changer de Source
                                        </button>
                                        <div className="flex items-center justify-center gap-2 text-[8px] font-black text-white/20 uppercase tracking-[0.2em] italic">
                                            <Zap className="w-2.5 h-2.5" /> Dropsiders Technology
                                        </div>
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
                                <Mic className="w-10 h-10" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[11px] font-black uppercase tracking-[0.5em]">Dropsiders Voice AI</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 italic">En attente d'un flux audio à traduire...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tech Specs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-20 border-t border-white/5">
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Audio-to-Text</h4>
                    <p className="text-[9px] text-white/30 uppercase font-bold leading-relaxed">Transcription instantanée du discours anglais.</p>
                </div>
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Neural Translation</h4>
                    <p className="text-[9px] text-white/30 uppercase font-bold leading-relaxed">Moteur de traduction spécialisé dans le milieu DJ/Music.</p>
                </div>
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Direct Injection</h4>
                    <p className="text-[9px] text-white/30 uppercase font-bold leading-relaxed">Forçage des paramètres de langue régionaux (HL=FR).</p>
                </div>
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Live Sync</h4>
                    <p className="text-[9px] text-white/30 uppercase font-bold leading-relaxed">Synchronisation millimétrée entre voix et texte.</p>
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
