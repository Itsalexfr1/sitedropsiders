import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, BarChart3, Globe } from 'lucide-react';

interface StatsMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function StatsMenuModal({ isOpen, onClose }: StatsMenuModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-xl w-full shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan via-white to-neon-cyan" />

                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                    Analyses <span className="text-neon-cyan">& Stats</span>
                                </h2>
                                <p className="text-gray-400 font-medium">Performance du site</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <Link
                                to="/admin/stats"
                                onClick={onClose}
                                className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-neon-cyan/10 hover:border-neon-cyan/50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-neon-cyan/20 rounded-2xl flex items-center justify-center border border-neon-cyan/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                    <BarChart3 className="w-6 h-6 text-neon-cyan" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white uppercase italic mb-1">Vues Internes</h3>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Statistiques par article</p>
                                </div>
                            </Link>

                            <a
                                href="https://analytics.google.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-white/10 transition-all group"
                            >
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform flex-shrink-0">
                                    <Globe className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white uppercase italic mb-1">Google Analytics</h3>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Analyse détaillée</p>
                                </div>
                            </a>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
