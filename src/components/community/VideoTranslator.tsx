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
    const [audioLevel, setAudioLevel] = useState(0); 
    
    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Robust Audio Visualizer
    const startAudioVisualizer = async () => {
        try {
            // Stop previous if exists
            if (audioContextRef.current) await audioContextRef.current.close();
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                } 
            });
            streamRef.current = stream;
            
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 128;
            source.connect(analyserRef.current);

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateLevel = () => {
                if (analyserRef.current) {
                    analyserRef.current.getByteFrequencyData(dataArray);
                    let sum = 0;
                    for (let i = 0; i < bufferLength; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / bufferLength;
                    setAudioLevel(average); 
                    animationFrameRef.current = requestAnimationFrame(updateLevel);
                }
            };
            updateLevel();
        } catch (err) {
            console.error("Audio detection failed:", err);
            alert("Erreur de capture audio. Vérifiez vos permissions micro.");
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
        if (!SpeechRecognition) {
            alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
            return;
        }

        // Must start audio visualizer first (requires user gesture)
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

        recognitionRef.current.onerror = (e: any) => {
            console.error("Recognition error", e.error);
            if (e.error === 'no-speech') return; // Ignore silent errors
            stopVoiceCapture();
        };

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
        <div className={twMerge(
            "transition-all duration-700",
            embedUrl ? "fixed inset-0 z-[1000] bg-black flex flex-col lg:flex-row" : "space-y-12 py-10 px-4"
        )}>
            {/* SEARCH / LANDING MODE */}
            {!embedUrl && (
                <>
                    <div className="text-center space-y-4 max-w-3xl mx-auto px-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-3 px-4 py-1.5 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full">
                            <Activity className="w-3 h-3 text-neon-cyan animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neon-cyan">DROPSIDERS FULL-IMMERSION</span>
                        </motion.div>
                        <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
                            D-TV <span className="text-neon-cyan drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]">STUDIO</span>
                        </h2>
                    </div>

                    <div className="max-w-2xl mx-auto px-4">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan via-neon-blue to-purple-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000" />
                            <div className="relative flex flex-col md:flex-row bg-black/60 border border-white/10 rounded-3xl overflow-hidden p-2 backdrop-blur-2xl">
                                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleTranslate()} placeholder="Lien YouTube ou Twitch..." className="flex-1 bg-transparent border-none outline-none px-6 py-3 text-white text-sm font-bold placeholder:text-white/20" />
                                <button onClick={handleTranslate} disabled={!url || isTranslating} className="px-8 py-3 bg-white text-black font-black uppercase text-[10px] tracking-[0.1em] rounded-2xl hover:bg-neon-cyan transition-all duration-500 shrink-0">
                                    {isTranslating ? 'SYNC...' : 'LANCER STUDIO'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* FULLSCREEN STUDIO MODE (80/20) */}
            <AnimatePresence>
                {embedUrl && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex flex-col lg:flex-row">
                        {/* MAIN PLAYER (80%) */}
                        <div className="lg:w-[80%] h-full relative bg-black flex flex-col group">
                            <iframe src={embedUrl} className="w-full h-full border-none" allowFullScreen allow="autoplay; encrypted-media" />
                            
                            {/* Top Interface Overlay */}
                            <div className="absolute top-8 left-8 right-8 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-y-2 group-hover:translate-y-0">
                                <div className="flex gap-4">
                                    <div className="bg-black/80 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_10px_#00ffff]" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white">80/20 FULL-STUDIO ACTIVE</span>
                                    </div>
                                    <div className="flex bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                                        <button 
                                            onClick={isCapturing ? stopVoiceCapture : startVoiceCapture}
                                            className={twMerge(
                                                "px-5 py-2.5 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                                                isCapturing ? "bg-neon-red/20 text-neon-red" : "bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan hover:text-black"
                                            )}
                                        >
                                            <Mic className={twMerge("w-3.5 h-3.5", isCapturing && "animate-pulse")} />
                                            {isCapturing ? "STOP CAPTURE" : "LIER AUDIO WINDOWS"}
                                        </button>
                                        
                                        {/* REAL-TIME AUDIO SONAR */}
                                        {isCapturing && (
                                            <div className="px-5 flex items-center gap-1.5 bg-black/40 border-l border-white/5 min-w-[100px]">
                                                {[...Array(8)].map((_, i) => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{ 
                                                            height: audioLevel > 5 ? [4, Math.random() * (audioLevel / 3) + 6, 4] : 4,
                                                            backgroundColor: audioLevel > 15 ? "#00ffff" : "#444"
                                                        }}
                                                        className="w-1 rounded-full shadow-[0_0_5px_rgba(0,255,255,0.2)]"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => { setEmbedUrl(null); setUrl(''); stopVoiceCapture(); }} className="p-4 bg-neon-red/20 hover:bg-neon-red text-neon-red hover:text-white rounded-2xl border border-neon-red/20 transition-all shadow-2xl">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* DYNAMIC SUBTITLES */}
                            <AnimatePresence>
                                {(isCapturing && (translatedTranscript || liveTranscript)) && (
                                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute bottom-16 left-0 right-0 pointer-events-none flex justify-center px-12">
                                        <div className="bg-black/90 backdrop-blur-2xl px-10 py-5 rounded-[2.5rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] text-center max-w-4xl">
                                            <div className="flex items-center gap-3 justify-center mb-3">
                                                <Activity className="w-4 h-4 text-neon-cyan animate-pulse" />
                                                <span className="text-[8px] font-black uppercase text-neon-cyan tracking-[0.5em]">NEURAL VOICE TRANSLATION</span>
                                            </div>
                                            <p className="text-white text-xl md:text-3xl font-bold italic leading-tight drop-shadow-2xl">
                                                "{translatedTranscript || "Capture audio Windows en cours..."}"
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* SIDEBAR CHAT (20%) */}
                        <div className="lg:w-[20%] min-w-[320px] border-l border-white/10 flex flex-col bg-[#050505] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                            <div className="p-6 border-b border-white/5 flex flex-col gap-5 bg-black/40">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <MessageSquare className="w-5 h-5 text-neon-cyan" />
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">STUDIO CHAT</h3>
                                    </div>
                                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                                        <button onClick={() => setChatMode('AI')} className={twMerge("px-4 py-2 rounded-lg text-[9px] font-black transition-all", chatMode === 'AI' ? "bg-neon-cyan text-black shadow-[0_0_15px_#00ffff]" : "text-white/40 hover:text-white")}>IA</button>
                                        <button onClick={() => setChatMode('NATIVE')} className={twMerge("px-4 py-2 rounded-lg text-[9px] font-black transition-all", chatMode === 'NATIVE' ? "bg-neon-blue text-white shadow-[0_0_15px_#0055ff]" : "text-white/40 hover:text-white")}>CHAT</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-hidden relative">
                                {chatMode === 'AI' ? (
                                    <div className="h-full overflow-y-auto p-6 space-y-5 custom-scrollbar flex flex-col-reverse">
                                        {chatMessages.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center opacity-10 p-10 space-y-4">
                                                <RefreshCw className="w-8 h-8 animate-spin" />
                                                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Connexion au flux Twitch...</p>
                                            </div>
                                        ) : (
                                            chatMessages.map((msg) => (
                                                <motion.div key={msg.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-[12px] leading-relaxed group">
                                                    <span className="font-black text-neon-cyan uppercase tracking-tighter mr-2 block mb-0.5">{msg.user}:</span>
                                                    <span className="text-white/90 font-medium block pl-2 border-l-2 border-white/5 group-hover:border-neon-cyan transition-colors">{msg.translated || msg.text}</span>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    <iframe src={`https://www.twitch.tv/embed/${channelName}/chat?parent=${window.location.hostname}&darkpopout`} className="w-full h-full border-none" />
                                )}
                            </div>

                            <div className="p-6 bg-black/60 border-t border-white/5">
                                <div className="flex items-center justify-center gap-3 text-[9px] font-black text-white/10 uppercase tracking-[0.4em] italic">
                                    <Zap className="w-3 h-3" /> DROPSIDERS TECH
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
