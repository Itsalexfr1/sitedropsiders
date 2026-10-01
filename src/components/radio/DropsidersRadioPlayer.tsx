import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls, useMotionValue } from 'framer-motion';
import {
    Radio, Play, Pause, Volume2, VolumeX, Minimize2, X,
    Clock, Sparkles, Disc3, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
    DEFAULT_RADIO_BLOCKS, STORAGE_RADIO_BLOCKS_KEY,
    getParisSeconds, formatDurationExact, getCurrentLiveRadioTrack,
    type RadioScheduleBlock, type ComputedRadioScheduleItem
} from '../../utils/radioSchedule';
import { useLocation } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext';

// ─── URL YouTube embed ────────────────────────────────────────────────────────
function buildSrc(youtubeId: string, start: number, muted: 0 | 1) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `https://www.youtube.com/embed/${youtubeId}`
        + `?autoplay=1&start=${Math.floor(start)}&enablejsapi=1&controls=0`
        + `&mute=${muted}&playsinline=1&rel=0&fs=0`
        + `&origin=${encodeURIComponent(origin)}`;
}

// ─── Barres audio animées (vraie animation égaliseur) ────────────────────────
const EQ_KEYFRAMES = `
@keyframes eq-bar-1 {
  0%,100% { height: 25%; } 25% { height: 80%; } 50% { height: 45%; } 75% { height: 95%; }
}
@keyframes eq-bar-2 {
  0%,100% { height: 65%; } 20% { height: 30%; } 50% { height: 100%; } 80% { height: 50%; }
}
@keyframes eq-bar-3 {
  0%,100% { height: 40%; } 30% { height: 90%; } 60% { height: 20%; } 85% { height: 75%; }
}
@keyframes eq-bar-4 {
  0%,100% { height: 70%; } 15% { height: 35%; } 45% { height: 100%; } 70% { height: 55%; }
}
`;

let _eqStyleInjected = false;
function injectEqStyle() {
    if (_eqStyleInjected || typeof document === 'undefined') return;
    _eqStyleInjected = true;
    const s = document.createElement('style');
    s.textContent = EQ_KEYFRAMES;
    document.head.appendChild(s);
}
injectEqStyle();

const EQ_BARS = [
    { anim: 'eq-bar-1', dur: '0.55s' },
    { anim: 'eq-bar-2', dur: '0.38s' },
    { anim: 'eq-bar-3', dur: '0.62s' },
    { anim: 'eq-bar-4', dur: '0.44s' },
];

function AudioBars({ playing }: { playing: boolean }) {
    return (
        <div className="flex items-end gap-[2.5px] h-4 shrink-0">
            {EQ_BARS.map((b, i) => (
                <span
                    key={i}
                    style={{
                        display: 'block',
                        width: '3px',
                        height: playing ? '60%' : '20%',
                        borderRadius: '2px',
                        backgroundColor: playing ? 'rgb(0,255,255)' : 'rgba(255,255,255,0.25)',
                        animation: playing ? `${b.anim} ${b.dur} ease-in-out infinite alternate` : 'none',
                        transition: 'background-color 0.3s',
                    }}
                />
            ))}
        </div>
    );
}

// ─── Hook logique audio ───────────────────────────────────────────────────────
/**
 * STRATÉGIE IOS-SAFE (manipulation DOM synchrone) :
 *
 * Le problème fondamental avec iOS Safari :
 * - Le contexte "user gesture" expire dès qu'on sort du handler de click synchrone
 * - React setState() est async → le re-render qui change iframe.src arrive APRÈS
 *   l'expiration du geste → iOS bloque le son
 *
 * SOLUTION : on manipule iframeRef.current.src DIRECTEMENT et SYNCHRONEMENT
 * dans le handler onClick, SANS passer par React state pour le déclenchement audio.
 * Le state React suit juste pour l'UI.
 */
