import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Layout, ArrowLeft, Loader2, Save, Eye, EyeOff, LayoutDashboard, Youtube, Calendar, Newspaper, MessageSquare, Music, Share2, GripVertical, Instagram, Trash2, ImageIcon, RefreshCcw } from 'lucide-react';
import { Link, useBlocker, Navigate } from 'react-router-dom';
import { getAuthHeaders, apiFetch, isSuperAdmin } from '../utils/auth';
import { ConfirmationModal } from '../components/ConfirmationModal';
import settingsData from '../data/settings.json';

interface LayoutItem {
    id: string;
    enabled: boolean;
    columns?: string;
    videoId?: string;
    videoUrl?: string;
    maxAgendaItems?: number;
    accentColor?: string;
    accentColor2?: string;
}

const SECTION_CONFIG: Record<string, { name: string, icon: any, color: string, description: string }> = {
    hero: { name: "Hero (Bannière)", icon: Youtube, color: "#ff0000", description: "Vidéo YouTube principale et accroche" },
    news_grid: { name: "News & Featured", icon: Newspaper, color: "#0066ff", description: "Grille des dernières actualités" },
    recap_agenda_grid: { name: "Récaps & Agenda", icon: Calendar, color: "#ff6600", description: "Événements à venir et compte-rendus" },
    interviews: { name: "Interviews", icon: MessageSquare, color: "#bd00ff", description: "Dernières rencontres exclusives" },
    social_grid: { name: "Instagram & TikTok", icon: Share2, color: "#ff0066", description: "Flux sociaux en temps réel" },
    spotify: { name: "Playlists Spotify", icon: Music, color: "#1db954", description: "Sélection de playlists sur l'accueil" }
};

