import { useState, useEffect, useMemo } from 'react';
import { Trash2, Search, Calendar, FileText, Video, Mic, Music, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Plus, Image as ImageIcon, X, Pencil, Star } from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';

// Import des données locales (fallback si GitHub inaccessible)
import newsDataLocal from '../data/news.json';
import recapsDataLocal from '../data/recaps.json';
import agendaDataLocal from '../data/agenda.json';
import galerieDataLocal from '../data/galerie.json';

const LOCAL_DATA: Record<string, any[]> = {
    'news.json': newsDataLocal as any[],
    'recaps.json': recapsDataLocal as any[],
    'agenda.json': agendaDataLocal as any[],
    'galerie.json': galerieDataLocal as any[],
};

async function fetchJson(file: string): Promise<any[]> {
    try {
        const endpoint = `/api/${file.replace('.json', '')}`;
        const response = await fetch(endpoint);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error(`API fetch failed for ${file}, falling back to local:`, error);
    }
    return LOCAL_DATA[file] ?? [];
}

type ContentType = 'News' | 'Musique' | 'Recaps' | 'Interviews' | 'Agenda' | 'Galeries';

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
    const [loadingEditId, setLoadingEditId] = useState<number | string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: number | string, title: string } | null>(null);
    const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);

    // Sync with sessionStorage
    useEffect(() => {
        sessionStorage.setItem('admin_active_tab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        sessionStorage.setItem('admin_search_term', searchTerm);
    }, [searchTerm]);

    // Pagination & Sorting
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<'title' | 'date' | 'pubDate' | 'event' | 'location' | 'country'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const itemsPerPage = 20;

    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds([]);
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let data: any[] = [];
            if (activeTab === 'News' || activeTab === 'Interviews' || activeTab === 'Musique') {
                const allNews = await fetchJson('news.json');
                data = activeTab === 'News'
                    ? allNews.filter((item: any) => item.category === 'News')
                    : activeTab === 'Interviews'
                        ? allNews.filter((item: any) => item.category === 'Interview')
                        : allNews.filter((item: any) => item.category === 'Musique');
            } else if (activeTab === 'Recaps') {
                data = await fetchJson('recaps.json');
            } else if (activeTab === 'Agenda') {
                data = await fetchJson('agenda.json');
            } else if (activeTab === 'Galeries') {
                data = await fetchJson('galerie.json');
            }
            setItems(data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number | string) => {

        setDeleteStatus('loading');
        try {
            const endpoint = (activeTab === 'News' || activeTab === 'Musique' || activeTab === 'Interviews') ? '/api/news/delete' :
                activeTab === 'Recaps' ? '/api/recaps/delete' :
                    activeTab === 'Agenda' ? '/api/agenda/delete' :
                        '/api/galerie/delete';
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
                try { errorData = await response.json(); } catch (e) { errorData = { error: `Erreur ${response.status}` }; }
                setDeleteStatus('error');
                setMessage(errorData.error || 'Erreur lors de la suppression');
            }
        } catch (error) {
            setDeleteStatus('error');
            setMessage('Erreur de connexion');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        setDeleteStatus('loading');
        setMessage(`Suppression de ${selectedIds.length} éléments...`);

        try {
            const endpoint = (activeTab === 'News' || activeTab === 'Musique' || activeTab === 'Interviews') ? '/api/news/delete' :
                activeTab === 'Recaps' ? '/api/recaps/delete' :
                    activeTab === 'Agenda' ? '/api/agenda/delete' :
                        '/api/galerie/delete';

            let successCount = 0;
            for (const id of selectedIds) {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ id })
                });
                if (response.ok) successCount++;
            }

            if (successCount > 0) {
                setDeleteStatus('success');
                setMessage(`${successCount} éléments supprimés avec succès !`);
                setSelectedIds([]);
                setTimeout(async () => {
                    await fetchData();
                    setDeleteStatus('idle');
                }, 1500);
            } else {
                setDeleteStatus('error');
                setMessage('Erreur lors de la suppression groupée');
            }
        } catch (error) {
            setDeleteStatus('error');
            setMessage('Erreur de connexion');
        }
    };

    const toggleSelect = (id: number | string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const pageIds = paginatedItems.map(item => item.id);
        const allSelected = pageIds.every(id => selectedIds.includes(id));

        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
        } else {
            setSelectedIds(prev => [...new Set([...prev, ...pageIds])]);
        }
    };

    const handleEdit = async (item: any) => {
        setLoadingEditId(item.id);
        try {
            // Determine content API based on active tab
            const contentEndpoint =
                activeTab === 'Recaps' ? `/api/recaps/content?id=${item.id}` : `/api/news/content?id=${item.id}`;

            const isContentTab = activeTab !== 'Agenda' && activeTab !== 'Galeries';

            let fullItem = { ...item };

            if (isContentTab) {
                const res = await fetch(contentEndpoint, { headers: getAuthHeaders() });
                if (res.ok) {
                    const data = await res.json();
                    fullItem = { ...item, content: data.content || '' };
                }
            }

            const editPath =
                (activeTab === 'Recaps' ? '/recaps/create' :
                    activeTab === 'Interviews' ? '/news/create?type=Interview' :
                        activeTab === 'Agenda' ? '/agenda/create' :
                            activeTab === 'Galeries' ? '/galerie/create' :
                                '/news/create') + `?id=${item.id}`;

            navigate(editPath, { state: { isEditing: true, item: fullItem } });
        } catch (e) {
            console.error('Error fetching content for edit:', e);
        } finally {
            setLoadingEditId(null);
        }
    };

    const handleToggleFeatured = async (item: any) => {
        try {
            const newStatus = !item.isFeatured;
            const endpoint = activeTab === 'Recaps' ? '/api/recaps/update' : '/api/news/update';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id: item.id, isFeatured: newStatus })
            });

            if (response.ok) {
                setItems(items.map(i => i.id === item.id ? { ...i, isFeatured: newStatus } : i));
            }
        } catch (e) {
            console.error('Error toggling featured:', e);
        }
    };

    const [selectedCategory, setSelectedCategory] = useState('ALL');

    useEffect(() => {
        setSelectedCategory('ALL');
        fetchData();
    }, [activeTab]);

    const categories = useMemo(() => {
        if (activeTab !== 'Galeries') return [];
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
                default:
                    valA = a.date || '';
                    valB = b.date || '';
            }
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

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
        { type: 'Agenda', icon: <Calendar className="w-4 h-4" />, color: 'text-neon-yellow' },
        { type: 'Galeries', icon: <ImageIcon className="w-4 h-4" />, color: 'text-neon-pink' },
    ];

    return (
        <div className="min-h-screen bg-dark-bg py-32 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div className="flex items-center gap-6">
                        <Link to="/admin" className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white group" title="Retour au tableau de bord">
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter">
                                Gestion du <span className="text-neon-red">Contenu</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <AnimatePresence>
                            {selectedIds.length > 0 && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => {
                                        if (window.confirm(`Voulez-vous vraiment supprimer ces ${selectedIds.length} éléments ?`)) {
                                            handleBulkDelete();
                                        }
                                    }}
                                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg shadow-red-600/20"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Supprimer ({selectedIds.length})
                                </motion.button>
                            )}
                        </AnimatePresence>
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
                        <Link
                            to={activeTab === 'News' ? '/news/create' : activeTab === 'Musique' ? '/news/create?type=Musique' : activeTab === 'Recaps' ? '/recaps/create' : activeTab === 'Interviews' ? '/news/create?type=Interview' : activeTab === 'Agenda' ? '/agenda/create' : activeTab === 'Galeries' ? '/galerie/create' : '#'}
                            className="p-4 bg-neon-red text-white rounded-full hover:bg-neon-red/80 transition-all shadow-lg shadow-neon-red/20 flex items-center justify-center group flex-shrink-0"
                        >
                            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                        </Link>
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

                    {activeTab === 'Galeries' && categories.length > 2 && (
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
                                <option className="bg-dark-bg" value="title">Nom</option>
                                <option className="bg-dark-bg" value="date">Date Événement</option>
                                <option className="bg-dark-bg" value="pubDate">Date de publication</option>
                                <option className="bg-dark-bg" value="location">Lieu</option>
                                <option className="bg-dark-bg" value="country">Pays</option>
                            </select>
                            <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="text-[10px] font-black text-neon-red uppercase tracking-widest hover:underline">{sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}</button>
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
                                Total: {filteredAndSortedItems.length} items
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
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest w-10">
                                            <input
                                                type="checkbox"
                                                onChange={toggleSelectAll}
                                                checked={paginatedItems.length > 0 && paginatedItems.every(item => selectedIds.includes(item.id))}
                                                className="w-4 h-4 rounded border-white/10 bg-black/20 text-neon-red focus:ring-neon-red transition-all cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Image</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Titre</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {paginatedItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(item.id)}
                                                    onChange={() => toggleSelect(item.id)}
                                                    className="w-4 h-4 rounded border-white/10 bg-black/20 text-neon-red focus:ring-neon-red transition-all cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/40 border border-white/10">
                                                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white line-clamp-1">{item.title}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-xs">{item.location || item.summary?.substring(0, 50) + '...'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400">{item.date}</td>
                                            <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                                                {['News', 'Musique', 'Interviews', 'Recaps'].includes(activeTab) && (
                                                    <button
                                                        onClick={() => handleToggleFeatured(item)}
                                                        className={`p-3 rounded-xl transition-all ${item.isFeatured ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-500 hover:text-yellow-500 hover:bg-yellow-500/10 opacity-0 group-hover:opacity-100'}`}
                                                        title={item.isFeatured ? "Retirer de la une" : "Mettre à la une"}
                                                    >
                                                        <Star className={`w-5 h-5 ${item.isFeatured ? 'fill-current' : ''}`} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    disabled={loadingEditId === item.id}
                                                    className="p-3 text-gray-500 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-xl transition-all focus:opacity-100 disabled:cursor-wait"
                                                    title="Modifier"
                                                >
                                                    {loadingEditId === item.id
                                                        ? <Loader2 className="w-5 h-5 animate-spin text-neon-cyan" />
                                                        : <Pencil className="w-5 h-5" />
                                                    }
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget({ id: item.id, title: item.title })}
                                                    className="p-3 text-gray-500 hover:text-neon-red hover:bg-neon-red/10 rounded-xl transition-all"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
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
        </div>
    );
}
