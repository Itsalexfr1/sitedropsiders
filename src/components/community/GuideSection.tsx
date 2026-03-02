import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, CheckCircle2, Send, Info, User } from 'lucide-react';

interface Review {
    id: string;
    festival: string;
    ratings: {
        organization: number;
        sound: number;
        food: number;
    };
    comment: string;
    tips: string;
    author: string;
    timestamp: string;
}

export function GuideSection() {
    const [activeTab, setActiveTab] = useState<'reviews' | 'submit'>('reviews');
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const [formData, setFormData] = useState({
        festival: '',
        ratings: {
            organization: 5,
            sound: 5,
            food: 5
        },
        comment: '',
        tips: '',
        author: ''
    });

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await fetch('/api/avis/active');
            if (res.ok) {
                const data = await res.json();
                setReviews(data);
            }
        } catch (e) {
            console.error('Error fetching reviews:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitStatus('loading');
        try {
            const res = await fetch('/api/avis/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setSubmitStatus('success');
                setFormData({
                    festival: '',
                    ratings: { organization: 5, sound: 5, food: 5 },
                    comment: '',
                    tips: '',
                    author: ''
                });
                setTimeout(() => setSubmitStatus('idle'), 3000);
            } else {
                setSubmitStatus('error');
            }
        } catch (e) {
            setSubmitStatus('error');
        }
    };



    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-neon-red border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-center gap-4">
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'reviews' ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                >
                    LE GUIDE
                </button>
                <button
                    onClick={() => setActiveTab('submit')}
                    className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'submit' ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                >
                    PARTAGER UN CONSEIL
                </button>
            </div>

            {activeTab === 'reviews' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {reviews.length === 0 ? (
                        <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">Aucun avis pour le moment.</p>
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <motion.div
                                key={review.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-neon-red/50 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-neon-red transition-colors">
                                            {review.festival}
                                        </h3>
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <User className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{review.author}</span>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-gray-600 font-bold uppercase">
                                        {new Date(review.timestamp).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {review.tips && (
                                        <div className="p-6 bg-neon-cyan/5 border border-neon-cyan/10 rounded-2xl relative group-hover:bg-neon-cyan/10 transition-colors">
                                            <div className="absolute -top-3 left-4 px-3 py-1 bg-neon-cyan text-black text-[9px] font-black uppercase tracking-widest rounded-full">
                                                TIP DU FESTIVALIER
                                            </div>
                                            <p className="text-white font-medium leading-relaxed italic">
                                                "{review.tips}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2 group/author">
                                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover/author:border-neon-red/50 transition-colors">
                                            <User className="w-3 h-3 text-gray-400 group-hover/author:text-white" />
                                        </div>
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{review.author}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-all">
                                        {review.comment && <MessageSquare className="w-3.5 h-3.5 text-gray-400" />}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            ) : (
                <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-8">
                    <h2 className="text-2xl font-black text-white italic uppercase mb-6 flex items-center gap-3">
                        <Plus className="w-6 h-6 text-neon-red" />
                        Ajouter un retour festivalier
                    </h2>

                    <form onSubmit={handleFormSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Festival</label>
                            <input
                                type="text"
                                required
                                value={formData.festival}
                                onChange={e => setFormData({ ...formData, festival: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-red transition-all"
                                placeholder="Nom du festival"
                            />
                        </div>

                        <div className="p-6 bg-neon-cyan/5 border border-neon-cyan/10 rounded-2xl flex items-center gap-4">
                            <Info className="w-8 h-8 text-neon-cyan" />
                            <div>
                                <p className="text-[11px] font-black text-white uppercase italic tracking-widest">Guide du festivalier</p>
                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">Partagez vos astuces sur le logement, le transport, la nourriture ou le matos à emporter !</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Contexte (Optionnel)</label>
                            <input
                                type="text"
                                value={formData.comment}
                                onChange={e => setFormData({ ...formData, comment: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-red transition-all"
                                placeholder="Ex: Pour le camping, Près de la mainstage..."
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-neon-cyan uppercase mb-2 flex items-center gap-2">
                                <Info className="w-3 h-3" /> Vos conseils (Où dormir, quoi ramener...)
                            </label>
                            <textarea
                                value={formData.tips}
                                onChange={e => setFormData({ ...formData, tips: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-neon-cyan transition-all h-24 resize-none"
                                placeholder="Avez-vous des tips pour les autres festivaliers ?"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Votre Pseudo</label>
                            <input
                                type="text"
                                required
                                value={formData.author}
                                onChange={e => setFormData({ ...formData, author: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-red transition-all"
                                placeholder="Alex"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitStatus === 'loading'}
                            className="w-full py-4 bg-neon-red text-white font-black rounded-xl hover:shadow-[0_0_30px_rgba(255,17,17,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {submitStatus === 'loading' ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : submitStatus === 'success' ? (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    AVIS ENVOYÉ !
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    PARTAGER MON EXPÉRIENCE
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
