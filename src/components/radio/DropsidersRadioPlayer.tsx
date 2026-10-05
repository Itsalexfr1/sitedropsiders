import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls, useMotionValue } from 'framer-motion';
import {
    Radio, Play, Pause, Volume2, VolumeX, Minimize2, X,
    Clock, Sparkles, Disc3, ChevronDown, ChevronUp, MessageSquare, Heart
} from 'lucide-react';
import {
    DEFAULT_RADIO_BLOCKS, STORAGE_RADIO_BLOCKS_KEY,
    getParisSeconds, formatDurationExact, getCurrentLiveRadioTrack,
    computeRadioDaySchedule, getCachedRadioDurations, saveCachedRadioDuration,
    type RadioScheduleBlock, type ComputedRadioScheduleItem
} from '../../utils/radioSchedule';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext';
import { RadioDedicationModal } from './RadioDedicationModal';

// ─── Détection mobile fiable ──────────────────────────────────────────────────
const IS_MOBILE = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// ─── URL YouTube embed ────────────────────────────────────────────────────────
// FIX MOBILE SOUND: Sur iOS, le volume YouTube via JS (setVolume) est ignoré.
// La seule façon d'avoir du son sur mobile = mute=0 dans l'URL + laisser le volume physique gérer.
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
    // ─── DOUBLE IFRAME PING-PONG (Gapless YouTube) ───────────────────────────
    // iframeRef = iframe ACTIVE (visible, son activé)
    // iframeRefB = iframe BUFFER (cachée, son muté, precharge le track suivant)
    // À chaque fin de track : on swap les deux → transition instantanée zéro blanc
    const iframeRef = useRef<HTMLIFrameElement>(null);  // slot A (actif)
    const iframeRefB = useRef<HTMLIFrameElement>(null); // slot B (buffer)
    // Quel slot est actuellement actif : 'A' ou 'B'
    const activeSlotRef = useRef<'A' | 'B'>('A');
    const audioRef = useRef<HTMLAudioElement>(null);
    // Preload audio HTML5 caché (pour les jingles audioUrl)
    const audioPreloadRef = useRef<HTMLAudioElement | null>(null);
    // Ref vers le set courant — toujours à jour, accessible en synchrone dans le click handler
    const currentSetRef = useRef<ComputedRadioScheduleItem | null>(null);
    // Timestamp du démarrage du track actuel (pour le guard anti-coupure < 90s)
    const trackStartedAtRef = useRef<number>(0);
    // Cooldown pour le sync-auto : bloc toute re-déclenchement pendant 20s après une transition
    // Fix du bug de boucle : advanceToNextTrack set uiTimeSec au futur, puis le clock
    // interval le remet à l'heure réelle, ce qui fait changer liveInfo.item.id et
    // déclenche le sync-auto à nouveau en boucle.
    const syncAutoCooldownUntilRef = useRef<number>(0);
    // Index séquentiel absolu dans la grille du jour (empèche les boucles sur le morceau 0/1)
    const currentTrackIndexRef = useRef<number>(-1);

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

    // ─── Horloge Paris (sert UNIQUEMENT au display schedule et au démarrage) ─────
    const [uiTimeSec, setUiTimeSec] = useState<number>(getParisSeconds);
    useEffect(() => {
        // Tick toutes les 5s pour garder le schedule à jour (sync auto des transitions)
        const id = setInterval(() => setUiTimeSec(getParisSeconds()), 5000);
        return () => clearInterval(id);
    }, []);

    const liveInfo = useMemo(() => getCurrentLiveRadioTrack(radioBlocks, uiTimeSec), [radioBlocks, uiTimeSec]);

    // ─── TRACK ACTIF : SOURCE DE VÉRITÉ PENDANT LA LECTURE ──────────────────────
    // activeTrack est définitivement découplé de l'horloge :
    // - Initialisé quand on appuie sur Play (= liveInfo.item de ce moment)
    // - Mis à jour UNIQUEMENT par advanceToNextTrack()
    // - Réinitialisé sur Stop
    // => Aucun setInterval, storage event ou update radioBlocks ne peut le changer.
    const [activeTrack, setActiveTrack] = useState<ComputedRadioScheduleItem | null>(null);
    const activeTrackRef = useRef<ComputedRadioScheduleItem | null>(null);
    useEffect(() => { activeTrackRef.current = activeTrack; }, [activeTrack]);

    // currentSet = activeTrack si on joue, sinon liveInfo (pour l'affichage quand en pause)
    const currentSet = activeTrack || liveInfo?.item || null;
    const uiOffset = liveInfo?.offsetSeconds ?? 0;
    const uiOffsetRef = useRef(uiOffset);
    useEffect(() => { uiOffsetRef.current = uiOffset; }, [uiOffset]);
    // Garde currentSetRef toujours à jour (pas de stale closure dans handlePlay)
    useEffect(() => { currentSetRef.current = currentSet; }, [currentSet]);

    // ─── SYNC AUTOMATIQUE : déclarée après advanceToNextTrack (voir plus bas) ───
    // Initialisé avec l'id du live actuel pour que la 1ère comparaison soit cohérente
    const liveTrackIdRef = useRef<string | undefined>(getCurrentLiveRadioTrack(radioBlocks, getParisSeconds())?.item?.id);

    // ─── État audio (UI only) ─────────────────────────────────────────────────
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState<number>(() => {
        try { const s = localStorage.getItem('dropsiders_radio_volume'); return s ? Math.max(0, Math.min(100, Number(s))) : 80; }
        catch { return 80; }
    });

    // ─── postMessage vers YouTube ────────────────────────────────────────────
    // sendCmd : envoie la commande à l'iframe ACTIVE seulement
    const sendCmd = useCallback((func: string, args: any = '') => {
        const activeIframe = activeSlotRef.current === 'A' ? iframeRef.current : iframeRefB.current;
        try {
            activeIframe?.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func, args }), '*'
            );
        } catch {}
    }, []);

    // Re-forcer le volume utilisateur sur le lecteur actif
    const applyVolumeToActiveMedia = useCallback(() => {
        if (IS_MOBILE) return;
        const vol = isMutedRef.current ? 0 : effectiveVolumeRef.current;
        if (audioRef.current) {
            audioRef.current.volume = vol / 100;
        }
        if (isMutedRef.current) {
            sendCmd('mute');
        } else {
            sendCmd('unMute');
        }
        sendCmd('setVolume', [vol]);
    }, [sendCmd]);

    // Répéter l'application du volume aux moments clés de chargement d'un nouveau son
    const scheduleVolumeEnforcement = useCallback(() => {
        if (IS_MOBILE) return;
        applyVolumeToActiveMedia();
        [50, 150, 300, 600, 1000, 1500, 2500, 4000].forEach(delay => {
            setTimeout(applyVolumeToActiveMedia, delay);
        });
    }, [applyVolumeToActiveMedia]);

    // sendCmdBuffer : envoie la commande à l'iframe BUFFER (pour le preload silencieux)
    const sendCmdBuffer = useCallback((func: string, args: any = '') => {
        const bufIframe = activeSlotRef.current === 'A' ? iframeRefB.current : iframeRef.current;
        try {
            bufIframe?.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func, args }), '*'
            );
        } catch {}
    }, []);

    // ─── Références stables ──────────────────────────────────────────────────
    const currentVideoId = currentSet?.youtubeId;
    const isPlayingRef = useRef(isPlaying);
    const isMutedRef = useRef(isMuted);
    const volumeRef = useRef(volume);
    const radioBlocksRef = useRef(radioBlocks);
    useEffect(() => { radioBlocksRef.current = radioBlocks; }, [radioBlocks]);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
    useEffect(() => { volumeRef.current = volume; }, [volume]);

    // ─── Prebuffer YouTube : track preloadé dans l'iframe buffer ────────────
    // preloadedVideoIdRef = videoId actuellement en train de charger dans le slot buffer
    const preloadedVideoIdRef = useRef<string | null>(null);
    // preloadedAudioUrlRef = audioUrl en train d'être buffé dans audioPreloadRef
    const preloadedAudioUrlRef = useRef<string | null>(null);

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

    // Suivi en temps réel des auditeurs réels (Présence multi-onglets + API réelle + ping mobile)
    useEffect(() => {
        const tabSessionId = 'tab_' + Math.random().toString(36).slice(2, 9);
        const presenceMap = new Map<string, number>();

        // BroadcastChannel : sync entre onglets du MÊME appareil uniquement
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

        // remoteViewers = auditeurs total rapportés par le serveur (TOUS appareils confondus)
        let remoteViewers = 0;

        const updateTotalCount = () => {
            const now = Date.now();
            // Nettoyage des onglets inactifs depuis plus de 6 secondes (même appareil)
            for (const [id, ts] of presenceMap.entries()) {
                if (now - ts > 6000) presenceMap.delete(id);
            }
            // Sur mobile, les auditeurs distants (API) sont la source de vérité principale
            const localActiveTabs = (isPlayingRef.current ? 1 : 0) + presenceMap.size;
            // On prend le max : si le serveur voit plus d'auditeurs que nous localement, on fait confiance au serveur
            const finalCount = Math.max(localActiveTabs, remoteViewers);
            setListenersCount(finalCount);

            // Mémorisation du pic réel & historique horaire réel (aucune simulation)
            try {
                const currentPeak = parseInt(localStorage.getItem('dropsiders_radio_peak_listeners') || '0', 10);
                if (finalCount > currentPeak) {
                    localStorage.setItem('dropsiders_radio_peak_listeners', String(finalCount));
                }

                if (finalCount > 0) {
                    const currentHour = new Date().getHours();
                    const rawHistory = localStorage.getItem('dropsiders_radio_hourly_history');
                    const history = rawHistory ? JSON.parse(rawHistory) : {};
                    history[currentHour] = Math.max(history[currentHour] || 0, finalCount);
                    localStorage.setItem('dropsiders_radio_hourly_history', JSON.stringify(history));
                }
            } catch {}
        };

        const pingPresence = async () => {
            const currentlyPlaying = isPlayingRef.current && !isMutedRef.current;

            // Broadcast local (même appareil, multi-onglets)
            if (channel) {
                try {
                    channel.postMessage({
                        type: 'radio_ping',
                        id: tabSessionId,
                        isPlaying: currentlyPlaying,
                    });
                } catch {}
            }

            // ─── PING SERVEUR (TOUS appareils, MOBILE inclus) ───────────────────────
            // Envoie notre présence au serveur → les stats admin voient les auditeurs MOBILES
            if (currentlyPlaying) {
                try {
                    await fetch('/api/radio/presence', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId: tabSessionId, isPlaying: true }),
                    });
                } catch {}
            }

            // Récupération du count total depuis le serveur (agrège TOUS les appareils)
            try {
                const res = await fetch('/api/radio/presence');
                if (res.ok) {
                    const data = await res.json();
                    if (data && typeof data.count === 'number') {
                        remoteViewers = Math.max(0, data.count);
                    } else if (data && typeof data.viewers === 'number') {
                        remoteViewers = Math.max(0, data.viewers);
                    }
                } else {
                    // Fallback sur l'ancienne API viewers si /api/radio/presence n'existe pas
                    const fallback = await fetch('/api/chat/viewers?channel=radio');
                    if (fallback.ok) {
                        const fallbackData = await fallback.json();
                        if (fallbackData && typeof fallbackData.viewers === 'number') {
                            remoteViewers = Math.max(0, fallbackData.viewers);
                        }
                    }
                }
            } catch {}

            updateTotalCount();
        };

        pingPresence();
        // Ping toutes les 5s (moins agressif sur mobile pour économiser la batterie)
        const interval = setInterval(pingPresence, IS_MOBILE ? 5000 : 3000);

        return () => {
            clearInterval(interval);
            // Signaler au serveur qu'on quitte
            try {
                fetch('/api/radio/presence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: tabSessionId, isPlaying: false }),
                }).catch(() => {});
            } catch {}
            if (channel) {
                try {
                    channel.postMessage({ type: 'radio_bye', id: tabSessionId });
                    channel.close();
                } catch {}
            }
        };
    }, []);

    // Enregistrement des sessions d'écoute réelles et durée cumulée (sans simulation)
    useEffect(() => {
        if (!isPlaying || isMuted) return;
        try {
            const currentSessions = parseInt(localStorage.getItem('dropsiders_radio_total_sessions') || '0', 10);
            localStorage.setItem('dropsiders_radio_total_sessions', String(currentSessions + 1));
        } catch {}

        const timer = setInterval(() => {
            try {
                const sec = parseInt(localStorage.getItem('dropsiders_radio_listen_sec') || '0', 10);
                localStorage.setItem('dropsiders_radio_listen_sec', String(sec + 1));
            } catch {}
        }, 1000);

        return () => clearInterval(timer);
    }, [isPlaying, isMuted]);

    // Volume effectif prenant en compte le ducking (attenuation quand l'animateur parle)
    const effectiveVolume = isDucking ? Math.max(10, Math.round(volume * 0.22)) : volume;
    const effectiveVolumeRef = useRef(effectiveVolume);
    useEffect(() => { effectiveVolumeRef.current = effectiveVolume; }, [effectiveVolume]);

    // ─── TRANSITIONS SANS COUPURE NI BAISSE DE SON (Gapless & Direct) ────────
    const currentPlayingMediaRef = useRef<string | null>(null);

    useEffect(() => {
        if (!isPlayingRef.current || !currentSet) return;

        const targetAudioVol = isMutedRef.current ? 0 : (effectiveVolumeRef.current / 100);

        if (currentSet.audioUrl) {
            const isSameAudio = currentPlayingMediaRef.current === currentSet.audioUrl && audioRef.current && !audioRef.current.paused;
            if (isSameAudio) return;

            // Si un son audio HTML5 est encore en train de jouer et n'a pas fini, le laisser aller au bout
            if (audioRef.current && !audioRef.current.paused && !audioRef.current.ended && audioRef.current.duration > 0) {
                const remaining = audioRef.current.duration - audioRef.current.currentTime;
                if (remaining > 2) {
                    return; // Ne pas couper le son avant sa fin naturelle
                }
            }

            if (audioRef.current) {
                if (audioRef.current.src !== currentSet.audioUrl) {
                    audioRef.current.src = currentSet.audioUrl;
                }
                // FIX JINGLES COUPÉS : si on est en mode activeTrack découplé (advanceToNextTrack),
                // l'uiOffset représente l'heure Paris réelle et peut être BIEN supérieur
                // à la durée réelle du fichier (∞ jingle de 15s avec offset de 660s = skip instantané).
                // => On ne se sert de l'offset QUE pour le PREMIER play (depuis l'horloge).
                // Après, chaque track avancé par advanceToNextTrack repart de 0.
                const isFirstPlay = activeTrackRef.current === null || !currentPlayingMediaRef.current;
                const targetOffset = isFirstPlay ? Math.max(0, uiOffsetRef.current || 0) : 0;
                audioRef.current.currentTime = (targetOffset > 2 && targetOffset < (audioRef.current.duration || 3600)) ? targetOffset : 0;
                // FIX VOLUME RESET: appliquer le volume AVANT play() pour éviter le reset
                audioRef.current.volume = targetAudioVol;
                audioRef.current.play().then(() => {
                    currentPlayingMediaRef.current = currentSet.audioUrl || null;
                    if (iframeRef.current && iframeRef.current.src !== 'about:blank') {
                        sendCmd('pauseVideo');
                        iframeRef.current.src = 'about:blank';
                        preloadedVideoIdRef.current = null;
                    }
                }).catch(() => {});
            }
        } else if (currentSet.youtubeId) {
            const currentYt = currentSet.youtubeId;
            const isSameYt = currentPlayingMediaRef.current === currentYt;
            if (isSameYt) return;

            // Si un son audio HTML5 est encore en cours, le laisser se terminer proprement
            if (audioRef.current && !audioRef.current.paused && !audioRef.current.ended && audioRef.current.duration > 0) {
                const remaining = audioRef.current.duration - audioRef.current.currentTime;
                if (remaining > 2) {
                    return; // Ne pas couper le son avant sa fin naturelle
                }
            }

            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
            }

            const alreadyLoaded = (iframeRef.current?.src && iframeRef.current.src.includes(currentYt)) ||
                                  (iframeRefB.current?.src && iframeRefB.current.src.includes(currentYt));

            if (!alreadyLoaded) {
                // FIX JINGLES COUPÉS : même logique que pour l'audio — offset uniquement au premier play
                const isFirstPlay = !currentPlayingMediaRef.current;
                const targetOffset = isFirstPlay ? Math.max(0, Math.floor(uiOffsetRef.current || 0)) : 0;
                const startSec = (targetOffset > 2 && targetOffset < (currentSet.durationSeconds || 3600)) ? targetOffset : 0;
                const activeIframe = activeSlotRef.current === 'A' ? iframeRef.current : iframeRefB.current;
                if (activeIframe) {
                    // FIX MOBILE SOUND: toujours mute=0 sur iOS pour que le son sorte dès le départ
                    activeIframe.src = buildSrc(currentYt, startSec, IS_MOBILE ? 0 : (isMutedRef.current ? 1 : 0));
                    preloadedVideoIdRef.current = currentYt;
                }
                currentPlayingMediaRef.current = currentYt;
                scheduleVolumeEnforcement();
                sendCmd('playVideo');
            } else {
                currentPlayingMediaRef.current = currentYt;
                scheduleVolumeEnforcement();
                sendCmd('playVideo');
            }
        }
    }, [currentSet?.id, currentSet?.audioUrl, currentSet?.youtubeId, sendCmd, scheduleVolumeEnforcement]);

    // ─── Helper : preload le track suivant en silence dans l'iframe BUFFER ────
    const preloadNextTrack = useCallback((nextTrack: ComputedRadioScheduleItem) => {
        if (!nextTrack) return;
        if (nextTrack.youtubeId && !IS_MOBILE) {
            // Charger dans l'iframe BUFFER (muted=1, start=0)
            const bufIframe = activeSlotRef.current === 'A' ? iframeRefB.current : iframeRef.current;
            if (bufIframe && preloadedVideoIdRef.current !== nextTrack.youtubeId) {
                bufIframe.src = buildSrc(nextTrack.youtubeId, 0, 1); // muted=1 toujours
                preloadedVideoIdRef.current = nextTrack.youtubeId;
            }
        } else if (nextTrack.audioUrl) {
            // Preload audio HTML5 en silence
            if (preloadedAudioUrlRef.current !== nextTrack.audioUrl) {
                if (!audioPreloadRef.current) {
                    audioPreloadRef.current = new Audio();
                    audioPreloadRef.current.preload = 'auto';
                    audioPreloadRef.current.volume = 0;
                }
                audioPreloadRef.current.src = nextTrack.audioUrl;
                audioPreloadRef.current.load();
                preloadedAudioUrlRef.current = nextTrack.audioUrl;
            }
        }
    }, []);

    // ─── ENCHAÎNEMENT : swap ping-pong instantané (zéro blanc) ──────────────
    // Pour YouTube : si le track suivant était préchargé dans le slot buffer,
    // on swap les deux iframes instantanément → transition sans blanc.
    // Pour l'audio HTML5 : on swap avec l'élément préchargé.
    const isAdvancingRef = useRef<boolean>(false);
    const advanceToNextTrack = useCallback(() => {
        if (isAdvancingRef.current) return;
        isAdvancingRef.current = true;
        setTimeout(() => { isAdvancingRef.current = false; }, 2500);

        const cur = activeTrackRef.current;

        // Si la piste précédente s'est terminée prématurément (ex: morceau de 2 min),
        // enregistrer sa durée réelle pour recaler immédiatement la grille sans aucun blanc.
        if (cur && trackStartedAtRef.current > 0) {
            const playedSec = Math.round((Date.now() - trackStartedAtRef.current) / 1000);
            if (playedSec > 10) {
                const ytId = cur.youtubeId;
                if (ytId) {
                    saveCachedRadioDuration(ytId, playedSec);
                    if (cur.id) saveCachedRadioDuration(cur.id, playedSec);
                    if (Array.isArray(radioBlocksRef.current)) {
                        radioBlocksRef.current.forEach(block => {
                            (block.tracks || []).forEach(t => {
                                if (t.youtubeId === ytId || t.id === cur.id) {
                                    t.duration = playedSec;
                                }
                            });
                        });
                    }
                }
            }
        }

        window.dispatchEvent(new CustomEvent('dropsiders_radio_track_changed'));
        trackStartedAtRef.current = Date.now();
        // Activer le cooldown : empêche l'horloge de forcer un retour en arrière sur un morceau terminé
        syncAutoCooldownUntilRef.current = Date.now() + 60000;
        try {
            const schedule = computeRadioDaySchedule(radioBlocksRef.current, getParisSeconds());
            if (!schedule || schedule.length === 0) return;

            let curIdx = currentTrackIndexRef.current;

            // Si curIdx est invalide ou négatif, retrouver la position exacte du morceau actuel dans la grille
            if (curIdx < 0 || curIdx >= schedule.length) {
                if (cur) {
                    curIdx = schedule.findIndex(s => s.id === cur.id);
                    if (curIdx < 0) {
                        curIdx = schedule.findIndex(s => s.title === cur.title && Math.abs(s.startSecondsFromMidnight - cur.startSecondsFromMidnight) < 3600);
                    }
                    if (curIdx < 0) {
                        const nowSec = getParisSeconds();
                        const candidates = schedule.filter(s => (cur.youtubeId && s.youtubeId === cur.youtubeId) || (cur.audioUrl && s.audioUrl === cur.audioUrl));
                        if (candidates.length > 0) {
                            const best = candidates.reduce((a, b) => Math.abs(a.startSecondsFromMidnight - nowSec) < Math.abs(b.startSecondsFromMidnight - nowSec) ? a : b);
                            curIdx = schedule.findIndex(s => s === best);
                        }
                    }
                }
            }

            // Avancer strictement d'un pas (+1) dans la grille quotidienne 24/7
            const nextIdx = (curIdx >= 0 && curIdx < schedule.length - 1) ? curIdx + 1 : 0;
            currentTrackIndexRef.current = nextIdx;
            const nextTrack = schedule[nextIdx];

            activeTrackRef.current = nextTrack;
            currentSetRef.current = nextTrack;
            currentPlayingMediaRef.current = nextTrack.id || nextTrack.youtubeId || nextTrack.audioUrl || null;
            setActiveTrack(nextTrack);
            setUiTimeSec(nextTrack.startSecondsFromMidnight);

            if (!isPlayingRef.current) return;

            if (nextTrack.audioUrl) {
                // ── Track audio HTML5 ────────────────────────────────────────
                // Couper les deux iframes YouTube
                [iframeRef.current, iframeRefB.current].forEach(iframe => {
                    if (iframe && iframe.src !== 'about:blank') {
                        iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*');
                        iframe.src = 'about:blank';
                    }
                });
                preloadedVideoIdRef.current = null;
                activeSlotRef.current = 'A';

                // Si le track était préchargé dans audioPreloadRef → démarrage quasi-instantané
                const isPreloaded = audioPreloadRef.current &&
                    preloadedAudioUrlRef.current === nextTrack.audioUrl &&
                    audioPreloadRef.current.readyState >= 3;

                const targetVol = isMutedRef.current ? 0 : (effectiveVolumeRef.current / 100);
                if (isPreloaded && audioPreloadRef.current) {
                    const preEl = audioPreloadRef.current;
                    preEl.volume = targetVol;
                    preEl.currentTime = 0;
                    preEl.play().catch(() => {});
                    // Copier vers l'élément principal (pour que 'ended' soit écouté sur audioRef)
                    if (audioRef.current) {
                        if (audioRef.current && !audioRef.current.paused) audioRef.current.pause();
                        audioRef.current.src = nextTrack.audioUrl;
                        audioRef.current.currentTime = 0;
                        audioRef.current.volume = targetVol;
                        audioRef.current.play().then(() => {
                            currentPlayingMediaRef.current = nextTrack.id || nextTrack.audioUrl || null;
                            preEl.pause(); preEl.src = '';
                        }).catch(() => {});
                    }
                    preloadedAudioUrlRef.current = null;
                } else if (audioRef.current) {
                    audioRef.current.src = nextTrack.audioUrl;
                    audioRef.current.currentTime = 0;
                    audioRef.current.volume = targetVol;
                    audioRef.current.play().then(() => {
                        currentPlayingMediaRef.current = nextTrack.id || nextTrack.audioUrl || null;
                    }).catch(() => {});
                }
            } else if (nextTrack.youtubeId) {
                // ── Track YouTube — SWAP PING-PONG INSTANTANÉ ────────────────
                if (audioRef.current && !audioRef.current.paused) {
                    audioRef.current.pause();
                    audioRef.current.src = '';
                }
                const ytId = nextTrack.youtubeId;
                const bufSlot = activeSlotRef.current === 'A' ? 'B' : 'A';
                const bufIframe = bufSlot === 'A' ? iframeRef.current : iframeRefB.current;
                const isPreloadedInBuffer = !IS_MOBILE &&
                    bufIframe?.src?.includes(ytId) &&
                    preloadedVideoIdRef.current === ytId;

                if (isPreloadedInBuffer && bufIframe) {
                    // ── SWAP INSTANTANÉ : activer le slot buffer → zéro blanc ──
                    activeSlotRef.current = bufSlot;
                    scheduleVolumeEnforcement();
                    bufIframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');
                    // Réinitialiser l'ancien slot (devient buffer)
                    const oldIframe = bufSlot === 'A' ? iframeRefB.current : iframeRef.current;
                    if (oldIframe) {
                        oldIframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*');
                        oldIframe.src = 'about:blank';
                    }
                    currentPlayingMediaRef.current = nextTrack.id || ytId;
                    preloadedVideoIdRef.current = null;
                    // Preloader le track N+2 en avance
                    const nextNextIdx = nextIdx < schedule.length - 1 ? nextIdx + 1 : 0;
                    setTimeout(() => preloadNextTrack(schedule[nextNextIdx]), 500);
                } else {
                    // ── Pas de preload : charger normalement (délai minimal 200ms) ──
                    const activeIframe = activeSlotRef.current === 'A' ? iframeRef.current : iframeRefB.current;
                    const mobileMute: 0 | 1 = IS_MOBILE ? 0 : (isMutedRef.current ? 1 : 0);
                    if (activeIframe) {
                        const newSrc = buildSrc(ytId, 0, mobileMute);
                        if (activeIframe.src === newSrc) {
                            sendCmd('seekTo', [0, true]);
                        } else {
                            activeIframe.src = newSrc;
                        }
                        preloadedVideoIdRef.current = ytId;
                    }
                    currentPlayingMediaRef.current = nextTrack.id || ytId;
                    scheduleVolumeEnforcement();
                    sendCmd('playVideo');
                    // Preloader N+2
                    const nextNextIdx = nextIdx < schedule.length - 1 ? nextIdx + 1 : 0;
                    setTimeout(() => preloadNextTrack(schedule[nextNextIdx]), 1000);
                }
            }
        } catch {
            setUiTimeSec(prev => (prev + 300) % 86400);
        }
    }, [sendCmd, preloadNextTrack, scheduleVolumeEnforcement]);

    // ─── SYNC AUTOMATIQUE HORLOGE → TRACK ACTIF ──────────────────────────────
    // Quand le schedule passe au bloc suivant, on force la transition si :
    //   - le track actif n'est plus dans le bon créneau horaire
    //   - ET soit c'est un track court (jingle/promo), soit on est déjà avancé
    //     de plus de 90s dans ce créneau (offset réel dans la grille horaire)
    //
    // FIX : on utilisait trackStartedAtRef (temps depuis le Play, toujours petit
    // si l'auditeur rejoignait un set en cours) → remplacé par uiOffsetRef
    // (offset réel du track actuel dans la grille, toujours correct).
    useEffect(() => {
        const newLiveId = liveInfo?.item?.id;
        const prevLiveId = liveTrackIdRef.current;

        // Mettre à jour la ref AVANT tout return pour le prochain tick
        liveTrackIdRef.current = newLiveId;

        // Une fois qu'un morceau a commencé la lecture, on ne le coupe JAMAIS en cours de route.
        // La transition se fera naturellement à la fin du morceau (événement ended / fin du clip).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [liveInfo?.item?.id]);


    // 1. Écoute de l'événement YouTube postMessage
    // States YouTube : -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued
    // Erreurs YouTube : 2=invalide, 5=HTML5 non supporté, 100=vidéo non trouvée, 101/150=restriction
    const ytStateRef = useRef<number>(-1);
    useEffect(() => {
        const handleYtMessage = (event: MessageEvent) => {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                // ── Erreur YouTube → skip automatique (géo-restriction, age-gate, vidéo supprimée)
                if (data?.event === 'onError' && isPlayingRef.current) {
                    const errCode = typeof data.info === 'number' ? data.info : 0;
                    // Codes 100, 101, 150 = vidéo indisponible → passer au track suivant
                    if ([2, 100, 101, 150].includes(errCode)) {
                        advanceToNextTrack();
                        return;
                    }
                }

                // ── Changement d'état YouTube ──
                if (
                    data &&
                    data.event === 'onStateChange' &&
                    isPlayingRef.current &&
                    currentSetRef.current?.youtubeId
                ) {
                    const prevState = ytStateRef.current;
                    ytStateRef.current = typeof data.info === 'number' ? data.info : -1;

                    if (data.info === 0) {
                        // ENDED : avancer immédiatement
                        advanceToNextTrack();
                    } else if (data.info === 1 && prevState !== 1) {
                        // PLAYING démarre → forcer la ré-application du volume utilisateur immédiatement
                        scheduleVolumeEnforcement();
                        // preloader le track suivant immédiatement dans le slot buffer pour zéro blanc (même sur sons courts)
                        const schedule = computeRadioDaySchedule(radioBlocksRef.current, getParisSeconds());
                        const curIdx = currentTrackIndexRef.current;
                        if (curIdx >= 0) {
                            const nextIdx = curIdx < schedule.length - 1 ? curIdx + 1 : 0;
                            setTimeout(() => preloadNextTrack(schedule[nextIdx]), 1500);
                        }
                    }
                }

                // ── Durée réelle rapportée par le player YouTube ──
                if (data?.info?.duration && currentSetRef.current?.youtubeId) {
                    const dur = Math.round(Number(data.info.duration));
                    if (dur > 5) {
                        try {
                            const cur = currentSetRef.current;
                            const ytId = cur?.youtubeId;
                            if (ytId) {
                                const cached = getCachedRadioDurations();
                                if (!cached[ytId] || Math.abs((cached[ytId] || 0) - dur) > 2) {
                                    saveCachedRadioDuration(ytId, dur);
                                    if (cur.id) saveCachedRadioDuration(cur.id, dur);
                                    if (Array.isArray(radioBlocksRef.current)) {
                                        radioBlocksRef.current.forEach(block => {
                                            (block.tracks || []).forEach(t => {
                                                if (t.youtubeId === ytId || t.id === cur.id) {
                                                    t.duration = dur;
                                                }
                                            });
                                        });
                                    }
                                    window.dispatchEvent(new CustomEvent('dropsiders_radio_durations_updated'));
                                }
                            }
                        } catch {}
                    }
                }

                // ── Réponse getCurrentTime polling (pour le watchdog et le preload anticipé) ──
                if (data?.event === 'infoDelivery' && data?.info?.currentTime !== undefined) {
                    const ct = data.info.currentTime as number;
                    const dur = data.info.duration as number | undefined;
                    window.dispatchEvent(new CustomEvent('yt_current_time', { detail: ct }));

                    // FIN DU TRACK : dès que ct atteint dur - 0.8s → enchaîner INSTANTANÉMENT pile au moment où ça finit
                    if (dur && dur > 5 && ct > 0 && ct >= dur - 0.8 && isPlayingRef.current) {
                        advanceToNextTrack();
                        return;
                    }

                    // Preload anticipé : quand il reste ~45s sur le track courant → s'assurer que le suivant est préchargé
                    if (dur && dur > 0 && ct > 0 && !IS_MOBILE) {
                        const remaining = dur - ct;
                        if (remaining > 0 && remaining < 45 && currentSetRef.current?.youtubeId) {
                            const schedule = computeRadioDaySchedule(radioBlocksRef.current, getParisSeconds());
                            const curIdx = currentTrackIndexRef.current;
                            if (curIdx >= 0) {
                                const nextIdx = curIdx < schedule.length - 1 ? curIdx + 1 : 0;
                                preloadNextTrack(schedule[nextIdx]);
                            }
                        }
                    }
                }
            } catch {}
        };
        window.addEventListener('message', handleYtMessage);
        return () => window.removeEventListener('message', handleYtMessage);
    }, [advanceToNextTrack, preloadNextTrack, scheduleVolumeEnforcement]);


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
                const cur = currentSetRef.current;
                try {
                    const raw = localStorage.getItem('dropsiders_radio_durations') || '{}';
                    const parsed = JSON.parse(raw);
                    if (cur.audioUrl) parsed[cur.audioUrl] = dur;
                    if (cur.youtubeId) parsed[cur.youtubeId] = dur;
                    if (cur.id) parsed[cur.id] = dur;
                    localStorage.setItem('dropsiders_radio_durations', JSON.stringify(parsed));
                } catch {}
            }
        };
        el.addEventListener('ended', onEnded);
        el.addEventListener('loadedmetadata', onLoaded);
        return () => {
            el.removeEventListener('ended', onEnded);
            el.removeEventListener('loadedmetadata', onLoaded);
        };
    }, [advanceToNextTrack]);

    // 3. ─── ANTI-BLANC audio HTML5 : stall/silence détecté (> 8s sans progression) ──
    // NOTE: seulement pour les fichiers audio (audioUrl), PAS pour YouTube
    // YouTube gère son propre buffering et on ne veut pas interférer
    useEffect(() => {
        const el = audioRef.current;
        if (!el) return;

        let silenceTimer: ReturnType<typeof setTimeout> | null = null;
        let lastTimeUpdate = Date.now();

        const clearSilenceTimer = () => {
            if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
        };
        const onTimeUpdate = () => {
            lastTimeUpdate = Date.now();
            clearSilenceTimer();
        };
        const onStalled = () => {
            if (!isPlayingRef.current || !el.src || el.src === 'about:blank') return;
            clearSilenceTimer();
            // 8 secondes de stall avant de passer au suivant (laisse le temps au fichier de charger)
            silenceTimer = setTimeout(() => {
                if (isPlayingRef.current && !el.ended) advanceToNextTrack();
            }, 8000);
        };
        const onWaiting = () => {
            if (!isPlayingRef.current || !el.src || el.src === 'about:blank') return;
            clearSilenceTimer();
            silenceTimer = setTimeout(() => {
                if (isPlayingRef.current && !el.ended && Date.now() - lastTimeUpdate > 5000) advanceToNextTrack();
            }, 8000);
        };

        el.addEventListener('timeupdate', onTimeUpdate);
        el.addEventListener('stalled', onStalled);
        el.addEventListener('waiting', onWaiting);
        return () => {
            el.removeEventListener('timeupdate', onTimeUpdate);
            el.removeEventListener('stalled', onStalled);
            el.removeEventListener('waiting', onWaiting);
            clearSilenceTimer();
        };
    }, [advanceToNextTrack]);

    // 4. ─── WATCHDOG YOUTUBE : détection de blanc / fin de clip sans événement ENDED ────
    // YouTube ne déclenche pas toujours onStateChange:0 (ended) de façon fiable.
    // FIX : on poll getCurrentTime via postMessage ET on compare la durée connue.
    // Si le time ne progresse plus depuis 12s alors qu'on est sensiblement à la fin
    // (ou si le state reste -1/2 longtemps) → on considère le clip terminé.
    useEffect(() => {
        let lastYtTime = -1;
        let lastYtTimeStamp = Date.now();
        let knownDuration = 0;
        let watchdogInterval: ReturnType<typeof setInterval> | null = null;

        const onYtCurrentTime = (e: CustomEvent) => {
            const ct = typeof e.detail === 'number' ? e.detail : -1;
            if (ct > 0) {
                if (ct !== lastYtTime) {
                    lastYtTime = ct;
                    lastYtTimeStamp = Date.now();
                }
            }
        };

        // Intercepter la durée via infoDelivery
        const onYtMessage = (event: MessageEvent) => {
            try {
                const d = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (d?.info?.duration && Number(d.info.duration) > 5) {
                    knownDuration = Math.round(Number(d.info.duration));
                }
                // Certains players envoient currentTime directement dans info
                if (typeof d?.info === 'number' && d?.event === 'infoDelivery') {
                    // format alternatif
                }
            } catch {}
        };

        // Reset du watchdog dès qu'un nouveau track démarre
        const onTrackChange = () => {
            lastYtTime = -1;
            lastYtTimeStamp = Date.now();
            knownDuration = 0;
        };
        window.addEventListener('yt_current_time', onYtCurrentTime as EventListener);
        window.addEventListener('message', onYtMessage);
        window.addEventListener('dropsiders_radio_track_changed', onTrackChange);

        watchdogInterval = setInterval(() => {
            if (!isPlayingRef.current || !currentSetRef.current?.youtubeId || currentSetRef.current?.audioUrl) return;

            // Demander la position courante au player YouTube
            sendCmd('getCurrentTime');

            const elapsed = Date.now() - lastYtTimeStamp;

            // Blanc détecté : la vidéo a commencé à jouer MAIS le temps ne progresse
            // plus depuis 12s (fin non signalée par onStateChange:0)
            // NOTE : on n'utilise PAS de comparaison avec knownDuration ici car
            // knownDuration - 3 peut être ≤0 pour les jingles courts → faux positif immédiat.
            if (
                lastYtTime > 0 &&
                elapsed > 12000 &&
                ytStateRef.current !== 2 && // pas en pause intentionnelle
                ytStateRef.current !== 3    // pas en buffering
            ) {
                console.warn('[Radio watchdog] Blanc détecté, skip track');
                lastYtTime = -1;
                lastYtTimeStamp = Date.now();
                advanceToNextTrack();
                return;
            }
        }, 3000);

        return () => {
            if (watchdogInterval) clearInterval(watchdogInterval);
            window.removeEventListener('yt_current_time', onYtCurrentTime as EventListener);
            window.removeEventListener('message', onYtMessage);
            window.removeEventListener('dropsiders_radio_track_changed', onTrackChange);
        };
    }, [advanceToNextTrack, sendCmd]);

    // 4b. ─── SUPER-WATCHDOG HORLOGE (filet de sécurité incassable) ───────────────────
    // Toutes les 10s, vérifie que le track actif est bien dans son créneau horaire.
    // Si le track actif n'est plus dans son créneau depuis > 20s → force la transition.
    // Ce watchdog est indépendant de YouTube et de l'événement 'ended' — il
    // s'assure qu'un blanc ne dure jamais plus de ~30s quoi qu'il arrive.
    useEffect(() => {
        let outOfSyncSince = 0; // timestamp où le décalage a été détecté pour la 1ère fois

        const id = setInterval(() => {
            if (!isPlayingRef.current || !activeTrackRef.current) {
                outOfSyncSince = 0;
                return;
            }

            const active = activeTrackRef.current;

            // ⚠️ NE PAS intervenir sur les jingles, promos, tops horaires et tracks courts.
            // Ces tracks sont injectés dynamiquement par advanceToNextTrack() et n'existent
            // PAS dans getCurrentLiveRadioTrack() → seraient toujours "hors-créneau".
            // On les laisse se terminer via l'événement 'ended' / watchdog YT.
            const isTransientTrack = (
                active.category === 'jingle' ||
                active.category === 'promo' ||
                active.category === 'pub' ||
                active.isTopHoraire ||
                active.isThemeJingle ||
                (active.durationSeconds ?? 9999) < 300  // < 5 min = pas un long set
            );
            if (isTransientTrack) {
                outOfSyncSince = 0;
                return;
            }

            const nowSec = getParisSeconds();
            const live = getCurrentLiveRadioTrack(radioBlocksRef.current, nowSec);
            const liveId = live?.item?.id;
            const activeId = active.id;

            // Si le créneau horaire a changé et que le track actif n'est plus le bon
            if (liveId && liveId !== activeId) {
                if (outOfSyncSince === 0) {
                    outOfSyncSince = Date.now();
                } else if (Date.now() - outOfSyncSince > 8000) {
                    console.warn('[Radio super-watchdog] Long set hors-créneau > 8s → transition forcée');
                    outOfSyncSince = 0;
                    advanceToNextTrack();
                }
            } else {
                outOfSyncSince = 0;
            }
        }, 5000);

        return () => clearInterval(id);
    }, [advanceToNextTrack]);

    // 5. ─── MOBILE BACKGROUND AUDIO : Page Visibility API ────────────────────
    // Reprendre la lecture quand l'utilisateur revient sur l'app (depuis une autre appli)
    useEffect(() => {
        if (!IS_MOBILE) return;
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isPlayingRef.current) {
                const set = currentSetRef.current;
                if (!set) return;
                if (set.audioUrl && audioRef.current && audioRef.current.paused && !audioRef.current.ended) {
                    audioRef.current.play().catch(() => {});
                }
                if (set.youtubeId && !set.audioUrl) {
                    setTimeout(() => { sendCmd('playVideo'); }, 300);
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [sendCmd]);

    // 6. ─── MediaSession API : Contrôles lock screen / notifications ──────────
    useEffect(() => {
        if (!('mediaSession' in navigator) || !currentSet) return;
        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: currentSet.title || currentSet.artist || 'Dropsiders Radio',
                artist: currentSet.artist || 'Dropsiders Radio',
                album: 'Web Radio Electro 24/7',
                artwork: [{ src: '/favicon.png', sizes: '96x96', type: 'image/png' }],
            });
            navigator.mediaSession.setActionHandler('play', () => window.dispatchEvent(new CustomEvent('dropsiders_radio_cmd_play')));
            navigator.mediaSession.setActionHandler('pause', () => window.dispatchEvent(new CustomEvent('dropsiders_radio_cmd_pause')));
            navigator.mediaSession.setActionHandler('stop', () => window.dispatchEvent(new CustomEvent('dropsiders_radio_cmd_stop')));
            navigator.mediaSession.setActionHandler('nexttrack', () => window.dispatchEvent(new CustomEvent('dropsiders_radio_cmd_next')));
        } catch {}
        return () => {
            try {
                navigator.mediaSession.setActionHandler('play', null);
                navigator.mediaSession.setActionHandler('pause', null);
                navigator.mediaSession.setActionHandler('stop', null);
                navigator.mediaSession.setActionHandler('nexttrack', null);
            } catch {}
        };
    }, [currentSet?.id]);

    useEffect(() => {
        if (!('mediaSession' in navigator)) return;
        try { navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'; } catch {}
    }, [isPlaying]);

    // ─── Play / Pause ─────────────────────────────────────────────────────────
    const handlePlay = useCallback(() => {
        const set = currentSetRef.current;
        if (!set?.youtubeId && !set?.audioUrl) return;

        if (!isPlayingRef.current) {
            if (set.audioUrl) {
                if (iframeRef.current && iframeRef.current.src !== 'about:blank') {
                    sendCmd('pauseVideo');
                    iframeRef.current.src = 'about:blank';
                }
                preloadedVideoIdRef.current = null;
                if (audioRef.current) {
                    const isSameSrc = audioRef.current.src === set.audioUrl;
                    if (!isSameSrc) {
                        audioRef.current.src = set.audioUrl;
                        // Offset frais depuis l'horloge Paris pour comportement radio
                        const freshNow = getParisSeconds();
                        const tStart = set.startSecondsFromMidnight ?? 0;
                        let off = freshNow - tStart;
                        if (off < 0) off += 86400;
                        audioRef.current.currentTime = (off > 2 && off < 21600) ? off : 0;
                    }
                    // FIX VOLUME RESET: volume appliqué AVANT play() — évite le bug de remise à zéro
                    audioRef.current.volume = isMutedRef.current ? 0 : (effectiveVolumeRef.current / 100);
                    audioRef.current.play().then(() => {
                        currentPlayingMediaRef.current = set.audioUrl || null;
                    }).catch(() => {});
                }
            } else if (set.youtubeId) {
                if (audioRef.current && !audioRef.current.paused) audioRef.current.pause();

                // Calcul FRAIS de l'offset au moment du clic (pas de ref périmée)
                // = secondes écoulées depuis le début du track selon l'horloge Paris
                const freshNowSec = getParisSeconds();
                const trackStartSec = set.startSecondsFromMidnight ?? 0;
                let freshOffset = freshNowSec - trackStartSec;
                if (freshOffset < 0) freshOffset += 86400; // wrap minuit
                // Sanity check : si offset > 6h, quelque chose est incohérent → repartir à 0
                const safeOffset = (freshOffset > 2 && freshOffset < 21600) ? Math.floor(freshOffset) : 0;

                const alreadyLoaded = !IS_MOBILE && iframeRef.current?.src?.includes(set.youtubeId);
                if (alreadyLoaded) {
                    // L'iframe est chargée mais peut-être à la mauvaise position → seekTo
                    if (safeOffset > 2) sendCmd('seekTo', [safeOffset, true]);
                    scheduleVolumeEnforcement();
                    sendCmd('playVideo');
                    currentPlayingMediaRef.current = set.youtubeId;
                } else {
                    const mobileMute = IS_MOBILE ? 0 : (isMutedRef.current ? 1 : 0);
                    const src = buildSrc(set.youtubeId, safeOffset, mobileMute as 0 | 1);
                    if (iframeRef.current) iframeRef.current.src = src;
                    preloadedVideoIdRef.current = set.youtubeId;
                    currentPlayingMediaRef.current = set.youtubeId;
                    scheduleVolumeEnforcement();
                    sendCmd('playVideo');
                }
            }
            // Lance la lecture et initialise activeTrack
            trackStartedAtRef.current = Date.now(); // marquer le début pour le guard anti-coupure
            setIsPlaying(true);
            // Figer le track actif au moment du Play (découplé de l'horloge)
            if (!activeTrackRef.current) {
                setActiveTrack(currentSetRef.current);
            }
            // Recaler l'index séquentiel dans la grille du jour
            try {
                const schedule = computeRadioDaySchedule(radioBlocksRef.current, getParisSeconds());
                const cur = currentSetRef.current;
                if (cur && schedule.length > 0) {
                    let idx = schedule.findIndex(s => s.id === cur.id);
                    if (idx < 0) {
                        idx = schedule.findIndex(s => s.title === cur.title && Math.abs(s.startSecondsFromMidnight - cur.startSecondsFromMidnight) < 3600);
                    }
                    currentTrackIndexRef.current = idx >= 0 ? idx : 0;
                }
            } catch {}

            // Preloader le track suivant ~2s après le démarrage (sur desktop uniquement)
            if (!IS_MOBILE) {
                setTimeout(() => {
                    const schedule = computeRadioDaySchedule(radioBlocksRef.current, getParisSeconds());
                    const curIdx = currentTrackIndexRef.current;
                    if (curIdx >= 0 && curIdx < schedule.length - 1) {
                        preloadNextTrack(schedule[curIdx + 1]);
                    }
                }, 2000);
            }
        } else {
            // Pause propre sans vider l'iframe ni réinitialiser la position
            if (audioRef.current) audioRef.current.pause();
            sendCmd('pauseVideo');
            setIsPlaying(false);
            // En pause : libérer activeTrack pour retomber sur l'horloge
            setActiveTrack(null);
            currentTrackIndexRef.current = -1;
            setUiTimeSec(getParisSeconds());
        }
    }, [sendCmd, preloadNextTrack, scheduleVolumeEnforcement]);

    const handleStop = useCallback(() => {
        currentPlayingMediaRef.current = null;
        preloadedVideoIdRef.current = null;
        preloadedAudioUrlRef.current = null;
        currentTrackIndexRef.current = -1;
        if (audioRef.current) audioRef.current.pause();
        if (audioPreloadRef.current) { audioPreloadRef.current.pause(); audioPreloadRef.current.src = ''; }
        // Stopper et vider les deux slots iframe
        [iframeRef.current, iframeRefB.current].forEach(iframe => {
            if (iframe) {
                iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*');
                iframe.src = 'about:blank';
            }
        });
        activeSlotRef.current = 'A'; // reset au slot A
        setIsPlaying(false);
        setActiveTrack(null);
        setUiTimeSec(getParisSeconds());
    }, []);

    const handleNext = useCallback(() => {
        advanceToNextTrack();
    }, [advanceToNextTrack]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const next = !prev;
            if (audioRef.current) audioRef.current.volume = next ? 0 : (effectiveVolumeRef.current / 100);
            if (isPlayingRef.current) {
                if (next) sendCmd('mute');
                // FIX MOBILE SOUND: iOS ignore setVolume, on force 100 et laisse le volume physique
                else { sendCmd('unMute'); sendCmd('setVolume', [IS_MOBILE ? 100 : effectiveVolumeRef.current]); }
            }
            return next;
        });
    }, [sendCmd]);

    // ─── Volume & Ducking sync ───────────────────────────────────────────────
    useEffect(() => {
        try { localStorage.setItem('dropsiders_radio_volume', String(volume)); } catch {}
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : effectiveVolume / 100;
        }
        if (!isPlaying) return;
        // FIX MOBILE SOUND: ne pas appeler setVolume sur iOS (ignoré)
        if (!isMuted && !IS_MOBILE) sendCmd('setVolume', [effectiveVolume]);
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
        const onNext = () => handleNext();
        const onMute = () => toggleMute();
        const onVolume = (e: any) => {
            if (typeof e.detail === 'number') { setVolume(Math.max(0, Math.min(100, e.detail))); if (isMuted) setIsMuted(false); }
        };
        window.addEventListener('dropsiders_radio_cmd_toggle', onToggle);
        window.addEventListener('dropsiders_radio_cmd_play', onPlay);
        window.addEventListener('dropsiders_radio_cmd_pause', onPause);
        window.addEventListener('dropsiders_radio_cmd_stop', onStop);
        window.addEventListener('dropsiders_radio_cmd_next', onNext);
        window.addEventListener('dropsiders_radio_cmd_mute', onMute);
        window.addEventListener('dropsiders_radio_cmd_volume', onVolume);
        window.addEventListener('dropsiders_radio_query_state', broadcast);
        broadcast();
        return () => {
            window.removeEventListener('dropsiders_radio_cmd_toggle', onToggle);
            window.removeEventListener('dropsiders_radio_cmd_play', onPlay);
            window.removeEventListener('dropsiders_radio_cmd_pause', onPause);
            window.removeEventListener('dropsiders_radio_cmd_stop', onStop);
            window.removeEventListener('dropsiders_radio_cmd_next', onNext);
            window.removeEventListener('dropsiders_radio_cmd_mute', onMute);
            window.removeEventListener('dropsiders_radio_cmd_volume', onVolume);
            window.removeEventListener('dropsiders_radio_query_state', broadcast);
        };
    }, [handlePlay, handleStop, handleNext, toggleMute, isMuted]);

    return {
        isEnabled, currentSet, uiOffset, iframeRef, iframeRefB, audioRef,
        isPlaying, isMuted, volume, effectiveVolume, isDucking, listenersCount,
        setVolume, setIsMuted, handlePlay, handleStop, handleNext, toggleMute,
    };
}

