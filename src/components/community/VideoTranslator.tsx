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
    const [isTestingAudio, setIsTestingAudio] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0); 
    const [captureError, setCaptureError] = useState<string | null>(null);
    const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [showDeviceList, setShowDeviceList] = useState(false);
    const [isMonitoring, setIsMonitoring] = useState(false);
    
    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const monitorNodeRef = useRef<GainNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const displayStreamRef = useRef<MediaStream | null>(null);

    // Audio Visualizer
    const startAudioVisualizer = async () => {
        try {
            if (audioContextRef.current) await audioContextRef.current.close();
            const constraints = { 
                audio: selectedDeviceId 
                    ? { deviceId: { exact: selectedDeviceId }, echoCancellation: false } 
                    : { echoCancellation: false, noiseSuppression: false, autoGainControl: true } 
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 64;
            source.connect(analyserRef.current);

            // Monitoring Node
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
            return true;
        } catch (err) { 
            console.error("Visualizer error", err); 
            setCaptureError("Microphone non autorisé ou introuvable.");
            return false;
        }
    };

    // System Audio Capture (Display Media)
    const startSystemAudioCapture = async () => {
        try {
            setCaptureError(null);
            setStatusStep("Attente autorisation système...");
            
            // Capture screen/tab with audio
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true, // Required for audio capture in most browsers
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            const audioTracks = displayStream.getAudioTracks();
            if (audioTracks.length === 0) {
                displayStream.getTracks().forEach(t => t.stop());
                setCaptureError("Aucun flux audio détecté dans la capture système.");
                return false;
            }

            // Hide the video track if any (we only want audio)
            displayStream.getVideoTracks().forEach(t => t.enabled = false);
            
            displayStreamRef.current = displayStream;
            
            // Re-use existing visualizer logic but with the new stream
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
            
            // Start the actual voice recognition on this audio stream
            startRecognitionWithStream(displayStream);
            return true;
        } catch (err) {
            console.error("System capture error", err);
            setCaptureError("Capture système annulée ou refusée.");
            return false;
        }
    };

    const startRecognitionWithStream = (stream: MediaStream) => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        setStatusStep("Démarrage de l'IA (Système)...");
        setIsCapturing(true);

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = async (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    const text = event.results[i][0].transcript;
                    setLiveTranscript(text);
                    try {
                        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t&q=${encodeURIComponent(text)}`);
                        const data = await res.json();
                        if (data && data[0] && data[0][0] && data[0][0][0]) {
                            setTranslatedTranscript(data[0][0][0]);
                        }
                    } catch (e) {}
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            if (interimTranscript) setLiveTranscript(interimTranscript);
        };

        recognitionRef.current.onerror = (e: any) => {
            console.error("System recognition error", e.error);
            stopVoiceCapture();
        };

        recognitionRef.current.start();
    };
    useEffect(() => {
        const getDevices = async () => {
            try {
                // Request temporary access to unlock device labels (Chrome/Opera security)
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(t => t.stop()); // Stop immediately
                
                const devices = await navigator.mediaDevices.enumerateDevices();
                setAvailableDevices(devices.filter(d => d.kind === 'audioinput'));
            } catch (e) {
                console.error("Device list error", e);
                // Fallback to basic list if blocked
                const devices = await navigator.mediaDevices.enumerateDevices();
                setAvailableDevices(devices.filter(d => d.kind === 'audioinput'));
            }
        };
        getDevices();
        navigator.mediaDevices.ondevicechange = getDevices;
    }, []);

    const stopAudioVisualizer = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        setAudioLevel(0);
    };

    const startVoiceCapture = async () => {
        setCaptureError(null);
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setCaptureError("Votre navigateur ne supporte pas la reconnaissance vocale.");
            return;
        }

        setStatusStep("Initialisation Micro...");
        const visualizerStarted = await startAudioVisualizer();
        if (!visualizerStarted) {
            setStatusStep("Erreur Micro");
            return;
        }

        setStatusStep("Démarrage de l'IA...");
        setIsCapturing(true);

        try {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onstart = () => {
                setIsCapturing(true);
                setCaptureError(null);
            };

            recognitionRef.current.onresult = async (event: any) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        const text = event.results[i][0].transcript;
                        setLiveTranscript(text);
                        try {
                            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t&q=${encodeURIComponent(text)}`);
                            const data = await res.json();
                            if (data && data[0] && data[0][0] && data[0][0][0]) {
                                setTranslatedTranscript(data[0][0][0]);
                            }
                        } catch (e) {
                            console.error("Translation error", e);
                        }
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                if (interimTranscript) {
                    setLiveTranscript(interimTranscript);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Recognition error", event.error);
                if (event.error === 'not-allowed') {
                    setCaptureError("Permission micro refusée.");
                } else {
                    setCaptureError(`Erreur: ${event.error}`);
                }
                stopVoiceCapture();
            };

            recognitionRef.current.onend = () => { 
                if (isCapturing) {
                    try { recognitionRef.current.start(); } catch (e) {}
                } 
            };

            recognitionRef.current.start();
        } catch (err) {
            console.error("Failed to start recognition", err);
            setCaptureError("Impossible de démarrer la capture.");
            stopVoiceCapture();
        }
    };

    const testAudioInput = async () => {
        if (isTestingAudio) return;
        setIsTestingAudio(true);
        setStatusStep("Enregistrement test (1s)...");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true 
            });
            const mediaRecorder = new MediaRecorder(stream);
            const chunks: Blob[] = [];
            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/wav' });
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audio.play();
                setStatusStep("Test terminé (Lecture)");
                setTimeout(() => { setIsTestingAudio(false); setStatusStep(""); }, 2000);
            };
            mediaRecorder.start();
            setTimeout(() => mediaRecorder.stop(), 1000);
        } catch (e) {
            setCaptureError("Erreur Test: Micro introuvable");
            setIsTestingAudio(false);
        }
    };

    const stopVoiceCapture = () => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) {}
        }
        setIsCapturing(false);
        setLiveTranscript('');
        setTranslatedTranscript('');
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
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
                                            onClick={isCapturing ? stopVoiceCapture : startVoiceCapture}
                                            className={twMerge(
                                                "px-6 py-3 rounded-2xl border transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-2xl",
                                                isCapturing ? "bg-neon-red border-neon-red text-white" : "bg-neon-cyan border-neon-cyan text-black hover:scale-105 active:scale-95"
                                            )}
                                        >
                                            <Mic className={twMerge("w-4 h-4", isCapturing && "animate-pulse")} />
                                            {isCapturing ? "STOP CAPTURE" : "TRADUCTION VOCALE"}
                                            <div className="flex gap-1 ml-2 items-center min-w-[30px] h-4">
                                                {[...Array(5)].map((_, i) => (
                                                    <motion.div key={i} animate={{ height: isCapturing && audioLevel > 2 ? [4, 15, 4] : 4 }} className="w-1 bg-white/40 rounded-full" />
                                                ))}
                                            </div>
                                        </button>

                                        <button 
                                            onClick={() => setShowDeviceList(!showDeviceList)}
                                            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                            title="Changer de source audio"
                                        >
                                            <Settings className="w-5 h-5" />
                                        </button>

                                        <button 
                                            onClick={toggleMonitoring}
                                            disabled={!isCapturing}
                                            className={twMerge(
                                                "p-3 border rounded-2xl transition-all shadow-xl",
                                                isMonitoring ? "bg-neon-purple border-neon-purple text-white" : "bg-white/5 border-white/10 text-white/40 hover:text-white disabled:opacity-20"
                                            )}
                                            title="Écouter le retour (Monitoring)"
                                        >
                                            {isMonitoring ? <Volume2 className="w-5 h-5" /> : <Volume2 className="w-5 h-5 opacity-40" />}
                                        </button>

                                        <button 
                                            onClick={testAudioInput}
                                            disabled={isCapturing || isTestingAudio}
                                            className={twMerge(
                                                "px-4 py-3 border rounded-2xl transition-all text-[9px] font-black uppercase tracking-widest",
                                                isTestingAudio ? "bg-neon-yellow text-black border-neon-yellow" : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-20"
                                            )}
                                        >
                                            {isTestingAudio ? "TEST..." : "TEST MICRO"}
                                        </button>

                                        <button 
                                            onClick={startSystemAudioCapture}
                                            disabled={isCapturing}
                                            className="px-6 py-3 bg-neon-purple/20 border border-neon-purple/40 text-neon-purple rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-neon-purple hover:text-white shadow-xl"
                                        >
                                            <Monitor className="w-4 h-4" />
                                            CAPTURE SYSTÈME
                                        </button>
                                    </div>

                                    {/* Device Selector Dropdown */}
                                    <AnimatePresence>
                                        {showDeviceList && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full left-0 mt-2 w-72 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 z-[200] shadow-2xl">
                                                <div className="p-3 border-b border-white/5 mb-2">
                                                    <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Source Audio</p>
                                                </div>
                                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                    {availableDevices.map(d => (
                                                        <button 
                                                            key={d.deviceId} 
                                                            onClick={() => { setSelectedDeviceId(d.deviceId); setShowDeviceList(false); if (isCapturing) { stopVoiceCapture(); startVoiceCapture(); } }}
                                                            className={twMerge(
                                                                "w-full text-left p-3 rounded-xl text-[10px] font-bold uppercase truncate transition-all",
                                                                selectedDeviceId === d.deviceId ? "bg-neon-cyan/20 text-neon-cyan" : "text-white/60 hover:bg-white/5 hover:text-white"
                                                            )}
                                                        >
                                                            {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    
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
                                                        {selectedDeviceId.includes('B2') ? 'Son trop faible sur B2 ?' : 'Sélectionne "Voicemeeter B2" via ⚙️'}
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
                                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-20 left-0 right-0 pointer-events-none flex justify-center px-12 z-[100]">
                                    <div className="bg-black/90 backdrop-blur-3xl px-12 py-6 rounded-[3rem] border border-neon-cyan/30 text-center max-w-4xl shadow-[0_40px_100px_rgba(0,0,0,1)]">
                                        <p className="text-white text-2xl md:text-5xl font-black italic tracking-tighter leading-tight">"{translatedTranscript || "Écoute du flux audio..."}"</p>
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
