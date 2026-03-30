import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, Mail, Users } from 'lucide-react';

interface NewsletterMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NewsletterMenuModal({ isOpen, onClose }: NewsletterMenuModalProps) {
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
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-cyan to-neon-blue" />

                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                    Gestion <span className="text-neon-cyan">Newsletter</span>
                                </h2>
                                <p className="text-gray-400 font-medium">Communication par email</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link
                                to="/newsletter/create"
                                onClick={onClose}
                                className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-neon-cyan/10 hover:border-neon-cyan/50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-neon-cyan/20 rounded-2xl flex items-center justify-center mb-6 border border-neon-cyan/30 group-hover:scale-110 transition-transform">
                                    <Mail className="w-6 h-6 text-neon-cyan" />
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase italic mb-1">Nouvelle Newsletter</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Envoi groupé</p>
                            </Link>

                            <Link
                                to="/newsletter/admin"
                                onClick={onClose}
                                className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group"
                            >
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase italic mb-1">Abonnés</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Gérer la liste mail</p>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
