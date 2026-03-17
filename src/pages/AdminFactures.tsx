import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { InvoiceGenerator } from '../components/InvoiceGenerator';

export function AdminFactures() {
    const [currentUser, setCurrentUser] = useState(localStorage.getItem('admin_user')?.toLowerCase() || '');

    useEffect(() => {
        setCurrentUser(localStorage.getItem('admin_user')?.toLowerCase() || '');
    }, []);

    if (currentUser !== 'alex' && currentUser !== 'contact@dropsiders.fr' && currentUser !== 'alexflex30@gmail.com') {
        return <Navigate to="/admin" replace />;
    }

    return (
        <>
            {/* ============ MOBILE: fixed full screen overlay ============ */}
            <div className="md:hidden fixed inset-0 z-50 bg-[#0d0f1a] flex flex-col overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-black/60 backdrop-blur-xl shrink-0">
                    <Link to="/admin" className="p-2 bg-white/5 border border-white/10 rounded-xl">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                    <h1 className="text-sm font-black uppercase tracking-tight text-white">Factures</h1>
                </div>
                <div className="flex-1 overflow-hidden">
                    <InvoiceGenerator />
                </div>
            </div>

            {/* ============ DESKTOP: normal flow ============ */}
            <div className="hidden md:block min-h-screen bg-[#0d0f1a] py-24 print:p-0 print:bg-white">
                <div className="max-w-full mx-auto px-12 print:p-0">
                    <div className="flex items-center gap-6 mb-8 print:hidden">
                        <Link to="/admin" className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group">
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl">
                                <FileText className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h1 className="text-4xl font-display font-black uppercase italic tracking-tighter text-white">
                                Gestion de <span className="text-indigo-400">Factures</span>
                            </h1>
                        </div>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden print:bg-transparent print:border-none print:rounded-none"
                    >
                        <InvoiceGenerator />
                    </motion.div>
                </div>
            </div>
        </>
    );
}

export default AdminFactures;
