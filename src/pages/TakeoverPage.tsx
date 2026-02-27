import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Globe, Mail, Youtube, MessageSquare, Trash2, ShieldAlert, X } from 'lucide-react';

interface TakeoverProps {
    settings: {
        youtubeId: string;
        chat_enabled: boolean;
        title: string;
        moderators?: string;
    };
}

export function TakeoverPage({ settings }: TakeoverProps) {
    const [isJoined, setIsJoined] = useState(() => {
        const auth = localStorage.getItem('admin_auth') === 'true';
        if (auth) return true;
        return localStorage.getItem('chat_joined') === 'true';
    });
    const [pseudo, setPseudo] = useState(() => {
        const auth = localStorage.getItem('admin_auth') === 'true';
        if (auth) return localStorage.getItem('admin_user')?.toUpperCase() || 'ADMIN';
        return localStorage.getItem('chat_pseudo') || '';
    });
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
        return 'user';
    };

    useEffect(() => {
        // Fetch Latest News
        fetch('/api/news')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setLatestNews(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20));
                }
            })
            .catch(console.error);

        // Mock some initial messages
        const initialMessages = [
            { id: 1, pseudo: 'LUCAS', country: 'FR', message: 'Trop hâte que ça commence ! 🔥', time: '20:00' },
            { id: 2, pseudo: 'EMMA', country: 'CA', message: 'Le son est incroyable déjà.', time: '20:01' },
            { id: 3, pseudo: 'DROPSIDERS', country: 'FR', message: 'Bienvenue sur le live ! N\'hésitez pas à interagir ici.', time: '20:02' },
            { id: 4, pseudo: 'MARC', country: 'BE', message: 'Quel festival de fou', time: '20:03' }
        ];
        setMessages(initialMessages);

        // Simulate some live messages
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                const randomPseudos = ['TOM', 'CHLOÉ', 'ANTOINE', 'SARAH', 'JULIEN', 'MIA', 'LEO'];
                const randomCountries = ['FR', 'BE', 'CH', 'CA', 'ES', 'IT', 'UK'];
                const randomMsgs = ['WAOW !!', 'C\'est le feu', '❤️❤️❤️', 'Incroyable', 'On est là !!', 'Let\'s goooo'];
                const newMsg = {
                    id: Date.now(),
                    pseudo: randomPseudos[Math.floor(Math.random() * randomPseudos.length)],
                    country: randomCountries[Math.floor(Math.random() * randomCountries.length)],
                    message: randomMsgs[Math.floor(Math.random() * randomMsgs.length)],
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev.slice(-40), newMsg]);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (pseudo && email && country) {
            setIsJoined(true);
            localStorage.setItem('chat_joined', 'true');
            localStorage.setItem('chat_pseudo', pseudo.toUpperCase());
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            const msg = {
                id: Date.now(),
                pseudo: pseudo.toUpperCase(),
                country: country || 'FR',
                message: newMessage,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, msg]);
            setNewMessage('');

            // Auto scroll to bottom (simple version)
            const chatContainer = document.getElementById('chat-messages');
            if (chatContainer) {
                setTimeout(() => {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }, 100);
            }
        }
    };

    const handleDelete = (id: number) => {
        if (hasModPowers) {
            setMessages(prev => prev.filter(m => m.id !== id));
        }
    };

    const handleBanClick = (name: string) => {
        if (hasModPowers) {
            setBanTarget(name);
        }
    };

    const confirmBan = () => {
        if (banTarget && hasModPowers) {
            // Actual IP ban logic would go here
            setMessages(prev => prev.filter(m => m.pseudo !== banTarget));
            setBanTarget(null);
            setBanDuration('10');
            // Show some temporary notification if needed
        }
    };

    return (
        <div className="flex flex-col h-screen min-h-screen bg-black pt-20 overflow-hidden">
            {/* Live Banner Header */}
            <div className="w-full bg-[#111] border-b border-white/10 px-6 py-4 flex items-center justify-between z-20 shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 border border-red-500/30 rounded-full">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                        <span className="text-xs font-black text-red-500 uppercase tracking-widest">EN DIRECT</span>
                    </div>
                    <div className="w-px h-5 bg-white/20" />
                    <h1 className="text-xl md:text-2xl font-display font-black text-white uppercase italic tracking-widest">
                        {settings.title}
                    </h1>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-black">
                {/* Video Section */}
                <div className="flex-1 relative bg-black flex flex-col lg:justify-center overflow-hidden">
                    <div className="w-full h-full lg:max-h-[calc(100vh-160px)] aspect-video lg:aspect-auto bg-black border-r border-white/5">
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${settings.youtubeId}?autoplay=1&mute=0&rel=0&modestbranding=1`}
                            title={settings.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>

                {/* Chat Section */}
                {settings.chat_enabled && (
                    <div className="w-full lg:w-[380px] border-l border-white/10 bg-[#080808] flex flex-col h-[400px] lg:h-auto min-h-0 relative z-20">
                        {/* Glossy Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02] backdrop-blur-md relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neon-red/10 rounded-lg">
                                    <MessageSquare className="w-5 h-5 text-neon-red" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-white uppercase italic tracking-widest">Chat en direct</h2>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">3.4k spectateurs</p>
                                </div>
                            </div>
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
                                    <div className="text-center mb-10">
                                        <div className="w-16 h-16 bg-neon-red/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-neon-red/20 shadow-2xl shadow-neon-red/5">
                                            <Youtube className="w-8 h-8 text-neon-red" />
                                        </div>
                                        <h3 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">
                                            Rejoindre le <span className="text-neon-red">LIVE</span>
                                        </h3>
                                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-3">Identifiez-vous pour discuter</p>
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
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 text-xs font-bold uppercase tracking-widest text-white focus:border-neon-red outline-none transition-all placeholder-gray-600 shadow-inner"
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
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 text-xs font-bold uppercase tracking-widest text-white focus:border-neon-red outline-none transition-all placeholder-gray-600 shadow-inner"
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
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 text-xs font-bold uppercase tracking-widest text-white focus:border-neon-red outline-none transition-all placeholder-gray-600 shadow-inner"
                                            />
                                        </div>
                                        <button className="w-full py-5 bg-neon-red text-white text-xs font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-neon-red/80 transition-all shadow-2xl shadow-neon-red/20 active:scale-95 group">
                                            Accéder au chat
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
                                    <div id="chat-messages" className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
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

                                    <form onSubmit={handleSendMessage} className="p-6 bg-black/80 backdrop-blur-xl border-t border-white/10">
                                        <div className="relative flex items-center gap-3">
                                            <div className="flex-1 relative group">
                                                <input
                                                    type="text"
                                                    placeholder="Tapez votre message..."
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-gray-200 focus:border-neon-red outline-none text-xs font-medium placeholder-gray-600 transition-all"
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                                                    <span className="text-[8px] text-gray-500 font-bold">ENTER</span>
                                                </div>
                                            </div>
                                            <button className="p-4 bg-neon-red text-white rounded-2xl hover:bg-neon-red/80 transition-all shadow-xl shadow-neon-red/20 active:scale-90">
                                                <Send className="w-5 h-5" />
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
            </div>

            {/* Scrolling News Ticker */}
            <div className="w-full bg-neon-red h-10 flex items-center overflow-hidden border-t border-red-500/50 relative z-30">
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-neon-red to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-neon-red to-transparent z-10" />

                <div className="flex items-center absolute whitespace-nowrap animate-ticker">
                    {latestNews.concat(latestNews).map((news, i) => (
                        <div key={`${news.id}-${i}`} className="flex items-center mx-6 text-white shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 mr-2">{news.category}</span>
                            <span className="text-xs font-black uppercase italic tracking-wide">{news.title}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-white ml-6 opacity-50" />
                        </div>
                    ))}
                    {latestNews.length === 0 && (
                        <div className="text-xs font-black uppercase italic tracking-widest text-white mx-10">
                            CHARGEMENT DES DERNIÈRES NEWS...
                        </div>
                    )}
                </div>
            </div>

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
                    animation: ticker 40s linear infinite;
                    width: max-content;
                }
            `}</style>
        </div>
    );
}
