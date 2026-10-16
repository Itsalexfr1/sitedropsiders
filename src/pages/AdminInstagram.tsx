import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Instagram, Users, FileText, CheckCircle2, Loader2, Sparkles, ExternalLink, Play } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export function AdminInstagram() {
    const navigate = useNavigate();
    const [followers, setFollowers] = useState<number>(4698);
    const [postsCount, setPostsCount] = useState<number>(1441);
    const [followingCount, setFollowingCount] = useState<number>(668);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
    const [testFollowed, setTestFollowed] = useState<boolean>(false);

    useEffect(() => {
        // 1. Lire d'abord depuis localStorage pour affichage instantané
        try {
            const localFollowers = localStorage.getItem('dropsiders_promo_followers_count');
            const localPosts = localStorage.getItem('dropsiders_promo_posts_count');
            if (localFollowers && !isNaN(Number(localFollowers))) setFollowers(Number(localFollowers));
            if (localPosts && !isNaN(Number(localPosts))) setPostsCount(Number(localPosts));
        } catch (_) {}

        // 2. Charger les valeurs officielles depuis le serveur
        fetch('/api/instagram-feed')
            .then(res => res.json())
            .then(data => {
                if (data?.profile?.followers) {
                    const parsed = parseInt(String(data.profile.followers).replace(/\s+/g, ''));
                    if (!isNaN(parsed) && parsed > 0) setFollowers(parsed);
                }
                if (data?.profile?.postsCount) {
                    const parsed = parseInt(String(data.profile.postsCount).replace(/\s+/g, ''));
                    if (!isNaN(parsed) && parsed > 0) setPostsCount(parsed);
                }
            })
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveSuccess(false);

        // 1. Sauvegarde locale immédiate
        try {
            localStorage.setItem('dropsiders_promo_followers_count', String(followers));
            localStorage.setItem('dropsiders_promo_posts_count', String(postsCount));
        } catch (_) {}

        // 2. Sauvegarde sur le serveur Dropsiders (Cloudflare KV + GitHub)
        try {
            const res = await fetch('/api/instagram-feed/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profile: {
                        username: 'dropsiders.fr',
                        name: 'DROPSIDERS',
                        followers: followers.toLocaleString('fr-FR'),
                        postsCount: postsCount.toLocaleString('fr-FR'),
                        followingCount: followingCount.toLocaleString('fr-FR'),
                        url: 'https://www.instagram.com/dropsiders.fr/'
                    }
                })
            });

            if (res.ok) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 4000);
            }
        } catch (err) {
            console.error('Erreur sauvegarde stats instagram:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#07070a] text-white p-4 sm:p-8 pt-24 font-sans selection:bg-[#ff007f] selection:text-white">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/admin')}
                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all active:scale-95"
                            title="Retour au Tableau de Bord"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] rounded-xl">
                                    <Instagram className="w-5 h-5 text-white" />
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-display font-black uppercase italic tracking-tighter">
                                    Stats & Abonnés <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff007f] to-[#00f0ff]">Instagram</span>
                                </h1>
                            </div>
                            <p className="text-xs text-gray-400 font-medium mt-1">
                                Ajustez le nombre d'abonnés et de publications synchronisés avec le Social Studio et le site
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`px-5 py-3 rounded-2xl font-black uppercase tracking-wider text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg ${
                                saveSuccess
                                    ? 'bg-emerald-500 text-black shadow-emerald-500/20'
                                    : 'bg-gradient-to-r from-[#ff007f] to-[#bc1888] hover:from-[#ff1a8c] hover:to-[#cd2999] text-white shadow-[#ff007f]/25'
                            }`}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Enregistrement...</span>
                                </>
                            ) : saveSuccess ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Enregistré avec succès !</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Enregistrer les stats</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Notification succès */}
                {saveSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-bold flex items-center gap-3"
                    >
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>Les statistiques Instagram ont été mises à jour sur le serveur et sont désormais appliquées à tous vos appareils !</span>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Colonne Gauche : Formulaire de modification */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Section Abonnés */}
                        <div className="p-6 bg-dark-bg/80 border border-white/10 rounded-3xl backdrop-blur-xl shadow-xl space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                                    <Users className="w-4 h-4 text-[#00f0ff]" />
                                    <span>Nombre d'abonnés (Followers)</span>
                                </label>
                                <span className="text-[10px] font-mono font-bold text-[#00f0ff] bg-[#00f0ff]/10 border border-[#00f0ff]/30 px-2 py-0.5 rounded-full">
                                    {followers.toLocaleString('fr-FR')} abonnés
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={followers}
                                        onChange={(e) => setFollowers(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-full bg-black/60 border border-white/10 focus:border-[#00f0ff] rounded-2xl px-4 py-3 text-white text-lg font-mono font-black outline-none transition-all"
                                        placeholder="Ex: 4698"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setFollowers(Math.max(0, followers - 1))}
                                        className="px-3 py-3 bg-white/5 hover:bg-white/15 border border-white/10 rounded-xl text-white font-mono text-xs font-black active:scale-95 transition-all"
                                        title="-1 abonné"
                                    >
                                        -1
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFollowers(followers + 1)}
                                        className="px-3.5 py-3 bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 border border-[#00f0ff]/40 text-[#00f0ff] font-mono text-xs font-black rounded-xl active:scale-95 transition-all"
                                        title="+1 abonné"
                                    >
                                        +1
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFollowers(followers + 10)}
                                        className="px-3.5 py-3 bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 border border-[#00f0ff]/40 text-[#00f0ff] font-mono text-xs font-black rounded-xl active:scale-95 transition-all"
                                        title="+10 abonnés"
                                    >
                                        +10
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFollowers(followers + 100)}
                                        className="px-3 py-3 bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 border border-[#00f0ff]/40 text-[#00f0ff] font-mono text-xs font-black rounded-xl active:scale-95 transition-all"
                                        title="+100 abonnés"
                                    >
                                        +100
                                    </button>
                                </div>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                C'est ce chiffre qui apparaît au départ dans la vidéo slide promo du Social Studio, avant de passer à <strong>{(followers + 1).toLocaleString('fr-FR')}</strong> lors du clic animé sur « Suivre ».
                            </p>
                        </div>

                        {/* Section Publications */}
                        <div className="p-6 bg-dark-bg/80 border border-white/10 rounded-3xl backdrop-blur-xl shadow-xl space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-[#ff007f]" />
                                    <span>Nombre de publications</span>
                                </label>
                                <span className="text-[10px] font-mono font-bold text-[#ff007f] bg-[#ff007f]/10 border border-[#ff007f]/30 px-2 py-0.5 rounded-full">
                                    {postsCount.toLocaleString('fr-FR')} posts
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={postsCount}
                                        onChange={(e) => setPostsCount(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-full bg-black/60 border border-white/10 focus:border-[#ff007f] rounded-2xl px-4 py-3 text-white text-lg font-mono font-black outline-none transition-all"
                                        placeholder="Ex: 1441"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setPostsCount(Math.max(0, postsCount - 1))}
                                        className="px-3 py-3 bg-white/5 hover:bg-white/15 border border-white/10 rounded-xl text-white font-mono text-xs font-black active:scale-95 transition-all"
                                        title="-1 post"
                                    >
                                        -1
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPostsCount(postsCount + 1)}
                                        className="px-3.5 py-3 bg-[#ff007f]/20 hover:bg-[#ff007f]/30 border border-[#ff007f]/40 text-[#ff007f] font-mono text-xs font-black rounded-xl active:scale-95 transition-all"
                                        title="+1 post"
                                    >
                                        +1
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPostsCount(postsCount + 10)}
                                        className="px-3.5 py-3 bg-[#ff007f]/20 hover:bg-[#ff007f]/30 border border-[#ff007f]/40 text-[#ff007f] font-mono text-xs font-black rounded-xl active:scale-95 transition-all"
                                        title="+10 posts"
                                    >
                                        +10
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Section Abonnements */}
                        <div className="p-6 bg-dark-bg/80 border border-white/10 rounded-3xl backdrop-blur-xl shadow-xl space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                    <span>Nombre d'abonnements (Suivis)</span>
                                </label>
                                <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full">
                                    {followingCount.toLocaleString('fr-FR')} suivis
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={followingCount}
                                        onChange={(e) => setFollowingCount(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-full bg-black/60 border border-white/10 focus:border-purple-500 rounded-2xl px-4 py-3 text-white text-lg font-mono font-black outline-none transition-all"
                                        placeholder="Ex: 668"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bouton de raccourci vers le Social Studio */}
                        <div className="p-5 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-3xl flex items-center justify-between gap-4">
                            <div>
                                <h4 className="text-sm font-bold text-white">Tester le rendu vidéo</h4>
                                <p className="text-xs text-gray-400 mt-0.5">Ouvrez le Social Studio pour générer votre slide promo avec ces chiffres.</p>
                            </div>
                            <Link
                                to="/social-studio"
                                className="px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all"
                            >
                                <Play className="w-3.5 h-3.5" />
                                <span>Social Studio</span>
                            </Link>
                        </div>
                    </div>

                    {/* Colonne Droite : Aperçu direct de la carte Instagram */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="sticky top-28 space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Aperçu en direct</span>
                                <span className="text-[10px] text-gray-500">Mise à jour instantanée</span>
                            </div>

                            {/* Carte Instagram fidèle */}
                            <div className="bg-[#0b0b10] border border-white/15 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-5">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]" />

                                {/* Avatar + Stats */}
                                <div className="flex items-center gap-5">
                                    <div className="relative shrink-0">
                                        <div className="w-20 h-20 rounded-full p-[2.5px] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]">
                                            <div className="w-full h-full bg-black rounded-full overflow-hidden flex items-center justify-center p-1">
                                                <img
                                                    src="/logo_black.png"
                                                    alt="DROPSIDERS"
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '/DROPSIDERS_logo_blanc.svg';
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats 3 colonnes */}
                                    <div className="flex-1 grid grid-cols-3 text-center gap-1">
                                        <div>
                                            <div className="text-sm font-black text-white font-mono">{postsCount.toLocaleString('fr-FR')}</div>
                                            <div className="text-[9px] text-gray-400 lowercase">publications</div>
                                        </div>
                                        <div>
                                            <div className={`text-sm font-black font-mono transition-colors ${testFollowed ? 'text-[#00f0ff]' : 'text-white'}`}>
                                                {(testFollowed ? followers + 1 : followers).toLocaleString('fr-FR')}
                                            </div>
                                            <div className="text-[9px] text-gray-400 lowercase">abonnés</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-white font-mono">{followingCount.toLocaleString('fr-FR')}</div>
                                            <div className="text-[9px] text-gray-400 lowercase">abonnements</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Pseudo & Bio */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="text-sm font-black text-white">DROPSIDERS</h3>
                                        <span className="w-4 h-4 rounded-full bg-[#0095f6] text-white text-[9px] font-black flex items-center justify-center">✓</span>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium">@dropsiders.fr</p>
                                    <p className="text-xs text-gray-300 pt-1 leading-relaxed">
                                        La 1ère plateforme interactive consacrée à la musique électronique et aux festivals 🔥
                                    </p>
                                    <a
                                        href="https://www.instagram.com/dropsiders.fr/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-[#0095f6] font-bold inline-flex items-center gap-1 pt-1 hover:underline"
                                    >
                                        <span>instagram.com/dropsiders.fr</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>

                                {/* Bouton de simulation Suivre / Suivi */}
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setTestFollowed(!testFollowed)}
                                        className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 ${
                                            testFollowed
                                                ? 'bg-white/10 text-emerald-400 border border-emerald-500/30'
                                                : 'bg-[#0095f6] hover:bg-[#0081d6] text-white shadow-lg shadow-blue-500/20'
                                        }`}
                                    >
                                        {testFollowed ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>Suivi ✓ (Simulé +1)</span>
                                            </>
                                        ) : (
                                            <span>Suivre (Cliquez pour tester)</span>
                                        )}
                                    </button>
                                    <p className="text-[9.5px] text-gray-500 text-center mt-2 italic">
                                        Cliquez sur le bouton ci-dessus pour simuler l'animation du +1 follower !
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default AdminInstagram;
