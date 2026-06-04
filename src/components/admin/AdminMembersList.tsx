import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, RefreshCw, Mail, Calendar, ExternalLink, ShieldCheck, User, Trash2, ShieldAlert, X } from 'lucide-react';
import { apiFetch, getAuthHeaders } from '../../utils/auth';

interface CommunityUser {
    id: string;
    username: string;
    email: string;
    avatar?: string | null;
    provider: string;
    lastSeen: string;
    mixStatus?: 'none' | 'pending' | 'approved';
    handle?: string;
    createdAt?: string;
    instagram?: string;
}

export function AdminMembersList({ onEditPermissions, authHeaders, filterStatus, onStatusChange }: { 
    onEditPermissions?: (email: string) => void;
    authHeaders?: any;
    filterStatus?: 'none' | 'pending' | 'approved';
    onStatusChange?: () => void;
}) {
        const [users, setUsers] = useState<(CommunityUser & { isSubscribedToNewsletter?: boolean })[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedUser, setSelectedUser] = useState<CommunityUser | null>(null);

    const fetchUsers = async () => {
        setRefreshing(true);
        try {
            const [resUsers, resSubs] = await Promise.all([
                apiFetch('/api/users/list', { headers: getAuthHeaders() }),
                apiFetch('/api/subscribers', { headers: getAuthHeaders() })
            ]);
            
            let fetchedUsers: CommunityUser[] = [];
            let fetchedSubs: any[] = [];
            
            if (resUsers.ok) {
                const data = await resUsers.json();
                fetchedUsers = Array.isArray(data) ? data : [];
            }
            if (resSubs.ok) {
                const data = await resSubs.json();
                fetchedSubs = Array.isArray(data) ? data : [];
            }
            
            const subEmails = new Set(fetchedSubs.map(s => String(s.email).toLowerCase().trim()));
            const usersWithSubInfo = fetchedUsers.map(u => ({
                ...u,
                isSubscribedToNewsletter: subEmails.has(u.email.toLowerCase().trim())
            }));
            
            console.log('[AdminMembersList] Fetched users:', usersWithSubInfo.length);
            setUsers(usersWithSubInfo);
        } catch (e) {
            console.error('Error fetching users:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !filterStatus || user.mixStatus === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleToggleNewsletter = async (user: CommunityUser & { isSubscribedToNewsletter?: boolean }) => {
        const isCurrentlySub = user.isSubscribedToNewsletter;
        const endpoint = isCurrentlySub ? '/api/unsubscribe' : '/api/subscribe';
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ email: user.email })
            });
            if (res.ok) {
                setUsers(prev => prev.map(u =>
                    u.email === user.email
                        ? { ...u, isSubscribedToNewsletter: !isCurrentlySub }
                        : u
                ));
            } else {
                const err = await res.json().catch(() => ({}));
                console.error('[Newsletter] Error:', err);
            }
        } catch (e) {
            console.error('[Newsletter] Fetch error:', e);
        }
    };

    const handleApproveMix = async (email: string, status: 'approved' | 'none') => {
        try {
            const res = await fetch('/api/admin/users/approve-mix', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ email, status })
            });
            if (res.ok) {
                setUsers(prev => prev.map(u => u.email === email ? { ...u, mixStatus: status } : u));
                if (onStatusChange) onStatusChange();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const getProviderBadge = (provider: string) => {
        switch(provider) {
            case 'google': return 'bg-white/10 text-white border-white/20';
            case 'discord': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-neon-red/10 text-neon-red border-neon-red/20';
        }
    };

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <RefreshCw className="w-10 h-10 text-neon-red animate-spin" />
                <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Chargement des membres...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-display font-black text-white uppercase italic leading-none flex items-center gap-4">
                        <Users className="w-8 h-8 text-neon-red" />
                        Membres du <span className="text-neon-red">Site</span>
                        {users.length > 0 && <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-400 font-bold">{users.length}</span>}
                    </h2>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2 italic">
                        Liste des comptes créés via Google, Discord ou Mail sur Dropsiders.fr
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white text-xs outline-none focus:border-neon-red transition-all"
                        />
                    </div>
                    <button 
                        onClick={fetchUsers}
                        disabled={refreshing}
                        className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                    >
                        <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-md">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-500">
                            <th className="py-5 px-6">Membre</th>
                            <th className="py-5 px-6">Email (Profil)</th>
                            <th className="py-5 px-6 text-center">Connexion</th>
                            <th className="py-5 px-6">Dernière Visite</th>
                            <th className="py-5 px-6 text-center">Upload MP3</th>
                            <th className="py-5 px-6 text-center">Newsletter</th>
                            <th className="py-5 px-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                        <AnimatePresence>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user, idx) => (
                                    <motion.tr 
                                        key={user.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="hover:bg-white/[0.02] transition-colors group"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 overflow-hidden shrink-0 relative">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-neon-red/10">
                                                            <User className="w-5 h-5 text-neon-red" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-black text-white uppercase italic tracking-tight">{user.username}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono">
                                            <button 
                                                onClick={() => setSelectedUser(user)}
                                                className="text-neon-cyan hover:text-white hover:underline transition-colors text-left font-black"
                                                title="Voir le profil complet"
                                            >
                                                {user.email}
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest ${getProviderBadge(user.provider)}`}>
                                                {user.provider}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-gray-400 font-bold uppercase tracking-wider">
                                            {new Date(user.lastSeen).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={user.mixStatus === 'approved'} 
                                                onChange={() => handleApproveMix(user.email, user.mixStatus === 'approved' ? 'none' : 'approved')}
                                                className="w-4 h-4 rounded border-white/20 bg-white/5 text-neon-cyan focus:ring-0 focus:ring-offset-0 cursor-pointer accent-neon-cyan"
                                                title={user.mixStatus === 'approved' ? "Désactiver l'upload de MP3" : "Activer l'upload de MP3"}
                                            />
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <input
                                                type="checkbox"
                                                checked={!!user.isSubscribedToNewsletter}
                                                onChange={() => handleToggleNewsletter(user)}
                                                className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-400 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-green-400"
                                                title={user.isSubscribedToNewsletter ? "Désinscrire de la newsletter" : "Inscrire à la newsletter"}
                                            />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    className="p-2 bg-neon-red/10 hover:bg-neon-red border border-neon-red/20 hover:border-neon-red rounded-lg text-neon-red hover:text-white transition-all shadow-xl"
                                                    title="Donner/Modifier les droits Admin"
                                                    onClick={() => onEditPermissions && onEditPermissions(user.email)}
                                                >
                                                    <ShieldAlert className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                                        <p className="text-gray-500 text-xs font-black uppercase tracking-widest">
                                            {users.length === 0 ? "Aucun utilisateur trouvé dans la base de données" : "Aucun membre ne correspond à votre recherche"}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Profile Details Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedUser(null)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden"
                        >
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon-cyan/5 blur-[100px] rounded-full pointer-events-none" />

                            <button 
                                onClick={() => setSelectedUser(null)}
                                className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-all z-20"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                <div className="w-24 h-24 rounded-3xl bg-black/40 border border-white/10 overflow-hidden relative">
                                    {selectedUser.avatar ? (
                                        <img src={selectedUser.avatar} alt={selectedUser.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-neon-red/10">
                                            <User className="w-10 h-10 text-neon-red" />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-1">
                                        {selectedUser.username}
                                    </h3>
                                    {selectedUser.handle && (
                                        <p className="text-xs text-neon-cyan font-black tracking-widest uppercase">
                                            @{selectedUser.handle}
                                        </p>
                                    )}
                                </div>

                                <div className="w-full grid grid-cols-2 gap-4 bg-white/5 border border-white/10 p-5 rounded-3xl text-left">
                                    <div className="min-w-0">
                                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Email</span>
                                        <p className="text-xs text-white font-mono font-bold truncate mt-0.5">{selectedUser.email}</p>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Inscription</span>
                                        <p className="text-xs text-white font-bold uppercase tracking-wider mt-0.5">
                                            {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Inconnue'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Connexion</span>
                                        <p className="text-xs text-white font-bold uppercase tracking-wider mt-0.5">{selectedUser.provider}</p>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Dernière Visite</span>
                                        <p className="text-xs text-white font-bold uppercase tracking-wider mt-0.5">
                                            {new Date(selectedUser.lastSeen).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                <div className="w-full grid grid-cols-3 gap-3">
                                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center">
                                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">XP Joueur</span>
                                        <span className="text-lg font-black text-white">{(selectedUser as any).xp || 0}</span>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center">
                                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Drops</span>
                                        <span className="text-lg font-black text-neon-cyan">{(selectedUser as any).drops || 0}</span>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center">
                                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Cartes</span>
                                        <span className="text-lg font-black text-neon-purple">{((selectedUser as any).collectedCards || []).length}</span>
                                    </div>
                                </div>

                                <div className="w-full space-y-2 text-left">
                                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Mix Studio / MP3</span>
                                        <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${
                                            selectedUser.mixStatus === 'approved' 
                                                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                                        }`}>
                                            {selectedUser.mixStatus === 'approved' ? 'Activé' : 'Désactivé'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Newsletter</span>
                                        <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${
                                            (selectedUser as any).isSubscribedToNewsletter 
                                                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                                        }`}>
                                            {(selectedUser as any).isSubscribedToNewsletter ? 'Abonné' : 'Non inscrit'}
                                        </span>
                                    </div>
                                    {selectedUser.instagram && (
                                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Instagram</span>
                                            <a 
                                                href={`https://instagram.com/${selectedUser.instagram.replace('@', '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] font-black text-neon-cyan uppercase hover:underline"
                                            >
                                                @{selectedUser.instagram.replace('@', '')}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center gap-4">
                <ShieldAlert className="w-4 h-4 text-neon-red shrink-0" />
                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest italic">
                    Cliquez sur l'icône <span className="text-neon-red">bouclier</span> pour ouvrir la gestion des droits d'un membre dans l'onglet Éditeurs.
                </p>
            </div>
        </div>
    );
}
