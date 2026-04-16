import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import { MapPin, ChevronDown, Filter, ChevronLeft, ChevronRight, X, Edit2, Trash2, CheckSquare, Square, Plus, Calendar, Heart } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';
import { getAuthHeaders } from '../utils/auth';
import { AgendaModal } from '../components/AgendaModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { CollaborativeCalendar } from '../components/community/CollaborativeCalendar';

import { extractIdFromSlug } from '../utils/slugify';
import { trackPageView } from '../utils/analytics';
import { FlagIcon } from '../components/ui/FlagIcon';
import { SEO } from '../components/utils/SEO';
import { AdminEditBar } from '../components/admin/AdminEditBar';
import { resolveImageUrl } from '../utils/image';
import { useUser } from '../context/UserContext';

export function Agenda() {
    const { t, language } = useLanguage();
    const { user, toggleAgendaFavorite, isLoggedIn } = useUser();
    const playHoverSound = useHoverSound();
    const [expandedEvent, setExpandedEvent] = useState<number | string | null>(null);
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [permissions, setPermissions] = useState<string[]>([]);
    const storedUser = localStorage.getItem('admin_user');

    const hasPermission = (p: string) => {
        if (permissions.includes('all')) return true;
        if (storedUser === 'alex') return true;

        if (p === 'create' || p === 'edit' || p === 'delete') {
            return permissions.includes('agenda');
        }

        return permissions.includes(p);
    };

    const canCreate = hasPermission('create');
    const canEdit = hasPermission('edit');
    const canDelete = hasPermission('delete');
    const [agendaData, setAgendaData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEvents, setSelectedEvents] = useState<Set<number>>(new Set());
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number[] | null>(null);
    const [isContestActive, setIsContestActive] = useState(false);
    const [takeoverEnabled, setTakeoverEnabled] = useState(false);
    const [takeoverSettings, setTakeoverSettings] = useState<any>(null);

    const fetchAgenda = async () => {
        try {
            const response = await fetch('/api/agenda');
            if (response.ok) {
                const data = await response.json();
                setAgendaData(data);
            }
            try {
                const response = await fetch('/api/settings');
                if (response.ok) {
                    const data = await response.json();
                    if (data.is_contest_active !== undefined) {
                        setIsContestActive(data.is_contest_active);
                    }
                    if (data.takeover) {
                        const isSecret = !!data.takeover.isSecret;
                        setTakeoverSettings(isSecret ? null : data.takeover);
                        setTakeoverEnabled(isSecret ? false : !!data.takeover.isOnline);
                    }
                }
            } catch (e) { }
        } catch (error: any) {
            console.error('Failed to fetch agenda:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAgenda();
        const stored = JSON.parse(localStorage.getItem('admin_permissions') || '[]');
        setPermissions(stored);
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedLocation = searchParams.get('location');
    
    // Create an exploded version of the data where events with extra dates appear multiple times
    const explodedAgenda = useMemo(() => {
        const exploded: any[] = [];
        agendaData.forEach(event => {
            // Primary occurrence
            exploded.push({ ...event, compositeId: `${event.id}-primary` });
            
            // Additional occurrences
            if (event.additionalDates && Array.isArray(event.additionalDates)) {
                event.additionalDates.forEach((date: string, idx: number) => {
                    // Create a copy with the different date
                    exploded.push({
                        ...event,
                        date: date,
                        startDate: date,
                        endDate: date,
                        compositeId: `${event.id}-extra-${idx}`
                    });
                });
            }
        });
        return exploded;
    }, [agendaData]);

    // Available months based on upcoming events for the active category
    const months = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const categoryFiltered = explodedAgenda.filter((event: any) => {
            if (activeCategory === 'ALL') return true;
            if (activeCategory === 'LIVE') return event.isLiveDropsiders;
            const genre = (event.genre || '').toLowerCase();
            const id = activeCategory.toLowerCase();
            if (id === 'progressive house') return genre.includes('progressive');
            if (id === 'drum & bass') return genre.includes('drum') || genre.includes('bass');
            return genre.includes(id);
        });

        const upcoming = categoryFiltered.filter((event: any) => {
            const startDateStr = event.startDate || event.date;
            const endDateStr = event.endDate || startDateStr;
            if (!startDateStr) return false;
            
            const end = new Date(endDateStr);
            end.setHours(23, 59, 59, 999);
            
            return end >= today;
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
        { id: 'LIVE', label: 'LIVE' },
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
        { id: 'DRUM & BASS', label: 'DRUM & BASS' },
        { id: 'HARDCORE', label: 'HARDCORE' },
        { id: 'HARDTECHNO', label: 'HARDTECHNO' }
    ];

    // Filter events by category AND month
    const filteredEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return explodedAgenda
            .filter((event: any) => {
                if (!event.date && !event.startDate) return false;

                const eventDate = new Date(event.startDate || event.date);
                const endDate = event.endDate ? new Date(event.endDate) : eventDate;
                if (isNaN(eventDate.getTime())) return false;

                endDate.setHours(23, 59, 59, 999);

                // Date filter (active events only)
                if (endDate < today) return false;

                // Category filter (First, to show correct months)
                if (activeCategory !== 'ALL') {
                    if (activeCategory === 'LIVE') {
                        if (!event.isLiveDropsiders) return false;
                    } else {
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
            .sort((a: any, b: any) => {
                return new Date(a.startDate || a.date).getTime() - new Date(b.startDate || b.date).getTime();
            });
    }, [activeCategory, selectedMonth, selectedLocation, explodedAgenda]);

    const formatMonthName = (monthKey: string) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const name = date.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long' });
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    // Auto-expand event from URL parameter
    useEffect(() => {
        const eventParam = searchParams.get('event');
        if (eventParam && explodedAgenda.length > 0) {
            const id = extractIdFromSlug(eventParam);
            const event = explodedAgenda.find((e: any) => e.id === id);
            if (event) {
                const date = new Date(event.startDate || event.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                setSelectedMonth(monthKey);
                setExpandedEvent(event.compositeId);
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

    const toggleEvent = (eventId: string) => {
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

    const getEventStyles = (genre: string, type: string) => {
        const g = (genre || '').toLowerCase().trim();
        const t = (type || '').toLowerCase().trim();
        let color = 'cyan';

        if (t === 'festival') color = 'red';
        else if (t === 'concert') color = 'cyan';
        else if (g.includes('melodic')) color = 'yellow';
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
        else if (g.includes('hardcore')) color = 'red';
        else if (g.includes('hardtechno')) color = 'purple';
        
        if (t === 'jeux concours') color = 'yellow';

        const isMulti = g.includes('multi styles');
        const isHybride = g.includes('hybride');
        const isWhite = color === 'white';
        const isFestival = t === 'festival';

        return {
            text: ((isMulti || isHybride) && !isFestival) ? 'text-white' : (isWhite ? 'text-white' : `text-neon-${color}`),
            bg: ((isMulti || isHybride) && !isFestival) ? 'bg-white/10' : (isWhite ? 'bg-white/10' : `bg-neon-${color}/20`),
            border: ((isMulti || isHybride) && !isFestival) ? 'border-transparent' : (isWhite ? 'border-white/20' : `border-neon-${color}/30`),
            borderStrong: ((isMulti || isHybride) && !isFestival) ? 'border-white/50' : (isWhite ? 'border-white/50' : `border-neon-${color}`),
            borderMedium: ((isMulti || isHybride) && !isFestival) ? 'border-white/30' : (isWhite ? 'border-white/30' : `border-neon-${color}/30`),
            hoverBorder: ((isMulti || isHybride) && !isFestival) ? 'hover:border-white/80' : (isWhite ? 'hover:border-white/80' : `hover:border-neon-${color}/50`),
            hoverText: ((isMulti || isHybride) && !isFestival) ? 'hover:text-white' : (isWhite ? 'hover:text-white' : `hover:text-neon-${color}`),
            groupHoverText: ((isMulti || isHybride) && !isFestival) ? 'group-hover:text-white' : (isWhite ? 'group-hover:text-white' : `group-hover:text-neon-${color}`),
            shadow: ((isMulti || isHybride) && !isFestival) ? 'hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]' : `hover:shadow-[0_0_15px_var(--color-neon-${color})]`,
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
        <div className="bg-dark-bg min-h-screen relative">
            {/* Background Ambient Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] bg-neon-red/10 animate-pulse transition-all duration-1000" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] bg-neon-cyan/5 animate-pulse [animation-delay:2s] transition-all duration-1000" />
            </div>

            <SEO
                title="Agenda des Festivals"
                description="Le calendrier complet des festivals EDM, Techno et House dans le monde entier. Trouvez votre prochain événement."
            />
            <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-12">
                        <div>
                            <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                                <div className="p-2 bg-neon-red/10 rounded-xl border border-neon-red/20 shadow-[0_0_15px_rgba(255,0,51,0.1)]">
                                    <Calendar className="w-5 h-5 text-neon-red" />
                                </div>
                                <span className="text-neon-red font-black tracking-[0.3em] text-[10px] uppercase">Calendrier Officiel</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-6 uppercase italic tracking-tighter leading-none">
                                {t('agenda.title').split(' ')[0]} <span className="text-neon-red drop-shadow-[0_0_20px_rgba(255,0,51,0.5)]">{t('agenda.title').split(' ').slice(1).join(' ')}</span>
                            </h1>
                            <p className="text-gray-400 max-w-2xl text-base md:text-lg font-medium leading-relaxed mx-auto sm:mx-0">
                                Retrouvez tous les festivals EDM, Techno et House à travers le monde. Planifiez vos prochaines escapades musicales en un clin d'oeil.
                            </p>
                        </div>
                        
                        {canCreate && (
                            <button
                                onClick={() => {
                                    setEditingEvent(null);
                                    setIsEditModalOpen(true);
                                }}
                                className="flex items-center justify-center gap-3 px-8 py-4 bg-neon-red text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_15px_40px_rgba(255,0,51,0.3)] mx-auto sm:mx-0"
                            >
                                <Plus className="w-5 h-5" />
                                <span>{t('admin.add')}</span>
                            </button>
                        )}
                    </div>
                </motion.div>

                <AnimatePresence>
                    {canDelete && selectedEvents.size > 0 && (
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
                                    {t('admin.delete')}
                                </button>
                                <button
                                    onClick={() => setSelectedEvents(new Set())}
                                    className="px-4 py-2 bg-white/5 text-gray-400 hover:text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                                >
                                    {t('admin.cancel')}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex flex-wrap items-center gap-4 mb-12">
                    <div className="flex items-center gap-2 text-gray-500 mr-2">
                        <Filter className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('agenda.filter_by')}</span>
                    </div>
                    {CATEGORIES.map((cat) => (
                        <motion.button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            whileHover={{ scale: 1.05 }}
                            onMouseEnter={playHoverSound}
                            className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest transition-all duration-300 border ${activeCategory === cat.id
                                ? 'bg-neon-red border-transparent text-white shadow-[0_0_20px_rgba(255,17,17,0.4)]'
                                : 'bg-white/5 border-white/10 text-white/40 hover:border-neon-red/40 hover:text-neon-red'
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

                <div className="mb-12 flex justify-center">
                    <div className="flex items-center justify-center p-4 bg-white/5 border border-white/10 rounded-3xl gap-4 md:gap-8 shadow-xl">
                        <button
                            onClick={() => {
                                const currentIndex = months.indexOf(selectedMonth || '');
                                if (currentIndex > 0) setSelectedMonth(months[currentIndex - 1]);
                            }}
                            disabled={months.length === 0 || months.indexOf(selectedMonth || '') <= 0}
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
                            disabled={months.length === 0 || (selectedMonth ? months.indexOf(selectedMonth) >= months.length - 1 : true)}
                            className="p-3 rounded-xl border border-white/10 bg-white/5 text-white hover:border-neon-red hover:text-neon-red disabled:opacity-20 transition-all group"
                            onMouseEnter={playHoverSound}
                        >
                            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {months.length === 0 && (
                    <div className="mb-8 flex justify-center">
                        <p className="text-gray-500 font-display font-black uppercase tracking-widest text-sm">
                            {t('agenda.no_results')}
                        </p>
                    </div>
                )}

                <div className="flex overflow-x-auto gap-8 pb-12 pt-8 px-8 -mx-8 md:px-6 md:mx-0 md:pt-10 md:block md:space-y-10 w-full relative snap-x snap-mandatory no-scrollbar text-left md:overflow-visible">
                    {takeoverEnabled && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-8 w-[85vw] md:w-full flex-shrink-0 snap-center"
                        >
                            <Link
                                to="/live"
                                className="block relative group overflow-hidden rounded-[2rem] md:rounded-2xl border-2 border-neon-red shadow-[0_0_30px_rgba(255,0,51,0.4)] transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_0_50px_rgba(255,0,51,0.6)] bg-black/40 backdrop-blur-xl"
                            >
                                <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                                    <motion.div 
                                        animate={{ x: ['100%', '-100%'] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
                                    />
                                </div>

                                <div className="p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
                                    <div className="relative shrink-0">
                                        <div className="absolute inset-0 bg-neon-red blur-xl rounded-full animate-pulse opacity-40" />
                                        <div className="w-20 h-20 md:w-28 md:h-28 bg-black rounded-full border-4 border-neon-red flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(255,0,51,0.4)]">
                                            <div className="flex flex-col items-center">
                                                <span className="text-neon-red font-black text-xl md:text-3xl animate-pulse italic">LIVE</span>
                                                <div className="w-2 h-2 bg-neon-red rounded-full mt-1 animate-ping" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 text-center md:text-left min-w-0">
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
                                            <span className="px-4 py-1.5 bg-neon-red text-white text-[10px] md:text-xs font-black rounded-full uppercase tracking-widest animate-pulse shadow-[0_0_15px_rgba(255,0,51,0.8)]">
                                                {t('home.live_now')}
                                            </span>
                                            <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
                                            <span className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-widest">
                                                Dropsiders TV
                                            </span>
                                        </div>
                                        
                                        <h2 className="text-2xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter leading-tight mb-4 group-hover:text-neon-red transition-colors duration-300 truncate">
                                            {takeoverSettings?.title || 'DROPSIDERS LIVE'}
                                        </h2>
                                        
                                        <p className="text-gray-400 text-sm md:text-base font-medium max-w-xl">
                                            {language === 'fr' 
                                                ? 'Rejoignez le stream en direct pour vivre l\'expérience Dropsiders. Chat interactif, cadeaux et exclusivités.'
                                                : 'Join the live stream for the Dropsiders experience. Interactive chat, giveaways and exclusives.'}
                                        </p>
                                    </div>

                                    <div className="shrink-0 w-full md:w-auto">
                                        <button className="w-full md:w-auto px-10 py-5 bg-neon-red text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_15px_40px_rgba(255,0,51,0.3)]">
                                            Regarder le Live
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    )}

                    <AnimatePresence mode="popLayout">
                        {months.length > 0 && filteredEvents.length > 0 ? (
                            filteredEvents.map((event: any, index: number) => {
                                const styles = getEventStyles(event.genre, event.type);
                                const isExpanded = expandedEvent === event.compositeId;
                                const isSelected = selectedEvents.has(event.id);

                                const eventDate = new Date(event.startDate || event.date);
                                const now = new Date();
                                const isPast = eventDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());

                                // Check if it's the "Next" event (the first one in the filtered list since they are sorted)
                                const isNext = index === 0 && !isPast;

                                const handleReminder = (e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    const title = encodeURIComponent(event.title);
                                    const details = encodeURIComponent(event.genre + ' @ ' + (event.venue || event.location));
                                    const date = new Date(event.startDate || event.date).toISOString().replace(/-|:|\.\d\d\d/g, "");
                                    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${encodeURIComponent(event.location)}&dates=${date}/${date}`;
                                    window.open(url, '_blank');
                                };

                                return (
                                    <motion.div
                                        id={`event-${event.compositeId}`}
                                        key={event.compositeId}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`group relative z-10 bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden transition-all duration-300 w-[85vw] flex-shrink-0 snap-center aspect-square md:aspect-auto md:max-w-none md:w-auto md:flex-shrink-1 md:rounded-xl md:border ${styles.hoverBorder} ${styles.shadow} ${isSelected ? 'border-neon-red/50 bg-neon-red/5' : ''} ${isPast ? 'opacity-40 grayscale-[0.5]' : ''} ${isNext ? 'shadow-[0_0_40px_rgba(255,0,51,0.4)] border border-neon-red z-20 overflow-visible before:absolute before:-inset-[1px] before:border before:border-neon-red/50 before:rounded-xl before:animate-pulse before:pointer-events-none' : ''}`}
                                    >
                                        {isNext && (
                                            <div className="absolute top-0 right-0 px-3 py-1 bg-neon-red text-white text-[8px] font-black uppercase tracking-widest rounded-bl-3xl md:rounded-bl-xl shadow-lg z-20">
                                                Prochainement
                                            </div>
                                        )}

                                        {/* Mobile Variant */}
                                        <div className="absolute inset-0 md:hidden block" onClick={() => { 
                                            if (event.isLiveDropsiders) {
                                                window.location.href = '/live';
                                            } else if (event.url) {
                                                window.location.href = event.url;
                                            }
                                        }}>
                                            {event.image && (
                                                <img
                                                    src={resolveImageUrl(event.image)}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
                                                    }}
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
                                            <div className="absolute inset-0 p-6 flex flex-col justify-end text-left z-10">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border backdrop-blur-md ${styles.bg} ${styles.text} ${styles.borderMedium} uppercase`}>
                                                        {event.genre}
                                                    </span>
                                                    <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">
                                                        {new Date(event.startDate || event.date).toLocaleString(locale, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <h2 className="text-2xl font-display font-black text-white italic uppercase leading-tight tracking-tight line-clamp-3 mb-2 shadow-black drop-shadow-lg">
                                                    {event.title}
                                                </h2>
                                                <div className="flex items-center gap-2 text-white/80 text-xs font-bold uppercase tracking-wider">
                                                    <MapPin className="w-4 h-4 text-neon-red" />
                                                    <span className="truncate">{event.location}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Desktop Variant */}
                                        <div className="hidden md:flex flex-col w-full">
                                            <div className="flex">
                                                {canDelete && (
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
                                                    className="flex-1 p-3 md:p-6 cursor-pointer hover:bg-white/10 transition-colors"
                                                    onClick={() => {
                                                        if (event.isLiveDropsiders) {
                                                            window.location.href = '/live';
                                                        } else {
                                                            toggleEvent(event.compositeId);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex flex-row items-center justify-between gap-4 md:gap-6">
                                                        <div className="flex items-center gap-4 md:gap-6">
                                                            {/* Timeline Dot (Mobile Only) */}
                                                            <div className={`md:hidden absolute left-[28px] w-1.5 h-1.5 rounded-full z-20 transition-all ${isPast ? 'bg-gray-700 border border-white/10' : (isNext ? 'bg-neon-red shadow-[0_0_20px_#ff0033] animate-pulse w-2.5 h-2.5 -ml-[2px]' : styles.bg.replace('/20', ''))}`} />

                                                            <div className="flex-shrink-0 text-center bg-dark-bg border border-white/10 rounded-md md:rounded-xl p-1.5 md:p-4 w-12 md:w-24 min-h-0 md:min-h-[6.5rem] flex flex-col justify-center relative z-20">
                                                                <span className={`block text-[8px] md:text-[11px] ${styles.text} font-black uppercase mb-0.5 md:mb-1.5 tracking-tight`}>
                                                                    {event.startDate && event.endDate && event.startDate !== event.endDate && event.type !== 'Résidence' ? (
                                                                        <>{new Date(event.startDate).toLocaleString(locale, { weekday: 'short' }).replace('.', '')} - {new Date(event.endDate).toLocaleString(locale, { weekday: 'short' }).replace('.', '')}</>
                                                                    ) : (
                                                                        new Date(event.startDate || event.date).toLocaleString(locale, { weekday: 'short' }).replace('.', '')
                                                                    )}
                                                                </span>
                                                                <span className="block text-lg md:text-3xl font-black text-white italic leading-none mb-0.5 md:mb-1.5">
                                                                    {event.startDate && event.endDate && event.startDate !== event.endDate && event.type !== 'Résidence' ? (
                                                                        <span className="text-xs md:text-xl">{new Date(event.startDate).getDate()}-{new Date(event.endDate).getDate()}</span>
                                                                    ) : (
                                                                        new Date(event.startDate || event.date).getDate()
                                                                    )}
                                                                </span>
                                                                <span className="block text-[8px] md:text-[11px] text-gray-400 uppercase leading-tight font-black">
                                                                    {new Date(event.startDate || event.date).toLocaleString(locale, { month: 'short' }).replace('.', '')}
                                                                </span>
                                                            </div>

                                                            <div className="min-w-0">
                                                                <div className="hidden md:flex flex-wrap gap-2 mb-2.5">
                                                                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${styles.bg} ${styles.text} border ${styles.borderMedium}`}>
                                                                        {event.type}
                                                                    </span>
                                                                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/5 text-gray-300 border border-white/10`}>
                                                                        {event.genre}
                                                                    </span>
                                                                    {event.isLiveDropsiders && (
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); window.location.href = '/live'; }}
                                                                            className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-neon-red/20 text-neon-red border border-neon-red/30 animate-pulse hover:bg-neon-red hover:text-white transition-colors cursor-pointer"
                                                                        >
                                                                            LIVE
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <h3 className="text-sm md:text-2xl font-black text-white group-hover:text-neon-red transition-colors leading-tight uppercase italic truncate max-w-[150px] md:max-w-none">
                                                                    {event.title}
                                                                </h3>
                                                                <div className="flex items-center gap-1.5 mt-1 text-[9px] md:text-base text-gray-500 uppercase font-bold tracking-wider">
                                                                    <MapPin className="w-2.5 h-2.5 md:w-5 md:h-5 text-neon-red" />
                                                                    <span className="truncate">{event.venue && `${event.venue}, `}{event.location}</span>
                                                                    <FlagIcon location={event.country || event.location} />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            {!isPast && (
                                                                <button
                                                                    onClick={handleReminder}
                                                                    className="hidden sm:flex w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center hover:bg-neon-red/10 hover:border-neon-red transition-all group/btn"
                                                                    title="Rappel Calendrier"
                                                                >
                                                                    <Calendar className="w-5 h-5 text-gray-500 group-hover/btn:text-neon-red" />
                                                                </button>
                                                            )}
                                                            {isLoggedIn && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleAgendaFavorite(event.id);
                                                                    }}
                                                                    className={`flex w-10 h-10 rounded-xl bg-white/5 border items-center justify-center transition-all group/heart ${user?.agendaFavorites.includes(event.id) ? `${styles.borderStrong} ${styles.bg}` : `border-white/10 ${styles.hoverBorder}`}`}
                                                                    title="Ajouter aux favoris"
                                                                >
                                                                    <Heart className={`w-5 h-5 transition-colors ${user?.agendaFavorites.includes(event.id) ? `${styles.text} fill-current` : `text-gray-500 ${styles.groupHoverText}`}`} />
                                                                </button>
                                                            )}
                                                            {event.type === 'Jeux Concours' ? (
                                                                <div className="hidden md:flex items-center gap-2">
                                                                    {isContestActive && (
                                                                        <button
                                                                            onClick={e => {
                                                                                e.stopPropagation();
                                                                                window.location.href = '/communaute?tab=CONCOURS';
                                                                            }}
                                                                            className="px-6 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all bg-neon-red border-neon-red text-white hover:shadow-[0_0_20px_rgba(255,0,51,0.3)]"
                                                                        >
                                                                            Participer
                                                                        </button>
                                                                    )}
                                                                    {event.url && !event.url.includes('tab=CONCOURS') && (
                                                                        <a
                                                                            href={event.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="px-6 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all bg-white/5 border-white/10 text-white hover:bg-white/10"
                                                                            onClick={e => e.stopPropagation()}
                                                                        >
                                                                            Tickets
                                                                        </a>
                                                                    )}
                                                                </div>
                                                             ) : (
                                                                <a
                                                                    href={event.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`hidden md:block px-8 py-3 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${event.isSoldOut ? 'bg-neon-red/10 text-neon-red border-neon-red/30' : 'bg-white/5 border-white/10 text-white hover:bg-neon-red hover:border-neon-red hover:shadow-[0_0_20px_rgba(255,0,51,0.3)]'}`}
                                                                    onClick={e => e.stopPropagation()}
                                                                >
                                                                    {event.isSoldOut ? 'Sold Out' : t('agenda.infos_tickets')}
                                                                </a>
                                                             )}
                                                            <ChevronDown className={`w-5 h-5 md:w-6 md:h-6 text-gray-600 transition-transform ${isExpanded ? 'rotate-180 text-neon-red' : ''}`} />
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
                                                        className="border-t border-white/5 bg-black/40 p-5 md:p-12"
                                                    >
                                                        <div className="flex flex-col md:flex-row gap-8 md:gap-14 items-center">
                                                            <div className="w-full md:w-1/3 group">
                                                                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                                                                    <img 
                                                                        src={resolveImageUrl(event.image)} 
                                                                        alt="" 
                                                                        className="w-full group-hover:scale-110 transition-transform duration-700" 
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
                                                                        }}
                                                                    />
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 space-y-6 md:space-y-8">
                                                                <div className="space-y-2">
                                                                    <span className={`text-[10px] md:text-sm font-black uppercase tracking-[0.3em] ${styles.text}`}>
                                                                        {event.genre} • {event.type}
                                                                    </span>
                                                                    <h3 className="text-3xl md:text-6xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                                                        {event.title}
                                                                    </h3>
                                                                </div>

                                                                <div className="flex flex-wrap gap-4 md:gap-6 pt-2">
                                                                    {event.type === 'Jeux Concours' ? (
                                                                        <>
                                                                            {isContestActive && (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        window.location.href = '/communaute?tab=CONCOURS';
                                                                                    }}
                                                                                    className="flex-1 md:flex-none px-10 py-5 bg-neon-red text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_15px_40px_rgba(255,0,51,0.3)] text-center text-xs md:text-sm"
                                                                                >
                                                                                    Participer au Concours
                                                                                </button>
                                                                            )}

                                                                            {event.url && !event.url.includes('tab=CONCOURS') && (
                                                                                <a
                                                                                    href={event.url}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="flex-1 md:flex-none px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all text-center text-xs md:text-sm"
                                                                                >
                                                                                    Billetterie & Infos
                                                                                </a>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <a
                                                                            href={event.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex-1 md:flex-none px-10 py-5 bg-neon-red text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_15px_40px_rgba(255,0,51,0.3)] text-center text-xs md:text-sm"
                                                                        >
                                                                            {t('agenda.book_tickets')}
                                                                        </a>
                                                                    )}

                                                                    {!isPast && (
                                                                        <button
                                                                            onClick={handleReminder}
                                                                            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all text-xs md:text-sm"
                                                                        >
                                                                            <Calendar className="w-5 h-5 text-neon-cyan" />
                                                                            M'en rappeler
                                                                        </button>
                                                                    )}

                                                                    {canEdit && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                const original = agendaData.find((a: any) => a.id === event.id);
                                                                                setEditingEvent(original || event);
                                                                                setIsEditModalOpen(true);
                                                                            }}
                                                                            className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 rounded-xl font-black uppercase tracking-widest hover:bg-neon-cyan/20 transition-all text-xs"
                                                                        >
                                                                            <Edit2 className="w-4 h-4" />
                                                                            {t('admin.modify')}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : months.length > 0 ? (
                            <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl border-dashed">
                                <p className="text-gray-400 text-lg uppercase font-bold tracking-widest">{t('agenda.no_events_selection')}</p>
                            </div>
                        ) : null}
                    </AnimatePresence>
                </div>

                <div className="mt-20 pt-16 border-t border-white/10 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[1px] bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent" />
                    <CollaborativeCalendar />
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
                        } catch (error: any) {
                            console.error('Delete failed:', error);
                        }
                    }}
                    onCancel={() => {
                        setIsDeleting(false);
                        setItemToDelete(null);
                    }}
                    accentColor="neon-red"
                />
            </div >
            <AdminEditBar
                pageName="Agenda"
                pageActions={[
                    { label: 'Ajouter un événement', icon: <Plus className="w-3.5 h-3.5" />, to: '/admin/manage?tab=Agenda', permission: 'agenda' },
                ]}
            />
        </div>
    );
}
