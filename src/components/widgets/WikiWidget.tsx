import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Disc, MapPin, Tent, LayoutGrid, List,
    X, Plus, Camera, CheckCircle2, Loader2
} from 'lucide-react';
import { WikiDropsiders } from '../community/WikiDropsiders';
import { WikiVenues } from '../community/WikiVenues';
import { ImageUploadModal } from '../ImageUploadModal';
import { apiFetch, getAuthHeaders } from '../../utils/auth';
import { twMerge } from 'tailwind-merge';

interface WikiWidgetProps {
    resolvedColor?: string;
    showResults?: boolean;
    hideTitle?: boolean;
}

// ─── Global Add Modal ─────────────────────────────────────────────────────────

const WIKI_TYPES = [
    { id: 'DJS',      label: 'DJ',       labelPlural: 'DJS',      icon: Disc,   color: 'neon-red'  },
    { id: 'CLUBS',    label: 'Club',     labelPlural: 'CLUBS',    icon: MapPin, color: 'neon-blue' },
    { id: 'FESTIVALS',label: 'Festival', labelPlural: 'FESTIVALS',icon: Tent,   color: 'neon-cyan' },
] as const;

type WikiType = typeof WIKI_TYPES[number]['id'];

const EMPTY_FORM = {
    name: '', bio: '', country: '', city: '',
    image: '', instagram: '', spotify: '', website: '', rating: '4.5'
};

