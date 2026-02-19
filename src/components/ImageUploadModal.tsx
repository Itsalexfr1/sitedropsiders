
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface ImageUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    accentColor?: string; // e.g. 'neon-pink', 'neon-red', etc. (Tailwind class part)
}

export function ImageUploadModal({ isOpen, onClose, accentColor = 'neon-pink' }: ImageUploadModalProps) {
    // Mapping accentColor to actual Tailwind classes since dynamic classes can be tricky
    let bgClass = "bg-neon-pink/20";
    let textClass = "text-neon-pink";
    let borderClass = "border-neon-pink/50";
    let hoverBgClass = "hover:bg-neon-pink/30";

    if (accentColor === 'neon-red') {
        bgClass = "bg-neon-red/20";
        textClass = "text-neon-red";
        borderClass = "border-neon-red/50";
        hoverBgClass = "hover:bg-neon-red/30";
    } else if (accentColor === 'neon-blue') {
        bgClass = "bg-neon-blue/20";
        textClass = "text-neon-blue";
        borderClass = "border-neon-blue/50";
        hoverBgClass = "hover:bg-neon-blue/30";
    } else if (accentColor === 'neon-orange') {
        bgClass = "bg-neon-orange/20";
        textClass = "text-neon-orange";
        borderClass = "border-neon-orange/50";
        hoverBgClass = "hover:bg-neon-orange/30";
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
                    >
                        {/* Background Decoration */}
                        <div className={`absolute top-0 right-0 w-64 h-64 ${bgClass.replace('/20', '/5')} rounded-full blur-[100px] pointer-events-none`} />

                        {/* Header */}
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 ${bgClass} rounded-2xl border border-white/5`}>
                                    <Upload className={`w-6 h-6 ${textClass}`} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tighter">
                                        Upload d'Images
                                    </h2>
                                    <p className="text-gray-400 text-sm">Hébergement externe sécurisé</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="space-y-6 relative z-10">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    Pour garantir la rapidité du site, nous utilisons un service externe dédié pour l'hébergement des images haute qualité.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex justify-center py-4">
                                    <ImageIcon className="w-16 h-16 text-gray-700 opacity-50" />
                                </div>

                                <button
                                    onClick={() => {
                                        window.open('https://www.image2url.com/bulk-image-upload', 'ImageUpload', 'width=800,height=600');
                                        // Optional: onClose(); 
                                    }}
                                    className={`w-full py-4 ${bgClass} ${borderClass} border ${textClass} rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${hoverBgClass} transition-all shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] group`}
                                >
                                    <span>Ouvrir l'Uploadeur</span>
                                    <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>

                                <div className="text-center">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Une fois l'upload terminé</p>
                                    <p className="text-sm text-gray-400">
                                        Copiez les liens générés et collez-les dans le champ correspondant de l'éditeur.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
