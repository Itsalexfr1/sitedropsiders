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
        <div className="bg-black flex flex-col h-full relative overflow-hidden group p-6 md:p-12 lg:p-20">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 blur-3xl pointer-events-none group-hover:bg-neon-cyan/10 transition-all text-black" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8 relative z-10">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="p-2 md:p-3 bg-neon-cyan/20 rounded-xl md:rounded-2xl border border-neon-cyan/30 shrink-0">
                        <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-neon-cyan" />
                    </div>
                    <div>
                        <h3 className="text-lg md:text-xl font-display font-black text-white uppercase italic leading-none whitespace-nowrap">Questions <span className="text-neon-cyan">Aléatoires</span></h3>
                        <p className="text-[8px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 md:mt-1">Interviews LiveTakeover</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 shrink-0">
                        <button 
                            onClick={() => setActiveTab('random')}
                            className={`px-3 md:px-4 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black transition-all ${activeTab === 'random' ? 'bg-neon-cyan text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            DÉ
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')}
                            className={`px-3 md:px-4 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black transition-all ${activeTab === 'history' ? 'bg-neon-cyan text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            HISTO
                        </button>
                    </div>

                    <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 gap-1 shrink-0">
                        <button 
                            onClick={() => setLang('FR')}
                            className={`px-2 md:px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black transition-all ${lang === 'FR' ? 'bg-neon-cyan text-black shadow-lg shadow-neon-cyan/20' : 'text-gray-500 hover:text-white'}`}
                        >
                            FR
                        </button>
                        <button 
                            onClick={() => setLang('EN')}
                            className={`px-2 md:px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black transition-all ${lang === 'EN' ? 'bg-neon-cyan text-black shadow-lg shadow-neon-cyan/20' : 'text-gray-500 hover:text-white'}`}
                        >
                            EN
                        </button>
                    </div>

                    <a
                        href="/admin/interview-questions"
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-500 hover:text-white transition-all shadow-xl shrink-0"
                        title="Gérer les questions"
                    >
                        <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </a>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative z-10 min-h-[300px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'random' ? (
                        <motion.div 
                            key="random-tab"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="h-full flex flex-col items-center justify-center space-y-6 md:space-y-8 py-4"
                        >
                            <div className="min-h-[140px] md:min-h-[180px] flex items-center justify-center w-full">
                                <AnimatePresence mode="wait">
                                    {currentQuestion ? (
                                        <motion.div 
                                            key={currentQuestion}
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="text-center space-y-4 cursor-pointer max-w-sm px-2"
                                            onClick={() => setSelectedEntry({ artist: artist || 'ARTISTE INCONNU', question: currentQuestion, time: 'NOW' })}
                                        >
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neon-cyan/10 border border-neon-cyan/30 rounded-full">
                                                <Sparkles className="w-3 h-3 text-neon-cyan" />
                                                <span className="text-[8px] md:text-[10px] font-black text-neon-cyan uppercase tracking-[0.2em]">SÉLECTIONNÉE</span>
                                            </div>
                                            <h4 className="text-3xl md:text-7xl font-display font-black text-white italic tracking-tighter leading-[1.1] px-4 md:px-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                                "{currentQuestion}"
                                            </h4>
                                        </motion.div>
                                    ) : (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center"
                                        >
                                            <p className="text-gray-600 font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-[9px] md:text-xs">
                                                {isShuffling ? 'SÉLECTION EN COURS...' : 'PRÊT POUR L\'ARTISTE ?'}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button 
                                onClick={handleShuffle}
                                disabled={isShuffling}
                                className="relative group p-1 shrink-0"
                            >
                                <div className="absolute inset-0 bg-neon-cyan rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                                <div className={`w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white/10 flex items-center justify-center transition-all ${isShuffling ? 'rotate-180 bg-white/5' : 'hover:scale-105 hover:border-neon-cyan/50 bg-black'}`}>
                                    <div className="flex flex-col items-center gap-1">
                                        {isShuffling ? (
                                            <RotateCcw className="w-8 h-8 md:w-10 md:h-10 text-neon-cyan animate-spin" />
                                        ) : (
                                            <>
                                                <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1.5 md:ml-2" />
                                                <span className="text-[10px] md:text-[12px] font-black text-white uppercase tracking-widest">LANCER</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </button>

                            <div className="w-full max-w-xs space-y-2 mt-auto">
                                <label className="text-[8px] md:text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 text-center block">Nom de l'artiste</label>
                                <input 
                                    type="text"
                                    value={artist}
                                    onChange={e => setArtist(e.target.value.toUpperCase())}
                                    placeholder="EX: CARL COX"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white text-center outline-none focus:border-neon-cyan transition-all font-black uppercase"
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="history-tab"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="h-full flex flex-col space-y-4"
                        >
                            <div className="space-y-2">
                                <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Filtrer par artiste</label>
                                <input 
                                    type="text"
                                    value={historySearch}
                                    onChange={e => setHistorySearch(e.target.value.toUpperCase())}
                                    placeholder="CHERCHER..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white font-black uppercase"
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
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
                                                <span className="text-[9px] md:text-[10px] font-black text-neon-cyan uppercase italic group-hover/item:translate-x-1 transition-transform">{item.artist}</span>
                                                <span className="text-[8px] md:text-[9px] font-medium text-gray-600">{item.time}</span>
                                            </div>
                                            <p className="text-[11px] md:text-xs text-white/90 font-bold leading-relaxed line-clamp-2">"{item.question}"</p>
                                        </motion.div>
                                    ))}
                                {history.length === 0 && (
                                    <div className="text-center py-20 text-gray-700 font-black uppercase text-[10px] tracking-widest italic">
                                        Aucun tirage
                                    </div>
                                )}
                            </div>

                            <button onClick={() => { if(confirm('Vider tout l\'historique ?')) { setHistory([]); localStorage.removeItem('interview_history'); } }} className="w-full py-3 bg-red-500/10 text-red-500 font-black text-[9px] uppercase tracking-widest rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">Vider l'historique</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {selectedEntry && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-2xl">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-4xl aspect-[4/3] sm:aspect-video bg-zinc-950 border border-white/10 rounded-3xl md:rounded-[3rem] p-6 md:p-12 flex flex-col items-center justify-center text-center shadow-3xl"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-neon-cyan via-white to-neon-cyan" />
                            <button onClick={() => setSelectedEntry(null)} className="absolute top-4 right-4 md:top-8 md:right-8 p-2 md:p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl md:rounded-2xl text-gray-500 hover:text-white transition-all"><X className="w-6 h-6 md:w-8 md:h-8" /></button>
                            
                            <div className="space-y-6 md:space-y-12 w-full">
                                <div className="space-y-2">
                                    <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-1.5 md:py-2 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full">
                                        <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-neon-cyan animate-pulse" />
                                        <span className="text-sm md:text-xl font-black text-neon-cyan uppercase tracking-[0.3em] md:tracking-[0.4em] italic">{selectedEntry.artist}</span>
                                    </div>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[8px] md:text-[10px] mt-2">Question sélectionnée pour l'Interview</p>
                                </div>

                                <div className="px-2">
                                    <h2 className="text-2xl md:text-6xl font-display font-black text-white italic tracking-tighter leading-tight drop-shadow-2xl">
                                        "{selectedEntry.question}"
                                    </h2>
                                </div>

                                <div className="pt-6 md:pt-10 flex items-center justify-center gap-3 md:gap-4">
                                    <div className="h-0.5 w-8 md:w-12 bg-white/10" />
                                    <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-white/20" />
                                    <div className="h-0.5 w-8 md:w-12 bg-white/10" />
                                </div>
                            </div>

                            <div className="absolute bottom-6 md:bottom-10 inset-x-0 flex justify-center">
                                <img src="/logo-dropsiders-white.png" className="h-4 md:h-6 opacity-20" alt="" />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="mt-4 md:mt-8 pt-4 md:pt-6 border-t border-white/5 flex items-center justify-between text-black">
                <div className="flex items-center gap-2 text-gray-600">
                    <Languages className="w-3.5 h-3.5" />
                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest">{lang === 'FR' ? 'Mode Français' : 'English Mode'}</span>
                </div>
                <div className="flex items-center gap-1">
                   <div className="w-1 h-1 rounded-full bg-neon-cyan animate-pulse" />
                   <span className="text-[8px] md:text-[9px] font-black text-gray-700 uppercase">Live</span>
                </div>
            </div>
        </div>
    );
}