function useRadioAudio() {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    // Ref vers le set courant — toujours à jour, accessible en synchrone dans le click handler
    const currentSetRef = useRef<ComputedRadioScheduleItem | null>(null);

    // ─── Activation ──────────────────────────────────────────────────────────
    const [isEnabled, setIsEnabled] = useState<boolean>(() => {
        try {
            const p = new URLSearchParams(window.location.search);
            if (p.get('radio') === '1' || p.get('radio_preview') === 'true') return true;
            return localStorage.getItem('dropsiders_radio_enabled') !== 'false';
        } catch { return true; }
    });

    useEffect(() => {
        const h = () => setIsEnabled(localStorage.getItem('dropsiders_radio_enabled') !== 'false');
        window.addEventListener('dropsiders_radio_toggle', h);
        window.addEventListener('storage', h);
        return () => { window.removeEventListener('dropsiders_radio_toggle', h); window.removeEventListener('storage', h); };
    }, []);

    // ─── Blocs radio ─────────────────────────────────────────────────────────
    const [radioBlocks, setRadioBlocks] = useState<RadioScheduleBlock[]>(() => {
        try {
            const s = localStorage.getItem(STORAGE_RADIO_BLOCKS_KEY);
            if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) return p; }
        } catch {}
        return DEFAULT_RADIO_BLOCKS;
    });

    useEffect(() => {
        const h = () => {
            try {
                const s = localStorage.getItem(STORAGE_RADIO_BLOCKS_KEY);
                if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) setRadioBlocks(p); }
            } catch {}
        };
        window.addEventListener('dropsiders_radio_blocks_updated', h);
        window.addEventListener('storage', h);
        return () => { window.removeEventListener('dropsiders_radio_blocks_updated', h); window.removeEventListener('storage', h); };
    }, []);

    useEffect(() => {
        const p = new URLSearchParams(window.location.search);
        fetch('/api/settings').then(r => r.ok ? r.json() : null).then(data => {
            if (!data) return;
            if (p.get('radio') !== '1' && p.get('radio_preview') !== 'true' && typeof data.radio_enabled === 'boolean') {
                setIsEnabled(data.radio_enabled);
                localStorage.setItem('dropsiders_radio_enabled', data.radio_enabled ? 'true' : 'false');
            }
            if (Array.isArray(data.radio_blocks) && data.radio_blocks.length > 0) {
                setRadioBlocks(data.radio_blocks);
                localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(data.radio_blocks));
            }
        }).catch(() => {});
    }, []);

    // ─── Horloge Paris ───────────────────────────────────────────────────────
    const [uiTimeSec, setUiTimeSec] = useState<number>(getParisSeconds);
    useEffect(() => {
        const id = setInterval(() => setUiTimeSec(getParisSeconds()), 2000);
        return () => clearInterval(id);
    }, []);

    const liveInfo = useMemo(() => getCurrentLiveRadioTrack(radioBlocks, uiTimeSec), [radioBlocks, uiTimeSec]);
    const currentSet = liveInfo?.item || null;
    const uiOffset = liveInfo?.offsetSeconds ?? 0;
    const uiOffsetRef = useRef(uiOffset);
    useEffect(() => { uiOffsetRef.current = uiOffset; }, [uiOffset]);
    // Garde currentSetRef toujours à jour (pas de stale closure dans handlePlay)
    useEffect(() => { currentSetRef.current = currentSet; }, [currentSet]);

    // ─── État audio (UI only) ─────────────────────────────────────────────────
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState<number>(() => {
        try { const s = localStorage.getItem('dropsiders_radio_volume'); return s ? Math.max(0, Math.min(100, Number(s))) : 80; }
        catch { return 80; }
    });

    // ─── postMessage vers YouTube ────────────────────────────────────────────
    const sendCmd = useCallback((func: string, args: any = '') => {
        try {
            iframeRef.current?.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func, args }), '*'
            );
        } catch {}
    }, []);

    // ─── Références stables ──────────────────────────────────────────────────
    const currentVideoId = currentSet?.youtubeId;
    const isPlayingRef = useRef(isPlaying);
    const isMutedRef = useRef(isMuted);
    const volumeRef = useRef(volume);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
    useEffect(() => { volumeRef.current = volume; }, [volume]);

    // ─── Préchargement muet dès qu'un set YouTube est disponible ────────────
    const preloadedVideoIdRef = useRef<string | null>(null);
    useEffect(() => {
        if (!currentVideoId || currentSet?.audioUrl) return;
        if (isPlayingRef.current) return;
        if (preloadedVideoIdRef.current === currentVideoId) return;
        preloadedVideoIdRef.current = currentVideoId;
        if (iframeRef.current) {
            // Pour YouTube, toujours démarrer depuis 0 (on ne connaît pas la durée réelle de la vidéo)
            iframeRef.current.src = buildSrc(currentVideoId, 0, 1);
        }
    }, [currentVideoId, currentSet?.audioUrl]);

    // ─── Canaux & Durées Découvertes ─────────────────────────────────────────
    // ─── Comptage Réel des Auditeurs (Sans Simulation Artificielle) ─────────
    const [listenersCount, setListenersCount] = useState<number>(0);

    const [isDucking, setIsDucking] = useState(false);
    const isDuckingRef = useRef(isDucking);
    useEffect(() => { isDuckingRef.current = isDucking; }, [isDucking]);

    // Écoute de l'animation en direct (Micro Talk-over)
    useEffect(() => {
        const handleDucking = (e: any) => {
            const active = !!(e.detail && e.detail.active);
            setIsDucking(active);
        };
        window.addEventListener('dropsiders_radio_ducking', handleDucking);
        return () => window.removeEventListener('dropsiders_radio_ducking', handleDucking);
    }, []);

    // Suivi en temps réel des auditeurs réels (Présence multi-onglets + API réelle sans +110 artificiel)
    useEffect(() => {
        const tabSessionId = 'tab_' + Math.random().toString(36).slice(2, 9);
        const presenceMap = new Map<string, number>();

        let channel: BroadcastChannel | null = null;
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                channel = new BroadcastChannel('dropsiders_radio_presence');
                channel.onmessage = (ev) => {
                    const data = ev.data;
                    if (data && data.type === 'radio_ping' && data.id) {
                        if (data.isPlaying) {
                            presenceMap.set(data.id, Date.now());
                        } else {
                            presenceMap.delete(data.id);
                        }
                        updateTotalCount();
                    } else if (data && data.type === 'radio_bye' && data.id) {
                        presenceMap.delete(data.id);
                        updateTotalCount();
                    }
                };
            }
        } catch {}

        let remoteViewers = 0;

        const updateTotalCount = () => {
            const now = Date.now();
            // Nettoyage des onglets inactifs depuis plus de 6 secondes
            for (const [id, ts] of presenceMap.entries()) {
                if (now - ts > 6000) presenceMap.delete(id);
            }
            const localActiveTabs = (isPlayingRef.current ? 1 : 0) + presenceMap.size;
            const finalCount = Math.max(localActiveTabs, remoteViewers);
            setListenersCount(finalCount);

            // Mémorisation du pic réel
            try {
                const currentPeak = parseInt(localStorage.getItem('dropsiders_radio_peak_listeners') || '0', 10);
                if (finalCount > currentPeak) {
                    localStorage.setItem('dropsiders_radio_peak_listeners', String(finalCount));
                }
            } catch {}
        };

        const pingPresence = async () => {
            if (channel) {
                try {
                    channel.postMessage({
                        type: 'radio_ping',
                        id: tabSessionId,
                        isPlaying: isPlayingRef.current && !isMutedRef.current,
                    });
                } catch {}
            }

            // Requête API réelle si disponible (sans aucun ajout artificiel)
            try {
                const res = await fetch('/api/chat/viewers?channel=radio');
                if (res.ok) {
                    const data = await res.json();
                    if (data && typeof data.viewers === 'number') {
                        remoteViewers = Math.max(0, data.viewers);
                    }
                }
            } catch {}

            updateTotalCount();
        };

        pingPresence();
        const interval = setInterval(pingPresence, 3000);

        return () => {
            clearInterval(interval);
            if (channel) {
                try {
                    channel.postMessage({ type: 'radio_bye', id: tabSessionId });
                    channel.close();
                } catch {}
            }
        };
    }, []);

    // Volume effectif prenant en compte le ducking (attenuation quand l'animateur parle)
    const effectiveVolume = isDucking ? Math.max(10, Math.round(volume * 0.22)) : volume;
    const effectiveVolumeRef = useRef(effectiveVolume);
    useEffect(() => { effectiveVolumeRef.current = effectiveVolume; }, [effectiveVolume]);

    // ─── TRANSITIONS SANS COUPURE NI BAISSE DE SON (Gapless & Direct) ────────
    // Plus de fondu à 0 : le son reste à 100% du volume cible, enchaînement direct.
    // Les jingles démarrent à 0.00s sans tronquage de l'attaque initiale.
    useEffect(() => {
        if (!isPlayingRef.current || !currentSet) return;

        const targetAudioVol = isMutedRef.current ? 0 : (effectiveVolumeRef.current / 100);
        const isJingleOrShort = currentSet.isTopHoraire || currentSet.isThemeJingle ||
            currentSet.category === 'jingle' || currentSet.category === 'promo' || currentSet.category === 'pub';

        if (currentSet.audioUrl) {
            // Lecture HTML5 Audio (Jingle, Top Horaire, Générique ou Track uploadé)
            if (audioRef.current) {
                if (audioRef.current.src !== currentSet.audioUrl) {
                    audioRef.current.src = currentSet.audioUrl;
                }
                // Pour les jingles et promos : TOUJOURS démarrer à 0.00s (ne jamais couper l'intro !)
                audioRef.current.currentTime = isJingleOrShort ? 0 : Math.max(0, uiOffsetRef.current || 0);
                audioRef.current.volume = targetAudioVol;
                audioRef.current.play().then(() => {
                    // Une fois l'audio lancé, on coupe YouTube sans trou
                    if (iframeRef.current && iframeRef.current.src !== 'about:blank') {
                        sendCmd('pauseVideo');
                        iframeRef.current.src = 'about:blank';
                        preloadedVideoIdRef.current = null;
                    }
                }).catch(() => {});
            }
        } else if (currentSet.youtubeId) {
            // Lecture YouTube (Liveset, Clip ou Mix)
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
            }

            const currentYt = currentSet.youtubeId;
            const alreadyLoaded = iframeRef.current?.src && iframeRef.current.src.includes(currentYt);

            if (!alreadyLoaded) {
                // Lancer YouTube directement avec le volume cible sans baisse
                const startSec = isJingleOrShort ? 0 : Math.max(0, Math.floor(uiOffsetRef.current || 0));
                if (iframeRef.current) {
                    iframeRef.current.src = buildSrc(currentYt, startSec, isMutedRef.current ? 1 : 0);
                    preloadedVideoIdRef.current = currentYt;
                }
                setTimeout(() => {
                    if (!isMutedRef.current) sendCmd('unMute');
                    sendCmd('setVolume', [effectiveVolumeRef.current]);
                    sendCmd('playVideo');
                }, 300);
            } else {
                if (!isMutedRef.current) sendCmd('unMute');
                sendCmd('setVolume', [effectiveVolumeRef.current]);
                sendCmd('playVideo');
            }
        }
    }, [currentSet?.id, currentSet?.audioUrl, currentSet?.youtubeId, sendCmd]);

    // ─── ANTI-BLANC : DÉTECTION FIN DE MORCEAU ET ENCHAÎNEMENT IMMÉDIAT ───────
    // Évite les silences quand un clip ou set YouTube est plus court que prévu
    const advanceToNextTrack = useCallback(() => {
        // Avancer l'horloge interne d'une seconde pour forcer le recalcul du prochain morceau
        setUiTimeSec(prev => {
            const curDur = currentSetRef.current?.durationSeconds || 180;
            const curOffset = uiOffsetRef.current || 0;
            const remaining = Math.max(1, curDur - curOffset);
            return (prev + remaining) % 86400;
        });
    }, []);

    // 1. Écoute de l'événement YouTube postMessage (info: 0 => ENDED)
    useEffect(() => {
        const handleYtMessage = (event: MessageEvent) => {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                // info === 0 correspond à YT.PlayerState.ENDED
                if (data && (data.event === 'onStateChange' || data.info === 0) && data.info === 0) {
                    advanceToNextTrack();
                }
                // Récupération automatique de la durée réelle rapportée par le player YouTube
                if (data?.info?.duration && currentSetRef.current?.youtubeId) {
                    const dur = Math.round(Number(data.info.duration));
                    if (dur > 5) {
                        try {
                            const raw = localStorage.getItem('dropsiders_radio_durations') || '{}';
                            const parsed = JSON.parse(raw);
                            if (parsed[currentSetRef.current.youtubeId] !== dur) {
                                parsed[currentSetRef.current.youtubeId] = dur;
                                localStorage.setItem('dropsiders_radio_durations', JSON.stringify(parsed));
                            }
                        } catch {}
                    }
                }
            } catch {}
        };
        window.addEventListener('message', handleYtMessage);
        return () => window.removeEventListener('message', handleYtMessage);
    }, [advanceToNextTrack]);

    // 2. Écoute de l'événement Audio HTML5 onended (Jingle / Track terminé)
    useEffect(() => {
        const el = audioRef.current;
        if (!el) return;
        const onEnded = () => {
            advanceToNextTrack();
        };
        const onLoaded = () => {
            if (el.duration && el.duration > 0 && currentSetRef.current) {
                const dur = Math.round(el.duration);
                const key = currentSetRef.current.id || currentSetRef.current.audioUrl;
                if (key) {
                    try {
                        const raw = localStorage.getItem('dropsiders_radio_durations') || '{}';
                        const parsed = JSON.parse(raw);
                        if (parsed[key] !== dur) {
                            parsed[key] = dur;
                            localStorage.setItem('dropsiders_radio_durations', JSON.stringify(parsed));
                        }
                    } catch {}
                }
            }
        };
        el.addEventListener('ended', onEnded);
        el.addEventListener('loadedmetadata', onLoaded);
        return () => {
            el.removeEventListener('ended', onEnded);
            el.removeEventListener('loadedmetadata', onLoaded);
        };
    }, [advanceToNextTrack]);

    // ─── Play / Pause ─────────────────────────────────────────────────────────
    const handlePlay = useCallback(() => {
        const set = currentSetRef.current;
        if (!set?.youtubeId && !set?.audioUrl) return;

        const isJingleOrShort = set.isTopHoraire || set.isThemeJingle ||
            set.category === 'jingle' || set.category === 'promo' || set.category === 'pub';

        if (!isPlaying) {
            if (set.audioUrl) {
                if (iframeRef.current) iframeRef.current.src = 'about:blank';
                preloadedVideoIdRef.current = null;
                if (audioRef.current) {
                    if (audioRef.current.src !== set.audioUrl) {
                        audioRef.current.src = set.audioUrl;
                    }
                    audioRef.current.currentTime = isJingleOrShort ? 0 : Math.max(0, uiOffsetRef.current || 0);
                    audioRef.current.volume = isMutedRef.current ? 0 : (effectiveVolumeRef.current / 100);
                    audioRef.current.play().catch(() => {});
                }
            } else if (set.youtubeId) {
                if (audioRef.current) audioRef.current.pause();

                const alreadyLoaded = iframeRef.current?.src?.includes(set.youtubeId);
                if (alreadyLoaded) {
                    if (!isMutedRef.current) sendCmd('unMute');
                    sendCmd('setVolume', [effectiveVolumeRef.current]);
                    sendCmd('playVideo');
                } else {
                    const startSec = isJingleOrShort ? 0 : Math.max(0, Math.floor(uiOffsetRef.current || 0));
                    const src = buildSrc(set.youtubeId, startSec, isMutedRef.current ? 1 : 0);
                    if (iframeRef.current) iframeRef.current.src = src;
                    preloadedVideoIdRef.current = set.youtubeId;
                    setTimeout(() => {
                        if (!isMutedRef.current) sendCmd('unMute');
                        sendCmd('setVolume', [effectiveVolumeRef.current]);
                        sendCmd('playVideo');
                    }, 400);
                }
            }
            setIsPlaying(true);
        } else {
            // Stop propre
            if (audioRef.current) audioRef.current.pause();
            if (iframeRef.current) iframeRef.current.src = 'about:blank';
            preloadedVideoIdRef.current = null;
            sendCmd('pauseVideo');
            setIsPlaying(false);
        }
    }, [isPlaying, sendCmd]);

    const handleStop = useCallback(() => {
        if (audioRef.current) audioRef.current.pause();
        if (iframeRef.current) iframeRef.current.src = 'about:blank';
        sendCmd('pauseVideo');
        setIsPlaying(false);
    }, [sendCmd]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const next = !prev;
            if (audioRef.current) audioRef.current.volume = next ? 0 : (effectiveVolumeRef.current / 100);
            if (isPlaying) {
                if (next) sendCmd('mute');
                else { sendCmd('unMute'); sendCmd('setVolume', [effectiveVolumeRef.current]); }
            }
            return next;
        });
    }, [isPlaying, sendCmd]);

    // ─── Volume & Ducking sync ───────────────────────────────────────────────
    useEffect(() => {
        try { localStorage.setItem('dropsiders_radio_volume', String(volume)); } catch {}
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : effectiveVolume / 100;
        }
        if (!isPlaying) return;
        if (!isMuted) sendCmd('setVolume', [effectiveVolume]);
    }, [volume, effectiveVolume, isPlaying, isMuted, sendCmd]);

    // ─── Broadcast vers autres composants ────────────────────────────────────
    const stateRef = useRef({ isPlaying, isMuted, volume, effectiveVolume, currentSet, uiOffset, isEnabled, listenersCount, isDucking });
    useEffect(() => {
        stateRef.current = { isPlaying, isMuted, volume, effectiveVolume, currentSet, uiOffset, isEnabled, listenersCount, isDucking };
    }, [isPlaying, isMuted, volume, effectiveVolume, currentSet, uiOffset, isEnabled, listenersCount, isDucking]);

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('dropsiders_radio_state', {
            detail: { isPlaying, isMuted, volume, effectiveVolume, currentSet, uiOffset, isEnabled, listenersCount, isDucking }
        }));
    }, [isPlaying, isMuted, volume, effectiveVolume, currentSet, uiOffset, isEnabled, listenersCount, isDucking]);

    useEffect(() => {
        const broadcast = () => window.dispatchEvent(new CustomEvent('dropsiders_radio_state', { detail: stateRef.current }));
        const onToggle = () => handlePlay();
        const onPlay = () => { if (!stateRef.current.isPlaying) handlePlay(); };
        const onPause = () => { if (stateRef.current.isPlaying) handlePlay(); };
        const onStop = () => handleStop();
        const onMute = () => toggleMute();
        const onVolume = (e: any) => {
            if (typeof e.detail === 'number') { setVolume(Math.max(0, Math.min(100, e.detail))); if (isMuted) setIsMuted(false); }
        };
        window.addEventListener('dropsiders_radio_cmd_toggle', onToggle);
        window.addEventListener('dropsiders_radio_cmd_play', onPlay);
        window.addEventListener('dropsiders_radio_cmd_pause', onPause);
        window.addEventListener('dropsiders_radio_cmd_stop', onStop);
        window.addEventListener('dropsiders_radio_cmd_mute', onMute);
        window.addEventListener('dropsiders_radio_cmd_volume', onVolume);
        window.addEventListener('dropsiders_radio_query_state', broadcast);
        broadcast();
        return () => {
            window.removeEventListener('dropsiders_radio_cmd_toggle', onToggle);
            window.removeEventListener('dropsiders_radio_cmd_play', onPlay);
            window.removeEventListener('dropsiders_radio_cmd_pause', onPause);
            window.removeEventListener('dropsiders_radio_cmd_stop', onStop);
            window.removeEventListener('dropsiders_radio_cmd_mute', onMute);
            window.removeEventListener('dropsiders_radio_cmd_volume', onVolume);
            window.removeEventListener('dropsiders_radio_query_state', broadcast);
        };
    }, [handlePlay, handleStop, toggleMute, isMuted]);

    return {
        isEnabled, currentSet, uiOffset, iframeRef, audioRef,
        isPlaying, isMuted, volume, effectiveVolume, isDucking, listenersCount,
        setVolume, setIsMuted, handlePlay, handleStop, toggleMute,
    };
}

