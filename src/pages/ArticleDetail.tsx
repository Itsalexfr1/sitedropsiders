import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Share2, ArrowLeft } from 'lucide-react';
import newsData from '../data/news.json';

export function ArticleDetail() {
    const { id } = useParams();
    const article = newsData.find(item => item.id === parseInt(id || ''));

    if (!article) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark-bg">
                <div className="text-center px-4">
                    <h2 className="text-4xl font-display font-black text-white mb-8 tracking-tighter uppercase">Page Intraçable</h2>
                    <Link to="/" className="text-neon-red hover:text-white transition-colors font-black uppercase tracking-[0.3em] text-xs">
                        Retourner à la home
                    </Link>
                </div>
            </div>
        );
    }

    const relatedArticles = newsData
        .filter(item => item.id !== article.id && item.category === article.category)
        .slice(0, 3);

    let cleanedContent = (article as any).content;

    // 1. Nettoyage DRASTIQUE des doublons et des titres répétitifs
    // Suppression de l'image de couverture (déjà en Hero)
    const coverRegex = /<picture[^>]*>[\s\S]*?<\/picture>|<img[^>]*>/i;
    cleanedContent = cleanedContent.replace(coverRegex, '');

    // Suppression de TOUS les titres H1/H2 dans le contenu qui répètent souvent le titre de l'article
    cleanedContent = cleanedContent.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '');

    // On enlève toutes les iframes/vidéos du corps (déjà gérées par la section dédiée)
    cleanedContent = cleanedContent.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
    cleanedContent = cleanedContent.replace(/<div[^>]*class="[^"]*jw-html-wrapper[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

    // Suppression du module de commentaires et des sections de pagination/partage en bas d'article
    cleanedContent = cleanedContent.replace(/<div[^>]*class="[^"]*jw-comment-module[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

    // Suppression ROBUSTE de la pagination (supporte les tags imbriqués)
    cleanedContent = cleanedContent.replace(/<[^>]*class="[^"]*jw-news-page-pagination[^"]*"[^>]*>[\s\S]*?<\/(p|div)>/gi, '');

    // Suppression des liens "Précédent / Suivant" résiduels
    cleanedContent = cleanedContent.replace(/<a[^>]*>[\s\S]*?&laquo;[\s\S]*?<\/a>/gi, '');
    cleanedContent = cleanedContent.replace(/<a[^>]*>[\s\S]*?&raquo;[\s\S]*?<\/a>/gi, '');
    cleanedContent = cleanedContent.replace(/<a[^>]*>[\s\S]*?Précédent[\s\S]*?<\/a>/gi, '');
    cleanedContent = cleanedContent.replace(/<a[^>]*>[\s\S]*?Suivant[\s\S]*?<\/a>/gi, '');

    // Au cas où le texte est hors de la balise <a> (nettoyage agressif des blocs de navigation)
    cleanedContent = cleanedContent.replace(/<[^>]*class="[^"]*jw-news-page-pagination[^"]*"[^>]*>[\s\S]*?<\/(p|div)>/gi, '');

    // Suppression des séparateurs et résidus de mise en page Webador
    cleanedContent = cleanedContent.replace(/<div[^>]*class="[^"]*jw-element-separator-padding[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleanedContent = cleanedContent.replace(/<div[^>]*class="[^"]*jw-strip[^"]*"[^>]*>[\s\S]*?<form[\s\S]*?<\/form>[\s\S]*?<\/div>/gi, '');

    // Suppression du texte "Publié le ..." souvent présent dans le meta-data scrappé
    cleanedContent = cleanedContent.replace(/Publié le[^<]*/gi, '');
    cleanedContent = cleanedContent.replace(/<div[^>]*class="[^"]*jw-news-page__meta[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

    // 2. Suppression des DIVs fantômes et espaces vides
    cleanedContent = cleanedContent
        .replace(/<p>\s*(&nbsp;)*\s*<\/p>/gi, '') // Paragraphes vides
        .replace(/<div[^>]*>\s*<\/div>/gi, '')   // Divs vides
        .replace(/<br\s*\/?>/gi, '')              // Suppression de TOUS les <br> (on laisse le CSS gérer l'espacement)
        .replace(/&nbsp;/g, ' ')
        .trim();

    // 3. Traitement du texte brut (conversion des retours à la ligne en paragraphes si nécessaire)
    if (!cleanedContent.includes('<p') && !cleanedContent.includes('<div')) {
        cleanedContent = cleanedContent
            .split('\n\n')
            .filter((p: string) => p.trim().length > 0)
            .map((p: string) => `<p>${p.trim()}</p>`)
            .join('');
    }

    // 4. Traitement spécifique par catégorie
    if (article.category === 'Interview' || article.category === 'Interviews') {
        cleanedContent = cleanedContent.replace(/<picture[^>]*>[\s\S]*?<\/picture>|<img[^>]*>/gi, '');
        cleanedContent = cleanedContent.replace(/<strong>(.*?)<\/strong>/g, '<span class="interview-q">$1</span>');
    }

    return (
        <div className="bg-dark-bg min-h-screen">
            {/* 1. HEADER (WIDGET IMAGE) - ÉLARGISSEMENT & RESPIRATION */}
            <header className="relative w-full flex flex-col items-center pt-24 pb-12">
                <div className="w-full max-w-4xl mx-auto px-4 h-auto">
                    <div className="relative w-full h-auto rounded-[2rem] overflow-hidden shadow-2xl border border-white/5">
                        <img
                            src={article.image}
                            alt={article.title}
                            className="w-full h-auto block"
                            style={{ width: '100%', height: 'auto' }}
                        />
                        {/* Overlay d'assombrissement pour le texte */}
                        <div className="absolute inset-0 bg-black/40 z-10" />

                        {/* Titre superposé */}
                        <div className="absolute inset-0 z-20 flex items-center justify-center p-8 text-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                <span className="inline-block px-4 py-1.5 bg-neon-red text-white text-[10px] font-black tracking-[0.3em] uppercase rounded-full shadow-lg">
                                    {article.category}
                                </span>

                                <h1 className="text-2xl md:text-5xl lg:text-6xl font-display font-black text-white leading-[1.1] tracking-tighter uppercase drop-shadow-[0_5px_15px_rgba(0,0,0,1)]">
                                    {article.title}
                                </h1>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </header>

            {/* 2. COLONNE ÉDITORIALE - ÉLARGIE (W-FULL) */}
            <main className="relative z-30 pb-32">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="bg-dark-bg border border-white/5 rounded-[2rem] p-8 md:p-12 lg:p-20 shadow-2xl">

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                            {/* CONTENU PRINCIPAL */}
                            <div className="lg:col-span-8">
                                {/* Barre d'infos & Partage */}
                                <div className="flex items-center justify-between mb-16 pb-8 border-b border-white/5">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-neon-red" />
                                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest text-[10px]">LECTURE : 5 MIN</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 uppercase tracking-widest ml-8">
                                            {new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <button className="p-3 rounded-full bg-white/5 hover:bg-neon-red/20 hover:text-neon-red transition-all">
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* CORPS DE L'ARTICLE */}
                                <article
                                    className="article-body-premium w-full"
                                    dangerouslySetInnerHTML={{ __html: cleanedContent }}
                                />

                                {/* SECTION VIDÉO - Priorité pour Interviews & Récaps */}
                                {article.youtubeId && (
                                    <section className="mt-20 pt-20 border-t border-white/5">
                                        <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-3xl shadow-neon-red/5 animate-glow">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${article.youtubeId}?autoplay=0&rel=0&controls=1`}
                                                title={article.title}
                                                className="absolute top-0 left-0 w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                    </section>
                                )}

                                {/* GALLERY SECTION - For Recaps */}
                                {(article as any).gallery && (article as any).gallery.length > 0 && (
                                    <section className="mt-20 pt-20 border-t border-white/5">
                                        <h3 className="text-2xl font-display font-black text-white mb-10 tracking-tighter uppercase italic text-center">Galerie Photos</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                                            {(article as any).gallery.map((img: string, idx: number) => (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    whileInView={{ opacity: 1, scale: 1 }}
                                                    viewport={{ once: true }}
                                                    className="aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 relative group shadow-2xl"
                                                >
                                                    <img
                                                        src={img}
                                                        alt={`Gallery ${idx + 1}`}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-neon-red/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                </motion.div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Retour Home */}
                                <div className="mt-24 pt-16 border-t border-white/5 flex justify-center">
                                    <Link
                                        to="/"
                                        className="group flex flex-col items-center gap-4 py-4"
                                    >
                                        <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:border-white transition-all duration-300">
                                            <ArrowLeft className="w-6 h-6 text-white group-hover:text-black" />
                                        </div>
                                        <span className="text-[10px] font-black tracking-widest text-gray-500 group-hover:text-white uppercase transition-colors">Retour accueil</span>
                                    </Link>
                                </div>
                            </div>

                            {/* SIDEBAR - À LIRE AUSSI & NEWSLETTER */}
                            <aside className="lg:col-span-4 space-y-12">
                                <div className="sticky top-32 space-y-12">
                                    {/* À lire aussi */}
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                        <h3 className="text-base font-display font-black text-white uppercase tracking-tighter mb-8 italic">À lire aussi</h3>
                                        <div className="space-y-6">
                                            {relatedArticles.map(rel => (
                                                <Link key={rel.id} to={`/${rel.category.toLowerCase()}/${rel.id}`} className="group block space-y-4 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                                                    <div className="aspect-video rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 border border-white/5">
                                                        <img src={rel.image} alt={rel.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <span className="text-[9px] font-black text-neon-red tracking-widest uppercase">{rel.category}</span>
                                                        <h4 className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors leading-snug uppercase tracking-tight line-clamp-2">
                                                            {rel.title}
                                                        </h4>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Newsletter Widget */}
                                    <div className="bg-gradient-to-br from-neon-red/10 to-neon-purple/10 border border-neon-red/20 rounded-2xl p-8 text-center space-y-6 relative overflow-hidden">
                                        {/* Decorative glow */}
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-neon-red/20 blur-3xl rounded-full" />

                                        <div className="relative z-10 space-y-4">
                                            <div className="w-16 h-16 mx-auto bg-neon-red/20 rounded-full flex items-center justify-center border border-neon-red/30">
                                                <svg className="w-8 h-8 text-neon-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>

                                            <div className="space-y-2">
                                                <h4 className="text-lg font-display font-black text-white uppercase italic tracking-tight">Rejoignez-nous</h4>
                                                <p className="text-xs text-gray-400 uppercase tracking-wide leading-relaxed">
                                                    Recevez l'actu des festivals en avant-première
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                <input
                                                    type="email"
                                                    placeholder="votre@email.com"
                                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-neon-red/50 transition-colors"
                                                />
                                                <button className="w-full py-3 bg-neon-red hover:bg-neon-red/80 text-white text-xs font-black uppercase rounded-xl transition-all duration-300 shadow-lg shadow-neon-red/20 hover:shadow-neon-red/40">
                                                    S'abonner
                                                </button>
                                            </div>

                                            <p className="text-[9px] text-gray-600 uppercase tracking-widest">
                                                +60 000 passionnés nous suivent
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>
                </div>
            </main >

            {/* 3. ARTICLES LIÉS */}
            < section className="bg-black/20 py-32 border-t border-white/5" >
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl font-display font-black text-white mb-16 tracking-tighter uppercase italic text-center">À lire ensuite</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {relatedArticles.map(rel => (
                            <Link key={rel.id} to={`/${rel.category.toLowerCase()}/${rel.id}`} className="group block space-y-6">
                                <div className="aspect-[16/10] rounded-2xl overflow-hidden border border-white/5 relative shadow-xl">
                                    <img src={rel.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" alt={rel.title} />
                                </div>
                                <div className="space-y-3">
                                    <span className="text-[9px] font-black text-neon-red tracking-widest uppercase">{rel.category}</span>
                                    <h4 className="text-lg font-bold text-gray-300 group-hover:text-white transition-colors line-clamp-2 leading-tight uppercase font-display italic">
                                        {rel.title}
                                    </h4>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section >
        </div >
    );
}
