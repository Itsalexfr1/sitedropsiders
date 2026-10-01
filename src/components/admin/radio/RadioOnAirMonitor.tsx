import { useState, useEffect, useMemo, useRef } from 'react';
import {
    Radio,
    Clock,
    Play,
    Pause,
    Volume2,
    Sparkles,
    Sliders,
    Layers,
    Activity,
    ExternalLink,
    FileAudio,
    Flame,
    Mic,
    MicOff,
    Users,
    Headphones,
    Timer,
    MessageSquare,
    Disc,
    Smartphone
} from 'lucide-react';
import { RadioSpeakerTimer } from './RadioSpeakerTimer';
import { RadioDedicationsPanel } from './RadioDedicationsPanel';
import { RadioBroadcastRecorder } from './RadioBroadcastRecorder';
import {
    getCurrentLiveRadioTrack,
    getParisSeconds,
    formatDurationExact,
    getRadioCategoryMeta,
    type RadioScheduleBlock,
    type RadioTopHoraireConfig
} from '../../../utils/radioSchedule';
import { type RadionomyItem } from '../modals/RadionomyJinglesBox';

interface RadioOnAirMonitorProps {
    blocks: RadioScheduleBlock[];
    topHoraireConfig: RadioTopHoraireConfig;
    isRadioActive: boolean;
    onToggleRadio: () => void;
    onGoToRundown: () => void;
    onGoToMediaPool: () => void;
    listenersCount?: number;
    isLiveMicActive?: boolean;
    isMicTesting?: boolean;
    audioLevel?: number;
    isHeadphoneMonitor?: boolean;
    onToggleLiveMic?: () => void;
    onToggleMicTest?: () => void;
    onToggleHeadphoneMonitor?: () => void;
    onGoToStats?: () => void;
    micStream?: MediaStream | null;
}

