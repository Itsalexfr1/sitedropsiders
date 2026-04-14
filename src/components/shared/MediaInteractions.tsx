import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Share2, MessageSquare, X, Maximize2, Trash2, Instagram, Music } from 'lucide-react';
import { getAuthHeaders } from '../../utils/auth';
import { resolveImageUrl } from '../../utils/image';

interface MediaStats {
    likes: number;
    shares: number;
    commentsCount: number;
    anecdote: string | null;
}

interface Comment {
    id: string;
    user: string;
    text: string;
    timestamp: string;
}

interface MediaInteractionsProps {
    type: 'photo' | 'clip';
    id: string; // URL or ID
    onClose?: () => void;
    isAdmin?: boolean;
    isModo?: boolean;
    videoUrl?: string;
    imageUrl?: string;
}

export function MediaInteractions({ type, id, onClose, isAdmin, isModo, videoUrl, imageUrl }: MediaInteractionsProps) {
    const [stats, setStats] = useState<MediaStats>({ likes: 0, shares: 0, commentsCount: 0, anecdote: null });
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [showComments, setShowComments] = useState(false);
    const hasModPowers = isAdmin || isModo;

    const fetchStats = async () => {
        try {
            const res = await fetch(`/api/media/stats?type=${type}&id=${encodeURIComponent(id)}`);
            const data = await res.json();
            if (data) setStats(data);
        } catch (e) { console.error(e); }
    };

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/media/comments?type=${type}&id=${encodeURIComponent(id)}`);
            const data = await res.json();
            if (data) setComments(data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchStats();
    }, [id, type]);

    useEffect(() => {
        if (showComments) fetchComments();
    }, [showComments, id, type]);

    const handleLike = async () => {
        try {
            const res = await fetch('/api/media/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, id })
            });
            const data = await res.json();
            if (data.success) setStats(prev => ({ ...prev, likes: data.likes }));
        } catch (e) { console.error(e); }
    };

    const handleSocialShare = async (platform: 'instagram' | 'tiktok') => {
        try {
            await fetch('/api/media/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, id, platform })
            });

            const shareUrl = imageUrl || id;
            const message = type === 'photo' ? "Check cette photo sur Dropsiders !" : "Check ce clip sur Dropsiders !";

            if (navigator.share) {
                await navigator.share({ title: 'Dropsiders', text: message, url: shareUrl });
            } else {
                navigator.clipboard.writeText(shareUrl);
                alert("Lien copié ! Ouvre " + platform + " pour partager.");
            }
            setStats(prev => ({ ...prev, shares: prev.shares + 1 }));
        } catch (e) { console.error(e); }
    };

    const handleShare = async () => {
        try {
            await fetch('/api/media/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, id })
            });

            const shareUrl = imageUrl || id;
            if (navigator.share) {
                await navigator.share({ title: 'Dropsiders', url: shareUrl });
            } else {
                navigator.clipboard.writeText(shareUrl);
                alert("Lien copié !");
            }
            setStats(prev => ({ ...prev, shares: prev.shares + 1 }));
        } catch (e) { console.error(e); }
    };

    const postComment = async () => {
        if (!newComment.trim()) return;
        const user = prompt("Votre pseudo", "Anonyme") || "Anonyme";
        try {
            const res = await fetch('/api/media/comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, id, user, text: newComment })
            });
            const data = await res.json();
            if (data.success) {
                setComments(prev => [...prev, data.comment]);
                setNewComment("");
                setStats(prev => ({ ...prev, commentsCount: prev.commentsCount + 1 }));
            }
        } catch (e) { console.error(e); }
    };

    const deleteComment = async (commentId: string) => {
        if (!confirm("Supprimer ce commentaire ?")) return;
        try {
            const res = await fetch('/api/media/comment/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ type, id, commentId })
            });
            const data = await res.json();
            if (data.success) {
                setComments(prev => prev.filter(c => c.id !== commentId));
                setStats(prev => ({ ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) }));
            }
        } catch (e) { console.error(e); }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex flex-col md:flex-row bg-black/95 backdrop-blur-xl overflow-hidden"
            onClick={onClose}
        >
            <button
                className="absolute top-4 right-4 md:top-8 md:right-8 z-50 p-3 bg-white/10 text-white rounded-full hover:bg-neon-red transition-all shadow-lg"
                onClick={onClose}
            >
                <X className="w-6 h-6" />
            </button>

            {/* Media Section */}
            <div className="flex-1 relative flex items-center justify-center p-4 md:p-12 overflow-hidden h-[50vh] md:h-full">
                {videoUrl ? (
                    <video
                        src={resolveImageUrl(videoUrl)}
                        controls
                        autoPlay
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <motion.img
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        src={resolveImageUrl(imageUrl || id)}
                        alt="Media content"
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    />
                )}
            </div>

            {/* Interaction Section */}
            <div
                className="w-full md:w-[450px] h-full bg-white/[0.02] border-t md:border-t-0 md:border-l border-white/10 flex flex-col relative overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8 border-b border-white/10 space-y-6">
                    <div className="flex items-center gap-6">
                        <button onClick={handleLike} className="flex flex-col items-center gap-1.5 group">
                            <div className={`p-4 bg-white/5 rounded-[1.25rem] group-hover:bg-pink-500/20 transition-all ${stats.likes > 0 ? 'text-pink-500 bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.2)]' : 'text-gray-400'} group-hover:text-pink-500`}>
                                <Heart className={`w-7 h-7 ${stats.likes > 0 ? 'fill-pink-500' : ''}`} />
                            </div>
                            <span className="text-[10px] font-black text-gray-500 group-hover:text-white uppercase tracking-tighter transition-colors">{stats.likes} Likes</span>
                        </button>
                        <button onClick={handleShare} className="flex flex-col items-center gap-1.5 group">
                            <div className="p-4 bg-white/5 rounded-[1.25rem] group-hover:bg-white/10 transition-all text-gray-400 group-hover:text-white">
                                <Share2 className="w-7 h-7" />
                            </div>
                            <span className="text-[10px] font-black text-gray-500 group-hover:text-white uppercase tracking-tighter transition-colors">{stats.shares} Shares</span>
                        </button>
                        <button onClick={() => handleSocialShare('instagram')} className="flex flex-col items-center gap-1.5 group">
                            <div className="p-4 bg-white/5 rounded-[1.25rem] group-hover:bg-pink-500/20 transition-all text-gray-400 group-hover:text-pink-500">
                                <Instagram className="w-7 h-7" />
                            </div>
                            <span className="text-[10px] font-black text-gray-500 group-hover:text-white uppercase tracking-tighter transition-colors">Instagram</span>
                        </button>
                        <button onClick={() => handleSocialShare('tiktok')} className="flex flex-col items-center gap-1.5 group">
                            <div className="p-4 bg-white/5 rounded-[1.25rem] group-hover:bg-cyan-500/20 transition-all text-gray-400 group-hover:text-cyan-400">
                                <Music className="w-7 h-7" />
                            </div>
                            <span className="text-[10px] font-black text-gray-500 group-hover:text-white uppercase tracking-tighter transition-colors">TikTok</span>
                        </button>
                        <button onClick={() => setShowComments(!showComments)} className="flex flex-col items-center gap-1.5 group">
                            <div className={`p-4 bg-white/5 rounded-[1.25rem] group-hover:bg-neon-green/20 transition-all ${showComments ? 'text-neon-green bg-neon-green/10 shadow-[0_0_20px_rgba(52,211,153,0.2)]' : 'text-gray-400'} group-hover:text-neon-green`}>
                                <MessageSquare className="w-7 h-7" />
                            </div>
                            <span className="text-[10px] font-black text-gray-500 group-hover:text-white uppercase tracking-tighter transition-colors">{stats.commentsCount} Comments</span>
                        </button>
                    </div>

                    {stats.anecdote && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-neon-green/5 border-l-2 border-neon-green p-5 rounded-r-[1.5rem]"
                        >
                            <p className="text-[9px] font-black text-neon-green uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                <Maximize2 className="w-3 h-3" />
                                ANECDOTE DU DROPSIDER
                            </p>
                            <p className="text-sm text-gray-200 italic font-medium leading-relaxed">
                                "{stats.anecdote}"
                            </p>
                        </motion.div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    {showComments ? (
                        <>
                            {comments.length > 0 ? (
                                comments.map(comment => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={comment.id}
                                        className="space-y-2 group/comment"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black text-neon-red uppercase tracking-tighter">{comment.user}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{new Date(comment.timestamp).toLocaleDateString()}</span>
                                                {hasModPowers && (
                                                    <button onClick={() => deleteComment(comment.id)} className="text-red-500 hover:text-red-400 transition-colors opacity-0 group-hover/comment:opacity-100">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-300 bg-white/[0.03] p-4 rounded-2xl border border-white/5 leading-relaxed shadow-sm">
                                            {comment.text}
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-sm space-y-4">
                                    <MessageSquare className="w-12 h-12" />
                                    <span>Aucun commentaire pour le moment</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
                            <div className="p-8 bg-white/5 rounded-[2rem]">
                                <MessageSquare className="w-16 h-16 text-white/10" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-white font-black uppercase text-lg tracking-tighter">Réactions de la commune</p>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Affiche les commentaires pour voir les retours !</p>
                            </div>
                            <button
                                onClick={() => setShowComments(true)}
                                className="px-10 py-4 bg-neon-green text-black font-black text-xs rounded-2xl uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(52,211,153,0.3)]"
                            >
                                VOIR LES COMMENTAIRES
                            </button>
                        </div>
                    )}
                </div>

                {/* Input Section */}
                <div className="p-8 bg-black/40 backdrop-blur-xl border-t border-white/10">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Écris ton message..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-neon-green/50 placeholder:text-gray-600 transition-all"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && postComment()}
                        />
                        <button
                            onClick={postComment}
                            className="px-8 py-4 bg-neon-green text-black font-black text-[10px] rounded-2xl uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(52,211,153,0.2)]"
                        >
                            POSTER
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
