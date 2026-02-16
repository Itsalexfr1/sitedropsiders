import { motion } from 'framer-motion';
import { Instagram } from 'lucide-react';
import teamData from '../data/team.json';

export function Team() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-16 text-center"
            >
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                    NOTRE ÉQUIPE
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
                        <div className="relative overflow-hidden rounded-2xl aspect-[3/4] mb-6">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <img
                                src={member.image}
                                alt={member.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 filter grayscale group-hover:grayscale-0"
                            />

                            <div className="absolute bottom-0 left-0 right-0 z-20 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                <div className="flex justify-center gap-4">
                                    {member.socials.instagram && (
                                        <a href={member.socials.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-neon-red hover:text-white transition-colors">
                                            <Instagram className="w-5 h-5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

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
                    <h2 className="text-3xl font-display font-black text-white mb-6 uppercase italic">REJOINDRE L'AVENTURE</h2>
                    <p className="text-gray-400 max-w-xl mx-auto mb-10 text-lg">
                        Vous êtes passionné par la musique électronique et les festivals ? Vous aimez écrire, photographier ou filmer ?
                        On recherche toujours de nouveaux talents pour agrandir l'équipe.
                    </p>
                    <a
                        href="mailto:contact@dropsiders.fr"
                        className="inline-flex items-center px-8 py-4 bg-neon-red text-white font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-neon-red transition-all duration-300 transform hover:scale-105"
                    >
                        Nous Contacter
                    </a>
                </div>
            </motion.div>
        </div>
    );
}
