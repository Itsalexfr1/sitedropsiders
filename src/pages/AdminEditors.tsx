
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Trash2, Shield, User, Lock, ArrowLeft, Loader2, Save, X, Pencil, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthHeaders, apiFetch, isSuperAdmin } from '../utils/auth';
import { StarField } from '../components/ui/StarField';

interface Editor {
    username: string;
    password?: string;
    name: string;
    created: string;
    permissions?: string[];
}

const PERMISSION_CATEGORIES = [
    {
        id: 'admin',
        label: 'Rôle & Accès Maître',
        permissions: [
            { id: 'all', label: 'Administrateur (Tout)', description: 'Accès illimité à toutes les fonctionnalités et paramètres du site.' }
        ]
    },
    {
        id: 'editorial',
        label: 'Rédaction & Contenu',
        permissions: [
            { id: 'news_focus', label: 'News & Focus', description: 'Créer, modifier et supprimer les pages News et Focus.' },
            { id: 'musique_releases', label: 'Musique & Sorties', description: 'Gérer les articles sur les sorties musicales.' },
            { id: 'interviews_video', label: 'Interviews', description: 'Gérer les interviews écrites et vidéos.' },
            { id: 'recaps_festivals', label: 'Recaps Festivals', description: 'Gérer les reportages festivals et événements.' },
            { id: 'agenda_events', label: 'Agenda Événements', description: 'Gérer le calendrier complet des événements.' },
            { id: 'wiki_dropsiders', label: 'Wiki Dropsiders', description: 'Modifier et mettre à jour la base de données des DJs.' }
        ]
    },
    {
        id: 'animation',
        label: 'Communauté & Live',
        permissions: [
            { id: 'community_mod', label: 'Communauté & Modération', description: 'Gérer la galerie photos, les quiz, et modérer le contenu utilisateur.' },
            { id: 'live', label: 'Live Takeover', description: 'Accès complet aux réglages du Live, y compris la modération du chat.' }
        ]
    },
    {
        id: 'marketing',
        label: 'Marketing & Business',
        permissions: [
            { id: 'social_studio', label: 'Social Studio', description: 'Générer des visuels pour les réseaux sociaux.' },
            { id: 'push_newsletter', label: 'Push & Newsletter', description: 'Envoyer des notifications push et gérer les campagnes de mails.' },
            { id: 'shop', label: 'Boutique', description: 'Gérer la section merchandising et les commandes.' },
            { id: 'messages_contact', label: 'Messagerie & Contact', description: 'Répondre aux messages reçus via le formulaire de contact.' },
            { id: 'stats_analytics', label: 'Statistiques', description: 'Voir les chiffres d\'audience et d\'analyse du site.' },
            { id: 'home_layout', label: 'Page d\'Accueil', description: 'Modifier la disposition et les sélections de la page d\'accueil.' }
        ]
    }
];

// Helper to get flat list for labels
const ALL_PERMISSIONS_FLAT = PERMISSION_CATEGORIES.flatMap(cat => cat.permissions);

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
];

