import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, Plus, ArrowRight, Loader2, Instagram } from 'lucide-react';

interface SocialStudioModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoadingSocial: boolean;
    socialRecentArticles: any[];
    onSelectArticle: (article: any) => void;
}

export function SocialStudioModal({ 
    isOpen, 
    onClose, 
    isLoadingSocial, 
    socialRecentArticles, 
    onSelectArticle 
}: SocialStudioModalProps) {
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
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-[#ee2a7b] to-[#f9ce34]" />

                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                    Social <span className="text-neon-red">Studio</span>
                                </h2>
                                <p className="text-gray-400 font-medium">Générez des visuels pour vos réseaux</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Sélectionner un article récent ou créer à vide</div>
                            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                <button
                                    onClick={() => {
                                        onSelectArticle({ title: '', image: '' });
                                        onClose();
                                    }}
                                    className="w-full p-6 bg-neon-red/10 border border-neon-red/30 rounded-3xl flex items-center gap-6 hover:bg-neon-red/20 transition-all group text-left"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <Plus className="w-8 h-8 text-neon-red" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-white uppercase italic text-lg tracking-tighter">Visuel Vide / Manuel</h3>
                                        <p className="text-[10px] text-neon-red/60 font-black uppercase tracking-widest">Démarrer sans article</p>
                                    </div>
                                    <ArrowRight className="w-6 h-6 text-neon-red" />
                                </button>

                                {isLoadingSocial ? (
                                    <div className="py-10 flex justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-neon-red" />
                                    </div>
                                ) : socialRecentArticles.length > 0 ? (
                                    socialRecentArticles.map(article => (
                                        <button
                                            key={article.id}
                                            onClick={() => {
                                                onSelectArticle(article);
                                                onClose();
                                            }}
                                            className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 hover:bg-white/10 hover:border-white/20 transition-all group text-left"
                                        >
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/40 border border-white/10 flex-shrink-0">
                                                <img src={article.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-white uppercase italic truncate text-sm">{article.title}</h3>
                                                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">{article.date || article.pubDate}</p>
                                            </div>
                                            <Instagram className="w-5 h-5 text-gray-600 group-hover:text-neon-red transition-colors" />
                                        </button>
                                    ))
                                ) : (
                                    <div className="py-10 text-center text-gray-600 uppercase text-xs font-bold tracking-widest">Aucun article trouvé</div>
                                )}
                            </div>

                            <Link
                                to="/admin/manage"
                                className="block w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                onClick={onClose}
                            >
                                Voir tout le contenu
                            </Link>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
