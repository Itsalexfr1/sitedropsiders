import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Plus, Save, ArrowLeft, Loader2, Instagram, Trash2, CheckCircle2, 
    Mail, Shield, Globe, Lock, Sparkles, Send, RefreshCw, Search, 
    UserCheck, ExternalLink, AlertTriangle, ChevronDown, ChevronUp, Check, X, Upload
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthHeaders, apiFetch, isSuperAdmin, hasPermission } from '../utils/auth';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { ConfirmationModal } from '../components/ConfirmationModal';

// --- Types & Presets ---

export interface UnifiedPerson {
    id: number;
    name: string;
    role: string;
    image: string;
    socials: {
        instagram: string;
        tiktok: string;
    };
    showOnPublicSite: boolean;
    hasAdminAccess: boolean;
    email: string;
    originalEmail?: string;
    preset: 'admin' | 'editorial' | 'moderator' | 'marketing' | 'custom';
    permissions: string[];
    verified?: boolean;
    created?: string;
}

export const ROLE_PRESETS = [
    {
        id: 'admin',
        label: 'Admin Total',
        badge: '👑 Admin Total',
        icon: Shield,
        color: 'from-neon-red to-orange-500',
        textColor: 'text-neon-red',
        borderColor: 'border-neon-red/40 hover:border-neon-red',
        activeBg: 'bg-neon-red/15 border-neon-red shadow-[0_0_25px_rgba(255,18,65,0.25)]',
        description: 'Accès illimité à tout le site, réglages système, membres et analytics.',
        permissions: ['all']
    },
    {
        id: 'editorial',
        label: 'Rédacteur / Contenu',
        badge: '✍️ Rédacteur',
        icon: Sparkles,
        color: 'from-neon-cyan to-blue-500',
        textColor: 'text-neon-cyan',
        borderColor: 'border-neon-cyan/40 hover:border-neon-cyan',
        activeBg: 'bg-neon-cyan/15 border-neon-cyan shadow-[0_0_25px_rgba(0,255,255,0.25)]',
        description: 'Peut créer et publier les News, Musique, Agenda, Recaps Festivals et Interviews.',
        permissions: ['news_focus', 'musique_releases', 'interviews_video', 'recaps_festivals', 'agenda_events', 'wiki_dropsiders']
    },
    {
        id: 'moderator',
        label: 'Modérateur & Live',
        badge: '🛡️ Modérateur',
        icon: UserCheck,
        color: 'from-neon-purple to-pink-500',
        textColor: 'text-neon-purple',
        borderColor: 'border-neon-purple/40 hover:border-neon-purple',
        activeBg: 'bg-neon-purple/15 border-neon-purple shadow-[0_0_25px_rgba(191,0,255,0.25)]',
        description: 'Gestion de la communauté, galerie photos, quizz et modération du Live Takeover.',
        permissions: ['community_mod', 'live']
    },
    {
        id: 'marketing',
        label: 'Marketing & Studio',
        badge: '🎨 Marketing',
        icon: Globe,
        color: 'from-neon-yellow to-amber-500',
        textColor: 'text-neon-yellow',
        borderColor: 'border-neon-yellow/40 hover:border-neon-yellow',
        activeBg: 'bg-neon-yellow/15 border-neon-yellow shadow-[0_0_25px_rgba(255,240,31,0.25)]',
        description: 'Création visuelle Social Studio, push notifications, newsletters, boutique et contact.',
        permissions: ['social_studio', 'push_newsletter', 'shop', 'messages_contact', 'stats_analytics']
    },
    {
        id: 'custom',
        label: 'Personnalisé (Avancé)',
        badge: '⚙️ Sur-mesure',
        icon: Lock,
        color: 'from-gray-400 to-gray-200',
        textColor: 'text-gray-300',
        borderColor: 'border-white/20 hover:border-white/40',
        activeBg: 'bg-white/10 border-white/40 shadow-[0_0_25px_rgba(255,255,255,0.1)]',
        description: 'Configuration détaillée module par module selon des besoins spécifiques.',
        permissions: []
    }
] as const;

