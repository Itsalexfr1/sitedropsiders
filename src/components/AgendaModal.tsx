import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { AgendaForm } from './admin/AgendaForm';

interface AgendaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingItem?: any;
}

export function AgendaModal({ isOpen, onClose, onSuccess, editingItem }: AgendaModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex justify-center items-start overflow-y-auto p-4 py-12 md:py-20">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-4xl bg-[#111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] my-auto"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                        <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tighter">
                            {editingItem ? 'Modifier Événement' : 'Nouvel Événement'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Scrollable Form */}
                    <div className="overflow-y-auto p-8">
                        <AgendaForm 
                            editingItem={editingItem} 
                            onSuccess={() => {
                                onSuccess();
                                onClose();
                            }}
                            onCancel={onClose}
                            isModal={true}
                        />
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
