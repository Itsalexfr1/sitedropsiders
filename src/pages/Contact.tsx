import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, CheckCircle, AlertCircle, Loader } from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';

export function Contact() {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
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

        // Validation manuelle rigoureuse
        if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
            setStatus('error');
            setErrorMessage(t('contact.error_fields'));
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
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error(t('contact.error_send'));
            }

            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
            setTimeout(() => setStatus('idle'), 5000);
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || t('newsletter_form.error_server'));
            setTimeout(() => setStatus('idle'), 5000);
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg pt-32 pb-24 px-4 sm:px-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-neon-red/10 animate-blur-blob rounded-full mix-blend-screen filter blur-[100px] opacity-70 pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[25rem] h-[25rem] bg-neon-orange/10 animate-blur-blob animation-delay-2000 rounded-full mix-blend-screen filter blur-[100px] opacity-70 pointer-events-none" />

            <div className="w-full px-6 lg:px-12 xl:px-16 2xl:px-24 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="w-20 h-20 mx-auto bg-neon-red/10 rounded-2xl flex items-center justify-center border border-neon-red/20 mb-8 shadow-[0_0_30px_rgba(255,17,17,0.15)] relative">
                        <Mail className="w-10 h-10 text-neon-red" />
                        <div className="absolute inset-0 bg-neon-red/20 blur-xl rounded-2xl" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-display font-black text-white italic tracking-tighter uppercase mb-6 drop-shadow-lg">
                        {t('contact.title')}<span className="text-neon-red">{t('contact.title_span')}</span>
                    </h1>
                    <p className="text-gray-400 text-lg sm:text-xl font-medium tracking-wide max-w-xl mx-auto">
                        {t('contact.subtitle')}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{t('contact.name')} <span className="text-neon-red">*</span></label>
                                <input
                                    required
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 outline-none focus:border-neon-red focus:bg-white/5 transition-all text-sm font-medium"
                                    placeholder={t('contact.name_placeholder')}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{t('contact.email')} <span className="text-neon-red">*</span></label>
                                <input
                                    required
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 outline-none focus:border-neon-red focus:bg-white/5 transition-all text-sm font-medium"
                                    placeholder={t('contact.email_placeholder')}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{t('contact.subject')} <span className="text-neon-red">*</span></label>
                            <div className="relative">
                                <select
                                    required
                                    name="subject"
                                    value={formData.subject}
                                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 outline-none focus:border-neon-red focus:bg-white/5 transition-all text-sm font-medium appearance-none cursor-pointer"
                                >
                                    <option value="" disabled className="bg-dark-bg text-gray-500">{t('contact.subject_placeholder')}</option>
                                    <option value="Question" className="bg-dark-bg text-white">{t('contact.subject_question')}</option>
                                    <option value="Suggestion" className="bg-dark-bg text-white">{t('contact.subject_suggestion')}</option>
                                    <option value="Partenariat" className="bg-dark-bg text-white">{t('contact.subject_partnership')}</option>
                                    <option value="Recrutement" className="bg-dark-bg text-white">{t('contact.subject_recruitment')}</option>
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{t('contact.message')} <span className="text-neon-red">*</span></label>
                            <textarea
                                required
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows={6}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 outline-none focus:border-neon-red focus:bg-white/5 transition-all text-sm font-medium resize-none"
                                placeholder={t('contact.message_placeholder')}
                            />
                        </div>

                        <AnimatePresence mode="wait">
                            {status === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl p-4 flex items-center gap-3 text-sm font-medium"
                                >
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    {errorMessage}
                                </motion.div>
                            )}

                            {status === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl p-4 flex items-center gap-3 text-sm font-medium"
                                >
                                    <CheckCircle className="w-5 h-5 shrink-0" />
                                    {t('contact.success')}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            type="submit"
                            disabled={status === 'loading'}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-white hover:text-white tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(255,17,17,0.3)] hover:shadow-[0_0_30px_rgba(255,17,17,0.5)] bg-gradient-to-r from-neon-red to-orange-600 border border-white/10 ${status === 'loading' ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {status === 'loading' ? (
                                <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                            {status === 'loading' ? t('contact.sending') : t('contact.send')}
                        </motion.button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
