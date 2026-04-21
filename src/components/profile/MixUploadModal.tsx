import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, CheckCircle2, Music2, Headphones, Disc, Activity, AlertCircle, FileAudio, Info } from 'lucide-react';

interface MixUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: File | null;
    type: 'Track' | 'Remix' | 'Edit' | 'Mix';
    onSuccess: (mixData: any) => void;
}

export function MixUploadModal({ isOpen, onClose, file, type, onSuccess }: MixUploadModalProps) {
    const [step, setStep] = useState<'uploading' | 'metadata' | 'success'>('uploading');
    const [progress, setProgress] = useState(0);
    const [title, setTitle] = useState(file?.name.replace(/\.[^/.]+$/, "") || '');
    const [genre, setGenre] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && step === 'uploading' && file) {
            setProgress(0);
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setTimeout(() => setStep('metadata'), 500);
                        return 100;
                    }
                    return prev + Math.random() * 15;
                });
            }, 300);
            return () => clearInterval(interval);
        }
    }, [isOpen, step, file]);

    if (!isOpen) return null;

    const handleFinalize = () => {
        if (!title.trim()) {
            setError("Le titre est obligatoire");
            return;
        }
        setStep('success');
        onSuccess({
            title,
            genre,
            description,
            type,
            id: Math.random().toString(36).substr(2, 9),
            uploadDate: 'À l\'instant',
            duration: 'Calcul...' // In a real app we'd get this from the audio file
        });
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                />

                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(191,0,255,0.15)]"
                >
                    {/* Header Bloom */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-purple to-transparent opacity-50" />
                    
                    {/* Close Button */}
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-all z-20"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="p-8 md:p-12">
                        {step === 'uploading' && (
                            <div className="text-center space-y-8 py-10">
                                <div className="relative inline-block">
                                    <div className="w-24 h-24 bg-neon-purple/20 rounded-[32px] flex items-center justify-center relative z-10 animate-pulse">
                                        <Upload className="w-10 h-10 text-neon-purple animate-bounce" />
                                    </div>
                                    <div className="absolute inset-0 bg-neon-purple/20 blur-2xl rounded-full" />
                                </div>
                                
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">Upload en cours</h2>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">{file?.name}</p>
                                </div>

                                <div className="max-w-md mx-auto space-y-4">
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                                        <motion.div 
                                            className="h-full bg-neon-purple shadow-[0_0_15px_rgba(191,0,255,0.8)]"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-neon-purple">{Math.round(progress)}%</span>
                                        <span className="text-gray-600">Calcul du hash...</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 pt-10 border-t border-white/5">
                                    <div className="flex flex-col items-center gap-2">
                                        <Activity className="w-4 h-4 text-gray-700" />
                                        <span className="text-[8px] text-gray-700 font-black uppercase">Chiffrement</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <Disc className="w-4 h-4 text-neon-purple animate-spin" />
                                        <span className="text-[8px] text-neon-purple font-black uppercase">Processing</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <Headphones className="w-4 h-4 text-gray-700" />
                                        <span className="text-[8px] text-gray-700 font-black uppercase">Validation</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 'metadata' && (
                            <div className="space-y-8">
                                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                                    <div className="w-12 h-12 bg-neon-purple/20 rounded-2xl flex items-center justify-center">
                                        <FileAudio className="w-6 h-6 text-neon-purple" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-display font-black text-white italic uppercase tracking-widest leading-none">Studio Finalisation</h2>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Configure ton {type}</p>
                                    </div>
                                </div>

                                <div className="grid gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Titre de l'œuvre</label>
                                        <input 
                                            type="text" 
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value.toUpperCase())}
                                            placeholder="TITRE DU MIX / TRACK..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold uppercase tracking-widest focus:outline-none focus:border-neon-purple transition-all italic text-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Genre</label>
                                            <input 
                                                type="text" 
                                                value={genre}
                                                onChange={(e) => setGenre(e.target.value.toUpperCase())}
                                                placeholder="TECHNO, HOUSE, TRANCE..."
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold uppercase tracking-widest focus:outline-none focus:border-neon-purple transition-all italic text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Catégorie</label>
                                            <div className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-gray-400 font-black uppercase tracking-widest text-xs italic">
                                                {type}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Description (Optionnel)</label>
                                        <textarea 
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={3}
                                            placeholder="Partage l'histoire de ce mix ou ta tracklist..."
                                            className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white font-medium text-sm focus:outline-none focus:border-neon-purple transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <button 
                                        onClick={onClose}
                                        className="flex-1 py-4 bg-white/5 border border-white/10 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
                                    >
                                        Annuler
                                    </button>
                                    <button 
                                        onClick={handleFinalize}
                                        className="flex-[2] py-4 bg-neon-purple text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-neon-purple/30 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        Publier sur Dropsiders
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'success' && (
                            <div className="text-center space-y-8 py-10">
                                <div className="relative inline-block">
                                    <div className="w-24 h-24 bg-neon-green/20 rounded-[32px] flex items-center justify-center relative z-10">
                                        <CheckCircle2 className="w-12 h-12 text-neon-green" />
                                    </div>
                                    <div className="absolute inset-0 bg-neon-green/20 blur-2xl rounded-full" />
                                </div>
                                
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter">Publication Réussie</h2>
                                    <div className="max-w-xs mx-auto">
                                        <p className="text-[12px] text-gray-400 font-medium leading-relaxed italic border-l-2 border-neon-green/30 pl-4 py-1">
                                            "{title}" est désormais disponible sur ton profil public et dans le Studio Dropsiders.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button 
                                        onClick={onClose}
                                        className="px-12 py-4 bg-neon-green text-black rounded-2xl font-black uppercase italic tracking-widest shadow-lg shadow-neon-green/20 hover:scale-105 transition-all"
                                    >
                                        C'est parti
                                    </button>
                                </div>

                                <div className="mt-8 flex items-center justify-center gap-2 text-gray-700">
                                    <Info className="w-4 h-4" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.3em]">Hébergé sur Cloudflare R2</span>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
