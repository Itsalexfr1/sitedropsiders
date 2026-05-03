import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Trash2, Shield, User, Lock, ArrowLeft, Loader2, Save, X, Pencil, RefreshCw, CheckCircle2, AlertCircle, Search, Mail, ExternalLink } from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getAuthHeaders, apiFetch, isSuperAdmin } from '../utils/auth';
import { StarField } from '../components/ui/StarField';

interface Editor {
    email: string;
    username: string;
    name: string;
    pseudo?: string;
    avatar?: string;
    provider?: string;
    created: string;
    permissions?: string[];
    verified?: boolean;
    role?: string;
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

const ALL_PERMISSIONS_FLAT = PERMISSION_CATEGORIES.flatMap(cat => cat.permissions);

const EDITOR_COLORS = [
    '#FF1241', // neon-red
    '#00FFFF', // neon-cyan
    '#BF00FF', // neon-purple
    '#39FF14', // neon-green
    '#FFF01F', // neon-yellow
    '#FF5E00', // neon-orange
    '#00BFFF', // neon-blue
    '#FF0099', // neon-red
    '#00FF88', // neon-mint
    '#7B61FF', // neon-indigo
];

const getEditorColor = (username: string) => {
    const normalized = username.toLowerCase();
    if (normalized === 'alex') return '#FF1241';
    if (normalized === 'tanguy') return '#00FFFF';
    if (normalized === 'julien') return '#BF00FF';
    const hash = normalized.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    return EDITOR_COLORS[Math.abs(hash) % EDITOR_COLORS.length];
};

const getAuthorTextStyle = (username: string) => {
    if (username.toLowerCase() === 'alex') {
        return {
            background: 'linear-gradient(to right, #FF1241, #FF0099, #BF00FF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '950'
        };
    }
    return { color: getEditorColor(username) };
};

export function AdminEditors() {
    const navigate = useNavigate();
    const [editors, setEditors] = useState<Editor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'editors' | 'community'>('editors');
    const [communityUsers, setCommunityUsers] = useState<any[]>([]);
    const [isCommunityLoading, setIsCommunityLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const initialEmail = searchParams.get('email') || '';

    const [addMethod, setAddMethod] = useState<'social' | 'email'>('social');
    const [newEditor, setNewEditor] = useState<{ email: string; pseudo: string; permissions: string[]; role?: string }>({
        email: initialEmail || '',
        pseudo: '',
        permissions: [],
        role: ''
    });

    // Update email if initialEmail changes
    useEffect(() => {
        if (initialEmail) {
            setNewEditor(prev => ({ ...prev, email: initialEmail }));
        }
    }, [initialEmail]);

    const [isEditing, setIsEditing] = useState(false);
    const [foundUser, setFoundUser] = useState<any | null>(null);
    const [isSearchingUser, setIsSearchingUser] = useState(false);

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
        fetchCommunityUsers();
    }, [navigate]);

    const fetchCommunityUsers = async () => {
        setIsCommunityLoading(true);
        try {
            const res = await apiFetch('/api/users/list', {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setCommunityUsers(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error('Failed to fetch community users', e);
        } finally {
            setIsCommunityLoading(false);
        }
    };

    const fetchEditors = async () => {
        try {
            const response = await apiFetch('/api/editors', {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setEditors(Array.isArray(data) ? data : []);
            }
        } catch (err: any) {
            console.error('Failed to fetch editors', err);
        } finally {
            setIsLoading(false);
        }
    };

    const searchUser = async (email: string) => {
        if (!email || !email.includes('@')) return;
        setIsSearchingUser(true);
        setFoundUser(null);
        try {
            // Search in community users
            const res = await apiFetch(`/api/users/search?q=${encodeURIComponent(email)}`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    setFoundUser(data[0]);
                }
            }
        } catch (e) {
            console.error('Failed to search user', e);
        } finally {
            setIsSearchingUser(false);
        }
    };

    const handleSavePermissions = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const response = await apiFetch('/api/editors/update-permissions', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    email: newEditor.email,
                    pseudo: newEditor.pseudo,
                    role: newEditor.role,
                    permissions: newEditor.permissions,
                    isInvite: addMethod === 'email' && !isEditing
                })
            });

