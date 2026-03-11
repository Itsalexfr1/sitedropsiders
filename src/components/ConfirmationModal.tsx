import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    accentColor?: 'neon-red' | 'neon-blue' | 'neon-cyan' | 'neon-purple' | 'neon-yellow';
}

export function ConfirmationModal({
    isOpen,
    title = "Attention",
    message,
    confirmLabel = "Quitter",
    cancelLabel = "Rester",
    onConfirm,
    onCancel,
    accentColor = 'neon-red'
}: ConfirmationModalProps) {

    const colors = {
        'neon-red': 'text-neon-red bg-neon-red/20 border-neon-red/30',
        'neon-blue': 'text-neon-blue bg-neon-blue/20 border-neon-blue/30',
        'neon-cyan': 'text-neon-cyan bg-neon-cyan/20 border-neon-cyan/30',
        'neon-purple': 'text-neon-purple bg-neon-purple/20 border-neon-purple/30',
        'neon-yellow': 'text-neon-yellow bg-neon-yellow/20 border-neon-yellow/30',
    };

    const activeColorClasses = colors[accentColor];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex justify-center items-start overflow-y-auto p-6 py-20 md:py-32 bg-black/90 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[40px] p-10 shadow-3xl overflow-hidden my-auto"
                    >
                        {/* Glow effect */}
                        <div className={`absolute -top-24 -right-24 w-64 h-64 ${activeColorClasses.split(' ')[1].replace('/20', '/5')} rounded-full blur-[100px] pointer-events-none`} />

                        <div className="flex flex-col items-center text-center relative z-10">
                            <div className={`mb-6 p-5 ${activeColorClasses.split(' ').slice(1).join(' ')} rounded-3xl border shadow-inner`}>
                                <AlertTriangle className={`w-10 h-10 ${activeColorClasses.split(' ')[0]}`} />
                            </div>

                            <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter mb-4">
                                {title}
                            </h2>

                            <p className="text-gray-400 font-medium mb-10 leading-relaxed text-lg">
                                {message}
                            </p>

                            <div className="flex flex-col w-full gap-4">
                                <button
                                    onClick={onConfirm}
                                    className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-neon-red hover:border-neon-red transition-all text-sm group"
                                >
                                    {confirmLabel}
                                </button>

                                <button
                                    onClick={onCancel}
                                    className={`w-full py-4 ${activeColorClasses.split(' ').slice(1, 2)} border border-white/20 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all text-sm`}
                                >
                                    {cancelLabel}
                                </button>
                            </div>
                        </div>

                        {/* Decoration lines */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
