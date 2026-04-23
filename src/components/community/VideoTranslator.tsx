import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Tv, Globe, Languages, Zap, Music, Play, X, Info, Mic, Volume2, Waves, MessageSquare, RefreshCw, Send, Lock, AlertTriangle, Maximize2, Headphones, Activity, ChevronRight, LogOut, ArrowLeft, Settings } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

// Extend Window interface for SpeechRecognition
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

export function VideoTranslator() {
    const [url, setUrl] = useState('');
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);
    const [platform, setPlatform] = useState<'YOUTUBE' | 'TWITCH' | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [channelName, setChannelName] = useState('');
    const [chatMessages, setChatMessages] = useState<{ id: string, user: string, text: string, translated?: string }[]>([]);

    // Voice Capture State
    const [isCapturing, setIsCapturing] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    const [translatedTranscript, setTranslatedTranscript] = useState('');
    const [audioLevel, setAudioLevel] = useState(0); 
    
    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Audio Visualizer
    const startAudioVisualizer = async () => {
        try {
            if (audioContextRef.current) await audioContextRef.current.close();
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } 
            });
            streamRef.current = stream;
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 64;
            source.connect(analyserRef.current);
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            const updateLevel = () => {
                if (analyserRef.current) {
                    analyserRef.current.getByteFrequencyData(dataArray);
                    setAudioLevel(dataArray.reduce((a, b) => a + b, 0) / dataArray.length);
                    animationFrameRef.current = requestAnimationFrame(updateLevel);
                }
            };
            updateLevel();
        } catch (err) { console.error("Visualizer error", err); }
    };

    const stopAudioVisualizer = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        setAudioLevel(0);
    };

    const startVoiceCapture = async () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        await startAudioVisualizer();
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.onstart = () => setIsCapturing(true);
        recognitionRef.current.onresult = async (event: any) => {
            const transcript = Array.from(event.results).map((result: any) => result[0].transcript).join('');
            setLiveTranscript(transcript);
            if (event.results[event.results.length - 1].isFinal) {
                const text = event.results[event.results.length - 1][0].transcript;
                try {
                    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|fr`);
                    const data = await res.json();
                    setTranslatedTranscript(data.responseData.translatedText);
                } catch (e) {}
            }
        };
        recognitionRef.current.onerror = () => stopVoiceCapture();
        recognitionRef.current.onend = () => { if (isCapturing) recognitionRef.current.start(); };
        recognitionRef.current.start();
    };

    const stopVoiceCapture = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsCapturing(false);
        setLiveTranscript('');
        setTranslatedTranscript('');
        stopAudioVisualizer();
    };

    // Twitch Chat Connection
    useEffect(() => {
        if (platform !== 'TWITCH' || !url) return;
        const ch = url.split('twitch.tv/')[1]?.split('?')[0];
        if (!ch) return;
        const socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
        socket.onopen = () => {
            socket.send('PASS SCHMOOPIIE');
            socket.send(`NICK justinfan${Math.floor(Math.random() * 100000)}`);
            socket.send(`JOIN #${ch.toLowerCase()}`);
        };
        socket.onmessage = async (event) => {
            const message = event.data;
            if (message.includes('PRIVMSG')) {
                const parts = message.split('PRIVMSG')[1];
                const user = message.split('!')[0].substring(1);
                const text = parts.split(':')[1]?.trim();
                if (text) translateAndAddChat(user, text);
            }
            if (message.startsWith('PING')) socket.send('PONG :tmi.twitch.tv');
        };
        return () => socket.close();
    }, [platform, url]);

    const translateAndAddChat = async (user: string, text: string) => {
        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|fr`);
            const data = await res.json();
            setChatMessages(prev => [{ id: Math.random().toString(36).substr(2, 9), user, text, translated: data.responseData.translatedText }, ...prev].slice(0, 50));
        } catch (e) {
            setChatMessages(prev => [{ id: Math.random().toString(36).substr(2, 9), user, text }, ...prev].slice(0, 50));
        }
    };

    const handleTranslate = () => {
        if (!url) return;
        setIsTranslating(true);
        setChatMessages([]);
        if (url.includes('youtube.com/') || url.includes('youtu.be/')) {
            const id = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('youtu.be/')[1].split('?')[0];
            setPlatform('YOUTUBE');
            setEmbedUrl(`https://www.youtube.com/embed/${id}?autoplay=1&cc_load_policy=1&hl=fr&cc_lang_pref=fr&rel=0`);
        } else if (url.includes('twitch.tv/')) {
            const ch = url.split('twitch.tv/')[1].split('?')[0];
            setPlatform('TWITCH');
            setChannelName(ch);
            setEmbedUrl(`https://player.twitch.tv/?channel=${ch}&parent=${window.location.hostname}&autoplay=true`);
        }
        setTimeout(() => setIsTranslating(false), 1000);
    };

    return (
        <div className={twMerge(
            "transition-all duration-700",
            embedUrl 
                ? "fixed top-[112px] left-0 right-0 bottom-0 z-[50] bg-black flex flex-col lg:flex-row overflow-hidden" 
                : "space-y-12 py-10 px-4"
        )}>
            {!embedUrl ? (
                <div className="max-w-3xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-3 px-4 py-1.5 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full">
                            <Zap className="w-3 h-3 text-neon-cyan animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neon-cyan">STUDIO 70/30 READY</span>
                        </motion.div>
                        <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">D-TV <span className="text-neon-cyan">STUDIO</span></h2>
                    </div>
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan to-purple-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000" />
                        <div className="relative flex flex-col md:flex-row bg-black/60 border border-white/10 rounded-3xl overflow-hidden p-2 backdrop-blur-2xl">
                            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleTranslate()} placeholder="Lien YouTube ou Twitch..." className="flex-1 bg-transparent border-none outline-none px-6 py-3 text-white text-sm font-bold placeholder:text-white/20" />
                            <button onClick={handleTranslate} disabled={!url || isTranslating} className="px-8 py-3 bg-white text-black font-black uppercase text-[10px] tracking-[0.1em] rounded-2xl hover:bg-neon-cyan transition-all duration-500 shrink-0">LANCER STUDIO</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-full h-full flex flex-col lg:flex-row">
                    {/* MAIN PLAYER (70%) */}
                    <div className="lg:w-[70%] h-full relative bg-black flex flex-col group">
                        <iframe src={embedUrl} className="w-full h-full border-none" allowFullScreen allow="autoplay; encrypted-media" />
                        
                        {/* TOP TOOLBAR (Inside the player area) */}
                        <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex items-center justify-between bg-gradient-to-b from-black/90 to-transparent z-[60]">
                            <div className="flex flex-wrap gap-3 items-center">
                                <button 
                                    onClick={() => { setEmbedUrl(null); setUrl(''); stopVoiceCapture(); }}
                                    className="px-5 py-2.5 bg-white text-black rounded-xl border border-white flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all hover:bg-neon-red hover:border-neon-red hover:text-white shadow-xl"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    QUITTER STUDIO
                                </button>
                                
                                <button 
                                    onClick={isCapturing ? stopVoiceCapture : startVoiceCapture}
                                    className={twMerge(
                                        "px-5 py-2.5 rounded-xl border transition-all flex items-center gap-3 text-[9px] font-black uppercase tracking-widest shadow-xl",
                                        isCapturing ? "bg-neon-red border-neon-red text-white" : "bg-neon-cyan border-neon-cyan text-black"
                                    )}
                                >
                                    <Mic className={twMerge("w-3.5 h-3.5", isCapturing && "animate-pulse")} />
                                    {isCapturing ? "STOP CAPTURE" : "TRADUCTION VOCALE"}
                                    <div className="flex gap-1 ml-2 items-center h-3">
                                        {[...Array(4)].map((_, i) => (
                                            <motion.div key={i} animate={{ height: isCapturing && audioLevel > 5 ? [3, 10, 3] : 3 }} className="w-0.5 bg-white/40 rounded-full" />
                                        ))}
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* SUBTITLES OVERLAY */}
                        <AnimatePresence>
                            {isCapturing && (translatedTranscript || liveTranscript) && (
                                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-12 left-0 right-0 pointer-events-none flex justify-center px-8 z-[70]">
                                    <div className="bg-black/95 backdrop-blur-3xl px-10 py-5 rounded-[2.5rem] border border-neon-cyan/30 text-center max-w-3xl shadow-[0_30px_80px_rgba(0,0,0,1)]">
                                        <p className="text-white text-xl md:text-3xl font-black italic tracking-tighter leading-tight">"{translatedTranscript || "Écoute en cours..."}"</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* SIDEBAR HYBRID (30%) */}
                    <div className="lg:w-[30%] min-w-[380px] border-l border-white/10 flex flex-col bg-[#050505] relative">
                        <div className="p-5 border-b border-white/10 bg-black flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-neon-cyan" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">STUDIO CHAT</h3>
                            </div>
                        </div>
                        
                        {/* Top: AI Translated (65% height) */}
                        <div className="h-[65%] overflow-y-auto p-6 space-y-5 custom-scrollbar flex flex-col-reverse border-b border-white/10 bg-black/40">
                            {chatMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-3">
                                    <RefreshCw className="w-8 h-8 animate-spin" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.4em]">SYNC...</p>
                                </div>
                            ) : (
                                chatMessages.map((msg) => (
                                    <motion.div key={msg.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[9px] font-black text-neon-cyan uppercase tracking-tighter">{msg.user}</span>
                                        </div>
                                        <div className="pl-3 border-l-2 border-white/5">
                                            <p className="text-white text-[13px] font-bold leading-relaxed">{msg.translated || msg.text}</p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Bottom: Native Interact (35% height) */}
                        <div className="h-[35%] bg-black relative border-t border-white/10">
                            {platform === 'TWITCH' ? (
                                <iframe src={`https://www.twitch.tv/embed/${channelName}/chat?parent=${window.location.hostname}&darkpopout`} className="w-full h-full border-none" />
                            ) : (
                                <div className="h-full flex items-center justify-center p-10 opacity-20 text-center">
                                    <p className="text-[9px] font-black uppercase tracking-[0.4em]">Twitch Only</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
