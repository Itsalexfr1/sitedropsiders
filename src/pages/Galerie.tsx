import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getGalleryLink } from '../utils/slugify';
import { MediaInteractions } from '../components/shared/MediaInteractions';
import { resolveImageUrl } from '../utils/image';
import { CommunityTabs } from '../components/community/CommunityTabs';
import { QuizSection } from '../components/community/QuizSection';
import { AvisSection } from '../components/community/AvisSection';
import { GuideSection } from '../components/community/GuideSection';
import { CovoitSection } from '../components/community/CovoitSection';
import { AlertsSection } from '../components/community/AlertsSection';
import { MemoryWall } from '../components/community/MemoryWall';
import { SEO } from '../components/utils/SEO';

const ALBUMS_PER_PAGE = 8;

export function Galerie() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'WALL' | 'UPLOADS' | 'QUIZZ' | 'AVIS' | 'GUIDE' | 'COVOIT' | 'ALERTS'>('WALL');
    const [activeSegment, setActiveSegment] = useState<'COMMUNITY' | 'CLIPS'>('COMMUNITY');
    const [isAdmin, setIsAdmin] = useState(false);
    const [clips, setClips] = useState<any[]>([]);
    const [selectedClip, setSelectedClip] = useState<any>(null);
    const [galerieData, setGalerieData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchGalerie = async () => {
            try {
                const res = await fetch('/api/galerie');
                if (res.ok) {
                    const data = await res.json();
                    setGalerieData(data);
                }
            } catch (error) {
                console.error('Failed to fetch galerie data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchGalerie();
    }, []);

    useEffect(() => {
        if (activeSegment === 'CLIPS') {
            fetch('/api/clips')
                .then(res => res.json())
                .then(data => {
                    setClips(data);
                })
                .catch(() => {});
        }
    }, [activeSegment]);

    useEffect(() => {
        setIsAdmin(localStorage.getItem('admin_auth') === 'true' || localStorage.getItem('modo_auth') === 'true');
    }, []);

    const filteredAlbums = useMemo(() => {
        return galerieData.filter(album => (album as any).isCommunity || (album.category || '').toLowerCase().includes('communauté'));
    }, [galerieData]);

    return (
        <div className="bg-dark-bg min-h-screen relative">
            {/* Background Ambient Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] bg-neon-red/10 animate-pulse transition-all duration-1000" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] bg-neon-cyan/5 animate-pulse [animation-delay:2s] transition-all duration-1000" />
            </div>

            <SEO
                title="Galerie & Souvenirs"
                description="Replongez dans l'ambiance des plus grands festivals avec nos galeries photos et vidéos exclusives. Les meilleurs moments, capturés pour vous."
            />
            <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-8"
                >
                    <div>
                        <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                            <div className="p-2 bg-neon-red/10 rounded-xl border border-neon-red/20 shadow-[0_0_15px_rgba(255,0,51,0.1)]">
                                <Camera className="w-5 h-5 text-neon-red" />
                            </div>
                            <span className="text-neon-red font-black tracking-[0.3em] text-[10px] uppercase">{t('communaute.badge')}</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-6 uppercase italic tracking-tighter leading-none">
                            LA <span className="text-neon-red shadow-[0_0_20px_rgba(255,0,51,0.4)]">COMMUNAUTÉ</span>
                        </h1>
                        <p className="text-gray-400 max-w-2xl text-base md:text-lg font-medium leading-relaxed mx-auto sm:mx-0">
                            Capturez l'instant, préservez l'émotion. Retrouvez ici les meilleurs moments partagés par la communauté sur les plus grands festivals du monde.
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/communaute/partager')}
                        className="group relative px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:bg-neon-red hover:text-white transition-all duration-500 overflow-hidden mx-auto sm:mx-0"
                    >
                        <span className="relative z-10 flex items-center gap-4">
                            Partager Album
                            <div className="p-2 bg-black text-white group-hover:bg-white group-hover:text-neon-red rounded-lg transition-colors">
                                <Camera className="w-4 h-4" />
                            </div>
                        </span>
                    </motion.button>
                </motion.div>

                <CommunityTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-8 bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-md">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-neon-red/10 rounded-full" />
                            <div className="absolute inset-0 w-20 h-20 border-t-4 border-neon-red rounded-full animate-spin" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-xl font-display font-black text-white italic uppercase tracking-tighter">DROPSIDERS <span className="text-neon-red">ARCHIVES</span></span>
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] animate-pulse">Initialisation du flux multimédia...</span>
                        </div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'WALL' && <MemoryWall galerieData={galerieData} />}

                        {activeTab === 'UPLOADS' && (
                            <div className="space-y-12">
                                <div className="max-w-4xl mx-auto py-12">
                                    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 md:p-20 backdrop-blur-3xl text-center space-y-10 shadow-2xl">
                                        <div className="inline-flex p-5 bg-neon-red/10 rounded-3xl">
                                            <Camera className="w-12 h-12 text-neon-red shadow-[0_0_20px_rgba(255,0,51,0.3)]" />
                                        </div>
                                        <div className="space-y-4">
                                            <h2 className="text-4xl md:text-6xl font-display font-black uppercase italic tracking-tighter text-white">
                                                VOS <span className="text-neon-red">PHOTOS</span>
                                            </h2>
                                            <p className="text-white/40 max-w-xl mx-auto text-[10px] font-black uppercase tracking-[0.3em] leading-loose">
                                                Partagez vos moments forts avec la communauté. Les meilleures photos seront exposées sur le Memory Wall.
                                            </p>
                                        </div>
                                        <div className="pt-6">
                                            <motion.button
                                                whileHover={{ scale: 1.05, y: -5 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => navigate('/communaute/partager')}
                                                className="px-16 py-6 bg-white text-black rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(255,255,255,0.05)] hover:bg-neon-red hover:text-white transition-all duration-500"
                                            >
                                                ENVOYER MES PHOTOS
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>

                                {/* Community Albums (Sub-section) */}
                                <div className="mt-20 opacity-40 hover:opacity-100 transition-opacity duration-700">
                                    <div className="text-center mb-12">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 italic">Archives Communautaires</h3>
                                    </div>
                                    <div className="flex flex-col items-center gap-1 mb-12">
                                        <div className="flex items-center gap-1 p-1.5 bg-white/5 rounded-[2rem] border border-white/10 w-fit">
                                            <button
                                                onClick={() => setActiveSegment('COMMUNITY')}
                                                className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeSegment === 'COMMUNITY' ? 'bg-white text-black shadow-xl scale-105' : 'text-white/30 hover:text-white'}`}
                                            >
                                                Albums Festivals
                                            </button>
                                            <button
                                                onClick={() => setActiveSegment('CLIPS')}
                                                className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeSegment === 'CLIPS' ? 'bg-white text-black shadow-xl scale-105' : 'text-white/30 hover:text-white'}`}
                                            >
                                                Les Clips
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                        {activeSegment === 'CLIPS' ? (
                                            clips.map(clip => (
                                                <div key={clip.id} className="group relative aspect-video bg-white/5 rounded-3xl overflow-hidden border border-white/10">
                                                    <video src={clip.url} className="w-full h-full object-cover opacity-60" muted loop playsInline onMouseOver={e => e.currentTarget.play()} onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} />
                                                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                                        <h4 className="text-xs font-black text-white uppercase italic">{clip.title}</h4>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            filteredAlbums.slice(0, ALBUMS_PER_PAGE).map(album => (
                                                <Link key={album.id} to={getGalleryLink(album)} className="group relative aspect-square bg-white/5 rounded-3xl overflow-hidden border border-white/10 hover:border-neon-red transition-all duration-500">
                                                    <img 
                                                        src={resolveImageUrl(album.cover)} 
                                                        className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" 
                                                        alt="" 
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent">
                                                        <h4 className="text-sm font-display font-black text-white uppercase italic tracking-tighter">{album.title}</h4>
                                                    </div>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'QUIZZ' && <QuizSection />}
                        {activeTab === 'AVIS' && <AvisSection />}
                        {activeTab === 'GUIDE' && <GuideSection />}
                        {activeTab === 'COVOIT' && <CovoitSection />}
                        {activeTab === 'ALERTS' && <AlertsSection />}
                    </>
                )}

                <AnimatePresence>
                    {selectedClip && (
                        <MediaInteractions
                            type="clip"
                            id={selectedClip.url}
                            videoUrl={selectedClip.url}
                            onClose={() => setSelectedClip(null)}
                            isAdmin={isAdmin}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
