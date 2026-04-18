import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Languages, MessageSquare, ChevronRight, Sparkles } from 'lucide-react';

const QUESTIONS_FR = [
    "Quel est ton meilleur souvenir sur scène ?",
    "Comment as-tu commencé la musique ?",
    "Quel est ton track 'secret weapon' du moment ?",
    "Avec quel artiste rêverais-tu de collaborer ?",
    "Quelle est ta routine avant un set ?",
    "Quel conseil donnerais-tu à un producteur débutant ?",
    "Quel est le festival le plus fou que tu as fait ?",
    "Comment définirais-tu ton style en 3 mots ?",
    "Quelle est ta ville préférée pour jouer ?",
    "Quel est le premier album que tu as acheté ?",
    "Si tu n'étais pas DJ, que ferais-tu ?",
    "Quel est ton plat préféré après un set ?",
    "Ta pire galère en tournée ?",
    "Le dernier morceau que tu as écouté aujourd'hui ?",
    "Ton club préféré au monde ?"
];

const QUESTIONS_EN = [
    "What is your best memory on stage?",
    "How did you start making music?",
    "What is your current 'secret weapon' track?",
    "Which artist would you dream to collaborate with?",
    "What's your pre-set routine?",
    "What advice would you give to a beginner producer?",
    "What's the craziest festival you've ever played at?",
    "How would you define your style in 3 words?",
    "What's your favorite city to play in?",
    "What was the first album you ever bought?",
    "If you weren't a DJ, what would you be doing?",
    "What's your go-to meal after a set?",
    "Your worst tour nightmare?",
    "The last track you listened to today?",
    "Your favorite club in the world?"
];

export function InterviewRandomizer() {
    const [lang, setLang] = useState<'FR' | 'EN'>(() => {
        return (localStorage.getItem('interview_lang') as 'FR' | 'EN') || 'FR';
    });
    const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
    const [isShuffling, setIsShuffling] = useState(false);

    useEffect(() => {
        localStorage.setItem('interview_lang', lang);
    }, [lang]);

    const handleShuffle = () => {
        setIsShuffling(true);
        setCurrentQuestion(null);
        
        const questions = lang === 'FR' ? QUESTIONS_FR : QUESTIONS_EN;
        let count = 0;
        const maxShuffles = 10;
        
        const interval = setInterval(() => {
            setCurrentQuestion(questions[Math.floor(Math.random() * questions.length)]);
            count++;
            if (count >= maxShuffles) {
                clearInterval(interval);
                setIsShuffling(false);
            }
        }, 80);
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col h-full relative overflow-hidden group">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 blur-3xl pointer-events-none group-hover:bg-neon-cyan/10 transition-all" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-neon-cyan/10 rounded-2xl border border-neon-cyan/20">
                        <MessageSquare className="w-6 h-6 text-neon-cyan" />
                    </div>
                    <div>
                        <h3 className="text-xl font-display font-black text-white uppercase italic leading-none">Questions <span className="text-neon-cyan">Aléatoires</span></h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Interviews LivTakeover</p>
                    </div>
                </div>

                <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 gap-1">
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
            </div>

            <div className="flex-1 flex flex-col items-center justify-center space-y-8 relative z-10 py-10">
                <AnimatePresence mode="wait">
                    {currentQuestion ? (
                        <motion.div 
                            key={currentQuestion}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center space-y-4"
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
            </div>

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
