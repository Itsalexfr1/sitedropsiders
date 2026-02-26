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

    // New States for Custom Emails
    const [isNewMail, setIsNewMail] = useState(false);
    const [destinationEmail, setDestinationEmail] = useState('');
    const [mailSubject, setMailSubject] = useState('');

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
        const to = isNewMail ? destinationEmail : selected?.email;
        if (!to || !replyBody.trim()) return;

        setReplyStatus('sending');
        try {
            const res = await fetch('/api/contacts/reply', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    to: to,
                    name: isNewMail ? 'Partenaire' : selected?.name,
                    subject: isNewMail ? mailSubject : `Re: ${selected?.subject}`,
                    message: replyBody
                })
            });
            if (res.ok) {
                setReplyStatus('success');
                setReplyBody('');
                if (selected && !isNewMail) {
                    setMessages(prev => prev.map(m => m.id === selected.id ? { ...m, replied: true } : m));
                    setSelected(prev => prev ? { ...prev, replied: true } : prev);
                }
                setTimeout(() => { setReplyModal(false); setReplyStatus('idle'); }, 1500);
                showNotif('success', `Message envoyé à ${to} !`);
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

    const PRESS_RELEASE_TEMPLATE = `Bonjour,

Dropsiders V2 est enfin là ! 🎙️ 

Nous avons le plaisir de vous annoncer le lancement de notre nouvelle plateforme média dédiée aux festivals, artistes et organisateurs d'événements.

Nouveautés majeures :
- Agenda Interactif : Retrouvez tous les prochains festivals en un coup d'œil.
- Lecteur Audio intelligent (IA haute fidélité) pour tous les articles.
- Template Premium "Cyber-Néon" ultra-immersif.
- Accessibilité multilingue instantanée (Français / Anglais).
- Engagement Boosté : Sections réseaux sociaux optimisées pour vos événements.

Nous serions ravis de collaborer avec vous pour mettre en avant vos prochains événements avec ces nouveaux outils technologiques innovants.

L'équipe Dropsiders.`;

    const unreadCount = messages.filter(m => !m.read).length;

    const getSubjectColor = (subject: string) => {
        const s = subject.toLowerCase();
        if (s.includes('question')) return 'text-neon-cyan border-neon-cyan/20 bg-neon-cyan/5';
        if (s.includes('suggestion')) return 'text-neon-green border-neon-green/20 bg-neon-green/5';
        if (s.includes('partenariat')) return 'text-neon-purple border-neon-purple/20 bg-neon-purple/5';
        if (s.includes('recrutement')) return 'text-neon-orange border-neon-orange/20 bg-neon-orange/5';
        return 'text-gray-400 border-white/10 bg-white/5';
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="border-b border-white/5 bg-black/80 backdrop-blur-xl sticky top-0 z-30">
                <div className="max-w-full mx-auto px-4 md:px-12 py-4 flex items-center justify-between">
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
                                    MESSAGERIE <span className="text-neon-red">& CONTACTS</span>
                                </h1>
                                <p className="text-gray-500 text-xs">{messages.length} messages · {unreadCount} non lus</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setIsNewMail(true);
                                setDestinationEmail('');
                                setMailSubject('');
                                setReplyBody('\n\n\n'); // Start with some space for signature
                                setReplyModal(true);
                            }}
                            className="px-4 py-2 bg-neon-red/10 border border-neon-red/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neon-red text-white transition-all flex items-center gap-2 group shadow-lg shadow-neon-red/10"
                        >
                            <Send className="w-3 h-3" />
                            Nouveau Message
                        </button>
                        <a
                            href="https://mail.dropsiders.fr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 group"
                        >
                            <Mail className="w-3 h-3 text-neon-red" />
                            Accès Messagerie Pro
                        </a>
                        {unreadCount > 0 && (
                            <div className="hidden lg:block px-3 py-1 bg-neon-red rounded-full text-white text-[9px] font-black uppercase tracking-tight">
                                {unreadCount} NOUVEAU{unreadCount > 1 ? 'X' : ''}
                            </div>
                        )}
                    </div>
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

            <div className={`max-w-full mx-auto flex h-[calc(100vh-65px)] px-0 md:px-12`}>
                {/* LEFT: Message List */}
                <div className={`${selected ? 'hidden md:flex' : 'flex'} w-full md:w-96 border-r border-white/5 overflow-y-auto flex-shrink-0 flex-col`}>
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
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${getSubjectColor(msg.subject)}`}>
                                                    {msg.subject}
                                                </span>
                                            </div>
                                            <p className={`text-sm truncate mt-2 font-medium ${msg.read ? 'text-white/40' : 'text-white/80'}`}>{msg.message}</p>
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
                <div className={`${selected ? 'flex' : 'hidden md:flex'} flex-1 overflow-y-auto flex-col`}>
                    {selected ? (
                        <motion.div
                            key={selected.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-4 md:p-8 max-w-full"
                        >
                            {/* Mobile Back Button */}
                            <button
                                onClick={() => setSelected(null)}
                                className="md:hidden flex items-center gap-2 text-gray-400 hover:text-white mb-6 uppercase text-[10px] font-black tracking-widest"
                            >
                                <ArrowLeft className="w-4 h-4" /> Retour à la liste
                            </button>
                            {/* Message Header */}
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-8 gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getSubjectColor(selected.subject)}`}>
                                            {selected.subject}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tight mb-1">{selected.name}</h2>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
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
                                <div className="flex items-center gap-2 flex-shrink-0 w-full lg:w-auto">
                                    <button
                                        onClick={() => {
                                            setIsNewMail(false);
                                            const sig = `\n\n\n`;
                                            setReplyBody(sig);
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

            {/* Reply / New Message Modal */}
            <AnimatePresence>
                {replyModal && (isNewMail || selected) && (
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
                            className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <div className="flex-1">
                                    <h3 className="text-lg font-black uppercase italic tracking-tight text-white">
                                        {isNewMail ? 'NOUVEAU MESSAGE' : `Répondre à ${selected?.name}`}
                                    </h3>
                                    {isNewMail ? (
                                        <div className="mt-4 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black uppercase text-gray-500 w-12">À :</span>
                                                <input
                                                    type="email"
                                                    value={destinationEmail}
                                                    onChange={(e) => setDestinationEmail(e.target.value)}
                                                    placeholder="email@partenaire.com"
                                                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-neon-cyan focus:outline-none focus:border-neon-cyan/50 flex-1"
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black uppercase text-gray-500 w-12">Objet :</span>
                                                <input
                                                    type="text"
                                                    value={mailSubject}
                                                    onChange={(e) => setMailSubject(e.target.value)}
                                                    placeholder="Sujet du mail"
                                                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/20 flex-1 font-bold"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-neon-cyan text-sm mt-1">{selected?.email}</p>
                                    )}
                                </div>
                                <button onClick={() => { setReplyModal(false); setReplyStatus('idle'); }} className="p-2 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-colors self-start">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex flex-col md:flex-row h-[600px]">
                                {/* Editor Side */}
                                <div className="flex-1 p-6 space-y-4 border-r border-white/10 overflow-y-auto">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest italic">
                                            {isNewMail ? 'Corps du message' : `Re: ${selected?.subject}`}
                                        </div>
                                        {isNewMail && (
                                            <button
                                                onClick={() => {
                                                    setMailSubject('Dropsiders V2 - Nouveau Communiqué de Presse 🎙️');
                                                    setReplyBody(PRESS_RELEASE_TEMPLATE);
                                                }}
                                                className="px-3 py-1 bg-neon-red/10 border border-neon-red/30 rounded-lg text-[10px] font-black text-neon-red uppercase hover:bg-neon-red hover:text-white transition-all shadow-lg shadow-neon-red/5 flex items-center gap-2"
                                            >
                                                Remplir via Communiqué 📄
                                            </button>
                                        )}
                                    </div>
                                    <textarea
                                        value={replyBody}
                                        onChange={(e) => setReplyBody(e.target.value)}
                                        rows={15}
                                        placeholder="Rédigez votre message..."
                                        className="w-full h-[400px] bg-black/60 border border-white/10 rounded-xl p-4 text-white text-sm resize-none focus:outline-none focus:border-neon-cyan transition-all font-mono"
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

                                {/* Preview Side */}
                                <div className="flex-1 bg-black p-6 overflow-y-auto hidden md:block border-l border-white/5">
                                    <div className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] mb-4 text-center">Aperçu du Mail</div>

                                    <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl scale-[0.9] origin-top">
                                        {/* Fake Email Body */}
                                        <div className="p-8 pb-4">
                                            <div className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap min-h-[100px]">
                                                {replyBody || "[Votre message apparaîtra ici]"}
                                            </div>

                                            {/* Signature Preview */}
                                            <div className="mt-12 bg-black border border-white/10 border-t-4 border-t-neon-red rounded-2xl overflow-hidden shadow-2xl">
                                                <div className="p-6 text-center">
                                                    <div className="text-white text-sm font-black italic uppercase mb-2">
                                                        Cordialement, <br />
                                                        L'équipe <span className="text-neon-red">Dropsiders</span>
                                                    </div>

                                                    <div className="text-neon-red text-[8px] font-black uppercase tracking-widest mb-6 pb-3 border-b border-white/5">
                                                        NEWS · RÉCAPS · INTERVIEWS · CONCOURS
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className="bg-white/5 border border-white/10 border-b-2 border-b-neon-red py-2 px-1 rounded-lg text-[7px] font-black text-white text-center uppercase">🌐 SITE</div>
                                                        <div className="bg-white/5 border border-white/10 border-b-2 border-b-neon-cyan py-2 px-1 rounded-lg text-[7px] font-black text-white text-center uppercase">🛍️ SHOP</div>
                                                        <div className="bg-gradient-to-r from-neon-red to-red-600 py-2 px-1 rounded-lg text-[7px] font-black text-white text-center uppercase shadow-lg shadow-neon-red/20">📩 Newsletter</div>
                                                    </div>
                                                </div>
                                                <div className="bg-[#080808] p-3 text-center opacity-40">
                                                    <div className="text-[10px] font-bold text-white tracking-widest italic">DROPSIDERS</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-black p-4 text-center border-t border-white/5">
                                            <p className="text-[7px] text-gray-700 font-black tracking-widest uppercase">DROPSIDERS · TOUTE L'ACTU DES FESTIVALS</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-[#111]">
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
