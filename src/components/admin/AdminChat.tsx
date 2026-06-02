import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthHeaders, apiFetch } from '../../utils/auth';

export function AdminChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const pseudo = localStorage.getItem('admin_user') || 'Editeur';

    const fetchMessages = async (silent = false) => {
        try {
            const res = await apiFetch('/api/admin/chat', { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
                if (!isOpen && data.length > messages.length && messages.length > 0) {
                    setUnreadCount(prev => prev + (data.length - messages.length));
                }
            }
        } catch (e) {
            console.error('Failed to fetch admin chat', e);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(() => fetchMessages(true), 5000);
        return () => clearInterval(interval);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            setUnreadCount(0);
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msgText = newMessage.trim();
        setNewMessage("");

        const optimisticMsg = {
            id: Date.now().toString(),
            pseudo,
            text: msgText,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, optimisticMsg]);

        try {
            await apiFetch('/api/admin/chat', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ text: msgText })
            });
            fetchMessages(true);
        } catch (e) {
            console.error('Failed to send admin message', e);
        }
    };

    const clearChat = async () => {
        if (!window.confirm("Vider le chat admin ?")) return;
        try {
            await apiFetch('/api/admin/chat/clear', {
                method: 'POST',
                headers: getAuthHeaders()
            });
            setMessages([]);
        } catch (e) {
            console.error('Failed to clear admin chat', e);
        }
    };

    return (
        <>
            {/* FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-[200] p-4 bg-neon-purple text-white rounded-full shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:scale-110 transition-transform flex items-center justify-center"
            >
                <MessageSquare className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-neon-red text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-black animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] z-[200] bg-black/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neon-purple/20 rounded-xl">
                                    <MessageSquare className="w-5 h-5 text-neon-purple" />
                                </div>
                                <div>
                                    <h3 className="font-display font-black text-white italic leading-none uppercase">Staff Chat</h3>
                                    <p className="text-[9px] text-neon-purple font-black uppercase tracking-widest mt-1">Canal Privé Éditeurs</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={clearChat} className="p-2 text-gray-500 hover:text-red-500 hover:bg-white/5 rounded-lg transition-colors">
                                    <ShieldAlert className="w-4 h-4" />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {messages.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-center opacity-50">
                                    <p className="text-[10px] font-black uppercase text-gray-400">Aucun message.<br/>Démarrez la conversation !</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = msg.pseudo === pseudo;
                                    return (
                                        <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <span className="text-[8px] font-black uppercase text-gray-500 mb-1 px-1">
                                                {msg.pseudo} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm font-medium ${isMe ? 'bg-neon-purple text-white rounded-br-sm' : 'bg-white/10 text-white rounded-bl-sm border border-white/5'}`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-white/5 shrink-0 flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Message à l'équipe..."
                                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-purple"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="p-3 bg-neon-purple text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
