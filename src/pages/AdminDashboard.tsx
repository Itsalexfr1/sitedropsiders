import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Mail, Calendar, Image as ImageIcon, Video, Mic, Plus, Users, LayoutDashboard, Lock, ArrowRight, Trash2, User } from 'lucide-react';
import { motion } from 'framer-motion';

export function AdminDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const auth = localStorage.getItem('admin_auth');
        if (auth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                setIsAuthenticated(true);
                localStorage.setItem('admin_auth', 'true');
                localStorage.setItem('admin_password', password); // Store for API headers
            } else {
                const data = await response.json();
                setError(data.error || 'Identifiants incorrects');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('admin_auth');
        localStorage.removeItem('admin_password');
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-dark-bg py-32 px-6 flex items-center justify-center">
                <div className="w-full max-w-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl"
                    >
                        <div className="flex justify-center mb-8">
                            <div className="p-4 bg-neon-red/10 rounded-full border border-neon-red/20">
                                <Lock className="w-8 h-8 text-neon-red" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-display font-black text-white text-center mb-2 uppercase italic">
                            Accès Restreint
                        </h2>
                        <p className="text-center text-gray-400 text-sm mb-8">
                            Veuillez vous identifier pour accéder au tableau de bord.
                        </p>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Nom d'utilisateur"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-neon-red transition-all"
                                />
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    placeholder="Mot de passe"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-neon-red transition-all"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <p className="text-red-400 text-xs text-center font-bold">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full py-3 bg-neon-red hover:bg-neon-red/80 text-white font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-neon-red/20 flex items-center justify-center gap-2 group"
                            >
                                Se connecter
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        );
    }

    const actions = [
        {
            title: "News",
            description: "Publier une actualité",
            icon: <FileText className="w-8 h-8 text-neon-blue" />,
            link: "/news/create",
            color: "border-neon-blue/20 hover:border-neon-blue",
            bg: "bg-neon-blue/5"
        },
        {
            title: "Interviews",
            description: "Ajouter une interview",
            icon: <Mic className="w-8 h-8 text-neon-purple" />,
            link: "/news/create?type=Interview",
            color: "border-neon-purple/20 hover:border-neon-purple",
            bg: "bg-neon-purple/5"
        },
        {
            title: "Récaps",
            description: "Nouveau reportage",
            icon: <Video className="w-8 h-8 text-neon-red" />,
            link: "/recaps/create",
            color: "border-neon-red/20 hover:border-neon-red",
            bg: "bg-neon-red/5"
        },
        {
            title: "Agenda",
            description: "Ajouter une date",
            icon: <Calendar className="w-8 h-8 text-neon-yellow" />,
            link: "/agenda/create",
            color: "border-neon-yellow/20 hover:border-neon-yellow",
            bg: "bg-neon-yellow/5"
        },
        {
            title: "Galeries",
            description: "Ajouter un album",
            icon: <ImageIcon className="w-8 h-8 text-neon-pink" />,
            link: "/galerie/create",
            color: "border-neon-pink/20 hover:border-neon-pink",
            bg: "bg-neon-pink/5"
        },
        {
            title: "Newsletter",
            description: "Envoyer un email",
            icon: <Mail className="w-8 h-8 text-green-400" />,
            link: "/newsletter/create",
            color: "border-green-400/20 hover:border-green-400",
            bg: "bg-green-400/5"
        },
        {
            title: "Supprimer",
            description: "Gérer et supprimer du contenu",
            icon: <Trash2 className="w-8 h-8 text-red-500" />,
            link: "/admin/manage",
            color: "border-red-500/20 hover:border-red-500",
            bg: "bg-red-500/5"
        },
    ];

    return (
        <div className="min-h-screen bg-dark-bg py-32 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16 text-center md:text-left flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
                >
                    <div>
                        <div className="flex items-center gap-4 justify-center md:justify-start mb-4">
                            <div className="p-3 bg-neon-red/10 rounded-2xl">
                                <LayoutDashboard className="w-8 h-8 text-neon-red" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter">
                                Tableau de <span className="text-neon-red">Bord</span>
                            </h1>
                        </div>
                        <p className="text-gray-400 text-lg max-w-2xl">
                            Bienvenue dans votre espace d'administration. Sélectionnez un module pour créer du nouveau contenu.
                        </p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-bold text-gray-400 hover:text-white transition-colors"
                    >
                        Se déconnecter
                    </button>
                </motion.div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {actions.map((action, index) => (
                        <motion.div
                            key={action.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link
                                to={action.link}
                                className={`block h-full p-8 rounded-3xl border ${action.color} ${action.bg} backdrop-blur-sm transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl group`}
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="p-4 bg-black/20 rounded-2xl group-hover:bg-black/40 transition-colors">
                                        {action.icon}
                                    </div>
                                    <div className="p-2 border border-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-display font-black text-white uppercase italic mb-2">
                                    {action.title}
                                </h3>
                                <p className="text-gray-400 font-medium">
                                    {action.description}
                                </p>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Quick Stats / Subscribers */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-16 pt-16 border-t border-white/5"
                >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white/5 rounded-3xl p-8 border border-white/10">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-neon-cyan/10 rounded-2xl">
                                <Users className="w-8 h-8 text-neon-cyan" />
                            </div>
                            <div>
                                <h3 className="text-xl font-display font-black text-white uppercase italic">Gestion des Abonnés</h3>
                                <p className="text-gray-400">Gérez votre liste de diffusion newsletter</p>
                            </div>
                        </div>
                        <Link
                            to="/newsletter/admin"
                            className="px-8 py-4 bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan rounded-xl font-bold uppercase tracking-widest transition-colors border border-neon-cyan/50"
                        >
                            Voir la liste
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
