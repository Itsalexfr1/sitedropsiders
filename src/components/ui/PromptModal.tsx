import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Link as LinkIcon } from 'lucide-react';

interface PromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (value: string) => void;
    title: string;
    message: string;
    defaultValue?: string;
    placeholder?: string;
}

export function PromptModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    defaultValue = '',
    placeholder = 'Entrez l\'URL...'
}: PromptModalProps) {
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
        }
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (value.trim()) {
            onConfirm(value.trim());
            onClose();
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden text-left"
                    >
                        {/* Style accents like in the screenshot candidate */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/10 rounded-full blur-[50px] -mr-16 -mt-16" />
                        
                        <div className="relative z-10">
                            <h3 className="text-white font-black uppercase tracking-[0.2em] text-[10px] opacity-40 mb-4 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-neon-purple rounded-full animate-pulse" />
                                DROPSIDERS.FR INDIQUE
                            </h3>
                            
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">
                                {title}
                            </h2>
                            <p className="text-gray-400 text-sm mb-8 font-medium leading-relaxed">
                                {message}
                            </p>

                            <div className="relative mb-8">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-purple/50">
                                    <LinkIcon className="w-4 h-4" />
                                </div>
                                <input
                                    autoFocus
                                    type="text"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                                    placeholder={placeholder}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-neon-purple focus:bg-white/[0.08] outline-none transition-all placeholder:text-gray-700"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={onClose}
                                    className="group relative h-14 bg-white/5 border border-white/10 text-gray-500 font-bold rounded-2xl hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest text-[10px] overflow-hidden"
                                >
                                    <span className="relative z-10">Annuler</span>
                                    <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[10px] border-r-[10px] border-b-transparent border-r-white/10 group-hover:border-r-white/30 transition-all" />
                                </button>
                                
                                <button
                                    onClick={handleConfirm}
                                    className="group relative h-14 bg-neon-purple text-white font-black rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        <Check className="w-4 h-4" /> OK
                                    </span>
                                    {/* The specific diagonal cut from screenshot */}
                                    <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[12px] border-r-[12px] border-b-transparent border-r-white/40" />
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors z-20"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>
    );
}
