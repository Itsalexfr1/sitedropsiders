import { motion } from 'framer-motion';
import { Instagram } from 'lucide-react';
import teamData from '../data/team.json';
import { useLanguage } from '../context/LanguageContext';

export function Team() {
    const { t } = useLanguage();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-16 text-center"
            >
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                    {t('team.title')}
                </h1>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {teamData.map((member, index) => (
                    <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative"
                    >
                        <a
                            href={member.socials.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative block overflow-hidden rounded-2xl aspect-[3/4] mb-6 group-hover:shadow-[0_0_30px_rgba(255,0,51,0.3)] transition-all duration-500"
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <Instagram className="w-10 h-10 text-white scale-0 group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <img
                                src={member.image}
                                alt={member.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter grayscale group-hover:grayscale-0"
                            />
                        </a>

                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-neon-red transition-colors">{member.name}</h3>
                            <p className="text-neon-red font-medium tracking-wider text-sm">{member.role}</p>
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
                    <a
                        href="mailto:contact@dropsiders.fr"
                        className="inline-flex items-center px-8 py-4 bg-neon-red text-white font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-neon-red transition-all duration-300 transform hover:scale-105"
                    >
                        {t('team.contact_btn')}
                    </a>
                </div>
            </motion.div>
        </div>
    );
}
