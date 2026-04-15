import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, Plus, Settings2, ArrowRight } from 'lucide-react';

interface CommunauteMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CommunauteMenuModal({ isOpen, onClose }: CommunauteMenuModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-neon-purple to-neon-red" />

                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                    Gestion <span className="text-neon-red">Communauté</span>
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

                        <div className="space-y-4">
                            <Link
                                to="/galerie/create"
                                onClick={onClose}
                                className="w-full p-8 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-neon-red/10 hover:border-neon-red/50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-neon-red/20 rounded-2xl flex items-center justify-center border border-neon-red/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                    <Plus className="w-6 h-6 text-neon-red" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-bold text-white uppercase italic mb-1">Nouvel album</h3>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Créer une galerie photo</p>
                                </div>
                            </Link>

                            <Link
                                to="/admin/manage?tab=Communauté"
                                onClick={onClose}
                                className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between hover:bg-white/10 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-500/20 rounded-xl border border-gray-500/30">
                                        <Settings2 className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-white uppercase italic tracking-tight">Gérer les galeries</h3>
                                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Voir, modifier ou supprimer</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
