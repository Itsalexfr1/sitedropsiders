import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export function Contact() {
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
                throw new Error('Erreur lors de l\'envoi du message');
            }

            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
            setTimeout(() => setStatus('idle'), 5000);
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'Une erreur est survenue. Veuillez réessayer.');
            setTimeout(() => setStatus('idle'), 5000);
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg pt-32 pb-24 px-4 sm:px-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-neon-red/10 animate-blur-blob rounded-full mix-blend-screen filter blur-[100px] opacity-70 pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[25rem] h-[25rem] bg-neon-orange/10 animate-blur-blob animation-delay-2000 rounded-full mix-blend-screen filter blur-[100px] opacity-70 pointer-events-none" />

            <div className="max-w-3xl mx-auto relative z-10">
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
                        Nous <span className="text-neon-red">Contacter</span>
                    </h1>
                    <p className="text-gray-400 text-lg sm:text-xl font-medium tracking-wide max-w-xl mx-auto">
                        Une question, une suggestion ou l'envie de rejoindre l'aventure et d'intégrer l'équipe ? Envoyez-nous un message, nous vous répondrons dans les plus brefs délais !
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
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Votre Nom</label>
                                <input
                                    required
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 outline-none focus:border-neon-red focus:bg-white/5 transition-all text-sm font-medium"
                                    placeholder="Ex: John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Votre E-mail</label>
                                <input
                                    required
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 outline-none focus:border-neon-red focus:bg-white/5 transition-all text-sm font-medium"
                                    placeholder="Ex: john@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Sujet du Message</label>
                            <input
                                required
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 outline-none focus:border-neon-red focus:bg-white/5 transition-all text-sm font-medium"
                                placeholder="De quoi souhaitez-vous nous parler ?"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Votre Message</label>
                            <textarea
                                required
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows={6}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 outline-none focus:border-neon-red focus:bg-white/5 transition-all text-sm font-medium resize-none"
                                placeholder="Rédigez votre message ici..."
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
                                    Votre message a été envoyé avec succès ! Nous y répondrons rapidement.
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
                            {status === 'loading' ? 'Envoi en cours...' : 'Envoyer le message'}
                        </motion.button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
