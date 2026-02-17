import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, Filter, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import agendaData from '../data/agenda.json';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';

export function Agenda() {
    const { t, language } = useLanguage();
    const playHoverSound = useHoverSound();
    const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    // Available months based on upcoming events
    const months = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = agendaData.filter((event: any) => {
            const d = new Date(event.date);
            d.setHours(0, 0, 0, 0);
            return d >= today;
        });

        const monthKeys = new Set<string>();
        upcoming.forEach((event: any) => {
            const date = new Date(event.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthKeys.add(monthKey);
        });

        return Array.from(monthKeys).sort();
    }, []);

    // Set initial selected month
    useEffect(() => {
        if (!selectedMonth && months.length > 0) {
            setSelectedMonth(months[0]);
        }
    }, [months]);

    const CATEGORIES = [
        { id: 'ALL', label: t('agenda.filter_all') },
        { id: 'TECHNO', label: 'TECHNO' },
        { id: 'MELODIC TECHNO', label: 'MELODIC TECHNO' },
        { id: 'TECH HOUSE', label: 'TECH HOUSE' },
        { id: 'BIG ROOM', label: 'BIG ROOM' },
        { id: 'HOUSE', label: 'HOUSE' },
        { id: 'HARDMUSIC', label: 'HARDMUSIC' }
    ];

    // Filter events by category AND month
    const filteredEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return agendaData
            .filter((event: any) => {
                if (!event.date) return false;

                const eventDate = new Date(event.date);
                if (isNaN(eventDate.getTime())) return false;

                eventDate.setHours(0, 0, 0, 0);

                // Date filter (upcoming only)
                if (eventDate < today) return false;

                // Month filter
                if (selectedMonth) {
                    const [year, month] = selectedMonth.split('-');
                    if (eventDate.getFullYear() !== parseInt(year) || (eventDate.getMonth() + 1) !== parseInt(month)) {
                        return false;
                    }
                }

                // Category filter
                if (activeCategory === 'ALL') return true;

                const genre = (event.genre || '').toLowerCase();
                if (activeCategory === 'TECHNO') return genre === 'techno';
                if (activeCategory === 'MELODIC TECHNO') return genre === 'melodic techno';
                if (activeCategory === 'TECH HOUSE') return genre === 'tech house';
                if (activeCategory === 'BIG ROOM') return genre === 'big room';
                if (activeCategory === 'HOUSE') return genre === 'house';
                if (activeCategory === 'HARDMUSIC') return genre === 'hardmusic';

                return true;
            })
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [activeCategory, selectedMonth]);

    const formatMonthName = (monthKey: string) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const name = date.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' });
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    // Auto-expand event from URL parameter
    useEffect(() => {
        const eventId = searchParams.get('event');
        if (eventId) {
            const id = parseInt(eventId);
            // Find the event to select its month automatically
            const event = agendaData.find((e: any) => e.id === id);
            if (event) {
                const date = new Date(event.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                setSelectedMonth(monthKey);
            }
            setExpandedEvent(id);
            // Remove the parameter from URL after opening
            setSearchParams({});
            // Scroll to the event after a short delay
            setTimeout(() => {
                const element = document.getElementById(`event-${id}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }, [searchParams, setSearchParams]);

    const toggleEvent = (eventId: number) => {
        const wasExpanded = expandedEvent === eventId;
        setExpandedEvent(wasExpanded ? null : eventId);

        if (!wasExpanded) {
            setTimeout(() => {
                const posterElement = document.getElementById(`poster-${eventId}`);
                if (posterElement) {
                    posterElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 350);
        }
    };

    const getEventStyles = (genre: string) => {
        const g = (genre || '').toLowerCase().trim();
        let color = 'cyan';

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
            bg: isMulti ? 'bg-gradient-to-r from-neon-red via-neon-purple to-neon-blue bg-[length:200%_auto] animate-gradient-x opacity-90' : `bg-neon-${color}/30`,
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/5 rounded-lg">
                        <Filter className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-gray-400 font-bold tracking-widest text-sm uppercase">{t('agenda.badge')}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                    {t('agenda.title')} <span className="text-gray-500">{t('agenda.title_span')}</span>
                </h1>
                <p className="text-gray-400 max-w-2xl">
                    {t('agenda.subtitle')}
                </p>
            </motion.div>

            {/* Month Selection */}
            <div className="mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => {
                                const currentIndex = months.indexOf(selectedMonth || '');
                                if (currentIndex > 0) setSelectedMonth(months[currentIndex - 1]);
                            }}
                            disabled={months.indexOf(selectedMonth || '') <= 0}
                            className="p-3 rounded-xl border border-white/10 bg-white/5 text-white hover:border-neon-red hover:text-neon-red disabled:opacity-20 disabled:hover:border-white/10 disabled:hover:text-white transition-all group"
                            onMouseEnter={playHoverSound}
                        >
                            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>

                        <div className="flex flex-col">
                            <h2 className="text-4xl md:text-5xl font-display font-black text-white hover:text-neon-red transition-colors duration-300 cursor-default uppercase italic tracking-tighter">
                                {selectedMonth ? formatMonthName(selectedMonth) : 'Chargement...'}
                            </h2>
                            <div className="flex items-center gap-2 text-neon-red mt-2">
                                <Calendar className="w-3 h-3" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('agenda.badge')}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                const currentIndex = months.indexOf(selectedMonth || '');
                                if (currentIndex !== -1 && currentIndex < months.length - 1) setSelectedMonth(months[currentIndex + 1]);
                            }}
                            disabled={selectedMonth ? months.indexOf(selectedMonth) >= months.length - 1 : true}
                            className="p-3 rounded-xl border border-white/10 bg-white/5 text-white hover:border-neon-red hover:text-neon-red disabled:opacity-20 disabled:hover:border-white/10 disabled:hover:text-white transition-all group"
                            onMouseEnter={playHoverSound}
                        >
                            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                        {months.map((monthKey) => (
                            <button
                                key={monthKey}
                                onClick={() => setSelectedMonth(monthKey)}
                                onMouseEnter={playHoverSound}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 border flex-shrink-0 ${selectedMonth === monthKey
                                    ? 'bg-neon-red border-neon-red text-white shadow-[0_0_15px_rgba(255,0,51,0.4)]'
                                    : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                {monthKey.split('-')[1]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-4 mb-12">
                <div className="flex items-center gap-2 text-gray-400 mr-2">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase tracking-wider">{t('agenda.filter_by')}</span>
                </div>
                {CATEGORIES.map((cat) => (
                    <motion.button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        whileHover={{ scale: 1.05 }}
                        onMouseEnter={playHoverSound}
                        className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest transition-all duration-300 border ${activeCategory === cat.id
                            ? 'bg-neon-red border-neon-red text-white shadow-[0_0_15px_rgba(255,0,51,0.5)]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                            }`}
                    >
                        {cat.label}
                    </motion.button>
                ))}
            </div>

            {/* Event List */}
            <div className="space-y-4">
                <AnimatePresence mode='popLayout'>
                    {filteredEvents.length > 0 ? (
                        filteredEvents.map((event: any, index: number) => {
                            const styles = getEventStyles(event.genre);
                            return (
                                <motion.div
                                    id={`event-${event.id}`}
                                    key={event.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    whileHover={{ scale: 1.01 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`group bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all duration-300 ${styles.hoverBorder} ${styles.shadow}`}
                                >
                                    <div
                                        onClick={() => toggleEvent(event.id)}
                                        onMouseEnter={playHoverSound}
                                        className="p-6 cursor-pointer hover:bg-white/10 transition-all duration-300"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-center gap-6">
                                                <div className="flex-shrink-0 text-center bg-dark-bg border border-white/10 rounded-lg p-3 w-20">
                                                    <span className={`block text-xs ${styles.text} font-bold uppercase mb-1`}>
                                                        {new Date(event.date).toLocaleString(locale, { weekday: 'short' }).replace('.', '')}
                                                    </span>
                                                    <span className="block text-2xl font-bold text-white leading-none mb-1">
                                                        {new Date(event.date).getDate()}
                                                    </span>
                                                    <span className="block text-xs text-gray-400 uppercase">
                                                        {new Date(event.date).toLocaleString(locale, { month: 'short' }).replace('.', '')}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${styles.bg} ${styles.text} mb-2`}>
                                                        {event.type} {event.genre && <span className="opacity-70 ml-1">• {event.genre}</span>}
                                                    </span>
                                                    <h3 className={`text-xl font-bold text-white ${styles.hoverText} transition-all duration-300 mb-1`}>
                                                        {event.title}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                                        <span className="flex items-center gap-1"><MapPin className={`w-4 h-4 ${styles.text}`} /> {event.location}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <a
                                                    href={event.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onMouseEnter={(e) => e.stopPropagation()}
                                                    className={`px-6 py-2 rounded-lg bg-white/10 ${styles.bg} ${styles.hoverText} transition-all duration-300 text-sm font-bold whitespace-nowrap border ${styles.borderMedium} ${styles.hoverBorder} uppercase tracking-tight`}
                                                >
                                                    Infos / Tickets
                                                </a>
                                                <ChevronDown
                                                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedEvent === event.id ? 'rotate-180' : ''}`}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable Poster Section */}
                                    <AnimatePresence>
                                        {expandedEvent === event.id && event.image && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="overflow-hidden border-t border-white/10"
                                            >
                                                <div id={`poster-${event.id}`} className="p-6 bg-black/20">
                                                    <a
                                                        href={event.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block group/poster"
                                                    >
                                                        <img
                                                            src={event.image}
                                                            alt={`${event.title} poster`}
                                                            className="w-full max-w-2xl mx-auto rounded-xl shadow-2xl cursor-pointer transition-transform duration-300 group-hover/poster:scale-105"
                                                        />
                                                    </a>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-xl">
                            <p className="text-gray-400 text-lg">Aucun événement trouvé pour cette sélection</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
