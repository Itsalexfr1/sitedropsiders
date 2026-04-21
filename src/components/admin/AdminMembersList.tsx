import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, RefreshCw, Mail, Calendar, ExternalLink, ShieldCheck, User, Trash2, ShieldAlert } from 'lucide-react';

interface CommunityUser {
    id: string;
    username: string;
    email: string;
    avatar?: string | null;
    provider: string;
    lastSeen: string;
}

export function AdminMembersList({ onEditPermissions }: { onEditPermissions?: (email: string) => void }) {
    const [users, setUsers] = useState<CommunityUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const fetchUsers = async () => {
        setRefreshing(true);
        try {
            const res = await fetch('/api/users/list');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
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

    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user, idx) => (
                            <motion.div
                                key={user.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white/5 border border-white/10 rounded-[2rem] p-6 group hover:border-white/20 transition-all relative overflow-hidden"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 overflow-hidden shrink-0 relative">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-neon-red/10">
                                                <User className="w-6 h-6 text-neon-red" />
                                            </div>
                                        )}
                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg border-2 border-black flex items-center justify-center p-0.5 ${getProviderBadge(user.provider)}`}>
                                            <ShieldCheck className="w-full h-full" />
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-black text-white uppercase italic tracking-tight leading-none mb-1 truncate">
                                            {user.username}
                                        </h3>
                                        <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1.5 truncate">
                                            <Mail className="w-3 h-3" /> {user.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Dernière visite</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3 text-neon-cyan" />
                                            {new Date(user.lastSeen).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                        </span>
                                    </div>
                                    <span className={`px-2 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${getProviderBadge(user.provider)}`}>
                                        {user.provider}
                                    </span>
                                </div>

                                {/* Quick Actions */}
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    {/* Link for future profile editing or stats */}
                                    <button 
                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-neon-red hover:text-white transition-all shadow-xl"
                                        title="Donner/Modifier les accès admin"
                                        onClick={() => onEditPermissions && onEditPermissions(user.email)}
                                    >
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                            <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Aucun membre ne correspond à votre recherche</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
            
            <div className="p-6 bg-neon-cyan/5 border border-neon-cyan/10 rounded-3xl">
                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center italic">
                    Astuce : Pour donner des accès Admin ou Éditeur, rendez-vous dans l'onglet **TEAM** et ajoutez l'email du membre dans la section "Gestion Éditeurs".
                </p>
            </div>
        </div>
    );
}
