import { useState, useEffect, useRef } from 'react';
import { Plane, Bus, Calendar, MapPin, ArrowRightLeft } from 'lucide-react';
import { CovoitSection } from '../components/community/CovoitSection';
import { SEO } from '../components/utils/SEO';

const CitySearchInput = ({ placeholder, icon: Icon, value, onChange, travelType }: any) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if(value && query === '') setQuery(value);
    }, [value, query]);

    useEffect(() => {
        if(query.length < 2 || !isOpen) { setSuggestions([]); return; }
        if(travelType !== 'flight') {
            onChange(query);
            return;
        }

        const apiKey = import.meta.env.VITE_DUFFEL_API_KEY;
        if(!apiKey) return;

        const fetchSuggestions = async () => {
            try {
                const res = await fetch(`https://api.duffel.com/places/suggestions?query=${query}`, {
                    headers: { 'Authorization': `Bearer ${apiKey}`, 'Duffel-Version': 'v1' }
                });
                const data = await res.json();
                setSuggestions((data.data || []).slice(0, 5));
            } catch(e) { }
        };
        const tid = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(tid);
    }, [query, isOpen, travelType]);

    return (
        <div className="relative w-full">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Icon className="w-4 h-4 text-neon-cyan" />
            </div>
            <input 
                type="text" 
                required
                value={query}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                onChange={(e) => {
                    setQuery(e.target.value);
                    if(travelType !== 'flight') onChange(e.target.value);
                }}
                placeholder={placeholder}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-cyan transition-all uppercase text-xs font-bold"
            />
            {isOpen && suggestions.length > 0 && travelType === 'flight' && (
                <div className="absolute top-full left-0 w-full mt-2 bg-[#1a1a1a] border border-neon-cyan/30 rounded-xl overflow-hidden z-50 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
                    {suggestions.map(s => (
                        <div 
                            key={s.id} 
                            onClick={() => {
                                setQuery(s.name);
                                onChange(s.iata_code);
                                setIsOpen(false);
                            }}
                            className="px-4 py-3 hover:bg-neon-cyan/20 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0 transition-all"
                        >
                            <span className="text-white text-sm font-bold truncate pr-4">{s.name} <span className="opacity-50">{s.type === 'airport' ? '✈️' : '🏙️'}</span></span>
                            <span className="text-neon-cyan text-xs font-black shrink-0 px-2 py-1 bg-neon-cyan/10 rounded-md">{s.iata_code}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export function Voyage() {
    const [travelType, setTravelType] = useState<'flight' | 'bus'>('flight');
    const [isRoundTrip, setIsRoundTrip] = useState(false);
    
    // Inputs
    const [departure, setDeparture] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    
    // Providers
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
        
        if (travelType === 'flight') {
            if (flightProvider === 'direct') {
                const apiKey = import.meta.env.VITE_DUFFEL_API_KEY;
                if (!apiKey) {
                    alert("Clé API Duffel non configurée sur ce domaine.");
                    setIsSearching(false);
                    return;
                }

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

                    const response = await fetch('https://api.duffel.com/air/offer_requests', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Duffel-Version': 'v1',
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
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
                         throw new Error(errorInfo.errors?.[0]?.message || "Erreur Duffel");
                    }

                    const data = await response.json();
                    const mappedResults = (data.data.offers || [])
                        .sort((a: any, b: any) => parseFloat(a.total_amount) - parseFloat(b.total_amount))
                        .slice(0, 8)
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
                    alert(`Oups ! Impossible de trouver des vols. Vérifiez que la ville de départ et d'arrivée sont bien issues des suggestions automatiques. \nDétail: ${error.message}`);
                } finally {
                    setIsSearching(false);
                }
                
                return;
            }

            // Redirect logic (Kayak, Google etc)
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
                case 'mytrip':
                    flightUrl = `https://fr.mytrip.com/rf/result?from=${upperDep}&to=${upperDest}&date=${date}` + (isRoundTrip && returnDate ? `&returnDate=${returnDate}` : '');
                    break;
                case 'govoyages':
                    flightUrl = `https://www.govoyages.com/vols/${upperDep}/${upperDest}/`;
                    break;
                case 'expedia':
                    flightUrl = `https://www.expedia.fr/Flights-Search?leg1=from:${upperDep},to:${upperDest},departure:${date}&mode=search`;
                    break;
                case 'kayak':
                default:
                    flightUrl = `https://www.kayak.fr/flights/${upperDep}-${upperDest}/${date}` + (isRoundTrip && returnDate ? `/${returnDate}` : '') + `?sort=price_a`;
                    break;
            }
            window.open(flightUrl, '_blank');
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
        <div className="min-h-screen bg-dark-bg pt-24 pb-20">
            <SEO title="Voyage - Comparateur IA | Dropsiders" description="Réservez votre voyage au meilleur prix avec le comparateur intelligent." />
            
            <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-16">
                
                {/* Header */}
                <div className="text-center space-y-6">
                    <h1 className="text-4xl md:text-6xl font-display font-black text-white italic uppercase tracking-tighter">
                        RECHERCHE DE <span className="text-neon-cyan">VOYAGE</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto uppercase tracking-widest text-[10px] font-bold">
                        Plus besoin de chercher ailleurs. Le monde entier dans une seule barre de recherche.
                    </p>
                </div>

                {/* Formulaire Principal (Le Dashboard de Recherche) */}
                <div className="bg-[#0a0a0a] border border-white/5 shadow-2xl rounded-[40px] px-6 py-8 md:p-12 relative overflow-visible">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-neon-cyan/5 blur-[150px] rounded-full" />
                    
                    {/* Types de transport et Aller/Retour */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 relative z-10">
                        {/* Avion ou Bus */}
                        <div className="flex bg-black/40 p-2 rounded-full border border-white/10 w-full md:w-auto">
                            <button 
                                type="button"
                                onClick={() => { setTravelType('flight'); setResults([]); }}
                                className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-full font-black uppercase text-[11px] tracking-widest transition-all ${
                                    travelType === 'flight' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-gray-500 hover:text-white'
                                }`}
                            >
                                <Plane className="w-5 h-5" /> Avion
                            </button>
                            <button 
                                type="button"
                                onClick={() => { setTravelType('bus'); setResults([]); }}
                                className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-full font-black uppercase text-[11px] tracking-widest transition-all ${
                                    travelType === 'bus' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-gray-500 hover:text-white'
                                }`}
                            >
                                <Bus className="w-5 h-5" /> Bus
                            </button>
                        </div>

                        {/* Aller Simple / Aller-Retour */}
                        <div className="flex items-center gap-4 bg-black/40 px-6 py-4 rounded-full border border-white/10">
                            <button
                                type="button"
                                onClick={() => setIsRoundTrip(false)}
                                className={`font-bold uppercase text-[10px] tracking-widest transition-all ${!isRoundTrip ? 'text-neon-cyan' : 'text-gray-500 hover:text-white'}`}
                            >
                                Aller Simple
                            </button>
                            <div className="w-px h-4 bg-white/20"></div>
                            <button
                                type="button"
                                onClick={() => setIsRoundTrip(true)}
                                className={`font-bold uppercase text-[10px] tracking-widest transition-all ${isRoundTrip ? 'text-neon-red' : 'text-gray-500 hover:text-white'}`}
                            >
                                Aller & Retour
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="relative z-10 w-full">
                        {/* Ligne : Villes et Dates */}
                        <div className="flex flex-col md:flex-row gap-4 w-full">
                            
                            {/* Section: Villes */}
                            <div className="flex flex-col md:flex-row gap-2 bg-black/30 border border-white/10 p-2 rounded-3xl flex-[2]">
                                <CitySearchInput 
                                    placeholder="VILLE DE DÉPART" 
                                    icon={MapPin} 
                                    value={departure}
                                    onChange={setDeparture}
                                    travelType={travelType}
                                />
                                <div className="hidden md:flex items-center justify-center px-2">
                                    <ArrowRightLeft className="w-4 h-4 text-white/30" />
                                </div>
                                <div className="md:hidden flex justify-center w-full py-1">
                                    <ArrowRightLeft className="w-4 h-4 text-white/30 rotate-90" />
                                </div>
                                <CitySearchInput 
                                    placeholder="FESTIVAL / DESTINATION" 
                                    icon={MapPin} 
                                    value={destination}
                                    onChange={setDestination}
                                    travelType={travelType}
                                />
                            </div>

                            {/* Section: Dates */}
                            <div className="flex flex-col md:flex-row gap-2 bg-black/30 border border-white/10 p-2 rounded-3xl flex-1">
                                <div className="relative w-full">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <input 
                                        type="date" 
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-cyan transition-all text-xs font-bold [color-scheme:dark]"
                                    />
                                    <span className="absolute -top-2 left-6 bg-[#0a0a0a] px-2 text-[8px] font-black uppercase text-gray-500 tracking-widest">
                                        Aller
                                    </span>
                                </div>
                                {isRoundTrip && (
                                    <div className="relative w-full">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                            <Calendar className="w-4 h-4 text-neon-red" />
                                        </div>
                                        <input 
                                            type="date" 
                                            required={isRoundTrip}
                                            value={returnDate}
                                            onChange={(e) => setReturnDate(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-red transition-all text-xs font-bold [color-scheme:dark]"
                                        />
                                        <span className="absolute -top-2 left-6 bg-[#0a0a0a] px-2 text-[8px] font-black uppercase text-neon-red tracking-widest">
                                            Retour
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Bouton de Soumission collé à droite (sur desktop) */}
                            <div className="flex md:w-32">
                                <button
                                    type="submit"
                                    disabled={isSearching}
                                    className="w-full h-full min-h-[60px] bg-white text-black rounded-3xl flex items-center justify-center hover:bg-neon-cyan hover:shadow-[0_0_30px_rgba(0,255,255,0.3)] transition-all group disabled:opacity-50"
                                >
                                    {isSearching ? (
                                        <span className="animate-spin text-2xl">⚡</span>
                                    ) : (
                                        <Search className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Sélecteur de Comparateur Rapide */}
                        <div className="mt-8 pt-6">
                            <div className="flex items-center justify-center gap-4 mb-4">
                                <div className="h-px bg-white/10 flex-1"></div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Moteurs de recherche</span>
                                <div className="h-px bg-white/10 flex-1"></div>
                            </div>
                            
                            {travelType === 'flight' ? (
                                <div className="flex flex-wrap justify-center gap-2">
                                    {['direct', 'kayak', 'skyscanner', 'google', 'liligo', 'mytrip', 'govoyages', 'expedia'].map((provider) => (
                                        <button
                                            key={provider}
                                            type="button"
                                            onClick={() => { setFlightProvider(provider); setResults([]); }}
                                            className={`px-5 py-2.5 rounded-xl border text-[10px] tracking-widest font-black transition-all capitalize ${
                                                flightProvider === provider 
                                                ? 'bg-neon-cyan shadow-[0_0_20px_rgba(0,255,255,0.2)] border-neon-cyan text-black' 
                                                : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            {provider === 'google' ? 'Google Flights' : provider === 'govoyages' ? 'Go Voyages' : provider === 'direct' ? 'Vente Directe' : provider}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-wrap justify-center gap-2">
                                    {['omio', 'busbud', 'flixbus', 'blablacar'].map((provider) => (
                                        <button
                                            key={provider}
                                            type="button"
                                            onClick={() => setBusProvider(provider)}
                                            className={`px-5 py-2.5 rounded-xl border text-[10px] tracking-widest font-black transition-all capitalize ${
                                                busProvider === provider 
                                                ? 'bg-neon-red shadow-[0_0_20px_rgba(255,0,51,0.2)] border-neon-red text-white' 
                                                : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            {provider === 'blablacar' ? 'BlaBlaCar Bus' : provider}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Zone de Résultats Direct (API Duffel) */}
                {results.length > 0 && flightProvider === 'direct' && (
                    <div className="space-y-6 relative z-10 w-full animate-fade-in">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-white font-black uppercase tracking-widest text-xl">
                                Nos Meilleurs Billets <span className="text-neon-cyan ml-2 bg-neon-cyan/10 px-4 py-1 rounded-full text-xs align-middle">Live</span>
                            </h3>
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest hidden md:block">
                                Triés par prix
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {results.map((result) => (
                                <div 
                                    key={result.id} 
                                    className="flex flex-col md:flex-row items-center justify-between p-6 bg-[#0a0a0a] border border-white/10 rounded-3xl hover:border-neon-cyan/50 hover:shadow-[0_0_40px_rgba(0,255,255,0.1)] transition-all gap-8 group cursor-pointer"
                                    onClick={() => window.alert('Interface de réservation à configurer.')}
                                >
                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/5 shadow-inner flex items-center justify-center shrink-0 group-hover:bg-neon-cyan/10 group-hover:border-neon-cyan/30 transition-all">
                                            <Plane className="w-6 h-6 text-neon-cyan" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-black text-white uppercase tracking-widest block mb-2">{result.company}</span>
                                            <div className="flex items-center gap-3 text-gray-300 font-bold text-lg">
                                                <span>{result.departureTime}</span>
                                                <div className="flex flex-col items-center px-4">
                                                    <span className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">{result.duration}</span>
                                                    <div className="h-px bg-white/20 w-16 relative">
                                                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1.5 h-1.5 bg-neon-cyan rounded-full"></div>
                                                        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1.5 h-1.5 border border-white/40 rounded-full"></div>
                                                    </div>
                                                </div>
                                                <span>{result.arrivalTime}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-auto border-t md:border-t-0 border-white/5 pt-6 md:pt-0 flex flex-row items-center justify-between md:flex-col md:items-end gap-2">
                                        <div className="flex flex-col text-left md:text-right">
                                            <span className="text-3xl font-display font-black text-white">{result.price} €</span>
                                            {result.isRoundTrip && (
                                                <span className="text-[10px] text-neon-red font-bold uppercase tracking-widest">Aller-Retour Inclus</span>
                                            )}
                                        </div>
                                        <button className="px-8 py-4 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-neon-cyan hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all">
                                            Sélectionner
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Loader si besoin */}
                {isSearching && results.length === 0 && flightProvider === 'direct' && (
                    <div className="h-64 flex flex-col items-center justify-center gap-6">
                        <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-neon-cyan font-black uppercase tracking-widest text-xs animate-pulse">Recherche auprès de 400 compagnies...</span>
                    </div>
                )}

                <div className="border-t border-white/5 my-12" />

                {/* Section Covoiturage */}
                <div>
                     <div className="text-center space-y-4 mb-10">
                        <h2 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter">
                            <span className="text-neon-red">COVOITURAGES</span> DU FESTIVAL
                        </h2>
                        <p className="text-gray-400 max-w-xl mx-auto uppercase tracking-widest text-[10px] font-bold">
                            Rencontrez d'autres passionnés et partagez les frais de route.
                        </p>
                    </div>
                    
                    <CovoitSection />
                </div>
            </div>
        </div>
    );
}
