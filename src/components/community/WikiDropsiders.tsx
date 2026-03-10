import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Globe, BookOpen, Star, Instagram, Music2, Headphones } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

import DJ_DATA from '../../data/wiki_djs.json';

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
                            <BookOpen className="w-4 h-4 text-[#FF0000]" />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">A-Z ({filtered.length} Artistes)</span>
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

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                                            <div className="text-[8px] font-black text-gray-500 uppercase mb-1">Fan Rating</div>
                                            <div className="text-[14px] font-black text-white flex items-center justify-center gap-1">
                                                {(selectedDj as any).rating || "4.9"} <Star className="w-3 h-3 text-[#FF0000] fill-current" />
                                            </div>
                                        </div>
                                        
                                        {(selectedDj as any).spotify && (
                                            <a href={(selectedDj as any).spotify} target="_blank" rel="noopener noreferrer" className="bg-[#1DB954]/10 hover:bg-[#1DB954]/20 p-4 rounded-2xl border border-[#1DB954]/20 text-center transition-colors group">
                                                <div className="text-[8px] font-black text-[#1DB954] uppercase mb-1">Spotify</div>
                                                <div className="flex justify-center"><Music2 className="w-5 h-5 text-[#1DB954] group-hover:scale-110 transition-transform" /></div>
                                            </a>
                                        )}
                                        
                                        {(selectedDj as any).instagram && (
                                            <a href={(selectedDj as any).instagram} target="_blank" rel="noopener noreferrer" className="bg-[#E1306C]/10 hover:bg-[#E1306C]/20 p-4 rounded-2xl border border-[#E1306C]/20 text-center transition-colors group">
                                                <div className="text-[8px] font-black text-[#E1306C] uppercase mb-1">Instagram</div>
                                                <div className="flex justify-center"><Instagram className="w-5 h-5 text-[#E1306C] group-hover:scale-110 transition-transform" /></div>
                                            </a>
                                        )}
                                        
                                        {(selectedDj as any).beatport && (
                                            <a href={(selectedDj as any).beatport} target="_blank" rel="noopener noreferrer" className="bg-[#02FF95]/10 hover:bg-[#02FF95]/20 p-4 rounded-2xl border border-[#02FF95]/20 text-center transition-colors group">
                                                <div className="text-[8px] font-black text-[#02FF95] uppercase mb-1">Beatport</div>
                                                <div className="flex justify-center"><Headphones className="w-5 h-5 text-[#02FF95] group-hover:scale-110 transition-transform" /></div>
                                            </a>
                                        )}
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