export function RadioOnAirMonitor({
    blocks,
    topHoraireConfig,
    isRadioActive,
    onToggleRadio,
    onGoToRundown,
    onGoToMediaPool,
    listenersCount,
    isLiveMicActive,
    isMicTesting,
    audioLevel = 0,
    isHeadphoneMonitor = true,
    onToggleLiveMic,
    onToggleMicTest,
    onToggleHeadphoneMonitor,
    onGoToStats,
    micStream
}: RadioOnAirMonitorProps) {
    const [studioTab, setStudioTab] = useState<'on_air' | 'timer' | 'dedications' | 'recorder'>('on_air');
    const [unreadDedications, setUnreadDedications] = useState<number>(0);

    // Écoute des dédicaces reçues pour badge de notification
    useEffect(() => {
        try {
            const raw = localStorage.getItem('dropsiders_radio_dedications');
            if (raw) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr)) {
                    setUnreadDedications(arr.filter((d: any) => d.status === 'new').length);
                }
            }
        } catch {}

        let channel: BroadcastChannel | null = null;
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                channel = new BroadcastChannel('dropsiders_radio_dedications');
                channel.onmessage = (ev) => {
                    if (ev.data?.type === 'new_dedication') {
                        setUnreadDedications(c => c + 1);
                    } else if (ev.data?.type === 'sync' && Array.isArray(ev.data?.dedications)) {
                        setUnreadDedications(ev.data.dedications.filter((d: any) => d.status === 'new').length);
                    }
                };
            }
        } catch {}

        return () => {
            if (channel) channel.close();
        };
    }, []);
    // Horloge temps réel Europe/Paris
    const [nowSec, setNowSec] = useState<number>(getParisSeconds);
    const [parisTimeStr, setParisTimeStr] = useState<string>('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            try {
                const s = now.toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', second: '2-digit' });
                setParisTimeStr(s);
            } catch {
                setParisTimeStr(now.toTimeString().slice(0, 8));
            }
            setNowSec(getParisSeconds());
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    // Calcul du titre en direct
    const liveInfo = useMemo(() => getCurrentLiveRadioTrack(blocks, nowSec), [blocks, nowSec]);
    const liveItem = liveInfo?.item || null;
    const offsetSeconds = liveInfo?.offsetSeconds || 0;

    // Cartwall / Soundboard de jingles instantanés (depuis le stockage palette)
    const [cartwallItems, setCartwallItems] = useState<RadionomyItem[]>([]);
    useEffect(() => {
        try {
            const raw = localStorage.getItem('dropsiders_radionomy_palette');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    setCartwallItems(parsed.slice(0, 12));
                }
            }
        } catch {}
    }, []);

    // Audio preview local pour la régie
    const [previewAudioId, setPreviewAudioId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handlePlayInstantSound = (id: string, url?: string) => {
        if (!url) return;
        if (previewAudioId === id) {
            audioRef.current?.pause();
            audioRef.current = null;
            setPreviewAudioId(null);
            return;
        }

        if (audioRef.current) {
            audioRef.current.pause();
        }

        const audio = new Audio(url);
        audio.volume = 0.9;
        audio.onended = () => setPreviewAudioId(null);
        audio.onerror = () => setPreviewAudioId(null);
        audio.play().catch(() => setPreviewAudioId(null));
        audioRef.current = audio;
        setPreviewAudioId(id);
    };

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Calcul de progression du titre en direct
    const totalDuration = liveItem?.durationSeconds || 3600;
    const remainingSeconds = Math.max(0, totalDuration - offsetSeconds);
    const progressPercent = Math.min(100, Math.round((offsetSeconds / totalDuration) * 100));
    const liveCategoryMeta = liveItem ? getRadioCategoryMeta(liveItem.category, liveItem.isThemeJingle, liveItem.isTopHoraire) : null;

    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* ── SOUS-ONGLETS STUDIO RÉGIE & MODE MOBILE ── */}
            <div className="flex items-center gap-2 p-1.5 bg-black/60 rounded-2xl border border-white/10 overflow-x-auto">
                <button
                    type="button"
                    onClick={() => setStudioTab('on_air')}
                    className={`px-3.5 sm:px-4 py-2 rounded-xl font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                        studioTab === 'on_air'
                            ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Direct Antenne</span>
                </button>
                <button
                    type="button"
                    onClick={() => setStudioTab('timer')}
                    className={`px-3.5 sm:px-4 py-2 rounded-xl font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                        studioTab === 'timer'
                            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Timer className="w-3.5 h-3.5" />
                    <span>⏱️ Minuteur Animateur</span>
                </button>
                <button
                    type="button"
                    onClick={() => setStudioTab('dedications')}
                    className={`px-3.5 sm:px-4 py-2 rounded-xl font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                        studioTab === 'dedications'
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>💬 Dédicaces Auditeurs</span>
                    {unreadDedications > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-mono text-[9px] font-black animate-pulse">
                            {unreadDedications}
                        </span>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => setStudioTab('recorder')}
                    className={`px-3.5 sm:px-4 py-2 rounded-xl font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                        studioTab === 'recorder'
                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Disc className="w-3.5 h-3.5" />
                    <span>🎙️ Enregistreur Podcast</span>
                </button>
            </div>

            {/* VUE 1 : DIRECT ANTENNE & SOUNDBOARD */}
            {studioTab === 'on_air' && (
                <>
                    {/* ── BANDEAU PRINCIPAL : HORLOGE + STATUT MASTER ── */}
                    <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-[#0d101a] via-[#111626] to-[#0d101a] border border-white/10 shadow-2xl flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-neon-cyan via-purple-500 to-neon-red" />

                {/* Horloge de Paris */}
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-black/60 border border-white/15 flex items-center justify-center text-neon-cyan shadow-[0_0_25px_rgba(0,240,255,0.25)]">
                        <Clock className="w-8 h-8 animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Horloge Studio (Heure de Paris)</p>
                        <h2 className="text-3xl sm:text-4xl font-mono font-black text-white tracking-wider">
                            {parisTimeStr || '00:00:00'}
                        </h2>
                        <p className="text-[9px] font-mono text-neon-cyan/70 mt-0.5">
                            Synchronisation déterministe UTC+2
                        </p>
                    </div>
                </div>

                {/* Commandes régie : Auditeurs + Micro Talk-Over + ON AIR */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Compteur Auditeurs (Raccourci privé vers Onglet Stats) */}
                    <button
                        type="button"
                        onClick={onGoToStats}
                        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all ${
                            onGoToStats ? 'hover:bg-purple-500/25 cursor-pointer' : ''
                        }`}
                        title="Ouvrir l'onglet complet des Statistiques d'Audience (Privé régie)"
                    >
                        <Users className="w-4 h-4 text-purple-400 animate-pulse" />
                        <span>{listenersCount ?? 0}</span>
                        <span className="text-[10px] text-gray-400 font-normal hidden sm:inline">auditeurs (Stats →)</span>
                    </button>

                    {/* Bouton Test Micro Privé (PFL / Retour casque hors antenne) */}
                    {onToggleMicTest && (
                        <button
                            type="button"
                            onClick={onToggleMicTest}
                            disabled={isLiveMicActive}
                            className={`px-4 py-2.5 rounded-2xl font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                                isMicTesting
                                    ? 'bg-cyan-500 text-black shadow-cyan-500/50'
                                    : 'bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30'
                            }`}
                            title="Écouter votre micro en privé dans votre casque, sans diffusion à la radio (PFL)"
                        >
                            <Headphones className="w-4 h-4" />
                            <span>{isMicTesting ? 'Arrêter Test' : '🎧 Tester Micro'}</span>
                        </button>
                    )}

                    {/* Micro Studio Talk-over */}
                    {onToggleLiveMic && (
                        <button
                            type="button"
                            onClick={onToggleLiveMic}
                            disabled={isMicTesting}
                            className={`px-4 py-2.5 rounded-2xl font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                                isLiveMicActive
                                    ? 'bg-red-500 text-white animate-pulse shadow-red-500/50'
                                    : 'bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40'
                            }`}
                            title="Prendre l'antenne au micro avec ducking automatique de la musique"
                        >
                            {isLiveMicActive ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-purple-400" />}
                            <span>{isLiveMicActive ? 'COUPER MICRO' : '🎙️ ANIMER EN DIRECT'}</span>
                        </button>
                    )}

                    <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />

                    <div className="text-right hidden md:block">
                        <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Diffusion Antenne</p>
                        <p className={`text-xs font-display font-black uppercase italic ${isRadioActive ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isRadioActive ? '● DIRECT ACTIF' : '○ EN PAUSE'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onToggleRadio}
                        className={`px-5 py-2.5 rounded-2xl font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2.5 transition-all cursor-pointer shadow-lg ${
                            isRadioActive
                                ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                                : 'bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-black border border-red-500/40'
                        }`}
                    >
                        <span className={`w-2.5 h-2.5 rounded-full ${isRadioActive ? 'bg-black animate-ping' : 'bg-red-400'}`} />
                        <span>{isRadioActive ? 'ANTENNE ON AIR' : 'METTRE ON AIR'}</span>
                    </button>
                </div>
            </div>

            {/* ── BANNIÈRE PFL / TEST MICRO PRIVÉ (HORS ANTENNE) ── */}
            {isMicTesting && (
                <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-950/90 via-cyan-950/80 to-indigo-950/90 border-2 border-cyan-400 shadow-2xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                            <Headphones className="w-6 h-6 animate-pulse text-cyan-300" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-display font-black uppercase italic px-2 py-0.5 rounded bg-cyan-500 text-black">
                                    🎧 TEST MICRO PRIVÉ — HORS ANTENNE (PFL)
                                </span>
                                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                                    ✓ NON DIFFUSÉ À LA RADIO
                                </span>
                            </div>
                            <p className="text-xs text-gray-200 mt-1">
                                Vous vous entendez dans vos écouteurs pour calibrer votre son. Les auditeurs n'entendent rien.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                        {/* VU Mètre test */}
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="text-[10px] font-mono text-gray-300 uppercase">Niveau Voix</span>
                                <span className="text-xs font-mono font-bold text-cyan-300">{audioLevel}%</span>
                            </div>
                            <div className="w-48 h-3.5 bg-black/60 rounded-full overflow-hidden border border-white/20 p-0.5">
                                <div
                                    className={`h-full rounded-full transition-all duration-75 ${
                                        audioLevel > 80 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : audioLevel > 40 ? 'bg-cyan-400' : 'bg-emerald-400'
                                    }`}
                                    style={{ width: `${audioLevel}%` }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {onToggleLiveMic && (
                                <button
                                    type="button"
                                    onClick={onToggleLiveMic}
                                    className="px-4 py-2 rounded-xl bg-red-500 hover:bg-white text-black font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-500/30 transition-all"
                                >
                                    <Mic className="w-3.5 h-3.5" />
                                    <span>🔴 Passer en Direct (ON AIR)</span>
                                </button>
                            )}
                            {onToggleMicTest && (
                                <button
                                    type="button"
                                    onClick={onToggleMicTest}
                                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-display font-bold text-xs uppercase italic transition-all cursor-pointer border border-white/10"
                                >
                                    Arrêter
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── BANNIÈRE MICRO LIVE / TALK-OVER EN COURS ── */}
            {isLiveMicActive && (
                <div className="p-5 rounded-3xl bg-gradient-to-r from-red-950/80 via-purple-950/70 to-red-950/80 border-2 border-red-500 shadow-2xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500 flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                            <Mic className="w-6 h-6 animate-pulse text-red-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-display font-black uppercase italic px-2 py-0.5 rounded bg-red-500 text-white animate-pulse">
                                    ● ON AIR — MICRO STUDIO EN DIRECT
                                </span>
                                <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                                    Ducking actif (-75% musique)
                                </span>
                            </div>
                            <p className="text-xs text-gray-200 mt-1">
                                Votre micro est ouvert à l'antenne avec ducking automatique.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                        {/* Toggle Retour Casque pendant le direct */}
                        {onToggleHeadphoneMonitor && (
                            <button
                                type="button"
                                onClick={onToggleHeadphoneMonitor}
                                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                    isHeadphoneMonitor
                                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                                        : 'bg-black/40 text-gray-400 border-white/10 hover:text-white'
                                }`}
                                title="Activer ou couper le retour de votre propre voix dans vos écouteurs"
                            >
                                <Headphones className="w-3.5 h-3.5" />
                                <span>Retour casque : {isHeadphoneMonitor ? 'ON' : 'OFF'}</span>
                            </button>
                        )}

                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-red-400" />
                                <span className="text-[10px] font-mono text-gray-300 uppercase">Niveau Micro</span>
                                <span className="text-xs font-mono font-bold text-cyan-300">{audioLevel}%</span>
                            </div>
                            <div className="w-48 h-3.5 bg-black/60 rounded-full overflow-hidden border border-white/20 p-0.5">
                                <div
                                    className={`h-full rounded-full transition-all duration-75 ${
                                        audioLevel > 80 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : audioLevel > 40 ? 'bg-amber-400' : 'bg-emerald-400'
                                    }`}
                                    style={{ width: `${audioLevel}%` }}
                                />
                            </div>
                        </div>

                        {onToggleLiveMic && (
                            <button
                                type="button"
                                onClick={onToggleLiveMic}
                                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-white text-black font-display font-black text-xs uppercase italic tracking-wider cursor-pointer shadow-lg shadow-red-500/30 transition-all"
                            >
                                Couper Micro
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ── MONITOR EN DIRECT (CE QUI TOURNE MAINTENANT) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Carte Piste en Direct */}
                <div className="lg:col-span-8 p-6 rounded-3xl bg-[#0b0d14]/90 border border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-display font-black uppercase italic tracking-wider text-neon-cyan flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 animate-pulse" />
                            Diffusé en ce moment à l'antenne :
                        </span>
                        {liveCategoryMeta && (
                            <span className={`text-[9px] font-display font-black uppercase italic px-2.5 py-1 rounded-lg border ${liveCategoryMeta.bg} ${liveCategoryMeta.text} ${liveCategoryMeta.border} flex items-center gap-1.5`}>
                                <span>{liveCategoryMeta.emoji}</span>
                                <span>{liveCategoryMeta.label}</span>
                            </span>
                        )}
                    </div>

                    {liveItem ? (
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                {/* Miniature */}
                                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-black/60 border border-white/15 relative flex items-center justify-center">
                                    {liveItem.audioUrl ? (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-900/60 to-purple-700/40 flex items-center justify-center text-purple-300">
                                            <FileAudio className="w-10 h-10" />
                                        </div>
                                    ) : liveItem.youtubeId ? (
                                        <img
                                            src={`https://img.youtube.com/vi/${liveItem.youtubeId}/hqdefault.jpg`}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Radio className="w-8 h-8 text-gray-500" />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                        Émission : {liveItem.blockTitle || 'Programme Régulier'}
                                    </span>
                                    <h3 className="text-xl sm:text-2xl font-display font-black text-white uppercase italic tracking-tight truncate mt-1">
                                        {liveItem.title}
                                    </h3>
                                    <p className="text-sm font-sans font-bold text-gray-300 truncate">
                                        {liveItem.artist || 'DROPSIDERS RADIO'}
                                    </p>
                                    <p className="text-[10px] font-mono text-gray-500 mt-1">
                                        Créneau : {liveItem.startTime} ── {liveItem.endTime}
                                    </p>
                                </div>
                            </div>

                            {/* Barre de progression du titre */}
                            <div className="space-y-1.5 pt-2">
                                <div className="flex justify-between text-[10px] font-mono text-gray-400">
                                    <span>Écoulé : <strong className="text-white">{formatDurationExact(offsetSeconds)}</strong></span>
                                    <span>Progression : <strong className="text-neon-cyan">{progressPercent}%</strong></span>
                                    <span>Restant : <strong className="text-amber-400">{formatDurationExact(remainingSeconds)}</strong></span>
                                </div>
                                <div className="w-full h-2.5 rounded-full bg-white/5 border border-white/10 p-0.5 overflow-hidden">
                                    <div
                                        style={{ width: `${progressPercent}%` }}
                                        className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-purple-500 transition-all duration-1000 shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 text-center text-gray-500">
                            <Radio className="w-12 h-12 mx-auto mb-2 text-gray-600 opacity-40" />
                            <p className="font-display font-black text-sm uppercase italic text-gray-400">Aucune diffusion en cours</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10 text-xs">
                        <button
                            type="button"
                            onClick={onGoToRundown}
                            className="text-neon-cyan hover:underline font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 cursor-pointer"
                        >
                            <span>Voir le conducteur complet de l'heure →</span>
                        </button>
                        {liveItem?.youtubeId && (
                            <a
                                href={`https://www.youtube.com/watch?v=${liveItem.youtubeId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-400 hover:text-white flex items-center gap-1 font-mono text-[10px]"
                            >
                                <ExternalLink className="w-3 h-3" />
                                Ouvrir sur YouTube
                            </a>
                        )}
                    </div>
                </div>

                {/* Soundboard / Cartwall Express + Minuteur Animateur Compact */}
                <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
                    {/* Minuteur Animateur Compact */}
                    <RadioSpeakerTimer
                        trackRemainingSeconds={remainingSeconds}
                        currentTrackTitle={liveItem?.title}
                        compact
                    />

                    {/* Soundboard Cartwall */}
                    <div className="p-5 rounded-3xl bg-[#0b0d14]/90 border border-white/10 shadow-xl flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-display font-black uppercase italic tracking-wider text-purple-300 flex items-center gap-1.5">
                                    <Flame className="w-3.5 h-3.5 text-purple-400" />
                                    Cartwall · Jingles Express :
                                </span>
                                <button
                                    type="button"
                                    onClick={onGoToMediaPool}
                                    className="text-[9px] font-mono text-gray-400 hover:text-white underline cursor-pointer"
                                >
                                    Bac complet
                                </button>
                            </div>

                            <p className="text-[9px] text-gray-400 font-sans mb-3">
                                Cliquez pour écouter ou tester un drop audio instantanément en régie :
                            </p>

                            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                                {cartwallItems.length === 0 ? (
                                    <div className="col-span-2 py-6 text-center text-gray-500 text-[10px] font-mono">
                                        Aucun jingle dans le bac rapide.
                                    </div>
                                ) : (
                                    cartwallItems.map((item) => {
                                        const isPlaying = previewAudioId === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => handlePlayInstantSound(item.id, item.audioUrl)}
                                                disabled={!item.audioUrl}
                                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative group ${
                                                    isPlaying
                                                        ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-[1.02]'
                                                        : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 hover:border-purple-500/40 text-gray-300'
                                                } ${!item.audioUrl ? 'opacity-40 cursor-not-allowed' : ''}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[8px] font-display font-black uppercase italic px-1.5 py-0.5 rounded bg-black/40 text-purple-300">
                                                        {item.category === 'top_horaire' ? '⏰ TOP' : '🔔 JINGLE'}
                                                    </span>
                                                    {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current opacity-60 group-hover:opacity-100" />}
                                                </div>
                                                <p className="text-[10px] font-display font-black uppercase italic truncate mt-2 leading-tight">
                                                    {item.title}
                                                </p>
                                                <span className="text-[8px] font-mono text-gray-400 mt-1">
                                                    {item.duration}s {item.audioUrl ? '· WAV/MP3' : ''}
                                                </span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-white/10 text-center">
                            <span className="text-[8.5px] font-mono text-gray-500">
                                💡 Glissez des MP3 dans l'onglet Médiathèque pour enrichir ce pad
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            </>
            )}

            {/* VUE 2 : MINUTEUR ANIMATEUR GRAND FORMAT */}
            {studioTab === 'timer' && (
                <div className="max-w-2xl mx-auto py-4">
                    <RadioSpeakerTimer
                        trackRemainingSeconds={remainingSeconds}
                        currentTrackTitle={liveItem?.title}
                    />
                </div>
            )}

            {/* VUE 3 : DÉDICACES & CHAT AUDITEURS */}
            {studioTab === 'dedications' && (
                <div className="max-w-4xl mx-auto py-2">
                    <RadioDedicationsPanel />
                </div>
            )}

            {/* VUE 4 : ENREGISTREUR D'ÉMISSION (PODCAST / REPLAY) */}
            {studioTab === 'recorder' && (
                <div className="max-w-3xl mx-auto py-2">
                    <RadioBroadcastRecorder
                        micStream={micStream}
                        currentShowTitle={liveItem?.blockTitle || liveItem?.title || 'Émission Dropsiders Radio Live'}
                    />
                </div>
            )}

            {/* ── BARRE TACTILE STUDIO MOBILE (FLOTTANTE SUR PETIT ÉCRAN) ── */}
            <div className="block lg:hidden sticky bottom-0 z-30 bg-[#070a12]/95 border-t border-white/15 p-2 backdrop-blur-xl rounded-t-2xl shadow-2xl">
                <div className="flex items-center justify-between gap-2">
                    {/* Bouton ON AIR XXL */}
                    <button
                        type="button"
                        onClick={onToggleRadio}
                        className={`flex-1 py-2.5 rounded-xl font-display font-black text-xs uppercase italic tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-lg ${
                            isRadioActive
                                ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                                : 'bg-red-500 text-white shadow-red-500/30'
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${isRadioActive ? 'bg-black animate-ping' : 'bg-white'}`} />
                        <span>{isRadioActive ? 'ON AIR' : 'OFFLINE'}</span>
                    </button>

                    {/* Bouton Micro Talk-over Mobile */}
                    {onToggleLiveMic && (
                        <button
                            type="button"
                            onClick={onToggleLiveMic}
                            className={`flex-1 py-2.5 rounded-xl font-display font-black text-xs uppercase italic tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-lg ${
                                isLiveMicActive
                                    ? 'bg-red-500 text-white animate-pulse shadow-red-500/50'
                                    : 'bg-purple-600 text-white shadow-purple-600/30'
                            }`}
                        >
                            {isLiveMicActive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                            <span>{isLiveMicActive ? 'COUPER' : 'TALK-OVER'}</span>
                        </button>
                    )}

                    {/* Accès rapide dédicaces */}
                    <button
                        type="button"
                        onClick={() => setStudioTab('dedications')}
                        className={`p-2.5 rounded-xl border relative cursor-pointer ${
                            studioTab === 'dedications' ? 'bg-purple-600 text-white border-purple-400' : 'bg-white/5 border-white/10 text-gray-300'
                        }`}
                        title="Dédicaces"
                    >
                        <MessageSquare className="w-4 h-4" />
                        {unreadDedications > 0 && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                        )}
                    </button>

                    {/* Accès rapide timer */}
                    <button
                        type="button"
                        onClick={() => setStudioTab('timer')}
                        className={`p-2.5 rounded-xl border cursor-pointer ${
                            studioTab === 'timer' ? 'bg-amber-500 text-black border-amber-400' : 'bg-white/5 border-white/10 text-gray-300'
                        }`}
                        title="Minuteur"
                    >
                        <Timer className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
