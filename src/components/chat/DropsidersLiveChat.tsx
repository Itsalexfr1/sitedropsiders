import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
    Send, Shield, Crown, Sparkles, Flame, Volume2, VolumeX, 
    Pin, Trash2, Clock, Ban, BarChart2, Smile, Settings, 
    ExternalLink, X, Check, Radio, Award, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Client, Databases, ID, Query } from 'appwrite';

// ==========================================
// TYPES & ROLES
// ==========================================
export type ChatUserRole = 'admin' | 'mod' | 'artist' | 'vip' | 'user';

export interface ChatMessageItem {
    id: string;
    pseudo: string;
    message: string;
    time: string;
    role: ChatUserRole;
    color?: string;
    avatar?: string;
    country?: string;
    isPinned?: boolean;
    isHighlighted?: boolean;
    reactions?: Record<string, number>;
}

export interface LivePoll {
    id: string;
    question: string;
    options: { text: string; votes: number }[];
    totalVotes: number;
    createdBy: string;
}

interface DropsidersLiveChatProps {
    channelName?: string;
    onClose?: () => void;
    isPopout?: boolean;
    accentColor?: string;
}

const QUICK_EMOTES = ['🔥', '⚡', '🎧', '🔊', '🚀', '🖤', '🪩', '🎪', '🙌', '💣'];

const ROLE_CONFIG: Record<ChatUserRole, {
    label: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    icon: typeof Shield;
    glow: string;
}> = {
    admin: {
        label: 'STAFF',
        badgeBg: 'bg-red-500/20',
        badgeBorder: 'border-red-500/50',
        badgeText: 'text-red-400',
        icon: Crown,
        glow: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]'
    },
    mod: {
        label: 'MODO',
        badgeBg: 'bg-emerald-500/20',
        badgeBorder: 'border-emerald-500/50',
        badgeText: 'text-emerald-400',
        icon: Shield,
        glow: 'shadow-[0_0_12px_rgba(16,185,129,0.4)]'
    },
    artist: {
        label: 'DJ OFFICIEL',
        badgeBg: 'bg-purple-500/25',
        badgeBorder: 'border-purple-400/60',
        badgeText: 'text-purple-300',
        icon: Award,
        glow: 'shadow-[0_0_15px_rgba(192,132,252,0.5)]'
    },
    vip: {
        label: 'VIP',
        badgeBg: 'bg-amber-500/20',
        badgeBorder: 'border-amber-400/60',
        badgeText: 'text-amber-300',
        icon: Sparkles,
        glow: 'shadow-[0_0_12px_rgba(251,191,36,0.35)]'
    },
    user: {
        label: 'FAN',
        badgeBg: 'bg-white/5',
        badgeBorder: 'border-white/10',
        badgeText: 'text-gray-400',
        icon: Radio,
        glow: ''
    }
};

const SECRET_CODES: Record<string, { role: ChatUserRole; title: string }> = {
    'alex': { role: 'admin', title: 'Fondateur Dropsiders' },
    'staff-dropsiders': { role: 'admin', title: 'Staff Dropsiders' },
    'modo-dropsiders': { role: 'mod', title: 'Modérateur Officiel' },
    'dj-artist-2026': { role: 'artist', title: 'Artiste Invité' },
    'vip-dropsiders': { role: 'vip', title: 'Membre VIP' }
};

const INITIAL_MESSAGES: ChatMessageItem[] = [
    {
        id: 'welcome-1',
        pseudo: 'Dropsiders_Bot',
        message: 'Bienvenue sur le Chat Live Dropsiders ! Partagez vos réactions en direct, votez pour les meilleurs sons et profitez du live ! 🎧🔥',
        time: 'LIVE',
        role: 'admin',
        color: '#ff0033',
        country: 'FR',
        isPinned: true
    },
    {
        id: 'welcome-2',
        pseudo: 'Alex_Dropsiders',
        message: 'Bienvenue à tous sur le direct ! Chat officiel 100% indépendant et actif 24/7.',
        time: 'LIVE',
        role: 'admin',
        color: '#ff3700',
        country: 'FR'
    }
];

