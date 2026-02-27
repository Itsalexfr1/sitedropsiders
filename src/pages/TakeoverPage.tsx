import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Globe, Mail, Youtube, MessageSquare, Trash2, ShieldAlert, X, Clock, Users, Shield, Pencil, List, Maximize2, Minimize2, Instagram, Music2, Facebook, Twitter } from 'lucide-react';

interface TakeoverProps {
    settings: {
        youtubeId: string;
        chat_enabled: boolean;
        title: string;
        moderators?: string;
        lineup?: string;
    };
}

export function TakeoverPage({ settings }: TakeoverProps) {
    const [viewersCount, setViewersCount] = useState(0);
    const [showLineup, setShowLineup] = useState(false);
    const [showVideoEdit, setShowVideoEdit] = useState(false);
    const [newVideoId, setNewVideoId] = useState(settings.youtubeId);
    const [isJoined, setIsJoined] = useState(() => {
        const auth = localStorage.getItem('admin_auth') === 'true';
        if (auth) return true;
        return localStorage.getItem('chat_joined') === 'true';
    });

    const [editTitle, setEditTitle] = useState(settings.title);
    const [editLineup, setEditLineup] = useState(settings.lineup || '');
    const [isSaving, setIsSaving] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [pseudo, setPseudo] = useState(() => {
        const auth = localStorage.getItem('admin_auth') === 'true';
        if (auth) return localStorage.getItem('admin_user')?.toUpperCase() || 'ADMIN';
        return localStorage.getItem('chat_pseudo') || '';
    });
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [email, setEmail] = useState('');
    const [country, setCountry] = useState(() => {
        const auth = localStorage.getItem('admin_auth') === 'true';
        if (auth) return 'FR';
        return '';
    });
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [latestNews, setLatestNews] = useState<any[]>([]);

    const [banTarget, setBanTarget] = useState<string | null>(null);
    const [banDuration, setBanDuration] = useState('10');

    const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
    const [captchaA] = useState(Math.floor(Math.random() * 10) + 1);
    const [captchaB] = useState(Math.floor(Math.random() * 10) + 1);
    const [captchaAnswer, setCaptchaAnswer] = useState('');

    const [isSlowMode, setIsSlowMode] = useState(false);
    const [lastMessageTime, setLastMessageTime] = useState(0);

    const [promotedModos, setPromotedModos] = useState<string[]>(() => {
        return JSON.parse(localStorage.getItem('chat_promoted_modos') || '[]');
    });

    const [activeUsers] = useState<{ pseudo: string, country: string }[]>([]);
    const [isSending, setIsSending] = useState(false);

    const getAuthHeaders = () => {
        const password = localStorage.getItem('admin_password') || '';
        const username = localStorage.getItem('admin_user') || 'alex';
        const sessionId = localStorage.getItem('admin_session_id') || '';
        return {
            'Content-Type': 'application/json',
            'X-Admin-Password': password,
            'X-Admin-Username': username,
            'X-Session-ID': sessionId
        };
    };

    // Fetch messages from server every 3 seconds
    useEffect(() => {
        const fetchMessages = () => {
            fetch('/api/chat/messages')
                .then(res => res.ok ? res.json() : [])
                .then(data => {
                    if (Array.isArray(data)) {
                        setMessages(data);
                        // Auto-scroll
                        const chatContainer = document.getElementById('chat-messages');
                        if (chatContainer) {
                            const isAtBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100;
                            if (isAtBottom) {
                                setTimeout(() => { chatContainer.scrollTop = chatContainer.scrollHeight; }, 50);
                            }
                        }
                    }
                })
                .catch(() => { });
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, []);

    const getFlagEmoji = (c: string) => {
        if (!c) return '🌍';
        const code = c.toUpperCase().trim();
        if (code === 'FRANCE' || code === 'FR') return '🇫🇷';
        if (code === 'BELGIQUE' || code === 'BE') return '🇧🇪';
        if (code === 'SUISSE' || code === 'CH') return '🇨🇭';
        if (code === 'CANADA' || code === 'CA') return '🇨🇦';
        if (code === 'USA' || code === 'US' || code === 'ÉTATS-UNIS') return '🇺🇸';
        if (code === 'UK' || code === 'ANGLETERRE') return '🇬🇧';
        if (code === 'ESPAGNE' || code === 'ES') return '🇪🇸';
        if (code === 'ITALIE' || code === 'IT') return '🇮🇹';
        if (code === 'ALLEMAGNE' || code === 'DE') return '🇩🇪';
        return '🌍';
    };

    const adminPermissions = JSON.parse(localStorage.getItem('admin_permissions') || '[]');
    const hasTakeoverModoPerm = adminPermissions.includes('takeover_modo') || adminPermissions.includes('all');

    const adminUser = localStorage.getItem('admin_user')?.toUpperCase() || '';
    const isAdmin = localStorage.getItem('admin_auth') === 'true' || pseudo === 'DROPSIDERS' || pseudo === adminUser;
    const isModo = settings.moderators?.split(',').map(s => s.trim().toUpperCase()).includes(pseudo?.toUpperCase() || '') || hasTakeoverModoPerm;
    const hasModPowers = isAdmin || isModo;

    const getRole = (name: string) => {
        if (name === 'DROPSIDERS' || name === adminUser) return 'admin';
        if (settings.moderators?.split(',').map(s => s.trim().toUpperCase()).includes(name.toUpperCase())) return 'modo';
        if (promotedModos.includes(name.toUpperCase())) return 'modo';
        return 'user';
    };

    // Ping every 20s to count real viewers
    useEffect(() => {
        const pingId = isJoined ? pseudo.toUpperCase() : ('anon-' + Math.random().toString(36).substr(2, 6));
        const doPing = () => {
            fetch('/api/chat/ping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pseudo: pingId })
            })
                .then(r => r.ok ? r.json() : null)
                .then(data => { if (data?.count !== undefined) setViewersCount(data.count); })
                .catch(() => { });
        };
        doPing();
        const interval = setInterval(doPing, 20000);
        return () => clearInterval(interval);
    }, [isJoined, pseudo]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'none';
        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.overscrollBehavior = 'auto';
        };
    }, []);

    useEffect(() => {
        // Fetch Latest News
        fetch('/api/news')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Filter out interviews, keep only regular news
                    const filteredData = data.filter(item =>
                        !item.category.toLowerCase().includes('interview') &&
                        !item.title.toLowerCase().includes('interview')
                    );
                    setLatestNews(filteredData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20));
                }
            })
            .catch(console.error);
    }, []);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();

        // Security check
        if (!isAdmin && parseInt(captchaAnswer) !== captchaA + captchaB) {
            alert("Erreur de sécurité : addition incorrecte. Veuillez prouver que vous êtes un humain.");
            return;
        }

        if (pseudo && email && country) {
            setIsJoined(true);
            localStorage.setItem('chat_joined', 'true');
            localStorage.setItem('chat_pseudo', pseudo.toUpperCase());

            if (subscribeNewsletter) {
                try {
                    await fetch('/api/newsletter/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, name: pseudo })
                    });
                } catch (err) {
                    console.error('Failed to subscribe:', err);
                }
            }
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        if (isSlowMode && !hasModPowers) {
            const now = Date.now();
            if (now - lastMessageTime < 10000) {
                alert('Le mode lent est activé. Veuillez patienter 10 secondes entre chaque message.');
                return;
            }
            setLastMessageTime(now);
        }

        setIsSending(true);
        const msgText = newMessage;
        setNewMessage('');

        try {
            await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pseudo: pseudo.toUpperCase(),
                    country: country || 'FR',
                    message: msgText
                })
            });
        } catch (e) {
            console.error('Failed to send message', e);
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!hasModPowers) return;
        setMessages(prev => prev.filter(m => m.id !== id)); // optimistic update
        try {
            await fetch('/api/chat/delete', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id })
            });
        } catch (e) {
            console.error('Failed to delete message', e);
        }
    };

    const handleBanClick = (name: string) => {
        if (hasModPowers) setBanTarget(name);
    };

    const confirmBan = async () => {
        if (!banTarget || !hasModPowers) return;
        setMessages(prev => prev.filter(m => m.pseudo !== banTarget)); // optimistic
        setBanTarget(null);
        setBanDuration('10');
        try {
            await fetch('/api/chat/ban', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ pseudo: banTarget })
            });
        } catch (e) {
            console.error('Failed to ban user', e);
        }
    };

    const handlePromote = (name: string) => {
        if (!promotedModos.includes(name.toUpperCase())) {
            const newModos = [...promotedModos, name.toUpperCase()];
            setPromotedModos(newModos);
            localStorage.setItem('chat_promoted_modos', JSON.stringify(newModos));
        }
    };

    const allActiveUsers = [
        ...(isJoined ? [{ pseudo: pseudo, country: country || 'FR' }] : []),
        ...messages.map(m => ({ pseudo: m.pseudo, country: m.country })),
        ...activeUsers
    ].filter((v, i, a) => a.findIndex(t => (t.pseudo === v.pseudo)) === i)
        .sort((a, b) => {
            const roleA = getRole(a.pseudo);
            const roleB = getRole(b.pseudo);
            // Admins first, then Modos, then users
            const weightA = roleA === 'admin' ? 3 : roleA === 'modo' ? 2 : 1;
            const weightB = roleB === 'admin' ? 3 : roleB === 'modo' ? 2 : 1;
            if (weightA !== weightB) return weightB - weightA;
            return a.pseudo.localeCompare(b.pseudo);
        });

    const handleUpdateSettings = async (updates: Partial<TakeoverProps['settings']>) => {
        setIsSaving(true);
        try {
            // First get full current settings
            const res = await fetch('/api/settings');
            if (res.ok) {
                const currentSettings = await res.json();
                const newSettings = {
                    ...currentSettings,
                    takeover: {
                        ...currentSettings.takeover,
                        ...updates
                    }
                };

                const saveRes = await fetch('/api/settings/update', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(newSettings)
                });

                if (saveRes.ok) {
                    setShowEditModal(false);
                    setShowVideoEdit(false);
                    // On pourrait recharger la page ou mettre à jour un contexte global, 
                    // ici on rafraîchit simplement l'état local pour le feedback immédiat
                    if (updates.youtubeId) setNewVideoId(updates.youtubeId);
                }
            }
        } catch (err) {
            console.error('Failed to update settings', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveModerator = async (modPseudo: string) => {
        const currentMods = (settings.moderators || '').split(';').filter((m: string) => m.trim() && m.trim() !== modPseudo);
        const newMods = currentMods.join(';');
        await handleUpdateSettings({ moderators: newMods });
    };

    const isUserOnline = (pseudo: string) => {
        return allActiveUsers.some(u => u.pseudo.toLowerCase() === pseudo.toLowerCase());
    };

    const parseLineup = (text: string) => {
        if (!text) return [];
        return text.split('\n').filter(line => line.trim()).map(line => {
            const parts = line.split('|').map(p => p.trim());
            return {
                time: parts[0] || '',
                artist: parts[1] || '',
                stage: parts[2] || '',
                festival: parts[3] || ''
            };
        });
    };

    const handleShare = async (platform: 'x' | 'fb' | 'insta' | 'snap' | 'native') => {
        const url = window.location.href;
        const text = `Je regarde ${editTitle} sur Dropsiders ! 🚀`;

        if (platform === 'native' || navigator.share && (platform === 'insta' || platform === 'snap')) {
            try {
                await navigator.share({
                    title: 'Dropsiders Live',
                    text: text,
                    url: url
                });
                return;
            } catch (err) {
                console.log('Share failed or cancelled');
            }
        }

        const encodedUrl = encodeURIComponent(url);
        const encodedText = encodeURIComponent(text);

        if (platform === 'x') window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
        else if (platform === 'fb') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
        else if (platform === 'insta') window.open(`https://www.instagram.com/`, '_blank'); // Instagram doesn't have a direct share link for web stories, but we open the app
        else if (platform === 'snap') window.open(`https://www.snapchat.com/`, '_blank');
    };

    return (
        <div className={`fixed ${isFocusMode ? 'top-0' : 'top-[70px] lg:top-32'} left-0 right-0 bottom-0 flex flex-col bg-black overflow-hidden z-[50] transition-all duration-500`}>
            {/* Live Banner Header */}
            {!isFocusMode && (
                <div className="w-full bg-[#111] border-b border-white/10 px-6 py-4 flex items-center justify-between z-20 shadow-2xl shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 border border-red-500/30 rounded-full shrink-0">
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                            <span className="text-xs font-black text-red-500 uppercase tracking-widest">EN DIRECT</span>
                        </div>
                        <div className="w-px h-5 bg-white/20 hidden sm:block" />
                        <h1 className="text-lg md:text-2xl font-display font-black text-white uppercase italic tracking-widest truncate max-w-[200px] md:max-w-none">
                            {editTitle}
                        </h1>
                        <div className="flex items-center gap-2">
                            {isAdmin && (
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="p-1.5 bg-white/5 hover:bg-neon-red/20 border border-white/10 hover:border-neon-red/30 rounded-lg text-gray-400 hover:text-neon-red transition-all shrink-0"
                                    title="Modifier le Live"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <button
                                onClick={() => setShowLineup(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-gray-400 hover:text-neon-red hover:border-neon-red/30 transition-all uppercase tracking-widest animate-glow shadow-lg"
                            >
                                <List className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Planning</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-md">
                            <button
                                onClick={() => handleShare('x')}
                                className="p-1.5 px-2 lg:px-3 hover:bg-white/10 rounded-lg text-white transition-all text-[10px] font-black flex items-center gap-1.5"
                                title="Partager sur X"
                            >
                                <Twitter className="w-3.5 h-3.5" />
                                <span className="hidden lg:inline">X</span>
                            </button>
                            <div className="w-px h-3 bg-white/20" />
                            <button
                                onClick={() => handleShare('fb')}
                                className="p-1.5 px-2 lg:px-3 hover:bg-white/10 rounded-lg text-white transition-all text-[10px] font-black flex items-center gap-1.5"
                                title="Partager sur Facebook"
                            >
                                <Facebook className="w-3.5 h-3.5" />
                                <span className="hidden lg:inline">FB</span>
                            </button>
                            <div className="w-px h-3 bg-white/20" />
                            <button
                                onClick={() => handleShare('insta')}
                                className="p-1.5 px-2 lg:px-3 hover:bg-white/10 rounded-lg text-white transition-all text-[10px] font-black flex items-center gap-1.5"
                                title="Partager sur Instagram"
                            >
                                <Instagram className="w-3.5 h-3.5" />
                                <span className="hidden lg:inline">Insta</span>
                            </button>
                            <div className="w-px h-3 bg-white/20" />
                            <button
                                onClick={() => handleShare('snap')}
                                className="p-1.5 px-2 lg:px-3 hover:bg-white/10 rounded-lg text-white transition-all text-[10px] font-black flex items-center gap-1.5"
                                title="Partager sur Snapchat"
                            >
                                <Music2 className="w-3.5 h-3.5" />
                                <span className="hidden lg:inline">Snap</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 lg:px-4 py-1.5 bg-white/5 border border-white/10 rounded-full shrink-0 backdrop-blur-md self-center lg:self-auto">
                        <Users className="w-3 h-3 lg:w-4 lg:h-4 text-neon-red shadow-[0_0_8px_rgba(255,0,0,0.5)]" />
                        <div className="flex flex-col">
                            <span className="text-[9px] lg:text-[10px] font-black text-white uppercase tracking-widest leading-none">
                                {viewersCount > 0 ? viewersCount.toLocaleString('fr-FR') : (activeUsers.length || '...')}
                            </span>
                            <span className="text-[6px] lg:text-[7px] font-bold text-gray-500 uppercase tracking-tighter leading-none mt-0.5">Direct</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-black gap-0">
                {/* Video Section */}
                <div className="flex-shrink-0 lg:flex-1 w-full lg:w-auto bg-black flex flex-col lg:justify-center relative border-b lg:border-b-0 lg:border-r border-white/10">
                    <div className="w-full aspect-video lg:aspect-auto lg:h-full bg-black">
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${newVideoId || settings.youtubeId}?autoplay=1&mute=0&rel=0&modestbranding=1`}
                            title={settings.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>

                        {/* Mini Planning Widget (Bottom Right) */}
                        <AnimatePresence>
                            {showLineup && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, x: 20, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, x: 20, y: 20 }}
                                    className="absolute bottom-20 right-4 w-72 max-w-[calc(100%-2rem)] z-30 pointer-events-auto"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="bg-black/95 backdrop-blur-2xl border border-white/20 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(255,0,51,0.1)]">
                                        <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5">
                                            <div className="flex items-center gap-2">
                                                <List className="w-3 h-3 text-neon-red shadow-[0_0_8px_rgba(255,0,0,0.5)]" />
                                                <h2 className="text-[10px] font-black text-white uppercase italic tracking-[0.2em]">
                                                    LINE UP <span className="text-neon-red">LIVE</span>
                                                </h2>
                                            </div>
                                            <button
                                                onClick={() => setShowLineup(false)}
                                                className="p-1 hover:bg-white/10 rounded-md text-gray-500 hover:text-white transition-all"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>

                                        <div className="p-3 space-y-3 max-h-72 overflow-y-auto custom-scrollbar bg-black/40 backdrop-blur-xl">
                                            {parseLineup(editLineup || settings.lineup || '').map((item, i) => (
                                                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 shadow-sm hover:border-neon-red/50 transition-all group">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[7px] font-black text-gray-500 uppercase tracking-tighter">H</span>
                                                            <span className="text-[11px] font-black text-white uppercase tracking-tighter">
                                                                {item.time}
                                                            </span>
                                                        </div>
                                                        {item.festival && (
                                                            <div className="flex flex-col items-end text-right">
                                                                <span className="text-[7px] font-black text-gray-500 uppercase tracking-tighter">Festival</span>
                                                                <span className="text-[9px] font-black text-neon-red uppercase tracking-widest italic leading-none">
                                                                    {item.festival}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[7px] font-black text-gray-500 uppercase tracking-tighter">Artiste</span>
                                                            <h3 className="text-white font-black uppercase italic tracking-widest text-sm leading-tight group-hover:text-neon-red transition-colors">
                                                                {item.artist}
                                                            </h3>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[7px] font-black text-gray-500 uppercase tracking-tighter">Scène / Stage</span>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                                {item.stage}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {parseLineup(editLineup || settings.lineup || '').length === 0 && (
                                                <div className="py-12 text-center">
                                                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] italic">
                                                        PROGRAMME À VENIR
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Admin: Change Video popover */}
                        <AnimatePresence>
                            {showVideoEdit && isAdmin && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[#111] border border-white/20 rounded-2xl p-4 shadow-2xl w-80"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">YouTube ID ou URL</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newVideoId}
                                            onChange={e => setNewVideoId(e.target.value.split('v=').pop()?.split('&')[0] || e.target.value)}
                                            placeholder="dQw4w9WgXcQ"
                                            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-neon-red outline-none"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleUpdateSettings({ youtubeId: newVideoId })}
                                            disabled={isSaving}
                                            className="px-4 py-2 bg-neon-red text-white rounded-xl text-xs font-black hover:bg-neon-red/80 transition-all disabled:opacity-50"
                                        >
                                            {isSaving ? '...' : 'OK'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Floating action buttons on video */}
                        <div className="absolute bottom-4 left-4 flex items-center gap-2 z-20">
                            <button
                                onClick={() => setIsFocusMode(!isFocusMode)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-black/80 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all backdrop-blur-md shadow-2xl active:scale-95"
                                title={isFocusMode ? "Quitter le mode Focus" : "Mode Focus (Plein Écran)"}
                            >
                                {isFocusMode ? <Minimize2 className="w-4 h-4 text-neon-red" /> : <Maximize2 className="w-4 h-4 text-neon-red" />}
                                {isFocusMode ? "Quitter" : "Focus"}
                            </button>
                        </div>

                        {/* Full Edit Modal Layer */}
                        <AnimatePresence>
                            {showEditModal && isAdmin && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/90 backdrop-blur-xl z-[40] p-10 flex flex-col items-center justify-center overflow-y-auto"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="w-full max-w-xl space-y-8"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Paramètres <span className="text-neon-red">LIVE</span></h2>
                                            <button onClick={() => setShowEditModal(false)} className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors">
                                                <X className="w-6 h-6 text-white" />
                                            </button>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Titre de l'émission</label>
                                                <input
                                                    type="text"
                                                    value={editTitle}
                                                    onChange={e => setEditTitle(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-neon-red outline-none transition-all"
                                                    placeholder="Titre du Live"
                                                />
                                            </div>

                                            <div className="space-y-4 bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 block mb-4 italic">
                                                    Éditeur de <span className="text-neon-red">Line Up</span>
                                                </label>

                                                <div className="space-y-4 max-h-[40vh] overflow-y-auto px-1 custom-scrollbar">
                                                    {parseLineup(editLineup).map((item, i) => (
                                                        <div key={i} className="grid grid-cols-2 gap-3 bg-white/5 border border-white/5 p-4 rounded-2xl relative group">
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">Heure</label>
                                                                <input
                                                                    type="text"
                                                                    value={item.time}
                                                                    onChange={(e) => {
                                                                        const lines = editLineup.split('\n');
                                                                        const parts = lines[i].split('|');
                                                                        parts[0] = e.target.value;
                                                                        lines[i] = parts.join('|');
                                                                        setEditLineup(lines.join('\n'));
                                                                    }}
                                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:border-neon-red outline-none"
                                                                    placeholder="ex: 20:00"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">Festival</label>
                                                                <input
                                                                    type="text"
                                                                    value={item.festival}
                                                                    onChange={(e) => {
                                                                        const lines = editLineup.split('\n');
                                                                        const parts = lines[i].split('|');
                                                                        while (parts.length < 4) parts.push('');
                                                                        parts[3] = e.target.value;
                                                                        lines[i] = parts.join('|');
                                                                        setEditLineup(lines.join('\n'));
                                                                    }}
                                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-neon-red focus:border-neon-red outline-none"
                                                                    placeholder="Festival"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">Artiste</label>
                                                                <input
                                                                    type="text"
                                                                    value={item.artist}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === ' ') e.stopPropagation();
                                                                    }}
                                                                    onChange={(e) => {
                                                                        const lines = editLineup.split('\n');
                                                                        const parts = lines[i].split('|');
                                                                        while (parts.length < 2) parts.push('');
                                                                        parts[1] = e.target.value;
                                                                        lines[i] = parts.join('|');
                                                                        setEditLineup(lines.join('\n'));
                                                                    }}
                                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:border-neon-red outline-none"
                                                                    placeholder="Nom Artiste"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">Scène / Stage</label>
                                                                <input
                                                                    type="text"
                                                                    value={item.stage}
                                                                    onChange={(e) => {
                                                                        const lines = editLineup.split('\n');
                                                                        const parts = lines[i].split('|');
                                                                        while (parts.length < 3) parts.push('');
                                                                        parts[2] = e.target.value;
                                                                        lines[i] = parts.join('|');
                                                                        setEditLineup(lines.join('\n'));
                                                                    }}
                                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-gray-400 focus:border-neon-red outline-none"
                                                                    placeholder="Stage"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const lines = editLineup.split('\n');
                                                                    lines.splice(i, 1);
                                                                    setEditLineup(lines.join('\n'));
                                                                }}
                                                                className="absolute -top-2 -right-2 w-6 h-6 bg-neon-red text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => setEditLineup(editLineup + (editLineup ? '\n' : '') + ' |  |  | ')}
                                                        className="w-full py-3 bg-white/5 border border-dashed border-white/20 rounded-2xl text-[9px] font-black text-gray-500 uppercase tracking-widest hover:bg-white/10 transition-all active:scale-[0.98]"
                                                    >
                                                        + Ajouter un artiste
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">ID Vidéo YouTube</label>
                                                <input
                                                    type="text"
                                                    value={newVideoId}
                                                    onChange={e => setNewVideoId(e.target.value.split('v=').pop()?.split('&')[0] || e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-neon-red outline-none transition-all"
                                                    placeholder="L'ID après v="
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center justify-between">
                                                    Modérateurs Chat
                                                    <span className="text-[8px] opacity-40">({(settings.moderators || '').split(';').filter((m: string) => m.trim()).length})</span>
                                                </label>
                                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                                    {(settings.moderators || '').split(';').filter((m: string) => m.trim()).map((modPseudo: string) => (
                                                        <div key={modPseudo} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-2 px-3 group">
                                                            <div className="flex items-center gap-2 truncate">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${isUserOnline(modPseudo) ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                                                                <span className="text-[11px] font-black text-white uppercase tracking-widest truncate">{modPseudo}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveModerator(modPseudo)}
                                                                className="p-1 hover:bg-neon-red/20 rounded-md text-gray-500 hover:text-neon-red transition-all opacity-0 group-hover:opacity-100"
                                                                title="Révoquer Modérateur"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {(settings.moderators || '').split(';').filter((m: string) => m.trim()).length === 0 && (
                                                        <p className="col-span-full text-center py-4 text-[9px] font-bold text-gray-600 uppercase tracking-widest italic">Aucun modérateur ajouté</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6">
                                            <button
                                                onClick={() => handleUpdateSettings({ title: editTitle, lineup: editLineup, youtubeId: newVideoId })}
                                                disabled={isSaving}
                                                className="w-full py-5 bg-neon-red text-white text-xs font-black uppercase tracking-[0.4em] rounded-2xl hover:bg-neon-red/80 transition-all shadow-2xl shadow-neon-red/20 active:scale-[0.98] disabled:opacity-50"
                                            >
                                                {isSaving ? 'SAUVEGARDE...' : 'Mettre à jour les paramètres'}
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Chat Section */}
                {settings.chat_enabled && (
                    <div className="flex-1 lg:w-[420px] lg:flex-none bg-[#080808] flex flex-col min-h-0 relative z-20 border-t lg:border-t-0 lg:border-l border-white/10">
                        {/* Glossy Header */}
                        <div className="p-3 lg:p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02] backdrop-blur-md relative z-10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neon-red/10 rounded-lg">
                                    <MessageSquare className="w-5 h-5 text-neon-red" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                        Chat en direct
                                        {isSlowMode && <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 text-[8px] font-black uppercase flex items-center gap-1 border border-yellow-500/30"><Clock className="w-2.5 h-2.5" /> Mode Lent</span>}
                                    </h2>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Spectateurs en direct</p>
                                </div>
                            </div>
                            {hasModPowers && (
                                <button
                                    onClick={() => setIsSlowMode(!isSlowMode)}
                                    className={`p-2 rounded-lg transition-all ${isSlowMode ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'}`}
                                    title={isSlowMode ? "Désactiver le mode lent" : "Activer le mode lent (10s)"}
                                >
                                    <Clock className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <AnimatePresence mode="wait">
                            {!isJoined ? (
                                <motion.div
                                    key="join-form"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex-1 p-8 flex flex-col justify-center relative z-10"
                                >
                                    <div className="text-center mb-6 lg:mb-10">
                                        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-neon-red/10 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6 border border-neon-red/20 shadow-2xl shadow-neon-red/5">
                                            <Youtube className="w-6 h-6 lg:w-8 lg:h-8 text-neon-red" />
                                        </div>
                                        <h3 className="text-xl lg:text-3xl font-display font-black text-white uppercase italic tracking-tighter">
                                            Rejoindre le <span className="text-neon-red">LIVE</span>
                                        </h3>
                                        <p className="text-gray-500 text-[8px] lg:text-[10px] font-bold uppercase tracking-[0.2em] mt-2 lg:mt-3">Identifiez-vous pour discuter</p>
                                    </div>

                                    <form onSubmit={handleJoin} className="space-y-4">
                                        <div className="group relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon-red transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="PSEUDO"
                                                required
                                                value={pseudo}
                                                onChange={(e) => setPseudo(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3 lg:py-4 pl-12 text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white focus:border-neon-red outline-none transition-all placeholder-gray-600 shadow-inner"
                                            />
                                        </div>
                                        <div className="group relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon-red transition-colors" />
                                            <input
                                                type="email"
                                                placeholder="EMAIL"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3 lg:py-4 pl-12 text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white focus:border-neon-red outline-none transition-all placeholder-gray-600 shadow-inner"
                                            />
                                        </div>
                                        <div className="group relative">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon-red transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="PAYS"
                                                required
                                                value={country}
                                                onChange={(e) => setCountry(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3 lg:py-4 pl-12 text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white focus:border-neon-red outline-none transition-all placeholder-gray-600 shadow-inner"
                                            />
                                        </div>

                                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl p-3 lg:p-4">
                                            <div className="flex-1">
                                                <label className="text-[10px] lg:text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={subscribeNewsletter}
                                                        onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                                                        className="w-3.5 h-3.5 lg:w-4 lg:h-4 bg-black border border-white/20 rounded accent-neon-red cursor-pointer"
                                                    />
                                                    Newsletter
                                                </label>
                                            </div>
                                        </div>

                                        {!isAdmin && (
                                            <div className="group relative">
                                                <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-red/50" />
                                                <input
                                                    type="number"
                                                    placeholder={`${captchaA} + ${captchaB} ?`}
                                                    required
                                                    value={captchaAnswer}
                                                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3 lg:py-4 pl-12 text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white focus:border-neon-red outline-none transition-all placeholder-gray-600 shadow-inner"
                                                />
                                            </div>
                                        )}

                                        <button className="w-full py-4 lg:py-5 bg-neon-red text-white text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] rounded-xl lg:rounded-2xl hover:bg-neon-red/80 transition-all shadow-2xl shadow-neon-red/20 active:scale-95 group">
                                            Rejoindre
                                        </button>
                                    </form>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="chat-active"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex-1 flex flex-col min-h-0 relative z-10"
                                >
                                    <div id="chat-messages" className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6 scroll-smooth">
                                        {messages.map((msg, idx) => {
                                            const role = getRole(msg.pseudo);
                                            const isMsgAdmin = role === 'admin';
                                            const isMsgModo = role === 'modo';

                                            return (
                                                <motion.div
                                                    key={msg.id}
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="group relative"
                                                >
                                                    <div className="flex items-center gap-2 mb-1.5 px-1 truncate">
                                                        <span className="text-sm">{getFlagEmoji(msg.country || 'FR')}</span>
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isMsgAdmin ? 'text-neon-red' : isMsgModo ? 'text-yellow-500' : 'text-gray-400'}`}>
                                                            {msg.pseudo}
                                                        </span>
                                                        {isMsgAdmin && <span className="px-1.5 py-0.5 rounded bg-neon-red text-white text-[7px] font-black uppercase tracking-widest flex-shrink-0">Admin</span>}
                                                        {isMsgModo && <span className="px-1.5 py-0.5 rounded bg-yellow-500 text-black text-[7px] font-black uppercase tracking-widest flex-shrink-0">Modo</span>}
                                                        <span className="text-[7px] text-gray-700 font-bold uppercase ml-auto">{msg.time}</span>
                                                    </div>
                                                    <div className={`px-4 py-3 rounded-2xl text-xs font-medium leading-relaxed tracking-wide ${isMsgAdmin ? 'bg-neon-red/10 border border-neon-red/20 text-white' : isMsgModo ? 'bg-yellow-500/10 border border-yellow-500/20 text-white' : 'bg-white/5 border border-white/5 text-gray-300'}`}>
                                                        {msg.message}
                                                    </div>

                                                    {/* Moderation Actions */}
                                                    {hasModPowers && (
                                                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md rounded-lg p-1 border border-white/10">
                                                            <button
                                                                onClick={() => handleDelete(msg.id)}
                                                                className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"
                                                                title="Supprimer le message"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            {hasModPowers && !isMsgAdmin && (
                                                                <button
                                                                    onClick={() => handleBanClick(msg.pseudo)}
                                                                    className="p-1.5 hover:bg-neon-red/20 rounded-md text-gray-400 hover:text-neon-red transition-colors"
                                                                    title="Bannir l'IP"
                                                                >
                                                                    <ShieldAlert className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    <form onSubmit={handleSendMessage} className="p-3 lg:p-6 bg-black/80 backdrop-blur-xl border-t border-white/10">
                                        <div className="relative flex items-center gap-2 lg:gap-3">
                                            <div className="flex-1 relative group">
                                                <input
                                                    type="text"
                                                    placeholder="Message..."
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3 lg:py-4 px-4 lg:px-5 text-gray-200 focus:border-neon-red outline-none text-[11px] lg:text-xs font-medium placeholder-gray-600 transition-all"
                                                />
                                            </div>
                                            <button className="p-3 lg:p-4 bg-neon-red text-white rounded-xl lg:rounded-2xl hover:bg-neon-red/80 transition-all shadow-xl shadow-neon-red/20 active:scale-90">
                                                <Send className="w-4 h-4 lg:w-5 lg:h-5" />
                                            </button>
                                        </div>
                                    </form>

                                    {/* Ban Modal Overlay */}
                                    <AnimatePresence>
                                        {banTarget && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 20 }}
                                                className="absolute inset-x-4 bottom-24 p-5 bg-[#111] border border-neon-red/30 rounded-2xl shadow-2xl z-50 backdrop-blur-xl"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                                            <ShieldAlert className="w-4 h-4 text-neon-red" />
                                                            Bannir {banTarget}
                                                        </h3>
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">L'utilisateur ne pourra plus envoyer de messages.</p>
                                                    </div>
                                                    <button onClick={() => setBanTarget(null)} className="text-gray-500 hover:text-white transition-colors">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="mb-4">
                                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2">Durée (minutes)</label>
                                                    <input
                                                        type="number"
                                                        value={banDuration}
                                                        onChange={(e) => setBanDuration(e.target.value)}
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:border-neon-red outline-none"
                                                        min="1"
                                                    />
                                                </div>

                                                <button
                                                    onClick={confirmBan}
                                                    className="w-full py-3 bg-neon-red text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-neon-red/80 transition-all shadow-lg shadow-neon-red/20"
                                                >
                                                    Confirmer le Ban
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Gradient Background Effect */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-neon-red/5 blur-[100px] rounded-full" />
                        </div>
                    </div>
                )}

                {/* User List Panel (Moderators only) */}
                {hasModPowers && (
                    <div className="hidden xl:flex flex-col w-[250px] bg-[#0a0a0a] border-l border-white/10 relative z-20 shrink-0">
                        <div className="p-4 lg:p-6 border-b border-white/10 shrink-0 flex justify-between items-center bg-white/[0.02]">
                            <h2 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                <Users className="w-4 h-4 text-neon-red" /> Utilisateurs
                            </h2>
                            <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full font-bold">{allActiveUsers.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto w-full">
                            <div className="p-3 space-y-2">
                                {allActiveUsers.map(u => {
                                    const role = getRole(u.pseudo);
                                    const isUserAdmin = role === 'admin';
                                    const isUserModo = role === 'modo';

                                    return (
                                        <div key={u.pseudo} className="flex items-center justify-between group rounded-lg p-2 hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-2 truncate">
                                                <span className="text-xs">{getFlagEmoji(u.country)}</span>
                                                <span className={`text-xs font-bold uppercase truncate max-w-[120px] ${isUserAdmin ? 'text-neon-red' : isUserModo ? 'text-yellow-500' : 'text-gray-300'}`}>
                                                    {u.pseudo}
                                                </span>
                                            </div>
                                            {hasModPowers && !isUserAdmin && !isUserModo && pseudo !== u.pseudo && (
                                                <button
                                                    onClick={() => handlePromote(u.pseudo)}
                                                    className="p-1 opacity-0 group-hover:opacity-100 xl:group-hover:opacity-100 hover:bg-neon-red/20 rounded-md text-gray-500 hover:text-neon-red transition-all"
                                                    title="Promouvoir Modérateur Chat"
                                                >
                                                    <Shield className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Social Connect Tab */}
            {!isFocusMode && (
                <div className="absolute right-6 bottom-20 z-40 flex flex-col gap-2">
                    <button
                        onClick={() => window.open("https://www.instagram.com/dropsiders.eu", "InstaPopup", "width=600,height=800,left=300,top=100")}
                        className="group flex items-center gap-3 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-1.5 pr-4 rounded-full text-white shadow-xl hover:scale-105 transition-all duration-300"
                    >
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                            <Instagram className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Suivre</span>
                    </button>
                    <button
                        onClick={() => window.open("https://www.tiktok.com/@dropsiders.eu", "TikTokPopup", "width=600,height=800,left=300,top=100")}
                        className="group flex items-center gap-3 bg-black border border-white/10 p-1.5 pr-4 rounded-full text-white shadow-xl hover:scale-105 transition-all duration-300"
                    >
                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md">
                            <Music2 className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">TikTok</span>
                    </button>
                </div>
            )}

            {/* Scrolling News Ticker */}
            {!isFocusMode && (
                <div className="w-full bg-neon-red h-12 shrink-0 flex items-center overflow-hidden border-t border-white/20 relative z-30 shadow-[0_-10px_30px_rgba(255,0,0,0.2)]">
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-neon-red via-neon-red/80 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-neon-red via-neon-red/80 to-transparent z-10 pointer-events-none" />

                    <div className="flex items-center absolute whitespace-nowrap animate-ticker py-2">
                        {latestNews.concat(latestNews).map((news, i) => (
                            <a
                                key={`${news.id}-${i}`}
                                href={`/news/${news.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center mx-8 text-white shrink-0 hover:scale-105 transition-transform group"
                            >
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-black/20 px-2 py-0.5 rounded mr-3 border border-white/10">{news.category}</span>
                                <span className="text-[11px] font-black uppercase italic tracking-tighter group-hover:underline decoration-2 underline-offset-4">{news.title}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-white/40 ml-8 shadow-[0_0_8px_white]" />
                            </a>
                        ))}
                        {latestNews.length === 0 && (
                            <div className="text-[10px] font-black uppercase italic tracking-[0.3em] text-white/80 mx-10 animate-pulse">
                                CHARGEMENT DU FIL D'ACTUALITÉ...
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes ticker {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
                .animate-ticker {
                    animation: ticker 90s linear infinite;
                    width: max-content;
                }
                @keyframes glow {
                    0%, 100% { border-color: rgba(255, 0, 0, 0.3); box-shadow: 0 0 5px rgba(255, 0, 0, 0.1); }
                    50% { border-color: rgba(255, 0, 0, 0.8); box-shadow: 0 0 20px rgba(255, 0, 0, 0.4); }
                }
                .animate-glow {
                    animation: glow 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
