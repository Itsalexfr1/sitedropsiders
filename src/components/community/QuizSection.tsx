import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Music2, Plus, CheckCircle2, XCircle, Trophy, Send, Clock, Play, BarChart3, Zap, User } from 'lucide-react';

type QuizType = 'QCM' | 'BLIND_TEST' | 'IMAGE' | 'VIDEO';
type GameLength = 5 | 10 | 20;

interface Quiz {
    id: string;
    type: QuizType;
    question: string;
    options: string[];
    correctAnswer: string;
    category: string;
    audioUrl?: string;
    imageUrl?: string;
    youtubeId?: string;
    author: string;
}

interface ScoreRecord {
    id: string;
    pseudo: string;
    score: number;
    total: number;
    time: number;
    date: string;
}

export function QuizSection() {
    const [activeTab, setActiveTab] = useState<'play' | 'submit'>('play');
    const [gameState, setGameState] = useState<'selection' | 'playing' | 'results'>('selection');
    const [selectedMode, setSelectedMode] = useState<QuizType | 'BOTH'>('QCM');
    const [selectedLength, setSelectedLength] = useState<GameLength>(5);
    const [selectedTheme, setSelectedTheme] = useState('ALL');

    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [gameQuizzes, setGameQuizzes] = useState<Quiz[]>([]);
    const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [gamePseudo, setGamePseudo] = useState(localStorage.getItem('user_pseudo') || '');

    const [leaderboard, setLeaderboard] = useState<ScoreRecord[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        type: 'QCM' as QuizType,
        category: 'Festivals',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        audioUrl: '',
        author: ''
    });
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    useEffect(() => {
        fetchQuizzes();
        fetchLeaderboard();
    }, []);

    useEffect(() => {
        let interval: any;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimer(prev => prev + 0.1);
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const fetchQuizzes = async () => {
        try {
            const res = await fetch('/api/quiz/active');
            if (res.ok) {
                const data = await res.json();
                setQuizzes(data);
            }
        } catch (e) {
            console.error('Error fetching quizzes:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch('/api/quiz/leaderboard');
            if (res.ok) {
                const data = await res.json();
                setLeaderboard(data);
            }
        } catch (e) {
            // Fallback empty leaderboard
            setLeaderboard([]);
        }
    };

    const startNewGame = () => {
        let filtered = quizzes;

        if (selectedMode !== 'BOTH') {
            filtered = filtered.filter(q => q.type === selectedMode);
        }

        if (selectedTheme !== 'ALL') {
            if (selectedTheme === 'Blind Test') {
                filtered = filtered.filter(q => q.type === 'BLIND_TEST');
            } else if (selectedTheme === 'Images') {
                filtered = filtered.filter(q => q.type === 'IMAGE');
            } else if (selectedTheme === 'Videos') {
                filtered = filtered.filter(q => q.type === 'VIDEO');
            } else if (selectedTheme === 'Bass Music') {
                filtered = filtered.filter(q => q.category === 'Bass');
            } else {
                filtered = filtered.filter(q => q.category === selectedTheme);
            }
        }

        // Shuffle
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        const selection = shuffled.slice(0, selectedLength);

        if (!gamePseudo.trim()) {
            alert("Veuillez entrer votre prénom / pseudo pour participer !");
            return;
        }

        localStorage.setItem('user_pseudo', gamePseudo.trim());

        setGameQuizzes(selection);
        setCurrentQuizIndex(0);
        setScore(0);
        setTimer(0);
        setIsTimerRunning(true);
        setGameState('playing');
        setSelectedAnswer(null);
    };

    const handleAnswer = (answer: string) => {
        if (selectedAnswer) return;

        setSelectedAnswer(answer);
        const correct = answer === gameQuizzes[currentQuizIndex].correctAnswer;
        if (correct) setScore(score + 1);

        setTimeout(() => {
            if (currentQuizIndex < gameQuizzes.length - 1) {
                setCurrentQuizIndex(currentQuizIndex + 1);
                setSelectedAnswer(null);
            } else {
                finishGame();
            }
        }, 1000);
    };

    const finishGame = async () => {
        setIsTimerRunning(false);
        setGameState('results');

        const pseudo = gamePseudo.trim() || 'Anonyme';
        const result: ScoreRecord = {
            id: Date.now().toString(),
            pseudo,
            score,
            total: gameQuizzes.length,
            time: Number(timer.toFixed(1)),
            date: new Date().toISOString()
        };

        // Post to leaderboard
        try {
            await fetch('/api/quiz/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result)
            });
            fetchLeaderboard();
        } catch (e) { }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitStatus('loading');
        try {
            const res = await fetch('/api/quiz/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setSubmitStatus('success');
                setFormData({
                    type: 'QCM',
                    category: 'Festivals',
                    question: '',
                    options: ['', '', '', ''],
                    correctAnswer: '',
                    audioUrl: '',
                    author: ''
                });
                setTimeout(() => setSubmitStatus('idle'), 3000);
            } else {
                setSubmitStatus('error');
            }
        } catch (e) {
            setSubmitStatus('error');
        }
    };

    const themes = [
        'ALL', 'Blind Test', 'Images', 'Videos', 'Techno', 'Bass Music', 'Hardcore', 'Tech House', 'Big Room', 'Trance', 'Hardstyle', 'Afro House', 'Progressive', 'House', 'Festivals', 'DJs', 'Classics', 'Production'
    ];

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-neon-red border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-center gap-4">
                <button
                    onClick={() => { setActiveTab('play'); setGameState('selection'); }}
                    className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'play' ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-white/5 text-white/40 border border-white/10'}`}
                >
                    JOUER
                </button>
                <button
                    onClick={() => setActiveTab('submit')}
                    className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'submit' ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-white/5 text-white/40 border border-white/10'}`}
                >
                    PROPOSER UN QUIZZ
                </button>
            </div>

            {activeTab === 'play' ? (
                <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
                    {/* Main Game Area */}
                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            {gameState === 'selection' && (
                                <motion.div
                                    key="selection"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white/5 border border-white/10 rounded-[3rem] p-10 backdrop-blur-3xl overflow-hidden relative h-full"
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Zap className="w-32 h-32 text-white" />
                                    </div>
                                    <h3 className="text-3xl font-display font-black text-white italic uppercase mb-8 flex items-center gap-4">
                                        <Gamepad2 className="w-8 h-8 text-neon-red" />
                                        Paramètres du Quizz
                                    </h3>

                                    <div className="space-y-8 relative z-10">
                                        <div className="bg-neon-red/5 p-6 rounded-3xl border border-neon-red/20 shadow-[0_0_30px_rgba(255,17,17,0.05)]">
                                            <p className="text-[10px] font-black text-neon-red uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                                <User className="w-3 h-3" /> VOTRE PRÉNOM / PSEUDO (OBLIGATOIRE)
                                            </p>
                                            <input
                                                type="text"
                                                value={gamePseudo}
                                                onChange={(e) => setGamePseudo(e.target.value)}
                                                placeholder="EX: ALEX, LEO..."
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-black uppercase placeholder-white/20 focus:outline-none focus:border-neon-red transition-all"
                                            />
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-black text-neon-red uppercase tracking-[0.3em] mb-4">MODE DE JEU</p>
                                            <div className="flex flex-wrap gap-2 p-1 bg-black/40 rounded-2xl w-fit">
                                                {(['QCM', 'BLIND_TEST', 'BOTH'] as const).map(mode => (
                                                    <button
                                                        key={mode}
                                                        onClick={() => setSelectedMode(mode)}
                                                        className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${selectedMode === mode ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                                                    >
                                                        {mode === 'BOTH' ? 'TOUT' : (mode === 'QCM' ? 'QUIZZ' : 'BLIND TEST')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-black text-neon-red uppercase tracking-[0.3em] mb-4">NOMBRE DE QUESTIONS</p>
                                            <div className="flex gap-2 p-1 bg-black/40 rounded-2xl w-fit">
                                                {([5, 10, 20] as const).map(len => (
                                                    <button
                                                        key={len}
                                                        onClick={() => setSelectedLength(len)}
                                                        className={`px-8 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${selectedLength === len ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                                                    >
                                                        {len === 5 ? 'COURT (5)' : (len === 10 ? 'MOYEN (10)' : 'LONG (20)')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-black text-neon-red uppercase tracking-[0.3em] mb-4">THÈME</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                {themes.map(t => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setSelectedTheme(t)}
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest text-left transition-all ${selectedTheme === t ? 'bg-neon-red text-white' : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'}`}
                                                    >
                                                        {t.toUpperCase()}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={startNewGame}
                                            className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase tracking-[0.3em] text-xs hover:bg-neon-red hover:text-white transition-all shadow-2xl flex items-center justify-center gap-4 group"
                                        >
                                            COMMENCER LE JEU
                                            <Play className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {gameState === 'playing' && (
                                <motion.div
                                    key="playing"
                                    initial={{ opacity: 0, x: 100 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    className="bg-white/5 border border-white/10 rounded-[3rem] p-10 backdrop-blur-3xl"
                                >
                                    <div className="flex justify-between items-center mb-10">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-neon-red uppercase tracking-[0.4em] mb-2">
                                                QUESTION {currentQuizIndex + 1} / {gameQuizzes.length}
                                            </span>
                                            <h2 className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{gameQuizzes[currentQuizIndex].category}</h2>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="flex items-center gap-3 bg-neon-red/10 px-4 py-2 rounded-2xl border border-neon-red/20 shadow-[0_0_20px_rgba(255,17,17,0.1)]">
                                                <Clock className="w-5 h-5 text-neon-red" />
                                                <span className="text-xl font-display font-black text-white tabular-nums">{timer.toFixed(1)}s</span>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                                                <Trophy className="w-5 h-5 text-yellow-500" />
                                                <span className="text-xl font-display font-black text-white">{score}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-10 text-center">
                                        <h3 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-tighter italic mb-8 leading-tight">
                                            {gameQuizzes[currentQuizIndex].question}
                                        </h3>

                                        {gameQuizzes[currentQuizIndex].type === 'BLIND_TEST' && (
                                            <div className="mb-8 p-10 bg-black/40 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-gradient-to-br from-neon-red/10 to-transparent"></div>
                                                <Music2 className="w-16 h-16 text-neon-red animate-bounce relative z-10" />
                                                <p className="mt-4 text-[10px] font-black text-gray-500 uppercase tracking-widest relative z-10">L'extrait audio est en lecture...</p>

                                                {gameQuizzes[currentQuizIndex].audioUrl && (
                                                    <audio autoPlay key={gameQuizzes[currentQuizIndex].id}>
                                                        <source src={gameQuizzes[currentQuizIndex].audioUrl} type="audio/mpeg" />
                                                    </audio>
                                                )}
                                            </div>
                                        )}

                                        {gameQuizzes[currentQuizIndex].type === 'IMAGE' && gameQuizzes[currentQuizIndex].imageUrl && (
                                            <div className="mb-8 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl max-w-2xl mx-auto">
                                                <img
                                                    src={gameQuizzes[currentQuizIndex].imageUrl}
                                                    alt="Quiz"
                                                    className="w-full h-auto object-cover max-h-[400px]"
                                                />
                                            </div>
                                        )}

                                        {gameQuizzes[currentQuizIndex].type === 'VIDEO' && gameQuizzes[currentQuizIndex].youtubeId && (
                                            <div className="mb-8 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl aspect-video max-w-2xl mx-auto">
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    src={`https://www.youtube.com/embed/${gameQuizzes[currentQuizIndex].youtubeId}?autoplay=1`}
                                                    title="YouTube video player"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {gameQuizzes[currentQuizIndex].options.map((option, idx) => {
                                            const isSelected = selectedAnswer === option;
                                            const isCorrectOpt = option === gameQuizzes[currentQuizIndex].correctAnswer;

                                            let btnClass = "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/30";
                                            if (isSelected) {
                                                btnClass = isCorrectOpt ? "bg-green-500/20 border-green-500 text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]" : "bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]";
                                            } else if (selectedAnswer && isCorrectOpt) {
                                                btnClass = "bg-green-500/20 border-green-500 text-green-500";
                                            }

                                            return (
                                                <motion.button
                                                    key={idx}
                                                    whileHover={{ scale: selectedAnswer ? 1 : 1.02 }}
                                                    whileTap={{ scale: selectedAnswer ? 1 : 0.98 }}
                                                    onClick={() => handleAnswer(option)}
                                                    disabled={!!selectedAnswer}
                                                    className={`p-6 rounded-2xl border text-left font-black uppercase tracking-widest text-xs transition-all flex items-center justify-between ${btnClass}`}
                                                >
                                                    <span>{option}</span>
                                                    {isSelected && (
                                                        isCorrectOpt ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />
                                                    )}
                                                    {selectedAnswer && !isSelected && isCorrectOpt && (
                                                        <CheckCircle2 className="w-5 h-5 opacity-50" />
                                                    )}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}

                            {gameState === 'results' && (
                                <motion.div
                                    key="results"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white/5 border border-white/10 rounded-[4rem] p-10 text-center backdrop-blur-3xl relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-neon-red shadow-[0_0_20px_red]"></div>
                                    <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-10 drop-shadow-[0_0_30px_rgba(234,179,8,0.4)]" />
                                    <h2 className="text-4xl md:text-5xl font-display font-black text-white italic uppercase mb-4 tracking-tighter">TERMINE !</h2>

                                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-10">
                                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
                                            <p className="text-neon-red text-[8px] font-black uppercase mb-1">SCORE</p>
                                            <p className="text-3xl font-display font-black text-white">{score} / {gameQuizzes.length}</p>
                                        </div>
                                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
                                            <p className="text-neon-red text-[8px] font-black uppercase mb-1">TEMPS</p>
                                            <p className="text-3xl font-display font-black text-white tabular-nums">{timer.toFixed(1)}s</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <button
                                            onClick={() => setGameState('selection')}
                                            className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-neon-red hover:text-white transition-all uppercase tracking-[0.3em] text-[10px]"
                                        >
                                            REJOUER
                                        </button>
                                        <button
                                            onClick={() => setGameState('selection')}
                                            className="w-full py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all uppercase tracking-[0.3em] text-[10px]"
                                        >
                                            REVENIR
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Sidebar Leaderboard */}
                    <div className="w-full lg:w-80 shrink-0">
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 sticky top-32">
                            <div className="flex items-center gap-3 mb-8">
                                <Trophy className="w-6 h-6 text-yellow-500" />
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.3em]">CLASSEMENT GLOBAL</h4>
                            </div>

                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {leaderboard.length === 0 ? (
                                    <div className="py-10 text-center">
                                        <BarChart3 className="w-8 h-8 text-gray-800 mx-auto mb-4" />
                                        <p className="text-[10px] font-bold text-gray-600 uppercase">Aucun record</p>
                                    </div>
                                ) : (
                                    leaderboard.slice(0, 10).map((res, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className={`p-3.5 rounded-2xl border transition-all ${i === 0 ? 'bg-yellow-500/10 border-yellow-500/30 ring-1 ring-yellow-500/20' : (i === 1 ? 'bg-gray-400/10 border-gray-400/30' : (i === 2 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white/[0.02] border-white/5'))}`}
                                        >
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${i === 0 ? 'text-yellow-500' : (i === 1 ? 'text-gray-400' : (i === 2 ? 'text-orange-500' : 'text-gray-500'))}`}>
                                                    #{i + 1} • {res.pseudo}
                                                </span>
                                                {i < 3 && <Trophy className={`w-3 h-3 ${i === 0 ? 'text-yellow-500' : (i === 1 ? 'text-gray-400' : 'text-orange-500')}`} />}
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div className="flex flex-col">
                                                    <span className="text-lg font-display font-black text-white leading-none">{res.score}/{res.total}</span>
                                                    <span className="text-[7px] text-gray-600 font-bold mt-1 tracking-tighter uppercase">{new Date(res.date).toLocaleDateString()}</span>
                                                </div>
                                                <span className="text-[9px] font-black text-gray-400 tabular-nums bg-white/5 px-2 py-1 rounded-lg border border-white/10">{res.time}s</span>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/5">
                                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest leading-relaxed">
                                    Les scores sont classés par précision, puis par rapidité de réponse.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl relative overflow-hidden">
                    <div className="absolute -bottom-10 -left-10 opacity-5">
                        <Plus className="w-48 h-48 text-white" />
                    </div>
                    <h2 className="text-3xl font-display font-black text-white italic uppercase mb-8 flex items-center gap-4">
                        <Plus className="w-8 h-8 text-neon-red" />
                        Contribuer
                    </h2>

                    <form onSubmit={handleFormSubmit} className="space-y-6 relative z-10">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-neon-red uppercase tracking-widest mb-3">Type de question</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as QuizType })}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-neon-red transition-all appearance-none"
                                >
                                    <option value="QCM">QUIZZ CLASSIQUE</option>
                                    <option value="BLIND_TEST">BLIND TEST</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-neon-red uppercase tracking-widest mb-3">Catégorie</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-neon-red transition-all appearance-none"
                                >
                                    {themes.filter(t => t !== 'ALL').map(t => (
                                        <option key={t} value={t}>{t.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-neon-red uppercase tracking-widest mb-3">Libellé de la question</label>
                            <input
                                type="text"
                                required
                                value={formData.question}
                                onChange={e => setFormData({ ...formData, question: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-neon-red transition-all font-bold placeholder-gray-700"
                                placeholder="EX: QUI A SORTI L'ALBUM 'GENESYS' ?"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-neon-red uppercase tracking-widest mb-1">Choix de réponses (Cochez la bonne)</label>
                            <p className="text-[9px] text-gray-500 font-bold uppercase mb-4 tracking-widest">Remplissez les 4 options possibles</p>
                            {formData.options.map((option, idx) => (
                                <div key={idx} className="flex items-center gap-4 group">
                                    <input
                                        type="radio"
                                        name="correctAnswer"
                                        required
                                        checked={formData.correctAnswer === option && option !== ''}
                                        onChange={() => setFormData({ ...formData, correctAnswer: option })}
                                        className="w-5 h-5 accent-neon-red cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        required
                                        value={option}
                                        onChange={e => {
                                            const newOptions = [...formData.options];
                                            newOptions[idx] = e.target.value;
                                            setFormData({ ...formData, options: newOptions });
                                        }}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-neon-red transition-all font-bold placeholder-gray-800"
                                        placeholder={`REPONSE ${idx + 1}`}
                                    />
                                </div>
                            ))}
                        </div>

                        {formData.type === 'BLIND_TEST' && (
                            <div>
                                <label className="block text-[10px] font-black text-neon-red uppercase tracking-widest mb-3">Extrait Audio (Direct Link .mp3)</label>
                                <input
                                    type="url"
                                    value={formData.audioUrl}
                                    onChange={e => setFormData({ ...formData, audioUrl: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-neon-red transition-all font-bold"
                                    placeholder="https://example.com/track.mp3"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-black text-neon-red uppercase tracking-widest mb-3">Votre Signature</label>
                            <input
                                type="text"
                                required
                                value={formData.author}
                                onChange={e => setFormData({ ...formData, author: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-neon-red transition-all font-bold"
                                placeholder="ALEX / DROPSIDERS..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitStatus === 'loading'}
                            className="w-full py-6 bg-white text-black font-black rounded-3xl hover:bg-neon-red hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-2xl group"
                        >
                            {submitStatus === 'loading' ? (
                                <div className="w-6 h-6 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                            ) : submitStatus === 'success' ? (
                                <>
                                    <CheckCircle2 className="w-6 h-6" />
                                    ENVOYE POUR VALIDATION !
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    PROPOSER MA QUESTION
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
