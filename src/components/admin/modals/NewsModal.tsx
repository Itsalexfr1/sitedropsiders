import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, FileText, Music, Zap, Settings2, ArrowRight, Star } from 'lucide-react';

interface NewsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NewsModal({ isOpen, onClose }: NewsModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-cyan to-neon-blue" />

                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                    Gestion <span className="text-neon-blue">News</span>
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                            <Link
                                to="/news/create"
                                onClick={onClose}
                                className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-neon-blue/10 hover:border-neon-blue/50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-neon-blue/20 rounded-2xl flex items-center justify-center mb-6 border border-neon-blue/30 group-hover:scale-110 transition-transform">
                                    <FileText className="w-6 h-6 text-neon-blue" />
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase italic mb-1">Actualité</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Nouvel article news</p>
                            </Link>

                            <Link
                                to="/news/create?type=Musique"
                                onClick={onClose}
                                className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-neon-cyan/10 hover:border-neon-cyan/50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-neon-cyan/20 rounded-2xl flex items-center justify-center mb-6 border border-neon-cyan/30 group-hover:scale-110 transition-transform">
                                    <Music className="w-6 h-6 text-neon-cyan" />
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase italic mb-1">Musique</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Nouvel article musique</p>
                            </Link>

                            <Link
                                to="/news/create?tab=Focus"
                                onClick={onClose}
                                className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-neon-purple/10 hover:border-neon-purple/50 transition-all group sm:col-span-2 lg:col-span-1"
                            >
                                <div className="w-12 h-12 bg-neon-purple/20 rounded-2xl flex items-center justify-center mb-6 border border-neon-purple/30 group-hover:scale-110 transition-transform">
                                    <Zap className="w-6 h-6 text-neon-purple" />
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase italic mb-1">Focus</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Focus de la semaine</p>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link
                                to="/admin/manage?tab=News"
                                onClick={onClose}
                                className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between hover:bg-white/10 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-500/20 rounded-xl border border-gray-500/30">
                                        <Settings2 className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-white uppercase italic tracking-tight">Gérer les News</h3>
                                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Voir, modifier ou supprimer</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <Link
                                to="/admin/manage?tab=Focus"
                                onClick={onClose}
                                className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between hover:bg-neon-yellow/10 border-neon-yellow/20 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-neon-yellow/10 rounded-xl border border-neon-yellow/20">
                                        <Star className="w-5 h-5 text-neon-yellow fill-neon-yellow" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-white uppercase italic tracking-tight text-neon-yellow">Gérer les Focus</h3>
                                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Voir les articles épinglés</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-neon-yellow group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
