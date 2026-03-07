import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Settings, Users, MessageSquare, Send, Zap,
    Smile, Save, AlertCircle, ShoppingBag, Music, Trash2
} from 'lucide-react';

interface TakeoverSettings {
    title: string;
    youtubeId: string;
    mainFluxName: string;
    currentTrack: string;
    tickerText: string;
    showTickerBanner: boolean;
    tickerBgColor: string;
    tickerTextColor: string;
    lineup: string;
    status: 'live' | 'edit' | 'off';
    enabled: boolean;
    acrHost?: string;
    acrAccessKey?: string;
    acrAccessSecret?: string;
    auddToken?: string;
}

interface ShazamTrack {
    id: number;
    artist: string;
    title: string;
    time: string;
    image: string;
}

export const TakeoverPage = ({ initialSettings }: { initialSettings?: any }) => {
    const navigate = useNavigate();
    const [isAdmin] = useState(true); // À coupler avec votre système auth
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [viewersCount] = useState(1284);
    const [activeChatTab, setActiveChatTab] = useState('chat');
    const [newMessage, setNewMessage] = useState('');
    const [drops, setDrops] = useState(150);
    const [shazamHistory, setShazamHistory] = useState<ShazamTrack[]>(() => {
        const saved = localStorage.getItem('shazam_history');
        return saved ? JSON.parse(saved) : [
            { id: 1, artist: "Mochakk", title: "Jealous", time: "20:45", image: "https://i1.sndcdn.com/artworks-000666066666-666666-t500x500.jpg" },
            { id: 2, artist: "Vintage Culture", title: "Fractions", time: "20:38", image: "https://i.scdn.co/image/ab67616d0000b2738f6b6b6b6b6b6b6b6b6b6b6b" }
        ];
    });
    const [shazamStatus, setShazamStatus] = useState<'idle' | 'listening' | 'processing' | 'found'>('idle');
    const [lastFoundTrack, setLastFoundTrack] = useState<any>(null);

    useEffect(() => {
        localStorage.setItem('shazam_history', JSON.stringify(shazamHistory));
    }, [shazamHistory]);

    // Chat State
    const [chatMessages, setChatMessages] = useState([
        { id: 1, user: "Lucas_92", text: "INCROYABLE CETTE LINEUP ! 🔥🔥🔥", color: "text-neon-cyan" },
        { id: 2, user: "Sophie_DJ", text: "Le son est dingue, merci Dropsiders !", color: "text-neon-purple" },
        { id: 3, user: "TechnoLover", text: "Qui va à Tomorrowland ici ?", color: "text-neon-red" },
    ]);

    // DB Settings
    const [settings, setSettings] = useState<TakeoverSettings>({
        title: initialSettings?.title || 'LIVE TAKEOVER',
        youtubeId: initialSettings?.youtubeId || '',
        mainFluxName: initialSettings?.mainFluxName || 'MAIN STAGE',
        currentTrack: initialSettings?.currentTrack || 'ID - UNRELEASED',
        tickerText: initialSettings?.tickerText || 'BIENVENUE SUR LE LIVE DROPSIDERS ! PROFITEZ DE LA MUSIQUE 24/7',
        showTickerBanner: initialSettings?.showTickerBanner !== undefined ? initialSettings.showTickerBanner : true,
        tickerBgColor: initialSettings?.tickerBgColor || '#ff0033',
        tickerTextColor: initialSettings?.tickerTextColor || '#ffffff',
        lineup: initialSettings?.lineup || '',
        status: initialSettings?.status || 'live',
        enabled: initialSettings?.enabled !== undefined ? initialSettings.enabled : true,
        acrHost: initialSettings?.acrHost || 'identify-eu-west-1.acrcloud.com',
        acrAccessKey: initialSettings?.acrAccessKey || '',
        acrAccessSecret: initialSettings?.acrAccessSecret || '',
        auddToken: initialSettings?.auddToken || ''
    });

    // Admin Panel States
    const [editTitle, setEditTitle] = useState(settings.title);
    const [editYoutubeId, setEditYoutubeId] = useState(settings.youtubeId);
    const [editMainFluxName, setEditMainFluxName] = useState(settings.mainFluxName);
    const [editCurrentTrack, setEditCurrentTrack] = useState(settings.currentTrack);
    const [editAnnText, setEditAnnText] = useState(settings.tickerText);
    const [editAnnEnabled, setEditAnnEnabled] = useState(settings.showTickerBanner);
    const [editLineup, setEditLineup] = useState(settings.lineup);
    const [editStatus, setEditStatus] = useState(settings.status);
    const [editTickerBg, setEditTickerBg] = useState(settings.tickerBgColor);
    const [editTickerTextC, setEditTickerTextC] = useState(settings.tickerTextColor);
    const [editAcrHost, setEditAcrHost] = useState(settings.acrHost || '');
    const [editAcrKey, setEditAcrKey] = useState(settings.acrAccessKey || '');
    const [editAcrSecret, setEditAcrSecret] = useState(settings.acrAccessSecret || '');
    const [editAuddToken, setEditAuddToken] = useState(settings.auddToken || '');
    const [adminActiveTab, setAdminActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);

    const [dropsLots, setDropsLots] = useState([
        { id: 1, name: "Pass VIP Tomorrowland", price: 5000, stock: 2 },
        { id: 2, name: "T-shirt Dropsiders", price: 800, stock: 15 }
    ]);
    const [botCommands, setBotCommands] = useState([
        { command: "!insta", response: "Suivez-nous sur @dropsiders.eu !" },
        { command: "!lineup", response: "La lineup est disponible dans l'onglet PLANNING." }
    ]);

    // Admin Form States
    const [newLot, setNewLot] = useState({ name: '', price: '', stock: '' });
    const [newCmd, setNewCmd] = useState({ command: '', response: '' });

    const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({
        show: false, message: '', type: 'success'
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('https://api.dropsiders.fr/api/takeover-settings');
            const data = await res.json();
            if (data) {
                setSettings(data);
                setEditTitle(data.title);
                setEditYoutubeId(data.youtubeId);
                setEditMainFluxName(data.mainFluxName);
                setEditCurrentTrack(data.currentTrack || 'ID - UNRELEASED');
                setEditAnnText(data.tickerText);
                setEditAnnEnabled(data.showTickerBanner);
                setEditTickerBg(data.tickerBgColor || '#ff0033');
                setEditTickerTextC(data.tickerTextColor || '#ffffff');
                setEditLineup(data.lineup);
                setEditStatus(data.status);
                setEditAcrHost(data.acrHost || 'identify-eu-west-1.acrcloud.com');
                setEditAcrKey(data.acrAccessKey || '');
                setEditAcrSecret(data.acrAccessSecret || '');
                setEditAuddToken(data.auddToken || '');
            }
        } catch (e) { console.error("Error loading settings:", e); }
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        const updatedTakeover: TakeoverSettings = {
            title: editTitle,
            youtubeId: editYoutubeId,
            mainFluxName: editMainFluxName,
            currentTrack: editCurrentTrack,
            tickerText: editAnnText,
            showTickerBanner: editAnnEnabled,
            tickerBgColor: editTickerBg,
            tickerTextColor: editTickerTextC,
            lineup: editLineup,
            status: editStatus,
            enabled: editStatus !== 'off',
            acrHost: editAcrHost,
            acrAccessKey: editAcrKey,
            acrAccessSecret: editAcrSecret,
            auddToken: editAuddToken
        };

        try {
            const saveRes = await fetch('https://api.dropsiders.fr/api/takeover-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTakeover)
            });
            if (saveRes.ok) {
                setSettings(updatedTakeover);
                showNotification('Paramètres mis à jour !', 'success');
                setShowAdminPanel(false);
            } else {
                showNotification('Erreur lors de la sauvegarde', 'error');
            }
        } catch (e) {
            showNotification('Erreur de connexion', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const showNotification = (message: string, type: 'success' | 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const sendBotMessage = (text: string) => {
        const botMsg = {
            id: Date.now() + Math.random(),
            user: "DROPSIDERS BOT",
            text,
            color: "text-[#39ff14]", // Neon Green
            isBot: true
        };
        setChatMessages(prev => [...prev.slice(-49), botMsg]);
    };

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        // 1. Check for links (Security/Bot)
        const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
        if (urlRegex.test(newMessage)) {
            sendBotMessage("⚠️ Les liens sont interdits dans le chat pour votre sécurité.");
            setNewMessage('');
            return;
        }

        // 2. Add user message
        const msg = {
            id: Date.now(),
            user: "VOUS",
            text: newMessage.trim(),
            color: "text-neon-red"
        };
        const newChat = [...chatMessages, msg];
        setChatMessages(newChat.slice(-50)); // Keep last 50 messages
        setNewMessage('');

        // 3. Check for Bot Commands
        const trimmedMsg = newMessage.trim().toLowerCase();
        if (trimmedMsg.startsWith('!')) {
            const foundCmd = botCommands.find(c => c.command.toLowerCase() === trimmedMsg);
            if (foundCmd) {
                setTimeout(() => {
                    sendBotMessage(foundCmd.response);
                }, 500);
            } else if (trimmedMsg === '!help' || trimmedMsg === '!commandes') {
                setTimeout(() => {
                    const cmds = botCommands.map(c => c.command).join(', ');
                    sendBotMessage(`Commandes disponibles : !help, !commandes, ${cmds}`);
                }, 500);
            }
        }
    };

    const deleteMessage = (id: number) => {
        setChatMessages(chatMessages.filter(m => m.id !== id));
    };

    const clearChat = () => {
        setChatMessages([]);
        showNotification('Chat réinitialisé', 'success');
    };

    // --- Lineup Logic ---
    const parseLineup = (text: string) => {
        if (!text) return [];
        return text.split('\n').map(line => {
            const match = line.match(/\[(.*?)\] (.*?) \| (.*)/);
            if (match) {
                const time = match[1];
                const artistPart = match[2];
                const stage = match[3];

                let artist = artistPart;
                let track = '';

                if (artistPart.includes(' - ')) {
                    const parts = artistPart.split(' - ');
                    artist = parts[0].trim();
                    track = parts[1].trim();
                }

                return { time, artist, track, stage };
            }
            return null;
        }).filter(Boolean);
    };

    const getCurrentArtist = () => {
        const now = new Date();
        const currentTimeString = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const lineup = parseLineup(settings.lineup);

        // Trouver l'artiste dont l'heure de début est la plus proche avant l'heure actuelle
        const current = [...lineup].reverse().find(item => item && item.time <= currentTimeString);

        if (current) {
            return {
                artist: current.artist,
                track: current.track || settings.currentTrack || 'ID - UNRELEASED',
                stage: current.stage
            };
        }

        return {
            artist: settings.mainFluxName,
            track: settings.currentTrack || 'ID - UNRELEASED',
            stage: 'MAIN STAGE'
        };
    };

    const recordAndIdentify = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/wav' });
                stream.getTracks().forEach(track => track.stop());

                setShazamStatus('processing');

                try {
                    const formData = new FormData();
                    formData.append('audio', audioBlob);

                    const resp = await fetch('/api/shazam/identify', {
                        method: 'POST',
                        body: formData
                    });

                    if (resp.ok) {
                        const data = await resp.json();
                        if (data.status === 'success' && data.metadata) {
                            const track = data.metadata;
                            const newTrack: ShazamTrack = {
                                id: Date.now(),
                                artist: track.artist,
                                title: track.title,
                                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                                image: track.image || `https://avatar.vercel.sh/${track.artist}.svg`
                            };
                            setLastFoundTrack(newTrack);
                            setShazamStatus('found');
                            setShazamHistory([newTrack, ...shazamHistory]);
                            setDrops(d => d + 50);
                            showNotification(`Titre identifié : ${track.artist} - ${track.title} ! +50 Drops`, 'success');
                        } else {
                            throw new Error(data.error || 'Aucun titre trouvé');
                        }
                    } else {
                        throw new Error('Erreur API identification');
                    }
                } catch (err: any) {
                    showNotification(err.message || "Impossible d'identifier ce titre", 'error');
                    setShazamStatus('idle');
                }

                setTimeout(() => setShazamStatus('idle'), 3000);
            };

            mediaRecorder.start();
            setShazamStatus('listening');

            // Record for 6 seconds
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, 6000);

        } catch (err) {
            showNotification("Permission micro refusée ou non supportée", 'error');
            setShazamStatus('idle');
        }
    };

    const handleShazamAction = () => {
        if (settings.auddToken || (settings.acrAccessKey && settings.acrAccessSecret)) {
            recordAndIdentify();
        } else {
            // Fallback for demo if no keys
            setShazamStatus('listening');
            setTimeout(() => {
                setShazamStatus('processing');
                setTimeout(() => {
                    const current = getCurrentArtist();
                    const newTrack: ShazamTrack = {
                        id: Date.now(),
                        artist: current.artist,
                        title: current.track,
                        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                        image: `https://avatar.vercel.sh/${current.artist}.svg`
                    };
                    setLastFoundTrack(newTrack);
                    setShazamStatus('found');
                    setShazamHistory([newTrack, ...shazamHistory]);
                    setDrops(d => d + 25);
                    showNotification(`Identifié (Simulé) : ${current.artist} ! +25 Drops`, 'success');
                    setTimeout(() => setShazamStatus('idle'), 3000);
                }, 1500);
            }, 2000);
        }
    };

    const lineupData = parseLineup(settings.lineup);
    const fluxCurrentArtist = getCurrentArtist();

    return (
        <div className="fixed inset-0 bg-dark-bg/60 backdrop-blur-xl z-[101] flex flex-col overflow-hidden select-none">
            {/* 1. TICKER BANNER */}
            {settings.showTickerBanner && (
                <div
                    className="h-8 w-full border-b border-white/5 flex items-center overflow-hidden z-[100]"
                    style={{ backgroundColor: settings.tickerBgColor }}
                >
                    <div className="flex animate-ticker whitespace-nowrap">
                        {Array(10).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center">
                                <span
                                    className="text-[10px] font-black uppercase tracking-[0.4em] italic mx-12"
                                    style={{ color: settings.tickerTextColor }}
                                >
                                    {settings.tickerText}
                                </span>
                                <div className="w-2 h-2 rounded-full bg-white/30 ml-12" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. LIVE INFO BAR */}
            <div className="h-12 w-full bg-dark-bg/40 backdrop-blur-md border-b border-white/10 px-6 flex items-center justify-between z-[90] shrink-0 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full shadow-[0_0_15px_rgba(255,0,0,0.4)]">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">LIVE</span>
                    </div>
                    <h1 className="text-xl font-display font-black italic tracking-tighter uppercase">{settings.title || "LIVE TAKEOVER"}</h1>
                </div>

                <div className="flex items-center gap-6">
                    {isAdmin && (
                        <button
                            onClick={() => setShowAdminPanel(!showAdminPanel)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${showAdminPanel ? 'bg-neon-purple border-neon-purple text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                        >
                            <Settings className="w-4 h-4" />
                            <span className="text-[9px] font-black uppercase tracking-widest">ADMIN</span>
                        </button>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full cursor-pointer hover:bg-white/10 transition-all">
                        <Users className="w-4 h-4 text-neon-red" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{viewersCount} SPECTATEURS</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-neon-red/10 border border-neon-red/20 rounded-full group cursor-pointer hover:bg-neon-red/20 transition-all">
                        <Zap className="w-4 h-4 text-neon-red group-hover:animate-bounce" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">{drops} DROPS</span>
                    </div>
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-full transition-all">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* 3. MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-row overflow-hidden relative">
                {/* A. VIDEO PANEL (60%) */}
                <div className="w-[60%] h-full bg-transparent border-r border-white/10 relative flex flex-col shrink-0">
                    <AnimatePresence mode="wait">
                        {showAdminPanel ? (
                            <motion.div
                                key="admin-panel"
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="flex-1 bg-dark-bg/80 backdrop-blur-xl p-8 overflow-y-auto custom-scrollbar"
                            >
                                <div className="max-w-3xl mx-auto space-y-10">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-6">
                                        <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">Configuration <span className="text-neon-purple">Studio</span></h2>
                                        <div className="flex gap-2">
                                            {['GENERAL', 'DROPS', 'BOT', 'MODERATION'].map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setAdminActiveTab(t.toLowerCase())}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminActiveTab === t.toLowerCase() ? 'bg-white/10 text-white border border-white/20' : 'text-gray-500 hover:text-white'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                        <button onClick={() => setShowAdminPanel(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-6 h-6 text-gray-500" /></button>
                                    </div>

                                    {adminActiveTab === 'general' ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Titre du Live</label>
                                                        <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-neon-purple transition-all uppercase" placeholder="EX: MAIN STAGE LIVE" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Artiste Actuel (Bandeau)</label>
                                                        <input type="text" value={editMainFluxName} onChange={e => setEditMainFluxName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-neon-purple transition-all uppercase" placeholder="EX: DEBORAH DE LUCA" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Titre Actuel (Shazam)</label>
                                                        <input type="text" value={editCurrentTrack} onChange={e => setEditCurrentTrack(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-neon-purple transition-all uppercase" placeholder="EX: JEALOUS (ORIGINAL MIX)" />
                                                    </div>
                                                </div>
                                                <div className="pt-6 border-t border-white/5 space-y-6">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Zap className="w-4 h-4 text-neon-cyan" />
                                                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Config Vrai Shazam (AudD.io ou ACRCloud)</h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">AudD API Token (Simple)</label>
                                                            <input type="password" value={editAuddToken} onChange={e => setEditAuddToken(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-neon-cyan transition-all" placeholder="API Token AudD" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">ACRCloud Host</label>
                                                            <input type="text" value={editAcrHost} onChange={e => setEditAcrHost(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-neon-purple transition-all" placeholder="identify-eu-west-1..." />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">ACRCloud Access Key</label>
                                                            <input type="text" value={editAcrKey} onChange={e => setEditAcrKey(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-neon-purple transition-all" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">ACRCloud Access Secret</label>
                                                            <input type="password" value={editAcrSecret} onChange={e => setEditAcrSecret(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-neon-purple transition-all" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-6 pt-6 border-t border-white/5">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Mode de Diffusion</label>
                                                        <div className="flex gap-2 p-1 bg-black/40 border border-white/10 rounded-xl">
                                                            {(['live', 'edit', 'off'] as const).map(s => (
                                                                <button
                                                                    key={s}
                                                                    onClick={() => setEditStatus(s)}
                                                                    className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${editStatus === s
                                                                        ? (s === 'live' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : s === 'edit' ? 'bg-orange-600 text-white' : 'bg-gray-600 text-white')
                                                                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                                                                        }`}
                                                                >
                                                                    {s === 'live' ? 'EN DIRECT' : s === 'edit' ? 'PRÉPARATION' : 'HORS LIGNE'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">ID Vidéo YouTube</label>
                                                        <input type="text" value={editYoutubeId} onChange={e => setEditYoutubeId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-neon-purple transition-all" placeholder="EX: dQw4w9WgXcQ" />
                                                    </div>
                                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                                        <div>
                                                            <p className="text-[10px] font-black text-white uppercase tracking-widest">Bandeau d'annonce</p>
                                                            <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Activer le ticker banner</p>
                                                        </div>
                                                        <button onClick={() => setEditAnnEnabled(!editAnnEnabled)} className={`w-12 h-6 rounded-full relative transition-all ${editAnnEnabled ? 'bg-neon-red' : 'bg-white/10'}`}>
                                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editAnnEnabled ? 'left-7' : 'left-1'}`} />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Couleur Fond</label>
                                                            <input type="color" value={editTickerBg} onChange={e => setEditTickerBg(e.target.value)} className="w-full h-10 bg-black/40 border border-white/10 rounded-lg outline-none cursor-pointer" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Couleur Texte</label>
                                                            <input type="color" value={editTickerTextC} onChange={e => setEditTickerTextC(e.target.value)} className="w-full h-10 bg-black/40 border border-white/10 rounded-lg outline-none cursor-pointer" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Texte du Bandeau</label>
                                                    <textarea value={editAnnText} onChange={e => setEditAnnText(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-neon-purple transition-all min-h-[120px] uppercase" placeholder="MESSAGE BANDEAU..." />
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Planning</label>
                                                    <textarea value={editLineup} onChange={e => setEditLineup(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-neon-purple transition-all min-h-[120px] uppercase font-mono" placeholder="[HH:mm] Artist | Stage" />
                                                </div>
                                            </div>
                                        </>
                                    ) : adminActiveTab === 'drops' ? (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Ajouter un Lot</h3>
                                                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                                                        <input type="text" placeholder="NOM DU LOT" value={newLot.name} onChange={e => setNewLot({ ...newLot, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-neon-red" />
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <input type="number" placeholder="PRIX" value={newLot.price} onChange={e => setNewLot({ ...newLot, price: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-neon-red" />
                                                            <input type="number" placeholder="STOCK" value={newLot.stock} onChange={e => setNewLot({ ...newLot, stock: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-neon-red" />
                                                        </div>
                                                        <button onClick={() => { if (newLot.name) { setDropsLots([...dropsLots, { id: Date.now(), name: newLot.name, price: Number(newLot.price), stock: Number(newLot.stock) }]); setNewLot({ name: '', price: '', stock: '' }); } }} className="w-full py-3 bg-neon-red/20 text-neon-red border border-neon-red/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neon-red hover:text-white transition-all">Ajouter</button>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Lots Actifs</h3>
                                                    <div className="space-y-2">
                                                        {dropsLots.map(lot => (
                                                            <div key={lot.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-xs font-black text-white uppercase">{lot.name}</p>
                                                                    <p className="text-[9px] text-gray-500 font-bold uppercase">{lot.price} DROPS • STOCK: {lot.stock}</p>
                                                                </div>
                                                                <button onClick={() => setDropsLots(dropsLots.filter(l => l.id !== lot.id))} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : adminActiveTab === 'bot' ? (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Nouvelle Commande</h3>
                                                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                                                        <input type="text" placeholder="!COMMANDE" value={newCmd.command} onChange={e => setNewCmd({ ...newCmd, command: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-neon-cyan" />
                                                        <textarea placeholder="RÉPONSE..." value={newCmd.response} onChange={e => setNewCmd({ ...newCmd, response: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-neon-cyan min-h-[80px]" />
                                                        <button onClick={() => { if (newCmd.command) { setBotCommands([...botCommands, { command: newCmd.command, response: newCmd.response }]); setNewCmd({ command: '', response: '' }); } }} className="w-full py-3 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neon-cyan hover:text-white transition-all">Enregistrer</button>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Commandes Actives</h3>
                                                    <div className="space-y-2">
                                                        {botCommands.map((cmd, i) => (
                                                            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-xs font-black text-neon-cyan uppercase font-mono">{cmd.command}</p>
                                                                    <p className="text-[9px] text-gray-500 font-bold uppercase truncate max-w-[150px]">{cmd.response}</p>
                                                                </div>
                                                                <button onClick={() => setBotCommands(botCommands.filter((_, idx) => idx !== i))} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            <div className="max-w-md mx-auto p-12 border-2 border-dashed border-white/10 rounded-[4rem] text-center space-y-8">
                                                <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto">
                                                    <MessageSquare className="w-10 h-10 text-red-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-white uppercase italic">Modération Chat</h3>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-2">Suppression définitive du flux</p>
                                                </div>
                                                <button onClick={clearChat} className="w-full py-5 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-xl hover:shadow-red-600/30">Vider le Chat</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-4 pt-6">
                                        <button onClick={handleSaveSettings} disabled={isSaving} className="flex-1 py-4 bg-neon-purple text-white font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-neon-purple/80 transition-all shadow-xl shadow-neon-purple/20 flex items-center justify-center gap-3 disabled:opacity-50">
                                            <Save className={`w-5 h-5 ${isSaving ? 'animate-spin' : ''}`} />
                                            {isSaving ? 'ENREGISTREMENT...' : 'SAUVEGARDER'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="video-player" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 relative group bg-black">
                                <iframe className="w-full h-full border-none" src={`https://www.youtube.com/embed/${settings.youtubeId || 'dQw4w9WgXcQ'}?autoplay=1&mute=0&rel=0&modestbranding=1`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                                <div className="absolute top-4 left-4 z-20 flex gap-2">
                                    <div className="px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_10px_#00ffff]" />
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ACTUALLEMENT:</span>
                                        <span className="text-xs font-black text-white uppercase italic tracking-tighter">{fluxCurrentArtist.artist}</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* B. CHAT PANEL (30%) */}
                <div className="flex-1 h-full bg-dark-bg/20 backdrop-blur-sm flex flex-col relative z-10 border-r border-white/10 shadow-2xl">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-neon-red/10 border border-neon-red/20 flex items-center justify-center text-neon-red">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                            <h2 className="text-xs font-black uppercase italic tracking-tighter text-white">LIVE INTERACTIF</h2>
                        </div>
                    </div>

                    <div className="flex gap-1 p-2 bg-black/20 border-b border-white/10 overflow-x-auto no-scrollbar">
                        {['CHAT', 'PLANNING', 'SHAZAM', 'DROPS'].map(tab => (
                            <button key={tab} onClick={() => setActiveChatTab(tab.toLowerCase())} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeChatTab === tab.toLowerCase() ? 'bg-white/10 text-white border border-white/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>{tab}</button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {activeChatTab === 'chat' ? (
                                <motion.div key="chat-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                    <div className="p-3 bg-neon-red/10 border border-neon-red/20 rounded-xl">
                                        <p className="text-[10px] text-neon-red font-black uppercase mb-1">Épinglé</p>
                                        <p className="text-xs text-white">Bienvenue ! Profitez du festival en direct ! 🔥</p>
                                    </div>
                                    {chatMessages.map((msg: any) => (
                                        <div key={msg.id} className={`group flex gap-3 animate-slide-in relative ${msg.isBot ? 'bg-white/[0.03] p-2 rounded-xl border border-white/5' : ''}`}>
                                            <div className={`w-8 h-8 rounded-full border border-white/10 shrink-0 flex items-center justify-center ${msg.isBot ? 'bg-[#39ff14]/10 text-[#39ff14]' : 'bg-white/5'}`}>
                                                {msg.isBot ? <Zap className="w-4 h-4" /> : null}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${msg.color}`}>{msg.user}</p>
                                                    {isAdmin && (
                                                        <button onClick={() => deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded transition-all">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-300">{msg.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            ) : activeChatTab === 'shazam' ? (
                                <motion.div key="shazam-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    <div className="relative">
                                        <button
                                            onClick={handleShazamAction}
                                            disabled={shazamStatus !== 'idle'}
                                            className={`w-full py-12 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col items-center justify-center gap-6 relative overflow-hidden group ${shazamStatus === 'listening' ? 'border-neon-cyan bg-neon-cyan/5' :
                                                shazamStatus === 'processing' ? 'border-neon-purple bg-neon-purple/5' :
                                                    shazamStatus === 'found' ? 'border-green-500 bg-green-500/5' :
                                                        'border-white/10 bg-white/5 hover:border-neon-cyan/50 hover:bg-neon-cyan/5'
                                                }`}
                                        >
                                            {/* Ripples Effect */}
                                            {shazamStatus === 'listening' && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="absolute w-32 h-32 bg-neon-cyan/20 rounded-full animate-ping" />
                                                    <div className="absolute w-48 h-48 bg-neon-cyan/10 rounded-full animate-ping [animation-delay:0.5s]" />
                                                </div>
                                            )}

                                            <div className={`w-24 h-24 rounded-full flex items-center justify-center relative z-10 transition-all duration-500 ${shazamStatus === 'listening' ? 'bg-neon-cyan shadow-[0_0_30px_rgba(0,255,255,0.4)]' :
                                                shazamStatus === 'processing' ? 'bg-neon-purple animate-bounce' :
                                                    shazamStatus === 'found' ? 'bg-green-500' :
                                                        'bg-white/10'
                                                }`}>
                                                <Music className={`w-10 h-10 transition-colors ${shazamStatus !== 'idle' ? 'text-white' : 'text-gray-400 group-hover:text-neon-cyan'
                                                    }`} />
                                            </div>

                                            <div className="text-center relative z-10">
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">
                                                    {shazamStatus === 'listening' ? 'MICRO ACTIVÉ' :
                                                        shazamStatus === 'processing' ? 'ANALYSE DU SPECTRE' :
                                                            shazamStatus === 'found' ? 'TITRE TROUVÉ !' :
                                                                'SHAZAM ENGINE'}
                                                </p>
                                                <h3 className="text-sm font-black uppercase italic tracking-tighter text-white">
                                                    {shazamStatus === 'listening' ? 'Écoute en cours...' :
                                                        shazamStatus === 'processing' ? 'Identification...' :
                                                            shazamStatus === 'found' ? lastFoundTrack?.artist :
                                                                'Appuyer pour identifier'}
                                                </h3>
                                            </div>
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Historique des captures</h3>
                                            <span className="text-[9px] font-black text-white/20 uppercase">{shazamHistory.length} TITRES</span>
                                        </div>
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                            {shazamHistory.map((track: ShazamTrack) => (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    key={track.id}
                                                    className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:border-neon-cyan/30 transition-all group"
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-black overflow-hidden shrink-0 border border-white/5">
                                                        <img src={track.image} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-black text-white italic uppercase truncate">{track.artist}</p>
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase truncate">{track.title}</p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-[9px] text-gray-600 font-black">{track.time}</p>
                                                        <ShoppingBag className="w-3 h-3 text-neon-cyan mt-1 cursor-pointer opacity-40 hover:opacity-100 transition-opacity" />
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : activeChatTab === 'drops' ? (
                                <motion.div key="drops-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                    <div className="p-8 bg-neon-red/10 border border-neon-red/20 rounded-[2rem] text-center">
                                        <Zap className="w-12 h-12 text-neon-red mx-auto mb-4 animate-bounce" />
                                        <h3 className="text-4xl font-display font-black text-white italic mb-2">{drops}</h3>
                                        <p className="text-[10px] font-black text-neon-red uppercase tracking-widest">DROPS ACCUMULÉS</p>
                                    </div>
                                    <button className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Utiliser mes Drops</button>
                                </motion.div>
                            ) : (
                                <motion.div key="planning-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                    {lineupData.length > 0 ? lineupData.map((item, i) => item && (
                                        <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                                            <div className="text-[10px] font-black text-neon-purple uppercase">{item.time}</div>
                                            <div className="flex-1"><p className="text-xs font-black text-white uppercase italic">{item.artist}</p><p className="text-[9px] text-gray-500 font-bold uppercase">{item.stage}</p></div>
                                        </div>
                                    )) : <div className="text-center py-20 opacity-20 uppercase font-black text-xs">Pas de planning</div>}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {activeChatTab === 'chat' && (
                        <div className="p-4 bg-[#080808] border-t border-white/10">
                            <div className="flex items-center gap-2 p-1 bg-black/40 border border-white/10 rounded-xl focus-within:border-neon-red/30 transition-all">
                                <button className="p-2 text-gray-500 hover:text-white"><Smile className="w-5 h-5" /></button>
                                <input className="flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none" placeholder="Écrire un message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
                                <button onClick={handleSendMessage} className="p-2 bg-neon-red text-white rounded-lg"><Send className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Toast Notifications */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className={`fixed bottom-8 left-8 z-[200] px-6 py-4 rounded-2xl border flex items-center gap-3 backdrop-blur-xl ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


