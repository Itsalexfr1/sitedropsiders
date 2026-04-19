import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthHeaders, apiFetch } from '../../utils/auth';
import { Play, RotateCcw, Languages, MessageSquare, ChevronRight, Sparkles, X, Settings } from 'lucide-react';

interface HistoryEntry {
    artist: string;
    question: string;
    time: string;
}

export function InterviewRandomizer() {
    const [lang, setLang] = useState<'FR' | 'EN'>(() => {
        return (localStorage.getItem('interview_lang') as 'FR' | 'EN') || 'FR';
    });
    const [questionsData, setQuestionsData] = useState<{fr: string[], en: string[]}>({ fr: [], en: [] });
    const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
    const [isShuffling, setIsShuffling] = useState(false);
    const [artist, setArtist] = useState('');
    const [activeTab, setActiveTab] = useState<'random' | 'history'>('random');
    const [historySearch, setHistorySearch] = useState('');
    const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>(() => {
        const saved = localStorage.getItem('interview_history');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await apiFetch('/api/interview-questions', { headers: getAuthHeaders() });
                if (res.ok) {
                    const data = await res.json();
                    setQuestionsData(data);
                }
            } catch (e) {
                console.error('Failed to fetch questions:', e);
            }
        };
        fetchQuestions();
    }, []);

    useEffect(() => {
        localStorage.setItem('interview_lang', lang);
    }, [lang]);

    const handleShuffle = () => {
        const questions = lang === 'FR' ? questionsData.fr : questionsData.en;
        if (!questions || questions.length === 0) {
            alert('Aucune question disponible pour cette langue.');
            return;
        }

        setIsShuffling(true);
        setCurrentQuestion(null);
        
        let count = 0;
        const maxShuffles = 10;
        
        const interval = setInterval(() => {
            const randomQ = questions[Math.floor(Math.random() * questions.length)];
            setCurrentQuestion(randomQ);
            count++;
            if (count >= maxShuffles) {
                clearInterval(interval);
                setIsShuffling(false);
                
                // Add to history
                const newEntry = {
                    artist: artist || 'ARTISTE INCONNU',
                    question: randomQ,
                    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                };
                const nextHistory = [newEntry, ...history].slice(0, 50);
                setHistory(nextHistory);
                localStorage.setItem('interview_history', JSON.stringify(nextHistory));
            }
        }, 80);
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col h-full relative overflow-hidden group">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 blur-3xl pointer-events-none group-hover:bg-neon-cyan/10 transition-all" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-neon-cyan/20 rounded-2xl border border-neon-cyan/30">
                        <MessageSquare className="w-6 h-6 text-neon-cyan" />
                    </div>
                    <div>
                        <h3 className="text-xl font-display font-black text-white uppercase italic leading-none">Questions <span className="text-neon-cyan">Aléatoires</span></h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Interviews LiveTakeover</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 shrink-0">
                        <button 
                            onClick={() => setActiveTab('random')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeTab === 'random' ? 'bg-neon-cyan text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            DÉ
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeTab === 'history' ? 'bg-neon-cyan text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            HISTORIQUE
                        </button>
                    </div>

                    <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 gap-1 shrink-0">
                        <button 
                            onClick={() => setLang('FR')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${lang === 'FR' ? 'bg-neon-cyan text-black shadow-lg shadow-neon-cyan/20' : 'text-gray-500 hover:text-white'}`}
                        >
                            FR
                        </button>
                        <button 
                            onClick={() => setLang('EN')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${lang === 'EN' ? 'bg-neon-cyan text-black shadow-lg shadow-neon-cyan/20' : 'text-gray-500 hover:text-white'}`}
                        >
                            EN
                        </button>
                    </div>

                    <a
                        href="/admin/interview-questions"
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-500 hover:text-white transition-all shadow-xl"
                        title="Gérer les questions"
                    >
                        <Settings className="w-4 h-4" />
                    </a>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative z-10">
                <AnimatePresence mode="wait">
                    {activeTab === 'random' ? (
                        <motion.div 
                            key="random-tab"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full flex flex-col items-center justify-center space-y-8 py-10"
                        >
                            <div className="min-h-[140px] flex items-center justify-center">
                                <AnimatePresence mode="wait">
                                    {currentQuestion ? (
                                        <motion.div 
                                            key={currentQuestion}
                                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="text-center space-y-4 cursor-pointer"
                                            onClick={() => setSelectedEntry({ artist: artist || 'ARTISTE INCONNU', question: currentQuestion, time: 'NOW' })}
                                        >
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neon-cyan/10 border border-neon-cyan/30 rounded-full">
                                                <Sparkles className="w-3 h-3 text-neon-cyan" />
                                                <span className="text-[10px] font-black text-neon-cyan uppercase tracking-[0.2em]">SÉLECTIONNÉE</span>
                                            </div>
                                            <h4 className="text-2xl md:text-3xl font-display font-black text-white italic tracking-tight leading-tight px-4 underline decoration-neon-cyan/30 underline-offset-8">
                                                "{currentQuestion}"
                                            </h4>
                                        </motion.div>
                                    ) : (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center"
                                        >
                                            <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-xs">
                                                {isShuffling ? 'Sélection en cours...' : 'Prêt pour l\'artiste ?'}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button 
                                onClick={handleShuffle}
                                disabled={isShuffling}
                                className="relative group p-1"
                            >
                                <div className="absolute inset-0 bg-neon-cyan rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                                <div className={`w-32 h-32 rounded-full border-4 border-white/10 flex items-center justify-center transition-all ${isShuffling ? 'rotate-180 bg-white/5' : 'hover:scale-105 hover:border-neon-cyan/50 bg-black'}`}>
                                    <div className="flex flex-col items-center gap-1">
                                        {isShuffling ? (
                                            <RotateCcw className="w-10 h-10 text-neon-cyan animate-spin" />
                                        ) : (
                                            <>
                                                <Play className="w-10 h-10 text-white fill-white ml-2" />
                                                <span className="text-[12px] font-black text-white uppercase tracking-widest">GO!</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </button>

                            <div className="w-full max-w-xs space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Nom de l'artiste</label>
                                <input 
                                    type="text"
                                    value={artist}
                                    onChange={e => setArtist(e.target.value.toUpperCase())}
                                    placeholder="EX: CARL COX"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white outline-none focus:border-neon-cyan transition-all font-black"
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="history-tab"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="h-full flex flex-col space-y-4"
                        >
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Filtrer par artiste</label>
                                <input 
                                    type="text"
                                    value={historySearch}
                                    onChange={e => setHistorySearch(e.target.value.toUpperCase())}
                                    placeholder="CHERCHER..."
                                    className="w-full bg-white/5 border border-white/10 rounded-[1.2rem] px-4 py-3 text-[10px] text-white font-black"
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                {history
                                    .filter(item => !historySearch || item.artist.includes(historySearch))
                                    .map((item, idx) => (
                                        <motion.div 
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => setSelectedEntry(item)}
                                            className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/10 hover:border-neon-cyan/50 cursor-pointer transition-all group/item"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-neon-cyan uppercase italic group-hover/item:translate-x-1 transition-transform">{item.artist}</span>
                                                <span className="text-[9px] font-medium text-gray-600">{item.time}</span>
                                            </div>
                                            <p className="text-xs text-white/90 font-bold leading-relaxed">"{item.question}"</p>
                                        </motion.div>
                                    ))}
                                {history.length === 0 && (
                                    <div className="text-center py-20 text-gray-600 font-black uppercase text-xs tracking-widest">
                                        Aucun tirage
                                    </div>
                                )}
                            </div>

                            <button onClick={() => { setHistory([]); localStorage.removeItem('interview_history'); }} className="w-full py-3 bg-red-500/10 text-red-500 font-black text-[9px] uppercase tracking-widest rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">Vider l'historique</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {selectedEntry && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative w-full max-w-4xl aspect-video bg-zinc-950 border border-white/10 rounded-[3rem] p-12 flex flex-col items-center justify-center text-center shadow-2xl"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-neon-cyan via-white to-neon-cyan" />
                            <button onClick={() => setSelectedEntry(null)} className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-500 hover:text-white transition-all"><X className="w-8 h-8" /></button>
                            
                            <div className="space-y-12">
                                <div className="space-y-2">
                                    <div className="inline-flex items-center gap-3 px-6 py-2 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full">
                                        <Sparkles className="w-5 h-5 text-neon-cyan animate-pulse" />
                                        <span className="text-xl font-black text-neon-cyan uppercase tracking-[0.4em] italic">{selectedEntry.artist}</span>
                                    </div>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Questions sélectionnée par le Studio</p>
                                </div>

                                <h2 className="text-4xl md:text-6xl font-display font-black text-white italic tracking-tighter leading-tight drop-shadow-2xl">
                                    "{selectedEntry.question}"
                                </h2>

                                <div className="pt-10 flex items-center justify-center gap-4">
                                    <div className="h-0.5 w-12 bg-white/10" />
                                    <Sparkles className="w-6 h-6 text-white/20" />
                                    <div className="h-0.5 w-12 bg-white/10" />
                                </div>
                            </div>

                            <div className="absolute bottom-10 inset-x-0 flex justify-center">
                                <img src="/logo-dropsiders-white.png" className="h-6 opacity-20" alt="" />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500">
                    <Languages className="w-4 h-4" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">{lang === 'FR' ? 'Mode Français' : 'English Mode'}</span>
                </div>
                <div className="flex items-center gap-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
                   <span className="text-[9px] font-black text-gray-600 uppercase">Ready</span>
                </div>
            </div>
        </div>
    );
}
