import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Lock, Eye, EyeOff, X, Check, AlertCircle, Loader2, KeyRound, ShieldCheck } from 'lucide-react';
import { useUser } from '../../context/UserContext';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
    const { user, changePassword } = useUser();
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    const [hasExistingPassword, setHasExistingPassword] = useState<boolean | null>(null);
    const [isLoadingCheck, setIsLoadingCheck] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Reset fields and check if user has a password when opening
    useEffect(() => {
        if (!isOpen) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError(null);
            setSuccessMessage(null);
            setShowCurrent(false);
            setShowNew(false);
            setShowConfirm(false);
            return;
        }

        if (user?.email) {
            setIsLoadingCheck(true);
            fetch(`/api/users/check-email?email=${encodeURIComponent(user.email)}`)
                .then(res => res.json())
                .then(data => {
                    if (data && typeof data.hasPassword === 'boolean') {
                        setHasExistingPassword(data.hasPassword);
                    } else {
                        setHasExistingPassword(true);
                    }
                })
                .catch(() => {
                    setHasExistingPassword(true);
                })
                .finally(() => {
                    setIsLoadingCheck(false);
                });
        }
    }, [isOpen, user?.email]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isSubmitting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSubmitting, onClose]);

    if (typeof document === 'undefined') return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (hasExistingPassword && !currentPassword) {
            setError('Veuillez renseigner votre mot de passe actuel.');
            return;
        }

        if (!newPassword) {
            setError('Veuillez renseigner un nouveau mot de passe.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Le nouveau mot de passe doit comporter au moins 6 caractères.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Les deux mots de passe ne correspondent pas.');
            return;
        }

        if (hasExistingPassword && currentPassword === newPassword) {
            setError('Le nouveau mot de passe doit être différent de l\'actuel.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await changePassword(currentPassword, newPassword);
            if (res.success) {
                setSuccessMessage('Mot de passe mis à jour avec succès !');
                setTimeout(() => {
                    onClose();
                }, 1400);
            } else {
                setError(res.error || 'Erreur lors du changement de mot de passe.');
            }
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100060] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !isSubmitting && onClose()}
                        className="fixed inset-0 bg-black/85 backdrop-blur-xl"
                    />

                    {/* Modal Window */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden z-10"
                    >
                        {/* Top Gradient Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-neon-cyan to-neon-red shadow-[0_0_12px_rgba(255,0,51,0.6)]" />

                        {/* Close button */}
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="absolute top-5 right-5 p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-neon-red/10 border border-neon-red/30 flex items-center justify-center shadow-[0_0_15px_rgba(255,0,51,0.2)]">
                                <KeyRound className="w-6 h-6 text-neon-red" />
                            </div>
                            <div>
                                <h3 className="text-lg font-display font-black text-white italic uppercase tracking-wider">
                                    {hasExistingPassword === false ? 'Créer un mot de passe' : 'Modifier le mot de passe'}
                                </h3>
                                <p className="text-[11px] text-gray-500 font-bold truncate max-w-[240px]">
                                    {user?.email}
                                </p>
                            </div>
                        </div>

                        {/* Notice for OAuth accounts setting password for first time */}
                        {hasExistingPassword === false && !isLoadingCheck && (
                            <div className="mb-5 p-3.5 bg-neon-cyan/10 border border-neon-cyan/20 rounded-2xl flex items-start gap-3">
                                <ShieldCheck className="w-4 h-4 text-neon-cyan mt-0.5 shrink-0" />
                                <p className="text-[11px] text-neon-cyan/90 leading-relaxed font-medium">
                                    Aucun mot de passe n'était encore associé à ce compte. Définissez-en un pour pouvoir vous connecter directement par email et mot de passe.
                                </p>
                            </div>
                        )}

                        {/* Error Alert */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3"
                            >
                                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-red-400 font-bold leading-relaxed">{error}</p>
                            </motion.div>
                        )}

                        {/* Success Alert */}
                        {successMessage && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mb-5 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center gap-3"
                            >
                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                                    <Check className="w-4 h-4" />
                                </div>
                                <p className="text-xs text-green-400 font-black tracking-wide uppercase">{successMessage}</p>
                            </motion.div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Current Password - only if user already has one */}
                            {hasExistingPassword !== false && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                        Mot de passe actuel
                                    </label>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                                        <input
                                            type={showCurrent ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            disabled={isSubmitting || !!successMessage}
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl pl-11 pr-11 py-3 text-sm text-white font-mono placeholder:text-gray-600 focus:border-neon-red outline-none transition-all disabled:opacity-50"
                                            autoFocus={hasExistingPassword === true}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrent(!showCurrent)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                        >
                                            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* New Password */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                    Nouveau mot de passe
                                </label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        type={showNew ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min. 6 caractères"
                                        disabled={isSubmitting || !!successMessage}
                                        className="w-full bg-black/60 border border-white/10 rounded-2xl pl-11 pr-11 py-3 text-sm text-white font-mono placeholder:text-gray-600 focus:border-neon-red outline-none transition-all disabled:opacity-50"
                                        autoFocus={hasExistingPassword === false}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNew(!showNew)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                    >
                                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                    Confirmer le mot de passe
                                </label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirmer à l'identique"
                                        disabled={isSubmitting || !!successMessage}
                                        className="w-full bg-black/60 border border-white/10 rounded-2xl pl-11 pr-11 py-3 text-sm text-white font-mono placeholder:text-gray-600 focus:border-neon-red outline-none transition-all disabled:opacity-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                    >
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 rounded-2xl font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !!successMessage}
                                    className="flex-[2] py-3.5 bg-gradient-to-r from-neon-red to-red-600 hover:from-neon-red/90 hover:to-red-700 text-white font-display font-black italic uppercase tracking-wider rounded-2xl shadow-lg shadow-neon-red/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Mise à jour...</span>
                                        </>
                                    ) : (
                                        <span>Enregistrer</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