type AudioState = ReturnType<typeof useRadioAudio>;

// ─── Double Iframe (A + B ping-pong) + Element Audio — toujours montés ────
// Slot A = iframe active (son), Slot B = iframe buffer (preload muet).
function RadioIframe({ iframeRef, iframeRefB, audioRef }: {
    iframeRef: React.RefObject<HTMLIFrameElement | null>;
    iframeRefB: React.RefObject<HTMLIFrameElement | null>;
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
            {/* Slot A — iframe ACTIVE (par défaut) */}
            <iframe
                ref={iframeRef as React.RefObject<HTMLIFrameElement>}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title="Dropsiders Radio A"
                style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0 }}
            />
            {/* Slot B — iframe BUFFER (preload silencieux du track suivant) */}
            <iframe
                ref={iframeRefB as React.RefObject<HTMLIFrameElement>}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title="Dropsiders Radio B"
                style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0 }}
            />
            {/* FIX MOBILE BACKGROUND: x-webkit-airplay aide iOS à garder l'audio en arrière-plan */}
            <audio
                ref={audioRef as React.RefObject<HTMLAudioElement>}
                playsInline
                preload="auto"
                {...({ 'x-webkit-airplay': 'allow' } as any)}
            />
        </div>
    );
}

// ─── Clé localStorage pour la position du bouton radio mobile ────────────────
const RADIO_BTN_POS_KEY = 'radio_btn_position';
const RADIO_MESSAGES_ENABLED_KEY = 'dropsiders_radio_messages_enabled';

