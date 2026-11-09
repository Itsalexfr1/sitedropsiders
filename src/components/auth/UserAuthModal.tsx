import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { UserAuthCard } from './UserAuthCard';

interface UserAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'register';
}

export function UserAuthModal({ isOpen, onClose, initialMode = 'login' }: UserAuthModalProps) {
    if (typeof document === 'undefined') return null;

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 20 }
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100050] overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/80 backdrop-blur-xl"
                        />

                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="relative w-full max-w-lg my-8 z-10 text-left"
                        >
                            <UserAuthCard 
                                initialMode={initialMode} 
                                onClose={onClose} 
                                onSuccess={onClose}
                                showCloseButton={true}
                            />
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