export const PERMISSION_CATEGORIES = [
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

const SUGGESTED_ROLES = [
    'FONDATEUR & DJ',
    'RÉDACTEUR EN CHEF',
    'RÉDACTEUR',
    'RÉDACTRICE',
    'PHOTOGRAPHE',
    'VIDÉASTE',
    'COMMUNITY MANAGER',
    'GRAPHISTE'
];

function detectPreset(permissions: string[] = []): 'admin' | 'editorial' | 'moderator' | 'marketing' | 'custom' {
    if (permissions.includes('all')) return 'admin';
    if (!permissions.length) return 'custom';
    
    const set = new Set(permissions);
    const matchesAll = (list: readonly string[]) => list.length === set.size && list.every(p => set.has(p));

    const editorial = ROLE_PRESETS.find(p => p.id === 'editorial')!.permissions;
    if (matchesAll(editorial)) return 'editorial';

    const moderator = ROLE_PRESETS.find(p => p.id === 'moderator')!.permissions;
    if (matchesAll(moderator)) return 'moderator';

    const marketing = ROLE_PRESETS.find(p => p.id === 'marketing')!.permissions;
    if (matchesAll(marketing)) return 'marketing';

    return 'custom';
}

export function AdminTeam() {
    const navigate = useNavigate();

    // Permission check
    const storedPermissions = useMemo(() => JSON.parse(localStorage.getItem('admin_permissions') || '[]'), []);
    const adminUser = localStorage.getItem('admin_user');
    const isAlex = isSuperAdmin(adminUser);
    const canAccess = hasPermission(storedPermissions, 'accueil', isAlex) || hasPermission(storedPermissions, 'all', isAlex);

    useEffect(() => {
        if (!canAccess) {
            navigate('/admin');
        }
    }, [canAccess, navigate]);

    // State
    const [unifiedList, setUnifiedList] = useState<UnifiedPerson[]>([]);
    const [rawTeam, setRawTeam] = useState<any[]>([]);
    const [rawEditors, setRawEditors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Filters
    const [filterTab, setFilterTab] = useState<'all' | 'public' | 'admins'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeModalTab, setActiveModalTab] = useState<'public' | 'access'>('public');
    const [editingPerson, setEditingPerson] = useState<UnifiedPerson | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<UnifiedPerson | null>(null);
    const [sendingInviteEmail, setSendingInviteEmail] = useState<string | null>(null);
    const [showCustomPerms, setShowCustomPerms] = useState(false);

    // Community Search
    const [communitySearch, setCommunitySearch] = useState('');
    const [communityResults, setCommunityResults] = useState<any[]>([]);
    const [isSearchingCommunity, setIsSearchingCommunity] = useState(false);

    // Fetch both team and editors
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [teamRes, editorsRes] = await Promise.all([
                fetch('/api/team', { headers: getAuthHeaders(null) }),
                apiFetch('/api/editors', { headers: getAuthHeaders() })
            ]);

            let teamData: any[] = [];
            let editorsData: any[] = [];

            if (teamRes.ok) {
                teamData = await teamRes.json();
                setRawTeam(Array.isArray(teamData) ? teamData : []);
            }
            if (editorsRes.ok) {
                editorsData = await editorsRes.json();
                setRawEditors(Array.isArray(editorsData) ? editorsData : []);
            }

            mergeData(Array.isArray(teamData) ? teamData : [], Array.isArray(editorsData) ? editorsData : []);
        } catch (e) {
            console.error('Erreur chargement données', e);
            setStatusMessage({ text: 'Erreur lors du chargement des données', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Merge team.json & editors.json into single coherent list
    const mergeData = (team: any[], editors: any[]) => {
        const result: UnifiedPerson[] = [];
        const matchedEditorEmails = new Set<string>();

        // 1. Process team members
        team.forEach((tm) => {
            const teamEmail = (tm.email || '').toLowerCase().trim();
            // Find corresponding editor by email or name/pseudo
            const matchedEditor = editors.find(e => {
                const edEmail = (e.email || '').toLowerCase().trim();
                const edPseudo = (e.pseudo || e.username || e.name || '').toLowerCase().trim();
                const tmName = (tm.name || '').toLowerCase().trim();
                return (teamEmail && edEmail === teamEmail) || (tmName && edPseudo === tmName);
            });

            if (matchedEditor) {
                matchedEditorEmails.add((matchedEditor.email || '').toLowerCase().trim());
            }

            const perms = matchedEditor?.permissions || tm.permissions || [];
            const hasAdminAccess = !!matchedEditor || (perms.length > 0);

            result.push({
                id: tm.id || Date.now() + Math.random(),
                name: tm.name || matchedEditor?.pseudo || matchedEditor?.username || 'Membre',
                role: tm.role || matchedEditor?.role || 'Membre Team',
                image: tm.image || matchedEditor?.avatar || '/images/team/default.jpg',
                socials: tm.socials || { instagram: '', tiktok: '' },
                showOnPublicSite: true,
                hasAdminAccess: hasAdminAccess,
                email: matchedEditor?.email || tm.email || '',
                originalEmail: matchedEditor?.email,
                preset: detectPreset(perms),
                permissions: perms,
                verified: matchedEditor?.verified !== false,
                created: matchedEditor?.created
            });
        });

        // 2. Add editors who are NOT in team.json
        editors.forEach((ed) => {
            const cleanEmail = (ed.email || '').toLowerCase().trim();
            if (!matchedEditorEmails.has(cleanEmail)) {
                const perms = ed.permissions || [];
                result.push({
                    id: Date.now() + Math.floor(Math.random() * 100000),
                    name: ed.name || ed.pseudo || ed.username || 'Éditeur',
                    role: ed.role || 'Éditeur Back-Office',
                    image: ed.avatar || '/images/team/default.jpg',
                    socials: { instagram: '', tiktok: '' },
                    showOnPublicSite: false,
                    hasAdminAccess: true,
                    email: ed.email || '',
                    originalEmail: ed.email,
                    preset: detectPreset(perms),
                    permissions: perms,
                    verified: ed.verified !== false,
                    created: ed.created
                });
            }
        });

        setUnifiedList(result);
    };

    // Filtered list
    const filteredList = useMemo(() => {
        return unifiedList.filter((p) => {
            const matchesSearch = 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.email.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (filterTab === 'public') return p.showOnPublicSite;
            if (filterTab === 'admins') return p.hasAdminAccess;
            return true;
        });
    }, [unifiedList, filterTab, searchQuery]);

    // Community Search
    const searchCommunity = async (q: string) => {
        if (q.length < 2) {
            setCommunityResults([]);
            return;
        }
        setIsSearchingCommunity(true);
        try {
            const res = await apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setCommunityResults(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Community search failed', err);
        } finally {
            setIsSearchingCommunity(false);
        }
    };

    const importFromCommunity = (user: any) => {
        if (!editingPerson) return;
        setEditingPerson({
            ...editingPerson,
            name: user.username || user.pseudo || user.name || editingPerson.name,
            email: user.email || editingPerson.email,
            image: user.avatar || editingPerson.image,
            hasAdminAccess: true
        });
        setCommunitySearch('');
        setCommunityResults([]);
    };

    // Open Modal to Add
    const openAddModal = () => {
        setEditingPerson({
            id: Date.now(),
            name: '',
            role: 'RÉDACTEUR',
            image: '/images/team/default.jpg',
            socials: { instagram: '', tiktok: '' },
            showOnPublicSite: true,
            hasAdminAccess: true,
            email: '',
            preset: 'editorial',
            permissions: [...ROLE_PRESETS.find(p => p.id === 'editorial')!.permissions],
            verified: false
        });
        setActiveModalTab('public');
        setShowCustomPerms(false);
        setIsModalOpen(true);
    };

    // Open Modal to Edit
    const openEditModal = (person: UnifiedPerson) => {
        setEditingPerson({ ...person });
        setActiveModalTab('public');
        setShowCustomPerms(person.preset === 'custom');
        setIsModalOpen(true);
    };

    // Handle Preset Selection
    const selectPreset = (presetId: 'admin' | 'editorial' | 'moderator' | 'marketing' | 'custom') => {
        if (!editingPerson) return;
        const presetObj = ROLE_PRESETS.find(p => p.id === presetId);
        if (!presetObj) return;

        if (presetId === 'custom') {
            setShowCustomPerms(true);
            setEditingPerson({
                ...editingPerson,
                preset: 'custom'
            });
        } else {
            setShowCustomPerms(false);
            setEditingPerson({
                ...editingPerson,
                preset: presetId,
                permissions: [...presetObj.permissions]
            });
        }
    };

    // Resend Invite Email
    const handleSendInvite = async (person: UnifiedPerson, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!person.email) {
            setStatusMessage({ text: 'Aucune adresse e-mail renseignée pour envoyer l\'invitation.', type: 'error' });
            return;
        }

        setSendingInviteEmail(person.email);
        try {
            const res = await apiFetch('/api/editors/send-invite', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    email: person.email,
                    pseudo: person.name,
                    isInvite: true
                })
            });

            if (res.ok) {
                setStatusMessage({ text: `Invitation envoyée avec succès à ${person.email} !`, type: 'success' });
            } else {
                setStatusMessage({ text: 'Erreur lors de l\'envoi de l\'invitation.', type: 'error' });
            }
        } catch {
            setStatusMessage({ text: 'Erreur réseau lors de l\'envoi.', type: 'error' });
        } finally {
            setSendingInviteEmail(null);
            setTimeout(() => setStatusMessage(null), 4000);
        }
    };

    // Save Single Member from Modal
    const handleSavePerson = async () => {
        if (!editingPerson) return;
        if (!editingPerson.name.trim()) {
            setStatusMessage({ text: 'Le nom du membre est obligatoire.', type: 'error' });
            return;
        }
        if (editingPerson.hasAdminAccess && !editingPerson.email.trim()) {
            setStatusMessage({ text: 'Une adresse e-mail est obligatoire pour accorder des droits d\'accès.', type: 'error' });
            return;
        }

        setIsSaving(true);
        setStatusMessage(null);

        try {
            // Update unified list locally
            let updatedList = [...unifiedList];
            const existingIndex = updatedList.findIndex(p => p.id === editingPerson.id);
            if (existingIndex !== -1) {
                updatedList[existingIndex] = editingPerson;
            } else {
                updatedList.push(editingPerson);
            }

            // 1. Prepare & Save Team members (for /api/team/update)
            const publicMembers = updatedList
                .filter(p => p.showOnPublicSite)
                .map(p => ({
                    id: p.id,
                    name: p.name.trim(),
                    role: p.role.trim() || 'Membre Team',
                    image: p.image,
                    socials: p.socials
                }));

            await apiFetch('/api/team/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ members: publicMembers })
            });

            // 2. Synchronize Editor permissions (for /api/editors/update-permissions)
            if (editingPerson.hasAdminAccess && editingPerson.email.trim()) {
                const permsToSave = editingPerson.permissions.length > 0 ? editingPerson.permissions : ['all'];
                await apiFetch('/api/editors/update-permissions', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        email: editingPerson.email.trim(),
                        pseudo: editingPerson.name.trim(),
                        role: editingPerson.role.trim(),
                        permissions: permsToSave,
                        isInvite: !editingPerson.verified
                    })
                });

                // If email changed, delete previous editor record
                if (editingPerson.originalEmail && editingPerson.originalEmail.toLowerCase() !== editingPerson.email.toLowerCase()) {
                    await apiFetch('/api/editors/delete', {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ email: editingPerson.originalEmail })
                    });
                }
            } else if (!editingPerson.hasAdminAccess && editingPerson.originalEmail) {
                // Admin access was removed: delete editor from backend
                await apiFetch('/api/editors/delete', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ email: editingPerson.originalEmail })
                });
            }

            setIsModalOpen(false);
            setEditingPerson(null);
            setStatusMessage({ text: 'Membre et autorisations sauvegardés avec succès !', type: 'success' });
            await fetchData();
        } catch (e) {
            console.error('Erreur sauvegarde', e);
            setStatusMessage({ text: 'Erreur lors de la sauvegarde.', type: 'error' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setStatusMessage(null), 4000);
        }
    };

    // Delete Member
    const handleDeletePerson = async (person: UnifiedPerson) => {
        setIsSaving(true);
        try {
            // Remove from team
            const newPublicMembers = unifiedList
                .filter(p => p.id !== person.id && p.showOnPublicSite)
                .map(p => ({
                    id: p.id,
                    name: p.name,
                    role: p.role,
                    image: p.image,
                    socials: p.socials
                }));

            await apiFetch('/api/team/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ members: newPublicMembers })
            });

            // Remove from editors if has email
            if (person.email) {
                await apiFetch('/api/editors/delete', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ email: person.email })
                });
            }

            setStatusMessage({ text: `${person.name} a été supprimé avec succès.`, type: 'success' });
            await fetchData();
        } catch {
            setStatusMessage({ text: 'Erreur lors de la suppression.', type: 'error' });
        } finally {
            setIsSaving(false);
            setDeleteTarget(null);
            setTimeout(() => setStatusMessage(null), 4000);
        }
    };

    return (
        <div className="min-h-screen bg-[#070707] text-white pt-28 pb-36 px-4 md:px-12 selection:bg-neon-red/30">
            {/* Ambient Lighting */}
            <div className="fixed top-0 left-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="fixed top-20 right-1/4 w-96 h-96 bg-neon-red/10 rounded-full blur-[140px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header Navigation */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b border-white/5">
                    <div className="flex items-center gap-5">
                        <Link 
                            to="/admin" 
                            className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group hover:scale-105"
                            title="Retour au Dashboard Admin"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-400 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <span className="p-2.5 bg-gradient-to-br from-neon-purple/20 to-neon-red/20 border border-white/10 rounded-xl text-neon-red">
                                    <Users className="w-6 h-6" />
                                </span>
                                <h1 className="text-3xl md:text-5xl font-display font-black tracking-tight uppercase italic">
                                    Hub <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-red via-neon-purple to-neon-cyan">Team & Droits</span>
                                </h1>
                            </div>
                            <p className="text-gray-400 text-xs md:text-sm font-medium mt-1">
                                Gestion unifiée de l'équipe publique sur le site et des autorisations d'administration.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={fetchData}
                            disabled={isLoading}
                            className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all disabled:opacity-50"
                            title="Rafraîchir"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-neon-cyan' : ''}`} />
                        </button>
                        <button
                            onClick={openAddModal}
                            className="flex-1 md:flex-initial px-7 py-3.5 bg-gradient-to-r from-neon-red to-neon-purple text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,18,65,0.25)] flex items-center justify-center gap-3"
                        >
                            <Plus className="w-5 h-5" />
                            Ajouter un Membre
                        </button>
                    </div>
                </div>

                {/* Status message */}
                <AnimatePresence>
                    {statusMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className={`mb-8 p-4 rounded-2xl text-center text-xs font-black uppercase tracking-widest border flex items-center justify-center gap-3 ${
                                statusMessage.type === 'error'
                                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            }`}
                        >
                            {statusMessage.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            {statusMessage.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8">
                    {/* Filter Pills */}
                    <div className="flex items-center bg-black/40 border border-white/10 p-1.5 rounded-2xl gap-1">
                        {[
                            { id: 'all', label: 'Tous', count: unifiedList.length },
                            { id: 'public', label: 'Site Public', count: unifiedList.filter(p => p.showOnPublicSite).length },
                            { id: 'admins', label: 'Accès Admin', count: unifiedList.filter(p => p.hasAdminAccess).length }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setFilterTab(tab.id as any)}
                                className={`px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-2 ${
                                    filterTab === tab.id
                                        ? 'bg-white text-black shadow-lg shadow-white/10'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {tab.label}
                                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono ${
                                    filterTab === tab.id ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-400'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher par nom, rôle ou email..."
                            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-purple transition-all"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Loading state */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-28 gap-4">
                        <Loader2 className="w-10 h-10 text-neon-red animate-spin" />
                        <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">Chargement des membres et des droits...</p>
                    </div>
                ) : filteredList.length === 0 ? (
                    <div className="p-16 border border-dashed border-white/10 rounded-3xl text-center bg-white/[0.02]">
                        <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white uppercase italic mb-1">Aucun membre trouvé</h3>
                        <p className="text-gray-500 text-xs">Modifiez vos filtres ou ajoutez un nouveau membre.</p>
                    </div>
                ) : (
                    /* Cards Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {filteredList.map((person) => {
                                const presetInfo = ROLE_PRESETS.find(p => p.id === person.preset);

                                return (
                                    <motion.div
                                        key={person.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 rounded-[2.5rem] p-5 group hover:border-neon-purple/40 transition-all flex flex-col justify-between relative overflow-hidden shadow-xl"
                                    >
                                        <div>
                                            {/* Photo & Top Badges */}
                                            <div className="aspect-[4/4.2] rounded-[2rem] overflow-hidden mb-5 bg-black/60 border border-white/5 relative">
                                                <img
                                                    src={person.image}
                                                    alt={person.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-75" />

                                                {/* Status pill top-left */}
                                                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                                                    {person.showOnPublicSite ? (
                                                        <span className="px-2.5 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-lg">
                                                            <Globe className="w-3 h-3" /> Page /team
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-gray-400 text-[9px] font-black uppercase tracking-wider rounded-lg">
                                                            Non affiché
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Delete button top-right */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteTarget(person);
                                                    }}
                                                    className="absolute top-3 right-3 p-2.5 bg-black/60 backdrop-blur-md border border-white/10 hover:border-red-500/50 text-gray-400 hover:text-red-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Supprimer ce membre"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>

                                                {/* Public name & role overlay */}
                                                <div className="absolute inset-x-0 bottom-0 p-4">
                                                    <p className="text-[9px] font-black text-neon-purple uppercase tracking-[0.2em] mb-0.5">
                                                        {person.role || 'Membre'}
                                                    </p>
                                                    <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tight line-clamp-1">
                                                        {person.name}
                                                    </h3>
                                                </div>
                                            </div>

                                            {/* Admin Rights Status Card */}
                                            <div className="bg-black/40 border border-white/5 rounded-2xl p-3.5 mb-4 space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Shield className="w-3 h-3 text-gray-400" /> Droits Admin
                                                    </span>
                                                    {person.hasAdminAccess ? (
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                                            person.preset === 'admin' ? 'bg-neon-red/10 border-neon-red/30 text-neon-red' :
                                                            person.preset === 'editorial' ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan' :
                                                            person.preset === 'moderator' ? 'bg-neon-purple/10 border-neon-purple/30 text-neon-purple' :
                                                            person.preset === 'marketing' ? 'bg-neon-yellow/10 border-neon-yellow/30 text-neon-yellow' :
                                                            'bg-white/10 border-white/20 text-gray-300'
                                                        }`}>
                                                            {presetInfo?.badge || '👑 Admin'}
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 bg-white/5 text-gray-500 text-[8px] font-bold uppercase rounded-md">
                                                            Aucun accès
                                                        </span>
                                                    )}
                                                </div>

                                                {person.email && (
                                                    <div className="text-[10px] text-gray-400 font-mono truncate flex items-center gap-1.5">
                                                        <Mail className="w-3 h-3 text-gray-600 shrink-0" />
                                                        <span className="truncate">{person.email}</span>
                                                    </div>
                                                )}

                                                {person.hasAdminAccess && person.email && (
                                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                                        <span className="text-[9px] font-bold uppercase">
                                                            {person.verified !== false ? (
                                                                <span className="text-emerald-400 flex items-center gap-1">
                                                                    <CheckCircle2 className="w-3 h-3" /> Validé
                                                                </span>
                                                            ) : (
                                                                <span className="text-neon-cyan flex items-center gap-1">
                                                                    <Loader2 className="w-3 h-3 animate-spin" /> En attente
                                                                </span>
                                                            )}
                                                        </span>

                                                        {person.verified === false && (
                                                            <button
                                                                onClick={(e) => handleSendInvite(person, e)}
                                                                disabled={sendingInviteEmail === person.email}
                                                                className="text-[9px] text-neon-cyan hover:underline font-black uppercase tracking-widest flex items-center gap-1 disabled:opacity-50"
                                                            >
                                                                <Send className="w-2.5 h-2.5" />
                                                                {sendingInviteEmail === person.email ? 'Envoi...' : 'Renvoyer'}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Bar */}
                                        <div className="pt-2 flex items-center gap-2">
                                            <button
                                                onClick={() => openEditModal(person)}
                                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all hover:border-white/30"
                                            >
                                                Modifier la Fiche
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Modal de Modification / Création Unifié */}
            <AnimatePresence>
                {isModalOpen && editingPerson && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-3xl h-[85vh] max-h-[85vh] bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="px-8 py-6 border-b border-white/5 bg-gradient-to-r from-neon-purple/10 to-transparent flex items-center justify-between shrink-0">
                                <div>
                                    <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tight flex items-center gap-3">
                                        <Users className="w-6 h-6 text-neon-purple" />
                                        {unifiedList.some(p => p.id === editingPerson.id) ? 'Modifier le Membre' : 'Nouveau Membre'}
                                    </h2>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                        Configurez sa présence sur le site et ses droits d'administration en toute simplicité
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Dual Panel Tabs */}
                            <div className="px-8 pt-4 pb-2 border-b border-white/5 flex gap-3 shrink-0">
                                <button
                                    onClick={() => setActiveModalTab('public')}
                                    className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border ${
                                        activeModalTab === 'public'
                                            ? 'bg-neon-purple/15 border-neon-purple text-white shadow-[0_0_20px_rgba(191,0,255,0.2)]'
                                            : 'border-transparent text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    <Globe className="w-4 h-4 text-neon-purple" />
                                    1. Présence Publique (/team)
                                </button>
                                <button
                                    onClick={() => setActiveModalTab('access')}
                                    className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border ${
                                        activeModalTab === 'access'
                                            ? 'bg-neon-red/15 border-neon-red text-white shadow-[0_0_20px_rgba(255,18,65,0.2)]'
                                            : 'border-transparent text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    <Shield className="w-4 h-4 text-neon-red" />
                                    2. Accès & Droits Admin
                                    {editingPerson.hasAdminAccess && (
                                        <span className="w-2 h-2 rounded-full bg-neon-red animate-pulse" />
                                    )}
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 min-h-0 space-y-6">
                                {activeModalTab === 'public' ? (
                                    /* Tab 1: Public Presence */
                                    <div className="space-y-6">
                                        {/* Toggle: Show on public /team */}
                                        <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-white uppercase italic">Afficher sur la page Équipe (/team)</h4>
                                                <p className="text-[11px] text-gray-400 mt-0.5">Le profil apparaîtra publiquement dans la grille des membres.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setEditingPerson({ ...editingPerson, showOnPublicSite: !editingPerson.showOnPublicSite })}
                                                className={`w-14 h-8 rounded-full p-1 transition-all border ${
                                                    editingPerson.showOnPublicSite
                                                        ? 'bg-neon-purple border-neon-purple'
                                                        : 'bg-black/60 border-white/20'
                                                }`}
                                            >
                                                <div className={`w-6 h-6 rounded-full bg-white transition-transform ${
                                                    editingPerson.showOnPublicSite ? 'translate-x-6' : 'translate-x-0'
                                                }`} />
                                            </button>
                                        </div>

                                        {/* Quick Import from Community (only if new) */}
                                        {!unifiedList.some(p => p.id === editingPerson.id) && (
                                            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl relative">
                                                <label className="block text-[10px] font-black text-neon-purple uppercase tracking-widest mb-2">
                                                    🔍 Importer un utilisateur déjà inscrit (Google / Discord)
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={communitySearch}
                                                        onChange={(e) => {
                                                            setCommunitySearch(e.target.value);
                                                            searchCommunity(e.target.value);
                                                        }}
                                                        placeholder="Tapez un pseudo ou un email pour importer..."
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-purple transition-all"
                                                    />
                                                    {isSearchingCommunity && (
                                                        <Loader2 className="absolute right-3 top-3 w-4 h-4 text-neon-purple animate-spin" />
                                                    )}
                                                    {communityResults.length > 0 && (
                                                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl max-h-48 overflow-y-auto">
                                                            {communityResults.map((u, i) => (
                                                                <div
                                                                    key={i}
                                                                    onClick={() => importFromCommunity(u)}
                                                                    className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0"
                                                                >
                                                                    <img src={u.avatar || '/images/team/default.jpg'} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-white text-xs font-bold truncate">{u.username || u.pseudo}</p>
                                                                        <p className="text-gray-500 text-[10px] truncate">{u.email}</p>
                                                                    </div>
                                                                    <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-gray-400 uppercase font-mono">
                                                                        Importer
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Name & Photo Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="md:col-span-2 space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                                        Nom / Pseudo Public *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editingPerson.name}
                                                        onChange={(e) => setEditingPerson({ ...editingPerson, name: e.target.value })}
                                                        placeholder="Ex: ALEX, JULIEN, TIFFANY..."
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-neon-purple transition-all"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                                        Rôle affiché publiquement *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editingPerson.role}
                                                        onChange={(e) => setEditingPerson({ ...editingPerson, role: e.target.value })}
                                                        placeholder="Ex: FONDATEUR & DJ, PHOTOGRAPHE..."
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-neon-purple transition-all"
                                                    />

                                                    {/* Suggestions pills */}
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {SUGGESTED_ROLES.map((sr) => (
                                                            <button
                                                                key={sr}
                                                                type="button"
                                                                onClick={() => setEditingPerson({ ...editingPerson, role: sr })}
                                                                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[9px] font-mono text-gray-400 hover:text-white transition-all"
                                                            >
                                                                {sr}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Photo Preview & Upload */}
                                            <div className="flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/5 rounded-2xl gap-3">
                                                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/10 bg-black/60 relative group">
                                                    <img src={editingPerson.image} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsUploadModalOpen(true)}
                                                    className="w-full py-2 bg-neon-purple/10 hover:bg-neon-purple border border-neon-purple/30 text-neon-purple hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Upload className="w-3.5 h-3.5" /> Changer Photo
                                                </button>
                                            </div>
                                        </div>

                                        {/* Social Links */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            <div>
                                                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                                    <Instagram className="w-3.5 h-3.5 text-pink-500" /> Instagram
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editingPerson.socials.instagram}
                                                    onChange={(e) => setEditingPerson({
                                                        ...editingPerson,
                                                        socials: { ...editingPerson.socials, instagram: e.target.value }
                                                    })}
                                                    placeholder="https://instagram.com/pseudo ou @pseudo"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-neon-purple transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                                    <Globe className="w-3.5 h-3.5 text-neon-cyan" /> TikTok / Autre
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editingPerson.socials.tiktok}
                                                    onChange={(e) => setEditingPerson({
                                                        ...editingPerson,
                                                        socials: { ...editingPerson.socials, tiktok: e.target.value }
                                                    })}
                                                    placeholder="Lien TikTok ou profil"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-neon-purple transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Tab 2: Admin Access & Rights */
                                    <div className="space-y-6">
                                        {/* Toggle: Admin Access */}
                                        <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-white uppercase italic">Accès au panneau d'administration</h4>
                                                <p className="text-[11px] text-gray-400 mt-0.5">Permet de se connecter au back-office et de gérer les contenus selon son rôle.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setEditingPerson({ ...editingPerson, hasAdminAccess: !editingPerson.hasAdminAccess })}
                                                className={`w-14 h-8 rounded-full p-1 transition-all border ${
                                                    editingPerson.hasAdminAccess
                                                        ? 'bg-neon-red border-neon-red shadow-[0_0_15px_rgba(255,18,65,0.4)]'
                                                        : 'bg-black/60 border-white/20'
                                                }`}
                                            >
                                                <div className={`w-6 h-6 rounded-full bg-white transition-transform ${
                                                    editingPerson.hasAdminAccess ? 'translate-x-6' : 'translate-x-0'
                                                }`} />
                                            </button>
                                        </div>

                                        {editingPerson.hasAdminAccess && (
                                            <div className="space-y-6">
                                                {/* Email Input */}
                                                <div>
                                                    <label className="block text-[10px] font-black text-neon-red uppercase tracking-widest mb-1.5">
                                                        Email de Connexion (Google / Login) *
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={editingPerson.email}
                                                        onChange={(e) => setEditingPerson({ ...editingPerson, email: e.target.value.toLowerCase().trim() })}
                                                        placeholder="ex: prenom.nom@gmail.com"
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-neon-red transition-all"
                                                    />
                                                    <p className="text-[10px] text-gray-500 mt-1">
                                                        Cette adresse e-mail sera utilisée pour recevoir l'invitation et valider la connexion Google ou mot de passe.
                                                    </p>
                                                </div>

                                                {/* 1-Click Role Presets */}
                                                <div className="space-y-3">
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                        Choisissez un Profil de Droits (En 1 Clic)
                                                    </label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {ROLE_PRESETS.map((p) => {
                                                            const isSelected = editingPerson.preset === p.id;
                                                            return (
                                                                <button
                                                                    key={p.id}
                                                                    type="button"
                                                                    onClick={() => selectPreset(p.id as any)}
                                                                    className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                                                                        isSelected
                                                                            ? p.activeBg
                                                                            : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                                                                    }`}
                                                                >
                                                                    <div>
                                                                        <div className="flex items-center justify-between mb-1.5">
                                                                            <span className={`text-xs font-black uppercase tracking-wider ${p.textColor} flex items-center gap-2`}>
                                                                                <p.icon className="w-4 h-4" />
                                                                                {p.label}
                                                                            </span>
                                                                            {isSelected && (
                                                                                <CheckCircle2 className={`w-4 h-4 ${p.textColor}`} />
                                                                            )}
                                                                        </div>
                                                                        <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                                                                            {p.description}
                                                                        </p>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Detailed Permissions Accordion (if Custom or clicked) */}
                                                <div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCustomPerms(!showCustomPerms)}
                                                        className="text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
                                                    >
                                                        {showCustomPerms ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                        {showCustomPerms ? 'Masquer le détail des permissions' : 'Ajuster les permissions individuelles (Mode Avancé)'}
                                                    </button>

                                                    {showCustomPerms && (
                                                        <div className="pt-4 space-y-4">
                                                            {PERMISSION_CATEGORIES.map((cat) => (
                                                                <div key={cat.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                                                                    <span className="text-[9px] font-black text-neon-red uppercase tracking-widest block mb-2">
                                                                        {cat.label}
                                                                    </span>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                        {cat.permissions.map((perm) => {
                                                                            const isChecked = editingPerson.permissions.includes(perm.id);
                                                                            return (
                                                                                <label
                                                                                    key={perm.id}
                                                                                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                                                                                        isChecked
                                                                                            ? 'bg-neon-red/10 border-neon-red/30'
                                                                                            : 'bg-black/30 border-white/5 hover:border-white/10'
                                                                                    }`}
                                                                                >
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={isChecked}
                                                                                        onChange={(e) => {
                                                                                            const checked = e.target.checked;
                                                                                            let newPerms = [...editingPerson.permissions];
                                                                                            if (checked) {
                                                                                                newPerms.push(perm.id);
                                                                                            } else {
                                                                                                newPerms = newPerms.filter(p => p !== perm.id);
                                                                                            }
                                                                                            setEditingPerson({
                                                                                                ...editingPerson,
                                                                                                permissions: newPerms,
                                                                                                preset: detectPreset(newPerms)
                                                                                            });
                                                                                        }}
                                                                                        className="sr-only"
                                                                                    />
                                                                                    <div className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                                                                                        isChecked ? 'bg-neon-red border-neon-red' : 'border-white/20'
                                                                                    }`}>
                                                                                        {isChecked && <Check className="w-3 h-3 text-white" />}
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-[11px] font-bold text-white uppercase italic">{perm.label}</p>
                                                                                        <p className="text-[9px] text-gray-500 font-medium">{perm.description}</p>
                                                                                    </div>
                                                                                </label>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="px-8 py-5 border-t border-white/10 bg-[#080808] flex items-center justify-between shrink-0">                         <div className="px-8 py-5 border-t border-white/5 bg-black/40 flex items-center justify-between shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSavePerson}
                                    disabled={isSaving}
                                    className="px-8 py-3.5 bg-gradient-to-r from-neon-red to-neon-purple text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_25px_rgba(255,18,65,0.3)] flex items-center gap-2.5 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Enregistrer la Fiche
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Image Upload Modal */}
            <ImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                accentColor="neon-purple"
                onUploadSuccess={(urls) => {
                    const url = Array.isArray(urls) ? urls[0] : urls;
                    if (editingPerson) {
                        setEditingPerson({ ...editingPerson, image: url });
                    }
                    setIsUploadModalOpen(false);
                }}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteTarget !== null}
                title="Supprimer ce membre"
                message={`Voulez-vous vraiment supprimer ${deleteTarget?.name} ? Cette action retirera sa présence sur le site et supprimera ses accès d'administration.`}
                confirmLabel="Supprimer définitivement"
                cancelLabel="Annuler"
                onConfirm={() => {
                    if (deleteTarget) handleDeletePerson(deleteTarget);
                }}
                onCancel={() => setDeleteTarget(null)}
                accentColor="neon-red"
            />
        </div>
    );
}
