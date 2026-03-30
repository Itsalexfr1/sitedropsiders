import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, Plus, RefreshCw, Loader2 } from 'lucide-react';

interface MusiqueMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateCharts: () => void;
    isUpdatingCharts: boolean;
}

export function MusiqueMenuModal({ 
    isOpen, 
    onClose, 
    onUpdateCharts, 
    isUpdatingCharts 
}: MusiqueMenuModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-green via-white to-neon-green" />

                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                    Gestion <span className="text-neon-green">Musique</span>
                                </h2>
                                <p className="text-gray-400 font-medium">Que souhaitez-vous faire ?</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <Link
                                to="/news/create?type=Musique"
                                onClick={onClose}
                                className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-neon-green/10 hover:border-neon-green/50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-neon-green/20 rounded-2xl flex items-center justify-center mb-6 border border-neon-green/30 group-hover:scale-110 transition-transform">
                                    <Plus className="w-6 h-6 text-neon-green" />
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase italic mb-1">Nouvel Article</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Focus musique</p>
                            </Link>

                            <button
                                onClick={onUpdateCharts}
                                disabled={isUpdatingCharts}
                                className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-neon-cyan/10 hover:border-neon-cyan/50 transition-all group flex flex-col items-center justify-center text-center"
                            >
                                <div className="w-12 h-12 bg-neon-cyan/20 rounded-2xl flex items-center justify-center mb-6 border border-neon-cyan/30 group-hover:scale-110 transition-transform">
                                    {isUpdatingCharts ? <Loader2 className="w-6 h-6 text-neon-cyan animate-spin" /> : <RefreshCw className="w-6 h-6 text-neon-cyan" />}
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase italic mb-1">Mettre à jour Top 10</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Forcer la rotation</p>
                            </button>
                        </div>

                        <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                            <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-bold tracking-widest text-center">
                                Note: Les classements sont synchronisés automatiquement tous les <span className="text-white">3 jours</span> via Beatport, Traxsource et Juno.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
