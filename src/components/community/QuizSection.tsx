import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Music2, Plus, CheckCircle2, XCircle, Trophy, Send } from 'lucide-react';

type QuizType = 'QCM' | 'BLIND_TEST';

interface Quiz {
    id: string;
    type: QuizType;
    question: string;
    options: string[];
    correctAnswer: string;
    category: string;
    audioUrl?: string;
    author: string;
}

export function QuizSection() {
    const [activeTab, setActiveTab] = useState<'play' | 'submit'>('play');
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

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
    }, []);

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

    const handleAnswer = (answer: string) => {
        if (selectedAnswer) return;

        setSelectedAnswer(answer);
        const correct = answer === quizzes[currentQuizIndex].correctAnswer;
        if (correct) setScore(score + 1);

        setTimeout(() => {
            if (currentQuizIndex < quizzes.length - 1) {
                setCurrentQuizIndex(currentQuizIndex + 1);
                setSelectedAnswer(null);
            } else {
                setShowResult(true);
            }
        }, 1500);
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

    const resetQuiz = () => {
        setCurrentQuizIndex(0);
        setScore(0);
        setShowResult(false);
        setSelectedAnswer(null);
    };

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
                    onClick={() => setActiveTab('play')}
                    className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'play' ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                >
                    JOUER
                </button>
                <button
                    onClick={() => setActiveTab('submit')}
                    className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'submit' ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                >
                    PROPOSER UN QUIZZ
                </button>
            </div>

            {activeTab === 'play' ? (
                <div className="max-w-2xl mx-auto">
                    {quizzes.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                            <Gamepad2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">Aucun quiz disponible pour le moment.</p>
                        </div>
                    ) : showResult ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center"
                        >
                            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
                            <h2 className="text-3xl font-black text-white italic uppercase mb-2">Quiz Terminé !</h2>
                            <p className="text-gray-400 mb-8">Votre score : <span className="text-neon-red font-black">{score} / {quizzes.length}</span></p>
                            <button
                                onClick={resetQuiz}
                                className="px-8 py-3 bg-neon-red text-white font-black rounded-full hover:shadow-[0_0_20px_rgba(255,17,17,0.4)] transition-all"
                            >
                                REJOUER
                            </button>
                        </motion.div>
                    ) : (
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-[10px] font-black text-neon-red uppercase tracking-widest">
                                    QUESTION {currentQuizIndex + 1} / {quizzes.length}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-yellow-500" />
                                    <span className="text-white font-black">{score}</span>
                                </div>
                            </div>

                            <div className="mb-8">
                                <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-gray-400 uppercase mb-4 inline-block">
                                    {quizzes[currentQuizIndex].category}
                                </span>
                                <h3 className="text-2xl font-bold text-white mb-6">
                                    {quizzes[currentQuizIndex].question}
                                </h3>

                                {quizzes[currentQuizIndex].type === 'BLIND_TEST' && (
                                    <div className="mb-6 p-6 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center">
                                        <Music2 className="w-12 h-12 text-neon-red animate-pulse" />
                                        <p className="ml-4 text-sm text-gray-400">Écoutez l'extrait pour répondre...</p>
                                        {/* Audio player would go here */}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {quizzes[currentQuizIndex].options.map((option, idx) => {
                                    const isSelected = selectedAnswer === option;
                                    const isCorrectOpt = option === quizzes[currentQuizIndex].correctAnswer;

                                    let btnClass = "bg-white/5 border-white/10 text-white hover:bg-white/10";
                                    if (isSelected) {
                                        btnClass = isCorrectOpt ? "bg-green-500/20 border-green-500 text-green-500" : "bg-red-500/20 border-red-500 text-red-500";
                                    } else if (selectedAnswer && isCorrectOpt) {
                                        btnClass = "bg-green-500/20 border-green-500 text-green-500";
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswer(option)}
                                            disabled={!!selectedAnswer}
                                            className={`p-4 rounded-xl border text-left font-bold transition-all ${btnClass}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span>{option}</span>
                                                {isSelected && (
                                                    isCorrectOpt ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-8">
                    <h2 className="text-2xl font-black text-white italic uppercase mb-6 flex items-center gap-3">
                        <Plus className="w-6 h-6 text-neon-red" />
                        Proposer un Quizz
                    </h2>

                    <form onSubmit={handleFormSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Type</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as QuizType })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-red transition-all"
                                >
                                    <option value="QCM">QCM</option>
                                    <option value="BLIND_TEST">Blind Test</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Catégorie</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-red transition-all"
                                >
                                    <option value="Electro">Electro</option>
                                    <option value="Festivals">Festivals</option>
                                    <option value="DJs">DJs</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Votre Question</label>
                            <input
                                type="text"
                                required
                                value={formData.question}
                                onChange={e => setFormData({ ...formData, question: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-red transition-all"
                                placeholder="Quelle est la question ?"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Options de réponse (Cochez la bonne)</label>
                            {formData.options.map((option, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="correctAnswer"
                                        required
                                        checked={formData.correctAnswer === option && option !== ''}
                                        onChange={() => setFormData({ ...formData, correctAnswer: option })}
                                        className="w-4 h-4 accent-neon-red"
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
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-red transition-all"
                                        placeholder={`Option ${idx + 1}`}
                                    />
                                </div>
                            ))}
                        </div>

                        {formData.type === 'BLIND_TEST' && (
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Lien Audio (YouTube/SoundCloud)</label>
                                <input
                                    type="url"
                                    value={formData.audioUrl}
                                    onChange={e => setFormData({ ...formData, audioUrl: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-red transition-all"
                                    placeholder="https://..."
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Votre Pseudo</label>
                            <input
                                type="text"
                                required
                                value={formData.author}
                                onChange={e => setFormData({ ...formData, author: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-red transition-all"
                                placeholder="Alex"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitStatus === 'loading'}
                            className="w-full py-4 bg-neon-red text-white font-black rounded-xl hover:shadow-[0_0_30px_rgba(255,17,17,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {submitStatus === 'loading' ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : submitStatus === 'success' ? (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    ENVOYÉ AVEC SUCCÈS !
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    SOUMETTRE MA QUESTION
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
