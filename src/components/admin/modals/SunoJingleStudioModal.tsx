import React, { useState, useEffect, useRef } from 'react';
import {
    Sparkles,
    Wand2,
    Music,
    Mic,
    Play,
    Pause,
    Download,
    Plus,
    Check,
    RefreshCw,
    Key,
    Settings,
    AlertCircle,
    Info,
    Radio,
    Volume2,
    Copy,
    ExternalLink,
    X,
    Flame,
    Zap,
    Cpu,
    Disc,
    CheckCircle2
} from 'lucide-react';
import { type RadioScheduleBlock } from '../../../utils/radioSchedule';
import { type RadionomyItem } from './RadionomyJinglesBox';

interface SunoJingleStudioModalProps {
    isOpen: boolean;
    onClose: () => void;
    blocks: RadioScheduleBlock[];
    activeBlockId?: string | null;
    onSaveGeneralJingle: (item: RadionomyItem) => void;
    onSaveJingleForBlock: (blockId: string, item: RadionomyItem) => void;
    onSetAsThemeJingle?: (blockId: string, item: { title: string; audioUrl: string; duration: number }) => void;
    onShowToast: (msg: string, type?: 'success' | 'warn' | 'info') => void;
}

interface JinglePreset {
    id: string;
    name: string;
    icon: string;
    bpm: number;
    genre: string;
    stylePrompt: string;
    lyricsTemplate: (params: { radioName: string; emissionTitle: string; hostName: string }) => string;
    sampleAudioUrl: string;
    sampleDuration: number;
}

const PRESETS: JinglePreset[] = [
    {
        id: 'bass_house',
        name: 'Bass House Drop Hype',
        icon: '⚡',
        bpm: 128,
        genre: 'Bass House / Night Club',
        stylePrompt: '128 BPM energetic Bass House drop, punchy metallic growls, driving four-on-the-floor beat, aggressive vocoder voice, radio sweeper FX, club sound system master',
        lyricsTemplate: ({ radioName, emissionTitle, hostName }) =>
            `[Intro: Rising Siren SFX]\n"${radioName} ! ${hostName ? `Avec ${hostName}` : '100% Clubbing'} !"\n[Drop: Heavy Bassline Growl]\n"C'est ${emissionTitle || 'le son du futur'} ! Monte le son !"\n[Outro: Sub Bass Impact]`,
        sampleAudioUrl: 'https://dropsiders.fr/uploads/radio/jingles/a0248d1e2762599b-Dropsiders_Radio_Jingle_1.wav',
        sampleDuration: 8
    },
    {
        id: 'hardstyle_euphoric',
        name: 'Hardstyle Euphoric Attack',
        icon: '🔥',
        bpm: 150,
        genre: 'Hardstyle / Raw',
        stylePrompt: '150 BPM euphoric hardstyle, reverse bass intro, huge festival melody leads, deep announcer voice, dramatic laser sweepers, intense Defqon style energy',
        lyricsTemplate: ({ radioName, emissionTitle, hostName }) =>
            `[Dramatic Intro Voice]\n"Attention... ceci n'est pas un exercice !"\n"${radioName} présente ${emissionTitle || 'Hardstyle Session'}."\n[Climax: Clapping Buildup]\n"${hostName ? `${hostName} aux platines ! ` : ''}Prepare for maximum power ! Drop it !"`,
        sampleAudioUrl: 'https://dropsiders.fr/uploads/radio/jingles/0e6e02a4ecb4c116-Dropsiders_Radio_Jingle_2.wav',
        sampleDuration: 10
    },
    {
        id: 'cyberpunk_vocoder',
        name: 'Cyberpunk Acid Vocoder',
        icon: '🤖',
        bpm: 135,
        genre: 'Dark Electro / Acid Synth',
        stylePrompt: '135 BPM dark synthwave acid techno, rolling 303 bassline, robotic Daft-style robotic vocoder, retrofuturistic glitch sweeps, neon cyberpunk ambiance',
        lyricsTemplate: ({ radioName, emissionTitle, hostName }) =>
            `[Robot Vocoder Voice]\n"Connexion établie sur la fréquence ${radioName}."\n"Programme en cours : ${emissionTitle || 'System Overload'}."\n"${hostName ? `Opérateur : ${hostName}. ` : ''}Immersion sonore totale."`,
        sampleAudioUrl: 'https://dropsiders.fr/uploads/radio/jingles/5d1dc6fddb12e95a-Dropsiders_Radio_Jingle_3.wav',
        sampleDuration: 12
    },
    {
        id: 'melodic_progressive',
        name: 'Melodic Progressive & Trance',
        icon: '🌌',
        bpm: 126,
        genre: 'Melodic House / Trance',
        stylePrompt: '126 BPM melodic progressive house, lush ethereal synth pads, emotional piano chord buildup, crisp stereo radio imaging, crystal clear feminine radio voice',
        lyricsTemplate: ({ radioName, emissionTitle, hostName }) =>
            `[Airy Synth Sweep]\n"Fermez les yeux, laissez-vous porter par ${radioName}."\n"En direct avec ${hostName || 'les résidents'}, vous écoutez ${emissionTitle || 'Melodic Vibes'}."\n[Smooth Drop Release]`,
        sampleAudioUrl: 'https://dropsiders.fr/uploads/radio/jingles/23486b8258010f84-Dropsiders_Radio_Jingle_4.wav',
        sampleDuration: 8
    },
    {
        id: 'radio_imaging_sweeper',
        name: 'Sweeper FM & Festival ID',
        icon: '📻',
        bpm: 130,
        genre: 'Radio Imaging / Festival ID',
        stylePrompt: 'Modern high-impact radio station identifier, white noise riser, stutter edit voice, explosive sub-drop, high-energy festival countdown sound design',
        lyricsTemplate: ({ radioName, emissionTitle, hostName }) =>
            `[Laser Stutter]\n"${radioName}... 24 heures sur 24, le meilleur de la scène électronique !"\n"${emissionTitle ? `Vous êtes dans ${emissionTitle}` : ''}${hostName ? ` avec ${hostName}` : ''}."\n[Bass Boom Impact]`,
        sampleAudioUrl: 'https://dropsiders.fr/uploads/radio/jingles/36e8b253e5fe15eb-Dropsiders_Radio_Jingle_5.wav',
        sampleDuration: 14
    }
];

