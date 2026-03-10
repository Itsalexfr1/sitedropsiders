import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, X, LayoutDashboard, FileText, Users, ChevronRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminAction {
    label: string;
    icon: React.ReactNode;
    to: string;
    permission?: string;
}

interface AdminEditBarProps {
    /** Actions spécifiques à la page courante */
    pageActions?: AdminAction[];
    /** Optionnel : La page actuelle pour le label du bouton */
    pageName?: string;
}

const useAdminStatus = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [permissions, setPermissions] = useState<string[]>([]);

    useEffect(() => {
        const auth = localStorage.getItem('admin_auth') === 'true';
        const user = localStorage.getItem('admin_user');
        const perms: string[] = JSON.parse(localStorage.getItem('admin_permissions') || '[]');
        setIsAdmin(auth && (user === 'alex' || perms.includes('all') || perms.length > 0));
        setPermissions(perms);
    }, []);

    const hasPermission = (p?: string) => {
        if (!p) return true;
        const user = localStorage.getItem('admin_user');
        if (user === 'alex' || permissions.includes('all')) return true;
        return permissions.includes(p);
    };

    return { isAdmin, hasPermission };
};

export function AdminEditBar({ pageActions = [], pageName = 'cette page' }: AdminEditBarProps) {
    const { isAdmin, hasPermission } = useAdminStatus();
    const [isOpen, setIsOpen] = useState(false);

    if (!isAdmin) return null;

    const filteredActions = pageActions.filter(a => hasPermission(a.permission));

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="relative"
                    >
                        <div className="bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 shadow-2xl shadow-black/80 min-w-[240px]">
                            {/* Header */}
                            <div className="flex items-center gap-3 pb-3 mb-3 border-b border-white/5">
                                <div className="w-7 h-7 bg-[#FF0000]/20 rounded-xl flex items-center justify-center border border-[#FF0000]/30">
                                    <Lock className="w-3.5 h-3.5 text-[#FF0000]" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#FF0000]">Mode Admin</p>
                                    <p className="text-[10px] text-gray-500 font-medium">{pageName}</p>
                                </div>
                            </div>

                            {/* Page-specific actions */}
                            {filteredActions.length > 0 && (
                                <div className="space-y-1.5 mb-3">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600 px-1 mb-2">Actions sur cette page</p>
                                    {filteredActions.map((action, i) => (
                                        <Link
                                            key={i}
                                            to={action.to}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/5 hover:bg-[#FF0000]/10 hover:border-[#FF0000]/30 border border-transparent transition-all group"
                                        >
                                            <span className="text-gray-500 group-hover:text-[#FF0000] transition-colors">{action.icon}</span>
                                            <span className="text-xs font-bold text-white uppercase tracking-wide">{action.label}</span>
                                            <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-[#FF0000] ml-auto transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Global shortcuts */}
                            <div className="space-y-1.5">
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600 px-1 mb-2">Raccourcis globaux</p>
                                <Link
                                    to="/admin"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-transparent transition-all group"
                                >
                                    <LayoutDashboard className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" />
                                    <span className="text-xs font-bold text-white uppercase tracking-wide">Tableau de bord</span>
                                    <ChevronRight className="w-3 h-3 text-gray-600 ml-auto" />
                                </Link>
                                <Link
                                    to="/admin/manage"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-transparent transition-all group"
                                >
                                    <FileText className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" />
                                    <span className="text-xs font-bold text-white uppercase tracking-wide">Gérer le contenu</span>
                                    <ChevronRight className="w-3 h-3 text-gray-600 ml-auto" />
                                </Link>
                                <Link
                                    to="/admin/editors"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-transparent transition-all group"
                                >
                                    <Users className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" />
                                    <span className="text-xs font-bold text-white uppercase tracking-wide">Éditeurs</span>
                                    <ChevronRight className="w-3 h-3 text-gray-600 ml-auto" />
                                </Link>
                            </div>
                        </div>

                        {/* Pointy tail */}
                        <div className="absolute -bottom-2 right-5 w-4 h-4 bg-[#0a0a0a]/95 border-r border-b border-white/10 rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                onClick={() => setIsOpen(o => !o)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center gap-2.5 px-4 py-3 bg-[#FF0000] text-white rounded-2xl shadow-2xl shadow-[#FF0000]/40 border border-[#FF0000]/50 font-black uppercase tracking-widest text-[10px] transition-all"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.span
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <X className="w-4 h-4" />
                        </motion.span>
                    ) : (
                        <motion.span
                            key="edit"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <Pencil className="w-4 h-4" />
                        </motion.span>
                    )}
                </AnimatePresence>
                <span>Editer</span>

                {/* Pulse ring */}
                <span className="absolute -top-1 -right-1 w-3 h-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white/80" />
                </span>
            </motion.button>
        </div>
    );
}
