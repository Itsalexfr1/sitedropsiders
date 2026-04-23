import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Tv, Globe, Languages, Zap, Music, Play, X, Info, Mic, Volume2, Waves, MessageSquare, RefreshCw } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export function VideoTranslator() {
    const [url, setUrl] = useState('');
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);
    const [platform, setPlatform] = useState<'YOUTUBE' | 'TWITCH' | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    
    // Vocal Translation (Subtitles on Video)
    const [vocalSubtitle, setVocalSubtitle] = useState('Initialisation du moteur vocal...');
    
    // Chat Translation (Sidebar)
    const [chatMessages, setChatMessages] = useState<{ id: string, user: string, text: string, translated?: string }[]>([]);

    // Simulated Vocal Transcription Engine
    useEffect(() => {
        if (!embedUrl) return;
        
        const phrases = [
            "Bienvenue dans cette interview exclusive...",
            "Nous parlons aujourd'hui de la nouvelle scène techno...",
            "Les festivals cet été s'annoncent incroyables.",
            "L'IA révolutionne la production musicale.",
            "Restez connectés pour le prochain set en direct.",
            "Analyse du flux audio en cours..."
        ];
        
        let i = 0;
        const interval = setInterval(() => {
            setVocalSubtitle(phrases[i % phrases.length]);
            i++;
        }, 4000);

        return () => clearInterval(interval);
    }, [embedUrl]);

    // Twitch Chat Connection
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

                if (msgText) {
                    translateAndAddChat(displayName, msgText);
                }
            }
            if (message.startsWith('PING')) {
                socket.send('PONG :tmi.twitch.tv');
            }
        };

        return () => socket.close();
    }, [platform, url]);

    const translateAndAddChat = async (user: string, text: string) => {
        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|fr`);
            const data = await res.json();
            const translated = data.responseData.translatedText;
            
            const newMsg = { id: Math.random().toString(36).substr(2, 9), user, text, translated };
            setChatMessages(prev => [newMsg, ...prev].slice(0, 50));
        } catch (e) {
            const newMsg = { id: Math.random().toString(36).substr(2, 9), user, text };
            setChatMessages(prev => [newMsg, ...prev].slice(0, 50));
        }
    };

    const handleTranslate = () => {
        if (!url) return;
        setIsTranslating(true);
        setChatMessages([]);
        
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
        }, 1500);
    };

    return (
        <div className="space-y-12 py-10 px-4">
            {/* Header section */}
            <div className="text-center space-y-4 max-w-3xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-3 px-4 py-1.5 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full mb-2 shadow-[0_0_20px_rgba(0,255,255,0.1)]"
                >
                    <Mic className="w-3 h-3 text-neon-cyan animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neon-cyan">DROPSIDERS AI ENGINE</span>
                </motion.div>
                
                <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">
                    D-TV <span className="text-neon-cyan drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]">TRANSLATOR</span>
                </h2>
                
                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-xl mx-auto">
                    Traduction vocale sur la vidéo et chat compact intelligent.
                </p>
            </div>

            {/* URL Input Area */}
            <div className="max-w-2xl mx-auto">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan via-neon-blue to-purple-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000" />
                    <div className="relative flex flex-col md:flex-row bg-black/60 border border-white/10 rounded-3xl overflow-hidden p-2 backdrop-blur-2xl">
                        <input 
                            type="text" 
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
                            placeholder="Lien YouTube ou Twitch..."
                            className="flex-1 bg-transparent border-none outline-none px-6 py-3 text-white text-sm font-bold placeholder:text-white/20"
                        />
                        <button 
                            onClick={handleTranslate}
                            disabled={!url || isTranslating}
                            className="px-8 py-3 bg-white text-black font-black uppercase text-[10px] tracking-[0.1em] rounded-2xl hover:bg-neon-cyan transition-all duration-500 shrink-0"
                        >
                            {isTranslating ? 'SYNC...' : 'TRADUIRE'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Area */}
            <AnimatePresence mode="wait">
                {embedUrl ? (
                    <motion.div 
                        key="player"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="max-w-7xl mx-auto"
                    >
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Main Video Section */}
                            <div className="flex-[3] relative">
                                <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative">
                                    <iframe
                                        src={embedUrl}
                                        className="w-full h-full border-none"
                                        allowFullScreen
                                        allow="autoplay; encrypted-media"
                                    />

                                    {/* VOCAL SUBTITLES OVERLAY (ON VIDEO) */}
                                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end items-center pb-10 px-12">
                                        <motion.div
                                            key={vocalSubtitle}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-black/80 backdrop-blur-md px-6 py-2 rounded-xl border border-white/10 shadow-2xl text-center max-w-[80%]"
                                        >
                                            <p className="text-sm md:text-lg font-bold text-white leading-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                                {vocalSubtitle}
                                            </p>
                                        </motion.div>
                                    </div>

                                    {/* Small AI Badge */}
                                    <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/5">
                                        <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-white/60">AI Voice Sync</span>
                                    </div>
                                </div>
                            </div>

                            {/* COMPACT CHAT SIDEBAR (STYLE TWITCH) */}
                            <div className="flex-1 min-w-[300px] max-w-[400px] bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] flex flex-col h-[500px] lg:h-auto overflow-hidden shadow-xl">
                                <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/40">
                                    <div className="flex items-center gap-3">
                                        <MessageSquare className="w-3.5 h-3.5 text-neon-cyan" />
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">LIVE CHAT FR</h3>
                                    </div>
                                    <div className="w-2 h-2 bg-neon-cyan rounded-full animate-ping" />
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar flex flex-col-reverse">
                                    {platform !== 'TWITCH' ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-20 p-6">
                                            <Tv className="w-6 h-6" />
                                            <p className="text-[8px] font-black uppercase tracking-widest leading-relaxed">
                                                Vocal Subtitles On. <br /> (Chat pour Twitch)
                                            </p>
                                        </div>
                                    ) : chatMessages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-10">
                                            <RefreshCw className="w-5 h-5 animate-spin mb-2" />
                                            <p className="text-[8px] font-black uppercase tracking-widest">Connecté...</p>
                                        </div>
                                    ) : (
                                        chatMessages.map((msg) => (
                                            <div key={msg.id} className="text-[11px] leading-relaxed group">
                                                <span className="font-black text-neon-cyan uppercase tracking-tighter mr-2">{msg.user}:</span>
                                                <span className="text-white font-medium">
                                                    {msg.translated || msg.text}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="p-4 bg-black/40 border-t border-white/5 text-center">
                                    <button 
                                        onClick={() => { setEmbedUrl(null); setUrl(''); }}
                                        className="text-[8px] font-black uppercase text-white/20 hover:text-neon-red transition-colors"
                                    >
                                        CHANGER DE SOURCE
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-24 text-center opacity-10 flex flex-col items-center gap-6"
                    >
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                            <Tv className="w-8 h-8" />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[0.5em]">Dropsiders Neural experience</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
