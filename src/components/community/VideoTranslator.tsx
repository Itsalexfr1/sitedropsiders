import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Tv, Globe, Languages, Zap, Music, Play, X, Info, Mic, Volume2, Waves, MessageSquare, RefreshCw, Send, Lock, AlertTriangle, Maximize2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export function VideoTranslator() {
    const [url, setUrl] = useState('');
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);
    const [platform, setPlatform] = useState<'YOUTUBE' | 'TWITCH' | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [channelName, setChannelName] = useState('');
    const [chatMode, setChatMode] = useState<'AI' | 'NATIVE'>('AI');
    const [chatMessages, setChatMessages] = useState<{ id: string, user: string, text: string, translated?: string }[]>([]);

    // Twitch Chat Connection
    useEffect(() => {
        if (platform !== 'TWITCH' || !url || chatMode !== 'AI') return;
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
                if (msgText) translateAndAddChat(displayName, msgText);
            }
            if (message.startsWith('PING')) socket.send('PONG :tmi.twitch.tv');
        };
        return () => socket.close();
    }, [platform, url, chatMode]);

    const translateAndAddChat = async (user: string, text: string) => {
        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|fr`);
            const data = await res.json();
            const translated = data.responseData.translatedText;
            const newMsg = { id: Math.random().toString(36).substr(2, 9), user, text, translated };
            setChatMessages(prev => [newMsg, ...prev].slice(0, 50));
        } catch (e) {
            setChatMessages(prev => [{ id: Math.random().toString(36).substr(2, 9), user, text }, ...prev].slice(0, 50));
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
            setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&cc_load_policy=1&hl=fr&cc_lang_pref=fr&rel=0&modestbranding=1`);
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
            setPlatform('YOUTUBE');
            setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&cc_load_policy=1&hl=fr&cc_lang_pref=fr&rel=0&modestbranding=1`);
        } else if (url.includes('twitch.tv/')) {
            const channel = url.split('twitch.tv/')[1].split('?')[0];
            setPlatform('TWITCH');
            setChannelName(channel);
            setEmbedUrl(`https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=true&muted=false`);
        }
        setTimeout(() => setIsTranslating(false), 1500);
    };

    return (
        <div className={twMerge("space-y-6 md:space-y-12 py-10", embedUrl ? "px-0" : "px-4")}>
            {/* Header section (Hide when playing for full-width feel) */}
            {!embedUrl && (
                <div className="text-center space-y-4 max-w-3xl mx-auto px-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-3 px-4 py-1.5 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full">
                        <Zap className="w-3 h-3 text-neon-cyan animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neon-cyan">DROPSIDERS CINEMA MODE</span>
                    </motion.div>
                    <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
                        D-TV <span className="text-neon-cyan drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]">TRANSLATOR</span>
                    </h2>
                </div>
            )}

            {/* URL Input Area (Hide when playing) */}
            {!embedUrl && (
                <div className="max-w-2xl mx-auto px-4">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan via-neon-blue to-purple-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000" />
                        <div className="relative flex flex-col md:flex-row bg-black/60 border border-white/10 rounded-3xl overflow-hidden p-2 backdrop-blur-2xl">
                            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleTranslate()} placeholder="Lien YouTube ou Twitch..." className="flex-1 bg-transparent border-none outline-none px-6 py-3 text-white text-sm font-bold placeholder:text-white/20" />
                            <button onClick={handleTranslate} disabled={!url || isTranslating} className="px-8 py-3 bg-white text-black font-black uppercase text-[10px] tracking-[0.1em] rounded-2xl hover:bg-neon-cyan transition-all duration-500 shrink-0">
                                {isTranslating ? 'SYNC...' : 'LANCER'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AnimatePresence mode="wait">
                {embedUrl ? (
                    <motion.div key="player" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full min-h-[calc(100vh-150px)] flex flex-col lg:flex-row bg-black/40 border-y border-white/5 shadow-2xl">
                        {/* MAIN PLAYER (80%) */}
                        <div className="lg:w-[80%] relative bg-black flex flex-col group">
                            <div className="flex-1 relative">
                                <iframe src={embedUrl} className="w-full h-full border-none" allowFullScreen allow="autoplay; encrypted-media" />
                                
                                {/* Top Controls Overlay */}
                                <div className="absolute top-6 left-6 right-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                                        <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white">MODALITÉ CINÉMA : 80/20</span>
                                    </div>
                                    <button onClick={() => { setEmbedUrl(null); setUrl(''); }} className="p-3 bg-neon-red/20 hover:bg-neon-red text-neon-red hover:text-white rounded-xl border border-neon-red/20 transition-all">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Vocal Translation Info Popover */}
                                <div className="absolute bottom-10 left-10 max-w-md opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <div className="bg-black/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl space-y-4">
                                        <div className="flex items-center gap-3 text-neon-cyan">
                                            <Mic className="w-5 h-5 animate-pulse" />
                                            <h4 className="text-[10px] font-black uppercase tracking-widest">Traduction Vocale IA</h4>
                                        </div>
                                        <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                                            {platform === 'YOUTUBE' 
                                                ? "Sous-titres FR activés via le lecteur. Cliquez sur l'icône [CC] si nécessaire." 
                                                : "Le DJ parle anglais ? Pour la traduction vocale live sur Twitch, nous recommandons d'activer 'Live Caption' dans les paramètres de votre navigateur Chrome/Edge."}
                                        </p>
                                        <div className="flex gap-2">
                                            <div className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black text-white/40 border border-white/5 uppercase">Neural V4.2</div>
                                            <div className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black text-white/40 border border-white/5 uppercase">Low Latency</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SIDEBAR CHAT (20%) */}
                        <div className="lg:w-[20%] min-w-[300px] border-l border-white/5 flex flex-col bg-[#050505] shadow-2xl">
                            <div className="p-5 border-b border-white/5 flex flex-col gap-4 bg-black/40">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-neon-cyan" />
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">CHAT LIVE FR</h3>
                                    </div>
                                    <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
                                        <button onClick={() => setChatMode('AI')} className={twMerge("px-4 py-1.5 rounded-md text-[8px] font-black transition-all", chatMode === 'AI' ? "bg-neon-cyan text-black" : "text-white/40 hover:text-white")}>IA</button>
                                        <button onClick={() => setChatMode('NATIVE')} className={twMerge("px-4 py-1.5 rounded-md text-[8px] font-black transition-all", chatMode === 'NATIVE' ? "bg-neon-blue text-white" : "text-white/40 hover:text-white")}>CHAT</button>
                                    </div>
                                </div>
                                {chatMode === 'AI' && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-neon-cyan/5 border border-neon-cyan/10 rounded-lg">
                                        <div className="w-1 h-1 bg-neon-cyan rounded-full" />
                                        <span className="text-[8px] font-black text-neon-cyan uppercase tracking-widest">Traduction Active</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 overflow-hidden relative">
                                {chatMode === 'AI' ? (
                                    <div className="h-full overflow-y-auto p-5 space-y-4 custom-scrollbar flex flex-col-reverse">
                                        {chatMessages.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center opacity-10 p-8">
                                                <RefreshCw className="w-6 h-6 animate-spin mb-3" />
                                                <p className="text-[9px] font-black uppercase tracking-widest">Synchronisation...</p>
                                            </div>
                                        ) : (
                                            chatMessages.map((msg) => (
                                                <motion.div key={msg.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="text-[11px] leading-relaxed">
                                                    <span className="font-black text-neon-cyan uppercase tracking-tighter mr-2">{msg.user}:</span>
                                                    <span className="text-white/80 font-medium">{msg.translated || msg.text}</span>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    <iframe src={`https://www.twitch.tv/embed/${channelName}/chat?parent=${window.location.hostname}&darkpopout`} className="w-full h-full border-none" />
                                )}
                            </div>

                            <div className="p-4 bg-black/60 border-t border-white/5">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-center gap-2 text-[8px] font-black text-white/20 uppercase italic">
                                        <Zap className="w-2.5 h-2.5" /> Dropsiders Cinema Engine
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center opacity-10 flex flex-col items-center gap-6">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10"><Tv className="w-8 h-8" /></div>
                        <p className="text-[9px] font-black uppercase tracking-[0.5em]">Dropsiders Neural experience</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
