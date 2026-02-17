import { useState, useEffect } from 'react';
import { Mail, Users, Calendar, Trash2, Download, Search } from 'lucide-react';
import { motion } from 'framer-motion';

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
            const response = await fetch('/api/subscribers');
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setSubscribers(data);
                    setFilteredSubscribers(data);
                }
            } else {
                console.error('Failed to load subscribers');
            }
        } catch (error) {
            console.error('Error loading subscribers:', error);
        }
    };

    const deleteSubscriber = async (email: string) => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer ${email} ?`)) {
            try {
                const response = await fetch('/api/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                if (response.ok) {
                    const updated = subscribers.filter(sub => sub.email !== email);
                    setSubscribers(updated);
                    setFilteredSubscribers(updated); // Also update filtered view
                } else {
                    alert('Erreur lors de la désinscription');
                }
            } catch (error) {
                console.error('Error unsubscribing:', error);
                alert('Erreur réseau');
            }
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
        link.href = URL.createObjectURL(blob);
        link.download = `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`;
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
        <div className="min-h-screen bg-dark-bg py-32 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-5xl font-display font-black text-white uppercase italic tracking-tighter mb-4">
                        Gestion Newsletter
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Gérez vos abonnés à la newsletter Dropsiders
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
                    >
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

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
                    >
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

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
                    >
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

                {/* Actions Bar */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Search */}
                        <div className="relative flex-1 w-full md:max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Rechercher un abonné..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan transition-all"
                            />
                        </div>

                        {/* Export Button */}
                        <button
                            onClick={exportToCSV}
                            disabled={subscribers.length === 0}
                            className="flex items-center gap-2 px-6 py-3 bg-neon-red/10 border border-neon-red/30 rounded-xl text-neon-red font-bold uppercase tracking-wide hover:bg-neon-red/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="w-5 h-5" />
                            Exporter CSV
                        </button>
                    </div>
                </div>

                {/* Subscribers Table */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                    {filteredSubscribers.length === 0 ? (
                        <div className="p-12 text-center">
                            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">
                                {searchTerm ? 'Aucun abonné trouvé' : 'Aucun abonné pour le moment'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left p-4 text-xs font-black text-neon-red uppercase tracking-widest">Email</th>
                                        <th className="text-left p-4 text-xs font-black text-neon-red uppercase tracking-widest">Prénom</th>
                                        <th className="text-left p-4 text-xs font-black text-neon-red uppercase tracking-widest">Nom</th>
                                        <th className="text-left p-4 text-xs font-black text-neon-red uppercase tracking-widest">Date d'inscription</th>
                                        <th className="text-right p-4 text-xs font-black text-neon-red uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSubscribers.map((subscriber, index) => (
                                        <motion.tr
                                            key={subscriber.email}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                        >
                                            <td className="p-4 text-white font-medium">{subscriber.email}</td>
                                            <td className="p-4 text-gray-400">{subscriber.firstName || '-'}</td>
                                            <td className="p-4 text-gray-400">{subscriber.lastName || '-'}</td>
                                            <td className="p-4 text-gray-400 text-sm">{formatDate(subscriber.subscribedAt)}</td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => deleteSubscriber(subscriber.email)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 hover:bg-red-500/20 transition-all text-sm font-bold"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Supprimer
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Info Box */}
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
        </div>
    );
}
