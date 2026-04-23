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
    const [chatMode, setChatMode] = useState<'AI' | 'NATIVE'>('AI');
    const [chatMessages, setChatMessages] = useState<{ id: string, user: string, text: string, translated?: string }[]>([]);

    // Voice Capture State
    const [isCapturing, setIsCapturing] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    const [translatedTranscript, setTranslatedTranscript] = useState('');
    const [audioLevel, setAudioLevel] = useState(0); // For the visual confirmation
    
    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Initialize Audio Visualizer
    const startAudioVisualizer = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            source.connect(analyserRef.current);

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateLevel = () => {
                if (analyserRef.current) {
                    analyserRef.current.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((a, b) => a + b) / bufferLength;
                    setAudioLevel(average); // 0 to 255
                    animationFrameRef.current = requestAnimationFrame(updateLevel);
                }
            };
            updateLevel();
        } catch (err) {
            console.error("Error accessing audio for visualizer:", err);
        }
    };

    const stopAudioVisualizer = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        setAudioLevel(0);
    };

    const startVoiceCapture = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => {
            setIsCapturing(true);
            setLiveTranscript("L'IA est à l'écoute...");
            startAudioVisualizer();
        };

        recognitionRef.current.onresult = async (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result: any) => result.transcript)
                .join('');

            setLiveTranscript(transcript);

            if (event.results[event.results.length - 1].isFinal) {
                const textToTranslate = event.results[event.results.length - 1][0].transcript;
                try {
                    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|fr`);
                    const data = await res.json();
                    setTranslatedTranscript(data.responseData.translatedText);
                } catch (e) {
                    console.error("Translation error", e);
                }
            }
        };

        recognitionRef.current.onerror = () => setIsCapturing(false);
        recognitionRef.current.onend = () => {
            if (isCapturing) recognitionRef.current.start();
        };

        recognitionRef.current.start();
    };

    const stopVoiceCapture = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsCapturing(false);
            setLiveTranscript('');
            setTranslatedTranscript('');
            stopAudioVisualizer();
        }
    };

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
            {!embedUrl && (
                <div className="text-center space-y-4 max-w-3xl mx-auto px-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-3 px-4 py-1.5 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full">
                        <Activity className="w-3 h-3 text-neon-cyan animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neon-cyan">DROPSIDERS SONAR ENGINE</span>
                    </motion.div>
                    <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
                        D-TV <span className="text-neon-cyan drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]">VOICE CAPTURE</span>
                    </h2>
                </div>
            )}

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
                                    <div className="flex gap-3">
                                        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                                            <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white">80/20 STUDIO MODE</span>
                                        </div>
                                        <div className="flex bg-black/60 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                                            <button 
                                                onClick={isCapturing ? stopVoiceCapture : startVoiceCapture}
                                                className={twMerge(
                                                    "px-4 py-2 transition-all flex items-center gap-2 text-[9px] font-black uppercase tracking-widest",
                                                    isCapturing ? "bg-neon-red/20 text-neon-red" : "bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan hover:text-black"
                                                )}
                                            >
                                                <Mic className={twMerge("w-3 h-3", isCapturing && "animate-pulse")} />
                                                {isCapturing ? "STOP" : "CAPTURER SON WINDOWS"}
                                            </button>
                                            
                                            {/* AUDIO LEVEL CONFIRMATION (Visualizer) */}
                                            {isCapturing && (
                                                <div className="px-4 flex items-center gap-1 bg-black/40 border-l border-white/10 min-w-[80px]">
                                                    {[...Array(6)].map((_, i) => (
                                                        <motion.div
                                                            key={i}
                                                            animate={{ 
                                                                height: audioLevel > 10 ? [4, Math.random() * (audioLevel / 4) + 4, 4] : 4,
                                                                backgroundColor: audioLevel > 20 ? "#00ffff" : "#333"
                                                            }}
                                                            className="w-1 rounded-full"
                                                        />
                                                    ))}
                                                    <span className="text-[7px] font-black text-white ml-2">DETECTION...</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => { setEmbedUrl(null); setUrl(''); stopVoiceCapture(); }} className="p-3 bg-neon-red/20 hover:bg-neon-red text-neon-red hover:text-white rounded-xl border border-neon-red/20 transition-all">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* LIVE SUBTITLES OVERLAY */}
                                <AnimatePresence>
                                    {(isCapturing && (translatedTranscript || liveTranscript)) && (
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-12 left-0 right-0 pointer-events-none flex justify-center px-10">
                                            <div className="bg-black/80 backdrop-blur-xl px-8 py-4 rounded-[2rem] border border-white/10 shadow-2xl text-center max-w-3xl">
                                                <div className="flex items-center gap-2 justify-center mb-2">
                                                    <Activity className={twMerge("w-3 h-3 text-neon-cyan", audioLevel > 10 && "animate-pulse")} />
                                                    <span className="text-[7px] font-black uppercase text-neon-cyan tracking-[0.4em]">VOICE CAPTURE SYNC</span>
                                                </div>
                                                <p className="text-white text-base md:text-xl font-bold italic leading-tight">
                                                    "{translatedTranscript || "En attente d'une voix claire..."}"
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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
                            </div>
                            
                            <div className="flex-1 overflow-hidden relative">
                                {chatMode === 'AI' ? (
                                    <div className="h-full overflow-y-auto p-5 space-y-4 custom-scrollbar flex flex-col-reverse">
                                        {chatMessages.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center opacity-10 p-8">
                                                <RefreshCw className="w-6 h-6 animate-spin mb-3" />
                                                <p className="text-[9px] font-black uppercase tracking-widest">Connecté...</p>
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
