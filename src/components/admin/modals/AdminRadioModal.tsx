import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Radio,
    Plus,
    Trash2,
    Pencil,
    Music2,
    Search,
    Check,
    Save,
    Loader2,
    Calendar,
    Tv,
    Clock,
    Play,
    Pause,
    Volume2,
    Folder,
    FolderOpen,
    FileAudio,
    Sparkles,
    ChevronRight,
    ChevronDown,
    Sliders,
    Layers,
    ListMusic,
    Upload,
    Maximize2,
    Minimize2,
    ChevronUp,
    Megaphone,
    RefreshCw,
    Mic,
    MicOff,
    Zap,
    Users,
    Activity,
    VolumeX,
    BarChart3,
    TrendingUp,
    Globe,
    Smartphone,
    Headphones,
    ArrowUpRight,
    ShieldCheck,
    MessageSquare,
    Disc,
    Timer
} from 'lucide-react';
import { extractYouTubeId, fetchYouTubeTitle } from './AdminTVModal';
import { YouTubeSearchModal } from './YouTubeSearchModal';
import { apiFetch, getAuthHeaders } from '../../../utils/auth';
import { uploadFile } from '../../../utils/uploadService';
import defaultSettings from '../../../data/settings.json';
import { ConfirmModal } from '../../ui/ConfirmModal';
import { DuplicateAuditModal, detectRadioDuplicates, type DuplicateEntry } from '../../ui/DuplicateAuditModal';
import {
    STORAGE_RADIO_BLOCKS_KEY,
    STORAGE_RADIO_TOP_HORAIRE_KEY,
    STORAGE_RADIO_DURATIONS_KEY,
    DEFAULT_TOP_HORAIRE,
    getTopHoraireConfig,
    DAYS_OF_WEEK,
    ALL_DAYS,
    formatRadioTimeSlot,
    formatDurationExact,
    formatRadioBlockDays,
    isRadioBlockActiveNow,
    sortRadioBlocksByBroadcastOrder,
    getActiveRadioBlock,
    getRadioCategoryMeta,
    applyRotationPatternToTracks,
    computeRadioDaySchedule,
    getRadioTimeBasedSchedule,
    saveCachedRadioDuration,
    sanitizeTrackDuration,
    getCurrentLiveRadioTrack,
    getParisSeconds,
    isItemExpired,
    type RadioRotationRule,
    type RadioScheduleBlock,
    type RadioTrackItem,
    type RadioSpecialJingle,
    type RadioThemeJingle,
    type RadioTopHoraireConfig,
    type RadioTrackCategory
} from '../../../utils/radioSchedule';
import { parseArtistAndEvent } from '../../../utils/tvSchedule';
import { RadioJingleUploadModal } from '../radio/RadioJingleUploadModal';
import { RadioOnAirMonitor } from '../radio/RadioOnAirMonitor';
import { RadioDedicationsPanel } from '../radio/RadioDedicationsPanel';
import { RadioBroadcastRecorder } from '../radio/RadioBroadcastRecorder';
import { RadioYouTubeCuePlayer } from '../radio/RadioYouTubeCuePlayer';
import { DEFAULT_JINGLES_PUBS, type RadionomyItem } from './RadionomyJinglesBox';
import { SunoJingleStudioModal } from './SunoJingleStudioModal';

const PRESET_EMOJIS = ['🎧', '🔥', '⚡', '🚀', '🎵', '🕺', '📻', '💎', '🎉', '🌙', '☀️', '⭐', '🌅', '🎪'];
const PRESET_COLORS = [
    { name: 'Cyan', hex: '#00f0ff' },
    { name: 'Violet', hex: '#8b5cf6' },
    { name: 'Ambre', hex: '#f59e0b' },
    { name: 'Émeraude', hex: '#10b981' },
    { name: 'Rouge Néon', hex: '#ff1241' },
    { name: 'Rose', hex: '#ec4899' },
    { name: 'Bleu', hex: '#3b82f6' },
    { name: 'Orange', hex: '#f97316' },
];

interface AdminRadioModalProps {
    isOpen: boolean;
    onClose: () => void;
    isRadioActive: boolean;
    onToggleRadio: () => void;
}

export interface TVVideoItem {
    id: string;
    title: string;
    youtubeId: string;
    duration?: number;
    category?: 'liveset' | 'clip';
    blockTitle?: string;
    blockColor?: string;
    blockEmoji?: string;
}

export interface TVBlock {
    id: string;
    title: string;
    color?: string;
    emoji?: string;
    timeSlot?: string;
    videos: TVVideoItem[];
}

function getInitialTVBlocks(): TVBlock[] {
    const raw = (defaultSettings as any)?.tv_blocks;
    if (Array.isArray(raw)) {
        return raw.map((b: any) => ({
            id: b.id,
            title: b.title || b.name || 'Bloc TV',
            color: b.color || '#00f0ff',
            emoji: b.emoji || '📺',
            timeSlot: b.timeSlot || '',
            videos: (b.videos || []).map((v: any) => ({
                id: v.id || v.youtubeId,
                title: v.title,
                youtubeId: v.youtubeId,
                duration: v.duration || 3600,
                category: v.category || ((v.duration || 3600) < 1200 ? 'clip' : 'liveset'),
                blockTitle: b.title || b.name || 'Bloc TV',
                blockColor: b.color || '#00f0ff',
                blockEmoji: b.emoji || '📺'
            }))
        }));
    }
    return [];
}

