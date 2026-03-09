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

    // Only allow 'alex' (or 'contact@dropsiders.fr') to access this page
    if (currentUser !== 'alex' && currentUser !== 'contact@dropsiders.fr') {
        return <Navigate to="/admin" replace />;
    }

    return (
        <div className="min-h-screen bg-dark-bg py-32 print:p-0 print:py-0 print:bg-white">
            <div className="max-w-full mx-auto px-4 md:px-12 print:p-0">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 print:hidden">
                    <div className="flex items-center gap-6">
                        <Link to="/admin" className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group">
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-neon-purple/10 rounded-2xl">
                                    <FileText className="w-8 h-8 text-neon-purple" />
                                </div>
                                <h1 className="text-4xl font-display font-black uppercase italic tracking-tighter">
                                    Gestion de <span className="text-neon-purple">Factures</span>
                                </h1>
                            </div>
                            <p className="text-gray-400 normal-case">Générez et imprimez vos factures administratives.</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden print:bg-transparent print:border-none print:rounded-none"
                >
                    <InvoiceGenerator />
                </motion.div>
            </div>
        </div>
    );
}

export default AdminFactures;
