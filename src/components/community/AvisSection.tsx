import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Plus, CheckCircle2, Send, User, Camera } from 'lucide-react';
import wikiFestivals from '../../data/wiki_festivals.json';
import { ConfirmationModal } from '../ConfirmationModal';

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

export function AvisSection() {
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
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [customFestivalImage, setCustomFestivalImage] = useState<File | null>(null);
    const [showAlert, setShowAlert] = useState<{ isOpen: boolean, message: string }>({ isOpen: false, message: '' });

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
        if (!wikiFestivals.some(f => f.name.toLowerCase() === formData.festival.toLowerCase())) {
            if (!customFestivalImage) {
                setShowAlert({ isOpen: true, message: "Ce festival n'est pas répertorié. Vous devez ajouter une photo du festival pour l'envoyer !" });
                setSubmitStatus('idle');
                return;
            }
        }

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

    const RatingStars = ({ value, onChange, label }: { value: number, onChange?: (val: number) => void, label: string }) => (
        <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange?.(star)}
                        className={`transition-all ${star <= value ? 'text-yellow-500' : 'text-white/10'}`}
                    >
                        <Star className={`w-5 h-5 ${star <= value ? 'fill-current' : ''}`} />
                    </button>
                ))}
            </div>
        </div>
    );
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
                    AVIS FESTIVALIER
                </button>
                <button
                    onClick={() => setActiveTab('submit')}
                    className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'submit' ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                >
                    NOTER UN FESTIVAL
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

                                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-black/20 rounded-2xl">
                                    <div className="text-center">
                                        <div className="text-[10px] font-black text-gray-500 uppercase mb-1">ORG.</div>
                                        <div className="flex justify-center gap-0.5">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className={`w-3 h-3 ${i < review.ratings.organization ? 'text-yellow-500 fill-current' : 'text-white/5'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[10px] font-black text-gray-500 uppercase mb-1">SON</div>
                                        <div className="flex justify-center gap-0.5">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className={`w-3 h-3 ${i < review.ratings.sound ? 'text-neon-cyan fill-current' : 'text-white/5'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[10px] font-black text-gray-500 uppercase mb-1">FOOD</div>
                                        <div className="flex justify-center gap-0.5">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className={`w-3 h-3 ${i < review.ratings.food ? 'text-neon-purple fill-current' : 'text-white/5'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {review.comment && (
                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                            <h4 className="text-[10px] font-black text-neon-red uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <MessageSquare className="w-3 h-3" /> COMMENTAIRE
                                            </h4>
                                            <p className="text-gray-400 text-sm italic italic">"{review.comment}"</p>
                                        </div>
                                    )}
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
                        <div className="relative">
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Festival</label>
                            <input
                                type="text"
                                required
                                value={formData.festival}
                                onChange={e => {
                                    setFormData({ ...formData, festival: e.target.value });
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-red transition-all"
                                placeholder="Nom du festival"
                            />
                            {showSuggestions && formData.festival && (
                                <div className="absolute z-50 left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl max-h-48 overflow-y-auto shadow-2xl backdrop-blur-xl">
                                    {wikiFestivals.filter(f => f.name.toLowerCase().includes(formData.festival.toLowerCase())).length > 0 ? (
                                        wikiFestivals.filter(f => f.name.toLowerCase().includes(formData.festival.toLowerCase())).map(f => (
                                            <button
                                                key={f.id}
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, festival: f.name });
                                                    setShowSuggestions(false);
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-neon-red/10 hover:text-neon-red text-gray-300 text-sm font-bold uppercase transition-colors"
                                            >
                                                {f.name}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-xs text-gray-400 italic">
                                            Nouveau festival. Une photo sera requise !
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {formData.festival && !wikiFestivals.some(f => f.name.toLowerCase() === formData.festival.toLowerCase()) && (
                            <div className="p-4 bg-neon-red/5 border border-neon-red/20 rounded-xl space-y-3">
                                <p className="text-[10px] font-black text-neon-red uppercase tracking-widest flex items-center gap-2">
                                    <Camera className="w-3 h-3" /> Festival Inconnu
                                </p>
                                <p className="text-xs text-gray-400">Ce festival n'est pas dans notre base de données. Ajoute une photo du festival pour qu'il soit validé.</p>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    required
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setCustomFestivalImage(e.target.files[0]);
                                        }
                                    }}
                                    className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-neon-red/20 file:text-neon-red hover:file:bg-neon-red/30 transition-all cursor-pointer"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-black/20 rounded-2xl">
                            <RatingStars
                                label="Organisation"
                                value={formData.ratings.organization}
                                onChange={(val) => setFormData({ ...formData, ratings: { ...formData.ratings, organization: val } })}
                            />
                            <RatingStars
                                label="Qualité du son"
                                value={formData.ratings.sound}
                                onChange={(val) => setFormData({ ...formData, ratings: { ...formData.ratings, sound: val } })}
                            />
                            <RatingStars
                                label="Food & Drinks"
                                value={formData.ratings.food}
                                onChange={(val) => setFormData({ ...formData, ratings: { ...formData.ratings, food: val } })}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Votre avis (Points positifs / négatifs)</label>
                            <textarea
                                required
                                value={formData.comment}
                                onChange={e => setFormData({ ...formData, comment: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-neon-red transition-all h-32 resize-none"
                                placeholder="Comment s'est passé votre festival ?"
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

            <ConfirmationModal
                isOpen={showAlert.isOpen}
                title="Action Requise"
                message={showAlert.message}
                confirmLabel="D'accord"
                cancelLabel="Fermer"
                onConfirm={() => setShowAlert({ isOpen: false, message: '' })}
                onCancel={() => setShowAlert({ isOpen: false, message: '' })}
                accentColor="neon-yellow"
            />
        </div>
    );
}
