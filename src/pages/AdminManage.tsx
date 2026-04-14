import { useState, useEffect, useMemo } from 'react';
import { Trash2, Search, Calendar, FileText, Video, Mic, Music, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Plus, Image as ImageIcon, X, Pencil, Star, ExternalLink, Camera, RefreshCw, ChevronUp, ChevronDown, Save, Instagram, Sparkles } from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { SocialSuite } from '../components/SocialSuite';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { resolveImageUrl } from '../utils/image';
import { getAuthHeaders } from '../utils/auth';
import { FlagIcon } from '../components/ui/FlagIcon';
import { AgendaModal } from '../components/AgendaModal';
import { fetchWithFallback } from '../utils/fetcher';

// Composant thumbnail robuste avec fallback SVG inline (évite les blocages SW/CORS)
function AdminThumbnail({ src }: { src?: string | null }) {
    const [error, setError] = useState(false);

    if (!src || error) return (
        <div className="w-full h-full flex items-center justify-center bg-white/5">
            <ImageIcon className="w-5 h-5 text-gray-600" />
        </div>
    );

    return (
        <img
            src={resolveImageUrl(src)}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setError(true)}
        />
    );
}

// Data will be fetched from API via fetchJson

const EDITOR_COLORS = [
    '#FF1241', // neon-red
    '#00FFFF', // neon-cyan
    '#BF00FF', // neon-purple
    '#39FF14', // neon-green
    '#FFF01F', // neon-yellow
    '#FF5E00', // neon-orange
    '#00BFFF', // neon-blue
    '#FF0099', // neon-pink
    '#00FF88', // neon-mint
    '#7B61FF', // neon-indigo
    '#FFFFFF', // blanc
];

const getEditorColor = (username: string) => {
    if (!username) return EDITOR_COLORS[1];
    const normalized = username.toLowerCase();
    if (normalized === 'alex') return '#FF1241';
    if (normalized === 'tanguy') return '#00FFFF';
    if (normalized === 'julien') return '#BF00FF';
    if (normalized === 'tiffany') return '#39FF14';
    if (normalized === 'kevin') return '#FFF01F';
    if (normalized === 'guiyoome') return '#FF5E00';

    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
    }
    return EDITOR_COLORS[Math.abs(hash) % EDITOR_COLORS.length];
};

const getAuthorTextStyle = (username: string) => {
    if (!username) return { color: '#00FFFF' };
    const normalized = username.toLowerCase();
    const color = getEditorColor(normalized);
    if (normalized === 'alex') {
        return {
            background: 'linear-gradient(to right, #FF1241, #FF0099, #BF00FF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
        };
    }
    return { color };
};

async function fetchJson(file: string): Promise<any[]> {
    try {
        const endpoint = `/api/${file.replace('.json', '')}`;
        const data = await fetchWithFallback(endpoint);
        if (data) return Array.isArray(data) ? data : [];
    } catch (error: any) {
        console.error(`API fetch failed for ${file}:`, error);
    }
    return [];
}

type ContentType = 'News' | 'Musique' | 'Recaps' | 'Interviews' | 'Agenda' | 'Communauté' | 'Focus';