/** Lit la clé localStorage et se met à jour en temps réel quand l'admin toggle l'option. */
function useMessagesEnabled() {
    const [enabled, setEnabled] = useState(() => {
        try { return localStorage.getItem(RADIO_MESSAGES_ENABLED_KEY) !== 'false'; } catch { return true; }
    });
    useEffect(() => {
        const sync = () => {
            try { setEnabled(localStorage.getItem(RADIO_MESSAGES_ENABLED_KEY) !== 'false'); } catch {}
        };
        window.addEventListener('dropsiders_radio_messages_toggle', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('dropsiders_radio_messages_toggle', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);
    return enabled;
}


function MobileRadioPlayer({ audio }: { audio: AudioState }) {
    const [expanded, setExpanded] = useState(false);
    const [isDedicationOpen, setIsDedicationOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragMode, setDragMode] = useState(false);
    const navigate = useNavigate();
    const messagesEnabled = useMessagesEnabled();
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

    // ─── LIKE / VOTE pour le Top 5 Tracks ─────────────────────────────────────
    const [votedTracks, setVotedTracks] = useState<string[]>(() => {
        try {
            const s = localStorage.getItem('music_voted_tracks');
            return s ? JSON.parse(s) : [];
        } catch {
            return [];
        }
    });
    const [voteLoading, setVoteLoading] = useState(false);
    const [voteToast, setVoteToast] = useState<string | null>(null);

    const currentTrackTitle = currentSet ? `${currentSet.artist} - ${currentSet.title}`.trim() : '';
    const isCurrentTrackVoted = currentTrackTitle ? votedTracks.includes(currentTrackTitle) : false;
    const isMusicTrack = currentSet && currentSet.category !== 'jingle' && currentSet.category !== 'promo' && currentSet.category !== 'pub';

    const handleVoteCurrentTrack = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!currentSet || !isMusicTrack || !currentTrackTitle || voteLoading) return;
        if (isCurrentTrackVoted) {
            setVoteToast('Déjà voté pour ce morceau !');
            setTimeout(() => setVoteToast(null), 3000);
            return;
        }

        setVoteLoading(true);
        try {
            const res = await fetch('/api/music/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    trackTitle: currentTrackTitle,
                    media: currentSet.youtubeId || currentSet.audioUrl,
                    playerType: 'radio'
                })
            });

            if (res.ok) {
                const nextVotes = [...votedTracks, currentTrackTitle];
                setVotedTracks(nextVotes);
                try {
                    localStorage.setItem('music_voted_tracks', JSON.stringify(nextVotes));
                } catch {}
                window.dispatchEvent(new CustomEvent('dropsiders_track_voted', { detail: { track: currentTrackTitle } }));
                setVoteToast('❤️ Vote pris en compte dans le Top 5 !');
                setTimeout(() => setVoteToast(null), 3000);
            } else {
                const err = await res.json().catch(() => ({}));
                setVoteToast(err.message || 'Vote déjà enregistré');
                setTimeout(() => setVoteToast(null), 3000);
            }
        } catch {
            setVoteToast('Erreur lors du vote');
            setTimeout(() => setVoteToast(null), 3000);
        } finally {
            setVoteLoading(false);
        }
    };

    useEffect(() => {
        const syncVotes = () => {
            try {
                const s = localStorage.getItem('music_voted_tracks');
                if (s) setVotedTracks(JSON.parse(s));
            } catch {}
        };
        window.addEventListener('dropsiders_track_voted', syncVotes);
        return () => window.removeEventListener('dropsiders_track_voted', syncVotes);
    }, []);

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
                                        <button
                                            type="button"
                                            onClick={() => { setExpanded(false); window.open('/radio', '_blank', 'noopener,noreferrer'); }}
                                            className="text-left cursor-pointer hover:opacity-80 transition-opacity"
                                            title="Ouvrir la page radio"
                                        >
                                            <p className="text-[11px] font-display font-black text-white uppercase italic tracking-tight">
                                                DROPSIDERS <span className="text-neon-cyan">RADIO</span>
                                            </p>
                                            <p className="text-[8px] text-gray-500 uppercase tracking-widest font-bold">Web Radio Electro 24/7</p>
                                        </button>
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
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-neon-cyan flex items-center gap-1">
                                            <Sparkles className="w-2.5 h-2.5" /> EN CE MOMENT
                                        </p>
                                        {isMusicTrack && (
                                            <button
                                                type="button"
                                                onClick={handleVoteCurrentTrack}
                                                disabled={voteLoading}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                                    isCurrentTrackVoted
                                                        ? 'bg-red-500/20 text-neon-red border-red-500/50 shadow-[0_0_10px_rgba(255,0,85,0.3)]'
                                                        : 'bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-neon-red border-white/10'
                                                }`}
                                            >
                                                <Heart className={`w-3 h-3 ${isCurrentTrackVoted ? 'fill-current text-neon-red' : ''}`} />
                                                <span>{isCurrentTrackVoted ? 'Voté Top 5' : 'Voter Top 5'}</span>
                                            </button>
                                        )}
                                    </div>
                                    <h3 className="text-[20px] font-display font-black text-white uppercase italic tracking-tight truncate leading-tight">
                                        {currentSet.title || (currentSet as any).event}
                                    </h3>
                                    <p className="text-[12px] text-gray-300 font-bold uppercase tracking-wider truncate mt-0.5">
                                        {currentSet.artist}
                                    </p>
                                    {(currentSet.blockTitle || currentSet.blockHost) && (
                                        <p className="text-[10px] font-bold text-neon-cyan/90 uppercase tracking-wide flex items-center gap-1.5 mt-2 truncate">
                                            <span>📻 {currentSet.blockTitle || 'DROPSIDERS RADIO'}</span>
                                            {currentSet.blockHost && (
                                                <span className="text-gray-400 font-normal">· avec <span className="text-white font-bold">{currentSet.blockHost}</span></span>
                                            )}
                                        </p>
                                    )}
                                    {voteToast && (
                                        <p className="text-[10px] text-neon-cyan font-bold mt-1.5 animate-pulse">
                                            {voteToast}
                                        </p>
                                    )}
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

                                <div className="flex items-center justify-center gap-8 relative z-10 mb-4">
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

                                {/* Volume slider mobile */}
                                <div className="flex items-center gap-3 px-2 mb-5 relative z-10">
                                    <VolumeX className={`w-3.5 h-3.5 shrink-0 ${isMuted ? 'text-neon-red' : 'text-gray-500'}`} />
                                    <input
                                        type="range" min="0" max="100"
                                        value={isMuted ? 0 : audio.volume}
                                        onChange={e => { audio.setVolume(Number(e.target.value)); if (isMuted) audio.setIsMuted(false); }}
                                        className="w-full h-1.5 bg-white/15 rounded-full appearance-none accent-neon-cyan"
                                    />
                                    <Volume2 className="w-3.5 h-3.5 shrink-0 text-gray-500" />
                                </div>

                                {/* Note iOS volume : sur mobile le volume est géré par les boutons physiques */}
                                {IS_MOBILE && (
                                    <p className="text-center text-[8px] text-amber-400/70 font-bold uppercase tracking-widest relative z-10 mb-3">
                                        🔊 Volume contrôlé par les boutons physiques
                                    </p>
                                )}

                                {/* Bouton Message / Dédicace à l'animateur */}
                                {messagesEnabled && (
                                <button
                                    type="button"
                                    onClick={() => setIsDedicationOpen(true)}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-purple-500/25 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 font-display font-black text-xs uppercase italic tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-95 transition-all mb-4 relative z-10 cursor-pointer"
                                >
                                    <MessageSquare className="w-4 h-4 text-purple-300" />
                                    <span>💬 Envoyer un message à l'animateur</span>
                                </button>
                                )}

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

            <RadioDedicationModal
                isOpen={isDedicationOpen}
                onClose={() => setIsDedicationOpen(false)}
                currentTrackTitle={currentSet ? `${currentSet.artist} - ${currentSet.title}` : undefined}
            />

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
    const [isDedicationOpen, setIsDedicationOpen] = useState(false);
    const navigate = useNavigate();
    const messagesEnabled = useMessagesEnabled();

    // ─── LIKE / VOTE pour le Top 5 Tracks ─────────────────────────────────────
    const [votedTracks, setVotedTracks] = useState<string[]>(() => {
        try {
            const s = localStorage.getItem('music_voted_tracks');
            return s ? JSON.parse(s) : [];
        } catch {
            return [];
        }
    });
    const [voteLoading, setVoteLoading] = useState(false);
    const [voteToast, setVoteToast] = useState<string | null>(null);

    useEffect(() => {
        const syncVotes = () => {
            try {
                const s = localStorage.getItem('music_voted_tracks');
                if (s) setVotedTracks(JSON.parse(s));
            } catch {}
        };
        window.addEventListener('dropsiders_track_voted', syncVotes);
        return () => window.removeEventListener('dropsiders_track_voted', syncVotes);
    }, []);

    if (!audio.isEnabled || !audio.currentSet) return null;

    const { currentSet, uiOffset, isPlaying, isMuted, volume, setVolume, setIsMuted,
        handlePlay, handleStop, toggleMute } = audio;
    const progress = Math.min(100, Math.max(0, (uiOffset / (currentSet.durationSeconds || 3600)) * 100));

    const currentTrackTitle = currentSet ? `${currentSet.artist} - ${currentSet.title}`.trim() : '';
    const isCurrentTrackVoted = currentTrackTitle ? votedTracks.includes(currentTrackTitle) : false;
    const isMusicTrack = currentSet && currentSet.category !== 'jingle' && currentSet.category !== 'promo' && currentSet.category !== 'pub';

    const handleVoteCurrentTrack = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!currentSet || !isMusicTrack || !currentTrackTitle || voteLoading) return;
        if (isCurrentTrackVoted) {
            setVoteToast('Déjà voté pour ce morceau !');
            setTimeout(() => setVoteToast(null), 3000);
            return;
        }

        setVoteLoading(true);
        try {
            const res = await fetch('/api/music/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    trackTitle: currentTrackTitle,
                    media: currentSet.youtubeId || currentSet.audioUrl,
                    playerType: 'radio'
                })
            });

            if (res.ok) {
                const nextVotes = [...votedTracks, currentTrackTitle];
                setVotedTracks(nextVotes);
                try {
                    localStorage.setItem('music_voted_tracks', JSON.stringify(nextVotes));
                } catch {}
                window.dispatchEvent(new CustomEvent('dropsiders_track_voted', { detail: { track: currentTrackTitle } }));
                setVoteToast('❤️ Vote pris en compte dans le Top 5 !');
                setTimeout(() => setVoteToast(null), 3000);
            } else {
                const err = await res.json().catch(() => ({}));
                setVoteToast(err.message || 'Vote déjà enregistré');
                setTimeout(() => setVoteToast(null), 3000);
            }
        } catch {
            setVoteToast('Erreur lors du vote');
            setTimeout(() => setVoteToast(null), 3000);
        } finally {
            setVoteLoading(false);
        }
    };

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
                        <div className="flex flex-col min-w-0 text-left">
                            <span className="text-[9px] font-black uppercase tracking-wider text-white leading-none">RADIO <span className="text-neon-cyan">24/7</span></span>
                            <span className="text-[9px] font-black text-white uppercase italic truncate mt-0.5">{currentSet.title || (currentSet as any).event}</span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider truncate">{currentSet.artist}</span>
                            {(currentSet.blockTitle || currentSet.blockHost) && (
                                <span className="text-[7.5px] font-bold text-neon-cyan truncate">
                                    {currentSet.blockTitle}{currentSet.blockHost ? ` (${currentSet.blockHost})` : ''}
                                </span>
                            )}
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
                        {messagesEnabled && (
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); setIsDedicationOpen(true); }}
                            className="w-8 h-8 rounded-full bg-purple-500/25 hover:bg-purple-500 text-purple-300 hover:text-white flex items-center justify-center transition-all cursor-pointer ml-0.5 shrink-0 active:scale-90"
                            title="Envoyer un message ou une dédicace à l'animateur"
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        )}
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
                            {/* Icône + Label Radio — cliquable pour ouvrir la page radio */}
                            <button
                                type="button"
                                onClick={() => window.open('/radio', '_blank', 'noopener,noreferrer')}
                                className="flex items-center gap-2.5 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                title="Ouvrir la page radio"
                            >
                                <div className={`relative p-2 rounded-xl bg-neon-cyan/15 border border-neon-cyan/40 text-neon-cyan ${isPlaying ? 'shadow-[0_0_14px_rgba(0,255,255,0.4)]' : ''}`}>
                                    <Radio className="w-4 h-4" />
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red animate-ping" />
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red" />
                                </div>
                                <div className="leading-none text-left">
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
                            </button>

                            {/* Divider */}
                            <div className="h-8 w-px bg-white/10 shrink-0" />

                            {/* Track en cours + Nom émission + Animateur + Bouton Like */}
                            <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                                <div className="min-w-0 text-left">
                                    <div className="text-[7.5px] font-black uppercase tracking-widest text-neon-cyan mb-0.5 flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5" /><span>EN CE MOMENT</span>
                                    </div>
                                    <h4 className="text-[15px] font-display font-black text-white uppercase italic tracking-tight truncate leading-tight">
                                        {currentSet.title || (currentSet as any).event}
                                    </h4>
                                    <p className="text-[11px] font-bold text-gray-300 uppercase tracking-wider truncate mt-0.5">
                                        {currentSet.artist}
                                    </p>
                                    {(currentSet.blockTitle || currentSet.blockHost) && (
                                        <p className="text-[9px] font-bold text-neon-cyan/90 uppercase tracking-wide flex items-center gap-1.5 mt-0.5 truncate">
                                            <span>📻 {currentSet.blockTitle || 'DROPSIDERS RADIO'}</span>
                                            {currentSet.blockHost && (
                                                <span className="text-gray-400 font-normal">· avec <span className="text-white font-bold">{currentSet.blockHost}</span></span>
                                            )}
                                        </p>
                                    )}
                                </div>

                                {/* Option LIKE / VOTE pour le Top 5 */}
                                {isMusicTrack && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={handleVoteCurrentTrack}
                                            disabled={voteLoading}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-display font-black uppercase italic tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 ${
                                                isCurrentTrackVoted
                                                    ? 'bg-red-500/20 text-neon-red border-red-500/50 shadow-[0_0_15px_rgba(255,0,85,0.4)]'
                                                    : 'bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-neon-red border-white/10 hover:border-red-500/40'
                                            }`}
                                            title={isCurrentTrackVoted ? 'Morceau déjà soutenu dans le Top 5 !' : 'Voter pour ce son dans le Top 5 Dropsiders'}
                                        >
                                            <Heart className={`w-3.5 h-3.5 ${isCurrentTrackVoted ? 'fill-current text-neon-red' : ''}`} />
                                            <span className="hidden sm:inline">{isCurrentTrackVoted ? 'Voté Top 5' : 'Voter Top 5'}</span>
                                        </button>
                                        {voteToast && (
                                            <span className="text-[10px] text-neon-cyan font-bold animate-pulse hidden xl:inline">
                                                {voteToast}
                                            </span>
                                        )}
                                    </div>
                                )}
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

                            {/* Bouton Message / Dédicace à l'animateur */}
                            {messagesEnabled && (
                            <button
                                type="button"
                                onClick={() => setIsDedicationOpen(true)}
                                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-[11px] font-display font-black uppercase italic tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.25)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] active:scale-95 group"
                                title="Envoyer un message ou une dédicace en direct à l'animateur"
                            >
                                <MessageSquare className="w-3.5 h-3.5 text-purple-300 group-hover:text-white transition-colors" />
                                <span className="hidden xl:inline">Message Animateur</span>
                                <span className="xl:hidden">Message</span>
                            </button>
                            )}

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

            <RadioDedicationModal
                isOpen={isDedicationOpen}
                onClose={() => setIsDedicationOpen(false)}
                currentTrackTitle={currentSet ? `${currentSet.artist} - ${currentSet.title}` : undefined}
            />
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
            <RadioIframe iframeRef={audio.iframeRef} iframeRefB={audio.iframeRefB} audioRef={audio.audioRef} />
            {/* Sur version mobile : dès qu'un mix est en route OU sur une page studio, masquer la radio */}
            {!isMixActive && !isStudioPage && <MobileRadioPlayer audio={audio} />}
            {/* Sur desktop : masquer aussi sur les pages studio */}
            {!isStudioPage && <DesktopRadioPlayer audio={audio} />}
        </>
    );
}
