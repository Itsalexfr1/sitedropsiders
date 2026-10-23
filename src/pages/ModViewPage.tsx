import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Shield, Crown, Clock, Trash2, Pin, Volume2, VolumeX,
    RefreshCw, Send, Check, X, Search, Filter, AlertTriangle,
    UserX, UserCheck, Flame, BarChart2, Bell, BellOff,
    ExternalLink, Eye, ChevronRight, MessageSquare, Sparkles,
    Radio, Play, Pause, ArrowLeft, MoreHorizontal, Settings
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SEO } from '../components/utils/SEO';

// ==========================================
// TYPES & ROLES
// ==========================================
export type ChatRole = 'admin' | 'mod' | 'artist' | 'vip' | 'user';

export interface ModChatMessage {
    id: string;
    pseudo: string;
    message: string;
    time: string;
    role: ChatRole;
    color?: string;
    country?: string;
    isPinned?: boolean;
    isHighlighted?: boolean;
    isAutomodFiltered?: boolean;
}

export interface AutoModItem {
    id: string;
    messageItem: ModChatMessage;
    reason: string;
    severity: 'high' | 'medium' | 'low';
    detectedAt: string;
}

export interface ModActionLog {
    id: string;
    modPseudo: string;
    actionType: 'DELETE' | 'BAN' | 'UNBAN' | 'TIMEOUT' | 'SLOWMODE' | 'PIN' | 'UNPIN' | 'CLEAR' | 'ROLE_CHANGE' | 'AUTOMOD_ACCEPT' | 'AUTOMOD_REJECT';
    targetPseudo?: string;
    detail: string;
    timestamp: string;
}

export interface UserDetail {
    pseudo: string;
    role: ChatRole;
    color: string;
    country: string;
    messageCount: number;
    lastSeen: string;
    isBanned: boolean;
    timeoutUntil?: number;
    messages: { id: string; text: string; time: string }[];
}

