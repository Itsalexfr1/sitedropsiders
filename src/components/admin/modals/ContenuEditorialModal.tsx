import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, FileText, Music, Mic, Video, Gamepad2, Zap } from 'lucide-react';

interface ContenuEditorialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenNews: () => void;
    onOpenMusique: () => void;
    onOpenInterview: () => void;
    onOpenRecap: () => void;
    onOpenQuiz: () => void;
}

export function ContenuEditorialModal({
    isOpen,
    onClose,
    onOpenNews,
    onOpenMusique,
    onOpenInterview,
    onOpenRecap,
    onOpenQuiz
}: ContenuEditorialModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-4xl w-full shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan via-white to-neon-cyan" />

                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                    Gestion <span className="text-neon-cyan">Contenu Editorial</span>
                                </h2>
                                <p className="text-gray-400 font-medium">Contrôle des articles et médias</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                            <button
                                onClick={onOpenNews}
                                className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-neon-blue/10 hover:border-neon-blue/50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-neon-blue/20 rounded-2xl flex items-center justify-center border border-neon-blue/30 group-hover:scale-110 transition-transform">
                                    <FileText className="w-6 h-6 text-neon-blue" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-white uppercase italic">News</h3>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Articles & Actus</p>
                                </div>
                            </button>

                            <button
                                onClick={onOpenMusique}
                                className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-neon-green/10 hover:border-neon-green/50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-neon-green/20 rounded-2xl flex items-center justify-center border border-neon-green/30 group-hover:scale-110 transition-transform">
                                    <Music className="w-6 h-6 text-neon-green" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-white uppercase italic">Musique</h3>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Focus & Releases</p>
                                </div>
                            </button>

                            <button
                                onClick={onOpenInterview}
                                className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-neon-purple/10 hover:border-neon-purple/50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-neon-purple/20 rounded-2xl flex items-center justify-center border border-neon-purple/30 group-hover:scale-110 transition-transform">
                                    <Mic className="w-6 h-6 text-neon-purple" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-white uppercase italic">Interviews</h3>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Gestion Artistes</p>
                                </div>
                            </button>

                            <button
                                onClick={onOpenRecap}
                                className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-neon-red/10 hover:border-neon-red/50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-neon-red/20 rounded-2xl flex items-center justify-center border border-neon-red/30 group-hover:scale-110 transition-transform">
                                    <Video className="w-6 h-6 text-neon-red" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-white uppercase italic">Récaps</h3>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Reportages</p>
                                </div>
                            </button>

                            <button
                                onClick={onOpenQuiz}
                                className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-neon-red/10 hover:border-neon-red/50 transition-all group relative"
                            >
                                <div className="w-12 h-12 bg-neon-red/20 rounded-2xl flex items-center justify-center border border-neon-red/30 group-hover:scale-110 transition-transform">
                                    <Gamepad2 className="w-6 h-6 text-neon-red" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-white uppercase italic">Quizz</h3>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Jeux & Blind Test</p>
                                </div>
                            </button>

                            <Link
                                to="/news/create?tab=Focus"
                                onClick={onClose}
                                className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-neon-purple/10 hover:border-neon-purple/50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-neon-purple/20 rounded-2xl flex items-center justify-center border border-neon-purple/30 group-hover:scale-110 transition-transform">
                                    <Zap className="w-6 h-6 text-neon-purple" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-white uppercase italic">News Focus</h3>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Focus Semaine</p>
                                </div>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
