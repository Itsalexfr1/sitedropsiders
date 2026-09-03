import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, Mail, Settings2, FileText, ShieldCheck, PenTool } from 'lucide-react';
import { isSuperAdmin } from '../../../utils/auth';
import { FacebookRecoveryModal } from '../FacebookRecoveryModal';

interface MessagesMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MessagesMenuModal({ isOpen, onClose }: MessagesMenuModalProps) {
    const currentUser = localStorage.getItem('admin_user') || '';
    const isAlex = isSuperAdmin(currentUser);
    const [isFbModalOpen, setIsFbModalOpen] = useState(false);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-xl w-full shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-orange via-white to-neon-orange" />

                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter mb-1">
                                    Messages & <span className="text-neon-orange">Facturation</span>
                                </h2>
                                <p className="text-gray-400 font-medium text-xs">Accès directs messagerie & gestion</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <Link
                                to="/admin/messages"
                                onClick={onClose}
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-neon-orange/10 hover:border-neon-orange/50 transition-all group"
                            >
                                <div className="w-10 h-10 bg-neon-orange/20 rounded-xl flex items-center justify-center border border-neon-orange/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                    <Mail className="w-5 h-5 text-neon-orange" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white uppercase italic">Boîte de réception</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Voir tous les messages</p>
                                </div>
                            </Link>

                            <Link
                                to="/admin/messages?tab=contact-settings"
                                onClick={onClose}
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all group"
                            >
                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform flex-shrink-0">
                                    <Settings2 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white uppercase italic">Paramètres Contact</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Emails & Destinataires</p>
                                </div>
                            </Link>

                            <Link
                                to="/admin/signatures"
                                onClick={onClose}
                                className="w-full p-4 bg-neon-orange/10 border border-neon-orange/30 rounded-2xl flex items-center gap-4 hover:bg-neon-orange/20 hover:border-neon-orange transition-all group"
                            >
                                <div className="w-10 h-10 bg-neon-orange/20 rounded-xl flex items-center justify-center border border-neon-orange/40 group-hover:scale-110 transition-transform flex-shrink-0">
                                    <PenTool className="w-5 h-5 text-neon-orange" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white uppercase italic">Signatures de Mail</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Générateur iPhone & Webmail</p>
                                </div>
                            </Link>

                            {isAlex && (
                                <>
                                    <Link
                                        to="/admin/factures"
                                        onClick={onClose}
                                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-neon-purple/10 hover:border-neon-purple/50 transition-all group"
                                    >
                                        <div className="w-10 h-10 bg-neon-purple/20 rounded-xl flex items-center justify-center border border-neon-purple/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                            <FileText className="w-5 h-5 text-neon-purple" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-white uppercase italic">Facturation</h3>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Générateur de factures & planning</p>
                                        </div>
                                    </Link>

                                    <button
                                        onClick={() => {
                                            onClose();
                                            setIsFbModalOpen(true);
                                        }}
                                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-[#1877F2]/15 hover:border-[#1877F2]/50 transition-all group text-left"
                                    >
                                        <div className="w-10 h-10 bg-[#1877F2]/20 rounded-xl flex items-center justify-center border border-[#1877F2]/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                            <ShieldCheck className="w-5 h-5 text-[#1877F2]" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-white uppercase italic">Déclaration Page Facebook</h3>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Déclaration signée Meta (Alex)</p>
                                        </div>
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
            <FacebookRecoveryModal
                isOpen={isFbModalOpen}
                onClose={() => setIsFbModalOpen(false)}
            />
        </AnimatePresence>
    );
}