export function AdminManage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const initialTab = (searchParams.get('tab') as ContentType) || (sessionStorage.getItem('admin_active_tab') as ContentType) || 'News';
    const initialSearch = searchParams.get('q') || sessionStorage.getItem('admin_search_term') || '';
    const [activeTab, setActiveTab] = useState<ContentType>(initialTab);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [deleteStatus, setDeleteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<{ id: number | string, title: string } | null>(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [activePhotoId, setActivePhotoId] = useState<number | string | null>(null);
    const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
    const [editingAgendaItem, setEditingAgendaItem] = useState<any>(null);
    const [team, setTeam] = useState<any[]>([]);
    const [featuredTarget, setFeaturedTarget] = useState<any | null>(null);
    const [socialItem, setSocialItem] = useState<any | null>(null);
    const [brokenImages, setBrokenImages] = useState<any[]>([]);
    const [showBrokenOnly, setShowBrokenOnly] = useState(false);
    const [imageChangeTarget, setImageChangeTarget] = useState<{ id: number | string, title: string } | null>(null);
    const [residenceUpdateTarget, setResidenceUpdateTarget] = useState<any | null>(null);

    const fetchBrokenImages = async () => {
        try {
            const res = await fetch('/api/broken-images', { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setBrokenImages(Array.isArray(data) ? data : (data.broken || []));
            }
        } catch (e) {
            console.error("Error fetching broken images:", e);
        }
    };

    useEffect(() => {
        fetchBrokenImages();
    }, []);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const data = await fetchWithFallback('/api/team');
                if (data) setTeam(Array.isArray(data) ? data : []);
            } catch (e: any) {
                console.error("Error fetching team:", e);
            }
        };
        fetchTeam();
    }, []);

    const getAuthorInsta = (authorName: string) => {
        if (!authorName) return null;
        const normalized = authorName.trim().toLowerCase();
        const member = team.find(m =>
            m.name.trim().toLowerCase() === normalized ||
            normalized.includes(m.name.trim().toLowerCase()) ||
            m.name.trim().toLowerCase().includes(normalized)
        );
        return member?.socials?.instagram && member.socials.instagram !== '#' ? member.socials.instagram : null;
    };

    // Sync with sessionStorage
    useEffect(() => {
        sessionStorage.setItem('admin_active_tab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        sessionStorage.setItem('admin_search_term', searchTerm);
    }, [searchTerm]);

    const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const storedUser = localStorage.getItem('admin_user');
    const storedPermissions = JSON.parse(localStorage.getItem('admin_permissions') || '[]');

    const hasPermission = (p: string) => {
        if (storedPermissions.includes('all')) return true;
        if (storedUser === 'alex') return true;

        const oldToNew: Record<string, string> = {
            'social': 'social_studio',
            'news': 'news_focus',
            'musique': 'musique_releases',
            'interviews': 'interviews_video',
            'recaps': 'recaps_festivals',
            'agenda': 'agenda_events',
            'wiki': 'wiki_dropsiders',
            'community': 'community_mod',
            'broadcast': 'push_newsletter',
            'messages': 'messages_contact',
            'stats': 'stats_analytics',
            'accueil': 'home_layout'
        };

        const tabToPerm: Record<string, string> = {
            'News': 'news',
            'Focus': 'news',
            'Musique': 'musique',
            'Recaps': 'recaps',
            'Interviews': 'interviews',
            'Agenda': 'agenda',
            'Communauté': 'community'
        };

        const mapped = tabToPerm[p] || p;
        const checkPerm = oldToNew[mapped] || mapped;

        return storedPermissions.includes(checkPerm) || storedPermissions.includes(mapped) || storedPermissions.includes(p);
    };

    const isAdmin = hasPermission('all');
    const canCreate = hasPermission(activeTab);
    const canEdit = hasPermission(activeTab);
    const canDelete = hasPermission(activeTab);

    // Pagination & Sorting
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<'title' | 'date' | 'pubDate' | 'event' | 'location' | 'country' | 'year' | 'manual'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [isOrderDirty, setIsOrderDirty] = useState(false);
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const itemsPerPage = 20;

    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds([]);
        setIsOrderDirty(false);
        fetchData();
    }, [activeTab]);

    const handleBulkDelete = async () => {
        setBulkDeleteConfirm(false);
        setDeleteStatus('loading');
        setMessage(`Suppression de ${selectedIds.length} éléments...`);

        try {
            const endpoint = activeTab === 'Interviews' ? '/api/news/delete' :
                activeTab === 'Communauté' ? '/api/galerie/delete' :
                    `/api/${activeTab.toLowerCase()}/delete`;
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ ids: selectedIds })
            });

            if (response.ok) {
                setDeleteStatus('success');
                setMessage(`${selectedIds.length} éléments supprimés avec succès !`);
                setSelectedIds([]);
                setTimeout(async () => {
                    await fetchData();
                    setDeleteStatus('idle');
                }, 2000);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setDeleteStatus('error');
                setMessage(errorData.error || 'Échec de la suppression groupée.');
            }
        } catch (e: any) {
            setDeleteStatus('error');
            setMessage('Erreur lors de la suppression groupée.');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let data: any[] = [];
            if (activeTab === 'News' || activeTab === 'Interviews' || activeTab === 'Musique' || activeTab === 'Focus') {
                const allNews = await fetchJson('news.json');
                data = activeTab === 'News'
                    ? allNews.filter((item: any) => item.category === 'News' && !item.isFocus)
                    : activeTab === 'Interviews'
                        ? allNews.filter((item: any) => item.category?.startsWith('Interview'))
                        : activeTab === 'Musique'
                            ? allNews.filter((item: any) => item.category === 'Musique')
                            : allNews.filter((item: any) => item.isFocus);
            } else if (activeTab === 'Recaps') {
                data = await fetchJson('recaps.json');
            } else if (activeTab === 'Agenda') {
                data = await fetchJson('agenda.json');
            } else if (activeTab === 'Communauté') {
                data = await fetchJson('galerie.json');
            }
            setItems(data);
        } catch (error: any) {
            console.error('Error fetching data:', error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number | string) => {
        setDeleteStatus('loading');
        try {
            const endpoint = activeTab === 'Interviews' ? '/api/news/delete' :
                activeTab === 'Communauté' ? '/api/galerie/delete' :
                    `/api/${activeTab.toLowerCase()}/delete`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id })
            });

            if (response.ok) {
                setDeleteStatus('success');
                setMessage('Supprimé avec succès !');
                setTimeout(async () => {
                    await fetchData();
                    setDeleteStatus('idle');
                }, 1500);
            } else {
                let errorData;
                try { errorData = await response.json(); } catch (e: any) { errorData = { error: `Erreur ${response.status}` }; }
                setDeleteStatus('error');
                setMessage(errorData.error || 'Erreur lors de la suppression');
            }
        } catch (error: any) {
            setDeleteStatus('error');
            setMessage('Erreur de connexion');
        }
    };

    const handleEdit = (item: any) => {
        const isInterview = item.category === 'Interview' || item.category === 'Interviews' || item.category === 'Interview Video' || activeTab === 'Interviews';
        const isMusique = item.category === 'Musique' || activeTab === 'Musique';

        let editPath = '';
        if (activeTab === 'Recaps') {
            editPath = `/recaps/create?id=${item.id}`;
        } else if (isInterview) {
            editPath = `/news/create?type=Interview&id=${item.id}`;
        } else if (isMusique) {
            editPath = `/news/create?type=Musique&id=${item.id}`;
        } else if (activeTab === 'Agenda') {
            setEditingAgendaItem(item);
            setIsAgendaModalOpen(true);
            return;
        } else if (activeTab === 'Communauté') {
            editPath = `/galerie/create?id=${item.id}`;
        } else if (activeTab === 'Focus') {
            editPath = `/news/create?tab=Focus&id=${item.id}`;
        } else {
            editPath = `/news/create?id=${item.id}`;
        }

        navigate(editPath, { state: { isEditing: true, item } });
    };

    const handleToggleFeatured = async (item: any) => {
        try {
            const newStatus = !item.isFeatured;
            let endpoint = '';
            if (activeTab === 'Recaps') endpoint = '/api/recaps/update';
            else if (activeTab === 'Communauté') endpoint = '/api/galerie/update';
            else endpoint = '/api/news/update';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id: item.id, isFeatured: newStatus })
            });

            if (response.ok) {
                setItems(prev => prev.map(i => {
                    if (i.id === item.id) return { ...i, isFeatured: newStatus };
                    // If we just featured this item, any other featured item in the list should lose its status
                    if (newStatus && i.isFeatured) return { ...i, isFeatured: false };
                    return i;
                }));
            }
        } catch (e: any) {
            console.error('Error toggling featured:', e);
        }
    };

    const handleUpdatePhoto = async (newImageUrl: string | string[]) => {
        if (!activePhotoId && !residenceUpdateTarget) return;
        let actualUrl = Array.isArray(newImageUrl) ? newImageUrl[0] : newImageUrl;

        // Normalisation de l'URL pour éviter les doublons /uploads/uploads/
        if (actualUrl.includes('dropsiders.fr/uploads/')) {
            actualUrl = actualUrl.split('dropsiders.fr')[1];
        }
        
        // Nettoyage des préfixes redondants
        while (actualUrl.startsWith('/uploads/uploads/')) {
            actualUrl = actualUrl.substring(8);
        }
        if (actualUrl.startsWith('uploads/uploads/')) {
            actualUrl = '/' + actualUrl.substring(8);
        }

        try {
            setLoading(true);
            
            if (residenceUpdateTarget) {
                const response = await fetch('/api/agenda/update-residence-photos', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ 
                        title: residenceUpdateTarget.title, 
                        location: residenceUpdateTarget.location, 
                        image: actualUrl 
                    })
                });

                if (response.ok) {
                    // Update all items in local state that match the residence
                    setItems(prev => prev.map(i => 
                        (i.title === residenceUpdateTarget.title && i.location === residenceUpdateTarget.location) 
                        ? { ...i, image: actualUrl } 
                        : i
                    ));
                    setResidenceUpdateTarget(null);
                    setIsImageModalOpen(false);
                }
            } else {
                let endpoint = '/api/news/update';
                if (activeTab === 'Recaps') endpoint = '/api/recaps/update';
                else if (activeTab === 'Agenda') endpoint = '/api/agenda/update';
                else if (activeTab === 'Communauté') endpoint = '/api/galerie/update';

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ id: activePhotoId, image: actualUrl })
                });

                if (response.ok) {
                    setItems(prev => prev.map(i => i.id === activePhotoId ? { ...i, image: actualUrl } : i));
                    setIsImageModalOpen(false);
                    fetchBrokenImages();
                }
            }
        } catch (e: any) {
            console.error('Error updating photo:', e);
        } finally {
            setLoading(false);
            setActivePhotoId(null);
            setResidenceUpdateTarget(null);
        }
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        const newItems = [...items];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newItems.length) return;
        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
        setItems(newItems);
        setIsOrderDirty(true);
        if (sortBy !== 'manual') setSortBy('manual');
    };

    const handleSaveOrder = async () => {
        setIsSavingOrder(true);
        try {
            const resource = (activeTab === 'Interviews' || activeTab === 'Musique' || activeTab === 'News' || activeTab === 'Focus') ? 'news' : activeTab.toLowerCase();
            const filename = resource === 'news' ? 'news.json' :
                resource === 'recaps' ? 'recaps.json' :
                    resource === 'agenda' ? 'agenda.json' :
                        activeTab === 'Communauté' ? 'galerie.json' : null;

            if (!filename) return;

            const fullList = await fetchJson(filename);
            let updatedList = [...fullList];

            if (resource === 'news') {
                let localIdx = 0;
                updatedList = fullList.map(item => {
                    const matchesTab = activeTab === 'News' ? (item.category === 'News' && !item.isFocus)
                        : activeTab === 'Interviews' ? item.category?.startsWith('Interview')
                            : activeTab === 'Musique' ? item.category === 'Musique'
                                : item.isFocus;
                    if (matchesTab) {
                        return items[localIdx++] || item;
                    }
                    return item;
                });
            } else {
                updatedList = items;
            }

            const response = await fetch(`/api/${filename.replace('.json', '')}/reorder`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ items: updatedList })
            });

            if (response.ok) {
                setIsOrderDirty(false);
                setMessage('Ordre sauvegardé !');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Erreur lors de la sauvegarde');
            }
        } catch (e: any) {
            console.error('Error saving order:', e);
            setMessage('Erreur de connexion');
        } finally {
            setIsSavingOrder(false);
        }
    };

    const [selectedCategory, setSelectedCategory] = useState('ALL');

    const categories = useMemo(() => {
        if (activeTab !== 'Communauté') return [];
        const cats = new Set(items.map(item => item.category).filter(Boolean));
        return ['ALL', ...Array.from(cats)];
    }, [items, activeTab]);

    const filteredAndSortedItems = useMemo(() => {
        let result = items.filter(item => {
            const matchesSearch =
                item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.category?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });

        if (showBrokenOnly) {
            const locationMap: Record<string, string> = {
                'News': 'news',
                'Musique': 'news',
                'Interviews': 'news',
                'Focus': 'news',
                'Recaps': 'recaps',
                'Agenda': 'agenda',
                'Communauté': 'galerie'
            };
            const loc = locationMap[activeTab];
            result = result.filter(item => 
                brokenImages.some((img: any) => img.location === loc && String(img.entityId) === String(item.id))
            );
        }

        if (sortBy !== 'manual') {
            result.sort((a, b) => {
                let valA, valB;
                switch (sortBy) {
                    case 'title':
                    case 'event':
                        valA = a.title?.toLowerCase() || '';
                        valB = b.title?.toLowerCase() || '';
                        break;
                    case 'date':
                        valA = a.date || '';
                        valB = b.date || '';
                        break;
                    case 'pubDate':
                        valA = a.id || 0;
                        valB = b.id || 0;
                        break;
                    case 'location':
                        valA = a.location?.toLowerCase() || '';
                        valB = b.location?.toLowerCase() || '';
                        break;
                    case 'country':
                        valA = a.location?.split(',').pop()?.trim().toLowerCase() || '';
                        valB = b.location?.split(',').pop()?.trim().toLowerCase() || '';
                        break;
                    case 'year':
                        valA = Number(a.year) || 0;
                        valB = Number(b.year) || 0;
                        break;
                    default:
                        valA = a.date || '';
                        valB = b.date || '';
                }
                if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [items, searchTerm, selectedCategory, sortBy, sortOrder]);

    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedItems.slice(start, start + itemsPerPage);
    }, [filteredAndSortedItems, currentPage]);

    const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);

    const tabs: { type: ContentType; icon: any; color: string }[] = [
        { type: 'News', icon: <FileText className="w-4 h-4" />, color: 'text-neon-blue' },
        { type: 'Musique', icon: <Music className="w-4 h-4" />, color: 'text-neon-cyan' },
        { type: 'Recaps', icon: <Video className="w-4 h-4" />, color: 'text-neon-red' },
        { type: 'Interviews', icon: <Mic className="w-4 h-4" />, color: 'text-neon-purple' },
        { type: 'Focus', icon: <Star className="w-4 h-4" />, color: 'text-neon-yellow' },
        { type: 'Agenda', icon: <Calendar className="w-4 h-4" />, color: 'text-neon-yellow' },
        { type: 'Communauté', icon: <ImageIcon className="w-4 h-4" />, color: 'text-neon-pink' },
    ];

    return (
        <div className="min-h-screen bg-dark-bg py-32">
            <div className="max-w-full mx-auto px-4 md:px-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div className="flex items-center gap-6">
                        <Link to="/admin" className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white group" title="Retour au tableau de bord">
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter">
                                GESTION <span className="text-neon-red">DU CONTENU</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {isOrderDirty && (
                            <button
                                onClick={handleSaveOrder}
                                disabled={isSavingOrder}
                                className="px-6 py-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 flex items-center gap-2 font-bold uppercase tracking-widest text-xs"
                            >
                                {isSavingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Sauvegarder l'ordre
                            </button>
                        )}
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-neon-red transition-colors"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={fetchData}
                            className="p-4 bg-white/5 text-white border border-white/10 rounded-full hover:bg-white/10 transition-all flex items-center justify-center group flex-shrink-0"
                            title="Mettre à jour"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        </button>
                        {canCreate && (
                            activeTab === 'Agenda' ? (
                                <button
                                    onClick={() => {
                                        setEditingAgendaItem(null);
                                        setIsAgendaModalOpen(true);
                                    }}
                                    className="p-4 bg-neon-red text-white rounded-full hover:bg-neon-red/80 transition-all shadow-lg shadow-neon-red/20 flex items-center justify-center group flex-shrink-0"
                                >
                                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                                </button>
                            ) : (
                                <Link
                                    to={
                                        activeTab === 'News' ? '/news/create' :
                                            activeTab === 'Musique' ? '/news/create?type=Musique' :
                                                activeTab === 'Recaps' ? '/recaps/create' :
                                                    activeTab === 'Interviews' ? '/news/create?type=Interview' :
                                                        activeTab === 'Focus' ? '/news/create?tab=Focus' :
                                                            activeTab === 'Communauté' ? '/galerie/create' : '#'
                                    }
                                    className="p-4 bg-neon-red text-white rounded-full hover:bg-neon-red/80 transition-all shadow-lg shadow-neon-red/20 flex items-center justify-center group flex-shrink-0"
                                >
                                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                                </Link>
                            )
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-6 mb-8">
                    <div className="flex flex-wrap gap-3">
                        {tabs.map((tab) => (
                            <button
                                key={tab.type}
                                onClick={() => setActiveTab(tab.type)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-wider transition-all border ${activeTab === tab.type ? 'bg-white/10 border-white/20 ' + tab.color + ' transform -translate-y-1' : 'bg-white/5 border-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}
                            >
                                {tab.icon} {tab.type}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'Communauté' && categories.length > 2 && (
                        <div className="flex flex-wrap gap-2 p-2 bg-white/5 rounded-2xl border border-white/10">
                            {categories.map((cat: string) => (
                                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-neon-pink text-white shadow-lg shadow-neon-pink/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>{cat}</button>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Trier par :</span>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-transparent border-none text-xs font-bold text-white focus:ring-0 cursor-pointer uppercase tracking-widest">
                                <option className="bg-dark-bg" value="date">{activeTab === 'Recaps' || activeTab === 'Agenda' ? 'Date de l\'event' : 'Plus récents'}</option>
                                <option className="bg-dark-bg" value="manual">Ordre Manuel</option>
                                <option className="bg-dark-bg" value="title">Nom</option>
                                <option className="bg-dark-bg" value="pubDate">Date de publication</option>
                                <option className="bg-dark-bg" value="location">Lieu</option>
                                <option className="bg-dark-bg" value="country">Pays</option>
                                <option className="bg-dark-bg" value="year">Année</option>
                            </select>
                            <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="text-[10px] font-black text-neon-red uppercase tracking-widest hover:underline">{sortOrder === 'asc' ? 'Croissant' : 'Récent first'}</button>
                            
                            <div className="h-4 w-px bg-white/10 mx-2" />
                            
                            <button 
                                onClick={() => setShowBrokenOnly(!showBrokenOnly)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${showBrokenOnly ? 'bg-neon-red text-white shadow-lg shadow-neon-red/20' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                            >
                                <AlertCircle className={`w-3.5 h-3.5 ${showBrokenOnly ? 'text-white' : 'text-neon-red'}`} />
                                Images Cassées {brokenImages.length > 0 && <span className="opacity-60">({
                                    (() => {
                                        const locationMap: Record<string, string> = {
                                            'News': 'news', 'Musique': 'news', 'Interviews': 'news', 'Focus': 'news',
                                            'Recaps': 'recaps', 'Agenda': 'agenda', 'Communauté': 'galerie'
                                        };
                                        const loc = locationMap[activeTab];
                                        return brokenImages.filter(img => img.location === loc).length;
                                    })()
                                })</span>}
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="p-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/10 disabled:opacity-30 transition-all text-white"
                                    title="Précédent"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>

                                <div className="flex gap-1 overflow-x-auto max-w-[200px] md:max-w-none no-scrollbar">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-black transition-all ${currentPage === page
                                                ? 'bg-neon-red text-white shadow-lg shadow-neon-red/20'
                                                : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 border border-white/5'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="p-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/10 disabled:opacity-30 transition-all text-white rotate-180"
                                    title="Suivant"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                            </div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap hidden sm:block">
                                Total : {filteredAndSortedItems.length} éléments
                            </span>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {deleteStatus !== 'idle' && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${deleteStatus === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : deleteStatus === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                            {deleteStatus === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
                            {deleteStatus === 'success' && <CheckCircle2 className="w-5 h-5" />}
                            {deleteStatus === 'error' && <AlertCircle className="w-5 h-5" />}
                            <span className="font-bold">{message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Multi-delete status/actions */}
                <AnimatePresence>
                    {selectedIds.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="mb-6 p-4 bg-neon-red/10 border border-neon-red/30 rounded-2xl flex items-center justify-between"
                        >
                            {canDelete ? (
                                <>
                                    <div className="flex items-center gap-4">
                                        <span className="text-white font-bold">{selectedIds.length} élément(s) sélectionné(s)</span>
                                        <button
                                            onClick={() => setSelectedIds([])}
                                            className="text-xs text-gray-400 hover:text-white underline uppercase tracking-widest font-black"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setBulkDeleteConfirm(true)}
                                        className="px-6 py-2 bg-neon-red text-white text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(255,0,51,0.3)] transition-all flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Supprimer la sélection
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center gap-4 py-2">
                                    <span className="text-white/60 text-xs font-bold uppercase tracking-widest italic tracking-tighter">Action groupée désactivée (Droit "Supprimer" requis)</span>
                                    <button
                                        onClick={() => setSelectedIds([])}
                                        className="text-[10px] text-gray-500 hover:text-white underline uppercase font-black"
                                    >
                                        Désélectionner
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4 text-gray-500">
                            <Loader2 className="w-12 h-12 animate-spin text-neon-red" />
                            <p className="font-bold uppercase tracking-widest animate-pulse">Chargement...</p>
                        </div>
                    ) : paginatedItems.length === 0 ? (
                        <div className="p-20 text-center text-gray-500">
                            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="text-xl font-bold">Aucun contenu trouvé</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5">
                                        <th className="px-6 py-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedIds(paginatedItems.map(i => i.id));
                                                    } else {
                                                        setSelectedIds([]);
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-white/20 bg-black text-neon-red focus:ring-neon-red focus:ring-offset-black"
                                            />
                                        </th>
                                        {isAdmin && (
                                            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest w-10">Sup.</th>
                                        )}
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Image</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Titre</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Auteur</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Année</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">{activeTab === 'Recaps' || activeTab === 'Agenda' ? 'Date Event' : 'Date'}</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {paginatedItems.map((item) => {
                                        const isSelected = selectedIds.includes(item.id);
                                        return (
                                            <tr key={item.id} className={`hover:bg-white/[0.02] transition-colors group ${isSelected ? 'bg-white/[0.03]' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            if (isSelected) {
                                                                setSelectedIds(selectedIds.filter(id => id !== item.id));
                                                            } else {
                                                                setSelectedIds([...selectedIds, item.id]);
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded border-white/20 bg-black text-neon-red focus:ring-neon-red focus:ring-offset-black"
                                                    />
                                                </td>
                                                {canDelete && (
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => setDeleteTarget({ id: item.id, title: item.title })}
                                                            className="p-3 text-gray-600 hover:text-neon-red hover:bg-neon-red/10 rounded-xl transition-all"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4">
                                                    <div 
                                                        className={`w-12 h-12 rounded-lg overflow-hidden bg-black/40 border border-white/10 ${activeTab === 'Agenda' ? 'cursor-pointer hover:border-neon-red ring-offset-2 ring-offset-black hover:ring-2 ring-neon-red/30 transition-all' : ''}`}
                                                        onClick={() => {
                                                            if (activeTab === 'Agenda') {
                                                                setImageChangeTarget({ id: item.id, title: item.title });
                                                            }
                                                        }}
                                                        title={activeTab === 'Agenda' ? "Cliquer pour changer l'image" : ""}
                                                    >
                                                        <AdminThumbnail src={item.image} />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-white line-clamp-1 flex items-center gap-2">
                                                        <Link
                                                            to={
                                                                activeTab === 'Recaps' ? `/recaps/${item.id}` :
                                                                    activeTab === 'Interviews' ? `/interviews/${item.id}` :
                                                                        activeTab === 'Communauté' ? `/galerie/${item.id}` :
                                                                            activeTab === 'Agenda' ? `/agenda` :
                                                                                `/news/${item.id}`
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="hover:text-neon-red transition-colors flex items-center gap-1.5 group/link"
                                                            title="Voir l'article"
                                                        >
                                                            {item.title}
                                                            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0" />
                                                            {(() => {
                                                                const locationMap: Record<string, string> = {
                                                                    'News': 'news', 'Musique': 'news', 'Interviews': 'news', 'Focus': 'news',
                                                                    'Recaps': 'recaps', 'Agenda': 'agenda', 'Communauté': 'galerie'
                                                                };
                                                                const loc = locationMap[activeTab];
                                                                const isBroken = brokenImages.some((img: any) => img.location === loc && String(img.entityId) === String(item.id));
                                                                return isBroken && (
                                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-neon-red/20 border border-neon-red/30" title="Image cassée détectée">
                                                                        <AlertCircle className="w-3 h-3 text-neon-red" />
                                                                        <span className="text-[8px] font-black text-neon-red uppercase tracking-tighter">Broken</span>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </Link>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {activeTab === 'Interviews' && (() => {
                                                            const cat = (item.category || '').toLowerCase();
                                                            const title = (item.title || '').toLowerCase();
                                                            let label = 'Écrite';
                                                            let color = 'text-neon-purple border-neon-purple/40 bg-neon-purple/10';
                                                            if (cat.includes('fast quizz') || title.includes('fast quizz')) {
                                                                label = 'Fast Quizz'; color = 'text-neon-cyan border-neon-cyan/40 bg-neon-cyan/10';
                                                            } else if (cat.includes('la playlist') || cat.includes('playlist') || title.includes('la playlist')) {
                                                                label = 'La Playlist'; color = 'text-neon-pink border-neon-pink/40 bg-neon-pink/10';
                                                            } else if (cat.includes('drop & talk') || title.includes('drop & talk')) {
                                                                label = 'Drop & Talk'; color = 'text-neon-yellow border-neon-yellow/40 bg-neon-yellow/10';
                                                            } else if (cat.includes('interview video')) {
                                                                label = 'Interview'; color = 'text-neon-blue border-neon-blue/40 bg-neon-blue/10';
                                                            }
                                                            return (
                                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${color}`}>
                                                                    {label}
                                                                </span>
                                                            );
                                                        })()}
                                                        <span className="text-xs text-gray-400 uppercase italic opacity-60 flex items-center gap-1.5">
                                                            {item.location ? (
                                                                <>
                                                                    {item.location}
                                                                    {item.country && (
                                                                        <>
                                                                            <span className="text-neon-cyan not-italic">•</span>
                                                                            <span className="text-neon-cyan not-italic">{item.country}</span>
                                                                            <FlagIcon location={item.country} className="w-3.5 h-2.5 ml-0.5" />
                                                                        </>
                                                                    )}
                                                                </>
                                                            ) : item.summary?.substring(0, 50)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.author ? (
                                                        getAuthorInsta(item.author) ? (
                                                            <a
                                                                href={getAuthorInsta(item.author)!}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs font-black uppercase tracking-wider hover:opacity-80 transition-opacity underline decoration-white/10"
                                                                style={getAuthorTextStyle(item.author)}
                                                            >
                                                                {item.author}
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs font-black uppercase tracking-wider" style={getAuthorTextStyle(item.author)}>
                                                                {item.author}
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="text-xs font-black uppercase tracking-wider" style={getAuthorTextStyle('Alex')}>
                                                            Alex
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-gray-400">{item.year || (item.startDate || item.date || '').split('-')[0] || '-'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-400">{item.date}</td>
                                                <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                                                    {!searchTerm && selectedCategory === 'ALL' && (
                                                        <div className="flex items-center gap-1 mr-2 border-r border-white/10 pr-2">
                                                            <button
                                                                onClick={() => handleMove(items.indexOf(item), 'up')}
                                                                disabled={items.indexOf(item) === 0}
                                                                className="p-2 text-gray-500 hover:text-white disabled:opacity-10 transition-colors"
                                                                title="Monter"
                                                            >
                                                                <ChevronUp className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleMove(items.indexOf(item), 'down')}
                                                                disabled={items.indexOf(item) === items.length - 1}
                                                                className="p-2 text-gray-500 hover:text-white disabled:opacity-10 transition-colors"
                                                                title="Descendre"
                                                            >
                                                                <ChevronDown className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {['News', 'Musique', 'Interviews', 'Recaps', 'Focus'].includes(activeTab) && (
                                                        <button
                                                            onClick={() => setFeaturedTarget(item)}
                                                            className={`p-3 rounded-xl transition-all ${item.isFeatured ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-500 hover:text-yellow-500 hover:bg-yellow-500/10'}`}
                                                            title={item.isFeatured ? "Retirer de la une" : "Mettre à la une"}
                                                        >
                                                            <Star className={`w-5 h-5 ${item.isFeatured ? 'fill-current' : ''}`} />
                                                        </button>
                                                    )}
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="p-3 text-gray-500 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-xl transition-all"
                                                            title="Modifier"
                                                        >
                                                            <Pencil className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {(activeTab === 'Interviews' || activeTab === 'Agenda') && (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => {
                                                                    setActivePhotoId(item.id);
                                                                    setIsImageModalOpen(true);
                                                                }}
                                                                className={`p-3 text-gray-500 hover:bg-opacity-10 rounded-xl transition-all ${activeTab === 'Agenda' ? 'hover:text-neon-yellow hover:bg-neon-yellow/10' : 'hover:text-neon-pink hover:bg-neon-pink/10'}`}
                                                                title="Changer uniquement la photo"
                                                            >
                                                                <Camera className="w-5 h-5" />
                                                            </button>
                                                            {activeTab === 'Agenda' && (item.isWeekly || item.type === 'Residence') && (
                                                                <button
                                                                    onClick={() => setResidenceUpdateTarget(item)}
                                                                    className="p-3 text-neon-cyan hover:bg-neon-cyan/10 rounded-xl transition-all"
                                                                    title="Changer pour TOUTE la résidence"
                                                                >
                                                                    <Sparkles className="w-5 h-5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                    {['News', 'Musique', 'Interviews'].includes(activeTab) && (
                                                        <button
                                                            onClick={() => setSocialItem(item)}
                                                            className="p-3 text-gray-500 hover:text-white hover:bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] rounded-xl transition-all shadow-xl hover:scale-110"
                                                            title="Générer visuel Instagram"
                                                        >
                                                            <Instagram className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Bottom Pagination */}
                {totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => {
                                    setCurrentPage(prev => prev - 1);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="p-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/10 disabled:opacity-30 transition-all text-white"
                                title="Précédent"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>

                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                                    .map((page, i, arr) => {
                                        const showEllipsis = i > 0 && page - arr[i - 1] > 1;
                                        return (
                                            <div key={page} className="flex gap-1">
                                                {showEllipsis && <span className="text-gray-600 px-2 flex items-center">...</span>}
                                                <button
                                                    onClick={() => {
                                                        setCurrentPage(page);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                    className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-black transition-all ${currentPage === page
                                                        ? 'bg-neon-red text-white shadow-lg shadow-neon-red/20'
                                                        : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 border border-white/5'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            </div>
                                        );
                                    })}
                            </div>

                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => {
                                    setCurrentPage(prev => prev + 1);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="p-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/10 disabled:opacity-30 transition-all text-white rotate-180"
                                title="Suivant"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={imageChangeTarget !== null}
                title="Modifier l'image"
                message={`Voulez-vous changer l'image de "${imageChangeTarget?.title}" ?`}
                confirmLabel="Changer l'image"
                cancelLabel="Annuler"
                onConfirm={() => {
                    if (imageChangeTarget) {
                        setActivePhotoId(imageChangeTarget.id);
                        setIsImageModalOpen(true);
                    }
                    setImageChangeTarget(null);
                }}
                onCancel={() => setImageChangeTarget(null)}
                accentColor="neon-yellow"
            />

            <ConfirmationModal
                isOpen={deleteTarget !== null}
                title="Supprimer le contenu"
                message={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.title}" ?`}
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                onConfirm={() => {
                    if (deleteTarget) handleDelete(deleteTarget.id);
                    setDeleteTarget(null);
                }}
                onCancel={() => setDeleteTarget(null)}
                accentColor="neon-red"
            />

            <ConfirmationModal
                isOpen={bulkDeleteConfirm}
                title="Suppression groupée"
                message={`Êtes-vous sûr de vouloir supprimer ces ${selectedIds.length} éléments ? Cette action est irréversible.`}
                confirmLabel="Supprimer tout"
                cancelLabel="Annuler"
                onConfirm={handleBulkDelete}
                onCancel={() => setBulkDeleteConfirm(false)}
                accentColor="neon-red"
            />

            <ImageUploadModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                onUploadSuccess={handleUpdatePhoto}
                accentColor="neon-pink"
                aspect={4 / 3}
            />

            <ConfirmationModal
                isOpen={featuredTarget !== null}
                title={featuredTarget?.isFeatured ? "Retirer de la une" : "Mettre à la une"}
                message={featuredTarget?.isFeatured
                    ? `Retirer "${featuredTarget?.title}" de la une ?`
                    : `Mettre "${featuredTarget?.title}" à la une ? L'article actuellement en avant sera remplacé.`
                }
                confirmLabel={featuredTarget?.isFeatured ? "Retirer" : "Mettre à la une"}
                cancelLabel="Annuler"
                onConfirm={() => {
                    if (featuredTarget) handleToggleFeatured(featuredTarget);
                    setFeaturedTarget(null);
                }}
                onCancel={() => setFeaturedTarget(null)}
                accentColor="neon-yellow"
            />

            <AnimatePresence>
                <ConfirmationModal
                    isOpen={!!residenceUpdateTarget}
                    onConfirm={() => setIsImageModalOpen(true)}
                    onCancel={() => setResidenceUpdateTarget(null)}
                    title="Modifier la résidence ?"
                    message={`Voulez-vous changer le flyer pour TOUTES les dates de la résidence "${residenceUpdateTarget?.title || ''}" à ${residenceUpdateTarget?.location || ''} ? Cela affectera tous les événements futurs de cette série.`}
                    confirmLabel="Changer tout"
                    cancelLabel="Annuler"
                    accentColor="neon-cyan"
                />

                {socialItem && (
                    <SocialSuite
                        title={socialItem.title}
                        imageUrl={socialItem.image}
                        onClose={() => setSocialItem(null)}
                    />
                )}
            </AnimatePresence>
            <AgendaModal
                isOpen={isAgendaModalOpen}
                onClose={() => {
                    setIsAgendaModalOpen(false);
                    setEditingAgendaItem(null);
                }}
                onSuccess={() => {
                    fetchData();
                    setIsAgendaModalOpen(false);
                    setEditingAgendaItem(null);
                }}
                editingItem={editingAgendaItem}
            />
        </div>
    );
}
