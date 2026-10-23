import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Shield, Crown, Clock, Trash2, Pin, Volume2, VolumeX,
    RefreshCw, Send, Check, X, Search, Filter, AlertTriangle,
    UserX, UserCheck, Flame, BarChart2, Bell, BellOff,
    ExternalLink, Eye, ChevronRight, MessageSquare, Sparkles,
    Radio, Play, Pause, ArrowLeft, MoreHorizontal, Settings,
    Tv, ChevronDown, Info, Pencil, Zap, Target, Bot
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SEO } from '../components/utils/SEO';
import {
    DEFAULT_TV_BLOCKS,
    STORAGE_TV_BLOCKS_KEY,
    getActiveTVBlock,
    getElapsedSecondsInBlock
} from '../utils/tvSchedule';

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
    const [isLive, setIsLive] = useState<boolean>(() => {
        try { return localStorage.getItem('dropsiders_live_active') === 'true'; } catch { return false; }
    });
    const [liveVideoId, setLiveVideoId] = useState<string>(() => {
        try { return localStorage.getItem('dropsiders_live_video_id') || ''; } catch { return ''; }
    });

    // ── TV schedule video for fallback ──
    const tvVideoId = useMemo(() => {
        try {
            const saved = localStorage.getItem(STORAGE_TV_BLOCKS_KEY);
            const blocks = saved ? JSON.parse(saved) : DEFAULT_TV_BLOCKS;
            const block = getActiveTVBlock(blocks);
            const videos = block?.videos || [];
            if (videos.length === 0) return 'hSq5aGvBJ04';
            const elapsed = getElapsedSecondsInBlock(block);
            const totalDur = videos.reduce((s: number, v: any) => s + (v.duration || 3600), 0);
            const pos = totalDur > 0 ? elapsed % totalDur : 0;
            let acc = 0;
            for (const v of videos) {
                acc += (v.duration || 3600);
                if (pos < acc) return v.youtubeId;
            }
            return videos[0]?.youtubeId || 'hSq5aGvBJ04';
        } catch { return 'hSq5aGvBJ04'; }
    }, []);

    const playerVideoId = isLive && liveVideoId ? liveVideoId : tvVideoId;
    const liveStatus = isLive ? '🔴 EN DIRECT' : '📺 DROPSIDERS TV (24/7)';
    const liveStatusColor = isLive ? 'text-red-400 bg-red-500/10 border-red-500/30' : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';

    // ── Communauté panel collapsibles ──
    const [expandDiffuseur, setExpandDiffuseur] = useState(true);
    const [expandMods, setExpandMods] = useState(true);
    const [expandBots, setExpandBots] = useState(true);
    const [expandViewers, setExpandViewers] = useState(true);
    const [communauteSearch, setCommunauteSearch] = useState('');

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

    // ── Moderators / Bots derived from messages ──
    const mods = useMemo(() => uniqueChatters.filter(u => u.role === 'mod' || u.role === 'admin'), [uniqueChatters]);
    const bots = useMemo(() => [
        { pseudo: 'Dropsiders_Bot', role: 'bot' as const },
        { pseudo: 'AutoMod', role: 'bot' as const },
        { pseudo: 'Wizebot', role: 'bot' as const },
    ], []);
    const viewers = useMemo(() => uniqueChatters.filter(u => u.role === 'user' || u.role === 'vip' || u.role === 'artist'), [uniqueChatters]);

    const filteredViewers = useMemo(() => {
        const q = communauteSearch.toLowerCase();
        if (!q) return viewers;
        return viewers.filter(u => u.pseudo.toLowerCase().includes(q));
    }, [viewers, communauteSearch]);

    return (
        <div className="w-screen h-screen bg-[#0e0e10] text-[#efeff1] font-sans flex overflow-hidden select-none">
            <SEO 
                title="Vue Modérateur | Dropsiders TV" 
                description="Espace de contrôle et de modération officiel Dropsiders TV."
            />

            {/* ══════════════════════════════════════════════════
                FAR-LEFT VERTICAL ICON RAIL
            ══════════════════════════════════════════════════ */}
            <nav className="w-12 bg-[#0e0e10] border-r border-[#26262c] flex flex-col items-center py-3 gap-4 shrink-0 z-50">
                {/* Dropsiders logo */}
                <button
                    onClick={() => navigate('/tv')}
                    className="w-8 h-8 rounded-lg bg-[#9146FF]/20 border border-[#9146FF]/40 flex items-center justify-center text-[#bf94ff] hover:bg-[#9146FF]/30 transition-all cursor-pointer"
                    title="Dropsiders TV"
                >
                    <Tv className="w-4 h-4" />
                </button>

                <div className="w-6 h-px bg-white/10" />

                {/* Nav icons */}
                {[
                    { icon: Pencil, label: 'Annotations', active: false },
                    { icon: Zap, label: 'Actions rapides', active: showQuickActions, onClick: () => setShowQuickActions(!showQuickActions) },
                    { icon: MessageSquare, label: 'Chat', active: true },
                    { icon: Target, label: 'AutoMod', active: showAutoMod, onClick: () => setShowAutoMod(!showAutoMod), badge: autoModQueue.length },
                    { icon: Shield, label: 'Modération', active: false },
                    { icon: Clock, label: 'Journal', active: false },
                    { icon: Settings, label: 'Paramètres', active: false },
                ].map(({ icon: Icon, label, active, onClick, badge }, i) => (
                    <button
                        key={i}
                        onClick={onClick}
                        title={label}
                        className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                            active
                                ? 'bg-white/10 text-white'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                    >
                        <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                        {badge != null && badge > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                                {badge}
                            </span>
                        )}
                    </button>
                ))}

                <div className="mt-auto">
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        title={soundEnabled ? 'Sons activés' : 'Sons désactivés'}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                            soundEnabled ? 'text-emerald-400 hover:bg-white/5' : 'text-gray-600 hover:bg-white/5'
                        }`}
                    >
                        {soundEnabled ? <Bell style={{ width: 18, height: 18 }} /> : <BellOff style={{ width: 18, height: 18 }} />}
                    </button>
                </div>
            </nav>

            {/* ══════════════════════════════════════════════════
                MAIN CONTENT (full height, 3 columns)
            ══════════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* ── TOP HEADER BAR ── */}
                <header className="h-12 bg-[#18181b] border-b border-[#26262c] flex items-center justify-between px-4 shrink-0 z-40">
                    {/* Left: Avatar + Name + Dropdown + Status */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 cursor-pointer group">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#9146FF] to-[#00e5ff] flex items-center justify-center text-[10px] font-black text-white">
                                DS
                            </div>
                            <span className="text-sm font-bold text-white">Dropsiders TV</span>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" />
                        </div>

                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-black uppercase tracking-wider ${liveStatusColor}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-cyan-400'}`} />
                            {liveStatus}
                        </div>

                        {/* Live / TV toggle for mods */}
                        <button
                            onClick={() => {
                                const next = !isLive;
                                setIsLive(next);
                                try { localStorage.setItem('dropsiders_live_active', String(next)); } catch {}
                            }}
                            className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all cursor-pointer"
                            title="Basculer Live / TV 24/7"
                        >
                            {isLive ? '📺 Passer en TV' : '🔴 Simuler Live'}
                        </button>
                    </div>

                    {/* Right: Stats + tools */}
                    <div className="flex items-center gap-2">
                        <div className="hidden md:flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1f1f23] border border-white/5 text-[11px] text-gray-300">
                                <span className="text-cyan-400">👥</span>
                                <span className="font-bold">{uniqueChatters.length}</span>
                                <span className="text-gray-500">chatteurs</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1f1f23] border border-white/5 text-[11px] text-gray-300">
                                <span className="text-emerald-400">💬</span>
                                <span className="font-bold">{messages.length}</span>
                                <span className="text-gray-500">msgs</span>
                            </div>
                            {slowMode > 0 && (
                                <div className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 font-bold">
                                    <Clock className="w-3 h-3" />
                                    Ralenti {slowMode}s
                                </div>
                            )}
                        </div>
                        <div className="h-4 w-px bg-white/10" />
                        <button
                            onClick={() => fetchModState()}
                            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                            title="Actualiser"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => navigate('/tv')}
                            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                            title="Quitter la vue modérateur"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* ── 3-COLUMN WORKSPACE ── */}
                <div className="flex-1 flex overflow-hidden">

                    {/* ════════════════════════════════════
                        COLUMN 1 – FLUX + BOTTOM SPLIT
                    ════════════════════════════════════ */}
                    <div className="flex flex-col border-r border-[#26262c] bg-[#18181b] shrink-0" style={{ width: 380 }}>

                        {/* ── FLUX panel ── */}
                        <div className="flex flex-col border-b border-[#26262c]">
                            {/* Flux header */}
                            <div className="h-9 px-3 flex items-center justify-between shrink-0">
                                <span className="text-xs font-black uppercase tracking-wider text-gray-200">Flux</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setIsPlayerMuted(!isPlayerMuted)}
                                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer transition-colors"
                                        title={isPlayerMuted ? 'Activer le son' : 'Couper'}
                                    >
                                        {isPlayerMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                                    </button>
                                    <a href="/tv" target="_blank" rel="noreferrer"
                                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer transition-colors"
                                        title="Ouvrir en plein écran"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                    <button className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer">
                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Stream info row (like Twitch: avatar, title, game) */}
                            <div className="px-3 pb-2 flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9146FF] to-[#00e5ff] flex items-center justify-center text-[10px] font-black text-white shrink-0">
                                    DS
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-black text-white truncate">
                                        {isLive ? '🔴 Dropsiders TV — Live en cours' : '📺 Dropsiders TV — Programme continu 24/7'}
                                    </div>
                                    <div className="text-[10px] text-gray-400 truncate">DJ Sets & Festivals • Music</div>
                                </div>
                                <div className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest shrink-0 ${isLive ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'}`}>
                                    {isLive ? 'LIVE' : 'TV'}
                                </div>
                            </div>

                            {/* Video Player */}
                            <div className="px-3 pb-3">
                                <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-white/10">
                                    {!isLive ? (
                                        /* TV fallback: YouTube iframe with seek to current position */
                                        <iframe
                                            key={playerVideoId + '_tv'}
                                            src={`https://www.youtube-nocookie.com/embed/${playerVideoId}?autoplay=1&mute=${isPlayerMuted ? 1 : 0}&controls=1&modestbranding=1&rel=0&cc_load_policy=0`}
                                            className="w-full h-full border-0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            title="Dropsiders TV"
                                        />
                                    ) : (
                                        /* Live stream iframe */
                                        <iframe
                                            key={playerVideoId + '_live'}
                                            src={`https://www.youtube-nocookie.com/embed/${playerVideoId}?autoplay=1&mute=${isPlayerMuted ? 1 : 0}&controls=1&modestbranding=1&rel=0`}
                                            className="w-full h-full border-0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            title="Live Stream"
                                        />
                                    )}
                                    {/* TV badge overlay */}
                                    {!isLive && (
                                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 border border-cyan-500/40 rounded px-2 py-0.5">
                                            <Tv className="w-3 h-3 text-cyan-400" />
                                            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-wider">TV 24/7</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── BOTTOM SPLIT: Actions De Modérateur + File AutoMod ── */}
                        <div className="flex-1 flex overflow-hidden">

                            {/* Actions De Modérateur (left) */}
                            <div className="flex-1 flex flex-col border-r border-[#26262c] overflow-hidden">
                                <div className="h-9 px-2.5 flex items-center justify-between shrink-0 border-b border-[#26262c]">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-gray-200">Actions De Modérateur</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button className="px-1.5 py-0.5 rounded text-[10px] text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 cursor-pointer transition-colors">
                                            Filtre
                                        </button>
                                        <button className="p-1 rounded hover:bg-white/5 text-gray-500 cursor-pointer">
                                            <MoreHorizontal className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="px-2.5 py-1.5 border-b border-[#26262c]">
                                    <span className="text-[10px] text-gray-400 font-bold">{actionLogs.length} action{actionLogs.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                                    {actionLogs.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-gray-600 text-[11px]">Aucune action</div>
                                    ) : actionLogs.map(log => {
                                        const icons: Record<string, string> = {
                                            DELETE: '🗑️', BAN: '🚫', UNBAN: '✅', TIMEOUT: '⏱️',
                                            SLOWMODE: '🐢', PIN: '📌', UNPIN: '📌', CLEAR: '🧹',
                                            ROLE_CHANGE: '👑', AUTOMOD_ACCEPT: '✅', AUTOMOD_REJECT: '❌'
                                        };
                                        return (
                                            <div key={log.id} className="flex gap-2 items-start">
                                                <div className="w-7 h-7 rounded-full bg-[#1f1f23] border border-white/5 flex items-center justify-center text-sm shrink-0">
                                                    {icons[log.actionType] || '🛡️'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {log.targetPseudo && (
                                                        <div className="text-[11px] font-bold text-amber-300 truncate">{log.targetPseudo}</div>
                                                    )}
                                                    <div className="text-[10px] text-gray-400 leading-tight truncate">{log.detail}</div>
                                                    <div className="text-[9px] text-gray-600 font-mono mt-0.5">{log.modPseudo} · {log.timestamp}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Quick actions bottom */}
                                {showQuickActions && (
                                    <div className="p-2 border-t border-[#26262c] space-y-1.5">
                                        <div className="text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1">Mode Ralenti</div>
                                        <div className="grid grid-cols-5 gap-1">
                                            {[0, 3, 10, 30, 60].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => handleSetSlowMode(s)}
                                                    className={`py-1 text-[10px] font-black rounded border transition-all cursor-pointer ${
                                                        slowMode === s
                                                            ? 'bg-amber-500 text-black border-amber-400'
                                                            : 'bg-[#1f1f23] text-gray-300 border-white/5 hover:border-white/20'
                                                    }`}
                                                >
                                                    {s === 0 ? 'OFF' : `${s}s`}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-2 gap-1">
                                            <button
                                                onClick={() => setIsPollModalOpen(true)}
                                                className="py-1.5 text-[10px] font-bold rounded bg-[#9146FF]/20 hover:bg-[#9146FF]/30 border border-[#9146FF]/40 text-[#bf94ff] cursor-pointer flex items-center justify-center gap-1"
                                            >
                                                <BarChart2 className="w-3 h-3" /> Sondage
                                            </button>
                                            <button
                                                onClick={handleClearChat}
                                                className="py-1.5 text-[10px] font-bold rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 cursor-pointer flex items-center justify-center gap-1"
                                            >
                                                <Trash2 className="w-3 h-3" /> Purger
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* File D'attente De L'AutoMod (right) */}
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="h-9 px-2.5 flex items-center justify-between shrink-0 border-b border-[#26262c]">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-gray-200">File D'attente De L'AutoMod</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button className="px-1.5 py-0.5 rounded text-[10px] text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 cursor-pointer">
                                            Filtre
                                        </button>
                                        <button className="p-1 rounded hover:bg-white/5 text-gray-500 cursor-pointer">
                                            <MoreHorizontal className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    {autoModQueue.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                            <div className="w-12 h-12 rounded-full bg-[#1f1f23] border border-white/5 flex items-center justify-center mb-3">
                                                <Shield className="w-6 h-6 text-gray-600" />
                                            </div>
                                            <div className="text-[11px] text-gray-500 font-bold">L'AutoMod est désactivé</div>
                                            <div className="text-[10px] text-gray-600 mt-1 leading-relaxed">
                                                L'AutoMod retient automatiquement les messages risqués afin que les modérateurs puissent les vérifier.
                                            </div>
                                        </div>
                                    ) : autoModQueue.map(item => (
                                        <div key={item.id} className="bg-[#1f1f23] border border-amber-500/30 rounded-lg p-2.5 space-y-2">
                                            <div className="flex items-center justify-between text-[11px]">
                                                <button
                                                    onClick={() => setSelectedUser(item.messageItem.pseudo)}
                                                    className="font-bold text-amber-300 hover:underline cursor-pointer"
                                                >
                                                    @{item.messageItem.pseudo}
                                                </button>
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                                                    item.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                                                    item.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-gray-500/20 text-gray-400'
                                                }`}>{item.severity}</span>
                                            </div>
                                            <div className="text-[10px] text-amber-400 font-medium bg-amber-500/10 px-2 py-1 rounded">{item.reason}</div>
                                            <p className="text-[11px] text-white bg-black/40 p-2 rounded border border-white/5 break-words font-mono">"{item.messageItem.message}"</p>
                                            <div className="grid grid-cols-2 gap-1">
                                                <button onClick={() => handleAutoModAccept(item)} className="py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer">
                                                    <Check className="w-3.5 h-3.5" /> Autoriser
                                                </button>
                                                <button onClick={() => handleAutoModReject(item)} className="py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer">
                                                    <X className="w-3.5 h-3.5" /> Refuser
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ════════════════════════════════════
                        COLUMN 2 – CHAT
                    ════════════════════════════════════ */}
                    <div className="flex-1 flex flex-col bg-[#0e0e10] overflow-hidden min-w-[300px]">

                        {/* Chat header */}
                        <div className="h-9 bg-[#18181b] border-b border-[#26262c] px-3 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase tracking-wider text-gray-200">Chat</span>
                                <span className="text-[10px] text-gray-500">({filteredMessages.length})</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {/* Modes dropdown */}
                                <button className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/5 text-[11px] text-gray-300 border border-white/10 cursor-pointer">
                                    Modes <ChevronDown className="w-3 h-3" />
                                </button>
                                {/* Search */}
                                <div className="relative">
                                    <Search className="w-3 h-3 text-gray-500 absolute left-2 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={searchFilter}
                                        onChange={e => setSearchFilter(e.target.value)}
                                        placeholder="Filtrer..."
                                        className="pl-6 pr-2 py-0.5 bg-[#0e0e10] border border-white/10 rounded text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 w-28 transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => setAutoScroll(!autoScroll)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                        autoScroll ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-400'
                                    }`}
                                >
                                    {autoScroll ? '↓ Auto' : '⏸ Pause'}
                                </button>
                            </div>
                        </div>

                        {/* Objectif / Goal progress bar */}
                        <div className="px-3 py-1.5 bg-[#18181b] border-b border-[#26262c] shrink-0">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-gray-300 font-bold">Objectif Drops</span>
                                <span className="text-[10px] text-gray-400">{messages.length} / 500 messages</span>
                            </div>
                            <div className="h-1.5 bg-[#26262c] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#9146FF] to-[#00e5ff] rounded-full transition-all"
                                    style={{ width: `${Math.min(100, (messages.length / 500) * 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Pinned message */}
                        {pinnedMessage && (
                            <div className="bg-[#1f1f23] border-b border-amber-500/40 px-3 py-2 flex items-center justify-between gap-3 shrink-0">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span className="text-[11px] font-bold text-amber-300">@{pinnedMessage.pseudo}:</span>
                                    <span className="text-[11px] text-gray-200 truncate">{pinnedMessage.message}</span>
                                </div>
                                <button onClick={() => handlePinMessage(null)} className="text-gray-400 hover:text-white cursor-pointer shrink-0">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        {/* Messages area */}
                        <div ref={chatScrollRef} className="flex-1 overflow-y-auto py-2 space-y-0.5">
                            {filteredMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600 text-xs">
                                    <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                                    <span>Bienvenue sur le chat de Dropsiders TV !</span>
                                </div>
                            ) : filteredMessages.map(msg => {
                                const cleanPseudo = (msg.pseudo || '').toLowerCase();
                                const userRole = roles[cleanPseudo] || msg.role || 'user';
                                const roleInfo = ROLE_META[userRole] || ROLE_META.user;
                                const isBanned = bannedList.some(b => b.toUpperCase() === (msg.pseudo || '').toUpperCase());

                                return (
                                    <div
                                        key={msg.id}
                                        className={`group relative flex items-start gap-2 py-1.5 px-3 hover:bg-white/[0.03] transition-colors ${
                                            msg.isHighlighted ? 'bg-amber-500/10 border-l-2 border-amber-400' : ''
                                        }`}
                                    >
                                        {/* Timestamp */}
                                        <span className="text-[10px] text-gray-600 font-mono shrink-0 pt-px">{msg.time}</span>

                                        {/* Flag */}
                                        {msg.country && (
                                            <span className="text-[11px] shrink-0 pt-px">
                                                {msg.country === 'FR' ? '🇫🇷' : msg.country === 'BE' ? '🇧🇪' : msg.country === 'CH' ? '🇨🇭' : '🌐'}
                                            </span>
                                        )}

                                        {/* Role badge */}
                                        {userRole !== 'user' && (
                                            <span className={`px-1 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider shrink-0 ${roleInfo.badge}`}>
                                                {roleInfo.icon} {roleInfo.label}
                                            </span>
                                        )}

                                        {/* Pseudo */}
                                        <button
                                            onClick={() => setSelectedUser(msg.pseudo)}
                                            style={{ color: msg.color || '#00e5ff' }}
                                            className="font-bold text-xs hover:underline cursor-pointer shrink-0 pt-px"
                                        >
                                            {msg.pseudo}:
                                        </button>

                                        {/* Message */}
                                        <span className={`text-xs text-gray-200 break-words flex-1 leading-relaxed pt-px ${isBanned ? 'line-through opacity-40' : ''}`}>
                                            {msg.message}
                                        </span>

                                        {/* Hover actions */}
                                        <div className="hidden group-hover:flex items-center gap-0.5 bg-[#1f1f23] border border-white/10 rounded px-1 py-0.5 shadow-lg shrink-0 z-10">
                                            <button onClick={() => handleTimeoutUser(msg.pseudo, 1, '1s')} className="p-1 text-gray-400 hover:text-amber-400 cursor-pointer text-[10px]" title="Purge">1s</button>
                                            <button onClick={() => handleTimeoutUser(msg.pseudo, 600, '10m')} className="p-1 text-gray-400 hover:text-amber-400 cursor-pointer text-[10px]" title="Timeout 10m">10m</button>
                                            <button onClick={() => handleDeleteMessage(msg.id, msg.pseudo)} className="p-1 text-gray-400 hover:text-red-400 cursor-pointer" title="Supprimer"><Trash2 className="w-3 h-3" /></button>
                                            <button onClick={() => handleBanUser(msg.pseudo)} className="p-1 text-gray-400 hover:text-red-400 cursor-pointer" title="Bannir"><UserX className="w-3 h-3" /></button>
                                            <button onClick={() => handlePinMessage(msg)} className="p-1 text-gray-400 hover:text-amber-400 cursor-pointer" title="Épingler"><Pin className="w-3 h-3" /></button>
                                            <button onClick={() => setSelectedUser(msg.pseudo)} className="p-1 text-gray-400 hover:text-cyan-400 cursor-pointer" title="Fiche"><Eye className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Chat input bar */}
                        <div className="p-2.5 bg-[#18181b] border-t border-[#26262c] shrink-0">
                            {isAnnouncement && (
                                <div className="mb-2 px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded text-[11px] text-amber-300 font-bold flex items-center justify-between">
                                    <span>📢 Mode Annonce activé</span>
                                    <button onClick={() => setIsAnnouncement(false)} className="cursor-pointer"><X className="w-3 h-3" /></button>
                                </div>
                            )}
                            <form onSubmit={e => { e.preventDefault(); handleSendChatMessage(); }} className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAnnouncement(!isAnnouncement)}
                                    className={`px-2 py-2 rounded text-xs font-black transition-all cursor-pointer ${isAnnouncement ? 'bg-amber-500 text-black' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                                    title="Annonce officielle"
                                >📢</button>
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={e => setInputMessage(e.target.value)}
                                    placeholder="Envoyer un message"
                                    className="flex-1 px-3 py-2 bg-[#0e0e10] border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#9146FF] transition-colors"
                                />
                                {/* Bits icon */}
                                <button type="button" className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer" title="Drops">
                                    <Sparkles className="w-4 h-4" />
                                </button>
                                <button
                                    type="submit"
                                    disabled={!inputMessage.trim()}
                                    className="px-4 py-2 bg-[#9146FF] hover:bg-[#772ce8] disabled:opacity-30 disabled:pointer-events-none text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                    Chat
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* ════════════════════════════════════
                        COLUMN 3 – COMMUNAUTÉ
                    ════════════════════════════════════ */}
                    {showUsersPanel && (
                        <div className="flex flex-col border-l border-[#26262c] bg-[#18181b] shrink-0 overflow-hidden" style={{ width: 240 }}>
                            {/* Header */}
                            <div className="h-9 px-3 flex items-center justify-between shrink-0 border-b border-[#26262c]">
                                <span className="text-xs font-black uppercase tracking-wider text-gray-200">Communauté</span>
                                <button onClick={() => fetchModState()} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-white cursor-pointer">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Search */}
                            <div className="px-3 py-2 border-b border-[#26262c]">
                                <div className="relative">
                                    <Search className="w-3 h-3 text-gray-500 absolute left-2 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={communauteSearch}
                                        onChange={e => setCommunauteSearch(e.target.value)}
                                        placeholder="Filtre"
                                        className="w-full pl-6 pr-2 py-1 bg-[#0e0e10] border border-white/10 rounded text-[11px] text-white placeholder-gray-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">

                                {/* Diffuseur */}
                                <div className="border-b border-[#26262c]">
                                    <button
                                        onClick={() => setExpandDiffuseur(!expandDiffuseur)}
                                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                            <span className="text-[11px] font-black text-gray-200">Diffuseur</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Info className="w-3.5 h-3.5 text-gray-500" />
                                            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${expandDiffuseur ? '' : '-rotate-90'}`} />
                                        </div>
                                    </button>
                                    {expandDiffuseur && (
                                        <div className="px-3 pb-2">
                                            <div className="flex items-center gap-2 py-1">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#9146FF] to-[#00e5ff] flex items-center justify-center text-[9px] font-black text-white">DS</div>
                                                <span className="text-[11px] font-bold text-white">Dropsiders TV</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Modérateurs */}
                                <div className="border-b border-[#26262c]">
                                    <button
                                        onClick={() => setExpandMods(!expandMods)}
                                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-[11px] font-black text-gray-200">Modérateurs</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Info className="w-3.5 h-3.5 text-gray-500" />
                                            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${expandMods ? '' : '-rotate-90'}`} />
                                        </div>
                                    </button>
                                    {expandMods && (
                                        <div className="px-3 pb-2 space-y-1">
                                            {mods.length === 0 ? (
                                                <div className="text-[10px] text-gray-600">Aucun modérateur actif</div>
                                            ) : mods.map(u => (
                                                <div key={u.pseudo} className="flex items-center justify-between py-0.5">
                                                    <button onClick={() => setSelectedUser(u.pseudo)} className="flex items-center gap-1.5 hover:text-white cursor-pointer">
                                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[8px] font-black text-emerald-400">{u.pseudo.slice(0,2).toUpperCase()}</div>
                                                        <span className="text-[11px] text-emerald-300 font-bold">{u.pseudo}</span>
                                                    </button>
                                                    <Info className="w-3 h-3 text-gray-600 cursor-pointer hover:text-gray-400" />
                                                </div>
                                            ))}
                                            {/* Default mods always shown */}
                                            {['Alex_Dropsiders', 'Wizebot'].filter(m => !mods.some(u => u.pseudo.toLowerCase() === m.toLowerCase())).map(m => (
                                                <div key={m} className="flex items-center justify-between py-0.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[8px] font-black text-emerald-400">{m.slice(0,2).toUpperCase()}</div>
                                                        <span className="text-[11px] text-gray-400">{m}</span>
                                                    </div>
                                                    <Info className="w-3 h-3 text-gray-600 cursor-pointer hover:text-gray-400" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Bots de chat */}
                                <div className="border-b border-[#26262c]">
                                    <button
                                        onClick={() => setExpandBots(!expandBots)}
                                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Bot className="w-3.5 h-3.5 text-cyan-400" />
                                            <span className="text-[11px] font-black text-gray-200">Bots de chat</span>
                                        </div>
                                        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${expandBots ? '' : '-rotate-90'}`} />
                                    </button>
                                    {expandBots && (
                                        <div className="px-3 pb-2 space-y-1">
                                            {bots.map(b => (
                                                <div key={b.pseudo} className="text-[11px] text-gray-400 py-0.5">{b.pseudo}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Spectateurs */}
                                <div>
                                    <button
                                        onClick={() => setExpandViewers(!expandViewers)}
                                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Eye className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-[11px] font-black text-gray-200">Spectateurs</span>
                                            <span className="text-[10px] text-gray-500">({filteredViewers.length})</span>
                                        </div>
                                        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${expandViewers ? '' : '-rotate-90'}`} />
                                    </button>
                                    {expandViewers && (
                                        <div className="px-3 pb-3 space-y-1">
                                            {filteredViewers.length === 0 ? (
                                                <div className="text-[10px] text-gray-600">Aucun spectateur actif</div>
                                            ) : filteredViewers.map(u => (
                                                <div key={u.pseudo} className="flex items-center justify-between py-0.5 group">
                                                    <button onClick={() => setSelectedUser(u.pseudo)} className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                                                        <span className="text-[10px]">{u.country === 'FR' ? '🇫🇷' : '🌐'}</span>
                                                        <span className="text-[11px] font-bold" style={{ color: u.color }}>{u.pseudo}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedUser(u.pseudo)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-gray-500 hover:text-white"
                                                    >
                                                        <Info className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                USER CARD MODAL
            ══════════════════════════════════════════════════ */}
            {selectedUserDetails && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
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
                                        <h2 className="text-base font-black" style={{ color: selectedUserDetails.color }}>{selectedUserDetails.pseudo}</h2>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${ROLE_META[selectedUserDetails.role].badge}`}>
                                            {ROLE_META[selectedUserDetails.role].icon} {ROLE_META[selectedUserDetails.role].label}
                                        </span>
                                        {selectedUserDetails.isBanned && <span className="px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-black">BANNI</span>}
                                    </div>
                                    <span className="text-xs text-gray-400">{selectedUserDetails.country} • {selectedUserDetails.messageCount} messages</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Attribuer un Rôle</label>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {(['user', 'vip', 'artist', 'mod', 'admin'] as ChatRole[]).map(r => (
                                        <button
                                            key={r}
                                            onClick={() => handleChangeRole(selectedUserDetails.pseudo, r)}
                                            className={`py-1.5 text-xs font-bold rounded border transition-all cursor-pointer ${
                                                selectedUserDetails.role === r
                                                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                                                    : 'bg-[#1f1f23] text-gray-300 border-white/5 hover:border-white/20'
                                            }`}
                                        >
                                            {ROLE_META[r].icon} {ROLE_META[r].label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Sanctions</label>
                                <div className="grid grid-cols-4 gap-1.5 mb-2">
                                    {[
                                        { label: '⏱️ Purge (1s)', s: 1, l: '1s' },
                                        { label: '⏱️ 1 min', s: 60, l: '1 minute' },
                                        { label: '⏱️ 10 min', s: 600, l: '10 minutes' },
                                        { label: '⏱️ 24h', s: 86400, l: '24 heures' },
                                    ].map(({ label, s, l }) => (
                                        <button key={s} onClick={() => handleTimeoutUser(selectedUserDetails.pseudo, s, l)}
                                            className="py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[11px] font-bold cursor-pointer"
                                        >{label}</button>
                                    ))}
                                </div>
                                {selectedUserDetails.isBanned ? (
                                    <button onClick={() => handleUnbanUser(selectedUserDetails.pseudo)}
                                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                                    ><UserCheck className="w-4 h-4" /> Lever le bannissement</button>
                                ) : (
                                    <button onClick={() => handleBanUser(selectedUserDetails.pseudo)}
                                        className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                                    ><UserX className="w-4 h-4" /> Bannir définitivement @{selectedUserDetails.pseudo}</button>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Messages récents ({selectedUserDetails.messages.length})</label>
                                <div className="bg-[#0e0e10] border border-white/5 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1.5">
                                    {selectedUserDetails.messages.length === 0 ? (
                                        <span className="text-xs text-gray-500 italic">Aucun message dans la session</span>
                                    ) : selectedUserDetails.messages.map(m => (
                                        <div key={m.id} className="flex items-start justify-between gap-2 text-xs py-1 border-b border-white/[0.03]">
                                            <div className="flex-1 break-words">
                                                <span className="text-[10px] text-gray-500 mr-2 font-mono">{m.time}</span>
                                                <span className="text-gray-200">{m.text}</span>
                                            </div>
                                            <button onClick={() => handleDeleteMessage(m.id, selectedUserDetails.pseudo)} className="p-1 text-gray-500 hover:text-red-400 cursor-pointer">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════
                POLL MODAL
            ══════════════════════════════════════════════════ */}
            {isPollModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-[#26262c] pb-3">
                            <div className="flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-[#bf94ff]" />
                                <h3 className="text-sm font-black uppercase text-white tracking-wider">Créer un Sondage Express</h3>
                            </div>
                            <button onClick={() => setIsPollModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleCreatePoll} className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Question</label>
                                <input type="text" value={pollQuestion} onChange={e => setPollQuestion(e.target.value)}
                                    placeholder="ex: Quel DJ préférez-vous ?"
                                    required className="w-full px-3 py-2 bg-[#0e0e10] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[{val: pollOption1, set: setPollOption1, label: 'Choix 1'}, {val: pollOption2, set: setPollOption2, label: 'Choix 2'}].map(({val, set, label}) => (
                                    <div key={label}>
                                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">{label}</label>
                                        <input type="text" value={val} onChange={e => set(e.target.value)} placeholder={label} required
                                            className="w-full px-3 py-2 bg-[#0e0e10] border border-white/10 rounded-lg text-xs text-white focus:outline-none" />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Durée</label>
                                <select value={pollDuration} onChange={e => setPollDuration(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-[#0e0e10] border border-white/10 rounded-lg text-xs text-white focus:outline-none cursor-pointer">
                                    <option value={30}>30 secondes</option>
                                    <option value={60}>1 minute</option>
                                    <option value={120}>2 minutes</option>
                                    <option value={300}>5 minutes</option>
                                </select>
                            </div>
                            <div className="pt-2 flex items-center justify-end gap-2">
                                <button type="button" onClick={() => setIsPollModalOpen(false)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-bold cursor-pointer">Annuler</button>
                                <button type="submit"
                                    className="px-4 py-2 bg-[#9146FF] hover:bg-[#772ce8] text-white rounded-lg text-xs font-bold cursor-pointer shadow-[0_0_15px_rgba(145,70,255,0.4)]">Lancer le Sondage</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
