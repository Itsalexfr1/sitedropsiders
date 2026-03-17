import { useState, useEffect } from 'react';
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
        <div className="min-h-screen md:min-h-0 bg-[#0d0f1a] flex flex-col md:py-24 print:p-0 print:bg-white">

            {/* Page header — desktop only */}
            <div className="hidden md:flex max-w-full mx-auto px-12 w-full flex-row justify-between items-center gap-6 mb-8 print:hidden">
                <div className="flex items-center gap-6">
                    <Link to="/admin" className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group">
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-4 mb-1">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl">
                                <FileText className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h1 className="text-4xl font-display font-black uppercase italic tracking-tighter text-white">
                                Gestion de <span className="text-indigo-400">Factures</span>
                            </h1>
                        </div>
                        <p className="text-gray-400 normal-case pl-20">Générez et imprimez vos factures administratives.</p>
                    </div>
                </div>
            </div>

            {/* Mobile top bar */}
            <div className="flex md:hidden items-center gap-4 px-4 py-4 bg-black/60 backdrop-blur-xl border-b border-white/5 print:hidden sticky top-0 z-10">
                <Link to="/admin" className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <h1 className="text-base font-black uppercase tracking-tight text-white">Factures</h1>
            </div>

            {/* Generator — full width/height */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 md:max-w-full md:mx-auto md:px-12 md:w-full print:p-0"
            >
                <div className="md:bg-white/[0.02] md:border md:border-white/5 md:rounded-3xl overflow-hidden print:bg-transparent print:border-none print:rounded-none h-full">
                    <InvoiceGenerator />
                </div>
            </motion.div>
        </div>
    );
}

export default AdminFactures;
