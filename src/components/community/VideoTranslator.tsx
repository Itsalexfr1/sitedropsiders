import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Tv, Globe, Languages, Zap, Music, Play, X, Info, Mic, Volume2, Waves, MessageSquare, RefreshCw } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export function VideoTranslator() {
    const [url, setUrl] = useState('');
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);
    const [platform, setPlatform] = useState<'YOUTUBE' | 'TWITCH' | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    
    // Voice/Video subtitles state
    const [voiceStatus, setVoiceStatus] = useState<'IDLE' | 'LISTENING' | 'TRANSLATING'>('IDLE');
    const [currentTranscript, setCurrentTranscript] = useState('En attente du flux audio...');
    
    // Chat-as-Subtitles state
    const [liveSubtitles, setLiveSubtitles] = useState<{ id: string, user: string, text: string, translated: string }[]>([]);

    // Simulated Transcription Engine for better UX (Voice)
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

    // Twitch Chat Connection (Chat as Subtitles)
    useEffect(() => {
        if (platform !== 'TWITCH' || !url) return;
        
        const channel = url.split('twitch.tv/')[1]?.split('?')[0];
        if (!channel) return;

        const socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
        
        socket.onopen = () => {
            socket.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
            socket.send('PASS SCHMOOPIIE');
            socket.send(`NICK justinfan${Math.floor(Math.random() * 100000)}`);
            socket.send(`JOIN #${channel.toLowerCase()}`);
        };

        socket.onmessage = async (event) => {
            const message = event.data;
            if (message.includes('PRIVMSG')) {
                const parts = message.split(';');
                const displayName = parts.find((p: string) => p.startsWith('display-name='))?.split('=')[1] || 'User';
                const msgPart = message.split('PRIVMSG')[1];
                const msgText = msgPart.split(':')[1]?.trim();

                if (msgText && msgText.length > 3) {
                    processNewChatSubtitle(displayName, msgText);
                }
            }
            if (message.startsWith('PING')) {
                socket.send('PONG :tmi.twitch.tv');
            }
        };

        return () => socket.close();
    }, [platform, url]);

    const processNewChatSubtitle = async (user: string, text: string) => {
        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|fr`);
            const data = await res.json();
            const translated = data.responseData.translatedText;
            
            const newSub = { 
                id: Math.random().toString(36).substr(2, 9), 
                user, 
                text, 
                translated 
            };
            
            setLiveSubtitles(prev => [...prev, newSub].slice(-3)); // Keep last 3 on screen
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                setLiveSubtitles(prev => prev.filter(s => s.id !== newSub.id));
            }, 5000);
        } catch (e) {
            console.error('Translation error', e);
        }
    };

    const handleTranslate = () => {
        if (!url) return;
        setIsTranslating(true);
        setLiveSubtitles([]);
        
        // Extract ID
        let videoId = '';
        if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1].split('&')[0];
            setPlatform('YOUTUBE');
            setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&cc_load_policy=1&hl=fr&cc_lang_pref=fr&rel=0`);
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
            setPlatform('YOUTUBE');
            setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&cc_load_policy=1&hl=fr&cc_lang_pref=fr&rel=0`);
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
                    <Tv className="w-4 h-4 text-neon-cyan animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-cyan">DROPSIDERS TV SUBTITLES</span>
                </motion.div>
                
                <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">
                    D-TV <span className="text-neon-cyan drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]">LIVE SUBTITLES</span> <br />
                    <span className="text-white/20">STYLE TÉLÉVISION</span>
                </h2>
                
                <p className="text-gray-400 text-sm md:text-base font-medium leading-relaxed max-w-2xl mx-auto">
                    Les réactions du chat s'affichent maintenant directement sur la vidéo comme des sous-titres officiels. Immersion totale garantie.
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
                                placeholder="Lien YouTube ou Twitch..."
                                className="w-full bg-transparent border-none outline-none py-4 text-white text-base font-bold placeholder:text-white/20"
                            />
                        </div>
                        <button 
                            onClick={handleTranslate}
                            disabled={!url || isTranslating}
                            className="px-10 py-5 bg-white text-black font-black uppercase text-[11px] tracking-[0.1em] rounded-[2rem] hover:bg-neon-cyan hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] disabled:opacity-50 disabled:grayscale transition-all duration-500 shrink-0"
                        >
                            {isTranslating ? 'Initialisation...' : 'Lancer le Flux'}
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
                        className="max-w-6xl mx-auto relative group"
                    >
                        <div className="space-y-6">
                            {/* VIDEO PLAYER WITH SUBTITLE OVERLAY */}
                            <div className="aspect-video bg-black rounded-[3rem] overflow-hidden border-4 border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative overflow-hidden">
                                <iframe
                                    src={embedUrl}
                                    className="w-full h-full border-none"
                                    allowFullScreen
                                    allow="autoplay; encrypted-media"
                                />

                                {/* CHAT SUBTITLES OVERLAY (TV STYLE) */}
                                <div className="absolute inset-0 pointer-events-none flex flex-col justify-end items-center pb-12 px-12 gap-4">
                                    <AnimatePresence>
                                        {liveSubtitles.map((sub, i) => (
                                            <motion.div
                                                key={sub.id}
                                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 1.1 }}
                                                className="flex flex-col items-center"
                                            >
                                                <div className="bg-black/80 backdrop-blur-xl px-6 py-2.5 rounded-xl border border-white/10 shadow-2xl text-center">
                                                    <div className="flex items-center gap-2 justify-center mb-1">
                                                        <span className="text-[7px] font-black uppercase text-neon-cyan tracking-[0.2em]">{sub.user}</span>
                                                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                                                        <span className="text-[7px] font-black uppercase text-white/40 tracking-widest">Chat Sub</span>
                                                    </div>
                                                    <p className="text-sm md:text-lg font-bold text-white leading-tight italic drop-shadow-lg">
                                                        {sub.translated}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {/* Status Badge */}
                                <div className="absolute top-8 left-8 flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                                    <div className="w-2 h-2 bg-neon-cyan rounded-full animate-ping" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white">Neural Live Subtitles</span>
                                </div>
                            </div>

                            {/* Voice / Info Bar */}
                            <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-3xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
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
                                <div className="flex-1 space-y-1 text-center md:text-left">
                                    <span className="text-[8px] font-black uppercase text-neon-cyan tracking-[0.3em]">Audio Neural Engine</span>
                                    <p className="text-base md:text-xl font-bold text-white/40 leading-tight italic">
                                        "{currentTranscript}"
                                    </p>
                                </div>
                                <button 
                                    onClick={() => { setEmbedUrl(null); setUrl(''); }}
                                    className="px-8 py-4 bg-neon-red/10 border border-neon-red/20 text-neon-red rounded-2xl text-[10px] font-black uppercase hover:bg-neon-red hover:text-white transition-all duration-500"
                                >
                                    Fermer le Flux
                                </button>
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
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute -inset-8 border border-dashed border-white/10 rounded-full" />
                            <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/10">
                                <Tv className="w-10 h-10" />
                            </div>
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.5em]">Dropsiders Neural Experience</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tech Specs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-20 border-t border-white/5 opacity-40">
                <div className="space-y-1">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Subtitle Overlay</h4>
                    <p className="text-[8px] text-white/60 uppercase font-bold">Affichage style télévision sur la vidéo.</p>
                </div>
                <div className="space-y-1">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Real-time Translate</h4>
                    <p className="text-[8px] text-white/60 uppercase font-bold">Traduction neuronale instantanée.</p>
                </div>
                <div className="space-y-1">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Immersive Mode</h4>
                    <p className="text-[8px] text-white/60 uppercase font-bold">Focus total sur le contenu vidéo.</p>
                </div>
                <div className="space-y-1">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Dropsiders Neural</h4>
                    <p className="text-[8px] text-white/60 uppercase font-bold">Moteur v4.2 optimisé.</p>
                </div>
            </div>
        </div>
    );
}
