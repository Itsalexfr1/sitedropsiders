
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Trash2, Shield, User, Lock, ArrowLeft, Loader2, Save, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';

interface Editor {
    username: string;
    name: string;
    created: string;
}

export function AdminEditors() {
    const navigate = useNavigate();
    const [editors, setEditors] = useState<Editor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [error, setError] = useState('');

    // New Editor State
    const [newEditor, setNewEditor] = useState({
        username: '',
        password: '',
        name: ''
    });

    useEffect(() => {
        const user = localStorage.getItem('admin_user');
        if (user !== 'contact@dropsiders.fr' && user !== 'alex') {
            navigate('/admin');
            return;
        }
        fetchEditors();
    }, [navigate]);

    const fetchEditors = async () => {
        try {
            const response = await fetch('/api/editors', {
                headers: getAuthHeaders(null)
            });
            if (response.ok) {
                const data = await response.json();
                setEditors(data);
            }
        } catch (err) {
            console.error('Failed to fetch editors', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddEditor = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        try {
            const response = await fetch('/api/editors/create', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newEditor)
            });

            if (response.ok) {
                await fetchEditors();
                setShowAddModal(false);
                setNewEditor({ username: '', password: '', name: '' });
            } else {
                const data = await response.json();
                setError(data.error || 'Erreur lors de la création');
            }
        } catch (err) {
            setError('Erreur réseau');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteEditor = async (targetUsername: string) => {
        if (!confirm(`Supprimer l'éditeur ${targetUsername} ?`)) return;

        try {
            const response = await fetch('/api/editors/delete', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ username: targetUsername })
            });

            if (response.ok) {
                setEditors(editors.filter(e => e.username !== targetUsername));
            }
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg py-32 px-6">
            <div className="max-w-4xl mx-auto">
                <Link to="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Retour au tableau de bord
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-neon-red/10 rounded-2xl">
                                <Shield className="w-8 h-8 text-neon-red" />
                            </div>
                            <h1 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter">
                                Gestion des <span className="text-neon-red">Éditeurs</span>
                            </h1>
                        </div>
                        <p className="text-gray-400">Gérez les accès de votre équipe de rédaction.</p>
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-3 bg-neon-red text-white rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-neon-red/80 transition-all shadow-lg shadow-neon-red/20 active:scale-95"
                    >
                        <UserPlus className="w-5 h-5" />
                        Nouvel Éditeur
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-12 h-12 text-neon-red animate-spin" />
                    </div>
                ) : (
                    <div className="grid gap-4">
                        <AnimatePresence mode="popLayout">
                            {editors.map((editor) => (
                                <motion.div
                                    key={editor.username}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between group hover:bg-white/[0.08] transition-all"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-full bg-neon-red/10 flex items-center justify-center border border-neon-red/20">
                                            <User className="w-6 h-6 text-neon-red" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white uppercase italic">
                                                {editor.name || editor.username}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm">
                                                <span className="text-neon-red font-mono opacity-70">@{editor.username}</span>
                                                <span className="w-1 h-1 bg-white/20 rounded-full" />
                                                <span className="text-gray-500">Ajouté le {new Date(editor.created).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDeleteEditor(editor.username)}
                                        className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            ))}

                            {editors.length === 0 && (
                                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                    <p className="text-gray-500 italic">Aucun éditeur configuré pour le moment.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Modal Ajout */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-dark-bg border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-display font-black text-white uppercase italic">Ajouter un éditeur</h2>
                                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleAddEditor} className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Nom Complet</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                                            <input
                                                required
                                                type="text"
                                                value={newEditor.name}
                                                onChange={e => setNewEditor({ ...newEditor, name: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-neon-red"
                                                placeholder="Ex: Jean Dupont"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Nom d'utilisateur</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold">@</span>
                                            <input
                                                required
                                                type="text"
                                                value={newEditor.username}
                                                onChange={e => setNewEditor({ ...newEditor, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-neon-red"
                                                placeholder="utilisateur"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Mot de passe</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                                            <input
                                                required
                                                type="password"
                                                value={newEditor.password}
                                                onChange={e => setNewEditor({ ...newEditor, password: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-neon-red"
                                                placeholder="********"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {error && <p className="text-red-500 text-sm font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}

                                <button
                                    disabled={isSaving}
                                    type="submit"
                                    className="w-full py-4 bg-neon-red text-white rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neon-red/80 disabled:opacity-50 transition-all shadow-lg shadow-neon-red/20"
                                >
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Créer le compte
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
