import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Zap, MessageSquare, Trophy, Send, BarChart3, 
    CheckCircle2, AlertCircle, RefreshCcw, Users,
    Crown, Star, Sparkles, Wand2
} from 'lucide-react';
import { Client, Databases, ID, Query } from 'appwrite';

interface LiveInteractivityModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LiveInteractivityModal({ isOpen, onClose }: LiveInteractivityModalProps) {
    // Appwrite Config (Standalone for Admin Dashboard)
    const client = useMemo(() => new Client()
        .setEndpoint('https://fra.cloud.appwrite.io/v1')
        .setProject('69adc19b0027cb3b46d4'), []);
        
    const databases = useMemo(() => new Databases(client), [client]);
    const DATABASE_ID = 'live_chat';
    const COLLECTION_CHAT = 'live_messages';

    // Form States
    const [takeoverInput, setTakeoverInput] = useState('');
    const [pollInput, setPollInput] = useState('');
    const [quizInput, setQuizInput] = useState('');
    
    // Status States
    const [isSending, setIsSending] = useState(false);
    const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    // Tirage States
    const [isDrawing, setIsDrawing] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [drawHistory, setDrawHistory] = useState<{ pseudo: string, time: string }[]>(() => {
        const saved = localStorage.getItem('live_draw_history_winners');
        return saved ? JSON.parse(saved) : [];
    });

