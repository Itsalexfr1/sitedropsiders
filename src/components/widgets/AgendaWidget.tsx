import { MapPin } from 'lucide-react';
import agendaData from '../../data/agenda.json';
import { Link } from 'react-router-dom';
import { useHoverSound } from '../../hooks/useHoverSound';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { getAgendaLink } from '../../utils/slugify';

export function AgendaWidget() {
    const { t, language } = useLanguage();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = agendaData
        .filter((event: any) => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= today;
        })
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 6);

    const playHoverSound = useHoverSound();

    const getEventStyles = (genre: string) => {
        const g = (genre || '').toLowerCase().trim();
        let color = 'cyan'; // Default

        if (g.includes('melodic')) color = 'yellow';
        else if (g.includes('techno')) color = 'red';
        else if (g.includes('tech house')) color = 'green';
        else if (g.includes('big room')) color = 'purple';
        else if (g.includes('house')) color = 'pink';
        else if (g.includes('hardmusic')) color = 'orange';
        else if (g.includes('multi-genre')) color = 'blue';

        const isMulti = g.includes('multi-genre');

        return {
            text: isMulti ? 'text-white' : `text-neon-${color}`,
            bg: isMulti ? 'bg-gradient-to-r from-neon-red via-neon-purple to-neon-blue bg-[length:200%_auto] animate-gradient-x opacity-90' : `bg-neon-${color}/20`,
            border: isMulti ? 'border-white/20' : `border-neon-${color}/20`,
            borderStrong: isMulti ? 'border-white/50' : `border-neon-${color}`,
            borderMedium: isMulti ? 'border-white/30' : `border-neon-${color}/30`,
            hoverBorder: isMulti ? 'hover:border-white/80' : `hover:border-neon-${color}/50`,
            hoverText: isMulti ? 'hover:text-white' : `hover:text-neon-${color}`,
            groupHoverText: isMulti ? 'group-hover:text-white' : `group-hover:text-neon-${color}`,
            shadow: isMulti ? 'hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]' : `hover:shadow-[0_0_15px_var(--color-neon-${color})]`
        };
    };

    const locale = language === 'fr' ? 'fr-FR' : 'en-US';

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            onMouseEnter={playHoverSound}
            className="bg-dark-bg/50 border border-white/10 rounded-2xl p-5 backdrop-blur-sm transition-all duration-300 hover:border-white/30"
        >
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-neon-yellow rounded-full animate-pulse shadow-[0_0_10px_#ffcc00]" />
                    {t('agenda.title').toUpperCase()}
                </h3>
                <Link to="/agenda" className="text-sm text-gray-400 hover:text-neon-yellow transition-colors">
                    {t('home.view_all_agenda')}
                </Link>
            </div>

            <div className="space-y-3">
                {upcomingEvents.map((event: any, index: number) => {
                    const styles = getEventStyles(event.genre);
                    return (
                        <Link
                            key={event.id}
                            to={getAgendaLink(event)}
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
                                className={`p-2.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 ${styles.hoverBorder} ${styles.shadow} transition-all duration-300`}
                            >
                                <div className="flex justify-between items-start mb-1.5">
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] font-bold ${styles.text} border ${styles.borderMedium} px-1.5 py-0 rounded-full w-fit mb-0.5`}>
                                            {event.type !== 'Events' && event.type}
                                            {event.type !== 'Events' && event.genre && <span className="opacity-70 ml-1">• </span>}
                                            {event.genre}
                                        </span>
                                        <h4 className={`text-[13px] font-bold text-white ${styles.groupHoverText} transition-all duration-300 line-clamp-1`}>{event.title}</h4>
                                    </div>
                                    <div className="text-center bg-white/5 rounded p-1 min-w-[2.5rem]">
                                        <span className={`block text-[8px] ${styles.text} font-bold uppercase leading-none mb-0.5`}>
                                            {new Date(event.date).toLocaleString(locale, { weekday: 'short' }).replace('.', '')}
                                        </span>
                                        <span className="block text-base font-bold text-white leading-none">
                                            {new Date(event.date).getDate()}
                                        </span>
                                        <span className="block text-[8px] text-gray-400 uppercase leading-none mt-0.5">
                                            {new Date(event.date).toLocaleString(locale, { month: 'short' }).replace('.', '')}
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
                    )
                })}
            </div>
        </motion.div>
    );
}
