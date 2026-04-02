import { useState, useEffect, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHoverSound } from '../../hooks/useHoverSound';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { getAgendaLink } from '../../utils/slugify';
import { FlagIcon } from '../ui/FlagIcon';
import { Users, Music2 } from 'lucide-react';
import { resolveImageUrl } from '../../utils/image';

export function AgendaWidget({ maxItems = 6, accentColor = 'cyan', resolvedColor }: { maxItems?: number, accentColor?: string, resolvedColor?: string }) {
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
    const { t, language } = useLanguage();
    const [agendaData, setAgendaData] = useState<any[]>([]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [takeoverSettings, setTakeoverSettings] = useState<any>(null);
    const [takeoverEnabled, setTakeoverEnabled] = useState(false);

    const scheduledTakeover = (takeoverSettings?.showInAgenda && takeoverSettings?.startDate) ? {
        title: takeoverSettings.title || "LIVE TAKEOVER",
        title_en: takeoverSettings.title || "LIVE TAKEOVER",
        date: takeoverSettings.startDate,
        endDate: takeoverSettings.endDate,
        location: "LIVE STREAM",
        id: "live-takeover-scheduled",
        isLiveTakeover: true,
        isLiveDropsiders: takeoverSettings?.status === 'live',
        category: "LIVE",
        image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=2070&auto=format&fit=crop"
    } : null;

    const allEventsBase = scheduledTakeover ? [...agendaData, scheduledTakeover] : agendaData;

    const upcomingEvents = useMemo(() => {
        const exploded: any[] = [];
        (allEventsBase as any[]).forEach(event => {
            // Primary date
            exploded.push({ ...event, compositeId: `${event.id}-primary` });
            
            // Additional dates
            if (event.additionalDates && Array.isArray(event.additionalDates)) {
                event.additionalDates.forEach((date: string, idx: number) => {
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

        return exploded
            .filter((event: any) => {
                const start = new Date(event.date || event.startDate);
                const end = event.endDate ? new Date(event.endDate) : start;
                end.setHours(23, 59, 59, 999);
                return end >= today;
            })
            .sort((a: any, b: any) => new Date(a.date || a.startDate).getTime() - new Date(b.date || b.startDate).getTime())
            .slice(0, maxItems);
    }, [allEventsBase, today.getTime(), maxItems]);

    const playHoverSound = useHoverSound();

    const [viewersCount, setViewersCount] = useState<number>(0);
    const [currentArtist, setCurrentArtist] = useState<{ artist: string; instagram: string; stage: string } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data?.takeover) {
                        const isSecret = !!data.takeover.isSecret;
                        setTakeoverSettings(isSecret ? null : data.takeover);
                        setTakeoverEnabled(isSecret ? false : !!data.takeover.isOnline);
                    }
                }
            } catch (err: any) { }
        };

        fetchSettings();
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') fetchSettings();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchAgenda = async () => {
            try {
                const res = await fetch('/api/agenda');
                if (res.ok) setAgendaData(await res.json());
            } catch (err) {
                console.error('Failed to fetch agenda for widget:', err);
            }
        };
        fetchAgenda();
    }, []);

    // Polling Spectators
    useEffect(() => {
        if (!takeoverEnabled) return;
        const fetchViewers = async () => {
            try {
                const res = await fetch('/api/chat/ping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pseudo: 'ANON-AGENDA', channel: takeoverSettings?.youtubeId })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data?.count !== undefined) setViewersCount(data.count);
                }
            } catch (err: any) { }
        };
        fetchViewers();
        const intv = setInterval(() => {
            if (document.visibilityState === 'visible') fetchViewers();
        }, 20000);
        return () => clearInterval(intv);
    }, [takeoverEnabled, takeoverSettings?.youtubeId]);

    // Current Artist Logic
    useEffect(() => {
        if (!takeoverEnabled || !takeoverSettings?.lineup) return;

        const parseLineup = (text: string) => {
            const lines = text.split('\n').filter(l => l.trim());
            return lines.map(line => {
                const timeMatch = line.match(/^\[(.*?)\]/);
                if (!timeMatch) return null;
                const timeStr = timeMatch[1].trim();
                const rest = line.replace(timeMatch[0], '').trim();
                const parts = rest.split(/\s*-\s*/);
                const artist = parts[0]?.trim() || '';
                const stage = parts[1]?.trim() || '';
                const insta = parts.slice(2).join(' - ')?.trim() || '';

                const [h, m] = timeStr.replace('h', ':').split(':').map(n => parseInt(n));
                const d = new Date();
                d.setHours(h || 0, m || 0, 0, 0);
                return { artist, stage, instagram: insta, date: d };
            }).filter(Boolean) as any[];
        };

        const updateArtist = () => {
            const lineup = parseLineup(takeoverSettings.lineup);
            const now = new Date();
            const currentItem = [...lineup].reverse().find(item => item.date <= now);
            setCurrentArtist(currentItem || null);
        };

        updateArtist();
        const interval = setInterval(updateArtist, 60000);
        return () => clearInterval(interval);
    }, [takeoverEnabled, takeoverSettings?.lineup]);

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
                        className={`w-2.5 h-2.5 rounded-full ${takeoverEnabled ? 'bg-neon-red shadow-[0_0_12px_#ff0033] animate-pulse' : ''}`}
                        style={!takeoverEnabled ? {
                            backgroundColor: color,
                            boxShadow: `0 0 10px ${color}`
                        } : {}}
                    />
                    {t('home.agenda')}
                    {takeoverEnabled && (
                        <span className="ml-2 px-2 py-0.5 bg-neon-red text-white text-[9px] font-black rounded-full animate-bounce shadow-[0_0_15px_rgba(255,0,51,0.6)] uppercase tracking-tighter">
                            {t('home.live_now')}
                        </span>
                    )}
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

            <div className="flex-1 space-y-4 p-8 -m-8 overflow-x-auto md:overflow-visible no-scrollbar">
                {takeoverEnabled && (
                    <Link
                        to="/live"
                        className="block relative group overflow-hidden rounded-xl border-2 border-neon-red shadow-[0_0_20px_rgba(255,0,51,0.6)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_35px_rgba(255,0,51,0.9)] bg-black"
                        onClick={playHoverSound}
                        style={{ height: 'auto' }}
                    >
                        {/* Effet de balayage lumineux périodique */}
                        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                            <motion.div 
                                animate={{ x: ['100%', '-100%'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                            />
                        </div>

                        <div className="absolute inset-0 bg-neon-red/10 group-hover:bg-neon-red/20 transition-all duration-300 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-red/20 blur-3xl group-hover:bg-neon-red/30 transition-all duration-500 rounded-full mix-blend-screen pointer-events-none translate-x-1/2 -translate-y-1/2" />

                        <div className="p-3 lg:p-4 flex items-center gap-3 lg:gap-4 relative z-10">
                            <div className="relative">
                                <div className="absolute inset-0 bg-neon-red blur-md rounded-full animate-pulse opacity-50" />
                                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-black rounded-full border-2 border-neon-red flex items-center justify-center relative z-10 overflow-hidden">
                                    {takeoverSettings?.festivalLogo ? (
                                        <img src={takeoverSettings.festivalLogo} alt="Festival Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera className="w-4 h-4 text-neon-red" />
                                    )}
                                    <span className="absolute bottom-[-2px] right-[-2px] w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-neon-red shadow-[0_0_10px_#ff0033] animate-pulse" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 lg:gap-3 mb-1">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] lg:text-[11px] font-black text-white bg-neon-red px-2 py-0.5 rounded-sm uppercase tracking-widest shadow-[0_0_10px_rgba(255,0,51,0.5)] w-fit">DIRECT</span>
                                        {viewersCount > 0 && (
                                            <span className="text-[9px] font-black text-neon-red mt-1 flex items-center gap-1">
                                                <Users className="w-2.5 h-2.5" /> {viewersCount} SPECTATEURS
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <h4 className="text-sm lg:text-base font-display font-black text-white uppercase tracking-tighter truncate group-hover:text-neon-red transition-colors duration-300">
                                    {takeoverSettings?.title || 'DROPSIDERS LIVE'}
                                </h4>
                                {currentArtist && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <Music2 className="w-2.5 h-2.5 text-neon-cyan" />
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                            EN LIVE : <span className="text-white">{currentArtist.artist}</span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                )}
                {upcomingEvents.map((event: any, index: number) => {
                    const styles = getEventStyles(event.genre);
                    return (
                        <Link
                            key={event.compositeId}
                            to={event.isLiveTakeover || event.isLiveDropsiders ? '/live' : getAgendaLink(event)}
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
                                className={`p-4 rounded-xl bg-[#080808] border border-white/5 hover:bg-[#0a0a0a] ${styles.hoverBorder} ${styles.shadow} transition-all duration-300 relative overflow-hidden group min-h-[90px] flex flex-col justify-center`}
                            >
                                {/* Photo en Fond */}
                                <img
                                    src={resolveImageUrl(event.image)}
                                    className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700 pointer-events-none"
                                    alt=""
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070&auto=format&fit=crop';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent pointer-events-none" />

                                <div className="relative z-10">
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
                                                className={`font-display font-bold text-white flex items-center gap-2 ${styles.groupHoverText} transition-all duration-300 line-clamp-4 uppercase italic tracking-tighter text-sm`}
                                                title={event.title}
                                            >
                                                {event.title}
                                                {event.isLiveDropsiders && (
                                                    <div className="flex items-center gap-1.5 shrink-0 px-1.5 py-0.5 bg-neon-red/20 border border-neon-red/30 rounded-full">
                                                        <div className="w-1.5 h-1.5 bg-neon-red rounded-full animate-pulse shadow-[0_0_8px_#ff0033]" />
                                                        <span className="text-[7px] font-black uppercase text-neon-red tracking-widest break-normal whitespace-nowrap">Live</span>
                                                    </div>
                                                )}
                                            </h4>
                                        </div>
                                        <div className="text-center bg-black/40 backdrop-blur-md rounded-lg p-1.5 min-w-[3.2rem] border border-white/10 flex flex-col justify-center min-h-[3.2rem] shadow-lg">
                                            <span className={`block text-[7px] ${styles.text} font-bold uppercase leading-none mb-1 tracking-tighter`}>
                                                {event.startDate && event.endDate && event.startDate !== event.endDate ? (
                                                    new Date(event.startDate).getMonth() === new Date(event.endDate).getMonth() ?
                                                        new Date(event.startDate).toLocaleString(locale, { month: 'short' }).replace('.', '').substring(0, 4)
                                                        :
                                                        `${new Date(event.startDate).toLocaleString(locale, { month: 'short' }).replace('.', '').substring(0, 3)}-${new Date(event.endDate).toLocaleString(locale, { month: 'short' }).replace('.', '').substring(0, 3)}`
                                                ) : (
                                                    new Date(event.startDate || event.date).toLocaleString(locale, { month: 'short' }).replace('.', '').substring(0, 4)
                                                )}
                                            </span>
                                            <span className={`block ${event.startDate && event.endDate && event.startDate !== event.endDate ? 'text-[10px]' : 'text-xs'} font-bold text-white leading-none tracking-tighter`}>
                                                {event.startDate && event.endDate && event.startDate !== event.endDate ? (
                                                    `${new Date(event.startDate).getDate()}-${new Date(event.endDate).getDate()}`
                                                ) : (
                                                    new Date(event.date || event.startDate).getDate()
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium font-bold">
                                        <span
                                            className="flex items-center gap-1.5 cursor-pointer hover:text-neon-red transition-colors"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                window.location.href = `/agenda?location=${encodeURIComponent(event.location)}`;
                                            }}
                                        >
                                            <MapPin className="w-3 h-3 text-neon-red shadow-[0_0_5px_rgba(255,0,51,0.5)]" /> {event.venue && `${event.venue}, `}{event.location}{event.location && event.country ? ', ' : ''}{event.country} <FlagIcon location={event.country || event.location} className="w-3 h-2" />
                                        </span>
                                    </div>
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
