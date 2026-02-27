import { MapPin } from 'lucide-react';
import agendaData from '../../data/agenda.json';
import { Link } from 'react-router-dom';
import { useHoverSound } from '../../hooks/useHoverSound';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { getAgendaLink } from '../../utils/slugify';
import { FlagIcon } from '../ui/FlagIcon';

export function AgendaWidget({ maxItems = 6, accentColor = 'cyan', resolvedColor }: { maxItems?: number, accentColor?: string, resolvedColor?: string }) {
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
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
        .slice(0, maxItems);

    const playHoverSound = useHoverSound();

    const getEventStyles = (genre: string) => {
        const g = (genre || '').toLowerCase().trim();
        let color = 'cyan'; // Default

        if (g.includes('melodic')) color = 'yellow';
        else if (g.includes('techno')) color = 'red';
        else if (g.includes('tech house')) color = 'blue';
        else if (g.includes('big room')) color = 'purple';
        else if (g.includes('house')) color = 'pink';
        else if (g.includes('hardmusic')) color = 'orange';
        else if (g.includes('multi styles')) color = 'blue';
        else if (g.includes('hybride')) color = 'red';

        const isMulti = g.includes('multi styles');
        const isHybride = g.includes('hybride');
        const isWhite = color === 'white';

        return {
            text: (isMulti || isHybride) ? 'text-white' : (isWhite ? 'text-white' : `text-neon-${color}`),
            bg: (isMulti || isHybride) ? 'bg-white/10' : (isWhite ? 'bg-white/10' : `bg-neon-${color}/30`),
            border: (isMulti || isHybride) ? 'border-white/20' : (isWhite ? 'border-white/20' : `border-neon-${color}/20`),
            borderStrong: (isMulti || isHybride) ? 'border-white/50' : (isWhite ? 'border-white/50' : `border-neon-${color}`),
            borderMedium: (isMulti || isHybride) ? 'border-white/30' : (isWhite ? 'border-white/30' : `border-neon-${color}/30`),
            hoverBorder: (isMulti || isHybride) ? 'hover:border-white/80' : (isWhite ? 'hover:border-white/80' : `hover:border-neon-${color}/50`),
            hoverText: (isMulti || isHybride) ? 'hover:text-white' : (isWhite ? 'hover:text-white' : `hover:text-neon-${color}`),
            groupHoverText: (isMulti || isHybride) ? 'group-hover:text-white' : (isWhite ? 'group-hover:text-white' : `group-hover:text-neon-${color}`),
            shadow: (isMulti || isHybride) ? 'hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]' : `hover:shadow-[0_0_15px_var(--color-neon-${color})]`,
            gradient: isMulti
                ? 'linear-gradient(to right, #00f0ff, #0070ff, #bd00ff)'
                : isHybride
                    ? 'linear-gradient(to right, #ffcc00, #ff6600, #ff0033)'
                    : undefined
        };
    };

    const locale = language === 'fr' ? 'fr-FR' : 'en-US';

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                    <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{
                            backgroundColor: color,
                            boxShadow: `0 0 10px ${color}`
                        }}
                    />
                    {t('home.agenda')}
                </h3>
                <Link
                    to="/agenda"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-[0.15em] transition-all duration-300 group bg-white/5"
                    style={{ borderColor: `${color}66`, color: 'white' }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = color;
                        e.currentTarget.style.boxShadow = `0 0 20px ${color}4D`;
                        e.currentTarget.style.backgroundColor = `${color}26`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${color}66`;
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }}
                >
                    {t('home.view_all_agenda')} <MapPin className="w-3 h-3 group-hover:scale-110 transition-transform" />
                </Link>
            </div>

            <div className="flex-1 space-y-3 mb-4">
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
                                    e.stopPropagation();
                                    playHoverSound();
                                }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                className={`p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 ${styles.hoverBorder} ${styles.shadow} transition-all duration-300`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col min-w-0 flex-1 mr-3">
                                        <div className="flex items-center flex-wrap gap-1 mb-1">
                                            <span
                                                className={`text-[9px] font-black ${styles.text} border ${styles.borderMedium} px-2 py-0.5 rounded-full uppercase tracking-tighter`}
                                                style={styles.gradient ? { backgroundImage: styles.gradient, border: 'none', color: 'white' } : {}}
                                            >
                                                {event.genre}
                                            </span>
                                            {event.isWeekly && (
                                                <span className="text-[8px] font-bold text-white bg-white/10 px-1.5 py-0.5 rounded-full border border-white/20 uppercase">
                                                    {language === 'fr' ? 'Hebdo' : 'Weekly'}
                                                </span>
                                            )}
                                        </div>
                                        <h4
                                            className={`font-display font-bold text-white ${styles.groupHoverText} transition-all duration-300 line-clamp-2 uppercase italic tracking-tighter text-sm`}
                                            title={event.title}
                                        >
                                            {event.title}
                                        </h4>
                                    </div>
                                    <div className="text-center bg-white/5 rounded-lg p-1.5 min-w-[3.2rem] border border-white/5 flex flex-col justify-center min-h-[3.2rem]">
                                        <span className={`block text-[6.5px] ${styles.text} font-bold uppercase leading-none mb-1 tracking-tighter`}>
                                            {event.startDate && event.endDate && event.startDate !== event.endDate ? (
                                                <>
                                                    {new Date(event.startDate).toLocaleString(locale, { weekday: 'short' }).replace('.', '')}
                                                    {"-"}
                                                    {new Date(event.endDate).toLocaleString(locale, { weekday: 'short' }).replace('.', '')}
                                                </>
                                            ) : (
                                                new Date(event.startDate || event.date).toLocaleString(locale, { weekday: 'short' }).replace('.', '')
                                            )}
                                        </span>
                                        <span className="block text-xs font-bold text-white leading-none">
                                            {new Date(event.date || event.startDate).getDate()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium z-10 relative">
                                    <span
                                        className="flex items-center gap-1.5 cursor-pointer hover:text-neon-red transition-colors"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            window.location.href = `/agenda?location=${encodeURIComponent(event.location)}`;
                                        }}
                                    >
                                        <MapPin className="w-3 h-3 text-neon-red" /> {event.location} <FlagIcon location={event.location} className="w-3 h-2" />
                                    </span>
                                </div>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>

            <Link
                to="/agenda"
                className="inline-block self-start px-6 py-2 text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-[0.2em] border border-white/5 rounded-lg hover:bg-white/5 transition-all"
                onMouseEnter={playHoverSound}
            >
                {t('home.all_events')}
            </Link>

            <div className="flex-1" />
        </div>
    );
}
