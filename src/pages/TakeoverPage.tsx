import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Globe, Mail, Youtube, MessageSquare, Trash2, ShieldAlert } from 'lucide-react';

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
        return localStorage.getItem('chat_joined') === 'true';
    });
    const [pseudo, setPseudo] = useState(() => localStorage.getItem('chat_pseudo') || '');
    const [email, setEmail] = useState('');
    const [country, setCountry] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');

    const adminUser = localStorage.getItem('admin_user')?.toUpperCase() || '';
    const isAdmin = localStorage.getItem('admin_auth') === 'true' || pseudo === 'DROPSIDERS' || pseudo === adminUser;
    const isModo = settings.moderators?.split(',').map(s => s.trim().toUpperCase()).includes(pseudo?.toUpperCase() || '');
    const hasModPowers = isAdmin || isModo;

    const getRole = (name: string) => {
        if (name === 'DROPSIDERS' || name === adminUser) return 'admin';
        if (settings.moderators?.split(',').map(s => s.trim().toUpperCase()).includes(name.toUpperCase())) return 'modo';
        return 'user';
    };

    useEffect(() => {
        // Mock some initial messages
        const initialMessages = [
            { id: 1, pseudo: 'LUCAS', message: 'Trop hâte que ça commence ! 🔥', time: '20:00' },
            { id: 2, pseudo: 'EMMA', message: 'Le son est incroyable déjà.', time: '20:01' },
            { id: 3, pseudo: 'DROPSIDERS', message: 'Bienvenue sur le live ! N\'hésitez pas à interagir ici.', time: '20:02' },
            { id: 4, pseudo: 'MARC', message: 'Quel festival de fou', time: '20:03' }
        ];
        setMessages(initialMessages);

        // Simulate some live messages
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                const randomPseudos = ['TOM', 'CHLOÉ', 'ANTOINE', 'SARAH', 'JULIEN'];
                const randomMsgs = ['WAOW !!', 'C\'est le feu', '❤️❤️❤️', 'Incroyable', 'On est là !!'];
                const newMsg = {
                    id: Date.now(),
                    pseudo: randomPseudos[Math.floor(Math.random() * randomPseudos.length)],
                    message: randomMsgs[Math.floor(Math.random() * randomMsgs.length)],
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev.slice(-20), newMsg]);
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

    const handleBan = (name: string) => {
        if (isAdmin) {
            alert(`L'IP de l'utilisateur ${name} a été bannie.`);
            setMessages(prev => prev.filter(m => m.pseudo !== name));
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col lg:flex-row pt-20">
            {/* Video Section */}
            <div className="flex-1 relative bg-black flex items-center justify-center">
                <div className="w-full aspect-video bg-black shadow-2xl shadow-neon-red/10 border-y border-white/5">
                    <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${settings.youtubeId}?autoplay=1&mute=0&rel=0&modestbranding=1`}
                        title={settings.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>

                <div className="absolute top-6 left-6 flex items-center gap-4">
                    <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">LIVE</span>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <h1 className="text-sm font-display font-black text-white uppercase italic tracking-widest">
                            {settings.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Chat Section */}
            {settings.chat_enabled && (
                <div className="w-full lg:w-[450px] border-l border-white/10 bg-[#080808] flex flex-col h-[500px] lg:h-auto relative overflow-hidden">
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
                                                <div className="flex items-center gap-2 mb-1.5 px-1">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${isMsgAdmin ? 'text-neon-red' : isMsgModo ? 'text-yellow-500' : 'text-gray-400'}`}>
                                                        {msg.pseudo}
                                                    </span>
                                                    {isMsgAdmin && <span className="px-1.5 py-0.5 rounded bg-neon-red text-white text-[7px] font-black uppercase tracking-widest">Admin</span>}
                                                    {isMsgModo && <span className="px-1.5 py-0.5 rounded bg-yellow-500 text-black text-[7px] font-black uppercase tracking-widest">Modo</span>}
                                                    <span className="text-[7px] text-gray-700 font-bold uppercase">{msg.time}</span>
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
                                                        {isAdmin && !isMsgAdmin && (
                                                            <button
                                                                onClick={() => handleBan(msg.pseudo)}
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
    );
}
