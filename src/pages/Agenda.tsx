import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import agendaData from '../data/agenda.json';
import { useHoverSound } from '../hooks/useHoverSound';

export function Agenda() {
    const playHoverSound = useHoverSound();
    const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    // Filter out past events
    const upcomingEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset to start of day
        return agendaData
            .filter((event: any) => {
                const eventDate = new Date(event.date);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate >= today;
            })
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, []);

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

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-neon-red/10 rounded-lg">
                        <svg className="w-6 h-6 text-neon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="text-neon-red font-bold tracking-widest text-sm uppercase">Événements</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                    AGENDA <span className="text-neon-red">FESTIVALS</span>
                </h1>
                <p className="text-gray-400 max-w-2xl">
                    Découvrez les événements à venir. Des festivals massifs aux sets de clubs intimes.
                </p>
            </motion.div>

            <div className="space-y-4">
                {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event: any, index: number) => (
                        <motion.div
                            id={`event-${event.id}`}
                            key={event.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.02 }}
                            transition={{ delay: index * 0.1 }}
                            className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-neon-red/50 transition-all duration-300"
                        >
                            <div
                                onClick={() => toggleEvent(event.id)}
                                onMouseEnter={playHoverSound}
                                className="p-6 cursor-pointer hover:bg-white/10 transition-all duration-300"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="flex-shrink-0 text-center bg-dark-bg border border-white/10 rounded-lg p-3 w-20">
                                            <span className="block text-sm text-gray-400 uppercase">
                                                {new Date(event.date).toLocaleString('fr-FR', { month: 'short' }).replace('.', '')}
                                            </span>
                                            <span className="block text-2xl font-bold text-white">
                                                {new Date(event.date).getDate()}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-neon-red/10 text-neon-red mb-2">
                                                {event.type}
                                            </span>
                                            <h3 className="text-xl font-bold text-white group-hover:text-neon-red transition-colors mb-1">
                                                {event.title}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {event.location}</span>
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
                                            className="px-6 py-2 rounded-lg bg-white/10 hover:bg-neon-red hover:text-white transition-colors text-sm font-medium whitespace-nowrap"
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
                    ))
                ) : (
                    <div className="text-center py-20 bg-white/5 border border-white/10 rounded-xl">
                        <p className="text-gray-400 text-lg">Aucun événement à venir pour le moment</p>
                    </div>
                )}
            </div>
        </div>
    );
}
