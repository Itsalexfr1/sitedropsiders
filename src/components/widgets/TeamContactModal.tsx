import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface TeamContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TeamContactModal({ isOpen, onClose }: TeamContactModalProps) {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
            setStatus('error');
            setErrorMessage('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    subject: 'Recrutement',
                    message: formData.message,
                    category: 'Recruitment'
                }),
            });

            if (!response.ok) {
                throw new Error("Erreur lors de l'envoi du message");
            }

            setStatus('success');
            setFormData({ name: '', email: '', message: '' });
            setTimeout(() => {
                setStatus('idle');
                onClose();
            }, 3000);
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'Une erreur est survenue. Veuillez réessayer.');
            setTimeout(() => setStatus('idle'), 5000);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[210] p-4"
                    >
                        <div className="bg-dark-bg border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors z-20"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-red/10 blur-[100px] pointer-events-none" />

                            <div className="relative z-10 mb-8 text-center pt-2">
                                <div className="w-16 h-16 mx-auto bg-neon-red/10 rounded-full flex items-center justify-center border border-neon-red/20 mb-4 shadow-[0_0_30px_rgba(255,17,17,0.15)] relative">
                                    <Mail className="w-8 h-8 text-neon-red relative z-10" />
                                    <div className="absolute inset-0 bg-neon-red/20 blur-xl rounded-full" />
                                </div>
                                <h2 className="text-2xl font-display font-black text-white italic tracking-tighter uppercase mb-2">
                                    {t('team.join_title') || "Rejoindre l'équipe"}
                                </h2>
                                <p className="text-gray-400 text-sm">
                                    Envoyez-nous votre candidature.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-1 block">
                                        Nom complet <span className="text-neon-red">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-neon-red focus:bg-white/5 transition-all text-sm font-medium"
                                        placeholder="Ex: John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-1 block">
                                        Email <span className="text-neon-red">*</span>
                                    </label>
                                    <input
                                        required
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-neon-red focus:bg-white/5 transition-all text-sm font-medium"
                                        placeholder="Ex: john@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-1 block">
                                        Message <span className="text-neon-red">*</span>
                                    </label>
                                    <textarea
                                        required
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-neon-red focus:bg-white/5 transition-all text-sm font-medium resize-none"
                                        placeholder="Décrivez vos compétences et pourquoi vous souhaitez nous rejoindre"
                                    />
                                </div>

                                <motion.button
                                    whileHover={{ scale: status === 'loading' ? 1 : 1.02 }}
                                    whileTap={{ scale: status === 'loading' ? 1 : 0.98 }}
                                    disabled={status === 'loading'}
                                    type="submit"
                                    className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-sm transition-all duration-300 mt-2 ${status === 'loading'
                                        ? 'bg-white/10 text-white cursor-not-allowed'
                                        : 'bg-neon-red text-white hover:bg-white hover:text-neon-red shadow-[0_0_20px_rgba(255,17,17,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]'
                                        }`}
                                >
                                    {status === 'loading' ? (
                                        <Loader className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'Envoyer ma candidature'
                                    )}
                                </motion.button>

                                {/* States */}
                                <AnimatePresence mode="wait">
                                    {status === 'success' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex items-center gap-3 p-4 bg-neon-green/10 border border-neon-green/30 rounded-xl mt-4"
                                        >
                                            <CheckCircle className="w-5 h-5 text-neon-green flex-shrink-0" />
                                            <p className="text-sm text-neon-green font-bold">Candidature envoyée avec succès !</p>
                                        </motion.div>
                                    )}

                                    {status === 'error' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex items-center gap-3 p-4 bg-neon-red/10 border border-neon-red/30 rounded-xl mt-4"
                                        >
                                            <AlertCircle className="w-5 h-5 text-neon-red flex-shrink-0" />
                                            <p className="text-sm text-neon-red font-bold">{errorMessage}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
