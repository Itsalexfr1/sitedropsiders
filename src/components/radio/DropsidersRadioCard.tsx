import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Radio, 
    Play, 
    Pause, 
    Volume2, 
    VolumeX, 
    Sparkles, 
    Disc3, 
    Clock 
} from 'lucide-react';
import { 
    formatDurationExact, 
    getCurrentLiveRadioTrack, 
    DEFAULT_RADIO_BLOCKS, 
    type ComputedRadioScheduleItem 
} from '../../utils/radioSchedule';

export function DropsidersRadioCard({ className = '' }: { className?: string }) {
    const [isEnabled, setIsEnabled] = useState<boolean>(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.get('radio') === '1' || params.get('radio_preview') === 'true') return true;
            return localStorage.getItem('dropsiders_radio_enabled') !== 'false';
        } catch {
            return true;
        }
    });

    const initialLive = getCurrentLiveRadioTrack(DEFAULT_RADIO_BLOCKS);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(() => {
        try {
            const saved = localStorage.getItem('dropsiders_radio_volume');
            return saved !== null ? Math.max(0, Math.min(100, Number(saved))) : 80;
        } catch {
            return 80;
        }
    });
    const [currentSet, setCurrentSet] = useState<ComputedRadioScheduleItem | null>(() => initialLive?.item || null);
    const [uiOffset, setUiOffset] = useState(() => initialLive?.offsetSeconds || 0);

    // Synchronisation avec DropsidersRadioPlayer via custom events
    useEffect(() => {
        const handleState = (e: any) => {
            if (!e.detail) return;
            if (typeof e.detail.isEnabled === 'boolean') setIsEnabled(e.detail.isEnabled);
            if (typeof e.detail.isPlaying === 'boolean') setIsPlaying(e.detail.isPlaying);
            if (typeof e.detail.isMuted === 'boolean') setIsMuted(e.detail.isMuted);
            if (typeof e.detail.volume === 'number') setVolume(e.detail.volume);
            if (e.detail.currentSet) setCurrentSet(e.detail.currentSet);
            if (typeof e.detail.uiOffset === 'number') setUiOffset(e.detail.uiOffset);
        };

        const handleToggle = () => {
            const enabled = localStorage.getItem('dropsiders_radio_enabled') !== 'false';
            setIsEnabled(enabled);
        };

        window.addEventListener('dropsiders_radio_state', handleState);
        window.addEventListener('dropsiders_radio_toggle', handleToggle);
        window.addEventListener('storage', handleToggle);

        // Demander l'état immédiat au player global
        window.dispatchEvent(new CustomEvent('dropsiders_radio_query_state'));

        // Vérifier également côté serveur
        fetch('/api/settings')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data && typeof data.radio_enabled === 'boolean') {
                    setIsEnabled(data.radio_enabled);
                }
            })
            .catch(() => {});

        return () => {
            window.removeEventListener('dropsiders_radio_state', handleState);
            window.removeEventListener('dropsiders_radio_toggle', handleToggle);
            window.removeEventListener('storage', handleToggle);
        };
    }, []);

    const handlePlayToggle = () => {
        window.dispatchEvent(new CustomEvent('dropsiders_radio_cmd_toggle'));
    };

    const handleMuteToggle = () => {
        window.dispatchEvent(new CustomEvent('dropsiders_radio_cmd_mute'));
    };

    const handleVolumeChange = (v: number) => {
        setVolume(v);
        window.dispatchEvent(new CustomEvent('dropsiders_radio_cmd_volume', { detail: v }));
    };

    if (!isEnabled) return null;

    const progressPercent = currentSet?.durationSeconds 
        ? Math.min(100, Math.max(0, (uiOffset / currentSet.durationSeconds) * 100))
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className={`w-full relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0e0f18] via-[#090a12] to-[#04040a] border border-neon-cyan/35 hover:border-neon-cyan/70 p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_30px_rgba(0,255,255,0.12)] transition-all duration-300 ${className}`}
        >
            {/* Lueurs d'ambiance */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-neon-cyan/15 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-neon-red/12 rounded-full blur-3xl pointer-events-none -ml-12 -mb-12" />

            {/* Header du player */}
            <div className="flex items-center justify-between relative z-10 mb-3.5">
                <div className="flex items-center gap-3">
                    <div className="relative p-2 rounded-2xl bg-neon-cyan/15 border border-neon-cyan/40 text-neon-cyan shadow-[0_0_15px_rgba(0,255,255,0.3)] shrink-0">
                        <Radio className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-neon-red border-2 border-[#090a12] animate-ping" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-neon-red" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-display font-black text-white uppercase italic tracking-tight">
                                DROPSIDERS <span className="text-neon-cyan">RADIO</span>
                            </h3>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neon-red/20 text-neon-red border border-neon-red/40 text-[8px] font-black uppercase tracking-wider animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-neon-red" />
                                LIVE 24/7
                            </span>
                        </div>
                        <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                            Web Radio Non-Stop • Sets &amp; Bass Music
                        </p>
                    </div>
                </div>

                {/* Spinning vinyl icon when playing */}
                <div className="relative hidden sm:flex items-center justify-center">
                    <Disc3 
                        className={`w-6 h-6 text-neon-cyan/80 ${isPlaying ? 'animate-spin' : 'opacity-60'}`}
                        style={{ animationDuration: '4s' }}
                    />
                </div>
            </div>

            {/* Informations du set en cours */}
            <div className="bg-black/50 border border-white/10 rounded-2xl p-3 sm:p-3.5 relative z-10 mb-3 backdrop-blur-md">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-neon-cyan flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        EN CE MOMENT SUR LES ONDES
                    </span>
                    {currentSet?.durationFormatted && (
                        <span className="text-[8px] sm:text-[9px] font-mono font-bold text-gray-400">
                            {currentSet.durationFormatted}
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-display font-black text-white uppercase italic tracking-tight truncate">
                            {currentSet?.artist || 'DROPSIDERS ROTATION'}
                        </h4>
                        <p className="text-[9px] sm:text-[10px] font-semibold text-gray-400 truncate mt-0.5">
                            {currentSet?.title || currentSet?.event || 'Sélection Electro & Livesets Non-Stop'}
                        </p>
                    </div>
                    {currentSet?.startTime && (
                        <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[8px] sm:text-[9px] font-mono text-neon-cyan">
                            <Clock className="w-2.5 h-2.5" />
                            {currentSet.startTime}
                        </div>
                    )}
                </div>

                {/* Barre de progression */}
                <div className="mt-2.5 space-y-1">
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-neon-cyan via-purple-500 to-neon-red rounded-full transition-all duration-1000"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-[7.5px] sm:text-[8px] font-mono text-gray-500">
                        <span>{formatDurationExact(uiOffset)}</span>
                        <span>{currentSet?.durationFormatted || '24h'}</span>
                    </div>
                </div>
            </div>

            {/* Contrôles et Égaliseur */}
            <div className="flex items-center justify-between gap-3 relative z-10 pt-1">
                {/* Bouton Principal Play / Pause */}
                <button
                    onClick={handlePlayToggle}
                    className={`px-4 sm:px-5 py-2.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                        isPlaying
                            ? 'bg-neon-cyan text-black shadow-neon-cyan/40 hover:bg-white'
                            : 'bg-white text-black hover:bg-neon-cyan hover:shadow-neon-cyan/30'
                    }`}
                >
                    {isPlaying ? (
                        <>
                            <Pause className="w-4 h-4 fill-current" />
                            <span>METTRE EN PAUSE</span>
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                            <span>ÉCOUTER LA RADIO</span>
                        </>
                    )}
                </button>

                {/* Égaliseur animé */}
                <div className="flex items-end gap-1 h-5 px-2">
                    <span 
                        className={`w-1 rounded-full transition-all ${isPlaying ? 'bg-neon-cyan animate-pulse' : 'bg-white/20'}`} 
                        style={{ height: isPlaying ? '65%' : '20%', animationDuration: '420ms' }} 
                    />
                    <span 
                        className={`w-1 rounded-full transition-all ${isPlaying ? 'bg-purple-500 animate-pulse' : 'bg-white/20'}`} 
                        style={{ height: isPlaying ? '100%' : '20%', animationDuration: '280ms' }} 
                    />
                    <span 
                        className={`w-1 rounded-full transition-all ${isPlaying ? 'bg-neon-red animate-pulse' : 'bg-white/20'}`} 
                        style={{ height: isPlaying ? '80%' : '20%', animationDuration: '360ms' }} 
                    />
                    <span 
                        className={`w-1 rounded-full transition-all ${isPlaying ? 'bg-neon-cyan animate-pulse' : 'bg-white/20'}`} 
                        style={{ height: isPlaying ? '45%' : '20%', animationDuration: '500ms' }} 
                    />
                </div>

                {/* Volume & Mute */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleMuteToggle} 
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title={isMuted ? 'Activer le son' : 'Couper le son'}
                    >
                        {isMuted || volume === 0 ? (
                            <VolumeX className="w-4 h-4 text-neon-red" />
                        ) : (
                            <Volume2 className="w-4 h-4 text-neon-cyan" />
                        )}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : volume}
                        onChange={e => handleVolumeChange(Number(e.target.value))}
                        className="w-16 sm:w-20 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-neon-cyan hidden xs:block"
                        title={`Volume: ${isMuted ? 0 : volume}%`}
                    />
                </div>
            </div>
        </motion.div>
    );
}
