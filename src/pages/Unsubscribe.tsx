import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Unsubscribe() {
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [searchParams]);

    const handleUnsubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setStatus('idle');

        try {
            const response = await fetch('/api/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                setStatus('success');
                setMessage('Vous avez été désinscrit avec succès. Votre adresse email a été supprimée de notre liste.');
            } else {
                const data = await response.json();
                setStatus('error');
                setMessage(data.error || 'Une erreur est survenue lors de la désinscription.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Erreur de connexion au serveur.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center px-6 py-32">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full"
            >
                <div className="text-center mb-12">
                    <img src="/logo_presentation.png" alt="Dropsiders" className="h-12 mx-auto mb-8" />
                    <h1 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-4">
                        Désinscription <span className="text-neon-red">Newsletter</span>
                    </h1>
                    <p className="text-gray-400">
                        Désolé de vous voir partir. Confirmez votre adresse pour ne plus recevoir nos actualités.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                    <AnimatePresence mode="wait">
                        {status === 'success' ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">C'est fait !</h3>
                                <p className="text-gray-400 mb-8">{message}</p>
                                <Link
                                    to="/"
                                    className="inline-flex items-center gap-2 text-neon-red font-bold uppercase tracking-widest text-sm hover:underline"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
                                </Link>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onSubmit={handleUnsubscribe}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                                        Votre adresse email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="nom@exemple.com"
                                            className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-neon-red transition-all"
                                        />
                                    </div>
                                </div>

                                {status === 'error' && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm italic">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        {message}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-neon-red text-white rounded-2xl font-black uppercase tracking-widest hover:bg-neon-red/80 transition-all shadow-lg shadow-neon-red/20 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        'Se désabonner'
                                    )}
                                </button>

                                <p className="text-center text-[10px] text-gray-600 uppercase font-bold tracking-widest">
                                    En cliquant, vos données seront immédiatement supprimées de notre liste.
                                </p>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-12 text-center">
                    <Link to="/" className="text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2 font-bold uppercase text-[10px] tracking-widest">
                        <ArrowLeft className="w-4 h-4" /> Retourner sur Dropsiders
                    </Link>
                </div>
            </motion.div>
        </div>
    );
} 
