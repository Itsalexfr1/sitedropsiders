import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Headphones, Plus, CheckCircle2, XCircle, Trophy, Send, Play, User, Zap, Camera, Upload, Image as ImageIcon, Activity, Flame, Shield } from 'lucide-react';
import { uploadFile } from '../../utils/uploadService';
import { useUser } from '../../context/UserContext';
import { useLanguage } from '../../context/LanguageContext';
import { AudioWaveformSelector } from '../admin/AudioWaveformSelector';
import { UserAuthModal } from '../auth/UserAuthModal';
import { ContestValidationModal } from './ContestValidationModal';
import { Instagram } from 'lucide-react';

type QuizType = 'QCM' | 'BLIND_TEST' | 'IMAGE';
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
    imageType?: 'FESTIVAL' | 'ARTIST';
    revealEffect?: 'BLUR' | 'MOSAIC' | 'SILHOUETTE' | 'THERMAL';
    youtubeId?: string;
    spotifyUrl?: string;
    startTime?: number;
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
    const { isLoggedIn, user, updateScore } = useUser();
    useLanguage();
    const [activeTab, setActiveTab] = useState<'play' | 'submit'>('play');
    const [gameState, setGameState] = useState<'selection' | 'playing' | 'results'>('selection');
    const [selectedMode, setSelectedMode] = useState<QuizType | 'ALL'>('ALL');
    const [selectedLength, setSelectedLength] = useState<GameLength>(5);

    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [gameQuizzes, setGameQuizzes] = useState<Quiz[]>([]);
    const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [gamePseudo, setGamePseudo] = useState(user?.username || localStorage.getItem('user_pseudo') || '');
    const [drops, setDrops] = useState(parseInt(localStorage.getItem('user_drops') || '0'));
    const [isSurvivalMode, setIsSurvivalMode] = useState(false);
    const [isGhostMode, setIsGhostMode] = useState(false);

    const [leaderboard, setLeaderboard] = useState<ScoreRecord[]>([]);



    const quizCounts = useMemo(() => {
        return {
            BLIND_TEST: quizzes.filter(q => q.type === 'BLIND_TEST').length,
            IMAGE: quizzes.filter(q => q.type === 'IMAGE').length
        };
    }, [quizzes]);

    const audioRef = React.useRef<HTMLAudioElement>(null);

    // Form state
    const [formData, setFormData] = useState({
        type: 'QCM' as QuizType,
        category: 'Festivals',
        imageType: 'FESTIVAL' as 'FESTIVAL' | 'ARTIST',
        revealEffect: 'BLUR' as 'BLUR' | 'MOSAIC' | 'SILHOUETTE' | 'THERMAL',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        audioUrl: '',
        imageUrl: '',
        youtubeId: '',
        spotifyUrl: '',
        startTime: 0,
        author: user?.username || ''
    });

    useEffect(() => {
        if (isLoggedIn && user) {
            setGamePseudo(user.username);
            setFormData(p => ({ ...p, author: user.username }));
        }
    }, [isLoggedIn, user]);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [questionTimer, setQuestionTimer] = useState(15);
    const [totalGameTime, setTotalGameTime] = useState(0);
    const [isRevealing, setIsRevealing] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [isContestModeActive, setIsContestModeActive] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isContestValidationOpen, setIsContestValidationOpen] = useState(false);

    useEffect(() => {
        fetchQuizzes();
        fetchLeaderboard();
        
        // Fetch contest mode setting
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => setIsContestModeActive(data.contest_mode === true))
            .catch(() => setIsContestModeActive(false));
    }, []);

    useEffect(() => {
        let interval: any;
        if (gameState === 'playing' && !selectedAnswer && !isRevealing) {
            interval = setInterval(() => {
                setQuestionTimer(prev => {
                    if (prev <= 0.1) {
                        handleAnswer(''); // Auto-submit empty answer on timeout
                        return 0;
                    }
                    return prev - 0.1;
                });
                setTotalGameTime(prev => prev + 0.1);
            }, 100);
        }
        return () => clearInterval(interval);
    }, [gameState, selectedAnswer, isRevealing]);

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/quiz/active');
            if (res.ok) {
                const data = await res.json();
                setQuizzes(Array.isArray(data) ? data : []);
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
                setLeaderboard(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            setLeaderboard([]);
        }
    };

    const startNewGame = () => {
        if (isContestModeActive && !isLoggedIn) {
            setIsAuthModalOpen(true);
            return;
        }

        if (!gamePseudo.trim()) {
            alert("Veuillez entrer votre prénom / pseudo pour participer !");
            return;
        }

        let filtered = quizzes;
        
        // Force CONCOURS category if contest mode is active
        if (isContestModeActive) {
            const contestQuizzes = quizzes.filter(q => q.category === 'CONCOURS');
            if (contestQuizzes.length > 0) {
                filtered = contestQuizzes;
            }
        }

        if (selectedMode !== 'ALL') {
            filtered = filtered.filter(q => q.type === selectedMode);
        } else {
            // Visitors: ALL mode filters out 'Soon' categories
            filtered = filtered.filter(q => {
                if (q.type === 'BLIND_TEST' && quizCounts.BLIND_TEST < 30) return false;
                if (q.type === 'IMAGE' && quizCounts.IMAGE < 30) return false;
                return true;
            });
        }

        if (filtered.length === 0) {
            alert("Aucune question trouvée pour ces critères !");
            return;
        }

        localStorage.setItem('user_pseudo', gamePseudo.trim());

        // Shuffle
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        // If survival mode, we take all available or a large amount, but we stop at first error
        const selection = isSurvivalMode ? shuffled : shuffled.slice(0, selectedLength);

        setGameQuizzes(selection);
        setCurrentQuizIndex(0);
        setScore(0);
        setQuestionTimer(15);
        setTotalGameTime(0);
        setGameState('playing');
        setSelectedAnswer(null);
        setIsRevealing(false);
    };

    const handleAnswer = (answer: string) => {
        if (selectedAnswer || isRevealing) return;

        setSelectedAnswer(answer);
        const correct = answer === gameQuizzes[currentQuizIndex].correctAnswer;
        if (correct) setScore(score + 1);

        // Survival mode logic
        if (isSurvivalMode && !correct) {
            setIsRevealing(true);
            setTimeout(() => {
                finishGame();
            }, 2000);
            return;
        }

        // Se l'immagine è un artista o se vogliamo comunque una fase di rivelazione
        const isArtist = gameQuizzes[currentQuizIndex].imageType === 'ARTIST';

        if (isArtist || !answer) {
            setIsRevealing(true);
            setTimeout(() => {
                advanceQuiz();
            }, 3000);
        } else {
            setTimeout(() => {
                advanceQuiz();
            }, 1200);
        }
    };

    const advanceQuiz = () => {
        // Pause audio if any
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        if (currentQuizIndex < gameQuizzes.length - 1) {
            setCurrentQuizIndex(currentQuizIndex + 1);
            setSelectedAnswer(null);
            setIsRevealing(false);
            setQuestionTimer(15);
        } else {
            finishGame();
        }
    };

    // Robust audio listener
    useEffect(() => {
        if (gameState === 'playing' && gameQuizzes[currentQuizIndex]?.type === 'BLIND_TEST' && audioRef.current) {
            const el = audioRef.current;
            const baseStartTime = gameQuizzes[currentQuizIndex].startTime || 0;
            let actualStartTime = baseStartTime;
            let timeUpdateHandler: (() => void) | null = null;

            const initAudio = () => {
                if (baseStartTime === 0 && !isNaN(el.duration) && el.duration > 30) {
                    actualStartTime = (el.duration / 2) - 15;
                }
                el.currentTime = actualStartTime;
                el.play().catch(e => console.error("Autoplay blocked:", e));

                if (timeUpdateHandler) el.removeEventListener('timeupdate', timeUpdateHandler);

                timeUpdateHandler = () => {
                    if (el.currentTime > actualStartTime + 20) { // 20s max to avoid leaking full song
                        el.pause();
                    }
                };
                el.addEventListener('timeupdate', timeUpdateHandler);
            };

            el.addEventListener('loadedmetadata', initAudio);

            // If already loaded
            if (el.readyState >= 2) initAudio();

            return () => {
                el.removeEventListener('loadedmetadata', initAudio);
                if (timeUpdateHandler) el.removeEventListener('timeupdate', timeUpdateHandler);
                el.pause();
            };
        }
    }, [gameState, currentQuizIndex, gameQuizzes]);

    const finishGame = async () => {
        setGameState('results');

        // Calculate and add Drops
        const earnedDrops = score * 5 + (score === gameQuizzes.length ? 50 : 0);
        const newTotalDrops = drops + earnedDrops;
        setDrops(newTotalDrops);
        localStorage.setItem('user_drops', newTotalDrops.toString());

        if (isLoggedIn) {
            updateScore('quiz', score);
        }

        // Save record if not in ghost mode
        if (!isGhostMode) {
            try {
                const response = await fetch('/api/quiz/leaderboard', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pseudo: gamePseudo,
                        score,
                        total: gameQuizzes.length,
                        time: totalGameTime,
                        userEmail: user?.email,
                        userProvider: user?.provider,
                        userId: user?.id,
                        isContest: isContestModeActive
                    })
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    if (response.status === 403) {
                        alert(error.error || "Une seule participation autorisée !");
                    }
                }
                
                fetchLeaderboard();
            } catch (e) {
                console.error("Leaderboard error:", e);
            }
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitStatus('loading');

        try {
            // Check if admin or modo for auto-approval
            const adminAuth = localStorage.getItem('admin_auth') === 'true';
            const editeurAuth = localStorage.getItem('editeur_auth') === 'true';
            const adminUser = localStorage.getItem('admin_user')?.toUpperCase() || '';
            const chatPseudo = localStorage.getItem('chat_pseudo')?.toUpperCase() || '';
            const author = formData.author.toUpperCase();

            let isAutoApproved = adminAuth || editeurAuth || (adminUser && author === adminUser);

            // Fetch settings to check for moderators
            try {
                const settRes = await fetch('/api/settings');
                if (settRes.ok) {
                    const settingsBody = await settRes.json();
                    const mods = settingsBody.moderators?.split(',').map((s: string) => s.trim().toUpperCase()) || [];
                    if (mods.includes(author) || (chatPseudo && mods.includes(chatPseudo))) {
                        isAutoApproved = true;
                    }
                }
            } catch (e) { }

            const payload = {
                ...formData,
                approved: isAutoApproved,
                status: isAutoApproved ? 'active' : 'pending'
            };

            const res = await fetch('/api/quiz/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSubmitStatus('success');
                setTimeout(() => {
                    setSubmitStatus('idle');
                    setFormData({
                        type: 'QCM',
                        category: 'Festivals',
                        imageType: 'FESTIVAL',
                        revealEffect: 'BLUR',
                        question: '',
                        options: ['', '', '', ''],
                        correctAnswer: '',
                        audioUrl: '',
                        imageUrl: '',
                        youtubeId: '',
                        spotifyUrl: '',
                        startTime: 0,
                        author: ''
                    });
                    setActiveTab('play');
                }, 2000);
            } else {
                setSubmitStatus('error');
            }
        } catch (e) {
            setSubmitStatus('error');
        }
    };

    const themes = [
        'ALL', 'Blind Test', 'Techno', 'Bass Music', 'Hardcore', 'Tech House', 'Big Room', 'Trance', 'Hardstyle', 'Afro House', 'Progressive', 'House', 'Festivals', 'DJs', 'Classics', 'Production'
    ];

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-neon-red border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* SVG Filter for Mosaic Effect */}
            {/* SVG Filter for Mosaic Effect - Not using hidden to avoid browser issues */}
            <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
                <defs>
                    <filter id="pixelate-mosaic">
                        <feFlood x="2" y="2" height="2" width="2" />
                        <feComposite width="8" height="8" />
                        <feTile result="a" />
                        <feComposite in="SourceGraphic" in2="a" operator="in" />
                        <feMorphology operator="dilate" radius="4" />
                    </filter>
                    <filter id="thermal-effect">
                        <feColorMatrix type="matrix" values="
                            -1 0 0 0 1
                            0 -1 0 0 1
                            0 0 -1 0 1
                            0 0 0 1 0" />
                        <feComponentTransfer>
                            <feFuncR type="table" tableValues="0 0.5 1 1 1" />
                            <feFuncG type="table" tableValues="0 0 0.5 1 1" />
                            <feFuncB type="table" tableValues="0.5 0 0 0 1" />
                        </feComponentTransfer>
                    </filter>
                </defs>
            </svg>
            {/* Tabs */}
            {/* Removed Tabs */}

            {activeTab === 'play' ? (
                <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto px-4">
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
                                    <div className="flex justify-between items-start mb-8">
                                        <h3 className="text-3xl font-display font-black text-white italic uppercase flex items-center gap-4">
                                            <Gamepad2 className="w-8 h-8 text-neon-red" />
                                            Quizz
                                            {isContestModeActive && (
                                                <motion.span 
                                                    initial={{ scale: 0.8 }}
                                                    animate={{ scale: [0.8, 1.1, 0.8] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="ml-2 px-3 py-1 bg-neon-red text-white text-[8px] font-black rounded-full italic shadow-lg shadow-neon-red/20"
                                                >
                                                    JEU CONCOURS ACTIF
                                                </motion.span>
                                            )}
                                        </h3>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/20 rounded-2xl">
                                            <Zap className="w-4 h-4 text-neon-cyan animate-pulse" />
                                            <span className="text-sm font-black text-white tabular-nums">{drops} DROPS</span>
                                        </div>
                                    </div>

                                    <div className="space-y-6 relative z-10">
                                        <div className="space-y-4">
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Pseudo / Prénom</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={gamePseudo}
                                                    disabled={isContestModeActive && isLoggedIn}
                                                    onChange={e => setGamePseudo(e.target.value.toUpperCase())}
                                                    placeholder={isContestModeActive && !isLoggedIn ? "CONNEXION REQUISE POUR LE CONCOURS..." : "COMMENCE PAR TON NOM..."}
                                                    className={`w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-black uppercase tracking-wider focus:outline-none focus:border-neon-red transition-all ${isContestModeActive && isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                />
                                                {isContestModeActive && !isLoggedIn && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                        <Shield className="w-4 h-4 text-neon-red animate-pulse" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-4">
                                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Mode de Jeu</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[
                                                        { id: 'ALL', label: 'TOUT' },
                                                        { id: 'QCM', label: 'QCM' },
                                                        { id: 'BLIND_TEST', label: 'SON' },
                                                        { id: 'IMAGE', label: 'PHOTO' }
                                                    ].map(opt => {
                                                        const isBlindTestSoon = quizCounts.BLIND_TEST < 30;
                                                        const isImageSoon = quizCounts.IMAGE < 30;
                                                        const isSoon = (opt.id === 'BLIND_TEST' && isBlindTestSoon) || (opt.id === 'IMAGE' && isImageSoon);
                                                        const isDisabled = isSoon;

                                                        return (
                                                            <button
                                                                key={opt.id}
                                                                disabled={isDisabled}
                                                                onClick={() => setSelectedMode(opt.id as any)}
                                                                className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border relative ${selectedMode === opt.id ? 'bg-neon-red text-white border-neon-red shadow-lg shadow-neon-red/20' : isDisabled ? 'bg-white/[0.02] text-gray-500 border-white/5 cursor-not-allowed' : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'}`}
                                                            >
                                                                <span className={isDisabled ? 'opacity-40' : ''}>{opt.label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Questions</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[5, 10, 20].map(n => (
                                                        <button
                                                            key={n}
                                                            disabled={isSurvivalMode}
                                                            onClick={() => setSelectedLength(n as GameLength)}
                                                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedLength === n && !isSurvivalMode ? 'bg-white text-black border-white shadow-lg' : isSurvivalMode ? 'bg-white/5 text-gray-700 border-white/5 cursor-not-allowed' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/30'}`}
                                                        >
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Toggles Modes Speciaux */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setIsSurvivalMode(!isSurvivalMode)}
                                                className={`p-4 rounded-2xl border transition-all flex flex-col gap-1 items-start group ${isSurvivalMode ? 'bg-red-500/20 border-red-500/40 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Flame className={`w-4 h-4 ${isSurvivalMode ? 'animate-pulse' : 'group-hover:text-red-400'}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">MODE SURVIE</span>
                                                </div>
                                                <span className="text-[8px] font-medium text-gray-500 text-left">Une erreur = Fin de partie. Récompenses doublées !</span>
                                            </button>

                                            <button
                                                onClick={() => setIsGhostMode(!isGhostMode)}
                                                className={`p-4 rounded-2xl border transition-all flex flex-col gap-1 items-start group ${isGhostMode ? 'bg-gray-500/20 border-gray-500/40 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Shield className={`w-4 h-4 ${isGhostMode ? 'text-white' : 'group-hover:text-white'}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">MODE FANTÔME</span>
                                                </div>
                                                <span className="text-[8px] font-medium text-gray-500 text-left">Tes scores ne sont pas publics. Discrétion totale.</span>
                                            </button>
                                        </div>

                                        <button
                                            onClick={startNewGame}
                                            className={`w-full py-5 rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] md:text-xs transition-all shadow-2xl flex items-center justify-center gap-4 group ${isContestModeActive && !isLoggedIn ? 'bg-neon-red text-white hover:bg-white hover:text-black' : 'bg-white text-black hover:bg-neon-red hover:text-white'}`}
                                        >
                                            {isContestModeActive && !isLoggedIn ? (
                                                <>
                                                    <User className="w-5 h-5" />
                                                    SE CONNECTER POUR PARTICIPER
                                                </>
                                            ) : (
                                                <>
                                                    {isSurvivalMode ? 'LANCER LE DÉFI SURVIE' : 'COMMENCER LE JEU'}
                                                    <Play className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {gameState === 'playing' && (
                                <motion.div
                                    key="playing"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-white/5 border border-white/10 rounded-[3rem] p-10 backdrop-blur-3xl min-h-[600px] flex flex-col"
                                >
                                    {/* Header: User + Question count */}
                                    <div className="flex justify-between items-center mb-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-neon-red/20 border border-neon-red/40 flex items-center justify-center font-black text-neon-red text-sm italic">
                                                {gamePseudo.charAt(0)}
                                            </div>
                                            <h2 className="text-white font-black uppercase italic tracking-tighter">
                                                {gamePseudo} <span className="text-neon-red mx-2">/</span>
                                                <span className="text-gray-500">{currentQuizIndex + 1} SUR {gameQuizzes.length}</span>
                                            </h2>
                                        </div>

                                        <div className="flex items-center gap-3 bg-neon-red/10 px-4 py-2 rounded-2xl border border-neon-red/20">
                                            <div className="w-1.5 h-1.5 bg-neon-red rounded-full animate-ping" />
                                            <span className="text-base font-display font-black text-white tabular-nums">{questionTimer.toFixed(1)}s</span>
                                        </div>
                                    </div>

                                    <div className="mb-10 text-center flex-1 flex flex-col justify-center">
                                        <div className="mb-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-neon-red shadow-[0_0_10px_#ff1241]"
                                                initial={{ width: '100%' }}
                                                animate={{ width: `${(questionTimer / 15) * 100}%` }}
                                                transition={{ duration: 0.1, ease: "linear" }}
                                            />
                                        </div>
                                        <h3 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-tighter italic mb-10 leading-tight">
                                            {gameQuizzes[currentQuizIndex].type === 'IMAGE' ? 'QUI EST-CE ?' :
                                                gameQuizzes[currentQuizIndex].type === 'BLIND_TEST' ? 'QUEL EST CE TITRE ?' :
                                                    gameQuizzes[currentQuizIndex].question}
                                        </h3>


                                        {/* Visual Hider Area */}
                                        <div className="relative w-full aspect-video rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0a0a0a]">
                                            {gameQuizzes[currentQuizIndex].type === 'BLIND_TEST' ? (
                                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                                                    {/* Deep Ambient Glow */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-neon-red/10 via-transparent to-neon-cyan/5" />
                                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.03)_0%,transparent_70%)]" />

                                                    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
                                                        {/* Premium Visualizer Bars */}
                                                        <div className="flex items-end gap-2 h-48 px-24 relative z-10">
                                                            {[...Array(32)].map((_, i) => (
                                                                <motion.div
                                                                    key={i}
                                                                    animate={{
                                                                        height: [20, 40 + Math.random() * 120, 20],
                                                                        backgroundColor: i % 2 === 0 ? 'rgba(255, 0, 51, 0.4)' : 'rgba(0, 242, 255, 0.4)'
                                                                    }}
                                                                    transition={{
                                                                        duration: 0.5 + Math.random() * 0.8,
                                                                        repeat: Infinity,
                                                                        ease: "easeInOut",
                                                                        delay: i * 0.04
                                                                    }}
                                                                    className="w-3 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                                                                />
                                                            ))}
                                                        </div>

                                                        {/* Headphones Icon */}
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                            <div className="relative group">
                                                                <div className="absolute inset-0 bg-neon-cyan/20 blur-[80px] rounded-full scale-[2.5] animate-pulse" />
                                                                <Headphones className="w-40 h-40 text-white/5 rotate-[12deg] relative z-20 group-hover:scale-110 transition-transform duration-700" />
                                                            </div>
                                                        </div>

                                                        {/* Scanning Line */}
                                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-32 w-full animate-scan" style={{ top: '-100%' }} />

                                                        {/* Premium Badge */}
                                                        <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-2 bg-black/60 border border-white/10 rounded-full backdrop-blur-xl">
                                                            <div className="w-2 h-2 rounded-full bg-neon-red shadow-[0_0_10px_#ff0033]" />
                                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic font-display">BLIND TEST PREMIUM</span>
                                                            <div className="w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_10px_#00f2ff]" />
                                                        </div>
                                                    </div>

                                                    {/* Audio Element */}
                                                    {gameQuizzes[currentQuizIndex].audioUrl && (
                                                        <audio
                                                            ref={audioRef}
                                                            key={`${gameQuizzes[currentQuizIndex].id}-audio`}
                                                            src={`${gameQuizzes[currentQuizIndex].audioUrl}#t=${gameQuizzes[currentQuizIndex].startTime || 0},${(gameQuizzes[currentQuizIndex].startTime || 0) + 20}`}
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="w-full h-full relative">
                                                    {gameQuizzes[currentQuizIndex].type === 'IMAGE' && gameQuizzes[currentQuizIndex].imageUrl ? (
                                                        <div className="w-full h-full relative">
                                                            {/* Base Image (Result) */}
                                                            <img
                                                                src={gameQuizzes[currentQuizIndex].imageUrl}
                                                                alt="Quiz Result"
                                                                className="absolute inset-0 w-full h-full object-cover"
                                                            />
                                                            {/* Filtered Layer (Revealing) */}
                                                            <motion.img
                                                                src={gameQuizzes[currentQuizIndex].imageUrl}
                                                                alt="Quiz Hidden"
                                                                className="absolute inset-0 w-full h-full object-cover z-10"
                                                                animate={{
                                                                    opacity: (selectedAnswer || isRevealing) ? 0 : 1
                                                                }}
                                                                style={{
                                                                    filter: gameQuizzes[currentQuizIndex].revealEffect === 'SILHOUETTE'
                                                                        ? `brightness(0) opacity(${Math.max(0, (questionTimer / 15))})`
                                                                        : gameQuizzes[currentQuizIndex].revealEffect === 'MOSAIC'
                                                                            ? `url(#pixelate-mosaic) opacity(${Math.max(0, (questionTimer / 15))})`
                                                                            : gameQuizzes[currentQuizIndex].revealEffect === 'THERMAL'
                                                                                ? `url(#thermal-effect) opacity(${Math.max(0, (questionTimer / 15))})`
                                                                                : `blur(${Math.max(0, questionTimer * 4)}px)`
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]">
                                                            <Gamepad2 className="w-24 h-24 text-white/5 rotate-12" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Options Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
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
                                                        key={`${currentQuizIndex}-${idx}`}
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
                                    <div className="flex flex-col items-center justify-center space-y-8 text-center">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-neon-red/20 blur-[100px] animate-pulse rounded-full" />
                                            <Trophy className="w-24 h-24 text-neon-red relative z-10" />
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -top-2 -right-2 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-black text-xl shadow-xl"
                                            >
                                                !
                                            </motion.div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-4xl font-display font-black text-white italic uppercase tracking-tighter">
                                                {score === gameQuizzes.length ? 'PERFECTION !' : 'BIEN JOUÉ !'}
                                            </h3>
                                            <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px]">Score de {gamePseudo}</p>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="bg-white/5 border border-white/10 rounded-[2rem] px-8 py-6 flex flex-col items-center justify-center min-w-[140px]">
                                                <span className="text-5xl font-display font-black text-white italic">{score}</span>
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">Points</span>
                                            </div>
                                            <div className="bg-neon-cyan/5 border border-neon-cyan/20 rounded-[2rem] px-8 py-6 flex flex-col items-center justify-center min-w-[140px] relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-neon-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <motion.div
                                                    animate={{ y: [0, -5, 0] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                >
                                                    <Zap className="w-6 h-6 text-neon-cyan mb-2" />
                                                </motion.div>
                                                <span className="text-3xl font-display font-black text-white italic">+{score * 5 + (score === gameQuizzes.length ? 50 : 0)}</span>
                                                <span className="text-[10px] font-black text-neon-cyan uppercase tracking-widest mt-1">Drops</span>
                                            </div>
                                        </div>

                                        {isSurvivalMode && (
                                            <div className="px-6 py-3 bg-red-500/10 border border-red-500/30 rounded-full flex items-center gap-2">
                                                <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">DÉFI SURVIE TERMINÉ</span>
                                            </div>
                                        )}

                                        {isGhostMode && (
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Shield className="w-3 h-3" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Score non enregistré (Mode Fantôme)</span>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setGameState('selection')}
                                            className="px-12 py-4 bg-white/5 border border-white/10 text-white rounded-full font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white hover:text-black transition-all shadow-xl"
                                        >
                                            RETOURNER AU MENU
                                        </button>

                                        {isContestModeActive && (
                                            <button
                                                onClick={() => setIsContestValidationOpen(true)}
                                                className="px-12 py-4 bg-neon-red text-white rounded-full font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white hover:text-black transition-all shadow-xl shadow-neon-red/20 flex items-center gap-3"
                                            >
                                                <Instagram className="w-4 h-4" />
                                                VALIDER MA PARTICIPATION AU CONCOURS
                                            </button>
                                        )}

                                        <ContestValidationModal 
                                            isOpen={isContestValidationOpen}
                                            onClose={() => setIsContestValidationOpen(false)}
                                            score={score}
                                            total={gameQuizzes.length}
                                            pseudo={gamePseudo}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Sidebar Leaderboard */}
                    <div className="w-full lg:w-96 shrink-0">
                        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 sticky top-32 backdrop-blur-3xl">
                            <div className="flex flex-col gap-4 mb-8">
                                <div className="flex items-center gap-3">
                                    <Trophy className="w-6 h-6 text-yellow-500" />
                                    <h4 className="text-sm font-black text-white uppercase tracking-[0.3em]">CLASSEMENT GLOBAL</h4>
                                </div>
                                <button
                                    onClick={() => setActiveTab('submit')}
                                    className="text-[9px] font-black text-neon-red hover:text-white uppercase tracking-widest text-left transition-colors flex items-center gap-2 group"
                                >
                                    <Plus className="w-3 h-3" />
                                    PROPOSE TON QUIZZ
                                    <div className="h-px flex-1 bg-neon-red/20 group-hover:bg-neon-red/40 transition-colors" />
                                </button>
                            </div>

                            {/* Podium for top 3 */}
                            {leaderboard.length >= 3 && (
                                <div className="flex items-end justify-center gap-2 mb-12 h-56 px-2">
                                    {/* 2nd Place */}
                                    <div className="flex flex-col items-center flex-1">
                                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-2 overflow-hidden">
                                            <span className="text-white font-black text-[10px]">{leaderboard[1].pseudo.charAt(0)}</span>
                                        </div>
                                        <div className="w-full bg-gradient-to-t from-gray-500/20 to-gray-500/40 rounded-t-xl h-24 flex flex-col items-center justify-center p-2 border border-white/10">
                                            <span className="text-[9px] font-black text-white uppercase truncate w-full text-center">{leaderboard[1].pseudo}</span>
                                            <span className="text-[14px] font-black text-gray-300">{leaderboard[1].score}/{leaderboard[1].total}</span>
                                            <div className="mt-1 px-2 py-0.5 bg-gray-500/20 rounded-full text-[8px] font-black text-gray-400">2ÈME</div>
                                        </div>
                                    </div>

                                    {/* 1st Place */}
                                    <div className="flex flex-col items-center flex-1 -mb-2">
                                        <div className="w-12 h-12 rounded-full bg-neon-red/20 border-2 border-neon-red flex items-center justify-center mb-2 overflow-hidden shadow-[0_0_20px_rgba(255,18,65,0.3)]">
                                            <span className="text-white font-black text-lg italic">{leaderboard[0].pseudo.charAt(0)}</span>
                                        </div>
                                        <div className="w-full bg-gradient-to-t from-neon-red/20 to-neon-red/40 rounded-t-2xl h-36 flex flex-col items-center justify-center p-2 border border-neon-red/30">
                                            <Zap className="w-4 h-4 text-neon-red mb-1 animate-pulse" />
                                            <span className="text-[11px] font-black text-white uppercase truncate w-full text-center">{leaderboard[0].pseudo}</span>
                                            <span className="text-[18px] font-black text-white">{leaderboard[0].score}/{leaderboard[0].total}</span>
                                            <div className="mt-1 px-3 py-1 bg-neon-red rounded-full text-[10px] font-black text-white shadow-lg uppercase tracking-tighter">CHAMPION</div>
                                        </div>
                                    </div>

                                    {/* 3rd Place */}
                                    <div className="flex flex-col items-center flex-1">
                                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-2 overflow-hidden">
                                            <span className="text-white font-black text-[10px]">{leaderboard[2].pseudo.charAt(0)}</span>
                                        </div>
                                        <div className="w-full bg-gradient-to-t from-orange-500/30 to-orange-500/10 rounded-t-xl h-20 flex flex-col items-center justify-center p-2 border border-white/10">
                                            <span className="text-[9px] font-black text-white uppercase truncate w-full text-center">{leaderboard[2].pseudo}</span>
                                            <span className="text-[13px] font-black text-orange-400">{leaderboard[2].score}/{leaderboard[2].total}</span>
                                            <div className="mt-1 px-2 py-0.5 bg-orange-500/20 rounded-full text-[8px] font-black text-orange-400">3ÈME</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {leaderboard.slice(leaderboard.length >= 3 ? 3 : 0, 10).map((record, idx) => {
                                    const actualIdx = (leaderboard.length >= 3 ? 3 : 0) + idx;
                                    return (
                                        <div key={record.id || actualIdx} className="flex items-center justify-between group p-3 bg-white/[0.02] rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                                            <div className="flex items-center gap-4">
                                                <span className="w-8 text-[12px] font-black text-gray-600 group-hover:text-gray-400">#{actualIdx + 1}</span>
                                                <div className="flex flex-col">
                                                    <span className="text-[15px] font-black text-white group-hover:text-neon-red transition-colors uppercase italic tracking-tighter">{record.pseudo}</span>
                                                    <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">{record.score}/{record.total} • {record.time.toFixed(1)}s</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl relative overflow-hidden">
                    <div className="absolute -bottom-10 -left-10 opacity-5">
                        <Plus className="w-48 h-48 text-white" />
                    </div>
                    <h2 className="text-3xl font-display font-black text-white italic uppercase mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Plus className="w-8 h-8 text-neon-red" />
                            Contribuer
                        </div>
                        <button
                            onClick={() => setActiveTab('play')}
                            className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest"
                        >
                            RETOUR AU JEU
                        </button>
                    </h2>

                    <form onSubmit={handleFormSubmit} className="space-y-6 relative z-10">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-neon-red uppercase tracking-widest mb-3">Type de question</label>
                                <select
                                    value={formData.type}
                                    onChange={e => {
                                        const newType = e.target.value as QuizType;
                                        let newQuestion = formData.question;
                                        if (newType === 'BLIND_TEST') {
                                            newQuestion = "Arrivera tu a trouver le titre ?";
                                        } else if (newType === 'IMAGE') {
                                            newQuestion = formData.imageType === 'FESTIVAL'
                                                ? "Arrivera tu a reconnaitre ce festival ?"
                                                : "Arrivera tu a reconnaitre cet artiste ?";
                                        }
                                        setFormData({ ...formData, type: newType, question: newQuestion });
                                    }}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-neon-red transition-all appearance-none"
                                >
                                    <option value="QCM">QUIZZ CLASSIQUE</option>
                                    <option value="BLIND_TEST">BLIND TEST</option>
                                    <option value="IMAGE">QUIZZ PHOTO</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-neon-red uppercase tracking-widest mb-3">Catégorie</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-neon-red transition-all appearance-none"
                                >
                                    {themes.filter(t => t !== 'ALL' && t !== 'Blind Test').map(t => (
                                        <option key={t} value={t}>{t.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {formData.type === 'IMAGE' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData,
                                            imageType: 'FESTIVAL',
                                            revealEffect: 'BLUR',
                                            question: "Arrivera tu a reconnaitre ce festival ?"
                                        })}
                                        className={`p-4 rounded-2xl border font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${formData.imageType === 'FESTIVAL' ? 'bg-neon-red text-white border-neon-red' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                        FESTIVAL (NET)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData,
                                            imageType: 'ARTIST',
                                            revealEffect: 'BLUR',
                                            question: "Arrivera tu a reconnaitre cet artiste ?"
                                        })}
                                        className={`p-4 rounded-2xl border font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${formData.imageType === 'ARTIST' ? 'bg-neon-red text-white border-neon-red' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                                    >
                                        <Camera className="w-4 h-4" />
                                        ARTISTE (FLOU)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData,
                                            imageType: 'ARTIST',
                                            revealEffect: 'MOSAIC',
                                            question: "Arrivera tu a reconnaitre cet artiste ?"
                                        })}
                                        className={`p-4 rounded-2xl border font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${formData.revealEffect === 'MOSAIC' ? 'bg-neon-red text-white border-neon-red' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                                    >
                                        <Zap className="w-4 h-4" />
                                        MOSAÏQUE
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData,
                                            imageType: 'ARTIST',
                                            revealEffect: 'THERMAL',
                                            question: "Arrivera tu a reconnaitre cet artiste ?"
                                        })}
                                        className={`p-4 rounded-2xl border font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${formData.revealEffect === 'THERMAL' ? 'bg-neon-red text-white border-neon-red' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                                    >
                                        <Activity className="w-4 h-4" />
                                        THERMIQUE
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-neon-red uppercase tracking-widest">Image du Quizz</label>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex gap-4">
                                            <input
                                                type="url"
                                                required
                                                value={formData.imageUrl}
                                                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                                className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-neon-red transition-all font-bold placeholder-gray-700"
                                                placeholder="Lien de l'image (URL)..."
                                            />
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    id="quiz-image-upload"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            setUploading(true);
                                                            try {
                                                                const url = await uploadFile(file, 'quiz');
                                                                setFormData({ ...formData, imageUrl: url, revealEffect: Math.random() > 0.5 ? 'BLUR' : 'MOSAIC' });
                                                            } catch (err) {
                                                                alert("Erreur lors de l'upload");
                                                            } finally {
                                                                setUploading(false);
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    disabled={uploading}
                                                    onClick={() => document.getElementById('quiz-image-upload')?.click()}
                                                    className="h-full px-6 bg-white text-black rounded-2xl hover:bg-neon-red hover:text-white transition-all disabled:opacity-50"
                                                >
                                                    {uploading ? (
                                                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <Upload className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {formData.imageUrl && (
                                            <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 group">
                                                <img
                                                    src={formData.imageUrl}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover transition-all"
                                                    style={{
                                                        filter: formData.revealEffect === 'SILHOUETTE'
                                                            ? 'brightness(0)'
                                                            : formData.revealEffect === 'MOSAIC'
                                                                ? 'url(#pixelate-mosaic)'
                                                                : formData.revealEffect === 'BLUR'
                                                                    ? 'blur(20px)'
                                                                    : 'none'
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center">
                                                    <p className="text-[10px] font-black text-white uppercase tracking-widest mb-2">Aperçu de l'effet final</p>
                                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em]">{formData.revealEffect}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-black text-neon-red uppercase tracking-widest mb-3">Titre du morceau / Question</label>
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
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-neon-red uppercase tracking-widest mb-3">Extrait Audio (.mp3)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                value={formData.audioUrl}
                                                onChange={e => setFormData({ ...formData, audioUrl: e.target.value })}
                                                className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-neon-red transition-all font-bold"
                                                placeholder="URL MP3..."
                                            />
                                            <label className="cursor-pointer px-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all">
                                                <Upload className="w-5 h-5 text-gray-400" />
                                                <input
                                                    type="file"
                                                    accept="audio/*"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        setUploading(true);
                                                        try {
                                                            const url = await uploadFile(file);
                                                            setFormData({ ...formData, audioUrl: url });
                                                        } catch (err) { alert('Erreur upload'); }
                                                        finally { setUploading(false); }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Waveform Selector */}
                                {formData.audioUrl && (
                                    <AudioWaveformSelector
                                        audioUrl={formData.audioUrl}
                                        startTime={formData.startTime}
                                        duration={20}
                                        onChange={(newStart) => setFormData(prev => ({ ...prev, startTime: newStart }))}
                                    />
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-black text-neon-red uppercase tracking-widest mb-3">Votre Signature</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                                <input
                                    type="text"
                                    required
                                    value={formData.author}
                                    onChange={e => setFormData({ ...formData, author: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-red transition-all font-bold"
                                    placeholder="ALEX / DROPSIDERS..."
                                />
                            </div>
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
            )
            }
            {/* Authentication Modal */}
            <UserAuthModal 
                isOpen={isAuthModalOpen} 
                onClose={() => setIsAuthModalOpen(false)} 
            />
        </div>
    );
}
