import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Tv, Globe, Languages, Zap, Music, Play, X, Info, Mic, Volume2, Waves, MessageSquare, RefreshCw, Send, Lock, AlertTriangle, Maximize2, Headphones, Activity, ChevronRight, LogOut, ArrowLeft, Settings, Monitor } from 'lucide-react';
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
    const [autoPlay, setAutoPlay] = useState(true);

    // Voice Capture State
    const [isCapturing, setIsCapturing] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    const [translatedTranscript, setTranslatedTranscript] = useState('');
    const [statusStep, setStatusStep] = useState<string>("");
    const [audioLevel, setAudioLevel] = useState(0); 
    const [captureError, setCaptureError] = useState<string | null>(null);
    const [isMonitoring, setIsMonitoring] = useState(false);
    
    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const monitorNodeRef = useRef<GainNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const displayStreamRef = useRef<MediaStream | null>(null);

    // Audio Visualizer
    const startSystemAudioCapture = async () => {
        try {
            setCaptureError(null);
            setStatusStep("Attente autorisation système...");
            
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
            });

            const audioTracks = displayStream.getAudioTracks();
            if (audioTracks.length === 0) {
                displayStream.getTracks().forEach(t => t.stop());
                setCaptureError("Aucun flux audio détecté dans la capture système.");
                return false;
            }

            displayStream.getVideoTracks().forEach(t => t.enabled = false);
            displayStreamRef.current = displayStream;
            
            if (audioContextRef.current) await audioContextRef.current.close();
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContextRef.current.createMediaStreamSource(displayStream);
            
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 64;
            source.connect(analyserRef.current);

            monitorNodeRef.current = audioContextRef.current.createGain();
            monitorNodeRef.current.gain.value = isMonitoring ? 1 : 0;
            source.connect(monitorNodeRef.current);
            monitorNodeRef.current.connect(audioContextRef.current.destination);

            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            const updateLevel = () => {
                if (analyserRef.current) {
                    analyserRef.current.getByteFrequencyData(dataArray);
                    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                    setAudioLevel(avg);
                    animationFrameRef.current = requestAnimationFrame(updateLevel);
                }
            };
            updateLevel();
            
            startRecognitionWithStream(displayStream);
            return true;
        } catch (err) {
            console.error("System capture error", err);
            setCaptureError("Capture système annulée ou refusée.");
            return false;
        }
    };

    const startRecognitionWithStream = async (stream: MediaStream) => {
        setIsCapturing(true);
        setCaptureError(null);
        setStatusStep("Initialisation IA...");
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setCaptureError("IA non supportée sur ce navigateur.");
            return;
        }

        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) {}
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setStatusStep("IA ACTIVE");
        };

        recognition.onresult = async (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    setLiveTranscript(text);
                    try {
                        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t&q=${encodeURIComponent(text)}`);
                        const data = await res.json();
                        if (data && data[0] && data[0][0] && data[0][0][0]) {
                            setTranslatedTranscript(data[0][0][0]);
                        }
                    } catch (e) {}
                } else {
                    interim += text;
                }
            }
            if (interim) setLiveTranscript(interim);
        };

        recognition.onerror = (e: any) => {
            console.error("AI Error:", e.error);
            if (e.error === 'not-allowed') setStatusStep("PERM REFUSÉE");
            else setStatusStep(`ERREUR: ${e.error}`);
        };

        recognition.onend = () => {
            if (isCapturing) {
                setTimeout(() => {
                    try { recognition.start(); } catch (e) {}
                }, 100);
            }
        };

        try {
            recognition.start();
        } catch (e) {
            console.error("Critical Start Error", e);
            setStatusStep("CLIQUE SUR DÉBLOQUER");
        }
    };

    const stopVoiceCapture = () => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) {}
        }
        setIsCapturing(false);
        setLiveTranscript('');
        setTranslatedTranscript('');
        if (displayStreamRef.current) displayStreamRef.current.getTracks().forEach(track => track.stop());
        setAudioLevel(0);
        setIsMonitoring(false);
    };

    const toggleMonitoring = () => {
        const newState = !isMonitoring;
        setIsMonitoring(newState);
        if (monitorNodeRef.current) {
            monitorNodeRef.current.gain.value = newState ? 1 : 0;
        }
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
            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t&q=${encodeURIComponent(text)}`);
            const data = await res.json();
            const translated = (data && data[0] && data[0][0] && data[0][0][0]) ? data[0][0][0] : text;
            setChatMessages(prev => [{ id: Math.random().toString(36).substr(2, 9), user, text, translated }, ...prev].slice(0, 50));
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
            setEmbedUrl(`https://www.youtube.com/embed/${id}?autoplay=${autoPlay ? 1 : 0}&mute=${autoPlay ? 1 : 0}&cc_load_policy=1&hl=fr&cc_lang_pref=fr&rel=0`);
        } else if (url.includes('twitch.tv/')) {
            const ch = url.split('twitch.tv/')[1].split('?')[0];
            setPlatform('TWITCH');
            setChannelName(ch);
            setEmbedUrl(`https://player.twitch.tv/?channel=${ch}&parent=${window.location.hostname}&autoplay=${autoPlay}&muted=${autoPlay}`);
        }
        setTimeout(() => setIsTranslating(false), 1000);
    };

    // Radical hide effect: Find and hide ALL fixed elements that are not the Studio
    useEffect(() => {
        if (embedUrl) {
            // Find all elements that might be the Navbar or Marquee
            // Navbar is usually nav, marquee is fixed top-20
            const allElements = document.querySelectorAll('nav, footer, .fixed, .sticky, header');
            allElements.forEach(el => {
                if (!el.contains(document.querySelector('.studio-container')) && el.id !== 'studio-root') {
                    (el as HTMLElement).style.setProperty('display', 'none', 'important');
                }
            });
            document.body.style.overflow = 'hidden';
        } else {
            const allElements = document.querySelectorAll('nav, footer, .fixed, .sticky, header');
            allElements.forEach(el => {
                (el as HTMLElement).style.display = '';
            });
            document.body.style.overflow = '';
        }
        return () => {
            const allElements = document.querySelectorAll('nav, footer, .fixed, .sticky, header');
            allElements.forEach(el => {
                (el as HTMLElement).style.display = '';
            });
            document.body.style.overflow = '';
        };
    }, [embedUrl]);

    return (
        <div id="studio-root" className={twMerge(
            "transition-all duration-700 studio-container",
            embedUrl 
                ? "fixed inset-0 z-[999999999] bg-black flex flex-row overflow-hidden" 
                : "space-y-12 py-10 px-4"
        )}>
            {!embedUrl ? (
                <div className="max-w-3xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-3 px-4 py-1.5 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full">
                            <Zap className="w-3 h-3 text-neon-cyan animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neon-cyan">DROPSIDERS TV STUDIO</span>
                        </motion.div>
                        <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">D-TV <span className="text-neon-cyan">IMMERSION</span></h2>
                    </div>
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan to-purple-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000" />
                        <div className="relative flex flex-col md:flex-row bg-black/60 border border-white/10 rounded-3xl overflow-hidden p-2 backdrop-blur-2xl items-center">
                            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleTranslate()} placeholder="Lien YouTube ou Twitch..." className="flex-1 bg-transparent border-none outline-none px-6 py-3 text-white text-sm font-bold placeholder:text-white/20" />
                            
                            <button 
                                onClick={() => setAutoPlay(!autoPlay)}
                                className={twMerge(
                                    "px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2 mr-2",
                                    autoPlay ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30" : "bg-white/5 text-white/30 border border-white/10"
                                )}
                            >
                                <Play className={twMerge("w-3 h-3", autoPlay && "fill-current")} />
                                Autoplay {autoPlay ? 'ON' : 'OFF'}
                            </button>

                            <button onClick={handleTranslate} disabled={!url || isTranslating} className="px-8 py-3 bg-white text-black font-black uppercase text-[10px] tracking-[0.1em] rounded-2xl hover:bg-neon-cyan transition-all duration-500 shrink-0">LANCER STUDIO</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-full h-full flex flex-row">
                    {/* MAIN PLAYER (70%) */}
                    <div className="flex-1 h-full relative bg-black flex flex-col group min-w-0">
                        <iframe src={embedUrl} className="w-full h-full border-none" allowFullScreen allow="autoplay; encrypted-media" />
                        
                        {/* TOP TOOLBAR */}
                        <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between bg-gradient-to-b from-black/95 to-transparent z-[100]">
                            <div className="flex flex-wrap gap-4 items-center">
                                <button 
                                    onClick={() => { setEmbedUrl(null); setUrl(''); stopVoiceCapture(); }}
                                    className="px-6 py-3 bg-white text-black rounded-2xl border border-white flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-neon-red hover:text-white shadow-[0_15px_40px_rgba(0,0,0,0.5)]"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    QUITTER STUDIO
                                </button>
                                
                                <div className="flex flex-col gap-2 relative">
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={isCapturing ? stopVoiceCapture : startSystemAudioCapture}
                                            className={twMerge(
                                                "px-8 py-4 rounded-2xl border transition-all flex items-center gap-4 text-[12px] font-black uppercase tracking-widest shadow-2xl",
                                                isCapturing ? "bg-neon-red border-neon-red text-white" : "bg-neon-cyan border-neon-cyan text-black hover:scale-105 active:scale-95"
                                            )}
                                        >
                                            <Monitor className={twMerge("w-5 h-5", isCapturing && "animate-pulse")} />
                                            {isCapturing ? "STOP TRADUCTION" : "LANCER TRADUCTION SYSTÈME"}
                                            <div className="flex gap-1.5 ml-2 items-center min-w-[40px] h-5">
                                                {[...Array(6)].map((_, i) => (
                                                    <motion.div key={i} animate={{ height: isCapturing && audioLevel > 2 ? [4, 18, 4] : 4 }} className="w-1.5 bg-white/40 rounded-full" />
                                                ))}
                                            </div>
                                        </button>

                                        <button 
                                            onClick={toggleMonitoring}
                                            disabled={!isCapturing}
                                            className={twMerge(
                                                "p-4 border rounded-2xl transition-all shadow-xl",
                                                isMonitoring ? "bg-neon-purple border-neon-purple text-white" : "bg-white/5 border-white/10 text-white/40 hover:text-white disabled:opacity-20"
                                            )}
                                            title="Écouter le retour (Monitoring)"
                                        >
                                            {isMonitoring ? <Volume2 className="w-6 h-6" /> : <Volume2 className="w-6 h-6 opacity-40" />}
                                        </button>
                                    </div>

                                    {captureError && (
                                        <div className="flex items-center gap-2 text-neon-red text-[8px] font-black uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full border border-neon-red/20">
                                            <AlertTriangle className="w-3 h-3" />
                                            {captureError}
                                        </div>
                                    )}
                                    {isCapturing && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2">
                                            <div className={twMerge(
                                                "flex items-center gap-2 text-[8px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border shadow-2xl",
                                                audioLevel < 2 ? "bg-black/80 text-neon-yellow border-neon-yellow/30" : "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30"
                                            )}>
                                                {audioLevel < 2 ? (
                                                    <>
                                                        <Headphones className="w-3.5 h-3.5 animate-pulse" />
                                                        Pense à cocher "Partager l'audio" dans la fenêtre de capture !
                                                    </>
                                                ) : (
                                                    <>
                                                        <Activity className="w-3.5 h-3.5 animate-pulse" />
                                                        Flux Audio Détecté - Traduction en cours...
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between px-2">
                                                <p className="text-[7px] text-white/40 uppercase font-black tracking-[0.2em] italic">
                                                    {statusStep || (translatedTranscript ? "Traduction Active" : "Écoute du flux...")}
                                                </p>
                                                {audioLevel > 0 && (
                                                    <span className="text-[6px] text-neon-cyan font-black">SIG: {audioLevel}%</span>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SUBTITLES OVERLAY */}
                        <AnimatePresence>
                            {isCapturing && (translatedTranscript || liveTranscript) && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }} 
                                    animate={{ opacity: 1, scale: 1 }} 
                                    exit={{ opacity: 0 }} 
                                    className="absolute bottom-[35%] left-0 right-0 pointer-events-none flex justify-center px-6 z-[200]"
                                >
                                    <div className="text-center max-w-6xl">
                                        <p className="text-white text-4xl md:text-7xl font-black italic tracking-tighter leading-none" style={{ 
                                            textShadow: `
                                                0 0 20px rgba(0,0,0,1),
                                                0 0 40px rgba(0,0,0,1),
                                                0 0 60px rgba(0,0,0,0.8),
                                                2px 2px 0px rgba(0,0,0,1),
                                                -2px -2px 0px rgba(0,0,0,1),
                                                2px -2px 0px rgba(0,0,0,1),
                                                -2px 2px 0px rgba(0,0,0,1)
                                            `
                                        }}>
                                            {translatedTranscript || liveTranscript || "EN ATTENTE..."}
                                        </p>
                                        
                                        {/* Subtle active indicator */}
                                        <div className="mt-8 flex justify-center gap-1">
                                            {[...Array(3)].map((_, i) => (
                                                <motion.div 
                                                    key={i}
                                                    animate={{ opacity: [0.2, 1, 0.2] }}
                                                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                                    className="w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_10px_#00f3ff]"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* SIDEBAR HYBRID (30%) */}
                    <div className="w-[380px] h-full border-l border-white/10 flex flex-col bg-[#050505] relative z-[100] shrink-0">
                        <div className="p-6 border-b border-white/10 bg-black flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MessageSquare className="w-5 h-5 text-neon-cyan" />
                                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white">STUDIO CHAT</h3>
                            </div>
                        </div>
                        
                        {/* Top: AI Translated (45%) */}
                        <div className="h-[45%] overflow-y-auto p-6 space-y-6 custom-scrollbar flex flex-col-reverse border-b border-white/10 bg-black/40">
                            {chatMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-4">
                                    <RefreshCw className="w-10 h-10 animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">SYNC...</p>
                                </div>
                            ) : (
                                chatMessages.map((msg) => (
                                    <motion.div key={msg.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-neon-cyan uppercase tracking-tighter">{msg.user}</span>
                                        </div>
                                        <div className="pl-4 border-l-2 border-white/5">
                                            <p className="text-white text-[14px] font-bold leading-relaxed">{msg.translated || msg.text}</p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Bottom: Native Interact (55%) */}
                        <div className="h-[55%] bg-black relative border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                            {platform === 'TWITCH' ? (
                                <iframe src={`https://www.twitch.tv/embed/${channelName}/chat?parent=${window.location.hostname}&darkpopout`} className="w-full h-full border-none" />
                            ) : (
                                <div className="h-full flex items-center justify-center p-12 opacity-20 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">Twitch Only</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