type AudioState = ReturnType<typeof useRadioAudio>;

// ─── Iframe unique & Element Audio — toujours montés ────────────────────
function RadioIframe({ iframeRef, audioRef }: {
    iframeRef: React.RefObject<HTMLIFrameElement | null>;
    audioRef: React.RefObject<HTMLAudioElement | null>;
}) {
    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            width: 240,
            height: 140,
            overflow: 'hidden',
            opacity: 0.01,
            pointerEvents: 'none',
            zIndex: 1,
        }} aria-hidden="true">
            <iframe
                ref={iframeRef as React.RefObject<HTMLIFrameElement>}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title="Dropsiders Radio"
                style={{ width: '100%', height: '100%', border: 'none' }}
            />
            <audio ref={audioRef as React.RefObject<HTMLAudioElement>} playsInline preload="auto" />
        </div>
    );
}

// ─── Clé localStorage pour la position du bouton radio mobile ────────────────
const RADIO_BTN_POS_KEY = 'radio_btn_position';

function MobileRadioPlayer({ audio }: { audio: AudioState }) {
    const [expanded, setExpanded] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragMode, setDragMode] = useState(false);
    const dragRef = useRef<HTMLDivElement>(null);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasMoved = useRef(false);

    // Position initiale depuis localStorage
    const getInitialPos = () => {
        try {
            const saved = localStorage.getItem(RADIO_BTN_POS_KEY);
            if (saved) return JSON.parse(saved) as { x: number; y: number };
        } catch {}
        return { x: 0, y: 0 };
    };

    const x = useMotionValue(getInitialPos().x);
    const y = useMotionValue(getInitialPos().y);

    // Sauvegarde la position à chaque fin de drag
    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        setDragMode(false);
        try {
            localStorage.setItem(RADIO_BTN_POS_KEY, JSON.stringify({ x: x.get(), y: y.get() }));
        } catch {}
    }, [x, y]);

    // Long press pour activer le drag
    const handlePressStart = useCallback(() => {
        hasMoved.current = false;
        longPressTimer.current = setTimeout(() => {
            setDragMode(true);
        }, 400);
    }, []);

    const handlePressEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        if (!dragMode && !hasMoved.current) {
            setExpanded(true);
        }
        setDragMode(false);
        setIsDragging(false);
    }, [dragMode]);

    if (!audio.isEnabled || !audio.currentSet) return null;

    const { currentSet, uiOffset, isPlaying, isMuted, handlePlay, toggleMute } = audio;
    const progress = Math.min(100, Math.max(0, (uiOffset / (currentSet.durationSeconds || 3600)) * 100));

    return (
        <>
            {/* ── Panneau expansible (slide from bottom) ── */}
            <AnimatePresence>
                {expanded && (
                    <>
                        <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/75 backdrop-blur-sm" style={{ zIndex: 99990 }}
                            onClick={() => setExpanded(false)} />

                        <motion.div key="panel"
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                            style={{ zIndex: 99995, bottom: 0 }}
                            className="fixed left-0 right-0 rounded-t-[2rem] overflow-hidden"
                        >
                            <div className="relative bg-gradient-to-b from-[#0d0d18] to-[#050508] border-t border-white/10 px-6 pt-5 pb-10">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-28 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none" />
                                <div className="absolute bottom-0 right-0 w-40 h-40 bg-neon-red/8 rounded-full blur-3xl pointer-events-none" />

                                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

                                <div className="flex items-center justify-between mb-5 relative z-10">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan shadow-[0_0_12px_rgba(0,255,255,0.25)]">
                                            <Radio className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-display font-black text-white uppercase italic tracking-tight">
                                                DROPSIDERS <span className="text-neon-cyan">RADIO</span>
                                            </p>
                                            <p className="text-[8px] text-gray-500 uppercase tracking-widest font-bold">Web Radio Electro 24/7</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neon-red/20 text-neon-red border border-neon-red/40 text-[7px] font-black uppercase animate-pulse">
                                            <span className="w-1.5 h-1.5 rounded-full bg-neon-red" />LIVE
                                        </span>
                                        <button onClick={() => setExpanded(false)} title="Fermer" aria-label="Fermer"
                                            className="p-1.5 rounded-xl bg-white/5 text-gray-400 active:bg-white/10 active:scale-90 transition-all hover:text-white">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 mb-5 relative z-10">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-neon-cyan mb-1.5 flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5" /> EN CE MOMENT
                                    </p>
                                    <h3 className="text-[17px] font-black text-white uppercase italic tracking-tight truncate leading-tight">
                                        {currentSet.artist}
                                    </h3>
                                    <p className="text-[11px] text-gray-400 font-semibold truncate mt-0.5">
                                        {currentSet.title || (currentSet as any).event}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2.5 text-[9px] font-mono text-gray-500">
                                        <Clock className="w-3 h-3 text-neon-cyan" />
                                        <span className="text-neon-cyan font-bold">{currentSet.startTime}</span>
                                        <span className="text-gray-600">·</span>
                                        <span>{currentSet.durationFormatted}</span>
                                    </div>
                                </div>

                                <div className="mb-6 relative z-10">
                                    <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-red rounded-full transition-all duration-1000"
                                            style={{ width: `${progress}%` }} />
                                    </div>
                                    <div className="flex justify-between mt-1.5 text-[9px] font-mono text-gray-500">
                                        <span>{formatDurationExact(uiOffset)}</span>
                                        <span>{currentSet.durationFormatted}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-8 relative z-10 mb-5">
                                    <button onClick={toggleMute}
                                        className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 active:scale-90 active:bg-white/10 transition-all">
                                        {isMuted ? <VolumeX className="w-5 h-5 text-neon-red" /> : <Volume2 className="w-5 h-5" />}
                                    </button>

                                    <button onClick={handlePlay}
                                        className={`w-[76px] h-[76px] rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${isPlaying ? 'bg-neon-cyan shadow-[0_0_45px_rgba(0,255,255,0.55)]' : 'bg-white shadow-[0_0_30px_rgba(255,255,255,0.25)]'}`}>
                                        {isPlaying ? <Pause className="w-9 h-9 text-black fill-black" /> : <Play className="w-9 h-9 text-black fill-black ml-1" />}
                                    </button>

                                    <div className="w-12 h-12 flex items-center justify-center">
                                        <AudioBars playing={isPlaying} />
                                    </div>
                                </div>

                                {!isPlaying && (
                                    <p className="text-center text-[8.5px] text-gray-500 font-bold uppercase tracking-widest relative z-10 -mt-2 mb-3">
                                        Appuie sur ► pour démarrer
                                    </p>
                                )}

                                <button onClick={() => setExpanded(false)}
                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[9px] text-gray-600 font-bold uppercase tracking-widest active:text-white transition-colors relative z-10">
                                    <ChevronDown className="w-3.5 h-3.5" />Fermer
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Mini-bouton flottant DRAGGABLE ── */}
            {!expanded && (
                <motion.div
                    ref={dragRef}
                    drag
                    dragMomentum={false}
                    dragElastic={0.05}
                    style={{
                        x,
                        y,
                        zIndex: 99998,
                        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
                        right: 12,
                        position: 'fixed',
                        touchAction: 'none',
                    }}
                    dragConstraints={{
                        top: -(typeof window !== 'undefined' ? window.innerHeight - 80 : 700),
                        bottom: 0,
                        left: -(typeof window !== 'undefined' ? window.innerWidth - 160 : 300),
                        right: 0,
                    }}
                    onDragStart={() => { setIsDragging(true); setDragMode(true); hasMoved.current = true; }}
                    onDragEnd={handleDragEnd}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{
                        opacity: 1,
                        scale: dragMode ? 1.06 : 1,
                    }}
                    transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                    className="lg:hidden"
                    aria-label="Bouton radio mobile"
                >
                    {/* Halo de drag actif */}
                    <AnimatePresence>
                        {dragMode && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute -inset-2 rounded-3xl bg-neon-cyan/20 border border-neon-cyan/50 blur-sm pointer-events-none"
                            />
                        )}
                    </AnimatePresence>

                    {/* Label "Déplacer" au-dessus lors du drag */}
                    <AnimatePresence>
                        {dragMode && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap"
                            >
                                <span className="text-[8px] font-black uppercase tracking-widest text-neon-cyan bg-[#0d0d18]/90 px-2 py-0.5 rounded-full border border-neon-cyan/30">
                                    Déplacer
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Le bouton lui-même */}
                    <motion.button
                        onPointerDown={handlePressStart}
                        onPointerUp={handlePressEnd}
                        onPointerCancel={handlePressEnd}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-[#0d0d18]/95 backdrop-blur-xl border shadow-[0_0_20px_rgba(0,255,255,0.25)] transition-all group select-none ${
                            dragMode
                                ? 'border-neon-cyan/70 shadow-[0_0_25px_rgba(0,255,255,0.45)] cursor-grab active:cursor-grabbing'
                                : 'border-neon-cyan/40 cursor-pointer'
                        }`}
                        style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
                    >
                        <div className="relative shrink-0">
                            <div className={`w-7 h-7 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center ${isPlaying ? 'shadow-[0_0_12px_rgba(0,255,255,0.4)]' : ''}`}>
                                <Disc3 className={`w-4 h-4 text-neon-cyan ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                            </div>
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red animate-ping" />
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red" />
                        </div>
                        <div className="flex flex-col items-start leading-none pr-0.5">
                            <span className="text-[9px] font-black text-white tracking-wider uppercase flex items-center gap-1">
                                RADIO <span className="text-neon-cyan">LIVE</span>
                            </span>
                            <span className="text-[7.5px] font-bold uppercase tracking-tight transition-colors" style={{ color: dragMode ? 'rgba(0,255,255,0.7)' : '#9ca3af' }}>
                                {dragMode ? 'Maintenir & glisser' : 'Écouter en direct'}
                            </span>
                        </div>
                        <AudioBars playing={isPlaying} />
                        <ChevronUp className={`w-3.5 h-3.5 transition-colors ${dragMode ? 'text-neon-cyan' : 'text-neon-cyan/70 group-hover:text-neon-cyan'}`} />
                    </motion.button>
                </motion.div>
            )}
        </>
    );
}
// PLAYER DESKTOP — Barre pleine largeur en bas de page avec toggle masquer/afficher
// ═══════════════════════════════════════════════════════════════════════════════
function DesktopRadioPlayer({ audio }: { audio: AudioState }) {
    const [isHidden, setIsHidden] = useState(() => {
        try { return sessionStorage.getItem('radio_desktop_hidden') === 'true'; } catch { return false; }
    });

    if (!audio.isEnabled || !audio.currentSet) return null;

    const { currentSet, uiOffset, isPlaying, isMuted, volume, setVolume, setIsMuted,
        handlePlay, handleStop, toggleMute } = audio;
    const progress = Math.min(100, Math.max(0, (uiOffset / (currentSet.durationSeconds || 3600)) * 100));

    const handleHide = () => {
        setIsHidden(true);
        try { sessionStorage.setItem('radio_desktop_hidden', 'true'); } catch {}
    };
    const handleShow = () => {
        setIsHidden(false);
        try { sessionStorage.setItem('radio_desktop_hidden', 'false'); } catch {}
    };

    return (
        <>
            {/* Bouton réafficher (discret, en bas à gauche) — visible seulement quand masqué */}
            <AnimatePresence>
                {isHidden && (
                    <motion.button
                        key="show-btn"
                        initial={{ opacity: 0, y: 20, scale: 0.88 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.88 }}
                        transition={{ duration: 0.25 }}
                        onClick={handleShow}
                        className="hidden lg:flex fixed bottom-4 left-4 z-[100000] items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-[#0a0b12]/95 backdrop-blur-2xl border border-neon-cyan/50 shadow-[0_0_25px_rgba(0,255,255,0.25)] hover:border-neon-cyan transition-all cursor-pointer select-none group"
                        aria-label="Afficher la radio"
                    >
                        <div className="relative shrink-0">
                            <Disc3 className={`w-4 h-4 text-neon-cyan ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red animate-ping" />
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-black uppercase tracking-wider text-white leading-none">RADIO <span className="text-neon-cyan">24/7</span></span>
                            <span className="text-[8px] font-bold text-gray-400 truncate mt-0.5">{currentSet.artist}</span>
                        </div>
                        {isPlaying && (
                            <div className="flex items-end gap-0.5 h-3 ml-1 shrink-0">
                                {[{ h: '60%', d: '450ms' }, { h: '100%', d: '320ms' }, { h: '40%', d: '550ms' }].map((b, i) => (
                                    <span key={i} className="w-0.5 bg-neon-cyan rounded-full animate-pulse" style={{ height: b.h, animationDuration: b.d }} />
                                ))}
                            </div>
                        )}
                        <button onClick={e => { e.stopPropagation(); handlePlay(); }}
                            className="w-8 h-8 rounded-full bg-neon-cyan/25 hover:bg-neon-cyan text-neon-cyan hover:text-black flex items-center justify-center transition-all cursor-pointer ml-1 shrink-0 active:scale-90">
                            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                        </button>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Barre radio pleine largeur en bas (bureau) */}
            <AnimatePresence>
                {!isHidden && (
                    <motion.aside
                        key="radio-bar"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="hidden lg:block fixed bottom-0 left-0 right-0 z-[100000] select-none pointer-events-auto"
                    >
                        {/* Progress bar ultra-fine en haut de la barre */}
                        <div className="h-[2px] w-full bg-white/5">
                            <div className="h-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-red transition-all duration-1000" style={{ width: `${progress}%` }} />
                        </div>

                        <div className="flex items-center gap-5 px-6 py-3 bg-[#07070f]/98 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.7)]">
                            {/* Icône + Label Radio */}
                            <div className="flex items-center gap-2.5 shrink-0">
                                <div className={`relative p-2 rounded-xl bg-neon-cyan/15 border border-neon-cyan/40 text-neon-cyan ${isPlaying ? 'shadow-[0_0_14px_rgba(0,255,255,0.4)]' : ''}`}>
                                    <Radio className="w-4 h-4" />
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red animate-ping" />
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red" />
                                </div>
                                <div className="leading-none">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-display font-black text-white uppercase italic tracking-tight">DROPSIDERS <span className="text-neon-cyan">RADIO</span></span>
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-neon-red/25 text-neon-red border border-neon-red/50 text-[7px] font-black uppercase animate-pulse">
                                            <span className="w-1 h-1 rounded-full bg-neon-red" />LIVE
                                        </span>
                                        {audio.isDucking && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[8px] font-black uppercase tracking-wider animate-pulse">
                                                🎙️ TALK-OVER EN DIRECT
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Web Radio Electro 24/7</p>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-8 w-px bg-white/10 shrink-0" />

                            {/* Track en cours */}
                            <div className="flex-1 min-w-0">
                                <div className="text-[7.5px] font-black uppercase tracking-widest text-neon-cyan mb-0.5 flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5" /><span>EN CE MOMENT</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <h4 className="text-[13px] font-black text-white uppercase italic tracking-tight truncate">{currentSet.artist}</h4>
                                    <span className="text-white/20 text-xs">·</span>
                                    <p className="text-[10px] font-semibold text-gray-400 truncate">{currentSet.title || (currentSet as any).event}</p>
                                </div>
                            </div>

                            {/* EQ Bars */}
                            <AudioBars playing={isPlaying} />

                            {/* Temps */}
                            <div className="shrink-0 text-right hidden xl:block">
                                <div className="flex items-center gap-1.5 text-[8px] font-mono text-gray-500">
                                    <Clock className="w-2.5 h-2.5 text-neon-cyan" />
                                    <span className="text-neon-cyan">{currentSet.startTime}</span>
                                    <span>·</span>
                                    <span>{currentSet.durationFormatted}</span>
                                </div>
                                <div className="text-[8px] font-mono text-gray-600 mt-0.5">{formatDurationExact(uiOffset)} écoulé</div>
                            </div>

                            {/* Divider */}
                            <div className="h-8 w-px bg-white/10 shrink-0" />

                            {/* Volume */}
                            <div className="flex items-center gap-2 shrink-0 w-32">
                                <button onClick={toggleMute} className="p-1 text-gray-300 hover:text-white transition-colors cursor-pointer shrink-0">
                                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-neon-red" /> : <Volume2 className="w-4 h-4 text-neon-cyan" />}
                                </button>
                                <input type="range" min="0" max="100" value={isMuted ? 0 : volume}
                                    onChange={e => { setVolume(Number(e.target.value)); if (isMuted) setIsMuted(false); }}
                                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-neon-cyan" />
                            </div>

                            {/* Bouton Play/Pause */}
                            <button onClick={handlePlay}
                                className={`shrink-0 px-5 py-2 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                                    isPlaying ? 'bg-neon-cyan text-black shadow-[0_0_20px_rgba(0,255,255,0.4)]' : 'bg-white text-black hover:bg-neon-cyan hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]'
                                }`}>
                                {isPlaying ? <><Pause className="w-3.5 h-3.5 fill-current" /><span>PAUSE</span></> : <><Play className="w-3.5 h-3.5 fill-current ml-0.5" /><span>ÉCOUTER</span></>}
                            </button>

                            {/* Bouton Masquer */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={handleStop}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
                                    title="Arrêter la radio">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={handleHide}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                                    title="Masquer la barre radio">
                                    <Minimize2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT — Un seul hook, une seule iframe, partagés
// ═══════════════════════════════════════════════════════════════════════════════
// Pages du studio / générateurs où le player radio ne doit pas apparaître
const STUDIO_ROUTES = [
    '/social-studio',
    '/interview-visuals',
    '/aftermovie',
    '/recap-video',
    '/news/create',
    '/recaps/create',
    '/galerie/create',
    '/newsletter/studio',
];

export function DropsidersRadioPlayer() {
    const location = useLocation();
    const audio = useRadioAudio();
    const { activeTrack } = usePlayer();

    const isMixPage = location.pathname.startsWith('/mix');
    const isMixActive = !!activeTrack || isMixPage;

    // Masquer sur les pages studio (générateurs)
    const isStudioPage = STUDIO_ROUTES.some(route => location.pathname.startsWith(route));

    // Quand un mix est lancé et que la radio est en cours de lecture, couper la radio
    useEffect(() => {
        if (isMixActive && audio.isPlaying) {
            audio.handleStop();
        }
    }, [isMixActive, audio.isPlaying]);

    if (location.pathname === '/tv') return null;

    return (
        <>
            {/* Iframe & Audio TOUJOURS montés (jamais null) — dans le viewport, opacité 0 */}
            <RadioIframe iframeRef={audio.iframeRef} audioRef={audio.audioRef} />
            {/* Sur version mobile : dès qu'un mix est en route OU sur une page studio, masquer la radio */}
            {!isMixActive && !isStudioPage && <MobileRadioPlayer audio={audio} />}
            {/* Sur desktop : masquer aussi sur les pages studio */}
            {!isStudioPage && <DesktopRadioPlayer audio={audio} />}
        </>
    );
}
