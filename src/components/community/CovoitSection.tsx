import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Car, MapPin, Calendar, Users, Phone, Plus, CheckCircle2, Send, Search } from 'lucide-react';

interface Covoit {
    id: string;
    festival: string;
    departure: string;
    date: string;
    capacity: number;
    contact: string;
    author: string;
    timestamp: string;
}

export function CovoitSection() {
    const [activeTab, setActiveTab] = useState<'browse' | 'propose'>('browse');
    const [covoits, setCovoits] = useState<Covoit[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        festival: '',
        departure: '',
        date: '',
        capacity: 1,
        contact: '',
        author: ''
    });

    useEffect(() => {
        fetchCovoits();
    }, []);

    const fetchCovoits = async () => {
        try {
            const res = await fetch('/api/covoit/active');
            if (res.ok) {
                const data = await res.json();
                setCovoits(data);
            }
        } catch (e) {
            console.error('Error fetching carpools:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitStatus('loading');
        try {
            const res = await fetch('/api/covoit/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setSubmitStatus('success');
                setFormData({
                    festival: '',
                    departure: '',
                    date: '',
                    capacity: 1,
                    contact: '',
                    author: ''
                });
                fetchCovoits(); // Refresh list
                setTimeout(() => {
                    setSubmitStatus('idle');
                    setActiveTab('browse');
                }, 2000);
            } else {
                setSubmitStatus('error');
            }
        } catch (e) {
            setSubmitStatus('error');
        }
    };

    const filteredCovoits = covoits.filter(c =>
        c.festival.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.departure.toLowerCase().includes(searchTerm.toLowerCase())
    );


    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('browse')}
                        className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'browse' ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/10'
                            }`}
                    >
                        VOIR LES TRAJETS
                    </button>
                    <button
                        onClick={() => setActiveTab('propose')}
                        className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'propose' ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/10'
                            }`}
                    >
                        PROPOSER UN TRAJET
                    </button>
                </div>

                {activeTab === 'browse' && (
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="RECHERCHER UN FESTIVAL..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-12 pr-4 text-[10px] font-bold text-white uppercase focus:outline-none focus:border-neon-red transition-all"
                        />
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-2 border-neon-red border-t-transparent rounded-full animate-spin" />
                </div>
            ) : activeTab === 'browse' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCovoits.length === 0 ? (
                        <div className="col-span-full text-center py-32 bg-white/5 rounded-[40px] border border-white/10">
                            <Car className="w-16 h-16 text-gray-600 mx-auto mb-6" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest">Aucun trajet trouvé.</p>
                        </div>
                    ) : (
                        filteredCovoits.map((c) => (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-neon-red/50 transition-all relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-neon-red/5 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:bg-neon-red/10 transition-all" />

                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-neon-red/10 rounded-2xl">
                                        <Car className="w-6 h-6 text-neon-red" />
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                        <Users className="w-3.5 h-3.5 text-neon-cyan" />
                                        <span className="text-[10px] font-black text-white">{c.capacity} PLACES</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div>
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Destination</span>
                                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">{c.festival}</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <MapPin className="w-4 h-4 text-neon-red" />
                                            <div>
                                                <span className="text-[9px] font-black text-gray-600 uppercase block">Départ</span>
                                                <span className="text-xs font-bold text-white uppercase">{c.departure}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-4 h-4 text-neon-red" />
                                            <div>
                                                <span className="text-[9px] font-black text-gray-600 uppercase block">Date</span>
                                                <span className="text-xs font-bold text-white uppercase">{new Date(c.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                                            <span className="text-[10px] font-black text-white">{c.author.charAt(0)}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{c.author}</span>
                                    </div>
                                    <a
                                        href={`https://wa.me/${c.contact.replace(/\s+/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2.5 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all border border-green-500/20"
                                        title="Contacter sur WhatsApp"
                                    >
                                        <Phone className="w-4 h-4" />
                                    </a>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            ) : (
                <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-neon-red/5 blur-[100px] rounded-full -mr-32 -mt-32" />

                    <h2 className="text-3xl font-black text-white italic uppercase mb-8 flex items-center gap-4">
                        <Plus className="w-8 h-8 text-neon-red" />
                        Proposer un trajet
                    </h2>

                    <form onSubmit={handleFormSubmit} className="space-y-6 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Festival / Événement</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.festival}
                                    onChange={e => setFormData({ ...formData, festival: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-neon-red transition-all"
                                    placeholder="Ex: Tomorrowland, Delta..."
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Ville de départ</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.departure}
                                    onChange={e => setFormData({ ...formData, departure: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-neon-red transition-all"
                                    placeholder="Ex: Paris, Lyon, Bruxelles..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Date du départ</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-neon-red transition-all [color-scheme:dark]"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Nombre de places</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="8"
                                    required
                                    value={formData.capacity}
                                    onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-neon-red transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">WhatsApp / Contact</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.contact}
                                    onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-neon-red transition-all"
                                    placeholder="+33 6 ..."
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Votre Pseudo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.author}
                                    onChange={e => setFormData({ ...formData, author: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-neon-red transition-all"
                                    placeholder="Alex"
                                />
                            </div>
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
                                    TRAJET PUBLIÉ !
                                </>
                            ) : (
                                <>
                                    <Send className="w-6 h-6" />
                                    PUBLIER MON ANNONCE
                                </>
                            )}
                        </button>

                        <p className="text-center text-gray-600 text-[9px] uppercase font-black tracking-[0.2em]">
                            En publiant, vous acceptez que votre contact WhatsApp soit visible par la communauté.
                        </p>
                    </form>
                </div>
            )}
        </div>
    );
}
