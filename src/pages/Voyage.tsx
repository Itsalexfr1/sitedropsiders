import { useState, useEffect } from 'react';
import { 
    Navigation, MapPin, Calendar, ArrowRight, Zap, Info, Clock, 
    TrendingDown, Share2, ExternalLink, ChevronDown, Plane, Bus, ArrowRightLeft, HelpCircle, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { CovoitSection } from '../components/community/CovoitSection';
import { SEO } from '../components/utils/SEO';
import { useLanguage } from '../context/LanguageContext';


const CitySearchInput = ({ placeholder, icon: Icon, value, onSelect, travelType }: any) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!value) setQuery('');
    }, [value]);

    useEffect(() => {
        if(query.length < 2 || !isOpen) { setSuggestions([]); return; }
        
        const fetchAirports = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/voyage/airports?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setSuggestions(data.slice(0, 6));
                }
            } catch (e) {
                console.error("Airport search failed", e);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchAirports, 300);
        return () => clearTimeout(timer);
    }, [query, isOpen]);

    return (
        <div className="relative w-full">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-gray-700">
                <Icon className="w-4 h-4" />
            </div>
            <input 
                type="text" 
                required
                value={query}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setQuery(val);
                    if (travelType !== 'flight') onSelect({ name: val, iata: val });
                }}
                placeholder={placeholder}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4.5 pl-12 pr-4 text-white focus:outline-none focus:border-neon-red/40 focus:bg-black/60 transition-all uppercase text-[11px] font-black tracking-widest placeholder:text-gray-700 shadow-inner"
            />
            
            {isLoading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-3 h-3 border-2 border-neon-red/20 border-t-neon-red rounded-full animate-spin" />
                </div>
            )}

            <AnimatePresence>
                {isOpen && suggestions.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="absolute top-full left-0 w-full mt-3 bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden z-[110] shadow-[0_20px_60px_rgba(0,0,0,1)] max-h-80 overflow-y-auto"
                    >
                        {suggestions.map(s => (
                            <div 
                                key={s.id || s.iata_code || Math.random()} 
                                onClick={() => {
                                    setQuery(s.name.toUpperCase());
                                    onSelect({ name: s.name, iata: s.iata_code || s.name });
                                    setIsOpen(false);
                                }}
                                className="px-5 py-4 hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0 transition-colors"
                            >
                                <div className="flex flex-col">
                                    <span className="text-white text-xs font-black truncate uppercase tracking-widest">{s.name}</span>
                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">
                                        {s.city_name || s.city?.name} • {s.country_name || s.country?.name}
                                    </span>
                                </div>
                                {s.iata_code && (
                                    <span className="text-neon-red text-[11px] font-black px-2.5 py-1 bg-neon-red/10 rounded-lg border border-neon-red/20">
                                        {s.iata_code}
                                    </span>
                                )}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export function Voyage() {
    const { type } = useParams();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [travelType, setTravelType] = useState<'flight' | 'bus' | 'covoit'>(type === 'bus' ? 'bus' : (type === 'covoit' ? 'covoit' : 'flight'));
    
    useEffect(() => {
        if (type === 'bus' || type === 'vols' || type === 'covoit') {
            setTravelType(type === 'bus' ? 'bus' : (type === 'covoit' ? 'covoit' : 'flight'));
        }
    }, [type]);
    
    const [isRoundTrip, setIsRoundTrip] = useState(false);
    
    const [depObj, setDepObj] = useState<{name: string, iata: string}>({name: '', iata: ''});
    const [destObj, setDestObj] = useState<{name: string, iata: string}>({name: '', iata: ''});
    
    const [date, setDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [flightProvider, setFlightProvider] = useState('direct');
    const [busProvider, setBusProvider] = useState('omio');

    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<any[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [sortType, setSortType] = useState('price');
    const [visibleCount, setVisibleCount] = useState(10);
    const [cabinClass, setCabinClass] = useState('economy');
    const [searchStatus, setSearchStatus] = useState('');
    const statusMessages = ["Contact de la base de données...", "Scan des compagnies (V2)...", "Comparaison de 4 000+ routes...", "Optimisation des tarifs...", "Vérification des disponibilités..."];

    useEffect(() => {
        if (isSearching) {
            let i = 0;
            const interval = setInterval(() => {
                setSearchStatus(statusMessages[i % statusMessages.length]);
                i++;
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setSearchStatus('');
        }
    }, [isSearching]);


    const openSearchRedirect = (provider: string) => {
        const depCode = depObj.iata || depObj.name;
        const destCode = destObj.iata || destObj.name;
        
        const searchDate = date ? new Date(date) : new Date();
        const yy = searchDate.getFullYear().toString().slice(-2);
        const mm = (searchDate.getMonth() + 1).toString().padStart(2, '0');
        const dd = searchDate.getDate().toString().padStart(2, '0');

        let ryy = '', rmm = '', rdd = '';
        if (isRoundTrip && returnDate) {
            const rDate = new Date(returnDate);
            ryy = rDate.getFullYear().toString().slice(-2);
            rmm = (rDate.getMonth() + 1).toString().padStart(2, '0');
            rdd = rDate.getDate().toString().padStart(2, '0');
        }

        let url = '';
        if (travelType === 'flight') {
            switch(provider) {
                case 'google': url = `https://www.google.com/travel/flights?q=flights+to+${destCode}+from+${depCode}+on+${date}${isRoundTrip ? '+through+'+returnDate : ''}`; break;
                case 'skyscanner': url = `https://www.skyscanner.fr/transport/vols/${depCode}/${destCode}/${yy}${mm}${dd}/` + (isRoundTrip ? `${ryy}${rmm}${rdd}/` : ''); break;
                case 'liligo': url = `https://www.liligo.fr/recherche-vol?departureCode=${depCode}&destinationCode=${destCode}&departureDate=${date}${isRoundTrip ? '&returnDate='+returnDate : ''}`; break;
                case 'kayak': default: url = `https://www.kayak.fr/flights/${depCode}-${destCode}/${date}${isRoundTrip ? '/'+returnDate : ''}`; break;
            }
        } else if (travelType === 'covoit') {
            url = `https://www.blablacar.fr/search?fn=${depCode}&tn=${destCode}&db=${date}`;
        } else {
            switch(provider) {
                case 'busbud': url = `https://www.busbud.com/fr/search/${depCode}/${destCode}/${date}`; break;
                case 'flixbus': url = `https://shop.flixbus.fr/search?departureCity=${depCode}&arrivalCity=${destCode}&rideDate=${date}`; break;
                case 'blablacar': url = `https://www.blablacar.fr/search?fn=${depCode}&tn=${destCode}&db=${date}`; break;
                case 'omio': default: url = `https://www.omio.fr/search-frontend/results/${depCode}/${destCode}/bus`; break;
            }
        }
        window.open(url, '_blank');
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearching(true);
        setError(null);
        setResults([]);
        setExpandedId(null);
        
        const depCode = depObj.iata || depObj.name;
        const destCode = destObj.iata || destObj.name;

        if (travelType === 'flight' && flightProvider === 'direct' && (depCode.length !== 3 || destCode.length !== 3)) {
            setError("Veuillez sélectionner un aéroport dans la liste pour continuer (Code IATA requis).");
            return;
        }

        setIsSearching(true);
        setError(null);
        setResults([]);

        if (travelType === 'flight' && flightProvider === 'direct') {
            try {
                const response = await fetch('/api/voyage/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: {
                            slices: [
                                { origin: depCode.toUpperCase(), destination: destCode.toUpperCase(), departure_date: date },
                                ...(isRoundTrip && returnDate ? [{ origin: destCode.toUpperCase(), destination: depCode.toUpperCase(), departure_date: returnDate }] : [])
                            ],
                            passengers: [{ type: "adult" }],
                            cabin_class: cabinClass
                        }
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    const msg = errData.error || errData.errors?.[0]?.message || `Erreur API (${response.status})`;
                    throw new Error(msg);
                }
                const data = await response.json();
                
                if (data.error) throw new Error(`Proxy: ${data.error}`);
                
                const offers = data.data?.offers || [];

                if (offers.length === 0) {
                    setError("Aucun vol direct trouvé via 'Moteur Flash'. Utilise un partenaire ci-dessous.");
                    return;
                }

                const mappedResults = offers
                    .map((offer: any) => {
                        if (!offer) return null;
                        const slice = offer.slices?.[0];
                        if (!slice) return null;
                        const segments = slice.segments || [];
                        if (segments.length === 0) return null;

                        const match = (slice.duration || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
                        const h = match ? parseInt(match[1] || '0') : 0;
                        const m = match ? parseInt(match[2] || '0') : 0;
                        const durationMinutes = (h * 60) + m;
                        
                        const stopCodes = segments.length > 1 
                            ? segments.slice(0, -1).map((s: any) => s.destination?.iata_code).filter(Boolean).join(', ')
                            : null;

                        // Identify the real cabin class from the first segment if available
                        const actualCabinClass = segments[0]?.passenger_conditions?.cabin_class || cabinClass;

                        return {
                            id: offer.id,
                            company: offer.owner?.name || 'Inconnue',
                            iata: offer.owner?.iata_code || '??',
                            price: parseFloat(offer.total_amount),
                            duration: (slice.duration || '').replace('PT', '').replace('H', 'h ').replace('M', 'm').toLowerCase(),
                            duration_minutes: durationMinutes,
                            cabin_class: actualCabinClass,
                            stops: segments.length - 1,
                            stopCodes,
                            departureTime: segments[0]?.departing_at ? new Date(segments[0].departing_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}) : '--:--',
                            arrivalTime: segments[segments.length - 1]?.arriving_at ? new Date(segments[segments.length - 1].arriving_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}) : '--:--',
                            departureIata: segments[0]?.origin?.iata_code || '???',
                            arrivalIata: segments[segments.length - 1]?.destination?.iata_code || '???',
                            allSegments: segments.map((s: any) => ({
                                id: s.id,
                                origin: s.origin?.iata_code,
                                destination: s.destination?.iata_code,
                                departing_at: s.departing_at,
                                arriving_at: s.arriving_at,
                                marketing_carrier: s.marketing_carrier?.name || 'Inconnue',
                                marketing_carrier_iata: s.marketing_carrier?.iata_code || '??',
                                flight_number: s.marketing_carrier_flight_number,
                                duration: (s.duration || '').replace('PT', '').replace('H', 'h ').replace('M', 'm').toLowerCase()
                            }))
                        };
                    })
                    .filter(Boolean);

                setResults(mappedResults);
            } catch (err: any) {
                console.error("Voyage Search Crash:", err);
                setError(err.message || "Erreur inconnue");
            } finally {
                setIsSearching(false);
            }
            return;
        }

        openSearchRedirect(travelType === 'flight' ? flightProvider : busProvider);
        setIsSearching(false);
    };

    const cabinClassOrder: Record<string, number> = { first: 0, business: 1, premium_economy: 2, economy: 3 };
    const sortedResults = [...results].sort((a: any, b: any) => {
        if (sortType === 'price') return a.price - b.price;
        if (sortType === 'duration') return a.duration_minutes - b.duration_minutes;
        if (sortType === 'stops') return a.stops - b.stops;
        if (sortType === 'class') {
            const classDiff = (cabinClassOrder[a.cabin_class] ?? 9) - (cabinClassOrder[b.cabin_class] ?? 9);
            if (classDiff !== 0) return classDiff;
            return a.price - b.price; // Also sort by price within the same class
        }
        return 0;
    });

    return (
        <div className="min-h-screen bg-[#050505] pb-32">
            <SEO title="Voyage & Comparateur | Dropsiders" description="Le comparateur de voyage ultime pour vos festivals. Vols, Bus et Trains au meilleur prix." />
            
            <div className="relative pt-20 pb-12 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-neon-red/10 border border-neon-red/20 rounded-full mb-6"
                    >
                        <Zap className="w-3 h-3 text-neon-red" />
                        <span className="text-[10px] font-black text-neon-red uppercase tracking-widest italic">TRAVEL ENGINE v4.2</span>
                    </motion.div>
                    <h1 className="text-5xl md:text-8xl font-display font-black text-neon-red outline-text italic uppercase tracking-tighter leading-tight">
                        VOYAGE
                    </h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 mt-4">
                <div className="lg:col-span-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden"
                    >
                        <div className="flex bg-white/5 p-1.5 rounded-2xl w-fit mb-12 border border-white/5">
                            {[
                                { id: 'flight', icon: Plane, label: 'AVION' },
                                { id: 'bus', icon: Bus, label: 'BUS / TRAIN' },
                                { id: 'covoit', icon: Users, label: 'COVOITURAGE' }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => { 
                                        const newType = t.id as any;
                                        setTravelType(newType); 
                                        setResults([]); 
                                        setError(null);
                                        const pathMap: any = { flight: 'vols', bus: 'bus', covoit: 'covoiturage' };
                                        navigate(`/voyage/${pathMap[newType] || 'vols'}`);
                                    }}
                                    className={`flex items-center gap-4 px-8 py-3.5 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all ${
                                        travelType === t.id ? 'bg-white text-black shadow-xl' : 'text-gray-500 hover:text-white'
                                    }`}
                                >
                                    <t.icon className="w-4 h-4" /> {t.label}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="popLayout">
                            <motion.div
                                key={travelType}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="mt-4"
                            >
                                {travelType === 'covoit' ? (
                                    <CovoitSection />
                                ) : (
                                    <form onSubmit={handleSearch} className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                    <div className="space-y-3">
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">DÉPART</span>
                                        <CitySearchInput placeholder="VILLE OU AÉROPORT" icon={Navigation} value={depObj.iata} onSelect={setDepObj} travelType={travelType} />
                                    </div>
                                    <div className="hidden md:flex absolute left-1/2 bottom-5 -translate-x-1/2 z-20">
                                        <button 
                                            type="button"
                                            onClick={() => { const d = depObj; setDepObj(destObj); setDestObj(d); }}
                                            className="w-12 h-12 bg-black border-2 border-white/10 rounded-full flex items-center justify-center text-white hover:border-neon-red hover:text-neon-red transition-all group scale-90 shadow-2xl"
                                        >
                                            <ArrowRightLeft className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">DESTINATION</span>
                                        <CitySearchInput placeholder="DESTINATION" icon={MapPin} value={destObj.iata} onSelect={setDestObj} travelType={travelType} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">DATE ALLER</span>
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-neon-red transition-colors" />
                                            <input 
                                                type="date" 
                                                required
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4.5 pl-12 pr-4 text-white focus:outline-none focus:border-neon-red/40 transition-all font-black text-xs [color-scheme:dark]"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center ml-2">
                                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">DATE RETOUR</span>
                                            <span className="text-[9px] font-black uppercase text-gray-600 tracking-[0.1em] italic">Optionnel</span>
                                        </div>
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-neon-red transition-colors" />
                                            <input 
                                                type="date" 
                                                value={returnDate}
                                                onChange={(e) => { setReturnDate(e.target.value); setIsRoundTrip(!!e.target.value); }}
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4.5 pl-12 pr-4 text-white focus:outline-none focus:border-neon-red/40 transition-all font-black text-xs [color-scheme:dark]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 pt-10 border-t border-white/5 space-y-8">
                                    {travelType === 'flight' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 ml-2">
                                                <span className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">{t('voyage.cabin_class')}</span>
                                                <div className="group relative">
                                                    <Info className="w-3.5 h-3.5 text-gray-700 hover:text-gray-400 transition-colors cursor-help" />
                                                    <div className="absolute bottom-full left-0 mb-3 w-64 p-4 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl text-[10px] font-bold text-gray-300 uppercase leading-relaxed opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-2xl">
                                                        {t('voyage.cabin_class_info')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {[
                                                    { id: 'economy', label: t('voyage.economy'), emoji: '💺' },
                                                    { id: 'premium_economy', label: t('voyage.premium_economy'), emoji: '⭐' },
                                                    { id: 'business', label: t('voyage.business'), emoji: '💎' },
                                                    { id: 'first', label: t('voyage.first'), emoji: '👑' },
                                                ].map((cls) => (
                                                    <button
                                                        key={cls.id}
                                                        type="button"
                                                        onClick={() => { setCabinClass(cls.id); setResults([]); setError(null); }}
                                                        className={`flex items-center justify-center gap-2 px-4 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                                                            cabinClass === cls.id
                                                                ? 'bg-neon-red/10 border-neon-red text-white shadow-[0_0_20px_rgba(255,18,65,0.15)] scale-[1.02]'
                                                                : 'bg-white/5 border-white/5 text-gray-600 hover:bg-white/10 hover:border-white/10'
                                                        }`}
                                                    >
                                                        <span className="text-sm">{cls.emoji}</span>
                                                        <span>{cls.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] ml-2 italic">{t('voyage.source')}</h4>
                                        <div className="flex flex-wrap gap-3">
                                            {(travelType === 'flight' ? ['direct', 'google', 'skyscanner', 'kayak', 'liligo'] : ['omio', 'busbud', 'flixbus', 'blablacar']).map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => { travelType === 'flight' ? setFlightProvider(p) : setBusProvider(p); setResults([]); setError(null); }}
                                                    className={`px-6 py-4 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                                                        (travelType === 'flight' ? flightProvider : busProvider) === p 
                                                            ? 'bg-white/10 border-neon-red text-white shadow-[0_0_20px_rgba(255,18,65,0.15)]' 
                                                            : 'bg-white/5 border-white/5 text-gray-600 hover:bg-white/10 hover:border-white/10'
                                                    }`}
                                                >
                                                    {p === 'direct' ? '⚡ MOTEUR FLASH (RECOMMANDÉ)' : p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button
                                            type="submit"
                                            disabled={isSearching}
                                            className="w-full py-7 bg-neon-red text-white rounded-3xl font-black uppercase text-sm tracking-[0.4em] hover:bg-white hover:text-black transition-all duration-500 shadow-[0_0_50px_rgba(255,18,65,0.3)] disabled:opacity-50 flex items-center justify-center gap-4 group"
                                        >
                                            {isSearching ? (
                                                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    {t('voyage.search_btn')} 
                                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                </form>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div 
                                key="error"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mt-8 p-8 bg-neon-red/5 border-2 border-neon-red/20 rounded-[40px] flex flex-col gap-6"
                            >
                                <div className="flex gap-5 items-start">
                                    <div className="w-10 h-10 bg-neon-red/10 rounded-full flex items-center justify-center shrink-0">
                                        <Info className="w-5 h-5 text-neon-red" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-white text-sm font-black uppercase tracking-widest">AIE... MOTEUR INDISPONIBLE</h4>
                                        <p className="text-sm font-bold text-gray-500 italic uppercase">DÉTAIL : {error}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-4 ml-15">
                                    <button 
                                        onClick={() => openSearchRedirect('skyscanner')}
                                        className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                                    >
                                        <ExternalLink className="w-3 h-3" /> VOIR SUR SKYSCANNER
                                    </button>
                                    <button 
                                        onClick={() => openSearchRedirect('google')}
                                        className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                                    >
                                        <ExternalLink className="w-3 h-3" /> VOIR SUR GOOGLE FLIGHTS
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {isSearching && (
                            <motion.div 
                                key="loading"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="mt-20 flex flex-col items-center gap-10 py-10"
                            >
                                <div className="relative">
                                    <div className="w-24 h-24 border-b-4 border-neon-red rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Zap className="w-8 h-8 text-white animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-center space-y-4">
                                    <h3 className="text-4xl font-display font-black text-white italic uppercase tracking-tighter">ANALYSE EN COURS</h3>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="px-4 py-1.5 bg-neon-red/10 border border-neon-red/20 rounded-full">
                                            <span className="text-[11px] font-black text-neon-red uppercase tracking-[0.3em]">{searchStatus}</span>
                                        </div>
                                        <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.5em] mt-2">DÉCRYPTAGE DU FLUX DUFFEL v2</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {results.length > 0 && !isSearching && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-12 space-y-6"
                            >
                                {/* Results Header & Sort */}
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 px-4">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter">{t('voyage.offers_found')}</h3>
                                        <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                            <span className="text-[9px] font-black text-green-500 tracking-[0.2em]">{results.length} {t('voyage.results_found')}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                                        {[
                                            { id: 'price', label: t('voyage.sort_price'), icon: TrendingDown },
                                            { id: 'class', label: t('voyage.sort_class'), icon: Navigation },
                                            { id: 'duration', label: t('voyage.sort_duration'), icon: Clock },
                                            { id: 'stops', label: t('voyage.sort_stops'), icon: Share2 }
                                        ].map((s) => (
                                            <button
                                                key={s.id}
                                                onClick={() => setSortType(s.id)}
                                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                                                    sortType === s.id ? 'bg-white text-black shadow-2xl' : 'text-gray-500 hover:text-white'
                                                }`}
                                            >
                                                <s.icon className="w-3.5 h-3.5" />
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {sortedResults.slice(0, visibleCount).map((r, idx) => (
                                    <motion.div 
                                        key={r.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-[#0c0c0c] border border-white/5 rounded-[32px] overflow-hidden hover:border-neon-red/30 transition-all group shadow-2xl"
                                    >
                                        <div className="p-8 md:p-10 flex flex-col lg:flex-row justify-between items-center gap-10">
                                            <div className="flex items-center gap-8 w-full lg:w-auto">
                                                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/5 shrink-0 relative order-1 lg:order-none">
                                                    <img 
                                                        src={`https://logos.skyscnr.com/images/airlines/favicon/${r.iata}.png`} 
                                                        alt={r.company}
                                                        onError={(e: any) => e.target.src = 'https://cdn-icons-png.flaticon.com/512/780/780614.png'} 
                                                        className="w-12 h-12 object-contain brightness-150"
                                                    />
                                                </div>
                                                
                                                <div className="flex-1 space-y-6">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-base font-black text-white uppercase italic tracking-tighter group-hover:text-neon-red transition-colors">{r.company}</span>
                                                        <span className={`text-[10px] font-black px-3 py-1 border rounded-lg uppercase tracking-widest ${r.stops === 0 ? 'text-green-500 border-green-500/20 bg-green-500/5' : 'text-neon-red border-neon-red/20 bg-neon-red/5'}`}>
                                                            {r.stops === 0 ? t('voyage.direct') : `${r.stops} ${t('voyage.stops')}`}
                                                        </span>
                                                        {r.cabin_class && (
                                                            <span className={`text-[9px] font-black px-3 py-1 border rounded-lg uppercase tracking-widest ${
                                                                r.cabin_class === 'first' ? 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5' :
                                                                r.cabin_class === 'business' ? 'text-purple-400 border-purple-400/20 bg-purple-400/5' :
                                                                r.cabin_class === 'premium_economy' ? 'text-blue-400 border-blue-400/20 bg-blue-400/5' :
                                                                'text-gray-500 border-gray-700 bg-white/[0.02]'
                                                            }`}>
                                                                {r.cabin_class === 'first' ? '👑 Première' :
                                                                 r.cabin_class === 'business' ? '💎 Business' :
                                                                 r.cabin_class === 'premium_economy' ? '⭐ Premium Éco' :
                                                                 '💺 Économie'}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-8">
                                                        <div className="text-center min-w-[70px]">
                                                            <div className="text-2xl font-black text-white tracking-tight">{r.departureTime}</div>
                                                            <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest mt-1.5">{r.departureIata}</div>
                                                        </div>

                                                        <div className="flex-1 min-w-[140px] flex flex-col items-center gap-3">
                                                            <div className="text-[9px] font-black text-gray-500 italic uppercase tracking-[0.2em]">{r.duration}</div>
                                                            <div className="relative w-full h-[2px] bg-white/5 rounded-full">
                                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white/10 rounded-full border border-white/5" />
                                                                
                                                                {/* Layover markers */}
                                                                {r.stops > 0 && Array.from({length: r.stops}).map((_, i) => (
                                                                    <div 
                                                                        key={i} 
                                                                        className="absolute w-1.5 h-1.5 bg-neon-red/40 border border-neon-red/20 rounded-full top-1/2 -translate-y-1/2" 
                                                                        style={{ left: `${((i + 1) / (r.stops + 1)) * 100}%` }}
                                                                    />
                                                                ))}

                                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-neon-red/30 rounded-full border border-neon-red/20 animate-pulse" />
                                                            </div>
                                                            {r.stopCodes && (
                                                                <div className="text-[8px] font-black text-neon-red/40 uppercase tracking-widest bg-neon-red/[0.03] px-2 py-0.5 rounded-md">
                                                                    Escale: {r.stopCodes}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="text-center min-w-[70px]">
                                                            <div className="text-2xl font-black text-white tracking-tight">{r.arrivalTime}</div>
                                                            <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest mt-1.5">{r.arrivalIata}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-8 pt-8 lg:pt-0 border-t lg:border-t-0 border-white/5">
                                                <div className="text-left lg:text-right">
                                                    <div className="flex items-baseline gap-1">
                                                        <div className="text-5xl lg:text-6xl font-display font-black text-white group-hover:scale-110 transition-transform origin-right">{Math.round(r.price)}<span className="text-xl ml-1 italic">€</span></div>
                                                    </div>
                                                    <p className="text-[10px] font-black text-green-500 uppercase tracking-[0.3em] mt-2 flex items-center gap-2 justify-end">
                                                        <Zap className="w-3 h-3" /> {t('voyage.best_offer')}
                                                    </p>
                                                </div>
                                                
                                                <button 
                                                    onClick={() => openSearchRedirect('skyscanner')}
                                            className="px-10 py-5 bg-white text-black rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-neon-red hover:text-white transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] flex items-center gap-3 shrink-0 active:scale-95"
                                                >
                                                    {t('voyage.book')} <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expandable Info Bar */}
                                        <div className="bg-white/[0.02] border-t border-white/5 px-8 py-4 flex items-center justify-between">
                                            <div className="flex gap-6">
                                                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                                                    <Info className="w-3 h-3" /> {t('voyage.cabin_bag')}
                                                </span>
                                                <button 
                                                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                                                    className="text-[9px] font-black text-neon-red uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors"
                                                >
                                                    <ChevronDown className={`w-3 h-3 transition-transform duration-500 ${expandedId === r.id ? 'rotate-180' : ''}`} /> 
                                                    {expandedId === r.id ? t('voyage.hide_details') : t('voyage.show_details')}
                                                </button>
                                            </div>
                                            <div className="hidden md:block">
                                                 <span className="text-[9px] font-black text-neon-red uppercase tracking-[0.2em] italic">{t('voyage.last_seats')}</span>
                                            </div>
                                        </div>

                                        {/* Detailed Breakdown */}
                                        <AnimatePresence>
                                            {expandedId === r.id && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden bg-black/40 border-t border-white/5"
                                                >
                                                    <div className="p-8 space-y-8">
                                                        {r.allSegments.map((segment: any, sIdx: number) => (
                                                            <div key={segment.id} className="relative">
                                                                {/* Connection Line */}
                                                                {sIdx < r.allSegments.length - 1 && (
                                                                    <div className="absolute left-[21px] top-12 bottom-0 w-[1px] bg-dashed-white border-l border-white/10" />
                                                                )}
                                                                
                                                                <div className="flex gap-10">
                                                                    <div className="w-11 h-11 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center shrink-0">
                                                                        <img 
                                                                            src={`https://logos.skyscnr.com/images/airlines/favicon/${segment.marketing_carrier_iata}.png`} 
                                                                            alt={segment.marketing_carrier}
                                                                            className="w-7 h-7 object-contain"
                                                                        />
                                                                    </div>
                                                                    
                                                                    <div className="flex-1 space-y-4">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                                                                {segment.marketing_carrier} • {segment.marketing_carrier_iata}{segment.flight_number}
                                                                            </span>
                                                                            <span className="text-[10px] font-bold text-gray-500 uppercase">{segment.duration}</span>
                                                                        </div>
                                                                        
                                                                        <div className="flex items-center gap-10">
                                                                            <div>
                                                                                <div className="text-lg font-black text-white">{new Date(segment.departing_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</div>
                                                                                <div className="text-[9px] font-bold text-gray-600 uppercase mt-1">{segment.origin}</div>
                                                                            </div>
                                                                            <ArrowRight className="w-4 h-4 text-white/20" />
                                                                            <div>
                                                                                <div className="text-lg font-black text-white">{new Date(segment.arriving_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</div>
                                                                                <div className="text-[9px] font-bold text-gray-600 uppercase mt-1">{segment.destination}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Layover Info */}
                                                                {sIdx < r.allSegments.length - 1 && (
                                                                    <div className="ml-21 py-6">
                                                                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-neon-red/5 border border-neon-red/10 rounded-full">
                                                                            <Clock className="w-3 h-3 text-neon-red" />
                                                                            <span className="text-[9px] font-black text-neon-red uppercase tracking-widest">
                                                                                {t('voyage.layover_at')} {segment.destination}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}

                                {/* VOIR PLUS button */}
                                {sortedResults.length > visibleCount && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex justify-center pt-4"
                                    >
                                        <button
                                            onClick={() => setVisibleCount(v => v + 10)}
                                            className="px-12 py-5 border border-white/10 bg-white/5 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] hover:bg-white hover:text-black transition-all flex items-center gap-3"
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                            {t('voyage.see_more')} ({sortedResults.length - visibleCount} {t('voyage.remaining')})
                                        </button>
                                    </motion.div>
                                )}

                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-[#0c0c0c] border border-white/10 rounded-[40px] p-8 md:p-10 space-y-12">
                        <section className="space-y-8">
                            <h3 className="text-xl font-display font-black text-white italic uppercase italic">AIDE <span className="text-neon-red">& INFO</span></h3>
                            <div className="space-y-12">
                                {[
                                    { title: 'MOTEU FLASH', desc: 'Scan temps réel via notre Proxy sécurisé.', icon: Zap },
                                    { title: 'MULTI-PARTENAIRES', desc: 'Si le moteur flash est vide, bascule sur Skyscanner.', icon: HelpCircle },
                                    { title: 'AUTOSAVE IATA', desc: 'Le moteur utilise les codes CDG/LAS officiels.', icon: MapPin }
                                ].map((f, i) => (
                                    <div key={i} className="flex gap-5">
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
                                            <f.icon className="w-5 h-5 text-neon-red" />
                                        </div>
                                        <div className="pt-1">
                                            <h4 className="text-[11px] font-black uppercase text-white tracking-[0.2em]">{f.title}</h4>
                                            <p className="text-gray-500 text-[9px] font-bold leading-relaxed mt-2 uppercase tracking-wide">{f.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="pt-10 border-t border-white/5">
                            <div className="bg-gradient-to-br from-neon-red/10 to-transparent border border-neon-red/20 rounded-[32px] p-8 group relative overflow-hidden cursor-pointer" onClick={() => { setTravelType('covoit'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                                <h3 className="text-white text-2xl font-display font-black italic uppercase leading-tight">COVOITURAGE<br/><span className="text-neon-red">FESTIVAL</span></h3>
                                <p className="text-gray-500 text-[10px] font-bold mt-4 uppercase tracking-[0.2em]">Partage les frais & voyage ensemble.</p>
                                <button className="mt-8 flex items-center gap-3 text-white text-[10px] font-black uppercase tracking-[0.4em] hover:text-neon-red transition-all">
                                    REJOINDRE LE FLOT <ArrowRight className="w-4 h-4 text-neon-red" />
                                </button>
                                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-neon-red/15 blur-3xl rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
