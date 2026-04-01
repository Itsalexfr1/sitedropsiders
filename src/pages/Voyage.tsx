import { useState, useEffect } from 'react';
import { Plane, Bus, Calendar, MapPin, ArrowRightLeft, Search, Sparkles, Navigation, Globe, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CovoitSection } from '../components/community/CovoitSection';
import { SEO } from '../components/utils/SEO';

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
        
        if(travelType === 'flight') {
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
        } else {
            onChange(query);
            setSuggestions([]);
        }
    }, [query, isOpen, travelType]);

    return (
        <div className="relative w-full group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10 group-focus-within:scale-110 transition-transform">
                <Icon className="w-5 h-5 text-neon-cyan/60 group-focus-within:text-neon-cyan transition-colors" />
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
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all uppercase text-[10px] font-black tracking-widest placeholder:text-gray-600"
            />
            
            {isLoading && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin" />
                </div>
            )}

            <AnimatePresence>
                {isOpen && suggestions.length > 0 && travelType === 'flight' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 w-full mt-3 bg-[#111] border border-white/10 rounded-2xl overflow-hidden z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-3xl"
                    >
                        {suggestions.map(s => (
                            <div 
                                key={s.id || s.iata_code} 
                                onClick={() => {
                                    setQuery(s.name);
                                    onChange(s.iata_code || s.name);
                                    setIsOpen(false);
                                }}
                                className="px-6 py-4 hover:bg-white/10 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0 transition-all active:bg-neon-cyan/20"
                            >
                                <div className="flex flex-col">
                                    <span className="text-white text-sm font-bold truncate">{s.name}</span>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                        {s.city_name || s.city?.name || s.country_name || 'Airport'}
                                    </span>
                                </div>
                                {s.iata_code && (
                                    <span className="text-neon-cyan text-xs font-black px-2 py-1 bg-neon-cyan/10 rounded-lg border border-neon-cyan/20">
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
    const [results, setResults] = useState<any[]>([]);

    const accentColor = travelType === 'flight' ? 'neon-cyan' : 'neon-red';
    const accentHex = travelType === 'flight' ? '#00ffff' : '#ff0033';

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearching(true);
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
        
        if (travelType === 'flight') {
            if (flightProvider === 'direct') {
                try {
                    const slices = [
                        {
                            origin: upperDep,
                            destination: upperDest,
                            departure_date: date
                        }
                    ];
                    if (isRoundTrip && returnDate) {
                        slices.push({
                            origin: upperDest,
                            destination: upperDep,
                            departure_date: returnDate
                        });
                    }

                    // USAGE DU PROXY WORKER POUR ÉVITER ADBLOCK/CORS
                    const response = await fetch('/api/voyage/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            data: {
                                slices: slices,
                                passengers: [{ type: "adult" }],
                                return_offers: true
                            }
                        })
                    });

                    if (!response.ok) {
                         const errorInfo = await response.json();
                         throw new Error(errorInfo.errors?.[0]?.message || "Search failed");
                    }

                    const data = await response.json();
                    const mappedResults = (data.data.offers || [])
                        .sort((a: any, b: any) => parseFloat(a.total_amount) - parseFloat(b.total_amount))
                        .slice(0, 10)
                        .map((offer: any) => {
                            const outboundSlice = offer.slices[0];
                            const outboundSegment = outboundSlice.segments[0];
                            const depTime = new Date(outboundSegment.departing_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
                            const arrTime = new Date(outboundSegment.arriving_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
                            
                            return {
                                id: offer.id,
                                company: offer.owner.name,
                                price: offer.total_amount,
                                currency: offer.total_currency,
                                isRoundTrip: offer.slices.length > 1,
                                duration: outboundSlice.duration.replace('PT', '').replace('H', 'h').replace('M', '').toLowerCase(),
                                departureTime: depTime,
                                arrivalTime: arrTime,
                                bookingLink: '#'
                            };
                    });

                    setResults(mappedResults);
                } catch (error: any) {
                    console.error(error);
                    alert(`Direct search bypass error. Please try alternative search engines below.`);
                } finally {
                    setIsSearching(false);
                }
                
                return;
            }

            // Redirect logic
            let flightUrl = '';
            switch(flightProvider) {
                case 'google':
                    flightUrl = `https://www.google.com/travel/flights?q=flights+to+${upperDest}+from+${upperDep}+on+${date}` + (isRoundTrip && returnDate ? `+through+${returnDate}` : '');
                    break;
                case 'skyscanner':
                    flightUrl = `https://www.skyscanner.fr/transport/vols/${upperDep}/${upperDest}/${yy}${mm}${dd}/` + (isRoundTrip && returnDate ? `${ryy}${rmm}${rdd}/` : '');
                    break;
                case 'liligo':
                    flightUrl = `https://www.liligo.fr/recherche-vol?departureCode=${upperDep}&destinationCode=${upperDest}&departureDate=${date}` + (isRoundTrip && returnDate ? `&returnDate=${returnDate}` : '');
                    break;
                case 'kayak':
                default:
                    flightUrl = `https://www.kayak.fr/flights/${upperDep}-${upperDest}/${date}` + (isRoundTrip && returnDate ? `/${returnDate}` : '') + `?sort=price_a`;
                    break;
            }
            window.open(flightUrl, '_blank');
            setIsSearching(false);
        } else {
            let busUrl = '';
            switch(busProvider) {
                case 'busbud':
                    busUrl = `https://www.busbud.com/fr/search/${upperDep}/${upperDest}/${date}` + (isRoundTrip && returnDate ? `/${returnDate}` : '');
                    break;
                case 'flixbus':
                    busUrl = `https://shop.flixbus.fr/search?departureCity=${upperDep}&arrivalCity=${upperDest}&rideDate=${date}` + (isRoundTrip && returnDate ? `&backRideDate=${returnDate}` : '');
                    break;
                case 'blablacar':
                    busUrl = `https://www.blablacar.fr/search?fn=${upperDep}&tn=${upperDest}&db=${date}`;
                    break;
                case 'omio':
                default:
                    busUrl = `https://www.omio.fr/search-frontend/results/${upperDep}/${upperDest}/bus`;
                    break;
            }
            window.open(busUrl, '_blank');
            setIsSearching(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg pb-32">
            <SEO title="Voyage - Comparateur IA | Dropsiders" description="Réservez votre voyage au meilleur prix pour vos festivals préférés." />
            
            <div className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-dark-bg z-10" />
                <motion.div 
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.4 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="absolute inset-0 z-0"
                >
                    <img 
                        src="https://images.unsplash.com/photo-1544013583-4a004c26a57e?q=80&w=2670&auto=format&fit=crop" 
                        alt="Travel" 
                        className="w-full h-full object-cover grayscale brightness-50"
                    />
                </motion.div>

                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 blur-[150px] rounded-full animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-red/10 blur-[150px] rounded-full animate-pulse-slow delay-1000" />

                <div className="relative z-20 text-center space-y-8 px-4 max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-8xl font-display font-black text-white italic uppercase tracking-tighter leading-tight drop-shadow-2xl">
                            TRAVEL <span className={`text-${accentColor} drop-shadow-[0_0_30px_rgba(0,255,255,0.3)] transition-colors duration-500`}>COMPARATOR</span>
                        </h1>
                    </motion.div>
                    
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="flex flex-wrap justify-center gap-6 md:gap-12"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-neon-cyan" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Best Prices Guaranteed</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-neon-red" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Real-time Comparison</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <Globe className="w-5 h-5 text-neon-purple" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Global Coverage</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-24 relative z-30">
                <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-black/60 backdrop-blur-3xl border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] rounded-[48px] p-8 md:p-12"
                >
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                        <div className="flex bg-white/5 p-1.5 rounded-[2rem] border border-white/5 w-full md:w-auto">
                            <button 
                                onClick={() => { setTravelType('flight'); setResults([]); }}
                                className={`flex items-center justify-center gap-3 px-8 py-4 rounded-[1.8rem] font-black uppercase text-[11px] tracking-widest transition-all duration-300 ${
                                    travelType === 'flight' ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'text-gray-500 hover:text-white'
                                }`}
                            >
                                <Plane className={`w-4 h-4 ${travelType === 'flight' ? 'animate-bounce' : ''}`} /> Flight
                            </button>
                            <button 
                                onClick={() => { setTravelType('bus'); setResults([]); }}
                                className={`flex items-center justify-center gap-3 px-8 py-4 rounded-[1.8rem] font-black uppercase text-[11px] tracking-widest transition-all duration-300 ${
                                    travelType === 'bus' ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'text-gray-500 hover:text-white'
                                }`}
                            >
                                <Bus className={`w-4 h-4 ${travelType === 'bus' ? 'animate-bounce' : ''}`} /> Bus / Train
                            </button>
                        </div>

                        <div className="flex items-center gap-2 bg-white/5 px-6 py-2 rounded-full border border-white/5">
                            <button
                                onClick={() => setIsRoundTrip(false)}
                                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${!isRoundTrip ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                One Way
                            </button>
                            <button
                                onClick={() => setIsRoundTrip(true)}
                                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isRoundTrip ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                Round Trip
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-white/5 border border-white/5 rounded-[2.5rem] relative">
                                <CitySearchInput 
                                    placeholder="DEPARTURE CITY" 
                                    icon={Navigation} 
                                    value={departure}
                                    onChange={setDeparture}
                                    travelType={travelType}
                                />
                                <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                                    <div 
                                        onClick={() => {
                                            const temp = departure;
                                            setDeparture(destination);
                                            setDestination(temp);
                                        }}
                                        className="w-10 h-10 rounded-full bg-[#111] border border-white/20 flex items-center justify-center text-gray-500 hover:text-white hover:border-white transition-all cursor-pointer hover:rotate-180"
                                    >
                                        <ArrowRightLeft className="w-4 h-4" />
                                    </div>
                                </div>
                                <CitySearchInput 
                                    placeholder="DESTINATION / FESTIVAL" 
                                    icon={MapPin} 
                                    value={destination}
                                    onChange={setDestination}
                                    travelType={travelType}
                                />
                            </div>

                            <div className={`lg:col-span-${isRoundTrip ? '5' : '4'} grid grid-cols-1 ${isRoundTrip ? 'md:grid-cols-2' : ''} gap-3 p-3 bg-white/5 border border-white/5 rounded-[2.5rem]`}>
                                <div className="relative group">
                                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-neon-cyan transition-colors z-10" />
                                    <input 
                                        type="date" 
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all font-black text-xs [color-scheme:dark]"
                                    />
                                    <span className="absolute -top-3 left-6 bg-dark-bg border border-white/10 px-3 py-1 rounded-full text-[8px] font-black uppercase text-gray-400 tracking-widest z-20">Departure</span>
                                </div>
                                {isRoundTrip && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="relative group"
                                    >
                                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-neon-red transition-colors z-10" />
                                        <input 
                                            type="date" 
                                            required={isRoundTrip}
                                            value={returnDate}
                                            onChange={(e) => setReturnDate(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:outline-none focus:border-neon-red/50 focus:bg-white/10 transition-all font-black text-xs [color-scheme:dark]"
                                        />
                                        <span className="absolute -top-3 left-6 bg-dark-bg border border-white/10 px-3 py-1 rounded-full text-[8px] font-black uppercase text-gray-400 tracking-widest z-20">Return</span>
                                    </motion.div>
                                )}
                            </div>

                            <div className={`lg:col-span-${isRoundTrip ? '1' : '2'} flex`}>
                                <button
                                    type="submit"
                                    disabled={isSearching}
                                    className="w-full bg-white text-black rounded-[2.5rem] flex items-center justify-center hover:bg-neon-cyan hover:shadow-[0_0_50px_rgba(0,255,255,0.4)] transition-all duration-500 group disabled:opacity-50 min-h-[70px]"
                                >
                                    {isSearching ? (
                                        <div className="w-8 h-8 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <div className="flex items-center gap-3 px-4">
                                            <Search className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                            {!isRoundTrip && <span className="font-black uppercase tracking-widest text-[11px] hidden xl:block">Search Now</span>}
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="pt-8">
                            <div className="flex items-center gap-6 mb-6">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 whitespace-nowrap">Preferred Source</span>
                                <div className="h-px bg-white/5 flex-1" />
                            </div>
                            
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                {(travelType === 'flight' ? ['direct', 'google', 'skyscanner', 'kayak', 'liligo'] : ['omio', 'busbud', 'flixbus', 'blablacar']).map((provider) => (
                                    <button
                                        key={provider}
                                        type="button"
                                        onClick={() => { travelType === 'flight' ? setFlightProvider(provider) : setBusProvider(provider); setResults([]); }}
                                        className={`px-8 py-3.5 rounded-2xl border text-[10px] tracking-widest font-black transition-all duration-300 uppercase ${
                                            (travelType === 'flight' ? flightProvider : busProvider) === provider 
                                            ? `bg-${accentColor} border-${accentColor} text-${travelType === 'flight' ? 'black' : 'white'} shadow-[0_0_30px_rgba(0,255,255,0.2)]` 
                                            : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20 hover:text-white'
                                        }`}
                                    >
                                        {provider === 'direct' ? '⚡ Dropsiders Direct' : provider === 'google' ? 'Google Flights' : provider}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </form>
                </motion.div>

                <AnimatePresence mode="wait">
                    {isSearching && results.length === 0 && (
                        <motion.div 
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="py-32 flex flex-col items-center justify-center gap-8"
                        >
                            <div className="relative">
                                <div className="w-24 h-24 border-2 border-white/10 rounded-full" />
                                <div className={`absolute inset-0 border-2 border-t-${accentColor} rounded-full animate-spin shadow-[0_0_30px_${accentHex}44]`} />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-display font-black text-white italic uppercase tracking-tighter">Searching Destinations</h3>
                                <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[9px] animate-pulse">Checking with over 400 global companies</p>
                            </div>
                        </motion.div>
                    )}

                    {results.length > 0 && (
                        <motion.div 
                            key="results"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-20 space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter">Top Recommendations</h3>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Found {results.length} exclusive offers (AdBlock Safe)</p>
                                </div>
                                <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                                    <Sparkles className="w-4 h-4 text-yellow-500" />
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">AI Assisted Choice</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {results.map((result, idx) => (
                                    <motion.div 
                                        key={result.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        whileHover={{ x: 10 }}
                                        className="group relative bg-white/5 border border-white/10 rounded-[32px] p-1 overflow-hidden"
                                    >
                                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex flex-col md:flex-row items-center justify-between p-6 gap-8 relative z-10">
                                            <div className="flex items-center gap-8 w-full md:w-auto">
                                                <div className="w-20 h-20 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center shrink-0 group-hover:border-neon-cyan/40 transition-all duration-500">
                                                    <div className="relative">
                                                        <Plane className="w-8 h-8 text-white group-hover:text-neon-cyan transition-colors" />
                                                        <motion.div 
                                                            animate={{ x: [0, 4, 0], y: [0, -4, 0] }}
                                                            transition={{ repeat: Infinity, duration: 3 }}
                                                            className="absolute -top-1 -right-1 w-2 h-2 bg-neon-cyan rounded-full pulse-glow"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-neon-cyan px-2 py-0.5 bg-neon-cyan/10 rounded-md border border-neon-cyan/20">LIVE PRICE</span>
                                                        <span className="text-sm font-black text-white uppercase italic tracking-tight">{result.company}</span>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-center">
                                                            <div className="text-2xl font-black text-white">{result.departureTime}</div>
                                                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-1">Depart</div>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-1 flex-1 min-w-[80px]">
                                                            <span className="text-[10px] font-black text-neon-cyan italic">{result.duration}</span>
                                                            <div className="h-[2px] w-full bg-white/10 relative rounded-full overflow-hidden">
                                                                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full group-hover:bg-neon-cyan" />
                                                            </div>
                                                            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{result.isRoundTrip ? 'Inc. Return' : 'Direct'}</span>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-2xl font-black text-white">{result.arrivalTime}</div>
                                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Arrive</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full md:w-auto flex md:flex-col items-center justify-between md:items-end gap-6 bg-white/5 md:bg-transparent p-6 md:p-0 rounded-[28px] border border-white/5 md:border-0 border-dashed">
                                                <div className="flex flex-col text-left md:text-right">
                                                    <span className="text-4xl font-display font-black text-white drop-shadow-xl">{result.price} €</span>
                                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">Tax & fees included</span>
                                                </div>
                                                <button 
                                                    className="px-10 py-5 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-neon-cyan hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] transition-all duration-300 flex items-center gap-3"
                                                >
                                                    Select Ticket <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { title: 'Best Price IA', desc: 'Our algorithm checks thousands of routes to find the most efficient way to your destination.', icon: Sparkles },
                        { title: 'Anti-Block Engine', desc: 'Secure proxy integration ensuring your travel search remains functional despite strict ad-blockers.', icon: ShieldCheck },
                        { title: 'Real-time Alerts', desc: 'Stay updated with price changes and new routes specialized for major festivals.', icon: Zap }
                    ].map((feature, i) => (
                        <div key={i} className="p-10 bg-white/5 rounded-[32px] border border-white/5 hover:border-white/10 transition-colors">
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                                <feature.icon className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-xl font-display font-black text-white uppercase italic mb-4">{feature.title}</h4>
                            <p className="text-gray-500 text-sm leading-relaxed font-bold">{feature.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-40 space-y-16">
                     <div className="text-center space-y-6">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            className="inline-block px-4 py-2 bg-neon-red/10 border border-neon-red/20 rounded-full"
                        >
                            <span className="text-[10px] font-black tracking-[0.3em] text-neon-red uppercase italic">Community Travel</span>
                        </motion.div>
                        <h2 className="text-5xl md:text-7xl font-display font-black text-white italic uppercase tracking-tighter">
                            FESTIVAL <span className="text-neon-red">CARPOOLS</span>
                        </h2>
                    </div>
                    
                    <div className="bg-[#0c0c0c] border border-white/5 rounded-[40px] p-2 md:p-4 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%220%200%20200%20200%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22noiseFilter%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.65%22%20numOctaves=%223%22%3E%3C/feTurbulence%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23noiseFilter)%22%3E%3C/rect%3E%3C/svg%3E')] opacity-[0.04] mix-blend-overlay" />
                        <CovoitSection />
                    </div>
                </div>
            </div>

            <div className={`fixed bottom-12 right-12 z-[100] transition-opacity duration-1000 ${isSearching ? 'opacity-100' : 'opacity-0'}`}>
                <div className="bg-black/80 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-neon-cyan animate-ping" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Scanning via Proxy...</span>
                </div>
            </div>
        </div>
    );
}
