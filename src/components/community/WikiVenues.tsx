import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, X, Globe, Instagram, Plus, Save, BookOpen } from 'lucide-react';

import CLUBS_RAW from '../../data/wiki_clubs.json';
import FESTIVALS_RAW from '../../data/wiki_festivals.json';

type Venue = {
    id: string;
    name: string;
    city: string;
    country: string;
    djmag_rank: number;
    description: string;
    image: string;
    website?: string;
    instagram?: string;
    votes: number;
    custom?: boolean;
};

const VOTE_KEY_CLUBS = 'dropsiders_votes_clubs';
const VOTE_KEY_FESTIVALS = 'dropsiders_votes_festivals';
const CUSTOM_KEY_CLUBS = 'dropsiders_custom_clubs';
const CUSTOM_KEY_FESTIVALS = 'dropsiders_custom_festivals';

function loadVotes(key: string): Set<string> { try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); } }
function saveVotes(key: string, v: Set<string>) { localStorage.setItem(key, JSON.stringify([...v])); }
function loadCustom(key: string): Venue[] { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function saveCustom(key: string, items: Venue[]) { localStorage.setItem(key, JSON.stringify(items)); }

const FLAG: Record<string, string> = {
    BE: '🇧🇪', US: '🇺🇸', DE: '🇩🇪', ES: '🇪🇸', GB: '🇬🇧', NL: '🇳🇱', FR: '🇫🇷', CA: '🇨🇦',
    JP: '🇯🇵', SG: '🇸🇬', AU: '🇦🇺', CH: '🇨🇭', RS: '🇷🇸', RO: '🇷🇴', HR: '🇭🇷', PT: '🇵🇹',
    CZ: '🇨🇿', VN: '🇻🇳', BR: '🇧🇷', SX: '🏝️',
};

type Mode = 'clubs' | 'festivals';

function groupByLetter(data: Venue[]): Record<string, Venue[]> {
    return data.reduce((acc, v) => {
        const letter = v.name.charAt(0).toUpperCase().replace(/[^A-Z]/, '#');
        if (!acc[letter]) acc[letter] = [];
        acc[letter].push(v);
        return acc;
    }, {} as Record<string, Venue[]>);
}

export function WikiVenues({ initialMode = 'clubs' }: { initialMode?: Mode }) {
    const [mode, setMode] = useState<Mode>(initialMode);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Venue | null>(null);
    const [showAdd, setShowAdd] = useState(false);

    const [clubVotes, setClubVotes] = useState<Set<string>>(() => loadVotes(VOTE_KEY_CLUBS));
    const [festVotes, setFestVotes] = useState<Set<string>>(() => loadVotes(VOTE_KEY_FESTIVALS));
    const [customClubs, setCustomClubs] = useState<Venue[]>(() => loadCustom(CUSTOM_KEY_CLUBS));
    const [customFests, setCustomFests] = useState<Venue[]>(() => loadCustom(CUSTOM_KEY_FESTIVALS));
    const [addForm, setAddForm] = useState({ name: '', city: '', country: '', description: '', website: '', instagram: '' });
    const [addSuccess, setAddSuccess] = useState(false);

    const votes = mode === 'clubs' ? clubVotes : festVotes;
    const setVotes = mode === 'clubs' ? setClubVotes : setFestVotes;
    const voteKey = mode === 'clubs' ? VOTE_KEY_CLUBS : VOTE_KEY_FESTIVALS;
    const baseData = mode === 'clubs' ? (CLUBS_RAW as Venue[]) : (FESTIVALS_RAW as Venue[]);
    const customData = mode === 'clubs' ? customClubs : customFests;

    // Sort alphabetically and merge
    const allVenues = useMemo(() => {
        const combined = [...baseData, ...customData];
        return combined.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
    }, [baseData, customData]);

    const filtered = allVenues.filter(v =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.city.toLowerCase().includes(search.toLowerCase())
    );

    const grouped = groupByLetter(filtered);
    const sortedLetters = Object.keys(grouped).sort();
    const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    const toggleVote = (id: string) => {
        const n = new Set(votes);
        n.has(id) ? n.delete(id) : n.add(id);
        setVotes(n); saveVotes(voteKey, n);
    };

    const getVoteCount = (v: Venue) => (v.votes || 0) + (votes.has(v.id) ? 1 : 0);

    const handleAdd = () => {
        if (!addForm.name || !addForm.city || !addForm.country) return;
        const id = `custom_${Date.now()}`;
        const img = `https://images.unsplash.com/photo-${mode === 'clubs' ? '1566737236500-c8ac02b87b0c' : '1470229722913-7c0e2dbbafd3'}?w=600&h=800&fit=crop&q=80&sig=${Date.now()}`;
        const newVenue: Venue = { id, name: addForm.name, city: addForm.city, country: addForm.country.toUpperCase(), djmag_rank: 9999, description: addForm.description || 'Lieu ajouté par la communauté Dropsiders.', image: img, website: addForm.website, instagram: addForm.instagram, votes: 0, custom: true };
        if (mode === 'clubs') { const u = [...customClubs, newVenue]; setCustomClubs(u); saveCustom(CUSTOM_KEY_CLUBS, u); }
        else { const u = [...customFests, newVenue]; setCustomFests(u); saveCustom(CUSTOM_KEY_FESTIVALS, u); }
        setAddForm({ name: '', city: '', country: '', description: '', website: '', instagram: '' });
        setAddSuccess(true);
        setTimeout(() => { setAddSuccess(false); setShowAdd(false); }, 2000);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="w-5 h-5 text-neon-red" />
                        <span className="text-neon-red font-black tracking-[0.3em] text-[10px] uppercase">Encyclopédie</span>
                    </div>
                    <h2 className="text-4xl font-display font-black text-white italic uppercase tracking-tighter">
                        {mode === 'clubs' ? 'Wiki Clubs' : 'Wiki Festivals'}
                    </h2>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        {filtered.length} lieux · A–Z · Vote pour tes préférés ❤️
                    </p>
                </div>

                {/* Mode switcher */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1 gap-1">
                    <button onClick={() => { setMode('clubs'); setSearch(''); setSelected(null); }}
                        className={`px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${mode === 'clubs' ? 'bg-neon-red text-white shadow-[0_0_15px_rgba(255,0,0,0.3)]' : 'text-gray-400 hover:text-white'}`}>
                        🏛️ Clubs
                    </button>
                    <button onClick={() => { setMode('festivals'); setSearch(''); setSelected(null); }}
                        className={`px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${mode === 'festivals' ? 'bg-neon-red text-white shadow-[0_0_15px_rgba(255,0,0,0.3)]' : 'text-gray-400 hover:text-white'}`}>
                        🎪 Festivals
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder={`Rechercher un ${mode === 'clubs' ? 'club' : 'festival'}...`}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white font-black uppercase tracking-widest focus:outline-none focus:border-neon-red transition-all text-sm" />
                </div>
                <button onClick={() => setShowAdd(!showAdd)}
                    className="flex items-center gap-2 px-5 py-3 bg-neon-red/10 border border-neon-red/30 rounded-2xl text-neon-red font-black uppercase tracking-widest text-[10px] hover:bg-neon-red/20 transition-all shrink-0">
                    <Plus className="w-4 h-4" />Ajouter un {mode === 'clubs' ? 'club' : 'festival'}
                </button>
            </div>

            {/* Add form */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="bg-white/5 border border-neon-red/20 rounded-3xl p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-white uppercase italic">Ajouter un {mode === 'clubs' ? 'club' : 'festival'}</h3>
                            <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[{ key: 'name', label: 'Nom *', placeholder: mode === 'clubs' ? 'Fabric' : 'Tomorrowland' }, { key: 'city', label: 'Ville *', placeholder: 'Londres' }, { key: 'country', label: 'Pays (code 2 lettres) *', placeholder: 'GB' }, { key: 'website', label: 'Site web', placeholder: 'https://...' }, { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' }].map(({ key, label, placeholder }) => (
                                <div key={key}>
                                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</label>
                                    <input type="text" value={(addForm as any)[key]} onChange={e => setAddForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-neon-red transition-all" />
                                </div>
                            ))}
                            <div className="sm:col-span-2">
                                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Description</label>
                                <textarea value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Décris ce lieu en quelques mots..." rows={2}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-neon-red transition-all resize-none" />
                            </div>
                        </div>
                        <button onClick={handleAdd} className="mt-4 flex items-center gap-2 px-6 py-3 bg-neon-red text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-neon-red/80 transition-all">
                            {addSuccess ? '✓ Ajouté !' : <><Save className="w-3.5 h-3.5" />Ajouter</>}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Alphabet nav */}
            <div className="flex flex-wrap gap-1.5">
                {allLetters.map(letter => {
                    const has = !!grouped[letter]?.length;
                    return (
                        <button key={letter}
                            onClick={() => has && document.getElementById(`venue-${mode}-${letter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                            className={`w-8 h-8 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${has ? 'bg-neon-red/10 border border-neon-red/30 text-neon-red hover:bg-neon-red hover:text-white cursor-pointer' : 'bg-white/[0.03] border border-white/5 text-white/10 cursor-default'}`}>
                            {letter}
                        </button>
                    );
                })}
            </div>

            {/* A-Z sections */}
            <div className="space-y-12">
                {sortedLetters.map(letter => (
                    <div key={letter} id={`venue-${mode}-${letter}`}>
                        {/* Letter header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-neon-red rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.3)] shrink-0">
                                <span className="text-white font-display font-black text-2xl italic">{letter}</span>
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-r from-neon-red/30 to-transparent" />
                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{grouped[letter].length} lieu{grouped[letter].length > 1 ? 'x' : ''}</span>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {grouped[letter].map(venue => {
                                const hasVoted = votes.has(venue.id);
                                const voteCount = getVoteCount(venue);
                                return (
                                    <motion.div key={venue.id} whileHover={{ y: -4, scale: 1.02 }}
                                        className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer ${selected?.id === venue.id ? 'border-neon-red shadow-[0_0_20px_rgba(255,0,0,0.3)]' : 'border-white/10 hover:border-white/30'}`}>

                                        {/* Photo — format carré + logo contenu */}
                                        <div className="relative aspect-square bg-black overflow-hidden" onClick={() => setSelected(selected?.id === venue.id ? null : venue)}>
                                            <img src={venue.image} alt={venue.name}
                                                className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105" />
                                            {/* Fondu premium réduit pour le format carré */}
                                            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
                                            {/* Custom badge */}
                                            {venue.custom && <div className="absolute top-2 left-2 bg-white/20 backdrop-blur text-white text-[7px] font-black px-1.5 py-0.5 rounded-full">📍</div>}
                                            {/* Info on gradient */}
                                            <div className="absolute bottom-0 left-0 right-0 p-2.5">
                                                <div className="text-[9px] font-black text-white uppercase tracking-widest leading-tight line-clamp-1">{venue.name}</div>
                                                <div className="text-[7px] text-gray-300 font-bold uppercase mt-0.5 flex items-center gap-1">
                                                    <span>{FLAG[venue.country] || '🌍'}</span><span>{venue.city}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Vote button */}
                                        <button onClick={e => { e.stopPropagation(); toggleVote(venue.id); }}
                                            className={`w-full flex items-center justify-center gap-1.5 py-2 text-[8px] font-black uppercase tracking-widest transition-all border-t ${hasVoted ? 'bg-neon-red/15 border-neon-red/30 text-neon-red' : 'bg-black border-white/10 text-gray-500 hover:text-neon-red/70'}`}>
                                            <Heart className={`w-3 h-3 ${hasVoted ? 'fill-current' : ''}`} />
                                            {voteCount > 0 ? voteCount : ''} {hasVoted ? 'Voté' : 'Voter'}
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail slide-over */}
            <AnimatePresence>
                {selected && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelected(null)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" />
                        <motion.div
                            initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                            className="fixed right-0 top-0 h-full w-full max-w-xl bg-[#0a0a0a] border-l border-white/10 z-50 overflow-y-auto">

                            {/* Full image + gradient */}
                            <div className="relative w-full bg-black">
                                <img src={selected.image} alt={selected.name}
                                    className="w-full block" style={{ maxHeight: '70vh', objectFit: 'contain', objectPosition: 'center', background: 'black' }} />
                                {/* Gradient fade bottom */}
                                <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
                                {/* Info overlaid on gradient */}
                                <div className="absolute bottom-6 left-6 right-16">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        {selected.custom && <span className="px-2 py-0.5 bg-white/20 text-white text-[8px] font-black uppercase rounded">📍 Community</span>}
                                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{FLAG[selected.country] || '🌍'} {selected.city}</span>
                                    </div>
                                    <h3 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter drop-shadow-lg">{selected.name}</h3>
                                </div>
                                {/* Close */}
                                <button onClick={() => setSelected(null)}
                                    className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur rounded-full hover:bg-black/80 transition-all z-10">
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <p className="text-gray-300 leading-relaxed text-sm">{selected.description}</p>

                                {/* Vote */}
                                <button onClick={() => toggleVote(selected.id)}
                                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${votes.has(selected.id) ? 'bg-neon-red text-white shadow-[0_0_30px_rgba(255,0,0,0.3)]' : 'bg-white/5 border border-white/10 text-gray-300 hover:border-neon-red/50 hover:text-neon-red'}`}>
                                    <Heart className={`w-5 h-5 ${votes.has(selected.id) ? 'fill-current' : ''}`} />
                                    {votes.has(selected.id) ? 'Tu as voté !' : 'Voter pour ce lieu'}
                                    <span className="text-sm opacity-70">· {getVoteCount(selected)} votes</span>
                                </button>

                                {/* Links */}
                                <div className="flex flex-wrap gap-3">
                                    {selected.website && (
                                        <a href={selected.website} target="_blank" rel="noopener noreferrer"
                                            title="Site officiel"
                                            className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all hover:scale-105 active:scale-95 group">
                                            <Globe className="w-5 h-5 text-white/60 group-hover:text-white" />
                                        </a>
                                    )}
                                    {selected.instagram && (
                                        <a href={selected.instagram} target="_blank" rel="noopener noreferrer"
                                            title="Instagram"
                                            className="w-12 h-12 flex items-center justify-center bg-[#E1306C]/10 hover:bg-[#E1306C]/20 rounded-2xl border border-[#E1306C]/20 transition-all hover:scale-105 active:scale-95 group">
                                            <Instagram className="w-5 h-5 text-[#E1306C]" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
