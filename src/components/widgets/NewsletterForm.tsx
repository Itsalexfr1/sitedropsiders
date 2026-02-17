import { useState, type FormEvent } from 'react';
import { Mail, User, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

interface NewsletterFormProps {
    variant?: 'default' | 'compact';
}

export function NewsletterForm({ variant = 'default' }: NewsletterFormProps) {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!email) {
            setStatus('error');
            setErrorMessage(t('newsletter_form.error_required'));
            return;
        }

        if (!validateEmail(email)) {
            setStatus('error');
            setErrorMessage(t('newsletter_form.error_invalid'));
            return;
        }

        setIsSubmitting(true);
        setStatus('idle');

        // Send to Cloudflare Function API
        try {
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    firstName: firstName || null,
                    lastName: lastName || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setStatus('error');
                setErrorMessage(data.error || t('newsletter_form.error_server'));
                return;
            }

            setStatus('success');
            setEmail('');
            setFirstName('');
            setLastName('');

            // Reset success message after 5 seconds
            setTimeout(() => setStatus('idle'), 5000);
        } catch (error) {
            console.error('Newsletter Error:', error);
            setStatus('error');
            setErrorMessage(t('newsletter_form.error_server'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const isCompact = variant === 'compact';

    return (
        <div className={`w-full ${isCompact ? 'max-w-md' : 'max-w-2xl'} mx-auto`}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="relative group">
                    <label htmlFor="email" className="block text-xs font-black text-neon-red uppercase tracking-widest mb-3">
                        {t('newsletter_form.email_label')}
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-red transition-colors" />
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('newsletter_form.email_placeholder')}
                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-red focus:bg-white/10 transition-all duration-300"
                            required
                        />
                    </div>
                </div>

                {/* Optional Fields - Only in default variant */}
                {!isCompact && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* First Name */}
                        <div className="relative group">
                            <label htmlFor="firstName" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
                                {t('newsletter_form.first_name_label')}
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                <input
                                    type="text"
                                    id="firstName"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder={t('newsletter_form.first_name_placeholder')}
                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan focus:bg-white/10 transition-all duration-300"
                                />
                            </div>
                        </div>

                        {/* Last Name */}
                        <div className="relative group">
                            <label htmlFor="lastName" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
                                {t('newsletter_form.last_name_label')}
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                <input
                                    type="text"
                                    id="lastName"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder={t('newsletter_form.last_name_placeholder')}
                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan focus:bg-white/10 transition-all duration-300"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    className="w-full py-5 bg-gradient-to-r from-neon-red to-neon-pink text-white font-display font-black text-lg uppercase tracking-tight rounded-xl hover:shadow-[0_0_30px_rgba(255,0,51,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {t('newsletter_form.submitting_btn')}
                        </>
                    ) : (
                        <>
                            <Mail className="w-5 h-5" />
                            {t('newsletter_form.submit_btn')}
                        </>
                    )}
                </motion.button>

                {/* Status Messages */}
                <AnimatePresence mode="wait">
                    {status === 'success' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-3 p-4 bg-neon-green/10 border border-neon-green/30 rounded-xl"
                        >
                            <CheckCircle2 className="w-5 h-5 text-neon-green flex-shrink-0" />
                            <p className="text-sm text-neon-green font-bold">
                                {t('newsletter_form.success_msg')}
                            </p>
                        </motion.div>
                    )}

                    {status === 'error' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-3 p-4 bg-neon-red/10 border border-neon-red/30 rounded-xl"
                        >
                            <AlertCircle className="w-5 h-5 text-neon-red flex-shrink-0" />
                            <p className="text-sm text-neon-red font-bold">{errorMessage}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Privacy Notice */}
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                    {t('newsletter_form.privacy_notice')}
                    <a href="#/politique-de-confidentialite" className="text-neon-cyan hover:underline">
                        {t('newsletter_form.privacy_link')}
                    </a>
                    .
                </p>
            </form>
        </div>
    );
}
