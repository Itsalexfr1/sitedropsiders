import { useState, useEffect } from 'react';
import { Plane, Bus, Calendar, MapPin, ArrowRightLeft, Navigation, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
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
        if(query.length < 2 || !isOpen || travelType !== 'flight') { setSuggestions([]); return; }
        
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
    }, [query, isOpen, travelType]);

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
                className="w-full bg-black/40 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-red/30 focus:bg-black/60 transition-all uppercase text-[10px] font-black tracking-widest placeholder:text-gray-700"
            />
            
            {isLoading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-3 h-3 border-2 border-neon-red/20 border-t-neon-red rounded-full animate-spin" />
                </div>
            )}

            <AnimatePresence>
                {isOpen && suggestions.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden z-[100] shadow-2xl"
                    >
                        {suggestions.map(s => (
                            <div 
                                key={s.id || s.iata_code} 
                                onClick={() => {
                                    setQuery(s.name);
                                    onChange(s.iata_code || s.name);
                                    setIsOpen(false);
                                }}
                                className="px-4 py-3 hover:bg-white/5 cursor-pointer flex justify-between items-center transition-all"
                            >
                                <div className="flex flex-col">
                                    <span className="text-white text-xs font-bold truncate">{s.name}</span>
                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                                        {s.city_name || s.city?.name || s.country_name}
                                    </span>
                                </div>
                                {s.iata_code && (
                                    <span className="text-neon-red text-[10px] font-black px-2 py-0.5 bg-neon-red/5 rounded-md border border-neon-red/10">
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

                if (!response.ok) throw new Error("Search failed");
                const data = await response.json();
                const mappedResults = (data.data.offers || [])
                    .sort((a: any, b: any) => parseFloat(a.total_amount) - parseFloat(b.total_amount))
                    .slice(0, 8)
                    .map((offer: any) => ({
                        id: offer.id,
                        company: offer.owner.name,
                        price: offer.total_amount,
                        currency: offer.total_currency,
                        duration: offer.slices[0].duration.replace('PT', '').replace('H', 'h').replace('M', '').toLowerCase(),
                        departureTime: new Date(offer.slices[0].segments[0].departing_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
                        arrivalTime: new Date(offer.slices[0].segments[0].arriving_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
                    }));

                setResults(mappedResults);
            } catch (error) {
                console.error(error);
            } finally {
                setIsSearching(false);
            }
            return;
        }

        // External redirects
        let finalUrl = '';
        if (travelType === 'flight') {
            switch(flightProvider) {
                case 'google': 
                    finalUrl = `https://www.google.com/travel/flights?q=flights+to+${upperDest}+from+${upperDep}+on+${date}${isRoundTrip ? '+through+'+returnDate : ''}`; 
                    break;
                case 'skyscanner': 
                    finalUrl = `https://www.skyscanner.fr/transport/vols/${upperDep}/${upperDest}/${yy}${mm}${dd}/` + (isRoundTrip ? `${ryy}${rmm}${rdd}/` : ''); 
                    break;
                case 'liligo': 
                    finalUrl = `https://www.liligo.fr/recherche-vol?departureCode=${upperDep}&destinationCode=${upperDest}&departureDate=${date}${isRoundTrip ? '&returnDate='+returnDate : ''}`; 
                    break;
                case 'kayak': 
                default: 
                    finalUrl = `https://www.kayak.fr/flights/${upperDep}-${upperDest}/${date}${isRoundTrip ? '/'+returnDate : ''}`; 
                    break;
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
        <div className="min-h-screen bg-[#050505] pb-20">
            <SEO title="Voyage | Dropsiders" description="Comparez et réservez votre voyage pour les meilleurs festivals." />
            
            <div className="max-w-7xl mx-auto px-6 pt-12">
                <div className="mb-12">
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl md:text-6xl font-display font-black text-white italic uppercase tracking-tighter"
                    >
                        VOYAGE <span className="text-neon-red drop-shadow-[0_0_10px_rgba(255,18,65,0.3)]">PLANNER</span>
                    </motion.h1>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Find the best route to your next drop</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-6 md:p-8">
                            <div className="flex gap-4 mb-8">
                                {[
                                    { id: 'flight', icon: Plane, label: 'Vols' },
                                    { id: 'bus', icon: Bus, label: 'Bus / Train' }
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => { setTravelType(t.id as any); setResults([]); }}
                                        className={`flex items-center gap-3 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                                            travelType === t.id ? 'bg-white text-black' : 'bg-white/5 text-gray-500 hover:text-white'
                                        }`}
                                    >
                                        <t.icon className="w-4 h-4" /> {t.label}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleSearch} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                                    <CitySearchInput placeholder="FROM" icon={Navigation} value={departure} onChange={setDeparture} travelType={travelType} />
                                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                                        <button 
                                            type="button"
                                            onClick={() => { setDeparture(destination); setDestination(departure); }}
                                            className="p-2 bg-black border border-white/10 rounded-full text-gray-500 hover:text-neon-red transition-all"
                                        >
                                            <ArrowRightLeft className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <CitySearchInput placeholder="TO" icon={MapPin} value={destination} onChange={setDestination} travelType={travelType} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <span className="text-[8px] font-black uppercase text-gray-600 tracking-widest ml-2">Departure Date</span>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                                            <input 
                                                type="date" 
                                                required
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="w-full bg-black/40 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-red/30 transition-all font-black text-xs [color-scheme:dark]"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[8px] font-black uppercase text-gray-600 tracking-widest ml-2">Return Date (Optional)</span>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                                            <input 
                                                type="date" 
                                                value={returnDate}
                                                onChange={(e) => { setReturnDate(e.target.value); setIsRoundTrip(!!e.target.value); }}
                                                className="w-full bg-black/40 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-red/30 transition-all font-black text-xs [color-scheme:dark]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSearching}
                                    className="w-full bg-neon-red text-white py-5 rounded-xl font-black uppercase text-xs tracking-[0.2em] hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isSearching ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>SEARCH NOW <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </form>
                        </div>

                        <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-6">
                            <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em] mb-4">Preferred Partners</h3>
                            <div className="flex flex-wrap gap-2">
                                {(travelType === 'flight' ? ['direct', 'google', 'skyscanner', 'kayak', 'liligo'] : ['omio', 'busbud', 'flixbus', 'blablacar']).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => { travelType === 'flight' ? setFlightProvider(p) : setBusProvider(p); setResults([]); }}
                                        className={`px-5 py-2.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${
                                            (travelType === 'flight' ? flightProvider : busProvider) === p ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-gray-600 hover:text-gray-400'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <AnimatePresence>
                            {results.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                >
                                    {results.map((r) => (
                                        <div key={r.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 hover:bg-white/[0.04] transition-all">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                                                    <Plane className="w-6 h-6 text-neon-red" />
                                                </div>
                                                <div>
                                                    <h4 className="text-white text-sm font-black uppercase italic">{r.company}</h4>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <span className="text-gray-400 text-xs font-bold">{r.departureTime} - {r.arrivalTime}</span>
                                                        <span className="text-neon-red text-[9px] font-black uppercase">{r.duration}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <div className="text-2xl font-display font-black text-white">{r.price} €</div>
                                                    <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest">TTC / Pers</div>
                                                </div>
                                                <button className="bg-white text-black px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-neon-red hover:text-white transition-all">
                                                    Select
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-6">
                            <h3 className="text-white text-lg font-display font-black italic uppercase italic mb-6">Security & IA</h3>
                            <div className="space-y-6">
                                {[
                                    { title: 'Best Price IA', desc: 'Notre algo compare 400+ compagnies.', icon: ShieldCheck },
                                    { title: 'Anti-Block', desc: 'Interface compatible avec les navigateurs sécurisés.', icon: Zap }
                                ].map((f, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                                            <f.icon className="w-5 h-5 text-neon-red" />
                                        </div>
                                        <div>
                                            <h4 className="text-white text-xs font-black uppercase">{f.title}</h4>
                                            <p className="text-gray-500 text-[10px] font-bold leading-relaxed mt-1">{f.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-neon-red/20 to-black border border-neon-red/20 rounded-3xl p-8 relative overflow-hidden group">
                            <div className="relative z-10">
                                <h3 className="text-white text-2xl font-display font-black italic uppercase leading-tight">FESTIVAL<br/><span className="text-neon-red">CARPOOL</span></h3>
                                <p className="text-gray-400 text-xs font-bold mt-4 leading-relaxed">Splits costs and meet your future festival squad.</p>
                                <button className="mt-8 flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                                    Join the ride <ArrowRight className="w-4 h-4 text-neon-red" />
                                </button>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-neon-red/20 blur-3xl rounded-full" />
                        </div>
                    </div>
                </div>

                <div className="mt-20">
                    <CovoitSection />
                </div>
            </div>
        </div>
    );
}
