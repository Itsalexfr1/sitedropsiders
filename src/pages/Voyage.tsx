import { useState } from 'react';
import { Plane, Bus, Calendar, MapPin } from 'lucide-react';
import { CovoitSection } from '../components/community/CovoitSection';
import { SEO } from '../components/utils/SEO';

export function Voyage() {
    const [travelType, setTravelType] = useState<'flight' | 'bus'>('flight');
    const [departure, setDeparture] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');
    const [flightProvider, setFlightProvider] = useState('direct');
    const [busProvider, setBusProvider] = useState('omio');

    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearching(true);
        setResults([]);
        
        // 1. Formatage des villes et dates
        const upperDep = departure.toUpperCase();
        const upperDest = destination.toUpperCase();
        
        const searchDate = date ? new Date(date) : new Date();
        const yy = searchDate.getFullYear().toString().slice(-2);
        const mm = (searchDate.getMonth() + 1).toString().padStart(2, '0');
        const dd = searchDate.getDate().toString().padStart(2, '0');
        
        if (travelType === 'flight') {
            
            if (flightProvider === 'direct') {
                // Utilisation de l'API Duffel pour afficher les prix directement sur Dropsiders
                const apiKey = import.meta.env.VITE_DUFFEL_API_KEY;
                
                if (!apiKey) {
                    alert("Clé API Duffel non configurée. (Veuillez l'ajouter dans votre fichier .env: VITE_DUFFEL_API_KEY=duffel_test_...)");
                    setIsSearching(false);
                    return;
                }

                try {
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
                                slices: [
                                    {
                                        origin: upperDep,
                                        destination: upperDest,
                                        departure_date: date
                                    }
                                ],
                                passengers: [{ type: "adult" }]
                            }
                        })
                    });

                    if (!response.ok) {
                         const errorInfo = await response.json();
                         console.error("Duffel Error:", errorInfo);
                         throw new Error(errorInfo.errors?.[0]?.message || "Erreur Duffel");
                    }

                    const data = await response.json();
                    
                    const mappedResults = (data.data.offers || [])
                        .sort((a: any, b: any) => parseFloat(a.total_amount) - parseFloat(b.total_amount))
                        .slice(0, 5) // Garder les 5 meilleurs
                        .map((offer: any) => {
                            const slice = offer.slices[0];
                            const segment = slice.segments[0];
                            
                            const depTime = new Date(segment.departing_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
                            const arrTime = new Date(segment.arriving_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
                            
                            return {
                                id: offer.id,
                                company: offer.owner.name,
                                price: offer.total_amount,
                                currency: offer.total_currency,
                                duration: slice.duration.replace('PT', '').replace('H', 'h').replace('M', '').toLowerCase(),
                                departureTime: depTime,
                                arrivalTime: arrTime,
                                bookingLink: '#' // On laisse à # pour cette démo (normalement redirige vers checkout complet)
                            };
                    });

                    setResults(mappedResults);
                } catch (error: any) {
                    console.error(error);
                    alert(`Erreur de recherche. Les codes AITA (CDG) et la date (Future) sont-ils corrects ? \nDétail: ${error.message}`);
                } finally {
                    setIsSearching(false);
                }
                
                return; // On arrête là pour le flux Direct
            }

            // Pour les autres comparateurs (redirections)
            let flightUrl = '';
            
            switch(flightProvider) {
                case 'google':
                    flightUrl = `https://www.google.com/travel/flights?q=flights+to+${upperDest}+from+${upperDep}+on+${date}`;
                    break;
                case 'skyscanner':
                    flightUrl = `https://www.skyscanner.fr/transport/vols/${upperDep}/${upperDest}/${yy}${mm}${dd}/`;
                    break;
                case 'liligo':
                    flightUrl = `https://www.liligo.fr/recherche-vol?departureCode=${upperDep}&destinationCode=${upperDest}&departureDate=${date}`;
                    break;
                case 'mytrip':
                    flightUrl = `https://fr.mytrip.com/rf/result?from=${upperDep}&to=${upperDest}&date=${date}`;
                    break;
                case 'govoyages':
                    flightUrl = `https://www.govoyages.com/vols/${upperDep}/${upperDest}/`;
                    break;
                case 'expedia':
                    flightUrl = `https://www.expedia.fr/Flights-Search?leg1=from:${upperDep},to:${upperDest},departure:${date}&mode=search`;
                    break;
                case 'kayak':
                default:
                    flightUrl = `https://www.kayak.fr/flights/${upperDep}-${upperDest}/${date}?sort=price_a`;
                    break;
            }
            window.open(flightUrl, '_blank');
        } else {
            let busUrl = '';
            switch(busProvider) {
                case 'busbud':
                    busUrl = `https://www.busbud.com/fr/search/${upperDep}/${upperDest}/${date}`;
                    break;
                case 'flixbus':
                    busUrl = `https://shop.flixbus.fr/search?departureCity=${upperDep}&arrivalCity=${upperDest}&rideDate=${date}`;
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
            <SEO title="Voyage - Comparateur & Covoiturage | Dropsiders" description="Organisez votre voyage pour le prochain festival. Comparateur de bus, avions, et section covoiturage." />
            
            <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-16">
                
                {/* Header */}
                <div className="text-center space-y-6">
                    <h1 className="text-4xl md:text-6xl font-display font-black text-white italic uppercase tracking-tighter">
                        ORGANISE TON <span className="text-neon-cyan">VOYAGE</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto uppercase tracking-widest text-[10px] font-bold">
                        Trouve le meilleur moyen de transport pour te rendre à ton festival préféré.
                    </p>
                </div>

                {/* Comparateur Section */}
                <div className="bg-white/5 border border-white/10 rounded-[40px] p-6 md:p-12 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-neon-cyan/5 blur-[100px] rounded-full -ml-32 -mt-32" />
                    
                    <div className="flex justify-center gap-4 mb-8 relative z-10">
                        <button 
                            type="button"
                            onClick={() => { setTravelType('flight'); }}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest transition-all ${
                                travelType === 'flight' ? 'bg-white text-black' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                            }`}
                        >
                            <Plane className="w-4 h-4" /> AVION
                        </button>
                        <button 
                            type="button"
                            onClick={() => { setTravelType('bus'); }}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest transition-all ${
                                travelType === 'bus' ? 'bg-white text-black' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                            }`}
                        >
                            <Bus className="w-4 h-4" /> BUS
                        </button>
                    </div>

                    <form onSubmit={handleSearch} className="relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="md:col-span-2 relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <MapPin className="w-4 h-4 text-neon-cyan" />
                                </div>
                                <input 
                                    type="text" 
                                    required
                                    value={departure}
                                    onChange={(e) => setDeparture(e.target.value)}
                                    placeholder={travelType === 'flight' ? "Départ (Ex: PAR ou Paris)" : "Ville de départ"}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-cyan transition-all uppercase text-xs font-bold"
                                />
                            </div>
                            
                            <div className="md:col-span-2 relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <MapPin className="w-4 h-4 text-neon-red" />
                                </div>
                                <input 
                                    type="text" 
                                    required
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                    placeholder={travelType === 'flight' ? "Destination (Ex: LON ou Londres)" : "Ville d'arrivée"}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-cyan transition-all uppercase text-xs font-bold"
                                />
                            </div>

                            <div className="md:col-span-1 relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                </div>
                                <input 
                                    type="date" 
                                    required
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-cyan transition-all uppercase text-xs font-bold [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        {/* Sélecteur de Comparateur */}
                        <div className="mt-8 border-t border-white/10 pt-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 block text-center">
                                Comparer les prix avec :
                            </span>
                            
                            {travelType === 'flight' ? (
                                <div className="flex flex-wrap justify-center gap-3">
                                    {['direct', 'kayak', 'skyscanner', 'google', 'liligo', 'mytrip', 'govoyages', 'expedia'].map((provider) => (
                                        <button
                                            key={provider}
                                            type="button"
                                            onClick={() => { setFlightProvider(provider); setResults([]); }}
                                            className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all capitalize ${
                                                flightProvider === provider 
                                                ? 'bg-neon-cyan/10 border-neon-cyan text-neon-cyan shadow-[0_0_15px_rgba(0,255,255,0.2)]' 
                                                : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                                            }`}
                                        >
                                            {provider === 'google' ? 'Google Flights' : provider === 'govoyages' ? 'Go Voyages' : provider === 'direct' ? 'Direct (Dropsiders)' : provider}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-wrap justify-center gap-3">
                                    {['omio', 'busbud', 'flixbus', 'blablacar'].map((provider) => (
                                        <button
                                            key={provider}
                                            type="button"
                                            onClick={() => setBusProvider(provider)}
                                            className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all capitalize ${
                                                busProvider === provider 
                                                ? 'bg-neon-red/10 border-neon-red text-neon-red shadow-[0_0_15px_rgba(255,0,51,0.2)]' 
                                                : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                                            }`}
                                        >
                                            {provider === 'blablacar' ? 'BlaBlaCar Bus' : provider}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-8 text-center">
                                        <button
                                            type="submit"
                                            disabled={isSearching}
                                            className="w-full bg-white text-black font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                        >
                                            <span>{isSearching ? 'Recherche des vols en direct...' : 'Rechercher les meilleurs prix'}</span>
                                        </button>
                        </div>
                    </form>

                    {/* Zone de Résultats Direct (API Duffel) */}
                    {results.length > 0 && flightProvider === 'direct' && (
                        <div className="mt-12 space-y-4 relative z-10">
                            <h3 className="text-white font-black uppercase tracking-widest text-xs mb-6 text-center">Nos Meilleurs Billets ({results.length})</h3>
                            {results.map((result) => (
                                <div 
                                    key={result.id} 
                                    className="flex flex-col md:flex-row items-center justify-between p-6 bg-black/40 border border-white/10 rounded-2xl hover:border-neon-cyan/50 hover:shadow-[0_0_20px_rgba(0,255,255,0.1)] transition-all gap-6"
                                >
                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 shrink-0">
                                            <Plane className="w-6 h-6 text-neon-cyan" />
                                        </div>
                                        <div>
                                            <span className="text-[12px] font-black text-white uppercase tracking-widest block mb-1">{result.company}</span>
                                            <div className="flex items-center gap-3 text-gray-400 font-bold text-sm">
                                                <span>{result.departureTime} ({departure.toUpperCase()})</span>
                                                <span className="text-neon-cyan text-xs">→</span>
                                                <span>{result.arrivalTime} ({destination.toUpperCase()})</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center md:text-right shrink-0 flex flex-row md:flex-col items-center gap-4 md:items-end w-full md:w-auto justify-between border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
                                        <div>
                                            <span className="text-2xl font-black text-white">{result.price} €</span>
                                            <span className="block text-[9px] text-gray-500 font-bold uppercase tracking-widest">Durée: {result.duration}</span>
                                        </div>
                                        <button 
                                            className="px-6 py-3 bg-neon-cyan text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all text-center inline-block"
                                        >
                                            ACHETER LE BILLET
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t border-white/10 my-12" />

                {/* Section Covoiturage */}
                <div>
                     <div className="text-center space-y-4 mb-10">
                        <h2 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter">
                            <span className="text-neon-red">COVOITURAGES</span> DE LA COMMUNAUTÉ
                        </h2>
                        <p className="text-gray-400 max-w-xl mx-auto uppercase tracking-widest text-[10px] font-bold">
                            Pas de bus ni d'avion ? Trouve un covoiturage proposé par d'autres festivaliers !
                        </p>
                    </div>
                    
                    <CovoitSection />
                </div>
            </div>
        </div>
    );
}
