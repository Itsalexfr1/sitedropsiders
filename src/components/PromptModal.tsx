import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, CheckCircle2 } from 'lucide-react';

interface PromptModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue?: string;
    placeholder?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
    accentColor?: 'neon-red' | 'neon-blue' | 'neon-cyan' | 'neon-purple' | 'neon-yellow';
}

export function PromptModal({
    isOpen,
    title,
    message,
    defaultValue = "",
    placeholder = "Entrez une valeur...",
    confirmLabel = "Confirmer",
    cancelLabel = "Annuler",
    onConfirm,
    onCancel,
    accentColor = 'neon-blue'
}: PromptModalProps) {
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        if (isOpen) setValue(defaultValue);
    }, [isOpen, defaultValue]);

    const colors = {
        'neon-red': 'text-neon-red bg-neon-red/20 border-neon-red/30 focus:border-neon-red',
        'neon-blue': 'text-neon-blue bg-neon-blue/20 border-neon-blue/30 focus:border-neon-blue',
        'neon-cyan': 'text-neon-cyan bg-neon-cyan/20 border-neon-cyan/30 focus:border-neon-cyan',
        'neon-purple': 'text-neon-purple bg-neon-purple/20 border-neon-purple/30 focus:border-neon-purple',
        'neon-yellow': 'text-neon-yellow bg-neon-yellow/20 border-neon-yellow/30 focus:border-neon-yellow',
    };

    const activeColorClasses = colors[accentColor];

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        onConfirm(value);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-6 text-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/95 backdrop-blur-2xl"
                            onClick={onCancel}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[40px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden text-left my-8"
                        >
                            {/* Glow effect */}
                            <div className={`absolute -top-24 -right-24 w-64 h-64 ${activeColorClasses.split(' ')[1].replace('/20', '/5')} rounded-full blur-[100px] pointer-events-none`} />

                            <div className="relative z-10">
                                <div className="flex items-center gap-6 mb-8">
                                    <div className={`p-4 ${activeColorClasses.split(' ').slice(1, 3).join(' ')} rounded-2xl border shadow-inner flex-shrink-0`}>
                                        <HelpCircle className={`w-8 h-8 ${activeColorClasses.split(' ')[0]}`} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter leading-tight">
                                            {title}
                                        </h2>
                                        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">
                                            Action requise
                                        </p>
                                    </div>
                                </div>

                                <p className="text-gray-400 font-medium mb-8 leading-relaxed">
                                    {message}
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="relative">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                            placeholder={placeholder}
                                            className={`w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-bold outline-none transition-all focus:bg-white/10 ${activeColorClasses.split(' ').pop()}`}
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button
                                            type="submit"
                                            className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest transition-all text-xs flex items-center justify-center gap-3 bg-white text-black hover:scale-[1.02] active:scale-[0.98] shadow-xl`}
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            {confirmLabel}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={onCancel}
                                            className="flex-1 py-5 bg-white/5 border border-white/10 text-gray-500 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all text-xs flex items-center justify-center gap-3"
                                        >
                                            <X className="w-4 h-4" />
                                            {cancelLabel}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Decoration lines */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
}
