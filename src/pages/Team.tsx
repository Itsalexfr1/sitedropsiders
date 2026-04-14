import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { TeamContactModal } from '../components/widgets/TeamContactModal';
import { resolveImageUrl } from '../utils/image';
import { Instagram, Music } from 'lucide-react';

export function Team() {
    const { t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [teamData, setTeamData] = useState<any[]>([]);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const res = await fetch('/api/team');
                if (res.ok) {
                    setTeamData(await res.json());
                }
            } catch (e) {
                console.error('Error fetching team:', e);
            }
        };
        fetchTeam();
    }, []);

    return (
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-16 text-center"
            >
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                    {t('team.title')}
                </h1>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-10">
                {teamData.map((member, index) => (
                    <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative"
                    >
                        <div className="relative block overflow-hidden rounded-2xl aspect-square mb-4 group-hover:shadow-[0_0_30px_rgba(255,0,51,0.3)] transition-all duration-500 max-w-[200px] mx-auto border border-white/5">
                            <div className="absolute inset-0 bg-black/40 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 backdrop-blur-[2px]">
                                <a
                                    href={member.socials.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-neon-red/20 hover:border-neon-red/50 hover:scale-110 transition-all duration-300 backdrop-blur-xl group/social"
                                >
                                    <Instagram className="w-6 h-6 text-white opacity-80 group-hover/social:opacity-100 group-hover/social:text-neon-red transition-all duration-300" />
                                </a>
                                {member.socials.tiktok && member.socials.tiktok !== '#' && (
                                    <a
                                        href={member.socials.tiktok}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-neon-red/20 hover:border-neon-red/50 hover:scale-110 transition-all duration-300 backdrop-blur-xl group/social"
                                    >
                                        <Music className="w-5 h-5 text-white opacity-80 group-hover/social:opacity-100 group-hover/social:text-neon-red transition-all duration-300" />
                                    </a>
                                )}
                            </div>
                            <img
                                src={resolveImageUrl(member.image)}
                                alt={member.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter grayscale group-hover:grayscale-0"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1887&auto=format&fit=crop';
                                }}
                            />
                        </div>

                        <div className="text-center">
                            <h3 className="text-sm md:text-base font-bold text-white mb-0.5 group-hover:text-neon-red transition-colors">{member.name}</h3>
                            <p className="text-neon-red font-medium tracking-wider text-[10px] md:text-xs uppercase">{member.role}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Join Us Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-32 p-12 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 text-center relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-neon-red/10 blur-[100px] pointer-events-none" />
                <div className="relative z-10">
                    <h2 className="text-3xl font-display font-black text-white mb-6 uppercase italic">{t('team.join_title')}</h2>
                    <p className="text-gray-400 max-w-xl mx-auto mb-10 text-lg">
                        {t('team.join_desc')}
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-8 py-4 bg-neon-red text-white font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-neon-red transition-all duration-300 transform hover:scale-105"
                    >
                        {t('team.contact_btn')}
                    </button>
                </div>
            </motion.div>

            <TeamContactModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div >
    );
}
