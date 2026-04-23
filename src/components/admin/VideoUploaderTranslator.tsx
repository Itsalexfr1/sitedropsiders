import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileVideo, Languages, Play, Pause, RotateCcw, Download, CheckCircle2, AlertCircle, Loader2, MessageSquare, Trash2, Mic } from 'lucide-react';
import { useUser } from "../../context/UserContext";
import { twMerge } from 'tailwind-merge';

export function VideoUploaderTranslator() {
    const { showNotification } = useUser();
    const [file, setFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcripts, setTranscripts] = useState<{ original: string, translated: string, timestamp: number }[]>([]);
    const [status, setStatus] = useState<'IDLE' | 'PLAYING' | 'DONE'>('IDLE');
    const [progress, setProgress] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);
    const [captureError, setCaptureError] = useState<string | null>(null);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [statusStep, setStatusStep] = useState("");
    const [savedHistory, setSavedHistory] = useState<{ id: string, name: string, date: string, transcripts: any[] }[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('dropsiders_video_archives') || '[]');
        } catch { return []; }
    });
    const [archiveName, setArchiveName] = useState("");
    const [showArchivePrompt, setShowArchivePrompt] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const displayStreamRef = useRef<MediaStream | null>(null);

    const saveToArchive = () => {
        if (transcripts.length === 0) return;
        const finalName = archiveName.trim() || file?.name || "Sans titre";
        const newEntry = {
            id: Date.now().toString(),
            name: finalName,
            date: new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            transcripts: transcripts
        };
        const updated = [newEntry, ...savedHistory].slice(0, 50); // Keep last 50
        setSavedHistory(updated);
        localStorage.setItem('dropsiders_video_archives', JSON.stringify(updated));
        setShowArchivePrompt(false);
        setArchiveName("");
        showNotification("Traduction archivée avec succès !", "success");
    };

    const downloadTxt = () => {
        if (transcripts.length === 0) return;
        const content = transcripts
            .map(t => `[${Math.floor(t.timestamp)}s]\nEN: ${t.original}\nFR: ${t.translated}\n`)
            .reverse()
            .join('\n---\n\n');
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `translation-${file?.name || 'video'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const deleteHistoryItem = (id: string) => {
        const updated = savedHistory.filter(h => h.id !== id);
        setSavedHistory(updated);
        localStorage.setItem('dropsiders_video_translations', JSON.stringify(updated));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type.startsWith('video/')) {
            setFile(selectedFile);
            setVideoUrl(URL.createObjectURL(selectedFile));
            setTranscripts([]);
            setStatus('IDLE');
        }
    };

    const startAnalysis = async () => {
        try {
            if (!videoRef.current) return;
            setCaptureError(null);
            setStatusStep("Extraction Audio...");

            // THE STABLE WAY: Capture stream directly from the video element
            // No screen sharing needed!
            let stream: MediaStream;
            if ((videoRef.current as any).captureStream) {
                stream = (videoRef.current as any).captureStream();
            } else if ((videoRef.current as any).mozCaptureStream) {
                stream = (videoRef.current as any).mozCaptureStream();
            } else {
                // Fallback to DisplayMedia if captureStream is not supported (unlikely in modern Chrome)
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
                });
            }

            displayStreamRef.current = stream;
            setIsProcessing(true);
            setStatus('PLAYING');

            if (audioContextRef.current) await audioContextRef.current.close();
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 64;
            source.connect(analyserRef.current);

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
            
            startRecognition();
            videoRef.current.play();
        } catch (err) {
            console.error("Analysis error", err);
            setCaptureError("Erreur lors du démarrage de l'analyse.");
        }
    };

    const startRecognition = async () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        setStatusStep("Initialisation IA...");
        
        try {
            // Pre-warm the engine
            const dummy = await navigator.mediaDevices.getUserMedia({ audio: true });
            dummy.getTracks().forEach(t => t.stop());
        } catch (e) {}

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = async (event: any) => {
            const lastResult = event.results[event.results.length - 1];
            if (lastResult.isFinal) {
                const text = lastResult[0].transcript;
                try {
                    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t&q=${encodeURIComponent(text)}`);
                    const data = await res.json();
                    const translatedText = (data && data[0] && data[0][0] && data[0][0][0]) ? data[0][0][0] : text;
                    setTranscripts(prev => [{ original: text, translated: translatedText, timestamp: videoRef.current?.currentTime || 0 }, ...prev]);
                } catch (e) {}
            }
        };

        recognitionRef.current.onend = () => {
            if (isProcessing) {
                try { recognitionRef.current.start(); } catch (e) {}
            }
        };

        recognitionRef.current.start();
    };

    const stopAnalysis = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        if (videoRef.current) videoRef.current.pause();
        if (displayStreamRef.current) displayStreamRef.current.getTracks().forEach(t => t.stop());
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        setStatus('DONE');
        setIsProcessing(false);
        setShowArchivePrompt(true);
    };

    const reset = () => {
        setFile(null);
        setVideoUrl(null);
        setTranscripts([]);
        setStatus('IDLE');
        setProgress(0);
        setIsProcessing(false);
    };

    return (
        <div className="space-y-8 p-6 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-neon-cyan/10 rounded-2xl border border-neon-cyan/20">
                        <Languages className="w-6 h-6 text-neon-cyan" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">AI Video <span className="text-neon-cyan">Translator</span></h2>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Transcription & Traduction Automatique (EN → FR)</p>
                    </div>
                </div>
                {file && (
                    <button onClick={reset} className="p-2 hover:bg-neon-red/10 text-gray-500 hover:text-neon-red transition-all">
                        <Trash2 className="w-5 h-5" />
                    </button>
                )}
            </div>

            {!file ? (
                <div className="relative group">
                    <input 
                        type="file" 
                        accept="video/mp4,video/x-m4v,video/*" 
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-white/10 rounded-[2rem] p-12 flex flex-col items-center justify-center space-y-6 transition-all group-hover:border-neon-cyan/30 bg-white/5">
                        <div className="w-20 h-20 bg-neon-cyan/10 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="w-10 h-10 text-neon-cyan" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-sm font-black uppercase text-white">Glisse ton fichier MP4 ici</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Format MP4 recommandé • Max 500Mo</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Preview Section */}
                    <div className="space-y-6">
                        <div className="relative aspect-video bg-black rounded-[2rem] overflow-hidden border border-white/10 group">
                            <video 
                                ref={videoRef}
                                src={videoUrl || ''} 
                                className="w-full h-full object-contain"
                                onEnded={stopAnalysis}
                                onTimeUpdate={() => {
                                    if (videoRef.current && videoRef.current.duration > 0) {
                                        const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
                                        setProgress(p);
                                    }
                                }}
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                {status === 'IDLE' || status === 'DONE' ? (
                                    <button 
                                        onClick={startAnalysis}
                                        className="px-8 py-4 bg-neon-cyan text-black rounded-2xl font-black uppercase text-[12px] flex items-center gap-3 hover:scale-105 transition-all shadow-2xl"
                                    >
                                        <Play className="w-5 h-5 fill-current" />
                                        LANCER ANALYSE AUTOMATIQUE
                                    </button>
                                ) : (
                                    <button 
                                        onClick={stopAnalysis}
                                        className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                                    >
                                        <Pause className="w-8 h-8 fill-current" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Statut de l'Analyse</h3>
                            <div className="flex items-center gap-4">
                                <div className={twMerge(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest",
                                    status === 'PLAYING' ? "bg-neon-cyan/20 text-neon-cyan animate-pulse" : 
                                    status === 'DONE' ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/40"
                                )}>
                                    {status === 'PLAYING' && <Loader2 className="w-3 h-3 animate-spin" />}
                                    {status === 'DONE' && <CheckCircle2 className="w-3 h-3" />}
                                    {status === 'IDLE' ? 'PRÊT POUR ANALYSE' : status === 'PLAYING' ? `ANALYSE : ${Math.floor(progress)}%` : 'ANALYSE TERMINÉE'}
                                    
                                    {status === 'PLAYING' && (
                                        <div className="flex gap-0.5 ml-3 items-center h-3">
                                            {[...Array(4)].map((_, i) => (
                                                <motion.div 
                                                    key={i} 
                                                    animate={{ height: audioLevel > 2 ? [2, 10, 2] : 2 }} 
                                                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                                    className="w-0.5 bg-neon-cyan rounded-full" 
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase">{file.name}</p>
                            </div>
                            {status === 'PLAYING' && (
                                <div className="space-y-2 mt-2">
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className="h-full bg-gradient-to-r from-neon-cyan to-blue-500 shadow-[0_0_10px_rgba(0,255,255,0.3)]"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-3 bg-neon-cyan/5 p-4 rounded-2xl border border-neon-cyan/20">
                            <div className="p-2 bg-neon-cyan/10 rounded-lg">
                                <Mic className="w-4 h-4 text-neon-cyan" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase text-white">Astuce Voicemeeter</p>
                                <p className="text-[9px] text-gray-400 font-bold leading-relaxed">
                                    Si le son bouge mais aucun texte ne sort : règle ton **Microphone par défaut** sur <span className="text-neon-cyan">"Voicemeeter Output"</span> dans les paramètres de ton navigateur.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {captureError ? (
                                <div className="flex items-center gap-2 text-neon-red text-[9px] font-black uppercase">
                                    <AlertCircle className="w-4 h-4" />
                                    {captureError}
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-neon-cyan" />
                                    <p className="text-[9px] font-black uppercase tracking-widest text-neon-cyan/60 leading-relaxed">
                                        Analyse Directe : Flux audio détecté ({Math.floor(audioLevel)}%).
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="flex flex-col h-[500px]">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-neon-cyan" />
                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Résultats (EN → FR)</h3>
                            </div>
                            <span className="text-[9px] font-black text-white/40 uppercase bg-white/5 px-2 py-1 rounded-full">{transcripts.length} BLOCS</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar bg-black/20 rounded-2xl p-4 border border-white/5">
                            <AnimatePresence mode="popLayout">
                                {transcripts.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-4">
                                        <Loader2 className="w-12 h-12 animate-spin" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Prêt à analyser...</p>
                                    </div>
                                )}
                                {transcripts.map((t, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-4 bg-white/[0.03] border-l-2 border-neon-cyan space-y-1 group transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-[8px] font-black text-neon-cyan/40 uppercase">[{Math.floor(t.timestamp)}s]</span>
                                            <p className="text-[10px] font-bold text-gray-500 italic">"{t.original}"</p>
                                        </div>
                                        <p className="text-[13px] font-black text-white leading-relaxed">{t.translated}</p>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <button 
                                onClick={downloadTxt}
                                disabled={transcripts.length === 0}
                                className="py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-20 flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" /> TEXTE (.TXT)
                            </button>
                            <button 
                                onClick={() => setShowArchivePrompt(true)}
                                disabled={transcripts.length === 0}
                                className="py-4 bg-neon-cyan text-black rounded-2xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-20 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,255,0.2)]"
                            >
                                <CheckCircle2 className="w-4 h-4" /> ARCHIVER LA VIDÉO
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Archive Prompt Modal */}
            <AnimatePresence>
                {showArchivePrompt && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] p-10 space-y-8 shadow-2xl"
                        >
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-neon-cyan/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-neon-cyan/20">
                                    <Languages className="w-8 h-8 text-neon-cyan" />
                                </div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Archiver la <span className="text-neon-cyan">traduction</span></h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Donne un nom à cette session</p>
                            </div>

                            <input 
                                type="text"
                                placeholder="ex: Interview de Drake"
                                value={archiveName}
                                onChange={(e) => setArchiveName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-neon-cyan outline-none transition-all text-center"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && saveToArchive()}
                            />

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={saveToArchive}
                                    className="w-full py-4 bg-neon-cyan text-black rounded-full font-black uppercase text-xs tracking-widest shadow-[0_0_30px_rgba(0,255,255,0.3)] hover:scale-105 transition-all"
                                >
                                    Confirmer l'archivage
                                </button>
                                <button 
                                    onClick={() => setShowArchivePrompt(false)}
                                    className="w-full py-4 bg-white/5 text-gray-500 rounded-full font-black uppercase text-xs tracking-widest hover:text-white transition-all"
                                >
                                    Annuler
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* History Section */}
            {savedHistory.length > 0 && (
                <div className="pt-12 border-t border-white/5 space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <RotateCcw className="w-5 h-5 text-neon-purple" />
                        <h3 className="text-xl font-display font-black text-white uppercase italic">Historique <span className="text-neon-purple">des Archives</span></h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {savedHistory.map((item) => (
                            <div key={item.id} className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl hover:border-white/20 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => deleteHistoryItem(item.id)}
                                        className="p-2 bg-neon-red/10 text-neon-red rounded-xl hover:bg-neon-red hover:text-white transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <FileVideo className="w-5 h-5 text-neon-purple" />
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-black text-white uppercase truncate">{item.name}</p>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase">{item.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-[9px] font-black text-white/30 uppercase">{item.transcripts.length} segments</span>
                                        <button 
                                            onClick={() => {
                                                setTranscripts(item.transcripts);
                                                // We can't set the file but we can show the results
                                                setFile({ name: item.name } as any); 
                                                setStatus('DONE');
                                            }}
                                            className="text-[9px] font-black text-neon-purple uppercase hover:underline"
                                        >
                                            Charger
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