export const DropsidersLiveChat: React.FC<DropsidersLiveChatProps> = ({
    channelName = 'Dropsiders TV',
    onClose,
    isPopout = false,
    accentColor = '#ff3700'
}) => {
    // Appwrite Client setup (fail-safe)
    const client = useMemo(() => {
        try {
            return new Client()
                .setEndpoint('https://fra.cloud.appwrite.io/v1')
                .setProject('69adc19b0027cb3b46d4');
        } catch {
            return null;
        }
    }, []);

    const databases = useMemo(() => client ? new Databases(client) : null, [client]);
    const DATABASE_ID = 'live_chat';
    const COLLECTION_CHAT = 'live_messages';

    // BroadcastChannel pour synchro multi-onglets / popout
    const broadcastRef = useRef<BroadcastChannel | null>(null);

    // Profile state
    const [myPseudo, setMyPseudo] = useState<string>(() => localStorage.getItem('chat_pseudo') || `Fan_${Math.floor(100 + Math.random() * 900)}`);
    const [myRole, setMyRole] = useState<ChatUserRole>(() => {
        const saved = localStorage.getItem('chat_role');
        const isAdmin = localStorage.getItem('admin_auth_v2') === 'true';
        if (isAdmin) return 'admin';
        if (saved && ['admin', 'mod', 'artist', 'vip', 'user'].includes(saved)) return saved as ChatUserRole;
        return 'user';
    });
    const [myCountry, setMyCountry] = useState<string>(() => localStorage.getItem('chat_country') || 'FR');
    const [myColor, setMyColor] = useState<string>(() => localStorage.getItem('chat_color') || '#00e5ff');

    // UI & chat states
    const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
        try {
            const saved = localStorage.getItem('dropsiders_chat_cache');
            if (saved) return JSON.parse(saved);
        } catch { }
        return INITIAL_MESSAGES;
    });
    const [inputMessage, setInputMessage] = useState('');
    const [pinnedMessage, setPinnedMessage] = useState<ChatMessageItem | null>(() => messages.find(m => m.isPinned) || null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [passcode, setPasscode] = useState('');
    const [passcodeSuccess, setPasscodeSuccess] = useState<string | null>(null);
    const [passcodeError, setPasscodeError] = useState<string | null>(null);

    // Moderation & interactive states
    const [slowModeSeconds, setSlowModeSeconds] = useState<number>(() => Number(localStorage.getItem('chat_slow_mode') || 0));
    const [slowModeCooldown, setSlowModeCooldown] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [hypeCount, setHypeCount] = useState<number>(42);
    const [isHypeActive, setIsHypeActive] = useState(false);
    const [activePoll, setActivePoll] = useState<LivePoll | null>(null);
    const [userVotedPollId, setUserVotedPollId] = useState<string | null>(null);
    const [showPollCreator, setShowPollCreator] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isModOrAdmin = myRole === 'admin' || myRole === 'mod';

    // Auto-scroll to bottom
    const scrollToBottom = useCallback((smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }, []);

    useEffect(() => {
        scrollToBottom(false);
    }, []);

    // BroadcastChannel initialization
    useEffect(() => {
        try {
            const bc = new BroadcastChannel('dropsiders_native_chat_v1');
            broadcastRef.current = bc;
            bc.onmessage = (event) => {
                const data = event.data;
                if (!data || !data.type) return;

                if (data.type === 'NEW_MESSAGE' && data.message) {
                    setMessages(prev => {
                        if (prev.some(m => m.id === data.message.id)) return prev;
                        const updated = [...prev, data.message].slice(-150);
                        try { localStorage.setItem('dropsiders_chat_cache', JSON.stringify(updated)); } catch { }
                        return updated;
                    });
                    if (data.message.isPinned) setPinnedMessage(data.message);
                } else if (data.type === 'DELETE_MESSAGE') {
                    setMessages(prev => prev.filter(m => m.id !== data.id));
                } else if (data.type === 'PIN_MESSAGE') {
                    setPinnedMessage(data.message);
                } else if (data.type === 'UNPIN_MESSAGE') {
                    setPinnedMessage(null);
                } else if (data.type === 'HYPE_BOOST') {
                    setHypeCount(prev => prev + 1);
                } else if (data.type === 'POLL_UPDATE') {
                    setActivePoll(data.poll);
                } else if (data.type === 'SLOW_MODE') {
                    setSlowModeSeconds(data.seconds);
                }
            };
            return () => bc.close();
        } catch { }
    }, []);

    // Appwrite Realtime Subscription
    useEffect(() => {
        if (!client) return;
        try {
            const unsubscribe = client.subscribe(
                `databases.${DATABASE_ID}.collections.${COLLECTION_CHAT}.documents`,
                (response: any) => {
                    if (response.events.includes('databases.*.collections.*.documents.*.create')) {
                        const payload = response.payload;
                        let role = (payload.role as ChatUserRole) || 'user';
                        let cleanMsg = payload.message || '';
                        if (cleanMsg.startsWith('[ROLE:')) {
                            const parts = cleanMsg.split(']:');
                            const roleTag = parts[0].replace('[ROLE:', '');
                            if (['admin', 'mod', 'artist', 'vip', 'user'].includes(roleTag)) {
                                role = roleTag as ChatUserRole;
                            }
                            cleanMsg = parts.slice(1).join(']:');
                        }

                        const newMsg: ChatMessageItem = {
                            id: payload.$id,
                            pseudo: payload.pseudo || 'Anonyme',
                            message: cleanMsg,
                            time: payload.time || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                            role: role,
                            color: payload.color || '#ffffff',
                            country: payload.country || 'FR',
                            isPinned: payload.isPinned || false,
                            isHighlighted: role === 'artist' || role === 'admin'
                        };
                        setMessages(prev => {
                            if (prev.some(m => m.id === newMsg.id)) return prev;
                            const updated = [...prev, newMsg].slice(-150);
                            try { localStorage.setItem('dropsiders_chat_cache', JSON.stringify(updated)); } catch { }
                            return updated;
                        });
                        if (newMsg.isPinned) setPinnedMessage(newMsg);
                    } else if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
                        const delId = response.payload.$id;
                        setMessages(prev => prev.filter(m => m.id !== delId));
                    }
                }
            );
            return () => unsubscribe();
        } catch { }
    }, [client]);

    // Slow mode timer
    useEffect(() => {
        if (slowModeCooldown > 0) {
            const t = setTimeout(() => setSlowModeCooldown(c => c - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [slowModeCooldown]);

    // Send Message
    const handleSendMessage = async (customText?: string) => {
        const text = (customText || inputMessage).trim();
        if (!text) return;
        if (isMuted) {
            alert("Vous avez été temporairement mis en sourdine par la modération.");
            return;
        }
        if (slowModeCooldown > 0 && !isModOrAdmin && myRole !== 'artist' && myRole !== 'vip') {
            return;
        }

        const newMsg: ChatMessageItem = {
            id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
            pseudo: myPseudo,
            message: text,
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            role: myRole,
            color: myColor,
            country: myCountry,
            isHighlighted: myRole === 'artist' || myRole === 'admin'
        };

        // Local state update
        setMessages(prev => {
            const updated = [...prev, newMsg].slice(-150);
            try { localStorage.setItem('dropsiders_chat_cache', JSON.stringify(updated)); } catch { }
            return updated;
        });
        setInputMessage('');

        // Apply slowmode cooldown
        if (slowModeSeconds > 0 && !isModOrAdmin && myRole !== 'artist' && myRole !== 'vip') {
            setSlowModeCooldown(slowModeSeconds);
        }

        // Broadcast to other tabs / popouts
        broadcastRef.current?.postMessage({ type: 'NEW_MESSAGE', message: newMsg });

        // Save to Appwrite if available
        if (databases) {
            try {
                await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                    pseudo: newMsg.pseudo,
                    message: newMsg.role !== 'user' ? `[ROLE:${newMsg.role}]:${newMsg.message}` : newMsg.message,
                    time: newMsg.time,
                    color: newMsg.color || '#ffffff',
                    country: newMsg.country || 'FR'
                });
            } catch (err) {
                console.warn("[LiveChat] Appwrite send error (fallback local):", err);
            }
        }

        setTimeout(() => scrollToBottom(true), 50);
    };

    // Hype Boost Button
    const triggerHypeBoost = () => {
        setHypeCount(prev => prev + 1);
        setIsHypeActive(true);
        setTimeout(() => setIsHypeActive(false), 2000);

        broadcastRef.current?.postMessage({ type: 'HYPE_BOOST' });

        try {
            confetti({
                particleCount: 35,
                spread: 70,
                origin: { y: 0.85, x: 0.8 },
                colors: ['#ff0033', '#ff3700', '#9146FF', '#00e5ff', '#ffd700']
            });
        } catch { }
    };

    // Moderation: Delete message
    const handleDeleteMessage = async (id: string) => {
        if (!isModOrAdmin) return;
        setMessages(prev => prev.filter(m => m.id !== id));
        broadcastRef.current?.postMessage({ type: 'DELETE_MESSAGE', id });
        if (databases) {
            try { await databases.deleteDocument(DATABASE_ID, COLLECTION_CHAT, id); } catch { }
        }
    };

    // Moderation: Pin message
    const handlePinMessage = (msg: ChatMessageItem) => {
        if (!isModOrAdmin) return;
        setPinnedMessage(msg);
        broadcastRef.current?.postMessage({ type: 'PIN_MESSAGE', message: msg });
    };

    const handleUnpinMessage = () => {
        if (!isModOrAdmin) return;
        setPinnedMessage(null);
        broadcastRef.current?.postMessage({ type: 'UNPIN_MESSAGE' });
    };

    // Moderation: Timeout
    const handleTimeoutUser = (pseudo: string) => {
        if (!isModOrAdmin) return;
        handleSendMessage(`[MODÉRATION] ⏱️ @${pseudo} a été mis en sourdine pour 5 minutes.`);
    };

    // Popout Window
    const handleOpenPopout = () => {
        const w = 420;
        const h = 720;
        const left = window.screen.width - w - 40;
        const top = 60;
        window.open(
            '/live-chat-popout',
            'DropsidersLiveChatPopout',
            `width=${w},height=${h},top=${top},left=${left},scrollbars=no,resizable=yes`
        );
    };

    // Passcode validation
    const handleApplyPasscode = (e: React.FormEvent) => {
        e.preventDefault();
        setPasscodeSuccess(null);
        setPasscodeError(null);

        const clean = passcode.trim().toLowerCase();
        if (SECRET_CODES[clean]) {
            const data = SECRET_CODES[clean];
            setMyRole(data.role);
            localStorage.setItem('chat_role', data.role);
            setPasscodeSuccess(`Rôle activé : ${ROLE_CONFIG[data.role].label} (${data.title})`);
            setPasscode('');
        } else {
            setPasscodeError("Code secret invalide.");
        }
    };

    return (
        <div className={`w-full h-full flex flex-col bg-[#0b0c10] border-l border-white/10 text-white select-none ${isPopout ? 'fixed inset-0' : 'relative'}`}>
            
            {/* ==================================================== */}
            {/* 1. CHAT HEADER */}
            {/* ==================================================== */}
            <header className="h-14 px-3.5 border-b border-white/10 flex items-center justify-between bg-black/90 shrink-0 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-neon-red/20 border border-neon-red/40 flex items-center justify-center text-neon-red shadow-[0_0_15px_rgba(255,0,51,0.3)]">
                        <Flame className="w-4 h-4 text-neon-red animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="text-white text-xs font-black uppercase tracking-wider">Chat Live Dropsiders</span>
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" title="Connecté en direct" />
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">
                            {channelName} • <span className="text-neon-cyan font-bold">100% Dropsiders</span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {/* Profil / Rôle */}
                    <button
                        onClick={() => setIsProfileModalOpen(true)}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-gray-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                        title="Configurer mon profil, mon rôle (Modo, DJ, VIP) et mes couleurs"
                    >
                        <Settings className="w-3.5 h-3.5 text-neon-cyan" />
                        <span className="hidden sm:inline font-mono text-[9px] uppercase">{ROLE_CONFIG[myRole].label}</span>
                    </button>

                    {/* Popout */}
                    {!isPopout && (
                        <button
                            onClick={handleOpenPopout}
                            className="p-2 rounded-lg text-gray-400 hover:text-neon-cyan hover:bg-white/10 transition-colors cursor-pointer"
                            title="Détacher le chat dans une fenêtre volante (Popout)"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    )}

                    {/* Fermer */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Masquer le chat (C)"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </header>

            {/* ==================================================== */}
            {/* 2. MESSAGE ÉPINGLÉ (PINNED MESSAGE) */}
            {/* ==================================================== */}
            {pinnedMessage && (
                <div className="px-3 py-2 bg-gradient-to-r from-neon-red/20 via-purple-900/20 to-black/80 border-b border-neon-red/30 flex items-start justify-between gap-2 text-xs shrink-0 animate-in fade-in duration-300">
                    <div className="flex items-start gap-2 overflow-hidden">
                        <Pin className="w-3.5 h-3.5 text-neon-red shrink-0 mt-0.5" />
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] font-black uppercase text-neon-red flex items-center gap-1">
                                Message Épinglé • {pinnedMessage.pseudo}
                            </span>
                            <p className="text-gray-200 text-[11px] truncate">{pinnedMessage.message}</p>
                        </div>
                    </div>
                    {isModOrAdmin && (
                        <button
                            onClick={handleUnpinMessage}
                            className="text-gray-400 hover:text-white text-[10px] font-bold p-1 cursor-pointer"
                            title="Désépingler ce message"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            )}

            {/* ==================================================== */}
            {/* 3. SONDAGE EN DIRECT (LIVE POLL) */}
            {/* ==================================================== */}
            {activePoll && (
                <div className="p-3 bg-black/60 border-b border-white/10 space-y-2 shrink-0">
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="font-black text-neon-cyan uppercase flex items-center gap-1.5">
                            <BarChart2 className="w-3.5 h-3.5" />
                            Sondage Live
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">{activePoll.totalVotes} votes</span>
                    </div>
                    <p className="text-xs font-bold text-white">{activePoll.question}</p>
                    <div className="space-y-1.5">
                        {activePoll.options.map((opt, idx) => {
                            const pct = activePoll.totalVotes > 0 ? Math.round((opt.votes / activePoll.totalVotes) * 100) : 0;
                            return (
                                <button
                                    key={idx}
                                    disabled={userVotedPollId === activePoll.id}
                                    onClick={() => {
                                        setActivePoll(prev => {
                                            if (!prev) return null;
                                            const next = { ...prev };
                                            next.options[idx].votes += 1;
                                            next.totalVotes += 1;
                                            broadcastRef.current?.postMessage({ type: 'POLL_UPDATE', poll: next });
                                            return next;
                                        });
                                        setUserVotedPollId(activePoll.id);
                                    }}
                                    className="w-full relative overflow-hidden p-2 rounded-lg bg-white/5 border border-white/10 hover:border-neon-cyan/50 text-left transition-all cursor-pointer group"
                                >
                                    <div
                                        className="absolute inset-y-0 left-0 bg-neon-cyan/20 transition-all duration-500"
                                        style={{ width: `${pct}%` }}
                                    />
                                    <div className="relative flex items-center justify-between text-xs z-10">
                                        <span className="font-semibold text-gray-200 group-hover:text-white">{opt.text}</span>
                                        <span className="font-mono text-[10px] text-neon-cyan font-bold">{pct}%</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ==================================================== */}
            {/* 4. FLUX DE MESSAGES */}
            {/* ==================================================== */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.map((msg) => {
                    const roleCfg = ROLE_CONFIG[msg.role || 'user'];
                    const RoleIcon = roleCfg.icon;
                    const isArtist = msg.role === 'artist';

                    return (
                        <div
                            key={msg.id}
                            className={`group relative p-2 rounded-xl transition-all ${
                                isArtist 
                                    ? 'bg-purple-950/20 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                                    : 'hover:bg-white/[0.04]'
                            }`}
                        >
                            <div className="flex items-start gap-2">
                                {/* Drapeau pays */}
                                {msg.country && (
                                    <span className="text-xs shrink-0 select-none opacity-80" title={`Pays : ${msg.country}`}>
                                        {msg.country === 'FR' ? '🇫🇷' : msg.country === 'BE' ? '🇧🇪' : msg.country === 'NL' ? '🇳🇱' : msg.country === 'US' ? '🇺🇸' : '🌍'}
                                    </span>
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {/* Badge de rôle */}
                                        {msg.role !== 'user' && (
                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${roleCfg.badgeBg} ${roleCfg.badgeBorder} ${roleCfg.badgeText} ${roleCfg.glow}`}>
                                                <RoleIcon className="w-2.5 h-2.5" />
                                                <span>{roleCfg.label}</span>
                                            </span>
                                        )}

                                        {/* Pseudo */}
                                        <span
                                            className="font-bold text-xs truncate"
                                            style={{ color: msg.color || '#00e5ff' }}
                                        >
                                            {msg.pseudo}
                                        </span>

                                        {/* Heure */}
                                        <span className="text-[9px] font-mono text-gray-500 ml-auto shrink-0">
                                            {msg.time}
                                        </span>
                                    </div>

                                    {/* Texte du message */}
                                    <p className={`text-xs mt-1 break-words leading-relaxed ${isArtist ? 'text-purple-100 font-semibold' : 'text-gray-200'}`}>
                                        {msg.message}
                                    </p>
                                </div>

                                {/* Menu d'actions modérateur */}
                                {isModOrAdmin && (
                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-black/80 border border-white/10 rounded-lg p-0.5 transition-opacity shrink-0">
                                        <button
                                            onClick={() => handlePinMessage(msg)}
                                            className="p-1 text-gray-400 hover:text-neon-cyan rounded"
                                            title="Épingler"
                                        >
                                            <Pin className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => handleTimeoutUser(msg.pseudo)}
                                            className="p-1 text-gray-400 hover:text-amber-400 rounded"
                                            title="Timeout 5min"
                                        >
                                            <Clock className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteMessage(msg.id)}
                                            className="p-1 text-gray-400 hover:text-red-400 rounded"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* ==================================================== */}
            {/* 5. BARRE D'ÉMOTES RAPIDES & HYPE DROP */}
            {/* ==================================================== */}
            <div className="px-3 py-1.5 border-t border-white/5 bg-black/60 flex items-center justify-between gap-1 shrink-0">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                    {QUICK_EMOTES.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => handleSendMessage(emoji)}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-sm flex items-center justify-center transition-transform hover:scale-115 active:scale-95 cursor-pointer shrink-0"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>

                {/* Bouton Hype Drop */}
                <button
                    type="button"
                    onClick={triggerHypeBoost}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer shadow-md ${
                        isHypeActive 
                            ? 'bg-neon-red text-white scale-105 shadow-[0_0_20px_rgba(255,0,51,0.6)]' 
                            : 'bg-neon-red/20 border border-neon-red/40 text-neon-red hover:bg-neon-red/30'
                    }`}
                    title="Envoyer une explosion Hype sur le live !"
                >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Hype ({hypeCount})</span>
                </button>
            </div>

            {/* ==================================================== */}
            {/* 6. INPUT DE SAISIE */}
            {/* ==================================================== */}
            <div className="p-3 border-t border-white/10 bg-[#0e0e14] shrink-0">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                >
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder={
                                slowModeCooldown > 0 
                                    ? `Mode ralenti actif : attendez ${slowModeCooldown}s...` 
                                    : `Discuter en tant que ${myPseudo}...`
                            }
                            disabled={slowModeCooldown > 0 && !isModOrAdmin && myRole !== 'artist' && myRole !== 'vip'}
                            className="w-full bg-white/5 border border-white/10 focus:border-neon-cyan/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all disabled:opacity-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!inputMessage.trim() || (slowModeCooldown > 0 && !isModOrAdmin && myRole !== 'artist' && myRole !== 'vip')}
                        className="p-2.5 bg-neon-cyan hover:bg-neon-cyan/80 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-black transition-all cursor-pointer font-bold shrink-0"
                        title="Envoyer le message"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>

                {/* Footer Info */}
                <div className="mt-2 flex items-center justify-between text-[9px] text-gray-500">
                    <span className="flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Chat souverain Dropsiders
                    </span>
                    <button
                        onClick={() => setIsProfileModalOpen(true)}
                        className="hover:text-neon-cyan transition-colors uppercase font-bold cursor-pointer"
                    >
                        Changer de pseudo
                    </button>
                </div>
            </div>

            {/* ==================================================== */}
            {/* 7. MODAL CONFIGURATION DU PROFIL & RÔLES */}
            {/* ==================================================== */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-[#12131a] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/50">
                            <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4 text-neon-cyan" />
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">Mon Profil & Rôle Chat</h3>
                            </div>
                            <button
                                onClick={() => setIsProfileModalOpen(false)}
                                className="p-1 rounded-lg text-gray-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
                            {/* Pseudo */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-400">Pseudo dans le Chat</label>
                                <input
                                    type="text"
                                    value={myPseudo}
                                    onChange={(e) => {
                                        setMyPseudo(e.target.value);
                                        localStorage.setItem('chat_pseudo', e.target.value);
                                    }}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-neon-cyan"
                                />
                            </div>

                            {/* Couleur du Pseudo */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-400">Couleur du Pseudo</label>
                                <div className="flex items-center gap-2">
                                    {['#00e5ff', '#ff0033', '#9146FF', '#ffd700', '#00ff66', '#ff00ea', '#ffffff'].map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => {
                                                setMyColor(c);
                                                localStorage.setItem('chat_color', c);
                                            }}
                                            className={`w-7 h-7 rounded-full border-2 transition-transform ${myColor === c ? 'scale-120 border-white shadow-lg' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Pays */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-400">Drapeau Pays</label>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {[
                                        { code: 'FR', label: '🇫🇷 France' },
                                        { code: 'BE', label: '🇧🇪 Belgique' },
                                        { code: 'NL', label: '🇳🇱 Pays-Bas' },
                                        { code: 'US', label: '🇺🇸 USA' },
                                        { code: 'GB', label: '🇬🇧 UK' }
                                    ].map((c) => (
                                        <button
                                            key={c.code}
                                            type="button"
                                            onClick={() => {
                                                setMyCountry(c.code);
                                                localStorage.setItem('chat_country', c.code);
                                            }}
                                            className={`py-1.5 px-2 rounded-lg text-xs border transition-all ${myCountry === c.code ? 'bg-white/20 border-white text-white font-bold' : 'bg-white/5 border-white/5 text-gray-400'}`}
                                        >
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Débloquer un Rôle (Modo, DJ, VIP) */}
                            <div className="pt-3 border-t border-white/10 space-y-2">
                                <label className="text-[10px] font-black uppercase text-neon-cyan flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5" />
                                    Activer un Rôle (Modo / DJ Vérifié / VIP)
                                </label>
                                <p className="text-[10px] text-gray-400">
                                    Entrez votre code secret officiel pour débloquer votre badge spécial et vos privilèges de modération.
                                </p>
                                <form onSubmit={handleApplyPasscode} className="flex gap-2">
                                    <input
                                        type="password"
                                        placeholder="Code secret rôle..."
                                        value={passcode}
                                        onChange={(e) => setPasscode(e.target.value)}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-neon-cyan"
                                    />
                                    <button
                                        type="submit"
                                        className="px-3 py-2 bg-neon-cyan text-black font-black text-xs uppercase rounded-xl hover:bg-neon-cyan/80 transition-all cursor-pointer"
                                    >
                                        Valider
                                    </button>
                                </form>
                                {passcodeSuccess && (
                                    <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                        <Check className="w-3 h-3" /> {passcodeSuccess}
                                    </p>
                                )}
                                {passcodeError && (
                                    <p className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {passcodeError}
                                    </p>
                                )}
                            </div>

                            {/* Options Modération (si Modo/Admin) */}
                            {isModOrAdmin && (
                                <div className="pt-3 border-t border-white/10 space-y-2.5">
                                    <span className="text-[10px] font-black uppercase text-amber-400">Outils de Modération</span>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-300">Mode Ralenti (Slow Mode)</span>
                                        <select
                                            value={slowModeSeconds}
                                            onChange={(e) => {
                                                const s = Number(e.target.value);
                                                setSlowModeSeconds(s);
                                                localStorage.setItem('chat_slow_mode', String(s));
                                                broadcastRef.current?.postMessage({ type: 'SLOW_MODE', seconds: s });
                                            }}
                                            className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-xs text-white outline-none"
                                        >
                                            <option value={0}>Désactivé</option>
                                            <option value={3}>3 secondes</option>
                                            <option value={5}>5 secondes</option>
                                            <option value={10}>10 secondes</option>
                                            <option value={30}>30 secondes</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end">
                            <button
                                onClick={() => setIsProfileModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase transition-all cursor-pointer"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
