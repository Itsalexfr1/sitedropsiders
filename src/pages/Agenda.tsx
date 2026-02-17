import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, Filter } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import agendaData from '../data/agenda.json';
import { useHoverSound } from '../hooks/useHoverSound';

const CATEGORIES = ['TOUT', 'TECHNO', 'MELODIC TECHNO', 'TECH HOUSE', 'BIG ROOM', 'HOUSE', 'HARDMUSIC'];

export function Agenda() {
    const playHoverSound = useHoverSound();
    const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
    const [activeCategory, setActiveCategory] = useState('TOUT');
    const [searchParams, setSearchParams] = useSearchParams();

    // Filter out past events and handle category filtering
    const filteredEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return agendaData
            .filter((event: any) => {
                if (!event.date) return false;

                const eventDate = new Date(event.date);
                if (isNaN(eventDate.getTime())) return false; // Invalid date check

                eventDate.setHours(0, 0, 0, 0);

                // Date filter
                const isUpcoming = eventDate >= today;
                if (!isUpcoming) return false;

                // Category filter
                if (activeCategory === 'TOUT') return true;

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
    }, [activeCategory]);

    // Auto-expand event from URL parameter
    useEffect(() => {
        const eventId = searchParams.get('event');
        if (eventId) {
            const id = parseInt(eventId);
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

        // Scroll to poster after opening
        if (!wasExpanded) {
            setTimeout(() => {
                const posterElement = document.getElementById(`poster-${eventId}`);
                if (posterElement) {
                    posterElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 350); // Wait for animation to complete
        }
    };

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
                    <span className="text-gray-400 font-bold tracking-widest text-sm uppercase">Événements</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                    AGENDA <span className="text-gray-500">2026</span>
                </h1>
                <p className="text-gray-400 max-w-2xl">
                    Découvrez les événements à venir. Des festivals massifs aux sets de clubs intimes.
                </p>
            </motion.div>

            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-4 mb-12">
                <div className="flex items-center gap-2 text-gray-400 mr-2">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase tracking-wider">Filtrer par :</span>
                </div>
                {CATEGORIES.map((cat) => (
                    <motion.button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        whileHover={{ scale: 1.05 }}
                        onMouseEnter={playHoverSound}
                        className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest transition-all duration-300 border ${activeCategory === cat
                            ? 'bg-neon-red border-neon-red text-white shadow-[0_0_15px_rgba(255,0,51,0.5)]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                            }`}
                    >
                        {cat}
                    </motion.button>
                ))}
            </div>

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
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ delay: index * 0.1 }}
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
                                                        {new Date(event.date).toLocaleString('fr-FR', { weekday: 'short' }).replace('.', '')}
                                                    </span>
                                                    <span className="block text-2xl font-bold text-white leading-none mb-1">
                                                        {new Date(event.date).getDate()}
                                                    </span>
                                                    <span className="block text-xs text-gray-400 uppercase">
                                                        {new Date(event.date).toLocaleString('fr-FR', { month: 'short' }).replace('.', '')}
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
                                                    className={`px-6 py-2 rounded-lg bg-white/10 ${styles.bg} ${styles.hoverText} transition-all duration-300 text-sm font-medium whitespace-nowrap border ${styles.borderMedium} ${styles.hoverBorder}`}
                                                >
                                                    SITE OFFICIEL
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
                            <p className="text-gray-400 text-lg">Aucun événement à venir pour le moment</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