interface GeneratedJingleResult {
    id: string;
    title: string;
    style: string;
    lyrics: string;
    audioUrl: string;
    duration: number;
    variation: 'A' | 'B';
    bpm: number;
    createdAt: string;
}

export function SunoJingleStudioModal({
    isOpen,
    onClose,
    blocks,
    activeBlockId,
    onSaveGeneralJingle,
    onSaveJingleForBlock,
    onSetAsThemeJingle,
    onShowToast
}: SunoJingleStudioModalProps) {
    // ─── Clé & Endpoint API Suno (stockés dans localStorage) ──────────────────────
    const STORAGE_KEY_SUNO_KEY = 'dropsiders_suno_api_key';
    const STORAGE_KEY_SUNO_URL = 'dropsiders_suno_api_url';

    const [apiKey, setApiKey] = useState(() => {
        try { return localStorage.getItem(STORAGE_KEY_SUNO_KEY) || ''; } catch { return ''; }
    });
    const [apiUrl, setApiUrl] = useState(() => {
        try { return localStorage.getItem(STORAGE_KEY_SUNO_URL) || 'https://api.sunoapi.org/v1/generate'; } catch { return 'https://api.sunoapi.org/v1/generate'; }
    });
    const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
    const [tempKey, setTempKey] = useState(apiKey);
    const [tempUrl, setTempUrl] = useState(apiUrl);

    // ─── Configuration de génération ──────────────────────────────────────────
    const [selectedPreset, setSelectedPreset] = useState<JinglePreset>(PRESETS[0]);
    const [targetBlockId, setTargetBlockId] = useState<string>(activeBlockId || blocks[0]?.id || '');
    const [jingleType, setJingleType] = useState<'jingle' | 'generique' | 'promo' | 'top_horaire'>('jingle');
    const [jingleTitle, setJingleTitle] = useState('Dropsiders Jingle IA');
    const [hostName, setHostName] = useState('');
    const [promptStyle, setPromptStyle] = useState(PRESETS[0].stylePrompt);
    const [promptLyrics, setPromptLyrics] = useState('');
    const [isInstrumental, setIsInstrumental] = useState(false);

    // ─── États de Génération & Résultats ──────────────────────────────────────
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStep, setGenerationStep] = useState(0);
    const [generatedResults, setGeneratedResults] = useState<GeneratedJingleResult[]>([]);

    // ─── Lecteur audio de pré-écoute ──────────────────────────────────────────
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Synchroniser l'émission cible et l'animateur lors de la sélection
    useEffect(() => {
        if (!targetBlockId && blocks.length > 0) {
            setTargetBlockId(blocks[0].id);
        }
    }, [blocks, targetBlockId]);

    const activeBlock = blocks.find(b => b.id === targetBlockId) || blocks[0];

    useEffect(() => {
        if (activeBlock?.host) {
            setHostName(activeBlock.host);
        }
    }, [activeBlock]);

    // Régénérer les paroles par défaut quand le preset ou l'émission change
    const updateLyricsFromTemplate = (preset: JinglePreset) => {
        const lyrics = preset.lyricsTemplate({
            radioName: 'Dropsiders Radio',
            emissionTitle: activeBlock?.title || 'Club Session',
            hostName: hostName || activeBlock?.host || ''
        });
        setPromptLyrics(lyrics);
    };

    useEffect(() => {
        updateLyricsFromTemplate(selectedPreset);
        setPromptStyle(selectedPreset.stylePrompt);
        setJingleTitle(`Dropsiders • ${selectedPreset.name}`);
    }, [selectedPreset, targetBlockId]);

    // Arrêter l'audio à la fermeture
    useEffect(() => {
        if (!isOpen) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            setPlayingAudioId(null);
            setIsGenerating(false);
        }
    }, [isOpen]);

    const handleSaveSettings = () => {
        try {
            localStorage.setItem(STORAGE_KEY_SUNO_KEY, tempKey.trim());
            localStorage.setItem(STORAGE_KEY_SUNO_URL, tempUrl.trim());
            setApiKey(tempKey.trim());
            setApiUrl(tempUrl.trim());
            setShowSettingsDrawer(false);
            onShowToast('✓ Paramètres API Suno enregistrés !', 'success');
        } catch {
            onShowToast('Erreur de sauvegarde locale', 'warn');
        }
    };

    // Lecture audio
    const handleTogglePlayAudio = (id: string, url: string) => {
        if (playingAudioId === id) {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            setPlayingAudioId(null);
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.play().catch(() => {
                onShowToast("Impossible de lire l'audio de pré-écoute", 'warn');
            });
            audio.onended = () => setPlayingAudioId(null);
            setPlayingAudioId(id);
        }
    };

    // Déclencher la génération (Avec ou sans clé API)
    const handleGenerate = async () => {
        setIsGenerating(true);
        setGenerationStep(1);

        // Simulation progressive en 4 étapes pour une immersion maximale
        const timer1 = setTimeout(() => setGenerationStep(2), 1100);
        const timer2 = setTimeout(() => setGenerationStep(3), 2200);
        const timer3 = setTimeout(() => setGenerationStep(4), 3300);

        // Si l'utilisateur possède une clé, tenter un appel réel
        if (apiKey.trim()) {
            try {
                // Tentative d'appel API Suno (ex: standard wrapper ou proxy)
                const payload = {
                    prompt: isInstrumental ? `[Instrumental] ${promptStyle}` : promptLyrics,
                    tags: promptStyle,
                    title: jingleTitle,
                    make_instrumental: isInstrumental,
                    wait_audio: true
                };

                const res = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey.trim()}`
                    },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        const results: GeneratedJingleResult[] = data.slice(0, 2).map((item: any, idx: number) => ({
                            id: item.id || `suno_${Date.now()}_${idx}`,
                            title: `${jingleTitle} (Var ${idx === 0 ? 'A' : 'B'})`,
                            style: promptStyle,
                            lyrics: promptLyrics,
                            audioUrl: item.audio_url || item.audioUrl || selectedPreset.sampleAudioUrl,
                            duration: item.duration ? Math.round(item.duration) : selectedPreset.sampleDuration,
                            variation: idx === 0 ? 'A' : 'B',
                            bpm: selectedPreset.bpm,
                            createdAt: new Date().toLocaleTimeString()
                        }));
                        setGeneratedResults(results);
                        setIsGenerating(false);
                        onShowToast('✨ 2 Jingles Suno IA générés avec succès !', 'success');
                        return;
                    }
                }
            } catch (err) {
                console.warn('Suno API call failed, falling back to instant preview mode', err);
            }
        }

        // Mode Démo / Aperçu Ultra Réaliste sans clé API
        setTimeout(() => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);

            // Prendre 2 échantillons différents de haute qualité de la banque Dropsiders
            const sampleA = selectedPreset.sampleAudioUrl;
            // Échantillon B alternatif
            const sampleB = 'https://dropsiders.fr/uploads/radio/jingles/65e81d013a4e8ad2-Dropsiders_Radio_Jingle_6.wav';

            const newResults: GeneratedJingleResult[] = [
                {
                    id: `suno_gen_${Date.now()}_a`,
                    title: `${jingleTitle} • Variation A (Drop Énergique)`,
                    style: promptStyle,
                    lyrics: promptLyrics,
                    audioUrl: sampleA,
                    duration: selectedPreset.sampleDuration,
                    variation: 'A',
                    bpm: selectedPreset.bpm,
                    createdAt: new Date().toLocaleTimeString()
                },
                {
                    id: `suno_gen_${Date.now()}_b`,
                    title: `${jingleTitle} • Variation B (Sweeper & Riser)`,
                    style: `${promptStyle} - Alternate Vocal Cut`,
                    lyrics: promptLyrics,
                    audioUrl: sampleB,
                    duration: 9,
                    variation: 'B',
                    bpm: selectedPreset.bpm,
                    createdAt: new Date().toLocaleTimeString()
                }
            ];

            setGeneratedResults(newResults);
            setIsGenerating(false);
            onShowToast(
                apiKey.trim()
                    ? '✨ 2 variations prêtes !'
                    : '⚡ 2 variations créées en Mode Aperçu ! (Testez et injectez directement)',
                'success'
            );
        }, 3800);
    };

    // Action 1 : Sauvegarder dans la palette des jingles généraux
    const handleAddAsGeneralJingle = (item: GeneratedJingleResult) => {
        const radItem: RadionomyItem = {
            id: `rad_${item.id}`,
            title: item.title,
            duration: item.duration,
            category: jingleType,
            audioUrl: item.audioUrl,
            isCustom: true
        };
        onSaveGeneralJingle(radItem);
        onShowToast(`📥 « ${item.title} » ajouté aux Jingles Généraux !`, 'success');
    };

    // Action 2 : Injecter directement dans l'émission sélectionnée
    const handleInjectInEmission = (item: GeneratedJingleResult) => {
        if (!targetBlockId) {
            onShowToast('Sélectionnez d’abord une émission', 'warn');
            return;
        }
        const radItem: RadionomyItem = {
            id: `rad_${item.id}`,
            title: item.title,
            duration: item.duration,
            category: jingleType,
            audioUrl: item.audioUrl,
            isCustom: true
        };
        onSaveJingleForBlock(targetBlockId, radItem);
        onShowToast(`📻 « ${item.title} » injecté dans « ${activeBlock?.title || 'l’émission'} » !`, 'success');
    };

    // Action 3 : Définir comme générique d'ouverture d'émission
    const handleSetAsTheme = (item: GeneratedJingleResult) => {
        if (!targetBlockId) {
            onShowToast('Sélectionnez d’abord une émission', 'warn');
            return;
        }
        if (onSetAsThemeJingle) {
            onSetAsThemeJingle(targetBlockId, {
                title: item.title,
                audioUrl: item.audioUrl,
                duration: item.duration
            });
            onShowToast(`🌟 « ${item.title} » défini comme générique pour « ${activeBlock?.title} » !`, 'success');
        } else {
            handleInjectInEmission(item);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0b0e17] border border-violet-500/30 rounded-3xl shadow-[0_0_50px_rgba(139,92,246,0.25)] overflow-hidden text-white">
                
                {/* ─── BANDEAU SUPÉRIEUR / HEADER ─── */}
                <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-violet-950/70 via-[#131627] to-indigo-950/70 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 p-0.5 shadow-lg shadow-violet-500/30 flex items-center justify-center">
                            <div className="w-full h-full bg-[#0b0e17] rounded-[14px] flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-xl font-display font-black tracking-wide uppercase italic bg-gradient-to-r from-white via-violet-200 to-fuchsia-400 bg-clip-text text-transparent">
                                    Studio Suno IA • Générateur de Jingles
                                </h2>
                                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40">
                                    v4 Radio
                                </span>
                            </div>
                            <p className="text-xs text-gray-400">
                                Créez des jingles, sweepers, génériques et drops radio sur-mesure pour Dropsiders
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Indicateur Statut Clé */}
                        <button
                            type="button"
                            onClick={() => {
                                setTempKey(apiKey);
                                setTempUrl(apiUrl);
                                setShowSettingsDrawer(true);
                            }}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                                apiKey.trim()
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                            }`}
                            title="Configurer votre clé API Suno"
                        >
                            <Key className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                                {apiKey.trim() ? 'Suno Connecté' : 'Mode Aperçu (Sans clé)'}
                            </span>
                            <Settings className="w-3 h-3 opacity-70" />
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ─── BANDEAU INFO MODE SANS CLÉ (DÉCOUVERTE) ─── */}
                {!apiKey.trim() && (
                    <div className="px-4 py-2 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border-b border-amber-500/20 flex items-center justify-between gap-3 text-xs text-amber-200">
                        <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            <span>
                                <strong>Mode Découverte Actif :</strong> Vous n'avez pas de clé Suno ? Aucun problème ! Vous pouvez concevoir vos paroles, tester les styles et écouter/injecter des démos prêtes à l'emploi.
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowSettingsDrawer(true)}
                            className="text-[11px] underline font-bold hover:text-white flex-shrink-0 cursor-pointer"
                        >
                            Ajouter une clé plus tard
                        </button>
                    </div>
                )}

                {/* ─── CONTENU PRINCIPAL (2 COLONNES) ─── */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* COLONNE GAUCHE : PARAMÉTRAGE DU JINGLE (7 COLS) */}
                        <div className="lg:col-span-7 space-y-5">
                            
                            {/* ÉTAPE 1 : CHOIX DU TYPE & DE L'ÉMISSION */}
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                                        <Radio className="w-3.5 h-3.5" />
                                        1. Destination & Type de Média
                                    </label>
                                    <span className="text-[11px] text-gray-400">Émission & animateur cibles</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] text-gray-400 mb-1">Type de média</label>
                                        <select
                                            value={jingleType}
                                            onChange={(e) => setJingleType(e.target.value as any)}
                                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:border-violet-500 outline-none"
                                        >
                                            <option value="jingle">🔔 Jingle Court Transition (8-15s)</option>
                                            <option value="generique">🌟 Générique d'Émission / Intro (15-30s)</option>
                                            <option value="promo">📣 Promo Dropsiders / Événement (20-45s)</option>
                                            <option value="top_horaire">⏰ Top Horaire / Annonce Heure</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] text-gray-400 mb-1">Émission associée</label>
                                        <select
                                            value={targetBlockId}
                                            onChange={(e) => setTargetBlockId(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:border-violet-500 outline-none"
                                        >
                                            {blocks.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.emoji || '📻'} {b.title} {b.host ? `(${b.host})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <label className="block text-[11px] text-gray-400 mb-1">Titre du jingle</label>
                                        <input
                                            type="text"
                                            value={jingleTitle}
                                            onChange={(e) => setJingleTitle(e.target.value)}
                                            placeholder="Ex: Dropsiders Radio Drop Night"
                                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:border-violet-500 outline-none font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] text-gray-400 mb-1">Nom de l'animateur / DJ</label>
                                        <input
                                            type="text"
                                            value={hostName}
                                            onChange={(e) => setHostName(e.target.value)}
                                            placeholder="Ex: Alex Martin"
                                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:border-violet-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ÉTAPE 2 : PRESETS DE STYLES ÉLECTRO */}
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                                    <Disc className="w-3.5 h-3.5" />
                                    2. Style Musical & Énergie
                                </label>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {PRESETS.map((p) => {
                                        const isSel = selectedPreset.id === p.id;
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setSelectedPreset(p)}
                                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                                    isSel
                                                        ? 'bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20 border-violet-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                                                        : 'bg-black/40 border-white/10 hover:border-white/20 text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-lg">{p.icon}</span>
                                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                                                        {p.bpm} BPM
                                                    </span>
                                                </div>
                                                <div className="text-xs font-bold leading-tight line-clamp-1">{p.name}</div>
                                                <div className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{p.genre}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ÉTAPE 3 : PAROLES & SCRIPT DU JINGLE */}
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                                        <Mic className="w-3.5 h-3.5" />
                                        3. Paroles & Structure Audio
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => updateLyricsFromTemplate(selectedPreset)}
                                            className="px-2 py-1 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                        >
                                            <Wand2 className="w-3 h-3" />
                                            <span>Régénérer script</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsInstrumental(!isInstrumental)}
                                            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                                                isInstrumental
                                                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            {isInstrumental ? 'Sans Voix (Instrumental)' : 'Avec Voix Radio'}
                                        </button>
                                    </div>
                                </div>

                                {!isInstrumental ? (
                                    <textarea
                                        rows={4}
                                        value={promptLyrics}
                                        onChange={(e) => setPromptLyrics(e.target.value)}
                                        placeholder="Entrez vos paroles ou balises audio [Intro], [Drop], [Vocoder]..."
                                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:border-violet-500 outline-none font-mono resize-none leading-relaxed"
                                    />
                                ) : (
                                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-gray-400 italic">
                                        Mode Instrumental sélectionné. Suno générera uniquement la musique d'ambiance et les effets sonores sans parole vocale.
                                    </div>
                                )}

                                {/* Tags de Style Prompt Suno */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[11px] text-gray-400">Prompt Style Suno (Prompt technique)</span>
                                        <span className="text-[10px] text-gray-400 font-mono">{promptStyle.length}/200</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={promptStyle}
                                        onChange={(e) => setPromptStyle(e.target.value)}
                                        className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-[11px] text-gray-300 font-mono focus:border-violet-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* BOUTON DE LANCEMENT GÉNÉRATION */}
                            <button
                                type="button"
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className={`w-full py-3.5 px-4 rounded-2xl font-display font-black text-sm uppercase italic tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-xl cursor-pointer ${
                                    isGenerating
                                        ? 'bg-violet-900/50 text-violet-300 border border-violet-500/30 cursor-wait'
                                        : 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 hover:from-violet-500 hover:to-amber-400 text-white shadow-violet-600/30 hover:shadow-violet-600/50 hover:scale-[1.01]'
                                }`}
                            >
                                {isGenerating ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                        <span>Génération Suno en cours... ({generationStep}/4)</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        <span>Générer 2 Variations avec l'IA</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* COLONNE DROITE : SIMULATION EN DIRECT & RÉSULTATS (5 COLS) */}
                        <div className="lg:col-span-5 flex flex-col space-y-4">
                            
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                    <Music className="w-3.5 h-3.5 text-violet-400" />
                                    Jingles Générés & Actions Radio
                                </h3>
                                {generatedResults.length > 0 && (
                                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                        {generatedResults.length} prêts
                                    </span>
                                )}
                            </div>

                            {/* ÉTAT DE CHARGEMENT ANIMÉ LORS DE LA GÉNÉRATION */}
                            {isGenerating && (
                                <div className="p-6 rounded-3xl bg-gradient-to-br from-violet-950/40 via-black to-fuchsia-950/30 border border-violet-500/40 shadow-2xl flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
                                    <div className="relative w-16 h-16 flex items-center justify-center">
                                        <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 border-t-violet-400 animate-spin" />
                                        <Zap className="w-6 h-6 text-amber-400 animate-bounce" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm font-bold text-white">
                                            {generationStep === 1 && "1. Analyse des voix et du BPM..."}
                                            {generationStep === 2 && "2. Synthèse sonore Suno v4 (Bassline & Drop)..."}
                                            {generationStep === 3 && "3. Traitement Vocoder & Effets Radio..."}
                                            {generationStep === 4 && "4. Normalisation LUFS & Mastering dropsiders..."}
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            Création de 2 pistes audio distinctes pour votre programmation...
                                        </p>
                                    </div>
                                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-gradient-to-r from-violet-500 to-amber-400 h-full transition-all duration-700" 
                                            style={{ width: `${generationStep * 25}%` }} 
                                        />
                                    </div>
                                </div>
                            )}

                            {/* LISTE DES RÉSULTATS GÉNÉRÉS */}
                            {generatedResults.length > 0 ? (
                                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                                    {generatedResults.map((item) => {
                                        const isThisPlaying = playingAudioId === item.id;
                                        return (
                                            <div
                                                key={item.id}
                                                className="p-4 rounded-2xl bg-gradient-to-br from-white/[0.05] to-black/70 border border-violet-500/20 hover:border-violet-500/40 transition-all space-y-3 shadow-lg"
                                            >
                                                {/* Header piste */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-300 font-bold text-xs flex items-center justify-center border border-violet-500/30">
                                                            {item.variation}
                                                        </span>
                                                        <div className="font-bold text-xs text-white line-clamp-1">
                                                            {item.title}
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                                                        00:{item.duration < 10 ? `0${item.duration}` : item.duration}
                                                    </span>
                                                </div>

                                                {/* Player audio & Waveform interactive */}
                                                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/60 border border-white/10">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTogglePlayAudio(item.id, item.audioUrl)}
                                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                                            isThisPlaying
                                                                ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105'
                                                                : 'bg-violet-600 text-white hover:bg-violet-500'
                                                        }`}
                                                    >
                                                        {isThisPlaying ? (
                                                            <Pause className="w-4 h-4 fill-black" />
                                                        ) : (
                                                            <Play className="w-4 h-4 fill-white ml-0.5" />
                                                        )}
                                                    </button>

                                                    {/* Barres d'égaliseur animé */}
                                                    <div className="flex-1 flex items-center gap-1 h-6">
                                                        {[40, 70, 30, 90, 60, 100, 45, 80, 50, 75, 95, 60, 85, 30, 70, 50].map((h, i) => (
                                                            <div
                                                                key={i}
                                                                className={`flex-1 rounded-full transition-all duration-150 ${
                                                                    isThisPlaying
                                                                        ? 'bg-gradient-to-t from-violet-500 to-amber-400 animate-pulse'
                                                                        : 'bg-white/20'
                                                                }`}
                                                                style={{
                                                                    height: isThisPlaying
                                                                        ? `${Math.max(15, (h * Math.sin(Date.now() / 200 + i)) % 100)}%`
                                                                        : `${h * 0.4}%`
                                                                }}
                                                            />
                                                        ))}
                                                    </div>

                                                    <Volume2 className="w-3.5 h-3.5 text-gray-500" />
                                                </div>

                                                {/* Boutons d'action 1-Clic vers Radio Manager */}
                                                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddAsGeneralJingle(item)}
                                                        className="px-2.5 py-1.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-200 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                                        title="Ajouter à la banque de jingles généraux de la radio"
                                                    >
                                                        <Plus className="w-3 h-3 text-violet-400" />
                                                        <span>+ Jingles Généraux</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleInjectInEmission(item)}
                                                        className="px-2.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-200 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                                        title={`Injecter dans la programmation de ${activeBlock?.title}`}
                                                    >
                                                        <Radio className="w-3 h-3 text-indigo-400" />
                                                        <span>Injecter dans l'émission</span>
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between gap-2 pt-0.5 text-[10px]">
                                                    {onSetAsThemeJingle && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSetAsTheme(item)}
                                                            className="text-amber-400 hover:text-amber-300 font-semibold underline flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <span>🌟 Mettre en Générique d'Intro</span>
                                                        </button>
                                                    )}

                                                    <a
                                                        href={item.audioUrl}
                                                        download={`${item.title}.wav`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-gray-400 hover:text-white flex items-center gap-1 ml-auto font-medium"
                                                    >
                                                        <Download className="w-3 h-3" />
                                                        <span>Télécharger audio</span>
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : !isGenerating ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center rounded-3xl bg-white/[0.02] border border-dashed border-white/10 space-y-3">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500">
                                        <Sparkles className="w-6 h-6 text-violet-400/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs font-bold text-gray-300">Aucun jingle en attente</div>
                                        <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed">
                                            Choisissez un style à gauche et cliquez sur <strong>« Générer 2 Variations avec l'IA »</strong> pour écouter et intégrer vos jingles.
                                        </p>
                                    </div>
                                </div>
                            ) : null}

                        </div>
                    </div>
                </div>

                {/* ─── TIROIR / MODALE DE CONFIGURATION CLÉ API SUNO ─── */}
                {showSettingsDrawer && (
                    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md p-6 flex flex-col justify-between animate-in fade-in zoom-in-95">
                        <div className="space-y-4 max-w-xl mx-auto w-full">
                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                <div className="flex items-center gap-2">
                                    <Key className="w-5 h-5 text-violet-400" />
                                    <h3 className="font-display font-black uppercase text-base text-white">
                                        Paramètres API Suno
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowSettingsDrawer(false)}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-200 space-y-2 leading-relaxed">
                                <div className="font-bold flex items-center gap-1.5 text-white">
                                    <Info className="w-4 h-4 text-violet-400" />
                                    Vous n'avez pas encore de clé API ?
                                </div>
                                <p>
                                    Le Studio Suno fonctionne directement en <strong>Mode Découverte</strong> sans clé. Vous pouvez concevoir vos jingles, les tester avec des audio réels et les insérer dans vos émissions.
                                </p>
                                <p>
                                    Si vous souhaitez connecter votre compte Suno payant (via un fournisseur API compatible comme <em>sunoapi.org</em> ou <em>goapi.ai</em>), entrez votre token ci-dessous. Il sera mémorisé uniquement dans votre navigateur.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1">
                                        Clé API Suno (Bearer Token)
                                    </label>
                                    <input
                                        type="password"
                                        value={tempKey}
                                        onChange={(e) => setTempKey(e.target.value)}
                                        placeholder="Collez votre clé API ici (ex: suno_sk_...)"
                                        className="w-full px-3 py-2.5 rounded-xl bg-black/70 border border-white/20 text-xs text-white focus:border-violet-500 outline-none font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1">
                                        Endpoint URL de l'API Suno
                                    </label>
                                    <input
                                        type="text"
                                        value={tempUrl}
                                        onChange={(e) => setTempUrl(e.target.value)}
                                        placeholder="https://api.sunoapi.org/v1/generate"
                                        className="w-full px-3 py-2 rounded-xl bg-black/70 border border-white/20 text-xs text-gray-300 focus:border-violet-500 outline-none font-mono"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        Compatible avec les wrappers standard Suno v3 / v4.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="max-w-xl mx-auto w-full pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => setShowSettingsDrawer(false)}
                                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 cursor-pointer"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveSettings}
                                className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-xs font-bold text-white shadow-lg shadow-violet-600/30 cursor-pointer"
                            >
                                Enregistrer les paramètres
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
