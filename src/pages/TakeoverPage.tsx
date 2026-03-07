
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, MessageSquare, Send, Smile, X, Settings, Save, AlertCircle, CheckCircle2, Calendar, Zap, ChevronRight, ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuthHeaders, apiFetch } from '../utils/auth';

export function TakeoverPage({ settings: initialSettings }: { settings: any }) {
    const navigate = useNavigate();

    // --- State ---
    const [settings, setSettings] = useState(initialSettings);
    const [showUsersPanel, setShowUsersPanel] = useState(false);
    const [activeChatTab, setActiveChatTab] = useState('chat');
    const [newMessage, setNewMessage] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    // Admin Panel States
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editTitle, setEditTitle] = useState(initialSettings.title || '');
    const [editYoutubeId, setEditYoutubeId] = useState(initialSettings.youtubeId || '');
    const [editMainFluxName, setEditMainFluxName] = useState(initialSettings.mainFluxName || '');
    const [editAnnText, setEditAnnText] = useState(initialSettings.tickerText || '');
    const [editAnnEnabled, setEditAnnEnabled] = useState(initialSettings.showTickerBanner || false);
    const [editLineup, setEditLineup] = useState(initialSettings.lineup || '');

    const [editStatus, setEditStatus] = useState(initialSettings.status || 'off');

    const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({
        show: false, message: '', type: 'success'
    });

    const isAdmin = localStorage.getItem('admin_auth') === 'true';

    // Update time for the progress bar
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 10000); // Update every 10s
        return () => clearInterval(timer);
    }, []);

    const viewersCount = 1245;
    const allActiveUsers = Array(12).fill({ pseudo: "User", country: "FR" });
    const fluxCurrentArtist = { artist: settings.mainFluxName || "EN ATTENTE" };

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            const res = await apiFetch('/api/settings', { headers: getAuthHeaders() });
            const globalSettings = res.ok ? await res.json() : {};

            const updatedTakeover = {
                ...globalSettings.takeover,
                title: editTitle,
                youtubeId: editYoutubeId,
                mainFluxName: editMainFluxName,
                tickerText: editAnnText,
                showTickerBanner: editAnnEnabled,
                lineup: editLineup,
                status: editStatus,
                enabled: editStatus !== 'off'
            };

            const updatedSettings = { ...globalSettings, takeover: updatedTakeover };

            const saveRes = await apiFetch('/api/settings/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(updatedSettings)
            });

            if (saveRes.ok) {
                setSettings(updatedTakeover);
                showNotification('Paramètres mis à jour !', 'success');
                setShowAdminPanel(false);
            } else {
                showNotification('Erreur lors de la sauvegarde', 'error');
            }
        } catch (e) {
            showNotification('Erreur de connexion', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // --- Lineup Logic ---
    const parseLineup = (text: string) => {
        if (!text) return [];
        return text.split('\n').filter(l => l.trim()).map(line => {
            const timeMatch = line.match(/^\[(.*?)\]/);
            const timePart = timeMatch ? timeMatch[1] : '';
            const rest = line.replace(/^\[.*?\]/, '').trim();
            const [artist, stage] = rest.split('|').map(s => s.trim());

            // Convert time to minutes for comparison
            let minutes = 0;
            if (timePart.includes(':')) {
                const [h, m] = timePart.split(':').map(Number);
                minutes = h * 60 + m;
            } else if (timePart.toLowerCase().includes('h')) {
                const [h, m] = timePart.toLowerCase().split('h').map(Number);
                minutes = h * 60 + (m || 0);
            }

            return { time: timePart, artist, stage: stage || 'Main Stage', minutes };
        }).sort((a, b) => a.minutes - b.minutes);
    };

    const getLineupProgress = (lineup: any[]) => {
        const now = currentTime.getHours() * 60 + currentTime.getMinutes();

        return lineup.map((item, index) => {
            const nextItem = lineup[index + 1];
            const start = item.minutes;
            // If it's the last item, we assume it's a 1-hour set or end of day (1439 mins)
            const end = nextItem ? nextItem.minutes : Math.min(start + 60, 1439);

            let progress = 0;
            if (now >= start && now < end) {
                progress = ((now - start) / (end - start)) * 100;
            } else if (now >= end) {
                progress = 100;
            }

            return { ...item, progress, isCurrent: now >= start && now < end };
        });
    };

    const parsedLineup = getLineupProgress(parseLineup(settings.lineup));

    return (
        <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden font-sans selection:bg-neon-red selection:text-white z-[9999]">

            {/* 1. TOP TICKER BANNER */}
            {settings.showTickerBanner && settings.tickerText && (
                <div className="h-12 w-full bg-neon-red flex items-center overflow-hidden border-b border-white/10 z-[100] shrink-0"
                    style={{ backgroundColor: settings.tickerBgColor || '#ff0000', color: settings.tickerTextColor || '#ffffff' }}>
                    <div className="flex whitespace-nowrap animate-ticker items-center">
                        {Array(5).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center mx-12 shrink-0">
                                <span className="text-[12px] font-black uppercase italic tracking-[0.3em]">
                                    {settings.tickerText}
                                </span>
                                <div className="w-2 h-2 rounded-full bg-white/30 ml-12" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. LIVE INFO BAR */}
            <div className="h-12 w-full bg-[#080808] border-b border-white/10 px-6 flex items-center justify-between z-[90] shrink-0 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full shadow-[0_0_15px_rgba(255,0,0,0.4)]">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">LIVE</span>
                    </div>
                    <h1 className="text-xl font-display font-black italic tracking-tighter uppercase">{settings.title || "LIVE TAKEOVER"}</h1>
                </div>

                <div className="flex items-center gap-6">
                    {isAdmin && (
                        <button
                            onClick={() => setShowAdminPanel(!showAdminPanel)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${showAdminPanel ? 'bg-neon-purple border-neon-purple text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                        >
                            <Settings className="w-4 h-4" />
                            <span className="text-[9px] font-black uppercase tracking-widest">ADMIN</span>
                        </button>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full cursor-pointer hover:bg-white/10 transition-all"
                        onClick={() => setShowUsersPanel(!showUsersPanel)}>
                        <Users className="w-4 h-4 text-neon-red" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{viewersCount} SPECTATEURS</span>
                    </div>
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
                                className="flex-1 bg-[#0a0a0a] p-8 overflow-y-auto custom-scrollbar"
                            >
                                <div className="max-w-3xl mx-auto space-y-10">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-6">
                                        <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">Configuration <span className="text-neon-purple">Studio</span></h2>
                                        <button onClick={() => setShowAdminPanel(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-6 h-6 text-gray-500" /></button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Titre du Live</label>
                                                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-neon-purple transition-all uppercase" placeholder="EX: MAIN STAGE LIVE" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Artiste Actuel (Bandeau)</label>
                                                <input type="text" value={editMainFluxName} onChange={e => setEditMainFluxName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-neon-purple transition-all uppercase" placeholder="EX: DEBORAH DE LUCA" />
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Mode de Diffusion</label>
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
                                                            {s === 'live' ? 'EN DIRECT' : s === 'edit' ? 'PRÉPARATION' : 'HORS LIGNE'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">ID Vidéo YouTube</label>
                                                <input type="text" value={editYoutubeId} onChange={e => setEditYoutubeId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-neon-purple transition-all" placeholder="EX: dQw4w9WgXcQ" />
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                                <div>
                                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Bandeau d'annonce</p>
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Activer le ticker banner</p>
                                                </div>
                                                <button onClick={() => setEditAnnEnabled(!editAnnEnabled)} className={`w-12 h-6 rounded-full relative transition-all ${editAnnEnabled ? 'bg-neon-red' : 'bg-white/10'}`}>
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editAnnEnabled ? 'left-7' : 'left-1'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Texte du Bandeau</label>
                                            <textarea value={editAnnText} onChange={e => setEditAnnText(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-neon-purple transition-all min-h-[120px] uppercase" placeholder="MESSAGE BANDEAU..." />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Planning (Format: [HH:mm] Artiste | Stage)</label>
                                            <textarea value={editLineup} onChange={e => setEditLineup(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-neon-purple transition-all min-h-[200px] uppercase font-mono" placeholder="[21:00] Artist A | Main Stage&#10;[22:00] Artist B | Main Stage" />
                                        </div>
                                    </div>

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

                {/* B. CHAT PANEL (30%) */}
                <div className="flex-1 h-full bg-[#0d0d0d] flex flex-col relative z-10 border-r border-white/10 shadow-2xl">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-neon-red/10 border border-neon-red/20 flex items-center justify-center text-neon-red">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                            <h2 className="text-xs font-black uppercase italic tracking-tighter text-white">LIVE INTERACTIF</h2>
                        </div>
                    </div>

                    <div className="flex gap-1 p-2 bg-black/20 border-b border-white/10 overflow-x-auto no-scrollbar">
                        {['CHAT', 'PLANNING', 'SHAZAM', 'AUDIO', 'SHOP'].map(tab => (
                            <button key={tab} onClick={() => setActiveChatTab(tab.toLowerCase())} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeChatTab === tab.toLowerCase() ? 'bg-white/10 text-white border border-white/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>{tab}</button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {activeChatTab === 'chat' ? (
                                <motion.div key="chat-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                    <div className="p-3 bg-neon-red/10 border border-neon-red/20 rounded-xl">
                                        <p className="text-[10px] text-neon-red font-black uppercase mb-1">Épinglé</p>
                                        <p className="text-xs text-white">Bienvenue ! Profitez du festival en direct ! 🔥</p>
                                    </div>
                                    {Array(15).fill(0).map((_, i) => (
                                        <div key={i} className="flex gap-3 animate-slide-in">
                                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-neon-cyan uppercase tracking-wider mb-0.5">SPECTATEUR_{i}</p>
                                                <p className="text-sm text-gray-300">INCROYABLE ! 🔥🔥🔥</p>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            ) : activeChatTab === 'planning' ? (
                                <motion.div key="planning-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Calendar className="w-5 h-5 text-neon-purple" />
                                        <h3 className="text-sm font-black uppercase italic tracking-tighter">Lineup Officielle</h3>
                                    </div>

                                    {parsedLineup.length > 0 ? parsedLineup.map((item, i) => (
                                        <div key={i} className={`p-4 rounded-2xl border transition-all relative overflow-hidden group ${item.isCurrent ? 'bg-neon-purple/10 border-neon-purple shadow-[0_0_20px_rgba(188,19,254,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                                            {/* PROGRESS BAR BACKGROUND */}
                                            {item.isCurrent && (
                                                <div className="absolute bottom-0 left-0 h-1 bg-neon-purple shadow-[0_0_10px_#bc13fe]" style={{ width: `${item.progress}%` }} />
                                            )}
                                            {item.progress === 100 && !item.isCurrent && (
                                                <div className="absolute bottom-0 left-0 h-1 bg-gray-600/30 w-full" />
                                            )}

                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${item.isCurrent ? 'text-neon-purple' : 'text-gray-500'}`}>
                                                    {item.time} {item.isCurrent && "• EN COURS"}
                                                </span>
                                                {item.isCurrent && <Zap className="w-3.5 h-3.5 text-neon-purple animate-pulse" />}
                                            </div>

                                            <div className="space-y-0.5">
                                                <h4 className={`text-sm font-black uppercase italic tracking-tighter ${item.isCurrent ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                                                    {item.artist}
                                                </h4>
                                                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{item.stage}</p>
                                            </div>


                                        </div>
                                    )) : (
                                        <div className="text-center py-10 opacity-30">
                                            <Calendar className="w-10 h-10 mx-auto mb-4" />
                                            <p className="text-[10px] font-black uppercase">Aucun planning disponible</p>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="text-center py-20 opacity-20 uppercase font-black text-xs tracking-widest">Contenu en attente</div>
                            )}
                        </AnimatePresence>
                    </div>

                    {activeChatTab === 'chat' && (
                        <div className="p-4 bg-[#080808] border-t border-white/10">
                            <div className="flex items-center gap-2 p-1 bg-black/40 border border-white/10 rounded-xl lg:rounded-2xl focus-within:border-neon-red/30 transition-all">
                                <button className="p-2 text-gray-500 hover:text-white"><Smile className="w-5 h-5" /></button>
                                <input className="flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-gray-700" placeholder="Écrire un message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} />
                                <button className="p-2 bg-neon-red text-white rounded-lg shadow-lg shadow-neon-red/20"><Send className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}
                </div>

                {/* C. VIEWER PANEL (10%) */}
                <AnimatePresence>
                    {showUsersPanel && (
                        <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: '10%', opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="h-full bg-[#0a0a0a] border-l border-white/10 flex flex-col shrink-0 overflow-hidden">
                            <div className="p-4 border-b border-white/10 shrink-0 flex justify-between items-center bg-white/[0.02]"><h2 className="text-[10px] font-black text-white uppercase italic tracking-widest flex items-center gap-2"><Users className="w-3.5 h-3.5 text-neon-red" /> VIEWERS</h2></div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {allActiveUsers.map((_, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors border border-white/[0.02]">
                                        <span className="text-[10px]">🇫🇷</span><span className="text-[10px] font-bold text-gray-400 uppercase truncate">User_{i}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <button onClick={() => setShowUsersPanel(!showUsersPanel)} className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-16 bg-white/5 hover:bg-white/10 border border-white/10 rounded-l-md flex items-center justify-center z-[100] transition-all">
                    {showUsersPanel ? <ChevronRight className="w-3 h-3 text-gray-500" /> : <ChevronLeft className="w-3 h-3 text-gray-500" />}
                </button>
            </div>

            <AnimatePresence>
                {toast.show && (
                    <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20, x: '-50%' }} className="fixed bottom-12 left-1/2 z-[200]">
                        <div className={`flex items-center gap-4 px-6 py-4 rounded-[2rem] shadow-2xl backdrop-blur-3xl border ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <span className="text-xs font-black uppercase tracking-widest text-white">{toast.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-20%); } }
                .animate-ticker { animation: ticker 30s linear infinite; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 17, 17, 0.5); }
                @font-face { font-family: 'DisplayFont'; src: url('/fonts/Stardust.woff2') format('woff2'); }
                .font-display { font-family: 'DisplayFont', 'Inter', sans-serif; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .animate-slide-in { animation: slideIn 0.3s ease-out forwards; }
                @keyframes slideIn { from { transform: translateX(10px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            `}</style>
        </div>
    );
}
