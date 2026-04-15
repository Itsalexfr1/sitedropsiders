import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, ShoppingBag, Plus, CreditCard, Users, Tag, ExternalLink, Package } from 'lucide-react';

interface ShopMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ShopMenuModal({ isOpen, onClose }: ShopMenuModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        className="bg-[#050505] border border-white/10 rounded-[3rem] p-10 max-w-2xl w-full shadow-[0_0_100px_rgba(255,18,114,0.15)] relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-white to-neon-red" />
                        
                        {/* Background subtle glow */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon-red/10 blur-[100px] rounded-full" />

                        <div className="flex justify-between items-start mb-12 relative z-10">
                            <div>
                                <h2 className="text-5xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                    GESTION <span className="text-neon-red">BOUTIQUE</span>
                                </h2>
                                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Pilotage de l'E-Commerce Dropsiders</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all hover:rotate-90"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                            <Link
                                to="/shop"
                                target="_blank"
                                onClick={onClose}
                                className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-5 hover:bg-neon-red/10 hover:border-neon-red/50 transition-all group"
                            >
                                <div className="w-14 h-14 bg-neon-red/20 rounded-2xl flex items-center justify-center border border-neon-red/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                    <ShoppingBag className="w-7 h-7 text-neon-red shadow-neon-red" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase italic leading-none mb-1">Voir le Shop</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Public / Client</p>
                                </div>
                            </Link>

                            <Link
                                to="/admin/shop"
                                onClick={onClose}
                                className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-5 hover:bg-white/10 transition-all group"
                            >
                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform flex-shrink-0">
                                    <Plus className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase italic leading-none mb-1">Catalogue</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Gérer les produits</p>
                                </div>
                            </Link>

                            <Link
                                to="/admin/shop?tab=orders"
                                onClick={onClose}
                                className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-5 hover:bg-white/10 transition-all group"
                            >
                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform flex-shrink-0">
                                    <Package className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase italic leading-none mb-1">Commandes</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Suivi des ventes</p>
                                </div>
                            </Link>

                            <Link
                                to="/admin/shop?tab=customers"
                                onClick={onClose}
                                className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-5 hover:bg-white/10 transition-all group"
                            >
                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform flex-shrink-0">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase italic leading-none mb-1">Clients</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Base de données</p>
                                </div>
                            </Link>

                            <Link
                                to="/admin/shop?tab=promos"
                                onClick={onClose}
                                className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-5 hover:bg-white/10 transition-all group"
                            >
                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform flex-shrink-0">
                                    <Tag className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase italic leading-none mb-1">Promotions</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Coupons & Offres</p>
                                </div>
                            </Link>

                            <a
                                href="https://fourthwall.com/dashboard"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-6 bg-neon-red/5 border border-neon-red/20 rounded-3xl flex items-center gap-5 hover:bg-neon-red/20 hover:border-neon-red/50 transition-all group"
                            >
                                <div className="w-14 h-14 bg-neon-red/10 rounded-2xl flex items-center justify-center border border-neon-red/20 group-hover:scale-110 transition-transform flex-shrink-0">
                                    <ExternalLink className="w-7 h-7 text-neon-red" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase italic leading-none mb-1">Fourthwall</h3>
                                    <p className="text-[10px] text-neon-red font-bold uppercase tracking-widest">Dashboard Externe</p>
                                </div>
                            </a>
                        </div>
                        
                        <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
                            <div className="flex gap-4">
                                <CreditCard className="w-5 h-5 text-gray-600" />
                                <ShoppingBag className="w-5 h-5 text-gray-600" />
                            </div>
                            <span className="text-[9px] font-black text-gray-700 uppercase tracking-[0.25em]">Dropsiders Commerce Engine v2.0</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
