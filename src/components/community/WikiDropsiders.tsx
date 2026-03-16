import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Star, Instagram, Music2, Headphones, Pencil, Save, X, Youtube, Heart } from 'lucide-react';
import { apiFetch, getAuthHeaders } from '../../utils/auth';
import { useLanguage } from '../../context/LanguageContext';
import DJ_DATA_RAW from '../../data/wiki_djs.json';

type DjEntry = {
    id: string;
    name: string;
    bio: string;
    country: string;
    image: string;
    rating: string;
    spotify?: string;
    instagram?: string;
    beatport?: string;
    youtube?: string;
};

const VOTE_KEY = 'dropsiders_votes_djs';
function loadVotes(): Set<string> { try { return new Set(JSON.parse(localStorage.getItem(VOTE_KEY) || '[]')); } catch { return new Set(); } }
function saveVotes(v: Set<string>) { localStorage.setItem(VOTE_KEY, JSON.stringify([...v])); }

const initialData: DjEntry[] = (DJ_DATA_RAW as any[])
    .filter(dj => dj.status !== 'waiting')
    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));

function groupByLetter(data: DjEntry[]): Record<string, DjEntry[]> {
    return data.reduce((acc, dj) => {
        const letter = dj.name.charAt(0).toUpperCase().replace(/[^A-Z]/, '#');
        if (!acc[letter]) acc[letter] = [];
        acc[letter].push(dj);
        return acc;
    }, {} as Record<string, DjEntry[]>);
}

