import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Pencil, Mic, QrCode, Download, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreatorStudioMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExpress: () => void;
    onPubli: () => void;
    onDownloader?: () => void;
}

export function CreatorStudioMenuModal({ isOpen, onClose, onExpress, onPubli, onDownloader }: CreatorStudioMenuModalProps) {
    const navigate = useNavigate();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl pointer-events-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-orange via-neon-red to-neon-orange" />

                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                    Studio <span className="text-neon-orange">Génération</span>
                                </h2>
                                <p className="text-gray-400 font-medium font-bold uppercase tracking-widest text-[10px]">Outils de création rapide</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-lg"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                            {/* Générateur Express */}
                            <button
                                onClick={() => { onExpress(); onClose(); }}
                                className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-neon-red/10 hover:border-neon-red/50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-neon-red/20 rounded-2xl flex items-center justify-center border border-neon-red/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                    <Zap className="w-6 h-6 text-neon-red" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white uppercase italic mb-1">Générateur Express</h3>
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest leading-relaxed">Mise en page automatique pour articles news</p>
                                </div>
                            </button>

                            {/* Visuels Interviews */}
                            <button
                                onClick={() => { navigate('/interview-visuals'); onClose(); }}
                                className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-neon-cyan/10 hover:border-neon-cyan/50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-neon-cyan/20 rounded-2xl flex items-center justify-center border border-neon-cyan/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                    <Mic className="w-6 h-6 text-neon-cyan" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white uppercase italic mb-1">Visuels Interviews</h3>
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest leading-relaxed">Générateur YouTube & Instagram</p>
                                </div>
                            </button>

                            {/* Générateur QR Code */}
                            <button
                                onClick={() => { navigate('/qr'); onClose(); }}
                                className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-neon-purple/10 hover:border-neon-purple/50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-neon-purple/20 rounded-2xl flex items-center justify-center border border-neon-purple/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                    <QrCode className="w-6 h-6 text-neon-purple" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white uppercase italic mb-1">Générateur QR Code</h3>
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest leading-relaxed">Outils Marketing Flash</p>
                                </div>
                            </button>

                            {/* Aftermovie Maker */}
                            <button
                                onClick={() => { navigate('/aftermovie'); onClose(); }}
                                className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-neon-red/10 hover:border-neon-red/50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-neon-red/20 rounded-2xl flex items-center justify-center border border-neon-red/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                    <Video className="w-6 h-6 text-neon-red" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white uppercase italic mb-1">Aftermovie Studio</h3>
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest leading-relaxed">Générateur de séquences festivals</p>
                                </div>
                            </button>

                            {/* Downloader Médias */}
                            {onDownloader && (
                                <button
                                    onClick={() => { onDownloader(); onClose(); }}
                                    className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-neon-green/10 hover:border-neon-green/50 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-neon-green/20 rounded-2xl flex items-center justify-center border border-neon-green/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                        <Download className="w-6 h-6 text-neon-green" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-bold text-white uppercase italic mb-1">Downloader Médias</h3>
                                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest leading-relaxed">Outils Médias Vidéo & Image</p>
                                    </div>
                                </button>
                            )}

                            {/* Générateur Publi */}
                            <button
                                onClick={() => { onPubli(); onClose(); }}
                                className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-neon-orange/10 hover:border-neon-orange/50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-neon-orange/20 rounded-2xl flex items-center justify-center border border-neon-orange/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                    <Pencil className="w-6 h-6 text-neon-orange" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white uppercase italic mb-1">Générateur Publi</h3>
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest leading-relaxed">Outils de publication avancée (Alex)</p>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
