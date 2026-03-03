import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    type = 'danger',
    confirmText = 'Confirmer',
    cancelText = 'Annuler'
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const colors = {
        danger: {
            icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
            btn: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
            border: 'border-red-500/20'
        },
        warning: {
            icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
            btn: 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/20',
            border: 'border-yellow-500/20'
        },
        info: {
            icon: <Info className="w-8 h-8 text-blue-500" />,
            btn: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20',
            border: 'border-blue-500/20'
        }
    };

    const currentColors = colors[type];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onCancel}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className={`relative w-full max-w-md bg-[#0a0a0a] border ${currentColors.border} rounded-[2.5rem] p-8 shadow-2xl overflow-hidden`}
                >
                    {/* Background glow */}
                    <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 ${type === 'danger' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`} />

                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="mb-6 p-4 bg-white/5 rounded-full border border-white/10">
                            {currentColors.icon}
                        </div>

                        <h3 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter mb-4">
                            {title}
                        </h3>

                        <p className="text-gray-400 font-medium leading-relaxed mb-10">
                            {message}
                        </p>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            <button
                                onClick={onCancel}
                                className="py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest text-[10px]"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                }}
                                className={`py-4 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-[10px] shadow-lg ${currentColors.btn}`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onCancel}
                        className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