function ReorderableItem({ item, updateItem, getColorValue, socials, updateSocials }: {
    item: LayoutItem,
    updateItem: (id: string, updates: Partial<LayoutItem>) => void,
    getColorValue: (color?: string) => string,
    socials: any,
    updateSocials: (key: string, value: string) => void
}) {
    const config = SECTION_CONFIG[item.id] || { name: item.id, icon: Layout, color: "#fff", description: "" };
    const Icon = config.icon;


    return (
        <Reorder.Item
            value={item}
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className={`relative w-full group bg-black/40 backdrop-blur-xl border-2 rounded-3xl overflow-hidden select-none ${item.enabled ? 'border-white/10 hover:border-white/20' : 'border-white/5 opacity-40 grayscale'}`}
        >
            <div className="p-2 flex items-center gap-3">
                {/* Drag Handle */}
                <div className="pl-2 cursor-grab active:cursor-grabbing text-gray-600 hover:text-white transition-colors">
                    <GripVertical className="w-5 h-5" />
                </div>


                <div className="flex-1 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 bg-white/5 group-hover:bg-white/10 transition-all shrink-0" style={{ borderColor: item.enabled ? getColorValue(item.accentColor) : 'rgba(255,255,255,0.1)' }}>
                        <Icon className="w-6 h-6" style={{ color: item.enabled ? getColorValue(item.accentColor) : 'gray' }} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-white">
                                {config.name}
                            </h3>
                            {!item.enabled && <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-black uppercase rounded-full border border-red-500/20">Désactivé</span>}
                        </div>
                        <p className="text-gray-500 text-sm font-medium normal-case">
                            {config.description}
                        </p>

                        {/* Contextual Settings */}
                        <div className="mt-3 flex flex-wrap gap-4 items-center">
                            {/* Color Wheel */}
                            <div className="flex items-center gap-2">
                                <div className="relative group/color">
                                    <input
                                        type="color"
                                        value={getColorValue(item.accentColor)}
                                        onChange={(e) => updateItem(item.id, { accentColor: e.target.value })}
                                        className="w-8 h-8 rounded-full border border-white/20 cursor-pointer overflow-hidden p-0 bg-transparent"
                                    />
                                </div>
                                {item.id === 'social_grid' && (
                                    <div className="relative group/color">
                                        <input
                                            type="color"
                                            value={getColorValue(item.accentColor2 || 'cyan')}
                                            onChange={(e) => updateItem(item.id, { accentColor2: e.target.value })}
                                            className="w-8 h-8 rounded-full border border-white/20 cursor-pointer overflow-hidden p-0 bg-transparent"
                                        />
                                    </div>
                                )}
                            </div>

                            {item.id === 'hero' && (
                                <div className="flex flex-col gap-2 w-full mt-2">
                                    {/* YouTube ID */}
                                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl relative group/input">
                                        <Youtube className="w-3 h-3 text-red-500 shrink-0" />
                                        <input
                                            type="text"
                                            value={item.videoId || ''}
                                            onChange={(e) => updateItem(item.id, { videoId: e.target.value, videoUrl: '' })}
                                            className="bg-transparent border-none text-[10px] font-bold outline-none w-28 text-white pr-6"
                                            placeholder="ID YouTube"
                                        />
                                        {item.videoId && (
                                            <button
                                                onClick={() => updateItem(item.id, { videoId: '' })}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                    {/* Divider */}
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <div className="flex-1 h-px bg-white/10" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">ou</span>
                                        <div className="flex-1 h-px bg-white/10" />
                                    </div>
                                    {/* Direct URL (photo or video) */}
                                    <div className="flex items-center gap-2 bg-white/5 border border-neon-cyan/20 px-3 py-1.5 rounded-xl relative group/input">
                                        <ImageIcon className="w-3 h-3 text-neon-cyan shrink-0" />
                                        <input
                                            type="text"
                                            value={item.videoUrl || ''}
                                            onChange={(e) => updateItem(item.id, { videoUrl: e.target.value, videoId: '' })}
                                            className="bg-transparent border-none text-[10px] font-bold outline-none flex-1 text-white pr-6"
                                            placeholder="URL photo ou vidéo directe"
                                        />
                                        {item.videoUrl && (
                                            <button
                                                onClick={() => updateItem(item.id, { videoUrl: '' })}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                    {/* Preview badge */}
                                    {(item.videoId || item.videoUrl) && (
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${item.videoUrl ? 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
                                                {item.videoUrl ? (item.videoUrl.match(/\.(mp4|webm|mov)$/i) ? '🎬 Vidéo directe' : '🖼️ Photo') : '▶️ YouTube'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {(item.id === 'news_grid' || item.id === 'recap_agenda_grid' || item.id === 'social_grid') && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                                        <span className="text-[9px] font-black uppercase text-neon-cyan">
                                            {item.columns?.replace('_', ' ') || '50/50'}
                                        </span>
                                    </div>
                                    <div className="relative group/color">
                                        <input
                                            type="color"
                                            value={getColorValue(item.accentColor2 || (item.id === 'news_grid' ? 'cyan' : 'red'))}
                                            onChange={(e) => updateItem(item.id, { accentColor2: e.target.value })}
                                            className="w-8 h-8 rounded-full border border-white/20 cursor-pointer overflow-hidden p-0 bg-transparent"
                                            title={item.id === 'news_grid' ? "Couleur Featured" : (item.id === 'recap_agenda_grid' ? "Couleur Agenda" : "Couleur TikTok")}
                                        />
                                    </div>
                                </div>
                            )}

                            {item.id === 'recap_agenda_grid' && (
                                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                                    <input
                                        type="range"
                                        min="1"
                                        max="20"
                                        value={item.maxAgendaItems || 8}
                                        onChange={(e) => updateItem(item.id, { maxAgendaItems: parseInt(e.target.value) })}
                                        className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                                    />
                                    <span className="text-[10px] font-black text-neon-cyan">{item.maxAgendaItems || 8}</span>
                                </div>
                            )}

                            {item.id === 'social_grid' && (
                                <div className="w-full mt-4 p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                                    <h4 className="text-[10px] font-black uppercase text-neon-red tracking-[0.2em] mb-2 flex items-center gap-2">
                                        <Share2 className="w-3 h-3" />
                                        Configuration des réseaux
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-3 py-2">
                                            <Instagram className="w-4 h-4 text-pink-500" />
                                            <div className="flex-1">
                                                <p className="text-[8px] font-black text-gray-500 uppercase">Instagram</p>
                                                <input
                                                    type="text"
                                                    value={socials?.instagram || ''}
                                                    onChange={(e) => updateSocials('instagram', e.target.value)}
                                                    className="bg-transparent border-none text-[11px] font-bold text-white outline-none w-full"
                                                    placeholder="dropsiders.fr"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-3 py-2">
                                            <div className="w-4 h-4 text-white">
                                                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47V18.77a7.658 7.658 0 0 1-5.69 7.42c-1.39.4-2.87.5-4.28.28-1.4-.21-2.77-.73-3.95-1.54A7.784 7.784 0 0 1 .15 20.32c-.52-1.48-.68-3.08-.47-4.63.19-1.4.74-2.77 1.58-3.95A7.74 7.74 0 0 1 5.46 8.78c1.37-.58 2.87-.78 4.35-.59v4.16c-1.12-.2-2.3.06-3.23.69-.93.63-1.52 1.62-1.63 2.74-.11 1.12.33 2.22 1.05 3.03.72.82 1.76 1.3 2.86 1.35 1.15.05 2.3-.39 3.07-1.23.63-.7.88-1.61.88-2.51V.02z" /></svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[8px] font-black text-gray-500 uppercase">TikTok</p>
                                                <input
                                                    type="text"
                                                    value={socials?.tiktok || ''}
                                                    onChange={(e) => updateSocials('tiktok', e.target.value)}
                                                    className="bg-transparent border-none text-[11px] font-bold text-white outline-none w-full"
                                                    placeholder="@dropsiders.fr"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-gray-500 italic">Ces identifiants sont utilisés pour les flux sociaux et les liens du site.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2 lg:pl-2">
                    <button
                        onClick={() => updateItem(item.id, { enabled: !item.enabled })}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${item.enabled ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                        title={item.enabled ? "Masquer cette section" : "Afficher cette section"}
                    >
                        {item.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Visual Preview Sub-Bar */}
            <div className="h-2 w-full flex bg-white/5">
                <div className="h-full transition-all duration-500" style={{ width: item.enabled ? '100%' : '0%', backgroundColor: getColorValue(item.accentColor) }} />
            </div>
        </Reorder.Item>
    );
}

export function AdminHome() {
    const storedPermissions = JSON.parse(localStorage.getItem('admin_permissions') || '[]');
    const adminUser = localStorage.getItem('admin_user');
    const isAlex = isSuperAdmin(adminUser);
    const hasAccess = isAlex || storedPermissions.includes('all');

    if (!hasAccess) {
        return <Navigate to="/admin" replace />;
    }

    const [layout, setLayout] = useState<LayoutItem[]>([]);
    const [socials, setSocials] = useState((settingsData as any).socials || {});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isResettingVotes, setIsResettingVotes] = useState(false);
    const [resetMessage, setResetMessage] = useState('');
    const [message, setMessage] = useState('');
    const [hasChanges, setHasChanges] = useState(false);



    // Prompt before internal React Router navigation
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            hasChanges && currentLocation.pathname !== nextLocation.pathname
    );

    // Confirm navigation handled by ConfirmationModal component in JSX

    // Prompt before window reload/close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasChanges]);

    useEffect(() => {
        fetchLayout();
    }, []);

    const fetchLayout = async () => {
        try {
            const response = await fetch('/api/home-layout');
            if (response.ok) {
                const data = await response.json();
                setLayout(data);
            }

            const resSets = await apiFetch('/api/settings');
            if (resSets.ok) {
                const data = await resSets.json();
                if (data.socials) setSocials(data.socials);
            }
        } catch (err: any) {
            console.error('Failed to fetch data', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage('');
        try {
            // Save Layout
            await fetch('/api/home-layout/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ layout })
            });

            // Save Socials in Settings
            const resSets = await apiFetch('/api/settings');
            const currentSettings = resSets.ok ? await resSets.json() : {};

            await apiFetch('/api/settings/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ ...currentSettings, socials })
            });

            setMessage('Configuration enregistrée avec succès !');
            setHasChanges(false);
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            setMessage('Erreur réseau');
        } finally {
            setIsSaving(false);
        }
    };

    const updateSocials = (key: string, value: string) => {
        setSocials((prev: any) => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const updateItem = (id: string, updates: Partial<LayoutItem>) => {
        setLayout((prev: LayoutItem[]) => prev.map((item: LayoutItem) =>
            item.id === id ? { ...item, ...updates } : item
        ));
        setHasChanges(true);
    };


    const getColorValue = (color?: string) => {
        if (!color) return '#ff0000';
        if (color.startsWith('#')) return color;
        const colorMap: Record<string, string> = {
            red: '#ff1241',
            blue: '#0066ff',
            cyan: '#00fff3',
            purple: '#bd00ff',
            yellow: '#ffee00',
            pink: '#ff0066',
            green: '#1db954',
            orange: '#ff6600'
        };
        return colorMap[color] || '#ff0000';
    };

    return (
        <div className="min-h-screen bg-dark-bg py-32">
            <div className="max-w-full mx-auto px-4 md:px-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="flex items-center gap-6">
                        <Link to="/admin" className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group">
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-neon-cyan/10 rounded-2xl">
                                    <LayoutDashboard className="w-8 h-8 text-neon-cyan" />
                                </div>
                                <h1 className="text-4xl font-display font-black uppercase italic tracking-tighter">
                                    Gestion <span className="text-neon-cyan">Accueil</span>
                                </h1>
                            </div>
                            <p className="text-gray-400 normal-case">Organisez l'ordre et le style des sections de votre page d'accueil.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {hasChanges && (
                            <span className="text-[10px] font-black uppercase text-neon-orange animate-pulse">Changements non enregistrés</span>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-8 py-4 bg-neon-cyan text-black rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neon-cyan/80 transition-all shadow-xl shadow-neon-cyan/20 disabled:opacity-50 group active:scale-95"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                            Enregistrer
                        </button>
                    </div>
                </div>

                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-6 bg-neon-cyan/10 border border-neon-cyan/30 rounded-2xl text-neon-cyan text-center font-bold uppercase tracking-widest text-xs"
                    >
                        {message}
                    </motion.div>
                )}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <Loader2 className="w-16 h-16 text-neon-cyan animate-spin" />
                        <span className="text-xs font-black uppercase text-gray-500 tracking-widest">Chargement de la mise en page...</span>
                    </div>
                ) : (
                    <div className="space-y-3 pb-20">
                        <Reorder.Group
                            axis="y"
                            values={layout}
                            onReorder={(newLayout: LayoutItem[]) => {
                                setLayout(newLayout);
                                setHasChanges(true);
                            }}
                            className="flex flex-col gap-3"
                        >
                            <AnimatePresence mode="popLayout">
                                {layout.map((item: LayoutItem) => (
                                    <ReorderableItem
                                        key={item.id}
                                        item={item}
                                        updateItem={updateItem}
                                        getColorValue={getColorValue}
                                        socials={socials}
                                        updateSocials={updateSocials}
                                    />
                                ))}
                            </AnimatePresence>
                        </Reorder.Group>

                        {/* Bottom Save Area */}
                        <div className="bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden group/save">
                            <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 to-transparent opacity-0 group-hover/save:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="p-5 bg-neon-cyan/10 rounded-2xl border border-neon-cyan/20 shadow-inner">
                                    <Save className="w-10 h-10 text-neon-cyan" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-display font-black uppercase italic text-white tracking-tight">Enregistrer la configuration</h4>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Appliquez les changements sur la page d'accueil</p>
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full md:w-auto px-16 py-6 bg-neon-cyan text-black rounded-[24px] font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-neon-cyan/80 transition-all shadow-2xl shadow-neon-cyan/20 disabled:opacity-50 group/btn active:scale-95 relative z-10"
                            >
                                {isSaving ? <Loader2 className="w-7 h-7 animate-spin" /> : <Save className="w-7 h-7 group-hover/btn:scale-110 transition-transform" />}
                                Publier les modifications
                            </button>
                        </div>

                        {/* Danger Zone: Reset Music Votes */}
                        <div className="mt-4 bg-red-500/5 border border-red-500/20 rounded-[40px] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="p-5 bg-red-500/10 rounded-2xl border border-red-500/20">
                                    <Music className="w-10 h-10 text-red-400" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-display font-black uppercase italic text-white tracking-tight">Reset Votes Music</h4>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Remet les compteurs du Top 10 à zéro — action irréversible</p>
                                    {resetMessage && <p className="text-[10px] text-neon-cyan font-black uppercase mt-1">{resetMessage}</p>}
                                </div>
                            </div>
                            <button
                                disabled={isResettingVotes}
                                onClick={async () => {
                                    if (!window.confirm('⚠️ Remettre TOUS les votes music à zéro ?')) return;
                                    setIsResettingVotes(true);
                                    setResetMessage('');
                                    try {
                                        const adminToken = import.meta.env.VITE_ADMIN_TOKEN;
                                        const res = await fetch('/api/music/reset', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ adminToken })
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                            setResetMessage(`✅ ${data.deleted} votes supprimés !`);
                                            setTimeout(() => setResetMessage(''), 4000);
                                        } else {
                                            setResetMessage(`❌ ${data.error}`);
                                        }
                                    } catch (err: any) {
                                        setResetMessage(`❌ ${err.message}`);
                                    } finally {
                                        setIsResettingVotes(false);
                                    }
                                }}
                                className="w-full md:w-auto px-12 py-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-[24px] font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-red-500 hover:text-white transition-all disabled:opacity-40 active:scale-95"
                            >
                                {isResettingVotes ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <Trash2 className="w-6 h-6" />}
                                {isResettingVotes ? 'Reset...' : 'Reset Votes'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={blocker.state === "blocked"}
                message="Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter la page ?"
                onConfirm={() => blocker.proceed?.()}
                onCancel={() => blocker.reset?.()}
                accentColor="neon-cyan"
            />
        </div>
    );
}

export default AdminHome;
