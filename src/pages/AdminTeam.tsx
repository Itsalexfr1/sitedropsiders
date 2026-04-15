
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Save, ArrowLeft, Loader2, Instagram, Trash2 } from 'lucide-react';
import { Link, useBlocker } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Upload } from 'lucide-react';

interface TeamMember {
    id: number;
    name: string;
    role: string;
    image: string;
    socials: {
        instagram: string;
        tiktok: string;
    };
}

export function AdminTeam() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Track changes
    const initialDataLoaded = useRef(false);
    useEffect(() => {
        if (members.length > 0 && !initialDataLoaded.current) {
            initialDataLoaded.current = true;
            return;
        }
        if (initialDataLoaded.current) {
            setHasChanges(true);
        }
    }, [members]);



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
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        try {
            const response = await fetch('/api/team', {
                headers: getAuthHeaders(null)
            });
            if (response.ok) {
                const data = await response.json();
                setMembers(data);
            }
        } catch (err: any) {
            console.error('Failed to fetch team', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage('');
        try {
            const response = await fetch('/api/team/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ members })
            });

            if (response.ok) {
                setMessage('Mise à jour réussie !');
                setHasChanges(false);
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Erreur lors de la sauvegarde');
            }
        } catch (err: any) {
            setMessage('Erreur réseau');
        } finally {
            setIsSaving(false);
        }
    };

    const openAddModal = () => {
        setEditingMember({
            id: Date.now(),
            name: '',
            role: '',
            image: '/images/team/default.jpg',
            socials: {
                instagram: '',
                tiktok: ''
            }
        });
        setIsModalOpen(true);
    };

    const openEditModal = (member: TeamMember) => {
        setEditingMember({ ...member });
        setIsModalOpen(true);
    };

    const saveMemberFromModal = () => {
        if (!editingMember) return;

        const exists = members.find(m => m.id === editingMember.id);
        if (exists) {
            setMembers(members.map(m => m.id === editingMember.id ? editingMember : m));
        } else {
            setMembers([...members, editingMember]);
        }
        setIsModalOpen(false);
        setEditingMember(null);
    };

    const removeMember = async (id: number) => {
        setMembers(members.filter(m => m.id !== id));
    };

    return (
        <div className="min-h-screen bg-dark-bg py-32">
            <div className="max-w-full mx-auto px-4 md:px-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="flex items-center gap-6">
                        <Link to="/admin" className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white group">
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-neon-red/10 rounded-2xl">
                                    <Users className="w-8 h-8 text-neon-red" />
                                </div>
                                <h1 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter">
                                    Gestion <span className="text-neon-red">Team</span>
                                </h1>
                            </div>
                            <p className="text-gray-400">Gérez les membres qui apparaissent sur la page Équipe du site.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={openAddModal}
                            className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-white/10 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Ajouter
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-8 py-3 bg-neon-red text-white rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-neon-red/80 transition-all shadow-lg shadow-neon-red/20 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Enregistrer
                        </button>
                    </div>
                </div>

                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-8 p-4 rounded-xl text-center font-bold uppercase tracking-widest border ${message.includes('Erreur') ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}
                    >
                        {message}
                    </motion.div>
                )}

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-12 h-12 text-neon-red animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                        <AnimatePresence>
                            {members.map((member) => (
                                <motion.div
                                    key={member.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onClick={() => openEditModal(member)}
                                    className="bg-white/5 border border-white/10 rounded-[2rem] p-4 group hover:border-neon-red/30 transition-all cursor-pointer relative"
                                >
                                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-6 bg-black/40 border border-white/5">
                                        <img src={member.image} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-[8px] font-black text-neon-red uppercase tracking-[0.2em] mb-0.5">Membre</label>
                                        <h3 className="text-base font-display font-black text-white uppercase italic tracking-tighter line-clamp-1">{member.name}</h3>
                                        <p className="text-gray-400 text-[10px] font-medium uppercase tracking-widest line-clamp-1">{member.role}</p>

                                        <div className="flex gap-3 pt-4 border-t border-white/5 mt-4">
                                            {member.socials.instagram && <Instagram className="w-4 h-4 text-gray-500" />}
                                            {member.socials.tiktok && (
                                                <img
                                                    src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png"
                                                    alt="TikTok"
                                                    className="w-4 h-4 object-contain opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all invert"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteTarget(member);
                                        }}
                                        className="absolute top-4 right-4 p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Modal de Gestion Membre */}
            <AnimatePresence>
                {isModalOpen && editingMember && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-dark-bg border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 md:p-12">
                                <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter mb-8">
                                    {members.find(m => m.id === editingMember.id) ? 'Modifier' : 'Ajouter'} <span className="text-neon-red">Membre</span>
                                </h2>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-neon-red uppercase tracking-widest mb-2">Nom Complet</label>
                                                <input
                                                    type="text"
                                                    value={editingMember.name}
                                                    onChange={e => setEditingMember({ ...editingMember, name: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-neon-red transition-colors"
                                                    placeholder="Ex: Alex Dropsiders"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-neon-red uppercase tracking-widest mb-2">Rôle / Poste</label>
                                                <input
                                                    type="text"
                                                    value={editingMember.role}
                                                    onChange={e => setEditingMember({ ...editingMember, role: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-neon-red transition-colors"
                                                    placeholder="Ex: Photographe / Rédacteur"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-32 h-32 rounded-2xl overflow-hidden border border-white/10 bg-black">
                                                <img src={editingMember.image} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="w-full space-y-2">
                                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 text-center">Image du membre</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={editingMember.image}
                                                        onChange={e => setEditingMember({ ...editingMember, image: e.target.value })}
                                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-[10px] focus:outline-none focus:border-neon-red transition-colors"
                                                        placeholder="URL de l'image"
                                                    />
                                                    <button
                                                        onClick={() => setIsUploadModalOpen(true)}
                                                        className="p-2 bg-neon-red/10 border border-neon-red/30 rounded-xl text-neon-red hover:bg-neon-red hover:text-white transition-all"
                                                        title="Uploader une image"
                                                    >
                                                        <Upload className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                                <Instagram className="w-3 h-3 text-neon-red" /> Instagram
                                            </label>
                                            <input
                                                type="text"
                                                value={editingMember.socials.instagram}
                                                onChange={e => setEditingMember({ ...editingMember, socials: { ...editingMember.socials, instagram: e.target.value } })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-neon-red transition-colors"
                                                placeholder="@username"
                                            />
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                                <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" className="w-3 h-3 object-contain invert" /> TikTok
                                            </label>
                                            <input
                                                type="text"
                                                value={editingMember.socials.tiktok}
                                                onChange={e => setEditingMember({ ...editingMember, socials: { ...editingMember.socials, tiktok: e.target.value } })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-neon-red transition-colors"
                                                placeholder="@username"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            onClick={() => setIsModalOpen(false)}
                                            className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all text-sm"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={saveMemberFromModal}
                                            className="flex-[2] py-4 bg-neon-red text-white rounded-2xl font-black uppercase tracking-widest hover:bg-neon-red/80 transition-all text-sm shadow-xl shadow-neon-red/20"
                                        >
                                            Valider
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                accentColor="neon-red"
                onUploadSuccess={(urls) => {
                    const url = Array.isArray(urls) ? urls[0] : urls;
                    if (editingMember) {
                        setEditingMember({ ...editingMember, image: url });
                    }
                }}
            />

            <ConfirmationModal
                isOpen={blocker.state === "blocked"}
                message="Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter la page ?"
                onConfirm={() => blocker.proceed?.()}
                onCancel={() => blocker.reset?.()}
                accentColor="neon-red"
            />

            <ConfirmationModal
                isOpen={deleteTarget !== null}
                title="Supprimer le membre"
                message={`Êtes-vous sûr de vouloir supprimer ${deleteTarget?.name} de l'équipe ?`}
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                onConfirm={() => {
                    if (deleteTarget) removeMember(deleteTarget.id);
                    setDeleteTarget(null);
                }}
                onCancel={() => setDeleteTarget(null)}
                accentColor="neon-red"
            />
        </div>
    );
}
