import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { MapPin, ChevronDown, Filter, ChevronLeft, ChevronRight, X, Edit2, Trash2, CheckSquare, Square, Plus } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';
import { getAuthHeaders } from '../utils/auth';
import { AgendaModal } from '../components/AgendaModal';
import { ConfirmationModal } from '../components/ConfirmationModal';

import { extractIdFromSlug } from '../utils/slugify';
import { trackPageView } from '../utils/analytics';
import { FlagIcon } from '../components/ui/FlagIcon';

export function Agenda() {
    const { t, language } = useLanguage();
    const playHoverSound = useHoverSound();
    const [expandedEvent, setExpandedEvent] = useState<number | string | null>(null);
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [isAdmin, setIsAdmin] = useState(false);
    const [agendaData, setAgendaData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEvents, setSelectedEvents] = useState<Set<number>>(new Set());
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number[] | null>(null);

    const fetchAgenda = async () => {
        try {
            const response = await fetch('/api/agenda');
            if (response.ok) {
                const data = await response.json();
                setAgendaData(data);
            }
        } catch (error) {
            console.error('Failed to fetch agenda:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAgenda();
        setIsAdmin(localStorage.getItem('admin_auth') === 'true');
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedLocation = searchParams.get('location');

    // Available months based on upcoming events for the active category
    const months = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const categoryFiltered = agendaData.filter((event: any) => {
            if (activeCategory === 'ALL') return true;
            const genre = (event.genre || '').toLowerCase();
            const id = activeCategory.toLowerCase();
            if (id === 'progressive house') return genre.includes('progressive');
            if (id === 'drum & bass') return genre.includes('drum') || genre.includes('bass');
            return genre.includes(id);
        });

        const upcoming = categoryFiltered.filter((event: any) => {
            const dateStr = event.startDate || event.date;
            if (!dateStr) return false;
            const d = new Date(dateStr);
            d.setHours(0, 0, 0, 0);
            return d >= today;
        });

        const monthKeys = new Set<string>();
        upcoming.forEach((event: any) => {
            const date = new Date(event.startDate || event.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthKeys.add(monthKey);
        });

        return Array.from(monthKeys).sort();
    }, [activeCategory, agendaData]);

    // Set initial selected month or reset if not available for new category
    useEffect(() => {
        if (months.length > 0) {
            if (!selectedMonth || !months.includes(selectedMonth)) {
                setSelectedMonth(months[0]);
            }
        } else {
            setSelectedMonth(null);
        }
    }, [months]);

    const CATEGORIES = [
        { id: 'ALL', label: t('agenda.filter_all') },
        { id: 'MULTI STYLES', label: 'MULTI STYLES' },
        { id: 'HYBRIDE', label: 'HYBRIDE' },
        { id: 'TECHNO', label: 'TECHNO' },
        { id: 'MELODIC TECHNO', label: 'MELODIC TECHNO' },
        { id: 'TECH HOUSE', label: 'TECH HOUSE' },
        { id: 'BIG ROOM', label: 'BIG ROOM' },
        { id: 'HOUSE', label: 'HOUSE' },
        { id: 'HARDMUSIC', label: 'HARDMUSIC' },
        { id: 'TRANCE', label: 'TRANCE' },
        { id: 'PROGRESSIVE HOUSE', label: 'PROGRESSIVE HOUSE' },
        { id: 'DRUM & BASS', label: 'DRUM & BASS' }
    ];

    // Filter events by category AND month
    const filteredEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return agendaData
            .filter((event: any) => {
                if (!event.date && !event.startDate) return false;

                const eventDate = new Date(event.startDate || event.date);
                if (isNaN(eventDate.getTime())) return false;

                eventDate.setHours(0, 0, 0, 0);

                // Date filter (upcoming only)
                if (eventDate < today) return false;

                // Category filter (First, to show correct months)
                if (activeCategory !== 'ALL') {
                    const genre = (event.genre || '').toLowerCase();
                    const id = activeCategory.toLowerCase();
                    if (id === 'progressive house') {
                        if (!genre.includes('progressive')) return false;
                    } else if (id === 'drum & bass') {
                        if (!genre.includes('drum') && !genre.includes('bass')) return false;
                    } else {
                        if (!genre.includes(id)) return false;
                    }
                }

                // Month filter
                if (selectedMonth) {
                    const [year, month] = selectedMonth.split('-');
                    if (eventDate.getFullYear() !== parseInt(year) || (eventDate.getMonth() + 1) !== parseInt(month)) {
                        return false;
                    }
                }

                // Location filter
                if (selectedLocation) {
                    if (event.location.toLowerCase() !== selectedLocation.toLowerCase()) {
                        return false;
                    }
                }

                return true;
            })
            .sort((a: any, b: any) => new Date(a.startDate || a.date).getTime() - new Date(b.startDate || b.date).getTime());
    }, [activeCategory, selectedMonth, selectedLocation, agendaData]);

    const formatMonthName = (monthKey: string) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const name = date.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long' });
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    // Auto-expand event from URL parameter
    useEffect(() => {
        const eventParam = searchParams.get('event');
        if (eventParam && agendaData.length > 0) {
            const id = extractIdFromSlug(eventParam);
            const event = agendaData.find((e: any) => e.id === id);
            if (event) {
                const date = new Date(event.startDate || event.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                setSelectedMonth(monthKey);
                setExpandedEvent(event.id);
            }
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
    }, [searchParams, setSearchParams, agendaData]);

    const toggleEvent = (eventId: number) => {
        const wasExpanded = expandedEvent === eventId;
        setExpandedEvent(wasExpanded ? null : eventId);

        if (!wasExpanded) {
            trackPageView(eventId.toString(), 'agenda');
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
        else if (g.includes('tech house')) color = 'blue';
        else if (g.includes('big room')) color = 'purple';
        else if (g.includes('house')) color = 'pink';
        else if (g.includes('hardmusic')) color = 'orange';
        else if (g.includes('trance')) color = 'cyan';
        else if (g.includes('progressive')) color = 'white';
        else if (g.includes('drum') || g.includes('bass')) color = 'purple';
        else if (g.includes('multi styles')) color = 'blue';
        else if (g.includes('hybride')) color = 'red';

        const isMulti = g.includes('multi styles');
        const isHybride = g.includes('hybride');
        const isWhite = color === 'white';

        return {
            text: (isMulti || isHybride) ? 'text-white' : (isWhite ? 'text-white' : `text-neon-${color}`),
            bg: (isMulti || isHybride) ? 'bg-white/10' : (isWhite ? 'bg-white/10' : `bg-neon-${color}/20`),
            border: (isMulti || isHybride) ? 'border-transparent' : (isWhite ? 'border-white/20' : `border-neon-${color}/30`),
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-neon-red/20 border-t-neon-red rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <div className="flex items-center justify-between gap-6 mb-12">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white uppercase italic tracking-tighter">
                        {t('agenda.title')}
                    </h1>
                    {isAdmin && (
                        <button
                            onClick={() => {
                                setEditingEvent(null);
                                setIsEditModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-neon-red text-white rounded-xl font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,0,51,0.3)]"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Ajouter</span>
                        </button>
                    )}
                </div>
            </motion.div>

            <AnimatePresence>
                {isAdmin && selectedEvents.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] bg-dark-bg/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-6 shadow-2xl"
                    >
                        <div className="flex items-center gap-3">
                            <CheckSquare className="w-5 h-5 text-neon-red" />
                            <span className="text-sm font-black text-white uppercase tracking-wider">{selectedEvents.size} sélectionné(s)</span>
                        </div>
                        <div className="h-6 w-[1px] bg-white/10" />
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setItemToDelete(Array.from(selectedEvents));
                                    setIsDeleting(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                            </button>
                            <button
                                onClick={() => setSelectedEvents(new Set())}
                                className="px-4 py-2 bg-white/5 text-gray-400 hover:text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                            >
                                Annuler
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                        className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest transition-all duration-300 border ${activeCategory === cat.id
                            ? 'bg-neon-red border-neon-red text-white shadow-[0_0_15px_rgba(255,0,51,0.5)]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-neon-red'
                            } uppercase`}
                    >
                        {cat.label}
                    </motion.button>
                ))}
            </div>

            {selectedLocation && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center gap-4 mb-8 bg-neon-red/10 border border-neon-red/20 text-neon-red px-6 py-3 rounded-full w-fit"
                >
                    <MapPin className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-wider">
                        {selectedLocation}
                    </span>
                    <button
                        onClick={() => {
                            const params = new URLSearchParams(searchParams);
                            params.delete('location');
                            setSearchParams(params);
                        }}
                        className="ml-4 p-1 hover:bg-neon-red/20 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            )}

            {months.length > 0 ? (
                <div className="mb-12 flex justify-center">
                    <div className="flex items-center justify-center p-4 bg-white/5 border border-white/10 rounded-3xl gap-4 md:gap-8 shadow-xl">
                        <button
                            onClick={() => {
                                const currentIndex = months.indexOf(selectedMonth || '');
                                if (currentIndex > 0) setSelectedMonth(months[currentIndex - 1]);
                            }}
                            disabled={months.indexOf(selectedMonth || '') <= 0}
                            className="p-3 rounded-xl border border-white/10 bg-white/5 text-white hover:border-neon-red hover:text-neon-red disabled:opacity-20 transition-all group"
                            onMouseEnter={playHoverSound}
                        >
                            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>

                        <div className="w-64 md:w-80 text-center">
                            <h2 className="text-3xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter">
                                {selectedMonth ? formatMonthName(selectedMonth) : '—'}
                            </h2>
                        </div>

                        <button
                            onClick={() => {
                                const currentIndex = months.indexOf(selectedMonth || '');
                                if (currentIndex !== -1 && currentIndex < months.length - 1) setSelectedMonth(months[currentIndex + 1]);
                            }}
                            disabled={selectedMonth ? months.indexOf(selectedMonth) >= months.length - 1 : true}
                            className="p-3 rounded-xl border border-white/10 bg-white/5 text-white hover:border-neon-red hover:text-neon-red disabled:opacity-20 transition-all group"
                            onMouseEnter={playHoverSound}
                        >
                            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mb-12 flex flex-col items-center justify-center py-20 gap-4">
                    <p className="text-gray-500 font-display font-black uppercase tracking-widest text-lg">
                        {t('agenda.no_results')}
                    </p>
                </div>
            )}

            <div className="space-y-4 w-[90%] mx-auto">
                <AnimatePresence mode="popLayout">
                    {months.length > 0 && filteredEvents.length > 0 ? (
                        filteredEvents.map((event: any, index: number) => {

                            const styles = getEventStyles(event.genre);
                            const isExpanded = expandedEvent === event.id;
                            const isSelected = selectedEvents.has(event.id);

                            return (
                                <motion.div
                                    id={`event-${event.id}`}
                                    key={event.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`group bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all duration-300 ${styles.hoverBorder} ${styles.shadow} ${isSelected ? 'border-neon-red/50 bg-neon-red/5' : ''}`}
                                >
                                    <div className="flex">
                                        {isAdmin && (
                                            <div
                                                className="w-12 flex items-center justify-center cursor-pointer hover:bg-white/5"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newSelected = new Set(selectedEvents);
                                                    if (newSelected.has(event.id)) newSelected.delete(event.id);
                                                    else newSelected.add(event.id);
                                                    setSelectedEvents(newSelected);
                                                }}
                                            >
                                                {isSelected ? (
                                                    <CheckSquare className="w-6 h-6 text-neon-red" />
                                                ) : (
                                                    <Square className="w-6 h-6 text-gray-700" />
                                                )}
                                            </div>
                                        )}
                                        <div
                                            className="flex-1 p-6 cursor-pointer hover:bg-white/10 transition-colors"
                                            onClick={() => toggleEvent(event.id)}
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex items-center gap-6">
                                                    {event.image && (
                                                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 hidden sm:block">
                                                            <img src={event.image} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                    <div className="flex-shrink-0 text-center bg-dark-bg border border-white/10 rounded-lg p-3 w-20 min-h-[5.5rem] flex flex-col justify-center">
                                                        <span className={`block text-[10px] ${styles.text} font-black uppercase mb-1 tracking-tight`}>
                                                            {event.startDate && event.endDate && event.startDate !== event.endDate ? (
                                                                <>{new Date(event.startDate).toLocaleString(locale, { weekday: 'short' }).replace('.', '')} - {new Date(event.endDate).toLocaleString(locale, { weekday: 'short' }).replace('.', '')}</>
                                                            ) : (
                                                                new Date(event.startDate || event.date).toLocaleString(locale, { weekday: 'short' }).replace('.', '')
                                                            )}
                                                        </span>
                                                        <span className="block text-2xl font-bold text-white leading-none mb-1">
                                                            {event.startDate && event.endDate && event.startDate !== event.endDate ? (
                                                                <span className="text-lg">{new Date(event.startDate).getDate()}-{new Date(event.endDate).getDate()}</span>
                                                            ) : (
                                                                new Date(event.startDate || event.date).getDate()
                                                            )}
                                                        </span>
                                                        <span className="block text-[10px] text-gray-400 uppercase leading-tight font-bold">
                                                            {new Date(event.startDate || event.date).toLocaleString(locale, { month: 'short' }).replace('.', '')}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="flex flex-wrap gap-2 mb-2">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${styles.bg} ${styles.text} border ${styles.borderMedium}`}>
                                                                {event.type}
                                                            </span>
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/5 text-gray-300 border border-white/10`}>
                                                                {event.genre}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-xl font-bold text-white group-hover:text-neon-red transition-colors">
                                                            {event.title}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                                                            <MapPin className="w-4 h-4" />
                                                            <span>{event.location}</span>
                                                            <FlagIcon location={event.location} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <a
                                                        href={event.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`px-6 py-2 rounded-lg border text-sm font-bold uppercase tracking-tight transition-all ${event.isSoldOut ? 'bg-neon-red/10 text-neon-red border-neon-red/30' : 'bg-white/5 border-white/10 text-white hover:bg-neon-red hover:border-neon-red'}`}
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        {event.isSoldOut ? 'Sold Out' : t('agenda.infos_tickets')}
                                                    </a>
                                                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-white/10 bg-black/20 p-8"
                                            >
                                                <div className="flex flex-col md:flex-row gap-10 items-center">
                                                    <div className="w-full md:w-1/3">
                                                        <img src={event.image} alt="" className="w-full rounded-2xl shadow-2xl" />
                                                    </div>
                                                    <div className="flex-1 space-y-6">
                                                        <h3 className="text-4xl font-display font-black text-white uppercase italic italic tracking-tighter leading-none">
                                                            {event.title}
                                                        </h3>
                                                        <p className="text-gray-400 leading-relaxed text-lg italic">
                                                            {event.description || "Aucune description disponible pour cet événement."}
                                                        </p>
                                                        <div className="flex flex-wrap gap-4 pt-4">
                                                            <a
                                                                href={event.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-8 py-4 bg-neon-red text-white rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,0,51,0.3)]"
                                                            >
                                                                Réserver mes tickets
                                                            </a>
                                                            {isAdmin && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingEvent(event);
                                                                        setIsEditModalOpen(true);
                                                                    }}
                                                                    className="flex items-center gap-3 px-8 py-4 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 rounded-xl font-black uppercase tracking-widest hover:bg-neon-cyan/30 transition-all"
                                                                >
                                                                    <Edit2 className="w-5 h-5" />
                                                                    Modifier
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl border-dashed">
                            <p className="text-gray-400 text-lg uppercase font-bold tracking-widest">Aucun événement trouvé pour cette sélection</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <AgendaModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingEvent(null);
                }}
                onSuccess={fetchAgenda}
                editingItem={editingEvent}
            />

            <ConfirmationModal
                isOpen={isDeleting}
                message={`Êtes-vous sûr de vouloir supprimer ${itemToDelete?.length || 0} événement(s) ?`}
                onConfirm={async () => {
                    if (!itemToDelete) return;
                    try {
                        for (const id of itemToDelete) {
                            await fetch(`/api/agenda/delete`, {
                                method: 'POST',
                                headers: getAuthHeaders(),
                                body: JSON.stringify({ id })
                            });
                        }
                        await fetchAgenda();
                        setSelectedEvents(new Set());
                        setIsDeleting(false);
                        setItemToDelete(null);
                    } catch (error) {
                        console.error('Delete failed:', error);
                    }
                }}
                onCancel={() => {
                    setIsDeleting(false);
                    setItemToDelete(null);
                }}
                accentColor="neon-red"
            />
        </div>
    );
}
