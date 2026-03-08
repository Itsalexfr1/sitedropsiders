import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Settings, Users, MessageSquare, Send, Zap, Video,
    Save, AlertCircle, Music, Trash2, Plus,
    Pin, Star, ShieldCheck, Ban
} from 'lucide-react';
import { Client, Databases, ID, Query } from 'appwrite';
import { FlagIcon } from '../components/ui/FlagIcon';

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
    highlightPrice?: number;
    lots?: any[];
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

    // Appwrite Config
    const client = new Client()
        .setEndpoint('https://fra.cloud.appwrite.io/v1')
        .setProject('69adc19b0027cb3b46d4');
    const databases = new Databases(client);
    const DATABASE_ID = 'live_chat';
    const COLLECTION_CHAT = 'live_messages';
    const COLLECTION_BANS = 'bans';

    const isAdmin = localStorage.getItem('admin_auth') === 'true';
    const [userRole] = useState<'admin' | 'mod' | 'user'>(isAdmin ? 'admin' : 'user');
    const isMod = userRole === 'admin' || userRole === 'mod';
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [viewersCount] = useState(Math.floor(Math.random() * 50) + 10);
    const [activeChatTab, setActiveChatTab] = useState('chat');
    const [newMessage, setNewMessage] = useState('');
    const [isHighlightChecked, setIsHighlightChecked] = useState(false);
    const [highlightColor, setHighlightColor] = useState('#f59e0b');
    const [isConnected, setIsConnected] = useState(!!localStorage.getItem('chat_pseudo'));

    // Form States
    const [loginPseudo, setLoginPseudo] = useState('');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginCountry, setLoginCountry] = useState('FR');
    const [subscribeNewsletter, setSubscribeNewsletter] = useState(true);

    const countryOptions = [
        { code: 'FR', name: 'France' },
        { code: 'BE', name: 'Belgique' },
        { code: 'CH', name: 'Suisse' },
        { code: 'CA', name: 'Canada' },
        { code: 'ES', name: 'Espagne' },
        { code: 'PT', name: 'Portugal' },
        { code: 'IT', name: 'Italie' },
        { code: 'DE', name: 'Allemagne' },
        { code: 'GB', name: 'UK' },
        { code: 'US', name: 'USA' },
        { code: 'MA', name: 'Maroc' },
        { code: 'DZ', name: 'Algérie' },
        { code: 'TN', name: 'Tunisie' }
    ];

    const [pinnedMessage, setPinnedMessage] = useState<any>(null);

    const [shazamStatus, setShazamStatus] = useState<'idle' | 'listening' | 'processing' | 'found'>('idle');
    const [shazamHistory, setShazamHistory] = useState<ShazamTrack[]>(() => {
        const saved = localStorage.getItem('shazam_history');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('shazam_history', JSON.stringify(shazamHistory));
    }, [shazamHistory]);

    // Chat State
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [userCountry, setUserCountry] = useState('FR');
    const [isBanned, setIsBanned] = useState(false);

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
        activeStreamId: initialSettings?.activeStreamId || '',
        highlightPrice: initialSettings?.highlightPrice || 100,
        lots: initialSettings?.lots || []
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
    const [editHighlightPrice, setEditHighlightPrice] = useState(settings.highlightPrice || 100);
    const [editAuddToken, setEditAuddToken] = useState(settings.auddToken || '');
    const [adminActiveTab, setAdminActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);

    const clearShazamHistory = async () => {
        if (!confirm('Voulez-vous vraiment vider l\'historique Shazam ?')) return;
        try {
            await fetch('/api/shazam/history', { method: 'DELETE' });
            setShazamHistory([]);
            localStorage.removeItem('shazam_history');
            showNotification('Historique Shazam vidé !', 'success');
        } catch (e) {
            showNotification('Erreur nettoyage history', 'error');
        }
    };

    const [dropsLots, setDropsLots] = useState<any[]>(settings.lots || []);
    const [botCommands, setBotCommands] = useState([
        { command: "!insta", response: "Suivez-nous sur @dropsiders.eu !" },
        { command: "!lineup", response: "La lineup est disponible dans l'onglet PLANNING." }
    ]);

    // Admin Form States
    const [newLot, setNewLot] = useState({ name: '', price: '', stock: '' });
    const [newCmd, setNewCmd] = useState({ command: '', response: '' });
    const [lineupItems, setLineupItems] = useState<LineupItem[]>(() => {
        try {
            return JSON.parse(settings.lineup || '[]');
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

    const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({
        show: false, message: '', type: 'success'
    });

    useEffect(() => {
        const init = async () => {
            fetchSettings();
            fetchInitialMessages();

            const savedPseudo = localStorage.getItem('chat_pseudo');
            const savedEmail = localStorage.getItem('chat_email');
            const savedCountry = localStorage.getItem('chat_country');

            if (savedPseudo) {
                setIsConnected(true);
                setLoginPseudo(savedPseudo);
                if (savedEmail) setLoginEmail(savedEmail);
                if (savedCountry) {
                    setLoginCountry(savedCountry);
                    setUserCountry(savedCountry);
                }
            } else if (isMod) {
                // Auto-connect admins/mods with defaults
                const defaultPseudo = "ALEX_FR1";
                localStorage.setItem('chat_pseudo', defaultPseudo);
                localStorage.setItem('chat_email', 'admin@dropsiders.fr');
                localStorage.setItem('chat_country', 'FR');
                setLoginPseudo(defaultPseudo);
                setLoginEmail('admin@dropsiders.fr');
                setLoginCountry('FR');
                setUserCountry('FR');
                setIsConnected(true);
            }

            if (!savedCountry && !isMod) fetchUserCountry();
            checkBanStatus();
        };
        init();

        // Appwrite Realtime Subscription
        const unsubscribe = client.subscribe(
            `databases.${DATABASE_ID}.collections.${COLLECTION_CHAT}.documents`,
            (response: any) => {
                if (response.events.includes('databases.*.collections.*.documents.*.create')) {
                    setChatMessages(prev => {
                        if (prev.find(m => m.id === response.payload.$id)) return prev;
                        return [...prev, {
                            id: response.payload.$id,
                            pseudo: response.payload.pseudo,
                            message: response.payload.message,
                            color: response.payload.color,
                            time: response.payload.time,
                            country: response.payload.country,
                            bgColor: response.payload.bgColor
                        }];
                    });
                }
                if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
                    setChatMessages(prev => prev.filter(m => m.id !== response.payload.$id));
                }
            }
        );

        return () => unsubscribe();
    }, []);

    const fetchUserCountry = async () => {
        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            if (data.country_code) setUserCountry(data.country_code);
        } catch (e) { console.error("Could not fetch country", e); }
    };

    const checkBanStatus = async () => {
        const pseudo = localStorage.getItem('chat_pseudo');
        if (!pseudo) return;
        try {
            const res = await databases.listDocuments(DATABASE_ID, COLLECTION_BANS, [
                Query.equal('pseudo', pseudo)
            ]);
            if (res.documents.length > 0) setIsBanned(true);
        } catch (e) { console.error("Ban check failed", e); }
    };

    const fetchInitialMessages = async () => {
        try {
            const res = await databases.listDocuments(DATABASE_ID, COLLECTION_CHAT, [
                Query.orderDesc('$createdAt'),
                Query.limit(50)
            ]);
            const msgs = res.documents.reverse().map(doc => ({
                id: doc.$id,
                pseudo: doc.pseudo,
                message: doc.message,
                color: doc.color,
                time: doc.time,
                country: doc.country,
                bgColor: doc.bgColor
            }));
            setChatMessages(msgs);
        } catch (e) { console.error("Error fetching initial chat messages:", e); }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/takeover-settings');
            if (res.ok) {
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
                        const parsed = JSON.parse(data.lineup || '[]');
                        setLineupItems(Array.isArray(parsed) ? parsed : []);
                    } catch (e) { setLineupItems([]); }
                    if (data.lots) setDropsLots(data.lots);
                    if (data.highlightPrice) setEditHighlightPrice(data.highlightPrice);
                    if (data.auddToken) setEditAuddToken(data.auddToken);
                }
            }
        } catch (e) { console.error("Error loading settings:", e); }
    };

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginPseudo.trim() || !loginEmail.trim()) {
            showNotification('Veuillez remplir tous les champs', 'error');
            return;
        }

        localStorage.setItem('chat_pseudo', loginPseudo.trim());
        localStorage.setItem('chat_email', loginEmail.trim());
        localStorage.setItem('chat_country', loginCountry);

        setUserCountry(loginCountry);
        setIsConnected(true);

        if (subscribeNewsletter) {
            try {
                await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: loginEmail, firstName: loginPseudo })
                });
            } catch (e) { console.error("Newsletter sub failed", e); }
        }

        showNotification('Connexion réussie !', 'success');
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
            activeStreamId: editActiveStreamId,
            highlightPrice: Number(editHighlightPrice),
            lots: dropsLots,
            auddToken: editAuddToken
        };

        try {
            const saveRes = await fetch('/api/takeover-settings', {
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

    const handleSendMessage = async () => {
        if (!newMessage.trim() || isBanned) return;

        const pseudo = localStorage.getItem('chat_pseudo') || (isMod ? "ALEX_FR1" : "VISITEUR");
        const messageText = newMessage;
        const color = isMod ? "text-neon-red" : "text-neon-cyan";
        const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        setNewMessage('');
        setIsHighlightChecked(false);

        try {
            await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                pseudo,
                message: messageText,
                color,
                time,
                country: userCountry,
                bgColor: isHighlightChecked ? highlightColor : null
            });
        } catch (e: any) {
            console.error("Appwrite send error details:", e);
            showNotification(`Erreur d'envoi: ${e.message || 'Problème serveur'}`, 'error');
        }
    };

    const handleBanUser = async (pseudo: string) => {
        if (!isAdmin) return;
        try {
            await databases.createDocument(DATABASE_ID, COLLECTION_BANS, ID.unique(), { pseudo });
            showNotification(`Utilisateur ${pseudo} banni !`, 'success');
        } catch (e) {
            showNotification('Erreur bannissement', 'error');
        }
    };

    const clearChat = async () => {
        if (!isAdmin) return;
        if (!confirm('Voulez-vous vraiment vider le chat ?')) return;
        try {
            const res = await databases.listDocuments(DATABASE_ID, COLLECTION_CHAT, [Query.limit(100)]);
            for (const doc of res.documents) {
                await databases.deleteDocument(DATABASE_ID, COLLECTION_CHAT, doc.$id);
            }
            showNotification('Chat vidé !', 'success');
        } catch (e) {
            showNotification('Erreur nettoyage', 'error');
        }
    };

    const deleteMessage = async (id: string) => {
        if (!isMod) return;
        try {
            await databases.deleteDocument(DATABASE_ID, COLLECTION_CHAT, id);
        } catch (e) {
            showNotification('Erreur suppression', 'error');
        }
    };

    const handleShazamAction = async () => {
        try {
            setShazamStatus('listening');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks: Blob[] = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                setShazamStatus('processing');
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const formData = new FormData();
                formData.append('audio', audioBlob, 'shazam.wav');

                try {
                    const res = await fetch('/api/shazam/identify', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await res.json();
                    if (data.status === 'success') {
                        const track: ShazamTrack = {
                            id: Date.now(),
                            artist: data.metadata.artist,
                            title: data.metadata.title,
                            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                            image: data.metadata.image || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=cover"
                        };
                        setShazamHistory(prev => [track, ...prev.slice(0, 19)]);
                        setShazamStatus('found');
                        setTimeout(() => setShazamStatus('idle'), 3000);

                        // Enregistrer dans l'historique serveur
                        fetch('/api/shazam/history', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...data.metadata, user: 'Alex' })
                        });
                    } else {
                        showNotification(data.error || 'Non identifié', 'error');
                        setShazamStatus('idle');
                    }
                } catch (e) {
                    showNotification('Erreur identification', 'error');
                    setShazamStatus('idle');
                } finally {
                    stream.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorder.start();
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, 6000); // 6 secondes d'écoute
        } catch (err) {
            console.error(err);
            showNotification('Erreur: Micro non accessible', 'error');
            setShazamStatus('idle');
        }
    };

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
            <div className="h-10 lg:h-16 border-b border-white/5 flex items-center justify-between px-4 lg:px-6 bg-black/40 backdrop-blur-md relative z-40">
                <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded-md">
                                <span className="w-1 h-1 bg-red-600 rounded-full animate-pulse" />
                                <span className="text-[7px] lg:text-[9px] font-black text-red-500 uppercase tracking-tighter">LIVE</span>
                            </div>
                            <h1 className="text-sm lg:text-xl font-display font-black text-white italic tracking-tighter leading-none">{settings.title}</h1>
                        </div>
                        <div className="flex items-center gap-1.5 lg:gap-2">
                            <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_8px_#00ffff]" />
                            <span className="text-[7px] lg:text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none">NOW &gt;&gt;</span>
                            <span className="text-[8px] lg:text-[10px] font-black text-white uppercase italic tracking-tighter truncate max-w-[120px] lg:max-w-none">{fluxCurrentArtist.artist}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            if (isMod) {
                                setShowAdminPanel(true);
                                setAdminActiveTab('moderation');
                            }
                        }}
                        className={`flex items-center gap-2 lg:gap-4 px-2 lg:px-4 py-1.5 lg:py-2 bg-white/5 border border-white/10 rounded-xl transition-all ${isMod ? 'hover:bg-white/10 cursor-pointer' : ''}`}
                    >
                        <div className="flex items-center gap-1.5 lg:gap-2">
                            <Users className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-neon-cyan" />
                            <span className="text-[11px] lg:text-xs font-black text-white">{settings.status === 'off' ? 0 : viewersCount}</span>
                        </div>
                    </button>
                    {isMod && (
                        <button onClick={() => setShowAdminPanel(!showAdminPanel)} className={`p-2 lg:p-3 rounded-xl transition-all border ${showAdminPanel ? 'bg-neon-purple border-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.4)] text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
                            <Settings className="w-4 h-4 lg:w-5 lg:h-5" />
                        </button>
                    )}
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-full transition-all">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* 3. MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                {/* A. VIDEO PANEL (40% Mobile / 60% Desktop) */}
                <div className="w-full lg:w-[60%] h-[40%] lg:h-full bg-black lg:border-r border-b lg:border-b-0 border-white/10 relative flex flex-col shrink-0 overflow-hidden">
                    {/* Always render the video behind to allow blur effect */}
                    <div className="absolute inset-0 z-0">
                        <iframe className="w-full h-full border-none" src={`https://www.youtube.com/embed/${settings.youtubeId || 'dQw4w9WgXcQ'}?autoplay=1&mute=0&rel=0&modestbranding=1`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />

                    </div>

                    <AnimatePresence>
                        {showAdminPanel && (
                            <motion.div
                                key="admin-panel"
                                initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                                animate={{ opacity: 1, backdropFilter: 'blur(16px)' }}
                                exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                                className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl p-8 overflow-y-auto custom-scrollbar"
                            >
                                <div className="max-w-3xl mx-auto space-y-10">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-6">
                                        <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">Configuration <span className="text-neon-purple">Studio</span></h2>
                                        <div className="flex gap-2">
                                            {['GENERAL', 'PLANNING', 'SHAZAM', 'DROPS', 'BOT', 'MODERATION'].map(t => (
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

                                    <div className="min-h-[400px]">
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
                                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widestStatut de la diffusion">Statut de la diffusion</label>
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
                                        ) : adminActiveTab === 'shazam' ? (
                                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-neon-purple/20 rounded-2xl flex items-center justify-center">
                                                            <Music className="w-6 h-6 text-neon-purple" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">Configuration Shazam</h3>
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase">Gérez la reconnaissance musicale et l'historique</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                                        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex items-center justify-between">
                                                            <div>
                                                                <p className="text-xs font-black text-white uppercase mb-1">Vider l'historique</p>
                                                                <p className="text-[9px] text-gray-400 font-bold uppercase">Supprime tous les morceaux identifiés du site</p>
                                                            </div>
                                                            <button
                                                                onClick={clearShazamHistory}
                                                                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg shadow-red-600/20"
                                                            >
                                                                Vider Shazam
                                                            </button>
                                                        </div>

                                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">AudD API Token</label>
                                                            <input
                                                                type="password"
                                                                placeholder="VOTRE TOKEN AUDD.IO"
                                                                value={editAuddToken}
                                                                onChange={e => setEditAuddToken(e.target.value)}
                                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-neon-purple outline-none transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : adminActiveTab === 'planning' ? (
                                            <div className="space-y-10">
                                                <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Plus className="w-6 h-6 text-neon-cyan" />
                                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Ajouter une session</h3>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                        <input type="text" placeholder="JOUR" value={newLineupItem.day} onChange={e => setNewLineupItem({ ...newLineupItem, day: e.target.value.toUpperCase() })} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                                        <input type="text" placeholder="ARTISTE" value={newLineupItem.artist} onChange={e => setNewLineupItem({ ...newLineupItem, artist: e.target.value.toUpperCase() })} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                                        <input type="text" placeholder="DEBUT" value={newLineupItem.startTime} onChange={e => setNewLineupItem({ ...newLineupItem, startTime: e.target.value })} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                                        <input type="text" placeholder="FIN" value={newLineupItem.endTime} onChange={e => setNewLineupItem({ ...newLineupItem, endTime: e.target.value })} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                                        <input type="text" placeholder="SCÈNE" value={newLineupItem.stage} onChange={e => setNewLineupItem({ ...newLineupItem, stage: e.target.value.toUpperCase() })} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                                        <input type="text" placeholder="INSTAGRAM" value={newLineupItem.instagram} onChange={e => setNewLineupItem({ ...newLineupItem, instagram: e.target.value })} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                                    </div>
                                                    <button onClick={() => { if (newLineupItem.artist) { setLineupItems([...lineupItems, { ...newLineupItem, id: Date.now().toString() }]); setNewLineupItem({ id: '', day: '', startTime: '', endTime: '', artist: '', stage: '', instagram: '' }); } }} className="w-full py-4 bg-neon-cyan text-black font-black uppercase rounded-2xl hover:bg-neon-cyan/80 transition-all">Ajouter</button>
                                                </div>

                                                <div className="space-y-4">
                                                    {lineupItems.map((item, i) => (
                                                        <div key={item.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className="text-gray-500 font-mono text-xs">{item.startTime}</div>
                                                                <div>
                                                                    <p className="text-white font-black uppercase text-sm">{item.artist}</p>
                                                                    <p className="text-[10px] text-neon-cyan font-bold uppercase">{item.stage}</p>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => setLineupItems(lineupItems.filter((_, idx) => idx !== i))} className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : adminActiveTab === 'drops' ? (
                                            <div className="space-y-8">
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div className="space-y-4">
                                                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Nouveau Lot</h3>
                                                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                                                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest pl-1">Prix Message Couleur (Drops)</label>
                                                            <input type="number" placeholder="PRIX HIGHLIGHT" value={editHighlightPrice} onChange={e => setEditHighlightPrice(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-neon-red outline-none" />
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase leading-tight italic">C'est le prix que les utilisateurs paieront pour envoyer un message avec fond personnalisé.</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Nouveau Lot Boutique</h3>
                                                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                                                            <input type="text" placeholder="NOM DU LOT" value={newLot.name} onChange={e => setNewLot({ ...newLot, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                                                            <input type="number" placeholder="PRIX EN DROPS" value={newLot.price} onChange={e => setNewLot({ ...newLot, price: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                                                            <button onClick={() => { if (newLot.name) { setDropsLots([...dropsLots, { id: Date.now(), name: newLot.name, price: Number(newLot.price), stock: 10 }]); setNewLot({ name: '', price: '', stock: '' }); } }} className="w-full py-3 bg-neon-red text-white font-black rounded-xl hover:bg-neon-red/80 transition-all">Ajouter à la boutique</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : adminActiveTab === 'bot' ? (
                                            <div className="space-y-8">
                                                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                                                    <input type="text" placeholder="!COMMANDE" value={newCmd.command} onChange={e => setNewCmd({ ...newCmd, command: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                                                    <textarea placeholder="REPONSE" value={newCmd.response} onChange={e => setNewCmd({ ...newCmd, response: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white min-h-[80px]" />
                                                    <button onClick={() => { if (newCmd.command) { setBotCommands([...botCommands, { command: newCmd.command, response: newCmd.response }]); setNewCmd({ command: '', response: '' }); } }} className="w-full py-3 bg-neon-cyan text-black font-black rounded-xl">Enregistrer</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-8">
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div className="p-8 bg-red-600/5 border border-red-600/20 rounded-[2.5rem] text-center space-y-4">
                                                        <Trash2 className="w-8 h-8 text-red-500 mx-auto" />
                                                        <h4 className="text-white font-black uppercase">Nettoyage Chat</h4>
                                                        <button onClick={clearChat} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase">Vider le Chat</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-4 pt-6 border-t border-white/10">
                                        <button onClick={handleSaveSettings} disabled={isSaving} className="flex-1 py-4 bg-neon-purple text-white font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-neon-purple/80 transition-all shadow-xl shadow-neon-purple/20 flex items-center justify-center gap-3 disabled:opacity-50">
                                            <Save className={`w-5 h-5 ${isSaving ? 'animate-spin' : ''}`} />
                                            {isSaving ? 'ENREGISTREMENT...' : 'SAUVEGARDER'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* B. CHAT PANEL (60% Mobile / 40% Desktop) */}
                <div className="flex-1 lg:flex-1 h-[60%] lg:h-full bg-[#080808] flex flex-col relative z-10 lg:border-l border-white/10 shadow-2xl overflow-hidden max-w-full">
                    <div className="p-2 lg:p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-2 lg:gap-3">
                            <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-lg bg-neon-red/10 border border-neon-red/20 flex items-center justify-center text-neon-red">
                                <MessageSquare className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                            </div>
                            <h2 className="text-[10px] lg:text-xs font-black uppercase italic tracking-tighter text-white">LIVE INTERACTIF</h2>
                        </div>
                    </div>

                    {isConnected && (
                        <div className="flex gap-1 p-1 lg:p-2 bg-black/20 border-b border-white/10">
                            {['CHAT', 'PLANNING', 'SHAZAM', 'BOUTIQUE'].map(tab => (
                                <button key={tab} onClick={() => setActiveChatTab(tab === 'BOUTIQUE' ? 'drops' : tab.toLowerCase())} className={`px-2 lg:px-4 py-1.5 lg:py-2 rounded-lg text-[8px] lg:text-[9px] font-black uppercase tracking-widest transition-all ${activeChatTab === (tab === 'BOUTIQUE' ? 'drops' : tab.toLowerCase()) ? 'bg-white/10 text-white border border-white/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>{tab}</button>
                            ))}
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
                        <AnimatePresence mode="wait">
                            {!isConnected ? (
                                <motion.div
                                    key="login-view"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full flex flex-col items-center justify-center p-6 space-y-8 bg-black/40 backdrop-blur-sm rounded-3xl"
                                >
                                    <div className="text-center space-y-2">
                                        <div className="w-16 h-16 bg-neon-red/10 border border-neon-red/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Users className="w-8 h-8 text-neon-red" />
                                        </div>
                                        <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">Rejoindre le chat</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">Entrez vos infos pour interagir en live</p>
                                    </div>

                                    <form onSubmit={handleConnect} className="w-full space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Pseudo</label>
                                            <input
                                                type="text"
                                                required
                                                value={loginPseudo}
                                                onChange={e => setLoginPseudo(e.target.value)}
                                                placeholder="TON PSEUDO"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-neon-red outline-none transition-all uppercase font-bold"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Email</label>
                                            <input
                                                type="email"
                                                required
                                                value={loginEmail}
                                                onChange={e => setLoginEmail(e.target.value)}
                                                placeholder="TON@EMAIL.COM"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-neon-red outline-none transition-all uppercase font-bold"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Pays</label>
                                            <div className="relative">
                                                <select
                                                    value={loginCountry}
                                                    onChange={e => setLoginCountry(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-neon-red outline-none transition-all appearance-none font-bold uppercase"
                                                >
                                                    {countryOptions.map(c => (
                                                        <option key={c.code} value={c.code} className="bg-[#080808] text-white">
                                                            {c.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <FlagIcon location={loginCountry} className="w-4 h-3" />
                                                </div>
                                            </div>
                                        </div>

                                        <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all group">
                                            <input
                                                type="checkbox"
                                                checked={subscribeNewsletter}
                                                onChange={e => setSubscribeNewsletter(e.target.checked)}
                                                className="w-4 h-4 rounded border-white/10 bg-black/40 text-neon-red focus:ring-neon-red"
                                            />
                                            <span className="text-[9px] text-gray-400 font-bold uppercase group-hover:text-white transition-colors">S'abonner à la newsletter et aux alertes live</span>
                                        </label>

                                        <button type="submit" className="w-full py-4 bg-neon-red text-white font-black uppercase italic tracking-widest rounded-2xl hover:shadow-[0_0_25px_rgba(255,0,51,0.4)] transition-all transform active:scale-95 shadow-xl">
                                            C'est parti !
                                        </button>
                                    </form>
                                </motion.div>
                            ) : activeChatTab === 'chat' ? (
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
                                        <div key={msg.id} className="group flex flex-col gap-1 relative p-2 rounded-xl transition-all" style={msg.bgColor ? { backgroundColor: `${msg.bgColor}15`, border: `1px solid ${msg.bgColor}30` } : {}}>
                                            <div className="flex gap-3 relative">
                                                <div className="w-8 h-8 rounded-full border border-white/10 shrink-0 flex items-center justify-center bg-white/5">
                                                    <div className="text-[10px] font-black text-gray-500">{(msg.pseudo || msg.user || 'V')[0]}</div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        {msg.country && <FlagIcon location={msg.country} className="w-3 h-2" />}
                                                        <span className={`text-[10px] font-black uppercase italic ${msg.color || 'text-white'}`}>{msg.pseudo || msg.user}</span>
                                                        {(msg.role === 'admin' || msg.pseudo === 'ALEX_FR1') && <ShieldCheck className="w-3 h-3 text-neon-purple" />}
                                                        {msg.time && <span className="text-[8px] text-gray-600 font-mono ml-auto">{msg.time}</span>}
                                                    </div>
                                                    <p className="text-xs text-gray-400 leading-relaxed font-bold break-all">{msg.message || msg.text}</p>
                                                </div>
                                                {isMod && (
                                                    <div className="absolute right-0 top-0 hidden group-hover:flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-lg border border-white/10 z-20 shadow-2xl">
                                                        <button onClick={() => setPinnedMessage(msg)} title="Épingler" className="p-1.5 text-gray-400 hover:text-neon-cyan transition-all"><Pin className="w-3 h-3" /></button>
                                                        <button onClick={() => deleteMessage(msg.id)} title="Supprimer" className="p-1.5 text-gray-400 hover:text-red-500 transition-all"><X className="w-3 h-3" /></button>
                                                        {isAdmin && msg.pseudo !== 'ALEX_FR1' && (
                                                            <button onClick={() => handleBanUser(msg.pseudo)} title="Bannir" className="p-1.5 text-gray-400 hover:text-orange-500 transition-all border-l border-white/10 ml-1"><Ban className="w-3 h-3" /></button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            ) : activeChatTab === 'shazam' ? (
                                <motion.div key="shazam-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    <button onClick={handleShazamAction} disabled={shazamStatus !== 'idle'} className={`w-full py-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${shazamStatus === 'idle' ? 'border-white/20 hover:border-neon-purple/50 bg-white/5' : 'border-neon-purple/50 bg-neon-purple/5'}`}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${shazamStatus !== 'idle' ? 'bg-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.5)]' : 'bg-white/10'}`}>
                                            <Music className={`w-6 h-6 ${shazamStatus !== 'idle' ? 'animate-pulse text-white' : 'text-gray-500'}`} />
                                        </div>
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">{shazamStatus === 'idle' ? 'Identifier le morceau' : shazamStatus === 'listening' ? 'Écoute en cours...' : 'Recherche...'}</p>
                                    </button>
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Historique</h3>
                                        {shazamHistory.map(track => (
                                            <div key={track.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4 group">
                                                <img
                                                    src={track.image}
                                                    onError={(e) => e.currentTarget.src = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=cover"}
                                                    className="w-12 h-12 rounded-lg shrink-0 object-cover"
                                                    alt=""
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-white uppercase truncate">{track.title}</p>
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase truncate">{track.artist}</p>
                                                </div>
                                                <div className="text-[9px] font-mono text-gray-600">{track.time}</div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : activeChatTab === 'planning' ? (
                                <motion.div key="planning-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                    {lineupItems.map(item => {
                                        const now = new Date();
                                        const [h, m] = (item.startTime || "00:00").split(':').map(Number);
                                        const [eh, em] = (item.endTime || "00:00").split(':').map(Number);
                                        const start = new Date(); start.setHours(h, m, 0);
                                        const end = new Date(); end.setHours(eh, em, 0);
                                        const isNow = now >= start && now <= end;
                                        const progress = isNow ? Math.min(100, Math.max(0, ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100)) : 0;

                                        return (
                                            <div key={item.id} className={`p-4 border rounded-2xl space-y-3 transition-all ${isNow ? 'bg-neon-cyan/5 border-neon-cyan/30 shadow-[0_0_20px_rgba(0,255,255,0.05)]' : 'bg-white/5 border-white/10'}`}>
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[10px] font-black uppercase ${isNow ? 'text-neon-cyan' : 'text-gray-500'}`}>{item.stage}</span>
                                                    <span className="text-[10px] font-mono text-gray-500">{item.startTime} - {item.endTime}</span>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-lg font-display font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                                                        {isNow && <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />}
                                                        {item.artist}
                                                    </p>
                                                    {isNow && (
                                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-2">
                                                            <div
                                                                className="h-full bg-neon-cyan shadow-[0_0_10px_#00ffff] transition-all duration-1000"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            ) : activeChatTab === 'drops' ? (
                                <motion.div key="drops-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-center py-10 px-6">
                                    <Star className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-bounce" />
                                    <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">Boutique Drops</h3>
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-8">Obtenez des récompenses avec vos drops !</p>
                                    <div className="grid grid-cols-1 gap-4">
                                        <button
                                            onClick={() => {
                                                setActiveChatTab('chat');
                                                setIsHighlightChecked(true);
                                                showNotification("Activez l'éclair dans le chat pour choisir votre couleur !", 'success');
                                            }}
                                            className="p-6 bg-amber-500/10 border-2 border-amber-500/40 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-amber-500/20 transition-all border-dashed relative overflow-hidden group"
                                        >
                                            <div className="absolute top-2 right-4">
                                                <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
                                            </div>
                                            <p className="text-xs font-black text-white uppercase tracking-widest">MESSAGE EN COULEUR 🌈</p>
                                            <div className="px-4 py-1.5 bg-amber-500 text-black text-[10px] font-black rounded-lg uppercase">{settings.highlightPrice || 100} DROPS</div>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase">Ton message avec le fond de ton choix !</p>
                                        </button>
                                        {dropsLots.map(lot => (
                                            <button key={lot.id} className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-white/10 transition-all border-dashed border-2">
                                                <p className="text-xs font-black text-white uppercase">{lot.name}</p>
                                                <div className="px-4 py-1.5 bg-amber-500 text-black text-[10px] font-black rounded-lg uppercase">{lot.price} DROPS</div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>

                    {isConnected && (
                        <div className="p-4 bg-black/40 border-t border-white/5 space-y-3">
                            {isHighlightChecked && (
                                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg transition-all border" style={{ backgroundColor: `${highlightColor}20`, borderColor: `${highlightColor}40` }}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black uppercase" style={{ color: highlightColor }}>Mise en avant</span>
                                        <input type="color" value={highlightColor} onChange={(e) => setHighlightColor(e.target.value)} className="w-5 h-4 bg-transparent border-none outline-none cursor-pointer p-0" />
                                    </div>
                                    <span className="text-[10px] font-black" style={{ color: highlightColor }}>{settings.highlightPrice || 100} DROPS</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 group focus-within:border-neon-red/50 transition-all">
                                <input
                                    type="text"
                                    value={isBanned ? "VOUS ÊTES BANNI" : newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    disabled={isBanned}
                                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                    placeholder={isBanned ? "ACCÈS REFUSÉ..." : "VOTRE MESSAGE..."}
                                    className={`flex-1 bg-transparent text-xs font-bold outline-none uppercase tracking-wider ${isBanned ? 'text-red-500' : 'text-white placeholder:text-gray-600'}`}
                                />
                                <button onClick={() => setIsHighlightChecked(!isHighlightChecked)} className={`p-2 rounded-lg transition-all ${isHighlightChecked ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                                    <Zap className="w-4 h-4" />
                                </button>
                                <button onClick={handleSendMessage} className="p-2 bg-neon-red text-white rounded-xl shadow-[0_0_15px_rgba(255,0,51,0.3)] hover:scale-105 active:scale-95 transition-all">
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-1.5">
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                    <span className="text-[10px] font-black text-white">{2450} <span className="text-gray-600 ml-0.5 uppercase">DROPS</span></span>
                                </div>
                                <span className="text-[8px] text-gray-700 font-bold uppercase tracking-widest">Powered by Dropsiders</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Notification Toast */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200]">
                        <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                            {toast.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
