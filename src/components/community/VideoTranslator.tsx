import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Tv, Globe, Languages, Zap, Music, Play, X, Info, Mic, Volume2, Waves, MessageSquare, RefreshCw, Send, Lock, AlertTriangle, Maximize2, Headphones, Activity } from 'lucide-react';
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

    // Robust Audio Visualizer
    const startAudioVisualizer = async () => {
        try {
            if (audioContextRef.current) await audioContextRef.current.close();
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } 
            });
            streamRef.current = stream;
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 128;
            source.connect(analyserRef.current);
            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            const updateLevel = () => {
                if (analyserRef.current) {
                    analyserRef.current.getByteFrequencyData(dataArray);
                    let sum = dataArray.reduce((a, b) => a + b, 0);
                    setAudioLevel(sum / bufferLength); 
                    animationFrameRef.current = requestAnimationFrame(updateLevel);
                }
            };
            updateLevel();
        } catch (err) {
            console.error("Audio detection failed:", err);
        }
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
        recognitionRef.current.onstart = () => {
            setIsCapturing(true);
            setLiveTranscript("IA Dropsiders à l'écoute...");
        };
        recognitionRef.current.onresult = async (event: any) => {
            const transcript = Array.from(event.results).map((result: any) => result[0].transcript).join('');
            setLiveTranscript(transcript);
            if (event.results[event.results.length - 1].isFinal) {
                const textToTranslate = event.results[event.results.length - 1][0].transcript;
                try {
                    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|fr`);
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
        const channel = url.split('twitch.tv/')[1]?.split('?')[0];
        if (!channel) return;
        const socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
        socket.onopen = () => {
            socket.send('PASS SCHMOOPIIE');
            socket.send(`NICK justinfan${Math.floor(Math.random() * 100000)}`);
            socket.send(`JOIN #${channel.toLowerCase()}`);
        };
        socket.onmessage = async (event) => {
            const message = event.data;
            if (message.includes('PRIVMSG')) {
                const parts = message.split('PRIVMSG')[1];
                const userPart = message.split('!')[0].substring(1);
                const msgText = parts.split(':')[1]?.trim();
                if (msgText) translateAndAddChat(userPart, msgText);
            }
            if (message.startsWith('PING')) socket.send('PONG :tmi.twitch.tv');
        };
        return () => socket.close();
    }, [platform, url]);

    const translateAndAddChat = async (user: string, text: string) => {
        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|fr`);
            const data = await res.json();
            const translated = data.responseData.translatedText;
            setChatMessages(prev => [{ id: Math.random().toString(36).substr(2, 9), user, text, translated }, ...prev].slice(0, 50));
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
        <div className={twMerge(
            "transition-all duration-700",
            embedUrl ? "fixed inset-0 z-[1000] bg-black flex flex-col lg:flex-row" : "space-y-12 py-10 px-4"
        )}>
            {!embedUrl ? (
                <>
                    <div className="text-center space-y-4 max-w-3xl mx-auto px-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-3 px-4 py-1.5 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full">
                            <Zap className="w-3 h-3 text-neon-cyan animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neon-cyan">STUDIO 70/30 MODE</span>
                        </motion.div>
                        <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
                            D-TV <span className="text-neon-cyan drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]">TRANSLATOR</span>
                        </h2>
                    </div>
                    <div className="max-w-2xl mx-auto px-4">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan via-neon-blue to-purple-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000" />
                            <div className="relative flex flex-col md:flex-row bg-black/60 border border-white/10 rounded-3xl overflow-hidden p-2 backdrop-blur-2xl">
                                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleTranslate()} placeholder="Lien YouTube ou Twitch..." className="flex-1 bg-transparent border-none outline-none px-6 py-3 text-white text-sm font-bold placeholder:text-white/20" />
                                <button onClick={handleTranslate} disabled={!url || isTranslating} className="px-8 py-3 bg-white text-black font-black uppercase text-[10px] tracking-[0.1em] rounded-2xl hover:bg-neon-cyan transition-all duration-500 shrink-0">LANCER STUDIO</button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="w-full h-full flex flex-col lg:flex-row">
                    {/* MAIN PLAYER (70%) */}
                    <div className="lg:w-[70%] h-full relative bg-black flex flex-col group">
                        <iframe src={embedUrl} className="w-full h-full border-none" allowFullScreen allow="autoplay; encrypted-media" />
                        
                        {/* Overlay Controls */}
                        <div className="absolute top-8 left-8 right-8 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-500">
                            <div className="flex gap-4">
                                <div className="bg-black/80 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 bg-neon-cyan rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">STUDIO MODE 70/30</span>
                                </div>
                                <button onClick={isCapturing ? stopVoiceCapture : startVoiceCapture} className={twMerge("px-5 py-2.5 rounded-2xl border transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest", isCapturing ? "bg-neon-red/20 border-neon-red text-neon-red" : "bg-neon-cyan/20 border-neon-cyan text-neon-cyan")}>
                                    <Mic className={twMerge("w-4 h-4", isCapturing && "animate-pulse")} />
                                    {isCapturing ? "STOP CAPTURE" : "CAPTURER SON WINDOWS"}
                                    {isCapturing && (
                                        <div className="flex gap-0.5 ml-2">
                                            {[...Array(4)].map((_, i) => (
                                                <motion.div key={i} animate={{ height: audioLevel > 5 ? [4, 12, 4] : 4 }} className="w-1 bg-neon-cyan rounded-full" />
                                            ))}
                                        </div>
                                    )}
                                </button>
                            </div>
                            <button onClick={() => { setEmbedUrl(null); setUrl(''); stopVoiceCapture(); }} className="p-4 bg-neon-red/20 text-neon-red rounded-2xl border border-neon-red/20"><X className="w-5 h-5" /></button>
                        </div>

                        {/* SUBTITLES */}
                        <AnimatePresence>
                            {(isCapturing && (translatedTranscript || liveTranscript)) && (
                                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-16 left-0 right-0 pointer-events-none flex justify-center px-12">
                                    <div className="bg-black/90 backdrop-blur-2xl px-10 py-5 rounded-[2.5rem] border border-white/10 text-center max-w-4xl shadow-2xl">
                                        <p className="text-white text-xl md:text-3xl font-bold italic leading-tight">"{translatedTranscript || "Écoute du flux..."}"</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* SIDEBAR HYBRID CHAT (30%) */}
                    <div className="lg:w-[30%] min-w-[350px] border-l border-white/10 flex flex-col bg-[#050505]">
                        <div className="p-6 border-b border-white/5 bg-black/40 flex items-center gap-3">
                            <Languages className="w-5 h-5 text-neon-cyan" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">AI TRANSLATOR & INTERACT</h3>
                        </div>
                        
                        {/* 1. Translated Messages (70% of sidebar) */}
                        <div className="h-[65%] overflow-y-auto p-6 space-y-4 custom-scrollbar flex flex-col-reverse border-b border-white/5">
                            {chatMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-10 space-y-4">
                                    <RefreshCw className="w-8 h-8 animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Attente du flux live...</p>
                                </div>
                            ) : (
                                chatMessages.map((msg) => (
                                    <motion.div key={msg.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-[12px] leading-relaxed group">
                                        <span className="font-black text-neon-cyan uppercase tracking-tighter mr-2 block mb-0.5">{msg.user}:</span>
                                        <span className="text-white font-medium block pl-2 border-l-2 border-white/5 group-hover:border-neon-cyan transition-colors">{msg.translated || msg.text}</span>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* 2. Native Chat Input (30% of sidebar) */}
                        <div className="h-[35%] bg-black relative">
                            {platform === 'TWITCH' ? (
                                <iframe 
                                    src={`https://www.twitch.tv/embed/${channelName}/chat?parent=${window.location.hostname}&darkpopout`} 
                                    className="w-full h-full border-none"
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center p-8 opacity-20 text-center">
                                    <p className="text-[9px] font-black uppercase tracking-[0.4em]">Interaction disponible sur Twitch</p>
                                </div>
                            )}
                            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#050505] to-transparent pointer-events-none" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