            if (response.ok) {
                // Send invite email (now handles both cases in backend)
                if (!isEditing) {
                    await apiFetch('/api/editors/send-invite', {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ 
                            email: newEditor.email, 
                            pseudo: newEditor.pseudo,
                            isInvite: addMethod === 'email'
                        })
                    });
                }
                await fetchEditors();
                setShowAddModal(false);
                setNewEditor({ email: '', pseudo: '', permissions: [], role: '' });
                setFoundUser(null);
                showNotification(
                    isEditing ? 'Permissions mises à jour !' : 
                    addMethod === 'email' ? `Invitation envoyée à ${newEditor.email} !` : `Permissions activées pour ${newEditor.email} !`,
                    'success'
                );
            } else {
                const data = await response.json();
                showNotification(data.error || 'Erreur lors de la mise à jour', 'error');
            }
        } catch (err: any) {
            showNotification('Erreur réseau', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteEditor = async (email: string) => {
        try {
            const response = await apiFetch('/api/editors/delete', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                setEditors(editors.filter(e => e.email !== email));
                showNotification('Permissions révoquées avec succès', 'success');
            } else {
                showNotification('Erreur lors de la révocation', 'error');
            }
        } catch (err: any) {
            showNotification('Erreur réseau', 'error');
        }
    };

    const handleEditClick = (editor: Editor) => {
        setIsEditing(true);
        setAddMethod('social');
        setNewEditor({
            email: editor.email,
            pseudo: editor.pseudo || editor.username || '',
            permissions: editor.permissions || [],
            role: (editor as any).role || ''
        });
        setFoundUser(editor);
        setShowAddModal(true);
    };

    const handleOpenAddModal = () => {
        setIsEditing(false);
        setAddMethod('social');
        setNewEditor({ email: '', pseudo: '', permissions: [], role: '' });
        setFoundUser(null);
        setShowAddModal(true);
    };

    const filteredEditors = useMemo(() => {
        return editors.filter(e => 
            e.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            e.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [editors, searchTerm]);

    const filteredCommunity = useMemo(() => {
        return communityUsers.filter(u => 
            u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.pseudo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [communityUsers, searchTerm]);

    return (
        <div className="min-h-screen bg-dark-bg py-32 relative overflow-hidden">
            <StarField />
            <div className="max-w-7xl mx-auto px-4 md:px-12 relative z-10">
                <Link to="/admin" className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors group uppercase text-[10px] font-black tracking-widest">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Retour au tableau de bord
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-neon-red/10 rounded-2xl border border-neon-red/20">
                                <Shield className="w-8 h-8 text-neon-red" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter">
                                GESTION DES <span className="text-neon-red">ACCÈS</span>
                            </h1>
                        </div>
                        <p className="text-gray-400 font-medium uppercase text-[10px] tracking-widest">Assignez des permissions aux comptes Google, Discord ou Dropsiders.</p>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Rechercher un éditeur..."
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-neon-red focus:bg-white/10 transition-all"
                            />
                        </div>
                        <button
                            onClick={handleOpenAddModal}
                            className="px-6 py-3 bg-neon-red text-white rounded-xl font-black uppercase tracking-wider flex items-center gap-2 hover:bg-neon-red/80 transition-all shadow-lg shadow-neon-red/20 active:scale-95 whitespace-nowrap text-xs"
                        >
                            <UserPlus className="w-5 h-5" />
                            Assigner Permissions
                        </button>
                    </div>
                </div>

                <div className="flex gap-8 mb-8 border-b border-white/5">
                    <button 
                        onClick={() => setActiveTab('editors')}
                        className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'editors' ? 'text-neon-red' : 'text-gray-500 hover:text-white'}`}
                    >
                        Staff & Éditeurs
                        {activeTab === 'editors' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-neon-red shadow-[0_0_15px_rgba(255,18,65,0.4)]" />}
                    </button>
                    <button 
                        onClick={() => setActiveTab('community')}
                        className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'community' ? 'text-neon-red' : 'text-gray-500 hover:text-white'}`}
                    >
                        Communauté (Google/Discord)
                        {activeTab === 'community' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-neon-red shadow-[0_0_15px_rgba(255,18,65,0.4)]" />}
                    </button>
                </div>

                {isLoading || (activeTab === 'community' && isCommunityLoading) ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <Loader2 className="w-12 h-12 text-neon-red animate-spin" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] animate-pulse">Chargement des données...</span>
                    </div>
                ) : activeTab === 'editors' ? (
                    <div className="grid gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredEditors.map((editor) => {
                                const editorColor = getEditorColor(editor.username || editor.email);
                                return (
                                    <motion.div
                                        key={editor.email}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between group hover:bg-white/[0.08] transition-all relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: editorColor }} />
                                        
                                        <div className="flex items-center gap-8 w-full md:w-auto">
                                            <div className="relative">
                                                <div
                                                    className="w-20 h-20 rounded-2xl flex items-center justify-center border-2 overflow-hidden shadow-2xl transition-all group-hover:scale-105"
                                                    style={{
                                                        backgroundColor: `${editorColor}10`,
                                                        borderColor: `${editorColor}30`,
                                                        boxShadow: `0 0 30px ${editorColor}20`
                                                    }}
                                                >
                                                    {editor.avatar ? (
                                                        <img src={editor.avatar} alt={editor.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-10 h-10" style={{ color: editorColor }} />
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 p-2 bg-dark-bg border border-white/10 rounded-lg shadow-xl">
                                                    {editor.provider === 'google' && <img src="https://www.google.com/favicon.ico" className="w-3 h-3" />}
                                                    {editor.provider === 'discord' && <img src="https://discord.com/favicon.ico" className="w-3 h-3" />}
                                                    {!editor.provider && <Shield className="w-3 h-3 text-neon-red" />}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-4 mb-2">
                                                    <h3 className="text-2xl font-display font-black uppercase italic tracking-tight" style={getAuthorTextStyle(editor.username || 'Utilisateur')}>
                                                        {editor.name || editor.username || 'Utilisateur'}
                                                    </h3>
                                                    {editor.permissions?.includes('all') ? (
                                                        <span className="px-3 py-1 bg-neon-red text-white text-[8px] font-black rounded-lg uppercase tracking-widest shadow-[0_0_15px_rgba(255,18,65,0.4)]">
                                                            Master Admin
                                                        </span>
                                                    ) : editor.role && (
                                                        <span className="px-3 py-1 bg-white/10 text-white text-[8px] font-black rounded-lg uppercase tracking-widest border border-white/10">
                                                            {editor.role}
                                                        </span>
                                                    )}
                                                    {editor.verified === false && (
                                                        <span className="px-3 py-1 bg-neon-cyan/20 text-neon-cyan text-[8px] font-black rounded-lg uppercase tracking-widest border border-neon-cyan/30 animate-pulse">
                                                            En attente de validation
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                                    <div className="flex items-center gap-2 text-white/60">
                                                        <Mail className="w-3 h-3" />
                                                        {editor.email}
                                                    </div>
                                                    {(editor.pseudo || editor.username) && (
                                                        <>
                                                            <div className="w-1 h-1 bg-white/10 rounded-full" />
                                                            <div className="flex items-center gap-2 text-white/60">
                                                                @{editor.pseudo || editor.username}
                                                            </div>
                                                        </>
                                                    )}
                                                    <div className="w-1 h-1 bg-white/10 rounded-full" />
                                                    <span>Accès : {(editor.permissions?.length || 0)} modules</span>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-2 mt-6">
                                                    {editor.permissions?.map(p => {
                                                        const perm = ALL_PERMISSIONS_FLAT.find(ap => ap.id === p);
                                                        return (
                                                            <span key={p} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[9px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                                                                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: editorColor }} />
                                                                {perm?.label || p}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-8 md:mt-0 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            <button
                                                onClick={() => handleEditClick(editor)}
                                                className="p-4 bg-white/5 border border-white/10 text-gray-400 rounded-2xl hover:bg-white/10 hover:text-white transition-all"
                                                title="Modifier les permissions"
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(editor.email)}
                                                className="p-4 bg-white/5 border border-white/10 text-gray-400 rounded-2xl hover:bg-neon-red/10 hover:border-neon-red/30 hover:text-neon-red transition-all"
                                                title="Révoquer tous les accès"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {filteredEditors.length === 0 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Users className="w-10 h-10 text-gray-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white uppercase italic mb-2">Aucun éditeur trouvé</h3>
                                    <p className="text-gray-500 uppercase text-[10px] font-bold tracking-[0.2em] max-w-xs mx-auto">Utilisez le bouton "Assigner Permissions" pour ajouter des membres à l'équipe.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredCommunity.map((user) => {
                                const isStaff = editors.some(e => e.email === user.email);
                                return (
                                    <motion.div
                                        key={user.email}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-between group hover:bg-white/[0.08] transition-all"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-black">
                                                {user.avatar ? (
                                                    <img src={user.avatar} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-white/5"><Shield className="w-6 h-6 text-gray-600" /></div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-lg font-display font-black text-white italic uppercase tracking-tight">{user.username || user.pseudo || user.name || 'Utilisateur'}</h3>
                                                    {isStaff && (
                                                        <span className="px-2 py-0.5 bg-neon-red/10 border border-neon-red/30 text-neon-red text-[7px] font-black rounded uppercase tracking-widest">Staff</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-2">{user.email}</p>
                                                <div className="flex items-center gap-3">
                                                    {user.provider === 'google' && <div className="flex items-center gap-1 text-[8px] text-gray-400 font-bold uppercase"><img src="https://www.google.com/favicon.ico" className="w-2 h-2" /> Google</div>}
                                                    {user.provider === 'discord' && <div className="flex items-center gap-1 text-[8px] text-gray-400 font-bold uppercase"><img src="https://discord.com/favicon.ico" className="w-2 h-2" /> Discord</div>}
                                                    <span className="text-[8px] text-gray-600 font-bold uppercase">Inscrit le {user.created ? new Date(user.created).toLocaleDateString() : '???'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {!isStaff && (
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setAddMethod('social');
                                                    setNewEditor({ email: user.email, pseudo: user.username || user.pseudo || '', permissions: [], role: '' });
                                                    setFoundUser(user);
                                                    setShowAddModal(true);
                                                    setIsEditing(false);
                                                }}
                                                className="px-4 py-2 border border-white/10 rounded-xl text-[10px] text-white font-black uppercase tracking-widest hover:bg-neon-red hover:border-neon-red transition-all"
                                            >
                                                Promouvoir Staff
                                            </button>
                                        )}
                                    </motion.div>
                                );
                            })}
                            
                            {filteredCommunity.length === 0 && (
                                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                                    Aucun utilisateur trouvé dans la base communautaire.
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
                
                <div className="mt-12 p-8 bg-neon-red/5 border border-neon-red/10 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-neon-red/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-7 h-7 text-neon-red" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white uppercase italic mb-1">Système de sécurité unifié</h4>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] leading-relaxed">
                                Tous les anciens comptes éditeurs matériels ont été révoqués. <br/>
                                L'accès se fait désormais exclusivement via l'authentification sociale sécurisée.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Assignation */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-3xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-white to-neon-red" />

                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">
                                        {isEditing ? 'Modifier les' : 'Assigner de nouvelles'} <span className="text-neon-red">Permissions</span>
                                    </h2>
                                    <p className="text-gray-500 font-bold uppercase text-[9px] tracking-[0.3em] mt-1">Liez un compte communautaire à un rôle staff</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-500 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSavePermissions} className="space-y-8 overflow-y-auto pr-4 custom-scrollbar">
                                <div className="space-y-6">
                                    <div className="mb-8">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">Méthode de création</label>
                                        <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
                                            <button 
                                                type="button"
                                                onClick={() => setAddMethod('social')}
                                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${addMethod === 'social' ? 'bg-neon-red text-white shadow-lg shadow-neon-red/20' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Lier Compte Social
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setAddMethod('email')}
                                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${addMethod === 'email' ? 'bg-neon-red text-white shadow-lg shadow-neon-red/20' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Invitation Email
                                            </button>
                                        </div>
                                    </div>

                                    {addMethod === 'social' ? (
                                        <div>
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Email du compte Google/Discord</label>
                                            <div className="flex gap-3">
                                                <div className="relative flex-1">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                                                    <input
                                                        required
                                                        type="email"
                                                        disabled={isEditing}
                                                        value={newEditor.email}
                                                        onChange={e => {
                                                            setNewEditor({ ...newEditor, email: e.target.value.toLowerCase() });
                                                            setFoundUser(null);
                                                        }}
                                                        className={`w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-sm font-bold focus:outline-none focus:border-neon-red transition-all ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        placeholder="jean.dupont@gmail.com"
                                                    />
                                                </div>
                                                {!isEditing && (
                                                    <button
                                                        type="button"
                                                        onClick={() => searchUser(newEditor.email)}
                                                        disabled={isSearchingUser || !newEditor.email.includes('@')}
                                                        className="px-6 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/10 disabled:opacity-30 transition-all"
                                                    >
                                                        {isSearchingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Vérifier'}
                                                    </button>
                                                )}
                                            </div>
                                            <p className="mt-2 text-[9px] text-gray-500 uppercase tracking-widest italic">
                                                L'utilisateur doit déjà avoir un compte communautaire pour être lié directement.
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Email de l'invité</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                                                <input
                                                    required
                                                    type="email"
                                                    value={newEditor.email}
                                                    onChange={e => setNewEditor({ ...newEditor, email: e.target.value.toLowerCase() })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-sm font-bold focus:outline-none focus:border-neon-red transition-all"
                                                    placeholder="nouveau.redacteur@exemple.com"
                                                />
                                            </div>
                                            <p className="mt-2 text-[9px] text-neon-cyan uppercase tracking-widest font-black">
                                                Un email de validation sera envoyé à cette adresse pour activer le compte.
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">
                                                Prénom / Pseudo <span className="text-neon-red">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={newEditor.pseudo}
                                                onChange={e => setNewEditor({ ...newEditor, pseudo: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white text-sm font-bold focus:outline-none focus:border-neon-red transition-all"
                                                placeholder="Ex: Jean D."
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">
                                                Rôle affiché
                                            </label>
                                            <input
                                                type="text"
                                                value={newEditor.role || ''}
                                                onChange={e => setNewEditor({ ...newEditor, role: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white text-sm font-bold focus:outline-none focus:border-neon-red transition-all"
                                                placeholder="Ex: Rédacteur Musique"
                                            />
                                        </div>
                                    </div>


                                    {foundUser && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-neon-red/10 border border-neon-red/20 rounded-3xl flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-xl border-2 border-neon-red/30 overflow-hidden shadow-lg">
                                                {foundUser.avatar ? (
                                                    <img src={foundUser.avatar} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-neon-red/20 flex items-center justify-center"><User className="w-6 h-6 text-neon-red" /></div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-white font-black uppercase text-sm italic">{foundUser.username || foundUser.name}</span>
                                                    <span className="px-2 py-0.5 bg-neon-red text-white text-[8px] font-black rounded uppercase tracking-widest">Compte Trouvé</span>
                                                </div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">{foundUser.email}</p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {!foundUser && !isEditing && newEditor.email.includes('@') && !isSearchingUser && (
                                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center gap-4">
                                            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                                            <p className="text-[10px] text-yellow-500/80 font-bold uppercase tracking-widest leading-tight">
                                                Attention : Aucun compte utilisateur trouvé avec cet email. <br/>
                                                L'utilisateur devra s'être connecté au moins une fois sur le site via Google/Discord.
                                            </p>
                                        </div>
                                    )}

                                    <div className="pt-6 border-t border-white/5">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 block">Sélection des Modules Accessibles</label>
                                        <div className="space-y-10">
                                            {PERMISSION_CATEGORIES.map((category) => (
                                                <div key={category.id} className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-neon-red uppercase tracking-widest leading-none whitespace-nowrap">{category.label}</span>
                                                        <div className="h-px w-full bg-white/10" />
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {category.permissions.map((perm) => (
                                                            <label key={perm.id} className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all group border ${newEditor.permissions.includes(perm.id) ? 'bg-neon-red/10 border-neon-red/30' : 'bg-white/5 border-white/5'}`}>
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
                                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${newEditor.permissions.includes(perm.id) ? 'bg-neon-red border-neon-red shadow-[0_0_15px_rgba(255,18,65,0.4)]' : 'border-white/10'}`}>
                                                                        {newEditor.permissions.includes(perm.id) && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 className="w-3.5 h-3.5 text-white" /></motion.div>}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-black text-white uppercase italic tracking-tight mb-1">{perm.label}</p>
                                                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest leading-tight font-medium">{perm.description}</p>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    disabled={isSaving || !newEditor.email}
                                    type="submit"
                                    className="w-full py-5 bg-neon-red text-white rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-neon-red/80 disabled:opacity-50 transition-all shadow-2xl shadow-neon-red/30 active:scale-95 text-xs"
                                >
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {isEditing ? 'Mettre à jour les accès' : 'Confirmer l\'accès Staff'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={deleteTarget !== null}
                title="Révoquer l'accès"
                message={`Êtes-vous sûr de vouloir révoquer tous les accès de ${deleteTarget} ? L'utilisateur redeviendra un simple membre.`}
                confirmLabel="Révoquer"
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
                        <div className={`flex items-center gap-4 px-8 py-5 rounded-[2.5rem] shadow-2xl backdrop-blur-3xl border ${toast.type === 'success'
                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-500'
                            }`}>
                            <div className={`p-2 rounded-full ${toast.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap text-white">
                                {toast.message}
                            </span>
                            <button
                                onClick={() => setToast(prev => ({ ...prev, show: false }))}
                                className="ml-4 p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 opacity-50 hover:opacity-100 text-white" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const Users = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);
