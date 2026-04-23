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
    const [savedHistory, setSavedHistory] = useState<{ id: string, name: string, date: string, transcripts: any[] }[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('dropsiders_video_translations') || '[]');
        } catch { return []; }
    });
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const recognitionRef = useRef<any>(null);

    const saveToHistory = () => {
        if (transcripts.length === 0 || !file) return;
        const newEntry = {
            id: Date.now().toString(),
            name: file.name,
            date: new Date().toLocaleString(),
            transcripts: transcripts
        };
        const updated = [newEntry, ...savedHistory].slice(0, 20); // Keep last 20
        setSavedHistory(updated);
        localStorage.setItem('dropsiders_video_translations', JSON.stringify(updated));
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
        if (!videoRef.current) return;
        
        setIsProcessing(true);
        setStatus('PLAYING');
        
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showNotification("Votre navigateur ne supporte pas la reconnaissance vocale.", "error");
            setIsProcessing(false);
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = async (event: any) => {
            const results = event.results;
            const lastResult = results[results.length - 1];
            
            if (lastResult.isFinal) {
                const text = lastResult[0].transcript;
                try {
                    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t&q=${encodeURIComponent(text)}`);
                    const data = await res.json();
                    const translatedText = (data && data[0] && data[0][0] && data[0][0][0]) ? data[0][0][0] : text;
                    
                    setTranscripts(prev => [
                        { 
                            original: text, 
                            translated: translatedText, 
                            timestamp: videoRef.current?.currentTime || 0 
                        },
                        ...prev
                    ]);
                } catch (e) {
                    setTranscripts(prev => [
                        { original: text, translated: "[Erreur de traduction]", timestamp: videoRef.current?.currentTime || 0 },
                        ...prev
                    ]);
                }
            }
        };

        recognitionRef.current.onend = () => {
            if (status === 'PLAYING') {
                recognitionRef.current.start();
            }
        };

        recognitionRef.current.start();
        videoRef.current.play();

        // Audio Level Detection
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const checkVolume = () => {
                if (status === 'PLAYING' || videoRef.current?.paused === false) {
                    analyser.getByteFrequencyData(dataArray);
                    const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
                    setAudioLevel(avg);
                    requestAnimationFrame(checkVolume);
                } else {
                    setAudioLevel(0);
                }
            };
            checkVolume();
        } catch (e) {
            console.error("Audio detection failed", e);
        }
    };

    const stopAnalysis = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        if (videoRef.current) videoRef.current.pause();
        setStatus('DONE');
        setIsProcessing(false);
        saveToHistory(); // Auto-archive on stop
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
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                {status === 'IDLE' || status === 'DONE' ? (
                                    <button 
                                        onClick={startAnalysis}
                                        className="w-16 h-16 bg-neon-cyan text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                                    >
                                        <Play className="w-8 h-8 fill-current" />
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
                        
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-4 h-4 text-neon-yellow" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-neon-yellow/60 leading-relaxed">
                                Note: Pour une analyse optimale, assurez-vous que le son sort sur vos haut-parleurs ou utilisez "Mixage Stéréo".
                            </p>
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
                        
                        <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {transcripts.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-4">
                                        <Loader2 className="w-12 h-12 animate-spin" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Attente de lecture...</p>
                                    </div>
                                )}
                                {transcripts.map((t, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3 group hover:border-neon-cyan/30 transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-neon-cyan/60 uppercase">T + {Math.floor(t.timestamp)}s</span>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all">
                                                    <Download className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-gray-500 leading-relaxed italic">"{t.original}"</p>
                                            <p className="text-sm font-black text-white leading-relaxed">{t.translated}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        
                        <button 
                            onClick={downloadTxt}
                            disabled={transcripts.length === 0}
                            className="w-full mt-6 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-neon-cyan transition-all disabled:opacity-20 flex items-center justify-center gap-3"
                        >
                            <Download className="w-4 h-4" /> EXPORTER EN TEXTE (.TXT)
                        </button>
                    </div>
                </div>
            )}

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