export function WikiDropsiders() {
    const { t, language } = useLanguage();
    const [search, setSearch] = useState('');
    const [djData, setDjData] = useState<DjEntry[]>(initialData);
    const [selectedDj, setSelectedDj] = useState<DjEntry | null>(null);
    const [votes, setVotes] = useState<Set<string>>(() => loadVotes());
    const isAdmin = localStorage.getItem('admin_auth') === 'true';
    const [editMode, setEditMode] = useState(false);
    const [editValues, setEditValues] = useState<Partial<DjEntry>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    const filtered = search ? djData.filter(dj => dj.name.toLowerCase().includes(search.toLowerCase())) : djData;
    const grouped = groupByLetter(filtered);
    const sortedLetters = Object.keys(grouped).sort();
    const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    const toggleVote = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const n = new Set(votes);
        n.has(id) ? n.delete(id) : n.add(id);
        setVotes(n); saveVotes(n);
    };

    const handleSelectDj = (dj: DjEntry) => {
        setSelectedDj(dj); setEditMode(false); setEditValues({}); setSaveMsg('');
    };

    const handleEdit = () => {
        if (!selectedDj) return;
        setEditValues({ spotify: selectedDj.spotify || '', instagram: selectedDj.instagram || '', beatport: selectedDj.beatport || '', youtube: (selectedDj as any).youtube || '' });
        setEditMode(true);
    };

    const handleSave = async () => {
        if (!selectedDj) return;
        setIsSaving(true);
        const updatedDj = { ...selectedDj, ...editValues };
        setDjData(prev => prev.map(dj => dj.id === selectedDj.id ? updatedDj : dj));
        setSelectedDj(updatedDj);
        try {
            const res = await apiFetch('/api/wiki/update', {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({ id: selectedDj.id, updates: editValues })
            });
            setSaveMsg(res.ok ? '✓ Sauvegardé !' : '✓ Modifié en local');
        } catch { setSaveMsg('✓ Modifié en local'); }
        setEditMode(false); setIsSaving(false);
        setTimeout(() => setSaveMsg(''), 3000);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="w-5 h-5 text-neon-red" />
                        <span className="text-neon-red font-black tracking-[0.3em] text-[10px] uppercase">{t('wiki_encyclopedia')}</span>
                    </div>
                    <h2 className="text-4xl font-display font-black text-white italic uppercase tracking-tighter">{t('wiki_djs_title')}</h2>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{djData.length} {t('wiki_artist_count')} · A–Z · {t('wiki_vote_favs')}</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search_placeholder')}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white font-black uppercase tracking-widest focus:outline-none focus:border-neon-red transition-all text-sm" />
                </div>
            </div>

            {/* Alphabet nav */}
            <div className="flex flex-wrap gap-1.5">
                {allLetters.map(letter => {
                    const has = !!grouped[letter]?.length;
                    return (
                        <button key={letter}
                            onClick={() => has && document.getElementById(`dj-section-${letter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                            className={`w-8 h-8 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${has ? 'bg-neon-red/10 border border-neon-red/30 text-neon-red hover:bg-neon-red hover:text-white cursor-pointer' : 'bg-white/[0.03] border border-white/5 text-white/10 cursor-default'}`}>
                            {letter}
                        </button>
                    );
                })}
            </div>

            {/* A-Z sections */}
            <div className="space-y-12">
                {sortedLetters.map(letter => (
                    <div key={letter} id={`dj-section-${letter}`}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-neon-red rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.3)] shrink-0">
                                <span className="text-white font-display font-black text-2xl italic">{letter}</span>
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-r from-neon-red/30 to-transparent" />
                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{grouped[letter].length} artiste{grouped[letter].length > 1 ? 's' : ''}</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {grouped[letter].map(dj => {
                                const hasVoted = votes.has(dj.id);
                                return (
                                    <motion.div key={dj.id} whileHover={{ y: -4, scale: 1.02 }}
                                        className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer ${selectedDj?.id === dj.id ? 'border-neon-red shadow-[0_0_20px_rgba(255,0,0,0.3)]' : 'border-white/10 hover:border-white/30'}`}>

                                        {/* Photo — photo entière visible + fondu premium en bas */}
                                        <div className="relative aspect-[3/4] bg-black overflow-hidden" onClick={() => handleSelectDj(dj)}>
                                            <img src={dj.image} alt={dj.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            {/* Fondu premium vers le bas */}
                                            <div className="absolute bottom-0 left-0 right-0 h-3/5 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
                                            {/* Name on gradient */}
                                            <div className="absolute bottom-0 left-0 right-0 p-2.5">
                                                <div className="text-[9px] font-black text-white uppercase tracking-widest leading-tight line-clamp-1">{dj.name}</div>
                                            </div>
                                            {/* Rating */}
                                            <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                                                <Star className="w-2.5 h-2.5 text-neon-red fill-current" />
                                                <span className="text-[8px] font-black text-white">{dj.rating}</span>
                                            </div>
                                        </div>

                                        {/* Vote button */}
                                        <button onClick={e => toggleVote(dj.id, e)}
                                            className={`w-full flex items-center justify-center gap-1 py-2 text-[8px] font-black uppercase tracking-wider transition-all border-t ${hasVoted ? 'bg-neon-red/15 border-neon-red/30 text-neon-red' : 'bg-black border-white/10 text-gray-500 hover:text-neon-red/70'}`}>
                                            <Heart className={`w-3 h-3 ${hasVoted ? 'fill-current' : ''}`} />
                                            {hasVoted ? t('voted') : t('vote')}
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
                {selectedDj && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => { setSelectedDj(null); setEditMode(false); }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" />
                        <motion.div
                            initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                            className="fixed right-0 top-0 h-full w-full max-w-xl bg-[#0a0a0a] border-l border-white/10 z-50 overflow-y-auto">

                            {/* Hero image — full photo + gradient fade bottom */}
                            <div className="relative w-full bg-black">
                                <img src={selectedDj.image} alt={selectedDj.name}
                                    className="w-full block" style={{ maxHeight: '70vh', objectFit: 'cover', objectPosition: 'center top', background: 'black' }} />
                                {/* Gradient fade at bottom of image */}
                                <div className="absolute bottom-0 left-0 right-0 h-52 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
                                {/* Name on gradient */}
                                <div className="absolute bottom-6 left-6 right-16">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="px-2 py-0.5 bg-neon-red text-white text-[8px] font-black uppercase rounded">{t('top_rated')}</span>
                                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{selectedDj.country}</span>
                                        {saveMsg && <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 text-green-400 text-[8px] font-black rounded">{saveMsg}</span>}
                                    </div>
                                    <h3 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter drop-shadow-lg">{selectedDj.name}</h3>
                                </div>
                                {/* Close button */}
                                <button onClick={() => { setSelectedDj(null); setEditMode(false); }}
                                    className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur rounded-full hover:bg-black/80 transition-all z-10">
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <p className="text-gray-300 leading-relaxed text-sm">
                                    {language === 'fr' ? selectedDj.bio : (selectedDj as any).bio_en || selectedDj.bio}
                                </p>

                                {/* Vote */}
                                <button onClick={e => toggleVote(selectedDj.id, e)}
                                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${votes.has(selectedDj.id) ? 'bg-neon-red text-white shadow-[0_0_30px_rgba(255,0,0,0.3)]' : 'bg-white/5 border border-white/10 text-gray-300 hover:border-neon-red/50 hover:text-neon-red'}`}>
                                    <Heart className={`w-5 h-5 ${votes.has(selectedDj.id) ? 'fill-current' : ''}`} />
                                    {votes.has(selectedDj.id) ? t('voted_for_artist') : t('vote_for_artist')}
                                </button>

                                {/* Rating */}
                                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <Star className="w-5 h-5 text-neon-red fill-current" />
                                    <div>
                                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{t('fan_rating')}</p>
                                        <p className="text-xl font-black text-white">{selectedDj.rating} / 5.0</p>
                                    </div>
                                </div>

                                {/* Links / Edit toggle */}
                                <AnimatePresence mode="wait">
                                    {editMode ? (
                                        <motion.div key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                                            <p className="text-[9px] font-black text-neon-red uppercase tracking-widest">Modifier les liens</p>
                                            {[
                                                { key: 'spotify', label: 'Spotify', color: '#1DB954', icon: <Music2 className="w-3.5 h-3.5" /> },
                                                { key: 'beatport', label: 'Beatport', color: '#02FF95', icon: <Headphones className="w-3.5 h-3.5" /> },
                                                { key: 'instagram', label: 'Instagram', color: '#E1306C', icon: <Instagram className="w-3.5 h-3.5" /> },
                                                { key: 'youtube', label: 'YouTube', color: '#FF0000', icon: <Youtube className="w-3.5 h-3.5" /> },
                                            ].map(({ key, label, color, icon }) => (
                                                <div key={key} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                                                    <span style={{ color }}>{icon}</span>
                                                    <div className="flex-1">
                                                        <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color }}>{label}</p>
                                                        <input type="url" value={(editValues as any)[key] || ''}
                                                            onChange={e => setEditValues(p => ({ ...p, [key]: e.target.value }))}
                                                            placeholder="https://..." className="w-full bg-transparent text-xs text-white font-bold outline-none placeholder-gray-700" />
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex gap-3">
                                                <button onClick={handleSave} disabled={isSaving}
                                                    className="flex-1 py-3 bg-neon-red text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-neon-red/80 transition-all disabled:opacity-50">
                                                    <Save className="w-3.5 h-3.5" />Enregistrer
                                                </button>
                                                <button onClick={() => { setEditMode(false); setEditValues({}); }}
                                                    className="px-5 py-3 bg-white/5 border border-white/10 text-gray-400 rounded-xl hover:bg-white/10 transition-all">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="links" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{t('official_links')}</p>
                                            <div className="flex flex-wrap gap-3">
                                                {selectedDj.spotify && (
                                                    <a href={selectedDj.spotify} target="_blank" rel="noopener noreferrer" 
                                                        title="Spotify"
                                                        className="w-12 h-12 flex items-center justify-center bg-[#1DB954]/10 hover:bg-[#1DB954]/20 rounded-2xl border border-[#1DB954]/20 transition-all hover:scale-105 active:scale-95 group">
                                                        <Music2 className="w-5 h-5 text-[#1DB954]" />
                                                    </a>
                                                )}
                                                {selectedDj.beatport && (
                                                    <a href={selectedDj.beatport} target="_blank" rel="noopener noreferrer" 
                                                        title="Beatport"
                                                        className="w-12 h-12 flex items-center justify-center bg-[#02FF95]/10 hover:bg-[#02FF95]/20 rounded-2xl border border-[#02FF95]/20 transition-all hover:scale-105 active:scale-95 group">
                                                        <Headphones className="w-5 h-5 text-[#02FF95]" />
                                                    </a>
                                                )}
                                                {selectedDj.instagram && (
                                                    <a href={selectedDj.instagram} target="_blank" rel="noopener noreferrer" 
                                                        title="Instagram"
                                                        className="w-12 h-12 flex items-center justify-center bg-[#E1306C]/10 hover:bg-[#E1306C]/20 rounded-2xl border border-[#E1306C]/20 transition-all hover:scale-105 active:scale-95 group">
                                                        <Instagram className="w-5 h-5 text-[#E1306C]" />
                                                    </a>
                                                )}
                                                {(selectedDj as any).youtube && (
                                                    <a href={(selectedDj as any).youtube} target="_blank" rel="noopener noreferrer" 
                                                        title="YouTube"
                                                        className="w-12 h-12 flex items-center justify-center bg-[#FF0000]/10 hover:bg-[#FF0000]/20 rounded-2xl border border-[#FF0000]/20 transition-all hover:scale-105 active:scale-95 group">
                                                        <Youtube className="w-5 h-5 text-[#FF0000]" />
                                                    </a>
                                                )}
                                                {!selectedDj.spotify && !selectedDj.beatport && !selectedDj.instagram && !(selectedDj as any).youtube && (
                                                    <p className="w-full text-gray-600 text-[10px] font-black uppercase tracking-widest py-2">{t('no_links')}</p>
                                                )}
                                            </div>
                                            {isAdmin && (
                                                <button onClick={handleEdit} className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:bg-neon-red/10 hover:border-neon-red/30 hover:text-neon-red transition-all">
                                                    <Pencil className="w-3 h-3" />{t('admin_edit_links')}
                                                </button>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