function GlobalWikiAddModal({
    isOpen,
    onClose,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [step, setStep] = useState<'type' | 'form'>('type');
    const [selectedType, setSelectedType] = useState<WikiType | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [showImageModal, setShowImageModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => {
        if (!isOpen) {
            setStep('type');
            setSelectedType(null);
            setForm(EMPTY_FORM);
            setErrorMsg('');
        }
    }, [isOpen]);

    const currentType = WIKI_TYPES.find(t => t.id === selectedType);

    const handleAdd = async () => {
        if (!form.name || !form.image) {
            setErrorMsg('Le nom et la photo sont obligatoires.');
            return;
        }
        setIsSaving(true);
        setErrorMsg('');
        try {
            const res = await apiFetch('/api/wiki/add', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ type: selectedType, entry: form }),
            });
            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await res.json().catch(() => ({}));
                setErrorMsg(data.error || "Erreur lors de l'ajout.");
            }
        } catch {
            setErrorMsg('Erreur réseau.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 md:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/95 backdrop-blur-2xl"
                    />

                    {/* Modal panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 24 }}
                        transition={{ type: 'spring', bounce: 0.22, duration: 0.45 }}
                        className="relative bg-[#0a0a0a] border border-white/10 ring-1 ring-white/5 rounded-[3rem] p-8 md:p-12 max-w-lg w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
                    >
                        {/* Top accent line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-white/30 to-neon-red rounded-t-[3rem]" />

                        {/* Header */}
                        <div className="flex justify-between items-start mb-10 shrink-0">
                            <div>
                                <h3 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter leading-none">
                                    AJOUTER{' '}
                                    <span className={currentType ? `text-${currentType.color}` : 'text-neon-red'}>
                                        {currentType ? currentType.labelPlural : 'AU WIKI'}
                                    </span>
                                </h3>
                                <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mt-2">
                                    {step === 'type' ? 'Étape 1 — Sélectionner la catégorie' : 'Étape 2 — Remplir les informations'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all group"
                            >
                                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>

                        {/* ── Step 1 : Type selection ── */}
                        {step === 'type' && (
                            <div className="grid grid-cols-3 gap-4 py-4">
                                {WIKI_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => { setSelectedType(type.id); setStep('form'); }}
                                        className="group flex flex-col items-center gap-5 p-8 bg-white/[0.03] border border-white/5 rounded-[2rem] hover:bg-white/[0.07] hover:border-white/20 transition-all hover:scale-105 active:scale-95"
                                    >
                                        <div className={`p-5 rounded-2xl bg-${type.color}/10 border border-${type.color}/20 group-hover:bg-${type.color}/30 transition-all`}>
                                            <type.icon className={`w-8 h-8 text-${type.color}`} />
                                        </div>
                                        <span className="font-black text-[10px] text-white/70 group-hover:text-white uppercase tracking-[0.25em] transition-colors">
                                            {type.labelPlural}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ── Step 2 : Form ── */}
                        {step === 'form' && (
                            <div className="flex flex-col gap-5 overflow-y-auto pr-1" style={{ maxHeight: 'calc(92vh - 220px)' }}>

                                {/* Nom */}
                                <div>
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2 block">
                                        Nom Officiel <span className="text-neon-red">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder={currentType?.id === 'DJS' ? 'David Guetta…' : currentType?.id === 'CLUBS' ? 'Berghain…' : 'Tomorrowland…'}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-neon-red outline-none transition-all"
                                    />
                                </div>

                                {/* Pays / Ville */}
                                <div>
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2 block">
                                        {currentType?.id === 'DJS' ? 'Pays / Drapeau' : 'Ville'}
                                    </label>
                                    <input
                                        type="text"
                                        value={currentType?.id === 'DJS' ? form.country : form.city}
                                        onChange={e => setForm({ ...form, [currentType?.id === 'DJS' ? 'country' : 'city']: e.target.value })}
                                        placeholder={currentType?.id === 'DJS' ? '🇫🇷 France' : 'Berlin, DE'}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-neon-red outline-none transition-all"
                                    />
                                </div>

                                {/* Photo upload */}
                                <div>
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2 block">
                                        Photo Principale <span className="text-neon-red">*</span>
                                    </label>
                                    <div className="flex gap-3 items-center">
                                        <button
                                            type="button"
                                            onClick={() => setShowImageModal(true)}
                                            className={twMerge(
                                                'flex-1 flex items-center justify-center gap-3 px-5 py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all',
                                                form.image
                                                    ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                                                    : 'bg-neon-red/10 border-neon-red/30 text-neon-red hover:bg-neon-red/20'
                                            )}
                                        >
                                            {form.image ? (
                                                <><CheckCircle2 className="w-5 h-5" /> Photo Ajoutée — Changer</>
                                            ) : (
                                                <><Camera className="w-5 h-5" /> Choisir sur Cloud R2</>
                                            )}
                                        </button>
                                        {form.image && (
                                            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                                                <img src={form.image} className="w-full h-full object-cover" alt="preview" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bio */}
                                <div>
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2 block">
                                        Biographie / Description
                                    </label>
                                    <textarea
                                        value={form.bio}
                                        onChange={e => setForm({ ...form, bio: e.target.value })}
                                        rows={3}
                                        placeholder="Quelques mots…"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-neon-red outline-none transition-all resize-none"
                                    />
                                </div>

                                {/* Social */}
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={form.instagram}
                                        onChange={e => setForm({ ...form, instagram: e.target.value })}
                                        placeholder="Lien Instagram"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-xs focus:border-neon-red outline-none transition-all"
                                    />
                                    <input
                                        type="text"
                                        value={form.spotify}
                                        onChange={e => setForm({ ...form, spotify: e.target.value })}
                                        placeholder="Spotify / Site web"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-xs focus:border-neon-red outline-none transition-all"
                                    />
                                </div>

                                {/* Error */}
                                {errorMsg && (
                                    <p className="text-neon-red text-[10px] font-black uppercase tracking-widest text-center">{errorMsg}</p>
                                )}

                                {/* Actions */}
                                <div className="pt-4 border-t border-white/5 flex gap-3 shrink-0">
                                    <button
                                        onClick={() => setStep('type')}
                                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest transition-all"
                                    >
                                        ← Retour
                                    </button>
                                    <button
                                        onClick={handleAdd}
                                        disabled={isSaving || !form.name || !form.image}
                                        className="flex-[2] py-4 bg-neon-red text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-neon-red/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</>
                                        ) : (
                                            'Enregistrer au Wiki'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Cloud R2 Image Modal — always mounted but outside the form scroll */}
                        <ImageUploadModal
                            isOpen={showImageModal}
                            onClose={() => setShowImageModal(false)}
                            accentColor="neon-red"
                            onUploadSuccess={(url) => {
                                setForm(f => ({ ...f, image: Array.isArray(url) ? url[0] : url }));
                                setShowImageModal(false);
                            }}
                        />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// ─── WikiWidget ────────────────────────────────────────────────────────────────

export function WikiWidget({
    resolvedColor = 'var(--color-neon-cyan)',
    showResults = false,
    hideTitle = false,
}: WikiWidgetProps) {
    const [activeTab, setActiveTab] = useState<'DJS' | 'CLUBS' | 'FESTIVALS'>('DJS');
    const [sortMode, setSortMode] = useState<'alpha' | 'votes'>('alpha');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isGlobalAddOpen, setIsGlobalAddOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const isAdmin = localStorage.getItem('admin_auth') === 'true';

    const tabs = [
        { id: 'DJS' as const,       label: 'Wiki DJs',  icon: Disc   },
        { id: 'CLUBS' as const,     label: 'Clubs',     icon: MapPin },
        { id: 'FESTIVALS' as const, label: 'Festivals', icon: Tent   },
    ];

    return (
        <div className="w-full relative z-10 flex flex-col items-center">
            {/* Header / Title */}
            {!hideTitle && (
                <div className="text-center mb-8 relative">
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 blur-[60px] opacity-20 pointer-events-none"
                        style={{ backgroundColor: resolvedColor }}
                    />
                    <h2 className="text-3xl md:text-5xl font-display font-black text-white italic tracking-tighter uppercase relative z-10 flex items-center justify-center gap-3">
                        <Database className="w-8 h-8 md:w-10 md:h-10" style={{ color: resolvedColor }} />
                        TOP <span style={{ color: resolvedColor }}>DROPSIDERS</span>
                    </h2>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2 max-w-lg mx-auto">
                        Le classement ultime des festivals, clubs et DJs du monde entier.
                    </p>
                </div>
            )}

            {/* Navigation Tabs & Controls */}
            <div className="flex flex-col md:flex-row items-center gap-4 mb-8 relative z-10 w-full max-w-5xl">
                {/* Tab pills */}
                <div className="flex bg-white/5 border border-white/10 rounded-full p-1.5 backdrop-blur-md overflow-x-auto max-w-full shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={twMerge(
                                'flex items-center gap-2 px-6 py-3 rounded-full font-black uppercase tracking-widest text-[10px] transition-all relative',
                                activeTab === tab.id ? 'text-black' : 'text-white/40 hover:text-white'
                            )}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="wiki-widget-tab"
                                    className="absolute inset-0 bg-white shadow-lg"
                                    style={{ borderRadius: '9999px', boxShadow: `0 0 20px ${resolvedColor}40` }}
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <tab.icon className="w-4 h-4 relative z-10" />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Sort controls */}
                <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl p-1.5">
                    {(['alpha', 'votes'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setSortMode(mode)}
                            className={twMerge(
                                'px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[8px] transition-all',
                                sortMode === mode ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                            )}
                        >
                            {mode === 'alpha' ? 'Alphabétique' : 'Par votes'}
                        </button>
                    ))}
                </div>

                {/* View toggle */}
                <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-2xl p-1.5">
                    <button onClick={() => setViewMode('grid')} className={twMerge('p-2 rounded-xl transition-all', viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300')}>
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('list')} className={twMerge('p-2 rounded-xl transition-all', viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300')}>
                        <List className="w-4 h-4" />
                    </button>
                </div>

                {/* Admin: Add button */}
                {isAdmin && (
                    <button
                        onClick={() => setIsGlobalAddOpen(true)}
                        className="ml-auto flex items-center gap-2 px-7 py-3 bg-neon-red text-white font-black uppercase tracking-[0.2em] rounded-full hover:scale-105 active:scale-95 transition-all text-[10px] shadow-lg shadow-neon-red/20 shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        Ajouter au Wiki
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div key={refreshKey} className="w-full bg-white/[0.02] border border-white/10 rounded-3xl p-4 md:p-8 relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] opacity-10 pointer-events-none" style={{ backgroundColor: resolvedColor }} />
                <div className="absolute bottom-0 left-0 w-64 h-64 blur-[100px] opacity-10 pointer-events-none" style={{ backgroundColor: resolvedColor }} />
                <div className="relative z-10">
                    {activeTab === 'DJS'       && <WikiDropsiders showResults={showResults} sortMode={sortMode} viewMode={viewMode} />}
                    {activeTab === 'CLUBS'     && <WikiVenues initialMode="clubs" showResults={showResults} sortMode={sortMode} viewMode={viewMode} />}
                    {activeTab === 'FESTIVALS' && <WikiVenues initialMode="festivals" showResults={showResults} sortMode={sortMode} viewMode={viewMode} />}
                </div>
            </div>

            {/* Global Add Modal */}
            <GlobalWikiAddModal
                isOpen={isGlobalAddOpen}
                onClose={() => setIsGlobalAddOpen(false)}
                onSuccess={() => setRefreshKey(k => k + 1)}
            />
        </div>
    );
}
