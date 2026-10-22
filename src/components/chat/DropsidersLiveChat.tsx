import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
    Send, Shield, Crown, Sparkles, Flame,
    Pin, Trash2, Clock, BarChart2, Settings, 
    ExternalLink, X, Check, Radio, Award, Gift,
    Plus, MessageSquare, Database,
    Trophy, Bell, AlertCircle, RefreshCw, Key
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
    getFirebaseDb, 
    getFirebaseRtdb,
    getFirebaseConfig, 
    saveFirebaseConfig, 
    clearFirebaseConfig,
    isFirebaseConfigured,
    testFirebaseConnection,
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    deleteDoc,
    doc,
    setDoc,
    serverTimestamp,
    ref,
    push,
    set,
    remove,
    onValue,
    rtdbQuery,
    rtdbLimitToLast,
    type FirebaseChatConfig
} from '../../lib/firebase';

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
    endsAt?: number;
}

export interface ChatReward {
    id: string;
    title: string;
    cost: number;
    icon: string;
    description: string;
    actionType: 'highlight' | 'tts' | 'vip_pass' | 'track_request' | 'contest_entry' | 'custom';
    isCustom?: boolean;
}

export interface LeaderboardEntry {
    pseudo: string;
    drops: number;
    color?: string;
    role: ChatUserRole;
    watchMinutes: number;
}

export interface LoyaltyBadge {
    id: string;
    label: string;
    icon: string;
    minMinutes: number;
    color: string;
}

export interface LiveAlert {
    id: string;
    type: 'follower' | 'sub' | 'resub' | 'gift_sub' | 'raid' | 'donation';
    pseudo: string;
    message?: string;
    amount?: number;
    months?: number;
}

// ==========================================
// CONSTANTS
// ==========================================
const QUICK_EMOTES = ['🔥', '⚡', '🎧', '🔊', '🚀', '🖤', '🪩', '🎪', '🙌', '💣'];

const LOYALTY_BADGES: LoyaltyBadge[] = [
    { id: 'newcomer', label: 'Nouveau',  icon: '🌱', minMinutes: 0,    color: '#6b7280' },
    { id: 'listener', label: 'Auditeur', icon: '🎧', minMinutes: 30,   color: '#22d3ee' },
    { id: 'fan',      label: 'Fan',      icon: '🔥', minMinutes: 120,  color: '#f97316' },
    { id: 'devotee',  label: 'Dévoué',   icon: '⚡', minMinutes: 360,  color: '#a855f7' },
    { id: 'vip_fan',  label: 'VIP Fan',  icon: '💎', minMinutes: 900,  color: '#fbbf24' },
    { id: 'legend',   label: 'Légende',  icon: '🏆', minMinutes: 2700, color: '#ff0033' },
];

const getLoyaltyBadge = (watchMinutes: number): LoyaltyBadge => {
    let badge = LOYALTY_BADGES[0];
    for (const b of LOYALTY_BADGES) {
        if (watchMinutes >= b.minMinutes) badge = b;
    }
    return badge;
};

const ROLE_CONFIG: Record<ChatUserRole, {
    label: string; badgeBg: string; badgeBorder: string; badgeText: string;
    icon: typeof Shield; glow: string;
}> = {
    admin:  { label: 'STAFF',      badgeBg: 'bg-red-500/20',     badgeBorder: 'border-red-500/50',     badgeText: 'text-red-400',    icon: Crown,    glow: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]' },
    mod:    { label: 'MODO',       badgeBg: 'bg-emerald-500/20', badgeBorder: 'border-emerald-500/50', badgeText: 'text-emerald-400',icon: Shield,   glow: 'shadow-[0_0_12px_rgba(16,185,129,0.4)]' },
    artist: { label: 'DJ OFFICIEL',badgeBg: 'bg-purple-500/25',  badgeBorder: 'border-purple-400/60',  badgeText: 'text-purple-300', icon: Award,    glow: 'shadow-[0_0_15px_rgba(192,132,252,0.5)]' },
    vip:    { label: 'VIP',        badgeBg: 'bg-amber-500/20',   badgeBorder: 'border-amber-400/60',   badgeText: 'text-amber-300',  icon: Sparkles, glow: 'shadow-[0_0_12px_rgba(251,191,36,0.35)]' },
    user:   { label: 'FAN',        badgeBg: 'bg-white/5',        badgeBorder: 'border-white/10',       badgeText: 'text-gray-400',   icon: Radio,    glow: '' },
};

const DEFAULT_REWARDS: ChatReward[] = [
    { id: 'reward-highlight', title: 'Message Surligné Néon',    cost: 50,  icon: '🌟', description: 'Votre prochain message apparaît avec une lueur dorée.', actionType: 'highlight' },
    { id: 'reward-tts',       title: 'Message Vocal TTS',        cost: 150, icon: '🗣️', description: 'Votre message est lu à haute voix sur le live.',        actionType: 'tts' },
    { id: 'reward-track',     title: 'Demande de Son / ID',      cost: 200, icon: '🎵', description: 'Proposez un track aux DJs en direct.',                  actionType: 'track_request' },
    { id: 'reward-vip',       title: 'Pass VIP 24H',             cost: 400, icon: '💎', description: 'Badge VIP, pseudo doré, contourne le Slow Mode 24h.',   actionType: 'vip_pass' },
    { id: 'reward-ticket',    title: 'Ticket Concours Festival', cost: 500, icon: '🎟️', description: '1 entrée pour le tirage au sort festival officiel.',    actionType: 'contest_entry' },
];

const INITIAL_MESSAGES: ChatMessageItem[] = [
    { id: 'welcome-1', pseudo: 'Dropsiders_Bot',   message: 'Bienvenue sur le Chat Live Dropsiders ! Regardez le live pour gagner des Drops et débloquer des récompenses exclusives ! 🎧🎁', time: 'LIVE', role: 'admin', color: '#ff0033', country: 'FR', isPinned: true },
    { id: 'welcome-2', pseudo: 'Alex_Dropsiders',  message: 'Bienvenue à tous sur la TV ! Chat officiel 100% indépendant et actif 24/7.', time: 'LIVE', role: 'admin', color: '#ff3700', country: 'FR' },
];

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
    { pseudo: 'Alex_Dropsiders', drops: 2850, color: '#ff3700', role: 'admin',  watchMinutes: 3100 },
    { pseudo: 'NeonRaver_DJ',    drops: 1620, color: '#9146FF', role: 'artist', watchMinutes: 980  },
    { pseudo: 'TechnoFan94',     drops: 1200, color: '#00e5ff', role: 'vip',    watchMinutes: 740  },
    { pseudo: 'SubwooferQueen',  drops: 890,  color: '#f97316', role: 'user',   watchMinutes: 480  },
    { pseudo: 'DropHunter',      drops: 650,  color: '#22d3ee', role: 'user',   watchMinutes: 310  },
    { pseudo: 'BassBomber',      drops: 440,  color: '#fbbf24', role: 'user',   watchMinutes: 210  },
    { pseudo: 'AudioNerd',       drops: 290,  color: '#a78bfa', role: 'user',   watchMinutes: 130  },
    { pseudo: 'ClubKnight',      drops: 170,  color: '#34d399', role: 'user',   watchMinutes: 80   },
];

interface DropsidersLiveChatProps {
    channelName?: string;
    onClose?: () => void;
    isPopout?: boolean;
    accentColor?: string;
}

