    const [chatMessages, setChatMessages] = useState<{ id: string, user: string, text: string, translated?: string, isTranslating?: boolean }[]>([]);
    const [autoTranslate, setAutoTranslate] = useState(true);

    // Twitch Chat Connection
    React.useEffect(() => {
        if (platform !== 'TWITCH' || !url) return;
        
        const channel = url.split('twitch.tv/')[1]?.split('?')[0];
        if (!channel) return;

        const socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
        
        socket.onopen = () => {
            socket.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
            socket.send('PASS SCHMOOPIIE');
            socket.send(`NICK justinfan${Math.floor(Math.random() * 100000)}`);
            socket.send(`JOIN #${channel.toLowerCase()}`);
        };

        socket.onmessage = async (event) => {
            const message = event.data;
            if (message.includes('PRIVMSG')) {
                const parts = message.split(';');
                const displayName = parts.find((p: string) => p.startsWith('display-name='))?.split('=')[1] || 'User';
                const msgPart = message.split('PRIVMSG')[1];
                const msgText = msgPart.split(':')[1]?.trim();

                if (msgText) {
                    const newMsg = { 
                        id: Math.random().toString(36).substr(2, 9), 
                        user: displayName, 
                        text: msgText 
                    };
                    
                    setChatMessages(prev => [newMsg, ...prev].slice(0, 50));

                    if (autoTranslate) {
                        translateMessage(newMsg.id, msgText);
                    }
                }
            }
            if (message.startsWith('PING')) {
                socket.send('PONG :tmi.twitch.tv');
            }
        };

        return () => socket.close();
    }, [platform, url, autoTranslate]);

    const translateMessage = async (id: string, text: string) => {
        // Simple heuristic to avoid translating short emotes or non-english (very basic)
        if (text.length < 3) return;

        setChatMessages(prev => prev.map(m => m.id === id ? { ...m, isTranslating: true } : m));

        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|fr`);
            const data = await res.json();
            const translated = data.responseData.translatedText;
            
            setChatMessages(prev => prev.map(m => m.id === id ? { ...m, translated, isTranslating: false } : m));
        } catch (e) {
            setChatMessages(prev => prev.map(m => m.id === id ? { ...m, isTranslating: false } : m));
        }
    };

    const handleTranslate = () => {
        if (!url) return;
        setIsTranslating(true);
        setChatMessages([]);
        
        // Extract ID
        let videoId = '';
        if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1].split('&')[0];
            setPlatform('YOUTUBE');
            setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&cc_load_policy=1&hl=fr&cc_lang_pref=fr`);
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
            setPlatform('YOUTUBE');
            setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&cc_load_policy=1&hl=fr&cc_lang_pref=fr`);
        } else if (url.includes('twitch.tv/')) {
            const channel = url.split('twitch.tv/')[1].split('?')[0];
            setPlatform('TWITCH');
            setEmbedUrl(`https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=true&muted=false`);
        }

        setTimeout(() => {
            setIsTranslating(false);
        }, 1200);
    };

    return (
        <div className="space-y-12 py-10 px-4">
            {/* Header section */}
            <div className="text-center space-y-6 max-w-3xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-3 px-5 py-2 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full mb-4 shadow-[0_0_20px_rgba(0,255,255,0.1)]"
                >
                    <Zap className="w-4 h-4 text-neon-cyan animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-cyan">AI LIVE CHAT TRANSLATOR</span>
                </motion.div>
                
                <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">
                    DROPSIDERS <span className="text-neon-cyan drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]">TV</span> <br />
                    <span className="text-white/20">CHAT TRANSLATOR</span>
                </h2>
                
                <p className="text-gray-400 text-sm md:text-base font-medium leading-relaxed max-w-2xl mx-auto">
                    Traduisez automatiquement le chat en direct pour comprendre les réactions de la communauté internationale en temps réel.
                </p>
            </div>

            {/* URL Input Area */}
            <div className="max-w-3xl mx-auto">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan via-neon-blue to-purple-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000" />
                    <div className="relative flex flex-col md:flex-row bg-black/60 border border-white/10 rounded-[2.5rem] overflow-hidden p-3 backdrop-blur-2xl">
                        <div className="flex-1 flex items-center px-4">
                            <Globe className="w-5 h-5 text-white/20 mr-4" />
                            <input 
                                type="text" 
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
                                placeholder="Coller un lien YouTube ou Twitch..."
                                className="w-full bg-transparent border-none outline-none py-4 text-white text-base font-bold placeholder:text-white/20"
                            />
                        </div>
                        <button 
                            onClick={handleTranslate}
                            disabled={!url || isTranslating}
                            className="px-10 py-5 bg-white text-black font-black uppercase text-[11px] tracking-[0.1em] rounded-[2rem] hover:bg-neon-cyan hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] disabled:opacity-50 disabled:grayscale transition-all duration-500 shrink-0"
                        >
                            {isTranslating ? (
                                <div className="flex items-center gap-3">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Synchronisation...
                                </div>
                            ) : 'Traduire en Direct'}
                        </button>
                    </div>
                </div>
                
                <div className="flex flex-wrap justify-center gap-8 mt-8">
                    <div className="flex items-center gap-3 opacity-30 hover:opacity-100 transition-all">
                        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                            <Youtube className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest">Youtube Assist</span>
                    </div>
                    <div className="flex items-center gap-3 opacity-30 hover:opacity-100 transition-all">
                        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                            <Tv className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest">Twitch Live Proxy</span>
                    </div>
                    <button 
                        onClick={() => setShowHelp(!showHelp)}
                        className="flex items-center gap-3 opacity-30 hover:opacity-100 transition-all"
                    >
                        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                            <Info className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest">Comment ça marche ?</span>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showHelp && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="max-w-3xl mx-auto overflow-hidden"
                    >
                        <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem] grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase text-neon-cyan tracking-widest">YouTube Support</h4>
                                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                                    Pour YouTube, nous activons les sous-titres forcés. Les commentaires seront bientôt disponibles via une intégration AI dédiée.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase text-neon-blue tracking-widest">Twitch Chat Translation</h4>
                                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                                    Nous nous connectons directement au chat Twitch et traduisons chaque message anglais en français via notre moteur de traduction neuronale.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results Area */}
            <AnimatePresence mode="wait">
                {embedUrl ? (
                    <motion.div 
                        key="player"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="max-w-7xl mx-auto relative"
                    >
                        <div className="flex flex-col lg:flex-row gap-6 h-[700px]">
                            {/* Main Player Box */}
                            <div className="flex-[3] flex flex-col gap-4 h-full">
                                <div className="flex-1 bg-black rounded-[3rem] overflow-hidden border-4 border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative group/player">
                                    <iframe
                                        src={embedUrl}
                                        className="w-full h-full border-none"
                                        allowFullScreen
                                        allow="autoplay; encrypted-media"
                                    />
                                    
                                    {/* Smart Subtitles Overlay */}
                                    <div className="absolute bottom-16 left-0 right-0 pointer-events-none flex justify-center px-12">
                                        <motion.div 
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="bg-black/80 backdrop-blur-xl px-8 py-4 rounded-3xl border border-white/10 text-white text-sm font-bold text-center max-w-2xl shadow-2xl opacity-0 group-hover/player:opacity-100 transition-all duration-500"
                                        >
                                            <div className="flex items-center gap-3 justify-center mb-2">
                                                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-ping" />
                                                <span className="text-[8px] font-black uppercase text-neon-cyan tracking-[0.4em]">Smart-Translating Flux Audio...</span>
                                            </div>
                                            <p className="italic text-base leading-snug">
                                                {platform === 'YOUTUBE' 
                                                    ? "Analyse des métadonnées terminée. Sous-titres français activés." 
                                                    : "Twitch Live Source détectée. Traduction dynamique activée."}
                                            </p>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>

                            {/* Chat Panel */}
                            <div className="flex-1 min-w-[350px] bg-[#080808] border border-white/10 rounded-[3rem] flex flex-col overflow-hidden shadow-2xl">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Live Chat traduit</h3>
                                    </div>
                                    <button 
                                        onClick={() => setAutoTranslate(!autoTranslate)}
                                        className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${autoTranslate ? 'bg-neon-cyan text-black' : 'bg-white/5 text-white/40'}`}
                                    >
                                        {autoTranslate ? 'Auto-Trad ON' : 'Auto-Trad OFF'}
                                    </button>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar flex flex-col-reverse">
                                    {chatMessages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                                            <MessageSquare className="w-8 h-8" />
                                            <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">
                                                En attente de messages... <br /> (Seul Twitch est supporté pour le chat live)
                                            </p>
                                        </div>
                                    ) : (
                                        chatMessages.map((msg) => (
                                            <motion.div 
                                                key={msg.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="space-y-2 group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-neon-cyan uppercase tracking-tighter">{msg.user}</span>
                                                    <span className="text-[9px] text-white/20 font-mono">EN</span>
                                                </div>
                                                <div className="p-3 bg-white/5 rounded-2xl rounded-tl-none border border-white/5">
                                                    <p className="text-[11px] text-white/60 leading-relaxed">{msg.text}</p>
                                                </div>
                                                {msg.translated && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: -5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="p-3 bg-neon-cyan/5 border border-neon-cyan/20 rounded-2xl rounded-tl-none ml-4"
                                                    >
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Languages className="w-3 h-3 text-neon-cyan" />
                                                            <span className="text-[8px] font-black uppercase text-neon-cyan">Traduit (FR)</span>
                                                        </div>
                                                        <p className="text-[11px] text-white font-bold leading-relaxed">{msg.translated}</p>
                                                    </motion.div>
                                                )}
                                                {msg.isTranslating && (
                                                    <div className="ml-4 flex items-center gap-2 text-[8px] font-black text-white/20 uppercase animate-pulse">
                                                        <RefreshCw className="w-3 h-3 animate-spin" /> Traduction...
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))
                                    )}
                                </div>

                                <div className="p-4 bg-black/40 border-t border-white/5">
                                    <p className="text-[8px] text-center text-white/20 font-black uppercase tracking-widest italic">
                                        Alimenté par Dropsiders Neural Engine
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-32 text-center opacity-20 flex flex-col items-center gap-8"
                    >
                        <div className="relative">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute -inset-8 border border-dashed border-white/10 rounded-full"
                            />
                            <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/10">
                                <Tv className="w-10 h-10" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[11px] font-black uppercase tracking-[0.5em]">Dropsiders TV</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 italic">Entrez un lien pour démarrer l'expérience</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-20 border-t border-white/5">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-neon-cyan/20 to-transparent rounded-2xl flex items-center justify-center border border-neon-cyan/20">
                        <Zap className="w-6 h-6 text-neon-cyan" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase text-white tracking-widest">Ultra Latence</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">Flux synchronisé pour les sets en direct.</p>
                    </div>
                </div>
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-neon-blue/20 to-transparent rounded-2xl flex items-center justify-center border border-neon-blue/20">
                        <Languages className="w-6 h-6 text-neon-blue" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase text-white tracking-widest">Chat Translator</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">Traduction neuronale des messages anglais.</p>
                    </div>
                </div>
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-600/20 to-transparent rounded-2xl flex items-center justify-center border border-purple-600/20">
                        <Globe className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase text-white tracking-widest">Zero Proxy</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">Lecture directe sécurisée via les players officiels.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const MessageSquare = (props: any) => (
    <svg 
        {...props}
        xmlns="http://www.w3.org/2000/svg" 
        width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
    >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
);