const ROLE_META: Record<ChatRole, { label: string; badge: string; text: string; icon: string; bg: string }> = {
    admin:  { label: 'STAFF',  badge: 'bg-red-500/20 border-red-500/50 text-red-400',       text: 'text-red-400',    icon: '👑', bg: 'rgba(239, 68, 68, 0.15)' },
    mod:    { label: 'MODO',   badge: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400', text: 'text-emerald-400', icon: '🛡️', bg: 'rgba(16, 185, 129, 0.15)' },
    artist: { label: 'ARTIST', badge: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400',       text: 'text-cyan-400',    icon: '🎧', bg: 'rgba(6, 182, 212, 0.15)' },
    vip:    { label: 'VIP',    badge: 'bg-amber-500/20 border-amber-500/50 text-amber-400',     text: 'text-amber-400',   icon: '💎', bg: 'rgba(245, 158, 11, 0.15)' },
    user:   { label: 'VIEWER', badge: 'bg-white/5 border-white/10 text-gray-400',           text: 'text-gray-300',   icon: '🌱', bg: 'transparent' },
};

// Play an immediate high-tech ping chime with Web Audio API (0 dependencies)
const playModChime = (type: 'alert' | 'action' | 'ban' = 'alert') => {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        if (type === 'alert') {
            osc.frequency.setValueAtTime(659.25, now); // E5
            osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.12); // A5
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === 'ban') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else {
            osc.frequency.setValueAtTime(523.25, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        }
    } catch { }
};

export const ModViewPage: React.FC = () => {
    const navigate = useNavigate();

    // ── My Mod Credentials ──
    const [myPseudo] = useState<string>(() => localStorage.getItem('chat_pseudo') || 'Modérateur');
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

    // ── Layout Toggles (Twitch modular panels) ──
    const [showPlayer, setShowPlayer] = useState<boolean>(true);
    const [showAutoMod, setShowAutoMod] = useState<boolean>(true);
    const [showQuickActions, setShowQuickActions] = useState<boolean>(true);
    const [showModLog, setShowModLog] = useState<boolean>(true);
    const [showUsersPanel, setShowUsersPanel] = useState<boolean>(true);

    // ── Chat State ──
    const [messages, setMessages] = useState<ModChatMessage[]>([]);
    const [pinnedMessage, setPinnedMessage] = useState<ModChatMessage | null>(null);
    const [slowMode, setSlowMode] = useState<number>(0);
    const [bannedList, setBannedList] = useState<string[]>([]);
    const [roles, setRoles] = useState<Record<string, ChatRole>>({});
    const [inputMessage, setInputMessage] = useState('');
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [searchFilter, setSearchFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [autoScroll, setAutoScroll] = useState<boolean>(true);

    // ── AutoMod Queue ──
    const [autoModQueue, setAutoModQueue] = useState<AutoModItem[]>([]);

    // ── Mod Action Log ──
    const [actionLogs, setActionLogs] = useState<ModActionLog[]>(() => {
        try {
            const saved = localStorage.getItem('dropsiders_mod_logs');
            if (saved) return JSON.parse(saved);
        } catch { }
        return [];
    });

    // ── Selected User for Card View ──
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    // ── Users Management tab: 'chatters' | 'banned' | 'roles' ──
    const [usersTab, setUsersTab] = useState<'chatters' | 'banned' | 'roles'>('chatters');
    const [manualBanInput, setManualBanInput] = useState('');

    // ── Poll creation quick modal ──
    const [isPollModalOpen, setIsPollModalOpen] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOption1, setPollOption1] = useState('');
    const [pollOption2, setPollOption2] = useState('');
    const [pollDuration, setPollDuration] = useState(60);

    // ── Player state ──
    const [isPlayerMuted, setIsPlayerMuted] = useState(true);
    const [playerVideoId] = useState<string>('dQw4w9WgXcQ'); // fallback / stream video

    const chatScrollRef = useRef<HTMLDivElement>(null);
    const broadcastRef = useRef<BroadcastChannel | null>(null);
    const processedMsgIds = useRef<Set<string>>(new Set());

    // ── BroadcastChannel setup ──
    useEffect(() => {
        try {
            const bc = new BroadcastChannel('dropsiders_native_chat_v1');
            broadcastRef.current = bc;
            bc.onmessage = (event) => {
                const data = event.data;
                if (!data?.type) return;
                if (data.type === 'DELETE_MESSAGE') {
                    setMessages(prev => prev.filter(m => m.id !== data.id));
                } else if (data.type === 'PIN_MESSAGE') {
                    setPinnedMessage(data.message);
                } else if (data.type === 'UNPIN_MESSAGE') {
                    setPinnedMessage(null);
                } else if (data.type === 'SLOW_MODE') {
                    setSlowMode(data.seconds);
                }
            };
            return () => bc.close();
        } catch { }
    }, []);

    // ── Save action logs to localStorage ──
    const logModAction = useCallback((action: Omit<ModActionLog, 'id' | 'timestamp' | 'modPseudo'>) => {
        const newLog: ModActionLog = {
            id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            modPseudo: myPseudo,
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            ...action
        };
        setActionLogs(prev => {
            const updated = [newLog, ...prev].slice(0, 80);
            try { localStorage.setItem('dropsiders_mod_logs', JSON.stringify(updated)); } catch { }
            return updated;
        });
        if (soundEnabled) playModChime('action');
    }, [myPseudo, soundEnabled]);

    // ── AutoMod Heuristics Engine ──
    const checkAutoMod = useCallback((msg: ModChatMessage): { flagged: boolean; reason: string; severity: 'high' | 'medium' | 'low' } => {
        const text = msg.message;
        
        // 1. Toxic / insult patterns
        const toxicPatterns = /\b(fdp|connard|encul[eé]|salope|pute|nique|batard|merde|ta gueule|chienne|hitler|nazi)\b/i;
        if (toxicPatterns.test(text)) {
            return { flagged: true, reason: '🤬 Langage toxique / Vulgarité', severity: 'high' };
        }

        // 2. Suspicious external link
        const linkPatterns = /(https?:\/\/|www\.)[^\s]+|\b(discord\.gg|t\.me|bit\.ly|cutt\.ly|free-vbucks|t\.co|wa\.me)\b/i;
        if (linkPatterns.test(text)) {
            return { flagged: true, reason: '🔗 Lien externe non autorisé', severity: 'medium' };
        }

        // 3. Excessive CAPS (more than 70% uppercase and > 12 chars)
        const letters = text.replace(/[^a-zA-Z]/g, '');
        if (letters.length >= 12) {
            const upper = letters.replace(/[^A-Z]/g, '').length;
            if (upper / letters.length > 0.75) {
                return { flagged: true, reason: '📢 Majuscules excessives (Caps lock)', severity: 'low' };
            }
        }

        // 4. Repeated spam chars (e.g. "aaaaaaa", "!!!!!!!")
        if (/(.)\1{6,}/.test(text)) {
            return { flagged: true, reason: '🔁 Répétition de caractères (Spam)', severity: 'low' };
        }

        return { flagged: false, reason: '', severity: 'low' };
    }, []);

    // ── Polling Cloudflare KV ──
    const fetchModState = useCallback(async () => {
        try {
            const res = await fetch('/api/chat/messages');
            if (!res.ok) return;
            const data = await res.json();

            if (Array.isArray(data.messages)) {
                // Check incoming messages for AutoMod
                const newItems: AutoModItem[] = [];
                data.messages.forEach((m: ModChatMessage) => {
                    if (!processedMsgIds.current.has(m.id)) {
                        processedMsgIds.current.add(m.id);
                        // Only filter regular users (not mods or staff)
                        const role = data.roles?.[(m.pseudo || '').toLowerCase()] || m.role || 'user';
                        if (role === 'user') {
                            const evalResult = checkAutoMod(m);
                            if (evalResult.flagged) {
                                newItems.push({
                                    id: 'am-' + m.id,
                                    messageItem: m,
                                    reason: evalResult.reason,
                                    severity: evalResult.severity,
                                    detectedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                });
                            }
                        }
                    }
                });

                if (newItems.length > 0) {
                    setAutoModQueue(prev => [...newItems, ...prev].slice(0, 30));
                    if (soundEnabled) playModChime('alert');
                }

                setMessages(data.messages);
            }

            if (data.roles) setRoles(data.roles);
            if (data.pinned !== undefined) setPinnedMessage(data.pinned);
            if (data.slowMode !== undefined) setSlowMode(Number(data.slowMode));
            if (Array.isArray(data.banned)) setBannedList(data.banned);
        } catch (err) {
            console.warn('[ModView] Sync error:', err);
        }
    }, [checkAutoMod, soundEnabled]);

    useEffect(() => {
        fetchModState();
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') fetchModState();
        }, 1200);
        return () => clearInterval(interval);
    }, [fetchModState]);

    // ── Auto scroll chat ──
    useEffect(() => {
        if (autoScroll && chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [messages, autoScroll]);

    // ── MOD ACTIONS ──

    // 1. Delete message
    const handleDeleteMessage = async (id: string, pseudo?: string) => {
        setMessages(prev => prev.filter(m => m.id !== id));
        broadcastRef.current?.postMessage({ type: 'DELETE_MESSAGE', id });

        logModAction({
            actionType: 'DELETE',
            targetPseudo: pseudo,
            detail: `Suppression du message ID: ${id}`
        });

        try {
            await fetch('/api/chat/messages', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
        } catch { }
    };

    // 2. Ban user
    const handleBanUser = async (pseudoToBan: string) => {
        const clean = pseudoToBan.trim();
        if (!clean) return;
        if (!confirm(`Confirmer le BAN définitif de @${clean} ? Ses messages seront purgés.`)) return;

        // Optimistic UI
        setBannedList(prev => [...prev.filter(b => b.toUpperCase() !== clean.toUpperCase()), clean]);
        setMessages(prev => prev.filter(m => (m.pseudo || '').toUpperCase() !== clean.toUpperCase()));

        logModAction({
            actionType: 'BAN',
            targetPseudo: clean,
            detail: `Bannissement permanent du chat`
        });
        if (soundEnabled) playModChime('ban');

        try {
            await fetch('/api/chat/ban', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pseudo: clean })
            });
        } catch { }

        // Also broadcast notification in chat
        handleSendChatMessage(`[MODÉRATION] 🚫 @${clean} a été banni définitivement du chat.`);
    };

    // 3. Unban user
    const handleUnbanUser = async (pseudoToUnban: string) => {
        const clean = pseudoToUnban.trim();
        setBannedList(prev => prev.filter(b => b.toUpperCase() !== clean.toUpperCase()));

        logModAction({
            actionType: 'UNBAN',
            targetPseudo: clean,
            detail: `Levée du bannissement`
        });

        try {
            await fetch('/api/chat/unban', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pseudo: clean })
            });
        } catch { }
    };

    // 4. Timeout user
    const handleTimeoutUser = (targetPseudo: string, seconds: number, label: string) => {
        logModAction({
            actionType: 'TIMEOUT',
            targetPseudo: targetPseudo,
            detail: `Mise en sourdine pendant ${label}`
        });
        handleSendChatMessage(`[MODÉRATION] ⏱️ @${targetPseudo} a été mis en sourdine pour ${label}.`);
        if (seconds <= 2) {
            // Purge: delete their recent messages
            setMessages(prev => prev.filter(m => (m.pseudo || '').toUpperCase() !== targetPseudo.toUpperCase()));
        }
    };

    // 5. Change User Role
    const handleChangeRole = async (targetPseudo: string, newRole: ChatRole) => {
        const clean = targetPseudo.trim().toLowerCase();
        setRoles(prev => {
            const next = { ...prev };
            if (newRole === 'user') delete next[clean];
            else next[clean] = newRole;
            return next;
        });

        logModAction({
            actionType: 'ROLE_CHANGE',
            targetPseudo: targetPseudo,
            detail: `Attribution du rôle : ${ROLE_META[newRole].label}`
        });

        try {
            await fetch('/api/chat/role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pseudo: targetPseudo, role: newRole })
            });
        } catch { }

        handleSendChatMessage(`[MODÉRATION] 👑 Rôle ${ROLE_META[newRole].label} accordé à @${targetPseudo} !`);
    };

    // 6. Slow mode
    const handleSetSlowMode = async (seconds: number) => {
        setSlowMode(seconds);
        broadcastRef.current?.postMessage({ type: 'SLOW_MODE', seconds });

        logModAction({
            actionType: 'SLOWMODE',
            detail: seconds > 0 ? `Mode ralenti activé : ${seconds}s` : `Mode ralenti désactivé`
        });

        try {
            await fetch('/api/chat/slowmode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seconds })
            });
        } catch { }

        handleSendChatMessage(seconds > 0 
            ? `[MODÉRATION] ⏱️ Mode ralenti activé : 1 message toutes les ${seconds} secondes.` 
            : `[MODÉRATION] ⚡ Mode ralenti désactivé.`
        );
    };

    // 7. Clear chat
    const handleClearChat = async () => {
        if (!confirm('⚠️ Êtes-vous sûr de vouloir VIDER l\'intégralité du chat pour tout le monde ?')) return;

        setMessages([]);
        logModAction({
            actionType: 'CLEAR',
            detail: `Purge totale du chat`
        });

        try {
            await fetch('/api/chat/clear', { method: 'POST' });
        } catch { }

        handleSendChatMessage(`[MODÉRATION] 🧹 Le chat a été vidé par un modérateur.`);
    };

    // 8. Pin/Unpin message
    const handlePinMessage = async (msg: ModChatMessage | null) => {
        setPinnedMessage(msg);
        broadcastRef.current?.postMessage(msg ? { type: 'PIN_MESSAGE', message: msg } : { type: 'UNPIN_MESSAGE' });

        logModAction({
            actionType: msg ? 'PIN' : 'UNPIN',
            detail: msg ? `Message épinglé de @${msg.pseudo}` : `Message désépinglé`
        });

        try {
            await fetch('/api/chat/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg })
            });
        } catch { }
    };

    // 9. Send Chat Message / Announcement
    const handleSendChatMessage = async (textToSend?: string) => {
        let text = (textToSend || inputMessage).trim();
        if (!text) return;

        // Check for slash commands
        if (text.startsWith('/')) {
            const parts = text.slice(1).split(' ');
            const cmd = parts[0].toLowerCase();
            const arg = parts.slice(1).join(' ');

            if (cmd === 'clear') {
                handleClearChat();
                setInputMessage('');
                return;
            } else if (cmd === 'slow') {
                const s = Number(arg) || 0;
                handleSetSlowMode(s);
                setInputMessage('');
                return;
            } else if (cmd === 'ban') {
                if (arg) handleBanUser(arg);
                setInputMessage('');
                return;
            } else if (cmd === 'unban') {
                if (arg) handleUnbanUser(arg);
                setInputMessage('');
                return;
            } else if (cmd === 'timeout') {
                const [target, secStr] = parts.slice(1);
                const s = Number(secStr) || 60;
                if (target) handleTimeoutUser(target, s, `${s}s`);
                setInputMessage('');
                return;
            } else if (cmd === 'announce') {
                text = `📢 [ANNONCE MODO] ${arg}`;
            }
        }

        const isAnnounce = isAnnouncement || text.includes('[ANNONCE MODO]');
        const newMsg: ModChatMessage = {
            id: 'modmsg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
            pseudo: myPseudo,
            message: isAnnounce && !text.includes('📢') ? `📢 [ANNONCE MODO] ${text}` : text,
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            role: 'mod',
            color: '#10b981',
            country: 'FR',
            isHighlighted: isAnnounce
        };

        setMessages(prev => [...prev, newMsg].slice(-150));
        setInputMessage('');
        setIsAnnouncement(false);

        try {
            await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMsg)
            });
        } catch { }
    };

    // 10. AutoMod item actions
    const handleAutoModAccept = (item: AutoModItem) => {
        setAutoModQueue(prev => prev.filter(q => q.id !== item.id));
        logModAction({
            actionType: 'AUTOMOD_ACCEPT',
            targetPseudo: item.messageItem.pseudo,
            detail: `Message autorisé : "${item.messageItem.message.slice(0, 30)}..."`
        });
    };

    const handleAutoModReject = (item: AutoModItem) => {
        setAutoModQueue(prev => prev.filter(q => q.id !== item.id));
        handleDeleteMessage(item.messageItem.id, item.messageItem.pseudo);
        logModAction({
            actionType: 'AUTOMOD_REJECT',
            targetPseudo: item.messageItem.pseudo,
            detail: `Message rejeté (${item.reason})`
        });
    };

    // 11. Create Quick Poll
    const handleCreatePoll = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pollQuestion.trim() || !pollOption1.trim() || !pollOption2.trim()) return;

        const poll = {
            id: 'poll-' + Date.now(),
            question: pollQuestion.trim(),
            options: [
                { text: pollOption1.trim(), votes: 0 },
                { text: pollOption2.trim(), votes: 0 }
            ],
            totalVotes: 0,
            createdBy: myPseudo,
            endsAt: Date.now() + pollDuration * 1000
        };

        try {
            await fetch('/api/chat/poll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ poll })
            });
        } catch { }

        handleSendChatMessage(`📊 [SONDAGE EXPRESS] "${poll.question}" — Options: 1) ${pollOption1} | 2) ${pollOption2}`);
        setIsPollModalOpen(false);
        setPollQuestion('');
        setPollOption1('');
        setPollOption2('');
        confetti({ particleCount: 30, spread: 60 });
    };

    // ── Filtered Messages ──
    const filteredMessages = useMemo(() => {
        return messages.filter(m => {
            const cleanPseudo = (m.pseudo || '').toLowerCase();
            const userRole = roles[cleanPseudo] || m.role || 'user';
            
            // Search filter
            if (searchFilter) {
                const q = searchFilter.toLowerCase();
                const matchMsg = (m.message || '').toLowerCase().includes(q);
                const matchUser = cleanPseudo.includes(q);
                if (!matchMsg && !matchUser) return false;
            }

            // Role filter
            if (roleFilter !== 'all' && userRole !== roleFilter) {
                return false;
            }

            return true;
        });
    }, [messages, searchFilter, roleFilter, roles]);

    // ── Unique Chatters List ──
    const uniqueChatters = useMemo(() => {
        const map = new Map<string, { pseudo: string; role: ChatRole; color: string; country: string; count: number; lastTime: string }>();
        messages.forEach(m => {
            const key = (m.pseudo || '').toLowerCase();
            const currentRole = roles[key] || m.role || 'user';
            const existing = map.get(key);
            if (!existing) {
                map.set(key, {
                    pseudo: m.pseudo,
                    role: currentRole,
                    color: m.color || '#00e5ff',
                    country: m.country || 'FR',
                    count: 1,
                    lastTime: m.time
                });
            } else {
                existing.count += 1;
                existing.lastTime = m.time;
            }
        });
        return Array.from(map.values()).sort((a, b) => b.count - a.count);
    }, [messages, roles]);

    // ── User Card Details ──
    const selectedUserDetails = useMemo<UserDetail | null>(() => {
        if (!selectedUser) return null;
        const clean = selectedUser.toLowerCase();
        const userMsgs = messages.filter(m => (m.pseudo || '').toLowerCase() === clean);
        const lastMsg = userMsgs[userMsgs.length - 1];
        const isBanned = bannedList.some(b => b.toUpperCase() === selectedUser.toUpperCase());

        return {
            pseudo: selectedUser,
            role: roles[clean] || lastMsg?.role || 'user',
            color: lastMsg?.color || '#00e5ff',
            country: lastMsg?.country || 'FR',
            messageCount: userMsgs.length,
            lastSeen: lastMsg?.time || 'Inconnue',
            isBanned,
            messages: userMsgs.map(m => ({ id: m.id, text: m.message, time: m.time }))
        };
    }, [selectedUser, messages, roles, bannedList]);

    return (
        <div className="w-screen h-screen bg-[#0e0e10] text-[#efeff1] font-sans flex flex-col overflow-hidden select-none">
            <SEO 
                title="Vue Modérateur Twitch | Dropsiders TV" 
                description="Espace de contrôle et de modération officiel Dropsiders TV avec outils Twitch Pro."
            />

            {/* ═══════════════════════════════════════════════════════════
                TOP MODERATOR BAR (TWITCH STYLE)
            ═══════════════════════════════════════════════════════════ */}
            <header className="h-12 bg-[#18181b] border-b border-[#26262c] flex items-center justify-between px-3 shrink-0 z-40">
                {/* Left: Branding & Status */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/tv')}
                        className="flex items-center gap-2 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
                        title="Quitter la vue modérateur et retourner à la TV"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Quitter la vue</span>
                    </button>

                    <div className="h-5 w-px bg-white/10" />

                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                            <Shield className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase tracking-wider text-white">Vue Modérateur</span>
                                <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] font-black rounded uppercase tracking-widest flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    EN DIRECT
                                </span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium leading-none">Dropsiders TV • Moteur KV Edge</span>
                        </div>
                    </div>
                </div>

                {/* Center: Live Stats Pills */}
                <div className="hidden lg:flex items-center gap-2">
                    {/* Viewers/Chatters pill */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1f1f23] border border-white/5 text-[11px] font-bold text-gray-300">
                        <span className="text-cyan-400">👥</span>
                        <span>{uniqueChatters.length}</span>
                        <span className="text-gray-500 font-normal">chatteurs</span>
                    </div>

                    {/* Messages pill */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1f1f23] border border-white/5 text-[11px] font-bold text-gray-300">
                        <span className="text-emerald-400">💬</span>
                        <span>{messages.length}</span>
                        <span className="text-gray-500 font-normal">messages</span>
                    </div>

                    {/* Slow mode status */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-bold ${slowMode > 0 ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-[#1f1f23] border-white/5 text-gray-400'}`}>
                        <Clock className="w-3 h-3" />
                        <span>Ralenti: {slowMode > 0 ? `${slowMode}s` : 'Désactivé'}</span>
                    </div>

                    {/* AutoMod Status with badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1f1f23] border border-white/5 text-[11px] font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-gray-300">AutoMod Actif</span>
                        {autoModQueue.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[9px] font-black animate-bounce">
                                {autoModQueue.length}
                            </span>
                        )}
                    </div>
                </div>

                {/* Right: Layout Toggles & Sound */}
                <div className="flex items-center gap-1.5">
                    {/* Toggle Player */}
                    <button
                        onClick={() => setShowPlayer(!showPlayer)}
                        className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${showPlayer ? 'bg-[#9146FF]/20 text-[#bf94ff] border border-[#9146FF]/40' : 'text-gray-400 hover:bg-white/5'}`}
                        title="Afficher/Masquer le lecteur vidéo en direct"
                    >
                        <Radio className="w-4 h-4" />
                    </button>

                    {/* Toggle AutoMod Queue */}
                    <button
                        onClick={() => setShowAutoMod(!showAutoMod)}
                        className={`relative p-1.5 rounded text-xs transition-colors cursor-pointer ${showAutoMod ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-gray-400 hover:bg-white/5'}`}
                        title="Afficher/Masquer la file d'attente AutoMod"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        {autoModQueue.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center">
                                {autoModQueue.length}
                            </span>
                        )}
                    </button>

                    {/* Toggle Quick Actions */}
                    <button
                        onClick={() => setShowQuickActions(!showQuickActions)}
                        className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${showQuickActions ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-gray-400 hover:bg-white/5'}`}
                        title="Afficher/Masquer les actions rapides modo"
                    >
                        <Sparkles className="w-4 h-4" />
                    </button>

                    {/* Toggle Mod Log */}
                    <button
                        onClick={() => setShowModLog(!showModLog)}
                        className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${showModLog ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-gray-400 hover:bg-white/5'}`}
                        title="Afficher/Masquer le journal des actions"
                    >
                        <Clock className="w-4 h-4" />
                    </button>

                    {/* Toggle Users Panel */}
                    <button
                        onClick={() => setShowUsersPanel(!showUsersPanel)}
                        className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${showUsersPanel ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-gray-400 hover:bg-white/5'}`}
                        title="Afficher/Masquer la liste des spectateurs et bannis"
                    >
                        <UserCheck className="w-4 h-4" />
                    </button>

                    <div className="h-4 w-px bg-white/10 mx-1" />

                    {/* Sound toggle */}
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${soundEnabled ? 'text-emerald-400 hover:bg-white/5' : 'text-gray-500 hover:bg-white/5'}`}
                        title={soundEnabled ? 'Sons des alertes modo activés' : 'Sons désactivés'}
                    >
                        {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    </button>

                    {/* Refresh feed */}
                    <button
                        onClick={() => { fetchModState(); playModChime('action'); }}
                        className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        title="Actualiser instantanément les flux KV"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════════
                MAIN TWITCH WORKSPACE (GRID PANELS)
            ═══════════════════════════════════════════════════════════ */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* ── LEFT COLUMN: STREAM PLAYER & QUICK ACTIONS (COLLAPSIBLE) ── */}
                {(showPlayer || showQuickActions) && (
                    <div className="w-72 sm:w-80 border-r border-[#26262c] bg-[#18181b] flex flex-col shrink-0 overflow-y-auto">
                        
                        {/* 1. Mini Live Stream Player */}
                        {showPlayer && (
                            <div className="p-3 border-b border-[#26262c]">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-xs font-black uppercase text-gray-300 tracking-wider">Aperçu Live TV</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => setIsPlayerMuted(!isPlayerMuted)}
                                            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white text-xs cursor-pointer"
                                            title={isPlayerMuted ? 'Activer le son' : 'Couper le son'}
                                        >
                                            {isPlayerMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                                        </button>
                                        <a 
                                            href="/tv" 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white text-xs cursor-pointer"
                                            title="Ouvrir la TV en plein écran dans un nouvel onglet"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                </div>

                                <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-white/10 group">
                                    <iframe 
                                        src={`https://www.youtube-nocookie.com/embed/${playerVideoId}?autoplay=1&mute=${isPlayerMuted ? 1 : 0}&controls=1&modestbranding=1&rel=0`}
                                        className="w-full h-full border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        title="Live Player"
                                    />
                                </div>
                                <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                                    <span className="truncate">Programme TV en continu</span>
                                    <span className="text-emerald-400 font-bold shrink-0">1080p • 60fps</span>
                                </div>
                            </div>
                        )}

                        {/* 2. Quick Mod Actions */}
                        {showQuickActions && (
                            <div className="p-3 flex-1 flex flex-col gap-3">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                            Actions Rapides Modo
                                        </span>
                                    </div>

                                    {/* Slow mode buttons */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-amber-400" />
                                            Mode Ralenti (Slow Mode)
                                        </label>
                                        <div className="grid grid-cols-5 gap-1">
                                            {[0, 3, 10, 30, 60].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => handleSetSlowMode(s)}
                                                    className={`py-1 text-[10px] font-black rounded border transition-all cursor-pointer ${slowMode === s ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-[#1f1f23] text-gray-300 border-white/5 hover:border-white/20'}`}
                                                >
                                                    {s === 0 ? 'OFF' : `${s}s`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Create poll button */}
                                <div className="pt-2 border-t border-[#26262c]">
                                    <button
                                        onClick={() => setIsPollModalOpen(true)}
                                        className="w-full py-2 px-3 rounded-lg bg-[#9146FF]/20 hover:bg-[#9146FF]/30 border border-[#9146FF]/40 text-[#bf94ff] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(145,70,255,0.2)]"
                                    >
                                        <BarChart2 className="w-3.5 h-3.5" />
                                        Créer un Sondage Express
                                    </button>
                                </div>

                                {/* Clear Chat button */}
                                <div className="pt-2 border-t border-[#26262c]">
                                    <button
                                        onClick={handleClearChat}
                                        className="w-full py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Vider le Chat (Purge Totale)
                                    </button>
                                </div>

                                {/* Slash commands cheatsheet */}
                                <div className="mt-auto pt-3 border-t border-[#26262c] text-[10px] text-gray-500 space-y-1">
                                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Commandes Chat :</span>
                                    <p><code className="text-cyan-400">/clear</code> : Vider le chat</p>
                                    <p><code className="text-cyan-400">/slow [sec]</code> : Ralenti</p>
                                    <p><code className="text-cyan-400">/ban [pseudo]</code> : Bannir</p>
                                    <p><code className="text-cyan-400">/timeout [pseudo] [sec]</code></p>
                                    <p><code className="text-cyan-400">/announce [texte]</code></p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── CENTER COLUMN: MAIN LIVE CHAT FEED (THE TWITCH STREAM) ── */}
                <div className="flex-1 flex flex-col bg-[#0e0e10] overflow-hidden min-w-[320px]">
                    
                    {/* Chat Header & Filters */}
                    <div className="h-10 bg-[#18181b] border-b border-[#26262c] px-3 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Flux du Chat en Direct</span>
                            <span className="text-[10px] text-gray-500">({filteredMessages.length} msgs)</span>
                        </div>

                        {/* Search & Role Filter */}
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="w-3 h-3 text-gray-500 absolute left-2 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchFilter}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                    placeholder="Filtrer message ou pseudo..."
                                    className="pl-7 pr-2 py-0.5 bg-[#0e0e10] border border-white/10 rounded text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 w-36 sm:w-48 transition-all"
                                />
                            </div>

                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="bg-[#0e0e10] border border-white/10 rounded px-1.5 py-0.5 text-[11px] text-gray-300 focus:outline-none cursor-pointer"
                            >
                                <option value="all">Tous les rôles</option>
                                <option value="user">Viewers (🌱)</option>
                                <option value="vip">VIP (💎)</option>
                                <option value="artist">Artistes (🎧)</option>
                                <option value="mod">Modos (🛡️)</option>
                                <option value="admin">Staff (👑)</option>
                            </select>

                            <button
                                onClick={() => setAutoScroll(!autoScroll)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${autoScroll ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-400'}`}
                                title={autoScroll ? 'Défilement automatique actif' : 'Défilement suspendu'}
                            >
                                {autoScroll ? 'Auto-scroll ON' : 'Scroll PAUSE'}
                            </button>
                        </div>
                    </div>

                    {/* Pinned message banner if any */}
                    {pinnedMessage && (
                        <div className="bg-[#1f1f23] border-b border-amber-500/40 p-2.5 flex items-center justify-between gap-3 shrink-0">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Pin className="w-4 h-4 text-amber-400 shrink-0" />
                                <div className="text-xs truncate">
                                    <span className="font-bold text-amber-300">Message Épinglé de @{pinnedMessage.pseudo} : </span>
                                    <span className="text-gray-200">{pinnedMessage.message}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handlePinMessage(null)}
                                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold text-gray-300 cursor-pointer shrink-0"
                            >
                                Désépingler
                            </button>
                        </div>
                    )}

                    {/* Messages Scroll Area */}
                    <div 
                        ref={chatScrollRef} 
                        className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-white/[0.03]"
                    >
                        {filteredMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs">
                                <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                                <span>Aucun message dans le chat</span>
                            </div>
                        ) : (
                            filteredMessages.map((msg) => {
                                const cleanPseudo = (msg.pseudo || '').toLowerCase();
                                const userRole = roles[cleanPseudo] || msg.role || 'user';
                                const roleInfo = ROLE_META[userRole] || ROLE_META.user;
                                const isBanned = bannedList.some(b => b.toUpperCase() === (msg.pseudo || '').toUpperCase());

                                return (
                                    <div 
                                        key={msg.id}
                                        className={`group relative flex items-start gap-2 py-1 px-2 rounded hover:bg-white/[0.04] transition-colors ${msg.isHighlighted ? 'bg-amber-500/10 border-l-2 border-amber-400' : ''}`}
                                    >
                                        {/* Timestamp */}
                                        <span className="text-[10px] text-gray-500 font-mono shrink-0 pt-0.5">
                                            {msg.time}
                                        </span>

                                        {/* Country Flag */}
                                        {msg.country && (
                                            <span className="text-[11px] shrink-0 pt-0.5" title={`Pays : ${msg.country}`}>
                                                {msg.country.toUpperCase() === 'FR' ? '🇫🇷' : msg.country.toUpperCase() === 'BE' ? '🇧🇪' : msg.country.toUpperCase() === 'CH' ? '🇨🇭' : '🌐'}
                                            </span>
                                        )}

                                        {/* Role badge */}
                                        {userRole !== 'user' && (
                                            <span 
                                                className={`px-1 py-0.2 rounded text-[9px] font-black border uppercase tracking-wider shrink-0 pt-0.5 ${roleInfo.badge}`}
                                                title={`Rôle: ${roleInfo.label}`}
                                            >
                                                {roleInfo.icon} {roleInfo.label}
                                            </span>
                                        )}

                                        {/* Pseudo (clickable to open User Card) */}
                                        <button
                                            onClick={() => setSelectedUser(msg.pseudo)}
                                            style={{ color: msg.color || '#00e5ff' }}
                                            className="font-bold text-xs hover:underline cursor-pointer shrink-0 pt-0.5"
                                            title="Cliquez pour ouvrir la fiche spectateur Twitch"
                                        >
                                            {msg.pseudo}:
                                        </button>

                                        {/* Message text */}
                                        <span className={`text-xs text-gray-200 break-words flex-1 leading-relaxed pt-0.5 ${isBanned ? 'line-through opacity-40' : ''}`}>
                                            {msg.message}
                                        </span>

                                        {/* HOVER QUICK ACTIONS BAR (TWITCH MOD BUTTONS) */}
                                        <div className="hidden group-hover:flex items-center gap-1 bg-[#1f1f23] border border-white/10 rounded px-1.5 py-0.5 shadow-lg shrink-0 z-10 animate-fadeIn">
                                            {/* Timeout 1s (Purge) */}
                                            <button
                                                onClick={() => handleTimeoutUser(msg.pseudo, 1, '1s (Purge)')}
                                                className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-amber-400 transition-colors cursor-pointer text-[10px]"
                                                title="Purger tous les messages de ce spectateur (1s timeout)"
                                            >
                                                1s
                                            </button>

                                            {/* Timeout 10m */}
                                            <button
                                                onClick={() => handleTimeoutUser(msg.pseudo, 600, '10 minutes')}
                                                className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-amber-400 transition-colors cursor-pointer text-[10px]"
                                                title="Timeout 10 minutes"
                                            >
                                                10m
                                            </button>

                                            {/* Delete Message */}
                                            <button
                                                onClick={() => handleDeleteMessage(msg.id, msg.pseudo)}
                                                className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                                                title="Supprimer ce message uniquement"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>

                                            {/* Ban User */}
                                            <button
                                                onClick={() => handleBanUser(msg.pseudo)}
                                                className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                                                title="Bannir définitivement ce spectateur"
                                            >
                                                <UserX className="w-3 h-3" />
                                            </button>

                                            {/* Pin Message */}
                                            <button
                                                onClick={() => handlePinMessage(msg)}
                                                className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-amber-400 transition-colors cursor-pointer"
                                                title="Épingler ce message en haut du chat"
                                            >
                                                <Pin className="w-3 h-3" />
                                            </button>

                                            {/* Open User Card */}
                                            <button
                                                onClick={() => setSelectedUser(msg.pseudo)}
                                                className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer"
                                                title="Ouvrir la fiche spectateur"
                                            >
                                                <Eye className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Chat Input Bar */}
                    <div className="p-2.5 bg-[#18181b] border-t border-[#26262c] shrink-0">
                        {isAnnouncement && (
                            <div className="mb-2 px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded text-[11px] text-amber-300 font-bold flex items-center justify-between">
                                <span>📢 Mode Annonce Officielle Modo activé (texte surligné pour tous)</span>
                                <button onClick={() => setIsAnnouncement(false)} className="text-xs hover:text-white cursor-pointer">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
                            className="flex items-center gap-2"
                        >
                            <button
                                type="button"
                                onClick={() => setIsAnnouncement(!isAnnouncement)}
                                className={`px-2 py-2 rounded text-xs font-black transition-all cursor-pointer ${isAnnouncement ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                                title="Diffuser en tant qu'Annonce Officielle"
                            >
                                📢
                            </button>

                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Envoyer un message ou une commande (/clear, /slow, /ban...)"
                                className="flex-1 px-3 py-2 bg-[#0e0e10] border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                            />

                            <button
                                type="submit"
                                disabled={!inputMessage.trim()}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:pointer-events-none text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                <Send className="w-3.5 h-3.5" />
                                <span>Envoyer</span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── RIGHT COLUMN 1: AUTOMOD QUEUE (IF OPEN) ── */}
                {showAutoMod && (
                    <div className="w-72 sm:w-80 border-l border-[#26262c] bg-[#18181b] flex flex-col shrink-0 overflow-hidden">
                        <div className="h-10 border-b border-[#26262c] px-3 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-black uppercase tracking-wider text-gray-300">File AutoMod</span>
                                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold">
                                    {autoModQueue.length}
                                </span>
                            </div>
                            {autoModQueue.length > 0 && (
                                <button
                                    onClick={() => setAutoModQueue([])}
                                    className="text-[10px] text-gray-400 hover:text-white cursor-pointer"
                                >
                                    Tout vider
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                            {autoModQueue.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs p-4 text-center">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                                        <Check className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-gray-400">Aucun message suspect</span>
                                    <span className="text-[11px] text-gray-600 mt-1">L'AutoMod veille automatiquement en temps réel sur les liens, insultes et spams.</span>
                                </div>
                            ) : (
                                autoModQueue.map(item => (
                                    <div 
                                        key={item.id}
                                        className="bg-[#1f1f23] border border-amber-500/30 rounded-lg p-2.5 space-y-2"
                                    >
                                        <div className="flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => setSelectedUser(item.messageItem.pseudo)}
                                                    className="font-bold text-amber-300 hover:underline cursor-pointer"
                                                >
                                                    @{item.messageItem.pseudo}
                                                </button>
                                                <span className="text-[10px] text-gray-500">{item.detectedAt}</span>
                                            </div>
                                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold uppercase tracking-wider">
                                                {item.severity}
                                            </span>
                                        </div>

                                        <div className="text-[10px] text-amber-400/90 font-medium bg-amber-500/10 px-2 py-1 rounded">
                                            {item.reason}
                                        </div>

                                        <p className="text-xs text-white bg-black/40 p-2 rounded border border-white/5 break-words font-mono">
                                            "{item.messageItem.message}"
                                        </p>

                                        {/* Accept / Reject actions */}
                                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                                            <button
                                                onClick={() => handleAutoModAccept(item)}
                                                className="py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Autoriser</span>
                                            </button>
                                            <button
                                                onClick={() => handleAutoModReject(item)}
                                                className="py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                                <span>Refuser</span>
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between pt-1 border-t border-white/5">
                                            <button
                                                onClick={() => { handleTimeoutUser(item.messageItem.pseudo, 600, '10 minutes'); handleAutoModReject(item); }}
                                                className="text-[10px] text-gray-400 hover:text-amber-400 cursor-pointer"
                                            >
                                                ⏱️ Timeout 10m
                                            </button>
                                            <button
                                                onClick={() => { handleBanUser(item.messageItem.pseudo); handleAutoModReject(item); }}
                                                className="text-[10px] text-gray-400 hover:text-red-400 cursor-pointer"
                                            >
                                                🚫 Bannir direct
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* ── RIGHT COLUMN 2: USERS & BAN MANAGER (IF OPEN) ── */}
                {showUsersPanel && (
                    <div className="w-64 sm:w-72 border-l border-[#26262c] bg-[#18181b] flex flex-col shrink-0 overflow-hidden">
                        {/* Tabs: Chatters vs Banned */}
                        <div className="h-10 border-b border-[#26262c] flex shrink-0">
                            <button
                                onClick={() => setUsersTab('chatters')}
                                className={`flex-1 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${usersTab === 'chatters' ? 'border-cyan-400 text-white bg-white/5' : 'border-transparent text-gray-400 hover:text-white'}`}
                            >
                                <span>Actifs ({uniqueChatters.length})</span>
                            </button>
                            <button
                                onClick={() => setUsersTab('banned')}
                                className={`flex-1 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${usersTab === 'banned' ? 'border-red-400 text-white bg-white/5' : 'border-transparent text-gray-400 hover:text-white'}`}
                            >
                                <span>Bannis ({bannedList.length})</span>
                            </button>
                        </div>

                        {/* Tab Content: Active Chatters */}
                        {usersTab === 'chatters' && (
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {uniqueChatters.map(user => {
                                    const roleMeta = ROLE_META[user.role] || ROLE_META.user;
                                    const isBanned = bannedList.some(b => b.toUpperCase() === user.pseudo.toUpperCase());

                                    return (
                                        <div
                                            key={user.pseudo}
                                            onClick={() => setSelectedUser(user.pseudo)}
                                            className="p-1.5 rounded hover:bg-white/5 flex items-center justify-between cursor-pointer transition-colors group"
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <span className="text-xs">{user.country === 'FR' ? '🇫🇷' : '🌐'}</span>
                                                <span className="font-bold text-xs truncate" style={{ color: user.color }}>
                                                    {user.pseudo}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {user.role !== 'user' && (
                                                    <span className={`text-[9px] px-1 py-0.2 rounded border font-black ${roleMeta.badge}`}>
                                                        {roleMeta.icon}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-gray-500 font-mono">
                                                    {user.count} m.
                                                </span>
                                                <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-white transition-colors" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Tab Content: Banned List */}
                        {usersTab === 'banned' && (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="p-2 border-b border-[#26262c]">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            if (manualBanInput.trim()) {
                                                handleBanUser(manualBanInput.trim());
                                                setManualBanInput('');
                                            }
                                        }}
                                        className="flex gap-1"
                                    >
                                        <input
                                            type="text"
                                            value={manualBanInput}
                                            onChange={(e) => setManualBanInput(e.target.value)}
                                            placeholder="Pseudo à bannir..."
                                            className="flex-1 px-2 py-1 bg-[#0e0e10] border border-white/10 rounded text-xs text-white placeholder-gray-500 focus:outline-none"
                                        />
                                        <button
                                            type="submit"
                                            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold cursor-pointer"
                                        >
                                            Ban
                                        </button>
                                    </form>
                                </div>

                                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                    {bannedList.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-gray-500 text-xs">
                                            Aucun utilisateur banni
                                        </div>
                                    ) : (
                                        bannedList.map(pseudo => (
                                            <div
                                                key={pseudo}
                                                className="p-1.5 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-between text-xs"
                                            >
                                                <span className="font-bold text-red-400 truncate">@{pseudo}</span>
                                                <button
                                                    onClick={() => handleUnbanUser(pseudo)}
                                                    className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer transition-colors"
                                                >
                                                    Débannir
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── RIGHT COLUMN 3: MOD AUDIT LOG (IF OPEN) ── */}
                {showModLog && (
                    <div className="w-64 sm:w-72 border-l border-[#26262c] bg-[#18181b] flex flex-col shrink-0 overflow-hidden">
                        <div className="h-10 border-b border-[#26262c] px-3 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-black uppercase tracking-wider text-gray-300">Journal d'Actions</span>
                            </div>
                            <button
                                onClick={() => { setActionLogs([]); localStorage.removeItem('dropsiders_mod_logs'); }}
                                className="text-[10px] text-gray-500 hover:text-white cursor-pointer"
                            >
                                Effacer
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-xs">
                            {actionLogs.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-500 text-xs">
                                    Aucune action récente
                                </div>
                            ) : (
                                actionLogs.map(log => (
                                    <div 
                                        key={log.id} 
                                        className="p-2 rounded bg-[#1f1f23] border border-white/5 space-y-1 text-[11px]"
                                    >
                                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                                            <span className="font-bold text-emerald-400">🛡️ {log.modPseudo}</span>
                                            <span className="font-mono text-gray-500">{log.timestamp}</span>
                                        </div>
                                        <div className="text-gray-200">
                                            <span className="font-black text-cyan-400 uppercase text-[9px] mr-1.5 px-1 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/20">
                                                {log.actionType}
                                            </span>
                                            {log.targetPseudo && <span className="font-bold text-amber-300">@{log.targetPseudo} </span>}
                                            <span>{log.detail}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════
                USER CARD DRAWER / MODAL (TWITCH USER CARD)
            ═══════════════════════════════════════════════════════════ */}
            {selectedUserDetails && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="w-full max-w-lg bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="p-4 border-b border-[#26262c] flex items-center justify-between bg-[#1f1f23]">
                            <div className="flex items-center gap-3">
                                <div 
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black border-2"
                                    style={{ borderColor: selectedUserDetails.color, color: selectedUserDetails.color, backgroundColor: `${selectedUserDetails.color}15` }}
                                >
                                    {selectedUserDetails.pseudo.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-black text-white" style={{ color: selectedUserDetails.color }}>
                                            {selectedUserDetails.pseudo}
                                        </h2>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-wider ${ROLE_META[selectedUserDetails.role].badge}`}>
                                            {ROLE_META[selectedUserDetails.role].icon} {ROLE_META[selectedUserDetails.role].label}
                                        </span>
                                        {selectedUserDetails.isBanned && (
                                            <span className="px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-black uppercase">
                                                BANNI
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        Pays : {selectedUserDetails.country} • {selectedUserDetails.messageCount} messages au total
                                    </span>
                                </div>
                            </div>

                            <button 
                                onClick={() => setSelectedUser(null)}
                                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-4 overflow-y-auto space-y-4">
                            {/* Role Switcher */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">
                                    Attribuer un Rôle
                                </label>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {(['user', 'vip', 'artist', 'mod', 'admin'] as ChatRole[]).map(r => (
                                        <button
                                            key={r}
                                            onClick={() => handleChangeRole(selectedUserDetails.pseudo, r)}
                                            className={`py-1.5 text-xs font-bold rounded border transition-all cursor-pointer ${selectedUserDetails.role === r ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-[#1f1f23] text-gray-300 border-white/5 hover:border-white/20'}`}
                                        >
                                            {ROLE_META[r].icon} {ROLE_META[r].label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sanctions Buttons */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">
                                    Sanctions Instantanées
                                </label>
                                <div className="grid grid-cols-4 gap-1.5">
                                    <button
                                        onClick={() => handleTimeoutUser(selectedUserDetails.pseudo, 1, '1s (Purge)')}
                                        className="py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-xs font-bold cursor-pointer"
                                    >
                                        ⏱️ Purge (1s)
                                    </button>
                                    <button
                                        onClick={() => handleTimeoutUser(selectedUserDetails.pseudo, 60, '1 minute')}
                                        className="py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-xs font-bold cursor-pointer"
                                    >
                                        ⏱️ Timeout 1m
                                    </button>
                                    <button
                                        onClick={() => handleTimeoutUser(selectedUserDetails.pseudo, 600, '10 minutes')}
                                        className="py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-xs font-bold cursor-pointer"
                                    >
                                        ⏱️ Timeout 10m
                                    </button>
                                    <button
                                        onClick={() => handleTimeoutUser(selectedUserDetails.pseudo, 86400, '24 heures')}
                                        className="py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-xs font-bold cursor-pointer"
                                    >
                                        ⏱️ Timeout 24h
                                    </button>
                                </div>

                                <div className="mt-2">
                                    {selectedUserDetails.isBanned ? (
                                        <button
                                            onClick={() => handleUnbanUser(selectedUserDetails.pseudo)}
                                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                                        >
                                            <UserCheck className="w-4 h-4" />
                                            <span>Lever le Bannissement de @{selectedUserDetails.pseudo}</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleBanUser(selectedUserDetails.pseudo)}
                                            className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                                        >
                                            <UserX className="w-4 h-4" />
                                            <span>Bannir définitivement @{selectedUserDetails.pseudo}</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Recent messages from this user */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">
                                    Historique des Messages Récents ({selectedUserDetails.messages.length})
                                </label>
                                <div className="bg-[#0e0e10] border border-white/5 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1.5">
                                    {selectedUserDetails.messages.length === 0 ? (
                                        <span className="text-xs text-gray-500 italic">Aucun message conservé dans la session</span>
                                    ) : (
                                        selectedUserDetails.messages.map(m => (
                                            <div key={m.id} className="flex items-start justify-between gap-2 text-xs py-1 border-b border-white/[0.03]">
                                                <div className="flex-1 break-words">
                                                    <span className="text-[10px] text-gray-500 mr-2 font-mono">{m.time}</span>
                                                    <span className="text-gray-200">{m.text}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteMessage(m.id, selectedUserDetails.pseudo)}
                                                    className="p-1 text-gray-500 hover:text-red-400 cursor-pointer"
                                                    title="Supprimer ce message"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                LIVE POLL CREATION MODAL
            ═══════════════════════════════════════════════════════════ */}
            {isPollModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="w-full max-w-md bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-[#26262c] pb-3">
                            <div className="flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-[#bf94ff]" />
                                <h3 className="text-sm font-black uppercase text-white tracking-wider">Créer un Sondage Express</h3>
                            </div>
                            <button onClick={() => setIsPollModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePoll} className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">
                                    Question
                                </label>
                                <input
                                    type="text"
                                    value={pollQuestion}
                                    onChange={(e) => setPollQuestion(e.target.value)}
                                    placeholder="ex: Quel DJ est le plus chaud ce soir ?"
                                    required
                                    className="w-full px-3 py-2 bg-[#0e0e10] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">
                                        Choix 1
                                    </label>
                                    <input
                                        type="text"
                                        value={pollOption1}
                                        onChange={(e) => setPollOption1(e.target.value)}
                                        placeholder="Option 1"
                                        required
                                        className="w-full px-3 py-2 bg-[#0e0e10] border border-white/10 rounded-lg text-xs text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">
                                        Choix 2
                                    </label>
                                    <input
                                        type="text"
                                        value={pollOption2}
                                        onChange={(e) => setPollOption2(e.target.value)}
                                        placeholder="Option 2"
                                        required
                                        className="w-full px-3 py-2 bg-[#0e0e10] border border-white/10 rounded-lg text-xs text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">
                                    Durée
                                </label>
                                <select
                                    value={pollDuration}
                                    onChange={(e) => setPollDuration(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-[#0e0e10] border border-white/10 rounded-lg text-xs text-white focus:outline-none cursor-pointer"
                                >
                                    <option value={30}>30 secondes</option>
                                    <option value={60}>1 minute</option>
                                    <option value={120}>2 minutes</option>
                                    <option value={300}>5 minutes</option>
                                </select>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsPollModalOpen(false)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-bold cursor-pointer"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#9146FF] hover:bg-[#772ce8] text-white rounded-lg text-xs font-bold cursor-pointer shadow-[0_0_15px_rgba(145,70,255,0.4)]"
                                >
                                    Lancer le Sondage
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
