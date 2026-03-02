import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Plus, CheckCircle2, Info, Trash2, Mail } from 'lucide-react';

interface Alert {
    id: string;
    festival: string;
    artist: string;
    email: string;
    author: string;
    timestamp: string;
}

export function AlertsSection() {
    const [activeTab, setActiveTab] = useState<'active' | 'add'>('active');
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const [formData, setFormData] = useState({
        festival: '',
        artist: '',
        email: '',
        author: ''
    });

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const res = await fetch('/api/alerts/active');
            if (res.ok) {
                const data = await res.json();
                setAlerts(data);
            }
        } catch (e) {
            console.error('Error fetching alerts:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitStatus('loading');
        try {
            const res = await fetch('/api/alerts/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setSubmitStatus('success');
                setFormData({
                    festival: '',
                    artist: '',
                    email: '',
                    author: ''
                });
                fetchAlerts(); // Refresh list
                setTimeout(() => {
                    setSubmitStatus('idle');
                    setActiveTab('active');
                }, 2000);
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
                    onClick={() => setActiveTab('active')}
                    className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'active' ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                >
                    MES ALERTES ACTIVES
                </button>
                <button
                    onClick={() => setActiveTab('add')}
                    className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'add' ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                >
                    CRÉER UNE ALERTE
                </button>
            </div>

            {activeTab === 'active' ? (
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex items-center gap-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/10 blur-[50px] rounded-full -mr-16 -mt-16" />
                        <Bell className="w-12 h-12 text-neon-cyan" />
                        <div>
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Comment ça marche ?</h3>
                            <p className="text-gray-400 text-sm">Nous surveillons le web et les réseaux sociaux 24h/24. Dès qu'une rumeur ou une annonce officielle tombe pour vos artistes ou festivals favoris, vous recevez un mail instantané !</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {alerts.length === 0 ? (
                            <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                                <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400">Aucune alerte active pour le moment.</p>
                            </div>
                        ) : (
                            alerts.map((alert) => (
                                <motion.div
                                    key={alert.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-6 flex justify-between items-center group hover:border-neon-red/50 transition-all"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-neon-red uppercase tracking-widest">{alert.festival}</span>
                                            <span className="text-[10px] text-gray-600">•</span>
                                            <span className="text-[10px] font-black text-neon-cyan uppercase tracking-widest">{alert.artist}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Mail className="w-3 h-3" />
                                            <span className="text-xs font-bold">{alert.email}</span>
                                        </div>
                                    </div>
                                    <button className="p-2 text-gray-600 hover:text-neon-red transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-neon-cyan/5 blur-[100px] rounded-full -mr-32 -mt-32" />

                    <h2 className="text-3xl font-black text-white italic uppercase mb-8 flex items-center gap-4">
                        <Plus className="w-8 h-8 text-neon-red" />
                        Paramétrer une alerte
                    </h2>

                    <form onSubmit={handleFormSubmit} className="space-y-6 relative z-10">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Festival à surveiller</label>
                            <input
                                type="text"
                                required
                                value={formData.festival}
                                onChange={e => setFormData({ ...formData, festival: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-neon-red transition-all"
                                placeholder="Nom du festival (Ex: Tomorrowland)"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Artiste spécifique (Optionnel)</label>
                            <input
                                type="text"
                                value={formData.artist}
                                onChange={e => setFormData({ ...formData, artist: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-neon-cyan transition-all"
                                placeholder="Ex: David Guetta, Boris Brejcha..."
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Votre Email pour l'alerte</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-neon-red transition-all"
                                placeholder="votre@email.com"
                            />
                        </div>

                        <div className="p-4 bg-neon-cyan/10 border border-neon-cyan/20 rounded-2xl flex items-start gap-3">
                            <Info className="w-4 h-4 text-neon-cyan shrink-0 mt-0.5" />
                            <p className="text-[10px] text-neon-cyan font-bold uppercase tracking-wider leading-relaxed">
                                Les alertes sont traitées par notre algo qui scanne les annonces en temps réel. Ne ratez plus vos headliners !
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={submitStatus === 'loading'}
                            className="w-full py-5 bg-neon-red text-white font-black rounded-2xl hover:shadow-[0_0_40px_rgba(255,17,17,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-4 uppercase tracking-widest text-sm"
                        >
                            {submitStatus === 'loading' ? (
                                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                            ) : submitStatus === 'success' ? (
                                <>
                                    <CheckCircle2 className="w-6 h-6" />
                                    ALERTE ACTIVÉE !
                                </>
                            ) : (
                                <>
                                    <Bell className="w-6 h-6" />
                                    ACTIVER MA SURVEILLANCE
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
