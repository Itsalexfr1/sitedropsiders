import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, ShieldAlert } from 'lucide-react';

interface CommunauteHubModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenGalerie: () => void;
    onOpenModeration: (tab: 'photos') => void;
    onCheckDuplicates: () => void;
    pendingPhotosCount: number;
}

export function CommunauteHubModal({
    isOpen,
    onClose,
    onOpenGalerie,
    onOpenModeration,
    onCheckDuplicates,
    pendingPhotosCount
}: CommunauteHubModalProps) {
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
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-white to-neon-red" />

                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                    COMMUNAUTÉ
                                </h2>
                                <p className="text-gray-400 font-medium tracking-widest uppercase text-[10px]">Espace de partage et galeries</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                            <button
                                onClick={onOpenGalerie}
                                className="p-8 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-6 hover:bg-neon-red/10 hover:border-neon-red/50 transition-all group lg:col-span-1"
                            >
                                <div className="w-16 h-16 bg-neon-red/20 rounded-2xl flex items-center justify-center border border-neon-red/30 group-hover:scale-110 transition-transform">
                                    <ImageIcon className="w-8 h-8 text-neon-red" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-white uppercase italic">Albums</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] leading-none mt-2">Galeries Photos</p>
                                </div>
                            </button>

                            <button
                                onClick={() => onOpenModeration('photos')}
                                className="p-8 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-6 hover:bg-neon-red/10 hover:border-neon-red/50 transition-all group lg:col-span-1 relative"
                            >
                                <div className="w-16 h-16 bg-neon-red/20 rounded-2xl flex items-center justify-center border border-neon-red/30 group-hover:scale-110 transition-transform">
                                    <ShieldAlert className="w-8 h-8 text-neon-red" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-white uppercase italic">Modération</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] leading-none mt-2">Photos Viewers</p>
                                </div>
                                {pendingPhotosCount > 0 && (
                                    <div className="absolute top-4 right-4 w-6 h-6 bg-neon-red rounded-full flex items-center justify-center border-2 border-[#050505] animate-bounce shadow-lg">
                                        <span className="text-[10px] font-black text-white">{pendingPhotosCount}</span>
                                    </div>
                                )}
                            </button>

                            <button
                                onClick={onCheckDuplicates}
                                className="p-8 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-6 hover:bg-neon-cyan/10 hover:border-neon-cyan/50 transition-all group lg:col-span-1"
                            >
                                <div className="w-16 h-16 bg-neon-cyan/20 rounded-2xl flex items-center justify-center border border-neon-cyan/30 group-hover:scale-110 transition-transform">
                                    <ShieldAlert className="w-8 h-8 text-neon-cyan" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-white uppercase italic">Doublons</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] leading-none mt-2">Check R2</p>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
