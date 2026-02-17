import { useState, useEffect } from 'react';
import { Trash2, Search, Calendar, FileText, Video, Mic, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import newsData from '../data/news.json';
import recapsData from '../data/recaps.json';
import agendaData from '../data/agenda.json';

type ContentType = 'News' | 'Recaps' | 'Interviews' | 'Agenda';

export function AdminManage() {
    const [activeTab, setActiveTab] = useState<ContentType>('News');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteStatus, setDeleteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let data: any[] = [];

            if (activeTab === 'News' || activeTab === 'Interviews') {
                data = activeTab === 'News'
                    ? (newsData as any[]).filter((item: any) => item.category === 'News')
                    : (newsData as any[]).filter((item: any) => item.category === 'Interview');
            } else if (activeTab === 'Recaps') {
                data = recapsData as any[];
            } else if (activeTab === 'Agenda') {
                data = agendaData as any[];
            }

            setItems(data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number | string, title: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer "${title}" ?`)) return;

        setDeleteStatus('loading');
        try {
            const endpoint = activeTab === 'Interviews' ? '/api/news/delete' : `/api/${activeTab.toLowerCase()}/delete`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Password': localStorage.getItem('admin_password') || ''
                },
                body: JSON.stringify({ id })
            });

            if (response.ok) {
                setDeleteStatus('success');
                setMessage('Supprimé avec succès !');
                setItems(items.filter(item => item.id !== id));
                setTimeout(() => setDeleteStatus('idle'), 3000);
            } else {
                setDeleteStatus('error');
                setMessage('Erreur lors de la suppression');
            }
        } catch (error) {
            setDeleteStatus('error');
            setMessage('Erreur de connexion');
        }
    };

    const filteredItems = items.filter(item =>
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tabs: { type: ContentType; icon: any; color: string }[] = [
        { type: 'News', icon: <FileText className="w-4 h-4" />, color: 'text-neon-blue' },
        { type: 'Recaps', icon: <Video className="w-4 h-4" />, color: 'text-neon-red' },
        { type: 'Interviews', icon: <Mic className="w-4 h-4" />, color: 'text-neon-purple' },
        { type: 'Agenda', icon: <Calendar className="w-4 h-4" />, color: 'text-neon-yellow' },
    ];

    return (
        <div className="min-h-screen bg-dark-bg py-32 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <Link to="/admin" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
                            <ArrowLeft className="w-4 h-4" /> Retour au Dashboard
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter">
                            Gestion du <span className="text-neon-red">Contenu</span>
                        </h1>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-neon-red transition-colors"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-4 mb-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.type}
                            onClick={() => setActiveTab(tab.type)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-wider transition-all border ${activeTab === tab.type
                                ? `bg-white/10 border-white/20 ${tab.color} transform -translate-y-1`
                                : 'bg-white/5 border-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {tab.icon}
                            {tab.type}
                        </button>
                    ))}
                </div>

                {/* Status Messages */}
                <AnimatePresence>
                    {deleteStatus !== 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${deleteStatus === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                deleteStatus === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                    'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                }`}
                        >
                            {deleteStatus === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
                            {deleteStatus === 'success' && <CheckCircle2 className="w-5 h-5" />}
                            {deleteStatus === 'error' && <AlertCircle className="w-5 h-5" />}
                            <span className="font-bold">{message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content Table */}
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4 text-gray-500">
                            <Loader2 className="w-12 h-12 animate-spin text-neon-red" />
                            <p className="font-bold uppercase tracking-widest animate-pulse">Chargement...</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="p-20 text-center text-gray-500">
                            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="text-xl font-bold">Aucun contenu trouvé</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5">
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Image</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Titre</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/40 border border-white/10">
                                                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white line-clamp-1">{item.title}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-xs">{item.location || item.summary?.substring(0, 50) + '...'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400">
                                                {item.date}
                                            </td>
                                            <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleDelete(item.id, item.title)}
                                                    className="p-3 text-gray-500 hover:text-neon-red hover:bg-neon-red/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
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
            </div>
        </div>
    );
}
