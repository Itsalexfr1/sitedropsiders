import { useState, useEffect } from 'react';
import { Mail, Users, Calendar, Trash2, Download, Search, ArrowLeft, X } from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Link } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';
import { motion } from 'framer-motion';

import localSubscribersData from '../data/subscribers.json';

interface Subscriber {
    email: string;
    firstName: string | null;
    lastName: string | null;
    subscribedAt: string;
}

export function NewsletterAdmin() {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredSubscribers, setFilteredSubscribers] = useState<Subscriber[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleBulkDelete = async () => {
        setBulkDeleteConfirm(false);
        setIsDeleting(true);

        try {
            const response = await fetch('/api/unsubscribe', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ emails: selectedEmails })
            });

            if (response.ok) {
                const updated = subscribers.filter(sub => !selectedEmails.includes(sub.email));
                setSubscribers(updated);
                setSelectedEmails([]);
                alert(`${selectedEmails.length} abonnés supprimés`);
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(errorData.error || 'Erreur lors de la suppression groupée');
            }
        } catch (e: any) {
            console.error('Error during bulk delete', e);
            alert('Erreur réseau lors de la suppression groupée');
        }
        setIsDeleting(false);
    };

    useEffect(() => {
        loadSubscribers();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            const filtered = subscribers.filter(sub =>
                sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sub.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sub.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredSubscribers(filtered);
        } else {
            setFilteredSubscribers(subscribers);
        }
    }, [searchTerm, subscribers]);

    const loadSubscribers = async () => {
        try {
            const response = await fetch('/api/subscribers', {
                headers: getAuthHeaders(null)
            });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setSubscribers(data);
                    return;
                }
            }
        } catch (error: any) {
            console.error('Error loading subscribers:', error);
        }

        if (Array.isArray(localSubscribersData)) {
            setSubscribers(localSubscribersData as unknown as Subscriber[]);
        }
    };

    const deleteSubscriber = async (email: string) => {
        try {
            const response = await fetch('/api/unsubscribe', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                const updated = subscribers.filter(sub => sub.email !== email);
                setSubscribers(updated);
                setFilteredSubscribers(updated);
            } else {
                alert('Erreur lors de la désinscription');
            }
        } catch (error: any) {
            console.error('Error unsubscribing:', error);
            alert('Erreur réseau');
        }
    };

    const exportToCSV = () => {
        const headers = ['Email', 'Prénom', 'Nom', 'Date d\'inscription'];
        const rows = subscribers.map(sub => [
            sub.email,
            sub.firstName || '',
            sub.lastName || '',
            new Date(sub.subscribedAt).toLocaleDateString('fr-FR')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `subscribers_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="min-h-screen bg-dark-bg py-32">
            <div className="max-w-full mx-auto px-4 md:px-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
                    <div className="flex items-center gap-4 md:gap-6">
                        <Link to="/admin" className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all text-white group" title="Retour au tableau de bord">
                            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                Studio <span className="text-neon-red">News</span>
                            </h1>
                            <p className="text-gray-400 mt-2 text-sm md:text-base">Abonnés Newsletter</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-neon-red/10 border border-neon-red/30 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-neon-red" />
                            </div>
                            <div>
                                <div className="text-3xl font-display font-black text-white">{subscribers.length}</div>
                                <div className="text-sm text-gray-500 font-bold uppercase tracking-wide">Abonnés Total</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-neon-cyan/10 border border-neon-cyan/30 rounded-xl flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-neon-cyan" />
                            </div>
                            <div>
                                <div className="text-3xl font-display font-black text-white">
                                    {subscribers.filter(sub => {
                                        const subDate = new Date(sub.subscribedAt);
                                        const weekAgo = new Date();
                                        weekAgo.setDate(weekAgo.getDate() - 7);
                                        return subDate > weekAgo;
                                    }).length}
                                </div>
                                <div className="text-sm text-gray-500 font-bold uppercase tracking-wide">Cette Semaine</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-neon-purple/10 border border-neon-purple/30 rounded-xl flex items-center justify-center">
                                <Mail className="w-6 h-6 text-neon-purple" />
                            </div>
                            <div>
                                <div className="text-3xl font-display font-black text-white">
                                    {subscribers.filter(sub => sub.firstName && sub.lastName).length}
                                </div>
                                <div className="text-sm text-gray-500 font-bold uppercase tracking-wide">Profils Complets</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col md:flex-row gap-4 flex-1 w-full md:max-w-2xl">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un abonné..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan transition-all"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white z-10">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {selectedEmails.length > 0 && (
                                <button
                                    onClick={() => setBulkDeleteConfirm(true)}
                                    disabled={isDeleting}
                                    className="flex items-center gap-2 px-6 py-3 bg-neon-red text-white text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(255,0,51,0.3)] transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Supprimer ({selectedEmails.length})
                                </button>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <Link to="/newsletter/studio" className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-purple to-neon-red border border-neon-purple/30 rounded-xl text-white font-bold uppercase tracking-wide hover:shadow-[0_0_20px_rgba(200,0,255,0.3)] transition-all">
                                <Mail className="w-5 h-5" />
                                Créer Newsletter
                            </Link>
                            <button onClick={exportToCSV} disabled={subscribers.length === 0} className="flex items-center gap-2 px-6 py-3 bg-neon-red/10 border border-neon-red/30 rounded-xl text-neon-red font-bold uppercase tracking-wide hover:bg-neon-red/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                <Download className="w-5 h-5" />
                                Exporter CSV
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                    {filteredSubscribers.length === 0 ? (
                        <div className="p-12 text-center">
                            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">{searchTerm ? 'Aucun abonné trouvé' : 'Aucun abonné pour le moment'}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 text-left">
                                        <th className="p-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedEmails.length === filteredSubscribers.length && filteredSubscribers.length > 0}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedEmails(filteredSubscribers.map(s => s.email));
                                                    } else {
                                                        setSelectedEmails([]);
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-white/20 bg-black text-neon-red focus:ring-neon-red"
                                            />
                                        </th>
                                        <th className="p-4 text-xs font-black text-neon-red uppercase tracking-widest">Email</th>
                                        <th className="p-4 text-xs font-black text-neon-red uppercase tracking-widest">Prénom</th>
                                        <th className="p-4 text-xs font-black text-neon-red uppercase tracking-widest">Nom</th>
                                        <th className="p-4 text-xs font-black text-neon-red uppercase tracking-widest">Date d'inscription</th>
                                        <th className="p-4 text-xs font-black text-neon-red uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSubscribers.map((subscriber, index) => {
                                        const isSelected = selectedEmails.includes(subscriber.email);
                                        return (
                                            <motion.tr
                                                key={subscriber.email}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={`border-b border-white/5 hover:bg-white/5 transition-colors ${isSelected ? 'bg-white/5' : ''}`}
                                            >
                                                <td className="p-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            if (isSelected) {
                                                                setSelectedEmails(selectedEmails.filter(e => e !== subscriber.email));
                                                            } else {
                                                                setSelectedEmails([...selectedEmails, subscriber.email]);
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded border-white/20 bg-black text-neon-red focus:ring-neon-red"
                                                    />
                                                </td>
                                                <td className="p-4 text-white font-medium">{subscriber.email}</td>
                                                <td className="p-4 text-gray-400">{subscriber.firstName || '-'}</td>
                                                <td className="p-4 text-gray-400">{subscriber.lastName || '-'}</td>
                                                <td className="p-4 text-gray-400 text-sm">{formatDate(subscriber.subscribedAt)}</td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => setDeleteTarget(subscriber.email)} className="inline-flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 hover:bg-red-500/20 transition-all text-sm font-bold">
                                                        <Trash2 className="w-4 h-4" />
                                                        Supprimer
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="mt-8 p-6 bg-neon-cyan/5 border border-neon-cyan/20 rounded-2xl">
                    <div className="flex items-start gap-4">
                        <Mail className="w-6 h-6 text-neon-cyan flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="text-white font-bold mb-2">💡 Informations</h3>
                            <ul className="text-gray-400 text-sm space-y-1">
                                <li>• Les données sont stockées sécurisées sur GitHub</li>
                                <li>• Utilisez le bouton "Exporter CSV" pour sauvegarder vos abonnés</li>
                                <li>• Le système utilise Cloudflare Workers pour gérer les inscriptions</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={deleteTarget !== null}
                title="Supprimer l'abonné"
                message={`Êtes-vous sûr de vouloir supprimer l'abonné ${deleteTarget} ?`}
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                onConfirm={() => {
                    if (deleteTarget) deleteSubscriber(deleteTarget);
                    setDeleteTarget(null);
                }}
                onCancel={() => setDeleteTarget(null)}
                accentColor="neon-red"
            />

            <ConfirmationModal
                isOpen={bulkDeleteConfirm}
                title="Suppression groupée"
                message={`Êtes-vous sûr de vouloir supprimer ces ${selectedEmails.length} abonnés ?`}
                confirmLabel="Tout supprimer"
                cancelLabel="Annuler"
                onConfirm={handleBulkDelete}
                onCancel={() => setBulkDeleteConfirm(false)}
                accentColor="neon-red"
            />
        </div>
    );
}
