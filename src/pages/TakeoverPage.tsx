import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Settings, Users, MessageSquare, Send, Zap, Video,
    Save, AlertCircle, Music, Trash2, Calendar, Plus, Instagram,
    Pin, Star, ShieldCheck, UserMinus
} from 'lucide-react';

interface LineupItem {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    artist: string;
    stage: string;
    instagram: string;
}

interface StreamItem {
    id: string;
    name: string;
    youtubeId: string;
}

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
    streams?: StreamItem[];
    activeStreamId?: string;
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
    const [userRole, setUserRole] = useState<'admin' | 'mod' | 'user'>('admin');
    const [isAdmin] = useState(userRole === 'admin');
    const [isMod] = useState(userRole === 'admin' || userRole === 'mod');
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [viewersCount] = useState(1);
    const [activeChatTab, setActiveChatTab] = useState('chat');
    const [newMessage, setNewMessage] = useState('');
    const [isHighlightChecked, setIsHighlightChecked] = useState(false);

    const [pinnedMessage, setPinnedMessage] = useState<any>({
        id: 'welcome',
        user: "DROPSIDERS",
        text: "BIENVENUE SUR LE LIVE ! RESPECTEZ-VOUS DANS LE CHAT 🔥",
        color: "text-neon-red"
    });

    const [bannedUsers, setBannedUsers] = useState<Record<string, number | 'perm'>>({});
    const [drops] = useState(2450);

    const [shazamStatus, setShazamStatus] = useState<'idle' | 'listening' | 'processing' | 'found'>('idle');
    const [lastFoundTrack, setLastFoundTrack] = useState<ShazamTrack | null>(null);
    const [shazamHistory, setShazamHistory] = useState<ShazamTrack[]>(() => {
        const saved = localStorage.getItem('shazam_history');
        return saved ? JSON.parse(saved) : [];
    });

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
        streams: initialSettings?.streams || [],
        activeStreamId: initialSettings?.activeStreamId || ''
    });

    // Admin Panel States
    const [editTitle, setEditTitle] = useState(settings.title);
    const [editStreams, setEditStreams] = useState<StreamItem[]>(settings.streams || []);
    const [editActiveStreamId, setEditActiveStreamId] = useState(settings.activeStreamId || '');
    const [editAnnText, setEditAnnText] = useState(settings.tickerText);
    const [editAnnEnabled, setEditAnnEnabled] = useState(settings.showTickerBanner);
    const [editStatus, setEditStatus] = useState(settings.status);
    const [editTickerBg, setEditTickerBg] = useState(settings.tickerBgColor);
    const [editTickerTextC, setEditTickerTextC] = useState(settings.tickerTextColor);
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
    const [lineupItems, setLineupItems] = useState<LineupItem[]>(() => {
        try {
            return JSON.parse(settings.lineup);
        } catch (e) { return []; }
    });

    const [newLineupItem, setNewLineupItem] = useState<LineupItem>({
        id: '', day: '', startTime: '', endTime: '', artist: '', stage: '', instagram: ''
    });

    const extractYoutubeId = (url: string) => {
        if (!url) return '';
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
        return match ? match[1] : url.trim();
    };

    const extractInstagramUsername = (url: string) => {
        if (!url) return '';
        const cleanUrl = url.split('?')[0];
        const match = cleanUrl.match(/(?:instagram\.com\/|instagr\.am\/|instagram\.com\/reels?\/|instagram\.com\/p\/|instagram\.com\/tv\/)([a-zA-Z0-9._]+)/);
        if (match) return match[1];
        return url.replace('@', '').trim();
    };

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
                setEditStreams(data.streams || []);
                setEditActiveStreamId(data.activeStreamId || '');
                setEditAnnText(data.tickerText);
                setEditAnnEnabled(data.showTickerBanner);
                setEditTickerBg(data.tickerBgColor || '#ff0033');
                setEditTickerTextC(data.tickerTextColor || '#ffffff');
                setEditStatus(data.status);
                try {
                    const parsed = JSON.parse(data.lineup);
                    setLineupItems(Array.isArray(parsed) ? parsed : []);
                } catch (e) {
                    setLineupItems([]);
                }
            }
        } catch (e) { console.error("Error loading settings:", e); }
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        const activeStream = editStreams.find(s => s.id === editActiveStreamId);
        const updatedTakeover: TakeoverSettings = {
            title: editTitle,
            youtubeId: activeStream?.youtubeId || '',
            mainFluxName: activeStream?.name || '',
            currentTrack: 'ID - UNRELEASED',
            tickerText: editAnnText,
            showTickerBanner: editAnnEnabled,
            tickerBgColor: editTickerBg,
            tickerTextColor: editTickerTextC,
            lineup: JSON.stringify(lineupItems),
            status: editStatus,
            enabled: editStatus !== 'off',
            streams: editStreams,
            activeStreamId: editActiveStreamId
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

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        const msg = {
            id: Date.now(),
            user: "ALEX_FR1",
            text: newMessage,
            color: "text-neon-cyan",
            role: "admin",
            isHighlighted: isHighlightChecked
        };
        setChatMessages(prev => [...prev.slice(-49), msg]);
        setNewMessage('');
        setIsHighlightChecked(false);
    };

    const clearChat = () => setChatMessages([]);
    const deleteMessage = (id: number) => setChatMessages(prev => prev.filter(m => m.id !== id));

    const handleShazamAction = async () => {
        setShazamStatus('listening');
        setTimeout(() => setShazamStatus('processing'), 3000);
        setTimeout(() => {
            const mockTrack = { id: Date.now(), artist: "MOCHAKK", title: "JEALOUS (ORIGINAL MIX)", time: "22:45", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=cover" };
            setLastFoundTrack(mockTrack);
            setShazamHistory(prev => [mockTrack, ...prev.slice(0, 19)]);
            setShazamStatus('found');
            setTimeout(() => setShazamStatus('idle'), 3000);
        }, 6000);
    };

    const lineupData = lineupItems.map(item => ({
        time: item.startTime,
        artist: item.artist,
        stage: item.stage
    }));

    const fluxCurrentArtist = lineupItems.find(item => {
        const now = new Date();
        const [h, m] = item.startTime.split(':').map(Number);
        const [eh, em] = item.endTime.split(':').map(Number);
        const startTime = new Date(); startTime.setHours(h, m, 0);
        const endTime = new Date(); endTime.setHours(eh, em, 0);
        return now >= startTime && now <= endTime;
    }) || { artist: 'DROPSIDERS LIVE', stage: 'MAIN STAGE' };

    return (
        <div className="fixed inset-0 bg-[#050505] flex flex-col font-sans select-none overflow-hidden z-[100]">
            {/* 1. TOP ANNOUNCER (Ticker) */}
            <AnimatePresence>
                {settings.showTickerBanner && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden z-50">
                        <div style={{ backgroundColor: settings.tickerBgColor, color: settings.tickerTextColor }} className="py-2.5 flex items-center whitespace-nowrap overflow-hidden relative shadow-[0_5px_20px_rgba(0,0,0,0.4)]">
                            <motion.div animate={{ x: [0, -2000] }} transition={{ repeat: Infinity, duration: 40, ease: "linear" }} className="flex items-center gap-16 px-4">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <Zap className="w-4 h-4 fill-current animate-pulse" />
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">{settings.tickerText}</span>
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. HEADER */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md relative z-40">
                <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                        <h1 className="text-lg font-display font-black text-white italic tracking-tighter leading-none">{settings.title}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 bg-neon-red rounded-full animate-pulse" />
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">VRAI TEMPS RÉEL</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-neon-cyan" />
                            <span className="text-xs font-black text-white">{viewersCount}</span>
                        </div>
                    </div>
                    {isMod && (
                        <button onClick={() => setShowAdminPanel(!showAdminPanel)} className={`p-3 rounded-xl transition-all border ${showAdminPanel ? 'bg-neon-purple border-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.4)] text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
                            <Settings className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-full transition-all">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* 3. MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-row overflow-hidden relative">
                {/* A. VIDEO PANEL (60%) */}
                <div className="w-[60%] h-full bg-black border-r border-white/10 relative flex flex-col shrink-0">
                    <AnimatePresence mode="wait">
                        {showAdminPanel ? (
                            <motion.div
                                key="admin-panel"
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="flex-1 bg-dark-bg/50 backdrop-blur-xl p-8 overflow-y-auto custom-scrollbar"
                            >
                                <div className="max-w-3xl mx-auto space-y-10">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-6">
                                        <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">Configuration <span className="text-neon-purple">Studio</span></h2>
                                        <div className="flex gap-2">
                                            {['GENERAL', 'PLANNING', 'DROPS', 'BOT', 'MODERATION'].map(t => (
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
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Titre du Live</label>
                                                        <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-neon-purple transition-all uppercase" placeholder="EX: MAIN STAGE LIVE" />
                                                    </div>

                                                    <div className="pt-6 border-t border-white/5 space-y-6">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Video className="w-4 h-4 text-neon-purple" />
                                                            <h3 className="text-xs font-black text-white uppercase tracking-widest font-display italic">Gestion des Flux (Multiple)</h3>
                                                        </div>
                                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                            {editStreams.map((stream, idx) => (
                                                                <div key={stream.id || idx} className={`p-4 rounded-2xl border transition-all ${editActiveStreamId === stream.id ? 'bg-neon-purple/10 border-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'}`}>
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${editActiveStreamId === stream.id ? 'bg-neon-purple text-white' : 'bg-white/10 text-gray-500'}`}>
                                                                                {idx + 1}
                                                                            </div>
                                                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{stream.name || "Nouveau Flux"}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <button onClick={() => setEditActiveStreamId(stream.id)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${editActiveStreamId === stream.id ? 'bg-neon-purple text-white' : 'bg-white/5 text-gray-500 hover:text-white'}`}>
                                                                                {editActiveStreamId === stream.id ? 'ACTIF' : 'ACTIVER'}
                                                                            </button>
                                                                            <button onClick={() => setEditStreams(editStreams.filter(s => s.id !== stream.id))} className="p-1.5 text-gray-500 hover:text-red-500 transition-all bg-white/5 rounded-lg">
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        <div className="space-y-2">
                                                                            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest pl-2">Nom de la scène</label>
                                                                            <input type="text" value={stream.name} onChange={e => {
                                                                                const ns = [...editStreams];
                                                                                ns[idx].name = e.target.value.toUpperCase();
                                                                                setEditStreams(ns);
                                                                            }} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-neon-purple uppercase" placeholder="MAIN STAGE" />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest pl-2">YouTube (Link or ID)</label>
                                                                            <input type="text" value={stream.youtubeId} onChange={e => {
                                                                                const ns = [...editStreams];
                                                                                ns[idx].youtubeId = extractYoutubeId(e.target.value);
                                                                                setEditStreams(ns);
                                                                            }} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-neon-purple" placeholder="Link or ID" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <button onClick={() => setEditStreams([...editStreams, { id: Math.random().toString(36).substr(2, 9), name: '', youtubeId: '' }])} className="w-full py-4 bg-white/5 border border-dashed border-white/20 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:border-white/40 hover:text-white transition-all flex items-center justify-center gap-2">
                                                                <Plus className="w-4 h-4" /> Ajouter un autre flux
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Bandeau d'annonce</p>
                                                                <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Activer le message défilant</p>
                                                            </div>
                                                            <button onClick={() => setEditAnnEnabled(!editAnnEnabled)} className={`w-12 h-6 rounded-full relative transition-all ${editAnnEnabled ? 'bg-neon-red' : 'bg-white/10'}`}>
                                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editAnnEnabled ? 'left-7' : 'left-1'}`} />
                                                            </button>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-2">Couleur Fond</label>
                                                                    <div className="flex gap-2">
                                                                        <input type="color" value={editTickerBg} onChange={e => setEditTickerBg(e.target.value)} className="w-10 h-10 bg-black/40 border border-white/10 rounded-lg outline-none cursor-pointer p-1" />
                                                                        <input type="text" value={editTickerBg} onChange={e => setEditTickerBg(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-mono text-white outline-none" />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-2">Couleur Texte</label>
                                                                    <div className="flex gap-2">
                                                                        <input type="color" value={editTickerTextC} onChange={e => setEditTickerTextC(e.target.value)} className="w-10 h-10 bg-black/40 border border-white/10 rounded-lg outline-none cursor-pointer p-1" />
                                                                        <input type="text" value={editTickerTextC} onChange={e => setEditTickerTextC(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-mono text-white outline-none" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="block text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-2">Message du bandeau</label>
                                                                <textarea value={editAnnText} onChange={e => setEditAnnText(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-neon-red transition-all min-h-[100px] uppercase" placeholder="TEXTE À DÉFILER..." />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Statut de la diffusion</label>
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
                                                                    {s === 'live' ? 'EN DIRECT' : s === 'edit' ? 'PRÉPARAT.' : 'OFFLINE'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : adminActiveTab === 'planning' ? (
                                        <div className="space-y-10">
                                            {/* Formulaire d'ajout */}
                                            <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 bg-neon-cyan/20 rounded-xl flex items-center justify-center text-neon-cyan">
                                                        <Plus className="w-6 h-6" />
                                                    </div>
                                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Ajouter une session</h3>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-2">Jour (Mandatoire)</label>
                                                        <input type="text" placeholder="LUNDI..." value={newLineupItem.day} onChange={e => setNewLineupItem({ ...newLineupItem, day: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-neon-cyan transition-all uppercase" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-2">Artiste (Mandatoire)</label>
                                                        <input type="text" placeholder="MOCHAKK" value={newLineupItem.artist} onChange={e => setNewLineupItem({ ...newLineupItem, artist: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-neon-cyan transition-all uppercase" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-2">Heure Début (Mandatoire)</label>
                                                        <input type="text" placeholder="20:00" value={newLineupItem.startTime} onChange={e => setNewLineupItem({ ...newLineupItem, startTime: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-neon-cyan transition-all" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-2">Heure Fin (Mandatoire)</label>
                                                        <input type="text" placeholder="21:30" value={newLineupItem.endTime} onChange={e => setNewLineupItem({ ...newLineupItem, endTime: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-neon-cyan transition-all" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-2">Scène (Mandatoire)</label>
                                                        <input type="text" placeholder="MAIN STAGE" value={newLineupItem.stage} onChange={e => setNewLineupItem({ ...newLineupItem, stage: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-neon-cyan transition-all uppercase" />
                                                    </div>
                                                    <div className="col-span-2 md:col-span-3 space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-2">Instagram (Mandatoire)</label>
                                                        <div className="relative">
                                                            <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                            <input type="text" placeholder="@DROPSIDERS.EU" value={newLineupItem.instagram} onChange={e => setNewLineupItem({ ...newLineupItem, instagram: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-xs font-bold text-white outline-none focus:border-neon-cyan transition-all" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        if (newLineupItem.day && newLineupItem.artist && newLineupItem.startTime && newLineupItem.endTime && newLineupItem.stage && newLineupItem.instagram) {
                                                            const processedItem = {
                                                                ...newLineupItem,
                                                                id: Date.now().toString(),
                                                                instagram: extractInstagramUsername(newLineupItem.instagram)
                                                            };
                                                            setLineupItems([...lineupItems, processedItem]);
                                                            setNewLineupItem({ id: '', day: '', startTime: '', endTime: '', artist: '', stage: '', instagram: '' });
                                                            showNotification('Session ajoutée', 'success');
                                                        } else {
                                                            showNotification('Tous les champs sont obligatoires', 'error');
                                                        }
                                                    }}
                                                    className="w-full py-4 bg-neon-cyan text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-neon-cyan/80 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Plus className="w-5 h-5" /> Ajouter à la programmation
                                                </button>
                                            </div>

                                            {/* Liste des sessions */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between px-6 pb-2 border-b border-white/5">
                                                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Sessions Programmées ({lineupItems.length})</h3>
                                                </div>

                                                <div className="space-y-3">
                                                    {lineupItems.length === 0 ? (
                                                        <div className="py-20 bg-white/[0.02] border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                                                            <Calendar className="w-12 h-12 text-white/5 mb-4" />
                                                            <p className="text-xs font-black text-white/20 uppercase tracking-widest">Aucune session programmée</p>
                                                        </div>
                                                    ) : (
                                                        lineupItems.map((item, i) => (
                                                            <div key={item.id} className="p-5 bg-white/5 border border-white/10 rounded-[1.5rem] flex items-center gap-6 group hover:bg-white/[0.08] transition-all">
                                                                <div className="w-12 h-12 bg-white/5 rounded-xl flex flex-col items-center justify-center border border-white/10 shrink-0">
                                                                    <p className="text-[8px] font-black text-gray-500 uppercase">{item.day.slice(0, 3)}</p>
                                                                    <p className="text-[10px] font-black text-white">{item.startTime}</p>
                                                                </div>

                                                                <div className="flex-1 space-y-1">
                                                                    <div className="flex items-center gap-3">
                                                                        <p className="text-sm font-black text-white uppercase italic tracking-tighter">{item.artist}</p>
                                                                        <span className="px-2 py-0.5 bg-neon-cyan/10 text-neon-cyan text-[8px] font-black rounded-lg border border-neon-cyan/20 uppercase">{item.stage}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <p className="text-[9px] text-gray-500 font-bold uppercase">{item.startTime} — {item.endTime}</p>
                                                                        <div className="flex items-center gap-1.5 text-neon-purple">
                                                                            <Instagram className="w-3 h-3" />
                                                                            <p className="text-[9px] font-black uppercase">{item.instagram}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <button onClick={() => setLineupItems(lineupItems.filter((_, idx) => idx !== i))} className="p-3 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
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
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-6">
                                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Contrôle Rapide</h3>
                                                    <div className="p-8 bg-red-600/5 border border-red-600/20 rounded-[2.5rem] text-center space-y-6">
                                                        <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto">
                                                            <Trash2 className="w-8 h-8 text-red-500" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-lg font-black text-white uppercase italic">Nettoyage Chat</h4>
                                                            <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Supprimer tous les messages du flux</p>
                                                        </div>
                                                        <button onClick={clearChat} className="w-full py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20">Vider le Chat</button>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Utilisateurs Bannis ({Object.keys(bannedUsers).length})</h3>
                                                    <div className="space-y-3">
                                                        {Object.keys(bannedUsers).length === 0 ? (
                                                            <div className="p-10 border-2 border-dashed border-white/5 rounded-[2.5rem] text-center">
                                                                <Users className="w-10 h-10 text-white/5 mx-auto mb-2" />
                                                                <p className="text-[9px] font-black text-white/20 uppercase">Aucun utilisateur banni</p>
                                                            </div>
                                                        ) : (
                                                            Object.entries(bannedUsers).map(([username, expiry]) => (
                                                                <div key={username} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                                                                            <UserMinus className="w-4 h-4 text-red-500" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs font-black text-white uppercase">{username}</p>
                                                                            <p className="text-[8px] text-red-500 font-bold uppercase tracking-widest">
                                                                                {expiry === 'perm' ? 'BAN DÉFINITIF' : `EXPIRE: ${new Date(expiry as number).toLocaleTimeString()}`}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => {
                                                                            const newBanned = { ...bannedUsers };
                                                                            delete newBanned[username];
                                                                            setBannedUsers(newBanned);
                                                                            showNotification(`${username} débanni`, 'success');
                                                                        }}
                                                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[8px] font-black text-white uppercase transition-all"
                                                                    >
                                                                        Débannir
                                                                    </button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
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

                {/* B. CHAT PANEL (40%) */}
                <div className="flex-1 h-full bg-[#080808] flex flex-col relative z-10 border-l border-white/10 shadow-2xl">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-neon-red/10 border border-neon-red/20 flex items-center justify-center text-neon-red">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                            <h2 className="text-xs font-black uppercase italic tracking-tighter text-white">LIVE INTERACTIF</h2>
                        </div>
                        <div className="flex items-center gap-1">
                            {isMod && (
                                <button
                                    onClick={() => setUserRole(userRole === 'admin' ? 'mod' : userRole === 'mod' ? 'user' : 'admin')}
                                    className="px-2 py-1 bg-white/5 rounded text-[8px] font-black text-gray-600 hover:text-white transition-all uppercase"
                                >
                                    {userRole}
                                </button>
                            )}
                            {isAdmin && (
                                <button
                                    onClick={clearChat}
                                    className="p-2 text-gray-500 hover:text-neon-red hover:bg-neon-red/10 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
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
                                    {pinnedMessage && (
                                        <div className="p-3 bg-neon-red/10 border border-neon-red/20 rounded-xl relative overflow-hidden group">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-[10px] text-neon-red font-black uppercase flex items-center gap-2">
                                                    <Pin className="w-3 h-3" /> Message Épinglé
                                                </p>
                                                {isMod && (
                                                    <button onClick={() => setPinnedMessage(null)} className="text-[9px] text-gray-500 hover:text-white font-bold uppercase transition-all">
                                                        Désépingler
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-white">
                                                <span className="font-black italic mr-2 text-neon-red">{pinnedMessage.user} :</span>
                                                {pinnedMessage.text}
                                            </p>
                                        </div>
                                    )}

                                    {chatMessages.map((msg: any) => (
                                        <div key={msg.id} className={`group flex flex-col gap-1 animate-slide-in relative ${msg.isBot ? 'bg-neon-red/5 p-2 rounded-xl border border-neon-red/10 overflow-hidden' : msg.isHighlighted ? 'bg-amber-500/5 p-3 rounded-xl border border-amber-500/20' : ''}`}>
                                            <div className="flex gap-3 relative">
                                                <div className={`w-8 h-8 rounded-full border border-white/10 shrink-0 flex items-center justify-center bg-white/5`}>
                                                    <div className="text-[10px] font-black text-gray-500">{msg.user[0]}</div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className={`text-[10px] font-black uppercase italic ${msg.color || 'text-white'}`}>{msg.user}</span>
                                                        {msg.role === 'admin' && <ShieldCheck className="w-3 h-3 text-neon-purple" />}
                                                    </div>
                                                    <p className="text-xs text-gray-400 leading-relaxed font-bold break-all">{msg.text}</p>
                                                </div>
                                                {isMod && (
                                                    <div className="absolute right-0 top-0 hidden group-hover:flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-lg border border-white/10 z-20">
                                                        <button onClick={() => setPinnedMessage(msg)} className="p-1.5 text-gray-500 hover:text-neon-red transition-all"><Pin className="w-3 h-3" /></button>
                                                        <button onClick={() => deleteMessage(msg.id)} className="p-1.5 text-gray-500 hover:text-red-500 transition-all"><X className="w-3 h-3" /></button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            ) : activeChatTab === 'shazam' ? (
                                <motion.div key="shazam-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    <button
                                        onClick={handleShazamAction}
                                        disabled={shazamStatus !== 'idle'}
                                        className={`w-full py-12 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col items-center justify-center gap-6 relative overflow-hidden group ${shazamStatus === 'listening' ? 'border-neon-cyan bg-neon-cyan/5' :
                                            shazamStatus === 'processing' ? 'border-neon-purple bg-neon-purple/5' :
                                                shazamStatus === 'found' ? 'border-green-500 bg-green-500/5' :
                                                    'border-white/10 bg-white/5 hover:border-neon-cyan/50 hover:bg-neon-cyan/5'
                                            }`}
                                    >
                                        {shazamStatus === 'listening' && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="absolute w-32 h-32 bg-neon-cyan/20 rounded-full animate-ping" />
                                            </div>
                                        )}
                                        <div className={`w-24 h-24 rounded-full flex items-center justify-center relative z-10 transition-all duration-500 ${shazamStatus === 'listening' ? 'bg-neon-cyan' : shazamStatus === 'processing' ? 'bg-neon-purple animate-bounce' : shazamStatus === 'found' ? 'bg-green-500' : 'bg-white/10'}`}>
                                            <Music className={`w-10 h-10 ${shazamStatus !== 'idle' ? 'text-white' : 'text-gray-400'}`} />
                                        </div>
                                        <div className="text-center relative z-10">
                                            <h3 className="text-sm font-black uppercase text-white">
                                                {shazamStatus === 'listening' ? 'Écoute...' : shazamStatus === 'processing' ? 'Identification...' : shazamStatus === 'found' ? lastFoundTrack?.artist : 'Shazam'}
                                            </h3>
                                        </div>
                                    </button>

                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Historique</h3>
                                        <div className="space-y-2">
                                            {shazamHistory.map((track) => (
                                                <div key={track.id} className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                                                    <img src={track.image} className="w-10 h-10 rounded-lg object-cover" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-black text-white truncate uppercase">{track.artist}</p>
                                                        <p className="text-[9px] text-gray-400 truncate uppercase">{track.title}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : activeChatTab === 'drops' ? (
                                <motion.div key="drops-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                    <div className="p-8 bg-neon-red/10 border border-neon-red/20 rounded-[2rem] text-center">
                                        <Zap className="w-12 h-12 text-neon-red mx-auto mb-4" />
                                        <h3 className="text-4xl font-display font-black text-white italic mb-2">{drops}</h3>
                                        <p className="text-[10px] font-black text-neon-red uppercase tracking-widest">DROPS ACCUMULÉS</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="planning-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                    {lineupData.length > 0 ? lineupData.map((item, i) => (
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
                        <div className="p-4 bg-[#080808] border-t border-white/10 space-y-3">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setIsHighlightChecked(!isHighlightChecked)} className={`p-2 rounded-lg transition-all ${isHighlightChecked ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-500'}`}>
                                        <Star className="w-5 h-5" />
                                    </button>
                                    <div className="flex-1 flex items-center gap-2 p-1 bg-black/40 border border-white/10 rounded-xl">
                                        <input className="flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none" placeholder="Message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
                                        <button onClick={handleSendMessage} className="p-2 bg-neon-red text-white rounded-lg"><Send className="w-4 h-4" /></button>
                                    </div>
                                </div>
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