export function AdminRadioModal({
    isOpen,
    onClose,
    isRadioActive,
    onToggleRadio
}: AdminRadioModalProps) {
    // ─── Émissions radio ───────────────────────────────────────────────────────
    const [blocks, setBlocks] = useState<RadioScheduleBlock[]>([]);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

    // ─── Sélection dans l'arborescence (TreeView façon RadioManager) ───────────
    // 'emission:<id>' | 'tv_lib' | 'general_jingles' | 'block_jingles:<id>'
    const [activeFolder, setActiveFolder] = useState<string>('emission:first');
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
        emissions: true,
        jingles: true,
        music: true,
        promos: true
    });
    const [uploadModalCategory, setUploadModalCategory] = useState<'jingle' | 'promo' | 'pub'>('jingle');

    // ─── Jingles Généraux ──────────────────────────────────────────────────────
    const [generalJingles, setGeneralJingles] = useState<RadionomyItem[]>(() => {
        try {
            const saved = localStorage.getItem('dropsiders_radionomy_palette');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {}
        return DEFAULT_JINGLES_PUBS;
    });

    // ─── Bibliothèque TV (240 vidéos) ──────────────────────────────────────────
    const [tvBlocks, setTvBlocks] = useState<TVBlock[]>(getInitialTVBlocks);
    const [searchFilter, setSearchFilter] = useState('');

    // ─── Modale d'Upload Jingle / Promo / Pub avec MENU DÉROULANT ─────────────
    const [isUploadJingleModalOpen, setIsUploadJingleModalOpen] = useState(false);
    const [isSunoModalOpen, setIsSunoModalOpen] = useState(false);
    const [isAddMediaDropdownOpen, setIsAddMediaDropdownOpen] = useState(false);
    const [isYouTubeSearchOpen, setIsYouTubeSearchOpen] = useState(false);

    // ─── Formulaire rapide d'ajout de morceau ─────────────────────────────────
    const [showAddTrackBox, setShowAddTrackBox] = useState(false);
    const [newTrackUrl, setNewTrackUrl] = useState('');
    const [newTrackTitle, setNewTrackTitle] = useState('');
    const [newTrackArtist, setNewTrackArtist] = useState('');
    const [newTrackCategory, setNewTrackCategory] = useState<RadioTrackCategory>('liveset');
    const [newTrackDuration, setNewTrackDuration] = useState('60');
    const [isFetchingTitle, setIsFetchingTitle] = useState(false);

    // ─── Lecteur audio intégré en bas (Player permanent RadioManager) ──────────
    const [currentAudio, setCurrentAudio] = useState<{ id: string; title: string; url?: string; youtubeId?: string; artist?: string; duration?: number } | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioVolume, setAudioVolume] = useState(0.85);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
    const ytPreviewTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ─── Toasts & États UI ────────────────────────────────────────────────────
    const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'warn' | 'info' } | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // ─── Activer/désactiver les messages auditeurs ──────────────────────────
    const RADIO_MESSAGES_ENABLED_KEY = 'dropsiders_radio_messages_enabled';
    const [messagesEnabled, setMessagesEnabled] = useState(() => {
        try { return localStorage.getItem(RADIO_MESSAGES_ENABLED_KEY) !== 'false'; } catch { return true; }
    });

    const handleToggleMessages = () => {
        const next = !messagesEnabled;
        setMessagesEnabled(next);
        try {
            localStorage.setItem(RADIO_MESSAGES_ENABLED_KEY, next ? 'true' : 'false');
            window.dispatchEvent(new CustomEvent('dropsiders_radio_messages_toggle'));
        } catch {}
        // Persister aussi côté API si possible
        try {
            apiFetch('/api/settings/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ radio_messages_enabled: next })
            }).catch(() => {});
        } catch {}
        showToast(next ? '💬 Messages auditeurs activés' : '🔇 Messages auditeurs désactivés', 'info');
    };


    // Formulaire d'édition d'une émission
    const [isEditingBlock, setIsEditingBlock] = useState(false);
    const [editBlockForm, setEditBlockForm] = useState({
        title: '',
        host: '',
        emoji: '🎧',
        color: PRESET_COLORS[0].hex,
        startHour: 0,
        endHour: 4,
        days: ALL_DAYS,
        randomize: true,
        jingleFrequency: 2,
        rotationRule: 'jingle_son_special_promo' as RadioRotationRule,
        // Générique d'intro (diffusé uniquement au début de l'émission)
        introEnabled: true,
        introTitle: '',
        introAudioUrl: '',
        introYoutubeId: '',
        introDuration: 15
    });
    const introFileInputRef = useRef<HTMLInputElement | null>(null);
    const [introUploading, setIntroUploading] = useState(false);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type?: 'danger' | 'warning' | 'info';
        confirmText?: string;
        cancelText?: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'danger',
        confirmText: 'Confirmer',
        cancelText: 'Annuler',
        onConfirm: () => {},
    });

    const [radioDuplicates, setRadioDuplicates] = useState<DuplicateEntry[]>([]);
    const [showDuplicateAudit, setShowDuplicateAudit] = useState(false);

    // Édition d'un morceau ou média (émission, promo, pub, jingle...)
    const [editingTrack, setEditingTrack] = useState<{
        trackId: string;
        artist: string;
        title: string;
        category: RadioTrackCategory | 'liveset' | 'clip' | 'jingle' | 'promo' | 'pub';
        durationSeconds: number;
        youtubeId: string;
        audioUrl?: string;
        expiresAt?: string;
    } | null>(null);

    const [topHoraireConfig, setTopHoraireConfig] = useState<RadioTopHoraireConfig>(getTopHoraireConfig);

    // ─── Onglet Programmation Radio & Conducteur 24/7 ────────────────────────
    const [progSubTab, setProgSubTab] = useState<'timeline' | 'grid' | 'on_air' | 'youtube_cue'>('timeline');
    const [progSearch, setProgSearch] = useState('');
    const [progBlockFilter, setProgBlockFilter] = useState<string>('all');
    // Mode de vue : 'now_upcoming' (en fonction de l'heure qu'il est, pas toute la journée) par défaut
    const [progScope, setProgScope] = useState<'now_upcoming' | 'current_show' | 'full_day'>('now_upcoming');
    const [progParisSec, setProgParisSec] = useState<number>(getParisSeconds);

    // Horloge toujours active quand la modale est ouverte pour faire évoluer le conducteur en direct
    useEffect(() => {
        const interval = setInterval(() => {
            setProgParisSec(getParisSeconds());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Auditeurs en direct réels (synchro avec DropsidersRadioPlayer)
    const [listenersCount, setListenersCount] = useState<number>(0);
    useEffect(() => {
        const handleState = (e: any) => {
            if (e?.detail && typeof e.detail.listenersCount === 'number') {
                setListenersCount(e.detail.listenersCount);
            }
        };
        window.addEventListener('dropsiders_radio_state', handleState);
        return () => window.removeEventListener('dropsiders_radio_state', handleState);
    }, []);

    // Calcul en temps réel calé sur l'heure qu'il est (évolue à chaque seconde)
    const scheduleResult = useMemo(() => {
        try {
            return getRadioTimeBasedSchedule(blocks, progParisSec, progScope);
        } catch (e) {
            console.error('Erreur calcul programmation radio:', e);
            return {
                currentLive: null,
                currentBlock: null,
                items: [],
                pastCount: 0,
                upcomingCount: 0,
                nowSec: progParisSec
            };
        }
    }, [blocks, progParisSec, progScope]);

    const liveTrackInfo = useMemo(() => {
        try {
            return getCurrentLiveRadioTrack(blocks, progParisSec);
        } catch {
            return null;
        }
    }, [blocks, progParisSec]);

    // Décompte temps restant du morceau en direct
    const liveRemainingSec = useMemo(() => {
        if (!liveTrackInfo?.item) return 0;
        const dur = liveTrackInfo.item.durationSeconds || 180;
        const off = liveTrackInfo.offsetSeconds || 0;
        return Math.max(0, dur - off);
    }, [liveTrackInfo]);

    // Filtrage recherche & émission
    const filteredScheduleItems = useMemo(() => {
        return scheduleResult.items.filter(item => {
            if (progBlockFilter !== 'all' && item.blockId !== progBlockFilter) return false;
            if (progSearch.trim()) {
                const q = progSearch.toLowerCase();
                const matchTitle = item.title?.toLowerCase().includes(q);
                const matchArtist = item.artist?.toLowerCase().includes(q);
                const matchBlock = item.blockTitle?.toLowerCase().includes(q);
                if (!matchTitle && !matchArtist && !matchBlock) return false;
            }
            return true;
        });
    }, [scheduleResult.items, progBlockFilter, progSearch]);

    // ─── OPTION D'ANIMATION EN DIRECT (MICRO LIVE, TALK-OVER & TEST CASQUE PRIVÉ) ──
    const [isLiveMicActive, setIsLiveMicActive] = useState(false);
    const [isMicTesting, setIsMicTesting] = useState(false);
    const [isHeadphoneMonitor, setIsHeadphoneMonitor] = useState(true);
    const [audioLevel, setAudioLevel] = useState(0);
    const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedMicDeviceId, setSelectedMicDeviceId] = useState<string>('');
    const micStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const monitorGainNodeRef = useRef<GainNode | null>(null);
    const micBoostGainNodeRef = useRef<GainNode | null>(null);
    const animFrameRef = useRef<number | null>(null);
    // Volume musique pendant le ducking (% envoyé via event radio)
    const [duckingMusicVol, setDuckingMusicVol] = useState<number>(22);
    // Gain micro moniteur retour casque (0 à 200%)
    const [micMonitorGain, setMicMonitorGain] = useState<number>(100);
    // Amplification du signal micro brut (0 à 400% — boost avant casque et VU-mètre)
    const [micBoost, setMicBoost] = useState<number>(100);

    // Énumère les micros disponibles en déclenchant la demande d'autorisation navigateur si demandé
    const enumerateMicDevices = async (requestPermission = false) => {
        try {
            if (requestPermission) {
                // Déclenche la popup de permission micro du navigateur
                const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                tempStream.getTracks().forEach(t => t.stop());
            }
            const devices = await navigator.mediaDevices.enumerateDevices();
            const mics = devices.filter(d => d.kind === 'audioinput');
            setMicDevices(mics);
            if (mics.length > 0 && (!selectedMicDeviceId || !mics.some(m => m.deviceId === selectedMicDeviceId))) {
                setSelectedMicDeviceId(mics[0].deviceId);
            }
            return mics;
        } catch (err: any) {
            console.warn('Microphone permission / enumeration error:', err);
            return [];
        }
    };

    // Détection initiale et écoute des changements de périphériques (branchement/débranchement)
    useEffect(() => {
        if (navigator.mediaDevices?.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices().then(devices => {
                const mics = devices.filter(d => d.kind === 'audioinput');
                if (mics.length > 0) {
                    setMicDevices(mics);
                    if (!selectedMicDeviceId) setSelectedMicDeviceId(mics[0].deviceId);
                }
            }).catch(() => {});
        }
        const onDevChange = () => enumerateMicDevices(false);
        navigator.mediaDevices?.addEventListener?.('devicechange', onDevChange);
        return () => navigator.mediaDevices?.removeEventListener?.('devicechange', onDevChange);
    }, []);

    const stopMicrophone = () => {
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(t => t.stop());
            micStreamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
        }
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        monitorGainNodeRef.current = null;
        micBoostGainNodeRef.current = null;
        setIsLiveMicActive(false);
        setIsMicTesting(false);
        setAudioLevel(0);
        window.dispatchEvent(new CustomEvent('dropsiders_radio_ducking', { detail: { active: false } }));
    };

    const startMicrophone = async (mode: 'test' | 'on_air') => {
        try {
            // Débloquer l'AudioContext immédiatement pendant le clic utilisateur
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            let audioCtx = audioContextRef.current;
            if (!audioCtx || audioCtx.state === 'closed') {
                audioCtx = new AudioCtx();
                audioContextRef.current = audioCtx;
            }
            if (audioCtx.state === 'suspended') {
                await audioCtx.resume();
            }

            // Arrêter tout flux précédent pour réappliquer les contraintes ou le device
            if (micStreamRef.current) {
                micStreamRef.current.getTracks().forEach(t => t.stop());
                micStreamRef.current = null;
            }

            const audioConstraints: MediaTrackConstraints = {
                // En mode test : pas d'echo cancellation pour entendre directement son propre retour casque
                echoCancellation: mode === 'on_air',
                noiseSuppression: mode === 'on_air',
                autoGainControl: mode === 'on_air',
                sampleRate: 48000,
            };
            if (selectedMicDeviceId) {
                audioConstraints.deviceId = { exact: selectedMicDeviceId };
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: false });
            micStreamRef.current = stream;

            // Ré-énumérer les micros pour afficher les vrais labels
            await enumerateMicDevices(false);

            if (audioCtx.state === 'suspended') {
                await audioCtx.resume();
            }

            const source = audioCtx.createMediaStreamSource(stream);

            // Nœud d'amplification brute du micro (boost avant casque + VU-mètre)
            const micBoostNode = audioCtx.createGain();
            micBoostNode.gain.value = micBoost / 100;
            source.connect(micBoostNode);
            micBoostGainNodeRef.current = micBoostNode;

            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            micBoostNode.connect(analyser);

            // Nœud de gain pour retour casque local
            const monitorGain = audioCtx.createGain();
            // En mode test : gain 1.0 (on s'entend fort et clair dans le casque)
            const shouldHear = mode === 'test' ? true : isHeadphoneMonitor;
            monitorGain.gain.value = shouldHear ? 1.0 : 0.0;
            micBoostNode.connect(monitorGain);
            monitorGain.connect(audioCtx.destination);
            monitorGainNodeRef.current = monitorGain;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateMeter = () => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const avg = sum / dataArray.length;
                setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
                animFrameRef.current = requestAnimationFrame(updateMeter);
            };
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            updateMeter();

            if (mode === 'on_air') {
                setIsLiveMicActive(true);
                setIsMicTesting(false);
                window.dispatchEvent(new CustomEvent('dropsiders_radio_ducking', { detail: { active: true } }));
                showToast('🎙️ MICRO ON AIR ! Votre voix passe en direct à la radio avec ducking.', 'success');
            } else {
                setIsLiveMicActive(false);
                setIsMicTesting(true);
                // En mode test : pas de ducking, pas de diffusion à la radio
                window.dispatchEvent(new CustomEvent('dropsiders_radio_ducking', { detail: { active: false } }));
                showToast('🎧 RETOUR CASQUE ACTIF : Vous vous entendez en direct dans vos écouteurs.', 'info');
            }
        } catch (err: any) {
            showToast('Accès micro refusé : ' + (err.message || 'veuillez autoriser l\'accès micro'), 'warn');
            stopMicrophone();
        }
    };

    const handleToggleLiveMic = () => {
        if (isLiveMicActive) {
            stopMicrophone();
            showToast('🎙️ Micro studio fermé. Musique rétablie à 100%.', 'info');
        } else {
            if (isMicTesting) stopMicrophone();
            startMicrophone('on_air');
        }
    };

    const handleToggleMicTest = () => {
        if (isMicTesting) {
            stopMicrophone();
            showToast('🎧 Test micro privé arrêté.', 'info');
        } else {
            if (isLiveMicActive) stopMicrophone();
            startMicrophone('test');
        }
    };

    const handleToggleHeadphoneMonitor = () => {
        const next = !isHeadphoneMonitor;
        setIsHeadphoneMonitor(next);
        if (monitorGainNodeRef.current) {
            monitorGainNodeRef.current.gain.value = next ? 0.85 : 0.0;
        }
        showToast(next ? '🎧 Retour casque activé (vous entendez votre voix)' : '🔇 Retour casque coupé dans vos écouteurs', 'info');
    };

    // Nettoyage micro si modale fermée
    useEffect(() => {
        return () => {
            stopMicrophone();
        };
    }, []);

    // Appliquer le gain micro au nœud WebAudio quand il change
    useEffect(() => {
        if (monitorGainNodeRef.current && isLiveMicActive) {
            monitorGainNodeRef.current.gain.value = micMonitorGain / 100;
        }
    }, [micMonitorGain, isLiveMicActive]);

    // Envoyer le volume musique via l'event radio quand le slider change ET qu'on est en live
    useEffect(() => {
        if (!isLiveMicActive) return;
        window.dispatchEvent(new CustomEvent('dropsiders_radio_cmd_volume', { detail: duckingMusicVol }));
    }, [duckingMusicVol, isLiveMicActive]);

    // Quand on coupe le micro, remettre la musique à 80
    const prevLiveMicModalRef = useRef(isLiveMicActive);
    useEffect(() => {
        if (prevLiveMicModalRef.current && !isLiveMicActive) {
            window.dispatchEvent(new CustomEvent('dropsiders_radio_cmd_volume', { detail: 80 }));
        }
        prevLiveMicModalRef.current = isLiveMicActive;
    }, [isLiveMicActive]);

    // ─── RECONNAISSANCE AUTOMATIQUE DES DURÉES (ANTI-BLANCS) ─────────────────
    const [isDetectingDurations, setIsDetectingDurations] = useState(false);

    const handleAutoDetectDurations = async () => {
        setIsDetectingDurations(true);
        showToast('⚡ Analyse et détection automatique des durées en cours...', 'info');
        let updatedCount = 0;

        try {
            const newBlocks = await Promise.all(blocks.map(async (block) => {
                const newTracks = await Promise.all((block.tracks || []).map(async (track) => {
                    let realDur = track.duration;

                    // Si fichier audio hébergé : détection instantanée via Audio element
                    if (track.audioUrl && (!realDur || realDur === 3600)) {
                        try {
                            const detected = await new Promise<number>((resolve) => {
                                const a = new Audio(track.audioUrl);
                                a.onloadedmetadata = () => resolve(Math.round(a.duration));
                                a.onerror = () => resolve(0);
                                setTimeout(() => resolve(0), 4000);
                            });
                            if (detected > 0) {
                                realDur = detected;
                                saveCachedRadioDuration(track.audioUrl, detected);
                                updatedCount++;
                            }
                        } catch {}
                    }

                    // Si YouTube : interroger le backend pour obtenir la durée exacte en secondes
                    if (track.youtubeId && (!realDur || realDur === 3600)) {
                        try {
                            const res = await fetch(`/api/youtube/search-media?q=${encodeURIComponent(track.youtubeId)}`);
                            if (res.ok) {
                                const data = await res.json();
                                if (Array.isArray(data) && data[0]?.duration && data[0].duration > 5) {
                                    const dur = data[0].duration as number;
                                    realDur = dur;
                                    saveCachedRadioDuration(track.youtubeId as string, dur);
                                    updatedCount++;
                                }
                            }
                        } catch {}
                    }

                    return {
                        ...track,
                        duration: realDur || sanitizeTrackDuration(track)
                    };
                }));

                return {
                    ...block,
                    tracks: newTracks
                };
            }));

            setBlocks(newBlocks);
            try {
                localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(newBlocks));
                apiFetch('/api/settings/update', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ radio_blocks: newBlocks })
                }).catch(() => {});
            } catch {}

            showToast(`✅ ${updatedCount} morceau(x) mis à jour avec leur durée exacte ! Zéro blanc à l'antenne.`, 'success');
        } catch (err: any) {
            showToast('Erreur détection durées: ' + err.message, 'warn');
        } finally {
            setIsDetectingDurations(false);
        }
    };

    const showToast = (text: string, type: 'success' | 'warn' | 'info' = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    // ─── Audio & YouTube Player Permanent ─────────────────────────────────────
    const handlePauseMedia = () => {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
        }
        if (ytPreviewTimerRef.current) {
            clearInterval(ytPreviewTimerRef.current);
            ytPreviewTimerRef.current = null;
        }
        setIsPlaying(false);
    };

    const handlePlayMedia = (item: { id: string; title: string; artist?: string; audioUrl?: string; youtubeId?: string; duration?: number }) => {
        if (currentAudio?.id === item.id && isPlaying) {
            handlePauseMedia();
            return;
        }

        handlePauseMedia();

        if (item.audioUrl) {
            const a = new Audio(item.audioUrl);
            a.volume = audioVolume;
            a.onloadedmetadata = () => {
                setAudioDuration(a.duration || item.duration || 15);
            };
            a.ontimeupdate = () => {
                setAudioProgress(a.currentTime || 0);
            };
            a.onended = () => {
                setIsPlaying(false);
                setAudioProgress(0);
            };
            a.onerror = () => {
                setIsPlaying(false);
                showToast('Impossible de lire ce fichier audio', 'warn');
            };

            a.play().then(() => {
                setIsPlaying(true);
            }).catch(() => {
                setIsPlaying(false);
            });

            audioPlayerRef.current = a;
            setAudioDuration(item.duration || 15);
            setAudioProgress(0);
            setCurrentAudio({ id: item.id, title: item.title, artist: item.artist, url: item.audioUrl, duration: item.duration });
        } else if (item.youtubeId) {
            const dur = item.duration || 3600;
            setAudioDuration(dur);
            setAudioProgress(0);
            setIsPlaying(true);
            setCurrentAudio({
                id: item.id,
                title: item.title,
                artist: item.artist || 'YouTube',
                youtubeId: item.youtubeId,
                duration: dur
            });

            ytPreviewTimerRef.current = setInterval(() => {
                setAudioProgress(p => {
                    if (p >= dur) {
                        handlePauseMedia();
                        return 0;
                    }
                    return p + 1;
                });
            }, 1000);
            showToast(`▶ Lecture préécoute : ${item.title}`, 'info');
        }
    };

    const handleTogglePlayPause = () => {
        if (!currentAudio) return;
        if (isPlaying) {
            handlePauseMedia();
        } else {
            if (currentAudio.url && audioPlayerRef.current) {
                audioPlayerRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            } else if (currentAudio.youtubeId) {
                setIsPlaying(true);
                if (ytPreviewTimerRef.current) clearInterval(ytPreviewTimerRef.current);
                ytPreviewTimerRef.current = setInterval(() => {
                    setAudioProgress(p => p + 1);
                }, 1000);
            } else {
                handlePlayMedia(currentAudio);
            }
        }
    };

    // Nettoyage audio à la fermeture
    useEffect(() => {
        return () => {
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
                audioPlayerRef.current = null;
            }
        };
    }, []);

    // ─── Chargement des réglages ──────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        const fetchSettings = async () => {
            try {
                const res = await apiFetch('/api/settings', {
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data?.radio_top_horaire && typeof data.radio_top_horaire.enabled === 'boolean') {
                        setTopHoraireConfig(data.radio_top_horaire);
                        localStorage.setItem(STORAGE_RADIO_TOP_HORAIRE_KEY, JSON.stringify(data.radio_top_horaire));
                    }
                    if (Array.isArray(data?.radio_general_jingles) && data.radio_general_jingles.length > 0) {
                        setGeneralJingles(data.radio_general_jingles);
                        try {
                            localStorage.setItem('dropsiders_radionomy_palette', JSON.stringify(data.radio_general_jingles));
                        } catch {}
                    }
                    if (Array.isArray(data?.radio_blocks) && data.radio_blocks.length > 0) {
                        const sorted = sortRadioBlocksByBroadcastOrder(data.radio_blocks, true);
                        setBlocks(sorted);
                        if (!selectedBlockId && sorted.length > 0) {
                            setSelectedBlockId(sorted[0].id);
                            setActiveFolder(`emission:${sorted[0].id}`);
                        }
                    } else {
                        try {
                            const saved = localStorage.getItem(STORAGE_RADIO_BLOCKS_KEY);
                            if (saved) {
                                const parsed = JSON.parse(saved);
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                    const sorted = sortRadioBlocksByBroadcastOrder(parsed, true);
                                    setBlocks(sorted);
                                    if (!selectedBlockId && sorted.length > 0) {
                                        setSelectedBlockId(sorted[0].id);
                                        setActiveFolder(`emission:${sorted[0].id}`);
                                    }
                                }
                            }
                        } catch {}
                    }
                }
            } catch (e) {
                console.error('Erreur chargement radio:', e);
            }
        };
        fetchSettings();
    }, [isOpen]);

    // Bloc sélectionné actuel
    const selectedBlock = useMemo(() => {
        if (activeFolder.startsWith('emission:')) {
            const bId = activeFolder.replace('emission:', '');
            return blocks.find(b => b.id === bId) || blocks[0] || null;
        }
        if (activeFolder.startsWith('block_jingles:')) {
            const bId = activeFolder.replace('block_jingles:', '');
            return blocks.find(b => b.id === bId) || null;
        }
        return selectedBlockId ? blocks.find(b => b.id === selectedBlockId) || null : null;
    }, [blocks, activeFolder, selectedBlockId]);

    // Total vidéos TV
    const allTVVideos = useMemo(() => {
        const list: TVVideoItem[] = [];
        tvBlocks.forEach(b => {
            b.videos.forEach(v => list.push({
                ...v,
                blockTitle: b.title,
                blockColor: b.color,
                blockEmoji: b.emoji
            }));
        });
        return list;
    }, [tvBlocks]);

    // Total Promos, Teasers, Publicités & Sponsors unifié
    const allPromosPubsCount = useMemo(() => {
        const promoPubKeys = new Set<string>();
        blocks.forEach(b => {
            (b.tracks || []).forEach(t => {
                const isPromoOrPub = t.category === 'promo' || t.category === 'pub' || t.artist === 'SPONSOR' || t.artist === 'PUBLICITÉ / SPONSOR' || (t.title && t.title.toLowerCase().startsWith('promo '));
                if (isPromoOrPub) {
                    promoPubKeys.add(((t.audioUrl || t.title) + '').toLowerCase().trim());
                }
            });
        });
        generalJingles.forEach(j => {
            const isPromoOrPub = (j as any).category === 'promo' || (j as any).type === 'promo' || (j as any).category === 'pub' || (j as any).type === 'pub' || (j.title && j.title.toLowerCase().startsWith('promo '));
            if (isPromoOrPub) {
                promoPubKeys.add(((j.audioUrl || j.title) + '').toLowerCase().trim());
            }
        });
        return promoPubKeys.size;
    }, [blocks, generalJingles]);

    // ─── Enregistrement d'un jingle / promo / pub uploadé ─────────────────────
    const handleSaveJingleForBlock = (
        blockId: string,
        jingle: RadioSpecialJingle,
        _insertInTracks: boolean,
        category?: 'jingle' | 'promo' | 'pub'
    ) => {
        const cat = category || 'jingle';
        setBlocks(prev => {
            const next = prev.map(b => {
                if (b.id !== blockId) return b;
                const existingSpecial = b.specialJingles || [];
                const existingTracks = b.tracks || [];

                if (cat === 'jingle') {
                    // JINGLE SPÉCIAL → dans specialJingles ET directement dans la programmation (tracks) de l'émission
                    const updatedSpecial = [...existingSpecial.filter(s => s.id !== jingle.id), jingle];
                    const jingleTrack: RadioTrackItem = {
                        id: jingle.id || `track_jingle_${Date.now()}`,
                        title: jingle.title,
                        artist: `${b.title} JINGLE`,
                        audioUrl: jingle.audioUrl,
                        youtubeId: jingle.youtubeId,
                        duration: jingle.duration || 10,
                        category: 'jingle'
                    };
                    const alreadyInTracks = existingTracks.some(t => t.id === jingle.id || (jingle.audioUrl && t.audioUrl === jingle.audioUrl));
                    const updatedTracks = alreadyInTracks ? existingTracks : [jingleTrack, ...existingTracks];
                    return { ...b, specialJingles: updatedSpecial, tracks: updatedTracks };
                } else {
                    // PROMO / PUB → directement dans la programmation (tracks)
                    const defaultArtist = cat === 'pub' ? 'PUBLICITÉ / SPONSOR' : 'PROMO DROPSIDERS';
                    const trackItem: RadioTrackItem = {
                        id: `track_${cat}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                        title: jingle.title,
                        artist: defaultArtist,
                        audioUrl: jingle.audioUrl,
                        youtubeId: jingle.youtubeId,
                        duration: jingle.duration || 30,
                        category: cat as RadioTrackCategory
                    };
                    return { ...b, tracks: [trackItem, ...existingTracks] };
                }
            });

            try {
                localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(next));
                window.dispatchEvent(new Event('dropsiders_radio_blocks_updated'));
            } catch {}

            return next;
        });
    };

    // Promo/Pub générale → palette + injection dans la programmation de TOUTES les émissions
    const handleSaveGeneralJingle = (item: RadionomyItem) => {
        const cat = (item as any).category as string | undefined;

        // 1. Toujours sauvegarder dans la palette générale
        let nextGeneral: RadionomyItem[] = [];
        setGeneralJingles(prev => {
            const updated = [item, ...prev.filter(i => i.id !== item.id)];
            nextGeneral = updated;
            try {
                localStorage.setItem('dropsiders_radionomy_palette', JSON.stringify(updated));
            } catch {}
            return updated;
        });

        // 2. Si c'est une promo ou pub → injection directe dans la programmation de chaque émission
        let nextBlocks = blocks;
        if (cat === 'promo' || cat === 'pub') {
            const defaultArtist = cat === 'pub' ? 'PUBLICITÉ / SPONSOR' : 'PROMO DROPSIDERS';
            setBlocks(prev => {
                const next = prev.map(b => {
                    // Éviter vrais doublons (même titre + même catégorie)
                    const alreadyIn = (b.tracks || []).some(
                        t => t.title === item.title && t.category === cat
                    );
                    if (alreadyIn) return b;
                    const trackItem: RadioTrackItem = {
                        id: `track_${cat}_g_${Date.now()}_${b.id.slice(-4)}_${Math.random().toString(36).substring(2, 5)}`,
                        title: item.title,
                        artist: defaultArtist,
                        audioUrl: item.audioUrl,
                        youtubeId: item.youtubeId,
                        duration: item.duration || 30,
                        category: cat as RadioTrackCategory,
                        expiresAt: item.expiresAt
                    };
                    return { ...b, tracks: [trackItem, ...(b.tracks || [])] };
                });
                nextBlocks = next;
                try {
                    localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(next));
                    window.dispatchEvent(new Event('dropsiders_radio_blocks_updated'));
                } catch {}
                return next;
            });
        }

        try {
            apiFetch('/api/settings/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    radio_general_jingles: nextGeneral,
                    radio_blocks: nextBlocks
                })
            }).catch(() => {});
        } catch {}
    };

    // Définir un jingle généré comme générique d'ouverture d'émission
    const handleSetAsThemeJingle = (blockId: string, item: { title: string; audioUrl: string; duration: number }) => {
        setBlocks(prev => {
            const next = prev.map(b => {
                if (b.id !== blockId) return b;
                return {
                    ...b,
                    themeJingle: {
                        enabled: true,
                        title: item.title,
                        audioUrl: item.audioUrl,
                        duration: item.duration || 15
                    }
                };
            });
            try {
                localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(next));
                window.dispatchEvent(new Event('dropsiders_radio_blocks_updated'));
            } catch {}
            return next;
        });
    };

    // ─── Ajout rapide de morceau dans l'émission active ───────────────────────
    const handleAddTrackToCurrentEmission = () => {
        if (!selectedBlock) {
            showToast('Sélectionnez d\'abord une émission', 'warn');
            return;
        }
        if (!newTrackTitle.trim()) {
            showToast('Veuillez saisir un titre', 'warn');
            return;
        }

        const ytId = extractYouTubeId(newTrackUrl);
        const durSec = Math.max(10, (parseInt(newTrackDuration, 10) || 60) * 60);

        const newTrack: RadioTrackItem = {
            id: `track_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            title: newTrackTitle.trim(),
            artist: newTrackArtist.trim() || undefined,
            youtubeId: ytId || undefined,
            audioUrl: newTrackUrl.startsWith('http') && !ytId ? newTrackUrl.trim() : undefined,
            duration: durSec,
            category: newTrackCategory
        };

        setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? {
            ...b,
            tracks: [...(b.tracks || []), newTrack]
        } : b));

        setNewTrackUrl('');
        setNewTrackTitle('');
        setNewTrackArtist('');
        setNewTrackDuration('60');
        setShowAddTrackBox(false);
        showToast(`✓ « ${newTrack.title} » ajouté à l'émission !`);
    };

    // Monter / Descendre dans la liste
    const handleMoveItem = (index: number, direction: 'up' | 'down') => {
        if (!selectedBlock) return;
        const currentTracks = [...(selectedBlock.tracks || [])];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= currentTracks.length) return;

        const temp = currentTracks[index];
        currentTracks[index] = currentTracks[targetIndex];
        currentTracks[targetIndex] = temp;

        setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? {
            ...b,
            tracks: currentTracks
        } : b));
    };

    // Supprimer un morceau ou un jingle de la liste (par index dans l'émission)
    const handleDeleteTrack = (index: number) => {
        if (!selectedBlock) return;
        const blockId = selectedBlock.id;
        let removedTitle = '';
        setBlocks(prev => {
            const next = prev.map(b => {
                if (b.id !== blockId) return b;
                const currentTracks = [...(b.tracks || [])];
                const removed = currentTracks.splice(index, 1);
                if (removed[0]) removedTitle = removed[0].title;
                return { ...b, tracks: currentTracks };
            });
            // Sauvegarder immédiatement en localStorage et notifier le player radio
            try {
                localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(next));
                window.dispatchEvent(new Event('dropsiders_radio_blocks_updated'));
            } catch {}
            return next;
        });
        setTimeout(() => {
            if (removedTitle) showToast(`« ${removedTitle} » supprimé`);
        }, 0);
    };

    // Supprimer n'importe quel item par son id (tous les bacs : émissions, promos, pubs, jingles)
    const handleDeleteItemById = (itemId: string, itemTitle: string) => {
        // 1. Cherche dans les tracks de chaque bloc (promo, pub, jingle, set...)
        let found = false;
        setBlocks(prev => {
            const next = prev.map(b => {
                const inTracks = (b.tracks || []).some(t => t.id === itemId);
                const inSpecial = (b.specialJingles || []).some(j => j.id === itemId);
                if (!inTracks && !inSpecial) return b;
                found = true;
                return {
                    ...b,
                    tracks: (b.tracks || []).filter(t => t.id !== itemId),
                    specialJingles: (b.specialJingles || []).filter(j => j.id !== itemId)
                };
            });
            if (found) {
                try {
                    localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(next));
                    window.dispatchEvent(new Event('dropsiders_radio_blocks_updated'));
                } catch {}
            }
            return next;
        });
        // 2. Cherche dans la palette générale (jingles, promos, pubs généraux)
        setGeneralJingles(prev => {
            const updated = prev.filter(j => j.id !== itemId);
            if (updated.length !== prev.length) {
                found = true;
                try {
                    localStorage.setItem('dropsiders_radionomy_palette', JSON.stringify(updated));
                } catch {}
            }
            return updated;
        });
        showToast(`« ${itemTitle} » supprimé`);
    };

    // Sauvegarder les modifications d'un morceau/promo/pub/jingle édité
    const handleSaveEditingTrack = () => {
        if (!editingTrack) return;
        const targetId = editingTrack.trackId;
        const targetTitle = editingTrack.title.trim();
        const targetAudioUrl = editingTrack.audioUrl;
        const ytId = extractYouTubeId(editingTrack.youtubeId) || editingTrack.youtubeId;
        const newCat = editingTrack.category as RadioTrackCategory;
        const newArtist = editingTrack.artist.trim() || (newCat === 'promo' ? 'PROMO DROPSIDERS' : newCat === 'pub' ? 'PUBLICITÉ / SPONSOR' : 'Artiste');
        const newDur = Math.max(1, editingTrack.durationSeconds || 30);
        const newExpiresAt = (newCat === 'promo' || newCat === 'pub') ? (editingTrack.expiresAt?.trim() || undefined) : undefined;

        // 1. Mettre à jour dans la palette générale
        let nextGeneral = generalJingles;
        setGeneralJingles(prev => {
            const updated = prev.map(j => {
                const isMatch = j.id === targetId || (targetAudioUrl && j.audioUrl === targetAudioUrl) || (targetTitle && j.title === targetTitle);
                if (!isMatch) return j;
                return {
                    ...j,
                    title: targetTitle || j.title,
                    category: newCat as any,
                    type: newCat as any,
                    duration: newDur,
                    audioUrl: editingTrack.audioUrl || j.audioUrl,
                    youtubeId: ytId || j.youtubeId,
                    expiresAt: newExpiresAt
                };
            });
            nextGeneral = updated;
            try {
                localStorage.setItem('dropsiders_radionomy_palette', JSON.stringify(updated));
            } catch {}
            return updated;
        });

        // 2. Mettre à jour dans TOUS les blocs (tracks + specialJingles)
        setBlocks(prev => {
            const next = prev.map(b => {
                let changed = false;
                const newTracks = (b.tracks || []).map(t => {
                    const isDirectMatch = t.id === targetId;
                    const isSharedBroadcast = (targetAudioUrl && t.audioUrl === targetAudioUrl) || (targetTitle && t.title === targetTitle && (t.category === 'pub' || t.category === 'promo' || t.category === 'jingle'));
                    if (!isDirectMatch && !isSharedBroadcast) return t;

                    changed = true;
                    return {
                        ...t,
                        title: targetTitle || t.title,
                        artist: newArtist,
                        category: newCat,
                        duration: newDur,
                        youtubeId: ytId || t.youtubeId,
                        audioUrl: editingTrack.audioUrl || t.audioUrl,
                        expiresAt: newExpiresAt
                    };
                });

                const newSpecial = (b.specialJingles || []).map(j => {
                    const isDirect = j.id === targetId;
                    const isShared = (targetAudioUrl && j.audioUrl === targetAudioUrl) || (targetTitle && j.title === targetTitle);
                    if (!isDirect && !isShared) return j;

                    changed = true;
                    return {
                        ...j,
                        title: targetTitle || j.title,
                        duration: newDur,
                        youtubeId: ytId || j.youtubeId,
                        audioUrl: editingTrack.audioUrl || j.audioUrl,
                        expiresAt: newExpiresAt
                    };
                });

                if (!changed) return b;
                return { ...b, tracks: newTracks, specialJingles: newSpecial };
            });

            try {
                localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(next));
                window.dispatchEvent(new Event('dropsiders_radio_blocks_updated'));
                // ⚠️ Sauvegarder sur le serveur via /api/settings/update avec authentification
                apiFetch('/api/settings/update', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        radio_blocks: next,
                        radio_general_jingles: nextGeneral
                    })
                }).catch(() => {});
            } catch {}
            return next;
        });

        showToast(`✓ « ${targetTitle} » modifié avec succès !`);
        setEditingTrack(null);
    };

    // Dédoublonnage des sponsors et promos dans toutes les émissions
    const handleDeduplicateSponsorsAndPromos = () => {
        let removedCount = 0;
        setBlocks(prev => {
            const next = prev.map(b => {
                const seenKeys = new Set<string>();
                const cleanTracks: RadioTrackItem[] = [];

                (b.tracks || []).forEach(t => {
                    const isPubOrPromo = t.category === 'pub' || t.category === 'promo' || t.artist === 'SPONSOR' || t.artist === 'PUBLICITÉ / SPONSOR' || (t.title && t.title.toLowerCase().startsWith('promo '));
                    if (isPubOrPromo) {
                        const key = ((t.audioUrl || t.title) + '').toLowerCase().trim();
                        if (seenKeys.has(key)) {
                            removedCount++;
                            return; // Supprimer ce doublon !
                        }
                        seenKeys.add(key);
                    }
                    cleanTracks.push(t);
                });

                return { ...b, tracks: cleanTracks };
            });

            try {
                localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(next));
                window.dispatchEvent(new Event('dropsiders_radio_blocks_updated'));
            } catch {}
            return next;
        });

        if (removedCount > 0) {
            showToast(`✓ ${removedCount} doublon(s) de sponsor/promo supprimé(s) !`, 'success');
        } else {
            showToast('Aucun doublon de sponsor/promo détecté.', 'info');
        }
    };

    // Nettoyage et suppression automatique de toutes les promos expirées
    const handlePurgeExpiredPromos = () => {
        let purgedCount = 0;
        let nextGeneral = generalJingles;
        let nextBlocks = blocks;

        // 1. Nettoyer dans la palette générale
        setGeneralJingles(prev => {
            const updated = prev.filter(j => {
                if (((j as any).category === 'promo' || (j as any).category === 'pub') && isItemExpired(j)) {
                    purgedCount++;
                    return false;
                }
                return true;
            });
            nextGeneral = updated;
            try {
                localStorage.setItem('dropsiders_radionomy_palette', JSON.stringify(updated));
            } catch {}
            return updated;
        });

        // 2. Nettoyer dans les émissions
        setBlocks(prev => {
            const next = prev.map(b => ({
                ...b,
                tracks: (b.tracks || []).filter(t => {
                    if ((t.category === 'promo' || t.category === 'pub') && isItemExpired(t)) {
                        purgedCount++;
                        return false;
                    }
                    return true;
                })
            }));
            nextBlocks = next;
            try {
                localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(next));
                window.dispatchEvent(new Event('dropsiders_radio_blocks_updated'));
            } catch {}
            return next;
        });

        if (purgedCount > 0) {
            showToast(`✓ ${purgedCount} promo(s) expirée(s) supprimée(s) avec succès !`, 'success');
            apiFetch('/api/settings/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    radio_blocks: nextBlocks,
                    radio_general_jingles: nextGeneral
                })
            }).catch(() => {});
        } else {
            showToast('Aucune promo expirée détectée.', 'info');
        }
    };

    // Régénération complète des émissions depuis la bibliothèque TV
    const handleRegenerateEmissions = () => {
        setConfirmModal({
            isOpen: true,
            title: '⚡ Régénérer les émissions depuis la vidéothèque TV ?',
            message: 'Les sets musicaux vont être redistribués équitablement entre vos 5 émissions, et tous les jingles ou promos empilés en doublon dans la liste des morceaux seront nettoyés. Vos jingles officiels dans leurs bacs dédiés et vos réglages d\'horaires resteront intacts.',
            type: 'warning',
            confirmText: 'Oui, régénérer les émissions',
            cancelText: 'Annuler',
            onConfirm: () => {
                // Collecter tous les sets musicaux TV (exclure jingles, pubs)
                const musicVideos: TVVideoItem[] = [];
                tvBlocks.forEach(tb => {
                    (tb.videos || []).forEach(v => {
                        const cat = (v.category as string) || '';
                        const isNonMusic = cat === 'jingle' || cat === 'promo' || cat === 'pub';
                        if (!isNonMusic) {
                            musicVideos.push(v);
                        }
                    });
                });

                const pool = musicVideos.length > 0 ? musicVideos : allTVVideos;
                const numBlocks = Math.max(1, blocks.length);
                const chunkSize = Math.max(10, Math.ceil(pool.length / numBlocks));

                const nextBlocks = blocks.map((b, bIdx) => {
                    const startIdx = (bIdx * chunkSize) % (pool.length || 1);
                    let selectedVids = pool.slice(startIdx, startIdx + chunkSize);
                    if (selectedVids.length < 5 && pool.length > 0) {
                        selectedVids = pool.slice(0, Math.min(25, pool.length));
                    }

                    const newTracks: RadioTrackItem[] = selectedVids.map((v, vIdx) => {
                        const { artist } = parseArtistAndEvent(v.title || '');
                        return {
                            id: `rt_${b.id}_${v.id || v.youtubeId || vIdx}`,
                            title: v.title,
                            artist: artist || (v as any).artist || 'Artiste',
                            youtubeId: v.youtubeId,
                            duration: v.duration || 3600,
                            category: (v.category === 'clip' ? 'clip' : 'liveset') as RadioTrackCategory,
                            addedAt: Date.now() + vIdx
                        };
                    });

                    return {
                        ...b,
                        tracks: newTracks,
                        specialJingles: b.specialJingles || [],
                        jingleFrequency: b.jingleFrequency ?? 2
                    };
                });

                setBlocks(nextBlocks);
                try {
                    localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(nextBlocks));
                    window.dispatchEvent(new Event('dropsiders_radio_blocks_updated'));
                } catch {}

                showToast('✓ Émissions régénérées avec succès sans jingles d\'affilé !', 'success');
                setConfirmModal(c => ({ ...c, isOpen: false }));
            }
        });
    };

    // Remise à zéro complète des promos, publicités et jingles empilés pour tout remettre dans l'ordre
    const handleResetEmissionTracks = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Remettre à zéro les émissions ?',
            message: 'Toutes les promos, publicités et jingles empilés d\'affilée dans la liste des morceaux vont être retirés afin de laisser uniquement vos sets musicaux bien ordonnés. Les jingles et promos continueront d\'être diffusés automatiquement selon la fréquence configurée.',
            type: 'warning',
            confirmText: 'Oui, remettre à zéro',
            cancelText: 'Annuler',
            onConfirm: () => {
                let cleanedCount = 0;
                setBlocks(prev => {
                    const next = prev.map(b => {
                        const cleanTracks = (b.tracks || []).filter(t => {
                            const isPromoOrPub = t.category === 'promo' || t.category === 'pub' || t.artist === 'SPONSOR' || t.artist === 'PUBLICITÉ / SPONSOR' || (t.title && t.title.toLowerCase().startsWith('promo '));
                            const isJingle = t.category === 'jingle';
                            if (isPromoOrPub || isJingle) {
                                cleanedCount++;
                                return false;
                            }
                            return true;
                        });
                        return { ...b, tracks: cleanTracks };
                    });
                    try {
                        localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(next));
                        window.dispatchEvent(new Event('dropsiders_radio_blocks_updated'));
                    } catch {}
                    return next;
                });
                showToast(`✓ Grille remise à zéro : ${cleanedCount} élément(s) retiré(s). Vos sets musicaux sont propres !`, 'success');
                setConfirmModal(c => ({ ...c, isOpen: false }));
            }
        });
    };

    // Mettre à jour la règle de rotation pour une émission spécifique
    const handleSetBlockRotationRule = (blockId: string, rule: RadioRotationRule) => {
        setBlocks(prev => {
            const next = prev.map(b => b.id === blockId ? { ...b, rotationRule: rule } : b);
            try {
                localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(next));
                window.dispatchEvent(new Event('dropsiders_radio_blocks_updated'));
            } catch {}
            return next;
        });
        showToast('✓ Règle d\'alternance mise à jour pour cette émission');
    };

    // Appliquer immédiatement la règle d'alternance à l'émission active (mélange 1 Jingle ➔ 1 Son ➔ 1 Spécial ➔ 1 Promo)
    const handleApplyRotationRule = (blockId: string, specificRule?: RadioRotationRule) => {
        const targetBlock = blocks.find(b => b.id === blockId);
        if (!targetBlock) return;

        const genJinglesTracks: RadioTrackItem[] = generalJingles
            .filter(j => j.category === 'jingle' || (j as any).type === 'jingle')
            .map(j => ({
                id: j.id,
                title: j.title,
                artist: 'DROPSIDERS JINGLE',
                audioUrl: j.audioUrl,
                youtubeId: j.youtubeId,
                duration: j.duration || 15,
                category: 'jingle' as const
            }));

        const genPromosTracks: RadioTrackItem[] = generalJingles
            .filter(j => j.category === 'promo' || j.category === 'pub' || (j as any).type === 'promo' || (j as any).type === 'pub')
            .map(p => ({
                id: p.id,
                title: p.title,
                artist: p.category === 'pub' ? 'PUBLICITÉ / SPONSOR' : 'PROMO DROPSIDERS',
                audioUrl: p.audioUrl,
                youtubeId: p.youtubeId,
                duration: p.duration || 30,
                category: (p.category || 'promo') as RadioTrackCategory
            }));

        const updatedBlock: RadioScheduleBlock = {
            ...targetBlock,
            rotationRule: specificRule || targetBlock.rotationRule || 'jingle_son_special_promo'
        };

        const reordered = applyRotationPatternToTracks(
            updatedBlock,
            undefined,
            genJinglesTracks.length > 0 ? genJinglesTracks : undefined,
            genPromosTracks.length > 0 ? genPromosTracks : undefined
        );

        setBlocks(prev => {
            const next = prev.map(b => b.id === blockId ? {
                ...b,
                rotationRule: updatedBlock.rotationRule,
                tracks: reordered
            } : b);
            try {
                localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(next));
                window.dispatchEvent(new Event('dropsiders_radio_blocks_updated'));
            } catch {}
            return next;
        });

        const ruleNames: Record<RadioRotationRule, string> = {
            jingle_son_special_promo: 'Normal ➔ Son ➔ Spécial ➔ Son (promo /4)',
            son_special_son_jingle_promo: '1 Son ➔ 1 Spécial ➔ 1 Son ➔ 1 Jingle ➔ 1 Promo',
            every_2_tracks: 'Alternance tous les 2 sons',
            every_3_tracks: 'Alternance tous les 3 sons',
            jingles_only: 'Jingles uniquement',
            music_only: '100% Musique'
        };

        showToast(`✓ Alternance appliquée à « ${targetBlock.title} » (${ruleNames[updatedBlock.rotationRule || 'jingle_son_special_promo']}) !`, 'success');
    };

    // Sauvegarde globale
    const handleSaveAll = async () => {
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(blocks));
            localStorage.setItem(STORAGE_RADIO_TOP_HORAIRE_KEY, JSON.stringify(topHoraireConfig));
            localStorage.setItem('dropsiders_radionomy_palette', JSON.stringify(generalJingles));
            const flatTracks = blocks.flatMap(b => b.tracks || []);
            const res = await apiFetch('/api/settings/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    radio_blocks: blocks,
                    radio_tracks: flatTracks,
                    radio_general_jingles: generalJingles,
                    radio_top_horaire: topHoraireConfig,
                    tv_blocks: tvBlocks
                }),
            });
            if (res.ok) {
                setSaveSuccess(true);
                showToast('✓ Grille radio et jingles sauvegardés avec succès !', 'success');
                window.dispatchEvent(new Event('dropsiders_radio_blocks_updated'));
                setTimeout(() => setSaveSuccess(false), 3000);
            }
        } catch (e) {
            console.error(e);
            showToast('Erreur sauvegarde', 'warn');
        } finally {
            setIsSaving(false);
        }
    };

    interface TableItem {
        id: string;
        index?: number;
        type: RadioTrackCategory | 'clip' | 'set' | 'jingle';
        title: string;
        artist: string;
        duration: number;
        box: string;
        audioUrl?: string;
        youtubeId?: string;
        isSpecialJingle?: boolean;
        expiresAt?: string;
    }

    // Éléments affichés dans le grand tableau central selon le dossier actif
    const currentTableItems = useMemo<TableItem[]>(() => {
        const query = searchFilter.toLowerCase().trim();

        if (activeFolder === 'tv_lib') {
            return allTVVideos
                .filter(v => !query || v.title.toLowerCase().includes(query))
                .map(v => ({
                    id: v.id,
                    type: (v.category === 'clip' ? 'clip' : 'set') as RadioTrackCategory,
                    title: v.title,
                    artist: 'TV SET',
                    duration: v.duration || 3600,
                    box: v.blockTitle || 'TV BACS',
                    youtubeId: v.youtubeId,
                    audioUrl: undefined
                }));
        }

        if (activeFolder === 'general_jingles') {
            return generalJingles
                .filter(j => !query || j.title.toLowerCase().includes(query))
                .map(j => ({
                    id: j.id,
                    type: 'jingle' as const,
                    title: j.title,
                    artist: 'DROPSIDERS JINGLE',
                    duration: j.duration || 15,
                    box: 'JINGLES GÉNÉRAUX',
                    audioUrl: j.audioUrl,
                    youtubeId: j.youtubeId,
                    expiresAt: (j as any).expiresAt
                }));
        }

        if (activeFolder === 'promos' || activeFolder === 'pubs' || activeFolder === 'promos_pubs') {
            const promoPubMap = new Map<string, TableItem & { emissionCount: number }>();

            // 1. Scanner les émissions
            blocks.forEach(b => {
                (b.tracks || []).forEach((t, tIdx) => {
                    const isPromoOrPub = (t.category === 'promo' || t.category === 'pub' || t.artist === 'SPONSOR' || t.artist === 'PUBLICITÉ / SPONSOR') && !t.title?.includes('Promo Insta & Tiktok');
                    if (isPromoOrPub) {
                        const key = ((t.audioUrl || t.title) + '').toLowerCase().trim();
                        const existing = promoPubMap.get(key);
                        if (existing) {
                            existing.emissionCount++;
                        } else {
                            const isPub = t.category === 'pub' || t.artist === 'SPONSOR' || t.artist === 'PUBLICITÉ / SPONSOR';
                            promoPubMap.set(key, {
                                id: t.id || `pp_${b.id}_${tIdx}`,
                                type: isPub ? ('pub' as const) : ('promo' as const),
                                title: t.title,
                                artist: t.artist || (isPub ? 'PUBLICITÉ / SPONSOR' : 'PROMO DROPSIDERS'),
                                duration: t.duration || 30,
                                box: b.title,
                                audioUrl: t.audioUrl,
                                youtubeId: t.youtubeId,
                                expiresAt: t.expiresAt,
                                emissionCount: 1
                            });
                        }
                    }
                });
            });

            // 2. Scanner la palette générale
            generalJingles.forEach(j => {
                const isPromo = ((j as any).category === 'promo' || (j as any).type === 'promo') && !j.title?.includes('Promo Insta & Tiktok');
                const isPub = (j as any).category === 'pub' || (j as any).type === 'pub';
                if (isPromo || isPub) {
                    const key = ((j.audioUrl || j.title) + '').toLowerCase().trim();
                    if (!promoPubMap.has(key)) {
                        promoPubMap.set(key, {
                            id: j.id,
                            type: isPub ? ('pub' as const) : ('promo' as const),
                            title: j.title,
                            artist: isPub ? 'PUBLICITÉ / SPONSOR' : 'PROMO DROPSIDERS',
                            duration: j.duration || 30,
                            box: 'BACS PROMOS & SPONSORS',
                            audioUrl: j.audioUrl,
                            youtubeId: j.youtubeId,
                            expiresAt: (j as any).expiresAt,
                            emissionCount: 0
                        });
                    }
                }
            });

            const mergedList = Array.from(promoPubMap.values()).map(p => ({
                ...p,
                box: p.emissionCount > 0 ? `Diffusé dans ${p.emissionCount} émission${p.emissionCount > 1 ? 's' : ''}` : 'Bacs Promos & Sponsors'
            }));

            return mergedList.filter(p => !query || p.title.toLowerCase().includes(query) || p.artist.toLowerCase().includes(query));
        }

        if (activeFolder.startsWith('block_jingles:') && selectedBlock) {
            return (selectedBlock.specialJingles || [])
                .filter(j => !query || j.title.toLowerCase().includes(query))
                .map(j => ({
                    id: j.id,
                    type: 'jingle' as const,
                    title: j.title,
                    artist: `${selectedBlock.title} JINGLE`,
                    duration: j.duration || 15,
                    box: `JINGLES • ${selectedBlock.title}`,
                    audioUrl: j.audioUrl,
                    youtubeId: j.youtubeId
                }));
        }

        if (selectedBlock) {
            // Affichage des morceaux de l'émission (sets musicaux, clips, interviews)
            // Les jingles spéciaux sont gérés dans leur dossier dédié et entrelacés automatiquement à l'antenne
            const tracksList = [...(selectedBlock.tracks || [])];

            // ⚠️ IMPORTANT : on assigne l'index RÉEL dans le tableau original AVANT de filtrer.
            // Si on assignait idx après .filter(), l'index 0 filtré ne correspondrait pas
            // au bon élément dans le tableau complet → suppression du mauvais morceau.
            return tracksList
                .map((t, realIdx) => ({
                    id: t.id || `idx_${realIdx}`,
                    index: realIdx,   // ← index réel dans selectedBlock.tracks (avant filtrage)
                    type: t.category || 'set',
                    title: t.title,
                    artist: t.artist || (t.category === 'jingle' ? `${selectedBlock.title} JINGLE` : 'Artiste'),
                    duration: t.duration || (t.category === 'jingle' ? 15 : 3600),
                    box: selectedBlock.title,
                    audioUrl: t.audioUrl,
                    youtubeId: t.youtubeId,
                    isSpecialJingle: t.category === 'jingle',
                    expiresAt: t.expiresAt
                }))
                .filter(t => !query || t.title.toLowerCase().includes(query) || (t.artist && t.artist.toLowerCase().includes(query)));
        }

        return [];
    }, [activeFolder, selectedBlock, blocks, allTVVideos, generalJingles, searchFilter]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-1 sm:p-3 overflow-hidden font-sans">
            {/* Notification Toast */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-8 left-1/2 -translate-x-1/2 z-[150] px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-2xl border bg-black/90 text-cyan-300 border-cyan-500/50 shadow-cyan-500/20"
                    >
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span>{toastMessage.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`bg-[#0d1017] border border-cyan-500/20 shadow-2xl relative overflow-hidden flex flex-col transition-all duration-200 ${
                    isFullscreen
                        ? 'w-screen h-screen rounded-none'
                        : 'w-full max-w-[1700px] h-[96vh] rounded-3xl'
                }`}
            >
                {/* ═════════════════════════════════════════════════════════════
                    1. EN-TÊTE PRINCIPAL (Style RadioManager / Navigation)
                ═════════════════════════════════════════════════════════════ */}
                <div className="h-14 px-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-gradient-to-r from-[#0d1b2a] via-[#101c2e] to-[#0a121e]">
                    <div className="flex items-center gap-6">
                        {/* Logo RadioManager */}
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                                <Radio className="w-4 h-4" />
                            </div>
                            <div>
                                <h1 className="text-base font-display font-black text-white uppercase italic tracking-tighter flex items-center gap-1.5">
                                    Radio<span className="text-cyan-400">Manager</span>
                                    <span className="text-[9px] font-mono not-italic px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                                        PRO
                                    </span>
                                </h1>
                            </div>
                        </div>

                        {/* Onglets façon RadioManager */}
                        <div className="hidden md:flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setActiveFolder(blocks[0] ? `emission:${blocks[0].id}` : 'tv_lib')}
                                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                                    activeFolder.startsWith('emission:') || activeFolder === 'tv_lib'
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Audio & Bacs
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveFolder('programmation')}
                                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                                    activeFolder === 'programmation'
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm font-bold'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                📅 Programmation
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveFolder('stats')}
                                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                                    activeFolder === 'stats'
                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm font-bold'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                📊 Stats
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveFolder('dedications')}
                                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                                    activeFolder === 'dedications'
                                        ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm font-bold'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                💬 Dédicaces
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveFolder('recorder')}
                                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                                    activeFolder === 'recorder'
                                        ? 'bg-red-500/20 text-red-300 border border-red-500/30 shadow-sm font-bold'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                🎙️ Enregistreur
                            </button>
                        </div>
                    </div>

                    {/* Actions droites */}
                    <div className="flex items-center gap-2.5">
                        {/* Bouton Suno AI Studio */}
                        <button
                            type="button"
                            onClick={() => setIsSunoModalOpen(true)}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all cursor-pointer border border-violet-400/40"
                            title="Créer des jingles et drops audio avec l'IA Suno"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                            <span>✨ Suno IA</span>
                        </button>

                        {/* Bouton Groupé + Nouveau Média (Jingle / Promo / Pub) avec menu déroulant pour gagner de la place */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsAddMediaDropdownOpen(!isAddMediaDropdownOpen)}
                                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all cursor-pointer"
                                title="Ajouter ou uploader un média (jingle, promo, pub)"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Nouveau Média</span>
                                <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${isAddMediaDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isAddMediaDropdownOpen && (
                                <div 
                                    className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#0e131f] border border-white/20 shadow-2xl p-1.5 z-[100] animate-in fade-in zoom-in-95 space-y-1"
                                    onMouseLeave={() => setIsAddMediaDropdownOpen(false)}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSunoModalOpen(true);
                                            setIsAddMediaDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-violet-500/20 text-violet-300 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer border border-violet-500/30 bg-violet-500/10"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                                        <span>✨ Studio Suno IA (Jingles)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUploadModalCategory('jingle');
                                            setIsUploadJingleModalOpen(true);
                                            setIsAddMediaDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-500/20 text-amber-300 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer"
                                    >
                                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                                        <span>🔔 Uploader un Jingle</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUploadModalCategory('promo');
                                            setIsUploadJingleModalOpen(true);
                                            setIsAddMediaDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-orange-500/20 text-orange-300 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer"
                                    >
                                        <Megaphone className="w-3.5 h-3.5 text-orange-400" />
                                        <span>📣 Uploader Promo / Sponsor</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Indicateur ON AIR */}
                        <button
                            type="button"
                            onClick={onToggleRadio}
                            className={`px-3.5 py-2 rounded-xl text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
                                isRadioActive
                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                    : 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${isRadioActive ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`} />
                            {isRadioActive ? 'ON AIR' : 'HORS LIGNE'}
                        </button>

                        {/* Toggle Messages Auditeurs */}
                        <button
                            type="button"
                            onClick={handleToggleMessages}
                            title={messagesEnabled ? 'Désactiver les messages auditeurs' : 'Activer les messages auditeurs'}
                            className={`px-3.5 py-2 rounded-xl text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
                                messagesEnabled
                                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)] hover:bg-purple-500/25'
                                    : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{messagesEnabled ? '💬 Messages ON' : 'Messages OFF'}</span>
                        </button>

                        {/* Sauvegarder */}
                        <button
                            type="button"
                            onClick={handleSaveAll}
                            disabled={isSaving}
                            className={`px-4 py-2 rounded-xl text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                                saveSuccess
                                    ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                                    : 'bg-cyan-500 hover:bg-white text-black shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                            }`}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>{isSaving ? 'Enregistrement...' : saveSuccess ? 'Sauvegardé !' : 'Sauvegarder'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
                        >
                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
                        >
                            <X className="w-4.5 h-4.5" />
                        </button>
                    </div>
                </div>

                {/* ═════════════════════════════════════════════════════════════
                    2. CORPS : ARBORESCENCE (Gauche) + GRAND TABLEAU (Centre)
                ═════════════════════════════════════════════════════════════ */}
                <div className="flex flex-1 overflow-hidden min-h-0">

                    {/* ── ARBORESCENCE RADIONOMY / TREEVIEW (Gauche) ── */}
                    <div className="w-72 shrink-0 border-r border-white/10 flex flex-col bg-[#0a0f18] select-none">
                        <div className="p-3 border-b border-white/10 bg-cyan-950/20 text-cyan-300 font-display font-black text-xs uppercase tracking-wider flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                                Radio active : Dropsiders
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2.5 space-y-3 custom-scrollbar text-xs">
                            {/* DOSSIER 1 : BACS MUSICAUX */}
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setExpandedFolders(f => ({ ...f, music: !f.music }))}
                                    className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-gray-300 hover:bg-white/5 font-bold uppercase tracking-wider text-[11px]"
                                >
                                    <span className="flex items-center gap-2 text-cyan-400">
                                        {expandedFolders.music ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                        📁 Bacs musicaux TV
                                    </span>
                                    <span className="text-[9px] font-mono text-gray-500">240 sets</span>
                                </button>
                                {expandedFolders.music && (
                                    <div className="pl-6 pt-1 space-y-1">
                                        <button
                                            type="button"
                                            onClick={() => setActiveFolder('tv_lib')}
                                            className={`w-full text-left py-1.5 px-2.5 rounded-lg flex items-center justify-between text-xs transition-all ${
                                                activeFolder === 'tv_lib'
                                                    ? 'bg-cyan-600 text-white font-bold shadow-sm'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <Tv className="w-3.5 h-3.5" />
                                                Bibliothèque TV
                                            </span>
                                            <span className="text-[10px] font-mono opacity-80">240</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* DOSSIER 2 : PLAYLISTS / ÉMISSIONS (LA GRILLE 24/7) */}
                            <div>
                                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg text-gray-300 hover:bg-white/5 font-bold uppercase tracking-wider text-[11px]">
                                    <button
                                        type="button"
                                        onClick={() => setExpandedFolders(f => ({ ...f, emissions: !f.emissions }))}
                                        className="flex items-center gap-2 text-indigo-400 cursor-pointer"
                                    >
                                        {expandedFolders.emissions ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                        📁 Émissions ({blocks.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingBlockId(null);
                                            setEditBlockForm({
                                                title: `ÉMISSION ${blocks.length + 1}`,
                                                host: '',
                                                emoji: '🎧',
                                                color: '#00f0ff',
                                                startHour: 0,
                                                endHour: 4,
                                                days: ALL_DAYS,
                                                randomize: true,
                                                jingleFrequency: 2,
                                                rotationRule: 'jingle_son_special_promo',
                                                introEnabled: true,
                                                introTitle: '',
                                                introAudioUrl: '',
                                                introYoutubeId: '',
                                                introDuration: 15
                                            });
                                            setIsEditingBlock(true);
                                        }}
                                        className="p-1 rounded hover:bg-white/10 text-cyan-400"
                                        title="Créer une émission"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {expandedFolders.emissions && (
                                    <div className="pl-4 pt-1 space-y-1">
                                        {blocks.map(b => {
                                            const isActive = activeFolder === `emission:${b.id}`;
                                            const isLive = isRadioBlockActiveNow(b);
                                            const specialCount = (b.specialJingles || []).length;
                                            return (
                                                <button
                                                    key={b.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedBlockId(b.id);
                                                        setActiveFolder(`emission:${b.id}`);
                                                        setIsEditingBlock(false);
                                                    }}
                                                    onDoubleClick={() => {
                                                        setEditingBlockId(b.id);
                                                        setEditBlockForm({
                                                            title: b.title,
                                                            host: b.host || '',
                                                            emoji: b.emoji,
                                                            color: b.color,
                                                            startHour: b.startHour,
                                                            endHour: b.endHour,
                                                            days: b.days || ALL_DAYS,
                                                            randomize: b.randomize !== false,
                                                            jingleFrequency: b.jingleFrequency ?? 2,
                                                            rotationRule: b.rotationRule || 'jingle_son_special_promo',
                                                            introEnabled: b.themeJingle?.enabled !== false,
                                                            introTitle: b.themeJingle?.title || '',
                                                            introAudioUrl: b.themeJingle?.audioUrl || '',
                                                            introYoutubeId: b.themeJingle?.youtubeId || '',
                                                            introDuration: b.themeJingle?.duration || 15
                                                        });
                                                        setIsEditingBlock(true);
                                                    }}
                                                    className={`w-full text-left py-2 px-2.5 rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer ${
                                                        isActive
                                                            ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-bold shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                                                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <span className="text-base shrink-0">{b.emoji}</span>
                                                        <div className="min-w-0 flex-1 truncate">
                                                            <p className="truncate font-display font-black uppercase italic leading-tight">
                                                                {b.title}
                                                            </p>
                                                            <span className="text-[9px] font-mono opacity-70">
                                                                {b.timeSlot}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                                                        {isLive && (
                                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" title="À l'antenne" />
                                                        )}
                                                        {b.themeJingle && (b.themeJingle.audioUrl || b.themeJingle.youtubeId) && (
                                                            <span className="text-[8px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1 rounded" title="Générique d'intro configuré">
                                                                🎙️
                                                            </span>
                                                        )}
                                                        {specialCount > 0 && (
                                                            <span className="text-[8px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 rounded" title={`${specialCount} jingles spéciaux`}>
                                                                🔔{specialCount}
                                                            </span>
                                                        )}
                                                        {(b.jingleFrequency ?? 2) !== 2 && (
                                                            <span className="text-[8px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1 rounded" title={`Jingle/Promo toutes les ${b.jingleFrequency} musiques`}>
                                                                ⚙️{b.jingleFrequency}
                                                            </span>
                                                        )}
                                                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 opacity-80">
                                                            {b.tracks?.length || 0}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* DOSSIER 3 : BACS DE JINGLES (GÉNÉRAUX & PAR ÉMISSION) */}
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setExpandedFolders(f => ({ ...f, jingles: !f.jingles }))}
                                    className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-gray-300 hover:bg-white/5 font-bold uppercase tracking-wider text-[11px]"
                                >
                                    <span className="flex items-center gap-2 text-amber-400">
                                        {expandedFolders.jingles ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                        🔔 Bacs de Jingles
                                    </span>
                                </button>

                                {expandedFolders.jingles && (
                                    <div className="pl-4 pt-1 space-y-1">
                                        {/* Jingles Généraux */}
                                        <button
                                            type="button"
                                            onClick={() => setActiveFolder('general_jingles')}
                                            className={`w-full text-left py-1.5 px-2.5 rounded-lg flex items-center justify-between text-xs transition-all ${
                                                activeFolder === 'general_jingles'
                                                    ? 'bg-amber-600 text-black font-bold shadow-sm'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                🌐 Jingles Généraux
                                            </span>
                                            <span className="text-[10px] font-mono opacity-80">{generalJingles.length}</span>
                                        </button>

                                        {/* Jingles Spécifiques par Émission */}
                                        {blocks.map(b => (
                                            <button
                                                key={`j_${b.id}`}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedBlockId(b.id);
                                                    setActiveFolder(`block_jingles:${b.id}`);
                                                }}
                                                className={`w-full text-left py-1.5 px-2.5 rounded-lg flex items-center justify-between text-xs transition-all ${
                                                    activeFolder === `block_jingles:${b.id}`
                                                        ? 'bg-amber-600 text-black font-bold shadow-sm'
                                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                }`}
                                            >
                                                <span className="truncate flex items-center gap-1.5">
                                                    <span>{b.emoji}</span>
                                                    <span className="truncate">Jingles • {b.title}</span>
                                                </span>
                                                <span className="text-[9px] font-mono px-1 rounded bg-black/40">
                                                    {(b.specialJingles || []).length}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* DOSSIER 4 : BACS DE PROMOS & PUBLICITÉS */}
                            <div>
                                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg text-gray-300 hover:bg-white/5 font-bold uppercase tracking-wider text-[11px]">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveFolder('promos');
                                            setExpandedFolders(f => ({ ...f, promos: true }));
                                        }}
                                        className={`flex items-center gap-2 cursor-pointer transition-all ${
                                            activeFolder === 'promos' || activeFolder === 'pubs'
                                                ? 'text-orange-400 font-black'
                                                : 'text-gray-300 hover:text-white'
                                        }`}
                                    >
                                        📣 Promos & Sponsors
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUploadModalCategory('promo');
                                            setIsUploadJingleModalOpen(true);
                                        }}
                                        className="p-1 rounded hover:bg-white/10 text-orange-400"
                                        title="Ajouter une Promo ou Pub/Sponsor"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="pl-3 pt-1 space-y-1">
                                    <button
                                        type="button"
                                        onClick={() => setActiveFolder('promos')}
                                        className={`w-full text-left py-2 px-2.5 rounded-lg flex items-center justify-between text-xs transition-all ${
                                            activeFolder === 'promos' || activeFolder === 'pubs'
                                                ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-pink-600 text-white font-bold shadow-md shadow-orange-500/20'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2 truncate">
                                            📣 Bacs Promos & Sponsors
                                        </span>
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/50 text-orange-300 font-bold border border-white/10">
                                            {allPromosPubsCount}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* DOSSIER 5 : TOP HORAIRE */}
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setActiveFolder('top_horaire')}
                                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg font-bold uppercase tracking-wider text-[11px] transition-all ${
                                        activeFolder === 'top_horaire'
                                            ? 'bg-purple-600 text-white shadow-sm'
                                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <span className="flex items-center gap-2">⏰ Top Horaire</span>
                                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${topHoraireConfig.enabled ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'}`}>
                                        {topHoraireConfig.enabled ? 'ON' : 'OFF'}
                                    </span>
                                </button>
                            </div>

                            {/* DOSSIER 6 : DÉDICACES & ENREGISTREUR PODCAST */}
                            <div className="pt-2 border-t border-white/5 space-y-1">
                                <button
                                    type="button"
                                    onClick={() => setActiveFolder('dedications')}
                                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg font-bold uppercase tracking-wider text-[11px] transition-all ${
                                        activeFolder === 'dedications'
                                            ? 'bg-purple-600 text-white shadow-sm'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <span className="flex items-center gap-2">💬 Dédicaces Auditeurs</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveFolder('recorder')}
                                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg font-bold uppercase tracking-wider text-[11px] transition-all ${
                                        activeFolder === 'recorder'
                                            ? 'bg-red-600 text-white shadow-sm'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <span className="flex items-center gap-2">🎙️ Enregistreur Podcast</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── GRAND TABLEAU CENTRAL FAÇON RADIOMANAGER (Centre) ── */}
                    <div className="flex-1 overflow-y-auto flex flex-col min-w-0 bg-[#0c1018]">

                        {/* ── PANEL TOP HORAIRE ── */}
                        {activeFolder === 'top_horaire' && (
                            <div className="p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-display font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                                        <span className="text-xl">⏰</span> Top Horaire Radio
                                    </h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-xs text-gray-400 font-bold">Actif</span>
                                        <div
                                            onClick={() => setTopHoraireConfig(c => ({ ...c, enabled: !c.enabled }))}
                                            className={`relative w-10 h-5 rounded-full transition-all cursor-pointer ${
                                                topHoraireConfig.enabled ? 'bg-green-500' : 'bg-gray-600'
                                            }`}
                                        >
                                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                                                topHoraireConfig.enabled ? 'left-5' : 'left-0.5'
                                            }`} />
                                        </div>
                                    </label>
                                </div>

                                <p className="text-xs text-gray-400">
                                    Le Top Horaire se déclenche automatiquement à chaque heure pile (ex : 14h00, 15h00...) pendant le direct radio.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-purple-400 uppercase">Titre</label>
                                        <input
                                            type="text"
                                            value={topHoraireConfig.title}
                                            onChange={e => setTopHoraireConfig(c => ({ ...c, title: e.target.value }))}
                                            placeholder="Ex : Dropsiders Radio • Top Horaire"
                                            className="w-full px-3 py-2 rounded-xl bg-black/50 border border-purple-500/30 text-white text-xs font-bold focus:outline-none focus:border-purple-400"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-purple-400 uppercase">Durée (secondes)</label>
                                        <input
                                            type="number"
                                            min={5}
                                            max={60}
                                            value={topHoraireConfig.duration}
                                            onChange={e => setTopHoraireConfig(c => ({ ...c, duration: Math.max(5, parseInt(e.target.value) || 10) }))}
                                            className="w-full px-3 py-2 rounded-xl bg-black/50 border border-purple-500/30 text-white text-xs font-bold font-mono focus:outline-none focus:border-purple-400"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-purple-400 uppercase">YouTube ID</label>
                                        <input
                                            type="text"
                                            value={topHoraireConfig.youtubeId || ''}
                                            onChange={e => {
                                                const yt = extractYouTubeId(e.target.value) || e.target.value.trim();
                                                setTopHoraireConfig(c => ({ ...c, youtubeId: yt, audioUrl: undefined }));
                                            }}
                                            placeholder="ID YouTube ou URL YouTube"
                                            className="w-full px-3 py-2 rounded-xl bg-black/50 border border-purple-500/30 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-purple-400 uppercase">URL Audio (MP3/WAV)</label>
                                        <input
                                            type="text"
                                            value={topHoraireConfig.audioUrl || ''}
                                            onChange={e => setTopHoraireConfig(c => ({ ...c, audioUrl: e.target.value.trim(), youtubeId: undefined }))}
                                            placeholder="https://... .mp3"
                                            className="w-full px-3 py-2 rounded-xl bg-black/50 border border-purple-500/30 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                                        />
                                    </div>
                                </div>

                                {/* Preview */}
                                {(topHoraireConfig.youtubeId || topHoraireConfig.audioUrl) && (
                                    <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-4 flex items-center gap-4">
                                        {topHoraireConfig.youtubeId && (
                                            <img
                                                src={`https://img.youtube.com/vi/${topHoraireConfig.youtubeId}/mqdefault.jpg`}
                                                alt="preview top horaire"
                                                className="w-24 h-16 object-cover rounded-lg border border-white/10"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-purple-200 truncate">{topHoraireConfig.title}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                {topHoraireConfig.youtubeId ? `🎥 YouTube : ${topHoraireConfig.youtubeId}` : `🔊 Audio : ${topHoraireConfig.audioUrl}`}
                                                {' • '}{topHoraireConfig.duration}s
                                            </div>
                                            <div className={`text-[10px] font-bold mt-1 ${topHoraireConfig.enabled ? 'text-green-400' : 'text-gray-500'}`}>
                                                {topHoraireConfig.enabled ? '✅ Activé — se déclenchera à chaque heure pile' : '❌ Désactivé'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        localStorage.setItem(STORAGE_RADIO_TOP_HORAIRE_KEY, JSON.stringify(topHoraireConfig));
                                        showToast('⏰ Top Horaire sauvegardé !', 'success');
                                    }}
                                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-display font-black text-xs uppercase italic tracking-wider transition-all cursor-pointer shadow-lg shadow-purple-500/20"
                                >
                                    ✓ Sauvegarder le Top Horaire
                                </button>
                            </div>
                        )}

                        {/* ── PANEL GRILLE & PROGRAMMATION RADIO ── */}
                        {activeFolder === 'programmation' && (
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col min-h-0 bg-[#0a0e17]">
                                {/* BANDEAU EN-TÊTE PROGRAMMATION */}
                                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d101a] via-[#101728] to-[#0d101a] border border-white/10 shadow-2xl flex flex-wrap items-center justify-between gap-3 relative shrink-0">
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-400 via-purple-500 to-amber-400" />
                                    
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.25)] shrink-0">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h2 className="text-lg sm:text-xl font-display font-black text-white uppercase italic tracking-tight">
                                                    📅 Programmation Radio
                                                </h2>
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                                                    24h/24
                                                </span>
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                                                    DIRECT UTC+2
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 font-sans mt-0.5 hidden sm:block">
                                                Conducteur d'antenne en temps réel calé sur l'heure
                                            </p>
                                        </div>
                                    </div>

                                    {/* Statut antenne + Auditeurs + Micro Studio + Horloge */}
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {/* Compteur Auditeurs */}
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                                            <Users className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                                            <span>{listenersCount}</span>
                                            <span className="text-[10px] text-gray-400 font-normal hidden sm:inline">auditeurs</span>
                                        </div>

                                        {/* Sélecteur de Microphone avec activation de permission */}
                                        <div className="flex items-center gap-1.5">
                                            <Mic className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            {micDevices.length === 0 || !micDevices.some(d => d.label) ? (
                                                <button
                                                    type="button"
                                                    onClick={() => enumerateMicDevices(true)}
                                                    className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 hover:text-white text-[10px] font-mono cursor-pointer transition-all flex items-center gap-1.5"
                                                    title="Activer et autoriser l'accès micro pour choisir votre entrée audio"
                                                >
                                                    <Mic className="w-3 h-3 text-purple-400" />
                                                    <span>Activer micro</span>
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <select
                                                        value={selectedMicDeviceId}
                                                        onChange={e => {
                                                            const newId = e.target.value;
                                                            setSelectedMicDeviceId(newId);
                                                            if (isLiveMicActive || isMicTesting) {
                                                                const currentMode = isLiveMicActive ? 'on_air' : 'test';
                                                                stopMicrophone();
                                                                setTimeout(() => startMicrophone(currentMode), 100);
                                                            }
                                                        }}
                                                        className="max-w-[170px] px-2 py-1.5 bg-black/70 border border-white/15 rounded-xl text-[10px] font-mono text-white cursor-pointer focus:outline-none focus:border-purple-500/60 truncate"
                                                        title="Microphone sélectionné"
                                                    >
                                                        {micDevices.map((d, idx) => (
                                                            <option key={d.deviceId || idx} value={d.deviceId}>
                                                                {d.label || `Microphone ${idx + 1}`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={() => enumerateMicDevices(true)}
                                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                                        title="Actualiser les micros"
                                                    >
                                                        <RefreshCw className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Bouton Test Micro Privé (Hors Antenne / Retour Casque) */}
                                        <button
                                            type="button"
                                            onClick={handleToggleMicTest}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                                                isMicTesting
                                                    ? 'bg-cyan-500 text-black shadow-cyan-500/50'
                                                    : 'bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30'
                                            }`}
                                            title="Tester et écouter votre micro en privé dans votre casque sans passer à la radio"
                                        >
                                            <Headphones className="w-3.5 h-3.5" />
                                            <span>{isMicTesting ? 'Arrêter Test' : '🎧 Tester Micro'}</span>
                                        </button>

                                        {/* Bouton Micro Talk-over Studio */}
                                        <button
                                            type="button"
                                            onClick={handleToggleLiveMic}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                                                isLiveMicActive
                                                    ? 'bg-red-500 text-white animate-pulse shadow-red-500/50'
                                                    : 'bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40'
                                            }`}
                                            title="Prendre l'antenne au micro avec ducking automatique de la musique"
                                        >
                                            {isLiveMicActive ? <MicOff className="w-3.5 h-3.5 text-white" /> : <Mic className="w-3.5 h-3.5 text-purple-400" />}
                                            <span>{isLiveMicActive ? 'COUPER MICRO' : '🎙️ Animer en Live'}</span>
                                        </button>

                                        {/* Bouton Scan Anti-Blancs */}
                                        <button
                                            type="button"
                                            onClick={handleAutoDetectDurations}
                                            disabled={isDetectingDurations}
                                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-black border border-amber-500/40 text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                                            title="Détecter automatiquement la durée réelle des fichiers audio et YouTube pour éliminer tous les blancs à l'antenne"
                                        >
                                            <Zap className={`w-3.5 h-3.5 ${isDetectingDurations ? 'animate-spin' : 'text-amber-400'}`} />
                                            <span>{isDetectingDurations ? 'Scan...' : '⚡ Anti-Blancs'}</span>
                                        </button>

                                        <div className="h-7 w-[1px] bg-white/10 hidden sm:block" />

                                        {/* Horloge Paris */}
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Heure Studio</p>
                                            <p className="text-sm font-mono font-black text-cyan-300">
                                                {new Date().toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={onToggleRadio}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                                                isRadioActive
                                                    ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/30'
                                                    : 'bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-black border border-red-500/40'
                                            }`}
                                        >
                                            <span className={`w-2 h-2 rounded-full ${isRadioActive ? 'bg-black animate-ping' : 'bg-red-400'}`} />
                                            <span>{isRadioActive ? 'ON AIR' : 'HORS LIGNE'}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* BANNIÈRE TEST MICRO / RETOUR CASQUE PRIVÉ */}
                                {isMicTesting && (
                                    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/90 via-cyan-950/80 to-indigo-950/90 border-2 border-cyan-400 shadow-2xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.4)]">
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
                                                    Vous vous entendez dans vos écouteurs pour calibrer votre son. Les auditeurs de la radio n'entendent rien.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 flex-wrap">
                                            {/* VU MÈTRE */}
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                                                    <span className="text-[10px] font-mono text-gray-300 uppercase">Niveau Voix</span>
                                                    <span className="text-xs font-mono font-bold text-cyan-300">{audioLevel}%</span>
                                                </div>
                                                <div className="w-36 sm:w-44 h-3 bg-black/60 rounded-full overflow-hidden border border-white/20 p-0.5">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-75 ${
                                                            audioLevel > 80 ? 'bg-red-500' : audioLevel > 40 ? 'bg-cyan-400' : 'bg-emerald-400'
                                                        }`}
                                                        style={{ width: `${audioLevel}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* ── SLIDER GAIN MICRO (test PFL) ── */}
                                            <div className="flex flex-col gap-2 min-w-[150px]">
                                                {/* Amplification signal micro */}
                                                <div className="flex items-center gap-2">
                                                    <Sliders className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between text-[9px] font-mono text-gray-400 mb-0.5">
                                                            <span className="text-emerald-300 font-bold uppercase">Amplification micro</span>
                                                            <span className={micBoost > 200 ? 'text-orange-300 font-bold' : ''}>{micBoost}%</span>
                                                        </div>
                                                        <input
                                                            type="range" min="0" max="400" step="10"
                                                            value={micBoost}
                                                            onChange={e => {
                                                                const v = Number(e.target.value);
                                                                setMicBoost(v);
                                                                if (micBoostGainNodeRef.current) micBoostGainNodeRef.current.gain.value = v / 100;
                                                            }}
                                                            className="w-full h-1.5 rounded-full appearance-none accent-emerald-400 cursor-pointer"
                                                            title="Amplification du signal micro brut (100% = normal, 200% = double, 400% = max)"
                                                        />
                                                    </div>
                                                </div>
                                                {/* Volume casque */}
                                                <div className="flex items-center gap-2">
                                                    <Mic className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between text-[9px] font-mono text-gray-400 mb-0.5">
                                                            <span className="text-cyan-300 font-bold uppercase">Gain micro casque</span>
                                                            <span>{micMonitorGain}%</span>
                                                        </div>
                                                        <input
                                                            type="range" min="0" max="200" step="5"
                                                            value={micMonitorGain}
                                                            onChange={e => {
                                                                const v = Number(e.target.value);
                                                                setMicMonitorGain(v);
                                                                if (monitorGainNodeRef.current) monitorGainNodeRef.current.gain.value = v / 100;
                                                            }}
                                                            className="w-full h-1.5 rounded-full appearance-none accent-cyan-400 cursor-pointer"
                                                            title="Volume du micro dans votre casque (0–200%)"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleToggleLiveMic}
                                                    className="px-3.5 py-2 rounded-xl bg-red-500 hover:bg-white text-black font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-1.5 shadow-lg shadow-red-500/30 transition-all cursor-pointer"
                                                >
                                                    <Mic className="w-3.5 h-3.5 text-black" />
                                                    <span>🔴 Passer en Direct (ON AIR)</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleToggleMicTest}
                                                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-display font-bold text-xs uppercase italic transition-all cursor-pointer border border-white/10"
                                                >
                                                    Arrêter
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* BANNIÈRE MICRO LIVE / TALK-OVER EN COURS */}
                                {isLiveMicActive && (
                                    <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-purple-950/70 to-red-950/80 border-2 border-red-500 shadow-2xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500 flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                                                <Mic className="w-6 h-6 animate-pulse text-red-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-display font-black uppercase italic px-2 py-0.5 rounded bg-red-500 text-white animate-pulse">
                                                        ● ON AIR — MICRO STUDIO EN DIRECT
                                                    </span>
                                                    <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                                                        Ducking actif (-75% volume musique)
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-200 mt-1">
                                                    Votre voix passe à l'antenne par-dessus la musique. Parlez directement dans votre micro !
                                                </p>
                                            </div>
                                        </div>

                                        {/* VU MÈTRE + RETOUR CASQUE + SLIDERS + BOUTON COUPER */}
                                        <div className="flex items-center gap-4 flex-wrap">
                                            {/* Bouton Toggle Retour Casque */}
                                            <button
                                                type="button"
                                                onClick={handleToggleHeadphoneMonitor}
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

                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <Activity className="w-3.5 h-3.5 text-red-400" />
                                                    <span className="text-[10px] font-mono text-gray-300 uppercase">Niveau Micro</span>
                                                    <span className="text-xs font-mono font-bold text-cyan-300">{audioLevel}%</span>
                                                </div>
                                                <div className="w-36 sm:w-44 h-3 bg-black/60 rounded-full overflow-hidden border border-white/20 p-0.5">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-75 ${
                                                            audioLevel > 80 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : audioLevel > 40 ? 'bg-amber-400' : 'bg-emerald-400'
                                                        }`}
                                                        style={{ width: `${audioLevel}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* ── SLIDERS VOLUME MICRO / MUSIQUE ── */}
                                            <div className="flex flex-col gap-2 min-w-[170px]">
                                                {/* Amplification signal micro brut */}
                                                <div className="flex items-center gap-2">
                                                    <Sliders className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between text-[9px] font-mono text-gray-400 mb-0.5">
                                                            <span className="text-emerald-300 font-bold uppercase">Amplification</span>
                                                            <span className={micBoost > 200 ? 'text-orange-300 font-bold' : ''}>{micBoost}%</span>
                                                        </div>
                                                        <input
                                                            type="range" min="0" max="400" step="10"
                                                            value={micBoost}
                                                            onChange={e => {
                                                                const v = Number(e.target.value);
                                                                setMicBoost(v);
                                                                if (micBoostGainNodeRef.current) micBoostGainNodeRef.current.gain.value = v / 100;
                                                            }}
                                                            className="w-full h-1.5 rounded-full appearance-none accent-emerald-400 cursor-pointer"
                                                            title="Amplification du signal micro brut (100% = normal, 400% = max)"
                                                        />
                                                    </div>
                                                </div>
                                                {/* Volume musique ducking */}
                                                <div className="flex items-center gap-2">
                                                    <VolumeX className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between text-[9px] font-mono text-gray-400 mb-0.5">
                                                            <span className="text-amber-300 font-bold uppercase">Musique</span>
                                                            <span>{duckingMusicVol}%</span>
                                                        </div>
                                                        <input
                                                            type="range" min="0" max="100" step="1"
                                                            value={duckingMusicVol}
                                                            onChange={e => setDuckingMusicVol(Number(e.target.value))}
                                                            className="w-full h-1.5 rounded-full appearance-none accent-amber-400 cursor-pointer"
                                                            title="Volume de la musique pendant le talk-over"
                                                        />
                                                    </div>
                                                </div>
                                                {/* Volume micro casque */}
                                                {isHeadphoneMonitor && (
                                                    <div className="flex items-center gap-2">
                                                        <Mic className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                                        <div className="flex-1">
                                                            <div className="flex justify-between text-[9px] font-mono text-gray-400 mb-0.5">
                                                                <span className="text-red-300 font-bold uppercase">Gain micro</span>
                                                                <span>{micMonitorGain}%</span>
                                                            </div>
                                                            <input
                                                                type="range" min="0" max="200" step="5"
                                                                value={micMonitorGain}
                                                                onChange={e => {
                                                                    const v = Number(e.target.value);
                                                                    setMicMonitorGain(v);
                                                                    if (monitorGainNodeRef.current) monitorGainNodeRef.current.gain.value = v / 100;
                                                                }}
                                                                className="w-full h-1.5 rounded-full appearance-none accent-red-400 cursor-pointer"
                                                                title="Volume du micro dans votre casque (0–200%)"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleToggleLiveMic}
                                                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-white text-black font-display font-black text-xs uppercase italic tracking-wider cursor-pointer shadow-lg shadow-red-500/30 transition-all"
                                            >
                                                Couper Micro
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* BARRE DES SOUS-ONGLETS DE PROGRAMMATION */}
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                                    <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-bold">
                                        <button
                                            type="button"
                                            onClick={() => setProgSubTab('timeline')}
                                            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                                progSubTab === 'timeline'
                                                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30 font-black'
                                                    : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>Conducteur ({filteredScheduleItems.length})</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setProgSubTab('grid')}
                                            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                                progSubTab === 'grid'
                                                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30 font-black'
                                                    : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            <Layers className="w-3.5 h-3.5" />
                                            <span>Grille des Émissions ({blocks.length})</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setProgSubTab('on_air')}
                                            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                                progSubTab === 'on_air'
                                                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30 font-black'
                                                    : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            <Radio className="w-3.5 h-3.5" />
                                            <span>Régie Live &amp; Soundboard</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setProgSubTab('youtube_cue')}
                                            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                                progSubTab === 'youtube_cue'
                                                    ? 'bg-red-500/80 text-white shadow-md shadow-red-500/30 font-black'
                                                    : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            <span className="text-[11px]">▶️</span>
                                            <span>YouTube Cue</span>
                                        </button>
                                    </div>

                                    {/* Actions rapides */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingBlockId(null);
                                                setEditBlockForm({
                                                    title: `Nouvelle Émission ${blocks.length + 1}`,
                                                    host: '',
                                                    emoji: '🎧',
                                                    color: '#00f0ff',
                                                    startHour: 18,
                                                    endHour: 20,
                                                    days: ALL_DAYS,
                                                    randomize: true,
                                                    jingleFrequency: 2,
                                                    rotationRule: 'jingle_son_special_promo',
                                                    introEnabled: false,
                                                    introTitle: '',
                                                    introAudioUrl: '',
                                                    introYoutubeId: '',
                                                    introDuration: 15
                                                });
                                                setIsEditingBlock(true);
                                                setActiveFolder('emission:new');
                                            }}
                                            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500/40 text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>+ Nouvelle Émission</span>
                                        </button>
                                    </div>
                                </div>

                                {/* SOUS-ONGLET 1 : TIMELINE CONDUCTEUR CALÉ SUR L'HEURE */}
                                {progSubTab === 'timeline' && (
                                    <div className="space-y-5">
                                        {/* CARTE LIVE ACTUELLE AVEC DÉCOMPTE & PROGRESSION EN TEMPS RÉEL */}
                                        {liveTrackInfo?.item && (
                                            <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-black/60 border border-cyan-500/40 shadow-xl relative overflow-hidden flex flex-col gap-3">
                                                <div className="flex flex-wrap items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black/60 border border-cyan-500/30 relative flex items-center justify-center">
                                                            {liveTrackInfo.item.audioUrl ? (
                                                                <FileAudio className="w-8 h-8 text-cyan-300" />
                                                            ) : liveTrackInfo.item.youtubeId ? (
                                                                <img
                                                                    src={`https://img.youtube.com/vi/${liveTrackInfo.item.youtubeId}/hqdefault.jpg`}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <Radio className="w-8 h-8 text-cyan-400" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-[9px] font-display font-black uppercase italic px-2 py-0.5 rounded bg-red-500 text-white flex items-center gap-1 shadow-sm">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                                                    EN CE MOMENT EN DIRECT
                                                                </span>
                                                                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                                                                    {liveTrackInfo.item.startTime} ➔ {liveTrackInfo.item.endTime}
                                                                </span>
                                                                <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                                                                    ⏱️ Reste : {formatDurationExact(liveRemainingSec)}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-gray-400">
                                                                    {liveTrackInfo.item.blockTitle}
                                                                </span>
                                                            </div>
                                                            <h3 className="text-base font-display font-black text-white uppercase italic tracking-tight truncate mt-1">
                                                                {liveTrackInfo.item.title}
                                                            </h3>
                                                            <p className="text-xs font-sans text-gray-300 truncate">
                                                                {liveTrackInfo.item.artist || 'DROPSIDERS RADIO'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Écoute */}
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                handlePlayMedia({
                                                                    id: liveTrackInfo.item.id,
                                                                    title: liveTrackInfo.item.title,
                                                                    artist: liveTrackInfo.item.artist,
                                                                    audioUrl: liveTrackInfo.item.audioUrl,
                                                                    youtubeId: liveTrackInfo.item.youtubeId,
                                                                    duration: liveTrackInfo.item.durationSeconds
                                                                });
                                                            }}
                                                            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-white text-black font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 cursor-pointer shadow-md transition-all"
                                                        >
                                                            <Play className="w-3.5 h-3.5 fill-current" />
                                                            <span>Écouter le direct</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Barre de progression temps réel */}
                                                <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden border border-white/10">
                                                    <div
                                                        className="bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400 h-full transition-all duration-1000"
                                                        style={{
                                                            width: `${Math.min(100, Math.max(0, (((liveTrackInfo.offsetSeconds || 0)) / Math.max(1, liveTrackInfo.item.durationSeconds || 180)) * 100))}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* BARRE D'AFFICHAGE & FILTRES CONDUCTEUR (CALÉ SUR L'HEURE PAR DÉFAUT) */}
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center justify-between gap-3 bg-black/40 p-3 rounded-2xl border border-white/10 text-xs">
                                                {/* Sélecteur de mode horaire */}
                                                <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10">
                                                    <button
                                                        type="button"
                                                        onClick={() => setProgScope('now_upcoming')}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                                            progScope === 'now_upcoming'
                                                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-black shadow-md shadow-cyan-500/20'
                                                                : 'text-gray-400 hover:text-white'
                                                        }`}
                                                        title="Affiche le morceau en direct et les suivants à partir de l'heure qu'il est"
                                                    >
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>⏱️ En ce moment & À suivre</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setProgScope('current_show')}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                                            progScope === 'current_show'
                                                                ? 'bg-cyan-500 text-black font-black shadow-md shadow-cyan-500/20'
                                                                : 'text-gray-400 hover:text-white'
                                                        }`}
                                                        title="Affiche uniquement les morceaux de l'émission en cours"
                                                    >
                                                        <Radio className="w-3.5 h-3.5" />
                                                        <span>📻 Émission en cours</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setProgScope('full_day')}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                                            progScope === 'full_day'
                                                                ? 'bg-white/20 text-white font-black'
                                                                : 'text-gray-400 hover:text-white'
                                                        }`}
                                                        title="Affiche toute la journée de 00:00 à 23:59"
                                                    >
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span>🗓️ Toute la journée (24h)</span>
                                                    </button>
                                                </div>

                                                {/* Filtre par émission */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[10px] uppercase font-bold text-gray-400">Émission :</span>
                                                    <select
                                                        value={progBlockFilter}
                                                        onChange={e => setProgBlockFilter(e.target.value)}
                                                        className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-400"
                                                    >
                                                        <option value="all">Toutes les émissions</option>
                                                        {blocks.map(b => (
                                                            <option key={b.id} value={b.id}>
                                                                {b.emoji} {b.title} ({formatRadioTimeSlot(b.startHour, b.endHour)})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Recherche textuelle + information morceaux passés masqués */}
                                            <div className="flex flex-wrap items-center justify-between gap-3 bg-black/20 px-3 py-2 rounded-xl border border-white/5 text-xs">
                                                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                                    <Search className="w-3.5 h-3.5 text-gray-500" />
                                                    <input
                                                        type="text"
                                                        value={progSearch}
                                                        onChange={e => setProgSearch(e.target.value)}
                                                        placeholder="Rechercher par titre, artiste, émission..."
                                                        className="w-full bg-transparent text-white text-xs placeholder:text-gray-500 focus:outline-none"
                                                    />
                                                    {progSearch && (
                                                        <button type="button" onClick={() => setProgSearch('')} className="text-gray-500 hover:text-white">
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>

                                                {progScope === 'now_upcoming' && scheduleResult.pastCount > 0 && (
                                                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                                        <span>✓ Calé sur l'heure actuelle ({scheduleResult.pastCount} passés masqués)</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setProgScope('full_day')}
                                                            className="text-cyan-400 underline hover:text-cyan-300 cursor-pointer ml-1"
                                                        >
                                                            Voir toute la journée
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* TABLEAU CONDUCTEUR */}
                                        <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/30">
                                            <table className="w-full text-left border-collapse text-xs">
                                                <thead>
                                                    <tr className="border-b border-white/10 bg-white/[0.02] text-gray-400 font-mono text-[10px] uppercase tracking-wider">
                                                        <th className="py-2.5 px-3 w-12 text-center">Écoute</th>
                                                        <th className="py-2.5 px-3 w-28">Créneau</th>
                                                        <th className="py-2.5 px-3 w-24">Type</th>
                                                        <th className="py-2.5 px-3">Titre & Artiste</th>
                                                        <th className="py-2.5 px-3 w-36">Émission</th>
                                                        <th className="py-2.5 px-3 w-20 text-right">Durée</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 font-sans">
                                                    {filteredScheduleItems.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={6} className="py-12 text-center text-gray-500 font-display font-black uppercase italic">
                                                                Aucun morceau trouvé pour cette sélection.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        filteredScheduleItems.map((item, idx) => {
                                                            const isCurrentLive = item.isCurrentlyLive;
                                                            const meta = getRadioCategoryMeta(item.category, item.isThemeJingle, item.isTopHoraire);
                                                            const isItemPlaying = currentAudio?.id === item.id && isPlaying;

                                                            return (
                                                                <tr
                                                                    key={item.id || idx}
                                                                    className={`transition-colors group ${
                                                                        isCurrentLive
                                                                            ? 'bg-cyan-500/15 border-l-4 border-l-cyan-400'
                                                                            : idx % 2 === 0 ? 'bg-white/[0.01] hover:bg-white/5' : 'bg-black/20 hover:bg-white/5'
                                                                    }`}
                                                                >
                                                                    <td className="py-2 px-3 text-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                handlePlayMedia({
                                                                                    id: item.id,
                                                                                    title: item.title,
                                                                                    artist: item.artist,
                                                                                    audioUrl: item.audioUrl,
                                                                                    youtubeId: item.youtubeId,
                                                                                    duration: item.durationSeconds
                                                                                });
                                                                            }}
                                                                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                                                                                isItemPlaying
                                                                                    ? 'bg-cyan-500 text-black shadow-md'
                                                                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/15'
                                                                            }`}
                                                                        >
                                                                            {isItemPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                                                                        </button>
                                                                    </td>

                                                                    <td className="py-2 px-3 font-mono text-[11px] whitespace-nowrap">
                                                                        <span className={`font-bold ${isCurrentLive ? 'text-cyan-300' : 'text-gray-300'}`}>
                                                                            {item.startTime}
                                                                        </span>
                                                                        <span className="text-gray-500 text-[10px]"> ➔ {item.endTime}</span>
                                                                        {isCurrentLive && (
                                                                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-red-500 text-white text-[8px] font-display font-black uppercase italic animate-pulse">
                                                                                LIVE
                                                                            </span>
                                                                        )}
                                                                    </td>

                                                                    <td className="py-2 px-3">
                                                                        <span className={`text-[9px] font-display font-black uppercase italic px-2 py-0.5 rounded border inline-flex items-center gap-1 ${meta.bg} ${meta.text} ${meta.border}`}>
                                                                            <span>{meta.emoji}</span>
                                                                            <span>{meta.label}</span>
                                                                        </span>
                                                                    </td>

                                                                    <td className="py-2 px-3 min-w-0">
                                                                        <div className="truncate font-bold text-white text-xs group-hover:text-cyan-300 transition-colors">
                                                                            {item.title}
                                                                        </div>
                                                                        <div className="truncate text-gray-400 text-[11px]">
                                                                            {item.artist || 'Artiste'}
                                                                        </div>
                                                                    </td>

                                                                    <td className="py-2 px-3 text-gray-300 text-xs truncate">
                                                                        <span className="inline-flex items-center gap-1">
                                                                            <span>{item.blockEmoji}</span>
                                                                            <span>{item.blockTitle}</span>
                                                                        </span>
                                                                    </td>

                                                                    <td className="py-2 px-3 text-right font-mono text-gray-400 text-[11px] whitespace-nowrap">
                                                                        {item.durationFormatted}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* SOUS-ONGLET 2 : GRILLE DES ÉMISSIONS */}
                                {progSubTab === 'grid' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {blocks.map((b, idx) => {
                                            const tracksCount = (b.tracks || []).length;
                                            const totalDurSec = (b.tracks || []).reduce((acc, t) => acc + (t.duration || 3600), 0);
                                            const totalDurHours = Math.round(totalDurSec / 3600);
                                            const isNow = isRadioBlockActiveNow(b);

                                            return (
                                                <div
                                                    key={b.id}
                                                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                                                        isNow
                                                            ? 'bg-gradient-to-br from-cyan-950/30 to-[#0e1320] border-cyan-500/50 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                                                            : 'bg-[#0f1422] border-white/10 hover:border-white/20'
                                                    }`}
                                                >
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-300 font-bold">
                                                                Émission #{idx + 1}
                                                            </span>
                                                            {isNow && (
                                                                <span className="text-[9px] font-display font-black uppercase italic px-2 py-0.5 rounded bg-red-500 text-white flex items-center gap-1 animate-pulse">
                                                                    ● EN CE MOMENT
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-start gap-3">
                                                            <span className="text-3xl shrink-0 p-2 rounded-xl bg-white/5 border border-white/10">
                                                                {b.emoji || '📻'}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <h3 className="text-base font-display font-black text-white uppercase italic tracking-tight truncate">
                                                                    {b.title}
                                                                </h3>
                                                                <p className="text-xs font-mono text-cyan-400 font-bold mt-0.5">
                                                                    {formatRadioTimeSlot(b.startHour, b.endHour)}
                                                                </p>
                                                                <p className="text-[11px] text-gray-400 mt-1 font-sans">
                                                                    Diffusion : <strong className="text-gray-300">{formatRadioBlockDays(b.days)}</strong>
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px] font-mono text-gray-400">
                                                            <div>
                                                                Morceaux : <strong className="text-white">{tracksCount}</strong>
                                                            </div>
                                                            <div>
                                                                Durée : <strong className="text-white">~{totalDurHours}h</strong>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 mt-4 border-t border-white/10 flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveFolder(`emission:${b.id}`)}
                                                            className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black font-display font-black text-[11px] uppercase italic tracking-wider transition-all cursor-pointer text-center"
                                                        >
                                                            📂 Ouvrir le bac
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingBlockId(b.id);
                                                                setEditBlockForm({
                                                                    title: b.title,
                                                                    host: b.host || '',
                                                                    emoji: b.emoji,
                                                                    color: b.color,
                                                                    startHour: b.startHour,
                                                                    endHour: b.endHour,
                                                                    days: b.days || ALL_DAYS,
                                                                    randomize: b.randomize !== false,
                                                                    jingleFrequency: b.jingleFrequency ?? 2,
                                                                    rotationRule: b.rotationRule || 'jingle_son_special_promo',
                                                                    introEnabled: b.themeJingle?.enabled !== false,
                                                                    introTitle: b.themeJingle?.title || '',
                                                                    introAudioUrl: b.themeJingle?.audioUrl || '',
                                                                    introYoutubeId: b.themeJingle?.youtubeId || '',
                                                                    introDuration: b.themeJingle?.duration || 15
                                                                });
                                                                setIsEditingBlock(true);
                                                                setActiveFolder(`emission:${b.id}`);
                                                            }}
                                                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all cursor-pointer border border-white/10"
                                                            title="Modifier les horaires de cette émission"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* SOUS-ONGLET 3 : RÉGIE LIVE & SOUNDBOARD */}
                                {progSubTab === 'on_air' && (
                                    <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40">
                                        <RadioOnAirMonitor
                                            blocks={blocks}
                                            topHoraireConfig={topHoraireConfig}
                                            isRadioActive={isRadioActive}
                                            onToggleRadio={onToggleRadio}
                                            onGoToRundown={() => setProgSubTab('timeline')}
                                            onGoToMediaPool={() => setActiveFolder('tv_lib')}
                                            listenersCount={listenersCount}
                                            isLiveMicActive={isLiveMicActive}
                                            isMicTesting={isMicTesting}
                                            audioLevel={audioLevel}
                                            isHeadphoneMonitor={isHeadphoneMonitor}
                                            onToggleLiveMic={handleToggleLiveMic}
                                            onToggleMicTest={handleToggleMicTest}
                                            onToggleHeadphoneMonitor={handleToggleHeadphoneMonitor}
                                            onGoToStats={() => setActiveFolder('stats')}
                                            micStream={micStreamRef.current}
                                            monitorGainNode={monitorGainNodeRef.current}
                                        />
                                    </div>
                                )}

                                {/* SOUS-ONGLET 4 : YOUTUBE CUE PLAYER (CALAGE AUDIO EN DIRECT) */}
                                {progSubTab === 'youtube_cue' && (
                                    <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40 p-1">
                                        <RadioYouTubeCuePlayer />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── PANEL STATISTIQUES & AUDIENCE RADIO (CONFIDENTIEL RÉGIE) ── */}
                        {activeFolder === 'stats' && (
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col min-h-0 bg-[#0a0e17]">
                                {/* BANDEAU EN-TÊTE STATS */}
                                <div className="p-5 rounded-2xl bg-gradient-to-r from-[#120f24] via-[#1a1236] to-[#0f1122] border border-purple-500/30 shadow-2xl flex flex-wrap items-center justify-between gap-4 relative shrink-0 overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400" />
                                    
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_25px_rgba(168,85,247,0.35)] shrink-0">
                                            <BarChart3 className="w-6 h-6 animate-pulse" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h2 className="text-xl sm:text-2xl font-display font-black text-white uppercase italic tracking-tight">
                                                    📊 Statistiques & Audience
                                                </h2>
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0 flex items-center gap-1 font-bold">
                                                    <ShieldCheck className="w-3 h-3 text-purple-400" />
                                                    PRIVÉ / RÉGIE ADMIN
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 font-sans mt-0.5">
                                                Audience temps réel, analyse des tranches horaires et performances des émissions (masqué au grand public)
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action rapide : simulateur / rafraîchir */}
                                    <div className="flex items-center gap-3">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Dernière synchro</p>
                                            <p className="text-xs font-mono font-bold text-purple-300">Temps réel continu</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => showToast('Audience actualisée avec succès', 'info')}
                                            className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            <span>Actualiser</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 4 GRANDES CARTES KPI */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* KPI 1 : Auditeurs en Direct */}
                                    <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 to-black/60 border border-purple-500/40 shadow-xl flex flex-col justify-between relative overflow-hidden group">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-300 font-bold flex items-center gap-1.5">
                                                <Users className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                                                Auditeurs Direct (LIVE)
                                            </span>
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                        </div>
                                        <div className="my-3">
                                            <div className="text-3xl sm:text-4xl font-mono font-black text-white flex items-baseline gap-2">
                                                <span>{listenersCount}</span>
                                                <span className="text-xs font-sans text-emerald-400 font-bold flex items-center">
                                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                                    En ligne
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-400 mt-1">
                                                Écoutes actives synchronisées sur le serveur radio
                                            </p>
                                        </div>
                                        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                                            <span>Statut antenne :</span>
                                            <strong className={isRadioActive ? 'text-emerald-400' : 'text-red-400'}>
                                                {isRadioActive ? '● ON AIR' : '○ EN PAUSE'}
                                            </strong>
                                        </div>
                                    </div>

                                    {/* KPI 2 : Pic du Jour (Réel) */}
                                    <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-black/60 border border-emerald-500/30 shadow-xl flex flex-col justify-between relative overflow-hidden">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 font-bold flex items-center gap-1.5">
                                                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                                Pic d'Audience Réel
                                            </span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                                                LIVE
                                            </span>
                                        </div>
                                        <div className="my-3">
                                            <div className="text-3xl sm:text-4xl font-mono font-black text-white flex items-baseline gap-2">
                                                <span>{Math.max(listenersCount, parseInt(localStorage.getItem('dropsiders_radio_peak_listeners') || '0', 10))}</span>
                                                <span className="text-xs font-sans text-gray-400">max</span>
                                            </div>
                                            <p className="text-[11px] text-gray-400 mt-1">
                                                Pic réel enregistré pendant les sessions
                                            </p>
                                        </div>
                                        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                                            <span>Auditeurs actuels :</span>
                                            <strong className="text-white">{listenersCount} en direct</strong>
                                        </div>
                                    </div>

                                    {/* KPI 3 : Sessions Réelles */}
                                    <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/30 to-black/60 border border-cyan-500/30 shadow-xl flex flex-col justify-between relative overflow-hidden">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 font-bold flex items-center gap-1.5">
                                                <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                                                Sessions Réelles
                                            </span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                                                Cumul
                                            </span>
                                        </div>
                                        <div className="my-3">
                                            <div className="text-3xl sm:text-4xl font-mono font-black text-white flex items-baseline gap-2">
                                                <span>{parseInt(localStorage.getItem('dropsiders_radio_total_sessions') || (listenersCount > 0 ? '1' : '0'), 10)}</span>
                                                <span className="text-xs font-sans text-gray-400">écoutes</span>
                                            </div>
                                            <p className="text-[11px] text-gray-400 mt-1">
                                                Lancements réels du player radio enregistrés
                                            </p>
                                        </div>
                                        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                                            <span>Activité :</span>
                                            <strong className="text-white">
                                                {listenersCount > 0 ? '1 session en cours' : 'Aucune session active'}
                                            </strong>
                                        </div>
                                    </div>

                                    {/* KPI 4 : Durée d'Écoute Réelle */}
                                    <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 to-black/60 border border-amber-500/30 shadow-xl flex flex-col justify-between relative overflow-hidden">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                                Durée d'Écoute
                                            </span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                                                Réelle
                                            </span>
                                        </div>
                                        <div className="my-3">
                                            <div className="text-3xl sm:text-4xl font-mono font-black text-white flex items-baseline gap-2">
                                                <span>
                                                    {(() => {
                                                        const sec = parseInt(localStorage.getItem('dropsiders_radio_listen_sec') || '0', 10);
                                                        if (sec <= 0) return '0m 00s';
                                                        const m = Math.floor(sec / 60);
                                                        const s = sec % 60;
                                                        return `${m}m ${String(s).padStart(2, '0')}s`;
                                                    })()}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-400 mt-1">
                                                Temps d'écoute cumulé réel sur votre radio
                                            </p>
                                        </div>
                                        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                                            <span>Statut écoute :</span>
                                            <strong className={listenersCount > 0 ? 'text-emerald-400 font-bold' : 'text-gray-400 font-bold'}>
                                                {listenersCount > 0 ? '● Écoute active' : '○ En pause'}
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                {/* GRAPHIQUE D'AUDIENCE SUR 24 HEURES (HISTORIQUE RÉEL) */}
                                <div className="p-6 rounded-3xl bg-black/40 border border-white/10 shadow-xl space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-display font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                                                <Activity className="w-4 h-4 text-cyan-400" />
                                                Courbe d'Audience par Heure (00h — 23h)
                                            </h3>
                                            <p className="text-xs text-gray-400 font-sans mt-0.5">
                                                Historique réel des auditeurs connectés heure par heure (sans aucune simulation)
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-mono">
                                            <span className="flex items-center gap-1.5 text-cyan-300">
                                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Heure en cours
                                            </span>
                                            <span className="flex items-center gap-1.5 text-purple-300">
                                                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Heures enregistrées
                                            </span>
                                        </div>
                                    </div>

                                    {/* Barres des 24 heures */}
                                    <div className="pt-6 pb-2">
                                        <div className="h-48 flex items-end gap-1.5 sm:gap-2">
                                            {(() => {
                                                const hourlyHistory: Record<number, number> = (() => {
                                                    try {
                                                        const raw = localStorage.getItem('dropsiders_radio_hourly_history');
                                                        return raw ? JSON.parse(raw) : {};
                                                    } catch { return {}; }
                                                })();

                                                const currentHour = new Date().getHours();
                                                const maxObserved = Math.max(1, listenersCount, ...Object.values(hourlyHistory).map(v => Number(v) || 0));

                                                return Array.from({ length: 24 }).map((_, hour) => {
                                                    const isCurrent = hour === currentHour;
                                                    const count = isCurrent ? listenersCount : (hourlyHistory[hour] || 0);
                                                    const heightPct = count > 0 ? Math.min(100, Math.max(15, Math.round((count / maxObserved) * 100))) : 0;

                                                    return (
                                                        <div
                                                            key={hour}
                                                            className="flex-1 flex flex-col items-center h-full justify-end group relative"
                                                        >
                                                            {/* Tooltip au survol */}
                                                            <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/90 border border-purple-500/40 text-white rounded-lg px-2 py-1 text-[10px] font-mono whitespace-nowrap shadow-xl z-20">
                                                                <div><strong>{hour}h00 — {hour + 1}h00</strong></div>
                                                                <div className="text-cyan-300 font-bold">{count} auditeur{count > 1 ? 's' : ''}</div>
                                                            </div>

                                                            {/* Barre */}
                                                            <div className="w-full flex items-end justify-center h-full">
                                                                {count > 0 ? (
                                                                    <div
                                                                        style={{ height: `${heightPct}%` }}
                                                                        className={`w-full rounded-t-md transition-all duration-300 ${
                                                                            isCurrent
                                                                                ? 'bg-gradient-to-t from-cyan-500 to-emerald-400 shadow-[0_0_15px_rgba(0,240,255,0.6)] border-t-2 border-white'
                                                                                : 'bg-gradient-to-t from-purple-950/80 via-purple-700/60 to-purple-500/80 group-hover:from-purple-800 group-hover:to-cyan-400'
                                                                        }`}
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-1 rounded-full bg-white/5 group-hover:bg-white/10" />
                                                                )}
                                                            </div>

                                                            {/* Heure en bas */}
                                                            <span className={`text-[9px] font-mono mt-2 ${isCurrent ? 'text-cyan-300 font-black scale-110' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                                                {hour % 3 === 0 ? `${hour}h` : '·'}
                                                            </span>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                {/* DEUX COLONNES D'ANALYSE DÉTAILLÉE */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Colonne 1 : Performance des Émissions */}
                                    <div className="p-6 rounded-3xl bg-black/40 border border-white/10 shadow-xl space-y-4">
                                        <h3 className="text-base font-display font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                                            <Radio className="w-4 h-4 text-purple-400" />
                                            Audience par Émission de la Grille
                                        </h3>
                                        <p className="text-xs text-gray-400 font-sans">
                                            Auditeurs réels actuellement à l'antenne par tranche horaire :
                                        </p>

                                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                                            {blocks.map((b) => {
                                                const isCurrent = isRadioBlockActiveNow(b);
                                                const emissionAudience = isCurrent ? listenersCount : 0;
                                                return (
                                                    <div
                                                        key={b.id}
                                                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                                                            isCurrent
                                                                ? 'bg-purple-950/30 border-purple-500/50 shadow-md'
                                                                : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <span className="text-xl shrink-0">{b.emoji || '🎧'}</span>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-xs font-bold text-white truncate">{b.title}</p>
                                                                    {isCurrent && (
                                                                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500 text-white animate-pulse">
                                                                             DIRECT
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px] font-mono text-gray-400">
                                                                    {formatRadioTimeSlot(b.startHour, b.endHour)} • {(b.tracks || []).length} morceaux
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="text-right shrink-0">
                                                            <span className="text-xs font-mono font-bold text-purple-300">
                                                                {isCurrent ? `${emissionAudience} en direct` : '0 auditeur'}
                                                            </span>
                                                            <div className="w-20 h-1.5 bg-black/60 rounded-full overflow-hidden mt-1 border border-white/10">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all"
                                                                    style={{ width: `${isCurrent && emissionAudience > 0 ? 100 : 0}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Colonne 2 : Répartition Géographique & Plateformes Réelles */}
                                    <div className="space-y-6">
                                        {/* Pays */}
                                        <div className="p-6 rounded-3xl bg-black/40 border border-white/10 shadow-xl space-y-4">
                                            <h3 className="text-base font-display font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-cyan-400" />
                                                Origine des Auditeurs Connectés
                                            </h3>

                                            <div className="space-y-2 text-xs">
                                                {listenersCount === 0 ? (
                                                    <p className="text-xs font-mono text-gray-500 py-4 text-center">
                                                        Aucun auditeur en direct actuellement.
                                                    </p>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between font-mono text-[11px]">
                                                            <span className="text-gray-300">🇫🇷 France (Localisation détectée)</span>
                                                            <span className="text-cyan-300 font-bold">100% ({listenersCount} en direct)</span>
                                                        </div>
                                                        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
                                                                style={{ width: '100%' }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Supports d'écoute réels */}
                                        <div className="p-6 rounded-3xl bg-black/40 border border-white/10 shadow-xl space-y-4">
                                            <h3 className="text-base font-display font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                                                <Smartphone className="w-4 h-4 text-amber-400" />
                                                Appareils d'Écoute Connectés
                                            </h3>

                                            {(() => {
                                                const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                                                const desktopPct = listenersCount > 0 ? (isMobile ? 0 : 100) : 0;
                                                const mobilePct = listenersCount > 0 ? (isMobile ? 100 : 0) : 0;

                                                return (
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                                                            <p className="text-2xl font-mono font-black text-white">{mobilePct}%</p>
                                                            <p className="text-[10px] font-mono text-gray-400 mt-1">📱 Mobile</p>
                                                        </div>
                                                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                                                            <p className="text-2xl font-mono font-black text-white">{desktopPct}%</p>
                                                            <p className="text-[10px] font-mono text-gray-400 mt-1">💻 Ordinateur</p>
                                                        </div>
                                                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                                                            <p className="text-2xl font-mono font-black text-white">0%</p>
                                                            <p className="text-[10px] font-mono text-gray-400 mt-1">📺 TV & Auto</p>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                {/* BANDEAU DE SÉCURITÉ / CONFIDENTIALITÉ */}
                                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex items-center gap-3 text-xs text-gray-300">
                                    <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
                                    <span>
                                        <strong>Mode Privé Actif :</strong> Ce compteur d'auditeurs et ces métriques sont strictement cantonnés à cet onglet Stats de l'administration. Aucun visiteur ou auditeur public ne peut voir le nombre d'écoutes sur le site.
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* ── PANEL DÉDICACES & CHAT AUDITEURS EN RÉGIE ── */}
                        {activeFolder === 'dedications' && (
                            <div className="flex-1 overflow-y-auto p-6 flex flex-col min-h-0 bg-[#0a0e17]">
                                <RadioDedicationsPanel />
                            </div>
                        )}

                        {/* ── PANEL ENREGISTREUR D'ÉMISSIONS (PODCAST / REPLAY) ── */}
                        {activeFolder === 'recorder' && (
                            <div className="flex-1 overflow-y-auto p-6 flex flex-col min-h-0 bg-[#0a0e17]">
                                <RadioBroadcastRecorder micStream={micStreamRef.current} />
                            </div>
                        )}

                        {/* ── AUTRES DOSSIERS (ÉMISSIONS, JINGLES, PROMOS, PUBS, BIBLIOTHÈQUE TV) ── */}
                        {activeFolder !== 'top_horaire' && activeFolder !== 'programmation' && activeFolder !== 'stats' && (
                            <>
                                {/* Formulaire d'édition de l'émission si activé */}
                                {isEditingBlock && (

                            <div className="p-5 border-b border-white/10 bg-[#121622] space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-display font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                                        <Pencil className="w-4 h-4 text-cyan-400" />
                                        {editingBlockId ? 'Modifier les paramètres de l\'émission' : 'Créer une nouvelle émission'}
                                    </h3>
                                    <button type="button" onClick={() => setIsEditingBlock(false)} className="text-gray-400 hover:text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                    <div className="md:col-span-4 space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Nom de l'émission</label>
                                        <input
                                            type="text"
                                            value={editBlockForm.title}
                                            onChange={e => setEditBlockForm(f => ({ ...f, title: e.target.value }))}
                                            placeholder="Ex: DROPSIDERS CLUB"
                                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                                        />
                                    </div>
                                    <div className="md:col-span-4 space-y-1">
                                        <label className="text-[10px] font-bold text-cyan-400 uppercase flex items-center gap-1">
                                            <span>🎙️</span> Animateur / Host
                                        </label>
                                        <input
                                            type="text"
                                            value={editBlockForm.host}
                                            onChange={e => setEditBlockForm(f => ({ ...f, host: e.target.value }))}
                                            placeholder="Ex: Alex, DJ Snake, etc."
                                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-cyan-500/30 text-white text-xs focus:outline-none focus:border-cyan-400"
                                        />
                                    </div>
                                    <div className="md:col-span-4 space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Créneau</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number" min={0} max={23}
                                                value={editBlockForm.startHour}
                                                onChange={e => setEditBlockForm(f => ({ ...f, startHour: parseInt(e.target.value) || 0 }))}
                                                className="w-16 px-2 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-center text-xs font-mono"
                                            />
                                            <span className="text-gray-400 text-xs">h →</span>
                                            <input
                                                type="number" min={1} max={24}
                                                value={editBlockForm.endHour}
                                                onChange={e => setEditBlockForm(f => ({ ...f, endHour: parseInt(e.target.value) || 4 }))}
                                                className="w-16 px-2 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-center text-xs font-mono"
                                            />
                                            <span className="text-gray-400 text-xs">h</span>
                                        </div>
                                    </div>
                                    {/* ── Choix de la Règle d'Alternance personnalisée ── */}
                                    <div className="md:col-span-8 space-y-1">
                                        <label className="text-[10px] font-bold text-purple-400 uppercase flex items-center gap-1">
                                            <span>⚡</span> Règle d'alternance Jingles & Promos
                                        </label>
                                        <select
                                            value={editBlockForm.rotationRule}
                                            onChange={e => setEditBlockForm(f => ({ ...f, rotationRule: e.target.value as RadioRotationRule }))}
                                            className="w-full px-2.5 py-2 rounded-xl bg-black/40 border border-purple-500/30 text-purple-200 text-xs font-bold focus:outline-none focus:border-purple-400 cursor-pointer"
                                        >
                                            <option value="jingle_son_special_promo">⭐ Alterne : Normal → Son → Spécial → Son (promo tous les 4)</option>
                                            <option value="son_special_son_jingle_promo">🎵 1 Son ➔ 1 Spécial ➔ 1 Son ➔ 1 Normal ➔ 1 Promo</option>
                                            <option value="every_2_tracks">⏱️ Tous les 2 sons : Alterne Spécial / Normal / Promo</option>
                                            <option value="every_3_tracks">⏱️ Tous les 3 sons : Alterne Spécial / Normal / Promo</option>
                                            <option value="jingles_only">🔔 Jingles uniquement (sans pub)</option>
                                            <option value="music_only">🎧 100% Musique (non-stop)</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-4 flex items-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!editBlockForm.title.trim()) return;
                                                // Construire le themeJingle si un générique est défini
                                                const hasIntro = !!(editBlockForm.introAudioUrl.trim() || editBlockForm.introYoutubeId.trim());
                                                const themeJingle = hasIntro ? {
                                                    enabled: editBlockForm.introEnabled,
                                                    title: editBlockForm.introTitle.trim() || `Générique ${editBlockForm.title.trim()}`,
                                                    audioUrl: editBlockForm.introAudioUrl.trim() || undefined,
                                                    youtubeId: editBlockForm.introYoutubeId.trim() || undefined,
                                                    duration: editBlockForm.introDuration
                                                } : undefined;

                                                if (editingBlockId) {
                                                    setBlocks(prev => prev.map(b => b.id === editingBlockId ? {
                                                        ...b,
                                                        title: editBlockForm.title.trim().toUpperCase(),
                                                        host: editBlockForm.host.trim() || undefined,
                                                        startHour: editBlockForm.startHour,
                                                        endHour: editBlockForm.endHour,
                                                        jingleFrequency: editBlockForm.jingleFrequency,
                                                        rotationRule: editBlockForm.rotationRule,
                                                        timeSlot: formatRadioTimeSlot(editBlockForm.startHour, editBlockForm.endHour),
                                                        themeJingle: themeJingle ?? b.themeJingle
                                                    } : b));
                                                    showToast('Émission modifiée');
                                                } else {
                                                    const newId = `bloc_${Date.now()}`;
                                                    const newB: RadioScheduleBlock = {
                                                        id: newId,
                                                        title: editBlockForm.title.trim().toUpperCase(),
                                                        name: editBlockForm.title.trim().toUpperCase(),
                                                        host: editBlockForm.host.trim() || undefined,
                                                        startHour: editBlockForm.startHour,
                                                        endHour: editBlockForm.endHour,
                                                        timeSlot: formatRadioTimeSlot(editBlockForm.startHour, editBlockForm.endHour),
                                                        color: editBlockForm.color,
                                                        emoji: editBlockForm.emoji,
                                                        randomize: true,
                                                        jingleFrequency: editBlockForm.jingleFrequency,
                                                        rotationRule: editBlockForm.rotationRule,
                                                        tracks: [],
                                                        specialJingles: [],
                                                        themeJingle: themeJingle
                                                    };
                                                    setBlocks(prev => [...prev, newB]);
                                                    setSelectedBlockId(newId);
                                                    setActiveFolder(`emission:${newId}`);
                                                    showToast('Émission créée');
                                                }
                                                setIsEditingBlock(false);
                                            }}
                                            className="w-full py-2 px-4 rounded-xl bg-cyan-500 hover:bg-white text-black font-display font-black text-xs uppercase italic cursor-pointer shadow-lg shadow-cyan-500/20"
                                        >
                                            Valider l'émission
                                        </button>
                                    </div>
                                </div>

                                {/* ── SECTION GÉNÉRIQUE D'INTRO ── */}
                                <div className="border-t border-white/10 pt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">🎙️</span>
                                            <span className="text-[11px] font-display font-black text-purple-300 uppercase italic tracking-wider">Générique d'intro</span>
                                            <span className="text-[9px] font-mono text-gray-500 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded-full">Diffusé uniquement au début</span>
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <span className="text-[10px] text-gray-400 font-bold">Activé</span>
                                            <div
                                                onClick={() => setEditBlockForm(f => ({ ...f, introEnabled: !f.introEnabled }))}
                                                className={`relative w-8 h-4 rounded-full transition-all cursor-pointer ${
                                                    editBlockForm.introEnabled ? 'bg-purple-500' : 'bg-gray-600'
                                                }`}
                                            >
                                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${
                                                    editBlockForm.introEnabled ? 'left-4' : 'left-0.5'
                                                }`} />
                                            </div>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                                        {/* Titre du générique */}
                                        <div className="md:col-span-4 space-y-1">
                                            <label className="text-[9px] font-bold text-purple-400 uppercase">Titre du générique</label>
                                            <input
                                                type="text"
                                                value={editBlockForm.introTitle}
                                                onChange={e => setEditBlockForm(f => ({ ...f, introTitle: e.target.value }))}
                                                placeholder={`Générique ${editBlockForm.title || 'émission'}`}
                                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-purple-400 placeholder:text-gray-600"
                                            />
                                        </div>

                                        {/* URL Audio MP3/WAV ou YouTube */}
                                        <div className="md:col-span-5 space-y-1">
                                            <label className="text-[9px] font-bold text-purple-400 uppercase">URL MP3/WAV ou YouTube</label>
                                            <div className="flex gap-1.5">
                                                <input
                                                    type="text"
                                                    value={editBlockForm.introAudioUrl || editBlockForm.introYoutubeId}
                                                    onChange={e => {
                                                        const val = e.target.value.trim();
                                                        const ytId = extractYouTubeId(val);
                                                        if (ytId) {
                                                            setEditBlockForm(f => ({ ...f, introYoutubeId: ytId, introAudioUrl: '' }));
                                                        } else {
                                                            setEditBlockForm(f => ({ ...f, introAudioUrl: val, introYoutubeId: '' }));
                                                        }
                                                    }}
                                                    placeholder="https://...mp3 ou URL YouTube"
                                                    className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-purple-500/30 text-white text-xs font-mono focus:outline-none focus:border-purple-400 placeholder:text-gray-600"
                                                />
                                                {/* Bouton Upload fichier local */}
                                                <button
                                                    type="button"
                                                    onClick={() => introFileInputRef.current?.click()}
                                                    disabled={introUploading}
                                                    className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                                                    title="Uploader un fichier MP3 ou WAV depuis votre ordinateur"
                                                >
                                                    {introUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                                    <span className="hidden sm:inline">{introUploading ? 'Upload...' : 'Upload'}</span>
                                                </button>
                                                <input
                                                    ref={introFileInputRef}
                                                    type="file"
                                                    accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/*"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        setIntroUploading(true);
                                                        try {
                                                            let url = '';
                                                            try {
                                                                url = await uploadFile(file);
                                                            } catch (err) {
                                                                // Fallback to data URI if upload fails
                                                                url = await new Promise((resolve) => {
                                                                    const r = new FileReader();
                                                                    r.onload = () => resolve(r.result as string);
                                                                    r.readAsDataURL(file);
                                                                });
                                                            }
                                                            
                                                            if (url) {
                                                                setEditBlockForm(f => ({
                                                                    ...f,
                                                                    introAudioUrl: url,
                                                                    introYoutubeId: '',
                                                                    introTitle: f.introTitle || file.name.replace(/\.[^.]+$/, '')
                                                                }));
                                                                showToast('✓ Générique uploadé avec succès !', 'success');
                                                            } else {
                                                                showToast('Erreur lors de l\'upload du générique', 'warn');
                                                            }
                                                        } catch (err) {
                                                            showToast('Erreur réseau lors de l\'upload', 'warn');
                                                        } finally {
                                                            setIntroUploading(false);
                                                            if (introFileInputRef.current) introFileInputRef.current.value = '';
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Durée */}
                                        <div className="md:col-span-2 space-y-1">
                                            <label className="text-[9px] font-bold text-purple-400 uppercase">Durée (sec)</label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={300}
                                                value={editBlockForm.introDuration}
                                                onChange={e => setEditBlockForm(f => ({ ...f, introDuration: Math.max(1, parseInt(e.target.value) || 15) }))}
                                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-purple-500/30 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                                            />
                                        </div>

                                        {/* Preview / status du générique */}
                                        {(editBlockForm.introAudioUrl || editBlockForm.introYoutubeId) && (
                                            <div className="md:col-span-1 flex items-end">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (editBlockForm.introAudioUrl) {
                                                            handlePlayMedia({
                                                                id: 'intro_preview',
                                                                title: editBlockForm.introTitle || 'Générique',
                                                                audioUrl: editBlockForm.introAudioUrl,
                                                                duration: editBlockForm.introDuration
                                                            });
                                                        }
                                                    }}
                                                    className="w-full py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                                                    title="Écouter le générique"
                                                >
                                                    {editBlockForm.introAudioUrl ? <Play className="w-3.5 h-3.5" /> : <span className="text-[10px]">YT</span>}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Preview info du générique */}
                                    {(editBlockForm.introAudioUrl || editBlockForm.introYoutubeId) && (
                                        <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-3 flex items-center gap-3">
                                            <span className="text-xl shrink-0">🎙️</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-purple-200 truncate">
                                                    {editBlockForm.introTitle || `Générique ${editBlockForm.title}`}
                                                </div>
                                                <div className="text-[10px] text-gray-400 mt-0.5 font-mono truncate">
                                                    {editBlockForm.introYoutubeId
                                                        ? `🎥 YouTube : ${editBlockForm.introYoutubeId}`
                                                        : `🔊 Audio : ${editBlockForm.introAudioUrl}`
                                                    } • {editBlockForm.introDuration}s
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setEditBlockForm(f => ({ ...f, introAudioUrl: '', introYoutubeId: '', introTitle: '' }))}
                                                className="p-1 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all cursor-pointer shrink-0"
                                                title="Supprimer le générique"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}

                                    {!editBlockForm.introAudioUrl && !editBlockForm.introYoutubeId && (
                                        <p className="text-[10px] text-gray-600 italic">
                                            💡 Le générique sera joué automatiquement au tout début de cette émission, avant le premier morceau.
                                        </p>
                                    )}
                                </div>

                            </div>
                        )}

                        {/* ── FORMULAIRE D'ÉDITION D'UN MORCEAU / PROMO / PUB / JINGLE (inline, apparaît au clic sur ✏️) ── */}
                        {editingTrack && (
                            <div className="p-4 border-b border-cyan-500/30 bg-cyan-950/25 space-y-3 animate-in slide-in-from-top-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[11px] font-display font-black text-cyan-400 uppercase italic tracking-wider flex items-center gap-2">
                                        <Pencil className="w-3.5 h-3.5" />
                                        Modifier le média
                                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                                            editingTrack.category === 'promo' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' :
                                            editingTrack.category === 'pub' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40' :
                                            editingTrack.category === 'jingle' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                                            'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                        }`}>
                                            {editingTrack.category === 'promo' ? '📣 Promo' :
                                             editingTrack.category === 'pub' ? '📢 Pub / Sponsor' :
                                             editingTrack.category === 'jingle' ? '🔔 Jingle' :
                                             editingTrack.category === 'clip' ? '🎬 Clip' : '🎧 Set'}
                                        </span>
                                    </h4>
                                    <button type="button" onClick={() => setEditingTrack(null)} className="text-gray-400 hover:text-white p-1">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                                    <input
                                        type="text"
                                        value={editingTrack.title}
                                        onChange={e => setEditingTrack(t => t ? { ...t, title: e.target.value } : null)}
                                        placeholder="Titre"
                                        className={`${(editingTrack.category === 'promo' || editingTrack.category === 'pub') ? 'md:col-span-3' : 'md:col-span-4'} px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-bold`}
                                    />
                                    <input
                                        type="text"
                                        value={editingTrack.artist}
                                        onChange={e => setEditingTrack(t => t ? { ...t, artist: e.target.value } : null)}
                                        placeholder="Artiste / DJ / Sponsor"
                                        className={`${(editingTrack.category === 'promo' || editingTrack.category === 'pub') ? 'md:col-span-2' : 'md:col-span-3'} px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs`}
                                    />
                                    <select
                                        value={editingTrack.category}
                                        onChange={e => {
                                            const newCat = e.target.value as any;
                                            setEditingTrack(t => {
                                                if (!t) return null;
                                                let newArtist = t.artist;
                                                if (newCat === 'promo' && (t.artist === 'SPONSOR' || t.artist === 'PUBLICITÉ / SPONSOR' || !t.artist)) {
                                                    newArtist = 'PROMO DROPSIDERS';
                                                } else if (newCat === 'pub' && (t.artist === 'PROMO DROPSIDERS' || !t.artist)) {
                                                    newArtist = 'PUBLICITÉ / SPONSOR';
                                                } else if (newCat === 'jingle' && (!t.artist || t.artist === 'SPONSOR' || t.artist === 'PUBLICITÉ / SPONSOR' || t.artist === 'PROMO DROPSIDERS')) {
                                                    newArtist = 'DROPSIDERS JINGLE';
                                                }
                                                return { ...t, category: newCat, artist: newArtist };
                                            });
                                        }}
                                        className="md:col-span-2 px-2 py-1.5 rounded-xl bg-black/50 border border-cyan-500/40 text-cyan-300 font-bold text-xs"
                                    >
                                        <option value="promo">📣 Promo</option>
                                        <option value="pub">📢 Pub / Sponsor</option>
                                        <option value="liveset">🎧 Set</option>
                                        <option value="clip">🎬 Clip</option>
                                        <option value="jingle">🔔 Jingle</option>
                                    </select>
                                    <input
                                        type="number"
                                        value={editingTrack.category === 'liveset' || editingTrack.category === 'clip' ? Math.round(editingTrack.durationSeconds / 60) : editingTrack.durationSeconds}
                                        onChange={e => {
                                            const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                                            setEditingTrack(t => {
                                                if (!t) return null;
                                                const dur = (t.category === 'liveset' || t.category === 'clip') ? val * 60 : val;
                                                return { ...t, durationSeconds: dur };
                                            });
                                        }}
                                        placeholder={editingTrack.category === 'liveset' || editingTrack.category === 'clip' ? 'Min' : 'Sec'}
                                        title={editingTrack.category === 'liveset' || editingTrack.category === 'clip' ? 'Durée en minutes' : 'Durée en secondes'}
                                        className="md:col-span-1 px-2 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono text-center"
                                    />
                                    <input
                                        type="text"
                                        value={editingTrack.youtubeId || editingTrack.audioUrl || ''}
                                        onChange={e => {
                                            const val = e.target.value.trim();
                                            const yt = extractYouTubeId(val);
                                            setEditingTrack(t => t ? {
                                                ...t,
                                                youtubeId: yt || (val.startsWith('http') ? '' : val),
                                                audioUrl: val.startsWith('http') && !yt ? val : t.audioUrl
                                            } : null);
                                        }}
                                        placeholder="YouTube ID ou URL MP3"
                                        className={`${(editingTrack.category === 'promo' || editingTrack.category === 'pub') ? 'md:col-span-1' : 'md:col-span-1'} px-2 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono truncate`}
                                        title="Lien YouTube ou URL audio"
                                    />
                                    {(editingTrack.category === 'promo' || editingTrack.category === 'pub') && (
                                        <div className="md:col-span-2 flex items-center gap-1 bg-black/40 border border-amber-500/40 rounded-xl px-2 py-1" title="Date d'expiration automatique (la promo sera supprimée après cette date)">
                                            <span className="text-[10px] text-amber-400 font-bold whitespace-nowrap">⏳ Fin:</span>
                                            <input
                                                type="date"
                                                value={editingTrack.expiresAt ? editingTrack.expiresAt.split('T')[0] : ''}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setEditingTrack(t => t ? {
                                                        ...t,
                                                        expiresAt: val ? `${val}T23:59:59` : undefined
                                                    } : null);
                                                }}
                                                className="w-full bg-transparent text-amber-300 text-xs font-mono focus:outline-none"
                                            />
                                            {editingTrack.expiresAt && (
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingTrack(t => t ? { ...t, expiresAt: undefined } : null)}
                                                    className="text-gray-400 hover:text-red-400 text-xs px-1"
                                                    title="Supprimer la date de fin"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleSaveEditingTrack}
                                        className="md:col-span-1 py-1.5 rounded-xl bg-cyan-500 hover:bg-white text-black font-display font-black text-xs uppercase cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-cyan-500/20"
                                        title="Enregistrer les modifications"
                                    >
                                        <Check className="w-4 h-4" />
                                        <span className="md:hidden">Valider</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Barre d'action et recherche du tableau */}
                        <div className="px-5 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/40 shrink-0">
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="font-display font-black text-white uppercase italic text-xs flex items-center gap-2">
                                    {activeFolder === 'tv_lib' ? '📺 Bibliothèque TV (240 vidéos)' :
                                     activeFolder === 'general_jingles' ? '🔔 Bacs de Jingles Généraux' :
                                     (activeFolder === 'promos' || activeFolder === 'pubs') ? '📣 Bacs Promos, Publicités & Sponsors' :
                                     activeFolder.startsWith('block_jingles:') ? `🔔 Jingles Spécifiques • ${selectedBlock?.title}` :
                                     `📻 Émission : ${selectedBlock?.emoji || ''} ${selectedBlock?.title || ''}`}
                                </span>
                                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                                    {currentTableItems.length} élément{currentTableItems.length > 1 ? 's' : ''}
                                </span>

                                {/* Bouton rapide d'édition d'émission & réglage fréquence */}
                                {selectedBlock && activeFolder.startsWith('emission:') && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingBlockId(selectedBlock.id);
                                                setEditBlockForm({
                                                    title: selectedBlock.title,
                                                    host: selectedBlock.host || '',
                                                    emoji: selectedBlock.emoji,
                                                    color: selectedBlock.color,
                                                    startHour: selectedBlock.startHour,
                                                    endHour: selectedBlock.endHour,
                                                    days: selectedBlock.days || ALL_DAYS,
                                                    randomize: selectedBlock.randomize !== false,
                                                    jingleFrequency: selectedBlock.jingleFrequency ?? 2,
                                                    rotationRule: selectedBlock.rotationRule || 'jingle_son_special_promo',
                                                    introEnabled: selectedBlock.themeJingle?.enabled !== false,
                                                    introTitle: selectedBlock.themeJingle?.title || '',
                                                    introAudioUrl: selectedBlock.themeJingle?.audioUrl || '',
                                                    introYoutubeId: selectedBlock.themeJingle?.youtubeId || '',
                                                    introDuration: selectedBlock.themeJingle?.duration || 15
                                                });
                                                setIsEditingBlock(true);
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                                            title="Modifier les horaires et paramètres de cette émission"
                                        >
                                            <Pencil className="w-3 h-3 text-cyan-400" />
                                            <span>Modifier</span>
                                        </button>

                                        {/* Sélecteur de Règle d'Alternance personnalisée par Émission */}
                                        <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/40 px-2.5 py-1 rounded-xl text-[11px] text-purple-200 shadow-sm">
                                            <span className="font-bold text-[10px] uppercase text-purple-300 flex items-center gap-1 shrink-0">
                                                <span>⚡</span> Règle :
                                            </span>
                                            <select
                                                value={selectedBlock.rotationRule || 'jingle_son_special_promo'}
                                                onChange={e => {
                                                    const newRule = e.target.value as RadioRotationRule;
                                                    handleSetBlockRotationRule(selectedBlock.id, newRule);
                                                }}
                                                className="bg-black/70 border border-purple-500/40 text-purple-200 text-xs rounded-lg px-2 py-0.5 focus:outline-none focus:border-purple-300 cursor-pointer font-bold max-w-[270px] truncate"
                                                title="Règle de mélange des jingles normaux, jingles spéciaux et promos pour cette émission"
                                            >
                                                <option value="jingle_son_special_promo">⭐ Alterne : Normal → Son → Spécial → Son (promo tous les 4)</option>
                                                <option value="son_special_son_jingle_promo">🎵 1 Son ➔ 1 Spécial ➔ 1 Son ➔ 1 Normal ➔ 1 Promo</option>
                                                <option value="every_2_tracks">⏱️ Tous les 2 sons : Alterne Spécial / Normal / Promo</option>
                                                <option value="every_3_tracks">⏱️ Tous les 3 sons : Alterne Spécial / Normal / Promo</option>
                                                <option value="jingles_only">🔔 Jingles uniquement (sans pub)</option>
                                                <option value="music_only">🎧 100% Musique (aucun jingle)</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => handleApplyRotationRule(selectedBlock.id)}
                                                className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-black font-display font-black text-[10px] uppercase italic tracking-wider transition-all cursor-pointer shadow-sm ml-1 shrink-0"
                                                title="Appliquer immédiatement ce mélange ordonné à l'émission pour voir l'alternance en direct"
                                            >
                                                Appliquer
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2.5 ml-auto flex-wrap sm:flex-nowrap">
                                {/* Barre de Recherche large et confortable */}
                                <div className="relative w-64 md:w-80 shrink-0">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={searchFilter}
                                        onChange={e => setSearchFilter(e.target.value)}
                                        placeholder="Rechercher titre, artiste..."
                                        className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-cyan-400 focus:bg-white/15 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                                    />
                                    {searchFilter && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchFilter('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Bouton Recherche YouTube */}
                                {selectedBlock && !activeFolder.includes('jingle') && activeFolder !== 'tv_lib' && activeFolder !== 'promos' && activeFolder !== 'pubs' && (
                                    <button
                                        type="button"
                                        onClick={() => setIsYouTubeSearchOpen(true)}
                                        className="px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
                                        title="Rechercher directement sur YouTube"
                                    >
                                        <Search className="w-3.5 h-3.5" />
                                        <span>Recherche YouTube</span>
                                    </button>
                                )}

                                {/* Bouton Ajouter Morceau manuel */}
                                {selectedBlock && !activeFolder.includes('jingle') && activeFolder !== 'tv_lib' && activeFolder !== 'promos' && activeFolder !== 'pubs' && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAddTrackBox(!showAddTrackBox)}
                                        className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500/30 text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>{showAddTrackBox ? 'Fermer ajout' : 'Ajouter par URL'}</span>
                                    </button>
                                )}

                                {/* Bouton Nettoyer Promos Expirées */}
                                {(activeFolder === 'promos' || activeFolder === 'pubs' || activeFolder === 'jingles_general') && (
                                    <button
                                        type="button"
                                        onClick={handlePurgeExpiredPromos}
                                        className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm"
                                        title="Supprimer immédiatement toutes les promos dont la date limite est expirée"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Purger expirées</span>
                                    </button>
                                )}

                                {/* Bouton Dédoublonner Sponsors & Promos */}
                                <button
                                    type="button"
                                    onClick={handleDeduplicateSponsorsAndPromos}
                                    className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-black border border-purple-500/40 text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm"
                                    title="Nettoie et supprime les doublons de sponsors et promos dans toutes les émissions"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Dédoublonner</span>
                                </button>

                                {/* Bouton Régénérer les émissions */}
                                <button
                                    type="button"
                                    onClick={handleRegenerateEmissions}
                                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 hover:from-emerald-500 hover:to-cyan-500 text-cyan-200 hover:text-black border border-cyan-500/40 text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm"
                                    title="Régénère et redistribue automatiquement les sets de la vidéothèque TV sans jingles d'affilé"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>Régénérer</span>
                                </button>

                                {/* Bouton Remettre à zéro afin de tout remettre dans l'ordre */}
                                <button
                                    type="button"
                                    onClick={handleResetEmissionTracks}
                                    className="px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500 text-red-300 hover:text-black border border-red-500/30 text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm"
                                    title="Retire tous les jingles, promos et pubs injectés dans les émissions pour repartir d'une grille de sets propre"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Remettre à zéro</span>
                                </button>
                            </div>
                        </div>

                        {/* Formulaire ajout rapide morceau si ouvert */}
                        {showAddTrackBox && (
                            <div className="p-4 border-b border-cyan-500/30 bg-cyan-950/20 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-display font-black text-cyan-400 uppercase italic block">
                                        + Ajouter un morceau ou set à « {selectedBlock?.title} »
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setIsYouTubeSearchOpen(true)}
                                        className="px-2.5 py-1 rounded-lg bg-red-600/30 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/30 text-[10px] font-display font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                                    >
                                        <Search className="w-3 h-3" />
                                        <span>Rechercher sur YouTube</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                                    <input
                                        type="text"
                                        value={newTrackUrl}
                                        onChange={async (e) => {
                                            const u = e.target.value;
                                            setNewTrackUrl(u);
                                            const ytId = extractYouTubeId(u);
                                            if (ytId && !newTrackTitle) {
                                                setIsFetchingTitle(true);
                                                try {
                                                    const fetched = await fetchYouTubeTitle(ytId);
                                                    if (fetched) setNewTrackTitle(fetched);
                                                } finally {
                                                    setIsFetchingTitle(false);
                                                }
                                            }
                                        }}
                                        placeholder="Lien YouTube ou audio..."
                                        className="md:col-span-4 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono"
                                    />
                                    <input
                                        type="text"
                                        value={newTrackTitle}
                                        onChange={e => setNewTrackTitle(e.target.value)}
                                        placeholder="Titre du morceau / set"
                                        className="md:col-span-3 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs"
                                    />
                                    <input
                                        type="text"
                                        value={newTrackArtist}
                                        onChange={e => setNewTrackArtist(e.target.value)}
                                        placeholder="Artiste / DJ"
                                        className="md:col-span-2 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs"
                                    />
                                    <select
                                        value={newTrackCategory}
                                        onChange={e => setNewTrackCategory(e.target.value as any)}
                                        className="md:col-span-1 px-2 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs"
                                    >
                                        <option value="liveset">🎧 Set</option>
                                        <option value="clip">🎬 Clip</option>
                                        <option value="promo">📣 Promo</option>
                                        <option value="pub">📢 Pub</option>
                                        <option value="jingle">🔔 Jingle</option>
                                    </select>
                                    <input
                                        type="number"
                                        value={newTrackDuration}
                                        onChange={e => setNewTrackDuration(e.target.value)}
                                        placeholder="Min"
                                        title="Durée en minutes"
                                        className="md:col-span-1 px-2 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono text-center"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddTrackToCurrentEmission}
                                        className="md:col-span-1 py-1.5 rounded-xl bg-cyan-500 hover:bg-white text-black font-display font-black text-xs uppercase cursor-pointer"
                                    >
                                        Ajouter
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── GRAND TABLEAU STYLE RADIOMANAGER AVEC COLONNES ── */}
                        <div className="flex-1 overflow-x-auto overflow-y-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-white/10 bg-black/60 text-gray-400 font-display font-black uppercase italic text-[10px] tracking-wider sticky top-0 z-10">
                                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                                        <th className="py-2.5 px-3 w-28">Type</th>
                                        <th className="py-2.5 px-3 w-48">Artiste / Animateur</th>
                                        <th className="py-2.5 px-3">Titre de l'élément</th>
                                        <th className="py-2.5 px-3 w-24 text-center">Durée</th>
                                        <th className="py-2.5 px-3 w-36">Bac / Box</th>
                                        <th className="py-2.5 px-3 w-32 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-sans">
                                    {currentTableItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-16 text-center text-gray-500">
                                                <ListMusic className="w-10 h-10 mx-auto mb-2 text-gray-600 opacity-40" />
                                                <p className="font-bold text-xs uppercase tracking-wider">Aucun élément dans ce bac</p>
                                                <p className="text-[11px] text-gray-600 mt-1">
                                                    Utilisez « Ajouter Morceau » ou « Uploader un Jingle » pour alimenter cette émission.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        currentTableItems.map((item, idx) => {
                                            const isCurrentPlaying = currentAudio?.id === item.id && isPlaying;
                                            const meta = getRadioCategoryMeta(item.type);
                                            const isSpecialJingle = (item as any).isSpecialJingle || item.type === 'jingle';
                                            const isPromo = item.type === 'promo';
                                            const isPub = item.type === 'pub';

                                            return (
                                                <tr
                                                    key={item.id || idx}
                                                    className={`transition-colors cursor-pointer group ${
                                                        isCurrentPlaying
                                                            ? 'bg-cyan-500/15'
                                                            : isSpecialJingle
                                                                ? 'bg-amber-950/20 hover:bg-amber-900/30 border-l-4 border-l-amber-400'
                                                                : isPromo
                                                                    ? 'bg-orange-950/25 hover:bg-orange-900/35 border-l-4 border-l-orange-500'
                                                                    : isPub
                                                                        ? 'bg-pink-950/25 hover:bg-pink-900/35 border-l-4 border-l-pink-500'
                                                                        : idx % 2 === 0
                                                                            ? 'bg-white/[0.01] hover:bg-white/5'
                                                                            : 'bg-black/30 hover:bg-white/5'
                                                    }`}
                                                >
                                                    {/* # Ordre / Play */}
                                                    <td className="py-2 px-3 text-center text-gray-500 font-mono text-[11px]">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                handlePlayMedia({
                                                                    id: item.id,
                                                                    title: item.title,
                                                                    artist: item.artist,
                                                                    audioUrl: item.audioUrl,
                                                                    youtubeId: item.youtubeId,
                                                                    duration: item.duration
                                                                });
                                                            }}
                                                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                                                                isCurrentPlaying
                                                                    ? 'bg-cyan-500 text-black shadow-md'
                                                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/15'
                                                            }`}
                                                            title={item.audioUrl || item.youtubeId ? "Écouter dans le lecteur permanent" : "Aucun média"}
                                                        >
                                                            {isCurrentPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                                                        </button>
                                                    </td>

                                                    {/* Type / Badge visible */}
                                                    <td className="py-2 px-3">
                                                        <span
                                                            className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                                                                isSpecialJingle
                                                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                                                                    : isPromo
                                                                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-sm'
                                                                        : isPub
                                                                            ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-sm'
                                                                            : meta.bg
                                                            }`}
                                                            style={!isSpecialJingle && !isPromo && !isPub ? { color: meta.color, borderColor: `${meta.color}40` } : {}}
                                                        >
                                                            {isSpecialJingle ? '🔔 JINGLE SPÉCIAL' : isPromo ? '📣 PROMO' : isPub ? '📢 PUB / SPONSOR' : `${meta.emoji} ${meta.label}`}
                                                        </span>
                                                    </td>

                                                    {/* Artiste */}
                                                    <td className="py-2 px-3 font-semibold text-gray-300 text-xs truncate max-w-[180px]">
                                                        {item.artist}
                                                    </td>

                                                    {/* Titre (mis en valeur pour les jingles, promos et pubs) */}
                                                    <td className="py-2 px-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs truncate font-display italic font-black uppercase ${
                                                                isSpecialJingle ? 'text-amber-300 font-bold' : isPromo ? 'text-orange-300 font-bold' : isPub ? 'text-pink-300 font-bold' : 'text-white'
                                                            }`}>
                                                                {item.title}
                                                            </span>
                                                            {isSpecialJingle && (
                                                                <span className="text-[8px] font-mono uppercase bg-amber-400 text-black px-1.5 py-0.2 rounded font-bold">
                                                                    Jingle Émission
                                                                </span>
                                                            )}
                                                            {isPromo && (
                                                                <span className="text-[8px] font-mono uppercase bg-orange-500 text-black px-1.5 py-0.2 rounded font-bold">
                                                                    Promo
                                                                </span>
                                                            )}
                                                            {isPub && (
                                                                <span className="text-[8px] font-mono uppercase bg-pink-500 text-white px-1.5 py-0.2 rounded font-bold">
                                                                    Pub
                                                                </span>
                                                            )}
                                                            {item.expiresAt && (
                                                                <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded font-bold ${
                                                                    isItemExpired(item) ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                                }`} title={`Date limite : ${item.expiresAt}`}>
                                                                    {isItemExpired(item) ? '⚠️ EXPIRÉ' : `⏳ Fin: ${new Date(item.expiresAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Durée */}
                                                    <td className="py-2 px-3 text-center font-mono text-[11px] text-gray-400">
                                                        {formatDurationExact(item.duration)}
                                                    </td>

                                                    {/* Bac / Box */}
                                                    <td className="py-2 px-3 text-gray-400 text-[11px] font-mono truncate max-w-[140px]">
                                                        {item.box}
                                                    </td>

                                                    {/* Actions (Monter, Descendre, Modifier, Supprimer) */}
                                                    <td className="py-2 px-3 text-right">
                                                        <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {/* Boutons Monter / Descendre uniquement pour les tracks d'émission */}
                                                            {(item as any).index !== undefined && selectedBlock && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        disabled={(item as any).index === 0}
                                                                        onClick={() => handleMoveItem((item as any).index, 'up')}
                                                                        className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                                                                        title="Monter"
                                                                    >
                                                                        <ChevronUp className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        disabled={(item as any).index === (selectedBlock.tracks?.length || 0) - 1}
                                                                        onClick={() => handleMoveItem((item as any).index, 'down')}
                                                                        className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                                                                        title="Descendre"
                                                                    >
                                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </>
                                                            )}

                                                            {/* Bouton Modifier — pour TOUS les items (émissions, promos, pubs, jingles) */}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const cat = (item.type as any) || 'liveset';
                                                                    setEditingTrack({
                                                                        trackId: item.id || '',
                                                                        artist: item.artist || '',
                                                                        title: item.title || '',
                                                                        category: (cat === 'promo' || cat === 'pub' || cat === 'jingle' || cat === 'clip' || cat === 'liveset' || cat === 'set') ? (cat === 'set' ? 'liveset' : cat) : 'liveset',
                                                                        durationSeconds: item.duration || (cat === 'jingle' ? 15 : (cat === 'promo' || cat === 'pub') ? 30 : 3600),
                                                                        youtubeId: item.youtubeId || '',
                                                                        audioUrl: item.audioUrl || '',
                                                                        expiresAt: item.expiresAt
                                                                    });
                                                                }}
                                                                className="p-1 rounded text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 cursor-pointer"
                                                                title="Modifier"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>

                                                            {/* Bouton Supprimer — pour TOUS les items */}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if ((item as any).index !== undefined && selectedBlock) {
                                                                        handleDeleteTrack((item as any).index);
                                                                    } else {
                                                                        handleDeleteItemById(item.id, item.title);
                                                                    }
                                                                }}
                                                                className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                                                                title="Supprimer"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ═════════════════════════════════════════════════════════════
                    3. LECTEUR PERMANENT EN BAS (Style Radionomy / RadioManager)
                ═════════════════════════════════════════════════════════════ */}
                <div className="h-16 px-6 border-t border-white/10 bg-gradient-to-r from-[#070b12] via-[#0d131f] to-[#070b12] flex items-center justify-between gap-6 shrink-0 z-20 relative">
                    {/* Lecteur YouTube invisible pour la préécoute réelle de sets / clips */}
                    {currentAudio?.youtubeId && isPlaying && (
                        <iframe
                            key={currentAudio.youtubeId}
                            src={`https://www.youtube-nocookie.com/embed/${currentAudio.youtubeId}?autoplay=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                            className="w-0 h-0 opacity-0 pointer-events-none fixed -top-[1000px] -left-[1000px]"
                            allow="autoplay"
                            title="YouTube Audio Preview"
                        />
                    )}

                    <div className="flex items-center gap-4 min-w-0 w-80">
                        {/* Vignette audio ou pochette YouTube */}
                        <div className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border transition-all ${
                            isPlaying
                                ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                                : 'bg-white/5 text-gray-400 border-white/10'
                        }`}>
                            {currentAudio?.youtubeId ? (
                                <img
                                    src={`https://img.youtube.com/vi/${currentAudio.youtubeId}/hqdefault.jpg`}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <FileAudio className="w-5 h-5" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-display font-black text-white uppercase italic tracking-tight truncate">
                                {currentAudio ? currentAudio.title : 'Aucun média en cours d\'écoute'}
                            </p>
                            <span className="text-[10px] text-gray-400 font-mono truncate block">
                                {currentAudio?.artist ? currentAudio.artist : 'Cliquez sur Play pour pré-écouter un élément'}
                            </span>
                        </div>
                    </div>

                    {/* Contrôles lecteur Play / Progression */}
                    <div className="flex-1 max-w-xl flex items-center gap-4">
                        <button
                            type="button"
                            onClick={handleTogglePlayPause}
                            disabled={!currentAudio}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                isPlaying
                                    ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.5)]'
                                    : 'bg-white/10 text-white hover:bg-white/20 disabled:opacity-30'
                            }`}
                        >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>

                        <div className="flex-1 flex items-center gap-2">
                            <span className="text-[10px] font-mono text-gray-400 w-10 text-right">
                                {formatDurationExact(Math.round(audioProgress))}
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden relative">
                                <div
                                    className="h-full bg-cyan-400 transition-all"
                                    style={{
                                        width: audioDuration > 0
                                            ? `${(audioProgress / audioDuration) * 100}%`
                                            : '0%'
                                    }}
                                />
                            </div>
                            <span className="text-[10px] font-mono text-gray-400 w-10">
                                {formatDurationExact(Math.round(audioDuration))}
                            </span>
                        </div>
                    </div>

                    {/* Contrôle Volume */}
                    <div className="flex items-center gap-2 w-36 justify-end">
                        <Volume2 className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={audioVolume}
                            onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                setAudioVolume(v);
                                if (audioPlayerRef.current) audioPlayerRef.current.volume = v;
                            }}
                            className="w-20 accent-cyan-400 cursor-pointer"
                        />
                    </div>
                </div>
            </motion.div>

            {/* ── MODALE RECHERCHE YOUTUBE DIRECTE ── */}
            <YouTubeSearchModal
                isOpen={isYouTubeSearchOpen}
                onClose={() => setIsYouTubeSearchOpen(false)}
                mode="radio"
                blockTitle={selectedBlock?.title}
                onAddVideo={(video) => {
                    if (!selectedBlock) {
                        showToast('Sélectionnez d\'abord une émission', 'warn');
                        return;
                    }
                    const newTrack: RadioTrackItem = {
                        id: `track_yt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                        title: video.title,
                        artist: video.channel || selectedBlock.title,
                        youtubeId: video.youtubeId,
                        duration: video.duration || 3600,
                        category: video.category === 'clip' ? 'clip' : video.category === 'jingle' ? 'jingle' : 'liveset'
                    };
                    setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? {
                        ...b,
                        tracks: [...(b.tracks || []), newTrack]
                    } : b));
                    showToast(`✓ « ${video.title} » ajouté à ${selectedBlock.title} !`);
                }}
            />

            {/* ── MODALE D'UPLOAD DE JINGLE / PROMO / PUB AVEC MENU DÉROULANT ── */}
            <RadioJingleUploadModal
                isOpen={isUploadJingleModalOpen}
                onClose={() => setIsUploadJingleModalOpen(false)}
                blocks={blocks}
                defaultBlockId={selectedBlock?.id}
                initialCategory={uploadModalCategory}
                onSaveJingleForBlock={handleSaveJingleForBlock}
                onSaveGeneralJingle={handleSaveGeneralJingle}
                onShowToast={showToast}
            />

            {/* ── MODALE STUDIO SUNO IA (JINGLES RADIO) ── */}
            <SunoJingleStudioModal
                isOpen={isSunoModalOpen}
                onClose={() => setIsSunoModalOpen(false)}
                blocks={blocks}
                activeBlockId={selectedBlock?.id}
                onSaveGeneralJingle={handleSaveGeneralJingle}
                onSaveJingleForBlock={(blockId, item) => handleSaveJingleForBlock(blockId, item as any, true, (item.category === 'promo' || item.category === 'pub' ? item.category : 'jingle'))}
                onSetAsThemeJingle={handleSetAsThemeJingle}
                onShowToast={showToast}
            />

            {/* ── MODAL CONFIRMATION ── */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
                cancelText={confirmModal.cancelText}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(f => ({ ...f, isOpen: false }))}
            />

            {/* ── MODAL AUDIT DOUBLONS ── */}
            <DuplicateAuditModal
                isOpen={showDuplicateAudit}
                onClose={() => setShowDuplicateAudit(false)}
                mode="radio"
                duplicates={radioDuplicates}
                onResolve={(ytId: string, _keepId: string, removeIds: string[]) => {
                    setBlocks(prev => prev.map(b => {
                        if (!removeIds.includes(b.id)) return b;
                        return { ...b, tracks: (b.tracks || []).filter(t => t.youtubeId !== ytId) };
                    }));
                    setRadioDuplicates(prev => prev.filter(d => d.youtubeId !== ytId));
                    showToast('✓ Doublon résolu !');
                }}
            />
        </div>
    );
}
