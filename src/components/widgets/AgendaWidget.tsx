import { MapPin } from 'lucide-react';
import agendaData from '../../data/agenda.json';
import { Link } from 'react-router-dom';
import { useHoverSound } from '../../hooks/useHoverSound';
import { motion } from 'framer-motion';

export function AgendaWidget() {
    const upcomingEvents = agendaData.slice(0, 6);
    const playHoverSound = useHoverSound();

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            onMouseEnter={playHoverSound}
            className="bg-dark-bg/50 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-neon-yellow/50 transition-colors duration-300"
        >
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-neon-yellow rounded-full animate-pulse shadow-[0_0_10px_#ffcc00]" />
                    AGENDA
                </h3>
                <Link to="/agenda" className="text-sm text-gray-400 hover:text-neon-yellow transition-colors">
                    TOUT VOIR
                </Link>
            </div>

            <div className="space-y-3">
                {upcomingEvents.map((event, index) => (
                    <Link
                        key={event.id}
                        to="/agenda"
                        className="block"
                    >
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.02, x: 5 }}
                            onMouseEnter={(e) => {
                                e.stopPropagation(); // Avoid double sound from parent
                                playHoverSound();
                            }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 + 0.2 }}
                            className="p-2.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-neon-yellow/50 hover:shadow-[0_0_15px_rgba(255,204,0,0.1)] transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-1.5">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-neon-yellow border border-neon-yellow/30 px-1.5 py-0 rounded-full w-fit mb-0.5">
                                        {event.type}
                                    </span>
                                    <h4 className="text-[13px] font-bold text-white group-hover:text-neon-yellow transition-colors line-clamp-1">{event.title}</h4>
                                </div>
                                <div className="text-center bg-white/5 rounded p-1 min-w-[2.5rem]">
                                    <span className="block text-[8px] text-gray-400 uppercase leading-none">
                                        {new Date(event.date).toLocaleString('fr-FR', { month: 'short' }).replace('.', '')}
                                    </span>
                                    <span className="block text-base font-bold text-white leading-none mt-0.5">
                                        {new Date(event.date).getDate()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-[10px] text-gray-500">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5" /> {event.location}
                                </span>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </motion.div>
    );
}