const getEditorColor = (username: string) => {
    const normalized = username.toLowerCase();
    // Manual overrides for core team to provide unique colors
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

// Special style for Alex (Gradient)
const getAuthorTextStyle = (username: string) => {
    const color = getEditorColor(username);
    if (username.toLowerCase() === 'alex') {
        return {
            background: 'linear-gradient(to right, #FF1241, #FF0099, #BF00FF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '950'
        };
    }
    return { color };
};

export function AdminEditors() {
    const navigate = useNavigate();
    const [editors, setEditors] = useState<Editor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [error, setError] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    // New Editor State
    const [newEditor, setNewEditor] = useState({
        username: '',
        password: '',
        name: '',
        permissions: [] as string[]
    });
    const [isEditing, setIsEditing] = useState(false);

    // Notification State
    const [toast, setToast] = useState<{
        show: boolean;
        message: string;
        type: 'success' | 'error';
    }>({ show: false, message: '', type: 'success' });

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
    };

    useEffect(() => {
        const user = localStorage.getItem('admin_user');
        if (!isSuperAdmin(user)) {
            navigate('/admin');
            return;
        }
        fetchEditors();
    }, [navigate]);

    const fetchEditors = async () => {
        try {
            const response = await apiFetch('/api/editors', {
                headers: getAuthHeaders(null)
            });
            if (response.ok) {
                const data = await response.json();
                setEditors(data);
            }
        } catch (err: any) {
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
            const endpoint = isEditing ? '/api/editors/update' : '/api/editors/create';
            const response = await apiFetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newEditor)
            });

            if (response.ok) {
                await fetchEditors();
                setShowAddModal(false);
                setNewEditor({ username: '', password: '', name: '', permissions: [] });
                showNotification(isEditing ? 'Compte mis à jour !' : 'Compte créé avec succès !', 'success');
            } else {
                const data = await response.json();
                showNotification(data.error || 'Erreur lors de la création', 'error');
            }
        } catch (err: any) {
            showNotification('Erreur réseau', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteEditor = async (targetUsername: string) => {

        try {
            const response = await apiFetch('/api/editors/delete', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ username: targetUsername })
            });

            if (response.ok) {
                setEditors(editors.filter(e => e.username !== targetUsername));
                showNotification('Éditeur supprimé avec succès', 'success');
            } else {
                showNotification('Erreur lors de la suppression', 'error');
            }
        } catch (err: any) {
            showNotification('Erreur réseau', 'error');
        }
    };

    const handleRevokeEditorSession = async (targetUsername: string) => {
        if (!confirm(`Voulez-vous vraiment révoquer toutes les sessions actives de @${targetUsername} ? L'utilisateur devra se reconnecter.`)) return;
        try {
            const res = await apiFetch('/api/auth/revoke-all', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ targetUsername })
            });
            if (res.ok) {
                showNotification(`Sessions de @${targetUsername} révoquées avec succès !`, 'success');
            } else {
                const errorData = await res.json().catch(() => ({}));
                showNotification(errorData.error || 'Erreur lors de la révocation', 'error');
            }
        } catch (err: any) {
            showNotification('Erreur réseau lors de la révocation', 'error');
        }
    };

    const handleEditClick = (editor: Editor) => {
        setIsEditing(true);
        setNewEditor({
            username: editor.username,
            password: '', // On ne pré-remplit pas le mot de passe pour la sécurité
            name: editor.name,
            permissions: editor.permissions || []
        });
        setShowAddModal(true);
    };

    const handleOpenAddModal = () => {
        setIsEditing(false);
        setNewEditor({ username: '', password: '', name: '', permissions: [] });
        setShowAddModal(true);
    };

    return (
        <div className="min-h-screen bg-dark-bg py-32 relative overflow-hidden">
            <StarField />
            <div className="max-w-full mx-auto px-4 md:px-12 relative z-10">
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
                        onClick={handleOpenAddModal}
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
                            {editors.map((editor) => {
                                const editorColor = getEditorColor(editor.username);
                                return (
                                    <motion.div
                                        key={editor.username}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between group hover:bg-white/[0.08] transition-all"
                                        style={{ borderLeft: `4px solid ${editorColor}` }}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div
                                                className="w-12 h-12 rounded-full flex items-center justify-center border transition-all"
                                                style={{
                                                    backgroundColor: `${editorColor}10`,
                                                    borderColor: `${editorColor}40`,
                                                    boxShadow: `0 0 15px ${editorColor}20`
                                                }}
                                            >
                                                <User className="w-6 h-6" style={{ color: editorColor }} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-bold uppercase italic" style={getAuthorTextStyle(editor.username)}>
                                                        {editor.name || editor.username}
                                                    </h3>
                                                    {editor.permissions?.includes('all') && (
                                                        <span
                                                            className="px-2 py-0.5 text-[8px] font-black rounded uppercase tracking-widest animate-pulse border"
                                                            style={{
                                                                backgroundColor: `${editorColor}20`,
                                                                borderColor: `${editorColor}40`,
                                                                color: editorColor
                                                            }}
                                                        >
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm">
                                                    <span className="font-mono opacity-80" style={{ color: editorColor }}>@{editor.username}</span>
                                                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                                                    <span className="text-gray-500">Ajouté le {new Date(editor.created).toLocaleDateString()}</span>
                                                </div>
                                                {editor.permissions && editor.permissions.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {editor.permissions.map(p => (
                                                            <span key={p} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                                {ALL_PERMISSIONS_FLAT.find(ap => ap.id === p)?.label || p}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {localStorage.getItem('admin_user') === 'alex' && editor.password && (
                                                    <div className="mt-4 p-3 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between group/pw">
                                                        <div className="flex items-center gap-3">
                                                            <Lock className="w-3 h-3 text-gray-500" />
                                                            <span className="text-xs font-mono text-gray-400">
                                                                MDP: <span className="text-white bg-white/10 px-2 py-0.5 rounded">{editor.password}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <motion.button
                                                whileHover={{ color: editorColor, backgroundColor: `${editorColor}10` }}
                                                onClick={() => handleEditClick(editor)}
                                                className="p-3 text-gray-400 rounded-xl transition-all"
                                                title="Modifier"
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ color: editorColor, backgroundColor: `${editorColor}10` }}
                                                onClick={() => handleRevokeEditorSession(editor.username)}
                                                className="p-3 text-gray-400 rounded-xl transition-all"
                                                title="Révoquer les sessions actives"
                                            >
                                                <RefreshCw className="w-5 h-5" />
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ color: '#ef4444', backgroundColor: '#ef444410' }}
                                                onClick={() => setDeleteTarget(editor.username)}
                                                className="p-3 text-gray-400 rounded-xl transition-all"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                );
                            })}

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
                            className="bg-dark-bg border border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-display font-black text-white uppercase italic">
                                    {isEditing ? 'Modifier l\'éditeur' : 'Ajouter un éditeur'}
                                </h2>
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
                                                disabled={isEditing}
                                                type="text"
                                                value={newEditor.username}
                                                onChange={e => setNewEditor({ ...newEditor, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                                                className={`w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-neon-red ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                placeholder="utilisateur"
                                            />
                                        </div>
                                        {isEditing && <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">L'identifiant ne peut pas être modifié</p>}
                                    </div>
                                    {isEditing && (
                                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl mb-6">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">Modification Sécurisée</label>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Mot de passe actuel</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                                        <input
                                                            type="text"
                                                            readOnly
                                                            value={editors.find(e => e.username === newEditor.username)?.password || ''}
                                                            className="w-full bg-black/20 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-400 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-bold text-neon-red uppercase tracking-widest mb-2 block">Nouveau mot de passe</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-red/50" />
                                                        <input
                                                            type="text"
                                                            value={newEditor.password}
                                                            onChange={e => setNewEditor({ ...newEditor, password: e.target.value })}
                                                            className="w-full bg-neon-red/5 border border-neon-red/20 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-neon-red"
                                                            placeholder="Nouveau mot de passe"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!isEditing && (
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
                                    )}
                                    <div className="pt-4 border-t border-white/5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 block">Permissions par Catégorie</label>
                                        <div className="space-y-8">
                                            {PERMISSION_CATEGORIES.map((category) => (
                                                <div key={category.id} className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-px flex-1 bg-white/10" />
                                                        <span className="text-[10px] font-black text-neon-red uppercase tracking-widest leading-none">{category.label}</span>
                                                        <div className="h-px flex-1 bg-white/10" />
                                                    </div>
                                                    <div className="grid gap-3">
                                                        {category.permissions.map((perm) => (
                                                            <label key={perm.id} className="flex items-start gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all group">
                                                                <div className="mt-1">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={newEditor.permissions.includes(perm.id)}
                                                                        onChange={(e) => {
                                                                            const checked = e.target.checked;
                                                                            setNewEditor(prev => ({
                                                                                ...prev,
                                                                                permissions: checked
                                                                                    ? [...prev.permissions, perm.id]
                                                                                    : prev.permissions.filter(p => p !== perm.id)
                                                                            }));
                                                                        }}
                                                                        className="sr-only"
                                                                    />
                                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${newEditor.permissions.includes(perm.id) ? 'bg-neon-red border-neon-red shadow-[0_0_10px_rgba(255,24,24,0.3)]' : 'border-white/10'}`}>
                                                                        {newEditor.permissions.includes(perm.id) && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Save className="w-3.5 h-3.5 text-white" /></motion.div>}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-white uppercase italic tracking-tight">{perm.label}</p>
                                                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-tight mt-1">{perm.description}</p>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
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
                                    {isEditing ? 'Mettre à jour' : 'Créer le compte'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={deleteTarget !== null}
                title="Supprimer l'éditeur"
                message={`Êtes-vous sûr de vouloir supprimer l'éditeur ${deleteTarget} ?`}
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                onConfirm={() => {
                    if (deleteTarget) handleDeleteEditor(deleteTarget);
                    setDeleteTarget(null);
                }}
                onCancel={() => setDeleteTarget(null)}
                accentColor="neon-red"
            />

            <AnimatePresence mode="wait">
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                        exit={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }}
                        className="fixed bottom-12 left-1/2 z-[200]"
                    >
                        <div className={`flex items-center gap-4 px-6 py-4 rounded-[2rem] shadow-2xl backdrop-blur-3xl border ${toast.type === 'success'
                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-500'
                            }`}>
                            <div className={`p-2 rounded-full ${toast.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap text-white">
                                {toast.message}
                            </span>
                            <button
                                onClick={() => setToast(prev => ({ ...prev, show: false }))}
                                className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 opacity-50 hover:opacity-100 text-white" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