    const showNotify = (msg: string, type: 'success' | 'error') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const sendSystemMessage = async (message: string) => {
        setIsSending(true);
        try {
            await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                pseudo: "BOT_SYSTEM",
                message: message,
                color: "text-neon-cyan",
                time: "SYSTEM",
                country: "FR"
            });
            showNotify("Action diffusée sur le live !", "success");
        } catch (err: any) {
            showNotify(err.message, "error");
        } finally {
            setIsSending(false);
        }
    };

    const handleDrawWinner = async () => {
        setIsDrawing(true);
        setWinner(null);
        try {
            // Fetch last 100 messages to get active participants
            const res = await databases.listDocuments(DATABASE_ID, COLLECTION_CHAT, [
                Query.limit(100),
                Query.orderDesc('$createdAt')
            ]);
            
            const participants = Array.from(new Set(
                res.documents
                    .filter(m => m.pseudo && !m.pseudo.startsWith('BOT_'))
                    .map(m => m.pseudo)
            )) as string[];

            if (participants.length === 0) {
                showNotify("Aucun participant trouvé dans le chat récent.", "error");
                setIsDrawing(false);
                return;
            }

            // Simulate drawing animation
            setTimeout(() => {
                const luckyWinner = participants[Math.floor(Math.random() * participants.length)];
                setWinner(luckyWinner);
                setIsDrawing(false);
                
                // Add to history
                const newEntry = { 
                    pseudo: luckyWinner,
                    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) 
                };
                const nextHistory = [newEntry, ...drawHistory].slice(0, 50);
                setDrawHistory(nextHistory);
                localStorage.setItem('live_draw_history_winners', JSON.stringify(nextHistory));

                // Broadcast to chat
                sendSystemMessage(`[SYSTEM]:WINNER:🎉 LE GAGNANT DU TIRAGE EST : ${luckyWinner} ! 🎉`);
            }, 2000);

        } catch (err: any) {
            showNotify(err.message, "error");
            setIsDrawing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-neon-cyan/5 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-neon-cyan/20 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                                <Zap className="w-6 h-6 text-neon-cyan" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tighter">Interactif <span className="text-neon-cyan">Live</span></h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Outils de gestion d'audience en temps réel</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10">
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-10">
                        
                        {/* Notification Toast (Internal) */}
                        <AnimatePresence>
                            {notification && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className={`p-4 rounded-2xl flex items-center gap-3 font-bold uppercase text-[10px] tracking-widest border ${
                                        notification.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                                    }`}
                                >
                                    {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    {notification.msg}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* Tirage au Sort Section */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest italic flex items-center gap-3">
                                    <Trophy className="w-4 h-4 text-amber-500" />
                                    Tirage au Sort Express
                                </h3>
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center space-y-6 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    
                                    <div className="relative z-10">
                                        {winner ? (
                                            <motion.div 
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="space-y-4 py-4"
                                            >
                                                <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(245,158,11,0.4)]">
                                                    <Crown className="w-10 h-10 text-black" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Gagnant Sélectionné</p>
                                                    <h4 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter break-all">{winner}</h4>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <div className="space-y-4 py-4">
                                                <div className={`w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-white/10 ${isDrawing ? 'animate-spin' : ''}`}>
                                                    <Users className="w-10 h-10 text-gray-700" />
                                                </div>
                                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed">Piocher un participant au hasard parmi les derniers messages</p>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleDrawWinner}
                                            disabled={isDrawing}
                                            className="w-full py-4 bg-amber-500 text-black font-black uppercase text-xs rounded-2xl hover:scale-105 transition-all shadow-xl shadow-amber-500/10 flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {isDrawing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                            {isDrawing ? "TIRAGE EN COURS..." : winner ? "RE-TIRER UN GAGNANT" : "LANCER LE TIRAGE"}
                                        </button>

                                        {/* History Toggle/Preview */}
                                        {drawHistory.length > 0 && (
                                            <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Historique du Live</h4>
                                                    <button onClick={() => { setDrawHistory([]); localStorage.removeItem('live_draw_history_winners'); }} className="text-[8px] font-black text-red-500 hover:text-red-400 uppercase">Effacer</button>
                                                </div>
                                                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2 text-left">
                                                    {drawHistory.map((h, i) => (
                                                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                                <span className="text-[10px] font-bold text-white uppercase truncate">{h.pseudo}</span>
                                                            </div>
                                                            <span className="text-[9px] font-medium text-gray-600 shrink-0">{h.time}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Flash Alert Section */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest italic flex items-center gap-3">
                                    <Megaphone className="w-4 h-4 text-neon-cyan" />
                                    Alerte Takeover (Flash)
                                </h3>
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-4">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">Affiche un message stylisé en plein milieu de l'écran du live pendant quelques secondes.</p>
                                    <div className="space-y-2">
                                        <textarea 
                                            value={takeoverInput}
                                            onChange={e => setTakeoverInput(e.target.value)}
                                            className="w-full h-24 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white resize-none outline-none focus:border-neon-cyan transition-all"
                                            placeholder="FLASH: BIENVENUE SUR LE LIVE DROPSIDERS !"
                                        />
                                        <button 
                                            onClick={async () => {
                                                if(!takeoverInput) return;
                                                await sendSystemMessage(`[SYSTEM]:TAKEOVER_ALERT:${takeoverInput}`);
                                                setTakeoverInput('');
                                            }}
                                            disabled={isSending || !takeoverInput}
                                            className="w-full py-4 bg-neon-cyan text-black font-black uppercase text-xs rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            <Send className="w-4 h-4" />
                                            DIFFUSER L'ALERTE
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* Poll Section */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest italic flex items-center gap-3">
                                    <BarChart3 className="w-4 h-4 text-neon-purple" />
                                    Question Sondage (Poll)
                                </h3>
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-gray-500 uppercase ml-1">Format: Question | Choix 1 | Choix 2 | ...</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={pollInput}
                                                onChange={e => setPollInput(e.target.value)}
                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-neon-purple transition-all" 
                                                placeholder="Kiffes-tu le set ? | OUI | MOYEN | NON" 
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={async () => {
                                            if(!pollInput) return;
                                            const [question, ...options] = pollInput.split('|').map(s => s.trim());
                                            if (options.length < 2) {
                                                showNotify("Il faut au moins 2 options (Question | Opt1 | Opt2)", "error");
                                                return;
                                            }
                                            const pollData = { question, options: options.map(o => ({ text: o, votes: 0 })), active: true };
                                            await sendSystemMessage(`[SYSTEM]:POLL:${JSON.stringify(pollData)}`);
                                            setPollInput('');
                                        }}
                                        disabled={isSending || !pollInput}
                                        className="w-full py-4 bg-neon-purple text-white font-black uppercase text-xs rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        <BarChart3 className="w-4 h-4" />
                                        LANCER LE SONDAGE
                                    </button>
                                </div>
                            </div>

                            {/* Quiz Section */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest italic flex items-center gap-3">
                                    <Star className="w-4 h-4 text-pink-500" />
                                    Question Quiz (QCM)
                                </h3>
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-gray-500 uppercase ml-1">Format: Quest | Opt1 | Opt2 | Opt3 | Opt4 | IndexCorrect</label>
                                        <input 
                                            type="text" 
                                            value={quizInput}
                                            onChange={e => setQuizInput(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-pink-500 transition-all" 
                                            placeholder="Capitale FR | Lyon | Paris | Lille | Marseille | 1" 
                                        />
                                    </div>
                                    <button 
                                        onClick={async () => {
                                            if(!quizInput) return;
                                            const parts = quizInput.split('|').map(s => s.trim());
                                            if (parts.length < 3) {
                                                showNotify("Format incorrect", "error");
                                                return;
                                            }
                                            await sendSystemMessage(`[QUIZ_START]:${quizInput}`);
                                            setQuizInput('');
                                        }}
                                        disabled={isSending || !quizInput}
                                        className="w-full py-4 bg-pink-600 text-white font-black uppercase text-xs rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        <Wand2 className="w-4 h-4" />
                                        LANCER LE QUIZ
                                    </button>
                                </div>
                            </div>

                        </div>

                        {/* Quick Effects Row */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic flex items-center gap-3">
                                <Sparkles className="w-4 h-4 text-green-500" />
                                Effets Visuels Rapides
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'CONFETTI', cmd: '[SYSTEM]:CONFETTI', color: 'bg-pink-500', icon: '🎉' },
                                    { label: 'MATRIX', cmd: '[SYSTEM]:MATRIX', color: 'bg-green-500', icon: '📟' },
                                    { label: 'FIREWORKS', cmd: '[SYSTEM]:FIREWORKS', color: 'bg-amber-500', icon: '🎆' },
                                    { label: 'CLEAR CHAT', cmd: 'CLEAR', color: 'bg-red-600', icon: '🗑️' },
                                ].map(eff => (
                                    <button 
                                        key={eff.label}
                                        onClick={() => sendSystemMessage(eff.cmd)}
                                        className={`group relative overflow-hidden py-6 rounded-2xl ${eff.color} text-white font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl shadow-white/5`}
                                    >
                                        <div className="absolute top-2 right-2 text-lg opacity-20 group-hover:opacity-100 transition-all">{eff.icon}</div>
                                        {eff.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-white/5 border-t border-white/5 flex items-center justify-center gap-4 text-gray-600 text-[8px] font-black uppercase tracking-[0.3em]">
                        <BarChart3 className="w-3 h-3" />
                        <span>Système de Diffusion Appwrite Real-time v2.1</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