// ==========================================
// COMPONENT
// ==========================================
export const DropsidersLiveChat: React.FC<DropsidersLiveChatProps> = ({
    channelName = 'Dropsiders TV',
    onClose,
    isPopout = false,
}) => {
    const broadcastRef = useRef<BroadcastChannel | null>(null);

    // Profile
    const [myPseudo, setMyPseudo] = useState<string>(() => localStorage.getItem('chat_pseudo') || `Fan_${Math.floor(100 + Math.random() * 900)}`);
    const [myCountry, setMyCountry] = useState<string>(() => localStorage.getItem('chat_country') || 'FR');
    const [myColor, setMyColor] = useState<string>(() => localStorage.getItem('chat_color') || '#00e5ff');

    const [assignedRoles, setAssignedRoles] = useState<Record<string, ChatUserRole>>(() => {
        try { const s = localStorage.getItem('dropsiders_assigned_roles'); if (s) return JSON.parse(s); } catch { }
        return { 'alex': 'admin', 'alex_fr1': 'admin', 'alex_dropsiders': 'admin', 'itsalexfr1': 'admin', 'dropsiders_bot': 'admin' };
    });

    const isLocalAdminAuth = localStorage.getItem('admin_auth_v2') === 'true';
    const cleanCurrentPseudo = myPseudo.trim().toLowerCase();
    const myComputedRole: ChatUserRole = useMemo(() => {
        if (isLocalAdminAuth || ['alex','alex_fr1','alex_dropsiders'].includes(cleanCurrentPseudo)) return 'admin';
        return assignedRoles[cleanCurrentPseudo] || 'user';
    }, [isLocalAdminAuth, cleanCurrentPseudo, assignedRoles]);
    const isModOrAdmin = myComputedRole === 'admin' || myComputedRole === 'mod';

    // Drops & Watch
    const [userDrops, setUserDrops] = useState<number>(() => Number(localStorage.getItem('user_drops')) || 50);
    const [watchSeconds, setWatchSeconds] = useState<number>(0);
    const [totalWatchMinutes, setTotalWatchMinutes] = useState<number>(() => Number(localStorage.getItem('watch_minutes_total')) || 0);
    const [dropsNotification, setDropsNotification] = useState<string | null>(null);
    const [badgeUnlockNotif, setBadgeUnlockNotif] = useState<LoyaltyBadge | null>(null);
    const prevBadgeTier = useRef<string>(getLoyaltyBadge(Number(localStorage.getItem('watch_minutes_total')) || 0).id);
    const myLoyaltyBadge = useMemo(() => getLoyaltyBadge(totalWatchMinutes), [totalWatchMinutes]);

    // Rewards
    const [rewards, setRewards] = useState<ChatReward[]>(() => {
        try { const s = localStorage.getItem('dropsiders_chat_rewards'); if (s) return JSON.parse(s); } catch { }
        return DEFAULT_REWARDS;
    });
    const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false);
    const [isAddRewardModalOpen, setIsAddRewardModalOpen] = useState(false);
    const [newRewardTitle, setNewRewardTitle] = useState('');
    const [newRewardCost, setNewRewardCost] = useState<number>(100);
    const [newRewardIcon, setNewRewardIcon] = useState('🎁');
    const [newRewardDesc, setNewRewardDesc] = useState('');
    const [isNextMessageHighlighted, setIsNextMessageHighlighted] = useState(false);

    // Firebase Firestore State
    const [firebaseConfig, setFirebaseConfig] = useState<FirebaseChatConfig | null>(() => getFirebaseConfig());
    const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
    const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState<boolean>(false);
    const [fbFormApiKey, setFbFormApiKey] = useState<string>(() => firebaseConfig?.apiKey || '');
    const [fbFormProjectId, setFbFormProjectId] = useState<string>(() => firebaseConfig?.projectId || '');
    const [fbFormAuthDomain, setFbFormAuthDomain] = useState<string>(() => firebaseConfig?.authDomain || '');
    const [fbFormStorageBucket, setFbFormStorageBucket] = useState<string>(() => firebaseConfig?.storageBucket || '');
    const [fbFormSenderId, setFbFormSenderId] = useState<string>(() => firebaseConfig?.messagingSenderId || '');
    const [fbFormAppId, setFbFormAppId] = useState<string>(() => firebaseConfig?.appId || '');
    const [fbTestStatus, setFbTestStatus] = useState<{ testing: boolean; success?: boolean; message?: string } | null>(null);

    // Role management
    const [isRoleManagementModalOpen, setIsRoleManagementModalOpen] = useState(false);
    const [selectedUserForRole, setSelectedUserForRole] = useState<string | null>(null);

    // Messages
    const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
        try { const s = localStorage.getItem('dropsiders_chat_cache'); if (s) return JSON.parse(s); } catch { }
        return INITIAL_MESSAGES;
    });
    const [inputMessage, setInputMessage] = useState('');
    const [pinnedMessage, setPinnedMessage] = useState<ChatMessageItem | null>(() => messages.find(m => m.isPinned) || null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // Moderation
    const [slowModeSeconds, setSlowModeSeconds] = useState<number>(() => Number(localStorage.getItem('chat_slow_mode') || 0));
    const [slowModeCooldown, setSlowModeCooldown] = useState(0);
    const [isMuted] = useState(false);
    const [hypeCount, setHypeCount] = useState<number>(42);
    const [isHypeActive, setIsHypeActive] = useState(false);

    // ===== LEADERBOARD =====
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
        try { const s = localStorage.getItem('dropsiders_leaderboard'); if (s) return JSON.parse(s); } catch { }
        return DEMO_LEADERBOARD;
    });

    // ===== POLLS =====
    const [activePoll, setActivePoll] = useState<LivePoll | null>(null);
    const [userVotedPollId, setUserVotedPollId] = useState<string | null>(null);
    const [isPollCreatorOpen, setIsPollCreatorOpen] = useState(false);
    const [newPollQuestion, setNewPollQuestion] = useState('');
    const [newPollOptions, setNewPollOptions] = useState(['', '']);
    const [newPollDuration, setNewPollDuration] = useState(60);
    const [pollTimeLeft, setPollTimeLeft] = useState<number>(0);

    // ===== ALERTS OVERLAY =====
    const [currentAlert, setCurrentAlert] = useState<LiveAlert | null>(null);
    const [isMockAlertOpen, setIsMockAlertOpen] = useState(false);
    const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // TABS
    const [activeTab, setActiveTab] = useState<'chat' | 'leaderboard'>('chat');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = useCallback((smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }, []);
    useEffect(() => { scrollToBottom(false); }, []);

    // Alert helper
    const showAlert = useCallback((alert: LiveAlert) => {
        setCurrentAlert(alert);
        if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
        alertTimerRef.current = setTimeout(() => setCurrentAlert(null), 5500);
    }, []);
    useEffect(() => () => { if (alertTimerRef.current) clearTimeout(alertTimerRef.current); }, []);

    // ======================================================
    // WATCHTIME + DROPS + BADGES
    // ======================================================
    useEffect(() => {
        const interval = setInterval(() => {
            setWatchSeconds(prev => {
                const next = prev + 1;
                if (next % 60 === 0) {
                    setTotalWatchMinutes(curr => {
                        const updated = curr + 1;
                        localStorage.setItem('watch_minutes_total', String(updated));
                        const newBadge = getLoyaltyBadge(updated);
                        if (newBadge.id !== prevBadgeTier.current) {
                            prevBadgeTier.current = newBadge.id;
                            setBadgeUnlockNotif(newBadge);
                            setTimeout(() => setBadgeUnlockNotif(null), 6000);
                            try { confetti({ particleCount: 60, spread: 90, origin: { y: 0.7 }, colors: [newBadge.color, '#ffffff', '#ff3700'] }); } catch { }
                        }
                        return updated;
                    });
                }
                if (next >= 180) {
                    const bonus = 10;
                    setUserDrops(curr => {
                        const updated = curr + bonus;
                        localStorage.setItem('user_drops', String(updated));
                        setLeaderboard(lb => {
                            const idx = lb.findIndex(e => e.pseudo.toLowerCase() === cleanCurrentPseudo);
                            let newLb: LeaderboardEntry[];
                            if (idx >= 0) {
                                newLb = lb.map((e, i) => i === idx ? { ...e, drops: e.drops + bonus } : e);
                            } else {
                                newLb = [...lb, { pseudo: myPseudo, drops: updated, color: myColor, role: myComputedRole, watchMinutes: totalWatchMinutes }];
                            }
                            const sorted = [...newLb].sort((a, b) => b.drops - a.drops);
                            try { localStorage.setItem('dropsiders_leaderboard', JSON.stringify(sorted)); } catch { }
                            broadcastRef.current?.postMessage({ type: 'LEADERBOARD_UPDATE', leaderboard: sorted });
                            return sorted;
                        });
                        return updated;
                    });
                    setDropsNotification(`+${bonus} Drops gagnés pour avoir visionné le Live ! 🎁`);
                    setTimeout(() => setDropsNotification(null), 5000);
                    return 0;
                }
                return next;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [cleanCurrentPseudo, myPseudo, myColor, myComputedRole, totalWatchMinutes]);

    // ======================================================
    // POLL TIMER
    // ======================================================
    useEffect(() => {
        if (!activePoll?.endsAt) return;
        const tick = setInterval(() => {
            const left = Math.max(0, Math.floor((activePoll.endsAt! - Date.now()) / 1000));
            setPollTimeLeft(left);
            if (left === 0) clearInterval(tick);
        }, 1000);
        setPollTimeLeft(Math.max(0, Math.floor((activePoll.endsAt - Date.now()) / 1000)));
        return () => clearInterval(tick);
    }, [activePoll?.endsAt]);

    // ======================================================
    // BROADCAST CHANNEL
    // ======================================================
    useEffect(() => {
        try {
            const bc = new BroadcastChannel('dropsiders_native_chat_v1');
            broadcastRef.current = bc;
            bc.onmessage = (event) => {
                const data = event.data;
                if (!data?.type) return;
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
                } else if (data.type === 'PIN_MESSAGE') { setPinnedMessage(data.message); }
                else if (data.type === 'UNPIN_MESSAGE') { setPinnedMessage(null); }
                else if (data.type === 'HYPE_BOOST') { setHypeCount(prev => prev + 1); }
                else if (data.type === 'POLL_UPDATE') { setActivePoll(data.poll); }
                else if (data.type === 'SLOW_MODE') { setSlowModeSeconds(data.seconds); }
                else if (data.type === 'ROLE_ASSIGNED') {
                    setAssignedRoles(prev => {
                        const next = { ...prev, [data.pseudo.toLowerCase()]: data.role };
                        localStorage.setItem('dropsiders_assigned_roles', JSON.stringify(next));
                        return next;
                    });
                } else if (data.type === 'REWARDS_UPDATE') { setRewards(data.rewards); }
                else if (data.type === 'LIVE_ALERT') { showAlert(data.alert); }
                else if (data.type === 'LEADERBOARD_UPDATE') { setLeaderboard(data.leaderboard); }
            };
            return () => bc.close();
        } catch { }
    }, [showAlert]);

    // ======================================================
    // GLOBAL REALTIME CHAT SYNC (Firebase Realtime Database & Firestore)
    // ======================================================
    useEffect(() => {
        const rtdb = getFirebaseRtdb();
        const db = getFirebaseDb();
        let isSubscribed = true;

        if (rtdb) {
            // Mode Firebase Realtime Database (WebSocket haute performance < 30ms)
            try {
                // 1. Écoute instantanée des messages
                const msgQuery = rtdbQuery(ref(rtdb, 'dropsiders_live_messages'), rtdbLimitToLast(120));
                onValue(msgQuery, (snapshot) => {
                    if (!isSubscribed) return;
                    setIsFirebaseConnected(true);
                    const val = snapshot.val();
                    if (val && typeof val === 'object') {
                        const fetched: ChatMessageItem[] = Object.entries(val).map(([id, data]: [string, any]) => {
                            const senderKey = (data.pseudo || '').toLowerCase();
                            const finalRole = assignedRoles[senderKey] || (data.role as ChatUserRole) || 'user';
                            let timeStr = data.time || 'LIVE';
                            if (!data.time && data.timestamp) {
                                timeStr = new Date(data.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                            }
                            return {
                                id,
                                pseudo: data.pseudo || 'Anonyme',
                                message: data.message || '',
                                time: timeStr,
                                role: finalRole,
                                color: data.color || '#00e5ff',
                                country: data.country || 'FR',
                                avatar: data.avatar,
                                isPinned: Boolean(data.isPinned),
                                isHighlighted: Boolean(data.isHighlighted || finalRole === 'admin' || finalRole === 'artist'),
                                reactions: data.reactions
                            };
                        });
                        setMessages(fetched);
                        try { localStorage.setItem('dropsiders_chat_cache', JSON.stringify(fetched)); } catch {}
                    }
                }, (err) => {
                    console.warn('[LiveChat] RTDB onValue error:', err);
                    setIsFirebaseConnected(false);
                });

                // 2. Écoute de l'état global (Message épinglé, Sondage, Rôles, SlowMode)
                const stateRef = ref(rtdb, 'dropsiders_chat_state');
                onValue(stateRef, (snapshot) => {
                    if (!isSubscribed) return;
                    const data = snapshot.val();
                    if (data && typeof data === 'object') {
                        if (data.pinnedMessage !== undefined) setPinnedMessage(data.pinnedMessage);
                        if (data.activePoll !== undefined) setActivePoll(data.activePoll);
                        if (data.slowModeSeconds !== undefined) setSlowModeSeconds(data.slowModeSeconds);
                        if (data.roles && typeof data.roles === 'object') {
                            setAssignedRoles(prev => {
                                const merged = { ...prev, ...data.roles };
                                try { localStorage.setItem('dropsiders_assigned_roles', JSON.stringify(merged)); } catch {}
                                return merged;
                            });
                        }
                    }
                }, (err) => {
                    console.warn('[LiveChat] RTDB state onValue error:', err);
                });
            } catch (err) {
                console.warn('[LiveChat] RTDB init error:', err);
                setIsFirebaseConnected(false);
            }

            return () => {
                isSubscribed = false;
            };
        } else if (db) {
            // Mode Firebase Firestore
            let unsubMessages: (() => void) | null = null;
            let unsubState: (() => void) | null = null;

            try {
                const q = query(
                    collection(db, 'dropsiders_live_messages'),
                    orderBy('timestamp', 'asc'),
                    limit(150)
                );
                unsubMessages = onSnapshot(q, (snapshot) => {
                    if (!isSubscribed) return;
                    setIsFirebaseConnected(true);
                    const fetched: ChatMessageItem[] = [];
                    snapshot.forEach((docSnap) => {
                        const data = docSnap.data();
                        const senderKey = (data.pseudo || '').toLowerCase();
                        const finalRole = assignedRoles[senderKey] || (data.role as ChatUserRole) || 'user';
                        let timeStr = data.time || 'LIVE';
                        if (!data.time && data.timestamp) {
                            timeStr = new Date(data.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                        }
                        fetched.push({
                            id: docSnap.id,
                            pseudo: data.pseudo || 'Anonyme',
                            message: data.message || '',
                            time: timeStr,
                            role: finalRole,
                            color: data.color || '#00e5ff',
                            country: data.country || 'FR',
                            avatar: data.avatar,
                            isPinned: Boolean(data.isPinned),
                            isHighlighted: Boolean(data.isHighlighted || finalRole === 'admin' || finalRole === 'artist'),
                            reactions: data.reactions
                        });
                    });
                    if (fetched.length > 0) {
                        setMessages(fetched);
                        try { localStorage.setItem('dropsiders_chat_cache', JSON.stringify(fetched)); } catch {}
                    }
                }, (err) => {
                    console.warn('[LiveChat] Firestore onSnapshot error:', err);
                    setIsFirebaseConnected(false);
                });

                const stateRef = doc(db, 'dropsiders_chat_state', 'current');
                unsubState = onSnapshot(stateRef, (docSnap) => {
                    if (!isSubscribed) return;
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.pinnedMessage !== undefined) setPinnedMessage(data.pinnedMessage);
                        if (data.activePoll !== undefined) setActivePoll(data.activePoll);
                        if (data.slowModeSeconds !== undefined) setSlowModeSeconds(data.slowModeSeconds);
                        if (data.roles && typeof data.roles === 'object') {
                            setAssignedRoles(prev => {
                                const merged = { ...prev, ...data.roles };
                                try { localStorage.setItem('dropsiders_assigned_roles', JSON.stringify(merged)); } catch {}
                                return merged;
                            });
                        }
                    }
                }, (err) => {
                    console.warn('[LiveChat] Firestore state onSnapshot error:', err);
                });
            } catch (err) {
                console.warn('[LiveChat] Firestore init error:', err);
                setIsFirebaseConnected(false);
            }

            return () => {
                isSubscribed = false;
                if (unsubMessages) unsubMessages();
                if (unsubState) unsubState();
            };
        } else {
            // Mode Fallback (si Firebase n'est pas encore configuré)
            setIsFirebaseConnected(false);
            const fetchChatState = async () => {
                try {
                    const res = await fetch('/api/chat/messages');
                    if (!res.ok) return;
                    const data = await res.json();
                    if (!isSubscribed) return;

                    if (Array.isArray(data.messages)) {
                        setMessages(prev => {
                            const map = new Map<string, ChatMessageItem>();
                            prev.forEach(m => map.set(m.id, m));
                            data.messages.forEach((m: ChatMessageItem) => {
                                const senderKey = (m.pseudo || '').toLowerCase();
                                const finalRole = data.roles?.[senderKey] || m.role || 'user';
                                map.set(m.id, {
                                    ...m,
                                    role: finalRole,
                                    isHighlighted: finalRole === 'artist' || finalRole === 'admin' || m.isHighlighted
                                });
                            });
                            const merged = Array.from(map.values()).slice(-150);
                            try { localStorage.setItem('dropsiders_chat_cache', JSON.stringify(merged)); } catch {}
                            return merged;
                        });
                    }

                    if (data.roles && typeof data.roles === 'object') {
                        setAssignedRoles(prev => {
                            const merged = { ...prev, ...data.roles };
                            try { localStorage.setItem('dropsiders_assigned_roles', JSON.stringify(merged)); } catch {}
                            return merged;
                        });
                    }

                    if (data.pinned !== undefined) setPinnedMessage(data.pinned);
                    if (data.poll !== undefined && data.poll !== null) setActivePoll(data.poll);
                } catch { }
            };

            fetchChatState();
            const interval = setInterval(fetchChatState, 2000);
            return () => {
                isSubscribed = false;
                clearInterval(interval);
            };
        }
    }, [firebaseConfig, assignedRoles]);

    // Slow mode
    useEffect(() => {
        if (slowModeCooldown > 0) {
            const t = setTimeout(() => setSlowModeCooldown(c => c - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [slowModeCooldown]);

    // ======================================================
    // HANDLERS
    // ======================================================
    const handleSendMessage = async (customText?: string) => {
        let text = (customText || inputMessage).trim();
        if (!text) return;
        if (isMuted) { alert("Vous avez été mis en sourdine."); return; }
        if (slowModeCooldown > 0 && !isModOrAdmin && myComputedRole !== 'artist' && myComputedRole !== 'vip') return;

        const isHighlighted = isNextMessageHighlighted || myComputedRole === 'artist' || myComputedRole === 'admin';
        if (isNextMessageHighlighted) { text = `🌟 [SURLIGNÉ] ${text}`; setIsNextMessageHighlighted(false); }

        const newMsg: ChatMessageItem = {
            id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
            pseudo: myPseudo, message: text,
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            role: myComputedRole, color: myColor, country: myCountry, isHighlighted
        };
        setMessages(prev => {
            const updated = [...prev, newMsg].slice(-150);
            try { localStorage.setItem('dropsiders_chat_cache', JSON.stringify(updated)); } catch { }
            return updated;
        });
        setInputMessage('');
        if (slowModeSeconds > 0 && !isModOrAdmin && myComputedRole !== 'artist' && myComputedRole !== 'vip') setSlowModeCooldown(slowModeSeconds);
        broadcastRef.current?.postMessage({ type: 'NEW_MESSAGE', message: newMsg });

        // Firebase Realtime Broadcast (RTDB / Firestore)
        const rtdb = getFirebaseRtdb();
        const db = getFirebaseDb();
        if (rtdb) {
            push(ref(rtdb, 'dropsiders_live_messages'), {
                pseudo: newMsg.pseudo,
                message: newMsg.message,
                time: newMsg.time,
                role: newMsg.role,
                color: newMsg.color || '#00e5ff',
                country: newMsg.country || 'FR',
                isHighlighted: Boolean(newMsg.isHighlighted),
                isPinned: Boolean(newMsg.isPinned),
                timestamp: Date.now()
            }).catch(err => console.warn("[LiveChat] RTDB message error:", err));
        } else if (db) {
            addDoc(collection(db, 'dropsiders_live_messages'), {
                pseudo: newMsg.pseudo,
                message: newMsg.message,
                time: newMsg.time,
                role: newMsg.role,
                color: newMsg.color || '#00e5ff',
                country: newMsg.country || 'FR',
                isHighlighted: Boolean(newMsg.isHighlighted),
                isPinned: Boolean(newMsg.isPinned),
                timestamp: Date.now(),
                createdAt: serverTimestamp()
            }).catch(err => console.warn("[LiveChat] Firestore message error:", err));
        }

        // Global Edge KV broadcast
        fetch('/api/chat/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newMsg)
        }).catch(err => console.warn("[LiveChat] Edge sync error:", err));

        setTimeout(() => scrollToBottom(true), 50);
    };

    const triggerHypeBoost = () => {
        setHypeCount(prev => prev + 1);
        setIsHypeActive(true);
        setTimeout(() => setIsHypeActive(false), 2000);
        broadcastRef.current?.postMessage({ type: 'HYPE_BOOST' });
        try { confetti({ particleCount: 35, spread: 70, origin: { y: 0.85, x: 0.8 }, colors: ['#ff0033','#ff3700','#9146FF','#00e5ff','#ffd700'] }); } catch { }
    };

    const handleAssignRole = (targetPseudo: string, role: ChatUserRole) => {
        if (!isModOrAdmin) { alert("Seuls les modérateurs et admins peuvent attribuer des rôles."); return; }
        const clean = targetPseudo.trim().toLowerCase();
        const next = { ...assignedRoles, [clean]: role };
        setAssignedRoles(next);
        localStorage.setItem('dropsiders_assigned_roles', JSON.stringify(next));
        broadcastRef.current?.postMessage({ type: 'ROLE_ASSIGNED', pseudo: targetPseudo, role });

        // Firebase Role sync (RTDB / Firestore)
        const rtdb = getFirebaseRtdb();
        const db = getFirebaseDb();
        if (rtdb) {
            set(ref(rtdb, 'dropsiders_chat_state/roles'), next)
                .catch(err => console.warn("[LiveChat] RTDB role error:", err));
        } else if (db) {
            setDoc(doc(db, 'dropsiders_chat_state', 'current'), { roles: next }, { merge: true })
                .catch(err => console.warn("[LiveChat] Firestore role error:", err));
        }

        // Global Edge KV role broadcast
        fetch('/api/chat/role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pseudo: targetPseudo, role })
        }).catch(err => console.warn("[LiveChat] Edge role sync error:", err));

        handleSendMessage(`[MODÉRATION] 👑 Le rôle ${ROLE_CONFIG[role].label} a été attribué à @${targetPseudo} !`);
        setSelectedUserForRole(null);
    };

    // Firebase Settings Handlers
    const handleTestFirebase = async () => {
        if (!fbFormApiKey.trim() || !fbFormProjectId.trim()) {
            setFbTestStatus({ testing: false, success: false, message: 'La Clé API et le Project ID sont obligatoires pour tester.' });
            return;
        }
        setFbTestStatus({ testing: true });
        const config: FirebaseChatConfig = {
            apiKey: fbFormApiKey.trim(),
            projectId: fbFormProjectId.trim(),
            authDomain: fbFormAuthDomain.trim() || `${fbFormProjectId.trim()}.firebaseapp.com`,
            storageBucket: fbFormStorageBucket.trim() || `${fbFormProjectId.trim()}.appspot.com`,
            messagingSenderId: fbFormSenderId.trim(),
            appId: fbFormAppId.trim(),
        };
        const res = await testFirebaseConnection(config);
        setFbTestStatus({ testing: false, success: res.success, message: res.message });
    };

    const handleSaveFirebase = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fbFormApiKey.trim() || !fbFormProjectId.trim()) {
            alert('Veuillez renseigner au moins la Clé API et le Project ID Firebase.');
            return;
        }
        const config: FirebaseChatConfig = {
            apiKey: fbFormApiKey.trim(),
            projectId: fbFormProjectId.trim(),
            authDomain: fbFormAuthDomain.trim() || `${fbFormProjectId.trim()}.firebaseapp.com`,
            storageBucket: fbFormStorageBucket.trim() || `${fbFormProjectId.trim()}.appspot.com`,
            messagingSenderId: fbFormSenderId.trim(),
            appId: fbFormAppId.trim(),
        };
        saveFirebaseConfig(config);
        setFirebaseConfig(config);
        setIsFirebaseModalOpen(false);
        setFbTestStatus(null);
    };

    const handleClearFirebase = () => {
        if (!confirm('Voulez-vous réinitialiser la configuration Firebase ?')) return;
        clearFirebaseConfig();
        setFirebaseConfig(null);
        setFbFormApiKey('');
        setFbFormProjectId('');
        setFbFormAuthDomain('');
        setFbFormStorageBucket('');
        setFbFormSenderId('');
        setFbFormAppId('');
        setFbTestStatus(null);
        setIsFirebaseConnected(false);
    };

    const handleRedeemReward = (reward: ChatReward) => {
        if (userDrops < reward.cost) { alert(`Il vous faut ${reward.cost} Drops (vous en avez ${userDrops}).`); return; }
        const newBalance = userDrops - reward.cost;
        setUserDrops(newBalance);
        localStorage.setItem('user_drops', String(newBalance));
        setIsRewardsModalOpen(false);
        if (reward.actionType === 'highlight') { setIsNextMessageHighlighted(true); alert("🌟 Prochain message surligné !"); }
        else if (reward.actionType === 'vip_pass') { handleAssignRole(myPseudo, 'vip'); }
        else if (reward.actionType === 'tts') { const m = prompt("Message TTS :"); if (m) handleSendMessage(`🗣️ [VOCAL TTS] @${myPseudo} : ${m}`); }
        else if (reward.actionType === 'track_request') { const s = prompt("Track à demander :"); if (s) handleSendMessage(`🎵 [TRACK REQUEST] @${myPseudo} : "${s}"`); }
        else if (reward.actionType === 'contest_entry') { handleSendMessage(`🎟️ [GIVEAWAY] @${myPseudo} participe !`); confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } }); }
        else { handleSendMessage(`🎁 @${myPseudo} a échangé "${reward.title}" (${reward.cost} Drops)`); }
    };

    const handleCreateReward = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isModOrAdmin || !newRewardTitle.trim()) return;
        const newReward: ChatReward = {
            id: 'reward-custom-' + Date.now(), title: newRewardTitle.trim(),
            cost: Number(newRewardCost) || 100, icon: newRewardIcon || '🎁',
            description: newRewardDesc.trim() || 'Récompense exclusive.', actionType: 'custom', isCustom: true
        };
        const updated = [...rewards, newReward];
        setRewards(updated);
        localStorage.setItem('dropsiders_chat_rewards', JSON.stringify(updated));
        broadcastRef.current?.postMessage({ type: 'REWARDS_UPDATE', rewards: updated });
        setNewRewardTitle(''); setNewRewardDesc(''); setIsAddRewardModalOpen(false);
        handleSendMessage(`📢 Nouvelle récompense : "${newReward.title}" (${newReward.cost} Drops) !`);
    };

    const handleDeleteReward = (id: string) => {
        if (!isModOrAdmin) return;
        const updated = rewards.filter(r => r.id !== id);
        setRewards(updated);
        localStorage.setItem('dropsiders_chat_rewards', JSON.stringify(updated));
        broadcastRef.current?.postMessage({ type: 'REWARDS_UPDATE', rewards: updated });
    };

    const handleDeleteMessage = async (id: string) => {
        if (!isModOrAdmin) return;
        setMessages(prev => prev.filter(m => m.id !== id));
        broadcastRef.current?.postMessage({ type: 'DELETE_MESSAGE', id });

        // Firebase Realtime / Firestore delete
        const rtdb = getFirebaseRtdb();
        const db = getFirebaseDb();
        if (rtdb) {
            remove(ref(rtdb, `dropsiders_live_messages/${id}`))
                .catch(err => console.warn("[LiveChat] RTDB delete error:", err));
        } else if (db) {
            deleteDoc(doc(db, 'dropsiders_live_messages', id))
                .catch(err => console.warn("[LiveChat] Firestore delete error:", err));
        }

        fetch('/api/chat/messages', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        }).catch(err => console.warn("[LiveChat] Delete sync error:", err));
    };

    const handlePinMessage = (msg: ChatMessageItem) => {
        if (!isModOrAdmin) return;
        setPinnedMessage(msg);
        broadcastRef.current?.postMessage({ type: 'PIN_MESSAGE', message: msg });

        // Firebase Realtime / Firestore pin
        const rtdb = getFirebaseRtdb();
        const db = getFirebaseDb();
        if (rtdb) {
            set(ref(rtdb, 'dropsiders_chat_state/pinnedMessage'), msg)
                .catch(err => console.warn("[LiveChat] RTDB pin error:", err));
        } else if (db) {
            setDoc(doc(db, 'dropsiders_chat_state', 'current'), { pinnedMessage: msg }, { merge: true })
                .catch(err => console.warn("[LiveChat] Firestore pin error:", err));
        }

        fetch('/api/chat/pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        }).catch(err => console.warn("[LiveChat] Pin sync error:", err));
    };

    const handleUnpinMessage = () => {
        if (!isModOrAdmin) return;
        setPinnedMessage(null);
        broadcastRef.current?.postMessage({ type: 'UNPIN_MESSAGE' });

        // Firebase Realtime / Firestore unpin
        const rtdb = getFirebaseRtdb();
        const db = getFirebaseDb();
        if (rtdb) {
            set(ref(rtdb, 'dropsiders_chat_state/pinnedMessage'), null)
                .catch(err => console.warn("[LiveChat] RTDB unpin error:", err));
        } else if (db) {
            setDoc(doc(db, 'dropsiders_chat_state', 'current'), { pinnedMessage: null }, { merge: true })
                .catch(err => console.warn("[LiveChat] Firestore unpin error:", err));
        }

        fetch('/api/chat/pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: null })
        }).catch(err => console.warn("[LiveChat] Unpin sync error:", err));
    };

    const handleTimeoutUser = (pseudo: string) => {
        if (!isModOrAdmin) return;
        handleSendMessage(`[MODÉRATION] ⏱️ @${pseudo} a été mis en sourdine pour 5 minutes.`);
    };

    // POLLS
    const handleCreatePoll = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isModOrAdmin) return;
        const validOptions = newPollOptions.filter(o => o.trim());
        if (validOptions.length < 2 || !newPollQuestion.trim()) return;
        const poll: LivePoll = {
            id: 'poll-' + Date.now(), question: newPollQuestion.trim(),
            options: validOptions.map(t => ({ text: t.trim(), votes: 0 })),
            totalVotes: 0, createdBy: myPseudo, endsAt: Date.now() + newPollDuration * 1000
        };
        setActivePoll(poll); setUserVotedPollId(null); setIsPollCreatorOpen(false);
        setNewPollQuestion(''); setNewPollOptions(['', '']);
        broadcastRef.current?.postMessage({ type: 'POLL_UPDATE', poll });

        // Firebase Realtime / Firestore poll
        const rtdb = getFirebaseRtdb();
        const db = getFirebaseDb();
        if (rtdb) {
            set(ref(rtdb, 'dropsiders_chat_state/activePoll'), poll)
                .catch(err => console.warn("[LiveChat] RTDB poll error:", err));
        } else if (db) {
            setDoc(doc(db, 'dropsiders_chat_state', 'current'), { activePoll: poll }, { merge: true })
                .catch(err => console.warn("[LiveChat] Firestore poll error:", err));
        }

        fetch('/api/chat/poll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ poll })
        }).catch(err => console.warn("[LiveChat] Poll sync error:", err));
        handleSendMessage(`📊 [SONDAGE] "${poll.question}" — Votez maintenant !`);
    };

    const handleVotePoll = (optionIndex: number) => {
        if (!activePoll || userVotedPollId === activePoll.id) return;
        if (activePoll.endsAt && Date.now() > activePoll.endsAt) return;
        const updated: LivePoll = {
            ...activePoll,
            options: activePoll.options.map((o, i) => i === optionIndex ? { ...o, votes: o.votes + 1 } : o),
            totalVotes: activePoll.totalVotes + 1
        };
        setActivePoll(updated); setUserVotedPollId(activePoll.id);
        broadcastRef.current?.postMessage({ type: 'POLL_UPDATE', poll: updated });

        // Firebase Realtime / Firestore vote poll
        const rtdb = getFirebaseRtdb();
        const db = getFirebaseDb();
        if (rtdb) {
            set(ref(rtdb, 'dropsiders_chat_state/activePoll'), updated)
                .catch(err => console.warn("[LiveChat] RTDB vote error:", err));
        } else if (db) {
            setDoc(doc(db, 'dropsiders_chat_state', 'current'), { activePoll: updated }, { merge: true })
                .catch(err => console.warn("[LiveChat] Firestore vote error:", err));
        }

        fetch('/api/chat/poll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ poll: updated })
        }).catch(err => console.warn("[LiveChat] Vote sync error:", err));
    };

    const handleClosePoll = () => {
        if (!isModOrAdmin) return;
        setActivePoll(null);
        broadcastRef.current?.postMessage({ type: 'POLL_UPDATE', poll: null });

        // Firebase Realtime / Firestore close poll
        const rtdb = getFirebaseRtdb();
        const db = getFirebaseDb();
        if (rtdb) {
            set(ref(rtdb, 'dropsiders_chat_state/activePoll'), null)
                .catch(err => console.warn("[LiveChat] RTDB close poll error:", err));
        } else if (db) {
            setDoc(doc(db, 'dropsiders_chat_state', 'current'), { activePoll: null }, { merge: true })
                .catch(err => console.warn("[LiveChat] Firestore close poll error:", err));
        }

        fetch('/api/chat/poll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ poll: null })
        }).catch(err => console.warn("[LiveChat] Poll close error:", err));
    };

    // ALERTS
    const getAlertStyle = (type: LiveAlert['type']) => {
        switch (type) {
            case 'follower':  return { bg: 'from-cyan-900/95 to-black',     border: 'border-cyan-400/60',    icon: '❤️', label: 'Nouveau Follower !',  color: '#00e5ff' };
            case 'sub':       return { bg: 'from-purple-900/95 to-black',   border: 'border-purple-400/60',  icon: '⭐', label: 'Nouveau Abonné !',    color: '#9146FF' };
            case 'resub':     return { bg: 'from-indigo-900/95 to-black',   border: 'border-indigo-400/60',  icon: '🔄', label: 'Re-abonnement !',      color: '#818cf8' };
            case 'gift_sub':  return { bg: 'from-pink-900/95 to-black',     border: 'border-pink-400/60',    icon: '🎁', label: 'Sub Cadeau !',         color: '#f472b6' };
            case 'raid':      return { bg: 'from-amber-900/95 to-black',    border: 'border-amber-400/60',   icon: '🚀', label: 'RAID !',               color: '#fbbf24' };
            case 'donation':  return { bg: 'from-emerald-900/95 to-black',  border: 'border-emerald-400/60', icon: '💰', label: 'Donation !',           color: '#34d399' };
            default:          return { bg: 'from-gray-900/95 to-black',     border: 'border-white/20',       icon: '🎉', label: 'Alerte Live !',        color: '#ffffff' };
        }
    };

    const triggerMockAlert = (type: LiveAlert['type']) => {
        const demos: Record<LiveAlert['type'], LiveAlert> = {
            follower:  { id: 'a-' + Date.now(), type: 'follower',  pseudo: 'NeonFan_'    + Math.floor(Math.random()*999) },
            sub:       { id: 'a-' + Date.now(), type: 'sub',       pseudo: 'SubUser_'    + Math.floor(Math.random()*999), months: 1 },
            resub:     { id: 'a-' + Date.now(), type: 'resub',     pseudo: 'LoyalFan_'   + Math.floor(Math.random()*99),  months: Math.floor(2+Math.random()*10) },
            gift_sub:  { id: 'a-' + Date.now(), type: 'gift_sub',  pseudo: 'GiftKing_'   + Math.floor(Math.random()*99),  amount: Math.floor(1+Math.random()*5) },
            raid:      { id: 'a-' + Date.now(), type: 'raid',      pseudo: 'Raider_'     + Math.floor(Math.random()*99),  amount: Math.floor(20+Math.random()*200) },
            donation:  { id: 'a-' + Date.now(), type: 'donation',  pseudo: 'Donor_'      + Math.floor(Math.random()*99),  amount: Math.floor(2+Math.random()*50), message: 'Continue comme ça ! 🔥' },
        };
        const alert = demos[type];
        showAlert(alert);
        broadcastRef.current?.postMessage({ type: 'LIVE_ALERT', alert });
        setIsMockAlertOpen(false);
    };

    const handleOpenPopout = () => {
        const w = 420, h = 720;
        window.open('/live-chat-popout', 'DropsidersLiveChatPopout',
            `width=${w},height=${h},top=60,left=${window.screen.width - w - 40},scrollbars=no,resizable=yes`);
    };

    // ======================================================
    // RENDER
    // ======================================================
    return (
        <div className={`w-full h-full flex flex-col bg-[#0b0c10] border-l border-white/10 text-white select-none ${isPopout ? 'fixed inset-0' : 'relative'}`}>

            {/* CSS */}
            <style>{`
                @keyframes alertSlideIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.92); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0)     scale(1); }
                }
                @keyframes alertProgress {
                    from { width: 100%; }
                    to   { width: 0%; }
                }
            `}</style>

            {/* ======================================================== */}
            {/* LIVE ALERT OVERLAY                                         */}
            {/* ======================================================== */}
            {currentAlert && (() => {
                const s = getAlertStyle(currentAlert.type);
                return (
                    <div className="absolute top-16 left-1/2 z-[200] pointer-events-none w-72"
                        style={{ animation: 'alertSlideIn 0.4s cubic-bezier(.21,1.02,.73,1) forwards', transform: 'translateX(-50%)' }}>
                        <div className={`bg-gradient-to-r ${s.bg} border ${s.border} rounded-2xl px-5 py-3.5 shadow-2xl flex items-center gap-3 relative overflow-hidden`}
                            style={{ boxShadow: `0 0 30px ${s.color}40` }}>
                            <span className="text-3xl shrink-0">{s.icon}</span>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: s.color }}>{s.label}</span>
                                <span className="text-white font-black text-sm truncate">{currentAlert.pseudo}</span>
                                {currentAlert.type === 'resub' && currentAlert.months && <span className="text-[10px] text-gray-300">{currentAlert.months} mois consécutifs 🎉</span>}
                                {currentAlert.type === 'gift_sub' && currentAlert.amount && <span className="text-[10px] text-gray-300">offre {currentAlert.amount} sub(s) !</span>}
                                {currentAlert.type === 'raid' && currentAlert.amount && <span className="text-[10px] text-gray-300">avec {currentAlert.amount} raiders !</span>}
                                {currentAlert.type === 'donation' && currentAlert.amount && <span className="text-[10px] text-gray-300">{currentAlert.amount}€{currentAlert.message ? ` — "${currentAlert.message}"` : ''}</span>}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden">
                                <div className="h-full" style={{ backgroundColor: s.color, animation: 'alertProgress 5.5s linear forwards' }} />
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Badge Unlock Notif */}
            {badgeUnlockNotif && (
                <div className="absolute top-16 left-1/2 z-[201] pointer-events-none w-72"
                    style={{ animation: 'alertSlideIn 0.4s cubic-bezier(.21,1.02,.73,1) forwards', transform: 'translateX(-50%)' }}>
                    <div className="bg-gradient-to-r from-black/95 to-gray-900/95 border rounded-2xl px-5 py-3.5 shadow-2xl flex items-center gap-3"
                        style={{ borderColor: badgeUnlockNotif.color + '80', boxShadow: `0 0 25px ${badgeUnlockNotif.color}40` }}>
                        <span className="text-3xl">{badgeUnlockNotif.icon}</span>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: badgeUnlockNotif.color }}>Badge Débloqué !</span>
                            <p className="text-white font-black text-sm">{badgeUnlockNotif.label}</p>
                            <p className="text-[10px] text-gray-400">Nouveau palier de fidélité ! 🏆</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* HEADER                                                      */}
            {/* ======================================================== */}
            <header className="h-14 px-3.5 border-b border-white/10 flex items-center justify-between bg-black/90 shrink-0 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(255,0,51,0.3)]">
                        <Flame className="w-4 h-4 text-red-400 animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="text-white text-xs font-black uppercase tracking-wider">Chat Live Dropsiders</span>
                            {isFirebaseConnected ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[8px] font-black text-emerald-300" title="Connecté à Firebase Firestore en temps réel">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>Firebase</span>
                                </span>
                            ) : (
                                <button 
                                    onClick={() => isModOrAdmin && setIsFirebaseModalOpen(true)}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[8px] font-black text-amber-300 hover:bg-amber-500/30 transition-all cursor-pointer"
                                    title={isModOrAdmin ? "Cliquer pour configurer Firebase Firestore" : "Synchronisation en direct"}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    <span>{isModOrAdmin ? 'Config Firebase' : 'Live'}</span>
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                            <span>{channelName}</span>
                            <span>•</span>
                            <span className="text-amber-400 font-bold">🪙 {userDrops}</span>
                            <span>•</span>
                            <span className="font-bold" style={{ color: myLoyaltyBadge.color }}>{myLoyaltyBadge.icon} {myLoyaltyBadge.label}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={() => setIsRewardsModalOpen(true)}
                        className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-[10px] font-black text-amber-300 flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                        title="Boutique Drops">
                        <Gift className="w-3.5 h-3.5" /><span className="hidden sm:inline">Drops</span>
                    </button>
                    <button onClick={() => setActiveTab(t => t === 'leaderboard' ? 'chat' : 'leaderboard')}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${activeTab === 'leaderboard' ? 'bg-amber-500/30 border-amber-400/60 text-amber-300' : 'bg-white/5 border-white/10 text-gray-400 hover:text-amber-300'}`}
                        title="Classement">
                        <Trophy className="w-3.5 h-3.5" />
                    </button>
                    {isModOrAdmin && <>
                        <button onClick={() => setIsFirebaseModalOpen(true)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${isFirebaseConnected ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30' : 'bg-amber-500/20 border-amber-400/40 text-amber-300 hover:bg-amber-500/30 animate-pulse'}`}
                            title="Réglages Firebase Firestore (Temps Réel)">
                            <Database className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setIsMockAlertOpen(true)}
                            className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 transition-all cursor-pointer"
                            title="Alertes Live"><Bell className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setIsPollCreatorOpen(true)}
                            className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-300 transition-all cursor-pointer"
                            title="Créer un sondage"><BarChart2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setIsRoleManagementModalOpen(true)}
                            className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 transition-all cursor-pointer"
                            title="Gérer les rôles"><Shield className="w-3.5 h-3.5" /></button>
                    </>}
                    <button onClick={() => setIsProfileModalOpen(true)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
                        title="Mon profil"><Settings className="w-3.5 h-3.5 text-cyan-400" /></button>
                    {!isPopout && (
                        <button onClick={handleOpenPopout} className="p-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-white/10 transition-colors cursor-pointer" title="Popout">
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    )}
                    {onClose && (
                        <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </header>

            {/* Drops notif */}
            {dropsNotification && (
                <div className="px-3 py-1.5 bg-gradient-to-r from-amber-500/30 via-yellow-400/20 to-black border-b border-amber-400/40 text-amber-300 text-xs font-bold flex items-center justify-between shrink-0 animate-in fade-in duration-300">
                    <span className="flex items-center gap-1.5"><Gift className="w-3.5 h-3.5 text-amber-400 animate-bounce" />{dropsNotification}</span>
                    <button onClick={() => setDropsNotification(null)} className="text-gray-400 hover:text-white">✕</button>
                </div>
            )}

            {/* ======================================================== */}
            {/* POLL BANNER                                                 */}
            {/* ======================================================== */}
            {activePoll && (
                <div className="px-3 py-2 bg-gradient-to-r from-purple-900/40 to-black/80 border-b border-purple-500/30 shrink-0 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                            <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-[10px] font-black uppercase text-purple-300">Sondage Live</span>
                            {activePoll.endsAt && pollTimeLeft > 0 && <span className="text-[9px] text-gray-400 font-mono">{pollTimeLeft}s</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-gray-500">{activePoll.totalVotes} votes</span>
                            {isModOrAdmin && <button onClick={handleClosePoll} className="text-gray-500 hover:text-red-400 cursor-pointer" title="Fermer"><X className="w-3 h-3" /></button>}
                        </div>
                    </div>
                    <p className="text-xs font-bold text-white mb-2">{activePoll.question}</p>
                    <div className="space-y-1.5">
                        {activePoll.options.map((opt, i) => {
                            const pct = activePoll.totalVotes > 0 ? Math.round((opt.votes / activePoll.totalVotes) * 100) : 0;
                            const hasVoted = userVotedPollId === activePoll.id;
                            const pollClosed = activePoll.endsAt ? Date.now() > activePoll.endsAt : false;
                            return (
                                <button key={i} type="button" onClick={() => handleVotePoll(i)} disabled={hasVoted || pollClosed}
                                    className={`w-full relative rounded-lg overflow-hidden border transition-all text-left cursor-pointer disabled:cursor-default ${hasVoted ? 'border-purple-500/50 bg-purple-900/20' : 'border-white/10 bg-black/40 hover:border-purple-400/50'}`}>
                                    <div className="absolute inset-y-0 left-0 bg-purple-600/25 transition-all duration-500" style={{ width: hasVoted ? `${pct}%` : '0%' }} />
                                    <div className="relative flex items-center justify-between px-2.5 py-1.5">
                                        <span className="text-[11px] font-bold text-white">{opt.text}</span>
                                        {hasVoted && <span className="text-[10px] font-black text-purple-300">{pct}%</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Pinned */}
            {pinnedMessage && (
                <div className="px-3 py-2 bg-gradient-to-r from-red-500/20 via-purple-900/20 to-black/80 border-b border-red-500/30 flex items-start justify-between gap-2 text-xs shrink-0">
                    <div className="flex items-start gap-2 overflow-hidden">
                        <Pin className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="text-[10px] font-black uppercase text-red-400">📌 {pinnedMessage.pseudo}</span>
                            <p className="text-gray-200 text-[11px] truncate">{pinnedMessage.message}</p>
                        </div>
                    </div>
                    {isModOrAdmin && <button onClick={handleUnpinMessage} className="text-gray-400 hover:text-white p-1 cursor-pointer"><X className="w-3.5 h-3.5" /></button>}
                </div>
            )}

            {/* TABS */}
            <div className="flex border-b border-white/5 shrink-0">
                <button onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeTab === 'chat' ? 'text-white border-b-2 border-cyan-400/70 bg-white/[0.03]' : 'text-gray-500 hover:text-gray-300'}`}>
                    <MessageSquare className="w-3 h-3" />Chat
                </button>
                <button onClick={() => setActiveTab('leaderboard')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeTab === 'leaderboard' ? 'text-amber-300 border-b-2 border-amber-400/70 bg-amber-500/[0.05]' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Trophy className="w-3 h-3" />Classement
                </button>
            </div>

            {/* ======================================================== */}
            {/* LEADERBOARD TAB                                             */}
            {/* ======================================================== */}
            {activeTab === 'leaderboard' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {/* My card */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-black/40 border border-amber-400/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{myLoyaltyBadge.icon}</span>
                                <div>
                                    <p className="text-xs font-black text-white">{myPseudo}</p>
                                    <p className="text-[9px] font-bold" style={{ color: myLoyaltyBadge.color }}>{myLoyaltyBadge.label} — {totalWatchMinutes} min regardées</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-amber-300">🪙 {userDrops}</p>
                                <p className="text-[9px] text-gray-500">Mes Drops</p>
                            </div>
                        </div>
                        {(() => {
                            const nextBadge = LOYALTY_BADGES.find(b => b.minMinutes > totalWatchMinutes);
                            if (!nextBadge) return <p className="text-[9px] text-amber-400 mt-2 font-bold">🏆 Palier maximum — Légende !</p>;
                            const prevMin = myLoyaltyBadge.minMinutes;
                            const progress = Math.round(((totalWatchMinutes - prevMin) / (nextBadge.minMinutes - prevMin)) * 100);
                            return (
                                <div className="mt-2">
                                    <div className="flex justify-between text-[9px] text-gray-500 mb-1">
                                        <span>Prochain : {nextBadge.icon} {nextBadge.label}</span>
                                        <span>{totalWatchMinutes}/{nextBadge.minMinutes}min</span>
                                    </div>
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: nextBadge.color }} />
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Paliers */}
                    <div>
                        <p className="text-[9px] font-black uppercase text-gray-500 mb-1.5">Paliers de Fidélité</p>
                        <div className="grid grid-cols-3 gap-1">
                            {LOYALTY_BADGES.map(b => (
                                <div key={b.id}
                                    className={`px-2 py-1.5 rounded-lg text-center border transition-all ${totalWatchMinutes >= b.minMinutes ? 'bg-black/60' : 'bg-black/20 opacity-40'}`}
                                    style={{ borderColor: b.color + '40' }}>
                                    <span className="text-lg">{b.icon}</span>
                                    <p className="text-[8px] font-black" style={{ color: b.color }}>{b.label}</p>
                                    <p className="text-[7px] text-gray-600">{b.minMinutes}min</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top */}
                    <p className="text-[9px] font-black uppercase text-gray-500">🏆 Top Spectateurs</p>
                    {leaderboard.slice(0, 20).map((entry, rank) => {
                        const badge = getLoyaltyBadge(entry.watchMinutes);
                        const isMe = entry.pseudo.toLowerCase() === cleanCurrentPseudo;
                        return (
                            <div key={entry.pseudo}
                                className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${isMe ? 'bg-amber-500/10 border-amber-400/30' : 'bg-white/[0.03] border-white/5 hover:border-white/10'}`}>
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                    rank === 0 ? 'bg-yellow-400/30 text-yellow-300 border border-yellow-400/50' :
                                    rank === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/40' :
                                    rank === 2 ? 'bg-amber-700/30 text-amber-600 border border-amber-700/40' :
                                    'bg-white/5 text-gray-500 border border-white/5'
                                }`}>
                                    {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`}
                                </div>
                                <span className="text-base shrink-0" title={badge.label}>{badge.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-bold truncate" style={{ color: entry.color || '#ffffff' }}>{entry.pseudo}</span>
                                        {isMe && <span className="text-[8px] text-amber-400 font-black">(MOI)</span>}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {entry.role !== 'user' && (
                                            <span className={`text-[7px] font-black uppercase px-1 rounded ${ROLE_CONFIG[entry.role].badgeBg} ${ROLE_CONFIG[entry.role].badgeText}`}>
                                                {ROLE_CONFIG[entry.role].label}
                                            </span>
                                        )}
                                        <span className="text-[9px] text-gray-600">{entry.watchMinutes}min</span>
                                    </div>
                                </div>
                                <p className="text-xs font-black text-amber-300 shrink-0">🪙 {entry.drops.toLocaleString()}</p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ======================================================== */}
            {/* CHAT TAB                                                    */}
            {/* ======================================================== */}
            {activeTab === 'chat' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {messages.map((msg) => {
                        const effectiveRole = assignedRoles[msg.pseudo.toLowerCase()] || msg.role || 'user';
                        const roleCfg = ROLE_CONFIG[effectiveRole];
                        const RoleIcon = roleCfg.icon;
                        const isArtist = effectiveRole === 'artist';
                        const isHighlighted = msg.isHighlighted || msg.message.startsWith('🌟 [SURLIGNÉ]');
                        const isOwnMsg = msg.pseudo.toLowerCase() === cleanCurrentPseudo;
                        return (
                            <div key={msg.id}
                                className={`group relative p-2 rounded-xl transition-all ${
                                    isHighlighted ? 'bg-amber-950/20 border border-amber-500/40 shadow-[0_0_15px_rgba(251,191,36,0.2)]' :
                                    isArtist ? 'bg-purple-950/20 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]' :
                                    'hover:bg-white/[0.04]'
                                }`}>
                                <div className="flex items-start gap-2">
                                    {msg.country && (
                                        <span className="text-xs shrink-0 opacity-80">
                                            {msg.country === 'FR' ? '🇫🇷' : msg.country === 'BE' ? '🇧🇪' : msg.country === 'NL' ? '🇳🇱' : msg.country === 'US' ? '🇺🇸' : msg.country === 'GB' ? '🇬🇧' : '🌍'}
                                        </span>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {effectiveRole !== 'user' && (
                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${roleCfg.badgeBg} ${roleCfg.badgeBorder} ${roleCfg.badgeText} ${roleCfg.glow}`}>
                                                    <RoleIcon className="w-2.5 h-2.5" /><span>{roleCfg.label}</span>
                                                </span>
                                            )}
                                            {/* Loyalty badge on own messages */}
                                            {isOwnMsg && myLoyaltyBadge.id !== 'newcomer' && (
                                                <span className="text-xs" title={myLoyaltyBadge.label}
                                                    style={{ filter: `drop-shadow(0 0 4px ${myLoyaltyBadge.color})` }}>
                                                    {myLoyaltyBadge.icon}
                                                </span>
                                            )}
                                            <button type="button"
                                                onClick={() => { if (isModOrAdmin) setSelectedUserForRole(msg.pseudo); }}
                                                className="font-bold text-xs truncate hover:underline text-left cursor-pointer"
                                                style={{ color: msg.color || '#00e5ff' }}
                                                title={isModOrAdmin ? `Gérer @${msg.pseudo}` : undefined}>
                                                {msg.pseudo}
                                            </button>
                                            <span className="text-[9px] font-mono text-gray-500 ml-auto shrink-0">{msg.time}</span>
                                        </div>
                                        <p className={`text-xs mt-1 break-words leading-relaxed ${isArtist ? 'text-purple-100 font-semibold' : isHighlighted ? 'text-amber-100 font-bold' : 'text-gray-200'}`}>
                                            {msg.message}
                                        </p>
                                    </div>
                                    {isModOrAdmin && (
                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-black/80 border border-white/10 rounded-lg p-0.5 transition-opacity shrink-0">
                                            <button onClick={() => setSelectedUserForRole(msg.pseudo)} className="p-1 text-gray-400 hover:text-amber-400 rounded" title="Rôle"><Crown className="w-3 h-3" /></button>
                                            <button onClick={() => handlePinMessage(msg)} className="p-1 text-gray-400 hover:text-cyan-400 rounded" title="Épingler"><Pin className="w-3 h-3" /></button>
                                            <button onClick={() => handleTimeoutUser(msg.pseudo)} className="p-1 text-gray-400 hover:text-amber-400 rounded" title="Timeout"><Clock className="w-3 h-3" /></button>
                                            <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 text-gray-400 hover:text-red-400 rounded" title="Supprimer"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* Emotes + Hype */}
            {activeTab === 'chat' && (
                <div className="px-3 py-1.5 border-t border-white/5 bg-black/60 flex items-center justify-between gap-1 shrink-0">
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                        {QUICK_EMOTES.map((emoji) => (
                            <button key={emoji} type="button" onClick={() => handleSendMessage(emoji)}
                                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-sm flex items-center justify-center transition-transform hover:scale-115 active:scale-95 cursor-pointer shrink-0">
                                {emoji}
                            </button>
                        ))}
                    </div>
                    <button type="button" onClick={triggerHypeBoost}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0 ${
                            isHypeActive ? 'bg-red-500 text-white scale-105 shadow-[0_0_20px_rgba(255,0,51,0.6)]' : 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                        }`}>
                        <Flame className="w-3.5 h-3.5" /><span>Hype ({hypeCount})</span>
                    </button>
                </div>
            )}

            {/* Input */}
            {activeTab === 'chat' && (
                <div className="p-3 border-t border-white/10 bg-[#0e0e14] shrink-0">
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
                        <div className="flex-1">
                            <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)}
                                placeholder={
                                    slowModeCooldown > 0 ? `Slow mode : ${slowModeCooldown}s...` :
                                    isNextMessageHighlighted ? `🌟 Prochain message surligné...` :
                                    `Discuter en tant que ${myPseudo}...`
                                }
                                disabled={slowModeCooldown > 0 && !isModOrAdmin && myComputedRole !== 'artist' && myComputedRole !== 'vip'}
                                className={`w-full bg-white/5 border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all disabled:opacity-50 ${isNextMessageHighlighted ? 'border-amber-400 bg-amber-500/10' : 'border-white/10 focus:border-cyan-400/50'}`}
                            />
                        </div>
                        <button type="submit"
                            disabled={!inputMessage.trim() || (slowModeCooldown > 0 && !isModOrAdmin && myComputedRole !== 'artist' && myComputedRole !== 'vip')}
                            className="p-2.5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-black transition-all cursor-pointer font-bold shrink-0">
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                    <div className="mt-2 flex items-center justify-between text-[9px] text-gray-500">
                        <span className="flex items-center gap-1 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            +10 Drops dans {Math.max(0, Math.floor((180 - watchSeconds) / 60))}m {Math.max(0, (180 - watchSeconds) % 60)}s
                        </span>
                        <button onClick={() => setIsProfileModalOpen(true)} className="hover:text-cyan-400 transition-colors uppercase font-bold cursor-pointer">
                            Mon profil
                        </button>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODAL : RÉCOMPENSES                                         */}
            {/* ======================================================== */}
            {isRewardsModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-[#12131a] border border-amber-400/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/60">
                            <div className="flex items-center gap-2.5">
                                <Gift className="w-5 h-5 text-amber-400" />
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Récompenses & Drops</h3>
                                    <p className="text-[10px] text-gray-400">Échangez vos Drops contre des avantages exclusifs</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono font-bold text-xs">🪙 {userDrops}</span>
                                <button onClick={() => setIsRewardsModalOpen(false)} className="p-1 text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div className="p-5 space-y-3 overflow-y-auto max-h-[70vh]">
                            {rewards.map((r) => {
                                const canAfford = userDrops >= r.cost;
                                return (
                                    <div key={r.id} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/40 flex items-center justify-between gap-3 transition-all">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl p-2 rounded-xl bg-black/40 border border-white/5">{r.icon}</span>
                                            <div>
                                                <h4 className="text-xs font-black text-white uppercase">{r.title}</h4>
                                                <p className="text-[10px] text-gray-400 leading-tight">{r.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {isModOrAdmin && r.isCustom && (
                                                <button onClick={() => handleDeleteReward(r.id)} className="p-1.5 text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                            )}
                                            <button onClick={() => handleRedeemReward(r)} disabled={!canAfford}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${canAfford ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)] active:scale-95' : 'bg-white/10 text-gray-500 cursor-not-allowed'}`}>
                                                {r.cost} Drops
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {isModOrAdmin && (
                                <div className="pt-3 border-t border-white/10">
                                    <button type="button" onClick={() => setIsAddRewardModalOpen(true)}
                                        className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-black text-xs uppercase flex items-center justify-center gap-2 cursor-pointer">
                                        <Plus className="w-4 h-4" /> Ajouter une Récompense
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-between items-center text-[10px] text-gray-400">
                            <span>+10 Drops toutes les 3 min de visionnage</span>
                            <button onClick={() => setIsRewardsModalOpen(false)} className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase cursor-pointer">Fermer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL : Créer récompense */}
            {isAddRewardModalOpen && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[130] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <form onSubmit={handleCreateReward} className="w-full max-w-md bg-[#12131a] border border-emerald-400/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/60">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <Plus className="w-4 h-4 text-emerald-400" />Créer une Récompense
                            </h3>
                            <button type="button" onClick={() => setIsAddRewardModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="p-5 space-y-3.5">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400">Titre</label>
                                <input type="text" required placeholder="Ex: Dédicace du DJ..." value={newRewardTitle} onChange={e => setNewRewardTitle(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-gray-400">Coût en Drops</label>
                                    <input type="number" min="10" max="10000" required value={newRewardCost} onChange={e => setNewRewardCost(Number(e.target.value))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-gray-400">Émoji</label>
                                    <input type="text" value={newRewardIcon} onChange={e => setNewRewardIcon(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400">Description</label>
                                <textarea rows={2} placeholder="Décrivez la récompense..." value={newRewardDesc} onChange={e => setNewRewardDesc(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400 resize-none" />
                            </div>
                        </div>
                        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end gap-2">
                            <button type="button" onClick={() => setIsAddRewardModalOpen(false)} className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase">Annuler</button>
                            <button type="submit" className="px-4 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs uppercase">Ajouter</button>
                        </div>
                    </form>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODAL : CRÉER UN SONDAGE                                    */}
            {/* ======================================================== */}
            {isPollCreatorOpen && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[130] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <form onSubmit={handleCreatePoll} className="w-full max-w-md bg-[#12131a] border border-purple-400/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/60">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <BarChart2 className="w-4 h-4 text-purple-400" />Créer un Sondage Live
                            </h3>
                            <button type="button" onClick={() => setIsPollCreatorOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-400">Question</label>
                                <input type="text" required placeholder="Ex: Quel set préférez-vous ?" value={newPollQuestion} onChange={e => setNewPollQuestion(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-400" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase text-gray-400">Options ({newPollOptions.length})</label>
                                    {newPollOptions.length < 5 && (
                                        <button type="button" onClick={() => setNewPollOptions(p => [...p, ''])}
                                            className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-0.5 cursor-pointer">
                                            <Plus className="w-3 h-3" /> Ajouter
                                        </button>
                                    )}
                                </div>
                                {newPollOptions.map((opt, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <input type="text" required placeholder={`Option ${i + 1}...`} value={opt}
                                            onChange={e => setNewPollOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-400" />
                                        {newPollOptions.length > 2 && (
                                            <button type="button" onClick={() => setNewPollOptions(p => p.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400 cursor-pointer">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-400">Durée</label>
                                <select value={newPollDuration} onChange={e => setNewPollDuration(Number(e.target.value))}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-400">
                                    <option value={30}>30 secondes</option>
                                    <option value={60}>1 minute</option>
                                    <option value={120}>2 minutes</option>
                                    <option value={300}>5 minutes</option>
                                    <option value={600}>10 minutes</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end gap-2">
                            <button type="button" onClick={() => setIsPollCreatorOpen(false)} className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase">Annuler</button>
                            <button type="submit" className="px-4 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs uppercase">Lancer le Sondage</button>
                        </div>
                    </form>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODAL : ALERTES LIVE                                        */}
            {/* ======================================================== */}
            {isMockAlertOpen && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[130] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-[#12131a] border border-cyan-400/30 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/60">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <Bell className="w-4 h-4 text-cyan-400" />Alertes Live
                            </h3>
                            <button onClick={() => setIsMockAlertOpen(false)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-5 space-y-2">
                            <p className="text-[10px] text-gray-400 mb-3">Déclenchez une alerte visuelle sur le chat pour annoncer un événement en direct.</p>
                            {(['follower', 'sub', 'resub', 'gift_sub', 'raid', 'donation'] as LiveAlert['type'][]).map(type => {
                                const s = getAlertStyle(type);
                                return (
                                    <button key={type} type="button" onClick={() => triggerMockAlert(type)}
                                        className={`w-full p-3 rounded-xl border bg-gradient-to-r ${s.bg} ${s.border} flex items-center gap-3 hover:opacity-90 transition-all cursor-pointer active:scale-[0.98]`}>
                                        <span className="text-xl">{s.icon}</span>
                                        <span className="font-black text-xs uppercase tracking-wider" style={{ color: s.color }}>{s.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODAL : ATTRIBUTION DE RÔLE                                */}
            {/* ======================================================== */}
            {(selectedUserForRole || isRoleManagementModalOpen) && isModOrAdmin && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[130] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-[#12131a] border border-emerald-400/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/60">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <Crown className="w-4 h-4 text-emerald-400" />
                                {selectedUserForRole ? `Rôle → @${selectedUserForRole}` : 'Gestion des Rôles'}
                            </h3>
                            <button type="button" onClick={() => { setSelectedUserForRole(null); setIsRoleManagementModalOpen(false); }} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="p-5 space-y-3">
                            <p className="text-xs text-gray-400">Seuls les Modérateurs et Administrateurs peuvent attribuer des rôles.</p>
                            {selectedUserForRole && (
                                <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-2">
                                    <span className="text-[10px] font-black uppercase text-gray-400">Choisir le rôle pour @{selectedUserForRole} :</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        {([
                                            { role: 'vip' as ChatUserRole,    icon: <Sparkles className="w-3.5 h-3.5" />, label: '💎 VIP',         cls: 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/50 text-amber-300' },
                                            { role: 'artist' as ChatUserRole, icon: <Award className="w-3.5 h-3.5" />,    label: '🎧 DJ Officiel', cls: 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-400/50 text-purple-300' },
                                            { role: 'mod' as ChatUserRole,    icon: <Shield className="w-3.5 h-3.5" />,   label: '🛡️ Modérateur',cls: 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/50 text-emerald-300' },
                                            { role: 'user' as ChatUserRole,   icon: <Radio className="w-3.5 h-3.5" />,    label: '⚡ Fan (Défaut)',cls: 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-400' },
                                        ] as const).map(({ role, icon, label, cls }) => (
                                            <button key={role} type="button" onClick={() => handleAssignRole(selectedUserForRole, role)}
                                                className={`p-2.5 rounded-xl border font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${cls}`}>
                                                {icon}<span>{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="space-y-1.5 pt-2">
                                <span className="text-[10px] font-black uppercase text-gray-400">Rôles attribués :</span>
                                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                    {Object.entries(assignedRoles).map(([pseudo, role]) => (
                                        <div key={pseudo} className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white">@{pseudo}</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${ROLE_CONFIG[role].badgeBg} ${ROLE_CONFIG[role].badgeText}`}>{ROLE_CONFIG[role].label}</span>
                                            </div>
                                            <button onClick={() => handleAssignRole(pseudo, 'user')} className="text-[10px] text-red-400 hover:underline uppercase font-bold">Retirer</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end">
                            <button onClick={() => { setSelectedUserForRole(null); setIsRoleManagementModalOpen(false); }}
                                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase">Fermer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODAL : PROFIL                                               */}
            {/* ======================================================== */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-[#12131a] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/50">
                            <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4 text-cyan-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">Mon Profil Chat</h3>
                            </div>
                            <button onClick={() => setIsProfileModalOpen(false)} className="p-1 text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-400">Pseudo</label>
                                <input type="text" value={myPseudo} onChange={e => { setMyPseudo(e.target.value); localStorage.setItem('chat_pseudo', e.target.value); }}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400" />
                            </div>
                            {/* Status card */}
                            <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between">
                                <div>
                                    <span className="text-[9px] font-black uppercase text-gray-500">Statut & Fidélité</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${ROLE_CONFIG[myComputedRole].badgeBg} ${ROLE_CONFIG[myComputedRole].badgeText}`}>{ROLE_CONFIG[myComputedRole].label}</span>
                                        <span className="text-sm" style={{ filter: `drop-shadow(0 0 5px ${myLoyaltyBadge.color})` }}>{myLoyaltyBadge.icon}</span>
                                        <span className="text-xs font-bold" style={{ color: myLoyaltyBadge.color }}>{myLoyaltyBadge.label}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-amber-300">🪙 {userDrops}</p>
                                    <p className="text-[9px] text-gray-600">{totalWatchMinutes} min regardées</p>
                                </div>
                            </div>
                            {/* Color */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-400">Couleur du Pseudo</label>
                                <div className="flex items-center gap-2">
                                    {['#00e5ff', '#ff0033', '#9146FF', '#ffd700', '#00ff66', '#ff00ea', '#ffffff'].map(c => (
                                        <button key={c} type="button" onClick={() => { setMyColor(c); localStorage.setItem('chat_color', c); }}
                                            className={`w-7 h-7 rounded-full border-2 transition-transform ${myColor === c ? 'scale-120 border-white shadow-lg' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                            </div>
                            {/* Country */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-400">Drapeau Pays</label>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {[{ code: 'FR', label: '🇫🇷 France' }, { code: 'BE', label: '🇧🇪 Belgique' }, { code: 'NL', label: '🇳🇱 Pays-Bas' }, { code: 'US', label: '🇺🇸 USA' }, { code: 'GB', label: '🇬🇧 UK' }].map(c => (
                                        <button key={c.code} type="button" onClick={() => { setMyCountry(c.code); localStorage.setItem('chat_country', c.code); }}
                                            className={`py-1.5 px-2 rounded-lg text-xs border transition-all ${myCountry === c.code ? 'bg-white/20 border-white text-white font-bold' : 'bg-white/5 border-white/5 text-gray-400'}`}>
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Loyalty tiers */}
                            <div className="pt-3 border-t border-white/10 space-y-2">
                                <span className="text-[10px] font-black uppercase text-amber-400">Mes Paliers de Fidélité</span>
                                <div className="space-y-1">
                                    {LOYALTY_BADGES.map(b => {
                                        const unlocked = totalWatchMinutes >= b.minMinutes;
                                        return (
                                            <div key={b.id} className={`flex items-center gap-2 p-2 rounded-lg border ${unlocked ? 'border-white/10 bg-white/[0.03]' : 'border-white/5 opacity-40'}`}>
                                                <span className="text-base">{b.icon}</span>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black" style={{ color: unlocked ? b.color : '#6b7280' }}>{b.label}</p>
                                                    <p className="text-[9px] text-gray-600">{b.minMinutes} min requises</p>
                                                </div>
                                                {unlocked ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="text-[9px] text-gray-600">🔒</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Staff options */}
                            {isModOrAdmin && (
                                <div className="pt-3 border-t border-white/10 space-y-2.5">
                                    <span className="text-[10px] font-black uppercase text-amber-400">Options Staff</span>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-300">Mode Ralenti (Slow Mode)</span>
                                        <select value={slowModeSeconds} onChange={e => { const s = Number(e.target.value); setSlowModeSeconds(s); localStorage.setItem('chat_slow_mode', String(s)); broadcastRef.current?.postMessage({ type: 'SLOW_MODE', seconds: s }); }}
                                            className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-xs text-white outline-none">
                                            <option value={0}>Désactivé</option>
                                            <option value={3}>3 secondes</option>
                                            <option value={5}>5 secondes</option>
                                            <option value={10}>10 secondes</option>
                                            <option value={30}>30 secondes</option>
                                        </select>
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsProfileModalOpen(false);
                                                setIsFirebaseModalOpen(true);
                                            }}
                                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-red-500/20 hover:from-amber-500/30 hover:to-red-500/30 border border-amber-400/40 text-amber-300 font-black text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
                                        >
                                            <Database className="w-3.5 h-3.5" />
                                            <span>Configuration Firebase Firestore</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end">
                            <button onClick={() => setIsProfileModalOpen(false)} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase cursor-pointer">Fermer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODAL : CONFIGURATION FIREBASE FIRESTORE                  */}
            {/* ======================================================== */}
            {isFirebaseModalOpen && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[130] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-[#12131a] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/50">
                            <div className="flex items-center gap-2">
                                <Database className="w-4 h-4 text-amber-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">Réglage Chat Firebase (Firestore)</h3>
                            </div>
                            <button onClick={() => { setIsFirebaseModalOpen(false); setFbTestStatus(null); }} className="p-1 text-gray-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 overflow-y-auto">
                            {/* Status Card */}
                            <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                                isFirebaseConnected 
                                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                                    : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                            }`}>
                                <div className={`w-3 h-3 rounded-full shrink-0 ${
                                    isFirebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                                }`} />
                                <div className="text-xs">
                                    <p className="font-bold">
                                        {isFirebaseConnected 
                                            ? '🟢 Firestore Connecté en Temps Réel' 
                                            : (firebaseConfig ? '🟡 Firebase configuré, en attente de réponse' : '⚪ Firebase non configuré')}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        {isFirebaseConnected 
                                            ? 'Les messages, sondages et rôles sont synchronisés instantanément par WebSocket sans rechargement.'
                                            : 'Renseignez vos clés Firebase ci-dessous pour activer la synchronisation mondiale instantanée.'}
                                    </p>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSaveFirebase} className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1">
                                        <Key className="w-3 h-3 text-amber-400" /> Clé API Firebase (apiKey) *
                                    </label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="ex: AIzaSyD..." 
                                        value={fbFormApiKey} 
                                        onChange={e => setFbFormApiKey(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono" 
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-gray-400">
                                        Project ID (projectId) *
                                    </label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="ex: dropsiders-tv-chat" 
                                        value={fbFormProjectId} 
                                        onChange={e => {
                                            const val = e.target.value;
                                            setFbFormProjectId(val);
                                            if (!fbFormAuthDomain && val) setFbFormAuthDomain(`${val}.firebaseapp.com`);
                                            if (!fbFormStorageBucket && val) setFbFormStorageBucket(`${val}.appspot.com`);
                                        }}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono" 
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-gray-400">Auth Domain</label>
                                        <input 
                                            type="text" 
                                            placeholder="nom-projet.firebaseapp.com" 
                                            value={fbFormAuthDomain} 
                                            onChange={e => setFbFormAuthDomain(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono" 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-gray-400">App ID</label>
                                        <input 
                                            type="text" 
                                            placeholder="1:123456789:web:..." 
                                            value={fbFormAppId} 
                                            onChange={e => setFbFormAppId(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono" 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-gray-400">Storage Bucket (Optionnel)</label>
                                        <input 
                                            type="text" 
                                            placeholder="nom-projet.appspot.com" 
                                            value={fbFormStorageBucket} 
                                            onChange={e => setFbFormStorageBucket(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono" 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-gray-400">Sender ID (Optionnel)</label>
                                        <input 
                                            type="text" 
                                            placeholder="1234567890" 
                                            value={fbFormSenderId} 
                                            onChange={e => setFbFormSenderId(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono" 
                                        />
                                    </div>
                                </div>

                                {/* Test Status Banner */}
                                {fbTestStatus && (
                                    <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                                        fbTestStatus.testing 
                                            ? 'bg-blue-950/40 border-blue-500/40 text-blue-300' 
                                            : (fbTestStatus.success 
                                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                                                : 'bg-red-950/40 border-red-500/40 text-red-300')
                                    }`}>
                                        {fbTestStatus.testing && <RefreshCw className="w-4 h-4 animate-spin shrink-0" />}
                                        {fbTestStatus.success && <Check className="w-4 h-4 shrink-0 text-emerald-400" />}
                                        {!fbTestStatus.testing && !fbTestStatus.success && <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />}
                                        <span className="flex-1">
                                            {fbTestStatus.testing ? 'Test de connexion à Firestore en cours...' : fbTestStatus.message}
                                        </span>
                                    </div>
                                )}

                                {/* Buttons */}
                                <div className="pt-2 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleTestFirebase}
                                        disabled={fbTestStatus?.testing}
                                        className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${fbTestStatus?.testing ? 'animate-spin' : ''}`} />
                                        <span>Tester la connexion</span>
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-black font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Sauvegarder & Connecter</span>
                                    </button>
                                </div>
                            </form>

                            {/* Snippet .env Helper */}
                            <div className="pt-3 border-t border-white/10 space-y-2">
                                <span className="text-[10px] font-black uppercase text-gray-400">Variables .env correspondantes :</span>
                                <pre className="p-3 bg-black/60 border border-white/10 rounded-xl text-[10px] text-cyan-300 font-mono overflow-x-auto leading-relaxed select-all">
{`VITE_FIREBASE_API_KEY=${fbFormApiKey || 'VOTRE_API_KEY'}
VITE_FIREBASE_PROJECT_ID=${fbFormProjectId || 'VOTRE_PROJECT_ID'}
VITE_FIREBASE_AUTH_DOMAIN=${fbFormAuthDomain || (fbFormProjectId ? `${fbFormProjectId}.firebaseapp.com` : 'VOTRE_AUTH_DOMAIN')}
VITE_FIREBASE_STORAGE_BUCKET=${fbFormStorageBucket || (fbFormProjectId ? `${fbFormProjectId}.appspot.com` : '')}
VITE_FIREBASE_MESSAGING_SENDER_ID=${fbFormSenderId || ''}
VITE_FIREBASE_APP_ID=${fbFormAppId || ''}`}
                                </pre>
                                <p className="text-[9px] text-gray-400">
                                    💡 Vous pouvez soit sauvegarder ici directement (stocké dans votre navigateur), soit copier ces lignes dans votre fichier <code className="text-white">.env</code>.
                                </p>
                            </div>

                            {firebaseConfig && (
                                <div className="pt-2 flex justify-start">
                                    <button
                                        type="button"
                                        onClick={handleClearFirebase}
                                        className="text-[10px] text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                                    >
                                        Réinitialiser la configuration locale
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end">
                            <button
                                onClick={() => { setIsFirebaseModalOpen(false); setFbTestStatus(null); }}
                                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase cursor-pointer"
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
