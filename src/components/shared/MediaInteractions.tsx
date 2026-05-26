import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Share2, MessageSquare, X, Maximize2, Trash2, Instagram, Music, ChevronLeft, ChevronRight } from 'lucide-react';
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
    images?: string[];
    onChangePhoto?: (id: string) => void;
}

export function MediaInteractions({ type, id, onClose, isAdmin, isModo, videoUrl, imageUrl, images, onChangePhoto }: MediaInteractionsProps) {
    const [currentId, setCurrentId] = useState(id);
    const [stats, setStats] = useState<MediaStats>({ likes: 0, shares: 0, commentsCount: 0, anecdote: null });
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [pseudo, setPseudo] = useState('Anonyme');
    const [showComments, setShowComments] = useState(false);
    const [toast, setToast] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const hasModPowers = isAdmin || isModo;

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const fetchStats = async () => {
        try {
            const res = await fetch(`/api/media/stats?type=${type}&id=${encodeURIComponent(currentId)}`);
            const data = await res.json();
            if (data) setStats(data);
        } catch (e) { console.error(e); }
    };

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/media/comments?type=${type}&id=${encodeURIComponent(currentId)}`);
            const data = await res.json();
            if (data) setComments(data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        setCurrentId(id);
    }, [id]);

    useEffect(() => {
        fetchStats();
    }, [currentId, type]);

    useEffect(() => {
        if (showComments) fetchComments();
    }, [showComments, currentId, type]);

    const handleLike = async () => {
        try {
            const res = await fetch('/api/media/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, id: currentId })
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
                body: JSON.stringify({ type, id: currentId, platform })
            });

            const shareUrl = imageUrl || currentId;
            const message = type === 'photo' ? "Check cette photo sur Dropsiders !" : "Check ce clip sur Dropsiders !";

            if (navigator.share) {
                await navigator.share({ title: 'Dropsiders', text: message, url: shareUrl });
            } else {
                navigator.clipboard.writeText(shareUrl);
                showToast(`Lien copié ! Ouvre ${platform} pour partager.`);
            }
            setStats(prev => ({ ...prev, shares: prev.shares + 1 }));
        } catch (e) { console.error(e); }
    };

    const handleShare = async () => {
        try {
            await fetch('/api/media/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, id: currentId })
            });

            const shareUrl = imageUrl || currentId;
            if (navigator.share) {
                await navigator.share({ title: 'Dropsiders', url: shareUrl });
            } else {
                navigator.clipboard.writeText(shareUrl);
                showToast('Lien copié !');
            }
            setStats(prev => ({ ...prev, shares: prev.shares + 1 }));
        } catch (e) { console.error(e); }
    };

    const postComment = async () => {
        if (!newComment.trim()) return;
        try {
            const res = await fetch('/api/media/comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, id: currentId, user: pseudo || 'Anonyme', text: newComment })
            });
            const data = await res.json();
            if (data.success) {
                setComments(prev => [...prev, data.comment]);
                setNewComment("");
                setStats(prev => ({ ...prev, commentsCount: prev.commentsCount + 1 }));
            }
        } catch (e) { console.error(e); }
    };

    const doDeleteComment = async (commentId: string) => {
        setDeleteConfirmId(null);
        try {
            const res = await fetch('/api/media/comment/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ type, id: currentId, commentId })
            });
            const data = await res.json();
            if (data.success) {
                setComments(prev => prev.filter(c => c.id !== commentId));
                setStats(prev => ({ ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) }));
            }
        } catch (e) { console.error(e); }
    };

    // Navigation logic
    const hasMultipleImages = images && images.length > 1;
    const currentIndex = hasMultipleImages ? images.indexOf(currentId) : -1;

    const handlePrev = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!hasMultipleImages || currentIndex === -1) return;
        const newIndex = (currentIndex - 1 + images.length) % images.length;
        const newId = images[newIndex];
        setCurrentId(newId);
        if (onChangePhoto) onChangePhoto(newId);
    };

    const handleNext = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!hasMultipleImages || currentIndex === -1) return;
        const newIndex = (currentIndex + 1) % images.length;
        const newId = images[newIndex];
        setCurrentId(newId);
        if (onChangePhoto) onChangePhoto(newId);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                handlePrev();
            } else if (e.key === 'ArrowRight') {
                handleNext();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, images]);

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
                {hasMultipleImages && (
                    <>
                        <button
                            onClick={handlePrev}
                            className="absolute left-6 z-40 p-4 bg-black/60 hover:bg-[#bf00ff] text-white rounded-full border border-white/10 hover:border-[#bf00ff] transition-all shadow-2xl group cursor-pointer backdrop-blur-md active:scale-95 flex items-center justify-center hover:shadow-[0_0_20px_rgba(191,0,255,0.4)]"
                            style={{
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                            }}
                            title="Précédente"
                        >
                            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-6 z-40 p-4 bg-black/60 hover:bg-[#bf00ff] text-white rounded-full border border-white/10 hover:border-[#bf00ff] transition-all shadow-2xl group cursor-pointer backdrop-blur-md active:scale-95 flex items-center justify-center hover:shadow-[0_0_20px_rgba(191,0,255,0.4)]"
                            style={{
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                            }}
                            title="Suivante"
                        >
                            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </>
                )}

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
                        src={resolveImageUrl(imageUrl || currentId)}
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
                                                    <button onClick={() => setDeleteConfirmId(comment.id)} className="text-red-500 hover:text-red-400 transition-colors opacity-0 group-hover/comment:opacity-100">
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

                {/* Toast */}
                {toast && (
                    <div className="mx-8 mb-2 px-4 py-2 bg-neon-green/10 border border-neon-green/30 rounded-xl text-[10px] font-black text-neon-green uppercase tracking-widest text-center">{toast}</div>
                )}

                {/* Delete confirm inline */}
                {deleteConfirmId && (
                    <div className="mx-8 mb-2 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between gap-4">
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Supprimer ce commentaire ?</span>
                        <div className="flex gap-2">
                            <button onClick={() => doDeleteComment(deleteConfirmId)} className="px-3 py-1.5 bg-red-500 text-white text-[9px] font-black uppercase rounded-lg">Oui</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1.5 bg-white/10 text-gray-400 text-[9px] font-black uppercase rounded-lg">Annuler</button>
                        </div>
                    </div>
                )}

                {/* Input Section */}
                <div className="p-8 bg-black/40 backdrop-blur-xl border-t border-white/10 space-y-3">
                    <input
                        type="text"
                        placeholder="Votre pseudo"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-neon-green/50 placeholder:text-gray-600 transition-all"
                        value={pseudo}
                        onChange={(e) => setPseudo(e.target.value)}
                    />
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
