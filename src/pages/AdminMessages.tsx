import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Trash2, Reply, Send, X, User, Clock, MessageSquare, CheckCircle, AlertCircle, Inbox } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

interface ContactMessage {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    date: string;
    read: boolean;
    replied: boolean;
}

export function AdminMessages() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [selected, setSelected] = useState<ContactMessage | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyModal, setReplyModal] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [replyStatus, setReplyStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [replyError, setReplyError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const showNotif = (type: 'success' | 'error', msg: string) => {
        setNotification({ type, msg });
        setTimeout(() => setNotification(null), 4000);
    };

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/contacts', { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setMessages(Array.isArray(data) ? data.reverse() : []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMessages(); }, []);

    const openMessage = async (msg: ContactMessage) => {
        setSelected(msg);
        if (!msg.read) {
            await fetch('/api/contacts/read', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id: msg.id })
            });
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
        }
    };

    const handleDelete = async (id: string) => {
        await fetch('/api/contacts/delete', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id })
        });
        setMessages(prev => prev.filter(m => m.id !== id));
        if (selected?.id === id) setSelected(null);
        setDeleteConfirm(null);
        showNotif('success', 'Message supprimé.');
    };

    const handleReply = async () => {
        if (!selected || !replyBody.trim()) return;
        setReplyStatus('sending');
        try {
            const res = await fetch('/api/contacts/reply', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    to: selected.email,
                    name: selected.name,
                    subject: `Re: ${selected.subject}`,
                    message: replyBody
                })
            });
            if (res.ok) {
                setReplyStatus('success');
                setReplyBody('');
                setMessages(prev => prev.map(m => m.id === selected.id ? { ...m, replied: true } : m));
                setSelected(prev => prev ? { ...prev, replied: true } : prev);
                setTimeout(() => { setReplyModal(false); setReplyStatus('idle'); }, 1500);
                showNotif('success', `Réponse envoyée à ${selected.name} !`);
            } else {
                const err = await res.json().catch(() => ({}));
                setReplyError(err.error || 'Erreur lors de l\'envoi');
                setReplyStatus('error');
            }
        } catch (e: any) {
            setReplyError(e.message);
            setReplyStatus('error');
        }
    };

    const unreadCount = messages.filter(m => !m.read).length;

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="border-b border-white/5 bg-black/80 backdrop-blur-xl sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/admin" className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-white group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-neon-red/10 rounded-xl border border-neon-red/20">
                                <Inbox className="w-5 h-5 text-neon-red" />
                            </div>
                            <div>
                                <h1 className="text-xl font-display font-black uppercase italic tracking-tight text-white">
                                    Messages <span className="text-neon-red">Contact</span>
                                </h1>
                                <p className="text-gray-500 text-xs">{messages.length} messages · {unreadCount} non lus</p>
                            </div>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <div className="px-3 py-1 bg-neon-red rounded-full text-white text-xs font-black">
                            {unreadCount} NOUVEAU{unreadCount > 1 ? 'X' : ''}
                        </div>
                    )}
                </div>
            </div>

            {/* Notification toast */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className={`fixed top-20 left-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-2xl ${notification.type === 'success'
                            ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                            : 'bg-neon-red/20 border border-neon-red/30 text-neon-red'
                            }`}
                    >
                        {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {notification.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto flex h-[calc(100vh-65px)]">
                {/* LEFT: Message List */}
                <div className="w-full md:w-96 border-r border-white/5 overflow-y-auto flex-shrink-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-48 text-gray-600">
                            <div className="animate-spin w-6 h-6 border-2 border-neon-red border-t-transparent rounded-full" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-600">
                            <MessageSquare className="w-12 h-12 opacity-20" />
                            <p className="text-sm font-bold uppercase tracking-widest">Aucun message</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {messages.map(msg => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={() => openMessage(msg)}
                                    className={`p-4 cursor-pointer transition-all hover:bg-white/5 relative ${selected?.id === msg.id ? 'bg-white/5 border-l-2 border-neon-red' : 'border-l-2 border-transparent'}`}
                                >
                                    {!msg.read && (
                                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-neon-red" />
                                    )}
                                    <div className="flex items-start gap-3">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${msg.read ? 'bg-white/5 text-gray-500' : 'bg-neon-red/20 text-neon-red'}`}>
                                            {msg.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <span className={`text-sm truncate ${msg.read ? 'text-gray-400 font-medium' : 'text-white font-black'}`}>{msg.name}</span>
                                                <span className="text-[10px] text-gray-600 flex-shrink-0">{new Date(msg.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                                            </div>
                                            <p className={`text-xs truncate mt-0.5 ${msg.read ? 'text-gray-600' : 'text-gray-400'}`}>{msg.subject}</p>
                                            <p className="text-[11px] text-gray-700 truncate mt-1">{msg.message}</p>
                                            {msg.replied && (
                                                <span className="inline-flex items-center gap-1 text-[9px] uppercase font-black text-neon-cyan/70 mt-1">
                                                    <Reply className="w-3 h-3" /> Répondu
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT: Message Detail */}
                <div className="flex-1 overflow-y-auto">
                    {selected ? (
                        <motion.div
                            key={selected.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-8 max-w-3xl"
                        >
                            {/* Message Header */}
                            <div className="flex items-start justify-between mb-8 gap-4">
                                <div>
                                    <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tight mb-1">{selected.subject}</h2>
                                    <div className="flex items-center gap-3 text-sm text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5" />
                                            <span className="font-bold text-white">{selected.name}</span>
                                        </div>
                                        <span className="text-gray-700">·</span>
                                        <div className="flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5" />
                                            <a href={`mailto:${selected.email}`} className="text-neon-cyan hover:underline">{selected.email}</a>
                                        </div>
                                        <span className="text-gray-700">·</span>
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{new Date(selected.date).toLocaleString('fr-FR')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => {
                                            const sig = `\n\n\n`;
                                            const quote = `\n\n---\n✉ Message original de ${selected.name}\nObjet : ${selected.subject}\n\n${selected.message}`;
                                            setReplyBody(sig + quote);
                                            setReplyModal(true);
                                            // Set cursor at beginning
                                            setTimeout(() => {
                                                const textarea = document.querySelector('textarea');
                                                if (textarea) {
                                                    textarea.focus();
                                                    textarea.setSelectionRange(0, 0);
                                                }
                                            }, 100);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-xl hover:bg-neon-cyan/20 transition-all text-xs font-black uppercase"
                                    >
                                        <Reply className="w-4 h-4" />
                                        Répondre
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(selected.id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-neon-red/10 border border-neon-red/30 text-neon-red rounded-xl hover:bg-neon-red/20 transition-all text-xs font-black uppercase"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Message Body */}
                            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">{selected.message}</p>
                            </div>

                            {selected.replied && (
                                <div className="mt-4 flex items-center gap-2 text-neon-cyan/60 text-xs font-bold">
                                    <Reply className="w-4 h-4" />
                                    Vous avez déjà répondu à ce message.
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-700">
                            <Mail className="w-16 h-16 opacity-10" />
                            <p className="text-sm font-bold uppercase tracking-widest">Sélectionnez un message</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Reply Modal */}
            <AnimatePresence>
                {replyModal && selected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black uppercase italic tracking-tight text-white">Répondre à {selected.name}</h3>
                                    <p className="text-neon-cyan text-sm mt-1">{selected.email}</p>
                                </div>
                                <button onClick={() => { setReplyModal(false); setReplyStatus('idle'); }} className="p-2 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                                    Re: {selected.subject}
                                </div>
                                <textarea
                                    value={replyBody}
                                    onChange={(e) => setReplyBody(e.target.value)}
                                    rows={10}
                                    placeholder="Rédigez votre réponse..."
                                    className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-white text-sm resize-none focus:outline-none focus:border-neon-cyan transition-all font-mono"
                                />
                                {replyStatus === 'error' && (
                                    <div className="flex items-center gap-2 text-neon-red text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        {replyError}
                                    </div>
                                )}
                                {replyStatus === 'success' && (
                                    <div className="flex items-center gap-2 text-green-400 text-sm">
                                        <CheckCircle className="w-4 h-4" />
                                        Message envoyé avec succès !
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                                <button
                                    onClick={() => { setReplyModal(false); setReplyStatus('idle'); }}
                                    className="px-6 py-2.5 bg-white/5 text-gray-400 font-bold uppercase rounded-xl hover:bg-white/10 text-sm"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleReply}
                                    disabled={replyStatus === 'sending' || replyStatus === 'success' || !replyBody.trim()}
                                    className="px-8 py-2.5 bg-gradient-to-r from-neon-cyan to-neon-blue text-black font-black uppercase rounded-xl hover:opacity-90 transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-4 h-4" />
                                    {replyStatus === 'sending' ? 'Envoi...' : 'Envoyer via Brevo'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirm Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-[#111] border border-white/10 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl"
                        >
                            <div className="p-4 bg-neon-red/10 rounded-full border border-neon-red/20 inline-flex mb-4">
                                <Trash2 className="w-6 h-6 text-neon-red" />
                            </div>
                            <h3 className="text-lg font-black uppercase italic mb-2">Supprimer ce message ?</h3>
                            <p className="text-gray-500 text-sm mb-6">Cette action est irréversible.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-white/5 rounded-xl text-sm font-bold hover:bg-white/10">Annuler</button>
                                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-neon-red rounded-xl text-white text-sm font-black hover:bg-neon-red/80">Supprimer</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
