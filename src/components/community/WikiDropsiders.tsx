import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Globe, BookOpen, Star } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const DJ_DATA = [
    { id: '1', name: 'Mau P', genre: 'Tech House', bio: "Le nouveau phénomène hollandais, mondialement connu pour son hit \"Drugs From Amsterdam\".", country: 'NL', image: 'https://images.unsplash.com/photo-1542158025-0fa22d861d8a?w=500&h=500&fit=crop' },
    { id: '2', name: 'Anyma', genre: 'Melodic Techno', bio: "L'âme numérique du label Afterlife, fusionnant art visuel époustouflant et mélodies électroniques.", country: 'IT', image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&h=500&fit=crop' },
    { id: '3', name: 'Kevin de Vries', genre: 'Techno', bio: "Le titan basé à Berlin créant une techno hybride, émotive et à haute énergie transe.", country: 'DE', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500&fit=crop' },
    { id: '4', name: 'John Summit', genre: 'House', bio: "Superstar de la house de Chicago et fondateur du label Experts Only. Il enflamme tous les festivals.", country: 'US', image: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f529db?w=500&h=500&fit=crop' },
];

export function WikiDropsiders() {
    const [search, setSearch] = useState('');
    const [selectedDj, setSelectedDj] = useState<typeof DJ_DATA[0] | null>(null);

    const filtered = DJ_DATA.filter(dj => dj.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-4xl font-display font-black text-white italic uppercase tracking-tighter">Wiki Dropsiders</h2>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">La base de données gérée par la communauté</p>
                </div>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher un DJ..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-black uppercase tracking-widest focus:outline-none focus:border-neon-red transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-2 mb-6 px-2">
                            <BookOpen className="w-4 h-4 text-neon-red" />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Articles Récents</span>
                        </div>
                        <div className="space-y-2">
                            {filtered.map(dj => (
                                <button
                                    key={dj.id}
                                    onClick={() => setSelectedDj(dj)}
                                    className={twMerge(
                                        "w-full p-4 rounded-xl flex items-center gap-4 transition-all text-left",
                                        selectedDj?.id === dj.id ? "bg-white text-black" : "bg-white/5 text-white/40 hover:bg-white/10"
                                    )}
                                >
                                    <img src={dj.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest">{dj.name}</div>
                                        <div className="text-[8px] font-bold opacity-60 uppercase">{dj.genre}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8">
                    {selectedDj ? (
                        <motion.div
                            key={selectedDj.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-12 opacity-5">
                                <Globe className="w-64 h-64 text-white" />
                            </div>

                            <div className="flex flex-col md:flex-row gap-10 relative z-10">
                                <div className="w-48 h-48 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl shrink-0">
                                    <img src={selectedDj.image} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <span className="px-2 py-0.5 bg-neon-red text-white text-[8px] font-black uppercase rounded">Top Rated</span>
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{selectedDj.country} • {selectedDj.genre}</span>
                                    </div>
                                    <h3 className="text-5xl font-display font-black text-white italic uppercase tracking-tighter">{selectedDj.name}</h3>
                                    <p className="text-gray-400 leading-relaxed max-w-xl">{selectedDj.bio}</p>

                                    <div className="grid grid-cols-3 gap-4 pt-4">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                            <div className="text-[8px] font-black text-gray-500 uppercase mb-1">Note Fan</div>
                                            <div className="text-[10px] font-black text-white uppercase flex items-center gap-1">
                                                4.9 <Star className="w-2 h-2 text-neon-red fill-current" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem] text-center p-12">
                            <BookOpen className="w-16 h-16 text-white/10 mb-6" />
                            <h3 className="text-xl font-black text-white/20 uppercase italic mb-2 tracking-widest">SÉLECTIONNE UN ARTISTE</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
