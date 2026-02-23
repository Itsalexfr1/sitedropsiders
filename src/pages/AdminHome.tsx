import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Layout, ArrowLeft, Loader2, Save, Eye, EyeOff, LayoutDashboard, Youtube, Calendar, Newspaper, MessageSquare, Music, Share2, GripVertical } from 'lucide-react';
import { Link, useBlocker } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ImageUploadModal } from '../components/ImageUploadModal';

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

function ReorderableItem({ item, updateItem, getColorValue, onUploadVideo }: { item: LayoutItem, updateItem: (id: string, updates: Partial<LayoutItem>) => void, getColorValue: (color?: string) => string, onUploadVideo?: (id: string) => void }) {
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
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                                        <Youtube className="w-3 h-3 text-red-500" />
                                        <input
                                            type="text"
                                            value={item.videoId || ''}
                                            onChange={(e) => updateItem(item.id, { videoId: e.target.value })}
                                            className="bg-transparent border-none text-[10px] font-bold outline-none w-24 text-white"
                                            placeholder="ID YouTube"
                                        />
                                    </div>
                                    <span className="text-[10px] font-black text-gray-600 uppercase">OU</span>
                                    <button
                                        onClick={() => onUploadVideo?.(item.id)}
                                        className={`flex items - center gap - 2 px - 3 py - 1.5 rounded - xl border transition - all text - [10px] font - bold uppercase ${item.videoUrl ? 'bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'} `}
                                    >
                                        {item.videoUrl ? 'Vidéo Uploadée' : 'Upload Vidéo File'}
                                    </button>
                                    {item.videoUrl && (
                                        <button
                                            onClick={() => updateItem(item.id, { videoUrl: undefined })}
                                            className="text-[10px] text-red-500 font-bold hover:underline"
                                        >
                                            Supprimer
                                        </button>
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
                        </div>
                    </div>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2 lg:pl-2">
                    <button
                        onClick={() => updateItem(item.id, { enabled: !item.enabled })}
                        className={`w - 10 h - 10 rounded - xl flex items - center justify - center transition - all ${item.enabled ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'} `}
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
    const [layout, setLayout] = useState<LayoutItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
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
        } catch (err) {
            console.error('Failed to fetch layout', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage('');
        try {
            const response = await fetch('/api/home-layout/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ layout })
            });

            if (response.ok) {
                setMessage('Configuration enregistrée avec succès !');
                setHasChanges(false);
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Erreur lors de la sauvegarde');
            }
        } catch (err) {
            setMessage('Erreur réseau');
        } finally {
            setIsSaving(false);
        }
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

    const handleUploadVideo = (id: string) => {
        setUploadingItemId(id);
        setIsUploadModalOpen(true);
    };

    const onUploadSuccess = (url: string) => {
        if (uploadingItemId) {
            updateItem(uploadingItemId, { videoUrl: url });
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg py-32 px-6 text-white overflow-x-hidden uppercase">
            <div className="max-w-5xl mx-auto">
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
                                        onUploadVideo={handleUploadVideo}
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

            <ImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadSuccess={onUploadSuccess}
                accentColor="neon-cyan"
            />
        </div>
    );
}

export default AdminHome;
