import { useState, useEffect, useRef } from 'react';
import { Plane, Bus, Calendar, MapPin, ArrowRightLeft, Navigation, ArrowRight, ShieldCheck, Zap, Info, Clock, ExternalLink, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CovoitSection } from '../components/community/CovoitSection';
import { SEO } from '../components/utils/SEO';

const SkeletonCard = () => (
    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 h-32 animate-pulse flex items-center justify-between">
        <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-white/5 rounded-xl" />
            <div className="space-y-2">
                <div className="w-32 h-4 bg-white/5 rounded" />
                <div className="w-24 h-3 bg-white/5 rounded" />
            </div>
        </div>
        <div className="w-20 h-8 bg-white/5 rounded" />
    </div>
);

const CitySearchInput = ({ placeholder, icon: Icon, value, onChange, travelType }: any) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if(value && query === '') setQuery(value);
        if(!value && query !== '') setQuery('');
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
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                <Icon className="w-4 h-4 text-gray-500" />
            </div>
            <input 
                type="text" 
                required
                value={query}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                onChange={(e) => {
                    const val = e.target.value;
                    setQuery(val);
                    if(val === '') onChange('');
                    if(travelType !== 'flight') onChange(val);
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
                                    setQuery(s.name);
                                    onChange(s.iata_code || s.name);
                                    setIsOpen(false);
                                }}
                                className="px-5 py-4 hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0 transition-colors"
                            >
                                <div className="flex flex-col">
                                    <span className="text-white text-xs font-black truncate uppercase">{s.name}</span>
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
    const [travelType, setTravelType] = useState<'flight' | 'bus'>('flight');
    const [isRoundTrip, setIsRoundTrip] = useState(false);
    
    const [departure, setDeparture] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    
    const [flightProvider, setFlightProvider] = useState('direct');
    const [busProvider, setBusProvider] = useState('omio');

    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<any[]>([]);

    const covoitRef = useRef<HTMLDivElement>(null);

    const scrollToCovoit = () => {
        covoitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearching(true);
        setError(null);
        setResults([]);
        
        const upperDep = departure.toUpperCase();
        const upperDest = destination.toUpperCase();
        
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
        
        if (travelType === 'flight' && flightProvider === 'direct') {
            try {
                const response = await fetch('/api/voyage/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: {
                            slices: [
                                { origin: upperDep, destination: upperDest, departure_date: date },
                                ...(isRoundTrip ? [{ origin: upperDest, destination: upperDep, departure_date: returnDate }] : [])
                            ],
                            passengers: [{ type: "adult" }],
                            return_offers: true
                        }
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.errors?.[0]?.message || "Aucun vol direct disponible pour ce trajet via note moteur IA. Utilise un partenaire externe ci-dessous.");
                }

                const data = await response.json();
                const offers = data.data.offers || [];

                if (offers.length === 0) {
                    setError("Aucun vol trouvé via l'API directe. Essaie un partenaire externe ci-dessous.");
                    return;
                }

                const mappedResults = offers
                    .sort((a: any, b: any) => parseFloat(a.total_amount) - parseFloat(b.total_amount))
                    .slice(0, 10)
                    .map((offer: any) => {
                        const slice = offer.slices[0];
                        const segment = slice.segments[0];
                        const arrivalSegment = slice.segments[slice.segments.length - 1];
                        
                        return {
                            id: offer.id,
                            company: offer.owner.name,
                            iata: offer.owner.iata_code,
                            price: offer.total_amount,
                            currency: offer.total_currency,
                            duration: slice.duration.replace('PT', '').replace('H', 'h').replace('M', 'm').toLowerCase(),
                            stops: slice.segments.length - 1,
                            departureTime: new Date(segment.departing_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
                            arrivalTime: new Date(arrivalSegment.arriving_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
                            isRoundTrip: offer.slices.length > 1
                        };
                    });

                setResults(mappedResults);
            } catch (err: any) {
                setError(err.message || "Erreur de connexion. Vérifie tes villes de départ/arrivée.");
            } finally {
                setIsSearching(false);
            }
            return;
        }

        // External redirects
        let finalUrl = '';
        if (travelType === 'flight') {
            switch(flightProvider) {
                case 'google': finalUrl = `https://www.google.com/travel/flights?q=flights+to+${upperDest}+from+${upperDep}+on+${date}${isRoundTrip ? '+through+'+returnDate : ''}`; break;
                case 'skyscanner': finalUrl = `https://www.skyscanner.fr/transport/vols/${upperDep}/${upperDest}/${yy}${mm}${dd}/` + (isRoundTrip ? `${ryy}${rmm}${rdd}/` : ''); break;
                case 'liligo': finalUrl = `https://www.liligo.fr/recherche-vol?departureCode=${upperDep}&destinationCode=${upperDest}&departureDate=${date}${isRoundTrip ? '&returnDate='+returnDate : ''}`; break;
                case 'kayak': default: finalUrl = `https://www.kayak.fr/flights/${upperDep}-${upperDest}/${date}${isRoundTrip ? '/'+returnDate : ''}?sort=price_a`; break;
            }
        } else {
            switch(busProvider) {
                case 'busbud': finalUrl = `https://www.busbud.com/fr/search/${upperDep}/${upperDest}/${date}${isRoundTrip ? '/'+returnDate : ''}`; break;
                case 'flixbus': finalUrl = `https://shop.flixbus.fr/search?departureCity=${upperDep}&arrivalCity=${upperDest}&rideDate=${date}${isRoundTrip ? '&backRideDate='+returnDate : ''}`; break;
                case 'blablacar': finalUrl = `https://www.blablacar.fr/search?fn=${upperDep}&tn=${upperDest}&db=${date}`; break;
                case 'omio': default: finalUrl = `https://www.omio.fr/search-frontend/results/${upperDep}/${upperDest}/bus`; break;
            }
        }
        window.open(finalUrl, '_blank');
        setIsSearching(false);
    };

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
                        <span className="text-[10px] font-black text-neon-red uppercase tracking-widest italic">Comparateur IA v4.0</span>
                    </motion.div>
                    <h1 className="text-5xl md:text-8xl font-display font-black text-white italic uppercase tracking-tighter leading-tight">
                        DIRECTION <span className="text-neon-red outline-text">FESTIVAL</span>
                    </h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 mt-4">
                <div className="lg:col-span-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl"
                    >
                        <div className="flex bg-white/5 p-1.5 rounded-2xl w-fit mb-12 border border-white/5">
                            {[
                                { id: 'flight', icon: Plane, label: 'AVION' },
                                { id: 'bus', icon: Bus, label: 'BUS / TRAIN' }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => { setTravelType(t.id as any); setResults([]); setError(null); }}
                                    className={`flex items-center gap-4 px-8 py-3.5 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all ${
                                        travelType === t.id ? 'bg-white text-black shadow-xl' : 'text-gray-500 hover:text-white'
                                    }`}
                                >
                                    <t.icon className="w-4 h-4" /> {t.label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSearch} className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                <div className="space-y-3">
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">DÉPART</span>
                                    <CitySearchInput placeholder="VILLE OU AÉROPORT" icon={Navigation} value={departure} onChange={setDeparture} travelType={travelType} />
                                </div>
                                <div className="hidden md:flex absolute left-1/2 bottom-5 -translate-x-1/2 z-20">
                                    <button 
                                        type="button"
                                        onClick={() => { const d = departure; setDeparture(destination); setDestination(d); }}
                                        className="w-12 h-12 bg-black border-2 border-white/10 rounded-full flex items-center justify-center text-white hover:border-neon-red hover:text-neon-red transition-all group scale-90"
                                    >
                                        <ArrowRightLeft className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">DESTINATION</span>
                                    <CitySearchInput placeholder="AÉROPORT D'ARRIVÉE" icon={MapPin} value={destination} onChange={setDestination} travelType={travelType} />
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
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">DATE RETOUR <span className="text-gray-600 italic ml-1">(OPTIONNEL)</span></span>
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

                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="flex-1 w-full md:w-auto">
                                    <h4 className="text-[10px] font-black uppercase text-gray-600 tracking-[0.3em] mb-4 ml-2">PARTENAIRES</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(travelType === 'flight' ? ['direct', 'google', 'skyscanner', 'kayak', 'liligo'] : ['omio', 'busbud', 'flixbus', 'blablacar']).map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => { travelType === 'flight' ? setFlightProvider(p) : setBusProvider(p); setResults([]); setError(null); }}
                                                className={`px-5 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    (travelType === 'flight' ? flightProvider : busProvider) === p ? 'bg-white/10 border-white/20 text-white shadow-lg' : 'bg-transparent border-white/5 text-gray-600 hover:text-gray-400'
                                                }`}
                                            >
                                                {p === 'direct' ? '⚡ MOTEUR DROPSIDERS' : p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSearching}
                                    className="w-full md:w-auto px-12 py-6 bg-neon-red text-white rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-500 shadow-[0_0_40px_rgba(255,18,65,0.2)] disabled:opacity-50 flex items-center justify-center gap-4 shrink-0"
                                >
                                    {isSearching ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <>RECHERCHER MAINTENANT <ArrowRight className="w-5 h-5" /></>}
                                </button>
                            </div>
                        </form>
                    </motion.div>

                    <div className="mt-12 space-y-6">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-6 bg-neon-red/5 border border-neon-red/20 rounded-3xl flex gap-4 items-start"
                                >
                                    <Info className="w-5 h-5 text-neon-red shrink-0" />
                                    <p className="text-sm font-bold text-gray-400 italic">{error}</p>
                                </motion.div>
                            )}

                            {isSearching && (
                                <div className="space-y-4">
                                    <SkeletonCard />
                                    <SkeletonCard />
                                    <SkeletonCard />
                                </div>
                            )}

                            {results.length > 0 && !isSearching && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between mb-8 px-2">
                                        <h3 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">MEILLEURES OFFRES</h3>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-neon-red uppercase tracking-widest px-3 py-1 bg-neon-red/5 border border-neon-red/10 rounded-full">
                                            <Filter className="w-3 h-3" /> TRIÉ PAR PRIX
                                        </div>
                                    </div>

                                    {results.map((r, idx) => (
                                        <motion.div 
                                            key={r.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-8 hover:border-neon-red/40 transition-all group"
                                        >
                                            <div className="flex items-center gap-8 w-full md:w-auto">
                                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
                                                    <img 
                                                        src={`https://logos.skyscnr.com/images/airlines/favicon/${r.iata}.png`} 
                                                        alt={r.company}
                                                        onError={(e: any) => e.target.src = 'https://cdn-icons-png.flaticon.com/512/780/780614.png'} 
                                                        className="w-10 h-10 object-contain brightness-200"
                                                    />
                                                </div>
                                                <div className="space-y-3 flex-1 min-w-[200px]">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-black text-white uppercase italic tracking-tight">{r.company}</span>
                                                        {r.stops === 0 ? (
                                                            <span className="text-[9px] font-black text-green-500 px-2 py-0.5 bg-green-500/5 border border-green-500/20 rounded-md">DIRECT</span>
                                                        ) : (
                                                            <span className="text-[9px] font-black text-neon-red px-2 py-0.5 bg-neon-red/5 border border-neon-red/20 rounded-md uppercase">{r.stops} ESCALE(S)</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-center">
                                                            <div className="text-xl font-black text-white">{r.departureTime}</div>
                                                            <div className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mt-1">DÉPART</div>
                                                        </div>
                                                        <div className="flex-1 flex flex-col items-center gap-1.5 pt-1">
                                                            <div className="flex items-center gap-2 text-[9px] font-black text-gray-500 italic">
                                                                <Clock className="w-3 h-3" /> {r.duration}
                                                            </div>
                                                            <div className="h-[2px] w-full bg-white/5 relative">
                                                                <div className="absolute inset-0 bg-neon-red" />
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-xl font-black text-white">{r.arrivalTime}</div>
                                                            <div className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mt-1">ARRIVÉE</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-10 w-full md:w-auto md:text-right border-t md:border-t-0 border-white/5 pt-6 md:pt-0">
                                                <div className="flex-1">
                                                    <div className="text-4xl font-display font-black text-white">{r.price} €</div>
                                                    <div className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mt-1 italic">Vols HT / Pers</div>
                                                </div>
                                                <button className="px-8 py-4 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-neon-red hover:text-white transition-all shadow-xl flex items-center gap-2">
                                                    SÉLECTIONNER <ExternalLink className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-[#0c0c0c] border border-white/10 rounded-[40px] p-8 md:p-10 space-y-10">
                        <section className="space-y-6">
                            <h3 className="text-xl font-display font-black text-white italic uppercase">PROTECTION <span className="text-neon-red">DROPSIDERS</span></h3>
                            <div className="space-y-10">
                                {[
                                    { title: 'IA META-SEARCH', desc: 'Scan de plus de 400 compagnies et transporteurs.', icon: ShieldCheck },
                                    { title: 'SÉCURITÉ ANTI-BLOCK', desc: 'Communication via Proxy sécurisé indétectable.', icon: Zap },
                                    { title: 'DIRECT PARTENAIRE', desc: 'Nous ne prenons aucun frais. Paiement direct transporteur.', icon: ArrowRight }
                                ].map((f, i) => (
                                    <div key={i} className="flex gap-5">
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
                                            <f.icon className="w-5 h-5 text-neon-red" />
                                        </div>
                                        <div className="pt-1">
                                            <h4 className="text-xs font-black uppercase text-white tracking-widest">{f.title}</h4>
                                            <p className="text-gray-500 text-[10px] font-bold leading-relaxed mt-2 uppercase">{f.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="pt-10 border-t border-white/5">
                            <div className="bg-gradient-to-br from-neon-red/10 to-transparent border border-neon-red/20 rounded-3xl p-8 relative overflow-hidden group">
                                <h3 className="text-white text-2xl font-display font-black italic uppercase leading-tight">FESTIVAL<br/><span className="text-neon-red">COVOITURAGE</span></h3>
                                <p className="text-gray-500 text-[10px] font-bold mt-4 uppercase tracking-widest">Partage les frais & voyage ensemble.</p>
                                <button 
                                    onClick={scrollToCovoit}
                                    className="mt-8 flex items-center gap-3 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:text-neon-red transition-all"
                                >
                                    REJOINDRE LE TRAJET <ArrowRight className="w-4 h-4 text-neon-red" />
                                </button>
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-neon-red/10 blur-3xl rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-32" ref={covoitRef}>
                <CovoitSection />
            </div>
        </div>
    );
}
