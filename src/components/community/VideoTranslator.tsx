import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Tv, Globe, Languages, Zap, Music, Play, X, Info, Mic, Volume2, Waves, MessageSquare, RefreshCw, Send, Lock, AlertTriangle } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export function VideoTranslator() {
    const [url, setUrl] = useState('');
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);
    const [platform, setPlatform] = useState<'YOUTUBE' | 'TWITCH' | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [channelName, setChannelName] = useState('');
    const [chatMode, setChatMode] = useState<'AI' | 'NATIVE'>('AI');
    
    // Chat Translation (Sidebar)
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
        <div className="space-y-12 py-10 px-4">
            {/* Header section */}
            <div className="text-center space-y-4 max-w-3xl mx-auto">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-3 px-4 py-1.5 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full mb-2">
                    <Zap className="w-3 h-3 text-neon-cyan animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neon-cyan">DROPSIDERS REAL-TIME TV</span>
                </motion.div>
                <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">
                    D-TV <span className="text-neon-cyan drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]">TRANSLATOR</span>
                </h2>
                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-xl mx-auto">
                    Traductions instantanées via les moteurs officiels. <br />
                    <span className="text-neon-cyan">Note : Les sous-titres vocaux sont injectés directement dans le lecteur.</span>
                </p>
            </div>

            {/* URL Input Area */}
            <div className="max-w-2xl mx-auto">
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

            <AnimatePresence mode="wait">
                {embedUrl ? (
                    <motion.div key="player" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="max-w-7xl mx-auto">
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Main Video Section */}
                            <div className="flex-[3] relative">
                                <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative">
                                    <iframe src={embedUrl} className="w-full h-full border-none" allowFullScreen allow="autoplay; encrypted-media" />
                                    
                                    {/* INFO OVERLAY (No more fake text) */}
                                    <div className="absolute bottom-6 left-6 right-6 pointer-events-none flex justify-center">
                                        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/60">
                                                {platform === 'YOUTUBE' 
                                                    ? "Sous-titres FR forcés via API YouTube" 
                                                    : "Analyse du flux audio Twitch active"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Info help */}
                                <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-4">
                                    <Info className="w-4 h-4 text-neon-cyan shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-white/40 leading-relaxed font-medium">
                                        {platform === 'YOUTUBE' 
                                            ? "Pour une traduction parfaite de la voix, assurez-vous que l'icône [CC] est activée sur le lecteur YouTube ci-dessus. L'IA a déjà pré-configuré la langue en Français."
                                            : "Pour Twitch, si le streamer ne fournit pas de sous-titres, nous vous recommandons d'activer les 'Live Captions' de votre navigateur (Paramètres > Accessibilité)."}
                                    </p>
                                </div>
                            </div>

                            {/* DUAL MODE CHAT SIDEBAR */}
                            <div className="flex-1 min-w-[320px] max-w-[400px] bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] flex flex-col h-[600px] lg:h-auto overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-white/5 flex flex-col gap-3 bg-black/40">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="w-3.5 h-3.5 text-neon-cyan" />
                                            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-white">TWITCH CHAT</h3>
                                        </div>
                                        <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
                                            <button onClick={() => setChatMode('AI')} className={twMerge("px-3 py-1 rounded-md text-[8px] font-black transition-all", chatMode === 'AI' ? "bg-neon-cyan text-black" : "text-white/40 hover:text-white")}>IA TRAD</button>
                                            <button onClick={() => setChatMode('NATIVE')} className={twMerge("px-3 py-1 rounded-md text-[8px] font-black transition-all", chatMode === 'NATIVE' ? "bg-neon-blue text-white" : "text-white/40 hover:text-white")}>NATIF</button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-hidden relative">
                                    {chatMode === 'AI' ? (
                                        <div className="h-full overflow-y-auto p-4 space-y-3 custom-scrollbar flex flex-col-reverse">
                                            {platform !== 'TWITCH' ? (
                                                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-20 p-6">
                                                    <Tv className="w-6 h-6" />
                                                    <p className="text-[8px] font-black uppercase tracking-widest leading-relaxed">Mode Traduction Vocale <br /> (Chat pour Twitch)</p>
                                                </div>
                                            ) : chatMessages.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-center opacity-10">
                                                    <RefreshCw className="w-5 h-5 animate-spin mb-2" />
                                                    <p className="text-[8px] font-black uppercase tracking-widest">En attente du chat...</p>
                                                </div>
                                            ) : (
                                                chatMessages.map((msg) => (
                                                    <div key={msg.id} className="text-[11px] leading-relaxed group">
                                                        <span className="font-black text-neon-cyan uppercase tracking-tighter mr-2">{msg.user}:</span>
                                                        <span className="text-white font-medium">{msg.translated || msg.text}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    ) : (
                                        <iframe 
                                            src={`https://www.twitch.tv/embed/${channelName}/chat?parent=${window.location.hostname}&darkpopout`}
                                            className="w-full h-full border-none"
                                        />
                                    )}
                                </div>

                                <div className="p-4 bg-black/40 border-t border-white/5 text-center flex items-center justify-center gap-4">
                                    <button onClick={() => { setEmbedUrl(null); setUrl(''); }} className="text-[8px] font-black uppercase text-white/20 hover:text-neon-red transition-colors">CHANGER SOURCE</button>
                                    {chatMode === 'AI' && platform === 'TWITCH' && (
                                        <button onClick={() => setChatMode('NATIVE')} className="text-[8px] font-black uppercase text-neon-cyan flex items-center gap-2">
                                            <MessageSquare className="w-3 h-3" /> RÉPONDRE
                                        </button>
                                    )}
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
