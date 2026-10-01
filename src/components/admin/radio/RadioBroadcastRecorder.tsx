import React, { useState, useEffect, useRef } from 'react';
import { 
    Disc, 
    Play, 
    Pause, 
    Square, 
    Download, 
    Trash2, 
    Volume2, 
    Clock, 
    Radio, 
    Sparkles, 
    Mic, 
    FileAudio,
    HardDrive,
    AlertCircle
} from 'lucide-react';
import type { RecordedRadioShow } from '../../../types/radioDedications';

const RECORDED_SHOWS_KEY = 'dropsiders_radio_recorded_shows';

interface RadioBroadcastRecorderProps {
    micStream?: MediaStream | null;
    currentShowTitle?: string;
}

export function RadioBroadcastRecorder({
    micStream,
    currentShowTitle = 'Émission Dropsiders Radio Live'
}: RadioBroadcastRecorderProps) {
    const [status, setStatus] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
    const [recordDuration, setRecordDuration] = useState<number>(0);
    const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [audioLevel, setAudioLevel] = useState<number>(0);
    const [showTitleInput, setShowTitleInput] = useState<string>('');

    const [savedShows, setSavedShows] = useState<RecordedRadioShow[]>(() => {
        try {
            const raw = localStorage.getItem(RECORDED_SHOWS_KEY);
            if (raw) return JSON.parse(raw);
        } catch {}
        return [];
    });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Chargement initial du titre suggéré
    useEffect(() => {
        if (!showTitleInput) {
            const now = new Date();
            const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
            setShowTitleInput(`${currentShowTitle} · ${dateStr}`);
        }
    }, [currentShowTitle]);

    // Format mm:ss ou hh:mm:ss
    const formatDuration = (totalSec: number) => {
        const hrs = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;
        if (hrs > 0) {
            return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Démarrage de l'enregistrement
    const handleStartRecording = async () => {
        try {
            // Obtenir une source audio : soit le micStream actif, soit capture micro/tab
            let streamToRecord = micStream;
            if (!streamToRecord) {
                streamToRecord = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            }

            // Configuration AudioContext pour analyse du VU-mètre
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioCtx();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(streamToRecord);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateMeter = () => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                setAudioLevel(Math.min(100, Math.round((sum / dataArray.length / 128) * 100)));
                animFrameRef.current = requestAnimationFrame(updateMeter);
            };
            updateMeter();

            // Déterminer le type MIME supporté
            let mimeType = 'audio/webm;codecs=opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
                else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
                else mimeType = '';
            }

            const recorder = new MediaRecorder(streamToRecord, mimeType ? { mimeType } : undefined);
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const finalBlob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
                setRecordedBlob(finalBlob);
                const url = URL.createObjectURL(finalBlob);
                setRecordedBlobUrl(url);
                setStatus('stopped');
                if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
                setAudioLevel(0);
            };

            recorder.start(1000);
            mediaRecorderRef.current = recorder;
            setStatus('recording');
            setRecordDuration(0);

            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = setInterval(() => {
                setRecordDuration(prev => prev + 1);
            }, 1000);
        } catch (err: any) {
            alert('Impossible de démarrer l\'enregistrement : ' + (err.message || 'accès micro requis'));
        }
    };

    const handlePauseRecording = () => {
        if (mediaRecorderRef.current && status === 'recording') {
            mediaRecorderRef.current.pause();
            setStatus('paused');
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
    };

    const handleResumeRecording = () => {
        if (mediaRecorderRef.current && status === 'paused') {
            mediaRecorderRef.current.resume();
            setStatus('recording');
            timerIntervalRef.current = setInterval(() => {
                setRecordDuration(prev => prev + 1);
            }, 1000);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && (status === 'recording' || status === 'paused')) {
            mediaRecorderRef.current.stop();
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
    };

    // Télécharger le fichier enregistré
    const handleDownload = () => {
        if (!recordedBlobUrl) return;
        const a = document.createElement('a');
        a.href = recordedBlobUrl;
        const sanitizedTitle = (showTitleInput || 'emission_dropsiders').replace(/[^a-zA-Z0-9_-]/g, '_');
        a.download = `${sanitizedTitle}_${new Date().toISOString().slice(0, 10)}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Sauvegarder dans la médiathèque locale des replays
    const handleSaveToLibrary = () => {
        if (!recordedBlob || !recordedBlobUrl) return;

        const sizeMb = (recordedBlob.size / (1024 * 1024)).toFixed(1);
        const newShow: RecordedRadioShow = {
            id: 'rec-' + Date.now(),
            title: showTitleInput.trim() || 'Émission Live Sans Titre',
            date: new Date().toLocaleDateString('fr-FR'),
            durationSeconds: recordDuration,
            fileBlobUrl: recordedBlobUrl,
            fileSizeFormatted: `${sizeMb} Mo`,
            mimeType: recordedBlob.type || 'audio/webm',
            timestamp: Date.now()
        };

        const updated = [newShow, ...savedShows];
        setSavedShows(updated);
        try {
            // Note: le blob URL n'est conservé que pour la session, on sauvegarde les métadonnées
            localStorage.setItem(RECORDED_SHOWS_KEY, JSON.stringify(updated.map(s => ({ ...s, fileBlobUrl: undefined }))));
        } catch {}
    };

    const handleDeleteSavedShow = (id: string) => {
        const updated = savedShows.filter(s => s.id !== id);
        setSavedShows(updated);
        try {
            localStorage.setItem(RECORDED_SHOWS_KEY, JSON.stringify(updated));
        } catch {}
    };

    return (
        <div className="rounded-3xl bg-[#0b0d14]/95 border border-white/10 shadow-2xl p-5 flex flex-col justify-between space-y-6">
            {/* En-tête */}
            <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className={`p-2.5 rounded-2xl border flex items-center justify-center transition-all ${
                            status === 'recording'
                                ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse'
                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}>
                            <Disc className={`w-5 h-5 ${status === 'recording' ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm sm:text-base font-display font-black text-white uppercase italic tracking-tight">
                                    Enregistreur d'Émission (Podcast / Replay)
                                </h3>
                                {status === 'recording' && (
                                    <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-mono text-[9px] font-black uppercase tracking-wider animate-pulse">
                                        ● REC DIRECT
                                    </span>
                                )}
                            </div>
                            <p className="text-[9px] font-mono text-gray-400">
                                Capturez vos sets et interventions en direct pour export podcast ou archivage
                            </p>
                        </div>
                    </div>
                </div>

                {/* Champ Titre de l'émission */}
                <div className="mb-4">
                    <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                        Nom de l'enregistrement / Podcast
                    </label>
                    <input
                        type="text"
                        value={showTitleInput}
                        onChange={e => setShowTitleInput(e.target.value)}
                        placeholder="Ex: Dropsiders Bassline Show #12"
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs font-sans text-white focus:outline-none focus:border-red-500"
                    />
                </div>

                {/* HUD Central d'Enregistrement */}
                <div className={`p-5 rounded-2xl border text-center transition-all ${
                    status === 'recording'
                        ? 'bg-gradient-to-b from-red-950/40 via-black to-red-950/20 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                        : status === 'paused'
                        ? 'bg-amber-950/30 border-amber-500/40'
                        : 'bg-black/40 border-white/10'
                }`}>
                    {/* Horloge / Chrono REC */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                        {status === 'recording' && (
                            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                        )}
                        <span className={`text-4xl sm:text-5xl font-mono font-black tracking-widest ${
                            status === 'recording' ? 'text-red-400' : status === 'paused' ? 'text-amber-400' : 'text-gray-400'
                        }`}>
                            {formatDuration(recordDuration)}
                        </span>
                    </div>

                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                        {status === 'recording' ? 'Enregistrement en direct de l\'antenne' : status === 'paused' ? 'Enregistrement en pause' : status === 'stopped' ? 'Enregistrement terminé et prêt' : 'Prêt à enregistrer'}
                    </p>

                    {/* VU-mètre REC */}
                    {status === 'recording' && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                            <span className="text-[9px] font-mono text-gray-400 uppercase">Signal</span>
                            <div className="w-48 sm:w-64 h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/15 p-0.5">
                                <div
                                    className={`h-full rounded-full transition-all duration-75 ${
                                        audioLevel > 80 ? 'bg-red-500' : audioLevel > 40 ? 'bg-amber-400' : 'bg-emerald-400'
                                    }`}
                                    style={{ width: `${audioLevel}%` }}
                                />
                            </div>
                            <span className="text-[9px] font-mono text-cyan-300 font-bold">{audioLevel}%</span>
                        </div>
                    )}

                    {/* Boutons d'Action REC */}
                    <div className="flex items-center justify-center gap-2.5 mt-5">
                        {status === 'idle' && (
                            <button
                                type="button"
                                onClick={handleStartRecording}
                                className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/30 active:scale-95 transition-all"
                            >
                                <Disc className="w-4 h-4 fill-current animate-pulse" />
                                <span>LANCER L'ENREGISTREMENT</span>
                            </button>
                        )}

                        {status === 'recording' && (
                            <>
                                <button
                                    type="button"
                                    onClick={handlePauseRecording}
                                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 cursor-pointer transition-all"
                                >
                                    <Pause className="w-4 h-4 fill-current" />
                                    <span>PAUSE</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleStopRecording}
                                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/30 transition-all"
                                >
                                    <Square className="w-4 h-4 fill-current" />
                                    <span>STOP &amp; FINALISER</span>
                                </button>
                            </>
                        )}

                        {status === 'paused' && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleResumeRecording}
                                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 cursor-pointer transition-all"
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                    <span>REPRENDRE</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleStopRecording}
                                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 cursor-pointer transition-all"
                                >
                                    <Square className="w-4 h-4 fill-current" />
                                    <span>STOP</span>
                                </button>
                            </>
                        )}

                        {status === 'stopped' && (
                            <button
                                type="button"
                                onClick={() => { setStatus('idle'); setRecordedBlobUrl(null); setRecordedBlob(null); setRecordDuration(0); }}
                                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs cursor-pointer transition-all"
                            >
                                Nouvel Enregistrement
                            </button>
                        )}
                    </div>
                </div>

                {/* Lecteur Preview & Export du Replay Enregistré */}
                {recordedBlobUrl && status === 'stopped' && (
                    <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-cyan-950/30 to-black/60 border border-cyan-500/40 space-y-3 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-display font-black uppercase italic tracking-wider text-cyan-300 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                Replay Enregistré avec Succès ({formatDuration(recordDuration)})
                            </span>
                            <span className="text-[9px] font-mono text-gray-400">
                                {(recordedBlob ? (recordedBlob.size / (1024 * 1024)).toFixed(2) : '0')} Mo
                            </span>
                        </div>

                        {/* Audio Player natif */}
                        <audio controls src={recordedBlobUrl} className="w-full h-10 accent-cyan-400 rounded-lg" />

                        <div className="flex items-center gap-2 pt-1">
                            <button
                                type="button"
                                onClick={handleDownload}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-display font-black text-xs uppercase italic tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 transition-all"
                            >
                                <Download className="w-4 h-4" />
                                <span>TÉLÉCHARGER LE FICHIER (.WEBM)</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveToLibrary}
                                className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-display font-black text-xs uppercase italic tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20 transition-all"
                            >
                                <HardDrive className="w-4 h-4" />
                                <span>GARDER DANS L'HISTORIQUE</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Historique des Replays Enregistrés */}
            {savedShows.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                    <h4 className="text-xs font-display font-black text-gray-300 uppercase italic tracking-wider mb-2 flex items-center gap-1.5">
                        <FileAudio className="w-3.5 h-3.5 text-purple-400" />
                        Historique des Émissions Enregistrées ({savedShows.length})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {savedShows.map(show => (
                            <div key={show.id} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3 text-xs">
                                <div className="min-w-0 flex-1">
                                    <p className="font-display font-black text-white uppercase italic truncate">
                                        {show.title}
                                    </p>
                                    <span className="text-[9px] font-mono text-gray-400">
                                        {show.date} · {formatDuration(show.durationSeconds)} · {show.fileSizeFormatted || ''}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {show.fileBlobUrl && (
                                        <a
                                            href={show.fileBlobUrl}
                                            download={`${show.title}.webm`}
                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 cursor-pointer"
                                            title="Télécharger"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteSavedShow(show.id)}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 cursor-pointer"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
